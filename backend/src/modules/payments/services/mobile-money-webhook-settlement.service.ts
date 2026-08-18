import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentMethod, PaymentStatus, PaymentType } from '../../../entities/payment.entity';
import { PaymentsService } from '../payments.service';

/**
 * Routes Ishema webhook outcomes to the correct domain service.
 * Business statuses (loan DISBURSED, subscription active, etc.) must only
 * change here — after the provider confirms success — never on API initiate.
 */
@Injectable()
export class MobileMoneyWebhookSettlementService {
  private readonly logger = new Logger(MobileMoneyWebhookSettlementService.name);

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly paymentsService: PaymentsService,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async settleSuccessfulPayment(
    payment: Payment,
    callback: { referenceId: string; amount: number; message?: string },
  ): Promise<void> {
    const meta = (payment.metadata || {}) as Record<string, any>;
    const referenceId = callback.referenceId;

    if (meta.isLenderPayment && meta.loanId) {
      await this.invokeLending('confirmDisbursementFromWebhook', {
        referenceId,
        transactionId: payment.transactionId || referenceId,
        paymentId: payment.id,
      });
      return;
    }

    if (meta.isLoanRepayment || meta.pendingLoanRepayment) {
      await this.invokeLending('confirmRepaymentFromWebhook', {
        referenceId,
        transactionId: payment.transactionId || referenceId,
        paymentId: payment.id,
      });
      return;
    }

    if (
      payment.paymentType === PaymentType.SUBSCRIPTION ||
      referenceId.startsWith('SUB-') ||
      referenceId.startsWith('RENEW-') ||
      meta.pendingSubscriptionActivation
    ) {
      await this.invokeSubscription('confirmSubscriptionFromWebhook', {
        referenceId,
        transactionId: payment.transactionId || referenceId,
        paymentId: payment.id,
      });
      return;
    }

    if (referenceId.startsWith('PARK-') || meta.isParkingReservation || meta.parkingReservationId) {
      await this.invokeParking('confirmFromIshemaWebhook', {
        referenceId,
        transactionId: payment.transactionId || referenceId,
        paymentId: payment.id,
      });
      return;
    }

    this.logger.log(
      `Generic trip/service payment ${payment.id} completed via webhook (${referenceId})`,
    );
  }

  async settleParkingReservation(payload: { referenceId: string; transactionId?: string; paymentId?: string }) {
    await this.invokeParking('confirmFromIshemaWebhook', payload);
  }

  async settleFailedPayment(
    payment: Payment,
    callback: { referenceId: string; message?: string },
  ): Promise<void> {
    const meta = (payment.metadata || {}) as Record<string, any>;
    const referenceId = callback.referenceId;
    const reason = callback.message || 'Mobile Money payment failed';

    if (meta.isLenderPayment && meta.loanId) {
      await this.invokeLending('failDisbursementFromWebhook', {
        referenceId,
        reason,
        paymentId: payment.id,
      });
      return;
    }

    if (meta.isLoanRepayment || meta.pendingLoanRepayment) {
      await this.invokeLending('failRepaymentFromWebhook', {
        referenceId,
        reason,
        paymentId: payment.id,
      });
      return;
    }

    if (
      payment.paymentType === PaymentType.SUBSCRIPTION ||
      referenceId.startsWith('SUB-') ||
      referenceId.startsWith('RENEW-') ||
      meta.pendingSubscriptionActivation
    ) {
      await this.invokeSubscription('failSubscriptionFromWebhook', {
        referenceId,
        reason,
        paymentId: payment.id,
      });
    }
  }

  /** Resolve payment when callback reference differs from stored transactionId. */
  async findPaymentForCallback(referenceId: string): Promise<Payment | null> {
    const direct = await this.paymentRepository.find({
      where: [
        { transactionId: referenceId },
        { referenceNumber: referenceId },
      ],
      relations: ['trip'],
    });

    if (direct[0]) return direct[0];

    const viaMetadata = await this.paymentRepository
      .createQueryBuilder('payment')
      .where(
        `(payment.metadata->>'referenceId' = :referenceId OR payment.metadata->>'externalId' = :referenceId OR payment.metadata->>'momoTransactionId' = :referenceId)`,
        { referenceId },
      )
      .getOne();

    return viaMetadata;
  }

  private async invokeLending(method: string, payload: Record<string, unknown>): Promise<void> {
    try {
      const { LendingService } = await import('../../lending/lending.service');
      const lendingService = this.moduleRef.get(LendingService, { strict: false });
      if (!lendingService?.[method]) {
        this.logger.error(`LendingService.${method} is not available`);
        return;
      }
      await lendingService[method](payload);
    } catch (err: any) {
      this.logger.error(`Lending webhook handler ${method} failed: ${err.message}`, err.stack);
    }
  }

  private async invokeSubscription(method: string, payload: Record<string, unknown>): Promise<void> {
    try {
      const { SubscriptionService } = await import('../../../services/subscription.service');
      const subscriptionService = this.moduleRef.get(SubscriptionService, { strict: false });
      if (!subscriptionService?.[method]) {
        this.logger.error(`SubscriptionService.${method} is not available`);
        return;
      }
      await subscriptionService[method](payload);
    } catch (err: any) {
      this.logger.error(`Subscription webhook handler ${method} failed: ${err.message}`, err.stack);
    }
  }

  private async invokeParking(method: string, payload: Record<string, unknown>): Promise<void> {
    try {
      const { ParkingReservationsService } = await import('../../parking-reservations/parking-reservations.service');
      const parkingService = this.moduleRef.get(ParkingReservationsService, { strict: false });
      if (!parkingService?.[method]) {
        this.logger.error(`ParkingReservationsService.${method} is not available`);
        return;
      }
      await parkingService[method](payload);
    } catch (err: any) {
      this.logger.error(`Parking webhook handler ${method} failed: ${err.message}`, err.stack);
    }
  }
}
