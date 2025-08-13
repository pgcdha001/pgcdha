import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  User, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Phone,
  Mail,
  ArrowLeft,
  BarChart3,
  Users,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const TeacherProfileDetails = ({ teacherId, onBack }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    fetchTeacherProfile();
  }, [teacherId]);

  const fetchTeacherProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher-analytics/teacher-profile/${teacherId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestClick = async (testId) => {
    try {
      const response = await fetch(`/api/teacher-analytics/test-analytics/${testId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const testData = await response.json();
        setSelectedTest(testData);
      }
    } catch (error) {
      console.error('Error fetching test analytics:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profileData) {
    return <div className="text-center text-gray-500">No data available</div>;
  }

  const { teacher, weeklyStats, attendanceRecords, weeklyTimetable, lateInstances, tests } = profileData;
  
  const attendanceRate = weeklyStats.totalLectures > 0 
    ? ((weeklyStats.attendedLectures / weeklyStats.totalLectures) * 100).toFixed(1)
    : 0;

  // Prepare attendance chart data
  const attendanceChartData = weeklyTimetable.map((slot, index) => {
    const attendance = attendanceRecords.find(record => 
      new Date(record.date).toDateString() === new Date(slot.date).toDateString()
    );
    
    return {
      day: new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short' }),
      present: attendance?.status === 'Present' ? 1 : 0,
      late: attendance?.status === 'Late' || attendance?.minutesLate > 10 ? 1 : 0,
      absent: !attendance || attendance.status === 'Absent' ? 1 : 0
    };
  });

  if (selectedTest) {
    return <TestAnalyticsView testData={selectedTest} onBack={() => setSelectedTest(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Teachers
        </Button>
        <div className="flex items-center space-x-3">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {teacher.fullName.firstName} {teacher.fullName.lastName}
            </h1>
            <p className="text-gray-500">{teacher.employeeId}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Weekly Attendance</p>
                <p className="text-2xl font-bold">{weeklyStats.attendedLectures}/{weeklyStats.totalLectures}</p>
                <p className="text-sm text-green-600">{attendanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-500">Late Instances</p>
                <p className="text-2xl font-bold">{weeklyStats.lateCount}</p>
                <p className="text-sm text-red-600">This week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Total Tests</p>
                <p className="text-2xl font-bold">{weeklyStats.totalTests}</p>
                <p className="text-sm text-green-600">Created</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="text-sm font-medium">{teacher.email}</p>
                <p className="text-sm">{teacher.phoneNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance">Attendance Details</TabsTrigger>
          <TabsTrigger value="tests">Tests & Exams</TabsTrigger>
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Present" />
                    <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} name="Late" />
                    <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Late Instances */}
          {lateInstances.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span>Late Instances This Week</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lateInstances.map((instance, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium">{new Date(instance.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">
                          {instance.minutesLate} minutes late
                        </p>
                      </div>
                      <Badge variant="destructive">Late</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tests Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {tests.map((test) => (
                  <div 
                    key={test._id} 
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleTestClick(test._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{test.title}</h3>
                        <p className="text-sm text-gray-600">
                          {test.classId?.name} • {test.subject} • {test.totalMarks} marks
                        </p>
                        <p className="text-xs text-gray-500">
                          Created: {new Date(test.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{test.testType}</Badge>
                        <BarChart3 className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Timetable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {weeklyTimetable.map((slot, index) => {
                  const attendance = attendanceRecords.find(record => 
                    new Date(record.date).toDateString() === new Date(slot.date).toDateString()
                  );
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {new Date(slot.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-sm text-gray-600">
                          {slot.startTime} - {slot.endTime} • {slot.classId?.name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {attendance ? (
                          attendance.status === 'Present' ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Present
                            </Badge>
                          ) : attendance.status === 'Late' ? (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              <Clock className="w-3 h-3 mr-1" />
                              Late
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700">
                              <XCircle className="w-3 h-3 mr-1" />
                              Absent
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline">No Record</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Test Analytics Component
const TestAnalyticsView = ({ testData, onBack }) => {
  const { test, zones, zoneStats, trendData, summary } = testData;

  // Zone colors
  const zoneColors = {
    excellent: '#10b981',
    good: '#3b82f6', 
    average: '#f59e0b',
    poor: '#f97316',
    failing: '#ef4444'
  };

  const pieData = zoneStats.map(stat => ({
    name: stat.zone.charAt(0).toUpperCase() + stat.zone.slice(1),
    value: stat.count,
    color: zoneColors[stat.zone]
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{test.title}</h1>
          <p className="text-gray-500">
            {test.classId?.name} • {test.subject} • {test.totalMarks} marks
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold">{summary.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Average Score</p>
                <p className="text-2xl font-bold">{summary.averageScore}</p>
                <p className="text-sm text-green-600">{summary.averagePercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Pass Rate</p>
                <p className="text-2xl font-bold">{summary.passRate}%</p>
                <p className="text-sm text-purple-600">≥50% marks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Test Date</p>
                <p className="text-lg font-bold">
                  {new Date(test.testDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {zoneStats.map((stat) => (
                <div key={stat.zone} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: zoneColors[stat.zone] }}
                    ></div>
                    <span className="capitalize">{stat.zone}</span>
                  </div>
                  <span>{stat.count} students ({stat.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="testName" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="averagePercentage" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Average %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone Details */}
      <div className="grid gap-4">
        {Object.entries(zones).map(([zoneName, students]) => {
          if (students.length === 0) return null;
          
          return (
            <Card key={zoneName}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: zoneColors[zoneName] }}
                  ></div>
                  <span className="capitalize">{zoneName} Zone ({students.length} students)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {students.map((student) => (
                    <div key={student._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">
                          {student.studentId.fullName.firstName} {student.studentId.fullName.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Roll: {student.studentId.rollNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{student.obtainedMarks}/{test.totalMarks}</p>
                        <p className="text-sm text-gray-600">{student.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherProfileDetails;
