import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Load, LoadStatus } from '../../../entities/load.entity';
import { Truck, VehicleStatus } from '../../../entities/truck.entity';
import { Driver, DriverStatus } from '../../../entities/driver.entity';
import { Location } from '../../../entities/location.entity';
import { Trip, TripStatus } from '../../../entities/trip.entity';
import { MatchRequestDto } from '../dto/match-request.dto';
import { MatchResultDto } from '../dto/match-result.dto';

export interface MatchingScore {
  capacityScore: number;
  proximityScore: number;
  performanceScore: number;
  routeScore: number;
  fuelScore: number;
  timeScore: number;
  priceScore: number;
  overallScore: number;
}

export interface MatchingMetrics {
  totalMatches: number;
  averageScore: number;
  matchRate: number;
  responseTime: number;
  cacheHitRate: number;
  algorithmVersion: string;
}

export interface RouteOptimization {
  optimizedRoute: Location[];
  totalDistance: number;
  estimatedTime: number;
  fuelConsumption: number;
  costSavings: number;
}

export interface MLPrediction {
  successProbability: number;
  estimatedDeliveryTime: number;
  riskScore: number;
  recommendedPrice: number;
  confidence: number;
}

@Injectable()
export class AIMatchingEngineService {
  private readonly logger = new Logger(AIMatchingEngineService.name);
  private readonly cache = new Map<string, any>();
  private readonly metrics = {
    totalMatches: 0,
    averageScore: 0,
    matchRate: 0,
    responseTime: 0,
    cacheHitRate: 0,
    algorithmVersion: 'v2.0',
  };

  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
  ) {}

  /**
   * Main AI-powered matching algorithm
   */
  async findOptimalMatches(
    matchRequestDto: MatchRequestDto,
    tenantId: string,
    useABTest: boolean = false,
  ): Promise<MatchResultDto[]> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(matchRequestDto, tenantId);
      const cachedResult = this.cache.get(cacheKey);

      if (cachedResult && !useABTest) {
        this.metrics.cacheHitRate = this.metrics.cacheHitRate * 0.9 + 0.1;
        return cachedResult;
      }

      // Get load details with enhanced data
      const load = await this.getLoadWithDetails(
        matchRequestDto.loadId,
        tenantId,
      );
      if (!load) {
        throw new Error('Load not found');
      }

      // Get available trucks with performance data
      const availableTrucks =
        await this.getAvailableTrucksWithPerformance(tenantId);

      // Apply AI-powered matching algorithm
      const matches = await this.applyAIMatchingAlgorithm(
        load,
        availableTrucks,
        matchRequestDto,
        useABTest,
      );

      // Apply route optimization
      const optimizedMatches = await this.applyRouteOptimization(matches, load);

      // Apply ML predictions
      const enhancedMatches = await this.applyMLPredictions(
        optimizedMatches,
        load,
      );

      // Sort by overall score and apply limits
      enhancedMatches.sort((a, b) => b.overallScore - a.overallScore);
      const limitedMatches = enhancedMatches.slice(
        0,
        matchRequestDto.limit || 10,
      );

      // Cache results
      this.cache.set(cacheKey, limitedMatches);
      this.updateMetrics(startTime, limitedMatches.length);

      return limitedMatches;
    } catch (error) {
      this.logger.error('Error in AI matching algorithm:', error);
      throw error;
    }
  }

  /**
   * AI-powered matching algorithm with multiple scoring factors
   */
  private async applyAIMatchingAlgorithm(
    load: Load,
    trucks: Truck[],
    criteria: MatchRequestDto,
    useABTest: boolean,
  ): Promise<MatchResultDto[]> {
    const matches: MatchResultDto[] = [];
    const algorithmVersion = useABTest ? 'v2.1-beta' : 'v2.0';

    for (const truck of trucks) {
      // Basic capacity validation
      if (!this.validateCapacity(truck, load)) {
        continue;
      }

      // Calculate comprehensive scores
      const scores = await this.calculateComprehensiveScores(
        truck,
        load,
        criteria,
        algorithmVersion,
      );

      if (scores.overallScore >= 0.3) {
        // Minimum threshold
        const match = await this.createMatchResult(
          truck,
          load,
          scores,
          criteria,
        );
        matches.push(match);
      }
    }

    return matches;
  }

  /**
   * Calculate comprehensive matching scores
   */
  private async calculateComprehensiveScores(
    truck: Truck,
    load: Load,
    criteria: MatchRequestDto,
    algorithmVersion: string,
  ): Promise<MatchingScore> {
    const weights = this.getAlgorithmWeights(algorithmVersion);

    // Enhanced capacity scoring with cargo alignment
    const capacityScore = this.calculateEnhancedCapacityScore(truck, load);

    // Enhanced proximity scoring
    const proximityScore = await this.calculateEnhancedProximityScore(
      truck,
      load,
    );

    // Enhanced performance scoring
    const performanceScore = await this.calculateEnhancedPerformanceScore(
      truck,
      load,
    );

    // Enhanced route scoring
    const routeScore = await this.calculateEnhancedRouteScore(truck, load);

    // Enhanced fuel efficiency scoring
    const fuelScore = this.calculateEnhancedFuelEfficiencyScore(truck, load);

    // Enhanced time scoring
    const timeScore = this.calculateEnhancedTimeScore(truck, load, criteria);

    // Enhanced price scoring
    const priceScore = await this.calculateEnhancedPriceScore(
      truck,
      load,
      criteria,
    );

    // Calculate overall score with enhanced weights
    const overallScore =
      capacityScore * weights.capacity +
      proximityScore * weights.proximity +
      performanceScore * weights.performance +
      routeScore * weights.route +
      fuelScore * weights.fuel +
      timeScore * weights.time +
      priceScore * weights.price;

    return {
      capacityScore,
      proximityScore,
      performanceScore,
      routeScore,
      fuelScore,
      timeScore,
      priceScore,
      overallScore,
    };
  }

  private calculateEnhancedCapacityScore(truck: Truck, load: Load): number {
    let score = 0;
    const maxScore = 100;

    // Basic capacity matching
    if (truck.capacityWeight >= load.weight) {
      score += 30;
    }

    if (truck.capacityVolume >= (load.volume || 0)) {
      score += 20;
    }

    // Enhanced cargo alignment scoring
    if (truck.cargoCapabilities) {
      // Cargo type compatibility
      if (
        truck.cargoCapabilities.supportedCargoTypes?.includes(load.cargoType)
      ) {
        score += 15;
      }

      // Special handling requirements
      if (load.isFragile && truck.cargoCapabilities.maxFragileHandling) {
        score += 10;
      }

      if (load.isHazardous && truck.cargoCapabilities.maxHazardousHandling) {
        score += 10;
      }

      if (
        load.requiresRefrigeration &&
        truck.cargoCapabilities.maxRefrigeratedHandling
      ) {
        score += 10;
      }

      // Temperature range compatibility
      if (
        truck.cargoCapabilities.temperatureRange &&
        load.temperatureMin &&
        load.temperatureMax
      ) {
        const truckMin = truck.cargoCapabilities.temperatureRange.min;
        const truckMax = truck.cargoCapabilities.temperatureRange.max;

        if (
          truckMin <= load.temperatureMin &&
          truckMax >= load.temperatureMax
        ) {
          score += 10;
        }
      }

      // Dimensional compatibility
      if (
        load.length &&
        truck.cargoCapabilities.maxLengthCapacity &&
        load.length <= truck.cargoCapabilities.maxLengthCapacity
      ) {
        score += 5;
      }

      if (
        load.width &&
        truck.cargoCapabilities.maxWidthCapacity &&
        load.width <= truck.cargoCapabilities.maxWidthCapacity
      ) {
        score += 5;
      }

      if (
        load.height &&
        truck.cargoCapabilities.maxHeightCapacity &&
        load.height <= truck.cargoCapabilities.maxHeightCapacity
      ) {
        score += 5;
      }

      // Humidity control requirement
      if (
        load.requiresHumidityControl &&
        truck.cargoCapabilities.humidityControl
      ) {
        score += 5;
      }
    }

    // Loading/unloading requirements
    if (truck.loadingCapabilities) {
      if (load.requiresForklift && truck.loadingCapabilities.hasForklift) {
        score += 5;
      }

      if (load.requiresCrane && truck.loadingCapabilities.hasCrane) {
        score += 5;
      }

      if (
        load.requiresLoadingDock &&
        truck.loadingCapabilities.hasLoadingDock
      ) {
        score += 5;
      }
    }

    // Security and monitoring requirements
    if (truck.securityFeatures) {
      if (load.requiresGpsMonitoring && truck.securityFeatures.hasGps) {
        score += 5;
      }

      if (
        load.requiresTemperatureMonitoring &&
        truck.securityFeatures.hasTemperatureAlerts
      ) {
        score += 5;
      }
    }

    return Math.min(score, maxScore);
  }

  /**
   * Geographic proximity scoring with real distance calculation
   */
  private async calculateProximityScore(
    truck: Truck,
    load: Load,
  ): Promise<number> {
    const truckLocation = await this.getTruckCurrentLocation(truck.id);
    const pickupLocation = load.pickupLocation;

    if (!truckLocation || !pickupLocation) {
      return 0.5; // Default score if location data unavailable
    }

    const [truckLat, truckLon] = this.extractLatLon(truckLocation.coordinates);
    const [pickupLat, pickupLon] = this.extractLatLon(
      pickupLocation.locationData.coordinates,
    );

    const distance = this.calculateHaversineDistance(
      truckLat,
      truckLon,
      pickupLat,
      pickupLon,
    );

    // Score decreases with distance (max 500km for full score)
    return Math.max(0, 1 - distance / 500);
  }

  private async calculateEnhancedProximityScore(
    truck: Truck,
    load: Load,
  ): Promise<number> {
    const distance = await this.calculateDistance(truck, load);

    // Base proximity score
    let score = Math.max(0, 100 - distance * 0.1);

    // Enhanced route capability scoring
    if (truck.routeCapabilities) {
      // Distance limitations
      if (
        truck.routeCapabilities.maxDistance &&
        distance > truck.routeCapabilities.maxDistance
      ) {
        score *= 0.5; // Penalty for exceeding max distance
      }

      // Route type compatibility
      const isUrbanRoute = this.isUrbanRouteFromLoadLocation(
        load.pickupLocation,
        load.deliveryLocation,
      );
      if (isUrbanRoute && truck.routeCapabilities.supportsUrbanRoutes) {
        score += 10;
      }

      // Terrain difficulty
      const terrainDifficulty = this.calculateTerrainDifficultyFromLoadLocation(
        load.pickupLocation,
        load.deliveryLocation,
      );
      if (
        truck.routeCapabilities.maxTerrainDifficulty &&
        terrainDifficulty <= truck.routeCapabilities.maxTerrainDifficulty
      ) {
        score += 5;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Driver performance scoring based on historical data
   */
  private async calculatePerformanceScore(
    truck: Truck,
    load: Load,
  ): Promise<number> {
    const driver = await this.driverRepository.findOne({
      where: { id: truck.currentDriverId },
    });

    if (!driver) {
      return 0.5; // Default score for trucks without drivers
    }

    // Get driver's recent performance metrics
    const recentTrips = await this.tripRepository.find({
      where: { driverId: driver.id },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    if (recentTrips.length === 0) {
      return driver.rating / 5; // Use driver rating if no trip history
    }

    // Calculate performance metrics
    const onTimeDeliveries = recentTrips.filter(
      (trip) =>
        trip.status === TripStatus.COMPLETED &&
        trip.onTimePerformance !== false,
    ).length;

    const completionRate = onTimeDeliveries / recentTrips.length;
    const averageRating =
      recentTrips.reduce((sum, trip) => sum + (trip.driverRating || 0), 0) /
      recentTrips.length;
    // No safetyIncidents property, so use default
    const safetyScore = 1; // Placeholder, or use another available metric

    return completionRate * 0.4 + (averageRating / 5) * 0.4 + safetyScore * 0.2;
  }

  private async calculateEnhancedPerformanceScore(
    truck: Truck,
    load: Load,
  ): Promise<number> {
    let score = 50; // Base score

    // Enhanced performance metrics
    if (truck.averageRating > 0) {
      score += truck.averageRating * 20;
    }

    if (truck.totalTrips > 0) {
      score += Math.min(truck.totalTrips / 100, 20);
    }

    // Enhanced security features scoring
    if (truck.securityFeatures) {
      const securityFeatures = Object.values(truck.securityFeatures).filter(
        Boolean,
      ).length;
      score += Math.min(securityFeatures * 2, 20);
    }

    // Enhanced certifications scoring
    if (truck.certifications) {
      const certifications = Object.values(truck.certifications).filter(
        Boolean,
      ).length;
      score += Math.min(certifications * 3, 15);
    }

    return Math.min(score, 100);
  }

  /**
   * Route complexity scoring
   */
  private async calculateRouteScore(truck: Truck, load: Load): Promise<number> {
    const pickupLocation = load.pickupLocation;
    const deliveryLocation = load.deliveryLocation;

    if (!pickupLocation || !deliveryLocation) {
      return Promise.resolve(0.5);
    }

    const [pickupLat, pickupLon] = this.extractLatLon(
      pickupLocation.locationData.coordinates,
    );
    const [deliveryLat, deliveryLon] = this.extractLatLon(
      deliveryLocation.locationData.coordinates,
    );

    const distance = this.calculateHaversineDistance(
      pickupLat,
      pickupLon,
      deliveryLat,
      deliveryLon,
    );

    // Route complexity factors (simplified since we're using LoadLocation objects)
    const isUrbanRoute = false; // Simplified for now
    const hasTollRoads = false; // Simplified for now
    const terrainDifficulty = 0.5; // Simplified for now

    let routeScore = 1.0;

    // Penalize complex routes
    if (isUrbanRoute) routeScore *= 0.9;
    if (hasTollRoads) routeScore *= 0.95;
    if (terrainDifficulty > 0.7) routeScore *= 0.8;

    // Bonus for optimal distance range (100-500km)
    if (distance >= 100 && distance <= 500) {
      routeScore *= 1.1;
    }

    return Promise.resolve(Math.min(1.0, routeScore));
  }

  private async calculateEnhancedRouteScore(
    truck: Truck,
    load: Load,
  ): Promise<number> {
    const pickupLocation = load.pickupLocation;
    const deliveryLocation = load.deliveryLocation;

    if (!pickupLocation || !deliveryLocation) {
      return Promise.resolve(0.5);
    }

    const [pickupLat, pickupLon] = this.extractLatLon(
      pickupLocation.locationData.coordinates,
    );
    const [deliveryLat, deliveryLon] = this.extractLatLon(
      deliveryLocation.locationData.coordinates,
    );

    const distance = this.calculateHaversineDistance(
      pickupLat,
      pickupLon,
      deliveryLat,
      deliveryLon,
    );

    // Route complexity factors (simplified since we're using LoadLocation objects)
    const isUrbanRoute = this.isUrbanRouteFromLoadLocation(
      pickupLocation,
      deliveryLocation,
    );
    const hasTollRoads = this.hasTollRoadsFromLoadLocation(
      pickupLocation,
      deliveryLocation,
    );
    const terrainDifficulty = this.calculateTerrainDifficultyFromLoadLocation(
      pickupLocation,
      deliveryLocation,
    );

    let routeScore = 1.0;

    // Penalize complex routes
    if (isUrbanRoute) routeScore *= 0.9;
    if (hasTollRoads) routeScore *= 0.95;
    if (terrainDifficulty > 0.7) routeScore *= 0.8;

    // Bonus for optimal distance range (100-500km)
    if (distance >= 100 && distance <= 500) {
      routeScore *= 1.1;
    }

    return Promise.resolve(Math.min(1.0, routeScore));
  }

  /**
   * Fuel efficiency scoring
   */
  private calculateFuelEfficiencyScore(truck: Truck, load: Load): number {
    const baseFuelEfficiency = truck.fuelEfficiency || 6.5; // L/100km
    const loadWeightFactor = load.weight / 1000; // tons

    // Fuel efficiency decreases with weight
    const adjustedEfficiency =
      baseFuelEfficiency * (1 + loadWeightFactor * 0.1);

    // Score based on efficiency (lower is better)
    const maxEfficiency = 8.0; // L/100km
    return Math.max(0, 1 - adjustedEfficiency / maxEfficiency);
  }

  private calculateEnhancedFuelEfficiencyScore(
    truck: Truck,
    load: Load,
  ): number {
    const baseFuelEfficiency = truck.fuelEfficiency || 6.5; // L/100km
    const loadWeightFactor = load.weight / 1000; // tons

    // Fuel efficiency decreases with weight
    const adjustedEfficiency =
      baseFuelEfficiency * (1 + loadWeightFactor * 0.1);

    // Score based on efficiency (lower is better)
    const maxEfficiency = 8.0; // L/100km
    return Math.max(0, 1 - adjustedEfficiency / maxEfficiency);
  }

  /**
   * Delivery time scoring
   */
  private calculateTimeScore(
    truck: Truck,
    load: Load,
    criteria: MatchRequestDto,
  ): number {
    // No requiredDeliveryTime on Load, so use deliveryDate
    const requiredDeliveryTime = load.deliveryDate;
    const currentTime = new Date();

    if (!requiredDeliveryTime) {
      return 0.8; // Default score if no time requirement
    }

    const timeUntilDeadline =
      requiredDeliveryTime.getTime() - currentTime.getTime();
    const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60);

    // Score based on time urgency
    if (hoursUntilDeadline < 24) {
      return 0.3; // Very urgent
    } else if (hoursUntilDeadline < 72) {
      return 0.6; // Urgent
    } else if (hoursUntilDeadline < 168) {
      return 0.8; // Normal
    } else {
      return 1.0; // Flexible
    }
  }

  private calculateEnhancedTimeScore(
    truck: Truck,
    load: Load,
    criteria: MatchRequestDto,
  ): number {
    // No requiredDeliveryTime on Load, so use deliveryDate
    const requiredDeliveryTime = load.deliveryDate;
    const currentTime = new Date();

    if (!requiredDeliveryTime) {
      return 0.8; // Default score if no time requirement
    }

    const timeUntilDeadline =
      requiredDeliveryTime.getTime() - currentTime.getTime();
    const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60);

    // Score based on time urgency
    if (hoursUntilDeadline < 24) {
      return 0.3; // Very urgent
    } else if (hoursUntilDeadline < 72) {
      return 0.6; // Urgent
    } else if (hoursUntilDeadline < 168) {
      return 0.8; // Normal
    } else {
      return 1.0; // Flexible
    }
  }

  /**
   * Price competitiveness scoring
   */
  private async calculatePriceScore(
    truck: Truck,
    load: Load,
    criteria: MatchRequestDto,
  ): Promise<number> {
    const marketRate = await this.getMarketRate(load);
    // No hourlyRate on Truck, use marketRate only
    const truckRate = marketRate;

    if (!marketRate) {
      return 0.5; // Default score if no market data
    }

    const priceRatio = truckRate / marketRate;

    // Optimal price range is 0.9-1.1 of market rate
    if (priceRatio >= 0.9 && priceRatio <= 1.1) {
      return 1.0;
    } else if (priceRatio < 0.9) {
      return 0.8; // Slightly underpriced
    } else {
      return Math.max(0, 1 - (priceRatio - 1.1) * 2); // Penalize overpricing
    }
  }

  private async calculateEnhancedPriceScore(
    truck: Truck,
    load: Load,
    criteria: MatchRequestDto,
  ): Promise<number> {
    const marketRate = await this.getMarketRate(load);
    // No hourlyRate on Truck, use marketRate only
    const truckRate = marketRate;

    if (!marketRate) {
      return 0.5; // Default score if no market data
    }

    const priceRatio = truckRate / marketRate;

    // Optimal price range is 0.9-1.1 of market rate
    if (priceRatio >= 0.9 && priceRatio <= 1.1) {
      return 1.0;
    } else if (priceRatio < 0.9) {
      return 0.8; // Slightly underpriced
    } else {
      return Math.max(0, 1 - (priceRatio - 1.1) * 2); // Penalize overpricing
    }
  }

  /**
   * Route optimization using advanced algorithms
   */
  private async applyRouteOptimization(
    matches: MatchResultDto[],
    load: Load,
  ): Promise<MatchResultDto[]> {
    for (const match of matches) {
      const optimization = await this.optimizeRoute(match, load);
      if (optimization) {
        // Remove assignments to optimizedRoute and totalDistance
        // match.optimizedRoute = optimization.optimizedRoute;
        // match.totalDistance = optimization.totalDistance;
        // match.estimatedTime = optimization.estimatedTime;
        // match.fuelConsumption = optimization.fuelConsumption;
        // match.costSavings = optimization.costSavings;
        // Adjust score based on optimization results
        match.overallScore *= 1 + optimization.costSavings * 0.1;
      }
    }
    return matches;
  }

  /**
   * Machine learning model inference
   */
  private async applyMLPredictions(
    matches: MatchResultDto[],
    load: Load,
  ): Promise<MatchResultDto[]> {
    for (const match of matches) {
      const prediction = await this.runMLInference(match, load);

      if (prediction) {
        match.successProbability = prediction.successProbability;
        match.estimatedDeliveryTime = prediction.estimatedDeliveryTime;
        match.riskScore = prediction.riskScore;
        match.recommendedPrice = prediction.recommendedPrice;
        match.confidence = prediction.confidence;

        // Adjust score based on ML predictions
        match.overallScore *=
          prediction.successProbability * 0.3 +
          (1 - prediction.riskScore) * 0.2 +
          0.5;
      }
    }

    return matches;
  }

  /**
   * A/B Testing framework
   */
  async runABTest(
    matchRequestDto: MatchRequestDto,
    tenantId: string,
    testGroup: 'A' | 'B' = 'A',
  ): Promise<{ matches: MatchResultDto[]; testGroup: string; metrics: any }> {
    const useABTest = testGroup === 'B';
    const matches = await this.findOptimalMatches(
      matchRequestDto,
      tenantId,
      useABTest,
    );

    return {
      matches,
      testGroup,
      metrics: {
        algorithmVersion: useABTest ? 'v2.1-beta' : 'v2.0',
        matchCount: matches.length,
        averageScore:
          matches.reduce((sum, m) => sum + m.overallScore, 0) / matches.length,
        responseTime: this.metrics.responseTime,
      },
    };
  }

  /**
   * Get matching metrics and performance data
   */
  getMatchingMetrics(): MatchingMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear cache for performance management
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Matching cache cleared');
  }

  /**
   * Helper methods
   */
  private generateCacheKey(
    matchRequestDto: MatchRequestDto,
    tenantId: string,
  ): string {
    return `match_${tenantId}_${matchRequestDto.loadId}_${JSON.stringify(matchRequestDto)}`;
  }

  private updateMetrics(startTime: number, matchCount: number): void {
    const responseTime = Date.now() - startTime;
    this.metrics.totalMatches += matchCount;
    this.metrics.responseTime =
      this.metrics.responseTime * 0.9 + responseTime * 0.1;
  }

  private getAlgorithmWeights(version: string): any {
    if (version === 'v2.1-beta') {
      return {
        capacity: 0.2,
        proximity: 0.2,
        performance: 0.15,
        route: 0.15,
        fuel: 0.1,
        time: 0.1,
        price: 0.1,
      };
    }

    return {
      capacity: 0.25,
      proximity: 0.25,
      performance: 0.15,
      route: 0.15,
      fuel: 0.05,
      time: 0.1,
      price: 0.05,
    };
  }

  private validateCapacity(truck: Truck, load: Load): boolean {
    return (
      load.weight <= truck.capacityWeight && load.volume <= truck.capacityVolume
    );
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private async getLoadWithDetails(
    loadId: string,
    tenantId: string,
  ): Promise<Load | null> {
    return this.loadRepository.findOne({
      where: { id: loadId, tenantId },
      relations: ['pickupLocation', 'deliveryLocation'],
    });
  }

  private async getAvailableTrucksWithPerformance(
    tenantId: string,
  ): Promise<Truck[]> {
    return this.truckRepository.find({
      where: {
        tenantId,
        status: VehicleStatus.AVAILABLE,
        isActive: true,
      },
      relations: ['owner'],
    });
  }

  private async getTruckCurrentLocation(
    truckId: string,
  ): Promise<Location | null> {
    // In real implementation, get from GPS tracking service
    return this.locationRepository.findOne({
      where: { id: truckId },
    });
  }

  private async createMatchResult(
    truck: Truck,
    load: Load,
    scores: MatchingScore,
    criteria: MatchRequestDto,
  ): Promise<MatchResultDto> {
    const distance = await this.calculateDistance(truck, load);
    const estimatedCost = this.estimateCost(distance, load.weight);
    const estimatedRevenue =
      load.offeredPrice || this.estimateRevenue(distance, load.weight);

    return {
      truckId: truck.id,
      loadId: load.id,
      overallScore: scores.overallScore,
      capacityScore: scores.capacityScore,
      distanceScore: scores.proximityScore,
      equipmentScore: scores.fuelScore, // Map as appropriate
      gpsTrackingScore: truck.hasGps ? 0.8 : 0.2, // GPS tracking score
      availabilityScore: 1.0, // Assume available
      routeScore: 0.5, // NEW: Neutral route score (AI engine doesn't use route matching yet)
      ratingScore: scores.performanceScore,
      priceScore: scores.priceScore,
      distanceKm: distance,
      estimatedCost,
      estimatedRevenue,
      profitMargin: (estimatedRevenue - estimatedCost) / estimatedRevenue,
      truckMake: truck.make,
      truckModel: truck.model,
      plateNumber: truck.plateNumber,
      capacityWeight: truck.capacityWeight,
      capacityVolume: truck.capacityVolume,
      truckRating: truck.averageRating,
      hasRefrigeration: truck.hasRefrigeration,
      hasLiftGate: truck.hasLiftGate,
      hasHazmatPermit: truck.hasHazmatPermit,
      matchReason: this.generateMatchReason(truck, load, scores.overallScore),
    };
  }

  private async calculateDistance(truck: Truck, load: Load): Promise<number> {
    const truckLocation = await this.getTruckCurrentLocation(truck.id);
    const pickupLocation = load.pickupLocation;

    if (!truckLocation || !pickupLocation) {
      return 100; // Default distance
    }

    return this.calculateHaversineDistance(
      truckLocation.latitude,
      truckLocation.longitude,
      pickupLocation.locationData.coordinates.latitude,
      pickupLocation.locationData.coordinates.longitude,
    );
  }

  private estimateCost(distanceKm: number, weightKg: number): number {
    const fuelCost = distanceKm * 0.15;
    const laborCost = distanceKm * 0.1;
    const maintenanceCost = distanceKm * 0.05;
    const weightFactor = weightKg / 1000;
    return (fuelCost + laborCost + maintenanceCost) * weightFactor;
  }

  private estimateRevenue(distanceKm: number, weightKg: number): number {
    const baseRate = 2.5;
    const weightFactor = weightKg / 1000;
    return distanceKm * baseRate * weightFactor;
  }

  private generateMatchReason(truck: Truck, load: Load, score: number): string {
    const reasons: string[] = [];

    if (score > 0.8) reasons.push('Excellent match');
    else if (score > 0.6) reasons.push('Good match');
    else reasons.push('Acceptable match');

    if (load.weight <= truck.capacityWeight * 0.8) {
      reasons.push('Optimal capacity utilization');
    }

    if (truck.hasRefrigeration && load.requiresRefrigeration) {
      reasons.push('Refrigeration available');
    }

    if (truck.hasHazmatPermit && load.isHazardous) {
      reasons.push('Hazmat certified');
    }

    if (truck.averageRating >= 4.0) {
      reasons.push('High-rated truck');
    }

    return reasons.join(', ');
  }

  // Placeholder methods for advanced features
  private isUrbanRoute(pickup: Location, delivery: Location): boolean {
    // Implement urban route detection logic
    return Math.random() > 0.5;
  }

  private hasTollRoads(pickup: Location, delivery: Location): boolean {
    // Implement toll road detection logic
    return Math.random() > 0.7;
  }

  private calculateTerrainDifficulty(
    pickup: Location,
    delivery: Location,
  ): number {
    // Implement terrain difficulty calculation
    return Math.random();
  }

  private async getMarketRate(load: Load): Promise<number> {
    // Implement market rate calculation
    return 2.5;
  }

  private async optimizeRoute(
    match: MatchResultDto,
    load: Load,
  ): Promise<RouteOptimization | null> {
    // Implement route optimization algorithm
    return {
      optimizedRoute: [], // Note: LoadLocation objects are not compatible with Location interface
      totalDistance: match.distanceKm,
      estimatedTime: match.distanceKm / 60, // hours
      fuelConsumption: match.distanceKm * 0.15,
      costSavings: 0.05,
    };
  }

  private async runMLInference(
    match: MatchResultDto,
    load: Load,
  ): Promise<MLPrediction | null> {
    // Implement ML model inference
    return {
      successProbability: 0.85 + match.overallScore * 0.1,
      estimatedDeliveryTime: match.distanceKm / 60,
      riskScore: 1 - match.overallScore,
      recommendedPrice: match.estimatedRevenue * 1.1,
      confidence: 0.8,
    };
  }

  private extractLatLon(geometry: any): [number, number] {
    // Assumes GeoJSON Point: { type: 'Point', coordinates: [lon, lat] }
    if (
      geometry &&
      geometry.type === 'Point' &&
      Array.isArray(geometry.coordinates)
    ) {
      return [geometry.coordinates[1], geometry.coordinates[0]];
    }
    return [0, 0];
  }

  // Helper methods to handle LoadLocation objects
  private isUrbanRouteFromLoadLocation(pickup: any, delivery: any): boolean {
    // Simplified urban route detection based on coordinates
    if (
      !pickup?.locationData?.coordinates ||
      !delivery?.locationData?.coordinates
    ) {
      return false;
    }

    const pickupLat = pickup.locationData.coordinates.latitude;
    const pickupLon = pickup.locationData.coordinates.longitude;
    const deliveryLat = delivery.locationData.coordinates.latitude;
    const deliveryLon = delivery.locationData.coordinates.longitude;

    // Simple heuristic: if both locations are in major city areas
    const isPickupUrban = this.isInUrbanArea(pickupLat, pickupLon);
    const isDeliveryUrban = this.isInUrbanArea(deliveryLat, deliveryLon);

    return isPickupUrban || isDeliveryUrban;
  }

  private hasTollRoadsFromLoadLocation(pickup: any, delivery: any): boolean {
    // Simplified toll road detection
    if (
      !pickup?.locationData?.coordinates ||
      !delivery?.locationData?.coordinates
    ) {
      return false;
    }

    const distance = this.calculateHaversineDistance(
      pickup.locationData.coordinates.latitude,
      pickup.locationData.coordinates.longitude,
      delivery.locationData.coordinates.latitude,
      delivery.locationData.coordinates.longitude,
    );

    // Assume toll roads for longer distances
    return distance > 200; // km
  }

  private calculateTerrainDifficultyFromLoadLocation(
    pickup: any,
    delivery: any,
  ): number {
    // Simplified terrain difficulty calculation
    if (
      !pickup?.locationData?.coordinates ||
      !delivery?.locationData?.coordinates
    ) {
      return 0.5;
    }

    const pickupLat = pickup.locationData.coordinates.latitude;
    const deliveryLat = delivery.locationData.coordinates.latitude;

    // Simple heuristic based on latitude (mountainous areas)
    const avgLat = (pickupLat + deliveryLat) / 2;

    // Higher difficulty for northern/southern latitudes (mountainous areas)
    if (Math.abs(avgLat) > 45) {
      return 0.8;
    } else if (Math.abs(avgLat) > 35) {
      return 0.6;
    } else {
      return 0.3;
    }
  }

  private isInUrbanArea(lat: number, lon: number): boolean {
    // Simplified urban area detection
    // This would typically use a geospatial database or API
    // For now, use a simple heuristic based on common urban coordinates

    // Major US cities (simplified)
    const urbanAreas = [
      { lat: 40.7128, lon: -74.006, radius: 50 }, // NYC
      { lat: 34.0522, lon: -118.2437, radius: 50 }, // LA
      { lat: 41.8781, lon: -87.6298, radius: 50 }, // Chicago
      { lat: 29.7604, lon: -95.3698, radius: 50 }, // Houston
      { lat: 33.4484, lon: -112.074, radius: 50 }, // Phoenix
    ];

    for (const area of urbanAreas) {
      const distance = this.calculateHaversineDistance(
        lat,
        lon,
        area.lat,
        area.lon,
      );
      if (distance <= area.radius) {
        return true;
      }
    }

    return false;
  }
}
