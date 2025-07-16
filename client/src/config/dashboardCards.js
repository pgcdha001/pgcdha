import { PERMISSIONS } from '../utils/rolePermissions';

/**
 * Dashboard Cards Configuration for Different Roles
 * Each card defines what dashboard items should be visible for each role
 */

export const DASHBOARD_CARDS = {
  // Institute Admin - Gets access to all dashboard cards
  'InstituteAdmin': [
    {
      id: 'enquiry-reports',
      title: 'Enquiry Reports', 
      href: '/reports?section=enquiries', 
      icon: 'MessageSquare', 
      bgGradient: 'from-blue-500 to-blue-600',
      type: 'normal',
      permission: PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS
    },
    {
      id: 'student-attendance',
      title: 'Student Attendance Reports', 
      href: '/reports?section=student-attendance', 
      icon: 'UserX',
      bgGradient: 'from-red-500 to-red-600',
      type: 'sliding',
      permission: PERMISSIONS.REPORTS.VIEW_ATTENDANCE_REPORTS
    },
    {
      id: 'lecture-attendance',
      title: 'Lecture Attendance Reports', 
      href: '/reports?section=lecture-attendance', 
      icon: 'BookOpen', 
      bgGradient: 'from-red-500 to-red-600',
      type: 'sliding',
      permission: PERMISSIONS.REPORTS.VIEW_ATTENDANCE_REPORTS
    },
    {
      id: 'examinations',
      title: 'Examination Reports', 
      href: '/reports?section=examinations', 
      icon: 'ClipboardList', 
      bgGradient: 'from-orange-500 to-orange-600',
      type: 'normal',
      permission: PERMISSIONS.REPORTS.VIEW_EXAMINATION_REPORTS
    },
    {
      id: 'correspondence-management',
      title: 'Correspondence Management', 
      href: '/correspondence/manage', 
      icon: 'MessageSquare', 
      bgGradient: 'from-green-500 to-green-600',
      type: 'normal',
      permission: PERMISSIONS.CORRESPONDENCE.ADD_STUDENT_CORRESPONDENCE
    },
    {
      id: 'correspondence',
      title: 'Correspondence Reports', 
      href: '/reports?section=correspondence', 
      icon: 'Mail', 
      bgGradient: 'from-indigo-500 to-indigo-600',
      type: 'normal',
      permission: PERMISSIONS.REPORTS.VIEW_CORRESPONDENCE_REPORTS,
      // Dynamic data will be populated by dashboard
      recentActivity: null, // Will be set dynamically
      todayCount: null // Will be set dynamically
    },
    {
      id: 'appointments',
      title: 'Principal Appointments', 
      href: '/reports?section=appointments', 
      icon: 'Calendar', 
      bgGradient: 'from-amber-500 to-amber-600',
      type: 'normal',
      permission: PERMISSIONS.REPORTS.VIEW_APPOINTMENT_REPORTS
    }
  ],

  // IT Role - Limited access to specific areas
  'IT': [
    {
      id: 'user-management',
      title: 'User Management', 
      href: '/admin/users', 
      icon: 'Users', 
      bgGradient: 'from-blue-500 to-blue-600',
      type: 'normal',
      permission: PERMISSIONS.USER_MANAGEMENT.VIEW_USERS
    },
    {
      id: 'enquiry-management',
      title: 'Enquiry Management', 
      href: '/institute-admin/enquiries', 
      icon: 'MessageSquare', 
      bgGradient: 'from-green-500 to-green-600',
      type: 'normal',
      permission: PERMISSIONS.MANAGEMENT.ENQUIRY_MANAGEMENT
    },
    {
      id: 'enquiry-reports',
      title: 'Enquiry Reports', 
      href: '/reports?section=enquiries', 
      icon: 'BarChart3', 
      bgGradient: 'from-purple-500 to-purple-600',
      type: 'normal',
      permission: PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS
    },
    {
      id: 'correspondence-management',
      title: 'Correspondence Management', 
      href: '/correspondence/manage', 
      icon: 'MessageSquare', 
      bgGradient: 'from-green-500 to-green-600',
      type: 'normal',
      permission: PERMISSIONS.CORRESPONDENCE.ADD_STUDENT_CORRESPONDENCE
    },
    {
      id: 'correspondence',
      title: 'Correspondence Reports', 
      href: '/reports?section=correspondence', 
      icon: 'Mail', 
      bgGradient: 'from-indigo-500 to-indigo-600',
      type: 'normal',
      permission: PERMISSIONS.REPORTS.VIEW_CORRESPONDENCE_REPORTS
    }
  ],

  // Receptionist - Very limited access
  'Receptionist': [
    {
      id: 'add-student',
      title: 'Add Student', 
      href: '/admin/add-student', 
      icon: 'UserPlus', 
      bgGradient: 'from-green-500 to-green-600',
      type: 'normal',
      permission: PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT
    },
    {
      id: 'enquiry-management',
      title: 'Enquiry Management', 
      href: '/institute-admin/enquiries', 
      icon: 'MessageSquare', 
      bgGradient: 'from-blue-500 to-blue-600',
      type: 'normal',
      permission: PERMISSIONS.MANAGEMENT.ENQUIRY_MANAGEMENT
    },
    {
      id: 'correspondence-management',
      title: 'Correspondence Management', 
      href: '/correspondence/manage', 
      icon: 'MessageSquare', 
      bgGradient: 'from-green-500 to-green-600',
      type: 'normal',
      permission: PERMISSIONS.CORRESPONDENCE.ADD_STUDENT_CORRESPONDENCE
    },
    {
      id: 'correspondence',
      title: 'Correspondence Reports', 
      href: '/reports?section=correspondence', 
      icon: 'Mail', 
      bgGradient: 'from-indigo-500 to-indigo-600',
      type: 'normal',
      permission: PERMISSIONS.CORRESPONDENCE.VIEW_ENQUIRY_CORRESPONDENCE
    },
    {
      id: 'enquiry-reports',
      title: 'Enquiry Reports', 
      href: '/reports?section=enquiries', 
      icon: 'BarChart3', 
      bgGradient: 'from-purple-500 to-purple-600',
      type: 'normal',
      permission: PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS
    }
  ]
};

