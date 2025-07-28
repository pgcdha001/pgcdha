/**
 * Role-based permissions system
 * Defines what each role can access and perform
 */

// Permission categories
export const PERMISSIONS = {
  // User Management
  USER_MANAGEMENT: {
    VIEW_USERS: 'user_management.view_users',
    ADD_STUDENT: 'user_management.add_student',
    ADD_TEACHER: 'user_management.add_teacher',
    ADD_STAFF: 'user_management.add_staff',
    ADD_ANY_USER: 'user_management.add_any_user',
    EDIT_USERS: 'user_management.edit_users',
    DELETE_USERS: 'user_management.delete_users',
  },
  
  // Enquiry Management
  ENQUIRY_MANAGEMENT: {
    VIEW_ENQUIRIES: 'enquiry_management.view_enquiries',
    ADD_ENQUIRY: 'enquiry_management.add_enquiry',
    EDIT_ENQUIRY: 'enquiry_management.edit_enquiry',
    DELETE_ENQUIRY: 'enquiry_management.delete_enquiry',
    CHANGE_TO_LEVEL_THREE: 'enquiry_management.change_to_level_three',
    CHANGE_ALL_LEVELS: 'enquiry_management.change_all_levels',
    EXPORT_ENQUIRIES: 'enquiry_management.export_enquiries',
  },
  
  // Reports
  REPORTS: {
    VIEW_ENQUIRY_REPORTS: 'reports.view_enquiry_reports',
    VIEW_STUDENT_REPORTS: 'reports.view_student_reports',
    VIEW_ATTENDANCE_REPORTS: 'reports.view_attendance_reports',
    VIEW_EXAMINATION_REPORTS: 'reports.view_examination_reports',
    VIEW_APPOINTMENT_REPORTS: 'reports.view_appointment_reports',
    EXPORT_REPORTS: 'reports.export_reports',
  },
  
  // Management Pages
  MANAGEMENT: {
    STAFF_MANAGEMENT: 'management.staff_management',
    STUDENT_MANAGEMENT: 'management.student_management',
    ENQUIRY_MANAGEMENT: 'management.enquiry_management',
  },

  // Class Management
  CLASS_MANAGEMENT: {
    VIEW_CLASSES: 'class_management.view_classes',
    CREATE_CLASS: 'class_management.create_class',
    EDIT_CLASS: 'class_management.edit_class',
    DELETE_CLASS: 'class_management.delete_class',
    ASSIGN_STUDENTS: 'class_management.assign_students',
    BULK_ASSIGN_STUDENTS: 'class_management.bulk_assign_students',
    VIEW_CLASS_DETAILS: 'class_management.view_class_details',
    ASSIGN_TEACHERS: 'class_management.assign_teachers',
  },

  // Attendance Management
  ATTENDANCE: {
    MARK_STUDENT_ATTENDANCE: 'attendance.mark_student_attendance',
    VIEW_STUDENT_ATTENDANCE: 'attendance.view_student_attendance',
    MARK_TEACHER_ATTENDANCE: 'attendance.mark_teacher_attendance',
    VIEW_TEACHER_ATTENDANCE: 'attendance.view_teacher_attendance',
    MANAGE_LECTURES: 'attendance.manage_lectures',
    VIEW_ATTENDANCE_REPORTS: 'attendance.view_attendance_reports',
  },
  
  // Dashboard
  DASHBOARD: {
    VIEW_INSTITUTE_DASHBOARD: 'dashboard.view_institute_dashboard',
    VIEW_IT_DASHBOARD: 'dashboard.view_it_dashboard',
    VIEW_PRINCIPAL_DASHBOARD: 'dashboard.view_principal_dashboard',
    VIEW_RECEPTIONIST_DASHBOARD: 'dashboard.view_receptionist_dashboard',
    VIEW_COORDINATOR_DASHBOARD: 'dashboard.view_coordinator_dashboard',
    VIEW_STUDENT_DASHBOARD: 'dashboard.view_student_dashboard',
  }
};

