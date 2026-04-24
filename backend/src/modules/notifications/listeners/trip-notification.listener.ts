import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationChannel,
  NotificationStatus,
  EntityType,
} from '../../../entities/notification.entity';
import { EventsGateway } from '../../events/events.gateway';

interface DriverAssignedPayload {
  tripId: string;
  driverId: string;
  driverName: string;
  cargoOwnerId: string;
  truckOwnerId: string;
  tenantId: string;
  cargoTitle?: string;
  pickupLocation?: string;
  deliveryLocation?: string;
}

interface TripStartedPayload {
  tripId: string;
  driverId: string;
  driverName: string;
  cargoOwnerId: string;
  truckOwnerId: string;
  tenantId: string;
  cargoTitle?: string;
  startLocation?: string;
  estimatedArrival?: Date;
}

interface TripCompletedPayload {
  tripId: string;
  driverId: string;
  driverName: string;
  cargoOwnerId: string;
  truckOwnerId: string;
  tenantId: string;
  cargoTitle?: string;
  deliveryLocation?: string;
  completedAt: Date;
}

interface TruckOwnerAcceptedPayload {
  assignmentId: string;
  tripId: string;
  truckOwnerId: string;
  truckOwnerName: string;
  cargoOwnerId: string;
  tenantId: string;
  cargoTitle?: string;
}

interface TripApprovedPayload {
  tripId: string;
  driverId: string;
  driverName: string;
  cargoOwnerId: string;
  truckOwnerId: string;
  tenantId: string;
  cargoTitle?: string;
  scheduledStartTime?: Date;
}

