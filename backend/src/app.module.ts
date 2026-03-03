import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { BrokersModule } from './modules/brokers/brokers.module';
import { MigrationsModule } from './modules/migrations/migrations.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { FuelModule } from './modules/fuel/fuel.module';
import { databaseConfig } from './config/database.config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventsModule } from './modules/events/events.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { PermissionHelper } from './utils/permission-helper';
import { ActivityLogInterceptor } from './interceptors/activity-log.interceptor';
import { TenantSubdomainMiddleware } from './middleware/tenant-subdomain.middleware';
import { TenantVerificationMiddleware } from './middleware/tenant-verification.middleware';
import { Tenant } from './entities/tenant.entity';
import { User } from './entities/user.entity';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([Tenant, User]), // For subdomain and tenant verification middleware
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
    BrokersModule,
    MigrationsModule,
    SubscriptionModule,
    FuelModule,
    EventsModule,
    OnboardingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PermissionHelper,
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLogInterceptor,
    },
  ],
  exports: [PermissionHelper],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantSubdomainMiddleware)
      .forRoutes('*'); // Apply to all routes

    // Apply tenant verification middleware after authentication
    consumer
      .apply(TenantVerificationMiddleware)
      .forRoutes('*'); // Apply to all routes (will skip public routes internally)
  }
}
