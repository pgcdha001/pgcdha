import React, { useState, useEffect } from 'react';
import { default as api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Card from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  Users, Phone, MessageSquare, Search, CheckCircle, Clock
} from 'lucide-react';

const ReceptionistDashboard = () => {
  const { toast } = useToast();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [studentRemarks, setStudentRemarks] = useState({});

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Try the new endpoint first
      let response;
      try {
        response = await api.get('/remarks/students-with-remarks');
        const studentsData = response.data?.data?.students || [];
        setStudents(studentsData);
        
        // Set remarks status from API response
        const remarksData = {};
        studentsData.forEach(student => {
          remarksData[student._id] = student.hasRemarks;
        });
        setStudentRemarks(remarksData);
      } catch (error) {
        console.log('Falling back to regular users endpoint');
        // Fall back to regular users endpoint
        response = await api.get('/users?role=Student&limit=1000');
        const studentsData = response.data?.data?.users || [];
        setStudents(studentsData);
        
        // Initialize empty remarks status
        const remarksData = {};
        studentsData.forEach(student => {
          remarksData[student._id] = !!(student.receptionistRemarks && student.receptionistRemarks.length > 0);
        });
        setStudentRemarks(remarksData);
      }
      
      toast.success('Students loaded successfully');
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRemark = async () => {
    if (!selectedStudent || !remarkText.trim()) {
      toast.error('Please enter a remark');
      return;
    }

    try {
      const remarkData = {
        studentId: selectedStudent._id,
        remark: remarkText
      };

      console.log('Sending remark data:', remarkData);
      const response = await api.post('/remarks/add-remark', remarkData);
      console.log('Response:', response.data);
      
      if (response.data.success) {
        // Update local state to show badge
        setStudentRemarks(prev => ({
          ...prev,
          [selectedStudent._id]: true
        }));

        // Update the student in the local state with the new remark
        setStudents(prev => prev.map(student => {
          if (student._id === selectedStudent._id) {
            const updatedStudent = { ...student };
            if (!updatedStudent.receptionistRemarks) {
              updatedStudent.receptionistRemarks = [];
            }
            updatedStudent.receptionistRemarks.push(response.data.data);
            return updatedStudent;
          }
          return student;
        }));
        
        setShowRemarkModal(false);
        setRemarkText('');
        setSelectedStudent(null);
        
        toast.success(`Remark added for ${selectedStudent.fullName?.firstName}`);
      } else {
        toast.error(response.data.message || 'Failed to save remark');
      }
    } catch (error) {
      console.error('Error saving remark:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        toast.error(error.response.data.message || 'Failed to save remark');
      } else {
        toast.error('Network error. Please try again.');
      }
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleString();
  };

  const filteredStudents = students.filter(student => {
    const fullName = `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-lg font-medium text-primary">Loading Students...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-20">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-border/50 p-8">
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/90 to-accent/80 text-white shadow-lg">
            <Phone className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-primary mb-2 font-[Sora,Inter,sans-serif] tracking-tight">
              Receptionist Dashboard
            </h2>
            <p className="text-muted-foreground font-medium">
              Add remarks for correspondence
            </p>
          </div>
        </div>
      </div>

      {/* Student List */}
      <Card className="bg-white/60 backdrop-blur-xl border-border/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-primary flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student List ({filteredStudents.length})
          </h3>
          
          {/* Search Bar */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search students by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border/50 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => {
            const latestRemark = student.receptionistRemarks && student.receptionistRemarks.length > 0 
              ? student.receptionistRemarks[student.receptionistRemarks.length - 1] 
              : null;
            
            return (
              <div 
                key={student._id} 
                className="relative p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-border/30 hover:border-primary/50 transition-all duration-200 hover:shadow-md"
              >
                {/* Remarked Badge */}
                {studentRemarks[student._id] && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                )}
                
                {/* Student Avatar */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-lg">
                    {student.fullName?.firstName?.charAt(0) || 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-primary truncate">
                      {student.fullName?.firstName} {student.fullName?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {student.email}
                    </p>
                  </div>
                </div>
                
                {/* Latest Remark Display */}
                {latestRemark && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800 font-medium mb-1">Latest Remark:</p>
                    <p className="text-xs text-blue-700 line-clamp-2">
                      {latestRemark.remark}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {new Date(latestRemark.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {/* Action Button */}
                <Button
                  onClick={() => {
                    setSelectedStudent(student);
                    setShowRemarkModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg transition-all duration-200"
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {latestRemark ? 'Add Another Remark' : 'Add Remark'}
                </Button>
              </div>
            );
          })}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No students found</p>
          </div>
        )}
      </Card>

      {/* Add Remark Modal */}
      {showRemarkModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-accent text-white p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-[Sora,Inter,sans-serif]">Add Remark</h3>
                  <p className="text-white/80 text-sm">
                    {selectedStudent.fullName?.firstName} {selectedStudent.fullName?.lastName}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Current Time Display */}
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Current Time:</span>
                  <span className="font-semibold">{getCurrentTime()}</span>
                </div>
              </div>

              {/* Remark Input */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">Remarks</label>
                <textarea
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="Enter your remarks about the correspondence..."
                  rows={4}
                  className="w-full p-3 border border-border/50 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  autoFocus
                />
              </div>

              {/* Student Info */}
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Email:</strong> {selectedStudent.email}</p>
                  <p><strong>Phone:</strong> {selectedStudent.phoneNumbers?.primary || 'Not provided'}</p>
                  <p><strong>Stage:</strong> {selectedStudent.prospectusStage || 1}</p>
                </div>
              </div>

              {/* Previous Remarks */}
              {selectedStudent.receptionistRemarks && selectedStudent.receptionistRemarks.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2 text-sm">Previous Remarks:</h4>
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {selectedStudent.receptionistRemarks.map((remark, index) => (
                      <div key={index} className="text-xs text-blue-700 p-2 bg-white rounded border">
                        <p className="font-medium">{remark.remark}</p>
                        <p className="text-blue-600 mt-1">
                          {remark.receptionistName} - {new Date(remark.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="bg-white/80 backdrop-blur-xl border-t border-border/50 p-4">
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRemarkModal(false);
                    setSelectedStudent(null);
                    setRemarkText('');
                  }}
                  className="px-4 py-2"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddRemark}
                  disabled={!remarkText.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white"
                >
                  Save Remark
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
