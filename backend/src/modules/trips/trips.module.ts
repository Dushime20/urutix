import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { Truck } from '../../entities/truck.entity';
import { Driver } from '../../entities/driver.entity';
import { User } from '../../entities/user.entity';
import { TenantSubscription } from '../../entities/tenant-subscription.entity';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { CreditAccount } from '../../entities/credit-account.entity';
import { CreditTransaction } from '../../entities/credit-transaction.entity';
import { FeatureCreditCost } from '../../entities/feature-credit-cost.entity';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { UserProfile } from '../../entities/user-profile.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationService } from '../notifications/notification.service';
import { CreditService } from '../../services/credit.service';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trip, Load, Truck, Driver, UserProfile, User,
      TenantSubscription, SubscriptionPlan,
      CreditAccount, CreditTransaction, FeatureCreditCost,
    ]),
    NotificationsModule,
    EnhancedAuthModule,
  ],
  providers: [TripsService, CreditService],
  controllers: [TripsController],
  exports: [TripsService],
})
export class TripsModule {}
