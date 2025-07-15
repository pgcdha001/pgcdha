import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import Card from '../../components/ui/card';
import { default as api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { FileDown, FileSpreadsheet, FileText } from 'lucide-react';
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

const StudentReport = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [cnicFilter, setCnicFilter] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users?role=Student&limit=1000');
      setStudents(res.data?.data?.users || []);
    } catch (err) {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  // Filtered students
  const filteredStudents = students.filter((s) => {
    const matchesStage = !stageFilter || String(s.prospectusStage || 1) === stageFilter;
    const matchesName = !nameFilter || (`${s.fullName?.firstName || ''} ${s.fullName?.lastName || ''}`.toLowerCase().includes(nameFilter.toLowerCase()));
    const matchesCnic = !cnicFilter || (s.cnic || '').includes(cnicFilter);
    return matchesStage && matchesName && matchesCnic;
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Student Report', 14, 16);
    const tableData = filteredStudents.map((s, idx) => [
      idx + 1,
      `${s.fullName?.firstName || ''} ${s.fullName?.lastName || ''}`.trim(),
      s.cnic || '',
      s.email || '',
      `Stage ${s.prospectusStage || 1}: ${STAGE_LABELS[(s.prospectusStage || 1) - 1] || 'Unknown'}`,
      s.receptionistRemarks && s.receptionistRemarks.length > 0 ? 
        `${s.receptionistRemarks.length} remarks` : 'No remarks'
    ]);
    autoTable(doc, {
      head: [['#', 'Name', 'CNIC', 'Email', 'Stage', 'Correspondence']],
      body: tableData,
      startY: 22,
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
          remark.remark || '',
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
        { wch: 10 },  // Remark #
        { wch: 50 },  // Remark
        { wch: 20 },  // Receptionist
        { wch: 12 },  // Date
        { wch: 12 }   // Time
      ];
      correspondenceSheet['!cols'] = corrColumnWidths;
      XLSX.utils.book_append_sheet(workbook, correspondenceSheet, 'Correspondence');
    }

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `student_report_with_correspondence_${currentDate}.xlsx`;

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
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `student_report_with_correspondence_${currentDate}.csv`;
      
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

      {/* Filters Card */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 p-6 transition-all duration-300 hover:shadow-xl hover:bg-white/70" style={{boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)'}}>
        <h3 className="text-lg font-bold text-primary mb-4 font-[Sora,Inter,sans-serif] flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-primary/80 mb-2">Stage</label>
            <select
              className="w-full px-4 py-3 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
            >
              <option value="">All Stages</option>
              {STAGE_LABELS.map((label, idx) => (
                <option key={label} value={String(idx + 1)}>
                  Stage {idx + 1}: {label}
                </option>
              ))}
            </select>
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