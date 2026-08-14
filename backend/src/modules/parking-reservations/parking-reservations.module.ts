import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ParkingFacilityConfig,
  ParkingReservation,
  ParkingReservationActivity,
  ParkingReservationSequence,
} from '../../entities/parking-reservation.entity';
import { User } from '../../entities/user.entity';
import { Tenant } from '../../entities/tenant.entity';
import { Notification } from '../../entities/notification.entity';
import { Driver } from '../../entities/driver.entity';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';
import { EventsModule } from '../events/events.module';
import { MessengerModule } from '../messenger/messenger.module';
import { SmsService } from '../notifications/services/sms.service';
import { ParkingReservationsController } from './parking-reservations.controller';
import { ParkingReservationsService } from './parking-reservations.service';
import { ParkingReservationListener } from './listeners/parking-reservation.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParkingReservation,
      ParkingReservationActivity,
      ParkingFacilityConfig,
      ParkingReservationSequence,
      User,
      Tenant,
      Notification,
      Driver,
    ]),
    EnhancedAuthModule,
    EventsModule,
    MessengerModule,
  ],
  controllers: [ParkingReservationsController],
  providers: [ParkingReservationsService, ParkingReservationListener, SmsService],
  exports: [ParkingReservationsService],
})
export class ParkingReservationsModule {}
