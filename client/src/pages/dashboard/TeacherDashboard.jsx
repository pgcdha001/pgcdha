import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Calendar, FileText, Clock, CheckCircle } from 'lucide-react';

const TeacherDashboard = () => {
  const stats = [
    { name: 'My Classes', value: '8', icon: BookOpen, color: 'bg-blue-500' },
    { name: 'Total Students', value: '245', icon: Users, color: 'bg-green-500' },
    { name: 'Pending Assignments', value: '12', icon: FileText, color: 'bg-orange-500' },
    { name: 'Classes Today', value: '4', icon: Calendar, color: 'bg-purple-500' },
  ];

  const todaySchedule = [
    { time: '09:00 AM', subject: 'Mathematics', class: 'BS-CS-2A', room: 'Room 101' },
    { time: '11:00 AM', subject: 'Data Structures', class: 'BS-CS-3B', room: 'Lab 2' },
    { time: '02:00 PM', subject: 'Algorithms', class: 'BS-CS-4A', room: 'Room 205' },
    { time: '04:00 PM', subject: 'Database Systems', class: 'BS-CS-3A', room: 'Lab 1' },
  ];

  const pendingTasks = [
    { task: 'Grade Mid-term Papers - Mathematics', deadline: 'Due in 2 days', priority: 'high' },
    { task: 'Prepare Lecture Notes - Data Structures', deadline: 'Due tomorrow', priority: 'medium' },
    { task: 'Submit Monthly Report', deadline: 'Due in 5 days', priority: 'low' },
  ];

  const quickActions = [
    { title: 'My Classes', href: '/classes', icon: BookOpen, description: 'View and manage classes' },
    { title: 'Grade Book', href: '/gradebook', icon: FileText, description: 'Student grades and assessments' },
    { title: 'Attendance', href: '/attendance', icon: CheckCircle, description: 'Mark student attendance' },
    { title: 'Schedule', href: '/schedule', icon: Calendar, description: 'View teaching schedule' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-border/50 p-8 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/90 to-accent/80 text-white shadow-lg">
            <BookOpen className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-primary mb-2 font-[Sora,Inter,sans-serif] tracking-tight">Teacher Dashboard</h2>
            <p className="text-muted-foreground font-medium">Manage your classes, students, and academic activities</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 p-6 transition-all duration-300 hover:shadow-xl hover:bg-white/70 hover:scale-105" style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-primary/80 mb-1">{stat.name}</p>
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-2xl p-4 shadow-lg`}>
                <stat.icon className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 p-8 transition-all duration-300 hover:shadow-xl hover:bg-white/70" style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)'}}>
        <h3 className="text-xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="group bg-white/50 backdrop-blur-sm p-6 border border-border/30 rounded-2xl hover:border-primary/30 hover:shadow-lg transition-all duration-200 hover:scale-105 hover:bg-white/70"
            >
              <action.icon className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h4 className="font-bold text-primary mb-2 font-[Sora,Inter,sans-serif]">{action.title}</h4>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Schedule</h3>
          <div className="space-y-4">
            {todaySchedule.map((schedule, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">{schedule.time}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{schedule.subject}</p>
                  <p className="text-sm text-gray-600">{schedule.class} • {schedule.room}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Tasks</h3>
          <div className="space-y-3">
            {pendingTasks.map((task, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{task.task}</p>
                  <p className="text-sm text-gray-600">{task.deadline}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  task.priority === 'high' ? 'bg-red-100 text-red-800' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Attendance marked for BS-CS-2A Mathematics class</span>
            <span className="text-xs text-gray-400">1 hour ago</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Uploaded assignment for Data Structures course</span>
            <span className="text-xs text-gray-400">3 hours ago</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Graded quiz submissions for Algorithms class</span>
            <span className="text-xs text-gray-400">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
