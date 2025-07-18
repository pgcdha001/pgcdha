const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { normalizeRole, getRoleDisplayName, getValidRoles } = require('../services/roleNormalizer');
const migrationService = require('../services/migrationService');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, sendSuccessResponse } = require('../middleware/errorHandler');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private
 */
router.get('/', 
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {
      // By default, exclude deleted users
      status: { $ne: 3 }
    };

    // Search filter
    if (search) {
      filter.$or = [
        { 'fullName.firstName': new RegExp(search, 'i') },
        { 'fullName.lastName': new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { username: new RegExp(search, 'i') }
      ];
    }

    // Role filter - normalize the role before filtering
    if (role) {
      filter.role = normalizeRole(role);
    }

    // Status filter
    if (status) {
      if (status === 'active') {
        filter.isActive = true;
      } else if (status === 'inactive') {
        filter.isActive = false;
      } else if (status === 'approved') {
        filter.isApproved = true;
      } else if (status === 'pending') {
        filter.isApproved = false;
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const users = await User.find(filter)
      .select('-password -passwordResetToken -passwordResetExpires')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    sendSuccessResponse(res, {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers: total,
        limit: parseInt(limit),
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    }, 'Users retrieved successfully');
  })
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
      .select('-password -passwordResetToken -passwordResetExpires')
      .lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    sendSuccessResponse(res, { user }, 'User retrieved successfully');
  })
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private
 */
router.post('/',
  asyncHandler(async (req, res) => {
    console.log('Received body:', req.body); // Debug log
    const {
      firstName,
      lastName,
      email,
      fatherName,
      cnic,
      gender,
      phoneNumber,
      secondaryPhone, // Updated from mobileNumber
      role = 'Student',
      program,
      dateOfBirth,
      address,
      reference,
      emergencyContact,
      status = 'active',
      matricMarks,      // Updated from matriculationObtainedMarks
      matricTotal       // Updated from matriculationTotalMarks
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required'
      });
    }

    // Additional validation for Student role
    if (role === 'Student') {
      const missingFields = [];
      if (!fatherName) missingFields.push('Father name');
      if (!cnic) missingFields.push('CNIC');
      if (!gender) missingFields.push('Gender');
      if (!program) missingFields.push('Program');
      if (!phoneNumber) missingFields.push('Phone number');
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `The following fields are required for students: ${missingFields.join(', ')}`
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate username from first and last name
    const baseUserName = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, '');
    
    // Check if username already exists, if so, append a number
    let userName = baseUserName;
    let counter = 1;
    while (await User.findOne({ userName })) {
      userName = `${baseUserName}${counter}`;
      counter++;
    }

    // Generate default password (first name + last 4 digits of CNIC or "1234")
    const defaultPassword = `${firstName.toLowerCase()}${cnic ? cnic.slice(-4) : '1234'}`;

    // Normalize role before creating user
    const normalizedRole = normalizeRole(role);
    
    // Create new user with simplified schema
    const userData = {
      email,
      userName,
      password: defaultPassword,
      fullName: {
        firstName,
        lastName
      },
      fatherName,
      cnic,
      gender,
      dob: dateOfBirth ? new Date(dateOfBirth) : undefined,
      phoneNumber,
      secondaryPhone,
      program,
      address,
      reference,
      role: normalizedRole,
      isActive: status === 'active',
      isApproved: true,
      createdOn: new Date(),
      updatedOn: new Date(),
      matricMarks: matricMarks !== undefined && matricMarks !== '' && !isNaN(matricMarks) ? Number(matricMarks) : undefined,
      matricTotal: matricTotal !== undefined && matricTotal !== '' && !isNaN(matricTotal) ? Number(matricTotal) : undefined
    };

    // Handle emergency contact if provided
    if (emergencyContact) {
      userData.familyInfo = {
        fatherName,
        emergencyContact: typeof emergencyContact === 'string' ? 
          { name: emergencyContact, relationship: '', phone: '' } : 
          emergencyContact
      };
    }

    // Set status based on isActive and isApproved
    if (userData.isApproved && userData.isActive) {
      userData.status = 1; // Active
    } else if (userData.isApproved && !userData.isActive) {
      userData.status = 2; // Paused
    } else {
      userData.status = 3; // Pending/Inactive
    }

    const user = await User.create(userData);

    // Remove sensitive data from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    sendSuccessResponse(res, { 
      user: userResponse,
      generatedCredentials: {
        userName,
        password: defaultPassword
      }
    }, 'User created successfully');
  })
);
/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private
 */
