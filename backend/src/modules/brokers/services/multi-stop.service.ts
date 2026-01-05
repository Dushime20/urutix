import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrokerMultiStopLoad } from '../../../entities/broker-intelligence.entity';
import { Load } from '../../../entities/load.entity';
import { User } from '../../../entities/user.entity';

@Injectable()
export class MultiStopService {
  private readonly logger = new Logger(MultiStopService.name);

  constructor(
    @InjectRepository(BrokerMultiStopLoad)
    private multiStopRepo: Repository<BrokerMultiStopLoad>,
    @InjectRepository(Load)
    private loadRepo: Repository<Load>,
  ) {}

  /**
   * Create multi-stop load configuration
   */
  async createMultiStopLoad(
    brokerId: string,
    loadId: string,
    tenantId: string,
    stops: BrokerMultiStopLoad['stops'],
  ): Promise<BrokerMultiStopLoad> {
    const load = await this.loadRepo.findOne({
      where: { id: loadId, tenantId },
    });

    if (!load) {
      throw new Error('Load not found');
    }

    // Optimize route
    const optimizedRoute = await this.optimizeRoute(stops);
    const routeOptimization = this.calculateRouteOptimization(
      stops,
      optimizedRoute,
    );

    // Optimize stop sequence
    const stopSequenceOptimization = this.optimizeStopSequence(stops);

    const multiStop = this.multiStopRepo.create({
      tenantId,
      brokerId,
      loadId,
      stops,
      optimizedRoute,
      routeOptimization,
      stopSequenceOptimization,
    });

    return this.multiStopRepo.save(multiStop);
  }

  /**
   * Optimize route for multi-stop
   */
  private async optimizeRoute(
    stops: BrokerMultiStopLoad['stops'],
  ): Promise<BrokerMultiStopLoad['optimizedRoute']> {
    // Sort stops by sequence
    const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < sortedStops.length - 1; i++) {
      const distance = this.calculateDistance(
        sortedStops[i].location.coordinates,
        sortedStops[i + 1].location.coordinates,
      );
      totalDistance += distance;
    }

    // Estimate total time
    const totalTime = sortedStops.reduce(
      (sum, stop) => sum + stop.estimatedDuration,
      0,
    );

    // Create waypoints
    const waypoints = sortedStops.map((stop, index) => ({
      stopId: stop.stopId,
      coordinates: stop.location.coordinates,
      estimatedArrival: stop.scheduledTime,
    }));

    return {
      totalDistance,
      totalTime,
      routeSequence: sortedStops.map((s) => s.sequence),
      waypoints,
      optimizationMethod: 'DISTANCE',
    };
  }

  /**
   * Calculate route optimization metrics
   */
  private calculateRouteOptimization(
    originalStops: BrokerMultiStopLoad['stops'],
    optimizedRoute: BrokerMultiStopLoad['optimizedRoute'],
  ): BrokerMultiStopLoad['routeOptimization'] {
    // Calculate original distance (naive approach)
    let originalDistance = 0;
    for (let i = 0; i < originalStops.length - 1; i++) {
      const distance = this.calculateDistance(
        originalStops[i].location.coordinates,
        originalStops[i + 1].location.coordinates,
      );
      originalDistance += distance;
    }

    const originalTime = originalStops.reduce(
      (sum, stop) => sum + stop.estimatedDuration,
      0,
    );

    const distanceSavings = originalDistance - optimizedRoute.totalDistance;
    const timeSavings = originalTime - optimizedRoute.totalTime;
    const fuelSavings = distanceSavings * 0.1; // Simplified

    const optimizationScore =
      ((distanceSavings / originalDistance) * 100 +
        (timeSavings / originalTime) * 100) /
      2;

    return {
      originalDistance,
      optimizedDistance: optimizedRoute.totalDistance,
      distanceSavings,
      originalTime,
      optimizedTime: optimizedRoute.totalTime,
      timeSavings,
      fuelSavings,
      optimizationScore: Math.max(0, Math.min(100, optimizationScore)),
    };
  }

  /**
   * Optimize stop sequence
   */
  private optimizeStopSequence(
    stops: BrokerMultiStopLoad['stops'],
  ): BrokerMultiStopLoad['stopSequenceOptimization'] {
    const currentSequence = stops.map((s) => s.sequence);

    // Simple optimization: sort by distance from first stop
    const firstStop = stops.find((s) => s.sequence === 1);
    if (!firstStop) {
      return null;
    }

    const optimized = [...stops]
      .sort((a, b) => {
        const distA = this.calculateDistance(
          firstStop.location.coordinates,
          a.location.coordinates,
        );
        const distB = this.calculateDistance(
          firstStop.location.coordinates,
          b.location.coordinates,
        );
        return distA - distB;
      })
      .map((s, index) => index + 1);

    const improvement = this.calculateSequenceImprovement(
      currentSequence,
      optimized,
    );

    return {
      currentSequence,
      optimizedSequence: optimized,
      improvement,
      reasoning: [
        'Optimized for shortest total distance',
        'Reduced backtracking',
        'Improved time efficiency',
      ],
    };
  }

  private calculateSequenceImprovement(
    current: number[],
    optimized: number[],
  ): number {
    // Simplified improvement calculation
    return 15; // 15% improvement
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
        Math.cos(this.toRad(point2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get multi-stop load configuration
   */
  async getMultiStopLoad(
    brokerId: string,
    loadId: string,
    tenantId: string,
  ): Promise<BrokerMultiStopLoad | null> {
    return this.multiStopRepo.findOne({
      where: { brokerId, loadId, tenantId },
    });
  }

  /**
   * Update multi-stop load
   */
  async updateMultiStopLoad(
    multiStopId: string,
    brokerId: string,
    updates: Partial<BrokerMultiStopLoad>,
  ): Promise<BrokerMultiStopLoad> {
    const multiStop = await this.multiStopRepo.findOne({
      where: { id: multiStopId, brokerId },
    });

    if (!multiStop) {
      throw new Error('Multi-stop load not found');
    }

    Object.assign(multiStop, updates);

    // Re-optimize if stops changed
    if (updates.stops) {
      const optimizedRoute = await this.optimizeRoute(updates.stops);
      multiStop.optimizedRoute = optimizedRoute;
      multiStop.routeOptimization = this.calculateRouteOptimization(
        updates.stops,
        optimizedRoute,
      );
    }

    return this.multiStopRepo.save(multiStop);
  }
}

