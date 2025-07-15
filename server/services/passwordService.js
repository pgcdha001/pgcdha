const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class PasswordService {
  constructor() {
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.maxLoginAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
    this.lockoutTime = parseInt(process.env.LOCKOUT_TIME) || 30; // minutes
    
    // Password complexity requirements
    this.passwordRequirements = {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxRepeatingChars: 3,
      preventCommonPasswords: true
    };

    // Common passwords to reject
    this.commonPasswords = new Set([
      'password', '12345678', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', '123456789', 'password1',
      'iloveyou', 'princess', 'monkey', 'shadow', 'master'
    ]);
  }

  /**
   * Hash password using bcrypt
   * @param {String} password - Plain text password
   * @returns {String} - Hashed password
   */
  async hashPassword(password) {
    try {
      // Validate password before hashing
      this.validatePasswordComplexity(password);
      
      const salt = await bcrypt.genSalt(this.saltRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  /**
   * Compare password with hash
   * @param {String} password - Plain text password
   * @param {String} hash - Hashed password
   * @returns {Boolean} - Match result
   */
  async comparePassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error(`Password comparison failed: ${error.message}`);
    }
  }

  /**
   * Validate password complexity
   * @param {String} password - Password to validate
   * @throws {Error} - If password doesn't meet requirements
   */
  validatePasswordComplexity(password) {
    const errors = [];

    // Check length
    if (password.length < this.passwordRequirements.minLength) {
      errors.push(`Password must be at least ${this.passwordRequirements.minLength} characters long`);
    }

    if (password.length > this.passwordRequirements.maxLength) {
      errors.push(`Password cannot exceed ${this.passwordRequirements.maxLength} characters`);
    }

    // Check character requirements
    if (this.passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.passwordRequirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.passwordRequirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for too many repeating characters
    if (this.hasExcessiveRepeatingChars(password)) {
      errors.push(`Password cannot have more than ${this.passwordRequirements.maxRepeatingChars} consecutive repeating characters`);
    }

    // Check against common passwords
    if (this.passwordRequirements.preventCommonPasswords && this.isCommonPassword(password)) {
      errors.push('Password is too common. Please choose a more secure password');
    }

    // Check for sequences
    if (this.hasCommonSequences(password)) {
      errors.push('Password cannot contain common sequences like "123", "abc", or "qwerty"');
    }

    if (errors.length > 0) {
      throw new Error(errors.join('. '));
    }
  }

  /**
   * Check if password has excessive repeating characters
   * @param {String} password - Password to check
   * @returns {Boolean} - True if has excessive repeating chars
   */
  hasExcessiveRepeatingChars(password) {
    let count = 1;
    let maxCount = 1;
    
    for (let i = 1; i < password.length; i++) {
      if (password[i] === password[i - 1]) {
        count++;
        maxCount = Math.max(maxCount, count);
      } else {
        count = 1;
      }
    }
    
    return maxCount > this.passwordRequirements.maxRepeatingChars;
  }

  /**
   * Check if password is in common passwords list
   * @param {String} password - Password to check
   * @returns {Boolean} - True if common password
   */
  isCommonPassword(password) {
    return this.commonPasswords.has(password.toLowerCase());
  }

  /**
   * Check for common sequences in password
   * @param {String} password - Password to check
   * @returns {Boolean} - True if contains common sequences
   */
  hasCommonSequences(password) {
    const lowerPassword = password.toLowerCase();
    
    // Check for numeric sequences
    const numericSequences = ['123', '234', '345', '456', '567', '678', '789', '890'];
    const reverseNumericSequences = ['321', '432', '543', '654', '765', '876', '987', '098'];
    
    // Check for alphabetic sequences
    const alphabeticSequences = ['abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij'];
    const reverseAlphabeticSequences = ['cba', 'dcb', 'edc', 'fed', 'gfe', 'hgf', 'ihg', 'jih'];
    
    // Check for keyboard sequences
    const keyboardSequences = ['qwe', 'wer', 'ert', 'rty', 'tyu', 'yui', 'uio', 'iop'];
    const reverseKeyboardSequences = ['ewq', 'rew', 'tre', 'ytr', 'uyt', 'iuy', 'oiu', 'poi'];
    
    const allSequences = [
      ...numericSequences,
      ...reverseNumericSequences,
      ...alphabeticSequences,
      ...reverseAlphabeticSequences,
      ...keyboardSequences,
      ...reverseKeyboardSequences
    ];
    
    return allSequences.some(sequence => lowerPassword.includes(sequence));
  }

  /**
   * Generate secure random password
   * @param {Number} length - Password length (default: 12)
   * @param {Object} options - Password generation options
   * @returns {String} - Generated password
   */
  generateSecurePassword(length = 12, options = {}) {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSpecialChars = true,
      excludeSimilar = true // Exclude similar looking characters
    } = options;

    let charset = '';
    
    if (includeUppercase) {
      charset += excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    
    if (includeLowercase) {
      charset += excludeSimilar ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
    }
    
    if (includeNumbers) {
      charset += excludeSimilar ? '23456789' : '0123456789';
    }
    
    if (includeSpecialChars) {
      charset += '!@#$%^&*';
    }

    if (charset === '') {
      throw new Error('At least one character set must be included');
    }

    let password = '';
    
    // Ensure at least one character from each selected set
    if (includeUppercase) {
      const upperChars = excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      password += upperChars[crypto.randomInt(0, upperChars.length)];
    }
    
    if (includeLowercase) {
      const lowerChars = excludeSimilar ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
      password += lowerChars[crypto.randomInt(0, lowerChars.length)];
    }
    
    if (includeNumbers) {
      const numberChars = excludeSimilar ? '23456789' : '0123456789';
      password += numberChars[crypto.randomInt(0, numberChars.length)];
    }
    
    if (includeSpecialChars) {
      const specialChars = '!@#$%^&*';
      password += specialChars[crypto.randomInt(0, specialChars.length)];
    }

    // Fill remaining length with random characters
    for (let i = password.length; i < length; i++) {
      password += charset[crypto.randomInt(0, charset.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return this.shuffleString(password);
  }

  /**
   * Shuffle string characters randomly
   * @param {String} str - String to shuffle
   * @returns {String} - Shuffled string
   */
  shuffleString(str) {
    const array = str.split('');
    for (let i = array.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array.join('');
  }

  /**
   * Generate password reset token
   * @returns {Object} - Token and expiry
   */
  generatePasswordResetToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    return {
      token: token, // Send this to user
      hashedToken: hashedToken, // Store this in database
      expiry: expiry
    };
  }

  /**
   * Verify password reset token
   * @param {String} token - Token from user
   * @param {String} hashedToken - Token from database
   * @param {Date} expiry - Token expiry date
   * @returns {Boolean} - Verification result
   */
  verifyPasswordResetToken(token, hashedToken, expiry) {
    if (!token || !hashedToken || !expiry) {
      return false;
    }

    // Check if token has expired
    if (new Date() > expiry) {
      return false;
    }

    // Hash the provided token and compare
    const providedHashedToken = crypto.createHash('sha256').update(token).digest('hex');
    return providedHashedToken === hashedToken;
  }

  /**
   * Calculate password strength score
   * @param {String} password - Password to analyze
   * @returns {Object} - Strength analysis
   */
  calculatePasswordStrength(password) {
    let score = 0;
    const feedback = [];
    
    // Length scoring
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    
    // Bonus points
    if (password.length >= 20) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>].*[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1; // Multiple special chars
    
    // Penalties
    if (this.hasExcessiveRepeatingChars(password)) score -= 2;
    if (this.hasCommonSequences(password)) score -= 2;
    if (this.isCommonPassword(password)) score -= 3;
    
    // Ensure score is not negative
    score = Math.max(0, score);
    
    // Determine strength level
    let strength;
    if (score <= 2) {
      strength = 'Very Weak';
      feedback.push('Consider using a longer password with mixed characters');
    } else if (score <= 4) {
      strength = 'Weak';
      feedback.push('Add more character variety and length');
    } else if (score <= 6) {
      strength = 'Moderate';
      feedback.push('Good, but could be stronger with more complexity');
    } else if (score <= 8) {
      strength = 'Strong';
      feedback.push('Very good password strength');
    } else {
      strength = 'Very Strong';
      feedback.push('Excellent password strength');
    }
    
    return {
      score,
      strength,
      feedback,
      maxScore: 10
    };
  }

  /**
   * Check if password meets minimum requirements
   * @param {String} password - Password to check
   * @returns {Boolean} - True if meets requirements
   */
  meetsMinimumRequirements(password) {
    try {
      this.validatePasswordComplexity(password);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate password policy description
   * @returns {Object} - Password policy details
   */
  getPasswordPolicy() {
    return {
      requirements: {
        minLength: this.passwordRequirements.minLength,
        maxLength: this.passwordRequirements.maxLength,
        requireUppercase: this.passwordRequirements.requireUppercase,
        requireLowercase: this.passwordRequirements.requireLowercase,
        requireNumbers: this.passwordRequirements.requireNumbers,
        requireSpecialChars: this.passwordRequirements.requireSpecialChars,
        maxRepeatingChars: this.passwordRequirements.maxRepeatingChars
      },
      description: [
        `Must be between ${this.passwordRequirements.minLength} and ${this.passwordRequirements.maxLength} characters long`,
        'Must contain at least one uppercase letter (A-Z)',
        'Must contain at least one lowercase letter (a-z)',
        'Must contain at least one number (0-9)',
        'Must contain at least one special character (!@#$%^&*)',
        `Cannot have more than ${this.passwordRequirements.maxRepeatingChars} consecutive repeating characters`,
        'Cannot contain common sequences (123, abc, qwerty)',
        'Cannot be a commonly used password'
      ]
    };
  }
}

module.exports = new PasswordService();
