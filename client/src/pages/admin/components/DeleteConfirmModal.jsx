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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      {/* Animated gradient background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[250px] h-[250px] rounded-full bg-gradient-to-br from-red-500/20 via-accent/15 to-red-600/25 blur-[80px] opacity-60 animate-float-slow" />
        <div className="absolute bottom-1/3 right-1/3 w-[180px] h-[180px] rounded-full bg-gradient-to-tr from-accent/25 via-red-500/15 to-accent/20 blur-[60px] opacity-40 animate-float-slower" />
      </div>
      
      <div className="relative bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl w-full h-full border border-border/50 font-[Inter,sans-serif] transition-all duration-300 hover:shadow-[0_25px_80px_0_rgba(229,57,53,0.20)] flex flex-col" style={{boxShadow: '0 20px 64px 0 rgba(229,57,53,0.15)'}}>
        {/* Animated gradient bar at the top */}
        <span className="absolute top-0 left-6 right-6 h-1 rounded-b-xl bg-gradient-to-r from-red-500 via-accent to-red-600 animate-gradient-x" />
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/30 bg-white/40 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/90 to-accent/80 text-white shadow-lg transition-transform duration-200 hover:scale-105">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-600 font-[Sora,Inter,sans-serif] tracking-tight">
                Delete User
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-all duration-200 rounded-2xl p-2 hover:bg-red-50/60 focus:outline-none focus:ring-2 focus:ring-red-300/30 group"
          >
            <X className="h-6 w-6 transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 bg-white/20 backdrop-blur-md">
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 px-4 py-3 rounded-2xl mb-4 shadow-lg animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                {error}
              </div>
            </div>
          )}
          
          <div className="mb-5">
            <p className="text-primary/80 mb-4 font-medium text-base">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-border/30 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-12 w-12">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/80 to-accent/70 flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-white">
                      {user?.fullName?.firstName?.[0]}{user?.fullName?.lastName?.[0]}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-base font-bold text-primary font-[Sora,Inter,sans-serif]">
                    {user?.fullName?.firstName} {user?.fullName?.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {user?.email} • {user?.role}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/60 rounded-2xl p-4 shadow-lg">
            <div className="flex">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-100/80 mr-3 mt-0.5">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-800 font-[Sora,Inter,sans-serif] mb-2">
                  Warning
                </h3>
                <div className="text-sm text-amber-700">
                  <ul className="space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                      All user data will be permanently deleted
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                      User sessions will be terminated
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                      Associated records may be affected
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                      This action cannot be reversed
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-border/30 bg-white/40 backdrop-blur-xl">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-semibold border-border/50 hover:bg-white/80 hover:border-primary/30 transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Deleting...</span>
              </div>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete User</span>
              </>
            )}
          </Button>
        </div>

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes float-slow {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-15px) scale(1.02); }
          }
          @keyframes float-slower {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(10px) scale(0.98); }
          }
          @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-fade-in { animation: fade-in 0.3s ease-out; }
          .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
          .animate-float-slower { animation: float-slower 8s ease-in-out infinite; }
          .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 3s ease-in-out infinite; }
        `}</style>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
