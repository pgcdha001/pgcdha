/**
 * Migration Service
 * Handles migration of legacy data to new schema format
 */

const User = require('../models/User');
const { normalizeRole, getValidRoles } = require('./roleNormalizer');

/**
 * Migrate all existing users to use normalized role names
 * @returns {Object} Migration results
 */
async function migrateUserRoles() {
  console.log('Starting user role migration...');
  
  const results = {
    totalUsers: 0,
    migratedUsers: 0,
    failedUsers: 0,
    errors: []
  };

  try {
    // Get all users
    const users = await User.find({});
    results.totalUsers = users.length;

    console.log(`Found ${users.length} users to process`);

    for (const user of users) {
      try {
        const originalRole = user.role;
        const normalizedRole = normalizeRole(originalRole);

        // Only update if role needs normalization
        if (originalRole !== normalizedRole) {
          user.role = normalizedRole;
          await user.save();
          results.migratedUsers++;
          
          console.log(`Migrated user ${user.email}: "${originalRole}" -> "${normalizedRole}"`);
        }
      } catch (error) {
        results.failedUsers++;
        results.errors.push({
          userId: user._id,
          email: user.email,
          error: error.message
        });
        
        console.error(`Failed to migrate user ${user.email}:`, error.message);
      }
    }

    console.log('User role migration completed:', results);
    return results;

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Validate all users have valid roles
 * @returns {Object} Validation results
 */
async function validateUserRoles() {
  console.log('Validating user roles...');
  
  const results = {
    totalUsers: 0,
    validUsers: 0,
    invalidUsers: 0,
    invalidRoles: []
  };

  try {
    const users = await User.find({});
    results.totalUsers = users.length;

    const validRoles = getValidRoles();

    for (const user of users) {
      if (validRoles.includes(user.role)) {
        results.validUsers++;
      } else {
        results.invalidUsers++;
        results.invalidRoles.push({
          userId: user._id,
          email: user.email,
          currentRole: user.role
        });
      }
    }

    console.log('Role validation completed:', results);
    return results;

  } catch (error) {
    console.error('Validation failed:', error);
    throw error;
  }
}

/**
 * Get migration statistics
 * @returns {Object} Migration statistics
 */
async function getMigrationStats() {
  try {
    const totalUsers = await User.countDocuments({});
    const validRoles = getValidRoles();
    
    const roleStats = {};
    for (const role of validRoles) {
      roleStats[role] = await User.countDocuments({ role });
    }

    // Count users with potentially legacy roles
    const legacyRoleCount = await User.countDocuments({
      role: { $nin: validRoles }
    });

    return {
      totalUsers,
      validRoles,
      roleStats,
      legacyRoleCount,
      needsMigration: legacyRoleCount > 0
    };

  } catch (error) {
    console.error('Failed to get migration stats:', error);
    throw error;
  }
}

/**
 * Create a backup of current user data before migration
 * @returns {Object} Backup information
 */
async function createUserBackup() {
  try {
    const users = await User.find({}).lean();
    const backupData = {
      timestamp: new Date(),
      userCount: users.length,
      users: users.map(user => ({
        _id: user._id,
        email: user.email,
        userName: user.userName,
        role: user.role,
        fullName: user.fullName,
        status: user.status,
        isActive: user.isActive,
        isApproved: user.isApproved
      }))
    };

    // In a production environment, you might want to save this to a file
    // or store it in a separate collection
    console.log('User backup created:', {
      timestamp: backupData.timestamp,
      userCount: backupData.userCount
    });

    return backupData;

  } catch (error) {
    console.error('Failed to create backup:', error);
    throw error;
  }
}

module.exports = {
  migrateUserRoles,
  validateUserRoles,
  getMigrationStats,
  createUserBackup
}; 