import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Load,
  LoadStatus,
  CargoType,
  UrgencyLevel,
  LoadLocation,
  LoadType,
  EquipmentType,
  Visibility,
  PaymentTerms,
  PackagingType,
  SpecialRequirements,
  Pricing,
  Address,
  TimeWindow,
  Cargo,
} from '../../entities/load.entity';
import {
  Document,
  DocumentType,
  DocumentStatus,
  DocumentPriority,
  DocumentCategory,
  EntityType,
} from '../../entities/document.entity';
import {
  TrackingEvent,
  TrackingEventType,
  GeofenceType,
} from '../../entities/tracking-event.entity';
import {
  Alert,
  AlertType,
  AlertSeverity,
  AlertStatus,
} from '../../entities/alert.entity';
import {
  AuditEvent,
  AuditAction,
  AuditEntityType,
} from '../../entities/audit-event.entity';
import {
  PriceSuggestion,
  PricingModel,
  PricingConfidence,
  PricingStatus,
} from '../../entities/price-suggestion.entity';
import { Location } from '../../entities/location.entity';
import { User } from '../../entities/user.entity';
import { CreateLoadDto } from './dto/create-load.dto';
import { UpdateLoadDto } from './dto/update-load.dto';
import { LoadsQueryDto } from './dto/loads-query.dto';
import { LoadSearchDto } from './dto/load-search.dto';
import { LoadResponseDto } from './dto/loads-response.dto';
import * as crypto from 'crypto';
import {
  OSMLocationEnrichmentService,
  EnrichedLocation,
} from '../locations/osm-location-enrichment.service';

export interface LoadsQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: LoadStatus;
  loadType?: LoadType;
  equipmentType?: EquipmentType;
  cargoType?: CargoType;
  urgencyLevel?: UrgencyLevel;
  visibility?: Visibility;
  isHazardous?: boolean;
  requiresRefrigeration?: boolean;
  isTimeCritical?: boolean;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  minWeight?: number;
  maxWeight?: number;
  minValue?: number;
  maxValue?: number;
  carrierId?: string;
  shipperId?: string;
  lane?: string;
}

export interface LoadsPaginatedResponse {
  items: LoadResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface EnrichedCargo
  extends Omit<
    Load,
    | 'pickupLocation'
    | 'deliveryLocation'
    | 'pickupDateFromLocations'
    | 'deliveryDateFromLocations'
    | 'syncDatesWithLocations'
    | 'getRouteLocations'
    | 'addLocation'
    | 'updateLocation'
    | 'removeLocation'
    | 'canPublish'
    | 'canAssign'
    | 'canStart'
    | 'canDeliver'
    | 'canCancel'
    | 'canEdit'
    | 'canRepost'
  > {
  enrichedLocations: EnrichedLocation[];
  canPublish?: boolean;
  canAssign?: boolean;
  canStart?: boolean;
  canDeliver?: boolean;
  canCancel?: boolean;
  canEdit?: boolean;
  canRepost?: boolean;
}

export interface EnrichedCargoResponse {
  cargo: EnrichedCargo;
  enrichedLocations: EnrichedLocation[];
}

export interface EnrichedCargosResponse {
  cargos: EnrichedCargo[];
  enrichedLocationsMap: Map<string, EnrichedLocation[]>;
}

@Injectable()
export class LoadsService {
  private readonly logger = new Logger(LoadsService.name);

  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(TrackingEvent)
    private readonly trackingEventRepository: Repository<TrackingEvent>,
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
    @InjectRepository(PriceSuggestion)
    private readonly priceSuggestionRepository: Repository<PriceSuggestion>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly locationEnrichmentService: OSMLocationEnrichmentService,
  ) {}

