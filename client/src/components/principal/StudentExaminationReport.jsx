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
import OptimizedExaminationTab from '../../components/student-profile/OptimizedExaminationTab';

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
            <div className="text-sm text-gray-600">
              <div>Zone: {student?.overallZone || 'N/A'}</div>
              <div>Gender: {student?.gender || student?.personalInfo?.gender || 'N/A'}</div>
            </div>
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
                          <div key={test.exam || index} className="flex justify-between text-sm text-gray-700">
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
  // Check URL parameters for initial filter state
  const urlParams = new URLSearchParams(window.location.search);
  const initialZoneFilter = urlParams.get('filter') === 'red-zone' ? 'red' : 'all';
  
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // Cache all student data
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});
  // Inline editing removed in favor of embedded ExaminationTab
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedZone, setSelectedZone] = useState(initialZoneFilter);
  const [selectedGender, setSelectedGender] = useState('all');
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedStudentForGraph, setSelectedStudentForGraph] = useState(null);
  const [zoneCounts, setZoneCounts] = useState({});
  const zoneCountsRef = React.useRef(zoneCounts);
  const [summaryData, setSummaryData] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  const [recomputing, setRecomputing] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState(null); // 'boys' | 'girls'
  const [floorCounts, setFloorCounts] = useState({}); // { '11th': n, '12th': n }
  const [selectedFloor, setSelectedFloor] = useState(null); // '11th' | '12th'
  const [classCounts, setClassCounts] = useState([]); // array of { className, count, classId }
  const [campusStats, setCampusStats] = useState([]);
  const [campusZoneCounts, setCampusZoneCounts] = useState({});
  const [isStudentListCollapsed, setIsStudentListCollapsed] = useState(true); // Start collapsed
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  
  const { toast } = useToast();

  // Helper: fetch a sample of students for given filters and compute zone counts
  const computeZoneBreakdown = async (params = {}) => {
    try {
      const sampleParams = { ...params, page: 1, limit: 200 };
      const resp = await api.get('/analytics/students', { params: sampleParams });
      const sample = resp?.data?.data?.students || [];
      const zoneAgg = sample.reduce((acc, s) => { const z = s.overallZone || 'gray'; acc[z] = (acc[z] || 0) + 1; return acc; }, {});
      // remove gray/unassigned for drill display
      const zoneReduced = {
        green: zoneAgg.green || 0,
        blue: zoneAgg.blue || 0,
        yellow: zoneAgg.yellow || 0,
        red: zoneAgg.red || 0
      };
      return zoneReduced;
    } catch (err) {
      console.warn('Failed to compute zone breakdown sample', err?.message || err);
      return { green: 0, blue: 0, yellow: 0, red: 0 };
    }
  };

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
        setShowStatsPanel(true);
        // Load analytics overview which contains zone counts and campus breakdown
        const response = await api.get('/analytics/overview');
        if (response.data && response.data.success) {
          const analytics = response.data.data || {};
          let cs = analytics.campusStats || [];
          // If server returned empty campusStats (zeros), compute a lightweight fallback
          const zeroTotals = (arr) => !arr || arr.length === 0 || arr.every(c => {
            const total = Object.values(c.campusZoneDistribution || {}).reduce((s,v)=>s+(v||0),0);
            return total === 0;
          });
          if (zeroTotals(cs)) {
            try {
              const fallback = [];
              for (const campusName of ['Boys','Girls']) {
                // Count total students for campus
                const campusResp = await api.get('/analytics/students', { params: { campus: campusName, page: 1, limit: 1 } });
                const campusTotal = campusResp?.data?.data?.pagination?.totalStudents || 0;
                // Count per grade
                const grades = ['11th','12th'];
                const gradeStats = [];
                for (const grade of grades) {
                  const gradeResp = await api.get('/analytics/students', { params: { campus: campusName, grade, page: 1, limit: 1 } });
                  const gradeTotal = gradeResp?.data?.data?.pagination?.totalStudents || 0;
                  // For classes, we will attempt to read class names from the students page (first page) to approximate counts per class
                  const classMap = {};
                  const sampleResp = await api.get('/analytics/students', { params: { campus: campusName, grade, page: 1, limit: 50 } });
                  const sampleStudents = sampleResp?.data?.data?.students || [];
                  sampleStudents.forEach(s => { if (s.class) classMap[s.class] = (classMap[s.class] || 0) + 1; });
                  gradeStats.push({ gradeName: grade, gradeZoneDistribution: { total: gradeTotal }, classStats: Object.entries(classMap).map(([name, cnt]) => ({ className: name, classZoneDistribution: { total: cnt } })) });
                }
                fallback.push({ campusName, campusZoneDistribution: { total: campusTotal }, gradeStats });
              }
              cs = fallback;
            } catch (err) {
              console.warn('Fallback campus stats computation failed', err?.message || err);
            }
          }
          setCampusStats(cs);
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
        } else {
          throw new Error(response.data?.message || 'Failed to load analytics overview');
        }
      } else {
        setShowStatsPanel(false);
        // Use the new optimized endpoint that consolidates all data
        const params = {
          page: options.page || 1,
          limit: options.limit || pageSize,
          // allow explicit overrides from caller to avoid relying on stale hook values
          zone: (options.zone !== undefined) ? (options.zone === 'all' ? undefined : options.zone) : (selectedZone !== 'all' ? selectedZone : undefined),
          gender: (options.gender !== undefined) ? (options.gender === 'all' ? undefined : options.gender) : (selectedGender !== 'all' ? selectedGender : undefined),
        };
        
        // Accept filter overrides from caller (campus / grade / classId)
        if (options.campus) params.campus = options.campus;
        if (options.grade) params.grade = options.grade;
        if (options.classId) params.classId = options.classId;

        // Use optimized endpoint with 2 minute timeout
        const axiosConfig = { params, timeout: 120000 };
        const response = await api.get('/examinations/student-examination-report-optimized', axiosConfig);
        
        if (response.data && response.data.success) {
          const payload = response.data.data || {};
          const studentsData = payload.students || [];
          
          setStudents(studentsData);
          
          // Cache all students data for client-side filtering
          if ((!options.zone || options.zone === 'all') && 
              (!options.gender || options.gender === 'all') && 
              !options.campus && !options.grade && !options.classId) {
            // Only cache if this is an unfiltered request (all students)
            setAllStudents(studentsData);
          }
          
          // Pagination info
          const pagination = payload.pagination || {};
          setPage(pagination.currentPage || params.page);
          setTotalPages(pagination.totalPages || 1);
          setSummaryData({
            totalStudents: pagination.totalStudents || studentsData.length
          });
          
          // Update zone counts from received data if not already set
          if (!Object.keys(zoneCountsRef.current || {}).length && studentsData.length > 0) {
            const counts = studentsData.reduce((acc, s) => {
              const c = s.overallZone || 'gray';
              acc[c] = (acc[c] || 0) + 1;
              return acc;
            }, {});
            setZoneCounts(counts);
          }
        } else {
          throw new Error(response.data?.message || 'Failed to load students');
        }
      }
    } catch (error) {
      console.error('Failed to fetch student examination report:', error);
      toast.error('Failed to load examination data from server');
      setStudents([]);
      setZoneCounts({});
    } finally {
      setLoading(false);
    }
  }, [toast, pageSize, selectedZone, selectedGender]); // Added back required dependencies

  // Apply filters when any filter state changes
  React.useEffect(() => {
    if (!studentsLoaded || allStudents.length === 0) return;

    let filteredStudents = [...allStudents];

    // Apply zone filter
    if (selectedZone !== 'all') {
      filteredStudents = filteredStudents.filter(student => {
        // Try multiple possible zone field locations
        const zoneVal = student.overallZone || 
                       student.zone || 
                       student.analytics?.overallZone || 
                       student.analytics?.zone ||
                       'gray';
        
        if (selectedZone === 'unassigned') {
          return !zoneVal || zoneVal === 'gray' || zoneVal === null || zoneVal === undefined;
        }
        
        return zoneVal === selectedZone;
      });
    }

    // Apply gender filter
    if (selectedGender !== 'all') {
      filteredStudents = filteredStudents.filter(student => {
        const gender = student.admissionInfo?.gender || student.gender || '';
        return gender.toLowerCase() === selectedGender.toLowerCase();
      });
    }

    // Apply search term filter
    if (searchTerm) {
      filteredStudents = filteredStudents.filter(student => {
        const term = searchTerm.toLowerCase();
        return (
          (student.name || '').toLowerCase().includes(term) ||
          (student.rollNumber || '').toLowerCase().includes(term) ||
          (student.admissionInfo?.fatherName || student.fatherName || '').toLowerCase().includes(term)
        );
      });
    }

    // Apply grade filter
    if (selectedGrade !== 'all') {
      filteredStudents = filteredStudents.filter(student => {
        const grade = student.admissionInfo?.grade || student.grade || '';
        return grade === selectedGrade;
      });
    }

    // Apply program filter
    if (selectedProgram !== 'all') {
      filteredStudents = filteredStudents.filter(student => {
        const program = student.admissionInfo?.program || student.program || '';
        return program === selectedProgram;
      });
    }

    // Calculate pagination
    const totalStudents = filteredStudents.length;
    const totalPagesCalc = Math.ceil(totalStudents / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

    setStudents(paginatedStudents);
    setTotalPages(totalPagesCalc);
    
    // Update summary with filtered count
    setSummaryData(prev => ({
      ...prev,
      totalStudents: filteredStudents.length
    }));
  }, [selectedZone, selectedGender, searchTerm, selectedGrade, selectedProgram, studentsLoaded, allStudents, page, pageSize]);

  // Reset page to 1 when filters change (except page itself)
  React.useEffect(() => {
    if (studentsLoaded) {
      setPage(1);
    }
  }, [selectedZone, selectedGender, searchTerm, selectedGrade, selectedProgram, studentsLoaded]);
  React.useEffect(() => {
    if (studentsLoaded) {
      setPage(1);
    }
  }, [selectedZone, selectedGender, searchTerm, selectedGrade, selectedProgram, studentsLoaded]);

  // keep ref in sync (separate effect so hooks are used at top-level)
  React.useEffect(() => {
    zoneCountsRef.current = zoneCounts;
  }, [zoneCounts]);

  useEffect(() => {
    // Default to loading summary analytics for principal (faster).
    // If red zone filter is set from URL, also load student data
    if (initialZoneFilter === 'red') {
      // Load both summary and student data for red zone filtering
      fetchStudentData().then(() => {
        fetchStudentData({ loadStudents: true, zone: 'red', page: 1 });
      });
    } else {
      // Auto-load overview and then students
      const loadData = async () => {
        // First load overview
        await fetchStudentData();
        // Then auto-load all students without filters for caching
        setTimeout(async () => {
          await fetchStudentData({ 
            loadStudents: true, 
            page: 1, 
            limit: 1000, // Load all students for client-side filtering
            zone: 'all',
            gender: 'all'
          });
          setStudentsLoaded(true);
          setIsStudentListCollapsed(false); // Expand student list after loading
        }, 500); // Small delay to let overview load first
      };
      loadData();
    }
  }, [fetchStudentData, initialZoneFilter, pageSize]);

  // Defensive: block any unexpected form submissions on the page while this component is mounted.
  // Some browsers or parent layouts may still trigger a submit; capture and prevent to avoid full-page reloads.
  useEffect(() => {
    const onSubmitCapture = (e) => {
      try {
        console.warn('Blocked unexpected form submit from', e.target);
      } catch (err) {
        console.warn('Error in submit capture handler', err);
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    };

    document.addEventListener('submit', onSubmitCapture, true);
    return () => document.removeEventListener('submit', onSubmitCapture, true);
  }, []);

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
    // Defensive: some student objects may not have performanceTrend
  const trend = student.performanceTrend || { trend: 'no-data', color: 'gray', value: '-' };

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

    const trendKey = typeof trend.trend === 'string' ? trend.trend : 'no-data';
    const colorKey = typeof trend.color === 'string' ? trend.color : 'gray';

    return {
      trend: trendKey,
      icon: iconMap[trendKey] || AlertCircle,
      color: colorMap[colorKey] || 'text-gray-500',
  value: (trend.value !== undefined && trend.value !== null) ? trend.value : '-'
    };
  };

  const toggleCard = (studentId) => {
    setExpandedCards(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  // Editing and inline table helpers removed: principal now embeds the student `ExaminationTab` for consistent UI

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
    // Zone filter: support 'unassigned' which maps to missing/gray zones
    const zoneVal = student.overallZone || student.cardColor || 'gray';
    const matchesZone = selectedZone === 'all' || (
      selectedZone === 'unassigned' ? (!student.overallZone || zoneVal === 'gray') : (zoneVal === selectedZone)
    );

    // Gender filter: check common locations
    const genderVal = (student.gender || student.personalInfo?.gender || student.admissionInfo?.gender || '').toString().toLowerCase();
    const matchesGender = selectedGender === 'all' || (genderVal === selectedGender);

    return matchesSearch && matchesProgram && matchesGrade && matchesZone && matchesGender;
  });

  // Helper to robustly obtain matriculation percentage for display
  const getMatricPercentage = (student) => {
    // Try common fields first
    const numeric = (v) => (v === undefined || v === null) ? null : Number(v);
    const candidatePaths = [
      student.academicRecords?.matriculation?.percentage,
      student.matriculation?.percentage,
      student.matricPercentage,
      student.analytics?.matriculationPercentage,
      student.matriculationPercentage
    ];
    for (const c of candidatePaths) {
      const n = numeric(c);
      if (!isNaN(n) && n !== null) return n;
    }
    // Fallback: attempt to derive from examData entries of type 'matriculation'
    if (Array.isArray(student.examData)) {
      const marks = [];
      student.examData.forEach(ex => {
        if (ex.type === 'matriculation' && ex.data) {
          Object.values(ex.data).forEach(v => { const nv = numeric(v); if (!isNaN(nv)) marks.push(nv); });
        }
      });
      if (marks.length > 0) {
        const avg = marks.reduce((s, x) => s + x, 0) / marks.length;
        return Math.round(avg * 10) / 10;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col justify-center items-center min-h-screen">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Examination Data</h3>
              <p className="text-gray-600 mb-4">
                {showStatsPanel ? 
                  'Loading analytics overview...' : 
                  'Fetching student examination reports...'
                }
              </p>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full animate-pulse w-3/4"></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Loading Overlay for filter changes */}
      {loading && !showStatsPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-3"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Applying Filters</h3>
              <p className="text-gray-600 text-sm">Loading filtered student data...</p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Graph Modal */}
      <PerformanceGraphModal 
        student={selectedStudentForGraph}
        isOpen={showPerformanceModal}
        onClose={closePerformanceModal}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="h-7 w-7 text-blue-600" />
              Student Examination Report
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive examination performance tracking with matriculation comparison
            </p>
            {summaryData?.lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last analytics update: {new Date(summaryData.lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
              <Users className="inline h-4 w-4 mr-1" />
              {studentsLoaded ? `${filteredStudents.length} Students` : 'Loading Students...'}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async (e) => {
                e.stopPropagation();
                // Clear all UI filters and reset drill selections
                setSearchTerm('');
                setSelectedProgram('all');
                setSelectedGrade('all');
                setSelectedZone('all');
                setSelectedGender('all');
                setSelectedCampus(null);
                setSelectedFloor(null);
                setClassCounts([]);
                setCampusZoneCounts({});
                // Re-fetch all students without filters
                await fetchStudentData({ loadStudents: true, page: 1, limit: pageSize, zone: 'all', gender: 'all' });
              }}
            >
              <Filter className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async (e) => {
                e.stopPropagation();
                if (recomputing) return;
                const confirm = window.confirm('Recompute analytics for all students? This may take several minutes.');
                if (!confirm) return;
                try {
                  setRecomputing(true);
                  toast.info('Triggering analytics recalculation...');
                  await api.post('/analytics/calculate/all', { academicYear: '2024-2025' });
                  await api.post('/analytics/refresh/statistics', { academicYear: '2024-2025' });
                  toast.success('Analytics recalculation completed. Refreshing overview...');
                  await fetchStudentData();
                } catch (err) {
                  console.error('Failed to recompute analytics:', err?.message || err);
                  toast.error('Failed to trigger analytics recalculation');
                } finally {
                  setRecomputing(false);
                }
              }}
              disabled={recomputing}
            >
              {recomputing ? 'Recomputing...' : 'Recompute Analytics'}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6">
        {/* Zone Stats (compact) */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Performance Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['green','blue','yellow','red'].map(zoneKey => {
              // prefer scoped counts (campus/grade/class) when available
              const hasScoped = campusZoneCounts && Object.values(campusZoneCounts).some(v => v > 0);
              const counts = hasScoped ? campusZoneCounts : zoneCounts;
              const colorClass = zoneKey === 'green' ? 'bg-green-500' : zoneKey === 'blue' ? 'bg-blue-500' : zoneKey === 'yellow' ? 'bg-yellow-500' : 'bg-red-500';
              const bgClass = zoneKey === 'green' ? 'bg-green-50' : zoneKey === 'blue' ? 'bg-blue-50' : zoneKey === 'yellow' ? 'bg-yellow-50' : 'bg-red-50';
              return (
                <div key={zoneKey} className={`p-4 rounded-lg border ${bgClass} transition-all hover:shadow-md`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-4 w-4 rounded-full ${colorClass}`} />
                    <div>
                      <div className="text-sm font-medium text-gray-700 capitalize">{zoneKey} Zone</div>
                      <div className="text-2xl font-bold text-gray-900">{counts?.[zoneKey] || 0}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* show gray as a separate tile only when no campus drill is active */}
            {!selectedCampus && (
              <div className="p-4 rounded-lg border bg-gray-50 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Unassigned</div>
                    <div className="text-2xl font-bold text-gray-900">{zoneCounts.gray || 0}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Campus -> Grade -> Class Stats Drill (shown when not loading students) */}
        {showStatsPanel && (!students || students.length === 0) && (
          <Card className="mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Campus / Grade / Class Breakdown
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Campus list */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-3">Campus</div>
                  <div className="space-y-2">
                    {campusStats.map(c => (
                      <button
                        key={c.campusName}
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          setSelectedCampus(c.campusName);
                          setSelectedFloor(null);
                          setClassCounts([]);
                          // populate floor counts from provided data if available
                          const floors = {};
                          (c.gradeStats || []).forEach(g => { floors[g.gradeName] = (floors[g.gradeName] || 0) + (g.gradeZoneDistribution?.total || 0); });
                          setFloorCounts(floors);
                          // additionally fetch a sample of students to compute zone breakdown per campus (like the top tiles)
                          try {
                            const resp = await api.get('/analytics/students', { params: { campus: c.campusName, page: 1, limit: 200 } });
                            const studentsSample = resp?.data?.data?.students || [];
                            const zoneAgg = studentsSample.reduce((acc, s) => { const z = s.overallZone || 'gray'; acc[z] = (acc[z] || 0) + 1; return acc; }, {});
                            // remove gray/unassigned for campus drill display
                            const zoneReduced = {
                              green: zoneAgg.green || 0,
                              blue: zoneAgg.blue || 0,
                              yellow: zoneAgg.yellow || 0,
                              red: zoneAgg.red || 0
                            };
                            // store reduced campus zone counts separately (do not overwrite top-level zoneCounts)
                            setCampusZoneCounts(zoneReduced);
                          } catch (err) {
                            console.warn('Failed to fetch campus students for zone breakdown', err?.message || err);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                          selectedCampus === c.campusName ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-900">{c.campusName}</div>
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Floor (grade) list */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-3">Grade</div>
                  <div className="space-y-2">
                    {Object.keys(floorCounts).length === 0 ? (
                      <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg text-center">
                        Select a campus to view grades
                      </div>
                    ) : (
                      Object.keys(floorCounts).map((floor) => (
                        <button
                          key={floor}
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            setSelectedFloor(floor);
                            // find classes from campusStats
                            const campus = campusStats.find(cs => cs.campusName === selectedCampus);
                            const grade = campus?.gradeStats?.find(g => g.gradeName === floor);
                            // Build an array of class objects with name, count and classId if available
                            const classesArr = (grade?.classStats || []).map(cl => ({
                              className: cl.className,
                              count: (cl.classZoneDistribution?.total || 0),
                              classId: cl.classId || null
                            }));
                            setClassCounts(classesArr);
                            // compute zone breakdown for this grade and update tiles
                            const zones = await computeZoneBreakdown({ campus: selectedCampus, grade: floor });
                            setCampusZoneCounts(zones);
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                            selectedFloor === floor ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-900">{floor}</div>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          </div>
                        </button>
                        ))
                    )}
                  </div>
                </div>

                {/* Class list */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-3">Class</div>
                  <div className="space-y-2">
                    {(!classCounts || classCounts.length === 0) ? (
                      <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg text-center">
                        Select a grade to view classes
                      </div>
                    ) : (
                      classCounts.map(cl => (
                        <button
                          key={cl.classId || cl.className}
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            if (cl.classId) {
                              // load students filtered by class
                              await fetchStudentData({ loadStudents: true, classId: cl.classId, campus: selectedCampus });
                              setStudentsLoaded(true);
                              setIsStudentListCollapsed(false); // Auto-expand to show results
                              // update zone tiles to reflect this class
                              const zones = await computeZoneBreakdown({ classId: cl.classId });
                              setCampusZoneCounts(zones);
                            } else {
                              // fallback: pass className as classId so server can resolve
                              // the class by name (and optional campus/grade) and return
                              // students for that specific class only.
                              await fetchStudentData({ loadStudents: true, classId: cl.className, campus: selectedCampus, grade: selectedFloor, page: 1 });
                              setStudentsLoaded(true);
                              setIsStudentListCollapsed(false); // Auto-expand to show results
                              // update zone tiles to reflect this class (resolve by name)
                              const zones = await computeZoneBreakdown({ classId: cl.className, campus: selectedCampus, grade: selectedFloor });
                              setCampusZoneCounts(zones);
                            }
                          }}
                          className="w-full text-left p-3 rounded-lg border bg-white border-gray-200 transition-all hover:shadow-md hover:bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-900">{cl.className}</div>
                            <Users className="h-4 w-4 text-gray-400" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                Filters
              </h3>
              {(searchTerm || selectedProgram !== 'all' || selectedGrade !== 'all' || selectedZone !== 'all' || selectedGender !== 'all') && (
                <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Filters Active
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or roll number..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="all">All Grades</option>
                  <option value="11th">11th Grade</option>
                  <option value="12th">12th Grade</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
                <select
                  value={selectedZone}
                  onChange={async (e) => {
                    e.preventDefault();
                    const val = e.target.value;
                    setSelectedZone(val);
                    // Client-side filtering will be triggered by useEffect
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="all">All Zones</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="yellow">Yellow</option>
                  <option value="red">Red</option>
                  <option value="unassigned">Unassigned</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  value={selectedGender}
                  onChange={async (e) => {
                    e.preventDefault();
                    const val = e.target.value;
                    setSelectedGender(val);
                    // Client-side filtering will be triggered by useEffect
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Student Cards */}
        <div className="space-y-4">
          {studentsLoaded && filteredStudents.length > 0 && (
            <>
              {/* Student List Header - Collapsible */}
              <div className="bg-white rounded-lg border">
                <button
                  type="button"
                  onClick={() => setIsStudentListCollapsed(!isStudentListCollapsed)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Student List
                    </h3>
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
                    </span>
                    {(searchTerm || selectedProgram !== 'all' || selectedGrade !== 'all' || selectedZone !== 'all' || selectedGender !== 'all') && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Filtered
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Pagination controls for loaded students */}
                    {totalPages > 1 && !isStudentListCollapsed && (
                      <div className="flex items-center gap-3 mr-4">
                        <div className="text-sm text-gray-600">
                          Page {page} of {totalPages}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (page > 1) {
                                setPage(page - 1);
                              }
                            }}
                            disabled={page <= 1 || loading}
                          >
                            Previous
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (page < totalPages) {
                                setPage(page + 1);
                              }
                            }}
                            disabled={page >= totalPages || loading}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Collapse/Expand Icon */}
                    {isStudentListCollapsed ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>
                
                {/* Collapsible Student List Content */}
                {!isStudentListCollapsed && (
                  <div className="border-t border-gray-200">
                    <div className="p-4 space-y-4">
                      {filteredStudents.map((student) => {
                        const isExpanded = expandedCards[student._id];
                        const program = student.admissionInfo?.program || student.program || 'Not specified';
                        const performanceTrend = getPerformanceTrend(student);
                        
                        return (
                          <Card key={student._id} className={`${getCardColor(student)} transition-all duration-200 hover:shadow-md`}>
                            {/* Card Header */}
                            <div 
                              className="p-6 cursor-pointer"
                              onClick={() => toggleCard(student._id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                      {student.fullName?.firstName} {student.fullName?.lastName}
                                      {student.fatherName && (
                                        <span className="text-sm text-gray-600 font-normal ml-3">(Father: {student.fatherName})</span>
                                      )}
                                    </h3>
                                    <div className="flex items-center gap-6 text-sm text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <strong>Roll:</strong> {student.rollNumber || 'N/A'}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <strong>Grade:</strong> {student.admissionInfo?.grade || student.grade || 'N/A'}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <strong>Program:</strong> {program}
                                      </span>
                                      {student.class && (
                                        <span className="flex items-center gap-1">
                                          <strong>Class:</strong> {student.class}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                  {/* Performance Trend */}
                                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border">
                                    <performanceTrend.icon className={`h-5 w-5 ${performanceTrend.color}`} />
                                    <span className={`text-sm font-medium ${performanceTrend.color}`}>
                                      {performanceTrend.value}
                                    </span>
                                  </div>
                                  
                                  {/* Current performance */}
                                  {student.currentAvgPercentage && (
                                    <div className="text-center bg-white px-3 py-2 rounded-lg border">
                                      <div className="text-xs text-gray-600">Current</div>
                                      <div className="text-sm font-semibold text-gray-900">
                                        {student.currentAvgPercentage}%
                                      </div>
                                    </div>
                                  )}

                                  {/* Matriculation Percentage (robust fallback) */}
                                  {(() => {
                                    const m = getMatricPercentage(student);
                                    return m !== null ? (
                                      <div className="text-center bg-white px-3 py-2 rounded-lg border">
                                        <div className="text-xs text-gray-600">Matric</div>
                                        <div className="text-sm font-semibold text-gray-900">{m}%</div>
                                      </div>
                                    ) : null;
                                  })()}
                                  
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
                              <div className="border-t border-gray-200 bg-gray-50">
                                <div className="p-6">
                                  {/* Use the optimized examination tab with pre-loaded data */}
                                  <OptimizedExaminationTab studentData={student} />
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* No Students Found Message */}
          {studentsLoaded && filteredStudents.length === 0 && (
            <Card className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600">No students match the current filter criteria.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedProgram('all');
                  setSelectedGrade('all');
                  setSelectedZone('all');
                  setSelectedGender('all');
                }}
                className="mt-4"
              >
                Reset Filters
              </Button>
            </Card>
          )}

          {/* Loading Students Message */}
          {!studentsLoaded && (
            <Card className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Students</h3>
              <p className="text-gray-600">Fetching student examination data...</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentExaminationReport;
