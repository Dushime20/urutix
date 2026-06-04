import { createPortal } from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LogOut, User, Menu, X, ChevronDown,
  Home, Activity, BarChart3, DollarSign,
  Route, Package, Scale, Settings, ClipboardList,
  Bell, FileText,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import CargoOwnerNotificationDropdown from '../notifications/CargoOwnerNotificationDropdown';
import ContextualHelp from '../Help/ContextualHelp';
import logoUrutiX from '../../assets/urutiX Logistics Logo (1).svg';
import { TranslatedText } from '../translated-text';
import ThemeToggle from '../Theme/ThemeToggle';
import LanguageSwitcher from '../LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';

interface SubNavItem {
  label: string;
  path: string;
  icon?: any;
}

interface NavItem {
  label: string;
  path: string;
  icon: any;
  subItems?: SubNavItem[];
}

// Same grouped-dropdown pattern as DashboardHeader:
// 1 direct link + 2 dropdown groups, each with 4-5 sub-items
const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/admin-operational',
    icon: Home,
  },
  {
    label: 'Operations Suite',
    path: '/admin-operational/trips',
    icon: Activity,
    subItems: [
      { label: 'Trip Monitoring',    path: '/admin-operational/trips',      icon: Route },
      { label: 'Load Management',    path: '/admin-operational/loads',      icon: Package },
      { label: 'Bidding Oversight',  path: '/admin-operational/bidding',    icon: ClipboardList },
      { label: 'Resolution Center',  path: '/admin-operational/disputes',   icon: Scale },
      { label: 'Network Monitoring', path: '/admin-operational/monitoring', icon: Activity },
    ],
  },
  {
    label: 'Intelligence & Finance',
    path: '/admin-operational/analytics',
    icon: BarChart3,
    subItems: [
      { label: 'Analytics',          path: '/admin-operational/analytics',    icon: BarChart3 },
      { label: 'Financial Overview', path: '/admin-operational/financial',    icon: DollarSign },
      { label: 'Reports',            path: '/admin-operational/reports',      icon: FileText },
      { label: 'Activity Logs',      path: '/admin-operational/activity-logs', icon: Bell },
    ],
  },
];

const OperationalAdminHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const getActiveNavItem = () => {
    const path = location.pathname;
    const item = navItems.find(
      (n) =>
        path === n.path ||
        path.startsWith(n.path + '/') ||
        n.subItems?.some((s) => path === s.path || path.startsWith(s.path + '/'))
    );
    return item?.label || null;
  };

  const activeNavItem = getActiveNavItem();

  const handleNavClick = (path?: string) => {
    setOpenDropdown(null);
    setShowMobileMenu(false);
    setShowUserMenu(false);
    if (path) navigate(path);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    setShowMobileMenu(false);
    logout?.();
    navigate('/auth');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      Object.keys(dropdownRefs.current).forEach((key) => {
        if (dropdownRefs.current[key] && !dropdownRefs.current[key]?.contains(e.target as Node)) {
          setOpenDropdown((prev) => (prev === key ? null : prev));
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
    setShowMobileMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? 'hidden' : '';
    if (!showMobileMenu) setOpenDropdown(null);
    return () => { document.body.style.overflow = ''; };
  }, [showMobileMenu]);

  const renderNavItem = (item: NavItem) => {
    const hasSubItems = !!item.subItems?.length;
    const isActive = activeNavItem === item.label;

    return (
      <div
        key={item.label}
        className="relative z-[100]"
        ref={(el) => (dropdownRefs.current[item.label] = el)}
      >
        {hasSubItems ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdown(openDropdown === item.label ? null : item.label);
            }}
            className={`group relative flex items-center gap-1 xl:gap-2 px-2.5 xl:px-4 py-2 text-xs xl:text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap shrink-0 overflow-hidden
              ${isActive
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <div className="absolute inset-0 bg-primary-100/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            <item.icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 transition-transform relative ${isActive ? 'scale-110' : ''}`} />
            <span className="relative"><TranslatedText text={item.label} /></span>
            <ChevronDown className={`w-3 h-3 transition-transform relative ${openDropdown === item.label ? 'rotate-180' : ''}`} />
          </button>
        ) : (
          <Link
            to={item.path}
            onClick={(e) => { e.preventDefault(); handleNavClick(item.path); }}
            className={`group relative flex items-center gap-1 xl:gap-2 px-2.5 xl:px-4 py-2 text-xs xl:text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap shrink-0 overflow-hidden
              ${isActive
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <div className="absolute inset-0 bg-primary-100/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            <item.icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 transition-transform relative ${isActive ? 'scale-110' : ''}`} />
            <span className="relative"><TranslatedText text={item.label} /></span>
          </Link>
        )}

        {/* Desktop dropdown panel */}
        {hasSubItems && openDropdown === item.label && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-none border border-slate-100 dark:border-slate-800 z-[120] overflow-hidden py-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-800 mb-1">
              <div className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                <TranslatedText text="Quick Actions" />
              </div>
            </div>
            <div className="py-2 px-1">
              {item.subItems?.map((subItem) => (
                <Link
                  key={subItem.path}
                  to={subItem.path}
                  onClick={(e) => { e.preventDefault(); handleNavClick(subItem.path); }}
                  className={`w-full text-left px-4 py-2 md:py-3 text-[11px] xl:text-xs transition-all flex items-center gap-3 group/sub rounded-xl ${
                    location.pathname === subItem.path
                      ? 'bg-primary-50/50 dark:bg-primary-900/20 text-primary-500 dark:text-primary-400 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-500 dark:hover:text-primary-400'
                  }`}
                >
                  {subItem.icon && (
                    <div className={`p-1 rounded-lg transition-colors ${
                      location.pathname === subItem.path
                        ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover/sub:bg-primary-50 dark:group-hover/sub:bg-primary-900/30 group-hover/sub:text-primary-500'
                    }`}>
                      <subItem.icon size={14} />
                    </div>
                  )}
                  <span className="tracking-wide uppercase font-black opacity-80 group-hover/sub:opacity-100 transition-opacity">
                    <TranslatedText text={subItem.label} />
                  </span>
                  {location.pathname === subItem.path && (
                    <div className="ml-auto w-1 h-3 bg-primary-500 rounded-full" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      data-header="operational-admin-header"
      className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-gray-50 dark:border-slate-800 text-gray-900 px-3 py-1.5 sm:px-6 sm:py-3 lg:py-4 sticky top-0 z-[100] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-1 sm:px-3 md:px-4 lg:px-6 xl:px-8 relative z-50">
        <div className="flex justify-between items-center relative z-10 gap-1.5 sm:gap-3 md:gap-4">

          {/* Left: hamburger + logo + desktop nav */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="xl:hidden p-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation min-w-[38px] min-h-[38px] flex items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700"
            >
              {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <div
              className="flex items-center flex-shrink-0 cursor-pointer px-1"
              onClick={() => navigate('/admin-operational')}
            >
              <img
                src={logoUrutiX}
                alt="UrutiX Logistics Logo"
                className="h-7 sm:h-8 md:h-10 lg:h-12 max-w-none w-auto object-contain transition-all"
              />
            </div>

            {/* Desktop nav — 1 direct + 2 dropdowns */}
            <div className="hidden xl:flex flex-1 items-center min-w-0 h-full">
              <div className="flex items-center gap-0.5 xl:gap-2 ml-1 xl:ml-4 text-gray-500 dark:text-slate-400 text-sm font-medium flex-nowrap">
                {navItems.map(renderNavItem)}
              </div>
            </div>
          </div>

          {/* Right: lang, theme, notifications, help, user */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 ml-auto">
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
              <LanguageSwitcher />
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
            </div>
            <CargoOwnerNotificationDropdown />
            <div className="hidden sm:flex items-center">
              <ContextualHelp context={location.pathname} />
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-10 w-10 rounded-full bg-[#0f172a] dark:bg-slate-800 text-white flex items-center justify-center hover:bg-slate-900 dark:hover:bg-slate-700 transition-all shadow-lg shadow-slate-200/50 dark:shadow-none relative overflow-hidden group border-2 border-white dark:border-slate-700"
              >
                <User size={20} className="transition-transform group-hover:scale-110" />
              </button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-200 dark:border-slate-800 z-[100] p-2">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800 mb-2">
                    <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                      {user?.firstName || user?.email || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email}</p>
                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-0.5">Admin</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/admin-operational/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors rounded-lg"
                    >
                      <User size={14} className="text-slate-400 dark:text-slate-500" />
                      <TranslatedText text="Profile Settings" />
                    </Link>
                    <Link
                      to="/admin-operational/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors rounded-lg"
                    >
                      <Settings size={14} className="text-slate-400 dark:text-slate-500" />
                      <TranslatedText text="Settings" />
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1 pb-1">
                    <div className="px-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <TranslatedText text="Theme" />
                        </span>
                      </div>
                      <ThemeToggle />
                    </div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors flex items-center gap-3"
                    >
                      <LogOut size={14} /> <TranslatedText text="Sign Out" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {createPortal(
        <AnimatePresence>
          {showMobileMenu && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                onClick={() => setShowMobileMenu(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm xl:hidden z-[999998]"
              />
              <motion.div
                key="drawer"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%', transition: { duration: 0.2 } }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-[85vw] max-w-[320px] bg-white dark:bg-slate-900 shadow-2xl xl:hidden z-[999999] flex flex-col border-r border-slate-200 dark:border-slate-800"
              >
                {/* Drawer header */}
                <div className="flex-shrink-0 p-5 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                      <Activity size={16} />
                    </div>
                    <img src={logoUrutiX} alt="UrutiX" className="h-6 w-auto" />
                  </div>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Profile card */}
                <div className="p-4">
                  <div className="relative overflow-hidden rounded-2xl p-4 bg-[#345E85] text-white shadow-xl">
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-bold text-lg">
                        {user?.firstName?.[0] || 'A'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black uppercase tracking-tight truncate leading-none mb-1">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-[10px] text-blue-100 font-medium truncate opacity-80">{user?.email}</p>
                        <p className="text-[9px] text-blue-200 font-black uppercase tracking-widest mt-0.5">Admin</p>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-16 h-16 bg-blue-400/20 rounded-full blur-xl" />
                  </div>
                </div>

                {/* Nav items — mirrors desktop: direct + two expandable groups */}
                <div className="flex-1 overflow-y-auto px-3 space-y-1 py-2">
                  {navItems.map((item, idx) => {
                    const hasSubItems = !!item.subItems?.length;
                    const isDropdownOpen = openDropdown === item.label;
                    const isActive = activeNavItem === item.label;

                    return (
                      <motion.div
                        key={item.label}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                      >
                        {hasSubItems ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(isDropdownOpen ? null : item.label);
                            }}
                            className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all active:scale-[0.98] ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-[#345E85] dark:text-blue-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon size={18} className={isActive ? 'text-[#345E85] dark:text-blue-400' : 'text-slate-400'} />
                              <span className="text-[11px] font-black uppercase tracking-widest">
                                <TranslatedText text={item.label} />
                              </span>
                            </div>
                            <ChevronDown
                              size={14}
                              className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                            />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleNavClick(item.path)}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all active:scale-[0.98] ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-[#345E85] dark:text-blue-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <item.icon size={18} className={isActive ? 'text-[#345E85] dark:text-blue-400' : 'text-slate-400'} />
                            <span className="text-[11px] font-black uppercase tracking-widest">
                              <TranslatedText text={item.label} />
                            </span>
                          </button>
                        )}

                        <AnimatePresence>
                          {hasSubItems && isDropdownOpen && (
                            <motion.div
                              key={item.label + '-sub'}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden bg-slate-50/50 dark:bg-slate-800/30 rounded-xl mx-2 my-1 border-l-2 border-slate-200 dark:border-slate-700"
                            >
                              <div className="py-2 px-1 space-y-1">
                                {item.subItems?.map((sub) => (
                                  <button
                                    key={sub.path}
                                    onClick={() => handleNavClick(sub.path)}
                                    className={`w-full group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                                      location.pathname === sub.path
                                        ? 'bg-white dark:bg-slate-800 shadow-sm text-[#345E85] dark:text-blue-400'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'
                                    }`}
                                  >
                                    {sub.icon && (
                                      <div className={`p-1.5 rounded-lg transition-colors ${
                                        location.pathname === sub.path
                                          ? 'bg-blue-50 dark:bg-blue-900/30 text-[#345E85] dark:text-blue-400'
                                          : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600'
                                      }`}>
                                        <sub.icon size={14} />
                                      </div>
                                    )}
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                      location.pathname === sub.path ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                                    }`}>
                                      <TranslatedText text={sub.label} />
                                    </span>
                                    {location.pathname === sub.path && (
                                      <div className="ml-auto w-1 h-3 bg-[#345E85] rounded-full" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 p-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/30">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-2 shadow-sm mb-3">
                    <div className="grid grid-cols-2 gap-1">
                      <div className="flex items-center gap-2 p-1.5">
                        <ThemeToggle />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Mode</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 justify-end">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Lang</span>
                        <LanguageSwitcher />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all"
                  >
                    <LogOut size={16} />
                    <TranslatedText text="Sign Out" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default OperationalAdminHeader;
