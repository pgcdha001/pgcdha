import React from 'react';
import { GraduationCap } from 'lucide-react';
import PermissionGuard from '../PermissionGuard';
import StudentReport from '../../pages/admin/StudentReport';

const EnquiryReports = ({ config }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Enquiry Reports</h2>
            <p className="text-sm text-gray-600">
              Comprehensive reports on student enquiries and admission pipeline
            </p>
          </div>
        </div>

        {/* Role-specific description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-medium mb-2">📊 What this includes:</p>
          <ul className="text-blue-700 text-sm space-y-1 ml-4">
            <li>• Student enquiry statistics and trends</li>
            <li>• Admission pipeline analysis</li>
            <li>• Course-wise enquiry breakdown</li>
            <li>• Geographic distribution of enquiries</li>
            <li>• Conversion rates and follow-up tracking</li>
            {config.canExport && (
              <li>• Export capabilities for detailed analysis</li>
            )}
          </ul>
        </div>
      </div>

      {/* Main Report Content */}
      <PermissionGuard permissions={['view_reports']} fallback={<ReportAccessDenied />}>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <StudentReport />
        </div>
      </PermissionGuard>

      {/* Export Controls */}
      {config.canExport && (
        <PermissionGuard permissions={['export_reports']}>
          <ExportControls />
        </PermissionGuard>
      )}
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

// Export Controls Component
const ExportControls = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
    <div className="flex flex-wrap gap-3">
      <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export Excel
      </button>
      <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export PDF
      </button>
    </div>
  </div>
);

export default EnquiryReports;
