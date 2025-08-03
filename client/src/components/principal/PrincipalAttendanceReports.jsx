import React, { useState, useEffect } from 'react';
import { useApiWithToast } from '../../hooks/useApiWithToast';
import { Calendar, Users, UserCheck, UserX, Clock, TrendingUp, Building } from 'lucide-react';
import { Button } from '../ui/button';
import Card from '../ui/card';
import api from '../../services/api';

/**
 * Principal Attendance Reports Component
 * Shows simple attendance statistics and numbers without graphs
 * Similar to enquiry and correspondence reports - focuses on numbers only
 */
const PrincipalAttendanceReports = () => {
  const { handleApiResponse } = useApiWithToast();
  
  // State management
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);

  // Floor mapping
  const floorNames = {
    1: '11th Boys',
    2: '12th Boys', 
    3: '11th Girls',
    4: '12th Girls'
  };

  // Helper function to safely render teacher name
  const getTeacherName = (teacher) => {
    if (typeof teacher.teacherName === 'string') {
      return teacher.teacherName;
    }
    if (teacher.teacherName && typeof teacher.teacherName === 'object') {
      const { firstName, lastName } = teacher.teacherName;
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    if (teacher.fullName) {
      if (typeof teacher.fullName === 'string') {
        return teacher.fullName;
      }
      if (typeof teacher.fullName === 'object') {
        const { firstName, lastName } = teacher.fullName;
        return `${firstName || ''} ${lastName || ''}`.trim();
      }
    }
    return 'Unknown Teacher';
  };

  // Load attendance data
  const loadAttendanceData = async (date) => {
    try {
      setLoading(true);
      
      // Get daily attendance report
      const dailyResponse = await handleApiResponse(
        async () => api.get(`/teacher-attendance/report/daily/${date}`)
      );

      // Get current month data
      const currentDate = new Date(date);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const monthlyResponse = await handleApiResponse(
        async () => api.get(`/teacher-attendance/report/monthly/${year}/${month}`)
      );

      setAttendanceData(dailyResponse.data);
      setMonthlyData(monthlyResponse.data.report);
      
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and date change
  useEffect(() => {
    loadAttendanceData(selectedDate);
  }, [selectedDate]);

  // Calculate overall statistics
  const getOverallStats = () => {
    if (!attendanceData?.overallSummary) {
      return { total: 0, onTime: 0, late: 0, absent: 0, punctuality: 0 };
    }

    const { total, onTime, late, absent, cancelled } = attendanceData.overallSummary;
    const punctuality = total > 0 ? Math.round((onTime / total) * 100) : 0;

    return {
      total: total || 0,
      onTime: onTime || 0,
      late: late || 0,
      absent: absent || 0,
      cancelled: cancelled || 0,
      punctuality
    };
  };

  const stats = getOverallStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Attendance Reports
              </h1>
              <p className="text-gray-600">
                View daily and monthly attendance statistics for all teachers
              </p>
            </div>
            
            {/* Date Selector */}
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={() => loadAttendanceData(selectedDate)}
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>

        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
          <Card className="p-6 bg-white/70 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Lectures</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/70 backdrop-blur-sm border-green-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">On Time</p>
                <p className="text-2xl font-bold text-green-600">{stats.onTime}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/70 backdrop-blur-sm border-yellow-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/70 backdrop-blur-sm border-red-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/70 backdrop-blur-sm border-purple-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Punctuality</p>
                <p className="text-2xl font-bold text-purple-600">{stats.punctuality}%</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/70 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 rounded-full">
                <UserX className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Floor-wise Breakdown */}
        {attendanceData?.floorSummaries && (
          <Card className="p-6 mb-8 bg-white/70 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Floor-wise Attendance Summary
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(attendanceData.floorSummaries).map(([floor, summary]) => (
                <div key={floor} className="p-4 border border-gray-200 rounded-lg bg-white/50">
                  <h3 className="font-semibold text-lg mb-3 text-gray-800">
                    Floor {floor} - {floorNames[floor]}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="font-medium">{summary.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-600">On Time:</span>
                      <span className="font-medium text-green-600">{summary.onTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-yellow-600">Late:</span>
                      <span className="font-medium text-yellow-600">{summary.late}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-red-600">Absent:</span>
                      <span className="font-medium text-red-600">{summary.absent}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm text-purple-600">Punctuality:</span>
                      <span className="font-medium text-purple-600">
                        {summary.total > 0 ? Math.round((summary.onTime / summary.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Monthly Statistics */}
        {monthlyData && (
          <Card className="p-6 bg-white/70 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Overview - {monthlyData.monthName} {monthlyData.year}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                <h3 className="font-medium text-blue-800 mb-2">Total Teachers</h3>
                <p className="text-2xl font-bold text-blue-600">{monthlyData.summary?.totalTeachers || 0}</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg bg-green-50">
                <h3 className="font-medium text-green-800 mb-2">Total Lectures</h3>
                <p className="text-2xl font-bold text-green-600">{monthlyData.summary?.totalLectures || 0}</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg bg-purple-50">
                <h3 className="font-medium text-purple-800 mb-2">Overall Punctuality</h3>
                <p className="text-2xl font-bold text-purple-600">{monthlyData.summary?.overallPunctuality || 0}%</p>
              </div>
            </div>

            {/* Teachers List */}
            {monthlyData.teachers && monthlyData.teachers.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-800 mb-4">Teacher Performance Summary</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {monthlyData.teachers.map((teacher, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg bg-white/50 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{getTeacherName(teacher)}</p>
                        <p className="text-sm text-gray-600">Total Lectures: {teacher.totalLectures}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-purple-600">{teacher.punctualityPercentage}%</p>
                        <p className="text-xs text-gray-500">Punctuality</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading attendance data...</p>
          </div>
        )}

        {/* No Data State */}
        {!loading && !attendanceData && (
          <Card className="p-8 text-center bg-white/70 backdrop-blur-sm">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Data</h3>
            <p className="text-gray-600">No attendance records found for the selected date.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PrincipalAttendanceReports;
