import React, { useState, useEffect } from 'react';
import { useAnalyticsAccess } from './AnalyticsAccessProvider';
import ZoneStatisticsCard from './ZoneStatisticsCard';
import StudentPerformanceMatrix from './StudentPerformanceMatrix';

const BaseAnalyticsView = ({ 
  dataLevel = 'college', // college, campus, grade, class, student
  initialFilters = {},
  allowedActions = ['view'],
  children 
}) => {
  const { accessScope, hasPermission, canAccessCampus, canAccessGrade, canAccessClass } = useAnalyticsAccess();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    academicYear: '2024-2025',
    statisticType: 'overall',
    campus: '',
    grade: '',
    classId: '',
    subjectName: '',
    ...initialFilters
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [view, setView] = useState('overview'); // overview, students, matrix

  useEffect(() => {
    fetchAnalyticsData();
  }, [dataLevel, filters]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = '/api/analytics/overview';
      
      // Build endpoint based on data level
      switch (dataLevel) {
        case 'campus':
          if (filters.campus) {
            endpoint = `/api/analytics/campus/${filters.campus}`;
          }
          break;
        case 'grade':
          if (filters.campus && filters.grade) {
            endpoint = `/api/analytics/campus/${filters.campus}/grade/${filters.grade}`;
          }
          break;
        case 'class':
          if (filters.classId) {
            endpoint = `/api/analytics/class/${filters.classId}`;
          }
          break;
        case 'student':
          if (filters.studentId) {
            endpoint = `/api/analytics/student/${filters.studentId}`;
          }
          break;
        default:
          endpoint = '/api/analytics/overview';
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && key !== 'studentId' && key !== 'classId') {
          queryParams.append(key, filters[key]);
        }
      });

      if (queryParams.toString()) {
        endpoint += `?${queryParams.toString()}`;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error fetching analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleDrillDown = (data, type) => {
    if (!hasPermission('view')) return;

    switch (type) {
      case 'campus':
        if (canAccessCampus(data.campus)) {
          updateFilters({ campus: data.campus });
        }
        break;
      case 'grade':
        if (canAccessGrade(data.grade)) {
          updateFilters({ grade: data.grade });
        }
        break;
      case 'class':
        if (canAccessClass(data.classId)) {
          updateFilters({ classId: data.classId });
        }
        break;
    }
  };

  const renderOverview = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <ZoneStatisticsCard key={i} isLoading={true} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button 
            onClick={fetchAnalyticsData}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!analyticsData) return null;

    // Render based on data level and structure
    switch (dataLevel) {
      case 'college':
        return (
          <div className="space-y-6">
            <ZoneStatisticsCard 
              data={analyticsData.collegeWideStats}
              title="College-Wide Performance"
              showPercentages={true}
            />
            
            {analyticsData.campusStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analyticsData.campusStats.map(campus => (
                  <ZoneStatisticsCard
                    key={campus.campus}
                    data={campus.campusZoneDistribution}
                    title={`${campus.campus} Campus`}
                    allowDrillDown={canAccessCampus(campus.campus)}
                    onDrillDown={() => handleDrillDown(campus, 'campus')}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'campus':
        return (
          <div className="space-y-6">
            <ZoneStatisticsCard 
              data={analyticsData.campusZoneDistribution}
              title={`${analyticsData.campus} Campus Overview`}
              showPercentages={true}
            />
            
            {analyticsData.gradeStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analyticsData.gradeStats.map(grade => (
                  <ZoneStatisticsCard
                    key={grade.grade}
                    data={grade.gradeZoneDistribution}
                    title={`${grade.grade} Grade`}
                    allowDrillDown={canAccessGrade(grade.grade)}
                    onDrillDown={() => handleDrillDown(grade, 'grade')}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'grade':
        return (
          <div className="space-y-6">
            <ZoneStatisticsCard 
              data={analyticsData.gradeZoneDistribution}
              title={`${analyticsData.grade} Grade Overview`}
              showPercentages={true}
            />
            
            {analyticsData.classStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analyticsData.classStats.map(classData => (
                  <ZoneStatisticsCard
                    key={classData.classId}
                    data={classData.zoneDistribution}
                    title={classData.className}
                    allowDrillDown={canAccessClass(classData.classId)}
                    onDrillDown={() => handleDrillDown(classData, 'class')}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'class':
        return (
          <div className="space-y-6">
            <ZoneStatisticsCard 
              data={analyticsData.zoneDistribution}
              title={`${analyticsData.classInfo?.name} Performance`}
              showPercentages={true}
            />
            
            <div className="flex justify-center">
              <button
                onClick={() => setView('students')}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                View Student List
              </button>
            </div>
          </div>
        );

      default:
        return <div>Invalid data level</div>;
    }
  };

  const renderStudentsList = () => {
    // This would be a separate component that fetches and displays student list
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Students List</h3>
          <button
            onClick={() => setView('overview')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Overview
          </button>
        </div>
        <p className="text-gray-600">Student list component would be implemented here</p>
      </div>
    );
  };

  const renderStudentMatrix = () => {
    if (!selectedStudent) return null;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Student Performance Matrix</h2>
          <button
            onClick={() => {
              setSelectedStudent(null);
              setView('overview');
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Overview
          </button>
        </div>
        
        <StudentPerformanceMatrix 
          studentId={selectedStudent}
          showExportButton={hasPermission('export')}
          readOnly={!hasPermission('manage')}
        />
      </div>
    );
  };

  // Render filters
  const renderFilters = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year
            </label>
            <select
              value={filters.academicYear}
              onChange={(e) => updateFilters({ academicYear: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analysis Type
            </label>
            <select
              value={filters.statisticType}
              onChange={(e) => updateFilters({ statisticType: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="overall">Overall Performance</option>
              <option value="subject">Subject-wise</option>
            </select>
          </div>

          {filters.statisticType === 'subject' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={filters.subjectName}
                onChange={(e) => updateFilters({ subjectName: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select Subject</option>
                <option value="English">English</option>
                <option value="Math">Math</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Computer">Computer</option>
                <option value="Urdu">Urdu</option>
                <option value="Pak Study">Pak Study</option>
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={fetchAnalyticsData}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {allowedActions.includes('view') && renderFilters()}
      
      {view === 'overview' && renderOverview()}
      {view === 'students' && renderStudentsList()}
      {view === 'matrix' && renderStudentMatrix()}
      
      {children}
    </div>
  );
};

export default BaseAnalyticsView;
