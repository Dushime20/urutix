import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, X, Package, DollarSign, Truck,
  CreditCard, MapPin, AlertTriangle, Info, Check,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import type { UrutixNotification } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext';
import { navigateFromNotification } from '../../utils/notificationNavigation';
import { getNotificationsHubPath } from '../../utils/resolveNotificationRoute';

interface CargoOwnerNotificationDropdownProps {
  className?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const getNotificationIcon = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('match') || t.includes('cargo')) return <Package className="w-5 h-5" />;
  if (t.includes('payment') || t.includes('credit') || t.includes('financial')) return <CreditCard className="w-5 h-5" />;
  if (t.includes('bid') || t.includes('dollar')) return <DollarSign className="w-5 h-5" />;
  if (t.includes('trip') || t.includes('truck') || t.includes('driver')) return <Truck className="w-5 h-5" />;
  if (t.includes('location') || t.includes('tracking')) return <MapPin className="w-5 h-5" />;
  if (t.includes('alert') || t.includes('warning') || t.includes('urgent')) return <AlertTriangle className="w-5 h-5" />;
  return <Info className="w-5 h-5" />;
};

const getIconBgColor = (type: string, isRead: boolean): string => {
  if (isRead) return 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500';
  const t = (type || '').toLowerCase();
  if (t.includes('match') || t.includes('cargo')) return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
  if (t.includes('payment') || t.includes('credit') || t.includes('financial')) return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
  if (t.includes('bid')) return 'bg-green-100 text-green-600 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (t.includes('trip') || t.includes('driver')) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
  if (t.includes('alert') || t.includes('warning')) return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
  return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
};

const formatTimestamp = (ts: string): string => {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
};

// ── Component ─────────────────────────────────────────────────────────────────

const CargoOwnerNotificationDropdown: React.FC<CargoOwnerNotificationDropdownProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const bellRef = useRef<HTMLDivElement>(null);

  const filteredNotifications = notifications
    .filter(n => activeTab === 'unread' ? !n.isRead : true)
    .slice(0, 20);

  const handleNotificationClick = useCallback((n: UrutixNotification) => {
    void navigateFromNotification({
      notification: n,
      role: user?.role,
      navigate,
      markAsRead,
      onNavigated: () => setIsOpen(false),
    });
  }, [markAsRead, navigate, user?.role]);

  const handleMarkAllRead = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsRead();
  }, [markAllAsRead]);

  const handleRemove = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeNotification(id);
  }, [removeNotification]);

  const badgeCount = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <>
      {/* ── Bell Button ── */}
      <div className={`relative ${className}`} ref={bellRef}>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-gray-50 dark:bg-slate-900/50 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 transition-all touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 relative"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="w-5 h-5" />

          {/* Live connection dot */}
          {isConnected && (
            <span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-white dark:bg-slate-950 rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            </span>
          )}

          {/* Unread badge */}
          {badgeCount && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-slate-950 shadow-sm animate-in zoom-in-50 duration-200">
              {badgeCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Drawer Portal ── */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] isolate">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 dark:bg-slate-900/60 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar Drawer */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-slate-900 shadow-2xl border-l border-gray-100 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                  Notifications
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                    : 'All caught up!'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 -mr-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                aria-label="Close notifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Tabs + Mark All ── */}
            <div className="flex items-center gap-2 px-6 py-3 bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800">
              {/* All tab */}
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900'
                    : 'bg-white dark:bg-slate-950 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
                }`}
              >
                All
                <span className={`ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] ${
                  activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                }`}>
                  {notifications.length}
                </span>
              </button>

              {/* Unread tab */}
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'unread'
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900'
                    : 'bg-white dark:bg-slate-950 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className={`inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold ${
                    activeTab === 'unread' ? 'bg-white/20 text-white' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Mark all read */}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="ml-auto text-xs text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* ── Notification List ── */}
            <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-slate-950/30">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-200 dark:border-slate-700">
                    <Bell className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                    {activeTab === 'unread' ? 'All caught up!' : 'No notifications'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-[200px]">
                    {activeTab === 'unread'
                      ? "You've read all your notifications."
                      : 'Check back later for updates.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800/50">
                  {filteredNotifications.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onClick={handleNotificationClick}
                      onMarkRead={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                      onRemove={(e) => handleRemove(e, n.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button
                onClick={() => { navigate(getNotificationsHubPath(user?.role)); setIsOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 transition-colors"
              >
                View All Notifications
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// ── Notification Item ─────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: UrutixNotification;
  onClick: (n: UrutixNotification) => void;
  onMarkRead: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification: n, onClick, onMarkRead, onRemove }) => (
  <div
    className={`group relative p-5 transition-all hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer ${
      !n.isRead ? 'bg-white dark:bg-slate-900' : 'bg-gray-50/40 dark:bg-slate-800/20'
    }`}
    onClick={() => onClick(n)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick(n)}
    aria-label={n.title}
  >
    <div className="flex gap-4">
      {/* Icon */}
      <div className="flex-shrink-0 pt-0.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${getIconBgColor(n.type, n.isRead)}`}>
          {getNotificationIcon(n.type)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex justify-between items-start gap-2 mb-1">
          <p className={`text-sm font-semibold leading-snug ${!n.isRead ? 'text-gray-900 dark:text-slate-100' : 'text-gray-600 dark:text-slate-400'}`}>
            {n.title}
          </p>
          <span className="text-[10px] text-gray-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0 mt-0.5 font-medium">
            {formatTimestamp(n.timestamp)}
          </span>
        </div>

        <p className={`text-sm leading-relaxed line-clamp-2 ${!n.isRead ? 'text-gray-600 dark:text-slate-400' : 'text-gray-400 dark:text-slate-500'}`}>
          {n.message}
        </p>

        {/* Priority chip */}
        {(n.priority === 'HIGH' || n.priority === 'URGENT' || n.priority === 'CRITICAL') && !n.isRead && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50">
              {n.priority}
            </span>
          </div>
        )}

        {/* Action link */}
        {n.actionUrl && n.actionText && (
          <p className="mt-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
            {n.actionText} →
          </p>
        )}
      </div>
    </div>

    {/* Unread dot */}
    {!n.isRead && (
      <span className="absolute top-5 right-5 w-2 h-2 rounded-full bg-blue-500 shadow-sm ring-2 ring-white dark:ring-slate-900" />
    )}

    {/* Hover actions */}
    <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1">
      {!n.isRead && (
        <button
          onClick={onMarkRead}
          className="p-1 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Mark as read"
        >
          <Check className="w-3 h-3" />
        </button>
      )}
      <button
        onClick={onRemove}
        className="p-1 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        title="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  </div>
);

export default CargoOwnerNotificationDropdown;
