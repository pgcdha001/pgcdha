const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Class = require('../models/Class');
const { authenticate } = require('../middleware/auth');

// Mark attendance for a class (for teachers/admin)
router.post('/mark', authenticate, async (req, res) => {
  try {
    const { studentId, classId, date, status, markedBy } = req.body;

    // Validate required fields
    if (!studentId || !classId || !date || !status) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID, class ID, date, and status are required' 
      });
    }

    // Validate class exists
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ 
        success: false,
        message: 'Class not found' 
      });
    }

    // Validate student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'Student') {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Update existing or create new attendance record
    const attendance = await Attendance.findOneAndUpdate(
      { studentId, date: attendanceDate },
      {
        classId,
        status,
        markedBy: markedBy || req.user.id,
        markedByRole: 'Floor Incharge'
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: `Student marked as ${status}`,
      data: attendance
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error marking attendance', 
      error: error.message 
    });
  }
});

// Mark attendance for multiple students (bulk)
router.post('/mark-bulk', authenticate, async (req, res) => {
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

// Get attendance overview for Principal (hierarchical stats)
router.get('/overview', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, campus, floor, program, classId } = req.query;
    
    // Default to all time data if no date range provided
    const today = new Date();
    
    const queryStartDate = startDate ? new Date(startDate + 'T00:00:00.000Z') : new Date('2020-01-01'); // Far past date to include all data
    const queryEndDate = endDate ? new Date(endDate + 'T23:59:59.999Z') : today;

    // Build match criteria with proper Date objects
    const matchCriteria = {
      date: {
        $gte: queryStartDate,
        $lte: queryEndDate
      }
    };

    // Build aggregation pipeline
    const pipeline = [
      { $match: matchCriteria },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'class'
        }
      },
      { $unwind: '$class' },
      {
        $match: {
          'student.role': 'Student',
          ...(campus && campus !== 'all' ? { 'class.campus': campus } : {}),
          ...(floor && floor !== 'all' ? { 'class.grade': floor === '1st' ? '11th' : '12th' } : {}),
          ...(program && program !== 'all' ? { 'class.program': program } : {}),
          ...(classId && classId !== 'all' ? { 'classId': classId } : {})
        }
      }
    ];

    const records = await Attendance.aggregate(pipeline);

    // Calculate overall statistics
    const totalStudents = new Set(records.map(r => r.studentId.toString())).size;
    const presentRecords = records.filter(r => r.status === 'Present');
    const absentRecords = records.filter(r => r.status === 'Absent');
    const lateRecords = records.filter(r => r.status === 'Late');
    
    // For all-time data, show record counts not unique student counts
    const totalRecords = records.length;
    const presentCount = presentRecords.length;
    const absentCount = absentRecords.length;
    const lateCount = lateRecords.length;
    
    const attendancePercentage = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

    // Calculate campus breakdown
    const campusBreakdown = {};
    ['Boys', 'Girls'].forEach(campusType => {
      const campusRecords = records.filter(r => r.class.campus === campusType);
      const campusTotal = new Set(campusRecords.map(r => r.studentId.toString())).size;
      const campusPresentRecords = campusRecords.filter(r => r.status === 'Present');
      const campusAbsentRecords = campusRecords.filter(r => r.status === 'Absent');
      const campusTotalRecords = campusRecords.length;
      
      campusBreakdown[campusType.toLowerCase()] = {
        total: campusTotal,                    // Unique students
        present: campusPresentRecords.length,  // Present records count
        absent: campusAbsentRecords.length,    // Absent records count
        totalRecords: campusTotalRecords,      // Total records for this campus
        percentage: campusTotalRecords > 0 ? (campusPresentRecords.length / campusTotalRecords) * 100 : 0
      };
    });

    // Calculate floor breakdown by campus
    const floorBreakdown = {};
    ['Boys', 'Girls'].forEach(campusType => {
      floorBreakdown[campusType.toLowerCase()] = {};
      ['1st', '2nd'].forEach(floorType => {
        const floorRecords = records.filter(r => 
          r.class.campus === campusType && 
          ((floorType === '1st' && r.class.grade === '11th') || (floorType === '2nd' && r.class.grade === '12th'))
        );
        const floorTotal = new Set(floorRecords.map(r => r.studentId.toString())).size;
        const floorPresent = new Set(floorRecords.filter(r => r.status === 'Present').map(r => r.studentId.toString())).size;
        const floorAbsent = floorTotal - floorPresent;
        
        floorBreakdown[campusType.toLowerCase()][floorType] = {
          total: floorTotal,
          present: floorPresent,
          absent: floorAbsent,
          percentage: floorTotal > 0 ? (floorPresent / floorTotal) * 100 : 0,
          grade: floorType === '1st' ? '11th' : '12th'
        };
      });
    });

    // Calculate program breakdown by campus
    const programBreakdown = {};
    ['Boys', 'Girls'].forEach(campusType => {
      programBreakdown[campusType.toLowerCase()] = {};
      const campusRecords = records.filter(r => r.class.campus === campusType);
      const programs = [...new Set(campusRecords.map(r => r.class.program).filter(Boolean))];
      
      programs.forEach(programType => {
        const programRecords = campusRecords.filter(r => r.class.program === programType);
        const programTotal = new Set(programRecords.map(r => r.studentId.toString())).size;
        const programPresent = new Set(programRecords.filter(r => r.status === 'Present').map(r => r.studentId.toString())).size;
        const programAbsent = programTotal - programPresent;
        
        programBreakdown[campusType.toLowerCase()][programType] = {
          total: programTotal,
          present: programPresent,
          absent: programAbsent,
          percentage: programTotal > 0 ? (programPresent / programTotal) * 100 : 0
        };
      });
    });

    // Calculate class breakdown
    const classBreakdown = {};
    const classes = [...new Set(records.map(r => r.classId.toString()))];
    
    classes.forEach(classIdStr => {
      const classRecords = records.filter(r => r.classId.toString() === classIdStr);
      const classTotal = new Set(classRecords.map(r => r.studentId.toString())).size;
      const classPresent = new Set(classRecords.filter(r => r.status === 'Present').map(r => r.studentId.toString())).size;
      const classAbsent = classTotal - classPresent;
      
      classBreakdown[classIdStr] = {
        total: classTotal,
        present: classPresent,
        absent: classAbsent,
        percentage: classTotal > 0 ? (classPresent / classTotal) * 100 : 0
      };
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        presentStudents: presentCount,  // Using record counts not unique students
        absentStudents: absentCount,    // Using record counts not unique students  
        totalRecords,
        attendancePercentage,
        campusBreakdown,
        floorBreakdown,
        programBreakdown,
        classBreakdown,
        dateRange: { 
          startDate: queryStartDate.toISOString().split('T')[0], 
          endDate: queryEndDate.toISOString().split('T')[0] 
        }
      }
    });

  } catch (error) {
    console.error('Error getting attendance overview:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting attendance overview', 
      error: error.message 
    });
  }
});

