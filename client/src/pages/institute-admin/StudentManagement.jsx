import React, { useState, useEffect, useCallback } from 'react';
import { 
  GraduationCap, 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  User,
  Calendar,
  BookOpen,
  Users,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { userAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import UserModal from '../admin/components/UserModal';
import DeleteConfirmModal from '../admin/components/DeleteConfirmModal';
import * as XLSX from 'xlsx';

const StudentManagement = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [error, setError] = useState('');

  // Sample classes - replace with actual class data
  const classOptions = [
    { value: '', label: 'All Classes' },
    { value: 'CS-1A', label: 'CS-1A' },
    { value: 'CS-1B', label: 'CS-1B' },
    { value: 'CS-2A', label: 'CS-2A' },
    { value: 'CS-2B', label: 'CS-2B' },
    { value: 'CS-3A', label: 'CS-3A' },
    { value: 'CS-3B', label: 'CS-3B' },
    { value: 'BBA-1A', label: 'BBA-1A' },
    { value: 'BBA-1B', label: 'BBA-1B' },
    { value: 'BBA-2A', label: 'BBA-2A' },
    { value: 'BBA-2B', label: 'BBA-2B' },
    { value: 'ENG-1A', label: 'ENG-1A' },
    { value: 'ENG-2A', label: 'ENG-2A' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'graduated', label: 'Graduated' }
  ];

  // Load students only
  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        search: searchTerm,
        role: 'Student', // Only get students
        status: filterStatus
      };

      console.log('Loading students with params:', params);
      const response = await userAPI.getUsers(params);
      console.log('Students API response:', response);
      
      if (response.success) {
        // Filter students only as backup
        const studentData = (response.data.users || []).filter(user => 
          user.role === 'Student'
        );
        setStudents(studentData);
        console.log('Students loaded successfully:', studentData.length);
      } else {
        setError(response.message || 'Failed to load students');
        console.error('Failed to load students:', response.message);
      }
    } catch (err) {
      setError('Failed to load students. Please try again.');
      console.error('Load students error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setModalMode('create');
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setModalMode('edit');
    setShowUserModal(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setModalMode('view');
    setShowUserModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleUserDeleted = () => {
    const studentName = selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Student';
    toast.studentDeleted(studentName);
    setShowDeleteModal(false);
    loadStudents(); // Refresh the list
  };

  const exportStudentData = () => {
    // Prepare student data for Excel export
    const excelData = filteredStudents.map((s, idx) => ({
      '#': idx + 1,
      'Name': `${s.fullName?.firstName || ''} ${s.fullName?.lastName || ''}`.trim(),
      'Username': s.username || s.userName || '',
      'CNIC': s.cnic || '',
      'Email': s.email || '',
      'Primary Phone': s.phoneNumbers?.primary || s.phoneNumber || '',
      'Secondary Phone': s.phoneNumbers?.secondary || s.secondaryPhone || '',
      'Address': s.address || '',
      'Reference': s.reference || '',
      'Previous School': s.oldSchoolName || s.previousSchool || '',
      'Gender': s.gender || '',
      'Date of Birth': s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : '',
      'Class': s.academicInfo?.classId || '',
      'Session': s.academicInfo?.session || '',
      'Status': s.isActive && s.isApproved && !s.isPassedOut ? 'Active' :
                !s.isActive ? 'Inactive' :
                !s.isApproved ? 'Pending' :
                s.isPassedOut ? 'Graduated' : 'Unknown',
      'Registration Date': s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '',
      'Last Updated': s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : ''
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 5 },   // #
      { wch: 25 },  // Name
      { wch: 15 },  // Username
      { wch: 15 },  // CNIC
      { wch: 30 },  // Email
      { wch: 15 },  // Primary Phone
      { wch: 15 },  // Secondary Phone
      { wch: 30 },  // Address
      { wch: 20 },  // Reference
      { wch: 25 },  // Previous School
      { wch: 10 },  // Gender
      { wch: 12 },  // Date of Birth
      { wch: 15 },  // Class
      { wch: 12 },  // Session
      { wch: 12 },  // Status
      { wch: 15 },  // Registration Date
      { wch: 15 }   // Last Updated
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `student_management_report_${currentDate}.xlsx`;

    // Save the file
    XLSX.writeFile(workbook, filename);
    
    // Show success toast
    toast.dataExported('Student Management Report (Excel)');
  };

  const getStatusBadge = (user) => {
    if (!user.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </span>
      );
    }
    if (!user.isApproved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending
        </span>
      );
    }
    if (user.isPassedOut) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <GraduationCap className="w-3 h-3 mr-1" />
          Graduated
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    );
  };

  const getClassBadge = (classId) => {
    if (!classId) return <span className="text-xs text-gray-400">No Class</span>;
    
    const bgColor = classId.startsWith('CS') ? 'bg-blue-100 text-blue-800' :
                   classId.startsWith('BBA') ? 'bg-green-100 text-green-800' :
                   classId.startsWith('ENG') ? 'bg-purple-100 text-purple-800' :
                   'bg-gray-100 text-gray-800';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {classId}
      </span>
    );
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.fullName?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.academicInfo?.classId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === '' || student.academicInfo?.classId === filterClass;
    const matchesStatus = filterStatus === '' || 
      (filterStatus === 'active' && student.isActive && student.isApproved && !student.isPassedOut) ||
      (filterStatus === 'inactive' && !student.isActive) ||
      (filterStatus === 'pending' && student.isActive && !student.isApproved) ||
      (filterStatus === 'graduated' && student.isPassedOut);
    
    return matchesSearch && matchesClass && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-[Sora,Inter,sans-serif]">
                Student Management
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage student records and information
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.isActive && s.isApproved && !s.isPassedOut).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.isActive && !s.isApproved).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GraduationCap className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Graduated</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.isPassedOut).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students by name, email, or class..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="sm:w-40">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    {classOptions.map((classOption) => (
                      <option key={classOption.value} value={classOption.value}>
                        {classOption.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="sm:w-40">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={exportStudentData}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button
                onClick={handleCreateUser}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Students ({filteredStudents.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No students found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.fullName?.firstName} {student.fullName?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{student.username || student.userName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getClassBadge(student.academicInfo?.classId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1 mb-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {student.email}
                          </div>
                          {(student.phoneNumbers?.primary || student.phoneNumber) && (
                            <div className="flex items-center gap-1 mb-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {student.phoneNumbers?.primary || student.phoneNumber}
                            </div>
                          )}
                          {(student.phoneNumbers?.secondary || student.secondaryPhone) && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="h-3 w-3 text-gray-400" />
                              Secondary: {student.phoneNumbers?.secondary || student.secondaryPhone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(student)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.academicInfo?.session || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewUser(student)}
                            className="p-2 h-8 w-8"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(student)}
                            className="p-2 h-8 w-8"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(student)}
                            className="p-2 h-8 w-8 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Modal */}
        {showUserModal && (
          <UserModal
            isOpen={showUserModal}
            onClose={() => {
              setShowUserModal(false);
              setSelectedUser(null);
              setModalMode('create');
            }}
            onSave={() => {
              const studentName = selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Student';
              if (modalMode === 'create') {
                toast.studentAdded(studentName);
              } else if (modalMode === 'edit') {
                toast.studentUpdated(studentName);
              }
              loadStudents();
              setShowUserModal(false);
              setSelectedUser(null);
              setModalMode('create');
            }}
            user={selectedUser}
            mode={modalMode}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedUser && (
          <DeleteConfirmModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
            onConfirm={() => {
              handleUserDeleted();
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
          />
        )}
      </div>
    </div>
  );
};

export default StudentManagement;
