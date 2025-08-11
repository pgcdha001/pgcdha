import React, { useState } from 'react';
import { AnalyticsAccessProvider } from './AnalyticsAccessProvider';
import BaseAnalyticsView from './BaseAnalyticsView';
import { useAuth } from '../../hooks/useAuth';

const ZoneAnalyticsComponent = ({ 
  level = 'college',
  initialFilters = {},
  className = ''
}) => {
  const { user } = useAuth();
  
  // State for navigation
  const [currentLevel, setCurrentLevel] = useState(level);
  const [currentFilters, setCurrentFilters] = useState(initialFilters);

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

  // Handle drill-down navigation
  const handleDrillDown = (data, type) => {
    switch (type) {
      case 'campus':
        setCurrentLevel('campus');
        setCurrentFilters(prev => ({ ...prev, campus: data.campusName || data.campus }));
        break;
      case 'grade':
        setCurrentLevel('grade');
        setCurrentFilters(prev => ({ ...prev, grade: data.gradeName || data.grade }));
        break;
      case 'class':
        setCurrentLevel('class');
        setCurrentFilters(prev => ({ ...prev, classId: data.classId || data.id }));
        break;
      default:
        break;
    }
  };

  // Handle navigation back
  const handleNavigateBack = () => {
    switch (currentLevel) {
      case 'class':
        setCurrentLevel('grade');
        setCurrentFilters(prev => ({ ...prev, classId: undefined }));
        break;
      case 'grade':
        setCurrentLevel('campus');
        setCurrentFilters(prev => ({ ...prev, grade: undefined }));
        break;
      case 'campus':
        setCurrentLevel('college');
        setCurrentFilters(prev => ({ ...prev, campus: undefined }));
        break;
      default:
        break;
    }
  };

  const defaultLevel = currentLevel || getUserDefaultLevel();
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
            
            {/* Breadcrumb navigation */}
            {currentLevel !== 'college' && (
              <div className="mt-4">
                <button
                  onClick={handleNavigateBack}
                  className="inline-flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to {currentLevel === 'campus' ? 'College' : currentLevel === 'grade' ? 'Campus' : 'Grade'} View
                </button>
              </div>
            )}
          </div>

          <BaseAnalyticsView 
            dataLevel={defaultLevel}
            initialFilters={currentFilters}
            allowedActions={allowedActions}
            onDrillDown={handleDrillDown}
          />
        </div>
      </div>
    </AnalyticsAccessProvider>
  );
};

export default ZoneAnalyticsComponent;