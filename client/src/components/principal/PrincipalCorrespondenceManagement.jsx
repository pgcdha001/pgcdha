import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronRight, Users, MessageSquare, UserCheck, ArrowUpDown } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import useCorrespondenceData from '../../hooks/useCorrespondenceData';

// Import existing components
import ErrorDisplay from './ErrorDisplay';
import Header from './Header';
import FloatingStatsPill from './FloatingStatsPill';
import StatsModal from './StatsModal';

// Import UI components
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

/**
 * Enhanced Principal Correspondence Management Component
 * 
 * UI STRUCTURE: Following PrincipalEnquiryManagement pattern:
 * - Header component for title and refresh functionality
 * - Tab-based navigation for different views (Total, Unique, Level Changes, General)
 * - Hierarchical navigation: Level > Campus > Program structure
 * - FloatingStatsPill and StatsModal for additional statistics
 * 
 * DATA INTEGRATION:
 * - Uses real correspondence data from the database via useCorrespondenceData hook
 * - Data comes from /correspondence API endpoint which returns:
 *   * Individual correspondence records
 *   * Level change entries from student remarks
 *   * Unique student counts and statistics
 * - The component processes this real data to provide:
 *   * Total Communications by level/gender
 *   * Unique Students counts
 *   * Level Change tracking
 *   * General Communications breakdown
 * 
 * KNOWN ISSUES:
 * - Some students may have missing gender data, causing discrepancies in boys/girls counts
 * - Program-level data distribution is simulated since student.program field is not available
 * 
 * NOTE: Program-level data distribution is currently simulated since student.program
 * field is not yet available in the database. Once student programs are added to
 * the User model, the getProgramData and getProgramDetails functions should be
 * updated to filter by actual student.program values.
 */
