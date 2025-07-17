import React from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * StudentApprovalGuard component
 * Restricts access for Student role users based on their approval status
 * Only students who are officially admitted (level 5+, isApproved: true) can access protected content
 */
const StudentApprovalGuard = ({ children, fallback = null }) => {
  const { user, isStudent } = useAuth();

  // If not a student, allow access (other roles handled by PermissionGuard)
  if (!isStudent) {
    return children;
  }

  // For students, check if they are officially admitted (approved)
  const isOfficiallyAdmitted = user?.isApproved === true && (user?.prospectusStage || user?.level || 1) >= 5;

  if (!isOfficiallyAdmitted) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Pending</h2>
            <p className="text-gray-600 mb-4">
              Your access to the student dashboard is pending official admission approval.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Current Status:</strong> {user?.prospectusStage >= 5 ? 'Awaiting Final Approval' : 'Admission Process In Progress'}
              </p>
              {user?.prospectusStage < 5 && (
                <p className="text-xs text-blue-600 mt-2">
                  Complete all admission requirements to access your dashboard.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default StudentApprovalGuard;
