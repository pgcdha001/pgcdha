import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, UserCheck, GraduationCap, Filter, BarChart3, X, Move } from 'lucide-react';
import api from '../../services/api';
import {
  ENQUIRY_LEVELS,
  DATE_FILTERS,
  CARD_COLORS,
  API_ENDPOINTS,
  DEFAULT_SETTINGS,
  LOADING_STATES
} from '../../config/correspondenceConfig';

/**
 * Principal Correspondence Management Component
 * Shows hierarchical family tree view of correspondence with level and date filtering
 * 
 * NOTE: This component tracks only actual correspondence/remarks (not student creation).
 * Uses dedicated correspondence API endpoints:
 * - /correspondence/principal-overview -> For level statistics overview
 * - /correspondence/principal-stats -> For detailed correspondence statistics
 */
const PrincipalCorrespondenceManagement = () => {
  // State management
  const [selectedLevel, setSelectedLevel] = useState(DEFAULT_SETTINGS.SELECTED_LEVEL);
  const [selectedDate, setSelectedDate] = useState(DEFAULT_SETTINGS.SELECTED_DATE);
  const [currentView, setCurrentView] = useState('total');
  const [selectedGender, setSelectedGender] = useState(null);
  const [loading, setLoading] = useState(false);

  // State for custom date filter
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customDatesApplied, setCustomDatesApplied] = useState(false);
  
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
  const [correspondenceData, setCorrespondenceData] = useState({
    total: 0,
    boys: 0,
    girls: 0,
    programs: { boys: {}, girls: {} }
  });

  // Level tabs configuration - using configurable values
  const levelTabs = ENQUIRY_LEVELS;
  
  const [levelStats, setLevelStats] = useState({});
  const [levelProgression, setLevelProgression] = useState({});
  const [genderLevelProgression, setGenderLevelProgression] = useState({
    boys: {},
    girls: {}
  });

  // Date filter options - using configurable values  
  const dateFilters = DATE_FILTERS;

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
    loadCorrespondenceData();
  }, [selectedLevel, selectedDate, customDatesApplied]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset custom dates applied state when date filter changes away from custom
  useEffect(() => {
    if (selectedDate !== 'custom') {
      setCustomDatesApplied(false);
    }
  }, [selectedDate]);

  const loadLevelStatistics = async () => {
    try {
      // Skip loading if custom date is selected but not applied
      if (selectedDate === 'custom' && !customDatesApplied) {
        return;
      }

      // Prepare query parameters to match the main data loading
      const params = {
        dateFilter: selectedDate
      };

      // Add custom date parameters if needed
      if (selectedDate === 'custom' && customStartDate && customEndDate && customDatesApplied) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      console.log('Loading level statistics with params:', params);
      // Use configurable API endpoints
      const response = await api.get(API_ENDPOINTS.PRINCIPAL_OVERVIEW, { params });
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

  const loadCorrespondenceData = async () => {
    try {
      setLoading(true);

      // Skip loading if custom date is selected but not applied
      if (selectedDate === 'custom' && !customDatesApplied) {
        // Set empty/zero data for custom date that hasn't been applied
        setCorrespondenceData({
          total: 0,
          boys: 0,
          girls: 0,
          programs: { boys: {}, girls: {} }
        });
        setLevelStats({});
        setLevelProgression({});
        setGenderLevelProgression({ boys: {}, girls: {} });
        setPercentages({
          boys: { value: 0, text: '0%' },
          girls: { value: 0, text: '0%' },
          programs: { boys: {}, girls: {} }
        });
        setLoading(false);
        return;
      }

      console.log('Loading data with filters:', { selectedLevel, selectedDate, customStartDate, customEndDate });

      // Prepare query parameters
      const params = {
        minLevel: selectedLevel,
        dateFilter: selectedDate
      };

      // Add custom date parameters if needed
      if (selectedDate === 'custom' && customStartDate && customEndDate && customDatesApplied) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      console.log('API call params:', params);
      // Use configurable API endpoints  
      const response = await api.get(API_ENDPOINTS.PRINCIPAL_STATS, { params });
      console.log('Principal stats response:', response.data);
      
      if (response.data && response.data.success) {
        const { data } = response.data;
        
        // Update state with real data
        setCorrespondenceData(data);
        
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
      console.error('Error loading correspondence data:', error);
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
    setSelectedLevel(DEFAULT_SETTINGS.SELECTED_LEVEL);
    setSelectedDate(DEFAULT_SETTINGS.SELECTED_DATE);
    setCustomStartDate('');
    setCustomEndDate('');
    setCustomDatesApplied(false);
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
      // Mark custom dates as applied
      setCustomDatesApplied(true);
    }
    
    // Reload data with current filters
    loadLevelStatistics();
    loadCorrespondenceData();
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
      
      // Keep pill within viewport bounds (updated for much bigger pill)
      const maxX = window.innerWidth - 220; // Increased for much bigger pill
      const maxY = window.innerHeight - 100; // Increased for much bigger pill
      
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
  }, [isDragging, dragOffset, handleMouseMove]);

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
      programs: correspondenceData.programs
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
      <div className={`p-1 rounded-full bg-gradient-to-r from-blue-500 to-red-500 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="bg-white bg-opacity-95 backdrop-blur-md rounded-full flex items-center overflow-hidden">
          {/* Main clickable area */}
          <div
            className={`px-8 py-4 flex items-center space-x-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-red-50 transition-all duration-200 flex-1 text-gray-800 ${loading ? 'cursor-not-allowed' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!loading) {
                setShowStatsModal(true);
              }
            }}
          >
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-semibold text-gray-800">
              {loading ? 'Loading...' : 'Glimpse'}
            </span>
          </div>
          
          {/* Draggable handle area */}
          <div
            className={`px-4 py-4 border-l border-gray-200 cursor-grab hover:bg-gradient-to-r hover:from-blue-50 hover:to-red-50 transition-all duration-200 ${isDragging ? 'cursor-grabbing bg-gradient-to-r from-blue-50 to-red-50' : ''} ${loading ? 'cursor-not-allowed' : ''}`}
            onMouseDown={loading ? undefined : handleMouseDown}
            title={loading ? 'Loading data...' : 'Drag to move'}
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
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Comprehensive Statistics</h2>
                  <p className="text-gray-600">Complete overview of correspondence data</p>
                </div>
              </div>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            {/* Time Filter */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">Time Filter:</span>
                <div className="flex flex-wrap gap-2">
                  {dateFilters.map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => {
                        setSelectedDate(filter.value);
                        // Auto-reload data when filter changes
                        setTimeout(() => {
                          loadLevelStatistics();
                          loadCorrespondenceData();
                        }, 100);
                      }}
                      disabled={loading}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedDate === filter.value
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Loading indicator */}
              {loading && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Updating data...</span>
                </div>
              )}
            </div>
            
            {/* Custom Date Range in Modal */}
            {selectedDate === 'custom' && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value);
                        setCustomDatesApplied(false); // Reset applied state when date changes
                      }}
                      disabled={loading}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value);
                        setCustomDatesApplied(false); // Reset applied state when date changes
                      }}
                      disabled={loading}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
                
                {/* Status indicator */}
                {selectedDate === 'custom' && customStartDate && customEndDate && !customDatesApplied && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-xs text-yellow-800 text-center">
                      📅 Custom dates selected but not applied. Click "Apply Custom Range" to load data.
                    </p>
                    <p className="text-xs text-yellow-600 text-center mt-1">
                      Selected range: {Math.ceil((new Date(customEndDate) - new Date(customStartDate)) / (1000 * 60 * 60 * 24)) + 1} days
                    </p>
                  </div>
                )}
                
                {/* Apply Filter Button for Custom Range */}
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={() => {
                      if (customStartDate && customEndDate) {
                        setCustomDatesApplied(true);
                        loadLevelStatistics();
                        loadCorrespondenceData();
                      }
                    }}
                    disabled={loading || !customStartDate || !customEndDate}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <Filter className="w-3 h-3" />
                        <span>Apply Custom Range</span>
                      </>
                    )}
                  </button>
                </div>
                
                {loading && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-blue-600">Updating data with custom date range...</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-hidden relative">
            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-80 z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg font-semibold text-blue-600">Updating Statistics...</p>
                  <p className="text-sm text-gray-600">Please wait while we fetch the latest data</p>
                </div>
              </div>
            )}
            
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
                  
                  {/* Level breakdown for boys */}
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div key={level} className="flex items-center justify-between p-3 bg-white bg-opacity-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${levelTabs[level - 1].color}`}></div>
                          <span className="font-medium text-blue-800">Level {level}</span>
                        </div>
                        <span className="text-blue-900 font-bold">{stats.boys.levels[level] || 0}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Program breakdown for boys */}
                  {Object.keys(stats.programs.boys).length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-blue-900 mb-3">Program Distribution</h4>
                      <div className="space-y-2">
                        {Object.entries(stats.programs.boys).map(([program, count]) => (
                          <div key={program} className="flex items-center justify-between p-2 bg-white bg-opacity-30 rounded">
                            <span className="text-blue-800">{program}</span>
                            <span className="text-blue-900 font-semibold">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                  
                  {/* Level breakdown for girls */}
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div key={level} className="flex items-center justify-between p-3 bg-white bg-opacity-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${levelTabs[level - 1].color}`}></div>
                          <span className="font-medium text-pink-800">Level {level}</span>
                        </div>
                        <span className="text-pink-900 font-bold">{stats.girls.levels[level] || 0}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Program breakdown for girls */}
                  {Object.keys(stats.programs.girls).length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-pink-900 mb-3">Program Distribution</h4>
                      <div className="space-y-2">
                        {Object.entries(stats.programs.girls).map(([program, count]) => (
                          <div key={program} className="flex items-center justify-between p-2 bg-white bg-opacity-30 rounded">
                            <span className="text-pink-800">{program}</span>
                            <span className="text-pink-900 font-semibold">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Correspondence Card Component
  // eslint-disable-next-line no-unused-vars
  const CorrespondenceCard = ({ title, count, icon: Icon, color, onClick, subtitle, levelData }) => {
    // Card Colors for different views - using configurable values
    const colorClasses = CARD_COLORS;

    const classes = colorClasses[color];

    return (
      <div
        className={`${classes.bg} ${classes.border} ${classes.hover} border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105`}
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
          </div>
        </div>
        <h3 className={`text-lg font-semibold ${classes.text} mb-2`}>{title}</h3>
        <p className={`text-sm ${classes.subtitle}`}>{subtitle}</p>
        
        {/* Level progression indicator */}
        {levelData && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-xs">
              <span className={classes.subtitle}>Previous: {levelData.previous || 0}</span>
              <span className={classes.subtitle}>Current: {levelData.current || 0}</span>
              <span className={classes.subtitle}>Change: {levelData.change > 0 ? '+' : ''}{levelData.change || 0}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      {/* Floating Stats Pill */}
      <FloatingStatsPill />
      
      {/* Stats Modal */}
      <StatsModal />

      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Correspondence Management</h1>
            <p className="text-gray-600 text-lg">Principal Dashboard for Student Correspondence Analytics</p>
            <p className="text-gray-500 text-sm mt-1">Tracks only actual correspondence/remarks, not student creation or level changes</p>
          </div>

          {/* Level Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {levelTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedLevel(tab.value)}
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedLevel === tab.value
                    ? `${tab.color} text-white shadow-lg transform scale-105`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{tab.label}</span>
                  <span className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full">
                    {typeof levelStats[tab.value] === 'object' && levelStats[tab.value] 
                      ? levelStats[tab.value].correspondence || 0 
                      : levelStats[tab.value] || 0}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
            <span className="text-sm font-medium text-gray-700">Date Filter:</span>
            {dateFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedDate(filter.value)}
                disabled={loading}
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

          {/* Custom Date Range */}
          {selectedDate === 'custom' && (
            <div className="max-w-lg mx-auto bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      setCustomDatesApplied(false);
                    }}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      setCustomDatesApplied(false);
                    }}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleApplyFilters}
                  disabled={loading || !customStartDate || !customEndDate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    'Apply Filters'
                  )}
                </button>
                <button
                  onClick={handleClearFilters}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
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
          {currentView === 'total' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Total Correspondence</h2>
                <p className="text-gray-600">Overall statistics for selected level and date range</p>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <CorrespondenceCard
                  title={`Level ${selectedLevel}+ Correspondence`}
                  count={correspondenceData.total}
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
              <CorrespondenceCard
                title={`Boys (Level ${selectedLevel}+)`}
                count={`${correspondenceData.boys} (${percentages.boys.text})`}
                icon={UserCheck}
                color="green"
                onClick={() => handleCardClick('programs', 'Boys')}
                subtitle={`${correspondenceData.boys} male students at level ${selectedLevel}`}
                levelData={genderLevelProgression.boys[selectedLevel] ? 
                  genderLevelProgression.boys[selectedLevel] : 
                  (genderLevelProgression.boys[1] ? genderLevelProgression.boys[1] : null)}
              />
              <CorrespondenceCard
                title={`Girls (Level ${selectedLevel}+)`}
                count={`${correspondenceData.girls} (${percentages.girls.text})`}
                icon={GraduationCap}
                color="pink"
                onClick={() => handleCardClick('programs', 'Girls')}
                subtitle={`${correspondenceData.girls} female students at level ${selectedLevel}`}
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
                {Object.entries(correspondenceData.programs[selectedGender.toLowerCase()] || {}).length > 0 ? (
                  Object.entries(correspondenceData.programs[selectedGender.toLowerCase()] || {}).map(([program, count], index) => (
                    <CorrespondenceCard
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

export default PrincipalCorrespondenceManagement;
