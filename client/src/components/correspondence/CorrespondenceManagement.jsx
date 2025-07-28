import React, { useState, useEffect } from 'react';
import { MessageSquare, TrendingUp, Calendar, Filter, Plus, Download, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import CorrespondenceList from './CorrespondenceList';
import CorrespondenceFormPage from './CorrespondenceFormPage';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const CorrespondenceManagement = () => {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCorrespondence, setEditingCorrespondence] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    enquiry: 0,
    student: 0,
    thisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch correspondence statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all correspondence for stats calculation
      const response = await api.get('/correspondence?limit=1000');
      const correspondenceData = response.data?.data || response.data || [];
      
      // Calculate stats
      const total = correspondenceData.length;
      const enquiry = correspondenceData.filter(item => item.type === 'enquiry').length;
      const student = correspondenceData.filter(item => item.type === 'student').length;
      
      // Calculate this month's correspondence
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonth = correspondenceData.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      }).length;
      
      setStats({
        total,
        enquiry,
        student,
        thisMonth
      });
      
    } catch (error) {
      console.error('Error fetching correspondence stats:', error);
      setStats({ total: 0, enquiry: 0, student: 0, thisMonth: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    setRefreshKey(prev => prev + 1); // Trigger refresh
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setEditingCorrespondence(null);
    setRefreshKey(prev => prev + 1); // Trigger refresh
  };

  const handleEditCorrespondence = (correspondence) => {
    setEditingCorrespondence(correspondence);
    setShowEditForm(true);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExport = async () => {
    try {
      // This would be implemented based on your export requirements
      console.log('Export functionality to be implemented');
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  // Stats cards configuration
  const statsCards = [
    {
      title: 'Total Correspondence',
      value: stats.total,
      icon: MessageSquare,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Enquiry Correspondence',
      value: stats.enquiry,
      icon: Users,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Student Correspondence',
      value: stats.student,
      icon: Users,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      title: 'This Month',
      value: stats.thisMonth,
      icon: Calendar,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Create/Edit Form - Show at top when active */}
      {(showCreateForm || showEditForm) && (
        <CorrespondenceFormPage
          isOpen={true}
          onClose={() => {
            setShowCreateForm(false);
            setShowEditForm(false);
            setEditingCorrespondence(null);
          }}
          onSuccess={showEditForm ? handleEditSuccess : handleCreateSuccess}
          editData={editingCorrespondence}
        />
      )}

      {/* Header Section - Only show when form is not active */}
      {!showCreateForm && !showEditForm && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Correspondence Management</h1>
                <p className="text-gray-600 mt-1">
                  Manage student correspondence and communications across all levels
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="flex items-center space-x-2"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </Button>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Correspondence</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{statsCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className={`bg-white rounded-lg shadow-sm border ${card.borderColor} p-6 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <div className="text-3xl font-bold text-gray-900 mt-1">
                      {loading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                      ) : (
                        card.value
                      )}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          {/* Main Correspondence List */}
          <CorrespondenceList 
            key={refreshKey} 
            onEditCorrespondence={handleEditCorrespondence}
          />
        </>
      )}
    </div>
  );
};

export default CorrespondenceManagement;
