const express = require('express');
const User = require('../models/User');
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
 * @desc    Register a new user for PGC DHA Campus
 * @access  Public
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
    role = 'Student',
    familyInfo,
    academicHistory,
    currentClass,
    academicSession,
    academicYear
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

  // Create new user data
  const userData = {
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    password, // Will be hashed by pre-save middleware
    phoneNumbers,
    fullName,
    gender,
    dateOfBirth,
    cnic,
    role,
    familyInfo,
    academicHistory,
    accountStatus: 'Active'
  };

  // Add student-specific fields if role is Student
  if (role === 'Student') {
    userData.currentClass = currentClass;
    userData.academicSession = academicSession;
    userData.academicYear = academicYear;
  }

  const newUser = new User(userData);
  await newUser.save();

  // Log user registration
  await AuditLog.logAction({
    user: newUser._id,
    action: 'USER_CREATED',
    resource: {
      type: 'User',
      id: newUser._id,
      name: `${newUser.fullName.firstName} ${newUser.fullName.lastName}`
    },
    details: {
      description: 'New user registered in PGC DHA Campus',
      metadata: {
        role: newUser.role,
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
    message: 'Registration successful for PGC DHA Campus. You can now login.'
  }, 'User registered successfully', 201);
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user to PGC DHA Campus
 * @access  Public
 */
router.post('/login', validationSchemas.userLogin, asyncHandler(async (req, res) => {
  const { login, password } = req.body;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ipAddress = req.ip || req.connection.remoteAddress;

  // Find user by email or username
  const user = await User.findOne({
    $or: [
      { email: login.toLowerCase() },
      { username: login.toLowerCase() }
    ]
  }).select('+password').populate('roles');

  // Check if user exists and password is correct
  if (!user || !(await user.comparePassword(password))) {
    // Log failed login attempt
    await AuditLog.logAction({
      user: user?._id || null,
      action: 'LOGIN_FAILED',
      resource: {
        type: 'System',
        name: 'Authentication'
      },
      details: {
        description: 'Invalid login credentials provided',
        metadata: {
          loginAttempt: login,
          reason: 'Invalid credentials'
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

    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Check if account is locked
  if (user.isLocked) {
    await AuditLog.logAction({
      user: user._id,
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

    throw new AppError('Account is temporarily locked due to multiple failed login attempts', 423, 'ACCOUNT_LOCKED');
  }

  // Check account status
  if (user.accountStatus !== 'Active') {
    throw new AppError(`Account is ${user.accountStatus.toLowerCase()}`, 403, 'ACCOUNT_INACTIVE');
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  // Generate tokens
  const sessionData = {
    userAgent,
    ipAddress,
    loginMethod: 'Password'
  };

  const tokenData = await jwtService.generateTokenPair(user, sessionData);

  // Log successful login
  await AuditLog.logAction({
    user: user._id,
    action: 'LOGIN_SUCCESS',
    resource: {
      type: 'User',
      id: user._id,
      name: user.fullNameString
    },
    details: {
      description: 'User successfully logged in to PGC DHA Campus',
      metadata: {
        role: user.role,
        sessionId: tokenData.sessionId,
        loginMethod: 'Password'
      }
    },
    requestInfo: {
      ipAddress,
      userAgent,
      endpoint: req.originalUrl,
      method: req.method,
      sessionId: tokenData.sessionId
    },
    result: {
      status: 'SUCCESS',
      statusCode: 200
    }
  });

  // Remove sensitive data from user object
  const userResponse = user.toJSON();
  delete userResponse.password;
  delete userResponse.loginAttempts;
  delete userResponse.lockUntil;
  delete userResponse.passwordResetToken;
  delete userResponse.passwordResetExpires;

  sendSuccessResponse(res, {
    user: userResponse,
    tokens: {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn
    },
    session: {
      id: tokenData.sessionId
    },
    message: 'Login successful. Welcome to PGC DHA Campus!'
  });
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

  const result = await jwtService.refreshAccessToken(refreshToken, {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  sendSuccessResponse(res, result, 'Token refreshed successfully');
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate current session)
 * @access  Private
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  const session = await Session.findById(req.session._id);
  
  if (session) {
    session.isRevoked = true;
    session.revokedAt = new Date();
    session.revokedReason = 'User logout';
    await session.save();
  }

  // Log logout
  await AuditLog.logAction({
    user: req.user._id,
    action: 'LOGOUT',
    resource: {
      type: 'System',
      name: 'Authentication'
    },
    details: {
      description: 'User logged out successfully',
      metadata: {
        sessionId: req.session._id,
        logoutMethod: 'Manual'
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
 * @desc    Logout from all devices (invalidate all sessions)
 * @access  Private
 */
router.post('/logout-all', authenticate, asyncHandler(async (req, res) => {
  // Revoke all user sessions
  await Session.updateMany(
    { user: req.user._id, isRevoked: false },
    { 
      isRevoked: true, 
      revokedAt: new Date(),
      revokedReason: 'Logout all devices'
    }
  );

  // Log logout from all devices
  await AuditLog.logAction({
    user: req.user._id,
    action: 'LOGOUT',
    resource: {
      type: 'System',
      name: 'Authentication'
    },
    details: {
      description: 'User logged out from all devices',
      metadata: {
        logoutMethod: 'All devices',
        currentSessionId: req.session._id
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

  sendSuccessResponse(res, null, 'Logged out from all devices successfully');
}));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', validationSchemas.forgotPassword, asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal if user exists or not for security
    sendSuccessResponse(res, null, 'If an account with that email exists, a password reset link has been sent.');
    return;
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Log password reset request
  await AuditLog.logAction({
    user: user._id,
    action: 'PASSWORD_RESET_REQUESTED',
    resource: {
      type: 'User',
      id: user._id,
      name: user.fullNameString
    },
    details: {
      description: 'Password reset requested for PGC DHA Campus account',
      metadata: {
        email: user.email,
        resetTokenGenerated: true
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

  // In production, send email here
  // For development, we'll just return success
  sendSuccessResponse(res, { resetToken }, 'Password reset instructions sent to your email');
}));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 */
router.post('/reset-password', validationSchemas.passwordReset, asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Hash the token to compare with stored token
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();
  
  // Reset login attempts if account was locked
  user.loginAttempts = undefined;
  user.lockUntil = undefined;

  await user.save();

  // Log password reset
  await AuditLog.logAction({
    user: user._id,
    action: 'PASSWORD_RESET_COMPLETED',
    resource: {
      type: 'User',
      id: user._id,
      name: user.fullNameString
    },
    details: {
      description: 'Password successfully reset for PGC DHA Campus account',
      metadata: {
        resetMethod: 'Token-based reset'
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

  sendSuccessResponse(res, null, 'Password reset successful. You can now login with your new password.');
}));

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post('/change-password', authenticate, validationSchemas.passwordChange, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
  }

  // Update password
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  // Log password change
  await AuditLog.logAction({
    user: user._id,
    action: 'PASSWORD_CHANGED',
    resource: {
      type: 'User',
      id: user._id,
      name: user.fullNameString
    },
    details: {
      description: 'User changed their password',
      metadata: {
        changeMethod: 'Authenticated change'
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
  const user = await User.findById(req.user._id).populate('roles');
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const userResponse = user.toJSON();
  delete userResponse.password;
  delete userResponse.loginAttempts;
  delete userResponse.lockUntil;
  delete userResponse.passwordResetToken;
  delete userResponse.passwordResetExpires;

  sendSuccessResponse(res, { user: userResponse }, 'User info retrieved successfully');
}));

/**
 * @route   GET /api/auth/sessions
 * @desc    Get user's active sessions
 * @access  Private
 */
router.get('/sessions', authenticate, asyncHandler(async (req, res) => {
  const sessions = await Session.getUserActiveSessions(req.user._id);
  
  const sessionData = sessions.map(session => ({
    id: session._id,
    deviceInfo: session.deviceInfo,
    ipAddress: session.ipAddress,
    location: session.location,
    lastActivity: session.lastActivity,
    loginMethod: session.loginMethod,
    isCurrent: session._id.toString() === req.session._id.toString()
  }));

  sendSuccessResponse(res, { sessions: sessionData }, 'Sessions retrieved successfully');
}));

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId', authenticate, asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await Session.findOne({
    _id: sessionId,
    user: req.user._id,
    isRevoked: false
  });

  if (!session) {
    throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
  }

  session.isRevoked = true;
  session.revokedAt = new Date();
  session.revokedReason = 'Manual revocation';
  await session.save();

  sendSuccessResponse(res, null, 'Session revoked successfully');
}));

module.exports = router;
