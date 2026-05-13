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
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { ReceiversModule } from './modules/receivers/receivers.module';
import { BrokersModule } from './modules/brokers/brokers.module';
import { FuelModule } from './modules/fuel/fuel.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { CreditMarketplaceModule } from './modules/credit-marketplace/credit-marketplace.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { MessengerModule } from './modules/messenger/messenger.module';
import { MultiModalModule } from './modules/multi-modal/multi-modal.module';
import { EventsModule } from './modules/events/events.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CargoOwnerModule } from './modules/cargo-owner/cargo-owner.module';
import { CustomsModule } from './modules/customs/customs.module';
import { databaseConfig } from './config/database.config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TenantSubdomainMiddleware } from './middleware/tenant-subdomain.middleware';
import { Tenant } from './entities/tenant.entity';
import { ActivityLoggingInterceptor } from './interceptors/activity-logging.interceptor';
import { ActivityLogService } from './services/activity-log.service';
import { ActivityLog } from './entities/activity-log.entity';
import { UserSession } from './entities/user-session.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([Tenant, ActivityLog, UserSession]), // Add entities for interceptor
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
    FuelModule,
    SubscriptionModule,
    CreditMarketplaceModule,
    AnalyticsModule,
    ActivityLogsModule,
    MessengerModule,
    MultiModalModule,
    EventsModule,
    PaymentsModule,
    MaintenanceModule,
    CargoOwnerModule,
    CustomsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ActivityLogService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantSubdomainMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
