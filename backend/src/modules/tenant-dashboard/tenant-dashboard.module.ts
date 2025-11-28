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

@Module({
  imports: [
    TypeOrmModule.forFeature([Load, Truck, User, Trip, Payment, Bid]),
    EnhancedAuthModule,
  ],
  controllers: [TenantDashboardController],
  providers: [TenantDashboardService],
  exports: [TenantDashboardService],
})
export class TenantDashboardModule {}
