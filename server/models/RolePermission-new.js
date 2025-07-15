const mongoose = require('mongoose');

// Unified schema for both roles and permissions
const rolePermissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['role', 'permission']
  },
  category: {
    type: String,
    required: function() {
      return this.type === 'permission';
    }
  },
  // For roles only - references to permissions
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RolePermission'
  }],
  // Metadata
  isSystem: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure uniqueness within type
rolePermissionSchema.index({ name: 1, type: 1 }, { unique: true });

// Create indexes for better performance
rolePermissionSchema.index({ type: 1 });
rolePermissionSchema.index({ category: 1 });
rolePermissionSchema.index({ isActive: 1 });

const RolePermission = mongoose.model('RolePermission', rolePermissionSchema);

module.exports = RolePermission;
