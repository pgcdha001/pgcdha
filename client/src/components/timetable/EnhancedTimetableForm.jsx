import React, { useState, useEffect } from 'react';
import { X, Plus, Clock, User, BookOpen, Calendar, Trash2, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';

const EnhancedTimetableForm = ({ classes, teachers, onSubmit, onClose, editingTimetable }) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [weekSchedule, setWeekSchedule] = useState({});
  const [errors, setErrors] = useState({});

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  const lectureTypes = ['Theory', 'Practical', 'Lab', 'Tutorial', 'Seminar'];
  
  // Standard subjects for consistency
  const subjects = [
    'Mathematics',
    'Physics', 
    'Chemistry',
    'Biology',
    'Computer Science',
    'English',
    'Urdu',
    'Islamic Studies',
    'Pakistan Studies',
    'Accounting',
    'Business Studies',
    'Economics',
    'Banking',
    'Commercial Geography',
    'Statistics',
    'Psychology', 
    'Sociology',
    'History',
    'Geography',
    'Physical Education',
    'Ethics'
  ];

  useEffect(() => {
    // Initialize empty schedule for all days
    const initialSchedule = {};
    daysOfWeek.forEach(day => {
      initialSchedule[day] = [];
    });
    setWeekSchedule(initialSchedule);
  }, []);

  const addDayBlock = (day) => {
    setWeekSchedule(prev => ({
      ...prev,
      [day]: prev[day] || []
    }));
  };

  const copyFromPreviousDay = (targetDay, sourceDay) => {
    setWeekSchedule(prev => {
      const sourceLectures = prev[sourceDay] || [];
      const copiedLectures = sourceLectures.map(lecture => ({
        ...lecture,
        id: Date.now() + Math.random() // Generate new unique ID
      }));
      
      return {
        ...prev,
        [targetDay]: copiedLectures
      };
    });
  };

  const removeDayBlock = (day) => {
    setWeekSchedule(prev => {
      const updated = { ...prev };
      delete updated[day];
      return updated;
    });
  };

  const addLectureToDay = (day) => {
    const newLecture = {
      id: Date.now(),
      lectureName: '',
      subject: '',
      startTime: '',
      duration: 60,
      endTime: '',
      teacherId: '',
      type: 'Theory'
    };

    setWeekSchedule(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), newLecture]
    }));
  };

  const removeLectureFromDay = (day, lectureId) => {
    setWeekSchedule(prev => ({
      ...prev,
      [day]: prev[day].filter(lecture => lecture.id !== lectureId)
    }));
  };

  const updateLecture = (day, lectureId, field, value) => {
    setWeekSchedule(prev => ({
      ...prev,
      [day]: prev[day].map(lecture => {
        if (lecture.id === lectureId) {
          const updated = { ...lecture, [field]: value };
          
          // Auto-calculate end time when start time or duration changes
          if (field === 'startTime' || field === 'duration') {
            const startTime = field === 'startTime' ? value : lecture.startTime;
            const duration = field === 'duration' ? parseInt(value) : lecture.duration;
            
            if (startTime && duration) {
              const [hours, minutes] = startTime.split(':').map(Number);
              const startMinutes = hours * 60 + minutes;
              const endMinutes = startMinutes + duration;
              const endHours = Math.floor(endMinutes / 60);
              const endMins = endMinutes % 60;
              updated.endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
            }
          }
          
          return updated;
        }
        return lecture;
      })
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedClass) {
      newErrors.class = 'Please select a class';
    }

    const activeDays = Object.keys(weekSchedule).filter(day => weekSchedule[day].length > 0);
    if (activeDays.length === 0) {
      newErrors.schedule = 'Please add at least one day with lectures';
    }

    // Validate each lecture
    activeDays.forEach(day => {
      weekSchedule[day].forEach((lecture, index) => {
        if (!lecture.lectureName.trim()) {
          newErrors[`${day}_${lecture.id}_name`] = 'Lecture name is required';
        }
        if (!lecture.startTime) {
          newErrors[`${day}_${lecture.id}_time`] = 'Start time is required';
        }
        if (!lecture.teacherId) {
          newErrors[`${day}_${lecture.id}_teacher`] = 'Teacher is required';
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // Transform the nested structure to the expected format
    const allLectures = [];
    Object.entries(weekSchedule).forEach(([day, lectures]) => {
      lectures.forEach(lecture => {
        allLectures.push({
          ...lecture,
          dayOfWeek: day
        });
      });
    });

    const formData = {
      classId: selectedClass,
      lectures: allLectures
    };

    onSubmit(formData);
  };

  const getTotalLectures = () => {
    return Object.values(weekSchedule).reduce((total, dayLectures) => total + dayLectures.length, 0);
  };

  const getActiveDays = () => {
    return Object.keys(weekSchedule).filter(day => weekSchedule[day].length > 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl my-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Create Class Timetable</h2>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">Build a complete weekly schedule for your class</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/10">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Class Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Select Class
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Class *</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a class for this timetable" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(classes) && classes.map(cls => (
                        <SelectItem key={cls._id} value={cls._id}>
                          {cls.name} - {cls.grade} {cls.campus} (Floor {cls.floor})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.class && <p className="text-sm text-red-500 mt-1">{errors.class}</p>}
                </div>
                
                {selectedClass && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900">Schedule Summary</h3>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-blue-600">Active Days:</span>
                        <span className="ml-2 font-medium">{getActiveDays().length}</span>
                      </div>
                      <div>
                        <span className="text-blue-600">Total Lectures:</span>
                        <span className="ml-2 font-medium">{getTotalLectures()}</span>
                      </div>
                      <div>
                        <span className="text-blue-600">Days:</span>
                        <span className="ml-2 font-medium">{getActiveDays().join(', ') || 'None'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Days and Lectures */}
          {selectedClass && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Schedule
                </CardTitle>
                <p className="text-sm text-gray-600">Add days and lectures to build your weekly timetable</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Available Days */}
                  <div>
                    <Label className="text-base font-semibold">Add Days</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      {daysOfWeek.map(day => (
                        <Button
                          key={day}
                          variant={weekSchedule[day] ? "default" : "outline"}
                          size="sm"
                          onClick={() => weekSchedule[day] ? removeDayBlock(day) : addDayBlock(day)}
                          className="justify-start text-xs sm:text-sm"
                        >
                          {weekSchedule[day] ? (
                            <>
                              <Calendar className="h-4 w-4 mr-2" />
                              {day} ({weekSchedule[day].length})
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              {day}
                            </>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Day Blocks */}
                  <div className="space-y-4">
                    {daysOfWeek.map((day) => {
                      const lectures = weekSchedule[day];
                      if (!lectures) return null; // Only show if day is selected

                      // Find previous day with lectures for copy functionality
                      const dayIndex = daysOfWeek.indexOf(day);
                      const previousDaysWithLectures = daysOfWeek.slice(0, dayIndex).filter(d => 
                        weekSchedule[d] && weekSchedule[d].length > 0
                      );
                      const previousDay = previousDaysWithLectures[previousDaysWithLectures.length - 1];

                      return (
                        <Card key={day} className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-500" />
                                {day}
                                <Badge variant="secondary">{lectures.length} lectures</Badge>
                              </CardTitle>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addLectureToDay(day)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Lecture
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeDayBlock(day)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Copy from previous day option */}
                            {previousDay && lectures.length === 0 && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`copy-${day}`}
                                      className="h-4 w-4 text-blue-600 rounded"
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          copyFromPreviousDay(day, previousDay);
                                        }
                                      }}
                                    />
                                    <label htmlFor={`copy-${day}`} className="text-sm font-medium text-blue-800">
                                      Same as {previousDay}
                                    </label>
                                  </div>
                                  <Badge variant="outline" className="text-blue-700 border-blue-300">
                                    {weekSchedule[previousDay]?.length || 0} lectures
                                  </Badge>
                                </div>
                                <p className="text-xs text-blue-600 mt-1">
                                  Copy all lectures from {previousDay} to {day}
                                </p>
                              </div>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {lectures.map((lecture, index) => (
                                <Card key={lecture.id} className="border border-gray-200">
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                      <h4 className="font-medium text-gray-900">Lecture {index + 1}</h4>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeLectureFromDay(day, lecture.id)}
                                        className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {/* Lecture Name */}
                                      <div>
                                        <Label>Lecture Name *</Label>
                                        <Input
                                          value={lecture.lectureName}
                                          onChange={(e) => updateLecture(day, lecture.id, 'lectureName', e.target.value)}
                                          placeholder="e.g., Mathematics"
                                        />
                                        {errors[`${day}_${lecture.id}_name`] && (
                                          <p className="text-sm text-red-500 mt-1">{errors[`${day}_${lecture.id}_name`]}</p>
                                        )}
                                      </div>

                                      {/* Subject */}
                                      <div>
                                        <Label>Subject</Label>
                                        <Select 
                                          value={lecture.subject} 
                                          onValueChange={(value) => updateLecture(day, lecture.id, 'subject', value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select subject" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {subjects.map(subject => (
                                              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Lecture Type */}
                                      <div>
                                        <Label>Type</Label>
                                        <Select 
                                          value={lecture.type} 
                                          onValueChange={(value) => updateLecture(day, lecture.id, 'type', value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {lectureTypes.map(type => (
                                              <SelectItem key={type} value={type}>
                                                {type}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Start Time */}
                                      <div>
                                        <Label>Start Time *</Label>
                                        <Select 
                                          value={lecture.startTime} 
                                          onValueChange={(value) => updateLecture(day, lecture.id, 'startTime', value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select time" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {timeSlots.map(time => (
                                              <SelectItem key={time} value={time}>
                                                {time}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        {errors[`${day}_${lecture.id}_time`] && (
                                          <p className="text-sm text-red-500 mt-1">{errors[`${day}_${lecture.id}_time`]}</p>
                                        )}
                                      </div>

                                      {/* Duration */}
                                      <div>
                                        <Label>Duration (minutes)</Label>
                                        <Select 
                                          value={lecture.duration.toString()} 
                                          onValueChange={(value) => updateLecture(day, lecture.id, 'duration', parseInt(value))}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="30">30 minutes</SelectItem>
                                            <SelectItem value="45">45 minutes</SelectItem>
                                            <SelectItem value="60">1 hour</SelectItem>
                                            <SelectItem value="90">1.5 hours</SelectItem>
                                            <SelectItem value="120">2 hours</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* End Time */}
                                      <div>
                                        <Label>End Time</Label>
                                        <Input
                                          value={lecture.endTime}
                                          disabled
                                          className="bg-gray-50"
                                          placeholder="Auto-calculated"
                                        />
                                      </div>

                                      {/* Teacher */}
                                      <div className="md:col-span-2 lg:col-span-3">
                                        <Label>Assigned Teacher *</Label>
                                        <Select 
                                          value={lecture.teacherId} 
                                          onValueChange={(value) => updateLecture(day, lecture.id, 'teacherId', value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a teacher" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {Array.isArray(teachers) && teachers.length > 0 ? (
                                              teachers.map(teacher => (
                                                <SelectItem key={teacher._id} value={teacher._id}>
                                                  <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    <span>{`${teacher.fullName?.firstName || ''} ${teacher.fullName?.lastName || ''}`.trim() || teacher.name || teacher.email}</span>
                                                  </div>
                                                </SelectItem>
                                              ))
                                            ) : (
                                              <SelectItem value="no-teachers" disabled>No teachers available</SelectItem>
                                            )}
                                          </SelectContent>
                                        </Select>
                                        {errors[`${day}_${lecture.id}_teacher`] && (
                                          <p className="text-sm text-red-500 mt-1">{errors[`${day}_${lecture.id}_teacher`]}</p>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
                {errors.schedule && <p className="text-sm text-red-500 mt-2">{errors.schedule}</p>}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600 text-center sm:text-left">
            {getTotalLectures() > 0 && (
              <span>
                {getTotalLectures()} lectures across {getActiveDays().length} days
              </span>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-initial">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedClass || getTotalLectures() === 0} className="flex-1 sm:flex-initial">
              Create Timetable
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTimetableForm;
