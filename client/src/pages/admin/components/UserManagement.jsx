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
    <div className="p-2 sm:p-4 md:p-6 w-full max-w-full font-[Inter,sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary font-[Sora,Inter,sans-serif]">User Management</h2>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm">
            Manage all users in the system ({totalUsers} total)
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-xs px-2 py-1"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-xs px-2 py-1"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </Button>
          <Button
            onClick={handleCreateUser}
            className="flex items-center gap-1 bg-primary hover:bg-accent text-xs px-2 py-1"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-2 sm:p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
            />
          </div>
          
          {/* Role Filter */}
          <div className="sm:w-36">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Status Filter */}
          <div className="sm:w-36">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
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
      <div className="overflow-x-auto bg-white rounded-lg shadow border w-full">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">User</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Contact</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Role</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Status</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Created</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
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
                <td colSpan={6} className="px-2 py-8 text-center text-gray-400 text-base">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition">
                  <td className="px-2 py-2 whitespace-nowrap flex items-center gap-2 text-xs">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName?.firstName} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <span>{user.initials || user.fullName?.firstName?.[0] || '?'}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-xs">{user.fullName?.firstName} {user.fullName?.lastName}</div>
                      <div className="text-gray-500 text-xs">@{user.username}</div>
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-700 text-xs">
                    <div className="truncate max-w-[120px]">{user.email}</div>
                    <div className="text-xs text-gray-400 truncate max-w-[100px]">{user.phone}</div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span className="inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 font-medium truncate max-w-[80px]">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-500 text-xs">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-right text-xs font-medium flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewUser(user)}
                      className="text-primary hover:bg-primary/10"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditUser(user)}
                      className="text-accent hover:bg-accent/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(user)}
                      className="text-red-500 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
