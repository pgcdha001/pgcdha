import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, Shield, Save, Eye, CreditCard } from 'lucide-react';
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
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fatherName: '',
    cnic: '',
    gender: '',
    email: '',
    password: '',
    phoneNumber: '',
    secondaryPhone: '',  // Updated from mobileNumber
    role: '',
    program: '',
    dateOfBirth: '',
    address: '',
    reference: '',
    emergencyContact: '',
    matricMarks: '',     // Updated from matriculationObtainedMarks
    matricTotal: '',     // Updated from matriculationTotalMarks
    status: 'active',
    enquiryLevel: 1,     // New field for enquiry levels
    admissionInfo: {     // Additional info for Level 5 students
      grade: '',
      className: ''
    }
  });

  const [errors, setErrors] = useState({});

  // Load classes for Level 5 students
  const loadClasses = async () => {
    try {
      const response = await userAPI.get('/classes');
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  // Initialize form data
  useEffect(() => {
    // Load classes when component mounts
    loadClasses();
    
    if (user && mode !== 'create') {
      setFormData({
        firstName: user.fullName?.firstName || user.firstName || '',
        lastName: user.fullName?.lastName || user.lastName || '',
        fatherName: user.fatherName || '',
        cnic: user.cnic || '',
        gender: user.gender || '',
        email: user.email || '',
        password: '', // Don't prefill password for security
        phoneNumber: user.phoneNumber || user.phoneNumbers?.primary || '',
        secondaryPhone: user.secondaryPhone || user.mobileNumber || user.phoneNumbers?.secondary || '',
        role: user.role || '',
        program: user.program || '',
        dateOfBirth: user.dateOfBirth || user.dob ? new Date(user.dateOfBirth || user.dob).toISOString().split('T')[0] : '',
        address: user.address || '',
        reference: user.reference || '',
        emergencyContact: user.emergencyContact?.phone || user.emergencyContact || '',
        matricMarks: user.matricMarks || user.matriculationObtainedMarks || '',
        matricTotal: user.matricTotal || user.matriculationTotalMarks || '',
        status: user.status === 1 ? 'active' : user.status === 2 ? 'inactive' : 'pending',
        enquiryLevel: user.enquiryLevel || 1,
        admissionInfo: {
          grade: user.admissionInfo?.grade || '',
          className: user.admissionInfo?.className || ''
        }
      });
    } else {
      // For create mode, set default role based on permissions
      const defaultRole = (userRole === 'Receptionist' || userRole === 'IT') ? 'Student' : '';
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
        { value: 'Coordinator', label: 'Coordinator' },
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
      'Coordinator': { value: 'Coordinator', label: 'Coordinator' },
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

  // Get available programs for students
  const getAvailablePrograms = () => {
    return [
      { value: '', label: 'Select Program' },
      { value: 'ICS', label: 'ICS (Computer Science)' },
      { value: 'ICOM', label: 'ICOM (Commerce)' },
      { value: 'Pre Engineering', label: 'Pre Engineering' },
      { value: 'Pre Medical', label: 'Pre Medical' }
    ];
  };

  // Check if current role is student
  const isStudentRole = () => {
    return formData.role === 'Student' || (userRole === 'Receptionist' && allowedRoles.includes('Student'));
  };

  // Check if user can create users
  const canCreateUser = () => {
    return can(PERMISSIONS.USER_MANAGEMENT.ADD_ANY_USER) ||
           can(PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT) ||
           can(PERMISSIONS.USER_MANAGEMENT.ADD_TEACHER) ||
           can(PERMISSIONS.USER_MANAGEMENT.ADD_STAFF);
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
    
    // For IT users, hide role field when creating students (auto-set to Student)
    if (fieldName === 'role' && userRole === 'IT' && mode === 'create' && formData.role === 'Student') {
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate permissions - check if user can create users based on their role
    if (mode === 'create') {
      const canCreateUser = can(PERMISSIONS.USER_MANAGEMENT.ADD_ANY_USER) ||
                           can(PERMISSIONS.USER_MANAGEMENT.ADD_STUDENT) ||
                           can(PERMISSIONS.USER_MANAGEMENT.ADD_TEACHER) ||
                           can(PERMISSIONS.USER_MANAGEMENT.ADD_STAFF);
      
      if (!canCreateUser) {
        toast.error('You don\'t have permission to create users');
        return;
      }
    }
    
    if (mode === 'edit' && !can(PERMISSIONS.USER_MANAGEMENT.EDIT_USERS)) {
      toast.error('You don\'t have permission to edit users');
      return;
    }

    // Validate form
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = isStudentRole() ? 'Student name is required' : 'First name is required';
    }
    
    // For all roles, ensure we have a last name (for students, we'll use father name as fallback)
    if (!isStudentRole() && !formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.role && shouldShowField('role')) newErrors.role = 'Role is required';
    
    // CNIC is required for all users
    if (!formData.cnic.trim()) newErrors.cnic = 'CNIC is required';
    
    // Password validation for non-student roles
    if (!isStudentRole()) {
      if (mode === 'create' && !formData.password.trim()) {
        newErrors.password = 'Password is required';
      }
      if (formData.password && formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }
    
    // Additional validation for students
    if (isStudentRole()) {
      if (!formData.fatherName.trim()) newErrors.fatherName = 'Father name is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.program) newErrors.program = 'Program is required';
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
      
      // Level 5 student validation
      if (formData.enquiryLevel == 5) {
        if (!formData.admissionInfo.grade) newErrors['admissionInfo.grade'] = 'Grade is required for admitted students';
      }
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // CNIC validation for all users
    if (formData.cnic) {
      const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
      if (!cnicRegex.test(formData.cnic)) {
        newErrors.cnic = 'CNIC must be in format: 12345-1234567-1';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      
      // Show a helpful message about what's missing
      const missingFields = Object.keys(newErrors);
      const fieldLabels = {
        firstName: isStudentRole() ? 'Student Name' : 'First Name',
        lastName: 'Last Name', 
        email: 'Email',
        role: 'Role',
        fatherName: 'Father Name',
        cnic: 'CNIC',
        gender: 'Gender',
        program: 'Program',
        phoneNumber: 'Phone Number',
        enquiryLevel: 'Enquiry Level',
        'admissionInfo.grade': 'Grade'
      };
      
      const missingFieldNames = missingFields.map(field => fieldLabels[field] || field);
      toast.error(`Please fill in the following required fields: ${missingFieldNames.join(', ')}`);
      
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      let response;
      const submitData = { ...formData };
      
      // For students, use father name as last name if lastName is empty
      if (isStudentRole() && !submitData.lastName && submitData.fatherName) {
        submitData.lastName = submitData.fatherName;
      }
      
      // Set default role for receptionist or IT if not shown
      if (!shouldShowField('role') && (userRole === 'Receptionist' || userRole === 'IT')) {
        submitData.role = 'Student';
      }

      // For edit mode, structure the data properly for the server
      if (mode === 'edit') {
        // For students, use father name as last name if lastName is empty
        if (isStudentRole() && !submitData.lastName && submitData.fatherName) {
          submitData.lastName = submitData.fatherName;
        }
        
        // Ensure both firstName and lastName are present
        if (!submitData.firstName || !submitData.lastName) {
          if (isStudentRole()) {
            submitData.firstName = submitData.firstName || 'Student';
            submitData.lastName = submitData.lastName || submitData.fatherName || 'Name';
          }
        }
      }

      // For create mode, ensure required fields are present
      if (mode === 'create') {
        // For students, use father name as last name if lastName is empty
        if (isStudentRole() && !submitData.lastName && submitData.fatherName) {
          submitData.lastName = submitData.fatherName;
        }
        
        // Ensure firstName and lastName are not empty
        if (!submitData.firstName || !submitData.lastName) {
          if (isStudentRole()) {
            submitData.firstName = submitData.firstName || 'Student';
            submitData.lastName = submitData.lastName || submitData.fatherName || 'Name';
          } else {
            // For non-student roles, ensure we have proper names
            if (!submitData.firstName) {
              toast.error('First name is required');
              return;
            }
            if (!submitData.lastName) {
              toast.error('Last name is required');
              return;
            }
          }
        }
      }

      // Filter out student-specific fields for non-student roles
      if (!isStudentRole()) {
        delete submitData.program;
        delete submitData.matricMarks;
        delete submitData.matricTotal;
        delete submitData.previousSchool;
        // Keep general fields that might be useful for all roles
      }

      console.log('Submitting data:', submitData);

      if (mode === 'create') {
        response = await userAPI.createUser(submitData);
      } else if (mode === 'edit') {
        response = await userAPI.updateUser(user._id, submitData);
      }

      if (response.success) {
        toast.success(`User ${mode === 'create' ? 'created' : 'updated'} successfully`);
        onSave();
      } else {
        console.error('User creation/update failed:', response);
        toast.error(response.message || `Failed to ${mode} user`);
      }
    } catch (error) {
      console.error(`${mode} user error:`, error);
      
      // More detailed error logging
      if (error.response?.data) {
        console.error('Server response:', error.response.data);
        toast.error(error.response.data.message || `Failed to ${mode} user`);
      } else {
        toast.error(`Failed to ${mode} user. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested admissionInfo fields
    if (name.startsWith('admissionInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        admissionInfo: {
          ...prev.admissionInfo,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-start justify-center z-50 p-4 pt-8">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-200 mt-[-400px]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 ">
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
                {mode === 'create' && ((userRole === 'Receptionist' || (userRole === 'IT' && formData.role === 'Student')) ? 'Add New Student' : 'Add New User')}
                {mode === 'edit' && 'Edit User'}
                {mode === 'view' && 'User Details'}
              </h2>
              <p className="text-sm text-gray-600">
                {mode === 'create' && ((userRole === 'Receptionist' || (userRole === 'IT' && formData.role === 'Student')) ? 'Fill in the student details' : 'Fill in the details to create a new user')}
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
                {isStudentRole() ? 'Student Name *' : 'First Name *'}
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
                  placeholder={isStudentRole() ? 'Enter student name' : 'Enter first name'}
                />
              </div>
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>

            {/* Last Name - Hidden for students */}
            {!isStudentRole() && (
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
            )}

            {/* Father Name - Only for students */}
            {isStudentRole() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Father Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    readOnly={isReadOnly}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.fatherName ? 'border-red-300' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                    placeholder="Enter father name"
                  />
                </div>
                {errors.fatherName && <p className="text-red-500 text-xs mt-1">{errors.fatherName}</p>}
              </div>
            )}

            {/* Gender - Only for students */}
            {isStudentRole() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.gender ? 'border-red-300' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
              </div>
            )}

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

            {/* Password - Required for non-student roles */}
            {!isStudentRole() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {mode === 'create' ? '*' : ''}
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    readOnly={isReadOnly}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                    placeholder={mode === 'edit' ? 'Leave blank to keep current password' : 'Enter password'}
                  />
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                {mode === 'edit' && (
                  <p className="text-gray-500 text-xs mt-1">Leave blank to keep current password</p>
                )}
              </div>
            )}

            {/* CNIC - Required for all users */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CNIC *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleInputChange}
                  readOnly={isReadOnly}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.cnic ? 'border-red-300' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  placeholder="12345-1234567-1"
                />
              </div>
              {errors.cnic && <p className="text-red-500 text-xs mt-1">{errors.cnic}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number {isStudentRole() ? '*' : ''}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  readOnly={isReadOnly}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  placeholder="Enter phone number"
                />
              </div>
              {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
            </div>

            {/* Secondary Phone - Only for students */}
            {isStudentRole() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="tel"
                    name="secondaryPhone"
                    value={formData.secondaryPhone}
                    onChange={handleInputChange}
                    readOnly={isReadOnly}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter secondary phone number"
                  />
                </div>
              </div>
            )}

            {/* Program - Only for students */}
            {isStudentRole() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program *
                </label>
                <select
                  name="program"
                  value={formData.program}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.program ? 'border-red-300' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                >
                  {getAvailablePrograms().map(program => (
                    <option key={program.value} value={program.value}>{program.label}</option>
                  ))}
                </select>
                {errors.program && <p className="text-red-500 text-xs mt-1">{errors.program}</p>}
              </div>
            )}

            {/* Enquiry Level - Only for students */}
            {isStudentRole() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enquiry Level *
                </label>
                <select
                  name="enquiryLevel"
                  value={formData.enquiryLevel}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.enquiryLevel ? 'border-red-300' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                >
                  <option value={1}>Level 1 - Initial Enquiry</option>
                  <option value={2}>Level 2 - Follow-up</option>
                  <option value={3}>Level 3 - Serious Interest</option>
                  <option value={4}>Level 4 - Documents Submitted</option>
                  <option value={5}>Level 5 - Admitted Student</option>
                </select>
                {errors.enquiryLevel && <p className="text-red-500 text-xs mt-1">{errors.enquiryLevel}</p>}
              </div>
            )}

            {/* Grade - Only for Level 5 students */}
            {isStudentRole() && formData.enquiryLevel == 5 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade *
                </label>
                <select
                  name="admissionInfo.grade"
                  value={formData.admissionInfo.grade}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors['admissionInfo.grade'] ? 'border-red-300' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                >
                  <option value="">Select Grade</option>
                  <option value="11th">11th Grade</option>
                  <option value="12th">12th Grade</option>
                </select>
                {errors['admissionInfo.grade'] && <p className="text-red-500 text-xs mt-1">{errors['admissionInfo.grade']}</p>}
              </div>
            )}

            {/* Class Name - Only for Level 5 students */}
            {isStudentRole() && formData.enquiryLevel == 5 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name
                </label>
                <select
                  name="admissionInfo.className"
                  value={formData.admissionInfo.className}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select Class</option>
                  {classes
                    .filter(cls => !formData.admissionInfo.grade || cls.grade === formData.admissionInfo.grade)
                    .map(cls => (
                      <option key={cls._id} value={cls.name}>
                        {cls.name} ({cls.campus} - {cls.program})
                      </option>
                    ))
                  }
                </select>
              </div>
            )}

            {/* Matriculation Marks - Only for students */}
            {isStudentRole() && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matriculation Obtained Marks
                  </label>
                  <input
                    type="number"
                    name="matricMarks"
                    value={formData.matricMarks}
                    onChange={handleInputChange}
                    placeholder="Enter obtained marks"
                    disabled={isReadOnly}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.matricMarks ? 'border-red-300' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                  {errors.matricMarks && <p className="text-red-500 text-xs mt-1">{errors.matricMarks}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matriculation Total Marks
                  </label>
                  <input
                    type="number"
                    name="matricTotal"
                    value={formData.matricTotal}
                    onChange={handleInputChange}
                    placeholder="Enter total marks"
                    disabled={isReadOnly}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.matricTotal ? 'border-red-300' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  />
                  {errors.matricTotal && <p className="text-red-500 text-xs mt-1">{errors.matricTotal}</p>}
                </div>
              </div>
            )}

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
                    {getAvailableRoles().map(role => (
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

          {/* Reference - Only for students */}
          {isStudentRole() && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference
              </label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleInputChange}
                readOnly={isReadOnly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  isReadOnly ? 'bg-gray-50' : ''
                }`}
                placeholder="Enter reference"
              />
            </div>
          )}

          {/* Emergency Contact - For non-students or rename for students */}
          {!isStudentRole() && (
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
          )}

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
              <Button
                type="submit"
                disabled={loading || (mode === 'create' && !canCreateUser()) || (mode === 'edit' && !can(PERMISSIONS.USER_MANAGEMENT.EDIT_USERS))}
                className="bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg transition-all duration-200 px-6 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? 'Saving...' : (mode === 'create' ? 'Create User' : 'Save Changes')}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
