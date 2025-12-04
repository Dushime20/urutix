import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FaBars, FaBell, FaUser, FaSearch, FaSignOutAlt, FaCog } from 'react-icons/fa';
import CargoOwnerSidebar from './CargoOwnerSidebar';
import { CargoOwnerLayoutProvider } from '../../contexts/CargoOwnerLayoutContext';
import { useAuth } from '../../contexts/AuthContext';
import logoUrutiX from '../../assets/logo-urutix.svg';
import { LanguageSwitcher } from '@/components/language-switcher';

const CargoOwnerLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [isLoading, user, navigate]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <CargoOwnerLayoutProvider
      value={{
        sidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
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
        
        {/* Sidebar */}
        <CargoOwnerSidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={toggleSidebar} 
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-4 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Search Bar */}
                <div className="relative">
                  <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="Search cargo, shipments..."
                    className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-56"
                  />
                </div>
              </div>

              {/* Right Side Header */}
              <div className="flex items-center space-x-3">
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
                <div className="relative" ref={userMenuRef}>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-[10px] text-gray-500">Cargo Owner</div>
                    </div>
                    <button 
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FaUser className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-50">
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
                        onClick={handleLogout}
                        className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-gray-100 flex items-center space-x-2"
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