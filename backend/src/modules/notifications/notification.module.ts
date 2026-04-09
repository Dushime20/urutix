import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { Driver } from '../../entities/driver.entity';
import { Load } from '../../entities/load.entity';
import { Trip } from '../../entities/trip.entity';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { PushNotificationService } from './services/push-notification.service';
import { WebhookService } from './services/webhook.service';
import { CargoNotificationListener } from './listeners/cargo-notification.listener';
import { DriverBreakNotificationListener } from './listeners/driver-break-notification.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, Driver, Load, Trip]),
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
    DriverBreakNotificationListener,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
