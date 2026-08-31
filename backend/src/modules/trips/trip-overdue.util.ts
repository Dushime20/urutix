import { TripStatus } from '../../entities/trip.entity';

/** Well-known system actor for audit rows written by the scheduler. */
export const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000001';
export const SYSTEM_ACTOR_NAME = 'SYSTEM';

export const OVERDUE_ISSUE_TYPE = 'OVERDUE_TRANSITION';
export const DELAY_REPORT_ISSUE_TYPE = 'DELAY_REPORT';

export const OVERDUE_BATCH_SIZE = 100;

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

/** Trip is still occupying the truck/driver until completed or cancelled. */
export const OPERATIONAL_TRIP_STATUSES: TripStatus[] = [
  TripStatus.PLANNED,
  TripStatus.IN_PROGRESS,
  TripStatus.DELAYED,
  TripStatus.OVERDUE,
];

/**
 * OVERDUE trips occupy the truck indefinitely until COMPLETED/CANCELLED.
 * Do not treat plannedEndTime as a free-after timestamp.
 */
export function isIndefinitelyOccupyingStatus(
  status?: TripStatus | string | null,
): boolean {
  return status === TripStatus.OVERDUE;
}

export const TERMINAL_TRIP_STATUSES: TripStatus[] = [
  TripStatus.COMPLETED,
  TripStatus.CANCELLED,
];

export const COMPLETABLE_TRIP_STATUSES: TripStatus[] = [
  TripStatus.IN_PROGRESS,
  TripStatus.OVERDUE,
  TripStatus.DELAYED,
];

export interface OverdueMutableTrip {
  status: TripStatus | string;
  plannedEndTime?: Date | string | null;
  estimatedEndTime?: Date | string | null;
  estimatedArrival?: Date | string | null;
  eta?: Date | string | null;
  actualEndTime?: Date | string | null;
  completedAt?: Date | string | null;
  onTimePerformance?: boolean | null;
  issuesReported?: any[] | null;
  delayReason?: string | null;
  delayDescription?: string | null;
  delayReportedAt?: Date | string | null;
  delayReportedBy?: string | null;
}

export interface DelayReportInput {
  delayReason: string;
  delayDescription?: string;
  newEstimatedArrival: Date | string;
  reportedBy: string;
}

export interface TransitionResult {
  changed: boolean;
  error?: string;
}

export function toDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isOverdueCandidate(
  status: TripStatus | string,
  plannedEndTime: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (status !== TripStatus.IN_PROGRESS) return false;
  const end = toDate(plannedEndTime);
  if (!end) return false;
  return end.getTime() <= now.getTime();
}

export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0 minutes';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  if (minutes === 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
  return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'}`;
}

/**
 * Format a timestamp for notifications. Uses the provided IANA timezone when
 * available; otherwise UTC. Never falls back to a hard-coded regional zone.
 */
export function formatTripDateTime(
  value: Date | string | null | undefined,
  timeZone?: string,
): string {
  const d = toDate(value);
  if (!d) return 'unknown';
  const zone = timeZone && timeZone.trim() ? timeZone.trim() : 'UTC';
  try {
    const formatted = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: zone,
      hourCycle: 'h23',
    }).format(d);
    return zone === 'UTC' ? `${formatted} UTC` : `${formatted} (${zone})`;
  } catch {
    return `${d.toISOString()} UTC`;
  }
}

export function overdueDurationMs(
  trip: OverdueMutableTrip,
  now: Date = new Date(),
): number {
  const expected = toDate(trip.plannedEndTime);
  if (!expected) return 0;
  const actual = toDate(trip.actualEndTime) || toDate(trip.completedAt);
  const end =
    trip.status === TripStatus.COMPLETED && actual ? actual.getTime() : now.getTime();
  return Math.max(0, end - expected.getTime());
}

export function delayDurationMs(trip: OverdueMutableTrip): number {
  const expected = toDate(trip.plannedEndTime);
  const actual = toDate(trip.actualEndTime) || toDate(trip.completedAt);
  if (!expected || !actual) return 0;
  return Math.max(0, actual.getTime() - expected.getTime());
}

export function hasOverdueTransitionRecord(issuesReported?: any[] | null): boolean {
  return (issuesReported || []).some(
    (issue) => issue && issue.type === OVERDUE_ISSUE_TYPE,
  );
}

export function validateDelayReport(input: {
  delayReason?: string;
  delayDescription?: string;
  newEstimatedArrival?: Date | string;
}): string | null {
  const reason = (input.delayReason || '').trim();
  if (!reason) return 'Delay reason is required';
  if (!(DELAY_REASONS as readonly string[]).includes(reason)) {
    return 'Invalid delay reason';
  }
  if (reason === 'Other' && !(input.delayDescription || '').trim()) {
    return 'Please provide an explanation when the delay reason is Other';
  }
  const eta = toDate(input.newEstimatedArrival || null);
  if (!eta) return 'New estimated arrival is required';
  return null;
}

