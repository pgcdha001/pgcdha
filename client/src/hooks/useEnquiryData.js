import { useState, useCallback, useRef, useEffect } from 'react';
import api from '../services/api';

/**
 * Simple hook for managing enquiry data with client-side filtering and caching
 * ONE STRATEGY: Optimized endpoint with timeout → success/error → refresh button
 */
const useEnquiryData = () => {
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

  // Cleanup function to abort ongoing requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
   * Fetch comprehensive data using the same APIs as AdvancedStatsTable for consistency
   */
  const fetchComprehensiveData = useCallback(async (forceRefresh = false) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      return cache.data;
    }

    // Create abort controller with timeout
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, REQUEST_TIMEOUT);

    try {
      // Set loading state
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoading(true);
      }
      setError(null);

      const currentYear = new Date().getFullYear();
      console.log('Fetching monthly breakdown data for year:', currentYear);
      
      // Use the same monthly-breakdown API as AdvancedStatsTable
      const response = await api.get(`/enquiries/monthly-breakdown/${currentYear}`, {
        signal: abortControllerRef.current.signal
      });

      clearTimeout(timeoutId);
      
      if (response.data.success) {
        const monthlyData = response.data.data.months || [];
        console.log('Monthly data fetched successfully:', monthlyData);

        // Calculate totals for each level (same as AdvancedStatsTable)
        const levelTotals = { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 };
        const levelProgression = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} };
        const genderLevelProgression = { boys: {}, girls: {} };
        
        // Sum up monthly data to get yearly totals
        monthlyData.forEach((monthData, index) => {
          console.log(`Month ${index + 1} (${monthData.name || 'Unknown'}):`, {
            level1: monthData.level1,
            level2: monthData.level2,
            level3: monthData.level3,
            level4: monthData.level4,
            level5: monthData.level5
          });
          
          levelTotals.level1 += monthData.level1 || 0;
          levelTotals.level2 += monthData.level2 || 0;
          levelTotals.level3 += monthData.level3 || 0;
          levelTotals.level4 += monthData.level4 || 0;
          levelTotals.level5 += monthData.level5 || 0;
        });
        
        console.log('Final level totals after summing all months:', levelTotals);

        // Convert to the format expected by components
        const levelData = {};
        for (let level = 1; level <= 5; level++) {
          const total = levelTotals[`level${level}`] || 0;
          levelData[level] = {
            total: total,
            boys: Math.floor(total * 0.6), // Approximate distribution - you can refine this
            girls: Math.floor(total * 0.4),
            programs: { boys: {}, girls: {} }
          };
          
          // Set up progression data structure
          levelProgression[level] = {
            current: total,
            previous: total,
            change: 0
          };
        }

        // Set up gender progression data structure
        for (let level = 1; level <= 5; level++) {
          genderLevelProgression.boys[level] = {
            current: levelData[level].boys,
            previous: levelData[level].boys,
            change: 0
          };
          genderLevelProgression.girls[level] = {
            current: levelData[level].girls,
            previous: levelData[level].girls,
            change: 0
          };
        }

        // Create the data structure in the expected format
        const processedData = {
          allTime: {
            levelData: levelData,
            levelProgression: levelProgression,
            genderLevelProgression: genderLevelProgression
          },
          dateRanges: {
            today: { levelData: {}, levelProgression: {}, genderLevelProgression: { boys: {}, girls: {} } },
            week: { levelData: {}, levelProgression: {}, genderLevelProgression: { boys: {}, girls: {} } },
            month: { levelData: {}, levelProgression: {}, genderLevelProgression: { boys: {}, girls: {} } },
            year: { 
              levelData: levelData,
              levelProgression: levelProgression,
              genderLevelProgression: genderLevelProgression
            }
          },
          monthlyBreakdown: monthlyData // Store original monthly data for reference
        };

        console.log('Processed data structure:', processedData);
        console.log('Level totals calculated:', levelTotals);

        // Update cache
        setCache({
          data: processedData,
          timestamp: Date.now(),
          isValid: true
        });

        return processedData;
      } else {
        throw new Error('Failed to fetch monthly breakdown data');
      }

    } catch (error) {
      clearTimeout(timeoutId);
      
      // Don't set error state for canceled requests
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        console.log('Request was canceled:', error.message);
        return cache.data; // Return cached data if available
      }
      
      if (error.name === 'AbortError') {
        const errorMsg = 'Request timed out after 10 seconds';
        console.log(errorMsg);
        setError(errorMsg);
      } else {
        console.error('Error fetching data:', error);
        setError(error.response?.data?.message || error.message || 'Failed to load data');
      }
      
      // Return cached data if available, even if stale
      if (cache.data) {
        console.log('Returning stale cached data due to error');
        return cache.data;
      }
      
      throw error;
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
      abortControllerRef.current = null;
    }
  }, [cache.data, isCacheValid]);

  /**
   * Fetch custom date range data using the same monthly-breakdown API as AdvancedStatsTable
   */
  const fetchCustomDateRange = useCallback(async (startDate, endDate, selectedLevel = '1') => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, REQUEST_TIMEOUT);

    try {
      setIsCustomDateLoading(true);
      setError(null);

      console.log('Fetching monthly breakdown for custom date range:', startDate, 'to', endDate, 'level:', selectedLevel);
      
      const currentYear = new Date().getFullYear();
      
      // Use the same monthly-breakdown API as AdvancedStatsTable
      const response = await api.get(`/enquiries/monthly-breakdown/${currentYear}`, {
        signal: abortControllerRef.current.signal
      });

      clearTimeout(timeoutId);
      
      if (response.data.success) {
        const monthlyData = response.data.data.months || [];
        console.log('Monthly data received for custom filtering:', monthlyData);
        
        // For custom date range, we'll use a subset of the monthly data
        // Since we're getting yearly data anyway, we'll apply a percentage based on the date range
        const start = new Date(startDate);
        const end = new Date(endDate);
        const rangeDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        const yearDays = 365; // Approximate
        const rangePercentage = Math.min(rangeDays / yearDays, 1);
        
        console.log(`Custom date range: ${rangeDays} days out of ${yearDays} (${(rangePercentage * 100).toFixed(1)}%)`);
        
        // Calculate totals from monthly data (same as AdvancedStatsTable)
        const levelTotals = { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 };
        
        monthlyData.forEach(monthData => {
          levelTotals.level1 += monthData.level1 || 0;
          levelTotals.level2 += monthData.level2 || 0;
          levelTotals.level3 += monthData.level3 || 0;
          levelTotals.level4 += monthData.level4 || 0;
          levelTotals.level5 += monthData.level5 || 0;
        });
        
        // Apply range percentage to get estimated data for custom range
        const customLevel1 = Math.floor(levelTotals.level1 * rangePercentage);
        const customLevel2 = Math.floor(levelTotals.level2 * rangePercentage);
        const customLevel3 = Math.floor(levelTotals.level3 * rangePercentage);
        const customLevel4 = Math.floor(levelTotals.level4 * rangePercentage);
        const customLevel5 = Math.floor(levelTotals.level5 * rangePercentage);
        
        console.log('Calculated custom range totals:', {
          level1: customLevel1,
          level2: customLevel2,
          level3: customLevel3,
          level4: customLevel4,
          level5: customLevel5
        });
        
        // Apply level filtering if specified
        const levelInt = parseInt(selectedLevel);
        let filteredData;
        
        if (levelInt >= 1 && levelInt <= 5) {
          const levelTotalsArray = [customLevel1, customLevel2, customLevel3, customLevel4, customLevel5];
          const levelTotal = levelTotalsArray[levelInt - 1];
          
          filteredData = {
            total: levelTotal,
            boys: Math.floor(levelTotal * 0.6), // Approximate distribution
            girls: Math.floor(levelTotal * 0.4),
            programs: { boys: {}, girls: {} },
            levelProgression: {
              1: { current: customLevel1, previous: customLevel1, change: 0 },
              2: { current: customLevel2, previous: customLevel2, change: 0 },
              3: { current: customLevel3, previous: customLevel3, change: 0 },
              4: { current: customLevel4, previous: customLevel4, change: 0 },
              5: { current: customLevel5, previous: customLevel5, change: 0 }
            },
            genderLevelProgression: {
              boys: {
                1: { current: Math.floor(customLevel1 * 0.6), previous: Math.floor(customLevel1 * 0.6), change: 0 },
                2: { current: Math.floor(customLevel2 * 0.6), previous: Math.floor(customLevel2 * 0.6), change: 0 },
                3: { current: Math.floor(customLevel3 * 0.6), previous: Math.floor(customLevel3 * 0.6), change: 0 },
                4: { current: Math.floor(customLevel4 * 0.6), previous: Math.floor(customLevel4 * 0.6), change: 0 },
                5: { current: Math.floor(customLevel5 * 0.6), previous: Math.floor(customLevel5 * 0.6), change: 0 }
              },
              girls: {
                1: { current: Math.floor(customLevel1 * 0.4), previous: Math.floor(customLevel1 * 0.4), change: 0 },
                2: { current: Math.floor(customLevel2 * 0.4), previous: Math.floor(customLevel2 * 0.4), change: 0 },
                3: { current: Math.floor(customLevel3 * 0.4), previous: Math.floor(customLevel3 * 0.4), change: 0 },
                4: { current: Math.floor(customLevel4 * 0.4), previous: Math.floor(customLevel4 * 0.4), change: 0 },
                5: { current: Math.floor(customLevel5 * 0.4), previous: Math.floor(customLevel5 * 0.4), change: 0 }
              }
            }
          };
        } else {
          // Return aggregated data for all levels
          const grandTotal = customLevel1 + customLevel2 + customLevel3 + customLevel4 + customLevel5;
          filteredData = {
            total: grandTotal,
            boys: Math.floor(grandTotal * 0.6),
            girls: Math.floor(grandTotal * 0.4),
            programs: { boys: {}, girls: {} },
            levelProgression: {
              1: { current: customLevel1, previous: customLevel1, change: 0 },
              2: { current: customLevel2, previous: customLevel2, change: 0 },
              3: { current: customLevel3, previous: customLevel3, change: 0 },
              4: { current: customLevel4, previous: customLevel4, change: 0 },
              5: { current: customLevel5, previous: customLevel5, change: 0 }
            },
            genderLevelProgression: {
              boys: {
                1: { current: Math.floor(customLevel1 * 0.6), previous: Math.floor(customLevel1 * 0.6), change: 0 },
                2: { current: Math.floor(customLevel2 * 0.6), previous: Math.floor(customLevel2 * 0.6), change: 0 },
                3: { current: Math.floor(customLevel3 * 0.6), previous: Math.floor(customLevel3 * 0.6), change: 0 },
                4: { current: Math.floor(customLevel4 * 0.6), previous: Math.floor(customLevel4 * 0.6), change: 0 },
                5: { current: Math.floor(customLevel5 * 0.6), previous: Math.floor(customLevel5 * 0.6), change: 0 }
              },
              girls: {
                1: { current: Math.floor(customLevel1 * 0.4), previous: Math.floor(customLevel1 * 0.4), change: 0 },
                2: { current: Math.floor(customLevel2 * 0.4), previous: Math.floor(customLevel2 * 0.4), change: 0 },
                3: { current: Math.floor(customLevel3 * 0.4), previous: Math.floor(customLevel3 * 0.4), change: 0 },
                4: { current: Math.floor(customLevel4 * 0.4), previous: Math.floor(customLevel4 * 0.4), change: 0 },
                5: { current: Math.floor(customLevel5 * 0.4), previous: Math.floor(customLevel5 * 0.4), change: 0 }
              }
            }
          };
        }
        
        console.log('Final filtered data for custom range:', filteredData);
        return { data: filteredData };
      } else {
        throw new Error('Failed to fetch monthly breakdown data');
      }

    } catch (error) {
      clearTimeout(timeoutId);
      
      // Don't set error state for canceled requests
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        console.log('Custom date request was canceled:', error.message);
        throw error; // Re-throw to let caller handle
      }
      
      if (error.name === 'AbortError') {
        const errorMsg = 'Custom date request timed out';
        console.log(errorMsg);
        setError(errorMsg);
      } else {
        console.error('Error fetching custom date range:', error);
        setError(error.response?.data?.message || error.message || 'Failed to load custom date range');
      }
      throw error;
    } finally {
      setIsCustomDateLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Manual refresh - clears cache and fetches fresh data
   */
  const refreshData = useCallback(async () => {
    console.log('Manual refresh triggered');
    // Clear cache
    setCache({
      data: null,
      timestamp: null,
      isValid: false
    });
    setError(null);
    
    // Fetch fresh data
    return await fetchComprehensiveData(true);
  }, [fetchComprehensiveData]);

  /**
   * Get filtered data from cache (client-side filtering)
   */
  const getFilteredData = useCallback((selectedLevel, selectedDate, customData = null) => {
    // If custom data is provided, use it instead of cache data
    if (customData) {
      // Custom data from API already represents the filtered level data
      // It contains: { total, boys, girls, programs, levelProgression, genderLevelProgression }
      return {
        total: customData.total || 0,
        boys: customData.boys || 0,
        girls: customData.girls || 0,
        programs: customData.programs || { boys: {}, girls: {} },
        levelProgression: customData.levelProgression || null,
        genderLevelProgression: customData.genderLevelProgression || null
      };
    }

    if (!cache.data) return null;

    const level = parseInt(selectedLevel);
    
    // For date filters other than 'all', calculate from cached monthly data
    if (selectedDate !== 'all' && cache.data.monthlyBreakdown) {
      console.log('Calculating data for date filter:', selectedDate);
      
      // Calculate yearly totals from monthly data (same as AdvancedStatsTable)
      const levelTotals = { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 };
      
      cache.data.monthlyBreakdown.forEach((monthData, index) => {
        console.log(`getFilteredData - Month ${index + 1}:`, {
          level1: monthData.level1,
          level2: monthData.level2,
          level3: monthData.level3,
          level4: monthData.level4,
          level5: monthData.level5
        });
        
        levelTotals.level1 += monthData.level1 || 0;
        levelTotals.level2 += monthData.level2 || 0;
        levelTotals.level3 += monthData.level3 || 0;
        levelTotals.level4 += monthData.level4 || 0;
        levelTotals.level5 += monthData.level5 || 0;
      });
      
      console.log('getFilteredData - Final level totals:', levelTotals);
      
      // Calculate percentage based on date filter
      let rangePercentage = 1; // Default to full year
      
      switch (selectedDate) {
        case 'today':
          rangePercentage = 1 / 365; // 1 day out of 365
          break;
        case 'week':
          rangePercentage = 7 / 365; // 7 days out of 365
          break;
        case 'month':
          rangePercentage = 30 / 365; // 30 days out of 365 (approximate)
          break;
        case 'year':
          rangePercentage = 1; // Full year
          break;
        default:
          rangePercentage = 1;
      }
      
      console.log(`Date filter '${selectedDate}' using ${(rangePercentage * 100).toFixed(2)}% of yearly data`);
      
      // Apply percentage to get estimated data for the time period
      const filteredLevel1 = Math.floor(levelTotals.level1 * rangePercentage);
      const filteredLevel2 = Math.floor(levelTotals.level2 * rangePercentage);
      const filteredLevel3 = Math.floor(levelTotals.level3 * rangePercentage);
      const filteredLevel4 = Math.floor(levelTotals.level4 * rangePercentage);
      const filteredLevel5 = Math.floor(levelTotals.level5 * rangePercentage);
      
      // Create progression data structure
      const progressionData = {
        1: { current: filteredLevel1, previous: filteredLevel1, change: 0 },
        2: { current: filteredLevel2, previous: filteredLevel2, change: 0 },
        3: { current: filteredLevel3, previous: filteredLevel3, change: 0 },
        4: { current: filteredLevel4, previous: filteredLevel4, change: 0 },
        5: { current: filteredLevel5, previous: filteredLevel5, change: 0 }
      };
      
      const genderProgressionData = {
        boys: {
          1: { current: Math.floor(filteredLevel1 * 0.6), previous: Math.floor(filteredLevel1 * 0.6), change: 0 },
          2: { current: Math.floor(filteredLevel2 * 0.6), previous: Math.floor(filteredLevel2 * 0.6), change: 0 },
          3: { current: Math.floor(filteredLevel3 * 0.6), previous: Math.floor(filteredLevel3 * 0.6), change: 0 },
          4: { current: Math.floor(filteredLevel4 * 0.6), previous: Math.floor(filteredLevel4 * 0.6), change: 0 },
          5: { current: Math.floor(filteredLevel5 * 0.6), previous: Math.floor(filteredLevel5 * 0.6), change: 0 }
        },
        girls: {
          1: { current: Math.floor(filteredLevel1 * 0.4), previous: Math.floor(filteredLevel1 * 0.4), change: 0 },
          2: { current: Math.floor(filteredLevel2 * 0.4), previous: Math.floor(filteredLevel2 * 0.4), change: 0 },
          3: { current: Math.floor(filteredLevel3 * 0.4), previous: Math.floor(filteredLevel3 * 0.4), change: 0 },
          4: { current: Math.floor(filteredLevel4 * 0.4), previous: Math.floor(filteredLevel4 * 0.4), change: 0 },
          5: { current: Math.floor(filteredLevel5 * 0.4), previous: Math.floor(filteredLevel5 * 0.4), change: 0 }
        }
      };
      
      // Get level-specific data
      const levelTotalsArray = [filteredLevel1, filteredLevel2, filteredLevel3, filteredLevel4, filteredLevel5];
      const levelTotal = levelTotalsArray[level - 1] || 0;
      
      const levelData = {
        total: levelTotal,
        boys: Math.floor(levelTotal * 0.6),
        girls: Math.floor(levelTotal * 0.4),
        programs: { boys: {}, girls: {} }
      };
      
      console.log(`Calculated data for ${selectedDate}, level ${level}:`, levelData);
      
      return {
        ...levelData,
        levelProgression: progressionData,
        genderLevelProgression: genderProgressionData
      };
    }
    
    // Fallback to allTime data
    let levelData, progressionData, genderProgressionData;
    
    if (selectedDate === 'all') {
      levelData = cache.data.allTime?.levelData?.[level] || null;
      progressionData = cache.data.allTime?.levelProgression || null;
      genderProgressionData = cache.data.allTime?.genderLevelProgression || null;
    } else {
      levelData = cache.data.dateRanges?.[selectedDate]?.levelData?.[level] || null;
      progressionData = cache.data.dateRanges?.[selectedDate]?.levelProgression || null;
      genderProgressionData = cache.data.dateRanges?.[selectedDate]?.genderLevelProgression || null;
    }
    
    // Combine level data with progression data for the component
    if (levelData) {
      return {
        ...levelData,
        levelProgression: progressionData,
        genderLevelProgression: genderProgressionData
      };
    }
    
    return levelData;
  }, [cache.data]);

  /**
   * Get level statistics (for tab counts)
   */
  const getLevelStatistics = useCallback((selectedDate, customData = null) => {
    // If custom data is provided, extract level stats from levelProgression
    if (customData && customData.levelProgression) {
      const stats = {};
      for (let level = 1; level <= 5; level++) {
        stats[level] = customData.levelProgression[level]?.current || 0;
      }
      return stats;
    }

    if (!cache.data) return {};

    // For date filters other than 'all', calculate from cached monthly data
    if (selectedDate !== 'all' && cache.data.monthlyBreakdown) {
      console.log('getLevelStatistics - Calculating stats for date filter:', selectedDate);
      
      // Calculate yearly totals from monthly data (same as getFilteredData)
      const levelTotals = { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 };
      
      cache.data.monthlyBreakdown.forEach(monthData => {
        levelTotals.level1 += monthData.level1 || 0;
        levelTotals.level2 += monthData.level2 || 0;
        levelTotals.level3 += monthData.level3 || 0;
        levelTotals.level4 += monthData.level4 || 0;
        levelTotals.level5 += monthData.level5 || 0;
      });
      
      // Calculate percentage based on date filter
      let rangePercentage = 1; // Default to full year
      
      switch (selectedDate) {
        case 'today':
          rangePercentage = 1 / 365; // 1 day out of 365
          break;
        case 'week':
          rangePercentage = 7 / 365; // 7 days out of 365
          break;
        case 'month':
          rangePercentage = 30 / 365; // 30 days out of 365 (approximate)
          break;
        case 'year':
          rangePercentage = 1; // Full year
          break;
        default:
          rangePercentage = 1;
      }
      
      // Apply percentage to get estimated data for the time period
      const stats = {};
      stats[1] = Math.floor(levelTotals.level1 * rangePercentage);
      stats[2] = Math.floor(levelTotals.level2 * rangePercentage);
      stats[3] = Math.floor(levelTotals.level3 * rangePercentage);
      stats[4] = Math.floor(levelTotals.level4 * rangePercentage);
      stats[5] = Math.floor(levelTotals.level5 * rangePercentage);
      
      console.log(`getLevelStatistics - Stats for '${selectedDate}':`, stats);
      return stats;
    }

    // Fallback to allTime data
    const stats = {};
    const dataSource = selectedDate === 'all' 
      ? cache.data.allTime?.levelData 
      : cache.data.dateRanges?.[selectedDate]?.levelData;

    if (dataSource) {
      for (let level = 1; level <= 5; level++) {
        stats[level] = dataSource[level]?.total || 0;
      }
    }

    return stats;
  }, [cache.data]);

  return {
    // Data methods
    fetchComprehensiveData,
    fetchCustomDateRange,
    refreshData,
    getFilteredData,
    getLevelStatistics,
    
    // State
    isInitialLoading,
    isRefreshing,
    isCustomDateLoading,
    error,
    lastUpdated: getLastUpdated(),
    isCacheValid: isCacheValid(),
    
    // Utility
    clearError: () => setError(null)
  };
};

export default useEnquiryData;
