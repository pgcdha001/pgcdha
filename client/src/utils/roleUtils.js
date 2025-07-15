/**
 * Frontend Role Utilities
 * Handles role normalization and display names on the client side
 */

// Role mapping for frontend use (should match backend)
const ROLE_MAPPING = {
  // Institute Admin variations
  'Institute Admin': 'InstituteAdmin',
  'InstituteAdmin': 'InstituteAdmin',
  'INSTITUTE_ADMIN': 'InstituteAdmin',
  'institute_admin': 'InstituteAdmin',
  'instituteadmin': 'InstituteAdmin',
  'Principal': 'InstituteAdmin',
  'principal': 'InstituteAdmin',
  
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
  
  // IT variations
  'IT': 'IT',
  'it': 'IT',
  'IT Admin': 'IT',
  'ITAdmin': 'IT',
  'IT_ADMIN': 'IT',
  'it_admin': 'IT',
  'Information Technology': 'IT',
  'Tech Support': 'IT',
  'TECH_SUPPORT': 'IT',
  'tech_support': 'IT',
  
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
  'InstituteAdmin',
  'CollegeAdmin', 
  'FinanceAdmin',
  'Teacher',
  'Student',
  'Receptionist',
  'IT',
  'Staff',
  'Parent'
];

// Role display names
const ROLE_DISPLAY_NAMES = {
  'InstituteAdmin': 'Institute Admin',
  'CollegeAdmin': 'College Admin',
  'FinanceAdmin': 'Finance Admin',
  'Teacher': 'Teacher',
  'Student': 'Student',
  'Receptionist': 'Receptionist',
  'IT': 'IT',
  'Staff': 'Staff',
  'Parent': 'Parent'
};

// Role colors for UI
const ROLE_COLORS = {
  'InstituteAdmin': 'bg-red-500',
  'CollegeAdmin': 'bg-blue-600',
  'FinanceAdmin': 'bg-green-600',
  'Teacher': 'bg-purple-600',
  'Student': 'bg-indigo-600',
  'Receptionist': 'bg-orange-600',
  'IT': 'bg-cyan-600',
  'Staff': 'bg-gray-600',
  'Parent': 'bg-teal-600'
};

// Role icons (using Lucide icon names)
const ROLE_ICONS = {
  'InstituteAdmin': 'Shield',
  'CollegeAdmin': 'Building2',
  'FinanceAdmin': 'DollarSign',
  'Teacher': 'GraduationCap',
  'Student': 'User',
  'Receptionist': 'Phone',
  'IT': 'Monitor',
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
  return ['InstituteAdmin', 'CollegeAdmin', 'FinanceAdmin'].includes(normalizedRole);
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

// ============================================================================
// ROLE-BASED PERMISSIONS
// ============================================================================

export const rolePermissions = {
  'Institute Admin': [
    // User Management Permissions
    'view_users', 'create_users', 'edit_users', 'delete_users', 'view_user_statistics',
    // Enquiry Management Permissions  
    'view_enquiries', 'create_enquiries', 'edit_enquiries', 'delete_enquiries',
    'view_enquiry_details', 'update_enquiry_level', 'view_enquiry_statistics',
    // Reports and Analytics
    'view_reports', 'export_reports', 'view_analytics',
    // Full System Access
    'manage_system', 'view_all_data'
  ],
  
  'IT': [
    // User Management Permissions (limited)
    'view_users', 'create_users', 'edit_users', 'view_user_statistics',
    // Enquiry Management Permissions
    'view_enquiries', 'edit_enquiries', 'view_enquiry_details', 'update_enquiry_level', 'view_enquiry_statistics',
    // Technical Reports
    'view_reports', 'export_reports',
    // System Maintenance
    'manage_technical_settings'
  ],
  
  'Receptionist': [
    // Limited User Management
    'view_users', 'create_users', 'edit_users',
    // Basic Enquiry Management
    'view_enquiries', 'edit_enquiries', 'view_enquiry_details', 'update_enquiry_level',
    // Basic Reports
    'view_reports'
  ],
  
  'College Admin': [
    'view_users', 'view_enquiries', 'view_reports', 'manage_college_data'
  ],
  
  'Finance Admin': [
    'view_users', 'view_enquiries', 'view_reports', 'manage_financial_data'
  ],
  
  'Teacher': [
    'view_users', 'view_enquiries', 'view_reports'
  ],
  
  'Student': [
    'view_own_data'
  ]
};

// ============================================================================
// EXISTING CODE CONTINUES...