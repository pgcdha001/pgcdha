import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const AdvancedStatsTable = ({ data, loading }) => {
  const [monthlyData, setMonthlyData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Daily breakdown modal state
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [dailyData, setDailyData] = useState({});
  const [loadingDaily, setLoadingDaily] = useState(false);

  // Fetch daily data for a specific month
  const fetchDailyData = async (month, year) => {
    try {
      setLoadingDaily(true);
      
      const response = await api.get(`/enquiries/daily-stats?month=${month}&year=${year}`);
      
      if (response.data.success) {
        setDailyData(response.data.data.dailyData);
      } else {
        console.error('Failed to fetch daily data');
        setDailyData({});
      }
    } catch (err) {
      console.error('Error fetching daily data:', err);
      setDailyData({});
    } finally {
      setLoadingDaily(false);
    }
  };

  // Handle month row click
  const handleMonthClick = (month) => {
    setSelectedMonth(month);
    setShowDailyModal(true);
    fetchDailyData(month.name, month.year);
  };

  // Fetch monthly data from API
  const fetchMonthlyData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/enquiries/monthly-stats');
      
      if (response.data.success) {
        console.log('Monthly data received:', response.data.data);
        setMonthlyData(response.data.data.monthlyData);
        setLastUpdated(new Date());
      } else {
        setError('Failed to fetch monthly data');
      }
    } catch (err) {
      // Don't set error state for canceled requests
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        console.error('Error fetching monthly data:', err);
        setError(err.response?.data?.message || 'Failed to load monthly statistics');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchMonthlyData();
  }, []);

  // Generate months from start of year to current month
  const months = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-based index
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthsData = [];
    for (let i = 0; i <= currentMonth; i++) {
      monthsData.push({
        name: monthNames[i],
        short: monthNames[i].substring(0, 3),
        index: i,
        year: currentYear
      });
    }
    
    return monthsData;
  }, []);

  // Calculate totals for each level
  const levelTotals = useMemo(() => {
    const totals = { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 };
    
    console.log('monthlyData for totals calculation:', monthlyData);
    
    Object.values(monthlyData).forEach(monthData => {
      console.log('Processing month data:', monthData);
      totals.level1 += monthData.level1 || 0;
      totals.level2 += monthData.level2 || 0;
      totals.level3 += monthData.level3 || 0;
      totals.level4 += monthData.level4 || 0;
      totals.level5 += monthData.level5 || 0;
    });
    
    console.log('Final totals:', totals);
    return totals;
  }, [monthlyData]);

  const levelColors = {
    level1: 'text-green-600',
    level2: 'text-yellow-600',
    level3: 'text-orange-600',
    level4: 'text-red-600',
    level5: 'text-purple-600'
  };

  const levelBgColors = {
    level1: 'bg-green-50',
    level2: 'bg-yellow-50',
    level3: 'bg-orange-50',
    level4: 'bg-red-50',
    level5: 'bg-purple-50'
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading monthly statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchMonthlyData}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-r border-gray-200 bg-gray-100 sticky left-0 z-10">
                  Month
                </th>
                {Object.entries(levelColors).map(([level, colorClass]) => (
                  <th key={level} className={`px-3 py-2 text-center text-xs font-bold uppercase tracking-wider ${levelBgColors[level]} ${colorClass}`}>
                    {level.replace('level', 'Level ')}
                  </th>
                ))}
                <th className="px-3 py-2 text-center text-xs font-bold text-gray-900 uppercase tracking-wider bg-gray-100">
                  Monthly Total
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {months.map((month, index) => {
                const monthData = monthlyData[month.name] || {};
                const monthTotal = Object.values(monthData).reduce((sum, val) => sum + val, 0);
                
                return (
                  <tr 
                    key={month.name} 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer transition-colors duration-200`}
                    onClick={() => handleMonthClick(month)}
                    title="Click to view daily breakdown"
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-gray-900 border-r border-gray-200 bg-gray-50 sticky left-0 z-10">
                      <div className="flex items-center space-x-2">
                        <span>{month.name}</span>
                        <span className="text-xs text-gray-500">'{month.year.toString().slice(-2)}</span>
                      </div>
                    </td>
                    {Object.entries(levelColors).map(([level, colorClass]) => (
                      <td key={level} className={`px-3 py-2 whitespace-nowrap text-center text-sm font-medium ${colorClass}`}>
                        {monthData[level]?.toLocaleString() || '0'}
                      </td>
                    ))}
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm font-bold text-gray-900 bg-gray-50">
                      {monthTotal.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              
              {/* Totals Row */}
              <tr className="bg-gray-100 border-t-2 border-gray-300">
                <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-gray-900 border-r border-gray-200 sticky left-0 z-10">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>TOTAL</span>
                  </div>
                </td>
                {Object.entries(levelColors).map(([level, colorClass]) => (
                  <td key={level} className={`px-3 py-2 whitespace-nowrap text-center text-sm font-bold ${colorClass}`}>
                    {levelTotals[level].toLocaleString()}
                  </td>
                ))}
                <td className="px-3 py-2 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                  {Object.values(levelTotals).reduce((sum, val) => sum + val, 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Breakdown Modal */}
      {showDailyModal && selectedMonth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Daily Breakdown - {selectedMonth.name} {selectedMonth.year}
              </h3>
              <button
                onClick={() => setShowDailyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingDaily ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading daily statistics...</p>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Monthly Summary */}
                  <div className="grid grid-cols-5 gap-4 mb-6">
                    {Object.entries(levelColors).map(([level, colorClass]) => {
                      const monthData = monthlyData[selectedMonth.name] || {};
                      const count = monthData[level] || 0;
                      return (
                        <div key={level} className={`${levelBgColors[level]} p-4 rounded-lg text-center`}>
                          <div className={`text-2xl font-bold ${colorClass}`}>
                            {count.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 font-medium">
                            {level.replace('level', 'Level ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Daily Breakdown Table */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                              Day
                            </th>
                            {Object.entries(levelColors).map(([level, colorClass]) => (
                              <th key={level} className={`px-3 py-3 text-center text-xs font-bold uppercase tracking-wider ${levelBgColors[level]} ${colorClass}`}>
                                {level.replace('level', 'L')}
                              </th>
                            ))}
                            <th className="px-3 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">
                              Daily Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.from({ length: 31 }, (_, i) => {
                            const day = i + 1;
                            const dayData = dailyData[day] || {};
                            const dayTotal = Object.values(dayData).reduce((sum, val) => sum + (val || 0), 0);
                            
                            // Skip days with no data
                            if (dayTotal === 0) return null;
                            
                            return (
                              <tr key={day} className={day % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                                  Day {day}
                                </td>
                                {Object.entries(levelColors).map(([level, colorClass]) => (
                                  <td key={level} className={`px-3 py-3 whitespace-nowrap text-center text-sm font-medium ${colorClass}`}>
                                    {dayData[level]?.toLocaleString() || '0'}
                                  </td>
                                ))}
                                <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                                  {dayTotal.toLocaleString()}
                                </td>
                              </tr>
                            );
                          }).filter(Boolean)}
                        </tbody>
                      </table>
                    </div>
                    
                    {Object.keys(dailyData).length === 0 && !loadingDaily && (
                      <div className="p-8 text-center text-gray-500">
                        No daily data available for {selectedMonth.name} {selectedMonth.year}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedStatsTable;
