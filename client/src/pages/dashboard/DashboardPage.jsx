import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';

const DashboardPage = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // Debug: Log user data to console
  console.log('Dashboard User Data:', {
    user,
    userRole: user?.role,
    userRoles: user?.roles,
    permissions: user?.permissions,
    hasPermissions: {
      super_admin: hasPermission('super_admin'),
      institute_admin: hasPermission('institute_admin'),
      manage_students: hasPermission('manage_students')
    }
  });

  const getDashboardContent = () => {
    // First check by role field (string)
    if (user?.role === 'SystemAdmin' || hasPermission('super_admin')) {
      return <SuperAdminDashboard />;
    } else if (user?.role === 'InstituteAdmin' || hasPermission('institute_admin')) {
      return <InstituteAdminDashboard />;
    } else if (user?.role === 'Teacher' || hasPermission('manage_students')) {
      return <TeacherDashboard />;
    } else if (user?.role === 'Student') {
      return <StudentDashboard />;
    } else if (user?.role === 'SRO' || hasPermission('manage_fees')) {
      return <SRODashboard />;
    } else if (user?.role === 'Accounts' || hasPermission('view_payments')) {
      return <AccountsDashboard />;
    } else if (user?.role === 'IT' || hasPermission('system_settings')) {
      return <ITDashboard />;
    } else if (user?.role === 'EMS' || hasPermission('manage_schedules')) {
      return <EMSDashboard />;
    } else {
      return <DefaultDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.fullName?.firstName || user?.firstName || 'User'}!
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Role: {user?.role} • {user?.institute?.name || 'No Institute'}
          </p>
          {/* Debug info - remove in production */}
          <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded">
            Debug: Role = {user?.role}, Permissions = {JSON.stringify(user?.permissions?.slice(0, 3))}
          </div>
        </div>

        {getDashboardContent()}
      </div>
    </div>
  );
};

const SuperAdminDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <DashboardCard
        title="Total Institutes"
        value="24"
        icon="🏫"
        color="bg-blue-500"
      />
      <DashboardCard
        title="Total Users"
        value="1,234"
        icon="👥"
        color="bg-green-500"
      />
      <DashboardCard
        title="Active Sessions"
        value="156"
        icon="🔐"
        color="bg-yellow-500"
      />
      <DashboardCard
        title="System Health"
        value="99.9%"
        icon="⚡"
        color="bg-purple-500"
      />
    </div>
  );
};

const InstituteAdminDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <DashboardCard
        title="Total Students"
        value="456"
        icon="🎓"
        color="bg-blue-500"
      />
      <DashboardCard
        title="Total Teachers"
        value="32"
        icon="👨‍🏫"
        color="bg-green-500"
      />
      <DashboardCard
        title="Active Courses"
        value="18"
        icon="📚"
        color="bg-yellow-500"
      />
      <DashboardCard
        title="Pending Approvals"
        value="7"
        icon="⏳"
        color="bg-red-500"
      />
    </div>
  );
};

const TeacherDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <DashboardCard
        title="My Classes"
        value="6"
        icon="📖"
        color="bg-blue-500"
      />
      <DashboardCard
        title="Total Students"
        value="124"
        icon="👨‍🎓"
        color="bg-green-500"
      />
      <DashboardCard
        title="Pending Grades"
        value="23"
        icon="📝"
        color="bg-yellow-500"
      />
    </div>
  );
};

const StudentDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <DashboardCard
        title="Enrolled Courses"
        value="8"
        icon="📚"
        color="bg-blue-500"
      />
      <DashboardCard
        title="Completed Assignments"
        value="45"
        icon="✅"
        color="bg-green-500"
      />
      <DashboardCard
        title="Upcoming Exams"
        value="3"
        icon="📅"
        color="bg-yellow-500"
      />
    </div>
  );
};

const SRODashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <DashboardCard
        title="Pending Admissions"
        value="12"
        icon="📝"
        color="bg-blue-500"
      />
      <DashboardCard
        title="Verified Documents"
        value="45"
        icon="✅"
        color="bg-green-500"
      />
      <DashboardCard
        title="Registration Forms"
        value="8"
        icon="📄"
        color="bg-yellow-500"
      />
      <DashboardCard
        title="Interview Scheduled"
        value="6"
        icon="🗓️"
        color="bg-purple-500"
      />
    </div>
  );
};

const AccountsDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <DashboardCard
        title="Monthly Revenue"
        value="₨2.4M"
        icon="💰"
        color="bg-green-500"
      />
      <DashboardCard
        title="Pending Fees"
        value="₨180K"
        icon="⏳"
        color="bg-red-500"
      />
      <DashboardCard
        title="Paid Students"
        value="234"
        icon="✅"
        color="bg-blue-500"
      />
      <DashboardCard
        title="Defaulters"
        value="12"
        icon="⚠️"
        color="bg-yellow-500"
      />
    </div>
  );
};

const ITDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <DashboardCard
        title="System Uptime"
        value="99.9%"
        icon="⚡"
        color="bg-green-500"
      />
      <DashboardCard
        title="Active Users"
        value="156"
        icon="👥"
        color="bg-blue-500"
      />
      <DashboardCard
        title="Storage Used"
        value="75%"
        icon="💾"
        color="bg-yellow-500"
      />
      <DashboardCard
        title="Open Tickets"
        value="3"
        icon="🎫"
        color="bg-red-500"
      />
    </div>
  );
};

const EMSDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <DashboardCard
        title="Total Events"
        value="24"
        icon="🎉"
        color="bg-purple-500"
      />
      <DashboardCard
        title="Upcoming Events"
        value="5"
        icon="📅"
        color="bg-blue-500"
      />
      <DashboardCard
        title="Active Registrations"
        value="89"
        icon="📝"
        color="bg-green-500"
      />
      <DashboardCard
        title="Venue Bookings"
        value="12"
        icon="🏢"
        color="bg-yellow-500"
      />
    </div>
  );
};

const DefaultDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <DashboardCard
        title="Welcome"
        value="👋"
        icon="🎯"
        color="bg-gray-500"
      />
      <DashboardCard
        title="Access Level"
        value="Basic"
        icon="🔐"
        color="bg-blue-500"
      />
      <DashboardCard
        title="Last Login"
        value="Today"
        icon="⏰"
        color="bg-green-500"
      />
      <DashboardCard
        title="Profile"
        value="View"
        icon="👤"
        color="bg-purple-500"
      />
    </div>
  );
};

const DashboardCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`${color} rounded-md p-3 text-white text-2xl`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