router.put('/:id',
  asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const {
      firstName,
      lastName,
      email,
      fatherName,
      cnic,
      gender,
      phoneNumber,
      secondaryPhone,
      role,
      program,
      dateOfBirth,
      address,
      reference,
      emergencyContact,
      status,
      matricMarks,
      matricTotal
    } = req.body;

    // Get current user to check if email is changing
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if new email already exists
    if (email && email !== currentUser.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }

    // Prepare update data
    const updateData = {
      updatedOn: new Date()
    };

    // Map frontend fields to backend structure
    if (firstName || lastName) {
      updateData.fullName = {
        firstName: firstName || currentUser.fullName?.firstName || '',
        lastName: lastName || currentUser.fullName?.lastName || ''
      };
    }

    if (email) updateData.email = email;
    if (fatherName) updateData.fatherName = fatherName;
    if (cnic) updateData.cnic = cnic;
    if (gender) updateData.gender = gender;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (secondaryPhone) updateData.secondaryPhone = secondaryPhone;
    if (program) updateData.program = program;
    if (dateOfBirth) updateData.dob = new Date(dateOfBirth);
    if (address) updateData.address = address;
    if (reference) updateData.reference = reference;
    if (matricMarks !== undefined && matricMarks !== '' && !isNaN(matricMarks)) updateData.matricMarks = Number(matricMarks);
    if (matricTotal !== undefined && matricTotal !== '' && !isNaN(matricTotal)) updateData.matricTotal = Number(matricTotal);

    // Normalize role if provided
    if (role) {
      updateData.role = normalizeRole(role);
    }

    // Handle status changes
    if (status) {
      updateData.isActive = status === 'active';
      updateData.status = status === 'active' ? 1 : 2;
    }

    // Handle emergency contact if provided
    if (emergencyContact) {
      updateData.familyInfo = {
        fatherName: fatherName || currentUser.fatherName,
        emergencyContact: typeof emergencyContact === 'string' ? 
          { name: emergencyContact, relationship: '', phone: '' } : 
          emergencyContact
      };
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password -passwordResetToken -passwordResetExpires');

    sendSuccessResponse(res, { user }, 'User updated successfully');
  })
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private
 */
router.delete('/:id',
  asyncHandler(async (req, res) => {
    const userId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    console.log('Delete user request:', {
      userId,
      currentUser: req.user?._id?.toString(),
      comparison: userId === req.user?._id?.toString()
    });

    // First check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      console.log('User not found for deletion:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User found for deletion:', {
      id: existingUser._id,
      email: existingUser.email,
      role: existingUser.role
    });

    // Prevent deleting own account (only if we have user context)
    if (req.user && userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Use hard delete instead of soft delete
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      console.log('User disappeared between check and update:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User hard deleted successfully:', {
      id: user._id,
      email: user.email,
      role: user.role
    });

    sendSuccessResponse(res, { 
      deletedUser: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    }, 'User deleted successfully');
  })
);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Update user status (active/inactive, approved/pending)
 * @access  Private
 */
router.patch('/:id/status',
  asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { status } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update status based on the provided value
    if (status === 'active') {
      user.isActive = true;
    } else if (status === 'inactive') {
      user.isActive = false;
    } else if (status === 'approved') {
      user.isApproved = true;
    } else if (status === 'pending') {
      user.isApproved = false;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use: active, inactive, approved, or pending'
      });
    }

    await user.save();

    const userResponse = user.toJSON();
    delete userResponse.password;

    sendSuccessResponse(res, { user: userResponse }, 'User status updated successfully');
  })
);

// Helper methods for the frontend
router.patch('/:id/approve', 
  asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { isApproved: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    sendSuccessResponse(res, { user }, 'User approved successfully');
  })
);

router.patch('/:id/suspend', 
  asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    sendSuccessResponse(res, { user }, 'User suspended successfully');
  })
);

router.patch('/:id/activate', 
  asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    sendSuccessResponse(res, { user }, 'User activated successfully');
  })
);

/**
 * @route   GET /api/users/roles
 * @desc    Get all valid roles with display names
 * @access  Private
 */
router.get('/roles', asyncHandler(async (req, res) => {
  const validRoles = getValidRoles();
  const rolesWithDisplayNames = validRoles.map(role => ({
    value: role,
    label: getRoleDisplayName(role)
  }));

  sendSuccessResponse(res, {
    roles: rolesWithDisplayNames,
    message: 'Roles retrieved successfully'
  });
}));

/**
 * @route   GET /api/users/migration/stats
 * @desc    Get migration statistics
 * @access  Private (Admin only)
 */
router.get('/migration/stats', asyncHandler(async (req, res) => {
  const stats = await migrationService.getMigrationStats();
  
  sendSuccessResponse(res, {
    stats,
    message: 'Migration statistics retrieved successfully'
  });
}));

/**
 * @route   POST /api/users/migration/validate
 * @desc    Validate all user roles
 * @access  Private (Admin only)
 */
router.post('/migration/validate', asyncHandler(async (req, res) => {
  const validationResults = await migrationService.validateUserRoles();
  
  sendSuccessResponse(res, {
    validation: validationResults,
    message: 'User role validation completed'
  });
}));

/**
 * @route   POST /api/users/migration/migrate
 * @desc    Migrate all users to normalized roles
 * @access  Private (Admin only)
 */
