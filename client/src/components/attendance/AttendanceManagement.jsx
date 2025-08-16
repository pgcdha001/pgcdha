import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { 
  Clock, 
  Calendar, 
  Users, 
  BookOpen, 
  TrendingUp, 
  UserCheck,
  Building,
  ChevronRight,
  BarChart3,
  Settings
} from 'lucide-react';
import StudentAttendanceView from './StudentAttendanceView';
import TeacherAttendanceView from './TeacherAttendanceView';
import TimetableManagement from './TimetableManagement';
import AttendanceReports from './AttendanceReports';

const AttendanceManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('student-attendance');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState({
    canManageStudentAttendance: false,
    canManageTeacherAttendance: false,
    canManageTimetable: false,
    isClassIncharge: false,
    isFloorIncharge: false,
    floors: [],
    classes: []
  });

  // Check user permissions on mount
  useEffect(() => {
    if (user) {
      checkUserPermissions();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkUserPermissions = async () => {
    if (!user) return;
    
    try {
      const permissions = {
        canManageStudentAttendance: false,
        canManageTeacherAttendance: false,
        canManageTimetable: false,
        isClassIncharge: false,
        isFloorIncharge: false,
        floors: [],
        classes: []
      };

      if (user.role === 'InstituteAdmin' || user.role === 'IT') {
        // Full access for admins
        permissions.canManageStudentAttendance = true;
        permissions.canManageTeacherAttendance = true;
        permissions.canManageTimetable = true;
      } else if (user.role === 'Coordinator') {
        // Coordinators have full attendance management access
        permissions.canManageStudentAttendance = true;
        permissions.canManageTeacherAttendance = true;
        permissions.canManageTimetable = true;
        permissions.isFloorIncharge = true; // Coordinators can act as floor incharge
        
        // Get all classes for coordinators
        try {
          const classResponse = await api.get('/classes');
          if (classResponse.data.success && classResponse.data?.classes?.length > 0) {
            permissions.classes = classResponse.data.classes;
          }
        } catch (error) {
          console.error('Error fetching classes for coordinator:', error);
        }
      } else if (user.role === 'Teacher') {
        // Check specific responsibilities for teachers
        const [classResponse, floorResponse] = await Promise.all([
          api.get(`/classes/attendance-access/${user._id}`),
          api.get(`/classes/floor-incharge/${user._id}`)
        ]);

        // Check if user is class incharge or has attendance access
        if (classResponse.data.success && classResponse.data?.classes?.length > 0) {
          const classesWithAccess = classResponse.data.classes;
          const classInchargeClasses = classesWithAccess.filter(cls => 
            cls.userRole === 'Class Incharge'
          );
          const subjectTeacherClasses = classesWithAccess.filter(cls => 
            cls.userRole === 'Subject Teacher'
          );
          
          if (classInchargeClasses.length > 0 || subjectTeacherClasses.length > 0) {
            permissions.canManageStudentAttendance = true;
            permissions.isClassIncharge = classInchargeClasses.length > 0;
            permissions.classes = classesWithAccess;
          }
        }

        // Check if user is floor incharge
        if (floorResponse.data.success && floorResponse.data?.floors?.length > 0) {
          permissions.canManageTeacherAttendance = true;
          permissions.canManageTimetable = true;
          permissions.isFloorIncharge = true;
          permissions.floors = floorResponse.data.floors;
        }
      }

      setUserPermissions(permissions);
    } catch (error) {
      console.error('Error checking user permissions:', error);
    }
  };

  // Define tabs based on user role and responsibilities
  const getTabs = () => {
    const baseTabs = [];

    // Student Attendance - available to class incharge and institute admin
    if (userPermissions.canManageStudentAttendance) {
      baseTabs.push({
        id: 'student-attendance',
        name: 'Student Attendance',
        icon: Users,
        description: userPermissions.isClassIncharge 
          ? 'Mark attendance for your assigned classes'
          : 'Mark and view student attendance for classes you teach'
      });
    }

    // Teacher Attendance - available to floor incharge and institute admin
    if (userPermissions.canManageTeacherAttendance) {
      baseTabs.push({
        id: 'teacher-attendance',
        name: 'Teacher Attendance',
        icon: UserCheck,
        description: userPermissions.isFloorIncharge
          ? 'Track teacher punctuality for your floor'
          : 'Track teacher punctuality across all floors'
      });
    }

    // Timetable Management - available to floor incharge and institute admin
    if (userPermissions.canManageTimetable) {
      baseTabs.push({
        id: 'timetable',
        name: 'Timetable Management',
        icon: Calendar,
        description: userPermissions.isFloorIncharge
          ? 'Manage schedules for your floor'
          : 'Manage schedules for all floors'
      });
    }

    // Reports - available to institute admin, coordinators, and floor incharge
    if (user?.role === 'InstituteAdmin' || user?.role === 'IT' || user?.role === 'Coordinator' || userPermissions.isFloorIncharge) {
      baseTabs.push({
        id: 'reports',
        name: 'Reports & Analytics',
        icon: BarChart3,
        description: 'Comprehensive attendance analytics'
      });
    }

    return baseTabs;
  };

  const tabs = getTabs();

  // Load dashboard statistics
  useEffect(() => {
    if (user) {
      loadDashboardStats();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Load different stats based on user role
      const today = new Date().toISOString().split('T')[0];
      
      if (user?.role === 'InstituteAdmin' || user?.role === 'IT') {
        // Load overall statistics
        const [studentStats, teacherStats] = await Promise.all([
          api.get(`/attendance/stats/daily/${today}`),
          api.get(`/teacher-attendance/report/daily/${today}`)
        ]);
        setDashboardStats({
          studentAttendance: studentStats.data,
          teacherAttendance: teacherStats.data
        });
      } else if (user?.role === 'Coordinator') {
        // Load coordinator-specific stats (all classes they supervise)
        const classes = await api.get(`/classes/coordinator-access/${user._id}`);
        setDashboardStats({
          coordinatorClasses: classes.data
        });
      } else if (user?.role === 'Teacher') {
        // Load teacher-specific stats
        const classes = await api.get(`/classes/attendance-access/${user._id}`);
        setDashboardStats({
          teacherClasses: classes.data
        });
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDashboardCards = () => {
    if (loading || !dashboardStats) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      );
    }

    if (user?.role === 'InstituteAdmin' || user?.role === 'IT') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Student Attendance Today */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-blue-600">Today</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-blue-900">
                {dashboardStats.studentAttendance?.overallSummary?.total || 0}
              </p>
              <p className="text-sm text-blue-700">Student Classes</p>
              <p className="text-xs text-blue-600">
                {Math.round((dashboardStats.studentAttendance?.overallSummary?.present || 0) / (dashboardStats.studentAttendance?.overallSummary?.total || 1) * 100)}% Present
              </p>
            </div>
          </div>

          {/* Teacher Punctuality Today */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500 rounded-lg">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-green-600">Today</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-900">
                {dashboardStats.teacherAttendance?.punctualityPercentage || 0}%
              </p>
              <p className="text-sm text-green-700">Teacher Punctuality</p>
              <p className="text-xs text-green-600">
                {dashboardStats.teacherAttendance?.overallSummary?.total || 0} Lectures
              </p>
            </div>
          </div>

          {/* Late Teachers */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm border border-orange-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-orange-600">Today</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-orange-900">
                {dashboardStats.teacherAttendance?.overallSummary?.late || 0}
              </p>
              <p className="text-sm text-orange-700">Late Arrivals</p>
              <p className="text-xs text-orange-600">
                {Math.round((dashboardStats.teacherAttendance?.overallSummary?.totalLateMinutes || 0) / (dashboardStats.teacherAttendance?.overallSummary?.late || 1))} min avg
              </p>
            </div>
          </div>

          {/* Active Floors */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-purple-600">Active</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-purple-900">4</p>
              <p className="text-sm text-purple-700">Floors</p>
              <p className="text-xs text-purple-600">All Operational</p>
            </div>
          </div>
        </div>
      );
    } else if (user?.role === 'Teacher') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* My Classes */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-blue-900">
                {dashboardStats.teacherClasses?.totalClasses || 0}
              </p>
              <p className="text-sm text-blue-700">My Classes</p>
              <p className="text-xs text-blue-600">Attendance Access</p>
            </div>
          </div>

          {/* Class Incharge */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-900">
                {dashboardStats.teacherClasses?.classes?.filter(c => c.userRole === 'Class Incharge').length || 0}
              </p>
              <p className="text-sm text-green-700">Class Incharge</p>
              <p className="text-xs text-green-600">Primary Responsibility</p>
            </div>
          </div>

          {/* Subject Teacher */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-purple-900">
                {dashboardStats.teacherClasses?.classes?.filter(c => c.userRole === 'Subject Teacher').length || 0}
              </p>
              <p className="text-sm text-purple-700">Subject Teacher</p>
              <p className="text-xs text-purple-600">Teaching Assignments</p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'student-attendance':
        return <StudentAttendanceView user={user} />;
      case 'teacher-attendance':
        return <TeacherAttendanceView user={user} />;
      case 'timetable':
        return <TimetableManagement user={user} />;
      case 'reports':
        return <AttendanceReports user={user} />;
      default:
        return <StudentAttendanceView user={user} />;
    }
  };

  if (tabs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {user?.role === 'Teacher' ? 'No Attendance Responsibilities Assigned' : 
               user?.role === 'Coordinator' ? 'Attendance System Loading...' : 
               'Access Not Available'}
            </h3>
            <p className="text-gray-600 mb-4">
              {user?.role === 'Teacher' 
                ? 'You are not currently assigned as a Class Incharge or Floor Incharge. Contact your administrator to get assigned to classes or floors to access attendance management features.'
                : user?.role === 'Coordinator'
                ? 'Setting up your attendance management access. If this message persists, please contact IT support.'
                : 'You don\'t have permission to access the attendance management system. Please contact your administrator for access.'
              }
            </p>
            {user?.role === 'Teacher' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800 font-medium mb-2">To access attendance features, you need to be:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Class Incharge</strong> - To mark student attendance for specific classes</li>
                  <li>• <strong>Floor Incharge</strong> - To manage teacher attendance and timetables for a floor</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Attendance Management</h1>
                <p className="text-sm text-gray-600">Comprehensive attendance tracking system</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Cards */}
        {renderDashboardCards()}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
