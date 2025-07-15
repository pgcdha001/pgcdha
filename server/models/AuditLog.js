const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // User Context (PGC DHA Campus)
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
  
  // Action Information
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      // Authentication actions
      'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGED', 'PASSWORD_RESET_REQUESTED',
      'PASSWORD_RESET_COMPLETED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'SESSION_EXPIRED',
      'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED', 'TWO_FACTOR_VERIFIED',
      
      // User management actions
      'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_ROLE_CHANGED', 'USER_STATUS_CHANGED',
      'USER_PROFILE_UPDATED', 'USER_PERMISSIONS_CHANGED',
      
      // Academic actions
      'STUDENT_ENROLLED', 'STUDENT_TRANSFERRED', 'STUDENT_GRADUATED', 'ATTENDANCE_MARKED',
      'GRADES_ENTERED', 'GRADES_MODIFIED', 'EXAM_CREATED', 'EXAM_UPDATED', 'EXAM_DELETED',
      
      // Financial actions
      'FEE_PAID', 'FEE_WAIVED', 'FEE_REFUNDED', 'FEE_STRUCTURE_UPDATED', 'SCHOLARSHIP_AWARDED',
      
      // System actions
      'SYSTEM_BACKUP', 'SYSTEM_RESTORE', 'DATA_EXPORT', 'DATA_IMPORT', 'SETTINGS_CHANGED',
      'INSTITUTE_CREATED', 'INSTITUTE_UPDATED', 'INSTITUTE_DELETED', 'SYSTEM_ERROR',
      
      // Security actions
      'SECURITY_BREACH_DETECTED', 'SUSPICIOUS_ACTIVITY', 'ADMIN_ACCESS', 'PERMISSION_DENIED',
      'DATA_ACCESS', 'REPORT_GENERATED', 'BULK_OPERATION'
    ]
  },
  
  // Resource Information
  resource: {
    type: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: ['User', 'Student', 'Teacher', 'Class', 'Exam', 'Fee', 'Institute', 'System', 'Report', 'Setting']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: function() {
        return this.resource.type !== 'System';
      }
    },
    name: String // Human readable resource name
  },
  
  // Action Details
  details: {
    description: {
      type: String,
      required: [true, 'Action description is required']
    },
    oldValues: mongoose.Schema.Types.Mixed, // Previous values for updates
    newValues: mongoose.Schema.Types.Mixed, // New values for updates
    metadata: mongoose.Schema.Types.Mixed, // Additional context data
    affectedRecords: {
      type: Number,
      default: 1
    }
  },
  
  // Request Information
  requestInfo: {
    ipAddress: {
      type: String,
      required: [true, 'IP address is required']
    },
    userAgent: String,
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session'
    },
    requestId: String, // Unique request identifier for tracing
    endpoint: String, // API endpoint called
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
  },
  
  // Result Information
  result: {
    status: {
      type: String,
      required: [true, 'Result status is required'],
      enum: ['SUCCESS', 'FAILED', 'PARTIAL', 'DENIED']
    },
    statusCode: Number, // HTTP status code
    errorMessage: String,
    errorCode: String
  },
  
  // Security Context
  security: {
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW'
    },
    requiresReview: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String,
    tags: [String] // For categorization and filtering
  },
  
  // Location Information
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Temporal Information
  timestamp: {
    type: Date,
    default: Date.now,
    required: [true, 'Timestamp is required']
  },
  duration: {
    type: Number, // Action duration in milliseconds
    min: [0, 'Duration cannot be negative']
  }
}, {
  timestamps: false, // Using custom timestamp field
  collection: 'audit_logs'
});

// Indexes for performance and querying
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ 'resource.type': 1, 'resource.id': 1 });
auditLogSchema.index({ 'result.status': 1 });
auditLogSchema.index({ 'security.riskLevel': 1 });
auditLogSchema.index({ 'security.requiresReview': 1 });
auditLogSchema.index({ 'requestInfo.ipAddress': 1 });
auditLogSchema.index({ timestamp: -1 }); // For general time-based queries

// Compound indexes for common queries
auditLogSchema.index({ user: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ 'security.riskLevel': 1, timestamp: -1 });

// TTL index for automatic log cleanup (keep logs for 2 years)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 });

