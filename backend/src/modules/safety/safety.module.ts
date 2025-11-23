import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafetyIncident } from '../../entities/safety-incident.entity';
import { SafetyInspection } from '../../entities/safety-inspection.entity';
import { SafetyTraining } from '../../entities/safety-training.entity';
import { Notification } from '../../entities/notification.entity';
import { SafetyService } from './safety.service';
import { SafetyController } from './safety.controller';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SafetyIncident,
      SafetyInspection,
      SafetyTraining,
      Notification,
    ]),
    NotificationModule,
  ],
  providers: [SafetyService],
  controllers: [SafetyController],
  exports: [SafetyService],
})
export class SafetyModule {}
