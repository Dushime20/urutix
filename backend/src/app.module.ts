import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EnhancedAuthModule } from './modules/auth/enhanced-auth.module';
import { LoadsModule } from './modules/loads/loads.module';
import { LoadsV2Module } from './modules/loads/loads-v2.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { FinancialModule } from './modules/financial/financial.module';
import { FleetModule } from './modules/fleet/fleet.module';
import { MatchingModule } from './modules/matching/matching.module';
import { BiddingModule } from './modules/bidding/bidding.module';
import { AdminModule } from './modules/admin/admin.module';
import { TenantDashboardModule } from './modules/tenant-dashboard/tenant-dashboard.module';
import { UsersModule } from './modules/users/users.module';
import { LendingModule } from './modules/lending/lending.module';
import { InsuranceModule } from './modules/insurance/insurance.module';
import { DocumentModule } from './modules/documents/document.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { SafetyModule } from './modules/safety/safety.module';
import { TripsModule } from './modules/trips/trips.module';
import { DriverModule } from './modules/drivers/driver.module';
import { ReceiversModule } from './modules/receivers/receivers.module';
import { databaseConfig } from './config/database.config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseConfig),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    EnhancedAuthModule,
    LoadsModule,
    LoadsV2Module,
    RatingsModule,
    RewardsModule,
    ScoringModule,
    TrackingModule,
    FinancialModule,
    FleetModule,
    MatchingModule,
    BiddingModule,
    AdminModule,
    TenantDashboardModule,
    UsersModule,
    LendingModule,
    InsuranceModule,
    DocumentModule,
    NotificationModule,
    FileUploadModule,
    OcrModule,
    SafetyModule,
    TripsModule,
    DriverModule,
    ReceiversModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
