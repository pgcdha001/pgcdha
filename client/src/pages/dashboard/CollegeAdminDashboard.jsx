import React from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, BookOpen, Calendar, TrendingUp, FileText } from 'lucide-react';

const CollegeAdminDashboard = () => {
  const stats = [
    { name: 'Total Students', value: '2,847', icon: GraduationCap, color: 'bg-blue-500' },
    { name: 'Faculty Members', value: '156', icon: Users, color: 'bg-green-500' },
    { name: 'Active Courses', value: '89', icon: BookOpen, color: 'bg-purple-500' },
    { name: 'This Month Enrollment', value: '234', icon: TrendingUp, color: 'bg-orange-500' },
  ];

  const quickActions = [
    { title: 'Student Management', href: '/students', icon: GraduationCap, description: 'Manage student records' },
    { title: 'Faculty Management', href: '/teachers', icon: Users, description: 'Manage teaching staff' },
    { title: 'Course Management', href: '/courses', icon: BookOpen, description: 'Manage course catalog' },
    { title: 'Academic Reports', href: '/reports', icon: FileText, description: 'View academic reports' },
  ];

  const upcomingEvents = [
    { title: 'Mid-term Examinations', date: 'March 15-22, 2024', type: 'exam' },
    { title: 'Faculty Meeting', date: 'March 10, 2024', type: 'meeting' },
    { title: 'Parent-Teacher Conference', date: 'March 25, 2024', type: 'event' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-border/50 p-8 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/90 to-accent/80 text-white shadow-lg">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-primary mb-2 font-[Sora,Inter,sans-serif] tracking-tight">College Admin Dashboard</h2>
            <p className="text-muted-foreground font-medium">Manage academic operations and administration</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={stat.name} className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 p-6 transition-all duration-300 hover:shadow-xl hover:bg-white/70 hover:scale-[1.02] group" style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)'}}>
            <div className="flex items-center">
              <div className={`${stat.color} rounded-2xl p-4 shadow-lg transition-transform duration-200 group-hover:scale-110`}>
                <stat.icon className="h-7 w-7 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-primary/70 mb-1">{stat.name}</p>
                <p className="text-3xl font-bold text-primary font-[Sora,Inter,sans-serif]">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-8 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
        <h3 className="text-2xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full"></div>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="group bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-border/30 transition-all duration-300 hover:shadow-xl hover:bg-white/80 hover:scale-[1.02] hover:border-primary/20"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/15 mb-4 transition-all duration-200 group-hover:from-primary/30 group-hover:to-accent/25 group-hover:scale-110">
                  <action.icon className="h-7 w-7 text-primary" />
                </div>
                <h4 className="text-lg font-bold text-primary mb-2 font-[Sora,Inter,sans-serif] group-hover:text-accent transition-colors duration-200">{action.title}</h4>
                <p className="text-sm text-muted-foreground font-medium">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-6 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
          <h3 className="text-xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            Upcoming Events
          </h3>
          <div className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-white/50 rounded-xl border border-border/30 transition-all duration-200 hover:bg-white/70 hover:shadow-md">
                <div className={`w-4 h-4 rounded-full shadow-lg ${
                  event.type === 'exam' ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                  event.type === 'meeting' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-green-500 to-green-600'
                }`}></div>
                <div className="flex-1">
                  <p className="font-semibold text-primary font-[Sora,Inter,sans-serif]">{event.title}</p>
                  <p className="text-sm text-muted-foreground font-medium">{event.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-6 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
          <h3 className="text-xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            Recent Applications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-border/30 transition-all duration-200 hover:bg-white/70 hover:shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-accent/70 flex items-center justify-center text-white font-bold shadow-lg">
                  AH
                </div>
                <div>
                  <p className="font-semibold text-primary font-[Sora,Inter,sans-serif]">Ahmed Hassan</p>
                  <p className="text-sm text-muted-foreground">Computer Science - BS</p>
                </div>
              </div>
              <span className="text-xs px-3 py-1 bg-yellow-100/80 text-yellow-800 rounded-full font-semibold">Pending</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-border/30 transition-all duration-200 hover:bg-white/70 hover:shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-accent/70 flex items-center justify-center text-white font-bold shadow-lg">
                  FA
                </div>
                <div>
                  <p className="font-semibold text-primary font-[Sora,Inter,sans-serif]">Fatima Ali</p>
                  <p className="text-sm text-muted-foreground">Business Administration - BBA</p>
                </div>
              </div>
              <span className="text-xs px-3 py-1 bg-green-100/80 text-green-800 rounded-full font-semibold">Approved</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-border/30 transition-all duration-200 hover:bg-white/70 hover:shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-accent/70 flex items-center justify-center text-white font-bold shadow-lg">
                  MK
                </div>
                <div>
                  <p className="font-semibold text-primary font-[Sora,Inter,sans-serif]">Muhammad Khan</p>
                  <p className="text-sm text-muted-foreground">Engineering - BE</p>
                </div>
              </div>
              <span className="text-xs px-3 py-1 bg-blue-100/80 text-blue-800 rounded-full font-semibold">Review</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeAdminDashboard;
