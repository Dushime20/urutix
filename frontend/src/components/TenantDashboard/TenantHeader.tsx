import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LogOut,
  LayoutDashboard,
  Truck,
  DollarSign,
  Settings as FaCog,
  User as FaUser,
  Navigation,
  Users,
  ChevronDown,
  ArrowRight,
  Mail,
  FileCheck,
  Menu,
  X,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import LanguageSwitcher from '../LanguageSwitcher';
import CargoOwnerNotificationDropdown from '../notifications/CargoOwnerNotificationDropdown';
import ThemeToggle from '../Theme/ThemeToggle';
import logoUrutiX from '../../assets/urutiX Logistics Logo (1).svg';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '../../services/tenantApi';

interface Tenant {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  type: string;
}

interface TenantHeaderProps {
  tenant: Tenant;
  onRefresh: () => void;
  isRefreshing?: boolean;
  selectedView: 'overview' | 'fleet' | 'cargo' | 'drivers' | 'financial' | 'operations' | 'users' | 'truck-owners' | 'trips' | 'settings' | 'bidding' | 'purchase-credits' | 'billing' | 'subscription-plans' | 'communicate' | 'profile' | 'lenders' | 'kyc' | 'reports';
  setSelectedView: (view: 'overview' | 'fleet' | 'cargo' | 'drivers' | 'financial' | 'operations' | 'users' | 'truck-owners' | 'trips' | 'settings' | 'bidding' | 'purchase-credits' | 'billing' | 'subscription-plans' | 'communicate' | 'profile' | 'lenders' | 'kyc' | 'reports') => void;
}

const routeMap: Record<string, string> = {
  overview: '/tenant-admin',
  financial: '/tenant-admin/financial',
  'purchase-credits': '/tenant-admin/subscription-plans',
  'subscription-plans': '/tenant-admin/subscription-plans',
  billing: '/tenant-admin/billing',
  communicate: '/tenant-admin/communication',
  fleet: '/tenant-admin/fleet',
  cargo: '/tenant-admin/cargo',
  drivers: '/tenant-admin/drivers',
  trips: '/tenant-admin/trips',
  users: '/tenant-admin/users',
  'truck-owners': '/tenant-admin/truck-owners',
  lenders: '/tenant-admin/lenders',
  settings: '/tenant-admin/settings',
  profile: '/tenant-admin/profile',
  reports: '/tenant-admin/reports',
};

const groupedTabs = [
  {
    id: 'logistics',
    label: 'Asset Hub',
    icon: Truck,
    items: [
      { id: 'trips', label: 'Monitor Trips', icon: Navigation, description: 'Real-time shipment tracking' },
      { id: 'fleet', label: 'Fleet Systems', icon: Truck, description: 'Internal asset management' },
      { id: 'reports', label: 'Reports & Disputes', icon: AlertTriangle, description: 'Issues & disputes raised by users' },
      { id: 'users', label: 'Internal Staff', icon: Users, description: 'Access control & permissions' },
      { id: 'communicate', label: 'Partner Comms', icon: Mail, description: 'Send bulk emails to partners' },
    ],
  },
  {
    id: 'financial',
    label: 'Financials',
    icon: DollarSign,
    items: [
      { id: 'purchase-credits', label: 'Subscription Plans', icon: DollarSign, description: 'Plans, marketplace & credit history' },
    ],
  },
];

