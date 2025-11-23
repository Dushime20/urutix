// --- Added for controller compatibility ---
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
import { Location } from '../../entities/location.entity';
import { MatchRequestDto } from './dto/match-request.dto';
import { MatchResultDto } from './dto/match-result.dto';

// Enhanced matching algorithms
import { HungarianAlgorithm } from './algorithms/hungarian.algorithm';
import { GeneticAlgorithm } from './algorithms/genetic.algorithm';
import { TopsisAlgorithm } from './algorithms/topsis.algorithm';

export enum MatchingAlgorithm {
  WEIGHTED_SCORE = 'WEIGHTED_SCORE',
  HUNGARIAN = 'HUNGARIAN',
  GENETIC = 'GENETIC',
  TOPSIS = 'TOPSIS',
  HYBRID = 'HYBRID',
}

export interface MatchingFactors {
  distanceScore: number;
  capacityScore: number;
  equipmentScore: number;
  temperatureScore: number;
  securityScore: number;
  routeScore: number;
  timeScore: number;
  ratingScore: number;
  costScore: number;
  experienceScore: number;
  availabilityScore: number;
  specialRequirementsScore: number;
}

export interface DynamicWeights {
  distance: number;
  capacity: number;
  equipment: number;
  temperature: number;
  security: number;
  route: number;
  time: number;
  rating: number;
  cost: number;
  experience: number;
  availability: number;
  specialRequirements: number;
}

