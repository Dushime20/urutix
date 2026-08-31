export const DELAY_REASONS = [
  'Traffic',
  'Vehicle Breakdown',
  'Accident',
  'Road Condition',
  'Weather',
  'Cargo Issue',
  'Loading/Unloading Delay',
  'Customer/Consignee Unavailable',
  'Border/Customs Delay',
  'Security Issue',
  'Other',
] as const;

export type DelayReason = (typeof DELAY_REASONS)[number];

export const TRIP_OVERDUE_QUERY_KEYS = [
  'driver-current-trip',
  'driver-active-trips',
  'driver-upcoming-trips',
  'driver-trip-history',
  'tenant-trips',
  'activeTrips',
  'trips-active',
  'trips-overdue',
  'admin-all-trips',
] as const;

export function isOverdueTripStatus(status?: string | null): boolean {
  return (status || '').toUpperCase() === 'OVERDUE';
}

export function isHaulingTripStatus(status?: string | null): boolean {
  const s = (status || '').toUpperCase();
  return s === 'IN_PROGRESS' || s === 'OVERDUE';
}

export function formatOverdueDateTime(value?: string | Date | null): string {
  if (!value) return 'unknown';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return d.toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    hourCycle: 'h23',
  });
}

export function formatOverdueDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0 minutes';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  if (minutes === 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
  return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'}`;
}

export function overdueDurationMs(
  expectedEnd?: string | Date | null,
  actualEnd?: string | Date | null,
  now: Date = new Date(),
): number {
  if (!expectedEnd) return 0;
  const expected = expectedEnd instanceof Date ? expectedEnd : new Date(expectedEnd);
  if (Number.isNaN(expected.getTime())) return 0;
  const actual = actualEnd
    ? actualEnd instanceof Date
      ? actualEnd
      : new Date(actualEnd)
    : now;
  const end = Number.isNaN(actual.getTime()) ? now : actual;
  return Math.max(0, end.getTime() - expected.getTime());
}
