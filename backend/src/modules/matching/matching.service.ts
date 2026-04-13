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

// Enhanced matching algorithms
import { HungarianAlgorithm } from './algorithms/hungarian.algorithm';
import { GeneticAlgorithm } from './algorithms/genetic.algorithm';
import { TopsisAlgorithm } from './algorithms/topsis.algorithm';

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
// SIMPLIFIED MATCHING CRITERIA (5 Core Factors)
// 1. Capacity - Weight/volume matching
// 2. Equipment - Required equipment compatibility  
// 3. Distance/Route - Proximity and route optimization
// 4. GPS Tracking - GPS availability for monitoring
// 5. Availability - Truck availability status
// =====================================================

export interface MatchingFactors {
  capacityScore: number;      // Weight & volume utilization
  equipmentScore: number;     // Required equipment compatibility
  distanceScore: number;      // Proximity to pickup location
  gpsTrackingScore: number;   // GPS availability for monitoring
  availabilityScore: number;  // Truck availability status
}

export interface DynamicWeights {
  capacity: number;         // Default: 30%
  equipment: number;        // Default: 25%
  distance: number;         // Default: 20%
  gpsTracking: number;      // Default: 10%
  availability: number;     // Default: 15%
}

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
    // Enhanced services for consolidated matching
    private readonly cacheService: CacheService,
    private readonly marketIntelligence: MarketIntelligenceService,
    private readonly mlPrediction: MLPredictionService,
    private readonly notificationService: NotificationService,
    private readonly creditService: CreditService,
  ) {
    this.hungarianAlgorithm = new HungarianAlgorithm();
    this.geneticAlgorithm = new GeneticAlgorithm([], []);
    this.topsisAlgorithm = new TopsisAlgorithm();
    this.logger.log('🚀 Consolidated MatchingService initialized (v3.0)');
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
      // Sort by overall score and limit results
      matches.sort((a, b) => b.overallScore - a.overallScore);

      // Persist top matches for Truck Owners to view
      if (matches.length > 0) {
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
      // Filter for high quality matches (e.g. > 0.6)
      const highQualityMatches = matches.filter((m) => m.overallScore >= 0.6);

      this.logger.debug(`Persisting ${highQualityMatches.length} matches for Load ${loadId}`);

      for (const match of highQualityMatches) {
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
    } catch (err) {
      this.logger.error(`Failed to persist matches for load ${loadId}`, err);
    }
  }

  /**
   * Get all persisted matches for a truck owner's fleet
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

      // Find ACCEPTED and REQUESTED matches for these loads
      const matches = await this.loadMatchRepository.find({
        where: [
          { loadId: In(loadIds), status: MatchStatus.ACCEPTED },
          { loadId: In(loadIds), status: MatchStatus.REQUESTED },
        ],
        order: { createdAt: 'DESC' },
        take: 50,
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

      // Get tenant admin's subscription plan to determine credit rates
      let tenantAdminSubscription = await this.tenantSubscriptionRepository.findOne({
        where: { 
          tenantId, 
          userId: IsNull(), // Tenant-level subscription
          status: SubscriptionStatus.ACTIVE 
        },
        relations: ['plan'],
        order: { createdAt: 'DESC' },
      });

      // If no tenant-level subscription, try user-level subscription
      if (!tenantAdminSubscription) {
        tenantAdminSubscription = await this.tenantSubscriptionRepository.findOne({
          where: { 
            tenantId, 
            userId: tenantAdminUser.id,
            status: SubscriptionStatus.ACTIVE 
          },
          relations: ['plan'],
          order: { createdAt: 'DESC' },
        });
      }

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

    // Send notification to truck owner
    try {
      if (load && truck && truck.owner) {
        // Get cargo owner's profile information directly
        const userProfileRepo = this.loadRepository.manager.getRepository(UserProfile);
        const userProfile = await userProfileRepo.findOne({
          where: { userId: load.cargoOwnerId },
        });

        let cargoOwnerFullName = 'A cargo owner';
        if (userProfile && userProfile.firstName) {
            cargoOwnerFullName = `${userProfile.firstName} ${userProfile.lastName || ''}`.trim();
        }
        const truckPlateNumber = truck.plateNumber || 'your truck';

        this.logger.log(`📧 Creating notification for truck owner: ${truck.owner.id}`);
        this.logger.log(`📧 Notification details: tenantId=${tenantId}, cargoOwner=${cargoOwnerFullName}, truck=${truckPlateNumber}`);

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

        this.logger.log(`📧 Notification created successfully with ID: ${notification?.id}`);
      } else {
        this.logger.warn(`⚠️ Could not create notification: load=${!!load}, truck=${!!truck}, owner=${!!truck?.owner}`);
      }
    } catch (notificationError) {
      // Log error but don't fail the match request
      this.logger.error(`⚠️ Failed to send notification: ${notificationError.message}`, notificationError.stack);
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

    // If accepting, perform credit deduction BEFORE updating match status
    if (status === MatchStatus.ACCEPTED) {
      this.logger.log(`🎉 Match ${matchId} being ACCEPTED - Validating and deducting credits`);
      
      try {
        // Get load and truck details
        const load = await this.loadRepository.findOne({
          where: { id: match.loadId }
        });

        const truck = await this.truckRepository.findOne({
          where: { id: match.truckId }
        });

        if (!load || !truck) {
          throw new NotFoundException('Load or Truck not found for match acceptance');
        }

        // Get tenant admin user
        const tenantAdminUser = await this.userRepository.findOne({
          where: { tenantId: match.tenantId, role: UserRole.TENANT_ADMIN },
        });

        if (!tenantAdminUser) {
          throw new NotFoundException('Tenant admin not found for this tenant');
        }

        // Get tenant admin's subscription plan
        let tenantAdminSubscription = await this.tenantSubscriptionRepository.findOne({
          where: { 
            tenantId: match.tenantId, 
            userId: IsNull(), // Tenant-level subscription
            status: SubscriptionStatus.ACTIVE 
          },
          relations: ['plan'],
          order: { createdAt: 'DESC' },
        });

        // If no tenant-level subscription, try user-level subscription
        if (!tenantAdminSubscription) {
          tenantAdminSubscription = await this.tenantSubscriptionRepository.findOne({
            where: { 
              tenantId: match.tenantId, 
              userId: tenantAdminUser.id,
              status: SubscriptionStatus.ACTIVE 
            },
            relations: ['plan'],
            order: { createdAt: 'DESC' },
          });
        }

        if (!tenantAdminSubscription || !tenantAdminSubscription.plan) {
          throw new BadRequestException(
            'Tenant admin must have an active subscription plan to enable AI matching',
          );
        }

        // Calculate cargo weight in tons
        const cargoWeightTons = load.weight / 1000; // Convert kg to tons

        // Use rates from tenant admin's subscription plan
        const creditsPerTonTenant = Number(tenantAdminSubscription.plan.creditsPerTonTenant);
        const creditsPerTonTruckOwner = Number(tenantAdminSubscription.plan.creditsPerTonTruckOwner);

        this.logger.log(`[MatchingService] Accepting match ${matchId} - Credit deduction details:`);
        this.logger.log(`  - Cargo weight: ${cargoWeightTons.toFixed(2)} tons`);
        this.logger.log(`  - Using rates from TENANT ADMIN's subscription: ${tenantAdminSubscription.plan.name}`);
        this.logger.log(`  - Tenant admin rate: ${creditsPerTonTenant} credits/ton`);
        this.logger.log(`  - Truck owner rate: ${creditsPerTonTruckOwner} credits/ton`);

        // Perform dual credit deduction (same as bidding system)
        await this.creditService.consumeCreditsForBid({
          tenantId: match.tenantId,
          tenantAdminUserId: tenantAdminUser.id,
          truckOwnerUserId: truck.ownerId,
          cargoWeightTons,
          creditsPerTonTenant,
          creditsPerTonTruckOwner,
          bidId: matchId, // Using matchId as reference
          loadId: load.id,
          loadTitle: load.title,
        });

        this.logger.log(`[MatchingService] Credit deduction successful for match ${matchId}`);
      } catch (error) {
        this.logger.error(`[MatchingService] Credit deduction failed for match ${matchId}:`, error);
        throw new BadRequestException(
          `Failed to process credit deduction: ${error.message}`,
        );
      }
    }

    // Update match status
    match.status = status;
    const updatedMatch = await this.loadMatchRepository.save(match);

    // If accepted, trigger post-acceptance workflow
    if (status === MatchStatus.ACCEPTED) {
      this.logger.log(`🎉 Match ${matchId} ACCEPTED - Starting post-acceptance workflow`);
      await this.handleMatchAcceptance(match);
    } else if (status === MatchStatus.REJECTED) {
      this.logger.log(`❌ Match ${matchId} REJECTED by truck owner`);
      // Could implement rejection handling here (e.g., find alternative matches)
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
        actionUrl: `/dashboard/trips/${trip.id}`,
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
          actionUrl: `/dashboard/fleet/trips/${trip.id}`,
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
           await this.notificationService.createNotification({
            tenantId: load.tenantId,
            recipientId: driver.userId,
            title: 'New Trip Assignment',
            message: `You have been assigned to trip ${trip.tripNumber}. Cargo: ${load.title || 'General Cargo'}.`,
            notificationType: NotificationType.GENERAL,
            category: NotificationCategory.TRIP,
            priority: NotificationPriority.HIGH,
            channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
            entityType: EntityType.TRIP,
            entityId: trip.id,
            requiresAction: true,
            actionUrl: `/dashboard/driver/trips?tripId=${trip.id}`,
            actionText: 'View Trip'
          });
          this.logger.log(`📧 Notification sent to Driver: ${driver.userId}`);
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

      // Build dynamic query based on load requirements
      // Note: Having a driver assigned (currentDriverId) does NOT make a truck unavailable
      // A truck with a driver is still available for matching
      const queryBuilder = this.truckRepository
        .createQueryBuilder('truck')
        .where('truck.tenantId = :tenantId', { tenantId })
        .andWhere('truck.status = :status', { status: VehicleStatus.AVAILABLE })
        .andWhere('truck.isActive = :isActive', { isActive: true });

      console.log('🔧 Query builder initialized with base conditions');
      console.log('🔧 Truck filters:', {
        tenantId,
        status: VehicleStatus.AVAILABLE,
        isActive: true,
        note: 'Trucks with assigned drivers are still available for matching',
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
          // Distance filter
          if (criteria.maxDistance) {
            const distance = this.calculateDistance(load, truck);
            if (distance > criteria.maxDistance) return false;
          }

          // Rating filter — averageRating is 0-5 scale, minRating is also 0-5
          // Only filter if truck has an established rating (> 0) and it's below minimum
          if (
            criteria.minRating &&
            truck.averageRating > 0 &&
            truck.averageRating < criteria.minRating
          ) {
            return false;
          }

          return true;
        } catch (error) {
          console.error(`Error filtering truck ${truck?.id}:`, error);
          return false; // Exclude truck if filtering fails
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
    const matches: MatchResultDto[] = [];

    for (const truck of trucks) {
      try {
        console.log(`🔍 Scoring truck ${truck.plateNumber} (${truck.id})...`);
        const match = await this.scoreTruck(truck, load, criteria);
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
            match.priceScore,
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
    // Combine multiple algorithms for better results
    const [weightedMatches, hungarianMatches, topsisMatches] =
      await Promise.all([
        this.applyWeightedScoring(load, trucks, criteria),
        this.applyHungarianAlgorithm(load, trucks, criteria),
        this.applyTopsisAlgorithm(load, trucks, criteria),
      ]);

    // Combine and rank results
    const allMatches = [
      ...weightedMatches,
      ...hungarianMatches,
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

      // 4. SECURITY CONSTRAINT (GPS)
      if (load.requiresGpsMonitoring && !truck.hasGps && !truck.securityFeatures?.hasGps) {
        this.logger.debug(`❌ Rejected: Missing required GPS/Tracking`);
        return null;
      }

      // 5. ROUTE/DISTANCE CONSTRAINT
      // Calculate distance between load pickup and truck current location
      const distanceKm = this.calculateDistance(load, truck);

      // If truck has max distance constraint
      if (truck.routeCapabilities?.maxDistance && distanceKm > truck.routeCapabilities.maxDistance) {
        this.logger.debug(`❌ Rejected: Outside max operating distance`);
        return null;
      }

      // =====================================================
      // CALCULATE 5 CORE SCORING FACTORS
      // =====================================================

      // 1. CAPACITY SCORE - Weight & volume utilization (30%)
      const capacityScore = this.calculateCapacityScore(truck, load);

      // 2. EQUIPMENT SCORE - Required equipment compatibility (25%)
      const equipmentScore = this.calculateEquipmentScore(truck, load);

      // 3. DISTANCE SCORE - Proximity to pickup location (20%)
      // distanceKm is already calculated above in constraints check
      const distanceScore = this.calculateDistanceScore(load, truck, criteria);

      // 4. GPS TRACKING SCORE - GPS availability for monitoring (10%)
      const gpsTrackingScore = this.calculateGpsTrackingScore(truck, load);

      // 5. AVAILABILITY SCORE - Truck availability status (15%)
      const availabilityScore = this.calculateAvailabilityScore(truck);

      // Get dynamic weights based on load requirements
      const weights = this.getDynamicWeights(load);

      // Calculate weighted overall score using 5 core factors
      const overallScore =
        capacityScore * weights.capacity +
        equipmentScore * weights.equipment +
        distanceScore * weights.distance +
        gpsTrackingScore * weights.gpsTracking +
        availabilityScore * weights.availability;

      // Calculate supporting metrics using ROUTE distance (pickup → delivery), not truck-to-pickup
      const pickup = load.pickupLocation?.locationData?.coordinates;
      const delivery = load.deliveryLocation?.locationData?.coordinates;
      const routeDistanceKm = (pickup && delivery)
        ? this.calculateHaversineDistance(pickup.latitude, pickup.longitude, delivery.latitude, delivery.longitude)
        : distanceKm; // fallback to truck-to-pickup if no route coords

      const estimatedCost = this.estimateCost(routeDistanceKm, loadWeight, truck);
      const estimatedRevenue = this.estimateRevenue(routeDistanceKm, loadWeight);
      const profitMargin = estimatedRevenue > 0
        ? ((estimatedRevenue - estimatedCost) / estimatedRevenue)
        : 0;
      const estimatedDeliveryTime = this.estimateDeliveryTime(routeDistanceKm, load);
      const riskScore = Math.max(0, 1 - overallScore);
      const marketAverage = this.getMarketAverageCost(load);
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

      // Generate match reason based on 5 core factors
      const utilization = ((loadWeight / truckCapacityKg) * 100).toFixed(1);
      const matchReason = this.generateSimplifiedMatchReason(
        truck, load, capacityScore, equipmentScore, distanceScore,
        gpsTrackingScore, availabilityScore, distanceKm, utilization
      );

      const confidence = Math.min(overallScore * 1.1, 1.0);
      const successProbability = overallScore;

      return {
        truckId: truck.id,
        loadId: load.id,
        overallScore: Math.min(overallScore, 1.0),
        capacityScore,
        equipmentScore,
        distanceScore,
        gpsTrackingScore,
        availabilityScore,
        distanceKm: Math.round(distanceKm * 10) / 10,
        estimatedCost: Math.round(estimatedCost * 100) / 100,
        estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
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
      // SIMPLIFIED: Calculate 5 core scoring factors
      const capacityScore = this.calculateCapacityScore(truck, load);
      const equipmentScore = this.calculateEquipmentScore(truck, load);
      const distanceScore = this.calculateDistanceScore(load, truck, criteria);
      const gpsTrackingScore = this.calculateGpsTrackingScore(truck, load);
      const availabilityScore = this.calculateAvailabilityScore(truck);

      return {
        capacityScore: capacityScore || 0,
        equipmentScore: equipmentScore || 0,
        distanceScore: distanceScore || 0,
        gpsTrackingScore: gpsTrackingScore || 0,
        availabilityScore: availabilityScore || 0,
      };
    } catch (error) {
      this.logger.error('Error in calculateMatchingFactors:', error);
      // Return default scores if calculation fails
      return {
        capacityScore: 0,
        equipmentScore: 0,
        distanceScore: 0,
        gpsTrackingScore: 0,
        availabilityScore: 0,
      };
    }
  }

  private calculateDistanceScore(
    load: Load,
    truck: Truck,
    criteria: MatchRequestDto,
  ): number {
    const distance = this.calculateDistance(load, truck);
    const maxDistance = criteria.maxDistance || 200;

    if (distance > maxDistance) return 0;

    // Aggressive scoring for "same city" / nearby matching
    if (distance <= 10) return 1.0;  // Extremely close / same neighborhood
    if (distance <= 25) return 0.9;  // Same city/area
    if (distance <= 50) return 0.7;  // Surrounding area
    if (distance <= 100) return 0.4; // Regional
    if (distance <= 150) return 0.2; // Further away
    return 0.1; // Barely within max distance
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
        score *= 0.8; // Partial penalty
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

  private calculateRouteScore(truck: Truck, load: Load): number {
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
      console.error('Error in calculateRouteScore:', error);
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
  // SIMPLIFIED MATCH REASON GENERATOR
  // Generates human-readable match explanation based on 5 core criteria
  // =====================================================
  private generateSimplifiedMatchReason(
    truck: Truck,
    load: Load,
    capacityScore: number,
    equipmentScore: number,
    distanceScore: number,
    gpsTrackingScore: number,
    availabilityScore: number,
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
  // SIMPLIFIED DYNAMIC WEIGHTS (5 Core Criteria)
  // =====================================================
  private getDynamicWeights(load: Load): DynamicWeights {
    // Base weights for 5 core criteria (must sum to 1.0)
    const baseWeights: DynamicWeights = {
      capacity: 0.25,      // 25% - Can truck carry the load? (Hard filter already applied)
      equipment: 0.25,     // 25% - Required equipment for cargo type
      distance: 0.25,      // 25% - Proximity to pickup location (Increased importance)
      gpsTracking: 0.10,   // 10% - GPS availability for tracking
      availability: 0.15,  // 15% - Is truck available now?
    };

    // Adjust weights based on cargo characteristics
    if (load.isHazardous) {
      // Hazardous cargo: Equipment becomes more critical
      baseWeights.equipment += 0.10;
      baseWeights.gpsTracking += 0.05; // Need GPS for hazmat tracking
      baseWeights.capacity -= 0.10;
      baseWeights.distance -= 0.05;
    }

    if (load.requiresRefrigeration) {
      // Refrigerated cargo: Equipment is critical
      baseWeights.equipment += 0.10;
      baseWeights.capacity -= 0.05;
      baseWeights.distance -= 0.05;
    }

    if (load.isTimeCritical || load.urgencyLevel === UrgencyLevel.CRITICAL) {
      // Time-critical: Availability and distance matter more
      baseWeights.availability += 0.10;
      baseWeights.distance += 0.05;
      baseWeights.capacity -= 0.10;
      baseWeights.equipment -= 0.05;
    }

    if (load.requiresGpsMonitoring) {
      // GPS monitoring required: GPS score becomes more important
      baseWeights.gpsTracking += 0.10;
      baseWeights.distance -= 0.05;
      baseWeights.capacity -= 0.05;
    }

    // Normalize weights to sum to 1.0
    const totalWeight = Object.values(baseWeights).reduce((sum, w) => sum + w, 0);
    Object.keys(baseWeights).forEach((key) => {
      baseWeights[key as keyof DynamicWeights] = baseWeights[key as keyof DynamicWeights] / totalWeight;
    });

    return baseWeights;
  }

  // =====================================================
  // SIMPLIFIED WEIGHTED SCORE CALCULATION
  // =====================================================
  private calculateWeightedScore(
    factors: MatchingFactors,
    weights: DynamicWeights,
  ): number {
    return (
      factors.capacityScore * weights.capacity +
      factors.equipmentScore * weights.equipment +
      factors.distanceScore * weights.distance +
      factors.gpsTrackingScore * weights.gpsTracking +
      factors.availabilityScore * weights.availability
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

    // Adjust based on 5 core factors
    if (factors.capacityScore >= 0.9) probability += 0.1;
    if (factors.equipmentScore >= 0.8) probability += 0.1;
    if (factors.distanceScore >= 0.8) probability += 0.05;
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

  private estimateCost(
    distanceKm: number,
    weightKg: number,
    truck: Truck,
  ): number {
    // Use a realistic per-tonne-km rate for African freight market
    // Base rate: ~$0.08 per tonne-km (typical East Africa road freight)
    const tonneKm = (weightKg / 1000) * distanceKm;
    const baseRate = 0.08; // $0.08 per tonne-km

    // Minimum floor: $50 regardless of distance (short haul minimum)
    const baseCost = Math.max(tonneKm * baseRate, 50);

    // Truck-specific surcharges
    let surcharge = 1.0;
    if (truck.hasRefrigeration) surcharge += 0.25; // 25% for reefer
    if (truck.hasHazmatPermit) surcharge += 0.15;  // 15% for hazmat
    if (truck.fuelType === FuelType.ELECTRIC) surcharge -= 0.05; // 5% discount for EV

    return Math.round(baseCost * surcharge * 100) / 100;
  }

  private estimateRevenue(distanceKm: number, weightKg: number): number {
    // Market rate slightly above cost — $0.10 per tonne-km
    const tonneKm = (weightKg / 1000) * distanceKm;
    return Math.max(tonneKm * 0.10, 60);
  }

  private getMarketAverageCost(load: Load): number {
    // Estimate route distance from load locations
    const pickup = load.pickupLocation?.locationData?.coordinates;
    const delivery = load.deliveryLocation?.locationData?.coordinates;
    let routeKm = 200; // default 200 km if no coordinates
    if (pickup && delivery) {
      routeKm = this.calculateHaversineDistance(
        pickup.latitude, pickup.longitude,
        delivery.latitude, delivery.longitude,
      ) || 200;
    }
    const tonneKm = (Number(load.weight) / 1000) * routeKm;
    return Math.max(tonneKm * 0.09, 50); // $0.09/tonne-km market average
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
      if (criteria.maxDistance && match.distanceKm > criteria.maxDistance) {
        return false;
      }

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
      priceScore: number;
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
    if (scores.priceScore >= 0.9) {
      reasons.push('Very competitive pricing');
    } else if (scores.priceScore >= 0.7) {
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
        if (match.priceScore >= 0.8) adjustedScore *= 1.05;
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
