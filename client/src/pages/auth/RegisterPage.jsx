import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { authAPI } from '../../services/api';
import { normalizeRole } from '../../utils/roleUtils';

// Validation schema
const registerSchema = z.object({
  // Basic Info
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),

  // Personal Info
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Please select gender' }),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  cnic: z
    .string()
    .regex(/^[0-9]{5}-[0-9]{7}-[0-9]$/, 'Please enter valid CNIC format (12345-1234567-1)'),
  
  // Contact Info
  primaryPhone: z
    .string()
    .regex(/^(\+92|0)?[0-9]{10}$/, 'Please enter a valid phone number'),
  
  // Role Info
  role: z.enum(['Student', 'Teacher', 'SRO', 'Accounts', 'IT', 'EMS'], { 
    required_error: 'Please select a role' 
  }),
  
  // Family Info
  fatherName: z.string().min(1, 'Father name is required').max(100, 'Father name too long'),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactRelation: z.string().min(1, 'Emergency contact relationship is required'),
  emergencyContactPhone: z
    .string()
    .regex(/^(\+92|0)?[0-9]{10}$/, 'Please enter a valid emergency contact phone'),

  // Terms
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [roleOptions, setRoleOptions] = useState([
    { value: 'Student', label: 'Student' },
    { value: 'Teacher', label: 'Teacher' }
  ]);

  const navigate = useNavigate();
  const { register: registerUser, error, clearError, isAuthenticated } = useAuth();

  // Fetch valid roles from backend on mount
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await authAPI.getRoles();
        if (res && res.roles) {
          setRoleOptions(res.roles);
        }
      } catch (e) {
        // fallback to default
      }
    }
    fetchRoles();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    trigger
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onChange'
  });

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      clearErrors();
      clearError();

      // Format data for API
      const userData = {
        email: data.email,
        userName: data.username, // FIX: send as userName
        password: data.password,
        fullName: {
          firstName: data.firstName,
          lastName: data.lastName
        },
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        cnic: data.cnic,
        phoneNumbers: {
          primary: data.primaryPhone
        },
        institute: data.institute,
        role: normalizeRole(data.role), // Normalize role
        familyInfo: {
          fatherName: data.fatherName,
          emergencyContact: {
            name: data.emergencyContactName,
            relationship: data.emergencyContactRelation,
            phone: data.emergencyContactPhone
          }
        }
      };

      const result = await registerUser(userData);

      if (result.success) {
        // Registration successful, navigation handled by useEffect
        console.log('Registration successful');
      } else {
        // Handle registration errors
        setError('root', { message: result.error });
      }
    } catch {
      setError('root', { message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle next step
  const handleNextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Get fields for current step validation
  const getFieldsForStep = (step) => {
    switch (step) {
      case 1:
        return ['email', 'username', 'password', 'confirmPassword'];
      case 2:
        return ['firstName', 'lastName', 'gender', 'dateOfBirth', 'cnic'];
      case 3:
        return ['primaryPhone', 'institute', 'role'];
      case 4:
        return ['fatherName', 'emergencyContactName', 'emergencyContactRelation', 'emergencyContactPhone', 'acceptTerms'];
      default:
        return [];
    }
  };

  // Step 1: Account Information
  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
      
      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          {...register('email')}
          type="email"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.email ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Enter your email address"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <input
          {...register('username')}
          type="text"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.username ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Choose a username"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Create a strong password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <div className="relative">
          <input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Confirm your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>
    </div>
  );

  // Step 2: Personal Information
  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            {...register('firstName')}
            type="text"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.firstName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter first name"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            {...register('lastName')}
            type="text"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lastName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter last name"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Gender
        </label>
        <select
          {...register('gender')}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.gender ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        {errors.gender && (
          <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
        )}
      </div>

      {/* Date of Birth */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date of Birth
        </label>
        <input
          {...register('dateOfBirth')}
          type="date"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.dateOfBirth && (
          <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
        )}
      </div>

      {/* CNIC */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CNIC
        </label>
        <input
          {...register('cnic')}
          type="text"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.cnic ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="12345-1234567-1"
        />
        {errors.cnic && (
          <p className="mt-1 text-sm text-red-600">{errors.cnic.message}</p>
        )}
      </div>
    </div>
  );

  // Step 3: Institute Information
  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Institute & Contact Information</h3>
      
      {/* Phone Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Primary Phone Number
        </label>
        <input
          {...register('primaryPhone')}
          type="tel"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.primaryPhone ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="03001234567"
        />
        {errors.primaryPhone && (
          <p className="mt-1 text-sm text-red-600">{errors.primaryPhone.message}</p>
        )}
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role
        </label>
        <select
          {...register('role')}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.role ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">Select your role</option>
          {roleOptions.map((role) => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>
    </div>
  );

  // Step 4: Family Information
  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Family & Emergency Contact</h3>
      
      {/* Father Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Father's Name
        </label>
        <input
          {...register('fatherName')}
          type="text"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.fatherName ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Enter father's name"
        />
        {errors.fatherName && (
          <p className="mt-1 text-sm text-red-600">{errors.fatherName.message}</p>
        )}
      </div>

      {/* Emergency Contact Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Emergency Contact Name
        </label>
        <input
          {...register('emergencyContactName')}
          type="text"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.emergencyContactName ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Enter emergency contact name"
        />
        {errors.emergencyContactName && (
          <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName.message}</p>
        )}
      </div>

      {/* Emergency Contact Relationship */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Relationship
        </label>
        <input
          {...register('emergencyContactRelation')}
          type="text"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.emergencyContactRelation ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="e.g., Father, Mother, Guardian"
        />
        {errors.emergencyContactRelation && (
          <p className="mt-1 text-sm text-red-600">{errors.emergencyContactRelation.message}</p>
        )}
      </div>

      {/* Emergency Contact Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Emergency Contact Phone
        </label>
        <input
          {...register('emergencyContactPhone')}
          type="tel"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.emergencyContactPhone ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="03001234567"
        />
        {errors.emergencyContactPhone && (
          <p className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone.message}</p>
        )}
      </div>

      {/* Terms and Conditions */}
      <div className="pt-4">
        <div className="flex items-start">
          <input
            {...register('acceptTerms')}
            id="acceptTerms"
            type="checkbox"
            className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1 ${
              errors.acceptTerms ? 'border-red-300' : ''
            }`}
          />
          <label htmlFor="acceptTerms" className="ml-3 text-sm text-gray-700">
            I agree to the{' '}
            <Link to="/terms" className="text-blue-600 hover:text-blue-500">
              Terms and Conditions
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="mt-1 text-sm text-red-600">{errors.acceptTerms.message}</p>
        )}
      </div>
    </div>
  );

  // Progress indicator
  const renderProgressIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step < currentStep
                  ? 'bg-green-500 text-white'
                  : step === currentStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step < currentStep ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                step
              )}
            </div>
            {step < 4 && (
              <div
                className={`h-1 w-16 mx-2 ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        <span>Account</span>
        <span>Personal</span>
        <span>Institute</span>
        <span>Family</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join the PGC System platform</p>
          </div>

          {/* Progress Indicator */}
          {renderProgressIndicator()}

          {/* Global error message */}
          {(error || errors.root) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">
                  {error || errors.root?.message}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Render current step */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    onClick={handlePrevStep}
                    variant="outline"
                    className="px-6"
                  >
                    Previous
                  </Button>
                )}
              </div>

              <div>
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
