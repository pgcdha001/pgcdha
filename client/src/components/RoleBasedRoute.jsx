import React from 'react';
import { useAuth } from '../hooks/useAuth';

const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();

  // If no roles specified, allow access
  if (allowedRoles.length === 0) {
    return children;
  }

  // Check if user has one of the allowed roles
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-red-200/50 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-700 mb-2 font-[Sora,Inter,sans-serif]">Access Denied</h2>
          <p className="text-red-600 text-sm mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-xs text-red-500">
            Required role(s): {allowedRoles.join(', ')}
          </p>
          <p className="text-xs text-red-500 mt-1">
            Your role: {user?.role || 'None'}
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleBasedRoute;
