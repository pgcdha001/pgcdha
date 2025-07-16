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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Link 
                to="/dashboard" 
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 font-[Sora,Inter,sans-serif]">
                  {config.title}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  {config.description}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <PermissionGuard permission={PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS}>
                <Link
                  to="/reports"
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Analytics
                </Link>
              </PermissionGuard>
            </div>
          </div>
        </div>

        {/* Enquiry List Section */}
        <PermissionGuard permission={PERMISSIONS.ENQUIRY_MANAGEMENT.VIEW_ENQUIRIES}>
          <EnquiryList config={config} />
        </PermissionGuard>
      </div>
    </div>
  );
};

export default EnquiryManagementContainer;
