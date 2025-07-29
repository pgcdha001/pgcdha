import React from 'react';
import { Clock, User, School, BookOpen, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const TimetableGrid = ({ timetableData, classes, teachers, onEdit, onDelete }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  // Group timetable data by day and time for grid display
  const groupedData = days.reduce((acc, day) => {
    acc[day] = timetableData.filter(entry => entry.dayOfWeek === day);
    return acc;
  }, {});

  const getEntryAtTime = (day, timeSlot) => {
    return groupedData[day]?.find(entry => {
      const entryStartTime = entry.startTime;
      return entryStartTime === timeSlot;
    });
  };

  const getEntryDuration = (startTime, endTime) => {
    const start = timeSlots.indexOf(startTime);
    const end = timeSlots.indexOf(endTime);
    return end - start;
  };

  const getClassColor = (classId) => {
    const classObj = classes.find(c => c._id === classId);
    if (!classObj) return 'bg-gray-100';
    
    const colors = [
      'bg-blue-100 border-blue-300',
      'bg-green-100 border-green-300',
      'bg-purple-100 border-purple-300',
      'bg-yellow-100 border-yellow-300',
      'bg-pink-100 border-pink-300',
      'bg-indigo-100 border-indigo-300',
      'bg-red-100 border-red-300',
      'bg-teal-100 border-teal-300'
    ];
    
    const hash = classObj.name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Grid View */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Timetable Grid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="p-3 bg-gray-50 rounded-lg text-center font-medium text-gray-700">
                  Time
                </div>
                {days.map(day => (
                  <div key={day} className="p-3 bg-gray-50 rounded-lg text-center font-medium text-gray-700">
                    {day}
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              {timeSlots.map((timeSlot, timeIndex) => (
                <div key={timeSlot} className="grid grid-cols-8 gap-2 mb-2">
                  {/* Time Column */}
                  <div className="p-3 bg-gray-50 rounded-lg text-center text-sm font-medium text-gray-600 flex items-center justify-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {timeSlot}
                  </div>

                  {/* Day Columns */}
                  {days.map(day => {
                    const entry = getEntryAtTime(day, timeSlot);
                    
                    if (entry) {
                      const duration = getEntryDuration(entry.startTime, entry.endTime);
                      const colorClass = getClassColor(entry.classId?._id);
                      
                      return (
                        <div
                          key={`${day}-${timeSlot}`}
                          className={`p-3 rounded-lg border-2 ${colorClass} relative group`}
                          style={{ gridRowEnd: `span ${Math.max(1, duration)}` }}
                        >
                          <div className="space-y-1">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {entry.subject}
                            </div>
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <School className="h-3 w-3" />
                              {entry.classId?.name}
                            </div>
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {entry.teacherId?.fullName?.split(' ')[0]}
                            </div>
                            <div className="text-xs text-gray-500">
                              {entry.startTime} - {entry.endTime}
                            </div>
                            <Badge 
                              variant={entry.lectureType === 'Theory' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {entry.lectureType}
                            </Badge>
                          </div>

                          {/* Actions (visible on hover) */}
                          {(onEdit || onDelete) && (
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              {onEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
                                  onClick={() => onEdit(entry)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              )}
                              {onDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 bg-white/80 hover:bg-white text-red-600 hover:text-red-700"
                                  onClick={() => onDelete(entry._id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`${day}-${timeSlot}`}
                        className="p-3 bg-gray-25 border border-gray-200 rounded-lg min-h-[80px] flex items-center justify-center text-gray-400"
                      >
                        <span className="text-xs">Free</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day-wise Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map(day => {
          const dayEntries = groupedData[day] || [];
          const totalClasses = dayEntries.length;
          const uniqueTeachers = new Set(dayEntries.map(e => e.teacherId?._id)).size;
          const uniqueClasses = new Set(dayEntries.map(e => e.classId?._id)).size;
          
          return (
            <Card key={day}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{day}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Classes:</span>
                    <Badge variant="outline">{totalClasses}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Teachers:</span>
                    <Badge variant="outline">{uniqueTeachers}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Classes:</span>
                    <Badge variant="outline">{uniqueClasses}</Badge>
                  </div>
                  
                  {dayEntries.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Today's Schedule:</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {dayEntries
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map(entry => (
                            <div key={entry._id} className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                              <span className="font-medium">{entry.subject}</span>
                              <span className="text-gray-500">{entry.startTime}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TimetableGrid;
