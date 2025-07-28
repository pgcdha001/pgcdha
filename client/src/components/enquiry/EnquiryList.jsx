import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, User, Mail, Phone, Clock, XCircle, CheckCircle, Eye, Settings, CalendarDays, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import PermissionGuard from '../PermissionGuard';
import EnquiryLevelManager from './EnquiryLevelManager';
import DateFilter from './DateFilter';
import CustomDateRange from './CustomDateRange';
import api from '../../services/api';
import { PERMISSIONS } from '../../utils/rolePermissions';
import { ENQUIRY_LEVELS, getLevelInfo } from '../../constants/enquiryLevels';
import { useDebounce } from '../../hooks/usePerformance';

const EnquiryList = ({ config }) => {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  
  // Date filter states
  const [selectedDate, setSelectedDate] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customDatesApplied, setCustomDatesApplied] = useState(false);
  const [isCustomDateLoading, setIsCustomDateLoading] = useState(false);
  
  // Non-progression filter states
  const [showNonProgression, setShowNonProgression] = useState(false);
  const [progressionLevel, setProgressionLevel] = useState('');

  const dateFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add date filter parameters (only if not custom, or if custom and dates are applied)
      if (selectedDate !== 'all' && selectedDate !== 'custom') {
        params.append('dateFilter', selectedDate);
      } else if (selectedDate === 'custom' && customStartDate && customEndDate && customDatesApplied) {
        params.append('dateFilter', 'custom');
        params.append('startDate', customStartDate);
        params.append('endDate', customEndDate);
      }
      
      // Add non-progression filter parameters
      if (showNonProgression && progressionLevel) {
        params.append('nonProgression', 'true');
        params.append('progressionLevel', progressionLevel);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/students?${queryString}` : '/students';
      
      const response = await api.get(url);
      // Extract the actual data array from the API response
      const enquiriesData = response.data?.data || response.data || [];
      
      // Apply role-based filtering if configured
      let filteredData = enquiriesData;
      if (config.levelRestrictions && config.levelRestrictions.length > 0) {
        filteredData = enquiriesData.filter(enquiry => 
          config.levelRestrictions.includes(enquiry.prospectusStage || enquiry.enquiryLevel)
        );
      }
      
      setEnquiries(filteredData);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, [config, selectedDate, customStartDate, customEndDate, customDatesApplied, showNonProgression, progressionLevel]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // Only trigger refetch when custom dates are applied (not on date input changes)
  useEffect(() => {
    if (selectedDate === 'custom' && customDatesApplied) {
      // This will trigger fetchEnquiries through the dependency in the useCallback
    }
  }, [customDatesApplied, selectedDate]);

  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // Date filter handlers
  const handleDateChange = (dateValue) => {
    setSelectedDate(dateValue);
    if (dateValue !== 'custom') {
      setCustomDatesApplied(false);
      // Reset custom dates when switching away from custom
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const handleStartDateChange = (date) => {
    setCustomStartDate(date);
    // Don't set customDatesApplied to false here - user needs to click Apply
  };

  const handleEndDateChange = (date) => {
    setCustomEndDate(date);
    // Don't set customDatesApplied to false here - user needs to click Apply
  };

  const handleApplyCustomDates = async () => {
    if (customStartDate && customEndDate) {
      setIsCustomDateLoading(true);
      setCustomDatesApplied(true);
      // The useEffect will trigger fetchEnquiries when customDatesApplied changes
      setTimeout(() => {
        setIsCustomDateLoading(false);
      }, 500);
    }
  };

  // Non-progression filter handlers
  const handleNonProgressionToggle = () => {
    const newShowNonProgression = !showNonProgression;
    setShowNonProgression(newShowNonProgression);
    
    if (newShowNonProgression) {
      // When enabling non-progression filter, reset level filter to "All Levels"
      setFilterLevel('');
      if (!progressionLevel) {
        setProgressionLevel('2'); // Default to Level 2
      }
    }
  };

  const handleProgressionLevelChange = (level) => {
    setProgressionLevel(level);
  };

  useEffect(() => {
    let filtered = enquiries;

    // Search filter
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(enquiry => {
        const fullName = `${enquiry.fullName?.firstName || ''} ${enquiry.fullName?.lastName || ''}`.trim();
        return fullName.toLowerCase().includes(searchLower) ||
               enquiry.email?.toLowerCase().includes(searchLower) ||
               enquiry.session?.toLowerCase().includes(searchLower) ||
               enquiry.cnic?.includes(debouncedSearchTerm);
      });
    }

    // Level filter
    if (filterLevel) {
      filtered = filtered.filter(enquiry => 
        (enquiry.prospectusStage || enquiry.enquiryLevel) === parseInt(filterLevel)
      );
    }

    // Gender filter
    if (filterGender) {
      filtered = filtered.filter(enquiry => enquiry.gender === filterGender);
    }

    setFilteredEnquiries(filtered);
  }, [enquiries, debouncedSearchTerm, filterLevel, filterGender]);

  const getStatusIconComponent = (levelId) => {
    switch (levelId) {
      case 5: return <CheckCircle className="h-4 w-4" />;
      case 6: return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getAvailableLevels = () => {
    if (config.levelRestrictions && config.levelRestrictions.length > 0) {
      return ENQUIRY_LEVELS.filter(level => config.levelRestrictions.includes(level.id));
    }
    return ENQUIRY_LEVELS;
  };

  const handleViewDetails = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowDetailsModal(true);
  };

  const handleUpdateLevel = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowLevelModal(true);
  };

  const onLevelUpdated = async (updatedEnquiry) => {
    try {
      // First, ensure the server update was successful
      await api.put(`/students/${updatedEnquiry._id || updatedEnquiry.id}/level`, {
        level: updatedEnquiry.prospectusStage || updatedEnquiry.enquiryLevel,
        notes: updatedEnquiry.notes || 'Level updated'
      });

      // Update local state
      setEnquiries(prev => 
        prev.map(enquiry => 
          (enquiry._id || enquiry.id) === (updatedEnquiry._id || updatedEnquiry.id) ? updatedEnquiry : enquiry
        )
      );
      
      // Close modals and reset selection
      setShowLevelModal(false);
      setSelectedEnquiry(null);
      
      // Refresh the list to ensure consistency
      await fetchEnquiries();
    } catch (error) {
      console.error('Error updating enquiry level:', error);
      // You might want to show an error toast here
    }
  };

  return (
    <>
      {/* Filters and Search */}
      <div className="relative bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-border p-6 mb-6 transition-all duration-300 hover:shadow-[0_20px_64px_0_rgba(26,35,126,0.18)] group">
        <span className="absolute top-0 left-8 right-8 h-1 rounded-b-xl bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />
        
        {/* Custom Date Range */}
        {selectedDate === 'custom' && (
          <CustomDateRange 
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            customDatesApplied={customDatesApplied}
            isCustomDateLoading={isCustomDateLoading}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onApplyFilters={handleApplyCustomDates}
            loading={loading}
          />
        )}
        
        {/* Main Filter Row */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="Search by name, email, session, or CNIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/80 shadow-inner focus:shadow-lg focus:bg-white rounded-xl font-[Inter,sans-serif] focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>
          
          {/* Date Filter */}
          <div className="lg:w-48">
            <DateFilter 
              selectedDate={selectedDate}
              dateFilters={dateFilters}
              onDateChange={handleDateChange}
              loading={loading}
            />
          </div>
          
          <div className="lg:w-48">
            <div className="relative group">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
              <select
                value={showNonProgression ? '' : filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                disabled={showNonProgression}
                className={`w-full pl-10 pr-4 py-3 bg-white/80 shadow-inner focus:shadow-lg focus:bg-white rounded-xl font-[Inter,sans-serif] focus:ring-2 focus:ring-primary/40 focus:outline-none appearance-none transition-all duration-200 ${
                  showNonProgression ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
                }`}
              >
                <option value="">All Levels</option>
                {getAvailableLevels().map((level) => (
                  <option key={level.id} value={level.id.toString()}>
                    {level.name}
                  </option>
                ))}
              </select>
              {showNonProgression && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                  Auto-set to All
                </div>
              )}
            </div>
          </div>
          <div className="lg:w-48">
            <div className="relative group">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/80 shadow-inner focus:shadow-lg focus:bg-white rounded-xl font-[Inter,sans-serif] focus:ring-2 focus:ring-primary/40 focus:outline-none appearance-none transition-all duration-200"
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Not specified">Not Specified</option>
              </select>
            </div>
          </div>
          <div className="relative">
            <span className="absolute inset-0 rounded-xl p-[2px] bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x blur-sm opacity-70 pointer-events-none" />
            <Button
              onClick={fetchEnquiries}
              disabled={loading}
              className="relative z-10 px-5 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-bold shadow-lg hover:from-accent hover:to-primary hover:scale-[1.04] active:scale-100 transition-all duration-200 animate-float-btn disabled:opacity-50 flex items-center gap-2"
              style={{boxShadow: '0 6px 32px 0 rgba(26,35,126,0.13)'}}
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        
        {/* Non-Progression Filter Row */}
        <div className="mt-4 pt-4 border-t border-border/20">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="nonProgression"
                checked={showNonProgression}
                onChange={handleNonProgressionToggle}
                className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
              />
              <label htmlFor="nonProgression" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span>Show Non-Progressed Students</span>
              </label>
            </div>
            
            {showNonProgression && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">From Level:</span>
                <select
                  value={progressionLevel}
                  onChange={(e) => handleProgressionLevelChange(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Level</option>
                  <option value="2">Level 2 (didn't progress from Level 1)</option>
                  <option value="3">Level 3 (didn't progress from Level 2)</option>
                  <option value="4">Level 4 (didn't progress from Level 3)</option>
                  <option value="5">Level 5 (didn't progress from Level 4)</option>
                </select>
              </div>
            )}
          </div>
          
          {showNonProgression && progressionLevel && (
            <div className="mt-2 text-sm text-orange-600 bg-orange-50 p-2 rounded-lg">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Showing students who did not progress to Level {progressionLevel}
            </div>
          )}
        </div>
      </div>

      {/* Enquiries List */}
      <div className="relative bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-border transition-all duration-300 max-w-[calc(100vw-2rem)] overflow-hidden">
        <span className="absolute top-0 left-8 right-8 h-1 rounded-b-xl bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />
        <div className="p-6 border-b border-border/20">
          <h2 className="text-2xl font-extrabold text-primary tracking-tight font-[Sora,Inter,sans-serif] drop-shadow-sm">
            Enquiries ({filteredEnquiries.length})
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading enquiries...</p>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No enquiries found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent hover:scrollbar-thumb-primary/20">
            <div className="min-w-full inline-block align-middle">
              <table className="min-w-full table-fixed divide-y divide-border/20">
                <thead className="bg-primary/5">
                  <tr>
                    <th className="w-[300px] px-6 py-3 text-left text-xs font-semibold text-primary/70 uppercase tracking-wider font-[Inter,sans-serif]">Student</th>
                    <th className="w-[150px] px-6 py-3 text-left text-xs font-semibold text-primary/70 uppercase tracking-wider font-[Inter,sans-serif]">Session</th>
                    <th className="w-[180px] px-6 py-3 text-left text-xs font-semibold text-primary/70 uppercase tracking-wider font-[Inter,sans-serif]">Level</th>
                    <th className="w-[120px] px-6 py-3 text-left text-xs font-semibold text-primary/70 uppercase tracking-wider font-[Inter,sans-serif]">Date Created</th>
                    <th className="w-[120px] px-6 py-3 text-left text-xs font-semibold text-primary/70 uppercase tracking-wider font-[Inter,sans-serif]">Last Updated</th>
                    <th className="w-[180px] px-6 py-3 text-left text-xs font-semibold text-primary/70 uppercase tracking-wider font-[Inter,sans-serif]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {filteredEnquiries.map((enquiry) => {
                  const levelInfo = getLevelInfo(enquiry.prospectusStage || enquiry.enquiryLevel || 1);
                  const fullName = `${enquiry.fullName?.firstName || ''} ${enquiry.fullName?.lastName || ''}`.trim();
                  const dateCreated = enquiry.createdOn ? new Date(enquiry.createdOn).toLocaleDateString() : 'N/A';
                  const lastUpdated = enquiry.updatedOn ? new Date(enquiry.updatedOn).toLocaleDateString() : 'N/A';
                  
                  return (
                    <tr key={enquiry._id || enquiry.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="relative">
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-xl opacity-70" />
                              <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110">
                                <User className="h-5 w-5 text-white animate-float" />
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-primary font-[Inter,sans-serif]">{fullName || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {enquiry.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {enquiry.session || enquiry.course || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${levelInfo.bgColor} ${levelInfo.textColor}`}>
                          {getStatusIconComponent(enquiry.prospectusStage || enquiry.enquiryLevel || 1)}
                          {levelInfo.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dateCreated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lastUpdated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <PermissionGuard permission={PERMISSIONS.ENQUIRY_MANAGEMENT.VIEW_ENQUIRIES}>
                            <button
                              onClick={() => handleViewDetails(enquiry)}
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>
                          </PermissionGuard>
                          <PermissionGuard permission={PERMISSIONS.ENQUIRY_MANAGEMENT.EDIT_ENQUIRY}>
                            <button
                              onClick={() => handleUpdateLevel(enquiry)}
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors duration-200"
                            >
                              <Settings className="h-4 w-4" />
                              Update
                            </button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Level Manager Modal */}
      {showLevelModal && selectedEnquiry && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-[9999]">
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 p-6 w-full max-w-xl mx-4 animate-fade-in transform transition-all duration-200">
            <span className="absolute top-0 left-8 right-8 h-1 rounded-b-xl bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />
            <EnquiryLevelManager
              enquiry={selectedEnquiry}
              availableLevels={getAvailableLevels()}
              onClose={() => {
                setShowLevelModal(false);
                setSelectedEnquiry(null);
              }}
              onLevelUpdated={onLevelUpdated}
            />
          </div>
        </div>
      )}

        {/* Details Modal */}
      {showDetailsModal && selectedEnquiry && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-[9999]">
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto animate-fade-in transform transition-all duration-200">
            <span className="absolute top-0 left-8 right-8 h-1 rounded-b-xl bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-extrabold text-primary tracking-tight font-[Sora,Inter,sans-serif] drop-shadow-sm">
                Enquiry Details
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedEnquiry(null);
                }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                  <p className="text-sm text-gray-900">
                    {`${selectedEnquiry.fullName?.firstName || ''} ${selectedEnquiry.fullName?.lastName || ''}`.trim() || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                  <p className="text-sm text-gray-900">{selectedEnquiry.session || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm text-gray-900">{selectedEnquiry.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-sm text-gray-900">{selectedEnquiry.phoneNumber || selectedEnquiry.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Created</label>
                  <p className="text-sm text-gray-900">
                    {selectedEnquiry.createdOn ? new Date(selectedEnquiry.createdOn).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <p className="text-sm text-gray-900">
                    {selectedEnquiry.updatedOn ? new Date(selectedEnquiry.updatedOn).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Level</label>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getLevelInfo(selectedEnquiry.prospectusStage || selectedEnquiry.enquiryLevel || 1).bgColor} ${getLevelInfo(selectedEnquiry.prospectusStage || selectedEnquiry.enquiryLevel || 1).textColor}`}>
                  {getStatusIconComponent(selectedEnquiry.prospectusStage || selectedEnquiry.enquiryLevel || 1)}
                  {getLevelInfo(selectedEnquiry.prospectusStage || selectedEnquiry.enquiryLevel || 1).name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNIC</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedEnquiry.cnic || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <PermissionGuard permission={PERMISSIONS.ENQUIRY_MANAGEMENT.EDIT_ENQUIRY}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedEnquiry(selectedEnquiry);
                    setShowLevelModal(true);
                  }}
                >
                  Update Level
                </Button>
              </PermissionGuard>
              <Button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedEnquiry(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnquiryList;
