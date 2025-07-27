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
 * @desc    Get correspondence statistics for Principal dashboard (ALL remarks count as correspondence)
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
    // Get aggregated statistics using MongoDB aggregation pipeline
    // This counts ALL remarks as correspondence, regardless of level changes
    const pipeline = [
      {
        $match: {
          role: 'Student',
          enquiryLevel: { $gte: 1, $lte: 5 },
          receptionistRemarks: { $exists: true, $ne: [] }
        }
      },
      {
        $project: {
          enquiryLevel: 1,
          gender: 1,
          program: 1,
          receptionistRemarks: 1,
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
      {
        $sort: { _id: 1 }
      }
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

    // Build response in the format the frontend expects
    const responseData = {
      total: totalCorrespondence, // Total correspondence records
      boys: totalBoys, // Total boys with correspondence
      girls: totalGirls, // Total girls with correspondence
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
      }
    };

    // Calculate program breakdown by gender
    const studentsWithCorrespondence = await User.find({
      role: 'Student',
      enquiryLevel: { $gte: 1, $lte: 5 },
      receptionistRemarks: { $exists: true, $ne: [] }
    }).select('gender program enquiryLevel');

    studentsWithCorrespondence.forEach(student => {
      const program = student.program || 'Unknown';
      const isMale = student.gender === 'Male' || student.gender === 'male' || student.gender === 'M';
      
      if (isMale) {
        responseData.programs.boys[program] = (responseData.programs.boys[program] || 0) + 1;
      } else {
        responseData.programs.girls[program] = (responseData.programs.girls[program] || 0) + 1;
      }
    });

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

    console.log('=== CORRESPONDENCE STATS (ALL REMARKS COUNT) ===');
    console.log('Total correspondence records:', totalCorrespondence);
    console.log('Boys with correspondence:', totalBoys);
    console.log('Girls with correspondence:', totalGirls);
    console.log('Program breakdown:', responseData.programs);
    console.log('Sending response:', JSON.stringify(responseData, null, 2));

    res.json({
      success: true,
      data: responseData,
      message: 'Correspondence statistics retrieved successfully (all remarks counted)'
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
 * @desc    Get detailed correspondence overview for Principal dashboard (ALL remarks count)
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
    // Get detailed correspondence breakdown by level
    const pipeline = [
      {
        $match: {
          role: 'Student',
          enquiryLevel: { $gte: 1, $lte: 5 },
          receptionistRemarks: { $exists: true, $ne: [] }
        }
      },
      {
        $project: {
          enquiryLevel: 1,
          gender: 1,
          program: 1,
          receptionistRemarks: 1,
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

module.exports = router;