// Role definitions with their permissions
export const ROLE_PERMISSIONS = {
  // Institute Admin - Full access to everything
  'InstituteAdmin': [
    // User Management - Full access
    PERMISSIONS.USER_MANAGEMENT.VIEW_USERS,
    PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT,
    PERMISSIONS.USER_MANAGEMENT.ADD_TEACHER,
    PERMISSIONS.USER_MANAGEMENT.ADD_STAFF,
    PERMISSIONS.USER_MANAGEMENT.ADD_ANY_USER,
    PERMISSIONS.USER_MANAGEMENT.EDIT_USERS,
    PERMISSIONS.USER_MANAGEMENT.DELETE_USERS,
    
    // Enquiry Management - Full access
    PERMISSIONS.ENQUIRY_MANAGEMENT.VIEW_ENQUIRIES,
    PERMISSIONS.ENQUIRY_MANAGEMENT.ADD_ENQUIRY,
    PERMISSIONS.ENQUIRY_MANAGEMENT.EDIT_ENQUIRY,
    PERMISSIONS.ENQUIRY_MANAGEMENT.DELETE_ENQUIRY,
    PERMISSIONS.ENQUIRY_MANAGEMENT.CHANGE_TO_LEVEL_THREE,
    PERMISSIONS.ENQUIRY_MANAGEMENT.CHANGE_ALL_LEVELS,
    PERMISSIONS.ENQUIRY_MANAGEMENT.EXPORT_ENQUIRIES,
    
    // Reports - Full access
    PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS,
    PERMISSIONS.REPORTS.VIEW_STUDENT_REPORTS,
    PERMISSIONS.REPORTS.VIEW_ATTENDANCE_REPORTS,
    PERMISSIONS.REPORTS.VIEW_EXAMINATION_REPORTS,
    PERMISSIONS.REPORTS.VIEW_APPOINTMENT_REPORTS,
    PERMISSIONS.REPORTS.EXPORT_REPORTS,
    
    // Class Management - Full access
    PERMISSIONS.CLASS_MANAGEMENT.VIEW_CLASSES,
    PERMISSIONS.CLASS_MANAGEMENT.CREATE_CLASS,
    PERMISSIONS.CLASS_MANAGEMENT.EDIT_CLASS,
    PERMISSIONS.CLASS_MANAGEMENT.DELETE_CLASS,
    PERMISSIONS.CLASS_MANAGEMENT.ASSIGN_STUDENTS,
    PERMISSIONS.CLASS_MANAGEMENT.BULK_ASSIGN_STUDENTS,
    PERMISSIONS.CLASS_MANAGEMENT.VIEW_CLASS_DETAILS,
    PERMISSIONS.CLASS_MANAGEMENT.ASSIGN_TEACHERS,

    // Attendance Management - Full access
    PERMISSIONS.ATTENDANCE.MARK_STUDENT_ATTENDANCE,
    PERMISSIONS.ATTENDANCE.VIEW_STUDENT_ATTENDANCE,
    PERMISSIONS.ATTENDANCE.MARK_TEACHER_ATTENDANCE,
    PERMISSIONS.ATTENDANCE.VIEW_TEACHER_ATTENDANCE,
    PERMISSIONS.ATTENDANCE.MANAGE_LECTURES,
    PERMISSIONS.ATTENDANCE.VIEW_ATTENDANCE_REPORTS,
    
    // Management - Full access
    PERMISSIONS.MANAGEMENT.STAFF_MANAGEMENT,
    PERMISSIONS.MANAGEMENT.STUDENT_MANAGEMENT,
    PERMISSIONS.MANAGEMENT.ENQUIRY_MANAGEMENT,
    
    // Dashboard
    PERMISSIONS.DASHBOARD.VIEW_INSTITUTE_DASHBOARD,
  ],

  // Principal - Statistics and reports only, no detailed access
  'Principal': [
    // Reports - Only viewing statistical reports, no detailed data
    PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS,
    PERMISSIONS.REPORTS.VIEW_STUDENT_REPORTS,
    PERMISSIONS.REPORTS.VIEW_ATTENDANCE_REPORTS,
    PERMISSIONS.REPORTS.VIEW_EXAMINATION_REPORTS,
    PERMISSIONS.REPORTS.VIEW_APPOINTMENT_REPORTS,
    PERMISSIONS.REPORTS.EXPORT_REPORTS,
    
    // Dashboard - Principal dashboard for statistical overview
    PERMISSIONS.DASHBOARD.VIEW_PRINCIPAL_DASHBOARD,
  ],
  
  // IT Role - User management + Complete enquiry
  'IT': [
    // User Management - Can add any user
    PERMISSIONS.USER_MANAGEMENT.VIEW_USERS,
    PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT,
    PERMISSIONS.USER_MANAGEMENT.ADD_TEACHER,
    PERMISSIONS.USER_MANAGEMENT.ADD_STAFF,
    PERMISSIONS.USER_MANAGEMENT.ADD_ANY_USER,
    PERMISSIONS.USER_MANAGEMENT.EDIT_USERS,
    PERMISSIONS.USER_MANAGEMENT.DELETE_USERS,
    
    // Enquiry Management - Complete access
    PERMISSIONS.ENQUIRY_MANAGEMENT.VIEW_ENQUIRIES,
    PERMISSIONS.ENQUIRY_MANAGEMENT.ADD_ENQUIRY,
    PERMISSIONS.ENQUIRY_MANAGEMENT.EDIT_ENQUIRY,
    PERMISSIONS.ENQUIRY_MANAGEMENT.DELETE_ENQUIRY,
    PERMISSIONS.ENQUIRY_MANAGEMENT.CHANGE_TO_LEVEL_THREE,
    PERMISSIONS.ENQUIRY_MANAGEMENT.CHANGE_ALL_LEVELS,
    PERMISSIONS.ENQUIRY_MANAGEMENT.EXPORT_ENQUIRIES,
    
    // Reports - Access to enquiry reports
    PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS,
    PERMISSIONS.REPORTS.EXPORT_REPORTS,
    
    // Class Management - Full access to classes
    PERMISSIONS.CLASS_MANAGEMENT.VIEW_CLASSES,
    PERMISSIONS.CLASS_MANAGEMENT.CREATE_CLASS,
    PERMISSIONS.CLASS_MANAGEMENT.EDIT_CLASS,
    PERMISSIONS.CLASS_MANAGEMENT.ASSIGN_STUDENTS,
    PERMISSIONS.CLASS_MANAGEMENT.BULK_ASSIGN_STUDENTS,
    PERMISSIONS.CLASS_MANAGEMENT.VIEW_CLASS_DETAILS,
    PERMISSIONS.CLASS_MANAGEMENT.ASSIGN_TEACHERS,

    // Attendance Management - Full access
    PERMISSIONS.ATTENDANCE.MARK_STUDENT_ATTENDANCE,
    PERMISSIONS.ATTENDANCE.VIEW_STUDENT_ATTENDANCE,
    PERMISSIONS.ATTENDANCE.MARK_TEACHER_ATTENDANCE,
    PERMISSIONS.ATTENDANCE.VIEW_TEACHER_ATTENDANCE,
    PERMISSIONS.ATTENDANCE.MANAGE_LECTURES,
    PERMISSIONS.ATTENDANCE.VIEW_ATTENDANCE_REPORTS,
    
    // Management - Enquiry management only
    PERMISSIONS.MANAGEMENT.ENQUIRY_MANAGEMENT,
    
    // Dashboard
    PERMISSIONS.DASHBOARD.VIEW_IT_DASHBOARD,
  ],

  // Teacher - Class and student management + Limited access
  'Teacher': [
    // User Management - Can add and edit students
    PERMISSIONS.USER_MANAGEMENT.VIEW_USERS,
    PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT,
    PERMISSIONS.USER_MANAGEMENT.EDIT_USERS,
    
    // Class Management - Full access to classes
    PERMISSIONS.CLASS_MANAGEMENT.VIEW_CLASSES,
    PERMISSIONS.CLASS_MANAGEMENT.CREATE_CLASS,
    PERMISSIONS.CLASS_MANAGEMENT.EDIT_CLASS,
    PERMISSIONS.CLASS_MANAGEMENT.ASSIGN_STUDENTS,
    PERMISSIONS.CLASS_MANAGEMENT.BULK_ASSIGN_STUDENTS,
    PERMISSIONS.CLASS_MANAGEMENT.VIEW_CLASS_DETAILS,
    
    // Attendance Management - Can mark student attendance for assigned classes
    PERMISSIONS.ATTENDANCE.MARK_STUDENT_ATTENDANCE,
    PERMISSIONS.ATTENDANCE.VIEW_STUDENT_ATTENDANCE,
    PERMISSIONS.ATTENDANCE.VIEW_ATTENDANCE_REPORTS,
    
    // Reports - Student and attendance reports
    PERMISSIONS.REPORTS.VIEW_STUDENT_REPORTS,
    PERMISSIONS.REPORTS.VIEW_ATTENDANCE_REPORTS,
    
    // Management - Student management
    PERMISSIONS.MANAGEMENT.STUDENT_MANAGEMENT,
    
    // Dashboard
    PERMISSIONS.DASHBOARD.VIEW_RECEPTIONIST_DASHBOARD, // Reuse for now
  ],
  
  // Receptionist - Limited student management + Level 3 enquiry
  'Receptionist': [
    // User Management - Can add students only
    PERMISSIONS.USER_MANAGEMENT.VIEW_USERS,
    PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT,
    PERMISSIONS.USER_MANAGEMENT.EDIT_USERS,
    
    // Enquiry Management - Can change to level 3 only
    PERMISSIONS.ENQUIRY_MANAGEMENT.VIEW_ENQUIRIES,
    PERMISSIONS.ENQUIRY_MANAGEMENT.ADD_ENQUIRY,
    PERMISSIONS.ENQUIRY_MANAGEMENT.EDIT_ENQUIRY,
    PERMISSIONS.ENQUIRY_MANAGEMENT.CHANGE_TO_LEVEL_THREE,
    PERMISSIONS.ENQUIRY_MANAGEMENT.EXPORT_ENQUIRIES,
    
    // Reports - Limited access (can view but not export)
    PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS,
    
    // Management - Enquiry management only
    PERMISSIONS.MANAGEMENT.ENQUIRY_MANAGEMENT,
    
    // Dashboard
    PERMISSIONS.DASHBOARD.VIEW_RECEPTIONIST_DASHBOARD,
  ],

  // Student - Very limited access (only own dashboard when approved)
  'Student': [
    // Dashboard - Only student dashboard
    PERMISSIONS.DASHBOARD.VIEW_STUDENT_DASHBOARD,
  ],

  // Coordinator/Floor Head - Student supervision + Limited enquiry management
  'Coordinator': [
    // User Management - Can view and edit students
    PERMISSIONS.USER_MANAGEMENT.VIEW_USERS,
    PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT,
    PERMISSIONS.USER_MANAGEMENT.EDIT_USERS,
    
    // Enquiry Management - Limited access
    PERMISSIONS.ENQUIRY_MANAGEMENT.VIEW_ENQUIRIES,
    PERMISSIONS.ENQUIRY_MANAGEMENT.ADD_ENQUIRY,
    PERMISSIONS.ENQUIRY_MANAGEMENT.EDIT_ENQUIRY,
    PERMISSIONS.ENQUIRY_MANAGEMENT.CHANGE_TO_LEVEL_THREE,
    
    // Reports - Can view student and attendance reports
    PERMISSIONS.REPORTS.VIEW_STUDENT_REPORTS,
    PERMISSIONS.REPORTS.VIEW_ATTENDANCE_REPORTS,
    
    // Class Management - Full access to classes
    PERMISSIONS.CLASS_MANAGEMENT.VIEW_CLASSES,
    PERMISSIONS.CLASS_MANAGEMENT.CREATE_CLASS,
    PERMISSIONS.CLASS_MANAGEMENT.EDIT_CLASS,
    PERMISSIONS.CLASS_MANAGEMENT.ASSIGN_STUDENTS,
    PERMISSIONS.CLASS_MANAGEMENT.BULK_ASSIGN_STUDENTS,
    PERMISSIONS.CLASS_MANAGEMENT.VIEW_CLASS_DETAILS,
    
    // Attendance Management - Can mark attendance for assigned classes/floors
    PERMISSIONS.ATTENDANCE.MARK_STUDENT_ATTENDANCE,
    PERMISSIONS.ATTENDANCE.VIEW_STUDENT_ATTENDANCE,
    PERMISSIONS.ATTENDANCE.MARK_TEACHER_ATTENDANCE,
    PERMISSIONS.ATTENDANCE.VIEW_TEACHER_ATTENDANCE,
    PERMISSIONS.ATTENDANCE.MANAGE_LECTURES,
    PERMISSIONS.ATTENDANCE.VIEW_ATTENDANCE_REPORTS,
    
    // Management - Student management
    PERMISSIONS.MANAGEMENT.STUDENT_MANAGEMENT,
    
    // Dashboard
    PERMISSIONS.DASHBOARD.VIEW_COORDINATOR_DASHBOARD,
  ],
};

