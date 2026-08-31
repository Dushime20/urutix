import { Injectable } from '@nestjs/common';
import { Trip, TripStatus } from '../../../entities/trip.entity';
import { isIndefinitelyOccupyingStatus } from '../../trips/trip-overdue.util';
import { Load, LoadStatus } from '../../../entities/load.entity';
import { ShipmentReservation } from '../../../entities/shipment-reservation.entity';
import { Truck, VehicleStatus } from '../../../entities/truck.entity';
import { Driver, DriverStatus } from '../../../entities/driver.entity';

/** Operational phases mapped from trip + load status for conflict resolution. */
export enum OperationalTripPhase {
  NOT_STARTED = 'NOT_STARTED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export type AvailabilityTimeSource = 'PLANNED' | 'ACTUAL' | 'ESTIMATED';

export interface EffectiveAvailabilityWindow {
  pickupDateTime: Date;
  deliveryDateTime: Date;
  plannedPickupDateTime: Date;
  plannedDeliveryDateTime: Date;
  actualPickupDateTime?: Date;
  actualDeliveryDateTime?: Date;
  tripStatus?: TripStatus;
  loadStatus?: LoadStatus;
  operationalPhase: OperationalTripPhase;
  /** When false the truck is free — completed/cancelled trips must not block future bids. */
  isBlocking: boolean;
  timeSource: AvailabilityTimeSource;
}

export interface ScheduleComparisonAudit {
  conflictReason: string;
  plannedPickup: string;
  plannedDelivery: string;
  actualPickup?: string;
  actualDelivery?: string;
  tripStatus?: string;
  loadStatus?: string;
  truckStatus?: string;
  operationalPhase: OperationalTripPhase;
  timeSource: AvailabilityTimeSource;
  decisionTimestamp: string;
}

export interface LogisticsFeasibilityResult {
  feasible: boolean;
  reason?: string;
  travelDistanceKm?: number;
  travelDurationMinutes?: number;
  earliestArrival?: Date;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Load statuses that keep a truck committed while the shipment is underway. */
const ACTIVE_LOAD_STATUSES: LoadStatus[] = [
  LoadStatus.ASSIGNED,
  LoadStatus.LOADED,
  LoadStatus.IN_TRANSIT,
  LoadStatus.PENDING_CONFIRMATION,
];

/** Trip statuses where the truck is still committed to the shipment. */
const ACTIVE_TRIP_STATUSES: TripStatus[] = [
  TripStatus.PLANNED,
  TripStatus.IN_PROGRESS,
  TripStatus.DELAYED,
  TripStatus.OVERDUE,
];

const TERMINAL_TRIP_STATUSES: TripStatus[] = [
  TripStatus.COMPLETED,
  TripStatus.CANCELLED,
];

const TERMINAL_LOAD_STATUSES: LoadStatus[] = [
  LoadStatus.DELIVERED,
  LoadStatus.COMPLETED,
  LoadStatus.CANCELLED,
  LoadStatus.CLOSED,
];

/** Minimum rest hours before a driver can start a new trip (HOS default). */
const MIN_DRIVER_REST_HOURS = 8;
const MAX_CONSECUTIVE_DRIVING_HOURS = 11;
/** Average truck road speed for deadhead travel estimates (km/h). */
const DEFAULT_TRUCK_SPEED_KMH = 55;

@Injectable()
export class TruckAvailabilityEngine {
  /**
   * Standard interval overlap: any intersection of pickup/delivery windows.
   */
  schedulesOverlap(
    pickupA: Date,
    deliveryA: Date,
    pickupB: Date,
    deliveryB: Date,
  ): boolean {
    const aStart = new Date(pickupA).getTime();
    const aEnd = new Date(deliveryA).getTime();
    const bStart = new Date(pickupB).getTime();
    const bEnd = new Date(deliveryB).getTime();
    return aStart < bEnd && bStart < aEnd;
  }

  /**
   * Returns true when a load status indicates the truck is still committed.
   */
  isLoadStatusBlocking(status?: LoadStatus): boolean {
    if (!status) return false;
    return ACTIVE_LOAD_STATUSES.includes(status);
  }

  /**
   * Returns true when a trip status indicates the truck is still committed.
   */
  isTripStatusBlocking(status?: TripStatus): boolean {
    if (!status) return false;
    return ACTIVE_TRIP_STATUSES.includes(status);
  }

