import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { PricingModel } from '../entities/pricing-model.entity';
import { PricingPrediction } from '../entities/pricing-prediction.entity';
import { ModelStatus } from '../entities/pricing-model.entity';

@Injectable()
export class ModelMonitoringService {
  private readonly logger = new Logger(ModelMonitoringService.name);

  constructor(
    @InjectRepository(PricingModel)
    private readonly pricingModelRepository: Repository<PricingModel>,
    @InjectRepository(PricingPrediction)
    private readonly pricingPredictionRepository: Repository<PricingPrediction>,
  ) {}

  async checkModelDrift(
    modelId: string,
    tenantId: string,
  ): Promise<{
    driftDetected: boolean;
    driftMetrics: any;
    recommendations: string[];
  }> {
    try {
      const model = await this.pricingModelRepository.findOne({
        where: { id: modelId, tenantId },
      });

      if (!model) {
        throw new Error('Model not found');
      }

      // Get recent predictions for drift analysis
      const recentPredictions = await this.pricingPredictionRepository.find({
        where: { modelId, tenantId },
        order: { createdAt: 'DESC' },
        take: 1000,
      });

      // Calculate drift metrics
      const driftMetrics = this.calculateDriftMetrics(
        recentPredictions,
        model,
      ) as {
        featureDrift: Record<string, number>;
        predictionDrift: number;
        dataDrift: number;
        conceptDrift: number;
      };

      // Determine if drift is detected
      const driftDetected = this.isDriftDetected(
        driftMetrics,
        model.monitoringConfig?.driftThreshold || 0.1,
      );

      // Generate recommendations
      const recommendations = this.generateDriftRecommendations(
        driftMetrics,
        driftDetected,
      );

      // Update model with drift metrics
      await this.pricingModelRepository.update(modelId, {
        // driftMetrics will be updated separately if needed
      });

      return {
        driftDetected,
        driftMetrics,
        recommendations,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Drift detection failed: ${errorMessage}`);
      throw error;
    }
  }

  async checkPerformanceDegradation(
    modelId: string,
    tenantId: string,
  ): Promise<{
    degradationDetected: boolean;
    performanceMetrics: any;
    recommendations: string[];
  }> {
    try {
      const model = await this.pricingModelRepository.findOne({
        where: { id: modelId, tenantId },
      });

      if (!model) {
        throw new Error('Model not found');
      }

      // Get recent predictions for performance analysis
      const recentPredictions = await this.pricingPredictionRepository.find({
        where: { modelId, tenantId, actualPrice: Not(null) },
        order: { createdAt: 'DESC' },
        take: 500,
      });

      // Calculate current performance
      const currentPerformance = this.calculatePerformanceMetrics(
        recentPredictions,
      ) as { mae: number; mse: number; accuracy: number };

      // Compare with baseline performance
      const baselinePerformance = (model.performanceMetrics || {
        mae: 0,
        mse: 0,
        accuracy: 0,
      }) as { mae: number; mse: number; accuracy: number };
      const degradationDetected = this.isPerformanceDegraded(
        currentPerformance,
        baselinePerformance,
      );

      // Generate recommendations
      const recommendations = this.generatePerformanceRecommendations(
        currentPerformance,
        baselinePerformance,
      );

      return {
        degradationDetected,
        performanceMetrics: currentPerformance,
        recommendations,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Performance degradation check failed: ${errorMessage}`,
      );
      throw error;
    }
  }

