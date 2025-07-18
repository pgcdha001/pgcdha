const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * Standalone script to update email addresses of deleted users
 * This prevents conflicts when creating new users with the same email
 */

async function updateDeletedUsersEmails() {
  try {
    console.log('🔄 Starting email update process for deleted users...');
    
    // Check if MONGO_URI is available
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI environment variable is not set');
      console.log('💡 Make sure you have a .env file with MONGO_URI defined');
      process.exit(1);
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Find all deleted users (status = 3) that still have their original email
    const deletedUsers = await User.find({
      status: 3,
      email: { $not: /\.deleted\./ } // Find emails that don't contain '.deleted.'
    });
    
    console.log(`📊 Found ${deletedUsers.length} deleted users with original emails`);
    
    if (deletedUsers.length === 0) {
      console.log('✅ No deleted users found with original emails. Database is clean!');
      return;
    }
    
    // Update each deleted user's email
    const updatePromises = deletedUsers.map(async (user) => {
      const timestamp = Date.now();
      const deletedEmail = `${user.email}.deleted.${timestamp}`;
      
      console.log(`🔄 Updating user ${user._id}: ${user.email} -> ${deletedEmail}`);
      
      return User.findByIdAndUpdate(
        user._id,
        { 
          email: deletedEmail,
          updatedOn: new Date()
        },
        { new: true }
      );
    });
    
    // Execute all updates
    const updatedUsers = await Promise.all(updatePromises);
    
    console.log(`✅ Successfully updated ${updatedUsers.length} deleted users`);
    
    // Verify the updates
    const remainingConflicts = await User.find({
      status: 3,
      email: { $not: /\.deleted\./ }
    });
    
    if (remainingConflicts.length === 0) {
      console.log('✅ All deleted users have been updated successfully!');
      console.log('✅ Email conflicts have been resolved.');
    } else {
      console.log(`⚠️  Warning: ${remainingConflicts.length} users still have conflicting emails`);
    }
    
    // Show summary
    console.log('\n📋 Summary:');
    console.log(`   - Users processed: ${deletedUsers.length}`);
    console.log(`   - Users updated: ${updatedUsers.length}`);
    console.log(`   - Remaining conflicts: ${remainingConflicts.length}`);
    
  } catch (error) {
    console.error('❌ Error updating deleted users emails:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script if called directly
if (require.main === module) {
  console.log('🚀 Starting email cleanup script for deleted users...');
  updateDeletedUsersEmails();
}

module.exports = updateDeletedUsersEmails;
