import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Trip, TripStatus } from '../../../entities/trip.entity';
import { Load } from '../../../entities/load.entity';
import { Driver, DriverStatus } from '../../../entities/driver.entity';
import {
  ShipmentReservation,
  ReservationStatus,
} from '../../../entities/shipment-reservation.entity';
import {
  TruckAvailabilityEngine,
  EffectiveAvailabilityWindow,
} from './truck-availability.engine';

/** Trip statuses that reserve a driver's schedule until completed or cancelled. */
const SCHEDULE_BLOCKING_STATUSES: TripStatus[] = [
  TripStatus.PLANNED,
  TripStatus.IN_PROGRESS,
  TripStatus.DELAYED,
];

export interface DriverAssignmentCheckParams {
  driverId: string;
  pickupDateTime: Date;
  deliveryDateTime: Date;
  tenantId: string;
  /** Exclude the trip being updated (reassignment / reschedule). */
  excludeTripId?: string;
}

export interface DriverConflictDetail {
  conflictingTripId: string;
  conflictingCargoId: string;
  conflictingTripStatus: TripStatus;
  existingPickup: Date;
  existingDelivery: Date;
  conflictType: 'CONCURRENT_EXECUTION' | 'SCHEDULE_OVERLAP';
  effectiveWindow?: EffectiveAvailabilityWindow;
}

/**
 * Enforces real-world driver scheduling constraints:
 *
 * 1. Single execution — a driver can physically operate only ONE trip at a time
 *    (IN_PROGRESS). Starting or assigning a second in-progress trip is rejected.
 *
 * 2. No overlapping commitments — while a trip is PLANNED, IN_PROGRESS, or DELAYED,
 *    the driver cannot be assigned to another cargo whose pickup/delivery window
 *    overlaps. Completed or cancelled trips free the driver immediately.
 *
 * 3. Reservation + trip dual-check — validates both ShipmentReservation records
 *    and Trip records so gaps from legacy data or partial updates are caught.
 */
