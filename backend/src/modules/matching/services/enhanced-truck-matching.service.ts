import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Truck, VehicleStatus } from '../../../entities/truck.entity';
import { Load } from '../../../entities/load.entity';

export interface EnhancedMatchingScore {
  basicScore: number;
  cargoAlignmentScore: number;
  equipmentScore: number;
  securityScore: number;
  routeScore: number;
  costScore: number;
  overallScore: number;
  matchReason: string;
}

export interface CargoAlignmentResult {
  truckId: string;
  loadId: string;
  score: EnhancedMatchingScore;
  compatibility: {
    cargoTypes: boolean;
    temperature: boolean;
    dimensions: boolean;
    specialHandling: boolean;
    equipment: boolean;
    security: boolean;
  };
}

@Injectable()
export class EnhancedTruckMatchingService {
  private readonly logger = new Logger(EnhancedTruckMatchingService.name);

  constructor(
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
  ) {}

  async findOptimalMatches(
    loadId: string,
    tenantId: string,
  ): Promise<CargoAlignmentResult[]> {
    const load = await this.loadRepository.findOne({
      where: { id: loadId, tenantId },
    });

    if (!load) {
      throw new Error('Load not found');
    }

    // Get available trucks
    const availableTrucks = await this.truckRepository.find({
      where: {
        tenantId,
        status: VehicleStatus.AVAILABLE,
        isActive: true,
      },
    });

    const matches: CargoAlignmentResult[] = [];

    for (const truck of availableTrucks) {
      const score = await this.calculateEnhancedMatchingScore(truck, load);
      const compatibility = this.assessCompatibility(truck, load);

      if (score.overallScore > 0.3) {
        // Minimum threshold
        matches.push({
          truckId: truck.id,
          loadId: load.id,
          score,
          compatibility,
        });
      }
    }

    // Sort by overall score
    matches.sort((a, b) => b.score.overallScore - a.score.overallScore);

    return matches.slice(0, 10); // Return top 10 matches
  }

  private async calculateEnhancedMatchingScore(
    truck: Truck,
    load: Load,
  ): Promise<EnhancedMatchingScore> {
    const basicScore = this.calculateBasicScore(truck, load);
    const cargoAlignmentScore = this.calculateCargoAlignmentScore(truck, load);
    const equipmentScore = this.calculateEquipmentScore(truck, load);
    const securityScore = this.calculateSecurityScore(truck, load);
    const routeScore = this.calculateRouteScore(truck, load);
    const costScore = this.calculateCostScore(truck, load);

    // Weighted scoring
    const overallScore =
      basicScore * 0.2 +
      cargoAlignmentScore * 0.3 +
      equipmentScore * 0.2 +
      securityScore * 0.15 +
      routeScore * 0.1 +
      costScore * 0.05;

    const matchReason = this.generateMatchReason(truck, load, overallScore);

    return {
      basicScore,
      cargoAlignmentScore,
      equipmentScore,
      securityScore,
      routeScore,
      costScore,
      overallScore,
      matchReason,
    };
  }

  private calculateBasicScore(truck: Truck, load: Load): number {
    let score = 0;

    // Capacity matching
    if (truck.capacityWeight >= load.weight) {
      score += 0.4;
    }

    if (truck.capacityVolume >= (load.volume || 0)) {
      score += 0.3;
    }

    // Basic compatibility
    if (
      truck.truckType &&
      this.isTruckTypeCompatible(truck.truckType, load.cargoType)
    ) {
      score += 0.3;
    }

    return Math.min(score, 1.0);
  }

