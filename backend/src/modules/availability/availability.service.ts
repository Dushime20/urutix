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
import { Load } from '../../entities/load.entity';
import {
  TruckAvailabilityEngine,
  EffectiveAvailabilityWindow,
  OperationalTripPhase,
} from './services/truck-availability.engine';
import { DriverSchedulingGuardService } from './services/driver-scheduling-guard.service';

export interface ConflictInfo {
  type: 'TRUCK' | 'DRIVER';
  resourceId: string;
  conflictingTripId: string;
  conflictingCargoId: string;
  existingPickup: Date;
  existingDelivery: Date;
  /** Effective window details for audit / UI */
  effectiveWindow?: EffectiveAvailabilityWindow;
  auditReason?: string;
}

export interface LogisticsCheckParams {
  truckId: string;
  driverId?: string;
  pickupDateTime: Date;
  deliveryDateTime: Date;
  tenantId: string;
  /** Load being assigned — used for pickup location feasibility check */
  newLoad?: Load;
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
  /** When set, only return trucks owned by this user (TRUCK_OWNER / FLEET_MANAGER scope) */
  ownerId?: string;
}

export interface DriverAvailabilityQuery {
  pickupDateTime: Date;
  deliveryDateTime: Date;
  tenantId: string;
  /** When set, only return drivers assigned to this truck */
  truckId?: string;
}

/**
 * Active trip statuses — once a shipment reaches one of these, resources are reserved.
 * Resources are released when the trip reaches a terminal status.
 */
