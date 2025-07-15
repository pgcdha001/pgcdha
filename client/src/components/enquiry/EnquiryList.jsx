import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, User, Mail, Phone, Clock, XCircle, CheckCircle, Eye, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import PermissionGuard from '../PermissionGuard';
import EnquiryLevelManager from './EnquiryLevelManager';
import api from '../../services/api';
import { PERMISSIONS } from '../../utils/rolePermissions';
const ENQUIRY_LEVELS = [
  { id: 1, name: 'Initial Enquiry', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  { id: 2, name: 'Documents Collection', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  { id: 3, name: 'Application Review', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  { id: 4, name: 'Interview Scheduled', color: 'indigo', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800' },
  { id: 5, name: 'Admitted', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  { id: 6, name: 'Rejected', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
];

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

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/students');
      // Extract the actual data array from the API response
      const enquiriesData = response.data?.data || response.data || [];
      
      // Apply role-based filtering if configured
      let filteredData = enquiriesData;
      if (config.levelRestrictions && config.levelRestrictions.length > 0) {
        filteredData = enquiriesData.filter(enquiry => 
          config.levelRestrictions.includes(enquiry.prospectusStage || enquiry.level)
        );
      }
      
      setEnquiries(filteredData);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetchEnquiries();
  }, [config, fetchEnquiries]);

  useEffect(() => {
    let filtered = enquiries;

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(enquiry => {
        const fullName = `${enquiry.fullName?.firstName || ''} ${enquiry.fullName?.lastName || ''}`.trim();
        return fullName.toLowerCase().includes(searchLower) ||
               enquiry.email?.toLowerCase().includes(searchLower) ||
               enquiry.session?.toLowerCase().includes(searchLower) ||
               enquiry.cnic?.includes(searchTerm);
      });
    }

    // Level filter
    if (filterLevel) {
      filtered = filtered.filter(enquiry => 
        (enquiry.prospectusStage || enquiry.level) === parseInt(filterLevel)
      );
    }

    // Gender filter
    if (filterGender) {
      filtered = filtered.filter(enquiry => enquiry.gender === filterGender);
    }

    setFilteredEnquiries(filtered);
  }, [enquiries, searchTerm, filterLevel, filterGender]);

  const getLevelInfo = (levelId) => {
    return ENQUIRY_LEVELS.find(level => level.id === levelId) || ENQUIRY_LEVELS[0];
  };

  const getStatusIcon = (levelId) => {
    switch (levelId) {
      case 1: return <Clock className="h-4 w-4" />;
      case 2: return <Clock className="h-4 w-4" />;
      case 3: return <Clock className="h-4 w-4" />;
      case 4: return <Clock className="h-4 w-4" />;
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

  const onLevelUpdated = (updatedEnquiry) => {
    setEnquiries(prev => 
      prev.map(enquiry => 
        enquiry.id === updatedEnquiry.id ? updatedEnquiry : enquiry
      )
    );
    setShowLevelModal(false);
    setSelectedEnquiry(null);
  };

  return (
    <>
      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, session, or CNIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="lg:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">All Levels</option>
                {getAvailableLevels().map((level) => (
                  <option key={level.id} value={level.id.toString()}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="lg:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Not specified">Not Specified</option>
              </select>
            </div>
          </div>
          <Button
            onClick={fetchEnquiries}
            disabled={loading}
            variant="outline"
            className="px-4 py-2 bg-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Enquiries List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNIC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEnquiries.map((enquiry) => {
                  const levelInfo = getLevelInfo(enquiry.prospectusStage || enquiry.level || 1);
                  const fullName = `${enquiry.fullName?.firstName || ''} ${enquiry.fullName?.lastName || ''}`.trim();
                  const dateCreated = enquiry.createdOn ? new Date(enquiry.createdOn).toLocaleDateString() : 'N/A';
                  const lastUpdated = enquiry.updatedOn ? new Date(enquiry.updatedOn).toLocaleDateString() : 'N/A';
                  
                  return (
                    <tr key={enquiry._id || enquiry.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{fullName || 'N/A'}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {enquiry.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {enquiry.cnic || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {enquiry.session || enquiry.course || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${levelInfo.bgColor} ${levelInfo.textColor}`}>
                          {getStatusIcon(enquiry.prospectusStage || enquiry.level || 1)}
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
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>
                          </PermissionGuard>
                          <PermissionGuard permission={PERMISSIONS.ENQUIRY_MANAGEMENT.EDIT_ENQUIRY}>
                            <button
                              onClick={() => handleUpdateLevel(enquiry)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
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
        )}
      </div>

      {/* Level Manager Modal */}
      {showLevelModal && selectedEnquiry && (
        <EnquiryLevelManager
          enquiry={selectedEnquiry}
          availableLevels={getAvailableLevels()}
          onClose={() => {
            setShowLevelModal(false);
            setSelectedEnquiry(null);
          }}
          onLevelUpdated={onLevelUpdated}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedEnquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[9999] pt-20">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto mt-4">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Enquiry Details
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedEnquiry(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
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
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getLevelInfo(selectedEnquiry.prospectusStage || selectedEnquiry.level || 1).bgColor} ${getLevelInfo(selectedEnquiry.prospectusStage || selectedEnquiry.level || 1).textColor}`}>
                  {getStatusIcon(selectedEnquiry.prospectusStage || selectedEnquiry.level || 1)}
                  {getLevelInfo(selectedEnquiry.prospectusStage || selectedEnquiry.level || 1).name}
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
