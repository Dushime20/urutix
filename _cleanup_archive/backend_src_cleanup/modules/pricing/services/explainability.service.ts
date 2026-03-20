import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingModel } from '../entities/pricing-model.entity';
import { PricingPrediction } from '../entities/pricing-prediction.entity';
import { PricingFeatures } from '../interfaces/pricing-features.interface';

@Injectable()
export class ExplainabilityService {
  private readonly logger = new Logger(ExplainabilityService.name);

  constructor(
    @InjectRepository(PricingModel)
    private readonly pricingModelRepository: Repository<PricingModel>,
    @InjectRepository(PricingPrediction)
    private readonly pricingPredictionRepository: Repository<PricingPrediction>,
  ) {}

  async generateSHAPExplanation(
    modelId: string,
    features: PricingFeatures,
    tenantId: string,
  ): Promise<{
    shapValues: Record<string, number>;
    baseValue: number;
    featureImportance: Record<string, number>;
  }> {
    try {
      const model = await this.pricingModelRepository.findOne({
        where: { id: modelId, tenantId },
      });

      if (!model) {
        throw new Error('Model not found');
      }

      // Mock SHAP calculation
      const shapValues = this.calculateMockSHAPValues(features, model);
      const baseValue = this.calculateBaseValue(features);
      const featureImportance = this.calculateFeatureImportance(shapValues);

      return {
        shapValues,
        baseValue,
        featureImportance,
      };
    } catch (error) {
      this.logger.error(`SHAP explanation generation failed: ${error.message}`);
      throw error;
    }
  }

  async generateLIMEExplanation(
    modelId: string,
    features: PricingFeatures,
    tenantId: string,
  ): Promise<{
    features: string[];
    weights: number[];
    intercept: number;
    score: number;
  }> {
    try {
      const model = await this.pricingModelRepository.findOne({
        where: { id: modelId, tenantId },
      });

      if (!model) {
        throw new Error('Model not found');
      }

      // Mock LIME explanation
      const featureNames = Object.keys(features);
      const weights = featureNames.map(() => (Math.random() - 0.5) * 2);
      const intercept = Math.random() * 1000;
      const score = Math.random() * 0.3 + 0.7;

      return {
        features: featureNames,
        weights,
        intercept,
        score,
      };
    } catch (error) {
      this.logger.error(`LIME explanation generation failed: ${error.message}`);
      throw error;
    }
  }

  async generateGlobalExplanation(
    modelId: string,
    tenantId: string,
  ): Promise<{
    globalFeatureImportance: Record<string, number>;
    featureInteractions: Record<string, any>;
    partialDependencePlots: Record<string, any>;
  }> {
    try {
      const model = await this.pricingModelRepository.findOne({
        where: { id: modelId, tenantId },
      });

      if (!model) {
        throw new Error('Model not found');
      }

      // Mock global explanation
      const globalFeatureImportance =
        model.featureConfig?.featureImportance || {};
      const featureInteractions = this.calculateFeatureInteractions(model);
      const partialDependencePlots = this.generatePartialDependencePlots(model);

      return {
        globalFeatureImportance,
        featureInteractions,
        partialDependencePlots,
      };
    } catch (error) {
      this.logger.error(
        `Global explanation generation failed: ${error.message}`,
      );
      throw error;
    }
  }

  async explainPrediction(
    predictionId: string,
    tenantId: string,
  ): Promise<{
    prediction: any;
    shapExplanation: any;
    limeExplanation: any;
    featureContributions: Record<string, number>;
  }> {
    try {
      const prediction = await this.pricingPredictionRepository.findOne({
        where: { id: predictionId, tenantId },
      });

      if (!prediction) {
        throw new Error('Prediction not found');
      }

      const model = await this.pricingModelRepository.findOne({
        where: { id: prediction.modelId },
      });

      if (!model) {
        throw new Error('Model not found');
      }

      // Generate explanations
      const shapExplanation = await this.generateSHAPExplanation(
        prediction.modelId,
        this.extractFeaturesFromPrediction(prediction),
        tenantId,
      );

      const limeExplanation = await this.generateLIMEExplanation(
        prediction.modelId,
        this.extractFeaturesFromPrediction(prediction),
        tenantId,
      );

      return {
        prediction,
        shapExplanation,
        limeExplanation,
        featureContributions: prediction.featureContributions || {},
      };
    } catch (error) {
      this.logger.error(`Prediction explanation failed: ${error.message}`);
      throw error;
    }
  }

  // Helper methods

  private calculateMockSHAPValues(
    features: PricingFeatures,
    model: PricingModel,
  ): Record<string, number> {
    const shapValues: Record<string, number> = {};
    const featureImportance = model.featureConfig?.featureImportance || {};

    Object.keys(features).forEach((feature) => {
      const importance = featureImportance[feature] || 0.1;
      const value = features[feature];

      // Mock SHAP value calculation
      if (typeof value === 'number') {
        shapValues[feature] = importance * value * (Math.random() * 0.5 + 0.5);
      } else {
        shapValues[feature] = importance * (Math.random() * 0.5 + 0.5);
      }
    });

    return shapValues;
  }

  private calculateBaseValue(features: PricingFeatures): number {
    // Mock base value calculation
    return (
      Object.values(features)
        .filter((v) => typeof v === 'number')
        .reduce((sum, v) => sum + v, 0) * 0.1
    );
  }

  private calculateFeatureImportance(
    shapValues: Record<string, number>,
  ): Record<string, number> {
    const totalImportance = Object.values(shapValues).reduce(
      (sum, val) => sum + Math.abs(val),
      0,
    );

    return Object.keys(shapValues).reduce(
      (importance, feature) => {
        importance[feature] = Math.abs(shapValues[feature]) / totalImportance;
        return importance;
      },
      {} as Record<string, number>,
    );
  }

  private calculateFeatureInteractions(
    model: PricingModel,
  ): Record<string, any> {
    // Mock feature interactions
    return {
      distance_weight: { strength: 0.3, direction: 'positive' },
      market_demand_fuel: { strength: 0.2, direction: 'negative' },
      driver_rating_safety: { strength: 0.4, direction: 'positive' },
    };
  }

  private generatePartialDependencePlots(
    model: PricingModel,
  ): Record<string, any> {
    // Mock partial dependence plots
    return {
      distance: {
        x: [100, 500, 1000, 2000, 3000],
        y: [500, 1200, 2500, 5000, 7500],
      },
      weight: {
        x: [5000, 15000, 25000, 35000, 45000],
        y: [800, 1200, 1600, 2000, 2400],
      },
      marketDemand: {
        x: [0.3, 0.5, 0.7, 0.9],
        y: [1000, 1200, 1400, 1600],
      },
    };
  }

  private extractFeaturesFromPrediction(
    prediction: PricingPrediction,
  ): PricingFeatures {
    // Extract features from prediction record
    return {
      distance: prediction.distance,
      weight: prediction.weight,
      volume: prediction.volume,
      routeComplexity: prediction.routeComplexity,
      marketConditions: prediction.marketConditions,
      truckAvailability: prediction.truckAvailability,
      driverMetrics: prediction.driverMetrics,
      environmentalFactors: prediction.environmentalFactors,
      temporalFeatures: prediction.temporalFeatures,
      cargoFeatures: prediction.cargoFeatures,
    };
  }
}
