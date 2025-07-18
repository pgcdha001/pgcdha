/**
 * Enhanced API Error Handler
 * Provides consistent error handling and user feedback
 */

export class ApiError extends Error {
  constructor(message, status, code, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  static fromResponse(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      return new ApiError(
        data.message || 'Server error occurred',
        status,
        data.code || 'SERVER_ERROR',
        data.errors || null
      );
    } else if (error.request) {
      // Network error
      return new ApiError(
        'Network error - please check your connection',
        0,
        'NETWORK_ERROR'
      );
    } else {
      // Other error
      return new ApiError(
        error.message || 'Unexpected error occurred',
        0,
        'UNKNOWN_ERROR'
      );
    }
  }

  getUserMessage() {
    switch (this.code) {
      case 'NETWORK_ERROR':
        return 'Please check your internet connection and try again.';
      case 'UNAUTHORIZED':
        return 'Your session has expired. Please log in again.';
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action.';
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      case 'VALIDATION_ERROR':
        return this.details ? 
          `Please check: ${this.details.map(d => d.field).join(', ')}` : 
          'Please check the form data and try again.';
      case 'DUPLICATE_FIELD':
        return `This ${this.details?.field || 'information'} already exists.`;
      default:
        return this.message;
    }
  }
}

export const handleApiError = (error, toast, defaultMessage = 'An error occurred') => {
  const apiError = ApiError.fromResponse(error);
  const userMessage = apiError.getUserMessage();
  
  // Log error for debugging
  if (import.meta.env.DEV) {
    console.error('API Error:', {
      message: apiError.message,
      status: apiError.status,
      code: apiError.code,
      details: apiError.details,
      timestamp: apiError.timestamp
    });
  }
  
  // Show user-friendly message
  toast.error(userMessage || defaultMessage);
  
  return apiError;
};
