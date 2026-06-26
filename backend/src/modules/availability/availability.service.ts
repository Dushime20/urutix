import {
  Injectable,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import {
  ShipmentReservation,
  ReservationStatus,
} from '../../entities/shipment-reservation.entity';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { Truck, VehicleStatus } from '../../entities/truck.entity';
import { Driver, DriverStatus } from '../../entities/driver.entity';

export interface ConflictInfo {
  type: 'TRUCK' | 'DRIVER';
  resourceId: string;
  conflictingTripId: string;
  conflictingCargoId: string;
  existingPickup: Date;
  existingDelivery: Date;
}

export interface AvailabilityCheckParams {
  truckId?: string;
  driverId?: string;
  pickupDateTime: Date;
  deliveryDateTime: Date;
  /** Exclude this tripId when re-checking an existing reservation (e.g. rescheduling) */
  excludeTripId?: string;
  tenantId: string;
}

export interface TruckAvailabilityQuery {
  pickupDateTime: Date;
  deliveryDateTime: Date;
  tenantId: string;
  capacityWeight?: number;
  truckType?: string;
}

export interface DriverAvailabilityQuery {
  pickupDateTime: Date;
  deliveryDateTime: Date;
  tenantId: string;
}

/**
 * Active trip statuses — once a shipment reaches one of these, resources are reserved.
 * Resources are released when the trip reaches a terminal status.
 */
const ACTIVE_STATUSES: TripStatus[] = [
  TripStatus.PLANNED,
  TripStatus.IN_PROGRESS,
  TripStatus.DELAYED,
];

const TERMINAL_STATUSES: TripStatus[] = [
  TripStatus.COMPLETED,
  TripStatus.CANCELLED,
];

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(
    @InjectRepository(ShipmentReservation)
    private readonly reservationRepo: Repository<ShipmentReservation>,
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Truck)
    private readonly truckRepo: Repository<Truck>,
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
  ) {}

  // ─── Core Overlap Query ─────────────────────────────────────────────────────

  /**
   * Checks whether any ACTIVE reservation for the given truck or driver
   * overlaps with the requested window.
   *
   * Overlap condition:  existing.pickup < newDelivery  AND  existing.delivery > newPickup
   */
  async findConflicts(params: AvailabilityCheckParams): Promise<ConflictInfo[]> {
    const { truckId, driverId, pickupDateTime, deliveryDateTime, excludeTripId, tenantId } = params;

    if (!truckId && !driverId) return [];

    const conflicts: ConflictInfo[] = [];

    if (truckId) {
      const truckConflict = await this.findTruckConflict(
        truckId, pickupDateTime, deliveryDateTime, excludeTripId,
      );
      if (truckConflict) conflicts.push(truckConflict);
    }

    if (driverId) {
      const driverConflict = await this.findDriverConflict(
        driverId, pickupDateTime, deliveryDateTime, excludeTripId,
      );
      if (driverConflict) conflicts.push(driverConflict);
    }

    return conflicts;
  }

  private async findTruckConflict(
    truckId: string,
    pickupDateTime: Date,
    deliveryDateTime: Date,
    excludeTripId?: string,
  ): Promise<ConflictInfo | null> {
    const qb = this.reservationRepo
      .createQueryBuilder('r')
      .where('r.truckId = :truckId', { truckId })
      .andWhere('r.status = :status', { status: ReservationStatus.ACTIVE })
      // Overlap condition
      .andWhere('r.pickupDateTime < :deliveryDateTime', { deliveryDateTime })
      .andWhere('r.deliveryDateTime > :pickupDateTime', { pickupDateTime });

    if (excludeTripId) {
      qb.andWhere('r.tripId != :excludeTripId', { excludeTripId });
    }

    const conflict = await qb.getOne();
    if (!conflict) return null;

    return {
      type: 'TRUCK',
      resourceId: truckId,
      conflictingTripId: conflict.tripId,
      conflictingCargoId: conflict.cargoId,
      existingPickup: conflict.pickupDateTime,
      existingDelivery: conflict.deliveryDateTime,
    };
  }

  private async findDriverConflict(
    driverId: string,
    pickupDateTime: Date,
    deliveryDateTime: Date,
    excludeTripId?: string,
  ): Promise<ConflictInfo | null> {
    const qb = this.reservationRepo
      .createQueryBuilder('r')
      .where('r.driverId = :driverId', { driverId })
      .andWhere('r.status = :status', { status: ReservationStatus.ACTIVE })
      .andWhere('r.pickupDateTime < :deliveryDateTime', { deliveryDateTime })
      .andWhere('r.deliveryDateTime > :pickupDateTime', { pickupDateTime });

    if (excludeTripId) {
      qb.andWhere('r.tripId != :excludeTripId', { excludeTripId });
    }

    const conflict = await qb.getOne();
    if (!conflict) return null;

    return {
      type: 'DRIVER',
      resourceId: driverId,
      conflictingTripId: conflict.tripId,
      conflictingCargoId: conflict.cargoId,
      existingPickup: conflict.pickupDateTime,
      existingDelivery: conflict.deliveryDateTime,
    };
  }

  // ─── Assertion helper (throws if conflict found) ─────────────────────────────

  /**
   * Throws ConflictException with a descriptive message if any conflict exists.
   * Use this in BiddingService and TripsService before creating/accepting.
   */
  async assertNoConflict(params: AvailabilityCheckParams): Promise<void> {
    const conflicts = await this.findConflicts(params);
    if (conflicts.length === 0) return;

    const c = conflicts[0];
    const pickup   = c.existingPickup.toISOString().slice(0, 10);
    const delivery = c.existingDelivery.toISOString().slice(0, 10);

    if (c.type === 'TRUCK') {
      throw new ConflictException(
        `This truck is already scheduled for another shipment during the selected transportation period. ` +
        `Conflict: Cargo ${c.conflictingCargoId} — ${pickup} → ${delivery}. ` +
        `Choose another truck or reschedule.`,
      );
    } else {
      throw new ConflictException(
        `This driver is already assigned to another shipment during the selected transportation period. ` +
        `Conflict: Cargo ${c.conflictingCargoId} — ${pickup} → ${delivery}. ` +
        `Choose another driver or reschedule.`,
      );
    }
  }

  // ─── Reservation lifecycle ───────────────────────────────────────────────────

  async createReservation(
    tenantId: string,
    tripId: string,
    cargoId: string,
    truckId: string,
    driverId: string | null,
    pickupDateTime: Date,
    deliveryDateTime: Date,
  ): Promise<ShipmentReservation> {
    // Release any previous REPLACED reservation for this trip
    await this.reservationRepo.update(
      { tripId, status: ReservationStatus.ACTIVE },
      { status: ReservationStatus.REPLACED, statusReason: 'Superseded by new reservation' },
    );

    const reservation = this.reservationRepo.create({
      tenantId,
      tripId,
      cargoId,
      truckId,
      driverId,
      pickupDateTime,
      deliveryDateTime,
      status: ReservationStatus.ACTIVE,
    });

    return this.reservationRepo.save(reservation);
  }

  async releaseReservation(tripId: string, reason: string): Promise<void> {
    await this.reservationRepo.update(
      { tripId, status: ReservationStatus.ACTIVE },
      { status: ReservationStatus.RELEASED, statusReason: reason },
    );
    this.logger.log(`Released reservation for trip ${tripId}: ${reason}`);
  }

  async updateReservationDates(
    tripId: string,
    pickupDateTime: Date,
    deliveryDateTime: Date,
    tenantId: string,
    cargoId: string,
    truckId: string,
    driverId: string | null,
  ): Promise<ShipmentReservation> {
    // Check for conflicts excluding the current trip
    await this.assertNoConflict({ truckId, driverId, pickupDateTime, deliveryDateTime, excludeTripId: tripId, tenantId });

    const existing = await this.reservationRepo.findOne({
      where: { tripId, status: ReservationStatus.ACTIVE },
    });

    if (existing) {
      existing.pickupDateTime  = pickupDateTime;
      existing.deliveryDateTime = deliveryDateTime;
      existing.truckId  = truckId;
      existing.driverId = driverId;
      return this.reservationRepo.save(existing);
    }

    // If no existing active reservation, create one
    return this.createReservation(tenantId, tripId, cargoId, truckId, driverId, pickupDateTime, deliveryDateTime);
  }

  // ─── Availability Queries ────────────────────────────────────────────────────

  /**
   * Returns all trucks in the tenant that are available for the given window.
   * Excludes trucks that have an ACTIVE reservation overlapping the period,
   * and trucks that are MAINTENANCE or OUT_OF_SERVICE.
   */
  async getAvailableTrucks(query: TruckAvailabilityQuery): Promise<Truck[]> {
    const { pickupDateTime, deliveryDateTime, tenantId, capacityWeight, truckType } = query;

    // 1. Find all truck IDs that have a conflicting reservation
    const busyReservations = await this.reservationRepo
      .createQueryBuilder('r')
      .select('r.truckId', 'truckId')
      .where('r.tenantId = :tenantId', { tenantId })
      .andWhere('r.status = :status', { status: ReservationStatus.ACTIVE })
      .andWhere('r.pickupDateTime < :deliveryDateTime', { deliveryDateTime })
      .andWhere('r.deliveryDateTime > :pickupDateTime', { pickupDateTime })
      .getRawMany<{ truckId: string }>();

    const busyTruckIds = busyReservations.map(r => r.truckId);

    // 2. Query trucks excluding busy ones and unavailable statuses
    const qb = this.truckRepo
      .createQueryBuilder('truck')
      .where('truck.tenantId = :tenantId', { tenantId })
      .andWhere('truck.isActive = true')
      .andWhere('truck.status NOT IN (:...unavailableStatuses)', {
        unavailableStatuses: [VehicleStatus.MAINTENANCE, VehicleStatus.OUT_OF_SERVICE],
      });

    if (busyTruckIds.length > 0) {
      qb.andWhere('truck.id NOT IN (:...busyTruckIds)', { busyTruckIds });
    }

    if (capacityWeight) {
      qb.andWhere('truck.capacityWeight >= :capacityWeight', { capacityWeight });
    }

    if (truckType) {
      qb.andWhere('truck.truckType = :truckType', { truckType });
    }

    return qb.getMany();
  }

  /**
   * Returns all drivers in the tenant that are available for the given window.
   * Excludes drivers with an active overlapping reservation,
   * and drivers that are SUSPENDED, INACTIVE, TERMINATED, or ON_LEAVE.
   */
  async getAvailableDrivers(query: DriverAvailabilityQuery): Promise<Driver[]> {
    const { pickupDateTime, deliveryDateTime, tenantId } = query;

    const busyReservations = await this.reservationRepo
      .createQueryBuilder('r')
      .select('r.driverId', 'driverId')
      .where('r.tenantId = :tenantId', { tenantId })
      .andWhere('r.status = :status', { status: ReservationStatus.ACTIVE })
      .andWhere('r.driverId IS NOT NULL')
      .andWhere('r.pickupDateTime < :deliveryDateTime', { deliveryDateTime })
      .andWhere('r.deliveryDateTime > :pickupDateTime', { pickupDateTime })
      .getRawMany<{ driverId: string }>();

    const busyDriverIds = busyReservations.map(r => r.driverId).filter(Boolean);

    const qb = this.driverRepo
      .createQueryBuilder('driver')
      .where('driver.tenantId = :tenantId', { tenantId })
      .andWhere('driver.status NOT IN (:...inactiveStatuses)', {
        inactiveStatuses: [
          DriverStatus.SUSPENDED,
          DriverStatus.INACTIVE,
          DriverStatus.TERMINATED,
          DriverStatus.ON_LEAVE,
        ],
      });

    if (busyDriverIds.length > 0) {
      qb.andWhere('driver.id NOT IN (:...busyDriverIds)', { busyDriverIds });
    }

    return qb.getMany();
  }

  /**
   * Returns IDs of trucks busy during the window.
   * Used by Smart Matching to pre-filter before running ranking.
   */
  async getBusyTruckIds(
    tenantId: string,
    pickupDateTime: Date,
    deliveryDateTime: Date,
  ): Promise<Set<string>> {
    const rows = await this.reservationRepo
      .createQueryBuilder('r')
      .select('r.truckId', 'truckId')
      .where('r.tenantId = :tenantId', { tenantId })
      .andWhere('r.status = :status', { status: ReservationStatus.ACTIVE })
      .andWhere('r.pickupDateTime < :deliveryDateTime', { deliveryDateTime })
      .andWhere('r.deliveryDateTime > :pickupDateTime', { pickupDateTime })
      .getRawMany<{ truckId: string }>();

    return new Set(rows.map(r => r.truckId));
  }

  /**
   * Returns IDs of drivers busy during the window.
   */
  async getBusyDriverIds(
    tenantId: string,
    pickupDateTime: Date,
    deliveryDateTime: Date,
  ): Promise<Set<string>> {
    const rows = await this.reservationRepo
      .createQueryBuilder('r')
      .select('r.driverId', 'driverId')
      .where('r.tenantId = :tenantId', { tenantId })
      .andWhere('r.status = :status', { status: ReservationStatus.ACTIVE })
      .andWhere('r.driverId IS NOT NULL')
      .andWhere('r.pickupDateTime < :deliveryDateTime', { deliveryDateTime })
      .andWhere('r.deliveryDateTime > :pickupDateTime', { pickupDateTime })
      .getRawMany<{ driverId: string }>();

    return new Set(rows.map(r => r.driverId).filter(Boolean));
  }

  // ─── Resource utilization summary ───────────────────────────────────────────

  async getUtilizationSummary(tenantId: string): Promise<{
    availableTrucks: number;
    busyTrucks: number;
    availableDrivers: number;
    busyDrivers: number;
    upcomingTrips: number;
    currentTrips: number;
  }> {
    const now = new Date();
    const dayEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // next 7 days

    const [totalTrucks, totalDrivers] = await Promise.all([
      this.truckRepo.count({ where: { tenantId, isActive: true } }),
      this.driverRepo.count({ where: { tenantId } }),
    ]);

    const busyTruckIds = await this.getBusyTruckIds(tenantId, now, dayEnd);
    const busyDriverIds = await this.getBusyDriverIds(tenantId, now, dayEnd);

    const [currentTrips, upcomingTrips] = await Promise.all([
      this.tripRepo.count({ where: { tenantId, status: TripStatus.IN_PROGRESS } }),
      this.tripRepo.count({ where: { tenantId, status: TripStatus.PLANNED } }),
    ]);

    return {
      availableTrucks:  totalTrucks  - busyTruckIds.size,
      busyTrucks:       busyTruckIds.size,
      availableDrivers: totalDrivers - busyDriverIds.size,
      busyDrivers:      busyDriverIds.size,
      upcomingTrips,
      currentTrips,
    };
  }

  // ─── Backfill helper ────────────────────────────────────────────────────────

  /**
   * Called once to seed reservations from existing PLANNED / IN_PROGRESS trips
   * that were created before this feature was deployed.
   */
  async backfillReservationsFromTrips(tenantId: string): Promise<number> {
    const activeTrips = await this.tripRepo.find({
      where: { tenantId, status: In(ACTIVE_STATUSES) },
    });

    let created = 0;
    for (const trip of activeTrips) {
      const existing = await this.reservationRepo.findOne({
        where: { tripId: trip.id, status: ReservationStatus.ACTIVE },
      });
      if (existing) continue;

      if (!trip.plannedStartTime || !trip.plannedEndTime) continue;

      await this.reservationRepo.save(
        this.reservationRepo.create({
          tenantId,
          tripId: trip.id,
          cargoId: trip.loadId,
          truckId: trip.truckId,
          driverId: trip.driverId || null,
          pickupDateTime: trip.plannedStartTime,
          deliveryDateTime: trip.plannedEndTime,
          status: ReservationStatus.ACTIVE,
        }),
      );
      created++;
    }

    this.logger.log(`Backfill complete for tenant ${tenantId}: created ${created} reservations`);
    return created;
  }
}
