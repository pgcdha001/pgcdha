import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useDashboard } from '../../contexts/DashboardContext';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import DashboardGrid from '../../components/dashboard/DashboardGrid';

const PrincipalDashboard = () => {
  const { user } = useAuth();
  const { userRole } = usePermissions();
  const { dashboardData, loading, refreshDashboard } = useDashboard();

  // Principal-specific dashboard cards (similar to InstituteAdmin but different links)
  const principalDashboardCards = [
    {
      id: 'enquiry-management',
      title: 'Enquiry Management', 
      href: '/principal/enquiries', // Different route for Principal
      icon: 'MessageSquare', 
      bgGradient: 'from-blue-500 to-blue-600',
      type: 'normal',
      permission: null
    },
    {
      id: 'student-reports',
      title: 'Student Reports', 
      href: '/reports?section=students', 
      icon: 'Users', 
      bgGradient: 'from-green-500 to-green-600',
      type: 'normal',
      permission: null
    },
    {
      id: 'attendance-reports',
      title: 'Attendance Reports', 
      href: '/reports?section=attendance', 
      icon: 'UserCheck', 
      bgGradient: 'from-purple-500 to-purple-600',
      type: 'normal',
      permission: null
    },
    {
      id: 'enquiry-reports',
      title: 'Enquiry Reports', 
      href: '/reports?section=enquiries', 
      icon: 'BarChart3', 
      bgGradient: 'from-orange-500 to-orange-600',
      type: 'normal',
      permission: null
    },
    {
      id: 'correspondence-reports',
      title: 'Correspondence Reports', 
      href: '/reports?section=correspondence', 
      icon: 'Mail', 
      bgGradient: 'from-indigo-500 to-indigo-600',
      type: 'normal',
      permission: null
    },
    {
      id: 'class-statistics',
      title: 'Class Statistics', 
      href: '/reports?section=classes', 
      icon: 'School', 
      bgGradient: 'from-cyan-500 to-cyan-600',
      type: 'normal',
      permission: null
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
