import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Plus,
  User,
  Phone,
  Mail,
  Calendar,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { useToast } from '../../contexts/ToastContext';
import { default as api } from '../../services/api';

// Enquiry level definitions
const ENQUIRY_LEVELS = [
  { id: 1, name: 'Not Purchased', description: 'Initial inquiry registered', color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' },
  { id: 2, name: 'Purchased', description: 'Prospectus purchased by student', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  { id: 3, name: 'Returned', description: 'Prospectus returned with application', color: 'bg-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  { id: 4, name: 'Admission Fee Submitted', description: 'AF paid, partial admission', color: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
  { id: 5, name: '1st Installment Submitted', description: 'Full admission confirmed', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
  { id: 6, name: 'Custom', description: 'Special cases and exceptions', color: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700' }
];

const EnquiryManagement = () => {
  const { toast } = useToast();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updatingLevel, setUpdatingLevel] = useState(false);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      // Fetch all students from the database
      const res = await api.get('/users?role=Student&limit=1000');
      const students = res.data?.data?.users || [];
      
      // Transform student data to enquiry format
      const enquiriesData = students.map((student, index) => ({
        id: student._id || index + 1,
        studentName: `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.trim() || 'Unknown Student',
        email: student.email || 'No email',
        phone: student.phone || 'No phone',
        course: student.course || student.program || 'Not specified',
        level: student.prospectusStage || 1, // Use prospectusStage as enquiry level
        dateCreated: student.registrationDate ? new Date(student.registrationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        lastUpdated: student.lastUpdated ? new Date(student.lastUpdated).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: student.notes || 'No additional notes',
        cnic: student.cnic || 'Not provided'
      }));
      
      setEnquiries(enquiriesData);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      toast.error('Failed to fetch student enquiries. Please try again.');
      // Fallback to empty array on error
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch = enquiry.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enquiry.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === '' || enquiry.level.toString() === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const getLevelInfo = (levelId) => {
    return ENQUIRY_LEVELS.find(level => level.id === levelId) || ENQUIRY_LEVELS[0];
  };

  const handleLevelUpdate = async (enquiryId, newLevel) => {
    setUpdatingLevel(true);
    try {
      // Find the enquiry to get student information
      const updatedEnquiry = enquiries.find(e => e.id === enquiryId);
      const newLevelName = ENQUIRY_LEVELS.find(l => l.id === newLevel)?.name || 'Unknown Level';
      const oldLevel = updatedEnquiry?.level || 1;
      
      // Make API call to update student's prospectus stage using users endpoint
      const response = await api.put(`/users/${enquiryId}`, { 
        prospectusStage: newLevel,
        lastUpdated: new Date().toISOString()
      });
      
      console.log('Stage update response:', response.data);
      
      // Update local state
      setEnquiries(prev => prev.map(enquiry => 
        enquiry.id === enquiryId 
          ? { ...enquiry, level: newLevel, lastUpdated: new Date().toISOString().split('T')[0] }
          : enquiry
      ));
      
      // Refresh data from server to ensure consistency
      await fetchEnquiries();
      
      // Show appropriate toast based on upgrade/downgrade
      const studentName = updatedEnquiry?.studentName || `Student #${enquiryId}`;
      if (newLevel > oldLevel) {
        toast.enquiryStageUpgraded(studentName, newLevelName);
      } else if (newLevel < oldLevel) {
        toast.enquiryStageDowngraded(studentName, newLevelName);
      } else {
        toast.enquiryStageChanged(studentName, newLevelName);
      }
      
      setShowLevelModal(false);
      setSelectedEnquiry(null);
    } catch (error) {
      console.error('Error updating level:', error);
      
      // Show more detailed error message
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      toast.error(`Failed to update enquiry level: ${errorMessage}`);
    } finally {
      setUpdatingLevel(false);
    }
  };

  const getStatusIcon = (level) => {
    switch (level) {
      case 1: return <Clock className="h-4 w-4" />;
      case 2: return <BookOpen className="h-4 w-4" />;
      case 3: return <AlertCircle className="h-4 w-4" />;
      case 4: return <CheckCircle className="h-4 w-4" />;
      case 5: return <CheckCircle className="h-4 w-4" />;
      case 6: return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Link 
                to="/dashboard" 
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 font-[Sora,Inter,sans-serif]">
                  Enquiry Management
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage student enquiries and track admission progress
                </p>
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

          {/* Level Legend */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enquiry Levels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ENQUIRY_LEVELS.map((level) => (
                <div key={level.id} className={`${level.bgColor} rounded-lg p-3 border border-gray-200`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${level.color}`}></div>
                    <span className="font-semibold text-sm">{level.name}</span>
                  </div>
                  <p className="text-xs text-gray-600">{level.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">All Levels</option>
                  {ENQUIRY_LEVELS.map((level) => (
                    <option key={level.id} value={level.id.toString()}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEnquiries.map((enquiry) => {
                    const levelInfo = getLevelInfo(enquiry.level);
                    return (
                      <tr key={enquiry.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{enquiry.studentName}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {enquiry.email}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {enquiry.phone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{enquiry.cnic || 'Not provided'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{enquiry.course}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${levelInfo.bgColor} ${levelInfo.textColor}`}>
                            {getStatusIcon(enquiry.level)}
                            {levelInfo.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {enquiry.dateCreated}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {enquiry.lastUpdated}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEnquiry(enquiry);
                                setShowDetailsModal(true);
                              }}
                              className="p-2 h-8 w-8"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEnquiry(enquiry);
                                setShowLevelModal(true);
                              }}
                              className="p-2 h-8 w-8"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
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

        {/* Level Update Modal */}
        {showLevelModal && selectedEnquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[9999] pt-20">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Update Enquiry Level
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Student: <span className="font-medium">{selectedEnquiry.studentName}</span>
              </p>
              <div className="space-y-3 mb-6">
                {ENQUIRY_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => handleLevelUpdate(selectedEnquiry.id, level.id)}
                    disabled={updatingLevel}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                      selectedEnquiry.level === level.id
                        ? `${level.bgColor} border-gray-300`
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${level.color}`}></div>
                      <span className="font-medium">{level.name}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{level.description}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLevelModal(false);
                    setSelectedEnquiry(null);
                  }}
                  disabled={updatingLevel}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
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
                    <p className="text-sm text-gray-900">{selectedEnquiry.studentName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                    <p className="text-sm text-gray-900">{selectedEnquiry.course}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-sm text-gray-900">{selectedEnquiry.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-sm text-gray-900">{selectedEnquiry.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Created</label>
                    <p className="text-sm text-gray-900">{selectedEnquiry.dateCreated}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                    <p className="text-sm text-gray-900">{selectedEnquiry.lastUpdated}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Level</label>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getLevelInfo(selectedEnquiry.level).bgColor} ${getLevelInfo(selectedEnquiry.level).textColor}`}>
                    {getStatusIcon(selectedEnquiry.level)}
                    {getLevelInfo(selectedEnquiry.level).name}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedEnquiry.notes}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedEnquiry(null);
                    setShowLevelModal(true);
                  }}
                >
                  Update Level
                </Button>
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
      </div>
    </div>
  );
};

export default EnquiryManagement;
