import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { normalizeRole } from '../utils/roleUtils';
import { 
  hasPermission, 
  hasAnyPermission, 
  getRolePermissions,
  canAccessManagement,
  canAccessReports,
  PERMISSIONS 
} from '../utils/rolePermissions';

/**
 * Custom hook for checking user permissions
 * Provides easy access to permission checking throughout the app
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const rawUserRole = user?.role;
  
  // Normalize the role to match permission system expectations
  const userRole = normalizeRole(rawUserRole);

  // Memoize permission checking functions to avoid recreating on each render
  const permissions = useMemo(() => ({
    // Check if user has a specific permission
    can: (permission) => hasPermission(userRole, permission),
    
    // Check if user has any of the given permissions
    canAny: (permissionArray) => hasAnyPermission(userRole, permissionArray),
    
    // Get all permissions for current user
    getUserPermissions: () => getRolePermissions(userRole),
    
    // Management access helpers
    canAccessUserManagement: () => hasPermission(userRole, PERMISSIONS.USER_MANAGEMENT.VIEW_USERS),
    canAccessStaffManagement: () => canAccessManagement(userRole, 'STAFF_MANAGEMENT'),
    canAccessStudentManagement: () => canAccessManagement(userRole, 'STUDENT_MANAGEMENT'),
    canAccessEnquiryManagement: () => canAccessManagement(userRole, 'ENQUIRY_MANAGEMENT'),
    
    // User management specific permissions
    canAddStudent: () => hasPermission(userRole, PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT),
    canAddTeacher: () => hasPermission(userRole, PERMISSIONS.USER_MANAGEMENT.ADD_TEACHER),
    canAddStaff: () => hasPermission(userRole, PERMISSIONS.USER_MANAGEMENT.ADD_STAFF),
    canAddAnyUser: () => hasPermission(userRole, PERMISSIONS.USER_MANAGEMENT.ADD_ANY_USER),
    canEditUsers: () => hasPermission(userRole, PERMISSIONS.USER_MANAGEMENT.EDIT_USERS),
    canDeleteUsers: () => hasPermission(userRole, PERMISSIONS.USER_MANAGEMENT.DELETE_USERS),
    
    // Enquiry management permissions
    canViewEnquiries: () => hasPermission(userRole, PERMISSIONS.ENQUIRY_MANAGEMENT.VIEW_ENQUIRIES),
    canAddEnquiry: () => hasPermission(userRole, PERMISSIONS.ENQUIRY_MANAGEMENT.ADD_ENQUIRY),
    canEditEnquiry: () => hasPermission(userRole, PERMISSIONS.ENQUIRY_MANAGEMENT.EDIT_ENQUIRY),
    canDeleteEnquiry: () => hasPermission(userRole, PERMISSIONS.ENQUIRY_MANAGEMENT.DELETE_ENQUIRY),
    canChangeToLevelThree: () => hasPermission(userRole, PERMISSIONS.ENQUIRY_MANAGEMENT.CHANGE_TO_LEVEL_THREE),
    canChangeAllLevels: () => hasPermission(userRole, PERMISSIONS.ENQUIRY_MANAGEMENT.CHANGE_ALL_LEVELS),
    canExportEnquiries: () => hasPermission(userRole, PERMISSIONS.ENQUIRY_MANAGEMENT.EXPORT_ENQUIRIES),
    
    // Correspondence permissions
    canViewEnquiryCorrespondence: () => hasPermission(userRole, PERMISSIONS.CORRESPONDENCE.VIEW_ENQUIRY_CORRESPONDENCE),
    canViewStudentCorrespondence: () => hasPermission(userRole, PERMISSIONS.CORRESPONDENCE.VIEW_STUDENT_CORRESPONDENCE),
    canAddEnquiryCorrespondence: () => hasPermission(userRole, PERMISSIONS.CORRESPONDENCE.ADD_ENQUIRY_CORRESPONDENCE),
    canAddStudentCorrespondence: () => hasPermission(userRole, PERMISSIONS.CORRESPONDENCE.ADD_STUDENT_CORRESPONDENCE),
    canEditCorrespondence: () => hasPermission(userRole, PERMISSIONS.CORRESPONDENCE.EDIT_CORRESPONDENCE),
    canDeleteCorrespondence: () => hasPermission(userRole, PERMISSIONS.CORRESPONDENCE.DELETE_CORRESPONDENCE),
    canExportCorrespondence: () => hasPermission(userRole, PERMISSIONS.CORRESPONDENCE.EXPORT_CORRESPONDENCE),
    
    // Reports permissions
    canViewEnquiryReports: () => canAccessReports(userRole, 'VIEW_ENQUIRY_REPORTS'),
    canViewStudentReports: () => canAccessReports(userRole, 'VIEW_STUDENT_REPORTS'),
    canViewAttendanceReports: () => canAccessReports(userRole, 'VIEW_ATTENDANCE_REPORTS'),
    canViewExaminationReports: () => canAccessReports(userRole, 'VIEW_EXAMINATION_REPORTS'),
    canViewCorrespondenceReports: () => canAccessReports(userRole, 'VIEW_CORRESPONDENCE_REPORTS'),
    canViewAppointmentReports: () => canAccessReports(userRole, 'VIEW_APPOINTMENT_REPORTS'),
    canExportReports: () => canAccessReports(userRole, 'EXPORT_REPORTS'),
    
    // Dashboard permissions
    canViewInstituteDashboard: () => hasPermission(userRole, PERMISSIONS.DASHBOARD.VIEW_INSTITUTE_DASHBOARD),
    canViewITDashboard: () => hasPermission(userRole, PERMISSIONS.DASHBOARD.VIEW_IT_DASHBOARD),
    canViewReceptionistDashboard: () => hasPermission(userRole, PERMISSIONS.DASHBOARD.VIEW_RECEPTIONIST_DASHBOARD),
    canViewCoordinatorDashboard: () => hasPermission(userRole, PERMISSIONS.DASHBOARD.VIEW_COORDINATOR_DASHBOARD),
    canViewStudentDashboard: () => hasPermission(userRole, PERMISSIONS.DASHBOARD.VIEW_STUDENT_DASHBOARD),
    
  }), [userRole]);

  return {
    ...permissions,
    userRole,
    isInstituteAdmin: userRole === 'InstituteAdmin',
    isIT: userRole === 'IT',
    isReceptionist: userRole === 'Receptionist',
    isCoordinator: userRole === 'Coordinator',
    isTeacher: userRole === 'Teacher',
    isStudent: userRole === 'Student',
  };
};
