import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import UserManagement from './components/UserManagement';
import Card from '../../components/ui/card';

const SuperAdminPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 rounded-2xl mt-20">
      {/* Header */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <h1 className="text-3xl font-bold text-primary font-[Sora,Inter,sans-serif] mb-1">User Management</h1>
        <p className="text-md text-muted-foreground font-[Inter,sans-serif]">Punjab Group of Colleges - Manage all users and permissions</p>
      </div>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pb-10">
        <Card className="min-h-[600px]">
          <UserManagement />
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminPage;
