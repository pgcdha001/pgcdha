import React, { useState, useEffect } from 'react';
import { default as api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Card from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Trash2, MessageSquare, Users, BarChart3, TrendingUp, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const STAGE_LABELS = [
  'Not Purchased',
  'Purchased',
  'Returned',
  'Admission Fee Submitted',
  '1st Installment Submitted'
];
const STAGE_COLORS = [
  'bg-gray-300',
  'bg-blue-400',
  'bg-yellow-400',
  'bg-green-400',
  'bg-indigo-400'
];

const ITDashboard = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    secondaryPhone: '',
    gender: '',
    dob: '',
    cnic: '',
    address: '',
    reference: '',
    oldSchoolName: ''
  });
  const [fetching, setFetching] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stageModal, setStageModal] = useState({ open: false, student: null });
  const [stageUpdating, setStageUpdating] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, student: null });
  const [deleting, setDeleting] = useState(false);
  
  // Correspondence statistics state
  const [correspondenceStats, setCorrespondenceStats] = useState({
    totalRemarks: 0,
    uniqueStudents: 0,
    totalStudentsWithRemarks: 0,
    averageRemarksPerStudent: 0
  });

  useEffect(() => {
    fetchStudents();
    fetchCorrespondenceStatistics();
  }, []);

  const fetchCorrespondenceStatistics = async () => {
    try {
      const response = await api.get('/remarks/correspondence-statistics?timeFilter=all');
      
      if (response.data.success) {
        setCorrespondenceStats(response.data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching correspondence statistics:', error);
      // Don't show error toast for correspondence stats failure
    }
  };

  const exportSystemReportWithCorrespondence = () => {
    // Prepare main student data for Excel export
    const excelData = students.map((s, idx) => ({
      '#': idx + 1,
      'Name': `${s.fullName?.firstName || ''} ${s.fullName?.lastName || ''}`.trim(),
      'CNIC': s.cnic || '',
      'Email': s.email || '',
      'Primary Phone': s.phoneNumbers?.primary || s.phoneNumber || '',
      'Secondary Phone': s.phoneNumbers?.secondary || s.secondaryPhone || '',
      'Address': s.address || '',
      'Reference': s.reference || '',
      'Previous School': s.oldSchoolName || s.previousSchool || '',
      'Stage': `Stage ${s.prospectusStage || 1}: ${STAGE_LABELS[(s.prospectusStage || 1) - 1] || 'Unknown'}`,
      'Registration Date': s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '',
      'Last Updated': s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : '',
      'Total Remarks': s.receptionistRemarks ? s.receptionistRemarks.length : 0,
      'Latest Remark': s.receptionistRemarks && s.receptionistRemarks.length > 0 ? 
        s.receptionistRemarks[s.receptionistRemarks.length - 1].remark : 'No remarks',
      'Last Contact Date': s.receptionistRemarks && s.receptionistRemarks.length > 0 ? 
        new Date(s.receptionistRemarks[s.receptionistRemarks.length - 1].timestamp).toLocaleDateString() : 'Never'
    }));

    // Create workbook and add main student sheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for main sheet
    const columnWidths = [
      { wch: 5 },   // #
      { wch: 25 },  // Name
      { wch: 15 },  // CNIC
      { wch: 30 },  // Email
      { wch: 15 },  // Primary Phone
      { wch: 15 },  // Secondary Phone
      { wch: 30 },  // Address
      { wch: 20 },  // Reference
      { wch: 25 },  // Previous School
      { wch: 35 },  // Stage
      { wch: 15 },  // Registration Date
      { wch: 15 },  // Last Updated
      { wch: 12 },  // Total Remarks
      { wch: 40 },  // Latest Remark
      { wch: 15 }   // Last Contact Date
    ];
    worksheet['!cols'] = columnWidths;

    // Add main worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'System Report');

    // Add correspondence details sheet
    const correspondenceData = [];
    students.forEach(student => {
      if (student.receptionistRemarks && student.receptionistRemarks.length > 0) {
        student.receptionistRemarks.forEach((remark, idx) => {
          correspondenceData.push({
            'Student Name': `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.trim(),
            'Student Email': student.email || '',
            'Student Stage': `Stage ${student.prospectusStage || 1}`,
            'Remark #': idx + 1,
            'Remark': remark.remark || '',
            'Receptionist': remark.receptionistName || 'Unknown',
            'Date': new Date(remark.timestamp).toLocaleDateString(),
            'Time': new Date(remark.timestamp).toLocaleTimeString()
          });
        });
      }
    });

    if (correspondenceData.length > 0) {
      const correspondenceSheet = XLSX.utils.json_to_sheet(correspondenceData);
      const corrColumnWidths = [
        { wch: 25 },  // Student Name
        { wch: 30 },  // Student Email
        { wch: 15 },  // Student Stage
        { wch: 10 },  // Remark #
        { wch: 50 },  // Remark
        { wch: 20 },  // Receptionist
        { wch: 12 },  // Date
        { wch: 12 }   // Time
      ];
      correspondenceSheet['!cols'] = corrColumnWidths;
      XLSX.utils.book_append_sheet(workbook, correspondenceSheet, 'Correspondence');
    }

    // Add statistics summary sheet
    const statsData = [
      { 'Metric': 'Total Students', 'Value': students.length },
      { 'Metric': 'Total Correspondence Entries', 'Value': correspondenceStats.totalRemarks },
      { 'Metric': 'Students with Correspondence', 'Value': correspondenceStats.uniqueStudents },
      { 'Metric': 'Students with Records', 'Value': correspondenceStats.totalStudentsWithRemarks },
      { 'Metric': 'Average Remarks per Student', 'Value': correspondenceStats.averageRemarksPerStudent }
    ];
    const statsSheet = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `it_system_report_with_correspondence_${currentDate}.xlsx`;

    // Save the file
    XLSX.writeFile(workbook, filename);
    
    // Show success toast
    toast.dataExported('IT System Report with Correspondence (Excel)');
  };

  const fetchStudents = async () => {
    try {
      setFetching(true);
      setError('');
      const res = await api.get('/users?role=Student&limit=100');
      console.log('Fetched students:', res.data?.data?.users);
      setStudents(res.data?.data?.users || []);
    } catch (err) {
      setError('Failed to load students');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegistering(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        fullName: { firstName: form.firstName, lastName: form.lastName },
        phoneNumber: form.phoneNumber,
        secondaryPhone: form.secondaryPhone,
        gender: form.gender,
        dob: form.dob,
        cnic: form.cnic,
        address: form.address,
        reference: form.reference,
        oldSchoolName: form.oldSchoolName
      };
      const res = await api.post('/students/register', payload);
      setShowModal(false);
      const studentName = `${form.firstName} ${form.lastName}`;
      toast.studentAdded(studentName);
      setForm({ firstName: '', lastName: '', phoneNumber: '', secondaryPhone: '', gender: '', dob: '', cnic: '', address: '', reference: '', oldSchoolName: '' });
      setSuccess(res.data?.message || 'Student registered successfully');
      fetchStudents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setRegistering(false);
    }
  };

  const handleStageChange = (student) => {
    setStageModal({ open: true, student });
  };

  const handleStageSelect = async (newStage) => {
    if (!stageModal.student) return;
    setStageUpdating(true);
    try {
      // Use the users endpoint instead of students/progress endpoint
      const response = await api.put(`/users/${stageModal.student._id}`, { 
        prospectusStage: newStage,
        lastUpdated: new Date().toISOString()
      });
      
      console.log('Stage update response:', response.data);
      
      const studentName = `${stageModal.student.fullName?.firstName} ${stageModal.student.fullName?.lastName}`;
      const oldStage = stageModal.student.prospectusStage || 0;
      const newStageName = STAGE_LABELS[newStage] || 'Unknown Stage';
      
      // Show appropriate toast based on upgrade/downgrade
      if (newStage > oldStage) {
        toast.stageUpgraded(studentName, newStageName);
      } else if (newStage < oldStage) {
        toast.stageDowngraded(studentName, newStageName);
      } else {
        toast.stageChanged(studentName, newStageName);
      }
      
      setStageModal({ open: false, student: null });
      setSuccess('Stage updated successfully');
      fetchStudents(); // Refresh the data
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error updating stage:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      toast.error(`Failed to update stage: ${errorMessage}`);
      setError('Failed to update stage');
    } finally {
      setStageUpdating(false);
    }
  };

  const handleDeleteClick = (student) => {
    setDeleteModal({ open: true, student });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.student) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteModal.student._id}`);
      const studentName = `${deleteModal.student.fullName?.firstName} ${deleteModal.student.fullName?.lastName}`;
      toast.studentDeleted(studentName);
      setDeleteModal({ open: false, student: null });
      setSuccess('Student deleted successfully');
      fetchStudents();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      toast.error('Failed to delete student');
      setError('Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 mt-20">

      {/* System Statistics */}
      <Card className="bg-white/60 backdrop-blur-xl border-border/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-primary flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            System Overview & Correspondence Statistics
          </h3>
          <Button 
            onClick={exportSystemReportWithCorrespondence}
            className="bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            size="sm"
          >
            <Download className="h-4 w-4" />
            Export System Report
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              title: 'Total Students', 
              value: students.length, 
              icon: Users, 
              colorClass: 'bg-blue-100 text-blue-600',
              description: 'Registered students in system'
            },
            { 
              title: 'Total Correspondence', 
              value: correspondenceStats.totalRemarks, 
              icon: MessageSquare, 
              colorClass: 'bg-green-100 text-green-600',
              description: 'Total correspondence entries'
            },
            { 
              title: 'Students Contacted', 
              value: correspondenceStats.uniqueStudents, 
              icon: Users, 
              colorClass: 'bg-purple-100 text-purple-600',
              description: 'Students with communication records'
            },
            { 
              title: 'Avg. Communications', 
              value: correspondenceStats.averageRemarksPerStudent, 
              icon: TrendingUp, 
              colorClass: 'bg-orange-100 text-orange-600',
              description: 'Average communications per student'
            }
          ].map((stat, index) => (
            <div key={index} className="bg-white/40 backdrop-blur-sm border border-border/30 rounded-xl p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.colorClass}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-primary">{stat.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Student Management */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 p-8 transition-all duration-300 hover:shadow-xl hover:bg-white/70" style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)'}}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-primary font-[Sora,Inter,sans-serif] flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            Student Management
          </h3>
          <Button 
            variant="default" 
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg"
          >
            Register New Student
          </Button>
        </div>
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 px-4 py-3 rounded-2xl mb-4 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {error}
              </div>
            </div>
          )}
          {success && (
            <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/60 text-green-700 px-4 py-3 rounded-2xl mb-4 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {success}
              </div>
            </div>
          )}
          {showModal && (
            <div className="fixed top-0 left-0 w-full h-full bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl flex flex-col overflow-hidden"
                   style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.37)'}}>
                
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-border/30 bg-white/40 backdrop-blur-xl flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary/90 to-accent/80 text-white shadow-lg">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-primary font-[Sora,Inter,sans-serif] tracking-tight">
                        Register New Student
                      </h2>
                      <p className="text-sm text-muted-foreground font-medium">
                        Fill in the student information below
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-accent transition-all duration-200 rounded-lg p-2 hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/30 group"
                    aria-label="Close"
                  >
                    <svg className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-white/20 backdrop-blur-md">
                  <div className="max-w-5xl mx-auto p-8 min-h-full">
                    <form onSubmit={handleRegister} className="space-y-8 pb-8">
                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 px-4 py-3 rounded-2xl text-sm shadow-lg animate-fade-in">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          {error}
                        </div>
                      </div>
                    )}

                    {/* Personal Information Card */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-border/30 transition-all duration-200 hover:shadow-xl hover:bg-white/70">
                      <h3 className="text-lg font-bold text-primary font-[Sora,Inter,sans-serif] mb-6 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-primary/80 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={form.firstName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-primary/80 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={form.lastName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-primary/80 mb-2">
                            Gender
                          </label>
                          <select
                            name="gender"
                            value={form.gender}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-primary/80 mb-2">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            name="dob"
                            value={form.dob}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-primary/80 mb-2">
                            CNIC
                          </label>
                          <input
                            type="text"
                            name="cnic"
                            value={form.cnic}
                            onChange={handleInputChange}
                            placeholder="Enter CNIC (e.g., 12345-1234567-1)"
                            className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Card */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-border/30 transition-all duration-200 hover:shadow-xl hover:bg-white/70">
                      <h3 className="text-lg font-bold text-primary font-[Sora,Inter,sans-serif] mb-6 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                        Contact Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-primary/80 mb-2">
                            Primary Phone Number *
                          </label>
                          <input
                            type="text"
                            name="phoneNumber"
                            value={form.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="+923001234567"
                            className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-primary/80 mb-2">
                            Secondary Phone
                          </label>
                          <input
                            type="text"
                            name="secondaryPhone"
                            value={form.secondaryPhone}
                            onChange={handleInputChange}
                            placeholder="+923001234567"
                            className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-primary/80 mb-2">
                            Complete Address
                          </label>
                          <textarea 
                            name="address" 
                            value={form.address} 
                            onChange={handleInputChange} 
                            placeholder="Enter complete address including street, city, and postal code" 
                            rows="3" 
                            className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 resize-none"
                          ></textarea>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information Card */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-border/30 transition-all duration-200 hover:shadow-xl hover:bg-white/70">
                      <h3 className="text-lg font-bold text-primary font-[Sora,Inter,sans-serif] mb-6 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                        Additional Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-primary/80 mb-2">
                            Reference
                          </label>
                          <input
                            type="text"
                            name="reference"
                            value={form.reference}
                            onChange={handleInputChange}
                            placeholder="Enter reference person name"
                            className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-primary/80 mb-2">
                            Previous School/College
                          </label>
                          <input
                            type="text"
                            name="oldSchoolName"
                            value={form.oldSchoolName}
                            onChange={handleInputChange}
                            placeholder="Enter previous institution name"
                            className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
                          />
                        </div>
                      </div>
                    </div>
                    </form>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-4 px-8 py-6 border-t border-border/30 bg-white/40 backdrop-blur-xl flex-shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 text-sm font-semibold border-border/50 hover:bg-white/80 hover:border-primary/30 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={handleRegister}
                    disabled={registering}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {registering ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Registering...
                      </div>
                    ) : (
                      'Register Student'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
              Registered Students
            </h3>
            {fetching ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <span className="text-primary font-medium">Loading students...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student._id} className="bg-white/50 backdrop-blur-sm border border-border/30 rounded-2xl p-6 transition-all duration-200 hover:bg-white/70 hover:shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-lg text-primary">{student.fullName?.firstName} {student.fullName?.lastName}</div>
                        <div className="text-sm text-muted-foreground font-medium">
                          {student.email} | {student.phoneNumbers?.primary || student.phoneNumber}
                          {(student.phoneNumbers?.secondary || student.secondaryPhone) && 
                            ` | Secondary: ${student.phoneNumbers?.secondary || student.secondaryPhone}`
                          }
                        </div>
                        <div className="text-xs text-muted-foreground">
                          CNIC: {student.cnic}
                          {student.address && ` | Address: ${student.address}`}
                          {student.reference && ` | Reference: ${student.reference}`}
                          {(student.oldSchoolName || student.previousSchool) && 
                            ` | Previous School: ${student.oldSchoolName || student.previousSchool}`
                          }
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <span className={`px-4 py-2 rounded-full text-white font-semibold text-sm shadow-lg ${STAGE_COLORS[(student.prospectusStage || 1) - 1]}`}>
                          Stage {(student.prospectusStage || 1)}: {STAGE_LABELS[(student.prospectusStage || 1) - 1] || 'Unknown'}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleStageChange(student)}
                          className="border-border/50 hover:bg-white/50"
                        >
                          Change Stage
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteClick(student)}
                          className="hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {stageModal.open && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-accent text-white p-6 shadow-lg flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-[Sora,Inter,sans-serif]">Change Stage</h3>
                      <p className="text-white/80 text-sm">Update student progression status</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setStageModal({ open: false, student: null })}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 rounded-xl"
                    disabled={stageUpdating}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                
                {/* Content */}
                <div className="p-8">
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-primary mb-2 font-[Sora,Inter,sans-serif]">
                      Student: {stageModal.student?.fullName?.firstName} {stageModal.student?.fullName?.lastName}
                    </h4>
                    <p className="text-sm text-muted-foreground">Select the new stage for this student</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {STAGE_LABELS.map((label, idx) => {
                      const isCurrentStage = stageModal.student.prospectusStage === idx + 1;
                      return (
                        <Button
                          key={label}
                          variant={isCurrentStage ? 'default' : 'outline'}
                          className={`w-full flex items-center justify-between p-4 text-left transition-all duration-200 ${
                            isCurrentStage 
                              ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg' 
                              : 'hover:bg-white/50 hover:border-primary/30'
                          }`}
                          onClick={() => handleStageSelect(idx + 1)}
                          disabled={stageUpdating || isCurrentStage}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${isCurrentStage ? 'bg-white' : STAGE_COLORS[idx]}`}></div>
                            <span className="font-medium">{label}</span>
                          </div>
                          {isCurrentStage && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Current</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Footer */}
                <div className="bg-white/80 backdrop-blur-xl border-t border-border/50 p-6 shadow-lg">
                  <div className="flex justify-end gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setStageModal({ open: false, student: null })} 
                      disabled={stageUpdating}
                      className="px-6 py-3"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {deleteModal.open && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-destructive to-red-600 text-white p-6 shadow-lg flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-[Sora,Inter,sans-serif]">Confirm Delete</h3>
                      <p className="text-white/80 text-sm">This action cannot be undone</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setDeleteModal({ open: false, student: null })}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 rounded-xl"
                    disabled={deleting}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                
                {/* Content */}
                <div className="p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    
                    <h4 className="text-xl font-semibold text-foreground mb-3 font-[Sora,Inter,sans-serif]">
                      Delete Student Record
                    </h4>
                    
                    <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 mb-6">
                      <p className="text-sm text-foreground/80 mb-2">
                        Are you sure you want to delete this student record?
                      </p>
                      <div className="text-sm font-medium text-destructive">
                        <strong>{deleteModal.student?.fullName?.firstName} {deleteModal.student?.fullName?.lastName}</strong>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="text-left">
                          <p className="text-sm font-medium text-amber-800">Warning</p>
                          <p className="text-xs text-amber-700 mt-1">
                            This will permanently remove all student data including records, submissions, and history. This action cannot be reversed.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="bg-white/80 backdrop-blur-xl border-t border-border/50 p-6 shadow-lg">
                  <div className="flex justify-end gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setDeleteModal({ open: false, student: null })} 
                      disabled={deleting}
                      className="px-6 py-3"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteConfirm} 
                      disabled={deleting}
                      className="px-6 py-3 bg-gradient-to-r from-destructive to-red-600 hover:from-destructive/90 hover:to-red-700"
                    >
                      {deleting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Deleting...
                        </div>
                      ) : (
                        'Delete Student'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default ITDashboard; 