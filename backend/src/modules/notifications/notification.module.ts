import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { PushNotificationService } from './services/push-notification.service';
import { WebhookService } from './services/webhook.service';
import { CargoNotificationListener } from './listeners/cargo-notification.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    EmailService,
    SmsService,
    PushNotificationService,
    WebhookService,
    CargoNotificationListener,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
