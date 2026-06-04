import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CarrierTierService } from './carrier-tier.service';
import { CarrierTierController } from './carrier-tier.controller';
import { CarrierTier } from '../../entities/carrier-tier.entity';
import { Trip } from '../../entities/trip.entity';
import { Truck } from '../../entities/truck.entity';
import { Notification } from '../../entities/notification.entity';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CarrierTier, Trip, Truck, Notification]),
    ScheduleModule.forRoot(),
    EnhancedAuthModule,
  ],
  controllers: [CarrierTierController],
  providers: [CarrierTierService],
  exports: [CarrierTierService],
})
export class CarrierTierModule {}
