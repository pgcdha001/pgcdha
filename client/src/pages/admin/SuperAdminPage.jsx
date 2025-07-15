import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import UserManagement from './components/UserManagement';
import Card from '../../components/ui/card';

const SuperAdminPage = () => {
  const { user } = useAuth();

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-6 bg-white/60 backdrop-blur-xl border-b border-border/30">
        <h1 className="text-2xl font-bold text-primary font-[Sora,Inter,sans-serif] mb-1">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground font-[Inter,sans-serif]">Punjab Group of Colleges - Admin Tools</p>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-hidden p-4 sm:p-6">
        <div className="h-full">
          <Card className="h-full bg-white/60 backdrop-blur-xl border border-border/30 shadow-xl overflow-hidden">
            <UserManagement />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPage;
