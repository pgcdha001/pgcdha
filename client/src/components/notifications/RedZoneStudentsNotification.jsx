import React, { useState, useEffect } from 'react';
import { AlertTriangle, Users, RefreshCw, Eye, ChevronDown, ChevronRight, Building, GraduationCap } from 'lucide-react';
import api from '../../services/api';

const RedZoneStudentsNotification = ({ compact = false }) => {
  const [redZoneData, setRedZoneData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [expandedClasses, setExpandedClasses] = useState(new Set());

  // Fetch red zone students data
  const fetchRedZoneStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/red-zone-students');
      if (response.data.success) {
        setRedZoneData(response.data.data);
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
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchRedZoneStudents, 10 * 60 * 1000);
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

  const viewAllRedZoneStudents = () => {
    // Navigate to detailed red zone students view
    window.open('/principal/student-examination-report?filter=red-zone', '_blank');
  };

  const getSeverityColor = (count) => {
    if (count >= 50) return 'border-red-600 bg-red-50';
    if (count >= 20) return 'border-orange-500 bg-orange-50';
    if (count >= 10) return 'border-yellow-500 bg-yellow-50';
    return 'border-gray-300 bg-gray-50';
  };

  const getSeverityTextColor = (count) => {
    if (count >= 50) return 'text-red-800';
    if (count >= 20) return 'text-orange-800';
    if (count >= 10) return 'text-yellow-800';
    return 'text-gray-800';
  };

  const getSeverityLevel = (count) => {
    if (count >= 50) return 'Critical';
    if (count >= 20) return 'High';
    if (count >= 10) return 'Medium';
    return 'Low';
  };

  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div 
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">
                    {loading ? 'Loading...' : `${redZoneData?.totalCount || 0} Students`}
                  </h3>
                  <span className="text-sm text-red-600 font-medium">in Red Zone</span>
                </div>
                <p className="text-sm text-gray-600">
                  {loading ? 'Checking performance...' : 
                   redZoneData?.totalCount > 0 ? 'High Priority - Needs Attention' : 'All students performing well'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {redZoneData?.totalCount > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  redZoneData.totalCount >= 50 ? 'bg-red-100 text-red-800' :
                  redZoneData.totalCount >= 20 ? 'bg-orange-100 text-orange-800' :
                  redZoneData.totalCount >= 10 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {getSeverityLevel(redZoneData.totalCount)}
                </span>
              )}
              {isExpanded ? 
                <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                <ChevronRight className="w-4 h-4 text-gray-400" />
              }
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4">
            <div className="border-t pt-4">
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin">
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-600">Loading red zone students...</span>
                </div>
              ) : error ? (
                <div className="text-sm text-red-600">{error}</div>
              ) : redZoneData?.totalCount === 0 ? (
                <div className="text-sm text-green-600">✓ No students currently in red zone</div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    Students need immediate attention in {redZoneData.classGroups.length} classes
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {redZoneData.classGroups.slice(0, 3).map((group) => (
                      <div key={group.classInfo._id} className="text-sm">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="font-medium">{group.classInfo.name}</span>
                          <span className="text-red-600">{group.students.length} students</span>
                        </div>
                      </div>
                    ))}
                    
                    {redZoneData.classGroups.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{redZoneData.classGroups.length - 3} more classes
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={viewAllRedZoneStudents}
                      className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={fetchRedZoneStudents}
                      className="px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border-2 ${getSeverityColor(redZoneData?.totalCount || 0)} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className={`text-lg font-semibold ${getSeverityTextColor(redZoneData?.totalCount || 0)}`}>
              Red Zone Students Alert
            </h3>
            <p className="text-sm text-gray-600">Students requiring immediate attention</p>
          </div>
          {redZoneData?.totalCount > 0 && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              redZoneData.totalCount >= 50 ? 'bg-red-100 text-red-800' :
              redZoneData.totalCount >= 20 ? 'bg-orange-100 text-orange-800' :
              redZoneData.totalCount >= 10 ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {getSeverityLevel(redZoneData.totalCount)} Priority
            </span>
          )}
        </div>
        <button
          onClick={fetchRedZoneStudents}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin">
            <RefreshCw className="w-6 h-6 text-gray-400" />
          </div>
          <span className="ml-3 text-gray-600">Loading red zone students...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600">{error}</p>
        </div>
      ) : redZoneData?.totalCount === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-green-600 font-medium">All students are performing well!</p>
          <p className="text-gray-500 text-sm">No students currently in red zone</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-800">
                  {redZoneData.totalCount}
                </div>
                <div className="text-sm text-red-600">
                  Students in Red Zone
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-red-700">
                  {redZoneData.classGroups.length}
                </div>
                <div className="text-sm text-red-600">
                  Classes Affected
                </div>
              </div>
            </div>
          </div>

          {/* Class Breakdown */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Breakdown by Class:</h4>
            
            {redZoneData.classGroups.map((group) => (
              <div key={group.classInfo._id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleClassExpansion(group.classInfo._id)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {expandedClasses.has(group.classInfo._id) ? 
                          <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        }
                        <GraduationCap className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {group.classInfo.name}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {group.classInfo.campus}
                          </span>
                          <span>Grade {group.classInfo.grade}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-red-600">
                        {group.students.length}
                      </div>
                      <div className="text-sm text-gray-500">
                        students
                      </div>
                    </div>
                  </div>
                </button>

                {expandedClasses.has(group.classInfo._id) && (
                  <div className="border-t border-gray-200 p-4">
                    <div className="grid grid-cols-1 gap-2">
                      {group.students.map((student) => (
                        <div key={student.studentId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{student.name}</span>
                            {student.rollNumber && (
                              <span className="ml-2 text-sm text-gray-500">
                                (Roll: {student.rollNumber})
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-red-600 font-medium">
                              {student.overallPercentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={viewAllRedZoneStudents}
              className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Detailed Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedZoneStudentsNotification;
