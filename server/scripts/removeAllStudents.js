const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * Standalone script to remove all students from the database
 * This performs hard delete (permanent removal) of all student records
 */

async function removeAllStudents() {
  try {
    console.log('🔄 Starting student removal process...');
    
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
    
    // First, let's see how many students we have
    const totalStudents = await User.countDocuments({
      role: 'Student'
    });
    
    console.log(`📊 Found ${totalStudents} students in the database`);
    
    if (totalStudents === 0) {
      console.log('✅ No students found in the database. Nothing to remove!');
      return;
    }
    
    // Show confirmation prompt
    console.log('⚠️  WARNING: This will permanently delete ALL student records!');
    console.log('⚠️  This action cannot be undone!');
    console.log('⚠️  Make sure you have a backup if needed!');
    
    // Get all students before deletion for logging
    const studentsToDelete = await User.find({
      role: 'Student'
    }).select('_id fullName email program');
    
    console.log('\n📋 Students to be deleted:');
    studentsToDelete.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.fullName?.firstName} ${student.fullName?.lastName} (${student.email}) - ${student.program}`);
    });
    
    console.log('\n🗑️  Proceeding with deletion...');
    
    // Perform hard delete of all students
    const deleteResult = await User.deleteMany({
      role: 'Student'
    });
    
    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} students`);
    
    // Verify deletion
    const remainingStudents = await User.countDocuments({
      role: 'Student'
    });
    
    if (remainingStudents === 0) {
      console.log('✅ All students have been successfully removed from the database!');
    } else {
      console.log(`⚠️  Warning: ${remainingStudents} students still remain in the database`);
    }
    
    // Show final summary
    console.log('\n📋 Summary:');
    console.log(`   - Students found: ${totalStudents}`);
    console.log(`   - Students deleted: ${deleteResult.deletedCount}`);
    console.log(`   - Students remaining: ${remainingStudents}`);
    
    // Show remaining user counts by role
    const userCounts = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    console.log('\n👥 Remaining users by role:');
    userCounts.forEach(roleCount => {
      console.log(`   - ${roleCount._id}: ${roleCount.count}`);
    });
    
  } catch (error) {
    console.error('❌ Error removing students:', error);
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
  console.log('🚀 Starting student removal script...');
  console.log('⚠️  This script will permanently delete ALL students!');
  
  // Add a small delay to let user see the warning
  setTimeout(() => {
    removeAllStudents();
  }, 2000);
}

module.exports = removeAllStudents;
