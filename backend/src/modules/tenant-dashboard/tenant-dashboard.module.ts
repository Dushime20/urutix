import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantDashboardController } from './tenant-dashboard.controller';
import { TenantDashboardService } from './tenant-dashboard.service';
import { Load } from '../../entities/load.entity';
import { Truck } from '../../entities/truck.entity';
import { User } from '../../entities/user.entity';
import { Trip } from '../../entities/trip.entity';
import { Payment } from '../../entities/payment.entity';
import { Bid } from '../../entities/bid.entity';
import { CreditAccount } from '../../entities/credit-account.entity';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PartnerBillingController } from './partner-billing-mgmt.controller';
import { TenantBulkEmailController } from './tenant-bulk-email.controller';
import { BulkEmailService } from '../../services/bulk-email.service';
import { EmailTemplate } from '../../entities/email-template.entity';
import { BulkEmailLog } from '../../entities/bulk-email-log.entity';
import { AIEmailAssistantService } from '../../services/ai-email-assistant.service';
import { Tenant } from '../../entities/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Load, Truck, User, Trip, Payment, Bid, CreditAccount, EmailTemplate, BulkEmailLog, Tenant]),
    EnhancedAuthModule,
    SubscriptionModule,
    NotificationsModule,
  ],
  controllers: [TenantDashboardController, PartnerBillingController, TenantBulkEmailController],
  providers: [TenantDashboardService, BulkEmailService, AIEmailAssistantService],
  exports: [TenantDashboardService],
})
export class TenantDashboardModule { }
