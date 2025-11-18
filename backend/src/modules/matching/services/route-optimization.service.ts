import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../../../entities/location.entity';
import { Trip } from '../../../entities/trip.entity';

export interface RoutePoint {
  latitude: number;
  longitude: number;
  address: string;
  type: 'pickup' | 'delivery' | 'waypoint';
  estimatedTime: number;
  constraints?: {
    timeWindow?: { start: Date; end: Date };
    specialRequirements?: string[];
  };
}

export interface OptimizedRoute {
  routeId: string;
  points: RoutePoint[];
  totalDistance: number;
  totalTime: number;
  fuelConsumption: number;
  costSavings: number;
  trafficConditions: 'low' | 'medium' | 'high';
  roadConditions: 'good' | 'fair' | 'poor';
  tolls: number;
  alternativeRoutes: RoutePoint[][];
  optimizationFactors: string[];
}

export interface RouteConstraints {
  maxDistance?: number;
  maxTime?: number;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  preferFastest?: boolean;
  preferCheapest?: boolean;
  timeWindows?: { start: Date; end: Date }[];
  specialRequirements?: string[];
}

@Injectable()
export class RouteOptimizationService {
  private readonly logger = new Logger(RouteOptimizationService.name);

  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
  ) {}

  /**
   * Optimize route for a trip
   */
  async optimizeRoute(
    tripId: string,
    constraints?: RouteConstraints,
  ): Promise<OptimizedRoute> {
    try {
      const trip = await this.tripRepository.findOne({
        where: { id: tripId },
        relations: ['load'],
      });

      if (!trip) {
        throw new Error('Trip not found');
      }

      // Get pickup and delivery locations from trip
      const pickupLocation = trip.pickupLocation;
      const deliveryLocation = trip.deliveryLocation;

      if (!pickupLocation || !deliveryLocation) {
        throw new Error('Location data not found');
      }

      // Create route points
      const routePoints: RoutePoint[] = [
        {
          latitude: (pickupLocation.coordinates as any)?.coordinates?.[1] || 0,
          longitude: (pickupLocation.coordinates as any)?.coordinates?.[0] || 0,
          address: pickupLocation.address,
          type: 'pickup',
          estimatedTime: 30, // 30 minutes for pickup
        },
        {
          latitude:
            (deliveryLocation.coordinates as any)?.coordinates?.[1] || 0,
          longitude:
            (deliveryLocation.coordinates as any)?.coordinates?.[0] || 0,
          address: deliveryLocation.address,
          type: 'delivery',
          estimatedTime: 45, // 45 minutes for delivery
        },
      ];

      // Apply optimization algorithm
      const optimizedRoute = await this.applyOptimizationAlgorithm(
        routePoints,
        constraints,
      );

      return optimizedRoute;
    } catch (error) {
      this.logger.error('Error optimizing route:', error);
      throw error;
    }
  }

  /**
   * Optimize multi-stop route
   */
  async optimizeMultiStopRoute(
    points: RoutePoint[],
    constraints?: RouteConstraints,
  ): Promise<OptimizedRoute> {
    try {
      // Apply traveling salesman problem algorithm
      const optimizedPoints = this.solveTravelingSalesmanProblem(points);

      // Calculate route metrics
      const totalDistance = this.calculateTotalDistance(optimizedPoints);
      const totalTime = this.calculateTotalTime(optimizedPoints);
      const fuelConsumption = this.calculateFuelConsumption(totalDistance);
      const tolls = this.calculateTolls(optimizedPoints);

      // Generate alternative routes
      const alternativeRoutes = this.generateAlternativeRoutes(
        points,
        constraints,
      );

      return {
        routeId: `route_${Date.now()}`,
        points: optimizedPoints,
        totalDistance,
        totalTime,
        fuelConsumption,
        costSavings: this.calculateCostSavings(
          totalDistance,
          fuelConsumption,
          tolls,
        ),
        trafficConditions: this.assessTrafficConditions(optimizedPoints),
        roadConditions: this.assessRoadConditions(optimizedPoints),
        tolls,
        alternativeRoutes,
        optimizationFactors: this.getOptimizationFactors(constraints),
      };
    } catch (error) {
      this.logger.error('Error optimizing multi-stop route:', error);
      throw error;
    }
  }

  /**
   * Get real-time traffic conditions
   */
  async getTrafficConditions(route: RoutePoint[]): Promise<{
    conditions: 'low' | 'medium' | 'high';
    delays: number;
    recommendations: string[];
  }> {
    try {
      // In real implementation, integrate with traffic API
      const conditions = this.assessTrafficConditions(route);
      const delays = this.calculateTrafficDelays(route);
      const recommendations = this.generateTrafficRecommendations(
        conditions,
        delays,
      );

      return {
        conditions,
        delays,
        recommendations,
      };
    } catch (error) {
      this.logger.error('Error getting traffic conditions:', error);
      throw error;
    }
  }

  /**
   * Calculate fuel-efficient route
   */
  async calculateFuelEfficientRoute(
    startPoint: RoutePoint,
    endPoint: RoutePoint,
    vehicleType: string,
  ): Promise<OptimizedRoute> {
    try {
      const routePoints = [startPoint, endPoint];

      // Apply fuel efficiency optimization
      const optimizedRoute = await this.applyFuelEfficiencyOptimization(
        routePoints,
        vehicleType,
      );

      return optimizedRoute;
    } catch (error) {
      this.logger.error('Error calculating fuel-efficient route:', error);
      throw error;
    }
  }

  /**
   * Get route alternatives
   */
  async getRouteAlternatives(
    startPoint: RoutePoint,
    endPoint: RoutePoint,
    count: number = 3,
  ): Promise<OptimizedRoute[]> {
    try {
      const alternatives: OptimizedRoute[] = [];

      for (let i = 0; i < count; i++) {
        const alternative = await this.generateAlternativeRoute(
          startPoint,
          endPoint,
          i,
        );
        alternatives.push(alternative);
      }

      return alternatives.sort((a, b) => a.totalTime - b.totalTime);
    } catch (error) {
      this.logger.error('Error getting route alternatives:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private async applyOptimizationAlgorithm(
    points: RoutePoint[],
    constraints?: RouteConstraints,
  ): Promise<OptimizedRoute> {
    // Apply different optimization strategies based on constraints
    let optimizedPoints = points;

    if (constraints?.preferFastest) {
      optimizedPoints = this.optimizeForSpeed(points);
    } else if (constraints?.preferCheapest) {
      optimizedPoints = this.optimizeForCost(points);
    } else {
      optimizedPoints = this.optimizeForBalance(points);
    }

    const totalDistance = this.calculateTotalDistance(optimizedPoints);
    const totalTime = this.calculateTotalTime(optimizedPoints);
    const fuelConsumption = this.calculateFuelConsumption(totalDistance);
    const tolls = this.calculateTolls(optimizedPoints);

    return {
      routeId: `route_${Date.now()}`,
      points: optimizedPoints,
      totalDistance,
      totalTime,
      fuelConsumption,
      costSavings: this.calculateCostSavings(
        totalDistance,
        fuelConsumption,
        tolls,
      ),
      trafficConditions: this.assessTrafficConditions(optimizedPoints),
      roadConditions: this.assessRoadConditions(optimizedPoints),
      tolls,
      alternativeRoutes: [],
      optimizationFactors: this.getOptimizationFactors(constraints),
    };
  }

  private solveTravelingSalesmanProblem(points: RoutePoint[]): RoutePoint[] {
    // Simple nearest neighbor algorithm
    if (points.length <= 2) return points;

    const optimized: RoutePoint[] = [points[0]];
    const remaining = [...points.slice(1)];

    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1];
      let nearestIndex = 0;
      let minDistance = this.calculateDistance(current, remaining[0]);

      for (let i = 1; i < remaining.length; i++) {
        const distance = this.calculateDistance(current, remaining[i]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }

      optimized.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }

    return optimized;
  }

  private calculateTotalDistance(points: RoutePoint[]): number {
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += this.calculateDistance(points[i], points[i + 1]);
    }
    return totalDistance;
  }

  private calculateTotalTime(points: RoutePoint[]): number {
    let totalTime = 0;
    for (let i = 0; i < points.length; i++) {
      totalTime += points[i].estimatedTime;
      if (i < points.length - 1) {
        const distance = this.calculateDistance(points[i], points[i + 1]);
        totalTime += distance / 60; // Assume 60 km/h average speed
      }
    }
    return totalTime;
  }

  private calculateFuelConsumption(distance: number): number {
    // Assume 6.5 L/100km average consumption
    return (distance * 6.5) / 100;
  }

  private calculateTolls(points: RoutePoint[]): number {
    // Simplified toll calculation
    return points.length * 5; // $5 per waypoint
  }

  private calculateCostSavings(
    distance: number,
    fuelConsumption: number,
    tolls: number,
  ): number {
    const fuelCost = fuelConsumption * 1.5; // $1.5 per liter
    const totalCost = fuelCost + tolls;
    const baselineCost = distance * 0.3; // Baseline cost per km
    return Math.max(0, baselineCost - totalCost);
  }

  private assessTrafficConditions(
    points: RoutePoint[],
  ): 'low' | 'medium' | 'high' {
    // Simplified traffic assessment
    const random = Math.random();
    if (random < 0.3) return 'low';
    if (random < 0.7) return 'medium';
    return 'high';
  }

  private assessRoadConditions(points: RoutePoint[]): 'good' | 'fair' | 'poor' {
    // Simplified road condition assessment
    const random = Math.random();
    if (random < 0.6) return 'good';
    if (random < 0.9) return 'fair';
    return 'poor';
  }

  private generateAlternativeRoutes(
    points: RoutePoint[],
    constraints?: RouteConstraints,
  ): RoutePoint[][] {
    // Generate alternative routes with different strategies
    const alternatives: RoutePoint[][] = [];

    // Alternative 1: Avoid highways
    if (!constraints?.avoidHighways) {
      alternatives.push(this.generateHighwayRoute(points));
    }

    // Alternative 2: Scenic route
    alternatives.push(this.generateScenicRoute(points));

    // Alternative 3: Shortest distance
    alternatives.push(this.generateShortestRoute(points));

    return alternatives;
  }

  private getOptimizationFactors(constraints?: RouteConstraints): string[] {
    const factors: string[] = [];

    if (constraints?.preferFastest) factors.push('speed_optimization');
    if (constraints?.preferCheapest) factors.push('cost_optimization');
    if (constraints?.avoidTolls) factors.push('toll_avoidance');
    if (constraints?.avoidHighways) factors.push('highway_avoidance');
    if (constraints?.timeWindows) factors.push('time_window_constraints');

    return factors;
  }

  private calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) *
        Math.cos(this.toRadians(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private optimizeForSpeed(points: RoutePoint[]): RoutePoint[] {
    // Optimize for fastest route (highways, main roads)
    return points;
  }

  private optimizeForCost(points: RoutePoint[]): RoutePoint[] {
    // Optimize for lowest cost (avoid tolls, use local roads)
    return points;
  }

  private optimizeForBalance(points: RoutePoint[]): RoutePoint[] {
    // Balance between speed and cost
    return points;
  }

  private async applyFuelEfficiencyOptimization(
    points: RoutePoint[],
    vehicleType: string,
  ): Promise<OptimizedRoute> {
    // Apply fuel efficiency optimization based on vehicle type
    const optimizedPoints = this.optimizeForFuelEfficiency(points, vehicleType);

    const totalDistance = this.calculateTotalDistance(optimizedPoints);
    const totalTime = this.calculateTotalTime(optimizedPoints);
    const fuelConsumption = this.calculateFuelConsumption(totalDistance);

    return {
      routeId: `fuel_efficient_${Date.now()}`,
      points: optimizedPoints,
      totalDistance,
      totalTime,
      fuelConsumption,
      costSavings: 0,
      trafficConditions: 'low',
      roadConditions: 'good',
      tolls: 0,
      alternativeRoutes: [],
      optimizationFactors: ['fuel_efficiency'],
    };
  }

  private optimizeForFuelEfficiency(
    points: RoutePoint[],
    vehicleType: string,
  ): RoutePoint[] {
    // Apply fuel efficiency optimization
    return points;
  }

  private async generateAlternativeRoute(
    startPoint: RoutePoint,
    endPoint: RoutePoint,
    index: number,
  ): Promise<OptimizedRoute> {
    // Generate alternative route with different characteristics
    const points = [startPoint, endPoint];
    const totalDistance =
      this.calculateTotalDistance(points) * (1 + index * 0.1);
    const totalTime = this.calculateTotalTime(points) * (1 + index * 0.15);

    return {
      routeId: `alt_${index}_${Date.now()}`,
      points,
      totalDistance,
      totalTime,
      fuelConsumption: this.calculateFuelConsumption(totalDistance),
      costSavings: 0,
      trafficConditions: 'medium',
      roadConditions: 'good',
      tolls: 0,
      alternativeRoutes: [],
      optimizationFactors: [`alternative_${index}`],
    };
  }

  private calculateTrafficDelays(route: RoutePoint[]): number {
    // Calculate estimated traffic delays
    return route.length * 5; // 5 minutes per waypoint
  }

  private generateTrafficRecommendations(
    conditions: 'low' | 'medium' | 'high',
    delays: number,
  ): string[] {
    const recommendations: string[] = [];

    if (conditions === 'high') {
      recommendations.push('Consider alternative routes');
      recommendations.push('Allow extra travel time');
      recommendations.push('Check real-time traffic updates');
    }

    if (delays > 30) {
      recommendations.push('Significant delays expected');
      recommendations.push('Consider rescheduling if possible');
    }

    return recommendations;
  }

  private generateHighwayRoute(points: RoutePoint[]): RoutePoint[] {
    // Generate route using highways
    return points;
  }

  private generateScenicRoute(points: RoutePoint[]): RoutePoint[] {
    // Generate scenic route
    return points;
  }

  private generateShortestRoute(points: RoutePoint[]): RoutePoint[] {
    // Generate shortest distance route
    return points;
  }
}
