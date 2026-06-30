import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LogOut,
  LayoutDashboard,
  Truck,
  DollarSign,
  Route,
  HelpCircle,
  Settings as FaCog,
  User as FaUser,
  RefreshCw as FaSync,
  Clock as FaClock,
  Bell as FaBell,
  Navigation,
  Box,
  Users,
  ChevronDown,
  ArrowRight,
  Mail,
  FileCheck,
  Menu,
  X,
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
  selectedView: 'overview' | 'fleet' | 'cargo' | 'drivers' | 'financial' | 'operations' | 'users' | 'truck-owners' | 'trips' | 'settings' | 'bidding' | 'purchase-credits' | 'billing' | 'subscription-plans' | 'communicate' | 'profile' | 'lenders' | 'kyc';
  setSelectedView: (view: 'overview' | 'fleet' | 'cargo' | 'drivers' | 'financial' | 'operations' | 'users' | 'truck-owners' | 'trips' | 'settings' | 'bidding' | 'purchase-credits' | 'billing' | 'subscription-plans' | 'communicate' | 'profile' | 'lenders' | 'kyc') => void;
}

const TenantHeader: React.FC<TenantHeaderProps> = ({
  tenant,
  onRefresh,
  isRefreshing,
  selectedView,
  setSelectedView
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { tSync } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const groupedTabs = [
    {
      id: 'logistics',
      label: 'Asset Hub',
      icon: Truck,
      items: [
        { id: 'trips', label: 'Monitor Trips', icon: Navigation, description: 'Real-time shipment tracking' },
        { id: 'bidding', label: 'Negotiations', icon: DollarSign, description: 'Active bidding & load acquisition' },
        { id: 'fleet', label: 'Fleet Systems', icon: Truck, description: 'Internal asset management' },
        { id: 'cargo', label: 'Inventory Control', icon: Box, description: 'Cargo & specialized storage' },
      ]
    },
    {
      id: 'network',
      label: 'Partner Network',
      icon: Users,
      items: [
        { id: 'truck-owners', label: 'Truck Owners', icon: Users, description: 'External partner management' },
        { id: 'lenders', label: 'Lender Nodes', icon: Users, description: 'Manage asset financing partners' },
        { id: 'users', label: 'Internal Staff', icon: Users, description: 'Access control & permissions' },
        { id: 'communicate', label: 'Partner Comms', icon: Mail, description: 'Send bulk emails to partners' },
      ]
    },
    {
      id: 'financial',
      label: 'Financials',
      icon: DollarSign,
      items: [
        { id: 'financial', label: 'Escrow Account', icon: DollarSign, description: 'Revenue & credit intelligence' },
        { id: 'purchase-credits', label: 'Purchase Credits', icon: DollarSign, description: 'Top up your account balance' },
        { id: 'billing', label: 'Billing Dashboard', icon: DollarSign, description: 'Manage plans and invoices' },
      ]
    }
  ];

  const { data: balanceData } = useQuery({
    queryKey: ['tenant-credit-balance', tenant?.id],
    queryFn: () => tenantApi.getCreditBalance(),
    staleTime: 60000, // 1 minute
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    if (logout) {
      logout();
    }
    navigate('/auth');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 pt-6 pb-3 sm:pt-8 sm:pb-4 px-4 md:px-8 lg:px-12 xl:px-20 z-50 sticky top-0 overflow-x-hidden">
      <div className="max-w-[1920px] mx-auto flex items-center justify-between min-w-0">
        {/* Left side - Logo and Navigation */}
        <div className="flex items-center gap-4 lg:gap-10 min-w-0 flex-1">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMobileMenu(true)}
            className="lg:hidden p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => setSelectedView('overview')}>
            <img
              src={logoUrutiX}
              alt="urutiX Logistics Logo"
              className="h-10 sm:h-12 md:h-16 lg:h-20 w-auto object-contain max-w-none"
            />
          </div>


          <nav className="hidden lg:flex items-center gap-2" ref={navRef}>
            {/* Direct Link: Monitor */}
            <button
              onClick={() => { navigate('/tenant-admin'); setSelectedView('overview'); setActiveGroup(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black transition-all duration-300 ${selectedView === 'overview'
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-transparent'
                }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span><TranslatedText text="DASHBOARD" /></span>
            </button>

            <div className="w-[1px] h-6 bg-slate-100 dark:bg-slate-800 mx-2" />

            {/* Grouped Dropdowns */}
            {groupedTabs.map((group) => {
              const isGroupActive = group.items.some(item => item.id === selectedView);
              const isOpen = activeGroup === group.id;

              return (
                <div key={group.id} className="relative">
                  <button
                    onClick={() => setActiveGroup(isOpen ? null : group.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black tracking-wider transition-all duration-300 ${isGroupActive
                      ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-lg'
                      : isOpen ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    <group.icon className="w-4 h-4" />
                    <span><TranslatedText text={group.label} /></span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 mt-3 w-72 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-3 z-[100] origin-top-left"
                      >
                        <div className="mb-2 px-3 pt-2">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                            <TranslatedText text="System Category:" /> <TranslatedText text={group.label} />
                          </span>
                        </div>
                        <div className="grid gap-1">
                          {group.items.map((tab) => {
                            const TabIcon = tab.icon;
                            const isTabActive = selectedView === tab.id;

                            return (
                              <button
                                key={tab.id}
                                onClick={() => {
                                  // Map tab IDs to their respective routes
                                  const routeMap: Record<string, string> = {
                                    'overview': '/tenant-admin',
                                    'financial': '/tenant-admin/financial',
                                    'purchase-credits': '/tenant-admin/subscription-plans',
                                    'subscription-plans': '/tenant-admin/subscription-plans',
                                    'billing': '/tenant-admin/billing',
                                    'communicate': '/tenant-admin/communication',
                                    'fleet': '/tenant-admin/fleet',
                                    'cargo': '/tenant-admin/cargo',
                                    'drivers': '/tenant-admin/drivers',
                                    'trips': '/tenant-admin/trips',
                                    'users': '/tenant-admin/users',
                                    'truck-owners': '/tenant-admin/truck-owners',
                                    'lenders': '/tenant-admin/lenders',
                                    'settings': '/tenant-admin/settings',
                                    'profile': '/tenant-admin/profile'
                                  };

                                  const targetRoute = routeMap[tab.id];
                                  if (targetRoute) {
                                    navigate(targetRoute);
                                  } else {
                                    setSelectedView(tab.id as any);
                                  }
                                  setActiveGroup(null);
                                }}
                                className={`w-full text-left p-3 rounded-2xl transition-all duration-300 flex items-start gap-3 group/item ${isTabActive
                                  ? 'bg-primary-50/50 dark:bg-primary-900/20'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                  }`}
                              >
                                <div className={`p-2 rounded-xl shrink-0 transition-colors ${isTabActive ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover/item:bg-primary-600 group-hover/item:text-white'}`}>
                                  <TabIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className={`text-xs font-black ${isTabActive ? 'text-primary-600' : 'text-slate-800 dark:text-slate-100'}`}>
                                    <TranslatedText text={tab.label} />
                                  </p>
                                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                                    <TranslatedText text={tab.description} />
                                  </p>
                                </div>
                                <ArrowRight className={`ml-auto w-3.5 h-3.5 text-slate-300 group-hover/item:text-primary-600 transition-all ${isTabActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
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

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Sync Button */}
            <div className="hidden sm:block">
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className={`p-2.5 rounded-full border border-gray-100 dark:border-slate-800 transition-all ${isRefreshing ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-600'
                  }`}
              >
                <FaSync className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <LanguageSwitcher />

            {/* Notification Bell - Hidden on mobile as it's in the mobile bottom nav */}
            <div className="hidden lg:block">
              <CargoOwnerNotificationDropdown />
            </div>

            {/* HELP Button */}
            <button className="hidden sm:flex items-center lg:gap-2 px-3 lg:px-4 py-2 rounded-full border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all font-bold text-slate-600 dark:text-slate-400 text-[11px] tracking-wider uppercase">
              <div className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </div>
              <span className="hidden lg:inline"><TranslatedText text="HELP" /></span>
            </button>

            {/* Credit Balance Badge */}
            <div
              onClick={() => setSelectedView('financial')}
              className="hidden xl:flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all group"
            >
              <div className="p-1 bgColor-white dark:bg-slate-800 rounded-lg shadow-sm">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-0.5"><TranslatedText text="Available Credits" /></span>
                <span className="text-sm font-black text-indigo-900 dark:text-indigo-100 leading-none tabular-nums">
                  {currentBalance.toLocaleString()}
                  <span className="text-[10px] ml-1 text-indigo-400 lowercase italic">TRX</span>
                </span>
              </div>
            </div>

            {/* User Profile */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center size-9 rounded-full bg-[#1e293b] text-white hover:opacity-90 transition-opacity"
              >
                <FaUser size={18} />
              </button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 z-[9999] overflow-hidden text-slate-900 dark:text-white">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-gray-50 dark:border-slate-800 text-left">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user?.firstName || user?.email || tSync('Administrator')}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 truncate"><TranslatedText text="Tenant Admin" /></p>
                    </div>
                    <button
                      onClick={() => { setShowUserMenu(false); setSelectedView('profile'); }}
                      className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 mt-1"
                    >
                      <FaUser size={14} className="text-slate-400" /> <TranslatedText text="My Profile" />
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); setSelectedView('kyc'); }}
                      className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <FileCheck size={14} className="text-slate-400" /> <TranslatedText text="KYC Center" />
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); setSelectedView('settings'); }}
                      className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <FaCog size={14} className="text-slate-400" /> <TranslatedText text="Settings" />
                    </button>
                    <div className="border-t border-gray-50 dark:border-slate-800 my-1"></div>
                    <div className="px-3 py-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <TranslatedText text="Theme" />
                        </span>
                      </div>
                      <ThemeToggle />
                    </div>
                    <div className="border-t border-gray-50 dark:border-slate-800 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2.5 text-xs font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <LogOut size={14} /> <TranslatedText text="Logout" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 z-[101] lg:hidden overflow-y-auto shadow-2xl"
            >
              <div className="p-6 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={logoUrutiX} alt="Logo" className="h-8 w-auto" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Portal</span>
                  </div>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Direct Link: Dashboard */}
                  <button
                    onClick={() => { navigate('/tenant-admin'); setSelectedView('overview'); setShowMobileMenu(false); }}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${selectedView === 'overview'
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest"><TranslatedText text="DASHBOARD" /></span>
                  </button>

                  {/* Grouped Menus */}
                  {groupedTabs.map((group) => (
                    <div key={group.id} className="space-y-3">
                      <div className="px-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          <TranslatedText text={group.label} />
                        </span>
                      </div>
                      <div className="grid gap-2">
                        {group.items.map((tab) => {
                          const Icon = tab.icon;
                          const active = selectedView === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                // Map tab IDs to their respective routes
                                const routeMap: Record<string, string> = {
                                  'overview': '/tenant-admin',
                                  'financial': '/tenant-admin/financial',
                                  'purchase-credits': '/tenant-admin/subscription-plans',
                                  'subscription-plans': '/tenant-admin/subscription-plans',
                                  'billing': '/tenant-admin/billing',
                                  'communicate': '/tenant-admin/communication',
                                  'fleet': '/tenant-admin/fleet',
                                  'cargo': '/tenant-admin/cargo',
                                  'drivers': '/tenant-admin/drivers',
                                  'trips': '/tenant-admin/trips',
                                  'users': '/tenant-admin/users',
                                  'truck-owners': '/tenant-admin/truck-owners',
                                  'lenders': '/tenant-admin/lenders',
                                  'settings': '/tenant-admin/settings'
                                };
                                const targetRoute = routeMap[tab.id];
                                if (targetRoute) navigate(targetRoute);
                                else setSelectedView(tab.id as any);
                                setShowMobileMenu(false);
                              }}
                              className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all ${active
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
                                }`}
                            >
                              <div className={`p-2 rounded-xl ${active ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold uppercase tracking-wide"><TranslatedText text={tab.label} /></span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TenantHeader;

