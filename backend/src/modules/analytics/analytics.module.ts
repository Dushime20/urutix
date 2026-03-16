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

// Analytics controllers
import { AnalyticsController } from './controllers/analytics.controller';
import { FinancialAnalyticsController } from './controllers/financial-analytics.controller';
import { OperationalAnalyticsController } from './controllers/operational-analytics.controller';
import { AIInsightsController } from './controllers/ai-insights.controller';
import { AdvancedAnalyticsController, PublicAnalyticsController } from './controllers/advanced-analytics.controller';

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

// Permission utilities
import { PermissionHelper } from '../../utils/permission-helper';

// Import existing modules for integration
import { LoadsModule } from '../loads/loads.module';
import { SubscriptionModule } from '../subscription/subscription.module';

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
    ]),
    // Import existing modules for service integration
    LoadsModule,
    SubscriptionModule,
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
  ],
})
export class AnalyticsModule {}