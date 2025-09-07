import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Users, 
  Eye, 
  Check, 
  X, 
  RefreshCw,
  TrendingDown,
  ChevronDown, 
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import api from '../../services/api';

const RedZoneStudentsNotification = ({ compact = false }) => {
  const navigate = useNavigate();
  const [redZoneData, setRedZoneData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [expandedClasses, setExpandedClasses] = useState(new Set());

  // Fetch red zone students data
  const fetchRedZoneStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/notifications/red-zone-students');
      if (response.data.success) {
        setRedZoneData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching red zone students:', error);
      setError('Failed to load red zone students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedZoneStudents();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchRedZoneStudents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleClassExpansion = (classId) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  const handleTakeAction = () => {
    // Navigate to student examination report with red zone filter
    navigate('/principal/student-examination-report?filter=red-zone');
  };

  const handleDismiss = async () => {
    try {
      await api.post('/notifications/red-zone-students-notification/action', {
        action: 'dismiss',
        notes: 'Dismissed from notification panel'
      });
      // Optionally refresh the data or hide the notification
      fetchRedZoneStudents();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border-l-4 border-yellow-500 p-4 shadow-sm rounded-lg">
        <div className="flex items-center">
          <RefreshCw className="h-5 w-5 text-yellow-600 animate-spin mr-3" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Loading...</h3>
            <p className="text-sm text-gray-600">Fetching red zone student data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-l-4 border-red-500 p-4 shadow-sm rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">Error</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchRedZoneStudents}
            className="text-red-600 hover:text-red-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!redZoneData || redZoneData.totalCount === 0) {
    return (
      <div className="bg-white border-l-4 border-green-500 p-4 shadow-sm rounded-lg">
        <div className="flex items-center">
          <Check className="h-5 w-5 text-green-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">All Clear</h3>
            <p className="text-sm text-gray-600">No students currently in red zone</p>
          </div>
        </div>
      </div>
    );
  }

  const getSeverityColor = (count) => {
    if (count >= 50) return 'border-red-600 bg-red-50';
    if (count >= 20) return 'border-red-500 bg-red-50';
    if (count >= 10) return 'border-orange-500 bg-orange-50';
    return 'border-yellow-500 bg-yellow-50';
  };

  const getSeverityIcon = (count) => {
    if (count >= 20) return <AlertTriangle className="h-5 w-5 text-red-600" />;
    return <TrendingDown className="h-5 w-5 text-orange-600" />;
  };

  return (
    <div className={`bg-white border-l-4 ${getSeverityColor(redZoneData.totalCount)} p-4 shadow-sm rounded-lg`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {getSeverityIcon(redZoneData.totalCount)}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                {redZoneData.totalCount} Students in Red Zone
              </h3>
              {!compact && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {isExpanded ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </button>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              Students requiring immediate attention based on performance analytics
            </p>

            {/* Action Buttons */}
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleTakeAction}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <Eye className="h-3 w-3 mr-1" />
                Take Action
              </button>
              
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <X className="h-3 w-3 mr-1" />
                Dismiss
              </button>
            </div>

            {/* Expanded Details */}
            {isExpanded && !compact && (
              <div className="mt-4 space-y-3">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Class Breakdown
                </div>
                
                {redZoneData.classGroups && redZoneData.classGroups.length > 0 ? (
                  <div className="space-y-2">
                    {redZoneData.classGroups.map((classGroup) => (
                      <div key={classGroup.classInfo._id} className="bg-gray-50 rounded-lg p-3">
                        <button
                          onClick={() => toggleClassExpansion(classGroup.classInfo._id)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div className="flex items-center space-x-2">
                            <GraduationCap className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {classGroup.classInfo.name}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {classGroup.students.length}
                            </span>
                          </div>
                          {expandedClasses.has(classGroup.classInfo._id) ? 
                            <ChevronDown className="h-4 w-4 text-gray-400" /> : 
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          }
                        </button>
                        
                        {expandedClasses.has(classGroup.classInfo._id) && (
                          <div className="mt-3 pl-6 space-y-2">
                            {classGroup.students.map((student) => (
                              <div key={student.studentId} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                                <div className="flex items-center space-x-3">
                                  <Users className="h-3 w-3 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                    <p className="text-xs text-gray-500">Roll: {student.rollNumber}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-red-600">
                                    {student.overallPercentage?.toFixed(1)}%
                                  </p>
                                  <p className="text-xs text-gray-500">Overall</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No class breakdown available
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-red-600">{redZoneData.totalCount}</p>
                    <p className="text-xs text-gray-500">Total Students</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{redZoneData.classGroups?.length || 0}</p>
                    <p className="text-xs text-gray-500">Classes Affected</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-orange-600">High</p>
                    <p className="text-xs text-gray-500">Priority</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchRedZoneStudents}
          className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Last Updated */}
      <div className="mt-3 text-xs text-gray-400">
        Last updated: {redZoneData.lastChecked ? new Date(redZoneData.lastChecked).toLocaleTimeString() : 'Unknown'}
      </div>
    </div>
  );
};

export default RedZoneStudentsNotification;
