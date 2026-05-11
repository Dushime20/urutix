import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CargoOwnerEpodController } from './cargo-owner-epod.controller';
import { EpodService } from '../trips/epod.service';
import { Epod } from '../../entities/epod.entity';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { User } from '../../entities/user.entity';
import { Driver } from '../../entities/driver.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Invoice, InvoiceItem } from '../financial/entities/invoice.entity';
import { Tenant } from '../../entities/tenant.entity';
import { Payment } from '../../entities/payment.entity';
import { NotificationModule } from '../notifications/notification.module';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Epod,
      Trip,
      Load,
      User,
      Driver,
      UserProfile,
      Invoice,
      InvoiceItem,
      Tenant,
      Payment,
    ]),
    NotificationModule,
    EnhancedAuthModule,
    ConfigModule,
    EventEmitterModule,
    TripsModule,
  ],
  controllers: [CargoOwnerEpodController],
  providers: [],
  exports: [],
})
export class CargoOwnerModule {}
