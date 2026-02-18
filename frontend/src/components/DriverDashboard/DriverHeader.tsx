import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bell,
  HelpCircle,
  Settings,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react';
import logoUrutiX from '../../assets/urutiX Logistics Logo (1).svg';

import { TranslatedText } from '../translated-text';

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface DriverHeaderProps {
  driver: any;
  lastUpdated: Date;
  isRefreshing: boolean;
  onRefresh: () => void;
  onToggleNotifications: () => void;
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  tabs: Tab[];
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
  driver,
  activeTab,
  setActiveTab,
  onToggleNotifications,
  tabs
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Dropdown states
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
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

  const handleLogout = () => {
    try {
      if (logout) logout();
      else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/auth');
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 text-gray-900 px-4 pt-6 pb-3 sm:px-6 sm:pt-8 sm:pb-4 sticky top-0 z-[100]">
      <header className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo Section */}
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80" onClick={() => navigate('/dashboard')}>
            <img src={logoUrutiX} alt="UrutiX" className="h-10 sm:h-14 md:h-18 lg:h-20 w-auto object-contain" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 px-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap shrink-0
                                        ${isActive
                      ? 'bg-blue-50 text-[#345E85]'
                      : 'text-slate-500 hover:text-[#345E85] hover:bg-slate-50'}
                                    `}
                >
                  <Icon size={18} />
                  <TranslatedText text={tab.label} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">

          {/* Notifications */}
          <button
            onClick={onToggleNotifications}
            className="p-2.5 bg-slate-50 text-slate-500 hover:text-[#345E85] hover:bg-blue-50 rounded-full transition-all relative group shadow-sm sm:shadow-none"
          >
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white shadow-sm ring-1 ring-rose-200 animate-pulse"></span>
          </button>

          {/* Help Button */}
          <button
            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-full text-slate-600 hover:border-[#345E85] hover:text-[#345E85] transition-all shadow-sm group"
          >
            <HelpCircle size={18} className="text-slate-400 group-hover:text-[#345E85] transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-widest">Help</span>
          </button>

          {/* User Profile */}
          <div className="relative pl-2 ml-1 border-l border-slate-100" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="h-10 w-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center hover:bg-slate-900 transition-all shadow-lg shadow-slate-200/50 relative overflow-hidden group border-2 border-white"
            >
              {driver?.profileImage ? (
                <img
                  src={driver.profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
              ) : (
                <User size={20} className="transition-transform group-hover:scale-110" />
              )}
            </button>

            {/* Profile Dropdown */}
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 border-b border-slate-50 mb-2">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {driver?.firstName ? `${driver.firstName} ${driver.lastName || ''}` : 'Driver'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{driver?.email}</p>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-3 transition-colors"
                >
                  <User size={16} /> <TranslatedText text="Profile" />
                </button>
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-3 transition-colors"
                >
                  <Settings size={16} /> <TranslatedText text="Settings" />
                </button>
                <div className="h-px bg-slate-50 my-2" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-slate-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white absolute w-full left-0 shadow-lg py-4 px-4 flex flex-col gap-2 top-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-base font-semibold rounded-lg transition-colors text-left
                                     ${activeTab === tab.id
                    ? 'bg-blue-50 text-[#345E85]'
                    : 'text-slate-600 hover:bg-slate-50'}
                                 `}
              >
                <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                  <Icon size={18} className={activeTab === tab.id ? "text-[#345E85]" : "text-slate-400"} />
                </div>
                <TranslatedText text={tab.label} />
              </button>
            );
          })}
          <div className="h-px bg-slate-100 my-1" />
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
