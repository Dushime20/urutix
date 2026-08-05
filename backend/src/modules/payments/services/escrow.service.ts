import {
  Injectable,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from '../../../entities/payment.entity';
import { AuditService } from './audit.service';

export interface EscrowSplit {
  advance: number;
  final: number;
  escrowFee?: number;
}

export interface EscrowReleaseConditions {
  tripCompleted: boolean;
  deliveryConfirmed: boolean;
  customerSatisfied: boolean;
  timeElapsed: boolean;
}

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Hold funds in escrow for a payment
   */
  async holdInEscrow(payment: Payment): Promise<Payment> {
    try {
      // Validate payment can be held in escrow
      this.validateEscrowEligibility(payment);

      // Update payment status to escrow
      payment.status = PaymentStatus.ESCROW;
      payment.metadata = {
        ...payment.metadata,
        escrowHeldAt: new Date().toISOString(),
        escrowAmount: payment.amount,
        escrowType: 'advance_final_split',
        escrowConditions: this.getEscrowReleaseConditions(),
      };

      const savedPayment = await this.paymentRepository.save(payment);

      // Log escrow event
      await this.auditService.log('ESCROW_HELD', savedPayment, {
        escrowAmount: payment.amount,
        escrowType: 'advance_final_split',
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `Payment ${payment.id} held in escrow for amount ${payment.amount}`,
      );

      return savedPayment;
    } catch (error) {
      this.logger.error(
        `Failed to hold payment ${payment.id} in escrow:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Release escrow funds based on completion conditions
   */
  async releaseEscrow(
    payment: Payment,
    releaseReason: string,
  ): Promise<Payment> {
    try {
      // Validate escrow can be released
      this.validateEscrowRelease(payment);

      // Update payment status to completed
      payment.status = PaymentStatus.COMPLETED;
      payment.metadata = {
        ...payment.metadata,
        escrowReleasedAt: new Date().toISOString(),
        escrowReleaseReason: releaseReason,
        escrowReleaseConditions:
          await this.checkEscrowReleaseConditions(payment),
      };

      const savedPayment = await this.paymentRepository.save(payment);

      // Log escrow release
      await this.auditService.log('ESCROW_RELEASED', savedPayment, {
        releaseReason,
        escrowAmount: payment.amount,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `Payment ${payment.id} escrow released for amount ${payment.amount}`,
      );

      return savedPayment;
    } catch (error) {
      this.logger.error(
        `Failed to release escrow for payment ${payment.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Split payment into advance and final amounts using an explicit percentage.
   * @param advancePaymentPercentage percentage on 0–100 scale from bid/policy (required)
   */
  async splitAdvanceFinal(
    totalAmount: number,
    advancePaymentPercentage?: number | null,
  ): Promise<EscrowSplit> {
    if (totalAmount <= 0) {
      throw new BadRequestException('Total amount must be greater than 0');
    }

    if (
      advancePaymentPercentage === undefined ||
      advancePaymentPercentage === null ||
      !Number.isFinite(Number(advancePaymentPercentage))
    ) {
      throw new BadRequestException(
        'Advance payment percentage is required for escrow split (from accepted bid or tenant policy).',
      );
    }

    const pct = Number(advancePaymentPercentage);
    if (pct <= 0 || pct > 100) {
      throw new BadRequestException(
        `Invalid advance payment percentage ${pct}. Expected 0 < value ≤ 100.`,
      );
    }

    const advancePercentageDecimal = pct / 100;
    const advance = Math.round(totalAmount * advancePercentageDecimal * 100) / 100;
    const final = Math.round((totalAmount - advance) * 100) / 100;

    const total = Math.round((advance + final) * 100) / 100;
    if (Math.abs(total - totalAmount) > 0.01) {
      return {
        advance,
        final: Math.round((totalAmount - advance) * 100) / 100,
      };
    }

    return { advance, final };
  }

  /**
   * Create both advance and final payment records
   */
  async createEscrowPayments(
    basePaymentData: any,
    totalAmount: number,
    tenantId: string,
    payerId: string,
    advancePaymentPercentage?: number,
  ): Promise<{ advance: Payment; final: Payment }> {
    const split = await this.splitAdvanceFinal(totalAmount, advancePaymentPercentage);
    
    const actualAdvancePercentage = Number(advancePaymentPercentage);
    const actualFinalPercentage = 100 - actualAdvancePercentage;

    // Create advance payment
    const advancePayment = this.paymentRepository.create({
      ...basePaymentData,
      amount: split.advance,
      paymentType: PaymentType.ADVANCE,
      status: PaymentStatus.PENDING,
      tenantId,
      payerId,
      metadata: {
        ...basePaymentData.metadata,
        escrowSplit: 'advance',
        originalAmount: totalAmount,
        splitPercentage: actualAdvancePercentage / 100, // Store as decimal (0-1)
        advancePaymentPercentage: actualAdvancePercentage, // Store as percentage (0-100)
      },
    });

    // Create final payment (held in escrow)
    const finalPayment = this.paymentRepository.create({
      ...basePaymentData,
      amount: split.final,
      paymentType: PaymentType.FINAL,
      status: PaymentStatus.ESCROW,
      tenantId,
      payerId,
      metadata: {
        ...basePaymentData.metadata,
        escrowSplit: 'final',
        originalAmount: totalAmount,
        splitPercentage: actualFinalPercentage / 100, // Store as decimal (0-1)
        advancePaymentPercentage: actualAdvancePercentage, // Store as percentage (0-100) for reference
        escrowHeldAt: new Date().toISOString(),
      },
    });

    // Save both payments
    const savedAdvance = await this.paymentRepository.save(advancePayment);
    const savedFinal = await this.paymentRepository.save(finalPayment);

    // Handle case where save returns array
    const advance = Array.isArray(savedAdvance)
      ? savedAdvance[0]
      : savedAdvance;
    const final = Array.isArray(savedFinal) ? savedFinal[0] : savedFinal;

    await this.auditService.log('ESCROW_CREATED', advance, {
      tripId: basePaymentData.tripId, // Assuming tripId is part of basePaymentData
      advancePaymentId: advance.id,
      finalPaymentId: final.id,
      amount: advance.amount,
    });

    return { advance, final };
  }

  /**
   * Check if escrow can be released based on conditions
   */
  async checkEscrowReleaseConditions(
    payment: Payment,
  ): Promise<EscrowReleaseConditions> {
    // Get trip information
    const trip = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.trip', 'trip')
      .where('payment.id = :paymentId', { paymentId: payment.id })
      .getOne()
      .then((p) => p?.trip);

    if (!trip) {
      throw new BadRequestException('Trip not found for payment');
    }

    const conditions: EscrowReleaseConditions = {
      tripCompleted: trip.status === 'COMPLETED',
      deliveryConfirmed: trip.status === 'COMPLETED',
      customerSatisfied: (trip.cargoOwnerRating || 0) >= 4, // Assuming rating system
      timeElapsed: this.checkTimeElapsed(payment.createdAt),
    };

    return conditions;
  }

  /**
   * Auto-release escrow after certain conditions are met
   */
  async autoReleaseEscrow(payment: Payment): Promise<Payment | null> {
    try {
      const conditions = await this.checkEscrowReleaseConditions(payment);

      // Check if all conditions are met for auto-release
      const canAutoRelease =
        conditions.tripCompleted &&
        conditions.deliveryConfirmed &&
        conditions.customerSatisfied;

      if (canAutoRelease) {
        return await this.releaseEscrow(payment, 'auto_release_conditions_met');
      }

      // Check if time-based release is applicable
      if (conditions.timeElapsed && conditions.tripCompleted) {
        return await this.releaseEscrow(payment, 'auto_release_time_elapsed');
      }

      return null; // Cannot auto-release
    } catch (error) {
      this.logger.error(
        `Auto-release escrow failed for payment ${payment.id}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Get escrow statistics for a tenant
   */
  async getEscrowStats(tenantId: string): Promise<any> {
    const escrowPayments = await this.paymentRepository.find({
      where: { tenantId, status: PaymentStatus.ESCROW },
    });

    const totalEscrowAmount = escrowPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const escrowCount = escrowPayments.length;

    // Use TypeORM JSONB operator syntax (not MongoDB $exists).
    const recentReleases = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere("payment.status = :status", { status: PaymentStatus.COMPLETED })
      .andWhere("payment.metadata->>'escrowReleasedAt' IS NOT NULL")
      .orderBy('payment.updatedAt', 'DESC')
      .take(10)
      .getMany();

    return {
      totalEscrowAmount,
      escrowCount,
      recentReleases: recentReleases.length,
      averageEscrowAmount:
        escrowCount > 0 ? totalEscrowAmount / escrowCount : 0,
    };
  }

  /**
   * Validate payment is eligible for escrow
   */
  private validateEscrowEligibility(payment: Payment): void {
    if (payment.status !== PaymentStatus.PENDING) {
      throw new ConflictException(
        'Only pending payments can be held in escrow',
      );
    }

    if (payment.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    if (payment.paymentType !== PaymentType.FINAL) {
      throw new BadRequestException(
        'Only final payments can be held in escrow',
      );
    }
  }

  /**
   * Validate escrow can be released
   */
  private validateEscrowRelease(payment: Payment): void {
    if (payment.status !== PaymentStatus.ESCROW) {
      throw new ConflictException('Only escrow payments can be released');
    }
    // escrowHeldAt is set by holdInEscrow() and createEscrowPayments().
    // Allow release even if the field is absent — the status check is the
    // authoritative guard.
  }

  /**
   * Get escrow release conditions
   */
  private getEscrowReleaseConditions(): any {
    return {
      tripCompleted: false,
      deliveryConfirmed: false,
      customerSatisfied: false,
      timeElapsed: false,
      autoReleaseAfterDays: 30, // Auto-release after 30 days if trip completed
    };
  }

  /**
   * Check if enough time has elapsed for time-based release
   */
  private checkTimeElapsed(createdAt: Date): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return createdAt < thirtyDaysAgo;
  }
}
