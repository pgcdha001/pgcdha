const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Institute = require('../models/Institute');
const RolePermission = require('../models/RolePermission');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pgc');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Seed permissions
const seedPermissions = async () => {
  console.log('Seeding permissions...');
  
  const permissions = [
    // System Administration
    { name: 'super_admin', description: 'Full system access', category: 'system' },
    { name: 'system_settings', description: 'Manage system settings', category: 'system' },
    
    // Institute Management
    { name: 'institute_admin', description: 'Institute administration', category: 'institute' },
    { name: 'manage_institutes', description: 'Create, update, delete institutes', category: 'institute' },
    { name: 'view_institutes', description: 'View institute information', category: 'institute' },
    
    // User Management
    { name: 'manage_users', description: 'Create, update, delete users', category: 'user' },
    { name: 'view_users', description: 'View user information', category: 'user' },
    { name: 'approve_users', description: 'Approve user registrations', category: 'user' },
    
    // Student Management
    { name: 'manage_students', description: 'Manage student records', category: 'student' },
    { name: 'view_students', description: 'View student information', category: 'student' },
    { name: 'enroll_students', description: 'Enroll students in courses', category: 'student' },
    
    // Teacher Management
    { name: 'manage_teachers', description: 'Manage teacher records', category: 'teacher' },
    { name: 'view_teachers', description: 'View teacher information', category: 'teacher' },
    { name: 'assign_teachers', description: 'Assign teachers to courses', category: 'teacher' },
    
    // Course Management
    { name: 'manage_courses', description: 'Create, update, delete courses', category: 'course' },
    { name: 'view_courses', description: 'View course information', category: 'course' },
    { name: 'assign_grades', description: 'Assign grades to students', category: 'course' },
    
    // Academic Management
    { name: 'manage_departments', description: 'Manage academic departments', category: 'academic' },
    { name: 'manage_semesters', description: 'Manage academic semesters', category: 'academic' },
    { name: 'manage_schedules', description: 'Manage class schedules', category: 'academic' },
    
    // Reports and Analytics
    { name: 'view_reports', description: 'View system reports', category: 'report' },
    { name: 'generate_reports', description: 'Generate custom reports', category: 'report' },
    { name: 'export_data', description: 'Export system data', category: 'report' },
    
    // Financial Management
    { name: 'manage_fees', description: 'Manage student fees', category: 'finance' },
    { name: 'view_payments', description: 'View payment records', category: 'finance' },
    { name: 'generate_invoices', description: 'Generate fee invoices', category: 'finance' },
  ];

  for (const permission of permissions) {
    await RolePermission.findOneAndUpdate(
      { name: permission.name, type: 'permission' },
      { ...permission, type: 'permission' },
      { upsert: true, new: true }
    );
  }
  
  console.log(`✓ Seeded ${permissions.length} permissions`);
};

// Seed roles
const seedRoles = async () => {
  console.log('Seeding roles...');
  
  const roles = [
    {
      name: 'Super Admin',
      description: 'System super administrator with full access',
      permissions: ['super_admin', 'system_settings', 'manage_institutes', 'view_institutes']
    },
    {
      name: 'Institute Admin',
      description: 'Institute administrator with full institute access',
      permissions: [
        'institute_admin', 'manage_users', 'view_users', 'approve_users',
        'manage_students', 'view_students', 'enroll_students',
        'manage_teachers', 'view_teachers', 'assign_teachers',
        'manage_courses', 'view_courses',
        'manage_departments', 'manage_semesters', 'manage_schedules',
        'view_reports', 'generate_reports', 'export_data',
        'manage_fees', 'view_payments', 'generate_invoices'
      ]
    },
    {
      name: 'Academic Admin',
      description: 'Academic administration with course and student management',
      permissions: [
        'view_users', 'manage_students', 'view_students', 'enroll_students',
        'manage_teachers', 'view_teachers', 'assign_teachers',
        'manage_courses', 'view_courses',
        'manage_departments', 'manage_semesters', 'manage_schedules',
        'view_reports'
      ]
    },
    {
      name: 'Teacher',
      description: 'Teaching staff with course and student access',
      permissions: [
        'view_students', 'view_courses', 'assign_grades',
        'view_reports'
      ]
    },
    {
      name: 'Student',
      description: 'Student with limited access to own data',
      permissions: ['view_courses']
    },
    {
      name: 'Finance Admin',
      description: 'Financial administration with fee management',
      permissions: [
        'view_students', 'manage_fees', 'view_payments', 'generate_invoices',
        'view_reports', 'export_data'
      ]
    },
    {
      name: 'Receptionist',
      description: 'Front desk staff with basic access',
      permissions: ['view_users', 'view_students', 'view_teachers']
    }
  ];

  for (const roleData of roles) {
    // Get permission ObjectIds
    const permissions = await RolePermission.find({
      name: { $in: roleData.permissions },
      type: 'permission'
    }).select('_id');

    const role = {
      name: roleData.name,
      description: roleData.description,
      permissions: permissions.map(p => p._id),
      type: 'role'
    };

    await RolePermission.findOneAndUpdate(
      { name: roleData.name, type: 'role' },
      role,
      { upsert: true, new: true }
    );
  }
  
  console.log(`✓ Seeded ${roles.length} roles`);
};

