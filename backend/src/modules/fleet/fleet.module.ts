import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Truck } from '../../entities/truck.entity';
import { Driver } from '../../entities/driver.entity';
import { Route } from '../../entities/route.entity';
import { RouteTruck } from '../../entities/route-truck.entity';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { FleetService } from './fleet.service';
import { FleetController } from './fleet.controller';
import { FleetNotificationService } from './fleet-notification.service';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Truck, Driver, Route, RouteTruck, User, UserProfile]),
    ScheduleModule.forRoot(),
    NotificationModule,
  ],
  providers: [FleetService, FleetNotificationService],
  controllers: [FleetController],
  exports: [FleetService],
})
export class FleetModule {}
