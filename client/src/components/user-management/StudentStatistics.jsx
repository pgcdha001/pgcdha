import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, UserCheck, Clock, RefreshCw } from 'lucide-react';
import { userAPI } from '../../services/api';
import { Button } from '../ui/button';

/**
 * Student Statistics Component
 * Shows student-specific statistics like total registered, admitted, etc.
 */
const StudentStatistics = () => {
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    admittedStudents: 0,
    pendingStudents: 0,
    activeStudents: 0,
    loading: true
  });

  const loadStudentStatistics = async () => {
    try {
      setStatistics(prev => ({ ...prev, loading: true }));

      // Get all students
      const response = await userAPI.getUsers({
        role: 'Student'
      });

      if (response.success) {
        const students = response.data.users || [];
        
        // Calculate statistics
        const totalStudents = students.length;
        const admittedStudents = students.filter(student => 
          student.enquiryLevel === 5 || student.status === 'active'
        ).length;
        const pendingStudents = students.filter(student => 
          student.status === 'pending'
        ).length;
        const activeStudents = students.filter(student => 
          student.status === 'active'
        ).length;

        setStatistics({
          totalStudents,
          admittedStudents,
          pendingStudents,
          activeStudents,
          loading: false
        });
      } else {
        console.error('Failed to load student statistics:', response.message);
        setStatistics(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error loading student statistics:', error);
      setStatistics(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    loadStudentStatistics();
  }, []);

  const statCards = [
    {
      title: 'Total Registered',
      value: statistics.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Admitted Students',
      value: statistics.admittedStudents,
      icon: GraduationCap,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Active Students',
      value: statistics.activeStudents,
      icon: UserCheck,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Pending Approval',
      value: statistics.pendingStudents,
      icon: Clock,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  if (statistics.loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-700">Student Statistics</h3>
        <Button
          onClick={loadStudentStatistics}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={statistics.loading}
        >
          <RefreshCw className={`h-4 w-4 ${statistics.loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={stat.title}
              className={`${stat.bgColor} rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 hover:scale-105`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className={`text-3xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentStatistics;
