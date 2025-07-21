import { PERMISSIONS } from './rolePermissions';

/**
 * Route Protection Configuration
 * Defines which routes require which permissions or roles
 */
export const PROTECTED_ROUTES = {
  // Admin Routes
  '/admin/users': {
    requiredPermission: PERMISSIONS.USER_MANAGEMENT.VIEW_USERS,
    allowedRoles: ['InstituteAdmin', 'IT', 'Coordinator']
  },
  '/admin/add-student': {
    requiredPermission: PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT,
    allowedRoles: ['InstituteAdmin', 'IT', 'Receptionist', 'Coordinator']
  },
  '/admin/advanced-statistics': {
    allowedRoles: ['InstituteAdmin']
  },

  // Institute Admin Routes
  '/institute-admin/staff': {
    requiredPermission: PERMISSIONS.MANAGEMENT.STAFF_MANAGEMENT,
    allowedRoles: ['InstituteAdmin']
  },
  '/institute-admin/students': {
    requiredPermission: PERMISSIONS.MANAGEMENT.STUDENT_MANAGEMENT,
    allowedRoles: ['InstituteAdmin', 'Coordinator']
  },
  '/institute-admin/enquiries': {
    requiredPermission: PERMISSIONS.MANAGEMENT.ENQUIRY_MANAGEMENT,
    allowedRoles: ['InstituteAdmin', 'IT', 'Receptionist', 'Coordinator']
  },

  // Reports Routes
  '/reports': {
    requiredPermissions: [
      PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS,
      PERMISSIONS.REPORTS.VIEW_STUDENT_REPORTS,
      PERMISSIONS.REPORTS.VIEW_ATTENDANCE_REPORTS,
      PERMISSIONS.REPORTS.VIEW_EXAMINATION_REPORTS,
      PERMISSIONS.REPORTS.VIEW_CORRESPONDENCE_REPORTS
    ],
    requireAll: false, // User needs ANY of these permissions
    allowedRoles: ['InstituteAdmin', 'IT', 'Coordinator', 'Receptionist']
  },

  // Correspondence Routes
  '/correspondence': {
    requiredPermissions: [
      PERMISSIONS.CORRESPONDENCE.VIEW_ENQUIRY_CORRESPONDENCE,
      PERMISSIONS.CORRESPONDENCE.VIEW_STUDENT_CORRESPONDENCE
    ],
    requireAll: false,
    allowedRoles: ['InstituteAdmin', 'IT', 'Receptionist', 'Coordinator']
  },
  '/correspondence/add': {
    requiredPermissions: [
      PERMISSIONS.CORRESPONDENCE.ADD_ENQUIRY_CORRESPONDENCE,
      PERMISSIONS.CORRESPONDENCE.ADD_STUDENT_CORRESPONDENCE
    ],
    requireAll: false,
    allowedRoles: ['InstituteAdmin', 'IT', 'Receptionist', 'Coordinator']
  },

  // Class Management Routes
  '/classes': {
    requiredPermission: PERMISSIONS.CLASS_MANAGEMENT.VIEW_CLASSES,
    allowedRoles: ['InstituteAdmin', 'IT', 'Teacher', 'Coordinator']
  },
  '/classes/assign-students': {
    requiredPermission: PERMISSIONS.CLASS_MANAGEMENT.BULK_ASSIGN_STUDENTS,
    allowedRoles: ['InstituteAdmin', 'IT', 'Teacher', 'Coordinator']
  },

  // Role-specific Dashboard Routes (fallback protection)
  '/dashboard/institute-admin': {
    allowedRoles: ['InstituteAdmin']
  },
  '/dashboard/it': {
    allowedRoles: ['IT']
  },
  '/dashboard/receptionist': {
    allowedRoles: ['Receptionist']
  },
  '/dashboard/coordinator': {
    allowedRoles: ['Coordinator']
  }
};

/**
 * Get route protection configuration for a given path
 * @param {string} path - The route path
 * @returns {object|null} - Protection configuration or null if no protection needed
 */
export const getRouteProtection = (path) => {
  // Direct match
  if (PROTECTED_ROUTES[path]) {
    return PROTECTED_ROUTES[path];
  }

  // Check for partial matches (for dynamic routes)
  for (const [routePath, config] of Object.entries(PROTECTED_ROUTES)) {
    if (path.startsWith(routePath)) {
      return config;
    }
  }

  return null;
};

/**
 * Check if a user can access a specific route
 * @param {string} path - The route path
 * @param {string} userRole - The user's role
 * @param {function} can - Permission checking function
 * @param {function} canAny - Multiple permission checking function
 * @returns {boolean} - Whether user can access the route
 */
export const canAccessRoute = (path, userRole, can, canAny) => {
  const protection = getRouteProtection(path);
  
  if (!protection) {
    return true; // No protection needed
  }

  // Check role-based access
  if (protection.allowedRoles && !protection.allowedRoles.includes(userRole)) {
    return false;
  }

  // Check single permission
  if (protection.requiredPermission && !can(protection.requiredPermission)) {
    return false;
  }

  // Check multiple permissions
  if (protection.requiredPermissions) {
    const hasAccess = protection.requireAll 
      ? protection.requiredPermissions.every(permission => can(permission))
      : canAny(protection.requiredPermissions);
    
    if (!hasAccess) {
      return false;
    }
  }

  return true;
};

/**
 * Get accessible routes for a user role
 * @param {string} userRole - The user's role
 * @param {function} can - Permission checking function
 * @param {function} canAny - Multiple permission checking function
 * @returns {string[]} - Array of accessible route paths
 */
export const getAccessibleRoutes = (userRole, can, canAny) => {
  const accessibleRoutes = [];
  
  for (const [path] of Object.entries(PROTECTED_ROUTES)) {
    if (canAccessRoute(path, userRole, can, canAny)) {
      accessibleRoutes.push(path);
    }
  }
  
  return accessibleRoutes;
};