@Injectable()
export class DriverSchedulingGuardService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Load)
    private readonly loadRepo: Repository<Load>,
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
    @InjectRepository(ShipmentReservation)
    private readonly reservationRepo: Repository<ShipmentReservation>,
    private readonly availabilityEngine: TruckAvailabilityEngine,
  ) {}

  /**
   * Gate for driver assignment (bid accept, match, manual assign-driver).
   * Throws ConflictException when the driver cannot take the shipment.
   */
  async assertDriverAvailableForAssignment(
    params: DriverAssignmentCheckParams,
  ): Promise<void> {
    const { driverId, tenantId } = params;

    const driver = await this.driverRepo.findOne({
      where: { id: driverId, tenantId },
    });
    if (!driver) {
      throw new BadRequestException('Driver not found');
    }

    if (
      [DriverStatus.SUSPENDED, DriverStatus.INACTIVE, DriverStatus.TERMINATED, DriverStatus.ON_LEAVE].includes(
        driver.status,
      )
    ) {
      throw new ConflictException(
        `Driver is ${driver.status.replace(/_/g, ' ').toLowerCase()} and cannot be assigned to shipments.`,
      );
    }

    const hosCheck = this.availabilityEngine.validateDriverAvailability(
      driver,
      params.pickupDateTime,
    );
    if (!hosCheck.available) {
      throw new ConflictException(hosCheck.reason);
    }

    const conflict = await this.findDriverConflict(params);
    if (conflict) {
      throw new ConflictException(this.buildConflictMessage(conflict));
    }
  }

  /**
   * Gate for trip start (PLANNED/DELAYED → IN_PROGRESS).
   * A driver cannot start a new trip while another is already in progress.
   */
  async assertDriverCanStartTrip(
    driverId: string,
    tripId: string,
    tenantId: string,
  ): Promise<void> {
    const otherInProgress = await this.tripRepo.findOne({
      where: {
        driverId,
        tenantId,
        status: TripStatus.IN_PROGRESS,
        id: Not(tripId),
      },
    });

    if (otherInProgress) {
      throw new ConflictException(
        `Driver is already executing trip ${otherInProgress.tripNumber}. ` +
          `Complete or cancel that trip before starting another. ` +
          `A driver cannot operate two active trips at the same time.`,
      );
    }

    const trip = await this.tripRepo.findOne({ where: { id: tripId, tenantId } });
    if (!trip?.plannedStartTime || !trip.plannedEndTime) return;

    const conflict = await this.findDriverConflict({
      driverId,
      pickupDateTime: new Date(trip.plannedStartTime),
      deliveryDateTime: new Date(trip.plannedEndTime),
      tenantId,
      excludeTripId: tripId,
    });

    if (conflict) {
      throw new ConflictException(this.buildConflictMessage(conflict));
    }
  }

  /**
   * Returns the first scheduling conflict for a driver, or null if available.
   */
  async findDriverConflict(
    params: DriverAssignmentCheckParams,
  ): Promise<DriverConflictDetail | null> {
    const { driverId, pickupDateTime, deliveryDateTime, excludeTripId } = params;

    const reservationConflict = await this.findConflictFromReservations(
      driverId,
      pickupDateTime,
      deliveryDateTime,
      excludeTripId,
    );
    if (reservationConflict) return reservationConflict;

    return this.findConflictFromActiveTrips(
      driverId,
      pickupDateTime,
      deliveryDateTime,
      excludeTripId,
    );
  }

  private async findConflictFromReservations(
    driverId: string,
    pickupDateTime: Date,
    deliveryDateTime: Date,
    excludeTripId?: string,
  ): Promise<DriverConflictDetail | null> {
    const activeReservations = await this.reservationRepo.find({
      where: { driverId, status: ReservationStatus.ACTIVE },
    });

    for (const reservation of activeReservations) {
      if (excludeTripId && reservation.tripId === excludeTripId) continue;

      const conflict = await this.evaluateTripWindowConflict(
        reservation.tripId,
        reservation.cargoId,
        pickupDateTime,
        deliveryDateTime,
        reservation,
      );
      if (conflict) return conflict;
    }

    return null;
  }

  /** Safety net when reservations are missing or driverId was not synced. */
  private async findConflictFromActiveTrips(
    driverId: string,
    pickupDateTime: Date,
    deliveryDateTime: Date,
    excludeTripId?: string,
  ): Promise<DriverConflictDetail | null> {
    const activeTrips = await this.tripRepo.find({
      where: {
        driverId,
        status: In(SCHEDULE_BLOCKING_STATUSES),
        ...(excludeTripId ? { id: Not(excludeTripId) } : {}),
      },
    });

    for (const trip of activeTrips) {
      const conflict = await this.evaluateTripWindowConflict(
        trip.id,
        trip.loadId,
        pickupDateTime,
        deliveryDateTime,
      );
      if (conflict) return conflict;
    }

    return null;
  }

  private async evaluateTripWindowConflict(
    tripId: string,
    cargoId: string,
    newPickup: Date,
    newDelivery: Date,
    reservation?: ShipmentReservation,
  ): Promise<DriverConflictDetail | null> {
    const [trip, load] = await Promise.all([
      this.tripRepo.findOne({ where: { id: tripId } }),
      this.loadRepo.findOne({ where: { id: cargoId } }),
    ]);

    if (this.availabilityEngine.shouldReleaseStaleReservation(trip, load)) {
      return null;
    }

    const effectiveWindow = this.availabilityEngine.resolveEffectiveWindow(
      trip,
      load,
      reservation,
    );

    if (!effectiveWindow.isBlocking) return null;

    const overlaps = this.availabilityEngine.schedulesOverlap(
      effectiveWindow.pickupDateTime,
      effectiveWindow.deliveryDateTime,
      newPickup,
      newDelivery,
    );

    if (!overlaps) return null;

    return {
      conflictingTripId: tripId,
      conflictingCargoId: cargoId,
      conflictingTripStatus: trip?.status ?? TripStatus.PLANNED,
      existingPickup: effectiveWindow.pickupDateTime,
      existingDelivery: effectiveWindow.deliveryDateTime,
      conflictType:
        trip?.status === TripStatus.IN_PROGRESS
          ? 'CONCURRENT_EXECUTION'
          : 'SCHEDULE_OVERLAP',
      effectiveWindow,
    };
  }

  private buildConflictMessage(conflict: DriverConflictDetail): string {
    const pickup = conflict.existingPickup.toISOString().slice(0, 16).replace('T', ' ');
    const delivery = conflict.existingDelivery.toISOString().slice(0, 16).replace('T', ' ');

    if (conflict.conflictType === 'CONCURRENT_EXECUTION') {
      return (
        `Driver is already executing an active trip and cannot be assigned to another shipment. ` +
        `Current trip: ${conflict.conflictingTripId} (cargo ${conflict.conflictingCargoId}), ` +
        `estimated completion: ${delivery}. ` +
        `Mark the current trip as completed before assigning a new one.`
      );
    }

    return (
      `Driver is already committed to another shipment during the selected transportation period. ` +
      `Conflict: cargo ${conflict.conflictingCargoId} (${conflict.conflictingTripStatus}) — ` +
      `${pickup} → ${delivery}. ` +
      `Choose another driver, reschedule this shipment, or complete the conflicting trip first.`
    );
  }
}
