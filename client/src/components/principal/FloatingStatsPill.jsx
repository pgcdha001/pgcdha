import React from 'react';
import { BarChart3, Move } from 'lucide-react';

const FloatingStatsPill = ({ 
  position, 
  loading, 
  isDragging, 
  onShowStats, 
  onMouseDown, 
  pillRef 
}) => {
  return (
    <div
      ref={pillRef}
      className="fixed z-50"
      style={{ left: position.x, top: position.y }}
    >
      {/* Gradient border wrapper */}
      <div className={`p-1 rounded-full bg-gradient-to-r from-blue-500 to-red-500 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="bg-white rounded-full overflow-hidden flex">
          {/* Main clickable area */}
          <div
            onClick={() => {
              if (!loading) {
                onShowStats();
              }
            }}
            className={`px-8 py-4 flex items-center space-x-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-red-50 transition-all duration-200 flex-1 text-gray-800 ${loading ? 'cursor-not-allowed' : ''}`}
          >
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-lg">
              {loading ? 'Loading...' : 'Glimpse'}
            </span>
          </div>
          
          {/* Draggable handle area */}
          <div
            className={`px-4 py-4 border-l border-gray-200 cursor-grab hover:bg-gradient-to-r hover:from-blue-50 hover:to-red-50 transition-all duration-200 ${isDragging ? 'cursor-grabbing bg-gradient-to-r from-blue-50 to-red-50' : ''} ${loading ? 'cursor-not-allowed' : ''}`}
            onMouseDown={loading ? undefined : onMouseDown}
            title={loading ? 'Loading data...' : 'Drag to move'}
          >
            <Move className="w-5 h-5 text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingStatsPill;
