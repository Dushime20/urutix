import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Analytics entities
import { CargoOwnerAnalytics } from '../../entities/cargo-owner-analytics.entity';
import { AnalyticsInsights } from '../../entities/analytics-insights.entity';

// Existing entities that analytics depends on
import { Load } from '../../entities/load.entity';
import { CreditTransaction } from '../../entities/credit-transaction.entity';
import { Tenant } from '../../entities/tenant.entity';
import { User } from '../../entities/user.entity';
import { CreditPricingRule } from '../../entities/credit-pricing-rule.entity';
import { TenantSubscription } from '../../entities/tenant-subscription.entity';
import { Trip } from '../../entities/trip.entity';
import { Driver } from '../../entities/driver.entity';
import { SafetyIncident } from '../../entities/safety-incident.entity';
import { Truck } from '../../entities/truck.entity';
import { SafetyInspection } from '../../entities/safety-inspection.entity';
import { InsuranceClaim } from '../../entities/insurance-claim.entity';
import { Payment } from '../../entities/payment.entity';
import { Notification } from '../../entities/notification.entity';

// Analytics controllers
import { AnalyticsController } from './controllers/analytics.controller';
import { FinancialAnalyticsController } from './controllers/financial-analytics.controller';
import { OperationalAnalyticsController } from './controllers/operational-analytics.controller';
import { AIInsightsController } from './controllers/ai-insights.controller';
import { AdvancedAnalyticsController, PublicAnalyticsController } from './controllers/advanced-analytics.controller';
import { PredictiveAnalyticsController } from './controllers/predictive-analytics.controller';

// Analytics services
import { AnalyticsService } from './services/analytics.service';
import { FinancialAnalyticsService } from './services/financial-analytics.service';
import { AnalyticsDataProcessorService } from './services/analytics-data-processor.service';
import { OperationalAnalyticsService } from './services/operational-analytics.service';
import { CarrierIntelligenceService } from './services/carrier-intelligence.service';
import { MarketIntelligenceService } from './services/market-intelligence.service';
import { AIInsightsService } from './services/ai-insights.service';
import { PredictiveAnalyticsService } from './services/predictive-analytics.service';
import { MLPipelineService } from './services/ml-pipeline.service';
import { RealTimeProcessorService } from './services/real-time-processor.service';
import { ApiMarketplaceService } from './services/api-marketplace.service';
import { SafetyGuardianService } from './services/safety-guardian.service';
import { ScheduleModule } from '@nestjs/schedule';

// Permission utilities
import { PermissionHelper } from '../../utils/permission-helper';

// Import existing modules for integration
import { LoadsModule } from '../loads/loads.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Analytics entities
      CargoOwnerAnalytics,
      AnalyticsInsights,
      // Existing entities for integration
      Load,
      CreditTransaction,
      Tenant,
      User,
      CreditPricingRule,
      TenantSubscription,
      Trip, // Add Trip entity for PredictiveAnalyticsService
      Driver, // Add Driver entity
      SafetyIncident, // Add SafetyIncident entity
      Truck, // Add Truck entity
      SafetyInspection, // Add SafetyInspection entity
      InsuranceClaim, // Add InsuranceClaim entity
      Payment,
      Notification,
    ]),
    // Import existing modules for service integration
    LoadsModule,
    SubscriptionModule,
    NotificationsModule,
    ScheduleModule.forRoot(),
    // Event emitter for real-time processing
    EventEmitterModule.forRoot(),
  ],
  controllers: [
    AnalyticsController,
    FinancialAnalyticsController,
    OperationalAnalyticsController,
    AIInsightsController,
    AdvancedAnalyticsController,
    PublicAnalyticsController,
    PredictiveAnalyticsController,
  ],
  providers: [
    // Analytics services
    AnalyticsService,
    FinancialAnalyticsService,
    AnalyticsDataProcessorService,
    OperationalAnalyticsService,
    CarrierIntelligenceService,
    MarketIntelligenceService,
    AIInsightsService,
    PredictiveAnalyticsService,
    MLPipelineService,
    RealTimeProcessorService,
    ApiMarketplaceService,
    SafetyGuardianService,
    // Permission utilities
    PermissionHelper,
  ],
  exports: [
    // Export analytics services for use in other modules
    AnalyticsService,
    FinancialAnalyticsService,
    AnalyticsDataProcessorService,
    OperationalAnalyticsService,
    CarrierIntelligenceService,
    MarketIntelligenceService,
    AIInsightsService,
    PredictiveAnalyticsService,
    MLPipelineService,
    RealTimeProcessorService,
    ApiMarketplaceService,
    SafetyGuardianService,
  ],
})
export class AnalyticsModule {}