// Seed test institute
const seedInstitute = async () => {
  console.log('Seeding test institute...');
  
  const instituteData = {
    name: 'Punjab Group of Colleges',
    code: 'PGC',
    type: 'college',
    address: {
      street: '123 Education Street',
      city: 'Lahore',
      state: 'Punjab',
      country: 'Pakistan',
      postalCode: '54000'
    },
    contact: {
      phone: '+92-42-1234567',
      email: 'info@pgc.edu.pk',
      website: 'https://pgc.edu.pk'
    },
    settings: {
      timezone: 'Asia/Karachi',
      academicYear: '2024-2025',
      currency: 'PKR'
    },
    isActive: true
  };

  const institute = await Institute.findOneAndUpdate(
    { code: 'PGC' },
    instituteData,
    { upsert: true, new: true }
  );
  
  console.log(`✓ Seeded test institute: ${institute.name}`);
  return institute;
};

// Seed test users
const seedUsers = async (institute) => {
  console.log('Seeding test users...');
  
  // Get roles
  const superAdminRole = await RolePermission.findOne({ name: 'Super Admin', type: 'role' });
  const instituteAdminRole = await RolePermission.findOne({ name: 'Institute Admin', type: 'role' });
  const teacherRole = await RolePermission.findOne({ name: 'Teacher', type: 'role' });
  const studentRole = await RolePermission.findOne({ name: 'Student', type: 'role' });

  const users = [
    {
      email: 'superadmin@pgc.edu.pk',
      username: 'superadmin',
      password: 'SuperAdmin123!',
      phoneNumbers: {
        primary: '+923001234567'
      },
      fullName: {
        firstName: 'Super',
        lastName: 'Admin'
      },
      gender: 'Male',
      dateOfBirth: new Date('1990-01-01'),
      cnic: '12345-1234567-1',
      familyInfo: {
        fatherName: 'Super Father',
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Brother',
          phone: '+923009999999'
        }
      },
      roles: [superAdminRole._id],
      institute: institute._id, // Super admin can be associated with institute
      isActive: true,
      isApproved: true
    },
    {
      email: 'admin@pgc.edu.pk',
      username: 'admin',
      password: 'Admin123!',
      phoneNumbers: {
        primary: '+923001234568'
      },
      fullName: {
        firstName: 'Institute',
        lastName: 'Administrator'
      },
      gender: 'Male',
      dateOfBirth: new Date('1985-01-01'),
      cnic: '12345-1234567-2',
      familyInfo: {
        fatherName: 'Admin Father',
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Brother',
          phone: '+923009999998'
        }
      },
      roles: [instituteAdminRole._id],
      institute: institute._id,
      isActive: true,
      isApproved: true
    },
    {
      email: 'teacher@pgc.edu.pk',
      username: 'teacher',
      password: 'Teacher123!',
      phoneNumbers: {
        primary: '+923001234569'
      },
      fullName: {
        firstName: 'John',
        lastName: 'Smith'
      },
      gender: 'Male',
      dateOfBirth: new Date('1988-01-01'),
      cnic: '12345-1234567-3',
      familyInfo: {
        fatherName: 'Teacher Father',
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Brother',
          phone: '+923009999997'
        }
      },
      roles: [teacherRole._id],
      institute: institute._id,
      isActive: true,
      isApproved: true
    },
    {
      email: 'student@pgc.edu.pk',
      username: 'student',
      password: 'Student123!',
      phoneNumbers: {
        primary: '+923001234570'
      },
      fullName: {
        firstName: 'Alice',
        lastName: 'Johnson'
      },
      gender: 'Female',
      dateOfBirth: new Date('2000-01-01'),
      cnic: '12345-1234567-4',
      familyInfo: {
        fatherName: 'Student Father',
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Mother',
          phone: '+923009999996'
        }
      },
      roles: [studentRole._id],
      institute: institute._id,
      currentClass: 'Grade 12',
      academicSession: '2024-2025',
      academicYear: 2024,
      isActive: true,
      isApproved: true
    }
  ];

  for (const userData of users) {
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    userData.password = hashedPassword;

    await User.findOneAndUpdate(
      { email: userData.email },
      userData,
      { upsert: true, new: true }
    );
  }
  
  console.log(`✓ Seeded ${users.length} test users`);
  console.log('\nTest User Credentials:');
  console.log('Super Admin: superadmin@pgc.edu.pk / SuperAdmin123!');
  console.log('Institute Admin: admin@pgc.edu.pk / Admin123!');
  console.log('Teacher: teacher@pgc.edu.pk / Teacher123!');
  console.log('Student: student@pgc.edu.pk / Student123!');
};

// Main seeding function
const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding...\n');
    
    await seedPermissions();
    await seedRoles();
    const institute = await seedInstitute();
    await seedUsers(institute);
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nYou can now test the authentication system with the seeded users.');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
