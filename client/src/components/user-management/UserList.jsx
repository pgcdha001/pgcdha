import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  User,
  Calendar
} from 'lucide-react';
import { Button } from '../ui/button';
import { userAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';
import UserForm from './UserForm';
import DeleteConfirmModal from '../../pages/admin/components/DeleteConfirmModal';
import PermissionGuard from '../PermissionGuard';
import { PERMISSIONS } from '../../utils/rolePermissions';

/**
 * User List Component
 * Displays filtered list of users based on permissions and allowed roles
 */
const UserList = ({ 
  allowedRoles = ['all'], 
  allowedActions = ['view'], 
  restrictedFields = []
}) => {
  const { toast } = useToast();
  const { userRole, can } = usePermissions();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [error, setError] = useState('');

  // Filter role options based on permissions
  const getRoleOptions = () => {
    const baseOptions = [{ value: '', label: 'All Roles' }];
    
    if (allowedRoles.includes('all')) {
      return [
        ...baseOptions,
        { value: 'InstituteAdmin', label: 'Institute Admin' },
        { value: 'Teacher', label: 'Teacher' },
        { value: 'Student', label: 'Student' },
        { value: 'IT', label: 'IT' },
        { value: 'Receptionist', label: 'Receptionist' },
        { value: 'Staff', label: 'Staff' }
      ];
    }
    
    // For specific roles
    const roleMap = {
      'Student': { value: 'Student', label: 'Student' },
      'Teacher': { value: 'Teacher', label: 'Teacher' },
      'IT': { value: 'IT', label: 'IT' },
      'Receptionist': { value: 'Receptionist', label: 'Receptionist' },
      'Staff': { value: 'Staff', label: 'Staff' }
    };
    
    const filteredOptions = allowedRoles
      .filter(role => roleMap[role])
      .map(role => roleMap[role]);
    
    return [...baseOptions, ...filteredOptions];
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'suspended', label: 'Suspended' }
  ];

  // Load users with role-based filtering
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        search: searchTerm,
        role: filterRole,
        status: filterStatus
      };

      // Apply role-based filtering
      if (allowedRoles.includes('Student') && allowedRoles.length === 1) {
        // Receptionist - only students
        params.role = params.role || 'Student';
      } else if (!allowedRoles.includes('all')) {
        // IT or other limited roles
        params.allowedRoles = allowedRoles.join(',');
      }

      console.log('Loading users with params:', params);
      const response = await userAPI.getUsers(params);
      console.log('Users API response:', response);
      
      if (response.success) {
        let userData = response.data.users || [];
        
        // Client-side filtering as backup
        if (!allowedRoles.includes('all')) {
          userData = userData.filter(user => allowedRoles.includes(user.role));
        }
        
        setUsers(userData);
        console.log('Users loaded successfully:', userData.length);
      } else {
        setError(response.message || 'Failed to load users');
        console.error('Failed to load users:', response.message);
      }
    } catch (err) {
      setError('Failed to load users. Please try again.');
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterRole, filterStatus, allowedRoles]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle user actions based on permissions
  const handleAddUser = () => {
    if (!allowedActions.includes('create') || !can(PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT)) {
      toast.error('You don\'t have permission to add users');
      return;
    }
    setSelectedUser(null);
    setModalMode('create');
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    if (!allowedActions.includes('edit') || !can(PERMISSIONS.USER_MANAGEMENT.EDIT_USERS)) {
      toast.error('You don\'t have permission to edit users');
      return;
    }
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
    if (!allowedActions.includes('delete') || !can(PERMISSIONS.USER_MANAGEMENT.DELETE_USERS)) {
      toast.error('You don\'t have permission to delete users');
      return;
    }
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await userAPI.deleteUser(selectedUser._id);
      if (response.success) {
        toast.success('User deleted successfully');
        loadUsers();
      } else {
        toast.error(response.message || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user');
      console.error('Delete error:', error);
    } finally {
      setShowDeleteModal(false);
      setSelectedUser(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      suspended: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const statusInfo = statusMap[status] || statusMap.active;
    const IconComponent = statusInfo.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        <IconComponent className="h-3 w-3" />
        {status || 'active'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <span className="text-primary font-medium">Loading users...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-8">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-primary font-[Sora,Inter,sans-serif] flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full"></div>
          {userRole === 'Receptionist' ? 'Student List' : 'User List'}
        </h3>
        
        <PermissionGuard 
          condition={() => allowedActions.includes('create') && can(PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT)}
          fallback={null}
        >
          <Button
            onClick={handleAddUser}
            className="bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {userRole === 'Receptionist' ? 'Add Student' : 'Add User'}
          </Button>
        </PermissionGuard>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {getRoleOptions().map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        {user.phoneNumber || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <PermissionGuard 
                        condition={() => allowedActions.includes('edit') && can(PERMISSIONS.USER_MANAGEMENT.EDIT_USERS)}
                        fallback={null}
                      >
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </PermissionGuard>
                      
                      <PermissionGuard 
                        condition={() => allowedActions.includes('delete') && can(PERMISSIONS.USER_MANAGEMENT.DELETE_USERS)}
                        fallback={null}
                      >
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-12 text-center">
                  <div className="text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No users found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserForm
          user={selectedUser}
          mode={modalMode}
          allowedRoles={allowedRoles}
          restrictedFields={restrictedFields}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onSave={() => {
            setShowUserModal(false);
            setSelectedUser(null);
            loadUsers();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Delete User"
          message={`Are you sure you want to delete ${selectedUser.firstName} ${selectedUser.lastName}? This action cannot be undone.`}
        />
      )}
    </div>
  );
};

export default UserList;
