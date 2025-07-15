import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import SuperAdminDashboard from './SuperAdminDashboard';
import CollegeAdminDashboard from './CollegeAdminDashboard';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import FinanceAdminDashboard from './FinanceAdminDashboard';
import ReceptionistDashboard from './ReceptionistDashboard';

const DashboardPage = () => {
  const { user } = useAuth();

  const getDashboardContent = () => {
    if (!user) {
      return <div>Loading...</div>;
    }

    // Debug logging to check user role
    console.log('User object:', user);
    console.log('User role:', user.role);
    console.log('Role type:', typeof user.role);

    // Role-based dashboard routing
    switch (user.role) {
      case 'SystemAdmin':
        console.log('Rendering SuperAdminDashboard');
        return <SuperAdminDashboard />;
      case 'College Admin':
        return <CollegeAdminDashboard />;
      case 'Academic Admin':
        return <CollegeAdminDashboard />; // Academic Admin uses College Admin dashboard
      case 'Teacher':
        return <TeacherDashboard />;
      case 'Student':
        return <StudentDashboard />;
      case 'Finance Admin':
        return <FinanceAdminDashboard />;
      case 'Receptionist':
        return <ReceptionistDashboard />;
      default:
        console.log('No role match found, using DefaultDashboard. Role was:', user.role);
        return <DefaultDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 rounded-2xl">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 mt-20 ">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.fullName?.firstName || user?.firstName || 'User'}!
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Role: {user?.role} • Punjab Group of Colleges - DHA Campus
          </p>
        </div>

        {getDashboardContent()}
      </div>
    </div>
  );
};

// Default dashboard for unknown roles
const DefaultDashboard = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome to PGC Dashboard</h2>
      <p className="text-gray-600">
        Your role-specific dashboard is being prepared. Please contact the administrator if you continue to see this message.
      </p>
    </div>
  );
};

export default DashboardPage;
