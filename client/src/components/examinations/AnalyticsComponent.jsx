import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Award,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BookOpen,
  Target
} from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const AnalyticsComponent = () => {
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalTests: 0,
      totalStudents: 0,
      averagePerformance: 0,
      improvementRate: 0
    },
    classPerformance: [],
    subjectPerformance: [],
    recentTests: [],
    performanceTrends: [],
    matriculationComparison: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('current-term');
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState([]);

  const { showToast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
    fetchClasses();
  }, [selectedTimeframe, selectedClass]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch comprehensive analytics data
      const [
        overviewResponse,
        classPerformanceResponse,
        subjectPerformanceResponse,
        recentTestsResponse,
        trendsResponse
      ] = await Promise.all([
        api.get('/examinations/analytics/overview', {
          params: { timeframe: selectedTimeframe, classId: selectedClass !== 'all' ? selectedClass : null }
        }),
        api.get('/examinations/analytics/class-performance', {
          params: { timeframe: selectedTimeframe }
        }),
        api.get('/examinations/analytics/subject-performance', {
          params: { timeframe: selectedTimeframe, classId: selectedClass !== 'all' ? selectedClass : null }
        }),
        api.get('/examinations/tests/recent', {
          params: { limit: 5, classId: selectedClass !== 'all' ? selectedClass : null }
        }),
        api.get('/examinations/analytics/performance-trends', {
          params: { timeframe: selectedTimeframe, classId: selectedClass !== 'all' ? selectedClass : null }
        })
      ]);

      setAnalyticsData({
        overview: overviewResponse.data?.data || {},
        classPerformance: classPerformanceResponse.data?.data || [],
        subjectPerformance: subjectPerformanceResponse.data?.data || [],
        recentTests: recentTestsResponse.data?.data || [],
        performanceTrends: trendsResponse.data?.data || [],
        matriculationComparison: [] // Will be implemented in future phases
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      showToast('Failed to fetch analytics data', 'error');
      
      // Set default empty data structure
      setAnalyticsData({
        overview: {
          totalTests: 0,
          totalStudents: 0,
          averagePerformance: 0,
          improvementRate: 0
        },
        classPerformance: [],
        subjectPerformance: [],
        recentTests: [],
        performanceTrends: [],
        matriculationComparison: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await api.get('/examinations/analytics/export', {
        params: { 
          timeframe: selectedTimeframe, 
          classId: selectedClass !== 'all' ? selectedClass : null,
          format: 'pdf'
        },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `examination-analytics-${selectedTimeframe}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showToast('Report exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting report:', error);
      showToast('Failed to export report', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Examination Analytics</h2>
            <p className="text-gray-600 mt-1">
              Comprehensive performance analysis and academic insights
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={fetchAnalyticsData}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleExportReport}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="current-term">Current Term</option>
            <option value="last-month">Last Month</option>
            <option value="last-3-months">Last 3 Months</option>
            <option value="academic-year">Academic Year</option>
          </select>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Classes</option>
            {classes.map(cls => (
              <option key={cls._id} value={cls._id}>
                {cls.name} - {cls.program}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tests</p>
              <p className="text-2xl font-bold text-blue-900">{analyticsData.overview.totalTests}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-green-900">{analyticsData.overview.totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Performance</p>
              <p className="text-2xl font-bold text-purple-900">{analyticsData.overview.averagePerformance}%</p>
            </div>
            <Target className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Improvement Rate</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-orange-900">{analyticsData.overview.improvementRate}%</p>
                {analyticsData.overview.improvementRate > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500 ml-2" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500 ml-2" />
                )}
              </div>
            </div>
            <Award className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Performance */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Class Performance
          </h3>
          
          {analyticsData.classPerformance.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.classPerformance.map((classData, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{classData.className}</div>
                    <div className="text-sm text-gray-600">{classData.studentCount} students</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{classData.averagePercentage}%</div>
                    <div className={`text-sm ${classData.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {classData.trend > 0 ? '↗' : '↘'} {Math.abs(classData.trend)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No class performance data available</p>
            </div>
          )}
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Subject Performance
          </h3>
          
          {analyticsData.subjectPerformance.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.subjectPerformance.map((subjectData, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{subjectData.subject}</div>
                    <div className="text-sm text-gray-600">{subjectData.testCount} tests</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{subjectData.averagePercentage}%</div>
                    <div className={`text-sm ${subjectData.difficulty === 'Easy' ? 'text-green-600' : 
                                               subjectData.difficulty === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {subjectData.difficulty} level
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No subject performance data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Tests */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Recent Tests
        </h3>
        
        {analyticsData.recentTests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.recentTests.map((test, index) => (
                  <tr key={test._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{test.title}</div>
                        <div className="text-sm text-gray-500">{test.subject} • {test.testType}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.classId?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(test.testDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        test.averagePercentage >= 80 ? 'bg-green-100 text-green-800' :
                        test.averagePercentage >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {test.averagePercentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.studentCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No recent tests available</p>
          </div>
        )}
      </div>

      {/* Performance Trends - Placeholder for future implementation */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Performance Trends & Matriculation Comparison
        </h3>
        <p className="text-blue-700 mb-4">
          Advanced analytics including performance trends and matriculation comparison will be implemented in Phase 5.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-gray-900 mb-2">Trending Analysis</h4>
            <p className="text-sm text-gray-600">Month-over-month performance tracking with predictive insights</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-gray-900 mb-2">Matriculation Comparison</h4>
            <p className="text-sm text-gray-600">Compare current performance with matriculation marks</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-gray-900 mb-2">Progress Monitoring</h4>
            <p className="text-sm text-gray-600">Individual student progress tracking and alerts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsComponent;
