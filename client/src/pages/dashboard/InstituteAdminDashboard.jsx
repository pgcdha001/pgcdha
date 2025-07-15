import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { default as api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  FileText, 
  UserCheck, 
  UserX, 
  ClipboardList,
  Mail,
  School,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const InstituteAdminDashboard = () => {
  const { toast } = useToast();
  
  // State for dashboard statistics
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayRegistrations: 0,
    stageStats: {
      notPurchased: 0,
      purchased: 0,
      returned: 0,
      admissionFee: 0,
      firstInstallment: 0
    },
    totalStaff: 0,
    todayEnquiries: 0,
    pendingApprovals: 0,
    recentActivities: [],
    lastUpdated: null
  });
  
  // Correspondence statistics state
  const [correspondenceStats, setCorrespondenceStats] = useState({
    totalRemarks: 0,
    uniqueStudents: 0,
    totalStudentsWithRemarks: 0,
    averageRemarksPerStudent: 0,
    recentRemarks: []
  });
  
  const [loading, setLoading] = useState(true);

  // Fetch dashboard statistics
  useEffect(() => {
    fetchDashboardStats();
    fetchCorrespondenceStats();
  }, []);

  const fetchCorrespondenceStats = async () => {
    try {
      const response = await api.get('/remarks/correspondence-statistics?timeFilter=all');
      
      if (response.data.success) {
        setCorrespondenceStats({
          ...response.data.data.summary,
          recentRemarks: response.data.data.recentRemarks || []
        });
      }
    } catch (error) {
      console.error('Error fetching correspondence statistics:', error);
      // Don't show error toast for correspondence stats failure
    }
  };

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Fetch students data
      const studentsRes = await api.get('/users?role=Student&limit=1000');
      const students = studentsRes.data?.data?.users || [];
      
      // Fetch staff data
      const staffRes = await api.get('/users?role=Teacher&limit=1000');
      const staff = staffRes.data?.data?.users || [];
      
      // Calculate today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate statistics
      const todayRegistrations = students.filter(student => 
        student.registrationDate?.includes(today) || 
        student.createdAt?.includes(today)
      ).length;
      
      // Calculate stage statistics
      const stageStats = {
        notPurchased: students.filter(s => (s.prospectusStage || 1) === 1).length,
        purchased: students.filter(s => (s.prospectusStage || 1) === 2).length,
        returned: students.filter(s => (s.prospectusStage || 1) === 3).length,
        admissionFee: students.filter(s => (s.prospectusStage || 1) === 4).length,
        firstInstallment: students.filter(s => (s.prospectusStage || 1) === 5).length
      };
      
      // Count pending approvals (inactive users)
      const pendingApprovals = students.filter(s => !s.isActive).length;
      
      // Update stats
      setStats({
        totalStudents: students.length,
        todayRegistrations,
        stageStats,
        totalStaff: staff.length,
        todayEnquiries: todayRegistrations, // For now, same as registrations
        pendingApprovals,
        recentActivities: students.slice(-5).reverse().map(student => ({
          title: 'New Student Registration',
          description: `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''} registered`,
          time: formatRelativeTime(student.createdAt),
          type: 'registration'
        })),
        lastUpdated: new Date()
      });
      
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (dateString) => {
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
  };

  // Sample absentees data (keep existing for now)
  const studentAbsentees = [
    'Ali Hassan (CS-2A) - Absent',
    'Sara Ahmed (BBA-1A) - Absent', 
    'Omar Khan (CS-3B) - Absent',
    'Fatima Ali (CS-2A) - Absent'
  ];

  const lectureAbsentees = [
    'Prof. Khan - Database Systems (Late)',
    'Dr. Sarah - Mathematics (Absent)',
    'Prof. Ahmed - Physics (Late)'
  ];

  // Sliding animation component
  const SlidingText = ({ items, className = "" }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      if (items.length > 1) {
        const interval = setInterval(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
        }, 2500); // Change every 2.5 seconds

        return () => clearInterval(interval);
      }
    }, [items.length]);

    if (items.length === 0) {
      return <p className={className}>No issues today!</p>;
    }

    return (
      <div className="relative overflow-hidden h-6">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <p className={`${className} text-red-600 font-medium`}>{item}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const reportCards = [
    { 
      title: 'Enquiry Management', 
      href: '/institute-admin/enquiries', 
      icon: MessageSquare, 
      recentActivity: 'Manage student enquiries and applications',
      todayCount: `${stats.todayEnquiries} new today`,
      bgGradient: 'from-blue-500 to-blue-600',
      type: 'normal'
    },
    { 
      title: 'Student Attendance', 
      href: '/institute-admin/student-attendance', 
      icon: UserX,
      slidingItems: studentAbsentees,
      todayCount: '156 absentees today',
      bgGradient: 'from-red-500 to-red-600',
      type: 'sliding'
    },
    { 
      title: 'Lecture Attendance', 
      href: '/institute-admin/lecture-attendance', 
      icon: BookOpen, 
      slidingItems: lectureAbsentees,
      todayCount: '3 issues today',
      bgGradient: 'from-red-500 to-red-600',
      type: 'sliding'
    },
    { 
      title: 'Examinations', 
      href: '/institute-admin/examinations', 
      icon: ClipboardList, 
      recentActivity: 'Schedule and manage examinations',
      todayCount: '3 exams scheduled',
      bgGradient: 'from-orange-500 to-orange-600',
      type: 'normal'
    },
    { 
      title: 'Correspondence', 
      href: '/institute-admin/correspondence', 
      icon: Mail, 
      recentActivity: 'Handle institute communications',
      todayCount: '8 pending',
      bgGradient: 'from-indigo-500 to-indigo-600',
      type: 'normal'
    },
    { 
      title: 'Staff Management', 
      href: '/institute-admin/staff', 
      icon: Users, 
      recentActivity: 'Manage faculty and staff members',
      todayCount: `${stats.totalStaff} staff members`,
      bgGradient: 'from-teal-500 to-teal-600',
      type: 'normal'
    },
    { 
      title: 'Student Management', 
      href: '/institute-admin/students', 
      icon: GraduationCap, 
      recentActivity: 'Manage student records and information',
      todayCount: `${stats.totalStudents} students`,
      bgGradient: 'from-pink-500 to-pink-600',
      type: 'normal'
    },
    { 
      title: 'Principal Appointments', 
      href: '/institute-admin/appointments', 
      icon: Calendar, 
      recentActivity: 'Schedule and manage appointments',
      todayCount: '5 appointments',
      bgGradient: 'from-amber-500 to-amber-600',
      type: 'normal'
    },
  ];

  const recentActivities = [
    { 
      title: 'New Enquiry Received', 
      description: 'Ahmed Hassan submitted enquiry for Computer Science',
      time: '10 minutes ago',
      type: 'enquiry'
    },
    { 
      title: 'Attendance Marked', 
      description: 'CS-2A attendance completed by Prof. Sarah',
      time: '25 minutes ago',
      type: 'attendance'
    },
    { 
      title: 'Exam Schedule Updated', 
      description: 'Mid-term examination dates finalized',
      time: '1 hour ago',
      type: 'exam'
    },
    { 
      title: 'Staff Meeting Scheduled', 
      description: 'Monthly staff meeting set for tomorrow',
      time: '2 hours ago',
      type: 'meeting'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-border/50 p-8 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/90 to-accent/80 text-white shadow-lg">
              <School className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-primary mb-2 font-[Sora,Inter,sans-serif] tracking-tight">Institute Admin Dashboard</h2>
              <p className="text-muted-foreground font-medium">Manage institute operations and daily activities</p>
              {stats.lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {stats.lastUpdated.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={fetchDashboardStats}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <TrendingUp className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        </div>
      </div>

      {/* Real-time Statistics Dashboard */}
      {loading ? (
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <span className="text-primary font-medium">Loading statistics...</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Key Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Today's Registrations */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Today's Registrations</p>
                  <p className="text-3xl font-bold">{stats.todayRegistrations}</p>
                  <p className="text-green-100 text-xs mt-1">New students today</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <UserCheck className="h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Total Students */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold">{stats.totalStudents}</p>
                  <p className="text-blue-100 text-xs mt-1">All registered students</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <GraduationCap className="h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Pending Approvals</p>
                  <p className="text-3xl font-bold">{stats.pendingApprovals}</p>
                  <p className="text-orange-100 text-xs mt-1">Awaiting activation</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Clock className="h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Total Staff */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Staff</p>
                  <p className="text-3xl font-bold">{stats.totalStaff}</p>
                  <p className="text-purple-100 text-xs mt-1">Faculty members</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Correspondence Statistics */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-8">
            <h3 className="text-2xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full"></div>
              Correspondence Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Correspondence */}
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">Total Correspondence</p>
                    <p className="text-3xl font-bold">{correspondenceStats.totalRemarks || 0}</p>
                    <p className="text-indigo-100 text-xs mt-1">All remarks recorded</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <MessageSquare className="h-8 w-8" />
                  </div>
                </div>
              </div>

              {/* Students Contacted */}
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-sm font-medium">Students Contacted</p>
                    <p className="text-3xl font-bold">{correspondenceStats.uniqueStudents || 0}</p>
                    <p className="text-teal-100 text-xs mt-1">Unique students</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Users className="h-8 w-8" />
                  </div>
                </div>
              </div>

              {/* Students with Records */}
              <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cyan-100 text-sm font-medium">Students with Records</p>
                    <p className="text-3xl font-bold">{correspondenceStats.totalStudentsWithRemarks || 0}</p>
                    <p className="text-cyan-100 text-xs mt-1">Having correspondence</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                </div>
              </div>

              {/* Average per Student */}
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Average per Student</p>
                    <p className="text-3xl font-bold">{correspondenceStats.averageRemarksPerStudent ? Number(correspondenceStats.averageRemarksPerStudent).toFixed(1) : '0.0'}</p>
                    <p className="text-emerald-100 text-xs mt-1">Remarks per student</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enquiry Stages Statistics */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-8">
            <h3 className="text-2xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full"></div>
              Enquiry Stages Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Stage 1: Not Purchased */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Not Purchased</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.stageStats.notPurchased}</p>
                    <p className="text-gray-500 text-xs">Stage 1</p>
                  </div>
                  <div className="bg-gray-200 p-2 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
              </div>

              {/* Stage 2: Purchased */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Purchased</p>
                    <p className="text-2xl font-bold text-blue-800">{stats.stageStats.purchased}</p>
                    <p className="text-blue-500 text-xs">Stage 2</p>
                  </div>
                  <div className="bg-blue-200 p-2 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Stage 3: Returned */}
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 text-sm font-medium">Returned</p>
                    <p className="text-2xl font-bold text-yellow-800">{stats.stageStats.returned}</p>
                    <p className="text-yellow-500 text-xs">Stage 3</p>
                  </div>
                  <div className="bg-yellow-200 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </div>

              {/* Stage 4: Admission Fee */}
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Admission Fee</p>
                    <p className="text-2xl font-bold text-orange-800">{stats.stageStats.admissionFee}</p>
                    <p className="text-orange-500 text-xs">Stage 4</p>
                  </div>
                  <div className="bg-orange-200 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Stage 5: First Installment */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">First Installment</p>
                    <p className="text-2xl font-bold text-green-800">{stats.stageStats.firstInstallment}</p>
                    <p className="text-green-500 text-xs">Stage 5</p>
                  </div>
                  <div className="bg-green-200 p-2 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities & Correspondence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activities */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-8">
              <h3 className="text-2xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                Recent Activities
              </h3>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {stats.recentActivities.length > 0 ? (
                  stats.recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {activity.time}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No recent activities</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Correspondence */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-8">
              <h3 className="text-2xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                Recent Correspondence
              </h3>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {correspondenceStats.recentRemarks && correspondenceStats.recentRemarks.length > 0 ? (
                  correspondenceStats.recentRemarks.map((remark, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-200">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {remark.studentName || `${remark.student?.fullName?.firstName || 'Unknown'} ${remark.student?.fullName?.lastName || 'Student'}`}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">{remark.remark}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          By {remark.receptionistName || remark.receptionist?.fullName?.firstName || 'Unknown'} • {new Date(remark.createdAt || remark.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No recent correspondence</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Management Cards */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-8 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
        <h3 className="text-2xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full"></div>
          Institute Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reportCards.map((card) => (
            <Link
              key={card.title}
              to={card.href}
              className="group bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-border/30 transition-all duration-300 hover:shadow-xl hover:bg-white/80 hover:scale-[1.02] hover:border-primary/20"
            >
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${card.bgGradient} mb-4 transition-all duration-200 group-hover:scale-110 shadow-lg`}>
                  <card.icon className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-bold text-primary mb-3 font-[Sora,Inter,sans-serif] group-hover:text-accent transition-colors duration-200">{card.title}</h4>
                
                {/* Recent Activity - different rendering for sliding vs normal */}
                <div className="bg-gray-50/80 rounded-lg px-3 py-2 mb-3 min-h-[3rem] flex items-center">
                  {card.type === 'sliding' ? (
                    <SlidingText 
                      items={card.slidingItems} 
                      className="text-xs leading-tight"
                    />
                  ) : (
                    <p className="text-xs text-gray-700 font-medium leading-tight">{card.recentActivity}</p>
                  )}
                </div>
                
                {/* Today's Count */}
                <div className={`${card.type === 'sliding' ? 'bg-red-100/80' : 'bg-primary/10'} rounded-lg px-3 py-2`}>
                  <p className={`text-xs font-semibold ${card.type === 'sliding' ? 'text-red-700' : 'text-primary'}`}>{card.todayCount}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-6 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
          <h3 className="text-xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            Recent Activities
          </h3>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-white/50 rounded-xl border border-border/30 transition-all duration-200 hover:bg-white/70 hover:shadow-md">
                <div className={`w-3 h-3 rounded-full mt-2 shadow-lg ${
                  activity.type === 'enquiry' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
                  activity.type === 'attendance' ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                  activity.type === 'exam' ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-purple-500 to-purple-600'
                }`}></div>
                <div className="flex-1">
                  <p className="font-semibold text-primary font-[Sora,Inter,sans-serif]">{activity.title}</p>
                  <p className="text-sm text-muted-foreground font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-6 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
          <h3 className="text-xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            Quick Insights
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-800">High Attendance Rate</p>
                  <p className="text-sm text-green-600">89% students present today</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-blue-800">Active Enquiries</p>
                  <p className="text-sm text-blue-600">12 new enquiries today</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-amber-800">Pending Tasks</p>
                  <p className="text-sm text-amber-600">8 correspondence items</p>
                </div>
                <Mail className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-purple-800">Upcoming Exams</p>
                  <p className="text-sm text-purple-600">3 exams this week</p>
                </div>
                <ClipboardList className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstituteAdminDashboard;
