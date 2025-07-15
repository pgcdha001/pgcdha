import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { default as api } from '../services/api';
import { useToast } from './ToastContext';
import { useAuth } from '../hooks/useAuth';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Central dashboard state
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalStaff: 0,
    todayEnquiries: 0,
    recentEnquiry: null,
    recentActivities: [],
    upcomingExams: 3, // Static for now
    pendingCorrespondence: 8, // Static for now
    scheduledAppointments: 5, // Static for now
    lastUpdated: null,
    isInitialized: false
  });
  
  const [loading, setLoading] = useState(false);

  // Format relative time helper
  const formatRelativeTime = useCallback((dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }, []);

  // Initial data fetch (only once when user logs in)
  const initializeDashboard = useCallback(async () => {
    if (!user || dashboardData.isInitialized) return;
    
    setLoading(true);
    try {
      // Fetch initial data
      const [studentsRes, staffRes] = await Promise.all([
        api.get('/users?role=Student&limit=1000'),
        api.get('/users?role=Teacher&limit=1000')
      ]);
      
      const students = studentsRes.data?.data?.users || [];
      const staff = staffRes.data?.data?.users || [];
      
      // Calculate today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate today's enquiries (new registrations)
      const todayEnquiries = students.filter(student => 
        student.registrationDate?.includes(today) || 
        student.createdAt?.includes(today)
      ).length;

      // Get most recent enquiry
      const recentEnquiry = students.length > 0 ? students[students.length - 1] : null;

      // Create recent activities from latest students
      const recentActivities = students.slice(-5).reverse().map(student => ({
        id: student._id,
        title: 'New Student Registration',
        description: `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''} registered`,
        time: formatRelativeTime(student.createdAt),
        type: 'enquiry',
        timestamp: student.createdAt
      }));

      // Update dashboard data
      setDashboardData({
        totalStudents: students.length,
        totalStaff: staff.length,
        todayEnquiries,
        recentEnquiry,
        recentActivities,
        upcomingExams: 3,
        pendingCorrespondence: 8,
        scheduledAppointments: 5,
        lastUpdated: new Date(),
        isInitialized: true
      });
      
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user, dashboardData.isInitialized, formatRelativeTime, toast]);

  // Add a new enquiry/student (called when a new student is added)
  const addNewEnquiry = useCallback((newStudent) => {
    setDashboardData(prev => {
      const newActivity = {
        id: newStudent._id,
        title: 'New Student Registration',
        description: `${newStudent.fullName?.firstName || ''} ${newStudent.fullName?.lastName || ''} registered`,
        time: 'Just now',
        type: 'enquiry',
        timestamp: newStudent.createdAt || new Date().toISOString()
      };

      // Calculate if this is today's enquiry
      const today = new Date().toISOString().split('T')[0];
      const isToday = newStudent.createdAt?.includes(today) || new Date().toISOString().includes(today);

      return {
        ...prev,
        totalStudents: prev.totalStudents + 1,
        todayEnquiries: isToday ? prev.todayEnquiries + 1 : prev.todayEnquiries,
        recentEnquiry: newStudent,
        recentActivities: [newActivity, ...prev.recentActivities.slice(0, 4)], // Keep only 5 most recent
        lastUpdated: new Date()
      };
    });
  }, []);

  // Update student count (when students are modified/deleted)
  const updateStudentCount = useCallback((delta) => {
    setDashboardData(prev => ({
      ...prev,
      totalStudents: Math.max(0, prev.totalStudents + delta),
      lastUpdated: new Date()
    }));
  }, []);

  // Update staff count (when staff are modified/deleted)
  const updateStaffCount = useCallback((delta) => {
    setDashboardData(prev => ({
      ...prev,
      totalStaff: Math.max(0, prev.totalStaff + delta),
      lastUpdated: new Date()
    }));
  }, []);

  // Add custom activity (for other dashboard events)
  const addActivity = useCallback((activity) => {
    setDashboardData(prev => ({
      ...prev,
      recentActivities: [
        {
          id: Date.now().toString(),
          time: 'Just now',
          timestamp: new Date().toISOString(),
          ...activity
        },
        ...prev.recentActivities.slice(0, 4)
      ],
      lastUpdated: new Date()
    }));
  }, []);

  // Update correspondence count
  const updateCorrespondenceCount = useCallback((delta) => {
    setDashboardData(prev => ({
      ...prev,
      pendingCorrespondence: Math.max(0, prev.pendingCorrespondence + delta),
      lastUpdated: new Date()
    }));
  }, []);

  // Update exams count
  const updateExamsCount = useCallback((delta) => {
    setDashboardData(prev => ({
      ...prev,
      upcomingExams: Math.max(0, prev.upcomingExams + delta),
      lastUpdated: new Date()
    }));
  }, []);

  // Update appointments count
  const updateAppointmentsCount = useCallback((delta) => {
    setDashboardData(prev => ({
      ...prev,
      scheduledAppointments: Math.max(0, prev.scheduledAppointments + delta),
      lastUpdated: new Date()
    }));
  }, []);

  // Manual refresh (only when user explicitly requests it)
  const refreshDashboard = useCallback(async () => {
    setDashboardData(prev => ({ ...prev, isInitialized: false }));
    await initializeDashboard();
  }, [initializeDashboard]);

  // Initialize dashboard when user is available
  useEffect(() => {
    if (user && !dashboardData.isInitialized && !loading) {
      initializeDashboard();
    }
  }, [user, dashboardData.isInitialized, loading, initializeDashboard]);

  const value = {
    dashboardData,
    loading,
    addNewEnquiry,
    updateStudentCount,
    updateStaffCount,
    addActivity,
    updateCorrespondenceCount,
    updateExamsCount,
    updateAppointmentsCount,
    refreshDashboard,
    formatRelativeTime
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export default DashboardContext;
