import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';

const CustomDateRange = ({ 
  customStartDate,
  customEndDate,
  customDatesApplied,
  isCustomDateLoading,
  onStartDateChange,
  onEndDateChange,
  onApplyFilters,
  loading 
}) => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
      <h3 className="text-lg font-semibold text-blue-800 mb-4">Custom Date Range</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center space-x-2">
          {customDatesApplied ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 font-medium">
                Custom range applied
              </span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                Set dates and apply to filter
              </span>
            </>
          )}
        </div>
        
        {/* Apply Filter Button for Custom Range */}
        <button
          onClick={onApplyFilters}
          disabled={loading || isCustomDateLoading || !customStartDate || !customEndDate}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isCustomDateLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Applying...</span>
            </>
          ) : (
            <span>Apply Custom Date Range</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default CustomDateRange;
