import React from 'react';

const LevelTabs = ({ 
  levelTabs, 
  selectedLevel, 
  onLevelChange, 
  levelStats, 
  loading 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Student Level Filter</h2>
        <div className="grid grid-cols-5 gap-4">
          {levelTabs.map((tab) => {
            const count = levelStats[tab.value] || 0;
            const isSelected = selectedLevel === tab.value;
            
            return (
              <button
                key={tab.value}
                onClick={() => onLevelChange(tab.value)}
                disabled={loading}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200 
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className={`w-4 h-4 rounded-full ${tab.color} mb-2 mx-auto`}></div>
                <div className="text-center">
                  <p className={`font-semibold text-sm ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                    {tab.label}
                  </p>
                  <p className={`text-lg font-bold ${isSelected ? 'text-blue-800' : 'text-gray-800'}`}>
                    {count.toLocaleString()}
                  </p>
                </div>
                {isSelected && (
                  <div className="absolute inset-0 ring-2 ring-blue-500 ring-opacity-50 rounded-lg pointer-events-none"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LevelTabs;
