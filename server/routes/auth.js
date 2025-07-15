const express = require('express');
const User = require('../models/User');
const Institute = require('../models/Institute');
const Session = require('../models/Session');
const AuditLog = require('../models/AuditLog');
const jwtService = require('../services/jwtService');
const passwordService = require('../services/passwordService');
const { authenticate } = require('../middleware/auth');
const { validationSchemas } = require('../middleware/validation');
const { asyncHandler, AppError, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public (but may require admin approval)
 */
router.post('/register', validationSchemas.userRegistration, asyncHandler(async (req, res) => {
  const {
    email,
    username,
    password,
    phoneNumbers,
    fullName,
    gender,
    dateOfBirth,
    cnic,
    institute,
    role,
    familyInfo,
    academicHistory
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { username: username.toLowerCase() },
      { cnic }
    ]
  });

  if (existingUser) {
    let field = 'email';
    if (existingUser.username === username.toLowerCase()) field = 'username';
    if (existingUser.cnic === cnic) field = 'cnic';
    
    throw new AppError(`User with this ${field} already exists`, 400, 'USER_EXISTS');
  }

  // Verify institute exists
  const instituteDoc = await Institute.findById(institute);
  if (!instituteDoc) {
    throw new AppError('Institute not found', 404, 'INSTITUTE_NOT_FOUND');
  }

  // Check if institute can add more users
  if (role !== 'Student' && !instituteDoc.canAddUsers()) {
    throw new AppError('Institute has reached maximum user limit', 400, 'USER_LIMIT_EXCEEDED');
  }

  if (role === 'Student' && !instituteDoc.canAddStudents()) {
    throw new AppError('Institute has reached maximum student limit', 400, 'STUDENT_LIMIT_EXCEEDED');
  }

  // Create new user
  const newUser = new User({
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    password, // Will be hashed by pre-save middleware
    phoneNumbers,
    fullName,
    gender,
    dateOfBirth,
    cnic,
    institute,
    role,
    familyInfo,
    academicHistory,
    accountStatus: 'Active' // Since we're not using email verification
  });

  await newUser.save();

  // Update institute user counts
  await instituteDoc.updateUserCounts();

  // Log user registration
  await AuditLog.logAction({
    user: newUser._id,
    institute: newUser.institute,
    action: 'USER_CREATED',
    resource: {
      type: 'User',
      id: newUser._id,
      name: `${newUser.fullName.firstName} ${newUser.fullName.lastName}`
    },
    details: {
      description: 'New user registered in the system',
      metadata: {
        role: newUser.role,
        institute: instituteDoc.name,
        registrationMethod: 'Self-Registration'
      }
    },
    requestInfo: {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      endpoint: req.originalUrl,
      method: req.method
    },
    result: {
      status: 'SUCCESS',
      statusCode: 201
    }
  });

  // Remove sensitive data from response
  const userResponse = newUser.toJSON();
  delete userResponse.password;

  sendSuccessResponse(res, {
    user: userResponse,
    message: 'Registration successful. You can now login.'
  }, 'User registered successfully', 201);
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validationSchemas.userLogin, asyncHandler(async (req, res) => {
  const { login, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  // Find user by email or username
  const user = await User.findOne({
    $or: [
      { email: login.toLowerCase() },
      { username: login.toLowerCase() }
    ]
  }).select('+password').populate('institute');

  // Check if user exists and password is correct
  if (!user || !(await user.matchPassword(password))) {
    // Log failed login attempt
    await AuditLog.logAction({
      user: user?._id || null,
      institute: user?.institute?._id || null,
      action: 'LOGIN_FAILED',
      resource: {
        type: 'System',
        name: 'Authentication'
      },
      details: {
        description: 'Failed login attempt with invalid credentials',
        metadata: {
          loginAttempt: login,
          reason: !user ? 'User not found' : 'Invalid password'
        }
      },
      requestInfo: {
        ipAddress,
        userAgent,
        endpoint: req.originalUrl,
        method: req.method
      },
      result: {
        status: 'FAILED',
        statusCode: 401
      },
      security: {
        riskLevel: 'MEDIUM'
      }
    });

    // Increment login attempts if user exists
    if (user) {
      await user.incLoginAttempts();
    }

    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Check if account is locked
  if (user.isLocked) {
    await AuditLog.logAction({
      user: user._id,
      institute: user.institute._id,
      action: 'LOGIN_FAILED',
      resource: {
        type: 'User',
        id: user._id,
        name: user.fullNameString
      },
      details: {
        description: 'Login attempt on locked account',
        metadata: {
          lockUntil: user.lockUntil,
          loginAttempts: user.loginAttempts
        }
      },
      requestInfo: {
        ipAddress,
        userAgent,
        endpoint: req.originalUrl,
        method: req.method
      },
      result: {
        status: 'FAILED',
        statusCode: 423
      },
      security: {
        riskLevel: 'HIGH'
      }
    });

    throw new AppError('Account is temporarily locked due to too many failed login attempts', 423, 'ACCOUNT_LOCKED');
  }

  // Check account status
  if (user.accountStatus !== 'Active') {
    await AuditLog.logAction({
      user: user._id,
      institute: user.institute._id,
      action: 'LOGIN_FAILED',
      resource: {
        type: 'User',
        id: user._id,
        name: user.fullNameString
      },
      details: {
        description: 'Login attempt on inactive account',
        metadata: {
          accountStatus: user.accountStatus
        }
      },
      requestInfo: {
        ipAddress,
        userAgent,
        endpoint: req.originalUrl,
        method: req.method
      },
      result: {
        status: 'FAILED',
        statusCode: 403
      },
      security: {
        riskLevel: 'MEDIUM'
      }
    });

    throw new AppError(`Account is ${user.accountStatus.toLowerCase()}`, 403, 'ACCOUNT_INACTIVE');
  }

  // Check institute subscription status (commented out for development)
  // if (!user.institute.isSubscriptionActive) {
  //   throw new AppError('Institute subscription has expired', 403, 'SUBSCRIPTION_EXPIRED');
  // }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  // Generate tokens
  const sessionData = {
    userAgent,
    ipAddress,
    loginMethod: 'Password',
    deviceId: req.headers['x-device-id'] || null
  };

  const tokens = await jwtService.generateTokenPair(user, sessionData);

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Log successful login
  await AuditLog.logAction({
    user: user._id,
    institute: user.institute._id,
    action: 'LOGIN_SUCCESS',
    resource: {
      type: 'User',
      id: user._id,
      name: user.fullNameString
    },
    details: {
      description: 'User successfully logged in',
      metadata: {
        role: user.role,
        institute: user.institute.name,
        sessionId: tokens.sessionId
      }
    },
    requestInfo: {
      ipAddress,
      userAgent,
      endpoint: req.originalUrl,
      method: req.method,
      sessionId: tokens.sessionId
    },
    result: {
      status: 'SUCCESS',
      statusCode: 200
    }
  });

  // Prepare user data for response
  const userResponse = user.toJSON();
  delete userResponse.password;

  sendSuccessResponse(res, {
    user: userResponse,
    institute: user.institute,
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    },
    sessionId: tokens.sessionId
  }, 'Login successful');
}));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400, 'REFRESH_TOKEN_REQUIRED');
  }

  const requestInfo = {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  };

  const tokens = await jwtService.refreshAccessToken(refreshToken, requestInfo);

  sendSuccessResponse(res, tokens, 'Token refreshed successfully');
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const targetSessionId = sessionId || req.session._id;

  // Revoke session
  await jwtService.revokeSession(targetSessionId, 'UserLogout');

  // Log logout
  await AuditLog.logAction({
    user: req.user._id,
    institute: req.user.institute,
    action: 'LOGOUT',
    resource: {
      type: 'User',
      id: req.user._id,
      name: req.user.fullNameString
    },
    details: {
      description: 'User logged out',
      metadata: {
        sessionId: targetSessionId
      }
    },
    requestInfo: {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      endpoint: req.originalUrl,
      method: req.method,
      sessionId: req.session._id
    },
    result: {
      status: 'SUCCESS',
      statusCode: 200
    }
  });

  sendSuccessResponse(res, null, 'Logged out successfully');
}));

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', authenticate, asyncHandler(async (req, res) => {
  const revokedCount = await jwtService.revokeAllUserSessions(req.user._id, 'UserLogoutAll');

  // Log logout from all devices
  await AuditLog.logAction({
    user: req.user._id,
    institute: req.user.institute,
    action: 'LOGOUT',
    resource: {
      type: 'User',
      id: req.user._id,
      name: req.user.fullNameString
    },
    details: {
      description: 'User logged out from all devices',
      metadata: {
        revokedSessions: revokedCount
      }
    },
    requestInfo: {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      endpoint: req.originalUrl,
      method: req.method,
      sessionId: req.session._id
    },
    result: {
      status: 'SUCCESS',
      statusCode: 200
    }
  });

  sendSuccessResponse(res, { revokedSessions: revokedCount }, 'Logged out from all devices');
}));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', validationSchemas.forgotPassword, asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal if email exists or not for security
    return sendSuccessResponse(res, null, 'If the email exists, a password reset token has been generated');
  }

  // Generate password reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Log password reset request
  await AuditLog.logAction({
    user: user._id,
    institute: user.institute,
    action: 'PASSWORD_RESET_REQUESTED',
    resource: {
      type: 'User',
      id: user._id,
      name: user.fullNameString
    },
    details: {
      description: 'Password reset requested',
      metadata: {
        email: user.email
      }
    },
    requestInfo: {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      endpoint: req.originalUrl,
      method: req.method
    },
    result: {
      status: 'SUCCESS',
      statusCode: 200
    }
  });

  // In a real application, you would send the reset token via email
  // For now, we'll return it in the response (only in development)
  const response = { message: 'Password reset token generated' };
  
  if (process.env.NODE_ENV === 'development') {
    response.resetToken = resetToken;
    response.note = 'In production, this token would be sent via email';
  }

  sendSuccessResponse(res, response, 'If the email exists, a password reset token has been generated');
}));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', validationSchemas.passwordReset, asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Hash the token to compare with database
  const hashedToken = jwtService.hashToken(token);

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();

  await user.save();

  // Revoke all existing sessions for security
  await jwtService.revokeAllUserSessions(user._id, 'PasswordReset');

  // Log password reset completion
  await AuditLog.logAction({
    user: user._id,
    institute: user.institute,
    action: 'PASSWORD_RESET_COMPLETED',
    resource: {
      type: 'User',
      id: user._id,
      name: user.fullNameString
    },
    details: {
      description: 'Password reset completed successfully',
      metadata: {
        revokedAllSessions: true
      }
    },
    requestInfo: {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      endpoint: req.originalUrl,
      method: req.method
    },
    result: {
      status: 'SUCCESS',
      statusCode: 200
    },
    security: {
      riskLevel: 'MEDIUM'
    }
  });

  sendSuccessResponse(res, null, 'Password reset successful. Please login with your new password');
}));

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated user)
 * @access  Private
 */
