import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { NotificationService } from '../notification.service';
import { EmailService } from '../../auth/services/email.service';
import { SmsService } from '../services/sms.service';
import { MessengerService } from '../../messenger/messenger.service';
import { EventsGateway } from '../../events/events.gateway';
import {
  CargoCreatedEvent,
  BidSubmittedEvent,
  BidAcceptedEvent,
  DriverAssignedEvent,
  TripStartedEvent,
  TripCompletedEvent,
  CargoReceiverAssignedEvent,
} from '../events/cargo-events';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationChannel,
  NotificationStatus,
  EntityType,
} from '../../../entities/notification.entity';
import { MessageRole } from '../../../entities/message.entity';

@Injectable()
export class CargoNotificationListener {
  private readonly logger = new Logger(CargoNotificationListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly messengerService: MessengerService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @OnEvent('cargo.created')
  async handleCargoCreated(event: CargoCreatedEvent) {
    this.logger.log(`Handling cargo.created event for cargo ${event.cargoId}`);

    try {
      // Get all truck owners in the tenant
      const truckOwners = await this.userRepository.find({
        where: {
          tenantId: event.tenantId,
          role: 'TRUCK_OWNER' as any,
          status: 'ACTIVE' as any,
        },
      });

      this.logger.log(`Found ${truckOwners.length} truck owners to notify`);

      // Send notification to each truck owner
      for (const truckOwner of truckOwners) {
        await this.notificationService.createNotification({
          tenantId: event.tenantId,
          recipientId: truckOwner.id,
          entityType: EntityType.CARGO,
          entityId: event.cargoId,
          notificationType: NotificationType.CARGO_PICKUP_REMINDER,
          category: NotificationCategory.CARGO,
          priority: NotificationPriority.HIGH,
          title: 'New Cargo Available for Bidding',
          message: `New cargo "${event.cargoDetails.title}" is available for bidding. Route: ${event.cargoDetails.origin} → ${event.cargoDetails.destination}. Weight: ${event.cargoDetails.weight}kg. Pickup: ${event.cargoDetails.pickupDate.toLocaleDateString()}. Check details and submit your bid.`,
          shortMessage: `New cargo available: ${event.cargoDetails.title}`,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          requiresAction: true,
          actionUrl: `/dashboard/cargos`,
          actionText: 'View Cargo & Bid',
          metadata: {
            cargoId: event.cargoId,
            cargoOwnerId: event.cargoOwnerId,
            origin: event.cargoDetails.origin,
            destination: event.cargoDetails.destination,
          },
          tags: ['cargo', 'bidding', 'new-opportunity'],
        });
      }

      this.logger.log(`Successfully sent notifications to ${truckOwners.length} truck owners`);
    } catch (error) {
      this.logger.error(`Error handling cargo.created event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('driver.assigned')
  async handleDriverAssigned(event: DriverAssignedEvent) {
    this.logger.log(`Handling driver.assigned event for driver ${event.driverId}`);

    try {
      await this.notificationService.createNotification({
        tenantId: event.tenantId,
        recipientId: event.driverId,
        entityType: EntityType.DRIVER,
        entityId: event.driverId,
        notificationType: NotificationType.DRIVER_ASSIGNMENT,
        category: NotificationCategory.DRIVER,
        priority: NotificationPriority.HIGH,
        title: 'You Have Been Assigned to a Truck',
        message: `You have been assigned to truck ${event.assignmentDetails.truckPlateNumber} (${event.assignmentDetails.truckModel}) for an upcoming delivery. Please ensure you are ready for the trip.`,
        shortMessage: `Assigned to truck ${event.assignmentDetails.truckPlateNumber}`,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        requiresAction: true,
        actionUrl: `/dashboard/fleet/trucks`,
        actionText: 'View Truck Details',
        metadata: {
          truckId: event.truckId,
          truckOwnerId: event.truckOwnerId,
          cargoId: event.assignmentDetails.cargoId,
          tripId: event.assignmentDetails.tripId,
        },
        tags: ['driver', 'assignment', 'truck'],
      });

      this.logger.log(`Successfully sent driver assignment notification`);
    } catch (error) {
      this.logger.error(`Error handling driver.assigned event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('bid.submitted')
  async handleBidSubmitted(event: BidSubmittedEvent) {
    this.logger.log(`Handling bid.submitted event for bid ${event.bidId}`);

    try {
      if (!this.isValidUuid(event.cargoOwnerId)) {
        this.logger.warn(
          `Skipping bid.submitted notification: invalid cargoOwnerId="${event.cargoOwnerId}" for bid ${event.bidId}`,
        );
        return;
      }

      await this.notificationService.createNotification({
        tenantId: event.tenantId,
        recipientId: event.cargoOwnerId,
        entityType: EntityType.CARGO,
        entityId: event.cargoId,
        notificationType: NotificationType.GENERAL,
        category: NotificationCategory.CARGO,
        priority: NotificationPriority.NORMAL,
        title: 'New Bid Submitted for Your Cargo',
        message: `A new bid of $${event.bidDetails.amount} has been submitted for your cargo. ${event.bidDetails.notes ? `Note: ${event.bidDetails.notes}` : ''} Review and accept the bid to proceed.`,
        shortMessage: `New bid: $${event.bidDetails.amount}`,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        requiresAction: true,
        actionUrl: `/dashboard/cargos`,
        actionText: 'Review Bids',
        metadata: {
          bidId: event.bidId,
          cargoId: event.cargoId,
          truckOwnerId: event.truckOwnerId,
          bidAmount: event.bidDetails.amount,
        },
        tags: ['bid', 'cargo', 'review-required'],
      });

      this.logger.log(`Successfully sent bid submission notification to cargo owner`);
    } catch (error) {
      this.logger.error(`Error handling bid.submitted event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('bid.accepted')
  async handleBidAccepted(event: BidAcceptedEvent) {
    this.logger.log(`Handling bid.accepted event for bid ${event.bidId}`);

    try {
      // Notify truck owner
      await this.notificationService.createNotification({
        tenantId: event.tenantId,
        recipientId: event.truckOwnerId,
        entityType: EntityType.CARGO,
        entityId: event.cargoId,
        notificationType: NotificationType.GENERAL,
        category: NotificationCategory.CARGO,
        priority: NotificationPriority.HIGH,
        title: 'Your Bid Has Been Accepted!',
        message: `Congratulations! Your bid of $${event.bidDetails.amount} for cargo "${event.bidDetails.cargoTitle}" has been accepted. Route: ${event.bidDetails.origin} → ${event.bidDetails.destination}. Prepare for delivery.`,
        shortMessage: `Bid accepted: $${event.bidDetails.amount}`,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        requiresAction: true,
        actionUrl: `/dashboard/cargos`,
        actionText: 'View Cargo Details',
        metadata: {
          bidId: event.bidId,
          cargoId: event.cargoId,
          cargoOwnerId: event.cargoOwnerId,
        },
        tags: ['bid', 'accepted', 'delivery-preparation'],
      });

      // Notify driver if assigned
      if (event.driverId) {
        await this.notificationService.createNotification({
          tenantId: event.tenantId,
          recipientId: event.driverId,
          entityType: EntityType.CARGO,
          entityId: event.cargoId,
          notificationType: NotificationType.DRIVER_TRIP_START,
          category: NotificationCategory.DRIVER,
          priority: NotificationPriority.HIGH,
          title: 'New Delivery Assignment',
          message: `You have been assigned to deliver cargo "${event.bidDetails.cargoTitle}". Route: ${event.bidDetails.origin} → ${event.bidDetails.destination}. Prepare for the trip.`,
          shortMessage: `New delivery: ${event.bidDetails.cargoTitle}`,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          requiresAction: true,
          actionUrl: `/dashboard/cargos`,
          actionText: 'View Delivery Details',
          metadata: {
            bidId: event.bidId,
            cargoId: event.cargoId,
            truckOwnerId: event.truckOwnerId,
          },
          tags: ['delivery', 'assignment', 'driver'],
        });
      }

      this.logger.log(`Successfully sent bid acceptance notifications`);
    } catch (error) {
      this.logger.error(`Error handling bid.accepted event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('trip.started')
  async handleTripStarted(event: TripStartedEvent) {
    this.logger.log(`Handling trip.started event for trip ${event.tripId}`);

    try {
      // Notify cargo owner
      await this.notificationService.createNotification({
        tenantId: event.tenantId,
        recipientId: event.cargoOwnerId,
        entityType: EntityType.TRIP,
        entityId: event.tripId,
        notificationType: NotificationType.TRIP_STARTED,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.HIGH,
        title: 'Trip Has Started',
        message: `Your cargo "${event.tripDetails.cargoTitle}" is now in transit. Route: ${event.tripDetails.origin} → ${event.tripDetails.destination}. Estimated arrival: ${event.tripDetails.estimatedArrival.toLocaleString()}. Track progress in real-time.`,
        shortMessage: `Trip started: ${event.tripDetails.cargoTitle}`,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        requiresAction: true,
        actionUrl: event.tripDetails.trackingUrl || `/dashboard/tracking`,
        actionText: 'Track Shipment',
        metadata: {
          tripId: event.tripId,
          driverId: event.driverId,
          truckOwnerId: event.truckOwnerId,
        },
        tags: ['trip', 'started', 'tracking'],
      });

      // Notify truck owner
      await this.notificationService.createNotification({
        tenantId: event.tenantId,
        recipientId: event.truckOwnerId,
        entityType: EntityType.TRIP,
        entityId: event.tripId,
        notificationType: NotificationType.TRIP_STARTED,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.NORMAL,
        title: 'Trip Has Started',
        message: `Trip for cargo "${event.tripDetails.cargoTitle}" has started. Route: ${event.tripDetails.origin} → ${event.tripDetails.destination}. Monitor driver progress.`,
        shortMessage: `Trip started: ${event.tripDetails.cargoTitle}`,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        requiresAction: false,
        actionUrl: `/dashboard/trips`,
        actionText: 'View Trip',
        metadata: {
          tripId: event.tripId,
          driverId: event.driverId,
          cargoOwnerId: event.cargoOwnerId,
        },
        tags: ['trip', 'started', 'monitoring'],
      });

      this.logger.log(`Successfully sent trip started notifications`);
    } catch (error) {
      this.logger.error(`Error handling trip.started event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('trip.completed')
  async handleTripCompleted(event: TripCompletedEvent) {
    this.logger.log(`Handling trip.completed event for trip ${event.tripId}`);

    try {
      // Notify cargo owner
      await this.notificationService.createNotification({
        tenantId: event.tenantId,
        recipientId: event.cargoOwnerId,
        entityType: EntityType.TRIP,
        entityId: event.tripId,
        notificationType: NotificationType.TRIP_COMPLETED,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.HIGH,
        title: 'Trip Completed Successfully',
        message: `Your cargo "${event.tripDetails.cargoTitle}" has been delivered successfully. Route: ${event.tripDetails.origin} → ${event.tripDetails.destination}. Completed at: ${event.tripDetails.completedAt.toLocaleString()}. ${event.tripDetails.distance ? `Distance: ${event.tripDetails.distance}km.` : ''} ${event.tripDetails.duration ? `Duration: ${Math.round(event.tripDetails.duration / 60)}h.` : ''}`,
        shortMessage: `Trip completed: ${event.tripDetails.cargoTitle}`,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        requiresAction: true,
        actionUrl: `/dashboard/trips`,
        actionText: 'View Trip Summary',
        metadata: {
          tripId: event.tripId,
          driverId: event.driverId,
          truckOwnerId: event.truckOwnerId,
        },
        tags: ['trip', 'completed', 'success'],
      });

      // Notify truck owner
      await this.notificationService.createNotification({
        tenantId: event.tenantId,
        recipientId: event.truckOwnerId,
        entityType: EntityType.TRIP,
        entityId: event.tripId,
        notificationType: NotificationType.TRIP_COMPLETED,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.NORMAL,
        title: 'Trip Completed',
        message: `Trip for cargo "${event.tripDetails.cargoTitle}" has been completed. Route: ${event.tripDetails.origin} → ${event.tripDetails.destination}. Well done!`,
        shortMessage: `Trip completed: ${event.tripDetails.cargoTitle}`,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        requiresAction: false,
        actionUrl: `/dashboard/trips`,
        actionText: 'View Trip',
        metadata: {
          tripId: event.tripId,
          driverId: event.driverId,
          cargoOwnerId: event.cargoOwnerId,
        },
        tags: ['trip', 'completed'],
      });

      this.logger.log(`Successfully sent trip completed notifications`);
    } catch (error) {
      this.logger.error(`Error handling trip.completed event: ${error.message}`, error.stack);
    }
  }

  @OnEvent('cargo.receiver.assigned')
  async handleCargoReceiverAssigned(event: CargoReceiverAssignedEvent) {
    this.logger.log(
      `Handling cargo.receiver.assigned for cargo ${event.cargoId} → receiver ${event.receiverId}`,
    );

    try {
      const receiver = await this.userRepository.findOne({
        where: { id: event.receiverId },
        relations: ['profile'],
      });

      if (!receiver) {
        this.logger.warn(`Receiver ${event.receiverId} not found — skipping notification`);
        return;
      }

      const receiverName =
        [receiver.profile?.firstName, receiver.profile?.lastName]
          .filter(Boolean)
          .join(' ') || receiver.email;
      const route = `${event.assignmentDetails.origin} → ${event.assignmentDetails.destination}`;
      const title = 'Cargo Assigned for Delivery Inspection';
      const message =
        `${event.assignmentDetails.cargoOwnerName} assigned you to receive cargo ` +
        `"${event.assignmentDetails.cargoTitle}" (${route}). ` +
        `Please review the cargo details and complete the delivery inspection when it arrives.`;
      const shortMessage = `New cargo assigned: ${event.assignmentDetails.cargoTitle}`;

      const notification = this.notificationRepository.create({
        recipientId: event.receiverId,
        tenantId: event.tenantId,
        notificationType: NotificationType.CARGO_DELIVERY_UPDATE,
        category: NotificationCategory.CARGO,
        priority: NotificationPriority.HIGH,
        title,
        message,
        shortMessage,
        entityType: EntityType.CARGO,
        entityId: event.cargoId,
        channels: [
          NotificationChannel.IN_APP,
          NotificationChannel.EMAIL,
          NotificationChannel.SMS,
        ],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: true,
        actionUrl: '/dashboard/cargos/my-cargos',
        actionText: 'View Assigned Cargo',
        metadata: {
          cargoId: event.cargoId,
          cargoOwnerId: event.cargoOwnerId,
          cargoTitle: event.assignmentDetails.cargoTitle,
          origin: event.assignmentDetails.origin,
          destination: event.assignmentDetails.destination,
          recipientEmail: receiver.email,
          recipientPhone: receiver.phone,
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

      const saved = await this.notificationRepository.save(notification);
      this.eventsGateway.emitNotification(event.receiverId, saved);

      if (receiver.email) {
        try {
          await this.emailService.sendGenericEmail({
            to: receiver.email,
            subject: title,
            textBody: message,
          });
        } catch (error) {
          this.logger.error(
            `Failed email notify receiver ${receiver.email}: ${error.message}`,
          );
        }
      }

      const phone = receiver.phone?.trim();
      if (phone) {
        try {
          await this.smsService.sendSms(
            phone,
            `UrutiX: ${shortMessage}. Route: ${route}. Open your dashboard to review.`,
          );
        } catch (error) {
          this.logger.error(
            `Failed SMS notify receiver ${phone}: ${error.message}`,
          );
        }
      }

      try {
        await this.messengerService.sendMessage(
          event.cargoOwnerId,
          event.receiverId,
          message,
          event.tenantId,
          {
            loadId: event.cargoId,
            senderRole: MessageRole.CARGO_OWNER,
          },
        );
      } catch (error) {
        this.logger.error(
          `Failed messenger notify receiver ${event.receiverId}: ${error.message}`,
        );
      }

      this.logger.log(
        `Successfully sent cargo assignment notifications to receiver ${receiverName} (${event.receiverId})`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling cargo.receiver.assigned event: ${error.message}`,
        error.stack,
      );
    }
  }

  private isValidUuid(value?: string | null): boolean {
    if (!value || typeof value !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}