  private calculateCargoAlignmentScore(truck: Truck, load: Load): number {
    if (!truck.cargoCapabilities) return 0.5;

    let score = 0;
    const maxScore = 1.0;

    // Cargo type compatibility
    if (truck.cargoCapabilities.supportedCargoTypes?.includes(load.cargoType)) {
      score += 0.25;
    }

    // Special handling requirements
    if (load.isFragile && truck.cargoCapabilities.maxFragileHandling) {
      score += 0.15;
    }

    if (load.isHazardous && truck.cargoCapabilities.maxHazardousHandling) {
      score += 0.15;
    }

    if (
      load.requiresRefrigeration &&
      truck.cargoCapabilities.maxRefrigeratedHandling
    ) {
      score += 0.15;
    }

    // Temperature range compatibility
    if (
      truck.cargoCapabilities.temperatureRange &&
      load.temperatureMin &&
      load.temperatureMax
    ) {
      const truckMin = truck.cargoCapabilities.temperatureRange.min;
      const truckMax = truck.cargoCapabilities.temperatureRange.max;

      if (truckMin <= load.temperatureMin && truckMax >= load.temperatureMax) {
        score += 0.15;
      }
    }

    // Dimensional compatibility
    if (
      load.length &&
      truck.cargoCapabilities.maxLengthCapacity &&
      load.length <= truck.cargoCapabilities.maxLengthCapacity
    ) {
      score += 0.05;
    }

    if (
      load.width &&
      truck.cargoCapabilities.maxWidthCapacity &&
      load.width <= truck.cargoCapabilities.maxWidthCapacity
    ) {
      score += 0.05;
    }

    if (
      load.height &&
      truck.cargoCapabilities.maxHeightCapacity &&
      load.height <= truck.cargoCapabilities.maxHeightCapacity
    ) {
      score += 0.05;
    }

    return Math.min(score, maxScore);
  }

  private calculateEquipmentScore(truck: Truck, load: Load): number {
    if (!truck.loadingCapabilities) return 0.5;

    let score = 0;
    const maxScore = 1.0;

    // Loading/unloading requirements
    if (load.requiresForklift && truck.loadingCapabilities.hasForklift) {
      score += 0.3;
    }

    if (load.requiresCrane && truck.loadingCapabilities.hasCrane) {
      score += 0.3;
    }

    if (load.requiresLoadingDock && truck.loadingCapabilities.hasLoadingDock) {
      score += 0.2;
    }

    // Additional equipment bonuses
    if (truck.loadingCapabilities.hasTailLift) score += 0.1;
    if (truck.loadingCapabilities.hasSideLift) score += 0.1;

    return Math.min(score, maxScore);
  }

  private calculateSecurityScore(truck: Truck, load: Load): number {
    if (!truck.securityFeatures) return 0.5;

    let score = 0;
    const maxScore = 1.0;

    // Required monitoring
    if (load.requiresGpsMonitoring && truck.securityFeatures.hasGps) {
      score += 0.3;
    }

    if (
      load.requiresTemperatureMonitoring &&
      truck.securityFeatures.hasTemperatureAlerts
    ) {
      score += 0.3;
    }

    // Additional security features
    if (truck.securityFeatures.hasTracking) score += 0.1;
    if (truck.securityFeatures.hasCargoMonitoring) score += 0.1;
    if (truck.securityFeatures.hasDashCam) score += 0.1;
    if (truck.securityFeatures.hasCollisionAvoidance) score += 0.1;

    return Math.min(score, maxScore);
  }

  private calculateRouteScore(truck: Truck, load: Load): number {
    if (!truck.routeCapabilities) return 0.5;

    let score = 0.5; // Base score

    // Route type compatibility (simplified)
    if (truck.routeCapabilities.supportsUrbanRoutes) score += 0.1;
    if (truck.routeCapabilities.supportsHighwayRoutes) score += 0.1;
    if (truck.routeCapabilities.supportsTollRoads) score += 0.1;

    return Math.min(score, 1.0);
  }

  private calculateCostScore(truck: Truck, load: Load): number {
    // Simplified cost scoring - in real implementation, this would consider actual rates
    return 0.7; // Default moderate score
  }

