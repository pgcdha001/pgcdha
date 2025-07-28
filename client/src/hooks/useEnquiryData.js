import { useState, useCallback, useRef } from 'react';
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
   * Fetch comprehensive data from optimized endpoint
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

      console.log('Fetching comprehensive data...');
      const response = await api.get('/enquiries/comprehensive-data', {
        signal: abortControllerRef.current.signal
      });

      clearTimeout(timeoutId);
      
      const data = response.data.data;
      console.log('Data fetched successfully');

      // Update cache
      setCache({
        data: data,
        timestamp: Date.now(),
        isValid: true
      });

      return data;

    } catch (error) {
      clearTimeout(timeoutId);
      
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
   * Fetch custom date range data
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

      console.log('Fetching custom date range:', startDate, 'to', endDate);
      const response = await api.get('/enquiries/principal-stats', {
        params: {
          minLevel: selectedLevel,
          dateFilter: 'custom',
          startDate: startDate,
          endDate: endDate
        },
        signal: abortControllerRef.current.signal
      });

      clearTimeout(timeoutId);
      return response.data;

    } catch (error) {
      clearTimeout(timeoutId);
      
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
  const getFilteredData = useCallback((selectedLevel, selectedDate) => {
    if (!cache.data) return null;

    const level = parseInt(selectedLevel);
    
    if (selectedDate === 'all') {
      return cache.data.allTime?.levelData?.[level] || null;
    } else {
      return cache.data.dateRanges?.[selectedDate]?.levelData?.[level] || null;
    }
  }, [cache.data]);

  /**
   * Get level statistics (for tab counts)
   */
  const getLevelStatistics = useCallback((selectedDate) => {
    if (!cache.data) return {};

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
