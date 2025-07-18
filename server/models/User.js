const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Simplified Family Info Schema - keeping only essential family details
const FamilyInfoSchema = new mongoose.Schema({
  fatherName: String,
  fatherOccupation: String,
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  // Core Identity Fields
  userName: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true }
  },
  role: { type: String, required: true }, // e.g., 'SystemAdmin', 'Teacher', etc.
  roleId: { type: String }, // for legacy mapping if needed
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
  status: { type: Number, default: 1 }, // 1=Active, 2=Paused, 3=Deleted

  // Contact Information - simplified to essential fields only
  phoneNumber: String,    // Primary phone number
  secondaryPhone: String, // Secondary phone number (optional)
  address: String,
  reference: String,      // Reference person name
  
  // Academic Background - simplified
  previousSchool: String,  // Previous school/college name
  program: {              // Student program
    type: String,
    enum: ['ICS', 'ICOM', 'Pre Engineering', 'Pre Medical'],
    required: false
  },
  
  // Matriculation Details - simplified
  matricMarks: Number,     // Marks obtained in matriculation
  matricTotal: Number,     // Total marks in matriculation
  
  // Personal Information
  gender: String,
  dob: Date,
  cnic: String,
  fatherName: String,      // Added for student father name
  imageUrl: String,

  // Campus Assignment (for attendance tracking)
  campus: {
    type: String,
    enum: ['Boys', 'Girls'],
    required: false // Will be auto-assigned based on gender for active students
  },

  // System Fields
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
  deletedAt: { type: Date }, // Added for soft delete
  lastPasswordChangedOn: Date,
  cookieId: String,
  newLoginOTP: String,

  // Class Assignment for Students
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  
  // Enquiry Level System (1-5)
  enquiryLevel: { 
    type: Number, 
    default: 1,
    min: 1,
    max: 5,
    required: true
  }, // 1: Initial Enquiry, 2: Follow-up, 3: Serious Interest, 4: Documents Submitted, 5: Admitted
  
  // Additional Information for Level 5 (Admitted) Students
  admissionInfo: {
    grade: {
      type: String,
      enum: ['11th', '12th'],
      required: function() { return this.enquiryLevel === 5; }
    },
    className: {
      type: String,
      required: false
    }
  },
  
  // Essential Student Fields Only
  prospectusStage: { type: Number, default: 1 }, // Keep for backward compatibility
  isEnrolledPreClasses: { type: Boolean, default: false },
  
  // Enquiry Progression Tracking
  prospectusPurchasedOn: Date,
  afSubmittedOn: Date,
  installmentSubmittedOn: Date,
  isProcessed: { type: Boolean, default: false },

  // Family Info (for all roles)
  familyInfo: FamilyInfoSchema,

  // Attendance (relationship)
  attendance: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' }],

  // Receptionist Remarks
  receptionistRemarks: [{
    remark: { type: String, required: true },
    receptionistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receptionistName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],

  // Misc
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false }
});

// Password hashing pre-save hook
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for accountStatus
UserSchema.virtual('accountStatus').get(function() {
  if (this.status === 1 && this.isActive && this.isApproved) return 'Active';
  if (this.status === 2 || this.isSuspended || this.isActive === false) return 'Paused';
  return 'Pending';
});

module.exports = mongoose.model('User', UserSchema);
