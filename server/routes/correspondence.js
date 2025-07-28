const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/correspondence/principal-stats
 * @desc    Get correspondence statistics for Principal dashboard with advanced filtering
 * @access  Private (Principal only)
 */
router.get('/principal-stats', asyncHandler(async (req, res) => {
  console.log('Principal correspondence stats requested by user:', req.user.email, 'Role:', req.user.role);
  
  // Check if user is Principal or InstituteAdmin
  if (req.user.role !== 'Principal' && req.user.role !== 'InstituteAdmin') {
    return res.status(403).json({
      success: false,
      message: `Access denied. Principal privileges required. Your role: ${req.user.role}`
    });
  }

  try {
    const { 
      minLevel = 1, 
      dateFilter = 'all', 
      startDate, 
      endDate,
      employeeId,
      studentId 
    } = req.query;

    console.log('Query parameters:', { minLevel, dateFilter, startDate, endDate, employeeId, studentId });

    // Build match stage for base filtering
    let matchStage = {
      role: 'Student',
      enquiryLevel: { $gte: parseInt(minLevel), $lte: 5 },
      receptionistRemarks: { $exists: true, $ne: [] }
    };

    // Add student-specific filter if provided
    if (studentId) {
      matchStage._id = new mongoose.Types.ObjectId(studentId);
    }

    // Build date filter for correspondence remarks
    let dateMatchStage = {};
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDateTime, endDateTime;

      switch (dateFilter) {
        case 'today':
          startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'week':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          startDateTime = startOfWeek;
          endDateTime = new Date(startOfWeek);
          endDateTime.setDate(startOfWeek.getDate() + 7);
          break;
        case 'month':
          startDateTime = new Date(now.getFullYear(), now.getMonth(), 1);
          endDateTime = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case 'year':
          startDateTime = new Date(now.getFullYear(), 0, 1);
          endDateTime = new Date(now.getFullYear() + 1, 0, 1);
          break;
        case 'custom':
          if (startDate && endDate) {
            startDateTime = new Date(startDate);
            endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999); // Include the entire end date
          }
          break;
      }

      if (startDateTime && endDateTime) {
        dateMatchStage = {
          timestamp: {
            $gte: startDateTime,
            $lte: endDateTime
          }
        };
        console.log('Date filter applied:', { startDateTime, endDateTime });
      }
    }

    // Build aggregation pipeline with advanced filtering
    const pipeline = [
      { $match: matchStage },
      {
        $project: {
          enquiryLevel: 1,
          gender: 1,
          program: 1,
          fullName: 1,
          receptionistRemarks: {
            $filter: {
              input: '$receptionistRemarks',
              as: 'remark',
              cond: {
                $and: [
                  // Date filter
                  Object.keys(dateMatchStage).length > 0 ? {
                    $and: [
                      { $gte: ['$$remark.timestamp', dateMatchStage.timestamp.$gte] },
                      { $lte: ['$$remark.timestamp', dateMatchStage.timestamp.$lte] }
                    ]
                  } : { $literal: true },
                  // Employee filter
                  employeeId ? { $eq: ['$$remark.receptionistId', new mongoose.Types.ObjectId(employeeId)] } : { $literal: true }
                ]
              }
            }
          }
        }
      },
      {
        $match: {
          receptionistRemarks: { $ne: [] } // Only students with remarks matching our filters
        }
      },
      {
        $addFields: {
          totalRemarks: { $size: '$receptionistRemarks' }
        }
      },
      {
        $group: {
          _id: '$enquiryLevel',
          students: { $sum: 1 },
          totalCorrespondence: { $sum: '$totalRemarks' },
          boyStudents: {
            $sum: {
              $cond: {
                if: { $in: ['$gender', ['Male', 'male', 'M']] },
                then: 1,
                else: 0
              }
            }
          },
          girlStudents: {
            $sum: {
              $cond: {
                if: { $in: ['$gender', ['Female', 'female', 'F']] },
                then: 1,
                else: 0
              }
            }
          },
          boysCorrespondence: {
            $sum: {
              $cond: {
                if: { $in: ['$gender', ['Male', 'male', 'M']] },
                then: '$totalRemarks',
                else: 0
              }
            }
          },
          girlsCorrespondence: {
            $sum: {
              $cond: {
                if: { $in: ['$gender', ['Female', 'female', 'F']] },
                then: '$totalRemarks',
                else: 0
              }
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const aggregateResults = await User.aggregate(pipeline);
    
    // Initialize stats structure
    const stats = {};
    let totalStudents = 0;
    let totalCorrespondence = 0;
    let totalBoys = 0;
    let totalGirls = 0;

    // Initialize all levels
    for (let i = 1; i <= 5; i++) {
      stats[`level${i}`] = { 
        students: 0, 
        correspondence: 0,
        boys: 0,
        girls: 0
      };
    }

    // Populate with actual data
    aggregateResults.forEach(item => {
      const level = item._id;
      if (level >= 1 && level <= 5) {
        stats[`level${level}`] = {
          students: item.students,
          correspondence: item.totalCorrespondence,
          boys: item.boyStudents,
          girls: item.girlStudents
        };
        
        totalStudents += item.students;
        totalCorrespondence += item.totalCorrespondence;
        totalBoys += item.boyStudents;
        totalGirls += item.girlStudents;
      }
    });

    // Get detailed student data for program breakdown with advanced filtering
    const detailPipeline = [
      { $match: matchStage },
      {
        $project: {
          enquiryLevel: 1,
          gender: 1,
          program: 1,
          fullName: 1,
          receptionistRemarks: {
            $filter: {
              input: '$receptionistRemarks',
              as: 'remark',
              cond: {
                $and: [
                  // Date filter
                  Object.keys(dateMatchStage).length > 0 ? {
                    $and: [
                      { $gte: ['$$remark.timestamp', dateMatchStage.timestamp.$gte] },
                      { $lte: ['$$remark.timestamp', dateMatchStage.timestamp.$lte] }
                    ]
                  } : { $literal: true },
                  // Employee filter
                  employeeId ? { $eq: ['$$remark.receptionistId', new mongoose.Types.ObjectId(employeeId)] } : { $literal: true }
                ]
              }
            }
          }
        }
      },
      {
        $match: {
          receptionistRemarks: { $ne: [] },
          enquiryLevel: { $gte: parseInt(minLevel) }
        }
      },
      {
        $addFields: {
          totalRemarks: { $size: '$receptionistRemarks' }
        }
      }
    ];

    const studentsWithCorrespondence = await User.aggregate(detailPipeline);

    // Build response in the format the frontend expects
    const responseData = {
      total: totalCorrespondence,
      boys: totalBoys,
      girls: totalGirls,
      programs: {
        boys: {},
        girls: {}
      },
      levelProgression: {
        1: { current: totalCorrespondence, previous: totalCorrespondence, change: 0 },
        2: { current: totalCorrespondence, previous: totalCorrespondence, change: 0 },
        3: { current: totalCorrespondence, previous: totalCorrespondence, change: 0 },
        4: { current: totalCorrespondence, previous: totalCorrespondence, change: 0 },
        5: { current: totalCorrespondence, previous: totalCorrespondence, change: 0 }
      },
      genderLevelProgression: {
        boys: {},
        girls: {}
      },
      // New detailed breakdowns
      employeeBreakdown: {},
      studentCallCounts: {},
      levelBreakdownDetailed: {}
    };

    // Calculate program breakdown by gender
    studentsWithCorrespondence.forEach(student => {
      const program = student.program || 'Unknown';
      const isMale = student.gender === 'Male' || student.gender === 'male' || student.gender === 'M';
      
      if (isMale) {
        responseData.programs.boys[program] = (responseData.programs.boys[program] || 0) + 1;
      } else {
        responseData.programs.girls[program] = (responseData.programs.girls[program] || 0) + 1;
      }

      // Track individual student call counts
      const studentKey = `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.trim();
      if (!responseData.studentCallCounts[studentKey]) {
        responseData.studentCallCounts[studentKey] = {
          studentId: student._id,
          totalCalls: 0,
          levelBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          program: student.program,
          gender: student.gender
        };
      }
      responseData.studentCallCounts[studentKey].totalCalls += student.totalRemarks;
      responseData.studentCallCounts[studentKey].levelBreakdown[student.enquiryLevel] += student.totalRemarks;
    });

    // Get employee breakdown if no specific employee filter is applied
    if (!employeeId) {
      const employeePipeline = [
        { $match: matchStage },
        { $unwind: '$receptionistRemarks' },
        {
          $match: Object.keys(dateMatchStage).length > 0 ? {
            'receptionistRemarks.timestamp': dateMatchStage.timestamp
          } : {}
        },
        {
          $group: {
            _id: {
              employeeId: '$receptionistRemarks.receptionistId',
              employeeName: '$receptionistRemarks.receptionistName'
            },
            totalCalls: { $sum: 1 },
            studentsContacted: { $addToSet: '$_id' }
          }
        },
        {
          $addFields: {
            uniqueStudentsContacted: { $size: '$studentsContacted' }
          }
        },
        { $sort: { totalCalls: -1 } }
      ];

      const employeeResults = await User.aggregate(employeePipeline);
      
      employeeResults.forEach(emp => {
        responseData.employeeBreakdown[emp._id.employeeName] = {
          employeeId: emp._id.employeeId,
          totalCalls: emp.totalCalls,
          uniqueStudentsContacted: emp.uniqueStudentsContacted
        };
      });
    }

    // Calculate gender level progression
    for (let i = 1; i <= 5; i++) {
      const studentsAtLevel = studentsWithCorrespondence.filter(student => student.enquiryLevel >= i);
      
      const boysAtLevel = studentsAtLevel.filter(student => 
        student.gender === 'Male' || student.gender === 'male' || student.gender === 'M'
      ).length;

      const girlsAtLevel = studentsAtLevel.filter(student => 
        student.gender === 'Female' || student.gender === 'female' || student.gender === 'F'
      ).length;

      responseData.genderLevelProgression.boys[i] = {
        current: boysAtLevel,
        previous: i > 1 ? responseData.genderLevelProgression.boys[i - 1]?.current || 0 : boysAtLevel,
        change: 0
      };

      responseData.genderLevelProgression.girls[i] = {
        current: girlsAtLevel,
        previous: i > 1 ? responseData.genderLevelProgression.girls[i - 1]?.current || 0 : girlsAtLevel,
        change: 0
      };
    }

    console.log('=== CORRESPONDENCE STATS (FILTERED) ===');
    console.log('Applied filters:', { minLevel, dateFilter, startDate, endDate, employeeId, studentId });
    console.log('Total correspondence records:', totalCorrespondence);
    console.log('Boys with correspondence:', totalBoys);
    console.log('Girls with correspondence:', totalGirls);
    console.log('Employee breakdown:', Object.keys(responseData.employeeBreakdown).length, 'employees');
    console.log('Student call counts:', Object.keys(responseData.studentCallCounts).length, 'students');
    console.log('Program breakdown:', responseData.programs);

    res.json({
      success: true,
      data: responseData,
      filters: {
        minLevel: parseInt(minLevel),
        dateFilter,
        startDate,
        endDate,
        employeeId,
        studentId
      },
      message: 'Correspondence statistics retrieved successfully with advanced filtering'
    });

  } catch (error) {
    console.error('Error fetching principal correspondence stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch correspondence statistics',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/correspondence/principal-overview
 * @desc    Get detailed correspondence overview for Principal dashboard with advanced filtering
 * @access  Private (Principal only)
 */
router.get('/principal-overview', asyncHandler(async (req, res) => {
  console.log('Principal correspondence overview requested by user:', req.user.email, 'Role:', req.user.role);
  
  // Check if user is Principal or InstituteAdmin
  if (req.user.role !== 'Principal' && req.user.role !== 'InstituteAdmin') {
    return res.status(403).json({
      success: false,
      message: `Access denied. Principal privileges required. Your role: ${req.user.role}`
    });
  }

  try {
    const { 
      dateFilter = 'all', 
      startDate, 
      endDate,
      employeeId,
      studentId 
    } = req.query;

    // Build date filter
    let dateMatchStage = {};
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDateTime, endDateTime;

      switch (dateFilter) {
        case 'today':
          startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'week':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          startDateTime = startOfWeek;
          endDateTime = new Date(startOfWeek);
          endDateTime.setDate(startOfWeek.getDate() + 7);
          break;
        case 'month':
          startDateTime = new Date(now.getFullYear(), now.getMonth(), 1);
          endDateTime = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case 'year':
          startDateTime = new Date(now.getFullYear(), 0, 1);
          endDateTime = new Date(now.getFullYear() + 1, 0, 1);
          break;
        case 'custom':
          if (startDate && endDate) {
            startDateTime = new Date(startDate);
            endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
          }
          break;
      }

      if (startDateTime && endDateTime) {
        dateMatchStage = {
          timestamp: {
            $gte: startDateTime,
            $lte: endDateTime
          }
        };
      }
    }

    // Base match stage
    let matchStage = {
      role: 'Student',
      enquiryLevel: { $gte: 1, $lte: 5 },
      receptionistRemarks: { $exists: true, $ne: [] }
    };

    if (studentId) {
      matchStage._id = new mongoose.Types.ObjectId(studentId);
    }

    // Get detailed correspondence breakdown by level
    const pipeline = [
      { $match: matchStage },
      {
        $project: {
          enquiryLevel: 1,
          gender: 1,
          program: 1,
          fullName: 1,
          receptionistRemarks: {
            $filter: {
              input: '$receptionistRemarks',
              as: 'remark',
              cond: {
                $and: [
                  // Date filter
                  Object.keys(dateMatchStage).length > 0 ? {
                    $and: [
                      { $gte: ['$$remark.timestamp', dateMatchStage.timestamp.$gte] },
                      { $lte: ['$$remark.timestamp', dateMatchStage.timestamp.$lte] }
                    ]
                  } : { $literal: true },
                  // Employee filter
                  employeeId ? { $eq: ['$$remark.receptionistId', new mongoose.Types.ObjectId(employeeId)] } : { $literal: true }
                ]
              }
            }
          }
        }
      },
      {
        $match: {
          receptionistRemarks: { $ne: [] }
        }
      },
      {
        $addFields: {
          totalRemarks: { $size: '$receptionistRemarks' },
          latestRemark: { $arrayElemAt: ['$receptionistRemarks', -1] }
        }
      }
    ];

    const students = await User.aggregate(pipeline);
    
    // Calculate level breakdown for correspondence overview
    const levelBreakdown = {};
    for (let level = 1; level <= 5; level++) {
      const studentsAtLevel = students.filter(student => student.enquiryLevel === level);
      const totalCorrespondenceAtLevel = studentsAtLevel.reduce((sum, student) => sum + student.totalRemarks, 0);
      
      levelBreakdown[level] = {
        students: studentsAtLevel.length,
        correspondence: totalCorrespondenceAtLevel,
        averagePerStudent: studentsAtLevel.length > 0 ? (totalCorrespondenceAtLevel / studentsAtLevel.length).toFixed(2) : 0
      };
    }

    // Calculate program breakdown
    const programBreakdown = {};
    students.forEach(student => {
      const program = student.program || 'Unknown';
      if (!programBreakdown[program]) {
        programBreakdown[program] = {
          students: 0,
          correspondence: 0
        };
      }
      programBreakdown[program].students += 1;
      programBreakdown[program].correspondence += student.totalRemarks;
    });

    console.log('Correspondence level breakdown:', levelBreakdown);
    console.log('Correspondence program breakdown:', programBreakdown);

    res.json({
      success: true,
      data: {
        levelBreakdown,
        programBreakdown,
        totalStudentsWithCorrespondence: students.length,
        totalCorrespondenceRecords: students.reduce((sum, student) => sum + student.totalRemarks, 0)
      },
      filters: {
        dateFilter,
        startDate,
        endDate,
        employeeId,
        studentId
      },
      message: 'Correspondence overview retrieved successfully'
    });

  } catch (error) {
    console.error('Error in principal correspondence overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch correspondence overview',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/correspondence/employees
 * @desc    Get list of employees who have made correspondence calls
 * @access  Private (Principal only)
 */
router.get('/employees', asyncHandler(async (req, res) => {
  // Check if user is Principal or InstituteAdmin
  if (req.user.role !== 'Principal' && req.user.role !== 'InstituteAdmin') {
    return res.status(403).json({
      success: false,
      message: `Access denied. Principal privileges required. Your role: ${req.user.role}`
    });
  }

  try {
    // Get unique employees who have made remarks
    const employeePipeline = [
      {
        $match: {
          role: 'Student',
          receptionistRemarks: { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$receptionistRemarks' },
      {
        $group: {
          _id: {
            employeeId: '$receptionistRemarks.receptionistId',
            employeeName: '$receptionistRemarks.receptionistName'
          },
          totalCalls: { $sum: 1 },
          lastCallDate: { $max: '$receptionistRemarks.timestamp' }
        }
      },
      {
        $project: {
          _id: 0,
          employeeId: '$_id.employeeId',
          employeeName: '$_id.employeeName',
          totalCalls: 1,
          lastCallDate: 1
        }
      },
      { $sort: { employeeName: 1 } }
    ];

    const employees = await User.aggregate(employeePipeline);

    res.json({
      success: true,
      data: employees,
      message: 'Employees list retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees list',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/correspondence/students/search
 * @desc    Search students for correspondence filtering
 * @access  Private (Principal only)
 */
router.get('/students/search', asyncHandler(async (req, res) => {
  // Check if user is Principal or InstituteAdmin
  if (req.user.role !== 'Principal' && req.user.role !== 'InstituteAdmin') {
    return res.status(403).json({
      success: false,
      message: `Access denied. Principal privileges required. Your role: ${req.user.role}`
    });
  }

  try {
    const { q = '', limit = 20 } = req.query;

    let matchStage = {
      role: 'Student',
      receptionistRemarks: { $exists: true, $ne: [] }
    };

    // Add search query if provided
    if (q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      matchStage.$or = [
        { 'fullName.firstName': searchRegex },
        { 'fullName.lastName': searchRegex },
        { fatherName: searchRegex },
        { userName: searchRegex }
      ];
    }

    const students = await User.find(matchStage)
      .select('_id fullName fatherName userName program enquiryLevel receptionistRemarks')
      .limit(parseInt(limit))
      .sort({ 'fullName.firstName': 1 });

    const studentsWithCounts = students.map(student => ({
      _id: student._id,
      name: `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.trim(),
      fatherName: student.fatherName,
      userName: student.userName,
      program: student.program,
      enquiryLevel: student.enquiryLevel,
      totalCalls: student.receptionistRemarks?.length || 0
    }));

    res.json({
      success: true,
      data: studentsWithCounts,
      message: 'Students search completed successfully'
    });

  } catch (error) {
    console.error('Error searching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search students',
      error: error.message
    });
  }
}));

module.exports = router;
