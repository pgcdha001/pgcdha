import React from 'react';
import { AnalyticsAccessProvider } from './AnalyticsAccessProvider';
import BaseAnalyticsView from './BaseAnalyticsView';
import { useAuth } from '../../contexts/AuthContext';

const ZoneAnalyticsComponent = ({ 
  level = 'college',
  initialFilters = {},
  className = ''
}) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please log in to view analytics</p>
      </div>
    );
  }

  // Determine user's access level and default view
  const getUserDefaultLevel = () => {
    switch (user.role) {
      case 'Teacher':
        return 'class';
      case 'Coordinator':
        return 'campus';
      case 'Principal':
      case 'InstituteAdmin':
      case 'IT':
        return 'college';
      default:
        return 'college';
    }
  };

  const getUserAllowedActions = () => {
    switch (user.role) {
      case 'Principal':
      case 'InstituteAdmin':
      case 'IT':
        return ['view', 'export', 'manage', 'admin'];
      case 'Coordinator':
      case 'Teacher':
        return ['view', 'export'];
      default:
        return ['view'];
    }
  };

  const defaultLevel = level || getUserDefaultLevel();
  const allowedActions = getUserAllowedActions();

  return (
    <AnalyticsAccessProvider>
      <div className={`min-h-screen bg-gray-50 p-6 ${className}`}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Zone-Based Performance Analytics
            </h1>
            <p className="text-gray-600">
              Comprehensive student performance analysis based on academic achievements
            </p>
          </div>

          <BaseAnalyticsView 
            dataLevel={defaultLevel}
            initialFilters={initialFilters}
            allowedActions={allowedActions}
          />
        </div>
      </div>
    </AnalyticsAccessProvider>
  );
};

export default ZoneAnalyticsComponent;