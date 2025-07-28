import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, MessageSquare, User, Calendar, Eye, Edit2, Trash2, X } from 'lucide-react';
import { Button } from '../ui/button';
import CorrespondenceFormPage from './CorrespondenceFormPage';
import DateFilter from '../enquiry/DateFilter';
import CustomDateRange from '../enquiry/CustomDateRange';
import api from '../../services/api';
import { useDebounce } from '../../hooks/usePerformance';
import { useApiWithToast } from '../../hooks/useApiWithToast';

const CorrespondenceList = ({ onEditCorrespondence }) => {
  const [correspondence, setCorrespondence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedCorrespondence, setSelectedCorrespondence] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [stats, setStats] = useState(null);
  const [allStudentCommunications, setAllStudentCommunications] = useState([]);

  // Filter states
  const [selectedDate, setSelectedDate] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customDatesApplied, setCustomDatesApplied] = useState(false);
  const [isCustomDateLoading, setIsCustomDateLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const dateFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const { executeRequest } = useApiWithToast();

  const fetchCorrespondence = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Add date filter parameters
      if (selectedDate !== 'all' && selectedDate !== 'custom') {
        params.append('dateFilter', selectedDate);
      } else if (selectedDate === 'custom' && customStartDate && customEndDate && customDatesApplied) {
        params.append('dateFilter', 'custom');
        params.append('startDate', customStartDate);
        params.append('endDate', customEndDate);
      }
      
      // Add type filter
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      
      // Add level filter
      if (filterLevel !== 'all') {
        params.append('level', filterLevel);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/correspondence?${queryString}` : '/correspondence';
      
      const response = await api.get(url);
      const correspondenceData = response.data?.data || response.data || [];
      const statsData = response.data?.stats || null;
      
      setCorrespondence(correspondenceData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching correspondence:', error);
      setCorrespondence([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, customStartDate, customEndDate, customDatesApplied, filterType, filterLevel]);

  useEffect(() => {
    fetchCorrespondence();
  }, [fetchCorrespondence]);

  // Date filter handlers
  const handleDateChange = (dateValue) => {
    setSelectedDate(dateValue);
    if (dateValue !== 'custom') {
      setCustomDatesApplied(false);
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const handleStartDateChange = (date) => {
    setCustomStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setCustomEndDate(date);
  };

  const handleApplyCustomDates = async () => {
    if (customStartDate && customEndDate) {
      setIsCustomDateLoading(true);
      setCustomDatesApplied(true);
      setTimeout(() => {
        setIsCustomDateLoading(false);
      }, 500);
    }
  };

  // Filter correspondence based on search term
  const filteredCorrespondence = correspondence.filter(item => {
    if (!debouncedSearchTerm.trim()) return true;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    const studentName = `${item.studentId?.fullName?.firstName || ''} ${item.studentId?.fullName?.lastName || ''}`.trim();
    const staffName = item.staffMember?.name || '';
    
    return (
      studentName.toLowerCase().includes(searchLower) ||
      staffName.toLowerCase().includes(searchLower) ||
      item.subject.toLowerCase().includes(searchLower)
    );
  });

  const handleEditSuccess = () => {
    fetchCorrespondence();
    setShowEditForm(false);
    setSelectedCorrespondence(null);
  };

  const handleEdit = (correspondence) => {
    if (onEditCorrespondence) {
      onEditCorrespondence(correspondence);
    } else {
      // Fallback to local state if prop not provided
      setSelectedCorrespondence(correspondence);
      setShowEditForm(true);
    }
  };

  const handleViewDetails = async (correspondence) => {
    setSelectedCorrespondence(correspondence);
    
    // Fetch all communications for this student
    try {
      const studentId = correspondence.studentId._id;
      
      // Get all correspondence for this student (no filters except student)
      const response = await api.get('/correspondence');
      const allCorrespondence = response.data?.data || [];
      
      // Filter to only this student's communications
      const studentCommunications = allCorrespondence.filter(
        comm => comm.studentId._id === studentId
      );
      
      // Sort by timestamp (newest first)
      studentCommunications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setAllStudentCommunications(studentCommunications);
    } catch (error) {
      console.error('Error fetching student communications:', error);
      setAllStudentCommunications([correspondence]); // Fallback to just the selected one
    }
    
    setShowDetailsModal(true);
  };

  const handleDelete = (correspondence) => {
    setSelectedCorrespondence(correspondence);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCorrespondence) return;
    
    setDeletingId(selectedCorrespondence._id);
    try {
      await executeRequest(
        () => api.delete(`/correspondence/${selectedCorrespondence._id}`),
        {
          successMessage: 'Correspondence deleted successfully',
          errorMessage: 'Failed to delete correspondence'
        }
      );
      fetchCorrespondence();
      setShowDeleteModal(false);
      setSelectedCorrespondence(null);
    } catch (error) {
      console.error('Error deleting correspondence:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const getTypeInfo = (type) => {
    if (type === 'enquiry') {
      return {
        name: 'Enquiry Correspondence',
        icon: MessageSquare,
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200'
      };
    } else {
      return {
        name: 'Student Correspondence',
        icon: User,
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200'
      };
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Correspondence Records</h2>
            <p className="text-gray-600">View and manage all correspondence entries</p>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Records</p>
                  <p className="text-2xl font-bold text-blue-900">{correspondence.length}</p>
                  <p className="text-xs text-blue-500">All correspondence</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Unique Students</p>
                  <p className="text-2xl font-bold text-green-900">{stats.uniqueStudentsContacted}</p>
                  <p className="text-xs text-green-500">Students contacted</p>
                </div>
                <User className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Correspondence</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.breakdown?.individualCorrespondenceRecords || 0}</p>
                  <p className="text-xs text-purple-500">Direct entries</p>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Level Changes</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.breakdown?.individualLevelChangeRecords || 0}</p>
                  <p className="text-xs text-orange-500">Individual changes</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">Total Entries</p>
                  <p className="text-2xl font-bold text-indigo-900">{stats.breakdown?.totalIndividualRecords || 0}</p>
                  <p className="text-xs text-indigo-500">All records</p>
                </div>
                <Filter className="w-8 h-8 text-indigo-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Custom Date Range */}
          {selectedDate === 'custom' && (
            <div className="mb-6">
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
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student, staff, or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <DateFilter 
                selectedDate={selectedDate}
                dateFilters={dateFilters}
                onDateChange={handleDateChange}
                loading={loading}
              />
            </div>

            {/* Type Filter */}
            <div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="all">All Types</option>
                  <option value="enquiry">Enquiry Correspondence</option>
                  <option value="student">Student Correspondence</option>
                </select>
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="all">All Levels</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Correspondence List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Correspondence ({filteredCorrespondence.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading correspondence...</p>
            </div>
          ) : filteredCorrespondence.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No correspondence found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCorrespondence.map((item) => {
                    const typeInfo = getTypeInfo(item.type);
                    const TypeIcon = typeInfo.icon;
                    const studentName = `${item.studentId?.fullName?.firstName || ''} ${item.studentId?.fullName?.lastName || ''}`.trim();
                    
                    return (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{studentName}</div>
                            <div className="text-sm text-gray-500">Level {item.studentLevel}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.textColor}`}>
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {typeInfo.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-900 max-w-xs truncate" title={item.subject}>
                              {item.subject}
                            </div>
                            {item.isLevelChange && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Level Change
                              </span>
                            )}
                            {item.remarkIndex && item.totalRemarks && item.totalRemarks > 1 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {item.remarkIndex}/{item.totalRemarks}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.staffMember.name}</div>
                          <div className="text-sm text-gray-500">{item.staffMember.role}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(item)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form Modal - Only show if onEditCorrespondence prop not provided */}
      {!onEditCorrespondence && (
        <CorrespondenceFormPage
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setSelectedCorrespondence(null);
          }}
          onSuccess={handleEditSuccess}
          editData={selectedCorrespondence}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCorrespondence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  All Communications - {`${selectedCorrespondence.studentId?.fullName?.firstName || ''} ${selectedCorrespondence.studentId?.fullName?.lastName || ''}`.trim()}
                </h3>
                <p className="text-sm text-gray-600">
                  Level {selectedCorrespondence.studentLevel} • {allStudentCommunications.length} communication{allStudentCommunications.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setAllStudentCommunications([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {allStudentCommunications.length > 0 ? (
                <div className="space-y-6">
                  {allStudentCommunications.map((comm, index) => (
                    <div 
                      key={comm._id || index} 
                      className={`border rounded-lg p-4 ${
                        comm._id === selectedCorrespondence._id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{comm.subject}</h4>
                          {comm.isLevelChange && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Level Change
                            </span>
                          )}
                          {comm._id === selectedCorrespondence._id && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {getTypeInfo(comm.type).name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(comm.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{comm.message}</p>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          By: {comm.staffMember.name}
                          {comm.staffMember.role && ` (${comm.staffMember.role})`}
                        </span>
                        <span>
                          {comm.remarkIndex && comm.totalRemarks && comm.totalRemarks > 1 && 
                            `Communication ${comm.remarkIndex} of ${comm.totalRemarks}`
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No communications found for this student.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCorrespondence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete Correspondence
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete this correspondence? This action cannot be undone.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  <strong>Student:</strong> {`${selectedCorrespondence.studentId?.fullName?.firstName || ''} ${selectedCorrespondence.studentId?.fullName?.lastName || ''}`.trim()}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Subject:</strong> {selectedCorrespondence.subject}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Type:</strong> {getTypeInfo(selectedCorrespondence.type).name}
                </p>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedCorrespondence(null);
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={deletingId === selectedCorrespondence._id}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={deletingId === selectedCorrespondence._id}
                >
                  {deletingId === selectedCorrespondence._id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CorrespondenceList;
