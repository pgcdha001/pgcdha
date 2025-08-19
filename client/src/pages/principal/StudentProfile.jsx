import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, Phone, GraduationCap, Eye, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import StudentDetailsModal from '../../components/student-profile/StudentDetailsModal';

const StudentProfile = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    campus: 'all',
    program: 'all',
    grade: 'all',
    class: 'all'
  });

  // Available filter options
  const [filterOptions, setFilterOptions] = useState({
    campuses: [],
    programs: [],
    grades: [],
    classes: []
  });

  // Safe toast hook usage
  let showToast;
  try {
    const toastContext = useToast();
    showToast = toastContext.showToast;
  } catch (error) {
    console.warn('ToastContext not available:', error);
    showToast = (message, type) => {
      console.log(`Toast (${type}):`, message);
      if (type === 'error') {
        alert(message);
      }
    };
  }

  // Fetch students with class assignments
  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Try multiple approaches to get students
      let response;
      try {
        // First try with a shorter timeout and smaller limit
        response = await api.get('/users', {
          params: {
            role: 'Student',
            limit: 500, // Reduced limit
            sortBy: 'fullName.firstName',
            sortOrder: 'asc'
          },
          timeout: 15000 // 15 second timeout instead of 30
        });
      } catch (timeoutError) {
        console.log('First attempt timed out, trying with basic params...');
        // Fallback with minimal params
        response = await api.get('/users', {
          params: {
            role: 'Student'
          },
          timeout: 10000 // 10 second timeout
        });
      }

      if (response?.data?.success) {
        // Filter only students with class assignments
        const allStudents = response.data.data || [];
        
        console.log('Students data structure:', {
          isArray: Array.isArray(allStudents),
          type: typeof allStudents,
          sample: allStudents[0],
          length: allStudents.length
        });
        
        // Ensure allStudents is an array
        let studentsArray = [];
        if (Array.isArray(allStudents)) {
          studentsArray = allStudents;
        } else if (allStudents && typeof allStudents === 'object') {
          // Handle different response structures
          if (allStudents.users && Array.isArray(allStudents.users)) {
            studentsArray = allStudents.users;
          } else if (allStudents.students && Array.isArray(allStudents.students)) {
            studentsArray = allStudents.students;
          } else if (allStudents.data && Array.isArray(allStudents.data)) {
            studentsArray = allStudents.data;
          } else {
            console.warn('Unexpected data structure:', allStudents);
            studentsArray = [];
          }
        }
        
        const studentsWithClasses = studentsArray.filter(student => 
          student && student.classId && 
          (student.prospectusStage === 5 || student.enquiryLevel === 5)
        );
        
        setStudents(studentsWithClasses);
        setFilteredStudents(studentsWithClasses);
        
        // Extract filter options
        extractFilterOptions(studentsWithClasses);
      } else {
        console.warn('API response indicates failure or unexpected structure:', response.data);
        setStudents([]);
        setFilteredStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      
      // Better error handling - check if showToast is available
      try {
        if (showToast && typeof showToast === 'function') {
          showToast('Failed to load students. Please check your connection and try again.', 'error');
        } else {
          console.log('Toast function not available, showing alert instead');
          // Fallback to alert if toast is not available
          alert('Failed to load students. Please refresh the page and try again.');
        }
      } catch (toastError) {
        console.error('Error showing notification:', toastError);
        alert('Failed to load students. Please refresh the page and try again.');
      }
      
      // Set empty state gracefully
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique filter options from students data
  const extractFilterOptions = (studentsData) => {
    const campuses = [...new Set(studentsData.map(s => s.campus).filter(Boolean))];
    const programs = [...new Set(studentsData.map(s => s.program || s.admissionInfo?.program).filter(Boolean))];
    const grades = [...new Set(studentsData.map(s => s.admissionInfo?.grade).filter(Boolean))];
    
    // For classes, we'll need to fetch class data
    fetchClassOptions();
    
    setFilterOptions({
      campuses: campuses.sort(),
      programs: programs.sort(),
      grades: grades.sort(),
      classes: [] // Will be populated by fetchClassOptions
    });
  };

  // Fetch class options
  const fetchClassOptions = async () => {
    try {
      const response = await api.get('/classes', {
        timeout: 10000 // 10 second timeout
      });
      if (response?.data?.success) {
        const classes = response.data.data.map(cls => ({
          id: cls._id,
          name: cls.name,
          campus: cls.campus,
          program: cls.program,
          grade: cls.grade
        }));
        
        setFilterOptions(prev => ({
          ...prev,
          classes: classes.sort((a, b) => a.name.localeCompare(b.name))
        }));
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      // Don't show error for classes as it's not critical
      setFilterOptions(prev => ({
        ...prev,
        classes: []
      }));
    }
  };

  // Apply filters and search
  useEffect(() => {
    let filtered = [...students];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(student => {
        const fullName = `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.toLowerCase();
        const phone = student.phoneNumber?.toLowerCase() || '';
        const email = student.email?.toLowerCase() || '';
        
        return fullName.includes(searchLower) || 
               phone.includes(searchLower) || 
               email.includes(searchLower);
      });
    }

    // Apply campus filter
    if (filters.campus !== 'all') {
      filtered = filtered.filter(student => student.campus === filters.campus);
    }

    // Apply program filter
    if (filters.program !== 'all') {
      filtered = filtered.filter(student => 
        (student.program || student.admissionInfo?.program) === filters.program
      );
    }

    // Apply grade filter
    if (filters.grade !== 'all') {
      filtered = filtered.filter(student => student.admissionInfo?.grade === filters.grade);
    }

    // Apply class filter
    if (filters.class !== 'all') {
      filtered = filtered.filter(student => student.classId === filters.class);
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, filters]);

  useEffect(() => {
    fetchStudents();
  }, []);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      campus: 'all',
      program: 'all',
      grade: 'all',
      class: 'all'
    });
    setSearchTerm('');
  };

  // Open student details modal
  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  // Close student details modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedStudent(null);
  };

  // Get class name for student
  const getClassName = (classId) => {
    const classInfo = filterOptions.classes.find(cls => cls.id === classId);
    return classInfo?.name || 'Unknown Class';
  };

  if (loading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Profiles</h1>
              <p className="text-gray-600">Comprehensive view of all admitted students with class assignments</p>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{filteredStudents.length}</div>
              <div className="text-sm text-gray-600">Students Found</div>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-green-600">{students.length}</div>
              <div className="text-sm text-gray-600">Total with Classes</div>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-purple-600">
                {[...new Set(students.map(s => s.campus))].length}
              </div>
              <div className="text-sm text-gray-600">Campuses</div>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-orange-600">
                {filterOptions.classes.length}
              </div>
              <div className="text-sm text-gray-600">Active Classes</div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg border p-6 mb-6">
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, phone number, or email..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {(searchTerm || Object.values(filters).some(f => f !== 'all')) && (
                <Button onClick={clearFilters} variant="outline">
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Campus Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Campus</label>
                  <select
                    value={filters.campus}
                    onChange={(e) => handleFilterChange('campus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Campuses</option>
                    {filterOptions.campuses.map(campus => (
                      <option key={campus} value={campus}>{campus}</option>
                    ))}
                  </select>
                </div>

                {/* Program Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
                  <select
                    value={filters.program}
                    onChange={(e) => handleFilterChange('program', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Programs</option>
                    {filterOptions.programs.map(program => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>

                {/* Grade Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                  <select
                    value={filters.grade}
                    onChange={(e) => handleFilterChange('grade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Grades</option>
                    {filterOptions.grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                {/* Class Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                  <select
                    value={filters.class}
                    onChange={(e) => handleFilterChange('class', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Classes</option>
                    {filterOptions.classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} - {cls.campus} ({cls.program})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filters Display */}
              {Object.entries(filters).some(([key, value]) => value !== 'all') && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                    {Object.entries(filters).map(([key, value]) => {
                      if (value === 'all') return null;
                      let displayValue = value;
                      if (key === 'class') {
                        const classInfo = filterOptions.classes.find(cls => cls.id === value);
                        displayValue = classInfo?.name || value;
                      }
                      return (
                        <span
                          key={key}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          {key}: {displayValue}
                          <button
                            onClick={() => handleFilterChange(key, 'all')}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Students Grid */}
        <div className="space-y-4">
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600">
                {searchTerm || Object.values(filters).some(f => f !== 'all')
                  ? 'Try adjusting your search criteria or filters'
                  : 'No students with class assignments found'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredStudents.map((student) => (
                <StudentRecord
                  key={student._id}
                  student={student}
                  className={getClassName(student.classId)}
                  onViewDetails={() => handleViewStudent(student)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Student Details Modal */}
        <StudentDetailsModal
          isOpen={showDetailsModal}
          onClose={closeDetailsModal}
          student={selectedStudent}
          className={selectedStudent ? getClassName(selectedStudent.classId) : ''}
        />
      </div>
    </div>
  );
};

// Student Record Component
const StudentRecord = ({ student, className, onViewDetails }) => {
  const initials = `${student.fullName?.firstName?.[0] || ''}${student.fullName?.lastName?.[0] || ''}`;
  
  return (
    <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Avatar */}
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-medium text-sm">{initials}</span>
          </div>
          
          {/* Student Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 truncate">
                  {student.fullName?.firstName} {student.fullName?.lastName}
                </h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span>{student.phoneNumber || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    <span>{className}</span>
                  </div>
                </div>
              </div>
              
              {/* Student Details */}
              <div className="text-right text-sm text-gray-500 ml-4">
                <div className="font-medium">{student.campus}</div>
                <div>{student.program || student.admissionInfo?.program}</div>
                <div>{student.admissionInfo?.grade}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <Button
          onClick={onViewDetails}
          variant="outline"
          size="sm"
          className="ml-4 flex items-center gap-1"
        >
          <Eye className="h-4 w-4" />
          View Details
        </Button>
      </div>
    </div>
  );
};

export default StudentProfile;