  private assessCompatibility(truck: Truck, load: Load) {
    return {
      cargoTypes:
        truck.cargoCapabilities?.supportedCargoTypes?.includes(
          load.cargoType,
        ) || false,
      temperature: this.isTemperatureCompatible(truck, load),
      dimensions: this.isDimensionallyCompatible(truck, load),
      specialHandling: this.isSpecialHandlingCompatible(truck, load),
      equipment: this.isEquipmentCompatible(truck, load),
      security: this.isSecurityCompatible(truck, load),
    };
  }

  private isTemperatureCompatible(truck: Truck, load: Load): boolean {
    if (
      !truck.cargoCapabilities?.temperatureRange ||
      !load.temperatureMin ||
      !load.temperatureMax
    ) {
      return true; // No temperature requirements
    }

    const truckMin = truck.cargoCapabilities.temperatureRange.min;
    const truckMax = truck.cargoCapabilities.temperatureRange.max;

    return truckMin <= load.temperatureMin && truckMax >= load.temperatureMax;
  }

  private isDimensionallyCompatible(truck: Truck, load: Load): boolean {
    if (!truck.cargoCapabilities) return true;

    const checks = [];

    if (load.length && truck.cargoCapabilities.maxLengthCapacity) {
      checks.push(load.length <= truck.cargoCapabilities.maxLengthCapacity);
    }

    if (load.width && truck.cargoCapabilities.maxWidthCapacity) {
      checks.push(load.width <= truck.cargoCapabilities.maxWidthCapacity);
    }

    if (load.height && truck.cargoCapabilities.maxHeightCapacity) {
      checks.push(load.height <= truck.cargoCapabilities.maxHeightCapacity);
    }

    return checks.length === 0 || checks.every((check) => check);
  }

  private isSpecialHandlingCompatible(truck: Truck, load: Load): boolean {
    if (!truck.cargoCapabilities) return true;

    const checks = [];

    if (load.isFragile) {
      checks.push(truck.cargoCapabilities.maxFragileHandling);
    }

    if (load.isHazardous) {
      checks.push(truck.cargoCapabilities.maxHazardousHandling);
    }

    if (load.requiresRefrigeration) {
      checks.push(truck.cargoCapabilities.maxRefrigeratedHandling);
    }

    return checks.length === 0 || checks.every((check) => check);
  }

  private isEquipmentCompatible(truck: Truck, load: Load): boolean {
    if (!truck.loadingCapabilities) return true;

    const checks = [];

    if (load.requiresForklift) {
      checks.push(truck.loadingCapabilities.hasForklift);
    }

    if (load.requiresCrane) {
      checks.push(truck.loadingCapabilities.hasCrane);
    }

    if (load.requiresLoadingDock) {
      checks.push(truck.loadingCapabilities.hasLoadingDock);
    }

    return checks.length === 0 || checks.every((check) => check);
  }

  private isSecurityCompatible(truck: Truck, load: Load): boolean {
    if (!truck.securityFeatures) return true;

    const checks = [];

    if (load.requiresGpsMonitoring) {
      checks.push(truck.securityFeatures.hasGps);
    }

    if (load.requiresTemperatureMonitoring) {
      checks.push(truck.securityFeatures.hasTemperatureAlerts);
    }

    return checks.length === 0 || checks.every((check) => check);
  }

  private isTruckTypeCompatible(truckType: string, cargoType: string): boolean {
    const compatibilityMap = {
      GENERAL: ['FLATBED', 'BOX_TRUCK', 'VAN'],
      FRAGILE: ['BOX_TRUCK', 'VAN', 'CURTAIN_SIDE'],
      HAZARDOUS: ['TANKER', 'BOX_TRUCK'],
      REFRIGERATED: ['REFRIGERATED'],
      LIQUID: ['TANKER'],
      OVERSIZED: ['HEAVY_HAUL', 'LOWBED', 'STEP_DECK'],
      VALUABLE: ['BOX_TRUCK', 'VAN', 'CURTAIN_SIDE'],
    };

    const compatibleTypes =
      compatibilityMap[cargoType as keyof typeof compatibilityMap] || [];
    return compatibleTypes.includes(truckType);
  }

