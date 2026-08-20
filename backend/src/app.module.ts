import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Config
import { databaseConfig } from './config/database.config';

// Middleware / Interceptors
import { TenantSubdomainMiddleware } from './middleware/tenant-subdomain.middleware';
import { ActivityLoggingInterceptor } from './interceptors/activity-logging.interceptor';
import { ActivityLogService } from './services/activity-log.service';

// Entities needed at root level
import { Tenant }      from './entities/tenant.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { UserSession } from './entities/user-session.entity';

// Feature modules — alphabetical for maintainability
import { ActivityLogsModule }      from './modules/activity-logs/activity-logs.module';
import { AdminModule }             from './modules/admin/admin.module';
import { AnalyticsModule }         from './modules/analytics/analytics.module';
import { ApiMarketplaceModule }    from './modules/api-marketplace/api-marketplace.module';
import { AvailabilityModule }      from './modules/availability/availability.module';
import { BiddingModule }           from './modules/bidding/bidding.module';
import { BrokersModule }           from './modules/brokers/brokers.module';
import { CargoOwnerModule }        from './modules/cargo-owner/cargo-owner.module';
import { CampaignsModule }         from './modules/campaigns/campaigns.module';
import { CapacityModule }          from './modules/capacity/capacity.module';
import { CarrierMarketplaceModule } from './modules/carrier-marketplace/carrier-marketplace.module';
import { CarrierTierModule }       from './modules/carrier-tier/carrier-tier.module';
import { ComplianceModule }        from './modules/compliance/compliance.module';
import { CreditMarketplaceModule } from './modules/credit-marketplace/credit-marketplace.module';
import { CurrencyModule }          from './modules/currency/currency.module';
import { CustomsModule }           from './modules/customs/customs.module';
import { DisputesModule }          from './modules/disputes/disputes.module';
import { DocumentModule }          from './modules/documents/document.module';
import { DriverModule }            from './modules/drivers/driver.module';
import { EnhancedAuthModule }      from './modules/auth/enhanced-auth.module';
import { UserPermissionOverrideInterceptor } from './modules/auth/interceptors/user-permission-override.interceptor';
import { EventsModule }            from './modules/events/events.module';
import { FileUploadModule }        from './modules/file-upload/file-upload.module';
import { FinancialModule }         from './modules/financial/financial.module';
import { FleetModule }             from './modules/fleet/fleet.module';
import { FuelModule }              from './modules/fuel/fuel.module';
import { GeofencingModule }        from './modules/geofencing/geofencing.module';
import { InsuranceModule }         from './modules/insurance/insurance.module';
import { LendingModule }           from './modules/lending/lending.module';
import { LoadsModule }             from './modules/loads/loads.module';
import { LoadsV2Module }           from './modules/loads/loads-v2.module';
import { MaintenanceModule }       from './modules/maintenance/maintenance.module';
import { MatchingModule }          from './modules/matching/matching.module';
import { MessengerModule }         from './modules/messenger/messenger.module';
import { MultiModalModule }        from './modules/multi-modal/multi-modal.module';
import { NotificationModule }      from './modules/notifications/notification.module';
import { OcrModule }               from './modules/ocr/ocr.module';
import { ParkingReservationsModule } from './modules/parking-reservations/parking-reservations.module';
import { PaymentsModule }          from './modules/payments/payments.module';
import { RatingsModule }           from './modules/ratings/ratings.module';
import { ReceiversModule }         from './modules/receivers/receivers.module';
import { RevenueModule }           from './modules/revenue/revenue.module';
import { RewardsModule }           from './modules/rewards/rewards.module';
import { SafetyModule }            from './modules/safety/safety.module';
import { ScoringModule }           from './modules/scoring/scoring.module';
import { SubscriptionModule }      from './modules/subscription/subscription.module';
import { TenantDashboardModule }   from './modules/tenant-dashboard/tenant-dashboard.module';
import { TrackingModule }          from './modules/tracking/tracking.module';
import { TripsModule }             from './modules/trips/trips.module';
import { UsersModule }             from './modules/users/users.module';

@Module({
  imports: [
    // ── Infrastructure ────────────────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true, cache: true }),

    // TypeORM — synchronize is always false in production.
    // Schema changes are deployed exclusively through SQL migrations
    // (migrations/ directory, run by docker-entrypoint.sh via migrate.js).
    TypeOrmModule.forRoot(databaseConfig),

    // Entities accessed in AppModule providers
    TypeOrmModule.forFeature([Tenant, ActivityLog, UserSession]),

    EventEmitterModule.forRoot({ wildcard: false, maxListeners: 20 }),
    ScheduleModule.forRoot(),

    // Global rate-limiter — 20 req / 60 s per IP.
    // Individual endpoints add @UseGuards(ThrottlerGuard) for stricter limits.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),

    // ── Feature modules ───────────────────────────────────────────────────
    ActivityLogsModule,
    AdminModule,
    AnalyticsModule,
    ApiMarketplaceModule,
    AvailabilityModule,
    BiddingModule,
    BrokersModule,
    CargoOwnerModule,
    CampaignsModule,
    CapacityModule,
    CarrierMarketplaceModule,
    CarrierTierModule,
    ComplianceModule,
    CreditMarketplaceModule,
    CurrencyModule,
    CustomsModule,
    DisputesModule,
    DocumentModule,
    DriverModule,
    EnhancedAuthModule,
    EventsModule,
    FileUploadModule,
    FinancialModule,
    FleetModule,
    FuelModule,
    GeofencingModule,
    InsuranceModule,
    LendingModule,
    LoadsModule,
    LoadsV2Module,
    MaintenanceModule,
    MatchingModule,
    MessengerModule,
    MultiModalModule,
    NotificationModule,
    OcrModule,
    ParkingReservationsModule,
    PaymentsModule,
    RatingsModule,
    ReceiversModule,
    RevenueModule,
    RewardsModule,
    SafetyModule,
    ScoringModule,
    SubscriptionModule,
    TenantDashboardModule,
    TrackingModule,
    TripsModule,
    UsersModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,
    ActivityLogService,
    {
      provide: APP_INTERCEPTOR,
      useClass: UserPermissionOverrideInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantSubdomainMiddleware).forRoutes('*');
  }
}
