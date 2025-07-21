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
  Calendar,
  Download,
  Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '../ui/button';
import { userAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../hooks/useAuth';
import UserForm from './UserForm';
import StudentImport from './StudentImport';
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
  restrictedFields = [],
  defaultFilter = ''
}) => {
  const { toast } = useToast();
  const { userRole, can } = usePermissions();
  const { user } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState(defaultFilter);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
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
        // Receptionist or Coordinator - only students
        params.role = params.role || 'Student';
        
        // For Coordinator role, add specific filtering
        if (userRole === 'Coordinator' && user?.coordinatorAssignment) {
          params.enquiryLevel = 5; // Only admitted students
          params.grade = user.coordinatorAssignment.grade; // 11th or 12th
          params.campus = user.coordinatorAssignment.campus; // Boys or Girls
        }
      } else if (!allowedRoles.includes('all')) {
        // IT or other limited roles
        params.allowedRoles = allowedRoles.join(',');
      }

      console.log('Loading users with params:', params);
      const response = await userAPI.getUsers(params);
      console.log('Users API response:', response);
      console.log('Raw users data:', response.data?.users);
      
      if (response.success) {
        let userData = response.data.users || [];
        console.log('Users before client filtering:', userData.length, userData.map(u => ({id: u._id, name: u.fullName || u.firstName, role: u.role, status: u.status})));
        
        // Client-side filtering as backup
        if (!allowedRoles.includes('all')) {
          userData = userData.filter(user => allowedRoles.includes(user.role));
        }
        
        setUsers(userData);
        console.log('Users after client filtering:', userData.length, userData.map(u => ({id: u._id, name: u.fullName || u.firstName, role: u.role, status: u.status})));
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
  }, [searchTerm, filterRole, filterStatus, allowedRoles, userRole, user?.coordinatorAssignment]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Update filter when defaultFilter changes
  useEffect(() => {
    if (defaultFilter !== filterRole) {
      setFilterRole(defaultFilter);
    }
  }, [defaultFilter, filterRole]);

  // Update filter when defaultFilter changes
  useEffect(() => {
    if (defaultFilter) {
      setFilterRole(defaultFilter);
    }
  }, [defaultFilter]);

  // Handle user actions based on permissions
  const handleAddUser = () => {
    const canCreateUser = can(PERMISSIONS.USER_MANAGEMENT.ADD_ANY_USER) ||
                         can(PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT) ||
                         can(PERMISSIONS.USER_MANAGEMENT.ADD_TEACHER) ||
                         can(PERMISSIONS.USER_MANAGEMENT.ADD_STAFF);
    
    if (!allowedActions.includes('create') || !canCreateUser) {
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
      console.error('Delete error:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        // Optionally redirect to login
        // window.location.href = '/login';
      } else if (error.response?.status === 404) {
        toast.error('User not found. They may have already been deleted.');
        loadUsers(); // Refresh the list
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Cannot delete user');
      } else {
        toast.error(error.message || 'Failed to delete user');
      }
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

  // Export users to Excel
  const handleExportUsers = () => {
    if (users.length === 0) {
      toast.error('No users to export');
      return;
    }

    const isStudentOnly = allowedRoles.includes('Student') && allowedRoles.length === 1;
    
    let excelData;
    if (isStudentOnly) {
      // Student-specific export with all fields
      excelData = users.map((user, idx) => ({
        '#': idx + 1,
        'Student Name': user.firstName || '',
        'Father Name': user.fatherName || '',
        'CNIC': user.cnic || '',
        'Gender': user.gender || '',
        'Phone Number': user.phoneNumber || '',
        'Mobile Number': user.mobileNumber || '',
        'Email': user.email || '',
        'Date of Birth': user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '',
        'Address': user.address || '',
        'Reference': user.reference || '',
        'Program': user.program || '',
        'Status': user.status || 'active',
        'Registration Date': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
        'Last Updated': user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : ''
      }));
    } else {
      // General user export
      excelData = users.map((user, idx) => ({
        '#': idx + 1,
        'First Name': user.firstName || '',
        'Last Name': user.lastName || '',
        'Email': user.email || '',
        'Phone Number': user.phoneNumber || '',
        'Role': user.role || '',
        'Status': user.status || 'active',
        'Date of Birth': user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '',
        'Address': user.address || '',
        'Emergency Contact': user.emergencyContact || '',
        'Registration Date': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
        'Last Updated': user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : ''
      }));
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = isStudentOnly ? [
      { wch: 5 },   // #
      { wch: 20 },  // Student Name
      { wch: 20 },  // Father Name
      { wch: 15 },  // CNIC
      { wch: 10 },  // Gender
      { wch: 15 },  // Phone Number
      { wch: 15 },  // Mobile Number
      { wch: 30 },  // Email
      { wch: 12 },  // Date of Birth
      { wch: 30 },  // Address
      { wch: 20 },  // Reference
      { wch: 20 },  // Program
      { wch: 10 },  // Status
      { wch: 15 },  // Registration Date
      { wch: 15 }   // Last Updated
    ] : [
      { wch: 5 },   // #
      { wch: 15 },  // First Name
      { wch: 15 },  // Last Name
      { wch: 30 },  // Email
      { wch: 15 },  // Phone Number
      { wch: 15 },  // Role
      { wch: 10 },  // Status
      { wch: 12 },  // Date of Birth
      { wch: 30 },  // Address
      { wch: 20 },  // Emergency Contact
      { wch: 15 },  // Registration Date
      { wch: 15 }   // Last Updated
    ];
    
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    const sheetName = isStudentOnly ? 'Students' : 'Users';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `${isStudentOnly ? 'students' : 'users'}_export_${currentDate}.xlsx`;

    // Save the file
    XLSX.writeFile(workbook, filename);
    
    // Show success toast
    toast.success(`${isStudentOnly ? 'Students' : 'Users'} exported successfully`);
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
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportUsers}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          
          <PermissionGuard 
            condition={() => {
              const canCreateUser = can(PERMISSIONS.USER_MANAGEMENT.ADD_ANY_USER) ||
                                   can(PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT) ||
                                   can(PERMISSIONS.USER_MANAGEMENT.ADD_TEACHER) ||
                                   can(PERMISSIONS.USER_MANAGEMENT.ADD_STAFF);
              return allowedActions.includes('create') && canCreateUser;
            }}
            fallback={null}
          >
            <div className="flex gap-2">
              <Button
                onClick={handleAddUser}
                className="bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {userRole === 'Receptionist' ? 'Add Student' : 'Add User'}
              </Button>
              
              {/* Import Students Button - Only for IT and Institute Admin */}
              {(userRole === 'IT' || userRole === 'InstituteAdmin') && (allowedRoles.includes('Student') || allowedRoles.includes('all')) && (
                <Button
                  onClick={() => setShowImportModal(true)}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import Students
                </Button>
              )}
            </div>
          </PermissionGuard>
        </div>
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
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                {allowedRoles.includes('Student') && allowedRoles.length === 1 ? 'Student' : 'User'}
              </th>
              {allowedRoles.includes('Student') && allowedRoles.length === 1 ? (
                <>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Program</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Gender</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                </>
              ) : (
                <>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                </>
              )}
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-xl opacity-70" />
                        <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110">
                          <User className="h-5 w-5 text-white animate-float" />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {user.role === 'Student' ? 
                            `${user.fullName?.firstName || user.firstName || ''} ${user.fullName?.lastName || user.lastName || ''}`.trim() : 
                            `${user.fullName?.firstName || user.firstName || ''} ${user.fullName?.lastName || user.lastName || ''}`.trim()
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          {user.role === 'Student' && user.fatherName ? `Father: ${user.fatherName}` : user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  {allowedRoles.includes('Student') && allowedRoles.length === 1 ? (
                    // Student-specific columns
                    <>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {user.program || 'Not Set'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {user.gender || 'Not Set'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {user.phoneNumber || 'N/A'}
                        </div>
                      </td>
                    </>
                  ) : (
                    // Non-student columns
                    <>
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
                    </>
                  )}
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
          user={selectedUser}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
        />
      )}

      {/* Student Import Modal */}
      {showImportModal && (
        <StudentImport
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            loadUsers(); // Refresh the user list after successful import
            toast.success('Student import completed successfully!');
          }}
        />
      )}
    </div>
  );
};

export default UserList;
