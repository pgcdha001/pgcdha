import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  UserCheck, 
  BookOpen,
  Clock,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MapPin,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp
} from 'lucide-react';
import { Button } from '../ui/button';
import PermissionGuard from '../PermissionGuard';
import api from '../../services/api';
import { PERMISSIONS } from '../../utils/rolePermissions';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/usePerformance';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);

  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  useEffect(() => {
    fetchAssignedClasses();
    fetchAttendanceStats();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchClassData();
    }
  }, [selectedClass, selectedDate]);

  const fetchAssignedClasses = async () => {
    setLoading(true);
    try {
      // Get classes where this teacher is assigned
      const response = await api.get(`/classes?teacherId=${user._id}`);
      const classes = response.data || [];
      setAssignedClasses(classes);
      
      if (classes.length > 0 && !selectedClass) {
        setSelectedClass(classes[0]._id);
      }
    } catch (error) {
      console.error('Error fetching assigned classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassData = async () => {
    setLoading(true);
    try {
      // Fetch students in the class
      const studentsResponse = await api.get(`/students/class/${selectedClass}`);
      setClassStudents(studentsResponse.data || []);

      // Fetch existing attendance for the date
      const attendanceResponse = await api.get(`/attendance/class/${selectedClass}/date/${selectedDate}`);
      const existingAttendance = attendanceResponse.data || [];
      
      // Convert to object for easier lookup
      const attendanceMap = {};
      existingAttendance.forEach(record => {
        attendanceMap[record.studentId] = record.status;
      });
      setStudentAttendance(attendanceMap);

    } catch (error) {
      console.error('Error fetching class data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const response = await api.get(`/attendance/teacher-stats/${user._id}`);
      setAttendanceStats(response.data);
      
      const recentResponse = await api.get(`/attendance/recent/${user._id}?limit=5`);
      setRecentAttendance(recentResponse.data || []);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const handleStudentAttendanceChange = (studentId, status) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const attendanceData = Object.entries(studentAttendance).map(([studentId, status]) => ({
        studentId,
        status,
        date: selectedDate,
        classId: selectedClass,
        markedBy: user._id
      }));

      await api.post('/attendance/mark-bulk', {
        attendanceRecords: attendanceData
      });

      // Refresh stats
      fetchAttendanceStats();
      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedClassInfo = () => {
    return assignedClasses.find(cls => cls._id === selectedClass);
  };

  const filteredStudents = classStudents.filter(student => {
    const fullName = `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.toLowerCase();
    const fatherName = (student.fatherName || '').toLowerCase();
    const rollNumber = (student.rollNumber || '').toLowerCase();
    const searchLower = debouncedSearchTerm.toLowerCase();
    
    return fullName.includes(searchLower) || 
           fatherName.includes(searchLower) || 
           rollNumber.includes(searchLower);
  });

  const getAttendanceStats = () => {
    const totalStudents = classStudents.length;
    const presentCount = Object.values(studentAttendance).filter(status => status === 'Present').length;
    const absentCount = Object.values(studentAttendance).filter(status => status === 'Absent').length;
    const lateCount = Object.values(studentAttendance).filter(status => status === 'Late').length;
    const unmarked = totalStudents - presentCount - absentCount - lateCount;

    return { totalStudents, presentCount, absentCount, lateCount, unmarked };
  };

  const markAllPresent = () => {
    const newAttendance = {};
    classStudents.forEach(student => {
      newAttendance[student._id] = 'Present';
    });
    setStudentAttendance(newAttendance);
  };

  const clearAllAttendance = () => {
    setStudentAttendance({});
  };

  if (loading && assignedClasses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const classInfo = getSelectedClassInfo();
  const currentStats = getAttendanceStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
          <p className="text-gray-600">Mark attendance and manage your classes</p>
          <div className="mt-2 text-sm text-gray-500">
            Welcome back, {user.fullName?.firstName} {user.fullName?.lastName}
          </div>
        </div>

        {assignedClasses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
            <p className="text-gray-500">You don't have any classes assigned to you yet.</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            {attendanceStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Classes</p>
                      <p className="text-2xl font-bold text-gray-900">{attendanceStats.totalClasses}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">{attendanceStats.totalStudents}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{attendanceStats.attendanceRate}%</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Days Active</p>
                      <p className="text-2xl font-bold text-gray-900">{attendanceStats.daysActive}</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Attendance Marking Section */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  {/* Controls */}
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Mark Attendance</h2>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                      {/* Class Selection */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Class
                        </label>
                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {assignedClasses.map(cls => (
                            <option key={cls._id} value={cls._id}>
                              {cls.name} - {cls.grade} {cls.program}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Date Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date
                        </label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Date Navigation */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const prevDate = new Date(selectedDate);
                            prevDate.setDate(prevDate.getDate() - 1);
                            setSelectedDate(prevDate.toISOString().split('T')[0]);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                          className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Today
                        </button>
                        <button
                          onClick={() => {
                            const nextDate = new Date(selectedDate);
                            nextDate.setDate(nextDate.getDate() + 1);
                            if (nextDate <= new Date()) {
                              setSelectedDate(nextDate.toISOString().split('T')[0]);
                            }
                          }}
                          disabled={new Date(selectedDate) >= new Date(new Date().toISOString().split('T')[0])}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Class Info */}
                    {classInfo && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            <span>{classInfo.grade} {classInfo.program}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{classInfo.campus} Campus - Floor {classInfo.floor}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{classStudents.length} Students</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Attendance Stats for Current Session */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{currentStats.totalStudents}</div>
                        <div className="text-xs text-gray-600">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{currentStats.presentCount}</div>
                        <div className="text-xs text-green-600">Present</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{currentStats.absentCount}</div>
                        <div className="text-xs text-red-600">Absent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">{currentStats.lateCount}</div>
                        <div className="text-xs text-yellow-600">Late</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">{currentStats.unmarked}</div>
                        <div className="text-xs text-orange-600">Unmarked</div>
                      </div>
                    </div>
                  </div>

                  {/* Students List */}
                  <div className="p-6">
                    {/* Search and Quick Actions */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={markAllPresent}
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:bg-green-50"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          All Present
                        </Button>
                        <Button
                          onClick={clearAllAttendance}
                          variant="outline"
                          size="sm"
                          className="text-gray-600 hover:bg-gray-50"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </div>

                    {/* Students Attendance List */}
                    <div className="space-y-2 mb-6">
                      {filteredStudents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No students found</p>
                        </div>
                      ) : (
                        filteredStudents.map((student) => (
                          <div key={student._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-blue-600">
                                    {student.rollNumber || '?'}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {`${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.trim()}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Father: {student.fatherName || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-1">
                              {['Present', 'Absent', 'Late'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStudentAttendanceChange(student._id, status)}
                                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                    studentAttendance[student._id] === status
                                      ? status === 'Present'
                                        ? 'bg-green-600 text-white'
                                        : status === 'Absent'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-yellow-600 text-white'
                                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {status.charAt(0)}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Save Button */}
                    <PermissionGuard permission={PERMISSIONS.ATTENDANCE.MARK_STUDENT_ATTENDANCE}>
                      <div className="flex justify-end">
                        <Button
                          onClick={saveAttendance}
                          disabled={saving || Object.keys(studentAttendance).length === 0}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? 'Saving...' : 'Save Attendance'}
                        </Button>
                      </div>
                    </PermissionGuard>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </h3>
                  
                  {recentAttendance.length === 0 ? (
                    <p className="text-gray-500 text-sm">No recent activity</p>
                  ) : (
                    <div className="space-y-3">
                      {recentAttendance.map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.className}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(record.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">
                            {record.totalMarked} students
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {/* TODO: Export attendance */}}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Attendance
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {/* TODO: View reports */}}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Reports
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {/* TODO: Class details */}}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Class Details
                    </Button>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Tips
                  </h3>
                  
                  <div className="space-y-2 text-sm text-blue-700">
                    <p>• Use keyboard shortcuts: P (Present), A (Absent), L (Late)</p>
                    <p>• Mark attendance daily for accurate records</p>
                    <p>• Use search to quickly find students</p>
                    <p>• Export reports for parent meetings</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
