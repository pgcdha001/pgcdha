// resetUsersAndCreateAdmin.js
// Script to delete all users and create a single SystemAdmin

const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Use the provided MongoDB URI directly
const mongoUri = 'mongodb+srv://sajidmehmood:3V4PyBh3h4SFnw%40@cluster0.yhma3.mongodb.net/pgc';

// Default admin credentials (change as needed)
const adminEmail = 'admin@pgc.edu.pk';
const adminPassword = 'admin123';
const adminUserName = 'sysadmin';
const adminFullName = { firstName: 'System', lastName: 'Admin' };

async function main() {
  console.log('Connecting to MongoDB:', mongoUri);

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Delete all users
    const deleteResult = await User.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} users.`);

    // Create SystemAdmin user
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const adminUser = new User({
      userName: adminUserName,
      email: adminEmail,
      password: hashedPassword,
      fullName: adminFullName,
      role: 'SystemAdmin',
      status: 1,
      isActive: true,
      isApproved: true
    });
    await adminUser.save();
    console.log('SystemAdmin user created:', {
      email: adminEmail,
      password: adminPassword,
      userName: adminUserName
    });

    console.log('Reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('Reset script failed:', error);
    process.exit(1);
  }
}

main(); 