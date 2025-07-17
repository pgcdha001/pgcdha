const express = require('express');
const router = express.Router();
const User = require('../models/User');
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
    const currentLevel = student.prospectusStage || 1;
    console.log(`Updating level for student ID: ${req.params.id} from level ${currentLevel} to level ${level}`);
    console.log(`Found student: ${student.fullName?.firstName} ${student.fullName?.lastName}, current level: ${currentLevel}, new level: ${level}`);
    
    // If student doesn't have prospectusStage set, initialize it
    if (student.prospectusStage === undefined || student.prospectusStage === null) {
      student.prospectusStage = 1;
      console.log(`Initialized prospectusStage to 1 for student: ${student.fullName?.firstName} ${student.fullName?.lastName}`);
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
    
    // Update the level
    student.prospectusStage = level;
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

module.exports = router;