const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Institute name is required'],
        trim: true,
        maxlength: [200, 'Institute name cannot exceed 200 characters']
    },
    code: {
        type: String,
        required: [true, 'Institute code is required'],
        unique: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z0-9]{3,10}$/, 'Institute code must be 3-10 characters, letters and numbers only']
    },
    type: {
        type: String,
        enum: ['College', 'University', 'School', 'Institute'],
        required: [true, 'Institute type is required']
    },

    // Contact Information
    contactInfo: {
        email: {
            type: String,
            required: [true, 'Institute email is required'],
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
        },
        phone: {
            type: String,
            required: [true, 'Institute phone is required'],
            match: [/^(\+92|0)?[0-9]{10}$/, 'Please enter a valid phone number']
        },
        fax: {
            type: String,
            match: [/^(\+92|0)?[0-9]{10}$/, 'Please enter a valid fax number']
        },
        website: {
            type: String,
            match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
        }
    },

    // Address Information
    address: {
        street: {
            type: String,
            required: [true, 'Street address is required'],
            trim: true
        },
        area: {
            type: String,
            required: [true, 'Area is required'],
            trim: true
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true
        },
        district: {
            type: String,
            required: [true, 'District is required'],
            trim: true
        },
        province: {
            type: String,
            required: [true, 'Province is required'],
            trim: true
        },
        postalCode: {
            type: String,
            match: [/^[0-9]{5}$/, 'Please enter a valid 5-digit postal code']
        },
        country: {
            type: String,
            default: 'Pakistan'
        }
    },

    // Academic Information
    academicInfo: {
        establishedYear: {
            type: Number,
            required: [true, 'Established year is required'],
            min: [1800, 'Established year must be valid'],
            max: [new Date().getFullYear(), 'Established year cannot be in the future']
        },
        affiliatedWith: {
            type: String,
            trim: true
        },
        accreditations: [{
            name: String,
            year: Number,
            validUntil: Date
        }],
        programsOffered: [{
            name: {
                type: String,
                required: true
            },
            level: {
                type: String,
                enum: ['Matric', 'Intermediate', 'Undergraduate', 'Graduate', 'Postgraduate'],
                required: true
            },
            duration: {
                type: String,
                required: true
            },
            isActive: {
                type: Boolean,
                default: true
            }
        }]
    },

    // Administrative Information
    adminInfo: {
        principal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        viceprincipal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        registrar: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        totalStudents: {
            type: Number,
            default: 0,
            min: [0, 'Total students cannot be negative']
        },
        totalStaff: {
            type: Number,
            default: 0,
            min: [0, 'Total staff cannot be negative']
        }
    },

    // Financial Information
    financialInfo: {
        bankDetails: {
            bankName: String,
            accountNumber: String,
            accountTitle: String,
            branchCode: String
        },
        feeStructure: [{
            class: String,
            monthlyFee: {
                type: Number,
                min: [0, 'Fee cannot be negative']
            },
            admissionFee: {
                type: Number,
                min: [0, 'Fee cannot be negative']
            },
            otherCharges: [{
                name: String,
                amount: Number
            }]
        }]
    },

    // System Configuration
    systemConfig: {
        timezone: {
            type: String,
            default: 'Asia/Karachi'
        },
        academicYearStart: {
            type: String,
            default: 'April'
        },
        workingDays: [{
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }],
        sessionTiming: {
            morning: {
                start: String,
                end: String
            },
            evening: {
                start: String,
                end: String
            }
        },
        holidayCalendar: [{
            name: String,
            date: Date,
            type: {
                type: String,
                enum: ['National', 'Religious', 'Institute', 'Academic']
            }
        }]
    },

    // Branding & Customization
    branding: {
        logo: {
            type: String
        },
        primaryColor: {
            type: String,
            default: '#1e40af'
        },
        secondaryColor: {
            type: String,
            default: '#64748b'
        },
        motto: {
            type: String,
            maxlength: [200, 'Motto cannot exceed 200 characters']
        }
    },

    // Subscription & Billing (for SaaS model)
    subscription: {
        plan: {
            type: String,
            enum: ['Basic', 'Standard', 'Premium', 'Enterprise'],
            default: 'Basic'
        },
        status: {
            type: String,
            enum: ['Active', 'Suspended', 'Cancelled', 'Trial'],
            default: 'Trial'
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: {
            type: Date
        },
        maxUsers: {
            type: Number,
            default: 100
        },
        maxStudents: {
            type: Number,
            default: 500
        },
        features: [{
            name: String,
            enabled: {
                type: Boolean,
                default: true
            }
        }]
    },

    // Status & Metadata
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Suspended', 'Pending'],
        default: 'Pending'
    },

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
    toJSON: { virtuals: true }
});

// Indexes for performance
instituteSchema.index({ code: 1 });
instituteSchema.index({ name: 1 });
instituteSchema.index({ status: 1 });
instituteSchema.index({ 'subscription.status': 1 });
instituteSchema.index({ createdAt: -1 });

// Virtual for full address
instituteSchema.virtual('fullAddress').get(function () {
    const addr = this.address;
    return `${addr.street}, ${addr.area}, ${addr.city}, ${addr.district}, ${addr.province}, ${addr.country}`;
});

// Virtual for subscription status
instituteSchema.virtual('isSubscriptionActive').get(function () {
    return this.subscription.status === 'Active' ||
        (this.subscription.status === 'Trial' && this.subscription.endDate > new Date());
});

// Virtual for user limits
instituteSchema.virtual('userLimits').get(function () {
    return {
        maxUsers: this.subscription.maxUsers,
        maxStudents: this.subscription.maxStudents,
        currentUsers: this.adminInfo.totalStaff,
        currentStudents: this.adminInfo.totalStudents
    };
});

// Method to check if institute can add more users
instituteSchema.methods.canAddUsers = function (count = 1) {
    return (this.adminInfo.totalStaff + count) <= this.subscription.maxUsers;
};

// Method to check if institute can add more students
instituteSchema.methods.canAddStudents = function (count = 1) {
    return (this.adminInfo.totalStudents + count) <= this.subscription.maxStudents;
};

// Method to update user counts
instituteSchema.methods.updateUserCounts = async function () {
    const User = require('./User');

    const staffCount = await User.countDocuments({
        institute: this._id,
        role: { $in: ['InstituteAdmin', 'Teacher', 'SRO', 'Accounts', 'IT', 'EMS'] },
        accountStatus: 'Active'
    });

    const studentCount = await User.countDocuments({
        institute: this._id,
        role: 'Student',
        accountStatus: 'Active'
    });

    this.adminInfo.totalStaff = staffCount;
    this.adminInfo.totalStudents = studentCount;

    return this.save();
};

// Method to check feature availability
instituteSchema.methods.hasFeature = function (featureName) {
    const feature = this.subscription.features.find(f => f.name === featureName);
    return feature ? feature.enabled : false;
};

// Pre-save middleware to set default working days
instituteSchema.pre('save', function (next) {
    if (this.isNew && !this.systemConfig.workingDays.length) {
        this.systemConfig.workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }
    next();
});

// Pre-save middleware to set subscription end date for trial
instituteSchema.pre('save', function (next) {
    if (this.isNew && this.subscription.status === 'Trial' && !this.subscription.endDate) {
        this.subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days trial
    }
    next();
});

module.exports = mongoose.model('Institute', instituteSchema);
