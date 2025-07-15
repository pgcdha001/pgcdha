import React from 'react';
import { Link } from 'react-router-dom';
import { Users, School, BarChart3, Settings, Shield, Database } from 'lucide-react';

const SuperAdminDashboard = () => {
  const stats = [
    { name: 'Total Users', value: '1,234', icon: Users, color: 'bg-blue-500' },
    { name: 'Active Institutes', value: '12', icon: School, color: 'bg-green-500' },
    { name: 'System Health', value: '99.9%', icon: BarChart3, color: 'bg-purple-500' },
    { name: 'Active Sessions', value: '89', icon: Shield, color: 'bg-orange-500' },
  ];

  const quickActions = [
    { title: 'User Management', href: '/admin', icon: Users, description: 'Manage all system users' },
    { title: 'Institute Management', href: '/institutes', icon: School, description: 'Manage institutes and campuses' },
    { title: 'System Reports', href: '/reports', icon: BarChart3, description: 'View system analytics' },
    { title: 'System Settings', href: '/settings', icon: Settings, description: 'Configure system settings' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Super Admin Dashboard</h2>
        <p className="text-gray-600">System-wide overview and management tools</p>
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

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent System Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">New user registered: john.doe@student.pgc.edu.pk</span>
            <span className="text-xs text-gray-400">2 minutes ago</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Institute "Main Campus" updated</span>
            <span className="text-xs text-gray-400">1 hour ago</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-gray-600">System backup completed</span>
            <span className="text-xs text-gray-400">3 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
