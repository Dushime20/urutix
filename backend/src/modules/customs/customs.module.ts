import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomsInspection } from '../../entities/customs-inspection.entity';
import { CustomsCheckpoint } from '../../entities/customs-checkpoint.entity';
import { CustomsComplianceResponse } from '../../entities/customs-compliance-response.entity';
import { Trip } from '../../entities/trip.entity';
import { Truck } from '../../entities/truck.entity';
import { Document } from '../../entities/document.entity';
import { Notification } from '../../entities/notification.entity';
import { CustomsService } from './customs.service';
import { CustomsController } from './customs.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomsInspection,
      CustomsCheckpoint,
      CustomsComplianceResponse,
      Trip,
      Truck,
      Document,
      Notification,
    ]),
    NotificationsModule,
  ],
  providers: [CustomsService],
  controllers: [CustomsController],
  exports: [CustomsService],
})
export class CustomsModule {}
