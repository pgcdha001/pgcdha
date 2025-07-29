import React, { useState, useEffect } from 'react';
import { MessageSquare, TrendingUp, Calendar, Filter, Plus, Download, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import CorrespondenceList from './CorrespondenceList';
import CorrespondenceFormPage from './CorrespondenceFormPage';
import api from '../../services/api';

const CorrespondenceManagement = () => {
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
