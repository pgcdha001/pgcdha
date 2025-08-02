import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  Building,
  School,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import { useApiWithToast } from '../../hooks/useApiWithToast';
import api from '../../services/api';
import * as XLSX from 'xlsx';

const StudentAttendanceManagement = () => {
  const { user } = useAuth();
  const { handleApiResponse, toast } = useApiWithToast();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [coordinatorFloors, setCoordinatorFloors] = useState([]);
  const [floorClasses, setFloorClasses] = useState({});
  const [studentsData, setStudentsData] = useState({});
  const [attendanceData, setAttendanceData] = useState({});
  const [expandedFloors, setExpandedFloors] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Floor mapping
  const floorNames = {
    1: '11th Boys',
    2: '12th Boys', 
    3: '11th Girls',
    4: '12th Girls'
  };

  useEffect(() => {
    loadCoordinatorData();
  }, []);

  useEffect(() => {
    if (coordinatorFloors.length > 0) {
      loadStudentAttendanceData();
    }
  }, [selectedDate, coordinatorFloors]);

  const loadCoordinatorData = async () => {
    try {
      setLoading(true);
      
      // Get floors that this coordinator is responsible for
      const floorsResponse = await handleApiResponse(
        async () => api.get(`/classes/coordinator-floors/${user.id}`)
      );
      
      const floors = floorsResponse.data?.floors || [];
      setCoordinatorFloors(floors);
      
      // Expand all floors by default
      setExpandedFloors(new Set(floors));
      
      // Load classes for each floor
      const classesData = {};
      const studentsDataTemp = {};
      
      for (const floor of floors) {
        // Get classes for this floor
        const classesResponse = await handleApiResponse(
          async () => api.get(`/classes?floor=${floor}&isActive=true`)
        );
        
        const classes = classesResponse.data?.classes || [];
        classesData[floor] = classes;
        
        // Load students for each class
        for (const classItem of classes) {
          const studentsResponse = await handleApiResponse(
            async () => api.get(`/classes/${classItem._id}/students`)
          );
          
          const students = studentsResponse.data?.students || [];
          studentsDataTemp[classItem._id] = students;
        }
      }
      
      setFloorClasses(classesData);
      setStudentsData(studentsDataTemp);
      
    } catch (error) {
      console.error('Error loading coordinator data:', error);
      toast.error('Failed to load coordinator data');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentAttendanceData = async () => {
    try {
      const attendanceMap = {};
      
      // Load attendance for all classes
      for (const floor of coordinatorFloors) {
        const classes = floorClasses[floor] || [];
        
        for (const classItem of classes) {
          const response = await handleApiResponse(
            async () => api.get(`/attendance/class/${classItem._id}/date/${selectedDate}`)
          );
          
          const attendanceRecords = response.data || [];
          attendanceRecords.forEach(record => {
            const key = `${classItem._id}_${record.studentId}`;
            attendanceMap[key] = {
              status: record.status,
              markedAt: record.markedAt,
              markedBy: record.markedBy
            };
          });
        }
      }
      
      setAttendanceData(attendanceMap);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  const markStudentAttendance = async (classId, studentId, status) => {
    const key = `${classId}_${studentId}`;
    
    // Set saving state
    setSaving(prev => ({ ...prev, [key]: true }));
    
    // Update local state immediately
    setAttendanceData(prev => ({
      ...prev,
      [key]: {
        status,
        markedAt: new Date().toISOString(),
        markedBy: user.id
      }
    }));

    try {
      await handleApiResponse(
        async () => api.post('/attendance/mark', {
          studentId,
          classId,
          date: selectedDate,
          status,
          markedBy: user.id
        }),
        {
          successMessage: `Student marked as ${status}`,
          errorMessage: 'Failed to mark attendance'
        }
      );
    } catch (error) {
      // Revert on error
      setAttendanceData(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    } finally {
      setSaving(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  };

  const markAllClassPresent = async (classId) => {
    const students = studentsData[classId] || [];
    const unmarkedStudents = students.filter(student => {
      const key = `${classId}_${student._id}`;
      return !attendanceData[key];
    });

    for (const student of unmarkedStudents) {
      await markStudentAttendance(classId, student._id, 'present');
    }
  };

  const toggleFloorExpansion = (floor) => {
    setExpandedFloors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(floor)) {
        newSet.delete(floor);
      } else {
        newSet.add(floor);
      }
      return newSet;
    });
  };

  const getFloorStats = (floor) => {
    const classes = floorClasses[floor] || [];
    let total = 0, present = 0, absent = 0, unmarked = 0;
    
    classes.forEach(classItem => {
      const students = studentsData[classItem._id] || [];
      total += students.length;
      
      students.forEach(student => {
        const key = `${classItem._id}_${student._id}`;
        const attendance = attendanceData[key];
        
        if (attendance) {
          if (attendance.status === 'present') present++;
          else if (attendance.status === 'absent') absent++;
        } else {
          unmarked++;
        }
      });
    });
    
    return { total, present, absent, unmarked };
  };

  const getClassStats = (classId) => {
    const students = studentsData[classId] || [];
    let present = 0, absent = 0, unmarked = 0;
    
    students.forEach(student => {
      const key = `${classId}_${student._id}`;
      const attendance = attendanceData[key];
      
      if (attendance) {
        if (attendance.status === 'present') present++;
        else if (attendance.status === 'absent') absent++;
      } else {
        unmarked++;
      }
    });
    
    return { total: students.length, present, absent, unmarked };
  };

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Create summary sheet
      const summaryData = [
        ['Student Attendance Report'],
        ['Date:', selectedDate],
        ['Coordinator:', `${user.fullName?.firstName || ''} ${user.fullName?.lastName || ''}`.trim()],
        ['Generated:', new Date().toLocaleString()],
        [''],
        ['Floor', 'Total Students', 'Present', 'Absent', 'Unmarked', 'Attendance %']
      ];
      
      coordinatorFloors.forEach(floor => {
        const stats = getFloorStats(floor);
        const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
        summaryData.push([
          `Floor ${floor} (${floorNames[floor]})`,
          stats.total,
          stats.present,
          stats.absent,
          stats.unmarked,
          `${percentage}%`
        ]);
      });
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Create detailed sheets for each floor
      coordinatorFloors.forEach(floor => {
        const classes = floorClasses[floor] || [];
        const floorData = [
          [`Floor ${floor} - ${floorNames[floor]} Attendance`],
          ['Date:', selectedDate],
          [''],
          ['Class', 'Student Name', 'Roll Number', 'Status', 'Marked At', 'Marked By']
        ];
        
        classes.forEach(classItem => {
          const students = studentsData[classItem._id] || [];
          
          students.forEach(student => {
            const key = `${classItem._id}_${student._id}`;
            const attendance = attendanceData[key];
            
            floorData.push([
              classItem.name,
              student.fullName?.firstName && student.fullName?.lastName 
                ? `${student.fullName.firstName} ${student.fullName.lastName}`
                : student.name || 'Unknown',
              student.rollNumber || 'N/A',
              attendance?.status || 'Not Marked',
              attendance?.markedAt ? new Date(attendance.markedAt).toLocaleString() : '',
              attendance?.markedBy || ''
            ]);
          });
        });
        
        const floorSheet = XLSX.utils.aoa_to_sheet(floorData);
        XLSX.utils.book_append_sheet(workbook, floorSheet, `Floor ${floor}`);
      });
      
      // Save file
      const fileName = `student-attendance-${selectedDate}-floors-${coordinatorFloors.join('-')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success('Attendance report exported successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export attendance report');
    }
  };

  const filteredStudentsForClass = (classId) => {
    const students = studentsData[classId] || [];
    if (!searchTerm) return students;
    
    return students.filter(student => {
      const name = student.fullName?.firstName && student.fullName?.lastName 
        ? `${student.fullName.firstName} ${student.fullName.lastName}`
        : student.name || '';
      const rollNumber = student.rollNumber || '';
      
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  if (loading && coordinatorFloors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (coordinatorFloors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Floors Assigned</h3>
          <p className="text-gray-500">You are not assigned as coordinator for any floors.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2