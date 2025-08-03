import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Save, 
  Search, 
  Filter, 
  Upload,
  Download,
  Edit,
  Trash2,
  Plus,
  BookOpen,
  Award,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import PermissionGuard from '../PermissionGuard';
import { PERMISSIONS } from '../../utils/rolePermissions';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

// Common subjects for matriculation (9th/10th grade)
const MATRICULATION_SUBJECTS = [
  'Mathematics',
  'Physics', 
  'Chemistry',
  'Biology',
  'English',
  'Urdu',
  'Islamiat',
  'Pakistan Studies',
  'Computer Science',
  'Economics',
  'Accounting',
  'Business Studies'
];

const AcademicRecordsManagement = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [academicRecord, setAcademicRecord] = useState({
    matriculation: {
      totalMarks: '',
      obtainedMarks: '',
      percentage: '',
      passingYear: new Date().getFullYear(),
      board: '',
      subjects: []
    },
    previousGrade: {
      totalMarks: '',
      obtainedMarks: '',
      percentage: '',
      grade: '',
      subjects: []
    }
  });

  const { showToast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Fetch all Level 5 students (admitted students)
      const response = await api.get('/students?assignmentFilter=all');
      const allStudents = response.data?.data || [];
      
      // Filter for Level 5 students only
      const admittedStudents = allStudents.filter(student => 
        student.prospectusStage === 5 || student.enquiryLevel === 5
      );
      
      console.log('Admitted students for academic records:', admittedStudents.length);
      setStudents(admittedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      showToast('Failed to fetch students', 'error');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for matriculation subjects
  const addMatriculationSubject = () => {
    setAcademicRecord(prev => ({
      ...prev,
      matriculation: {
        ...prev.matriculation,
        subjects: [...prev.matriculation.subjects, { name: '', totalMarks: '', obtainedMarks: '' }]
      }
    }));
  };

  const updateMatriculationSubject = (index, field, value) => {
    setAcademicRecord(prev => ({
      ...prev,
      matriculation: {
        ...prev.matriculation,
        subjects: prev.matriculation.subjects.map((subject, i) => 
          i === index ? { ...subject, [field]: value } : subject
        )
      }
    }));
  };

  const removeMatriculationSubject = (index) => {
    setAcademicRecord(prev => ({
      ...prev,
      matriculation: {
        ...prev.matriculation,
        subjects: prev.matriculation.subjects.filter((_, i) => i !== index)
      }
    }));
  };

  // Form submission handler
  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    await saveAcademicRecord();
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    
    // Initialize academic record with existing data or defaults
    const existingRecord = student.academicRecords || {};
    
    setAcademicRecord({
      matriculation: {
        totalMarks: existingRecord.matriculation?.totalMarks || '',
        obtainedMarks: existingRecord.matriculation?.obtainedMarks || '',
        percentage: existingRecord.matriculation?.percentage || '',
        passingYear: existingRecord.matriculation?.passingYear || new Date().getFullYear() - 1,
        board: existingRecord.matriculation?.board || '',
        subjects: existingRecord.matriculation?.subjects || []
      },
      previousGrade: {
        totalMarks: existingRecord.previousGrade?.totalMarks || '',
        obtainedMarks: existingRecord.previousGrade?.obtainedMarks || '',
        percentage: existingRecord.previousGrade?.percentage || '',
        grade: existingRecord.previousGrade?.grade || '',
        subjects: existingRecord.previousGrade?.subjects || []
      }
    });
    
    setShowRecordForm(true);
  };

  const addSubject = (recordType) => {
    const newSubject = {
      name: '',
      totalMarks: 100,
      obtainedMarks: '',
      percentage: ''
    };
    
    setAcademicRecord(prev => ({
      ...prev,
      [recordType]: {
        ...prev[recordType],
        subjects: [...prev[recordType].subjects, newSubject]
      }
    }));
  };

  const updateSubject = (recordType, index, field, value) => {
    setAcademicRecord(prev => {
      const subjects = [...prev[recordType].subjects];
      subjects[index] = { ...subjects[index], [field]: value };
      
      // Auto-calculate percentage if marks are provided
      if (field === 'obtainedMarks' || field === 'totalMarks') {
        const obtained = parseFloat(field === 'obtainedMarks' ? value : subjects[index].obtainedMarks);
        const total = parseFloat(field === 'totalMarks' ? value : subjects[index].totalMarks);
        
        if (obtained && total && total > 0) {
          subjects[index].percentage = ((obtained / total) * 100).toFixed(2);
        }
      }
      
      return {
        ...prev,
        [recordType]: {
          ...prev[recordType],
          subjects
        }
      };
    });
  };

  const removeSubject = (recordType, index) => {
    setAcademicRecord(prev => ({
      ...prev,
      [recordType]: {
        ...prev[recordType],
        subjects: prev[recordType].subjects.filter((_, i) => i !== index)
      }
    }));
  };

  const calculateOverallPercentage = (recordType) => {
    const record = academicRecord[recordType];
    if (record.obtainedMarks && record.totalMarks) {
      const percentage = (parseFloat(record.obtainedMarks) / parseFloat(record.totalMarks)) * 100;
      return percentage.toFixed(2);
    }
    return '';
  };

  const saveAcademicRecord = async () => {
    if (!selectedStudent) return;
    
    setSaving(true);
    try {
      // Calculate overall percentages
      const matriculationPercentage = calculateOverallPercentage('matriculation');
      const previousGradePercentage = calculateOverallPercentage('previousGrade');
      
      const payload = {
        academicRecords: {
          matriculation: {
            ...academicRecord.matriculation,
            percentage: matriculationPercentage || academicRecord.matriculation.percentage
          },
          previousGrade: {
            ...academicRecord.previousGrade,
            percentage: previousGradePercentage || academicRecord.previousGrade.percentage
          }
        }
      };
      
      const response = await api.patch(`/students/${selectedStudent._id}/academic-records`, payload);
      
      if (response.data.success) {
        showToast('Academic records saved successfully!', 'success');
        
        // Update local student data
        setStudents(prev => prev.map(student => 
          student._id === selectedStudent._id 
            ? { ...student, academicRecords: payload.academicRecords }
            : student
        ));
        
        setShowRecordForm(false);
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error('Error saving academic records:', error);
      showToast('Failed to save academic records', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      `${student.fullName?.firstName} ${student.fullName?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = filterGrade === '' || student.admissionInfo?.grade === filterGrade;
    
    return matchesSearch && matchesGrade;
  });

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            Academic Records Management
          </h1>
          <p className="text-gray-600">Manage matriculation and previous grade records for admitted students</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Students</p>
                <p className="text-2xl font-bold text-blue-900">{students.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">With Records</p>
                <p className="text-2xl font-bold text-green-900">
                  {students.filter(s => s.academicRecords?.matriculation?.totalMarks).length}
                </p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Pending Records</p>
                <p className="text-2xl font-bold text-orange-900">
                  {students.filter(s => !s.academicRecords?.matriculation?.totalMarks).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Avg Performance</p>
                <p className="text-2xl font-bold text-purple-900">
                  {students.filter(s => s.academicRecords?.matriculation?.percentage).length > 0 
                    ? (students
                        .filter(s => s.academicRecords?.matriculation?.percentage)
                        .reduce((sum, s) => sum + parseFloat(s.academicRecords.matriculation.percentage), 0) / 
                       students.filter(s => s.academicRecords?.matriculation?.percentage).length
                      ).toFixed(1) + '%'
                    : 'N/A'
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search students by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Grades</option>
              <option value="11th">11th Grade</option>
              <option value="12th">12th Grade</option>
            </select>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Admitted Students ({filteredStudents.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <div key={student._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {student.fullName?.firstName} {student.fullName?.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Grade: {student.admissionInfo?.grade || 'Not Set'} | 
                          Campus: {student.campus || 'Not Set'} |
                          Program: {student.admissionInfo?.program || 'Not Set'}
                        </p>
                      </div>
                      
                      {student.academicRecords?.matriculation?.totalMarks && (
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          Matriculation: {student.academicRecords.matriculation.percentage}%
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStudentSelect(student)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {student.academicRecords?.matriculation?.totalMarks ? (
                        <>
                          <Edit className="h-4 w-4" />
                          Edit Records
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Add Records
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredStudents.length === 0 && (
              <div className="p-12 text-center">
                <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                <p className="text-gray-500">
                  {searchTerm || filterGrade 
                    ? 'No students match your search criteria.' 
                    : 'No admitted students found. Students must be at Level 5 to manage academic records.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Academic Record Form Modal */}
      {showRecordForm && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <GraduationCap className="h-6 w-6 mr-2" />
                  Academic Records - {selectedStudent.fullName?.firstName} {selectedStudent.fullName?.lastName}
                </h2>
                <Button 
                  onClick={() => setShowRecordForm(false)} 
                  variant="outline"
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>

              {/* Student Info Banner */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-600">Roll Number:</span>
                    <p className="text-gray-800">{selectedStudent.rollNumber || 'Not assigned'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Class:</span>
                    <p className="text-gray-800">{selectedStudent.classId?.name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Campus:</span>
                    <p className="text-gray-800">{selectedStudent.campus}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Program:</span>
                    <p className="text-gray-800">{selectedStudent.program || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Academic Records Form */}
              <form onSubmit={handleSubmitRecord} className="space-y-6">
                {/* Matriculation Records Section */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <Award className="h-5 w-5 mr-2 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Matriculation Records (9th/10th Grade)</h3>
                  </div>
                  
                  {/* Basic Matriculation Info */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Marks
                      </label>
                      <input
                        type="number"
                        value={academicRecord.matriculation.totalMarks}
                        onChange={(e) => setAcademicRecord(prev => ({
                          ...prev,
                          matriculation: {
                            ...prev.matriculation,
                            totalMarks: e.target.value
                          }
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 1100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Obtained Marks
                      </label>
                      <input
                        type="number"
                        value={academicRecord.matriculation.obtainedMarks}
                        onChange={(e) => {
                          const obtained = e.target.value;
                          const total = academicRecord.matriculation.totalMarks;
                          const percentage = total ? ((obtained / total) * 100).toFixed(2) : '';
                          
                          setAcademicRecord(prev => ({
                            ...prev,
                            matriculation: {
                              ...prev.matriculation,
                              obtainedMarks: obtained,
                              percentage: percentage
                            }
                          }));
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 950"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Percentage
                      </label>
                      <input
                        type="text"
                        value={academicRecord.matriculation.percentage}
                        readOnly
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                        placeholder="Auto-calculated"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Passing Year
                      </label>
                      <input
                        type="number"
                        value={academicRecord.matriculation.passingYear}
                        onChange={(e) => setAcademicRecord(prev => ({
                          ...prev,
                          matriculation: {
                            ...prev.matriculation,
                            passingYear: e.target.value
                          }
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 2023"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Board/Institution
                    </label>
                    <input
                      type="text"
                      value={academicRecord.matriculation.board}
                      onChange={(e) => setAcademicRecord(prev => ({
                        ...prev,
                        matriculation: {
                          ...prev.matriculation,
                          board: e.target.value
                        }
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Federal Board, Punjab Board"
                    />
                  </div>

                  {/* Subject-wise Marks */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-md font-medium text-gray-700">Subject-wise Marks</h4>
                      <Button
                        type="button"
                        onClick={addMatriculationSubject}
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Subject
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {academicRecord.matriculation.subjects.map((subject, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 border border-gray-200 rounded-md bg-white">
                          <div>
                            <select
                              value={subject.name}
                              onChange={(e) => updateMatriculationSubject(index, 'name', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Subject</option>
                              {MATRICULATION_SUBJECTS.map(subj => (
                                <option key={subj} value={subj}>{subj}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <input
                              type="number"
                              value={subject.totalMarks}
                              onChange={(e) => updateMatriculationSubject(index, 'totalMarks', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                              placeholder="Total Marks"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              value={subject.obtainedMarks}
                              onChange={(e) => updateMatriculationSubject(index, 'obtainedMarks', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                              placeholder="Obtained Marks"
                            />
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600 mr-2">
                              {subject.obtainedMarks && subject.totalMarks ? 
                                `${((subject.obtainedMarks / subject.totalMarks) * 100).toFixed(1)}%` : 
                                '-%'
                              }
                            </span>
                            <Button
                              type="button"
                              onClick={() => removeMatriculationSubject(index)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Previous Grade Records Section (for 12th graders) */}
                {selectedStudent.admissionInfo?.grade === '12th' && (
                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="flex items-center mb-4">
                      <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-800">11th Grade Records</h3>
                    </div>
                    
                    {/* Previous Grade Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total Marks
                        </label>
                        <input
                          type="number"
                          value={academicRecord.previousGrade.totalMarks}
                          onChange={(e) => setAcademicRecord(prev => ({
                            ...prev,
                            previousGrade: {
                              ...prev.previousGrade,
                              totalMarks: e.target.value
                            }
                          }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                          placeholder="e.g., 1100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Obtained Marks
                        </label>
                        <input
                          type="number"
                          value={academicRecord.previousGrade.obtainedMarks}
                          onChange={(e) => {
                            const obtained = e.target.value;
                            const total = academicRecord.previousGrade.totalMarks;
                            const percentage = total ? ((obtained / total) * 100).toFixed(2) : '';
                            
                            setAcademicRecord(prev => ({
                              ...prev,
                              previousGrade: {
                                ...prev.previousGrade,
                                obtainedMarks: obtained,
                                percentage: percentage
                              }
                            }));
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                          placeholder="e.g., 980"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Percentage
                        </label>
                        <input
                          type="text"
                          value={academicRecord.previousGrade.percentage}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                          placeholder="Auto-calculated"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Grade
                        </label>
                        <input
                          type="text"
                          value={academicRecord.previousGrade.grade}
                          onChange={(e) => setAcademicRecord(prev => ({
                            ...prev,
                            previousGrade: {
                              ...prev.previousGrade,
                              grade: e.target.value
                            }
                          }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                          placeholder="e.g., A+, A, B+"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button 
                    type="button"
                    onClick={() => setShowRecordForm(false)} 
                    variant="outline"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={saving}
                    className="flex items-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Records
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicRecordsManagement;
