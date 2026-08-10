import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { LoadsController } from './loads.controller';
import { LoadsService } from './loads.service';
import { LoadTemplateController } from './load-template.controller';
import { LoadTemplateService } from './load-template.service';
import { LoadHistoryService } from './services/load-history.service';
import { LoadAuditService } from './services/load-audit.service';
import { CargoHistoryListener } from './listeners/cargo-history.listener';
import { Load } from '../../entities/load.entity';
import { LoadTemplate } from '../../entities/load-template.entity';
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
import { CargoInspection } from '../../entities/cargo-inspection.entity';
import { BrokerCommission } from '../../entities/broker-commission.entity';
import { TripEvent } from '../tracking/entities/trip-event.entity';
import { LocationsModule } from '../locations/locations.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { MatchingModule } from '../matching/matching.module';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';
import { BrokersModule } from '../brokers/brokers.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Load,
      LoadTemplate,
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
      CargoInspection,
      BrokerCommission,
      TripEvent,
    ]),
    ScheduleModule.forRoot(),
    LocationsModule,
    FileUploadModule,
    MatchingModule,
    EnhancedAuthModule,
    forwardRef(() => BrokersModule),
  ],
  controllers: [LoadsController, LoadTemplateController],
  providers: [
    LoadsService,
    LoadTemplateService,
    LoadHistoryService,
    LoadAuditService,
    CargoHistoryListener,
    RolesGuard,
    TenantGuard,
  ],
  exports: [
    LoadsService,
    LoadTemplateService,
    LoadAuditService,
    LoadHistoryService,
  ],
})
export class LoadsModule {}
