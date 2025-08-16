const mongoose = require('mongoose');

const StudentAnalyticsSchema = new mongoose.Schema({
  // Student Reference
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Academic Year Context
  academicYear: {
    type: String,
    required: true,
    index: true
  },
  
  // Overall Performance Analytics
  overallAnalytics: {
    // Matriculation baseline
    matriculationPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    
    // Current overall performance
    currentOverallPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    
    // Zone classification
    overallZone: {
      type: String,
      enum: ['green', 'blue', 'yellow', 'red', 'unassigned', null],
      default: null,
      index: true
    },
    
    // Metadata
    totalCTsIncluded: {
      type: Number,
      default: 0
    },
    
    totalMarksObtained: {
      type: Number,
      default: 0
    },
    
    totalMaxMarks: {
      type: Number,
      default: 0
    },
    
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Subject-wise Performance Analytics
  subjectAnalytics: [{
    subjectName: {
      type: String,
      required: true,
      index: true
    },
    
    currentPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    
    zone: {
      type: String,
      enum: ['green', 'blue', 'yellow', 'red', 'unassigned', null],
      default: null,
      index: true
    },
    
    totalCTsIncluded: {
      type: Number,
      default: 0
    },
    
    totalMarksObtained: {
      type: Number,
      default: 0
    },
    
    totalMaxMarks: {
      type: Number,
      default: 0
    },
    
    // Track individual test results for detailed analysis
    testResults: [{
      testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test'
      },
      obtainedMarks: Number,
      totalMarks: Number,
      percentage: Number,
      testDate: Date,
      testType: String
    }],
    
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Class and Campus Context
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    index: true
  },
  
  grade: {
    type: String,
    enum: ['11th', '12th'],
    index: true
  },
  
  campus: {
    type: String,
    enum: ['Boys', 'Girls'],
    index: true
  },
  
  program: {
    type: String,
    index: true
  },
  
  // Calculation Metadata
  lastCalculated: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  calculatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Performance Tracking
  calculationHistory: [{
    calculatedAt: {
      type: Date,
      default: Date.now
    },
    overallZone: String,
    overallPercentage: Number,
    totalTestsIncluded: Number,
    trigger: {
      type: String,
      enum: ['manual', 'automatic', 'new_result', 'batch_update'],
      default: 'automatic'
    }
  }]
}, {
  timestamps: true,
  collection: 'studentanalytics'
});

// Compound Indexes for Performance
StudentAnalyticsSchema.index({ studentId: 1, academicYear: 1 }, { unique: true });
StudentAnalyticsSchema.index({ academicYear: 1, 'overallAnalytics.overallZone': 1 });
StudentAnalyticsSchema.index({ campus: 1, grade: 1, 'overallAnalytics.overallZone': 1 });
StudentAnalyticsSchema.index({ classId: 1, 'overallAnalytics.overallZone': 1 });
StudentAnalyticsSchema.index({ 'subjectAnalytics.subjectName': 1, 'subjectAnalytics.zone': 1 });

// Virtual for zone color mapping
StudentAnalyticsSchema.virtual('overallAnalytics.zoneColor').get(function() {
  const zoneColors = {
    'green': '#10B981',
    'blue': '#3B82F6', 
    'yellow': '#F59E0B',
    'red': '#EF4444',
    'unassigned': '#9CA3AF'
  };
  return zoneColors[this.overallAnalytics?.overallZone] || '#6B7280';
});

// Methods
StudentAnalyticsSchema.methods.calculateOverallZone = function(currentPercentage, matriculationPercentage) {
  const ZoneAnalyticsService = require('../services/zoneAnalyticsService');
  return ZoneAnalyticsService.calculateZone(currentPercentage, matriculationPercentage);
};

StudentAnalyticsSchema.methods.getPerformanceMatrix = function() {
  const User = mongoose.model('User');
  
  // Get matriculation data
  const matriculation = {
    overall: this.overallAnalytics?.matriculationPercentage || 0,
    subjects: {}
  };
  
  // Extract matriculation subjects if available from user data
  // This would need to be populated from the User model's academicRecords
  
  // Prepare CT results in matrix format
  const ctResults = [];
  const subjectNames = this.subjectAnalytics.map(sub => sub.subjectName);
  
  // Group test results by test date/name
  const testsByDate = {};
  
  this.subjectAnalytics.forEach(subject => {
    subject.testResults.forEach(test => {
      const testKey = `${test.testDate.toISOString().split('T')[0]}_${test.testType}`;
      if (!testsByDate[testKey]) {
        testsByDate[testKey] = {
          testName: `${test.testType} (${test.testDate.toLocaleDateString()})`,
          testDate: test.testDate,
          subjects: {},
          overall: 0
        };
      }
      testsByDate[testKey].subjects[subject.subjectName] = {
        percentage: test.percentage,
        zone: this.calculateOverallZone(test.percentage, this.overallAnalytics.matriculationPercentage)
      };
    });
  });
  
  // Calculate overall percentages for each test
  Object.keys(testsByDate).forEach(testKey => {
    const test = testsByDate[testKey];
    const subjectPercentages = Object.values(test.subjects).map(s => s.percentage);
    if (subjectPercentages.length > 0) {
      test.overall = subjectPercentages.reduce((sum, p) => sum + p, 0) / subjectPercentages.length;
      test.overallZone = this.calculateOverallZone(test.overall, this.overallAnalytics.matriculationPercentage);
    }
  });
  
  // Sort tests by date
  const sortedTests = Object.values(testsByDate).sort((a, b) => a.testDate - b.testDate);
  
  // Calculate current averages
  const currentAverages = {
    overall: this.overallAnalytics?.currentOverallPercentage || 0,
    subjects: {}
  };
  
  this.subjectAnalytics.forEach(subject => {
    currentAverages.subjects[subject.subjectName] = {
      percentage: subject.currentPercentage,
      zone: subject.zone
    };
  });
  
  // Calculate trend analysis
  const trendAnalysis = {
    overall: matriculation.overall > 0 ? 
      Math.round((currentAverages.overall - matriculation.overall) * 100) / 100 : 0,
    subjects: {}
  };
  
  this.subjectAnalytics.forEach(subject => {
    const matricSubject = matriculation.subjects[subject.subjectName];
    if (matricSubject) {
      trendAnalysis.subjects[subject.subjectName] = 
        Math.round((subject.currentPercentage - matricSubject) * 100) / 100;
    } else {
      trendAnalysis.subjects[subject.subjectName] = 'N/A';
    }
  });
  
  return {
    matriculationBaseline: matriculation,
    classTestResults: sortedTests,
    currentAverages,
    trendAnalysis,
    zones: {
      overall: this.overallAnalytics?.overallZone,
      subjects: currentAverages.subjects
    }
  };
};

StudentAnalyticsSchema.methods.getGraphData = function() {
  const matrix = this.getPerformanceMatrix();
  
  // Prepare data for time-series graph
  const timelineData = [];
  
  // Add matriculation as baseline
  if (matrix.matriculationBaseline.overall > 0) {
    timelineData.push({
      label: 'Matriculation',
      date: null,
      percentage: matrix.matriculationBaseline.overall,
      type: 'baseline',
      zone: this.calculateOverallZone(matrix.matriculationBaseline.overall, matrix.matriculationBaseline.overall)
    });
  }
  
  // Add CT results
  matrix.classTestResults.forEach((test, index) => {
    timelineData.push({
      label: test.testName,
      date: test.testDate,
      percentage: Math.round(test.overall * 100) / 100,
      type: 'classtest',
      zone: test.overallZone,
      testNumber: index + 1
    });
  });
  
  // Prepare subject-wise data
  const subjectGraphData = {};
  this.subjectAnalytics.forEach(subject => {
    subjectGraphData[subject.subjectName] = subject.testResults.map(test => ({
      label: `${test.testType} (${test.testDate.toLocaleDateString()})`,
      date: test.testDate,
      percentage: test.percentage,
      zone: this.calculateOverallZone(test.percentage, this.overallAnalytics.matriculationPercentage)
    }));
  });
  
  return {
    overallTimeline: timelineData,
    subjectTimelines: subjectGraphData,
    zoneThresholds: {
      green: { min: 76, max: 84 },
      blue: { min: 71, max: 75 },
      yellow: { min: 66, max: 70 },
      red: { min: 0, max: 65 }
    }
  };
};

StudentAnalyticsSchema.methods.generateExportData = function(format = 'json') {
  const matrix = this.getPerformanceMatrix();
  const graphData = this.getGraphData();
  
  const exportData = {
    studentInfo: {
      id: this.studentId,
      academicYear: this.academicYear,
      class: this.classId,
      grade: this.grade,
      campus: this.campus,
      program: this.program
    },
    performanceMatrix: matrix,
    graphData: graphData,
    generatedAt: new Date(),
    dataVersion: '1.0'
  };
  
  if (format === 'csv') {
    return this.convertToCSV(matrix);
  } else if (format === 'excel') {
    return this.convertToExcel(matrix);
  }
  
  return exportData;
};

StudentAnalyticsSchema.methods.convertToCSV = function(matrix) {
  const rows = [];
  
  // Header row
  const subjects = Object.keys(matrix.currentAverages.subjects);
  const headers = ['Test/Exam', ...subjects, 'Overall'];
  rows.push(headers.join(','));
  
  // Matriculation row
  if (matrix.matriculationBaseline.overall > 0) {
    const matricRow = ['Matriculation'];
    subjects.forEach(subject => {
      matricRow.push(matrix.matriculationBaseline.subjects[subject] || 'N/A');
    });
    matricRow.push(matrix.matriculationBaseline.overall);
    rows.push(matricRow.join(','));
  }
  
  // CT rows
  matrix.classTestResults.forEach(test => {
    const testRow = [test.testName];
    subjects.forEach(subject => {
      testRow.push(test.subjects[subject]?.percentage || 'N/A');
    });
    testRow.push(Math.round(test.overall * 100) / 100);
    rows.push(testRow.join(','));
  });
  
  // Current average row
  const avgRow = ['Current Average'];
  subjects.forEach(subject => {
    avgRow.push(matrix.currentAverages.subjects[subject]?.percentage || 'N/A');
  });
  avgRow.push(matrix.currentAverages.overall);
  rows.push(avgRow.join(','));
  
  return rows.join('\n');
};

StudentAnalyticsSchema.methods.updateOverallAnalytics = function(testResults) {
  if (!testResults || testResults.length === 0) {
    this.overallAnalytics.currentOverallPercentage = null;
    this.overallAnalytics.overallZone = 'unassigned';
    this.overallAnalytics.totalCTsIncluded = 0;
    return;
  }
  
  const totalObtained = testResults.reduce((sum, result) => sum + result.obtainedMarks, 0);
  const totalMaximum = testResults.reduce((sum, result) => sum + result.totalMarks, 0);
  
  if (totalMaximum > 0) {
    const percentage = (totalObtained / totalMaximum) * 100;
    this.overallAnalytics.currentOverallPercentage = Math.round(percentage * 100) / 100;
    this.overallAnalytics.overallZone = this.calculateOverallZone(
      percentage, 
      this.overallAnalytics.matriculationPercentage
    );
    this.overallAnalytics.totalCTsIncluded = testResults.length;
    this.overallAnalytics.totalMarksObtained = totalObtained;
    this.overallAnalytics.totalMaxMarks = totalMaximum;
  }
  
  this.overallAnalytics.lastUpdated = new Date();
};

StudentAnalyticsSchema.methods.updateSubjectAnalytics = function(subjectResults, programSubjects = []) {
  this.subjectAnalytics = [];
  
  // Group results by subject
  const subjectGroups = {};
  subjectResults.forEach(result => {
    const subject = result.subject;
    if (!subjectGroups[subject]) {
      subjectGroups[subject] = [];
    }
    subjectGroups[subject].push(result);
  });
  
  // Get all subjects (from results + program subjects)
  const allSubjects = new Set([...Object.keys(subjectGroups), ...programSubjects]);
  
  // Calculate analytics for each subject
  allSubjects.forEach(subjectName => {
    const results = subjectGroups[subjectName] || [];
    
    if (results.length > 0) {
      // Subject has test results
      const totalObtained = results.reduce((sum, result) => sum + result.obtainedMarks, 0);
      const totalMaximum = results.reduce((sum, result) => sum + result.totalMarks, 0);
      
      const percentage = (totalObtained / totalMaximum) * 100;
      
      // Try to get subject-specific matriculation baseline
      // For now, use overall matriculation as baseline since subject-specific data structure needs to be implemented
      const subjectMatricBaseline = this.overallAnalytics.matriculationPercentage;
      const zone = this.calculateOverallZone(percentage, subjectMatricBaseline);
      
      this.subjectAnalytics.push({
        subjectName,
        currentPercentage: Math.round(percentage * 100) / 100,
        zone,
        totalCTsIncluded: results.length,
        totalMarksObtained: totalObtained,
        totalMaxMarks: totalMaximum,
        testResults: results.map(result => ({
          testId: result.testId,
          obtainedMarks: result.obtainedMarks,
          totalMarks: result.totalMarks,
          percentage: result.percentage,
          testDate: result.testDate,
          testType: result.testType
        })),
        lastUpdated: new Date()
      });
    } else {
      // Subject has no test results yet - show as unassigned
      this.subjectAnalytics.push({
        subjectName,
        currentPercentage: null,
        zone: 'unassigned',
        totalCTsIncluded: 0,
        totalMarksObtained: 0,
        totalMaxMarks: 0,
        testResults: [],
        lastUpdated: new Date()
      });
    }
  });
};

// Static method to get program subjects for a student
StudentAnalyticsSchema.statics.getProgramSubjects = async function(student) {
  // Default subjects based on common programs
  const programSubjectsMap = {
    'ICS': ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English', 'Urdu'],
    'ICS-PHY': ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English', 'Urdu'],
    'Pre-Engineering': ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English', 'Urdu'],
    'Pre-Medical': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Urdu'],
    'FA': ['Economics', 'Psychology', 'Sociology', 'Mathematics', 'English', 'Urdu'],
    'Commerce': ['Accounting', 'Economics', 'Business Studies', 'Mathematics', 'English', 'Urdu']
  };
  
  // Try to get subjects from student's program
  const program = student.program || student.admissionInfo?.program;
  let subjects = programSubjectsMap[program] || [];
  
  // If no subjects found from program, try from class
  if (subjects.length === 0 && student.classId) {
    const Class = mongoose.model('Class');
    const classData = await Class.findById(student.classId).select('subjects program');
    if (classData?.subjects && classData.subjects.length > 0) {
      subjects = classData.subjects;
    } else if (classData?.program) {
      subjects = programSubjectsMap[classData.program] || [];
    }
  }
  
  // Default fallback subjects
  if (subjects.length === 0) {
    subjects = ['Mathematics', 'Physics', 'Chemistry', 'English', 'Urdu'];
  }
  
  return subjects;
};

// Static Methods
StudentAnalyticsSchema.statics.calculateForStudent = async function(studentId, academicYear = '2024-2025') {
  const TestResult = mongoose.model('TestResult');
  const Test = mongoose.model('Test');
  const User = mongoose.model('User');
  const Class = mongoose.model('Class');
  const AnalyticsPrerequisiteChecker = require('../services/analyticsPrerequisiteChecker');
  
  try {
    // Validate and auto-fix student data before calculation
    const validationResult = await AnalyticsPrerequisiteChecker.validateAndFix(studentId);
    if (!validationResult.success) {
      console.warn(`Analytics calculation for student ${studentId} has data quality issues:`, validationResult);
      // Continue with calculation despite issues, but log them
    }

    // Get student information (re-fetch after potential fixes)
    const student = await User.findById(studentId).populate('classId');
    if (!student) {
      throw new Error('Student not found');
    }
    
    // Get all test results for the student (Class Tests only)
    const testResults = await TestResult.find({
      studentId: studentId,
      isAbsent: false
    }).populate({
      path: 'testId',
      match: { testType: 'Class Test' },
      select: 'subject totalMarks testDate testType'
    });
    
    // Filter out results where test was not found (non-CT tests)
    const validResults = testResults.filter(result => result.testId);
    
    // Find or create analytics record
    let analytics = await this.findOne({ studentId, academicYear });
    if (!analytics) {
      analytics = new this({
        studentId,
        academicYear,
        classId: student.classId?._id,
        grade: student.classId?.grade || student.admissionInfo?.grade,
        campus: student.classId?.campus,
        program: student.classId?.program || student.program
      });
    }
    
    // Prepare data for calculations
    const resultsForCalculation = validResults.map(result => ({
      testId: result.testId._id,
      obtainedMarks: result.obtainedMarks,
      totalMarks: result.testId.totalMarks,
      percentage: result.percentage,
      testDate: result.testId.testDate,
      testType: result.testId.testType,
      subject: result.testId.subject
    }));
    
    // Calculate matriculation percentage if available (multiple sources)
    let matriculationPercentage = null;
    
    // Priority 1: Check matricMarks and matricTotal (legacy format)
    if (student.matricMarks && student.matricTotal) {
      matriculationPercentage = Math.round((student.matricMarks / student.matricTotal) * 10000) / 100;
      console.log(`Found legacy matric data: ${student.matricMarks}/${student.matricTotal} = ${matriculationPercentage}%`);
    } 
    // Priority 2: Check academicRecords.matriculation.percentage (new format - can be number or string)
    else if (student.academicRecords?.matriculation?.percentage !== undefined && student.academicRecords.matriculation.percentage !== null) {
      matriculationPercentage = parseFloat(student.academicRecords.matriculation.percentage);
      console.log(`Found academic records matric data: ${matriculationPercentage}%`);
    }
    // Priority 3: Calculate from academicRecords.matriculation.subjects
    else if (student.academicRecords?.matriculation?.subjects && student.academicRecords.matriculation.subjects.length > 0) {
      const totalObtained = student.academicRecords.matriculation.subjects.reduce((sum, subject) => 
        sum + (parseFloat(subject.obtainedMarks) || 0), 0);
      const totalMaximum = student.academicRecords.matriculation.subjects.reduce((sum, subject) => 
        sum + (parseFloat(subject.totalMarks) || 0), 0);
      
      if (totalMaximum > 0) {
        matriculationPercentage = Math.round((totalObtained / totalMaximum) * 10000) / 100;
        console.log(`Calculated matric data from subjects: ${totalObtained}/${totalMaximum} = ${matriculationPercentage}%`);
      }
    }
    
    if (matriculationPercentage !== null && !isNaN(matriculationPercentage)) {
      analytics.overallAnalytics.matriculationPercentage = matriculationPercentage;
      console.log(`✅ Set matriculation percentage for ${student.fullName?.firstName} ${student.fullName?.lastName}: ${matriculationPercentage}%`);
    } else {
      console.warn(`⚠️  No valid matriculation data found for student: ${student.fullName?.firstName} ${student.fullName?.lastName}`);
    }
    
    // Create subject placeholders based on student's program/class subjects
    const programSubjects = await this.getProgramSubjects(student);
    
    // Update analytics (even if no test results available)
    analytics.updateOverallAnalytics(validResults);
    analytics.updateSubjectAnalytics(validResults, programSubjects);
    
    // Add to calculation history
    analytics.calculationHistory.push({
      overallZone: analytics.overallAnalytics.overallZone,
      overallPercentage: analytics.overallAnalytics.currentOverallPercentage,
      totalTestsIncluded: analytics.overallAnalytics.totalCTsIncluded,
      trigger: 'manual'
    });
    
    // Keep only last 10 calculation history entries
    if (analytics.calculationHistory.length > 10) {
      analytics.calculationHistory = analytics.calculationHistory.slice(-10);
    }
    
    await analytics.save();
    return analytics;
  } catch (error) {
    console.error('Error calculating student analytics:', error);
    throw error;
  }
};

module.exports = mongoose.model('StudentAnalytics', StudentAnalyticsSchema);
