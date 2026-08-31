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

interface TripOverduePayload {
  tripId: string;
  tripNumber: string;
  loadId?: string;
  tenantId: string;
  driverId?: string;
  driverName?: string;
  cargoOwnerId?: string;
  truckOwnerId?: string;
  brokerId?: string;
  tenantAdminIds?: string[];
  cargoTitle?: string;
  plannedEndTime?: Date | string;
  expectedCompletionLabel?: string;
  truckPlate?: string;
}

interface TripDelayReportedPayload {
  tripId: string;
  tripNumber: string;
  tenantId: string;
  status?: string;
  driverId?: string;
  driverName?: string;
  cargoOwnerId?: string;
  truckOwnerId?: string;
  brokerId?: string;
  tenantAdminIds?: string[];
  cargoTitle?: string;
  delayReason?: string;
  newEstimatedArrival?: Date | string;
  newEtaLabel?: string;
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
        actionUrl: `/dashboard/trips`,
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
        actionUrl: `/dashboard/driver/trips`,
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
        actionUrl: `/dashboard/trips`,
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
        actionUrl: `/dashboard/driver/trips`,
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
        actionUrl: `/dashboard/tracking`,
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
        actionUrl: `/dashboard/trips`,
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
        actionUrl: `/dashboard/trips`,
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
        actionUrl: `/dashboard/trips`,
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
        actionUrl: `/dashboard/driver/trips`,
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

  @OnEvent('trip.overdue')
  async handleTripOverdue(payload: TripOverduePayload) {
    this.logger.log(`Handling trip.overdue event for trip ${payload.tripId}`);
    const expected = payload.expectedCompletionLabel || 'the expected completion time';
    const tripRef = payload.tripNumber || payload.tripId;

    const recipients: Array<{
      userId: string;
      title: string;
      message: string;
      actionUrl: string;
    }> = [];

    if (payload.driverId) {
      recipients.push({
        userId: payload.driverId,
        title: '⚠️ Trip Overdue',
        message: `Trip #${tripRef} was expected to be completed by ${expected}. Please complete the trip or report a delay.`,
        actionUrl: '/dashboard/driver/trips',
      });
    }

    for (const adminId of payload.tenantAdminIds || []) {
      recipients.push({
        userId: adminId,
        title: '⚠️ Trip Overdue',
        message: `Trip #${tripRef} assigned to driver ${payload.driverName || 'Unknown'} has exceeded its expected completion time. Expected completion: ${expected}. Current status: OVERDUE.`,
        actionUrl: '/dashboard/trips',
      });
    }

    if (payload.brokerId) {
      recipients.push({
        userId: payload.brokerId,
        title: '⚠️ Broker Trip Alert',
        message: `Trip #${tripRef} associated with cargo ${payload.cargoTitle ? `"${payload.cargoTitle}"` : `#${payload.loadId || tripRef}`} is overdue. Driver: ${payload.driverName || 'Unknown'}. Expected completion: ${expected}.`,
        actionUrl: '/dashboard/trips',
      });
    }

    if (payload.cargoOwnerId) {
      recipients.push({
        userId: payload.cargoOwnerId,
        title: '⚠️ Cargo Delivery Delayed',
        message: `Your cargo associated with trip #${tripRef} has exceeded its expected delivery time. The driver has been notified to provide an update.`,
        actionUrl: '/dashboard/trips',
      });
    }

    if (payload.truckOwnerId) {
      recipients.push({
        userId: payload.truckOwnerId,
        title: '⚠️ Trip Overdue',
        message: `Trip #${tripRef}${payload.truckPlate ? ` on truck ${payload.truckPlate}` : ''} assigned to ${payload.driverName || 'the driver'} is overdue. Expected completion: ${expected}.`,
        actionUrl: '/dashboard/trips',
      });
    }

    await this.sendUniqueTripNotifications(
      payload.tenantId,
      payload.tripId,
      'TRIP_OVERDUE',
      recipients,
      {
        tripNumber: payload.tripNumber,
        plannedEndTime: payload.plannedEndTime,
        driverName: payload.driverName,
      },
    );
  }

