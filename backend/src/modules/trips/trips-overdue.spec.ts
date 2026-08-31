import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TripStatus } from '../../entities/trip.entity';
import { UserRole } from '../../entities/user.entity';
import { TripsService } from './trips.service';
import { OVERDUE_ISSUE_TYPE } from './trip-overdue.util';

function createService(overrides: Record<string, any> = {}) {
  const tripRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
    createQueryBuilder: jest.fn(),
  };
  const userRepository = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn() };
  const loadRepository = { findOne: jest.fn() };
  const truckRepository = { findOne: jest.fn(), update: jest.fn(), save: jest.fn() };
  const driverRepository = { findOne: jest.fn() };
  const eventEmitter = { emit: jest.fn() };
  const notificationService = { createNotification: jest.fn() };
  const trackingGateway = { broadcastTripStatus: jest.fn().mockResolvedValue(undefined) };

  const service = new TripsService(
    tripRepository as any,
    loadRepository as any,
    truckRepository as any,
    driverRepository as any,
    userRepository as any,
    {} as any,
    {} as any,
    {} as any,
    notificationService as any,
    {} as any,
    eventEmitter as any,
    {} as any,
    { assertPreTripInspectionApprovedByLoadId: jest.fn() } as any,
    undefined,
    undefined,
    trackingGateway as any,
    undefined,
  );

  Object.assign(service, overrides);
  return {
    service,
    tripRepository,
    userRepository,
    eventEmitter,
    trackingGateway,
  };
}

describe('TripsService overdue workflow', () => {
  it('lists overdue trips only for the requested tenant', async () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'trip-a',
          tenantId: 'tenant-a',
          status: TripStatus.OVERDUE,
          plannedEndTime: new Date('2026-08-31T16:00:00.000Z'),
        },
      ]),
    };
    const { service, tripRepository } = createService();
    tripRepository.createQueryBuilder.mockReturnValue(qb);

    const trips = await service.getOverdueTrips('tenant-a');
    expect(qb.where).toHaveBeenCalledWith('trip.tenantId = :tenantId', { tenantId: 'tenant-a' });
    expect(qb.andWhere).toHaveBeenCalledWith('trip.status = :status', { status: TripStatus.OVERDUE });
    expect(trips).toHaveLength(1);
    expect(trips[0].tenantId).toBe('tenant-a');
  });

  it('scopes overdue trips for a broker to their loads', async () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    const { service, tripRepository } = createService();
    tripRepository.createQueryBuilder.mockReturnValue(qb);
    await service.getOverdueTrips('tenant-a', { userId: 'broker-1', role: UserRole.BROKER });
    expect(qb.andWhere).toHaveBeenCalledWith('load.brokerId = :userId', { userId: 'broker-1' });
  });

  it('rejects delay reports from a driver who is not assigned', async () => {
    const { service, tripRepository } = createService();
    tripRepository.manager.transaction.mockImplementation(async (cb: any) => {
      const manager = {
        createQueryBuilder: () => ({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue({
            id: 'trip-1',
            tenantId: 'tenant-a',
            status: TripStatus.OVERDUE,
            driver: { userId: 'other-driver' },
            driverId: 'other-driver',
          }),
        }),
      };
      return cb(manager);
    });

    await expect(
      service.reportDelay(
        'trip-1',
        {
          delayReason: 'Traffic',
          newEstimatedArrival: '2026-09-01T08:00:00.000Z',
        } as any,
        'tenant-a',
        { userId: 'driver-1', role: UserRole.DRIVER },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('completeTrip refuses cancelled trips', async () => {
    const { service, tripRepository } = createService();
    tripRepository.manager.transaction.mockImplementation(async (cb: any) => {
      const manager = {
        createQueryBuilder: () => ({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue({
            id: 'trip-1',
            tenantId: 'tenant-a',
            status: TripStatus.CANCELLED,
            plannedEndTime: new Date(),
          }),
        }),
        save: jest.fn(),
        getRepository: jest.fn(),
      };
      return cb(manager);
    });

    await expect(service.completeTrip('trip-1', 'tenant-a')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('finalizeOverdueTransitions is idempotent and skips completed races', async () => {
    const { service, tripRepository, eventEmitter } = createService();
    const overdueTrip = {
      id: 'trip-1',
      tenantId: 'tenant-a',
      status: TripStatus.OVERDUE,
      plannedEndTime: new Date('2026-08-31T16:00:00.000Z'),
      issuesReported: [] as any[],
      loadId: 'load-1',
    };
    let savedIssues: any[] | null = null;

    tripRepository.manager.transaction
      .mockImplementationOnce(async (cb: any) => {
        const manager = {
          createQueryBuilder: () => ({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            setLock: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue({ ...overdueTrip, issuesReported: [] }),
          }),
          save: jest.fn().mockImplementation((_entity, trip) => {
            savedIssues = trip.issuesReported;
            return trip;
          }),
          getRepository: () => ({ create: jest.fn((x) => x), save: jest.fn() }),
        };
        return cb(manager);
      })
      .mockImplementationOnce(async (cb: any) => {
        const manager = {
          createQueryBuilder: () => ({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            setLock: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue({
              ...overdueTrip,
              issuesReported: savedIssues || [{ type: OVERDUE_ISSUE_TYPE }],
            }),
          }),
          save: jest.fn(),
          getRepository: () => ({ create: jest.fn((x) => x), save: jest.fn() }),
        };
        return cb(manager);
      })
      .mockImplementationOnce(async (cb: any) => {
        const manager = {
          createQueryBuilder: () => ({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            setLock: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
          }),
        };
        return cb(manager);
      });

    await service.finalizeOverdueTransitions(['trip-1']);
    await service.finalizeOverdueTransitions(['trip-1']);
    await service.finalizeOverdueTransitions(['trip-1']);

    expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
    expect(eventEmitter.emit).toHaveBeenCalledWith('trip.overdue', expect.objectContaining({ tripId: 'trip-1' }));
  });
});
