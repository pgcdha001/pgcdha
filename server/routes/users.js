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
    const filter = {};

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
      mobileNumber,
      role = 'Student',
      program,
      dateOfBirth,
      address,
      reference,
      emergencyContact,
      status = 'active'
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
    
    // Create new user
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
      mobileNumber,
      program,
      address,
      reference,
      role: normalizedRole,
      isActive: status === 'active',
      isApproved: true,
      createdOn: new Date(),
      updatedOn: new Date()
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
      mobileNumber,
      role,
      program,
      dateOfBirth,
      address,
      reference,
      emergencyContact,
      status
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
    if (mobileNumber) updateData.mobileNumber = mobileNumber;
    if (program) updateData.program = program;
    if (dateOfBirth) updateData.dob = new Date(dateOfBirth);
    if (address) updateData.address = address;
    if (reference) updateData.reference = reference;

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

    // Prevent deleting own account (only if we have user context)
    if (req.user && userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    sendSuccessResponse(res, { 
      deletedUser: {
        id: user._id,
        email: user.email,
        fullName: user.fullName
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

module.exports = router;
