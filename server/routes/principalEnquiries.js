const express = require('express');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/enquiries/principal-stats
 * @desc    Get enquiry statistics for Principal dashboard
 * @access  Private (Principal only)
 */
router.get('/principal-stats', asyncHandler(async (req, res) => {
  console.log('Principal stats requested by user:', req.user.email, 'Role:', req.user.role);
  
  // Check if user is Principal or InstituteAdmin (temporary for debugging)
  if (req.user.role !== 'Principal' && req.user.role !== 'InstituteAdmin') {
    return res.status(403).json({
      success: false,
      message: `Access denied. Principal privileges required. Your role: ${req.user.role}`
    });
  }

  const { minLevel, dateFilter, startDate, endDate } = req.query;
  console.log('Query parameters:', { minLevel, dateFilter, startDate, endDate });

  // Debug: Check total students in database
  const totalStudents = await User.countDocuments({ role: 'Student' });
  console.log('Total students in database:', totalStudents);

  // Build query for students (Level 1-5 only, as requested)
  let query = {
    role: 'Student',
    prospectusStage: { $gte: 1, $lte: 5 } // Only levels 1-5
  };
  
  console.log('Base query:', query);

  // Apply level filter - show students AT LEAST this level (as client requested)
  if (minLevel && minLevel !== 'all') {
    query.prospectusStage = { $gte: parseInt(minLevel), $lte: 5 };
  }

  // Apply date filter
  if (dateFilter && dateFilter !== 'all') {
    if (dateFilter === 'custom' && startDate && endDate) {
      // Handle custom date range
      const customStartDate = new Date(startDate);
      const customEndDate = new Date(endDate);
      customEndDate.setHours(23, 59, 59, 999); // Include the entire end date
      
      query.createdOn = { 
        $gte: customStartDate,
        $lte: customEndDate
      };
      console.log('Applied custom date filter:', customStartDate, 'to', customEndDate);
    } else {
      // Handle predefined date filters
      const now = new Date();
      let filterStartDate;

      switch (dateFilter) {
        case 'today':
          filterStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          filterStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          console.log('Stats WEEK filter - Current time:', now);
          console.log('Stats WEEK filter - Start date (7 days ago):', filterStartDate);
          break;
        case 'month':
          filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          filterStartDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          filterStartDate = null;
      }

      if (filterStartDate) {
        query.createdOn = { $gte: filterStartDate };
        console.log('Applied date filter:', dateFilter, 'Start date:', filterStartDate);
      }
    }
  }

  try {
    // Get total count (cumulative approach)
    // If a specific level is requested, show students at that level and above
    const totalStudents = await User.countDocuments(query);
    console.log('=== PRINCIPAL STATS DEBUG ===');
    console.log('Date filter applied:', dateFilter);
    console.log('Level filter applied:', minLevel);
    console.log('Final query for bottom cards:', JSON.stringify(query, null, 2));
    console.log('Total students found:', totalStudents);

    // Get gender breakdown
    const genderStats = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('Gender stats:', genderStats);

    // Get program breakdown by gender
    const programStats = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            gender: '$gender',
            program: '$program'
          },
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('Program stats:', programStats);

    // Process gender data
    let boysCount = 0;
    let girlsCount = 0;
    let otherGenderCount = 0;

    genderStats.forEach(stat => {
      if (stat._id === 'Male' || stat._id === 'male' || stat._id === 'M') {
        boysCount = stat.count;
      } else if (stat._id === 'Female' || stat._id === 'female' || stat._id === 'F') {
        girlsCount = stat.count;
      } else {
        otherGenderCount += stat.count;
      }
    });
    
    console.log('Gender breakdown:', { boysCount, girlsCount, otherGenderCount, total: totalStudents });
    
    // Get gender breakdown by level
    const genderLevelProgression = {
      boys: {},
      girls: {}
    };
    
    for (let i = 1; i <= 5; i++) {
      // Build base query for level calculations (same date filter)
      let levelQuery = {
        role: 'Student',
        prospectusStage: { $gte: i }
      };
      
      // Apply same date filter to level calculations
      if (query.createdOn) {
        levelQuery.createdOn = query.createdOn;
      }
      
      // Get boys count for current level (cumulative - includes higher levels)
      // Level 2 includes Level 3 students, Level 3 includes Level 4 students, etc.
      const boysCurrentLevel = await User.countDocuments({
        ...levelQuery,
        gender: { $in: ['Male', 'male', 'M'] }
      });
      
      // Get boys count for previous level
      let boysPreviousLevel = 0;
      if (i > 1) {
        let prevLevelQuery = {
          role: 'Student',
          prospectusStage: { $gte: i - 1 },
          gender: { $in: ['Male', 'male', 'M'] }
        };
        if (query.createdOn) {
          prevLevelQuery.createdOn = query.createdOn;
        }
        boysPreviousLevel = await User.countDocuments(prevLevelQuery);
      } else {
        // For level 1, previous should be current to give 100% progression
        boysPreviousLevel = boysCurrentLevel;
      }
      
      // Get girls count for current level (cumulative - includes higher levels)
      // Level 2 includes Level 3 students, Level 3 includes Level 4 students, etc.
      const girlsCurrentLevel = await User.countDocuments({
        ...levelQuery,
        gender: { $in: ['Female', 'female', 'F'] }
      });
      
      // Get girls count for previous level
      let girlsPreviousLevel = 0;
      if (i > 1) {
        let prevLevelQuery = {
          role: 'Student',
          prospectusStage: { $gte: i - 1 },
          gender: { $in: ['Female', 'female', 'F'] }
        };
        if (query.createdOn) {
          prevLevelQuery.createdOn = query.createdOn;
        }
        girlsPreviousLevel = await User.countDocuments(prevLevelQuery);
      } else {
        // For level 1, previous should be current to give 100% progression
        girlsPreviousLevel = girlsCurrentLevel;
      }
      
      // Calculate students who didn't progress
      const boysNotProgressed = boysPreviousLevel - boysCurrentLevel;
      const girlsNotProgressed = girlsPreviousLevel - girlsCurrentLevel;
      
      genderLevelProgression.boys[i] = {
        current: boysCurrentLevel,
        previous: boysPreviousLevel,
        notProgressed: boysNotProgressed
      };
      
      genderLevelProgression.girls[i] = {
        current: girlsCurrentLevel,
        previous: girlsPreviousLevel,
        notProgressed: girlsNotProgressed
      };
    }

    // Calculate overall level progression (same logic as gender-specific)
    const levelProgression = {};
    for (let i = 1; i <= 5; i++) {
      // Build base query for level calculations (same date filter)
      let levelQuery = {
        role: 'Student',
        prospectusStage: { $gte: i }
      };
      
      // Apply same date filter to level calculations
      if (query.createdOn) {
        levelQuery.createdOn = query.createdOn;
      }
      
      // Get count for current level (cumulative - includes higher levels)
      const currentLevelCount = await User.countDocuments(levelQuery);
      
      // Get count for previous level
      let previousLevelCount = 0;
      if (i > 1) {
        let prevLevelQuery = {
          role: 'Student',
          prospectusStage: { $gte: i - 1 }
        };
        if (query.createdOn) {
          prevLevelQuery.createdOn = query.createdOn;
        }
        previousLevelCount = await User.countDocuments(prevLevelQuery);
      } else {
        // For level 1, previous should be current to give 100% progression
        previousLevelCount = currentLevelCount;
      }
      
      // Calculate students who didn't progress
      const studentsNotProgressed = previousLevelCount - currentLevelCount;
      
      levelProgression[i] = {
        current: currentLevelCount,
        previous: previousLevelCount,
        notProgressed: studentsNotProgressed
      };
    }

    // Process program data
    const programs = {
      boys: {},
      girls: {}
    };

    programStats.forEach(stat => {
      const gender = stat._id.gender;
      const program = stat._id.program || 'Unknown';
      const count = stat.count;

      if (gender === 'Male' || gender === 'male' || gender === 'M') {
        programs.boys[program] = count;
      } else if (gender === 'Female' || gender === 'female' || gender === 'F') {
        programs.girls[program] = count;
      }
    });

    // Send response
    const responseData = {
      total: totalStudents,
      boys: boysCount,
      girls: girlsCount,
      programs: programs,
      levelProgression: levelProgression,
      genderLevelProgression: genderLevelProgression
    };
    
    console.log('=== PRINCIPAL STATS RESPONSE ===');
    console.log('Bottom cards data:', JSON.stringify(responseData, null, 2));
    
    res.json({
      success: true,
      data: responseData,
      filters: {
        minLevel: minLevel || 'all',
        dateFilter: dateFilter || 'all'
      }
    });

  } catch (error) {
    console.error('Error fetching principal enquiry stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enquiry statistics',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/enquiries/principal-overview
 * @desc    Get overview statistics for Principal dashboard cards
 * @access  Private (Principal only)
 */
router.get('/principal-overview', asyncHandler(async (req, res) => {
  // Check if user is Principal
  if (req.user.role !== 'Principal') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Principal privileges required.'
    });
  }

  const { dateFilter, startDate, endDate } = req.query;
  console.log('Overview query parameters:', { dateFilter, startDate, endDate });

  try {
    // Debug: Check total students in database
    const totalStudents = await User.countDocuments({ role: 'Student' });
    console.log('Total students in database:', totalStudents);
    
    // Debug: Show sample student creation dates for overview
    const sampleStudentsOverview = await User.find({ role: 'Student' })
      .select('fullName createdOn prospectusStage')
      .limit(3)
      .sort({ createdOn: -1 });
    console.log('Sample students for overview:', sampleStudentsOverview.map(s => ({
      name: `${s.fullName?.firstName} ${s.fullName?.lastName}`,
      createdOn: s.createdOn,
      level: s.prospectusStage
    })));
    
    // Debug: Show sample student creation dates
    const sampleStudents = await User.find({ role: 'Student' })
      .select('fullName createdOn prospectusStage')
      .limit(5)
      .sort({ createdOn: -1 });
    console.log('Sample students with creation dates:', sampleStudents.map(s => ({
      name: `${s.fullName?.firstName} ${s.fullName?.lastName}`,
      createdOn: s.createdOn,
      level: s.prospectusStage
    })));
    
    // Build base query for date filtering
    let dateQuery = {};
    
    // Apply date filter
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let filterStartDate;
      
      switch (dateFilter) {
        case 'today':
          filterStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          dateQuery.createdOn = { $gte: filterStartDate };
          console.log('Overview date filter applied: today, Start date:', filterStartDate);
          break;
        case 'week':
          filterStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateQuery.createdOn = { $gte: filterStartDate };
          console.log('Overview WEEK filter - Current time:', now);
          console.log('Overview WEEK filter - Start date (7 days ago):', filterStartDate);
          console.log('Overview WEEK filter - Will show students created >= ', filterStartDate);
          break;
        case 'month':
          filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          dateQuery.createdOn = { $gte: filterStartDate };
          break;
        case 'year':
          filterStartDate = new Date(now.getFullYear(), 0, 1);
          dateQuery.createdOn = { $gte: filterStartDate };
          break;
        case 'custom':
          if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the entire end date
            dateQuery.createdOn = { $gte: start, $lte: end };
            console.log('Overview custom date filter applied:', start, 'to', end);
          }
          break;
      }
    }

    console.log('=== PRINCIPAL OVERVIEW DEBUG ===');
    console.log('Date filter applied:', dateFilter);
    console.log('Final dateQuery for level cards:', JSON.stringify(dateQuery, null, 2));
    
    // Debug: Test the date filter with a simple query
    if (dateQuery.createdOn) {
      const testCount = await User.countDocuments({
        role: 'Student',
        ...dateQuery
      });
      console.log('TEST: Students matching date filter:', testCount);
    }

    // Get counts for each level (cumulative approach) with date filtering
    // Level 2 includes Level 3 students, Level 3 includes Level 4 students, etc.
    const levelBreakdown = {};
    for (let level = 1; level <= 5; level++) {
      const levelQuery = {
        role: 'Student',
        prospectusStage: { $gte: level, $lte: 5 },
        ...dateQuery
      };
      levelBreakdown[level] = await User.countDocuments(levelQuery);
      console.log(`Level ${level}+ count:`, levelBreakdown[level], 'with query:', levelQuery);
    }

    // Get total enquiries (Level 1) with date filtering
    const totalEnquiries = await User.countDocuments({
      role: 'Student',
      prospectusStage: { $gte: 1 },
      ...dateQuery
    });

    // Get admitted students (Level 5) with date filtering
    const admittedStudents = await User.countDocuments({
      role: 'Student',
      prospectusStage: 5,
      ...dateQuery
    });
    
    // Get level progression data with date filtering
    const levelProgression = {};
    for (let i = 1; i <= 5; i++) {
      // Get count for current level (cumulative - includes higher levels)
      // Level 2 includes Level 3 students, Level 3 includes Level 4 students, etc.
      const currentLevelCount = await User.countDocuments({
        role: 'Student',
        prospectusStage: { $gte: i },
        ...dateQuery
      });
      
      // Get count for previous level (should be exact count at previous level for proper progression calculation)
      let previousLevelCount = 0;
      if (i > 1) {
        // For cumulative display, previous should be the cumulative count at previous level
        previousLevelCount = await User.countDocuments({
          role: 'Student',
          prospectusStage: { $gte: i - 1 },
          ...dateQuery
        });
      } else {
        // For level 1, previous should be current since all students are at least level 1
        // This gives 100% progression for level 1
        previousLevelCount = currentLevelCount;
      }
      
      // Calculate students who didn't progress from previous level
      const studentsNotProgressed = previousLevelCount - currentLevelCount;
      
      levelProgression[i] = {
        current: currentLevelCount,
        previous: previousLevelCount,
        notProgressed: studentsNotProgressed
      };
    }

    const overviewData = {
      totalEnquiries,
      admittedStudents,
      levelBreakdown,
      levelProgression
    };
    
    console.log('=== PRINCIPAL OVERVIEW RESPONSE ===');
    console.log('Level cards data:', JSON.stringify(levelBreakdown, null, 2));
    
    res.json({
      success: true,
      data: overviewData
    });

  } catch (error) {
    console.error('Error fetching principal overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overview statistics',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/enquiries/comprehensive-data
 * @desc    Get comprehensive enquiry data using single optimized aggregation
 * @access  Private (Principal only)
 */
router.get('/comprehensive-data', asyncHandler(async (req, res) => {
  console.log('Comprehensive data requested by user:', req.user.email, 'Role:', req.user.role);
  
  // Check if user is Principal or InstituteAdmin
  if (req.user.role !== 'Principal' && req.user.role !== 'InstituteAdmin') {
    return res.status(403).json({
      success: false,
      message: `Access denied. Principal privileges required. Your role: ${req.user.role}`
    });
  }

  try {
    const now = new Date();
    // Create consistent date boundaries for all calculations - ensure proper timezone handling
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    
    console.log('Date boundaries for level history filtering:');
    console.log('Today start:', todayStart);
    console.log('Today end:', todayEnd);
    console.log('Week start:', weekStart);
    console.log('Month start:', monthStart);
    console.log('Year start:', yearStart);
    
    // NEW PIPELINE: Use levelHistory and achievedOn dates instead of createdOn
    const pipeline = [
      {
        $match: {
          role: 'Student',
          prospectusStage: { $gte: 1, $lte: 5 },
          classId: { $exists: false },
          levelHistory: { $exists: true, $ne: [] }
        }
      },
      // Unwind levelHistory array to work with individual achievements
      { $unwind: '$levelHistory' },
      // Add time period categorization based on achievedOn dates
      {
        $addFields: {
          timePeriod: {
            $switch: {
              branches: [
                {
                  case: { $gte: ['$levelHistory.achievedOn', todayStart] },
                  then: 'today'
                },
                {
                  case: { $gte: ['$levelHistory.achievedOn', weekStart] },
                  then: 'week'
                },
                {
                  case: { $gte: ['$levelHistory.achievedOn', monthStart] },
                  then: 'month'
                },
                {
                  case: { $gte: ['$levelHistory.achievedOn', yearStart] },
                  then: 'year'
                }
              ],
              default: 'allTime'
            }
          }
        }
      },
      // Group by student and time period to get the highest level achieved in each period
      {
        $group: {
          _id: {
            studentId: '$_id',
            timePeriod: '$timePeriod'
          },
          maxLevel: { $max: '$levelHistory.level' },
          gender: { $first: '$gender' },
          program: { $first: '$program' }
        }
      },
      // Group by level and time period to count students
      {
        $group: {
          _id: {
            level: '$maxLevel',
            timePeriod: '$_id.timePeriod'
          },
          count: { $sum: 1 },
          students: {
            $push: {
              gender: '$gender',
              program: '$program'
            }
          }
        }
      }
    ];

    console.log('Executing level history based aggregation pipeline...');
    
    // First, let's check if we have any students with levelHistory data
    const studentsWithLevelHistory = await User.countDocuments({
      role: 'Student',
      prospectusStage: { $gte: 1, $lte: 5 },
      classId: { $exists: false },
      levelHistory: { $exists: true, $ne: [] }
    });
    console.log(`Found ${studentsWithLevelHistory} students with levelHistory data`);
    
    // Check for students with recent level achievements
    const recentAchievements = await User.aggregate([
      {
        $match: {
          role: 'Student',
          prospectusStage: { $gte: 1, $lte: 5 },
          classId: { $exists: false },
          levelHistory: { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$levelHistory' },
      {
        $match: {
          'levelHistory.achievedOn': { $gte: todayStart }
        }
      },
      { $count: 'todayCount' }
    ]);
    console.log('Students with achievements today:', recentAchievements);
    
    const results = await User.aggregate(pipeline);
    console.log(`Level history aggregation returned ${results.length} result groups`);

    // Process results into the expected format
    const data = {
      allTime: { levelData: {}, levelProgression: {}, genderLevelProgression: { boys: {}, girls: {} } },
      dateRanges: {
        today: { levelData: {}, progression: {} },
        week: { levelData: {}, progression: {} },
        month: { levelData: {}, progression: {} },
        year: { levelData: {}, progression: {} }
      }
    };

    // Initialize level data structures
    for (let level = 1; level <= 5; level++) {
      data.allTime.levelData[level] = { total: 0, boys: 0, girls: 0, programs: { boys: {}, girls: {} } };
      data.allTime.levelProgression[level] = { current: 0, previous: 0, change: 0 };
      data.allTime.genderLevelProgression.boys[level] = { current: 0, previous: 0, change: 0 };
      data.allTime.genderLevelProgression.girls[level] = { current: 0, previous: 0, change: 0 };
      
      Object.keys(data.dateRanges).forEach(dateRange => {
        data.dateRanges[dateRange].levelData[level] = { total: 0, boys: 0, girls: 0, programs: { boys: {}, girls: {} } };
      });
    }

    // If no level history results, fall back to using createdOn dates as a backup
    if (results.length === 0) {
      console.log('No level history results found, falling back to createdOn dates...');
      
      const fallbackPipeline = [
        {
          $match: {
            role: 'Student',
            prospectusStage: { $gte: 1, $lte: 5 },
            classId: { $exists: false }
          }
        },
        {
          $addFields: {
            timePeriod: {
              $switch: {
                branches: [
                  {
                    case: { $gte: ['$createdOn', todayStart] },
                    then: 'today'
                  },
                  {
                    case: { $gte: ['$createdOn', weekStart] },
                    then: 'week'
                  },
                  {
                    case: { $gte: ['$createdOn', monthStart] },
                    then: 'month'
                  },
                  {
                    case: { $gte: ['$createdOn', yearStart] },
                    then: 'year'
                  }
                ],
                default: 'allTime'
              }
            }
          }
        },
        {
          $group: {
            _id: {
              level: '$prospectusStage',
              timePeriod: '$timePeriod'
            },
            count: { $sum: 1 },
            students: {
              $push: {
                gender: '$gender',
                program: '$program'
              }
            }
          }
        }
      ];
      
      const fallbackResults = await User.aggregate(fallbackPipeline);
      console.log(`Fallback aggregation returned ${fallbackResults.length} result groups`);
      
      // Process fallback results the same way
      fallbackResults.forEach(result => {
        const { level, timePeriod } = result._id;
        const count = result.count;
        const students = result.students;
        
        if (level < 1 || level > 5) return;
        
        console.log(`Processing fallback level ${level}, period ${timePeriod}, count: ${count}`);
        
        let boys = 0, girls = 0;
        const programs = { boys: {}, girls: {} };
        
        students.forEach(student => {
          const isGenderMale = student.gender === 'Male' || student.gender === 'male' || student.gender === 'M';
          const isGenderFemale = student.gender === 'Female' || student.gender === 'female' || student.gender === 'F';
          
          if (isGenderMale) {
            boys++;
            if (student.program) {
              programs.boys[student.program] = (programs.boys[student.program] || 0) + 1;
            }
          }
          if (isGenderFemale) {
            girls++;
            if (student.program) {
              programs.girls[student.program] = (programs.girls[student.program] || 0) + 1;
            }
          }
        });
        
        // Update all-time data
        data.allTime.levelData[level].total += count;
        data.allTime.levelData[level].boys += boys;
        data.allTime.levelData[level].girls += girls;
        
        Object.entries(programs.boys).forEach(([prog, cnt]) => {
          data.allTime.levelData[level].programs.boys[prog] = (data.allTime.levelData[level].programs.boys[prog] || 0) + cnt;
        });
        Object.entries(programs.girls).forEach(([prog, cnt]) => {
          data.allTime.levelData[level].programs.girls[prog] = (data.allTime.levelData[level].programs.girls[prog] || 0) + cnt;
        });
        
        // Update time period specific data
        if (timePeriod !== 'allTime' && data.dateRanges[timePeriod]) {
          data.dateRanges[timePeriod].levelData[level].total += count;
          data.dateRanges[timePeriod].levelData[level].boys += boys;
          data.dateRanges[timePeriod].levelData[level].girls += girls;
          
          Object.entries(programs.boys).forEach(([prog, cnt]) => {
            data.dateRanges[timePeriod].levelData[level].programs.boys[prog] = (data.dateRanges[timePeriod].levelData[level].programs.boys[prog] || 0) + cnt;
          });
          Object.entries(programs.girls).forEach(([prog, cnt]) => {
            data.dateRanges[timePeriod].levelData[level].programs.girls[prog] = (data.dateRanges[timePeriod].levelData[level].programs.girls[prog] || 0) + cnt;
          });
        }
      });
    } else {
      // Process level history aggregation results
      results.forEach(result => {
      const { level, timePeriod } = result._id;
      const count = result.count;
      const students = result.students;
      
      if (level < 1 || level > 5) return; // Skip invalid levels
      
      console.log(`Processing level ${level}, period ${timePeriod}, count: ${count}`);
      
      // Count gender breakdown
      let boys = 0, girls = 0;
      const programs = { boys: {}, girls: {} };
      
      students.forEach(student => {
        const isGenderMale = student.gender === 'Male' || student.gender === 'male' || student.gender === 'M';
        const isGenderFemale = student.gender === 'Female' || student.gender === 'female' || student.gender === 'F';
        
        if (isGenderMale) {
          boys++;
          if (student.program) {
            programs.boys[student.program] = (programs.boys[student.program] || 0) + 1;
          }
        }
        if (isGenderFemale) {
          girls++;
          if (student.program) {
            programs.girls[student.program] = (programs.girls[student.program] || 0) + 1;
          }
        }
      });
      
      // Update all-time data (includes all time periods)
      data.allTime.levelData[level].total += count;
      data.allTime.levelData[level].boys += boys;
      data.allTime.levelData[level].girls += girls;
      
      // Merge programs
      Object.entries(programs.boys).forEach(([prog, cnt]) => {
        data.allTime.levelData[level].programs.boys[prog] = (data.allTime.levelData[level].programs.boys[prog] || 0) + cnt;
      });
      Object.entries(programs.girls).forEach(([prog, cnt]) => {
        data.allTime.levelData[level].programs.girls[prog] = (data.allTime.levelData[level].programs.girls[prog] || 0) + cnt;
      });
      
      // Update time period specific data
      if (timePeriod !== 'allTime' && data.dateRanges[timePeriod]) {
        data.dateRanges[timePeriod].levelData[level].total += count;
        data.dateRanges[timePeriod].levelData[level].boys += boys;
        data.dateRanges[timePeriod].levelData[level].girls += girls;
        
        // Merge programs for time period
        Object.entries(programs.boys).forEach(([prog, cnt]) => {
          data.dateRanges[timePeriod].levelData[level].programs.boys[prog] = (data.dateRanges[timePeriod].levelData[level].programs.boys[prog] || 0) + cnt;
        });
        Object.entries(programs.girls).forEach(([prog, cnt]) => {
          data.dateRanges[timePeriod].levelData[level].programs.girls[prog] = (data.dateRanges[timePeriod].levelData[level].programs.girls[prog] || 0) + cnt;
        });
      }
    });
    } // Close the else block

    // Calculate cumulative counts for levels (level 1+ includes all levels 1-5, level 2+ includes 2-5, etc.)
    for (let level = 1; level <= 5; level++) {
      let cumulativeTotal = 0, cumulativeBoys = 0, cumulativeGirls = 0;
      const cumulativePrograms = { boys: {}, girls: {} };
      
      // Sum up all levels from current level to 5
      for (let l = level; l <= 5; l++) {
        cumulativeTotal += data.allTime.levelData[l].total;
        cumulativeBoys += data.allTime.levelData[l].boys;
        cumulativeGirls += data.allTime.levelData[l].girls;
        
        // Aggregate programs
        Object.entries(data.allTime.levelData[l].programs.boys).forEach(([prog, count]) => {
          cumulativePrograms.boys[prog] = (cumulativePrograms.boys[prog] || 0) + count;
        });
        Object.entries(data.allTime.levelData[l].programs.girls).forEach(([prog, count]) => {
          cumulativePrograms.girls[prog] = (cumulativePrograms.girls[prog] || 0) + count;
        });
      }
      
      // Update with cumulative data
      data.allTime.levelData[level] = {
        total: cumulativeTotal,
        boys: cumulativeBoys,
        girls: cumulativeGirls,
        programs: cumulativePrograms
      };
      
      // Do the same for date ranges
      Object.keys(data.dateRanges).forEach(dateRange => {
        let cumulativeTotal = 0, cumulativeBoys = 0, cumulativeGirls = 0;
        const cumulativePrograms = { boys: {}, girls: {} };
        
        for (let l = level; l <= 5; l++) {
          cumulativeTotal += data.dateRanges[dateRange].levelData[l].total;
          cumulativeBoys += data.dateRanges[dateRange].levelData[l].boys;
          cumulativeGirls += data.dateRanges[dateRange].levelData[l].girls;
          
          Object.entries(data.dateRanges[dateRange].levelData[l].programs.boys).forEach(([prog, count]) => {
            cumulativePrograms.boys[prog] = (cumulativePrograms.boys[prog] || 0) + count;
          });
          Object.entries(data.dateRanges[dateRange].levelData[l].programs.girls).forEach(([prog, count]) => {
            cumulativePrograms.girls[prog] = (cumulativePrograms.girls[prog] || 0) + count;
          });
        }
        
        data.dateRanges[dateRange].levelData[level] = {
          total: cumulativeTotal,
          boys: cumulativeBoys,
          girls: cumulativeGirls,
          programs: cumulativePrograms
        };
      });
    }

    // Calculate progression data for all levels
    console.log('Calculating progression data...');
    
    // All-time progression
    data.allTime.levelProgression = {};
    data.allTime.genderLevelProgression = { boys: {}, girls: {} };
    
    for (let level = 1; level <= 5; level++) {
      const currentTotal = data.allTime.levelData[level].total;
      const currentBoys = data.allTime.levelData[level].boys;
      const currentGirls = data.allTime.levelData[level].girls;
      
      // For level 1, previous = current (100% progression)
      // For other levels, previous = data from level-1
      const previousTotal = level === 1 ? currentTotal : data.allTime.levelData[level - 1].total;
      const previousBoys = level === 1 ? currentBoys : data.allTime.levelData[level - 1].boys;
      const previousGirls = level === 1 ? currentGirls : data.allTime.levelData[level - 1].girls;
      
      // Calculate non-progression (students who didn't advance to next level)
      const notProgressedTotal = previousTotal - currentTotal;
      const notProgressedBoys = previousBoys - currentBoys;
      const notProgressedGirls = previousGirls - currentGirls;
      
      data.allTime.levelProgression[level] = {
        current: currentTotal,
        previous: previousTotal,
        notProgressed: Math.max(0, notProgressedTotal)
      };
      
      data.allTime.genderLevelProgression.boys[level] = {
        current: currentBoys,
        previous: previousBoys,
        notProgressed: Math.max(0, notProgressedBoys)
      };
      
      data.allTime.genderLevelProgression.girls[level] = {
        current: currentGirls,
        previous: previousGirls,
        notProgressed: Math.max(0, notProgressedGirls)
      };
    }
    
    // Add progression data to date ranges as well
    Object.keys(data.dateRanges).forEach(dateRange => {
      data.dateRanges[dateRange].levelProgression = {};
      data.dateRanges[dateRange].genderLevelProgression = { boys: {}, girls: {} };
      
      for (let level = 1; level <= 5; level++) {
        const currentTotal = data.dateRanges[dateRange].levelData[level].total;
        const currentBoys = data.dateRanges[dateRange].levelData[level].boys;
        const currentGirls = data.dateRanges[dateRange].levelData[level].girls;
        
        const previousTotal = level === 1 ? currentTotal : data.dateRanges[dateRange].levelData[level - 1].total;
        const previousBoys = level === 1 ? currentBoys : data.dateRanges[dateRange].levelData[level - 1].boys;
        const previousGirls = level === 1 ? currentGirls : data.dateRanges[dateRange].levelData[level - 1].girls;
        
        const notProgressedTotal = previousTotal - currentTotal;
        const notProgressedBoys = previousBoys - currentBoys;
        const notProgressedGirls = previousGirls - currentGirls;
        
        data.dateRanges[dateRange].levelProgression[level] = {
          current: currentTotal,
          previous: previousTotal,
          notProgressed: Math.max(0, notProgressedTotal)
        };
        
        data.dateRanges[dateRange].genderLevelProgression.boys[level] = {
          current: currentBoys,
          previous: previousBoys,
          notProgressed: Math.max(0, notProgressedBoys)
        };
        
        data.dateRanges[dateRange].genderLevelProgression.girls[level] = {
          current: currentGirls,
          previous: previousGirls,
          notProgressed: Math.max(0, notProgressedGirls)
        };
      }
    });

    console.log('Data processing completed successfully');
    console.log('=== COMPREHENSIVE DATA SUMMARY ===');
    console.log('All-time level 1 total:', data.allTime.levelData[1].total);
    console.log('All-time level 2 total:', data.allTime.levelData[2].total);
    console.log('All-time level 3 total:', data.allTime.levelData[3].total);
    console.log('All-time level 4 total:', data.allTime.levelData[4].total);
    console.log('All-time level 5 total:', data.allTime.levelData[5].total);
    console.log('Today level 1 total:', data.dateRanges.today.levelData[1].total);
    console.log('Today level 2 total:', data.dateRanges.today.levelData[2].total);
    console.log('Today level 3 total:', data.dateRanges.today.levelData[3].total);
    console.log('Today level 4 total:', data.dateRanges.today.levelData[4].total);
    console.log('Today level 5 total:', data.dateRanges.today.levelData[5].total);
    console.log('Week level 1 total:', data.dateRanges.week.levelData[1].total);
    console.log('Month level 1 total:', data.dateRanges.month.levelData[1].total);
    console.log('Year level 1 total:', data.dateRanges.year.levelData[1].total);
    console.log('Progression data added for all levels');
    
    // DEBUG: Check if we have zero data across all time periods
    const allTimeTotal = Object.values(data.allTime.levelData).reduce((sum, level) => sum + level.total, 0);
    const todayTotal = Object.values(data.dateRanges.today.levelData).reduce((sum, level) => sum + level.total, 0);
    console.log('=== DATA VALIDATION ===');
    console.log('Total students all-time:', allTimeTotal);
    console.log('Total students today:', todayTotal);
    
    if (allTimeTotal === 0) {
      console.log('WARNING: No student data found. This suggests either:');
      console.log('1. No students in database with role="Student"');
      console.log('2. All students have classId (are enrolled)');
      console.log('3. No students have proper prospectusStage (1-5)');
      console.log('4. levelHistory system is not working properly');
    }

    res.json({
      success: true,
      data: data,
      message: 'Comprehensive enquiry data retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching comprehensive enquiry data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comprehensive enquiry data',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/enquiries/level-history-data
 * @desc    Get enquiry data based on level history progression (when levels were achieved)
 * @access  Private (Principal, InstituteAdmin, IT)
 */
router.get('/level-history-data', asyncHandler(async (req, res) => {
  console.log('Level history data requested by user:', req.user.email, 'Role:', req.user.role);
  
  // Allow Principal, InstituteAdmin, and IT users
  if (!['Principal', 'InstituteAdmin', 'ITAdmin', 'SystemAdmin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Insufficient privileges. Your role: ${req.user.role}`
    });
  }

  try {
    const { minLevel, dateFilter, startDate, endDate } = req.query;
    
    // Build aggregation pipeline for level history filtering
    let levelHistoryMatch = {
      role: 'Student',
      levelHistory: { $exists: true, $ne: [] }
    };

    // Apply date filter to level achievements
    let dateMatch = {};
    if (dateFilter && dateFilter !== 'all') {
      if (dateFilter === 'custom' && startDate && endDate) {
        const customStartDate = new Date(startDate);
        const customEndDate = new Date(endDate);
        customEndDate.setHours(23, 59, 59, 999);
        
        dateMatch['levelHistory.achievedOn'] = {
          $gte: customStartDate,
          $lte: customEndDate
        };
        console.log('Applied custom date filter to level history:', customStartDate, 'to', customEndDate);
      } else {
        const now = new Date();
        let filterStartDate;

        switch (dateFilter) {
          case 'today':
            filterStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            filterStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'year':
            filterStartDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            filterStartDate = null;
        }

        if (filterStartDate) {
          dateMatch['levelHistory.achievedOn'] = { $gte: filterStartDate };
          console.log('Applied date filter to level history:', dateFilter, 'Start date:', filterStartDate);
        }
      }
    }

    // Apply level filter
    if (minLevel && minLevel !== 'all') {
      dateMatch['levelHistory.level'] = { $gte: parseInt(minLevel) };
    }

    // Main aggregation pipeline
    const pipeline = [
      { $match: levelHistoryMatch },
      { $unwind: '$levelHistory' },
      { $match: dateMatch },
      {
        $group: {
          _id: '$_id',
          student: { $first: '$$ROOT' },
          maxLevel: { $max: '$levelHistory.level' },
          levelAchievements: { $push: '$levelHistory' }
        }
      },
      {
        $project: {
          _id: '$student._id',
          fullName: '$student.fullName',
          userName: '$student.userName',
          email: '$student.email',
          gender: '$student.gender',
          program: '$student.program',
          prospectusStage: '$maxLevel',
          createdOn: '$student.createdOn',
          updatedOn: '$student.updatedOn',
          campus: '$student.campus',
          levelHistory: '$levelAchievements'
        }
      },
      { $sort: { updatedOn: -1 } }
    ];

    console.log('Level history aggregation pipeline:', JSON.stringify(pipeline, null, 2));

    const students = await User.aggregate(pipeline);
    
    // Calculate statistics
    const totalEnquiries = students.length;
    const admittedStudents = students.filter(s => s.prospectusStage >= 5).length;
    
    // Level breakdown (cumulative)
    const levelBreakdown = {};
    for (let i = 1; i <= 5; i++) {
      levelBreakdown[`level${i}`] = students.filter(s => s.prospectusStage >= i).length;
    }

    // Gender breakdown by level
    const genderLevelBreakdown = {
      boys: {},
      girls: {}
    };

    for (let i = 1; i <= 5; i++) {
      genderLevelBreakdown.boys[`level${i}`] = students.filter(s => 
        s.prospectusStage >= i && s.gender === 'Male'
      ).length;
      genderLevelBreakdown.girls[`level${i}`] = students.filter(s => 
        s.prospectusStage >= i && s.gender === 'Female'
      ).length;
    }

    const responseData = {
      totalEnquiries,
      admittedStudents,
      levelBreakdown,
      genderLevelBreakdown,
      students: students.slice(0, 100), // Limit for performance
      totalStudents: students.length,
      dataSource: 'levelHistory', // Indicates this uses level history tracking
      message: 'Data based on when levels were actually achieved, not when students were created'
    };

    console.log('Level history data response summary:', {
      total: totalEnquiries,
      admitted: admittedStudents,
      levels: levelBreakdown,
      dataSource: 'levelHistory'
    });

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching level history data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching level history data',
      error: error.message
    });
  }
}));

// Removed monthly-stats route - now using comprehensive-data endpoint

// Removed daily-stats route - now using comprehensive-data endpoint

// Get students with level history date filtering for reports
router.get('/level-history-students', async (req, res) => {
  try {
    const { dateFilter, startDate, endDate, nonProgression, progressionLevel } = req.query;
    
    let matchCondition = {
      role: 'Student'
    };
    
    // Add date filtering based on level history
    if (dateFilter && dateFilter !== 'all') {
      let dateCondition = {};
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          // Use the same date calculation as comprehensive-data for consistency
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          dateCondition = {
            $gte: startOfDay,
            $lt: endOfDay // Use $lt instead of $lte for end of day
          };
          break;
          
        case 'week':
          const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateCondition = {
            $gte: startOfWeek,
            $lte: now
          };
          break;
          
        case 'month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          dateCondition = {
            $gte: startOfMonth,
            $lte: now
          };
          break;
          
        case 'year':
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          dateCondition = {
            $gte: startOfYear,
            $lte: now
          };
          break;
          
        case 'custom':
          if (startDate && endDate) {
            dateCondition = {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            };
          }
          break;
      }
      
      // Use createdOn for date filtering to match principal enquiry behavior
      // This ensures students created today are included in "today" results
      if (Object.keys(dateCondition).length > 0) {
        matchCondition['createdOn'] = dateCondition;
      }
    }
    
    // Add non-progression filtering
    if (nonProgression === 'true' && progressionLevel) {
      const levelNum = parseInt(progressionLevel);
      const sinceDate = new Date();
      sinceDate.setMonth(sinceDate.getMonth() - 1); // 1 month ago
      
      matchCondition.prospectusStage = { $lte: levelNum };
      matchCondition.createdOn = { $lte: sinceDate };
    }
    
    const students = await User.find(matchCondition)
      .sort({ createdOn: -1 })
      .lean();
    
    res.json({
      success: true,
      data: {
        users: students
      }
    });
    
  } catch (error) {
    console.error('Error fetching level history students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students with level history filtering'
    });
  }
});

/**
 * @route   GET /api/enquiries/monthly-breakdown/:year
 * @desc    Get monthly breakdown of enquiry data for a specific year
 * @access  Private (Principal only)
 */
router.get('/monthly-breakdown/:year', asyncHandler(async (req, res) => {
  console.log('Monthly breakdown requested by user:', req.user.email, 'Role:', req.user.role, 'Year:', req.params.year);
  
  // Check if user is Principal or InstituteAdmin
  if (req.user.role !== 'Principal' && req.user.role !== 'InstituteAdmin') {
    return res.status(403).json({
      success: false,
      message: `Access denied. Principal privileges required. Your role: ${req.user.role}`
    });
  }

  const year = parseInt(req.params.year) || new Date().getFullYear();
  
  try {
    // Create date boundaries for the requested year
    const yearStart = new Date(year, 0, 1); // January 1st of the requested year
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st of the requested year
    
    console.log('Year boundaries for monthly breakdown:');
    console.log('Year start:', yearStart);
    console.log('Year end:', yearEnd);
    
    // Pipeline to get monthly breakdown
    const pipeline = [
      {
        $match: {
          role: 'Student',
          prospectusStage: { $gte: 1, $lte: 5 },
          classId: { $exists: false },
          levelHistory: { $exists: true, $ne: [] },
          // Filter by the requested year
          'levelHistory.achievedOn': { $gte: yearStart, $lte: yearEnd }
        }
      },
      // Unwind levelHistory array to work with individual achievements
      { $unwind: '$levelHistory' },
      // Filter again to ensure we only get achievements from the requested year
      {
        $match: {
          'levelHistory.achievedOn': { $gte: yearStart, $lte: yearEnd }
        }
      },
      // Add month extraction for grouping
      {
        $addFields: {
          month: { $month: '$levelHistory.achievedOn' },
          day: { $dayOfMonth: '$levelHistory.achievedOn' }
        }
      },
      // Group by level and month to count students
      {
        $group: {
          _id: {
            level: '$levelHistory.level',
            month: '$month',
            day: '$day'
          },
          count: { $sum: 1 }
        }
      },
      // Reshape for easier consumption by frontend
      {
        $group: {
          _id: {
            month: '$_id.month',
            day: '$_id.day'
          },
          levels: {
            $push: {
              level: '$_id.level',
              count: '$count'
            }
          },
          totalCount: { $sum: '$count' }
        }
      },
      // Final reshaping for the response
      {
        $group: {
          _id: '$_id.month',
          days: {
            $push: {
              day: '$_id.day',
              levels: '$levels',
              totalCount: '$totalCount'
            }
          },
          monthlyTotal: { $sum: '$totalCount' }
        }
      },
      // Sort by month
      { $sort: { _id: 1 } },
      // Project to final format
      {
        $project: {
          _id: 0,
          month: '$_id',
          days: 1,
          monthlyTotal: 1,
          level1: {
            $sum: {
              $map: {
                input: '$days',
                as: 'day',
                in: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$$day.levels',
                          as: 'level',
                          cond: { $eq: ['$$level.level', 1] }
                        }
                      },
                      as: 'filteredLevel',
                      in: '$$filteredLevel.count'
                    }
                  }
                }
              }
            }
          },
          level2: {
            $sum: {
              $map: {
                input: '$days',
                as: 'day',
                in: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$$day.levels',
                          as: 'level',
                          cond: { $eq: ['$$level.level', 2] }
                        }
                      },
                      as: 'filteredLevel',
                      in: '$$filteredLevel.count'
                    }
                  }
                }
              }
            }
          },
          level3: {
            $sum: {
              $map: {
                input: '$days',
                as: 'day',
                in: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$$day.levels',
                          as: 'level',
                          cond: { $eq: ['$$level.level', 3] }
                        }
                      },
                      as: 'filteredLevel',
                      in: '$$filteredLevel.count'
                    }
                  }
                }
              }
            }
          },
          level4: {
            $sum: {
              $map: {
                input: '$days',
                as: 'day',
                in: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$$day.levels',
                          as: 'level',
                          cond: { $eq: ['$$level.level', 4] }
                        }
                      },
                      as: 'filteredLevel',
                      in: '$$filteredLevel.count'
                    }
                  }
                }
              }
            }
          },
          level5: {
            $sum: {
              $map: {
                input: '$days',
                as: 'day',
                in: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$$day.levels',
                          as: 'level',
                          cond: { $eq: ['$$level.level', 5] }
                        }
                      },
                      as: 'filteredLevel',
                      in: '$$filteredLevel.count'
                    }
                  }
                }
              }
            }
          }
        }
      }
    ];

    const result = await User.aggregate(pipeline);
    
    // Process the result to ensure all months are included (1-12)
    const months = [];
    for (let i = 1; i <= 12; i++) {
      const month = result.find(m => m.month === i) || { 
        month: i, 
        days: [], 
        monthlyTotal: 0,
        level1: 0,
        level2: 0,
        level3: 0,
        level4: 0,
        level5: 0
      };
      months.push(month);
    }

    // Add month names for convenience
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const formattedResult = {
      year,
      months: months.map(month => ({
        ...month,
        name: monthNames[month.month - 1]
      }))
    };

    return res.json({
      success: true,
      data: formattedResult
    });
  } catch (error) {
    console.error('Error fetching monthly breakdown:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching monthly breakdown',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/enquiries/debug-data
 * @desc    Debug route to check what data exists
 * @access  Private (Principal only)
 */
router.get('/debug-data', asyncHandler(async (req, res) => {
  console.log('Debug data requested by user:', req.user.email, 'Role:', req.user.role);
  
  // Check if user is Principal or InstituteAdmin
  if (req.user.role !== 'Principal' && req.user.role !== 'InstituteAdmin') {
    return res.status(403).json({
      success: false,
      message: `Access denied. Principal privileges required. Your role: ${req.user.role}`
    });
  }

  try {
    // Check total students
    const totalStudents = await User.countDocuments({ role: 'Student' });
    
    // Check students with levelHistory
    const studentsWithLevelHistory = await User.countDocuments({ 
      role: 'Student',
      levelHistory: { $exists: true, $ne: [] }
    });
    
    // Check students with prospectusStage 1-5 and no classId
    const enquiryStudents = await User.countDocuments({
      role: 'Student',
      prospectusStage: { $gte: 1, $lte: 5 },
      classId: { $exists: false }
    });
    
    // Sample of students with levelHistory
    const sampleStudents = await User.find({ 
      role: 'Student',
      levelHistory: { $exists: true, $ne: [] }
    }).select('name email prospectusStage levelHistory createdAt').limit(5);
    
    // Check recent levelHistory entries
    const recentLevelHistory = await User.aggregate([
      { $match: { role: 'Student', levelHistory: { $exists: true, $ne: [] } } },
      { $unwind: '$levelHistory' },
      { $sort: { 'levelHistory.achievedOn': -1 } },
      { $limit: 10 },
      { $project: { 
        name: 1, 
        email: 1, 
        'levelHistory.level': 1, 
        'levelHistory.achievedOn': 1 
      }}
    ]);

    return res.json({
      success: true,
      data: {
        totalStudents,
        studentsWithLevelHistory,
        enquiryStudents,
        sampleStudents,
        recentLevelHistory
      }
    });
  } catch (error) {
    console.error('Error in debug route:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in debug route',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/enquiries/daily-breakdown/:year/:month
 * @desc    Get daily breakdown of enquiry data for a specific month and year
 * @access  Private (Principal only)
 */
router.get('/daily-breakdown/:year/:month', asyncHandler(async (req, res) => {
  console.log('Daily breakdown requested by user:', req.user.email, 'Role:', req.user.role, 'Year:', req.params.year, 'Month:', req.params.month);
  
  // Check if user is Principal or InstituteAdmin
  if (req.user.role !== 'Principal' && req.user.role !== 'InstituteAdmin') {
    return res.status(403).json({
      success: false,
      message: `Access denied. Principal privileges required. Your role: ${req.user.role}`
    });
  }

  const year = parseInt(req.params.year) || new Date().getFullYear();
  const month = parseInt(req.params.month); // 1-based month (1 = January, 12 = December)
  
  if (!month || month < 1 || month > 12) {
    return res.status(400).json({
      success: false,
      message: 'Invalid month. Month should be between 1 and 12.'
    });
  }
  
  try {
    // Create date boundaries for the requested month
    const monthStart = new Date(year, month - 1, 1); // First day of the month
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month
    
    console.log('Month boundaries for daily breakdown:');
    console.log('Month start:', monthStart);
    console.log('Month end:', monthEnd);
    
    // Pipeline to get daily breakdown
    const pipeline = [
      {
        $match: {
          role: 'Student',
          prospectusStage: { $gte: 1, $lte: 5 },
          classId: { $exists: false },
          levelHistory: { $exists: true, $ne: [] },
          // Filter by the requested month
          'levelHistory.achievedOn': { $gte: monthStart, $lte: monthEnd }
        }
      },
      // Unwind levelHistory array to work with individual achievements
      { $unwind: '$levelHistory' },
      // Filter again to ensure we only get achievements from the requested month
      {
        $match: {
          'levelHistory.achievedOn': { $gte: monthStart, $lte: monthEnd }
        }
      },
      // Add day extraction for grouping
      {
        $addFields: {
          day: { $dayOfMonth: '$levelHistory.achievedOn' }
        }
      },
      // Group by level and day to count students
      {
        $group: {
          _id: {
            level: '$levelHistory.level',
            day: '$day'
          },
          count: { $sum: 1 }
        }
      },
      // Reshape for easier consumption by frontend
      {
        $group: {
          _id: '$_id.day',
          levels: {
            $push: {
              level: '$_id.level',
              count: '$count'
            }
          },
          totalCount: { $sum: '$count' }
        }
      },
      // Sort by day
      { $sort: { _id: 1 } },
      // Project to final format
      {
        $project: {
          _id: 0,
          day: '$_id',
          levels: 1,
          totalCount: 1,
          level1: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$levels',
                    as: 'level',
                    cond: { $eq: ['$$level.level', 1] }
                  }
                },
                as: 'filteredLevel',
                in: '$$filteredLevel.count'
              }
            }
          },
          level2: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$levels',
                    as: 'level',
                    cond: { $eq: ['$$level.level', 2] }
                  }
                },
                as: 'filteredLevel',
                in: '$$filteredLevel.count'
              }
            }
          },
          level3: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$levels',
                    as: 'level',
                    cond: { $eq: ['$$level.level', 3] }
                  }
                },
                as: 'filteredLevel',
                in: '$$filteredLevel.count'
              }
            }
          },
          level4: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$levels',
                    as: 'level',
                    cond: { $eq: ['$$level.level', 4] }
                  }
                },
                as: 'filteredLevel',
                in: '$$filteredLevel.count'
              }
            }
          },
          level5: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$levels',
                    as: 'level',
                    cond: { $eq: ['$$level.level', 5] }
                  }
                },
                as: 'filteredLevel',
                in: '$$filteredLevel.count'
              }
            }
          }
        }
      }
    ];

    const result = await User.aggregate(pipeline);
    
    // Get the number of days in the requested month
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Process the result to ensure all days are included (1 to daysInMonth)
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const day = result.find(d => d.day === i) || { 
        day: i, 
        levels: [], 
        totalCount: 0,
        level1: 0,
        level2: 0,
        level3: 0,
        level4: 0,
        level5: 0
      };
      days.push(day);
    }

    // Month names for convenience
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const formattedResult = {
      year,
      month,
      monthName: monthNames[month - 1],
      daysInMonth,
      days
    };

    return res.json({
      success: true,
      data: formattedResult
    });
  } catch (error) {
    console.error('Error fetching daily breakdown:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching daily breakdown',
      error: error.message
    });
  }
}));

module.exports = router;