const ACTIVE_STATUSES: TripStatus[] = [
  TripStatus.PLANNED,
  TripStatus.IN_PROGRESS,
  TripStatus.DELAYED,
  TripStatus.OVERDUE,
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
    @InjectRepository(Load)
    private readonly loadRepo: Repository<Load>,
    private readonly availabilityEngine: TruckAvailabilityEngine,
    private readonly driverSchedulingGuard: DriverSchedulingGuardService,
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
      // Hard block only for MAINTENANCE / OUT_OF_SERVICE.
      // IN_TRANSIT is time-windowed: conflict only if cargo pickup is before the truck is free.
      const statusConflict = await this.findTruckStatusConflict(
        truckId,
        pickupDateTime,
      );
      if (statusConflict) {
        conflicts.push(statusConflict);
      } else {
        const truckConflict = await this.findTruckConflict(
          truckId, pickupDateTime, deliveryDateTime, excludeTripId,
        );
        if (truckConflict) conflicts.push(truckConflict);
      }
    }

    if (driverId) {
      const driverConflict = await this.driverSchedulingGuard.findDriverConflict({
        driverId,
        pickupDateTime,
        deliveryDateTime,
        tenantId,
        excludeTripId,
      });
      if (driverConflict) {
        conflicts.push({
          type: 'DRIVER',
          resourceId: driverId,
          conflictingTripId: driverConflict.conflictingTripId,
          conflictingCargoId: driverConflict.conflictingCargoId,
          existingPickup: driverConflict.existingPickup,
          existingDelivery: driverConflict.existingDelivery,
          effectiveWindow: driverConflict.effectiveWindow,
          auditReason:
            driverConflict.conflictType === 'CONCURRENT_EXECUTION'
              ? 'Driver is executing an active trip and cannot be double-booked.'
              : `Driver reserved for ${driverConflict.conflictingTripStatus} trip schedule.`,
        });
      }
    }

    return conflicts;
  }

  /**
   * Status gate for bidding/matching:
   * - MAINTENANCE / OUT_OF_SERVICE → always unavailable
   * - IN_TRANSIT → unavailable only if cargo pickup is before the current trip ends
   *   (i.e. shipping time must be after estimatedAvailableTime / trip planned end)
   */
  private async findTruckStatusConflict(
    truckId: string,
    pickupDateTime: Date,
  ): Promise<ConflictInfo | null> {
    const truck = await this.truckRepo.findOne({ where: { id: truckId } });
    if (!truck) return null;

    if (
      truck.status === VehicleStatus.MAINTENANCE ||
      truck.status === VehicleStatus.OUT_OF_SERVICE
    ) {
      const now = new Date();
      return {
        type: 'TRUCK',
        resourceId: truckId,
        conflictingTripId: truck.currentTripId || 'status-block',
        conflictingCargoId: truck.status,
        existingPickup: now,
        existingDelivery: now,
        auditReason: `Truck is ${truck.status} and unavailable for assignment.`,
      };
    }

    if (truck.status !== VehicleStatus.IN_TRANSIT) {
      return null;
    }

    let currentTrip: Trip | null = null;
    let currentLoad: Load | null = null;

    if (truck.currentTripId) {
      currentTrip = await this.tripRepo.findOne({ where: { id: truck.currentTripId } });
      if (currentTrip?.loadId) {
        currentLoad = await this.loadRepo.findOne({ where: { id: currentTrip.loadId } });
      }
    }

    const effectiveWindow = this.availabilityEngine.resolveEffectiveWindow(
      currentTrip,
      currentLoad,
    );

    // Trip completed early — truck is free immediately at actual completion
    if (!effectiveWindow.isBlocking) {
      const freeFrom = this.availabilityEngine.resolveTruckFreeTime(
        truck,
        currentTrip,
        currentLoad,
      );
      if (freeFrom && new Date(pickupDateTime).getTime() >= freeFrom.getTime()) {
        return null;
      }
    }

    const freeFrom =
      this.availabilityEngine.resolveTruckFreeTime(truck, currentTrip, currentLoad) ||
      effectiveWindow.deliveryDateTime;

    if (new Date(pickupDateTime).getTime() >= freeFrom.getTime()) {
      return null;
    }

    const overdue = currentTrip?.status === TripStatus.OVERDUE;
    if (overdue) {
      return {
        type: 'TRUCK',
        resourceId: truckId,
        conflictingTripId: truck.currentTripId || 'status-block',
        conflictingCargoId: currentLoad?.id || VehicleStatus.IN_TRANSIT,
        existingPickup: effectiveWindow.pickupDateTime,
        existingDelivery: freeFrom,
        effectiveWindow,
        auditReason:
          'Truck is assigned to an overdue trip and remains unavailable until that trip is completed.',
      };
    }

    return {
      type: 'TRUCK',
      resourceId: truckId,
      conflictingTripId: truck.currentTripId || 'status-block',
      conflictingCargoId: currentLoad?.id || VehicleStatus.IN_TRANSIT,
      existingPickup: effectiveWindow.pickupDateTime,
      existingDelivery: freeFrom,
      effectiveWindow,
      auditReason:
        effectiveWindow.timeSource === 'ACTUAL'
          ? `Truck committed until actual completion at ${freeFrom.toISOString()}.`
          : `Truck in transit — estimated free after ${freeFrom.toISOString()}.`,
    };
  }

  private async findTruckConflict(
    truckId: string,
    pickupDateTime: Date,
    deliveryDateTime: Date,
    excludeTripId?: string,
  ): Promise<ConflictInfo | null> {
    const activeReservations = await this.reservationRepo.find({
      where: { truckId, status: ReservationStatus.ACTIVE },
    });

    for (const reservation of activeReservations) {
      if (excludeTripId && reservation.tripId === excludeTripId) continue;

      const [trip, load] = await Promise.all([
        this.tripRepo.findOne({ where: { id: reservation.tripId } }),
        this.loadRepo.findOne({ where: { id: reservation.cargoId } }),
      ]);

      // Auto-release stale reservations for completed/cancelled trips
      if (this.availabilityEngine.shouldReleaseStaleReservation(trip, load)) {
        await this.releaseReservation(
          reservation.tripId,
          'Auto-released: trip completed or cancelled — truck now available',
        );
        continue;
      }

      const effectiveWindow = this.availabilityEngine.resolveEffectiveWindow(
        trip,
        load,
        reservation,
      );

      if (!effectiveWindow.isBlocking) continue;

      if (trip?.status === TripStatus.OVERDUE) {
        return {
          type: 'TRUCK',
          resourceId: truckId,
          conflictingTripId: reservation.tripId,
          conflictingCargoId: reservation.cargoId,
          existingPickup: effectiveWindow.pickupDateTime,
          existingDelivery: effectiveWindow.deliveryDateTime,
          effectiveWindow,
          auditReason: this.buildAuditMessage(effectiveWindow, trip, load),
        };
      }

      const overlaps = this.availabilityEngine.schedulesOverlap(
        effectiveWindow.pickupDateTime,
        effectiveWindow.deliveryDateTime,
        pickupDateTime,
        deliveryDateTime,
      );

      if (overlaps) {
        return {
          type: 'TRUCK',
          resourceId: truckId,
          conflictingTripId: reservation.tripId,
          conflictingCargoId: reservation.cargoId,
          existingPickup: effectiveWindow.pickupDateTime,
          existingDelivery: effectiveWindow.deliveryDateTime,
          effectiveWindow,
          auditReason: this.buildAuditMessage(effectiveWindow, trip, load),
        };
      }
    }

    return null;
  }

  private buildAuditMessage(
    window: EffectiveAvailabilityWindow,
    trip?: Trip | null,
    load?: Load | null,
  ): string {
    const plannedEnd = window.plannedDeliveryDateTime.toISOString();
    const actualEnd = window.actualDeliveryDateTime?.toISOString();
    if (window.operationalPhase === OperationalTripPhase.COMPLETED && actualEnd) {
      return (
        `Previous trip completed at ${actualEnd} (planned delivery was ${plannedEnd}). ` +
        `Truck is available for assignments after actual completion.`
      );
    }
    if (trip?.status === TripStatus.IN_PROGRESS || trip?.status === TripStatus.OVERDUE || load?.status === 'IN_TRANSIT') {
      return (
        `Truck assigned to active trip. ` +
        `Trip completion estimated: ${plannedEnd}` +
        (actualEnd ? `; actual completion: ${actualEnd}` : '') +
        `.`
      );
    }
    return `Truck reserved for planned schedule ${window.plannedPickupDateTime.toISOString()} → ${plannedEnd}.`;
  }

  /**
   * Validates driver assignment against scheduling rules (overlap + single active trip).
   */
  async assertDriverAvailableForAssignment(params: {
    driverId: string;
    pickupDateTime: Date;
    deliveryDateTime: Date;
    tenantId: string;
    excludeTripId?: string;
  }): Promise<void> {
    return this.driverSchedulingGuard.assertDriverAvailableForAssignment(params);
  }

  /**
   * Validates a driver can start a trip (no other IN_PROGRESS trip).
   */
  async assertDriverCanStartTrip(
    driverId: string,
    tripId: string,
    tenantId: string,
  ): Promise<void> {
    return this.driverSchedulingGuard.assertDriverCanStartTrip(driverId, tripId, tenantId);
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

    // Status-based / time-window block
    if (
      c.type === 'TRUCK' &&
      (c.conflictingCargoId === VehicleStatus.IN_TRANSIT ||
        c.conflictingCargoId === VehicleStatus.MAINTENANCE ||
        c.conflictingCargoId === VehicleStatus.OUT_OF_SERVICE)
    ) {
      if (c.conflictingCargoId === VehicleStatus.IN_TRANSIT) {
        const freeAfter = c.existingDelivery
          ? new Date(c.existingDelivery).toISOString().slice(0, 10)
          : 'unknown';
        throw new ConflictException(
          `This truck is currently in transit and will only be free after ${freeAfter}. ` +
          `Choose a cargo shipping time after that date, or pick another truck.`,
        );
      }
      throw new ConflictException(
        `This truck is currently ${c.conflictingCargoId.replace(/_/g, ' ').toLowerCase()} ` +
        `and cannot be used for bidding or matching.`,
      );
    }

    const pickup   = c.existingPickup.toISOString().slice(0, 10);
    const delivery = c.existingDelivery.toISOString().slice(0, 10);

    if (c.type === 'TRUCK') {
      const detail = c.auditReason ? ` ${c.auditReason}` : '';
      throw new ConflictException(
        `This truck is already scheduled for another shipment during the selected transportation period. ` +
        `Conflict: Cargo ${c.conflictingCargoId} — ${pickup} → ${delivery}.${detail} ` +
        `Choose another truck or reschedule.`,
      );
    } else {
      const detail = c.auditReason ? ` ${c.auditReason}` : '';
      const isActiveExecution = c.auditReason?.includes('executing an active trip');
      throw new ConflictException(
        isActiveExecution
          ? `This driver is currently executing another trip and cannot be assigned to overlapping shipments. ` +
            `Conflict: Cargo ${c.conflictingCargoId} — ${pickup} → ${delivery}.${detail} ` +
            `Complete the current trip first, or choose another driver.`
          : `This driver is already assigned to another shipment during the selected transportation period. ` +
            `Conflict: Cargo ${c.conflictingCargoId} — ${pickup} → ${delivery}.${detail} ` +
            `Choose another driver or reschedule.`,
      );
    }
  }

  /**
   * Validates driver rest/hours and physical travel feasibility between shipments.
   */
  async assertLogisticsFeasible(params: LogisticsCheckParams): Promise<void> {
    const { truckId, driverId, pickupDateTime, newLoad } = params;

    if (driverId) {
      const driver = await this.driverRepo.findOne({ where: { id: driverId } });
      const driverCheck = this.availabilityEngine.validateDriverAvailability(
        driver,
        pickupDateTime,
      );
      if (!driverCheck.available) {
        throw new ConflictException(driverCheck.reason);
      }
    }

    const truck = await this.truckRepo.findOne({ where: { id: truckId } });
    if (!truck?.currentTripId || !newLoad) return;

    const currentTrip = await this.tripRepo.findOne({ where: { id: truck.currentTripId } });
    if (!currentTrip) return;

    const previousLoad = await this.loadRepo.findOne({ where: { id: currentTrip.loadId } });
    const previousWindow = this.availabilityEngine.resolveEffectiveWindow(
      currentTrip,
      previousLoad,
    );

    const availableFrom = previousWindow.isBlocking
      ? previousWindow.deliveryDateTime
      : previousWindow.actualDeliveryDateTime ||
        previousWindow.deliveryDateTime ||
        new Date();

    const feasibility = this.availabilityEngine.validateLocationFeasibility(
      this.availabilityEngine.extractDeliveryCoords(previousLoad),
      this.availabilityEngine.extractPickupCoords(newLoad),
      availableFrom,
      pickupDateTime,
    );

    if (!feasibility.feasible) {
      throw new ConflictException(feasibility.reason);
    }
  }

  /**
   * Reconcile reservation window and truck free-time when trip/load status changes.
   * Called on trip start, delivery, completion, cancellation, and schedule changes.
   */
  async reconcileReservationForTrip(tripId: string, reason: string): Promise<void> {
    const trip = await this.tripRepo.findOne({ where: { id: tripId } });
    if (!trip) return;

    const load = trip.loadId
      ? await this.loadRepo.findOne({ where: { id: trip.loadId } })
      : null;

    if (this.availabilityEngine.shouldReleaseStaleReservation(trip, load)) {
      await this.releaseReservation(tripId, reason);
      return;
    }

    const effectiveWindow = this.availabilityEngine.resolveEffectiveWindow(trip, load);
    const reservation = await this.reservationRepo.findOne({
      where: { tripId, status: ReservationStatus.ACTIVE },
    });

    if (reservation && effectiveWindow.isBlocking) {
      reservation.pickupDateTime = effectiveWindow.pickupDateTime;
      reservation.deliveryDateTime = effectiveWindow.deliveryDateTime;
      await this.reservationRepo.save(reservation);
      this.logger.log(
        `Updated reservation for trip ${tripId}: ${reason} — ` +
        `effective window ${effectiveWindow.pickupDateTime.toISOString()} → ${effectiveWindow.deliveryDateTime.toISOString()}`,
      );
    }

    if (trip.truckId && effectiveWindow.isBlocking) {
      await this.truckRepo.update(trip.truckId, {
        estimatedAvailableTime: effectiveWindow.deliveryDateTime,
      });
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
    const { pickupDateTime, deliveryDateTime, tenantId, capacityWeight, truckType, ownerId } = query;

    const busyTruckIds = Array.from(
      await this.getBusyTruckIds(tenantId, pickupDateTime, deliveryDateTime),
    );

    // 2. Query trucks excluding busy ones and unavailable statuses
    const qb = this.truckRepo
      .createQueryBuilder('truck')
      .where('truck.tenantId = :tenantId', { tenantId })
      .andWhere('truck.isActive = true')
      .andWhere('truck.status NOT IN (:...unavailableStatuses)', {
        // IN_TRANSIT trucks can still be selected for future windows that start
        // after the current trip ends; reservation + status time checks enforce that.
        unavailableStatuses: [
          VehicleStatus.MAINTENANCE,
          VehicleStatus.OUT_OF_SERVICE,
        ],
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

    // Scope to a specific owner when the caller is a TRUCK_OWNER / FLEET_MANAGER
    if (ownerId) {
      qb.andWhere('truck.ownerId = :ownerId', { ownerId });
    }

    return qb.getMany();
  }

  /**
   * Returns all drivers in the tenant that are available for the given window.
   * Excludes drivers with an active overlapping reservation,
   * and drivers that are SUSPENDED, INACTIVE, TERMINATED, or ON_LEAVE.
   * When truckId is provided, only drivers assigned to that truck are returned.
   */
  async getAvailableDrivers(query: DriverAvailabilityQuery): Promise<Driver[]> {
    const { pickupDateTime, deliveryDateTime, tenantId, truckId } = query;

    let assignedDriverIds: string[] | null = null;
    if (truckId) {
      const truck = await this.truckRepo.findOne({
        where: { id: truckId, tenantId },
        select: ['id', 'assignedDrivers'],
      });
      if (!truck) {
        return [];
      }
      assignedDriverIds = (Array.isArray(truck.assignedDrivers) ? truck.assignedDrivers : [])
        .map((d: any) => d?.driverId)
        .filter(Boolean);
      if (assignedDriverIds.length === 0) {
        return [];
      }
    }

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

    if (assignedDriverIds) {
      qb.andWhere('driver.id IN (:...assignedDriverIds)', { assignedDriverIds });
    }

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
    const activeReservations = await this.reservationRepo.find({
      where: { tenantId, status: ReservationStatus.ACTIVE },
    });

    const busyIds = new Set<string>();

    for (const reservation of activeReservations) {
      const [trip, load] = await Promise.all([
        this.tripRepo.findOne({ where: { id: reservation.tripId } }),
        this.loadRepo.findOne({ where: { id: reservation.cargoId } }),
      ]);

      if (this.availabilityEngine.shouldReleaseStaleReservation(trip, load)) {
        continue;
      }

      const effectiveWindow = this.availabilityEngine.resolveEffectiveWindow(
        trip,
        load,
        reservation,
      );

      if (!effectiveWindow.isBlocking) continue;

      if (
        this.availabilityEngine.schedulesOverlap(
          effectiveWindow.pickupDateTime,
          effectiveWindow.deliveryDateTime,
          pickupDateTime,
          deliveryDateTime,
        )
      ) {
        busyIds.add(reservation.truckId);
      }
    }

    return busyIds;
  }

  /**
   * Returns IDs of drivers busy during the window.
   */
  async getBusyDriverIds(
    tenantId: string,
    pickupDateTime: Date,
    deliveryDateTime: Date,
  ): Promise<Set<string>> {
    const activeReservations = await this.reservationRepo.find({
      where: { tenantId, status: ReservationStatus.ACTIVE },
    });

    const busyIds = new Set<string>();

    for (const reservation of activeReservations) {
      if (!reservation.driverId) continue;

      const [trip, load] = await Promise.all([
        this.tripRepo.findOne({ where: { id: reservation.tripId } }),
        this.loadRepo.findOne({ where: { id: reservation.cargoId } }),
      ]);

      if (this.availabilityEngine.shouldReleaseStaleReservation(trip, load)) {
        continue;
      }

      const effectiveWindow = this.availabilityEngine.resolveEffectiveWindow(
        trip,
        load,
        reservation,
      );

      if (!effectiveWindow.isBlocking) continue;

      if (
        this.availabilityEngine.schedulesOverlap(
          effectiveWindow.pickupDateTime,
          effectiveWindow.deliveryDateTime,
          pickupDateTime,
          deliveryDateTime,
        )
      ) {
        busyIds.add(reservation.driverId);
      }
    }

    return busyIds;
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
