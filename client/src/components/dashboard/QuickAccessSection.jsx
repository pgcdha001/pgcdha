import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  MessageSquare, 
  UserCog, 
  BarChart3, 
  FileText,
  UserPlus,
  Mail
} from 'lucide-react';
import PermissionGuard from '../PermissionGuard';

// Icon mapping for dynamic icon rendering
const ICON_MAP = {
  Users,
  GraduationCap,
  MessageSquare,
  UserCog,
  BarChart3,
  FileText,
  UserPlus,
  Mail
};

/**
 * Quick Management Access Section Component
 * Renders role-based quick access links
 */
const QuickAccessSection = ({ quickAccessItems = [] }) => {
  if (!quickAccessItems.length) {
    return null;
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-8 transition-all duration-300 hover:shadow-2xl hover:bg-white/70" 
         style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.12)'}}>
      
      <h3 className="text-2xl font-bold text-primary mb-6 font-[Sora,Inter,sans-serif] flex items-center gap-3">
        <div className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full"></div>
        Quick Management Access
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickAccessItems.map((item) => {
          const Icon = ICON_MAP[item.icon] || MessageSquare;
          
          return (
            <PermissionGuard key={item.title} permission={item.permission}>
              <Link
                to={item.href}
                className="group flex items-center gap-4 p-4 rounded-xl bg-white/50 hover:bg-white/80 border border-border/30 hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300">
                    <Icon className="h-6 w-6 text-primary group-hover:text-accent transition-colors duration-300" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors duration-300 mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                    {item.description}
                  </p>
                </div>
              </Link>
            </PermissionGuard>
          );
        })}
      </div>
    </div>
  );
};

export default QuickAccessSection;