@Injectable()
export class TripNotificationListener {
  private readonly logger = new Logger(TripNotificationListener.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Cargo Owner receives: Truck owner accepted assignment
   */
  @OnEvent('trip.truck.owner.accepted')
  async handleTruckOwnerAccepted(payload: TruckOwnerAcceptedPayload) {
    this.logger.log(
      `Handling trip.truck.owner.accepted event for trip ${payload.tripId}`,
    );

    try {
      const notification = this.notificationRepository.create({
        recipientId: payload.cargoOwnerId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.TRIP_CREATED,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.HIGH,
        title: 'Assignment Accepted',
        message: `${payload.truckOwnerName} has accepted the assignment${payload.cargoTitle ? ` for "${payload.cargoTitle}"` : ''}. The trip is now confirmed.`,
        shortMessage: `${payload.truckOwnerName} accepted assignment`,
        entityType: EntityType.TRIP,
        entityId: payload.tripId,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: false,
        actionUrl: `/dashboard/trips/${payload.tripId}`,
        actionText: 'View Trip',
        metadata: {
          tripId: payload.tripId,
          assignmentId: payload.assignmentId,
          truckOwnerId: payload.truckOwnerId,
          truckOwnerName: payload.truckOwnerName,
          cargoTitle: payload.cargoTitle,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const saved = await this.notificationRepository.save(notification);
      this.eventsGateway.emitNotification(payload.cargoOwnerId, saved);

      this.logger.log(
        `Successfully sent truck owner accepted notification to cargo owner ${payload.cargoOwnerId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send truck owner accepted notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Driver receives: Assigned to trip
   * Cargo Owner receives: Driver assigned
   */
  @OnEvent('trip.driver.assigned')
  async handleDriverAssigned(payload: DriverAssignedPayload) {
    this.logger.log(
      `Handling trip.driver.assigned event for trip ${payload.tripId}`,
    );

    try {
      // Notify the Driver
      const driverNotification = this.notificationRepository.create({
        recipientId: payload.driverId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.DRIVER_ASSIGNMENT,
        category: NotificationCategory.DRIVER,
        priority: NotificationPriority.URGENT,
        title: '🚚 New Trip Assignment',
        message: `You have been assigned to a new trip${payload.cargoTitle ? ` for "${payload.cargoTitle}"` : ''}${payload.pickupLocation && payload.deliveryLocation ? `. Route: ${payload.pickupLocation} → ${payload.deliveryLocation}` : ''}.`,
        shortMessage: 'New trip assigned',
        entityType: EntityType.TRIP,
        entityId: payload.tripId,
        channels: [
          NotificationChannel.IN_APP,
          NotificationChannel.PUSH,
          NotificationChannel.SMS,
        ],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: true,
        actionUrl: `/driver/trips/${payload.tripId}`,
        actionText: 'View Trip Details',
        metadata: {
          tripId: payload.tripId,
          cargoTitle: payload.cargoTitle,
          pickupLocation: payload.pickupLocation,
          deliveryLocation: payload.deliveryLocation,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: true,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const savedDriver = await this.notificationRepository.save(
        driverNotification,
      );
      this.eventsGateway.emitNotification(payload.driverId, savedDriver);

      // Notify the Cargo Owner
      const cargoOwnerNotification = this.notificationRepository.create({
        recipientId: payload.cargoOwnerId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.DRIVER_ASSIGNMENT,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.NORMAL,
        title: 'Driver Assigned',
        message: `${payload.driverName} has been assigned to your trip${payload.cargoTitle ? ` for "${payload.cargoTitle}"` : ''}.`,
        shortMessage: `Driver: ${payload.driverName}`,
        entityType: EntityType.TRIP,
        entityId: payload.tripId,
        channels: [NotificationChannel.IN_APP],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: false,
        actionUrl: `/dashboard/trips/${payload.tripId}`,
        actionText: 'View Trip',
        metadata: {
          tripId: payload.tripId,
          driverId: payload.driverId,
          driverName: payload.driverName,
          cargoTitle: payload.cargoTitle,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const savedCargoOwner = await this.notificationRepository.save(
        cargoOwnerNotification,
      );
      this.eventsGateway.emitNotification(
        payload.cargoOwnerId,
        savedCargoOwner,
      );

      this.logger.log(
        `Successfully sent driver assignment notifications to driver ${payload.driverId} and cargo owner ${payload.cargoOwnerId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send driver assignment notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Driver receives: Trip approved and ready to start
   */
  @OnEvent('trip.approved')
  async handleTripApproved(payload: TripApprovedPayload) {
    this.logger.log(
      `Handling trip.approved event for trip ${payload.tripId}`,
    );

    try {
      const notification = this.notificationRepository.create({
        recipientId: payload.driverId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.TRIP_CREATED,
        category: NotificationCategory.DRIVER,
        priority: NotificationPriority.HIGH,
        title: '✅ Trip Approved - Ready to Start',
        message: `Your trip${payload.cargoTitle ? ` for "${payload.cargoTitle}"` : ''} has been approved and is ready to start${payload.scheduledStartTime ? `. Scheduled start: ${new Date(payload.scheduledStartTime).toLocaleString()}` : ''}.`,
        shortMessage: 'Trip approved - ready to start',
        entityType: EntityType.TRIP,
        entityId: payload.tripId,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: true,
        actionUrl: `/driver/trips/${payload.tripId}`,
        actionText: 'Start Trip',
        metadata: {
          tripId: payload.tripId,
          cargoTitle: payload.cargoTitle,
          scheduledStartTime: payload.scheduledStartTime,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const saved = await this.notificationRepository.save(notification);
      this.eventsGateway.emitNotification(payload.driverId, saved);

      this.logger.log(
        `Successfully sent trip approved notification to driver ${payload.driverId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send trip approved notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Cargo Owner, Truck Owner, Driver receive: Trip started
   */
  @OnEvent('trip.started')
  async handleTripStarted(payload: TripStartedPayload) {
    this.logger.log(
      `Handling trip.started event for trip ${payload.tripId}`,
    );

    try {
      // Notify Cargo Owner
      const cargoOwnerNotification = this.notificationRepository.create({
        recipientId: payload.cargoOwnerId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.TRIP_STARTED,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.HIGH,
        title: '🚀 Trip Started',
        message: `${payload.driverName} has started the trip${payload.cargoTitle ? ` for "${payload.cargoTitle}"` : ''}${payload.estimatedArrival ? `. Estimated arrival: ${new Date(payload.estimatedArrival).toLocaleString()}` : ''}.`,
        shortMessage: 'Trip started',
        entityType: EntityType.TRIP,
        entityId: payload.tripId,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: false,
        actionUrl: `/dashboard/tracking/${payload.tripId}`,
        actionText: 'Track Trip',
        metadata: {
          tripId: payload.tripId,
          driverId: payload.driverId,
          driverName: payload.driverName,
          cargoTitle: payload.cargoTitle,
          startLocation: payload.startLocation,
          estimatedArrival: payload.estimatedArrival,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const savedCargoOwner = await this.notificationRepository.save(
        cargoOwnerNotification,
      );
      this.eventsGateway.emitNotification(
        payload.cargoOwnerId,
        savedCargoOwner,
      );

      // Notify Truck Owner
      const truckOwnerNotification = this.notificationRepository.create({
        recipientId: payload.truckOwnerId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.TRIP_STARTED,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.NORMAL,
        title: 'Trip Started',
        message: `${payload.driverName} has started the trip${payload.cargoTitle ? ` for "${payload.cargoTitle}"` : ''}.`,
        shortMessage: 'Trip started',
        entityType: EntityType.TRIP,
        entityId: payload.tripId,
        channels: [NotificationChannel.IN_APP],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: false,
        actionUrl: `/dashboard/trips/${payload.tripId}`,
        actionText: 'View Trip',
        metadata: {
          tripId: payload.tripId,
          driverId: payload.driverId,
          driverName: payload.driverName,
          cargoTitle: payload.cargoTitle,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const savedTruckOwner = await this.notificationRepository.save(
        truckOwnerNotification,
      );
      this.eventsGateway.emitNotification(payload.truckOwnerId, savedTruckOwner);

      this.logger.log(
        `Successfully sent trip started notifications to cargo owner ${payload.cargoOwnerId} and truck owner ${payload.truckOwnerId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send trip started notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Cargo Owner, Truck Owner, Driver receive: Trip completed / Delivery completed
   */
  @OnEvent('trip.completed')
  async handleTripCompleted(payload: TripCompletedPayload) {
    this.logger.log(
      `Handling trip.completed event for trip ${payload.tripId}`,
    );

    try {
      // Notify Cargo Owner
      const cargoOwnerNotification = this.notificationRepository.create({
        recipientId: payload.cargoOwnerId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.TRIP_COMPLETED,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.HIGH,
        title: '✅ Delivery Completed',
        message: `Your cargo${payload.cargoTitle ? ` "${payload.cargoTitle}"` : ''} has been successfully delivered${payload.deliveryLocation ? ` to ${payload.deliveryLocation}` : ''}.`,
        shortMessage: 'Delivery completed',
        entityType: EntityType.TRIP,
        entityId: payload.tripId,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.EMAIL],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: true,
        actionUrl: `/dashboard/trips/${payload.tripId}`,
        actionText: 'View Details',
        metadata: {
          tripId: payload.tripId,
          driverId: payload.driverId,
          driverName: payload.driverName,
          cargoTitle: payload.cargoTitle,
          deliveryLocation: payload.deliveryLocation,
          completedAt: payload.completedAt,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const savedCargoOwner = await this.notificationRepository.save(
        cargoOwnerNotification,
      );
      this.eventsGateway.emitNotification(
        payload.cargoOwnerId,
        savedCargoOwner,
      );

      // Notify Truck Owner
      const truckOwnerNotification = this.notificationRepository.create({
        recipientId: payload.truckOwnerId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.TRIP_COMPLETED,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.HIGH,
        title: 'Trip Completed',
        message: `Trip${payload.cargoTitle ? ` for "${payload.cargoTitle}"` : ''} has been completed successfully. Payment will be processed shortly.`,
        shortMessage: 'Trip completed',
        entityType: EntityType.TRIP,
        entityId: payload.tripId,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: false,
        actionUrl: `/dashboard/trips/${payload.tripId}`,
        actionText: 'View Trip',
        metadata: {
          tripId: payload.tripId,
          driverId: payload.driverId,
          driverName: payload.driverName,
          cargoTitle: payload.cargoTitle,
          completedAt: payload.completedAt,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const savedTruckOwner = await this.notificationRepository.save(
        truckOwnerNotification,
      );
      this.eventsGateway.emitNotification(payload.truckOwnerId, savedTruckOwner);

      // Notify Driver
      const driverNotification = this.notificationRepository.create({
        recipientId: payload.driverId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.DRIVER_TRIP_END,
        category: NotificationCategory.DRIVER,
        priority: NotificationPriority.NORMAL,
        title: '🎉 Trip Completed',
        message: `Great job! You have successfully completed the trip${payload.cargoTitle ? ` for "${payload.cargoTitle}"` : ''}.`,
        shortMessage: 'Trip completed',
        entityType: EntityType.TRIP,
        entityId: payload.tripId,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: false,
        actionUrl: `/driver/trips/${payload.tripId}`,
        actionText: 'View Trip',
        metadata: {
          tripId: payload.tripId,
          cargoTitle: payload.cargoTitle,
          completedAt: payload.completedAt,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const savedDriver = await this.notificationRepository.save(
        driverNotification,
      );
      this.eventsGateway.emitNotification(payload.driverId, savedDriver);

      this.logger.log(
        `Successfully sent trip completed notifications to cargo owner ${payload.cargoOwnerId}, truck owner ${payload.truckOwnerId}, and driver ${payload.driverId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send trip completed notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
