import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingModel } from '../entities/pricing-model.entity';
import { PricingPrediction } from '../entities/pricing-prediction.entity';

@Injectable()
export class BiasDetectionService {
  private readonly logger = new Logger(BiasDetectionService.name);

  constructor(
    @InjectRepository(PricingModel)
    private readonly pricingModelRepository: Repository<PricingModel>,
    @InjectRepository(PricingPrediction)
    private readonly pricingPredictionRepository: Repository<PricingPrediction>,
  ) {}

  async detectBias(
    modelId: string,
    tenantId: string,
  ): Promise<{
    biasMetrics: any;
    biasDetected: boolean;
    recommendations: string[];
  }> {
    try {
      const model = await this.pricingModelRepository.findOne({
        where: { id: modelId, tenantId },
      });

      if (!model) {
        throw new Error('Model not found');
      }

      // Get recent predictions for bias analysis
      const recentPredictions = await this.pricingPredictionRepository.find({
        where: { modelId, tenantId },
        order: { createdAt: 'DESC' },
        take: 1000,
      });

      // Analyze bias across different dimensions
      const biasAnalysis = await this.analyzeBias(recentPredictions);

      // Generate recommendations
      const recommendations = this.generateBiasRecommendations(biasAnalysis);

      // Update model with bias metrics
      await this.pricingModelRepository.update(modelId, {
        biasMetrics: biasAnalysis,
      });

      return {
        biasMetrics: biasAnalysis,
        biasDetected: biasAnalysis.overallBias > 0.1,
        recommendations,
      };
    } catch (error) {
      this.logger.error(`Bias detection failed: ${error.message}`);
      throw error;
    }
  }

  async mitigateBias(
    modelId: string,
    tenantId: string,
    mitigationMethod: string,
  ): Promise<{
    success: boolean;
    newModelId?: string;
    biasReduction: number;
  }> {
    try {
      const model = await this.pricingModelRepository.findOne({
        where: { id: modelId, tenantId },
      });

      if (!model) {
        throw new Error('Model not found');
      }

      // Apply bias mitigation
      const mitigationResult = await this.applyBiasMitigation(
        model,
        mitigationMethod,
      );

      if (mitigationResult.success) {
        // Create new model with bias mitigation
        const newModel = this.pricingModelRepository.create({
          // Only include properties that exist on PricingModel entity
          // Remove tenantId if it's not a column in the entity
          name: `${model.name} - Bias Mitigated`,
          description: `${model.description} (Bias mitigated using ${mitigationMethod})`,
          modelType: model.modelType,
          version: model.version,
          status: model.status,
          hyperparameters: model.hyperparameters,
          biasMetrics: {
            ...model.biasMetrics,
            biasMitigationApplied: true,
            // Remove biasMitigationMethod if not defined in biasMetrics type
          },
        });

        const savedModel = await this.pricingModelRepository.save(newModel);
        const modelId = savedModel.id;

        return {
          success: true,
          newModelId: modelId,
          biasReduction: mitigationResult.biasReduction,
        };
      }

      return {
        success: false,
        biasReduction: 0,
      };
    } catch (error) {
      this.logger.error(`Bias mitigation failed: ${error.message}`);
      throw error;
    }
  }

  private async analyzeBias(predictions: PricingPrediction[]): Promise<any> {
    // Mock bias analysis
    return {
      genderBias: Math.random() * 0.2,
      ageBias: Math.random() * 0.2,
      locationBias: Math.random() * 0.2,
      incomeBias: Math.random() * 0.2,
      overallBias: Math.random() * 0.2,
      biasDetected: Math.random() > 0.7,
      biasMitigationApplied: false,
      biasMitigationMethod: null,
    };
  }

  private generateBiasRecommendations(biasAnalysis: any): string[] {
    const recommendations: string[] = [];

    if (biasAnalysis.overallBias > 0.1) {
      recommendations.push('Consider applying bias mitigation techniques');
      recommendations.push('Review training data for demographic balance');
      recommendations.push('Implement fairness constraints in model training');
    }

    return recommendations;
  }

  private async applyBiasMitigation(
    model: PricingModel,
    method: string,
  ): Promise<{
    success: boolean;
    biasReduction: number;
  }> {
    // Mock bias mitigation
    return {
      success: true,
      biasReduction: Math.random() * 0.3,
    };
  }
}
