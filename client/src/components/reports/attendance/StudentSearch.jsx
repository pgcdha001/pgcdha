import React, { useState, useCallback } from 'react';
import { Search, User, Calendar, TrendingUp, X, Clock } from 'lucide-react';
import { Button } from '../../ui/button';
import api from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

/**
 * Student Search Component
 * Allows searching for a specific student and viewing their attendance stats
 * Reusable across Principal dashboard and detailed attendance modules
 */
const StudentSearch = ({ onClose = null, className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const { addToast } = useToast();

  // Search for students
  const searchStudents = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await api.get(`/users/search?q=${encodeURIComponent(term)}&role=Student`);
      
      if (response.data && response.data.success) {
        setSearchResults(response.data.data || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching students:', error);
      addToast?.({ 
        type: 'error', 
        message: 'Failed to search students' 
      });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [addToast]);

  // Get student attendance statistics
  const getStudentAttendance = useCallback(async (studentId) => {
    try {
      setLoading(true);
      const response = await api.get(`/attendance/student/${studentId}`);
      
      if (response.data && response.data.success) {
        setStudentStats(response.data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      addToast?.({ 
        type: 'error', 
        message: 'Failed to load student attendance data' 
      });
      setStudentStats(null);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchStudents(value);
  };

  // Handle student selection
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setSearchTerm(student.fullName?.firstName + ' ' + student.fullName?.lastName || student.userName);
    setSearchResults([]);
    getStudentAttendance(student._id);
  };

  // Reset search
  const handleReset = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedStudent(null);
    setStudentStats(null);
  };

  // Format attendance percentage
  const formatPercentage = (percentage) => {
    if (typeof percentage !== 'number') return '0.0';
    return percentage.toFixed(1);
  };

  // Get attendance status color
  const getStatusColor = (percentage) => {
    if (percentage >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Search className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Student Attendance Search</h3>
              <p className="text-sm text-gray-600">Search for a student to view their attendance statistics</p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-6">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search student by name or username..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          {searching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((student) => (
              <button
                key={student._id}
                type="button"
                onClick={() => handleStudentSelect(student)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {student.fullName?.firstName} {student.fullName?.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{student.userName}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected Student Stats */}
        {selectedStudent && (
          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-gray-600">Loading attendance data...</span>
              </div>
            ) : studentStats ? (
              <div className="space-y-6">
                {/* Student Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {selectedStudent.fullName?.firstName} {selectedStudent.fullName?.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">{selectedStudent.userName}</p>
                  </div>
                </div>

                {/* Attendance Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">{studentStats.totalDays || 0}</div>
                    <div className="text-sm text-blue-700">Total Days</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">{studentStats.presentDays || 0}</div>
                    <div className="text-sm text-green-700">Present Days</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="text-2xl font-bold text-red-600">{studentStats.absentDays || 0}</div>
                    <div className="text-sm text-red-700">Absent Days</div>
                  </div>
                </div>

                {/* Attendance Percentage */}
                <div className={`p-4 border-2 rounded-xl ${getStatusColor(studentStats.attendancePercentage || 0)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-6 w-6" />
                      <div>
                        <div className="font-semibold">Attendance Rate</div>
                        <div className="text-sm opacity-75">Overall performance</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {formatPercentage(studentStats.attendancePercentage || 0)}%
                    </div>
                  </div>
                </div>

                {/* Absent Days List */}
                {studentStats.absentDays > 0 && studentStats.absentRecords && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Absent Days ({studentStats.absentDays})
                    </h5>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {studentStats.absentRecords.map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-red-600" />
                            <div>
                              <div className="font-medium text-red-900">
                                {new Date(record.date).toLocaleDateString()}
                              </div>
                              {record.remarks && (
                                <div className="text-sm text-red-700">{record.remarks}</div>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                            {record.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reset Button */}
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={handleReset}
                    variant="outline"
                    className="w-full"
                  >
                    Search Another Student
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No attendance data found for this student</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSearch;
