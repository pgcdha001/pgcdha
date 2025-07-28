import React from 'react';
import { RefreshCw } from 'lucide-react';

const ErrorDisplay = ({ error, isRefreshing, onRetry }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Failed to Load Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onRetry}
            disabled={isRefreshing}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Retrying...' : 'Try Again'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