  resolveOperationalPhase(trip?: Trip | null, load?: Load | null): OperationalTripPhase {
    if (trip?.status === TripStatus.CANCELLED || load?.status === LoadStatus.CANCELLED) {
      return OperationalTripPhase.CANCELLED;
    }
    if (
      trip?.status === TripStatus.COMPLETED ||
      load?.status === LoadStatus.DELIVERED ||
      load?.status === LoadStatus.COMPLETED ||
      load?.status === LoadStatus.CLOSED
    ) {
      return OperationalTripPhase.COMPLETED;
    }
    if (
      this.isTripStatusBlocking(trip?.status) &&
      (this.isLoadStatusBlocking(load?.status) ||
        trip?.status === TripStatus.IN_PROGRESS ||
        trip?.status === TripStatus.OVERDUE ||
        trip?.status === TripStatus.DELAYED)
    ) {
      return OperationalTripPhase.ACTIVE;
    }
    if (trip?.status === TripStatus.PLANNED || this.isLoadStatusBlocking(load?.status)) {
      return OperationalTripPhase.NOT_STARTED;
    }
    return OperationalTripPhase.NOT_STARTED;
  }

  /**
   * Resolve the effective availability window for a trip/load/reservation combination.
   *
   * Before trip starts → planned schedule.
   * During active trip  → actual start + estimated/planned end.
   * After completion    → actual times; isBlocking = false.
   */
  resolveEffectiveWindow(
    trip?: Trip | null,
    load?: Load | null,
    reservation?: ShipmentReservation | null,
  ): EffectiveAvailabilityWindow {
    const plannedPickup = new Date(
      trip?.plannedStartTime ||
        load?.pickupDate ||
        reservation?.pickupDateTime ||
        new Date(),
    );
    const plannedDelivery = new Date(
      trip?.plannedEndTime ||
        load?.deliveryDate ||
        reservation?.deliveryDateTime ||
        new Date(plannedPickup.getTime() + 7 * 24 * 60 * 60 * 1000),
    );

    const actualPickup = trip?.actualStartTime
      ? new Date(trip.actualStartTime)
      : this.extractActualPickupFromLoad(load);
    const actualDelivery = trip?.actualEndTime
      ? new Date(trip.actualEndTime)
      : trip?.completedAt
        ? new Date(trip.completedAt)
        : this.extractActualDeliveryFromLoad(load);

    const phase = this.resolveOperationalPhase(trip, load);

    if (phase === OperationalTripPhase.COMPLETED) {
      const freeFrom = actualDelivery || actualPickup || plannedDelivery;
      return {
        pickupDateTime: actualPickup || plannedPickup,
        deliveryDateTime: freeFrom,
        plannedPickupDateTime: plannedPickup,
        plannedDeliveryDateTime: plannedDelivery,
        actualPickupDateTime: actualPickup,
        actualDeliveryDateTime: actualDelivery,
        tripStatus: trip?.status,
        loadStatus: load?.status,
        operationalPhase: phase,
        isBlocking: false,
        timeSource: 'ACTUAL',
      };
    }

    if (phase === OperationalTripPhase.CANCELLED) {
      return {
        pickupDateTime: plannedPickup,
        deliveryDateTime: plannedDelivery,
        plannedPickupDateTime: plannedPickup,
        plannedDeliveryDateTime: plannedDelivery,
        tripStatus: trip?.status,
        loadStatus: load?.status,
        operationalPhase: phase,
        isBlocking: false,
        timeSource: 'PLANNED',
      };
    }

    if (phase === OperationalTripPhase.ACTIVE) {
      const effectivePickup = actualPickup || plannedPickup;
      // OVERDUE trips occupy the truck until completed — planned end is not a free-after time.
      const effectiveDelivery = isIndefinitelyOccupyingStatus(trip?.status)
        ? new Date('9999-12-31T23:59:59.000Z')
        : new Date(
            trip?.estimatedEndTime ||
              trip?.estimatedArrival ||
              trip?.eta ||
              plannedDelivery,
          );
      return {
        pickupDateTime: effectivePickup,
        deliveryDateTime: effectiveDelivery,
        plannedPickupDateTime: plannedPickup,
        plannedDeliveryDateTime: plannedDelivery,
        actualPickupDateTime: actualPickup,
        tripStatus: trip?.status,
        loadStatus: load?.status,
        operationalPhase: phase,
        isBlocking: true,
        timeSource: actualPickup ? 'ACTUAL' : 'ESTIMATED',
      };
    }

    // NOT_STARTED — use planned schedule; truck is reserved
    return {
      pickupDateTime: plannedPickup,
      deliveryDateTime: plannedDelivery,
      plannedPickupDateTime: plannedPickup,
      plannedDeliveryDateTime: plannedDelivery,
      tripStatus: trip?.status,
      loadStatus: load?.status,
      operationalPhase: phase,
      isBlocking: true,
      timeSource: 'PLANNED',
    };
  }

