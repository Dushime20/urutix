import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus } from '../../../entities/payment.entity';

/**
 * Production fraud checks based on deterministic rules.
 * Random flagging is never used.
 */
@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * @returns true if suspicious (should block), false otherwise
   */
  async check(payment: Payment): Promise<boolean> {
    const enabled =
      this.configService.get<string>('FRAUD_DETECTION_ENABLED') !== 'false';
    if (!enabled) {
      return false;
    }

    const reasons: string[] = [];

    const amount = Number(payment.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      reasons.push('invalid_amount');
    }

    const maxAmount = Number(
      this.configService.get<string>('FRAUD_MAX_PAYMENT_AMOUNT'),
    );
    if (Number.isFinite(maxAmount) && maxAmount > 0 && amount > maxAmount) {
      reasons.push(`amount_exceeds_fraud_cap:${maxAmount}`);
    }

    if (!payment.currency || !/^[A-Z]{3}$/i.test(payment.currency)) {
      reasons.push('invalid_currency');
    }

    if (!payment.payerId) {
      reasons.push('missing_payer');
    }

    // Rapid replay of same reference is suspicious when already completed
    if (
      payment.referenceNumber &&
      payment.status === PaymentStatus.COMPLETED &&
      (payment.metadata as any)?.reusedAt
    ) {
      reasons.push('completed_payment_reuse_attempt');
    }

    if (reasons.length > 0) {
      this.logger.warn(
        `Fraud rules flagged payment ${payment.id}: ${reasons.join(', ')}`,
      );
      return true;
    }

    return false;
  }

  async batchCheck(
    payments: Payment[],
  ): Promise<{ payment: Payment; suspicious: boolean }[]> {
    const results: { payment: Payment; suspicious: boolean }[] = [];
    for (const payment of payments) {
      results.push({ payment, suspicious: await this.check(payment) });
    }
    return results;
  }
}
