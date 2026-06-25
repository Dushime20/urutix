import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { NotificationService } from '../notification.service';
import {
  CargoCreatedEvent,
  BidSubmittedEvent,
  BidAcceptedEvent,
  DriverAssignedEvent,
  TripStartedEvent,
  TripCompletedEvent,
} from '../events/cargo-events';
import {
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationChannel,
  EntityType,
} from '../../../entities/notification.entity';

@Injectable()
export class CargoNotificationListener {
  private readonly logger = new Logger(CargoNotificationListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
}
