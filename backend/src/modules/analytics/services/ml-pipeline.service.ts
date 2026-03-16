import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CargoOwnerAnalytics } from '../../../entities/cargo-owner-analytics.entity';

@Injectable()
export class MLPipelineService {
  private readonly logger = new Logger(MLPipelineService.name);

  constructor(
    @InjectRepository(CargoOwnerAnalytics)
    private analyticsRepository: Repository<CargoOwnerAnalytics>,
  ) {}

  /**
   * Train advanced ML model for cost prediction
   */
  async trainCostPredictionModel(
    tenantId: string,
    cargoOwnerId: string,
    modelConfig: any = {}
  ) {
    try {
      // Get training data
      const trainingData = await this.getTrainingData(tenantId, cargoOwnerId);
      
      if (trainingData.length < 50) {
        return {
          success: false,
          error: 'Insufficient training data (minimum 50 records required)',
          dataSize: trainingData.length
        };
      }

      // Prepare features and targets
      const features = this.extractFeatures(trainingData);
      const targets = trainingData.map(d => d.totalCost || 0);

      // Train advanced model (simplified implementation)
      const model = await this.trainAdvancedModel(features, targets, modelConfig);
      
      // Evaluate model performance
      const performance = await this.evaluateModel(model, features, targets);
      
      return {
        success: true,
        modelId: model.id,
        performance,
        trainingDataSize: trainingData.length,
        features: features[0] ? Object.keys(features[0]) : [],
        accuracy: performance.accuracy,
        rmse: performance.rmse
      };
      
    } catch (error) {
      this.logger.error('Failed to train cost prediction model', error);
      throw error;
    }
  }

  /**
   * Generate advanced predictions using trained models
   */
  async generateAdvancedPredictions(
    tenantId: string,
    cargoOwnerId: string,
    predictionRequest: any
  ) {
    try {
      // Get the best performing model
      const model = await this.getBestModel(tenantId, 'cost_prediction');
      
      if (!model) {
        return {
          prediction: null,
          confidence: 0,
          error: 'No trained model available'
        };
      }

      // Prepare input features
      const inputFeatures = this.prepareInputFeatures(predictionRequest);
      
      // Generate prediction
      const prediction = await this.predict(model, inputFeatures);
      
      // Calculate confidence based on model performance and input similarity
      const confidence = await this.calculatePredictionConfidence(
        model, 
        inputFeatures, 
        tenantId
      );

      return {
        prediction: prediction.value,
        confidence,
        modelVersion: model.version,
        features: inputFeatures,
        uncertainty: prediction.uncertainty,
        factors: prediction.contributingFactors
      };
      
    } catch (error) {
      this.logger.error('Failed to generate advanced predictions', error);
      throw error;
    }
  }

  /**
   * Perform advanced route optimization using ML
   */
  async optimizeRoutesML(
    tenantId: string,
    cargoOwnerId: string,
    routes: any[]
  ) {
    try {
      const optimizations = [];
      
      for (const route of routes) {
        // Get historical performance for this route
        const routeHistory = await this.getRouteHistory(tenantId, route.routeHash);
        
        if (routeHistory.length < 10) {
          continue; // Skip routes with insufficient data
        }

        // Apply ML-based optimization
        const optimization = await this.optimizeRoute(route, routeHistory);
        
        if (optimization.potentialImprovement > 0.05) { // 5% improvement threshold
          optimizations.push({
            routeHash: route.routeHash,
            currentPerformance: optimization.current,
            optimizedPerformance: optimization.optimized,
            potentialSavings: optimization.potentialSavings,
            confidence: optimization.confidence,
            recommendations: optimization.recommendations,
            implementationComplexity: optimization.complexity
          });
        }
      }

      // Sort by potential impact
      optimizations.sort((a, b) => b.potentialSavings - a.potentialSavings);
      
      return {
        totalOptimizations: optimizations.length,
        totalPotentialSavings: optimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0),
        optimizations: optimizations.slice(0, 10), // Top 10 optimizations
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error('Failed to optimize routes with ML', error);
      throw error;
    }
  }

