import React from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';

const ProgramBreakdownCards = ({ 
  currentView, 
  selectedGender, 
  currentData, 
  onBackClick, 
  loading 
}) => {
  // Color palette for program cards
  const programColors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-orange-500 to-orange-600',
    'from-teal-500 to-teal-600',
    'from-indigo-500 to-indigo-600',
    'from-red-500 to-red-600',
    'from-yellow-500 to-yellow-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
    'from-emerald-500 to-emerald-600',
    'from-violet-500 to-violet-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
    'from-lime-500 to-lime-600',
    'from-sky-500 to-sky-600'
  ];

  // Get the appropriate program data based on current view
  const getProgramData = () => {
    if (currentView === 'total') {
      // Combine boys and girls programs for total view
      const totalPrograms = {};
      
      if (currentData.programs?.boys) {
        Object.entries(currentData.programs.boys).forEach(([program, count]) => {
          totalPrograms[program] = (totalPrograms[program] || 0) + count;
        });
      }
      
      if (currentData.programs?.girls) {
        Object.entries(currentData.programs.girls).forEach(([program, count]) => {
          totalPrograms[program] = (totalPrograms[program] || 0) + count;
        });
      }
      
      return {
        programs: totalPrograms,
        total: currentData.total,
        title: 'All Students',
        color: 'from-blue-500 to-blue-600'
      };
    } else if (currentView === 'gender' && selectedGender === 'boys') {
      return {
        programs: currentData.programs?.boys || {},
        total: currentData.boys,
        title: 'Boys',
        color: 'from-green-500 to-green-600'
      };
    } else if (currentView === 'gender' && selectedGender === 'girls') {
      return {
        programs: currentData.programs?.girls || {},
        total: currentData.girls,
        title: 'Girls',
        color: 'from-pink-500 to-red-500'
      };
    }
    
    return { programs: {}, total: 0, title: '', color: '' };
  };

  const programData = getProgramData();
  
  // Convert to array and sort by count
  const programArray = Object.entries(programData.programs)
    .map(([program, count]) => ({
      program,
      count,
      percentage: programData.total > 0 ? ((count / programData.total) * 100).toFixed(1) : '0.0'
    }))
    .sort((a, b) => b.count - a.count);

  if (currentView === 'default' || (!currentView || currentView === 'initial')) {
    return null; // Don't render anything if no view is selected
  }

  return (
    <div className="mb-8">
      {/* Header with back button */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackClick}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Program Distribution - {programData.title}
              </h2>
              <p className="text-gray-600">
                Detailed breakdown of {programData.total.toLocaleString()} students by program
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Program Cards Grid */}
      {programArray.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {programArray.map((prog, index) => {
            // Get color for this program card (cycle through colors if more programs than colors)
            const cardColor = programColors[index % programColors.length];
            
            return (
              <div
                key={prog.program}
                className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                <div className={`bg-gradient-to-r ${cardColor} p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold opacity-90">#{index + 1} Program</p>
                      <p className="text-3xl font-bold">{prog.count.toLocaleString()}</p>
                      <p className="text-sm opacity-90 mt-1">
                        {prog.percentage}% of {programData.title.toLowerCase()}
                      </p>
                    </div>
                    <BookOpen className="w-12 h-12 opacity-80" />
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <p className="text-sm text-gray-600 text-center font-medium">
                    {prog.program}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className={`bg-gradient-to-r ${programData.color} p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold opacity-90">No Programs</p>
                  <p className="text-3xl font-bold">0</p>
                  <p className="text-sm opacity-90 mt-1">
                    No data available
                  </p>
                </div>
                <BookOpen className="w-12 h-12 opacity-80" />
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <p className="text-sm text-gray-600 text-center">
                No program information for {programData.title.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramBreakdownCards;
