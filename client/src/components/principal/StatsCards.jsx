import React from 'react';
import { Users, UserCheck, GraduationCap } from 'lucide-react';

const StatsCards = ({ 
  currentData, 
  percentages, 
  currentView, 
  selectedGender, 
  onCardClick, 
  loading 
}) => {
  const cards = [
    {
      title: 'Total Students',
      value: currentData.total,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      view: 'total',
      isActive: currentView === 'total'
    },
    {
      title: 'Boys',
      value: currentData.boys,
      percentage: percentages.boysPercentage,
      icon: UserCheck,
      color: 'from-green-500 to-green-600',
      view: 'gender',
      gender: 'boys',
      isActive: currentView === 'gender' && selectedGender === 'boys'
    },
    {
      title: 'Girls',
      value: currentData.girls,
      percentage: percentages.girlsPercentage,
      icon: GraduationCap,
      color: 'from-pink-500 to-red-500',
      view: 'gender',
      gender: 'girls',
      isActive: currentView === 'gender' && selectedGender === 'girls'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-6 mb-8">
      {cards.map((card) => {
        const IconComponent = card.icon;
        
        return (
          <div
            key={card.title}
            onClick={() => !loading && onCardClick(card.view, card.gender)}
            className={`
              bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl
              ${card.isActive ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className={`bg-gradient-to-r ${card.color} p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold opacity-90">{card.title}</p>
                  <p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
                  {card.percentage !== undefined && (
                    <p className="text-sm opacity-90 mt-1">
                      {card.percentage.toFixed(1)}% of total
                    </p>
                  )}
                </div>
                <IconComponent className="w-12 h-12 opacity-80" />
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <p className="text-sm text-gray-600 text-center">
                Click to {card.isActive ? 'view program breakdown' : 'view program distribution'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
