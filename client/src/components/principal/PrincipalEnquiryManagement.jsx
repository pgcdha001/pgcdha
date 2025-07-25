import React, { useState, useEffect } from 'react';
import { ChevronDown, Users, UserCheck, GraduationCap, Calendar, Filter } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import api from '../../services/api';

/**
 * Principal Enquiry Management Component
 * Shows hierarchical family tree view of enquiries with level and date filtering
 */
const PrincipalEnquiryManagement = () => {
  const { user } = useAuth();
  const { userRole } = usePermissions();
  
  // State management
  const [selectedLevel, setSelectedLevel] = useState('1');
  const [selectedDate, setSelectedDate] = useState('all');
  const [currentView, setCurrentView] = useState('total');
  const [selectedGender, setSelectedGender] = useState(null);
  const [loading, setLoading] = useState(false);

  // Data states
  const [enquiryData, setEnquiryData] = useState({
    total: 0,
    boys: 0,
    girls: 0,
    programs: { boys: {}, girls: {} }
  });

  // Level tabs configuration (removed "All Levels" as requested)
  const levelTabs = [
    { value: '1', label: 'Level 1+', color: 'bg-green-500', count: 0 },
    { value: '2', label: 'Level 2+', color: 'bg-yellow-500', count: 0 },
    { value: '3', label: 'Level 3+', color: 'bg-orange-500', count: 0 },
    { value: '4', label: 'Level 4+', color: 'bg-red-500', count: 0 },
    { value: '5', label: 'Level 5+', color: 'bg-purple-500', count: 0 }
  ];
  
  const [levelStats, setLevelStats] = useState({});
  const [levelProgression, setLevelProgression] = useState({});
  const [genderLevelProgression, setGenderLevelProgression] = useState({
    boys: {},
    girls: {}
  });

  // Date filter options
  const dateFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Load data when level or date changes
  useEffect(() => {
    loadLevelStatistics();
    loadEnquiryData();
  }, [selectedLevel, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadLevelStatistics = async () => {
    try {
      const response = await api.get('/enquiries/principal-overview');
      if (response.data && response.data.success) {
        setLevelStats(response.data.data.levelBreakdown);
        if (response.data.data.levelProgression) {
          setLevelProgression(response.data.data.levelProgression);
        }
      }
    } catch (error) {
      console.error('Error loading level statistics:', error);
    }
  };

  const loadEnquiryData = async () => {
    try {
      setLoading(true);
      
      console.log('Loading data with filters:', { selectedLevel, selectedDate });
      
      // Prepare query parameters
      const params = {
        minLevel: selectedLevel,
        dateFilter: selectedDate
      };
      
      // Add custom date parameters if needed
      if (selectedDate === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      
      // Fetch data from API
      const response = await api.get('/enquiries/principal-stats', { params });
      
      if (response.data && response.data.success) {
        const { data } = response.data;
        
        // Update state with real data
        setEnquiryData(data);
        
        // Update level progression if available
        if (data.levelProgression) {
          setLevelProgression(data.levelProgression);
        }
        
        // Update gender level progression if available
        if (data.genderLevelProgression) {
          setGenderLevelProgression(data.genderLevelProgression);
        }
        
        // Calculate percentages
        const calculatedPercentages = calculatePercentages(data);
        setPercentages(calculatedPercentages);
      } else {
        console.error('API returned error:', response.data?.message || 'Unknown error');
        throw new Error(response.data?.message || 'Failed to load data');
      }
    } catch (error) {
      console.error('Error loading enquiry data:', error);
      // Show error but don't reset data
    } finally {
      setLoading(false);
    }
  };

  // State for custom date filter
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // State for percentage calculations
  const [percentages, setPercentages] = useState({
    boys: { value: 0, text: '0%' },
    girls: { value: 0, text: '0%' },
    programs: {
      boys: {},
      girls: {}
    }
  });

  const calculatePercentages = (data) => {
    const total = data.boys + data.girls;
    const boysPercentage = total > 0 ? (data.boys / total) * 100 : 0;
    const girlsPercentage = total > 0 ? (data.girls / total) * 100 : 0;
    
    // Calculate program percentages for boys
    const boysProgramPercentages = {};
    if (data.boys > 0) {
      Object.entries(data.programs.boys).forEach(([program, count]) => {
        boysProgramPercentages[program] = {
          value: (count / data.boys) * 100,
          text: `${Math.round((count / data.boys) * 100)}%`
        };
      });
    }
    
    // Calculate program percentages for girls
    const girlsProgramPercentages = {};
    if (data.girls > 0) {
      Object.entries(data.programs.girls).forEach(([program, count]) => {
        girlsProgramPercentages[program] = {
          value: (count / data.girls) * 100,
          text: `${Math.round((count / data.girls) * 100)}%`
        };
      });
    }
    
    return {
      boys: { 
        value: boysPercentage, 
        text: `${Math.round(boysPercentage)}%` 
      },
      girls: { 
        value: girlsPercentage, 
        text: `${Math.round(girlsPercentage)}%` 
      },
      programs: {
        boys: boysProgramPercentages,
        girls: girlsProgramPercentages
      }
    };
  };

  const handleCardClick = (view, gender = null) => {
    if (view === 'total') {
      setCurrentView('total');
      setSelectedGender(null);
    } else if (view === 'gender') {
      setCurrentView('gender');
      setSelectedGender(null);
    } else if (view === 'programs') {
      setCurrentView('programs');
      setSelectedGender(gender);
    } else if (view === 'boys' || view === 'girls') {
      setCurrentView('programs');
      setSelectedGender(view === 'boys' ? 'Boys' : 'Girls');
    }
  };

  const handleBackClick = () => {
    if (currentView === 'programs') {
      setCurrentView('gender');
      setSelectedGender(null);
    } else if (currentView === 'gender') {
      setCurrentView('total');
    }
  };

  const EnquiryCard = ({ title, count, icon: IconComponent, color, onClick, subtitle = null, levelData = null }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      pink: 'from-pink-500 to-pink-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      cyan: 'from-cyan-500 to-cyan-600'
    };

    // Format the count based on whether we have level progression data
    const formattedCount = levelData ? 
      `${levelData.current}/${levelData.previous}` : 
      count;
    
    // Calculate percentage for level progression (should be current/previous * 100)
    const progressPercentage = levelData && levelData.previous > 0 ? 
      Math.round((levelData.current / levelData.previous) * 100) : 
      null;
    
    // Format students who didn't progress
    const notProgressedText = levelData && levelData.notProgressed > 0 ? 
      `${levelData.notProgressed} did not progress` : 
      null;

    return (
      <div 
        onClick={onClick}
        className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${onClick ? 'hover:border-blue-300' : ''}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color]}`}>
            {IconComponent && <IconComponent className="w-8 h-8 text-white" />}
          </div>
          {onClick && <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-3xl font-bold text-gray-800 mb-2">{loading ? '...' : formattedCount}</p>
          {progressPercentage !== null && (
            <div className="mb-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full bg-gradient-to-r ${colorClasses[color]}`} 
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{progressPercentage}% progression</p>
              {notProgressedText && (
                <p className="text-xs text-red-500 mt-1">{notProgressedText}</p>
              )}
            </div>
          )}
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
    );
  };

  if (userRole !== 'Principal') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
          <p className="text-gray-500">This page is only accessible to Principal users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-[Sora,Inter,sans-serif]">
                Enquiry Management
              </h1>
              <p className="text-gray-600 mt-1">
                Hierarchical view of student enquiries by level and demographics
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Welcome,</p>
              <p className="font-semibold text-gray-900">
                {user?.fullName?.firstName} {user?.fullName?.lastName}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-700">Filters:</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {dateFilters.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date Range */}
            {selectedDate === 'custom' && (
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={loadEnquiryData}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Level Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <span className="font-medium text-gray-700">Level Filter:</span>
          </div>
          <div className="flex flex-wrap gap-6">
            {levelTabs.map(tab => {
              const count = levelStats[tab.value] || 0;
              const isActive = selectedLevel === tab.value;
              
              return (
                <button
                  key={tab.value}
                  onClick={() => setSelectedLevel(tab.value)}
                  className={`flex items-center space-x-2 px-8 py-4 rounded-2xl transition-all duration-200 text-xl font-bold ${
                    isActive 
                      ? `${tab.color} text-white shadow-lg transform scale-125` 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="font-bold text-xl">{tab.label}</span>
                  <span className={`px-4 py-2 rounded-full text-xl font-extrabold ${
                    isActive ? 'bg-white text-primary shadow' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-8">
          {/* Total Enquiries Level */}
          {currentView === 'total' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Total Enquiries</h2>
                <p className="text-gray-600">Overall statistics for selected level and date range</p>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <EnquiryCard
                  title={`Level ${selectedLevel}+ Enquiries`}
                  count={enquiryData.total}
                  icon={Users}
                  color="blue"
                  onClick={() => handleCardClick('gender')}
                  subtitle={`Students at level ${selectedLevel} and above`}
                  levelData={levelProgression[selectedLevel] ? 
                    levelProgression[selectedLevel] : 
                    (levelProgression[1] ? levelProgression[1] : null)}
                />
              </div>
            </div>
          )}

          {/* Gender Breakdown Level */}
          {currentView === 'gender' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <EnquiryCard
                title={`Boys (Level ${selectedLevel}+)`}
                count={`${enquiryData.boys} (${percentages.boys.text})`}
                icon={UserCheck}
                color="green"
                onClick={() => handleCardClick('programs', 'Boys')}
                subtitle={`${enquiryData.boys} male students at level ${selectedLevel}`}
                levelData={genderLevelProgression.boys[selectedLevel] ? 
                  genderLevelProgression.boys[selectedLevel] : 
                  (genderLevelProgression.boys[1] ? genderLevelProgression.boys[1] : null)}
              />
              <EnquiryCard
                title={`Girls (Level ${selectedLevel}+)`}
                count={`${enquiryData.girls} (${percentages.girls.text})`}
                icon={GraduationCap}
                color="pink"
                onClick={() => handleCardClick('programs', 'Girls')}
                subtitle={`${enquiryData.girls} female students at level ${selectedLevel}`}
                levelData={genderLevelProgression.girls[selectedLevel] ? 
                  genderLevelProgression.girls[selectedLevel] : 
                  (genderLevelProgression.girls[1] ? genderLevelProgression.girls[1] : null)}
              />
            </div>
          )}

          {/* Programs Breakdown Level */}
          {currentView === 'programs' && selectedGender && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">{selectedGender} Programs</h2>
                <p className="text-gray-600">Program-wise breakdown for {selectedGender.toLowerCase()}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {Object.entries(enquiryData.programs[selectedGender.toLowerCase()] || {}).length > 0 ? (
                  Object.entries(enquiryData.programs[selectedGender.toLowerCase()] || {}).map(([program, count], index) => (
                    <EnquiryCard
                      key={program}
                      title={program}
                      count={count}
                      icon={GraduationCap}
                      color={['purple', 'orange', 'cyan'][index % 3]}
                      subtitle={`${percentages.programs[selectedGender.toLowerCase()][program]?.text || '0%'} of ${selectedGender.toLowerCase()}`}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500 text-lg">No program data available for {selectedGender.toLowerCase()} at Level {selectedLevel}+</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting the date filter or level selection</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Back Navigation */}
          {(currentView === 'gender' || currentView === 'programs') && (
            <div className="text-center">
              <button
                onClick={handleBackClick}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrincipalEnquiryManagement;
