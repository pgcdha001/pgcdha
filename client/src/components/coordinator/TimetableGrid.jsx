import React from 'react';
import TimetableCell from './TimetableCell';

const TimetableGrid = ({
  classes,
  timeSlots,
  timetableData,
  attendanceData,
  pendingChanges,
  onAttendanceChange,
  userRole,
  assignedFloor
}) => {
  if (classes.length === 0) {
    return (
      <div className="mb-8">
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <p className="font-medium text-gray-600">No classes with timetables found</p>
          <p className="text-sm text-gray-500 mt-1">Classes will appear here once timetables are created for this floor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Floor {assignedFloor} Timetable
        </h2>
        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          {classes.length} classe{classes.length !== 1 ? 's' : ''} with timetables
        </div>
      </div>
      
      <div className="overflow-x-auto border border-gray-300 rounded-lg">
        <div className="min-w-max">
          <table className="w-full border-collapse">
            {/* Header with time slots */}
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-semibold sticky left-0 z-10 min-w-[120px]">
                  Class
                </th>
                {timeSlots.map(slot => (
                  <th key={slot.start} className="border border-gray-300 bg-gray-100 px-3 py-2 text-center font-semibold min-w-[180px]">
                    {slot.label}
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Timetable rows */}
            <tbody>
              {classes.map(cls => (
                <tr key={cls._id}>
                  <td className="border border-gray-300 bg-gray-50 px-3 py-2 font-medium text-sm sticky left-0 z-10 min-w-[120px]">
                    {cls.name}
                  </td>
                  {timeSlots.map(slot => {
                    const cellData = timetableData[cls.name]?.[slot.start] || { isEmpty: true };
                    const changeKey = `${cls.name}_${slot.start}`;
                    const pendingChange = pendingChanges[changeKey];
                    
                    return (
                      <td 
                        key={`${cls.name}-${slot.start}`} 
                        className="border border-gray-300 p-1 h-16 min-w-[180px]"
                      >
                        <TimetableCell
                          cellData={cellData}
                          pendingChange={pendingChange}
                          onAttendanceChange={(status, lateMinutes) => 
                            onAttendanceChange(cls.name, slot.start, status, lateMinutes)
                          }
                          userRole={userRole}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimetableGrid;
