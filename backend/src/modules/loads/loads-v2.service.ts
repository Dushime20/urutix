import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  SelectQueryBuilder,
  Between,
  In,
  Not,
  IsNull,
} from 'typeorm';
import {
  CreateLoadV2Dto,
  UpdateLoadV2Dto,
  LoadQueryV2Dto,
  LoadStatusV2,
  CargoTypeV2,
  UrgencyLevelV2,
  PaginatedResponseV2,
} from './dto/load-v2.dto';
import { LoadResponseV2Dto } from './dto/load-response-v2.dto';
import {
  Load,
  LoadStatus,
  CargoType,
  UrgencyLevel,
} from '../../entities/load.entity';
import { User } from '../../entities/user.entity';
import { Location } from '../../entities/location.entity';
import { Truck } from '../../entities/truck.entity';
import { Driver } from '../../entities/driver.entity';
import { LoanRequest } from '../../entities/LoanRequest';
import { Lender } from '../../entities/Lender';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoadValidationV2Service } from './services/load-validation-v2.service';

@Injectable()
export class LoadsV2Service {
  private readonly logger = new Logger(LoadsV2Service.name);

  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(LoanRequest)
    private readonly loanRequestRepository: Repository<LoanRequest>,
    @InjectRepository(Lender)
    private readonly lenderRepository: Repository<Lender>,
    private readonly eventEmitter: EventEmitter2,
    private readonly loadValidationService: LoadValidationV2Service,
  ) {}

  /**
   * Create a new load
   */
  async create(
    createLoadDto: CreateLoadV2Dto,
    user: User,
  ): Promise<LoadResponseV2Dto> {
    try {
      // Validate user permissions
      this.validateUserPermissions(user, 'create');

      // Validate load data
      await this.loadValidationService.validateLoadData(createLoadDto);

      // Check if pickup and delivery dates are valid
      this.validateDates(createLoadDto.pickupDate, createLoadDto.deliveryDate);

      // Verify locations exist
      await this.validateLocations(
        createLoadDto.pickupLocationId,
        createLoadDto.deliveryLocationId,
      );

      // Map V2 DTO to entity format
      const loadData: Partial<Load> = {
        ...createLoadDto,
        tenantId: user.tenantId,
        cargoOwnerId: user.id,
        status: LoadStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Convert string dates to Date objects
        pickupDate: createLoadDto.pickupDate
          ? new Date(createLoadDto.pickupDate)
          : undefined,
        deliveryDate: createLoadDto.deliveryDate
          ? new Date(createLoadDto.deliveryDate)
          : undefined,
        // Map V2 enums to entity enums
        cargoType: this.mapCargoTypeV2ToEntity(createLoadDto.cargoType),
        urgencyLevel: this.mapUrgencyLevelV2ToEntity(
          createLoadDto.urgencyLevel,
        ),
        // Convert string enums to entity enums
        packagingType: createLoadDto.packagingType as any,
      };

      // Create the load entity - ensure we get a single entity, not an array
      const load = this.loadRepository.create(loadData);
      const savedLoad = await this.loadRepository.save(load);

      // Emit load created event
      this.eventEmitter.emit('load.v2.created', {
        loadId: savedLoad.id,
        userId: user.id,
        tenantId: savedLoad.tenantId,
      });

      this.logger.log(`Load created: ${savedLoad.id} by user: ${user.id}`);

      return this.mapToResponseDto(savedLoad);
    } catch (error) {
      this.logger.error(`Failed to create load: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to create load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Find all loads with filtering and pagination
   * OPTIMIZED: Added eager loading to prevent N+1 query problems
   */
  async findAll(
    queryDto: LoadQueryV2Dto,
    user: User,
  ): Promise<PaginatedResponseV2<LoadResponseV2Dto>> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        ...filters
      } = queryDto;

      // Enforce maximum limit to prevent performance issues
      const MAX_LIMIT = 100;
      const safeLimit = Math.min(limit, MAX_LIMIT);

      const queryBuilder = this.loadRepository.createQueryBuilder('load');

      // Add eager loading to prevent N+1 queries
      queryBuilder
        .leftJoinAndSelect('load.cargoOwner', 'cargoOwner')
        .leftJoinAndSelect('cargoOwner.profile', 'cargoOwnerProfile')
        .leftJoinAndSelect('load.broker', 'broker')
        .leftJoinAndSelect('broker.profile', 'brokerProfile');

      // Apply tenant filtering
      this.applyTenantFilter(queryBuilder, user);

      // Apply filters
      this.applyFilters(queryBuilder, filters);

      // Apply sorting
      queryBuilder.orderBy(`load.${sortBy}`, sortOrder);

      // Apply pagination
      const skip = (page - 1) * safeLimit;
      queryBuilder.skip(skip).take(safeLimit);

      const [loads, total] = await queryBuilder.getManyAndCount();

      const totalPages = Math.ceil(total / safeLimit);

      return {
        data: loads.map((load) => this.mapToResponseDto(load)),
        meta: {
          total,
          page,
          limit: safeLimit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to find loads: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to retrieve loads',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Find published loads
   */
  async findPublished(
    queryDto: LoadQueryV2Dto,
    user: User,
  ): Promise<PaginatedResponseV2<LoadResponseV2Dto>> {
    const publishedQuery = { ...queryDto, status: LoadStatusV2.PUBLISHED };
    return this.findAll(publishedQuery, user);
  }

  /**
   * Find loads by user
   */
  async findByUser(
    queryDto: LoadQueryV2Dto,
    user: User,
  ): Promise<PaginatedResponseV2<LoadResponseV2Dto>> {
    const userQuery = { ...queryDto, cargoOwnerId: user.id };
    return this.findAll(userQuery, user);
  }

  /**
   * Get loads assigned to truck owner's trucks
   */
  async getAssignedLoadsForTruckOwner(
    queryDto: LoadQueryV2Dto,
    user: User,
  ): Promise<PaginatedResponseV2<LoadResponseV2Dto>> {
    try {
      // Get all trucks owned by this truck owner
      const trucks = await this.truckRepository.find({
        where: { ownerId: user.id, tenantId: user.tenantId },
        select: ['id'],
      });

      if (trucks.length === 0) {
        return {
          data: [],
          meta: {
            total: 0,
            page: queryDto.page || 1,
            limit: queryDto.limit || 20,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }

      const truckIds = trucks.map((truck) => truck.id);

      const {
        page = 1,
        limit = 20,
        sortBy = 'pickupDate',
        sortOrder = 'ASC',
        status,
      } = queryDto;

      const queryBuilder = this.loadRepository.createQueryBuilder('load');

      // Apply tenant filtering
      this.applyTenantFilter(queryBuilder, user);

      // Filter by assigned trucks
      queryBuilder.andWhere('load.assignedTruckId IN (:...truckIds)', {
        truckIds,
      });

      // Filter by status if provided, otherwise show ASSIGNED and IN_TRANSIT
      if (status) {
        queryBuilder.andWhere('load.status = :status', { status });
      } else {
        queryBuilder.andWhere('load.status IN (:...statuses)', {
          statuses: [LoadStatus.ASSIGNED, LoadStatus.IN_TRANSIT],
        });
      }

      // Apply sorting
      queryBuilder.orderBy(`load.${sortBy}`, sortOrder);

      // Apply pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      // Load relations
      queryBuilder.leftJoinAndSelect('load.cargoOwner', 'cargoOwner');
      queryBuilder.leftJoinAndSelect('cargoOwner.profile', 'cargoOwnerProfile');

      const [loads, total] = await queryBuilder.getManyAndCount();

      const totalPages = Math.ceil(total / limit);

      return {
        data: loads.map((load) => this.mapToResponseDto(load)),
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get assigned loads for truck owner ${user.id}: ${error.message}`,
      );
      throw new HttpException(
        error.message || 'Failed to retrieve assigned loads',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Search loads with advanced criteria
   * OPTIMIZED: Added eager loading to prevent N+1 query problems
   */
  async searchLoads(
    searchParams: Record<string, unknown>,
    user: User,
  ): Promise<PaginatedResponseV2<LoadResponseV2Dto>> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        search,
        status,
        cargoType,
        pickupLocationId,
        deliveryLocationId,
        minWeight,
        maxWeight,
        pickupDateFrom,
        pickupDateTo,
      } = searchParams;

      // Enforce maximum limit to prevent performance issues
      const MAX_LIMIT = 100;
      const pageNum = page as number;
      const limitNum = Math.min(limit as number, MAX_LIMIT);
      const sortByStr = sortBy as string;
      const sortOrderStr = sortOrder as 'ASC' | 'DESC';

      const queryBuilder = this.loadRepository.createQueryBuilder('load');

      // Add eager loading to prevent N+1 queries
      queryBuilder
        .leftJoinAndSelect('load.cargoOwner', 'cargoOwner')
        .leftJoinAndSelect('cargoOwner.profile', 'cargoOwnerProfile')
        .leftJoinAndSelect('load.broker', 'broker')
        .leftJoinAndSelect('broker.profile', 'brokerProfile');

      // Apply tenant filtering
      this.applyTenantFilter(queryBuilder, user);

      // Apply search filters
      if (search) {
        queryBuilder.andWhere(
          '(load.title ILIKE :search OR load.description ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      if (status) {
        queryBuilder.andWhere('load.status = :status', { status });
      }

      if (cargoType) {
        queryBuilder.andWhere('load.cargoType = :cargoType', { cargoType });
      }

      if (pickupLocationId) {
        queryBuilder.andWhere('load.pickupLocationId = :pickupLocationId', {
          pickupLocationId,
        });
      }

      if (deliveryLocationId) {
        queryBuilder.andWhere('load.deliveryLocationId = :deliveryLocationId', {
          deliveryLocationId,
        });
      }

      if (minWeight) {
        queryBuilder.andWhere('load.weight >= :minWeight', { minWeight });
      }

      if (maxWeight) {
        queryBuilder.andWhere('load.weight <= :maxWeight', { maxWeight });
      }

      if (pickupDateFrom) {
        queryBuilder.andWhere('load.pickupDate >= :pickupDateFrom', {
          pickupDateFrom,
        });
      }

      if (pickupDateTo) {
        queryBuilder.andWhere('load.pickupDate <= :pickupDateTo', {
          pickupDateTo,
        });
      }

      // Apply sorting
      queryBuilder.orderBy(`load.${sortByStr}`, sortOrderStr);

      // Apply pagination
      const skip = (pageNum - 1) * limitNum;
      queryBuilder.skip(skip).take(limitNum);

      const [loads, total] = await queryBuilder.getManyAndCount();

      const totalPages = Math.ceil(total / limitNum);

      return {
        data: loads.map((load) => this.mapToResponseDto(load)),
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to search loads: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to search loads',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Find one load by ID
   */
  async findOne(id: string, user: User): Promise<LoadResponseV2Dto> {
    try {
      this.logger.log(`Finding load ${id} for user ${user?.id} with role ${user?.role}`);
      const load = await this.findLoadEntity(id, user);
      const response = this.mapToResponseDto(load);
      this.logger.log(`Successfully found and mapped load ${id}`);
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to find load ${id} for user ${user?.id}: ${error.message}`,
        error.stack,
      );
      
      // If it's already an HttpException, re-throw it
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Failed to retrieve load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update a load
   */
  async update(
    id: string,
    updateLoadDto: UpdateLoadV2Dto,
    user: User,
  ): Promise<LoadResponseV2Dto> {
    try {
      const load = await this.findLoadEntity(id, user);
      
      // Check if this is a metadata-only update (for drivers to update inspection status)
      // Filter out undefined/null values to get only the fields that are actually being updated
      const updateKeys = Object.keys(updateLoadDto).filter(
        key => updateLoadDto[key] !== undefined && updateLoadDto[key] !== null
      );
      
      // Check if metadata is the only field being updated (or if it's a driver trying to update metadata)
      const hasMetadata = updateLoadDto.metadata !== undefined && updateLoadDto.metadata !== null;
      const isMetadataOnlyUpdate = 
        hasMetadata && 
        (updateKeys.length === 1 || 
         (updateKeys.length > 1 && updateKeys.every(key => key === 'metadata' || updateLoadDto[key] === undefined || updateLoadDto[key] === null)));
      
      this.logger.debug(
        `Update request - User: ${user.id}, Role: ${user.role}, Load: ${id}, ` +
        `UpdateKeys: ${updateKeys.join(', ')}, HasMetadata: ${hasMetadata}, IsMetadataOnly: ${isMetadataOnlyUpdate}, ` +
        `AssignedTruckId: ${load.assignedTruckId}`
      );
      
      await this.validateUpdatePermissions(load, user, isMetadataOnlyUpdate, updateLoadDto);

      // Validate status transitions
      if (updateLoadDto.status) {
        this.validateStatusTransition(
          load.status,
          this.mapLoadStatusV2ToEntity(updateLoadDto.status),
        );
      }

      // Validate dates if updated
      if (updateLoadDto.pickupDate || updateLoadDto.deliveryDate) {
        this.validateDates(
          updateLoadDto.pickupDate || load.pickupDate.toISOString(),
          updateLoadDto.deliveryDate || load.deliveryDate.toISOString(),
        );
      }

      // Map V2 DTO to entity format
      const updateData: any = {
        ...updateLoadDto,
        updatedAt: new Date(),
      };

      // Handle metadata updates - merge with existing metadata
      if (updateLoadDto.metadata) {
        updateData.metadata = {
          ...(load.metadata || {}),
          ...updateLoadDto.metadata,
        };
      }

      // Map V2 enums to entity enums if present
      if (updateLoadDto.cargoType) {
        updateData.cargoType = this.mapCargoTypeV2ToEntity(
          updateLoadDto.cargoType,
        );
      }
      if (updateLoadDto.urgencyLevel) {
        updateData.urgencyLevel = this.mapUrgencyLevelV2ToEntity(
          updateLoadDto.urgencyLevel,
        );
      }
      if (updateLoadDto.status) {
        updateData.status = this.mapLoadStatusV2ToEntity(updateLoadDto.status);
      }

      await this.loadRepository.update(id, updateData);

      const updatedLoad = await this.findLoadEntity(id, user);

      // Emit load updated event
      this.eventEmitter.emit('load.v2.updated', {
        loadId: id,
        userId: user.id,
        changes: updateLoadDto,
      });

      this.logger.log(`Load updated: ${id} by user: ${user.id}`);

      return this.mapToResponseDto(updatedLoad);
    } catch (error) {
      this.logger.error(
        `Failed to update load ${id}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to update load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Publish a load
   */
  async publishLoad(id: string, user: User): Promise<LoadResponseV2Dto> {
    try {
      const load = await this.findLoadEntity(id, user);
      await this.validateUpdatePermissions(load, user);
      this.validateLoadForPublishing(load);

      await this.loadRepository.update(id, {
        status: LoadStatus.CREATED,
        publishedAt: new Date(),
        updatedAt: new Date(),
      });

      const publishedLoad = await this.findLoadEntity(id, user);

      // Emit load created event
      this.eventEmitter.emit('load.v2.created', {
        loadId: id,
        userId: user.id,
        tenantId: load.tenantId,
      });

      this.logger.log(
        `Load moved to created status: ${id} by user: ${user.id}`,
      );

      return this.mapToResponseDto(publishedLoad);
    } catch (error) {
      this.logger.error(
        `Failed to publish load ${id}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to publish load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Unpublish a load
   */
  async unpublishLoad(id: string, user: User): Promise<LoadResponseV2Dto> {
    try {
      const load = await this.findLoadEntity(id, user);
      await this.validateUpdatePermissions(load, user);

      await this.loadRepository.update(id, {
        status: LoadStatus.DRAFT,
        publishedAt: null,
        updatedAt: new Date(),
      });

      const unpublishedLoad = await this.findLoadEntity(id, user);

      // Emit load unpublished event
      this.eventEmitter.emit('load.v2.unpublished', {
        loadId: id,
        userId: user.id,
      });

      this.logger.log(`Load unpublished: ${id} by user: ${user.id}`);

      return this.mapToResponseDto(unpublishedLoad);
    } catch (error) {
      this.logger.error(
        `Failed to unpublish load ${id}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to unpublish load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Assign truck to load
   */
  async assignTruck(
    loadId: string,
    truckId: string,
    user: User,
  ): Promise<LoadResponseV2Dto> {
    try {
      const load = await this.findLoadEntity(loadId, user);
      await this.validateUpdatePermissions(load, user);

      await this.loadRepository.update(loadId, {
        assignedTruckId: truckId,
        status: LoadStatus.ASSIGNED,
        updatedAt: new Date(),
      });

      const assignedLoad = await this.findLoadEntity(loadId, user);

      // Emit truck assigned event
      this.eventEmitter.emit('load.v2.truck_assigned', {
        loadId,
        truckId,
        userId: user.id,
      });

      this.logger.log(
        `Truck ${truckId} assigned to load ${loadId} by user: ${user.id}`,
      );

      return this.mapToResponseDto(assignedLoad);
    } catch (error) {
      this.logger.error(
        `Failed to assign truck to load ${loadId}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to assign truck',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Unassign truck from load
   */
  async unassignTruck(loadId: string, user: User): Promise<LoadResponseV2Dto> {
    try {
      const load = await this.findLoadEntity(loadId, user);
      await this.validateUpdatePermissions(load, user);

      const truckId = load.assignedTruckId;

      await this.loadRepository.update(loadId, {
        assignedTruckId: null,
        status: LoadStatus.CREATED,
        updatedAt: new Date(),
      });

      const unassignedLoad = await this.findLoadEntity(loadId, user);

      // Emit truck unassigned event
      this.eventEmitter.emit('load.v2.truck_unassigned', {
        loadId,
        truckId,
        userId: user.id,
      });

      this.logger.log(
        `Truck ${truckId} unassigned from load ${loadId} by user: ${user.id}`,
      );

      return this.mapToResponseDto(unassignedLoad);
    } catch (error) {
      this.logger.error(
        `Failed to unassign truck from load ${loadId}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to unassign truck',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Rate a load
   */
  async rateLoad(
    loadId: string,
    rating: number,
    comment: string,
    user: User,
  ): Promise<LoadResponseV2Dto> {
    try {
      const load = await this.findLoadEntity(loadId, user);
      await this.validateViewPermissions(load, user);

      if (rating < 1 || rating > 5) {
        throw new HttpException(
          'Rating must be between 1 and 5',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.loadRepository.update(loadId, {
        rating,
        emergencyContactInfo: comment, // Using emergencyContactInfo field for comment
        updatedAt: new Date(),
      });

      const ratedLoad = await this.findLoadEntity(loadId, user);

      // Emit load rated event
      this.eventEmitter.emit('load.v2.rated', {
        loadId,
        rating,
        comment,
        userId: user.id,
      });

      this.logger.log(
        `Load ${loadId} rated ${rating} stars by user: ${user.id}`,
      );

      return this.mapToResponseDto(ratedLoad);
    } catch (error) {
      this.logger.error(
        `Failed to rate load ${loadId}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to rate load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Find matching trucks for a load
   */
  async findMatchingTrucks(
    loadId: string,
    user: User,
  ): Promise<Record<string, unknown>[]> {
    try {
      const load = await this.findLoadEntity(loadId, user);

      // Mock matching trucks for now
      return [
        {
          id: 'truck-1',
          licensePlate: 'ABC123',
          capacity: 25000,
          type: 'FLATBED',
          score: 85,
          reasons: ['Good capacity match', 'Available in area'],
          estimatedCost: 2500,
          estimatedTime: 8,
        },
        {
          id: 'truck-2',
          licensePlate: 'XYZ789',
          capacity: 30000,
          type: 'DRY_VAN',
          score: 75,
          reasons: ['Available', 'Good rating'],
          estimatedCost: 2800,
          estimatedTime: 10,
        },
      ];
    } catch (error) {
      this.logger.error(
        `Failed to find matching trucks for load ${loadId}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to find matching trucks',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get load tracking information
   */
  async getLoadTracking(
    loadId: string,
    user: User,
  ): Promise<Record<string, unknown>> {
    try {
      const load = await this.findLoadEntity(loadId, user);

      // Mock tracking information
      return {
        loadId,
        status: 'IN_TRANSIT',
        currentLocation: {
          latitude: 40.7128,
          longitude: -74.006,
          address: 'New York, NY',
        },
        progress: 65,
        estimatedArrival: new Date(Date.now() + 4 * 60 * 60 * 1000),
        lastUpdate: new Date(),
        events: [
          {
            type: 'pickup_completed',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            description: 'Load picked up successfully',
          },
        ],
      };
    } catch (error) {
      this.logger.error(
        `Failed to get tracking for load ${loadId}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to get tracking information',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Remove a load (soft delete)
   */
  async remove(id: string, user: User): Promise<void> {
    try {
      const load = await this.findLoadEntity(id, user);
      await this.validateUpdatePermissions(load, user);

      await this.loadRepository.update(id, {
        deletedAt: new Date(),
        updatedAt: new Date(),
      });

      // Emit load deleted event
      this.eventEmitter.emit('load.v2.deleted', {
        loadId: id,
        userId: user.id,
      });

      this.logger.log(`Load deleted: ${id} by user: ${user.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete load ${id}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to delete load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics(
    user: User,
    period: string = '30d',
  ): Promise<Record<string, unknown>> {
    try {
      const startDate = this.getDateFilter(period);

      const queryBuilder = this.loadRepository
        .createQueryBuilder('load')
        .where('load.tenantId = :tenantId', { tenantId: user.tenantId });

      if (startDate) {
        queryBuilder.andWhere('load.createdAt >= :startDate', { startDate });
      }

      const [loads, totalLoads] = await queryBuilder.getManyAndCount();

      const deliveredLoads = loads.filter(
        (load) => load.status === LoadStatus.DELIVERED,
      ).length;
      const activeLoads = loads.filter((load) =>
        [
          LoadStatus.CREATED,
          LoadStatus.PUBLISHED,
          LoadStatus.ASSIGNED,
          LoadStatus.IN_TRANSIT,
        ].includes(load.status),
      ).length;

      const totalRevenue = loads.reduce(
        (sum, load) => sum + (load.offeredPrice || 0),
        0,
      );
      const totalLoadValue = loads.reduce(
        (sum, load) => sum + (Number(load.loadValue) || 0),
        0,
      );
      
      const averageLoadValue = loads.length > 0 ? totalLoadValue / loads.length : 0;

      return {
        totalLoads,
        deliveredLoads,
        activeLoads,
        totalRevenue,
        totalLoadValue, // Added total value of all cargos
        averageLoadValue,
        deliveryRate: totalLoads > 0 ? (deliveredLoads / totalLoads) * 100 : 0,
        period,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get analytics: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to get analytics',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Increment view count for a load
   */
  async incrementViewCount(loadId: string): Promise<void> {
    try {
      await this.loadRepository.increment({ id: loadId }, 'viewCount', 1);
    } catch (error) {
      this.logger.error(
        `Failed to increment view count for load ${loadId}: ${error.message}`,
      );
    }
  }

  // Private helper methods

  private async findLoadEntity(id: string, user: User): Promise<Load> {
    try {
      // Try to load with profile first
      let load = await this.loadRepository.findOne({
        where: { id, deletedAt: IsNull() },
        relations: ['cargoOwner', 'cargoOwner.profile'],
      });

      // If not found or relation fails, try without profile
      if (!load) {
        load = await this.loadRepository.findOne({
          where: { id, deletedAt: IsNull() },
          relations: ['cargoOwner'],
        });
      }

      if (!load) {
        throw new HttpException('Load not found', HttpStatus.NOT_FOUND);
      }

      await this.validateViewPermissions(load, user);
      return load;
    } catch (error) {
      // If it's a relation error, try loading without profile
      if (
        error.message?.includes('profile') ||
        error.message?.includes('Property') ||
        error.message?.includes('relation')
      ) {
        this.logger.warn(
          `Failed to load profile relation for load ${id}, trying without profile: ${error.message}`,
        );
        try {
          const load = await this.loadRepository.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['cargoOwner'],
          });

          if (!load) {
            throw new HttpException('Load not found', HttpStatus.NOT_FOUND);
          }

          await this.validateViewPermissions(load, user);
          return load;
        } catch (retryError) {
          this.logger.error(
            `Failed to load load ${id} even without profile: ${retryError.message}`,
          );
          throw retryError;
        }
      }
      throw error;
    }
  }

  private validateUserPermissions(user: User, action: string): void {
    const allowedRoles = {
      create: ['CARGO_OWNER', 'ADMIN', 'DISPATCHER'],
      update: ['CARGO_OWNER', 'ADMIN', 'DISPATCHER'],
      delete: ['CARGO_OWNER', 'ADMIN'],
    };

    if (!allowedRoles[action]?.includes(user.role)) {
      throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
    }
  }

  private async validateViewPermissions(load: Load, user: User): Promise<void> {
    // Allow viewing if user is cargo owner, admin, or if load is published
    if (user.role === 'SUPER_ADMIN' || user.role === 'AGENT') {
      return;
    }

    if (load.cargoOwnerId === user.id) {
      return;
    }

    if ([LoadStatus.CREATED, LoadStatus.PUBLISHED].includes(load.status)) {
      return;
    }

    // Allow drivers to view loads assigned to their truck (all statuses: ASSIGNED, IN_TRANSIT, DELIVERED, etc.)
    // Drivers can only access loads assigned to their truck via the driver API, so we trust they have access
    if (user.role === 'DRIVER' && load.assignedTruckId) {
      return;
    }

    // Allow LENDERs to view loads that have loan requests assigned to them
    if (user.role === 'LENDER') {
      // First, find the Lender entity for this user
      const lender = await this.lenderRepository.findOne({
        where: { contact_email: user.email },
      });

      if (lender) {
        // Check if there's a loan request for this load with this lender
        const loanRequest = await this.loanRequestRepository.findOne({
          where: {
            cargo_id: load.id,
            lender_id: lender.id,
          },
        });

        if (loanRequest) {
          this.logger.debug(`Lender ${lender.id} has loan request for load ${load.id}, allowing access`);
          return;
        }
      }
    }

    throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
  }

  private async validateUpdatePermissions(load: Load, user: User, isMetadataOnly: boolean = false, updateLoadDto?: UpdateLoadV2Dto): Promise<void> {
    this.logger.debug(
      `validateUpdatePermissions - UserId: ${user?.id}, Role: ${user?.role}, ` +
      `LoadId: ${load.id}, CargoOwnerId: ${load.cargoOwnerId}, ` +
      `IsMetadataOnly: ${isMetadataOnly}, AssignedTruckId: ${load.assignedTruckId}`
    );

    if (user.role === 'SUPER_ADMIN' || user.role === 'AGENT') {
      return;
    }

    // Allow drivers to update metadata (inspection status) for loads assigned to their truck
    // Also allow if driver is updating and metadata is present (even if other fields might be in DTO)
    if (user.role === 'DRIVER' && load.assignedTruckId && (isMetadataOnly || updateLoadDto?.metadata)) {
      this.logger.debug(
        `Checking driver permissions - UserId: ${user.id}, LoadId: ${load.id}, AssignedTruckId: ${load.assignedTruckId}`
      );
      
      // Verify the driver is assigned to the truck
      const driver = await this.driverRepository.findOne({
        where: { userId: user.id, tenantId: user.tenantId },
      });

      if (!driver) {
        this.logger.warn(`Driver not found for userId: ${user.id}`);
        throw new HttpException(
          'Driver not found',
          HttpStatus.FORBIDDEN,
        );
      }

      this.logger.debug(
        `Driver found - DriverId: ${driver.id}, CurrentTruckId: ${driver.currentTruckId}`
      );

      if (driver.currentTruckId === load.assignedTruckId) {
        this.logger.debug('Driver has matching currentTruckId, allowing update');
        return;
      }

      // Also check if driver is in the truck's assignedDrivers array
      const truck = await this.truckRepository.findOne({
        where: { id: load.assignedTruckId, tenantId: load.tenantId },
      });

      if (truck && Array.isArray(truck.assignedDrivers)) {
        const isDriverAssigned = truck.assignedDrivers.some(
          (d: any) => d.driverId === driver.id,
        );
        if (isDriverAssigned) {
          this.logger.debug('Driver found in truck assignedDrivers array, allowing update');
          return;
        }
      }

      this.logger.warn(
        `Driver ${driver.id} is not assigned to truck ${load.assignedTruckId} for load ${load.id}`
      );
      throw new HttpException(
        'You can only update inspection status for loads assigned to your truck',
        HttpStatus.FORBIDDEN,
      );
    }

    // Cargo owners can update their own loads
    if (user.role === 'CARGO_OWNER' && load.cargoOwnerId === user.id) {
      return;
    }

    throw new HttpException(
      'You can only update your own loads',
      HttpStatus.FORBIDDEN,
    );
  }

  private validateDates(pickupDate: string, deliveryDate: string): void {
    this.loadValidationService.validateDatesSimple(pickupDate, deliveryDate);
  }

  private async validateLocations(
    pickupLocationId: string,
    deliveryLocationId: string,
  ): Promise<void> {
    await this.loadValidationService.validateLocationsSimple(
      pickupLocationId,
      deliveryLocationId,
    );
  }

  private validateStatusTransition(
    currentStatus: LoadStatus,
    newStatus: LoadStatus,
  ): void {
    this.loadValidationService.validateStatusTransitionSimple(
      currentStatus,
      newStatus,
    );
  }

  private validateLoadForPublishing(load: Load): void {
    this.loadValidationService.validateLoadForPublishingSimple(load);
  }

  private applyTenantFilter(
    queryBuilder: SelectQueryBuilder<Load>,
    user: User,
  ): void {
    // Handle case where user might be undefined or missing tenantId
    const tenantId = user?.tenantId || '00000000-0000-0000-0000-000000000001';

    queryBuilder.andWhere('load.tenantId = :tenantId', {
      tenantId: tenantId,
    });

    // Only show created or published loads for drivers
    if (user?.role === 'DRIVER') {
      queryBuilder.andWhere('load.status IN (:...statuses)', {
        statuses: [LoadStatus.CREATED, LoadStatus.PUBLISHED],
      });
    }
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Load>,
    filters: Record<string, unknown>,
  ): void {
    if (filters.status && typeof filters.status === 'string') {
      // Map LoadStatusV2 to LoadStatus entity enum
      const entityStatus = this.mapLoadStatusV2ToEntity(filters.status as LoadStatusV2);
      queryBuilder.andWhere('load.status = :status', {
        status: entityStatus,
      });
    }

    if (filters.cargoType && typeof filters.cargoType === 'string') {
      queryBuilder.andWhere('load.cargoType = :cargoType', {
        cargoType: filters.cargoType,
      });
    }

    if (filters.cargoOwnerId && typeof filters.cargoOwnerId === 'string') {
      queryBuilder.andWhere('load.cargoOwnerId = :cargoOwnerId', {
        cargoOwnerId: filters.cargoOwnerId,
      });
    }

    if (
      filters.pickupLocationId &&
      typeof filters.pickupLocationId === 'string'
    ) {
      queryBuilder.andWhere('load.pickupLocationId = :pickupLocationId', {
        pickupLocationId: filters.pickupLocationId,
      });
    }

    if (
      filters.deliveryLocationId &&
      typeof filters.deliveryLocationId === 'string'
    ) {
      queryBuilder.andWhere('load.deliveryLocationId = :deliveryLocationId', {
        deliveryLocationId: filters.deliveryLocationId,
      });
    }

    if (filters.search && typeof filters.search === 'string') {
      queryBuilder.andWhere(
        '(load.title ILIKE :search OR load.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.pickupDateFrom && typeof filters.pickupDateFrom === 'string') {
      queryBuilder.andWhere('load.pickupDate >= :pickupDateFrom', {
        pickupDateFrom: filters.pickupDateFrom,
      });
    }

    if (filters.pickupDateTo && typeof filters.pickupDateTo === 'string') {
      queryBuilder.andWhere('load.pickupDate <= :pickupDateTo', {
        pickupDateTo: filters.pickupDateTo,
      });
    }

    if (filters.minWeight && typeof filters.minWeight === 'number') {
      queryBuilder.andWhere('load.weight >= :minWeight', {
        minWeight: filters.minWeight,
      });
    }

    if (filters.maxWeight && typeof filters.maxWeight === 'number') {
      queryBuilder.andWhere('load.weight <= :maxWeight', {
        maxWeight: filters.maxWeight,
      });
    }
  }

  private getDateFilter(period: string): Date | null {
    const now = new Date();

    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  }

  private mapToResponseDto(load: Load): LoadResponseV2Dto {
    const response: any = {
      id: load.id,
      tenantId: load.tenantId,
      cargoOwnerId: load.cargoOwnerId,
      title: load.title,
      description: load.description || '',
      weight: load.weight,
      volume: load.volume,
      cargoType: this.mapCargoTypeEntityToV2(load.cargoType),
      // Legacy fields removed - using locations array instead
      locations: load.locations || [],
      pickupDate: load.pickupDate?.toISOString(),
      deliveryDate: load.deliveryDate?.toISOString(),
      status: this.mapLoadStatusEntityToV2(load.status),
      loadValue: load.loadValue,
      offeredPrice: load.offeredPrice,
      currencyCode: load.currencyCode,
      isFragile: load.isFragile,
      isHazardous: load.isHazardous,
      requiresRefrigeration: load.requiresRefrigeration,
      contactInfo: load.contactInfo as any,
      autoMatchEnabled: load.autoMatchEnabled,
      matchingCriteria: load.matchingCriteria,
      publishedAt: load.publishedAt?.toISOString(),
      assignedTruckId: load.assignedTruckId,
      rating: load.rating,
      viewCount: load.viewCount,
      createdAt: load.createdAt?.toISOString(),
      updatedAt: load.updatedAt?.toISOString(),
      urgencyLevel: this.mapUrgencyLevelEntityToV2(load.urgencyLevel),
      isTimeCritical: load.isTimeCritical,
      numberOfPieces: load.numberOfPieces,
      numberOfPallets: load.numberOfPallets,
      length: load.length,
      width: load.width,
      height: load.height,
      stackableHeight: load.stackableHeight,
      isStackable: load.isStackable,
      temperatureMin: load.temperatureMin,
      temperatureMax: load.temperatureMax,
      requiresHumidityControl: load.requiresHumidityControl,
      requiresForklift: load.requiresForklift,
      requiresCrane: load.requiresCrane,
      requiresLoadingDock: load.requiresLoadingDock,
      loadingTimeEstimate: load.loadingTimeEstimate,
      unloadingTimeEstimate: load.unloadingTimeEstimate,
      hazmatClass: load.hazmatClass,
      hazmatNumber: load.hazmatNumber,
      maxTransitTime: load.maxTransitTime,
      packagingType: load.packagingType,
      requiresGpsMonitoring: load.requiresGpsMonitoring,
      requiresTemperatureMonitoring: load.requiresTemperatureMonitoring,
      insuranceValue: load.insuranceValue,
      requiresLowClearanceRoute: load.requiresLowClearanceRoute,
      maxClearanceHeight: load.maxClearanceHeight,
      requiresEscortVehicle: load.requiresEscortVehicle,
      specialHandlingInstructions: load.specialHandlingInstructions,
      loadingInstructions: load.loadingInstructions,
      unloadingInstructions: load.unloadingInstructions,
      emergencyContactInfo: load.emergencyContactInfo,
      truckRequirements: load.truckRequirements,
      carrierPreferences: load.carrierPreferences,
      costPreferences: load.costPreferences,
      requiresPreShipmentInspection: load.requiresPreShipmentInspection,
      requiresDeliveryInspection: load.requiresDeliveryInspection,
      requiresPhotographicDocumentation: load.requiresPhotographicDocumentation,
      metadata: load.metadata || {},
    };

    // Include cargoOwner if it's loaded (for frontend to display shipper info)
    if (load.cargoOwner) {
      try {
        response.cargoOwner = {
          id: load.cargoOwner.id,
          email: load.cargoOwner.email || null,
          phone: load.cargoOwner.phone || null,
          companyName: (load.cargoOwner as any)?.companyName || null,
          profile: load.cargoOwner.profile ? {
            firstName: load.cargoOwner.profile.firstName || null,
            lastName: load.cargoOwner.profile.lastName || null,
          } : null,
        };
      } catch (profileError) {
        this.logger.warn(`Error mapping cargoOwner profile for load ${load.id}: ${profileError.message}`);
        // Include basic cargoOwner info even if profile fails
        response.cargoOwner = {
          id: load.cargoOwner.id,
          email: load.cargoOwner.email || null,
          phone: load.cargoOwner.phone || null,
          companyName: null,
          profile: null,
        };
      }
    }

    return response as LoadResponseV2Dto;
  }

  // Enum mapping methods
  private mapCargoTypeV2ToEntity(cargoTypeV2: CargoTypeV2): CargoType {
    const mapping = {
      [CargoTypeV2.GENERAL]: CargoType.GENERAL,
      [CargoTypeV2.FOOD]: CargoType.REFRIGERATED,
      [CargoTypeV2.ELECTRONICS]: CargoType.FRAGILE,
      [CargoTypeV2.CHEMICALS]: CargoType.HAZARDOUS,
      [CargoTypeV2.AUTOMOTIVE]: CargoType.GENERAL,
      [CargoTypeV2.TEXTILES]: CargoType.GENERAL,
      [CargoTypeV2.MACHINERY]: CargoType.OVERSIZED,
    };
    return mapping[cargoTypeV2] || CargoType.GENERAL;
  }

  private mapCargoTypeEntityToV2(cargoType: CargoType): CargoTypeV2 {
    const mapping = {
      [CargoType.GENERAL]: CargoTypeV2.GENERAL,
      [CargoType.REFRIGERATED]: CargoTypeV2.FOOD,
      [CargoType.FRAGILE]: CargoTypeV2.ELECTRONICS,
      [CargoType.HAZARDOUS]: CargoTypeV2.CHEMICALS,
      [CargoType.LIQUID]: CargoTypeV2.CHEMICALS,
      [CargoType.OVERSIZED]: CargoTypeV2.MACHINERY,
      [CargoType.VALUABLE]: CargoTypeV2.ELECTRONICS,
    };
    return mapping[cargoType] || CargoTypeV2.GENERAL;
  }

  private mapUrgencyLevelV2ToEntity(
    urgencyLevelV2: UrgencyLevelV2,
  ): UrgencyLevel {
    const mapping = {
      [UrgencyLevelV2.LOW]: UrgencyLevel.LOW,
      [UrgencyLevelV2.NORMAL]: UrgencyLevel.NORMAL,
      [UrgencyLevelV2.HIGH]: UrgencyLevel.HIGH,
      [UrgencyLevelV2.URGENT]: UrgencyLevel.CRITICAL,
    };
    return mapping[urgencyLevelV2] || UrgencyLevel.NORMAL;
  }

  private mapUrgencyLevelEntityToV2(
    urgencyLevel: UrgencyLevel,
  ): UrgencyLevelV2 {
    const mapping = {
      [UrgencyLevel.LOW]: UrgencyLevelV2.LOW,
      [UrgencyLevel.NORMAL]: UrgencyLevelV2.NORMAL,
      [UrgencyLevel.HIGH]: UrgencyLevelV2.HIGH,
      [UrgencyLevel.CRITICAL]: UrgencyLevelV2.URGENT,
    };
    return mapping[urgencyLevel] || UrgencyLevelV2.NORMAL;
  }

  private mapLoadStatusV2ToEntity(statusV2: LoadStatusV2): LoadStatus {
    const mapping = {
      [LoadStatusV2.DRAFT]: LoadStatus.DRAFT,
      [LoadStatusV2.CREATED]: LoadStatus.CREATED,
      [LoadStatusV2.PUBLISHED]: LoadStatus.PUBLISHED,
      [LoadStatusV2.ASSIGNED]: LoadStatus.ASSIGNED,
      [LoadStatusV2.LOADED]: LoadStatus.LOADED,
      [LoadStatusV2.IN_TRANSIT]: LoadStatus.IN_TRANSIT,
      [LoadStatusV2.DELIVERED]: LoadStatus.DELIVERED,
      [LoadStatusV2.CANCELLED]: LoadStatus.CANCELLED,
    };
    return mapping[statusV2] || LoadStatus.DRAFT;
  }

  private mapLoadStatusEntityToV2(status: LoadStatus): LoadStatusV2 {
    const mapping = {
      [LoadStatus.DRAFT]: LoadStatusV2.DRAFT,
      [LoadStatus.CREATED]: LoadStatusV2.CREATED,
      [LoadStatus.PUBLISHED]: LoadStatusV2.PUBLISHED,
      [LoadStatus.ASSIGNED]: LoadStatusV2.ASSIGNED,
      [LoadStatus.LOADED]: LoadStatusV2.LOADED,
      [LoadStatus.IN_TRANSIT]: LoadStatusV2.IN_TRANSIT,
      [LoadStatus.DELIVERED]: LoadStatusV2.DELIVERED,
      [LoadStatus.CANCELLED]: LoadStatusV2.CANCELLED,
    };
    return mapping[status] || LoadStatusV2.DRAFT;
  }
}
