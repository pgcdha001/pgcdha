import React from 'react';
import { School, TrendingUp } from 'lucide-react';

/**
 * Dashboard Header Component
 * Reusable header for different dashboard types
 */
const DashboardHeader = ({ 
  title = "Dashboard", 
  subtitle = "Manage operations and daily activities",
  dashboardData = {},
  loading = false,
  onRefresh = null,
  userRole = ""
}) => {
  // Role-specific customization
  const getRoleSpecificContent = () => {
    switch (userRole) {
      case 'InstituteAdmin':
        return {
          title: 'Institute Admin Dashboard',
          subtitle: 'Manage institute operations and daily activities'
        };
      case 'IT':
        return {
          title: 'IT Dashboard',
          subtitle: 'System management and technical operations'
        };
      case 'Receptionist':
        return {
          title: 'Receptionist Dashboard',
          subtitle: 'Student services and enquiry management'
        };
      default:
        return { title, subtitle };
    }
  };

  const { title: displayTitle, subtitle: displaySubtitle } = getRoleSpecificContent();

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-border/50 p-8 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" 
         style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/90 to-accent/80 text-white shadow-lg">
            <School className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-primary mb-2 font-[Sora,Inter,sans-serif] tracking-tight">
              {displayTitle}
            </h2>
            <p className="text-muted-foreground font-medium">
              {displaySubtitle}
            </p>
            {dashboardData.lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {dashboardData.lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
        </div>
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <TrendingUp className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
