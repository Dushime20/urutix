import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';

// Entities
import { PricingModel } from './entities/pricing-model.entity';
import { PricingPrediction } from './entities/pricing-prediction.entity';
import { PricingFeature } from './entities/pricing-feature.entity';

// Services
import { MLPricingService } from './services/ml-pricing.service';
import { FeatureEngineeringService } from './services/feature-engineering.service';
import { ModelTrainingService } from './services/model-training.service';
import { ModelMonitoringService } from './services/model-monitoring.service';
import { BiasDetectionService } from './services/bias-detection.service';
import { ABTestingService } from './services/ab-testing.service';
import { ExplainabilityService } from './services/explainability.service';

// Controllers
import { PricingController } from './pricing.controller';

// External entities for relationships
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { Truck } from '../../entities/truck.entity';
import { Driver } from '../../entities/driver.entity';
import { Payment } from '../../entities/payment.entity';
import { Tenant } from '../../entities/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PricingModel,
      PricingPrediction,
      PricingFeature,
      Trip,
      Load,
      Truck,
      Driver,
      Payment,
      Tenant,
    ]),
    EventEmitterModule.forRoot(),
    ConfigModule,
  ],
  controllers: [PricingController],
  providers: [
    MLPricingService,
    FeatureEngineeringService,
    ModelTrainingService,
    ModelMonitoringService,
    BiasDetectionService,
    ABTestingService,
    ExplainabilityService,
  ],
  exports: [
    MLPricingService,
    FeatureEngineeringService,
    ModelTrainingService,
    ModelMonitoringService,
    BiasDetectionService,
    ABTestingService,
    ExplainabilityService,
  ],
})
export class PricingModule {}
