import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  RefreshCw as FaSync,
  Settings as FaCog,
  Bell as FaBell,
  User as FaUser,
  CheckCircle as FaCheckCircle,
  AlertTriangle as FaExclamationTriangle,
  Clock as FaClock,
  LogOut
} from 'lucide-react';
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
  lastUpdated: Date;
  onSettingsClick?: () => void;
  isRefreshing?: boolean;
}

const TenantHeader: React.FC<TenantHeaderProps> = ({
  tenant,
  onRefresh,
  lastUpdated,
  onSettingsClick,
  isRefreshing
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ['tenant-notifications', tenant?.id],
    queryFn: () => tenantApi.getRecentActivity(tenant?.id, 5),
    enabled: !!tenant?.id,
    staleTime: 30000, // 30 seconds
  });

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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'inactive': return 'text-slate-500 bg-slate-50 border-slate-100';
      case 'suspended': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FaCheckCircle className="w-3 h-3" />;
      case 'inactive': return <FaClock className="w-3 h-3" />;
      case 'suspended': return <FaExclamationTriangle className="w-3 h-3" />;
      default: return <FaClock className="w-3 h-3" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'fleet-operator': return 'Fleet Operator';
      case 'cargo-owner': return 'Cargo Owner';
      case 'broker': return 'Freight Broker';
      case 'logistics': return 'Logistics Provider';
      default: return type;
    }
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Synchronized';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-8">
          {/* Left side - Tenant Info */}
          <div className="flex items-center space-x-6">
            {/* Tenant Avatar/Logo */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{
                rotate: [0, -5, 5, -5, 0],
                transition: { duration: 0.5 }
              }}
              className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 cursor-pointer"
            >
              <span className="text-white font-black text-xl tracking-tighter">
                {tenant?.name?.charAt(0)?.toUpperCase() || 'T'}
              </span>
            </motion.div>

            {/* Tenant Details */}
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">{tenant?.name || 'UrutiX Client'}</h1>
                <motion.span
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border cursor-default ${getStatusColor(tenant?.status || 'inactive')}`}
                >
                  {getStatusIcon(tenant?.status || 'inactive')}
                  <span className="ml-1.5">{tenant?.status || 'inactive'}</span>
                </motion.span>
              </div>
              <div className="flex items-center space-x-4 mt-1.5 font-medium">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {getTypeLabel(tenant?.type || 'unknown')}
                </span>
                <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                  ID: {tenant?.id?.split('-')[0] || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-6">
            {/* Last Updated */}
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Network Status</span>
              <span className="text-xs font-bold text-slate-500">{formatLastUpdated(lastUpdated)}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onRefresh}
                disabled={isRefreshing}
                className={`p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 ${isRefreshing ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
                title="Refresh Intelligence"
              >
                <motion.div
                  animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
                >
                  <FaSync className="w-4 h-4" />
                </motion.div>
              </motion.button>

              <div className="relative" ref={notificationRef}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 relative ${showNotifications ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-400 hover:text-indigo-600'}`}
                >
                  <FaBell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-gray-50"></span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 origin-top-right overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Notifications</h3>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{notifications.length} New</span>
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-gray-50">
                            {notifications.map((notification: any) => (
                              <div key={notification.id} className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group">
                                <div className="flex items-start space-x-3">
                                  <div className={`p-1.5 rounded-full mt-0.5 shrink-0 ${notification.status === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                    notification.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                                      notification.status === 'error' ? 'bg-rose-100 text-rose-600' :
                                        'bg-indigo-100 text-indigo-600'
                                    }`}>
                                    {notification.status === 'success' ? <FaCheckCircle className="w-3 h-3" /> :
                                      notification.status === 'warning' ? <FaExclamationTriangle className="w-3 h-3" /> :
                                        notification.status === 'error' ? <FaExclamationTriangle className="w-3 h-3" /> :
                                          <FaClock className="w-3 h-3" />}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{notification.action}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{notification.description}</p>
                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-1.5">{notification.timestamp}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-8 text-center">
                            <FaBell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-xs font-medium text-slate-400">No new notifications</p>
                          </div>
                        )}
                      </div>

                      <div className="px-4 py-2 border-t border-gray-50 bg-gray-50/30 text-center">
                        <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors">
                          View All Activity
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSettingsClick ? onSettingsClick() : navigate('/tenant-admin/settings')}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200"
              >
                <FaCog className="w-4 h-4" />
              </motion.button>

              <div className="w-px h-4 bg-gray-200 mx-1"></div>

              <div className="relative" ref={userMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 ${showUserMenu ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-400 hover:text-indigo-600'
                    }`}
                >
                  <FaUser className="w-4 h-4" />
                </motion.button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{tenant?.name}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="py-5 border-t border-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Active Assets', value: '23', unit: 'Units', color: 'text-emerald-500' },
              { label: 'Operational Loads', value: '47', unit: 'Flows', color: 'text-indigo-500' },
              { label: 'Standard Reliability', value: '94.2%', unit: 'Score', color: 'text-emerald-500' },
              { label: 'Global Trust', value: '4.6', unit: 'Rating', color: 'text-amber-500', subValue: '/5' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="flex flex-col group cursor-default"
              >
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-indigo-500 transition-colors">{stat.label}</span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-lg font-black text-slate-800 tracking-tight">
                    {stat.value}{stat.subValue && <span className="text-slate-300">{stat.subValue}</span>}
                  </span>
                  <span className={`text-[10px] font-bold ${stat.color} tracking-wide`}>{stat.unit}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantHeader;

