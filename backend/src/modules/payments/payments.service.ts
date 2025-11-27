// ...existing code...
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment } from '../../entities/payment.entity';
import { Trip } from '../../entities/trip.entity';
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

@Injectable()
export class PaymentsService {
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
    // New modular services
    private readonly paymentProcessingService: import('./services/payment-processing.service').PaymentProcessingService,
    private readonly escrowService: import('./services/escrow.service').EscrowService,
    private readonly auditService: import('./services/audit.service').AuditService,
    private readonly fraudDetectionService: import('./services/fraud-detection.service').FraudDetectionService,
    private readonly webhookService: import('./services/webhook.service').WebhookService,
    private readonly microLendingService: import('./services/micro-lending.service').MicroLendingService,
    private readonly tenantPaymentConfigService: import('./services/tenant-payment-config.service').TenantPaymentConfigService,
    private readonly transactionStateService: import('./services/transaction-state.service').TransactionStateService,
    private readonly providerIntegrationService: import('./services/provider-integration.service').ProviderIntegrationService,
    private readonly idempotencyService: import('./services/idempotency.service').IdempotencyService,
    private readonly reconciliationService: import('./services/reconciliation.service').ReconciliationService,
  ) {}

  async createPayment(
    createPaymentDto: CreatePaymentDto & { idempotencyKey?: string },
    tenantId: string,
    userId: string,
  ): Promise<Payment> {
    // Verify trip exists and user has permission
    const trip = await this.tripRepository.findOne({
      where: { id: createPaymentDto.tripId, tenantId },
      relations: ['load'],
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.load.cargoOwnerId !== userId)
      throw new ForbiddenException(
        'You can only create payments for your own trips',
      );
    // Check if payment already exists for this trip
    const existingPayment = await this.paymentRepository.findOne({
      where: { tripId: createPaymentDto.tripId, tenantId },
    });
    if (existingPayment)
      throw new ConflictException('Payment already exists for this trip');

    // Idempotency check
    if (createPaymentDto.idempotencyKey) {
      await this.idempotencyService.checkAndSaveKey(
        createPaymentDto.idempotencyKey,
        createPaymentDto.tripId,
      );
    }

    // Escrow split (70/30) if required
    let advance = createPaymentDto.amount,
      final = 0;
    if (createPaymentDto.paymentType === PaymentType.ADVANCE) {
      const split = await this.escrowService.splitAdvanceFinal(
        createPaymentDto.amount,
      );
      advance = split.advance;
      final = split.final;
    }

    // Create advance payment
    const payment = this.paymentRepository.create({
      ...createPaymentDto,
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
    });
    const savedPayment = await this.paymentRepository.save(payment);
    await this.auditService.log('CREATE_PAYMENT', savedPayment);
    // Optionally create final payment record (not paid yet)
    if (final > 0) {
      const finalPayment = this.paymentRepository.create({
        ...createPaymentDto,
        amount: final,
        paymentType: PaymentType.FINAL,
        tenantId,
        payerId: userId,
        status: PaymentStatus.ESCROW,
        metadata: createPaymentDto.metadata || {},
        idempotencyKey: createPaymentDto.idempotencyKey,
      });
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

    return this.paymentRepository.save(payment);
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
        // Update payment with processing results
        const updateData: UpdatePaymentStatusDto = {
          status: PaymentStatus.COMPLETED,
          transactionId: processingResult.transactionId,
          gatewayResponse: 'Payment processed successfully',
          processedAt: new Date(),
          processingFee: processingResult.processingFee,
        };

        const updated = await this.updatePaymentStatus(
          id,
          updateData,
          tenantId,
        );
        await this.auditService.log('PROCESS_PAYMENT', updated, {
          provider: payment.paymentMethod,
          transactionId: processingResult.transactionId,
        });
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
