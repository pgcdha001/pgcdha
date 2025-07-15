const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Identity Fields
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  phoneNumbers: {
    primary: {
      type: String,
      required: [true, 'Primary phone number is required'],
      match: [/^(\+92|0)?[0-9]{10}$/, 'Please enter a valid phone number']
    },
    secondary: {
      type: String,
      match: [/^(\+92|0)?[0-9]{10}$/, 'Please enter a valid phone number']
    },
    emergency: {
      type: String,
      match: [/^(\+92|0)?[0-9]{10}$/, 'Please enter a valid phone number']
    }
  },
  
  // Personal Information
  fullName: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    }
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(value) {
        return value < new Date();
      },
      message: 'Date of birth must be in the past'
    }
  },
  cnic: {
    type: String,
    required: [true, 'CNIC is required'],
    unique: true,
    match: [/^[0-9]{5}-[0-9]{7}-[0-9]$/, 'Please enter a valid CNIC format (12345-1234567-1)']
  },
  profileImage: {
    type: String,
    default: null
  },

  // Academic Info (PGC DHA Campus)
  instituteName: {
    type: String,
    default: 'Punjab Group of Colleges - DHA Campus',
    immutable: true
  },
  currentClass: {
    type: String,
    required: function() {
      return this.role === 'Student';
    }
  },
  academicSession: {
    type: String,
    required: function() {
      return this.role === 'Student';
    }
  },
  academicYear: {
    type: Number,
    required: function() {
      return this.role === 'Student';
    }
  },
  
  // Simple role field
  role: {
    type: String,
    enum: ['Super Admin', 'College Admin', 'Academic Admin', 'Teacher', 'Student', 'Finance Admin', 'Receptionist'],
    default: 'Student'
  },

  // User Status
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },

  // Family & Background Information
  familyInfo: {
    fatherName: {
      type: String,
      required: [true, 'Father name is required'],
      trim: true,
      maxlength: [100, 'Father name cannot exceed 100 characters']
    },
    fatherOccupation: {
      type: String,
      trim: true,
      maxlength: [100, 'Father occupation cannot exceed 100 characters']
    },
    fatherWorkplace: {
      type: String,
      trim: true,
      maxlength: [200, 'Father workplace cannot exceed 200 characters']
    },
    homeAddress: {
      street: String,
      area: String,
      city: String,
      district: String,
      province: String,
      postalCode: String
    },
    emergencyContact: {
      name: {
        type: String,
        required: [true, 'Emergency contact name is required']
      },
      relationship: {
        type: String,
        required: [true, 'Emergency contact relationship is required']
      },
      phone: {
        type: String,
        required: [true, 'Emergency contact phone is required'],
        match: [/^(\+92|0)?[0-9]{10}$/, 'Please enter a valid phone number']
      }
    }
  },

  // Academic Records
  academicHistory: {
    matriculation: {
      marks: {
        type: Number,
        min: [0, 'Marks cannot be negative'],
        max: [1100, 'Marks cannot exceed 1100']
      },
      totalMarks: {
        type: Number,
        default: 1100
      },
      rollNumber: String,
      year: {
        type: Number,
        min: [1900, 'Year must be valid'],
        max: [new Date().getFullYear(), 'Year cannot be in the future']
      },
      board: String
    },
    intermediate: {
      firstYear: {
        marks: Number,
        totalMarks: {
          type: Number,
          default: 550
        }
      },
      secondYear: {
        marks: Number,
        totalMarks: {
          type: Number,
          default: 550
        }
      },
      rollNumber: String,
      year: Number,
      board: String
    }
  },

  // System Metadata
  accountStatus: {
    type: String,
    enum: ['Active', 'Paused', 'Deleted', 'Pending'],
    default: 'Pending'
  },
  inquiryLevel: {
    type: Number,
    min: [1, 'Inquiry level must be between 1 and 6'],
    max: [6, 'Inquiry level must be between 1 and 6'],
    default: 1
  },
  biometricId: {
    type: String,
    unique: true,
    sparse: true // Allow null values but ensure uniqueness when present
  },
  
  // Security & Session Management
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  
  twoFactorAuth: {
    enabled: {
      type: Boolean,
      default: false
    },
    secret: String,
    backupCodes: [String]
  },
  
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  sessions: [{
    token: String,
    device: String,
    ipAddress: String,
    userAgent: String,
    lastActive: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  lastLogin: Date,
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.twoFactorAuth.secret;
      delete ret.sessions;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ institute: 1 });
userSchema.index({ role: 1 });
userSchema.index({ cnic: 1 });
userSchema.index({ 'phoneNumbers.primary': 1 });
userSchema.index({ accountStatus: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullNameString').get(function() {
  return `${this.fullName.firstName} ${this.fullName.lastName}`;
});

// Virtual for age calculation
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update passwordChangedAt
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after password change
  next();
});

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Alias for comparePassword (for compatibility)
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 attempts for 30 minutes
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // 30 minutes
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