  /**
   * Create a new load with comprehensive validation and error handling
   */
  async create(
    createLoadDto: CreateLoadDto,
    userId: string,
    tenantId: string,
  ): Promise<Load> {
    this.logger.log(`Creating load for user ${userId} in tenant ${tenantId}`);

    try {
      // Validate locations exist
      if (!createLoadDto.locations || !Array.isArray(createLoadDto.locations)) {
        throw new BadRequestException(
          'Locations array is required and must be an array',
        );
      }

      // Enhanced location validation
      this.handleLocationValidation(createLoadDto.locations as any);

      // Get pickup and delivery locations from the array
      const pickupLocation = createLoadDto.locations.find(
        (loc) => loc.type === 'PICKUP',
      );
      const deliveryLocation = createLoadDto.locations.find(
        (loc) => loc.type === 'DELIVERY',
      );

      // Validate dates for truck matching
      if (!createLoadDto.pickupDate)
        throw new BadRequestException(
          'Pickup date is required for truck matching',
        );

      if (!createLoadDto.deliveryDate)
        throw new BadRequestException(
          'Delivery date is required for truck matching',
        );

      // Validate: delivery date cannot be before pickup date
      // Pickup date can be the same as delivery date (same-day delivery)
      if (
        new Date(createLoadDto.pickupDate) >
        new Date(createLoadDto.deliveryDate)
      )
        throw new BadRequestException(
          'Delivery date cannot be before pickup date',
        );

      this.logger.log('Locations validated:', {
        pickupLocation: pickupLocation?.locationData?.name || 'N/A',
        deliveryLocation: deliveryLocation?.locationData?.name || 'N/A',
        totalLocations: createLoadDto.locations.length,
      });

      // Prepare load data with all required fields
      const loadData = {
        ...createLoadDto,
        tenantId,
        cargoOwnerId: userId,
        status: LoadStatus.CREATED,
        urgencyLevel: createLoadDto.urgencyLevel || UrgencyLevel.NORMAL,
        cargoType: createLoadDto.cargoType,
        loadType: createLoadDto.loadType || LoadType.FTL,
        equipmentType: createLoadDto.equipmentType || EquipmentType.DRY_VAN,
        visibility: createLoadDto.visibility || Visibility.PUBLIC,
        unitsRequired: createLoadDto.unitsRequired || 1,
        paymentTerms: createLoadDto.paymentTerms || PaymentTerms.NET_30,
        packagingType: this.normalizePackagingType(
          createLoadDto.packagingType as any,
        ),
        contactInfo: createLoadDto.contactInfo || {},
        autoMatchEnabled:
          createLoadDto.autoMatchEnabled !== undefined
            ? createLoadDto.autoMatchEnabled
            : true,
        matchingCriteria: createLoadDto.matchingCriteria || {},
        truckRequirements: createLoadDto.truckRequirements || {},
        carrierPreferences: createLoadDto.carrierPreferences || {},
        costPreferences: createLoadDto.costPreferences || {},
        isStackable:
          createLoadDto.isStackable !== undefined
            ? createLoadDto.isStackable
            : false,
        requiresHumidityControl:
          createLoadDto.requiresHumidityControl !== undefined
            ? createLoadDto.requiresHumidityControl
            : false,
        requiresForklift:
          createLoadDto.requiresForklift !== undefined
            ? createLoadDto.requiresForklift
            : false,
        requiresCrane:
          createLoadDto.requiresCrane !== undefined
            ? createLoadDto.requiresCrane
            : false,
        requiresLoadingDock:
          createLoadDto.requiresLoadingDock !== undefined
            ? createLoadDto.requiresLoadingDock
            : false,
        isTimeCritical:
          createLoadDto.isTimeCritical !== undefined
            ? createLoadDto.isTimeCritical
            : false,
        requiresGpsMonitoring:
          createLoadDto.requiresGpsMonitoring !== undefined
            ? createLoadDto.requiresGpsMonitoring
            : false,
        requiresTemperatureMonitoring:
          createLoadDto.requiresTemperatureMonitoring !== undefined
            ? createLoadDto.requiresTemperatureMonitoring
            : false,
        requiresLowClearanceRoute:
          createLoadDto.requiresLowClearanceRoute !== undefined
            ? createLoadDto.requiresLowClearanceRoute
            : false,
        requiresEscortVehicle:
          createLoadDto.requiresEscortVehicle !== undefined
            ? createLoadDto.requiresEscortVehicle
            : false,
        requiresPreShipmentInspection:
          createLoadDto.requiresPreShipmentInspection !== undefined
            ? createLoadDto.requiresPreShipmentInspection
            : false,
        requiresDeliveryInspection:
          createLoadDto.requiresDeliveryInspection !== undefined
            ? createLoadDto.requiresDeliveryInspection
            : false,
        requiresPhotographicDocumentation:
          createLoadDto.requiresPhotographicDocumentation !== undefined
            ? createLoadDto.requiresPhotographicDocumentation
            : false,
        numberOfPieces: createLoadDto.numberOfPieces || 0,
        numberOfPallets: createLoadDto.numberOfPallets || 0,
        rating: 0,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.logger.log('Load data prepared:', JSON.stringify(loadData, null, 2));

      const load = this.loadRepository.create(loadData as any);
      this.logger.log('Load object created, saving...');
      const savedLoad = (await this.loadRepository.save(
        load,
      )) as unknown as Load;
      this.logger.log(`Created load ${savedLoad.id} successfully`);

      // Create audit event
      await this.createAuditEvent({
        loadId: savedLoad.id,
        entityType: AuditEntityType.LOAD,
        entityId: savedLoad.id,
        action: AuditAction.CREATE,
        actorId: userId,
        description: 'Load created',
        after: savedLoad,
      });

      return savedLoad;
    } catch (error) {
      this.logger.error(`Failed to create load: ${error.message}`, error.stack);
      this.logger.error(`Error code: ${error.code}`, error.detail);

      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      // Handle database errors
      if (error.code === '23505') {
        // Unique constraint violation
        const detail = error.detail || '';
        throw new ConflictException('A load with these details already exists');
      }

      if (error.code === '22001') {
        // Data too long
        throw new BadRequestException(
          'One or more fields exceed maximum length',
        );
      }

      if (error.code === '23502') {
        // Not null violation
        throw new BadRequestException('Required field is missing');
      }

      // Generic error
      throw new InternalServerErrorException({
        message: 'Failed to create load',
        error: error.message || 'An unexpected error occurred',
        details:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  /**
   * Create multiple loads in bulk
   */
  async createBulk(
    createLoadDtos: CreateLoadDto[],
    userId: string,
    tenantId: string,
  ): Promise<Load[]> {
    this.logger.log(
      `Creating ${createLoadDtos.length} loads in bulk for user ${userId}`,
    );

    try {
      const loads: Load[] = [];

      for (const createLoadDto of createLoadDtos) {
        try {
          const load = await this.create(createLoadDto, userId, tenantId);
          loads.push(load);
        } catch (error) {
          this.logger.error(`Failed to create load in bulk: ${error.message}`);
          throw new BadRequestException(
            `Failed to create load: ${error.message}`,
          );
        }
      }

      this.logger.log(`Successfully created ${loads.length} loads in bulk`);
      return loads;
    } catch (error) {
      this.logger.error(
        `Failed to create loads in bulk: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update multiple loads in bulk
   */
  async updateBulk(
    loadIds: string[],
    updates: Partial<CreateLoadDto>,
    tenantId: string,
    userId: string,
  ): Promise<Load[]> {
    this.logger.log(
      `Updating ${loadIds.length} loads in bulk for user ${userId}`,
    );

    try {
      const updatedLoads: Load[] = [];

      for (const loadId of loadIds) {
        try {
          const load = await this.update(loadId, updates, tenantId, userId);
          updatedLoads.push(load);
        } catch (error) {
          this.logger.error(
            `Failed to update load ${loadId} in bulk: ${error.message}`,
          );
          throw new BadRequestException(
            `Failed to update load ${loadId}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Successfully updated ${updatedLoads.length} loads in bulk`,
      );
      return updatedLoads;
    } catch (error) {
      this.logger.error(
        `Failed to update loads in bulk: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete multiple loads in bulk
   */
  async deleteBulk(
    loadIds: string[],
    tenantId: string,
    userId: string,
  ): Promise<void> {
    this.logger.log(
      `Deleting ${loadIds.length} loads in bulk for user ${userId}`,
    );

    try {
      for (const loadId of loadIds) {
        try {
          await this.remove(loadId, tenantId, userId);
        } catch (error) {
          this.logger.error(
            `Failed to delete load ${loadId} in bulk: ${error.message}`,
          );
          throw new BadRequestException(
            `Failed to delete load ${loadId}: ${error.message}`,
          );
        }
      }

      this.logger.log(`Successfully deleted ${loadIds.length} loads in bulk`);
    } catch (error) {
      this.logger.error(
        `Failed to delete loads in bulk: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Advanced search with geospatial queries
   */
  async searchLoads(
    searchCriteria: LoadSearchDto,
    tenantId: string,
    userId?: string,
  ): Promise<Load[]> {
    this.logger.log(
      `Searching loads with criteria: ${JSON.stringify(searchCriteria)}`,
    );

    try {
      const queryBuilder = this.loadRepository.createQueryBuilder('load');

      // Base filters
      queryBuilder.where('load.tenantId = :tenantId', { tenantId });

      if (userId) {
        queryBuilder.andWhere('load.cargoOwnerId = :userId', { userId });
      }

      // Text search
      if (searchCriteria.searchTerm) {
        queryBuilder.andWhere(
          '(load.title ILIKE :searchTerm OR load.description ILIKE :searchTerm OR load.locations::text ILIKE :searchTerm)',
          { searchTerm: `%${searchCriteria.searchTerm}%` },
        );
      }

      // Weight range
      if (searchCriteria.minWeight) {
        queryBuilder.andWhere('load.weight >= :minWeight', {
          minWeight: searchCriteria.minWeight,
        });
      }
      if (searchCriteria.maxWeight) {
        queryBuilder.andWhere('load.weight <= :maxWeight', {
          maxWeight: searchCriteria.maxWeight,
        });
      }

      // Value range
      if (searchCriteria.minValue) {
        queryBuilder.andWhere('load.loadValue >= :minValue', {
          minValue: searchCriteria.minValue,
        });
      }
      if (searchCriteria.maxValue) {
        queryBuilder.andWhere('load.loadValue <= :maxValue', {
          maxValue: searchCriteria.maxValue,
        });
      }

      // Date ranges
      if (searchCriteria.pickupDateFrom) {
        queryBuilder.andWhere('load.pickupDate >= :pickupDateFrom', {
          pickupDateFrom: new Date(searchCriteria.pickupDateFrom),
        });
      }
      if (searchCriteria.pickupDateTo) {
        queryBuilder.andWhere('load.pickupDate <= :pickupDateTo', {
          pickupDateTo: new Date(searchCriteria.pickupDateTo),
        });
      }
      if (searchCriteria.deliveryDateFrom) {
        queryBuilder.andWhere('load.deliveryDate >= :deliveryDateFrom', {
          deliveryDateFrom: new Date(searchCriteria.deliveryDateFrom),
        });
      }
      if (searchCriteria.deliveryDateTo) {
        queryBuilder.andWhere('load.deliveryDate <= :deliveryDateTo', {
          deliveryDateTo: new Date(searchCriteria.deliveryDateTo),
        });
      }

      // Geospatial queries (requires PostGIS extension)
      if (searchCriteria.geoBounds) {
        const { southwest, northeast } = searchCriteria.geoBounds;
        queryBuilder.andWhere(
          `ST_Within(
            ST_Point(
              (load.locations->0->'locationData'->'coordinates'->>'longitude')::float,
              (load.locations->0->'locationData'->'coordinates'->>'latitude')::float
            ),
            ST_MakeEnvelope(:swLng, :swLat, :neLng, :neLat, 4326)
          )`,
          {
            swLng: southwest.longitude,
            swLat: southwest.latitude,
            neLng: northeast.longitude,
            neLat: northeast.latitude,
          },
        );
      }

      // Distance-based search
      if (searchCriteria.centerPoint && searchCriteria.maxDistance) {
        const { latitude, longitude } = searchCriteria.centerPoint;
        queryBuilder.andWhere(
          `ST_DWithin(
            ST_Point(
              (load.locations->0->'locationData'->'coordinates'->>'longitude')::float,
              (load.locations->0->'locationData'->'coordinates'->>'latitude')::float
            ),
            ST_Point(:centerLng, :centerLat),
            :maxDistance * 1000
          )`,
          {
            centerLng: longitude,
            centerLat: latitude,
            maxDistance: searchCriteria.maxDistance,
          },
        );
      }

      const results = await queryBuilder.getMany();
      this.logger.log(`Found ${results.length} loads matching search criteria`);
      return results;
    } catch (error) {
      this.logger.error(
        `Failed to search loads: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find all loads with pagination, filtering, and sorting
   */
  async findAll(
    tenantId: string,
    userId?: string,
    query: LoadsQueryDto = {},
  ): Promise<LoadsPaginatedResponse> {
    this.logger.log(`Finding loads for tenant ${tenantId}, user ${userId}`);

    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        ...filters
      } = query;

      const queryBuilder = this.buildLoadsQuery(tenantId, userId, filters);

      // Apply sorting
      queryBuilder.orderBy(`load.${sortBy}`, sortOrder);

      // Apply pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      // Execute queries
      const [loads, total] = await queryBuilder.getManyAndCount();

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      this.logger.log(`Found ${loads.length} loads out of ${total} total`);

      // Transform Load entities to LoadResponseDto
      const items = loads.map((load) => this.transformLoadToResponse(load));

      return {
        items,
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
      };
    } catch (error) {
      this.logger.error(`Failed to find loads: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find a single load by ID with proper error handling
   */
  async findOne(id: string, tenantId: string, userId?: string): Promise<Load> {
    this.logger.log(`Finding load ${id} for tenant ${tenantId}`);

    try {
      const queryBuilder = this.loadRepository
        .createQueryBuilder('load')
        .leftJoinAndSelect('load.cargoOwner', 'cargoOwner')
        .where('load.id = :id', { id })
        .andWhere('load.tenantId = :tenantId', { tenantId });

      // If userId provided, ensure user can only see their own loads
      if (userId) {
        queryBuilder.andWhere('load.cargoOwnerId = :userId', { userId });
      }

      const load = await queryBuilder.getOne();

      if (!load) {
        throw new NotFoundException(`Load with ID ${id} not found`);
      }

      return load;
    } catch (error) {
      this.logger.error(
        `Failed to find load ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update a load with comprehensive validation
   */
  async update(
    id: string,
    updateLoadDto: UpdateLoadDto,
    tenantId: string,
    userId: string,
  ): Promise<Load> {
    this.logger.log(`Updating load ${id} for user ${userId}`);

    try {
      const load = await this.findOne(id, tenantId, userId);

      // Validate ownership
      if (load.cargoOwnerId !== userId) {
        throw new ForbiddenException('You can only update your own loads');
      }

      // Note: Status updates should be handled through dedicated endpoints (publish, cancel, etc.)
      // to ensure proper workflow validation

      // Validate locations if they are being updated
      if (updateLoadDto.locations) {
        this.handleLocationValidation(updateLoadDto.locations as any);
      }

      // Validate dates if provided
      // Handle cases where only one date is updated
      const pickupDate = updateLoadDto.pickupDate
        ? new Date(updateLoadDto.pickupDate)
        : load.pickupDate
          ? new Date(load.pickupDate)
          : null;
      const deliveryDate = updateLoadDto.deliveryDate
        ? new Date(updateLoadDto.deliveryDate)
        : load.deliveryDate
          ? new Date(load.deliveryDate)
          : null;

      if (pickupDate && deliveryDate) {
        // Validate: delivery date cannot be before pickup date
        // Pickup date can be the same as delivery date (same-day delivery)
        if (pickupDate > deliveryDate) {
          throw new BadRequestException(
            'Delivery date cannot be before pickup date',
          );
        }
      }

      const sanitizedUpdate: Partial<UpdateLoadDto> = {
        ...updateLoadDto,
      };

      if (sanitizedUpdate.packagingType !== undefined) {
        sanitizedUpdate.packagingType = this.normalizePackagingType(
          sanitizedUpdate.packagingType as any,
        );
      }

      // Update load
      Object.assign(load, sanitizedUpdate);
      const updatedLoad = await this.loadRepository.save(load);

      this.logger.log(`Updated load ${id} successfully`);
      return updatedLoad;
    } catch (error) {
      this.logger.error(
        `Failed to update load ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete a load with proper validation
   */
  async remove(id: string, tenantId: string, userId: string): Promise<void> {
    this.logger.log(`Deleting load ${id} for user ${userId}`);

    try {
      const load = await this.findOne(id, tenantId, userId);

      // Validate ownership
      if (load.cargoOwnerId !== userId) {
        throw new ForbiddenException('You can only delete your own loads');
      }

      // Validate status
      if (![LoadStatus.DRAFT, LoadStatus.CREATED].includes(load.status)) {
        throw new ForbiddenException(
          'Can only delete loads in DRAFT or CREATED status',
        );
      }

      await this.loadRepository.remove(load);
      this.logger.log(`Deleted load ${id} successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to delete load ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Publish a load (change status from DRAFT to PUBLISHED)
   */
  async publishLoad(
    loadId: string,
    userId: string,
    tenantId: string,
  ): Promise<Load> {
    const load = await this.findOne(loadId, tenantId, userId);

    if (!load.canPublish()) {
      throw new BadRequestException(
        'Load cannot be published. Please ensure all required fields are filled.',
      );
    }

    const previousStatus = load.status;
    load.status = LoadStatus.CREATED;
    load.publishedAt = new Date();
    load.updatedAt = new Date();

    const savedLoad = await this.loadRepository.save(load);

    // Create audit event
    await this.createAuditEvent({
      loadId: loadId,
      entityType: AuditEntityType.LOAD,
      entityId: loadId,
      action: AuditAction.PUBLISH,
      actorId: userId,
      description: 'Load moved to created status',
      before: { status: previousStatus },
      after: { status: load.status, publishedAt: load.publishedAt },
      changes: [
        {
          field: 'status',
          oldValue: previousStatus,
          newValue: load.status,
          type: 'modified',
        },
      ],
    });

    return savedLoad;
  }

  /**
   * Assign a carrier to a load
   */
  async assignCarrier(
    loadId: string,
    carrierId: string,
    rate: number,
    userId: string,
    tenantId: string,
    notes?: string,
  ): Promise<Load> {
    const load = await this.findOne(loadId, tenantId, userId);

    if (!load.canAssign()) {
      throw new BadRequestException(
        'Load cannot be assigned. Load must be published or pending confirmation.',
      );
    }

    const previousStatus = load.status;
    load.status = LoadStatus.ASSIGNED;
    load.assignedCarrierId = carrierId;
    load.offeredPrice = rate;
    load.updatedAt = new Date();

    const savedLoad = await this.loadRepository.save(load);

    // Create audit event
    await this.createAuditEvent({
      loadId: loadId,
      entityType: AuditEntityType.LOAD,
      entityId: loadId,
      action: AuditAction.ASSIGN,
      actorId: userId,
      description: `Carrier assigned with rate ${rate}`,
      before: {
        status: previousStatus,
        assignedCarrierId: load.assignedCarrierId,
      },
      after: {
        status: load.status,
        assignedCarrierId: carrierId,
        offeredPrice: rate,
      },
      changes: [
        {
          field: 'status',
          oldValue: previousStatus,
          newValue: load.status,
          type: 'modified',
        },
        {
          field: 'assignedCarrierId',
          oldValue: load.assignedCarrierId,
          newValue: carrierId,
          type: 'modified',
        },
        {
          field: 'offeredPrice',
          oldValue: load.offeredPrice,
          newValue: rate,
          type: 'modified',
        },
      ],
    });

    return savedLoad;
  }

  /**
   * Start a load (change status from ASSIGNED to IN_TRANSIT)
   */
  async startLoad(
    loadId: string,
    userId: string,
    tenantId: string,
  ): Promise<Load> {
    const load = await this.findOne(loadId, tenantId, userId);

    if (!load.canStart()) {
      throw new BadRequestException(
        'Load cannot be started. Please ensure carrier and truck are assigned.',
      );
    }

    const previousStatus = load.status;
    load.status = LoadStatus.IN_TRANSIT;
    load.updatedAt = new Date();

    const savedLoad = await this.loadRepository.save(load);

    // Create audit event
    await this.createAuditEvent({
      loadId: loadId,
      entityType: AuditEntityType.LOAD,
      entityId: loadId,
      action: AuditAction.START,
      actorId: userId,
      description: 'Load started - now in transit',
      before: { status: previousStatus },
      after: { status: load.status },
      changes: [
        {
          field: 'status',
          oldValue: previousStatus,
          newValue: load.status,
          type: 'modified',
        },
      ],
    });

    return savedLoad;
  }

  /**
   * Deliver a load (change status from IN_TRANSIT to DELIVERED)
   */
  async deliverLoad(
    loadId: string,
    userId: string,
    tenantId: string,
    podFile?: Express.Multer.File,
    notes?: string,
  ): Promise<Load> {
    const load = await this.findOne(loadId, tenantId, userId);

    if (!load.canDeliver()) {
      throw new BadRequestException(
        'Load cannot be delivered. Load must be in transit.',
      );
    }

    const previousStatus = load.status;
    load.status = LoadStatus.DELIVERED;
    load.updatedAt = new Date();

    const savedLoad = await this.loadRepository.save(load);

    // If POD file is provided, create document
    if (podFile) {
      await this.uploadDocument(
        loadId,
        {
          type: DocumentType.POD,
          file: podFile,
          description: 'Proof of Delivery',
          metadata: { notes },
        },
        userId,
        tenantId,
      );
    }

    // Create audit event
    await this.createAuditEvent({
      loadId: loadId,
      entityType: AuditEntityType.LOAD,
      entityId: loadId,
      action: AuditAction.DELIVER,
      actorId: userId,
      description: 'Load delivered',
      before: { status: previousStatus },
      after: { status: load.status },
      changes: [
        {
          field: 'status',
          oldValue: previousStatus,
          newValue: load.status,
          type: 'modified',
        },
      ],
    });

    return savedLoad;
  }

  /**
   * Cancel a load
   */
  async cancelLoad(
    loadId: string,
    userId: string,
    tenantId: string,
    reason: string,
  ): Promise<Load> {
    const load = await this.findOne(loadId, tenantId, userId);

    if (!load.canCancel()) {
      throw new BadRequestException(
        'Load cannot be cancelled. Only draft, published, or pending confirmation loads can be cancelled.',
      );
    }

    const previousStatus = load.status;
    load.status = LoadStatus.CANCELLED;
    load.updatedAt = new Date();

    const savedLoad = await this.loadRepository.save(load);

    // Create audit event
    await this.createAuditEvent({
      loadId: loadId,
      entityType: AuditEntityType.LOAD,
      entityId: loadId,
      action: AuditAction.CANCEL,
      actorId: userId,
      description: `Load cancelled: ${reason}`,
      before: { status: previousStatus },
      after: { status: load.status },
      changes: [
        {
          field: 'status',
          oldValue: previousStatus,
          newValue: load.status,
          type: 'modified',
        },
      ],
      reason,
    });

    return savedLoad;
  }

  /**
   * Repost a cancelled load
   */
  async repostLoad(
    loadId: string,
    userId: string,
    tenantId: string,
  ): Promise<Load> {
    const load = await this.findOne(loadId, tenantId, userId);

    if (!load.canRepost()) {
      throw new BadRequestException(
        'Load cannot be reposted. Only cancelled loads can be reposted.',
      );
    }

    const previousStatus = load.status;
    load.status = LoadStatus.DRAFT;
    load.assignedCarrierId = null;
    load.assignedTruckId = null;
    load.offeredPrice = null;
    load.publishedAt = null;
    load.updatedAt = new Date();

    const savedLoad = await this.loadRepository.save(load);

    // Create audit event
    await this.createAuditEvent({
      loadId: loadId,
      entityType: AuditEntityType.LOAD,
      entityId: loadId,
      action: AuditAction.REPOST,
      actorId: userId,
      description: 'Load reposted',
      before: { status: previousStatus },
      after: { status: load.status },
      changes: [
        {
          field: 'status',
          oldValue: previousStatus,
          newValue: load.status,
          type: 'modified',
        },
      ],
    });

    return savedLoad;
  }

  /**
   * Upload a document for a load
   */
  async uploadDocument(
    loadId: string,
    documentData: {
      type: DocumentType;
      file: Express.Multer.File;
      description?: string;
      metadata?: Record<string, any>;
    },
    userId: string,
    tenantId: string,
  ): Promise<Document> {
    // Verify load exists and user has access
    await this.findOne(loadId, tenantId, userId);

    const document = this.documentRepository.create({
      entityType: EntityType.CARGO,
      entityId: loadId,
      documentType: documentData.type,
      category: DocumentCategory.OPERATIONAL,
      title: `Load Document - ${documentData.type}`,
      description: documentData.description,
      fileName: documentData.file.filename,
      originalFileName: documentData.file.originalname,
      fileUrl: `/uploads/${documentData.file.filename}`, // This should be configured based on your file storage
      fileSize: documentData.file.size,
      mimeType: documentData.file.mimetype,
      fileExtension: documentData.file.filename.split('.').pop() || '',
      uploadedBy: userId,
      tenantId,
      status: DocumentStatus.PENDING,
      priority: DocumentPriority.NORMAL,
      tags: ['load', 'document'],
      metadata: documentData.metadata,
      currentVersion: 1,
      versions: [
        {
          version: 1,
          fileUrl: `/uploads/${documentData.file.filename}`,
          fileName: documentData.file.filename,
          fileSize: documentData.file.size,
          uploadedBy: userId,
          uploadedAt: new Date(),
          changeNotes: 'Initial upload',
        },
      ],
      auditTrail: [
        {
          action: 'CREATED',
          performedBy: userId,
          performedAt: new Date(),
          details: { method: 'upload', loadId },
        },
      ],
    });

    const savedDocument = await this.documentRepository.save(document);

    // Create audit event
    await this.createAuditEvent({
      loadId: loadId,
      entityType: AuditEntityType.DOCUMENT,
      entityId: savedDocument.id,
      action: AuditAction.DOCUMENT_UPLOAD,
      actorId: userId,
      description: `Document uploaded: ${documentData.type}`,
      after: savedDocument,
    });

    return savedDocument;
  }

  /**
   * Get documents for a load
   */
  async getLoadDocuments(
    loadId: string,
    tenantId: string,
  ): Promise<Document[]> {
    await this.findOne(loadId, tenantId, null); // No user check for document access

    return this.documentRepository.find({
      where: { entityType: EntityType.CARGO, entityId: loadId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Delete a document
   */
  async deleteDocument(
    documentId: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Verify user has access to the load
    await this.findOne(document.entityId, tenantId, userId);

    // Check if document can be deleted (not verified)
    if (document.status === DocumentStatus.VERIFIED) {
      throw new BadRequestException(
        'Document cannot be deleted. It has been verified.',
      );
    }

    await this.documentRepository.remove(document);

    // Create audit event
    await this.createAuditEvent({
      loadId: document.entityId,
      entityType: AuditEntityType.DOCUMENT,
      entityId: documentId,
      action: AuditAction.DOCUMENT_DELETE,
      actorId: userId,
      description: `Document deleted: ${document.documentType}`,
      before: document,
    });
  }

  /**
   * Update load location (for tracking)
   */
  async updateLocation(
    loadId: string,
    locationData: {
      latitude: number;
      longitude: number;
      timestamp: Date;
      speedKph?: number;
      headingDeg?: number;
      accuracyM?: number;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    },
    userId: string,
    tenantId: string,
  ): Promise<TrackingEvent> {
    // Verify load exists and user has access
    await this.findOne(loadId, tenantId, userId);

    const trackingEvent = this.trackingEventRepository.create({
      loadId,
      type: TrackingEventType.LOCATION,
      ...locationData,
      reportedBy: userId,
      isAutomated: false,
      createdAt: new Date(),
    });

    const savedEvent = await this.trackingEventRepository.save(trackingEvent);

    // Create audit event
    await this.createAuditEvent({
      loadId: loadId,
      entityType: AuditEntityType.TRACKING,
      entityId: savedEvent.id,
      action: AuditAction.TRACKING_UPDATE,
      actorId: userId,
      description: 'Location updated',
      after: savedEvent,
    });

    return savedEvent;
  }

  /**
   * Get tracking history for a load
   */
  async getTrackingHistory(
    loadId: string,
    tenantId: string,
  ): Promise<TrackingEvent[]> {
    await this.findOne(loadId, tenantId, null); // No user check for tracking history

    return this.trackingEventRepository.find({
      where: { loadId },
      order: { timestamp: 'DESC' },
    });
  }

  /**
   * Create an alert for a load
   */
  async createAlert(
    loadId: string,
    alertData: {
      type: AlertType;
      description: string;
      severity: AlertSeverity;
      occurredAt: Date;
      location?: {
        latitude?: number;
        longitude?: number;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
      };
      estimatedDelayHours?: number;
      contactPerson?: string;
      contactPhone?: string;
      contactEmail?: string;
      metadata?: Record<string, any>;
    },
    userId: string,
    tenantId: string,
  ): Promise<Alert> {
    // Verify load exists and user has access
    await this.findOne(loadId, tenantId, userId);

    const alert = this.alertRepository.create({
      loadId,
      ...alertData,
      status: AlertStatus.OPEN,
      createdAt: new Date(),
    });

    const savedAlert = await this.alertRepository.save(alert);

    // Create audit event
    await this.createAuditEvent({
      loadId: loadId,
      entityType: AuditEntityType.ALERT,
      entityId: savedAlert.id,
      action: AuditAction.ALERT_CREATE,
      actorId: userId,
      description: `Alert created: ${alertData.type}`,
      after: savedAlert,
    });

    return savedAlert;
  }

  /**
   * Get alerts for a load
   */
  async getLoadAlerts(loadId: string, tenantId: string): Promise<Alert[]> {
    await this.findOne(loadId, tenantId, null); // No user check for alerts

    return this.alertRepository.find({
      where: { loadId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(
    alertId: string,
    status: AlertStatus,
    userId: string,
    tenantId: string,
    notes?: string,
  ): Promise<Alert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId },
      relations: ['load'],
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    // Verify user has access to the load
    await this.findOne(alert.loadId, tenantId, userId);

    const previousStatus = alert.status;
    alert.status = status;
    alert.updatedAt = new Date();

    // Set appropriate timestamps based on status
    switch (status) {
      case AlertStatus.ACKNOWLEDGED:
        alert.acknowledgedAt = new Date();
        alert.acknowledgedBy = userId;
        break;
      case AlertStatus.IN_PROGRESS:
        // No additional timestamps needed
        break;
      case AlertStatus.RESOLVED:
        alert.resolvedAt = new Date();
        alert.resolvedBy = userId;
        break;
      case AlertStatus.CLOSED:
        alert.closedAt = new Date();
        alert.closedBy = userId;
        break;
    }

    if (notes) {
      alert.resolutionNotes = notes;
    }

    const savedAlert = await this.alertRepository.save(alert);

    // Create audit event
    await this.createAuditEvent({
      loadId: alert.loadId,
      entityType: AuditEntityType.ALERT,
      entityId: alertId,
      action: AuditAction.ALERT_UPDATE,
      actorId: userId,
      description: `Alert status updated to ${status}`,
      before: { status: previousStatus },
      after: { status: alert.status },
      changes: [
        {
          field: 'status',
          oldValue: previousStatus,
          newValue: alert.status,
          type: 'modified',
        },
      ],
    });

    return savedAlert;
  }

  /**
   * Get price suggestion for a load
   */
  async getPriceSuggestion(
    loadId: string,
    tenantId: string,
  ): Promise<PriceSuggestion> {
    await this.findOne(loadId, tenantId, null); // No user check for price suggestion

    // Get the most recent active price suggestion
    const priceSuggestion = await this.priceSuggestionRepository.findOne({
      where: {
        loadId,
        status: PricingStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });

    if (!priceSuggestion) {
      throw new NotFoundException(
        'No active price suggestion found for this load',
      );
    }

    return priceSuggestion;
  }

  /**
   * Get audit history for a load
   */
  async getLoadHistory(
    loadId: string,
    tenantId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    items: AuditEvent[];
    total: number;
    page: number;
    limit: number;
  }> {
    await this.findOne(loadId, tenantId, null); // No user check for history

    const [items, total] = await this.auditEventRepository.findAndCount({
      where: { loadId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * Create audit event
   */
  private async createAuditEvent(auditData: {
    loadId: string;
    entityType: AuditEntityType;
    entityId?: string;
    action: AuditAction;
    actorId: string;
    description?: string;
    reason?: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
    changes?: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      type: 'added' | 'removed' | 'modified';
    }>;
    metadata?: Record<string, any>;
  }): Promise<AuditEvent> {
    const auditEvent = this.auditEventRepository.create({
      ...auditData,
      createdAt: new Date(),
    });

    return this.auditEventRepository.save(auditEvent);
  }

  /**
   * Export loads to CSV format
   */
  async exportLoads(
    tenantId: string,
    userId?: string,
    query: LoadsQueryDto = {},
  ): Promise<string> {
    this.logger.log(`Exporting loads for tenant ${tenantId}`);

    try {
      const { items: loads } = await this.findAll(tenantId, userId, {
        ...query,
        limit: 10000,
      });

      const csvHeaders = [
        'ID',
        'Title',
        'Description',
        'Weight',
        'Volume',
        'Cargo Type',
        'Status',
        'Load Value',
        'Offered Price',
        'Currency',
        'Pickup Date',
        'Delivery Date',
        'Urgency Level',
        'Is Time Critical',
        'Is Hazardous',
        'Requires Refrigeration',
        'Created At',
        'Published At',
      ];

      const csvRows = loads.map((load) => [
        load.id,
        load.title,
        load.description || '',
        load.weight,
        load.volume || '',
        load.cargoType,
        load.status,
        load.loadValue,
        load.offeredPrice || '',
        load.currencyCode,
        load.pickupDate,
        load.deliveryDate,
        load.urgencyLevel,
        load.isTimeCritical,
        load.isHazardous,
        load.requiresRefrigeration,
        load.createdAt,
        load.publishedAt || '',
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      this.logger.log(`Exported ${loads.length} loads to CSV`);
      return csvContent;
    } catch (error) {
      this.logger.error(
        `Failed to export loads: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get load statistics for dashboard
   */
  async getLoadStatistics(tenantId: string, userId?: string): Promise<any> {
    this.logger.log(`Getting load statistics for tenant ${tenantId}`);

    try {
      const queryBuilder = this.loadRepository
        .createQueryBuilder('load')
        .where('load.tenantId = :tenantId', { tenantId });

      if (userId) {
        queryBuilder.andWhere('load.cargoOwnerId = :userId', { userId });
      }

      const [
        totalLoads,
        draftLoads,
        publishedLoads,
        assignedLoads,
        inTransitLoads,
        deliveredLoads,
        totalValue,
        averageValue,
      ] = await Promise.all([
        queryBuilder.getCount(),
        queryBuilder
          .clone()
          .andWhere('load.status = :status', { status: LoadStatus.DRAFT })
          .getCount(),
        queryBuilder
          .clone()
          .andWhere('load.status IN (:...statuses)', {
            statuses: [LoadStatus.CREATED, LoadStatus.PUBLISHED],
          })
          .getCount(),
        queryBuilder
          .clone()
          .andWhere('load.status = :status', { status: LoadStatus.ASSIGNED })
          .getCount(),
        queryBuilder
          .clone()
          .andWhere('load.status = :status', { status: LoadStatus.IN_TRANSIT })
          .getCount(),
        queryBuilder
          .clone()
          .andWhere('load.status = :status', { status: LoadStatus.DELIVERED })
          .getCount(),
        queryBuilder.clone().select('SUM(load.loadValue)', 'total').getRawOne(),
        queryBuilder
          .clone()
          .select('AVG(load.loadValue)', 'average')
          .getRawOne(),
      ]);

      return {
        totalLoads,
        byStatus: {
          draft: draftLoads,
          created: publishedLoads, // This now includes both CREATED and PUBLISHED
          assigned: assignedLoads,
          inTransit: inTransitLoads,
          delivered: deliveredLoads,
        },
        totalValue: parseFloat(totalValue?.total || '0'),
        averageValue: parseFloat(averageValue?.average || '0'),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get load statistics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Private helper methods

  /**
   * Validate load status transitions
   */
  private validateStatusTransition(
    currentStatus: LoadStatus,
    newStatus: LoadStatus,
  ): void {
    const allowedTransitions = {
      [LoadStatus.DRAFT]: [LoadStatus.CREATED, LoadStatus.CANCELLED],
      [LoadStatus.CREATED]: [
        LoadStatus.PUBLISHED,
        LoadStatus.ASSIGNED,
        LoadStatus.CANCELLED,
      ],
      [LoadStatus.PUBLISHED]: [LoadStatus.ASSIGNED, LoadStatus.CANCELLED],
      [LoadStatus.ASSIGNED]: [LoadStatus.IN_TRANSIT, LoadStatus.CANCELLED],
      [LoadStatus.IN_TRANSIT]: [LoadStatus.DELIVERED, LoadStatus.CANCELLED],
      [LoadStatus.DELIVERED]: [LoadStatus.COMPLETED],
      [LoadStatus.CANCELLED]: [], // No transitions from cancelled
      [LoadStatus.COMPLETED]: [], // No transitions from completed
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
          `Allowed transitions: ${allowed.join(', ')}`,
      );
    }
  }

  /**
   * Enhanced location validation
   */
  private handleLocationValidation(locations: LoadLocation[]): void {
    if (!locations || locations.length < 2) {
      throw new BadRequestException(
        'At least 2 locations (pickup and delivery) are required',
      );
    }

    const pickupCount = locations.filter((l) => l.type === 'PICKUP').length;
    const deliveryCount = locations.filter((l) => l.type === 'DELIVERY').length;

    if (pickupCount === 0) {
      throw new BadRequestException('At least one pickup location is required');
    }
    if (deliveryCount === 0) {
      throw new BadRequestException(
        'At least one delivery location is required',
      );
    }

    // Validate sequence order (only if sequence is provided)
    const locationsWithSequence = locations.filter(
      (l) => l.sequence !== undefined && l.sequence !== null,
    );
    if (locationsWithSequence.length > 0) {
      const sortedLocations = locationsWithSequence.sort(
        (a, b) => a.sequence - b.sequence,
      );
      if (
        sortedLocations[0].type !== 'PICKUP' ||
        sortedLocations[sortedLocations.length - 1].type !== 'DELIVERY'
      ) {
        throw new BadRequestException(
          'Route must start with pickup and end with delivery',
        );
      }
    }

    // Validate unique IDs (only if IDs are provided)
    const locationIds = locations
      .map((l) => l.id)
      .filter((id) => id !== undefined && id !== null);
    if (locationIds.length > 0) {
      const uniqueIds = new Set(locationIds);
      if (locationIds.length !== uniqueIds.size) {
        throw new BadRequestException('Location IDs must be unique');
      }
    }
  }

  private normalizePackagingType(
    packagingType?: string | PackagingType,
  ): PackagingType {
    if (!packagingType) {
      return PackagingType.PALLETIZED;
    }

    const incoming = packagingType.toString().trim();
    if (!incoming) {
      return PackagingType.PALLETIZED;
    }

    const enumValues = Object.values(PackagingType) as string[];
    const directMatch = enumValues.find(
      (value) => value.toLowerCase() === incoming.toLowerCase(),
    );
    if (directMatch) {
      return directMatch as PackagingType;
    }

    const mapping: Record<string, PackagingType> = {
      PALLETS: PackagingType.PALLETIZED,
      PALLETIZED: PackagingType.PALLETIZED,
      CRATES: PackagingType.CRATE,
      CRATE: PackagingType.CRATE,
      BOXES: PackagingType.LOOSE,
      BOX: PackagingType.LOOSE,
      LOOSE: PackagingType.LOOSE,
      CONTAINERS: PackagingType.CONTAINERIZED,
      CONTAINER: PackagingType.CONTAINERIZED,
      CONTAINERIZED: PackagingType.CONTAINERIZED,
      DRUMS: PackagingType.DRUM,
      DRUM: PackagingType.DRUM,
      BAGS: PackagingType.OTHER,
      ROLLS: PackagingType.OTHER,
      CYLINDERS: PackagingType.OTHER,
      OTHER: PackagingType.OTHER,
      ANTI_STATIC: PackagingType.OTHER,
      BLANKET_WRAP: PackagingType.OTHER,
      GREASE_RESISTANT: PackagingType.OTHER,
      HEAVY_DUTY: PackagingType.OTHER,
      WEATHER_RESISTANT: PackagingType.OTHER,
    };

    const mapped = mapping[incoming.toUpperCase()];
    if (mapped) {
      return mapped;
    }

    return PackagingType.OTHER;
  }

  private buildLoadsQuery(
    tenantId: string,
    userId?: string,
    filters: any = {},
  ) {
    const queryBuilder = this.loadRepository
      .createQueryBuilder('load')
      .leftJoinAndSelect('load.cargoOwner', 'cargoOwner')
      .where('load.tenantId = :tenantId', { tenantId });

    // Apply user filter
    if (userId) {
      queryBuilder.andWhere('load.cargoOwnerId = :userId', { userId });
    }

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('load.status = :status', {
        status: filters.status,
      });
    }

    if (filters.cargoType) {
      queryBuilder.andWhere('load.cargoType = :cargoType', {
        cargoType: filters.cargoType,
      });
    }

    if (filters.urgencyLevel) {
      queryBuilder.andWhere('load.urgencyLevel = :urgencyLevel', {
        urgencyLevel: filters.urgencyLevel,
      });
    }

    if (filters.isHazardous !== undefined) {
      queryBuilder.andWhere('load.isHazardous = :isHazardous', {
        isHazardous: filters.isHazardous,
      });
    }

    if (filters.requiresRefrigeration !== undefined) {
      queryBuilder.andWhere(
        'load.requiresRefrigeration = :requiresRefrigeration',
        {
          requiresRefrigeration: filters.requiresRefrigeration,
        },
      );
    }

    if (filters.isTimeCritical !== undefined) {
      queryBuilder.andWhere('load.isTimeCritical = :isTimeCritical', {
        isTimeCritical: filters.isTimeCritical,
      });
    }

    if (filters.search) {
      try {
        const searchValue =
          typeof filters.search === 'string'
            ? filters.search
            : String(filters.search);
        const searchTerm = searchValue.trim();

        if (searchTerm && searchTerm.length > 0) {
          // Escape special characters for ILIKE (% and _ are special in ILIKE)
          // Simple escaping: replace % with \% and _ with \_
          const escapedSearch = searchTerm
            .replace(/\\/g, '\\\\') // Escape backslashes first
            .replace(/%/g, '\\%') // Escape %
            .replace(/_/g, '\\_'); // Escape _

          // Search primarily in title (cargo name) and description
          // Using COALESCE to handle null values safely
          queryBuilder.andWhere(
            "(COALESCE(load.title, '') ILIKE :search OR COALESCE(load.description, '') ILIKE :search)",
            { search: `%${escapedSearch}%` },
          );
        }
      } catch (error) {
        this.logger.warn(
          `Error processing search filter: ${error.message}`,
          error.stack,
        );
        // Continue without search filter if there's an error
      }
    }

    if (filters.startDate) {
      queryBuilder.andWhere('load.pickupDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('load.deliveryDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters.minWeight) {
      queryBuilder.andWhere('load.weight >= :minWeight', {
        minWeight: filters.minWeight,
      });
    }

    if (filters.maxWeight) {
      queryBuilder.andWhere('load.weight <= :maxWeight', {
        maxWeight: filters.maxWeight,
      });
    }

    if (filters.minValue) {
      queryBuilder.andWhere('load.loadValue >= :minValue', {
        minValue: filters.minValue,
      });
    }

    if (filters.maxValue) {
      queryBuilder.andWhere('load.loadValue <= :maxValue', {
        maxValue: filters.maxValue,
      });
    }

    return queryBuilder;
  }

  private async buildContactInfo(user: User): Promise<Record<string, any>> {
    return {
      name: user.email, // Fallback to email if no profile
      email: user.email,
      phone: user.phone || '',
      company: '', // Fallback to empty string
    };
  }

  private buildMatchingCriteria(
    createLoadDto: CreateLoadDto,
  ): Record<string, any> {
    return {
      truckRequirements: createLoadDto.truckRequirements || {},
      carrierPreferences: createLoadDto.carrierPreferences || {},
      costPreferences: createLoadDto.costPreferences || {},
    };
  }

  // Private helper method to map CargoTypeV2 to CargoType
  private mapCargoTypeV2ToEntity(cargoTypeV2: any): CargoType {
    const mapping = {
      GENERAL: CargoType.GENERAL,
      FOOD: CargoType.GENERAL,
      ELECTRONICS: CargoType.FRAGILE,
      CHEMICALS: CargoType.HAZARDOUS,
      AUTOMOTIVE: CargoType.GENERAL,
      TEXTILES: CargoType.GENERAL,
      MACHINERY: CargoType.OVERSIZED,
    };
    return mapping[cargoTypeV2] || CargoType.GENERAL;
  }

  // New methods for location management
  async addLocationToLoad(
    loadId: string,
    location: LoadLocation,
    tenantId: string,
    userId: string,
  ): Promise<Load> {
    this.logger.log(`Adding location to load ${loadId} for user ${userId}`);

    try {
      const load = await this.findOne(loadId, tenantId, userId);

      if (load.cargoOwnerId !== userId) {
        throw new ForbiddenException('You can only modify your own loads');
      }

      // Generate new ID if not provided
      if (!location.id) {
        location.id = crypto.randomUUID();
      }

      // Set default status if not provided
      if (!location.status) {
        location.status = 'PENDING';
      }

      load.addLocation(location);
      const savedLoad = await this.loadRepository.save(load);
      this.logger.log(`Added location to load ${loadId} successfully`);
      return savedLoad;
    } catch (error) {
      this.logger.error(
        `Failed to add location to load ${loadId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateLocationStatus(
    loadId: string,
    locationId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    tenantId: string,
    userId: string,
  ): Promise<Load> {
    this.logger.log(
      `Updating location status for load ${loadId}, location ${locationId}`,
    );

    try {
      const load = await this.findOne(loadId, tenantId, userId);

      if (load.cargoOwnerId !== userId) {
        throw new ForbiddenException('You can only modify your own loads');
      }

      const success = load.updateLocation(locationId, { status });
      if (!success) {
        throw new NotFoundException('Location not found in this load');
      }

      const savedLoad = await this.loadRepository.save(load);
      this.logger.log(
        `Updated location status for load ${loadId} successfully`,
      );
      return savedLoad;
    } catch (error) {
      this.logger.error(
        `Failed to update location status for load ${loadId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async removeLocationFromLoad(
    loadId: string,
    locationId: string,
    tenantId: string,
    userId: string,
  ): Promise<Load> {
    this.logger.log(
      `Removing location from load ${loadId}, location ${locationId}`,
    );

    try {
      const load = await this.findOne(loadId, tenantId, userId);

      if (load.cargoOwnerId !== userId) {
        throw new ForbiddenException('You can only modify your own loads');
      }

      const success = load.removeLocation(locationId);
      if (!success) {
        throw new NotFoundException('Location not found in this load');
      }

      const savedLoad = await this.loadRepository.save(load);
      this.logger.log(`Removed location from load ${loadId} successfully`);
      return savedLoad;
    } catch (error) {
      this.logger.error(
        `Failed to remove location from load ${loadId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getLoadRoute(
    loadId: string,
    tenantId: string,
    userId?: string,
  ): Promise<LoadLocation[]> {
    this.logger.log(`Getting route for load ${loadId}`);

    try {
      const load = await this.findOne(loadId, tenantId, userId);
      const route = load.getRouteLocations();
      this.logger.log(
        `Retrieved route for load ${loadId} with ${route.length} locations`,
      );
      return route;
    } catch (error) {
      this.logger.error(
        `Failed to get route for load ${loadId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateLocationTimes(
    loadId: string,
    locationId: string,
    tenantId: string,
    userId: string,
    actualArrivalTime?: Date,
    actualDepartureTime?: Date,
  ): Promise<Load> {
    this.logger.log(
      `Updating location times for load ${loadId}, location ${locationId}`,
    );

    try {
      const load = await this.findOne(loadId, tenantId, userId);

      if (load.cargoOwnerId !== userId) {
        throw new ForbiddenException('You can only modify your own loads');
      }

      const updates: Partial<LoadLocation> = {};
      if (actualArrivalTime) updates.actualArrivalTime = actualArrivalTime;
      if (actualDepartureTime)
        updates.actualDepartureTime = actualDepartureTime;

      const success = load.updateLocation(locationId, updates);
      if (!success) {
        throw new NotFoundException('Location not found in this load');
      }

      const savedLoad = await this.loadRepository.save(load);
      this.logger.log(`Updated location times for load ${loadId} successfully`);
      return savedLoad;
    } catch (error) {
      this.logger.error(
        `Failed to update location times for load ${loadId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create a load template for quick load creation
   */
  async createTemplate(
    templateData: any,
    userId: string,
    tenantId: string,
  ): Promise<any> {
    this.logger.log(`Creating load template for user ${userId}`);

    try {
      // For now, we'll store templates in a simple format
      // In a production system, you'd want a proper LoadTemplate entity
      const template = {
        id: `template_${Date.now()}`,
        name: templateData.name || 'Default Template',
        description: templateData.description || '',
        data: {
          cargoType: templateData.cargoType || 'GENERAL',
          weight: templateData.weight || 1000,
          volume: templateData.volume || 10,
          isFragile: templateData.isFragile || false,
          isHazardous: templateData.isHazardous || false,
          requiresRefrigeration: templateData.requiresRefrigeration || false,
          urgencyLevel: templateData.urgencyLevel || 'NORMAL',
          packagingType: this.normalizePackagingType(
            templateData.packagingType,
          ),
          numberOfPieces: templateData.numberOfPieces || 1,
          numberOfPallets: templateData.numberOfPallets || 1,
          requiresForklift: templateData.requiresForklift || false,
          requiresLoadingDock: templateData.requiresLoadingDock || false,
          loadingTimeEstimate: templateData.loadingTimeEstimate || 1,
          unloadingTimeEstimate: templateData.unloadingTimeEstimate || 1,
          specialHandlingInstructions:
            templateData.specialHandlingInstructions || '',
          loadingInstructions: templateData.loadingInstructions || '',
          unloadingInstructions: templateData.unloadingInstructions || '',
          truckRequirements: templateData.truckRequirements || {},
          carrierPreferences: templateData.carrierPreferences || {},
          costPreferences: templateData.costPreferences || {},
        },
        createdBy: userId,
        tenantId,
        createdAt: new Date(),
      };

      this.logger.log(`Created load template ${template.id} successfully`);
      return template;
    } catch (error) {
      this.logger.error(
        `Failed to create load template: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get all load templates for a user
   */
  async getTemplates(userId: string, tenantId: string): Promise<any[]> {
    this.logger.log(`Getting load templates for user ${userId}`);

    try {
      // For now, return mock templates
      // In a production system, you'd query the LoadTemplate entity
      const templates = [
        {
          id: 'template_1',
          name: 'Standard Electronics',
          description: 'Template for fragile electronics shipments',
          data: {
            cargoType: 'FRAGILE',
            weight: 500,
            volume: 5,
            isFragile: true,
            isHazardous: false,
            requiresRefrigeration: false,
            urgencyLevel: 'HIGH',
            packagingType: this.normalizePackagingType('BOXES'),
            numberOfPieces: 10,
            numberOfPallets: 1,
            requiresForklift: true,
            requiresLoadingDock: true,
            loadingTimeEstimate: 2,
            unloadingTimeEstimate: 2,
            specialHandlingInstructions: 'Handle with care, keep upright',
            loadingInstructions: 'Load from rear, secure with straps',
            unloadingInstructions: 'Unload carefully, check for damage',
          },
          createdBy: userId,
          tenantId,
          createdAt: new Date(),
        },
        {
          id: 'template_2',
          name: 'Heavy Machinery',
          description: 'Template for heavy machinery and equipment',
          data: {
            cargoType: 'HEAVY_MACHINERY',
            weight: 5000,
            volume: 50,
            isFragile: false,
            isHazardous: false,
            requiresRefrigeration: false,
            urgencyLevel: 'NORMAL',
            packagingType: this.normalizePackagingType('CRATES'),
            numberOfPieces: 1,
            numberOfPallets: 5,
            requiresForklift: true,
            requiresCrane: true,
            requiresLoadingDock: true,
            loadingTimeEstimate: 4,
            unloadingTimeEstimate: 4,
            specialHandlingInstructions: 'Requires crane for loading/unloading',
            loadingInstructions: 'Use crane, secure with heavy-duty straps',
            unloadingInstructions: 'Use crane, check equipment condition',
          },
          createdBy: userId,
          tenantId,
          createdAt: new Date(),
        },
      ];

      this.logger.log(
        `Retrieved ${templates.length} templates for user ${userId}`,
      );
      return templates;
    } catch (error) {
      this.logger.error(
        `Failed to get load templates: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create a new load from a template
   */
  async useTemplate(
    templateId: string,
    overrideData: any,
    userId: string,
    tenantId: string,
  ): Promise<Load> {
    this.logger.log(
      `Using template ${templateId} to create load for user ${userId}`,
    );

    try {
      // Get the template (in production, query the database)
      const templates = await this.getTemplates(userId, tenantId);
      const template = templates.find((t) => t.id === templateId);

      if (!template) {
        throw new NotFoundException('Template not found');
      }

      // Merge template data with override data
      const loadData = {
        ...template.data,
        ...overrideData,
        tenantId,
        cargoOwnerId: userId,
        title: overrideData.title || `Load from ${template.name}`,
        description: overrideData.description || template.description,
        locations: overrideData.locations || template.data?.locations || [],
        pickupDate: overrideData.pickupDate
          ? new Date(overrideData.pickupDate)
          : template.data?.pickupDate
            ? new Date(template.data.pickupDate)
            : new Date(),
        deliveryDate: overrideData.deliveryDate
          ? new Date(overrideData.deliveryDate)
          : template.data?.deliveryDate
            ? new Date(template.data.deliveryDate)
            : new Date(),
        status: LoadStatus.DRAFT,
      };

      console.log('📋 Merged load data:', {
        hasLocations: !!loadData.locations && loadData.locations.length > 0,
        locationsCount: loadData.locations?.length || 0,
        hasPickupDate: !!loadData.pickupDate,
        hasDeliveryDate: !!loadData.deliveryDate,
        title: loadData.title,
      });

      // Validate the merged data
      if (!loadData.locations || loadData.locations.length < 2) {
        console.error('❌ Template validation failed: insufficient locations');
        throw new BadRequestException(
          'At least pickup and delivery locations are required. Please provide locations in the override data.',
        );
      }

      // Validate dates
      if (loadData.pickupDate && loadData.deliveryDate) {
        if (loadData.pickupDate > loadData.deliveryDate) {
          throw new BadRequestException(
            'Delivery date cannot be before pickup date',
          );
        }
      }

      // Create the load using the existing create method
      console.log('💾 Creating load from template...');
      const load = await this.create(loadData, userId, tenantId);

      this.logger.log(
        `Created load ${load.id} from template ${templateId} successfully`,
      );

      // Note: enrichedLocations are not required for basic functionality
      // They are optional and can be added later if needed
      // The frontend should handle missing enrichedLocations gracefully

      return load;
    } catch (error) {
      this.logger.error(
        `Failed to use template ${templateId}: ${error.message}`,
        error.stack,
      );

      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw new InternalServerErrorException({
        message: 'Failed to create load from template',
        error: error.message || 'An unexpected error occurred',
        details:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  /**
   * Get cargo with enriched location data
   */
  async getCargoWithEnrichedLocations(
    cargoId: string,
  ): Promise<EnrichedCargoResponse> {
    const cargo = await this.loadRepository.findOne({
      where: { id: cargoId },
      relations: ['cargoOwner'],
    });

    if (!cargo) {
      throw new NotFoundException(`Cargo with ID ${cargoId} not found`);
    }

    const enrichedLocations =
      await this.locationEnrichmentService.enrichCargoLocations(cargo);

    const cargoWithEnrichedLocations: EnrichedCargo = {
      ...cargo,
      enrichedLocations,
    };

    return {
      cargo: cargoWithEnrichedLocations,
      enrichedLocations,
    };
  }

  /**
   * Get all cargos with enriched location data
   */
  async getAllCargosWithEnrichedLocations(
    tenantId: string,
  ): Promise<EnrichedCargosResponse> {
    const cargos = await this.loadRepository.find({
      where: { tenantId },
      relations: ['cargoOwner'],
    });

    const enrichedLocationsMap =
      await this.locationEnrichmentService.batchEnrichCargoLocations(cargos);

    // Merge enriched locations into each cargo object for frontend compatibility
    const cargosWithEnrichedLocations: EnrichedCargo[] = cargos.map((cargo) => {
      const enrichedLocations = enrichedLocationsMap.get(cargo.id) || [];
      return {
        ...cargo,
        enrichedLocations, // Attach enriched locations directly to cargo object
      };
    });

    return {
      cargos: cargosWithEnrichedLocations,
      enrichedLocationsMap,
    };
  }

  /**
   * Create cargo with automatic location enrichment
   */
  async createCargoWithEnrichedLocations(
    cargoData: any,
    tenantId: string,
  ): Promise<EnrichedCargoResponse> {
    // Create the cargo first
    const cargo = await this.loadRepository.save({
      ...cargoData,
      tenantId,
    });

    // Enrich the locations
    const enrichedLocations =
      await this.locationEnrichmentService.enrichCargoLocations(cargo);

    // Update the cargo with enriched location data
    const updatedCargo = await this.loadRepository.save({
      ...cargo,
      locations: enrichedLocations.map((enriched) => ({
        ...enriched,
        locationData: {
          ...enriched.locationData,
          // Keep original coordinates but add enriched data
          coordinates: enriched.locationData.coordinates,
          // Add enriched fields
          city: enriched.locationData.city,
          state: enriched.locationData.state,
          country: enriched.locationData.country,
          locationCategory: enriched.locationData.locationCategory,
          locationSubCategory: enriched.locationData.locationSubCategory,
          businessHours: enriched.locationData.businessHours,
          timezone: enriched.locationData.timezone,
          accessType: enriched.locationData.accessType,
          parkingAvailable: enriched.locationData.parkingAvailable,
          securityLevel: enriched.locationData.securityLevel,
          loadingDockCount: enriched.locationData.loadingDockCount,
          maxTruckHeight: enriched.locationData.maxTruckHeight,
          maxTruckWeight: enriched.locationData.maxTruckWeight,
          specialInstructions: enriched.locationData.specialInstructions,
          distanceFromHighway: enriched.locationData.distanceFromHighway,
          trafficPattern: enriched.locationData.trafficPattern,
          bestAccessTime: enriched.locationData.bestAccessTime,
          restrictions: enriched.locationData.restrictions,
        },
      })),
    });

    return {
      cargo: updatedCargo,
      enrichedLocations,
    };
  }

  /**
   * Get location suggestions for cargo creation
   */
  async getLocationSuggestionsForCargo(
    coordinates: { latitude: number; longitude: number },
    locationType: 'PICKUP' | 'DELIVERY' | 'STOP',
  ) {
    return this.locationEnrichmentService.getLocationSuggestions(
      coordinates,
      locationType,
    );
  }

  /**
   * Analyze cargo route with enriched location data
   */
  async analyzeCargoRoute(cargoId: string): Promise<{
    cargo: EnrichedCargo;
    enrichedLocations: EnrichedLocation[];
    routeAnalysis: {
      totalDistance: number;
      estimatedDuration: number;
      restrictions: string[];
      optimalSchedule: {
        pickupTime: string;
        deliveryTime: string;
        stops: Array<{
          locationId: string;
          name: string;
          bestAccessTime: string;
          restrictions: string[];
        }>;
      };
    };
  }> {
    const { cargo, enrichedLocations } =
      await this.getCargoWithEnrichedLocations(cargoId);

    // Analyze route based on enriched location data
    const routeAnalysis = this.analyzeRouteWithEnrichedData(enrichedLocations);

    return {
      cargo,
      enrichedLocations,
      routeAnalysis,
    };
  }

  /**
   * Analyze route using enriched location data
   */
  private analyzeRouteWithEnrichedData(enrichedLocations: EnrichedLocation[]): {
    totalDistance: number;
    estimatedDuration: number;
    restrictions: string[];
    optimalSchedule: {
      pickupTime: string;
      deliveryTime: string;
      stops: Array<{
        locationId: string;
        name: string;
        bestAccessTime: string;
        restrictions: string[];
      }>;
    };
  } {
    // Calculate total distance (simplified)
    const totalDistance = enrichedLocations.length * 50; // 50km per location

    // Calculate estimated duration based on traffic patterns
    let estimatedDuration = 0;
    const allRestrictions: string[] = [];

    enrichedLocations.forEach((location) => {
      // Add time based on traffic pattern
      switch (location.locationData.trafficPattern) {
        case 'HIGH':
          estimatedDuration += 2; // 2 hours for high traffic
          break;
        case 'MODERATE':
          estimatedDuration += 1.5; // 1.5 hours for moderate traffic
          break;
        case 'LOW':
          estimatedDuration += 1; // 1 hour for low traffic
          break;
      }

      // Add restrictions
      allRestrictions.push(...location.locationData.restrictions);
    });

    // Create optimal schedule
    const pickupLocation = enrichedLocations.find((l) => l.type === 'PICKUP');
    const deliveryLocation = enrichedLocations.find(
      (l) => l.type === 'DELIVERY',
    );

    const optimalSchedule = {
      pickupTime: pickupLocation?.locationData.bestAccessTime || '8AM-10AM',
      deliveryTime: deliveryLocation?.locationData.bestAccessTime || '2PM-4PM',
      stops: enrichedLocations.map((location) => ({
        locationId: location.id,
        name: location.locationData.name,
        bestAccessTime: location.locationData.bestAccessTime,
        restrictions: location.locationData.restrictions,
      })),
    };

    return {
      totalDistance,
      estimatedDuration,
      restrictions: [...new Set(allRestrictions)], // Remove duplicates
      optimalSchedule,
    };
  }

  /**
   * Get cargo compatibility with trucks based on enriched location data
   */
  async getCargoTruckCompatibility(
    cargoId: string,
    truckData: any,
  ): Promise<{
    isCompatible: boolean;
    score: number;
    issues: string[];
    locationCompatibility: Array<{
      locationId: string;
      locationName: string;
      isCompatible: boolean;
      issues: string[];
    }>;
  }> {
    const { enrichedLocations } =
      await this.getCargoWithEnrichedLocations(cargoId);

    const locationCompatibility = enrichedLocations.map((location) => {
      const issues: string[] = [];
      let isCompatible = true;

      // Check truck height constraints
      if (truckData.height > location.locationData.maxTruckHeight) {
        issues.push(
          `Truck height (${truckData.height}m) exceeds location limit (${location.locationData.maxTruckHeight}m)`,
        );
        isCompatible = false;
      }

      // Check weight constraints
      if (truckData.capacityWeight > location.locationData.maxTruckWeight) {
        issues.push(
          `Truck weight (${truckData.capacityWeight} tons) exceeds location limit (${location.locationData.maxTruckWeight} tons)`,
        );
        isCompatible = false;
      }

      // Check access type compatibility
      if (
        location.locationData.accessType === 'FORKLIFT_REQUIRED' &&
        !truckData.hasForklift
      ) {
        issues.push("Location requires forklift but truck doesn't have one");
        isCompatible = false;
      }

      if (
        location.locationData.accessType === 'CRANE_REQUIRED' &&
        !truckData.hasCrane
      ) {
        issues.push("Location requires crane but truck doesn't have one");
        isCompatible = false;
      }

      // Check security requirements
      if (
        location.locationData.securityLevel === 'HIGH_SECURITY' &&
        !truckData.hasSecurityClearance
      ) {
        issues.push(
          "Location requires security clearance but truck doesn't have it",
        );
        isCompatible = false;
      }

      return {
        locationId: location.id,
        locationName: location.locationData.name,
        isCompatible,
        issues,
      };
    });

    const overallCompatibility = locationCompatibility.every(
      (loc) => loc.isCompatible,
    );
    const totalIssues = locationCompatibility.reduce(
      (sum, loc) => sum + loc.issues.length,
      0,
    );
    const score = Math.max(0, 100 - totalIssues * 10);

    return {
      isCompatible: overallCompatibility,
      score,
      issues: locationCompatibility.flatMap((loc) => loc.issues),
      locationCompatibility,
    };
  }

  // ===== DRAFT CARGO MANAGEMENT SERVICE METHODS =====

  /**
   * Save cargo as draft with relaxed validation
   */
  async saveAsDraft(
    createLoadDto: CreateLoadDto,
    userId: string,
  ): Promise<LoadResponseDto> {
    this.logger.log('Service: Starting save as draft...');

    try {
      // Get tenant ID from user
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      const tenantId = user.tenantId;

      // Create draft load with minimal validation
      const loadData = {
        ...createLoadDto,
        tenantId,
        cargoOwnerId: userId,
        status: LoadStatus.DRAFT,
        // Set default values for required fields to allow partial saves
        urgencyLevel: createLoadDto.urgencyLevel || UrgencyLevel.NORMAL,
        cargoType: createLoadDto.cargoType || CargoType.GENERAL,
        loadType: createLoadDto.loadType || LoadType.FTL,
        equipmentType: createLoadDto.equipmentType || EquipmentType.DRY_VAN,
        visibility: createLoadDto.visibility || Visibility.PRIVATE, // Drafts are private by default
        unitsRequired: createLoadDto.unitsRequired || 1,
        paymentTerms: createLoadDto.paymentTerms || PaymentTerms.NET_30,
        packagingType: this.normalizePackagingType(
          createLoadDto.packagingType as any,
        ),
        contactInfo: createLoadDto.contactInfo || {},
        autoMatchEnabled: false, // Drafts don't auto-match
        matchingCriteria: createLoadDto.matchingCriteria || {},
        truckRequirements: createLoadDto.truckRequirements || {},
        carrierPreferences: createLoadDto.carrierPreferences || {},
        costPreferences: createLoadDto.costPreferences || {},
        isStackable: createLoadDto.isStackable || false,
        requiresHumidityControl: createLoadDto.requiresHumidityControl || false,
        requiresForklift: createLoadDto.requiresForklift || false,
        requiresCrane: createLoadDto.requiresCrane || false,
        requiresLoadingDock: createLoadDto.requiresLoadingDock || false,
        isTimeCritical: createLoadDto.isTimeCritical || false,
        requiresGpsMonitoring: createLoadDto.requiresGpsMonitoring || false,
        requiresTemperatureMonitoring:
          createLoadDto.requiresTemperatureMonitoring || false,
        requiresLowClearanceRoute:
          createLoadDto.requiresLowClearanceRoute || false,
        requiresEscortVehicle: createLoadDto.requiresEscortVehicle || false,
        requiresPreShipmentInspection:
          createLoadDto.requiresPreShipmentInspection || false,
        requiresDeliveryInspection:
          createLoadDto.requiresDeliveryInspection || false,
        requiresPhotographicDocumentation:
          createLoadDto.requiresPhotographicDocumentation || false,
        numberOfPieces: createLoadDto.numberOfPieces || 0,
        numberOfPallets: createLoadDto.numberOfPallets || 0,
        rating: 0,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.logger.log(
        'Draft load data prepared:',
        JSON.stringify(loadData, null, 2),
      );

      const load = this.loadRepository.create(loadData as any);
      const savedLoad = (await this.loadRepository.save(
        load,
      )) as unknown as Load;

      this.logger.log(`Draft load ${savedLoad.id} saved successfully`);

      // Create audit event
      await this.createAuditEvent({
        loadId: savedLoad.id,
        entityType: AuditEntityType.LOAD,
        action: AuditAction.CREATE,
        actorId: userId,
        description: 'Cargo saved as draft',
      });

      return this.transformLoadToResponse(savedLoad);
    } catch (error) {
      this.logger.error('Error saving draft:', error);
      throw error;
    }
  }

  /**
   * Update existing cargo draft
   */
  async updateDraft(
    id: string,
    updateLoadDto: UpdateLoadDto,
    userId: string,
  ): Promise<LoadResponseDto> {
    this.logger.log('Service: Starting update draft...');

    try {
      // Find the draft load
      const load = await this.loadRepository.findOne({
        where: { id, cargoOwnerId: userId },
        relations: ['cargoOwner', 'locations'],
      });

      if (!load) {
        throw new HttpException('Draft cargo not found', HttpStatus.NOT_FOUND);
      }

      // Ensure it's a draft
      if (load.status !== LoadStatus.DRAFT) {
        throw new HttpException(
          'Cannot update published cargo as draft. Use regular update endpoint.',
          HttpStatus.FORBIDDEN,
        );
      }

      // Update the load with new data
      const updatedLoad = {
        ...load,
        ...updateLoadDto,
        updatedAt: new Date(),
      };

      const savedLoad = await this.loadRepository.save(updatedLoad);

      this.logger.log(`Draft load ${id} updated successfully`);

      // Create audit event
      await this.createAuditEvent({
        loadId: id,
        entityType: AuditEntityType.LOAD,
        action: AuditAction.UPDATE,
        actorId: userId,
        description: 'Cargo draft updated',
      });

      return this.transformLoadToResponse(savedLoad);
    } catch (error) {
      this.logger.error('Error updating draft:', error);
      throw error;
    }
  }

  /**
   * Get user's draft cargo with pagination
   */
  async getUserDrafts(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<LoadsPaginatedResponse> {
    this.logger.log('Service: Getting user drafts...');

    try {
      const skip = (page - 1) * limit;

      const [drafts, total] = await this.loadRepository.findAndCount({
        where: {
          cargoOwnerId: userId,
          status: LoadStatus.DRAFT,
        },
        relations: ['cargoOwner', 'locations'],
        order: { updatedAt: 'DESC' },
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      this.logger.log(`Found ${drafts.length} draft loads for user ${userId}`);

      return {
        items: drafts.map((draft) => this.transformLoadToResponse(draft)),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      this.logger.error('Error getting user drafts:', error);
      throw error;
    }
  }

  /**
   * Move draft cargo to created status (ready for matching/publishing)
   */
  async publishDraft(id: string, userId: string): Promise<LoadResponseDto> {
    this.logger.log('Service: Starting publish draft...');

    try {
      // Find the draft load
      const load = await this.loadRepository.findOne({
        where: { id, cargoOwnerId: userId },
        relations: ['cargoOwner', 'locations'],
      });

      if (!load) {
        throw new HttpException('Draft cargo not found', HttpStatus.NOT_FOUND);
      }

      // Ensure it's a draft
      if (load.status !== LoadStatus.DRAFT) {
        throw new HttpException(
          'Only draft cargo can be moved to created status',
          HttpStatus.FORBIDDEN,
        );
      }

      // Validate required fields for publishing
      const validationErrors = this.validateLoadForPublishing(load);
      if (validationErrors.length > 0) {
        throw new HttpException(
          `Cannot move draft to created status: ${validationErrors.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Update status to created (ready for matching/publishing)
      const updatedLoad = {
        ...load,
        status: LoadStatus.CREATED,
        publishedAt: new Date(),
        updatedAt: new Date(),
        visibility: Visibility.PUBLIC, // Make visible to truck owners
        autoMatchEnabled: true, // Enable auto-matching for created cargo
      };

      const savedLoad = await this.loadRepository.save(updatedLoad);

      this.logger.log(`Draft load ${id} moved to created status successfully`);

      // Create audit event
      await this.createAuditEvent({
        loadId: id,
        entityType: AuditEntityType.LOAD,
        action: AuditAction.STATUS_CHANGE,
        actorId: userId,
        description: 'Cargo draft moved to created status',
      });

      // Trigger notifications to relevant truck owners
      await this.notifyTruckOwnersForNewLoad(savedLoad);

      return this.transformLoadToResponse(savedLoad);
    } catch (error) {
      this.logger.error('Error publishing draft:', error);
      throw error;
    }
  }

  /**
   * Delete cargo draft
   */
  async deleteDraft(id: string, userId: string): Promise<void> {
    this.logger.log('Service: Starting delete draft...');

    try {
      // Find the draft load
      const load = await this.loadRepository.findOne({
        where: { id, cargoOwnerId: userId },
      });

      if (!load) {
        throw new HttpException('Draft cargo not found', HttpStatus.NOT_FOUND);
      }

      // Ensure it's a draft
      if (load.status !== LoadStatus.DRAFT) {
        throw new HttpException(
          'Only draft cargo can be deleted',
          HttpStatus.FORBIDDEN,
        );
      }

      // Delete the load
      await this.loadRepository.remove(load);

      this.logger.log(`Draft load ${id} deleted successfully`);

      // Create audit event
      await this.createAuditEvent({
        loadId: id,
        entityType: AuditEntityType.LOAD,
        action: AuditAction.DELETE,
        actorId: userId,
        description: 'Cargo draft deleted',
      });
    } catch (error) {
      this.logger.error('Error deleting draft:', error);
      throw error;
    }
  }

  /**
   * Validate load for publishing
   */
  private validateLoadForPublishing(load: Load): string[] {
    const errors: string[] = [];

    // Check required basic fields
    if (!load.title || load.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!load.description || load.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (!load.weight || load.weight <= 0) {
      errors.push('Valid weight is required');
    }

    if (!load.volume || load.volume <= 0) {
      errors.push('Valid volume is required');
    }

    // Check locations
    if (!load.locations || load.locations.length === 0) {
      errors.push('At least one pickup and delivery location is required');
    } else {
      const pickupLocations = load.locations.filter(
        (loc) => loc.type === 'PICKUP',
      );
      const deliveryLocations = load.locations.filter(
        (loc) => loc.type === 'DELIVERY',
      );

      if (pickupLocations.length === 0) {
        errors.push('At least one pickup location is required');
      }

      if (deliveryLocations.length === 0) {
        errors.push('At least one delivery location is required');
      }
    }

    // Check dates
    if (!load.pickupDate) {
      errors.push('Pickup date is required');
    }

    if (!load.deliveryDate) {
      errors.push('Delivery date is required');
    }

    // Validate: delivery date cannot be before pickup date
    // Pickup date can be the same as delivery date (same-day delivery)
    if (
      load.pickupDate &&
      load.deliveryDate &&
      load.pickupDate > load.deliveryDate
    ) {
      errors.push('Delivery date cannot be before pickup date');
    }

    return errors;
  }

  /**
   * Transform Load entity to LoadResponseDto
   */
  private transformLoadToResponse(load: Load): LoadResponseDto {
    return {
      id: load.id,
      title: load.title,
      description: load.description,
      weight: load.weight,
      volume: load.volume,
      cargoType: load.cargoType,

      status: load.status,
      urgencyLevel: load.urgencyLevel,
      isTimeCritical: load.isTimeCritical,
      isFragile: load.isFragile,
      isHazardous: load.isHazardous,
      requiresRefrigeration: load.requiresRefrigeration,
      pickupDate: load.pickupDate,
      deliveryDate: load.deliveryDate,
      loadValue: load.loadValue,
      offeredPrice: load.offeredPrice,
      currencyCode: load.currencyCode,

      requiresGpsMonitoring: load.requiresGpsMonitoring,
      requiresTemperatureMonitoring: load.requiresTemperatureMonitoring,
      requiresLowClearanceRoute: load.requiresLowClearanceRoute,
      requiresEscortVehicle: load.requiresEscortVehicle,
      requiresPreShipmentInspection: load.requiresPreShipmentInspection,
      requiresDeliveryInspection: load.requiresDeliveryInspection,
      requiresPhotographicDocumentation: load.requiresPhotographicDocumentation,

      loadingInstructions: load.loadingInstructions,
      unloadingInstructions: load.unloadingInstructions,
      insuranceValue: load.insuranceValue,
      emergencyContactInfo: load.emergencyContactInfo,
      maxClearanceHeight: load.maxClearanceHeight,

      publishedAt: load.publishedAt,
      createdAt: load.createdAt,
      updatedAt: load.updatedAt,
      cargoOwner: load.cargoOwner
        ? {
            id: load.cargoOwner.id,
            email: load.cargoOwner.email,
            profile: load.cargoOwner.profile,
          }
        : undefined,
      pickupLocation: load.pickupLocation
        ? {
            id: load.pickupLocation.id,
            name: load.pickupLocation.locationData.name,
            address: load.pickupLocation.locationData.address,
            coordinates: {
              type: 'Point',
              coordinates: [
                load.pickupLocation.locationData.coordinates.longitude,
                load.pickupLocation.locationData.coordinates.latitude,
              ],
            },
          }
        : undefined,
      deliveryLocation: load.deliveryLocation
        ? {
            id: load.deliveryLocation.id,
            name: load.deliveryLocation.locationData.name,
            address: load.deliveryLocation.locationData.address,
            coordinates: {
              type: 'Point',
              coordinates: [
                load.deliveryLocation.locationData.coordinates.longitude,
                load.deliveryLocation.locationData.coordinates.latitude,
              ],
            },
          }
        : undefined,
    };
  }

  /**
   * Notify truck owners about new published load
   */
  private async notifyTruckOwnersForNewLoad(load: Load): Promise<void> {
    try {
      // This would integrate with your notification system
      // For now, we'll just log the notification
      this.logger.log(
        `Notifying truck owners about new published load: ${load.id}`,
      );

      // TODO: Implement actual notification logic
      // - Find relevant truck owners based on location and equipment
      // - Send notifications via email, SMS, or in-app
      // - Include load details and bidding instructions
    } catch (error) {
      this.logger.error('Error notifying truck owners:', error);
      // Don't fail the publish operation if notifications fail
    }
  }
}
