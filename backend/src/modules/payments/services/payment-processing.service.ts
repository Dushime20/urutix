import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentProvider, TransactionState } from '../types/payment.types';
import {
  Payment,
  PaymentStatus,
  PaymentType,
  PaymentMethod,
} from '../../../entities/payment.entity';
import { Bid, BidStatus } from '../../../entities/bid.entity';
import { Trip } from '../../../entities/trip.entity';
import { Tenant } from '../../../entities/tenant.entity';
import { ProviderIntegrationService } from './provider-integration.service';
import { EscrowService } from './escrow.service';
import { AuditService } from './audit.service';
import { FraudDetectionService } from './fraud-detection.service';
import { WebhookService } from './webhook.service';
import { MicroLendingService } from './micro-lending.service';
import { TenantPaymentConfigService } from './tenant-payment-config.service';
import { TransactionStateService } from './transaction-state.service';

export interface PaymentProcessingRequest {
  tenant: Tenant;
  paymentType: PaymentType;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  meta?: any;
  idempotencyKey?: string;
}

export interface PaymentProcessingResult {
  success: boolean;
  payment: Payment;
  transactionId?: string;
  processingFee?: number;
  error?: string;
  errorCode?: string;
}

@Injectable()
export class PaymentProcessingService {
  private readonly logger = new Logger(PaymentProcessingService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Bid)
    private readonly bidRepository: Repository<Bid>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    private readonly providerIntegrationService: ProviderIntegrationService,
    private readonly escrowService: EscrowService,
    private readonly auditService: AuditService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly webhookService: WebhookService,
    private readonly microLendingService: MicroLendingService,
    private readonly tenantPaymentConfigService: TenantPaymentConfigService,
    private readonly transactionStateService: TransactionStateService,
  ) {}

  /**
   * Initiate payment processing with comprehensive validation and handling
   */
  async initiatePayment(
    request: PaymentProcessingRequest,
  ): Promise<PaymentProcessingResult> {
    try {
      this.logger.log(
        `Initiating payment for tenant ${request.tenant.id}, amount: ${request.amount} ${request.currency}`,
      );

      // Validate request
      this.validatePaymentRequest(request);

      // Get tenant-specific configuration
      const tenantConfig = await this.tenantPaymentConfigService.getConfig(
        request.tenant,
      );

      // Check fraud detection
      const isFraudulent = await this.runFraudChecks({
        amount: request.amount,
        currency: request.currency,
        tenantId: request.tenant.id,
        meta: request.meta,
      });

      if (isFraudulent) {
        throw new ConflictException(
          'Payment flagged by fraud detection system',
        );
      }

      // Create payment record
      const payment = await this.createPaymentRecord(request, tenantConfig);

      // Update transaction state
      await this.updateTransactionState(payment.id, TransactionState.INITIATED);

      // Process payment based on type
      let result: PaymentProcessingResult;

      if (request.paymentType === PaymentType.ADVANCE) {
        result = await this.processAdvancePayment(payment, request);
      } else if (request.paymentType === PaymentType.FINAL) {
        result = await this.processFinalPayment(payment, request);
      } else {
        result = await this.processStandardPayment(payment, request);
      }

      // Log audit trail
      await this.logAuditTrail(payment, 'PAYMENT_INITIATED', {
        amount: request.amount,
        currency: request.currency,
        provider: request.provider,
        success: result.success,
      });

      return result;
    } catch (error) {
      this.logger.error('Payment initiation failed:', error);
      throw error;
    }
  }

  /**
   * Process advance/final payment split with escrow
   */
  async processEscrowSplit(
    payment: Payment,
  ): Promise<{ advance: Payment; final: Payment }> {
    try {
      this.logger.log(`Processing escrow split for payment ${payment.id}`);

      // Validate payment can be split
      if (payment.paymentType !== PaymentType.TRIP_PAYMENT) {
        throw new BadRequestException(
          'Only trip payments can be split into advance/final',
        );
      }

      // Look up accepted bid for this trip's load to get advance payment percentage
      let advancePaymentPercentage: number | undefined;
      try {
        const trip = await this.tripRepository.findOne({
          where: { id: payment.tripId },
        });
        if (trip) {
          const acceptedBid = await this.bidRepository.findOne({
            where: {
              loadId: trip.loadId,
              status: BidStatus.ACCEPTED,
            },
            order: { updatedAt: 'DESC' }, // Get the most recently accepted bid
          });
          if (acceptedBid?.advancePaymentPercentage !== undefined && acceptedBid.advancePaymentPercentage !== null) {
            advancePaymentPercentage = acceptedBid.advancePaymentPercentage;
            this.logger.log(
              `Using advance payment percentage ${advancePaymentPercentage}% from bid ${acceptedBid.id} for payment ${payment.id}`,
            );
          }
        }
      } catch (error) {
        this.logger.warn(
          `Could not find accepted bid for trip ${payment.tripId}, using default advance payment percentage`,
        );
      }

      // Create escrow payments
      const escrowPayments = await this.escrowService.createEscrowPayments(
        {
          tripId: payment.tripId,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          description: payment.description,
          referenceNumber: payment.referenceNumber,
          billingAddress: payment.billingAddress,
          notes: payment.notes,
          dueDate: payment.dueDate,
          metadata: payment.metadata,
        },
        payment.amount,
        payment.tenantId,
        payment.payerId,
        advancePaymentPercentage,
      );

      // Update transaction states
      await Promise.all([
        this.updateTransactionState(
          escrowPayments.advance.id,
          TransactionState.INITIATED,
        ),
        this.updateTransactionState(
          escrowPayments.final.id,
          TransactionState.ESCROW_HELD,
        ),
      ]);

      // Log audit trail
      await this.logAuditTrail(payment, 'ESCROW_SPLIT_CREATED', {
        advanceAmount: escrowPayments.advance.amount,
        finalAmount: escrowPayments.final.amount,
        totalAmount: payment.amount,
      });

      return escrowPayments;
    } catch (error) {
      this.logger.error(
        `Escrow split failed for payment ${payment.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Offer micro-lending for payment
   */
  async offerMicroLending(payment: Payment): Promise<any> {
    try {
      this.logger.log(`Offering micro-lending for payment ${payment.id}`);

      // Check if payment is eligible for micro-lending
      if (!this.isEligibleForMicroLending(payment)) {
        throw new BadRequestException('Payment not eligible for micro-lending');
      }

      // Get micro-lending offer
      const offer = await this.microLendingService.offerLoan(payment);

      // Log audit trail
      await this.logAuditTrail(payment, 'MICRO_LENDING_OFFERED', {
        offerAmount: offer.amount,
        interestRate: offer.interestRate,
        term: offer.term,
      });

      return offer;
    } catch (error) {
      this.logger.error(
        `Micro-lending offer failed for payment ${payment.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update transaction state with audit trail
   */
  async updateTransactionState(
    paymentId: string,
    state: TransactionState,
  ): Promise<Payment> {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new BadRequestException(`Payment ${paymentId} not found`);
      }

      // Update payment status based on transaction state
      const statusMapping = {
        [TransactionState.INITIATED]: PaymentStatus.PENDING,
        [TransactionState.IN_PROGRESS]: PaymentStatus.PROCESSING,
        [TransactionState.ESCROW_HELD]: PaymentStatus.ESCROW,
        [TransactionState.COMPLETED]: PaymentStatus.COMPLETED,
        [TransactionState.FAILED]: PaymentStatus.FAILED,
        [TransactionState.CANCELLED]: PaymentStatus.CANCELLED,
      };

      payment.status = statusMapping[state];
      payment.metadata = {
        ...payment.metadata,
        transactionState: state,
        lastStateUpdate: new Date().toISOString(),
      };

      const updatedPayment = await this.paymentRepository.save(payment);

      // Log state change
      await this.logAuditTrail(updatedPayment, 'TRANSACTION_STATE_UPDATED', {
        previousState: payment.status,
        newState: updatedPayment.status,
        transactionState: state,
      });

      return updatedPayment;
    } catch (error) {
      this.logger.error(
        `Failed to update transaction state for payment ${paymentId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Handle provider webhook for payment confirmations
   */
  async handleProviderWebhook(
    provider: PaymentProvider,
    payload: any,
  ): Promise<void> {
    try {
      this.logger.log(`Processing webhook from provider ${provider}`);

      // Validate webhook payload
      this.validateWebhookPayload(payload);

      // Extract payment information
      const transactionId = payload.transaction_id || payload.id;
      const status = payload.status;
      const amount = payload.amount;

      // Find payment by transaction ID
      const payment = await this.paymentRepository.findOne({
        where: { transactionId },
      });

      if (!payment) {
        this.logger.warn(
          `Payment not found for transaction ID: ${transactionId}`,
        );
        return;
      }

      // Update payment status based on webhook
      if (status === 'completed' || status === 'success') {
        await this.updateTransactionState(
          payment.id,
          TransactionState.COMPLETED,
        );

        // Release escrow if applicable
        if (payment.status === PaymentStatus.ESCROW) {
          await this.escrowService.releaseEscrow(
            payment,
            'webhook_confirmation',
          );
        }
      } else if (status === 'failed' || status === 'declined') {
        await this.updateTransactionState(payment.id, TransactionState.FAILED);
      }

      // Log webhook processing
      await this.logAuditTrail(payment, 'WEBHOOK_PROCESSED', {
        provider,
        status,
        amount,
        payload: JSON.stringify(payload),
      });
    } catch (error) {
      this.logger.error(
        `Webhook processing failed for provider ${provider}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Run comprehensive fraud checks
   */
  async runFraudChecks(paymentData: any): Promise<boolean> {
    try {
      // Run fraud detection
      const isFraudulent = await this.fraudDetectionService.check(paymentData);

      if (isFraudulent) {
        this.logger.warn(
          `Fraud detected for payment: ${JSON.stringify(paymentData)}`,
        );
      }

      return isFraudulent;
    } catch (error) {
      this.logger.error('Fraud check failed:', error);
      // Fail safe - assume not fraudulent if check fails
      return false;
    }
  }

  /**
   * Log comprehensive audit trail
   */
  async logAuditTrail(
    payment: Payment,
    action: string,
    meta?: any,
  ): Promise<void> {
    try {
      await this.auditService.log(action, payment, {
        timestamp: new Date().toISOString(),
        userId: payment.payerId,
        tenantId: payment.tenantId,
        ...meta,
      });
    } catch (error) {
      this.logger.error(
        `Failed to log audit trail for payment ${payment.id}:`,
        error,
      );
      // Don't throw error for audit logging failures
    }
  }

  /**
   * Get tenant-specific payment configuration
   */
  async getTenantPaymentConfig(tenant: Tenant): Promise<any> {
    try {
      return await this.tenantPaymentConfigService.getConfig(tenant);
    } catch (error) {
      this.logger.error(`Failed to get tenant config for ${tenant.id}:`, error);
      // Return default config
      return {
        escrowEnabled: true,
        advancePercentage: 0.7,
        finalPercentage: 0.3,
        fraudCheckEnabled: true,
        microLendingEnabled: false,
        allowedPaymentMethods: Object.values(PaymentMethod),
        maxAmount: 100000,
        minAmount: 0.01,
      };
    }
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: PaymentProcessingRequest): void {
    if (!request.tenant) {
      throw new BadRequestException('Tenant is required');
    }

    if (!request.amount || request.amount <= 0) {
      throw new BadRequestException('Valid amount is required');
    }

    if (!request.currency || request.currency.length !== 3) {
      throw new BadRequestException('Valid 3-letter currency code is required');
    }

    if (!request.paymentType) {
      throw new BadRequestException('Payment type is required');
    }

    if (!request.provider) {
      throw new BadRequestException('Payment provider is required');
    }
  }

  /**
   * Create payment record
   */
  private async createPaymentRecord(
    request: PaymentProcessingRequest,
    tenantConfig: any,
  ): Promise<Payment> {
    const payment = this.paymentRepository.create({
      tripId: request.meta?.tripId,
      amount: request.amount,
      currency: request.currency,
      paymentMethod: this.mapProviderToPaymentMethod(request.provider),
      paymentType: request.paymentType,
      status: PaymentStatus.PENDING,
      description: request.meta?.description,
      referenceNumber: request.meta?.referenceNumber,
      billingAddress: request.meta?.billingAddress,
      notes: request.meta?.notes,
      dueDate: request.meta?.dueDate,
      tenantId: request.tenant.id,
      payerId: request.meta?.payerId,
      metadata: {
        ...request.meta,
        tenantConfig,
        provider: request.provider,
        idempotencyKey: request.idempotencyKey,
      },
    });

    return await this.paymentRepository.save(payment);
  }

  /**
   * Process advance payment
   */
  private async processAdvancePayment(
    payment: Payment,
    request: PaymentProcessingRequest,
  ): Promise<PaymentProcessingResult> {
    try {
      await this.updateTransactionState(
        payment.id,
        TransactionState.IN_PROGRESS,
      );

      // Process with provider
      const result = await this.providerIntegrationService.processPayment(
        request.provider,
        request.paymentType,
        request.amount,
        request.currency,
        request.meta,
      );

      if (result.success) {
        await this.updateTransactionState(
          payment.id,
          TransactionState.COMPLETED,
        );

        // Update payment with transaction details
        payment.transactionId = result.transactionId;
        payment.processingFee = result.processingFee;
        payment.processedAt = new Date();
        await this.paymentRepository.save(payment);
      } else {
        await this.updateTransactionState(payment.id, TransactionState.FAILED);
        payment.failureReason = result.error;
        await this.paymentRepository.save(payment);
      }

      return {
        success: result.success,
        payment,
        transactionId: result.transactionId,
        processingFee: result.processingFee,
        error: result.error,
        errorCode: result.errorCode,
      };
    } catch (error) {
      await this.updateTransactionState(payment.id, TransactionState.FAILED);
      throw error;
    }
  }

  /**
   * Process final payment (escrow release)
   */
  private async processFinalPayment(
    payment: Payment,
    request: PaymentProcessingRequest,
  ): Promise<PaymentProcessingResult> {
    try {
      // Release escrow
      const releasedPayment = await this.escrowService.releaseEscrow(
        payment,
        'final_payment_processing',
      );

      await this.updateTransactionState(payment.id, TransactionState.COMPLETED);

      return {
        success: true,
        payment: releasedPayment,
        transactionId: `ESCROW_${payment.id}`,
      };
    } catch (error) {
      await this.updateTransactionState(payment.id, TransactionState.FAILED);
      throw error;
    }
  }

  /**
   * Process standard payment
   */
  private async processStandardPayment(
    payment: Payment,
    request: PaymentProcessingRequest,
  ): Promise<PaymentProcessingResult> {
    try {
      await this.updateTransactionState(
        payment.id,
        TransactionState.IN_PROGRESS,
      );

      // Process with provider
      const result = await this.providerIntegrationService.processPayment(
        request.provider,
        request.paymentType,
        request.amount,
        request.currency,
        request.meta,
      );

      if (result.success) {
        await this.updateTransactionState(
          payment.id,
          TransactionState.COMPLETED,
        );

        // Update payment with transaction details
        payment.transactionId = result.transactionId;
        payment.processingFee = result.processingFee;
        payment.processedAt = new Date();
        await this.paymentRepository.save(payment);
      } else {
        await this.updateTransactionState(payment.id, TransactionState.FAILED);
        payment.failureReason = result.error;
        await this.paymentRepository.save(payment);
      }

      return {
        success: result.success,
        payment,
        transactionId: result.transactionId,
        processingFee: result.processingFee,
        error: result.error,
        errorCode: result.errorCode,
      };
    } catch (error) {
      await this.updateTransactionState(payment.id, TransactionState.FAILED);
      throw error;
    }
  }

  /**
   * Check if payment is eligible for micro-lending
   */
  private isEligibleForMicroLending(payment: Payment): boolean {
    // Basic eligibility criteria
    return (
      payment.amount >= 100 && // Minimum amount
      payment.amount <= 10000 && // Maximum amount
      payment.paymentType === PaymentType.TRIP_PAYMENT &&
      payment.status === PaymentStatus.PENDING
    );
  }

  /**
   * Map provider to payment method
   */
  private mapProviderToPaymentMethod(provider: PaymentProvider): PaymentMethod {
    const mapping = {
      [PaymentProvider.MOBILE_MONEY]: PaymentMethod.DIGITAL_WALLET,
      [PaymentProvider.BANK_TRANSFER]: PaymentMethod.BANK_TRANSFER,
      [PaymentProvider.MICRO_LENDING]: PaymentMethod.BANK_TRANSFER,
    };
    return mapping[provider] || PaymentMethod.BANK_TRANSFER;
  }

  /**
   * Validate webhook payload
   */
  private validateWebhookPayload(payload: any): void {
    if (!payload) {
      throw new BadRequestException('Webhook payload is required');
    }

    if (!payload.transaction_id && !payload.id) {
      throw new BadRequestException(
        'Transaction ID is required in webhook payload',
      );
    }

    if (!payload.status) {
      throw new BadRequestException('Status is required in webhook payload');
    }
  }
}