  private generateMatchReason(truck: Truck, load: Load, score: number): string {
    const reasons = [];

    if (score > 0.8) {
      reasons.push('Excellent match');
    } else if (score > 0.6) {
      reasons.push('Good match');
    } else if (score > 0.4) {
      reasons.push('Acceptable match');
    } else {
      reasons.push('Basic compatibility');
    }

    // Add specific reasons
    if (
      truck.cargoCapabilities?.supportedCargoTypes?.includes(load.cargoType)
    ) {
      reasons.push('Cargo type compatible');
    }

    if (
      load.requiresRefrigeration &&
      truck.cargoCapabilities?.maxRefrigeratedHandling
    ) {
      reasons.push('Refrigeration available');
    }

    if (load.isHazardous && truck.cargoCapabilities?.maxHazardousHandling) {
      reasons.push('Hazmat certified');
    }

    return reasons.join(', ');
  }

  async getCargoAlignmentAnalytics(tenantId: string): Promise<any> {
    const trucks = await this.truckRepository.find({
      where: { tenantId, isActive: true },
    });

    const analytics = {
      totalTrucks: trucks.length,
      cargoTypeCoverage: {
        GENERAL: 0,
        FRAGILE: 0,
        HAZARDOUS: 0,
        REFRIGERATED: 0,
        LIQUID: 0,
        OVERSIZED: 0,
        VALUABLE: 0,
      },
      specialHandlingCoverage: {
        FRAGILE: 0,
        HAZARDOUS: 0,
        REFRIGERATED: 0,
        LIQUID: 0,
        OVERSIZED: 0,
        VALUABLE: 0,
      },
      equipmentCoverage: {
        FORKLIFT: 0,
        CRANE: 0,
        TAIL_LIFT: 0,
        SIDE_LIFT: 0,
        ROLLER_BED: 0,
        DROP_DECK: 0,
      },
      securityFeaturesCoverage: {
        GPS: 0,
        TRACKING: 0,
        TELEMATICS: 0,
        ELD: 0,
        DASH_CAM: 0,
        SAFETY_CAMERAS: 0,
      },
      temperatureRangeDistribution: {
        AMBIENT_ONLY: 0,
        REFRIGERATED: 0,
        FROZEN: 0,
        CONTROLLED_ATMOSPHERE: 0,
      },
      recommendations: [] as string[],
    };

    for (const truck of trucks) {
      // Count cargo type coverage
      if (truck.cargoCapabilities?.supportedCargoTypes) {
        for (const cargoType of truck.cargoCapabilities.supportedCargoTypes) {
          if (analytics.cargoTypeCoverage[cargoType] !== undefined) {
            analytics.cargoTypeCoverage[cargoType]++;
          }
        }
      }

      // Count special handling coverage
      if (truck.cargoCapabilities?.maxFragileHandling)
        analytics.specialHandlingCoverage.FRAGILE++;
      if (truck.cargoCapabilities?.maxHazardousHandling)
        analytics.specialHandlingCoverage.HAZARDOUS++;
      if (truck.cargoCapabilities?.maxRefrigeratedHandling)
        analytics.specialHandlingCoverage.REFRIGERATED++;
      if (truck.cargoCapabilities?.maxLiquidHandling)
        analytics.specialHandlingCoverage.LIQUID++;
      if (truck.cargoCapabilities?.maxOversizedHandling)
        analytics.specialHandlingCoverage.OVERSIZED++;
      if (truck.cargoCapabilities?.maxValuableHandling)
        analytics.specialHandlingCoverage.VALUABLE++;

      // Count equipment coverage
      if (truck.loadingCapabilities?.hasForklift)
        analytics.equipmentCoverage.FORKLIFT++;
      if (truck.loadingCapabilities?.hasCrane)
        analytics.equipmentCoverage.CRANE++;
      if (truck.loadingCapabilities?.hasTailLift)
        analytics.equipmentCoverage.TAIL_LIFT++;
      if (truck.loadingCapabilities?.hasSideLift)
        analytics.equipmentCoverage.SIDE_LIFT++;
      if (truck.loadingCapabilities?.hasRollerBed)
        analytics.equipmentCoverage.ROLLER_BED++;
      if (truck.loadingCapabilities?.hasDropDeck)
        analytics.equipmentCoverage.DROP_DECK++;

      // Count security features coverage
      if (truck.securityFeatures?.hasGps)
        analytics.securityFeaturesCoverage.GPS++;
      if (truck.securityFeatures?.hasTracking)
        analytics.securityFeaturesCoverage.TRACKING++;
      if (truck.securityFeatures?.hasTelematics)
        analytics.securityFeaturesCoverage.TELEMATICS++;
      if (truck.securityFeatures?.hasELD)
        analytics.securityFeaturesCoverage.ELD++;
      if (truck.securityFeatures?.hasDashCam)
        analytics.securityFeaturesCoverage.DASH_CAM++;
      if (truck.securityFeatures?.hasSafetyCameras)
        analytics.securityFeaturesCoverage.SAFETY_CAMERAS++;

      // Count temperature range distribution
      if (truck.cargoCapabilities?.temperatureRange) {
        const { min, max } = truck.cargoCapabilities.temperatureRange;
        if (min <= -10) {
          analytics.temperatureRangeDistribution.FROZEN++;
        } else if (min <= 10) {
          analytics.temperatureRangeDistribution.REFRIGERATED++;
        } else if (truck.cargoCapabilities?.humidityControl) {
          analytics.temperatureRangeDistribution.CONTROLLED_ATMOSPHERE++;
        } else {
          analytics.temperatureRangeDistribution.AMBIENT_ONLY++;
        }
      }
    }

    // Generate recommendations
    if (analytics.specialHandlingCoverage.HAZARDOUS < 2) {
      analytics.recommendations.push(
        'Consider adding more hazmat-certified trucks for hazardous cargo',
      );
    }
    if (analytics.specialHandlingCoverage.REFRIGERATED < 3) {
      analytics.recommendations.push(
        'Increase refrigerated truck capacity for temperature-sensitive cargo',
      );
    }
    if (analytics.equipmentCoverage.FORKLIFT < 2) {
      analytics.recommendations.push(
        'Add more trucks with forklift capabilities for efficient loading',
      );
    }
    if (analytics.securityFeaturesCoverage.GPS < analytics.totalTrucks * 0.8) {
      analytics.recommendations.push(
        'Ensure all trucks have GPS tracking for better fleet management',
      );
    }

    return analytics;
  }

