import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CargoInspection } from '../../entities/cargo-inspection.entity';
import { Load } from '../../entities/load.entity';
import { Driver } from '../../entities/driver.entity';
import { User } from '../../entities/user.entity';
import { PreTripInspectionService } from './pre-trip-inspection.service';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CargoInspection, Load, Driver, User]),
    NotificationModule,
  ],
  providers: [PreTripInspectionService],
  exports: [PreTripInspectionService],
})
export class PreTripInspectionModule {}
