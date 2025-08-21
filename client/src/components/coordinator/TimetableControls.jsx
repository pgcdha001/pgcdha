import React from 'react';
import { Button } from '../ui/button';
import { Calendar, RefreshCw, Save } from 'lucide-react';

const TimetableControls = ({
  selectedDate,
  onDateChange,
  onRefresh,
  onSave,
  hasPendingChanges,
  saving,
  userRole
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Today: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={onRefresh}
            variant="outline"
            className="border-gray-300 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          {userRole === 'Coordinator' && (
            <Button
              onClick={onSave}
              disabled={saving || !hasPendingChanges}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          )}
        </div>
      </div>
      
      {userRole === 'Coordinator' && hasPendingChanges && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              You have {Object.keys(hasPendingChanges).length} unsaved attendance changes
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableControls;
