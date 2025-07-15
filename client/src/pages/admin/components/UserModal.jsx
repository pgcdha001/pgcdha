import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Save, User } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { userAPI } from '../../../services/api';

const UserModal = ({ user, mode, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    cnic: '',
    primaryPhone: '',
    secondaryPhone: '',
    role: 'Student',
    isActive: true,
    isApproved: false,
    fatherName: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    instituteId: '',
    classId: '',
    session: '',
    specializedIn: '',
    duties: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  const roles = [
    'SystemAdmin',
    'InstituteAdmin',
    'Principal',
    'Teacher',
    'HOD',
    'SRO',
    'CampusCoordinator',
    'EMS',
    'Accounts',
    'IT',
    'StoreKeeper',
    'LabAssistant',
    'Student'
  ];

  const genders = ['Male', 'Female', 'Other'];
  const relationships = ['Father', 'Mother', 'Brother', 'Sister', 'Uncle', 'Aunt', 'Other'];

  useEffect(() => {
    if (user && (isEditMode || isViewMode)) {
      setFormData({
        email: user.email || '',
        username: user.username || '',
        password: '',
        confirmPassword: '',
        firstName: user.fullName?.firstName || '',
        lastName: user.fullName?.lastName || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        cnic: user.cnic || '',
        primaryPhone: user.phoneNumbers?.primary || '',
        secondaryPhone: user.phoneNumbers?.secondary || '',
        role: user.role || 'Student',
        isActive: user.isActive ?? true,
        isApproved: user.isApproved ?? false,
        fatherName: user.familyInfo?.fatherName || '',
        emergencyContactName: user.familyInfo?.emergencyContact?.name || '',
        emergencyContactRelationship: user.familyInfo?.emergencyContact?.relationship || '',
        emergencyContactPhone: user.familyInfo?.emergencyContact?.phone || '',
        instituteId: user.academicInfo?.instituteId || '',
        classId: user.academicInfo?.classId || '',
        session: user.academicInfo?.session || '',
        specializedIn: user.professionalInfo?.specializedIn || '',
        duties: user.professionalInfo?.duties || ''
      });
    }
  }, [user, isEditMode, isViewMode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.primaryPhone.trim()) newErrors.primaryPhone = 'Primary phone is required';
    if (!formData.role) newErrors.role = 'Role is required';

    // Password validation for create mode
    if (isCreateMode) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
    if (formData.primaryPhone && !phoneRegex.test(formData.primaryPhone)) {
      newErrors.primaryPhone = 'Please enter a valid phone number';
    }

    // CNIC validation
    const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]$/;
    if (formData.cnic && !cnicRegex.test(formData.cnic)) {
      newErrors.cnic = 'Please enter valid CNIC format (12345-1234567-1)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        email: formData.email,
        username: formData.username,
        fullName: {
          firstName: formData.firstName,
          lastName: formData.lastName
        },
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        cnic: formData.cnic,
        phoneNumbers: {
          primary: formData.primaryPhone,
          secondary: formData.secondaryPhone
        },
        role: formData.role,
        isActive: formData.isActive,
        isApproved: formData.isApproved,
        familyInfo: {
          fatherName: formData.fatherName,
          emergencyContact: {
            name: formData.emergencyContactName,
            relationship: formData.emergencyContactRelationship,
            phone: formData.emergencyContactPhone
          }
        },
        academicInfo: {
          instituteId: formData.instituteId,
          classId: formData.classId,
          session: formData.session
        },
        professionalInfo: {
          specializedIn: formData.specializedIn,
          duties: formData.duties
        }
      };

      if (isCreateMode && formData.password) {
        userData.password = formData.password;
      }

      let response;
      if (isCreateMode) {
        response = await userAPI.createUser(userData);
      } else {
        response = await userAPI.updateUser(user._id, userData);
      }

      if (response.success) {
        onSave();
      } else {
        setErrors({ submit: response.message || 'Failed to save user' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while saving the user' });
      console.error('Save user error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-2 z-50">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden border border-border font-[Inter,sans-serif]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white/60">
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold text-primary font-[Sora,Inter,sans-serif]">
              {isCreateMode && 'Create New User'}
              {isEditMode && 'Edit User'}
              {isViewMode && 'View User Details'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-accent transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(92vh-5rem)]">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                {errors.submit}
              </div>
            )}

            {/* Basic Information */}
            <div>
              {/* Role Selection */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
              </div>
              <h3 className="text-base font-bold text-primary font-[Sora,Inter,sans-serif] mb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } ${isViewMode ? 'bg-gray-50' : ''}`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                      errors.username ? 'border-red-300' : 'border-gray-300'
                    } ${isViewMode ? 'bg-gray-50' : ''}`}
                  />
                  {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
                </div>

                {isCreateMode && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.password ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    } ${isViewMode ? 'bg-gray-50' : ''}`}
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    } ${isViewMode ? 'bg-gray-50' : ''}`}
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-50' : ''
                    }`}
                  >
                    <option value="">Select Gender</option>
                    {genders.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNIC
                  </label>
                  <input
                    type="text"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleInputChange}
                    placeholder="12345-1234567-1"
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.cnic ? 'border-red-300' : 'border-gray-300'
                    } ${isViewMode ? 'bg-gray-50' : ''}`}
                  />
                  {errors.cnic && <p className="mt-1 text-sm text-red-600">{errors.cnic}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.role ? 'border-red-300' : 'border-gray-300'
                    } ${isViewMode ? 'bg-gray-50' : ''}`}
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Phone *
                  </label>
                  <input
                    type="text"
                    name="primaryPhone"
                    value={formData.primaryPhone}
                    onChange={handleInputChange}
                    placeholder="+923001234567"
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.primaryPhone ? 'border-red-300' : 'border-gray-300'
                    } ${isViewMode ? 'bg-gray-50' : ''}`}
                  />
                  {errors.primaryPhone && <p className="mt-1 text-sm text-red-600">{errors.primaryPhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Phone
                  </label>
                  <input
                    type="text"
                    name="secondaryPhone"
                    value={formData.secondaryPhone}
                    onChange={handleInputChange}
                    placeholder="+923001234567"
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Family Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Family Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Father's Name
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact Relationship
                  </label>
                  <select
                    name="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-50' : ''
                    }`}
                  >
                    <option value="">Select Relationship</option>
                    {relationships.map(relationship => (
                      <option key={relationship} value={relationship}>{relationship}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="text"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    placeholder="+923001234567"
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Status Information */}
            {!isCreateMode && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Active User
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isApproved"
                      checked={formData.isApproved}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Approved User
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic sections based on role */}
            {/* Academic Info for Student, Teacher, HOD, Principal, InstituteAdmin */}
            {(formData.role === 'Student' || formData.role === 'Teacher' || formData.role === 'HOD' || formData.role === 'Principal' || formData.role === 'InstituteAdmin') && (
              <div className="col-span-2 mt-4">
                <h3 className="text-base font-bold text-primary font-[Sora,Inter,sans-serif] mb-2">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Example: InstituteId, ClassId, etc. */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Institute ID</label>
                    <input type="text" name="instituteId" value={formData.instituteId || ''} onChange={handleInputChange} disabled={isViewMode} className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  {formData.role === 'Student' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Class ID</label>
                        <input type="text" name="classId" value={formData.classId || ''} onChange={handleInputChange} disabled={isViewMode} className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Session</label>
                        <input type="text" name="session" value={formData.session || ''} onChange={handleInputChange} disabled={isViewMode} className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            {/* Professional Info for Teacher, HOD, IT, etc. */}
            {(formData.role === 'Teacher' || formData.role === 'HOD' || formData.role === 'IT' || formData.role === 'EMS' || formData.role === 'Accounts' || formData.role === 'StoreKeeper' || formData.role === 'LabAssistant') && (
              <div className="col-span-2 mt-4">
                <h3 className="text-base font-bold text-primary font-[Sora,Inter,sans-serif] mb-2">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Specialized In</label>
                    <input type="text" name="specializedIn" value={formData.specializedIn || ''} onChange={handleInputChange} disabled={isViewMode} className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Duties</label>
                    <input type="text" name="duties" value={formData.duties || ''} onChange={handleInputChange} disabled={isViewMode} className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        {!isViewMode && (
          <div className="flex justify-end gap-2 pt-3 border-t border-border bg-white/60 sticky bottom-0 z-10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-3 py-1.5 bg-primary hover:bg-accent text-white text-xs font-semibold"
            >
              <Save className="w-4 h-4 mr-1" />
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserModal;
