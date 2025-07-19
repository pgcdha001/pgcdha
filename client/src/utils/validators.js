/**
 * Input Validation Utilities
 * Comprehensive validation functions for common data types
 */

export const validators = {
  // Email validation
  email: (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return {
      isValid: emailRegex.test(email),
      message: 'Please enter a valid email address'
    };
  },

  // CNIC validation (Pakistani format)
  cnic: (cnic) => {
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    return {
      isValid: cnicRegex.test(cnic),
      message: 'CNIC must be in format: 12345-1234567-1'
    };
  },

  // Phone number validation
  phoneNumber: (phone) => {
    const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
    return {
      isValid: phoneRegex.test(phone.replace(/[\s-]/g, '')),
      message: 'Please enter a valid phone number'
    };
  },

  // Required field validation
  required: (value, fieldName = 'This field') => {
    const isValid = value !== null && value !== undefined && 
                   String(value).trim().length > 0;
    return {
      isValid,
      message: `${fieldName} is required`
    };
  },

  // Name validation (only letters and spaces)
  name: (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return {
      isValid: nameRegex.test(name) && name.trim().length >= 2,
      message: 'Name must contain only letters and be at least 2 characters long'
    };
  },

  // Password strength validation
  password: (password) => {
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const requirements = [];
    if (!hasLength) requirements.push('at least 8 characters');
    if (!hasUppercase) requirements.push('an uppercase letter');
    if (!hasLowercase) requirements.push('a lowercase letter');
    if (!hasNumber) requirements.push('a number');
    if (!hasSpecial) requirements.push('a special character');

    return {
      isValid: requirements.length === 0,
      message: requirements.length > 0 
        ? `Password must contain ${requirements.join(', ')}`
        : 'Password is strong',
      strength: {
        score: 5 - requirements.length,
        maxScore: 5,
        requirements: {
          hasLength,
          hasUppercase,
          hasLowercase,
          hasNumber,
          hasSpecial
        }
      }
    };
  },

  // Date validation
  date: (date, minAge = null, maxAge = null) => {
    const dateObj = new Date(date);
    const now = new Date();
    
    if (isNaN(dateObj.getTime())) {
      return {
        isValid: false,
        message: 'Please enter a valid date'
      };
    }

    if (dateObj > now) {
      return {
        isValid: false,
        message: 'Date cannot be in the future'
      };
    }

    if (minAge || maxAge) {
      const age = now.getFullYear() - dateObj.getFullYear();
      const monthDiff = now.getMonth() - dateObj.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateObj.getDate()) 
        ? age - 1 : age;

      if (minAge && actualAge < minAge) {
        return {
          isValid: false,
          message: `Minimum age requirement is ${minAge} years`
        };
      }

      if (maxAge && actualAge > maxAge) {
        return {
          isValid: false,
          message: `Maximum age limit is ${maxAge} years`
        };
      }
    }

    return {
      isValid: true,
      message: 'Date is valid'
    };
  }
};

// Validate multiple fields
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isFormValid = true;

  Object.keys(validationRules).forEach(fieldName => {
    const rules = validationRules[fieldName];
    const value = formData[fieldName];

    for (const rule of rules) {
      const result = rule.validator(value);
      if (!result.isValid) {
        errors[fieldName] = result.message;
        isFormValid = false;
        break; // Stop at first error for this field
      }
    }
  });

  return {
    isValid: isFormValid,
    errors
  };
};

// Common validation rule sets
export const validationRules = {
  student: {
    firstName: [
      { validator: (value) => validators.required(value, 'First name') },
      { validator: validators.name }
    ],
    lastName: [
      { validator: (value) => validators.required(value, 'Last name') },
      { validator: validators.name }
    ],
    email: [
      { validator: (value) => validators.required(value, 'Email') },
      { validator: validators.email }
    ],
    cnic: [
      { validator: (value) => validators.required(value, 'CNIC') },
      { validator: validators.cnic }
    ],
    phoneNumber: [
      { validator: (value) => validators.required(value, 'Phone number') },
      { validator: validators.phoneNumber }
    ],
    fatherName: [
      { validator: (value) => validators.required(value, 'Father name') },
      { validator: validators.name }
    ]
  },

  teacher: {
    firstName: [
      { validator: (value) => validators.required(value, 'First name') },
      { validator: validators.name }
    ],
    lastName: [
      { validator: (value) => validators.required(value, 'Last name') },
      { validator: validators.name }
    ],
    email: [
      { validator: (value) => validators.required(value, 'Email') },
      { validator: validators.email }
    ],
    phoneNumber: [
      { validator: (value) => validators.required(value, 'Phone number') },
      { validator: validators.phoneNumber }
    ]
  }
};
