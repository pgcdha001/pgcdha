import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
  </div>
);

// Unauthorized access component
const UnauthorizedAccess = ({ message = "You don't have permission to access this page." }) => (
  <div className="flex min-h-screen flex-col items-center justify-center p-4">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
);

// Basic protected route - requires authentication
// Main ProtectedRoute component that handles both authentication and permissions
const ProtectedRoute = ({ 
  children, 
  requiredPermissions = [], 
  requiredRoles = [],
  fallback = null 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasAnyPermission, hasAnyRole } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Redirect to login with return url
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check permissions if required
  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return fallback || <UnauthorizedAccess message="You don't have the required permissions to access this page." />;
  }

  // Check roles if required
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return fallback || <UnauthorizedAccess message="You don't have the required role to access this page." />;
  }

  return children;
};

// Simple protected route - just checks authentication
export const SimpleProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Redirect to login with return url
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
};

// Role-based protected route
export const RoleProtectedRoute = ({ children, allowedRoles, fallback = null }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasAnyRole } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!hasAnyRole(allowedRoles)) {
    return fallback || <UnauthorizedAccess />;
  }

  return children;
};

// Permission-based protected route
export const PermissionProtectedRoute = ({ children, requiredPermission, fallback = null }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!hasPermission(requiredPermission)) {
    return fallback || <UnauthorizedAccess />;
  }

  return children;
};

// Public route - redirects to dashboard if already authenticated
export const PublicRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

// Institute-specific route - ensures user belongs to specific institute
export const InstituteRoute = ({ children, instituteId = null }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // SuperAdmin can access any institute
  if (isSuperAdmin()) {
    return children;
  }

  // If instituteId is specified, check if user belongs to that institute
  if (instituteId && user?.institute?.toString() !== instituteId) {
    return <UnauthorizedAccess message="You don't have access to this institute." />;
  }

  return children;
};

// Conditional route wrapper
export const ConditionalRoute = ({ 
  children, 
  condition, 
  fallback = null, 
  loading = null 
}) => {
  const { isLoading } = useAuth();

  if (isLoading && loading) {
    return loading;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!condition) {
    return fallback || <UnauthorizedAccess />;
  }

  return children;
};

export default ProtectedRoute;