router.post('/migration/migrate', asyncHandler(async (req, res) => {
  // Create backup first
  const backup = await migrationService.createUserBackup();
  
  // Perform migration
  const migrationResults = await migrationService.migrateUserRoles();
  
  sendSuccessResponse(res, {
    backup,
    migration: migrationResults,
    message: 'User role migration completed'
  });
}));

/**
 * @route   POST /api/users/bulk-assign-class
 * @desc    Bulk assign students to a class
 * @access  Private (InstituteAdmin, Principal)
 */
router.post('/bulk-assign-class', asyncHandler(async (req, res) => {
  // Check if user has permission
  if (!['InstituteAdmin', 'Principal'].includes(req.user.role)) {
    return res.status(403).json({ 
      message: 'Access denied. Only Institute Admin and Principal can bulk assign students to classes.' 
    });
  }

  const { studentIds, classId } = req.body;

  // Validate required fields
  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({
      message: 'Student IDs array is required and must not be empty'
    });
  }

  if (!classId) {
    return res.status(400).json({
      message: 'Class ID is required'
    });
  }

  // Verify all provided IDs are valid ObjectIds
  const invalidIds = studentIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    return res.status(400).json({
      message: `Invalid student IDs: ${invalidIds.join(', ')}`
    });
  }

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({
      message: 'Invalid class ID'
    });
  }

  // Check if class exists
  const Class = require('../models/Class');
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    return res.status(404).json({
      message: 'Class not found'
    });
  }

  // Find students and verify they exist and are students
  const students = await User.find({
    _id: { $in: studentIds },
    role: 'Student',
    enquiryLevel: 5, // Only Level 5 (admitted) students can be assigned to classes
    status: { $ne: 3 } // Not deleted
  });

  if (students.length !== studentIds.length) {
    const foundIds = students.map(s => s._id.toString());
    const notFoundIds = studentIds.filter(id => !foundIds.includes(id));
    return res.status(400).json({
      message: `Some students were not found or are not Level 5 admitted students: ${notFoundIds.join(', ')}`
    });
  }

  // Check class capacity
  const currentStudentCount = await User.countDocuments({
    classId: classId,
    role: 'Student',
    status: { $ne: 3 }
  });

  if (currentStudentCount + students.length > classDoc.maxStudents) {
    return res.status(400).json({
      message: `Cannot assign ${students.length} students. Class capacity would be exceeded. Current: ${currentStudentCount}, Max: ${classDoc.maxStudents}`
    });
  }

  // Perform bulk assignment
  const bulkUpdate = await User.updateMany(
    { _id: { $in: studentIds } },
    { 
      classId: classId,
      updatedOn: new Date()
    }
  );

  // Get updated students for response
  const updatedStudents = await User.find(
    { _id: { $in: studentIds } },
    { password: 0 }
  ).populate('classId', 'name campus grade floor');

  sendSuccessResponse(res, {
    assignedCount: bulkUpdate.modifiedCount,
    students: updatedStudents,
    class: classDoc
  }, `Successfully assigned ${bulkUpdate.modifiedCount} students to ${classDoc.name}`);
}));

/**
 * @route   PUT /api/users/:id/enquiry-level
 * @desc    Update user's enquiry level
 * @access  Private (InstituteAdmin, Principal)
 */
router.put('/:id/enquiry-level', asyncHandler(async (req, res) => {
  // Check if user has permission
  if (!['InstituteAdmin', 'Principal'].includes(req.user.role)) {
    return res.status(403).json({ 
      message: 'Access denied. Only Institute Admin and Principal can update enquiry levels.' 
    });
  }

  const { id } = req.params;
  const { enquiryLevel, admissionInfo } = req.body;

  // Validate enquiry level
  if (!enquiryLevel || enquiryLevel < 1 || enquiryLevel > 5) {
    return res.status(400).json({
      message: 'Enquiry level must be between 1 and 5'
    });
  }

  // Find the user
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      message: 'User not found'
    });
  }

  // Update enquiry level
  user.enquiryLevel = enquiryLevel;
  user.updatedOn = new Date();

  // If upgrading to Level 5 (admitted), handle admission info
  if (enquiryLevel === 5) {
    if (!admissionInfo || !admissionInfo.grade) {
      return res.status(400).json({
        message: 'Grade is required for Level 5 students'
      });
    }

    user.admissionInfo = {
      grade: admissionInfo.grade,
      className: admissionInfo.className || ''
    };

    // Auto-assign campus based on gender if not already set
    if (!user.campus && user.gender) {
      user.campus = user.gender.toLowerCase() === 'male' ? 'Boys' : 'Girls';
    }
  }

  await user.save();

  // Remove sensitive data from response
  const userResponse = user.toJSON();
  delete userResponse.password;

  sendSuccessResponse(res, { user: userResponse }, 'Enquiry level updated successfully');
}));

module.exports = router;
