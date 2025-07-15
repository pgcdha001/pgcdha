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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">College Admin Dashboard</h2>
        <p className="text-gray-600">Manage academic operations and administration</p>
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
        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Events</h3>
          <div className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  event.type === 'exam' ? 'bg-red-500' : 
                  event.type === 'meeting' ? 'bg-blue-500' : 'bg-green-500'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-600">{event.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Applications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Ahmed Hassan</p>
                <p className="text-sm text-gray-600">Computer Science - BS</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                Pending
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Fatima Ali</p>
                <p className="text-sm text-gray-600">Business Administration - BBA</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Approved
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Muhammad Khan</p>
                <p className="text-sm text-gray-600">Engineering - BE</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                Review
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeAdminDashboard;
