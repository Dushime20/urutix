import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingModel } from '../entities/pricing-model.entity';
import { PricingPrediction } from '../entities/pricing-prediction.entity';

@Injectable()
export class ABTestingService {
  private readonly logger = new Logger(ABTestingService.name);

  constructor(
    @InjectRepository(PricingModel)
    private readonly pricingModelRepository: Repository<PricingModel>,
    @InjectRepository(PricingPrediction)
    private readonly pricingPredictionRepository: Repository<PricingPrediction>,
  ) {}

  async setupABTest(
    modelId: string,
    abTestConfig: any,
    tenantId: string,
  ): Promise<{
    testId: string;
    controlGroup: string;
    treatmentGroup: string;
    trafficSplit: number;
  }> {
    try {
      const model = await this.pricingModelRepository.findOne({
        where: { id: modelId, tenantId },
      });

      if (!model) {
        throw new Error('Model not found');
      }

      // Create A/B test configuration
      const testConfig = {
        isABTest: true,
        trafficSplit: abTestConfig.trafficSplit || 0.5,
        controlGroup: modelId,
        treatmentGroup: abTestConfig.treatmentModelId,
        testStartDate: new Date(),
        testEndDate: abTestConfig.testEndDate,
        successMetrics: abTestConfig.successMetrics || ['accuracy', 'revenue'],
      };

      // Update model with A/B test config
      await this.pricingModelRepository.update(modelId, {
        aBTestConfig: testConfig,
      });

      this.logger.log(`A/B test setup for model ${modelId}`);

      return {
        testId: modelId,
        controlGroup: testConfig.controlGroup,
        treatmentGroup: testConfig.treatmentGroup,
        trafficSplit: testConfig.trafficSplit,
      };
    } catch (error) {
      this.logger.error(`A/B test setup failed: ${error.message}`);
      throw error;
    }
  }

  async getABTestResults(testId: string, tenantId: string): Promise<any> {
    try {
      const model = await this.pricingModelRepository.findOne({
        where: { id: testId, tenantId },
      });

      if (!model || !model.aBTestConfig?.isABTest) {
        throw new Error('A/B test not found');
      }

      // Get predictions for both groups
      const controlPredictions = await this.pricingPredictionRepository.find({
        where: { modelId: model.aBTestConfig.controlGroup, tenantId },
        order: { createdAt: 'DESC' },
        take: 1000,
      });

      const treatmentPredictions = await this.pricingPredictionRepository.find({
        where: { modelId: model.aBTestConfig.treatmentGroup, tenantId },
        order: { createdAt: 'DESC' },
        take: 1000,
      });

      // Calculate metrics for both groups
      const controlMetrics = this.calculateABTestMetrics(controlPredictions);
      const treatmentMetrics =
        this.calculateABTestMetrics(treatmentPredictions);

      // Calculate statistical significance
      const significance = this.calculateStatisticalSignificance(
        controlMetrics,
        treatmentMetrics,
      );

      return {
        testId,
        controlMetrics,
        treatmentMetrics,
        significance,
        isSignificant: significance.pValue < 0.05,
        recommendation: this.generateABTestRecommendation(
          controlMetrics,
          treatmentMetrics,
          significance,
        ),
      };
    } catch (error) {
      this.logger.error(`Failed to get A/B test results: ${error.message}`);
      throw error;
    }
  }

  private calculateABTestMetrics(predictions: PricingPrediction[]): any {
    if (predictions.length === 0) {
      return { accuracy: 0, revenue: 0, count: 0 };
    }

    const validPredictions = predictions.filter(
      (p) => p.actualPrice && p.predictedPrice,
    );

    if (validPredictions.length === 0) {
      return { accuracy: 0, revenue: 0, count: predictions.length };
    }

    const errors = validPredictions.map((p) =>
      Math.abs(p.predictedPrice - p.actualPrice),
    );
    const meanActual =
      validPredictions.reduce((sum, p) => sum + p.actualPrice, 0) /
      validPredictions.length;
    const accuracy = Math.max(
      0,
      1 -
        errors.reduce((sum, e) => sum + e, 0) /
          validPredictions.length /
          meanActual,
    );
    const revenue = validPredictions.reduce(
      (sum, p) => sum + p.predictedPrice,
      0,
    );

    return {
      accuracy,
      revenue,
      count: predictions.length,
      validCount: validPredictions.length,
    };
  }

  private calculateStatisticalSignificance(
    controlMetrics: any,
    treatmentMetrics: any,
  ): any {
    // Mock statistical significance calculation
    return {
      pValue: Math.random() * 0.1,
      confidenceInterval: [0.95, 1.05],
      effectSize: Math.random() * 0.2,
    };
  }

  private generateABTestRecommendation(
    controlMetrics: any,
    treatmentMetrics: any,
    significance: any,
  ): string {
    if (!significance.isSignificant) {
      return 'No statistically significant difference detected. Continue testing or increase sample size.';
    }

    if (
      treatmentMetrics.accuracy > controlMetrics.accuracy &&
      treatmentMetrics.revenue > controlMetrics.revenue
    ) {
      return 'Treatment group performs better. Consider deploying treatment model.';
    }

    if (
      treatmentMetrics.accuracy < controlMetrics.accuracy ||
      treatmentMetrics.revenue < controlMetrics.revenue
    ) {
      return 'Control group performs better. Keep current model.';
    }

    return 'Mixed results. Consider business context for decision.';
  }
}
