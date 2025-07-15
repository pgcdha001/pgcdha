const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// Get correspondence statistics
router.get('/correspondence-statistics', authenticate, async (req, res) => {
  try {
    const { timeFilter } = req.query;
    
    // Get all students with remarks
    const studentsWithRemarks = await User.find({
      role: 'Student',
      receptionistRemarks: { $exists: true, $ne: [] }
    }).select('fullName email receptionistRemarks createdAt');

    let filteredRemarks = [];
    const now = new Date();
    
    // Process all remarks and apply time filter if needed
    studentsWithRemarks.forEach(student => {
      if (student.receptionistRemarks && student.receptionistRemarks.length > 0) {
        student.receptionistRemarks.forEach(remark => {
          const remarkDate = new Date(remark.timestamp);
          let includeRemark = true;
          
          if (timeFilter && timeFilter !== 'all') {
            const minutes = parseInt(timeFilter);
            const cutoffTime = new Date(now.getTime() - minutes * 60 * 1000);
            includeRemark = remarkDate >= cutoffTime;
          }
          
          if (includeRemark) {
            filteredRemarks.push({
              ...remark,
              studentId: student._id,
              studentName: `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.trim(),
              studentEmail: student.email
            });
          }
        });
      }
    });

    // Calculate statistics
    const totalRemarks = filteredRemarks.length;
    const uniqueStudents = new Set(filteredRemarks.map(r => r.studentId.toString())).size;
    const totalStudentsWithRemarks = studentsWithRemarks.length;
    
    // Remarks by receptionist
    const remarksByReceptionist = {};
    filteredRemarks.forEach(remark => {
      const name = remark.receptionistName || 'Unknown';
      remarksByReceptionist[name] = (remarksByReceptionist[name] || 0) + 1;
    });

    // Daily correspondence trends (last 7 days)
    const dailyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayRemarks = filteredRemarks.filter(remark => {
        const remarkDate = new Date(remark.timestamp);
        return remarkDate >= day && remarkDate < nextDay;
      });
      
      dailyTrends.push({
        date: day.toISOString().split('T')[0],
        remarks: dayRemarks.length,
        uniqueStudents: new Set(dayRemarks.map(r => r.studentId.toString())).size
      });
    }

    // Monthly trends (last 12 months)
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthRemarks = filteredRemarks.filter(remark => {
        const remarkDate = new Date(remark.timestamp);
        return remarkDate >= monthStart && remarkDate <= monthEnd;
      });
      
      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        remarks: monthRemarks.length,
        uniqueStudents: new Set(monthRemarks.map(r => r.studentId.toString())).size
      });
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalRemarks,
          uniqueStudents,
          totalStudentsWithRemarks,
          averageRemarksPerStudent: totalStudentsWithRemarks > 0 ? 
            (totalRemarks / totalStudentsWithRemarks).toFixed(2) : 0
        },
        remarksByReceptionist: Object.entries(remarksByReceptionist).map(([name, count]) => ({
          name,
          count
        })),
        dailyTrends,
        monthlyTrends,
        recentRemarks: filteredRemarks
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 10)
      }
    });

  } catch (error) {
    console.error('Error fetching correspondence statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch correspondence statistics'
    });
  }
});

// Add remark for a student
router.post('/add-remark', authenticate, async (req, res) => {
  try {
    const { studentId, remark } = req.body;
    
    if (!studentId || !remark) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and remark are required'
      });
    }

    // Find the student
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Add remark to student's record
    const remarkData = {
      remark,
      receptionistId: req.user.id,
      receptionistName: `${req.user.fullName?.firstName || ''} ${req.user.fullName?.lastName || ''}`.trim() || 'Receptionist',
      timestamp: new Date()
    };

    // Initialize remarks array if it doesn't exist
    if (!student.receptionistRemarks) {
      student.receptionistRemarks = [];
    }

    student.receptionistRemarks.push(remarkData);
    await student.save();

    res.json({
      success: true,
      message: 'Remark added successfully',
      data: remarkData
    });

  } catch (error) {
    console.error('Error adding remark:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding remark',
      error: error.message
    });
  }
});

// Get remarks for a student
router.get('/remarks/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await User.findById(studentId).select('receptionistRemarks fullName email');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: {
        student: {
          name: student.fullName?.firstName + ' ' + student.fullName?.lastName,
          email: student.email
        },
        remarks: student.receptionistRemarks || []
      }
    });

  } catch (error) {
    console.error('Error fetching remarks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching remarks'
    });
  }
});

// Get all students with remark status
router.get('/students-with-remarks', authenticate, async (req, res) => {
  try {
    const students = await User.find({ role: 'Student' })
      .select('fullName email phoneNumbers receptionistRemarks prospectusStage isApproved')
      .lean();

    const studentsWithRemarkStatus = students.map(student => ({
      ...student,
      hasRemarks: !!(student.receptionistRemarks && student.receptionistRemarks.length > 0),
      lastRemarkDate: student.receptionistRemarks && student.receptionistRemarks.length > 0 
        ? student.receptionistRemarks[student.receptionistRemarks.length - 1].timestamp 
        : null
    }));

    res.json({
      success: true,
      data: {
        students: studentsWithRemarkStatus,
        count: studentsWithRemarkStatus.length
      }
    });

  } catch (error) {
    console.error('Error fetching students with remarks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students'
    });
  }
});

module.exports = router;