@Injectable()
export class MatchingService {
  private readonly hungarianAlgorithm: HungarianAlgorithm;
  private geneticAlgorithm: GeneticAlgorithm;
  private readonly topsisAlgorithm: TopsisAlgorithm;

  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {
    this.hungarianAlgorithm = new HungarianAlgorithm();
    this.geneticAlgorithm = new GeneticAlgorithm([], []);
    this.topsisAlgorithm = new TopsisAlgorithm();
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
          // Convert truck capacity from lbs to kg and compare with load weight (in kg)
          const truckCapacityLbs = Number(truck.capacityWeight);
          const truckCapacityKg = truckCapacityLbs * 0.453592; // Convert lbs to kg
          const loadWeightKg = Number(load.weight);
          const canCarry =
            truckCapacityKg && loadWeightKg && loadWeightKg <= truckCapacityKg;
          console.log(`🚛 All Truck ${index + 1}:`, {
            plateNumber: truck.plateNumber,
            capacityWeightLbs: truckCapacityLbs,
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
      // Convert cargo weight from kg to lbs for database comparison
      // (truck.capacityWeight is stored in lbs, cargo weight is in kg)
      // 1 kg = 2.20462 lbs
      if (load.weight && load.weight > 0) {
        const loadWeightKg = Number(load.weight);
        const loadWeightLbs = loadWeightKg * 2.20462; // Convert kg to lbs
        console.log('🔍 Adding capacity filter:', {
          loadWeightKg: load.weight,
          loadWeightLbs: loadWeightLbs,
          loadWeightType: typeof load.weight,
          note: 'Converting cargo weight from kg to lbs for comparison with truck capacity (stored in lbs)',
        });
        queryBuilder.andWhere('truck.capacityWeight >= :minCapacity', {
          minCapacity: loadWeightLbs,
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
        .leftJoinAndSelect('truck.currentDriver', 'currentDriver')
        .getMany();

      // Log the raw SQL that was actually executed
      console.log('📝 Actual executed query:', queryBuilder.getQuery());

      console.log(`✅ Query returned ${trucks.length} trucks`);

      // Log details of each truck found
      trucks.forEach((truck, index) => {
        console.log(`🚛 Truck ${index + 1}:`, {
          id: truck.id,
          plateNumber: truck.plateNumber,
          capacityWeight: truck.capacityWeight,
          status: truck.status,
          isActive: truck.isActive,
          tenantId: truck.tenantId,
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

          // Rating filter
          if (
            criteria.minRating &&
            truck.averageRating &&
            truck.averageRating < criteria.minRating * 5
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
      // Basic capacity check
      // Convert to numbers for proper comparison (handles string/decimal issues)
      // Convert truck capacity from lbs to kg (1 lb = 0.453592 kg)
      // Cargo weight is in kg, so we need to convert truck capacity to kg for comparison
      const truckCapacityLbs = Number(truck.capacityWeight);
      const truckCapacityKg = truckCapacityLbs * 0.453592; // Convert lbs to kg
      const loadWeight = Number(load.weight); // Already in kg

      console.log(`🔍 Capacity check for truck ${truck.plateNumber}:`, {
        truckCapacityLbs: truckCapacityLbs,
        truckCapacityKg: truckCapacityKg,
        loadWeight: loadWeight,
        comparison: `${loadWeight} > ${truckCapacityKg} = ${loadWeight > truckCapacityKg}`,
        canCarry: loadWeight <= truckCapacityKg,
      });

      // Use >= instead of > to allow exact matches (200kg truck can carry 200kg load)
      if (!truckCapacityKg || !loadWeight || loadWeight > truckCapacityKg) {
        console.log(
          `❌ Truck ${truck.plateNumber} rejected: capacity check failed`,
          {
            truckCapacityLbs,
            truckCapacityKg,
            loadWeight,
            canCarry: loadWeight <= truckCapacityKg,
            reason: !truckCapacityKg
              ? 'No truck capacity'
              : !loadWeight
                ? 'No load weight'
                : 'Load too heavy',
          },
        );
        return null; // Truck cannot carry this load
      }

      console.log(`✅ Truck ${truck.plateNumber} passed capacity check:`, {
        truckCapacityLbs,
        truckCapacityKg,
        loadWeight,
        utilization: ((loadWeight / truckCapacityKg) * 100).toFixed(2) + '%',
      });

      // SIMPLIFIED: Only calculate capacity/weight score
      const capacityScore = this.calculateCapacityScore(truck, load);

      // Overall score is based ONLY on weight/capacity matching
      const overallScore = capacityScore;

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

      // Calculate utilization percentage for match reason (using kg for both)
      // truckCapacityKg is already declared above, reuse it
      const utilization = ((loadWeight / truckCapacityKg) * 100).toFixed(1);

      return {
        truckId: truck.id,
        loadId: load.id,
        overallScore,
        capacityScore: capacityScore,
        distanceScore: 0, // Not used in weight-only matching
        equipmentScore: 0, // Not used in weight-only matching
        ratingScore: 0, // Not used in weight-only matching
        priceScore: 0, // Not used in weight-only matching
        distanceKm: 0, // Not calculated for weight-only matching
        estimatedCost: 0, // Not calculated for weight-only matching
        estimatedRevenue: 0, // Not calculated for weight-only matching
        profitMargin: 0, // Not calculated for weight-only matching
        truckMake: truck.make || 'Unknown',
        truckModel: truck.model || 'Unknown',
        plateNumber: truck.plateNumber || 'N/A',
        capacityWeight: truckCapacityKg, // Return capacity in kg for consistency
        capacityVolume: truck.capacityVolume || 0,
        truckRating: truck.averageRating || 0,
        hasRefrigeration: truck.hasRefrigeration || false,
        hasLiftGate: truck.hasLiftGate || false,
        hasHazmatPermit: truck.hasHazmatPermit || false,
        matchReason: `Weight match: Truck capacity (${truckCapacityKg.toFixed(1)}kg / ${Number(truck.capacityWeight).toFixed(1)}lbs) can carry cargo (${loadWeight}kg) - ${utilization}% utilization`,
        confidence: capacityScore, // Confidence is same as capacity score for weight-only matching
        successProbability: capacityScore, // Same as capacity score
        estimatedDeliveryTime: null, // Not calculated for weight-only matching
        riskScore: 0, // Not calculated for weight-only matching
        recommendedPrice: 0, // Not calculated for weight-only matching
        ...driverInfo,
      } as MatchResultDto;
    } catch (error) {
      console.error('Error in scoreTruck:', error);
      console.error('Truck ID:', truck?.id);
      console.error('Load ID:', load?.id);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      // Return null instead of throwing to allow other trucks to be scored
      return null;
    }
  }

  private async calculateMatchingFactors(
    truck: Truck,
    load: Load,
    criteria: MatchRequestDto,
  ): Promise<MatchingFactors> {
    try {
      // SIMPLIFIED: Only calculate capacity score for weight-based matching
      const capacityScore = this.calculateCapacityScore(truck, load);

      return {
        distanceScore: 0, // Not used in weight-only matching
        capacityScore: capacityScore || 0,
        equipmentScore: 0, // Not used in weight-only matching
        temperatureScore: 0, // Not used in weight-only matching
        securityScore: 0, // Not used in weight-only matching
        routeScore: 0, // Not used in weight-only matching
        timeScore: 0, // Not used in weight-only matching
        ratingScore: 0, // Not used in weight-only matching
        costScore: 0, // Not used in weight-only matching
        experienceScore: 0, // Not used in weight-only matching
        availabilityScore: 0, // Not used in weight-only matching
        specialRequirementsScore: 0, // Not used in weight-only matching
      };
    } catch (error) {
      console.error('Error in calculateMatchingFactors:', error);
      // Return default scores if calculation fails
      return {
        distanceScore: 0,
        capacityScore: 0,
        equipmentScore: 0,
        temperatureScore: 0,
        securityScore: 0,
        routeScore: 0,
        timeScore: 0,
        ratingScore: 0,
        costScore: 0,
        experienceScore: 0,
        availabilityScore: 0,
        specialRequirementsScore: 0,
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
    if (distance <= 25) return 1.0;
    if (distance <= 50) return 0.9;
    if (distance <= 100) return 0.7;
    if (distance <= 150) return 0.5;
    return 0.3;
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

  private getDynamicWeights(load: Load): DynamicWeights {
    const baseWeights: DynamicWeights = {
      distance: 0.15,
      capacity: 0.2,
      equipment: 0.25,
      temperature: 0.1,
      security: 0.1,
      route: 0.05,
      time: 0.05,
      rating: 0.03,
      cost: 0.02,
      experience: 0.02,
      availability: 0.02,
      specialRequirements: 0.01,
    };

    // Adjust weights based on cargo characteristics
    if (load.isHazardous) {
      baseWeights.equipment += 0.1;
      baseWeights.security += 0.05;
      baseWeights.specialRequirements += 0.05;
    }

    if (load.isTimeCritical) {
      baseWeights.time += 0.1;
      baseWeights.distance += 0.05;
      baseWeights.availability += 0.05;
    }

    if (load.isFragile) {
      baseWeights.equipment += 0.05;
      baseWeights.security += 0.03;
      baseWeights.experience += 0.02;
    }

    if (load.requiresRefrigeration) {
      baseWeights.temperature += 0.1;
      baseWeights.equipment += 0.05;
    }

    if (load.urgencyLevel === UrgencyLevel.CRITICAL) {
      baseWeights.time += 0.15;
      baseWeights.distance += 0.1;
      baseWeights.availability += 0.05;
    }

    // Normalize weights to sum to 1
    const totalWeight = Object.values(baseWeights).reduce(
      (sum, weight) => sum + weight,
      0,
    );
    Object.keys(baseWeights).forEach((key) => {
      baseWeights[key] = baseWeights[key] / totalWeight;
    });

    return baseWeights;
  }

  private calculateWeightedScore(
    factors: MatchingFactors,
    weights: DynamicWeights,
  ): number {
    return (
      factors.distanceScore * weights.distance +
      factors.capacityScore * weights.capacity +
      factors.equipmentScore * weights.equipment +
      factors.temperatureScore * weights.temperature +
      factors.securityScore * weights.security +
      factors.routeScore * weights.route +
      factors.timeScore * weights.time +
      factors.ratingScore * weights.rating +
      factors.costScore * weights.cost +
      factors.experienceScore * weights.experience +
      factors.availabilityScore * weights.availability +
      factors.specialRequirementsScore * weights.specialRequirements
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

    // Adjust based on factors
    if (factors.equipmentScore >= 0.9) probability += 0.1;
    if (factors.capacityScore >= 0.8) probability += 0.05;
    if (factors.ratingScore >= 0.8) probability += 0.05;
    if (factors.availabilityScore >= 0.9) probability += 0.05;

    // Penalize for risk factors
    if (load.isHazardous && !truck.hasHazmatPermit) probability -= 0.3;
    if (load.requiresRefrigeration && !truck.hasRefrigeration)
      probability -= 0.3;

    return Math.max(0.1, Math.min(1.0, probability));
  }

  private calculateRiskScore(
    truck: Truck,
    load: Load,
    factors: MatchingFactors,
  ): number {
    let risk = 0.3; // Base risk

    // Increase risk for mismatches
    if (factors.equipmentScore < 0.5) risk += 0.3;
    if (factors.capacityScore < 0.5) risk += 0.2;
    if (factors.ratingScore < 0.5) risk += 0.2;

    // Special cargo risks
    if (load.isHazardous) risk += 0.2;
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
    // Simplified distance calculation
    // In real implementation, use PostGIS spatial functions
    const baseDistance = 100; // km
    const randomFactor = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
    return baseDistance * randomFactor;
  }

  private estimateCost(
    distanceKm: number,
    weightKg: number,
    truck: Truck,
  ): number {
    // Enhanced cost estimation
    const fuelCost = distanceKm * 0.15; // $0.15 per km
    const laborCost = distanceKm * 0.1; // $0.10 per km
    const maintenanceCost = distanceKm * 0.05; // $0.05 per km
    const weightFactor = weightKg / 1000; // cost increases with weight

    // Truck-specific adjustments
    let truckFactor = 1.0;
    if (truck.hasRefrigeration) truckFactor += 0.2;
    if (truck.hasHazmatPermit) truckFactor += 0.1;
    if (truck.fuelType === FuelType.ELECTRIC) truckFactor -= 0.1;

    return (
      (fuelCost + laborCost + maintenanceCost) * weightFactor * truckFactor
    );
  }

  private estimateRevenue(distanceKm: number, weightKg: number): number {
    // Enhanced revenue estimation
    const baseRate = 2.5; // $2.50 per km
    const weightFactor = weightKg / 1000;
    return distanceKm * baseRate * weightFactor;
  }

  private getMarketAverageCost(load: Load): number {
    // This would typically come from historical data or market APIs
    const distance = this.calculateDistance(load, {} as Truck);
    return distance * 3.0; // Simplified market average
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

      if (criteria.minRating && match.truckRating < criteria.minRating * 5) {
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
    // No-op: implement cache clearing if you use caching
    // For now, just log or do nothing
    return;
  }

  async getAllTrucks(tenantId: string): Promise<Truck[]> {
    return await this.truckRepository.find({
      where: { tenantId, isActive: true },
    });
  }
}
