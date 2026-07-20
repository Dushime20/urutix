import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from '../../entities/driver.entity';
import { Load } from '../../entities/load.entity';
import { Truck } from '../../entities/truck.entity';
import { SafetyIncident } from '../../entities/safety-incident.entity';
import { Trip } from '../../entities/trip.entity';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { OcrModule } from '../ocr/ocr.module';
import { NotificationModule } from '../notifications/notification.module';
import { LoadsModule } from '../loads/loads.module';
import { TripsModule } from '../trips/trips.module';
import { PreTripInspectionModule } from './pre-trip-inspection.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver, Load, Truck, SafetyIncident, Trip]),
    OcrModule,
    NotificationModule,
    LoadsModule,
    TripsModule,
    PreTripInspectionModule,
  ],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}
