import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { Truck } from '../../entities/truck.entity';
import { Driver } from '../../entities/driver.entity';
import { User } from '../../entities/user.entity';
import { AuditEvent } from '../../entities/audit-event.entity';
import { TenantSubscription } from '../../entities/tenant-subscription.entity';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { CreditAccount } from '../../entities/credit-account.entity';
import { CreditTransaction } from '../../entities/credit-transaction.entity';
import { FeatureCreditCost } from '../../entities/feature-credit-cost.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Epod } from '../../entities/epod.entity';
import { Invoice, InvoiceItem } from '../financial/entities/invoice.entity';
import { Payment } from '../../entities/payment.entity';
import { TripLocation } from '../tracking/entities/trip-location.entity';

import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { EpodService } from './epod.service';
import { EpodController } from './epod.controller';
import { TripCompletionService } from './services/trip-completion.service';
import { TripOverdueSchedulerService } from './services/trip-overdue-scheduler.service';

import { NotificationsModule } from '../notifications/notifications.module';
import { CreditService } from '../../services/credit.service';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';
import { TrackingModule } from '../tracking/tracking.module';
import { AvailabilityModule } from '../availability/availability.module';
import { PreTripInspectionModule } from '../drivers/pre-trip-inspection.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trip, Load, Truck, Driver, UserProfile, User, AuditEvent,
      TenantSubscription, SubscriptionPlan,
      CreditAccount, CreditTransaction, FeatureCreditCost,
      Epod, Invoice, InvoiceItem, Payment, TripLocation,
    ]),
    NotificationsModule,
    EnhancedAuthModule,
    TrackingModule,
    AvailabilityModule,
    PreTripInspectionModule,
  ],
  providers: [
    TripsService,
    CreditService,
    EpodService,
    TripCompletionService,
    TripOverdueSchedulerService,
  ],
  controllers: [TripsController, EpodController],
  exports: [TripsService, EpodService, TripCompletionService, TripOverdueSchedulerService],
})
export class TripsModule {}
