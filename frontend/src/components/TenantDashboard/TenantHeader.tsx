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
  Users
} from 'lucide-react';
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
  selectedView: 'overview' | 'fleet' | 'cargo' | 'financial' | 'operations' | 'users' | 'truck-owners' | 'trips' | 'settings' | 'bidding';
  setSelectedView: (view: 'overview' | 'fleet' | 'cargo' | 'financial' | 'operations' | 'users' | 'truck-owners' | 'trips' | 'settings' | 'bidding') => void;
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'trips', label: 'Trips', icon: Navigation },
    { id: 'bidding', label: 'Bidding', icon: DollarSign },
    { id: 'fleet', label: 'Fleet', icon: Truck },
    { id: 'truck-owners', label: 'Truck Owners', icon: Users },
    { id: 'cargo', label: 'Cargo', icon: Box },
    { id: 'users', label: 'Partners', icon: Users },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'operations', label: 'Operations', icon: Route },
  ];

  const { data: notifications = [] } = useQuery({
    queryKey: ['tenant-notifications', tenant?.id],
    queryFn: () => tenantApi.getRecentActivity(tenant?.id, 5),
    enabled: !!tenant?.id,
    staleTime: 30000, // 30 seconds
  });

  const { data: balanceData } = useQuery({
    queryKey: ['tenant-credit-balance', tenant?.id],
    queryFn: () => tenantApi.getCreditBalance(),
    staleTime: 60000, // 1 minute
  });

  const currentBalance = balanceData?.currentBalance || 0;
  const unreadCount = notifications.filter(n => n.status === 'warning' || n.status === 'error').length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
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
    <div className="bg-white border-b border-gray-100 pt-6 pb-3 sm:pt-8 sm:pb-4 px-4 md:px-8 lg:px-12 xl:px-20 z-50 sticky top-0">
      <div className="max-w-[1920px] mx-auto flex items-center justify-between">
        {/* Left side - Logo and Navigation */}
        <div className="flex items-center gap-10">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => setSelectedView('overview')}>
            <img
              src={logoUrutiX}
              alt="urutiX Logistics Logo"
              className="h-10 sm:h-14 md:h-18 lg:h-20 w-auto object-contain"
            />
          </div>


          <nav className="hidden lg:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedView === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedView(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 ${isActive
                    ? 'bg-[#f0f7ff] text-[#1e40af]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1e40af]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {/* Sync Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`p-2.5 rounded-full border border-gray-100 transition-all ${isRefreshing ? 'text-blue-500 bg-blue-50' : 'text-slate-400 hover:bg-gray-50 hover:text-slate-600'
                }`}
            >
              <FaSync className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 rounded-full border border-gray-100 hover:bg-gray-50 transition-all relative ${showNotifications ? 'bg-gray-50' : ''}`}
              >
                <FaBell className="w-5 h-5 text-slate-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 origin-top-right overflow-hidden text-slate-900"
                  >
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider text-left">Notifications</h3>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{notifications.length} New</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification: any) => (
                        <div key={notification.id} className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group text-left">
                          <div className="flex items-start space-x-3">
                            <div className={`p-1.5 rounded-full mt-0.5 shrink-0 ${notification.status === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                              <FaClock className="w-3 h-3" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{notification.action}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 font-medium">{notification.description}</p>
                              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1.5">{notification.timestamp}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* HELP Button */}
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all font-bold text-slate-600 text-[11px] tracking-wider uppercase">
              <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </div>
              HELP
            </button>

            {/* Credit Balance Badge */}
            <div
              onClick={() => setSelectedView('financial')}
              className="hidden xl:flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-all group"
            >
              <div className="p-1 bgColor-white rounded-lg shadow-sm">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-0.5">Available Credits</span>
                <span className="text-sm font-black text-indigo-900 leading-none tabular-nums">
                  {currentBalance.toLocaleString()}
                  <span className="text-[10px] ml-1 text-indigo-400">TRX</span>
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
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden text-slate-900">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-gray-50 text-left">
                      <p className="text-sm font-bold text-slate-800 truncate">{user?.firstName || user?.email || 'Administrator'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">Tenant Admin</p>
                    </div>
                    <button
                      onClick={() => { setShowUserMenu(false); setSelectedView('settings'); }}
                      className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 mt-1"
                    >
                      <FaCog size={14} className="text-slate-400" /> Settings
                    </button>
                    <div className="border-t border-gray-50 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2.5 text-xs font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantHeader;

