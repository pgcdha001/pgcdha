import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { ROLE_COMPONENT_CONFIG } from '../../docs/ComponentArchitecturePlan';
import UserList from './UserList';
import UserStatistics from './UserStatistics';
import PermissionGuard from '../PermissionGuard';
import { PERMISSIONS } from '../../utils/rolePermissions';

/**
 * User Management Container Component
 * Routes to appropriate user management view based on user role and permissions
 */
const UserManagementContainer = () => {
  const { userRole, can } = usePermissions();

  // Get role-specific configuration
  const roleConfig = ROLE_COMPONENT_CONFIG[userRole] || {};
  const userMgmtConfig = roleConfig.userManagement || {};

  // Check if user has basic access
  if (!can(PERMISSIONS.USER_MANAGEMENT.VIEW_USERS)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-500">
            You don't have permission to access user management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-border/50 p-8 transition-all duration-300 hover:shadow-2xl hover:bg-white/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2 font-[Sora,Inter,sans-serif] tracking-tight">
                {userRole === 'Receptionist' ? 'Student Management' : 'User Management'}
              </h1>
              <p className="text-muted-foreground font-medium">
                {userRole === 'Receptionist' 
                  ? 'Manage student registrations and information' 
                  : 'Manage system users and their roles'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section - Only show if allowed */}
      <PermissionGuard 
        condition={() => userMgmtConfig.showStatistics !== false}
        fallback={null}
      >
        <UserStatistics allowedRoles={userMgmtConfig.allowedRoles} />
      </PermissionGuard>

      {/* Main User List */}
      <UserList 
        allowedRoles={userMgmtConfig.allowedRoles}
        allowedActions={userMgmtConfig.allowedActions}
        restrictedFields={userMgmtConfig.restrictedFields}
      />

      {/* Debug Info (development only) */}
      {import.meta.env.DEV && (
        <div className="bg-gray-100 p-4 rounded-lg text-xs text-gray-600">
          <strong>Debug - Role Config:</strong>
          <pre className="mt-2">{JSON.stringify(userMgmtConfig, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default UserManagementContainer;
