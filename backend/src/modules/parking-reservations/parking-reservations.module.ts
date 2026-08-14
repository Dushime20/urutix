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
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';
import { EventsModule } from '../events/events.module';
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
    ]),
    EnhancedAuthModule,
    EventsModule,
  ],
  controllers: [ParkingReservationsController],
  providers: [ParkingReservationsService, ParkingReservationListener],
  exports: [ParkingReservationsService],
})
export class ParkingReservationsModule {}