// Quick Management Access items for different roles
export const QUICK_MANAGEMENT_ACCESS = {
  'InstituteAdmin': [
    {
      title: 'Enquiry Management',
      href: '/institute-admin/enquiries',
      icon: 'MessageSquare',
      description: 'Handle enquiries and applications',
      permission: PERMISSIONS.MANAGEMENT.ENQUIRY_MANAGEMENT
    },
    {
      title: 'User Management',
      href: '/admin/users',
      icon: 'UserCog',
      description: 'System user management',
      permission: PERMISSIONS.USER_MANAGEMENT.VIEW_USERS
    },
    {
      title: 'Reports Dashboard',
      href: '/reports',
      icon: 'BarChart3',
      description: 'Analytics and reporting',
      permission: PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS
    },
    {
      title: 'Advanced Statistics',
      href: '/admin/advanced-statistics',
      icon: 'TrendingUp',
      description: 'Advanced analytics and insights',
      permission: PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS
    }
  ],
  
  'IT': [
    {
      title: 'User Management',
      href: '/admin/users',
      icon: 'UserCog',
      description: 'System user management',
      permission: PERMISSIONS.USER_MANAGEMENT.VIEW_USERS
    },
    {
      title: 'Enquiry Management',
      href: '/institute-admin/enquiries',
      icon: 'MessageSquare',
      description: 'Handle enquiries and applications',
      permission: PERMISSIONS.MANAGEMENT.ENQUIRY_MANAGEMENT
    },
    {
      title: 'Correspondence Reports',
      href: '/reports?section=correspondence',
      icon: 'Mail',
      description: 'View communication records',
      permission: PERMISSIONS.REPORTS.VIEW_CORRESPONDENCE_REPORTS
    },
    {
      title: 'Enquiry Reports',
      href: '/reports?section=enquiries',
      icon: 'BarChart3',
      description: 'Enquiry analytics and reports',
      permission: PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS
    }
  ],
  
  'Receptionist': [
    {
      title: 'Add Student',
      href: '/admin/add-student',
      icon: 'UserPlus',
      description: 'Register new students',
      permission: PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT
    },
    {
      title: 'Enquiry Management',
      href: '/institute-admin/enquiries',
      icon: 'MessageSquare',
      description: 'Handle enquiries (Level 3 access)',
      permission: PERMISSIONS.MANAGEMENT.ENQUIRY_MANAGEMENT
    },
    {
      title: 'Add Correspondence',
      href: '/correspondence/add',
      icon: 'Mail',
      description: 'Add student communication records',
      permission: PERMISSIONS.CORRESPONDENCE.ADD_ENQUIRY_CORRESPONDENCE
    }
  ]
};

// Get dashboard cards for a specific role
export const getDashboardCardsForRole = (role) => {
  return DASHBOARD_CARDS[role] || [];
};

// Get quick access items for a specific role  
export const getQuickAccessForRole = (role) => {
  return QUICK_MANAGEMENT_ACCESS[role] || [];
};
