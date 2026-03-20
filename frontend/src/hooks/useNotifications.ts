import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdminNotifications } from './useAdminNotifications';
import { useCargoOwnerNotifications } from './useCargoOwnerNotifications';
import { useBrokerNotifications } from './useBrokerNotifications';

/**
 * Unified Notification Interface
 */
export interface UrutixNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
    actionUrl?: string;
    actionText?: string;
    data?: any;
}

/**
 * Unified hook to access notifications based on user role.
 */
export const useNotifications = () => {
    const { user } = useAuth();
    
    // We instantiate these, but their internal useEffects 
    // early-exit if the user role doesn't match.
    const admin = useAdminNotifications();
    const cargo = useCargoOwnerNotifications();
    const broker = useBrokerNotifications();

    return useMemo(() => {
        if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
            return {
                ...admin,
                notifications: admin.notifications.map(n => ({
                    ...n,
                    timestamp: n.timestamp,
                    isRead: n.isRead,
                    actionUrl: (n as any).actionUrl,
                    actionText: (n as any).actionText
                })) as UrutixNotification[]
            };
        }

        if (user?.role === 'CARGO_OWNER') {
            return {
                ...cargo,
                highPriorityCount: (cargo as any).highPriorityUnread || 0,
                notifications: cargo.notifications.map(n => ({
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    timestamp: n.timestamp,
                    isRead: n.isRead,
                    priority: n.priority as any,
                    actionUrl: (n as any).actionUrl || (n.data?.loadId ? `/cargo-owner/payment?loadId=${n.data.loadId}` : undefined),
                    actionText: (n as any).actionText || (n.data?.loadId ? 'Process Payment' : undefined),
                    data: n.data
                })) as UrutixNotification[]
            };
        }

        if (user?.role === 'BROKER') {
            return {
                ...broker,
                highPriorityCount: 0,
                isConnected: (broker as any).isConnected || false,
                notifications: broker.notifications.map(n => ({
                    ...n,
                    isRead: (n as any).isRead ?? (n as any).read ?? false,
                    timestamp: (n as any).timestamp || (n as any).createdAt || new Date().toISOString()
                })) as UrutixNotification[],
                removeNotification: (_id: string) => {} // Mock if missing
            };
        }

        // Default empty state for other roles
        return {
            notifications: [] as UrutixNotification[],
            unreadCount: 0,
            highPriorityCount: 0,
            isConnected: false,
            markAsRead: (_id: string) => {},
            markAllAsRead: () => {},
            removeNotification: (_id: string) => {}
        };
    }, [user?.role, admin, cargo, broker]);
};
