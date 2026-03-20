import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Activity, CheckCheck, Clock, ShieldAlert } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import type { UrutixNotification } from '../../hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';

const AdminNotificationDropdown: React.FC = () => {
    const {
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
    } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<UrutixNotification | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type: string, size: number = 18) => {
        if (type.includes('security') || type.includes('suspicious')) return <ShieldAlert size={size} className="text-red-500" />;
        if (type.includes('activity')) return <Activity size={size} className="text-indigo-500" />;
        return <Bell size={size} className="text-slate-400" />;
    };

    const handleNotificationClick = (n: UrutixNotification) => {
        markAsRead(n.id);
        setSelectedNotification(n);
        setIsOpen(false); 
    };

    const renderNotificationModal = () => {
        return createPortal(
            <AnimatePresence>
                {selectedNotification && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedNotification(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                        {getIcon(selectedNotification.type, 20)}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-wider">Alert Details</h3>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">PLATFORM INTELLIGENCE</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedNotification(null)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-slate-400 hover:text-white" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        selectedNotification.priority === 'HIGH' || selectedNotification.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
                                    }`}>
                                        {selectedNotification.priority || 'NORMAL'} PRIORITY
                                    </span>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <Clock size={12} />
                                        {new Date(selectedNotification.timestamp).toLocaleString()}
                                    </div>
                                </div>

                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4 uppercase">
                                    {selectedNotification.title}
                                </h2>

                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-6">
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                        {selectedNotification.message}
                                    </p>
                                </div>

                                {selectedNotification.data && (
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Raw Payload</h4>
                                        <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[10px] font-mono overflow-x-auto border-l-4 border-emerald-500 shadow-inner">
                                            {JSON.stringify(selectedNotification.data, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                                <button 
                                    onClick={() => setSelectedNotification(null)}
                                    className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-[0.98]"
                                >
                                    Dismiss View
                                </button>
                                <button 
                                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
                                    onClick={() => {
                                        if (selectedNotification.actionUrl) {
                                            window.location.href = selectedNotification.actionUrl;
                                        }
                                        setSelectedNotification(null);
                                    }}
                                >
                                    Take Action
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>,
            document.body
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-xl transition-all ${
                    isOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
                }`}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
                {isConnected && (
                    <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-white"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-[380px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-[100]"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider">Platform Alerts</h3>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{unreadCount} UNREAD NOTIFICATIONS</p>
                            </div>
                            <button 
                                onClick={markAllAsRead}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                                title="Mark all as read"
                            >
                                <CheckCheck size={16} className="text-slate-400 group-hover:text-white" />
                            </button>
                        </div>

                        {/* List */}
                        <div className="max-h-[420px] overflow-y-auto scrollbar-hide py-2">
                            {notifications.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                                        <Bell className="text-slate-300" size={24} />
                                    </div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Alerts Found</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div 
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`px-6 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!n.isRead ? 'bg-indigo-50/10' : ''}`}
                                    >
                                        {!n.isRead && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                                        )}
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm flex-shrink-0">
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`text-xs font-black uppercase tracking-tight truncate ${!n.isRead ? 'text-slate-900' : 'text-slate-500'}`}>
                                                        {n.title}
                                                    </h4>
                                                    <span className="text-[9px] font-black text-slate-400 whitespace-nowrap ml-2">
                                                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-2 line-clamp-2">
                                                    {n.message}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                                                        n.priority === 'HIGH' || n.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {n.priority || 'NORMAL'}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                                                        <Clock size={10} />
                                                        {new Date(n.timestamp).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                            <button 
                                className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm active:scale-[0.98]"
                                onClick={() => {
                                    window.location.href = '/admin/notifications';
                                    setIsOpen(false);
                                }}
                            >
                                VIEW ALL SYSTEM ALERTS
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notification Detail Modal */}
            {renderNotificationModal()}
        </div>
    );
};

export default AdminNotificationDropdown;
