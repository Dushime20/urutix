import type { NavigateFunction } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  resolveNotificationRoute,
  type ResolveNotificationRouteResult,
} from './resolveNotificationRoute';

export interface NotificationNavTarget {
  id?: string;
  actionUrl?: string | null;
  type?: string;
  isRead?: boolean;
}

/**
 * Resolve route, navigate, and mark as read only after a navigable destination
 * is determined (including remapped / fallback module paths).
 * Does not mark as read when resolution fails completely.
 */
export async function navigateFromNotification(options: {
  notification: NotificationNavTarget;
  role?: string | null;
  navigate: NavigateFunction;
  markAsRead?: (id: string) => void | Promise<void>;
  onNavigated?: () => void;
}): Promise<ResolveNotificationRouteResult> {
  const { notification, role, navigate, markAsRead, onNavigated } = options;

  const resolved = resolveNotificationRoute(notification.actionUrl, role, {
    notificationType: notification.type,
  });

  if (!resolved.path) {
    toast.error(resolved.message || 'Unable to open this notification.');
    return resolved;
  }

  // External absolute URLs
  if (/^https?:\/\//i.test(resolved.path)) {
    if (notification.id && !notification.isRead && markAsRead) {
      await markAsRead(notification.id);
    }
    window.location.assign(resolved.path);
    onNavigated?.();
    return resolved;
  }

  if (resolved.status === 'invalid_params' || resolved.status === 'unavailable') {
    // Still navigate to the friendly unavailable page; mark read only after that navigation is queued
    navigate(resolved.path);
    if (notification.id && !notification.isRead && markAsRead) {
      await markAsRead(notification.id);
    }
    onNavigated?.();
    return resolved;
  }

  if (resolved.status === 'missing_url' && resolved.message) {
    toast(resolved.message, { icon: '🔔', duration: 4000 });
  }

  navigate(resolved.path);
  if (notification.id && !notification.isRead && markAsRead) {
    await markAsRead(notification.id);
  }
  onNavigated?.();
  return resolved;
}
