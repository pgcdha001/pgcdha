import { PERMISSIONS } from '../utils/rolePermissions';

/**
 * Dashboard Cards Configuration for Different Roles
 * Each card defines what dashboard items should be visible for each role
 */

export const DASHBOARD_CARDS = {
  // Institute Admin - Gets access to all dashboard cards
  'InstituteAdmin': [
    {
      id: 'enquiry-management',
      title: 'Enquiry Management',
      href: '/institute-admin/enquiries',
      icon: 'MessageSquare',
      bgGradient: 'from-blue-500 to-blue-600',
      type: 'normal',
      permission: PERMISSIONS.MANAGEMENT.ENQUIRY_MANAGEMENT,
      // Dynamic data will be populated by dashboard
      recentActivity: null, // Will be set dynamically
      todayCount: null // Will be set dynamically
    },
    {
      id: 'correspondence-management',
      title: 'Correspondence Management',
      href: '/correspondence',
      icon: 'Mail',
      bgGradient: 'from-green-500 to-green-600',
      type: 'normal',
      permission: PERMISSIONS.CORRESPONDENCE.VIEW_CORRESPONDENCE,
      recentActivity: null,
      todayCount: null
    },
    {
      id: 'enquiry-reports',
      title: 'Enquiry Reports',
      href: '/reports?section=enquiries',
      icon: 'BarChart3',
      bgGradient: 'from-purple-500 to-purple-600',
      type: 'normal',
      permission: PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS,
      // Dynamic data will be populated by dashboard
      recentActivity: null, // Will be set dynamically
      todayCount: null // Will be set dynamically
    },
    {
      id: 'attendance-management',
      title: 'Attendance Management',
      href: '/attendance',
      icon: 'UserCheck',
      bgGradient: 'from-purple-500 to-purple-600',
      type: 'normal',
      permission: null // Available to Institute Admin, IT, and Teachers
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
      id: 'appointments',
      title: 'Principal Appointments',
      href: '/reports?section=appointments',
      icon: 'Calendar',
      bgGradient: 'from-amber-500 to-amber-600',
      type: 'normal',
      permission: PERMISSIONS.REPORTS.VIEW_APPOINTMENT_REPORTS
    },
    {
      id: 'class-management',
      title: 'Class Management',
      href: '/classes',
      icon: 'School',
      bgGradient: 'from-cyan-500 to-cyan-600',
      type: 'normal',
      permission: PERMISSIONS.CLASS_MANAGEMENT.VIEW_CLASSES
    },
    {
      id: 'student-assignment',
      title: 'Student Assignment',
      href: '/classes/assign-students',
      icon: 'UserPlus',
      bgGradient: 'from-emerald-500 to-emerald-600',
      type: 'normal',
      permission: PERMISSIONS.CLASS_MANAGEMENT.BULK_ASSIGN_STUDENTS
    },
    {
      id: 'timetable-management',
      title: 'Timetable Management',
      href: '/timetable',
      icon: 'Calendar',
      bgGradient: 'from-amber-500 to-amber-600',
      type: 'normal',
      permission: PERMISSIONS.TIMETABLE.VIEW_TIMETABLE
    },
    {
      id: 'examination-management',
      title: 'Examination Management',
      href: '/examinations',
      icon: 'GraduationCap',
      bgGradient: 'from-indigo-500 to-indigo-600',
      type: 'normal',
      permission: PERMISSIONS.EXAMINATION.MANAGE_ACADEMIC_RECORDS,
      recentActivity: null,
      todayCount: null
    }
  ],

  // Principal - Statistics and reports only, no detailed management
  'Principal': [
    {
      id: 'enquiry-statistics',
      title: 'Enquiry Statistics',
      href: '/reports?section=enquiries',
      icon: 'BarChart3',
      bgGradient: 'from-blue-500 to-blue-600',
      type: 'normal',
      permission: PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS
    },
    {
      id: 'student-statistics',
      title: 'Student Analytics',
      href: '/reports?section=students',
      icon: 'Users',
      bgGradient: 'from-green-500 to-green-600',
      type: 'normal',
      permission: PERMISSIONS.REPORTS.VIEW_STUDENT_REPORTS
    },
    {
      id: 'attendance-analytics',
      title: 'Attendance Analytics',
      href: '/reports?section=attendance',
      icon: 'TrendingUp',
      bgGradient: 'from-purple-500 to-purple-600',
      type: 'normal',
      permission: PERMISSIONS.REPORTS.VIEW_ATTENDANCE_REPORTS
    },
    {
      id: 'examination-analytics',
      title: 'Examination Analytics',
      href: '/examinations',
      icon: 'GraduationCap',
      bgGradient: 'from-indigo-500 to-indigo-600',
      type: 'normal',
      permission: PERMISSIONS.EXAMINATION.VIEW_ANALYTICS,
      recentActivity: null,
      todayCount: null
    },
    {
      id: 'institutional-reports',
      title: 'Institutional Reports',
      href: '/reports',
      icon: 'FileText',
      bgGradient: 'from-gray-500 to-gray-600',
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
      id: 'student-info-edit',
      title: 'Student Information',
      href: '/students',
      icon: 'UserCheck',
      bgGradient: 'from-teal-500 to-teal-600',
      type: 'normal',
      permission: PERMISSIONS.USER_MANAGEMENT.EDIT_USERS
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
      id: 'correspondence-management',
      title: 'Correspondence Management',
      href: '/correspondence',
      icon: 'Mail',
      bgGradient: 'from-indigo-500 to-indigo-600',
      type: 'normal',
      permission: PERMISSIONS.CORRESPONDENCE.VIEW_CORRESPONDENCE,
      recentActivity: null,
      todayCount: null
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
      id: 'class-management',
      title: 'Class Management',
      href: '/classes',
      icon: 'School',
      bgGradient: 'from-cyan-500 to-cyan-600',
      type: 'normal',
      permission: PERMISSIONS.CLASS_MANAGEMENT.VIEW_CLASSES
    },
    {
      id: 'student-assignment',
      title: 'Bulk Student Assignment',
      href: '/classes/assign-students',
      icon: 'UserPlus',
      bgGradient: 'from-emerald-500 to-emerald-600',
      type: 'normal',
      permission: PERMISSIONS.CLASS_MANAGEMENT.BULK_ASSIGN_STUDENTS
    },
    {
      id: 'timetable-management',
      title: 'Timetable Management',
      href: '/timetable',
      icon: 'Calendar',
      bgGradient: 'from-amber-500 to-amber-600',
      type: 'normal',
      permission: PERMISSIONS.TIMETABLE.VIEW_TIMETABLE
    },
    {
      id: 'examination-management',
      title: 'Test Management',
      href: '/examinations',
      icon: 'GraduationCap',
      bgGradient: 'from-indigo-500 to-indigo-600',
      type: 'normal',
      permission: PERMISSIONS.EXAMINATION.CREATE_TEST,
      recentActivity: null,
      todayCount: null
    }
  ],

  // Teacher Role - Access based on their responsibilities
  'Teacher': [
    {
      id: 'attendance-management',
      title: 'Attendance Management',
      href: '/attendance',
      icon: 'UserCheck',
      bgGradient: 'from-purple-500 to-purple-600',
      type: 'normal',
      permission: null // Teachers access based on class/floor assignments
    },
    {
      id: 'class-management',
      title: 'Class Management',
      href: '/classes',
      icon: 'School',
      bgGradient: 'from-teal-500 to-teal-600',
      type: 'normal',
      permission: PERMISSIONS.CLASS_MANAGEMENT.VIEW_CLASSES
    },
    {
      id: 'student-assignment',
      title: 'Student Assignment',
      href: '/classes/assign-students',
      icon: 'UserPlus',
      bgGradient: 'from-orange-500 to-orange-600',
      type: 'normal',
      permission: PERMISSIONS.CLASS_MANAGEMENT.BULK_ASSIGN_STUDENTS
    },
    {
      id: 'my-classes',
      title: 'My Classes',
      href: '/teacher/classes',
      icon: 'BookOpen',
      bgGradient: 'from-blue-500 to-blue-600',
      type: 'normal',
      permission: null
    },
    {
      id: 'my-timetable',
      title: 'My Schedule',
      href: '/teacher/schedule',
      icon: 'Calendar',
      bgGradient: 'from-green-500 to-green-600',
      type: 'normal',
      permission: null
    },
    {
      id: 'timetable-view',
      title: 'View Timetables',
      href: '/timetable/view',
      icon: 'CalendarDays',
      bgGradient: 'from-amber-500 to-amber-600',
      type: 'normal',
      permission: PERMISSIONS.TIMETABLE.VIEW_TIMETABLE
    },
    {
      id: 'my-tests',
      title: 'My Tests & Marks Entry',
      href: '/examinations?view=teacher',
      icon: 'ClipboardCheck',
      bgGradient: 'from-indigo-500 to-indigo-600',
      type: 'normal',
      permission: PERMISSIONS.EXAMINATION.ENTER_MARKS,
      recentActivity: null,
      todayCount: null
    }
  ],

  // Receptionist - Very limited access
  'Receptionist': [
    {
      id: 'student-management',
      title: 'Student Management',
      href: '/students',
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
      bgGradient: 'from-blue-500 to-blue-600',
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
    }
  ],

  // Coordinator/Floor Head - Student supervision + Limited enquiry management
  'Coordinator': [
    {
      id: 'student-management',
      title: 'Student Management',
      href: '/students',
      icon: 'Users',
      bgGradient: 'from-teal-500 to-teal-600',
      type: 'normal',
      permission: PERMISSIONS.USER_MANAGEMENT.VIEW_USERS
    },
    {
      id: 'teacher-attendance',
      title: 'Teacher Attendance',
      href: '/coordinator/teacher-attendance',
      icon: 'UserCheck2',
      bgGradient: 'from-purple-500 to-purple-600',
      type: 'normal',
      permission: null
    },
    {
      id: 'student-attendance',
      title: 'Student Attendance Reports',
      href: '/reports?section=student-attendance',
      icon: 'UserCheck',
      bgGradient: 'from-blue-500 to-blue-600',
      type: 'sliding',
      permission: PERMISSIONS.REPORTS.VIEW_ATTENDANCE_REPORTS
    },
    {
      id: 'student-reports',
      title: 'Student Reports',
      href: '/reports?section=students',
      icon: 'FileText',
      bgGradient: 'from-green-500 to-green-600',
      type: 'normal',
      permission: PERMISSIONS.REPORTS.VIEW_STUDENT_REPORTS
    },
    {
      id: 'enquiry-management',
      title: 'Enquiry Management',
      href: '/institute-admin/enquiries',
      icon: 'MessageCircle',
      bgGradient: 'from-orange-500 to-orange-600',
      type: 'normal',
      permission: PERMISSIONS.ENQUIRY_MANAGEMENT.VIEW_ENQUIRIES
    },
    {
      id: 'class-management',
      title: 'Class Management',
      href: '/classes',
      icon: 'School',
      bgGradient: 'from-indigo-500 to-indigo-600',
      type: 'normal',
      permission: PERMISSIONS.CLASS_MANAGEMENT.VIEW_CLASSES
    },
    {
      id: 'student-assignment',
      title: 'Student Assignment',
      href: '/classes/assign-students',
      icon: 'UserPlus',
      bgGradient: 'from-rose-500 to-rose-600',
      type: 'normal',
      permission: PERMISSIONS.CLASS_MANAGEMENT.BULK_ASSIGN_STUDENTS
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
    },
    {
      title: 'Class Management',
      href: '/classes',
      icon: 'School',
      description: 'Manage classes and student assignments',
      permission: PERMISSIONS.CLASS_MANAGEMENT.VIEW_CLASSES
    },
    {
      title: 'Student Assignment',
      href: '/classes/assign-students',
      icon: 'UserPlus',
      description: 'Assign students to classes',
      permission: PERMISSIONS.CLASS_MANAGEMENT.BULK_ASSIGN_STUDENTS
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
      title: 'Student Information',
      href: '/students',
      icon: 'UserCheck',
      description: 'Edit student information and details',
      permission: PERMISSIONS.USER_MANAGEMENT.EDIT_USERS
    },
    {
      title: 'Enquiry Management',
      href: '/institute-admin/enquiries',
      icon: 'MessageSquare',
      description: 'Handle enquiries and applications',
      permission: PERMISSIONS.MANAGEMENT.ENQUIRY_MANAGEMENT
    },
    {
      title: 'Enquiry Reports',
      href: '/reports?section=enquiries',
      icon: 'BarChart3',
      description: 'Enquiry analytics and reports',
      permission: PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS
    },
    {
      title: 'Class Management',
      href: '/classes',
      icon: 'School',
      description: 'Manage classes and student assignments',
      permission: PERMISSIONS.CLASS_MANAGEMENT.VIEW_CLASSES
    },
    {
      title: 'Student Assignment',
      href: '/classes/assign-students',
      icon: 'UserPlus',
      description: 'Assign students to classes',
      permission: PERMISSIONS.CLASS_MANAGEMENT.BULK_ASSIGN_STUDENTS
    },
    {
      title: 'Timetable Management',
      href: '/timetable',
      icon: 'Calendar',
      description: 'Manage timetables and schedules',
      permission: PERMISSIONS.TIMETABLE.VIEW_TIMETABLE
    }
  ],

  'Principal': [
    {
      title: 'Enquiry Stats',
      href: '/principal/enquiries',
      icon: 'BarChart3',
      description: 'View enquiry statistics and analytics',
      permission: null
    },
    {
      title: 'Correspondence Management',
      href: '/correspondence',
      icon: 'Mail',
      description: 'Manage student correspondence and communications',
      permission: null
    }
  ],

  'Receptionist': [
    {
      title: 'Student Management',
      href: '/students',
      icon: 'Users',
      description: 'View and edit student information',
      permission: PERMISSIONS.USER_MANAGEMENT.VIEW_USERS
    },
    {
      title: 'Enquiry Management',
      href: '/institute-admin/enquiries',
      icon: 'MessageSquare',
      description: 'Handle enquiries (Level 3 access)',
      permission: PERMISSIONS.MANAGEMENT.ENQUIRY_MANAGEMENT
    }
  ],

  'Coordinator': [
    {
      title: 'Student Management',
      href: '/students',
      icon: 'Users',
      description: 'Supervise and manage student information',
      permission: PERMISSIONS.USER_MANAGEMENT.VIEW_USERS
    },
    {
      title: 'Teacher Attendance',
      href: '/coordinator/teacher-attendance',
      icon: 'UserCheck2',
      description: 'Mark teacher attendance and add remarks',
      permission: null
    },
    {
      title: 'Student Attendance',
      href: '/reports?section=student-attendance',
      icon: 'UserCheck',
      description: 'Monitor student attendance and punctuality',
      permission: PERMISSIONS.REPORTS.VIEW_ATTENDANCE_REPORTS
    },
    {
      title: 'Enquiry Support',
      href: '/institute-admin/enquiries',
      icon: 'MessageCircle',
      description: 'Support enquiry management processes',
      permission: PERMISSIONS.ENQUIRY_MANAGEMENT.VIEW_ENQUIRIES
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
