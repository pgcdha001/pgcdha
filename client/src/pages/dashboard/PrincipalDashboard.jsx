import { usePermissions } from '../../hooks/usePermissions';
import { useDashboard } from '../../contexts/DashboardContext';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import DashboardGrid from '../../components/dashboard/DashboardGrid';

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
      id: 'student-reports',
      title: 'Student Reports', 
      href: '/reports?section=students', 
      icon: 'BarChart3', 
      bgGradient: 'from-orange-500 to-orange-600',
      type: 'normal',
      permission: null,
      description: 'View comprehensive student reports'
    },
    {
      id: 'attendance-reports',
      title: 'Attendance Reports', 
      href: '/reports?section=attendance', 
      icon: 'UserCheck', 
      bgGradient: 'from-indigo-500 to-indigo-600',
      type: 'normal',
      permission: null,
      description: 'View attendance statistics and reports'
    },
    {
      id: 'class-statistics',
      title: 'Class Statistics', 
      href: '/reports?section=classes', 
      icon: 'School', 
      bgGradient: 'from-cyan-500 to-cyan-600',
      type: 'normal',
      permission: null,
      description: 'View class performance and statistics'
    }
  ];

  if (userRole !== 'Principal') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
          <p className="text-gray-500">This dashboard is only accessible to Principal users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <DashboardHeader
        dashboardData={dashboardData}
        loading={loading}
        onRefresh={refreshDashboard}
        userRole={userRole}
      />

      {/* Main Dashboard Grid - Same layout as InstituteAdmin */}
      <DashboardGrid
        cards={principalDashboardCards}
        dashboardData={dashboardData}
        loading={loading}
        slidingItems={{}} // No sliding items for Principal
        userRole={userRole}
      />

      {/* Role Debug Info (only in development) */}
      {import.meta.env.DEV && (
        <div className="bg-gray-100 p-4 rounded-lg text-xs text-gray-600">
          <strong>Debug Info:</strong> Role: {userRole} | Cards: {principalDashboardCards.length} | Principal Dashboard Active
        </div>
      )}
    </div>
  );
};

export default PrincipalDashboard;
