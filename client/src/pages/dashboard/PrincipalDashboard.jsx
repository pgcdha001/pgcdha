import { usePermissions } from '../../hooks/usePermissions';
import { useDashboard } from '../../contexts/DashboardContext';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import DashboardGrid from '../../components/dashboard/DashboardGrid';
import LateMarksheetNotifications from '../../components/notifications/LateMarksheetNotifications';

const PrincipalDashboard = () => {
  const { userRole } = usePermissions();
  const { dashboardData, loading, refreshDashboard } = useDashboard();

  // Principal-specific dashboard cards - focused on what we have created so far
  const principalDashboardCards = [
    {
      id: 'enquiry-stats',
      title: 'Enquiry Stats', 
      href: '/principal/enquiries', 
      icon: 'MessageSquare', 
      bgGradient: 'from-blue-500 to-blue-600',
      type: 'normal',
      permission: null,
      description: 'View student enquiry statistics and analytics'
    },
    {
      id: 'correspondence-management',
      title: 'Correspondence Management', 
      href: '/correspondence', 
      icon: 'Mail', 
      bgGradient: 'from-green-500 to-green-600',
      type: 'normal',
      permission: null,
      description: 'Manage student correspondence and communications'
    },
    {
      id: 'student-attendance',
      title: 'Student Attendance', 
      href: '/student-attendance', 
      icon: 'UserCheck', 
      bgGradient: 'from-orange-500 to-orange-600',
      type: 'normal',
      permission: null,
      description: 'View student attendance reports and analytics'
    },
    {
      id: 'teacher-attendance',
      title: 'Teacher Attendance', 
      href: '/principal/attendance-reports', 
      icon: 'Users', 
      bgGradient: 'from-indigo-500 to-indigo-600',
      type: 'normal',
      permission: null,
      description: 'View teacher attendance reports and analytics'
    },
    {
      id: 'teacher-profiles',
      title: 'Teacher Profiles', 
      href: '/principal/teachers', 
      icon: 'UserCheck', 
      bgGradient: 'from-emerald-500 to-emerald-600',
      type: 'normal',
      permission: null,
      description: 'Monitor teacher performance, attendance, and test analytics'
    },
    {
      id: 'student-examination-report',
      title: 'Student Examination Report', 
      href: '/analytics', 
      icon: 'FileText', 
      bgGradient: 'from-purple-500 to-purple-600',
      type: 'normal',
      permission: null,
      description: 'View comprehensive student examination performance with advanced analytics'
    },

    {
      id: 'timetable-overview',
      title: 'Timetable Overview', 
      href: '/principal/timetable', 
      icon: 'Calendar', 
      bgGradient: 'from-rose-500 to-rose-600',
      type: 'normal',
      permission: null,
      description: 'Real-time timetable with teacher attendance status for all classes'
    }
  ];

  // Filter cards based on permissions - keeping all for Principal for now
  const visibleCards = principalDashboardCards;

  // Check if user is authorized
  if (userRole !== 'Principal') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-500">This dashboard is only accessible to Principal users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="Principal Dashboard"
        subtitle="Overview of institute operations and management"
        showNotifications={true}
        refreshDashboard={refreshDashboard}
        loading={loading}
      />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Late Marksheet Notifications */}
        <div className="mb-6">
          <LateMarksheetNotifications />
        </div>
        
        <DashboardGrid
          cards={visibleCards}
          loading={loading}
          data={dashboardData}
          slidingItems={{}} // No sliding items for Principal
        />
        
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
            <strong>Debug Info:</strong> Role: {userRole} | Cards: {principalDashboardCards.length} | Principal Dashboard Active
          </div>
        )}
      </div>
    </div>
  );
};

export default PrincipalDashboard;
