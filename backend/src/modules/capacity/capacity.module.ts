import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CapacityOffer } from '../../entities/capacity-offer.entity';
import { CapacityBooking } from '../../entities/capacity-booking.entity';
import { Truck } from '../../entities/truck.entity';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { Payment } from '../../entities/payment.entity';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { CapacityController } from './capacity.controller';
import { CapacityService } from './capacity.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CapacityOffer, CapacityBooking, Truck, Trip, Load, Payment]),
    EnhancedAuthModule,
    CampaignsModule,
  ],
  controllers: [CapacityController],
  providers: [CapacityService],
  exports: [CapacityService],
})
export class CapacityModule {}
