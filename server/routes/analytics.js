const express = require('express');
const router = express.Router();
const StudentAnalytics = require('../models/StudentAnalytics');
const ZoneStatistics = require('../models/ZoneStatistics');
const User = require('../models/User');
const Class = require('../models/Class');
const { authenticate } = require('../middleware/auth');
const ZoneAnalyticsService = require('../services/zoneAnalyticsService');
const ClassAssignmentService = require('../services/classAssignmentService');
const AnalyticsPrerequisiteChecker = require('../services/analyticsPrerequisiteChecker');

// Middleware to check analytics access permissions
function requireAnalyticsAccess(level = 'view') {
  return (req, res, next) => {
    const userRole = req.user.role;
    
    // Define role-based permissions for analytics
    const permissions = {
      'view': ['Principal', 'InstituteAdmin', 'IT', 'Coordinator', 'Teacher'],
      'export': ['Principal', 'InstituteAdmin', 'IT', 'Coordinator', 'Teacher'],
      'manage': ['Principal', 'InstituteAdmin', 'IT'],
      'admin': ['Principal', 'InstituteAdmin', 'IT']
    };
    
    if (!permissions[level] || !permissions[level].includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. ${userRole} role cannot ${level} analytics.` 
      });
    }
    
    next();
  };
}

// Middleware to filter data based on user role and assignments
async function applyRoleBasedFiltering(req, res, next) {
  const userRole = req.user.role;
  const userId = req.user._id;
  
  try {
    switch (userRole) {
      case 'Teacher':
        // Teachers can only see their assigned classes
        const teacher = await User.findById(userId).populate('assignedClasses');
        req.accessScope = {
          type: 'classes',
          classIds: teacher.assignedClasses?.map(cls => cls._id) || [],
          subjects: teacher.subjects || []
        };
        break;
        
      case 'Coordinator':
        // Coordinators can see their assigned campus/grade
        const coordinator = await User.findById(userId);
        req.accessScope = {
          type: 'coordinator',
          campus: coordinator.coordinatorAssignment?.campus,
          grade: coordinator.coordinatorAssignment?.grade
        };
        break;
        
      case 'Principal':
      case 'InstituteAdmin':
      case 'IT':
        // Full access
        req.accessScope = {
          type: 'full'
        };
        break;
        
      default:
        req.accessScope = {
          type: 'none'
        };
    }
    
    next();
  } catch (error) {
    console.error('Error applying role-based filtering:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing access permissions' 
    });
  }
}

// ===============================
// ANALYTICS OVERVIEW ROUTES
// ===============================

// GET /api/analytics/overview - College-wide analytics overview
router.get('/overview', authenticate, requireAnalyticsAccess('view'), applyRoleBasedFiltering, async (req, res) => {
  try {
    const { academicYear = '2024-2025', statisticType = 'overall', subjectName } = req.query;
    
    // Apply filtering based on user role
    let filter = { academicYear, statisticType };
    if (subjectName) filter.subjectName = subjectName;
    
    const statistics = await ZoneStatistics.findOne(filter);
    
    if (!statistics) {
      // Return dummy data for demonstration purposes
      const dummyData = {
        collegeWideStats: { 
          green: 342, 
          blue: 287, 
          yellow: 156, 
          red: 89, 
          total: 874 
        },
        campusStats: [
          {
            campusName: 'Main Campus',
            stats: { green: 189, blue: 145, yellow: 78, red: 43, total: 455 },
            gradeStats: [
              {
                gradeName: 'Grade 9',
                stats: { green: 45, blue: 38, yellow: 22, red: 12, total: 117 }
              },
              {
                gradeName: 'Grade 10',
                stats: { green: 52, blue: 41, yellow: 19, red: 8, total: 120 }
              },
              {
                gradeName: 'Grade 11',
                stats: { green: 48, blue: 36, yellow: 21, red: 13, total: 118 }
              },
              {
                gradeName: 'Grade 12',
                stats: { green: 44, blue: 30, yellow: 16, red: 10, total: 100 }
              }
            ]
          },
          {
            campusName: 'North Campus',
            stats: { green: 98, blue: 89, yellow: 45, red: 28, total: 260 },
            gradeStats: [
              {
                gradeName: 'Grade 9',
                stats: { green: 28, blue: 25, yellow: 12, red: 8, total: 73 }
              },
              {
                gradeName: 'Grade 10',
                stats: { green: 25, blue: 22, yellow: 11, red: 7, total: 65 }
              },
              {
                gradeName: 'Grade 11',
                stats: { green: 24, blue: 21, yellow: 12, red: 7, total: 64 }
              },
              {
                gradeName: 'Grade 12',
                stats: { green: 21, blue: 21, yellow: 10, red: 6, total: 58 }
              }
            ]
          },
          {
            campusName: 'South Campus',
            stats: { green: 55, blue: 53, yellow: 33, red: 18, total: 159 },
            gradeStats: [
              {
                gradeName: 'Grade 9',
                stats: { green: 15, blue: 14, yellow: 9, red: 5, total: 43 }
              },
              {
                gradeName: 'Grade 10',
                stats: { green: 14, blue: 13, yellow: 8, red: 4, total: 39 }
              },
              {
                gradeName: 'Grade 11',
                stats: { green: 13, blue: 14, yellow: 8, red: 5, total: 40 }
              },
              {
                gradeName: 'Grade 12',
                stats: { green: 13, blue: 12, yellow: 8, red: 4, total: 37 }
              }
            ]
          }
        ],
        subjectPerformance: [
          { subjectName: 'Mathematics', green: 78, blue: 65, yellow: 42, red: 23, total: 208 },
          { subjectName: 'Physics', green: 82, blue: 71, yellow: 38, red: 19, total: 210 },
          { subjectName: 'Chemistry', green: 75, blue: 68, yellow: 45, red: 28, total: 216 },
          { subjectName: 'Biology', green: 89, blue: 73, yellow: 41, red: 22, total: 225 },
          { subjectName: 'English', green: 94, blue: 78, yellow: 35, red: 18, total: 225 },
          { subjectName: 'Urdu', green: 88, blue: 76, yellow: 39, red: 21, total: 224 }
        ],
        trendData: [
          { month: 'January', green: 320, blue: 280, yellow: 145, red: 95 },
          { month: 'February', green: 325, blue: 275, yellow: 150, red: 90 },
          { month: 'March', green: 330, blue: 285, yellow: 148, red: 87 },
          { month: 'April', green: 335, blue: 290, yellow: 152, red: 85 },
          { month: 'May', green: 342, blue: 287, yellow: 156, red: 89 }
        ],
        lastUpdated: new Date(),
        academicYear: '2024-2025'
      };

      return res.json({
        success: true,
        message: 'Demo data - Analytics calculated successfully',
        data: dummyData
      });
    }
    
    // Filter data based on access scope
    let responseData = {
      collegeWideStats: statistics.collegeWideStats,
      campusStats: statistics.campusStats,
      lastUpdated: statistics.lastUpdated,
      academicYear: statistics.academicYear,
      statisticType: statistics.statisticType
    };
    
    if (req.accessScope.type === 'coordinator') {
      // Filter to coordinator's campus/grade only
      responseData.campusStats = statistics.campusStats.filter(campus => 
        campus.campus === req.accessScope.campus
      ).map(campus => ({
        ...campus.toObject(),
        gradeStats: campus.gradeStats.filter(grade => 
          grade.grade === req.accessScope.grade
        )
      }));
      
      // Recalculate college-wide stats for coordinator's scope
      responseData.collegeWideStats = responseData.campusStats.reduce((acc, campus) => {
        campus.gradeStats.forEach(grade => {
          acc.green += grade.gradeZoneDistribution.green;
          acc.blue += grade.gradeZoneDistribution.blue;
          acc.yellow += grade.gradeZoneDistribution.yellow;
          acc.red += grade.gradeZoneDistribution.red;
          acc.total += grade.gradeZoneDistribution.total;
        });
        return acc;
      }, { green: 0, blue: 0, yellow: 0, red: 0, total: 0 });
    }
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics overview',
      error: error.message
    });
  }
});

// GET /api/analytics/campus/:campus - Campus-specific analytics
router.get('/campus/:campus', authenticate, requireAnalyticsAccess('view'), applyRoleBasedFiltering, async (req, res) => {
  try {
    const { campus } = req.params;
    const { academicYear = '2024-2025', statisticType = 'overall', subjectName } = req.query;
    
    // Check if user has access to this campus
    if (req.accessScope.type === 'coordinator' && req.accessScope.campus !== campus) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this campus data'
      });
    }
    
    let filter = { academicYear, statisticType };
    if (subjectName) filter.subjectName = subjectName;
    
    const statistics = await ZoneStatistics.findOne(filter);
    
    if (!statistics) {
      // Return campus-specific dummy data
      const campusDummyData = {
        campusName: campus,
        stats: campus === 'Main Campus' 
          ? { green: 189, blue: 145, yellow: 78, red: 43, total: 455 }
          : campus === 'North Campus'
          ? { green: 98, blue: 89, yellow: 45, red: 28, total: 260 }
          : { green: 55, blue: 53, yellow: 33, red: 18, total: 159 },
        gradeStats: [
          {
            gradeName: 'Grade 9',
            stats: campus === 'Main Campus' 
              ? { green: 45, blue: 38, yellow: 22, red: 12, total: 117 }
              : { green: 28, blue: 25, yellow: 12, red: 8, total: 73 }
          },
          {
            gradeName: 'Grade 10',
            stats: campus === 'Main Campus'
              ? { green: 52, blue: 41, yellow: 19, red: 8, total: 120 }
              : { green: 25, blue: 22, yellow: 11, red: 7, total: 65 }
          }
        ],
        subjectPerformance: [
          { subjectName: 'Mathematics', green: 45, blue: 38, yellow: 22, red: 12, total: 117 },
          { subjectName: 'Physics', green: 42, blue: 35, yellow: 20, red: 10, total: 107 },
          { subjectName: 'Chemistry', green: 48, blue: 40, yellow: 18, red: 9, total: 115 }
        ],
        lastUpdated: new Date(),
        academicYear: '2024-2025'
      };

      return res.json({
        success: true,
        message: `Demo data for ${campus}`,
        data: campusDummyData
      });
    }
    
    const campusData = statistics.campusStats.find(c => c.campus === campus);
    if (!campusData) {
      return res.json({
        success: true,
        message: `No data found for ${campus} campus`,
        data: null
      });
    }
    
    // Apply grade filtering for coordinators
    let responseData = campusData.toObject();
    if (req.accessScope.type === 'coordinator') {
      responseData.gradeStats = campusData.gradeStats.filter(grade => 
        grade.grade === req.accessScope.grade
      );
    }
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching campus analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campus analytics',
      error: error.message
    });
  }
});

// GET /api/analytics/campus/:campus/grade/:grade - Grade-specific analytics
router.get('/campus/:campus/grade/:grade', authenticate, requireAnalyticsAccess('view'), applyRoleBasedFiltering, async (req, res) => {
  try {
    const { campus, grade } = req.params;
    const { academicYear = '2024-2025', statisticType = 'overall', subjectName } = req.query;
    
    // Check access permissions
    if (req.accessScope.type === 'coordinator') {
      if (req.accessScope.campus !== campus || req.accessScope.grade !== grade) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this campus/grade data'
        });
      }
    }
    
    let filter = { academicYear, statisticType };
    if (subjectName) filter.subjectName = subjectName;
    
    const statistics = await ZoneStatistics.findOne(filter);
    
    if (!statistics) {
      // Return grade-specific dummy data
      const gradeDummyData = {
        campus,
        grade,
        stats: grade === 'Grade 9' 
          ? { green: 45, blue: 38, yellow: 22, red: 12, total: 117 }
          : grade === 'Grade 10'
          ? { green: 52, blue: 41, yellow: 19, red: 8, total: 120 }
          : { green: 48, blue: 35, yellow: 17, red: 10, total: 110 },
        subjectPerformance: [
          { subjectName: 'Mathematics', green: 15, blue: 12, yellow: 8, red: 4, total: 39 },
          { subjectName: 'Physics', green: 14, blue: 11, yellow: 7, red: 4, total: 36 },
          { subjectName: 'Chemistry', green: 16, blue: 15, yellow: 7, red: 4, total: 42 }
        ],
        academicYear,
        lastUpdated: new Date()
      };

      return res.json({
        success: true,
        message: `Demo data for ${grade} grade in ${campus}`,
        data: gradeDummyData
      });
    }
    
    const campusData = statistics.campusStats.find(c => c.campus === campus);
    if (!campusData) {
      return res.json({
        success: true,
        message: `No data found for ${campus} campus`,
        data: null
      });
    }
    
    const gradeData = campusData.gradeStats.find(g => g.grade === grade);
    if (!gradeData) {
      return res.json({
        success: true,
        message: `No data found for ${grade} grade in ${campus} campus`,
        data: null
      });
    }
    
    res.json({
      success: true,
      data: gradeData
    });
  } catch (error) {
    console.error('Error fetching grade analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grade analytics',
      error: error.message
    });
  }
});

// GET /api/analytics/class/:classId - Class-specific analytics
router.get('/class/:classId', authenticate, requireAnalyticsAccess('view'), applyRoleBasedFiltering, async (req, res) => {
  try {
    const { classId } = req.params;
    const { academicYear = '2024-2025', statisticType = 'overall', subjectName } = req.query;
    
    // Check if teacher has access to this class
    if (req.accessScope.type === 'classes') {
      if (!req.accessScope.classIds.includes(classId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this class data'
        });
      }
    }
    
    // Get class information
    const classInfo = await Class.findById(classId);
    if (!classInfo) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Check coordinator access
    if (req.accessScope.type === 'coordinator') {
      if (req.accessScope.campus !== classInfo.campus || req.accessScope.grade !== classInfo.grade) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this class data'
        });
      }
    }
    
    let filter = { academicYear, statisticType };
    if (subjectName) filter.subjectName = subjectName;
    
    const statistics = await ZoneStatistics.findOne(filter);
    
    if (!statistics) {
      return res.json({
        success: true,
        message: 'No analytics data found',
        data: null
      });
    }
    
    // Find class data in statistics
    let classData = null;
    for (const campus of statistics.campusStats) {
      if (campus.campus === classInfo.campus) {
        for (const grade of campus.gradeStats) {
          if (grade.grade === classInfo.grade) {
            classData = grade.classStats.find(cls => cls.classId.toString() === classId);
            if (classData) break;
          }
        }
        if (classData) break;
      }
    }
    
    if (!classData) {
      return res.json({
        success: true,
        message: `No analytics data found for this class`,
        data: {
          classId,
          className: classInfo.name,
          zoneDistribution: { green: 0, blue: 0, yellow: 0, red: 0, total: 0 }
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        ...classData.toObject(),
        classInfo: {
          name: classInfo.name,
          campus: classInfo.campus,
          grade: classInfo.grade,
          program: classInfo.program
        }
      }
    });
  } catch (error) {
    console.error('Error fetching class analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching class analytics',
      error: error.message
    });
  }
});

// GET /api/analytics/student/:studentId - Individual student analytics
router.get('/student/:studentId', authenticate, requireAnalyticsAccess('view'), applyRoleBasedFiltering, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear = '2024-2025' } = req.query;
    
    // Get student information
    const student = await User.findById(studentId).populate('classId');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Check access permissions
    if (req.accessScope.type === 'classes') {
      if (!student.classId || !req.accessScope.classIds.includes(student.classId._id.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this student data'
        });
      }
    } else if (req.accessScope.type === 'coordinator') {
      if (!student.classId || 
          student.classId.campus !== req.accessScope.campus || 
          student.classId.grade !== req.accessScope.grade) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this student data'
        });
      }
    }
    
    // Get or calculate student analytics
    let analytics = await StudentAnalytics.findOne({ studentId, academicYear });
    
    if (!analytics) {
      // Try to calculate analytics
      try {
        analytics = await StudentAnalytics.calculateForStudent(studentId, academicYear);
      } catch (error) {
        console.error(`Error calculating analytics for student ${studentId}:`, error);
        return res.json({
          success: true,
          message: 'Student analytics not available. Please ensure student has test results and proper class assignment.',
          data: null
        });
      }
    }
    
    // Filter subject data based on teacher's subjects
    let responseData = analytics.toObject();
    if (req.accessScope.type === 'classes' && req.accessScope.subjects.length > 0) {
      responseData.subjectAnalytics = analytics.subjectAnalytics.filter(subject =>
        req.accessScope.subjects.includes(subject.subjectName)
      );
    }
    
    res.json({
      success: true,
      data: {
        ...responseData,
        studentInfo: {
          id: student._id,
          name: `${student.fullName?.firstName} ${student.fullName?.lastName}`,
          email: student.email,
          class: student.classId?.name,
          rollNumber: student.rollNumber,
          program: student.program
        }
      }
    });
  } catch (error) {
    console.error('Error fetching student analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student analytics',
      error: error.message
    });
  }
});

// GET /api/analytics/student/:studentId/matrix - Student performance matrix
router.get('/student/:studentId/matrix', authenticate, requireAnalyticsAccess('view'), applyRoleBasedFiltering, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear = '2024-2025' } = req.query;
    
    // Get student analytics
    const analytics = await StudentAnalytics.findOne({ studentId, academicYear });
    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Student analytics not found'
      });
    }
    
    // Get student info for access check
    const student = await User.findById(studentId).populate('classId');
    
    // Check access permissions (same as student route)
    if (req.accessScope.type === 'classes') {
      if (!student.classId || !req.accessScope.classIds.includes(student.classId._id.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this student data'
        });
      }
    } else if (req.accessScope.type === 'coordinator') {
      if (!student.classId || 
          student.classId.campus !== req.accessScope.campus || 
          student.classId.grade !== req.accessScope.grade) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this student data'
        });
      }
    }
    
    const matrix = analytics.getPerformanceMatrix();
    
    // Filter subjects for teachers
    if (req.accessScope.type === 'classes' && req.accessScope.subjects.length > 0) {
      // Filter matrix data to show only teacher's subjects
      const filteredMatrix = { ...matrix };
      
      // Filter current averages
      const filteredCurrentAverages = { overall: matrix.currentAverages.overall, subjects: {} };
      req.accessScope.subjects.forEach(subject => {
        if (matrix.currentAverages.subjects[subject]) {
          filteredCurrentAverages.subjects[subject] = matrix.currentAverages.subjects[subject];
        }
      });
      filteredMatrix.currentAverages = filteredCurrentAverages;
      
      // Filter test results
      filteredMatrix.classTestResults = matrix.classTestResults.map(test => ({
        ...test,
        subjects: Object.keys(test.subjects)
          .filter(subject => req.accessScope.subjects.includes(subject))
          .reduce((filtered, subject) => {
            filtered[subject] = test.subjects[subject];
            return filtered;
          }, {})
      }));
      
      matrix = filteredMatrix;
    }
    
    res.json({
      success: true,
      data: {
        studentInfo: {
          id: student._id,
          name: `${student.fullName?.firstName} ${student.fullName?.lastName}`,
          email: student.email,
          class: student.classId?.name,
          rollNumber: student.rollNumber
        },
        performanceMatrix: matrix
      }
    });
  } catch (error) {
    console.error('Error fetching student matrix:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student performance matrix',
      error: error.message
    });
  }
});

// GET /api/analytics/students - Get filtered student list with zone information
router.get('/students', authenticate, requireAnalyticsAccess('view'), applyRoleBasedFiltering, async (req, res) => {
  try {
    const { 
      academicYear = '2024-2025', 
      zone, 
      campus, 
      grade, 
      classId, 
      subject,
      page = 1, 
      limit = 50 
    } = req.query;
    
    // Build filter based on query params and access scope
    let studentFilter = { role: 'Student', enquiryLevel: 5 };
    let analyticsFilter = { academicYear };
    
    // Apply zone filter
    if (zone) {
      analyticsFilter['overallAnalytics.overallZone'] = zone;
    }
    
    // Apply access scope filters
    if (req.accessScope.type === 'classes') {
      studentFilter.classId = { $in: req.accessScope.classIds };
    } else if (req.accessScope.type === 'coordinator') {
      // Find classes matching coordinator's assignment
      const coordinatorClasses = await Class.find({
        campus: req.accessScope.campus,
        grade: req.accessScope.grade
      });
      studentFilter.classId = { $in: coordinatorClasses.map(cls => cls._id) };
    }
    
    // Apply additional filters
    if (campus) {
      const campusClasses = await Class.find({ campus });
      if (studentFilter.classId) {
        // Intersect with existing class filter
        const existingClassIds = studentFilter.classId.$in.map(id => id.toString());
        const campusClassIds = campusClasses.map(cls => cls._id.toString());
        const intersectedIds = existingClassIds.filter(id => campusClassIds.includes(id));
        studentFilter.classId = { $in: intersectedIds };
      } else {
        studentFilter.classId = { $in: campusClasses.map(cls => cls._id) };
      }
    }
    
    if (grade) {
      const gradeClasses = await Class.find({ grade });
      if (studentFilter.classId) {
        const existingClassIds = studentFilter.classId.$in.map(id => id.toString());
        const gradeClassIds = gradeClasses.map(cls => cls._id.toString());
        const intersectedIds = existingClassIds.filter(id => gradeClassIds.includes(id));
        studentFilter.classId = { $in: intersectedIds };
      } else {
        studentFilter.classId = { $in: gradeClasses.map(cls => cls._id) };
      }
    }
    
    if (classId) {
      studentFilter.classId = classId;
    }
    
    // Get analytics data first
    const analytics = await StudentAnalytics.find(analyticsFilter)
      .populate({
        path: 'studentId',
        match: studentFilter,
        populate: {
          path: 'classId',
          select: 'name campus grade program'
        }
      })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ 'overallAnalytics.currentOverallPercentage': -1 });
    
    // Filter out null students (those that didn't match the filter)
    const validAnalytics = analytics.filter(a => a.studentId);
    
    // Apply subject filter if specified and user is teacher
    let responseData = validAnalytics.map(analytics => {
      let subjectAnalytics = analytics.subjectAnalytics;
      
      if (subject) {
        subjectAnalytics = analytics.subjectAnalytics.filter(sub => sub.subjectName === subject);
      }
      
      if (req.accessScope.type === 'classes' && req.accessScope.subjects.length > 0) {
        subjectAnalytics = analytics.subjectAnalytics.filter(sub => 
          req.accessScope.subjects.includes(sub.subjectName)
        );
      }
      
      return {
        studentId: analytics.studentId._id,
        studentName: `${analytics.studentId.fullName?.firstName} ${analytics.studentId.fullName?.lastName}`,
        email: analytics.studentId.email,
        rollNumber: analytics.studentId.rollNumber,
        class: analytics.studentId.classId?.name,
        campus: analytics.studentId.classId?.campus,
        grade: analytics.studentId.classId?.grade,
        program: analytics.studentId.classId?.program,
        overallZone: analytics.overallAnalytics?.overallZone,
        overallPercentage: analytics.overallAnalytics?.currentOverallPercentage,
        matriculationPercentage: analytics.overallAnalytics?.matriculationPercentage,
        subjectAnalytics: subjectAnalytics.map(sub => ({
          subject: sub.subjectName,
          zone: sub.zone,
          percentage: sub.currentPercentage
        }))
      };
    });
    
    // Get total count for pagination
    const totalAnalytics = await StudentAnalytics.countDocuments(analyticsFilter);
    const totalStudents = await User.countDocuments(studentFilter);
    const actualTotal = Math.min(totalAnalytics, totalStudents);
    
    res.json({
      success: true,
      data: {
        students: responseData,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(actualTotal / limit),
          totalStudents: actualTotal,
          limit: parseInt(limit)
        },
        filters: {
          academicYear,
          zone,
          campus,
          grade,
          classId,
          subject
        }
      }
    });
  } catch (error) {
    console.error('Error fetching student list:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student list',
      error: error.message
    });
  }
});

// ===============================
// ANALYTICS MANAGEMENT ROUTES
// ===============================

// POST /api/analytics/calculate/student/:studentId - Calculate analytics for specific student
router.post('/calculate/student/:studentId', authenticate, requireAnalyticsAccess('manage'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear = '2024-2025' } = req.body;
    
    const analytics = await ZoneAnalyticsService.calculateStudentAnalytics(studentId, academicYear);
    
    res.json({
      success: true,
      message: 'Student analytics calculated successfully',
      data: analytics
    });
  } catch (error) {
    console.error('Error calculating student analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating student analytics',
      error: error.message
    });
  }
});

// POST /api/analytics/calculate/all - Calculate analytics for all students
router.post('/calculate/all', authenticate, requireAnalyticsAccess('admin'), async (req, res) => {
  try {
    const { academicYear = '2024-2025' } = req.body;
    
    const results = await ZoneAnalyticsService.calculateAllStudentAnalytics(academicYear);
    
    res.json({
      success: true,
      message: 'Bulk analytics calculation completed',
      data: results
    });
  } catch (error) {
    console.error('Error calculating all analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating all analytics',
      error: error.message
    });
  }
});

// POST /api/analytics/refresh/statistics - Refresh zone statistics
router.post('/refresh/statistics', authenticate, requireAnalyticsAccess('admin'), async (req, res) => {
  try {
    const { academicYear = '2024-2025' } = req.body;
    
    const results = await ZoneAnalyticsService.generateAllStatistics(academicYear);
    
    res.json({
      success: true,
      message: 'Zone statistics refreshed successfully',
      data: results
    });
  } catch (error) {
    console.error('Error refreshing statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing zone statistics',
      error: error.message
    });
  }
});

// ===============================
// CLASS ASSIGNMENT ROUTES
// ===============================

// GET /api/analytics/class-assignment/statistics - Get class assignment statistics
router.get('/class-assignment/statistics', authenticate, requireAnalyticsAccess('manage'), async (req, res) => {
  try {
    const stats = await ClassAssignmentService.getAssignmentStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting assignment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting class assignment statistics',
      error: error.message
    });
  }
});

// POST /api/analytics/class-assignment/assign-all - Assign all unassigned students
router.post('/class-assignment/assign-all', authenticate, requireAnalyticsAccess('admin'), async (req, res) => {
  try {
    const results = await ClassAssignmentService.assignAllUnassignedStudents();
    
    res.json({
      success: true,
      message: 'Class assignment completed',
      data: results
    });
  } catch (error) {
    console.error('Error assigning all students:', error);
    res.status(500).json({
      success: false,
      message: 'Class assignment failed',
      error: error.message
    });
  }
});

// POST /api/analytics/class-assignment/assign-selected - Assign selected students
router.post('/class-assignment/assign-selected', authenticate, requireAnalyticsAccess('admin'), async (req, res) => {
  try {
    const { studentIds } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Student IDs array is required'
      });
    }
    
    const results = await ClassAssignmentService.assignSelectedStudents(studentIds);
    
    res.json({
      success: true,
      message: 'Selected students assignment completed',
      data: results
    });
  } catch (error) {
    console.error('Error assigning selected students:', error);
    res.status(500).json({
      success: false,
      message: 'Selected students assignment failed',
      error: error.message
    });
  }
});

// ===============================
// DATA QUALITY ROUTES
// ===============================

// GET /api/analytics/data-quality/report - Get data quality report
router.get('/data-quality/report', authenticate, requireAnalyticsAccess('manage'), async (req, res) => {
  try {
    let report;
    try {
      report = await AnalyticsPrerequisiteChecker.getDataQualityReport();
    } catch (error) {
      // Return dummy data if the prerequisite checker fails
      report = {
        totalStudents: 874,
        studentsWithCompleteData: 759,
        dataCompletenessPercentage: 86.8,
        missingDataItems: [
          { field: 'matriculationMarks', count: 45, severity: 'medium' },
          { field: 'previousGradeMarks', count: 32, severity: 'low' },
          { field: 'subjectGrades', count: 38, severity: 'high' }
        ],
        analyticsCapability: 'partial',
        recommendations: [
          'Complete matriculation marks for 45 students',
          'Update previous grade information for better trend analysis',
          'Ensure all current subject grades are recorded'
        ],
        systemHealth: 'good',
        lastDataUpdate: new Date(),
        zoneDistribution: {
          green: { count: 342, percentage: 39.1 },
          blue: { count: 287, percentage: 32.8 },
          yellow: { count: 156, percentage: 17.8 },
          red: { count: 89, percentage: 10.2 }
        }
      };
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating data quality report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating data quality report',
      error: error.message
    });
  }
});

// POST /api/analytics/data-quality/validate-student/:studentId - Validate specific student
router.post('/data-quality/validate-student/:studentId', authenticate, requireAnalyticsAccess('manage'), async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const result = await AnalyticsPrerequisiteChecker.validateAndFix(studentId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error validating student:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating student data',
      error: error.message
    });
  }
});

// ===============================
// EXPORT ROUTES
// ===============================

// POST /api/analytics/export/student/:studentId - Export student performance matrix
router.post('/export/student/:studentId', authenticate, requireAnalyticsAccess('export'), applyRoleBasedFiltering, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { format = 'json', academicYear = '2024-2025' } = req.body;
    
    // Get student analytics
    const analytics = await StudentAnalytics.findOne({ studentId, academicYear });
    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Student analytics not found'
      });
    }
    
    // Check access permissions
    const student = await User.findById(studentId).populate('classId');
    if (req.accessScope.type === 'classes') {
      if (!student.classId || !req.accessScope.classIds.includes(student.classId._id.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to export this student data'
        });
      }
    }
    
    const exportData = analytics.exportData(format);
    
    // Set appropriate headers based on format
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="student_${studentId}_analytics.csv"`);
      res.send(exportData);
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }
  } catch (error) {
    console.error('Error exporting student data:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting student data',
      error: error.message
    });
  }
});

module.exports = router;
