import { useAuth } from './useAuth';

/**
 * Custom hook for checking user permissions and roles
 * @returns {Object} Permission checking functions
 */
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission name to check
   * @returns {boolean} - True if user has permission
   */
  const hasPermission = (permission) => {
    if (!isAuthenticated || !user || !user.roles) {
      return false;
    }

    // Check if any of the user's roles has this permission
    return user.roles.some(role => {
      if (role.permissions && Array.isArray(role.permissions)) {
        return role.permissions.some(perm => perm.name === permission);
      }
      return false;
    });
  };

  /**
   * Check if user has any of the specified permissions
   * @param {string[]} permissions - Array of permission names
   * @returns {boolean} - True if user has any of the permissions
   */
  const hasAnyPermission = (permissions) => {
    if (!Array.isArray(permissions)) {
      return hasPermission(permissions);
    }

    return permissions.some(permission => hasPermission(permission));
  };

  /**
   * Check if user has all of the specified permissions
   * @param {string[]} permissions - Array of permission names
   * @returns {boolean} - True if user has all permissions
   */
  const hasAllPermissions = (permissions) => {
    if (!Array.isArray(permissions)) {
      return hasPermission(permissions);
    }

    return permissions.every(permission => hasPermission(permission));
  };

  /**
   * Check if user has a specific role
   * @param {string} roleName - Role name to check
   * @returns {boolean} - True if user has role
   */
  const hasRole = (roleName) => {
    if (!isAuthenticated || !user || !user.roles) {
      return false;
    }

    return user.roles.some(role => role.name === roleName);
  };

  /**
   * Check if user has any of the specified roles
   * @param {string[]} roleNames - Array of role names
   * @returns {boolean} - True if user has any of the roles
   */
  const hasAnyRole = (roleNames) => {
    if (!Array.isArray(roleNames)) {
      return hasRole(roleNames);
    }

    return roleNames.some(roleName => hasRole(roleName));
  };

  /**
   * Get all user permissions as an array of permission names
   * @returns {string[]} - Array of permission names
   */
  const getUserPermissions = () => {
    if (!isAuthenticated || !user || !user.roles) {
      return [];
    }

    const permissions = new Set();
    
    user.roles.forEach(role => {
      if (role.permissions && Array.isArray(role.permissions)) {
        role.permissions.forEach(perm => {
          permissions.add(perm.name);
        });
      }
    });

    return Array.from(permissions);
  };

  /**
   * Get all user roles as an array of role names
   * @returns {string[]} - Array of role names
   */
  const getUserRoles = () => {
    if (!isAuthenticated || !user || !user.roles) {
      return [];
    }

    return user.roles.map(role => role.name);
  };

  /**
   * Check if user is a super admin
   * @returns {boolean} - True if user is super admin
   */
  const isSuperAdmin = () => {
    return hasPermission('super_admin') || hasRole('Super Admin');
  };

  /**
   * Check if user is an institute admin
   * @returns {boolean} - True if user is institute admin
   */
  const isInstituteAdmin = () => {
    return hasPermission('institute_admin') || hasRole('Institute Admin');
  };

  /**
   * Check if user is a teacher
   * @returns {boolean} - True if user is a teacher
   */
  const isTeacher = () => {
    return hasRole('Teacher');
  };

  /**
   * Check if user is a student
   * @returns {boolean} - True if user is a student
   */
  const isStudent = () => {
    return hasRole('Student');
  };

  /**
   * Check if user can manage users
   * @returns {boolean} - True if user can manage users
   */
  const canManageUsers = () => {
    return hasAnyPermission(['manage_users', 'super_admin', 'institute_admin']);
  };

  /**
   * Check if user can view reports
   * @returns {boolean} - True if user can view reports
   */
  const canViewReports = () => {
    return hasPermission('view_reports');
  };

  return {
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Role checks
    hasRole,
    hasAnyRole,
    
    // Getters
    getUserPermissions,
    getUserRoles,
    
    // Convenience checks
    isSuperAdmin,
    isInstituteAdmin,
    isTeacher,
    isStudent,
    canManageUsers,
    canViewReports,
  };
};

export default usePermissions;
