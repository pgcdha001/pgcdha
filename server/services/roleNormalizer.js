/**
 * Role Normalization Utility
 * Maps legacy role names to standardized role names for the new system
 */

// Legacy to new role mapping
const ROLE_MAPPING = {
  // Super Admin variations
  'Super Admin': 'SystemAdmin',
  'SuperAdmin': 'SystemAdmin',
  'SUPER_ADMIN': 'SystemAdmin',
  'super_admin': 'SystemAdmin',
  'superadmin': 'SystemAdmin',
  
  // College Admin variations
  'College Admin': 'CollegeAdmin',
  'CollegeAdmin': 'CollegeAdmin',
  'COLLEGE_ADMIN': 'CollegeAdmin',
  'college_admin': 'CollegeAdmin',
  'collegeadmin': 'CollegeAdmin',
  
  // Finance Admin variations
  'Finance Admin': 'FinanceAdmin',
  'FinanceAdmin': 'FinanceAdmin',
  'FINANCE_ADMIN': 'FinanceAdmin',
  'finance_admin': 'FinanceAdmin',
  'financeadmin': 'FinanceAdmin',
  
  // Teacher variations
  'Teacher': 'Teacher',
  'TEACHER': 'Teacher',
  'teacher': 'Teacher',
  'Faculty': 'Teacher',
  'FACULTY': 'Teacher',
  'faculty': 'Teacher',
  'Instructor': 'Teacher',
  'INSTRUCTOR': 'Teacher',
  'instructor': 'Teacher',
  
  // Student variations
  'Student': 'Student',
  'STUDENT': 'Student',
  'student': 'Student',
  'Learner': 'Student',
  'LEARNER': 'Student',
  'learner': 'Student',
  
  // Receptionist variations
  'Receptionist': 'Receptionist',
  'RECEPTIONIST': 'Receptionist',
  'receptionist': 'Receptionist',
  'Front Desk': 'Receptionist',
  'FRONT_DESK': 'Receptionist',
  'front_desk': 'Receptionist',
  
  // Staff variations
  'Staff': 'Staff',
  'STAFF': 'Staff',
  'staff': 'Staff',
  'Employee': 'Staff',
  'EMPLOYEE': 'Staff',
  'employee': 'Staff',
  
  // Parent variations
  'Parent': 'Parent',
  'PARENT': 'Parent',
  'parent': 'Parent',
  'Guardian': 'Parent',
  'GUARDIAN': 'Parent',
  'guardian': 'Parent',
  
  // IT variations
  'IT': 'IT',
  'it': 'IT',
  'It': 'IT',
  'I.T.': 'IT',
  'i.t.': 'IT'
};

// Valid roles in the new system
const VALID_ROLES = [
  'SystemAdmin',
  'CollegeAdmin', 
  'FinanceAdmin',
  'Teacher',
  'Student',
  'Receptionist',
  'Staff',
  'Parent',
  'IT' // <-- Added IT as a valid role
];

/**
 * Normalize a role name to the standard format
 * @param {string} role - The role to normalize
 * @returns {string} - The normalized role name
 */
function normalizeRole(role) {
  if (!role) return null;
  
  const trimmedRole = role.trim();
  
  // Direct mapping
  if (ROLE_MAPPING[trimmedRole]) {
    return ROLE_MAPPING[trimmedRole];
  }
  
  // Case-insensitive mapping
  const lowerRole = trimmedRole.toLowerCase();
  for (const [legacyRole, newRole] of Object.entries(ROLE_MAPPING)) {
    if (legacyRole.toLowerCase() === lowerRole) {
      return newRole;
    }
  }
  
  // If no mapping found, check if it's already a valid role
  if (VALID_ROLES.includes(trimmedRole)) {
    return trimmedRole;
  }
  
  // Default fallback
  return 'Student';
}

/**
 * Get all valid roles
 * @returns {string[]} - Array of valid role names
 */
function getValidRoles() {
  return [...VALID_ROLES];
}

/**
 * Check if a role is valid
 * @param {string} role - The role to check
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidRole(role) {
  if (!role) return false;
  const normalizedRole = normalizeRole(role);
  return VALID_ROLES.includes(normalizedRole);
}

/**
 * Get role display name (for UI)
 * @param {string} role - The normalized role
 * @returns {string} - The display name
 */
function getRoleDisplayName(role) {
  const displayNames = {
    'SystemAdmin': 'Super Admin',
    'CollegeAdmin': 'College Admin',
    'FinanceAdmin': 'Finance Admin',
    'Teacher': 'Teacher',
    'Student': 'Student',
    'Receptionist': 'Receptionist',
    'Staff': 'Staff',
    'Parent': 'Parent'
  };
  
  return displayNames[role] || role;
}

/**
 * Get role permissions (for future use)
 * @param {string} role - The normalized role
 * @returns {string[]} - Array of permissions
 */
function getRolePermissions(role) {
  const permissions = {
    'SystemAdmin': ['*'], // All permissions
    'CollegeAdmin': ['user_management', 'academic_management', 'reports'],
    'FinanceAdmin': ['financial_management', 'fee_management', 'reports'],
    'Teacher': ['attendance_management', 'grade_management', 'student_view'],
    'Student': ['view_own_data', 'attendance_view'],
    'Receptionist': ['student_registration', 'visitor_management'],
    'Staff': ['basic_access'],
    'Parent': ['view_child_data']
  };
  
  return permissions[role] || [];
}

module.exports = {
  normalizeRole,
  getValidRoles,
  isValidRole,
  getRoleDisplayName,
  getRolePermissions,
  ROLE_MAPPING,
  VALID_ROLES
}; 