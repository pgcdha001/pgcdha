import React from 'react';
import { UserX, Calendar, AlertTriangle } from 'lucide-react';

const StudentAttendanceReports = ({ config }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
          <UserX className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Student Attendance Reports</h2>
          <p className="text-sm text-gray-600">
            Track and analyze student attendance patterns
          </p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-red-800 font-medium mb-2">📊 What this includes:</p>
        <ul className="text-red-700 text-sm space-y-1 ml-4">
          <li>• Daily attendance tracking</li>
          <li>• Monthly attendance summaries</li>
          <li>• Absence pattern analysis</li>
          <li>• Late arrival tracking</li>
          <li>• Class-wise attendance breakdown</li>
          {config.canExport && (
            <li>• Export capabilities for detailed analysis</li>
          )}
        </ul>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-amber-800 mb-2">Feature Coming Soon</h3>
        <p className="text-amber-700">
          Student attendance reporting functionality is currently under development.
          This feature will provide comprehensive attendance analytics and tracking capabilities.
        </p>
      </div>
    </div>
  );
};

export default StudentAttendanceReports;
