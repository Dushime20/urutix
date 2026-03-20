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
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import logoUrutiX from '../../assets/urutiX Logistics Logo (1).svg';
import LanguageSwitcher from '../LanguageSwitcher';
import { TranslatedText } from '../translated-text';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Route, Truck, MessageSquare } from 'lucide-react';


interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
  subItems?: Array<{
    id: string;
    label: string;
    icon?: React.ElementType;
  }>;
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
  isRefreshing,
  onRefresh,
  tabs
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      
      Object.keys(dropdownRefs.current).forEach(key => {
        if (dropdownRefs.current[key] && !dropdownRefs.current[key]?.contains(event.target as Node)) {
          setOpenDropdown(prev => prev === key ? null : prev);
        }
      });
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
    <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 pt-6 pb-3 sm:pt-8 sm:pb-4 px-4 md:px-8 lg:px-12 xl:px-20 sticky top-0 z-[100]">
      <div className="max-w-[1920px] mx-auto flex items-center justify-between">
        <header className="flex-1 flex items-center justify-between gap-4">

          {/* Logo Section */}
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80" onClick={() => navigate('/dashboard')}>
              <img src={logoUrutiX} alt="UrutiX" className="h-8 sm:h-12 md:h-16 lg:h-20 w-auto object-contain max-w-none" />
            </div>


            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const hasSubItems = tab.subItems && tab.subItems.length > 0;
                const isDropdownOpen = openDropdown === tab.id;
                const isTabActive = activeTab === tab.id || tab.subItems?.some(s => s.id === activeTab);

                return (
                  <div key={tab.id} className="relative" ref={el => dropdownRefs.current[tab.id] = el}>
                    <button
                      onClick={() => {
                        if (hasSubItems) {
                          setOpenDropdown(isDropdownOpen ? null : tab.id);
                        } else {
                          setActiveTab(tab.id);
                        }
                      }}
                      className={`flex items-center gap-2 px-5 py-2.5 text-[11px] font-black rounded-xl transition-all duration-300 whitespace-nowrap shrink-0 tracking-wider uppercase
                        ${isTabActive
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}
                      `}
                    >
                      <Icon size={16} />
                      <TranslatedText text={tab.label} />
                      {hasSubItems && (
                        <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    <AnimatePresence>
                      {hasSubItems && isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-[110] overflow-hidden"
                        >
                          {tab.subItems?.map((subItem) => {
                             const SubIcon = subItem.icon;
                             return (
                              <button
                                key={subItem.id}
                                onClick={() => {
                                  setActiveTab(subItem.id);
                                  setOpenDropdown(null);
                                }}
                                className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-3
                                  ${activeTab === subItem.id
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-500'}`}
                              >
                                {SubIcon && <SubIcon size={14} />}
                                <TranslatedText text={subItem.label} />
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Sync Button */}
            <div className="hidden sm:block">
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className={`p-2.5 rounded-full border border-gray-100 dark:border-slate-800 transition-all ${isRefreshing ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-600'
                  }`}
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <LanguageSwitcher />

            {/* Notifications */}
            <div className="hidden lg:block relative">
              <button
                onClick={onToggleNotifications}
                className="p-2.5 rounded-full border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all relative group"
              >
                <Bell size={20} className="text-slate-400" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ring-1 ring-rose-200 animate-pulse"></span>
              </button>
            </div>

            {/* Help Button */}
            <button
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all font-bold text-slate-600 dark:text-slate-400 text-[11px] tracking-wider uppercase"
            >
              <div className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </div>
              <span className="hidden lg:inline"><TranslatedText text="HELP" /></span>
            </button>

            {/* User Profile */}
            <div className="relative pl-2 ml-1 border-l border-slate-100 dark:border-slate-800" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-10 w-10 rounded-full bg-[#1e293b] text-white flex items-center justify-center hover:opacity-90 transition-all shadow-lg shadow-slate-200/50 dark:shadow-none relative overflow-hidden group border-2 border-white dark:border-slate-800"
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

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden py-2 z-50 origin-top-right"
                  >
                    <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 mb-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {driver?.firstName ? `${driver.firstName} ${driver.lastName || ''}` : 'Driver'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{driver?.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-3 transition-colors"
                    >
                      <User size={16} /> <TranslatedText text="Profile" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-3 transition-colors"
                    >
                      <Settings size={16} /> <TranslatedText text="Settings" />
                    </button>
                    <div className="h-px bg-slate-50 dark:bg-slate-800 my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors flex items-center gap-3 transition-colors"
                    >
                      <LogOut size={16} /> <TranslatedText text="Sign Out" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-slate-600 dark:text-slate-400"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

          </div>
        </header>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 absolute w-full left-0 shadow-lg py-4 px-4 flex flex-col gap-2 top-full overflow-hidden"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const hasSubItems = tab.subItems && tab.subItems.length > 0;
              const isDropdownOpen = openDropdown === tab.id;
              const isTabActive = activeTab === tab.id || tab.subItems?.some(s => s.id === activeTab);

              return (
                <div key={tab.id} className="w-full">
                  <button
                    onClick={() => {
                      if (hasSubItems) {
                        setOpenDropdown(isDropdownOpen ? null : tab.id);
                      } else {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-colors text-left
                      ${isTabActive
                        ? 'bg-primary-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <TranslatedText text={tab.label} />
                    </div>
                    {hasSubItems && (
                      <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  <AnimatePresence>
                    {hasSubItems && isDropdownOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-slate-50 dark:bg-slate-800/50 rounded-xl mt-1 ml-4 border-l-2 border-primary-100 dark:border-primary-900/30"
                      >
                        <div className="py-2 space-y-1">
                          {tab.subItems?.map((sub) => {
                            const SubIcon = sub.icon;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setActiveTab(sub.id);
                                  setIsMobileMenuOpen(false);
                                  setOpenDropdown(null);
                                }}
                                className={`w-full text-left px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-3
                                  ${activeTab === sub.id
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-primary-500'}`}
                              >
                                {SubIcon && <SubIcon size={14} />}
                                <TranslatedText text={sub.label} />
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <TranslatedText text="Localization" />
              </span>
              <LanguageSwitcher />
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-3 transition-colors"
            >
              <LogOut size={16} /> <TranslatedText text="Sign Out" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📱 Mobile Bottom Tactical Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[200] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-6 py-3 pb-8 flex items-center justify-between shadow-[0_-10px_40px_rgba(15,23,42,0.1)]">
         {[
            { id: 'overview', label: 'Home', icon: Home },
            { id: 'trips', label: 'Mission', icon: Route },
            { id: 'wallet', label: 'Finance', icon: Truck },
            { id: 'messages', label: 'Chat', icon: MessageSquare },
         ].map((nav) => {
            const isActive = activeTab === nav.id || (nav.id === 'trips' && ['cargo', 'checklist', 'leaderboard', 'announcements'].includes(activeTab)) || (nav.id === 'wallet' && ['fuel', 'earnings', 'safety', 'documents'].includes(activeTab));
            return (
               <button 
                  key={nav.id}
                  onClick={() => setActiveTab(nav.id)}
                  className="flex flex-col items-center gap-1.5 relative group"
               >
                  <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-600 text-white shadow-xl shadow-primary-200 animate-in zoom-in-95' : 'text-slate-400 group-hover:text-slate-600'}`}>
                     <nav.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
                     <TranslatedText text={nav.label} />
                  </span>
                  {isActive && (
                     <motion.div 
                        layoutId="activeNavTab"
                        className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary-600 rounded-full blur-[2px]"
                     />
                  )}
               </button>
            );
         })}
      </div>
    </div>
  );
};

