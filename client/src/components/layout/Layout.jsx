import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { getQuickAccessForRole } from '../../config/dashboardCards';
import { Button } from '../ui/button';
import { Menu, X, LogOut, Bell } from 'lucide-react';
import * as Icons from 'lucide-react';
import logo from '../../../assets/logo.png';

const Layout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const { user, logout } = useAuth();
  const { userRole } = usePermissions();
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

  // Get dynamic navigation based on permissions
  const getNavigationItems = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/dashboard', icon: 'Home' },
    ];

    // Get role-specific quick access items from dashboard config
    const quickAccessItems = getQuickAccessForRole(userRole);
    
    // Convert quick access items to navigation format
    const dynamicNavigation = quickAccessItems.map(item => ({
      name: item.title,
      href: item.href,
      icon: item.icon
    }));

    return [...baseNavigation, ...dynamicNavigation];
  };

  const navigation = getNavigationItems();

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
        <aside className="fixed top-0 left-0 z-20 flex flex-col w-64 h-screen bg-white/80 backdrop-blur-2xl shadow-2xl border-r border-border/50 transition-all duration-300">
          {/* Animated gradient bar */}
          <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />
          
          {/* Sidebar Header */}
          <div className="flex flex-col items-center px-4 pt-8 pb-6">
            <div className="mb-8 flex flex-col items-center w-full">
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 blur-xl opacity-70" />
                <div className="relative rounded-3xl bg-white/90 shadow-2xl border-2 border-primary/20 p-4 transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_64px_0_rgba(26,35,126,0.18)] flex-shrink-0">
                  <img src={logo} alt="PGC Logo" className="w-12 h-12 rounded-2xl object-contain animate-float" />
                </div>
              </div>
              <span className="text-lg font-extrabold text-primary tracking-tight font-[Sora,Inter,sans-serif] drop-shadow-sm">PGC</span>
              <span className="text-xs text-primary/70 font-[Inter,sans-serif]">Portal</span>
            </div>
            
            {/* Toggle Button - Close */}
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 blur-lg opacity-70" />
              <button
                onClick={toggleSidebar}
                className="relative p-3 rounded-xl bg-white/60 backdrop-blur-xl border border-border/50 hover:bg-white/80 text-primary transition-all duration-200 hover:scale-105 hover:shadow-lg"
                title="Close Menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Navigation */}
            <nav className="flex flex-col gap-3 w-full">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                const IconComponent = Icons[item.icon] || Icons.Circle;
                
                return (
                  <div key={item.name} className="relative group">
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-accent to-primary blur-lg opacity-20 animate-gradient-x" />
                    )}
                    <Link
                      to={item.href}
                      className={`relative flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 group shadow-none hover:shadow-xl border border-transparent ${
                        isActive 
                          ? 'bg-gradient-to-r from-primary to-accent text-white shadow-2xl border-primary/20 animate-float' 
                          : 'text-foreground hover:bg-white/60 hover:text-primary hover:border-primary/20 backdrop-blur-sm'
                      }`}
                      style={{fontFamily: 'Inter, sans-serif'}}
                    >
                      <div className={`p-2 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-white/20 shadow-lg' 
                          : 'bg-primary/10 group-hover:bg-primary/20'
                      }`}>
                        <IconComponent className="h-5 w-5 transition-all duration-300 group-hover:scale-110 group-active:scale-95 flex-shrink-0" />
                      </div>
                      <span className="text-sm font-medium truncate">{item.name}</span>
                      {isActive && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/60 rounded-l-full" />
                      )}
                    </Link>
                  </div>
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
