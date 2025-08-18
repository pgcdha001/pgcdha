import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { timetableAPI } from '../../services/timetableAPI';
import { classesAPI } from '../../services/classesAPI';
import { teacherAttendanceAPI } from '../../services/teacherAttendanceAPI';

const PrincipalTimetablePage = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timetableData, setTimetableData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState({});

  // Time slots for Girls (8:00 AM - 1:20 PM)
  const girlsTimeSlots = [
    { start: '08:00', end: '08:40', label: '8:00 - 8:40' },
    { start: '08:40', end: '09:20', label: '8:40 - 9:20' },
    { start: '09:20', end: '10:00', label: '9:20 - 10:00' },
    { start: '10:00', end: '10:40', label: '10:00 - 10:40' },
    { start: '10:40', end: '11:20', label: '10:40 - 11:20' },
    { start: '11:20', end: '12:00', label: '11:20 - 12:00' }, // Break for girls
    { start: '12:00', end: '12:40', label: '12:00 - 12:40' },
    { start: '12:40', end: '13:20', label: '12:40 - 1:20' },
  ];

  // Time slots for Boys (8:40 AM - 2:00 PM)
  const boysTimeSlots = [
    { start: '08:40', end: '09:20', label: '8:40 - 9:20' },
    { start: '09:20', end: '10:00', label: '9:20 - 10:00' },
    { start: '10:00', end: '10:40', label: '10:00 - 10:40' },
    { start: '10:40', end: '11:20', label: '10:40 - 11:20' },
    { start: '11:20', end: '12:00', label: '11:20 - 12:00' },
    { start: '12:00', end: '12:40', label: '12:00 - 12:40' }, // Break for boys
    { start: '12:40', end: '13:20', label: '12:40 - 1:20' },
    { start: '13:20', end: '14:00', label: '1:20 - 2:00' },
  ];

  // Floor to section mapping
  const floorToSection = {
    1: '11-Boys',
    2: '12-Boys', 
    3: '11-Girls',
    4: '12-Girls'
  };

  // Fetch real timetable and attendance data
  const fetchTimetableData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get day of week for the selected date
      const queryDate = new Date(selectedDate);
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][queryDate.getDay()];
      
      // Get all classes grouped by floors
      const classesResponse = await classesAPI.getClasses();
      const allClasses = classesResponse.classes || classesResponse.data || [];
      
      // Group classes by floor
      const classesByFloor = {};
      allClasses.forEach(cls => {
        const floor = cls.floor;
        if (!classesByFloor[floor]) {
          classesByFloor[floor] = [];
        }
        classesByFloor[floor].push(cls);
      });
      setClasses(classesByFloor);

      // Get timetable data for all floors
      const floors = [1, 2, 3, 4];
      const timetablePromises = floors.map(floor => 
        timetableAPI.getFloorTimetable(floor, dayOfWeek)
      );
      
      // Get attendance data for the selected date
      const attendancePromise = teacherAttendanceAPI.getAttendanceByDate(selectedDate);
      
      const [timetableResponses, attendanceResponse] = await Promise.all([
        Promise.allSettled(timetablePromises),
        attendancePromise.catch(() => ({ data: [] }))
      ]);

      // Process timetable data
      const processedData = {};
      const attendanceMap = {};
      
      // Create attendance lookup map
      if (attendanceResponse.data) {
        attendanceResponse.data.forEach(record => {
          const key = `${record.teacherId._id}_${record.timetableId}`;
          attendanceMap[key] = {
            status: record.status,
            lateMinutes: record.lateMinutes,
            lateType: record.lateType,
            remarks: record.coordinatorRemarks || record.remarks
          };
        });
      }

      // Process each floor's timetable
      floors.forEach((floor, index) => {
        const section = floorToSection[floor];
        processedData[section] = {};
        
        if (timetableResponses[index].status === 'fulfilled') {
          const floorTimetable = timetableResponses[index].value.timetable || [];
          
          // Group classes for this floor
          const floorClasses = classesByFloor[floor] || [];
          floorClasses.forEach(cls => {
            processedData[section][cls.name] = {};
            
            // Get time slots based on section
            const timeSlots = section.includes('Girls') ? girlsTimeSlots : boysTimeSlots;
            
            timeSlots.forEach(slot => {
              // Check if this is break time
              if ((section.includes('Girls') && slot.start === '11:20') || 
                  (section.includes('Boys') && slot.start === '12:00')) {
                processedData[section][cls.name][slot.start] = {
                  isBreak: true,
                  label: 'BREAK'
                };
                return;
              }

              // Find timetable entry for this class and time slot
              const timetableEntry = floorTimetable.find(entry => 
                entry.class && entry.class.name === cls.name && 
                entry.startTime === slot.start
              );

              if (timetableEntry) {
                const teacherId = timetableEntry.teacher._id;
                const timetableId = timetableEntry._id;
                const attendanceKey = `${teacherId}_${timetableId}`;
                const attendance = attendanceMap[attendanceKey];

                let cellData = {
                  teacher: `${timetableEntry.teacher.fullName.firstName} ${timetableEntry.teacher.fullName.lastName}`,
                  subject: timetableEntry.subject,
                  timeSlot: slot,
                  timetableId,
                  teacherId,
                  status: 'not-marked' // Default if no attendance record
                };

                // Add attendance information if available
                if (attendance) {
                  switch (attendance.status) {
                    case 'On Time':
                      cellData.status = 'on-time';
                      break;
                    case 'Late':
                      cellData.status = 'late';
                      cellData.minutesLate = attendance.lateMinutes || 0;
                      break;
                    case 'Absent':
                      cellData.status = 'absent';
                      break;
                    case 'Cancelled':
                      cellData.status = 'cancelled';
                      break;
                    default:
                      cellData.status = 'not-marked';
                  }
                  if (attendance.remarks) {
                    cellData.remarks = attendance.remarks;
                  }
                }

                processedData[section][cls.name][slot.start] = cellData;
              } else {
                // No scheduled class for this time slot
                processedData[section][cls.name][slot.start] = {
                  isEmpty: true
                };
              }
            });
          });
        }
      });

      setTimetableData(processedData);
      
    } catch (error) {
      console.error('Error fetching timetable data:', error);
      setError('Failed to load timetable data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch real data when component mounts or date changes
    fetchTimetableData();
  }, [selectedDate]);

  const getCellStyle = (cellData) => {
    if (cellData.isBreak) {
      return 'bg-gray-200 text-gray-600';
    }

    if (cellData.isEmpty) {
      return 'bg-gray-50 text-gray-400';
    }

    switch (cellData.status) {
      case 'on-time':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'late':
        if (cellData.minutesLate >= 10) {
          return 'bg-red-100 border-red-300 text-red-800'; // 10+ minutes late
        } else {
          return 'bg-yellow-100 border-yellow-300 text-yellow-800'; // 5-9 minutes late
        }
      case 'replaced':
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'absent':
        return 'bg-gray-100 border-gray-300 text-gray-500';
      case 'cancelled':
        return 'bg-orange-100 border-orange-300 text-orange-700';
      case 'not-marked':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getCellContent = (cellData) => {
    if (cellData.isBreak) {
      return <div className="text-center font-semibold">{cellData.label}</div>;
    }

    if (cellData.isEmpty) {
      return <div className="text-center text-xs text-gray-400">No Class</div>;
    }

    return (
      <div className="p-1 text-xs">
        <div className="font-semibold text-gray-900 truncate">
          {cellData.status === 'replaced' ? cellData.replacementTeacher : cellData.teacher}
        </div>
        <div className="text-gray-600 truncate">{cellData.subject}</div>
        {cellData.status === 'late' && (
          <div className="text-xs font-medium">
            {cellData.minutesLate} min late
          </div>
        )}
        {cellData.status === 'replaced' && (
          <div className="text-xs">
            Replaced {cellData.originalTeacher}
          </div>
        )}
        {cellData.status === 'absent' && (
          <div className="text-xs font-medium">Absent</div>
        )}
        {cellData.status === 'cancelled' && (
          <div className="text-xs font-medium">Cancelled</div>
        )}
        {cellData.status === 'not-marked' && (
          <div className="text-xs font-medium">Not Marked</div>
        )}
        {cellData.remarks && (
          <div className="text-xs italic text-gray-500 truncate" title={cellData.remarks}>
            {cellData.remarks}
          </div>
        )}
      </div>
    );
  };

  const renderTimetableSection = (section, title) => {
    const timeSlots = section.includes('Girls') ? girlsTimeSlots : boysTimeSlots;
    const floorNumber = section === '11-Girls' ? 3 : section === '11-Boys' ? 1 : section === '12-Girls' ? 4 : 2;
    const sectionClasses = classes[floorNumber] || [];
    const sectionData = timetableData[section] || {};

    if (sectionClasses.length === 0) {
      return (
        <div key={section} className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
          <div className="text-center py-8 text-gray-500">
            No classes found for this section
          </div>
        </div>
      );
    }

    return (
      <div key={section} className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            {/* Header with class names */}
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-semibold">
                  Time
                </th>
                {sectionClasses.map(cls => (
                  <th key={cls._id} className="border border-gray-300 bg-gray-100 px-3 py-2 text-center font-semibold min-w-[150px]">
                    {cls.name}
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Timetable rows */}
            <tbody>
              {timeSlots.map(slot => (
                <tr key={slot.start}>
                  <td className="border border-gray-300 bg-gray-50 px-3 py-2 font-medium text-sm">
                    {slot.label}
                  </td>
                  {sectionClasses.map(cls => {
                    const cellData = sectionData[cls.name]?.[slot.start] || { isEmpty: true };
                    return (
                      <td 
                        key={`${cls.name}-${slot.start}`} 
                        className={`border border-gray-300 p-1 h-16 ${getCellStyle(cellData)}`}
                      >
                        {getCellContent(cellData)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Statistics for this section */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
          <div className="bg-green-100 p-3 rounded text-center">
            <div className="font-semibold text-green-800">On Time</div>
            <div className="text-green-600">
              {Object.values(sectionData).reduce((acc, classData) => 
                acc + Object.values(classData).filter(cell => cell.status === 'on-time').length, 0
              )}
            </div>
          </div>
          <div className="bg-yellow-100 p-3 rounded text-center">
            <div className="font-semibold text-yellow-800">5+ Min Late</div>
            <div className="text-yellow-600">
              {Object.values(sectionData).reduce((acc, classData) => 
                acc + Object.values(classData).filter(cell => cell.status === 'late' && cell.minutesLate < 10).length, 0
              )}
            </div>
          </div>
          <div className="bg-red-100 p-3 rounded text-center">
            <div className="font-semibold text-red-800">10+ Min Late</div>
            <div className="text-red-600">
              {Object.values(sectionData).reduce((acc, classData) => 
                acc + Object.values(classData).filter(cell => cell.status === 'late' && cell.minutesLate >= 10).length, 0
              )}
            </div>
          </div>
          <div className="bg-purple-100 p-3 rounded text-center">
            <div className="font-semibold text-purple-800">Replaced</div>
            <div className="text-purple-600">
              {Object.values(sectionData).reduce((acc, classData) => 
                acc + Object.values(classData).filter(cell => cell.status === 'replaced').length, 0
              )}
            </div>
          </div>
          <div className="bg-gray-100 p-3 rounded text-center">
            <div className="font-semibold text-gray-800">Absent</div>
            <div className="text-gray-600">
              {Object.values(sectionData).reduce((acc, classData) => 
                acc + Object.values(classData).filter(cell => cell.status === 'absent').length, 0
              )}
            </div>
          </div>
          <div className="bg-blue-100 p-3 rounded text-center">
            <div className="font-semibold text-blue-800">Not Marked</div>
            <div className="text-blue-600">
              {Object.values(sectionData).reduce((acc, classData) => 
                acc + Object.values(classData).filter(cell => cell.status === 'not-marked').length, 0
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading timetable data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchTimetableData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Principal Timetable Overview
          </h1>
          <p className="text-gray-600">
            Real-time attendance tracking for all classes and teachers
          </p>
          
          {/* Date selector */}
          <div className="mt-4 flex items-center gap-4">
            <label htmlFor="date" className="text-sm font-medium text-gray-700">
              Date:
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>On Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>5-9 Min Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span>10+ Min Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
              <span>Replaced</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span>Not Marked</span>
            </div>
          </div>
        </div>

        {/* Timetable Sections */}
        <div className="space-y-8">
          {renderTimetableSection('11-Girls', '11th Grade - Girls Campus')}
          {renderTimetableSection('11-Boys', '11th Grade - Boys Campus')}
          {renderTimetableSection('12-Girls', '12th Grade - Girls Campus')}
          {renderTimetableSection('12-Boys', '12th Grade - Boys Campus')}
        </div>
      </div>
    </div>
  );
};

export default PrincipalTimetablePage;