export function applyOverdueTransition(
  trip: OverdueMutableTrip,
  now: Date = new Date(),
): TransitionResult {
  if (!isOverdueCandidate(trip.status, trip.plannedEndTime, now)) {
    return { changed: false };
  }
  if (hasOverdueTransitionRecord(trip.issuesReported)) {
    trip.status = TripStatus.OVERDUE;
    return { changed: false };
  }

  const previous = trip.status;
  trip.status = TripStatus.OVERDUE;
  trip.onTimePerformance = false;
  const issues = Array.isArray(trip.issuesReported) ? [...trip.issuesReported] : [];
  issues.push({
    type: OVERDUE_ISSUE_TYPE,
    previousStatus: previous,
    newStatus: TripStatus.OVERDUE,
    reason: 'Expected completion time reached',
    changedBy: SYSTEM_ACTOR_NAME,
    plannedEndTime: toDate(trip.plannedEndTime)?.toISOString(),
    at: now.toISOString(),
  });
  trip.issuesReported = issues;
  return { changed: true };
}

export function applyCompleteTransition(
  trip: OverdueMutableTrip,
  now: Date = new Date(),
): TransitionResult {
  if (trip.status === TripStatus.COMPLETED) {
    return { changed: false };
  }
  if (trip.status === TripStatus.CANCELLED) {
    return { changed: false, error: 'Cannot complete a cancelled trip' };
  }
  if (!COMPLETABLE_TRIP_STATUSES.includes(trip.status as TripStatus)) {
    return {
      changed: false,
      error: `Cannot complete a trip in status ${trip.status}`,
    };
  }

  const expected = toDate(trip.plannedEndTime);
  const completedLate =
    trip.status === TripStatus.OVERDUE ||
    (expected ? now.getTime() > expected.getTime() : false);

  trip.status = TripStatus.COMPLETED;
  trip.actualEndTime = now;
  trip.completedAt = now;
  trip.onTimePerformance = !completedLate;
  return { changed: true };
}

export function applyDelayReport(
  trip: OverdueMutableTrip,
  input: DelayReportInput,
  now: Date = new Date(),
): TransitionResult {
  const validationError = validateDelayReport(input);
  if (validationError) return { changed: false, error: validationError };

  if (
    trip.status !== TripStatus.OVERDUE &&
    trip.status !== TripStatus.IN_PROGRESS &&
    trip.status !== TripStatus.DELAYED
  ) {
    return {
      changed: false,
      error: 'Delay can only be reported on an active trip',
    };
  }

  const eta = toDate(input.newEstimatedArrival)!;
  trip.delayReason = input.delayReason.trim();
  trip.delayDescription = (input.delayDescription || '').trim() || null;
  trip.delayReportedAt = now;
  trip.delayReportedBy = input.reportedBy;
  trip.estimatedEndTime = eta;
  trip.estimatedArrival = eta;
  trip.eta = eta;

  const issues = Array.isArray(trip.issuesReported) ? [...trip.issuesReported] : [];
  issues.push({
    type: DELAY_REPORT_ISSUE_TYPE,
    delayReason: trip.delayReason,
    delayDescription: trip.delayDescription,
    newEstimatedArrival: eta.toISOString(),
    reportedBy: input.reportedBy,
    reportedAt: now.toISOString(),
  });
  trip.issuesReported = issues;
  return { changed: true };
}

export function enrichTripOverdueFields<T extends OverdueMutableTrip>(
  trip: T,
  now: Date = new Date(),
): T & {
  expectedEndAt: Date | string | null | undefined;
  actualCompletedAt: Date | string | null | undefined;
  overdueDurationMs: number;
  overdueDurationLabel: string;
  delayDurationMs: number;
  delayDurationLabel: string;
  delayReported: boolean;
} {
  const overdueMs =
    trip.status === TripStatus.OVERDUE ||
    (trip.status === TripStatus.COMPLETED && delayDurationMs(trip) > 0)
      ? overdueDurationMs(trip, now)
      : 0;
  const delayMs = delayDurationMs(trip);
  return {
    ...trip,
    expectedEndAt: trip.plannedEndTime,
    actualCompletedAt: trip.actualEndTime || trip.completedAt,
    overdueDurationMs: overdueMs,
    overdueDurationLabel: formatDurationMs(overdueMs),
    delayDurationMs: delayMs,
    delayDurationLabel: formatDurationMs(delayMs),
    delayReported: !!trip.delayReportedAt,
  };
}
