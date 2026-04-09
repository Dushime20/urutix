import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, X, Package, DollarSign, Truck } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

interface CargoOwnerNotificationDropdownProps {
    className?: string;
}

const CargoOwnerNotificationDropdown: React.FC<CargoOwnerNotificationDropdownProps> = ({ className = '' }) => {
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        isConnected,
        isLoading,
        markAsRead,
        markAllAsRead,
    } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const dropdownRef = useRef<HTMLDivElement>(null);

    console.log('🔔 NotificationDropdown render:', {
        notifications,
        notificationsLength: notifications.length,
        unreadCount,
        isConnected,
        isLoading,
    });

    // Mark all as read when closing the dropdown? No, user might want to keep them unread 
    // unless explicitly clicking "Mark all read". 
    // The original one did this, but maybe it's better to be explicit.
    // Let's keep it explicit for now.

    // Filter notifications based on active tab
    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'unread') return !n.isRead;
        return true;
    }).slice(0, 15); // Show max 15 notifications

    console.log('🔔 Filtered notifications:', {
        activeTab,
        filteredNotifications,
        filteredLength: filteredNotifications.length,
    });

    // Get notification icon
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'match_found': return <Package className="w-5 h-5" />;
            case 'bid_received': return <DollarSign className="w-5 h-5" />;
            case 'bid_accepted': return <CheckCheck className="w-5 h-5" />;
            case 'cargo_status_updated': return <Truck className="w-5 h-5" />;
            case 'payment_required': return <DollarSign className="w-5 h-5" />;
            case 'cargo_delivered': return <Package className="w-5 h-5" />;
            default: return <Bell className="w-5 h-5" />;
        }
    };

    // Get background color for icon
    const getIconBgColor = (type: string, isRead: boolean) => {
        if (isRead) return 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500';

        switch (type) {
            case 'match_found': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
            case 'bid_received': return 'bg-green-100 text-green-600 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'bid_accepted': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'payment_required': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
            case 'cargo_delivered': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'cargo_status_updated': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
            default: return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const handleNotificationClick = (notification: any) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }

        // Specific navigation logic based on type
        if (notification.type === 'cargo_status_updated' && notification.data?.status === 'LOADED') {
            navigate(`/cargo-owner/payment?loadId=${notification.data.cargoId}&action=pay`);
        } else if (notification.type === 'payment_required') {
            navigate(`/cargo-owner/payment?loadId=${notification.data.cargoId}&action=pay`);
        } else if (notification.data?.cargoId) {
            navigate(`/cargo-owner/cargos/${notification.data.cargoId}`);
        } else {
            // Default fallback
            navigate('/cargo-owner/notifications');
        }

        setIsOpen(false);
    };

    return (
        <>
            <div className={`relative ${className}`} ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 bg-gray-50 dark:bg-slate-900/50 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 transition-all touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 relative"
                    aria-label="Notifications"
                >
                    <Bell className="w-5 h-5" />

                    {/* Connection indicator */}
                    {isConnected && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-white dark:bg-slate-950 rounded-full flex items-center justify-center">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        </span>
                    )}

                    {/* Unread badge */}
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-slate-950 shadow-sm">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] isolate">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 dark:bg-slate-900/60 backdrop-blur-[2px] transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Sidebar Drawer */}
                    <div
                        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-out border-l border-gray-100 dark:border-slate-800 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                            }`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">Notifications</h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                    You have {unreadCount} unread notifications
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 -mr-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-2 px-6 py-3 bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeTab === 'all'
                                    ? 'bg-navy-600 dark:bg-blue-600 text-white shadow-sm ring-2 ring-navy-600 dark:ring-blue-500 ring-offset-1 dark:ring-offset-slate-900'
                                    : 'bg-white dark:bg-slate-950 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setActiveTab('unread')}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'unread'
                                    ? 'bg-navy-600 dark:bg-blue-600 text-white shadow-sm ring-2 ring-navy-600 dark:ring-blue-500 ring-offset-1 dark:ring-offset-slate-900'
                                    : 'bg-white dark:bg-slate-950 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
                                    }`}
                            >
                                Unread
                                {unreadCount > 0 && (
                                    <span className={`flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] ${activeTab === 'unread' ? 'bg-white/20 dark:bg-white/20 text-white' : 'bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                                        }`}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            <div className="ml-auto">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-navy-600 dark:text-blue-400 font-medium hover:text-navy-800 dark:hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-navy-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30 dark:bg-slate-950/30">
                            {filteredNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-200 dark:border-slate-700">
                                        <Bell className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">No notifications</h3>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-[200px]">
                                        {activeTab === 'unread'
                                            ? "You've read all your notifications."
                                            : "You're all caught up! Check back later for updates."}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-slate-800/50">
                                    {filteredNotifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`group relative p-5 transition-all hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer ${!notification.isRead ? 'bg-white dark:bg-slate-900' : 'bg-gray-50/40 dark:bg-slate-800/20'
                                                }`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex gap-4">
                                                {/* Icon */}
                                                <div className="flex-shrink-0 pt-1">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${getIconBgColor(notification.type, notification.isRead)}`}>
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2 mb-1">
                                                        <p className={`text-sm font-semibold leading-snug ${!notification.isRead ? 'text-gray-900 dark:text-slate-100' : 'text-gray-700 dark:text-slate-300'}`}>
                                                            {notification.title}
                                                        </p>
                                                        <span className="text-[10px] text-gray-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0 mt-0.5 font-medium">
                                                            {formatTimestamp(notification.timestamp)}
                                                        </span>
                                                    </div>

                                                    <p className={`text-sm leading-relaxed ${!notification.isRead ? 'text-gray-600 dark:text-slate-400' : 'text-gray-500 dark:text-slate-500'}`}>
                                                        {notification.message}
                                                    </p>

                                                    {/* Chips/Tags */}
                                                    {(notification.priority === 'HIGH' || notification.priority === 'URGENT') && (
                                                        <div className="mt-2.5 flex items-center gap-2">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50">
                                                                Priority
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Unread Indicator Dot */}
                                                {!notification.isRead && (
                                                    <div className="absolute top-5 right-5 w-2 h-2 rounded-full bg-red-500 shadow-sm ring-2 ring-white dark:ring-slate-900"></div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <button
                                onClick={() => {
                                    navigate('/cargo-owner/notifications');
                                    setIsOpen(false);
                                }}
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

export default CargoOwnerNotificationDropdown;
