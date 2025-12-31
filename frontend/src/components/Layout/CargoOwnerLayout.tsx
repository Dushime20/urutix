import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FaBars, FaBell, FaUser, FaSearch, FaSignOutAlt, FaCog } from 'react-icons/fa';
import CargoOwnerSidebar from './CargoOwnerSidebar';
import { CargoOwnerLayoutProvider } from '../../contexts/CargoOwnerLayoutContext';
import { useAuth } from '../../contexts/AuthContext';
import logoUrutiX from '../../assets/logo-urutix.svg';
import { LanguageSwitcher } from '@/components/language-switcher';

const CargoOwnerLayout: React.FC = () => {
  // Sidebar open by default on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      // Desktop: show sidebar by default, Mobile: hide sidebar by default
      return window.innerWidth >= 1024; // lg breakpoint (1024px)
    }
    // SSR fallback: hide by default
    return false;
  });
  
  // Ensure sidebar is hidden on mobile on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Debug: Log user data to see what we have
  useEffect(() => {
    if (user) {
      console.log('🔍 CargoOwnerLayout - User data:', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        hasFirstName: !!user.firstName,
        hasLastName: !!user.lastName,
        firstNameType: typeof user.firstName,
        lastNameType: typeof user.lastName,
        firstNameLength: user.firstName?.length,
        lastNameLength: user.lastName?.length,
        firstNameValue: user.firstName === '' ? 'EMPTY_STRING' : user.firstName,
        lastNameValue: user.lastName === '' ? 'EMPTY_STRING' : user.lastName,
      });
      console.log('🔍 CargoOwnerLayout - Full user object:', JSON.stringify(user, null, 2));
    } else {
      console.log('⚠️ CargoOwnerLayout - No user object');
    }
  }, [user]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [isLoading, user, navigate]);

  // Redirect brokers to their own layout
  useEffect(() => {
    if (!isLoading && user && user.role === 'BROKER') {
      navigate('/dashboard/broker', { replace: true });
    }
  }, [isLoading, user, navigate]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking inside the user menu
      if (userMenuRef.current && userMenuRef.current.contains(target)) {
        console.log('🟡 Click INSIDE menu, keeping menu open', target);
        return; // Don't close menu, let the click handler inside handle it
      }
      
      // Check if click is on logout div specifically
      if (target.closest('[role="button"][aria-label="Logout"]')) {
        console.log('🟡 Click detected on logout div, keeping menu open');
        return; // Don't close menu, let logout div handle it
      }
      
      // Only close if clicking outside
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        console.log('🟡 Click outside menu, closing...', target);
        setShowUserMenu(false);
      }
    };

    // Use capture phase but with a small delay to allow menu clicks to register first
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth < 1024 && sidebarOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.sidebar-container') && !target.closest('.menu-toggle-button')) {
          setSidebarOpen(false);
        }
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [sidebarOpen]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = async (e?: React.MouseEvent) => {
    console.log('🔄 handleLogout called', { e, user: !!user, logout: !!logout });
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setShowUserMenu(false);
    
    try {
      console.log('🔄 Starting logout process...');
      
      if (!logout) {
        console.error('❌ Logout function is not available!');
        // Force redirect anyway
        window.location.href = '/auth';
        return;
      }
      
      // Call logout to clear tokens and user data
      logout();
      
      console.log('✅ Logout function called, waiting before redirect...');
      
      // Small delay to ensure logout completes before navigation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('🔄 Redirecting to auth page...');
      
      // Force hard navigation to ensure logout works
      window.location.href = '/auth';
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if logout fails, redirect to auth page
      window.location.href = '/auth';
    }
  };

  return (
    <CargoOwnerLayoutProvider
      value={{
        sidebarCollapsed: !sidebarOpen,
        toggleSidebar,
        setSidebarCollapsed: (collapsed: boolean) => setSidebarOpen(!collapsed),
        hideHeader,
        setHideHeader,
      }}
    >
      <div className="flex h-screen bg-gray-50 relative">
        {/* Background Logo */}
        <img 
          src={logoUrutiX} 
          alt="UrutiX Logo Background" 
          className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0" 
          style={{objectPosition: 'center'}} 
        />
        
        {/* Overlay - only on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`sidebar-container fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <CargoOwnerSidebar 
            isCollapsed={false} 
            onToggle={toggleSidebar}
            userRole={user?.role}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main Content */}
        <div className={`flex-1 flex flex-col overflow-hidden relative z-0 w-full transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : ''
        }`}>
          {/* Header */}
          <header 
            className={`bg-white border-b border-gray-200 px-2 sm:px-4 py-2.5 sticky top-0 z-[9998] transition-all duration-300 ${
              hideHeader ? 'hidden' : ''
            }`}
            style={{ display: hideHeader ? 'none' : 'block' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                {/* Menu Toggle Button */}
                <button
                  onClick={toggleSidebar}
                  className="menu-toggle-button p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 relative z-20"
                  aria-label="Toggle sidebar"
                >
                  <FaBars className="w-5 h-5 text-gray-600" />
                </button>
                
                {/* Search Bar */}
                <div className="relative flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                  <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="Search cargo, shipments..."
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Right Side Header */}
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                {/* Language Switcher */}
                <LanguageSwitcher variant="default" />
                
                {/* Notifications */}
                <button className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <FaBell className="w-4 h-4 text-gray-600" />
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                    3
                  </span>
                </button>

                {/* User Menu */}
                <div className="relative z-[9999]" ref={userMenuRef}>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-medium text-gray-900">
                        {(() => {
                          const firstName = user?.firstName || '';
                          const lastName = user?.lastName || '';
                          const fullName = `${firstName} ${lastName}`.trim();
                          if (fullName) {
                            return fullName;
                          }
                          // Fallback to email username if names not available
                          return user?.email ? user.email.split('@')[0] : 'User';
                        })()}
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        console.log('🟡 Profile icon clicked, showUserMenu:', showUserMenu);
                        setShowUserMenu(!showUserMenu);
                        console.log('🟡 showUserMenu after toggle:', !showUserMenu);
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="User menu"
                    >
                      <FaUser className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5"
                      style={{ 
                        zIndex: 9999,
                        pointerEvents: 'auto',
                        position: 'absolute'
                      }}
                      ref={(el) => {
                        if (el) {
                          console.log('🟢 Dropdown menu rendered!', el);
                        }
                      }}
                    >
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/cargo-owner/profile');
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <FaUser className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/cargo-owner/settings');
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <FaCog className="w-3.5 h-3.5" />
                        <span>Settings</span>
                      </button>
                      <hr className="my-1" />
                      <button
                        type="button"
                        onClick={(e) => {
                          console.log('🔴🔴🔴 LOGOUT BUTTON CLICKED!', e, e.target);
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Direct logout - immediate action
                          console.log('🔴 Starting immediate logout...');
                          
                          // Clear tokens immediately
                          localStorage.removeItem('accessToken');
                          localStorage.removeItem('refreshToken');
                          
                          // Call logout function if available
                          if (logout && typeof logout === 'function') {
                            try {
                              logout();
                            } catch (err) {
                              console.error('Logout function error:', err);
                            }
                          }
                          
                          // Force immediate redirect - no delay
                          console.log('🔴 Redirecting to /auth NOW...');
                          window.location.href = '/auth';
                        }}
                        onMouseDown={(e) => {
                          console.log('🔴 LOGOUT BUTTON MOUSEDOWN!', e, e.target);
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onMouseEnter={() => {
                          console.log('🔴 LOGOUT BUTTON MOUSE ENTER!');
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 active:bg-red-100 flex items-center space-x-2 cursor-pointer transition-colors"
                        style={{ 
                          pointerEvents: 'auto',
                          zIndex: 10000,
                          position: 'relative',
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          touchAction: 'manipulation',
                          background: 'transparent',
                          border: 'none',
                          outline: 'none'
                        }}
                        aria-label="Logout"
                        data-testid="logout-button"
                      >
                        <FaSignOutAlt className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            <div className="p-4">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </CargoOwnerLayoutProvider>
  );
};

export default CargoOwnerLayout; 