const TenantHeader: React.FC<TenantHeaderProps> = ({
  tenant,
  selectedView,
  setSelectedView,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { tSync } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const { data: balanceData } = useQuery({
    queryKey: ['tenant-credit-balance', tenant?.id],
    queryFn: () => tenantApi.getCreditBalance(),
    staleTime: 60000,
  });

  const currentBalance = balanceData?.currentBalance || 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveGroup(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout?.();
    navigate('/auth');
  };

  const navigateToTab = (tabId: string) => {
    const targetRoute = routeMap[tabId];
    if (targetRoute) navigate(targetRoute);
    else setSelectedView(tabId as TenantHeaderProps['selectedView']);
    setActiveGroup(null);
    setShowMobileMenu(false);
  };

  const tenantName =
    user?.tenantName && user.tenantName !== user?.tenantId ? user.tenantName : 'Default Tenant';

  return (
    <>
      <header className="sticky top-0 z-[290] shrink-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center">
        <div className="max-w-[1536px] mx-auto w-full flex items-center justify-between gap-3 min-w-0">
          {/* Left: brand + nav */}
          <div className="flex items-center gap-3 lg:gap-6 min-w-0 flex-1">
            <button
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigateToTab('overview')}
              className="flex items-center gap-2.5 shrink-0"
            >
              <img src={logoUrutiX} alt="UrutiX" className="h-7 w-auto object-contain" />
              <div className="hidden sm:block text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  Tenant Admin
                </p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px] lg:max-w-[160px] leading-tight mt-0.5">
                  {tenantName}
                </p>
              </div>
            </button>

            <nav className="hidden lg:flex items-center gap-1 ml-2" ref={navRef}>
              <button
                onClick={() => navigateToTab('overview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedView === 'overview'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <TranslatedText text="Dashboard" />
              </button>

              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

              {groupedTabs.map((group) => {
                const isGroupActive = group.items.some((item) => item.id === selectedView);
                const isOpen = activeGroup === group.id;

                return (
                  <div key={group.id} className="relative">
                    <button
                      onClick={() => setActiveGroup(isOpen ? null : group.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isGroupActive
                          ? 'bg-slate-800 dark:bg-slate-700 text-white'
                          : isOpen
                            ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <group.icon className="w-3.5 h-3.5" />
                      <TranslatedText text={group.label} />
                      <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.98 }}
                          className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 p-2 z-[100]"
                        >
                          <p className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            <TranslatedText text={group.label} />
                          </p>
                          <div className="space-y-0.5">
                            {group.items.map((tab) => {
                              const TabIcon = tab.icon;
                              const isTabActive = selectedView === tab.id;

                              return (
                                <button
                                  key={tab.id}
                                  onClick={() => navigateToTab(tab.id)}
                                  className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center gap-2.5 group/item ${
                                    isTabActive
                                      ? 'bg-primary-50 dark:bg-primary-950/40'
                                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <div
                                    className={`p-1.5 rounded-md shrink-0 ${
                                      isTabActive
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover/item:bg-primary-600 group-hover/item:text-white'
                                    }`}
                                  >
                                    <TabIcon className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-xs font-semibold truncate ${
                                        isTabActive ? 'text-primary-600' : 'text-slate-700 dark:text-slate-200'
                                      }`}
                                    >
                                      <TranslatedText text={tab.label} />
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                      <TranslatedText text={tab.description} />
                                    </p>
                                  </div>
                                  <ArrowRight
                                    className={`w-3 h-3 shrink-0 ${
                                      isTabActive ? 'text-primary-400' : 'text-slate-300 opacity-0 group-hover/item:opacity-100'
                                    }`}
                                  />
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

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/40">
              <Building2 className="w-3 h-3 text-primary-600 dark:text-primary-400" />
              <span className="text-[10px] font-medium text-primary-700 dark:text-primary-300 max-w-[100px] truncate">
                {tenantName}
              </span>
            </div>

            <LanguageSwitcher />

            <div className="hidden lg:block">
              <CargoOwnerNotificationDropdown />
            </div>

            <button
              onClick={() => navigateToTab('subscription-plans')}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/40 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              <span className="text-xs font-bold text-primary-700 dark:text-primary-300 tabular-nums">
                {currentBalance.toLocaleString()}
              </span>
              <span className="text-[9px] text-primary-400 font-medium">TRX</span>
            </button>

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center size-8 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                aria-label="User menu"
              >
                <FaUser size={14} />
              </button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-1.5 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 z-[9999] overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-slate-50 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {user?.firstName || user?.email || tSync('Administrator')}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                      <TranslatedText text="Tenant Admin" />
                    </p>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => { setShowUserMenu(false); navigateToTab('profile'); }}
                      className="w-full text-left px-2.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <FaUser size={13} className="text-slate-400" />
                      <TranslatedText text="My Profile" />
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); setSelectedView('kyc'); }}
                      className="w-full text-left px-2.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <FileCheck size={13} className="text-slate-400" />
                      <TranslatedText text="KYC Center" />
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); navigateToTab('settings'); }}
                      className="w-full text-left px-2.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <FaCog size={13} className="text-slate-400" />
                      <TranslatedText text="Settings" />
                    </button>
                    <div className="border-t border-slate-50 dark:border-slate-800 my-1 px-2.5 py-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          <TranslatedText text="Theme" />
                        </span>
                      </div>
                      <ThemeToggle />
                    </div>
                    <div className="border-t border-slate-50 dark:border-slate-800 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-2.5 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg flex items-center gap-2"
                    >
                      <LogOut size={13} />
                      <TranslatedText text="Logout" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 w-[260px] bg-white dark:bg-slate-900 z-[101] lg:hidden overflow-y-auto shadow-xl border-r border-slate-100 dark:border-slate-800"
            >
              <div className="p-4 space-y-5">
                <div className="flex items-center justify-between">
                  <img src={logoUrutiX} alt="Logo" className="h-7 w-auto" />
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => navigateToTab('overview')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                    selectedView === 'overview'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <TranslatedText text="Dashboard" />
                </button>

                {groupedTabs.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <p className="px-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      <TranslatedText text={group.label} />
                    </p>
                    <div className="space-y-1">
                      {group.items.map((tab) => {
                        const Icon = tab.icon;
                        const active = selectedView === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => navigateToTab(tab.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                              active
                                ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600'
                                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div
                              className={`p-1.5 rounded-md ${
                                active ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <TranslatedText text={tab.label} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-950/30">
                    <DollarSign className="w-4 h-4 text-primary-600" />
                    <div>
                      <p className="text-[10px] text-primary-400 font-medium">Credits</p>
                      <p className="text-sm font-bold text-primary-700 dark:text-primary-300 tabular-nums">
                        {currentBalance.toLocaleString()} TRX
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default TenantHeader;
