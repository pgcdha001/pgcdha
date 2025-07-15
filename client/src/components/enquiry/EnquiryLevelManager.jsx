import React, { useState } from 'react';
import { XCircle, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../services/api';
import { useApiWithToast } from '../../hooks/useApiWithToast';

const EnquiryLevelManager = ({ enquiry, availableLevels, onClose, onLevelUpdated }) => {
  const [selectedLevel, setSelectedLevel] = useState(enquiry.level);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const { executeWithToast } = useApiWithToast();

  const getLevelInfo = (levelId) => {
    return availableLevels.find(level => level.id === levelId) || availableLevels[0];
  };

  const getStatusIcon = (levelId) => {
    switch (levelId) {
      case 1: return <Clock className="h-4 w-4" />;
      case 2: return <Clock className="h-4 w-4" />;
      case 3: return <Clock className="h-4 w-4" />;
      case 4: return <Clock className="h-4 w-4" />;
      case 5: return <CheckCircle className="h-4 w-4" />;
      case 6: return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleUpdateLevel = async () => {
    if (selectedLevel === enquiry.level && !notes.trim()) {
      onClose();
      return;
    }

    setUpdating(true);
    await executeWithToast(
      async () => {
        const response = await api.put(`/students/${enquiry.id}/level`, {
          level: selectedLevel,
          notes: notes.trim()
        });
        
        const updatedEnquiry = {
          ...enquiry,
          level: selectedLevel,
          notes: enquiry.notes + (notes.trim() ? `\n\n[${new Date().toLocaleString()}] ${notes.trim()}` : ''),
          lastUpdated: new Date().toLocaleDateString()
        };
        
        onLevelUpdated(updatedEnquiry);
        return response;
      },
      {
        success: 'Enquiry level updated successfully',
        error: 'Failed to update enquiry level'
      }
    );
    setUpdating(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Update Enquiry Level
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={updating}
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student: {enquiry.studentName}
            </label>
            <p className="text-sm text-gray-600">{enquiry.course}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Level
            </label>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getLevelInfo(enquiry.level).bgColor} ${getLevelInfo(enquiry.level).textColor}`}>
              {getStatusIcon(enquiry.level)}
              {getLevelInfo(enquiry.level).name}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              New Level
            </label>
            <div className="space-y-2">
              {availableLevels.map((level) => (
                <label key={level.id} className="flex items-center">
                  <input
                    type="radio"
                    name="level"
                    value={level.id}
                    checked={selectedLevel === level.id}
                    onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
                    className="mr-3"
                    disabled={updating}
                  />
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${level.bgColor} ${level.textColor}`}>
                    {getStatusIcon(level.id)}
                    {level.name}
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this level change..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              disabled={updating}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateLevel}
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Update Level'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnquiryLevelManager;
