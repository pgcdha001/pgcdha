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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Teacher Dashboard</h2>
        <p className="text-gray-600">Manage your classes, students, and academic activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <action.icon className="h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-medium text-gray-900">{action.title}</h4>
              <p className="text-sm text-gray-600">{action.description}</p>
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
