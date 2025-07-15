import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

/**
 * PermissionGuard Component
 * Conditionally renders children based on user permissions
 * 
 * Usage:
 * <PermissionGuard permission="user_management.add_student">
 *   <button>Add Student</button>
 * </PermissionGuard>
 * 
 * <PermissionGuard permissions={["enquiry.view", "enquiry.edit"]} requireAll={false}>
 *   <EnquiryComponent />
 * </PermissionGuard>
 */
const PermissionGuard = ({ 
  children, 
  permission, 
  permissions, 
  requireAll = true, 
  fallback = null,
  role = null 
}) => {
  const { can, canAny, userRole } = usePermissions();

  // If specific role is required, check that first
  if (role && userRole !== role) {
    return fallback;
  }

  // Check single permission
  if (permission) {
    return can(permission) ? children : fallback;
  }

  // Check multiple permissions
  if (permissions && Array.isArray(permissions)) {
    if (requireAll) {
      // User must have ALL permissions
      const hasAllPermissions = permissions.every(perm => can(perm));
      return hasAllPermissions ? children : fallback;
    } else {
      // User must have ANY permission
      return canAny(permissions) ? children : fallback;
    }
  }

  // If no permission specified, render children by default
  return children;
};

export default PermissionGuard;
