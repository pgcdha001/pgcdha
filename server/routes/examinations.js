const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const TestResult = require('../models/TestResult');
const User = require('../models/User');
const Class = require('../models/Class');
const { authenticate } = require('../middleware/auth');

// Middleware to check if user has examination permissions
function requireExaminationAccess(permission) {
  return (req, res, next) => {
    const userRole = req.user.role;
    
    // Define role-based permissions for examinations
    const permissions = {
      'create_test': ['IT', 'InstituteAdmin'],
      'edit_test': ['IT', 'InstituteAdmin'],
      'delete_test': ['IT', 'InstituteAdmin'],
      'enter_marks': ['Teacher', 'IT', 'InstituteAdmin'],
      'view_analytics': ['Principal', 'IT', 'InstituteAdmin'],
      'manage_academic_records': ['IT', 'InstituteAdmin']
    };
    
    if (!permissions[permission] || !permissions[permission].includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. ${userRole} role cannot ${permission.replace('_', ' ')}.` 
      });
    }
    
    next();
  };
}

// ===============================
// TEST MANAGEMENT ROUTES
// ===============================

// Get all tests (with filters)
router.get('/tests', authenticate, async (req, res) => {
  try {
    const { 
      classId, 
      subject, 
      testType, 
      academicYear, 
      fromDate, 
      toDate,
      teacherId,
      page = 1,
      limit = 50
    } = req.query;
    
    // Build query
    let query = { isActive: true };
    
    if (classId) query.classId = classId;
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (testType) query.testType = testType;
    if (academicYear) query.academicYear = academicYear;
    if (teacherId) query.assignedTeacher = teacherId;
    
    // Date range filter
    if (fromDate || toDate) {
      query.testDate = {};
      if (fromDate) query.testDate.$gte = new Date(fromDate);
      if (toDate) query.testDate.$lte = new Date(toDate);
    }
    
    // Role-based filtering
    if (req.user.role === 'Teacher') {
      // For teachers, show tests where they are either:
      // 1. Assigned as the main teacher, OR
      // 2. Listed in the class teachers array for that subject
      
      if (req.query.forMarksEntry === 'true') {
        // For marks entry, we need more complex authorization
        const now = new Date();
        
        // First, get classes where this teacher can teach the subject
        const teacherClasses = await Class.find({
          $or: [
            { classIncharge: req.user._id },
            { 'teachers.teacherId': req.user._id, 'teachers.isActive': true }
          ]
        }).select('_id teachers');
        
        const classIds = teacherClasses.map(cls => cls._id);
        
        // Find tests in those classes where:
        // - Either assigned to this teacher OR teacher is in class teachers array
        // - Test date has passed
        // - Within marks entry deadline
        // - Test is active (no need for isPublished for marks entry)
        query = {
          isActive: true,
          classId: { $in: classIds },
          testDate: { $lte: now },
          $or: [
            { marksEntryDeadline: { $exists: false } },
            { marksEntryDeadline: null },
            { marksEntryDeadline: { $gte: now } }
          ]
        };
        
        console.log('Enhanced teacher marks entry filter:', {
          teacherId: req.user._id,
          classIds: classIds
        });
      } else {
        // Regular test viewing - show tests where teacher is assigned OR in class teachers array
        const teacherClasses = await Class.find({
          $or: [
            { classIncharge: req.user._id },
            { 'teachers.teacherId': req.user._id, 'teachers.isActive': true }
          ]
        }).select('_id teachers');
        
        const classIds = teacherClasses.map(cls => cls._id);
        
        // Show tests where teacher is either assigned OR teaching the class
        query.$or = [
          { assignedTeacher: req.user._id },
          { classId: { $in: classIds } }
        ];
        
        console.log('Enhanced teacher test viewing filter:', {
          teacherId: req.user._id,
          classIds: classIds,
          query: query
        });
      }
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    const tests = await Test.find(query)
      .populate('classId', 'name grade campus program')
      .populate('assignedTeacher', 'fullName userName')
      .populate('createdBy', 'fullName userName')
      .sort({ testDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Test.countDocuments(query);
    
    res.json({
      success: true,
      data: tests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tests', 
      error: error.message 
    });
  }
});

// Get single test by ID
router.get('/tests/:id', authenticate, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('classId', 'name grade campus program')
      .populate('assignedTeacher', 'fullName userName')
      .populate('createdBy', 'fullName userName');
    
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    
    // Check if user can access this test
    if (req.user.role === 'Teacher' && test.assignedTeacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied to this test' });
    }
    
    res.json({ success: true, data: test });
    
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching test', 
      error: error.message 
    });
  }
});

// Create new test
router.post('/tests', authenticate, requireExaminationAccess('create_test'), async (req, res) => {
  try {
    const {
      title,
      subject,
      classId,
      totalMarks,
      testDate,
      testType,
      instructions,
      duration,
      marksEntryDeadline,
      // Phase 3 fields
      difficulty,
      syllabusCoverage,
      assignedTeacher,
      isRetest,
      originalTestId,
      allowLateSubmission,
      lateSubmissionPenalty,
      tags,
      estimatedDuration,
      passingMarks
    } = req.body;
    
    // Validate required fields
    if (!title || !subject || !classId || !totalMarks || !testDate || !testType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, subject, classId, totalMarks, testDate, testType'
      });
    }
    
    // Check if class exists
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    
    // Auto-assign teacher if not provided
    let finalAssignedTeacher = assignedTeacher;
    if (!finalAssignedTeacher || finalAssignedTeacher === '') {
      const autoAssignedTeacher = await User.findOne({
        role: 'Teacher',
        'teachers.classId': classId,
        'teachers.subject': subject,
        'teachers.isActive': true
      });
      finalAssignedTeacher = autoAssignedTeacher ? autoAssignedTeacher._id : null;
    }
    
    // Create test
    const test = new Test({
      title,
      subject,
      classId,
      totalMarks,
      testDate: new Date(testDate),
      testType,
      instructions,
      duration: duration || estimatedDuration,
      marksEntryDeadline: marksEntryDeadline ? new Date(marksEntryDeadline) : undefined,
      createdBy: req.user._id,
      assignedTeacher: finalAssignedTeacher,
      // Phase 3 fields
      difficulty: difficulty || 'Medium',
      syllabusCoverage: syllabusCoverage || [],
      isRetest: isRetest || false,
      originalTestId: originalTestId || undefined,
      allowLateSubmission: allowLateSubmission || false,
      lateSubmissionPenalty: lateSubmissionPenalty || 0,
      tags: tags || [],
      estimatedDuration: estimatedDuration || 60,
      passingMarks: passingMarks || undefined
    });
    
    await test.save();
    
    // Populate the response
    await test.populate('classId', 'name grade campus program');
    await test.populate('assignedTeacher', 'fullName userName');
    await test.populate('createdBy', 'fullName userName');
    
    res.status(201).json({
      success: true,
      message: 'Test created successfully',
      data: test
    });
    
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating test', 
      error: error.message 
    });
  }
});

// Update test
router.put('/tests/:id', authenticate, requireExaminationAccess('edit_test'), async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    
    // Check if test has results - if yes, limit what can be updated
    const hasResults = await TestResult.countDocuments({ testId: req.params.id });
    if (hasResults > 0) {
      // Only allow updating certain fields if results exist
      const allowedFields = ['instructions', 'marksEntryDeadline', 'isActive'];
      const updateFields = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateFields[field] = req.body[field];
        }
      });
      
      Object.assign(test, updateFields);
    } else {
      // Update all fields if no results exist
      const updatedData = { ...req.body };
      
      // Handle empty assignedTeacher
      if (updatedData.assignedTeacher === '') {
        updatedData.assignedTeacher = null;
      }
      
      Object.assign(test, updatedData);
    }
    
    await test.save();
    
    // Populate the response
    await test.populate('classId', 'name grade campus program');
    await test.populate('assignedTeacher', 'fullName userName');
    await test.populate('createdBy', 'fullName userName');
    
    res.json({
      success: true,
      message: 'Test updated successfully',
      data: test
    });
    
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating test', 
      error: error.message 
    });
  }
});

// Delete test
router.delete('/tests/:id', authenticate, requireExaminationAccess('delete_test'), async (req, res) => {
  try {
    // Check if test has results
    const hasResults = await TestResult.countDocuments({ testId: req.params.id });
    if (hasResults > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete test with existing results'
      });
    }
    
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    
    res.json({
      success: true,
      message: 'Test deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting test', 
      error: error.message 
    });
  }
});

// ===============================
// TEST RESULTS ROUTES
// ===============================

// Get test results
router.get('/tests/:id/results', authenticate, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    
    // Check access permissions
    if (req.user.role === 'Teacher' && test.assignedTeacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied to this test' });
    }
    
    const results = await TestResult.find({ testId: req.params.id })
      .populate('studentId', 'fullName userName program')
      .populate('enteredBy', 'fullName userName')
      .sort({ 'studentId.fullName.firstName': 1 });
    
    res.json({
      success: true,
      data: results,
      test: {
        title: test.title,
        subject: test.subject,
        totalMarks: test.totalMarks,
        testDate: test.testDate
      }
    });
    
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching test results', 
      error: error.message 
    });
  }
});

// Enter/Update marks for a test
router.post('/tests/:id/results', authenticate, requireExaminationAccess('enter_marks'), async (req, res) => {
  try {
    const { results } = req.body; // Array of { studentId, obtainedMarks, isAbsent, remarks }
    
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Results array is required'
      });
    }
    
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    
    // Check if marks entry is allowed
    const canEnter = test.canEnterMarks();
    if (!canEnter.allowed) {
      return res.status(400).json({
        success: false,
        message: canEnter.reason
      });
    }
    
    // Enhanced teacher access check
    if (req.user.role === 'Teacher') {
      // Check if teacher is either assigned to test OR is in the class teachers array
      const isAssignedTeacher = test.assignedTeacher.toString() === req.user._id.toString();
      
      if (!isAssignedTeacher) {
        // Check if teacher is in the class teachers array for this subject
        const classDoc = await Class.findById(test.classId);
        const isClassTeacher = classDoc && classDoc.teachers.some(t => 
          t.teacherId.toString() === req.user._id.toString() && 
          t.isActive && 
          (!t.subject || t.subject.toLowerCase() === test.subject.toLowerCase())
        );
        
        if (!isClassTeacher) {
          return res.status(403).json({ 
            success: false, 
            message: 'Access denied. You are not authorized to enter marks for this test.' 
          });
        }
      }
    }
    
    const processedResults = [];
    const errors = [];
    
    for (const result of results) {
      try {
        const { studentId, obtainedMarks, isAbsent, remarks } = result;
        
        // Validate student exists and is in the class
        const student = await User.findOne({ 
          _id: studentId, 
          classId: test.classId,
          role: 'Student'
        });
        
        if (!student) {
          errors.push({ studentId, error: 'Student not found in this class' });
          continue;
        }
        
        // Create or update result
        const testResult = await TestResult.findOneAndUpdate(
          { testId: req.params.id, studentId },
          {
            obtainedMarks: isAbsent ? 0 : obtainedMarks,
            isAbsent: Boolean(isAbsent),
            remarks: remarks || '',
            enteredBy: req.user._id
          },
          { 
            upsert: true, 
            new: true,
            runValidators: true
          }
        );
        
        await testResult.populate('studentId', 'fullName userName');
        processedResults.push(testResult);
        
      } catch (error) {
        errors.push({ 
          studentId: result.studentId, 
          error: error.message 
        });
      }
    }
    
    res.json({
      success: true,
      message: `Processed ${processedResults.length} results successfully`,
      data: processedResults,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error entering test results:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error entering test results', 
      error: error.message 
    });
  }
});

// ===============================
// PHASE 3 ENHANCED ROUTES
// ===============================

// Check for duplicate tests
router.post('/tests/check-duplicate', authenticate, requireExaminationAccess('create_test'), async (req, res) => {
  try {
    const { classId, subject, testType, testDate, excludeId } = req.body;
    
    const duplicateTest = await Test.checkDuplicateTest({
      classId,
      subject,
      testType,
      testDate,
      _id: excludeId
    });
    
    res.json({
      success: true,
      isDuplicate: !!duplicateTest,
      duplicateTest: duplicateTest ? {
        _id: duplicateTest._id,
        title: duplicateTest.title,
        testDate: duplicateTest.testDate,
        totalMarks: duplicateTest.totalMarks
      } : null
    });
    
  } catch (error) {
    console.error('Error checking duplicate test:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error checking for duplicate tests', 
      error: error.message 
    });
  }
});

// Get available teachers for assignment
router.get('/teachers/available', authenticate, requireExaminationAccess('create_test'), async (req, res) => {
  try {
    const { subject, testDate } = req.query;
    
    const teachers = await Test.getAvailableTeachers(subject, testDate);
    
    res.json({
      success: true,
      data: teachers
    });
    
  } catch (error) {
    console.error('Error fetching available teachers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching available teachers', 
      error: error.message 
    });
  }
});

// Get tests by difficulty
router.get('/tests/difficulty/:difficulty', authenticate, async (req, res) => {
  try {
    const { difficulty } = req.params;
    const { academicYear } = req.query;
    
    const tests = await Test.getTestsByDifficulty(difficulty, academicYear);
    
    res.json({
      success: true,
      data: tests
    });
    
  } catch (error) {
    console.error('Error fetching tests by difficulty:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tests by difficulty', 
      error: error.message 
    });
  }
});

// Get advanced statistics
router.get('/stats/advanced', authenticate, requireExaminationAccess('view_analytics'), async (req, res) => {
  try {
    const filters = {
      academicYear: req.query.academicYear,
      classId: req.query.classId,
      subject: req.query.subject,
      testType: req.query.testType,
      difficulty: req.query.difficulty,
      assignedTeacher: req.query.assignedTeacher
    };
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });
    
    const stats = await Test.getAdvancedStats(filters);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error fetching advanced statistics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching advanced statistics', 
      error: error.message 
    });
  }
});

// Get tests requiring marks entry
router.get('/tests/marks-entry-required', authenticate, requireExaminationAccess('enter_marks'), async (req, res) => {
  try {
    const { teacherId } = req.query;
    
    const tests = await Test.getTestsRequiringMarksEntry(teacherId);
    
    res.json({
      success: true,
      data: tests
    });
    
  } catch (error) {
    console.error('Error fetching tests requiring marks entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tests requiring marks entry', 
      error: error.message 
    });
  }
});

// Create retest
router.post('/tests/:id/retest', authenticate, requireExaminationAccess('create_test'), async (req, res) => {
  try {
    const { id } = req.params;
    const retestData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const retest = await Test.createRetest(id, retestData);
    
    res.status(201).json({
      success: true,
      message: 'Retest created successfully',
      data: retest
    });
    
  } catch (error) {
    console.error('Error creating retest:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating retest', 
      error: error.message 
    });
  }
});

// Get calendar view data
router.get('/calendar', authenticate, async (req, res) => {
  try {
    const { month, year, classId, teacherId } = req.query;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const query = {
      testDate: { $gte: startDate, $lte: endDate },
      isActive: true
    };
    
    if (classId) query.classId = classId;
    if (teacherId) query.assignedTeacher = teacherId;
    
    const tests = await Test.find(query)
      .populate('classId', 'name grade program')
      .populate('assignedTeacher', 'fullName')
      .select('title testDate testType totalMarks duration difficulty')
      .sort({ testDate: 1 });
    
    // Group tests by date
    const calendarData = {};
    tests.forEach(test => {
      const dateKey = test.testDate.toISOString().split('T')[0];
      if (!calendarData[dateKey]) {
        calendarData[dateKey] = [];
      }
      calendarData[dateKey].push(test);
    });
    
    res.json({
      success: true,
      data: calendarData
    });
    
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching calendar data', 
      error: error.message 
    });
  }
});

module.exports = router;
