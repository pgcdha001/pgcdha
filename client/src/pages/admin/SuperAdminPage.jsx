import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import UserManagement from './components/UserManagement';
import StudentReport from './StudentReport';
import Card from '../../components/ui/card';

const SuperAdminPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');

  return (
    <div className="min-h-screen bg-gray-50 rounded-2xl mt-20">
      {/* Header */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <h1 className="text-3xl font-bold text-primary font-[Sora,Inter,sans-serif] mb-1">Admin Dashboard</h1>
        <p className="text-md text-muted-foreground font-[Inter,sans-serif]">Punjab Group of Colleges - Admin Tools</p>
      </div>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pb-10">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${tab === 'users' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}
            onClick={() => setTab('users')}
          >
            User Management
          </button>
          <button
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${tab === 'reports' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}
            onClick={() => setTab('reports')}
          >
            Reports
          </button>
        </div>
        {tab === 'users' && (
          <Card className="min-h-[600px]">
            <UserManagement />
          </Card>
        )}
        {tab === 'reports' && (
          <StudentReport />
        )}
      </div>
    </div>
  );
};

export default SuperAdminPage;
