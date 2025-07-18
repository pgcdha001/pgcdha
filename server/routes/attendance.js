const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Class = require('../models/Class');
const { authenticate } = require('../middleware/auth');

// Mark attendance for a class (for teachers/admin)
router.post('/mark', authenticate, async (req, res) => {
  try {
    const { classId, date, attendanceData, subject } = req.body;
    const markedBy = req.user.id;

    // Validate class exists
    const classDoc = await Class.findById(classId).populate('classIncharge floorIncharge teachers.teacherId');
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user can mark attendance for this class
    const authCheck = classDoc.canMarkAttendance(markedBy);
    if (!authCheck.canMark) {
      return res.status(403).json({ message: authCheck.reason });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Process attendance data array
    const attendancePromises = attendanceData.map(async (record) => {
      const { studentId, status, remarks } = record;

      try {
        // Update existing or create new attendance record
        const attendance = await Attendance.findOneAndUpdate(
          { studentId, date: attendanceDate },
          {
            classId,
            status,
            remarks: remarks || '',
            markedBy,
            markedByRole: authCheck.role,
            subject: authCheck.subject || subject || ''
          },
          { 
            upsert: true, 
            new: true,
            runValidators: true
          }
        );

        return attendance;
      } catch (error) {
        console.error(`Error marking attendance for student ${studentId}:`, error);
        return null;
      }
    });

    const results = await Promise.all(attendancePromises);
    const successful = results.filter(result => result !== null).length;

    res.json({
      success: true,
      message: `Attendance marked for ${successful} students by ${authCheck.role}${authCheck.subject ? ` (${authCheck.subject})` : ''}`,
      total: attendanceData.length,
      successful,
      markedByRole: authCheck.role
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
});

// Get attendance for a specific class and date
router.get('/class/:classId/:date', authenticate, async (req, res) => {
  try {
    const { classId, date } = req.params;

    // Get class info
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Get all active students in this class
    const students = await User.find({
      classId,
      prospectusStage: { $gte: 5 },
      isApproved: true,
      isActive: true
    }).select('fullName userName program').sort({ 'fullName.firstName': 1 });

    // Get attendance records for this date
    const attendanceRecords = await Attendance.getClassAttendance(classId, date);

    // Create attendance map for quick lookup
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.studentId._id.toString()] = record;
    });

    // Combine student list with attendance data
    const attendanceList = students.map(student => {
      const attendance = attendanceMap[student._id.toString()];
      return {
        studentId: student._id,
        fullName: student.fullName,
        userName: student.userName,
        program: student.program,
        status: attendance ? attendance.status : 'Absent',
        remarks: attendance ? attendance.remarks : '',
        marked: !!attendance
      };
    });

    res.json({
      success: true,
      class: {
        id: classDoc._id,
        name: classDoc.name,
        grade: classDoc.grade,
        campus: classDoc.campus,
        program: classDoc.program
      },
      date,
      attendance: attendanceList,
      summary: {
        total: attendanceList.length,
        present: attendanceList.filter(a => a.status === 'Present').length,
        absent: attendanceList.filter(a => a.status === 'Absent').length,
        late: attendanceList.filter(a => a.status === 'Late').length
      }
    });

  } catch (error) {
    console.error('Error getting class attendance:', error);
    res.status(500).json({ message: 'Error getting attendance', error: error.message });
  }
});

// Get student attendance history
router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, limit = 30 } = req.query;

    // Validate student exists
    const student = await User.findById(studentId).select('fullName userName classId program');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get attendance records
    let attendanceQuery = Attendance.getStudentAttendance(studentId, startDate, endDate);
    
    if (limit) {
      attendanceQuery = attendanceQuery.limit(parseInt(limit));
    }

    const attendanceRecords = await attendanceQuery;

    // Calculate summary statistics
    const summary = attendanceRecords.reduce((acc, record) => {
      acc.total++;
      if (record.status === 'Present') acc.present++;
      else if (record.status === 'Absent') acc.absent++;
      else if (record.status === 'Late') acc.late++;
      return acc;
    }, { total: 0, present: 0, absent: 0, late: 0 });

    summary.percentage = summary.total > 0 ? 
      Math.round(((summary.present + summary.late) / summary.total) * 100) : 0;

    res.json({
      success: true,
      student: {
        id: student._id,
        fullName: student.fullName,
        userName: student.userName,
        program: student.program
      },
      attendance: attendanceRecords,
      summary
    });

  } catch (error) {
    console.error('Error getting student attendance:', error);
    res.status(500).json({ message: 'Error getting student attendance', error: error.message });
  }
});

// Get attendance statistics for a class
router.get('/stats/class/:classId', authenticate, async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate class exists
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.date.$lte = end;
      }
    }

    // Get attendance statistics
    const stats = await Attendance.aggregate([
      {
        $match: {
          classId: classDoc._id,
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format stats
    const formattedStats = {
      Present: 0,
      Absent: 0,
      Late: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
    });

    const total = formattedStats.Present + formattedStats.Absent + formattedStats.Late;
    const percentage = total > 0 ? 
      Math.round(((formattedStats.Present + formattedStats.Late) / total) * 100) : 0;

    res.json({
      success: true,
      class: {
        id: classDoc._id,
        name: classDoc.name,
        grade: classDoc.grade,
        campus: classDoc.campus,
        program: classDoc.program
      },
      period: { startDate, endDate },
      stats: {
        ...formattedStats,
        total,
        percentage
      }
    });

  } catch (error) {
    console.error('Error getting attendance statistics:', error);
    res.status(500).json({ message: 'Error getting statistics', error: error.message });
  }
});

// Get attendance data for a class by date range
router.get('/class/:classId/range', authenticate, async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date and end date are required' 
      });
    }

    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid date format' 
      });
    }

    // Find all attendance records for the class within the date range
    const attendanceRecords = await Attendance.find({
      classId: classId,
      date: {
        $gte: start.toISOString().split('T')[0],
        $lte: end.toISOString().split('T')[0]
      }
    }).populate('studentId', 'fullName email program')
      .populate('classId', 'className floor')
      .sort({ date: 1, 'studentId.fullName.firstName': 1 });

    res.json({
      success: true,
      data: attendanceRecords,
      summary: {
        totalRecords: attendanceRecords.length,
        dateRange: { startDate, endDate },
        classId
      }
    });

  } catch (error) {
    console.error('Error getting attendance range:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting attendance data', 
      error: error.message 
    });
  }
});

module.exports = router;
