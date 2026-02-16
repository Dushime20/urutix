import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { Truck } from '../../entities/truck.entity';
import { Driver } from '../../entities/driver.entity';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { SubscriptionModule } from '../subscription/subscription.module';
import { CreditConsumptionListener } from '../../services/credit-consumption.listener';
import { UserProfile } from '../../entities/user-profile.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, Load, Truck, Driver]),
    SubscriptionModule, // Import to get CreditService and PricingService
    NotificationsModule, // Import to get NotificationService
  ],
  providers: [TripsService, CreditConsumptionListener],
  controllers: [TripsController],
  exports: [TripsService],
})
export class TripsModule {}
