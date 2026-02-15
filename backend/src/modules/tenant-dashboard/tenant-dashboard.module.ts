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
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { PartnerBillingController } from './partner-billing-mgmt.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Load, Truck, User, Trip, Payment, Bid]),
    EnhancedAuthModule,
    SubscriptionModule,
  ],
  controllers: [TenantDashboardController, PartnerBillingController],
  providers: [TenantDashboardService],
  exports: [TenantDashboardService],
})
export class TenantDashboardModule { }
