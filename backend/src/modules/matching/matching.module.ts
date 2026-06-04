import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { Load } from '../../entities/load.entity';
import { Truck } from '../../entities/truck.entity';
import { Driver } from '../../entities/driver.entity';
import { Location } from '../../entities/location.entity';
import { Trip } from '../../entities/trip.entity';
import { LoadMatch } from '../../entities/load-match.entity';
import { RateLimit } from './entities/rate-limit.entity';
import { User } from '../../entities/user.entity';
import { TenantSubscription } from '../../entities/tenant-subscription.entity';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { Route } from '../../entities/route.entity';
import { RouteTruck } from '../../entities/route-truck.entity';
import { CreditService } from '../../services/credit.service';
import { CreditAccount } from '../../entities/credit-account.entity';
import { CreditTransaction } from '../../entities/credit-transaction.entity';
import { FeatureCreditCost } from '../../entities/feature-credit-cost.entity';
import { Notification } from '../../entities/notification.entity';
import { UserScore } from '../../entities/user-score.entity';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { AIMatchingEngineService } from './services/ai-matching-engine.service';
import { RealTimeAvailabilityService } from './services/real-time-availability.service';
import { PerformanceScoringService } from './services/performance-scoring.service';
import { RouteOptimizationService } from './services/route-optimization.service';
import { MLInferenceService } from './services/ml-inference.service';
import { EnhancedTruckMatchingService } from './services/enhanced-truck-matching.service';
import { EnhancedMatchingService } from './services/enhanced-matching.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { CacheService } from './services/cache.service';
import { MarketIntelligenceService } from './services/market-intelligence.service';
import { MLPredictionService } from './services/ml-prediction.service';
import { EmergencyRematchService } from './services/emergency-rematch.service';
import { EmergencyRematchController } from './controllers/emergency-rematch.controller';
import { NotificationModule } from '../notifications/notification.module';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Truck, Load, Driver, Location, Trip, RateLimit, LoadMatch,
      User, TenantSubscription, SubscriptionPlan, CreditAccount, CreditTransaction,
      FeatureCreditCost, Route, RouteTruck, Notification, UserScore,
    ]),
    EventEmitterModule.forRoot(),
    ConfigModule,
    NotificationModule,
    EnhancedAuthModule,
  ],
  providers: [
    MatchingService,
    CreditService,
    AIMatchingEngineService,
    EnhancedTruckMatchingService,
    PerformanceScoringService,
    MLInferenceService,
    RealTimeAvailabilityService,
    RouteOptimizationService,
    EnhancedMatchingService,
    RateLimiterService,
    CacheService,
    MarketIntelligenceService,
    MLPredictionService,
    EmergencyRematchService,
  ],
  controllers: [MatchingController, EmergencyRematchController],
  exports: [
    MatchingService,
    AIMatchingEngineService,
    EnhancedTruckMatchingService,
    PerformanceScoringService,
    MLInferenceService,
    RealTimeAvailabilityService,
    RouteOptimizationService,
    EnhancedMatchingService,
    RateLimiterService,
    CacheService,
    MarketIntelligenceService,
    MLPredictionService,
    EmergencyRematchService,
  ],
})
export class MatchingModule {}
