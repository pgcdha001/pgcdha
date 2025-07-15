import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  BarChart3, 
  Users, 
  GraduationCap, 
  FileText, 
  TrendingUp, 
  Calendar, 
  Download,
  MessageSquare,
  UserX,
  BookOpen,
  ClipboardList,
  Mail
} from 'lucide-react';
import StudentReport from '../admin/StudentReport';

const ReportsPage = () => {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('enquiries');

  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const reportSections = [
    { id: 'enquiries', name: 'Enquiry Reports', icon: MessageSquare, color: 'from-blue-500 to-blue-600' },
    { id: 'correspondence', name: 'Correspondence Reports', icon: Mail, color: 'from-indigo-500 to-indigo-600' },
    { id: 'student-attendance', name: 'Student Attendance Reports', icon: UserX, color: 'from-red-500 to-red-600' },
    { id: 'lecture-attendance', name: 'Lecture Attendance Reports', icon: BookOpen, color: 'from-orange-500 to-orange-600' },
    { id: 'examinations', name: 'Examination Reports', icon: ClipboardList, color: 'from-purple-500 to-purple-600' },
    { id: 'appointments', name: 'Appointment Reports', icon: Calendar, color: 'from-amber-500 to-amber-600' }
  ];

  const renderReportContent = () => {
    switch (activeSection) {
      case 'enquiries':
        return <StudentReport />;
      case 'correspondence':
        return <CorrespondenceReport />;
      case 'student-attendance':
        return <StudentAttendanceReport />;
      case 'lecture-attendance':
        return <LectureAttendanceReport />;
      case 'examinations':
        return <ExaminationReport />;
      case 'appointments':
        return <AppointmentReport />;
      default:
        return <StudentReport />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-[Sora,Inter,sans-serif]">
                Reports & Analytics
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Comprehensive reporting and data analytics dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6 p-2">
          <div className="flex flex-wrap gap-2">
            {reportSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive 
                      ? `bg-gradient-to-r ${section.color} text-white shadow-lg` 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:block">{section.name}</span>
                  <span className="sm:hidden">{section.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Content */}
        {renderReportContent()}
      </div>
    </div>
  );
};

// Placeholder components for different report types
const CorrespondenceReport = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Correspondence Reports</h2>
    <p className="text-gray-600">Correspondence reporting functionality will be implemented here.</p>
  </div>
);

const StudentAttendanceReport = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Student Attendance Reports</h2>
    <p className="text-gray-600">Student attendance reporting functionality will be implemented here.</p>
  </div>
);

const LectureAttendanceReport = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Lecture Attendance Reports</h2>
    <p className="text-gray-600">Lecture attendance reporting functionality will be implemented here.</p>
  </div>
);

const ExaminationReport = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Examination Reports</h2>
    <p className="text-gray-600">Examination reporting functionality will be implemented here.</p>
  </div>
);

const AppointmentReport = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Appointment Reports</h2>
    <p className="text-gray-600">Appointment reporting functionality will be implemented here.</p>
  </div>
);

export default ReportsPage;
