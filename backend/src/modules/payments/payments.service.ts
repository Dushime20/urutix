import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Payment } from '../../entities/payment.entity';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { Bid, BidStatus } from '../../entities/bid.entity';
import { Truck, VehicleStatus } from '../../entities/truck.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AdvancePaymentRequestDto } from './dto/advance-payment-request.dto';
import {
  PaymentStatus,
  PaymentType,
  PaymentMethod,
} from '../../entities/payment.entity';
import { PaymentProvider } from './types/payment.types';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { PaymentProcessingService } from './services/payment-processing.service';
import { EscrowService } from './services/escrow.service';
import { AuditService } from './services/audit.service';
import { FraudDetectionService } from './services/fraud-detection.service';
import { WebhookService } from './services/webhook.service';
import { MicroLendingService } from './services/micro-lending.service';
import { TenantPaymentConfigService } from './services/tenant-payment-config.service';
import { TransactionStateService } from './services/transaction-state.service';
import { ProviderIntegrationService } from './services/provider-integration.service';
import { IdempotencyService } from './services/idempotency.service';
import { ReconciliationService } from './services/reconciliation.service';
import { InvoiceReceiptService } from './services/invoice-receipt.service';
import { TripsService } from '../trips/trips.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  // Reconciliation: compare internal and provider records
  async reconcilePayments(providerPayments: any[]): Promise<any[]> {
    const internalPayments = await this.paymentRepository.find();
    const mismatches = await this.reconciliationService.reconcile(
      providerPayments,
      internalPayments,
    );
    await this.reconciliationService.logReconciliationResult(mismatches);
    return mismatches;
  }

  // Batch fraud analysis for audit or reconciliation
  async batchFraudCheck(): Promise<
    { payment: Payment; suspicious: boolean }[]
  > {
    const payments = await this.paymentRepository.find();
    return this.fraudDetectionService.batchCheck(payments);
  }
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Bid)
    private readonly bidRepository: Repository<Bid>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    // New modular services
    private readonly paymentProcessingService: PaymentProcessingService,
    private readonly escrowService: EscrowService,
    private readonly auditService: AuditService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly webhookService: WebhookService,
    private readonly microLendingService: MicroLendingService,
    private readonly tenantPaymentConfigService: TenantPaymentConfigService,
    private readonly transactionStateService: TransactionStateService,
    private readonly providerIntegrationService: ProviderIntegrationService,
    private readonly idempotencyService: IdempotencyService,
    private readonly reconciliationService: ReconciliationService,
    private readonly invoiceReceiptService?: InvoiceReceiptService,
    private readonly tripsService?: TripsService,
    private readonly eventEmitter?: EventEmitter2,
  ) {}

  async createPayment(
    createPaymentDto: CreatePaymentDto & { idempotencyKey?: string },
    tenantId: string,
    userId: string,
  ): Promise<Payment> {
    // Verify trip exists and user has permission (only if tripId is provided and valid)
    let trip = null;
    if (createPaymentDto.tripId && typeof createPaymentDto.tripId === 'string' && createPaymentDto.tripId.trim() !== '') {
      trip = await this.tripRepository.findOne({
        where: { id: createPaymentDto.tripId, tenantId },
        relations: ['load'],
      });
      if (!trip) throw new NotFoundException('Trip not found');
      
      // Check if this is a lender payment (from metadata)
      const isLenderPayment = createPaymentDto.metadata && 
        (typeof createPaymentDto.metadata === 'object' && createPaymentDto.metadata !== null) &&
        (createPaymentDto.metadata as any).isLenderPayment === true;
      
      // Only check cargo owner permission if it's not a lender payment
      if (!isLenderPayment && trip.load.cargoOwnerId !== userId) {
        throw new ForbiddenException(
          'You can only create payments for your own trips',
        );
      }
      
      // Check if payment already exists for this trip (only for non-lender payments to avoid blocking retries)
      if (!isLenderPayment) {
        const existingPayment = await this.paymentRepository.findOne({
          where: { tripId: createPaymentDto.tripId, tenantId },
        });
        if (existingPayment)
          throw new ConflictException('Payment already exists for this trip');
      }
    }

    // Idempotency check
    if (createPaymentDto.idempotencyKey) {
      await this.idempotencyService.checkAndSaveKey(
        createPaymentDto.idempotencyKey,
        createPaymentDto.tripId,
      );
    }

    // Look up accepted bid for this trip's load to get advance payment preferences (only if trip exists)
    let advancePaymentPercentage: number | undefined;
    let requireAdvancePayment: boolean = true; // Default to requiring advance payment
    if (trip && trip.loadId) {
      try {
        const acceptedBid = await this.bidRepository.findOne({
          where: {
            loadId: trip.loadId,
            status: BidStatus.ACCEPTED,
          },
          order: { updatedAt: 'DESC' }, // Get the most recently accepted bid
        });
        if (acceptedBid) {
          requireAdvancePayment = acceptedBid.requireAdvancePayment !== undefined 
            ? acceptedBid.requireAdvancePayment 
            : true; // Default to true if not specified
          if (acceptedBid.advancePaymentPercentage !== undefined && acceptedBid.advancePaymentPercentage !== null) {
            advancePaymentPercentage = acceptedBid.advancePaymentPercentage;
            this.logger.log(
              `Using advance payment percentage ${advancePaymentPercentage}% from bid ${acceptedBid.id}`,
            );
          }
          this.logger.log(
            `Bid ${acceptedBid.id} requireAdvancePayment: ${requireAdvancePayment}`,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Could not find accepted bid for load ${trip?.loadId}, using default advance payment settings`,
        );
      }
    }

    // Escrow split (using bid percentage or default 70/30) if required and advance payment is enabled
    let advance = createPaymentDto.amount,
      final = 0;
    if (createPaymentDto.paymentType === PaymentType.ADVANCE && requireAdvancePayment) {
      const split = await this.escrowService.splitAdvanceFinal(
        createPaymentDto.amount,
        advancePaymentPercentage,
      );
      advance = split.advance;
      final = split.final;
    } else if (createPaymentDto.paymentType === PaymentType.ADVANCE && !requireAdvancePayment) {
      // If advance payment is not required, don't split - just create a single payment
      this.logger.log(
        `Advance payment not required for this trip. Creating single payment without split.`,
      );
      advance = createPaymentDto.amount;
      final = 0;
    }

    // Create advance payment
    // Only include tripId if it's provided
    const paymentData: any = {
      amount: advance,
      tenantId,
      payerId: userId,
      status: PaymentStatus.PENDING,
      metadata: createPaymentDto.metadata
        ? typeof createPaymentDto.metadata === 'string'
          ? JSON.parse(createPaymentDto.metadata)
          : createPaymentDto.metadata
        : {},
      idempotencyKey: createPaymentDto.idempotencyKey,
      paymentType: PaymentType.ADVANCE,
      currency: createPaymentDto.currency,
      paymentMethod: createPaymentDto.paymentMethod,
      description: createPaymentDto.description,
      referenceNumber: createPaymentDto.referenceNumber,
    };
    
    // Only include tripId if it's provided and valid
    if (createPaymentDto.tripId && typeof createPaymentDto.tripId === 'string' && createPaymentDto.tripId.trim() !== '') {
      paymentData.tripId = createPaymentDto.tripId;
    }
    
    const payment = this.paymentRepository.create(paymentData);
    const savedPaymentResult = await this.paymentRepository.save(payment);
    // Handle case where save might return array (shouldn't happen, but TypeScript thinks it might)
    const savedPayment = Array.isArray(savedPaymentResult) ? savedPaymentResult[0] : savedPaymentResult;
    await this.auditService.log('CREATE_PAYMENT', savedPayment);
    // Optionally create final payment record (not paid yet)
    if (final > 0) {
      const finalPaymentData: any = {
        amount: final,
        paymentType: PaymentType.FINAL,
        tenantId,
        payerId: userId,
        status: PaymentStatus.ESCROW,
        currency: createPaymentDto.currency,
        paymentMethod: createPaymentDto.paymentMethod,
        description: createPaymentDto.description,
        referenceNumber: createPaymentDto.referenceNumber,
        metadata: createPaymentDto.metadata
          ? typeof createPaymentDto.metadata === 'string'
            ? JSON.parse(createPaymentDto.metadata)
            : createPaymentDto.metadata
          : {},
        idempotencyKey: createPaymentDto.idempotencyKey,
      };
      
      // Only include tripId if it's provided and valid
      if (createPaymentDto.tripId && typeof createPaymentDto.tripId === 'string' && createPaymentDto.tripId.trim() !== '') {
        finalPaymentData.tripId = createPaymentDto.tripId;
      }
      
      const finalPayment = this.paymentRepository.create(finalPaymentData);
      await this.paymentRepository.save(finalPayment);
    }
    return savedPayment;
  }

  async findAllPayments(
    tenantId: string,
    userId?: string,
    filter?: PaymentFilterDto,
  ): Promise<Payment[]> {
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.trip', 'trip')
      .leftJoinAndSelect('trip.load', 'load')
      .where('payment.tenantId = :tenantId', { tenantId });

    if (userId) {
      query.andWhere('payment.payerId = :userId', { userId });
    }

    // Apply filters
    if (filter) {
      if (filter.status) {
        query.andWhere('payment.status = :status', { status: filter.status });
      }

      if (filter.paymentType) {
        query.andWhere('payment.paymentType = :paymentType', {
          paymentType: filter.paymentType,
        });
      }

      if (filter.paymentMethod) {
        query.andWhere('payment.paymentMethod = :paymentMethod', {
          paymentMethod: filter.paymentMethod,
        });
      }

      if (filter.startDate && filter.endDate) {
        query.andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
          startDate: filter.startDate,
          endDate: filter.endDate,
        });
      }

      if (filter.minAmount !== undefined) {
        query.andWhere('payment.amount >= :minAmount', {
          minAmount: filter.minAmount,
        });
      }

      if (filter.maxAmount !== undefined) {
        query.andWhere('payment.amount <= :maxAmount', {
          maxAmount: filter.maxAmount,
        });
      }

      if (filter.currency) {
        query.andWhere('payment.currency = :currency', {
          currency: filter.currency,
        });
      }

      if (filter.tripId) {
        query.andWhere('payment.tripId = :tripId', { tripId: filter.tripId });
      }

      query.limit(filter.limit || 20);
      query.offset(filter.offset || 0);
    }

    query.orderBy('payment.createdAt', 'DESC');

    return query.getMany();
  }

  async findOnePayment(
    id: string,
    tenantId: string,
    userId?: string,
  ): Promise<Payment> {
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.trip', 'trip')
      .leftJoinAndSelect('trip.load', 'load')
      .where('payment.id = :id', { id })
      .andWhere('payment.tenantId = :tenantId', { tenantId });

    if (userId) {
      query.andWhere('payment.payerId = :userId', { userId });
    }

    const payment = await query.getOne();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async updatePaymentStatus(
    id: string,
    updatePaymentStatusDto: UpdatePaymentStatusDto,
    tenantId: string,
    userId?: string,
  ): Promise<Payment> {
    const payment = await this.findOnePayment(id, tenantId, userId);

    // Update payment status
    Object.assign(payment, updatePaymentStatusDto);

    // Handle status-specific logic
    if (
      updatePaymentStatusDto.status === PaymentStatus.COMPLETED &&
      !payment.processedAt
    ) {
      payment.processedAt = new Date();
    }

    if (
      updatePaymentStatusDto.status === PaymentStatus.FAILED &&
      !payment.failureReason
    ) {
      payment.failureReason =
        updatePaymentStatusDto.failureReason || 'Payment processing failed';
    }

    const savedPayment = await this.paymentRepository.save(payment);

    // Handle advance payment completion: Update trip and truck status
    if (
      updatePaymentStatusDto.status === PaymentStatus.COMPLETED &&
      payment.paymentType === PaymentType.ADVANCE &&
      payment.tripId
    ) {
      await this.handleAdvancePaymentCompletion(payment.tripId, tenantId);
    }

    return savedPayment;
  }

  /**
   * Handle advance payment completion: Update trip status to IN_PROGRESS and truck status to IN_TRANSIT
   */
  private async handleAdvancePaymentCompletion(
    tripId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Handling advance payment completion for trip ${tripId}`,
      );

      // Find the trip
      const trip = await this.tripRepository.findOne({
        where: { id: tripId, tenantId },
        relations: ['truck'],
      });

      if (!trip) {
        this.logger.warn(`Trip ${tripId} not found for advance payment completion`);
        return;
      }

      // Only update if trip is still in PLANNED status
      if (trip.status !== TripStatus.PLANNED) {
        this.logger.log(
          `Trip ${tripId} is already in status ${trip.status}, skipping status update`,
        );
        return;
      }

      // Find the advance payment that triggered this
      const advancePayment = await this.paymentRepository.findOne({
        where: {
          tripId,
          tenantId,
          paymentType: PaymentType.ADVANCE,
          status: PaymentStatus.COMPLETED,
        },
        order: { processedAt: 'DESC' },
      });

      // Update trip status to IN_PROGRESS via TripsService so credit deduction is triggered
      if (this.tripsService) {
        await this.tripsService.updateTripStatus(
          tripId,
          { status: TripStatus.IN_PROGRESS, actualStartTime: new Date() },
          tenantId,
        );
      } else {
        // Fallback: direct save (credit deduction will not fire in this path)
        trip.status = TripStatus.IN_PROGRESS;
        trip.actualStartTime = new Date();
        await this.tripRepository.save(trip);
      }

      this.logger.log(
        `Trip ${tripId} status updated to IN_PROGRESS`,
      );

      // Update truck status to IN_TRANSIT and set currentTripId
      if (trip.truckId) {
        const truck = await this.truckRepository.findOne({
          where: { id: trip.truckId, tenantId },
        });

        if (truck) {
          truck.status = VehicleStatus.IN_TRANSIT;
          truck.currentTripId = tripId;
          truck.estimatedAvailableTime = trip.plannedEndTime || trip.estimatedEndTime;
          await this.truckRepository.save(truck);

          this.logger.log(
            `Truck ${truck.id} status updated to IN_TRANSIT and assigned to trip ${tripId}`,
          );
        } else {
          this.logger.warn(
            `Truck ${trip.truckId} not found for trip ${tripId}`,
          );
        }
      }

      // Log audit event if payment is found
      if (advancePayment) {
        await this.auditService.log('ADVANCE_PAYMENT_COMPLETED', advancePayment, {
          tripId,
          truckId: trip.truckId,
          description: 'Trip started, truck in transit',
        });
      }
    } catch (error) {
      this.logger.error(
        `Error handling advance payment completion for trip ${tripId}:`,
        error,
      );
      // Don't throw - payment is already saved, this is a side effect
    }
  }

  async processPayment(id: string, tenantId: string): Promise<Payment> {
    const payment = await this.findOnePayment(id, tenantId);

    // Run fraud detection before processing
    const isFraud = await this.fraudDetectionService.check(payment);
    if (isFraud) {
      await this.auditService.log('FRAUD_DETECTED', payment);
      throw new ConflictException('Fraud detected, payment blocked');
    }

    // Map PaymentMethod to PaymentProvider
    const provider = this.mapPaymentMethodToProvider(payment.paymentMethod);

    // Process payment using the payment processing service
    try {
      const processingResult =
        await this.paymentProcessingService.initiatePayment({
          tenant: { id: tenantId } as any, // Simplified for this context
          paymentType: payment.paymentType,
          amount: payment.amount,
          currency: payment.currency,
          provider,
          meta: {
            ...payment.metadata,
            tripId: payment.tripId,
            payerId: payment.payerId,
            description: payment.description,
            referenceNumber: payment.referenceNumber,
            billingAddress: payment.billingAddress,
            notes: payment.notes,
            dueDate: payment.dueDate,
          },
        });

      if (processingResult.success) {
        // For mobile money payments, status should be PROCESSING initially
        // Payment will be marked as COMPLETED when webhook callback is received
        const isMobileMoney = provider === PaymentProvider.MOBILE_MONEY;
        const finalStatus = isMobileMoney ? PaymentStatus.PROCESSING : PaymentStatus.COMPLETED;

        // Update payment with processing results
        const updateData: UpdatePaymentStatusDto = {
          status: finalStatus,
          transactionId: processingResult.transactionId,
          gatewayResponse: isMobileMoney 
            ? 'Mobile Money payment initiated. Waiting for confirmation.' 
            : 'Payment processed successfully',
          processedAt: isMobileMoney ? undefined : new Date(),
          processingFee: processingResult.processingFee,
        };

        const updated = await this.updatePaymentStatus(
          id,
          updateData,
          tenantId,
        );

        // Store reference ID in metadata for webhook matching (for mobile money)
        if (isMobileMoney && processingResult.transactionId) {
          updated.metadata = {
            ...(updated.metadata || {}),
            referenceId: processingResult.transactionId,
            externalId: processingResult.transactionId,
          };
          await this.paymentRepository.save(updated);
        }

        await this.auditService.log('PROCESS_PAYMENT', updated, {
          provider: payment.paymentMethod,
          transactionId: processingResult.transactionId,
          status: finalStatus,
        });

        // Generate invoice and receipt only if payment is completed (not for pending mobile money)
        if (!isMobileMoney) {
          try {
            if (this.invoiceReceiptService) {
              await this.invoiceReceiptService.handlePaymentCompletion(updated);
            }
          } catch (error) {
            // Log but don't fail payment processing
            this.logger.warn('Failed to generate invoice/receipt:', error);
          }
        }

        // Emit payment.received event for notification system
        try {
          if (this.eventEmitter && !isMobileMoney) {
            // Get trip details to find recipient and sender
            const trip = updated.tripId 
              ? await this.tripRepository.findOne({ 
                  where: { id: updated.tripId },
                  relations: ['truck', 'truck.owner', 'load']
                })
              : null;

            if (trip && trip.truck && trip.load) {
              const recipientId = trip.truck.ownerId; // Truck owner receives payment
              const senderId = updated.payerId; // Cargo owner sends payment

              // Get user profiles for names
              const userRepo = this.paymentRepository.manager.getRepository('User');
              const userProfileRepo = this.paymentRepository.manager.getRepository('UserProfile');
              
              const [recipient, sender, recipientProfile, senderProfile] = await Promise.all([
                userRepo.findOne({ where: { id: recipientId } }),
                userRepo.findOne({ where: { id: senderId } }),
                userProfileRepo.findOne({ where: { userId: recipientId } }),
                userProfileRepo.findOne({ where: { userId: senderId } }),
              ]);

              const recipientName = recipientProfile
                ? `${recipientProfile.firstName || ''} ${recipientProfile.lastName || ''}`.trim() || recipient?.email || 'Recipient'
                : recipient?.email || 'Recipient';

              const senderName = senderProfile
                ? `${senderProfile.firstName || ''} ${senderProfile.lastName || ''}`.trim() || sender?.email || 'Sender'
                : sender?.email || 'Sender';

              // Determine payment source
              const paymentSource = updated.metadata?.isLenderPayment ? 'LOAN' : 'WALLET';

              // Emit general payment received event
              this.eventEmitter.emit('payment.received', {
                paymentId: updated.id,
                recipientId,
                recipientName,
                senderId,
                senderName,
                amount: updated.amount,
                tenantId: updated.tenantId,
                paymentSource,
                tripId: updated.tripId,
                cargoTitle: trip.load.title || trip.load.cargoType,
              });

              // If recipient is truck owner, emit specific event
              if (recipient && (recipient.role === 'TRUCK_OWNER' || recipient.role === 'FLEET_MANAGER')) {
                this.eventEmitter.emit('payment.truck.owner.received', {
                  paymentId: updated.id,
                  recipientId,
                  recipientName,
                  senderId,
                  senderName,
                  amount: updated.amount,
                  tenantId: updated.tenantId,
                  paymentSource,
                  tripId: updated.tripId,
                  cargoTitle: trip.load.title || trip.load.cargoType,
                });
              }

              this.logger.log(`Emitted payment events for payment ${updated.id}`);
            }
          }
        } catch (eventError) {
          // Log but don't fail payment processing
          this.logger.warn('Failed to emit payment events:', eventError);
        }

        return updated;
      } else {
        // Handle processing failure
        const updateData: UpdatePaymentStatusDto = {
          status: PaymentStatus.FAILED,
          gatewayResponse:
            processingResult.error || 'Payment processing failed',
          processedAt: new Date(),
          failureReason: processingResult.error,
        };

        const updated = await this.updatePaymentStatus(
          id,
          updateData,
          tenantId,
        );
        await this.auditService.log('PAYMENT_FAILED', updated, {
          provider: payment.paymentMethod,
          error: processingResult.error,
          errorCode: processingResult.errorCode,
        });
        return updated;
      }
    } catch (error) {
      await this.auditService.log('PROVIDER_FAILURE', payment, {
        error: error.message,
      });
      throw new ConflictException(
        'Payment processing failed: ' + error.message,
      );
    }
  }

  private mapPaymentMethodToProvider(method: PaymentMethod): PaymentProvider {
    const mapping = {
      [PaymentMethod.DIGITAL_WALLET]: PaymentProvider.MOBILE_MONEY,
      [PaymentMethod.BANK_TRANSFER]: PaymentProvider.BANK_TRANSFER,
      [PaymentMethod.CREDIT_CARD]: PaymentProvider.BANK_TRANSFER,
      [PaymentMethod.DEBIT_CARD]: PaymentProvider.BANK_TRANSFER,
      [PaymentMethod.CASH]: PaymentProvider.BANK_TRANSFER,
      [PaymentMethod.CHECK]: PaymentProvider.BANK_TRANSFER,
      [PaymentMethod.WIRE_TRANSFER]: PaymentProvider.BANK_TRANSFER,
    };
    return mapping[method] || PaymentProvider.BANK_TRANSFER;
  }

  private async simulatePaymentProcessing(payment: Payment): Promise<any> {
    // Simulate payment gateway processing
    // In production, replace with actual payment gateway integration
    const success = Math.random() > 0.1; // 90% success rate for demo

    if (success) {
      return {
        success: true,
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        response: 'Payment processed successfully',
        processingFee: payment.amount * 0.029 + 0.3, // 2.9% + $0.30
      };
    } else {
      return {
        success: false,
        error: 'Insufficient funds or card declined',
        response: 'Payment failed',
      };
    }
  }

  async getPaymentAnalytics(
    tenantId: string,
    userId?: string,
    period?: string,
  ): Promise<any> {
    const payments = await this.findAllPayments(tenantId, userId);

    const totalPayments = payments.length;
    const completedPayments = payments.filter(
      (p) => p.status === PaymentStatus.COMPLETED,
    );
    const pendingPayments = payments.filter(
      (p) => p.status === PaymentStatus.PENDING,
    );
    const failedPayments = payments.filter(
      (p) => p.status === PaymentStatus.FAILED,
    );

    const totalAmount = completedPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const totalProcessingFees = completedPayments.reduce(
      (sum, p) => sum + Number(p.processingFee || 0),
      0,
    );

    const paymentMethods = payments.reduce(
      (acc, payment) => {
        acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const paymentTypes = payments.reduce(
      (acc, payment) => {
        acc[payment.paymentType] = (acc[payment.paymentType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalPayments,
      completedPayments: completedPayments.length,
      pendingPayments: pendingPayments.length,
      failedPayments: failedPayments.length,
      successRate:
        totalPayments > 0
          ? (completedPayments.length / totalPayments) * 100
          : 0,
      totalAmount,
      totalProcessingFees,
      averageAmount:
        completedPayments.length > 0
          ? totalAmount / completedPayments.length
          : 0,
      paymentMethods,
      paymentTypes,
    };
  }

  async refundPayment(
    id: string,
    amount: number,
    reason: string,
    tenantId: string,
  ): Promise<Payment> {
    const originalPayment = await this.findOnePayment(id, tenantId);

    if (originalPayment.status !== PaymentStatus.COMPLETED) {
      throw new ConflictException('Only completed payments can be refunded');
    }

    if (amount > originalPayment.amount) {
      throw new ConflictException(
        'Refund amount cannot exceed original payment amount',
      );
    }

    // Create refund payment
    const refundPayment = this.paymentRepository.create({
      tripId: originalPayment.tripId,
      amount: -amount, // Negative amount for refund
      currency: originalPayment.currency,
      paymentMethod: originalPayment.paymentMethod,
      paymentType: PaymentType.REFUND,
      description: `Refund for payment ${originalPayment.id}: ${reason}`,
      referenceNumber: `REF_${Date.now()}`,
      tenantId,
      payerId: originalPayment.payerId,
      status: PaymentStatus.COMPLETED,
      processedAt: new Date(),
      metadata: { originalPaymentId: originalPayment.id, refundReason: reason },
    });

    return this.paymentRepository.save(refundPayment);
  }

  async getPaymentHistory(
    tripId: string,
    tenantId: string,
  ): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { tripId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async requestAdvancePayment(
    advanceRequestDto: AdvancePaymentRequestDto,
    tenantId: string,
    userId: string,
  ): Promise<Payment> {
    // Verify trip exists and user has permission (truck owner)
    const trip = await this.tripRepository.findOne({
      where: { id: advanceRequestDto.tripId, tenantId },
      relations: ['load', 'truck'],
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Verify user is the truck owner
    if (trip.truck?.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the truck owner can request advance payment for this trip',
      );
    }

    // Check if trip is in a valid state for advance payment
    const validStatuses = ['PLANNED', 'IN_PROGRESS'];
    if (!validStatuses.includes(trip.status)) {
      throw new BadRequestException(
        'Advance payment can only be requested for planned or in-progress trips',
      );
    }

    // Check if advance payment already exists
    const existingAdvance = await this.paymentRepository.findOne({
      where: {
        tripId: advanceRequestDto.tripId,
        tenantId,
        paymentType: PaymentType.ADVANCE,
      },
    });

    if (existingAdvance) {
      throw new ConflictException(
        'Advance payment already exists for this trip',
      );
    }

    // Calculate maximum advance amount (70% of trip value)
    const maxAdvance = trip.agreedPrice * 0.7;
    if (advanceRequestDto.amount > maxAdvance) {
      throw new BadRequestException(
        `Advance amount cannot exceed ${maxAdvance} ${trip.currencyCode || 'USD'}`,
      );
    }

    // Create advance payment request
    const advancePayment = this.paymentRepository.create({
      tripId: advanceRequestDto.tripId,
      tenantId,
      payerId: trip.load.cargoOwnerId, // Cargo owner pays
      amount: advanceRequestDto.amount,
      currency: trip.currencyCode || 'USD',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentType: PaymentType.ADVANCE,
      status: PaymentStatus.PENDING,
      description: `Advance payment request: ${advanceRequestDto.reason}`,
      notes: `Urgency: ${advanceRequestDto.urgency}`,
      metadata: {
        advanceRequest: true,
        urgency: advanceRequestDto.urgency,
        reason: advanceRequestDto.reason,
        requestedBy: userId,
        requestedAt: new Date().toISOString(),
      },
    });

    const savedPayment = await this.paymentRepository.save(advancePayment);
    await this.auditService.log('ADVANCE_PAYMENT_REQUESTED', savedPayment, {
      urgency: advanceRequestDto.urgency,
      reason: advanceRequestDto.reason,
    });

    return savedPayment;
  }

  async getPaymentForecast(
    tenantId: string,
    userId?: string,
    days: number = 30,
  ): Promise<{
    period: string;
    totalUpcoming: number;
    totalPending: number;
    totalOverdue: number;
    payments: Array<{
      id: string;
      tripId: string;
      tripNumber?: string;
      amount: number;
      currency: string;
      dueDate?: Date;
      status: PaymentStatus;
      paymentType: PaymentType;
      daysUntilDue: number;
    }>;
  }> {
    const now = new Date();
    const forecastEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.trip', 'trip')
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere(
        '(payment.dueDate IS NULL OR payment.dueDate <= :forecastEnd)',
        { forecastEnd },
      )
      .andWhere(
        `payment.status IN (:...statuses)`,
        {
          statuses: [
            PaymentStatus.PENDING,
            PaymentStatus.PROCESSING,
            PaymentStatus.ESCROW,
          ],
        },
      );

    if (userId) {
      // For truck owners, get payments where they are the recipient
      // This requires checking if the user is the truck owner of the trip
      query
        .leftJoin('trip.truck', 'truck')
        .andWhere('(truck.ownerId = :userId OR payment.payerId = :userId)', {
          userId,
        });
    }

    const payments = await query
      .orderBy('payment.dueDate', 'ASC')
      .addOrderBy('payment.createdAt', 'ASC')
      .getMany();

    let totalUpcoming = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    const forecastPayments = payments.map((payment) => {
      const dueDate = payment.dueDate || payment.createdAt;
      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const amount = parseFloat(payment.amount.toString()) || 0;

      if (daysUntilDue < 0) {
        totalOverdue += amount;
      } else if (daysUntilDue <= 7) {
        totalUpcoming += amount;
      }

      if (
        payment.status === PaymentStatus.PENDING ||
        payment.status === PaymentStatus.PROCESSING
      ) {
        totalPending += amount;
      }

      return {
        id: payment.id,
        tripId: payment.tripId,
        tripNumber: (payment.trip as any)?.tripNumber,
        amount,
        currency: payment.currency,
        dueDate,
        status: payment.status,
        paymentType: payment.paymentType,
        daysUntilDue,
      };
    });

    return {
      period: `${days} days`,
      totalUpcoming,
      totalPending,
      totalOverdue,
      payments: forecastPayments,
    };
  }
}
