import toast from 'react-hot-toast';

/**
 * Prevents realtime notification sockets from stacking extra toasts
 * right after the user already got a success/error toast for the same action.
 */
const SUPPRESS_MS = 5000;
let suppressUntil = 0;
const suppressedTypes = new Set<string>();

function beginSuppression(types: string[] = []) {
  suppressUntil = Date.now() + SUPPRESS_MS;
  suppressedTypes.clear();
  for (const type of types) {
    suppressedTypes.add(type.toUpperCase());
  }
}

/** Returns true when a realtime notification toast should be skipped. */
export function shouldSuppressRealtimeToast(notificationType?: string, title?: string): boolean {
  if (Date.now() > suppressUntil) {
    suppressedTypes.clear();
    return false;
  }

  // During the suppress window, skip all realtime toasts unless we only
  // suppressed specific types — empty set means suppress everything briefly.
  if (suppressedTypes.size === 0) return true;

  const type = (notificationType || '').toUpperCase();
  if (type && suppressedTypes.has(type)) return true;

  const titleLower = (title || '').toLowerCase();
  for (const suppressed of suppressedTypes) {
    const token = suppressed.toLowerCase().replace(/_/g, ' ');
    if (token && titleLower.includes(token)) return true;
  }
  return false;
}

type ActionToastOptions = {
  id?: string;
  duration?: number;
  /** Notification types to suppress from socket toasts (empty = suppress all briefly). */
  suppressTypes?: string[];
};

export function toastActionSuccess(message: string, options: ActionToastOptions = {}) {
  beginSuppression(options.suppressTypes ?? []);
  return toast.success(message, {
    id: options.id ?? 'action-result',
    duration: options.duration,
  });
}

export function toastActionError(message: string, options: ActionToastOptions = {}) {
  beginSuppression(options.suppressTypes ?? []);
  return toast.error(message, {
    id: options.id ?? 'action-result',
    duration: options.duration,
  });
}

export const BID_ACCEPT_SUPPRESS_TYPES = [
  'AUCTION_WON',
  'GENERAL',
  'BID_ACCEPTED',
  'DRIVER_TRIP_START',
];

export const TRIP_COMPLETE_SUPPRESS_TYPES = [
  'TRIP_COMPLETED',
  'DRIVER_TRIP_END',
  'GENERAL',
];
