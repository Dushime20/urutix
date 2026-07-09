import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OnEvent } from '@nestjs/event-emitter';

import { Trip, TripStatus } from '../../../entities/trip.entity';
import { Load } from '../../../entities/load.entity';
import { Payment, PaymentStatus, PaymentType, PaymentMethod } from '../../../entities/payment.entity';
import { Epod, EpodStatus } from '../../../entities/epod.entity';
import { User } from '../../../entities/user.entity';
import { Truck } from '../../../entities/truck.entity';
import { NotificationService } from '../../notifications/services/notification.service';
import { PaymentNotificationService } from '../../notifications/services/payment-notification.service';
import {
  NotificationType,
  NotificationCategory,
  NotificationChannel,
} from '../../../entities/notification.entity';

@Injectable()
export class TripCompletionService {
  private readonly logger = new Logger(TripCompletionService.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Epod)
    private readonly epodRepository: Repository<Epod>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    private readonly notificationService: NotificationService,
    private readonly paymentNotificationService: PaymentNotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Listen to trip.completed events emitted from any path:
   * - updateTripStatus() in TripsService
   * - completeTrip() in TripsController
   * - driver service updates
   * - loads.service delivery completion
   * - tracking gateway status updates
   *
   * This ensures a PENDING payment is always created for the cargo owner
   * regardless of which code path completed the trip.
   * handleTripCompletion() is idempotent — it skips if a payment already exists.
   */
  @OnEvent('trip.completed', { async: true })
  async onTripCompleted(event: { tripId: string; tenantId: string; cargoOwnerId?: string }): Promise<void> {
    if (!event?.tripId || !event?.tenantId) return;
    try {
      await this.handleTripCompletion(event.tripId, event.tenantId, 'EPOD_SUBMISSION');
      this.logger.log(`[onTripCompleted] Pending payment ensured for trip ${event.tripId}`);
    } catch (err: any) {
      // Non-fatal — trip completion already succeeded; payment creation is best-effort here.
      // handleTripCompletion logs its own errors.
      this.logger.error(`[onTripCompleted] Payment creation failed for trip ${event.tripId}: ${err.message}`);
    }
  }