  /**
   * Advanced demand forecasting with multiple models
   */
  async forecastDemandAdvanced(
    tenantId: string,
    cargoOwnerId: string,
    forecastHorizon: number = 90
  ) {
    try {
      // Get historical demand data
      const demandHistory = await this.getDemandHistory(tenantId, cargoOwnerId);
      
      // Apply multiple forecasting models
      const models = [
        'arima',
        'exponential_smoothing',
        'neural_network',
        'seasonal_decomposition'
      ];
      
      const forecasts = [];
      
      for (const modelType of models) {
        const forecast = await this.applyForecastingModel(
          demandHistory, 
          modelType, 
          forecastHorizon
        );
        
        forecasts.push({
          model: modelType,
          forecast: forecast.values,
          accuracy: forecast.accuracy,
          confidence: forecast.confidence
        });
      }
      
      // Ensemble the forecasts
      const ensembleForecast = this.ensembleForecasts(forecasts);
      
      return {
        forecast: ensembleForecast.values,
        confidence: ensembleForecast.confidence,
        trend: ensembleForecast.trend,
        seasonality: ensembleForecast.seasonality,
        modelContributions: forecasts.map(f => ({
          model: f.model,
          weight: f.accuracy,
          accuracy: f.accuracy
        })),
        forecastHorizon,
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error('Failed to generate advanced demand forecast', error);
      throw error;
    }
  }

  private async getTrainingData(tenantId: string, cargoOwnerId: string) {
    return this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .andWhere('analytics.totalCost IS NOT NULL')
      .andWhere('analytics.totalCost > 0')
      .orderBy('analytics.bookingDate', 'DESC')
      .limit(1000)
      .getMany();
  }

  private extractFeatures(data: CargoOwnerAnalytics[]) {
    return data.map(record => ({
      distanceKm: record.distanceKm || 0,
      weightKg: record.cargoWeightKg || 0,
      cargoType: this.encodeCargoType(record.cargoType),
      season: this.encodeSeason(record.season),
      dayOfWeek: new Date(record.bookingDate).getDay(),
      month: new Date(record.bookingDate).getMonth(),
      actualTransitHours: record.actualTransitHours || 0,
      fuelPriceAtBooking: 0, // Not available in entity, use default
      carrierRating: record.carrierRating || 0,
      routeComplexity: this.calculateRouteComplexity(record)
    }));
  }

  private async trainAdvancedModel(features: any[], targets: number[], config: any) {
    // Simplified ML model implementation
    // In production, this would use a proper ML library like TensorFlow.js or call Python ML services
    
    const model = {
      id: `model_${Date.now()}`,
      version: '2.0.0',
      type: 'advanced_regression',
      weights: this.calculateWeights(features, targets),
      bias: this.calculateBias(targets),
      featureImportance: this.calculateFeatureImportance(features, targets),
      trainedAt: new Date().toISOString()
    };
    
    return model;
  }

  private async evaluateModel(model: any, features: any[], targets: number[]) {
    // Split data for validation
    const splitIndex = Math.floor(features.length * 0.8);
    const testFeatures = features.slice(splitIndex);
    const testTargets = targets.slice(splitIndex);
    
    // Generate predictions for test set
    const predictions = testFeatures.map(feature => this.predictWithModel(model, feature));
    
    // Calculate metrics
    const mse = this.calculateMSE(predictions, testTargets);
    const rmse = Math.sqrt(mse);
    const mae = this.calculateMAE(predictions, testTargets);
    const r2 = this.calculateR2(predictions, testTargets);
    
    return {
      accuracy: Math.max(0, 1 - (rmse / this.calculateMean(testTargets))),
      rmse,
      mae,
      r2,
      testSize: testTargets.length
    };
  }

  private async getBestModel(tenantId: string, modelType: string) {
    // In production, this would query the ml_models table
    // For now, return a mock model
    return {
      id: `best_${modelType}_model`,
      version: '2.0.0',
      type: modelType,
      accuracy: 0.85,
      trainedAt: new Date().toISOString()
    };
  }

  private prepareInputFeatures(request: any) {
    return {
      distanceKm: request.distanceKm || 0,
      weightKg: request.weightKg || 0,
      cargoType: this.encodeCargoType(request.cargoType),
      season: this.encodeSeason(request.season),
      dayOfWeek: new Date().getDay(),
      month: new Date().getMonth(),
      estimatedTransitHours: request.estimatedTransitHours || 0,
      currentFuelPrice: request.currentFuelPrice || 0,
      preferredCarrierRating: request.preferredCarrierRating || 0
    };
  }

  private async predict(model: any, features: any) {
    const baseValue = this.predictWithModel(model, features);
    
    return {
      value: baseValue,
      uncertainty: baseValue * 0.1, // 10% uncertainty
      contributingFactors: this.identifyContributingFactors(model, features)
    };
  }

  private predictWithModel(model: any, features: any): number {
    // Simplified prediction logic
    let prediction = model.bias || 0;
    
    Object.entries(features).forEach(([key, value]) => {
      const weight = model.weights?.[key] || 0;
      prediction += weight * (value as number);
    });
    
    return Math.max(0, prediction);
  }

  private async calculatePredictionConfidence(model: any, features: any, tenantId: string): Promise<number> {
    // Base confidence on model accuracy
    let confidence = model.accuracy || 0.5;
    
    // Adjust based on feature similarity to training data
    const similarity = await this.calculateFeatureSimilarity(features, tenantId);
    confidence *= similarity;
    
    return Math.max(0.1, Math.min(0.95, confidence));
  }

  // Helper methods
  private encodeCargoType(cargoType: string): number {
    const types = ['general', 'fragile', 'hazardous', 'perishable', 'bulk'];
    return types.indexOf(cargoType?.toLowerCase()) + 1 || 1;
  }

  private encodeSeason(season: string): number {
    const seasons = ['spring', 'summer', 'autumn', 'winter'];
    return seasons.indexOf(season?.toLowerCase()) + 1 || 1;
  }

  private calculateRouteComplexity(record: CargoOwnerAnalytics): number {
    // Simple complexity score based on distance and transit time
    const distance = record.distanceKm || 0;
    const transitTime = record.actualTransitHours || 0;
    
    if (distance === 0) return 1;
    
    const speedKmh = distance / (transitTime || 1);
    const normalSpeed = 60; // km/h
    
    return Math.max(1, normalSpeed / speedKmh);
  }

  private calculateWeights(features: any[], targets: number[]): Record<string, number> {
    // Simplified weight calculation
    const weights: Record<string, number> = {};
    
    if (features.length === 0) return weights;
    
    const featureKeys = Object.keys(features[0]);
    
    featureKeys.forEach(key => {
      const correlation = this.calculateCorrelation(
        features.map(f => f[key]),
        targets
      );
      weights[key] = correlation * 0.1; // Scale down weights
    });
    
    return weights;
  }

  private calculateBias(targets: number[]): number {
    return targets.reduce((sum, target) => sum + target, 0) / targets.length;
  }

  private calculateFeatureImportance(features: any[], targets: number[]): Record<string, number> {
    const importance: Record<string, number> = {};
    
    if (features.length === 0) return importance;
    
    const featureKeys = Object.keys(features[0]);
    
    featureKeys.forEach(key => {
      const correlation = Math.abs(this.calculateCorrelation(
        features.map(f => f[key]),
        targets
      ));
      importance[key] = correlation;
    });
    
    return importance;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateMSE(predictions: number[], actual: number[]): number {
    const n = predictions.length;
    if (n === 0) return 0;
    
    const sumSquaredErrors = predictions.reduce((sum, pred, i) => {
      const error = pred - actual[i];
      return sum + error * error;
    }, 0);
    
    return sumSquaredErrors / n;
  }

  private calculateMAE(predictions: number[], actual: number[]): number {
    const n = predictions.length;
    if (n === 0) return 0;
    
    const sumAbsErrors = predictions.reduce((sum, pred, i) => {
      return sum + Math.abs(pred - actual[i]);
    }, 0);
    
    return sumAbsErrors / n;
  }

  private calculateR2(predictions: number[], actual: number[]): number {
    const actualMean = this.calculateMean(actual);
    
    const totalSumSquares = actual.reduce((sum, val) => {
      return sum + Math.pow(val - actualMean, 2);
    }, 0);
    
    const residualSumSquares = predictions.reduce((sum, pred, i) => {
      return sum + Math.pow(actual[i] - pred, 2);
    }, 0);
    
    return totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);
  }

  private calculateMean(values: number[]): number {
    return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
  }

  private async getRouteHistory(tenantId: string, routeHash: string) {
    return this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.routeHash = :routeHash', { routeHash })
      .orderBy('analytics.bookingDate', 'DESC')
      .limit(100)
      .getMany();
  }

  private async optimizeRoute(route: any, history: CargoOwnerAnalytics[]) {
    // Simplified route optimization
    const currentAvgCost = history.reduce((sum, h) => sum + (h.totalCost || 0), 0) / history.length;
    const currentAvgTime = history.reduce((sum, h) => sum + (h.actualTransitHours || 0), 0) / history.length;
    
    // Calculate potential optimizations
    const optimizedCost = currentAvgCost * 0.9; // 10% cost reduction potential
    const optimizedTime = currentAvgTime * 0.95; // 5% time reduction potential
    
    return {
      current: { cost: currentAvgCost, time: currentAvgTime },
      optimized: { cost: optimizedCost, time: optimizedTime },
      potentialSavings: currentAvgCost - optimizedCost,
      potentialImprovement: (currentAvgCost - optimizedCost) / currentAvgCost,
      confidence: 0.75,
      recommendations: [
        'Consider alternative carriers with better performance',
        'Optimize pickup and delivery time windows',
        'Consolidate shipments on this route'
      ],
      complexity: 'medium'
    };
  }

  private async getDemandHistory(tenantId: string, cargoOwnerId: string) {
    const result = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        "DATE_TRUNC('week', analytics.bookingDate) as week",
        'COUNT(*) as shipmentCount',
        'AVG(analytics.totalCost) as avgCost'
      ])
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .groupBy("DATE_TRUNC('week', analytics.bookingDate)")
      .orderBy('week', 'ASC')
      .getRawMany();
    
