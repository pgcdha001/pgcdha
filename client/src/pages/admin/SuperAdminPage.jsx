import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import UserManagement from './components/UserManagement';
import Card from '../../components/ui/card';

const SuperAdminPage = () => {
  const { user } = useAuth();

  return (
    <div className="h-screen overflow-hidden flex flex-col mt-18">
      
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
