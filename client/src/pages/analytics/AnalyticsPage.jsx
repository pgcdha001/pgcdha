import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import ZoneAnalyticsComponent from '../../components/analytics/ZoneAnalyticsComponent';
import { AnalyticsAccessProvider } from '../../components/analytics/AnalyticsAccessProvider';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const response = await fetch('/api/analytics/data-quality/report', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setSystemStatus(result.data);
      }
    } catch (error) {
      console.error('Error checking system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasManagementAccess = () => {
    return ['Principal', 'InstituteAdmin', 'IT'].includes(user?.role);
  };

  const renderSystemStatusCard = () => {
    if (!systemStatus || !hasManagementAccess()) return null;

    const isHealthy = systemStatus.dataQualityScore >= 80;

    return (
      <div className={`rounded-lg shadow-md p-6 mb-6 ${
        isHealthy ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
      } border`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
            <p className="text-sm text-gray-600">Data quality and system health</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${
              isHealthy ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {systemStatus.dataQualityScore}%
            </div>
            <div className="text-sm text-gray-500">Data Quality</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-semibold text-gray-900">{systemStatus.totalStudents}</div>
            <div className="text-gray-600">Total Students</div>
          </div>
          <div>
            <div className="font-semibold text-green-600">{systemStatus.readyForAnalytics}</div>
            <div className="text-gray-600">Ready for Analytics</div>
          </div>
          <div>
            <div className="font-semibold text-blue-600">{systemStatus.canAutoFix}</div>
            <div className="text-gray-600">Can Auto-Fix</div>
          </div>
          <div>
            <div className="font-semibold text-red-600">{systemStatus.needsManualFix}</div>
            <div className="text-gray-600">Need Manual Fix</div>
          </div>
        </div>

        {!isHealthy && (
          <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
            <div className="text-sm text-yellow-800">
              <strong>Action Required:</strong> Some students have data quality issues. 
              Consider running the class assignment process or manually fixing data issues.
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderManagementTools = () => {
    if (!hasManagementAccess()) return null;

    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Management Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleClassAssignment}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="font-semibold text-gray-900">Auto-Assign Classes</div>
            <div className="text-sm text-gray-600">Assign unassigned students to classes</div>
          </button>
          
          <button
            onClick={handleRecalculateAnalytics}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="font-semibold text-gray-900">Recalculate Analytics</div>
            <div className="text-sm text-gray-600">Refresh all student analytics</div>
          </button>
          
          <button
            onClick={handleRefreshStatistics}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="font-semibold text-gray-900">Refresh Statistics</div>
            <div className="text-sm text-gray-600">Update zone statistics</div>
          </button>
        </div>
      </div>
    );
  };

  const handleClassAssignment = async () => {
    if (!confirm('This will assign classes to all unassigned students. Continue?')) return;

    try {
      const response = await fetch('/api/analytics/class-assignment/assign-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.success) {
        alert(`Class assignment completed. Assigned: ${result.data.assigned}, Failed: ${result.data.failed}`);
        checkSystemStatus();
      } else {
        alert(`Class assignment failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Class assignment error:', error);
      alert('Error during class assignment');
    }
  };

  const handleRecalculateAnalytics = async () => {
    if (!confirm('This will recalculate analytics for all students. This may take several minutes. Continue?')) return;

    try {
      const response = await fetch('/api/analytics/calculate/all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.success) {
        alert(`Analytics calculation completed. Successful: ${result.data.successful}, Failed: ${result.data.failed}`);
        checkSystemStatus();
      } else {
        alert(`Analytics calculation failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Analytics calculation error:', error);
      alert('Error during analytics calculation');
    }
  };

  const handleRefreshStatistics = async () => {
    try {
      const response = await fetch('/api/analytics/refresh/statistics', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.success) {
        alert('Zone statistics refreshed successfully');
        checkSystemStatus();
      } else {
        alert(`Statistics refresh failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Statistics refresh error:', error);
      alert('Error refreshing statistics');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics system...</p>
        </div>
      </div>
    );
  }

  return (
    <AnalyticsAccessProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          {renderSystemStatusCard()}
          {renderManagementTools()}
          <ZoneAnalyticsComponent />
        </div>
      </div>
    </AnalyticsAccessProvider>
  );
};

export default AnalyticsPage;
