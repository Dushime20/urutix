import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Truck } from '../../entities/truck.entity';
import { Driver } from '../../entities/driver.entity';
import { Route } from '../../entities/route.entity';
import { RouteTruck } from '../../entities/route-truck.entity';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { Epod } from '../../entities/epod.entity';
import { Trip } from '../../entities/trip.entity';
import { Invoice, InvoiceItem } from '../financial/entities/invoice.entity';
import { Load } from '../../entities/load.entity';
import { Document } from '../../entities/document.entity';
import { FleetService } from './fleet.service';
import { FleetController } from './fleet.controller';
import { FleetEpodController } from './fleet-epod.controller';
import { FleetNotificationService } from './fleet-notification.service';
import { EpodService } from '../trips/epod.service';
import { NotificationModule } from '../notifications/notification.module';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';
import { TripsModule } from '../trips/trips.module';
import { DocumentModule } from '../documents/document.module';
import { FileUploadModule } from '../file-upload/file-upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Truck,
      Driver,
      Route,
      RouteTruck,
      User,
      UserProfile,
      PasswordResetToken,
      Epod,
      Trip,
      Invoice,
      InvoiceItem,
      Load,
      Document,
    ]),
    ScheduleModule.forRoot(),
    NotificationModule,
    EnhancedAuthModule,
    TripsModule,
    DocumentModule,
    FileUploadModule,
  ],
  providers: [FleetService, FleetNotificationService],
  controllers: [FleetController, FleetEpodController],
  exports: [FleetService],
})
export class FleetModule {}
