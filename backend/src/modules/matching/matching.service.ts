// --- Consolidated Enhanced Matching Service ---
// Integrates features from AIMatchingEngineService and EnhancedMatchingService
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getEnvConfig } from '../../config/env.config';
import {
  Load,
  LoadStatus,
  CargoType,
  UrgencyLevel,
} from '../../entities/load.entity';
import {
  Truck,
  VehicleStatus,
  TruckType,
  FuelType,
} from '../../entities/truck.entity';
import { Driver, DriverStatus } from '../../entities/driver.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Location } from '../../entities/location.entity';
import { LoadMatch, MatchStatus } from '../../entities/load-match.entity';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { MatchRequestDto } from './dto/match-request.dto';
import { MatchResultDto } from './dto/match-result.dto';
import { User, UserRole } from '../../entities/user.entity';
import { TenantSubscription, SubscriptionStatus } from '../../entities/tenant-subscription.entity';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { CreditService } from '../../services/credit.service';
import { Route } from '../../entities/route.entity';
import { RouteTruck } from '../../entities/route-truck.entity';
import { RouteType } from '../../entities/route.entity';

// Enhanced matching algorithms
import { HungarianAlgorithm } from './algorithms/hungarian.algorithm';
import { GeneticAlgorithm } from './algorithms/genetic.algorithm';
import { TopsisAlgorithm } from './algorithms/topsis.algorithm';

// Freight rate constants (business logic — not environment config)
import {
  BASE_COST_USD_PER_KM,
  COST_COMPONENTS_USD_PER_KM,
  REGIONAL_MULTIPLIERS,
  DEFAULT_REGIONAL_MULTIPLIER,
  TRUCK_SURCHARGES,
  CARRIER_MARKUP_OVER_COST,
  MARKET_BENCHMARK_MARKUP,
  MINIMUM_COST_USD,
} from './constants/freight-rates.constants';

// Enhanced services for consolidated matching
import { CacheService } from './services/cache.service';
import { MarketIntelligenceService } from './services/market-intelligence.service';
import { MLPredictionService } from './services/ml-prediction.service';
import { NotificationService } from '../notifications/notification.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationChannel,
  EntityType,
} from '../../entities/notification.entity';
import { EmailService } from '../auth/services/email.service';

// =====================================================
// CONSOLIDATED MATCHING INTERFACES
// =====================================================

/** ML-based predictions for match quality */
export interface MLPrediction {
  successProbability: number;
  estimatedDeliveryTime: number;
  riskScore: number;
  recommendedPrice: number;
  confidence: number;
}

/** Metrics tracking for matching performance */
export interface MatchingMetrics {
  totalMatches: number;
  averageScore: number;
  matchRate: number;
  responseTime: number;
  cacheHitRate: number;
  algorithmVersion: string;
}

/** Environmental impact assessment */
export interface EnvironmentalImpact {
  co2Emissions: number;
  fuelConsumption: number;
  ecoScore: number;
}

/** Risk assessment for matches */
export interface RiskAssessment {
  overallRisk: number;
  equipmentRisk: number;
  capacityRisk: number;
  ratingRisk: number;
  availabilityRisk: number;
  costRisk: number;
  riskFactors: string[];
  mitigationStrategies: string[];
}

/** Route optimization results */
export interface RouteOptimization {
  totalDistance: number;
  estimatedTime: number;
  fuelConsumption: number;
  costSavings: number;
}

/** Market context for dynamic pricing and scoring */
export interface MarketContext {
  currentDemand: number;
  averageCost: number;
  capacityUtilization: number;
  seasonalMultiplier: number;
  marketBalance: 'BALANCED' | 'TRUCK_SURPLUS' | 'LOAD_SURPLUS';
}

export enum MatchingAlgorithm {
  WEIGHTED_SCORE = 'WEIGHTED_SCORE',
  HUNGARIAN = 'HUNGARIAN',
  GENETIC = 'GENETIC',
  TOPSIS = 'TOPSIS',
  HYBRID = 'HYBRID',
}

// =====================================================
// SMART MATCHING ENGINE v3 - 12 DIMENSION SCORING MODEL
// =====================================================
// Per v3 Specification:
// 1. Capacity (30%)     - Weight/volume utilization fit
// 2. Equipment (25%)    - Forklift, crane, reefer, hazmat compatibility
// 3. Distance (20%)     - Truck proximity to pickup location
// 4. Availability (15%) - Truck status and next available time
// 5. GPS Tracking (10%) - GPS availability for cargo monitoring
// 6. Temperature (Dynamic) - Refrigeration match for temp-controlled cargo
// 7. Security (Dynamic)    - GPS monitoring, insurance, camera systems
// 8. Route (Dynamic)       - Road type clearance, escort requirements
// 9. Time (Dynamic)        - Urgency vs carrier availability window
// 10. Experience (Dynamic) - Track record with specific cargo type
// 11. Rating (Dynamic)     - Historical performance score from prior trips
// 12. Cost (Dynamic)       - Market-competitive pricing alignment
// =====================================================

export interface MatchingFactors {
  capacityScore: number;       // 30% - Weight & volume utilization
  equipmentScore: number;        // 25% - Required equipment compatibility
  distanceScore: number;         // 20% - Proximity to pickup location
  availabilityScore: number;     // 15% - Truck availability status
  gpsTrackingScore: number;      // 10% - GPS availability for monitoring
  // Dynamic dimensions (0-35% based on cargo type)
  temperatureScore: number;      // Dynamic - Temperature control match
  securityScore: number;         // Dynamic - Security features match
  routeCompatibilityScore: number; // Dynamic - Route clearance/escort
  timeScore: number;             // Dynamic - Urgency vs availability
  experienceScore: number;       // Dynamic - Driver cargo experience
  ratingScore: number;           // Dynamic - Historical performance
  costScore: number;             // Dynamic - Price competitiveness
}

export interface DynamicWeights {
  // Base weights (must sum to 1.0)
  capacity: number;         // 30%
  equipment: number;        // 25%
  distance: number;         // 20%
  availability: number;     // 15%
  gpsTracking: number;      // 10%
  // Dynamic dimensions (initialized to 0, adjusted based on cargo)
  temperature: number;      // Dynamic: 0-35%
  security: number;         // Dynamic: 0-20%
  routeCompatibility: number; // Dynamic: 0-15%
  time: number;             // Dynamic: 0-20%
  experience: number;       // Dynamic: 0-15%
  rating: number;           // Dynamic: 0-15%
  cost: number;             // Dynamic: 0-15%
}

