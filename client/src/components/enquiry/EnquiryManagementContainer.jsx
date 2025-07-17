import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionGuard from '../PermissionGuard';
import EnquiryList from './EnquiryList';
import { ROLE_COMPONENT_CONFIG } from '../../docs/ComponentArchitecturePlan';
import { PERMISSIONS } from '../../utils/rolePermissions';

const EnquiryManagementContainer = () => {
  const { userRole } = usePermissions();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (userRole) {
      const roleConfig = ROLE_COMPONENT_CONFIG[userRole];
      if (roleConfig?.enquiryManagement) {
        setConfig(roleConfig.enquiryManagement);
      }
    }
  }, [userRole]);

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section with Glassmorphic Effect */}
        <div className="mb-8">
          <div className="relative bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-border p-6 transition-all duration-300 hover:shadow-[0_20px_64px_0_rgba(26,35,126,0.18)] group">
            {/* Animated gradient bar */}
            <span className="absolute top-0 left-8 right-8 h-1 rounded-b-xl bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />
            
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                {/* Back button with glow effect */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 blur-xl opacity-70" />
                  <Link 
                    to="/dashboard" 
                    className="relative inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl animate-float"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </Link>
                </div>
                {/* Title and Description */}
                <div>
                  <h1 className="text-3xl font-extrabold text-primary mb-1 tracking-tight font-[Sora,Inter,sans-serif] drop-shadow-sm">
                    {config.title}
                  </h1>
                  <p className="text-primary/80 font-[Inter,sans-serif]">
                    {config.description}
                  </p>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex gap-4">
                <PermissionGuard permission={PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS}>
                  <div className="relative">
                    <span className="absolute inset-0 rounded-xl p-[2px] bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x blur-sm opacity-70 pointer-events-none" />
                    <Link
                      to="/reports"
                      className="relative z-10 inline-flex items-center px-5 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-bold shadow-lg hover:from-accent hover:to-primary hover:scale-[1.04] active:scale-100 transition-all duration-200 animate-float-btn"
                      style={{boxShadow: '0 6px 32px 0 rgba(26,35,126,0.13)'}}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      View Analytics
                    </Link>
                  </div>
                </PermissionGuard>
              </div>
            </div>
          </div>
        </div>

        {/* Enquiry List Section with Glassmorphic Effect */}
        <PermissionGuard permission={PERMISSIONS.ENQUIRY_MANAGEMENT.VIEW_ENQUIRIES}>
          <div className="relative bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-border p-6 transition-all duration-300">
            <EnquiryList config={config} />
          </div>
        </PermissionGuard>
      </div>
    </div>
  );
};

export default EnquiryManagementContainer;
