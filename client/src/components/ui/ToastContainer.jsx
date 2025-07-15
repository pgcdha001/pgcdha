import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getToastStyles = () => {
    const baseStyles = "relative flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-xl transition-all duration-300 transform ";
    
    const typeStyles = {
      success: "bg-green-50/95 border-green-200/70 text-green-800",
      error: "bg-red-50/95 border-red-200/70 text-red-800",
      warning: "bg-amber-50/95 border-amber-200/70 text-amber-800",
      info: "bg-blue-50/95 border-blue-200/70 text-blue-800"
    };

    const animationStyles = isLeaving 
      ? "translate-x-full opacity-0 scale-95" 
      : isVisible 
        ? "translate-x-0 opacity-100 scale-100" 
        : "translate-x-full opacity-0 scale-95";

    return baseStyles + typeStyles[toast.type] + " " + animationStyles;
  };

  const getIcon = () => {
    if (toast.icon) {
      return <span className="text-lg leading-none">{toast.icon}</span>;
    }

    const iconStyles = "h-5 w-5 flex-shrink-0";
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle className={`${iconStyles} text-green-600`} />;
      case 'error':
        return <AlertCircle className={`${iconStyles} text-red-600`} />;
      case 'warning':
        return <AlertTriangle className={`${iconStyles} text-amber-600`} />;
      case 'info':
      default:
        return <Info className={`${iconStyles} text-blue-600`} />;
    }
  };

  const getProgressBarColor = () => {
    switch (toast.type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      case 'info':
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className={getToastStyles()}>
      {/* Progress bar for auto-dismiss */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-xl overflow-hidden">
          <div 
            className={`h-full ${getProgressBarColor()} animate-toast-progress`}
            style={{
              animation: `toastProgress ${toast.duration}ms linear forwards`
            }}
          />
        </div>
      )}

      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="font-bold text-sm mb-1 font-[Sora,Inter,sans-serif]">
            {toast.title}
          </div>
        )}
        <div className="text-sm font-medium leading-relaxed">
          {toast.message}
        </div>
        {toast.action && (
          <div className="mt-2">
            <button
              onClick={toast.action.handler}
              className="text-xs font-semibold px-3 py-1 rounded-lg bg-white/80 hover:bg-white transition-colors duration-200 shadow-sm"
            >
              {toast.action.label}
            </button>
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleRemove}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-current/30"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>

      {/* CSS for animations */}
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        .animate-toast-progress {
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