const PrincipalCorrespondenceManagementNew = () => {
  const { userRole } = usePermissions();

  // Use the correspondence data hook
  const {
    fetchComprehensiveData,
    fetchCustomDateRange,
    refreshData,
    isInitialLoading,
    isRefreshing,
    isCustomDateLoading,
    error,
    lastUpdated
  } = useCorrespondenceData();

  // Main tab states
  const [activeTab, setActiveTab] = useState('total');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  
  // Store the real data from the API
  const [realCorrespondenceData, setRealCorrespondenceData] = useState(null);
  
  // Date filtering
  const [selectedDate, setSelectedDate] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const customDatesApplied = false;
  
  // Modal and UI states
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [pillPosition, setPillPosition] = useState({ 
    x: window.innerWidth * 0.1,
    y: window.innerHeight * 0.9 - 100
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const pillRef = useRef(null);

  // Level configurations
  const levelTabs = [
    { value: '1', label: 'Level 1', color: 'bg-green-500', description: 'First level students' },
    { value: '2', label: 'Level 2', color: 'bg-yellow-500', description: 'Second level students' },
    { value: '3', label: 'Level 3', color: 'bg-orange-500', description: 'Third level students' },
    { value: '4', label: 'Level 4', color: 'bg-red-500', description: 'Fourth level students' },
    { value: '5', label: 'Level 5', color: 'bg-purple-500', description: 'Fifth level students' }
  ];

  // Campus options
  const campusOptions = [
    { value: 'boys', label: 'Boys Campus', icon: '👨‍🎓', color: 'bg-blue-500' },
    { value: 'girls', label: 'Girls Campus', icon: '👩‍🎓', color: 'bg-pink-500' }
  ];

  // Program options (moved outside to avoid re-creation)
  const programOptions = useMemo(() => [
    { value: 'ICS-PHY', label: 'ICS-PHY', description: 'Computer Science with Physics' },
    { value: 'ICS-STAT', label: 'ICS-STAT', description: 'Computer Science with Statistics' },
    { value: 'ICOM', label: 'ICOM', description: 'Commerce' },
    { value: 'Pre Engineering', label: 'Pre Engineering', description: 'Engineering Preparation' },
    { value: 'Pre Medical', label: 'Pre Medical', description: 'Medical Preparation' },
    { value: 'F.A', label: 'F.A', description: 'Faculty of Arts' },
    { value: 'FA IT', label: 'FA IT', description: 'Faculty of Arts - IT' },
    { value: 'General Science', label: 'General Science', description: 'General Science' }
  ], []);

  // Date filter options
  const dateFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Use stats directly from backend instead of recalculating
  const processRealData = useCallback((apiData) => {
    if (!apiData || !apiData.stats) {
      return {
        totalCommunications: { total: 0, breakdown: {} },
        uniqueStudents: { total: 0, breakdown: {} },
        levelChanges: { total: 0, breakdown: {} },
        generalCommunications: { total: 0, breakdown: {} }
      };
    }

    const { stats } = apiData;
    const backendStats = stats.backendStats || {};
    
    console.log('Using backend-calculated stats:', {
      totalCommunications: backendStats.totalCommunications?.total || 0,
      uniqueStudents: backendStats.uniqueStudents?.total || 0,
      levelChanges: backendStats.levelChanges?.total || 0,
      generalCommunications: backendStats.generalCommunications?.total || 0,
      validation: backendStats.validation
    });

    // Validate the backend calculations
    if (backendStats.validation) {
      if (backendStats.validation.levelChangesVsUniqueStudents !== 'OK') {
        console.error('❌ BACKEND ERROR: Level changes issue!', backendStats.validation);
      }
      if (!backendStats.validation.totalEntriesMatch) {
        console.error('❌ BACKEND ERROR: Total entries do not match!', backendStats.validation);
      }
    }

    // Return the backend-calculated stats directly
    return {
      totalCommunications: backendStats.totalCommunications || { total: 0, breakdown: {} },
      uniqueStudents: backendStats.uniqueStudents || { total: 0, breakdown: {} },
      levelChanges: backendStats.levelChanges || { total: 0, breakdown: {} },
      generalCommunications: backendStats.generalCommunications || { total: 0, breakdown: {} }
    };
  }, []);

  // Get current data from the hook
  const getCurrentData = useCallback(() => {
    // If we have real data, process it
    if (realCorrespondenceData) {
      return processRealData(realCorrespondenceData);
    }
    
    // Otherwise return empty structure
    return {
      totalCommunications: {
        total: 0,
        breakdown: {
          '1': { total: 0, boys: 0, girls: 0 },
          '2': { total: 0, boys: 0, girls: 0 },
          '3': { total: 0, boys: 0, girls: 0 },
          '4': { total: 0, boys: 0, girls: 0 },
          '5': { total: 0, boys: 0, girls: 0 }
        }
      },
      uniqueStudents: {
        total: 0,
        breakdown: {
          '1': { total: 0, boys: 0, girls: 0 },
          '2': { total: 0, boys: 0, girls: 0 },
          '3': { total: 0, boys: 0, girls: 0 },
          '4': { total: 0, boys: 0, girls: 0 },
          '5': { total: 0, boys: 0, girls: 0 }
        }
      },
      levelChanges: {
        total: 0,
        breakdown: {
          '1→2': { total: 0, boys: 0, girls: 0 },
          '2→3': { total: 0, boys: 0, girls: 0 },
          '3→4': { total: 0, boys: 0, girls: 0 },
          '4→5': { total: 0, boys: 0, girls: 0 },
          'Other': { total: 0, boys: 0, girls: 0 }
        }
      },
      generalCommunications: {
        total: 0,
        breakdown: {
          announcements: 0,
          notices: 0,
          circulars: 0
        }
      }
    };
  }, [realCorrespondenceData, processRealData]);

  // Get program-level data for a specific level and campus
  const getProgramData = useCallback((level, campus) => {
    if (!realCorrespondenceData || !realCorrespondenceData.raw) {
      return programOptions.map(program => ({ ...program, count: 0 }));
    }

    const levelEntries = realCorrespondenceData.raw.filter(entry => {
      const entryLevel = entry.studentLevel || entry.studentId?.prospectusStage || 1;
      const entryGender = entry.studentId?.gender?.toLowerCase();
      const matchesLevel = entryLevel == level;
      const matchesCampus = (campus === 'boys' && entryGender === 'male') || 
                           (campus === 'girls' && entryGender === 'female');
      
      return matchesLevel && matchesCampus;
    });

    // Group by program (this would need to be added to student data in the future)
    // For now, we'll distribute the data randomly across programs
    const programCounts = {};
    programOptions.forEach(program => {
      programCounts[program.value] = 0;
    });

    // Simple distribution - in real implementation, you'd get this from student.program field
    levelEntries.forEach((entry, index) => {
      const programIndex = index % programOptions.length;
      const program = programOptions[programIndex];
      programCounts[program.value]++;
    });

    return programOptions.map(program => ({
      ...program,
      count: programCounts[program.value] || 0
    }));
  }, [realCorrespondenceData, programOptions]);

  // Get detailed data for a specific program
  const getProgramDetails = useCallback((level, campus, program) => {
    if (!realCorrespondenceData || !realCorrespondenceData.raw) {
      return {
        totalCommunications: 0,
        uniqueStudents: 0,
        levelChanges: 0,
        recentCommunications: []
      };
    }

    const programEntries = realCorrespondenceData.raw.filter(entry => {
      const entryLevel = entry.studentLevel || entry.studentId?.prospectusStage || 1;
      const entryGender = entry.studentId?.gender?.toLowerCase();
      const matchesLevel = entryLevel == level;
      const matchesCampus = (campus === 'boys' && entryGender === 'male') || 
                           (campus === 'girls' && entryGender === 'female');
      
      // In real implementation, you'd also check entry.studentId.program === program
      return matchesLevel && matchesCampus;
    });

    // Simple distribution for demo - in real implementation, filter by actual program
    const programIndex = programOptions.findIndex(p => p.value === program);
    const filteredEntries = programEntries.filter((_, index) => index % programOptions.length === programIndex);

    const uniqueStudents = new Set(filteredEntries.map(e => e.studentId?._id)).size;
    const levelChanges = filteredEntries.filter(e => e.isLevelChange).length;
    const recentEntries = filteredEntries.slice(0, 10); // Last 10 entries

    return {
      totalCommunications: filteredEntries.length,
      uniqueStudents,
      levelChanges,
      recentCommunications: recentEntries
    };
  }, [realCorrespondenceData, programOptions]);

  // Get correspondence data (will be updated when real data is available)
  const correspondenceData = getCurrentData();

  // Debug: Log the correspondence data with backend validation
  useEffect(() => {
    if (correspondenceData && realCorrespondenceData?.stats?.validation) {
      const backendValidation = realCorrespondenceData.stats.validation;
      
      console.log('Backend Stats Validation:', {
        totalCommunications: correspondenceData.totalCommunications.total,
        uniqueStudents: correspondenceData.uniqueStudents.total,
        levelChanges: correspondenceData.levelChanges.total,
        generalCommunications: correspondenceData.generalCommunications.total,
        
        // Backend validation results
        backendValidation,
        
        // Quick checks
        isDataConsistent: backendValidation.totalEntriesMatch && backendValidation.levelChangesVsGeneral && backendValidation.levelChangesVsUniqueStudents
      });

      // Alert for any validation failures
      if (!backendValidation.levelChangesVsUniqueStudents) {
        console.error('❌ BACKEND VALIDATION FAILED: Level changes cannot exceed unique students!');
      }
      if (!backendValidation.totalEntriesMatch) {
        console.error('❌ BACKEND VALIDATION FAILED: Total entries mismatch!');
      }
      if (!backendValidation.levelChangesVsGeneral) {
        console.error('❌ BACKEND VALIDATION FAILED: Level changes + General ≠ Total!');
      }
    }
  }, [correspondenceData, realCorrespondenceData]);

  // Initialize data on component mount and update real data when available
  useEffect(() => {
    console.log('Component mount - User role:', userRole);
    
    // Load data for principals and admins, or if role is still loading
    if (!userRole || userRole.toLowerCase() === 'principal' || userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'super_admin') {
      console.log('Fetching correspondence data for role:', userRole);
      fetchComprehensiveData().then((data) => {
        if (data) {
          console.log('Principal Correspondence: Backend data loaded:', {
            totalEntries: data.raw?.length || 0,
            backendStats: data.stats,
            backendValidation: data.stats?.validation,
            
            // Quick overview of main metrics
            overview: {
              totalCommunications: data.stats?.totalCommunications?.total || 0,
              uniqueStudents: data.stats?.uniqueStudents?.total || 0,
              levelChanges: data.stats?.levelChanges?.total || 0,
              generalCommunications: data.stats?.generalCommunications?.total || 0
            }
          });
          setRealCorrespondenceData(data);
        }
      }).catch(error => {
        console.error('Failed to fetch correspondence data:', error);
      });
    } else {
      console.log('User role not authorized for correspondence data:', userRole);
    }
  }, [userRole, fetchComprehensiveData]);

  // Reset drill-down when changing tabs
  useEffect(() => {
    setSelectedLevel(null);
    setSelectedCampus(null);
    setSelectedProgram(null);
  }, [activeTab]);

  // Handle level selection
  const handleLevelClick = (level) => {
    setSelectedLevel(level);
    setSelectedCampus(null);
    setSelectedProgram(null);
  };

  // Handle campus selection
  const handleCampusClick = (campus) => {
    setSelectedCampus(campus);
    setSelectedProgram(null);
  };

  // Handle program selection
  const handleProgramClick = (program) => {
    setSelectedProgram(program);
  };

  // Handle back navigation
  const handleBack = () => {
    if (selectedProgram) {
      setSelectedProgram(null);
    } else if (selectedCampus) {
      setSelectedCampus(null);
    } else if (selectedLevel) {
      setSelectedLevel(null);
    }
  };

  // Get current view title and breadcrumb
  const getCurrentViewInfo = () => {
    let title = '';
    let breadcrumb = [];

    switch (activeTab) {
      case 'total':
        title = 'Total Communications';
        breadcrumb.push('Total Communications');
        break;
      case 'unique':
        title = 'Unique Students';
        breadcrumb.push('Unique Students');
        break;
      case 'level-changes':
        title = 'Level Changes';
        breadcrumb.push('Level Changes');
        break;
      case 'general':
        title = 'General Communications';
        breadcrumb.push('General Communications');
        break;
    }

    if (selectedLevel) {
      breadcrumb.push(`Level ${selectedLevel}`);
    }
    if (selectedCampus) {
      breadcrumb.push(`${selectedCampus === 'boys' ? 'Boys' : 'Girls'} Campus`);
    }
    if (selectedProgram) {
      breadcrumb.push(selectedProgram);
    }

    return { title, breadcrumb };
  };

  // Render level cards
  const renderLevelCards = () => {
    if (activeTab === 'level-changes') {
      return renderLevelChangeCards();
    }

    const data = activeTab === 'total' 
      ? correspondenceData.totalCommunications.breakdown
      : correspondenceData.uniqueStudents.breakdown;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {levelTabs.map((level) => {
          const levelData = data[level.value] || { total: 0, boys: 0, girls: 0 };
          
          return (
            <Card 
              key={level.value}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleLevelClick(level.value)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`w-3 h-3 rounded-full ${level.color}`}></div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <CardTitle className="text-lg">{level.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-blue-600">
                    {levelData.total}
                  </div>
                  <div className="text-sm text-gray-600">
                    {level.description}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Boys: {levelData.boys}</span>
                    <span>Girls: {levelData.girls}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // Render level change specific cards
  const renderLevelChangeCards = () => {
    const data = correspondenceData.levelChanges.breakdown;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(data).map(([transition, transitionData]) => (
          <Card key={transition} className="cursor-pointer hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <ArrowUpDown className="h-5 w-5 text-orange-500" />
                <Badge variant="outline">{transitionData.total}</Badge>
              </div>
              <CardTitle className="text-lg">{transition}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-orange-600">
                  {transitionData.total}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Boys: {transitionData.boys}</span>
                  <span>Girls: {transitionData.girls}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render campus cards
  const renderCampusCards = () => {
    const levelData = activeTab === 'total' 
      ? correspondenceData.totalCommunications.breakdown[selectedLevel]
      : correspondenceData.uniqueStudents.breakdown[selectedLevel];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {campusOptions.map((campus) => {
          const count = campus.value === 'boys' ? levelData.boys : levelData.girls;
          
          return (
            <Card 
              key={campus.value}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleCampusClick(campus.value)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{campus.icon}</span>
                    <div className={`w-3 h-3 rounded-full ${campus.color}`}></div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <CardTitle className="text-xl">{campus.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {count}
                </div>
                <div className="text-sm text-gray-600">
                  {activeTab === 'total' ? 'Communications' : 'Unique Students'}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // Render program cards
  const renderProgramCards = () => {
    const programs = getProgramData(selectedLevel, selectedCampus);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {programs.map((program) => (
          <Card 
            key={program.value}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => handleProgramClick(program.value)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{program.label}</Badge>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
              <CardTitle className="text-lg">{program.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">
                  {program.count}
                </div>
                <div className="text-sm text-gray-600">
                  {program.description}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render program details
  const renderProgramDetails = () => {
    const program = programOptions.find(p => p.value === selectedProgram);
    const details = getProgramDetails(selectedLevel, selectedCampus, selectedProgram);
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>{program?.label} - Detailed Statistics</span>
              <Badge variant="outline">
                Level {selectedLevel} • {selectedCampus === 'boys' ? 'Boys' : 'Girls'} Campus
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {details.totalCommunications}
                </div>
                <div className="text-sm text-gray-600">Total Communications</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {details.uniqueStudents}
                </div>
                <div className="text-sm text-gray-600">Unique Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {details.levelChanges}
                </div>
                <div className="text-sm text-gray-600">Level Changes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Communications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Communications</CardTitle>
          </CardHeader>
          <CardContent>
            {details.recentCommunications.length > 0 ? (
              <div className="space-y-3">
                {details.recentCommunications.map((comm, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">
                          {comm.studentId?.fullName || 'Unknown Student'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(comm.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={comm.isLevelChange ? 'destructive' : 'secondary'}>
                        {comm.isLevelChange ? 'Level Change' : 'General'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {comm.message || comm.subject || 'No message'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No communications found for this program
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render general communications (simplified - just total count)
  const renderGeneralCommunications = () => {
    const total = correspondenceData.generalCommunications.total;
    
    return (
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <span>General Communications</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600 mb-4">
                {total}
              </div>
              <div className="text-lg text-gray-600">
                All non-level-change communications
              </div>
              <div className="text-sm text-gray-500 mt-2">
                This includes all enquiry correspondence that is not related to level changes
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Main render function
  const renderMainContent = () => {
    const { breadcrumb } = getCurrentViewInfo();

    return (
      <div className="space-y-6">
        {/* Breadcrumb and Back Button */}
        {(selectedLevel || selectedCampus || selectedProgram) && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {breadcrumb.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight className="h-4 w-4" />}
                  <span className={index === breadcrumb.length - 1 ? 'font-semibold text-gray-900' : ''}>
                    {item}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          </div>
        )}

        {/* Content based on current selection */}
        {activeTab === 'general' ? (
          renderGeneralCommunications()
        ) : selectedProgram ? (
          renderProgramDetails()
        ) : selectedCampus ? (
          renderProgramCards()
        ) : selectedLevel ? (
          renderCampusCards()
        ) : (
          renderLevelCards()
        )}
      </div>
    );
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refreshData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Header 
        title="Principal Correspondence Management"
        subtitle="Manage and monitor all correspondence communications"
        lastUpdated={lastUpdated}
        onRefresh={() => {
          refreshData().then((data) => {
            if (data) {
              setRealCorrespondenceData(data);
            }
          });
        }}
        isRefreshing={isRefreshing}
        dateFilters={dateFilters}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomStartDateChange={setCustomStartDate}
        onCustomEndDateChange={setCustomEndDate}
        onApplyCustomDates={() => {
          fetchCustomDateRange(customStartDate, customEndDate).then((data) => {
            if (data) {
              setRealCorrespondenceData(data);
            }
          });
        }}
        customDatesApplied={customDatesApplied}
        isCustomDateLoading={isCustomDateLoading}
      />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="total" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Total Communications</span>
            <Badge variant="secondary">{correspondenceData.totalCommunications.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unique" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Unique Students</span>
            <Badge variant="secondary">{correspondenceData.uniqueStudents.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="level-changes" className="flex items-center space-x-2">
            <ArrowUpDown className="h-4 w-4" />
            <span>Level Changes</span>
            <Badge variant="secondary">{correspondenceData.levelChanges.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <UserCheck className="h-4 w-4" />
            <span>General</span>
            <Badge variant="secondary">{correspondenceData.generalCommunications.total}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="total" className="mt-6">
          {renderMainContent()}
        </TabsContent>

        <TabsContent value="unique" className="mt-6">
          {renderMainContent()}
        </TabsContent>

        <TabsContent value="level-changes" className="mt-6">
          {renderMainContent()}
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          {renderMainContent()}
        </TabsContent>
      </Tabs>

      {/* Floating Stats Pill */}
      <FloatingStatsPill
        ref={pillRef}
        position={pillPosition}
        onPositionChange={setPillPosition}
        isDragging={isDragging}
        onDraggingChange={setIsDragging}
        dragOffset={dragOffset}
        onDragOffsetChange={setDragOffset}
        onClick={() => setShowStatsModal(true)}
        stats={{
          total: correspondenceData.totalCommunications.total,
          unique: correspondenceData.uniqueStudents.total,
          changes: correspondenceData.levelChanges.total
        }}
      />

      {/* Stats Modal */}
      <StatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="Correspondence Statistics Overview"
        data={correspondenceData}
      />
    </div>
  );
};

export default PrincipalCorrespondenceManagementNew;
