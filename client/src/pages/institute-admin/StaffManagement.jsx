import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
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
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { userAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import UserModal from '../admin/components/UserModal';
import DeleteConfirmModal from '../admin/components/DeleteConfirmModal';

const StaffManagement = () => {
  const { toast } = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [error, setError] = useState('');

  // Staff-specific roles (excluding students and system admin)
  const staffRoles = [
    { value: '', label: 'All Staff Roles' },
    { value: 'InstituteAdmin', label: 'Institute Admin' },
    { value: 'Teacher', label: 'Teacher' },
    { value: 'HOD', label: 'HOD' },
    { value: 'SRO', label: 'SRO' },
    { value: 'CampusCoordinator', label: 'Campus Coordinator' },
    { value: 'EMS', label: 'EMS' },
    { value: 'Accounts', label: 'Accounts' },
    { value: 'IT', label: 'IT' },
    { value: 'StoreKeeper', label: 'Store Keeper' },
    { value: 'LabAssistant', label: 'Lab Assistant' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'suspended', label: 'Suspended' }
  ];

  // Load staff (exclude students and system admin)
  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        search: searchTerm,
        role: filterRole,
        status: filterStatus,
        excludeRoles: 'Student' // Exclude students only
      };

      console.log('Loading staff with params:', params);
      const response = await userAPI.getUsers(params);
      console.log('Staff API response:', response);
      
      if (response.success) {
        // Filter staff roles on client side as backup
        const staffData = (response.data.users || []).filter(user => 
          user.role !== 'Student'
        );
        setStaff(staffData);
        console.log('Staff loaded successfully:', staffData.length);
      } else {
        setError(response.message || 'Failed to load staff');
        console.error('Failed to load staff:', response.message);
      }
    } catch (err) {
      setError('Failed to load staff. Please try again.');
      console.error('Load staff error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterRole, filterStatus]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

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
    const staffName = selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Staff member';
    toast.staffDeleted(staffName);
    setShowDeleteModal(false);
    loadStaff(); // Refresh the list
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
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      'InstituteAdmin': 'bg-purple-100 text-purple-800',
      'Teacher': 'bg-blue-100 text-blue-800',
      'HOD': 'bg-indigo-100 text-indigo-800',
      'SRO': 'bg-teal-100 text-teal-800',
      'CampusCoordinator': 'bg-cyan-100 text-cyan-800',
      'EMS': 'bg-orange-100 text-orange-800',
      'Accounts': 'bg-green-100 text-green-800',
      'IT': 'bg-gray-100 text-gray-800',
      'StoreKeeper': 'bg-yellow-100 text-yellow-800',
      'LabAssistant': 'bg-pink-100 text-pink-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.fullName?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.fullName?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === '' || member.role === filterRole;
    const matchesStatus = filterStatus === '' || 
      (filterStatus === 'active' && member.isActive && member.isApproved) ||
      (filterStatus === 'inactive' && !member.isActive) ||
      (filterStatus === 'pending' && member.isActive && !member.isApproved);
    
    return matchesSearch && matchesRole && matchesStatus;
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
                Staff Management
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage faculty and staff members
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

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search staff by name, email, or role..."
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
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    {staffRoles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
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
            <Button
              onClick={handleCreateUser}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add Staff Member
            </Button>
          </div>
        </div>

        {/* Staff List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Staff Members ({filteredStaff.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading staff...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No staff members found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStaff.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.fullName?.firstName} {member.fullName?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{member.username || member.userName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(member.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1 mb-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {member.email}
                          </div>
                          {member.phoneNumbers?.primary && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {member.phoneNumbers.primary}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(member)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewUser(member)}
                            className="p-2 h-8 w-8"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(member)}
                            className="p-2 h-8 w-8"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(member)}
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
              const staffName = selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Staff member';
              const role = selectedUser?.role || 'Staff';
              if (modalMode === 'create') {
                toast.staffAdded(staffName, role);
              } else if (modalMode === 'edit') {
                toast.staffUpdated(staffName);
              }
              loadStaff();
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

export default StaffManagement;
