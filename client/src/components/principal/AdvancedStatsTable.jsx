import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const AdvancedStatsTable = ({ data, loading }) => {
  const [monthlyData, setMonthlyData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

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
                  <tr key={month.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
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
    </div>
  );
};

export default AdvancedStatsTable;
