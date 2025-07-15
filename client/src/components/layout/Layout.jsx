import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Menu, X, LogOut, Bell } from 'lucide-react';
import logo from '../../../assets/logo.png';

const Layout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Role-based navigation
  const getNavigationForRole = (role) => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    ];

    switch (role) {
      case 'College Admin':
      case 'Academic Admin':
        return [
          ...baseNavigation,
          { name: 'Students', href: '/students', icon: '🎓' },
          { name: 'Teachers', href: '/teachers', icon: '👨‍🏫' },
          { name: 'Courses', href: '/courses', icon: '📚' },
          { name: 'Reports', href: '/reports', icon: '📊' },
          { name: 'Advanced Statistics', href: '/admin/advanced-statistics', icon: '📈' },
        ];
      case 'Teacher':
        return [
          ...baseNavigation,
          { name: 'My Classes', href: '/classes', icon: '📖' },
          { name: 'Students', href: '/students', icon: '🎓' },
          { name: 'Courses', href: '/courses', icon: '📚' },
        ];
      case 'Student':
        return [
          ...baseNavigation,
          { name: 'My Courses', href: '/courses', icon: '📚' },
          { name: 'Assignments', href: '/assignments', icon: '📝' },
          { name: 'Grades', href: '/grades', icon: '🏆' },
          { name: 'Schedule', href: '/schedule', icon: '📅' },
        ];
      case 'Finance Admin':
        return [
          ...baseNavigation,
          { name: 'Fee Management', href: '/fees', icon: '💰' },
          { name: 'Students', href: '/students', icon: '🎓' },
          { name: 'Reports', href: '/reports', icon: '📊' },
          { name: 'Advanced Statistics', href: '/admin/advanced-statistics', icon: '📈' },
        ];
      case 'Receptionist':
        return [
          ...baseNavigation,
        ];
      case 'IT':
        return [
          ...baseNavigation,
          { name: 'Student Management', href: '/it/students', icon: '👨‍🎓' },
          { name: 'System Reports', href: '/it/reports', icon: '📊' },
        ];
      case 'InstituteAdmin':
        return [
          ...baseNavigation,
          { name: 'Staff Management', href: '/institute-admin/staff', icon: '👥' },
          { name: 'Student Management', href: '/institute-admin/students', icon: '🎓' },
          { name: 'Enquiry Management', href: '/institute-admin/enquiries', icon: '📋' },
          { name: 'Reports', href: '/reports', icon: '📊' },
          { name: 'Advanced Statistics', href: '/admin/advanced-statistics', icon: '📈' },
        ];
      default:
        return baseNavigation;
    }
  };

  const navigation = getNavigationForRole(user?.role || '');

  return (
    <div className="relative min-h-screen flex bg-background overflow-hidden font-sans">
      {/* Animated blurred gradient background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-primary/70 via-accent/40 to-primary/90 blur-[120px] opacity-60 animate-float-slow" />
        <div className="absolute bottom-0 right-0 w-[340px] h-[340px] rounded-full bg-gradient-to-tr from-accent/70 via-primary/40 to-accent/90 blur-[100px] opacity-50 animate-float-slower" />
      </div>
      {/* Backdrop/Overlay - Only visible when sidebar is open */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-10 transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Hamburger Menu Button - Only visible when sidebar is collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-30 p-3 rounded-xl bg-white/80 backdrop-blur-xl shadow-lg border border-border hover:bg-white/90 hover:shadow-xl text-primary transition-all duration-200 hover:scale-105"
          title="Open Menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      {/* Sidebar - Only visible when not collapsed */}
      {!sidebarCollapsed && (
        <aside className="fixed top-0 left-0 z-20 flex flex-col w-56 h-screen bg-white/60 backdrop-blur-xl shadow-2xl border-r border-border rounded-tl-3xl rounded-bl-3xl transition-all duration-300">
          {/* Sidebar Header */}
          <div className="flex flex-col items-center px-3 pt-6 pb-4">
            <div className="mb-6 flex flex-col items-center w-full">
              <div className="rounded-2xl bg-white/80 shadow-lg border-2 border-primary p-2 mb-2 transition-transform duration-300 hover:scale-105 hover:shadow-2xl flex-shrink-0">
                <img src={logo} alt="PGC Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-contain" />
              </div>
              <span className="text-sm font-bold text-primary tracking-tight font-[Sora,Inter,sans-serif] whitespace-nowrap">PGC</span>
            </div>
            
            {/* Toggle Button - Close */}
            <button
              onClick={toggleSidebar}
              className="mb-4 p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-200 hover:scale-105"
              title="Close Menu"
            >
              <X className="h-4 w-4" />
            </button>
            
            {/* Navigation */}
            <nav className="flex flex-col gap-2 w-full">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 group shadow-none hover:shadow-md hover:bg-primary/10 hover:text-primary focus:bg-primary/20 focus:text-primary ${isActive ? 'bg-primary/90 text-white shadow-lg' : 'text-foreground'}`}
                    style={{fontFamily: 'Inter, sans-serif'}}
                  >
                    <span className="text-base md:text-lg transition-transform duration-200 group-hover:scale-110 group-active:scale-95 flex-shrink-0">
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Sidebar Footer - User Info and Logout */}
          <div className="mt-auto p-3 border-t border-border/20">
            {/* Notifications */}
            <button 
              className="w-full mb-3 p-2 rounded-xl hover:bg-primary/10 transition-colors flex items-center gap-3"
            >
              <Bell className="h-5 w-5 text-primary" />
              <span className="text-sm text-primary font-medium">Notifications</span>
            </button>
            
            {/* User Info */}
            <div className="mb-3 p-2 bg-white/80 rounded-xl shadow border border-border">
              <div className="text-xs text-gray-600 font-medium">Logged in as:</div>
              <div className="text-sm font-semibold text-primary truncate">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-gray-500 truncate">{user?.role}</div>
            </div>
            
            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors font-medium text-sm px-3"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2">Logout</span>
            </Button>
          </div>
        </aside>
      )}
      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300 ${sidebarCollapsed ? 'ml-0' : 'ml-56'}`}>
        {/* Page content */}
        <main className="flex-1 p-3 md:p-4 bg-transparent relative z-10">
          {children}
        </main>
      </div>
      {/* Animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-24px) scale(1.04); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(18px) scale(1.02); }
        }
        .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 10s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Layout;