  async shouldRetrainModel(
    modelId: string,
    tenantId: string,
  ): Promise<{
    shouldRetrain: boolean;
    reasons: string[];
    nextRetrainingDate: Date;
  }> {
    try {
      const model = await this.pricingModelRepository.findOne({
        where: { id: modelId, tenantId },
      });

      if (!model) {
        throw new Error('Model not found');
      }

      const reasons: string[] = [];
      let shouldRetrain = false;

      // Check time since last training
      const daysSinceTraining = this.getDaysSinceLastTraining(
        model.lastTrainingDate,
      );
      const retrainingThreshold =
        model.monitoringConfig?.retrainingThreshold || 30;

      if (daysSinceTraining > retrainingThreshold) {
        reasons.push(
          `Model hasn't been retrained for ${daysSinceTraining} days`,
        );
        shouldRetrain = true;
      }

      // Check drift
      const driftCheck = await this.checkModelDrift(modelId, tenantId);
      if (driftCheck.driftDetected) {
        reasons.push('Data drift detected');
        shouldRetrain = true;
      }

      // Check performance degradation
      const performanceCheck = await this.checkPerformanceDegradation(
        modelId,
        tenantId,
      );
      if (performanceCheck.degradationDetected) {
        reasons.push('Performance degradation detected');
        shouldRetrain = true;
      }

      // Calculate next retraining date
      const nextRetrainingDate = this.calculateNextRetrainingDate(
        model.lastTrainingDate,
        retrainingThreshold,
      );

      return {
        shouldRetrain,
        reasons,
        nextRetrainingDate,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Retraining check failed: ${errorMessage}`);
      throw error;
    }
  }

  async sendAlerts(
    modelId: string,
    alertType: string,
    message: string,
    tenantId: string,
  ): Promise<void> {
    try {
      const model = await this.pricingModelRepository.findOne({
        where: { id: modelId, tenantId },
      });

      if (!model) {
        throw new Error('Model not found');
      }

      const alertConfig = model.monitoringConfig;

      // Send email alerts
      if (alertConfig?.alertEmails?.length > 0) {
        this.sendEmailAlerts(
          alertConfig.alertEmails,
          alertType,
          message,
          model,
        );
      }

      // Send webhook alerts
      if (alertConfig?.alertWebhooks?.length > 0) {
        this.sendWebhookAlerts(
          alertConfig.alertWebhooks,
          alertType,
          message,
          model,
        );
      }

      this.logger.log(`Alerts sent for model ${modelId}: ${alertType}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send alerts: ${errorMessage}`);
      throw error;
    }
  }

  async getMonitoringDashboard(tenantId: string): Promise<{
    activeModels: any[];
    alerts: any[];
    performanceTrends: any[];
    driftTrends: any[];
  }> {
    try {
      // Get active models
      const activeModels = await this.pricingModelRepository.find({
        where: { tenantId, status: ModelStatus.ACTIVE },
        order: { lastTrainingDate: 'DESC' },
      });

      // Get recent alerts
      const alerts = this.getRecentAlerts(tenantId);

      // Get performance trends
      const performanceTrends = this.getPerformanceTrends(tenantId);

      // Get drift trends
      const driftTrends = this.getDriftTrends(tenantId);

      return {
        activeModels,
        alerts,
        performanceTrends,
        driftTrends,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to get monitoring dashboard: ${errorMessage}`,
      );
      throw error;
    }
  }

  // Helper methods

  private calculateDriftMetrics(
    predictions: PricingPrediction[],
    model: PricingModel,
  ): any {
    if (predictions.length === 0) {
      return {
        featureDrift: {},
        predictionDrift: 0,
        dataDrift: 0,
        conceptDrift: 0,
      };
    }

    // Calculate feature drift
    const featureDrift: Record<string, number> = {};
    // Mock feature drift calculation since statistics is not available
    const baselineStats = {
      distance: 0,
      weight: 0,
      fuelCost: 0,
      driverRating: 0,
    };
    Object.keys(baselineStats).forEach((feature) => {
      featureDrift[feature] = Math.random() * 0.2;
    });

    // Calculate prediction drift
    const predictionDrift = this.calculatePredictionDrift(predictions);

    // Calculate data drift
    const dataDrift = this.calculateDataDrift(predictions, model);

    // Calculate concept drift
    const conceptDrift = this.calculateConceptDrift(predictions, model);

    return {
      featureDrift,
      predictionDrift,
      dataDrift,
      conceptDrift,
    };
  }

  private isDriftDetected(
    driftMetrics: {
      featureDrift: Record<string, number>;
      predictionDrift: number;
      dataDrift: number;
      conceptDrift: number;
    },
    threshold: number,
  ): boolean {
    return (
      driftMetrics.predictionDrift > threshold ||
      driftMetrics.dataDrift > threshold ||
      driftMetrics.conceptDrift > threshold ||
      Object.values(driftMetrics.featureDrift).some(
        (drift: number) => drift > threshold,
      )
    );
  }

  private generateDriftRecommendations(
    driftMetrics: {
      featureDrift: Record<string, number>;
      predictionDrift: number;
      dataDrift: number;
      conceptDrift: number;
    },
    driftDetected: boolean,
  ): string[] {
    const recommendations: string[] = [];

    if (driftDetected) {
      recommendations.push('Consider retraining the model with recent data');
      recommendations.push(
        'Review feature engineering pipeline for data quality issues',
      );
      recommendations.push(
        'Investigate potential changes in business processes',
      );

      if (driftMetrics.conceptDrift > 0.1) {
        recommendations.push(
          'High concept drift detected - model may need architectural changes',
        );
      }

      if (driftMetrics.predictionDrift > 0.1) {
        recommendations.push(
          'Prediction drift detected - validate model assumptions',
        );
      }
    } else {
      recommendations.push('Model is performing within expected parameters');
      recommendations.push(
        'Continue monitoring for any changes in data patterns',
      );
    }

    return recommendations;
  }

