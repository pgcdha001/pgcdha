import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Users } from 'lucide-react';
import UserManagement from './components/UserManagement';

const SuperAdminPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Punjab Group of Colleges - User Management
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.fullName?.firstName} {user?.fullName?.lastName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Admin Tools
                </h2>
              </div>
              <nav className="p-2">
                <div className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  <Users className="h-5 w-5" />
                  <span className="font-medium">User Management</span>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border min-h-[600px]">
              <UserManagement />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPage;