// High-value cargo threshold in KES
const HIGH_VALUE_THRESHOLD_KES = 500000;

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  private readonly hungarianAlgorithm: HungarianAlgorithm;
  private geneticAlgorithm: GeneticAlgorithm;
  private readonly topsisAlgorithm: TopsisAlgorithm;

  // =====================================================
  // CONSOLIDATED FEATURES FROM AI & ENHANCED SERVICES
  // =====================================================

  /** In-memory cache for fast repeated lookups */
  private readonly memoryCache = new Map<string, { data: any; expiry: number }>();

  /** Matching performance metrics */
  private readonly metrics: MatchingMetrics = {
    totalMatches: 0,
    averageScore: 0,
    matchRate: 0,
    responseTime: 0,
    cacheHitRate: 0,
    algorithmVersion: 'v3.0-consolidated',
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
    @InjectRepository(LoadMatch)
    private readonly loadMatchRepository: Repository<LoadMatch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TenantSubscription)
    private readonly tenantSubscriptionRepository: Repository<TenantSubscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(RouteTruck)
    private readonly routeTruckRepository: Repository<RouteTruck>,
    // Enhanced services for consolidated matching
    private readonly cacheService: CacheService,
    private readonly marketIntelligence: MarketIntelligenceService,
    private readonly mlPrediction: MLPredictionService,
    private readonly notificationService: NotificationService,
    private readonly creditService: CreditService,
    private readonly eventEmitter: EventEmitter2,
    private readonly emailService: EmailService,
  ) {
    this.hungarianAlgorithm = new HungarianAlgorithm();
    this.geneticAlgorithm = new GeneticAlgorithm([], []);
    this.topsisAlgorithm = new TopsisAlgorithm();
    this.logger.log('🚀 Consolidated MatchingService initialized (v3.1 - Route Matching Enabled)');
  }

  async findMatches(
    matchRequestDto: MatchRequestDto,
    tenantId: string,
  ): Promise<MatchResultDto[]> {
    try {
      console.log('🔍 MatchingService.findMatches called');
      console.log(
        '📋 MatchRequestDto:',
        JSON.stringify(matchRequestDto, null, 2),
      );
      console.log('🏢 TenantId:', tenantId);

      // Validate input
      if (!matchRequestDto || !matchRequestDto.loadId) {
        console.error('❌ Invalid matchRequestDto - missing loadId');
        throw new BadRequestException('Load ID is required');
      }

      if (!tenantId) {
        console.error('❌ Tenant ID is missing');
        throw new BadRequestException('Tenant ID is required');
      }

      console.log(
        '🔍 Looking for load:',
        matchRequestDto.loadId,
        'in tenant:',
        tenantId,
      );

      // Get the load details
      // Note: pickupLocation and deliveryLocation are getters, not relations
      // They are computed from the locations JSONB array
      const load = await this.loadRepository.findOne({
        where: { id: matchRequestDto.loadId, tenantId },
        // No relations needed - locations are stored in JSONB array
      });

      console.log('📦 Load found:', load ? 'Yes' : 'No');
      if (load) {
        console.log('📦 Load details:', {
          id: load.id,
          weight: load.weight,
          cargoType: load.cargoType,
          status: load.status,
          hasLocations: !!load.locations && load.locations.length > 0,
          locationsCount: load.locations?.length || 0,
          pickupLocation: load.pickupLocation ? 'Yes' : 'No',
          deliveryLocation: load.deliveryLocation ? 'Yes' : 'No',
        });

        // Log location details if they exist
        if (load.locations && load.locations.length > 0) {
          console.log(
            '📍 Load locations:',
            load.locations.map((loc) => ({
              type: loc.type,
              sequence: loc.sequence,
              hasCoordinates: !!loc.locationData?.coordinates,
              address: loc.locationData?.address || 'N/A',
            })),
          );
        } else {
          console.warn(
            '⚠️ Load has no locations - this may affect distance calculations but matching will still work',
          );
        }
      }

      if (!load) {
        console.error('❌ Load not found:', matchRequestDto.loadId);
        throw new NotFoundException(
          `Load not found with ID: ${matchRequestDto.loadId}`,
        );
      }

      // Check if load status allows matching
      const allowedStatuses = [
        LoadStatus.CREATED,
        LoadStatus.PUBLISHED,
        LoadStatus.PENDING_CONFIRMATION,
      ];

      if (!allowedStatuses.includes(load.status)) {
        console.log('⚠️ Load status does not allow matching:', {
          loadId: load.id,
          status: load.status,
          allowedStatuses,
        });
        // Don't throw error, just return empty matches
        // This allows the frontend to show "no matches" instead of an error
        return [];
      }

      // Validate load has required fields
      if (!load.weight || load.weight <= 0) {
        console.error('❌ Load weight is invalid:', load.weight);
        throw new BadRequestException(
          'Load weight is required and must be greater than 0',
        );
      }

      // Log delivery date info (but don't filter - expired loads might still need trucks)
      if (load.deliveryDate) {
        const deliveryDate = new Date(load.deliveryDate);
        const now = new Date();
        const isExpired = deliveryDate < now;
        console.log('📅 Delivery date check:', {
          deliveryDate: deliveryDate.toISOString(),
          now: now.toISOString(),
          isExpired,
          daysUntilDelivery: isExpired
            ? Math.floor(
              (now.getTime() - deliveryDate.getTime()) /
              (1000 * 60 * 60 * 24),
            )
            : Math.floor(
              (deliveryDate.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
            ),
        });
      }

      console.log('🚛 Getting available trucks...');
      console.log('📋 Load details for matching:', {
        id: load.id,
        weight: load.weight,
        weightType: typeof load.weight,
        cargoType: load.cargoType,
        requiresRefrigeration: load.requiresRefrigeration,
        isHazardous: load.isHazardous,
        requiresForklift: load.requiresForklift,
      });

      // Get available trucks with enhanced filtering
      const availableTrucks = await this.getAvailableTrucks(
        load,
        matchRequestDto,
        tenantId,
      );

      console.log(`✅ Found ${availableTrucks.length} available trucks`);

      if (availableTrucks.length === 0) {
        console.log('⚠️ No trucks found. Checking all trucks in tenant...');
        // Debug: Check all trucks in tenant regardless of status using query builder
        const debugQuery = this.truckRepository
          .createQueryBuilder('truck')
          .where('truck.tenantId = :tenantId', { tenantId })
          .select([
            'truck.id',
            'truck.plateNumber',
            'truck.capacityWeight',
            'truck.status',
            'truck.isActive',
            'truck.tenantId',
          ]);

        const allTrucks = await debugQuery.getMany();
        console.log(`📊 Total trucks in tenant: ${allTrucks.length}`);
        allTrucks.forEach((truck, index) => {
          // Compare truck capacity (in kg) with load weight (in kg)
          const truckCapacityKg = Number(truck.capacityWeight);
          const loadWeightKg = Number(load.weight);
          const canCarry =
            truckCapacityKg && loadWeightKg && loadWeightKg <= truckCapacityKg;
          console.log(`🚛 All Truck ${index + 1}:`, {
            plateNumber: truck.plateNumber,
            capacityWeightKg: truckCapacityKg,
            status: truck.status,
            isActive: truck.isActive,
            loadWeightKg: loadWeightKg,
            canCarryLoad: canCarry,
            reason: !canCarry
              ? !truckCapacityKg
                ? 'No capacity'
                : !loadWeightKg
                  ? 'No load weight'
                  : loadWeightKg > truckCapacityKg
                    ? 'Too small (load exceeds capacity)'
                    : 'Unknown'
              : 'Can carry',
          });
        });
      }

      if (availableTrucks.length === 0) {
        console.log('⚠️ No available trucks found');
        return [];
      }

      // Apply matching algorithm based on request or default
      const algorithm =
        matchRequestDto.algorithm || MatchingAlgorithm.WEIGHTED_SCORE;
      let matches: MatchResultDto[] = [];

      switch (algorithm) {
        case MatchingAlgorithm.HUNGARIAN:
          matches = await this.applyHungarianAlgorithm(
            load,
            availableTrucks,
            matchRequestDto,
          );
          break;
        case MatchingAlgorithm.GENETIC:
          matches = await this.applyGeneticAlgorithm(
            load,
            availableTrucks,
            matchRequestDto,
          );
          break;
        case MatchingAlgorithm.TOPSIS:
          matches = await this.applyTopsisAlgorithm(
            load,
            availableTrucks,
            matchRequestDto,
          );
          break;
        case MatchingAlgorithm.HYBRID:
          matches = await this.applyHybridAlgorithm(
            load,
            availableTrucks,
            matchRequestDto,
          );
          break;
        default:
          matches = await this.applyWeightedScoring(
            load,
            availableTrucks,
            matchRequestDto,
          );
      }

      // Apply post-processing filters
      matches = this.applyPostProcessingFilters(matches, matchRequestDto);

      // Sort by overall score and limit results
      matches.sort((a, b) => b.overallScore - a.overallScore);

      // ─────────────────────────────────────────────────────────────
      // MINIMUM 3 QUALIFIED TRUCKS GUARANTEE
      // If strict post-processing left fewer than 3 results, re-score
      // ALL available trucks without the optional filters so the cargo
      // owner always has at least 3 choices to compare.
      // ─────────────────────────────────────────────────────────────
      const MIN_CHOICES = 3;
      if (matches.length < MIN_CHOICES && availableTrucks.length >= MIN_CHOICES) {
        this.logger.warn(
          `⚠️ Only ${matches.length} matches after filters — relaxing optional filters to guarantee ${MIN_CHOICES} choices`,
        );
        // Re-score without optional cost / price filters but keeping
        // hard-requirement filters (refrigeration, hazmat, lift-gate).
        const relaxedCriteria: MatchRequestDto = {
          ...matchRequestDto,
          maxPrice: undefined,
          minRating: undefined,
        };
        let allScored = await this.applyWeightedScoring(load, availableTrucks, relaxedCriteria);
        allScored = this.applyPostProcessingFilters(allScored, {
          ...relaxedCriteria,
          // Keep only the hard equipment requirements
          requiresRefrigeration: matchRequestDto.requiresRefrigeration,
          requiresHazmat: matchRequestDto.requiresHazmat,
          requiresLiftGate: matchRequestDto.requiresLiftGate,
        } as MatchRequestDto);
        allScored.sort((a, b) => b.overallScore - a.overallScore);

        // Merge: keep already-filtered results, then fill up to MIN_CHOICES
        const existingIds = new Set(matches.map(m => m.truckId));
        for (const m of allScored) {
          if (matches.length >= MIN_CHOICES) break;
          if (!existingIds.has(m.truckId)) {
            matches.push(m);
            existingIds.add(m.truckId);
          }
        }
        // Re-sort merged list
        matches.sort((a, b) => b.overallScore - a.overallScore);
        this.logger.log(`✅ After relaxation: ${matches.length} matches available`);
      }

      // Persist top matches for Truck Owners to view
      if (matches.length > 0) {
        // FR-MATCH-006 to FR-MATCH-011: Apply all enrichments by default
        matches = await this.applyAllEnrichments(matches, tenantId);
        // Re-sort after enrichment (scores may have been adjusted)
        matches.sort((a, b) => b.overallScore - a.overallScore);

        // Run in background to not block response
        this.persistMatchesForTruckOwners(matches, matchRequestDto.loadId, tenantId).catch(err =>
          this.logger.error('Background match persistence failed', err)
        );
      }

      const limit = matchRequestDto.limit || 10;
      return matches.slice(0, limit);
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Log and wrap unknown errors
      console.error('Error in findMatches service:', error);
      throw new InternalServerErrorException({
        message: 'Failed to find matches',
        error: error.message || 'An unexpected error occurred',
      });
    }
  }



  private async persistMatchesForTruckOwners(
    matches: MatchResultDto[],
    loadId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      // Filter for high quality matches (score >= 0.60) — FR-MATCH lifecycle: POTENTIAL threshold
      const highQualityMatches = matches.filter((m) => m.overallScore >= 0.6);

      // FR-MATCH lifecycle: Notify Cargo Owner of top 5 candidates only
      const top5 = highQualityMatches.slice(0, 5);

      this.logger.debug(`Persisting ${top5.length} top candidates for Load ${loadId}`);

      for (const match of top5) {
        const existing = await this.loadMatchRepository.findOne({
          where: { loadId, truckId: match.truckId },
        });

        if (!existing) {
          const entity = this.loadMatchRepository.create({
            tenantId,
            loadId,
            truckId: match.truckId,
            score: match.overallScore,
            matchDetails: match,
            status: MatchStatus.POTENTIAL,
          });
          await this.loadMatchRepository.save(entity);
        } else {
          // Update score if changed significantly
          if (Math.abs(existing.score - match.overallScore) > 0.01) {
            existing.score = match.overallScore;
            existing.matchDetails = match;
            await this.loadMatchRepository.save(existing);
          }
        }
      }

      // FR-MATCH lifecycle: Notify Cargo Owner of top candidates so they can review and select
      if (top5.length > 0) {
        const load = await this.loadRepository.findOne({ where: { id: loadId } });
        if (load?.cargoOwnerId) {
          await this.notificationService.createNotification({
            tenantId,
            recipientId: load.cargoOwnerId,
            title: 'Smart Match Candidates Ready',
            message: `${top5.length} truck${top5.length > 1 ? 's have' : ' has'} been matched to your cargo load. Review and select the best candidate.`,
            shortMessage: `${top5.length} truck match${top5.length > 1 ? 'es' : ''} found for your load`,
            notificationType: NotificationType.GENERAL,
            category: NotificationCategory.BUSINESS,
            priority: NotificationPriority.HIGH,
            channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
            entityType: EntityType.CARGO,
            entityId: loadId,
            requiresAction: true,
            actionUrl: `/dashboard/cargos/${loadId}/matches`,
            actionText: 'View Matches',
          });
          this.logger.log(`📧 Notified cargo owner ${load.cargoOwnerId} of ${top5.length} top match candidates for load ${loadId}`);
        }
      }
    } catch (err) {
      this.logger.error(`Failed to persist matches for load ${loadId}`, err);
    }
  }

  /**
   * Get all persisted matches for a cargo owner (ACCEPTED + REQUESTED + POTENTIAL).
   * POTENTIAL = top-5 candidates the engine persisted after scoring (score >= 0.60).
   * These are the candidates the cargo owner should review and select from.
   */
  async getMatchesForCargoOwner(cargoOwnerId: string, tenantId: string): Promise<any[]> {
    try {
      // Find all loads belonging to this cargo owner
      const loads = await this.loadRepository.find({
        where: { cargoOwnerId, tenantId },
        select: ['id'],
      });
      if (loads.length === 0) return [];

      const loadIds = loads.map(l => l.id);

      // Return ALL relevant statuses so cargo owner can see:
      //   POTENTIAL  — candidates waiting for the owner to pick one
      //   REQUESTED  — owner has sent a request, waiting for truck owner to respond
      //   ACCEPTED   — truck owner accepted
      const matches = await this.loadMatchRepository.find({
        where: [
          { loadId: In(loadIds), status: MatchStatus.POTENTIAL },
          { loadId: In(loadIds), status: MatchStatus.REQUESTED },
          { loadId: In(loadIds), status: MatchStatus.ACCEPTED },
        ],
        order: { score: 'DESC', createdAt: 'DESC' },
        take: 100,
      });

      // Enrich with load and truck details
      const enriched = await Promise.all(matches.map(async (match) => {
        const load = await this.loadRepository.findOne({ where: { id: match.loadId } });
        const truck = await this.truckRepository.findOne({
          where: { id: match.truckId },
          relations: ['owner', 'owner.profile'],
        });
        const tripRepo = this.loadRepository.manager.getRepository(Trip);
        const trip = await tripRepo.findOne({ where: { loadId: match.loadId } });
        return { ...match, load: load || null, truck: truck || null, trip: trip || null };
      }));

      return enriched;
    } catch (error) {
      this.logger.error(`Error finding matches for cargo owner ${cargoOwnerId}`, error);
      throw error;
    }
  }

  /**
   * Get the top-5 POTENTIAL match candidates for a specific load.
   * This is what the cargo owner sees on the load detail page —
   * the ranked shortlist they pick from before sending a request.
   */
  async getCandidatesForLoad(loadId: string, tenantId: string): Promise<any[]> {
    try {
      const candidates = await this.loadMatchRepository.find({
        where: { loadId, tenantId, status: MatchStatus.POTENTIAL },
        order: { score: 'DESC' },
        take: 5,
      });

      if (candidates.length === 0) return [];

      return Promise.all(candidates.map(async (match, index) => {
        const truck = await this.truckRepository.findOne({
          where: { id: match.truckId },
          relations: ['owner', 'owner.profile'],
        });
        return {
          ...match,
          rank: index + 1,
          truck: truck || null,
          ownerName: truck?.owner?.profile
            ? `${truck.owner.profile.firstName || ''} ${truck.owner.profile.lastName || ''}`.trim() ||
              (truck.owner.profile as any).companyName || 'Unknown Carrier'
            : 'Unknown Carrier',
          ownerVerified: (truck?.owner as any)?.status === 'ACTIVE',
        };
      }));
    } catch (error) {
      this.logger.error(`Error fetching candidates for load ${loadId}`, error);
      throw error;
    }
  }

  async getMatchesForOwner(ownerId: string): Promise<any[]> {
    try {
      // 1. Find all trucks for this owner
      const trucks = await this.truckRepository.find({
        where: { owner: { id: ownerId } },
        select: ['id'],
      });

      if (trucks.length === 0) {
        return [];
      }

      const truckIds = trucks.map((t) => t.id);

      // 2. Find matches for these trucks — only REQUESTED (cargo owner picked this truck) and ACCEPTED
      const matches = await this.loadMatchRepository.find({
        where: [
          { truckId: In(truckIds), status: MatchStatus.REQUESTED },
          { truckId: In(truckIds), status: MatchStatus.ACCEPTED },
        ],
        order: { createdAt: 'DESC', score: 'DESC' },
        take: 50,
      });

      // 3. Manually fetch and attach load and truck details for each match
      const enrichedMatches = await Promise.all(
        matches.map(async (match) => {
          // Fetch load details
          const load = await this.loadRepository.findOne({
            where: { id: match.loadId }
          });

          // Fetch truck details
          const truck = await this.truckRepository.findOne({
            where: { id: match.truckId }
          });

          // Fetch trip details if exists
          const tripRepo = this.loadRepository.manager.getRepository(Trip);
          const trip = await tripRepo.findOne({
            where: { loadId: match.loadId }
          });

          // Enhance load with origin and destination if not already set
          let enhancedLoad: any = load;
          if (load) {
            // If origin/destination are not set, extract from locations array
            if (!load.origin && load.locations && load.locations.length > 0) {
              const pickupLocation = load.locations.find(loc => loc.type === 'PICKUP');
              if (pickupLocation) {
                enhancedLoad = {
                  ...load,
                  origin: {
                    address: pickupLocation.locationData?.address || '',
                    city: pickupLocation.locationData?.city || '',
                    state: pickupLocation.locationData?.state,
                    postalCode: pickupLocation.locationData?.postalCode,
                    country: pickupLocation.locationData?.country || '',
                    lat: pickupLocation.locationData?.coordinates?.latitude,
                    lng: pickupLocation.locationData?.coordinates?.longitude,
                  }
                };
              }
            }

            if (!load.destination && load.locations && load.locations.length > 0) {
              const deliveryLocation = load.locations.find(loc => loc.type === 'DELIVERY');
              if (deliveryLocation) {
                enhancedLoad = {
                  ...enhancedLoad,
                  destination: {
                    address: deliveryLocation.locationData?.address || '',
                    city: deliveryLocation.locationData?.city || '',
                    state: deliveryLocation.locationData?.state,
                    postalCode: deliveryLocation.locationData?.postalCode,
                    country: deliveryLocation.locationData?.country || '',
                    lat: deliveryLocation.locationData?.coordinates?.latitude,
                    lng: deliveryLocation.locationData?.coordinates?.longitude,
                  }
                };
              }
            }
          }

          // Return match with attached details
          return {
            ...match,
            load: enhancedLoad || null,
            truck: truck || null,
            trip: trip || null,
          };
        })
      );

      return enrichedMatches;
    } catch (error) {
      this.logger.error(`Error finding matches for owner ${ownerId}`, error);
      throw error;
    }
  }

  async requestMatch(loadId: string, truckId: string, tenantId: string): Promise<LoadMatch> {
    this.logger.log(`📥 requestMatch called: loadId=${loadId}, truckId=${truckId}, tenantId=${tenantId}`);

    // Get load and truck details for credit validation
    const load = await this.loadRepository.findOne({
      where: { id: loadId },
    });

    const truck = await this.truckRepository.findOne({
      where: { id: truckId },
      relations: ['owner', 'owner.profile'],
    });

    if (!load) {
      throw new NotFoundException('Load not found');
    }

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    // CREDIT VALIDATION: Check if truck owner has enough credits before sending match request
    try {
      // Get tenant admin user
      const tenantAdminUser = await this.userRepository.findOne({
        where: { tenantId, role: UserRole.TENANT_ADMIN },
      });

      if (!tenantAdminUser) {
        throw new NotFoundException('Tenant admin not found for this tenant');
      }

      // Get tenant subscription plan to determine credit rates (always tenant-level)
      const tenantAdminSubscription = await this.tenantSubscriptionRepository.findOne({
        where: { 
          tenantId, 
          userId: IsNull(), // All subscriptions are tenant-level
          status: SubscriptionStatus.ACTIVE 
        },
        relations: ['plan'],
        order: { createdAt: 'DESC' },
      });

      if (!tenantAdminSubscription || !tenantAdminSubscription.plan) {
        throw new BadRequestException(
          'Tenant admin must have an active subscription plan to enable AI matching',
        );
      }

      // Calculate required credits
      const cargoWeightTons = load.weight / 1000; // Convert kg to tons
      const creditsPerTonTruckOwner = Number(tenantAdminSubscription.plan.creditsPerTonTruckOwner);
      const truckOwnerCreditsNeeded = Math.ceil(cargoWeightTons * creditsPerTonTruckOwner);

      // Check truck owner's credit balance
      const truckOwnerAccount = await this.creditService.getOrCreateCreditAccount(tenantId, truck.ownerId);

      if (truckOwnerAccount.currentBalance < truckOwnerCreditsNeeded) {
        throw new BadRequestException(
          `Truck owner has insufficient credits to accept this cargo. Required: ${truckOwnerCreditsNeeded}, Available: ${truckOwnerAccount.currentBalance}`,
        );
      }

      this.logger.log(`✅ Credit validation passed - Truck owner has sufficient credits (${truckOwnerAccount.currentBalance} >= ${truckOwnerCreditsNeeded})`);
    } catch (error) {
      this.logger.error(`❌ Credit validation failed: ${error.message}`);
      throw error;
    }

    // Check if match already exists
    let match = await this.loadMatchRepository.findOne({
      where: { loadId, truckId },
    });

    if (!match) {
      this.logger.log(`📝 Creating new match`);
      match = this.loadMatchRepository.create({
        loadId,
        truckId,
        tenantId,
        score: 1.0, // Manual selection implies high relevance
        status: MatchStatus.REQUESTED,
      });
    } else {
      this.logger.log(`📝 Updating existing match status to REQUESTED`);
      match.status = MatchStatus.REQUESTED;
    }

    const savedMatch = await this.loadMatchRepository.save(match);
    this.logger.log(`✅ Match saved successfully: ${savedMatch.id}`);

    // Emit smart.match.selected event for notification system
    try {
      if (load && truck && truck.owner) {
        // Get cargo owner's profile information
        const userProfileRepo = this.loadRepository.manager.getRepository(UserProfile);
        const cargoOwnerProfile = await userProfileRepo.findOne({
          where: { userId: load.cargoOwnerId },
        });

        const truckOwnerProfile = await userProfileRepo.findOne({
          where: { userId: truck.ownerId },
        });

        const cargoOwnerName = cargoOwnerProfile
          ? `${cargoOwnerProfile.firstName || ''} ${cargoOwnerProfile.lastName || ''}`.trim() || 'Cargo Owner'
          : 'Cargo Owner';

        const truckOwnerName = truckOwnerProfile
          ? `${truckOwnerProfile.firstName || ''} ${truckOwnerProfile.lastName || ''}`.trim() || 'Truck Owner'
          : 'Truck Owner';

        // Emit event for notification system
        this.eventEmitter.emit('smart.match.selected', {
          matchId: savedMatch.id,
          truckOwnerId: truck.ownerId,
          truckOwnerName,
          cargoOwnerId: load.cargoOwnerId,
          cargoOwnerName,
          tenantId,
          cargoTitle: load.title || load.cargoType,
          estimatedPrice: load.offeredPrice || 0,
        });

        this.logger.log(`📧 Emitted smart.match.selected event for match ${savedMatch.id}`);
      }
    } catch (eventError) {
      // Log error but don't fail the match request
      this.logger.error(`⚠️ Failed to emit smart.match.selected event: ${eventError.message}`, eventError.stack);
    }

    // Legacy notification (can be removed once event system is verified)
    try {
      if (load && truck && truck.owner) {
        const userProfileRepo = this.loadRepository.manager.getRepository(UserProfile);
        const userProfile = await userProfileRepo.findOne({
          where: { userId: load.cargoOwnerId },
        });

        let cargoOwnerFullName = 'A cargo owner';
        if (userProfile && userProfile.firstName) {
            cargoOwnerFullName = `${userProfile.firstName} ${userProfile.lastName || ''}`.trim();
        }
        const truckPlateNumber = truck.plateNumber || 'your truck';

        this.logger.log(`📧 Creating legacy notification for truck owner: ${truck.owner.id}`);

        // Create notification for truck owner
        const notification = await this.notificationService.createNotification({
          tenantId: tenantId,
          recipientId: truck.owner.id,
          title: 'New Truck Request',
          message: `${cargoOwnerFullName} requested for your truck ${truckPlateNumber} after matching.`,
          shortMessage: `${cargoOwnerFullName} requested truck ${truckPlateNumber}`,
          notificationType: NotificationType.GENERAL,
          category: NotificationCategory.BUSINESS,
          priority: NotificationPriority.HIGH,
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
          entityType: EntityType.CARGO,
          entityId: loadId,
          requiresAction: true,
          actionUrl: `/dashboard/fleet?tab=matches`,
          actionText: 'View Request',
        });

        this.logger.log(`📧 Legacy notification created successfully with ID: ${notification?.id}`);
      } else {
        this.logger.warn(`⚠️ Could not create notification: load=${!!load}, truck=${!!truck}, owner=${!!truck?.owner}`);
      }
    } catch (notificationError) {
      // Log error but don't fail the match request
      this.logger.error(`⚠️ Failed to send legacy notification: ${notificationError.message}`, notificationError.stack);
    }

    return savedMatch;
  }

  /**
   * Handle truck owner's response to a match request
   * When ACCEPTED: Validates and deducts credits, creates trip, updates load/truck status, sends notifications
   */
  async respondToMatch(matchId: string, status: MatchStatus): Promise<LoadMatch> {
    const match = await this.loadMatchRepository.findOne({
      where: { id: matchId }
      // Note: LoadMatch doesn't have load/truck relations - we load them separately in handleMatchAcceptance
    });

    if (!match) {
      throw new NotFoundException(`Match ${matchId} not found`);
    }

    // If accepting, skip credit deduction here.
    // Credits are now deducted when the driver starts the trip (status → IN_PROGRESS).
    // See TripsService.updateTripStatus() for the credit deduction logic.
    if (status === MatchStatus.ACCEPTED) {
      this.logger.log(`🎉 Match ${matchId} being ACCEPTED - credit deduction deferred to trip start`);
    }

    // Update match status
    match.status = status;
    const updatedMatch = await this.loadMatchRepository.save(match);

    // If accepted, trigger post-acceptance workflow
    if (status === MatchStatus.ACCEPTED) {
      this.logger.log(`🎉 Match ${matchId} ACCEPTED - Starting post-acceptance workflow`);
      await this.handleMatchAcceptance(match);
    } else if (status === MatchStatus.REJECTED) {
      this.logger.log(`❌ Match ${matchId} REJECTED by truck owner - promoting next candidate`);
      await this.promoteNextCandidate(match.loadId, match.tenantId);
    }

    return updatedMatch;
  }

  /**
   * Complete post-acceptance workflow
   * 1. Update load status to ASSIGNED
   * 2. Update truck status to ASSIGNED
   * 3. Create trip record
   * 4. Send notifications
   * 5. Initialize tracking (if available)
   */
  private async handleMatchAcceptance(match: LoadMatch): Promise<void> {
    try {
      this.logger.log(`📋 Processing acceptance for Load ${match.loadId} + Truck ${match.truckId}`);

      // Step 1: Get load and truck details (no relations - they're stored as IDs/JSON)
      const load = await this.loadRepository.findOne({
        where: { id: match.loadId }
      });

      const truck = await this.truckRepository.findOne({
        where: { id: match.truckId }
      });

      if (!load || !truck) {
        throw new NotFoundException('Load or Truck not found for match acceptance');
      }

      // Step 2: Update Load status
      load.status = LoadStatus.ASSIGNED;
      load.assignedTruckId = truck.id;
      load.updatedAt = new Date();
      await this.loadRepository.save(load);
      this.logger.log(`✅ Load ${load.id} status updated to ASSIGNED`);

      // Step 3: Update Truck status
      truck.status = VehicleStatus.IN_TRANSIT;
      truck.updatedAt = new Date();
      await this.truckRepository.save(truck);
      this.logger.log(`✅ Truck ${truck.id} status updated to IN_TRANSIT`);

      // Step 4: Create Trip record
      const trip = await this.createTripFromMatch(load, truck, match);
      this.logger.log(`✅ Trip ${trip.tripNumber} created successfully`);

      // Step 5: Send notifications (implement notification service integration)
      await this.sendAcceptanceNotifications(load, truck, trip);

      // Step 6: Initialize tracking (if tracking service is available)
      // await this.initializeTracking(trip);

      this.logger.log(`🎊 Match acceptance workflow completed successfully for Trip ${trip.tripNumber}`);
    } catch (error) {
      this.logger.error(`❌ Failed to process match acceptance: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to complete match acceptance workflow');
    }
  }

  /**
   * FR-MATCH Lifecycle: Promote the next best POTENTIAL candidate when a match is REJECTED or EXPIRED.
   * Finds the highest-scored POTENTIAL match for the load and transitions it to REQUESTED,
   * then notifies the next truck owner.
   */
  async promoteNextCandidate(loadId: string, tenantId: string): Promise<void> {
    try {
      const load = await this.loadRepository.findOne({ where: { id: loadId } });
      if (!load || load.status === LoadStatus.ASSIGNED) return;

      // Find next best POTENTIAL match (highest score)
      const nextMatch = await this.loadMatchRepository.findOne({
        where: { loadId, tenantId, status: MatchStatus.POTENTIAL },
        order: { score: 'DESC' },
      });

      if (!nextMatch) {
        this.logger.warn(`⚠️ No next candidate found for load ${loadId} — revert to PUBLISHED`);
        if (load.status === LoadStatus.PENDING_CONFIRMATION) {
          load.status = LoadStatus.PUBLISHED;
          await this.loadRepository.save(load);
        }
        return;
      }

      // Promote to REQUESTED
      nextMatch.status = MatchStatus.REQUESTED;
      await this.loadMatchRepository.save(nextMatch);
      this.logger.log(`✅ Promoted next candidate truck ${nextMatch.truckId} for load ${loadId}`);

      // Notify the next truck owner
      const truck = await this.truckRepository.findOne({
        where: { id: nextMatch.truckId },
        relations: ['owner'],
      });
      if (truck?.owner) {
        await this.notificationService.createNotification({
          tenantId,
          recipientId: truck.owner.id,
          title: 'New Cargo Match Request',
          message: `A cargo load has been matched to your truck ${truck.plateNumber}. Please respond.`,
          notificationType: NotificationType.GENERAL,
          category: NotificationCategory.BUSINESS,
          priority: NotificationPriority.HIGH,
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
          entityType: EntityType.CARGO,
          entityId: loadId,
          requiresAction: true,
          actionUrl: `/dashboard/fleet?tab=matches`,
          actionText: 'View Request',
        });
      }
    } catch (err) {
      this.logger.error(`Failed to promote next candidate for load ${loadId}: ${err.message}`);
    }
  }

  /**
   * FR-MATCH Lifecycle: Expire REQUESTED matches that have not been responded to within SLA (24h).
   * Should be called by a scheduled job (e.g., every hour via @Cron).
   */
  async expireStaleMatches(): Promise<void> {
    try {
      const slaHours = 24;
      const cutoff = new Date(Date.now() - slaHours * 60 * 60 * 1000);

      const staleMatches = await this.loadMatchRepository
        .createQueryBuilder('match')
        .where('match.status = :status', { status: MatchStatus.REQUESTED })
        .andWhere('match.createdAt < :cutoff', { cutoff })
        .getMany();

      this.logger.log(`⏰ Found ${staleMatches.length} stale REQUESTED matches to expire`);

      for (const match of staleMatches) {
        match.status = MatchStatus.EXPIRED;
        await this.loadMatchRepository.save(match);
        this.logger.log(`🕒 Match ${match.id} expired`);

        // Promote next candidate
        await this.promoteNextCandidate(match.loadId, match.tenantId);
      }
    } catch (err) {
      this.logger.error(`Failed to expire stale matches: ${err.message}`);
    }
  }

  /**
   * FR-MATCH-006 + FR-MATCH-008 to FR-MATCH-011:
   * Apply all enrichments (ML, Market Intelligence, Risk, Environmental, Route Optimization)
   * by default on every findMatches call.
   */
  private async applyAllEnrichments(
    matches: MatchResultDto[],
    tenantId: string,
  ): Promise<MatchResultDto[]> {
    if (matches.length === 0) return matches;

    // FR-MATCH-006: ML Prediction (always on)
    matches = await this.enrichMatchesWithMLPredictions(matches, tenantId);

    // FR-MATCH-009: Risk Assessment (always on)
    matches = await this.enrichMatchesWithRiskAssessment(matches, tenantId);

    // FR-MATCH-010: Environmental Impact (always on)
    matches = await this.enrichMatchesWithEnvironmentalImpact(matches);

    // FR-MATCH-011: Route Optimization (always on)
    matches = await this.applyRouteOptimization(matches);

    // FR-MATCH-008: Market Intelligence (always on)
    const marketContext = await this.getMarketContext(tenantId);
    matches = this.applyMarketAwareScoring(matches, marketContext);

    return matches;
  }

  /**
   * Create a Trip record from an accepted match
   */
  private async createTripFromMatch(load: Load, truck: Truck, match: LoadMatch): Promise<any> {
    const tripNumber = `TRIP-${Date.now()}-${load.id.substring(0, 8)}`;

    // Calculate estimated times
    const now = new Date();
    const pickupDate = new Date(load.pickupDate);
    const deliveryDate = new Date(load.deliveryDate);

    const tripData = {
      tenantId: load.tenantId,
      loadId: load.id,
      truckId: truck.id,
      driverId: truck.currentDriverId,
      tripNumber,
      status: TripStatus.PLANNED,
      plannedStartTime: pickupDate,
      plannedEndTime: deliveryDate,
      agreedPrice: load.offeredPrice || match.matchDetails?.estimatedCost || 0,
      currencyCode: load.currencyCode || 'USD',
      notes: `Auto-created from Smart Matching (Match Score: ${match.score})`,
    };

    // Use Trip entity class for proper type safety and to avoid lookup errors
    const tripRepository = this.loadRepository.manager.getRepository(Trip);
    const trip = tripRepository.create(tripData);
    return await tripRepository.save(trip);
  }

  /**
   * Send notifications to all parties about match acceptance
   */
  private async sendAcceptanceNotifications(load: any, truck: any, trip: any): Promise<void> {
    try {
      this.logger.log(`📧 Sending acceptance notifications...`);

      // 1. Notify Cargo Owner
      await this.notificationService.createNotification({
        tenantId: load.tenantId,
        recipientId: load.cargoOwnerId,
        title: 'Match Accepted',
        message: `Your cargo match has been accepted by truck ${truck.plateNumber}. Trip ${trip.tripNumber} has been created.`,
        notificationType: NotificationType.TRIP_CREATED,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        entityType: EntityType.TRIP,
        entityId: trip.id,
        requiresAction: true,
        actionUrl: `/dashboard/trips`,
        actionText: 'View Trip'
      });
      this.logger.log(`📧 Notification sent to Cargo Owner: ${load.cargoOwnerId}`);

      // 2. Notify Truck Owner
      let truckOwnerId = truck.owner?.id || truck.ownerId;
      
      // If owner ID is missing, fetch it
      if (!truckOwnerId) {
         const truckWithOwner = await this.truckRepository.findOne({
             where: { id: truck.id },
             relations: ['owner']
         });
         truckOwnerId = truckWithOwner?.owner?.id;
      }

      if (truckOwnerId) {
        await this.notificationService.createNotification({
          tenantId: load.tenantId, // Assuming same tenant, or truck.tenantId
          recipientId: truckOwnerId,
          title: 'Trip Created',
          message: `You accepted the match for cargo. Trip ${trip.tripNumber} is now active.`,
          notificationType: NotificationType.TRIP_CREATED,
          category: NotificationCategory.TRIP,
          priority: NotificationPriority.HIGH,
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
          entityType: EntityType.TRIP,
          entityId: trip.id,
          requiresAction: true,
          actionUrl: `/dashboard/fleet/trips`,
          actionText: 'View Trip'
        });
        this.logger.log(`📧 Notification sent to Truck Owner: ${truckOwnerId}`);
      } else {
        this.logger.warn(`⚠️ Could not find truck owner for notification (Truck ID: ${truck.id})`);
      }

      // 3. Notify Driver
      if (trip.driverId) {
        const driver = await this.driverRepository.findOne({
          where: { id: trip.driverId }
        });

        if (driver && driver.userId) {
          // Fetch driver user for email
          const driverUser = await this.userRepository.findOne({
            where: { id: driver.userId },
            relations: ['profile'],
          });

          await this.notificationService.createNotification({
            tenantId: load.tenantId,
            recipientId: driver.userId,
            title: '🚛 New Trip Assignment',
            message: `You have been assigned to trip ${trip.tripNumber}. Cargo: "${load.title || 'General Cargo'}", Truck: ${truck.plateNumber || 'N/A'}.`,
            notificationType: NotificationType.DRIVER_ASSIGNMENT,
            category: NotificationCategory.TRIP,
            priority: NotificationPriority.HIGH,
            channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
            entityType: EntityType.TRIP,
            entityId: trip.id,
            requiresAction: true,
            actionUrl: `/dashboard/driver/trips?tripId=${trip.id}`,
            actionText: 'View Trip'
          });
          this.logger.log(`📧 In-app notification sent to Driver: ${driver.userId}`);

          // Send assignment email to driver
          if (driverUser?.email) {
            const driverName = driverUser.profile
              ? `${driverUser.profile.firstName || ''} ${driverUser.profile.lastName || ''}`.trim() || driverUser.email
              : driverUser.email;
            const pickupDate = trip.plannedStartTime
              ? new Date(trip.plannedStartTime).toLocaleDateString('en-US', { dateStyle: 'medium' })
              : 'TBD';
            const { frontendUrl, smtpFrom: fromAddress } = getEnvConfig();
            const tripUrl = `${frontendUrl}/dashboard/driver/trips`;

            const html = `
              <!DOCTYPE html>
              <html>
              <head><meta charset="UTF-8"></head>
              <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <div style="background: #1a56db; padding: 24px; text-align: center;">
                    <h1 style="color: #fff; margin: 0; font-size: 22px;">🚛 New Trip Assignment</h1>
                  </div>
                  <div style="padding: 28px;">
                    <p style="font-size: 16px; color: #333;">Hi <strong>${driverName}</strong>,</p>
                    <p style="color: #555;">You have been assigned to a new trip. Here are the details:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                      <tr style="background: #f8f9fa;">
                        <td style="padding: 10px 14px; font-weight: bold; color: #333; width: 40%;">Trip Number</td>
                        <td style="padding: 10px 14px; color: #555;">${trip.tripNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 14px; font-weight: bold; color: #333;">Cargo</td>
                        <td style="padding: 10px 14px; color: #555;">${load.title || 'General Cargo'}</td>
                      </tr>
                      <tr style="background: #f8f9fa;">
                        <td style="padding: 10px 14px; font-weight: bold; color: #333;">Truck</td>
                        <td style="padding: 10px 14px; color: #555;">${truck.plateNumber || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 14px; font-weight: bold; color: #333;">Planned Start</td>
                        <td style="padding: 10px 14px; color: #555;">${pickupDate}</td>
                      </tr>
                    </table>
                    <div style="text-align: center; margin: 28px 0;">
                      <a href="${tripUrl}" style="background: #1a56db; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: bold;">View Trip Details</a>
                    </div>
                    <p style="color: #888; font-size: 13px;">Please log in to your driver dashboard to review the full trip details and prepare accordingly.</p>
                  </div>
                  <div style="background: #f8f9fa; padding: 16px; text-align: center; color: #aaa; font-size: 12px;">
                    © ${new Date().getFullYear()} UrutiX Smart Logistics. All rights reserved.
                  </div>
                </div>
              </body>
              </html>
            `;

            try {
              await (this.emailService as any).transporter?.sendMail({
                from: fromAddress,
                to: driverUser.email,
                subject: `New Trip Assignment - ${trip.tripNumber} | UrutiX`,
                text: `Hi ${driverName},\n\nYou have been assigned to trip ${trip.tripNumber}.\nCargo: ${load.title || 'General Cargo'}\nTruck: ${truck.plateNumber || 'N/A'}\nPlanned Start: ${pickupDate}\n\nView trip: ${tripUrl}\n\nUrutiX Smart Logistics`,
                html,
              });
              this.logger.log(`📧 Assignment email sent to driver ${driverUser.email}`);
            } catch (emailErr) {
              this.logger.error(`Failed to send assignment email to driver: ${emailErr.message}`);
            }
          }
        }
      }

    } catch (error) {
      this.logger.error(`Failed to send notifications: ${error.message}`, error.stack);
    }
  }

  /**
   * Retroactively create trips for all accepted matches that don't have trips yet
   * This is a migration method for matches accepted before auto-trip creation was implemented
   */
  async createTripsForAcceptedMatches(tenantId: string): Promise<{
    created: number;
    skipped: number;
    errors: number;
  }> {
    this.logger.log(`🔄 Starting trip creation for accepted matches in tenant ${tenantId}`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    try {
      // Find all accepted matches for this tenant
      const acceptedMatches = await this.loadMatchRepository
        .createQueryBuilder('match')
        .where('match.tenantId = :tenantId', { tenantId })
        .andWhere('match.status = :status', { status: MatchStatus.ACCEPTED })
        .getMany();

      this.logger.log(`📋 Found ${acceptedMatches.length} accepted matches`);

      for (const match of acceptedMatches) {
        try {
          // Get load details (no relations needed - origin/destination are JSON fields)
          const load = await this.loadRepository.findOne({
            where: { id: match.loadId }
          });

          if (!load) {
            this.logger.warn(`⚠️  Load ${match.loadId} not found`);
            skipped++;
            continue;
          }

          // Check if trip already exists
          const tripRepository = this.loadRepository.manager.getRepository('Trip');
          const existingTrip = await tripRepository.findOne({
            where: { loadId: load.id }
          });

          if (existingTrip) {
            this.logger.log(`⏭️  Trip already exists for load ${load.id}`);
            skipped++;
            continue;
          }

          // Get truck details
          const truck = await this.truckRepository.findOne({
            where: { id: match.truckId }
          });

          if (!truck) {
            this.logger.warn(`⚠️  Truck ${match.truckId} not found`);
            skipped++;
            continue;
          }

          // Create the trip
          const tripNumber = `TRIP-${Date.now()}-${load.id.substring(0, 8)}`;
          const pickupDate = new Date(load.pickupDate);
          const deliveryDate = new Date(load.deliveryDate);

          const tripData = {
            tenantId: load.tenantId,
            loadId: load.id,
            truckId: truck.id,
            driverId: truck.currentDriverId,
            tripNumber,
            status: 'PLANNED',
            plannedStartTime: pickupDate,
            plannedEndTime: deliveryDate,
            agreedPrice: load.offeredPrice || match.matchDetails?.estimatedCost || 0,
            currencyCode: load.currencyCode || 'USD',
            notes: `Retroactively created from accepted match (Match Score: ${match.score})`,
          };

          const trip = tripRepository.create(tripData);
          await tripRepository.save(trip);

          // Update load status if needed
          if (load.status !== LoadStatus.ASSIGNED) {
            load.status = LoadStatus.ASSIGNED;
            load.assignedTruckId = truck.id;
            await this.loadRepository.save(load);
          }

          // Update truck status if needed
          if (truck.status !== VehicleStatus.IN_TRANSIT) {
            truck.status = VehicleStatus.IN_TRANSIT;
            await this.truckRepository.save(truck);
          }

          this.logger.log(`✅ Created trip ${tripNumber} for load ${load.id}`);
          created++;
        } catch (error) {
          this.logger.error(`❌ Error processing match ${match.id}: ${error.message}`);
          errors++;
        }
      }

      this.logger.log(`\n📊 Summary: Created ${created}, Skipped ${skipped}, Errors ${errors}`);
      return { created, skipped, errors };
    } catch (error) {
      this.logger.error(`Failed to create trips for accepted matches: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a trip for a specific accepted match
   */
  async createTripForMatch(matchId: string, tenantId: string): Promise<Trip> {
    const match = await this.loadMatchRepository.findOne({
      where: { id: matchId, tenantId }
    });

    if (!match) {
      throw new NotFoundException(`Match ${matchId} not found`);
    }

    if (match.status !== MatchStatus.ACCEPTED) {
      throw new BadRequestException('Match must be in ACCEPTED status to create a trip');
    }

    // Check if trip already exists
    const tripRepository = this.loadRepository.manager.getRepository(Trip);
    const existingTrip = await tripRepository.findOne({
      where: { loadId: match.loadId }
    });

    if (existingTrip) {
      throw new BadRequestException('Trip already exists for this match');
    }

    const load = await this.loadRepository.findOne({ where: { id: match.loadId } });
    const truck = await this.truckRepository.findOne({ where: { id: match.truckId } });

    if (!load || !truck) {
      throw new NotFoundException('Load or Truck not found');
    }

    // Reuse helper method
    const trip = await this.createTripFromMatch(load, truck, match);

    // Also update Load and Truck status if needed (migration case)
    if (load.status !== LoadStatus.ASSIGNED) {
      load.status = LoadStatus.ASSIGNED;
      load.assignedTruckId = truck.id;
      await this.loadRepository.save(load);
    }

    if (truck.status !== VehicleStatus.IN_TRANSIT) {
      truck.status = VehicleStatus.IN_TRANSIT;
      await this.truckRepository.save(truck);
    }

    return trip;
  }

  private async getAvailableTrucks(
    load: Load,
    criteria: MatchRequestDto,
    tenantId: string,
  ): Promise<Truck[]> {
    try {
      console.log('🔍 getAvailableTrucks called');
      console.log('📦 Load weight:', load.weight);
      console.log('🏢 TenantId:', tenantId);

      // Build dynamic query based on load requirements.
      // We include AVAILABLE and IN_TRANSIT trucks — IN_TRANSIT trucks can still be
      // booked for upcoming loads and will score lower on the availability dimension.
      // Only MAINTENANCE and OUT_OF_SERVICE trucks are excluded entirely.
      const matchableStatuses = [VehicleStatus.AVAILABLE, VehicleStatus.IN_TRANSIT];
      const queryBuilder = this.truckRepository
        .createQueryBuilder('truck')
        .where('truck.tenantId = :tenantId', { tenantId })
        .andWhere('truck.status IN (:...matchableStatuses)', { matchableStatuses })
        .andWhere('truck.isActive = :isActive', { isActive: true });

      console.log('🔧 Query builder initialized with base conditions');
      console.log('🔧 Truck filters:', {
        tenantId,
        statuses: matchableStatuses,
        isActive: true,
        note: 'AVAILABLE + IN_TRANSIT trucks included; MAINTENANCE/OUT_OF_SERVICE excluded',
      });

      // Only add capacity filter if load.weight is valid
      // Both truck capacity and cargo weight are in kg
      if (load.weight && load.weight > 0) {
        const loadWeightKg = Number(load.weight);
        console.log('🔍 Adding capacity filter:', {
          loadWeightKg: loadWeightKg,
          loadWeightType: typeof load.weight,
          note: 'Truck capacity and cargo weight are both in kg',
        });
        queryBuilder.andWhere('truck.capacityWeight >= :minCapacity', {
          minCapacity: loadWeightKg,
        });
      } else {
        console.warn('⚠️ Load weight is invalid, skipping capacity filter', {
          weight: load.weight,
          weightType: typeof load.weight,
        });
      }

      // Add equipment requirements
      if (load.requiresRefrigeration) {
        queryBuilder.andWhere('truck.hasRefrigeration = :hasRefrigeration', {
          hasRefrigeration: true,
        });
      }

      if (load.isHazardous) {
        queryBuilder.andWhere('truck.hasHazmatPermit = :hasHazmat', {
          hasHazmat: true,
        });
      }

      if (load.requiresForklift) {
        queryBuilder.andWhere('truck.hasLiftGate = :hasLiftGate', {
          hasLiftGate: true,
        });
      }

      if (load.requiresCrane) {
        queryBuilder.andWhere('truck.hasWinch = :hasWinch', {
          hasWinch: true,
        });
      }

      if (load.requiresLoadingDock) {
        queryBuilder.andWhere('truck.hasTailLift = :hasTailLift', {
          hasTailLift: true,
        });
      }

      // Add truck type requirements
      if (load.truckRequirements?.requiredTruckTypes?.length > 0) {
        queryBuilder.andWhere('truck.truckType IN (:...truckTypes)', {
          truckTypes: load.truckRequirements.requiredTruckTypes,
        });
      }

      // Add distance filter if specified
      if (criteria.maxDistance) {
        // This would require geospatial query in real implementation
        // For now, we'll filter after fetching
      }

      console.log('🔍 Executing truck query...');

      // Log the query before execution
      const querySql = queryBuilder.getSql();
      const queryParams = queryBuilder.getParameters();
      console.log('📝 SQL Query:', querySql);
      console.log('📝 Query Parameters:', JSON.stringify(queryParams, null, 2));
      console.log('📝 Query Conditions:', {
        tenantId,
        status: VehicleStatus.AVAILABLE,
        isActive: true,
        minCapacity: load.weight ? Number(load.weight) : null,
      });

      // Execute the query
      const trucks = await queryBuilder
        .leftJoinAndSelect('truck.owner', 'owner')
        .leftJoinAndSelect('owner.profile', 'ownerProfile')
        .getMany();

      // Log the raw SQL that was actually executed
      console.log('📝 Actual executed query:', queryBuilder.getQuery());

      console.log(`✅ Query returned ${trucks.length} trucks`);

      // Log details of each truck found
      trucks.forEach((truck, index) => {
        const owner = (truck as any).owner;
        const profile = owner?.profile;
        console.log(`🚛 Truck ${index + 1}:`, {
          id: truck.id,
          plateNumber: truck.plateNumber,
          capacityWeight: truck.capacityWeight,
          status: truck.status,
          isActive: truck.isActive,
          tenantId: truck.tenantId,
          ownerId: truck.ownerId,
          ownerLoaded: !!owner,
          ownerEmail: owner?.email,
          profileLoaded: !!profile,
          ownerFirstName: profile?.firstName,
          ownerLastName: profile?.lastName,
          ownerCompany: profile?.companyName,
        });
      });

      // Apply additional filters
      const filteredTrucks = trucks.filter((truck) => {
        try {
          // NOTE: Distance is NOT a hard filter — trucks far away still get matched,
          // they just score lower on the distance factor.
          // maxDistance from the frontend is used only in scoring, not filtering.
          // This ensures trucks are never excluded purely because they are far from
          // the pickup point (they may be en route or repositioning).

          // Rating filter — averageRating is 0-5 scale, minRating from DTO is 0-1 scale
          // Only filter if truck has an established rating (> 0) and it's below minimum
          if (criteria.minRating && Number(truck.averageRating) > 0) {
            // minRating is 0-1, averageRating is 0-5, so convert: minRating * 5
            const minRatingOn5Scale = criteria.minRating * 5;
            if (Number(truck.averageRating) < minRatingOn5Scale) {
              console.log(`❌ Truck ${truck.plateNumber} filtered out by rating: ${truck.averageRating}/5 < ${minRatingOn5Scale}/5`);
              return false;
            }
          }

          console.log(`✅ Truck ${truck.plateNumber} passed all filters`);
          return true;
        } catch (error) {
          console.error(`Error filtering truck ${truck?.id}:`, error);
          return false;
        }
      });

      console.log(`✅ Filtered to ${filteredTrucks.length} trucks`);
      return filteredTrucks;
    } catch (error) {
      console.error('❌ Error in getAvailableTrucks:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      // Return empty array instead of throwing to allow matching to continue
      return [];
    }
  }

  private async applyWeightedScoring(
    load: Load,
    trucks: Truck[],
    criteria: MatchRequestDto,
  ): Promise<MatchResultDto[]> {
    console.log(
      `🎯 applyWeightedScoring: Processing ${trucks.length} trucks for load ${load.id}`,
    );

    // Pre-calculate distances for ALL trucks so we can do relative scoring
    // Closest truck = highest distance score, furthest = lowest (but never excluded)
    const truckDistances = new Map<string, number>();
    for (const truck of trucks) {
      const dist = this.calculateDistance(load, truck);
      truckDistances.set(truck.id, dist);
      console.log(`📍 Truck ${truck.plateNumber} distance from pickup: ${dist === 10000 ? 'no GPS' : dist.toFixed(1) + 'km'}`);
    }

    const matches: MatchResultDto[] = [];

    for (const truck of trucks) {
      try {
        console.log(`🔍 Scoring truck ${truck.plateNumber} (${truck.id})...`);
        const match = await this.scoreTruck(truck, load, criteria, truckDistances);
        if (match) {
          console.log(
            `✅ Truck ${truck.plateNumber} scored: ${match.overallScore}`,
          );
          matches.push(match);
        } else {
          console.log(
            `❌ Truck ${truck.plateNumber} returned null from scoreTruck`,
          );
        }
      } catch (error) {
        console.error(
          `❌ Error scoring truck ${truck?.id} (${truck?.plateNumber}):`,
          error,
        );
        // Continue with next truck instead of failing entire matching
        continue;
      }
    }

    console.log(
      `✅ applyWeightedScoring: Generated ${matches.length} matches from ${trucks.length} trucks`,
    );
    return matches;
  }

  private async applyHungarianAlgorithm(
    load: Load,
    trucks: Truck[],
    criteria: MatchRequestDto,
  ): Promise<MatchResultDto[]> {
    // Create cost matrix for Hungarian algorithm
    const costMatrix: number[][] = [];

    // For single load matching, create a matrix with one row
    const costs: number[] = [];
    for (const truck of trucks) {
      const match = await this.scoreTruck(truck, load, criteria);
      const cost = match ? (1 - match.overallScore) * 100 : 1000; // Convert score to cost
      costs.push(cost);
    }
    costMatrix.push(costs);

    // Apply Hungarian algorithm
    const result = this.hungarianAlgorithm.solve(costMatrix);

    // Convert results back to matches
    const matches: MatchResultDto[] = [];
    for (const assignment of result.assignments) {
      const truck = trucks[assignment.truckIndex];
      const match = await this.scoreTruck(truck, load, criteria);
      if (match) {
        matches.push(match);
      }
    }

    return matches;
  }

  private async applyGeneticAlgorithm(
    load: Load,
    trucks: Truck[],
    criteria: MatchRequestDto,
  ): Promise<MatchResultDto[]> {
    // For single load matching, genetic algorithm might be overkill
    // But we can use it for optimization
    const loads = [load];
    const geneticAlgorithm = new GeneticAlgorithm(loads, trucks, {
      populationSize: 30,
      generations: 50,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      elitismRate: 0.2,
    });
    const result = geneticAlgorithm.solve();

    // Convert genetic algorithm results to matches
    const matches: MatchResultDto[] = [];
    for (let i = 0; i < result.bestSolution.length; i++) {
      const truckIndex = result.bestSolution[i];
      if (truckIndex >= 0 && truckIndex < trucks.length) {
        const truck = trucks[truckIndex];
        const match = await this.scoreTruck(truck, load, criteria);
        if (match) {
          matches.push(match);
        }
      }
    }

    return matches;
  }

  private async applyTopsisAlgorithm(
    load: Load,
    trucks: Truck[],
    matchCriteria: MatchRequestDto,
  ): Promise<MatchResultDto[]> {
    // Create alternatives for TOPSIS
    const alternatives = [];
    for (const truck of trucks) {
      const match = await this.scoreTruck(truck, load, matchCriteria);
      if (match) {
        alternatives.push({
          id: truck.id,
          criteria: [
            match.distanceScore,
            match.capacityScore,
            match.equipmentScore,
            match.ratingScore,
            match.costScore,
          ],
          metadata: { match },
        });
      }
    }

    // Define criteria for TOPSIS
    const topsisCriteria = [
      { name: 'distance', weight: 0.2, beneficial: false },
      { name: 'capacity', weight: 0.25, beneficial: true },
      { name: 'equipment', weight: 0.25, beneficial: true },
      { name: 'rating', weight: 0.15, beneficial: true },
      { name: 'cost', weight: 0.15, beneficial: false },
    ];

    // Apply TOPSIS
    const results = this.topsisAlgorithm.solve(alternatives, topsisCriteria);

    // Convert back to matches
    return results.map((result) => result.metadata.match);
  }

  private async applyHybridAlgorithm(
    load: Load,
    trucks: Truck[],
    criteria: MatchRequestDto,
  ): Promise<MatchResultDto[]> {
    // FR-MATCH: HYBRID = ensemble of ALL 4 algorithms, deduplicated and re-scored
    const [weightedMatches, hungarianMatches, geneticMatches, topsisMatches] =
      await Promise.all([
        this.applyWeightedScoring(load, trucks, criteria),
        this.applyHungarianAlgorithm(load, trucks, criteria),
        this.applyGeneticAlgorithm(load, trucks, criteria),
        this.applyTopsisAlgorithm(load, trucks, criteria),
      ]);

    // Combine all 4 algorithm results, deduplicate, then re-score
    const allMatches = [
      ...weightedMatches,
      ...hungarianMatches,
      ...geneticMatches,
      ...topsisMatches,
    ];
    const uniqueMatches = this.deduplicateMatches(allMatches);

    // Re-score with hybrid approach
    return uniqueMatches.map((match) => ({
      ...match,
      overallScore: this.calculateHybridScore(match, load),
    }));
  }

  private async scoreTruck(
    truck: Truck,
    load: Load,
    criteria: MatchRequestDto,
    allTruckDistances?: Map<string, number>,
  ): Promise<MatchResultDto | null> {
    try {
      // =====================================================
      // SIMPLIFIED MATCHING - 5 CORE CRITERIA ONLY
      // 1. Capacity, 2. Equipment, 3. Distance, 4. GPS, 5. Availability
      // =====================================================

      // =====================================================
      // HARD CONSTRAINTS CHECK (All must pass)
      // =====================================================

      // 1. CAPACITY CONSTRAINT
      const truckCapacityKg = Number(truck.capacityWeight);
      const loadWeight = Number(load.weight);

      this.logger.debug(`🔍 Checking constraints for truck ${truck.plateNumber}`);

      if (!truckCapacityKg || !loadWeight || loadWeight > truckCapacityKg) {
        this.logger.debug(`❌ Rejected: Capacity insufficient (${loadWeight}kg > ${truckCapacityKg}kg)`);
        return null;
      }

      // 2. AVAILABILITY CONSTRAINT
      if (truck.status !== VehicleStatus.AVAILABLE) {
        // Exception: If truck is incoming and will be available soon (within 2 hours)
        const isIncoming = truck.status === VehicleStatus.IN_TRANSIT &&
          truck.estimatedAvailableTime &&
          (new Date(truck.estimatedAvailableTime).getTime() - Date.now()) < 2 * 60 * 60 * 1000;

        if (!isIncoming) {
          this.logger.debug(`❌ Rejected: Status is ${truck.status}`);
          return null;
        }
      }

      // 3. EQUIPMENT CONSTRAINT
      if (load.requiresRefrigeration && !truck.hasRefrigeration) {
        this.logger.debug(`❌ Rejected: Missing refrigeration`);
        return null;
      }
      if (load.isHazardous && !truck.hasHazmatPermit) {
        this.logger.debug(`❌ Rejected: Missing hazmat permit`);
        return null;
      }
      if (load.requiresForklift && !truck.hasLiftGate) {
        this.logger.debug(`❌ Rejected: Missing lift gate (forklift required)`);
        return null;
      }
      if (load.requiresCrane && !truck.hasWinch) {
        this.logger.debug(`❌ Rejected: Missing winch/crane`);
        return null;
      }
      if (load.requiresLoadingDock && !truck.hasTailLift) {
        this.logger.debug(`❌ Rejected: Missing tail lift (loading dock required)`);
        return null;
      }

      // 4. SECURITY CONSTRAINT (GPS)
      if (load.requiresGpsMonitoring && !truck.hasGps && !truck.securityFeatures?.hasGps) {
        this.logger.debug(`❌ Rejected: Missing required GPS/Tracking`);
        return null;
      }

      // 5. ROUTE/DISTANCE CONSTRAINT
      // Calculate distance between load pickup and truck current location
      const distanceKm = this.calculateDistance(load, truck);

      // If truck has max distance constraint, compare against the ROUTE distance
      // (pickup → delivery), NOT the truck's current position distance.
      // A truck far away can still travel to pick up cargo — maxDistance is about
      // how far the truck is willing to haul, not where it currently is.
      if (truck.routeCapabilities?.maxDistance) {
        const routeDistance = this.calculateRouteDistance(load);
        if (routeDistance > 0 && routeDistance > truck.routeCapabilities.maxDistance) {
          this.logger.debug(`❌ Rejected: Route distance ${routeDistance}km exceeds truck max ${truck.routeCapabilities.maxDistance}km`);
          return null;
        }
      }

      // =====================================================
      // CALCULATE ALL 12 SCORING DIMENSIONS (v3 Specification)
      // =====================================================
      const factors = await this.calculateMatchingFactors(truck, load, criteria);
      
      // Get dynamic weights based on load requirements (FR-MATCH-001 to FR-MATCH-005)
      const weights = this.getDynamicWeights(load);

      // Calculate weighted overall score using all 12 dimensions
      const overallScore = this.calculateWeightedScore(factors, weights);

      // Calculate supporting metrics using ROUTE distance (pickup → delivery), not truck-to-pickup
      const pickupLoc = load.pickupLocation;
      const deliveryLoc = load.deliveryLocation;
      
      // Calculate the actual route distance (origin → destination)
      let routeDistanceKm = 0;
      
      if (pickupLoc?.locationData?.coordinates && deliveryLoc?.locationData?.coordinates) {
        const pickupCoords = pickupLoc.locationData.coordinates;
        const deliveryCoords = deliveryLoc.locationData.coordinates;
        
        if (pickupCoords.latitude && pickupCoords.longitude && deliveryCoords.latitude && deliveryCoords.longitude) {
          routeDistanceKm = this.calculateHaversineDistance(
            pickupCoords.latitude, 
            pickupCoords.longitude, 
            deliveryCoords.latitude, 
            deliveryCoords.longitude
          );
          
          this.logger.debug(
            `Load ${load.id} route: ${pickupCoords.latitude.toFixed(4)},${pickupCoords.longitude.toFixed(4)} → ` +
            `${deliveryCoords.latitude.toFixed(4)},${deliveryCoords.longitude.toFixed(4)} = ${routeDistanceKm.toFixed(1)}km`
          );
        }
      }
      
      // Every load has pickup and delivery locations — routeDistanceKm must be
      // calculated from real coordinates. If it is still 0 here something is
      // genuinely wrong with this specific load's data; log it but do NOT
      // substitute a fake distance.
      if (routeDistanceKm === 0) {
        this.logger.error(
          `Load ${load.id}: route distance is 0. ` +
          `pickupLocation coords: ${JSON.stringify(pickupLoc?.locationData?.coordinates)} ` +
          `deliveryLocation coords: ${JSON.stringify(deliveryLoc?.locationData?.coordinates)}`,
        );
      }

      const estimatedCost    = this.estimateCost(routeDistanceKm, loadWeight, truck);
      const estimatedRevenue = this.estimateRevenue(routeDistanceKm, loadWeight, load);
      const costBreakdown    = this.estimateCostBreakdown(routeDistanceKm, loadWeight, truck);
      const profitMargin     = estimatedRevenue > 0
        ? ((estimatedRevenue - estimatedCost) / estimatedRevenue)
        : 0;
      const estimatedDeliveryTime = this.estimateDeliveryTime(routeDistanceKm, load);
      const riskScore = Math.max(0, 1 - overallScore);
      // Pass the already-computed routeDistanceKm so getMarketAverageCost does
      // not re-run haversine — the distance is already known at this point.
      const marketAverage   = this.getMarketAverageCost(load, routeDistanceKm);
      const recommendedPrice = marketAverage * 1.1;

      // Get driver info if requested
      let driverInfo = {};
      if (criteria.includeDrivers && truck.currentDriverId) {
        const driver = await this.driverRepository.findOne({
          where: { id: truck.currentDriverId },
        });
        if (driver) {
          driverInfo = {
            driverId: driver.id,
            driverName: `${driver.firstName} ${driver.lastName}`,
            driverRating: driver.rating,
            driverLicenseNumber: driver.licenseNumber,
          };
        }
      }

      // Generate match reason based on all 12 factors
      const utilization = ((loadWeight / truckCapacityKg) * 100).toFixed(1);
      const matchReason = this.generateSimplifiedMatchReason(
        truck, load, factors.capacityScore, factors.equipmentScore, factors.distanceScore,
        factors.gpsTrackingScore, factors.availabilityScore, factors.routeCompatibilityScore, distanceKm, utilization
      );

      const confidence = Math.min(overallScore * 1.1, 1.0);
      const successProbability = overallScore;

      return {
        truckId: truck.id,
        loadId: load.id,
        overallScore: Math.min(overallScore, 1.0),
        // Base 5 dimensions
        capacityScore: factors.capacityScore,
        equipmentScore: factors.equipmentScore,
        distanceScore: factors.distanceScore,
        gpsTrackingScore: factors.gpsTrackingScore,
        availabilityScore: factors.availabilityScore,
        routeScore: factors.routeCompatibilityScore,
        // Dynamic 7 dimensions
        temperatureScore: factors.temperatureScore,
        securityScore: factors.securityScore,
        timeScore: factors.timeScore,
        experienceScore: factors.experienceScore,
        ratingScore: factors.ratingScore,
        costScore: factors.costScore,
        distanceKm: Math.round(distanceKm * 10) / 10,
        routeDistanceKm: Math.round(routeDistanceKm * 10) / 10,
        estimatedCost: Math.round(estimatedCost * 100) / 100,
        estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
        // Cost breakdown (all USD)
        fuelCost:         costBreakdown.fuelCost,
        laborCost:        costBreakdown.laborCost,
        maintenanceCost:  costBreakdown.maintenanceCost,
        insuranceCost:    costBreakdown.insuranceCost,
        truckMake: truck.make || 'Unknown',
        truckModel: truck.model || 'Unknown',
        plateNumber: truck.plateNumber || 'N/A',
        capacityWeight: truckCapacityKg,
        capacityVolume: truck.capacityVolume || 0,
        truckRating: truck.averageRating || 0,
        truckType: truck.truckType || 'UNKNOWN',
        hasRefrigeration: truck.hasRefrigeration || false,
        hasLiftGate: truck.hasLiftGate || false,
        hasHazmatPermit: truck.hasHazmatPermit || false,
        hasGps: truck.hasGps || false,
        matchReason,
        confidence,
        successProbability,
        estimatedDeliveryTime,
        riskScore,
        recommendedPrice: Math.round(recommendedPrice * 100) / 100,
        // Owner information
        ownerId: truck.ownerId || null,
        ownerName: (truck as any).owner?.profile
          ? `${(truck as any).owner.profile.firstName || ''} ${(truck as any).owner.profile.lastName || ''}`.trim() || (truck as any).owner.profile.companyName || 'Unknown Carrier'
          : 'Unknown Carrier',
        ownerEmail: (truck as any).owner?.email || null,
        ownerRating: (truck as any).owner?.profile?.rating || truck.averageRating || 0,
        ownerVerified: (truck as any).owner?.status === 'ACTIVE',
        ownerCompany: (truck as any).owner?.profile?.companyName || null,
        ...driverInfo,
      } as MatchResultDto;
    } catch (error) {
      this.logger.error(`Error scoring truck ${truck?.id}: ${error.message}`);
      return null;
    }
  }

  private async calculateMatchingFactors(
    truck: Truck,
    load: Load,
    criteria: MatchRequestDto,
  ): Promise<MatchingFactors> {
    try {
      // Calculate all 12 scoring dimensions per v3 specification
      // Base 5 dimensions (always calculated)
      const capacityScore = this.calculateCapacityScore(truck, load);
      const equipmentScore = this.calculateEquipmentScore(truck, load);
      const distanceScore = this.calculateDistanceScore(load, truck, criteria);
      const gpsTrackingScore = this.calculateGpsTrackingScore(truck, load);
      const availabilityScore = this.calculateAvailabilityScore(truck);
      const routeCompatibilityScore = await this.calculateRouteScore(truck, load);
      
      // Dynamic 7 dimensions (calculated based on cargo requirements)
      const temperatureScore = this.calculateTemperatureScore(truck, load);
      const securityScore = this.calculateSecurityScore(truck, load);
      const timeScore = this.calculateTimeScore(truck, load);
      const experienceScore = this.calculateExperienceScore(truck, load);
      const ratingScore = this.calculateRatingScore(truck);
      const costScore = this.calculateCostScore(truck, load);

      return {
        // Base 5 dimensions
        capacityScore: capacityScore || 0,
        equipmentScore: equipmentScore || 0,
        distanceScore: distanceScore || 0,
        gpsTrackingScore: gpsTrackingScore || 0,
        availabilityScore: availabilityScore || 0,
        routeCompatibilityScore: routeCompatibilityScore || 0,
        // Dynamic 7 dimensions
        temperatureScore: temperatureScore || 0,
        securityScore: securityScore || 0,
        timeScore: timeScore || 0,
        experienceScore: experienceScore || 0,
        ratingScore: ratingScore || 0,
        costScore: costScore || 0,
      };
    } catch (error) {
      this.logger.error('Error in calculateMatchingFactors:', error);
      // Return default scores if calculation fails
      return {
        capacityScore: 0.5,
        equipmentScore: 0.5,
        distanceScore: 0.5,
        gpsTrackingScore: 0.5,
        availabilityScore: 0.5,
        routeCompatibilityScore: 0.5,
        temperatureScore: 0.5,
        securityScore: 0.5,
        timeScore: 0.5,
        experienceScore: 0.5,
        ratingScore: 0.5,
        costScore: 0.5,
      };
    }
  }

  private calculateDistanceScore(
    load: Load,
    truck: Truck,
    criteria: MatchRequestDto,
    allTruckDistances?: Map<string, number>, // optional: relative scoring across all trucks
  ): number {
    const distance = this.calculateDistance(load, truck);

    // If we have all truck distances, use relative scoring
    // The closest truck gets 1.0, furthest gets 0.1 — no truck is excluded
    if (allTruckDistances && allTruckDistances.size > 0) {
      const distances = Array.from(allTruckDistances.values());
      const minDist = Math.min(...distances);
      const maxDist = Math.max(...distances);

      // All trucks are at the same distance — give everyone full score
      if (maxDist === minDist) return 1.0;

      // Linear scale: closest = 1.0, furthest = 0.1
      const normalized = (distance - minDist) / (maxDist - minDist);
      return Math.max(0.1, 1.0 - normalized * 0.9);
    }

    // Fallback: absolute distance scoring (no hard cutoff — just diminishing returns)
    // Trucks with no GPS location get a neutral score of 0.5
    if (distance >= 10000) return 0.5; // No location data

    if (distance <= 10) return 1.0;   // Same neighborhood
    if (distance <= 25) return 0.95;  // Same city
    if (distance <= 50) return 0.85;  // Nearby city
    if (distance <= 100) return 0.70; // Regional
    if (distance <= 200) return 0.55; // Same country area
    if (distance <= 500) return 0.40; // Long distance
    if (distance <= 1000) return 0.25; // Very long distance
    return 0.10; // Extreme distance — still valid, just lowest priority
  }

  private calculateCapacityScore(truck: Truck, load: Load): number {
    try {
      if (!truck?.capacityWeight || truck.capacityWeight <= 0) return 0;
      if (!load?.weight || load.weight <= 0) return 0;

      const weightUtilization = load.weight / truck.capacityWeight;
      const volumeUtilization =
        truck.capacityVolume && truck.capacityVolume > 0
          ? (load.volume || 0) / truck.capacityVolume
          : 0;

      if (
        weightUtilization > 1 ||
        (volumeUtilization > 1 && truck.capacityVolume > 0)
      )
        return 0;

      const maxUtilization = Math.max(weightUtilization, volumeUtilization);

      // Optimal utilization curve (70-90% is ideal)
      if (maxUtilization >= 0.7 && maxUtilization <= 0.9) return 1.0;
      if (maxUtilization >= 0.5 && maxUtilization < 0.7) return 0.8;
      if (maxUtilization >= 0.9 && maxUtilization <= 1.0) return 0.6;
      if (maxUtilization >= 0.3 && maxUtilization < 0.5) return 0.6;
      return 0.4;
    } catch (error) {
      console.error('Error in calculateCapacityScore:', error);
      return 0.5; // Default score on error
    }
  }

  private calculateEquipmentScore(truck: Truck, load: Load): number {
    try {
      if (!truck || !load) return 0.5;

      let score = 1.0;

      // Check refrigeration requirement
      if (load.requiresRefrigeration && !truck.hasRefrigeration) {
        score = 0; // Deal breaker
      }

      // Check hazmat requirement
      if (load.isHazardous && !truck.hasHazmatPermit) {
        score = 0; // Deal breaker
      }

      // Check loading equipment requirements
      if (load.requiresForklift && !truck.hasLiftGate) {
        score *= 0.8; // Partial penalty — hard rejection handled upstream in scoreTruck()
      }

      if (load.requiresCrane && !truck.hasWinch) {
        score *= 0.7; // Partial penalty
      }

      if (load.requiresLoadingDock && !truck.hasTailLift) {
        score *= 0.9; // Minor penalty
      }

      // Check dimensional compatibility
      if (load.length && load.width && load.height) {
        const dimensionalScore = this.calculateDimensionalCompatibility(
          truck,
          load,
        );
        score *= dimensionalScore;
      }

      return score;
    } catch (error) {
      console.error('Error in calculateEquipmentScore:', error);
      return 0.5; // Default score on error
    }
  }

  private calculateTemperatureScore(truck: Truck, load: Load): number {
    try {
      if (!truck || !load) return 0.5;

      if (!load.temperatureMin && !load.temperatureMax) return 1.0; // No temperature requirements

      if (!truck.hasRefrigeration) return 0; // No temperature control

      // For refrigerated cargo, check if truck can maintain required temperature
      // This would require additional truck temperature range data
      return 0.8; // Default score for refrigerated trucks
    } catch (error) {
      console.error('Error in calculateTemperatureScore:', error);
      return 0.5; // Default score on error
    }
  }

  private calculateSecurityScore(truck: Truck, load: Load): number {
    try {
      if (!truck || !load) return 0.5;

      let score = 1.0;

      // GPS monitoring requirement
      if (load.requiresGpsMonitoring && !truck.hasGps) {
        score *= 0.5; // Significant penalty
      }

      // Temperature monitoring requirement
      if (load.requiresTemperatureMonitoring && !truck.hasRefrigeration) {
        score *= 0.6; // Significant penalty
      }

      // Insurance coverage requirement
      if (load.insuranceValue && load.insuranceValue > 100000) {
        // Check if truck has adequate insurance coverage
        // This would require truck insurance data
        score *= 0.9; // Minor penalty for high-value cargo
      }

      return score;
    } catch (error) {
      console.error('Error in calculateSecurityScore:', error);
      return 0.5; // Default score on error
    }
  }

  private calculateRouteClearanceScore(truck: Truck, load: Load): number {
    try {
      if (!truck || !load) return 0.5;

      let score = 1.0;

      // Low clearance requirement
      if (load.requiresLowClearanceRoute && load.maxClearanceHeight) {
        if (truck.maxHeight && truck.maxHeight > load.maxClearanceHeight) {
          score = 0; // Deal breaker
        }
      }

      // Escort vehicle requirement
      if (load.requiresEscortVehicle) {
        score *= 0.9; // Minor penalty for complexity
      }

      return score;
    } catch (error) {
      console.error('Error in calculateRouteClearanceScore:', error);
      return 0.5; // Default score on error
    }
  }

  private calculateTimeScore(truck: Truck, load: Load): number {
    try {
      if (!truck || !load) return 0.5;

      if (!load.isTimeCritical) return 1.0;

      // Check truck availability and current location
      // This would require real-time availability data
      return 0.9; // Default score for time-critical cargo
    } catch (error) {
      console.error('Error in calculateTimeScore:', error);
      return 0.5; // Default score on error
    }
  }

  private calculateRatingScore(truck: Truck): number {
    try {
      if (!truck || !truck.averageRating || truck.averageRating <= 0)
        return 0.5; // Default score if no rating
      return Math.min(truck.averageRating / 5, 1.0);
    } catch (error) {
      console.error('Error in calculateRatingScore:', error);
      return 0.5; // Default score on error
    }
  }

  private calculateCostScore(truck: Truck, load: Load): number {
    try {
      const distance = this.calculateDistance(load, truck);
      const estimatedCost = this.estimateCost(distance, load.weight, truck);
      const marketAverage = this.getMarketAverageCost(load);

      if (!marketAverage || marketAverage <= 0) return 0.5; // Default score if market average unavailable

      const costRatio = estimatedCost / marketAverage;

      if (costRatio <= 0.8) return 1.0; // Very competitive
      if (costRatio <= 0.9) return 0.9; // Competitive
      if (costRatio <= 1.0) return 0.8; // At market rate
      if (costRatio <= 1.1) return 0.6; // Slightly above market
      if (costRatio <= 1.2) return 0.4; // Above market
      return 0.2; // Expensive
    } catch (error) {
      console.error('Error in calculateCostScore:', error);
      return 0.5; // Default score on error
    }
  }

  private calculateExperienceScore(truck: Truck, load: Load): number {
    try {
      if (!truck || !load) return 0.5;

      let score = 0.5; // Base score

      // Experience with cargo type
      if (truck.truckType === this.getTruckTypeForCargo(load.cargoType)) {
        score += 0.3;
      }

      // Years of experience (based on truck age)
      if (truck.year) {
        const truckAge = new Date().getFullYear() - truck.year;
        if (truckAge >= 10) score += 0.3;
        else if (truckAge >= 5) score += 0.2;
        else if (truckAge >= 2) score += 0.1;
      }

      // Special handling experience
      if (load.isFragile && truck.hasSideRails) {
        score += 0.2;
      }

      // Safety record
      if (truck.averageRating) {
        if (truck.averageRating >= 4.5) score += 0.1;
        else if (truck.averageRating >= 4.0) score += 0.05;
      }

      return Math.min(score, 1.0);
    } catch (error) {
      console.error('Error in calculateExperienceScore:', error);
      return 0.5; // Default score on error
    }
  }

  private calculateAvailabilityScore(truck: Truck): number {
    if (truck.status === VehicleStatus.AVAILABLE) return 1.0;

    if (
      truck.status === VehicleStatus.IN_TRANSIT &&
      truck.estimatedAvailableTime
    ) {
      const hoursUntilAvailable =
        (new Date(truck.estimatedAvailableTime).getTime() - Date.now()) /
        (1000 * 60 * 60);

      if (hoursUntilAvailable <= 2) return 0.9;
      if (hoursUntilAvailable <= 6) return 0.8;
      if (hoursUntilAvailable <= 12) return 0.6;
      if (hoursUntilAvailable <= 24) return 0.4;
      if (hoursUntilAvailable <= 48) return 0.2;
      return 0.1;
    }

    if (truck.status === VehicleStatus.MAINTENANCE) return 0.1;
    return 0.2;
  }

  // =====================================================
  // GPS TRACKING SCORE (Core Criteria #4)
  // Evaluates GPS availability for cargo monitoring
  // =====================================================
  private calculateGpsTrackingScore(truck: Truck, load: Load): number {
    let score = 0;

    // Check if truck has GPS
    if (truck.hasGps) {
      score += 0.5; // Base score for having GPS
    }

    // Check for real-time tracking capability
    if (truck.securityFeatures?.hasGps) {
      score += 0.2;
    }

    // Check for cargo monitoring
    if (truck.securityFeatures?.hasCargoMonitoring) {
      score += 0.15;
    }

    // Check for temperature alerts (important for refrigerated cargo)
    if (load.requiresRefrigeration && truck.securityFeatures?.hasTemperatureAlerts) {
      score += 0.15;
    }

    // Check for geofencing
    if (truck.securityFeatures?.hasGeofencing) {
      score += 0.1;
    }

    // If load requires GPS monitoring, score is 0 without GPS
    if (load.requiresGpsMonitoring && !truck.hasGps && !truck.securityFeatures?.hasGps) {
      return 0;
    }

    // Normalize to 0-1 range
    return Math.min(score, 1.0);
  }

  // =====================================================
  // ROUTE SCORE (Core Criteria #6)
  // Uses pickupLocation/deliveryLocation getters (from locations[] JSONB array)
  // and also falls back to origin/destination fields if set.
  //
  // CORRIDOR LOGIC:
  // A match requires that the truck's operational route actually COVERS the
  // cargo's journey.  Simply sharing an origin while heading to a different
  // destination (e.g. Mombasa→Kigali truck vs Mombasa→Zimbabwe cargo) is NOT
  // a good match and must score LOW, not 0.7.
  //
  // Scoring rules per route candidate:
  //   1.0 — origin AND destination both match the truck route      (perfect)
  //   0.8 — cargo destination is on the truck's corridor           (partial but valid)
  //   0.2 — only origin matches, destinations diverge              (shared start, wrong direction)
  //   0.1 — only destination matches (truck starts elsewhere)      (pickup problem)
  //   0.0 → routeTypeCompatibility × 0.4 — nothing matches        (no relevant route)
  // =====================================================
  private async calculateRouteScore(truck: Truck, load: Load): Promise<number> {
    try {
      // Base / neutral score returned when no route data is available at all
      const NEUTRAL_SCORE = 0.5;

      // ── 1. Resolve load origin / destination city strings ──────────────────
      const pickupLoc = load.pickupLocation;
      const deliveryLoc = load.deliveryLocation;

      const originCity = pickupLoc?.locationData?.city
        || pickupLoc?.locationData?.address
        || (load as any).origin?.city
        || (load as any).origin?.address;

      const destinationCity = deliveryLoc?.locationData?.city
        || deliveryLoc?.locationData?.address
        || (load as any).destination?.city
        || (load as any).destination?.address;

      if (!originCity || !destinationCity) {
        this.logger.debug(
          `Load ${load.id}: no resolvable origin/destination — neutral route score`,
        );
        return NEUTRAL_SCORE;
      }

      // ── 2. Resolve cargo geo-coordinates for corridor checking ─────────────
      const pickupCoords = pickupLoc?.locationData?.coordinates;
      const deliveryCoords = deliveryLoc?.locationData?.coordinates;

      const cargoPickupLat = pickupCoords?.latitude ?? null;
      const cargoPickupLon = pickupCoords?.longitude ?? null;
      const cargoDeliveryLat = deliveryCoords?.latitude ?? null;
      const cargoDeliveryLon = deliveryCoords?.longitude ?? null;

      // ── 3. Fetch truck's assigned routes ───────────────────────────────────
      const truckRoutes = await this.routeTruckRepository.find({
        where: { truckId: truck.id, tenantId: truck.tenantId },
        relations: ['route'],
      });

      if (!truckRoutes || truckRoutes.length === 0) {
        // Truck owner has not configured any operational routes.
        // This means the truck is UNRESTRICTED — it will take any cargo anywhere.
        // Score 0.8 (not 1.0, since a truck with a confirmed matching route is
        // always a more reliable fit than one with no route data at all).
        this.logger.debug(
          `Truck ${truck.plateNumber}: no assigned routes — unrestricted, score 0.8`,
        );
        return 0.8;
      }

      this.logger.debug(
        `Route check: load ${originCity}→${destinationCity} vs truck ${truck.plateNumber} (${truckRoutes.length} routes)`,
      );

      // ── 4. Score each truck route; keep the best ───────────────────────────
      let bestRouteScore = 0;

      for (const truckRoute of truckRoutes) {
        if (!truckRoute.route) continue;

        const route = truckRoute.route;
        const originMatch = this.compareLocations(originCity, route.origin);
        const destinationMatch = this.compareLocations(destinationCity, route.destination);

        let routeScore = 0;

        if (originMatch && destinationMatch) {
          // ── Perfect match: truck runs exactly this corridor ────────────────
          routeScore = 1.0;

        } else if (originMatch && !destinationMatch) {
          // ── Shared origin but different destination ────────────────────────
          // This is the Mombasa→Kigali vs Mombasa→Zimbabwe case.
          // Check whether the cargo destination lies geographically ON the
          // truck's corridor using the "detour ratio" test:
          //   If dist(truckOrigin→cargoDest) + dist(cargoDest→truckDest)
          //       ≈ dist(truckOrigin→truckDest)
          // …then the destination is on or near the route.
          // We allow up to a 25 % detour tolerance.
          const onCorridor = this.isDestinationOnCorridor(
            route, cargoDeliveryLat, cargoDeliveryLon,
          );

          if (onCorridor) {
            // Cargo destination is along the truck's route — valid sub-trip
            routeScore = 0.8;
            this.logger.debug(
              `Truck ${truck.plateNumber}: cargo dest is on corridor (${route.origin}→${route.destination}) → 0.8`,
            );
          } else {
            // Truck is heading a different direction — penalise heavily
            routeScore = 0.2;
            this.logger.debug(
              `Truck ${truck.plateNumber}: shared origin but destinations diverge ` +
              `(route→${route.destination}, cargo→${destinationCity}) → 0.2`,
            );
          }

        } else if (!originMatch && destinationMatch) {
          // ── Truck ends at cargo's destination but starts elsewhere ─────────
          // Could be a return-leg / repositioning opportunity — low but non-zero
          routeScore = 0.1;

        } else {
          // ── No endpoint match — fall back to route-type compatibility ──────
          const routeTypeScore = this.calculateRouteTypeCompatibility(route, load);
          routeScore = routeTypeScore * 0.4;
        }

        if (routeScore > bestRouteScore) bestRouteScore = routeScore;
      }

      this.logger.debug(
        `Truck ${truck.plateNumber} best route score: ${bestRouteScore.toFixed(2)}`,
      );
      return bestRouteScore;
    } catch (error) {
      this.logger.error(`Error calculating route score: ${error.message}`);
      return 0.5;
    }
  }

  /**
   * Returns true when the cargo's delivery point lies on (or very close to)
   * the straight-line corridor between the truck route's origin and destination.
   *
   * We use the "detour ratio" test:
   *   dist(routeOrigin → cargoDest) + dist(cargoDest → routeDest)
   *     ≤  dist(routeOrigin → routeDest) × (1 + DETOUR_TOLERANCE)
   *
   * A 25 % tolerance handles realistic road curves and slight off-corridor stops.
   * If the route has no geo-coordinates, falls back to string-contains check.
   */
  private isDestinationOnCorridor(
    route: Route,
    cargoDestLat: number | null,
    cargoDestLon: number | null,
  ): boolean {
    const DETOUR_TOLERANCE = 0.25; // 25 % extra distance allowed

    const rOriginLat = route.originLat != null ? Number(route.originLat) : null;
    const rOriginLon = route.originLng != null ? Number(route.originLng) : null;
    const rDestLat = route.destinationLat != null ? Number(route.destinationLat) : null;
    const rDestLon = route.destinationLng != null ? Number(route.destinationLng) : null;

    // ── Geo path: all four coordinates must be present ─────────────────────
    if (
      rOriginLat != null && rOriginLon != null &&
      rDestLat != null && rDestLon != null &&
      cargoDestLat != null && cargoDestLon != null
    ) {
      const directDist = this.calculateHaversineDistance(
        rOriginLat, rOriginLon, rDestLat, rDestLon,
      );
      if (directDist === 0) return true; // degenerate route — same point

      const viaDetour =
        this.calculateHaversineDistance(rOriginLat, rOriginLon, cargoDestLat, cargoDestLon) +
        this.calculateHaversineDistance(cargoDestLat, cargoDestLon, rDestLat, rDestLon);

      const isOnPath = viaDetour <= directDist * (1 + DETOUR_TOLERANCE);
      this.logger.debug(
        `Corridor check: directDist=${directDist.toFixed(0)}km ` +
        `viaDetour=${viaDetour.toFixed(0)}km onPath=${isOnPath}`,
      );
      return isOnPath;
    }

    // ── Fallback: no coordinates — treat as NOT on corridor (conservative) ──
    return false;
  }

  /**
   * Compare two location strings for similarity
   * Returns true if locations match (case-insensitive, partial match)
   */
  private compareLocations(location1: string, location2: string): boolean {
    if (!location1 || !location2) return false;

    const loc1 = location1.toLowerCase().trim();
    const loc2 = location2.toLowerCase().trim();

    // Exact match
    if (loc1 === loc2) return true;

    // Partial match (one contains the other)
    if (loc1.includes(loc2) || loc2.includes(loc1)) return true;

    // Extract city names and compare (handle "City, State" format)
    const city1 = loc1.split(',')[0].trim();
    const city2 = loc2.split(',')[0].trim();
    if (city1 === city2) return true;

    return false;
  }

  /**
   * Calculate route type compatibility score.
   * Used only as a fallback when no endpoint matches exist.
   */
  private calculateRouteTypeCompatibility(route: Route, load: Load): number {
    let score = 0.5;

    // Resolve cargo route distance from JSONB location coordinates only
    const pickupCoords = load.pickupLocation?.locationData?.coordinates;
    const deliveryCoords = load.deliveryLocation?.locationData?.coordinates;

    let cargoDistance = 0;
    if (pickupCoords && deliveryCoords) {
      cargoDistance = this.calculateHaversineDistance(
        pickupCoords.latitude, pickupCoords.longitude,
        deliveryCoords.latitude, deliveryCoords.longitude,
      );
    }

    // Highway routes: best for long-distance or time-critical cargo
    if (route.routeType === RouteType.HIGHWAY) {
      if (load.isTimeCritical || load.urgencyLevel === UrgencyLevel.CRITICAL) {
        score += 0.3;
      }
      if (cargoDistance > 200) {
        score += 0.2;
      }
    }

    // City routes: best for short local deliveries with loading facilities
    if (route.routeType === RouteType.CITY) {
      if (cargoDistance > 0 && cargoDistance < 50) {
        score += 0.3;
      }
      if (load.requiresForklift || load.requiresLoadingDock) {
        score += 0.2;
      }
    }

    // Rural routes: penalty for hazmat/reefer (limited emergency services)
    if (route.routeType === RouteType.RURAL) {
      if (load.isHazardous || load.requiresRefrigeration) {
        score -= 0.2;
      }
    }

    // Mixed routes: versatile, small bonus
    if (route.routeType === RouteType.MIXED) {
      score += 0.2;
    }

    return Math.max(0, Math.min(score, 1.0));
  }

  // =====================================================
  // SIMPLIFIED MATCH REASON GENERATOR
  // Generates human-readable match explanation based on 6 core criteria
  // =====================================================
  private generateSimplifiedMatchReason(
    truck: Truck,
    load: Load,
    capacityScore: number,
    equipmentScore: number,
    distanceScore: number,
    gpsTrackingScore: number,
    availabilityScore: number,
    routeScore: number,
    distanceKm: number,
    utilization: string,
  ): string {
    const reasons: string[] = [];

    // 1. Capacity assessment
    if (capacityScore >= 0.9) {
      reasons.push(`Excellent capacity match (${utilization}% utilization)`);
    } else if (capacityScore >= 0.7) {
      reasons.push(`Good capacity match (${utilization}% utilization)`);
    } else if (capacityScore >= 0.5) {
      reasons.push(`Adequate capacity`);
    }

    // 2. Equipment compatibility
    if (equipmentScore >= 0.9) {
      reasons.push('Perfect equipment match');
    } else if (equipmentScore >= 0.7) {
      reasons.push('Good equipment compatibility');
    } else if (equipmentScore >= 0.5) {
      reasons.push('Basic equipment available');
    }

    // 3. Distance/proximity
    if (distanceScore >= 0.9) {
      reasons.push(`Very close (${distanceKm.toFixed(0)}km)`);
    } else if (distanceScore >= 0.7) {
      reasons.push(`Close proximity (${distanceKm.toFixed(0)}km)`);
    } else if (distanceScore >= 0.5) {
      reasons.push(`Moderate distance (${distanceKm.toFixed(0)}km)`);
    } else {
      reasons.push(`Distance: ${distanceKm.toFixed(0)}km`);
    }

    // 4. GPS tracking
    if (gpsTrackingScore >= 0.8) {
      reasons.push('Full GPS tracking available');
    } else if (gpsTrackingScore >= 0.5) {
      reasons.push('GPS tracking enabled');
    } else if (gpsTrackingScore > 0) {
      reasons.push('Basic GPS available');
    }

    // 5. Availability
    if (availabilityScore >= 1.0) {
      reasons.push('Immediately available');
    } else if (availabilityScore >= 0.8) {
      reasons.push('Available soon');
    } else if (availabilityScore >= 0.5) {
      reasons.push('Available within hours');
    }

    // 6. Route compatibility
    if (routeScore >= 0.9) {
      reasons.push('Perfect route match');
    } else if (routeScore >= 0.7) {
      reasons.push('Good route compatibility');
    } else if (routeScore >= 0.5) {
      reasons.push('Route compatible');
    }

    // Add special equipment mentions
    if (truck.hasRefrigeration && load.requiresRefrigeration) {
      reasons.push('Refrigeration available');
    }
    if (truck.hasHazmatPermit && load.isHazardous) {
      reasons.push('Hazmat certified');
    }
    if (truck.hasLiftGate && (load.requiresForklift || load.requiresCrane)) {
      reasons.push('Lift gate available');
    }

    return reasons.length > 0
      ? reasons.join(' • ')
      : 'Match found';
  }

  private calculateSpecialRequirementsScore(truck: Truck, load: Load): number {
    let score = 1.0;
    let requirements = 0;
    let met = 0;

    if (load.requiresRefrigeration) {
      requirements++;
      if (truck.hasRefrigeration) met++;
      else score = 0; // Hard requirement
    }

    if (load.isHazardous) {
      requirements++;
      if (truck.hasHazmatPermit) met++;
      else score = 0; // Hard requirement
    }

    if (load.isFragile) {
      requirements++;
      if (truck.hasSideRails || truck.hasTarps) met++;
      else score -= 0.3; // Soft requirement
    }

    // Check truck requirements
    if (load.truckRequirements?.requiredFeatures?.length > 0) {
      for (const feature of load.truckRequirements.requiredFeatures) {
        requirements++;
        if (this.hasTruckFeature(truck, feature)) met++;
        else score -= 0.2;
      }
    }

    return Math.max(score, 0);
  }

  // =====================================================
  // DYNAMIC WEIGHT ADJUSTMENT RULES (FR-MATCH-001 to FR-MATCH-005)
  // =====================================================
  private getDynamicWeights(load: Load): DynamicWeights {
    // Base weights per v3 specification (must sum to 1.0 for base)
    const weights: DynamicWeights = {
      capacity: 0.30,         // 30% - Weight/volume utilization fit
      equipment: 0.25,        // 25% - Forklift, crane, reefer, hazmat compatibility
      distance: 0.20,         // 20% - Truck proximity to pickup
      availability: 0.15,     // 15% - Truck status and next available time
      gpsTracking: 0.10,      // 10% - GPS availability for monitoring
      // Dynamic dimensions start at 0, adjusted based on cargo type
      temperature: 0,           // Dynamic: up to 35% for refrigerated
      security: 0,            // Dynamic: up to 20% for high-value/hazardous
      routeCompatibility: 0,  // Dynamic: up to 15% for specific routes
      time: 0,                // Dynamic: up to 20% for time-critical
      experience: 0,          // Dynamic: up to 15% for specialized cargo
      rating: 0,              // Dynamic: up to 15% for quality assurance
      cost: 0,                // Dynamic: up to 15% for price optimization
    };

    // FR-MATCH-001: Hazardous cargo adjustments
    // Equipment weight +15%, Security weight +10%
    if (load.isHazardous) {
      weights.equipment += 0.15;
      weights.security += 0.10;
      weights.gpsTracking += 0.05; // Additional GPS for hazmat tracking
      // Reduce others proportionally
      weights.capacity -= 0.10;
      weights.distance -= 0.10;
      weights.availability -= 0.05;
      weights.routeCompatibility += 0.05; // Route clearance matters for hazmat
    }

    // FR-MATCH-002: Time-Critical cargo adjustments
    // Availability weight +20%, Distance weight +10%
    if (load.isTimeCritical || load.urgencyLevel === UrgencyLevel.CRITICAL) {
      weights.availability += 0.20;
      weights.distance += 0.10;
      weights.time += 0.15; // Time window matching becomes critical
      // Reduce others proportionally
      weights.capacity -= 0.15;
      weights.equipment -= 0.10;
      weights.gpsTracking -= 0.05;
      weights.rating += 0.05; // Reliable carriers matter for time-critical
    }

    // FR-MATCH-003: Fragile cargo adjustments
    // Equipment weight +15%, Experience weight +10%
    if (load.isFragile) {
      weights.equipment += 0.15;
      weights.experience += 0.10;
      weights.rating += 0.05; // High-rated carriers for fragile
      // Reduce others proportionally
      weights.capacity -= 0.10;
      weights.distance -= 0.10;
      weights.cost -= 0.05;
      weights.routeCompatibility += 0.05; // Smooth route for fragile
    }

    // FR-MATCH-004: Refrigerated cargo adjustments
    // Temperature weight becomes primary factor at 35%
    if (load.requiresRefrigeration) {
      weights.temperature = 0.35; // Primary factor
      weights.equipment += 0.10; // Refrigeration equipment critical
      // Reduce base weights significantly to accommodate temperature
      weights.capacity -= 0.15;
      weights.distance -= 0.10;
      weights.availability -= 0.05;
      weights.gpsTracking -= 0.05;
      weights.routeCompatibility -= 0.05;
    }

    // FR-MATCH-005: High-Value cargo (>KES 500K) adjustments
    // Security weight +20%, Experience weight +15%
    const loadValue = this.estimateLoadValue(load);
    if (loadValue > HIGH_VALUE_THRESHOLD_KES) {
      weights.security += 0.20;
      weights.experience += 0.15;
      weights.rating += 0.10; // Only highest-rated carriers
      weights.gpsTracking += 0.10; // Enhanced tracking for high-value
      // Reduce others proportionally
      weights.capacity -= 0.15;
      weights.distance -= 0.15;
      weights.cost -= 0.15; // Cost less important for high-value
      weights.routeCompatibility += 0.10; // Secure routes matter
    }

    // Additional dynamic adjustments for specialized requirements
    if (load.requiresGpsMonitoring) {
      weights.security += 0.10;
      weights.gpsTracking += 0.10;
      weights.distance -= 0.10;
    }

    // If load has specific origin/destination with route constraints
    // Use pickupLocation/deliveryLocation getters (locations[] JSONB) as primary source
    const hasResolvedLocations = !!(load.pickupLocation || load.origin)
      && !!(load.deliveryLocation || load.destination);
    if (hasResolvedLocations) {
      if (load.truckRequirements?.requiredFeatures?.includes('ESCORT') ||
          load.truckRequirements?.requiredFeatures?.includes('HEAVY_DUTY')) {
        weights.routeCompatibility += 0.15;
        weights.distance -= 0.10;
      }
    }

    // For standard cargo without special requirements, distribute remaining weight to cost optimization
    if (!load.isHazardous && !load.requiresRefrigeration && !load.isFragile && 
        loadValue <= HIGH_VALUE_THRESHOLD_KES && !load.isTimeCritical) {
      weights.cost += 0.15;
      weights.rating += 0.05;
      weights.routeCompatibility += 0.05;
    }

    // Normalize all weights to sum to 1.0
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    Object.keys(weights).forEach((key) => {
      weights[key as keyof DynamicWeights] = weights[key as keyof DynamicWeights] / totalWeight;
    });

    return weights;
  }

  /**
   * Estimate load value for high-value cargo detection (FR-MATCH-005)
   */
  private estimateLoadValue(load: Load): number {
    // Estimate based on cargo type and weight
    // Uses per-kg valuation for high-value cargo types
    const baseValuePerKg: Record<string, number> = {
      'ELECTRONICS': 500,
      'PHARMACEUTICALS': 800,
      'JEWELRY': 2000,
      'PRECIOUS_METALS': 1500,
      'ART': 1000,
      'LUXURY_GOODS': 600,
      'HAZARDOUS': 200,
      'REFRIGERATED': 150,
      'FRAGILE': 200,
      'GENERAL': 50,
      'CONTAINER': 30,
      'BULK': 20,
    };
    const valuePerKg = baseValuePerKg[load.cargoType] || 50;
    return load.weight * valuePerKg;
  }

  // =====================================================
  // FULL 12-DIMENSION WEIGHTED SCORE CALCULATION
  // =====================================================
  private calculateWeightedScore(
    factors: MatchingFactors,
    weights: DynamicWeights,
  ): number {
    return (
      // Base 5 dimensions (always calculated)
      factors.capacityScore * weights.capacity +
      factors.equipmentScore * weights.equipment +
      factors.distanceScore * weights.distance +
      factors.availabilityScore * weights.availability +
      factors.gpsTrackingScore * weights.gpsTracking +
      // Dynamic 7 dimensions (weighted based on cargo type)
      (factors.temperatureScore || 0) * weights.temperature +
      (factors.securityScore || 0) * weights.security +
      (factors.routeCompatibilityScore || 0) * weights.routeCompatibility +
      (factors.timeScore || 0) * weights.time +
      (factors.experienceScore || 0) * weights.experience +
      (factors.ratingScore || 0) * weights.rating +
      (factors.costScore || 0) * weights.cost
    );
  }

  private calculateConfidence(factors: MatchingFactors): number {
    // Calculate confidence based on data completeness and factor consistency
    let confidence = 0.5; // Base confidence

    // Data completeness
    const factorValues = Object.values(factors).filter(
      (val) => typeof val === 'number',
    );
    const completenessScore =
      factorValues.filter((val) => val !== null && val !== undefined).length /
      factorValues.length;
    confidence += completenessScore * 0.3;

    // Factor consistency (lower variance = higher confidence)
    const mean =
      factorValues.reduce((sum, val) => sum + val, 0) / factorValues.length;
    const variance =
      factorValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      factorValues.length;
    confidence += Math.max(0, 1 - variance) * 0.2;

    return Math.min(confidence, 1.0);
  }

  private calculateSuccessProbability(
    truck: Truck,
    load: Load,
    factors: MatchingFactors,
  ): number {
    let probability = 0.7; // Base probability

    // Adjust based on 6 core factors
    if (factors.capacityScore >= 0.9) probability += 0.1;
    if (factors.equipmentScore >= 0.8) probability += 0.1;
    if (factors.distanceScore >= 0.8) probability += 0.05;
    if (factors.routeCompatibilityScore >= 0.8) probability += 0.05;
    if (factors.gpsTrackingScore >= 0.7) probability += 0.05;
    if (factors.availabilityScore >= 0.9) probability += 0.05;

    // Penalize for risk factors
    if (load.isHazardous && !truck.hasHazmatPermit) probability -= 0.3;
    if (load.requiresRefrigeration && !truck.hasRefrigeration) probability -= 0.3;

    return Math.max(0.1, Math.min(1.0, probability));
  }

  private calculateRiskScore(
    truck: Truck,
    load: Load,
    factors: MatchingFactors,
  ): number {
    let risk = 0.2; // Base risk

    // Increase risk for low scores on core criteria
    if (factors.capacityScore < 0.5) risk += 0.2;
    if (factors.equipmentScore < 0.5) risk += 0.25;
    if (factors.distanceScore < 0.3) risk += 0.1;
    if (factors.gpsTrackingScore < 0.3) risk += 0.1;
    if (factors.availabilityScore < 0.5) risk += 0.15;

    // Special cargo risks
    if (load.isHazardous) risk += 0.15;
    if (load.isFragile) risk += 0.1;
    if (load.requiresRefrigeration) risk += 0.1;

    return Math.min(1.0, risk);
  }

  private calculateRecommendedPrice(
    estimatedCost: number,
    profitMargin: number,
  ): number {
    const targetProfitMargin = 0.15; // 15% target profit margin
    return estimatedCost / (1 - targetProfitMargin);
  }

  private estimateDeliveryTime(distanceKm: number, load: Load): number {
    const averageSpeed = 80; // km/h including breaks
    let duration = distanceKm / averageSpeed;

    // Add loading/unloading time
    duration +=
      (load.loadingTimeEstimate || 2) + (load.unloadingTimeEstimate || 2);

    // Special handling delays
    if (load.isFragile) duration += 1;
    if (load.isHazardous) duration += 2;
    if (load.requiresRefrigeration) duration += 1;

    // Rest breaks for long distances
    if (distanceKm > 800) duration += 8; // Mandatory rest

    return Math.round(duration);
  }

  /**
   * Calculate the route distance (pickup → delivery) for a load.
   * Every load has pickup and delivery locations — no fallback values.
   * Returns the haversine distance in km, or throws if coordinates are missing.
   */
  private calculateRouteDistance(load: Load): number {
    const pickup   = load.pickupLocation;
    const delivery = load.deliveryLocation;

    const pLat = pickup?.locationData?.coordinates?.latitude;
    const pLon = pickup?.locationData?.coordinates?.longitude;
    const dLat = delivery?.locationData?.coordinates?.latitude;
    const dLon = delivery?.locationData?.coordinates?.longitude;

    if (!pLat || !pLon || !dLat || !dLon) {
      this.logger.error(
        `calculateRouteDistance: Load ${load.id} is missing route coordinates. ` +
        `pickup=${JSON.stringify(pickup?.locationData?.coordinates)} ` +
        `delivery=${JSON.stringify(delivery?.locationData?.coordinates)}`,
      );
      // Return 0 — caller will skip the maxDistance gate for this truck
      // rather than incorrectly rejecting or accepting it.
      return 0;
    }

    return this.calculateHaversineDistance(pLat, pLon, dLat, dLon);
  }

  private calculateDistance(load: Load, truck: Truck): number {
    // Check if truck has location
    if (!truck.currentLocation) {
      console.log('⚠️ Truck has no location, returning max distance');
      return 10000; // Return large distance if location is unknown
    }

    // Check if load has pickup location
    const pickupLocation = load.pickupLocation;
    if (!pickupLocation?.locationData?.coordinates) {
      console.log('⚠️ Load has no pickup coordinates, returning max distance');
      return 10000;
    }

    try {
      // Parse truck coordinates - handle PostGIS GeoJSON Point format
      // GeoJSON Point: { type: "Point", coordinates: [longitude, latitude] }
      let truckLat: number, truckLon: number;

      const loc = truck.currentLocation as any;
      if (loc.coordinates && Array.isArray(loc.coordinates)) {
        [truckLon, truckLat] = loc.coordinates;
      } else if (loc.latitude && loc.longitude) {
        // Handle potential object format { latitude: x, longitude: y }
        truckLat = Number(loc.latitude);
        truckLon = Number(loc.longitude);
      } else {
        console.warn('⚠️ Unknown truck location format:', truck.currentLocation);
        return 10000;
      }

      const loadLat = pickupLocation.locationData.coordinates.latitude;
      const loadLon = pickupLocation.locationData.coordinates.longitude;

      if (!truckLat || !truckLon || !loadLat || !loadLon) {
        return 10000;
      }

      return this.calculateHaversineDistance(truckLat, truckLon, loadLat, loadLon);
    } catch (error) {
      console.error('Error calculating distance:', error);
      return 10000;
    }
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
      Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Estimate the total operating cost for the carrier to run this trip.
   *
   * Formula (see freight-rates.constants.ts for full explanation):
   *   baseCost     = routeDistanceKm × BASE_COST_USD_PER_KM × regionalMultiplier
   *   loadFactor   = weightKg / truckCapacityKg  (clamped 0.10 – 1.00)
   *   adjustedCost = baseCost × (0.40 + 0.60 × loadFactor)
   *   finalCost    = adjustedCost × surchargeMultiplier
   *
   * The 0.40/0.60 split represents fixed vs variable costs:
   *   Fixed  (40%) — driver wages, insurance, truck payment → always incurred
   *   Variable (60%) — fuel, maintenance → scale with utilisation
   */
  private estimateCost(
    routeDistanceKm: number,
    weightKg: number,
    truck: Truck,
  ): number {
    // 1. Determine regional multiplier from truck's pickup country
    //    (We use the load's pickup country as the operating region proxy)
    const country = (truck as any).currentCountry ?? '';
    const regionalMultiplier =
      REGIONAL_MULTIPLIERS[country?.toUpperCase?.()] ?? DEFAULT_REGIONAL_MULTIPLIER;

    // 2. Base cost: USD per km × distance × regional adjustment
    const baseCost = routeDistanceKm * BASE_COST_USD_PER_KM * regionalMultiplier;

    // 3. Load factor adjustment — penalise low utilisation
    const capacityKg = Number(truck.capacityWeight) || weightKg; // fallback to load weight
    const loadFactor = Math.min(Math.max(weightKg / capacityKg, 0.10), 1.00);
    const utilisationAdjustedCost = baseCost * (0.40 + 0.60 * loadFactor);

    // 4. Truck-specific surcharges
    let surcharge = 1.0;
    if (truck.hasRefrigeration)               surcharge += TRUCK_SURCHARGES.REFRIGERATION;
    if (truck.hasHazmatPermit)                surcharge += TRUCK_SURCHARGES.HAZMAT;
    if (truck.fuelType === FuelType.ELECTRIC) surcharge -= TRUCK_SURCHARGES.ELECTRIC_DISCOUNT;

    const finalCost = utilisationAdjustedCost * surcharge;

    // 5. Enforce minimum floor
    return Math.round(Math.max(finalCost, MINIMUM_COST_USD) * 100) / 100;
  }

  /**
   * Estimate the revenue the carrier expects to earn from this trip.
   *
   * Priority:
   *   1. Use cargo owner's offeredPrice — the definitive market signal.
   *   2. Fall back to cost + standard carrier markup (20%).
   */
  private estimateRevenue(routeDistanceKm: number, weightKg: number, load?: Load): number {
    if (load) {
      const offered = Number(load.offeredPrice);
      if (offered > 0) {
        this.logger.debug(`estimateRevenue: using offeredPrice ${offered} for load ${load.id}`);
        return offered;
      }
    }

    // No offered price — derive from cost with carrier markup
    const cost = this.estimateCost(routeDistanceKm, weightKg, {} as Truck);
    const calculated = Math.round(cost * (1 + CARRIER_MARKUP_OVER_COST) * 100) / 100;
    this.logger.debug(
      `estimateRevenue: cost=${cost} + ${CARRIER_MARKUP_OVER_COST * 100}% markup = ${calculated}`,
    );
    return calculated;
  }

  /**
   * Market average cost — used as the benchmark for recommendedPrice.
   * Returns offeredPrice if set, otherwise cost + market benchmark markup.
   */
  private getMarketAverageCost(load: Load, distanceKm?: number): number {
    const offered = Number(load.offeredPrice);
    if (offered > 0) return offered;

    let routeKm = distanceKm ?? 0;

    if (!routeKm) {
      const pickup   = load.pickupLocation?.locationData?.coordinates;
      const delivery = load.deliveryLocation?.locationData?.coordinates;

      if (!pickup?.latitude || !pickup?.longitude || !delivery?.latitude || !delivery?.longitude) {
        this.logger.error(`getMarketAverageCost: Load ${load.id} missing route coordinates.`);
        return 0;
      }

      routeKm = this.calculateHaversineDistance(
        pickup.latitude, pickup.longitude,
        delivery.latitude, delivery.longitude,
      );
    }

    const baseCost = this.estimateCost(routeKm, Number(load.weight), {} as Truck);
    return Math.round(baseCost * (1 + MARKET_BENCHMARK_MARKUP) * 100) / 100;
  }

  /**
   * Return a per-component cost breakdown for the DTO.
   * Mirrors the estimateCost formula but returns each line item separately.
   */
  private estimateCostBreakdown(
    routeDistanceKm: number,
    weightKg: number,
    truck: Truck,
  ): { fuelCost: number; laborCost: number; maintenanceCost: number; insuranceCost: number } {
    const country = (truck as any).currentCountry ?? '';
    const rm = REGIONAL_MULTIPLIERS[country?.toUpperCase?.()] ?? DEFAULT_REGIONAL_MULTIPLIER;
    const capacityKg = Number(truck.capacityWeight) || weightKg;
    const lf = Math.min(Math.max(weightKg / capacityKg, 0.10), 1.00);
    const utilAdj = 0.40 + 0.60 * lf;

    const fuel        = Math.round(routeDistanceKm * COST_COMPONENTS_USD_PER_KM.fuel        * rm * utilAdj * 100) / 100;
    const labor       = Math.round(routeDistanceKm * (COST_COMPONENTS_USD_PER_KM.driverWages + COST_COMPONENTS_USD_PER_KM.driverBenefits) * rm * utilAdj * 100) / 100;
    const maintenance = Math.round(routeDistanceKm * COST_COMPONENTS_USD_PER_KM.maintenance  * rm * utilAdj * 100) / 100;
    const insurance   = Math.round(routeDistanceKm * COST_COMPONENTS_USD_PER_KM.insurance    * rm * utilAdj * 100) / 100;

    return { fuelCost: fuel, laborCost: labor, maintenanceCost: maintenance, insuranceCost: insurance };
  }

  private calculateDimensionalCompatibility(truck: Truck, load: Load): number {
    if (!load.length || !load.width || !load.height) return 0.5; // Default score if dimensions not provided

    // Check if cargo fits in truck dimensions
    const fitsLength =
      truck.maxLength && truck.maxLength > 0 && load.length <= truck.maxLength;
    const fitsWidth =
      truck.maxWidth && truck.maxWidth > 0 && load.width <= truck.maxWidth;
    const fitsHeight =
      truck.maxHeight && truck.maxHeight > 0 && load.height <= truck.maxHeight;

    if (fitsLength && fitsWidth && fitsHeight) {
      // Calculate utilization efficiency
      const lengthUtilization = load.length / truck.maxLength;
      const widthUtilization = load.width / truck.maxWidth;
      const heightUtilization = load.height / truck.maxHeight;

      const avgUtilization =
        (lengthUtilization + widthUtilization + heightUtilization) / 3;

      // Optimal utilization is around 80-90%
      if (avgUtilization >= 0.8 && avgUtilization <= 0.9) return 1.0;
      if (avgUtilization >= 0.7 && avgUtilization <= 0.95) return 0.9;
      if (avgUtilization >= 0.6 && avgUtilization <= 1.0) return 0.8;
      return 0.6;
    }

    return 0; // No compatibility
  }

  private getTruckTypeForCargo(cargoType: CargoType): TruckType {
    switch (cargoType) {
      case CargoType.REFRIGERATED:
        return TruckType.REFRIGERATED;
      case CargoType.HAZARDOUS:
        return TruckType.TANKER;
      case CargoType.LIQUID:
        return TruckType.TANKER;
      case CargoType.OVERSIZED:
        return TruckType.HEAVY_HAUL;
      case CargoType.FRAGILE:
        return TruckType.BOX_TRUCK;
      default:
        return TruckType.FLATBED;
    }
  }

  private hasTruckFeature(truck: Truck, feature: string): boolean {
    const featureMap: { [key: string]: boolean } = {
      refrigeration: truck.hasRefrigeration,
      lift_gate: truck.hasLiftGate,
      hazmat_permit: truck.hasHazmatPermit,
      gps_basic: truck.hasGps,
      side_rails: truck.hasSideRails,
      tarps: truck.hasTarps,
      straps: truck.hasStraps,
      chains: truck.hasChains,
      winch: truck.hasWinch,
      ram: truck.hasRam,
      tail_lift: truck.hasTailLift,
      side_lift: truck.hasSideLift,
      roller_bed: truck.hasRollerBed,
      drop_deck: truck.hasDropDeck,
      extendable: truck.hasExtendable,
      lowbed: truck.hasLowbed,
      step_deck: truck.hasStepDeck,
      power_only: truck.hasPowerOnly,
      container_chassis: truck.hasContainerChassis,
      tanker: truck.hasTanker,
      bulk: truck.hasBulk,
      heated: truck.hasHeated,
      ventilated: truck.hasVentilated,
      curtain_side: truck.hasCurtainSide,
      box: truck.hasBox,
      van: truck.hasVan,
      platform: truck.hasPlatform,
      car_carrier: truck.hasCarCarrier,
      heavy_haul: truck.hasHeavyHaul,
      oversized: truck.hasOversized,
      hazmat_capability: truck.hasHazmat,
      dangerous_goods: truck.hasDangerousGoods,
      food_grade: truck.hasFoodGrade,
      pharmaceutical: truck.hasPharmaceutical,
      liquid: truck.hasLiquid,
      dry_bulk: truck.hasDryBulk,
      gas: truck.hasGas,
      chemical: truck.hasChemical,
      waste: truck.hasWaste,
      reefer: truck.hasReefer,
      frozen: truck.hasFrozen,
      chilled: truck.hasChilled,
      ambient: truck.hasAmbient,
      controlled_atmosphere: truck.hasControlledAtmosphere,
      humidity_control: truck.hasHumidityControl,
      temperature_monitoring: truck.hasTemperatureMonitoring,
      gps_advanced: truck.hasGPS,
      tracking: truck.hasTracking,
      telematics: truck.hasTelematics,
      eld: truck.hasELD,
      dash_cam: truck.hasDashCam,
      safety_cameras: truck.hasSafetyCameras,
      collision_avoidance: truck.hasCollisionAvoidance,
      lane_departure: truck.hasLaneDeparture,
      adaptive_cruise: truck.hasAdaptiveCruise,
      blind_spot: truck.hasBlindSpot,
      backup_camera: truck.hasBackupCamera,
      tire_pressure_monitoring: truck.hasTirePressureMonitoring,
      engine_monitoring: truck.hasEngineMonitoring,
      fuel_monitoring: truck.hasFuelMonitoring,
      maintenance_alerts: truck.hasMaintenanceAlerts,
      driver_monitoring: truck.hasDriverMonitoring,
      fatigue_monitoring: truck.hasFatigueMonitoring,
      speed_monitoring: truck.hasSpeedMonitoring,
      idle_monitoring: truck.hasIdleMonitoring,
      route_optimization: truck.hasRouteOptimization,
      real_time_tracking: truck.hasRealTimeTracking,
      geofencing: truck.hasGeofencing,
      temperature_alerts: truck.hasTemperatureAlerts,
      humidity_alerts: truck.hasHumidityAlerts,
      shock_monitoring: truck.hasShockMonitoring,
      tilt_monitoring: truck.hasTiltMonitoring,
      door_monitoring: truck.hasDoorMonitoring,
      cargo_monitoring: truck.hasCargoMonitoring,
      weight_monitoring: truck.hasWeightMonitoring,
      volume_monitoring: truck.hasVolumeMonitoring,
      pressure_monitoring: truck.hasPressureMonitoring,
      flow_monitoring: truck.hasFlowMonitoring,
      level_monitoring: truck.hasLevelMonitoring,
      quality_monitoring: truck.hasQualityMonitoring,
      contamination_monitoring: truck.hasContaminationMonitoring,
      leak_detection: truck.hasLeakDetection,
      overfill_protection: truck.hasOverfillProtection,
      emergency_shutdown: truck.hasEmergencyShutdown,
      fire_suppression: truck.hasFireSuppression,
      explosion_proof: truck.hasExplosionProof,
      corrosion_resistant: truck.hasCorrosionResistant,
      stainless_steel: truck.hasStainlessSteel,
      aluminum: truck.hasAluminum,
      carbon_steel: truck.hasCarbonSteel,
      fiberglass: truck.hasFiberglass,
      plastic: truck.hasPlastic,
      composite: truck.hasComposite,
      insulated: truck.hasInsulated,
    };

    return featureMap[feature.toLowerCase()] || false;
  }

  private applyPostProcessingFilters(
    matches: MatchResultDto[],
    criteria: MatchRequestDto,
  ): MatchResultDto[] {
    return matches.filter((match) => {
      // NOTE: maxDistance is NOT a hard filter — distance affects scoring only.
      // Trucks far away score lower but are never excluded entirely.

      // Rating filter — only exclude if truck has an established rating below minimum
      if (criteria.minRating && match.truckRating > 0 && match.truckRating < criteria.minRating) {
        return false;
      }

      if (criteria.maxPrice && match.estimatedCost > criteria.maxPrice) {
        return false;
      }

      if (criteria.requiresRefrigeration && !match.hasRefrigeration) {
        return false;
      }

      if (criteria.requiresHazmat && !match.hasHazmatPermit) {
        return false;
      }

      if (criteria.requiresLiftGate && !match.hasLiftGate) {
        return false;
      }

      return true;
    });
  }

  private deduplicateMatches(matches: MatchResultDto[]): MatchResultDto[] {
    const uniqueMatches = new Map<string, MatchResultDto>();

    for (const match of matches) {
      const key = match.truckId;
      if (
        !uniqueMatches.has(key) ||
        uniqueMatches.get(key).overallScore < match.overallScore
      ) {
        uniqueMatches.set(key, match);
      }
    }

    return Array.from(uniqueMatches.values());
  }

  private calculateHybridScore(match: MatchResultDto, load: Load): number {
    // Combine multiple scoring approaches
    const baseScore = match.overallScore;
    const confidenceBonus = (match.confidence || 0.5) * 0.1;
    const successBonus = (match.successProbability || 0.7) * 0.1;
    const riskPenalty = (match.riskScore || 0.3) * 0.1;

    return Math.min(
      1.0,
      baseScore + confidenceBonus + successBonus - riskPenalty,
    );
  }

  private generateMatchReason(truck: Truck, load: Load, score: number): string {
    const reasons: string[] = [];

    if (score > 0.8) {
      reasons.push('Excellent match');
    } else if (score > 0.6) {
      reasons.push('Good match');
    } else {
      reasons.push('Acceptable match');
    }

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

    if (truck.hasLiftGate && load.requiresForklift) {
      reasons.push('Lift gate available');
    }

    return reasons.join(', ');
  }

  private generateComprehensiveMatchReason(
    truck: Truck,
    load: Load,
    scores: {
      capacityScore: number;
      distanceScore: number;
      equipmentScore: number;
      ratingScore: number;
      costScore: number;
      temperatureScore: number;
      securityScore: number;
      routeScore: number;
      timeScore: number;
      overallScore: number;
      utilization: string;
      distanceKm: number;
    },
  ): string {
    const reasons: string[] = [];

    // Overall match quality
    if (scores.overallScore >= 0.9) {
      reasons.push('Excellent AI match');
    } else if (scores.overallScore >= 0.75) {
      reasons.push('Very good match');
    } else if (scores.overallScore >= 0.6) {
      reasons.push('Good match');
    } else {
      reasons.push('Acceptable match');
    }

    // Capacity match
    if (scores.capacityScore >= 0.9) {
      reasons.push(`Optimal capacity (${scores.utilization}% utilization)`);
    } else if (scores.capacityScore >= 0.7) {
      reasons.push(`Good capacity fit (${scores.utilization}% utilization)`);
    }

    // Distance match
    if (scores.distanceScore >= 0.8) {
      reasons.push(`Close proximity (${scores.distanceKm.toFixed(0)}km)`);
    } else if (scores.distanceScore >= 0.5) {
      reasons.push(`Moderate distance (${scores.distanceKm.toFixed(0)}km)`);
    }

    // Equipment compatibility
    if (scores.equipmentScore >= 0.9) {
      reasons.push('Perfect equipment match');
    } else if (scores.equipmentScore >= 0.7) {
      reasons.push('Good equipment compatibility');
    }

    // Special requirements
    if (truck.hasRefrigeration && load.requiresRefrigeration) {
      reasons.push('Refrigeration available');
    }
    if (truck.hasHazmatPermit && load.isHazardous) {
      reasons.push('Hazmat certified');
    }
    if (truck.hasLiftGate && load.requiresForklift) {
      reasons.push('Lift gate available');
    }
    if (truck.hasGps && load.requiresGpsMonitoring) {
      reasons.push('GPS monitoring enabled');
    }

    // Rating
    if (scores.ratingScore >= 0.8) {
      reasons.push('Highly rated truck');
    } else if (scores.ratingScore >= 0.6) {
      reasons.push('Well-rated truck');
    }

    // Price competitiveness
    if (scores.costScore >= 0.9) {
      reasons.push('Very competitive pricing');
    } else if (scores.costScore >= 0.7) {
      reasons.push('Competitive pricing');
    }

    // Temperature control
    if (scores.temperatureScore >= 0.8 && load.requiresRefrigeration) {
      reasons.push('Temperature control available');
    }

    // Security features
    if (scores.securityScore >= 0.8) {
      reasons.push('Strong security features');
    }

    // Time critical
    if (scores.timeScore >= 0.8 && load.isTimeCritical) {
      reasons.push('Suitable for time-critical delivery');
    }

    // Route compatibility
    if (scores.routeScore >= 0.9) {
      reasons.push('Optimal route compatibility');
    }

    return reasons.length > 0
      ? reasons.join(' • ')
      : `AI match score: ${(scores.overallScore * 100).toFixed(0)}%`;
  }

  async getMarketInsights(tenantId: string): Promise<any> {
    // Get market analytics for matching insights
    const publishedLoads = await this.loadRepository.count({
      where: {
        tenantId,
        status: In([LoadStatus.CREATED, LoadStatus.PUBLISHED]),
      },
    });

    const availableTrucks = await this.truckRepository.count({
      where: { tenantId, status: VehicleStatus.AVAILABLE },
    });

    const activeDrivers = await this.driverRepository.count({
      where: { tenantId, status: DriverStatus.ACTIVE },
    });

    return {
      totalPublishedLoads: publishedLoads,
      totalAvailableTrucks: availableTrucks,
      totalActiveDrivers: activeDrivers,
      marketBalance:
        availableTrucks > publishedLoads ? 'Truck Surplus' : 'Load Surplus',
      averageLoadWeight: 1500, // TODO: Calculate from actual data
      averageTruckCapacity: 20000, // TODO: Calculate from actual data
    };
  }

  // --- Added for controller compatibility ---
  async getComprehensiveMetrics(tenantId: string): Promise<any> {
    // Example: return total loads, trucks, drivers, and matches for the tenant
    const loads = await this.loadRepository.count({ where: { tenantId } });
    const trucks = await this.truckRepository.count({ where: { tenantId } });
    const drivers = await this.driverRepository.count({ where: { tenantId } });
    // You can add more advanced metrics as needed
    return {
      loads,
      trucks,
      drivers,
      timestamp: new Date().toISOString(),
    };
  }

  async clearAllCaches(): Promise<void> {
    this.memoryCache.clear();
    await this.cacheService.clear();
    this.logger.log('🧹 All matching caches cleared');
  }

  async getAllTrucks(tenantId: string): Promise<Truck[]> {
    return await this.truckRepository.find({
      where: { tenantId, isActive: true },
    });
  }

  // =====================================================
  // CONSOLIDATED ENHANCED MATCHING METHODS
  // From AIMatchingEngineService & EnhancedMatchingService
  // =====================================================

  /**
   * Enhanced matching with all consolidated features
   * Includes: ML predictions, market intelligence, caching, environmental impact
   */
  async findEnhancedMatches(
    matchRequestDto: MatchRequestDto,
    tenantId: string,
  ): Promise<MatchResultDto[]> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(matchRequestDto, tenantId);
      const cached = await this.getCachedResult(cacheKey);
      if (cached && !matchRequestDto.includeDetailedScoring) {
        this.updateCacheMetrics(true);
        return cached;
      }
      this.updateCacheMetrics(false);

      // Get market context for dynamic weight adjustment
      const marketContext = await this.getMarketContext(tenantId);

      // Get base matches using existing algorithm
      let matches = await this.findMatches(matchRequestDto, tenantId);

      // Apply enhanced enrichments
      if (matchRequestDto.includeDetailedScoring) {
        matches = await this.enrichMatchesWithMLPredictions(matches, tenantId);
      }

      if (matchRequestDto.includeEnvironmentalImpact) {
        matches = await this.enrichMatchesWithEnvironmentalImpact(matches);
      }

      if (matchRequestDto.includeRiskAnalysis) {
        matches = await this.enrichMatchesWithRiskAssessment(matches, tenantId);
      }

      if (matchRequestDto.includeRouteOptimization) {
        matches = await this.applyRouteOptimization(matches);
      }

      // Apply market-aware scoring adjustments
      matches = this.applyMarketAwareScoring(matches, marketContext);

      // Cache results
      await this.cacheResult(cacheKey, matches, 300);

      // Update metrics
      this.updateMatchingMetrics(startTime, matches.length);

      return matches;
    } catch (error) {
      this.logger.error(`Enhanced matching failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // =====================================================
  // MARKET INTELLIGENCE (from EnhancedMatchingService)
  // =====================================================

  /**
   * Get real-time market context for dynamic weight adjustment
   */
  private async getMarketContext(tenantId: string): Promise<MarketContext> {
    try {
      const conditions = await this.marketIntelligence.getCurrentConditions(tenantId);

      // Calculate market balance
      const publishedLoads = await this.loadRepository.count({
        where: { tenantId, status: In([LoadStatus.CREATED, LoadStatus.PUBLISHED]) },
      });
      const availableTrucks = await this.truckRepository.count({
        where: { tenantId, status: VehicleStatus.AVAILABLE },
      });

      let marketBalance: 'BALANCED' | 'TRUCK_SURPLUS' | 'LOAD_SURPLUS' = 'BALANCED';
      const ratio = availableTrucks / Math.max(publishedLoads, 1);
      if (ratio > 1.2) marketBalance = 'TRUCK_SURPLUS';
      else if (ratio < 0.8) marketBalance = 'LOAD_SURPLUS';

      return {
        currentDemand: conditions?.currentDemand || 0.5,
        averageCost: conditions?.averageRates?.perLoad || 100,
        capacityUtilization: conditions?.capacityUtilization || 0.7,
        seasonalMultiplier: this.getSeasonalMultiplier(),
        marketBalance,
      };
    } catch (error) {
      this.logger.warn(`Failed to get market context: ${error.message}`);
      return {
        currentDemand: 0.5,
        averageCost: 100,
        capacityUtilization: 0.7,
        seasonalMultiplier: 1.0,
        marketBalance: 'BALANCED',
      };
    }
  }

  /**
   * Calculate seasonal demand multiplier
   */
  private getSeasonalMultiplier(): number {
    const month = new Date().getMonth();
    // Peak seasons: Q4 (Oct-Dec) and Q2 (Apr-Jun)
    if (month >= 9 && month <= 11) return 1.2; // Q4 peak
    if (month >= 3 && month <= 5) return 1.1; // Q2 moderate
    if (month === 0 || month === 1) return 0.9; // Jan-Feb slow
    return 1.0;
  }

  /**
   * Apply market-aware scoring adjustments
   */
  private applyMarketAwareScoring(
    matches: MatchResultDto[],
    marketContext: MarketContext,
  ): MatchResultDto[] {
    return matches.map(match => {
      let adjustedScore = match.overallScore;

      // Adjust based on market conditions
      if (marketContext.marketBalance === 'LOAD_SURPLUS') {
        // More loads than trucks - premium trucks get bonus
        if (match.truckRating >= 4.5) adjustedScore *= 1.05;
      } else if (marketContext.marketBalance === 'TRUCK_SURPLUS') {
        // More trucks than loads - competitive pricing matters
        if (match.costScore >= 0.8) adjustedScore *= 1.05;
      }

      // Apply seasonal multiplier
      adjustedScore *= marketContext.seasonalMultiplier;

      return {
        ...match,
        overallScore: Math.min(adjustedScore, 1.0),
        marketContext: marketContext as any,
      };
    });
  }

  // =====================================================
  // ML PREDICTIONS (from AIMatchingEngineService)
  // =====================================================

  /**
   * Enrich matches with ML-based predictions
   */
  private async enrichMatchesWithMLPredictions(
    matches: MatchResultDto[],
    tenantId: string,
  ): Promise<MatchResultDto[]> {
    const enriched: MatchResultDto[] = [];

    for (const match of matches) {
      try {
        const load = await this.loadRepository.findOne({ where: { id: match.loadId } });
        const truck = await this.truckRepository.findOne({ where: { id: match.truckId } });

        if (load && truck) {
          const prediction = await this.runMLPrediction(match, load, truck);
          enriched.push({
            ...match,
            successProbability: prediction.successProbability,
            confidence: prediction.confidence,
            riskScore: prediction.riskScore,
            recommendedPrice: prediction.recommendedPrice,
            // Adjust overall score based on ML prediction
            overallScore: this.blendScoreWithML(match.overallScore, prediction),
          });
        } else {
          enriched.push(match);
        }
      } catch (error) {
        this.logger.warn(`ML enrichment failed for match ${match.truckId}: ${error.message}`);
        enriched.push(match);
      }
    }

    return enriched;
  }

  /**
   * Run ML prediction for a match
   */
  private async runMLPrediction(
    match: MatchResultDto,
    load: Load,
    truck: Truck,
  ): Promise<MLPrediction> {
    try {
      // Try to use the ML prediction service
      const mlResult = await this.mlPrediction.predictSuccessProbability(load, truck);

      return {
        successProbability: mlResult || 0.85 + match.overallScore * 0.1,
        estimatedDeliveryTime: match.estimatedDeliveryTime || match.distanceKm / 60,
        riskScore: this.calculateRiskFromFactors(match, load, truck),
        recommendedPrice: match.recommendedPrice || match.estimatedCost * 1.15,
        confidence: 0.8 + match.overallScore * 0.15,
      };
    } catch (error) {
      // Fallback to algorithmic prediction
      return {
        successProbability: 0.85 + match.overallScore * 0.1,
        estimatedDeliveryTime: match.distanceKm / 60,
        riskScore: 1 - match.overallScore,
        recommendedPrice: match.estimatedCost * 1.15,
        confidence: 0.75,
      };
    }
  }

  /**
   * Calculate risk score from various factors
   */
  private calculateRiskFromFactors(
    match: MatchResultDto,
    load: Load,
    truck: Truck,
  ): number {
    let risk = 0.2; // Base risk

    // Equipment risk
    if (load.requiresRefrigeration && !truck.hasRefrigeration) risk += 0.3;
    if (load.isHazardous && !truck.hasHazmatPermit) risk += 0.4;

    // Rating risk
    if ((truck.averageRating || 0) < 3.5) risk += 0.15;

    // Capacity risk
    const utilization = load.weight / truck.capacityWeight;
    if (utilization > 0.95) risk += 0.1;

    // Distance risk
    if (match.distanceKm > 500) risk += 0.1;

    return Math.min(risk, 1.0);
  }

  /**
   * Blend traditional score with ML prediction
   */
  private blendScoreWithML(baseScore: number, prediction: MLPrediction): number {
    // 70% traditional algorithm, 30% ML
    const blendedScore =
      baseScore * 0.7 +
      prediction.successProbability * 0.2 +
      (1 - prediction.riskScore) * 0.1;

    return Math.min(Math.max(blendedScore, 0), 1.0);
  }

  // =====================================================
  // ENVIRONMENTAL IMPACT (from EnhancedMatchingService)
  // =====================================================

  /**
   * Enrich matches with environmental impact assessment
   */
  private async enrichMatchesWithEnvironmentalImpact(
    matches: MatchResultDto[],
  ): Promise<MatchResultDto[]> {
    return Promise.all(matches.map(async match => {
      const truck = await this.truckRepository.findOne({ where: { id: match.truckId } });
      const load = await this.loadRepository.findOne({ where: { id: match.loadId } });

      if (!truck || !load) return match;

      const environmentalImpact = this.calculateEnvironmentalImpact(truck, load, match.distanceKm);

      return {
        ...match,
        environmentalImpact: environmentalImpact as any,
      };
    }));
  }

  /**
   * Calculate environmental impact metrics
   */
  private calculateEnvironmentalImpact(
    truck: Truck,
    load: Load,
    distanceKm: number,
  ): EnvironmentalImpact {
    const fuelEfficiency = truck.fuelEfficiency || 6.5; // L/100km
    const fuelConsumption = (distanceKm / 100) * fuelEfficiency;

    // CO2 emissions: ~2.31 kg CO2 per liter of diesel
    const co2Emissions = fuelConsumption * 2.31;

    // Eco score: Based on fuel efficiency and electric options
    let ecoScore = Math.min(1.0, fuelEfficiency / 10);
    if (truck.fuelType === FuelType.ELECTRIC) ecoScore = 0.95;
    else if (truck.fuelType === FuelType.HYBRID) ecoScore = 0.85;

    return {
      co2Emissions: Math.round(co2Emissions * 100) / 100,
      fuelConsumption: Math.round(fuelConsumption * 100) / 100,
      ecoScore: Math.round(ecoScore * 100) / 100,
    };
  }

  // =====================================================
  // RISK ASSESSMENT (from EnhancedMatchingService)
  // =====================================================

  /**
   * Enrich matches with risk assessment
   */
  private async enrichMatchesWithRiskAssessment(
    matches: MatchResultDto[],
    tenantId: string,
  ): Promise<MatchResultDto[]> {
    return Promise.all(matches.map(async match => {
      const truck = await this.truckRepository.findOne({ where: { id: match.truckId } });
      const load = await this.loadRepository.findOne({ where: { id: match.loadId } });
      const driver = match.driverId
        ? await this.driverRepository.findOne({ where: { id: match.driverId } })
        : null;

      if (!truck || !load) return match;

      const riskAssessment = this.assessMatchRisk(truck, load, driver);

      return {
        ...match,
        riskAssessment: riskAssessment as any,
      };
    }));
  }

  /**
   * Comprehensive risk assessment for a match
   */
  private assessMatchRisk(
    truck: Truck,
    load: Load,
    driver: Driver | null,
  ): RiskAssessment {
    const riskFactors: string[] = [];
    let overallRisk = 0.1; // Base risk

    // Equipment risk
    let equipmentRisk = 0;
    if (load.requiresRefrigeration && !truck.hasRefrigeration) {
      equipmentRisk = 0.8;
      riskFactors.push('Missing refrigeration equipment');
    }
    if (load.isHazardous && !truck.hasHazmatPermit) {
      equipmentRisk = Math.max(equipmentRisk, 0.9);
      riskFactors.push('Missing hazmat certification');
    }

    // Capacity risk
    const utilization = load.weight / truck.capacityWeight;
    let capacityRisk = 0;
    if (utilization > 0.95) {
      capacityRisk = 0.3;
      riskFactors.push('Near maximum capacity');
    } else if (utilization > 0.9) {
      capacityRisk = 0.15;
    }

    // Rating risk
    let ratingRisk = 0;
    if ((truck.averageRating || 0) < 3.0) {
      ratingRisk = 0.4;
      riskFactors.push('Low truck rating');
    } else if ((truck.averageRating || 0) < 3.5) {
      ratingRisk = 0.2;
      riskFactors.push('Below average truck rating');
    }

    // Availability risk
    let availabilityRisk = 0;
    if (truck.status !== VehicleStatus.AVAILABLE) {
      availabilityRisk = 0.3;
      riskFactors.push('Truck not immediately available');
    }

    // Cost risk
    let costRisk = 0.1; // Base

    // Driver risk
    if (driver) {
      if (driver.hireDate) {
        const yearsExperience = (Date.now() - new Date(driver.hireDate).getTime()) / (365 * 24 * 60 * 60 * 1000);
        if (yearsExperience < 1) {
          overallRisk += 0.1;
          riskFactors.push('Inexperienced driver');
        }
      }
    }

    // Cargo-specific risks
    if (load.isHazardous) {
      overallRisk += 0.15;
      riskFactors.push('Hazardous cargo handling');
    }
    if (load.isFragile) {
      overallRisk += 0.1;
      riskFactors.push('Fragile cargo handling');
    }

    // Vehicle age risk
    if (truck.year && truck.year < 2015) {
      overallRisk += 0.1;
      riskFactors.push('Older vehicle');
    }

    // Calculate total risk
    overallRisk = Math.min(1.0,
      overallRisk +
      equipmentRisk * 0.3 +
      capacityRisk * 0.2 +
      ratingRisk * 0.2 +
      availabilityRisk * 0.15 +
      costRisk * 0.15
    );

    return {
      overallRisk: Math.round(overallRisk * 100) / 100,
      equipmentRisk: Math.round(equipmentRisk * 100) / 100,
      capacityRisk: Math.round(capacityRisk * 100) / 100,
      ratingRisk: Math.round(ratingRisk * 100) / 100,
      availabilityRisk: Math.round(availabilityRisk * 100) / 100,
      costRisk: Math.round(costRisk * 100) / 100,
      riskFactors,
      mitigationStrategies: this.getMitigationStrategies(riskFactors),
    };
  }

  /**
   * Get mitigation strategies for identified risks
   */
  private getMitigationStrategies(riskFactors: string[]): string[] {
    const strategies: string[] = [];

    if (riskFactors.includes('Missing refrigeration equipment')) {
      strategies.push('Source alternative refrigerated vehicle');
    }
    if (riskFactors.includes('Missing hazmat certification')) {
      strategies.push('Ensure proper hazmat training and certification before transport');
    }
    if (riskFactors.includes('Near maximum capacity')) {
      strategies.push('Consider splitting load or using larger vehicle');
    }
    if (riskFactors.includes('Low truck rating')) {
      strategies.push('Monitor closely and ensure quality checkpoints');
    }
    if (riskFactors.includes('Inexperienced driver')) {
      strategies.push('Provide additional supervision or assign experienced co-driver');
    }
    if (riskFactors.includes('Hazardous cargo handling')) {
      strategies.push('Follow all safety protocols and have emergency response plan');
    }
    if (riskFactors.includes('Fragile cargo handling')) {
      strategies.push('Use appropriate packaging and careful loading procedures');
    }
    if (riskFactors.includes('Older vehicle')) {
      strategies.push('Conduct thorough pre-trip inspection');
    }

    return strategies;
  }

  // =====================================================
  // ROUTE OPTIMIZATION (from AIMatchingEngineService)
  // =====================================================

  /**
   * Apply route optimization to matches
   */
  private async applyRouteOptimization(
    matches: MatchResultDto[],
  ): Promise<MatchResultDto[]> {
    return matches.map(match => {
      const optimization = this.calculateRouteOptimization(match);

      return {
        ...match,
        routeOptimization: optimization as any,
        // Adjust score based on route optimization potential
        overallScore: match.overallScore * (1 + optimization.costSavings),
      };
    });
  }

  /**
   * Calculate route optimization metrics
   */
  private calculateRouteOptimization(match: MatchResultDto): RouteOptimization {
    const baseDistance = match.distanceKm;
    const optimizedDistance = baseDistance * 0.95; // Assume 5% optimization possible
    const estimatedTime = optimizedDistance / 60; // hours at 60 km/h average
    const fuelConsumption = (optimizedDistance / 100) * 6.5; // L/100km average
    const costSavings = (baseDistance - optimizedDistance) / baseDistance;

    return {
      totalDistance: Math.round(optimizedDistance * 100) / 100,
      estimatedTime: Math.round(estimatedTime * 100) / 100,
      fuelConsumption: Math.round(fuelConsumption * 100) / 100,
      costSavings: Math.round(costSavings * 1000) / 1000,
    };
  }

  // =====================================================
  // CACHING UTILITIES
  // =====================================================

  /**
   * Generate cache key for matching request
   */
  private generateCacheKey(request: MatchRequestDto, tenantId: string): string {
    return `matching:${tenantId}:${request.loadId}:${request.algorithm || 'DEFAULT'}:${request.limit || 10}`;
  }

  /**
   * Get cached result if available and not expired
   */
  private async getCachedResult(cacheKey: string): Promise<MatchResultDto[] | null> {
    // Check memory cache first
    const memoryCached = this.memoryCache.get(cacheKey);
    if (memoryCached && memoryCached.expiry > Date.now()) {
      return memoryCached.data;
    }

    // Check distributed cache
    try {
      return await this.cacheService.get(cacheKey);
    } catch (error) {
      return null;
    }
  }

  /**
   * Cache matching results
   */
  private async cacheResult(cacheKey: string, data: MatchResultDto[], ttlSeconds: number): Promise<void> {
    // Memory cache
    this.memoryCache.set(cacheKey, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });

    // Distributed cache
    try {
      await this.cacheService.set(cacheKey, data, ttlSeconds);
    } catch (error) {
      this.logger.warn(`Failed to set distributed cache: ${error.message}`);
    }
  }

  // =====================================================
  // METRICS & MONITORING
  // =====================================================

  /**
   * Update cache hit/miss metrics
   */
  private updateCacheMetrics(isHit: boolean): void {
    const decay = 0.95;
    this.metrics.cacheHitRate = this.metrics.cacheHitRate * decay + (isHit ? 0.05 : 0);
  }

  /**
   * Update matching performance metrics
   */
  private updateMatchingMetrics(startTime: number, matchCount: number): void {
    const responseTime = Date.now() - startTime;

    this.metrics.totalMatches += matchCount;
    this.metrics.responseTime = this.metrics.responseTime * 0.9 + responseTime * 0.1;

    if (matchCount > 0) {
      this.metrics.matchRate = this.metrics.matchRate * 0.9 + 0.1;
    } else {
      this.metrics.matchRate = this.metrics.matchRate * 0.9;
    }
  }

  /**
   * Get current matching metrics
   */
  getMatchingMetrics(): MatchingMetrics {
    return { ...this.metrics };
  }

  /**
   * Get comprehensive market and matching analytics
   */
  async getEnhancedMarketInsights(tenantId: string): Promise<any> {
    const [basicInsights, marketContext] = await Promise.all([
      this.getMarketInsights(tenantId),
      this.getMarketContext(tenantId),
    ]);

    return {
      ...basicInsights,
      marketContext,
      matchingMetrics: this.getMatchingMetrics(),
      seasonalTrend: this.getSeasonalMultiplier() > 1 ? 'HIGH' : 'NORMAL',
      recommendations: this.generateMarketRecommendations(marketContext),
    };
  }

  /**
   * Generate market-based recommendations
   */
  private generateMarketRecommendations(context: MarketContext): string[] {
    const recommendations: string[] = [];

    if (context.marketBalance === 'LOAD_SURPLUS') {
      recommendations.push('High demand period - consider premium pricing');
      recommendations.push('Prioritize high-rated trucks for better service');
    } else if (context.marketBalance === 'TRUCK_SURPLUS') {
      recommendations.push('Competitive market - focus on cost efficiency');
      recommendations.push('Consider offering discounts for repeat customers');
    }

    if (context.seasonalMultiplier > 1.1) {
      recommendations.push('Peak season - ensure adequate capacity planning');
    }

    if (context.capacityUtilization < 0.5) {
      recommendations.push('Low utilization - consider backhaul opportunities');
    }

    return recommendations;
  }
}
