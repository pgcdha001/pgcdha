import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Calendar,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  MessageSquare,
  Save,
  BookOpen,
  School,
  AlertTriangle,
  Filter,
  Download
} from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import { useApiWithToast } from '../../hooks/useApiWithToast';
import api from '../../services/api';

const TeacherAttendanceManagement = () => {
  const { user } = useAuth();
    const { handleApiResponse, toast } = useApiWithToast();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [teachers, setTeachers] = useState([]);
  const [expandedTeacher, setExpandedTeacher] = useState(null);
  const [teacherLectures, setTeacherLectures] = useState({});
  const [attendanceData, setAttendanceData] = useState({});
  const [remarkData, setRemarkData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState({});
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [currentRemark, setCurrentRemark] = useState({ lectureId: '', text: '' });

  // Floor mapping for coordinator
  const floorNames = {
    1: '11th Boys',
    2: '12th Boys', 
    3: '11th Girls',
    4: '12th Girls'
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadTeacherAttendanceData();
    }
  }, [selectedDate]);

  // Handle escape key for modal
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && showRemarkModal) {
        setShowRemarkModal(false);
      }
    };

    if (showRemarkModal) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [showRemarkModal]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const response = await handleApiResponse(
        async () => api.get('/users?role=Teacher'),
        {
          successMessage: 'Teachers loaded successfully'
        }
      );
      
      console.log('Teachers API response:', response);
      console.log('Response data structure:', response.data);
      
      // Handle different response structures
      let teachersData = [];
      if (response.data?.data?.users) {
        teachersData = response.data.data.users;
      } else if (response.data?.users) {
        teachersData = response.data.users;
      } else if (Array.isArray(response.data?.data)) {
        teachersData = response.data.data;
      } else if (Array.isArray(response.data)) {
        teachersData = response.data;
      }
      
      const teachersArray = Array.isArray(teachersData) ? teachersData : [];
      
      console.log('Teachers data extracted:', teachersData);
      console.log('Setting teachers to:', teachersArray);
      setTeachers(teachersArray);
    } catch (error) {
      console.error('Error loading teachers:', error);
      setTeachers([]); // Ensure teachers is always an array
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherLectures = async (teacherId) => {
    try {
      // Get timetable for this teacher on the selected date
      const response = await handleApiResponse(
        async () => api.get(`/timetable/teacher/${teacherId}/date/${selectedDate}`)
      );
      
      console.log('Timetable API response:', response);
      console.log('Response data structure:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Is response.data an array?', Array.isArray(response.data));
      console.log('Response.data.data:', response.data?.data);
      console.log('Is response.data.data an array?', Array.isArray(response.data?.data));
      
      // Handle the timetable API response structure
      let lectures = [];
      
      // The timetable API returns: { success: true, data: lecturesArray, teacher: {...}, date: "...", dayOfWeek: "..." }
      // So lectures should be in response.data.data
      if (response.data?.data && Array.isArray(response.data.data)) {
        lectures = response.data.data;
        console.log('✅ Using nested data response (correct structure)');
      } else if (Array.isArray(response.data)) {
        // Fallback: direct array response
        lectures = response.data;
        console.log('⚠️ Using direct array response (fallback)');
      } else if (response.data && typeof response.data === 'object') {
        console.log('❌ Unexpected timetable response structure:', response.data);
        // Try to find lectures in various possible locations
        if (response.data.lectures && Array.isArray(response.data.lectures)) {
          lectures = response.data.lectures;
          console.log('Found lectures in response.data.lectures');
        } else if (response.data.timetable && Array.isArray(response.data.timetable)) {
          lectures = response.data.timetable;
          console.log('Found lectures in response.data.timetable');
        } else {
          console.log('No lectures array found in response');
          lectures = [];
        }
      } else {
        console.log('❌ Invalid response structure');
        lectures = [];
      }
      
      console.log('Processed lectures data:', lectures);
      console.log('Lectures count:', lectures.length);
      console.log('Is lectures an array?', Array.isArray(lectures));
      
      // Safety check before grouping
      if (!Array.isArray(lectures)) {
        console.error('❌ Lectures is not an array:', lectures);
        setTeacherLectures(prev => ({
          ...prev,
          [teacherId]: {}
        }));
        return;
      }
      
      // Group lectures by class
      const groupedLectures = lectures.reduce((acc, lecture) => {
        const classKey = lecture.classId?._id || 'unknown';
        const className = lecture.classId?.name || 'Unknown Class';
        
        if (!acc[classKey]) {
          acc[classKey] = {
            className,
            classInfo: lecture.classId,
            lectures: []
          };
        }
        
        acc[classKey].lectures.push(lecture);
        return acc;
      }, {});

      setTeacherLectures(prev => ({
        ...prev,
        [teacherId]: groupedLectures
      }));
    } catch (error) {
      console.error('Error loading teacher lectures:', error);
    }
  };

  const loadTeacherAttendanceData = async () => {
    try {
      const response = await handleApiResponse(
        async () => api.get(`/teacher-attendance/date/${selectedDate}`)
      );
      const attendanceMap = {};
      const remarksMap = {};
      
      // Handle different response structures
      let attendanceRecords = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        attendanceRecords = response.data.data;
      } else if (Array.isArray(response.data)) {
        attendanceRecords = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // If response.data is an object but not an array, it might be empty or have a different structure
        console.log('Unexpected response structure:', response.data);
        attendanceRecords = [];
      }
      
      attendanceRecords.forEach(record => {
        const key = `${record.teacherId?._id || record.teacherId}_${record.timetableId?._id || record.timetableId}`;
        attendanceMap[key] = record.status;
        if (record.coordinatorRemarks) {
          remarksMap[key] = record.coordinatorRemarks;
        }
      });
      
      setAttendanceData(attendanceMap);
      setRemarkData(remarksMap);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  const handleTeacherClick = async (teacherId) => {
    console.log('Teacher clicked:', teacherId);
    console.log('Selected date:', selectedDate);
    
    if (expandedTeacher === teacherId) {
      setExpandedTeacher(null);
    } else {
      setExpandedTeacher(teacherId);
      if (!teacherLectures[teacherId]) {
        console.log('Loading lectures for teacher:', teacherId);
        await loadTeacherLectures(teacherId);
      } else {
        console.log('Using cached lectures for teacher:', teacherId);
      }
    }
  };

  const handleAttendanceChange = async (teacherId, lectureId, status) => {
    const key = `${teacherId}_${lectureId}`;
    
    // Set saving state for this specific lecture
    setSavingAttendance(prev => ({ ...prev, [key]: true }));
    
    // Update local state immediately for UI responsiveness
    setAttendanceData(prev => ({
      ...prev,
      [key]: status
    }));

    // Auto-save to database immediately
    try {
      const attendanceRecord = {
        teacherId,
        timetableId: lectureId,
        status,
        coordinatorRemarks: remarkData[key] || '',
        date: selectedDate
      };

      console.log('Auto-saving attendance:', attendanceRecord);

      await handleApiResponse(
        async () => api.post('/teacher-attendance/coordinator/mark', {
          attendanceRecords: [attendanceRecord]
        }),
        {
          successMessage: `Attendance marked as ${status}`,
          errorMessage: 'Failed to save attendance'
        }
      );

      console.log(`✅ Auto-saved attendance: ${status} for lecture ${lectureId}`);
    } catch (error) {
      console.error('❌ Failed to auto-save attendance:', error);
      // Revert local state on error
      setAttendanceData(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
      
      // Show error feedback
      toast.error('Failed to save attendance. Please try again.');
    } finally {
      // Clear saving state
      setSavingAttendance(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  };

  const openRemarkModal = (teacherId, lectureId) => {
    const key = `${teacherId}_${lectureId}`;
    setCurrentRemark({
      lectureId: key,
      text: remarkData[key] || ''
    });
    setShowRemarkModal(true);
  };

  const saveRemark = async () => {
    try {
      // Update local state
      setRemarkData(prev => ({
        ...prev,
        [currentRemark.lectureId]: currentRemark.text
      }));

      // Save remark to database (create attendance record if doesn't exist)
      const [teacherId, lectureId] = currentRemark.lectureId.split('_');
      const existingStatus = attendanceData[currentRemark.lectureId] || 'On Time'; // Default to On Time if no status set
      
      const attendanceRecord = {
        teacherId,
        timetableId: lectureId,
        status: existingStatus,
        coordinatorRemarks: currentRemark.text,
        date: selectedDate
      };

      console.log('Saving remark with attendance:', attendanceRecord);

      await handleApiResponse(
        async () => api.post('/teacher-attendance/coordinator/mark', {
          attendanceRecords: [attendanceRecord]
        }),
        {
          successMessage: 'Remark saved successfully',
          errorMessage: 'Failed to save remark'
        }
      );

      // Update attendance data if it wasn't set before
      if (!attendanceData[currentRemark.lectureId]) {
        setAttendanceData(prev => ({
          ...prev,
          [currentRemark.lectureId]: existingStatus
        }));
      }

      // Close modal and reset
      setShowRemarkModal(false);
      setCurrentRemark({ lectureId: '', text: '' });
    } catch (error) {
      console.error('Failed to save remark:', error);
      // Revert local state on error
      setRemarkData(prev => {
        const newState = { ...prev };
        delete newState[currentRemark.lectureId];
        return newState;
      });
    }
  };

  // Handle keyboard shortcuts for modal
  const handleModalKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowRemarkModal(false);
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      saveRemark();
    }
  };

  const syncAllAttendance = async () => {
    try {
      setSaving(true);
      
      // Get all unsaved attendance records (this is now mainly for backup/sync)
      const attendanceRecords = [];
      
      Object.entries(attendanceData).forEach(([key, status]) => {
        const [teacherId, lectureId] = key.split('_');
        attendanceRecords.push({
          teacherId,
          timetableId: lectureId,
          status,
          coordinatorRemarks: remarkData[key] || '',
          date: selectedDate
        });
      });

      if (attendanceRecords.length === 0) {
        toast.info('No attendance data to sync');
        return;
      }

      console.log('Syncing all attendance records:', attendanceRecords);

      await handleApiResponse(
        async () => api.post('/teacher-attendance/coordinator/mark', {
          attendanceRecords
        }),
        {
          successMessage: `Synced ${attendanceRecords.length} attendance records`,
          errorMessage: 'Failed to sync attendance data'
        }
      );

      // Refresh data to ensure consistency
      await loadTeacherAttendanceData();
    } catch (error) {
      console.error('Error syncing attendance:', error);
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceStats = () => {
    const total = Object.keys(attendanceData).length;
    const present = Object.values(attendanceData).filter(status => status === 'On Time').length;
    const late = Object.values(attendanceData).filter(status => status === 'Late').length;
    const absent = Object.values(attendanceData).filter(status => status === 'Absent').length;
    
    return { total, present, late, absent };
  };

  const stats = getAttendanceStats();

  if (loading && teachers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-500 rounded-lg">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Teacher Attendance Management</h1>
                <p className="text-sm text-gray-600">Mark teacher attendance and add remarks</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={syncAllAttendance}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Syncing...' : 'Sync All Data'}
              </Button>
              <Button
                onClick={() => loadTeacherAttendanceData()}
                disabled={loading}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Total Lectures</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Present</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-1">{stats.present}</p>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Late</span>
            </div>
            <p className="text-2xl font-bold text-orange-900 mt-1">{stats.late}</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-900">Absent</span>
            </div>
            <p className="text-2xl font-bold text-red-900 mt-1">{stats.absent}</p>
          </div>
        </div>

        {/* Teacher List */}
        <div className="space-y-4">
          {Array.isArray(teachers) && teachers.map((teacher) => {
            const teacherId = teacher._id;
            const isExpanded = expandedTeacher === teacherId;
            const teacherClasses = teacherLectures[teacherId] || {};
            
            return (
              <div key={teacherId} className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Teacher Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleTeacherClick(teacherId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {`${teacher.fullName?.firstName || ''} ${teacher.fullName?.lastName || ''}`.trim() || teacher.name || teacher.email}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {teacher.userName} • {teacher.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {Object.keys(teacherClasses).length} Classes
                        </p>
                        <p className="text-xs text-gray-600">
                          {Object.values(teacherClasses).reduce((total, classData) => total + classData.lectures.length, 0)} Lectures
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Teacher Classes and Lectures */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    {Object.keys(teacherClasses).length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p>No lectures scheduled for selected date</p>
                      </div>
                    ) : (
                      <div className="p-6 space-y-6">
                        {Object.entries(teacherClasses).map(([classId, classData]) => (
                          <div key={classId} className="border border-gray-200 rounded-lg p-4">
                            {/* Class Header */}
                            <div className="flex items-center gap-3 mb-4">
                              <School className="h-5 w-5 text-blue-600" />
                              <div>
                                <h4 className="font-medium text-gray-900">{classData.className}</h4>
                                <p className="text-sm text-gray-600">
                                  {classData.classInfo?.grade} {classData.classInfo?.program} • 
                                  Floor {classData.classInfo?.floor} ({floorNames[classData.classInfo?.floor]})
                                </p>
                              </div>
                            </div>

                            {/* Lectures */}
                            <div className="space-y-3">
                              {classData.lectures.map((lecture) => {
                                const lectureKey = `${teacherId}_${lecture._id}`;
                                const currentStatus = attendanceData[lectureKey];
                                const hasRemark = remarkData[lectureKey];
                                
                                return (
                                  <div key={lecture._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3">
                                        <div>
                                          <p className="font-medium text-gray-900">{lecture.subject}</p>
                                          <p className="text-sm text-gray-600">
                                            {lecture.startTime} - {lecture.endTime} • {lecture.lectureType}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      {/* Attendance Checkboxes */}
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleAttendanceChange(teacherId, lecture._id, 'On Time')}
                                          disabled={savingAttendance[lectureKey]}
                                          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                                            currentStatus === 'On Time'
                                              ? 'bg-green-600 text-white'
                                              : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                                          }`}
                                        >
                                          {savingAttendance[lectureKey] && currentStatus === 'On Time' ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                          ) : (
                                            <CheckCircle className="h-4 w-4" />
                                          )}
                                          Present
                                        </button>
                                        
                                        <button
                                          onClick={() => handleAttendanceChange(teacherId, lecture._id, 'Late')}
                                          disabled={savingAttendance[lectureKey]}
                                          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                                            currentStatus === 'Late'
                                              ? 'bg-orange-600 text-white'
                                              : 'bg-gray-200 text-gray-700 hover:bg-orange-100'
                                          }`}
                                        >
                                          {savingAttendance[lectureKey] && currentStatus === 'Late' ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                          ) : (
                                            <Clock className="h-4 w-4" />
                                          )}
                                          Late
                                        </button>
                                        
                                        <button
                                          onClick={() => handleAttendanceChange(teacherId, lecture._id, 'Absent')}
                                          disabled={savingAttendance[lectureKey]}
                                          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                                            currentStatus === 'Absent'
                                              ? 'bg-red-600 text-white'
                                              : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                                          }`}
                                        >
                                          {savingAttendance[lectureKey] && currentStatus === 'Absent' ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                          ) : (
                                            <XCircle className="h-4 w-4" />
                                          )}
                                          Absent
                                        </button>
                                      </div>

                                      {/* Remark Button */}
                                      <button
                                        onClick={() => openRemarkModal(teacherId, lecture._id)}
                                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                          hasRemark
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
                                        }`}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                        Remark
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {teachers.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Teachers Found</h3>
            <p className="text-gray-500">No teachers are available in the system.</p>
          </div>
        )}
      </div>

      {/* Remark Modal */}
      {showRemarkModal && (
        <div 
          className="fixed inset-0 z-[9999] overflow-y-auto"
          style={{ zIndex: 9999 }}
        >
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowRemarkModal(false)}
            aria-hidden="true"
          />
          
          {/* Modal Container */}
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Modal Content */}
            <div 
              className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Add Coordinator Remark
                  </h3>
                </div>
                <button
                  onClick={() => setShowRemarkModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                <textarea
                  value={currentRemark.text}
                  onChange={(e) => setCurrentRemark(prev => ({ ...prev, text: e.target.value }))}
                  onKeyDown={handleModalKeyDown}
                  placeholder="Enter your remark about this lecture..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  maxLength={500}
                  autoFocus
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    {currentRemark.text.length}/500 characters
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowRemarkModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveRemark}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Save Remark
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendanceManagement;
