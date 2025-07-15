import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { userAPI } from '../../../services/api';
import UserModal from './UserModal';
import DeleteConfirmModal from './DeleteConfirmModal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [error, setError] = useState('');
  
  const usersPerPage = 10;

  const roles = [
    { value: '', label: 'All Roles' },
    { value: 'Super Admin', label: 'Super Admin' },
    { value: 'College Admin', label: 'College Admin' },
    { value: 'Academic Admin', label: 'Academic Admin' },
    { value: 'Teacher', label: 'Teacher' },
    { value: 'Student', label: 'Student' },
    { value: 'Finance Admin', label: 'Finance Admin' },
    { value: 'Receptionist', label: 'Receptionist' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'suspended', label: 'Suspended' }
  ];

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: currentPage,
        limit: usersPerPage,
        search: searchTerm,
        role: filterRole,
        status: filterStatus
      };

      console.log('Loading users with params:', params);
      const response = await userAPI.getUsers(params);
      console.log('Users API response:', response);
      
      if (response.success) {
        setUsers(response.data.users || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalUsers(response.data.pagination?.totalUsers || 0);
        console.log('Users loaded successfully:', response.data.users?.length || 0);
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
  }, [currentPage, searchTerm, filterRole, filterStatus]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

  const handleUserSaved = () => {
    setShowUserModal(false);
    loadUsers(); // Refresh the list
  };

  const handleUserDeleted = () => {
    setShowDeleteModal(false);
    loadUsers(); // Refresh the list
  };

  const getStatusBadge = (user) => {
    // If user is not approved, show pending regardless of active status
    if (!user.isApproved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending Approval
        </span>
      );
    }
    
    // If approved and active
    if (user.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    }
    
    // If approved but inactive
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.fullName?.firstName} ${user.fullName?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !filterRole || user.role === filterRole;
    
    const matchesStatus = !filterStatus || 
      (filterStatus === 'active' && user.isActive && user.isApproved) ||
      (filterStatus === 'inactive' && !user.isActive) ||
      (filterStatus === 'pending' && !user.isApproved) ||
      (filterStatus === 'suspended' && user.isSuspended);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">
            Manage all users in the system ({totalUsers} total)
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </Button>
          <Button
            onClick={handleCreateUser}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Role Filter */}
          <div className="sm:w-48">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2 text-gray-500">Loading users...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || filterRole || filterStatus 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Get started by creating a new user.'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-700">
                              {user.fullName?.firstName?.[0]}{user.fullName?.lastName?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullName?.firstName} {user.fullName?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phoneNumbers?.primary}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewUser(user)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {((currentPage - 1) * usersPerPage) + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * usersPerPage, totalUsers)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{totalUsers}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="rounded-r-none"
                  >
                    Previous
                  </Button>
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="rounded-none"
                        >
                          {page}
                        </Button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-l-none"
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={selectedUser}
          mode={modalMode}
          onClose={() => setShowUserModal(false)}
          onSave={handleUserSaved}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          user={selectedUser}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleUserDeleted}
        />
      )}
    </div>
  );
};

export default UserManagement;
