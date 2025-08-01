import React, { useState, useEffect } from 'react';
import { X, Phone, Users, Clock, MessageSquare, Send } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const CreateCorrespondenceModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    studentId: '',
    type: 'enquiry',
    subject: '',
    message: ''
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const { showToast } = useToast();

  // Communication types with icons and descriptions
  const communicationTypes = [
    { 
      value: 'enquiry', 
      label: 'Enquiry Communication',
      icon: MessageSquare,
      description: 'General enquiry or information exchange',
      color: 'text-teal-600 bg-teal-50 border-teal-200'
    },
    { 
      value: 'call', 
      label: 'Phone Call',
      icon: Phone,
      description: 'Telephone conversation record',
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    { 
      value: 'meeting', 
      label: 'Meeting',
      icon: Users,
      description: 'In-person or virtual meeting',
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    { 
      value: 'follow-up', 
      label: 'Follow-up',
      icon: Clock,
      description: 'Follow-up communication or check-in',
      color: 'text-orange-600 bg-orange-50 border-orange-200'
    },
    { 
      value: 'student', 
      label: 'Student Communication',
      icon: MessageSquare,
      description: 'Communication with admitted students',
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    }
  ];

  // Fetch students for dropdown
  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const response = await api.get('/users?role=Student&limit=100');
      
      if (response.data.success) {
        const sortedStudents = (response.data.data || []).sort((a, b) => {
          const aName = `${a.fullName?.firstName || ''} ${a.fullName?.lastName || ''}`;
          const bName = `${b.fullName?.firstName || ''} ${b.fullName?.lastName || ''}`;
          return aName.localeCompare(bName);
        });
        setStudents(sortedStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      showToast('Failed to load students', 'error');
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.subject.trim() || !formData.message.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post('/correspondence', {
        studentId: formData.studentId,
        type: formData.type,
        subject: formData.subject.trim(),
        message: formData.message.trim()
      });

      if (response.data.success) {
        showToast('Communication created successfully', 'success');
        setFormData({
          studentId: '',
          type: 'enquiry',
          subject: '',
          message: ''
        });
        onSuccess();
        onClose();
      } else {
        showToast('Failed to create communication', 'error');
      }
    } catch (error) {
      console.error('Error creating correspondence:', error);
      showToast(error.response?.data?.message || 'Failed to create communication', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  const selectedType = communicationTypes.find(type => type.value === formData.type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold">New Communication</h3>
                <p className="text-blue-100">Record a new student communication</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student <span className="text-red-500">*</span>
            </label>
            {studentsLoading ? (
              <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                Loading students...
              </div>
            ) : (
              <select
                value={formData.studentId}
                onChange={(e) => handleInputChange('studentId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a student...</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {`${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.trim()} 
                    - Level {student.prospectusStage || 1}
                    {student.email ? ` (${student.email})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Communication Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Communication Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {communicationTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                
                return (
                  <div
                    key={type.value}
                    onClick={() => handleInputChange('type', type.value)}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${type.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{type.label}</h4>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Brief subject or title for this communication"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Detailed description of the communication..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              required
            />
          </div>

          {/* Selected Type Summary */}
          {selectedType && (
            <div className={`p-4 rounded-lg border ${selectedType.color}`}>
              <div className="flex items-center gap-2">
                <selectedType.icon className="h-4 w-4" />
                <span className="font-medium">Selected: {selectedType.label}</span>
              </div>
              <p className="text-sm mt-1">{selectedType.description}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Communication'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCorrespondenceModal;
