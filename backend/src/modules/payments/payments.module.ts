import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Payment } from '../../entities/payment.entity';
import { Trip } from '../../entities/trip.entity';
import { Receipt } from '../../entities/receipt.entity';
import { Invoice, InvoiceItem } from '../financial/entities/invoice.entity';
import { Load } from '../../entities/load.entity';
import { User } from '../../entities/user.entity';
import { Bid } from '../../entities/bid.entity';
import { Truck } from '../../entities/truck.entity';
import { PaymentAuditLog } from '../../entities/payment-audit-log.entity';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PendingPaymentsController } from './controllers/pending-payments.controller';
import { PaymentProcessingService } from './services/payment-processing.service';
import { EscrowService } from './services/escrow.service';
import { AuditService } from './services/audit.service';
import { FraudDetectionService } from './services/fraud-detection.service';
import { WebhookService } from './services/webhook.service';
import { MicroLendingService } from './services/micro-lending.service';
import { TenantPaymentConfigService } from './services/tenant-payment-config.service';
import { TransactionStateService } from './services/transaction-state.service';
import { ProviderIntegrationService } from './services/provider-integration.service';
import { MobileMoneyPaymentService } from './services/mobile-money-payment.service';
import { InvoiceReceiptService } from './services/invoice-receipt.service';
import { IdempotencyService } from './services/idempotency.service';
import { ReconciliationService } from './services/reconciliation.service';
import { PaymentAnalyticsService } from './services/payment-analytics.service';
import { PaymentCalculationService } from './services/payment-calculation.service';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { HttpModule } from '@nestjs/axios';
import { NotificationsModule } from '../notifications/notifications.module';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Trip, Receipt, Invoice, InvoiceItem, Load, User, Bid, Truck, PaymentAuditLog]),
    EventEmitterModule.forRoot(),
    HttpModule,
    NotificationsModule,
    TripsModule,
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
    MobileMoneyPaymentService,
    InvoiceReceiptService,
    IdempotencyService,
    ReconciliationService,
    PaymentAnalyticsService,
    PaymentCalculationService,
    RateLimitGuard,
  ],
  controllers: [PaymentsController, PendingPaymentsController],
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
    MobileMoneyPaymentService,
    InvoiceReceiptService,
    IdempotencyService,
    ReconciliationService,
    PaymentAnalyticsService,
    PaymentCalculationService,
    RateLimitGuard,
  ],
})
export class PaymentsModule {}
