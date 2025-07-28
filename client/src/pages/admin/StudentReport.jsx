import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '../../components/ui/button';
import Card from '../../components/ui/card';
import { default as api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { FileDown, FileSpreadsheet, FileText, CalendarDays, AlertTriangle } from 'lucide-react';
import DateFilter from '../../components/enquiry/DateFilter';
import CustomDateRange from '../../components/enquiry/CustomDateRange';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const STAGE_LABELS = [
  'Not Purchased',
  'Purchased',
  'Returned',
  'Admission Fee Submitted',
  '1st Installment Submitted'
];

// Helper function to extract notes from remark text
const extractNotesFromRemark = (remark) => {
  if (!remark) return 'No notes';
  
  // Check if this is a level change remark
  const notesMatch = remark.match(/Notes:\s*(.+)$/);
  if (notesMatch && notesMatch[1]) {
    return notesMatch[1].trim();
  }
  
  // If it's not a level change remark, return the full remark
  return remark;
};

const StudentReport = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [cnicFilter, setCnicFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  
  // Date filter states
  const [selectedDate, setSelectedDate] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customDatesApplied, setCustomDatesApplied] = useState(false);
  const [isCustomDateLoading, setIsCustomDateLoading] = useState(false);
  
  // Non-progression filter states
  const [showNonProgression, setShowNonProgression] = useState(false);
  const [progressionLevel, setProgressionLevel] = useState('');

  const dateFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('role', 'Student');
      params.append('limit', '1000');
      
      // Add date filter parameters (only if not custom, or if custom and dates are applied)
      if (selectedDate !== 'all' && selectedDate !== 'custom') {
        params.append('dateFilter', selectedDate);
      } else if (selectedDate === 'custom' && customStartDate && customEndDate && customDatesApplied) {
        params.append('dateFilter', 'custom');
        params.append('startDate', customStartDate);
        params.append('endDate', customEndDate);
      }
      
      // Add non-progression filter parameters
      if (showNonProgression && progressionLevel) {
        params.append('nonProgression', 'true');
        params.append('progressionLevel', progressionLevel);
      }
      
      const queryString = params.toString();
      const url = `/users?${queryString}`;
      
      const res = await api.get(url);
      setStudents(res.data?.data?.users || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, customStartDate, customEndDate, customDatesApplied, showNonProgression, progressionLevel]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Date filter handlers
  const handleDateChange = (dateValue) => {
    setSelectedDate(dateValue);
    if (dateValue !== 'custom') {
      setCustomDatesApplied(false);
      // Reset custom dates when switching away from custom
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const handleStartDateChange = (date) => {
    setCustomStartDate(date);
    // Don't trigger API call on date input changes
  };

  const handleEndDateChange = (date) => {
    setCustomEndDate(date);
    // Don't trigger API call on date input changes
  };

  const handleApplyCustomDates = async () => {
    if (customStartDate && customEndDate) {
      setIsCustomDateLoading(true);
      setCustomDatesApplied(true);
      // The useEffect will trigger fetchStudents when customDatesApplied changes
      setTimeout(() => {
        setIsCustomDateLoading(false);
      }, 500);
    }
  };

  // Non-progression filter handlers
  const handleNonProgressionToggle = () => {
    const newShowNonProgression = !showNonProgression;
    setShowNonProgression(newShowNonProgression);
    
    if (newShowNonProgression) {
      // When enabling non-progression filter, reset stage filter to "All Stages"
      setStageFilter('');
      if (!progressionLevel) {
        setProgressionLevel('2'); // Default to Level 2
      }
    }
  };

  const handleProgressionLevelChange = (level) => {
    setProgressionLevel(level);
  };

  // Filtered students (cumulative approach)
  const filteredStudents = students.filter((s) => {
    // Cumulative stage match - Level 2 includes Level 3 students, etc.
    const currentStage = s.prospectusStage || 1;
    const matchesStage = !stageFilter || currentStage >= parseInt(stageFilter);
    const matchesName = !nameFilter || (`${s.fullName?.firstName || ''} ${s.fullName?.lastName || ''}`.toLowerCase().includes(nameFilter.toLowerCase()));
    const matchesCnic = !cnicFilter || (s.cnic || '').includes(cnicFilter);
    const matchesGender = !genderFilter || (s.gender || 'Not specified').toLowerCase() === genderFilter.toLowerCase();
    return matchesStage && matchesName && matchesCnic && matchesGender;
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Create title with filter information
    let title = 'Student Report';
    const filterInfo = [];
    if (stageFilter) {
      const stageName = STAGE_LABELS[parseInt(stageFilter) - 1];
      filterInfo.push(`Stage: ${stageName}`);
    }
    if (genderFilter) {
      filterInfo.push(`Gender: ${genderFilter}`);
    }
    if (nameFilter) {
      filterInfo.push(`Name: ${nameFilter}`);
    }
    if (cnicFilter) {
      filterInfo.push(`CNIC: ${cnicFilter}`);
    }
    
    if (filterInfo.length > 0) {
      title += ` (Filtered: ${filterInfo.join(', ')})`;
    }
    
    doc.text(title, 14, 16);
    doc.text(`Total Records: ${filteredStudents.length}`, 14, 24);
    
    const tableData = filteredStudents.map((s, idx) => [
      idx + 1,
      `${s.fullName?.firstName || ''} ${s.fullName?.lastName || ''}`.trim(),
      s.cnic || '',
      s.email || '',
      s.gender || 'Not specified',
      `Stage ${s.prospectusStage || 1}: ${STAGE_LABELS[(s.prospectusStage || 1) - 1] || 'Unknown'}`,
      s.receptionistRemarks && s.receptionistRemarks.length > 0 ? 
        `${s.receptionistRemarks.length} remarks` : 'No remarks'
    ]);
    autoTable(doc, {
      head: [['#', 'Name', 'CNIC', 'Email', 'Gender', 'Stage', 'Correspondence']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [26, 35, 126] }
    });
    
    // Add correspondence details on a new page if there are remarks
    const studentsWithRemarks = filteredStudents.filter(s => s.receptionistRemarks && s.receptionistRemarks.length > 0);
    if (studentsWithRemarks.length > 0) {
      doc.addPage();
      doc.text('Correspondence Details', 14, 16);
      
      let startY = 25;
      studentsWithRemarks.forEach(student => {
        const studentName = `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.trim();
        doc.text(`Student: ${studentName}`, 14, startY);
        startY += 7;
        
        const remarksData = student.receptionistRemarks.map((remark, idx) => [
          idx + 1,
          extractNotesFromRemark(remark.remark || ''),
          remark.receptionistName || 'Unknown',
          new Date(remark.timestamp).toLocaleDateString()
        ]);
        
        autoTable(doc, {
          head: [['#', 'Remark', 'By', 'Date']],
          body: remarksData,
          startY: startY,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [26, 35, 126] },
          margin: { left: 20 }
        });
        
        startY = doc.lastAutoTable.finalY + 10;
        if (startY > 250) {
          doc.addPage();
          startY = 20;
        }
      });
    }
    
    doc.save('student_report_with_correspondence.pdf');
    
    // Show success toast
    toast.dataExported('Student Report with Correspondence (PDF)');
  };

  const exportExcel = () => {
    // Prepare main student data for Excel export
    const excelData = filteredStudents.map((s, idx) => ({
      '#': idx + 1,
      'Name': `${s.fullName?.firstName || ''} ${s.fullName?.lastName || ''}`.trim(),
      'CNIC': s.cnic || '',
      'Email': s.email || '',
      'Gender': s.gender || 'Not specified',
      'Primary Phone': s.phoneNumbers?.primary || s.phoneNumber || s.phone || '',
      'Secondary Phone': s.phoneNumbers?.secondary || s.secondaryPhone || '',
      'Address': s.address || '',
      'Reference': s.reference || '',
      'Previous School': s.oldSchoolName || s.previousSchool || '',
      'Stage': `Stage ${s.prospectusStage || 1}: ${STAGE_LABELS[(s.prospectusStage || 1) - 1] || 'Unknown'}`,
      'Registration Date': s.registrationDate || '',
      'Last Updated': s.lastUpdated || '',
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
      { wch: 12 },  // Gender
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Add correspondence details sheet
    const correspondenceData = [];
    filteredStudents.forEach(student => {
      if (student.receptionistRemarks && student.receptionistRemarks.length > 0) {
        student.receptionistRemarks.forEach((remark, idx) => {
          correspondenceData.push({
            'Student Name': `${student.fullName?.firstName || ''} ${student.fullName?.lastName || ''}`.trim(),
            'Student Email': student.email || '',
            'Remark #': idx + 1,
            'Remark': extractNotesFromRemark(remark.remark || ''),
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
        { wch: 10 },  // Remark #
        { wch: 50 },  // Remark
        { wch: 20 },  // Receptionist
        { wch: 12 },  // Date
        { wch: 12 }   // Time
      ];
      correspondenceSheet['!cols'] = corrColumnWidths;
      XLSX.utils.book_append_sheet(workbook, correspondenceSheet, 'Correspondence');
    }

    // Generate filename with filter information
    const filterParts = [];
    if (stageFilter) filterParts.push(`stage${stageFilter}`);
    if (genderFilter) filterParts.push(genderFilter);
    if (nameFilter) filterParts.push('name');
    if (cnicFilter) filterParts.push('cnic');
    
    const filterSuffix = filterParts.length > 0 ? `_${filterParts.join('_')}` : '';
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `student_report_with_correspondence${filterSuffix}_${currentDate}.xlsx`;

    // Save the file
    XLSX.writeFile(workbook, filename);
    
    // Show success toast
    toast.dataExported('Student Report with Correspondence (Excel)');
  };

  const exportCSV = () => {
    // Prepare data for CSV export with correspondence
    const csvData = filteredStudents.map((s, idx) => ({
      '#': idx + 1,
      'Name': `${s.fullName?.firstName || ''} ${s.fullName?.lastName || ''}`.trim(),
      'CNIC': s.cnic || '',
      'Email': s.email || '',
      'Gender': s.gender || 'Not specified',
      'Phone': s.phone || '',
      'Stage': `Stage ${s.prospectusStage || 1}: ${STAGE_LABELS[(s.prospectusStage || 1) - 1] || 'Unknown'}`,
      'Registration Date': s.registrationDate || '',
      'Last Updated': s.lastUpdated || '',
      'Total Remarks': s.receptionistRemarks ? s.receptionistRemarks.length : 0,
      'Latest Remark': s.receptionistRemarks && s.receptionistRemarks.length > 0 ? 
        s.receptionistRemarks[s.receptionistRemarks.length - 1].remark.replace(/"/g, '""') : 'No remarks',
      'Last Contact Date': s.receptionistRemarks && s.receptionistRemarks.length > 0 ? 
        new Date(s.receptionistRemarks[s.receptionistRemarks.length - 1].timestamp).toLocaleDateString() : 'Never'
    }));

    // Convert to CSV format
    const csvHeaders = Object.keys(csvData[0] || {}).join(',');
    const csvRows = csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','));
    const csvContent = [csvHeaders, ...csvRows].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      // Generate filename with filter information
      const filterParts = [];
      if (stageFilter) filterParts.push(`stage${stageFilter}`);
      if (genderFilter) filterParts.push(genderFilter);
      if (nameFilter) filterParts.push('name');
      if (cnicFilter) filterParts.push('cnic');
      
      const filterSuffix = filterParts.length > 0 ? `_${filterParts.join('_')}` : '';
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `student_report_with_correspondence${filterSuffix}_${currentDate}.csv`;
      
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Show success toast
    toast.dataExported('Student Report with Correspondence (CSV)');
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className=" bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-border/50 p-8 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/90 to-accent/80 text-white shadow-lg">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-primary mb-2 font-[Sora,Inter,sans-serif] tracking-tight">Student Report</h2>
              <p className="text-muted-foreground font-medium">Comprehensive student data and analytics</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button 
              onClick={exportPDF} 
              variant="default"
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FileDown className="w-5 h-5 mr-2" />
              Export as PDF
            </Button>
            <Button 
              onClick={exportExcel} 
              variant="default"
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              Export as Excel
            </Button>
            <Button 
              onClick={exportCSV} 
              variant="default"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FileText className="w-5 h-5 mr-2" />
              Export as CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Total Students */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 lg:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 min-w-0">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <div className="p-2 lg:p-3 bg-white/20 rounded-xl flex-shrink-0">
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <span className="text-xl lg:text-2xl font-bold truncate ml-2">{students.length}</span>
          </div>
          <h3 className="text-base lg:text-lg font-semibold truncate">Total Students</h3>
          <p className="text-blue-100 text-xs lg:text-sm truncate">All registered students</p>
        </div>

        {/* Male Students */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 lg:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 min-w-0">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <div className="p-2 lg:p-3 bg-white/20 rounded-xl flex-shrink-0">
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-xl lg:text-2xl font-bold truncate ml-2">{students.filter(s => (s.gender || '').toLowerCase() === 'male').length}</span>
          </div>
          <h3 className="text-base lg:text-lg font-semibold truncate">Male Students</h3>
          <p className="text-indigo-100 text-xs lg:text-sm truncate">{((students.filter(s => (s.gender || '').toLowerCase() === 'male').length / students.length) * 100 || 0).toFixed(1)}% of total</p>
        </div>

        {/* Female Students */}
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-4 lg:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 min-w-0">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <div className="p-2 lg:p-3 bg-white/20 rounded-xl flex-shrink-0">
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-xl lg:text-2xl font-bold truncate ml-2">{students.filter(s => (s.gender || '').toLowerCase() === 'female').length}</span>
          </div>
          <h3 className="text-base lg:text-lg font-semibold truncate">Female Students</h3>
          <p className="text-pink-100 text-xs lg:text-sm truncate">{((students.filter(s => (s.gender || '').toLowerCase() === 'female').length / students.length) * 100 || 0).toFixed(1)}% of total</p>
        </div>

        {/* Unspecified Gender */}
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl p-4 lg:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 min-w-0">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <div className="p-2 lg:p-3 bg-white/20 rounded-xl flex-shrink-0">
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl lg:text-2xl font-bold truncate ml-2">{students.filter(s => !s.gender || s.gender === 'Not specified').length}</span>
          </div>
          <h3 className="text-base lg:text-lg font-semibold truncate">Unspecified</h3>
          <p className="text-gray-100 text-xs lg:text-sm truncate">Gender not specified</p>
        </div>
      </div>

      {/* Stage Analytics */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 p-6 transition-all duration-300 hover:shadow-xl hover:bg-white/70" style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)'}}>
        <h3 className="text-lg font-bold text-primary mb-4 font-[Sora,Inter,sans-serif] flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
          Stage Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {STAGE_LABELS.map((label, idx) => {
            // Cumulative counting - Level 2 includes Level 3 students, etc.
            const stageCount = students.filter(s => (s.prospectusStage || 1) >= (idx + 1)).length;
            const percentage = ((stageCount / students.length) * 100 || 0).toFixed(1);
            
            return (
              <div key={idx} className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20 hover:shadow-lg transition-all duration-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">{stageCount}</div>
                  <div className="text-sm font-semibold text-primary/80 mb-1">Stage {idx + 1}+</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-xs text-primary/60 mt-1">{percentage}% of total</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 p-6 transition-all duration-300 hover:shadow-xl hover:bg-white/70" style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)'}}>
        <h3 className="text-lg font-bold text-primary mb-4 font-[Sora,Inter,sans-serif] flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
          Filters
        </h3>
        
        {/* Custom Date Range */}
        {selectedDate === 'custom' && (
          <CustomDateRange 
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            customDatesApplied={customDatesApplied}
            isCustomDateLoading={isCustomDateLoading}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onApplyFilters={handleApplyCustomDates}
            loading={loading}
          />
        )}
        
        {/* Main Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-semibold text-primary/80 mb-2">Date Range</label>
            <DateFilter 
              selectedDate={selectedDate}
              dateFilters={dateFilters}
              onDateChange={handleDateChange}
              loading={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-primary/80 mb-2">Stage</label>
            <select
              className={`w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90 ${
                showNonProgression ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
              }`}
              value={showNonProgression ? '' : stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              disabled={showNonProgression}
            >
              <option value="">All Stages</option>
              {STAGE_LABELS.map((label, idx) => (
                <option key={label} value={String(idx + 1)}>
                  Stage {idx + 1}: {label}
                </option>
              ))}
            </select>
            {showNonProgression && (
              <div className="text-xs text-gray-500 mt-1">Auto-set to All</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary/80 mb-2">Name</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
              placeholder="Search by name"
              value={nameFilter}
              onChange={e => setNameFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary/80 mb-2">CNIC</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
              placeholder="Search by CNIC"
              value={cnicFilter}
              onChange={e => setCnicFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary/80 mb-2">Gender</label>
            <select
              className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
              value={genderFilter}
              onChange={e => setGenderFilter(e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Not specified">Not Specified</option>
            </select>
          </div>
        </div>
        
        {/* Non-Progression Filter Row */}
        <div className="pt-4 border-t border-border/20">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="nonProgressionReport"
                checked={showNonProgression}
                onChange={handleNonProgressionToggle}
                className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
              />
              <label htmlFor="nonProgressionReport" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span>Show Non-Progressed Students</span>
              </label>
            </div>
            
            {showNonProgression && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">From Stage:</span>
                <select
                  value={progressionLevel}
                  onChange={(e) => handleProgressionLevelChange(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Stage</option>
                  <option value="2">Stage 2 (didn't progress from Stage 1)</option>
                  <option value="3">Stage 3 (didn't progress from Stage 2)</option>
                  <option value="4">Stage 4 (didn't progress from Stage 3)</option>
                  <option value="5">Stage 5 (didn't progress from Stage 4)</option>
                </select>
              </div>
            )}
          </div>
          
          {showNonProgression && progressionLevel && (
            <div className="mt-2 text-sm text-orange-600 bg-orange-50 p-2 rounded-lg">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Showing students who did not progress to Stage {progressionLevel}
            </div>
          )}
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 p-6 transition-all duration-300 hover:shadow-xl hover:bg-white/70" style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)'}}>
        <h3 className="text-lg font-bold text-primary mb-4 font-[Sora,Inter,sans-serif] flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
          Student Data ({filteredStudents.length} students)
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <span className="text-primary font-medium">Loading students...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 px-4 py-3 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              {error}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-primary to-accent text-white">
                  <th className="px-6 py-4 text-left text-sm font-bold rounded-tl-xl">#</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">CNIC</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Gender</th>
                  <th className="px-6 py-4 text-left text-sm font-bold rounded-tr-xl">Stage</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 backdrop-blur-sm">
                {filteredStudents.map((s, idx) => (
                  <tr key={s._id} className="border-b border-border/30 hover:bg-white/70 transition-all duration-200">
                    <td className="px-6 py-4 text-sm font-medium text-primary">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-primary">{`${s.fullName?.firstName || ''} ${s.fullName?.lastName || ''}`.trim()}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-medium">{s.cnic}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-medium">{s.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        (s.gender || '').toLowerCase() === 'male' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        (s.gender || '').toLowerCase() === 'female' ? 'bg-pink-100 text-pink-700 border border-pink-200' :
                        'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {s.gender || 'Not specified'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20">
                        Stage {s.prospectusStage || 1}: {STAGE_LABELS[(s.prospectusStage || 1) - 1] || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentReport; 