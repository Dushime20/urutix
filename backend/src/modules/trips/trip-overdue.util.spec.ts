import { TripStatus } from '../../entities/trip.entity';
import {
  applyCompleteTransition,
  applyDelayReport,
  applyOverdueTransition,
  DELAY_REASONS,
  formatDurationMs,
  hasOverdueTransitionRecord,
  isIndefinitelyOccupyingStatus,
  isOverdueCandidate,
  OPERATIONAL_TRIP_STATUSES,
  overdueDurationMs,
  validateDelayReport,
} from './trip-overdue.util';

describe('trip-overdue.util', () => {
  const now = new Date('2026-08-31T18:00:00.000Z');

  it('does not mark a future IN_PROGRESS trip overdue', () => {
    expect(
      isOverdueCandidate(
        TripStatus.IN_PROGRESS,
        new Date('2026-08-31T19:00:00.000Z'),
        now,
      ),
    ).toBe(false);
  });

  it('marks IN_PROGRESS overdue when plannedEndTime has passed', () => {
    const trip = {
      status: TripStatus.IN_PROGRESS,
      plannedEndTime: new Date('2026-08-31T17:00:00.000Z'),
      issuesReported: [] as any[],
    };
    const result = applyOverdueTransition(trip, now);
    expect(result.changed).toBe(true);
    expect(trip.status).toBe(TripStatus.OVERDUE);
    expect(hasOverdueTransitionRecord(trip.issuesReported)).toBe(true);
  });

  it('never auto-completes when expected end is reached', () => {
    const trip = {
      status: TripStatus.IN_PROGRESS,
      plannedEndTime: new Date('2026-08-31T17:00:00.000Z'),
      issuesReported: [] as any[],
    };
    applyOverdueTransition(trip, now);
    expect(trip.status).not.toBe(TripStatus.COMPLETED);
    expect(trip.status).toBe(TripStatus.OVERDUE);
  });

  it('does not treat pause (DELAYED) or HOS-break as overdue candidates', () => {
    expect(isOverdueCandidate(TripStatus.DELAYED, now, now)).toBe(false);
    expect(isOverdueCandidate(TripStatus.PLANNED, now, now)).toBe(false);
    expect(isOverdueCandidate(TripStatus.COMPLETED, now, now)).toBe(false);
  });

  it('is idempotent: a second overdue apply does not duplicate the issue record', () => {
    const trip = {
      status: TripStatus.IN_PROGRESS,
      plannedEndTime: new Date('2026-08-31T17:00:00.000Z'),
      issuesReported: [] as any[],
    };
    applyOverdueTransition(trip, now);
    const firstCount = trip.issuesReported.length;
    const second = applyOverdueTransition(
      { ...trip, status: TripStatus.IN_PROGRESS },
      now,
    );
    expect(second.changed).toBe(false);
    expect(trip.issuesReported.length).toBe(firstCount);
  });

  it('completes an OVERDUE trip and records actual completion without changing expected end', () => {
    const plannedEnd = new Date('2026-08-31T16:00:00.000Z');
    const trip = {
      status: TripStatus.OVERDUE,
      plannedEndTime: plannedEnd,
      actualEndTime: null as Date | null,
      completedAt: null as Date | null,
      onTimePerformance: true as boolean | undefined,
    };
    const completedAt = new Date('2026-08-31T20:30:00.000Z');
    const result = applyCompleteTransition(trip, completedAt);
    expect(result.changed).toBe(true);
    expect(trip.status).toBe(TripStatus.COMPLETED);
    expect(trip.actualEndTime).toEqual(completedAt);
    expect(trip.completedAt).toEqual(completedAt);
    expect(trip.plannedEndTime).toEqual(plannedEnd);
    expect(trip.onTimePerformance).toBe(false);
    expect(overdueDurationMs(trip, completedAt)).toBe(4.5 * 60 * 60 * 1000);
  });

  it('records a delay report without completing the trip', () => {
    const trip: any = {
      status: TripStatus.OVERDUE,
      plannedEndTime: new Date('2026-08-31T16:00:00.000Z'),
      issuesReported: [] as any[],
    };
    const result = applyDelayReport(
      trip,
      {
        delayReason: 'Vehicle Breakdown',
        delayDescription: 'Engine overheated',
        newEstimatedArrival: '2026-09-01T08:30:00.000Z',
        reportedBy: 'driver-1',
      },
      now,
    );
    expect(result.changed).toBe(true);
    expect(trip.status).toBe(TripStatus.OVERDUE);
    expect(trip.delayReason).toBe('Vehicle Breakdown');
    expect(trip.estimatedEndTime).toEqual(new Date('2026-09-01T08:30:00.000Z'));
    expect(OPERATIONAL_TRIP_STATUSES).toContain(TripStatus.OVERDUE);
  });

  it('requires a delay reason and an explanation when Other is selected', () => {
    expect(validateDelayReport({ delayReason: '', newEstimatedArrival: now })).toBe(
      'Delay reason is required',
    );
    expect(
      validateDelayReport({ delayReason: 'Other', newEstimatedArrival: now }),
    ).toBe('Please provide an explanation when the delay reason is Other');
    expect(DELAY_REASONS).toContain('Traffic');
  });

  it('race: completing first prevents overdue; overdue first still allows complete', () => {
    const plannedEnd = new Date('2026-08-31T18:00:00.000Z');
    const completed = {
      status: TripStatus.IN_PROGRESS,
      plannedEndTime: plannedEnd,
      issuesReported: [] as any[],
    };
    applyCompleteTransition(completed, now);
    expect(applyOverdueTransition(completed, now).changed).toBe(false);
    expect(completed.status).toBe(TripStatus.COMPLETED);

    const overdueThenComplete = {
      status: TripStatus.IN_PROGRESS,
      plannedEndTime: plannedEnd,
      issuesReported: [] as any[],
    };
    applyOverdueTransition(overdueThenComplete, now);
    applyCompleteTransition(overdueThenComplete, new Date('2026-08-31T20:30:00.000Z'));
    expect(overdueThenComplete.status).toBe(TripStatus.COMPLETED);
  });

  it('treats OVERDUE as indefinitely occupying the truck', () => {
    expect(isIndefinitelyOccupyingStatus(TripStatus.OVERDUE)).toBe(true);
    expect(isIndefinitelyOccupyingStatus(TripStatus.IN_PROGRESS)).toBe(false);
    expect(isIndefinitelyOccupyingStatus(TripStatus.COMPLETED)).toBe(false);
  });

  it('formats overdue duration', () => {
    expect(formatDurationMs(2 * 60 * 60 * 1000 + 15 * 60 * 1000)).toBe(
      '2 hours 15 minutes',
    );
  });
});
