import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Users, UserCheck, GraduationCap, Calendar, Filter, BarChart3, X, Move } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import api from '../../services/api';

/**
 * Principal Enquiry Management Component
 * Shows hierarchical family tree view of enquiries with level and date filtering
 */
const PrincipalEnquiryManagement = () => {
  const { user } = useAuth();
  const { userRole } = usePermissions();

  // State management
  const [selectedLevel, setSelectedLevel] = useState('1');
  const [selectedDate, setSelectedDate] = useState('all');
  const [currentView, setCurrentView] = useState('total');
  const [selectedGender, setSelectedGender] = useState(null);
  const [loading, setLoading] = useState(false);

  // State for custom date filter
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // State for floating stats pill
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [pillPosition, setPillPosition] = useState({ 
    x: window.innerWidth * 0.1, // 10% from left
    y: window.innerHeight * 0.9 - 100 // 10% from bottom (minus pill height)
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const pillRef = useRef(null);

  // Data states
  const [enquiryData, setEnquiryData] = useState({
    total: 0,
    boys: 0,
    girls: 0,
    programs: { boys: {}, girls: {} }
  });

  // Level tabs configuration (removed "All Levels" as requested)
  const levelTabs = [
    { value: '1', label: 'Level 1+', color: 'bg-green-500', count: 0 },
    { value: '2', label: 'Level 2+', color: 'bg-yellow-500', count: 0 },
    { value: '3', label: 'Level 3+', color: 'bg-orange-500', count: 0 },
    { value: '4', label: 'Level 4+', color: 'bg-red-500', count: 0 },
    { value: '5', label: 'Level 5+', color: 'bg-purple-500', count: 0 }
  ];
  
  const [levelStats, setLevelStats] = useState({});
  const [levelProgression, setLevelProgression] = useState({});
  const [genderLevelProgression, setGenderLevelProgression] = useState({
    boys: {},
    girls: {}
  });

  // Date filter options
  const dateFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // State for percentage calculations
  const [percentages, setPercentages] = useState({
    boys: { value: 0, text: '0%' },
    girls: { value: 0, text: '0%' },
    programs: {
      boys: {},
      girls: {}
    }
  });

  // Load data when level or date changes
  useEffect(() => {
    loadLevelStatistics();
    loadEnquiryData();
  }, [selectedLevel, selectedDate, customStartDate, customEndDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadLevelStatistics = async () => {
    try {
      // Prepare query parameters to match the main data loading
      const params = {
        dateFilter: selectedDate
      };

      // Add custom date parameters if needed
      if (selectedDate === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      console.log('Loading level statistics with params:', params);
      const response = await api.get('/enquiries/principal-overview', { params });
      console.log('Level statistics response:', response.data);
      
      if (response.data && response.data.success) {
        setLevelStats(response.data.data.levelBreakdown);
        console.log('Level breakdown set to:', response.data.data.levelBreakdown);
        if (response.data.data.levelProgression) {
          setLevelProgression(response.data.data.levelProgression);
        }
      }
    } catch (error) {
      console.error('Error loading level statistics:', error);
    }
  };

  const loadEnquiryData = async () => {
    try {
      setLoading(true);

      console.log('Loading data with filters:', { selectedLevel, selectedDate, customStartDate, customEndDate });

      // Prepare query parameters
      const params = {
        minLevel: selectedLevel,
        dateFilter: selectedDate
      };

      // Add custom date parameters if needed
      if (selectedDate === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      console.log('API call params:', params);
      // Fetch data from API
      const response = await api.get('/enquiries/principal-stats', { params });
      console.log('Principal stats response:', response.data);
      
      if (response.data && response.data.success) {
        const { data } = response.data;
        
        // Update state with real data
        setEnquiryData(data);
        
        // Update level progression if available
        if (data.levelProgression) {
          setLevelProgression(data.levelProgression);
        }
        
        // Update gender level progression if available
        if (data.genderLevelProgression) {
          setGenderLevelProgression(data.genderLevelProgression);
        }
        
        // Calculate percentages
        const calculatedPercentages = calculatePercentages(data);
        setPercentages(calculatedPercentages);
      } else {
        console.error('API returned error:', response.data?.message || 'Unknown error');
        throw new Error(response.data?.message || 'Failed to load data');
      }
    } catch (error) {
      console.error('Error loading enquiry data:', error);
      // Show error but don't reset data
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentages = (data) => {
    const total = data.boys + data.girls;
    const boysPercentage = total > 0 ? (data.boys / total) * 100 : 0;
    const girlsPercentage = total > 0 ? (data.girls / total) * 100 : 0;
    
    // Calculate program percentages for boys
    const boysProgramPercentages = {};
    if (data.boys > 0) {
      Object.entries(data.programs.boys).forEach(([program, count]) => {
        boysProgramPercentages[program] = {
          value: (count / data.boys) * 100,
          text: `${Math.round((count / data.boys) * 100)}%`
        };
      });
    }
    
    // Calculate program percentages for girls
    const girlsProgramPercentages = {};
    if (data.girls > 0) {
      Object.entries(data.programs.girls).forEach(([program, count]) => {
        girlsProgramPercentages[program] = {
          value: (count / data.girls) * 100,
          text: `${Math.round((count / data.girls) * 100)}%`
        };
      });
    }
    
    return {
      boys: { 
        value: boysPercentage, 
        text: `${Math.round(boysPercentage)}%` 
      },
      girls: { 
        value: girlsPercentage, 
        text: `${Math.round(girlsPercentage)}%` 
      },
      programs: {
        boys: boysProgramPercentages,
        girls: girlsProgramPercentages
      }
    };
  };

  const handleCardClick = (view, gender = null) => {
    if (view === 'total') {
      setCurrentView('total');
      setSelectedGender(null);
    } else if (view === 'gender') {
      setCurrentView('gender');
      setSelectedGender(null);
    } else if (view === 'programs') {
      setCurrentView('programs');
      setSelectedGender(gender);
    } else if (view === 'boys' || view === 'girls') {
      setCurrentView('programs');
      setSelectedGender(view === 'boys' ? 'Boys' : 'Girls');
    }
  };

  const handleBackClick = () => {
    if (currentView === 'programs') {
      setCurrentView('gender');
      setSelectedGender(null);
    } else if (currentView === 'gender') {
      setCurrentView('total');
    }
  };

  const handleClearFilters = () => {
    setSelectedLevel('1');
    setSelectedDate('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleApplyFilters = () => {
    // Validate custom date range if selected
    if (selectedDate === 'custom') {
      if (!customStartDate || !customEndDate) {
        alert('Please select both start and end dates for custom range');
        return;
      }
      if (new Date(customStartDate) > new Date(customEndDate)) {
        alert('Start date cannot be later than end date');
        return;
      }
    }
    
    // Reload data with current filters
    loadLevelStatistics();
    loadEnquiryData();
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

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep pill within viewport bounds (updated for much bigger pill)
      const maxX = window.innerWidth - 220; // Increased for much bigger pill
      const maxY = window.innerHeight - 100; // Increased for much bigger pill
      
      setPillPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

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
  }, [isDragging, dragOffset]);

  // Calculate comprehensive stats for modal
  const getComprehensiveStats = () => {
    // Calculate total boys and girls from level 1+ (all students)
    const totalBoys = genderLevelProgression.boys[1]?.current || 0;
    const totalGirls = genderLevelProgression.girls[1]?.current || 0;
    
    const stats = {
      boys: {
        total: totalBoys,
        levels: {}
      },
      girls: {
        total: totalGirls,
        levels: {}
      },
      programs: enquiryData.programs
    };

    // Calculate level breakdown for boys and girls using gender level progression
    for (let level = 1; level <= 5; level++) {
      const boysAtLevel = genderLevelProgression.boys[level]?.current || 0;
      const girlsAtLevel = genderLevelProgression.girls[level]?.current || 0;
      
      stats.boys.levels[level] = boysAtLevel;
      stats.girls.levels[level] = girlsAtLevel;
    }

    return stats;
  };

  // Floating Stats Pill Component
  const FloatingStatsPill = () => (
    <div
      ref={pillRef}
      className="fixed z-50 transition-all duration-200"
      style={{
        left: `${pillPosition.x}px`,
        top: `${pillPosition.y}px`
      }}
    >
      {/* Gradient border wrapper */}
      <div className="p-1 rounded-full bg-gradient-to-r from-blue-500 to-red-500 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="bg-white bg-opacity-95 backdrop-blur-md rounded-full flex items-center overflow-hidden">
          {/* Main clickable area */}
          <div
            className="px-8 py-4 flex items-center space-x-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-red-50 transition-all duration-200 flex-1 text-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              setShowStatsModal(true);
            }}
          >
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-semibold text-gray-800">Glimpse</span>
          </div>
          
          {/* Draggable handle area */}
          <div
            className={`px-4 py-4 border-l border-gray-200 cursor-grab hover:bg-gradient-to-r hover:from-blue-50 hover:to-red-50 transition-all duration-200 ${isDragging ? 'cursor-grabbing bg-gradient-to-r from-blue-50 to-red-50' : ''}`}
            onMouseDown={handleMouseDown}
            title="Drag to move"
          >
            <Move className="w-5 h-5 text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );

  // Comprehensive Stats Modal Component
  const StatsModal = () => {
    const stats = getComprehensiveStats();
    
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        showStatsModal ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setShowStatsModal(false)}
        />
        
        {/* Modal */}
        <div className={`relative bg-white rounded-2xl shadow-2xl w-[90%] h-[90%] max-w-7xl transform transition-all duration-500 flex flex-col ${
          showStatsModal ? 'scale-100 rotate-0' : 'scale-95 rotate-3'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Comprehensive Statistics</h2>
                <p className="text-gray-600">Complete overview of enquiry data</p>
              </div>
            </div>
            <button
              onClick={() => setShowStatsModal(false)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <div className="p-6 h-full overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Boys Statistics */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-blue-500 rounded-lg">
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-blue-900">Boys Statistics</h3>
                      <p className="text-blue-700">Total: {stats.boys.total} students</p>
                    </div>
                  </div>
                  
                  {/* Boys Level Breakdown */}
                  <div className="space-y-3 mb-6">
                    <h4 className="font-semibold text-blue-800 mb-3">Level Distribution</h4>
                    {[1, 2, 3, 4, 5].map(level => (
                      <div key={level} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            level === 1 ? 'bg-green-500' :
                            level === 2 ? 'bg-yellow-500' :
                            level === 3 ? 'bg-orange-500' :
                            level === 4 ? 'bg-red-500' : 'bg-purple-500'
                          }`} />
                          <span className="font-medium text-gray-700">Level {level}+</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-blue-600">
                            {stats.boys.levels[level] || 0}
                          </span>
                          <div className="text-xs text-gray-500">
                            {stats.boys.total > 0 ? Math.round((stats.boys.levels[level] || 0) / stats.boys.total * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Boys Programs */}
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-3">Program Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(stats.programs.boys || {}).map(([program, count]) => (
                        <div key={program} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm">
                          <span className="text-sm font-medium text-gray-700">{program}</span>
                          <span className="text-sm font-bold text-blue-600">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Girls Statistics */}
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-pink-500 rounded-lg">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-pink-900">Girls Statistics</h3>
                      <p className="text-pink-700">Total: {stats.girls.total} students</p>
                    </div>
                  </div>
                  
                  {/* Girls Level Breakdown */}
                  <div className="space-y-3 mb-6">
                    <h4 className="font-semibold text-pink-800 mb-3">Level Distribution</h4>
                    {[1, 2, 3, 4, 5].map(level => (
                      <div key={level} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            level === 1 ? 'bg-green-500' :
                            level === 2 ? 'bg-yellow-500' :
                            level === 3 ? 'bg-orange-500' :
                            level === 4 ? 'bg-red-500' : 'bg-purple-500'
                          }`} />
                          <span className="font-medium text-gray-700">Level {level}+</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-pink-600">
                            {stats.girls.levels[level] || 0}
                          </span>
                          <div className="text-xs text-gray-500">
                            {stats.girls.total > 0 ? Math.round((stats.girls.levels[level] || 0) / stats.girls.total * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Girls Programs */}
                  <div>
                    <h4 className="font-semibold text-pink-800 mb-3">Program Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(stats.programs.girls || {}).map(([program, count]) => (
                        <div key={program} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm">
                          <span className="text-sm font-medium text-gray-700">{program}</span>
                          <span className="text-sm font-bold text-pink-600">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Summary Footer */}
              <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3">
                    <div className="text-2xl font-bold text-gray-800">{stats.boys.total + stats.girls.total}</div>
                    <div className="text-sm text-gray-600">Total Students</div>
                  </div>
                  <div className="p-3">
                    <div className="text-2xl font-bold text-blue-600">{stats.boys.total}</div>
                    <div className="text-sm text-gray-600">Boys</div>
                  </div>
                  <div className="p-3">
                    <div className="text-2xl font-bold text-pink-600">{stats.girls.total}</div>
                    <div className="text-sm text-gray-600">Girls</div>
                  </div>
                  <div className="p-3">
                    <div className="text-2xl font-bold text-purple-600">{levelStats[5] || 0}</div>
                    <div className="text-sm text-gray-600">Admitted (Level 5)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EnquiryCard = ({ title, count, icon: IconComponent, color, onClick, subtitle = null, levelData = null }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      pink: 'from-pink-500 to-pink-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      cyan: 'from-cyan-500 to-cyan-600'
    };

    // Format the count based on whether we have level progression data
    const formattedCount = levelData ? 
      `${levelData.current}/${levelData.previous}` : 
      count;
    
    // Calculate percentage for level progression (should be current/previous * 100)
    const progressPercentage = levelData && levelData.previous > 0 ? 
      Math.round((levelData.current / levelData.previous) * 100) : 
      null;
    
    // Format students who didn't progress
    const notProgressedText = levelData && levelData.notProgressed > 0 ? 
      `${levelData.notProgressed} did not progress` : 
      null;

    return (
      <div 
        onClick={onClick}
        className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${onClick ? 'hover:border-blue-300' : ''}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color]}`}>
            {IconComponent && <IconComponent className="w-8 h-8 text-white" />}
          </div>
          {onClick && <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-3xl font-bold text-gray-800 mb-2">{loading ? '...' : formattedCount}</p>
          {progressPercentage !== null && (
            <div className="mb-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full bg-gradient-to-r ${colorClasses[color]}`} 
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{progressPercentage}% progression</p>
              {notProgressedText && (
                <p className="text-xs text-red-500 mt-1">{notProgressedText}</p>
              )}
            </div>
          )}
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
    );
  };

  if (userRole !== 'Principal') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
          <p className="text-gray-500">This page is only accessible to Principal users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Floating Stats Pill */}
      <FloatingStatsPill />
      
      {/* Comprehensive Stats Modal */}
      <StatsModal />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-[Sora,Inter,sans-serif]">
                Enquiry Management
              </h1>
              <p className="text-gray-600 mt-1">
                Hierarchical view of student enquiries by level and demographics
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Welcome</p>
              <p className="font-semibold text-gray-900">
                Syed Awais Bukhari
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Filters</h3>
          </div>

          <div className="flex flex-wrap items-end gap-6">
            {/* Date Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Date Range
              </label>
              <div className="relative">
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer text-gray-700 font-medium"
                >
                  {dateFilters.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleApplyFilters}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
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
                disabled={loading}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all duration-200 border border-gray-300 hover:border-gray-400 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          {selectedDate === 'custom' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Filter Summary */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500">Active filters:</span>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Level {selectedLevel}+
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                {dateFilters.find(f => f.value === selectedDate)?.label || 'All Time'}
              </span>
              {selectedDate === 'custom' && customStartDate && customEndDate && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                  {customStartDate} to {customEndDate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Level Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <span className="font-medium text-gray-700">Level Filter:</span>
          </div>
          <div className="grid grid-cols-5 gap-6">
            {levelTabs.map(tab => {
              const count = levelStats[tab.value] || 0;
              const isActive = selectedLevel === tab.value;
              
              return (
                <button
                  key={tab.value}
                  onClick={() => setSelectedLevel(tab.value)}
                  className={`flex flex-col items-center justify-center p-8 h-32 rounded-xl transition-all duration-200 border-2 ${
                    isActive 
                      ? `${tab.color} text-white shadow-lg transform scale-105 border-transparent` 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`text-6xl font-bold mb-3 ${
                    isActive ? 'text-white' : 'text-gray-800'
                  }`}>
                    {count}
                  </span>
                  <span className={`text-lg font-medium ${
                    isActive ? 'text-white text-opacity-90' : 'text-gray-500'
                  }`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-8">
          {/* Total Enquiries Level */}
          {currentView === 'total' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Total Enquiries</h2>
                <p className="text-gray-600">Overall statistics for selected level and date range</p>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <EnquiryCard
                  title={`Level ${selectedLevel}+ Enquiries`}
                  count={enquiryData.total}
                  icon={Users}
                  color="blue"
                  onClick={() => handleCardClick('gender')}
                  subtitle={`Students at level ${selectedLevel} and above`}
                  levelData={levelProgression[selectedLevel] ? 
                    levelProgression[selectedLevel] : 
                    (levelProgression[1] ? levelProgression[1] : null)}
                />
              </div>
            </div>
          )}

          {/* Gender Breakdown Level */}
          {currentView === 'gender' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <EnquiryCard
                title={`Boys (Level ${selectedLevel}+)`}
                count={`${enquiryData.boys} (${percentages.boys.text})`}
                icon={UserCheck}
                color="green"
                onClick={() => handleCardClick('programs', 'Boys')}
                subtitle={`${enquiryData.boys} male students at level ${selectedLevel}`}
                levelData={genderLevelProgression.boys[selectedLevel] ? 
                  genderLevelProgression.boys[selectedLevel] : 
                  (genderLevelProgression.boys[1] ? genderLevelProgression.boys[1] : null)}
              />
              <EnquiryCard
                title={`Girls (Level ${selectedLevel}+)`}
                count={`${enquiryData.girls} (${percentages.girls.text})`}
                icon={GraduationCap}
                color="pink"
                onClick={() => handleCardClick('programs', 'Girls')}
                subtitle={`${enquiryData.girls} female students at level ${selectedLevel}`}
                levelData={genderLevelProgression.girls[selectedLevel] ? 
                  genderLevelProgression.girls[selectedLevel] : 
                  (genderLevelProgression.girls[1] ? genderLevelProgression.girls[1] : null)}
              />
            </div>
          )}

          {/* Programs Breakdown Level */}
          {currentView === 'programs' && selectedGender && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">{selectedGender} Programs</h2>
                <p className="text-gray-600">Program-wise breakdown for {selectedGender.toLowerCase()}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {Object.entries(enquiryData.programs[selectedGender.toLowerCase()] || {}).length > 0 ? (
                  Object.entries(enquiryData.programs[selectedGender.toLowerCase()] || {}).map(([program, count], index) => (
                    <EnquiryCard
                      key={program}
                      title={program}
                      count={count}
                      icon={GraduationCap}
                      color={['purple', 'orange', 'cyan'][index % 3]}
                      subtitle={`${percentages.programs[selectedGender.toLowerCase()][program]?.text || '0%'} of ${selectedGender.toLowerCase()}`}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500 text-lg">No program data available for {selectedGender.toLowerCase()} at Level {selectedLevel}+</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting the date filter or level selection</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Back Navigation */}
          {(currentView === 'gender' || currentView === 'programs') && (
            <div className="text-center">
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

export default PrincipalEnquiryManagement;