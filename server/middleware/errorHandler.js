/**
 * Global error handling middleware
 */
const errorHandler = async (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    error = {
      message,
      statusCode: 400,
      code: 'INVALID_ID_FORMAT'
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = {
      message,
      statusCode: 400,
      code: 'DUPLICATE_FIELD',
      field
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message,
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      errors: Object.values(err.errors).map(val => ({
        field: val.path,
        message: val.message,
        value: val.value
      }))
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      statusCode: 401,
      code: 'INVALID_TOKEN'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      statusCode: 401,
      code: 'TOKEN_EXPIRED'
    };
  }

  // Rate limiting error
  if (err.status === 429) {
    error = {
      message: 'Too many requests, please try again later',
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED'
    };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';
  const code = error.code || 'INTERNAL_SERVER_ERROR';

  // Log critical errors
  if (statusCode >= 500) {
    console.error('Critical error occurred:', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?._id
    });
  }

  // Prepare response
  const response = {
    success: false,
    message,
    code
  };

  // Add additional error details in development
  if (process.env.NODE_ENV === 'development') {
    response.error = {
      name: err.name,
      stack: err.stack,
      details: error.errors || undefined
    };
  }

  // Add field-specific errors if available
  if (error.errors) {
    response.errors = error.errors;
  }

  if (error.field) {
    response.field = error.field;
  }

  res.status(statusCode).json(response);
};

/**
 * Handle async errors (wrapper for async route handlers)
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found middleware (404)
 */
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

/**
 * Database connection error handler
 */
const handleDatabaseError = (err) => {
  console.error('Database connection error:', err.message);
  
  // Log database connection issues
  if (process.env.NODE_ENV === 'production') {
    // In production, you might want to send alerts to monitoring services
    console.error('CRITICAL: Database connection failed in production');
  }
  
  process.exit(1);
};

/**
 * Unhandled promise rejection handler
 */
const handleUnhandledRejection = (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  
  // Log unhandled rejections
  console.error('Promise:', promise);
  console.error('Stack:', err.stack);
  
  // Graceful shutdown
  process.exit(1);
};

/**
 * Uncaught exception handler
 */
const handleUncaughtException = (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
  
  // Graceful shutdown
  process.exit(1);
};

/**
 * Validation error formatter
 */
const formatValidationError = (errors) => {
  return errors.map(error => ({
    field: error.path || error.param,
    message: error.msg || error.message,
    value: error.value,
    location: error.location
  }));
};

/**
 * HTTP error response helper
 */
const sendErrorResponse = (res, statusCode, message, code = null, errors = null) => {
  const response = {
    success: false,
    message,
    code: code || 'ERROR'
  };

  if (errors) {
    response.errors = errors;
  }

  if (process.env.NODE_ENV === 'development') {
    response.timestamp = new Date().toISOString();
  }

  res.status(statusCode).json(response);
};

/**
 * Success response helper
 */
const sendSuccessResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  if (process.env.NODE_ENV === 'development') {
    response.timestamp = new Date().toISOString();
  }

  res.status(statusCode).json(response);
};

/**
 * Paginated response helper
 */
const sendPaginatedResponse = (res, data, pagination, message = 'Success') => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1
    }
  };

  if (process.env.NODE_ENV === 'development') {
    response.timestamp = new Date().toISOString();
  }

  res.status(200).json(response);
};

module.exports = {
  errorHandler,
  asyncHandler,
  AppError,
  notFound,
  handleDatabaseError,
  handleUnhandledRejection,
  handleUncaughtException,
  formatValidationError,
  sendErrorResponse,
  sendSuccessResponse,
  sendPaginatedResponse
};