  /**
   * Handle trip completion and create pending payment for cargo owner
   * This is called when:
   * 1. ePOD is submitted by driver
   * 2. Cargo receiver confirms delivery
   */
  async handleTripCompletion(
    tripId: string,
    tenantId: string,
    triggeredBy: 'EPOD_SUBMISSION' | 'CARGO_RECEIVER_CONFIRMATION' = 'EPOD_SUBMISSION',
  ): Promise<{ payment: Payment; invoice?: any }> {
    this.logger.log(`Handling trip completion for trip ${tripId}, triggered by: ${triggeredBy}`);

    // Get trip with all necessary relations
    const trip = await this.tripRepository.findOne({
      where: { id: tripId, tenantId },
      relations: ['load', 'truck', 'truck.owner'],
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (!trip.load) {
      throw new NotFoundException('Load not found for trip');
    }

    // Check if payment already exists to avoid duplicates
    const existingPayment = await this.paymentRepository.findOne({
      where: {
        tripId,
        tenantId,
        paymentType: PaymentType.TRIP_PAYMENT,
      },
    });

    if (existingPayment) {
      this.logger.log(`Payment already exists for trip ${tripId}: ${existingPayment.id}`);
      return { payment: existingPayment };
    }

    // Get cargo owner and truck owner details
    const cargoOwner = await this.userRepository.findOne({
      where: { id: trip.load.cargoOwnerId },
      relations: ['profile'],
    });

    const truckOwner = trip.truck?.ownerId
      ? await this.userRepository.findOne({
          where: { id: trip.truck.ownerId },
          relations: ['profile'],
        })
      : null;

    if (!cargoOwner) {
      throw new NotFoundException('Cargo owner not found');
    }

    if (!truckOwner) {
      throw new NotFoundException('Truck owner not found');
    }

    // Calculate payment amount (use agreed price from trip)
    const paymentAmount = Number(trip.agreedPrice) || 0;
    if (paymentAmount <= 0) {
      throw new Error('Invalid trip agreed price for payment creation');
    }

    // Calculate due date (Net 30 days from completion)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create pending payment for cargo owner to pay truck owner
    const payment = this.paymentRepository.create({
      tripId,
      tenantId,
      payerId: cargoOwner.id, // Cargo owner pays
      payeeId: truckOwner.id, // Truck owner receives
      amount: paymentAmount,
      currency: trip.currencyCode || 'RWF',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentType: PaymentType.TRIP_PAYMENT,
      status: PaymentStatus.PENDING,
      dueDate,
      description: `Payment for cargo delivery - ${trip.load.title || trip.load.cargoType}`,
      referenceNumber: `PAY-${trip.tripNumber || tripId.slice(-8).toUpperCase()}`,
      metadata: {
        tripCompletionTriggeredBy: triggeredBy,
        cargoTitle: trip.load.title || trip.load.cargoType,
        truckOwnerId: truckOwner.id,
        cargoOwnerId: cargoOwner.id,
        completedAt: new Date().toISOString(),
        automaticallyCreated: true,
      },
    });

    const savedPayment = await this.paymentRepository.save(payment);
    this.logger.log(`Created pending payment ${savedPayment.id} for trip ${tripId}`);

    // Send professional payment notifications using PaymentNotificationService
    await this.paymentNotificationService.sendPaymentCreatedNotifications(
      savedPayment,
      trip,
      cargoOwner,
      truckOwner,
      tenantId,
    );

    // Emit payment created event
    this.eventEmitter.emit('payment.created', {
      paymentId: savedPayment.id,
      tripId,
      cargoOwnerId: cargoOwner.id,
      truckOwnerId: truckOwner.id,
      amount: paymentAmount,
      tenantId,
      dueDate,
      triggeredBy,
    });

    return { payment: savedPayment };
  }

  /**
   * Handle cargo receiver confirmation
   * This creates/updates pending payment and marks it as confirmed by receiver
   */
  async handleCargoReceiverConfirmation(
    tripId: string,
    tenantId: string,
    receiverId: string,
  ): Promise<Payment> {
    this.logger.log(`Handling cargo receiver confirmation for trip ${tripId} by receiver ${receiverId}`);

    // First ensure trip completion payment is created
    const { payment } = await this.handleTripCompletion(tripId, tenantId, 'CARGO_RECEIVER_CONFIRMATION');

    // ── Mark the load as DELIVERED now that the receiver has confirmed ────────
    // The inspection in ReceiversService already does this, but we guard here
    // as a safety net for any flow that reaches this method directly.
    try {
      const trip = await this.tripRepository.findOne({
        where: { id: tripId },
        relations: ['load'],
      });
      if (trip?.load) {
        const { LoadStatus } = await import('../../../entities/load.entity');
        if (trip.load.status !== LoadStatus.DELIVERED && trip.load.status !== LoadStatus.COMPLETED) {
          trip.load.status = LoadStatus.DELIVERED;
          await this.loadRepository.save(trip.load);
          this.logger.log(`Load ${trip.load.id} status set to DELIVERED via cargo receiver confirmation`);
        }
      }
    } catch (err) {
      this.logger.error(`Failed to mark load as DELIVERED during receiver confirmation: ${err.message}`);
      // Non-fatal — payment was already saved
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Update payment metadata to include receiver confirmation
    payment.metadata = {
      ...payment.metadata,
      receiverConfirmedAt: new Date().toISOString(),
      receiverConfirmedBy: receiverId,
      receiverConfirmationStatus: 'CONFIRMED',
    };

    const updatedPayment = await this.paymentRepository.save(payment);

    // Get receiver details for notification
    const receiver = await this.userRepository.findOne({
      where: { id: receiverId },
      relations: ['profile'],
    });

    // Send additional notification about receiver confirmation
    if (receiver) {
      await this.notificationService.createNotification({
        userId: payment.payerId, // Notify cargo owner
        tenantId,
        subject: '✅ Cargo Delivery Confirmed - Payment Due',
        content: `Cargo receiver has confirmed delivery. Payment of ${payment.currency} ${payment.amount} is now due by ${payment.dueDate?.toLocaleDateString()}.`,
        type: NotificationType.PAYMENT_DUE,
        category: NotificationCategory.FINANCIAL,
        channel: NotificationChannel.IN_APP,
        priority: 'HIGH' as any,
        actionUrl: `/dashboard/pending-payments`,
        actionText: 'Pay Now',
        metadata: {
          paymentId: payment.id,
          tripId,
          receiverConfirmed: true,
          receiverName: receiver.profile?.firstName ?
            `${receiver.profile.firstName} ${receiver.profile.lastName}`.trim() :
            receiver.email
        },
      } as any);
    }

    this.logger.log(`Updated payment ${payment.id} with receiver confirmation`);
    return updatedPayment;
  }

  /**
   * Get pending payments for cargo owner dashboard
   * Returns PENDING and PROCESSING payments so in-flight payments are visible
   * and the cargo owner cannot attempt to pay the same trip twice.
   */
  async getPendingPaymentsForCargoOwner(
    cargoOwnerId: string,
    tenantId: string,
  ): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: [
        {
          payerId: cargoOwnerId,
          tenantId,
          status: PaymentStatus.PENDING,
          paymentType: PaymentType.TRIP_PAYMENT,
        },
        {
          payerId: cargoOwnerId,
          tenantId,
          status: PaymentStatus.PROCESSING,
          paymentType: PaymentType.TRIP_PAYMENT,
        },
      ],
      relations: ['trip', 'trip.load'],
      order: { dueDate: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Get expected payments for truck owner dashboard
   * Returns PENDING and PROCESSING payments (both direct and lender-disbursed)
   */
  async getExpectedPaymentsForTruckOwner(
    truckOwnerId: string,
    tenantId: string,
  ): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: [
        {
          payeeId: truckOwnerId,
          tenantId,
          status: PaymentStatus.PENDING,
          paymentType: PaymentType.TRIP_PAYMENT,
        },
        {
          payeeId: truckOwnerId,
          tenantId,
          status: PaymentStatus.PROCESSING,
          paymentType: PaymentType.TRIP_PAYMENT,
        },
      ],
      relations: ['trip', 'trip.load'],
      order: { dueDate: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Get completed/received payments for truck owner transaction history.
   * Combines payeeId-linked completed payments AND lender disbursements
   * matched by receiver phone number.
   */
  async getCompletedPaymentsForTruckOwner(
    truckOwnerId: string,
    tenantId: string,
  ): Promise<Payment[]> {
    // 1. payeeId-linked completed payments
    const byPayeeId = await this.paymentRepository.find({
      where: {
        payeeId: truckOwnerId,
        tenantId,
        status: PaymentStatus.COMPLETED,
      },
      relations: ['trip', 'trip.load'],
      order: { processedAt: 'DESC', createdAt: 'DESC' },
    });

    // 2. Lender disbursements matched by receiver phone (may not have payeeId set)
    const user = await this.userRepository.findOne({ where: { id: truckOwnerId } });
    let byPhone: Payment[] = [];
    if (user?.phone) {
      const digits = user.phone.replace(/\D/g, '');
      byPhone = await this.paymentRepository
        .createQueryBuilder('payment')
        .leftJoinAndSelect('payment.trip', 'trip')
        .leftJoinAndSelect('trip.load', 'load')
        .where(`payment.metadata->>'isLenderPayment' = 'true'`)
        .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .andWhere(
          `regexp_replace(payment.metadata->>'receiverPhoneNumber', '\\D', '', 'g') LIKE :phone`,
          { phone: `%${digits.slice(-9)}` },
        )
        .orderBy('payment.processedAt', 'DESC')
        .addOrderBy('payment.createdAt', 'DESC')
        .getMany();
    }

    // Merge and deduplicate
    const seen = new Set<string>();
    const merged: Payment[] = [];
    for (const p of [...byPayeeId, ...byPhone]) {
      if (!seen.has(p.id)) { seen.add(p.id); merged.push(p); }
    }
    merged.sort((a, b) => {
      const aTime = new Date(a.processedAt || a.createdAt).getTime();
      const bTime = new Date(b.processedAt || b.createdAt).getTime();
      return bTime - aTime;
    });
    return merged;
  }

  /**
   * Get completed payments made by the cargo owner (transaction history).
   * Returns all COMPLETED payments where the cargo owner was the payer,
   * ordered newest first. Includes trip, load, and route info.
   */
  async getCompletedPaymentsForCargoOwner(
    cargoOwnerId: string,
    tenantId: string,
  ): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: {
        payerId: cargoOwnerId,
        tenantId,
        status: PaymentStatus.COMPLETED,
      },
      relations: ['trip', 'trip.load'],
      order: { processedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Get ALL received payments for a truck owner — including lender disbursements
   * sent directly to their phone (metadata.receiverPhoneNumber matches user.phone).
   * Combines: payeeId-linked payments + lender momo disbursements.
   */
  async getAllReceivedPaymentsForTruckOwner(
    truckOwnerId: string,
    tenantId: string,
    status?: PaymentStatus,
  ): Promise<Payment[]> {
    // 1. Normal payeeId-linked payments
    const byPayeeId = await this.paymentRepository.find({
      where: {
        payeeId: truckOwnerId,
        ...(status ? { status } : {}),
      },
      relations: ['trip', 'trip.load'],
      order: { createdAt: 'DESC' },
    });

    // 2. Lender disbursements matched by receiver phone
    const user = await this.userRepository.findOne({ where: { id: truckOwnerId } });
    let byPhone: Payment[] = [];
    if (user?.phone) {
      // Normalise to digits only so 078... matches 25078...
      const digits = user.phone.replace(/\D/g, '');
      byPhone = await this.paymentRepository
        .createQueryBuilder('payment')
        .leftJoinAndSelect('payment.trip', 'trip')
        .leftJoinAndSelect('trip.load', 'load')
        .where(`payment.metadata->>'isLenderPayment' = 'true'`)
        .andWhere(
          `regexp_replace(payment.metadata->>'receiverPhoneNumber', '\\D', '', 'g') LIKE :phone`,
          { phone: `%${digits.slice(-9)}` },  // last 9 digits covers 078xxx and 25078xxx
        )
        .andWhere(status ? 'payment.status = :status' : '1=1', status ? { status } : {})
        .orderBy('payment.createdAt', 'DESC')
        .getMany();
    }

    // Merge, deduplicate by id, sort newest first
    const seen = new Set<string>();
    const merged: Payment[] = [];
    for (const p of [...byPayeeId, ...byPhone]) {
      if (!seen.has(p.id)) { seen.add(p.id); merged.push(p); }
    }
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return merged;
  }
}