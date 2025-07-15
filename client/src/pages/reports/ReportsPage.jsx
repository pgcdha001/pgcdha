import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  GraduationCap, 
  FileText, 
  TrendingUp, 
  Calendar, 
  Download,
  MessageSquare,
  UserX,
  BookOpen,
  ClipboardList,
  Mail
} from 'lucide-react';
import StudentReport from '../admin/StudentReport';
import { default as api } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ReportsPage = () => {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('enquiries');

  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const reportSections = [
    { id: 'enquiries', name: 'Enquiry Reports', icon: MessageSquare, color: 'from-blue-500 to-blue-600' },
    { id: 'correspondence', name: 'Correspondence Reports', icon: Mail, color: 'from-indigo-500 to-indigo-600' },
    { id: 'student-attendance', name: 'Student Attendance Reports', icon: UserX, color: 'from-red-500 to-red-600' },
    { id: 'lecture-attendance', name: 'Lecture Attendance Reports', icon: BookOpen, color: 'from-orange-500 to-orange-600' },
    { id: 'examinations', name: 'Examination Reports', icon: ClipboardList, color: 'from-purple-500 to-purple-600' },
    { id: 'appointments', name: 'Appointment Reports', icon: Calendar, color: 'from-amber-500 to-amber-600' }
  ];

  const renderReportContent = () => {
    switch (activeSection) {
      case 'enquiries':
        return <StudentReport />;
      case 'correspondence':
        return <CorrespondenceReport />;
      case 'student-attendance':
        return <StudentAttendanceReport />;
      case 'lecture-attendance':
        return <LectureAttendanceReport />;
      case 'examinations':
        return <ExaminationReport />;
      case 'appointments':
        return <AppointmentReport />;
      default:
        return <StudentReport />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-[Sora,Inter,sans-serif]">
                Reports & Analytics
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Comprehensive reporting and data analytics dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6 p-2">
          <div className="flex flex-wrap gap-2">
            {reportSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive 
                      ? `bg-gradient-to-r ${section.color} text-white shadow-lg` 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:block">{section.name}</span>
                  <span className="sm:hidden">{section.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Content */}
        {renderReportContent()}
      </div>
    </div>
  );
};

// Placeholder components for different report types
const CorrespondenceReport = () => {
  const [activeCorrespondenceType, setActiveCorrespondenceType] = useState('enquiry');

  const correspondenceTypes = [
    { 
      id: 'enquiry', 
      name: 'Enquiry Correspondence', 
      description: 'Communication with prospective students and families during enquiry stage',
      icon: MessageSquare,
      color: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'student', 
      name: 'Student Correspondence', 
      description: 'Communication with enrolled students regarding attendance, exams, behavior, etc.',
      icon: GraduationCap,
      color: 'from-green-500 to-green-600'
    }
  ];

  const renderCorrespondenceContent = () => {
    switch (activeCorrespondenceType) {
      case 'enquiry':
        return <EnquiryCorrespondenceReport />;
      case 'student':
        return <StudentCorrespondenceReport />;
      default:
        return <EnquiryCorrespondenceReport />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Correspondence Reports</h2>
        <p className="text-gray-600 mb-6">View and analyze communication records between college and students/families</p>
        
        {/* Correspondence Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {correspondenceTypes.map((type) => {
            const Icon = type.icon;
            const isActive = activeCorrespondenceType === type.id;
            
            return (
              <button
                key={type.id}
                onClick={() => setActiveCorrespondenceType(type.id)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  isActive 
                    ? `border-blue-500 bg-gradient-to-r ${type.color} text-white shadow-lg` 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white'}`}>
                    <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${isActive ? 'text-white' : 'text-gray-900'}`}>
                      {type.name}
                    </h3>
                    <p className={`text-sm ${isActive ? 'text-white/90' : 'text-gray-600'}`}>
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Correspondence Content */}
      {renderCorrespondenceContent()}
    </div>
  );
};

const StudentAttendanceReport = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Student Attendance Reports</h2>
    <p className="text-gray-600">Student attendance reporting functionality will be implemented here.</p>
  </div>
);

const LectureAttendanceReport = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Lecture Attendance Reports</h2>
    <p className="text-gray-600">Lecture attendance reporting functionality will be implemented here.</p>
  </div>
);

const ExaminationReport = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Examination Reports</h2>
    <p className="text-gray-600">Examination reporting functionality will be implemented here.</p>
  </div>
);

const AppointmentReport = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Appointment Reports</h2>
    <p className="text-gray-600">Appointment reporting functionality will be implemented here.</p>
  </div>
);

