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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-fade-in">
      <div className="w-full h-full bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl flex flex-col"
           style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.37)'}}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-white/40 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary/90 to-accent/80 text-white shadow-lg">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary font-[Sora,Inter,sans-serif] tracking-tight">
                {isCreateMode && 'Create New User'}
                {isEditMode && 'Edit User'}
                {isViewMode && 'View User Details'}
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                {isCreateMode && 'Add a new user to the system'}
                {isEditMode && 'Modify user information'}
                {isViewMode && 'User profile information'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-accent transition-all duration-200 rounded-lg p-2 hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/30 group"
            aria-label="Close"
          >
            <X className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white/20 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="p-4 space-y-4 h-full">{/*Compressed spacing*/}
            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 px-4 py-3 rounded-2xl text-sm shadow-lg animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  {errors.submit}
                </div>
              </div>
            )}

            {/* Basic Information Card */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-border/30 transition-all duration-200 hover:shadow-xl hover:bg-white/70">
              {/* Role Selection */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-primary mb-2 font-[Sora,Inter,sans-serif]">Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60"
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {errors.role && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.role}</p>}
              </div>
              
              <h3 className="text-lg font-bold text-primary font-[Sora,Inter,sans-serif] mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-primary/80 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60 ${
                      errors.email ? 'border-red-300 bg-red-50/60' : 'border-border/50'
                    }`}
                  />
                  {errors.email && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary/80 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60 ${
                      errors.username ? 'border-red-300 bg-red-50/60' : 'border-border/50'
                    }`}
                  />
                  {errors.username && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.username}</p>}
                </div>

                {isCreateMode && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-primary/80 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 pr-12 border rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 ${
                            errors.password ? 'border-red-300 bg-red-50/60' : 'border-border/50'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors duration-200"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.password}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-primary/80 mb-2">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 pr-12 border rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 ${
                            errors.confirmPassword ? 'border-red-300 bg-red-50/60' : 'border-border/50'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors duration-200"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.confirmPassword}</p>}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Personal Information Card */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-border/30 transition-all duration-200 hover:shadow-xl hover:bg-white/70">
              <h3 className="text-lg font-bold text-primary font-[Sora,Inter,sans-serif] mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-primary/80 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60 ${
                      errors.firstName ? 'border-red-300 bg-red-50/60' : 'border-border/50'
                    }`}
                  />
                  {errors.firstName && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary/80 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60 ${
                      errors.lastName ? 'border-red-300 bg-red-50/60' : 'border-border/50'
                    }`}
                  />
                  {errors.lastName && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary/80 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60"
                  >
                    <option value="">Select Gender</option>
                    {genders.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary/80 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary/80 mb-2">
                    CNIC
                  </label>
                  <input
                    type="text"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleInputChange}
                    placeholder="12345-1234567-1"
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60 ${
                      errors.cnic ? 'border-red-300 bg-red-50/60' : 'border-border/50'
                    }`}
                  />
                  {errors.cnic && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.cnic}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary/80 mb-2">
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60 ${
                      errors.role ? 'border-red-300 bg-red-50/60' : 'border-border/50'
                    }`}
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  {errors.role && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.role}</p>}
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-border/30 transition-all duration-200 hover:shadow-xl hover:bg-white/70">
              <h3 className="text-lg font-bold text-primary font-[Sora,Inter,sans-serif] mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-primary/80 mb-2">
                    Primary Phone *
                  </label>
                  <input
                    type="text"
                    name="primaryPhone"
                    value={formData.primaryPhone}
                    onChange={handleInputChange}
                    placeholder="+923001234567"
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60 ${
                      errors.primaryPhone ? 'border-red-300 bg-red-50/60' : 'border-border/50'
                    }`}
                  />
                  {errors.primaryPhone && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.primaryPhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary/80 mb-2">
                    Secondary Phone
                  </label>
                  <input
                    type="text"
                    name="secondaryPhone"
                    value={formData.secondaryPhone}
                    onChange={handleInputChange}
                    placeholder="+923001234567"
                    disabled={isViewMode}
                    className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60"
                  />
                </div>
              </div>
            </div>

            {/* Family Information Card */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-border/30 transition-all duration-200 hover:shadow-xl hover:bg-white/70">
              <h3 className="text-lg font-bold text-primary font-[Sora,Inter,sans-serif] mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                Family Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-primary/80 mb-2">
                    Father's Name
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary/80 mb-2">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary/80 mb-2">
                    Emergency Contact Relationship
                  </label>
                  <select
                    name="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60"
                  >
                    <option value="">Select Relationship</option>
                    {relationships.map(relationship => (
                      <option key={relationship} value={relationship}>{relationship}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary/80 mb-2">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="text"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    placeholder="+923001234567"
                    disabled={isViewMode}
                    className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60"
                  />
                </div>
              </div>
            </div>

            {/* Status Information Card */}
            {!isCreateMode && (
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-border/30 transition-all duration-200 hover:shadow-xl hover:bg-white/70">
                <h3 className="text-lg font-bold text-primary font-[Sora,Inter,sans-serif] mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                  Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-white/50 rounded-xl border border-border/30">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      className="h-5 w-5 text-primary focus:ring-primary/30 border-border/50 rounded transition-all duration-200"
                    />
                    <label className="text-sm font-semibold text-primary/80">
                      Active User
                    </label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-white/50 rounded-xl border border-border/30">
                    <input
                      type="checkbox"
                      name="isApproved"
                      checked={formData.isApproved}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      className="h-5 w-5 text-primary focus:ring-primary/30 border-border/50 rounded transition-all duration-200"
                    />
                    <label className="text-sm font-semibold text-primary/80">
                      Approved User
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic sections based on role */}
            {/* Academic Info for Student, Teacher, HOD, Principal, InstituteAdmin */}
            {(formData.role === 'Student' || formData.role === 'Teacher' || formData.role === 'HOD' || formData.role === 'Principal' || formData.role === 'InstituteAdmin') && (
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-border/30 transition-all duration-200 hover:shadow-xl hover:bg-white/70">
                <h3 className="text-lg font-bold text-primary font-[Sora,Inter,sans-serif] mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                  Academic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-primary/80 mb-2">Institute ID</label>
                    <input type="text" name="instituteId" value={formData.instituteId || ''} onChange={handleInputChange} disabled={isViewMode} className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60" />
                  </div>
                  {formData.role === 'Student' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-primary/80 mb-2">Class ID</label>
                        <input type="text" name="classId" value={formData.classId || ''} onChange={handleInputChange} disabled={isViewMode} className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-primary/80 mb-2">Session</label>
                        <input type="text" name="session" value={formData.session || ''} onChange={handleInputChange} disabled={isViewMode} className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Professional Info for Teacher, HOD, IT, etc. */}
            {(formData.role === 'Teacher' || formData.role === 'HOD' || formData.role === 'IT' || formData.role === 'EMS' || formData.role === 'Accounts' || formData.role === 'StoreKeeper' || formData.role === 'LabAssistant') && (
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-border/30 transition-all duration-200 hover:shadow-xl hover:bg-white/70">
                <h3 className="text-lg font-bold text-primary font-[Sora,Inter,sans-serif] mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                  Professional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-primary/80 mb-2">Specialized In</label>
                    <input type="text" name="specializedIn" value={formData.specializedIn || ''} onChange={handleInputChange} disabled={isViewMode} className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary/80 mb-2">Duties</label>
                    <input type="text" name="duties" value={formData.duties || ''} onChange={handleInputChange} disabled={isViewMode} className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 disabled:bg-gray-100/60" />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        {!isViewMode && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-border/30 bg-white/40 backdrop-blur-xl">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold border-border/50 hover:bg-white/80 hover:border-primary/30 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.02); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(15px) scale(0.98); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 10s ease-in-out infinite; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default UserModal;
