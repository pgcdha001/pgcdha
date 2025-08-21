import React from 'react';

const TimetableStats = ({ timetableData, pendingChanges, classes }) => {
  // Calculate statistics from timetable data and pending changes
  const calculateStats = () => {
    let onTime = 0;
    let late5to9 = 0;
    let late10plus = 0;
    let replaced = 0;
    let absent = 0;
    let notMarked = 0;
    let total = 0;

    // Process existing data
    Object.values(timetableData).forEach(classData => {
      Object.values(classData).forEach(cell => {
        if (cell.isBreak || cell.isEmpty) return;
        
        total++;
        switch (cell.status) {
          case 'on-time':
            onTime++;
            break;
          case 'late':
            if (cell.minutesLate >= 10) {
              late10plus++;
            } else {
              late5to9++;
            }
            break;
          case 'replaced':
            replaced++;
            break;
          case 'absent':
            absent++;
            break;
          case 'not-marked':
            notMarked++;
            break;
        }
      });
    });

    // Process pending changes
    Object.values(pendingChanges).forEach(change => {
      const cell = timetableData[change.classId]?.[change.timeSlot];
      if (!cell || cell.isBreak || cell.isEmpty) return;
      
      // Remove from old category
      switch (cell.status) {
        case 'on-time':
          onTime--;
          break;
        case 'late':
          if (cell.minutesLate >= 10) {
            late10plus--;
          } else {
            late5to9--;
          }
          break;
        case 'replaced':
          replaced--;
          break;
        case 'absent':
          absent--;
          break;
        case 'not-marked':
          notMarked--;
          break;
      }
      
      // Add to new category
      switch (change.status) {
        case 'on-time':
          onTime++;
          break;
        case 'late':
          if (change.lateMinutes >= 10) {
            late10plus++;
          } else {
            late5to9++;
          }
          break;
        case 'replaced':
          replaced++;
          break;
        case 'absent':
          absent++;
          break;
        case 'cancelled':
          // Cancelled counts as absent for stats
          absent++;
          break;
      }
    });

    return {
      onTime,
      late5to9,
      late10plus,
      replaced,
      absent,
      notMarked,
      total
    };
  };

  const stats = calculateStats();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Attendance Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
        <div className="bg-green-100 p-3 rounded text-center">
          <div className="font-semibold text-green-800">On Time</div>
          <div className="text-green-600">{stats.onTime}</div>
        </div>
        
        <div className="bg-yellow-100 p-3 rounded text-center">
          <div className="font-semibold text-yellow-800">5-9 Min Late</div>
          <div className="text-yellow-600">{stats.late5to9}</div>
        </div>
        
        <div className="bg-red-100 p-3 rounded text-center">
          <div className="font-semibold text-red-800">10+ Min Late</div>
          <div className="text-red-600">{stats.late10plus}</div>
        </div>
        
        <div className="bg-purple-100 p-3 rounded text-center">
          <div className="font-semibold text-purple-800">Replaced</div>
          <div className="text-purple-600">{stats.replaced}</div>
        </div>
        
        <div className="bg-gray-100 p-3 rounded text-center">
          <div className="font-semibold text-gray-800">Absent</div>
          <div className="text-gray-600">{stats.absent}</div>
        </div>
        
        <div className="bg-blue-100 p-3 rounded text-center">
          <div className="font-semibold text-blue-800">Not Marked</div>
          <div className="text-blue-600">{stats.notMarked}</div>
        </div>
      </div>
      
      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Classes:</span>
          <span className="font-semibold">{stats.total}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Marked:</span>
          <span className="font-semibold text-green-600">
            {stats.total - stats.notMarked} ({stats.total > 0 ? Math.round(((stats.total - stats.notMarked) / stats.total) * 100) : 0}%)
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Pending Changes:</span>
          <span className="font-semibold text-blue-600">
            {Object.keys(pendingChanges).length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimetableStats;
