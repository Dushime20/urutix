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

@Module({
  imports: [
    TypeOrmModule.forFeature([Truck, Load, Driver, Location, Trip, RateLimit, LoadMatch]),
    EventEmitterModule.forRoot(),
    ConfigModule,
  ],
  providers: [
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
  ],
  controllers: [MatchingController],
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
  ],
})
export class MatchingModule {}
