import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Custom hook for permission checking
export const usePermission = (permission) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

// Custom hook for role checking
export const useRole = (role) => {
  const { hasRole } = useAuth();
  return hasRole(role);
};

// Custom hook for multiple role checking
export const useAnyRole = (roles) => {
  const { hasAnyRole } = useAuth();
  return hasAnyRole(roles);
};