  /**
   * When a trip is completed, the truck is free immediately at actual completion.
   * During active trips, free time is estimated/planned end.
   */
  resolveTruckFreeTime(
    truck: Truck,
    trip?: Trip | null,
    load?: Load | null,
  ): Date | null {
    if (truck.status === VehicleStatus.AVAILABLE && !truck.currentTripId) {
      return new Date();
    }

    if (trip) {
      const window = this.resolveEffectiveWindow(trip, load);
      if (!window.isBlocking) {
        return window.actualDeliveryDateTime || window.deliveryDateTime || new Date();
      }
      return window.deliveryDateTime;
    }

    if (truck.estimatedAvailableTime) {
      return new Date(truck.estimatedAvailableTime);
    }

    return null;
  }

  /**
   * Check whether two commitments genuinely conflict using effective windows.
   * Non-blocking (completed/cancelled) commitments never conflict.
   */
  commitmentsConflict(
    existingTrip: Trip | null | undefined,
    existingLoad: Load | null | undefined,
    existingReservation: ShipmentReservation | null | undefined,
    newPickup: Date,
    newDelivery: Date,
  ): boolean {
    const existing = this.resolveEffectiveWindow(
      existingTrip,
      existingLoad,
      existingReservation,
    );
    if (!existing.isBlocking) return false;
    if (isIndefinitelyOccupyingStatus(existingTrip?.status)) return true;
    return this.schedulesOverlap(
      existing.pickupDateTime,
      existing.deliveryDateTime,
      newPickup,
      newDelivery,
    );
  }

  /**
   * Verify driver can take a new assignment: completed previous trip, rest period, hours.
   */
  validateDriverAvailability(
    driver: Driver | null | undefined,
    pickupDateTime: Date,
  ): { available: boolean; reason?: string } {
    if (!driver) {
      return { available: true };
    }

    if (
      driver.status === DriverStatus.IN_TRANSIT &&
      driver.currentTripId
    ) {
      return {
        available: false,
        reason:
          'Driver is still committed to an active trip and cannot be assigned to a new shipment.',
      };
    }

    if (driver.consecutiveDrivingHours >= MAX_CONSECUTIVE_DRIVING_HOURS) {
      return {
        available: false,
        reason: `Driver has exceeded maximum consecutive driving hours (${MAX_CONSECUTIVE_DRIVING_HOURS}h). Required rest period before next assignment.`,
      };
    }

    if (driver.lastBreakTime) {
      const restEnd = new Date(driver.lastBreakTime);
      restEnd.setHours(restEnd.getHours() + MIN_DRIVER_REST_HOURS);
      if (new Date(pickupDateTime).getTime() < restEnd.getTime()) {
        return {
          available: false,
          reason: `Driver requires ${MIN_DRIVER_REST_HOURS}h rest after last break. Earliest available: ${restEnd.toISOString()}.`,
        };
      }
    }

    return { available: true };
  }

  /**
   * Verify the truck can physically reach the next pickup after completing the previous delivery.
   */
  validateLocationFeasibility(
    previousDeliveryCoords: Coordinates | null | undefined,
    nextPickupCoords: Coordinates | null | undefined,
    availableFrom: Date,
    nextPickupDateTime: Date,
    avgSpeedKmh: number = DEFAULT_TRUCK_SPEED_KMH,
  ): LogisticsFeasibilityResult {
    if (!previousDeliveryCoords || !nextPickupCoords) {
      return { feasible: true };
    }

    const distanceKm = this.haversineDistanceKm(
      previousDeliveryCoords.latitude,
      previousDeliveryCoords.longitude,
      nextPickupCoords.latitude,
      nextPickupCoords.longitude,
    );

    const travelDurationMinutes = Math.ceil((distanceKm / avgSpeedKmh) * 60);
    const earliestArrival = new Date(
      availableFrom.getTime() + travelDurationMinutes * 60 * 1000,
    );

    if (earliestArrival.getTime() > new Date(nextPickupDateTime).getTime()) {
      return {
        feasible: false,
        reason:
          `Truck cannot reach the next pickup location in time. ` +
          `Travel distance: ${distanceKm.toFixed(0)} km (~${travelDurationMinutes} min). ` +
          `Earliest possible arrival: ${earliestArrival.toISOString()}. ` +
          `Required pickup: ${new Date(nextPickupDateTime).toISOString()}.`,
        travelDistanceKm: distanceKm,
        travelDurationMinutes,
        earliestArrival,
      };
    }

    return {
      feasible: true,
      travelDistanceKm: distanceKm,
      travelDurationMinutes,
      earliestArrival,
    };
  }

