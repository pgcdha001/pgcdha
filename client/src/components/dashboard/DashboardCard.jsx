import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  UserX, 
  BookOpen, 
  ClipboardList, 
  Mail, 
  Users, 
  GraduationCap, 
  Calendar,
  BarChart3,
  UserPlus,
  UserCog,
  FileText,
  School
} from 'lucide-react';

// Icon mapping for dynamic icon rendering
const ICON_MAP = {
  MessageSquare,
  UserX,
  BookOpen,
  ClipboardList,
  Mail,
  Users,
  GraduationCap,
  Calendar,
  BarChart3,
  UserPlus,
  UserCog,
  FileText,
  School
};

/**
 * Reusable Dashboard Card Component
 * Supports both normal cards and sliding animation cards
 */
const DashboardCard = ({ 
  card, 
  dashboardData = {}, 
  slidingItems = [],
  userRole = null
}) => {
  const Icon = ICON_MAP[card.icon] || MessageSquare;

  // Sliding animation logic for cards with type 'sliding'
  const SlidingText = ({ items, className = "" }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      if (items.length > 1) {
        const interval = setInterval(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
        }, 2500); // Change every 2.5 seconds

        return () => clearInterval(interval);
      }
    }, [items.length]);

    if (items.length === 0) {
      return <p className={className}>No issues today!</p>;
    }

    return (
      <div className="relative overflow-hidden h-6">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <p className={`${className} text-red-600 font-medium`}>{item}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render recent activity based on card type
  const renderRecentActivity = () => {
    // Only show recent activity for InstituteAdmin
    if (userRole !== 'InstituteAdmin') {
      return null;
    }

    if (card.type === 'sliding') {
      return (
        <SlidingText 
          items={slidingItems} 
          className="text-sm text-gray-600"
        />
      );
    }

    // Normal card with dynamic recent activity
    let activityText = 'No recent activity';
    
    if (card.id === 'enquiry-management' || card.id === 'enquiry-reports') {
      if (dashboardData.recentEnquiry) {
        const fullName = `${dashboardData.recentEnquiry.fullName?.firstName || ''} ${dashboardData.recentEnquiry.fullName?.lastName || ''}`.trim();
        activityText = fullName ? `Latest: ${fullName}` : 'No recent activity';
      }
    } else if (card.id === 'correspondence-management' || card.id === 'correspondence') {
      if (dashboardData.recentCorrespondence) {
        const studentName = dashboardData.recentCorrespondence.studentName;
        activityText = studentName ? `Latest: ${studentName}` : 'No recent activity';
      }
    } else if (card.recentActivity) {
      activityText = card.recentActivity;
    }

    return (
      <p className="text-sm text-gray-600 mb-2">
        {activityText}
      </p>
    );
  };

  // Render today count with dynamic data
  const renderTodayCount = () => {
    let displayText = card.todayCount || '';

    // Replace dashboard data placeholders - enhanced for today's statistics
    if (card.id === 'enquiry-reports' || card.id === 'enquiry-management') {
      if (dashboardData.todayEnquiries !== undefined) {
        displayText = `${dashboardData.todayEnquiries} new today`;
      } else {
        displayText = '0 new today';
      }
    } else if (card.id === 'correspondence' || card.id === 'correspondence-management') {
      if (dashboardData.todayCorrespondence !== undefined) {
        displayText = `${dashboardData.todayCorrespondence || 0} today`;
      } else {
        displayText = '0 today';
      }
    } else if (card.id === 'examinations' && dashboardData.upcomingExams !== undefined) {
      displayText = `${dashboardData.upcomingExams} exams this week`;
    } else if (card.id === 'appointments' && dashboardData.scheduledAppointments !== undefined) {
      displayText = `${dashboardData.scheduledAppointments} scheduled`;
    } else if (card.id === 'staff-management' && dashboardData.totalStaff !== undefined) {
      displayText = `${dashboardData.totalStaff} staff members`;
    } else if (card.id === 'student-management' && dashboardData.totalStudents !== undefined) {
      displayText = `${dashboardData.totalStudents} students`;
    }

    // If no specific text is set, use a default
    if (!displayText) {
      displayText = 'View Details';
    }

    return (
      <p className="text-white text-sm font-medium">
        {displayText}
      </p>
    );
  };

  // If card is disabled, render a disabled version without Link
  if (card.disabled) {
    return (
      <div className="group bg-white/40 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-border/30 opacity-60 cursor-not-allowed">
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${card.bgGradient} text-white shadow-lg mb-4 opacity-50`}>
            <Icon className="h-8 w-8" />
          </div>
          <h4 className="text-lg font-semibold text-gray-400 mb-3">
            {card.title}
          </h4>
          
          {/* Description for disabled cards */}
          {card.description && (
            <div className="mb-3 min-h-[1.5rem]">
              <p className="text-sm text-gray-500">{card.description}</p>
            </div>
          )}
          
          {/* Disabled status */}
          <div className="inline-block px-3 py-2 rounded-lg bg-gray-400 shadow-md">
            <p className="text-white text-sm font-medium">
              Coming Soon
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={card.href}
      className="group bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-border/30 transition-all duration-300 hover:shadow-xl hover:bg-white/80 hover:scale-[1.02] hover:border-primary/20"
    >
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${card.bgGradient} text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-8 w-8" />
        </div>
        <h4 className="text-lg font-semibold text-primary mb-3 group-hover:text-accent transition-colors duration-300">
          {card.title}
        </h4>
        
        {/* Description for normal cards */}
        {card.description && !renderRecentActivity() && (
          <div className="mb-3 min-h-[1.5rem]">
            <p className="text-sm text-gray-600">{card.description}</p>
          </div>
        )}
        
        {/* Recent Activity */}
        {renderRecentActivity() && (
          <div className="mb-3 min-h-[1.5rem]">
            {renderRecentActivity()}
          </div>
        )}
        
        {/* Today Count - with background */}
        <div className={`inline-block px-3 py-2 rounded-lg bg-gradient-to-r ${card.bgGradient} shadow-md group-hover:shadow-lg transition-shadow duration-300`}>
          {renderTodayCount()}
        </div>
      </div>
    </Link>
  );
};

export default DashboardCard;
