import React from 'react';

const ZoneStatisticsCard = ({ 
  data, 
  title, 
  showPercentages = true, 
  allowDrillDown = false, 
  onDrillDown,
  className = '',
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  const zones = [
    { key: 'green', label: 'Green Zone', color: 'bg-green-500', description: 'High Performance (76-84%)' },
    { key: 'blue', label: 'Blue Zone', color: 'bg-blue-500', description: 'Good Performance (71-75%)' },
    { key: 'yellow', label: 'Yellow Zone', color: 'bg-yellow-500', description: 'Average Performance (66-70%)' },
    { key: 'red', label: 'Red Zone', color: 'bg-red-500', description: 'Needs Improvement (<66%)' }
  ];

  const getPercentage = (count) => {
    return data.total > 0 ? ((count / data.total) * 100).toFixed(1) : 0;
  };

  const handleCardClick = () => {
    if (allowDrillDown && onDrillDown) {
      onDrillDown(data);
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 transition-all duration-200 ${
        allowDrillDown ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''
      } ${className}`}
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {allowDrillDown && (
          <div className="text-blue-500 text-sm flex items-center">
            View Details
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {zones.map(zone => {
          const count = data[zone.key] || 0;
          const percentage = getPercentage(count);
          
          return (
            <div key={zone.key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${zone.color}`}></div>
                <div>
                  <span className="font-medium text-gray-900">{zone.label}</span>
                  {!showPercentages && (
                    <span className="text-sm text-gray-500 ml-2">({zone.description})</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="font-bold text-gray-900">{count}</span>
                {showPercentages && (
                  <span className="text-sm text-gray-500 min-w-[3rem] text-right">
                    ({percentage}%)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total Students</span>
          <span className="font-bold text-lg text-gray-900">{data.total}</span>
        </div>
      </div>

      {/* Visual progress bars */}
      <div className="mt-4 space-y-2">
        {zones.map(zone => {
          const count = data[zone.key] || 0;
          const percentage = getPercentage(count);
          
          return (
            <div key={`bar-${zone.key}`} className="flex items-center space-x-2">
              <div className="w-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${zone.color} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ZoneStatisticsCard;
