/**
 * Frontend Role Utilities
 * Handles role normalization and display names on the client side
 */

// Role mapping for frontend use (should match backend)
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
  'guardian': 'Parent'
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
  'Parent'
];

// Role display names
const ROLE_DISPLAY_NAMES = {
  'SystemAdmin': 'Super Admin',
  'CollegeAdmin': 'College Admin',
  'FinanceAdmin': 'Finance Admin',
  'Teacher': 'Teacher',
  'Student': 'Student',
  'Receptionist': 'Receptionist',
  'Staff': 'Staff',
  'Parent': 'Parent'
};

// Role colors for UI
const ROLE_COLORS = {
  'SystemAdmin': 'bg-red-500',
  'CollegeAdmin': 'bg-blue-600',
  'FinanceAdmin': 'bg-green-600',
  'Teacher': 'bg-purple-600',
  'Student': 'bg-indigo-600',
  'Receptionist': 'bg-orange-600',
  'Staff': 'bg-gray-600',
  'Parent': 'bg-teal-600'
};

// Role icons (using Lucide icon names)
const ROLE_ICONS = {
  'SystemAdmin': 'Shield',
  'CollegeAdmin': 'Building2',
  'FinanceAdmin': 'DollarSign',
  'Teacher': 'GraduationCap',
  'Student': 'User',
  'Receptionist': 'Phone',
  'Staff': 'Users',
  'Parent': 'Heart'
};

/**
 * Normalize a role name to the standard format
 * @param {string} role - The role to normalize
 * @returns {string} - The normalized role name
 */
export function normalizeRole(role) {
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
 * Get role display name
 * @param {string} role - The normalized role
 * @returns {string} - The display name
 */
export function getRoleDisplayName(role) {
  return ROLE_DISPLAY_NAMES[role] || role;
}

/**
 * Get role color class
 * @param {string} role - The normalized role
 * @returns {string} - The color class
 */
export function getRoleColor(role) {
  return ROLE_COLORS[role] || 'bg-gray-500';
}

/**
 * Get role icon name
 * @param {string} role - The normalized role
 * @returns {string} - The icon name
 */
export function getRoleIcon(role) {
  return ROLE_ICONS[role] || 'User';
}

/**
 * Check if a role is valid
 * @param {string} role - The role to check
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidRole(role) {
  if (!role) return false;
  const normalizedRole = normalizeRole(role);
  return VALID_ROLES.includes(normalizedRole);
}

/**
 * Get all valid roles
 * @returns {string[]} - Array of valid role names
 */
export function getValidRoles() {
  return [...VALID_ROLES];
}

/**
 * Get roles for select dropdown
 * @returns {Array} - Array of role objects with value and label
 */
export function getRoleOptions() {
  return VALID_ROLES.map(role => ({
    value: role,
    label: getRoleDisplayName(role)
  }));
}

/**
 * Get role badge props
 * @param {string} role - The normalized role
 * @returns {Object} - Object with color, icon, and display name
 */
export function getRoleBadgeProps(role) {
  return {
    color: getRoleColor(role),
    icon: getRoleIcon(role),
    label: getRoleDisplayName(role)
  };
}

/**
 * Check if user has admin role
 * @param {string} role - The user's role
 * @returns {boolean} - True if admin role
 */
export function isAdminRole(role) {
  const normalizedRole = normalizeRole(role);
  return ['SystemAdmin', 'CollegeAdmin', 'FinanceAdmin'].includes(normalizedRole);
}

/**
 * Check if user has teacher role
 * @param {string} role - The user's role
 * @returns {boolean} - True if teacher role
 */
export function isTeacherRole(role) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'Teacher';
}

/**
 * Check if user has student role
 * @param {string} role - The user's role
 * @returns {boolean} - True if student role
 */
export function isStudentRole(role) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'Student';
}

export {
  VALID_ROLES,
  ROLE_DISPLAY_NAMES,
  ROLE_COLORS,
  ROLE_ICONS,
  ROLE_MAPPING
}; 