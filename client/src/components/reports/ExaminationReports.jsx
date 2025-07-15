import React from 'react';
import { ClipboardList, AlertTriangle } from 'lucide-react';

const ExaminationReports = ({ config }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Examination Reports</h2>
          <p className="text-sm text-gray-600">
            Comprehensive examination results and performance analytics
          </p>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <p className="text-purple-800 font-medium mb-2">📊 What this includes:</p>
        <ul className="text-purple-700 text-sm space-y-1 ml-4">
          <li>• Exam result summaries</li>
          <li>• Grade distribution analysis</li>
          <li>• Subject-wise performance</li>
          <li>• Student ranking reports</li>
          <li>• Pass/fail statistics</li>
          <li>• Performance trend analysis</li>
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
          Examination reporting functionality is currently under development.
          This feature will provide comprehensive academic performance analytics and insights.
        </p>
      </div>
    </div>
  );
};

export default ExaminationReports;
