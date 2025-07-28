import React from 'react';

const LoadingOverlay = () => {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-xl">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading statistics...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
