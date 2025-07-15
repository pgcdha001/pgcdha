import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, Shield, Save, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { userAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionGuard from '../PermissionGuard';
import { PERMISSIONS } from '../../utils/rolePermissions';

/**
 * User Form Component
 * Form for adding/editing users with role-based field visibility
 */
const UserForm = ({ 
  user = null, 
  mode = 'create', 
  allowedRoles = ['all'],
  restrictedFields = [],
  onClose, 
  onSave 
}) => {
  const { toast } = useToast();
  const { userRole, can } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    status: 'active'
  });

  const [errors, setErrors] = useState({});

  // Initialize form data
  useEffect(() => {
    if (user && mode !== 'create') {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        role: user.role || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || '',
        status: user.status || 'active'
      });
    } else {
      // For create mode, set default role based on permissions
      const defaultRole = userRole === 'Receptionist' ? 'Student' : '';
      setFormData(prev => ({ ...prev, role: defaultRole }));
    }
  }, [user, mode, userRole]);

  // Get available roles based on permissions
  const getAvailableRoles = () => {
    if (allowedRoles.includes('all')) {
      return [
        { value: '', label: 'Select Role' },
        { value: 'Student', label: 'Student' },
        { value: 'Teacher', label: 'Teacher' },
        { value: 'IT', label: 'IT' },
        { value: 'Receptionist', label: 'Receptionist' },
        { value: 'Staff', label: 'Staff' },
        { value: 'InstituteAdmin', label: 'Institute Admin' }
      ];
    }

    // For limited roles
    const roleMap = {
      'Student': { value: 'Student', label: 'Student' },
      'Teacher': { value: 'Teacher', label: 'Teacher' },
      'IT': { value: 'IT', label: 'IT' },
      'Receptionist': { value: 'Receptionist', label: 'Receptionist' },
      'Staff': { value: 'Staff', label: 'Staff' }
    };

    const availableRoles = [{ value: '', label: 'Select Role' }];
    allowedRoles.forEach(role => {
      if (roleMap[role]) {
        availableRoles.push(roleMap[role]);
      }
    });

    return availableRoles;
  };

  // Check if field should be shown
  const shouldShowField = (fieldName) => {
    if (restrictedFields.includes(fieldName)) {
      return false;
    }
    
    // For receptionist, hide role field if only Student is allowed
    if (fieldName === 'role' && userRole === 'Receptionist' && allowedRoles.length === 1 && allowedRoles[0] === 'Student') {
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate permissions
    if (mode === 'create' && !can(PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT)) {
      toast.error('You don\'t have permission to create users');
      return;
    }
    
    if (mode === 'edit' && !can(PERMISSIONS.USER_MANAGEMENT.EDIT_USERS)) {
      toast.error('You don\'t have permission to edit users');
      return;
    }

    // Validate form
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.role && shouldShowField('role')) newErrors.role = 'Role is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      let response;
      const submitData = { ...formData };
      
      // Set default role for receptionist if not shown
      if (!shouldShowField('role') && userRole === 'Receptionist') {
        submitData.role = 'Student';
      }

      if (mode === 'create') {
        response = await userAPI.createUser(submitData);
      } else if (mode === 'edit') {
        response = await userAPI.updateUser(user._id, submitData);
      }

      if (response.success) {
        toast.success(`User ${mode === 'create' ? 'created' : 'updated'} successfully`);
        onSave();
      } else {
        toast.error(response.message || `Failed to ${mode} user`);
      }
    } catch (error) {
      console.error(`${mode} user error:`, error);
      toast.error(`Failed to ${mode} user. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const isReadOnly = mode === 'view';
  const availableRoles = getAvailableRoles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${
              mode === 'create' ? 'bg-green-100 text-green-600' :
              mode === 'edit' ? 'bg-blue-100 text-blue-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              {mode === 'view' ? <Eye className="h-5 w-5" /> : <User className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {mode === 'create' && (userRole === 'Receptionist' ? 'Add New Student' : 'Add New User')}
                {mode === 'edit' && 'Edit User'}
                {mode === 'view' && 'User Details'}
              </h2>
              <p className="text-sm text-gray-600">
                {mode === 'create' && 'Fill in the details to create a new user'}
                {mode === 'edit' && 'Update user information'}
                {mode === 'view' && 'View user information'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  readOnly={isReadOnly}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  placeholder="Enter first name"
                />
              </div>
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  readOnly={isReadOnly}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  placeholder="Enter last name"
                />
              </div>
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  readOnly={isReadOnly}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  placeholder="Enter email address"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  readOnly={isReadOnly}
                  className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    isReadOnly ? 'bg-gray-50' : ''
                  }`}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Role - Show only if allowed */}
            {shouldShowField('role') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.role ? 'border-red-300' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  >
                    {availableRoles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
              </div>
            )}

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  readOnly={isReadOnly}
                  className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    isReadOnly ? 'bg-gray-50' : ''
                  }`}
                />
              </div>
            </div>

            {/* Status - Only for edit mode and if allowed */}
            {mode !== 'create' && !restrictedFields.includes('status') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    isReadOnly ? 'bg-gray-50' : ''
                  }`}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            )}
          </div>

          {/* Address - Full width */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              readOnly={isReadOnly}
              rows="3"
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                isReadOnly ? 'bg-gray-50' : ''
              }`}
              placeholder="Enter address"
            />
          </div>

          {/* Emergency Contact */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Contact
            </label>
            <input
              type="text"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleInputChange}
              readOnly={isReadOnly}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                isReadOnly ? 'bg-gray-50' : ''
              }`}
              placeholder="Enter emergency contact"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-6"
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            
            {!isReadOnly && (
              <PermissionGuard 
                condition={() => 
                  (mode === 'create' && can(PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT)) ||
                  (mode === 'edit' && can(PERMISSIONS.USER_MANAGEMENT.EDIT_USERS))
                }
                fallback={null}
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg transition-all duration-200 px-6 flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {loading ? 'Saving...' : (mode === 'create' ? 'Create User' : 'Save Changes')}
                </Button>
              </PermissionGuard>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
