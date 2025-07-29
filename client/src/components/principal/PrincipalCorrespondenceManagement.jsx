import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import useCorrespondenceData from '../../hooks/useCorrespondenceData';

// Import all the smaller components - following enquiry management pattern
import ErrorDisplay from './ErrorDisplay';
import Header from './Header';
import LevelTabs from './LevelTabs';
import FloatingStatsPill from './FloatingStatsPill';
import StatsModal from './StatsModal';

// Import correspondence-specific components
import CorrespondenceStatsCards from './correspondence/CorrespondenceStatsCards';
import CorrespondenceBreakdownCards from './correspondence/CorrespondenceBreakdownCards';

/**
 * Principal Correspondence Management Component
 * Shows comprehensive correspondence statistics with multiple filters
 * Following the structure of PrincipalEnquiryManagement
 */
const PrincipalCorrespondenceManagement = () => {
  const { userRole } = usePermissions();

  // Use the correspondence data hook
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
  } = useCorrespondenceData();

  // State management - following enquiry pattern
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [currentView, setCurrentView] = useState('default');
  
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

  // Level tabs configuration
  const levelTabs = [
    { value: 'all', label: 'All Levels', color: 'bg-gray-500', count: 0 },
    { value: '1', label: 'Level 1', color: 'bg-green-500', count: 0 },
    { value: '2', label: 'Level 2', color: 'bg-yellow-500', count: 0 },
    { value: '3', label: 'Level 3', color: 'bg-orange-500', count: 0 },
    { value: '4', label: 'Level 4', color: 'bg-red-500', count: 0 },
    { value: '5', label: 'Level 5', color: 'bg-purple-500', count: 0 }
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
    
    let currentData;
    if (dateFilter === 'custom' && customData) {
      currentData = getFilteredData(selectedLevel, dateFilter, customData);
    } else {
      currentData = getFilteredData(selectedLevel, dateFilter);
    }
    
    // Debug: Log the data structure to understand what we're getting
    console.log('getCurrentData - correspondence:', { dateFilter, level: selectedLevel, currentData });
    
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

  // Calculate percentages from current data for correspondence
  const calculateCorrespondencePercentages = useCallback((data) => {
    // For correspondence, we use male/female instead of boys/girls
    const maleCount = data?.breakdown?.byGender?.male || 0;
    const femaleCount = data?.breakdown?.byGender?.female || 0;
    const total = maleCount + femaleCount;
    
    const malePercentage = total > 0 ? (maleCount / total) * 100 : 0;
    const femalePercentage = total > 0 ? (femaleCount / total) * 100 : 0;
    
    // For correspondence we don't have program breakdowns, so we'll use type breakdowns
    const levelChanges = data?.stats?.levelChanges || 0;
    const generalCorr = data?.stats?.generalCorrespondence || 0;
    const typeTotal = levelChanges + generalCorr;
    
    const levelChangePercentage = typeTotal > 0 ? (levelChanges / typeTotal) * 100 : 0;
    const generalPercentage = typeTotal > 0 ? (generalCorr / typeTotal) * 100 : 0;
    
    return {
      boysPercentage: Number.isFinite(malePercentage) ? malePercentage : 0,
      girlsPercentage: Number.isFinite(femalePercentage) ? femalePercentage : 0,
      boysProgramPercentages: {
        levelChange: Number.isFinite(levelChangePercentage) ? levelChangePercentage : 0,
        general: Number.isFinite(generalPercentage) ? generalPercentage : 0
      },
      girlsProgramPercentages: {
        levelChange: Number.isFinite(levelChangePercentage) ? levelChangePercentage : 0,
        general: Number.isFinite(generalPercentage) ? generalPercentage : 0
      }
    };
  }, []);

  // Event handlers
  const handleCardClick = (view) => {
    setCurrentView(view);
  };

  const handleBackClick = () => {
    setCurrentView('default');
  };

  const handleRefreshData = useCallback(() => {
    console.log('Refreshing correspondence data...');
    refreshData();
  }, [refreshData]);

  // Custom date handlers
  const handleApplyFilters = useCallback(async () => {
    if (!customStartDate || !customEndDate) {
      alert('Please select both start and end dates');
      return;
    }

    try {
      const data = await fetchCustomDateRange(customStartDate, customEndDate);
      setCustomData(data);
      setCustomDatesApplied(true);
      console.log('Custom date range applied:', { customStartDate, customEndDate, data });
    } catch (error) {
      console.error('Failed to apply custom date range:', error);
      alert('Failed to load data for the selected date range. Please try again.');
    }
  }, [customStartDate, customEndDate, fetchCustomDateRange]);

  // Drag handlers for floating pill
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    const rect = pillRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && pillRef.current) {
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      };
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - pillRef.current.offsetWidth;
      const maxY = window.innerHeight - pillRef.current.offsetHeight;
      
      newPosition.x = Math.max(0, Math.min(maxX, newPosition.x));
      newPosition.y = Math.max(0, Math.min(maxY, newPosition.y));
      
      setPillPosition(newPosition);
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Effects
  useEffect(() => {
    if (userRole === 'Principal' || userRole === 'Admin') {
      fetchComprehensiveData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]); // Intentionally excluding fetchComprehensiveData to prevent infinite loops

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
  const currentData = getCurrentData() || { 
    stats: { total: 0, uniqueStudents: 0, levelChanges: 0, generalCorrespondence: 0 },
    breakdown: { byLevel: {}, byType: {}, byGender: {} }
  };
  const levelStats = getCurrentLevelStats();
  const loading = isInitialLoading || (selectedDate === 'custom' && isCustomDateLoading);

  // Calculate percentages for StatsModal
  const percentages = calculateCorrespondencePercentages(currentData);
  
  // Transform correspondence data to match enquiry structure for StatsModal
  const transformedDataForModal = {
    ...currentData,
    total: currentData?.stats?.total || 0, // Add total at root level
    boys: currentData?.breakdown?.byGender?.male || 0,
    girls: currentData?.breakdown?.byGender?.female || 0,
    programs: {
      boys: {
        levelChange: currentData?.stats?.levelChanges || 0,
        general: currentData?.stats?.generalCorrespondence || 0
      },
      girls: {
        levelChange: currentData?.stats?.levelChanges || 0,
        general: currentData?.stats?.generalCorrespondence || 0
      }
    }
  };

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

        {/* Stats Cards OR Breakdown Cards */}
        {currentView === 'default' ? (
          <CorrespondenceStatsCards 
            stats={currentData?.stats}
            onCardClick={handleCardClick}
            loading={loading}
          />
        ) : (
          <CorrespondenceBreakdownCards 
            currentData={currentData}
            currentView={currentView}
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
          currentData={transformedDataForModal}
          percentages={percentages}
          levelStats={levelStats}
          levelTabs={levelTabs}
          lastUpdated={lastUpdated}
        />
      </div>
    </div>
  );
};

export default PrincipalCorrespondenceManagement;