const EnquiryCorrespondenceReport = () => {
  const [correspondenceData, setCorrespondenceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    dateRange: '30', // last 30 days
    stage: 'all',
    gender: 'all',
    searchTerm: ''
  });

  useEffect(() => {
    fetchEnquiryCorrespondence();
  }, []);

  const fetchEnquiryCorrespondence = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch students with enquiry stage correspondence
      const res = await api.get('/users?role=Student&limit=1000');
      
      if (res.data?.data?.users) {
        // Filter students who have receptionist remarks (enquiry correspondence)
        const studentsWithCorrespondence = res.data.data.users
          .filter(student => student.receptionistRemarks && student.receptionistRemarks.length > 0)
          .map(student => ({
            ...student,
            totalRemarks: student.receptionistRemarks.length,
            latestRemark: student.receptionistRemarks[student.receptionistRemarks.length - 1],
            firstContact: student.receptionistRemarks[0],
            lastContact: student.receptionistRemarks[student.receptionistRemarks.length - 1]
          }));
        
        setCorrespondenceData(studentsWithCorrespondence);
      }
    } catch (err) {
      console.error('Failed to fetch enquiry correspondence:', err);
      setError('Failed to load correspondence data');
    } finally {
      setLoading(false);
    }
  };

  // Filter correspondence data
  const filteredData = correspondenceData.filter(student => {
    const matchesStage = filters.stage === 'all' || String(student.prospectusStage || 1) === filters.stage;
    const matchesGender = filters.gender === 'all' || (student.gender && student.gender.toLowerCase() === filters.gender.toLowerCase());
    const matchesSearch = !filters.searchTerm || 
      `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(filters.searchTerm.toLowerCase()));
    
    // Date range filtering
    if (filters.dateRange !== 'all') {
      const daysAgo = parseInt(filters.dateRange);
      let cutoffDate = new Date();
      
      if (daysAgo === 1) {
        // For "Today" filter, set cutoff to start of today
        cutoffDate.setHours(0, 0, 0, 0);
      } else {
        // For other filters, subtract days
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      }
      
      const hasRecentContact = student.receptionistRemarks.some(remark => 
        new Date(remark.timestamp) >= cutoffDate
      );
      
      if (!hasRecentContact) return false;
    }
    
    return matchesStage && matchesGender && matchesSearch;
  });

  // Export functions
  const exportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Enquiry Correspondence Report', 14, 15);
    doc.setFontSize(12);
    doc.text(`Total Records: ${filteredData.length}`, 14, 25);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);
    
    const tableData = filteredData.map((student, idx) => [
      idx + 1,
      `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.trim(),
      student.email || '',
      student.gender || 'Not specified',
      `Stage ${student.prospectusStage || 1}`,
      student.totalRemarks,
      new Date(student.lastContact.timestamp).toLocaleDateString(),
      student.lastContact.remark ? student.lastContact.remark.substring(0, 40) + '...' : ''
    ]);
    
    autoTable(doc, {
      head: [['#', 'Name', 'Email', 'Gender', 'Stage', 'Total Contacts', 'Last Contact', 'Latest Remark']],
      body: tableData,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save(`enquiry_correspondence_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const excelData = filteredData.map((student, idx) => ({
      '#': idx + 1,
      'Name': `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.trim(),
      'Email': student.email || '',
      'Gender': student.gender || 'Not specified',
      'Phone': student.phoneNumber || student.phone || '',
      'Stage': `Stage ${student.prospectusStage || 1}`,
      'Total Contacts': student.totalRemarks,
      'First Contact Date': new Date(student.firstContact.timestamp).toLocaleDateString(),
      'Last Contact Date': new Date(student.lastContact.timestamp).toLocaleDateString(),
      'Latest Remark': student.lastContact.remark || '',
      'Latest Contact By': student.lastContact.receptionistName || 'Unknown'
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Enquiry Correspondence');
    XLSX.writeFile(wb, `enquiry_correspondence_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Enquiry Correspondence Report
          </h3>
          <p className="text-gray-600 text-sm mt-1">Communication records with prospective students during enquiry stage</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportPDF}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
          <button
            onClick={exportExcel}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
          <select
            value={filters.stage}
            onChange={(e) => setFilters(prev => ({ ...prev, stage: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Stages</option>
            <option value="1">Stage 1: Not Purchased</option>
            <option value="2">Stage 2: Purchased</option>
            <option value="3">Stage 3: Returned</option>
            <option value="4">Stage 4: Admission Fee Submitted</option>
            <option value="5">Stage 5: 1st Installment Submitted</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            value={filters.gender}
            onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchEnquiryCorrespondence}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <TrendingUp className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
          <div className="text-2xl font-bold">{filteredData.length}</div>
          <div className="text-blue-100 text-sm">Total Enquiries with Correspondence</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
          <div className="text-2xl font-bold">
            {filteredData.reduce((sum, student) => sum + student.totalRemarks, 0)}
          </div>
          <div className="text-green-100 text-sm">Total Correspondence Records</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
          <div className="text-2xl font-bold">
            {filteredData.filter(s => {
              const lastContactDate = new Date(s.lastContact.timestamp);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return lastContactDate >= today;
            }).length}
          </div>
          <div className="text-purple-100 text-sm">Today's Contacts</div>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading correspondence data...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">#</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Gender</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Stage</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Total Contacts</th>
                <th className="border border-gray-300 px-4 py-2 text-left">First Contact</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Last Contact</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Latest Remark</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    No correspondence records found
                  </td>
                </tr>
              ) : (
                filteredData.map((student, index) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {`${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.trim()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{student.email || 'N/A'}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        student.gender?.toLowerCase() === 'male' 
                          ? 'bg-sky-100 text-sky-800' 
                          : student.gender?.toLowerCase() === 'female'
                          ? 'bg-pink-100 text-pink-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.gender || 'Not specified'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        Stage {student.prospectusStage || 1}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {student.totalRemarks}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {new Date(student.firstContact.timestamp).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {new Date(student.lastContact.timestamp).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm max-w-xs">
                      <div className="truncate" title={student.lastContact.remark}>
                        {student.lastContact.remark || 'No remark'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        by {student.lastContact.receptionistName || 'Unknown'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const StudentCorrespondenceReport = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
      <GraduationCap className="h-5 w-5 text-green-500" />
      Student Correspondence Report
    </h3>
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <p className="text-green-800 font-medium mb-2">📋 What this includes:</p>
      <ul className="text-green-700 text-sm space-y-1 ml-4">
        <li>• Communication with enrolled students</li>
        <li>• Attendance-related notices</li>
        <li>• Exam performance discussions</li>
        <li>• Behavioral concerns and improvements</li>
        <li>• Academic progress updates</li>
        <li>• Parent-teacher meeting records</li>
      </ul>
    </div>
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <p className="text-gray-600 italic">📊 Student correspondence reporting functionality will be implemented here.</p>
    </div>
  </div>
);

export default ReportsPage;
