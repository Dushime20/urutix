import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface Notification {
  id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'URGENT';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'TRIP' | 'SAFETY' | 'PAYMENT' | 'SYSTEM' | 'MAINTENANCE';
  actionRequired?: boolean;
  actionUrl?: string;
}

interface NotificationsPanelProps {
  notifications?: Notification[];
  loading?: boolean;
  onClose?: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, loading, onClose }) => {
  const { tSync: t } = useTranslation();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const currentNotifications = notifications || [];

  const filteredNotifications = currentNotifications.filter(notification => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !notification.read;
    return true;
  });

  const unreadCount = currentNotifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="bg-white rounded-[1.5rem] p-6 min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#345E85] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[1.5rem] shadow-xl overflow-hidden flex flex-col max-h-[600px] w-full max-w-md mx-auto">
      <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between bg-white relative">
        <div>
          <h2 className="text-xl font-bold text-gray-900"><TranslatedText text="Notifications" /></h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('You have {count} unread notifications', { count: String(unreadCount) })}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="px-6 py-4 flex gap-3 border-b border-gray-50">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-6 py-1.5 rounded-full text-sm font-medium transition-colors border ${filter === 'ALL'
            ? 'bg-[#345E85] text-white border-[#345E85]'
            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
        >
          <TranslatedText text="All" />
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-6 py-1.5 rounded-full text-sm font-medium transition-colors border ${filter === 'UNREAD'
            ? 'bg-[#345E85] text-white border-[#345E85]'
            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
        >
          <TranslatedText text="Unread" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[300px]">
        {filteredNotifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2"><TranslatedText text="No notifications" /></h3>
            <p className="text-gray-500 max-w-[200px]">
              <TranslatedText text="You're all caught up! Check back later for updates." />
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex gap-4">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900 mb-1">{notification.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{notification.message}</p>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(notification.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100">
        <button className="w-full py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
          <TranslatedText text="View All Notifications" />
        </button>
      </div>
    </div>
  );
};
