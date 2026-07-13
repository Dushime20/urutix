import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../../entities/payment.entity';
import { PaymentAuditLog } from '../../../entities/payment-audit-log.entity';

/**
 * Persistent, append-only payment audit service.
 *
 * Every payment state change, processing attempt, fraud flag, escrow operation,
 * and error is recorded to `payment_audit_logs`.  Records are never updated or
 * deleted — the table is the immutable ledger for regulatory and debugging purposes.
 *
 * Audit failures are logged but never thrown so that they cannot silently abort a
 * payment transaction.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(PaymentAuditLog)
    private readonly auditRepository: Repository<PaymentAuditLog>,
  ) {}

  async log(
    action: string,
    payment: Payment,
    meta?: Record<string, any>,
  ): Promise<void> {
    // Always emit to application log first — survives DB failures.
    this.logger.log(
      `[${action}] PaymentID: ${payment.id} Meta: ${JSON.stringify(meta ?? {})}`,
    );

    try {
      const record = this.auditRepository.create({
        paymentId:      payment.id,
        tenantId:       payment.tenantId,
        actorId:        payment.payerId ?? undefined,
        action,
        currentStatus:  payment.status,
        metadata: {
          amount:   payment.amount,
          currency: payment.currency,
          type:     payment.paymentType,
          ...meta,
        },
      });
      await this.auditRepository.save(record);
    } catch (err) {
      // Audit failure must never abort payment processing.
      this.logger.error(
        `Failed to persist audit log for action ${action} on payment ${payment.id}: ${err?.message}`,
        err?.stack,
      );
    }
  }

  /**
   * Record a status transition explicitly, capturing both the previous and new status.
   */
  async logTransition(
    payment: Payment,
    previousStatus: string,
    newStatus: string,
    meta?: Record<string, any>,
  ): Promise<void> {
    this.logger.log(
      `[STATUS_TRANSITION] PaymentID: ${payment.id} ${previousStatus} → ${newStatus}`,
    );

    try {
      const record = this.auditRepository.create({
        paymentId:      payment.id,
        tenantId:       payment.tenantId,
        actorId:        payment.payerId ?? undefined,
        action:         'STATUS_TRANSITION',
        previousStatus,
        currentStatus:  newStatus,
        metadata: {
          amount:   payment.amount,
          currency: payment.currency,
          type:     payment.paymentType,
          ...meta,
        },
      });
      await this.auditRepository.save(record);
    } catch (err) {
      this.logger.error(
        `Failed to persist status transition audit for payment ${payment.id}: ${err?.message}`,
        err?.stack,
      );
    }
  }
}