// Get detailed attendance records for IT/Admin (student records)
router.get('/detailed', authenticate, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      campus, 
      floor, 
      program, 
      classId,
      page = 1,
      limit = 50 
    } = req.query;
    
    // Default to today if no date range provided
    const today = new Date().toISOString().split('T')[0];
    const queryStartDate = startDate || today;
    const queryEndDate = endDate || today;

    // Build match criteria
    const matchCriteria = {
      date: {
        $gte: queryStartDate,
        $lte: queryEndDate
      }
    };

    // Build aggregation pipeline
    const pipeline = [
      { $match: matchCriteria },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'class'
        }
      },
      { $unwind: '$class' },
      {
        $match: {
          'student.role': 'Student',
          ...(campus && campus !== 'all' ? { 'class.campus': campus } : {}),
          ...(floor && floor !== 'all' ? { 'class.grade': floor === '1st' ? '11th' : '12th' } : {}),
          ...(program && program !== 'all' ? { 'class.program': program } : {}),
          ...(classId && classId !== 'all' ? { 'classId': new mongoose.Types.ObjectId(classId) } : {})
        }
      },
      {
        $project: {
          date: 1,
          status: 1,
          student: {
            _id: '$student._id',
            fullName: '$student.fullName',
            email: '$student.email',
            phoneNumber: '$student.phoneNumber',
            studentId: '$student.studentId'
          },
          className: '$class.className',
          campus: '$class.campus',
          floor: {
            $cond: {
              if: { $eq: ['$class.grade', '11th'] },
              then: '1st',
              else: '2nd'
            }
          },
          program: '$class.program'
        }
      },
      { $sort: { date: -1, 'student.fullName.firstName': 1 } }
    ];

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Attendance.aggregate(countPipeline);
    const totalRecords = countResult[0]?.total || 0;
    
    // Get paginated results
    const records = await Attendance.aggregate([
      ...pipeline,
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: {
        studentRecords: records,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRecords / parseInt(limit)),
          totalRecords,
          recordsPerPage: parseInt(limit)
        },
        dateRange: { startDate: queryStartDate, endDate: queryEndDate }
      }
    });

  } catch (error) {
    console.error('Error getting detailed attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting detailed attendance records', 
      error: error.message 
    });
  }
});

module.exports = router;
