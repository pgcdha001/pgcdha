import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, UserCheck, Shield } from 'lucide-react';
import { userAPI } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * User Statistics Component
 * Shows user counts filtered by permissions and allowed roles
 */
const UserStatistics = ({ allowedRoles = ['all'] }) => {
  const { userRole } = usePermissions();
  const [statistics, setStatistics] = useState({
    total: 0,
    students: 0,
    teachers: 0,
    staff: 0,
    admins: 0,
    receptionists: 0,
    it: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        
        // Fetch user counts based on allowed roles
        const promises = [];
        
        if (allowedRoles.includes('all') || allowedRoles.includes('Student')) {
          promises.push(userAPI.getUsers({ role: 'Student', limit: 1 }).then(res => ({ type: 'students', count: res.data?.pagination?.totalUsers || 0 })));
        }
        
        if (allowedRoles.includes('all') || allowedRoles.includes('Teacher')) {
          promises.push(userAPI.getUsers({ role: 'Teacher', limit: 1 }).then(res => ({ type: 'teachers', count: res.data?.pagination?.totalUsers || 0 })));
        }
        
        if (allowedRoles.includes('all')) {
          promises.push(userAPI.getUsers({ role: 'Receptionist', limit: 1 }).then(res => ({ type: 'receptionists', count: res.data?.pagination?.totalUsers || 0 })));
          promises.push(userAPI.getUsers({ role: 'InstituteAdmin', limit: 1 }).then(res => ({ type: 'admins', count: res.data?.pagination?.totalUsers || 0 })));
          promises.push(userAPI.getUsers({ role: 'IT', limit: 1 }).then(res => ({ type: 'it', count: res.data?.pagination?.totalUsers || 0 })));
          promises.push(userAPI.getUsers({ limit: 1 }).then(res => ({ type: 'total', count: res.data?.pagination?.totalUsers || 0 })));
        }

        const results = await Promise.all(promises);
        
        const newStats = {
          total: 0,
          students: 0,
          teachers: 0,
          staff: 0,
          admins: 0,
          receptionists: 0,
          it: 0
        };
        results.forEach(result => {
          newStats[result.type] = result.count;
        });
        
        // Calculate staff count (receptionists + admins + it)
        newStats.staff = newStats.receptionists + newStats.admins + newStats.it;
        
        setStatistics(newStats);
      } catch (error) {
        console.error('Failed to fetch user statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [allowedRoles]);

  // Define which statistics to show based on role and permissions
  const getVisibleStats = () => {
    const stats = [];

    // For Receptionist - only show student count
    if (userRole === 'Receptionist') {
      stats.push({
        title: 'Total Students',
        count: statistics.students,
        icon: GraduationCap,
        gradient: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700'
      });
      return stats;
    }

    // For IT and Institute Admin - show comprehensive stats
    if (allowedRoles.includes('all')) {
      stats.push(
        {
          title: 'Total Users',
          count: statistics.total,
          icon: Users,
          gradient: 'from-purple-500 to-purple-600',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-700'
        },
        {
          title: 'Students',
          count: statistics.students,
          icon: GraduationCap,
          gradient: 'from-blue-500 to-blue-600',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700'
        },
        {
          title: 'Teachers',
          count: statistics.teachers,
          icon: UserCheck,
          gradient: 'from-green-500 to-green-600',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700'
        },
        {
          title: 'Staff & Admins',
          count: statistics.staff,
          icon: Shield,
          gradient: 'from-orange-500 to-orange-600',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700'
        }
      );
    } else {
      // For roles with limited access - show only allowed role counts
      if (allowedRoles.includes('Student')) {
        stats.push({
          title: 'Students',
          count: statistics.students,
          icon: GraduationCap,
          gradient: 'from-blue-500 to-blue-600',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700'
        });
      }
      
      if (allowedRoles.includes('Teacher')) {
        stats.push({
          title: 'Teachers',
          count: statistics.teachers,
          icon: UserCheck,
          gradient: 'from-green-500 to-green-600',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700'
        });
      }
    }

    return stats;
  };

  const visibleStats = getVisibleStats();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-border/30 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-6">
      <h3 className="text-xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-3">
        <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
        User Statistics
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={index}
              className={`${stat.bgColor} rounded-2xl p-6 border ${stat.gradient.includes('purple') ? 'border-purple-200' : stat.gradient.includes('blue') ? 'border-blue-200' : stat.gradient.includes('green') ? 'border-green-200' : 'border-orange-200'} hover:shadow-lg transition-all duration-200`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-semibold ${stat.textColor}`}>{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>
                    {stat.count.toLocaleString()}
                  </p>
                </div>
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${stat.gradient} text-white shadow-lg`}>
                  <IconComponent className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserStatistics;
