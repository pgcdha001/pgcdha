import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, UserCheck, GraduationCap, Filter, BarChart3, X, Move, 
  Search, Phone, Calendar, User, TrendingUp, ChevronDown, 
  RefreshCw, Download, Eye, Target
} from 'lucide-react';
import api from '../../services/api';
import {
  ENQUIRY_LEVELS,
  DATE_FILTERS,
  GENDER_OPTIONS,
  CARD_COLORS,
  API_ENDPOINTS,
  DEFAULT_SETTINGS,
  LOADING_STATES,
  VIEW_TYPES
} from '../../config/correspondenceConfig';

/**
 * Enhanced Principal Correspondence Management Component
 * Features:
 * - Advanced filtering by employee, student, date, level
 * - Student call count tracking with level breakdown
 * - Employee performance metrics
 * - Real-time data with configurable refresh
 * - Export capabilities
 * - Responsive design with floating stats
 */
const EnhancedPrincipalCorrespondenceManagement = () => {
  // Core state management
  const [selectedLevel, setSelectedLevel] = useState(DEFAULT_SETTINGS.SELECTED_LEVEL);
  const [selectedDate, setSelectedDate] = useState(DEFAULT_SETTINGS.SELECTED_DATE);
  const [currentView, setCurrentView] = useState(VIEW_TYPES.TOTAL);
  const [selectedGender, setSelectedGender] = useState(null);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.IDLE);

  // Advanced filtering state
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');

  // Custom date filter state
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customDatesApplied, setCustomDatesApplied] = useState(false);

  // Data states
  const [correspondenceData, setCorrespondenceData] = useState({
    total: 0,
    boys: 0,
    girls: 0,
    programs: { boys: {}, girls: {} },
    employeeBreakdown: {},
    studentCallCounts: {},
    levelBreakdownDetailed: {}
  });

  const [employees, setEmployees] = useState([]);
  const [searchedStudents, setSearchedStudents] = useState([]);
  const [levelStats, setLevelStats] = useState({});

  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Floating pill state
  const [pillPosition, setPillPosition] = useState({ 
    x: window.innerWidth * 0.05,
    y: window.innerHeight * 0.85
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const pillRef = useRef(null);

  // Refs for search debouncing
  const studentSearchTimeoutRef = useRef(null);
  const autoRefreshIntervalRef = useRef(null);

  // Load initial data
  const loadEmployees = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EMPLOYEES);
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  }, []);

  const loadCorrespondenceData = useCallback(async () => {
    try {
      setLoadingState(LOADING_STATES.LOADING);

      // Skip loading if custom date is selected but not applied
      if (selectedDate === 'custom' && !customDatesApplied) {
        setCorrespondenceData({
          total: 0,
          boys: 0,
          girls: 0,
          programs: { boys: {}, girls: {} },
          employeeBreakdown: {},
          studentCallCounts: {},
          levelBreakdownDetailed: {}
        });
        setLoadingState(LOADING_STATES.SUCCESS);
        return;
      }

      // Prepare query parameters
      const params = {
        minLevel: selectedLevel,
        dateFilter: selectedDate
      };

      // Add custom date parameters
      if (selectedDate === 'custom' && customStartDate && customEndDate && customDatesApplied) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      // Add employee filter
      if (selectedEmployee) {
        params.employeeId = selectedEmployee.employeeId;
      }

      // Add student filter
      if (selectedStudent) {
        params.studentId = selectedStudent._id;
      }

      const response = await api.get(API_ENDPOINTS.PRINCIPAL_STATS, { params });
      
      if (response.data && response.data.success) {
        setCorrespondenceData(response.data.data);
        setLoadingState(LOADING_STATES.SUCCESS);
      } else {
        throw new Error(response.data?.message || 'Failed to load data');
      }
    } catch (error) {
      console.error('Error loading correspondence data:', error);
      setLoadingState(LOADING_STATES.ERROR);
    }
  }, [selectedLevel, selectedDate, customStartDate, customEndDate, customDatesApplied, selectedEmployee, selectedStudent]);

  const loadLevelStatistics = useCallback(async () => {
    try {
      // Skip loading if custom date is selected but not applied
      if (selectedDate === 'custom' && !customDatesApplied) {
        return;
      }

      const params = {
        dateFilter: selectedDate
      };

      // Add custom date parameters
      if (selectedDate === 'custom' && customStartDate && customEndDate && customDatesApplied) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      // Add employee filter
      if (selectedEmployee) {
        params.employeeId = selectedEmployee.employeeId;
      }

      // Add student filter
      if (selectedStudent) {
        params.studentId = selectedStudent._id;
      }

      const response = await api.get(API_ENDPOINTS.PRINCIPAL_OVERVIEW, { params });
      
      if (response.data && response.data.success) {
        setLevelStats(response.data.data.levelBreakdown);
      }
    } catch (error) {
      console.error('Error loading level statistics:', error);
    }
  }, [selectedDate, customStartDate, customEndDate, customDatesApplied, selectedEmployee, selectedStudent]);

  useEffect(() => {
    loadEmployees();
    loadCorrespondenceData();
    loadLevelStatistics();
  }, [loadEmployees, loadCorrespondenceData, loadLevelStatistics]);

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshIntervalRef.current = setInterval(() => {
        loadCorrespondenceData();
        loadLevelStatistics();
      }, DEFAULT_SETTINGS.AUTO_REFRESH_INTERVAL);
    } else {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [autoRefresh, loadCorrespondenceData, loadLevelStatistics]);

  // Reload data when filters change
  useEffect(() => {
    loadCorrespondenceData();
    loadLevelStatistics();
  }, [selectedLevel, selectedDate, customDatesApplied, selectedEmployee, selectedStudent, loadCorrespondenceData, loadLevelStatistics]);

  // Student search debouncing
  useEffect(() => {
    if (studentSearchTimeoutRef.current) {
      clearTimeout(studentSearchTimeoutRef.current);
    }

    studentSearchTimeoutRef.current = setTimeout(() => {
      if (studentSearchQuery.trim()) {
        searchStudents(studentSearchQuery);
      } else {
        setSearchedStudents([]);
      }
    }, DEFAULT_SETTINGS.SEARCH_DEBOUNCE_TIME);

    return () => {
      if (studentSearchTimeoutRef.current) {
        clearTimeout(studentSearchTimeoutRef.current);
      }
    };
  }, [studentSearchQuery]);

  // Reset custom dates when date filter changes
  useEffect(() => {
    if (selectedDate !== 'custom') {
      setCustomDatesApplied(false);
    }
  }, [selectedDate]);

  // API Functions
  const searchStudents = async (query) => {
    try {
      const response = await api.get(API_ENDPOINTS.STUDENT_SEARCH, {
        params: { q: query, limit: DEFAULT_SETTINGS.MAX_SEARCH_RESULTS }
      });
      if (response.data.success) {
        setSearchedStudents(response.data.data);
      }
    } catch (error) {
      console.error('Error searching students:', error);
    }
  };

  // Filter handlers
  const handleApplyFilters = () => {
    if (selectedDate === 'custom') {
      if (!customStartDate || !customEndDate) {
        alert('Please select both start and end dates for custom range');
        return;
      }
      if (new Date(customStartDate) > new Date(customEndDate)) {
        alert('Start date cannot be later than end date');
        return;
      }
      setCustomDatesApplied(true);
    }
    loadLevelStatistics();
    loadCorrespondenceData();
  };

  const handleClearFilters = () => {
    setSelectedLevel(DEFAULT_SETTINGS.SELECTED_LEVEL);
    setSelectedDate(DEFAULT_SETTINGS.SELECTED_DATE);
    setCustomStartDate('');
    setCustomEndDate('');
    setCustomDatesApplied(false);
    setSelectedEmployee(null);
    setSelectedStudent(null);
    setStudentSearchQuery('');
    setEmployeeSearchQuery('');
    setSearchedStudents([]);
  };

  // View navigation handlers
  const handleCardClick = (view, gender = null) => {
    if (view === VIEW_TYPES.TOTAL) {
      setCurrentView(VIEW_TYPES.TOTAL);
      setSelectedGender(null);
    } else if (view === VIEW_TYPES.GENDER) {
      setCurrentView(VIEW_TYPES.GENDER);
      setSelectedGender(null);
    } else if (view === VIEW_TYPES.PROGRAMS) {
      setCurrentView(VIEW_TYPES.PROGRAMS);
      setSelectedGender(gender);
    } else if (view === VIEW_TYPES.EMPLOYEE_BREAKDOWN) {
      setCurrentView(VIEW_TYPES.EMPLOYEE_BREAKDOWN);
    } else if (view === VIEW_TYPES.STUDENT_BREAKDOWN) {
      setCurrentView(VIEW_TYPES.STUDENT_BREAKDOWN);
    }
  };

  const handleBackClick = () => {
    if (currentView === VIEW_TYPES.PROGRAMS || currentView === VIEW_TYPES.EMPLOYEE_BREAKDOWN || currentView === VIEW_TYPES.STUDENT_BREAKDOWN) {
      setCurrentView(VIEW_TYPES.GENDER);
      setSelectedGender(null);
    } else if (currentView === VIEW_TYPES.GENDER) {
      setCurrentView(VIEW_TYPES.TOTAL);
    }
  };

  // Export functionality
  const handleExportData = () => {
    const dataToExport = {
      filters: {
        level: selectedLevel,
        dateFilter: selectedDate,
        employee: selectedEmployee?.employeeName || 'All',
        student: selectedStudent?.name || 'All',
        customDate: selectedDate === 'custom' ? `${customStartDate} to ${customEndDate}` : null
      },
      summary: {
        totalCorrespondence: correspondenceData.total,
        totalBoys: correspondenceData.boys,
        totalGirls: correspondenceData.girls
      },
      employeeBreakdown: correspondenceData.employeeBreakdown,
      studentCallCounts: correspondenceData.studentCallCounts
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `correspondence-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Drag functionality for floating pill
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (pillRef.current) {
      setIsDragging(true);
      const rect = pillRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const maxX = window.innerWidth - 250;
      const maxY = window.innerHeight - 80;
      
      setPillPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove]);

  // Component definitions
  const CorrespondenceCard = ({ title, count, icon: Icon, color, onClick, subtitle, badge, className = '' }) => {
    const classes = CARD_COLORS[color] || CARD_COLORS.blue;

    return (
      <div
        className={`${classes.bg} ${classes.border} ${classes.hover} border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${className}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`${classes.icon} p-3 rounded-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${classes.text}`}>
              {typeof count === 'string' ? count : count.toLocaleString()}
            </div>
            {badge && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-white bg-opacity-70 rounded-full mt-1">
                {badge}
              </span>
            )}
          </div>
        </div>
        <h3 className={`text-lg font-semibold ${classes.text} mb-2`}>{title}</h3>
        <p className={`text-sm ${classes.subtitle}`}>{subtitle}</p>
      </div>
    );
  };

  const FloatingStatsPill = () => (
    <div
      ref={pillRef}
      className="fixed z-50 transition-all duration-200"
      style={{
        left: `${pillPosition.x}px`,
        top: `${pillPosition.y}px`
      }}
    >
      <div className={`p-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 ${loadingState === LOADING_STATES.LOADING ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="bg-white bg-opacity-95 backdrop-blur-md rounded-full flex items-center overflow-hidden">
          <div
            className={`px-6 py-3 flex items-center space-x-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 flex-1 ${loadingState === LOADING_STATES.LOADING ? 'cursor-not-allowed' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (loadingState !== LOADING_STATES.LOADING) {
                // Open a simple stats modal or redirect to another view
                console.log('Stats clicked - implement stats modal or redirect');
              }
            }}
          >
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">
              {loadingState === LOADING_STATES.LOADING ? 'Loading...' : 'Stats'}
            </span>
            {autoRefresh && (
              <RefreshCw className="w-4 h-4 text-green-600 animate-spin" />
            )}
          </div>
          
          <div
            className={`px-3 py-3 border-l border-gray-200 cursor-grab hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${isDragging ? 'cursor-grabbing bg-gradient-to-r from-blue-50 to-purple-50' : ''} ${loadingState === LOADING_STATES.LOADING ? 'cursor-not-allowed' : ''}`}
            onMouseDown={loadingState === LOADING_STATES.LOADING ? undefined : handleMouseDown}
            title={loadingState === LOADING_STATES.LOADING ? 'Loading data...' : 'Drag to move'}
          >
            <Move className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      {/* Floating Stats Pill */}
      <FloatingStatsPill />

      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Enhanced Correspondence Management
            </h1>
            <p className="text-gray-600 text-lg">
              Advanced Analytics & Filtering for Student Communication
            </p>
            <div className="flex items-center justify-center space-x-4 mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Phone className="w-3 h-3 mr-1" />
                Call Tracking
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                Performance Metrics
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <Target className="w-3 h-3 mr-1" />
                Advanced Filtering
              </span>
            </div>
          </div>

          {/* Auto Refresh Toggle */}
          <div className="flex justify-center mb-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Auto-refresh every 30 seconds</span>
            </label>
          </div>

          {/* Level Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {ENQUIRY_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setSelectedLevel(level.value)}
                disabled={loadingState === LOADING_STATES.LOADING}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedLevel === level.value
                    ? `${level.color} text-white shadow-lg transform scale-105`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{level.label}</span>
                  <span className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full">
                    {typeof levelStats[level.value] === 'object' && levelStats[level.value] 
                      ? levelStats[level.value].correspondence || 0 
                      : levelStats[level.value] || 0}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Basic Date Filter */}
          <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
            <span className="text-sm font-medium text-gray-700">Date Filter:</span>
            {DATE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedDate(filter.value)}
                disabled={loadingState === LOADING_STATES.LOADING}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedDate === filter.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Advanced Filters Toggle */}
          <div className="text-center mb-6">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
              <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Employee Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Employee
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                  
                  {selectedEmployee && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-800">
                          Selected: {selectedEmployee.employeeName}
                        </span>
                        <button
                          onClick={() => setSelectedEmployee(null)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Employee Dropdown */}
                  {employeeSearchQuery && !selectedEmployee && (
                    <div className="mt-1 max-h-40 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg">
                      {employees
                        .filter(emp => emp.employeeName.toLowerCase().includes(employeeSearchQuery.toLowerCase()))
                        .map(employee => (
                          <button
                            key={employee.employeeId}
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setEmployeeSearchQuery('');
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                          >
                            <div className="text-sm font-medium">{employee.employeeName}</div>
                            <div className="text-xs text-gray-500">
                              {employee.totalCalls} total calls
                            </div>
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>

                {/* Student Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Student
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                  
                  {selectedStudent && (
                    <div className="mt-2 p-2 bg-green-50 rounded-md border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-800">
                          Selected: {selectedStudent.name}
                        </span>
                        <button
                          onClick={() => setSelectedStudent(null)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Student Dropdown */}
                  {searchedStudents.length > 0 && !selectedStudent && (
                    <div className="mt-1 max-h-40 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg">
                      {searchedStudents.map(student => (
                        <button
                          key={student._id}
                          onClick={() => {
                            setSelectedStudent(student);
                            setStudentSearchQuery('');
                            setSearchedStudents([]);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                        >
                          <div className="text-sm font-medium">{student.name}</div>
                          <div className="text-xs text-gray-500">
                            {student.program} • Level {student.enquiryLevel} • {student.totalCalls} calls
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Date Range */}
                {selectedDate === 'custom' && (
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Date Range
                    </label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => {
                          setCustomStartDate(e.target.value);
                          setCustomDatesApplied(false);
                        }}
                        disabled={loadingState === LOADING_STATES.LOADING}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => {
                          setCustomEndDate(e.target.value);
                          setCustomDatesApplied(false);
                        }}
                        disabled={loadingState === LOADING_STATES.LOADING}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Filter Actions */}
              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={handleApplyFilters}
                  disabled={loadingState === LOADING_STATES.LOADING}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loadingState === LOADING_STATES.LOADING ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Applying...</span>
                    </>
                  ) : (
                    <>
                      <Filter className="w-4 h-4" />
                      <span>Apply Filters</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleClearFilters}
                  disabled={loadingState === LOADING_STATES.LOADING}
                  className="px-6 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Clear All</span>
                </button>

                <button
                  onClick={handleExportData}
                  disabled={loadingState === LOADING_STATES.LOADING}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loadingState === LOADING_STATES.LOADING && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2 text-blue-600">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium">Loading correspondence data...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 min-h-96">
          
          {/* Total Correspondence Level */}
          {currentView === VIEW_TYPES.TOTAL && (
            <div className="space-y-8">
              {/* Quick Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <CorrespondenceCard
                  title="Total Calls"
                  count={correspondenceData.total}
                  icon={Phone}
                  color="blue"
                  onClick={() => handleCardClick(VIEW_TYPES.GENDER)}
                  subtitle={`All correspondence records`}
                />
                
                <CorrespondenceCard
                  title="Boys Called"
                  count={correspondenceData.boys}
                  icon={UserCheck}
                  color="green"
                  onClick={() => handleCardClick(VIEW_TYPES.PROGRAMS, 'Boys')}
                  subtitle={`Male students contacted`}
                />
                
                <CorrespondenceCard
                  title="Girls Called"
                  count={correspondenceData.girls}
                  icon={GraduationCap}
                  color="pink"
                  onClick={() => handleCardClick(VIEW_TYPES.PROGRAMS, 'Girls')}
                  subtitle={`Female students contacted`}
                />
                
                <CorrespondenceCard
                  title="View Details"
                  count="📊"
                  icon={Eye}
                  color="purple"
                  onClick={() => handleCardClick(VIEW_TYPES.EMPLOYEE_BREAKDOWN)}
                  subtitle={`Employee & student breakdown`}
                />
              </div>
            </div>
          )}

          {/* Gender Breakdown Level */}
          {currentView === VIEW_TYPES.GENDER && (
            <div className="space-y-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Gender Breakdown</h2>
                <p className="text-gray-600">Correspondence distribution by gender</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <CorrespondenceCard
                  title="Boys Correspondence"
                  count={correspondenceData.boys}
                  icon={UserCheck}
                  color="green"
                  onClick={() => handleCardClick(VIEW_TYPES.PROGRAMS, 'Boys')}
                  subtitle={`${Math.round((correspondenceData.boys / (correspondenceData.boys + correspondenceData.girls)) * 100) || 0}% of total`}
                  badge={`${correspondenceData.boys} students`}
                />
                
                <CorrespondenceCard
                  title="Girls Correspondence"
                  count={correspondenceData.girls}
                  icon={GraduationCap}
                  color="pink"
                  onClick={() => handleCardClick(VIEW_TYPES.PROGRAMS, 'Girls')}
                  subtitle={`${Math.round((correspondenceData.girls / (correspondenceData.boys + correspondenceData.girls)) * 100) || 0}% of total`}
                  badge={`${correspondenceData.girls} students`}
                />
                
                <CorrespondenceCard
                  title="Employee Performance"
                  count={Object.keys(correspondenceData.employeeBreakdown).length}
                  icon={User}
                  color="indigo"
                  onClick={() => handleCardClick(VIEW_TYPES.EMPLOYEE_BREAKDOWN)}
                  subtitle="View individual employee stats"
                  badge="Employees"
                />
              </div>
            </div>
          )}

          {/* Programs Breakdown Level */}
          {currentView === VIEW_TYPES.PROGRAMS && selectedGender && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">{selectedGender} Programs</h2>
                <p className="text-gray-600">Program-wise breakdown for {selectedGender.toLowerCase()}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(correspondenceData.programs[selectedGender.toLowerCase()] || {}).length > 0 ? (
                  Object.entries(correspondenceData.programs[selectedGender.toLowerCase()] || {}).map(([program, count], index) => (
                    <CorrespondenceCard
                      key={program}
                      title={program}
                      count={count}
                      icon={GraduationCap}
                      color={['purple', 'orange', 'cyan', 'teal', 'indigo'][index % 5]}
                      subtitle={`${Math.round((count / correspondenceData[selectedGender.toLowerCase()]) * 100) || 0}% of ${selectedGender.toLowerCase()}`}
                      badge={`${count} students`}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500 text-lg">No program data available for {selectedGender.toLowerCase()}</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting the filters</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Employee Breakdown Level */}
          {currentView === VIEW_TYPES.EMPLOYEE_BREAKDOWN && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Employee Performance</h2>
                <p className="text-gray-600">Individual employee correspondence statistics</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(correspondenceData.employeeBreakdown).length > 0 ? (
                  Object.entries(correspondenceData.employeeBreakdown).map(([employeeName, data], index) => (
                    <CorrespondenceCard
                      key={employeeName}
                      title={employeeName}
                      count={data.totalCalls}
                      icon={User}
                      color={['blue', 'green', 'purple', 'orange', 'cyan', 'indigo', 'teal', 'pink'][index % 8]}
                      subtitle={`${data.uniqueStudentsContacted} unique students contacted`}
                      badge={`${data.totalCalls} calls`}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500 text-lg">No employee data available</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting the filters</p>
                  </div>
                )}
              </div>
              
              <div className="text-center mt-8">
                <button
                  onClick={() => handleCardClick(VIEW_TYPES.STUDENT_BREAKDOWN)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>View Student Call Counts</span>
                </button>
              </div>
            </div>
          )}

          {/* Student Breakdown Level */}
          {currentView === VIEW_TYPES.STUDENT_BREAKDOWN && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Student Call Analysis</h2>
                <p className="text-gray-600">Individual student correspondence tracking with level breakdown</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(correspondenceData.studentCallCounts).length > 0 ? (
                  Object.entries(correspondenceData.studentCallCounts)
                    .sort(([,a], [,b]) => b.totalCalls - a.totalCalls)
                    .slice(0, 12) // Show top 12 students
                    .map(([studentName, data]) => (
                      <div
                        key={studentName}
                        className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-gray-500 p-3 rounded-lg">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-gray-900">
                              {data.totalCalls}
                            </div>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                              Total Calls
                            </span>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{studentName}</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {data.program} • {data.gender}
                        </p>
                        
                        {/* Level breakdown */}
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-700 mb-1">Calls by Level:</p>
                          {Object.entries(data.levelBreakdown)
                            .filter(([, calls]) => calls > 0)
                            .map(([level, calls]) => (
                              <div key={level} className="flex justify-between text-xs">
                                <span className="text-gray-600">Level {level}:</span>
                                <span className="font-medium text-gray-900">{calls}</span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500 text-lg">No student data available</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting the filters</p>
                  </div>
                )}
              </div>
              
              {Object.entries(correspondenceData.studentCallCounts).length > 12 && (
                <div className="text-center text-sm text-gray-500">
                  Showing top 12 students. Use filters to see specific student data.
                </div>
              )}
            </div>
          )}

          {/* Back Navigation */}
          {(currentView !== VIEW_TYPES.TOTAL) && (
            <div className="text-center mt-8">
              <button
                onClick={handleBackClick}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedPrincipalCorrespondenceManagement;
