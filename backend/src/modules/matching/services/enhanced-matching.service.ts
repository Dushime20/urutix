import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Load } from '../../../entities/load.entity';
import { Truck } from '../../../entities/truck.entity';
import { Driver } from '../../../entities/driver.entity';
import { Location } from '../../../entities/location.entity';
import { MatchRequestDto } from '../dto/match-request.dto';
import { EnhancedMatchResult } from '../dto/enhanced-match-result.dto';
import { RateLimiterService } from './rate-limiter.service';
import { CacheService } from './cache.service';
import { MarketIntelligenceService } from './market-intelligence.service';
import { MLPredictionService } from './ml-prediction.service';

// Helper to extract lat/lon from geometry/GeoJSON
interface PointCoordinates {
  latitude: number;
  longitude: number;
}

function isGeoJSONPoint(
  obj: any,
): obj is { type: string; coordinates: [number, number] } {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.type === 'Point' &&
    Array.isArray(obj.coordinates)
  );
}

export function extractPointCoordinates(
  geom: any,
): PointCoordinates | undefined {
  if (!geom) return undefined;
  const raw = geom;
  if (isGeoJSONPoint(raw)) {
    return { latitude: raw.coordinates[1], longitude: raw.coordinates[0] };
  }
  const coords = raw.coordinates || raw;
  if (Array.isArray(coords) && coords.length === 2) {
    return { latitude: coords[1], longitude: coords[0] };
  }
  return undefined;
}

