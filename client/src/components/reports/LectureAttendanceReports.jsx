import React, { useState, useCallback } from 'react';
import { BookOpen, AlertTriangle, Download, Search, Users, Clock, BarChart3, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const LectureAttendanceReports = ({ config }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [teacherAttendance, setTeacherAttendance] = useState([]);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    campus: '',
    status: 'all' // all, late, absent
  });

  const loadTeacherAttendance = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = `/teacher-attendance/report/daily/${filters.startDate}`;
      
      // If date range is more than a day, get monthly data
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        const year = start.getFullYear();
        const month = start.getMonth() + 1;
        endpoint = `/teacher-attendance/report/monthly/${year}/${month}`;
      }

      const response = await api.get(endpoint);
      if (response.data.success) {
        setTeacherAttendance(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading teacher attendance:', error);
      toast.error('Failed to load teacher attendance data');
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate, toast]);

  // Filter teacher attendance data based on status
  const filteredTeacherAttendance = teacherAttendance.filter(record => {
    // Filter by campus
    if (filters.campus) {
      // Assuming teacher data has campus info or we derive it from floor/grade
      const teacherCampus = record.teacherId?.campus || record.campus;
      if (teacherCampus !== filters.campus) return false;
    }

    // Filter by status
    if (filters.status === 'late') {
      return record.status === 'present' && record.lateMinutes > 0;
    }
    if (filters.status === 'absent') {
      return record.status === 'absent';
    }
    
    return true; // 'all' shows everything
  });

  const calculateStats = () => {
    const dataToUse = filteredTeacherAttendance.length > 0 ? filteredTeacherAttendance : teacherAttendance;
    if (!dataToUse.length) return { totalLectures: 0, onTime: 0, late: 0, absent: 0 };

    let onTime = 0, late = 0, absent = 0;
    
    dataToUse.forEach(record => {
      if (record.status === 'present') {
        if (record.lateMinutes > 0) {
          late++;
        } else {
          onTime++;
        }
      } else {
        absent++;
      }
    });

    return {
      totalLectures: dataToUse.length,
      onTime,
      late,
      absent,
      punctualityRate: dataToUse.length > 0 ? ((onTime / dataToUse.length) * 100).toFixed(1) : 0
    };
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const stats = calculateStats();
    
    // Title
    doc.setFontSize(20);
    doc.text('Teacher Attendance Report', 20, 20);
    
    // Report info
    doc.setFontSize(12);
    doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 20, 35);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    
    // Summary stats
    doc.text(`Total Lectures: ${stats.totalLectures}`, 20, 60);
    doc.text(`On Time: ${stats.onTime}`, 20, 70);
    doc.text(`Late: ${stats.late}`, 20, 80);
    doc.text(`Absent: ${stats.absent}`, 20, 90);
    doc.text(`Punctuality Rate: ${stats.punctualityRate}%`, 20, 100);
    
    // Attendance table
    if (filteredTeacherAttendance.length > 0) {
      const tableData = filteredTeacherAttendance.map(record => [
        record.teacherId?.fullName?.firstName + ' ' + record.teacherId?.fullName?.lastName || 'Unknown',
        record.date,
        record.subject || 'N/A',
        record.status,
        record.lateMinutes > 0 ? `${record.lateMinutes} min` : 'On Time'
      ]);

      autoTable(doc, {
        head: [['Teacher Name', 'Date', 'Subject', 'Status', 'Late Minutes']],
        body: tableData,
        startY: 115,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] }
      });
    }
    
    doc.save(`teacher-attendance-${filters.startDate}-${filters.endDate}.pdf`);
    toast.success('PDF report generated successfully');
  };

  const exportToExcel = () => {
    const stats = calculateStats();
    
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Teacher Attendance Report'],
      [''],
      ['Period', `${filters.startDate} to ${filters.endDate}`],
      ['Generated', new Date().toLocaleDateString()],
      [''],
      ['Total Lectures', stats.totalLectures],
      ['On Time', stats.onTime],
      ['Late', stats.late],
      ['Absent', stats.absent],
      ['Punctuality Rate', `${stats.punctualityRate}%`]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Detailed sheet
    if (filteredTeacherAttendance.length > 0) {
      const detailedData = [
        ['Teacher Name', 'Date', 'Subject', 'Status', 'Late Minutes', 'Floor']
      ];
      
      filteredTeacherAttendance.forEach(record => {
        detailedData.push([
          record.teacherId?.fullName?.firstName + ' ' + record.teacherId?.fullName?.lastName || 'Unknown',
          record.date,
          record.subject || 'N/A',
          record.status,
          record.lateMinutes || 0,
          record.floor || 'N/A'
        ]);
      });
      
      const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed');
    }
    
    XLSX.writeFile(workbook, `teacher-attendance-${filters.startDate}-${filters.endDate}.xlsx`);
    toast.success('Excel report generated successfully');
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Teacher Attendance Reports</h2>
            <p className="text-sm text-gray-600">
              Monitor teacher punctuality and lecture attendance
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campus
            </label>
            <select 
              value={filters.campus}
              onChange={(e) => setFilters({...filters, campus: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Campus</option>
              <option value="Boys">Boys Campus</option>
              <option value="Girls">Girls Campus</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Filter
            </label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Teachers</option>
              <option value="late">Late Only</option>
              <option value="absent">Absent Only</option>
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <Button onClick={loadTeacherAttendance} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Generate Report'}
          </Button>
          
          {config?.canExport && filteredTeacherAttendance.length > 0 && (
            <>
              <Button onClick={exportToPDF} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={exportToExcel} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </>
          )}
        </div>

        {/* Summary Stats */}
        {teacherAttendance.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Lectures</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalLectures}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-600 font-medium">On Time</p>
                  <p className="text-2xl font-bold text-green-900">{stats.onTime}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Late</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.late}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">Punctuality Rate</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.punctualityRate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Table */}
        {teacherAttendance.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Teacher Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Subject</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Late Minutes</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Performance</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeacherAttendance.map((record, index) => {
                  const performance = record.status === 'present' && record.lateMinutes === 0 ? 'Excellent' :
                                    record.status === 'present' && record.lateMinutes <= 5 ? 'Good' :
                                    record.status === 'present' ? 'Needs Improvement' : 'Absent';
                  const performanceColor = performance === 'Excellent' ? 'text-green-600 bg-green-100' :
                                         performance === 'Good' ? 'text-blue-600 bg-blue-100' :
                                         performance === 'Needs Improvement' ? 'text-yellow-600 bg-yellow-100' :
                                         'text-red-600 bg-red-100';
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">
                        {record.teacherId?.fullName?.firstName} {record.teacherId?.fullName?.lastName}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{record.date}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{record.subject || 'N/A'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'present' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {record.lateMinutes > 0 ? `${record.lateMinutes} min` : 'On Time'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${performanceColor}`}>
                          {performance}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* No data message */}
        {!loading && teacherAttendance.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Teacher Attendance Data</h3>
            <p className="text-gray-600">
              No teacher attendance records found for the selected period. Click "Generate Report" to load data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LectureAttendanceReports;
