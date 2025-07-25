const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Class = require('../models/Class');
const { authenticate } = require('../middleware/auth');
const crypto = require('crypto');

// Middleware: Only allow IT users
function requireIT(req, res, next) {
  if (req.user && req.user.role === 'IT') return next();
  return res.status(403).json({ success: false, message: 'Only IT users can perform this action.' });
}

// Get all students/enquiries (authenticated users)
router.get('/', authenticate, async (req, res) => {
  try {
    const students = await User.find({ role: 'Student' }).select('-password');
    
    // Log potential duplicates for debugging
    const nameGroups = {};
    students.forEach(student => {
      const fullName = `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.trim();
      if (!nameGroups[fullName]) {
        nameGroups[fullName] = [];
      }
      nameGroups[fullName].push({
        id: student._id,
        level: student.prospectusStage || 1,
        email: student.email
      });
    });
    
    // Check for potential duplicates
    const duplicates = Object.entries(nameGroups).filter(([name, records]) => records.length > 1);
    if (duplicates.length > 0) {
      console.log('Potential duplicate students found:');
      duplicates.forEach(([name, records]) => {
        console.log(`  ${name}:`, records);
      });
    }
    
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Register a new student (IT only, auto-generate username/password)
router.post('/register', authenticate, requireIT, async (req, res) => {
  try {
    const { fullName, email, phoneNumber, gender, dob, cnic, ...rest } = req.body;
    // Generate username: firstName + random 4 digits
    const base = (fullName?.firstName || 'student').toLowerCase().replace(/\s+/g, '');
    const username = base + Math.floor(1000 + Math.random() * 9000);
    // Generate random password
    const password = crypto.randomBytes(6).toString('base64');
    // Create student
    const student = await User.create({
      userName: username,
      password,
      email: email || username + '@pgc.edu.pk', // fallback if no email
      fullName: {
        firstName: fullName?.firstName || '',
        lastName: fullName?.lastName || ''
      },
      phoneNumber,
      gender,
      dob,
      cnic,
      role: 'Student',
      prospectusStage: 1,
      status: 3, // Pending/Inactive by default
      isActive: false,
      isApproved: false,
      isPassedOut: false,
      ...rest
    });
    // Return student info (no password)
    const studentObj = student.toObject();
    delete studentObj.password;
    console.log('Student registered successfully:', studentObj.userName, studentObj.cnic);
    res.status(201).json({ success: true, message: 'Student registered successfully', student: studentObj });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update student progression (IT only)
router.patch('/:id/progress', authenticate, requireIT, async (req, res) => {
  try {
    const { prospectusStage, status, isPassedOut } = req.body;
    const update = {};
    if (prospectusStage !== undefined) update.prospectusStage = prospectusStage;
    if (status !== undefined) update.status = status;
    if (isPassedOut !== undefined) update.isPassedOut = isPassedOut;
    const student = await User.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get students with their remarks/correspondence (authenticated users)
router.get('/remarks', authenticate, async (req, res) => {
  try {
    const students = await User.find({ 
      role: 'Student',
      receptionistRemarks: { $exists: true }
    }).select('-password');
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update enquiry level with compulsory notes (authenticated users)
router.put('/:id/level', authenticate, async (req, res) => {
  try {
    const { level, notes } = req.body;
    
    // Validate required fields
    if (level === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Level is required'
      });
    }
    
    if (!notes || !notes.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Notes are required when changing enquiry level'
      });
    }

    // Find the student/enquiry first
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student/Enquiry not found'
      });
    }

    // Store the current level before updating
    const currentLevel = student.prospectusStage || student.enquiryLevel || 1;
    console.log(`Updating level for student ID: ${req.params.id} from level ${currentLevel} to level ${level}`);
    console.log(`Found student: ${student.fullName?.firstName} ${student.fullName?.lastName}, current level: ${currentLevel}, new level: ${level}`);
    
    // If student doesn't have level fields set, initialize them
    if ((student.prospectusStage === undefined || student.prospectusStage === null) && 
        (student.enquiryLevel === undefined || student.enquiryLevel === null)) {
      student.prospectusStage = 1;
      student.enquiryLevel = 1;
      console.log(`Initialized both level fields to 1 for student: ${student.fullName?.firstName} ${student.fullName?.lastName}`);
    }
    
    // Validate that level can only be upgraded, not downgraded
    if (level < currentLevel) {
      return res.status(400).json({
        success: false,
        message: `Cannot downgrade from level ${currentLevel} to level ${level}. Only upgrades are allowed.`
      });
    }
    
    // If trying to set the same level, return early
    if (level === currentLevel) {
      return res.status(400).json({
        success: false,
        message: `Student is already at level ${level}`
      });
    }
    
    // Update both level fields for consistency
    student.prospectusStage = level;
    student.enquiryLevel = level;
    student.updatedOn = new Date();

    // Update progression date fields based on level
    const currentDate = new Date();
    switch (level) {
      case 2: // Prospectus Purchased
        if (!student.prospectusPurchasedOn) {
          student.prospectusPurchasedOn = currentDate;
        }
        break;
      case 3: // Prospectus Returned (Application Submitted)
        if (!student.prospectusReturnedOn) {
          student.prospectusReturnedOn = currentDate;
        }
        break;
      case 4: // Admission Fee Submitted
        if (!student.afSubmittedOn) {
          student.afSubmittedOn = currentDate;
        }
        break;
      case 5: // 1st Installment Submitted (Full Admission - OFFICIAL ADMISSION)
        if (!student.installmentSubmittedOn) {
          student.installmentSubmittedOn = currentDate;
        }
        if (!student.isProcessed) {
          student.isProcessed = true;
          student.processedYear = new Date().getFullYear().toString();
        }
        // Mark as officially admitted when reaching level 5
        // This enables access to student dashboard and student correspondence
        if (!student.isApproved) {
          student.isApproved = true;
          console.log(`Student ${student.fullName?.firstName} ${student.fullName?.lastName} has been officially admitted (level 5)`);
        }
        break;
    }

    // Add correspondence record for the level change
    let remarkText = `Level changed from ${currentLevel} to ${level}. Notes: ${notes.trim()}`;
    
    // Add special note for official admission
    if (level === 5) {
      remarkText += ' - OFFICIALLY ADMITTED: Student now has access to dashboard and student correspondence.';
    }
    
    const correspondenceData = {
      remark: remarkText,
      receptionistId: req.user.id,
      receptionistName: `${req.user.fullName?.firstName || ''} ${req.user.fullName?.lastName || ''}`.trim() || req.user.userName,
      timestamp: new Date()
    };

    // Initialize remarks array if it doesn't exist
    if (!student.receptionistRemarks) {
      student.receptionistRemarks = [];
    }

    student.receptionistRemarks.push(correspondenceData);
    
    console.log(`About to save student with level: ${student.prospectusStage}`);
    await student.save();
    
    // Verify the save worked
    const savedStudent = await User.findById(req.params.id);
    console.log(`After save - student level in DB: ${savedStudent.prospectusStage}`);

    console.log(`Successfully updated student ${student.fullName?.firstName} ${student.fullName?.lastName} to level ${level}`);

    res.json({
      success: true,
      message: 'Enquiry level updated successfully and correspondence recorded',
      data: {
        student: savedStudent.toObject(),
        correspondence: correspondenceData
      }
    });

  } catch (error) {
    console.error('Error updating enquiry level:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating enquiry level',
      error: error.message
    });
  }
});

// Add endpoint to check for and clean up duplicate students
router.get('/duplicates', authenticate, async (req, res) => {
  try {
    const students = await User.find({ role: 'Student' }).select('fullName email cnic prospectusStage createdOn');
    
    // Group by name and email to find duplicates
    const groups = {};
    students.forEach(student => {
      const key = `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.trim().toLowerCase();
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(student);
    });
    
    const duplicates = Object.entries(groups)
      .filter(([name, records]) => records.length > 1)
      .map(([name, records]) => ({
        name,
        count: records.length,
        records: records.map(r => ({
          id: r._id,
          email: r.email,
          cnic: r.cnic,
          level: r.prospectusStage || 1,
          createdOn: r.createdOn
        }))
      }));
      
    res.json({ success: true, duplicates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Migration endpoint to fix students without prospectusStage
router.post('/migrate-levels', authenticate, async (req, res) => {
  try {
    const studentsToUpdate = await User.find({ 
      role: 'Student',
      $or: [
        { prospectusStage: { $exists: false } },
        { prospectusStage: null },
        { prospectusStage: undefined }
      ]
    });
    
    console.log(`Found ${studentsToUpdate.length} students without prospectusStage`);
    
    for (const student of studentsToUpdate) {
      student.prospectusStage = 1;
      await student.save();
      console.log(`Set prospectusStage to 1 for student: ${student.fullName?.firstName} ${student.fullName?.lastName}`);
    }
    
    res.json({
      success: true,
      message: `Updated ${studentsToUpdate.length} students with default prospectusStage`,
      updatedCount: studentsToUpdate.length
    });
  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get students by class ID
router.get('/class/:classId', authenticate, async (req, res) => {
  try {
    const { classId } = req.params;
    
    const students = await User.find({
      classId: classId,
      role: 'Student',
      $or: [
        { prospectusStage: 5 },
        { enquiryLevel: 5 }
      ]
    })
    .select('-password')
    .sort({ rollNumber: 1, 'fullName.firstName': 1 });

    res.json(students);
  } catch (error) {
    console.error('Error fetching class students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching class students',
      error: error.message
    });
  }
});

// Assign student to class
router.post('/:studentId/assign-class', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { classId, grade, program } = req.body;

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required'
      });
    }

    // Find the student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'Student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if student is at level 5 (officially admitted)
    const studentLevel = student.prospectusStage || student.enquiryLevel || 1;
    if (studentLevel !== 5) {
      return res.status(400).json({
        success: false,
        message: `Only officially admitted students (level 5) can be assigned to classes. This student is currently at level ${studentLevel}.`
      });
    }

    // Find the class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Verify student matches class criteria
    const studentCampus = student.campus || (student.gender === 'Female' ? 'Girls' : 'Boys');
    
    if (studentCampus !== classDoc.campus) {
      return res.status(400).json({
        success: false,
        message: `Student campus (${studentCampus}) does not match class campus (${classDoc.campus})`
      });
    }

    // Check grade compatibility
    const studentGrade = student.admissionInfo?.grade;
    const classGrade = classDoc.grade;
    
    // If student doesn't have a grade set but is Level 5, update it to match the class
    if (!studentGrade && student.level === 5) {
      console.log('Student is Level 5 but missing grade, updating to match class grade:', classGrade);
      await User.findByIdAndUpdate(studentId, {
        'admissionInfo.grade': classGrade
      });
    } else if (studentGrade && studentGrade !== classGrade) {
      console.log('Grade mismatch:', {
        studentGrade: studentGrade,
        classGrade: classGrade,
        studentAdmissionInfo: student.admissionInfo
      });
      return res.status(400).json({
        success: false,
        message: `Student grade (${studentGrade}) does not match class grade (${classGrade}). Please update the student's grade first.`
      });
    }

    // Check program compatibility
    const studentProgram = student.admissionInfo?.program || student.program;
    const classProgram = classDoc.program;
    
    // If student doesn't have a program set but is Level 5, update it to match the class
    if (!studentProgram && student.level === 5) {
      console.log('Student is Level 5 but missing program, updating to match class program:', classProgram);
      if (!student.admissionInfo) {
        student.admissionInfo = {};
      }
      student.admissionInfo.program = classProgram;
    } else if (studentProgram && studentProgram !== classProgram) {
      console.log('Program mismatch:', {
        studentProgram: studentProgram,
        classProgram: classProgram,
        studentAdmissionInfo: student.admissionInfo
      });
      return res.status(400).json({
        success: false,
        message: `Student program (${studentProgram}) does not match class program (${classProgram}). Please update the student's program first.`
      });
    }

    // Check if class is full
    const currentStudentCount = await User.countDocuments({
      classId: classId,
      role: 'Student',
      level: 5
    });

    if (currentStudentCount >= classDoc.maxStudents) {
      return res.status(400).json({
        success: false,
        message: 'Class is full'
      });
    }

    // Generate roll number
    const rollNumber = await generateRollNumber(classId, classDoc);

    // Update student's grade if provided in the request
    if (grade && grade !== student.admissionInfo?.grade) {
      console.log(`Updating student grade from ${student.admissionInfo?.grade} to ${grade}`);
      if (!student.admissionInfo) {
        student.admissionInfo = {};
      }
      student.admissionInfo.grade = grade;
    }

    // Update student's program if provided in the request
    if (program && program !== (student.admissionInfo?.program || student.program)) {
      console.log(`Updating student program from ${student.admissionInfo?.program || student.program} to ${program}`);
      if (!student.admissionInfo) {
        student.admissionInfo = {};
      }
      student.admissionInfo.program = program;
    }

    // Assign student to class
    student.classId = classId;
    student.rollNumber = rollNumber;
    await student.save();

    // Update class student count
    await classDoc.updateStudentCount();

    res.json({
      success: true,
      message: 'Student assigned to class successfully',
      rollNumber: rollNumber
    });

  } catch (error) {
    console.error('Error assigning student to class:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning student to class',
      error: error.message
    });
  }
});

// Unassign student from class
router.post('/:studentId/unassign-class', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId);
    if (!student || student.role !== 'Student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Store the class ID before removing it
    const oldClassId = student.classId;

    // Unassign student
    student.classId = null;
    student.rollNumber = null;
    await student.save();

    // Update class student count if student was previously assigned
    if (oldClassId) {
      const classDoc = await Class.findById(oldClassId);
      if (classDoc) {
        await classDoc.updateStudentCount();
      }
    }

    res.json({
      success: true,
      message: 'Student unassigned from class successfully'
    });

  } catch (error) {
    console.error('Error unassigning student from class:', error);
    res.status(500).json({
      success: false,
      message: 'Error unassigning student from class',
      error: error.message
    });
  }
});