router.post('/change-password', authenticate, validationSchemas.passwordChange, asyncHandler(async (req, res) => {
  const { currentPassword, password } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  if (!(await user.matchPassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
  }

  // Check if new password is different from current
  if (await user.matchPassword(password)) {
    throw new AppError('New password must be different from current password', 400, 'SAME_PASSWORD');
  }

  // Set new password
  user.password = password;
  user.passwordChangedAt = new Date();
  await user.save();

  // Revoke all other sessions except current one
  const sessions = await Session.find({
    user: user._id,
    _id: { $ne: req.session._id },
    isActive: true
  });

  for (const session of sessions) {
    await session.revoke('PasswordChange');
  }

  // Log password change
  await AuditLog.logAction({
    user: user._id,
    institute: user.institute,
    action: 'PASSWORD_CHANGED',
    resource: {
      type: 'User',
      id: user._id,
      name: user.fullNameString
    },
    details: {
      description: 'User changed their password',
      metadata: {
        revokedOtherSessions: sessions.length
      }
    },
    requestInfo: {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      endpoint: req.originalUrl,
      method: req.method,
      sessionId: req.session._id
    },
    result: {
      status: 'SUCCESS',
      statusCode: 200
    }
  });

  sendSuccessResponse(res, null, 'Password changed successfully');
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('institute');
  
  sendSuccessResponse(res, {
    user,
    institute: user.institute,
    session: {
      id: req.session._id,
      lastActivity: req.session.lastActivity,
      deviceInfo: req.session.deviceInfo
    }
  }, 'User information retrieved');
}));

/**
 * @route   GET /api/auth/sessions
 * @desc    Get user's active sessions
 * @access  Private
 */
router.get('/sessions', authenticate, asyncHandler(async (req, res) => {
  const sessions = await jwtService.getUserSessions(req.user._id);
  
  sendSuccessResponse(res, sessions, 'Active sessions retrieved');
}));

module.exports = router;
