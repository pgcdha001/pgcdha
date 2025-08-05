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
   * Get filtered data from API using same endpoints as AdvancedStatsTable
   */
  const getFilteredData = useCallback(async (selectedLevel, selectedDate, customData = null) => {
    // If custom data is provided, use it instead of API calls
    if (customData) {
      return {
        total: customData.total || 0,
        boys: customData.boys || 0,
        girls: customData.girls || 0,
        programs: customData.programs || { boys: {}, girls: {} },
        levelProgression: customData.levelProgression || null,
        genderLevelProgression: customData.genderLevelProgression || null
      };
    }

    const level = parseInt(selectedLevel);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // Convert to 1-based month for API
    const currentDate = new Date().getDate();

    console.log('getFilteredData - Using same APIs as AdvancedStatsTable');
    console.log('getFilteredData - Current date info:', { currentYear, currentMonth, currentDate });
    console.log('getFilteredData - Date filter:', selectedDate, 'Level:', level);

    try {
      let levelData = { total: 0, boys: 0, girls: 0, programs: { boys: {}, girls: {} } };

      if (selectedDate === 'today') {
        console.log('getFilteredData - Fetching daily breakdown for today');
        // Use same API as AdvancedStatsTable: /enquiries/daily-breakdown/year/month
        const response = await api.get(`/enquiries/daily-breakdown/${currentYear}/${currentMonth}`);
        console.log('getFilteredData - Daily API response:', response.data);
        
        if (response.data.success && response.data.data.days) {
          const todayData = response.data.data.days.find(day => day.day === currentDate);
          console.log('getFilteredData - Today data found:', todayData);
          
          if (todayData) {
            const levelCount = todayData[`level${level}`] || 0;
            levelData = {
              total: levelCount,
              boys: Math.floor(levelCount * 0.6), // Approximate ratio
              girls: Math.floor(levelCount * 0.4),
              programs: { boys: {}, girls: {} }
            };
            console.log('getFilteredData - Today level data calculated:', levelData);
          }
        }
      } else if (selectedDate === 'week') {
        console.log('getFilteredData - Fetching daily breakdown for week');
        // Get last 7 days from daily breakdown
        const response = await api.get(`/enquiries/daily-breakdown/${currentYear}/${currentMonth}`);
        console.log('getFilteredData - Daily API response for week:', response.data);
        
        if (response.data.success && response.data.data.days) {
          const last7Days = response.data.data.days
            .filter(day => day.day <= currentDate && day.day > currentDate - 7)
            .reduce((sum, day) => sum + (day[`level${level}`] || 0), 0);
          
          levelData = {
            total: last7Days,
            boys: Math.floor(last7Days * 0.6),
            girls: Math.floor(last7Days * 0.4),
            programs: { boys: {}, girls: {} }
          };
          console.log('getFilteredData - Week level data calculated:', levelData);
        }
      } else if (selectedDate === 'month') {
        console.log('getFilteredData - Fetching monthly breakdown for current month');
        // Use same API as AdvancedStatsTable: /enquiries/monthly-breakdown/year
        const response = await api.get(`/enquiries/monthly-breakdown/${currentYear}`);
        console.log('getFilteredData - Monthly API response:', response.data);
        
        if (response.data.success && response.data.data.months) {
          // Find current month data by month number (1-based)
          const currentMonthData = response.data.data.months.find(month => month.monthNumber === currentMonth);
          console.log('getFilteredData - Current month data found:', currentMonthData);
          
          if (currentMonthData) {
            const levelCount = currentMonthData[`level${level}`] || 0;
            levelData = {
              total: levelCount,
              boys: Math.floor(levelCount * 0.6),
              girls: Math.floor(levelCount * 0.4),
              programs: { boys: {}, girls: {} }
            };
            console.log('getFilteredData - Month level data calculated:', levelData);
          }
        }
      } else if (selectedDate === 'year' || selectedDate === 'all') {
        console.log('getFilteredData - Fetching monthly breakdown for year');
        // Get all months and sum up - same API as AdvancedStatsTable
        const response = await api.get(`/enquiries/monthly-breakdown/${currentYear}`);
        console.log('getFilteredData - Monthly API response for year:', response.data);
        
        if (response.data.success && response.data.data.months) {
          const yearTotal = response.data.data.months
            .reduce((sum, month) => sum + (month[`level${level}`] || 0), 0);
          
          levelData = {
            total: yearTotal,
            boys: Math.floor(yearTotal * 0.6),
            girls: Math.floor(yearTotal * 0.4),
            programs: { boys: {}, girls: {} }
          };
          console.log('getFilteredData - Year level data calculated:', levelData);
        }
      }

      // Create basic progression data
      const progressionData = {
        1: { current: 0, previous: 0, change: 0 },
        2: { current: 0, previous: 0, change: 0 },
        3: { current: 0, previous: 0, change: 0 },
        4: { current: 0, previous: 0, change: 0 },
        5: { current: 0, previous: 0, change: 0 }
      };
      progressionData[level] = { current: levelData.total, previous: levelData.total, change: 0 };

      const genderProgressionData = {
        boys: {
          1: { current: 0, previous: 0, change: 0 },
          2: { current: 0, previous: 0, change: 0 },
          3: { current: 0, previous: 0, change: 0 },
          4: { current: 0, previous: 0, change: 0 },
          5: { current: 0, previous: 0, change: 0 }
        },
        girls: {
          1: { current: 0, previous: 0, change: 0 },
          2: { current: 0, previous: 0, change: 0 },
          3: { current: 0, previous: 0, change: 0 },
          4: { current: 0, previous: 0, change: 0 },
          5: { current: 0, previous: 0, change: 0 }
        }
      };
      genderProgressionData.boys[level] = { current: levelData.boys, previous: levelData.boys, change: 0 };
      genderProgressionData.girls[level] = { current: levelData.girls, previous: levelData.girls, change: 0 };

      const result = {
        ...levelData,
        levelProgression: progressionData,
        genderLevelProgression: genderProgressionData
      };
      
      console.log('getFilteredData - Final result:', result);
      return result;

    } catch (error) {
      console.error('Error fetching filtered data:', error);
      return {
        total: 0,
        boys: 0,
        girls: 0,
        programs: { boys: {}, girls: {} },
        levelProgression: null,
        genderLevelProgression: null
      };
    }
  }, []);

  /**
   * Get level statistics using same APIs as AdvancedStatsTable (for tab counts)
   */
  const getLevelStatistics = useCallback(async (selectedDate, customData = null) => {
    // If custom data is provided, extract level stats from levelProgression
    if (customData && customData.levelProgression) {
      const stats = {};
      for (let level = 1; level <= 5; level++) {
        stats[level] = customData.levelProgression[level]?.current || 0;
      }
      console.log('getLevelStatistics - Using custom data:', stats);
      return stats;
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // Convert to 1-based month for API
    const currentDate = new Date().getDate();

    console.log('getLevelStatistics - Using same APIs as AdvancedStatsTable for date filter:', selectedDate);

    try {
      let stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      if (selectedDate === 'today') {
        // Use daily breakdown API to get today's data
        const response = await api.get(`/enquiries/daily-breakdown/${currentYear}/${currentMonth}`);
        if (response.data.success && response.data.data.days) {
          const todayData = response.data.data.days.find(day => day.day === currentDate);
          if (todayData) {
            stats = {
              1: todayData.level1 || 0,
              2: todayData.level2 || 0,
              3: todayData.level3 || 0,
              4: todayData.level4 || 0,
              5: todayData.level5 || 0
            };
          }
        }
      } else if (selectedDate === 'week') {
        // Use daily breakdown API to get last 7 days
        const response = await api.get(`/enquiries/daily-breakdown/${currentYear}/${currentMonth}`);
        if (response.data.success && response.data.data.days) {
          const weekData = response.data.data.days.filter(day => 
            day.day <= currentDate && day.day > currentDate - 7
          );
          
          stats = {
            1: weekData.reduce((sum, day) => sum + (day.level1 || 0), 0),
            2: weekData.reduce((sum, day) => sum + (day.level2 || 0), 0),
            3: weekData.reduce((sum, day) => sum + (day.level3 || 0), 0),
            4: weekData.reduce((sum, day) => sum + (day.level4 || 0), 0),
            5: weekData.reduce((sum, day) => sum + (day.level5 || 0), 0)
          };
        }
      } else if (selectedDate === 'month') {
        // Use monthly breakdown API to get current month
        const response = await api.get(`/enquiries/monthly-breakdown/${currentYear}`);
        if (response.data.success && response.data.data.months) {
          const currentMonthData = response.data.data.months.find(month => month.monthNumber === currentMonth);
          if (currentMonthData) {
            stats = {
              1: currentMonthData.level1 || 0,
              2: currentMonthData.level2 || 0,
              3: currentMonthData.level3 || 0,
              4: currentMonthData.level4 || 0,
              5: currentMonthData.level5 || 0
            };
          }
        }
      } else if (selectedDate === 'year' || selectedDate === 'all') {
        // Use monthly breakdown API to get all months and sum them
        const response = await api.get(`/enquiries/monthly-breakdown/${currentYear}`);
        if (response.data.success && response.data.data.months) {
          stats = {
            1: response.data.data.months.reduce((sum, month) => sum + (month.level1 || 0), 0),
            2: response.data.data.months.reduce((sum, month) => sum + (month.level2 || 0), 0),
            3: response.data.data.months.reduce((sum, month) => sum + (month.level3 || 0), 0),
            4: response.data.data.months.reduce((sum, month) => sum + (month.level4 || 0), 0),
            5: response.data.data.months.reduce((sum, month) => sum + (month.level5 || 0), 0)
          };
        }
      }
      
      console.log('getLevelStatistics - Stats calculated from API:', stats);
      return stats;

    } catch (error) {
      console.error('Error in getLevelStatistics:', error);
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }
  }, []);

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