  private calculatePerformanceMetrics(predictions: PricingPrediction[]): {
    mae: number;
    mse: number;
    accuracy: number;
  } {
    if (predictions.length === 0) {
      return { mae: 0, mse: 0, accuracy: 0 };
    }

    const errors = predictions.map((p) =>
      Math.abs(p.predictedPrice - p.actualPrice),
    );
    const mae = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    const mse = errors.reduce((sum, e) => sum + e * e, 0) / errors.length;
    const meanActual =
      predictions.reduce((sum, p) => sum + p.actualPrice, 0) /
      predictions.length;
    const accuracy = Math.max(0, 1 - mae / meanActual);

    return { mae, mse, accuracy };
  }

  private isPerformanceDegraded(
    currentPerformance: { mae: number; mse: number; accuracy: number },
    baselinePerformance: { mae: number; mse: number; accuracy: number },
  ): boolean {
    const threshold = 0.05; // 5% degradation threshold

    const accuracyDegradation =
      (baselinePerformance.accuracy - currentPerformance.accuracy) /
      baselinePerformance.accuracy;
    const maeIncrease =
      (currentPerformance.mae - baselinePerformance.mae) /
      baselinePerformance.mae;

    return accuracyDegradation > threshold || maeIncrease > threshold;
  }

  private generatePerformanceRecommendations(
    currentPerformance: { mae: number; mse: number; accuracy: number },
    baselinePerformance: { mae: number; mse: number; accuracy: number },
  ): string[] {
    const recommendations: string[] = [];

    const accuracyDegradation =
      (baselinePerformance.accuracy - currentPerformance.accuracy) /
      baselinePerformance.accuracy;
    const maeIncrease =
      (currentPerformance.mae - baselinePerformance.mae) /
      baselinePerformance.mae;

    if (accuracyDegradation > 0.05) {
      recommendations.push(
        'Model accuracy has degraded significantly - consider retraining',
      );
    }

    if (maeIncrease > 0.05) {
      recommendations.push(
        'Model error rate has increased - investigate data quality issues',
      );
    }

    if (accuracyDegradation > 0.1) {
      recommendations.push(
        'Severe performance degradation detected - immediate retraining recommended',
      );
    }

    return recommendations;
  }

  private getDaysSinceLastTraining(lastTrainingDate: Date): number {
    if (!lastTrainingDate) return Infinity;

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastTrainingDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateNextRetrainingDate(
    lastTrainingDate: Date,
    threshold: number,
  ): Date {
    if (!lastTrainingDate) return new Date();

    const nextDate = new Date(lastTrainingDate);
    nextDate.setDate(nextDate.getDate() + threshold);
    return nextDate;
  }

  private sendEmailAlerts(
    emails: string[],
    alertType: string,
    message: string,
    _model: PricingModel,
  ): void {
    // Mock email sending
    this.logger.log(
      `Sending email alerts to ${emails.join(', ')}: ${alertType} - ${message}`,
    );
  }

  private sendWebhookAlerts(
    webhooks: string[],
    alertType: string,
    message: string,
    _model: PricingModel,
  ): void {
    // Mock webhook sending
    this.logger.log(
      `Sending webhook alerts to ${webhooks.join(', ')}: ${alertType} - ${message}`,
    );
  }

  private getRecentAlerts(_tenantId: string): Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    severity: string;
  }> {
    // Mock recent alerts
    return [
      {
        id: 'alert-1',
        type: 'drift_detected',
        message: 'Data drift detected in model pricing-v2.1',
        timestamp: new Date(),
        severity: 'medium',
      },
    ];
  }

  private getPerformanceTrends(_tenantId: string): Array<{
    date: Date;
    accuracy: number;
    mae: number;
    modelId: string;
  }> {
    // Mock performance trends
    return [
      {
        date: new Date(),
        accuracy: 0.85,
        mae: 150.5,
        modelId: 'model-1',
      },
    ];
  }

  private getDriftTrends(_tenantId: string): Array<{
    date: Date;
    predictionDrift: number;
    dataDrift: number;
    conceptDrift: number;
    modelId: string;
  }> {
    // Mock drift trends
    return [
      {
        date: new Date(),
        predictionDrift: 0.05,
        dataDrift: 0.03,
        conceptDrift: 0.02,
        modelId: 'model-1',
      },
    ];
  }

  private calculatePredictionDrift(_predictions: PricingPrediction[]): number {
    // Mock prediction drift calculation
    return Math.random() * 0.2;
  }

  private calculateDataDrift(
    _predictions: PricingPrediction[],
    _model: PricingModel,
  ): number {
    // Mock data drift calculation
    return Math.random() * 0.15;
  }

  private calculateConceptDrift(
    _predictions: PricingPrediction[],
    _model: PricingModel,
  ): number {
    // Mock concept drift calculation
    return Math.random() * 0.1;
  }
}
