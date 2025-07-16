import React from 'react';
import PermissionGuard from '../PermissionGuard';
import StudentReport from '../../pages/admin/StudentReport';
import { PERMISSIONS } from '../../utils/rolePermissions';

const EnquiryReports = () => {
  return (
    <div className="space-y-6">

      {/* Main Report Content */}
      <PermissionGuard permission={PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS}>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <StudentReport />
        </div>
      </PermissionGuard>
    </div>
  );
};

// Report Access Denied Component
const ReportAccessDenied = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
    <div className="text-amber-500 mb-4">
      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Access Restricted</h3>
    <p className="text-gray-600">You need additional permissions to view detailed enquiry reports.</p>
  </div>
);

export default EnquiryReports;
