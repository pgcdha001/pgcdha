import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, Users, GraduationCap, FileText, TrendingUp, Calendar, Download } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import StudentReport from '../admin/StudentReport';

const ReportsPage = () => {
  const { toast } = useToast();

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

        {/* Student Reports Section */}
        <StudentReport />
      </div>
    </div>
  );
};

export default ReportsPage;
