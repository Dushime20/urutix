import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Between } from 'typeorm';
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
import { assertValidTransition } from './types/payment-state-machine';

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

  /** Repayment obligations are cargo-owner → lender, not disbursements. */
  private isRepaymentObligation(payment: Payment): boolean {
    return (payment.metadata as any)?.isLoanRepaymentObligation === true;
  }

  /** Cargo-owner direct trip settlement — not a lender disbursement. */
  private isCargoOwnerDirectPayment(payment: Payment): boolean {
    const meta = (payment.metadata || {}) as Record<string, any>;
    if (meta.isLenderPayment === true) return false;
    if (meta.isLoanRepaymentObligation) return false;
    return (
      meta.senderType === 'cargo_owner' ||
      meta.paymentSource === 'direct_payment' ||
      meta.customFields?.paymentSource === 'direct_payment'
    );
  }

  /**
   * Can this (tripId, payerId) row be reused for a lender disbursement?
   * DB allows only one active trip_payment per payer per trip — if the lender
   * already has a completed row, it must be a prior disbursement attempt.
   */
  private canReuseAsLenderDisbursement(payment: Payment): boolean {
    if (this.isRepaymentObligation(payment)) return false;
    if (this.isCargoOwnerDirectPayment(payment)) return false;
    return true;
  }

  /** Prefer a row explicitly tied to this loan when multiple exist. */
  private preferLoanLinkedPayment(
    payments: Payment[],
    loanId: string,
  ): Payment | undefined {
    const prefix = loanId.slice(0, 8).toUpperCase();
    return (
      payments.find((p) => (p.metadata as any)?.loanId === loanId) ??
      payments.find((p) => p.referenceNumber?.startsWith(`LOAN-${prefix}`)) ??
      payments.find((p) =>
        p.description?.toLowerCase().includes('loan disbursement'),
      ) ??
      payments[0]
    );
  }

  /** All active trip/advance payments for a payer on a trip, newest first. */
  private async findActivePaymentsForTripPayer(
    tripId: string,
    payerId: string,
  ): Promise<Payment[]> {
    return this.paymentRepository
      .createQueryBuilder('p')
      .where('p.tripId = :tripId', { tripId })
      .andWhere('p.payerId = :payerId', { payerId })
      .andWhere('p.status IN (:...statuses)', {
        statuses: [
          PaymentStatus.PENDING,
          PaymentStatus.PROCESSING,
          PaymentStatus.COMPLETED,
        ],
      })
      .andWhere('p.paymentType IN (:...types)', {
        types: [PaymentType.ADVANCE, PaymentType.TRIP_PAYMENT],
      })
      .andWhere('p.deleted_at IS NULL')
      .orderBy('p.createdAt', 'DESC')
      .getMany();
  }

  /** Backfill metadata on legacy disbursement rows missing isLenderPayment. */
  private async ensureLenderDisbursementMetadata(
    payment: Payment,
    loanId: string,
  ): Promise<Payment> {
    const meta = (payment.metadata || {}) as Record<string, any>;
    if (meta.isLenderPayment === true && meta.loanId === loanId) {
      return payment;
    }
    payment.metadata = {
      ...meta,
      isLenderPayment: true,
      loanId,
      metadataBackfilledAt: new Date().toISOString(),
    };
    const saved = await this.paymentRepository.save(payment);
    this.logger.log(
      `Backfilled lender disbursement metadata on payment ${saved.id} for loan ${loanId}`,
    );
    return saved;
  }

  /**
   * Find reusable lender-disbursement payment rows for a trip+payer+loan.
   */
  async findDisbursementPaymentsForLoan(
    tripId: string,
    payerId: string,
    loanId: string,
  ): Promise<Payment[]> {
    const candidates = await this.findActivePaymentsForTripPayer(tripId, payerId);
    return candidates.filter((p) => this.canReuseAsLenderDisbursement(p));
  }

  /**
   * Pre-flight check before initiating MoMo — prevents duplicate charges and
   * reconciles loans stuck when a completed payment exists without isLenderPayment.
   */
  async preflightLenderDisbursement(
    tripId: string,
    payerId: string,
    loanId: string,
  ): Promise<
    | { outcome: 'already_completed'; payment: Payment }
    | { outcome: 'awaiting_confirmation'; payment: Payment }
    | { outcome: 'proceed' }
  > {
    const existing = await this.findDisbursementPaymentsForLoan(
      tripId,
      payerId,
      loanId,
    );

    const completed = existing.filter(
      (p) => p.status === PaymentStatus.COMPLETED,
    );
    if (completed.length > 0) {
      const match = this.preferLoanLinkedPayment(completed, loanId)!;
      const patched = await this.ensureLenderDisbursementMetadata(match, loanId);
      this.logger.log(
        `Preflight: reusing completed disbursement payment ${patched.id} for loan ${loanId}`,
      );
      return { outcome: 'already_completed', payment: patched };
    }

    const inFlight = existing.find(
      (p) =>
        (p.status === PaymentStatus.PENDING ||
          p.status === PaymentStatus.PROCESSING) &&
        (p.transactionId || (p.metadata as any)?.momoTransactionId),
    );
    if (inFlight) {
      return { outcome: 'awaiting_confirmation', payment: inFlight };
    }

    return { outcome: 'proceed' };
  }

  /**
   * Reconcile a stuck loan when createPayment would block on an existing row.
   */
  async reuseBlockingLenderDisbursementPayment(
    tripId: string,
    payerId: string,
    loanId: string,
  ): Promise<Payment | null> {
    const existing = await this.findDisbursementPaymentsForLoan(
      tripId,
      payerId,
      loanId,
    );
    const completed = existing.filter(
      (p) => p.status === PaymentStatus.COMPLETED,
    );
    if (completed.length === 0) return null;
    const match = this.preferLoanLinkedPayment(completed, loanId)!;
    return this.ensureLenderDisbursementMetadata(match, loanId);
  }

  /**
   * Find active lender-disbursement payments for a trip+payer.
   * Used for idempotent retries (avoids uq_payment_trip_payer_* violations).
   */
  private async findActiveLenderPayments(
    tripId: string,
    payerId: string,
    loanId?: string,
  ): Promise<Payment[]> {
    if (loanId) {
      return this.findDisbursementPaymentsForLoan(tripId, payerId, loanId);
    }

    const qb = this.paymentRepository
      .createQueryBuilder('p')
      .where('p.tripId = :tripId', { tripId })
      .andWhere('p.payerId = :payerId', { payerId })
      .andWhere('p.status IN (:...statuses)', {
        statuses: [
          PaymentStatus.PENDING,
          PaymentStatus.PROCESSING,
          PaymentStatus.COMPLETED,
        ],
      })
      .andWhere(`(p.metadata->>'isLenderPayment') = 'true'`)
      .andWhere('p.deleted_at IS NULL')
      .orderBy('p.createdAt', 'DESC');

    return qb.getMany();
  }

  /**
   * Cancel stale in-flight payments that would block a new insert under
   * uq_payment_trip_payer_advance_active / trip_payment_active.
   */
  private async cancelStalePaymentsForRetry(
    payments: Payment[],
    reason: string,
  ): Promise<void> {
    for (const stale of payments) {
      if (
        stale.status !== PaymentStatus.PENDING &&
        stale.status !== PaymentStatus.PROCESSING
      ) {
        continue;
      }
      stale.status = PaymentStatus.CANCELLED;
      stale.failureReason = reason;
      stale.metadata = {
        ...(stale.metadata || {}),
        cancelledReason: reason,
        cancelledAt: new Date().toISOString(),
      };
      await this.paymentRepository.save(stale);
      await this.auditService.log('CANCEL_STALE_PAYMENT', stale, { reason });
      this.logger.warn(
        `Cancelled stale payment ${stale.id} (${stale.paymentType}) — ${reason}`,
      );
    }
  }

  async createPayment(
    createPaymentDto: CreatePaymentDto & { idempotencyKey?: string },
    tenantId: string,
    userId: string,
  ): Promise<Payment> {
    const requestedType = createPaymentDto.paymentType as PaymentType;
    if (!requestedType || !Object.values(PaymentType).includes(requestedType)) {
      throw new BadRequestException(
        'paymentType is required and must be a valid PaymentType.',
      );
    }
    const metadata =
      createPaymentDto.metadata &&
      typeof createPaymentDto.metadata === 'object' &&
      createPaymentDto.metadata !== null
        ? typeof createPaymentDto.metadata === 'string'
          ? JSON.parse(createPaymentDto.metadata as unknown as string)
          : { ...createPaymentDto.metadata }
        : {};
    const isLenderPayment = metadata.isLenderPayment === true;
    const loanId =
      typeof metadata.loanId === 'string' ? metadata.loanId : undefined;

    // Verify trip exists and user has permission (only if tripId is provided and valid)
    let trip = null;
    if (createPaymentDto.tripId && typeof createPaymentDto.tripId === 'string' && createPaymentDto.tripId.trim() !== '') {
      if (isLenderPayment) {
        // Lender disbursement: the trip belongs to the borrower's tenant, not the lender's.
        // Look up without tenant scoping — the lender already authorised the loan.
        trip = await this.tripRepository.findOne({
          where: { id: createPaymentDto.tripId },
          relations: ['load'],
        });

        // Idempotent retry: reuse completed/in-flight lender payment for this loan,
        // or cancel stale rows that would violate unique partial indexes.
        const existingLender = await this.findActiveLenderPayments(
          createPaymentDto.tripId,
          userId,
          loanId,
        );

        const completed = existingLender.find(
          (p) => p.status === PaymentStatus.COMPLETED,
        );
        if (completed) {
          const reused = loanId
            ? await this.ensureLenderDisbursementMetadata(completed, loanId)
            : completed;
          this.logger.log(
            `Reusing completed lender payment ${reused.id} for trip ${createPaymentDto.tripId} loan ${loanId || 'n/a'}`,
          );
          return reused;
        }

        const inFlight = existingLender.find(
          (p) =>
            p.status === PaymentStatus.PENDING ||
            p.status === PaymentStatus.PROCESSING,
        );
        if (inFlight) {
          // Reuse the row: update fields and correct historical ADVANCE mis-types.
          const priorStatus = inFlight.status;
          inFlight.amount = createPaymentDto.amount;
          inFlight.currency = createPaymentDto.currency;
          inFlight.paymentMethod = createPaymentDto.paymentMethod;
          inFlight.paymentType = requestedType;
          inFlight.description = createPaymentDto.description;
          inFlight.referenceNumber = createPaymentDto.referenceNumber;
          inFlight.metadata = {
            ...(inFlight.metadata || {}),
            ...metadata,
            reusedAt: new Date().toISOString(),
          };
          const reused = await this.paymentRepository.save(inFlight);
          await this.auditService.log('REUSE_LENDER_PAYMENT', reused);
          this.logger.log(
            `Reusing in-flight lender payment ${reused.id} (was ${priorStatus}) for loan ${loanId || 'n/a'}`,
          );
          return reused;
        }

        // Cancel any active ADVANCE/TRIP_PAYMENT for this trip+payer that would
        // block insert (e.g. prior bug that stored lender disbursements as ADVANCE).
        const blockStatuses = [
          PaymentStatus.PENDING,
          PaymentStatus.PROCESSING,
          PaymentStatus.COMPLETED,
        ];
        const blocking = await this.paymentRepository.find({
          where: [
            ...blockStatuses.map((s) => ({
              tripId: createPaymentDto.tripId,
              payerId: userId,
              paymentType: PaymentType.ADVANCE,
              status: s,
            })),
            ...blockStatuses.map((s) => ({
              tripId: createPaymentDto.tripId,
              payerId: userId,
              paymentType: PaymentType.TRIP_PAYMENT,
              status: s,
            })),
          ] as any,
        });
        const cancellable = blocking.filter(
          (p) =>
            p.status === PaymentStatus.PENDING ||
            p.status === PaymentStatus.PROCESSING,
        );
        const blockingCompleted = blocking
          .filter((p) => p.status === PaymentStatus.COMPLETED)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        const reusableCompleted = blockingCompleted.filter((p) =>
          this.canReuseAsLenderDisbursement(p),
        );
        if (reusableCompleted.length > 0) {
          const toReuse = loanId
            ? this.preferLoanLinkedPayment(reusableCompleted, loanId)!
            : reusableCompleted[0];
          const reused = await this.ensureLenderDisbursementMetadata(
            toReuse,
            loanId!,
          );
          this.logger.log(
            `Reusing completed disbursement payment ${reused.id} for loan ${loanId} ` +
              `(legacy row — only one trip_payment allowed per lender payer)`,
          );
          return reused;
        }
        if (blockingCompleted.length > 0) {
          throw new ConflictException(
            `An active payment already exists for this trip (id: ${blockingCompleted[0].id}, type: ${blockingCompleted[0].paymentType}). Duplicate lender disbursement payments are not allowed.`,
          );
        }
        await this.cancelStalePaymentsForRetry(
          cancellable,
          'Superseded by new lender disbursement attempt',
        );
      } else {
        trip = await this.tripRepository.findOne({
          where: { id: createPaymentDto.tripId, tenantId },
          relations: ['load'],
        });
        if (!trip) throw new NotFoundException('Trip not found');

        // Only check cargo owner permission for non-lender payments
        if (trip.load.cargoOwnerId !== userId) {
          throw new ForbiddenException(
            'You can only create payments for your own trips',
          );
        }

        // Check if an active payment already exists for this trip FROM THIS PAYER.
        // Rules:
        //  - One TRIP_PAYMENT per (tripId, payerId) — no duplicates.
        //  - ADVANCE is allowed when no ADVANCE/TRIP_PAYMENT already exists.
        //  - FINAL is allowed alongside a COMPLETED ADVANCE (split scenario).
        //  - FAILED/CANCELLED may be retried (excluded from block list).
        const blockStatuses = [PaymentStatus.PENDING, PaymentStatus.PROCESSING, PaymentStatus.COMPLETED];
        const incomingType = requestedType;

        if (incomingType === PaymentType.FINAL) {
          // FINAL payment is allowed as long as there isn't already a FINAL active
          const existingFinal = await this.paymentRepository.findOne({
            where: blockStatuses.map(s => ({
              tripId: createPaymentDto.tripId,
              tenantId,
              payerId: userId,
              paymentType: PaymentType.FINAL,
              status: s,
            })) as any,
          });
          if (existingFinal)
            throw new ConflictException(
              `A final payment already exists for this trip (status: ${existingFinal.status}).`,
            );
        } else {
          // For TRIP_PAYMENT and ADVANCE: block if any active TRIP_PAYMENT or ADVANCE exists
          const existingPayment = await this.paymentRepository.findOne({
            where: [
              ...blockStatuses.map(s => ({ tripId: createPaymentDto.tripId, tenantId, payerId: userId, paymentType: PaymentType.TRIP_PAYMENT, status: s })),
              ...blockStatuses.map(s => ({ tripId: createPaymentDto.tripId, tenantId, payerId: userId, paymentType: PaymentType.ADVANCE, status: s })),
            ] as any,
          });
          if (existingPayment)
            throw new ConflictException(
              `An active payment already exists for this trip (type: ${existingPayment.paymentType}, status: ${existingPayment.status}). Duplicate payments are not allowed.`,
            );
        }
      }
    }

    // Idempotency check — must happen BEFORE the INSERT so we reject the
    // duplicate request before writing anything to the database.
    if (createPaymentDto.idempotencyKey) {
      await this.idempotencyService.checkKey(
        createPaymentDto.idempotencyKey,
        tenantId,
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

    // Escrow split only for cargo-owner ADVANCE payments (never for lender disbursements)
    let paymentAmount = createPaymentDto.amount;
    let final = 0;
    const shouldEscrowSplit =
      requestedType === PaymentType.ADVANCE &&
      requireAdvancePayment &&
      !isLenderPayment;

    if (shouldEscrowSplit) {
      const split = await this.escrowService.splitAdvanceFinal(
        createPaymentDto.amount,
        advancePaymentPercentage,
      );
      paymentAmount = split.advance;
      final = split.final;
    } else if (
      requestedType === PaymentType.ADVANCE &&
      !requireAdvancePayment
    ) {
      this.logger.log(
        `Advance payment not required for this trip. Creating single payment without split.`,
      );
    }

    // Honour the caller's paymentType (historical bug hardcoded ADVANCE and
    // caused lender disbursements to hit uq_payment_trip_payer_advance_active).
    const paymentData: any = {
      amount: paymentAmount,
      tenantId,
      payerId: userId,
      status: PaymentStatus.PENDING,
      metadata,
      idempotencyKey: createPaymentDto.idempotencyKey,
      paymentType: requestedType,
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

    let savedPayment: Payment;
    try {
      const savedPaymentResult = await this.paymentRepository.save(payment);
      savedPayment = Array.isArray(savedPaymentResult)
        ? savedPaymentResult[0]
        : savedPaymentResult;
    } catch (err: any) {
      // Race: unique partial index fired between check and insert.
      const isUniqueViolation =
        err?.code === '23505' ||
        /uq_payment_trip_payer_(advance|trip_payment|final)_active/i.test(
          err?.message || '',
        );
      if (isUniqueViolation && isLenderPayment && createPaymentDto.tripId) {
        const raced = await this.findActiveLenderPayments(
          createPaymentDto.tripId,
          userId,
          loanId,
        );
        if (raced[0]) {
          this.logger.warn(
            `Unique constraint race on lender payment — reusing ${raced[0].id}`,
          );
          return raced[0];
        }
      }
      if (isUniqueViolation) {
        throw new ConflictException(
          `An active payment already exists for this trip/payer. Duplicate payments are not allowed.`,
        );
      }
      throw err;
    }

    await this.auditService.log('CREATE_PAYMENT', savedPayment);

    // Stamp the idempotency key onto the saved row (check already passed above).
    if (createPaymentDto.idempotencyKey) {
      await this.idempotencyService.saveKey(
        createPaymentDto.idempotencyKey,
        savedPayment.id,
      );
    }
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
        metadata,
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

    // Enforce state machine: reject invalid status transitions.
    if (
      updatePaymentStatusDto.status &&
      updatePaymentStatusDto.status !== payment.status
    ) {
      assertValidTransition(payment.status, updatePaymentStatusDto.status);
    }

    const previousStatus = payment.status;

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

    // Persist an audit record for this transition.
    if (updatePaymentStatusDto.status && updatePaymentStatusDto.status !== previousStatus) {
      await this.auditService.logTransition(savedPayment, previousStatus, savedPayment.status);
    }

    // Handle advance payment completion: Update trip and truck status
    if (
      updatePaymentStatusDto.status === PaymentStatus.COMPLETED &&
      payment.paymentType === PaymentType.ADVANCE &&
      payment.tripId
    ) {
      await this.handleAdvancePaymentCompletion(payment.tripId, tenantId);
    }

    // Handle trip fee / lender disbursement completion
    if (
      updatePaymentStatusDto.status === PaymentStatus.COMPLETED &&
      (payment.paymentType === PaymentType.TRIP_PAYMENT ||
       payment.paymentType === PaymentType.SERVICE_FEE ||
       (payment.metadata as any)?.isLenderPayment) &&
      payment.tripId
    ) {
      await this.handleTripPaymentCompletion(savedPayment, tenantId);
    }

    return savedPayment;
  }

  /**
   * Handle full trip fee / lender disbursement completion.
   * Marks the payment as paid (processedAt) and emits payment.trip.completed
   * so the truck owner's Received Payments tab shows it instantly.
   */
  private async handleTripPaymentCompletion(
    payment: Payment,
    tenantId: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Handling trip payment completion for payment ${payment.id}, trip ${payment.tripId}`,
      );

      // Ensure processedAt is stamped
      if (!payment.processedAt) {
        payment.processedAt = new Date();
        await this.paymentRepository.save(payment);
      }

      // Emit event so other listeners (notifications, analytics) can react
      if (this.eventEmitter) {
        this.eventEmitter.emit('payment.trip.completed', {
          paymentId: payment.id,
          tripId: payment.tripId,
          tenantId,
          amount: Number(payment.amount),
          currency: payment.currency,
          payeeId: payment.payeeId,
          payerId: payment.payerId,
          isLenderPayment: !!(payment.metadata as any)?.isLenderPayment,
          lenderName: (payment.metadata as any)?.lenderName || null,
          processedAt: payment.processedAt,
        });
      }

      this.logger.log(
        `Trip payment ${payment.id} marked completed and event emitted`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling trip payment completion for payment ${payment.id}:`,
        error,
      );
    }
  }

  /**
   * Handle advance payment completion — trip stays PLANNED, waiting for driver to start.
   */
  private async handleAdvancePaymentCompletion(
    tripId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Handling advance payment completion for trip ${tripId}`,
      );

      const trip = await this.tripRepository.findOne({
        where: { id: tripId, tenantId },
      });

      if (!trip) {
        this.logger.warn(`Trip ${tripId} not found for advance payment completion`);
        return;
      }

      // Trip stays PLANNED — only the driver starting the trip
      // (POST /trips/:id/start) should move it to IN_PROGRESS.
      this.logger.log(
        `Trip ${tripId} advance payment confirmed. Trip remains PLANNED until driver starts it.`,
      );

      // Find the advance payment for audit logging
      const advancePayment = await this.paymentRepository.findOne({
        where: {
          tripId,
          tenantId,
          paymentType: PaymentType.ADVANCE,
          status: PaymentStatus.COMPLETED,
        },
        order: { processedAt: 'DESC' },
      });

      if (advancePayment) {
        await this.auditService.log('ADVANCE_PAYMENT_COMPLETED', advancePayment, {
          tripId,
          truckId: trip.truckId,
          description: 'Advance payment completed. Trip ready — awaiting driver start.',
        });
      }
    } catch (error) {
      this.logger.error(
        `Error handling advance payment completion for trip ${tripId}:`,
        error,
      );
    }
  }

  async processPayment(id: string, tenantId: string): Promise<Payment> {
    const payment = await this.findOnePayment(id, tenantId);

    // Guard: only PENDING payments can be submitted to the provider.
    // PROCESSING means a request is already in-flight.
    // COMPLETED / FAILED / CANCELLED are terminal or handled by refund/retry flows.
    if (payment.status !== PaymentStatus.PENDING) {
      if (payment.status === PaymentStatus.COMPLETED) {
        // Idempotent: return the completed payment as-is.
        this.logger.log(
          `processPayment called on already-completed payment ${id} — returning as-is`,
        );
        return payment;
      }
      throw new ConflictException(
        `Payment ${id} cannot be processed: current status is "${payment.status}". Only PENDING payments can be processed.`,
      );
    }

    // Run fraud detection before processing
    const isFraud = await this.fraudDetectionService.check(payment);
    if (isFraud) {
      await this.auditService.log('FRAUD_DETECTED', payment);
      throw new ConflictException('Fraud detected, payment blocked');
    }

    // Map PaymentMethod to PaymentProvider
    const provider = this.mapPaymentMethodToProvider(payment.paymentMethod);

    // Process payment using the provider integration service directly.
    // We must NOT call paymentProcessingService.initiatePayment() here because
    // that method always creates a NEW payment record internally, which would
    // violate the unique constraint uq_payment_trip_payer_trip_payment_active
    // when an active payment already exists for the same (tripId, payerId, type).
    // Instead we submit the existing payment record to the provider directly.
    try {
      const processingResult =
        await this.providerIntegrationService.processPayment(
          provider,
          payment.paymentType,
          payment.amount,
          payment.currency,
          {
            ...payment.metadata,
            tripId: payment.tripId,
            payerId: payment.payerId,
            description: payment.description,
            referenceNumber: payment.referenceNumber,
            billingAddress: payment.billingAddress,
            notes: payment.notes,
            dueDate: payment.dueDate,
          },
        );

      if (processingResult.success) {
        const isMobileMoney = provider === PaymentProvider.MOBILE_MONEY;
        // Mobile money always stays PROCESSING until provider webhook confirms.
        // Non-MoMo providers may complete immediately when the provider reports success.
        const providerCompleted =
          (processingResult as any).status === 'completed' ||
          (processingResult as any).status === 'success';
        const finalStatus =
          isMobileMoney || !providerCompleted
            ? PaymentStatus.PROCESSING
            : PaymentStatus.COMPLETED;

        // Update payment with processing results
        const updateData: UpdatePaymentStatusDto = {
          status: finalStatus,
          transactionId: processingResult.transactionId,
          gatewayResponse:
            finalStatus === PaymentStatus.COMPLETED
              ? 'Payment completed successfully.'
              : 'Mobile Money payment initiated. Waiting for confirmation.',
          processedAt: finalStatus === PaymentStatus.COMPLETED ? new Date() : undefined,
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

        // Generate invoice and receipt when payment is completed
        if (finalStatus === PaymentStatus.COMPLETED) {
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
          if (this.eventEmitter && finalStatus === PaymentStatus.COMPLETED) {
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
    const provider = mapping[method];
    if (!provider) {
      throw new BadRequestException(
        `Unsupported payment method: ${method}`,
      );
    }
    return provider;
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

    // Create refund payment record as PENDING — the refund must be submitted to
    // the provider before it can be marked COMPLETED.  The caller (or a webhook
    // handler) is responsible for calling processPayment on the refund record
    // once the provider confirms the reversal.
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
      status: PaymentStatus.PENDING,  // Not COMPLETED — provider must confirm.
      metadata: { originalPaymentId: originalPayment.id, refundReason: reason },
    });

    const savedRefund = await this.paymentRepository.save(refundPayment);
    await this.auditService.log('REFUND_CREATED', savedRefund, {
      originalPaymentId: originalPayment.id,
      refundAmount: amount,
      reason,
    });
    return savedRefund;
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

    // Max advance from accepted bid percentage (never invent 70%)
    const acceptedBid = await this.bidRepository.findOne({
      where: { loadId: trip.loadId, status: BidStatus.ACCEPTED },
      order: { updatedAt: 'DESC' },
    });
    if (
      !acceptedBid ||
      acceptedBid.advancePaymentPercentage == null ||
      !Number.isFinite(Number(acceptedBid.advancePaymentPercentage))
    ) {
      throw new BadRequestException(
        'Cannot request advance: accepted bid must define advancePaymentPercentage.',
      );
    }
    const currency = String(trip.currencyCode || '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new BadRequestException(
        `Trip ${trip.id} is missing a valid ISO 4217 currencyCode.`,
      );
    }
    const pct = Number(acceptedBid.advancePaymentPercentage);
    if (pct <= 0 || pct > 100) {
      throw new BadRequestException(
        `Invalid advancePaymentPercentage ${pct} on bid ${acceptedBid.id}.`,
      );
    }
    const maxAdvance =
      Math.round(Number(trip.agreedPrice) * (pct / 100) * 100) / 100;
    if (advanceRequestDto.amount > maxAdvance) {
      throw new BadRequestException(
        `Advance amount cannot exceed ${maxAdvance} ${currency} (${pct}% of trip value).`,
      );
    }

    // Create advance payment request
    const advancePayment = this.paymentRepository.create({
      tripId: advanceRequestDto.tripId,
      tenantId,
      payerId: trip.load.cargoOwnerId, // Cargo owner pays
      amount: advanceRequestDto.amount,
      currency,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentType: PaymentType.ADVANCE,
      status: PaymentStatus.PENDING,
      description: `Advance payment request: ${advanceRequestDto.reason}`,
      notes: `Urgency: ${advanceRequestDto.urgency}`,
      metadata: {
        advanceRequest: true,
        advancePaymentPercentage: pct,
        bidId: acceptedBid.id,
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
