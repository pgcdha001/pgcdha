import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import useCorrespondenceData from '../../hooks/useCorrespondenceData';

// Import reusable components - following enquiry management pattern
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

  // State management
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // enquiry, student, all
  const [selectedGender, setSelectedGender] = useState('all'); // male, female, all
  const [selectedStaff, setSelectedStaff] = useState('all'); // staff member filter
  const [searchTerm, setSearchTerm] = useState(''); // search by student name

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
  const isInitialized = useRef(false);

  // Level tabs configuration
  const levelTabs = React.useMemo(() => [
    { value: 'all', label: 'All Levels', color: 'bg-gray-500', count: 0 },
    { value: '1', label: 'Level 1', color: 'bg-green-500', count: 0 },
    { value: '2', label: 'Level 2', color: 'bg-yellow-500', count: 0 },
    { value: '3', label: 'Level 3', color: 'bg-orange-500', count: 0 },
    { value: '4', label: 'Level 4', color: 'bg-red-500', count: 0 },
    { value: '5', label: 'Level 5', color: 'bg-purple-500', count: 0 }
  ], []);

  // Date filter options
  const dateFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Type filter options
  const typeFilters = [
    { value: 'all', label: 'All Types' },
    { value: 'enquiry', label: 'Enquiry Correspondence' },
    { value: 'student', label: 'Student Correspondence' }
  ];

  // Gender filter options
  const genderFilters = [
    { value: 'all', label: 'All Genders' },
    { value: 'male', label: 'Male Students' },
    { value: 'female', label: 'Female Students' }
  ];

  // Get current data based on selected filters
  const getCurrentData = useCallback(() => {
    const dateFilter = selectedDate === 'custom' && customDatesApplied ? 'custom' : selectedDate;
    
    let currentData;
    if (dateFilter === 'custom' && customData) {
      currentData = customData;
    } else {
      currentData = getFilteredData(selectedLevel, dateFilter);
    }
    
    console.log('getCurrentData - correspondence:', {
      dateFilter,
      level: selectedLevel,
      type: selectedType,
      gender: selectedGender,
      staff: selectedStaff,
      search: searchTerm,
      currentData
    });
    
    return currentData;
  }, [selectedLevel, selectedDate, selectedType, selectedGender, selectedStaff, searchTerm, customDatesApplied, customData, getFilteredData]);

  // Get current level statistics
  const getCurrentLevelStats = useCallback(() => {
    const dateFilter = selectedDate === 'custom' && customDatesApplied ? 'custom' : selectedDate;
    
    if (dateFilter === 'custom' && customData) {
      return getLevelStatistics(dateFilter, customData);
    } else {
      return getLevelStatistics(dateFilter);
    }
  }, [selectedDate, customDatesApplied, customData, getLevelStatistics]);

  // Handle custom date range application
  const handleCustomDateApply = useCallback(async () => {
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

  // Handle custom date range reset
  const handleCustomDateReset = useCallback(() => {
    setCustomStartDate('');
    setCustomEndDate('');
    setCustomDatesApplied(false);
    setCustomData(null);
    console.log('Custom date range reset');
  }, []);

  // Handle level tab change
  const handleLevelChange = useCallback((level) => {
    setSelectedLevel(level);
    console.log('Level changed to:', level);
  }, []);

  // Handle date filter change
  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
    if (date !== 'custom') {
      handleCustomDateReset();
    }
    console.log('Date filter changed to:', date);
  }, [handleCustomDateReset]);

  // Initialize data on component mount
  useEffect(() => {
    if ((userRole === 'Principal' || userRole === 'Admin') && !isInitialized.current) {
      isInitialized.current = true;
      fetchComprehensiveData();
    }
  }, [userRole, fetchComprehensiveData]);

  // Update level tabs with current counts
  const updatedLevelTabs = React.useMemo(() => {
    return levelTabs.map(tab => {
      const currentData = getCurrentData();
      let count = 0;
      
      // Debug: Log the exact data structure
      console.log('updatedLevelTabs - currentData structure:', currentData);
      
      // Check both possible data structures
      const levelData = currentData?.breakdown?.byLevel || currentData?.byLevel;
      
      console.log('levelData found:', levelData);
      
      if (levelData) {
        if (tab.value === 'all') {
          count = Object.values(levelData).reduce((sum, c) => sum + c, 0);
        } else {
          count = levelData[tab.value] || 0;
        }
      }
      
      console.log(`Tab ${tab.value} count:`, count);
      
      return { ...tab, count };
    });
  }, [levelTabs, getCurrentData]);

  // Error display
  if (error && !getCurrentData()) {
    return (
      <ErrorDisplay 
        error={error}
        onRetry={() => fetchComprehensiveData(true)}
        isRetrying={isRefreshing}
      />
    );
  }

  const currentData = getCurrentData();
  const levelStats = getCurrentLevelStats();

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Custom Header with Search and Refresh */}
      <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Correspondence Management
              </h1>
              <p className="text-gray-600">
                Comprehensive correspondence statistics and analytics
              </p>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-2">
                  Last updated: {lastUpdated.toLocaleString()}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <button
                onClick={() => {
                  // Reset all filters to show all data - this acts as a "show all" search
                  if (searchTerm || selectedLevel !== 'all' || selectedType !== 'all' || selectedGender !== 'all' || selectedStaff !== 'all') {
                    // Reset filters
                    setSearchTerm('');
                    setSelectedLevel('all');
                    setSelectedType('all');
                    setSelectedGender('all');
                    setSelectedStaff('all');
                    console.log('Filters reset - showing all correspondence');
                  } else {
                    // If no filters are active, could focus on search input
                    console.log('All filters already cleared. Use the search box below to filter correspondence.');
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                title="Clear all filters and show all correspondence"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear Filters</span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={() => refreshData()}
                disabled={isInitialLoading || isRefreshing}
                className={`flex items-center space-x-2 px-4 py-2 ${error ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed`}
                title={error ? `Error: ${error}. Click to retry.` : "Refresh data from server"}
              >
                <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>
                  {isRefreshing ? 'Refreshing...' : error ? 'Retry' : 'Refresh'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Level Tabs */}
      <LevelTabs
        levelTabs={updatedLevelTabs}
        selectedLevel={selectedLevel}
        onLevelChange={handleLevelChange}
        isLoading={isInitialLoading}
      />

      {/* Filters Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Date Filter */}
        <DateFilter
          selectedDate={selectedDate}
          dateFilters={dateFilters}
          onDateChange={handleDateChange}
          isLoading={isInitialLoading || isCustomDateLoading}
        />

        {/* Correspondence Filters */}
        <CorrespondenceFilters
          selectedType={selectedType}
          selectedGender={selectedGender}
          selectedStaff={selectedStaff}
          searchTerm={searchTerm}
          typeFilters={typeFilters}
          genderFilters={genderFilters}
          currentData={currentData}
          onTypeChange={setSelectedType}
          onGenderChange={setSelectedGender}
          onStaffChange={setSelectedStaff}
          onSearchChange={setSearchTerm}
          isLoading={isInitialLoading}
        />
      </div>

      {/* Custom Date Range */}
      {selectedDate === 'custom' && (
        <CustomDateRange
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          customDatesApplied={customDatesApplied}
          isCustomDateLoading={isCustomDateLoading}
          onStartDateChange={setCustomStartDate}
          onEndDateChange={setCustomEndDate}
          onApply={handleCustomDateApply}
          onReset={handleCustomDateReset}
        />
      )}

      {/* Main Statistics */}
      {currentData && (
        <>
          {/* Correspondence-specific Stats Cards */}
          <CorrespondenceStatsCards
            stats={currentData?.stats}
            isLoading={isInitialLoading}
          />

          {/* Breakdown Cards */}
          <CorrespondenceBreakdownCards
            currentData={currentData}
            isLoading={isInitialLoading}
          />
        </>
      )}

      {/* Loading Overlay */}
      {isInitialLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-900">Loading correspondence data...</p>
            <p className="text-sm text-gray-600">This may take a few moments</p>
          </div>
        </div>
      )}

      {/* Floating Stats Pill */}
      <FloatingStatsPill
        ref={pillRef}
        position={pillPosition}
        data={currentData}
        onShowModal={() => setShowStatsModal(true)}
        isDragging={isDragging}
        onDragStart={(e) => {
          setIsDragging(true);
          const rect = pillRef.current.getBoundingClientRect();
          setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          });
        }}
        onDragEnd={() => setIsDragging(false)}
        onDrag={(e) => {
          if (isDragging) {
            setPillPosition({
              x: e.clientX - dragOffset.x,
              y: e.clientY - dragOffset.y
            });
          }
        }}
      />

      {/* Stats Modal */}
      {showStatsModal && (
        <StatsModal
          data={currentData}
          levelStats={levelStats}
          filters={{
            level: selectedLevel,
            date: selectedDate,
            type: selectedType,
            gender: selectedGender,
            staff: selectedStaff,
            search: searchTerm
          }}
          onClose={() => setShowStatsModal(false)}
        />
      )}
    </div>
  );
};

export default PrincipalCorrespondenceManagement;
