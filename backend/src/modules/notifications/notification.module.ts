import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { Driver } from '../../entities/driver.entity';
import { Load } from '../../entities/load.entity';
import { Trip } from '../../entities/trip.entity';
import { SmsService } from './services/sms.service';
import { PushNotificationService } from './services/push-notification.service';
import { WebhookService } from './services/webhook.service';
import { CargoNotificationListener } from './listeners/cargo-notification.listener';
import { DriverBreakNotificationListener } from './listeners/driver-break-notification.listener';
import { SystemAdminNotificationListener } from './listeners/system-admin-notification.listener';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';
import { MessengerModule } from '../messenger/messenger.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, Driver, Load, Trip]),
    // EventEmitterModule.forRoot() lives in AppModule only — a second forRoot()
    // here creates a separate EventEmitter2, so system.admin.* events never reach
    // SystemAdminNotificationListener.
    EnhancedAuthModule,
    MessengerModule,
    EventsModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    SmsService,
    PushNotificationService,
    WebhookService,
    CargoNotificationListener,
    DriverBreakNotificationListener,
    SystemAdminNotificationListener,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