// Helper function to check if a role has a specific permission
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

// Helper function to check if a role has any of the given permissions
export const hasAnyPermission = (userRole, permissions) => {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false;
  
  return permissions.some(permission => hasPermission(userRole, permission));
};

// Helper function to get all permissions for a role
export const getRolePermissions = (userRole) => {
  return ROLE_PERMISSIONS[userRole] || [];
};

// Helper function to check if role can access a specific management page
export const canAccessManagement = (userRole, managementType) => {
  const permission = PERMISSIONS.MANAGEMENT[managementType];
  return hasPermission(userRole, permission);
};

// Helper function to check if role can access reports section
export const canAccessReports = (userRole, reportType) => {
  const permission = PERMISSIONS.REPORTS[reportType];
  return hasPermission(userRole, permission);
};

// Helper function to check if user can create any type of user
export const canCreateAnyUser = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.USER_MANAGEMENT.ADD_ANY_USER) ||
         hasPermission(userRole, PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT) ||
         hasPermission(userRole, PERMISSIONS.USER_MANAGEMENT.ADD_TEACHER) ||
         hasPermission(userRole, PERMISSIONS.USER_MANAGEMENT.ADD_STAFF);
};

// Export role names for easy reference
export const ROLES = {
  INSTITUTE_ADMIN: 'InstituteAdmin',
  PRINCIPAL: 'Principal',
  IT: 'IT',
  RECEPTIONIST: 'Receptionist',
  STUDENT: 'Student',
  COORDINATOR: 'Coordinator',
};
