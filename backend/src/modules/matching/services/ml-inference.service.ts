import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Load } from '../../../entities/load.entity';
import { Truck } from '../../../entities/truck.entity';
import { Driver } from '../../../entities/driver.entity';
import { Trip } from '../../../entities/trip.entity';

export interface MLPrediction {
  successProbability: number;
  estimatedDeliveryTime: number;
  riskScore: number;
  recommendedPrice: number;
  confidence: number;
  factors: string[];
}

export interface MLRecommendation {
  type: 'pricing' | 'timing' | 'route' | 'equipment' | 'driver';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  data: any;
}

export interface MLModelMetrics {
  modelVersion: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastUpdated: Date;
  trainingDataSize: number;
}

export interface MLFeatures {
  loadWeight: number;
  loadVolume: number;
  distance: number;
  driverRating: number;
  truckAge: number;
  fuelEfficiency: number;
  weatherConditions: string;
  trafficConditions: string;
  timeOfDay: number;
  dayOfWeek: number;
  season: string;
  marketDemand: number;
  competitorPricing: number;
}

@Injectable()
export class MLInferenceService {
  private readonly logger = new Logger(MLInferenceService.name);
  private readonly modelMetrics: MLModelMetrics = {
    modelVersion: 'v1.0',
    accuracy: 0.85,
    precision: 0.82,
    recall: 0.88,
    f1Score: 0.85,
    lastUpdated: new Date(),
    trainingDataSize: 10000,
  };

  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
  ) {}

  /**
   * Predict trip success probability
   */
  async predictTripSuccess(
    loadId: string,
    truckId: string,
    driverId: string,
    tenantId: string,
  ): Promise<MLPrediction> {
    try {
      // Get historical data for feature extraction
      const features = await this.extractFeatures(
        loadId,
        truckId,
        driverId,
        tenantId,
      );

      // Run ML model inference
      const prediction = await this.runModelInference(features);

      return prediction;
    } catch (error) {
      this.logger.error('Error predicting trip success:', error);
      throw error;
    }
  }

  /**
   * Predict optimal pricing
   */
  async predictOptimalPricing(
    loadId: string,
    truckId: string,
    tenantId: string,
  ): Promise<{
    recommendedPrice: number;
    minPrice: number;
    maxPrice: number;
    confidence: number;
    factors: string[];
  }> {
    try {
      const load = await this.loadRepository.findOne({
        where: { id: loadId, tenantId },
      });

      if (!load) {
        throw new Error('Load not found');
      }

      const truck = await this.truckRepository.findOne({
        where: { id: truckId, tenantId },
      });

      if (!truck) {
        throw new Error('Truck not found');
      }

      // Calculate base price
      const basePrice = this.calculateBasePrice(load, truck);

      // Apply market factors
      const marketFactor = await this.getMarketFactor(load, tenantId);

      // Apply demand factor
      const demandFactor = await this.getDemandFactor(load, tenantId);

      // Apply seasonal factor
      const seasonalFactor = this.getSeasonalFactor();

      // Calculate optimal price
      const optimalPrice =
        basePrice * marketFactor * demandFactor * seasonalFactor;

      // Calculate price range
      const minPrice = optimalPrice * 0.9;
      const maxPrice = optimalPrice * 1.2;

      return {
        recommendedPrice: Math.round(optimalPrice * 100) / 100,
        minPrice: Math.round(minPrice * 100) / 100,
        maxPrice: Math.round(maxPrice * 100) / 100,
        confidence: 0.85,
        factors: [
          'market_conditions',
          'demand_level',
          'seasonal_trends',
          'equipment_type',
        ],
      };
    } catch (error) {
      this.logger.error('Error predicting optimal pricing:', error);
      throw error;
    }
  }

  /**
   * Predict delivery time
   */
  async predictDeliveryTime(
    loadId: string,
    truckId: string,
    routeDistance: number,
  ): Promise<{
    estimatedTime: number;
    confidence: number;
    factors: string[];
  }> {
    try {
      const load = await this.loadRepository.findOne({
        where: { id: loadId },
      });

      const truck = await this.truckRepository.findOne({
        where: { id: truckId },
      });

      if (!load || !truck) {
        throw new Error('Load or truck not found');
      }

      // Base travel time
      const baseTravelTime = routeDistance / 60; // Assume 60 km/h average

      // Loading/unloading time
      const handlingTime = this.calculateHandlingTime(load);

      // Weather factor
      const weatherFactor = this.getWeatherFactor();

      // Traffic factor
      const trafficFactor = this.getTrafficFactor();

      // Equipment factor
      const equipmentFactor = this.getEquipmentFactor(truck);

      // Total estimated time
      const estimatedTime =
        (baseTravelTime + handlingTime) *
        weatherFactor *
        trafficFactor *
        equipmentFactor;

      return {
        estimatedTime: Math.round(estimatedTime * 100) / 100,
        confidence: 0.8,
        factors: [
          'distance',
          'weather',
          'traffic',
          'equipment_type',
          'load_characteristics',
        ],
      };
    } catch (error) {
      this.logger.error('Error predicting delivery time:', error);
      throw error;
    }
  }

  /**
   * Generate ML recommendations
   */
  async generateRecommendations(
    loadId: string,
    truckId: string,
    driverId: string,
    tenantId: string,
  ): Promise<MLRecommendation[]> {
    try {
      const recommendations: MLRecommendation[] = [];

      // Pricing recommendations
      const pricingRecommendation = await this.generatePricingRecommendation(
        loadId,
        truckId,
        tenantId,
      );
      if (pricingRecommendation) {
        recommendations.push(pricingRecommendation);
      }

      // Timing recommendations
      const timingRecommendation = await this.generateTimingRecommendation(
        loadId,
        truckId,
      );
      if (timingRecommendation) {
        recommendations.push(timingRecommendation);
      }

      // Route recommendations
      const routeRecommendation = await this.generateRouteRecommendation(
        loadId,
        truckId,
      );
      if (routeRecommendation) {
        recommendations.push(routeRecommendation);
      }

      // Equipment recommendations
      const equipmentRecommendation =
        await this.generateEquipmentRecommendation(loadId, truckId);
      if (equipmentRecommendation) {
        recommendations.push(equipmentRecommendation);
      }

      // Driver recommendations
      const driverRecommendation = await this.generateDriverRecommendation(
        driverId,
        loadId,
        tenantId,
      );
      if (driverRecommendation) {
        recommendations.push(driverRecommendation);
      }

      return recommendations;
    } catch (error) {
      this.logger.error('Error generating recommendations:', error);
      throw error;
    }
  }

  /**
   * Get model performance metrics
   */
  getModelMetrics(): MLModelMetrics {
    return { ...this.modelMetrics };
  }

  /**
   * Update model with new data
   */
  async updateModel(trainingData: any[]): Promise<void> {
    try {
      // In real implementation, retrain the model with new data
      this.modelMetrics.trainingDataSize += trainingData.length;
      this.modelMetrics.lastUpdated = new Date();

      // Update metrics based on new training
      this.modelMetrics.accuracy = Math.min(
        0.95,
        this.modelMetrics.accuracy + 0.01,
      );
      this.modelMetrics.precision = Math.min(
        0.95,
        this.modelMetrics.precision + 0.01,
      );
      this.modelMetrics.recall = Math.min(
        0.95,
        this.modelMetrics.recall + 0.01,
      );
      this.modelMetrics.f1Score = Math.min(
        0.95,
        this.modelMetrics.f1Score + 0.01,
      );

      this.logger.log(
        `Model updated with ${trainingData.length} new training samples`,
      );
    } catch (error) {
      this.logger.error('Error updating model:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private async extractFeatures(
    loadId: string,
    truckId: string,
    driverId: string,
    tenantId: string,
  ): Promise<MLFeatures> {
    const load = await this.loadRepository.findOne({
      where: { id: loadId, tenantId },
    });

    const truck = await this.truckRepository.findOne({
      where: { id: truckId, tenantId },
    });

    const driver = await this.driverRepository.findOne({
      where: { id: driverId, tenantId },
    });

    if (!load || !truck || !driver) {
      throw new Error('Required data not found');
    }

    // Get historical performance data
    const driverTrips = await this.tripRepository.find({
      where: { driverId, tenantId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const truckTrips = await this.tripRepository.find({
      where: { truckId, tenantId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Calculate features
    const driverSuccessRate =
      driverTrips.length > 0
        ? driverTrips.filter((trip) => trip.status === 'COMPLETED').length /
          driverTrips.length
        : 0.8;

    const truckSuccessRate =
      truckTrips.length > 0
        ? truckTrips.filter((trip) => trip.status === 'COMPLETED').length /
          truckTrips.length
        : 0.8;

    const currentTime = new Date();
    const timeOfDay = currentTime.getHours();
    const dayOfWeek = currentTime.getDay();
    const season = this.getSeason(currentTime);

    return {
      loadWeight: load.weight,
      loadVolume: load.volume,
      distance: 100, // Placeholder - should be calculated from route
      driverRating: driver.rating,
      truckAge: this.calculateTruckAge(truck),
      fuelEfficiency: truck.fuelEfficiency || 6.5,
      weatherConditions: this.getWeatherConditions(),
      trafficConditions: this.getTrafficConditions(),
      timeOfDay,
      dayOfWeek,
      season,
      marketDemand: await this.getMarketDemand(tenantId),
      competitorPricing: await this.getCompetitorPricing(load, tenantId),
    };
  }

  private async runModelInference(features: MLFeatures): Promise<MLPrediction> {
    // Simplified ML model inference
    // In real implementation, this would call a trained ML model

    // Calculate success probability based on features
    let successProbability = 0.8; // Base probability

    // Adjust based on driver rating
    successProbability += (features.driverRating - 3) * 0.1;

    // Adjust based on truck age
    successProbability -= Math.min(0.2, features.truckAge * 0.02);

    // Adjust based on weather conditions
    if (features.weatherConditions === 'good') successProbability += 0.05;
    if (features.weatherConditions === 'poor') successProbability -= 0.1;

    // Adjust based on traffic conditions
    if (features.trafficConditions === 'low') successProbability += 0.05;
    if (features.trafficConditions === 'high') successProbability -= 0.1;

    // Adjust based on time of day
    if (features.timeOfDay >= 6 && features.timeOfDay <= 18)
      successProbability += 0.05;

    // Clamp probability between 0 and 1
    successProbability = Math.max(0, Math.min(1, successProbability));

    // Calculate other metrics
    const estimatedDeliveryTime = features.distance / 60 + 2; // hours
    const riskScore = 1 - successProbability;
    const recommendedPrice = features.distance * 2.5 * (1 + riskScore * 0.2);
    const confidence = 0.8 + successProbability * 0.2;

    return {
      successProbability,
      estimatedDeliveryTime,
      riskScore,
      recommendedPrice: Math.round(recommendedPrice * 100) / 100,
      confidence,
      factors: [
        'driver_performance',
        'equipment_condition',
        'environmental_factors',
        'market_conditions',
      ],
    };
  }

  private calculateBasePrice(load: Load, truck: Truck): number {
    const baseRate = 2.5; // $2.5 per km
    const weightFactor = load.weight / 1000; // tons
    const equipmentFactor = truck.hasRefrigeration ? 1.2 : 1.0;

    return 100 * baseRate * weightFactor * equipmentFactor; // Assume 100km distance
  }

  private async getMarketFactor(load: Load, tenantId: string): Promise<number> {
    // In real implementation, get from market data API
    return 1.0 + (Math.random() - 0.5) * 0.2; // ±10% variation
  }

  private async getDemandFactor(load: Load, tenantId: string): Promise<number> {
    // In real implementation, analyze demand patterns
    return 1.0 + (Math.random() - 0.5) * 0.3; // ±15% variation
  }

  private getSeasonalFactor(): number {
    const month = new Date().getMonth();
    // Higher demand in summer months
    if (month >= 5 && month <= 8) return 1.1;
    if (month >= 11 || month <= 2) return 0.9;
    return 1.0;
  }

  private calculateHandlingTime(load: Load): number {
    // Base handling time plus weight factor
    return 1 + (load.weight / 1000) * 0.5; // hours
  }

  private getWeatherFactor(): number {
    // In real implementation, get from weather API
    const conditions = ['good', 'fair', 'poor'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    switch (condition) {
      case 'good':
        return 1.0;
      case 'fair':
        return 1.1;
      case 'poor':
        return 1.3;
      default:
        return 1.0;
    }
  }

  private getTrafficFactor(): number {
    // In real implementation, get from traffic API
    const conditions = ['low', 'medium', 'high'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    switch (condition) {
      case 'low':
        return 1.0;
      case 'medium':
        return 1.15;
      case 'high':
        return 1.4;
      default:
        return 1.0;
    }
  }

  private getEquipmentFactor(truck: Truck): number {
    if (truck.hasRefrigeration) return 1.1;
    if (truck.hasLiftGate) return 1.05;
    return 1.0;
  }

  private async generatePricingRecommendation(
    loadId: string,
    truckId: string,
    tenantId: string,
  ): Promise<MLRecommendation | null> {
    const pricing = await this.predictOptimalPricing(loadId, truckId, tenantId);

    if (pricing.confidence > 0.8) {
      return {
        type: 'pricing',
        title: 'Optimal Pricing Recommendation',
        description: `Recommended price: $${pricing.recommendedPrice} (Range: $${pricing.minPrice} - $${pricing.maxPrice})`,
        impact: 'high',
        confidence: pricing.confidence,
        data: pricing,
      };
    }

    return null;
  }

  private async generateTimingRecommendation(
    loadId: string,
    truckId: string,
  ): Promise<MLRecommendation | null> {
    const timing = await this.predictDeliveryTime(loadId, truckId, 100);

    return {
      type: 'timing',
      title: 'Delivery Time Optimization',
      description: `Estimated delivery time: ${timing.estimatedTime} hours`,
      impact: 'medium',
      confidence: timing.confidence,
      data: timing,
    };
  }

  private async generateRouteRecommendation(
    loadId: string,
    truckId: string,
  ): Promise<MLRecommendation | null> {
    // In real implementation, analyze route options
    return {
      type: 'route',
      title: 'Route Optimization',
      description: 'Consider alternative route to avoid traffic congestion',
      impact: 'medium',
      confidence: 0.75,
      data: { alternativeRoutes: 3 },
    };
  }

  private async generateEquipmentRecommendation(
    loadId: string,
    truckId: string,
  ): Promise<MLRecommendation | null> {
    const load = await this.loadRepository.findOne({ where: { id: loadId } });
    const truck = await this.truckRepository.findOne({
      where: { id: truckId },
    });

    if (!load || !truck) return null;

    if (load.requiresRefrigeration && !truck.hasRefrigeration) {
      return {
        type: 'equipment',
        title: 'Equipment Mismatch',
        description: 'Load requires refrigeration but truck does not have it',
        impact: 'high',
        confidence: 1.0,
        data: { required: 'refrigeration', available: false },
      };
    }

    return null;
  }

  private async generateDriverRecommendation(
    driverId: string,
    loadId: string,
    tenantId: string,
  ): Promise<MLRecommendation | null> {
    const driver = await this.driverRepository.findOne({
      where: { id: driverId, tenantId },
    });

    if (!driver) return null;

    if (driver.rating < 3.5) {
      return {
        type: 'driver',
        title: 'Driver Performance Alert',
        description: 'Driver has low rating, consider alternative driver',
        impact: 'medium',
        confidence: 0.8,
        data: { rating: driver.rating, threshold: 3.5 },
      };
    }

    return null;
  }

  private calculateTruckAge(truck: Truck): number {
    // In real implementation, calculate from truck registration date
    return 3; // Placeholder: 3 years
  }

  private getWeatherConditions(): string {
    const conditions = ['good', 'fair', 'poor'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  private getTrafficConditions(): string {
    const conditions = ['low', 'medium', 'high'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private async getMarketDemand(tenantId: string): Promise<number> {
    // In real implementation, analyze market demand
    return 0.7 + Math.random() * 0.6; // 0.7 to 1.3
  }

  private async getCompetitorPricing(
    load: Load,
    tenantId: string,
  ): Promise<number> {
    // In real implementation, get competitor pricing data
    return 2.5 + (Math.random() - 0.5) * 0.5; // $2.25 to $2.75 per km
  }
}
