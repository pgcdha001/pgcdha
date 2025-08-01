import React, { useState, useEffect, Fragment, useRef } from 'react';
import { MessageSquare, TrendingUp, Users, Phone, Clock, RefreshCw, Search, User, ChevronLeft, ChevronRight, Eye, X, Calendar, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const AdminCorrespondenceManagement = () => {
  const [correspondences, setCorrespondences] = useState([]);
  const [allCorrespondences, setAllCorrespondences] = useState([]); // Keep original data
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(null); // null means show all
  const [selectedEmployee, setSelectedEmployee] = useState(null); // null means show all staff
  const [searchTerm, setSearchTerm] = useState(''); // search across communications
  const [levelStats, setLevelStats] = useState({});
  const [employeeStats, setEmployeeStats] = useState({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can make this configurable
  
  // Student details modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentCorrespondences, setStudentCorrespondences] = useState([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  
  // Time filter state
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all');
  const [showTimeFilter, setShowTimeFilter] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [pendingTimeFilter, setPendingTimeFilter] = useState('all');
  const [pendingStartDate, setPendingStartDate] = useState('');
  const [pendingEndDate, setPendingEndDate] = useState('');
  
  const { showToast } = useToast();
  const timeFilterRef = useRef(null);
  const dropdownRef = useRef(null);

  // Click outside handler for time filter dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (timeFilterRef.current && !timeFilterRef.current.contains(event.target) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTimeFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch correspondence data (Admin sees ALL correspondence)
  const fetchCorrespondences = async () => {
    try {
      setLoading(true);
      
      // Always fetch all data - filtering happens client-side
      const response = await api.get('/correspondence');
      
      if (response.data.success) {
        const allData = response.data.data || [];
        setAllCorrespondences(allData);
        
        // Reapply current filters after loading new data
        const dateRange = getDateRange(selectedTimeFilter);
        
        // Apply all current filters to the new data
        let filtered = [...allData];
        
        // Apply level filter
        if (selectedLevel) {
          filtered = filtered.filter(item => item.studentLevel === selectedLevel);
        }

        // Apply employee filter
        if (selectedEmployee) {
          filtered = filtered.filter(item => item.staffMember?._id === selectedEmployee);
        }

        // Apply search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          filtered = filtered.filter(item => {
            const studentName = `${item.studentId?.fullName?.firstName || ''} ${item.studentId?.fullName?.lastName || ''}`.toLowerCase();
            const subject = (item.subject || '').toLowerCase();
            const message = (item.message || '').toLowerCase();
            const staffName = (item.staffMember?.name || '').toLowerCase();
            
            return studentName.includes(searchLower) ||
                   subject.includes(searchLower) ||
                   message.includes(searchLower) ||
                   staffName.includes(searchLower);
          });
        }

        // Apply time filter
        if (selectedTimeFilter !== 'all' && dateRange.start && dateRange.end) {
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= dateRange.start && itemDate <= dateRange.end;
          });
        }
        
        setCorrespondences(filtered);
        
        // Calculate level-specific stats
        const levelBreakdown = {};
        for (let level = 1; level <= 5; level++) {
          const levelData = allData.filter(item => item.studentLevel === level);
          levelBreakdown[level] = {
            total: levelData.length,
            unique: new Set(levelData.map(item => item.studentId?._id)).size,
            levelChanges: levelData.filter(item => item.isLevelChange).length,
            general: levelData.filter(item => !item.isLevelChange).length
          };
        }
        setLevelStats(levelBreakdown);

        // Calculate employee-specific stats
        const employeeBreakdown = {};
        allData.forEach(item => {
          const staffName = item.staffMember?.name || 'Unknown Staff';
          const staffId = item.staffMember?.id || 'unknown';
          
          if (!employeeBreakdown[staffId]) {
            employeeBreakdown[staffId] = {
              name: staffName,
              role: item.staffMember?.role || 'Unknown',
              total: 0,
              unique: new Set(),
              levelChanges: 0,
              general: 0,
              byLevel: {}
            };
          }
          
          employeeBreakdown[staffId].total++;
          employeeBreakdown[staffId].unique.add(item.studentId?._id);
          
          if (item.isLevelChange) {
            employeeBreakdown[staffId].levelChanges++;
          } else {
            employeeBreakdown[staffId].general++;
          }
          
          // Track by level
          const level = item.studentLevel;
          if (!employeeBreakdown[staffId].byLevel[level]) {
            employeeBreakdown[staffId].byLevel[level] = 0;
          }
          employeeBreakdown[staffId].byLevel[level]++;
        });

        // Convert unique sets to counts
        Object.keys(employeeBreakdown).forEach(staffId => {
          employeeBreakdown[staffId].uniqueCount = employeeBreakdown[staffId].unique.size;
          delete employeeBreakdown[staffId].unique;
        });

        setEmployeeStats(employeeBreakdown);
      } else {
        showToast('Failed to fetch correspondence data', 'error');
      }
    } catch (error) {
      console.error('Error fetching correspondences:', error);
      showToast('Error loading correspondence data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrespondences();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    fetchCorrespondences();
  };

  const handleTimeFilterToggle = () => {
    if (!showTimeFilter) {
      // Initialize pending values with current values
      setPendingTimeFilter(selectedTimeFilter);
      setPendingStartDate(customStartDate);
      setPendingEndDate(customEndDate);
    }
    setShowTimeFilter(!showTimeFilter);
  };

  const handleLevelFilter = (level) => {
    if (selectedLevel === level) {
      // If clicking the same level, show all
      setSelectedLevel(null);
      const dateRange = getDateRange(selectedTimeFilter);
      applyAllFilters(null, selectedEmployee, searchTerm, selectedTimeFilter, dateRange);
    } else {
      // Filter by selected level
      setSelectedLevel(level);
      const dateRange = getDateRange(selectedTimeFilter);
      applyAllFilters(level, selectedEmployee, searchTerm, selectedTimeFilter, dateRange);
    }
  };

  const handleEmployeeFilter = (employeeId) => {
    if (selectedEmployee === employeeId) {
      // If clicking the same employee, show all
      setSelectedEmployee(null);
      const dateRange = getDateRange(selectedTimeFilter);
      applyAllFilters(selectedLevel, null, searchTerm, selectedTimeFilter, dateRange);
    } else {
      // Filter by selected employee
      setSelectedEmployee(employeeId);
      const dateRange = getDateRange(selectedTimeFilter);
      applyAllFilters(selectedLevel, employeeId, searchTerm, selectedTimeFilter, dateRange);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    const dateRange = getDateRange(selectedTimeFilter);
    applyAllFilters(selectedLevel, selectedEmployee, term, selectedTimeFilter, dateRange);
  };

  // Time filter utility functions
  const getTimeFilterLabel = (filter) => {
    const labels = {
      all: 'All Time',
      today: 'Today',
      week: 'This Week',
      month: 'This Month',
      year: 'This Year',
      custom: 'Custom Range'
    };
    return labels[filter] || 'All Time';
  };

  const getDateRange = (filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today': {
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      }
      case 'week': {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        return { start: weekStart, end: weekEnd };
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return { start: monthStart, end: monthEnd };
      }
      case 'year': {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        return { start: yearStart, end: yearEnd };
      }
      case 'custom': {
        return {
          start: customStartDate ? new Date(customStartDate) : null,
          end: customEndDate ? new Date(customEndDate + 'T23:59:59') : null
        };
      }
      default:
        return { start: null, end: null };
    }
  };

  const applyTimeFilter = () => {
    const dateRange = getDateRange(pendingTimeFilter);
    
    // Update active filters
    setSelectedTimeFilter(pendingTimeFilter);
    setCustomStartDate(pendingStartDate);
    setCustomEndDate(pendingEndDate);
    
    // Apply all filters including time
    applyAllFilters(selectedLevel, selectedEmployee, searchTerm, pendingTimeFilter, dateRange);
    
    // Close dropdown
    setShowTimeFilter(false);
  };

  const applyAllFilters = (level, employeeId, search, timeFilter, dateRange, resetPage = true) => {
    let filtered = [...allCorrespondences];

    // Apply level filter
    if (level) {
      filtered = filtered.filter(item => item.studentLevel === level);
    }

    // Apply employee filter
    if (employeeId) {
      filtered = filtered.filter(item => item.staffMember?._id === employeeId);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item => {
        const studentName = `${item.studentId?.fullName?.firstName || ''} ${item.studentId?.fullName?.lastName || ''}`.toLowerCase();
        const subject = (item.subject || '').toLowerCase();
        const message = (item.message || '').toLowerCase();
        const staffName = (item.staffMember?.name || '').toLowerCase();
        
        return studentName.includes(searchLower) ||
               subject.includes(searchLower) ||
               message.includes(searchLower) ||
               staffName.includes(searchLower);
      });
    }

    // Apply time filter
    if (timeFilter !== 'all' && dateRange.start && dateRange.end) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= dateRange.start && itemDate <= dateRange.end;
      });
    }

    setCorrespondences(filtered);
    
    // Reset to first page when filters change
    if (resetPage) {
      setCurrentPage(1);
    }
  };

  // Get unique students with their most recent correspondence
  const getUniqueStudentsWithLatestCorrespondence = (correspondenceData) => {
    const studentMap = new Map();
    
    // Group correspondences by student ID and keep track of all correspondences per student
    correspondenceData.forEach(correspondence => {
      const studentId = correspondence.studentId?._id;
      if (!studentId) return;
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student: correspondence.studentId,
          correspondences: [],
          latestCorrespondence: correspondence,
          latestTimestamp: new Date(correspondence.timestamp)
        });
      }
      
      const studentData = studentMap.get(studentId);
      studentData.correspondences.push(correspondence);
      
      // Update latest correspondence if this one is more recent
      const currentTimestamp = new Date(correspondence.timestamp);
      if (currentTimestamp > studentData.latestTimestamp) {
        studentData.latestCorrespondence = correspondence;
        studentData.latestTimestamp = currentTimestamp;
      }
    });
    
    // Convert map to array and sort by latest correspondence timestamp (most recent first)
    return Array.from(studentMap.values())
      .sort((a, b) => b.latestTimestamp - a.latestTimestamp)
      .map(studentData => ({
        studentId: studentData.student,
        latestCorrespondence: studentData.latestCorrespondence,
        totalCorrespondences: studentData.correspondences.length,
        allStudentCorrespondences: studentData.correspondences.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        )
      }));
  };

  const handleViewStudentDetails = (studentId) => {
    // Find the student data from uniqueStudents
    const studentData = uniqueStudents.find(student => student.studentId._id === studentId);
    if (studentData) {
      setSelectedStudent(studentData.studentId);
      setStudentCorrespondences(studentData.allStudentCorrespondences);
      setShowStudentModal(true);
    }
  };

  const closeStudentModal = () => {
    setSelectedStudent(null);
    setStudentCorrespondences([]);
    setShowStudentModal(false);
  };

  const clearAllFilters = () => {
    setSelectedLevel(null);
    setSelectedEmployee(null);
    setSearchTerm('');
    setCurrentPage(1);
    setCorrespondences(allCorrespondences);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'follow-up': return <Clock className="h-4 w-4" />;
      case 'student': return <MessageSquare className="h-4 w-4" />;
      case 'enquiry': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'call': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'meeting': return 'text-green-600 bg-green-50 border-green-200';
      case 'follow-up': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'student': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'enquiry': return 'text-teal-600 bg-teal-50 border-teal-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Pagination calculations
  const uniqueStudents = getUniqueStudentsWithLatestCorrespondence(correspondences);
  const totalItems = uniqueStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = uniqueStudents.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of correspondence list
    document.getElementById('correspondence-list')?.scrollIntoView({ behavior: 'smooth' });
  };

  const getPaginationRange = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }
    }

    return rangeWithDots;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-border p-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-primary mb-1 tracking-tight">
              Correspondence Management
            </h1>
            <p className="text-primary/80">
              Principal/Admin View - All Communications & Statistics
            </p>
          </div>
          <div className="flex gap-4 relative">
            <div className="relative" ref={timeFilterRef}>
              <Button
                onClick={handleTimeFilterToggle}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                {getTimeFilterLabel(selectedTimeFilter)}
              </Button>
            </div>
            
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Level Cards - Clickable filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 z-0 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            onClick={() => handleLevelFilter(level)}
            className={`cursor-pointer transition-all duration-200 ${
              selectedLevel === level
                ? 'bg-blue-100 border-blue-300 shadow-lg scale-105'
                : 'bg-white/60 border-border hover:shadow-lg hover:scale-102'
            } backdrop-blur-2xl rounded-2xl shadow-md border p-6 hover:shadow-xl`}
          >
            <div className="text-center">
              <h3 className={`text-lg font-bold mb-2 ${
                selectedLevel === level ? 'text-blue-700' : 'text-primary'
              }`}>
                Level {level}
              </h3>
              <p className="text-3xl font-extrabold text-primary mb-2">
                {levelStats[level]?.total || 0}
              </p>
              <p className="text-sm text-gray-600">Communications</p>
              
              {/* Level Details - Show when selected */}
              {selectedLevel === level && (
                <div className="mt-4 pt-4 border-t border-blue-200 space-y-2">
                  <div className="text-xs text-blue-700">
                    <div>Unique Students: {levelStats[level]?.unique || 0}</div>
                    <div>Level Changes: {levelStats[level]?.levelChanges || 0}</div>
                    <div>General: {levelStats[level]?.general || 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Search and Employee Filter Section */}
      <div className="bg-white/60 backdrop-blur-2xl rounded-2xl shadow-lg border border-border p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Bar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Communications
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by student name, subject, message, or staff member..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Employee Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Staff Member
            </label>
            <select
              value={selectedEmployee || ''}
              onChange={(e) => handleEmployeeFilter(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Staff Members</option>
              {Object.entries(employeeStats)
                .sort((a, b) => a[1].name.localeCompare(b[1].name))
                .map(([staffId, stats]) => (
                <option key={staffId} value={staffId}>
                  {stats.name} ({stats.role}) - {stats.total} communications
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedLevel || selectedEmployee || searchTerm) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                
                {selectedLevel && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    Level {selectedLevel}
                    <button
                      onClick={() => handleLevelFilter(selectedLevel)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {selectedEmployee && employeeStats[selectedEmployee] && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    {employeeStats[selectedEmployee].name}
                    <button
                      onClick={() => handleEmployeeFilter(selectedEmployee)}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => handleSearch('')}
                      className="ml-1 text-orange-600 hover:text-orange-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
              
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Employee Performance Card - Show when employee is selected */}
      {selectedEmployee && employeeStats[selectedEmployee] && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800">
                {employeeStats[selectedEmployee].name}
              </h3>
              <p className="text-green-600">
                {employeeStats[selectedEmployee].role} • Performance Overview
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">
                {employeeStats[selectedEmployee].total}
              </p>
              <p className="text-sm text-green-600">Total Communications</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">
                {employeeStats[selectedEmployee].uniqueCount}
              </p>
              <p className="text-sm text-green-600">Unique Students</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">
                {employeeStats[selectedEmployee].levelChanges}
              </p>
              <p className="text-sm text-green-600">Level Changes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">
                {employeeStats[selectedEmployee].general}
              </p>
              <p className="text-sm text-green-600">General Communications</p>
            </div>
          </div>
          
          {/* Level Breakdown for selected employee */}
          <div className="mt-4 pt-4 border-t border-green-200">
            <p className="text-sm font-medium text-green-700 mb-2">Communications by Level:</p>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map(level => (
                <span key={level} className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs">
                  Level {level}: {employeeStats[selectedEmployee].byLevel[level] || 0}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {(selectedLevel || selectedEmployee || searchTerm) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-700 font-medium">
                Filtered Results
              </span>
              <span className="text-blue-600 text-sm">
                ({correspondences.length} of {allCorrespondences.length} {correspondences.length === 1 ? 'entry' : 'entries'})
              </span>
            </div>
            <button
              onClick={clearAllFilters}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Show All Communications
            </button>
          </div>
        </div>
      )}

      {/* Correspondence List */}
      <div id="correspondence-list" className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-primary">All Correspondence</h2>
          <div className="text-sm text-gray-600">
            {totalItems === 0 ? 'No entries' : (
              <>
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} {totalItems === 1 ? 'entry' : 'entries'}
                {totalPages > 1 && (
                  <span className="ml-2 text-gray-500">
                    (Page {currentPage} of {totalPages})
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {totalItems === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No correspondence records found</p>
            {(selectedLevel || selectedEmployee || searchTerm) && (
              <p className="text-sm text-gray-500 mt-2">
                Try adjusting your filters to see more results
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentItems.map((student) => {
              if (!student.latestCorrespondence || !student.studentId) {
                return null;
              }
              
              return (
                <div
                  key={student.studentId._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getTypeColor(student.latestCorrespondence.type)}`}>
                          {getTypeIcon(student.latestCorrespondence.type)}
                          {student.latestCorrespondence.type}
                        </span>
                        {student.latestCorrespondence.isLevelChange && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-600 border border-yellow-200">
                            Level Change
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          Level {student.latestCorrespondence.studentLevel}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
                          {student.totalCorrespondences} Total
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">
                        {student.studentId?.fullName?.firstName} {student.studentId?.fullName?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Latest: {student.latestCorrespondence.subject}
                      </p>
                      <p className="text-sm text-gray-700">
                        {student.latestCorrespondence.message}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right text-sm text-gray-500">
                        <p>{formatDate(student.latestCorrespondence.timestamp)}</p>
                        <p className="mt-1 font-medium">by {student.latestCorrespondence.staffMember?.name}</p>
                      </div>
                      <button
                        onClick={() => handleViewStudentDetails(student.studentId._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              {/* Pagination Info */}
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} students
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {getPaginationRange().map((page, index) => (
                    <Fragment key={index}>
                      {page === '...' ? (
                        <span className="px-3 py-2 text-gray-400">...</span>
                      ) : (
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      )}
                    </Fragment>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Items per page info */}
            <div className="mt-4 text-center">
              <span className="text-xs text-gray-500">
                {itemsPerPage} students per page
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Correspondence History
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedStudent?.fullName?.firstName} {selectedStudent?.fullName?.lastName}
                </p>
              </div>
              <button
                onClick={closeStudentModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              {studentCorrespondences.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No correspondence found for this student</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {studentCorrespondences.map((correspondence, index) => (
                    <div
                      key={correspondence._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getTypeColor(correspondence.type)}`}>
                              {getTypeIcon(correspondence.type)}
                              {correspondence.type}
                            </span>
                            {correspondence.isLevelChange && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-600 border border-yellow-200">
                                Level Change
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              Level {correspondence.studentLevel}
                            </span>
                            {index === 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-600 border border-green-200">
                                Latest
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900 mb-1">
                            {correspondence.subject}
                          </h3>
                          <p className="text-sm text-gray-700">
                            {correspondence.message}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>{formatDate(correspondence.timestamp)}</p>
                          <p className="mt-1 font-medium">by {correspondence.staffMember?.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Time Filter Dropdown - Positioned outside all containers */}
      {showTimeFilter && (
        <div className="fixed inset-0 z-[9999]" style={{ zIndex: 9999 }}>
          <div ref={dropdownRef} className="absolute top-32 right-8 w-80 bg-white border border-gray-200 rounded-lg shadow-xl">
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Filter by Time</h3>
              
              {/* Time Period Options */}
              <div className="space-y-2 mb-4">
                {[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'year', label: 'This Year' },
                  { value: 'custom', label: 'Custom Range' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="timeFilter"
                      value={option.value}
                      checked={pendingTimeFilter === option.value}
                      onChange={(e) => setPendingTimeFilter(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
              
              {/* Custom Date Range */}
              {pendingTimeFilter === 'custom' && (
                <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={pendingStartDate}
                      onChange={(e) => setPendingStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={pendingEndDate}
                      onChange={(e) => setPendingEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              )}
              
              {/* Apply Button */}
              <div className="flex gap-2">
                <Button
                  onClick={applyTimeFilter}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Apply Filter
                </Button>
                <Button
                  onClick={() => setShowTimeFilter(false)}
                  variant="outline"
                  className="px-3"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCorrespondenceManagement;
