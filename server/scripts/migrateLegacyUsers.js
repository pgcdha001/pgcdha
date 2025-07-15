// migrateLegacyUsers.js
// Script to migrate legacy user data to the new system

const mongoose = require('mongoose');
const migrationService = require('../services/migrationService');

// Use the provided MongoDB URI directly
const mongoUri = 'mongodb+srv://sajidmehmood:3V4PyBh3h4SFnw%40@cluster0.yhma3.mongodb.net/pgc';

async function main() {
  console.log('Connecting to MongoDB:', mongoUri);

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Create a backup before migration
    console.log('Creating backup of user data...');
    const backup = await migrationService.createUserBackup();
    console.log(`Backup created for ${backup.userCount} users at ${backup.timestamp}`);

    // Validate roles before migration
    console.log('Validating user roles before migration...');
    const validationBefore = await migrationService.validateUserRoles();
    console.log('Validation before migration:', validationBefore);

    // Run migration
    console.log('Migrating legacy user roles...');
    const migrationResults = await migrationService.migrateUserRoles();
    console.log('Migration results:', migrationResults);

    // Validate roles after migration
    console.log('Validating user roles after migration...');
    const validationAfter = await migrationService.validateUserRoles();
    console.log('Validation after migration:', validationAfter);

    console.log('Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration script failed:', error);
    process.exit(1);
  }
}

main(); 