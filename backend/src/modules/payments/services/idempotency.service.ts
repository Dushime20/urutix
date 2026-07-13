import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../../entities/payment.entity';

/**
 * Idempotency guard for payment creation.
 *
 * A caller may include an `Idempotency-Key` header (or body field) with any
 * payment creation request.  If the same key is submitted more than once
 * within the same tenant, the second call is rejected before any DB write
 * occurs.
 *
 * The key is stored on the payment row after it is created (`saveKey`),
 * which means the check-then-save is intentionally split:
 *   1. `checkKey(key, tenantId)`  — call BEFORE creating the payment.
 *   2. `saveKey(key, paymentId)`  — call AFTER the payment row exists.
 *
 * The DB-level unique partial index on `(idempotencyKey)` (migration 041+) is
 * the last-resort guard against any race condition that slips through the
 * application check.
 */
@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  /**
   * Check whether this idempotency key has already been used within the
   * tenant.  Call this BEFORE inserting a new payment row.
   *
   * @throws ConflictException if the key already exists.
   */
  async checkKey(key: string, tenantId: string): Promise<void> {
    if (!key || !tenantId) return;

    const existing = await this.paymentRepository.findOne({
      where: { idempotencyKey: key, tenantId },
      select: ['id'],
    });

    if (existing) {
      this.logger.warn(
        `Duplicate idempotency key "${key}" for tenant ${tenantId} — original payment: ${existing.id}`,
      );
      throw new ConflictException(
        `Duplicate request: idempotency key "${key}" has already been used.`,
      );
    }
  }

  /**
   * Stamp the idempotency key onto an existing payment row.
   * Call this AFTER the payment row has been saved.
   */
  async saveKey(key: string, paymentId: string): Promise<void> {
    if (!key || !paymentId) return;
    try {
      await this.paymentRepository.update(paymentId, { idempotencyKey: key });
    } catch (err) {
      // A unique constraint violation here means a concurrent request slipped
      // through the application check.  Surface it as a ConflictException.
      if ((err as any)?.code === '23505') {
        throw new ConflictException(
          `Duplicate request: idempotency key "${key}" has already been used.`,
        );
      }
      throw err;
    }
  }

  /**
   * Convenience method kept for backward-compatibility with callers that used
   * the old single-call API.  Performs check then stamp in sequence.
   *
   * @deprecated Prefer `checkKey` + `saveKey` split so the check happens before
   *             the INSERT.
   */
  async checkAndSaveKey(key: string, tenantId: string, paymentId?: string): Promise<void> {
    await this.checkKey(key, tenantId);
    if (paymentId) {
      await this.saveKey(key, paymentId);
    }
  }
}