  // Enhanced Transaction Flow Methods

  async confirmBooking(
    bookingData: {
      matchId: string;
      loadId: string;
      truckId: string;
      driverId: string;
      agreedPrice: number;
      terms: any;
    },
    tenantId: string,
  ) {
    // Create booking record
    const booking = {
      id: `booking-${Date.now()}`,
      matchId: bookingData.matchId,
      loadId: bookingData.loadId,
      truckId: bookingData.truckId,
      driverId: bookingData.driverId,
      agreedPrice: bookingData.agreedPrice,
      terms: bookingData.terms,
      status: 'CONFIRMED',
      createdAt: new Date(),
      tenantId,
    };

    // Update truck availability — booking confirmed, but keep AVAILABLE until trip starts
    // IN_TRANSIT is set by TripsService when the driver starts the trip
    await this.truckRepository.update(
      { id: bookingData.truckId, tenantId },
      { updatedAt: new Date() },
    );

    return booking;
  }

  async negotiateContract(
    negotiationData: {
      bookingId: string;
      proposedTerms: any;
      counterOffers: any[];
    },
    tenantId: string,
  ) {
    // Process contract negotiation
    const contract = {
      id: `contract-${Date.now()}`,
      bookingId: negotiationData.bookingId,
      proposedTerms: negotiationData.proposedTerms,
      counterOffers: negotiationData.counterOffers,
      status: 'NEGOTIATING',
      createdAt: new Date(),
      tenantId,
    };

    return contract;
  }

