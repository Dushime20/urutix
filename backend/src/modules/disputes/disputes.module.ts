import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import {
  DisputeV2,
  DisputeMessage,
  DisputeAttachment,
  DisputeResolutionRecord,
  DisputeAuditLog,
  DisputeAssignment,
  DisputeEscalation,
} from '../../entities/dispute-v2.entity';
import { User } from '../../entities/user.entity';
import { Notification } from '../../entities/notification.entity';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { DisputeNotificationListener } from './listeners/dispute-notification.listener';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { EventsModule } from '../events/events.module';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DisputeV2,
      DisputeMessage,
      DisputeAttachment,
      DisputeResolutionRecord,
      DisputeAuditLog,
      DisputeAssignment,
      DisputeEscalation,
      User,
      Notification,
    ]),
    EventEmitterModule.forRoot(),
    ConfigModule,
    FileUploadModule,
    EventsModule,
    EnhancedAuthModule,
    NotificationsModule,
  ],
  controllers: [DisputesController],
  providers: [DisputesService, DisputeNotificationListener],
  exports: [DisputesService],
})
export class DisputesModule {}
