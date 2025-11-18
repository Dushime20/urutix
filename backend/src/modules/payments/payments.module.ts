import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Payment } from '../../entities/payment.entity';
import { Trip } from '../../entities/trip.entity';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
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
import { PaymentAnalyticsService } from './services/payment-analytics.service';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Trip]),
    EventEmitterModule.forRoot(),
  ],
  providers: [
    PaymentsService,
    PaymentProcessingService,
    EscrowService,
    AuditService,
    FraudDetectionService,
    WebhookService,
    MicroLendingService,
    TenantPaymentConfigService,
    TransactionStateService,
    ProviderIntegrationService,
    IdempotencyService,
    ReconciliationService,
    PaymentAnalyticsService,
    RateLimitGuard,
  ],
  controllers: [PaymentsController],
  exports: [
    PaymentsService,
    PaymentProcessingService,
    EscrowService,
    AuditService,
    FraudDetectionService,
    WebhookService,
    MicroLendingService,
    TenantPaymentConfigService,
    TransactionStateService,
    ProviderIntegrationService,
    IdempotencyService,
    ReconciliationService,
    PaymentAnalyticsService,
    RateLimitGuard,
  ],
})
export class PaymentsModule {}
