import React, { useState, useEffect } from 'react';
import { X, MessageSquare, User, BookOpen, Edit2 } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../services/api';
import { useApiWithToast } from '../../hooks/useApiWithToast';

const CorrespondenceForm = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  editData = null 
}) => {
  const [formData, setFormData] = useState({
    studentId: '',
    type: '',
    subject: '',
    message: ''
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [filteredStudents, setFilteredStudents] = useState([]);

  const { executeRequest } = useApiWithToast();
  
  const isEditing = !!editData;

  // Reset form when modal opens/closes or edit data changes
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          studentId: editData.studentId._id || editData.studentId,
          type: editData.type,
          subject: editData.subject,
          message: editData.message
        });
      } else {
        setFormData({
          studentId: '',
          type: '',
          subject: '',
          message: ''
        });
      }
      fetchStudents();
    }
  }, [isOpen, editData]);

  const fetchStudents = async () => {
    setFetchingStudents(true);
    try {
      const response = await api.get('/students?role=Student&limit=1000');
      const studentsData = response.data?.data || response.data || [];
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setFetchingStudents(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editData) {
        // Update existing correspondence
        await executeRequest(
          () => api.put(`/correspondence/${editData._id}`, formData),
          {
            successMessage: 'Correspondence updated successfully',
            errorMessage: 'Failed to update correspondence'
          }
        );
      } else {
        // Create new correspondence
        await executeRequest(
          () => api.post('/correspondence', formData),
          {
            successMessage: 'Correspondence created successfully',
            errorMessage: 'Failed to create correspondence'
          }
        );
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving correspondence:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableStudents = () => {
    if (!formData.type) return students;
    
    if (formData.type === 'enquiry') {
      // Show students at levels 1-4
      return students.filter(student => (student.prospectusStage || 1) < 5);
    } else if (formData.type === 'student') {
      // Show students at level 5+
      return students.filter(student => (student.prospectusStage || 1) >= 5);
    }
    
    return students;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {isEditing ? (
                <Edit2 className="w-6 h-6 text-blue-600" />
              ) : (
                <MessageSquare className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editData ? 'Edit Correspondence' : 'Create New Correspondence'}
              </h2>
              <p className="text-sm text-gray-500">
                {editData ? 'Update correspondence details' : 'Add new correspondence entry'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Correspondence Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correspondence Type *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="type"
                  value="enquiry"
                  checked={formData.type === 'enquiry'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600"
                  disabled={!!editData}
                />
                <BookOpen className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="font-medium">Enquiry Correspondence</div>
                  <div className="text-xs text-gray-500">For students at Levels 1-4</div>
                </div>
              </label>
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="type"
                  value="student"
                  checked={formData.type === 'student'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600"
                  disabled={!!editData}
                />
                <User className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-medium">Student Correspondence</div>
                  <div className="text-xs text-gray-500">For students at Level 5+</div>
                </div>
              </label>
            </div>
          </div>

          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student *
            </label>
            <select
              name="studentId"
              value={formData.studentId}
              onChange={handleInputChange}
              required
              disabled={fetchingStudents || !!editData}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">
                {fetchingStudents ? 'Loading students...' : 'Select a student'}
              </option>
              {getAvailableStudents().map((student) => (
                <option key={student._id} value={student._id}>
                  {`${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.trim()} 
                  (Level {student.prospectusStage || 1})
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              placeholder="Enter correspondence subject"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows={6}
              placeholder="Enter your message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.type || !formData.studentId || !formData.subject || !formData.message}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Saving...' : editData ? 'Update Correspondence' : 'Create Correspondence'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CorrespondenceForm;
