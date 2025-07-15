import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Phone, Calendar, FileText, Clock, UserCheck } from 'lucide-react';

const ReceptionistDashboard = () => {
  const stats = [
    { name: 'Daily Visitors', value: '45', icon: Users, color: 'bg-blue-500' },
    { name: 'Pending Calls', value: '8', icon: Phone, color: 'bg-orange-500' },
    { name: 'Appointments Today', value: '12', icon: Calendar, color: 'bg-green-500' },
    { name: 'Messages', value: '23', icon: FileText, color: 'bg-purple-500' },
  ];

  const quickActions = [
    { title: 'Visitor Management', href: '/reception/visitors', icon: Users, description: 'Register visitors' },
    { title: 'Appointments', href: '/reception/appointments', icon: Calendar, description: 'Schedule meetings' },
    { title: 'Call Log', href: '/reception/calls', icon: Phone, description: 'Manage phone calls' },
    { title: 'Messages', href: '/reception/messages', icon: FileText, description: 'Handle messages' },
  ];

  const todayAppointments = [
    { time: '09:00 AM', visitor: 'Mr. Ahmed Khan', purpose: 'Admission Inquiry', status: 'confirmed' },
    { time: '10:30 AM', visitor: 'Ms. Fatima Ali', purpose: 'Fee Payment', status: 'waiting' },
    { time: '11:15 AM', visitor: 'Dr. Hassan', purpose: 'Faculty Meeting', status: 'confirmed' },
    { time: '02:00 PM', visitor: 'Mrs. Zainab', purpose: 'Student Progress', status: 'confirmed' },
  ];

  const recentVisitors = [
    { name: 'Ahmed Hassan', purpose: 'Admission', time: '30 min ago', status: 'completed' },
    { name: 'Fatima Khan', purpose: 'Document Collection', time: '1 hour ago', status: 'completed' },
    { name: 'Muhammad Ali', purpose: 'Fee Inquiry', time: '2 hours ago', status: 'completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reception Dashboard</h2>
        <p className="text-gray-600">Manage visitors, appointments, and front desk operations</p>
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
        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Appointments</h3>
          <div className="space-y-3">
            {todayAppointments.map((appointment, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">{appointment.time}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{appointment.visitor}</p>
                    <p className="text-sm text-gray-600">{appointment.purpose}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {appointment.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Visitors */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Visitors</h3>
          <div className="space-y-3">
            {recentVisitors.map((visitor, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <UserCheck className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{visitor.name}</p>
                    <p className="text-sm text-gray-600">{visitor.purpose}</p>
                    <p className="text-xs text-gray-500">{visitor.time}</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  {visitor.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">45</div>
            <div className="text-sm text-gray-600">Total Visitors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">32</div>
            <div className="text-sm text-gray-600">Calls Handled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">12</div>
            <div className="text-sm text-gray-600">Appointments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">8</div>
            <div className="text-sm text-gray-600">Pending Tasks</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
