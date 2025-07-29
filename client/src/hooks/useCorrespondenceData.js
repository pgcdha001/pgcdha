import { useState, useCallback, useRef } from 'react';
import api from '../services/api';

/**
 * Hook for managing correspondence data with filtering and statistics
 * Similar to useEnquiryData but for correspondence management
 */
const useCorrespondenceData = () => {
  // Cache state
  const [cache, setCache] = useState({
    data: null,
    timestamp: null,
    isValid: false
  });

  // Loading states
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCustomDateLoading, setIsCustomDateLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cache validity (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;
  const REQUEST_TIMEOUT = 10000; // 10 seconds
  
  // Abort controller
  const abortControllerRef = useRef(null);

  /**
   * Filter correspondence by date range
   */
  const filterByDateRange = useCallback((data, range, now) => {
    let startDate = new Date();
    
    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return data;
    }

    return data.filter(item => new Date(item.timestamp) >= startDate);
  }, []);

  /**
   * Calculate correspondence statistics
   */
  const calculateCorrespondenceStats = useCallback((data) => {
    return {
      total: data.length,
      uniqueStudents: [...new Set(data.map(c => c.studentId))].length,
      byType: {
        levelChange: data.filter(c => c.type === 'levelChange').length,
        generalCorrespondence: data.filter(c => c.type === 'generalCorrespondence').length
      },
      byLevel: {
        1: data.filter(c => c.studentLevel === 1).length,
        2: data.filter(c => c.studentLevel === 2).length,
        3: data.filter(c => c.studentLevel === 3).length,
        4: data.filter(c => c.studentLevel === 4).length,
        5: data.filter(c => c.studentLevel === 5).length
      }
    };
  }, []);

  /**
   * Calculate level breakdown
   */
  const calculateLevelBreakdown = useCallback((data) => {
    const levels = {};
    for (let i = 1; i <= 5; i++) {
      levels[i] = data.filter(c => c.studentLevel === i).length;
    }
    return levels;
  }, []);

  /**
   * Process correspondence data for statistics
   */
  const processCorrespondenceData = useCallback((correspondenceData, stats) => {
    // Group by date ranges
    const now = new Date();
    const dateRanges = {
      today: filterByDateRange(correspondenceData, 'today', now),
      week: filterByDateRange(correspondenceData, 'week', now),
      month: filterByDateRange(correspondenceData, 'month', now),
      year: filterByDateRange(correspondenceData, 'year', now),
      all: correspondenceData
    };

    // Calculate statistics for each date range
    const processedRanges = {};
    Object.keys(dateRanges).forEach(range => {
      processedRanges[range] = calculateCorrespondenceStats(dateRanges[range]);
    });

    // Create breakdown data for visualization
    const breakdown = {
      byLevel: calculateLevelBreakdown(correspondenceData),
      byType: {
        levelChange: correspondenceData.filter(c => c.type === 'levelChange').length,
        generalCorrespondence: correspondenceData.filter(c => c.type === 'generalCorrespondence').length
      },
      byGender: {
        male: correspondenceData.filter(c => c.studentGender === 'male').length,
        female: correspondenceData.filter(c => c.studentGender === 'female').length
      },
      byMonth: {}
    };

    // Calculate monthly breakdown
    correspondenceData.forEach(item => {
      const month = new Date(item.timestamp).toISOString().slice(0, 7); // YYYY-MM format
      breakdown.byMonth[month] = (breakdown.byMonth[month] || 0) + 1;
    });

    return {
      raw: correspondenceData,
      stats: {
        total: correspondenceData.length,
        uniqueStudents: stats.uniqueStudentsContacted || 0,
        levelChanges: breakdown.byType.levelChange,
        generalCorrespondence: breakdown.byType.generalCorrespondence,
        recent: correspondenceData.filter(c => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(c.timestamp) >= weekAgo;
        }).length,
        activeStaff: [...new Set(correspondenceData.map(c => c.staffMember?.name))].filter(Boolean).length
      },
      dateRanges: processedRanges,
      breakdown,
      totalRecords: correspondenceData.length
    };
  }, [filterByDateRange, calculateCorrespondenceStats, calculateLevelBreakdown]);

  /**
   * Check if cache is valid
   */
  const isCacheValid = useCallback(() => {
    if (!cache.data || !cache.timestamp || !cache.isValid) return false;
    return Date.now() - cache.timestamp < CACHE_DURATION;
  }, [cache.data, cache.timestamp, cache.isValid, CACHE_DURATION]);

  /**
   * Get last updated time
   */
  const getLastUpdated = useCallback(() => {
    return cache.timestamp ? new Date(cache.timestamp) : null;
  }, [cache.timestamp]);

  /**
   * Fetch comprehensive correspondence data
   */
  const fetchComprehensiveData = useCallback(async (forceRefresh = false) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache validity directly
    const cacheValid = cache.data && cache.timestamp && cache.isValid && 
                      (Date.now() - cache.timestamp < CACHE_DURATION);

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && cacheValid) {
      console.log('Using cached correspondence data');
      return cache.data;
    }

    const loadingState = cache.data ? setIsRefreshing : setIsInitialLoading;
    loadingState(true);
    setError(null);

    try {
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      // Fetch all correspondence data with statistics
      const response = await Promise.race([
        api.get('/correspondence', {
          signal: abortControllerRef.current.signal
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
        )
      ]);

      const correspondenceData = response.data?.data || [];
      const stats = response.data?.stats || {};

      // Process data for statistics
      const processedData = processCorrespondenceData(correspondenceData, stats);

      // Update cache
      setCache({
        data: processedData,
        timestamp: Date.now(),
        isValid: true
      });

      console.log('Correspondence data fetched and cached:', processedData);
      return processedData;

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Correspondence data fetch was aborted');
        return cache.data;
      }

      console.error('Error fetching correspondence data:', error);
      setError(error.message || 'Failed to fetch correspondence data');
      
      // Return cached data if available, or a safe empty structure
      if (cache.data) {
        return cache.data;
      }
      
      // Return safe empty data structure
      return {
        raw: [],
        stats: {
          total: 0,
          uniqueStudents: 0,
          levelChanges: 0,
          generalCorrespondence: 0,
          recent: 0,
          activeStaff: 0
        },
        dateRanges: {
          today: { total: 0, uniqueStudents: 0 },
          week: { total: 0, uniqueStudents: 0 },
          month: { total: 0, uniqueStudents: 0 },
          year: { total: 0, uniqueStudents: 0 },
          all: { total: 0, uniqueStudents: 0 }
        },
        breakdown: {
          byLevel: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          byType: { levelChange: 0, generalCorrespondence: 0 },
          byGender: { male: 0, female: 0 },
          byMonth: {}
        },
        totalRecords: 0
      };
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
      abortControllerRef.current = null;
    }
  }, [cache.data, cache.timestamp, cache.isValid, processCorrespondenceData, CACHE_DURATION]);

  /**
   * Fetch custom date range data
   */
  const fetchCustomDateRange = useCallback(async (startDate, endDate) => {
    setIsCustomDateLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('dateFilter', 'custom');
      params.append('startDate', startDate);
      params.append('endDate', endDate);

      const response = await api.get(`/correspondence?${params.toString()}`);
      const correspondenceData = response.data?.data || [];
      const stats = response.data?.stats || {};

      const processedData = processCorrespondenceData(correspondenceData, stats);
      
      console.log('Custom date range correspondence data:', processedData);
      return processedData;

    } catch (error) {
      console.error('Error fetching custom date range correspondence data:', error);
      setError(error.message || 'Failed to fetch custom date range data');
      
      // Return safe empty data structure instead of throwing
      return {
        raw: [],
        stats: {
          total: 0,
          uniqueStudents: 0,
          levelChanges: 0,
          generalCorrespondence: 0,
          recent: 0,
          activeStaff: 0
        },
        dateRanges: {
          today: { total: 0, uniqueStudents: 0 },
          week: { total: 0, uniqueStudents: 0 },
          month: { total: 0, uniqueStudents: 0 },
          year: { total: 0, uniqueStudents: 0 },
          all: { total: 0, uniqueStudents: 0 }
        },
        breakdown: {
          byLevel: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          byType: { levelChange: 0, generalCorrespondence: 0 },
          byGender: { male: 0, female: 0 },
          byMonth: {}
        },
        totalRecords: 0
      };
    } finally {
      setIsCustomDateLoading(false);
    }
  }, [processCorrespondenceData]);

  /**
   * Get filtered data based on current selections
   */
  const getFilteredData = useCallback((level, dateFilter, customData = null) => {
    const sourceData = customData || cache.data;
    if (!sourceData) return null;

    if (dateFilter === 'custom' && customData) {
      return customData;
    }

    // Get the filtered data from dateRanges
    const rangeData = sourceData.dateRanges[dateFilter] || sourceData.dateRanges.all;
    
    // Convert the flat structure to the expected stats/breakdown structure
    if (rangeData) {
      return {
        stats: {
          total: rangeData.total || 0,
          uniqueStudents: rangeData.uniqueStudents || 0,
          levelChanges: rangeData.byType?.levelChange || 0,
          generalCorrespondence: rangeData.byType?.generalCorrespondence || 0,
          recent: sourceData.stats?.recent || 0, // Use overall recent count
          activeStaff: sourceData.stats?.activeStaff || 0 // Use overall staff count
        },
        breakdown: {
          byLevel: rangeData.byLevel || {},
          byType: rangeData.byType || {},
          byGender: sourceData.breakdown?.byGender || {}, // Use overall gender breakdown
          byMonth: sourceData.breakdown?.byMonth || {} // Use overall monthly breakdown
        }
      };
    }
    
    return null;
  }, [cache.data]);

  /**
   * Get level statistics
   */
  const getLevelStatistics = useCallback((dateFilter, customData = null) => {
    const sourceData = customData || cache.data;
    if (!sourceData) return {};

    // Get the appropriate data range
    let levelData = {};
    if (dateFilter === 'custom' && customData) {
      levelData = customData.breakdown?.byLevel || {};
    } else {
      const rangeData = sourceData.dateRanges[dateFilter] || sourceData.dateRanges.all;
      levelData = rangeData?.byLevel || {};
    }

    // Calculate total for 'all' levels
    const total = Object.values(levelData).reduce((sum, count) => sum + count, 0);
    
    // Return level stats with 'all' included
    return {
      all: total,
      1: levelData[1] || 0,
      2: levelData[2] || 0,
      3: levelData[3] || 0,
      4: levelData[4] || 0,
      5: levelData[5] || 0
    };
  }, [cache.data]);

  /**
   * Refresh data
   */
  const refreshData = useCallback(() => {
    return fetchComprehensiveData(true);
  }, [fetchComprehensiveData]);

  /**
   * Get last updated timestamp
   */
  const lastUpdated = getLastUpdated();

  return {
    // Data fetching
    fetchComprehensiveData,
    fetchCustomDateRange,
    refreshData,
    
    // Data access
    getFilteredData,
    getLevelStatistics,
    
    // Loading states
    isInitialLoading,
    isRefreshing,
    isCustomDateLoading,
    
    // Error state
    error,
    
    // Cache info
    lastUpdated,
    isCacheValid: isCacheValid()
  };
};

export default useCorrespondenceData;
