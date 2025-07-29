import React from 'react';
import { BarChart3, PieChart, TrendingUp, Calendar, ArrowLeft } from 'lucide-react';

/**
 * Correspondence breakdown cards component
 * Displays detailed breakdowns by level, type, gender, and time
 * Following enquiry management pattern with back button
 */
const CorrespondenceBreakdownCards = ({ currentData, currentView, onBackClick, loading }) => {
  // Use loading prop name consistent with enquiry pattern
  const isLoading = loading;
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 bg-gray-300 rounded"></div>
                <div className="ml-3 h-4 bg-gray-300 rounded w-1/3"></div>
              </div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/6"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!currentData || !currentData.breakdown) return null;

  const { breakdown } = currentData;

  // Level breakdown
  const levelData = Object.entries(breakdown.byLevel)
    .map(([level, count]) => ({ level, count }))
    .sort((a, b) => b.count - a.count);

  // Type breakdown
  const typeData = Object.entries(breakdown.byType)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Gender breakdown
  const genderData = Object.entries(breakdown.byGender)
    .map(([gender, count]) => ({ gender, count }))
    .sort((a, b) => b.count - a.count);

  // Monthly breakdown (last 6 months)
  const monthlyData = Object.entries(breakdown.byMonth)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => new Date(a.month) - new Date(b.month))
    .slice(-6);

  const renderProgressBar = (count, total, color = 'blue') => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      teal: 'bg-teal-500',
      red: 'bg-red-500'
    };

    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color] || colorClasses.blue}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const totalCorrespondence = currentData.stats?.total || 0;

  // Get view title based on current view
  const getViewTitle = () => {
    switch (currentView) {
      case 'total': return 'Total Correspondence Details';
      case 'students': return 'Students with Correspondence';
      case 'levelChanges': return 'Level Change Communications';
      case 'general': return 'General Correspondence';
      case 'recent': return 'Recent Communications (Last 7 Days)';
      case 'staff': return 'Active Staff Communications';
      default: return 'Correspondence Details';
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackClick}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Overview
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{getViewTitle()}</h2>
        </div>
      </div>

      {/* Breakdown Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Level Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 ml-3">By Level</h3>
        </div>
        <div className="space-y-4">
          {levelData.length > 0 ? levelData.map(({ level, count }) => (
            <div key={level} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Level {level}</span>
                <span className="text-sm text-gray-600">
                  {count} ({totalCorrespondence > 0 ? Math.round((count / totalCorrespondence) * 100) : 0}%)
                </span>
              </div>
              {renderProgressBar(count, totalCorrespondence, 'blue')}
            </div>
          )) : (
            <p className="text-sm text-gray-500">No data available</p>
          )}
        </div>
      </div>

      {/* Type Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <PieChart className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900 ml-3">By Type</h3>
        </div>
        <div className="space-y-4">
          {typeData.length > 0 ? typeData.map(({ type, count }, index) => {
            const colors = ['green', 'purple', 'orange', 'teal'];
            const color = colors[index % colors.length];
            return (
              <div key={type} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-sm text-gray-600">
                    {count} ({totalCorrespondence > 0 ? Math.round((count / totalCorrespondence) * 100) : 0}%)
                  </span>
                </div>
                {renderProgressBar(count, totalCorrespondence, color)}
              </div>
            );
          }) : (
            <p className="text-sm text-gray-500">No data available</p>
          )}
        </div>
      </div>

      {/* Gender Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 ml-3">By Gender</h3>
        </div>
        <div className="space-y-4">
          {genderData.length > 0 ? genderData.map(({ gender, count }, index) => {
            const colors = ['purple', 'teal', 'orange'];
            const color = colors[index % colors.length];
            return (
              <div key={gender} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 capitalize">{gender}</span>
                  <span className="text-sm text-gray-600">
                    {count} ({totalCorrespondence > 0 ? Math.round((count / totalCorrespondence) * 100) : 0}%)
                  </span>
                </div>
                {renderProgressBar(count, totalCorrespondence, color)}
              </div>
            );
          }) : (
            <p className="text-sm text-gray-500">No data available</p>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Calendar className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900 ml-3">Monthly Trend</h3>
        </div>
        <div className="space-y-4">
          {monthlyData.length > 0 ? monthlyData.map(({ month, count }) => {
            const monthName = new Date(month).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short' 
            });
            const maxCount = Math.max(...monthlyData.map(d => d.count));
            return (
              <div key={month} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{monthName}</span>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
                {renderProgressBar(count, maxCount, 'orange')}
              </div>
            );
          }) : (
            <p className="text-sm text-gray-500">No data available</p>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default CorrespondenceBreakdownCards;
