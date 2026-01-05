import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoadsController } from './loads.controller';
import { LoadsService } from './loads.service';
import { Load } from '../../entities/load.entity';
import { Document } from '../../entities/document.entity';
import { TrackingEvent } from '../../entities/tracking-event.entity';
import { Alert } from '../../entities/alert.entity';
import { AuditEvent } from '../../entities/audit-event.entity';
import { PriceSuggestion } from '../../entities/price-suggestion.entity';
import { Location } from '../../entities/location.entity';
import { User } from '../../entities/user.entity';
import { Bid } from '../../entities/bid.entity';
import { Payment } from '../../entities/payment.entity';
import { Trip } from '../../entities/trip.entity';
import { Truck } from '../../entities/truck.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { LocationsModule } from '../locations/locations.module';
import { MatchingModule } from '../matching/matching.module';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';
import { BrokersModule } from '../brokers/brokers.module';
import { RolesGuard } from '../auth/roles.guard';
import { TenantGuard } from '../auth/tenant.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Load,
      Document,
      TrackingEvent,
      Alert,
      AuditEvent,
      PriceSuggestion,
      Location,
      User,
      Bid,
      Payment,
      Trip,
      Truck,
      UserProfile,
    ]),
    LocationsModule,
    MatchingModule,
    EnhancedAuthModule,
    BrokersModule,
  ],
  controllers: [LoadsController],
  providers: [LoadsService, RolesGuard, TenantGuard],
  exports: [LoadsService],
})
export class LoadsModule {}
