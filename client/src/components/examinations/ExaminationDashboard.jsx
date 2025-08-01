import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Calendar, 
  BookOpen, 
  Users, 
  FileText,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  GraduationCap,
  Database,
  Clock,
  AlertTriangle,
  UserCheck,
  CalendarDays,
  BarChart3
} from 'lucide-react';
import { Button } from '../ui/button';
import PermissionGuard from '../PermissionGuard';
import api from '../../services/api';
import { PERMISSIONS } from '../../utils/rolePermissions';
import ExaminationAPITest from './ExaminationAPITest';
import AcademicRecordsManagement from './AcademicRecordsManagement';

const ExaminationDashboard = () => {
  const [activeTab, setActiveTab] = useState('tests');
  const [tests, setTests] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterTestType, setFilterTestType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);

  // Enhanced form state for test creation (Phase 3)
  const [testForm, setTestForm] = useState({
    title: '',
    subject: '',
    classId: '',
    totalMarks: '',
    testDate: '',
    testType: 'Quiz',
    instructions: '',
    duration: 60,
    marksEntryDeadline: '',
    assignedTeacher: '',
    syllabusCoverage: '',
    difficulty: 'Medium',
    isRetest: false,
    parentTestId: '',
    allowLateSubmission: false,
    lateSubmissionPenalty: 0
  });

  const testTypes = ['Quiz', 'Monthly Test', 'Mid Term', 'Final Term', 'Assignment', 'Class Test', 'Surprise Test'];
  const difficultyLevels = ['Easy', 'Medium', 'Hard'];
  const commonSubjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Urdu', 
    'Computer Science', 'Islamiat', 'Pakistan Studies', 'Economics', 
    'Accounting', 'Business Studies'
  ];

  useEffect(() => {
    if (activeTab === 'tests') {
      fetchTests();
      fetchClasses();
      fetchTeachers();
    }
  }, [activeTab]);

  const fetchTests = async () => {
    try {
      const response = await api.get('/examinations/tests');
      setTests(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
      setTests([]);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data?.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/users?role=Teacher');
      setTeachers(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced test creation with Phase 3 features
  const handleCreateTest = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Phase 3: Enhanced validation
      const selectedClass = classes.find(cls => cls._id === testForm.classId);
      if (!selectedClass) {
        alert('Please select a valid class');
        setLoading(false);
        return;
      }

      // Check for duplicate tests (Phase 3 feature)
      const duplicateCheck = await checkForDuplicateTest();
      if (duplicateCheck.isDuplicate && !window.confirm(duplicateCheck.message)) {
        setLoading(false);
        return;
      }

      const response = await api.post('/examinations/tests', {
        ...testForm,
        // Auto-calculate marks entry deadline if not provided
        marksEntryDeadline: testForm.marksEntryDeadline || getDefaultMarksDeadline(testForm.testDate)
      });
      
      if (response.data.success) {
        alert('Test created successfully!');
        setShowCreateForm(false);
        resetForm();
        fetchTests();
      }
    } catch (error) {
      console.error('Error creating test:', error);
      alert(error.response?.data?.message || 'Error creating test');
    } finally {
      setLoading(false);
    }
  };

  // Phase 3: Duplicate test detection
  const checkForDuplicateTest = async () => {
    try {
      const existingTests = tests.filter(test => 
        test.subject.toLowerCase() === testForm.subject.toLowerCase() &&
        test.classId._id === testForm.classId &&
        new Date(test.testDate).toDateString() === new Date(testForm.testDate).toDateString()
      );

      if (existingTests.length > 0) {
        return {
          isDuplicate: true,
          message: `A ${testForm.subject} test for this class already exists on ${new Date(testForm.testDate).toLocaleDateString()}. Do you want to create another test?`
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return { isDuplicate: false };
    }
  };

  // Auto-calculate marks entry deadline (3 days after test date)
  const getDefaultMarksDeadline = (testDate) => {
    const date = new Date(testDate);
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  };

  const resetForm = () => {
    setTestForm({
      title: '',
      subject: '',
      classId: '',
      totalMarks: '',
      testDate: '',
      testType: 'Quiz',
      instructions: '',
      duration: 60,
      marksEntryDeadline: '',
      assignedTeacher: '',
      syllabusCoverage: '',
      difficulty: 'Medium',
      isRetest: false,
      parentTestId: '',
      allowLateSubmission: false,
      lateSubmissionPenalty: 0
    });
  };

  const handlePublishTest = async (testId, isPublished) => {
    try {
      const response = await api.patch(`/examinations/tests/${testId}/publish`, {
        isPublished: !isPublished
      });
      
      if (response.data.success) {
        alert(`Test ${!isPublished ? 'published' : 'unpublished'} successfully!`);
        fetchTests();
      }
    } catch (error) {
      console.error('Error publishing test:', error);
      alert(error.response?.data?.message || 'Error publishing test');
    }
  };

  // Enhanced filtering (Phase 3)
  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || test.classId._id === filterClass;
    const matchesSubject = !filterSubject || test.subject.toLowerCase().includes(filterSubject.toLowerCase());
    const matchesTestType = !filterTestType || test.testType === filterTestType;
    
    // Phase 3: Status filtering
    let matchesStatus = true;
    if (filterStatus) {
      const today = new Date();
      const testDate = new Date(test.testDate);
      
      switch (filterStatus) {
        case 'upcoming':
          matchesStatus = testDate > today && test.isPublished;
          break;
        case 'completed':
          matchesStatus = testDate < today;
          break;
        case 'draft':
          matchesStatus = !test.isPublished;
          break;
        case 'active':
          matchesStatus = test.isPublished;
          break;
        default:
          matchesStatus = true;
      }
    }
    
    return matchesSearch && matchesClass && matchesSubject && matchesTestType && matchesStatus;
  });

  // Phase 3: Test statistics
  const getTestStatistics = () => {
    const today = new Date();
    return {
      total: tests.length,
      published: tests.filter(t => t.isPublished).length,
      upcoming: tests.filter(t => new Date(t.testDate) > today && t.isPublished).length,
      completed: tests.filter(t => new Date(t.testDate) < today).length,
      draft: tests.filter(t => !t.isPublished).length
    };
  };

  const stats = getTestStatistics();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Examination Management</h1>
                <p className="text-sm text-gray-600">Advanced test management and academic records</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {activeTab === 'tests' && (
                <>
                  <Button
                    onClick={() => setShowCalendarView(!showCalendarView)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <CalendarDays className="h-4 w-4" />
                    {showCalendarView ? 'List View' : 'Calendar View'}
                  </Button>
                  
                  <PermissionGuard permission={PERMISSIONS.EXAMINATION.CREATE_TEST}>
                    <Button 
                      onClick={() => setShowCreateForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Create Test
                    </Button>
                  </PermissionGuard>
                </>
              )}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="border-t border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('tests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'tests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Test Management</span>
                  <span className="bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-1 ml-2">
                    {stats.total}
                  </span>
                </div>
              </button>
              
              <PermissionGuard permission={PERMISSIONS.EXAMINATION.MANAGE_ACADEMIC_RECORDS}>
                <button
                  onClick={() => setActiveTab('academic-records')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'academic-records'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>Academic Records</span>
                  </div>
                </button>
              </PermissionGuard>
              
              {/* Development Tab */}
              {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
                <button
                  onClick={() => setActiveTab('api-test')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'api-test'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span>API Test</span>
                  </div>
                </button>
              )}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Content */}
        {activeTab === 'tests' && (
          <div>
            {/* Phase 3: Enhanced Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Tests</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Published</p>
                    <p className="text-2xl font-bold text-green-900">{stats.published}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Upcoming</p>
                    <p className="text-2xl font-bold text-orange-900">{stats.upcoming}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Completed</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.completed}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Drafts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
                  </div>
                  <Edit className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Phase 3: Enhanced Create Test Form Modal */}
            {showCreateForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <PlusCircle className="h-5 w-5" />
                      Create New Test
                    </h3>
                    <Button
                      onClick={() => setShowCreateForm(false)}
                      variant="outline"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <form onSubmit={handleCreateTest} className="p-6">
                    {/* Basic Information */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Basic Information
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Test Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={testForm.title}
                            onChange={(e) => setTestForm({...testForm, title: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter test title"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subject *
                          </label>
                          <select
                            required
                            value={testForm.subject}
                            onChange={(e) => setTestForm({...testForm, subject: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Subject</option>
                            {commonSubjects.map((subject) => (
                              <option key={subject} value={subject}>{subject}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Class *
                          </label>
                          <select
                            required
                            value={testForm.classId}
                            onChange={(e) => setTestForm({...testForm, classId: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Class</option>
                            {classes.map((cls) => (
                              <option key={cls._id} value={cls._id}>
                                {cls.name} - {cls.campus} {cls.grade} ({cls.program})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Test Type *
                          </label>
                          <select
                            required
                            value={testForm.testType}
                            onChange={(e) => setTestForm({...testForm, testType: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {testTypes.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Test Details */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Test Details
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total Marks *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={testForm.totalMarks}
                            onChange={(e) => setTestForm({...testForm, totalMarks: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter total marks"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Test Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={testForm.testDate}
                            onChange={(e) => {
                              setTestForm({
                                ...testForm, 
                                testDate: e.target.value,
                                marksEntryDeadline: getDefaultMarksDeadline(e.target.value)
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration (minutes)
                          </label>
                          <input
                            type="number"
                            min="5"
                            max="300"
                            value={testForm.duration}
                            onChange={(e) => setTestForm({...testForm, duration: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="60"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Marks Entry Deadline
                          </label>
                          <input
                            type="date"
                            value={testForm.marksEntryDeadline}
                            onChange={(e) => setTestForm({...testForm, marksEntryDeadline: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Difficulty Level
                          </label>
                          <select
                            value={testForm.difficulty}
                            onChange={(e) => setTestForm({...testForm, difficulty: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {difficultyLevels.map((level) => (
                              <option key={level} value={level}>{level}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Assigned Teacher
                          </label>
                          <select
                            value={testForm.assignedTeacher}
                            onChange={(e) => setTestForm({...testForm, assignedTeacher: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Auto-assign</option>
                            {teachers.map((teacher) => (
                              <option key={teacher._id} value={teacher._id}>
                                {teacher.fullName?.firstName} {teacher.fullName?.lastName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Additional Settings */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Additional Settings
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Syllabus Coverage
                          </label>
                          <textarea
                            value={testForm.syllabusCoverage}
                            onChange={(e) => setTestForm({...testForm, syllabusCoverage: e.target.value})}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Topics covered in this test"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instructions
                          </label>
                          <textarea
                            value={testForm.instructions}
                            onChange={(e) => setTestForm({...testForm, instructions: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter test instructions (optional)"
                          />
                        </div>
                        
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={testForm.isRetest}
                              onChange={(e) => setTestForm({...testForm, isRetest: e.target.checked})}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">This is a retest</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={testForm.allowLateSubmission}
                              onChange={(e) => setTestForm({...testForm, allowLateSubmission: e.target.checked})}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Allow late marks submission</span>
                          </label>
                        </div>
                        
                        {testForm.allowLateSubmission && (
                          <div className="w-48">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Late Submission Penalty (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={testForm.lateSubmissionPenalty}
                              onChange={(e) => setTestForm({...testForm, lateSubmissionPenalty: parseInt(e.target.value)})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? 'Creating...' : 'Create Test'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Enhanced Filters and Search */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search tests by title or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={filterTestType}
                    onChange={(e) => setFilterTestType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    {testTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="draft">Draft</option>
                    <option value="active">Published</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tests Grid */}
            <div className="grid gap-6">
              {loading && tests.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading tests...</p>
                  </div>
                </div>
              ) : filteredTests.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Found</h3>
                  <p className="text-gray-500">
                    {searchTerm || filterClass || filterTestType || filterStatus
                      ? 'No tests match your search criteria.' 
                      : 'Get started by creating your first test.'}
                  </p>
                </div>
              ) : (
                filteredTests.map((test) => (
                  <div key={test._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            test.isPublished 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {test.isPublished ? 'Published' : 'Draft'}
                          </span>
                          
                          {/* Phase 3: Test status indicators */}
                          {(() => {
                            const today = new Date();
                            const testDate = new Date(test.testDate);
                            const marksDeadline = new Date(test.marksEntryDeadline || test.testDate);
                            
                            if (testDate > today && test.isPublished) {
                              return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Upcoming</span>;
                            } else if (testDate < today && marksDeadline > today) {
                              return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Marks Pending</span>;
                            } else if (testDate < today && marksDeadline < today) {
                              return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Deadline Passed</span>;
                            }
                            return null;
                          })()}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Subject:</span> {test.subject}
                          </div>
                          <div>
                            <span className="font-medium">Class:</span> {test.classId?.name || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {test.testType}
                          </div>
                          <div>
                            <span className="font-medium">Marks:</span> {test.totalMarks}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span> {new Date(test.testDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Teacher:</span> {test.assignedTeacher?.name || 'Auto-assigned'}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span> {test.duration || 60} min
                          </div>
                          <div>
                            <span className="font-medium">Difficulty:</span> {test.difficulty || 'Medium'}
                          </div>
                        </div>
                        
                        {test.syllabusCoverage && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Coverage:</span> {test.syllabusCoverage}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <PermissionGuard permission={PERMISSIONS.EXAMINATION.PUBLISH_TEST}>
                          <Button
                            onClick={() => handlePublishTest(test._id, test.isPublished)}
                            variant={test.isPublished ? "outline" : "default"}
                            size="sm"
                            className={test.isPublished ? "text-red-600 border-red-300" : "bg-green-600 hover:bg-green-700"}
                          >
                            {test.isPublished ? (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Publish
                              </>
                            )}
                          </Button>
                        </PermissionGuard>
                        
                        <PermissionGuard permission={PERMISSIONS.EXAMINATION.ENTER_MARKS}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Enter Marks
                          </Button>
                        </PermissionGuard>
                        
                        <PermissionGuard permission={PERMISSIONS.EXAMINATION.VIEW_RESULTS}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Results
                          </Button>
                        </PermissionGuard>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Academic Records Tab Content */}
        {activeTab === 'academic-records' && (
          <AcademicRecordsManagement />
        )}
        
        {/* API Test Tab Content */}
        {activeTab === 'api-test' && (
          <ExaminationAPITest />
        )}
      </div>
    </div>
  );
};

export default ExaminationDashboard;
