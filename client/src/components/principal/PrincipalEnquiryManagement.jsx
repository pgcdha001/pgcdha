import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import useEnquiryData from '../../hooks/useEnquiryData';

// Import all the smaller components
import ErrorDisplay from './ErrorDisplay';
import Header from './Header';
import LevelTabs from './LevelTabs';
import StatsCards from './StatsCards';
import ProgramBreakdownCards from './ProgramBreakdownCards';
import FloatingStatsPill from './FloatingStatsPill';
import StatsModal from './StatsModal';

/**
 * Principal Enquiry Management Component
 * Shows hierarchical family tree view of enquiries with level and date filtering
 */
const PrincipalEnquiryManagement = () => {
  const { userRole } = usePermissions();

  // Use the simple enquiry data hook
  const {
    fetchComprehensiveData,
    fetchCustomDateRange,
    refreshData,
    getFilteredData,
    getLevelStatistics,
    isInitialLoading,
    isRefreshing,
    isCustomDateLoading,
    error,
    lastUpdated
  } = useEnquiryData();

  // State management
  const [selectedLevel, setSelectedLevel] = useState('1');
  const [selectedDate, setSelectedDate] = useState('all');
  const [currentView, setCurrentView] = useState('default');
  const [selectedGender, setSelectedGender] = useState(null);

  // State for custom date filter
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customDatesApplied, setCustomDatesApplied] = useState(false);
  const [customData, setCustomData] = useState(null);
  
  // State for floating stats pill
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [pillPosition, setPillPosition] = useState({ 
    x: window.innerWidth * 0.1, // 10% from left
    y: window.innerHeight * 0.9 - 100 // 10% from bottom (minus pill height)
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const pillRef = useRef(null);

  // Level tabs configuration (removed "All Levels" as requested)
  const levelTabs = [
    { value: '1', label: 'Level 1+', color: 'bg-green-500', count: 0 },
    { value: '2', label: 'Level 2+', color: 'bg-yellow-500', count: 0 },
    { value: '3', label: 'Level 3+', color: 'bg-orange-500', count: 0 },
    { value: '4', label: 'Level 4+', color: 'bg-red-500', count: 0 },
    { value: '5', label: 'Level 5+', color: 'bg-purple-500', count: 0 }
  ];

  // Date filter options
  const dateFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Get current data based on selected filters
  const getCurrentData = useCallback(() => {
    const dateFilter = selectedDate === 'custom' && customDatesApplied ? 'custom' : selectedDate;
    const level = parseInt(selectedLevel);
    
    let currentData;
    if (dateFilter === 'custom' && customData) {
      currentData = getFilteredData(level, dateFilter, customData);
    } else {
      currentData = getFilteredData(level, dateFilter);
    }
    
    // Debug: Log the data structure to understand what we're getting
    console.log('getCurrentData - dateFilter:', dateFilter, 'level:', level);
    console.log('getCurrentData - currentData:', currentData);
    console.log('getCurrentData - has levelProgression?', currentData?.levelProgression ? 'YES' : 'NO');
    
    return currentData;
  }, [selectedLevel, selectedDate, customDatesApplied, customData, getFilteredData]);

  // Get current level statistics
  const getCurrentLevelStats = useCallback(() => {
    const dateFilter = selectedDate === 'custom' && customDatesApplied ? 'custom' : selectedDate;
    
    if (dateFilter === 'custom' && customData) {
      return getLevelStatistics(dateFilter, customData);
    } else {
      return getLevelStatistics(dateFilter);
    }
  }, [selectedDate, customDatesApplied, customData, getLevelStatistics]);

  // Calculate percentages from current data
  const calculatePercentages = useCallback((data) => {
    const total = (data?.boys || 0) + (data?.girls || 0);
    const boysPercentage = total > 0 ? ((data?.boys || 0) / total) * 100 : 0;
    const girlsPercentage = total > 0 ? ((data?.girls || 0) / total) * 100 : 0;
    
    // Calculate program percentages for boys
    const boysProgramPercentages = {};
    if (data?.boys > 0) {
      Object.entries(data?.programs?.boys || {}).forEach(([program, count]) => {
        boysProgramPercentages[program] = (count / data.boys) * 100;
      });
    }
    
    // Calculate program percentages for girls
    const girlsProgramPercentages = {};
    if (data?.girls > 0) {
      Object.entries(data?.programs?.girls || {}).forEach(([program, count]) => {
        girlsProgramPercentages[program] = (count / data.girls) * 100;
      });
    }
    
    return {
      boysPercentage,
      girlsPercentage,
      boysProgramPercentages,
      girlsProgramPercentages
    };
  }, []);

  // Event handlers
  const handleCardClick = (view, gender = null) => {
    if (view === 'total') {
      setCurrentView('total');
      setSelectedGender(null);
    } else if (view === 'gender') {
      setCurrentView('gender');
      setSelectedGender(gender);
    }
  };

  const handleBackClick = () => {
    setCurrentView('default');
    setSelectedGender(null);
  };

  const handleApplyFilters = async () => {
    if (!customStartDate || !customEndDate) return;
    
    try {
      const response = await fetchCustomDateRange(customStartDate, customEndDate, selectedLevel);
      setCustomData(response);
      setCustomDatesApplied(true);
    } catch (error) {
      // Don't log errors for canceled requests
      if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
        console.error('Failed to apply custom date range:', error);
      }
    }
  };

  const handleRefreshData = async () => {
    try {
      await refreshData();
      // Reset custom data if we have any
      if (customDatesApplied) {
        setCustomData(null);
        setCustomDatesApplied(false);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  // Drag functionality for floating pill
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = pillRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(window.innerWidth - 300, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y));
      
      setPillPosition({ x: newX, y: newY });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Effects
  useEffect(() => {
    // Only fetch data on component mount
    fetchComprehensiveData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  useEffect(() => {
    if (selectedDate !== 'custom') {
      setCustomDatesApplied(false);
      setCustomData(null);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Compute current state
  const currentData = getCurrentData() || { total: 0, boys: 0, girls: 0, programs: { boys: {}, girls: {} } };
  const levelStats = getCurrentLevelStats();
  const percentages = calculatePercentages(currentData);
  const loading = isInitialLoading || (selectedDate === 'custom' && isCustomDateLoading);

  // Show simple error state if data fetch fails and no cached data
  if (error && loading) {
    return (
      <ErrorDisplay 
        error={error}
        isRefreshing={isRefreshing}
        onRetry={refreshData}
      />
    );
  }

  // Early return for unauthorized access
  if (userRole !== 'Principal' && userRole !== 'InstituteAdmin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <Header 
          error={error}
          isRefreshing={isRefreshing}
          isInitialLoading={isInitialLoading}
          onRefresh={handleRefreshData}
          lastUpdated={lastUpdated}
        />

        {/* Level Tabs */}
        <LevelTabs 
          levelTabs={levelTabs}
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
          levelStats={levelStats}
          loading={loading}
        />

        {/* Stats Cards OR Program Breakdown Cards */}
        {currentView === 'default' ? (
          <StatsCards 
            currentData={currentData}
            percentages={percentages}
            currentView={currentView}
            selectedGender={selectedGender}
            selectedLevel={selectedLevel}
            onCardClick={handleCardClick}
            loading={loading}
          />
        ) : (
          <ProgramBreakdownCards 
            currentView={currentView}
            selectedGender={selectedGender}
            currentData={currentData}
            onBackClick={handleBackClick}
            loading={loading}
          />
        )}

        {/* Floating Stats Pill */}
        <FloatingStatsPill 
          position={pillPosition}
          loading={loading}
          isDragging={isDragging}
          onShowStats={() => setShowStatsModal(true)}
          onMouseDown={handleMouseDown}
          pillRef={pillRef}
        />

        {/* Stats Modal */}
        <StatsModal 
          showStatsModal={showStatsModal}
          onCloseModal={() => setShowStatsModal(false)}
          selectedDate={selectedDate}
          dateFilters={dateFilters}
          onDateChange={setSelectedDate}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          customDatesApplied={customDatesApplied}
          isCustomDateLoading={isCustomDateLoading}
          onStartDateChange={setCustomStartDate}
          onEndDateChange={setCustomEndDate}
          onApplyFilters={handleApplyFilters}
          loading={loading}
          currentData={currentData}
          percentages={percentages}
          levelStats={levelStats}
          levelTabs={levelTabs}
          lastUpdated={lastUpdated}
        />
      </div>
    </div>
  );
};

export default PrincipalEnquiryManagement;