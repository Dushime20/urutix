import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { Truck } from '../../entities/truck.entity';
import { User } from '../../entities/user.entity';
import { TenantSubscription } from '../../entities/tenant-subscription.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripStatusDto } from './dto/update-trip-status.dto';
import { UserProfile } from '../../entities/user-profile.entity';
import { NotificationService } from '../notifications/services/notification.service';
import { NotificationType, NotificationCategory, NotificationChannel, EntityType } from '../../entities/notification.entity';
import { CreditService } from '../../services/credit.service';
import { UserRole } from '../../entities/user.entity';
import { SubscriptionStatus } from '../../entities/tenant-subscription.entity';
import { EmailService } from '../auth/services/email.service';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TenantSubscription)
    private readonly tenantSubscriptionRepository: Repository<TenantSubscription>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly notificationService: NotificationService,
    private readonly creditService: CreditService,
    private readonly eventEmitter: EventEmitter2,
    private readonly emailService: EmailService,
  ) { }

  async create(createTripDto: CreateTripDto, tenantId: string): Promise<Trip> {
    const trip = this.tripRepository.create({
      ...createTripDto,
      tenantId,
      tripNumber: `TRIP-${Date.now()}`,
    });

    return this.tripRepository.save(trip);
  }

  async findAll(
    query: any,
    tenantId: string,
    userId?: string,
  ): Promise<{ trips: Trip[]; pagination: any }> {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    try {
      const queryBuilder = this.tripRepository
        .createQueryBuilder('trip')
        .leftJoinAndSelect('trip.truck', 'truck')
        .leftJoinAndSelect('trip.driver', 'driver')
        .leftJoinAndSelect('trip.load', 'load')
        .leftJoinAndSelect('trip.pickupLocation', 'pickupLocation')
        .leftJoinAndSelect('trip.deliveryLocation', 'deliveryLocation');

      // Filter by tenant and/or user
      if (userId) {
        // For specific user, show trips they own or are assigned to
        queryBuilder.where('trip.tenantId = :tenantId', { tenantId })
          .andWhere(
            new Brackets((qb) => {
              qb.where('truck.ownerId = :userId', { userId })
                .orWhere('driver.userId = :userId', { userId });
            })
          );
      } else {
        // For no specific user, show all tenant trips
        queryBuilder.where('trip.tenantId = :tenantId', { tenantId });
      }

      if (status) {
        queryBuilder.andWhere('trip.status = :status', { status });
      }

      if (search) {
        queryBuilder.andWhere(
          '(trip.tripNumber ILIKE :search OR trip.notes ILIKE :search)',
          {
            search: `%${search}%`,
          },
        );
      }

      const [trips, total] = await queryBuilder
        .orderBy('trip.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        trips,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching trips:', error);
      throw error;
    }
  }

  async findOne(id: string, tenantId: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id, tenantId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  async assignDriver(id: string, driverId: string, tenantId: string): Promise<Trip> {
    const trip = await this.findOne(id, tenantId);
    trip.driverId = driverId;
    const savedTrip = await this.tripRepository.save(trip);

    // Send driver assignment notifications (fire-and-forget)
    this.sendDriverAssignmentNotifications(savedTrip, driverId, tenantId).catch(err =>
      this.logger.error(`Failed to send driver assignment notifications: ${err.message}`, err.stack),
    );

    return savedTrip;
  }

  async getActiveTrips(tenantId: string): Promise<Trip[]> {
    return this.tripRepository.find({
      where: {
        tenantId,
        status: TripStatus.IN_PROGRESS,
      },
    });
  }

  async getMyTrips(
    userId: string,
    tenantId: string,
  ): Promise<{ current: Trip | null; upcoming: Trip[]; history: Trip[] }> {
    // Find the driver record linked to this user
    const trips = await this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('trip.truck', 'truck')
      .leftJoinAndSelect('trip.load', 'load')
      .leftJoinAndSelect('trip.pickupLocation', 'pickupLocation')
      .leftJoinAndSelect('trip.deliveryLocation', 'deliveryLocation')
      .where('trip.tenantId = :tenantId', { tenantId })
      .andWhere('driver.userId = :userId', { userId })
      .orderBy('trip.plannedStartTime', 'DESC')
      .getMany();

    const current = trips.find(
      (t) => t.status === TripStatus.IN_PROGRESS,
    ) || null;

    const upcoming = trips.filter(
      (t) => t.status === TripStatus.PLANNED || t.status === TripStatus.DELAYED,
    );

    const history = trips.filter(
      (t) => t.status === TripStatus.COMPLETED || t.status === TripStatus.CANCELLED,
    );

    return { current, upcoming, history };
  }

  async updateTripStatus(
    id: string,
    updateTripStatusDto: UpdateTripStatusDto,
    tenantId: string,
  ): Promise<Trip> {
    const trip = await this.findOne(id, tenantId);
    const oldStatus = trip.status;

    trip.status = updateTripStatusDto.status;
    if (updateTripStatusDto.actualStartTime) {
      trip.actualStartTime = updateTripStatusDto.actualStartTime;
    }
    if (updateTripStatusDto.actualEndTime) {
      trip.actualEndTime = updateTripStatusDto.actualEndTime;
    }

    const savedTrip = await this.tripRepository.save(trip);

    // CREDIT DEDUCTION: Deduct credits only on the very first start (PLANNED → IN_PROGRESS).
    // DELAYED → IN_PROGRESS (resume) must NOT re-deduct.
    if (
      updateTripStatusDto.status === TripStatus.IN_PROGRESS &&
      oldStatus === TripStatus.PLANNED
    ) {
      this.deductCreditsForTripStart(savedTrip.id, tenantId).catch(err =>
        this.logger.error(`Credit deduction failed for trip ${savedTrip.id}: ${err.message}`, err.stack),
      );
    }

    // Send notification if status changed to IN_PROGRESS (Loaded)
    if (updateTripStatusDto.status === TripStatus.IN_PROGRESS && oldStatus !== TripStatus.IN_PROGRESS) {
      // Emit event for notification system
      this.emitTripStartedEvent(savedTrip).catch(err => 
        this.logger.error(`Failed to emit trip.started event: ${err.message}`, err.stack)
      );
      
      // Legacy notification (can be removed once event system is verified)
      this.sendLoadedNotification(savedTrip.id, tenantId).catch(err => console.error('Failed to send loaded notification', err));
    }

    // Send notification if status changed to COMPLETED
    if (updateTripStatusDto.status === TripStatus.COMPLETED && oldStatus !== TripStatus.COMPLETED) {
      // Emit event for notification system
      this.emitTripCompletedEvent(savedTrip).catch(err =>
        this.logger.error(`Failed to emit trip.completed event: ${err.message}`, err.stack)
      );
      
      // Legacy notification (can be removed once event system is verified)
      this.sendTripCompletedNotifications(savedTrip.id, tenantId).catch(err => console.error('Failed to send completed notifications', err));
    }

    return savedTrip;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const trip = await this.findOne(id, tenantId);
    await this.tripRepository.softDelete(id);
  }

  async getTripAnalytics(tenantId: string, userId?: string): Promise<any> {
    const queryBuilder = this.tripRepository
      .createQueryBuilder('trip')
      .where('trip.tenantId = :tenantId', { tenantId });

    if (userId) {
      queryBuilder.andWhere('trip.driverId = :userId', { userId });
    }

    const trips = await queryBuilder.getMany();

    const totalTrips = trips.length;
    const completedTrips = trips.filter(
      (t) => t.status === TripStatus.COMPLETED,
    ).length;
    const inProgressTrips = trips.filter(
      (t) => t.status === TripStatus.IN_PROGRESS,
    ).length;
    const plannedTrips = trips.filter(
      (t) => t.status === TripStatus.PLANNED,
    ).length;

    return {
      totalTrips,
      completedTrips,
      inProgressTrips,
      plannedTrips,
      completionRate: totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0,
    };
  }

  private async deductCreditsForTripStart(tripId: string, tenantId: string): Promise<void> {
    try {
      // IDEMPOTENCY GUARD: bail out if credits were already deducted for this trip
      const alreadyCharged = await this.creditService.isTripAlreadyCharged(tripId, tenantId);
      if (alreadyCharged) {
        this.logger.warn(`[TripsService] Credits already deducted for trip ${tripId} — skipping duplicate deduction`);
        return;
      }

      // Load trip with related load and truck
      const trip = await this.tripRepository.findOne({
        where: { id: tripId },
        relations: ['load', 'truck'],
      });

      if (!trip || !trip.load || !trip.truck) {
        this.logger.warn(`[TripsService] Cannot deduct credits for trip ${tripId}: missing load or truck`);
        return;
      }

      // Get tenant admin user
      const tenantAdminUser = await this.userRepository.findOne({
        where: { tenantId, role: UserRole.TENANT_ADMIN },
      });

      if (!tenantAdminUser) {
        this.logger.warn(`[TripsService] Tenant admin not found for tenant ${tenantId}, skipping credit deduction`);
        return;
      }

      // Get tenant admin's active subscription plan
      let tenantAdminSubscription = await this.tenantSubscriptionRepository.findOne({
        where: {
          tenantId,
          userId: IsNull(), // Tenant-level subscription
          status: SubscriptionStatus.ACTIVE,
        },
        relations: ['plan'],
        order: { createdAt: 'DESC' },
      });

      // Fallback: try user-level subscription for tenant admin
      if (!tenantAdminSubscription) {
        tenantAdminSubscription = await this.tenantSubscriptionRepository.findOne({
          where: {
            tenantId,
            userId: tenantAdminUser.id,
            status: SubscriptionStatus.ACTIVE,
          },
          relations: ['plan'],
          order: { createdAt: 'DESC' },
        });
      }

      if (!tenantAdminSubscription || !tenantAdminSubscription.plan) {
        this.logger.warn(`[TripsService] No active subscription plan for tenant ${tenantId}, skipping credit deduction`);
        return;
      }

      const cargoWeightTons = trip.load.weight / 1000; // kg → tons
      const creditsPerTonTenant = Number(tenantAdminSubscription.plan.creditsPerTonTenant);
      const creditsPerTonTruckOwner = Number(tenantAdminSubscription.plan.creditsPerTonTruckOwner);

      this.logger.log(`[TripsService] Trip ${tripId} started - deducting credits:`);
      this.logger.log(`  - Cargo weight: ${cargoWeightTons.toFixed(2)} tons`);
      this.logger.log(`  - Subscription plan: ${tenantAdminSubscription.plan.name}`);
      this.logger.log(`  - Tenant admin rate: ${creditsPerTonTenant} credits/ton`);
      this.logger.log(`  - Truck owner rate: ${creditsPerTonTruckOwner} credits/ton`);

      await this.creditService.consumeCreditsForBid({
        tenantId,
        tenantAdminUserId: tenantAdminUser.id,
        truckOwnerUserId: trip.truck.ownerId,
        cargoWeightTons,
        creditsPerTonTenant,
        creditsPerTonTruckOwner,
        bidId: tripId,
        loadId: trip.loadId,
        loadTitle: trip.load.title,
        referenceType: 'TRIP', // stored as referenceType in credit_transactions for idempotency lookup
      });

      this.logger.log(`[TripsService] Credit deduction successful for trip ${tripId}`);

      // Send credit deduction notifications to truck owner and tenant admin
      const tenantCreditsDeducted = Math.ceil(cargoWeightTons * creditsPerTonTenant);
      const truckOwnerCreditsDeducted = Math.ceil(cargoWeightTons * creditsPerTonTruckOwner);
      this.sendCreditDeductionNotifications({
        tenantId,
        tenantAdminUser,
        truckOwnerId: trip.truck.ownerId,
        tripNumber: trip.tripNumber,
        tripId,
        loadTitle: trip.load.title,
        cargoWeightTons,
        tenantCreditsDeducted,
        truckOwnerCreditsDeducted,
      }).catch(err =>
        this.logger.error(`Credit notification failed for trip ${tripId}: ${err.message}`, err.stack),
      );
    } catch (error) {
      this.logger.error(`[TripsService] Credit deduction failed for trip ${tripId}: ${error.message}`, error.stack);
      // We do NOT re-throw here — the trip status has already been saved.
      // A failed credit deduction should be logged and handled separately (e.g. retry queue).
    }
  }

  private async sendLoadedNotification(tripId: string, tenantId: string): Promise<void> {
    try {
      const trip = await this.tripRepository.findOne({
        where: { id: tripId },
        relations: ['driver', 'truck', 'truck.owner', 'truck.owner.profile', 'load'],
      });

      if (!trip || !trip.load || !trip.truck || !trip.driver) return;

      const driverName = `${trip.driver.firstName} ${trip.driver.lastName}`.trim();
      
      let truckOwnerName = 'Truck Owner';
      if (trip.truck.owner?.profile) {
        truckOwnerName = `${trip.truck.owner.profile.firstName} ${trip.truck.owner.profile.lastName}`.trim();
      }

      await this.notificationService.createNotification({
        userId: trip.load.cargoOwnerId,
        tenantId,
        subject: 'Cargo Loaded & Ready',
        content: `Driver ${driverName} from ${truckOwnerName} has loaded your cargo "${trip.load.title}", make advance payment to start your trip`,
        type: NotificationType.GENERAL,
        category: NotificationCategory.FINANCIAL,
        channel: NotificationChannel.IN_APP,
        actionUrl: '/dashboard/payments',
        actionText: 'Make Payment',
        metadata: {
          entityType: EntityType.TRIP,
          entityId: trip.id,
        },
      } as any);
    } catch (error) {
      console.error('Error in sendLoadedNotification:', error);
    }
  }

  private async sendTripCompletedNotifications(tripId: string, tenantId: string): Promise<void> {
    try {
      const trip = await this.tripRepository.findOne({
        where: { id: tripId },
        relations: ['driver', 'truck', 'truck.owner', 'load'],
      });

      if (!trip || !trip.load) return;

      const notifications = [];

      // 1. Cargo Owner
      if (trip.load.cargoOwnerId) {
        notifications.push({
          userId: trip.load.cargoOwnerId,
          subject: 'Shipment Delivered',
          content: `Your shipment "${trip.load.title || 'Shipment'}" has been delivered successfully.`,
        });
      }

      // 2. Receiver (if exists)
      if (trip.load.receiverId) {
        notifications.push({
          userId: trip.load.receiverId,
          subject: 'Shipment Arrived',
          content: `Shipment "${trip.load.title || 'Shipment'}" has arrived at your location.`,
        });
      }

      // 3. Truck Owner (if exists)
      if (trip.truck && trip.truck.ownerId) {
        let driverName = 'Unknown Driver';
        if (trip.driver) {
          driverName = `${trip.driver.firstName} ${trip.driver.lastName}`.trim();
        }
        
        notifications.push({
          userId: trip.truck.ownerId,
          subject: 'Trip Completed',
          content: `Trip ${trip.tripNumber} has been completed by driver ${driverName}.`,
        });
      }

      for (const notif of notifications) {
        await this.notificationService.createNotification({
          userId: notif.userId,
          tenantId,
          subject: notif.subject,
          content: notif.content,
          type: NotificationType.TRIP_COMPLETED,
          category: NotificationCategory.TRIP,
          channel: NotificationChannel.IN_APP,
          actionUrl: `/dashboard/trips/${trip.id}`,
          actionText: 'View Trip Details',
          metadata: {
            entityType: EntityType.TRIP,
            entityId: trip.id,
          },
        } as any);
      }
      
      console.log(`Sent completion notifications for trip ${tripId} to ${notifications.length} recipients`);
      
    } catch (error) {
      console.error('Error sending completion notifications:', error);
    }
  }

  /**
   * Emit trip.started event for notification system
   */
  private async emitTripStartedEvent(trip: Trip): Promise<void> {
    try {
      const [load, truck, driver] = await Promise.all([
        trip.loadId ? this.loadRepository.findOne({ where: { id: trip.loadId } }) : null,
        trip.truckId ? this.truckRepository.findOne({ where: { id: trip.truckId } }) : null,
        trip.driverId ? this.userRepository.findOne({ where: { id: trip.driverId }, relations: ['profile'] }) : null,
      ]);

      const driverName = driver?.profile
        ? `${driver.profile.firstName || ''} ${driver.profile.lastName || ''}`.trim() || driver.email
        : 'Driver';

      this.eventEmitter.emit('trip.started', {
        tripId: trip.id,
        driverId: trip.driverId,
        driverName,
        cargoOwnerId: load?.cargoOwnerId,
        truckOwnerId: truck?.ownerId,
        tenantId: trip.tenantId,
        cargoTitle: load?.title || load?.cargoType,
        startLocation: trip.currentLocation,
        estimatedArrival: trip.plannedEndTime,
      });

      this.logger.log(`Emitted trip.started event for trip ${trip.id}`);
    } catch (error) {
      this.logger.error(`Failed to emit trip.started event: ${error.message}`, error.stack);
    }
  }

  /**
   * Emit trip.completed event for notification system
   */
  private async emitTripCompletedEvent(trip: Trip): Promise<void> {
    try {
      const [load, truck, driver] = await Promise.all([
        trip.loadId ? this.loadRepository.findOne({ where: { id: trip.loadId } }) : null,
        trip.truckId ? this.truckRepository.findOne({ where: { id: trip.truckId } }) : null,
        trip.driverId ? this.userRepository.findOne({ where: { id: trip.driverId }, relations: ['profile'] }) : null,
      ]);

      const driverName = driver?.profile
        ? `${driver.profile.firstName || ''} ${driver.profile.lastName || ''}`.trim() || driver.email
        : 'Driver';

      this.eventEmitter.emit('trip.completed', {
        tripId: trip.id,
        driverId: trip.driverId,
        driverName,
        cargoOwnerId: load?.cargoOwnerId,
        truckOwnerId: truck?.ownerId,
        tenantId: trip.tenantId,
        cargoTitle: load?.title || load?.cargoType,
        deliveryLocation: load?.deliveryLocation,
        completedAt: trip.actualEndTime || new Date(),
      });

      this.logger.log(`Emitted trip.completed event for trip ${trip.id}`);
    } catch (error) {
      this.logger.error(`Failed to emit trip.completed event: ${error.message}`, error.stack);
    }
  }

  /**
   * Send in-app + email notifications to truck owner and tenant admin when credits are deducted.
   */
  private async sendCreditDeductionNotifications(params: {
    tenantId: string;
    tenantAdminUser: User;
    truckOwnerId: string;
    tripNumber: string;
    tripId: string;
    loadTitle: string;
    cargoWeightTons: number;
    tenantCreditsDeducted: number;
    truckOwnerCreditsDeducted: number;
  }): Promise<void> {
    const {
      tenantId, tenantAdminUser, truckOwnerId, tripNumber, tripId,
      loadTitle, cargoWeightTons, tenantCreditsDeducted, truckOwnerCreditsDeducted,
    } = params;

    // Fetch truck owner user
    const truckOwnerUser = await this.userRepository.findOne({
      where: { id: truckOwnerId },
      relations: ['profile'],
    });

    const tenantAdminName = tenantAdminUser.profile
      ? `${(tenantAdminUser as any).profile?.firstName || ''} ${(tenantAdminUser as any).profile?.lastName || ''}`.trim() || tenantAdminUser.email
      : tenantAdminUser.email;

    const truckOwnerName = truckOwnerUser?.profile
      ? `${(truckOwnerUser as any).profile?.firstName || ''} ${(truckOwnerUser as any).profile?.lastName || ''}`.trim() || truckOwnerUser?.email
      : truckOwnerUser?.email || 'Truck Owner';

    const weightDisplay = cargoWeightTons.toFixed(2);

    // ── 1. Notify Truck Owner ──────────────────────────────────────────────
    await this.notificationService.createNotification({
      userId: truckOwnerId,
      tenantId,
      subject: '💳 Credits Deducted – Trip Started',
      content: `${truckOwnerCreditsDeducted} credits have been deducted from your account for trip ${tripNumber} (cargo: "${loadTitle}", ${weightDisplay} tons). This covers your job payment for this trip.`,
      type: NotificationType.PAYMENT,
      category: NotificationCategory.FINANCIAL,
      channel: NotificationChannel.IN_APP,
      priority: 'HIGH' as any,
      actionUrl: `/dashboard/credits`,
      actionText: 'View Credit Balance',
      metadata: {
        tripId,
        tripNumber,
        creditsDeducted: truckOwnerCreditsDeducted,
        role: 'TRUCK_OWNER',
        entityType: EntityType.TRIP,
        entityId: tripId,
      },
    } as any);

    // ── 2. Notify Tenant Admin ─────────────────────────────────────────────
    await this.notificationService.createNotification({
      userId: tenantAdminUser.id,
      tenantId,
      subject: '💳 Credits Deducted – Trip Started',
      content: `${tenantCreditsDeducted} credits have been deducted from your account as operational cost for trip ${tripNumber} (cargo: "${loadTitle}", ${weightDisplay} tons). You also earned ${truckOwnerCreditsDeducted} credits from the truck owner's payment.`,
      type: NotificationType.PAYMENT,
      category: NotificationCategory.FINANCIAL,
      channel: NotificationChannel.IN_APP,
      priority: 'HIGH' as any,
      actionUrl: `/dashboard/credits`,
      actionText: 'View Credit Balance',
      metadata: {
        tripId,
        tripNumber,
        creditsDeducted: tenantCreditsDeducted,
        creditsEarned: truckOwnerCreditsDeducted,
        role: 'TENANT_ADMIN',
        entityType: EntityType.TRIP,
        entityId: tripId,
      },
    } as any);

    this.logger.log(`[TripsService] Credit deduction in-app notifications sent for trip ${tripId}`);

    // ── 3. Email – Truck Owner ─────────────────────────────────────────────
    if (truckOwnerUser?.email) {
      await this.sendCreditDeductionEmail({
        email: truckOwnerUser.email,
        recipientName: truckOwnerName,
        role: 'truck_owner',
        tripNumber,
        tripId,
        loadTitle,
        weightDisplay,
        creditsDeducted: truckOwnerCreditsDeducted,
        creditsEarned: 0,
      });
    }

    // ── 4. Email – Tenant Admin ────────────────────────────────────────────
    if (tenantAdminUser.email) {
      await this.sendCreditDeductionEmail({
        email: tenantAdminUser.email,
        recipientName: tenantAdminName,
        role: 'tenant_admin',
        tripNumber,
        tripId,
        loadTitle,
        weightDisplay,
        creditsDeducted: tenantCreditsDeducted,
        creditsEarned: truckOwnerCreditsDeducted,
      });
    }
  }

  /**
   * Send credit deduction email via SMTP.
   */
  private async sendCreditDeductionEmail(params: {
    email: string;
    recipientName: string;
    role: 'truck_owner' | 'tenant_admin';
    tripNumber: string;
    tripId: string;
    loadTitle: string;
    weightDisplay: string;
    creditsDeducted: number;
    creditsEarned: number;
  }): Promise<void> {
    const { email, recipientName, role, tripNumber, tripId, loadTitle, weightDisplay, creditsDeducted, creditsEarned } = params;
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const creditsUrl = `${frontendUrl}/dashboard/credits`;
      const fromAddress = process.env.SMTP_USER || 'noreply@urutix.com';

      const roleLabel = role === 'tenant_admin' ? 'Operational Cost' : 'Job Payment';
      const earnedRow = role === 'tenant_admin' && creditsEarned > 0
        ? `<tr><td style="padding: 10px 14px; font-weight: bold; color: #333;">Credits Earned</td><td style="padding: 10px 14px; color: #16a34a;">+${creditsEarned} credits (from truck owner)</td></tr>`
        : '';

      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #dc2626; padding: 24px; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 22px;">💳 Credits Deducted</h1>
            </div>
            <div style="padding: 28px;">
              <p style="font-size: 16px; color: #333;">Hi <strong>${recipientName}</strong>,</p>
              <p style="color: #555;">Credits have been deducted from your account as a trip has started. Here are the details:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: #f8f9fa;">
                  <td style="padding: 10px 14px; font-weight: bold; color: #333; width: 45%;">Trip Number</td>
                  <td style="padding: 10px 14px; color: #555;">${tripNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: bold; color: #333;">Cargo</td>
                  <td style="padding: 10px 14px; color: #555;">${loadTitle}</td>
                </tr>
                <tr style="background: #f8f9fa;">
                  <td style="padding: 10px 14px; font-weight: bold; color: #333;">Cargo Weight</td>
                  <td style="padding: 10px 14px; color: #555;">${weightDisplay} tons</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: bold; color: #333;">Deduction Type</td>
                  <td style="padding: 10px 14px; color: #555;">${roleLabel}</td>
                </tr>
                <tr style="background: #f8f9fa;">
                  <td style="padding: 10px 14px; font-weight: bold; color: #333;">Credits Deducted</td>
                  <td style="padding: 10px 14px; color: #dc2626; font-weight: bold;">-${creditsDeducted} credits</td>
                </tr>
                ${earnedRow}
              </table>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${creditsUrl}" style="background: #1a56db; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: bold;">View Credit Balance</a>
              </div>
              <p style="color: #888; font-size: 13px;">If you have questions about this deduction, please contact your platform administrator.</p>
            </div>
            <div style="background: #f8f9fa; padding: 16px; text-align: center; color: #aaa; font-size: 12px;">
              © ${new Date().getFullYear()} UrutiX Smart Logistics. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `;

      const netLine = role === 'tenant_admin' && creditsEarned > 0
        ? `\nCredits Earned: +${creditsEarned} credits (from truck owner)\nNet: ${creditsEarned - creditsDeducted} credits`
        : '';

      await (this.emailService as any).transporter?.sendMail({
        from: fromAddress,
        to: email,
        subject: `Credits Deducted – Trip ${tripNumber} Started | UrutiX`,
        text: `Hi ${recipientName},\n\nCredits have been deducted for trip ${tripNumber}.\nCargo: ${loadTitle} (${weightDisplay} tons)\nDeduction Type: ${roleLabel}\nCredits Deducted: -${creditsDeducted} credits${netLine}\n\nView balance: ${creditsUrl}\n\nUrutiX Smart Logistics`,
        html,
      });

      this.logger.log(`[TripsService] Credit deduction email sent to ${email}`);
    } catch (error) {
      this.logger.error(`[TripsService] Failed to send credit deduction email to ${email}: ${error.message}`);
    }
  }

  /**
   * Send in-app + email notifications to a driver when they are assigned to a trip.
   */
  private async sendDriverAssignmentNotifications(trip: Trip, driverId: string, tenantId: string): Promise<void> {
    try {
      // Load full trip details with relations
      const fullTrip = await this.tripRepository.findOne({
        where: { id: trip.id },
        relations: ['load', 'truck'],
      });

      const driver = await this.userRepository.findOne({
        where: { id: driverId },
        relations: ['profile'],
      });

      if (!driver) {
        this.logger.warn(`[TripsService] Driver ${driverId} not found, skipping assignment notifications`);
        return;
      }

      const driverName = driver.profile
        ? `${driver.profile.firstName || ''} ${driver.profile.lastName || ''}`.trim() || driver.email
        : driver.email;

      const cargoTitle = fullTrip?.load?.title || fullTrip?.load?.cargoType || 'Cargo';
      const truckPlate = fullTrip?.truck?.plateNumber || 'N/A';
      const pickupDate = fullTrip?.plannedStartTime
        ? new Date(fullTrip.plannedStartTime).toLocaleDateString('en-US', { dateStyle: 'medium' })
        : 'TBD';

      // 1. In-app notification
      await this.notificationService.createNotification({
        userId: driverId,
        tenantId,
        subject: '🚛 New Trip Assignment',
        content: `You have been assigned to trip ${trip.tripNumber}. Cargo: "${cargoTitle}", Truck: ${truckPlate}. Planned start: ${pickupDate}.`,
        type: NotificationType.DRIVER_ASSIGNMENT,
        category: NotificationCategory.TRIP,
        channel: NotificationChannel.IN_APP,
        priority: 'HIGH' as any,
        actionUrl: `/dashboard/driver/trips?tripId=${trip.id}`,
        actionText: 'View Trip',
        metadata: {
          tripId: trip.id,
          tripNumber: trip.tripNumber,
          entityType: EntityType.TRIP,
          entityId: trip.id,
        },
      } as any);

      this.logger.log(`[TripsService] In-app notification sent to driver ${driverId} for trip ${trip.id}`);

      // 2. Email notification
      if (driver.email) {
        await this.sendDriverAssignmentEmail(driver.email, driverName, trip, cargoTitle, truckPlate, pickupDate);
      }
    } catch (error) {
      this.logger.error(`[TripsService] sendDriverAssignmentNotifications failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Send driver assignment email via SMTP.
   */
  private async sendDriverAssignmentEmail(
    email: string,
    driverName: string,
    trip: Trip,
    cargoTitle: string,
    truckPlate: string,
    pickupDate: string,
  ): Promise<void> {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const tripUrl = `${frontendUrl}/dashboard/driver/trips?tripId=${trip.id}`;
      const fromAddress = process.env.SMTP_USER || 'noreply@urutix.com';

      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #1a56db; padding: 24px; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 22px;">🚛 New Trip Assignment</h1>
            </div>
            <div style="padding: 28px;">
              <p style="font-size: 16px; color: #333;">Hi <strong>${driverName}</strong>,</p>
              <p style="color: #555;">You have been assigned to a new trip. Here are the details:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: #f8f9fa;">
                  <td style="padding: 10px 14px; font-weight: bold; color: #333; width: 40%;">Trip Number</td>
                  <td style="padding: 10px 14px; color: #555;">${trip.tripNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: bold; color: #333;">Cargo</td>
                  <td style="padding: 10px 14px; color: #555;">${cargoTitle}</td>
                </tr>
                <tr style="background: #f8f9fa;">
                  <td style="padding: 10px 14px; font-weight: bold; color: #333;">Truck</td>
                  <td style="padding: 10px 14px; color: #555;">${truckPlate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: bold; color: #333;">Planned Start</td>
                  <td style="padding: 10px 14px; color: #555;">${pickupDate}</td>
                </tr>
              </table>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${tripUrl}" style="background: #1a56db; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: bold;">View Trip Details</a>
              </div>
              <p style="color: #888; font-size: 13px;">Please log in to your driver dashboard to review the full trip details and prepare accordingly.</p>
            </div>
            <div style="background: #f8f9fa; padding: 16px; text-align: center; color: #aaa; font-size: 12px;">
              © ${new Date().getFullYear()} UrutiX Smart Logistics. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `Hi ${driverName},\n\nYou have been assigned to trip ${trip.tripNumber}.\nCargo: ${cargoTitle}\nTruck: ${truckPlate}\nPlanned Start: ${pickupDate}\n\nView trip: ${tripUrl}\n\nUrutiX Smart Logistics`;

      await (this.emailService as any).transporter?.sendMail({
        from: fromAddress,
        to: email,
        subject: `New Trip Assignment - ${trip.tripNumber} | UrutiX`,
        text,
        html,
      });

      this.logger.log(`[TripsService] Assignment email sent to driver ${email} for trip ${trip.id}`);
    } catch (error) {
      this.logger.error(`[TripsService] Failed to send assignment email to ${email}: ${error.message}`);
      // Non-fatal — in-app notification already sent
    }
  }
}
