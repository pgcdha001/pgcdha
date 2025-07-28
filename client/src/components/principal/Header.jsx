import React from 'react';
import { RefreshCw } from 'lucide-react';

const Header = ({ 
  error, 
  isRefreshing, 
  isInitialLoading, 
  onRefresh, 
  lastUpdated 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Principal Enquiry Management
            </h1>
            <p className="text-gray-600">
              Monitor and analyze student enquiry data across all levels and time periods
            </p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-2">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Refresh button */}
            <button
              onClick={onRefresh}
              disabled={isInitialLoading || isRefreshing}
              className={`flex items-center space-x-2 px-4 py-2 ${error ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed`}
              title={error ? `Error: ${error}. Click to retry.` : "Refresh data from server"}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>
                {isRefreshing ? 'Refreshing...' : error ? 'Retry' : 'Refresh'}
              </span>
              {error && !isRefreshing && (
                <span className="text-xs opacity-75">⚠️</span>
              )}
            </button>
            
            <div className="text-right">
              <p className="text-sm text-gray-500">Welcome</p>
              <p className="font-semibold text-gray-900">
                Syed Awais Bukhari
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
