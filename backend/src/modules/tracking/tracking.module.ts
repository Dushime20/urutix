import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { TrackingGateway } from './tracking.gateway';
import { Trip } from '../../entities/trip.entity';
import { Driver } from '../../entities/driver.entity';
import { Location } from '../../entities/location.entity';
import { Notification } from '../../entities/notification.entity';
import { TripLocation } from './entities/trip-location.entity';
import { Geofence } from './entities/geofence.entity';
import { DriverAlert } from './entities/driver-alert.entity';
import { TripEvent } from './entities/trip-event.entity';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trip,
      Driver,
      Location,
      Notification,
      TripLocation,
      Geofence,
      DriverAlert,
      TripEvent,
    ]),
    EnhancedAuthModule,
  ],
  controllers: [TrackingController],
  providers: [TrackingService, TrackingGateway],
  exports: [TrackingService, TrackingGateway],
})
export class TrackingModule {}
