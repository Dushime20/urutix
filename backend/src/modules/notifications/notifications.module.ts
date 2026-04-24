import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { Notification } from '../../entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationPreference } from '../../entities/notification-preference.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationService } from './services/notification.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { PushService } from './services/push.service';
import { InAppService } from './services/in-app.service';
import { RateLimitService } from './services/rate-limit.service';
import { TemplateService } from './services/template.service';
import { AuctionNotificationListener } from './listeners/auction-notification.listener';
import { TripNotificationListener } from './listeners/trip-notification.listener';
import { PaymentNotificationListener } from './listeners/payment-notification.listener';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationTemplate,
      NotificationPreference,
    ]),
    EventEmitterModule.forRoot(),
    ConfigModule,
    EventsModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationService,
    EmailService,
    SmsService,
    PushService,
    InAppService,
    RateLimitService,
    TemplateService,
    // Event Listeners
    AuctionNotificationListener,
    TripNotificationListener,
    PaymentNotificationListener,
  ],
  exports: [
    NotificationsService,
    NotificationService,
    EmailService,
    SmsService,
    PushService,
    InAppService,
    RateLimitService,
    TemplateService,
  ],
})
export class NotificationsModule {}
