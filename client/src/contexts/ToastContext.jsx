import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [removeToast]);

  // Convenience methods
  const toast = {
    success: (message, options = {}) => addToast({ 
      type: 'success', 
      message, 
      ...options 
    }),
    
    error: (message, options = {}) => addToast({ 
      type: 'error', 
      message, 
      duration: 7000, // Longer duration for errors
      ...options 
    }),
    
    warning: (message, options = {}) => addToast({ 
      type: 'warning', 
      message, 
      ...options 
    }),
    
    info: (message, options = {}) => addToast({ 
      type: 'info', 
      message, 
      ...options 
    }),

    // System-specific toast methods
    studentAdded: (studentName) => addToast({
      type: 'success',
      title: 'Student Added',
      message: `${studentName} has been successfully registered`,
      icon: '👨‍🎓'
    }),

    studentUpdated: (studentName) => addToast({
      type: 'success',
      title: 'Student Updated',
      message: `${studentName}'s information has been updated`,
      icon: '✏️'
    }),

    studentDeleted: (studentName) => addToast({
      type: 'success',
      title: 'Student Removed',
      message: `${studentName} has been removed from the system`,
      icon: '🗑️'
    }),

    stageChanged: (studentName, newStage) => addToast({
      type: 'success',
      title: 'Stage Updated',
      message: `${studentName} moved to Stage ${newStage}`,
      icon: '📈'
    }),

    stageUpgraded: (studentName, newStage) => addToast({
      type: 'success',
      title: 'Stage Upgraded',
      message: `${studentName} upgraded to ${newStage}`,
      icon: '📈'
    }),

    stageDowngraded: (studentName, newStage) => addToast({
      type: 'warning',
      title: 'Stage Downgraded',
      message: `${studentName} downgraded to ${newStage}`,
      icon: '📉'
    }),

    staffAdded: (staffName, role) => addToast({
      type: 'success',
      title: 'Staff Member Added',
      message: `${staffName} has been added as ${role}`,
      icon: '👥'
    }),

    staffUpdated: (staffName) => addToast({
      type: 'success',
      title: 'Staff Updated',
      message: `${staffName}'s information has been updated`,
      icon: '✏️'
    }),

    staffDeleted: (staffName) => addToast({
      type: 'success',
      title: 'Staff Removed',
      message: `${staffName} has been removed from the system`,
      icon: '👋'
    }),

    userApproved: (userName) => addToast({
      type: 'success',
      title: 'User Approved',
      message: `${userName} has been approved and activated`,
      icon: '✅'
    }),

    userDeactivated: (userName) => addToast({
      type: 'warning',
      title: 'User Deactivated',
      message: `${userName} has been deactivated`,
      icon: '⏸️'
    }),

    enquiryUpdated: (enquiryId, status) => addToast({
      type: 'info',
      title: 'Enquiry Updated',
      message: `Enquiry #${enquiryId} status changed to ${status}`,
      icon: '📝'
    }),

    enquiryStageUpgraded: (studentName, newStage) => addToast({
      type: 'success',
      title: 'Enquiry Stage Upgraded',
      message: `${studentName} upgraded to ${newStage}`,
      icon: '📈'
    }),

    enquiryStageDowngraded: (studentName, newStage) => addToast({
      type: 'warning',
      title: 'Enquiry Stage Downgraded',
      message: `${studentName} downgraded to ${newStage}`,
      icon: '📉'
    }),

    enquiryStageChanged: (studentName, newStage) => addToast({
      type: 'info',
      title: 'Enquiry Stage Updated',
      message: `${studentName} moved to ${newStage}`,
      icon: '📝'
    }),

    reportGenerated: (reportType) => addToast({
      type: 'success',
      title: 'Report Generated',
      message: `${reportType} report has been generated successfully`,
      icon: '📊'
    }),

    dataImported: (itemCount, itemType) => addToast({
      type: 'success',
      title: 'Data Imported',
      message: `${itemCount} ${itemType} imported successfully`,
      icon: '📥'
    }),

    dataExported: (itemType) => addToast({
      type: 'success',
      title: 'Data Exported',
      message: `${itemType} data exported successfully`,
      icon: '📤'
    }),

    passwordChanged: () => addToast({
      type: 'success',
      title: 'Password Updated',
      message: 'Your password has been changed successfully',
      icon: '🔐'
    }),

    profileUpdated: () => addToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Your profile information has been saved',
      icon: '👤'
    }),

    assignmentCreated: (title) => addToast({
      type: 'success',
      title: 'Assignment Created',
      message: `Assignment "${title}" has been created`,
      icon: '📝'
    }),

    attendanceMarked: (className) => addToast({
      type: 'success',
      title: 'Attendance Marked',
      message: `Attendance recorded for ${className}`,
      icon: '✅'
    }),

    examScheduled: (examName, date) => addToast({
      type: 'info',
      title: 'Exam Scheduled',
      message: `${examName} scheduled for ${date}`,
      icon: '📅'
    }),

    systemMaintenance: (message) => addToast({
      type: 'warning',
      title: 'System Maintenance',
      message,
      icon: '🔧',
      duration: 10000
    }),

    connectionError: () => addToast({
      type: 'error',
      title: 'Connection Error',
      message: 'Unable to connect to server. Please check your internet connection.',
      icon: '🌐',
      duration: 8000
    }),

    permissionDenied: (action) => addToast({
      type: 'error',
      title: 'Permission Denied',
      message: `You don't have permission to ${action}`,
      icon: '🚫',
      duration: 6000
    }),

    // Advanced Statistics specific toasts
    advancedAnalyticsRefreshed: () => addToast({
      type: 'success',
      title: 'Analytics Refreshed',
      message: 'Advanced statistics data has been updated',
      icon: '📊'
    }),

    analyticsFilterApplied: (filterName) => addToast({
      type: 'info',
      title: 'Filter Applied',
      message: `Statistics filtered by ${filterName}`,
      icon: '🔍'
    }),

    analyticsExported: (format) => addToast({
      type: 'success',
      title: 'Analytics Exported',
      message: `Analytics data exported as ${format}`,
      icon: '📥'
    }),

    performanceAlert: (metric, value) => addToast({
      type: 'warning',
      title: 'Performance Alert',
      message: `${metric} is at ${value}% - monitoring required`,
      icon: '⚠️',
      duration: 8000
    }),

    systemHealthCheck: (status) => addToast({
      type: status === 'healthy' ? 'success' : 'warning',
      title: 'System Health Check',
      message: `System status: ${status}`,
      icon: status === 'healthy' ? '💚' : '🟡'
    }),

    realTimeUpdate: (module) => addToast({
      type: 'info',
      title: 'Real-time Update',
      message: `${module} data updated automatically`,
      icon: '🔄',
      duration: 3000
    }),

    // Receptionist specific toasts
    communicationAdded: (type, studentName) => addToast({
      type: 'success',
      title: `${type} Added`,
      message: `${type} added for ${studentName}`,
      icon: '💬'
    }),

    callLogged: (studentName) => addToast({
      type: 'success',
      title: 'Call Logged',
      message: `Call logged for ${studentName}`,
      icon: '📞'
    }),

    followupScheduled: (studentName, date) => addToast({
      type: 'info',
      title: 'Follow-up Scheduled',
      message: `Follow-up scheduled for ${studentName} on ${date}`,
      icon: '📅'
    }),

    studentContactUpdated: (studentName) => addToast({
      type: 'success',
      title: 'Contact Updated',
      message: `Contact information updated for ${studentName}`,
      icon: '📱'
    })
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};
