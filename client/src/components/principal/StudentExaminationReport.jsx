import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Edit2,
  Save,
  X,
  FileText,
  Users,
  Award,
  AlertCircle,
  LineChart,
  Filter
} from 'lucide-react';
import { Button } from '../ui/button';
import Card from '../ui/card';
import { useToast } from '../../contexts/ToastContext';
import { default as api } from '../../services/api';

// Performance Graph Modal Component
const PerformanceGraphModal = ({ student, isOpen, onClose }) => {
  if (!isOpen) return null;

  const subjectData = {};
  const program = student.admissionInfo?.program || student.program || 'default';
  
  // Extract subject performance data from backend-processed examData
  student.examData?.forEach(exam => {
    Object.entries(exam.data || {}).forEach(([subject, marks]) => {
      if (marks && marks !== '-') {
        if (!subjectData[subject]) {
          subjectData[subject] = [];
        }
        subjectData[subject].push({
          exam: exam.examName,
          marks: parseFloat(marks),
          type: exam.type
        });
      }
    });
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Performance Analysis: {student.fullName?.firstName} {student.fullName?.lastName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Roll No: {student.rollNumber} | Program: {program}
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(subjectData).map(([subject, data]) => {
              const matriculationMark = data.find(d => d.type === 'matriculation')?.marks;
              const currentMarks = data.filter(d => d.type === 'test');
              const avgCurrent = currentMarks.length > 0 
                ? currentMarks.reduce((sum, d) => sum + d.marks, 0) / currentMarks.length 
                : 0;
              
              const trend = matriculationMark ? avgCurrent - matriculationMark : 0;
              
              return (
                <div key={subject} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-blue-600" />
                    {subject}
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Matriculation baseline */}
                    {matriculationMark && (
                      <div className="flex items-center justify-between p-2 bg-yellow-100 rounded">
                        <span className="text-sm font-medium text-yellow-800">Matriculation</span>
                        <span className="text-sm font-bold text-yellow-900">{matriculationMark}</span>
                      </div>
                    )}
                    
                    {/* Current performance */}
                    <div className="flex items-center justify-between p-2 bg-blue-100 rounded">
                      <span className="text-sm font-medium text-blue-800">Current Average</span>
                      <span className="text-sm font-bold text-blue-900">{avgCurrent.toFixed(1)}</span>
                    </div>
                    
                    {/* Trend */}
                    {matriculationMark && (
                      <div className={`flex items-center justify-between p-2 rounded ${
                        trend > 0 ? 'bg-green-100' : trend < 0 ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        <span className={`text-sm font-medium ${
                          trend > 0 ? 'text-green-800' : trend < 0 ? 'text-red-800' : 'text-gray-800'
                        }`}>
                          Progress from Matric
                        </span>
                        <div className={`flex items-center gap-1 text-sm font-bold ${
                          trend > 0 ? 'text-green-900' : trend < 0 ? 'text-red-900' : 'text-gray-900'
                        }`}>
                          {trend > 0 ? <TrendingUp className="h-4 w-4" /> : 
                           trend < 0 ? <TrendingDown className="h-4 w-4" /> : null}
                          {trend > 0 ? '+' : ''}{trend.toFixed(1)}
                        </div>
                      </div>
                    )}
                    
                    {/* Test scores */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Test Scores</p>
                      {currentMarks.map((test, index) => (
                        <div key={index} className="flex justify-between text-sm text-gray-700">
                          <span>{test.exam}</span>
                          <span className="font-medium">{test.marks}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {Object.keys(subjectData).length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No performance data available for analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StudentExaminationReport = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedStudentForGraph, setSelectedStudentForGraph] = useState(null);
  const [zoneCounts, setZoneCounts] = useState({});
  const [summaryData, setSummaryData] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  
  const { toast } = useToast();

  // Subject configurations based on program
  const PROGRAM_SUBJECTS = {
    'ICS': ['English', 'Math', 'Urdu', 'Computer', 'Pak Study', 'T.Quran', 'Stats'],
    'FSC': ['English', 'Math', 'Urdu', 'Biology', 'Pak Study', 'T.Quran', 'Physics'],
    'Pre Medical': ['English', 'Math', 'Urdu', 'Biology', 'Pak Study', 'T.Quran', 'Physics'],
    'Pre Engineering': ['English', 'Math', 'Urdu', 'Computer', 'Pak Study', 'T.Quran', 'Physics'],
    'ICS-PHY': ['English', 'Math', 'Urdu', 'Computer', 'Pak Study', 'T.Quran', 'Physics'],
    'default': ['English', 'Math', 'Urdu', 'Pak Study', 'T.Quran', 'Physics']
  };

  // Fetch summary analytics (fast) by default to avoid timeouts when loading full student lists
  const fetchStudentData = React.useCallback(async (options = { loadStudents: false }) => {
    setLoading(true);
    try {
      if (!options.loadStudents) {
        // Load analytics overview which contains zone counts and campus breakdown
        const response = await api.get('/analytics/overview');
        if (response.data && response.data.success) {
          const analytics = response.data.data || {};
          const collegeStats = analytics.collegeWideStats || { green: 0, blue: 0, yellow: 0, red: 0, unassigned: 0, total: 0 };
          setZoneCounts({
            green: collegeStats.green || 0,
            blue: collegeStats.blue || 0,
            yellow: collegeStats.yellow || 0,
            red: collegeStats.red || 0,
            gray: collegeStats.unassigned || 0
          });
          setSummaryData({
            lastUpdated: analytics.lastUpdated,
            studentsProcessed: analytics.studentsProcessed,
            calculationDuration: analytics.calculationDuration
          });
          // Keep students empty to avoid rendering huge lists; allow manual load below
          setStudents([]);
          // If analytics appear empty (no students processed), fallback to compute counts from student report
          if ((collegeStats.total || 0) === 0) {
            try {
              const fallback = await api.get('/examinations/student-examination-report');
              const respStudents = fallback.data?.data || [];
              if (respStudents.length > 0) {
                const counts = respStudents.reduce((acc, s) => {
                  const c = s.cardColor || (s.zone || 'gray');
                  acc[c] = (acc[c] || 0) + 1;
                  return acc;
                }, {});
                setZoneCounts(counts);
                setSummaryData(fallback.data?.summary || null);
              }
            } catch (e) {
              // ignore fallback errors
              console.warn('Fallback student report for counts failed', e?.message || e);
            }
          }
        } else {
          throw new Error(response.data?.message || 'Failed to load analytics overview');
        }
      } else {
        // Load paginated student list using analytics/students (respects role-based access and is paginated)
        const params = {
          page: options.page || 1,
          limit: options.limit || pageSize
        };

        const response = await api.get('/analytics/students', { params });
        if (response.data && response.data.success) {
          const payload = response.data.data || {};
          const studentsPage = payload.students || [];
          setStudents(studentsPage);
          // Pagination info
          const pagination = payload.pagination || {};
          setPage(pagination.currentPage || params.page);
          setTotalPages(pagination.totalPages || 1);
          setSummaryData({
            totalStudents: pagination.totalStudents || studentsPage.length
          });
          // Ensure zone counts are present (overview already attempted); if missing, derive from page
          if (!Object.keys(zoneCounts).length && studentsPage.length > 0) {
            const counts = studentsPage.reduce((acc, s) => {
              const c = s.overallZone || 'gray';
              acc[c] = (acc[c] || 0) + 1;
              return acc;
            }, {});
            setZoneCounts(counts);
          }
        } else {
          throw new Error(response.data?.message || 'Failed to load paginated students');
        }
      }
    } catch (error) {
      console.error('Failed to fetch student examination report or analytics overview', error);
      toast.error('Failed to load examination data from server');
      setStudents([]);
      setZoneCounts({});
    } finally {
      setLoading(false);
    }
  }, [toast, pageSize, zoneCounts]);

  useEffect(() => {
    // Default to loading summary analytics for principal (faster).
    fetchStudentData();
  }, [fetchStudentData]);

  const getCardColor = (student) => {
    const colorMap = {
      'green': 'bg-green-50 border-green-200',
      'yellow': 'bg-yellow-50 border-yellow-200',
      'blue': 'bg-blue-50 border-blue-200',
      'red': 'bg-red-50 border-red-200',
      'gray': 'bg-gray-50 border-gray-200'
    };
    
    return colorMap[student.cardColor] || 'bg-gray-50 border-gray-200';
  };

  const getPerformanceTrend = (student) => {
    const trend = student.performanceTrend;
    
    const iconMap = {
      'up': TrendingUp,
      'down': TrendingDown,
      'stable': TrendingUp,
      'no-data': AlertCircle,
      'no-baseline': AlertCircle
    };
    
    const colorMap = {
      'green': 'text-green-600',
      'red': 'text-red-600',
      'gray': 'text-gray-500'
    };
    
    return {
      trend: trend.trend,
      icon: iconMap[trend.trend] || AlertCircle,
      color: colorMap[trend.color] || 'text-gray-500',
      value: trend.value
    };
  };

  const toggleCard = (studentId) => {
    setExpandedCards(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleCellDoubleClick = (studentId, examIndex, subject, currentValue) => {
    const student = students.find(s => s._id === studentId);
    const exam = student.examData[examIndex];
    
    if (exam.isEditable) {
      setEditingCell({ studentId, examIndex, subject });
      setEditValue(currentValue.toString());
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;
    
    try {
      const { studentId, examIndex, subject } = editingCell;
      const student = students.find(s => s._id === studentId);
      const exam = student.examData[examIndex];
      
      if (exam.testId) {
        await api.put(`/examinations/tests/${exam.testId}/results/${studentId}`, {
          obtainedMarks: parseFloat(editValue) || 0,
          remarks: `Updated ${subject} marks via Principal report`
        });
        
        toast.success('Marks updated successfully');
        await fetchStudentData(); // Refresh all data
      }
    } catch (error) {
      console.error('Failed to update marks:', error.message);
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid marks value');
      } else {
        toast.error('Failed to update marks');
      }
    } finally {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const calculateColumnAverage = (student, subject) => {
    const values = student.examData
      .filter(exam => exam.data[subject] && exam.data[subject] !== '-')
      .map(exam => parseFloat(exam.data[subject]) || 0);
    
    if (values.length === 0) return '-';
    
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    return average.toFixed(1) + '%';
  };

  const openPerformanceGraph = (student) => {
    setSelectedStudentForGraph(student);
    setShowPerformanceModal(true);
  };

  const closePerformanceModal = () => {
    setShowPerformanceModal(false);
    setSelectedStudentForGraph(null);
  };

  const filteredStudents = students.filter(student => {
    const fullName = `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.toLowerCase();
    const rollNumber = (student.rollNumber || '').toLowerCase();
    const program = student.admissionInfo?.program || student.program || '';
    const grade = student.admissionInfo?.grade || student.grade || '';
    
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                         rollNumber.includes(searchTerm.toLowerCase());
    const matchesProgram = selectedProgram === 'all' || program === selectedProgram;
    const matchesGrade = selectedGrade === 'all' || grade === selectedGrade;
    
    return matchesSearch && matchesProgram && matchesGrade;
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading examination data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Performance Graph Modal */}
      <PerformanceGraphModal 
        student={selectedStudentForGraph}
        isOpen={showPerformanceModal}
        onClose={closePerformanceModal}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              Student Examination Report
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive examination performance tracking with matriculation comparison
            </p>
            {summaryData?.lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">Last analytics update: {new Date(summaryData.lastUpdated).toLocaleString()}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <Users className="inline h-4 w-4 mr-1" />
              {filteredStudents.length} Students
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={async (e) => {
                e.stopPropagation();
                // Load full student list (may be large)
                await fetchStudentData({ loadStudents: true });
              }}
              className="ml-2"
            >
              Load Student List
            </Button>
          </div>
        </div>
      </div>

          {/* Zone Stats (compact) */}
          <div className="mb-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {['green','blue','yellow','red','gray'].map(zoneKey => (
                <div key={zoneKey} className="flex items-center gap-3 p-3 bg-white rounded border">
                  <div className={`h-3 w-3 rounded-full ${
                    zoneKey === 'green' ? 'bg-green-500' : zoneKey === 'blue' ? 'bg-blue-500' : zoneKey === 'yellow' ? 'bg-yellow-500' : zoneKey === 'red' ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <div className="text-sm text-gray-600 capitalize">{zoneKey}</div>
                    <div className="text-lg font-semibold text-gray-900">{zoneCounts[zoneKey] || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or roll number..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Programs</option>
                <option value="ICS">ICS</option>
                <option value="FSC">FSC</option>
                <option value="Pre Medical">Pre Medical</option>
                <option value="Pre Engineering">Pre Engineering</option>
                <option value="ICS-PHY">ICS-PHY</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Grades</option>
                <option value="11th">11th Grade</option>
                <option value="12th">12th Grade</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Student Cards */}
      <div className="space-y-4">
        {filteredStudents.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600">No students match the current filter criteria.</p>
          </Card>
        ) : (
          <>
            {/* Pagination controls for loaded students */}
            <div className="flex items-center justify-end gap-2 mb-2">
              <div className="text-sm text-gray-600">Page {page} / {totalPages}</div>
              <Button
                size="sm"
                onClick={async () => {
                  if (page > 1) {
                    await fetchStudentData({ loadStudents: true, page: page - 1, limit: pageSize });
                  }
                }}
                disabled={page <= 1}
              >
                Prev
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  if (page < totalPages) {
                    await fetchStudentData({ loadStudents: true, page: page + 1, limit: pageSize });
                  }
                }}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>

          {filteredStudents.map((student) => {
            const isExpanded = expandedCards[student._id];
            const program = student.admissionInfo?.program || student.program || 'default';
            const subjects = PROGRAM_SUBJECTS[program] || PROGRAM_SUBJECTS.default;
            const performanceTrend = getPerformanceTrend(student);
            
            return (
              <Card key={student._id} className={`${getCardColor(student)} transition-all duration-200`}>
                {/* Card Header */}
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => toggleCard(student._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {student.fullName?.firstName} {student.fullName?.lastName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Roll No: {student.rollNumber || 'N/A'}</span>
                          <span>Grade: {student.admissionInfo?.grade || student.grade || 'N/A'}</span>
                          <span>Program: {program}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Performance Trend */}
                      <div className="flex items-center gap-2">
                        <performanceTrend.icon className={`h-5 w-5 ${performanceTrend.color}`} />
                        <span className={`text-sm font-medium ${performanceTrend.color}`}>
                          {performanceTrend.value}
                        </span>
                      </div>
                      
                      {/* Current performance */}
                      {student.currentAvgPercentage && (
                        <div className="text-sm">
                          <span className="text-gray-600">Current: </span>
                          <span className="font-semibold text-gray-900">
                            {student.currentAvgPercentage}%
                          </span>
                        </div>
                      )}

                      {/* Matriculation Percentage */}
                      {student.academicRecords?.matriculation?.percentage && (
                        <div className="text-sm">
                          <span className="text-gray-600">Matric: </span>
                          <span className="font-semibold text-gray-900">
                            {student.academicRecords.matriculation.percentage}%
                          </span>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            openPerformanceGraph(student);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <BarChart3 className="h-4 w-4" />
                          Graph
                        </Button>
                        
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="p-4">
                      {/* Examination Table */}
                      <div className="overflow-x-auto">
                        {student.examData && student.examData.length > 0 ? (
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Exam Name
                                </th>
                                {subjects.map(subject => (
                                  <th key={subject} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {subject}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {student.examData.map((exam, examIndex) => (
                                <tr key={examIndex} className={examIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {exam.examName}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {exam.type === 'matriculation' ? 'Baseline' : 'Test'}
                                        </div>
                                      </div>
                                      {exam.type === 'matriculation' && (
                                        <Award className="h-4 w-4 ml-2 text-yellow-500" />
                                      )}
                                    </div>
                                  </td>
                                  {subjects.map(subject => {
                                    const cellValue = exam.data[subject] || '-';
                                    const isEditing = editingCell?.studentId === student._id && 
                                                     editingCell?.examIndex === examIndex && 
                                                     editingCell?.subject === subject;
                                    
                                    return (
                                      <td 
                                        key={subject} 
                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group"
                                        onDoubleClick={() => handleCellDoubleClick(student._id, examIndex, subject, cellValue)}
                                      >
                                        {isEditing ? (
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="number"
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              className="w-20 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              autoFocus
                                              min="0"
                                              max="100"
                                            />
                                            <button
                                              onClick={handleSaveEdit}
                                              className="text-green-600 hover:text-green-800"
                                            >
                                              <Save className="h-4 w-4" />
                                            </button>
                                            <button
                                              onClick={handleCancelEdit}
                                              className="text-red-600 hover:text-red-800"
                                            >
                                              <X className="h-4 w-4" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1">
                                            <span>{cellValue}</span>
                                            {exam.isEditable && cellValue !== '-' && (
                                              <Edit2 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                          </div>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                              
                              {/* Average Row */}
                              <tr className="bg-blue-50 font-medium">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-900">
                                  Average %
                                </td>
                                {subjects.map(subject => (
                                  <td key={subject} className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-900">
                                    {calculateColumnAverage(student, subject)}
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-center py-8">
                            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No examination data available for this student</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Table Instructions */}
                      <div className="mt-4 text-xs text-gray-500">
                        <p>💡 Double-click on any test score cell to edit marks. Matriculation marks are read-only.</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentExaminationReport;
