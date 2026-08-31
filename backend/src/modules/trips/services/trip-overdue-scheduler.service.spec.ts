import { TripStatus } from '../../../entities/trip.entity';
import { TripOverdueSchedulerService } from './trip-overdue-scheduler.service';
import { OVERDUE_ISSUE_TYPE } from '../trip-overdue.util';

describe('TripOverdueSchedulerService', () => {
  const query = jest.fn();
  const dataSource = { query } as any;
  const finalizeOverdueTransitions = jest.fn().mockResolvedValue(undefined);
  const tripsService = { finalizeOverdueTransitions } as any;

  beforeEach(() => {
    query.mockReset();
    finalizeOverdueTransitions.mockClear();
  });

  it('does not transition a future IN_PROGRESS trip', async () => {
    query.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const scheduler = new TripOverdueSchedulerService(dataSource, tripsService);
    const count = await scheduler.scanAndMarkOverdue(new Date('2026-08-31T17:00:00.000Z'));
    expect(count).toBe(0);
    expect(finalizeOverdueTransitions).not.toHaveBeenCalled();
    expect(query.mock.calls[0][1][0]).toBe(TripStatus.OVERDUE);
    expect(query.mock.calls[0][1][1]).toBe(TripStatus.IN_PROGRESS);
  });

  it('marks due trips OVERDUE and finalizes once', async () => {
    query
      .mockResolvedValueOnce([{ id: 'trip-1' }])
      .mockResolvedValueOnce([]);
    const scheduler = new TripOverdueSchedulerService(dataSource, tripsService);
    const count = await scheduler.scanAndMarkOverdue(new Date('2026-08-31T18:00:00.000Z'));
    expect(count).toBe(1);
    expect(finalizeOverdueTransitions).toHaveBeenCalledTimes(1);
    expect(finalizeOverdueTransitions).toHaveBeenCalledWith(['trip-1'], expect.any(Date));
  });

  it('is idempotent when the second run finds no IN_PROGRESS rows', async () => {
    query.mockResolvedValue([]);
    const scheduler = new TripOverdueSchedulerService(dataSource, tripsService);
    await scheduler.scanAndMarkOverdue();
    await scheduler.scanAndMarkOverdue();
    expect(finalizeOverdueTransitions).not.toHaveBeenCalled();
  });

  it('recovers unfinalized OVERDUE rows without re-claiming already processed trips', async () => {
    query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'trip-recovered' }]);
    const scheduler = new TripOverdueSchedulerService(dataSource, tripsService);
    await scheduler.scanAndMarkOverdue();
    expect(query.mock.calls[1][1][1]).toBe(OVERDUE_ISSUE_TYPE);
    expect(finalizeOverdueTransitions).toHaveBeenCalledWith(['trip-recovered'], expect.any(Date));
  });
});
