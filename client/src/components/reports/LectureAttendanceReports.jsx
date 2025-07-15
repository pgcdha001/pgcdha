import React from 'react';
import { BookOpen, AlertTriangle } from 'lucide-react';

const LectureAttendanceReports = ({ config }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Lecture Attendance Reports</h2>
          <p className="text-sm text-gray-600">
            Monitor lecture attendance and academic engagement
          </p>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <p className="text-orange-800 font-medium mb-2">📊 What this includes:</p>
        <ul className="text-orange-700 text-sm space-y-1 ml-4">
          <li>• Lecture-by-lecture attendance</li>
          <li>• Subject-wise attendance rates</li>
          <li>• Teacher-specific reports</li>
          <li>• Time-slot analysis</li>
          <li>• Academic engagement metrics</li>
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
          Lecture attendance reporting functionality is currently under development.
          This feature will provide detailed insights into academic participation and engagement.
        </p>
      </div>
    </div>
  );
};

export default LectureAttendanceReports;