// Bulk assign students to class
router.post('/bulk-assign', authenticate, async (req, res) => {
  try {
    const { studentIds, classId } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student IDs array is required'
      });
    }

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required'
      });
    }

    // Find the class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Find all students
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'Student',
      $or: [
        { prospectusStage: 5 },
        { enquiryLevel: 5 }
      ]
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some students not found or not officially admitted'
      });
    }

    // Check class capacity
    const currentStudentCount = await User.countDocuments({
      classId: classId,
      role: 'Student',
      level: 5
    });

    if (currentStudentCount + students.length > classDoc.maxStudents) {
      return res.status(400).json({
        success: false,
        message: `Class capacity exceeded. Available slots: ${classDoc.maxStudents - currentStudentCount}`
      });
    }

    // Validate all students match class criteria
    const errors = [];
    for (const student of students) {
      if (student.campus !== classDoc.campus) {
        errors.push(`${student.fullName?.firstName} ${student.fullName?.lastName}: Campus mismatch`);
      }
      if (student.admissionInfo?.currentGrade !== classDoc.grade) {
        errors.push(`${student.fullName?.firstName} ${student.fullName?.lastName}: Grade mismatch`);
      }
      if (student.admissionInfo?.program !== classDoc.program) {
        errors.push(`${student.fullName?.firstName} ${student.fullName?.lastName}: Program mismatch`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Student validation errors',
        errors: errors
      });
    }

    // Assign all students
    const assignments = [];
    for (const student of students) {
      const rollNumber = await generateRollNumber(classId, classDoc);
      student.classId = classId;
      student.rollNumber = rollNumber;
      await student.save();
      
      assignments.push({
        studentId: student._id,
        rollNumber: rollNumber
      });
    }

    // Update class student count
    await classDoc.updateStudentCount();

    res.json({
      success: true,
      message: `${students.length} students assigned to class successfully`,
      assignments: assignments
    });

  } catch (error) {
    console.error('Error in bulk assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error in bulk assignment',
      error: error.message
    });
  }
});

