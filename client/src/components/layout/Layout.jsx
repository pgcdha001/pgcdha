import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import logo from '../../../assets/logo.png';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Role-based navigation
  const getNavigationForRole = (role) => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    ];
    switch (role) {
      case 'SystemAdmin':
        return [
          ...baseNavigation,
          { name: 'User Management', href: '/admin', icon: '👥' },
          { name: 'Institute Management', href: '/institutes', icon: '🏫' },
          { name: 'Reports', href: '/reports', icon: '📊' },
        ];
      case 'College Admin':
      case 'Academic Admin':
        return [
          ...baseNavigation,
          { name: 'Students', href: '/students', icon: '🎓' },
          { name: 'Teachers', href: '/teachers', icon: '👨‍🏫' },
          { name: 'Courses', href: '/courses', icon: '📚' },
          { name: 'Reports', href: '/reports', icon: '📊' },
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
        ];
      case 'Receptionist':
        return [
          ...baseNavigation,
          { name: 'Admissions', href: '/admissions', icon: '📝' },
          { name: 'Students', href: '/students', icon: '🎓' },
          { name: 'Visitors', href: '/visitors', icon: '👥' },
        ];
      case 'IT':
        return [
          ...baseNavigation,
          { name: 'Student Management', href: '/it/students', icon: '👨‍🎓' },
          { name: 'System Reports', href: '/it/reports', icon: '📊' },
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
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-20 flex flex-col w-16 md:w-56 h-screen bg-white/60 backdrop-blur-xl shadow-2xl border-r border-border rounded-tl-3xl rounded-bl-3xl transition-all duration-300">
        <div className="flex flex-col items-center md:items-start px-3 pt-6 pb-4">
          <div className="mb-6 flex flex-col items-center w-full">
            <div className="rounded-2xl bg-white/80 shadow-lg border-2 border-primary p-2 mb-2 transition-transform duration-300 hover:scale-105 hover:shadow-2xl flex-shrink-0">
              <img src={logo} alt="PGC Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-contain" />
            </div>
            <span className="hidden md:block text-sm font-bold text-primary tracking-tight font-[Sora,Inter,sans-serif] whitespace-nowrap">PGC</span>
          </div>
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
                  <span className="hidden md:inline-block text-sm font-medium truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 ml-16 md:ml-56">
        {/* Topbar */}
        <header className="fixed top-0 left-16 md:left-56 right-0 z-30 flex items-center justify-between px-6 py-4 bg-white/70 backdrop-blur-xl shadow-md border-b border-border" style={{ borderRadius: 0 }}>
          <div className="flex-1 flex items-center gap-4">
            {/* Placeholder for search or page title */}
          </div>
          <div className="flex items-center gap-6">
            {/* Notifications (placeholder) */}
            <button className="relative p-2 rounded-full hover:bg-primary/10 transition-colors">
              <span className="sr-only">Notifications</span>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-primary"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"/></svg>
            </button>
            {/* User info */}
            <div className="flex items-center gap-2 bg-white/80 px-3 py-2 rounded-xl shadow border border-border">
              <span className="text-primary font-medium text-sm font-[Inter,sans-serif] truncate max-w-32">{user?.firstName} {user?.lastName}</span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-accent border-accent hover:bg-accent hover:text-white transition-colors font-medium text-sm font-[Inter,sans-serif] px-3 py-1"
              >
                Logout
              </Button>
            </div>
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 p-3 md:p-4 bg-transparent relative z-10 pt-16">
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
