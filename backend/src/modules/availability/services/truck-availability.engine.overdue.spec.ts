import { TripStatus } from '../../../entities/trip.entity';
import { TruckAvailabilityEngine } from './truck-availability.engine';

describe('TruckAvailabilityEngine — OVERDUE occupancy', () => {
  const engine = new TruckAvailabilityEngine();

  const overdueTrip = {
    id: 'trip-a',
    status: TripStatus.OVERDUE,
    plannedStartTime: new Date('2026-08-28T08:00:00.000Z'),
    plannedEndTime: new Date('2026-08-31T18:00:00.000Z'),
  } as any;

  it('keeps an OVERDUE trip blocking even after planned end has passed', () => {
    expect(engine.isTripStatusBlocking(TripStatus.OVERDUE)).toBe(true);
    expect(
      engine.commitmentsConflict(
        overdueTrip,
        null,
        null,
        new Date('2026-09-01T08:00:00.000Z'),
        new Date('2026-09-03T18:00:00.000Z'),
      ),
    ).toBe(true);
  });

  it('does not block after the trip is COMPLETED', () => {
    const completed = { ...overdueTrip, status: TripStatus.COMPLETED, actualEndTime: new Date('2026-08-31T20:30:00.000Z') };
    expect(
      engine.commitmentsConflict(
        completed,
        null,
        null,
        new Date('2026-09-01T08:00:00.000Z'),
        new Date('2026-09-03T18:00:00.000Z'),
      ),
    ).toBe(false);
  });

  it('does not treat pause (DELAYED) as indefinitely occupying past the window', () => {
    const delayed = {
      ...overdueTrip,
      status: TripStatus.DELAYED,
      plannedEndTime: new Date('2026-09-10T18:00:00.000Z'),
    };
    expect(engine.isTripStatusBlocking(TripStatus.DELAYED)).toBe(true);
    expect(
      engine.commitmentsConflict(
        delayed,
        null,
        null,
        new Date('2026-08-28T08:00:00.000Z'),
        new Date('2026-09-09T18:00:00.000Z'),
      ),
    ).toBe(true);
  });
});