// Helper function to generate roll number
async function generateRollNumber(classId, classDoc) {
  // Get the highest roll number in the class
  const lastStudent = await User.findOne({
    classId: classId,
    role: 'Student',
    rollNumber: { $exists: true, $ne: null }
  }).sort({ rollNumber: -1 });

  let nextRollNumber;
  if (lastStudent && lastStudent.rollNumber) {
    // Extract numeric part and increment
    const match = lastStudent.rollNumber.match(/(\d+)$/);
    const lastNumber = match ? parseInt(match[1]) : 0;
    nextRollNumber = `${classDoc.name.replace(/\s+/g, '')}-${String(lastNumber + 1).padStart(3, '0')}`;
  } else {
    // First student in class
    nextRollNumber = `${classDoc.name.replace(/\s+/g, '')}-001`;
  }

  return nextRollNumber;
}

// Debug endpoint to check student assignments
router.get('/debug/assignments', authenticate, async (req, res) => {
  try {
    const students = await User.find({ 
      role: 'Student', 
      classId: { $exists: true, $ne: null } 
    }).select('_id fullName classId enquiryLevel prospectusStage isActive isApproved');
    
    const classAssignments = {};
    for (const student of students) {
      if (!classAssignments[student.classId]) {
        classAssignments[student.classId] = [];
      }
      classAssignments[student.classId].push({
        id: student._id,
        name: `${student.fullName?.firstName} ${student.fullName?.lastName}`,
        enquiryLevel: student.enquiryLevel,
        prospectusStage: student.prospectusStage,
        isActive: student.isActive,
        isApproved: student.isApproved
      });
    }
    
    res.json({
      success: true,
      totalAssignedStudents: students.length,
      classAssignments
    });
  } catch (error) {
    console.error('Error fetching debug assignments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching debug assignments', 
      error: error.message 
    });
  }
});

module.exports = router;