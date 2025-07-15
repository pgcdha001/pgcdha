require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function updateUserStatus() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    // Update all users to Active status
    const result = await User.updateMany({}, { accountStatus: 'Active' });
    console.log(`Updated ${result.modifiedCount} users to Active status`);
    
    // Verify the update
    const users = await User.find({}, 'username email accountStatus role');
    console.log('\nCurrent users:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Status: ${user.accountStatus}, Role: ${user.role}`);
    });
    
    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateUserStatus();
