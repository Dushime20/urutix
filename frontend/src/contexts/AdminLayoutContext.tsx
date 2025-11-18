import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AdminLayoutContextType {
  // Sidebar state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  isMobile: boolean;
  
  // View preferences
  viewMode: 'grid' | 'list' | 'card';
  setViewMode: (mode: 'grid' | 'list' | 'card') => void;
  
  // Theme and display
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  toggleTheme: () => void;
  
  // Layout density
  isCompactMode: boolean;
  setIsCompactMode: (compact: boolean) => void;
  toggleCompactMode: () => void;
  
  // Full screen mode
  isFullScreen: boolean;
  setIsFullScreen: (fullscreen: boolean) => void;
  toggleFullScreen: () => void;
  
  // Refresh indicator
  isRefreshing: boolean;
  setIsRefreshing: (refreshing: boolean) => void;
}

const AdminLayoutContext = createContext<AdminLayoutContextType | undefined>(undefined);

export const useAdminLayout = () => {
  const context = useContext(AdminLayoutContext);
  if (!context) {
    throw new Error('useAdminLayout must be used within an AdminLayoutProvider');
  }
  return context;
};

interface AdminLayoutProviderProps {
  children: ReactNode;
}

export const AdminLayoutProvider: React.FC<AdminLayoutProviderProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'card'>('list');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleCompactMode = () => setIsCompactMode(!isCompactMode);
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const value: AdminLayoutContextType = {
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    isMobile,
    viewMode,
    setViewMode,
    isDarkMode,
    setIsDarkMode,
    toggleTheme,
    isCompactMode,
    setIsCompactMode,
    toggleCompactMode,
    isFullScreen,
    setIsFullScreen,
    toggleFullScreen,
    isRefreshing,
    setIsRefreshing,
  };

  return (
    <AdminLayoutContext.Provider value={value}>
      <div className={isDarkMode ? 'dark' : ''}>
        {children}
      </div>
    </AdminLayoutContext.Provider>
  );
};
