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
  FileText
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
  FileText
};

/**
 * Reusable Dashboard Card Component
 * Supports both normal cards and sliding animation cards
 */
const DashboardCard = ({ 
  card, 
  dashboardData = {}, 
  slidingItems = [] 
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
    if (card.type === 'sliding') {
      return (
        <SlidingText 
          items={slidingItems} 
          className="text-sm text-gray-600"
        />
      );
    }

    // Normal card with static recent activity
    return (
      <p className="text-sm text-gray-600 mb-2">
        {card.recentActivity || 'No recent activity'}
      </p>
    );
  };

  // Render today count with dynamic data
  const renderTodayCount = () => {
    let displayText = card.todayCount || '';

    // Replace dashboard data placeholders
    if (card.id === 'enquiry-reports' && dashboardData.todayEnquiries !== undefined) {
      displayText = `${dashboardData.todayEnquiries} new today`;
    } else if (card.id === 'correspondence' && dashboardData.todayCorrespondence !== undefined) {
      displayText = `${dashboardData.todayCorrespondence || 0} today, ${dashboardData.totalCorrespondence || 0} total`;
    } else if (card.id === 'examinations' && dashboardData.upcomingExams !== undefined) {
      displayText = `${dashboardData.upcomingExams} exams this week`;
    } else if (card.id === 'appointments' && dashboardData.scheduledAppointments !== undefined) {
      displayText = `${dashboardData.scheduledAppointments} scheduled`;
    } else if (card.id === 'staff-management' && dashboardData.totalStaff !== undefined) {
      displayText = `${dashboardData.totalStaff} staff members`;
    } else if (card.id === 'student-management' && dashboardData.totalStudents !== undefined) {
      displayText = `${dashboardData.totalStudents} students`;
    }

    return (
      <p className="text-white text-sm font-medium">
        {displayText}
      </p>
    );
  };

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
        
        {/* Recent Activity */}
        <div className="mb-3 min-h-[1.5rem]">
          {renderRecentActivity()}
        </div>
        
        {/* Today Count - with background */}
        <div className={`inline-block px-3 py-2 rounded-lg bg-gradient-to-r ${card.bgGradient} shadow-md group-hover:shadow-lg transition-shadow duration-300`}>
          {renderTodayCount()}
        </div>
      </div>
    </Link>
  );
};

export default DashboardCard;
