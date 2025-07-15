import React from 'react';
import { Link } from 'react-router-dom';
import { Users, School, BarChart3, Settings, Shield, Database } from 'lucide-react';
import Card from '../../components/ui/card';

const SuperAdminDashboard = () => {
  const stats = [
    { name: 'Total Users', value: '1,234', icon: <Users className="h-6 w-6" />, color: 'from-primary/80 to-accent/70' },
    { name: 'Active Institutes', value: '12', icon: <School className="h-6 w-6" />, color: 'from-green-500 to-blue-400' },
    { name: 'System Health', value: '99.9%', icon: <BarChart3 className="h-6 w-6" />, color: 'from-purple-500 to-primary/80' },
    { name: 'Active Sessions', value: '89', icon: <Shield className="h-6 w-6" />, color: 'from-orange-500 to-accent/70' },
  ];

  const quickActions = [
    { title: 'User Management', href: '/admin', icon: <Users className="h-7 w-7" />, description: 'Manage all system users' },
    { title: 'Institute Management', href: '/institutes', icon: <School className="h-7 w-7" />, description: 'Manage institutes and campuses' },
    { title: 'System Reports', href: '/reports', icon: <BarChart3 className="h-7 w-7" />, description: 'View system analytics' },
    { title: 'System Settings', href: '/settings', icon: <Settings className="h-7 w-7" />, description: 'Configure system settings' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card header={{ title: 'Super Admin Dashboard' }}>
        <p className="text-gray-600 font-[Inter,sans-serif]">System-wide overview and management tools</p>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="flex items-center">
            <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg mr-4`}>
              {stat.icon}
            </span>
            <div>
              <p className="text-sm font-medium text-muted-foreground font-[Inter,sans-serif]">{stat.name}</p>
              <p className="text-2xl font-bold text-primary font-[Sora,Inter,sans-serif]">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card header={{ title: 'Quick Actions' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="p-4 rounded-2xl bg-white/50 backdrop-blur-xl border border-border shadow transition-all hover:shadow-xl hover:bg-primary/10 flex flex-col items-center text-center group"
              style={{fontFamily: 'Inter, sans-serif'}}
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-accent/70 text-white shadow-lg mb-2 group-hover:scale-110 transition-transform">{action.icon}</span>
              <h4 className="font-semibold text-primary font-[Sora,Inter,sans-serif]">{action.title}</h4>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </Link>
          ))}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card header={{ title: 'Recent System Activity' }}>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">New user registered: john.doe@student.pgc.edu.pk</span>
            <span className="text-xs text-gray-400">2 minutes ago</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-sm text-muted-foreground">Institute "Main Campus" updated</span>
            <span className="text-xs text-gray-400">1 hour ago</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">System backup completed</span>
            <span className="text-xs text-gray-400">3 hours ago</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;