@Injectable()
export class EnhancedMatchingService {
  private readonly logger = new Logger(EnhancedMatchingService.name);

  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    private readonly rateLimiter: RateLimiterService,
    private readonly cacheService: CacheService,
    private readonly marketIntelligence: MarketIntelligenceService,
    private readonly mlPrediction: MLPredictionService,
  ) {}

  async findEnhancedMatches(
    matchRequestDto: MatchRequestDto,
    tenantId: string,
  ): Promise<EnhancedMatchResult[]> {
    const startTime = Date.now();
    try {
      const sanitizedRequest = this.sanitizeInput(matchRequestDto);
      await this.rateLimiter.checkLimit(tenantId);

      const cacheKey = this.generateCacheKey(sanitizedRequest, tenantId);
      const cached = await this.cacheService.get(cacheKey);
      if (cached && !sanitizedRequest.includeDetailedScoring) {
        this.logger.log(`Cache hit for matching request: ${cacheKey}`);
        return cached as EnhancedMatchResult[];
      }

      const load = await this.getLoadWithDetails(
        sanitizedRequest.loadId,
        tenantId,
      );
      if (!load) {
        throw new BadRequestException('Load not found or access denied');
      }

      const marketContext =
        await this.marketIntelligence.getCurrentConditions(tenantId);
      const trucks = await this.getAvailableTrucksWithPerformance(
        load,
        sanitizedRequest,
        tenantId,
      );
      if (trucks.length === 0) {
        this.logger.warn(`No available trucks found for load: ${load.id}`);
        return [];
      }

      const matches = await this.applyEnhancedMatchingAlgorithm(
        load,
        trucks,
        sanitizedRequest,
        marketContext,
      );
      const enriched = await this.enrichMatches(
        matches,
        load,
        sanitizedRequest,
        marketContext,
      );
      const sorted = this.sortAndLimitMatches(enriched, sanitizedRequest);

      await this.cacheService.set(cacheKey, sorted, 300);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `Enhanced matching completed in ${processingTime}ms for ${sorted.length} matches`,
      );
      return sorted;
    } catch (error: any) {
      this.logger.error(
        `Enhanced matching failed: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Matching service temporarily unavailable. Please try again later.',
      );
    }
  }

  private sanitizeInput(request: MatchRequestDto): MatchRequestDto {
    const sanitized = { ...request };
    if (sanitized.maxDistance)
      sanitized.maxDistance = Math.max(
        0,
        Math.min(10000, sanitized.maxDistance),
      );
    if (sanitized.minRating)
      sanitized.minRating = Math.max(0, Math.min(1, sanitized.minRating));
    if (sanitized.limit)
      sanitized.limit = Math.max(1, Math.min(100, sanitized.limit));
    if (sanitized.preferredTruckType)
      sanitized.preferredTruckType = sanitized.preferredTruckType
        .trim()
        .toUpperCase();
    return sanitized;
  }

  private generateCacheKey(request: MatchRequestDto, tenantId: string): string {
    const keyParts = [
      tenantId,
      request.loadId,
      request.algorithm || 'DEFAULT',
      request.limit || 10,
      request.maxDistance || 'UNLIMITED',
      request.minRating || 'ANY',
    ];
    return `enhanced_matching:${keyParts.join(':')}`;
  }

  private async getLoadWithDetails(
    loadId: string,
    tenantId: string,
  ): Promise<Load | null> {
    return this.loadRepository
      .createQueryBuilder('load')
      .leftJoinAndSelect('load.cargoOwner', 'cargoOwner')
      .where('load.id = :loadId', { loadId })
      .andWhere('load.tenantId = :tenantId', { tenantId })
      .andWhere('load.status IN (:...statuses)', {
        statuses: ['CREATED', 'PUBLISHED'],
      })
      .cache(true)
      .getOne();
  }

  private async getAvailableTrucksWithPerformance(
    load: Load,
    request: MatchRequestDto,
    tenantId: string,
  ): Promise<Truck[]> {
    const query = this.truckRepository
      .createQueryBuilder('truck')
      .where('truck.tenantId = :tenantId', { tenantId })
      .andWhere('truck.status = :status', { status: 'AVAILABLE' })
      .andWhere('truck.capacityWeight >= :minWeight', {
        minWeight: load.weight,
      })
      .cache(true);

    if (request.maxDistance) {
      const pickupLocation = load.locations?.find(
        (loc) => loc.type === 'PICKUP',
      );
      if (pickupLocation?.locationData?.coordinates) {
        query.andWhere(
          'ST_DistanceSphere(truck.currentLocation, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)) <= :maxDistance',
          {
            lon: pickupLocation.locationData.coordinates.longitude,
            lat: pickupLocation.locationData.coordinates.latitude,
            maxDistance: request.maxDistance * 1000,
          },
        );
      }
    }

    if (request.preferredTruckType) {
      query.andWhere('truck.truckType = :truckType', {
        truckType: request.preferredTruckType,
      });
    }

    if (request.maxTruckAge) {
      const maxYear = new Date().getFullYear() - request.maxTruckAge;
      query.andWhere('truck.year >= :maxYear', { maxYear });
    }

    return query.getMany();
  }

  private async applyEnhancedMatchingAlgorithm(
    load: Load,
    trucks: Truck[],
    request: MatchRequestDto,
    marketContext: any,
  ): Promise<EnhancedMatchResult[]> {
    const matches: EnhancedMatchResult[] = [];
    for (const truck of trucks) {
      try {
        const s = await this.calculateEnhancedMatchScore(
          truck,
          load,
          request,
          marketContext,
        );
        if (s.overallScore >= (request.minCompatibilityScore || 0.3)) {
           matches.push({
            truckId: truck.id,
            loadId: load.id,
            overallScore: s.overallScore,
            capacityScore: s.capacityScore,
            distanceScore: s.proximityScore,
            equipmentScore: s.equipmentCompatibilityScore || 0,
            gpsTrackingScore: truck.hasGps || truck.securityFeatures?.hasGps ? 0.8 : 0.2, // NEW
            availabilityScore: 1.0, // NEW: Assume available
            ratingScore: truck.averageRating || 0,
            priceScore: s.priceScore,
            distanceKm: s.distance,
            estimatedCost: s.estimatedCost,
            estimatedRevenue: s.estimatedCost * 1.2,
            profitMargin: 0.2,
            truckMake: truck.make,
            truckModel: truck.model,
            plateNumber: truck.plateNumber,
            capacityWeight: truck.capacityWeight,
            capacityVolume: truck.capacityVolume,
            truckRating: truck.averageRating || 0,
            hasRefrigeration: truck.hasRefrigeration || false,
            hasLiftGate: truck.hasLiftGate || false,
            hasHazmatPermit: truck.hasHazmatPermit || false,
            driverId: truck.currentDriverId,
            matchReason: `High compatibility score: ${s.overallScore.toFixed(2)}`,
            proximityScore: s.proximityScore,
            performanceScore: s.performanceScore,
            routeScore: s.routeScore,
            fuelScore: s.fuelScore,
            timeScore: s.timeScore,
            seasonalScore: s.seasonalScore || 0,
            driverPerformanceScore: s.driverPerformanceScore || 0,
            equipmentCompatibilityScore: s.equipmentCompatibilityScore || 0,
            marketContext: {
              averageCost: marketContext?.averageCost || 0,
              costPercentile: 50,
              availabilityPercentile: 75,
              qualityPercentile: 80,
              marketBalance: 'Balanced',
            },
            environmentalImpact: {
              co2Emissions: s.co2Emissions || 0,
              fuelConsumption: s.fuelConsumption || 0,
              ecoScore: s.ecoScore || 0,
            },
            riskAssessment: {
              equipmentRisk: 0.1,
              capacityRisk: 0.05,
              ratingRisk: 0.1,
              availabilityRisk: 0.05,
              costRisk: 0.1,
              totalRisk: 0.4,
            },
            successProbability: s.successProbability || 0.8,
            alternativeMatches: [],
          });
        }
      } catch (e: any) {
        this.logger.warn(
          `Failed to calculate match score for truck ${truck.id}: ${e.message}`,
        );
        continue;
      }
    }
    return matches;
  }

  private async calculateEnhancedMatchScore(
    truck: Truck,
    load: Load,
    request: MatchRequestDto,
    marketContext: any,
  ): Promise<any> {
    const weights = this.getDynamicWeights(load, marketContext);
    const capacityScore = this.calculateCapacityScore(truck, load);
    const proximityScore = await this.calculateProximityScore(truck, load);
    const performanceScore = await this.calculatePerformanceScore(truck, load);
    const routeScore = await this.calculateRouteScore(truck, load);
    const fuelScore = this.calculateFuelScore(truck, load);
    const timeScore = this.calculateTimeScore(truck, load, request);
    const priceScore = await this.calculatePriceScore(
      truck,
      load,
      marketContext,
    );

    const overallScore =
      capacityScore * weights.capacity +
      proximityScore * weights.proximity +
      performanceScore * weights.performance +
      routeScore * weights.route +
      fuelScore * weights.fuel +
      timeScore * weights.time +
      priceScore * weights.price;

    const seasonalScore = this.calculateSeasonalDemandScore(load);
    const driverPerformanceScore = this.calculateDriverPerformanceScore(truck);
    const equipmentCompatibilityScore =
      this.calculateEquipmentCompatibilityScore(truck, load);
    const enhancedOverallScore =
      overallScore * 0.8 +
      seasonalScore * 0.1 +
      driverPerformanceScore * 0.05 +
      equipmentCompatibilityScore * 0.05;

    return {
      capacityScore,
      proximityScore,
      performanceScore,
      routeScore,
      fuelScore,
      timeScore,
      priceScore,
      seasonalScore,
      driverPerformanceScore,
      equipmentCompatibilityScore,
      overallScore: enhancedOverallScore,
      estimatedCost: this.estimateCost(truck, load, marketContext),
      estimatedTime: this.estimateTime(truck, load),
      distance: this.calculateDistance(truck, load),
      co2Emissions: this.estimateCO2Emissions(truck, load),
      fuelConsumption: this.estimateFuelConsumption(truck, load),
      ecoScore: this.calculateEcoScore(truck, load),
      successProbability: this.calculateSuccessProbability(
        truck,
        load,
        marketContext,
      ),
    };
  }

  private getDynamicWeights(load: Load, marketContext: any): any {
    const baseWeights: Record<string, number> = {
      capacity: 0.25,
      proximity: 0.2,
      performance: 0.15,
      route: 0.15,
      fuel: 0.1,
      time: 0.1,
      price: 0.05,
    };
    if (load.isHazardous) {
      baseWeights.performance += 0.1;
      baseWeights.route += 0.05;
      baseWeights.capacity -= 0.05;
      baseWeights.proximity -= 0.05;
    }
    if (load.isFragile) {
      baseWeights.performance += 0.1;
      baseWeights.route += 0.05;
      baseWeights.capacity -= 0.05;
    }
    if (load.requiresRefrigeration) {
      baseWeights.capacity += 0.05;
      baseWeights.performance += 0.05;
      baseWeights.fuel -= 0.05;
    }
    if (marketContext?.currentDemand > 0.8) {
      baseWeights.price += 0.05;
      baseWeights.proximity -= 0.05;
    }
    const totalWeight = Object.values(baseWeights).reduce(
      (sum, w) => sum + w,
      0,
    );
    Object.keys(baseWeights).forEach((k) => {
      baseWeights[k] = baseWeights[k] / totalWeight;
    });
    return baseWeights;
  }

  private calculateCapacityScore(truck: Truck, load: Load): number {
    let score = 0;
    const maxScore = 100;
    if (truck.capacityWeight >= load.weight) score += 30;
    if (truck.capacityVolume >= (load.volume || 0)) score += 20;
    if (truck.cargoCapabilities) {
      if (truck.cargoCapabilities.supportedCargoTypes?.includes(load.cargoType))
        score += 15;
      if (load.isFragile && truck.cargoCapabilities.maxFragileHandling)
        score += 10;
      if (load.isHazardous && truck.cargoCapabilities.maxHazardousHandling)
        score += 10;
      if (
        load.requiresRefrigeration &&
        truck.cargoCapabilities.maxRefrigeratedHandling
      )
        score += 10;
    }
    return Math.min(score, maxScore);
  }

  private async calculateProximityScore(
    truck: Truck,
    load: Load,
  ): Promise<number> {
    const pickup = load.locations?.find((loc) => loc.type === 'PICKUP');
    if (!truck.currentLocation || !pickup) return 0.5;
    const truckCoords = extractPointCoordinates(truck.currentLocation);
    const loadCoords = pickup.locationData?.coordinates;
    if (!truckCoords || !loadCoords) return 0.5;
    const distance = this.calculateHaversineDistance(
      truckCoords.latitude,
      truckCoords.longitude,
      loadCoords.latitude,
      loadCoords.longitude,
    );
    return Math.max(0, 1 - distance / 500);
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private async calculatePerformanceScore(
    truck: Truck,
    load: Load,
  ): Promise<number> {
    return 0.8;
  }

  private async calculateRouteScore(truck: Truck, load: Load): Promise<number> {
    return 0.7;
  }

  private calculateFuelScore(truck: Truck, load: Load): number {
    return Math.min(1, (truck.fuelEfficiency || 5) / 10);
  }

  private calculateTimeScore(
    truck: Truck,
    load: Load,
    request: MatchRequestDto,
  ): number {
    let score = 0.5;
    if (request.isTimeCritical) {
      if (
        truck.estimatedAvailableTime &&
        truck.estimatedAvailableTime <= new Date()
      )
        score += 0.3;
    }
    if (request.maxTransitTime) {
      const t = this.estimateTime(truck, load);
      if (t <= request.maxTransitTime) score += 0.2;
    }
    return Math.min(1, score);
  }

  private async calculatePriceScore(
    truck: Truck,
    load: Load,
    marketContext: any,
  ): Promise<number> {
    return 0.6;
  }

  private estimateCost(truck: Truck, load: Load, marketContext: any): number {
    const baseRate = 2.5;
    const distance = this.calculateDistance(truck, load);
    const marketMultiplier = marketContext?.currentDemand > 0.8 ? 1.2 : 1.0;
    return distance * baseRate * marketMultiplier;
  }

  private estimateTime(truck: Truck, load: Load): number {
    const distance = this.calculateDistance(truck, load);
    const averageSpeed = 55;
    return distance / averageSpeed;
  }

  private calculateDistance(truck: Truck, load: Load): number {
    if (!truck.currentLocation) return 0;
    const pickup = load.locations?.find((loc) => loc.type === 'PICKUP');
    if (!pickup) return 0;
    const truckCoords = extractPointCoordinates(truck.currentLocation);
    const loadCoords = pickup.locationData?.coordinates;
    if (!truckCoords || !loadCoords) return 0;
    return this.calculateHaversineDistance(
      truckCoords.latitude,
      truckCoords.longitude,
      loadCoords.latitude,
      loadCoords.longitude,
    );
  }

  private async enrichMatches(
    matches: EnhancedMatchResult[],
    load: Load,
    request: MatchRequestDto,
    marketContext: any,
  ): Promise<EnhancedMatchResult[]> {
    const enriched: EnhancedMatchResult[] = [];
    for (const match of matches) {
      const copy: EnhancedMatchResult = { ...match };
      if (request.includeDetailedScoring) copy.marketContext = marketContext;
      if (request.includeEnvironmentalImpact)
        copy.environmentalImpact = await this.calculateEnvironmentalImpact(
          match,
          load,
        );
      if (request.includeRiskAnalysis)
        copy.riskAssessment = await this.calculateRiskAssessment(match, load);
      if (request.includeSuccessProbability) {
        const truck = await this.truckRepository.findOne({
          where: { id: match.truckId },
        });
        if (truck)
          copy.successProbability =
            await this.mlPrediction.predictSuccessProbability(load, truck);
      }
      if (request.includeAlternativeMatches)
        copy.alternativeMatches = await this.findAlternativeMatches(
          match,
          load,
          request,
        );
      enriched.push(copy);
    }
    return enriched;
  }

  private async calculateEnvironmentalImpact(
    match: EnhancedMatchResult,
    load: Load,
  ): Promise<any> {
    const truck = await this.truckRepository.findOne({
      where: { id: match.truckId },
    });
    if (!truck) {
      return {
        carbonFootprint: 0,
        fuelEfficiency: 0,
        routeOptimization: match.routeScore || 0,
      };
    }
    const distance = this.calculateDistance(truck, load);
    const fuelConsumption = distance / (truck.fuelEfficiency || 6);
    const carbonFootprint = fuelConsumption * 19.6;
    return {
      carbonFootprint,
      fuelEfficiency: truck.fuelEfficiency || 6,
      routeOptimization: match.routeScore || 0,
    };
  }

  private async calculateRiskAssessment(
    match: EnhancedMatchResult,
    load: Load,
  ): Promise<any> {
    const riskFactors: string[] = [];
    let overallRisk = 0.3;
    if (load.isHazardous) {
      riskFactors.push('Hazardous cargo handling');
      overallRisk += 0.2;
    }
    if (load.isFragile) {
      riskFactors.push('Fragile cargo handling');
      overallRisk += 0.1;
    }
    const truck = await this.truckRepository.findOne({
      where: { id: match.truckId },
    });
    if (truck && truck.year < 2015) {
      riskFactors.push('Older vehicle');
      overallRisk += 0.1;
    }
    if (match.driverId) {
      const driver = await this.driverRepository.findOne({
        where: { id: match.driverId },
      });
      if (driver?.hireDate) {
        const years = Math.max(
          0,
          new Date().getFullYear() - new Date(driver.hireDate).getFullYear(),
        );
        if (years < 2) {
          riskFactors.push('Inexperienced driver');
          overallRisk += 0.15;
        }
      }
    }
    return {
      overallRisk: Math.min(1, overallRisk),
      riskFactors,
      mitigationStrategies: this.getMitigationStrategies(riskFactors),
    };
  }

  private getMitigationStrategies(riskFactors: string[]): string[] {
    const strategies: string[] = [];
    if (riskFactors.includes('Hazardous cargo handling')) {
      strategies.push('Ensure proper certifications and training');
      strategies.push('Use specialized equipment and containers');
    }
    if (riskFactors.includes('Fragile cargo handling')) {
      strategies.push('Implement careful loading procedures');
      strategies.push('Use appropriate packaging and cushioning');
    }
    if (riskFactors.includes('Older vehicle')) {
      strategies.push('Conduct thorough pre-trip inspection');
      strategies.push('Monitor vehicle performance closely');
    }
    if (riskFactors.includes('Inexperienced driver')) {
      strategies.push('Provide additional supervision and training');
      strategies.push('Assign experienced co-driver if possible');
    }
    return strategies;
  }

  private async findAlternativeMatches(
    primaryMatch: EnhancedMatchResult,
    load: Load,
    request: MatchRequestDto,
  ): Promise<EnhancedMatchResult[]> {
    return [];
  }

  private sortAndLimitMatches(
    matches: EnhancedMatchResult[],
    request: MatchRequestDto,
  ): EnhancedMatchResult[] {
    matches.sort((a, b) => b.overallScore - a.overallScore);
    const limit = request.limit || 10;
    return matches.slice(0, limit);
  }

  private calculateSeasonalDemandScore(load: Load): number {
    const now = new Date();
    const month = now.getMonth();
    const season = this.getSeason(month);
    const seasonalPatterns: Record<string, Record<string, number>> = {
      REFRIGERATED: { spring: 0.8, summer: 1.2, fall: 0.9, winter: 0.7 },
      HAZARDOUS: { spring: 1.0, summer: 1.1, fall: 1.0, winter: 0.9 },
      FRAGILE: { spring: 1.1, summer: 1.0, fall: 1.1, winter: 0.8 },
      GENERAL: { spring: 1.0, summer: 1.0, fall: 1.0, winter: 1.0 },
    };
    const cargoType = this.getCargoType(load);
    const seasonalMultiplier = seasonalPatterns[cargoType]?.[season] || 1.0;
    return Math.min(100, seasonalMultiplier * 100);
  }

  private getSeason(month: number): string {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private getCargoType(load: Load): string {
    if (load.requiresRefrigeration) return 'REFRIGERATED';
    if (load.isHazardous) return 'HAZARDOUS';
    if (load.isFragile) return 'FRAGILE';
    return 'GENERAL';
  }

  private calculateDriverPerformanceScore(truck: Truck): number {
    let score = 50;
    if (typeof truck.averageRating === 'number') {
      score += Math.min(20, Math.max(0, truck.averageRating * 20));
    }
    return Math.min(100, Math.max(0, score));
  }

  private calculateEquipmentCompatibilityScore(
    truck: Truck,
    load: Load,
  ): number {
    let score = 0;
    const maxScore = 100;
    const supported = truck.cargoCapabilities?.supportedCargoTypes;
    if (Array.isArray(supported) && supported.includes(load.cargoType))
      score += 20;
    if (load.requiresRefrigeration && truck.hasRefrigeration) score += 25;
    if (load.requiresRefrigeration && truck.hasHazmatPermit) score += 25;
    if (load.requiresForklift && truck.loadingCapabilities?.hasForklift)
      score += 10;
    if (load.requiresCrane && truck.loadingCapabilities?.hasCrane) score += 10;
    if (truck.securityFeatures?.hasGps) score += 5;
    return Math.min(maxScore, score);
  }

  private estimateCO2Emissions(truck: Truck, load: Load): number {
    const distance = this.calculateDistance(truck, load);
    const fuelEfficiency = truck.fuelEfficiency || 6.5;
    const fuelConsumption = distance / fuelEfficiency;
    return fuelConsumption * 2.31;
  }

  private estimateFuelConsumption(truck: Truck, load: Load): number {
    const distance = this.calculateDistance(truck, load);
    const fuelEfficiency = truck.fuelEfficiency || 6.5;
    return distance / fuelEfficiency;
  }

  private calculateEcoScore(truck: Truck, load: Load): number {
    const fuelEfficiency = truck.fuelEfficiency || 6.5;
    const maxEfficiency = 10.0;
    return Math.min(1.0, fuelEfficiency / maxEfficiency);
  }

  private calculateSuccessProbability(
    truck: Truck,
    load: Load,
    marketContext: any,
  ): number {
    let probability = 0.7;
    if (truck.averageRating) probability += truck.averageRating * 0.2;
    if (marketContext?.currentDemand < 0.5) probability += 0.1;
    return Math.min(1.0, Math.max(0.0, probability));
  }
}
