import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { TenantSubscription } from '../../entities/tenant-subscription.entity';
import { CreditAccount } from '../../entities/credit-account.entity';
import { CreditTransaction } from '../../entities/credit-transaction.entity';
import { SubscriptionPayment } from '../../entities/subscription-payment.entity';
import { CreditPackage } from '../../entities/credit-package.entity';
import { FeatureCreditCost } from '../../entities/feature-credit-cost.entity';
import { CreditPricingRule } from '../../entities/credit-pricing-rule.entity';
import { Tenant } from '../../entities/tenant.entity';
import { Payment } from '../../entities/payment.entity';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { User } from '../../entities/user.entity';

// Services
import { SubscriptionService } from '../../services/subscription.service';
import { CreditService } from '../../services/credit.service';
import { SubscriptionSchedulerService } from '../../services/subscription-scheduler.service';
import { PricingService } from '../../services/pricing.service';
import { CreditConsumptionListener } from '../../services/credit-consumption.listener';

// Controllers (to be created)
import { SubscriptionController } from './subscription.controller';
import { CreditController } from './credit.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlan,
      TenantSubscription,
      CreditAccount,
      CreditTransaction,
      SubscriptionPayment,
      CreditPackage,
      FeatureCreditCost,
      CreditPricingRule,
      Tenant,
      Payment,
      Trip,
      Load,
      User,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [SubscriptionController, CreditController],
  providers: [
    SubscriptionService,
    CreditService,
    SubscriptionSchedulerService,
    PricingService,
    CreditConsumptionListener,
  ],
  exports: [SubscriptionService, CreditService, PricingService, CreditConsumptionListener],
})
export class SubscriptionModule { }