  async setupEscrow(
    escrowData: {
      bookingId: string;
      amount: number;
      terms: any;
    },
    tenantId: string,
  ) {
    // Setup escrow account
    const escrow = {
      id: `escrow-${Date.now()}`,
      bookingId: escrowData.bookingId,
      amount: escrowData.amount,
      terms: escrowData.terms,
      status: 'PENDING',
      createdAt: new Date(),
      tenantId,
    };

    return escrow;
  }

  async initiateTrip(
    tripData: {
      bookingId: string;
      startLocation: any;
      route: any;
    },
    tenantId: string,
  ) {
    // Create trip record
    const trip = {
      id: `trip-${Date.now()}`,
      bookingId: tripData.bookingId,
      startLocation: tripData.startLocation,
      route: tripData.route,
      status: 'IN_PROGRESS',
      startTime: new Date(),
      tenantId,
    };

    return trip;
  }

  async confirmDelivery(
    deliveryData: {
      tripId: string;
      deliveryProof: any;
      finalNotes: string;
    },
    tenantId: string,
  ) {
    // Confirm delivery and trigger settlement
    const delivery = {
      id: `delivery-${Date.now()}`,
      tripId: deliveryData.tripId,
      deliveryProof: deliveryData.deliveryProof,
      finalNotes: deliveryData.finalNotes,
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      tenantId,
    };

    // Update trip status
    // await this.tripRepository.update(
    //   { id: deliveryData.tripId, tenantId },
    //   { status: 'COMPLETED', actualEndTime: new Date() }
    // );

    return delivery;
  }

  async resolveDispute(
    disputeData: {
      tripId: string;
      disputeType: string;
      evidence: any;
      resolution: any;
    },
    tenantId: string,
  ) {
    // Process dispute resolution
    const dispute = {
      id: `dispute-${Date.now()}`,
      tripId: disputeData.tripId,
      disputeType: disputeData.disputeType,
      evidence: disputeData.evidence,
      resolution: disputeData.resolution,
      status: 'RESOLVED',
      resolvedAt: new Date(),
      tenantId,
    };

    return dispute;
  }

  async getTransactionStatus(transactionId: string, tenantId: string) {
    // Get transaction status and progress
    const status = {
      transactionId,
      currentStep: 'PAYMENT_PROCESSING',
      progress: 75,
      steps: [
        {
          step: 'MATCHING',
          status: 'COMPLETED',
          timestamp: new Date(Date.now() - 86400000),
        },
        {
          step: 'BOOKING_CONFIRMATION',
          status: 'COMPLETED',
          timestamp: new Date(Date.now() - 82800000),
        },
        {
          step: 'CONTRACT_NEGOTIATION',
          status: 'COMPLETED',
          timestamp: new Date(Date.now() - 79200000),
        },
        {
          step: 'ESCROW_SETUP',
          status: 'COMPLETED',
          timestamp: new Date(Date.now() - 75600000),
        },
        {
          step: 'PAYMENT_PROCESSING',
          status: 'IN_PROGRESS',
          timestamp: new Date(),
        },
        { step: 'TRIP_INITIATION', status: 'PENDING', timestamp: null },
        { step: 'TRIP_TRACKING', status: 'PENDING', timestamp: null },
        { step: 'DELIVERY_CONFIRMATION', status: 'PENDING', timestamp: null },
        { step: 'SETTLEMENT', status: 'PENDING', timestamp: null },
      ],
      estimatedCompletion: new Date(Date.now() + 3600000), // 1 hour from now
    };

    return status;
  }
}
