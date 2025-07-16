import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionGuard from '../PermissionGuard';
import ReportsNavigation from './ReportsNavigation';
import EnquiryReports from './EnquiryReports';
import CorrespondenceReports from './CorrespondenceReports';
import StudentAttendanceReports from './StudentAttendanceReports';
import LectureAttendanceReports from './LectureAttendanceReports';
import ExaminationReports from './ExaminationReports';
import AppointmentReports from './AppointmentReports';
import { PERMISSIONS } from '../../utils/rolePermissions';
import { ROLE_COMPONENT_CONFIG } from '../../docs/ComponentArchitecturePlan';

const ReportsContainer = () => {
  const { userRole } = usePermissions();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('enquiries');
  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (userRole) {
      const roleConfig = ROLE_COMPONENT_CONFIG[userRole];
      if (roleConfig?.reports) {
        setConfig(roleConfig.reports);
      }
    }
  }, [userRole]);

  useEffect(() => {
    const section = searchParams.get('section');
    if (section && config?.allowedReports?.includes(section)) {
      setActiveSection(section);
    } else if (config?.allowedReports?.length > 0) {
      // Set to first allowed report if current section is not allowed
      setActiveSection(config.allowedReports[0]);
    }
  }, [searchParams, config]);

  const renderReportContent = () => {
    // Only render if user has permission for this report type
    if (!config?.allowedReports?.includes(activeSection)) {
      return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">You don't have permission to view this report type.</p>
        </div>
      );
    }

    switch (activeSection) {
      case 'enquiries':
      case 'enquiry':
        return (
          <PermissionGuard permission={PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS}>
            <EnquiryReports config={config} />
          </PermissionGuard>
        );
      case 'correspondence':
        return (
          <PermissionGuard permission={PERMISSIONS.REPORTS.VIEW_CORRESPONDENCE_REPORTS}>
            <CorrespondenceReports config={config} />
          </PermissionGuard>
        );
      case 'student-attendance':
      case 'lecture-attendance':
      case 'attendance':
        return (
          <PermissionGuard permission={PERMISSIONS.REPORTS.VIEW_ATTENDANCE_REPORTS}>
            <StudentAttendanceReports config={config} />
          </PermissionGuard>
        );
      case 'examinations':
      case 'examination':
        return (
          <PermissionGuard permission={PERMISSIONS.REPORTS.VIEW_EXAMINATION_REPORTS}>
            <ExaminationReports config={config} />
          </PermissionGuard>
        );
      case 'appointments':
      case 'appointment':
        return (
          <PermissionGuard permission={PERMISSIONS.REPORTS.VIEW_APPOINTMENT_REPORTS}>
            <AppointmentReports config={config} />
          </PermissionGuard>
        );
      default:
        return (
          <PermissionGuard permission={PERMISSIONS.REPORTS.VIEW_ENQUIRY_REPORTS}>
            <EnquiryReports config={config} />
          </PermissionGuard>
        );
    }
  };

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
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-[Sora,Inter,sans-serif]">
                Reports & Analytics
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {config.description || 'Comprehensive reporting and data analytics dashboard'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ReportsNavigation 
          config={config}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Report Content */}
        {renderReportContent()}
      </div>
    </div>
  );
};

// Access Denied Component
const AccessDenied = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
    <div className="text-red-500 mb-4">
      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
    <p className="text-gray-600">You don't have permission to view this section.</p>
  </div>
);

export default ReportsContainer;
