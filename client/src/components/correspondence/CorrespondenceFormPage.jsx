import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Edit2, Search, Filter, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../services/api';
import { useApiWithToast } from '../../hooks/useApiWithToast';

const CorrespondenceFormPage = ({ 
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
      setStudents([]);
    } finally {
      setFetchingStudents(false);
    }
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filter students based on search, gender, and correspondence type
  const getFilteredStudents = () => {
    let filtered = students;
    
    // Filter by correspondence type first
    if (formData.type === 'enquiry') {
      filtered = students.filter(student => (student.prospectusStage || 1) < 5);
    } else if (formData.type === 'student') {
      filtered = students.filter(student => (student.prospectusStage || 1) >= 5);
    }
    
    // Apply search filter
    if (studentSearch.trim()) {
      const searchLower = studentSearch.toLowerCase();
      filtered = filtered.filter(student => {
        const fullName = `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.toLowerCase();
        const email = (student.email || '').toLowerCase();
        const rollNumber = (student.rollNumber || '').toLowerCase();
        return fullName.includes(searchLower) || email.includes(searchLower) || rollNumber.includes(searchLower);
      });
    }
    
    // Apply gender filter
    if (genderFilter !== 'all') {
      filtered = filtered.filter(student => student.gender === genderFilter);
    }
    
    return filtered;
  };

  const filteredStudents = getFilteredStudents();
  const selectedStudent = students.find(s => s._id === formData.studentId);

  if (!isOpen) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-500" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  {isEditing ? (
                    <Edit2 className="w-8 h-8 text-blue-600" />
                  ) : (
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {isEditing ? 'Edit Correspondence' : 'Create New Correspondence'}
                  </h1>
                  <p className="text-gray-600">
                    {isEditing ? 'Update correspondence details' : 'Add new correspondence entry for student communication'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student Selection Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Student</h3>
                
                {/* Selected Student Display */}
                {selectedStudent && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900">Selected Student</h4>
                    <p className="text-green-800">
                      {selectedStudent.fullName?.firstName} {selectedStudent.fullName?.lastName}
                    </p>
                    <p className="text-sm text-green-600">
                      Level {selectedStudent.prospectusStage || 1} • {selectedStudent.gender}
                    </p>
                  </div>
                )}
                
                {/* Student Search */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Search className="w-4 h-4 inline mr-1" />
                    Search Students
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name, email, or roll number..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Gender Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Filter className="w-4 h-4 inline mr-1" />
                    Filter by Gender
                  </label>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Correspondence Type Filter Info */}
                {formData.type && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Type Filter:</strong><br />
                      {formData.type === 'enquiry' 
                        ? 'Showing students at levels 1-4 (Enquiry stage)'
                        : 'Showing students at level 5+ (Admitted students)'
                      }
                    </p>
                  </div>
                )}

                {/* Results Count */}
                <div className="mb-2">
                  <p className="text-sm text-gray-600">
                    {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                  </p>
                </div>

                {/* Student List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {fetchingStudents ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Loading students...</p>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-600">
                        {studentSearch || genderFilter !== 'all' 
                          ? 'No students match your search criteria'
                          : formData.type 
                            ? `No students available for ${formData.type} correspondence`
                            : 'Please select correspondence type first'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <div
                        key={student._id}
                        onClick={() => setFormData(prev => ({ ...prev, studentId: student._id }))}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                          formData.studentId === student._id
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          {student.fullName?.firstName} {student.fullName?.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          Level {student.prospectusStage || 1} • {student.gender}
                        </div>
                        {student.email && (
                          <div className="text-xs text-gray-500 mt-1">{student.email}</div>
                        )}
                        {student.rollNumber && (
                          <div className="text-xs text-gray-500">Roll: {student.rollNumber}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Correspondence Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Correspondence Details</h3>
                
                <div className="space-y-6">
                  {/* Correspondence Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Correspondence Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.type === 'enquiry'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, type: 'enquiry', studentId: '' }))}
                      >
                        <div className="flex items-center space-x-3">
                          <MessageSquare className={`w-6 h-6 ${
                            formData.type === 'enquiry' ? 'text-orange-600' : 'text-gray-400'
                          }`} />
                          <div>
                            <h4 className="font-medium text-gray-900">Enquiry Correspondence</h4>
                            <p className="text-sm text-gray-600">For students at levels 1-4</p>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.type === 'student'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, type: 'student', studentId: '' }))}
                      >
                        <div className="flex items-center space-x-3">
                          <Edit2 className={`w-6 h-6 ${
                            formData.type === 'student' ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <div>
                            <h4 className="font-medium text-gray-900">Student Correspondence</h4>
                            <p className="text-sm text-gray-600">For students at level 5+</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter correspondence subject"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={8}
                      placeholder="Enter your message here..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="outline"
                      className="px-6 py-2"
                    >
                      Cancel
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={loading || !formData.studentId || !formData.type || !formData.subject || !formData.message}
                      className="px-8 py-2 bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        isEditing ? 'Update Correspondence' : 'Create Correspondence'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CorrespondenceFormPage;
