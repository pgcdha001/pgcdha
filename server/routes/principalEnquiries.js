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
    
    // Single aggregation pipeline to get all data at once
    const pipeline = [
      {
        $match: {
          role: 'Student',
          prospectusStage: { $gte: 1, $lte: 5 }
        }
      },
      {
        $group: {
          _id: {
            level: '$prospectusStage',
            gender: '$gender',
            program: '$program',
            dateCategory: {
              $switch: {
                branches: [
                  {
                    case: { $gte: ['$createdOn', new Date(now.getFullYear(), now.getMonth(), now.getDate())] },
                    then: 'today'
                  },
                  {
                    case: { $gte: ['$createdOn', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)] },
                    then: 'week'
                  },
                  {
                    case: { $gte: ['$createdOn', new Date(now.getFullYear(), now.getMonth(), 1)] },
                    then: 'month'
                  },
                  {
                    case: { $gte: ['$createdOn', new Date(now.getFullYear(), 0, 1)] },
                    then: 'year'
                  }
                ],
                default: 'older'
              }
            }
          },
          count: { $sum: 1 }
        }
      }
    ];

    console.log('Executing optimized aggregation pipeline...');
    const results = await User.aggregate(pipeline);
    console.log(`Aggregation returned ${results.length} result groups`);

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

    // Process aggregation results
    results.forEach(result => {
      const { level, gender, program, dateCategory } = result._id;
      const count = result.count;
      
      if (level < 1 || level > 5) return; // Skip invalid levels
      
      const isGenderMale = gender === 'Male' || gender === 'male' || gender === 'M';
      const isGenderFemale = gender === 'Female' || gender === 'female' || gender === 'F';
      
      // Update all-time data (includes all date categories)
      data.allTime.levelData[level].total += count;
      if (isGenderMale) data.allTime.levelData[level].boys += count;
      if (isGenderFemale) data.allTime.levelData[level].girls += count;
      
      // Update program data
      if (program) {
        if (isGenderMale) {
          data.allTime.levelData[level].programs.boys[program] = (data.allTime.levelData[level].programs.boys[program] || 0) + count;
        }
        if (isGenderFemale) {
          data.allTime.levelData[level].programs.girls[program] = (data.allTime.levelData[level].programs.girls[program] || 0) + count;
        }
      }
      
      // Update date range specific data
      if (dateCategory !== 'older') {
        data.dateRanges[dateCategory].levelData[level].total += count;
        if (isGenderMale) data.dateRanges[dateCategory].levelData[level].boys += count;
        if (isGenderFemale) data.dateRanges[dateCategory].levelData[level].girls += count;
        
        if (program) {
          if (isGenderMale) {
            data.dateRanges[dateCategory].levelData[level].programs.boys[program] = (data.dateRanges[dateCategory].levelData[level].programs.boys[program] || 0) + count;
          }
          if (isGenderFemale) {
            data.dateRanges[dateCategory].levelData[level].programs.girls[program] = (data.dateRanges[dateCategory].levelData[level].programs.girls[program] || 0) + count;
          }
        }
      }
    });

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
    console.log('All-time level 1 total:', data.allTime.levelData[1].total);
    console.log('Progression data added for all levels');

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
 * @route   GET /api/enquiries/monthly-stats
 * @desc    Get monthly level progression statistics for the current year
 * @access  Private (Principal only)
 */
router.get('/monthly-stats', asyncHandler(async (req, res) => {
  console.log('Monthly stats requested by user:', req.user.email, 'Role:', req.user.role);
  
  // Check if user is Principal or InstituteAdmin
  if (req.user.role !== 'Principal' && req.user.role !== 'InstituteAdmin') {
    return res.status(403).json({
      success: false,
      message: `Access denied. Principal privileges required. Your role: ${req.user.role}`
    });
  }

  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-based index
    
    // Generate months array
    const months = [];
    for (let i = 0; i <= currentMonth; i++) {
      const monthStart = new Date(currentYear, i, 1);
      const monthEnd = new Date(currentYear, i + 1, 0, 23, 59, 59, 999);
      
      months.push({
        month: i + 1,
        name: new Date(currentYear, i, 1).toLocaleString('default', { month: 'long' }),
        start: monthStart,
        end: monthEnd
      });
    }

    // Aggregate data for each month and level
    const monthlyData = {};
    
    for (const month of months) {
      const monthData = {};
      
      // Get statistics for each level (1-5)
      for (let level = 1; level <= 5; level++) {
        const count = await User.countDocuments({
          role: 'Student',
          prospectusStage: level,
          createdOn: {
            $gte: month.start,
            $lte: month.end
          }
        });
        
        monthData[`level${level}`] = count;
      }
      
      monthlyData[month.name] = monthData;
      console.log(`${month.name} data:`, monthData);
    }

    console.log('Final monthly data structure:', JSON.stringify(monthlyData, null, 2));

    res.json({
      success: true,
      data: {
        year: currentYear,
        monthlyData,
        months: months.map(m => m.name)
      },
      message: 'Monthly statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly statistics',
      error: error.message
    });
  }
}));

module.exports = router;
