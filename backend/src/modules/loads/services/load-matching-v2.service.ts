import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, In } from 'typeorm';
import { Load, LoadStatus } from '../../../entities/load.entity';
import { Truck } from '../../../entities/truck.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface MatchResult {
  truckId: string;
  score: number;
  reasons: string[];
  truck: any;
  estimatedCost: number;
  estimatedTime: number;
}

export interface MatchingCriteria {
  maxDistance?: number;
  preferredCarriers?: string[];
  excludedCarriers?: string[];
  minRating?: number;
  maxPrice?: number;
  truckTypes?: string[];
  equipment?: string[];
}

export interface GeographicConstraints {
  maxDeviationDistance: number;
  preferredRoutes: string[];
  avoidTollRoads: boolean;
}

@Injectable()
export class LoadMatchingV2Service {
  private readonly logger = new Logger(LoadMatchingV2Service.name);
  private readonly matchingQueue = new Map<string, Date>();

  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Find matching trucks for a specific load
   */
  async findMatchingTrucks(
    load: Load,
    limit: number = 50,
  ): Promise<MatchResult[]> {
    try {
      this.logger.log(`Finding matching trucks for load: ${load.id}`);

      // Get available trucks in the region
      const availableTrucks = await this.getAvailableTrucks(load);

      if (availableTrucks.length === 0) {
        this.logger.warn(`No available trucks found for load: ${load.id}`);
        return [];
      }

      // Score and filter trucks based on compatibility
      const matchResults: MatchResult[] = [];

      for (const truck of availableTrucks) {
        const matchScore = await this.calculateMatchScore(load, truck);

        if (matchScore.score > 0) {
          matchResults.push({
            truckId: truck.id,
            score: matchScore.score,
            reasons: matchScore.reasons,
            truck,
            estimatedCost: matchScore.estimatedCost,
            estimatedTime: matchScore.estimatedTime,
          });
        }
      }

      // Sort by score (highest first) and limit results
      matchResults.sort((a, b) => b.score - a.score);
      const topMatches = matchResults.slice(0, limit);

      this.logger.log(
        `Found ${topMatches.length} matching trucks for load: ${load.id}`,
      );

      return topMatches;
    } catch (error) {
      this.logger.error(
        `Failed to find matching trucks for load ${load.id}: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Start automatic matching process for a load
   */
  async startAutoMatching(load: Load): Promise<void> {
    try {
      if (!load.autoMatchEnabled) {
        this.logger.log(`Auto-matching disabled for load: ${load.id}`);
        return;
      }

      this.logger.log(`Starting auto-matching for load: ${load.id}`);

      // Add to matching queue
      this.matchingQueue.set(load.id, new Date());

      // Find matching trucks
      const matches = await this.findMatchingTrucks(load, 10);

      if (matches.length === 0) {
        this.logger.warn(`No matches found for auto-matching load: ${load.id}`);
        return;
      }

      // Apply auto-matching criteria
      const autoMatchCandidates = this.filterForAutoMatching(matches, load);

      if (autoMatchCandidates.length > 0) {
        // Auto-assign to best match if criteria are met
        await this.processAutoMatch(load, autoMatchCandidates[0]);
      } else {
        // Send manual selection notification
        this.logger.log(`Manual selection required for load: ${load.id}`);
      }

      // Remove from queue
      this.matchingQueue.delete(load.id);
    } catch (error) {
      this.logger.error(
        `Auto-matching failed for load ${load.id}: ${error.message}`,
        error.stack,
      );
      this.matchingQueue.delete(load.id);
    }
  }

  /**
   * Batch matching for multiple loads
   */
  async batchMatch(loadIds: string[]): Promise<Map<string, MatchResult[]>> {
    const results = new Map<string, MatchResult[]>();

    for (const loadId of loadIds) {
      try {
        const load = await this.loadRepository.findOne({
          where: { id: loadId, status: In([LoadStatus.CREATED, LoadStatus.PUBLISHED]) },
          relations: ['pickupLocation', 'deliveryLocation'],
        });

        if (load) {
          const matches = await this.findMatchingTrucks(load);
          results.set(loadId, matches);
        }
      } catch (error) {
        this.logger.error(`Failed to match load ${loadId}: ${error.message}`);
        results.set(loadId, []);
      }
    }

    return results;
  }

  /**
   * Get market demand analysis for specific criteria
   */
  async getMarketDemandAnalysis(criteria: {
    region?: string;
    cargoType?: string;
    timeframe?: { start: Date; end: Date };
  }): Promise<any> {
    try {
      const queryBuilder = this.loadRepository
        .createQueryBuilder('load')
        .leftJoin('load.pickupLocation', 'pickupLocation')
        .leftJoin('load.deliveryLocation', 'deliveryLocation');

      // Apply filters
      if (criteria.cargoType) {
        queryBuilder.andWhere('load.cargoType = :cargoType', {
          cargoType: criteria.cargoType,
        });
      }

      if (criteria.timeframe) {
        queryBuilder.andWhere('load.pickupDate BETWEEN :start AND :end', {
          start: criteria.timeframe.start,
          end: criteria.timeframe.end,
        });
      }

      if (criteria.region) {
        // Add geographic filtering based on region
        queryBuilder.andWhere(
          'pickupLocation.region = :region OR deliveryLocation.region = :region',
          {
            region: criteria.region,
          },
        );
      }

      const [loads, totalSupply] = await queryBuilder.getManyAndCount();

      // Get available truck capacity
      const availableTrucks = await this.getAvailableTrucksInRegion(
        criteria.region,
      );
      const totalCapacity = availableTrucks.reduce(
        (sum, truck) => sum + truck.capacity,
        0,
      );

      // Calculate demand metrics
      const totalDemand = loads.reduce((sum, load) => sum + load.weight, 0);
      const averageLoadValue =
        loads.reduce((sum, load) => sum + load.loadValue, 0) / loads.length;
      const demandSupplyRatio =
        totalCapacity > 0 ? totalDemand / totalCapacity : 0;

      // Group by cargo type
      const demandByType = loads.reduce((acc, load) => {
        acc[load.cargoType] = (acc[load.cargoType] || 0) + load.weight;
        return acc;
      }, {});

      // Calculate pricing trends
      const pricingTrends = await this.calculatePricingTrends(loads);

      return {
        totalLoads: loads.length,
        totalDemand,
        totalCapacity,
        demandSupplyRatio,
        averageLoadValue,
        demandByType,
        pricingTrends,
        marketTightness: this.calculateMarketTightness(demandSupplyRatio),
        recommendations: this.generateMarketRecommendations(
          demandSupplyRatio,
          pricingTrends,
        ),
      };
    } catch (error) {
      this.logger.error(
        `Failed to analyze market demand: ${error.message}`,
        error.stack,
      );
      return { error: 'Market analysis failed' };
    }
  }

  // Private helper methods

  private async getAvailableTrucks(load: Load): Promise<any[]> {
    const searchRadius = 100; // km

    return await this.truckRepository
      .createQueryBuilder('truck')
      .where('truck.status = :status', { status: 'AVAILABLE' })
      .andWhere('truck.isActive = :isActive', { isActive: true })
      .andWhere('truck.capacity >= :minCapacity', { minCapacity: load.weight })
      .getMany();
  }

  private async getAvailableTrucksInRegion(region?: string): Promise<any[]> {
    const query = this.truckRepository
      .createQueryBuilder('truck')
      .where('truck.status = :status', { status: 'AVAILABLE' })
      .andWhere('truck.isActive = :isActive', { isActive: true });

    if (region) {
      // Add region filtering if available
      query.andWhere('truck.region = :region', { region });
    }

    return await query.getMany();
  }

  private async calculateMatchScore(
    load: Load,
    truck: any,
  ): Promise<{
    score: number;
    reasons: string[];
    estimatedCost: number;
    estimatedTime: number;
  }> {
    let score = 100;
    const reasons: string[] = [];

    // Basic compatibility checks (mandatory)
    if (load.weight > truck.capacity) {
      return {
        score: 0,
        reasons: ['Exceeds truck capacity'],
        estimatedCost: 0,
        estimatedTime: 0,
      };
    }

    if (load.requiresRefrigeration && !truck.hasRefrigeration) {
      return {
        score: 0,
        reasons: ['Truck lacks refrigeration'],
        estimatedCost: 0,
        estimatedTime: 0,
      };
    }

    if (load.isHazardous && !truck.isHazmatCertified) {
      return {
        score: 0,
        reasons: ['Truck not hazmat certified'],
        estimatedCost: 0,
        estimatedTime: 0,
      };
    }

    // Capacity utilization scoring
    const utilizationRatio = load.weight / truck.capacity;
    if (utilizationRatio >= 0.8) {
      score += 20;
      reasons.push('Excellent capacity utilization');
    } else if (utilizationRatio >= 0.5) {
      score += 10;
      reasons.push('Good capacity utilization');
    } else if (utilizationRatio < 0.3) {
      score -= 15;
      reasons.push('Low capacity utilization');
    }

    // Distance scoring
    const distance = await this.calculateDistance(load, truck);
    if (distance <= 50) {
      score += 15;
      reasons.push('Truck nearby');
    } else if (distance <= 100) {
      score += 5;
      reasons.push('Reasonable distance');
    } else if (distance > 200) {
      score -= 10;
      reasons.push('Truck far from pickup');
    }

    // Carrier rating scoring
    if (truck.carrierRating >= 4.5) {
      score += 10;
      reasons.push('Excellent carrier rating');
    } else if (truck.carrierRating >= 4.0) {
      score += 5;
      reasons.push('Good carrier rating');
    } else if (truck.carrierRating < 3.0) {
      score -= 10;
      reasons.push('Below average carrier rating');
    }

    // Truck age and condition
    if (truck.age <= 3) {
      score += 5;
      reasons.push('New truck');
    } else if (truck.age > 10) {
      score -= 5;
      reasons.push('Older truck');
    }

    // Special equipment matching
    const requiredEquipment = this.getRequiredEquipment(load);
    const hasRequiredEquipment = requiredEquipment.every((eq) =>
      truck.equipment?.includes(eq),
    );
    if (hasRequiredEquipment && requiredEquipment.length > 0) {
      score += 10;
      reasons.push('Has required equipment');
    }

    // Route efficiency
    const routeEfficiency = await this.calculateRouteEfficiency(load, truck);
    score += routeEfficiency.score;
    if (routeEfficiency.reason) {
      reasons.push(routeEfficiency.reason);
    }

    // Price competitiveness
    const estimatedCost = this.estimateShippingCost(load, truck);
    const estimatedTime = this.estimateTravelTime(distance);

    if (load.offeredPrice && estimatedCost <= load.offeredPrice) {
      score += 10;
      reasons.push('Competitive pricing');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasons: reasons.slice(0, 5), // Limit to top 5 reasons
      estimatedCost,
      estimatedTime,
    };
  }

  private filterForAutoMatching(
    matches: MatchResult[],
    load: Load,
  ): MatchResult[] {
    return matches.filter((match) => {
      // Minimum score threshold for auto-matching
      if (match.score < 70) return false;

      // Auto-assign only to highly rated carriers
      if (match.truck.carrierRating < 4.0) return false;

      return true;
    });
  }

  private async processAutoMatch(
    load: Load,
    match: MatchResult,
  ): Promise<void> {
    try {
      // Auto-assign the truck to the load
      load.assignedTruckId = match.truckId;
      load.status = LoadStatus.ASSIGNED;
      load.updatedAt = new Date();

      await this.loadRepository.save(load);

      // Emit events
      this.eventEmitter.emit('load.v2.auto_matched', {
        loadId: load.id,
        truckId: match.truckId,
        score: match.score,
      });

      this.logger.log(
        `Auto-matched load ${load.id} to truck ${match.truckId} with score ${match.score}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process auto-match: ${error.message}`,
        error.stack,
      );
    }
  }

  private getRequiredEquipment(load: Load): string[] {
    const equipment: string[] = [];

    if (load.requiresForklift) equipment.push('forklift');
    if (load.requiresCrane) equipment.push('crane');
    if (load.requiresLoadingDock) equipment.push('loading_dock');
    if (load.requiresGpsMonitoring) equipment.push('gps_tracking');
    if (load.requiresTemperatureMonitoring)
      equipment.push('temperature_monitoring');

    return equipment;
  }

  private async calculateDistance(load: Load, truck: any): Promise<number> {
    // This would use a geolocation service to calculate actual distance
    // For now, return a mock distance
    return Math.random() * 200; // Random distance between 0-200 km
  }

  private async calculateRouteEfficiency(
    load: Load,
    truck: any,
  ): Promise<{ score: number; reason?: string }> {
    // Calculate route efficiency based on truck's current location and destination
    // This would integrate with routing services

    // Mock implementation
    const efficiency = Math.random();

    if (efficiency > 0.8) {
      return { score: 15, reason: 'Highly efficient route' };
    } else if (efficiency > 0.6) {
      return { score: 5, reason: 'Reasonably efficient route' };
    } else {
      return { score: -5, reason: 'Inefficient route' };
    }
  }

  private estimateShippingCost(load: Load, truck: any): number {
    // Estimate shipping cost based on distance, load characteristics, and truck rates
    const baseRate = 2.5; // $2.5 per km
    const distance = 500; // Would calculate actual distance
    const baseCost = distance * baseRate;

    // Apply multipliers for special requirements
    let multiplier = 1;
    if (load.isHazardous) multiplier += 0.3;
    if (load.requiresRefrigeration) multiplier += 0.2;
    if (load.isTimeCritical) multiplier += 0.15;

    return baseCost * multiplier;
  }

  private estimateTravelTime(distance: number): number {
    const averageSpeed = 60; // km/h
    return distance / averageSpeed; // hours
  }

  private calculatePricingTrends(loads: Load[]): any {
    // Calculate pricing trends from historical data
    const pricesWithDates = loads
      .filter((load) => load.offeredPrice)
      .map((load) => ({
        price: load.offeredPrice,
        date: load.createdAt,
        weight: load.weight,
      }));

    if (pricesWithDates.length === 0) {
      return { trend: 'no_data', averagePrice: 0 };
    }

    const averagePrice =
      pricesWithDates.reduce((sum, item) => sum + item.price, 0) /
      pricesWithDates.length;
    const pricePerKg =
      pricesWithDates.reduce((sum, item) => sum + item.price / item.weight, 0) /
      pricesWithDates.length;

    return {
      trend: 'stable', // Would calculate actual trend
      averagePrice,
      pricePerKg,
      sampleSize: pricesWithDates.length,
    };
  }

  private calculateMarketTightness(demandSupplyRatio: number): string {
    if (demandSupplyRatio > 0.9) return 'very_tight';
    if (demandSupplyRatio > 0.7) return 'tight';
    if (demandSupplyRatio > 0.5) return 'balanced';
    if (demandSupplyRatio > 0.3) return 'loose';
    return 'very_loose';
  }

  private generateMarketRecommendations(
    demandSupplyRatio: number,
    pricingTrends: any,
  ): string[] {
    const recommendations: string[] = [];

    if (demandSupplyRatio > 0.8) {
      recommendations.push('High demand market - consider increasing prices');
      recommendations.push('Prioritize high-value loads');
    } else if (demandSupplyRatio < 0.4) {
      recommendations.push('Low demand market - focus on cost efficiency');
      recommendations.push('Consider longer-term contracts');
    }

    if (pricingTrends.trend === 'increasing') {
      recommendations.push(
        'Pricing trend is upward - good time for cargo owners',
      );
    }

    return recommendations;
  }
}
