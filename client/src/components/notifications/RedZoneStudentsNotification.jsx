import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Users, 
  Building, 
  GraduationCap, 
  Eye, 
  Settings, 
  Check, 
  X, 
  RefreshCw,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import api from '../../services/api';

const RedZoneStudentsNotification = ({ compact = false }) => {
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);

  useEffect(() => {
    fetchNotification();
    // Refresh every 5 minutes
    const interval = setInterval(fetchNotification, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotification = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/red-zone-students-notification');
      if (response.data.success) {
        // If notification is dismissed, set to null to hide it
        if (response.data.data.dismissed) {
          setNotification(null);
        } else {
          setNotification(response.data.data.notification);
        }
      }
    } catch (error) {
      console.error('Error fetching red zone students notification:', error);
      setNotification(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, additionalData = {}) => {
    try {
      const response = await api.post(
        '/notifications/red-zone-students-notification/action',
        { action, ...additionalData }
      );

      if (response.data.success) {
        if (action === 'view_report') {
          // Redirect to principal student examination report in same tab
          window.location.href = '/principal/student-examination-report';
        } else if (action === 'dismiss') {
          // Just refresh the notification data to hide it
          fetchNotification();
        }
        setShowModal(false);
        // Refresh the notification data
        fetchNotification();
      }
    } catch (error) {
      console.error('Error taking action on red zone notification:', error);
    }
  };

  const handleDismiss = () => {
    handleAction('dismiss');
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getSeverityTextColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-800';
      case 'high': return 'text-orange-800';
      case 'medium': return 'text-yellow-800';
      case 'low': return 'text-green-800';
      default: return 'text-gray-800';
    }
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'high': return <TrendingDown className="w-6 h-6 text-orange-600" />;
      case 'medium': return <Users className="w-6 h-6 text-yellow-600" />;
      case 'low': return <BarChart3 className="w-6 h-6 text-green-600" />;
      default: return <Users className="w-6 h-6 text-gray-600" />;
    }
  };

  // Show nothing if no red zone students
  if (!loading && (!notification || notification.count === 0)) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3">
          <Check className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">Red Zone Students</h3>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-sm text-gray-600">No students are currently in the Red Zone. Great job!</span>
        </div>
      </div>
    );
  }

  // Compact mode: show a collapsible card with count-only summary by default
  if (compact) {
    return (
      <>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="flex items-center gap-3 group"
              title="Toggle details"
            >
              {notification && getSeverityIcon(notification.severity)}
              <h3 className="text-lg font-semibold text-gray-800">
                {loading ? 'Loading...' : notification ? `${notification.count} red zone students` : '0 red zone students'}
              </h3>
            </button>
            <button
              onClick={fetchNotification}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          
          {isExpanded && (
            <div className="mt-4">
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin">
                    <RefreshCw className="w-5 h-5 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-600">Loading Red Zone Alert...</span>
                </div>
              ) : notification && notification.count > 0 ? (
                <div 
                  className={`border-l-4 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${getSeverityColor(notification.severity)}`}
                  onClick={() => handleAction('view_report')}
                  title="Click to view red zone students in examination report"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${getSeverityBadgeColor(notification.severity)}`}>
                          {notification.severity.charAt(0).toUpperCase() + notification.severity.slice(1)} Priority
                        </span>
                        <span className={`font-semibold ${getSeverityTextColor(notification.severity)}`}>
                          {notification.count} Students in Red Zone
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Action Required: Yes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Total Count: {notification.count}</span>
                        </div>
                      </div>

                      {/* Campus Breakdown */}
                      {notification.campusBreakdown && notification.campusBreakdown.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Campus Breakdown:</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {notification.campusBreakdown.map((campus, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <Building className="w-4 h-4 text-gray-500" />
                                <span>{campus.campus}: <strong>{campus.count} students</strong></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Grade Breakdown */}
                      {notification.gradeBreakdown && notification.gradeBreakdown.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Grade Breakdown:</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {notification.gradeBreakdown.map((grade, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <GraduationCap className="w-4 h-4 text-gray-500" />
                                <span>{grade.grade}: <strong>{grade.totalCount} students</strong></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleAction('view_report')}
                        className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Take Action
                      </button>
                      <button
                        onClick={handleDismiss}
                        className="px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">No students are currently in the Red Zone.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Modal */}
        {showModal && notification && (
          <ActionModal
            notification={notification}
            onAction={handleAction}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // Full mode
  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {notification && getSeverityIcon(notification.severity)}
            <h3 className="text-lg font-semibold text-gray-800">Red Zone Students Alert</h3>
            {notification && notification.count > 0 && (
              <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${getSeverityBadgeColor(notification.severity)}`}>
                {notification.count}
              </span>
            )}
          </div>
          <button
            onClick={fetchNotification}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-3">
            <div className="animate-spin">
              <RefreshCw className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-sm text-gray-600">Loading Red Zone Alert...</span>
          </div>
        ) : notification && notification.count > 0 ? (
          <div 
            className={`border-l-4 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${getSeverityColor(notification.severity)}`}
            onClick={() => handleAction('view_report')}
            title="Click to view red zone students in examination report"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${getSeverityBadgeColor(notification.severity)}`}>
                    {notification.severity.charAt(0).toUpperCase() + notification.severity.slice(1)} Priority
                  </span>
                  <span className={`font-semibold ${getSeverityTextColor(notification.severity)}`}>
                    {notification.message}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Action Required: {notification.actionRequired ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Total Count: {notification.count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>Last Updated: {new Date(notification.lastUpdated).toLocaleString()}</span>
                  </div>
                </div>

                {/* Campus Breakdown */}
                {notification.campusBreakdown && notification.campusBreakdown.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Campus Breakdown:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {notification.campusBreakdown.map((campus, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Building className="w-4 h-4 text-gray-500" />
                          <span>{campus.campus}: <strong>{campus.count} students</strong></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grade Breakdown */}
                {notification.gradeBreakdown && notification.gradeBreakdown.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Grade Breakdown:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {notification.gradeBreakdown.map((grade, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <GraduationCap className="w-4 h-4 text-gray-500" />
                          <span>{grade.grade}: <strong>{grade.totalCount} students</strong></span>
                          <div className="ml-2">
                            {grade.campuses.map((campus, campusIndex) => (
                              <span key={campusIndex} className="text-xs text-gray-500">
                                ({campus.campus}: {campus.count})
                                {campusIndex < grade.campuses.length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleAction('view_report')}
                  className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Take Action
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">No students are currently in the Red Zone. Great job!</span>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && notification && (
        <ActionModal
          notification={notification}
          onAction={handleAction}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

// Action Modal Component
const ActionModal = ({ notification, onAction, onClose }) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [notes, setNotes] = useState('');
  const [targetCampus, setTargetCampus] = useState('');
  const [targetGrade, setTargetGrade] = useState('');

  const actions = [
    { 
      value: 'view_report', 
      label: 'View Detailed Report', 
      icon: Eye, 
      color: 'blue',
      description: 'Open the Student Examination Report filtered for red zone students'
    },
    { 
      value: 'create_intervention', 
      label: 'Create Intervention Plan', 
      icon: Settings, 
      color: 'orange',
      description: 'Initiate an intervention plan for struggling students'
    },
    { 
      value: 'mark_reviewed', 
      label: 'Mark as Reviewed', 
      icon: Check, 
      color: 'green',
      description: 'Mark this notification as reviewed by the principal'
    }
  ];

  const handleSubmit = () => {
    if (!selectedAction) return;

    const actionData = { notes: notes.trim() };
    
    if (selectedAction === 'create_intervention') {
      actionData.targetCampus = targetCampus;
      actionData.targetGrade = targetGrade;
    }

    onAction(selectedAction, actionData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Take Action on Red Zone Alert</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-900">Red Zone Students Alert</h4>
            <p className="text-sm text-red-700">
              {notification.count} students are currently in the Red Zone and require attention.
            </p>
            <div className="mt-2 text-xs text-red-600">
              Severity: <span className="font-medium capitalize">{notification.severity}</span>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Select Action:</h4>
            {actions.map((action) => {
              const IconComponent = action.icon;
              return (
                <label
                  key={action.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors mb-2 ${
                    selectedAction === action.value
                      ? `border-${action.color}-500 bg-${action.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="action"
                    value={action.value}
                    checked={selectedAction === action.value}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <IconComponent className={`w-4 h-4 text-${action.color}-600`} />
                      <span className="font-medium text-gray-900">{action.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Additional options for intervention */}
          {selectedAction === 'create_intervention' && (
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Campus (optional):
                </label>
                <select
                  value={targetCampus}
                  onChange={(e) => setTargetCampus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Campuses</option>
                  {notification.campusBreakdown?.map((campus, index) => (
                    <option key={index} value={campus.campus}>
                      {campus.campus} ({campus.count} students)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Grade (optional):
                </label>
                <select
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Grades</option>
                  {notification.gradeBreakdown?.map((grade, index) => (
                    <option key={index} value={grade.grade}>
                      {grade.grade} ({grade.totalCount} students)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Add any additional notes about this action..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!selectedAction}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Execute Action
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedZoneStudentsNotification;