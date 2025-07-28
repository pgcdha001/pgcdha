import React from 'react';

const GenderStatistics = ({ 
  count, 
  percentage, 
  programs, 
  levelStats,
  levelTabs,
  title,
  bgColor 
}) => {
  return (
    <div className="space-y-6">
      <div className={`${bgColor} text-white p-6 rounded-xl`}>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-3xl font-extrabold">{count.toLocaleString()}</p>
        <p className="text-lg opacity-90">{percentage.toFixed(1)}% of total</p>
      </div>
      
      {/* Level Breakdown */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-3">{title} Level Breakdown</h4>
        <div className="space-y-2">
          {levelTabs.map((tab) => {
            const levelCount = levelStats[tab.value] || 0;
            const levelPercentage = count > 0 ? (levelCount / count) * 100 : 0;
            
            return (
              <div key={tab.value} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${tab.color}`}></div>
                  <span className="font-medium">{tab.label}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-800">{levelCount.toLocaleString()}</span>
                  <span className="text-gray-500 ml-2">({levelPercentage.toFixed(1)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Programs */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-3">{title} Programs</h4>
        <div className="space-y-2">
          {Object.entries(programs).map(([program, programCount]) => {
            const programPercentage = count > 0 ? (programCount / count) * 100 : 0;
            
            return (
              <div key={program} className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{program}</span>
                <div className="text-right">
                  <span className="font-bold text-gray-800">{programCount.toLocaleString()}</span>
                  <span className="text-gray-500 ml-2">({programPercentage.toFixed(1)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GenderStatistics;
