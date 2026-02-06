import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { Truck } from '../../entities/truck.entity';
import { Driver } from '../../entities/driver.entity';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';

import { UserProfile } from '../../entities/user-profile.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationService } from '../notifications/notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, Load, Truck, Driver, UserProfile]),
    NotificationsModule,
  ],
  providers: [TripsService],
  controllers: [TripsController],
  exports: [TripsService],
})
export class TripsModule {}
