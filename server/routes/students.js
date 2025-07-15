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

module.exports = router; 