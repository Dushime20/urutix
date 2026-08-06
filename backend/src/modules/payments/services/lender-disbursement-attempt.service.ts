import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus } from '../../../entities/payment.entity';
import { AuditService } from './audit.service';
import { MobileMoneyPaymentService } from './mobile-money-payment.service';

/** ISO-style reason codes for attempt lifecycle (audit / support / reconciliation). */
export enum DisbursementAttemptCloseReason {
  PROVIDER_FAILED = 'PROVIDER_FAILED',
  PROVIDER_SUCCESS_LOCAL_INCOMPLETE = 'PROVIDER_SUCCESS_LOCAL_INCOMPLETE',
  AUTHORIZATION_TIMEOUT = 'AUTHORIZATION_TIMEOUT',
  LEGACY_UNSUPPORTED_RAIL = 'LEGACY_UNSUPPORTED_RAIL',
  PROVIDER_UNREACHABLE_STALE = 'PROVIDER_UNREACHABLE_STALE',
  SUPERSEDED_BY_RETRY = 'SUPERSEDED_BY_RETRY',
}

export type LenderDisbursementPreflight =
  | {
      outcome: 'already_completed';
      payment: Payment;
      reasonCode?: string;
    }
  | {
      outcome: 'awaiting_confirmation';
      payment: Payment;
      reasonCode: 'AWAITING_CUSTOMER_AUTHORIZATION' | 'AWAITING_PROVIDER_SETTLEMENT';
      providerStatus?: string;
      retryAfterSeconds?: number;
    }
  | {
      outcome: 'provider_settled';
      payment: Payment;
      reasonCode: 'PROVIDER_SUCCESS_LOCAL_INCOMPLETE';
      providerStatus: string;
    }
  | {
      outcome: 'proceed';
      closedPaymentId?: string;
      reasonCode?: DisbursementAttemptCloseReason;
    };

/**
 * Resolves whether a lender may start a new MoMo disbursement attempt.
 *
 * Follows PSP / card-network retry principles:
 * 1. Never create a second charge while the provider still reports success.
 * 2. While authorization is in-flight inside the PIN window, wait (idempotent).
 * 3. After timeout / failure / legacy rail, close the local attempt with an
 *    audit reason, then allow a new attempt under a new referenceId.
 * 4. Cancelled attempts are ignored by webhooks (no late double-settlement).
 */