// Virtual for human-readable timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Virtual for action severity
auditLogSchema.virtual('severity').get(function() {
  const highRiskActions = [
    'ACCOUNT_LOCKED', 'PASSWORD_RESET_COMPLETED', 'USER_DELETED', 'USER_ROLE_CHANGED',
    'SECURITY_BREACH_DETECTED', 'SUSPICIOUS_ACTIVITY', 'SYSTEM_BACKUP', 'SYSTEM_RESTORE',
    'DATA_EXPORT', 'BULK_OPERATION'
  ];
  
  const mediumRiskActions = [
    'LOGIN_FAILED', 'PASSWORD_CHANGED', 'USER_CREATED', 'USER_UPDATED', 'USER_STATUS_CHANGED',
    'FEE_WAIVED', 'FEE_REFUNDED', 'SETTINGS_CHANGED', 'PERMISSION_DENIED'
  ];
  
  if (highRiskActions.includes(this.action)) return 'HIGH';
  if (mediumRiskActions.includes(this.action)) return 'MEDIUM';
  return 'LOW';
});

// Static method to log an action
auditLogSchema.statics.logAction = async function(logData) {
  try {
    // Calculate risk level if not provided
    let riskLevel = logData.security?.riskLevel;
    if (!riskLevel) {
      const highRiskActions = [
        'ACCOUNT_LOCKED', 'PASSWORD_RESET_COMPLETED', 'USER_DELETED', 'USER_ROLE_CHANGED',
        'SECURITY_BREACH_DETECTED', 'SUSPICIOUS_ACTIVITY', 'SYSTEM_BACKUP', 'SYSTEM_RESTORE',
        'DATA_EXPORT', 'BULK_OPERATION', 'SYSTEM_ERROR'
      ];
      
      const mediumRiskActions = [
        'LOGIN_FAILED', 'PASSWORD_CHANGED', 'USER_CREATED', 'USER_UPDATED', 'USER_STATUS_CHANGED',
        'FEE_WAIVED', 'FEE_REFUNDED', 'SETTINGS_CHANGED', 'PERMISSION_DENIED'
      ];
      
      if (highRiskActions.includes(logData.action)) {
        riskLevel = 'HIGH';
      } else if (mediumRiskActions.includes(logData.action)) {
        riskLevel = 'MEDIUM';
      } else {
        riskLevel = 'LOW';
      }
    }

    // Set default values
    const auditEntry = new this({
      ...logData,
      timestamp: logData.timestamp || new Date(),
      security: {
        ...logData.security,
        riskLevel
      }
    });
    
    // Set requiresReview based on risk level
    if (auditEntry.security.riskLevel === 'HIGH' || auditEntry.security.riskLevel === 'CRITICAL') {
      auditEntry.security.requiresReview = true;
    }
    
    return await auditEntry.save();
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to prevent breaking the main operation
    return null;
  }
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = function(userId, options = {}) {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate = new Date(),
    actions = null,
    limit = 50,
    page = 1
  } = options;
  
  const query = {
    user: userId,
    timestamp: { $gte: startDate, $lte: endDate }
  };
  
  if (actions && actions.length > 0) {
    query.action = { $in: actions };
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate('user', 'fullName email');
};

// Static method to get security alerts
auditLogSchema.statics.getSecurityAlerts = function(options = {}) {
  const {
    riskLevel = ['HIGH', 'CRITICAL'],
    requiresReview = true,
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    endDate = new Date()
  } = options;
  
  const query = {
    timestamp: { $gte: startDate, $lte: endDate },
    'security.riskLevel': { $in: riskLevel }
  };
  
  if (requiresReview !== null) {
    query['security.requiresReview'] = requiresReview;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .populate('user', 'fullName email role');
};

// Static method to get audit statistics
auditLogSchema.statics.getStatistics = function(period = '24h') {
  const periodMap = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  
  const startDate = new Date(Date.now() - periodMap[period]);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          status: '$result.status'
        },
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        total: { $sum: '$count' },
        successful: {
          $sum: {
            $cond: [{ $eq: ['$_id.status', 'SUCCESS'] }, '$count', 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$_id.status', 'FAILED'] }, '$count', 0]
          }
        },
        lastActivity: { $max: '$lastOccurrence' }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
