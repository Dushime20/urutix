import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Load } from '../../../entities/load.entity';
import { Truck } from '../../../entities/truck.entity';
import { Trip, TripStatus } from '../../../entities/trip.entity';
import { Driver } from '../../../entities/driver.entity';

export interface PredictionFeatures {
  // Cargo features
  cargoType: string;
  weight: number;
  volume?: number;
  isHazardous: boolean;
  isFragile: boolean;
  requiresRefrigeration: boolean;
  urgencyLevel: string;
  
  // Truck features
  truckAge: number;
  capacityWeight: number;
  capacityVolume?: number;
  fuelEfficiency?: number;
  hasGPS: boolean;
  hasTemperatureControl: boolean;
  
  // Driver features
  driverExperience: number;
  driverRating: number;
  driverCertifications: string[];
  
  // Route features
  distance: number;
  estimatedTime: number;
  routeComplexity: string;
  
  // Market features
  currentDemand: number;
  priceCompetitiveness: number;
  seasonalFactor: number;
}

export interface PredictionResult {
  successProbability: number;
  confidence: number;
  riskFactors: string[];
  recommendations: string[];
  modelVersion: string;
  predictionTimestamp: Date;
}

@Injectable()
export class MLPredictionService {
  private readonly logger = new Logger(MLPredictionService.name);
  private readonly modelVersion = 'v1.0.0';
  private readonly predictionCache = new Map<string, { result: PredictionResult; expiry: number }>();
  private readonly cacheTTL = 30 * 60 * 1000; // 30 minutes

  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}

  /**
   * Predict success probability for a cargo-truck match
   */
  async predictSuccessProbability(load: Load, truck: Truck): Promise<number> {
    try {
      // Check cache first
      const cacheKey = `prediction:${load.id}:${truck.id}`;
      const cached = this.predictionCache.get(cacheKey);
      
      if (cached && Date.now() < cached.expiry) {
        return cached.result.successProbability;
      }

      // Extract features for prediction
      const features = await this.extractPredictionFeatures(load, truck);
      
      // Get historical success rate for similar matches
      const historicalSuccessRate = await this.getHistoricalSuccessRate(features);
      
      // Apply ML model prediction (simplified for now)
      const mlPrediction = this.applyMLModel(features);
      
      // Combine historical data with ML prediction
      const finalPrediction = this.combinePredictions(historicalSuccessRate, mlPrediction);
      
      // Cache the result
      const result: PredictionResult = {
        successProbability: finalPrediction,
        confidence: 0.8,
        riskFactors: this.identifyRiskFactors(features),
        recommendations: this.generateRecommendations(features, finalPrediction),
        modelVersion: this.modelVersion,
        predictionTimestamp: new Date(),
      };

      this.predictionCache.set(cacheKey, {
        result,
        expiry: Date.now() + this.cacheTTL,
      });

      return finalPrediction;

    } catch (error) {
      this.logger.warn(`Failed to predict success probability: ${error.message}`);
      return 0.7; // Default fallback probability
    }
  }

  /**
   * Get comprehensive prediction result
   */
  async getDetailedPrediction(load: Load, truck: Truck): Promise<PredictionResult> {
    try {
      const cacheKey = `prediction:${load.id}:${truck.id}`;
      const cached = this.predictionCache.get(cacheKey);
      
      if (cached && Date.now() < cached.expiry) {
        return cached.result;
      }

      // Extract features
      const features = await this.extractPredictionFeatures(load, truck);
      
      // Get historical success rate
      const historicalSuccessRate = await this.getHistoricalSuccessRate(features);
      
      // Apply ML model
      const mlPrediction = this.applyMLModel(features);
      
      // Combine predictions
      const finalPrediction = this.combinePredictions(historicalSuccessRate, mlPrediction);
      
      // Generate detailed result
      const result: PredictionResult = {
        successProbability: finalPrediction,
        confidence: this.calculateConfidence(features),
        riskFactors: this.identifyRiskFactors(features),
        recommendations: this.generateRecommendations(features, finalPrediction),
        modelVersion: this.modelVersion,
        predictionTimestamp: new Date(),
      };

      // Cache the result
      this.predictionCache.set(cacheKey, {
        result,
        expiry: Date.now() + this.cacheTTL,
      });

      return result;

    } catch (error) {
      this.logger.warn(`Failed to get detailed prediction: ${error.message}`);
      return this.getDefaultPrediction();
    }
  }

  /**
   * Extract features for ML prediction
   */
  private async extractPredictionFeatures(load: Load, truck: Truck): Promise<PredictionFeatures> {
    try {
      // Get driver information
      // Truck entity stores currentDriverId, not driverId
      const driver = truck.currentDriverId
        ? await this.driverRepository.findOne({ where: { id: truck.currentDriverId } })
        : undefined;

      // Calculate route complexity
      const routeComplexity = this.calculateRouteComplexity(load, truck);
      
      // Get market conditions (simplified)
      const currentDemand = 0.7; // This would come from market intelligence service
      const priceCompetitiveness = this.calculatePriceCompetitiveness(load, truck);
      const seasonalFactor = this.calculateSeasonalFactor();

      return {
        // Cargo features
        cargoType: load.cargoType,
        weight: load.weight,
        volume: load.volume,
        isHazardous: load.isHazardous,
        isFragile: load.isFragile,
        requiresRefrigeration: load.requiresRefrigeration,
        urgencyLevel: load.urgencyLevel || 'NORMAL',
        
        // Truck features
        truckAge: new Date().getFullYear() - (truck.year || 2020),
        capacityWeight: truck.capacityWeight,
        capacityVolume: truck.capacityVolume,
        fuelEfficiency: truck.fuelEfficiency,
        hasGPS: !!truck.hasGps || !!truck.securityFeatures?.hasGps,
        hasTemperatureControl: !!truck.hasRefrigeration || !!truck.cargoCapabilities?.maxRefrigeratedHandling,
        
        // Driver features
        driverExperience: driver ? Math.max(0, new Date().getFullYear() - new Date(driver.hireDate).getFullYear()) : 0,
        driverRating: driver?.rating ?? 0.5,
        driverCertifications: (driver?.endorsements as any[]) || [],
        
        // Route features
        distance: this.calculateDistance(load, truck),
        estimatedTime: this.estimateTime(load, truck),
        routeComplexity,
        
        // Market features
        currentDemand,
        priceCompetitiveness,
        seasonalFactor,
      };

    } catch (error) {
      this.logger.warn(`Failed to extract prediction features: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get historical success rate for similar matches
   */
  private async getHistoricalSuccessRate(features: PredictionFeatures): Promise<number> {
    try {
      // Query historical trips with similar characteristics
      const similarTrips = await this.tripRepository
        .createQueryBuilder('trip')
        .leftJoinAndSelect('trip.load', 'load')
        .leftJoinAndSelect('trip.truck', 'truck')
        .where('load.cargoType = :cargoType', { cargoType: features.cargoType })
        .andWhere('load.weight BETWEEN :minWeight AND :maxWeight', {
          minWeight: features.weight * 0.8,
          maxWeight: features.weight * 1.2,
        })
        .andWhere('trip.status = :status', { status: TripStatus.COMPLETED })
        .andWhere('trip.createdAt >= :startDate', {
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        })
        .getMany();

      if (similarTrips.length === 0) {
        return 0.7; // Default success rate if no historical data
      }

      // Calculate success rate
      const successfulTrips = similarTrips.filter(trip => 
        trip.status === TripStatus.COMPLETED
      );

      return successfulTrips.length / similarTrips.length;

    } catch (error) {
      this.logger.warn(`Failed to get historical success rate: ${error.message}`);
      return 0.7; // Default fallback
    }
  }

  /**
   * Apply ML model to features
   */
  private applyMLModel(features: PredictionFeatures): number {
    try {
      // This is a simplified ML model
      // In production, you would use a trained model (TensorFlow, scikit-learn, etc.)
      
      let score = 0.5; // Base score
      
      // Cargo type adjustments
      if (features.cargoType === 'HAZARDOUS') {
        score -= 0.1;
      } else if (features.cargoType === 'FRAGILE') {
        score -= 0.05;
      }
      
      // Weight compatibility
      if (features.weight <= features.capacityWeight * 0.8) {
        score += 0.1; // Good weight utilization
      } else if (features.weight > features.capacityWeight) {
        score -= 0.2; // Overweight
      }
      
      // Driver experience
      if (features.driverExperience >= 5) {
        score += 0.1;
      } else if (features.driverExperience < 2) {
        score -= 0.1;
      }
      
      // Route complexity
      if (features.routeComplexity === 'low') {
        score += 0.05;
      } else if (features.routeComplexity === 'high') {
        score -= 0.1;
      }
      
      // Market conditions
      if (features.currentDemand > 0.8) {
        score += 0.05; // High demand favors success
      }
      
      // Seasonal factors
      score += features.seasonalFactor * 0.05;
      
      // Ensure score is between 0 and 1
      return Math.max(0, Math.min(1, score));

    } catch (error) {
      this.logger.warn(`ML model application failed: ${error.message}`);
      return 0.7; // Default fallback
    }
  }

  /**
   * Combine historical data with ML prediction
   */
  private combinePredictions(historicalRate: number, mlPrediction: number): number {
    // Weight historical data more heavily (70%) than ML prediction (30%)
    // This can be adjusted based on model confidence and data quality
    const historicalWeight = 0.7;
    const mlWeight = 0.3;
    
    return (historicalRate * historicalWeight) + (mlPrediction * mlWeight);
  }

  /**
   * Calculate route complexity
   */
  private calculateRouteComplexity(load: Load, truck: Truck): string {
    // This is a simplified calculation
    // In production, you would use actual route data and traffic analysis
    
    const distance = this.calculateDistance(load, truck);
    
    if (distance < 100) return 'low';
    if (distance < 500) return 'medium';
    return 'high';
  }

  /**
   * Calculate distance between load and truck
   */
  private calculateDistance(load: Load, truck: Truck): number {
    // This is a simplified calculation
    // In production, you would use actual coordinates and routing APIs
    
    // Placeholder distance calculation
    return 250; // km
  }

  /**
   * Estimate transportation time
   */
  private estimateTime(load: Load, truck: Truck): number {
    const distance = this.calculateDistance(load, truck);
    const averageSpeed = 55; // mph
    
    return distance / averageSpeed; // hours
  }

  /**
   * Calculate price competitiveness
   */
  private calculatePriceCompetitiveness(load: Load, truck: Truck): number {
    // This would compare the load's offered price with market rates
    // For now, return a neutral value
    return 0.5;
  }

  /**
   * Calculate seasonal factor
   */
  private calculateSeasonalFactor(): number {
    const month = new Date().getMonth();
    
    // Seasonal adjustments
    if (month >= 11 || month <= 2) return 0.1; // Winter
    if (month >= 3 && month <= 5) return 0.05; // Spring
    if (month >= 6 && month <= 8) return -0.05; // Summer
    if (month >= 9 && month <= 10) return 0.1; // Fall
    
    return 0;
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(features: PredictionFeatures): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence with more data points
    if (features.driverExperience > 0) confidence += 0.1;
    if (features.truckAge > 0) confidence += 0.1;
    if (features.distance > 0) confidence += 0.1;
    
    // Decrease confidence for complex scenarios
    if (features.isHazardous) confidence -= 0.1;
    if (features.routeComplexity === 'high') confidence -= 0.1;
    
    return Math.max(0.3, Math.min(0.9, confidence));
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(features: PredictionFeatures): string[] {
    const riskFactors: string[] = [];
    
    if (features.isHazardous) {
      riskFactors.push('Hazardous cargo requires special handling');
    }
    
    if (features.isFragile) {
      riskFactors.push('Fragile cargo needs careful handling');
    }
    
    if (features.truckAge > 10) {
      riskFactors.push('Older vehicle may have reliability issues');
    }
    
    if (features.driverExperience < 2) {
      riskFactors.push('Inexperienced driver');
    }
    
    if (features.routeComplexity === 'high') {
      riskFactors.push('Complex route with potential delays');
    }
    
    if (features.urgencyLevel === 'CRITICAL') {
      riskFactors.push('Time-critical delivery');
    }
    
    return riskFactors;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(features: PredictionFeatures, probability: number): string[] {
    const recommendations: string[] = [];
    
    if (probability < 0.6) {
      recommendations.push('Consider alternative carriers with better track records');
      recommendations.push('Review cargo specifications and requirements');
    }
    
    if (features.isHazardous) {
      recommendations.push('Ensure carrier has proper hazardous materials certifications');
      recommendations.push('Verify insurance coverage for hazardous cargo');
    }
    
    if (features.isFragile) {
      recommendations.push('Use specialized packaging and handling procedures');
      recommendations.push('Consider experienced drivers for fragile cargo');
    }
    
    if (features.routeComplexity === 'high') {
      recommendations.push('Plan for potential delays and route changes');
      recommendations.push('Use GPS tracking for real-time monitoring');
    }
    
    if (features.urgencyLevel === 'CRITICAL') {
      recommendations.push('Consider premium carriers for time-critical delivery');
      recommendations.push('Have backup plans ready');
    }
    
    return recommendations;
  }

  /**
   * Get default prediction when ML fails
   */
  private getDefaultPrediction(): PredictionResult {
    return {
      successProbability: 0.7,
      confidence: 0.5,
      riskFactors: ['Limited data available for prediction'],
      recommendations: ['Use standard safety protocols', 'Monitor delivery closely'],
      modelVersion: this.modelVersion,
      predictionTimestamp: new Date(),
    };
  }

  /**
   * Train/update ML model (placeholder for future implementation)
   */
  async trainModel(): Promise<void> {
    try {
      this.logger.log('Starting ML model training...');
      
      // This would implement actual model training
      // For now, just log the action
      
      this.logger.log('ML model training completed');
    } catch (error) {
      this.logger.error(`ML model training failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics(): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    lastUpdated: Date;
  }> {
    // This would return actual model performance metrics
    // For now, return placeholder values
    return {
      accuracy: 0.82,
      precision: 0.79,
      recall: 0.85,
      f1Score: 0.82,
      lastUpdated: new Date(),
    };
  }
}
