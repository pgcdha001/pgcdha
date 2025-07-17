import React, { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Users, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

const DashboardWidget = ({
  title,
  type = 'metric',
  value,
  previousValue,
  data = [],
  icon: IconComponent,
  color = 'blue',
  size = 'normal',
  loading = false,
  error = null,
  className = "",
  onClick,
  refreshable = false,
  onRefresh
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Color variations
  const colorClasses = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      light: 'bg-blue-50',
      text: 'text-blue-600',
      darkText: 'text-blue-900'
    },
    green: {
      bg: 'from-green-500 to-green-600',
      light: 'bg-green-50',
      text: 'text-green-600',
      darkText: 'text-green-900'
    },
    red: {
      bg: 'from-red-500 to-red-600',
      light: 'bg-red-50',
      text: 'text-red-600',
      darkText: 'text-red-900'
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      light: 'bg-purple-50',
      text: 'text-purple-600',
      darkText: 'text-purple-900'
    },
    amber: {
      bg: 'from-amber-500 to-amber-600',
      light: 'bg-amber-50',
      text: 'text-amber-600',
      darkText: 'text-amber-900'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  // Size variations
  const sizeClasses = {
    small: 'p-4',
    normal: 'p-6',
    large: 'p-8'
  };

  // Calculate trend
  const calculateTrend = () => {
    if (!previousValue || previousValue === 0) return null;
    const change = ((value - previousValue) / previousValue) * 100;
    return {
      percentage: Math.abs(change).toFixed(1),
      direction: change >= 0 ? 'up' : 'down',
      isPositive: change >= 0
    };
  };

  const trend = calculateTrend();

  // Handle refresh
  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Render different widget types
  const renderContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      );
    }

    switch (type) {
      case 'metric':
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-primary/80 font-[Inter,sans-serif]">{title}</h3>
              {IconComponent && (
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 blur-xl opacity-70" />
                  <div className={`relative h-10 w-10 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110 hover:shadow-2xl`}>
                    <IconComponent className="h-5 w-5 text-white animate-float" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-extrabold text-primary tracking-tight font-[Sora,Inter,sans-serif] drop-shadow-sm">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
                {trend && (
                  <div className={`flex items-center mt-2 text-sm font-medium ${
                    trend.isPositive ? 'text-green-500' : 'text-accent'
                  }`}>
                    {trend.direction === 'up' ? (
                      <TrendingUp className="h-4 w-4 mr-1 animate-float" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1 animate-float" />
                    )}
                    {trend.percentage}%
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'progress': {
        const percentage = Math.min(100, Math.max(0, (value / (data[0]?.target || 100)) * 100));
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
              {IconComponent && (
                <div className={`h-8 w-8 bg-gradient-to-br ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <IconComponent className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-900 font-semibold">{value}</span>
                <span className="text-gray-500">{data[0]?.target || 100}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className={`bg-gradient-to-r ${colors.bg} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
            
            <p className="text-xs text-gray-500">{percentage.toFixed(0)}% of target</p>
          </div>
        );
      }

      case 'list':
        return (
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-4">{title}</h3>
            <div className="space-y-2">
              {data.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-700 truncate">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
            {data.length > 5 && (
              <p className="text-xs text-gray-500 mt-2">+{data.length - 5} more</p>
            )}
          </div>
        );

      case 'status': {
        const statusConfig = {
          success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
          warning: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
          error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
          info: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50' }
        };
        
        const status = statusConfig[value] || statusConfig.info;
        const StatusIcon = status.icon;
        
        return (
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-4">{title}</h3>
            <div className={`${status.bg} rounded-lg p-4 text-center`}>
              <StatusIcon className={`h-8 w-8 ${status.color} mx-auto mb-2`} />
              <p className={`font-medium ${status.color}`}>
                {data[0]?.message || 'Status Update'}
              </p>
              {data[0]?.description && (
                <p className="text-sm text-gray-600 mt-1">{data[0].description}</p>
              )}
            </div>
          </div>
        );
      }

      default:
        return (
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-4">{title}</h3>
            <p className="text-lg text-gray-900">{value}</p>
          </div>
        );
    }
  };

  return (
    <div 
      className={`
        relative bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-border
        ${sizeClasses[size]} 
        ${onClick ? 'cursor-pointer hover:shadow-[0_20px_64px_0_rgba(26,35,126,0.18)] transition-all duration-300' : ''}
        group
        ${className}
      `}
      onClick={onClick}
    >
      {/* Animated gradient bar */}
      <span className="absolute top-0 left-8 right-8 h-1 rounded-b-xl bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />
      
      {refreshable && (
        <div className="flex justify-end mb-2">
          <div className="relative">
            <span className="absolute inset-0 rounded-xl p-[2px] bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x blur-sm opacity-70 pointer-events-none" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRefresh();
              }}
              disabled={isRefreshing}
              className="relative z-10 p-2 text-primary hover:text-accent transition-colors duration-200 rounded-xl hover:bg-primary/5"
            >
              <div className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      )}
      
      {renderContent()}
    </div>
  );
};

// Pre-configured widget components
export const MetricWidget = (props) => <DashboardWidget {...props} type="metric" />;
export const ProgressWidget = (props) => <DashboardWidget {...props} type="progress" />;
export const ListWidget = (props) => <DashboardWidget {...props} type="list" />;
export const StatusWidget = (props) => <DashboardWidget {...props} type="status" />;

// Widget grid layout component
export const WidgetGrid = ({ children, columns = 4, gap = 6, className = "" }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-${gap} ${className}`}>
      {children}
    </div>
  );
};

export default DashboardWidget;
