import { createPortal } from 'react-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
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

  const [showUserMenu, setShowUserMenu]     = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  // Separate desktop and mobile dropdown state to avoid interference
  const [desktopDropdown, setDesktopDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded]   = useState<string | null>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const desktopDropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // ── Active detection ────────────────────────────────────────────
  const getActiveNavLabel = useCallback(() => {
    const path = location.pathname;
    const item = navItems.find(
      n =>
        path === n.path ||
        path.startsWith(n.path + '/') ||
        n.subItems?.some(s => path === s.path || path.startsWith(s.path + '/'))
    );
    return item?.label || null;
  }, [location.pathname]);

  const activeNavLabel = getActiveNavLabel();

  // ── Navigation helpers ──────────────────────────────────────────
  // Navigate first, then close menus — avoids state-batching race on mobile
  const goTo = useCallback((path: string) => {
    navigate(path);
    // Close everything after navigation is triggered
    setTimeout(() => {
      setShowMobileMenu(false);
      setDesktopDropdown(null);
      setShowUserMenu(false);
    }, 10);
  }, [navigate]);

  const handleLogout = () => {
    setShowUserMenu(false);
    setShowMobileMenu(false);
    logout?.();
    navigate('/auth');
  };

  // ── Close on route change ───────────────────────────────────────
  useEffect(() => {
    setDesktopDropdown(null);
    setShowMobileMenu(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  // ── Scroll lock when mobile menu open ──────────────────────────
  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMobileMenu]);

  // ── Click-outside for desktop dropdowns + user menu ────────────
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      const clickedInsideAnyDropdown = Object.values(desktopDropdownRefs.current)
        .some(ref => ref && ref.contains(e.target as Node));
      if (!clickedInsideAnyDropdown) {
        setDesktopDropdown(null);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // ── Desktop nav item ────────────────────────────────────────────
  const renderDesktopNavItem = (item: NavItem) => {
    const hasSubItems = !!item.subItems?.length;
    const isActive    = activeNavLabel === item.label;
    const isOpen      = desktopDropdown === item.label;

    const baseClass = `group relative flex items-center gap-1 xl:gap-2 px-2.5 xl:px-4 py-2 text-xs xl:text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap shrink-0 overflow-hidden ${
      isActive
        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400'
        : 'text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800'
    }`;

    return (
      <div
        key={item.label}
        className="relative z-[100]"
        ref={el => (desktopDropdownRefs.current[item.label] = el)}
      >
        {hasSubItems ? (
          <button
            onClick={e => {
              e.stopPropagation();
              setDesktopDropdown(isOpen ? null : item.label);
            }}
            className={baseClass}
          >
            <div className="absolute inset-0 bg-primary-100/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            <item.icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 transition-transform relative ${isActive ? 'scale-110' : ''}`} />
            <span className="relative"><TranslatedText text={item.label} /></span>
            <ChevronDown className={`w-3 h-3 transition-transform relative ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        ) : (
          <button onClick={() => goTo(item.path)} className={baseClass}>
            <div className="absolute inset-0 bg-primary-100/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            <item.icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 transition-transform relative ${isActive ? 'scale-110' : ''}`} />
            <span className="relative"><TranslatedText text={item.label} /></span>
          </button>
        )}

        {/* Desktop dropdown panel */}
        {hasSubItems && isOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-none border border-slate-100 dark:border-slate-800 z-[120] overflow-hidden py-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-800 mb-1">
              <p className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                <TranslatedText text="Quick Actions" />
              </p>
            </div>
            <div className="py-2 px-1">
              {item.subItems?.map(sub => {
                const isSubActive = location.pathname === sub.path;
                return (
                  <button
                    key={sub.path}
                    onClick={() => goTo(sub.path)}
                    className={`w-full text-left px-4 py-2 md:py-3 text-[11px] xl:text-xs transition-all flex items-center gap-3 group/sub rounded-xl ${
                      isSubActive
                        ? 'bg-primary-50/50 dark:bg-primary-900/20 text-primary-500 dark:text-primary-400 font-bold shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-500 dark:hover:text-primary-400'
                    }`}
                  >
                    {sub.icon && (
                      <div className={`p-1 rounded-lg transition-colors ${
                        isSubActive
                          ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover/sub:bg-primary-50 dark:group-hover/sub:bg-primary-900/30 group-hover/sub:text-primary-500'
                      }`}>
                        <sub.icon size={14} />
                      </div>
                    )}
                    <span className="tracking-wide uppercase font-black opacity-80 group-hover/sub:opacity-100 transition-opacity">
                      <TranslatedText text={sub.label} />
                    </span>
                    {isSubActive && <div className="ml-auto w-1 h-3 bg-primary-500 rounded-full" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      data-header="operational-admin-header"
      className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-gray-50 dark:border-slate-800 text-gray-900 px-3 py-1.5 sm:px-6 sm:py-3 lg:py-4 sticky top-0 z-[300] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-1 sm:px-3 md:px-4 lg:px-6 xl:px-8 relative z-50">
        <div className="flex justify-between items-center relative z-10 gap-1.5 sm:gap-3 md:gap-4">

          {/* Left: hamburger + logo + desktop nav */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
            <button
              onClick={() => setShowMobileMenu(v => !v)}
              className="xl:hidden p-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation min-w-[38px] min-h-[38px] flex items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <button
              className="flex items-center flex-shrink-0 cursor-pointer px-1"
              onClick={() => goTo('/admin-operational')}
            >
              <img src={logoUrutiX} alt="UrutiX" className="h-7 sm:h-8 md:h-10 lg:h-12 max-w-none w-auto object-contain" />
            </button>

            {/* Desktop nav */}
            <div className="hidden xl:flex flex-1 items-center min-w-0 h-full">
              <div className="flex items-center gap-0.5 xl:gap-2 ml-1 xl:ml-4 flex-nowrap">
                {navItems.map(renderDesktopNavItem)}
              </div>
            </div>
          </div>

          {/* Right: utilities + user */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 ml-auto">
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
              <LanguageSwitcher />
              <div className="hidden sm:block"><ThemeToggle /></div>
            </div>
            <CargoOwnerNotificationDropdown />
            <div className="hidden sm:flex items-center">
              <ContextualHelp context={location.pathname} />
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                className="h-10 w-10 rounded-full bg-[#0f172a] dark:bg-slate-800 text-white flex items-center justify-center hover:bg-slate-900 dark:hover:bg-slate-700 transition-all shadow-lg shadow-slate-200/50 dark:shadow-none relative overflow-hidden group border-2 border-white dark:border-slate-700"
                aria-label="User menu"
              >
                <User size={20} className="transition-transform group-hover:scale-110" />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 z-[200] overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-0.5">{user?.email}</p>
                      <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">Admin</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => { setShowUserMenu(false); goTo('/admin-operational/profile'); }}
                        className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors rounded-xl"
                      >
                        <User size={14} className="text-slate-400 flex-shrink-0" />
                        <TranslatedText text="Profile Settings" />
                      </button>
                      <button
                        onClick={() => { setShowUserMenu(false); goTo('/admin-operational/settings'); }}
                        className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors rounded-xl"
                      >
                        <Settings size={14} className="text-slate-400 flex-shrink-0" />
                        <TranslatedText text="Settings" />
                      </button>
                    </div>
                    <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Theme</p>
                      <ThemeToggle />
                    </div>
                    <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors flex items-center gap-3"
                      >
                        <LogOut size={14} />
                        <TranslatedText text="Sign Out" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {createPortal(
        <AnimatePresence>
          {showMobileMenu && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                onClick={() => setShowMobileMenu(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm xl:hidden z-[999998]"
              />

              {/* Drawer */}
              <motion.div
                key="drawer"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%', transition: { duration: 0.2 } }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-[85vw] max-w-[320px] bg-white dark:bg-slate-900 shadow-2xl xl:hidden z-[999999] flex flex-col border-r border-slate-200 dark:border-slate-800"
              >
                {/* Drawer header */}
                <div className="flex-shrink-0 p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                      <Activity size={16} />
                    </div>
                    <img src={logoUrutiX} alt="UrutiX" className="h-6 w-auto" />
                  </div>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500"
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* User profile card */}
                <div className="p-4 flex-shrink-0">
                  <button
                    onClick={() => goTo('/admin-operational/profile')}
                    className="w-full relative overflow-hidden rounded-2xl p-4 bg-[#2c5173] text-white shadow-xl hover:bg-[#345E85] transition-colors text-left"
                  >
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {user?.firstName?.[0] || 'A'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black tracking-tight truncate leading-none mb-1">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-[10px] text-blue-100 truncate opacity-80">{user?.email}</p>
                        <p className="text-[9px] text-blue-200 font-black uppercase tracking-widest mt-0.5">Admin · Tap to view profile</p>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                  </button>
                </div>

                {/* ── Navigation ── */}
                <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">

                  {navItems.map((item, idx) => {
                    const hasSubItems  = !!item.subItems?.length;
                    const isExpanded   = mobileExpanded === item.label;
                    const isActive     = activeNavLabel === item.label;

                    return (
                      <motion.div
                        key={item.label}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.05 + idx * 0.04 }}
                      >
                        {hasSubItems ? (
                          /* Expandable group */
                          <div className={`rounded-xl mb-0.5 ${isActive ? 'ring-1 ring-primary-200 dark:ring-primary-800/50' : ''}`}>
                            <div className={`flex items-center rounded-xl transition-all ${
                              isActive
                                ? 'bg-primary-50 dark:bg-primary-900/20'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}>
                              {/* Navigate to group root */}
                              <button
                                onClick={() => goTo(item.path)}
                                className={`flex-1 flex items-center gap-3 p-3.5 text-left transition-colors ${
                                  isActive ? 'text-[#2c5173] dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                <item.icon size={18} className={isActive ? 'text-[#2c5173] dark:text-primary-400' : 'text-slate-400'} />
                                <span className="text-[11px] font-black uppercase tracking-widest">
                                  <TranslatedText text={item.label} />
                                </span>
                              </button>
                              {/* Chevron — expand/collapse only */}
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setMobileExpanded(isExpanded ? null : item.label);
                                }}
                                className="p-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                <ChevronDown
                                  size={14}
                                  className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                />
                              </button>
                            </div>

                            {/* Sub-items — no overflow-hidden on parent so animation isn't clipped */}
                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  key={`${item.label}-sub`}
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                                  style={{ overflow: 'hidden' }}
                                >
                                  <div className="ml-3 mr-1 mb-2 mt-0.5 border-l-2 border-slate-200 dark:border-slate-700 pl-3 space-y-0.5">
                                    {item.subItems?.map(sub => {
                                      const isSubActive = location.pathname === sub.path ||
                                        location.pathname.startsWith(sub.path + '/');
                                      return (
                                        <Link
                                          key={sub.path}
                                          to={sub.path}
                                          onClick={() => setTimeout(() => setShowMobileMenu(false), 80)}
                                          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 active:scale-[0.98] ${
                                            isSubActive
                                              ? 'bg-white dark:bg-slate-800 shadow-sm text-[#2c5173] dark:text-primary-400'
                                              : 'text-slate-500 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-800/70 hover:text-slate-800 dark:hover:text-slate-200'
                                          }`}
                                        >
                                          {sub.icon && (
                                            <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                                              isSubActive
                                                ? 'bg-primary-50 dark:bg-primary-900/30 text-[#2c5173] dark:text-primary-400'
                                                : 'bg-slate-100 dark:bg-slate-700/50 text-slate-400'
                                            }`}>
                                              <sub.icon size={13} />
                                            </div>
                                          )}
                                          <span className={`text-[10px] font-black uppercase tracking-widest flex-1 ${
                                            isSubActive ? 'opacity-100' : 'opacity-70'
                                          }`}>
                                            <TranslatedText text={sub.label} />
                                          </span>
                                          {isSubActive && (
                                            <div className="w-1 h-3 bg-[#2c5173] dark:bg-primary-400 rounded-full flex-shrink-0" />
                                          )}
                                        </Link>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          /* Direct nav item — use Link for reliable navigation */
                          <Link
                            to={item.path}
                            onClick={() => setTimeout(() => setShowMobileMenu(false), 80)}
                            className={`flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                              isActive
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-[#2c5173] dark:text-primary-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            <item.icon
                              size={18}
                              className={isActive ? 'text-[#2c5173] dark:text-primary-400' : 'text-slate-400'}
                            />
                            <span className="text-[11px] font-black uppercase tracking-widest">
                              <TranslatedText text={item.label} />
                            </span>
                          </Link>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* Divider + utility pages */}
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
                    <p className="px-3 pb-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Account</p>
                    {[
                      { label: 'Profile',  path: '/admin-operational/profile',  icon: User },
                      { label: 'Settings', path: '/admin-operational/settings', icon: Settings },
                    ].map(item => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setTimeout(() => setShowMobileMenu(false), 80)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                            isActive
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-[#2c5173] dark:text-primary-400'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <item.icon size={18} className={isActive ? 'text-[#2c5173]' : 'text-slate-400'} />
                          <span className="text-[11px] font-black uppercase tracking-widest">
                            <TranslatedText text={item.label} />
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </nav>

                {/* Footer */}
                <div className="flex-shrink-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-3 shadow-sm mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Mode</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Lang</span>
                      <LanguageSwitcher />
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
