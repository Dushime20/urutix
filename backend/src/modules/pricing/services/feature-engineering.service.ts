import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PricingFeature,
  FeatureType,
  FeatureSource,
} from '../entities/pricing-feature.entity';
import { Trip } from '../../../entities/trip.entity';
import { Load } from '../../../entities/load.entity';
import { Truck } from '../../../entities/truck.entity';
import { Driver } from '../../../entities/driver.entity';
import { Payment } from '../../../entities/payment.entity';
import { PricingFeatures } from '../interfaces/pricing-features.interface';

@Injectable()
export class FeatureEngineeringService {
  private readonly logger = new Logger(FeatureEngineeringService.name);

  constructor(
    @InjectRepository(PricingFeature)
    private readonly pricingFeatureRepository: Repository<PricingFeature>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async extractFeatures(
    tripData: any,
    tenantId: string,
  ): Promise<PricingFeatures> {
    try {
      const features: PricingFeatures = {
        // Basic features
        distance: tripData.distance || 0,
        weight: tripData.weight || 0,
        volume: tripData.volume || 0,

        // Route complexity
        routeComplexity: await this.calculateRouteComplexity(tripData),

        // Market conditions
        marketConditions: await this.getMarketConditions(tripData, tenantId),

        // Truck availability
        truckAvailability: await this.getTruckAvailability(tripData, tenantId),

        // Driver metrics
        driverMetrics: await this.getDriverMetrics(tripData.driverId, tenantId),

        // Environmental factors
        environmentalFactors: await this.getEnvironmentalFactors(tripData),

        // Temporal features
        temporalFeatures: this.extractTemporalFeatures(tripData),

        // Cargo features
        cargoFeatures: await this.getCargoFeatures(tripData.loadId, tenantId),
      };

      // Add computed features
      features.distanceWeightRatio =
        features.weight > 0 ? features.weight / features.distance : 0;
      features.volumeWeightRatio =
        features.weight > 0 ? features.volume / features.weight : 0;
      features.routeEfficiency = this.calculateRouteEfficiency(
        features.routeComplexity,
      );
      features.marketVolatility = this.calculateMarketVolatility(
        features.marketConditions,
      );
      features.driverEfficiency = this.calculateDriverEfficiency(
        features.driverMetrics,
      );
      features.environmentalRisk = this.calculateEnvironmentalRisk(
        features.environmentalFactors,
      );

      return features;
    } catch (error) {
      this.logger.error(`Failed to extract features: ${error.message}`);
      throw error;
    }
  }

  async engineerAdvancedFeatures(
    baseFeatures: PricingFeatures,
    tenantId: string,
  ): Promise<PricingFeatures> {
    try {
      const enhancedFeatures = { ...baseFeatures };

      // Add interaction features
      enhancedFeatures['distance_market_interaction'] =
        baseFeatures.distance * baseFeatures.marketConditions.demandLevel;
      enhancedFeatures['weight_route_interaction'] =
        baseFeatures.weight * baseFeatures.routeComplexity.urbanPercentage;
      enhancedFeatures['driver_environment_interaction'] =
        baseFeatures.driverMetrics.safetyScore *
        (1 - (baseFeatures.environmentalRisk || 0));

      // Add polynomial features
      enhancedFeatures['distance_squared'] = Math.pow(baseFeatures.distance, 2);
      enhancedFeatures['weight_squared'] = Math.pow(baseFeatures.weight, 2);
      enhancedFeatures['market_demand_squared'] = Math.pow(
        baseFeatures.marketConditions.demandLevel,
        2,
      );

      // Add ratio features
      enhancedFeatures['fuel_efficiency'] =
        baseFeatures.distance / (baseFeatures.marketConditions.fuelPrice + 1);
      enhancedFeatures['capacity_efficiency'] =
        baseFeatures.weight /
        (baseFeatures.truckAvailability.capacityUtilization + 0.1);

      // Add seasonal features
      enhancedFeatures['peak_season'] = this.isPeakSeason(
        baseFeatures.temporalFeatures,
      );
      enhancedFeatures['holiday_factor'] = this.calculateHolidayFactor(
        baseFeatures.temporalFeatures,
      );

      // Add geographic features
      enhancedFeatures['regional_factor'] = await this.getRegionalFactor(
        baseFeatures,
        tenantId,
      );
      enhancedFeatures['border_crossing_factor'] =
        baseFeatures.routeComplexity.borderCrossings > 0 ? 1.2 : 1.0;

      return enhancedFeatures;
    } catch (error) {
      this.logger.error(
        `Failed to engineer advanced features: ${error.message}`,
      );
      throw error;
    }
  }

  async calculateRouteComplexity(tripData: any): Promise<any> {
    // Mock route complexity calculation
    // In real implementation, this would use routing APIs and GIS data
    return {
      highwayPercentage: Math.random() * 0.8 + 0.2,
      urbanPercentage: Math.random() * 0.4,
      ruralPercentage: Math.random() * 0.3,
      tollRoads: Math.floor(Math.random() * 5),
      borderCrossings: Math.floor(Math.random() * 2),
      elevationChange: Math.random() * 3000,
    };
  }

  async getMarketConditions(tripData: any, tenantId: string): Promise<any> {
    // Mock market conditions
    // In real implementation, this would fetch from market data APIs
    return {
      demandLevel: Math.random() * 0.6 + 0.4,
      supplyLevel: Math.random() * 0.6 + 0.4,
      competitorPricing: Math.random() * 2 + 1.5,
      seasonalFactor: this.getSeasonalFactor(tripData),
      fuelPrice: Math.random() * 2 + 2.5,
      marketVolatility: Math.random() * 0.5 + 0.1,
    };
  }

  async getTruckAvailability(tripData: any, tenantId: string): Promise<any> {
    // Mock truck availability
    // In real implementation, this would query truck inventory
    return {
      availableTrucks: Math.floor(Math.random() * 20) + 5,
      truckUtilization: Math.random() * 0.3 + 0.7,
      truckType: this.getRequiredTruckType(tripData),
      capacityUtilization: Math.random() * 0.4 + 0.6,
      equipmentRequirements: this.getEquipmentRequirements(tripData),
    };
  }

  async getDriverMetrics(driverId: string, tenantId: string): Promise<any> {
    if (!driverId) {
      return this.getDefaultDriverMetrics();
    }

    try {
      const driver = await this.driverRepository.findOne({
        where: { id: driverId, tenantId },
      });

      if (!driver) {
        return this.getDefaultDriverMetrics();
      }

      return {
        driverRating: driver.rating,
        safetyScore: driver.safetyScore,
        experienceYears: this.calculateExperienceYears(driver.hireDate),
        onTimeDeliveryRate: driver.onTimeDeliveryRate,
        totalTrips: driver.totalTrips,
        averageEarnings: driver.totalEarnings / Math.max(driver.totalTrips, 1),
      };
    } catch (error) {
      this.logger.warn(
        `Failed to get driver metrics for ${driverId}: ${error.message}`,
      );
      return this.getDefaultDriverMetrics();
    }
  }

  async getEnvironmentalFactors(tripData: any): Promise<any> {
    // Mock environmental factors
    // In real implementation, this would fetch from weather APIs
    return {
      weatherConditions: this.getRandomWeatherCondition(),
      trafficConditions: this.getRandomTrafficCondition(),
      roadConditions: this.getRandomRoadCondition(),
      temperature: Math.random() * 80 + 20,
      precipitation: Math.random() * 2,
      windSpeed: Math.random() * 30,
    };
  }

  extractTemporalFeatures(tripData: any): any {
    const date = tripData.scheduledDate
      ? new Date(tripData.scheduledDate)
      : new Date();

    return {
      dayOfWeek: date.getDay(),
      month: date.getMonth() + 1,
      season: this.getSeason(date),
      isHoliday: this.isHoliday(date),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      timeOfDay: date.getHours(),
    };
  }

  async getCargoFeatures(loadId: string, tenantId: string): Promise<any> {
    if (!loadId) {
      return this.getDefaultCargoFeatures();
    }

    try {
      const load = await this.loadRepository.findOne({
        where: { id: loadId, tenantId },
      });

      if (!load) {
        return this.getDefaultCargoFeatures();
      }

      return {
        cargoType: load.cargoType || 'general_freight',
        isHazmat: load.isHazardous || false,
        isRefrigerated: load.requiresRefrigeration || false,
        isFragile: load.isFragile || false,
        requiresSpecialHandling: false, // Not available in Load entity
        insuranceValue: load.loadValue || 0,
      };
    } catch (error) {
      this.logger.warn(
        `Failed to get cargo features for ${loadId}: ${error.message}`,
      );
      return this.getDefaultCargoFeatures();
    }
  }

  calculateRouteEfficiency(routeComplexity: any): number {
    const efficiency =
      1 -
      (routeComplexity.urbanPercentage * 0.3 +
        routeComplexity.tollRoads * 0.1 +
        routeComplexity.borderCrossings * 0.2);
    return Math.max(0.1, Math.min(1, efficiency));
  }

  calculateMarketVolatility(marketConditions: any): number {
    return marketConditions.marketVolatility || 0.1;
  }

  calculateDriverEfficiency(driverMetrics: any): number {
    return (
      (driverMetrics.driverRating * 0.4 +
        driverMetrics.safetyScore * 0.3 +
        driverMetrics.onTimeDeliveryRate * 0.3) /
      100
    );
  }

  calculateEnvironmentalRisk(environmentalFactors: any): number {
    let risk = 0;

    if (environmentalFactors.weatherConditions === 'adverse') risk += 0.3;
    if (environmentalFactors.trafficConditions === 'heavy') risk += 0.2;
    if (environmentalFactors.roadConditions === 'poor') risk += 0.2;
    if (environmentalFactors.precipitation > 1) risk += 0.1;
    if (environmentalFactors.windSpeed > 20) risk += 0.1;

    return Math.min(risk, 1);
  }

  getSeasonalFactor(tripData: any): number {
    const date = tripData.scheduledDate
      ? new Date(tripData.scheduledDate)
      : new Date();
    const month = date.getMonth() + 1;

    // Peak season factors
    if (month >= 6 && month <= 8) return 1.2; // Summer
    if (month >= 11 || month <= 1) return 1.1; // Winter holidays
    if (month >= 3 && month <= 5) return 1.05; // Spring
    return 1.0; // Fall
  }

  getRequiredTruckType(tripData: any): string {
    if (tripData.isRefrigerated) return 'reefer';
    if (tripData.isHazmat) return 'specialized';
    if (tripData.weight > 20000) return 'flatbed';
    return 'dry_van';
  }

  getEquipmentRequirements(tripData: any): string[] {
    const requirements: string[] = [];

    if (tripData.requiresLiftgate) requirements.push('liftgate');
    if (tripData.requiresPalletJacks) requirements.push('pallet_jacks');
    if (tripData.requiresStraps) requirements.push('straps');
    if (tripData.requiresTarps) requirements.push('tarps');

    return requirements;
  }

  getDefaultDriverMetrics(): any {
    return {
      driverRating: 4.0,
      safetyScore: 85,
      experienceYears: 5,
      onTimeDeliveryRate: 0.9,
      totalTrips: 100,
      averageEarnings: 400,
    };
  }

  getDefaultCargoFeatures(): any {
    return {
      cargoType: 'general_freight',
      isHazmat: false,
      isRefrigerated: false,
      isFragile: false,
      requiresSpecialHandling: false,
      insuranceValue: 0,
    };
  }

  getRandomWeatherCondition(): string {
    const conditions = ['clear', 'rain', 'snow', 'fog', 'storm', 'adverse'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  getRandomTrafficCondition(): string {
    const conditions = ['light', 'moderate', 'heavy', 'congested'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  getRandomRoadCondition(): string {
    const conditions = ['excellent', 'good', 'fair', 'poor'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  getSeason(date: Date): string {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }

  isHoliday(date: Date): boolean {
    // Mock holiday detection
    // In real implementation, this would use a holiday calendar
    const holidays = [
      '2024-01-01',
      '2024-07-04',
      '2024-12-25',
      '2024-11-28',
      '2024-05-27',
      '2024-09-02',
    ];
    const dateStr = date.toISOString().split('T')[0];
    return holidays.includes(dateStr);
  }

  isPeakSeason(temporalFeatures: any): boolean {
    return temporalFeatures.month >= 6 && temporalFeatures.month <= 8;
  }

  calculateHolidayFactor(temporalFeatures: any): number {
    if (temporalFeatures.isHoliday) return 1.3;
    if (temporalFeatures.isWeekend) return 1.1;
    return 1.0;
  }

  async getRegionalFactor(
    features: PricingFeatures,
    tenantId: string,
  ): Promise<number> {
    // Mock regional factor calculation
    // In real implementation, this would use geographic data
    return Math.random() * 0.4 + 0.8;
  }

  calculateExperienceYears(hireDate: Date): number {
    if (!hireDate) return 5;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hireDate.getTime());
    const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
    return Math.max(1, diffYears);
  }

  async validateFeatures(features: PricingFeatures): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required features
    if (!features.distance || features.distance <= 0) {
      errors.push('Distance must be greater than 0');
    }

    if (!features.weight || features.weight <= 0) {
      errors.push('Weight must be greater than 0');
    }

    if (!features.volume || features.volume <= 0) {
      errors.push('Volume must be greater than 0');
    }

    // Validate ranges
    if (features.distance > 5000) {
      warnings.push('Distance exceeds typical range');
    }

    if (features.weight > 80000) {
      warnings.push('Weight exceeds typical range');
    }

    if (
      features.marketConditions.demandLevel > 1 ||
      features.marketConditions.demandLevel < 0
    ) {
      errors.push('Demand level must be between 0 and 1');
    }

    // Validate consistency
    if (
      features.routeComplexity.highwayPercentage +
        features.routeComplexity.urbanPercentage +
        features.routeComplexity.ruralPercentage >
      1.1
    ) {
      warnings.push('Route percentages may not sum to 100%');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async preprocessFeatures(
    features: PricingFeatures,
  ): Promise<PricingFeatures> {
    // Apply preprocessing transformations
    const processed = { ...features };

    // Normalize numerical features
    processed.distance = this.normalizeFeature(processed.distance, 0, 5000);
    processed.weight = this.normalizeFeature(processed.weight, 0, 80000);
    processed.volume = this.normalizeFeature(processed.volume, 0, 5000);

    // Log transform skewed features
    if (processed.distanceWeightRatio && processed.distanceWeightRatio > 0) {
      processed.distanceWeightRatio = Math.log(
        processed.distanceWeightRatio + 1,
      );
    }

    if (processed.volumeWeightRatio && processed.volumeWeightRatio > 0) {
      processed.volumeWeightRatio = Math.log(processed.volumeWeightRatio + 1);
    }

    return processed;
  }

  private normalizeFeature(value: number, min: number, max: number): number {
    return (value - min) / (max - min);
  }
}
