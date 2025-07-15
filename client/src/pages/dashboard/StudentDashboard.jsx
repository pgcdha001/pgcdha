import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, FileText, Award, Clock, User } from 'lucide-react';

const StudentDashboard = () => {
  const stats = [
    { name: 'Current Semester', value: '6th', icon: BookOpen, color: 'bg-blue-500' },
    { name: 'Enrolled Courses', value: '7', icon: BookOpen, color: 'bg-green-500' },
    { name: 'Current CGPA', value: '3.45', icon: Award, color: 'bg-purple-500' },
    { name: 'Pending Assignments', value: '3', icon: FileText, color: 'bg-orange-500' },
  ];

  const todaySchedule = [
    { time: '09:00 AM', subject: 'Software Engineering', instructor: 'Dr. Ahmed', room: 'Room 201' },
    { time: '11:00 AM', subject: 'Database Systems', instructor: 'Prof. Khan', room: 'Lab 1' },
    { time: '02:00 PM', subject: 'Computer Networks', instructor: 'Ms. Fatima', room: 'Room 105' },
  ];

  const recentGrades = [
    { subject: 'Software Engineering', assignment: 'Mid-term Exam', grade: 'A-', date: '2 days ago' },
    { subject: 'Database Systems', assignment: 'Project 1', grade: 'B+', date: '1 week ago' },
    { subject: 'Computer Networks', assignment: 'Quiz 2', grade: 'A', date: '1 week ago' },
  ];

  const upcomingDeadlines = [
    { title: 'Software Engineering Project', course: 'SE-501', deadline: 'Due in 3 days', priority: 'high' },
    { title: 'Database Assignment', course: 'CS-502', deadline: 'Due in 5 days', priority: 'medium' },
    { title: 'Networks Lab Report', course: 'CS-503', deadline: 'Due in 1 week', priority: 'low' },
  ];

  const quickActions = [
    { title: 'My Courses', href: '/student/courses', icon: BookOpen, description: 'View enrolled courses' },
    { title: 'Assignments', href: '/student/assignments', icon: FileText, description: 'Submit assignments' },
    { title: 'Grades', href: '/student/grades', icon: Award, description: 'View academic performance' },
    { title: 'Schedule', href: '/student/schedule', icon: Calendar, description: 'Class timetable' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Dashboard</h2>
        <p className="text-gray-600">Track your academic progress and manage coursework</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <action.icon className="h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-medium text-gray-900">{action.title}</h4>
              <p className="text-sm text-gray-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Classes</h3>
          <div className="space-y-4">
            {todaySchedule.map((schedule, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">{schedule.time}</span>
                </div>
                <p className="font-medium text-gray-900">{schedule.subject}</p>
                <p className="text-sm text-gray-600">{schedule.instructor}</p>
                <p className="text-sm text-gray-500">{schedule.room}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Grades */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Grades</h3>
          <div className="space-y-3">
            {recentGrades.map((grade, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{grade.assignment}</p>
                  <p className="text-sm text-gray-600">{grade.subject}</p>
                  <p className="text-xs text-gray-500">{grade.date}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  grade.grade.startsWith('A') ? 'bg-green-100 text-green-800' :
                  grade.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {grade.grade}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3">
            {upcomingDeadlines.map((deadline, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    deadline.priority === 'high' ? 'bg-red-100 text-red-800' :
                    deadline.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {deadline.priority}
                  </span>
                </div>
                <p className="font-medium text-gray-900">{deadline.title}</p>
                <p className="text-sm text-gray-600">{deadline.course}</p>
                <p className="text-sm text-gray-500">{deadline.deadline}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Academic Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">3.45</div>
            <div className="text-sm text-gray-600">Current CGPA</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">142</div>
            <div className="text-sm text-gray-600">Credit Hours Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">18</div>
            <div className="text-sm text-gray-600">Current Semester Hours</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
