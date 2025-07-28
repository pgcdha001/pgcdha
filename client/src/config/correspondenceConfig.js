// Correspondence Management Configuration
// This file contains all configurable values for the correspondence system

// Enquiry Levels Configuration
export const ENQUIRY_LEVELS = [
  { 
    value: '1', 
    label: 'Level 1+', 
    color: 'bg-green-500', 
    description: 'Initial enquiry and above',
    minLevel: 1
  },
  { 
    value: '2', 
    label: 'Level 2+', 
    color: 'bg-yellow-500', 
    description: 'Prospectus purchased and above',
    minLevel: 2
  },
  { 
    value: '3', 
    label: 'Level 3+', 
    color: 'bg-orange-500', 
    description: 'Application submitted and above',
    minLevel: 3
  },
  { 
    value: '4', 
    label: 'Level 4+', 
    color: 'bg-red-500', 
    description: 'Admission fee submitted and above',
    minLevel: 4
  },
  { 
    value: '5', 
    label: 'Level 5+', 
    color: 'bg-purple-500', 
    description: 'Admitted students only',
    minLevel: 5
  }
];

// Date Filter Options
export const DATE_FILTERS = [
  { 
    value: 'all', 
    label: 'All Time',
    description: 'Show all correspondence records'
  },
  { 
    value: 'today', 
    label: 'Today',
    description: 'Show today\'s correspondence only'
  },
  { 
    value: 'week', 
    label: 'This Week',
    description: 'Show this week\'s correspondence'
  },
  { 
    value: 'month', 
    label: 'This Month',
    description: 'Show this month\'s correspondence'
  },
  { 
    value: 'year', 
    label: 'This Year',
    description: 'Show this year\'s correspondence'
  },
  { 
    value: 'custom', 
    label: 'Custom Range',
    description: 'Select custom date range'
  }
];

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'all', label: 'All Genders' },
  { value: 'male', label: 'Male Students' },
  { value: 'female', label: 'Female Students' }
];

// Filter Types for Advanced Filtering
export const FILTER_TYPES = {
  EMPLOYEE: 'employee',
  STUDENT: 'student',
  DATE: 'date',
  LEVEL: 'level',
  GENDER: 'gender',
  PROGRAM: 'program'
};

// Card Colors for different views
export const CARD_COLORS = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    border: 'border-blue-200',
    icon: 'bg-blue-500',
    text: 'text-blue-900',
    subtitle: 'text-blue-700',
    hover: 'hover:from-blue-100 hover:to-blue-150'
  },
  green: {
    bg: 'bg-gradient-to-br from-green-50 to-green-100',
    border: 'border-green-200',
    icon: 'bg-green-500',
    text: 'text-green-900',
    subtitle: 'text-green-700',
    hover: 'hover:from-green-100 hover:to-green-150'
  },
  pink: {
    bg: 'bg-gradient-to-br from-pink-50 to-pink-100',
    border: 'border-pink-200',
    icon: 'bg-pink-500',
    text: 'text-pink-900',
    subtitle: 'text-pink-700',
    hover: 'hover:from-pink-100 hover:to-pink-150'
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
    border: 'border-purple-200',
    icon: 'bg-purple-500',
    text: 'text-purple-900',
    subtitle: 'text-purple-700',
    hover: 'hover:from-purple-100 hover:to-purple-150'
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
    border: 'border-orange-200',
    icon: 'bg-orange-500',
    text: 'text-orange-900',
    subtitle: 'text-orange-700',
    hover: 'hover:from-orange-100 hover:to-orange-150'
  },
  cyan: {
    bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
    border: 'border-cyan-200',
    icon: 'bg-cyan-500',
    text: 'text-cyan-900',
    subtitle: 'text-cyan-700',
    hover: 'hover:from-cyan-100 hover:to-cyan-150'
  },
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
    border: 'border-indigo-200',
    icon: 'bg-indigo-500',
    text: 'text-indigo-900',
    subtitle: 'text-indigo-700',
    hover: 'hover:from-indigo-100 hover:to-indigo-150'
  },
  teal: {
    bg: 'bg-gradient-to-br from-teal-50 to-teal-100',
    border: 'border-teal-200',
    icon: 'bg-teal-500',
    text: 'text-teal-900',
    subtitle: 'text-teal-700',
    hover: 'hover:from-teal-100 hover:to-teal-150'
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  PRINCIPAL_STATS: '/correspondence/principal-stats',
  PRINCIPAL_OVERVIEW: '/correspondence/principal-overview',
  EMPLOYEES: '/correspondence/employees',
  STUDENT_SEARCH: '/correspondence/students/search'
};

// Default Settings
export const DEFAULT_SETTINGS = {
  SELECTED_LEVEL: '1',
  SELECTED_DATE: 'all',
  ITEMS_PER_PAGE: 10,
  SEARCH_DEBOUNCE_TIME: 300,
  AUTO_REFRESH_INTERVAL: 30000, // 30 seconds
  MAX_SEARCH_RESULTS: 20
};

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// View Types
export const VIEW_TYPES = {
  TOTAL: 'total',
  GENDER: 'gender',
  PROGRAMS: 'programs',
  EMPLOYEE_BREAKDOWN: 'employee_breakdown',
  STUDENT_BREAKDOWN: 'student_breakdown'
};

// Correspondence Metrics
export const METRICS = {
  TOTAL_CALLS: 'total_calls',
  UNIQUE_STUDENTS: 'unique_students',
  AVERAGE_CALLS_PER_STUDENT: 'average_calls_per_student',
  CALLS_BY_LEVEL: 'calls_by_level',
  CALLS_BY_PROGRAM: 'calls_by_program'
};
