import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DriverBreakStartedEvent,
  DriverBreakEndedEvent,
} from '../events/cargo-events';
import { NotificationService } from '../notification.service';
import {
  NotificationPriority,
  NotificationType,
  NotificationCategory,
  EntityType,
  NotificationChannel,
} from '../../../entities/notification.entity';
import { Driver } from '../../../entities/driver.entity';
import { User } from '../../../entities/user.entity';
import { Load } from '../../../entities/load.entity';
import { Trip } from '../../../entities/trip.entity';

@Injectable()
export class DriverBreakNotificationListener {
  private readonly logger = new Logger(DriverBreakNotificationListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
  ) {}

  @OnEvent('driver.break.started')
  async handleDriverBreakStarted(event: DriverBreakStartedEvent) {
    try {
      this.logger.log(
        `Handling driver break started event for driver ${event.driverId}`,
      );

      // Get driver details
      const driver = await this.driverRepository.findOne({
        where: { id: event.driverId, tenantId: event.tenantId },
      });

      if (!driver) {
        this.logger.warn(`Driver ${event.driverId} not found`);
        return;
      }

      const recipientIds: string[] = [];
      let cargoOwnerId: string | null = null;
      let loadDetails: any = null;

      // Get fleet manager/dispatcher (employer)
      const fleetManager = await this.userRepository.findOne({
        where: { id: driver.employerId, tenantId: event.tenantId },
      });

      if (fleetManager) {
        recipientIds.push(fleetManager.id);
      }

      // Get truck owner if driver has assigned truck
      if (driver.currentTruckId) {
        // Truck owner is typically the employer, but could be different
        // For now, we'll use the employer as truck owner
        // You might need to query the Truck entity if truck ownership is separate
      }

      // Check if driver is on an active trip/load
      if (event.breakDetails.currentLoadId) {
        const load = await this.loadRepository.findOne({
          where: { id: event.breakDetails.currentLoadId, tenantId: event.tenantId },
        });

        if (load) {
          cargoOwnerId = load.cargoOwnerId;
          loadDetails = {
            title: load.title,
            origin: load.pickupLocation,
            destination: load.deliveryLocation,
            estimatedDelivery: load.deliveryDate,
          };

          // Add cargo owner to recipients
          if (cargoOwnerId) {
            recipientIds.push(cargoOwnerId);
          }
        }
      }

      // Notify Fleet Manager/Dispatcher
      if (fleetManager) {
        await this.notificationService.createNotification({
          tenantId: event.tenantId,
          recipientId: fleetManager.id,
          entityType: EntityType.DRIVER,
          entityId: event.driverId,
          notificationType: NotificationType.DRIVER_ALERT,
          category: NotificationCategory.DRIVER,
          priority: NotificationPriority.NORMAL,
          title: 'Driver Break Started',
          message: `${event.breakDetails.driverName} has started a ${event.breakDetails.breakType.toLowerCase()} break`,
          shortMessage: `${event.breakDetails.driverName} on break`,
          channels: [NotificationChannel.IN_APP],
          metadata: {
            driverId: event.driverId,
            breakId: event.breakId,
            breakType: event.breakDetails.breakType,
            startTime: event.breakDetails.startTime,
            estimatedDuration: event.breakDetails.estimatedDuration,
            currentTripId: event.breakDetails.currentTripId,
            currentLoadId: event.breakDetails.currentLoadId,
            notes: event.breakDetails.notes,
          },
        });
      }

      // Notify Cargo Owner (only if driver is on active delivery)
      if (cargoOwnerId && loadDetails) {
        const etaImpact = event.breakDetails.estimatedDuration || 30; // Default 30 min
        await this.notificationService.createNotification({
          tenantId: event.tenantId,
          recipientId: cargoOwnerId,
          entityType: EntityType.CARGO,
          entityId: event.breakDetails.currentLoadId,
          notificationType: NotificationType.CARGO_DELAY,
          category: NotificationCategory.CARGO,
          priority: NotificationPriority.NORMAL,
          title: 'Driver Break - Delivery Update',
          message: `Your driver is taking a required break. Estimated delay: ${etaImpact} minutes for shipment "${loadDetails.title}"`,
          shortMessage: `Delivery delayed by ${etaImpact} min`,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          metadata: {
            driverId: event.driverId,
            breakId: event.breakId,
            loadId: event.breakDetails.currentLoadId,
            loadTitle: loadDetails.title,
            origin: loadDetails.origin,
            destination: loadDetails.destination,
            estimatedDelay: etaImpact,
            breakType: event.breakDetails.breakType,
          },
        });
      }

      this.logger.log(
        `Successfully sent break started notifications to ${recipientIds.length} recipients`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle driver break started event: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('driver.break.ended')
  async handleDriverBreakEnded(event: DriverBreakEndedEvent) {
    try {
      this.logger.log(
        `Handling driver break ended event for driver ${event.driverId}`,
      );

      // Get driver details
      const driver = await this.driverRepository.findOne({
        where: { id: event.driverId, tenantId: event.tenantId },
      });

      if (!driver) {
        this.logger.warn(`Driver ${event.driverId} not found`);
        return;
      }

      const recipientIds: string[] = [];
      let cargoOwnerId: string | null = null;
      let loadDetails: any = null;

      // Get fleet manager/dispatcher (employer)
      const fleetManager = await this.userRepository.findOne({
        where: { id: driver.employerId, tenantId: event.tenantId },
      });

      if (fleetManager) {
        recipientIds.push(fleetManager.id);
      }

      // Check if driver is on an active trip/load
      if (event.breakDetails.currentLoadId) {
        const load = await this.loadRepository.findOne({
          where: { id: event.breakDetails.currentLoadId, tenantId: event.tenantId },
        });

        if (load) {
          cargoOwnerId = load.cargoOwnerId;
          loadDetails = {
            title: load.title,
            origin: load.pickupLocation,
            destination: load.deliveryLocation,
          };

          // Add cargo owner to recipients
          if (cargoOwnerId) {
            recipientIds.push(cargoOwnerId);
          }
        }
      }

      // Notify Fleet Manager/Dispatcher
      if (fleetManager) {
        await this.notificationService.createNotification({
          tenantId: event.tenantId,
          recipientId: fleetManager.id,
          entityType: EntityType.DRIVER,
          entityId: event.driverId,
          notificationType: NotificationType.DRIVER_ALERT,
          category: NotificationCategory.DRIVER,
          priority: NotificationPriority.LOW,
          title: 'Driver Break Ended',
          message: `${event.breakDetails.driverName} has completed their break (${event.breakDetails.duration} minutes) and is now available`,
          shortMessage: `${event.breakDetails.driverName} available`,
          channels: [NotificationChannel.IN_APP],
          metadata: {
            driverId: event.driverId,
            breakId: event.breakId,
            breakType: event.breakDetails.breakType,
            startTime: event.breakDetails.startTime,
            endTime: event.breakDetails.endTime,
            duration: event.breakDetails.duration,
            currentTripId: event.breakDetails.currentTripId,
            currentLoadId: event.breakDetails.currentLoadId,
          },
        });
      }

      // Notify Cargo Owner (only if driver is on active delivery)
      if (cargoOwnerId && loadDetails) {
        await this.notificationService.createNotification({
          tenantId: event.tenantId,
          recipientId: cargoOwnerId,
          entityType: EntityType.CARGO,
          entityId: event.breakDetails.currentLoadId,
          notificationType: NotificationType.CARGO_DELIVERY_UPDATE,
          category: NotificationCategory.CARGO,
          priority: NotificationPriority.LOW,
          title: 'Driver Break Completed',
          message: `Your driver has resumed delivery of "${loadDetails.title}". Shipment is back on track.`,
          shortMessage: `Delivery resumed`,
          channels: [NotificationChannel.IN_APP],
          metadata: {
            driverId: event.driverId,
            breakId: event.breakId,
            loadId: event.breakDetails.currentLoadId,
            loadTitle: loadDetails.title,
            origin: loadDetails.origin,
            destination: loadDetails.destination,
            breakDuration: event.breakDetails.duration,
          },
        });
      }

      this.logger.log(
        `Successfully sent break ended notifications to ${recipientIds.length} recipients`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle driver break ended event: ${error.message}`,
        error.stack,
      );
    }
  }
}