    return result.map(r => ({
      week: r.week,
      demand: parseInt(r.shipmentCount),
      avgCost: parseFloat(r.avgCost)
    }));
  }

  private async applyForecastingModel(history: any[], modelType: string, horizon: number) {
    // Simplified forecasting model implementations
    const values = history.map(h => h.demand);
    
    switch (modelType) {
      case 'arima':
        return this.arimaForecast(values, horizon);
      case 'exponential_smoothing':
        return this.exponentialSmoothingForecast(values, horizon);
      case 'neural_network':
        return this.neuralNetworkForecast(values, horizon);
      case 'seasonal_decomposition':
        return this.seasonalDecompositionForecast(values, horizon);
      default:
        return this.simpleForecast(values, horizon);
    }
  }

  private arimaForecast(values: number[], horizon: number) {
    // Simplified ARIMA implementation
    const trend = this.calculateTrend(values);
    const forecast = [];
    
    for (let i = 0; i < horizon; i++) {
      const predicted = values[values.length - 1] + trend * (i + 1);
      forecast.push(Math.max(0, predicted));
    }
    
    return {
      values: forecast,
      accuracy: 0.8,
      confidence: 0.75
    };
  }

  private exponentialSmoothingForecast(values: number[], horizon: number) {
    const alpha = 0.3;
    let smoothed = values[0];
    
    for (let i = 1; i < values.length; i++) {
      smoothed = alpha * values[i] + (1 - alpha) * smoothed;
    }
    
    const forecast = Array(horizon).fill(smoothed);
    
    return {
      values: forecast,
      accuracy: 0.75,
      confidence: 0.7
    };
  }

  private neuralNetworkForecast(values: number[], horizon: number) {
    // Simplified neural network forecast
    const windowSize = Math.min(5, values.length);
    const lastWindow = values.slice(-windowSize);
    const avgGrowth = this.calculateTrend(lastWindow);
    
    const forecast = [];
    let lastValue = values[values.length - 1];
    
    for (let i = 0; i < horizon; i++) {
      lastValue += avgGrowth;
      forecast.push(Math.max(0, lastValue));
    }
    
    return {
      values: forecast,
      accuracy: 0.85,
      confidence: 0.8
    };
  }

  private seasonalDecompositionForecast(values: number[], horizon: number) {
    // Simplified seasonal decomposition
    const seasonLength = 4; // Quarterly seasonality
    const seasons = [];
    
    for (let i = 0; i < seasonLength; i++) {
      const seasonValues = values.filter((_, idx) => idx % seasonLength === i);
      const seasonAvg = seasonValues.reduce((a, b) => a + b, 0) / seasonValues.length;
      seasons.push(seasonAvg);
    }
    
    const forecast = [];
    for (let i = 0; i < horizon; i++) {
      const seasonIndex = i % seasonLength;
      forecast.push(seasons[seasonIndex] || 0);
    }
    
    return {
      values: forecast,
      accuracy: 0.7,
      confidence: 0.65
    };
  }

  private simpleForecast(values: number[], horizon: number) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return {
      values: Array(horizon).fill(avg),
      accuracy: 0.6,
      confidence: 0.5
    };
  }

  private ensembleForecasts(forecasts: any[]) {
    const totalWeight = forecasts.reduce((sum, f) => sum + f.accuracy, 0);
    const ensembleValues = [];
    
    const maxLength = Math.max(...forecasts.map(f => f.forecast.length));
    
    for (let i = 0; i < maxLength; i++) {
      let weightedSum = 0;
      let weightSum = 0;
      
      forecasts.forEach(forecast => {
        if (i < forecast.forecast.length) {
          weightedSum += forecast.forecast[i] * forecast.accuracy;
          weightSum += forecast.accuracy;
        }
      });
      
      ensembleValues.push(weightSum > 0 ? weightedSum / weightSum : 0);
    }
    
    const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length;
    
    return {
      values: ensembleValues,
      confidence: avgConfidence,
      trend: this.calculateTrend(ensembleValues),
      seasonality: this.detectSeasonality(ensembleValues)
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private detectSeasonality(values: number[]): string {
    // Simplified seasonality detection
    if (values.length < 8) return 'none';
    
    const quarterlyVariation = this.calculateQuarterlyVariation(values);
    const monthlyVariation = this.calculateMonthlyVariation(values);
    
    if (quarterlyVariation > monthlyVariation) {
      return 'quarterly';
    } else if (monthlyVariation > 0.1) {
      return 'monthly';
    } else {
      return 'none';
    }
  }

  private calculateQuarterlyVariation(values: number[]): number {
    const quarters = [[], [], [], []];
    values.forEach((value, index) => {
      quarters[index % 4].push(value);
    });
    
    const quarterAvgs = quarters.map(q => 
      q.length > 0 ? q.reduce((a, b) => a + b, 0) / q.length : 0
    );
    
    const overallAvg = values.reduce((a, b) => a + b, 0) / values.length;
    
    return quarterAvgs.reduce((sum, avg) => sum + Math.abs(avg - overallAvg), 0) / 4 / overallAvg;
  }

  private calculateMonthlyVariation(values: number[]): number {
    // Simplified monthly variation calculation
    const monthlyAvg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - monthlyAvg, 2), 0) / values.length;
    
    return Math.sqrt(variance) / monthlyAvg;
  }

  private async calculateFeatureSimilarity(features: any, tenantId: string): Promise<number> {
    // Simplified similarity calculation
    // In production, this would compare against historical feature distributions
    return 0.8; // Default similarity score
  }

  private identifyContributingFactors(model: any, features: any): string[] {
    const factors = [];
    const importance = model.featureImportance || {};
    
    // Sort features by importance
    const sortedFeatures = Object.entries(importance)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3); // Top 3 factors
    
    sortedFeatures.forEach(([feature, importance]) => {
      if ((importance as number) > 0.1) {
        factors.push(`${feature} (${((importance as number) * 100).toFixed(1)}% impact)`);
      }
    });
    
    return factors;
  }
}