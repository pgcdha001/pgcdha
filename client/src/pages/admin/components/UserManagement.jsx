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
    <div className="h-full flex flex-col overflow-hidden font-[Inter,sans-serif]">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-border/30 mb-4 transition-all duration-300 hover:shadow-xl hover:bg-white/70" style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)'}}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/90 to-accent/80 text-white shadow-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary font-[Sora,Inter,sans-serif] mb-1">User Management</h2>
              <p className="text-sm text-muted-foreground font-medium">
                Manage all users in the system ({totalUsers} total)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 px-3 py-2 text-sm border-border/50 hover:bg-white/50 hover:border-primary/30"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 px-3 py-2 text-sm border-border/50 hover:bg-white/50 hover:border-primary/30"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </Button> */}
            <Button
              onClick={handleCreateUser}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-3 py-2 text-sm shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 bg-white/60 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-border/30 mb-4 transition-all duration-300 hover:shadow-xl hover:bg-white/70" style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)'}}>
        <h3 className="text-sm font-bold text-primary mb-3 font-[Sora,Inter,sans-serif] flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-primary to-accent rounded-full"></div>
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
            />
          </div>
          
          {/* Role Filter */}
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
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
        <div className="flex-shrink-0 bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 px-4 py-3 rounded-2xl mb-4 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            {error}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="flex-1 overflow-hidden bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 transition-all duration-300 hover:shadow-xl hover:bg-white/70" style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)'}}>
        <div className="h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <table className="min-w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-primary to-accent text-white">
                  <th className="px-4 py-3 text-left text-sm font-bold">User</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Contact</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-border/30">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <span className="text-primary font-medium text-sm">Loading users...</span>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-white/70 transition-all duration-200">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-primary text-xs border-2 border-primary/20">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.fullName?.firstName} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <span>{user.initials || user.fullName?.firstName?.[0] || '?'}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-primary text-sm">{user.fullName?.firstName} {user.fullName?.lastName}</div>
                        <div className="text-muted-foreground text-xs">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-primary font-medium text-sm">{user.email}</div>
                    <div className="text-muted-foreground text-xs">{user.phone}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground font-medium text-sm">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewUser(user)}
                        className="text-primary hover:bg-primary/10 rounded-lg h-8 w-8"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUser(user)}
                        className="text-accent hover:bg-accent/10 rounded-lg h-8 w-8"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-500 hover:bg-red-100 rounded-lg h-8 w-8"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Full-Screen Modals */}
      {showUserModal && (
        <UserModal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
            setModalMode('create');
          }}
          onUserCreated={() => {
            loadUsers();
            setShowUserModal(false);
            setSelectedUser(null);
            setModalMode('create');
          }}
          user={selectedUser}
          mode={modalMode}
        />
      )}

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
  );
};

export default UserManagement;
