import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../hooks/useAuth';

/**
 * Protected Route Component
 * Handles route-level access control based on user permissions
 */
const ProtectedRoute = ({ 
  children, 
  requiredPermission = null, 
  requiredPermissions = [], 
  requireAll = false,
  allowedRoles = [],
  fallbackPath = '/dashboard',
  showAccessDenied = true 
}) => {
  const { user, isAuthenticated } = useAuth();
  const { userRole, can, canAny } = usePermissions();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    if (showAccessDenied) {
      return <AccessDenied />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Check single permission
  if (requiredPermission && !can(requiredPermission)) {
    if (showAccessDenied) {
      return <AccessDenied />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Check multiple permissions
  if (requiredPermissions.length > 0) {
    const hasAccess = requireAll 
      ? requiredPermissions.every(permission => can(permission))
      : canAny(requiredPermissions);
    
    if (!hasAccess) {
      if (showAccessDenied) {
        return <AccessDenied />;
      }
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // All checks passed, render children
  return children;
};

/**
 * Access Denied Component
 * Shows when user doesn't have permission to access a route
 */
const AccessDenied = () => {
  const { userRole } = usePermissions();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-red-500 mb-6">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Your current role ({userRole}) doesn't include the required permissions.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Go Back
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-6">
          If you believe this is an error, please contact your administrator.
        </p>
      </div>
    </div>
  );
};

export default ProtectedRoute;
