import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BrokerMatchRecommendation,
  MatchRecommendationType,
  MatchStatus,
} from '../../../entities/broker-intelligence.entity';
import { Load } from '../../../entities/load.entity';
import { Truck } from '../../../entities/truck.entity';
import { User } from '../../../entities/user.entity';
import { Trip } from '../../../entities/trip.entity';

@Injectable()
export class SmartMatchingService {
  private readonly logger = new Logger(SmartMatchingService.name);

  constructor(
    @InjectRepository(BrokerMatchRecommendation)
    private matchRecommendationRepo: Repository<BrokerMatchRecommendation>,
    @InjectRepository(Load)
    private loadRepo: Repository<Load>,
    @InjectRepository(Truck)
    private truckRepo: Repository<Truck>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Trip)
    private tripRepo: Repository<Trip>,
  ) {}

  /**
   * Generate AI-powered transporter recommendations for a load
   */
  async generateAIRecommendations(
    brokerId: string,
    loadId: string,
    tenantId: string,
  ): Promise<BrokerMatchRecommendation[]> {
    const load = await this.loadRepo.findOne({
      where: { id: loadId, tenantId },
    });

    if (!load) {
      throw new Error('Load not found');
    }

    // Get available transporters/trucks
    const availableTrucks = await this.getAvailableTrucks(load, tenantId);

    const recommendations: BrokerMatchRecommendation[] = [];

    for (const truck of availableTrucks) {
      const transporter = await this.userRepo.findOne({
        where: { id: truck.ownerId },
      });

      if (!transporter) continue;

      // Calculate match score
      const matchScore = await this.calculateMatchScore(load, truck, transporter);

      // Route optimization
      const routeOptimization = await this.optimizeRoute(load, truck);

      // Check for bundling opportunities
      const bundlingOpportunity = await this.findBundlingOpportunity(
        load,
        truck,
        tenantId,
      );

      // Check for backhaul opportunities
      const backhaulOpportunity = await this.findBackhaulOpportunity(
        load,
        truck,
        tenantId,
      );

      // AI insights
      const aiInsights = await this.generateAIInsights(
        load,
        truck,
        transporter,
        matchScore,
      );

      const recommendation = this.matchRecommendationRepo.create({
        tenantId,
        brokerId,
        loadId,
        transporterId: transporter.id,
        truckId: truck.id,
        recommendationType: MatchRecommendationType.AI_POWERED,
        status: MatchStatus.PENDING,
        matchScore: matchScore.overall,
        confidenceLevel: matchScore.confidence,
        matchingFactors: matchScore.factors,
        routeOptimization,
        bundlingOpportunity,
        backhaulOpportunity,
        aiInsights,
      });

      recommendations.push(
        await this.matchRecommendationRepo.save(recommendation),
      );
    }

    // Sort by match score
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return recommendations;
  }

  /**
   * Optimize route for a load and truck
   */
  async optimizeRoute(
    load: Load,
    truck: Truck,
  ): Promise<BrokerMatchRecommendation['routeOptimization']> {
    // Calculate distance from truck location to pickup
    const pickupLocation = load.pickupLocation?.locationData?.coordinates;
    const deliveryLocation = load.deliveryLocation?.locationData?.coordinates;
    const truckLocation = truck.currentLocation as any;

    if (!pickupLocation || !deliveryLocation) {
      return null;
    }

    // Calculate distances (simplified - in production, use Google Maps API or similar)
    // Convert coordinates format: {latitude, longitude} -> {lat, lng}
    const truckCoords = truckLocation?.coordinates 
      ? { lat: (truckLocation.coordinates as any).latitude || (truckLocation.coordinates as any).lat || 0, 
          lng: (truckLocation.coordinates as any).longitude || (truckLocation.coordinates as any).lng || 0 }
      : { lat: 0, lng: 0 };
    const pickupCoords = pickupLocation 
      ? { lat: pickupLocation.latitude || 0, lng: pickupLocation.longitude || 0 }
      : { lat: 0, lng: 0 };
    const deliveryCoords = deliveryLocation
      ? { lat: deliveryLocation.latitude || 0, lng: deliveryLocation.longitude || 0 }
      : { lat: 0, lng: 0 };

    const distanceToPickup = this.calculateDistance(truckCoords, pickupCoords);
    const distanceToDelivery = this.calculateDistance(pickupCoords, deliveryCoords);
    const totalDistance = distanceToPickup + distanceToDelivery;

    // Estimate time (assuming average speed of 60 km/h)
    const estimatedTime = (totalDistance / 60) * 60; // minutes

    // Calculate fuel savings (if route is optimized)
    const fuelSavings = distanceToPickup * 0.1; // Simplified calculation

    return {
      optimizedDistance: totalDistance,
      estimatedTime,
      fuelSavings,
      routeDetails: [
        {
          type: 'PICKUP',
          location: pickupLocation,
          distance: distanceToPickup,
        },
        {
          type: 'DELIVERY',
          location: deliveryLocation,
          distance: distanceToDelivery,
        },
      ],
    };
  }

  /**
   * Find bundling opportunities (multiple loads on same route)
   */
  async findBundlingOpportunity(
    load: Load,
    truck: Truck,
    tenantId: string,
  ): Promise<BrokerMatchRecommendation['bundlingOpportunity']> {
    // Find other loads going in similar direction
    const similarLoads = await this.loadRepo.find({
      where: {
        tenantId,
        status: 'PUBLISHED' as any,
      },
      take: 10,
    });

    const bundledLoads: string[] = [];
    let totalSavings = 0;

    for (const similarLoad of similarLoads) {
      if (similarLoad.id === load.id) continue;

      const isOnRoute = this.isLoadOnRoute(load, similarLoad);
      if (isOnRoute) {
        bundledLoads.push(similarLoad.id);
        // Calculate savings (simplified)
        totalSavings += load.loadValue * 0.1; // 10% savings per bundled load
      }
    }

    if (bundledLoads.length === 0) {
      return null;
    }

    return {
      bundledLoadIds: bundledLoads,
      totalSavings,
      sharedRoute: true,
      combinedDistance: 0, // Would calculate actual combined distance
    };
  }

  /**
   * Find backhaul opportunities (return trip with cargo)
   */
  async findBackhaulOpportunity(
    load: Load,
    truck: Truck,
    tenantId: string,
  ): Promise<BrokerMatchRecommendation['backhaulOpportunity']> {
    const deliveryLocation = load.deliveryLocation?.locationData?.coordinates;
    if (!deliveryLocation) return null;

    // Find loads going back in opposite direction
    const returnLoads = await this.loadRepo.find({
      where: {
        tenantId,
        status: 'PUBLISHED' as any,
      },
      take: 5,
    });

    for (const returnLoad of returnLoads) {
      const pickupLocation =
        returnLoad.pickupLocation?.locationData?.coordinates;
      if (!pickupLocation) continue;

      // Check if return load pickup is near delivery location
      const deliveryCoords = deliveryLocation
        ? { lat: deliveryLocation.latitude || 0, lng: deliveryLocation.longitude || 0 }
        : { lat: 0, lng: 0 };
      const returnPickupCoords = pickupLocation
        ? { lat: pickupLocation.latitude || 0, lng: pickupLocation.longitude || 0 }
        : { lat: 0, lng: 0 };
      const distance = this.calculateDistance(deliveryCoords, returnPickupCoords);

      if (distance < 50) {
        // Within 50km - good backhaul opportunity
        const returnDelivery =
          returnLoad.deliveryLocation?.locationData?.coordinates;
        const returnPickupCoords = pickupLocation
          ? { lat: pickupLocation.latitude || 0, lng: pickupLocation.longitude || 0 }
          : { lat: 0, lng: 0 };
        const returnDeliveryCoords = returnDelivery
          ? { lat: returnDelivery.latitude || 0, lng: returnDelivery.longitude || 0 }
          : { lat: 0, lng: 0 };
        const returnDistance = returnDelivery
          ? this.calculateDistance(returnPickupCoords, returnDeliveryCoords)
          : 0;

        return {
          returnLoadId: returnLoad.id,
          returnRouteDistance: returnDistance,
          totalRevenue: load.loadValue + returnLoad.loadValue,
          emptyMilesSaved: returnDistance,
        };
      }
    }

    return null;
  }

  /**
   * Calculate comprehensive match score
   */
  private async calculateMatchScore(
    load: Load,
    truck: Truck,
    transporter: User,
  ): Promise<{
    overall: number;
    confidence: number;
    factors: any;
  }> {
    // Capacity match
    const capacityScore = this.calculateCapacityScore(load, truck);

    // Distance score (closer is better)
    const distanceScore = this.calculateDistanceScore(load, truck);

    // Equipment match
    const equipmentScore = this.calculateEquipmentScore(load, truck);

    // Reliability score (from transporter performance)
    const reliabilityScore = await this.getReliabilityScore(transporter.id);

    // Availability score
    const availabilityScore = truck.status === 'AVAILABLE' ? 100 : 0;

    // Weighted overall score
    const overall =
      capacityScore * 0.3 +
      distanceScore * 0.2 +
      equipmentScore * 0.2 +
      reliabilityScore * 0.2 +
      availabilityScore * 0.1;

    // Confidence based on data completeness
    const confidence = this.calculateConfidence(load, truck, transporter);

    return {
      overall: Math.round(overall),
      confidence: Math.round(confidence),
      factors: {
        capacityScore,
        distanceScore,
        equipmentScore,
        reliabilityScore,
        availabilityScore,
      },
    };
  }

  private calculateCapacityScore(load: Load, truck: Truck): number {
    const loadWeight = Number(load.weight) || 0;
    const truckCapacity = Number(truck.capacityWeight) || 1;
    const utilization = (loadWeight / truckCapacity) * 100;

    // Optimal utilization is 80-90%
    if (utilization >= 80 && utilization <= 90) return 100;
    if (utilization >= 70 && utilization < 80) return 90;
    if (utilization > 90 && utilization <= 100) return 85;
    if (utilization >= 50 && utilization < 70) return 70;
    return 50;
  }

  private calculateDistanceScore(load: Load, truck: Truck): number {
    const pickupLocation = load.pickupLocation?.locationData?.coordinates;
    const truckLocation = truck.currentLocation as any;

    if (!pickupLocation || !truckLocation?.coordinates) return 50;

    // Convert coordinates format
    const truckCoords = truckLocation?.coordinates
      ? { lat: (truckLocation.coordinates as any).latitude || (truckLocation.coordinates as any).lat || 0,
          lng: (truckLocation.coordinates as any).longitude || (truckLocation.coordinates as any).lng || 0 }
      : { lat: 0, lng: 0 };
    const pickupCoords = pickupLocation
      ? { lat: pickupLocation.latitude || 0, lng: pickupLocation.longitude || 0 }
      : { lat: 0, lng: 0 };
    const distance = this.calculateDistance(truckCoords, pickupCoords);

    // Closer is better (0-100km = 100, 100-200km = 80, etc.)
    if (distance <= 50) return 100;
    if (distance <= 100) return 90;
    if (distance <= 200) return 75;
    if (distance <= 300) return 60;
    return 40;
  }

  private calculateEquipmentScore(load: Load, truck: Truck): number {
    // Check if truck equipment matches load requirements
    const loadEquipment = load.truckRequirements?.requiredFeatures || [];
    const truckType = truck.truckType || '';

    if (loadEquipment.length === 0) return 100;

    // Simplified matching - check if truck type matches any required features
    const matches = loadEquipment.some((req) =>
      truckType.toLowerCase().includes(req.toLowerCase()) ||
      (truck.loadingCapabilities as any)?.[req.toLowerCase()] === true
    );

    return matches ? 100 : 50;
  }

  private async getReliabilityScore(transporterId: string): Promise<number> {
    // Get transporter's performance metrics
    // This would query BrokerTransporterPerformance
    // For now, return a default score
    return 75;
  }

  private calculateConfidence(
    load: Load,
    truck: Truck,
    transporter: User,
  ): number {
    let confidence = 50;

    // More data = higher confidence
    if (load.pickupLocation && load.deliveryLocation) confidence += 20;
    if (truck.currentLocation) confidence += 10;
    if (transporter.profile) confidence += 10;
    if (truck.plateNumber) confidence += 10;

    return Math.min(confidence, 100);
  }

  private generateAIInsights(
    load: Load,
    truck: Truck,
    transporter: User,
    matchScore: any,
  ): BrokerMatchRecommendation['aiInsights'] {
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    if (matchScore.factors.distanceScore < 60) {
      riskFactors.push('Truck is far from pickup location');
      recommendations.push('Consider requesting earlier pickup time');
    }

    if (matchScore.factors.capacityScore < 70) {
      riskFactors.push('Capacity utilization is not optimal');
    }

    if (matchScore.factors.reliabilityScore < 70) {
      riskFactors.push('Transporter has lower reliability score');
      recommendations.push('Monitor closely or consider alternatives');
    }

    const predictedSuccessRate = matchScore.overall * 0.9; // Slightly conservative

    return {
      predictedSuccessRate,
      riskFactors,
      recommendations,
    };
  }

  private async getAvailableTrucks(
    load: Load,
    tenantId: string,
  ): Promise<Truck[]> {
    return this.truckRepo.find({
      where: {
        tenantId,
        status: 'AVAILABLE' as any,
        isActive: true,
      },
      take: 20,
    });
  }

  private isLoadOnRoute(load1: Load, load2: Load): boolean {
    // Simplified check - in production, use proper route analysis
    const load1Delivery = load1.deliveryLocation?.locationData?.coordinates;
    const load2Pickup = load2.pickupLocation?.locationData?.coordinates;

    if (!load1Delivery || !load2Pickup) return false;

    const load1DeliveryCoords = { lat: load1Delivery.latitude || 0, lng: load1Delivery.longitude || 0 };
    const load2PickupCoords = { lat: load2Pickup.latitude || 0, lng: load2Pickup.longitude || 0 };
    const distance = this.calculateDistance(load1DeliveryCoords, load2PickupCoords);
    return distance < 100; // Within 100km
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
  ): number {
    // Haversine formula for distance calculation
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
   * Get recommendations for a load
   */
  async getRecommendations(
    brokerId: string,
    loadId: string,
    tenantId: string,
  ): Promise<BrokerMatchRecommendation[]> {
    return this.matchRecommendationRepo.find({
      where: { brokerId, loadId, tenantId },
      order: { matchScore: 'DESC' },
    });
  }

  /**
   * Accept a recommendation
   */
  async acceptRecommendation(
    recommendationId: string,
    brokerId: string,
    notes?: string,
  ): Promise<BrokerMatchRecommendation> {
    const recommendation = await this.matchRecommendationRepo.findOne({
      where: { id: recommendationId, brokerId },
    });

    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    recommendation.status = MatchStatus.ACCEPTED;
    if (notes) {
      recommendation.notes = notes;
    }
    return this.matchRecommendationRepo.save(recommendation);
  }
}

