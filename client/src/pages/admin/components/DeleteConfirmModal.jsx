import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { userAPI } from '../../../services/api';

const DeleteConfirmModal = ({ user, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await userAPI.deleteUser(user._id);
      
      if (response.success) {
        onConfirm();
      } else {
        setError(response.message || 'Failed to delete user');
      }
    } catch (err) {
      setError('An error occurred while deleting the user');
      console.error('Delete user error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Delete User
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <p className="text-gray-800 mb-2">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">
                      {user?.fullName?.firstName?.[0]}{user?.fullName?.lastName?.[0]}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {user?.fullName?.firstName} {user?.fullName?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {user?.email} • {user?.role}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Warning
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>All user data will be permanently deleted</li>
                    <li>User sessions will be terminated</li>
                    <li>Associated records may be affected</li>
                    <li>This action cannot be reversed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 px-6 py-4 border-t bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span>{loading ? 'Deleting...' : 'Delete User'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