  extractPickupCoords(load?: Load | null): Coordinates | null {
    const loc = load?.pickupLocation?.locationData?.coordinates;
    if (loc?.latitude != null && loc?.longitude != null) {
      return { latitude: loc.latitude, longitude: loc.longitude };
    }
    const fromLocations = load?.locations?.find((l) => l.type === 'PICKUP');
    const coords = fromLocations?.locationData?.coordinates;
    if (coords?.latitude != null && coords?.longitude != null) {
      return { latitude: coords.latitude, longitude: coords.longitude };
    }
    return null;
  }

  extractDeliveryCoords(load?: Load | null): Coordinates | null {
    const loc = load?.deliveryLocation?.locationData?.coordinates;
    if (loc?.latitude != null && loc?.longitude != null) {
      return { latitude: loc.latitude, longitude: loc.longitude };
    }
    const fromLocations = load?.locations?.find((l) => l.type === 'DELIVERY');
    const coords = fromLocations?.locationData?.coordinates;
    if (coords?.latitude != null && coords?.longitude != null) {
      return { latitude: coords.latitude, longitude: coords.longitude };
    }
    return null;
  }

  buildConflictAuditDetails(
    existingWindow: EffectiveAvailabilityWindow,
    newPickup: Date,
    newDelivery: Date,
    truckStatus?: string,
    reason?: string,
  ): ScheduleComparisonAudit {
    return {
      conflictReason:
        reason ||
        (existingWindow.isBlocking
          ? 'Schedule windows overlap with an active truck commitment.'
          : 'No conflict — previous trip completed or cancelled.'),
      plannedPickup: existingWindow.plannedPickupDateTime.toISOString(),
      plannedDelivery: existingWindow.plannedDeliveryDateTime.toISOString(),
      actualPickup: existingWindow.actualPickupDateTime?.toISOString(),
      actualDelivery: existingWindow.actualDeliveryDateTime?.toISOString(),
      tripStatus: existingWindow.tripStatus,
      loadStatus: existingWindow.loadStatus,
      truckStatus,
      operationalPhase: existingWindow.operationalPhase,
      timeSource: existingWindow.timeSource,
      decisionTimestamp: new Date().toISOString(),
    };
  }

  /** Stale reservations tied to completed/cancelled trips should be released. */
  shouldReleaseStaleReservation(
    trip?: Trip | null,
    load?: Load | null,
  ): boolean {
    if (!trip && !load) return false;
    const phase = this.resolveOperationalPhase(trip, load);
    return (
      phase === OperationalTripPhase.COMPLETED ||
      phase === OperationalTripPhase.CANCELLED ||
      TERMINAL_TRIP_STATUSES.includes(trip?.status as TripStatus) ||
      TERMINAL_LOAD_STATUSES.includes(load?.status as LoadStatus)
    );
  }

  private extractActualPickupFromLoad(load?: Load | null): Date | undefined {
    const pickup = load?.locations?.find((l) => l.type === 'PICKUP');
    if (pickup?.actualDepartureTime) return new Date(pickup.actualDepartureTime);
    if (pickup?.actualArrivalTime) return new Date(pickup.actualArrivalTime);
    return undefined;
  }

  private extractActualDeliveryFromLoad(load?: Load | null): Date | undefined {
    const delivery = load?.locations?.find((l) => l.type === 'DELIVERY');
    if (delivery?.actualDepartureTime) return new Date(delivery.actualDepartureTime);
    if (delivery?.actualArrivalTime) return new Date(delivery.actualArrivalTime);
    return undefined;
  }

  private haversineDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
