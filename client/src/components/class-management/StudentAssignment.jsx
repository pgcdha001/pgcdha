import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  UserMinus,
  Check,
  X,
  ChevronDown,
  Upload,
  Download,
  AlertCircle,
  GraduationCap,
  Settings
} from 'lucide-react';
import { Button } from '../ui/button';
import PermissionGuard from '../PermissionGuard';
import api from '../../services/api';
import { PERMISSIONS } from '../../utils/rolePermissions';

const StudentAssignment = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterCampus, setFilterCampus] = useState('');
  const [filterClassStatus, setFilterClassStatus] = useState('all');
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [showIndividualAssign, setShowIndividualAssign] = useState(false);
  const [selectedStudentForAssignment, setSelectedStudentForAssignment] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    classId: '',
    grade: '',
    program: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Fetch students with level 5 or higher (admitted students)
      const response = await api.get('/students');
      const allStudents = response.data?.data || [];
      
      // Filter for level 5 students (officially admitted)
      const level5Students = allStudents.filter(student => 
        student.prospectusStage === 5 || student.enquiryLevel === 5
      );
      
      console.log('All students:', allStudents.length);
      console.log('Level 5 students:', level5Students.length);
      console.log('Level 5 student data:', level5Students);
      
      setStudents(level5Students);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]); // Ensure students is always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      // API returns { success: true, classes: [...] }
      const classesData = response.data?.classes || [];
      console.log('Fetched classes:', classesData);
      console.log('Number of classes:', classesData.length);
      classesData.forEach(cls => {
        console.log(`Class: ${cls.name}, Campus: ${cls.campus}, Grade: ${cls.grade}, Program: ${cls.program}`);
      });
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]); // Ensure classes is always an array
    }
  };

  const handleAssignStudent = async (studentId, classId, grade = null, program = null) => {
    try {
      // First check if student is at level 5
      const student = students.find(s => s._id === studentId);
      if (!student) {
        alert('Student not found');
        return;
      }

      if (student.prospectusStage !== 5 && student.enquiryLevel !== 5) {
        console.log('Student level check failed:', {
          studentId: student._id,
          prospectusStage: student.prospectusStage,
          enquiryLevel: student.enquiryLevel,
          fullName: student.fullName
        });
        alert('Only officially admitted students (Level 5) can be assigned to classes. This student is currently at level ' + (student.prospectusStage || student.enquiryLevel || 'unknown'));
        return;
      }

      const response = await api.post(`/students/${studentId}/assign-class`, {
        classId,
        grade, // Include grade in the assignment if provided
        program // Include program in the assignment if provided
      });

      console.log('Assignment request sent:', {
        studentId,
        classId,
        grade,
        program,
        studentGrade: student.admissionInfo?.grade,
        studentProgram: student.admissionInfo?.program || student.program,
        studentAdmissionInfo: student.admissionInfo
      });
      if (response.data.success) {
        // Update local state
        setStudents(students.map(student => 
          student._id === studentId 
            ? { 
                ...student, 
                classId: classId, 
                rollNumber: response.data.rollNumber,
                admissionInfo: {
                  ...student.admissionInfo,
                  currentGrade: grade || student.admissionInfo?.grade
                }
              }
            : student
        ));
        
        // Refresh classes to update student count
        await fetchClasses();
        
        alert('Student assigned successfully!');
      }
    } catch (error) {
      console.error('Error assigning student:', error);
      
      // Handle specific error messages
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Failed to assign student';
        alert(errorMessage);
      } else {
        alert('Failed to assign student. Please try again.');
      }
    }
  };

  const handleUnassignStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to unassign this student from their class?')) {
      try {
        const response = await api.post(`/students/${studentId}/unassign-class`);
        if (response.data.success) {
          // Update local state
          setStudents(students.map(student => 
            student._id === studentId 
              ? { ...student, classId: null, rollNumber: null }
              : student
          ));
          
          // Refresh classes to update student count
          await fetchClasses();
          
          alert('Student unassigned successfully!');
        }
      } catch (error) {
        console.error('Error unassigning student:', error);
        alert('Failed to unassign student. Please try again.');
      }
    }
  };

  const openIndividualAssignModal = (student) => {
    console.log('Opening assignment modal for student:', {
      id: student._id,
      name: `${student.fullName?.firstName} ${student.fullName?.lastName}`,
      campus: student.campus,
      gender: student.gender,
      program: student.admissionInfo?.program || student.program,
      grade: student.admissionInfo?.grade,
      prospectusStage: student.prospectusStage,
      enquiryLevel: student.enquiryLevel
    });
    
    setSelectedStudentForAssignment(student);
    setAssignmentData({
      classId: '',
      grade: student.admissionInfo?.grade || '',
      program: student.admissionInfo?.program || student.program || ''
    });
    setShowIndividualAssign(true);
  };

  const openEditClassModal = (student) => {
    console.log('Opening edit class modal for student:', {
      id: student._id,
      name: `${student.fullName?.firstName} ${student.fullName?.lastName}`,
      currentClassId: student.classId,
      currentClassName: getClassName(student.classId)
    });
    
    setSelectedStudentForAssignment(student);
    setAssignmentData({
      classId: student.classId || '',
      grade: student.admissionInfo?.grade || '',
      program: student.admissionInfo?.program || student.program || ''
    });
    setShowIndividualAssign(true);
  };

  const handleIndividualAssignment = async () => {
    if (!assignmentData.classId || !assignmentData.grade || !assignmentData.program) {
      alert('Please select grade, program, and class');
      return;
    }

    await handleAssignStudent(
      selectedStudentForAssignment._id, 
      assignmentData.classId, 
      assignmentData.grade,
      assignmentData.program
    );
    
    setShowIndividualAssign(false);
    setSelectedStudentForAssignment(null);
    setAssignmentData({ classId: '', grade: '', program: '' });
  };

  const handleBulkAssign = async () => {
    if (!selectedClass || selectedStudents.length === 0) {
      alert('Please select a class and at least one student.');
      return;
    }

    try {
      const response = await api.post('/students/bulk-assign', {
        studentIds: selectedStudents,
        classId: selectedClass
      });
      
      if (response.data.success) {
        // Update local state
        setStudents(students.map(student => 
          selectedStudents.includes(student._id)
            ? { 
                ...student, 
                classId: selectedClass,
                rollNumber: response.data.assignments.find(a => a.studentId === student._id)?.rollNumber
              }
            : student
        ));
        
        setSelectedStudents([]);
        setSelectedClass('');
        setShowBulkAssign(false);
        alert(`${selectedStudents.length} students assigned successfully!`);
      }
    } catch (error) {
      console.error('Error in bulk assignment:', error);
      alert('Failed to assign students. Please try again.');
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const getClassName = (classId) => {
    if (!Array.isArray(classes)) return 'Unknown Class';
    const classData = classes.find(cls => cls._id === classId);
    return classData ? classData.name : 'Unknown Class';
  };

  const getClassInfo = (classId) => {
    if (!Array.isArray(classes)) return '';
    const classData = classes.find(cls => cls._id === classId);
    return classData ? `${classData.grade} ${classData.program} - ${classData.campus}` : '';
  };

  // Filter students based on search and filters and sort by assignment status
  const filteredStudents = (students || []).filter(student => {
    const nameMatch = `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    const fatherNameMatch = (student.fatherName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const searchMatch = nameMatch || fatherNameMatch;
    
    const gradeMatch = !filterGrade || student.admissionInfo?.grade === filterGrade;
    const programMatch = !filterProgram || student.admissionInfo?.program === filterProgram;
    const campusMatch = !filterCampus || student.campus === filterCampus;
    
    const classStatusMatch = filterClassStatus === 'all' || 
      (filterClassStatus === 'assigned' && student.classId) ||
      (filterClassStatus === 'unassigned' && !student.classId);
    
    return searchMatch && gradeMatch && programMatch && campusMatch && classStatusMatch;
  }).sort((a, b) => {
    // Sort unassigned students first, then assigned students
    if (!a.classId && b.classId) return -1;
    if (a.classId && !b.classId) return 1;
    // If both have same assignment status, sort by name
    const nameA = `${a.fullName?.firstName || ''} ${a.fullName?.lastName || ''}`.toLowerCase();
    const nameB = `${b.fullName?.firstName || ''} ${b.fullName?.lastName || ''}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const getAvailableClasses = (student) => {
    if (!Array.isArray(classes)) return [];
    return classes.filter(cls => 
      cls.campus === student.campus &&
      cls.grade === student.admissionInfo?.currentGrade &&
      cls.program === student.admissionInfo?.program
    );
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Assignment</h1>
          <p className="text-gray-600">Assign officially admitted students (Level 5) to their respective classes and grades</p>
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
            <strong>Note:</strong> Only students who have reached Level 5 (officially admitted) can be assigned to classes.
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search students by name or father name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterClassStatus}
                  onChange={(e) => setFilterClassStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Students</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                </select>
                
                <select
                  value={filterCampus}
                  onChange={(e) => setFilterCampus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Campus</option>
                  <option value="Boys">Boys Campus</option>
                  <option value="Girls">Girls Campus</option>
                </select>
                
                <select
                  value={filterGrade}
                  onChange={(e) => {
                    setFilterGrade(e.target.value);
                    setFilterProgram(''); // Reset program when grade changes
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Grades</option>
                  <option value="11th">11th Grade</option>
                  <option value="12th">12th Grade</option>
                </select>
                
                <select
                  value={filterProgram}
                  onChange={(e) => setFilterProgram(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Programs</option>
                  <option value="ICS-PHY">ICS-PHY</option>
                  <option value="ICS-STAT">ICS-STAT</option>
                  <option value="ICOM">ICOM</option>
                  <option value="Pre Engineering">Pre Engineering</option>
                  <option value="Pre Medical">Pre Medical</option>
                  <option value="F.A">F.A</option>
                  <option value="FA IT">FA IT</option>
                  <option value="General Science">General Science</option>
                </select>
              </div>
            </div>

            {/* Bulk Assignment Button */}
            <PermissionGuard permission={PERMISSIONS.CLASS_MANAGEMENT.BULK_ASSIGN_STUDENTS}>
              <div className="flex gap-2">
                {selectedStudents.length > 0 && (
                  <Button
                    onClick={() => setShowBulkAssign(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <UserPlus className="h-5 w-5 mr-2" />
                    Assign {selectedStudents.length} Students
                  </Button>
                )}
              </div>
            </PermissionGuard>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm">
              <span className="text-gray-600">Level 5 Students:</span>
              <span className="font-semibold ml-1">{filteredStudents.length}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Assigned to Classes:</span>
              <span className="font-semibold ml-1 text-green-600">
                {filteredStudents.filter(s => s.classId).length}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Pending Assignment:</span>
              <span className="font-semibold ml-1 text-orange-600">
                {filteredStudents.filter(s => !s.classId).length}
              </span>
            </div>
            {selectedStudents.length > 0 && (
              <div className="text-sm">
                <span className="text-gray-600">Selected:</span>
                <span className="font-semibold ml-1 text-blue-600">{selectedStudents.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
              {students.length === 0 ? (
                <div className="text-gray-500">
                  <p className="mb-2">No officially admitted students (Level 5) found.</p>
                  <p className="text-sm">Students must reach Level 5 (1st Installment Submitted) before they can be assigned to classes.</p>
                </div>
              ) : (
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedStudents.length === filteredStudents.filter(s => !s.classId).length && filteredStudents.filter(s => !s.classId).length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents(filteredStudents.filter(s => !s.classId).map(s => s._id));
                          } else {
                            setSelectedStudents([]);
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Student Details</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Academic Info</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Current Class</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => {
                    const availableClasses = getAvailableClasses(student);
                    
                    return (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => toggleStudentSelection(student._id)}
                            disabled={!!student.classId}
                            className="rounded border-gray-300"
                          />
                        </td>
                        
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {`${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.trim()}
                            </div>
                            <div className="text-sm text-gray-500">
                              Father: {student.fatherName || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.phoneNumber || 'No contact'}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                Level {student.prospectusStage || student.enquiryLevel || 5}
                              </span>
                              {student.rollNumber && (
                                <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Roll: {student.rollNumber}
                                </span>
                              )}
                              <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                Admitted
                              </span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <GraduationCap className="h-4 w-4 text-gray-400" />
                              <span>{student.admissionInfo?.currentGrade || 'N/A'} {student.admissionInfo?.program || ''}</span>
                            </div>
                            <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              student.campus === 'Boys' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                            }`}>
                              {student.campus}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-4">
                          {student.classId ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {getClassName(student.classId)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {getClassInfo(student.classId)}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                                  ✓ Class Assigned
                                </span>
                                {student.rollNumber && (
                                  <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    Roll: {student.rollNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                ⚠ Unassigned
                              </span>
                            </div>
                          )}
                        </td>
                        
                        <td className="px-4 py-4">
                          {student.classId ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                                ✓ Assigned
                              </span>
                              <PermissionGuard permission={PERMISSIONS.CLASS_MANAGEMENT.ASSIGN_STUDENTS}>
                                <Button
                                  onClick={() => openEditClassModal(student)}
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Edit Class
                                </Button>
                              </PermissionGuard>
                              <PermissionGuard permission={PERMISSIONS.CLASS_MANAGEMENT.ASSIGN_STUDENTS}>
                                <Button
                                  onClick={() => handleUnassignStudent(student._id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <UserMinus className="h-4 w-4 mr-1" />
                                  Unassign
                                </Button>
                              </PermissionGuard>
                            </div>
                          ) : (
                            <PermissionGuard permission={PERMISSIONS.CLASS_MANAGEMENT.ASSIGN_STUDENTS}>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => openIndividualAssignModal(student)}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Assign Class
                                </Button>
                              </div>
                            </PermissionGuard>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bulk Assignment Modal */}
        {showBulkAssign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Bulk Assign Students</h3>
                  <button
                    onClick={() => setShowBulkAssign(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Assign {selectedStudents.length} selected students to a class:
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Class *
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Choose a class</option>
                    {Array.isArray(classes) && classes.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} - {cls.grade} {cls.program} ({cls.campus})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">Note:</p>
                      <p>Students will be automatically assigned roll numbers based on the class's current enrollment.</p>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => setShowBulkAssign(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkAssign}
                    disabled={!selectedClass}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Assign Students
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Individual Assignment Modal */}
        {showIndividualAssign && selectedStudentForAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedStudentForAssignment?.classId ? 'Edit Student Class Assignment' : 'Assign Student to Class'}
                  </h3>
                  <button
                    onClick={() => setShowIndividualAssign(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Student Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {`${selectedStudentForAssignment.fullName?.firstName || ''} ${selectedStudentForAssignment.fullName?.lastName || ''}`.trim()}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Father: {selectedStudentForAssignment.fatherName || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Current Program: {selectedStudentForAssignment.admissionInfo?.program || selectedStudentForAssignment.program || 'Not Set'}
                        {!(selectedStudentForAssignment.admissionInfo?.program || selectedStudentForAssignment.program) && (
                          <span className="ml-2 text-orange-600 font-medium">⚠ Program Required</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        Current Grade: {selectedStudentForAssignment.admissionInfo?.grade || 'Not Set'}
                        {!selectedStudentForAssignment.admissionInfo?.grade && (
                          <span className="ml-2 text-orange-600 font-medium">⚠ Grade Required</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assignment Form */}
                <div className="space-y-4">
                  {/* Grade Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade *
                    </label>
                    <select
                      value={assignmentData.grade}
                      onChange={(e) => setAssignmentData(prev => ({ ...prev, grade: e.target.value, classId: '' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Grade</option>
                      <option value="11th">11th Grade</option>
                      <option value="12th">12th Grade</option>
                    </select>
                  </div>

                  {/* Program Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Program *
                    </label>
                    <select
                      value={assignmentData.program || (selectedStudentForAssignment.admissionInfo?.program || selectedStudentForAssignment.program)}
                      onChange={(e) => setAssignmentData(prev => ({ ...prev, program: e.target.value, classId: '' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Program</option>
                      <option value="ICS-PHY">ICS-PHY</option>
                      <option value="ICS-STAT">ICS-STAT</option>
                      <option value="ICOM">ICOM</option>
                      <option value="Pre Engineering">Pre Engineering</option>
                      <option value="Pre Medical">Pre Medical</option>
                      <option value="F.A">F.A</option>
                      <option value="FA IT">FA IT</option>
                      <option value="General Science">General Science</option>
                    </select>
                  </div>

                  {/* Class Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class *
                    </label>
                    <select
                      value={assignmentData.classId}
                      onChange={(e) => setAssignmentData(prev => ({ ...prev, classId: e.target.value }))}
                      disabled={!assignmentData.grade || !assignmentData.program}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select Class</option>
                      {Array.isArray(classes) && classes
                        .filter(cls => {
                          const studentProgram = assignmentData.program || selectedStudentForAssignment.admissionInfo?.program || selectedStudentForAssignment.program;
                          const studentCampus = selectedStudentForAssignment.campus || (selectedStudentForAssignment.gender === 'Female' ? 'Girls' : 'Boys');
                          
                          console.log('Filtering class:', {
                            className: cls.name,
                            classGrade: cls.grade,
                            classProgram: cls.program,
                            classCampus: cls.campus,
                            requiredGrade: assignmentData.grade,
                            requiredProgram: studentProgram,
                            requiredCampus: studentCampus,
                            match: cls.grade === assignmentData.grade && cls.campus === studentCampus && cls.program === studentProgram
                          });
                          
                          return (
                            cls.grade === assignmentData.grade &&
                            cls.campus === studentCampus &&
                            cls.program === studentProgram
                          );
                        })
                        .map(cls => (
                          <option key={cls._id} value={cls._id}>
                            {cls.name} - {cls.program} ({cls.campus})
                          </option>
                        ))
                      }
                    </select>
                    {assignmentData.grade && assignmentData.program && (() => {
                      const studentProgram = assignmentData.program || selectedStudentForAssignment.admissionInfo?.program || selectedStudentForAssignment.program;
                      const studentCampus = selectedStudentForAssignment.campus || (selectedStudentForAssignment.gender === 'Female' ? 'Girls' : 'Boys');
                      
                      const matchingClasses = classes.filter(cls => {
                        const isMatch = (
                          cls.grade === assignmentData.grade &&
                          cls.campus === studentCampus &&
                          cls.program === studentProgram
                        );
                        console.log(`Class ${cls.name}: Grade=${cls.grade}, Program=${cls.program}, Campus=${cls.campus}, Match=${isMatch}`);
                        return isMatch;
                      });

                      if (matchingClasses.length === 0) {
                        // Check if there are any classes for this campus at all
                        const campusClasses = classes.filter(cls => cls.campus === studentCampus);
                        const campusName = studentCampus;
                        
                        if (campusClasses.length === 0) {
                          return (
                            <div className="text-sm text-red-600 mt-1 p-3 bg-red-50 rounded-lg border border-red-200">
                              <p className="font-medium">⚠ No Classes Available!</p>
                              <p className="mt-1">No classes are registered for <strong>{campusName} Campus</strong>.</p>
                              <p className="text-xs mt-2">Please contact the administrator to create classes for {campusName} Campus first.</p>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-sm text-orange-600 mt-1 p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <p className="font-medium">No matching classes found!</p>
                              <p className="mt-1">Looking for:</p>
                              <ul className="list-disc list-inside text-xs mt-1">
                                <li>Grade: {assignmentData.grade}</li>
                                <li>Program: {studentProgram}</li>
                                <li>Campus: {studentCampus}</li>
                              </ul>
                              <p className="text-xs mt-2">
                                Available classes for {campusName} Campus: {campusClasses.length}
                              </p>
                              <div className="text-xs mt-1">
                                {campusClasses.map(cls => (
                                  <div key={cls._id}>• {cls.name} - {cls.grade} {cls.program}</div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      }
                      return null;
                    })()}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 my-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">Note:</p>
                      <p>The student will be automatically assigned a roll number based on the class's current enrollment.</p>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => setShowIndividualAssign(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleIndividualAssignment}
                    disabled={!assignmentData.classId || !assignmentData.grade || !assignmentData.program}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Student
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAssignment;