  @OnEvent('trip.delay.reported')
  async handleTripDelayReported(payload: TripDelayReportedPayload) {
    this.logger.log(`Handling trip.delay.reported event for trip ${payload.tripId}`);
    const tripRef = payload.tripNumber || payload.tripId;
    const eta = payload.newEtaLabel || 'a new estimated arrival';

    const recipients: Array<{
      userId: string;
      title: string;
      message: string;
      actionUrl: string;
    }> = [];

    const stakeholderMessage =
      `Trip #${tripRef} is overdue. Delay has been reported` +
      (payload.delayReason ? ` (${payload.delayReason})` : '') +
      `. New ETA: ${eta}.`;

    for (const adminId of payload.tenantAdminIds || []) {
      recipients.push({
        userId: adminId,
        title: 'Delay reported on overdue trip',
        message: stakeholderMessage,
        actionUrl: '/dashboard/trips',
      });
    }
    if (payload.brokerId) {
      recipients.push({
        userId: payload.brokerId,
        title: 'Delay reported on overdue trip',
        message: stakeholderMessage,
        actionUrl: '/dashboard/trips',
      });
    }
    if (payload.cargoOwnerId) {
      recipients.push({
        userId: payload.cargoOwnerId,
        title: 'Delivery update',
        message: `The driver reported a delay on trip #${tripRef}. New ETA: ${eta}.`,
        actionUrl: '/dashboard/trips',
      });
    }
    if (payload.truckOwnerId) {
      recipients.push({
        userId: payload.truckOwnerId,
        title: 'Delay reported',
        message: stakeholderMessage,
        actionUrl: '/dashboard/trips',
      });
    }

    await this.sendUniqueTripNotifications(
      payload.tenantId,
      payload.tripId,
      `TRIP_DELAY_REPORT:${payload.newEstimatedArrival || ''}`,
      recipients,
      {
        tripNumber: payload.tripNumber,
        delayReason: payload.delayReason,
        newEstimatedArrival: payload.newEstimatedArrival,
      },
    );
  }

  private async sendUniqueTripNotifications(
    tenantId: string,
    tripId: string,
    eventKey: string,
    recipients: Array<{ userId: string; title: string; message: string; actionUrl: string }>,
    extraMetadata: Record<string, any> = {},
  ): Promise<void> {
    const seen = new Set<string>();
    for (const recipient of recipients) {
      if (!recipient.userId || seen.has(recipient.userId)) continue;
      seen.add(recipient.userId);

      try {
        const existing = await this.notificationRepository
          .createQueryBuilder('n')
          .where('n.recipientId = :rid', { rid: recipient.userId })
          .andWhere('n.entityId = :tripId', { tripId })
          .andWhere(`n.metadata->>'overdueEvent' = :eventKey`, { eventKey })
          .getOne();
        if (existing) continue;

        const notification = this.notificationRepository.create({
          recipientId: recipient.userId,
          tenantId,
          notificationType: NotificationType.TRIP_STATUS,
          category: NotificationCategory.TRIP,
          priority: NotificationPriority.HIGH,
          title: recipient.title,
          message: recipient.message,
          shortMessage: recipient.title,
          entityType: EntityType.TRIP,
          entityId: tripId,
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
          status: NotificationStatus.SENT,
          isRead: false,
          requiresAction: true,
          actionUrl: recipient.actionUrl,
          actionText: 'View Trip',
          metadata: {
            tripId,
            overdueEvent: eventKey,
            ...extraMetadata,
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
        this.eventsGateway.emitNotification(recipient.userId, saved);
      } catch (error: any) {
        this.logger.error(
          `Failed to send overdue/delay notification to ${recipient.userId}: ${error.message}`,
        );
      }
    }
  }
}