@Injectable()
export class LenderDisbursementAttemptService {
  private readonly logger = new Logger(LenderDisbursementAttemptService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly mobileMoneyPaymentService: MobileMoneyPaymentService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  /** Seconds the customer has to approve USSD/PIN before we allow a new attempt. */
  private get pinWindowSeconds(): number {
    const raw = Number(
      this.configService.get<string>('MOMO_PIN_AUTHORIZATION_WINDOW_SECONDS') ||
        120,
    );
    return Number.isFinite(raw) && raw > 0 ? raw : 120;
  }

  async resolve(input: {
    tripId: string;
    payerId: string;
    loanId: string;
    findPayments: () => Promise<Payment[]>;
    ensureLenderMetadata: (payment: Payment, loanId: string) => Promise<Payment>;
    preferLoanLinked: (payments: Payment[], loanId: string) => Payment | undefined;
  }): Promise<LenderDisbursementPreflight> {
    const existing = await input.findPayments();

    const completed = existing.filter((p) => p.status === PaymentStatus.COMPLETED);
    if (completed.length > 0) {
      const match = input.preferLoanLinked(completed, input.loanId)!;
      const patched = await input.ensureLenderMetadata(match, input.loanId);
      return { outcome: 'already_completed', payment: patched };
    }

    const inFlight = existing.find(
      (p) =>
        (p.status === PaymentStatus.PENDING ||
          p.status === PaymentStatus.PROCESSING) &&
        !!(p.transactionId || (p.metadata as any)?.momoTransactionId || p.referenceNumber),
    );

    if (!inFlight) {
      return { outcome: 'proceed' };
    }

    return this.resolveInFlight(inFlight, input.loanId);
  }

  private async resolveInFlight(
    payment: Payment,
    loanId: string,
  ): Promise<LenderDisbursementPreflight> {
    const meta = (payment.metadata || {}) as Record<string, any>;
    const phase = meta.momoPhase as string | undefined;
    const ageSeconds = this.ageSeconds(payment);
    const pinWindow = this.pinWindowSeconds;
    const supportedPhases = new Set(['collection', 'payout', 'payout_initiating']);
    const isSupportedRail = !!(phase && supportedPhases.has(phase));

    // Always reconcile with provider first — never open a second charge if money moved.
    const provider = await this.queryProviderStatus(payment);

    if (provider.status === 'success') {
      this.logger.log(
        `Loan ${loanId}: provider reports success for payment ${payment.id} ` +
          `while local status is ${payment.status} — reconcile, do not re-charge`,
      );
      return {
        outcome: 'provider_settled',
        payment,
        reasonCode: DisbursementAttemptCloseReason.PROVIDER_SUCCESS_LOCAL_INCOMPLETE,
        providerStatus: 'success',
      };
    }

    if (provider.status === 'failed') {
      await this.closeAttempt(
        payment,
        DisbursementAttemptCloseReason.PROVIDER_FAILED,
        `Provider reported failed (${provider.raw || 'n/a'})`,
      );
      return {
        outcome: 'proceed',
        closedPaymentId: payment.id,
        reasonCode: DisbursementAttemptCloseReason.PROVIDER_FAILED,
      };
    }

    // Legacy lender→beneficiary P2P rail (no supported momoPhase).
    // Safe to close only after provider is not success.
    if (!isSupportedRail) {
      await this.closeAttempt(
        payment,
        DisbursementAttemptCloseReason.LEGACY_UNSUPPORTED_RAIL,
        'Closed legacy P2P MoMo attempt; retry uses merchant collection rail',
      );
      return {
        outcome: 'proceed',
        closedPaymentId: payment.id,
        reasonCode: DisbursementAttemptCloseReason.LEGACY_UNSUPPORTED_RAIL,
      };
    }

    // Supported rail — pending or unknown provider status
    if (provider.status === 'pending' || provider.status === 'unknown') {
      if (ageSeconds < pinWindow) {
        return {
          outcome: 'awaiting_confirmation',
          payment,
          reasonCode:
            provider.status === 'pending'
              ? 'AWAITING_CUSTOMER_AUTHORIZATION'
              : 'AWAITING_PROVIDER_SETTLEMENT',
          providerStatus: provider.status,
          retryAfterSeconds: Math.max(1, pinWindow - ageSeconds),
        };
      }

      const closeReason =
        provider.status === 'pending'
          ? DisbursementAttemptCloseReason.AUTHORIZATION_TIMEOUT
          : DisbursementAttemptCloseReason.PROVIDER_UNREACHABLE_STALE;

      await this.closeAttempt(
        payment,
        closeReason,
        provider.status === 'pending'
          ? `PIN/USSD authorization window elapsed (${pinWindow}s); customer may retry`
          : `Provider status unreachable after ${pinWindow}s; allowing controlled retry`,
      );

      return {
        outcome: 'proceed',
        closedPaymentId: payment.id,
        reasonCode: closeReason,
      };
    }

    if (ageSeconds < pinWindow) {
      return {
        outcome: 'awaiting_confirmation',
        payment,
        reasonCode: 'AWAITING_PROVIDER_SETTLEMENT',
        retryAfterSeconds: Math.max(1, pinWindow - ageSeconds),
      };
    }

    await this.closeAttempt(
      payment,
      DisbursementAttemptCloseReason.SUPERSEDED_BY_RETRY,
      'In-flight attempt superseded after authorization window',
    );
    return {
      outcome: 'proceed',
      closedPaymentId: payment.id,
      reasonCode: DisbursementAttemptCloseReason.SUPERSEDED_BY_RETRY,
    };
  }

  private ageSeconds(payment: Payment): number {
    const stamp = new Date(
      (payment as any).updatedAt || (payment as any).createdAt || 0,
    ).getTime();
    if (!Number.isFinite(stamp) || stamp <= 0) return Number.MAX_SAFE_INTEGER;
    return Math.floor((Date.now() - stamp) / 1000);
  }

  private async queryProviderStatus(payment: Payment): Promise<{
    status: 'success' | 'failed' | 'pending' | 'unknown';
    raw?: string;
  }> {
    const meta = (payment.metadata || {}) as Record<string, any>;
    const candidates = [
      meta.referenceId,
      payment.referenceNumber,
      meta.payoutReferenceId,
      meta.collectionReferenceId,
      payment.transactionId,
      meta.momoTransactionId,
    ].filter((v): v is string => typeof v === 'string' && v.trim().length > 0);

    const unique = [...new Set(candidates)];

    for (const ref of unique) {
      try {
        const response = await this.mobileMoneyPaymentService.checkTransactionStatus(ref);
        const txn = response.savedTransaction || response.transaction;
        const raw = String(txn?.status || '').toLowerCase();
        if (!raw) continue;

        if (raw === 'success' || raw === 'successful' || raw === 'completed') {
          return { status: 'success', raw };
        }
        if (raw === 'failed' || raw === 'failure' || raw === 'rejected') {
          return { status: 'failed', raw };
        }
        if (raw === 'pending' || raw === 'processing' || raw === 'initiated') {
          return { status: 'pending', raw };
        }
        return { status: 'unknown', raw };
      } catch (err: any) {
        this.logger.warn(
          `Provider status check failed for ref ${ref} (payment ${payment.id}): ${err?.message || err}`,
        );
      }
    }

    return { status: 'unknown' };
  }

  async closeAttempt(
    payment: Payment,
    reasonCode: DisbursementAttemptCloseReason,
    detail: string,
  ): Promise<Payment> {
    if (
      payment.status !== PaymentStatus.PENDING &&
      payment.status !== PaymentStatus.PROCESSING
    ) {
      return payment;
    }

    payment.status = PaymentStatus.CANCELLED;
    payment.failureReason = `${reasonCode}: ${detail}`;
    payment.metadata = {
      ...(payment.metadata || {}),
      attemptClosedAt: new Date().toISOString(),
      attemptCloseReasonCode: reasonCode,
      attemptCloseDetail: detail,
      cancelledReason: detail,
      cancelledAt: new Date().toISOString(),
    };

    const saved = await this.paymentRepository.save(payment);
    await this.auditService.log('CLOSE_DISBURSEMENT_ATTEMPT', saved, {
      reasonCode,
      detail,
    });
    this.logger.warn(
      `Closed disbursement attempt ${saved.id} [${reasonCode}] — ${detail}`,
    );
    return saved;
  }
}
