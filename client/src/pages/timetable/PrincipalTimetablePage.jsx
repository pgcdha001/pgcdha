import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const PrincipalTimetablePage = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timetableData, setTimetableData] = useState({});
  const [loading, setLoading] = useState(false);

  // Time slots for Girls (8:00 AM - 1:20 PM)
  const girlsTimeSlots = [
    { start: '08:00', end: '08:40', label: '8:00 - 8:40' },
    { start: '08:40', end: '09:20', label: '8:40 - 9:20' },
    { start: '09:20', end: '10:00', label: '9:20 - 10:00' },
    { start: '10:00', end: '10:40', label: '10:00 - 10:40' },
    { start: '10:40', end: '11:20', label: '10:40 - 11:20' },
    { start: '11:20', end: '12:00', label: '11:20 - 12:00' }, // Break
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
    { start: '12:00', end: '12:40', label: '12:00 - 12:40' }, // Break
    { start: '12:40', end: '13:20', label: '12:40 - 1:20' },
    { start: '13:20', end: '14:00', label: '1:20 - 2:00' },
  ];

  // Dummy classes for each section
  const classes = {
    '11-Girls': ['11-G-A', '11-G-B', '11-G-C', '11-G-D'],
    '11-Boys': ['11-B-A', '11-B-B', '11-B-C', '11-B-D'],
    '12-Girls': ['12-G-A', '12-G-B', '12-G-C'],
    '12-Boys': ['12-B-A', '12-B-B', '12-B-C'],
  };

  // Generate dummy timetable data with attendance status
  const generateDummyData = () => {
    const data = {};
    const teachers = [
      'Mr. Ahmed Khan', 'Ms. Sara Ali', 'Dr. Muhammad Hassan', 'Ms. Ayesha Malik',
      'Mr. Imran Sheikh', 'Ms. Fatima Noor', 'Dr. Ali Raza', 'Ms. Khadija Ahmad',
      'Mr. Usman Tariq', 'Ms. Zainab Hussain', 'Dr. Fahad Iqbal', 'Ms. Maryam Shah'
    ];
    
    const subjects = [
      'Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Urdu',
      'Computer Science', 'Economics', 'Psychology', 'Islamiat'
    ];

    const attendanceStatuses = [
      { status: 'on-time', weight: 60 }, // 60% on time
      { status: 'late-5', weight: 20 },  // 20% 5 min late
      { status: 'late-10+', weight: 10 }, // 10% 10+ min late
      { status: 'replaced', weight: 8 },  // 8% replaced
      { status: 'absent', weight: 2 }     // 2% absent/cancelled
    ];

    const getRandomStatus = () => {
      const random = Math.random() * 100;
      let cumulative = 0;
      for (const { status, weight } of attendanceStatuses) {
        cumulative += weight;
        if (random <= cumulative) return status;
      }
      return 'on-time';
    };

    Object.keys(classes).forEach(section => {
      const timeSlots = section.includes('Girls') ? girlsTimeSlots : boysTimeSlots;
      data[section] = {};
      
      classes[section].forEach(className => {
        data[section][className] = {};
        
        timeSlots.forEach(slot => {
          // Skip break time
          if ((section.includes('Girls') && slot.start === '11:20') || 
              (section.includes('Boys') && slot.start === '12:00')) {
            data[section][className][slot.start] = {
              isBreak: true,
              label: 'BREAK'
            };
            return;
          }

          const teacher = teachers[Math.floor(Math.random() * teachers.length)];
          const subject = subjects[Math.floor(Math.random() * subjects.length)];
          const status = getRandomStatus();
          
          let attendanceInfo = {};
          switch (status) {
            case 'late-5':
              attendanceInfo = { minutesLate: Math.floor(Math.random() * 5) + 1, status: 'late' };
              break;
            case 'late-10+':
              attendanceInfo = { minutesLate: Math.floor(Math.random() * 20) + 10, status: 'late' };
              break;
            case 'replaced':
              attendanceInfo = { 
                status: 'replaced',
                originalTeacher: teacher,
                replacementTeacher: teachers[Math.floor(Math.random() * teachers.length)]
              };
              break;
            case 'absent':
              attendanceInfo = { status: 'absent' };
              break;
            default:
              attendanceInfo = { status: 'on-time' };
          }

          data[section][className][slot.start] = {
            teacher,
            subject,
            timeSlot: slot,
            ...attendanceInfo
          };
        });
      });
    });

    return data;
  };

  useEffect(() => {
    // Generate dummy data when component mounts or date changes
    setLoading(true);
    setTimeout(() => {
      setTimetableData(generateDummyData());
      setLoading(false);
    }, 500);
  }, [selectedDate]);

  const getCellStyle = (cellData) => {
    if (cellData.isBreak) {
      return 'bg-gray-200 text-gray-600';
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
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getCellContent = (cellData) => {
    if (cellData.isBreak) {
      return <div className="text-center font-semibold">{cellData.label}</div>;
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
      </div>
    );
  };

  const renderTimetableSection = (section, title) => {
    const timeSlots = section.includes('Girls') ? girlsTimeSlots : boysTimeSlots;
    const sectionClasses = classes[section];
    const sectionData = timetableData[section] || {};

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
                {sectionClasses.map(className => (
                  <th key={className} className="border border-gray-300 bg-gray-100 px-3 py-2 text-center font-semibold min-w-[150px]">
                    {className}
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
                  {sectionClasses.map(className => {
                    const cellData = sectionData[className]?.[slot.start] || {};
                    return (
                      <td 
                        key={`${className}-${slot.start}`} 
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
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
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
