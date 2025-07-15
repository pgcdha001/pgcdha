const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const RolePermission = require('../models/RolePermission');
const Session = require('../models/Session');
const AuditLog = require('../models/AuditLog');

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

// Reset database
const resetDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🧹 Starting database reset...\n');
    
    // Clear all collections
    await User.deleteMany({});
    console.log('✓ Cleared Users collection');
    
    await RolePermission.deleteMany({});
    console.log('✓ Cleared RolePermissions collection');
    
    await Session.deleteMany({});
    console.log('✓ Cleared Sessions collection');
    
    await AuditLog.deleteMany({});
    console.log('✓ Cleared AuditLogs collection');
    
    console.log('\n✅ Database reset completed successfully!');
    console.log('You can now run "npm run seed" to populate with fresh data.');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

// Run reset if this file is executed directly
if (require.main === module) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('⚠️  This will delete ALL data in the database. Are you sure? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      resetDatabase();
    } else {
      console.log('Database reset cancelled.');
      process.exit(0);
    }
    rl.close();
  });
} else {
  module.exports = { resetDatabase };
}
