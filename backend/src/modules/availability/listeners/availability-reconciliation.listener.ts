import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AvailabilityService } from '../availability.service';

interface TripEventPayload {
  tripId: string;
  tenantId?: string;
}

/**
 * Re-evaluates truck availability when operational events change trip/load status.
 * Ensures reservations and estimated free-times reflect actual (not just planned) data.
 */
@Injectable()
export class AvailabilityReconciliationListener {
  private readonly logger = new Logger(AvailabilityReconciliationListener.name);

  constructor(private readonly availabilityService: AvailabilityService) {}

  @OnEvent('trip.started', { async: true })
  async onTripStarted(payload: TripEventPayload): Promise<void> {
    if (!payload?.tripId) return;
    try {
      await this.availabilityService.reconcileReservationForTrip(
        payload.tripId,
        'Trip started — reservation window updated to actual start time',
      );
    } catch (err: any) {
      this.logger.error(
        `Failed to reconcile availability on trip.started ${payload.tripId}: ${err.message}`,
      );
    }
  }

  @OnEvent('trip.completed', { async: true })
  async onTripCompleted(payload: TripEventPayload): Promise<void> {
    if (!payload?.tripId) return;
    try {
      await this.availabilityService.reconcileReservationForTrip(
        payload.tripId,
        'Trip completed — reservation released, truck available at actual completion time',
      );
    } catch (err: any) {
      this.logger.error(
        `Failed to reconcile availability on trip.completed ${payload.tripId}: ${err.message}`,
      );
    }
  }

  @OnEvent('load.delivered', { async: true })
  async onLoadDelivered(payload: { loadId: string; tripId?: string }): Promise<void> {
    if (!payload?.tripId && !payload?.loadId) return;
    try {
      if (payload.tripId) {
        await this.availabilityService.reconcileReservationForTrip(
          payload.tripId,
          'Load delivered — truck freed at actual delivery time',
        );
      }
    } catch (err: any) {
      this.logger.error(
        `Failed to reconcile availability on load.delivered: ${err.message}`,
      );
    }
  }

  @OnEvent('load.schedule.updated', { async: true })
  async onLoadScheduleUpdated(payload: { tripId: string }): Promise<void> {
    if (!payload?.tripId) return;
    try {
      await this.availabilityService.reconcileReservationForTrip(
        payload.tripId,
        'Cargo schedule changed — reservation window recalculated',
      );
    } catch (err: any) {
      this.logger.error(
        `Failed to reconcile availability on load.schedule.updated: ${err.message}`,
      );
    }
  }
}
