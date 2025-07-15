const { body, param, query, validationResult } = require('express-validator');
const passwordService = require('../services/passwordService');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

/**
 * Common validation rules
 */
const validationRules = {
  // Email validation
  email: body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim(),

  // Username validation
  username: body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .trim(),

  // Password validation
  password: body('password')
    .custom((value) => {
      if (!passwordService.meetsMinimumRequirements(value)) {
        const policy = passwordService.getPasswordPolicy();
        throw new Error(`Password does not meet requirements: ${policy.description.join(', ')}`);
      }
      return true;
    }),

  // Phone number validation
  phoneNumber: (field = 'phoneNumbers.primary') => 
    body(field)
      .matches(/^(\+92|0)?[0-9]{10}$/)
      .withMessage('Please provide a valid phone number'),

  // CNIC validation
  cnic: body('cnic')
    .matches(/^[0-9]{5}-[0-9]{7}-[0-9]$/)
    .withMessage('Please provide a valid CNIC format (12345-1234567-1)')
    .trim(),

  // Name validation
  name: (field) =>
    body(field)
      .isLength({ min: 1, max: 50 })
      .withMessage(`${field} must be between 1 and 50 characters`)
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage(`${field} can only contain letters and spaces`)
      .trim(),

  // MongoDB ObjectId validation
  mongoId: (field) =>
    param(field)
      .isMongoId()
      .withMessage(`Invalid ${field} format`),

  // Date validation
  date: (field) =>
    body(field)
      .isISO8601()
      .withMessage(`${field} must be a valid date`)
      .toDate(),

  // Role validation
  role: body('role')
    .isIn(['SystemAdmin', 'InstituteAdmin', 'Teacher', 'Student', 'SRO', 'Accounts', 'IT', 'EMS'])
    .withMessage('Invalid role specified'),

  // Gender validation
  gender: body('gender')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),

  // Account status validation
  accountStatus: body('accountStatus')
    .isIn(['Active', 'Paused', 'Deleted', 'Pending'])
    .withMessage('Invalid account status'),

  // Institute code validation
  instituteCode: body('code')
    .matches(/^[A-Z0-9]{3,10}$/)
    .withMessage('Institute code must be 3-10 characters, letters and numbers only')
    .trim()
    .toUpperCase(),

  // Pagination validation
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  // Search query validation
  search: query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim()
    .escape()
};

/**
 * Validation schemas for different operations
 */
const validationSchemas = {
  // User registration validation
  userRegistration: [
    validationRules.email,
    validationRules.username,
    validationRules.password,
    validationRules.phoneNumber(),
    validationRules.cnic,
    validationRules.name('fullName.firstName'),
    validationRules.name('fullName.lastName'),
    validationRules.gender,
    validationRules.date('dateOfBirth'),
    validationRules.role,
    body('institute')
      .isMongoId()
      .withMessage('Invalid institute ID'),
    body('fullName.firstName').notEmpty().withMessage('First name is required'),
    body('fullName.lastName').notEmpty().withMessage('Last name is required'),
    body('familyInfo.fatherName')
      .notEmpty()
      .withMessage('Father name is required')
      .isLength({ max: 100 })
      .withMessage('Father name cannot exceed 100 characters')
      .trim(),
    body('familyInfo.emergencyContact.name')
      .notEmpty()
      .withMessage('Emergency contact name is required'),
    body('familyInfo.emergencyContact.relationship')
      .notEmpty()
      .withMessage('Emergency contact relationship is required'),
    body('familyInfo.emergencyContact.phone')
      .matches(/^(\+92|0)?[0-9]{10}$/)
      .withMessage('Please provide a valid emergency contact phone number'),
    handleValidationErrors
  ],

  // User login validation
  userLogin: [
    body('login')
      .notEmpty()
      .withMessage('Email or username is required')
      .trim(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],

  // Password change validation
  passwordChange: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    validationRules.password,
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match');
        }
        return true;
      }),
    handleValidationErrors
  ],

  // Password reset validation
  passwordReset: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    validationRules.password,
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match');
        }
        return true;
      }),
    handleValidationErrors
  ],

  // Forgot password validation
  forgotPassword: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim(),
    handleValidationErrors
  ],

  // User profile update validation
  userProfileUpdate: [
    body('fullName.firstName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters')
      .trim(),
    body('fullName.lastName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters')
      .trim(),
    body('phoneNumbers.primary')
      .optional()
      .matches(/^(\+92|0)?[0-9]{10}$/)
      .withMessage('Please provide a valid primary phone number'),
    body('phoneNumbers.secondary')
      .optional()
      .matches(/^(\+92|0)?[0-9]{10}$/)
      .withMessage('Please provide a valid secondary phone number'),
    body('profileImage')
      .optional()
      .isURL()
      .withMessage('Profile image must be a valid URL'),
    handleValidationErrors
  ],

  // Institute creation validation
  instituteCreation: [
    body('name')
      .notEmpty()
      .withMessage('Institute name is required')
      .isLength({ max: 200 })
      .withMessage('Institute name cannot exceed 200 characters')
      .trim(),
    validationRules.instituteCode,
    body('type')
      .isIn(['College', 'University', 'School', 'Institute'])
      .withMessage('Invalid institute type'),
    body('contactInfo.email')
      .isEmail()
      .withMessage('Please provide a valid institute email')
      .normalizeEmail()
      .trim(),
    body('contactInfo.phone')
      .matches(/^(\+92|0)?[0-9]{10}$/)
      .withMessage('Please provide a valid institute phone number'),
    body('address.street')
      .notEmpty()
      .withMessage('Street address is required'),
    body('address.city')
      .notEmpty()
      .withMessage('City is required'),
    body('academicInfo.establishedYear')
      .isInt({ min: 1800, max: new Date().getFullYear() })
      .withMessage('Please provide a valid established year'),
    handleValidationErrors
  ],

  // Pagination validation
  pagination: [
    validationRules.page,
    validationRules.limit,
    handleValidationErrors
  ],

  // Search validation
  search: [
    validationRules.search,
    handleValidationErrors
  ],

  // MongoDB ID validation
  mongoIdParam: (paramName = 'id') => [
    validationRules.mongoId(paramName),
    handleValidationErrors
  ]
};

/**
 * Custom validation middleware for file uploads
 */
const validateFileUpload = (allowedTypes = ['image/jpeg', 'image/png'], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files were uploaded'
      });
    }

    const file = req.files.file || Object.values(req.files)[0];

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      });
    }

    // Check file size
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      });
    }

    next();
  };
};

/**
 * Sanitize input middleware
 */
const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS attempts from string fields
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Basic XSS prevention
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+="[^"]*"/g, '')
          .replace(/on\w+='[^']*'/g, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

module.exports = {
  validationRules,
  validationSchemas,
  handleValidationErrors,
  validateFileUpload,
  sanitizeInput
};
