import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, TrendingUp, RefreshCw, Clock } from 'lucide-react';
import api from '../../services/api';

const TodaysStats = () => {
  const [todaysData, setTodaysData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Get current date information - ensuring we use local time zone
  const getCurrentDateInfo = () => {
    const now = new Date();
    // Ensure we're getting the local date, not UTC
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return {
      day: localDate.getDate(),
      month: monthNames[localDate.getMonth()],
      year: localDate.getFullYear(),
      dateString: localDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    };
  };

  // Fetch today's data from the daily-stats API
  const fetchTodaysData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const dateInfo = getCurrentDateInfo();
      console.log('Fetching today\'s data for:', dateInfo);
      
      const response = await api.get(`/enquiries/daily-stats?month=${dateInfo.month}&year=${dateInfo.year}`);
      console.log('Today\'s data API response:', response.data);
      
      if (response.data.success) {
        const dailyData = response.data.data.dailyData;
        const todayData = dailyData[dateInfo.day] || {
          level1: 0,
          level2: 0,
          level3: 0,
          level4: 0,
          level5: 0
        };
        
        console.log(`Today's specific data for day ${dateInfo.day}:`, todayData);
        console.log('Level History System: Showing level changes that happened today, not just student creations');
        setTodaysData(todayData);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch today\'s data:', response.data);
        setTodaysData({
          level1: 0,
          level2: 0,
          level3: 0,
          level4: 0,
          level5: 0
        });
      }
    } catch (err) {
      console.error('Error fetching today\'s data:', err);
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setError(err.response?.data?.message || 'Failed to load today\'s statistics');
        setTodaysData({
          level1: 0,
          level2: 0,
          level3: 0,
          level4: 0,
          level5: 0
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array since getCurrentDateInfo is called inside

  // Fetch data on component mount
  useEffect(() => {
    fetchTodaysData();
  }, [fetchTodaysData]);

  const dateInfo = useMemo(() => getCurrentDateInfo(), []);

  const levelConfig = {
    level1: { 
      label: 'Level 1+', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    level2: { 
      label: 'Level 2+', 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    level3: { 
      label: 'Level 3+', 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    level4: { 
      label: 'Level 4+', 
      color: 'text-red-600', 
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    level5: { 
      label: 'Level 5+', 
      color: 'text-purple-600', 
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  };

  // Calculate total for today
  const todayTotal = Object.values(todaysData).reduce((sum, val) => sum + (val || 0), 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading today's statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-5 h-5" />
              <h2 className="text-xl font-bold">Today's Enquiry Statistics</h2>
            </div>
            <p className="text-blue-100 text-sm">{dateInfo.dateString}</p>
            {lastUpdated && (
              <p className="text-blue-200 text-xs mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold">{todayTotal.toLocaleString()}</div>
            <div className="text-blue-100 text-sm">Total Today</div>
            <button
              onClick={fetchTodaysData}
              disabled={isLoading}
              className="mt-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 inline mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-5 gap-4">
          {Object.entries(levelConfig).map(([level, config]) => {
            const count = todaysData[level] || 0;
            const percentage = todayTotal > 0 ? ((count / todayTotal) * 100).toFixed(1) : 0;
            
            return (
              <div 
                key={level} 
                className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 text-center transition-all duration-200 hover:shadow-md`}
              >
                <div className={`text-2xl font-bold ${config.color} mb-1`}>
                  {count.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 font-medium mb-1">
                  {config.label}
                </div>
                <div className="text-xs text-gray-500">
                  {percentage}% of today
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Live data for Day {dateInfo.day} of {dateInfo.month} {dateInfo.year}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <TrendingUp className="w-4 h-4" />
              <span>Real-time enquiry tracking</span>
              {todayTotal === 0 && (
                <span className="text-xs text-yellow-600 ml-2">
                  (No enquiries recorded today yet)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodaysStats;
