import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { Notification } from '../../entities/notification.entity';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { PushNotificationService } from './services/push-notification.service';
import { WebhookService } from './services/webhook.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    EmailService,
    SmsService,
    PushNotificationService,
    WebhookService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
