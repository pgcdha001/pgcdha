const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  instituteName: {
    type: String,
    default: 'Punjab Group of Colleges - DHA Campus',
    immutable: true
  },
  
  // Token Information
  refreshToken: {
    type: String,
    required: [true, 'Refresh token is required'],
    unique: true
  },
  accessTokenVersion: {
    type: Number,
    default: 0
  },
  
  // Device & Location Information
  deviceInfo: {
    userAgent: {
      type: String,
      required: [true, 'User agent is required']
    },
    deviceType: {
      type: String,
      enum: ['Desktop', 'Mobile', 'Tablet', 'Unknown'],
      default: 'Unknown'
    },
    browser: String,
    os: String,
    deviceId: String // Unique identifier for the device
  },
  
  ipAddress: {
    type: String,
    required: [true, 'IP address is required']
  },
  
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String
  },
  
  // Session Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  lastActivity: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  
  // Security
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedAt: Date,
  revokedReason: {
    type: String,
    enum: ['UserLogout', 'AdminRevoked', 'SecurityBreach', 'TokenRefresh', 'AccountDeactivated']
  },
  
  // Login Context
  loginMethod: {
    type: String,
    enum: ['Password', 'TwoFactor', 'SSO', 'AdminCreated'],
    default: 'Password'
  },
  
  // Risk Assessment
  riskScore: {
    type: Number,
    min: [0, 'Risk score cannot be negative'],
    max: [100, 'Risk score cannot exceed 100'],
    default: 0
  },
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for performance and security
sessionSchema.index({ user: 1, isActive: 1 });
sessionSchema.index({ refreshToken: 1 });
sessionSchema.index({ ipAddress: 1 });
sessionSchema.index({ expiresAt: 1 });
sessionSchema.index({ isRevoked: 1 });
sessionSchema.index({ lastActivity: -1 });
sessionSchema.index({ createdAt: -1 });

// Compound indexes
sessionSchema.index({ user: 1, deviceInfo: 1 });

// Virtual to check if session is expired
sessionSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Virtual to check if session is valid
sessionSchema.virtual('isValid').get(function() {
  return this.isActive && !this.isRevoked && !this.isExpired;
});

// Virtual for session duration
sessionSchema.virtual('duration').get(function() {
  return this.lastActivity - this.createdAt;
});

// Method to update last activity
sessionSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Method to revoke session
sessionSchema.methods.revoke = function(reason = 'UserLogout') {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  this.isActive = false;
  return this.save();
};

// Method to extend session expiry
sessionSchema.methods.extend = function(duration = 7 * 24 * 60 * 60 * 1000) { // 7 days default
  this.expiresAt = new Date(Date.now() + duration);
  return this.save();
};

// Static method to cleanup expired sessions
sessionSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isRevoked: true, revokedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Remove revoked sessions older than 24 hours
    ]
  });
};

// Static method to revoke all user sessions
sessionSchema.statics.revokeAllUserSessions = function(userId, reason = 'SecurityBreach') {
  return this.updateMany(
    { user: userId, isActive: true },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
        isActive: false
      }
    }
  );
};

// Static method to get active sessions for user
sessionSchema.statics.getActiveSessions = function(userId) {
  return this.find({
    user: userId,
    isActive: true,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).sort({ lastActivity: -1 });
};

// Pre-save middleware to set expiry if not provided
sessionSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    // Default session expires in 7 days
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Pre-save middleware to parse user agent
sessionSchema.pre('save', function(next) {
  if (this.isNew && this.deviceInfo.userAgent) {
    // Simple user agent parsing (in production, use a library like 'ua-parser-js')
    const ua = this.deviceInfo.userAgent.toLowerCase();
    
    // Detect device type
    if (ua.includes('mobile')) {
      this.deviceInfo.deviceType = 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      this.deviceInfo.deviceType = 'Tablet';
    } else {
      this.deviceInfo.deviceType = 'Desktop';
    }
    
    // Detect browser
    if (ua.includes('chrome')) {
      this.deviceInfo.browser = 'Chrome';
    } else if (ua.includes('firefox')) {
      this.deviceInfo.browser = 'Firefox';
    } else if (ua.includes('safari')) {
      this.deviceInfo.browser = 'Safari';
    } else if (ua.includes('edge')) {
      this.deviceInfo.browser = 'Edge';
    } else {
      this.deviceInfo.browser = 'Unknown';
    }
    
    // Detect OS
    if (ua.includes('windows')) {
      this.deviceInfo.os = 'Windows';
    } else if (ua.includes('mac')) {
      this.deviceInfo.os = 'macOS';
    } else if (ua.includes('linux')) {
      this.deviceInfo.os = 'Linux';
    } else if (ua.includes('android')) {
      this.deviceInfo.os = 'Android';
    } else if (ua.includes('ios')) {
      this.deviceInfo.os = 'iOS';
    } else {
      this.deviceInfo.os = 'Unknown';
    }
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);
