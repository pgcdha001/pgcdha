import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../../contexts/DashboardContext';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  UserX, 
  UserCheck,
  ClipboardList,
  Mail,
  School,
  TrendingUp
} from 'lucide-react';

const InstituteAdminDashboard = () => {
  // Use dashboard context instead of local state
  const { dashboardData, loading, refreshDashboard } = useDashboard();

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
      title: 'Enquiry Reports', 
      href: '/reports?section=enquiries', 
      icon: MessageSquare, 
      recentActivity: dashboardData.recentEnquiry 
        ? `Latest: ${dashboardData.recentEnquiry.fullName?.firstName || ''} ${dashboardData.recentEnquiry.fullName?.lastName || ''}`
        : 'No recent enquiries',
      todayCount: `${dashboardData.todayEnquiries} new today`,
      bgGradient: 'from-blue-500 to-blue-600',
      type: 'normal'
    },
    { 
      title: 'Student Attendance Reports', 
      href: '/reports?section=student-attendance', 
      icon: UserX,
      slidingItems: studentAbsentees,
      todayCount: '156 absentees today',
      bgGradient: 'from-red-500 to-red-600',
      type: 'sliding'
    },
    { 
      title: 'Lecture Attendance Reports', 
      href: '/reports?section=lecture-attendance', 
      icon: BookOpen, 
      slidingItems: lectureAbsentees,
      todayCount: '3 issues today',
      bgGradient: 'from-red-500 to-red-600',
      type: 'sliding'
    },
    { 
      title: 'Examination Reports', 
      href: '/reports?section=examinations', 
      icon: ClipboardList, 
      recentActivity: 'Mid-term examinations scheduled',
      todayCount: `${dashboardData.upcomingExams} exams this week`,
      bgGradient: 'from-orange-500 to-orange-600',
      type: 'normal'
    },
    { 
      title: 'Correspondence Reports', 
      href: '/reports?section=correspondence', 
      icon: Mail, 
      recentActivity: dashboardData.recentCorrespondence 
        ? `Latest: ${dashboardData.recentCorrespondence.studentName} - ${dashboardData.recentCorrespondence.remark?.substring(0, 30) || 'No remark'}...`
        : 'No recent correspondence',
      todayCount: `${dashboardData.todayCorrespondence || 0} today, ${dashboardData.totalCorrespondence || 0} total`,
      bgGradient: 'from-indigo-500 to-indigo-600',
      type: 'normal'
    },
    { 
      title: 'Staff Management', 
      href: '/institute-admin/staff', 
      icon: Users, 
      recentActivity: 'Faculty and administrative staff',
      todayCount: `${dashboardData.totalStaff} staff members`,
      bgGradient: 'from-teal-500 to-teal-600',
      type: 'normal'
    },
    { 
      title: 'Student Management', 
      href: '/institute-admin/students', 
      icon: GraduationCap, 
      recentActivity: 'Student records and enrollment',
      todayCount: `${dashboardData.totalStudents} students`,
      bgGradient: 'from-pink-500 to-pink-600',
      type: 'normal'
    },
    { 
      title: 'Principal Appointments', 
      href: '/reports?section=appointments', 
      icon: Calendar, 
      recentActivity: 'Meeting schedule and appointments',
      todayCount: `${dashboardData.scheduledAppointments} scheduled`,
      bgGradient: 'from-amber-500 to-amber-600',
      type: 'normal'
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
              {dashboardData.lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {dashboardData.lastUpdated.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={refreshDashboard}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <TrendingUp className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Management Cards */}
      {loading ? (
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <span className="text-primary font-medium">Loading dashboard data...</span>
            </div>
          </div>
        </div>
      ) : (
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
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-6 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
          <h3 className="text-xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            Recent Activities
          </h3>
          <div className="space-y-4">
            {dashboardData.recentActivities.length > 0 ? (
              dashboardData.recentActivities.map((activity, index) => (
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
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No recent activities</p>
              </div>
            )}
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
