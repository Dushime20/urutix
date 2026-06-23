import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bell,
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
import CargoOwnerNotificationDropdown from '../notifications/CargoOwnerNotificationDropdown';
import CurrencySelector from '../common/CurrencySelector';
import ThemeToggle from '../Theme/ThemeToggle';
import { TranslatedText } from '../translated-text';
import { motion, AnimatePresence } from 'framer-motion';


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
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  tabs: Tab[];
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
  driver,
  activeTab,
  setActiveTab,
  isRefreshing,
  onRefresh,
  tabs
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState<string | null>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Auto-expand the parent that contains the active sub-tab when drawer opens
  useEffect(() => {
    if (isMobileMenuOpen) {
      const parentTab = tabs.find(t => t.subItems?.some(s => s.id === activeTab));
      if (parentTab) setMobileOpenDropdown(parentTab.id);
    }
  }, [isMobileMenuOpen, activeTab, tabs]);

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 cursor-pointer transition-all duration-300 hover:opacity-80 active:scale-95`} onClick={() => navigate('/dashboard')}>
              <img src={logoUrutiX} alt="UrutiX" className="h-6 sm:h-10 md:h-12 w-auto object-contain" />
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
                      className={`flex items-center gap-2 px-5 py-2.5 text-[11px] font-black rounded-2xl transition-all duration-300 whitespace-nowrap shrink-0 tracking-wider uppercase
                        ${isTabActive
                          ? 'bg-[#2b5271] dark:bg-[#2b5271] text-white'
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
                          className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 py-2 z-[110] overflow-hidden"
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
            <div className="hidden lg:block">
              <CargoOwnerNotificationDropdown />
            </div>

            {/* Currency selector */}
            <div className="hidden lg:block">
              <CurrencySelector variant="compact" />
            </div>

            {/* Theme Toggle */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {/* User Profile */}
            <div className="relative pl-2 ml-1 border-l border-slate-100 dark:border-slate-800" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-10 w-10 rounded-full bg-[#1e293b] text-white flex items-center justify-center hover:opacity-90 transition-all relative overflow-hidden group border-2 border-white dark:border-slate-800"
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
                    className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden py-2 z-50 origin-top-right"
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

      {/* Mobile Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[150] bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-stretch">
          {/* Overview */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all ${activeTab === 'overview' ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`}
          >
            {React.createElement(tabs.find(t => t.id === 'overview')?.icon || (() => null), { size: 20 })}
            <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
          </button>

          {/* Missions — opens drawer to missions section */}
          <button
            onClick={() => {
              setMobileOpenDropdown('missions');
              setIsMobileMenuOpen(true);
            }}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all ${
              ['missions','trips','checklist','post_trip','cargo','leaderboard','announcements'].includes(activeTab)
                ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`}
          >
            {React.createElement(tabs.find(t => t.id === 'missions')?.icon || (() => null), { size: 20 })}
            <span className="text-[8px] font-black uppercase tracking-widest">Missions</span>
          </button>

          {/* Fleet & Finance — opens drawer */}
          <button
            onClick={() => {
              setMobileOpenDropdown('fleet_finance');
              setIsMobileMenuOpen(true);
            }}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all ${
              ['truck_details','fuel','wallet','earnings','safety','documents'].includes(activeTab)
                ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`}
          >
            {React.createElement(tabs.find(t => t.id === 'fleet_finance')?.icon || (() => null), { size: 20 })}
            <span className="text-[8px] font-black uppercase tracking-widest">Fleet</span>
          </button>

          {/* Messages */}
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all ${activeTab === 'messages' ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`}
          >
            {React.createElement(tabs.find(t => t.id === 'messages')?.icon || (() => null), { size: 20 })}
            <span className="text-[8px] font-black uppercase tracking-widest">Messages</span>
          </button>

          {/* Menu (full drawer) */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-slate-400 dark:text-slate-500 transition-all"
          >
            <Menu size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">More</span>
          </button>
        </div>
      </div>
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm z-[240]"
            />

            {/* Side Drawer Menu */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-[85%] sm:w-[320px] bg-white dark:bg-slate-900 z-[250] flex flex-col border-r border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <img src={logoUrutiX} alt="UrutiX" className="h-8 w-auto" />
                <button 
                   onClick={() => setIsMobileMenuOpen(false)}
                   className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-4">Navigation</h4>
                  <nav className="space-y-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const hasSubItems = tab.subItems && tab.subItems.length > 0;
                      const isDropdownOpen = mobileOpenDropdown === tab.id;
                      const isTabActive = activeTab === tab.id || tab.subItems?.some(s => s.id === activeTab);

                      return (
                        <div key={tab.id} className="w-full">
                          <button
                            onClick={() => {
                              if (hasSubItems) {
                                setMobileOpenDropdown(isDropdownOpen ? null : tab.id);
                              } else {
                                setActiveTab(tab.id);
                                setIsMobileMenuOpen(false);
                              }
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3.5 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all
                              ${isTabActive
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-200/50 scale-[1.02]'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <Icon size={18} />
                              <TranslatedText text={tab.label} />
                            </div>
                            {hasSubItems && (
                              <ChevronDown size={14} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            )}
                          </button>

                          <AnimatePresence>
                            {hasSubItems && isDropdownOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-slate-50/80 dark:bg-slate-800/20 rounded-2xl mt-1 ml-4 border-l-2 border-primary-100 dark:border-primary-900/30"
                              >
                                <div className="py-2 space-y-0.5">
                                  {tab.subItems?.map((sub) => {
                                    const SubIcon = sub.icon;
                                    return (
                                      <button
                                        key={sub.id}
                                        onClick={() => {
                                          setActiveTab(sub.id);
                                          setIsMobileMenuOpen(false);
                                          setMobileOpenDropdown(null);
                                        }}
                                        className={`w-full text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-3 rounded-xl mx-1
                                          ${activeTab === sub.id
                                            ? 'text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-800/50 shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800/30 hover:text-primary-500'}`}
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
                  </nav>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-4">Account & Settings</h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-3"
                    >
                      <User size={16} /> <TranslatedText text="My Profile" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-3"
                    >
                      <Settings size={16} /> <TranslatedText text="Dashboard Settings" />
                    </button>
                    <div className="h-px bg-slate-50 dark:bg-slate-800 my-2" />
                    <div className="flex items-center justify-between px-4 py-3 mb-2 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <TranslatedText text="Language" />
                      </span>
                      <LanguageSwitcher />
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-4 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-2xl flex items-center gap-3 transition-colors"
                    >
                      <LogOut size={16} /> <TranslatedText text="Sign Out" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-800/30">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                    {driver?.profileImage ? (
                      <img src={driver.profileImage} alt="P" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                      {driver ? `${driver.firstName} ${driver.lastName}` : 'Driver'}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate tracking-widest">UrutiX Elite Driver</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

