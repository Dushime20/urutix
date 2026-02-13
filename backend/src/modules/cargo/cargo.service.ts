import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Load, LoadStatus } from '../../entities/load.entity';
import { User, UserRole } from '../../entities/user.entity';

export interface CargoSummary {
  totalCargoOwners: number;
  activeCargoOwners: number;
  totalLoads: number;
  activeLoads: number;
  completedLoads: number;
  pendingLoads: number;
  totalRevenue: number;
  averageDeliveryTime: number;
}

export interface CargoOwnerDetails {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  status: string;
  totalLoads: number;
  activeLoads: number;
  completedLoads: number;
  totalRevenue: number;
  averageRating: number;
  joinedDate: Date;
}

export interface LoadDetails {
  id: string;
  loadNumber: string;
  cargoType: string;
  origin: string;
  destination: string;
  status: LoadStatus;
  weight: number;
  distance: number;
  owner: {
    id: string;
    name: string;
    companyName: string | null;
  };
  assignedTruck: {
    id: string;
    plateNumber: string;
  } | null;
  assignedDriver: {
    id: string;
    name: string;
  } | null;
  pickupDate: Date | null;
  deliveryDate: Date | null;
  revenue: number;
  rating: number | null;
  // Tenant relationship indicators
  isOwnCargo: boolean;  // Created by tenant's cargo owner
  isOwnFleet: boolean;  // Assigned to tenant's truck
}

@Injectable()
export class CargoService {
  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getCargoSummary(tenantId: string): Promise<CargoSummary> {
    // Get all cargo owners for tenant
    const cargoOwners = await this.userRepository.find({
      where: { tenantId, role: UserRole.CARGO_OWNER },
    });

    // Get all loads for tenant (both created by cargo owners AND assigned to tenant's trucks)
    const loads = await this.loadRepository
      .createQueryBuilder('load')
      .leftJoin('trucks', 'truck', 'truck.id = load.assignedTruckId')
      .where('(load.tenantId = :tenantId OR truck.tenantId = :tenantId)', { tenantId })
      .getMany();

    // Calculate cargo owner statistics
    const activeCargoOwners = cargoOwners.filter((o) => o.status === 'ACTIVE').length;

    // Calculate load statistics
    const activeLoads = loads.filter(
      (l) =>
        l.status === LoadStatus.PUBLISHED ||
        l.status === LoadStatus.ASSIGNED ||
        l.status === LoadStatus.IN_TRANSIT,
    ).length;
    const completedLoads = loads.filter((l) => l.status === LoadStatus.DELIVERED).length;
    const pendingLoads = loads.filter(
      (l) => l.status === LoadStatus.DRAFT || l.status === LoadStatus.CREATED,
    ).length;

    // Calculate revenue (sum of pricing.spotRateAmount for completed loads)
    const totalRevenue = loads
      .filter((l) => l.status === LoadStatus.DELIVERED && l.pricing?.spotRateAmount)
      .reduce((sum, load) => sum + (load.pricing?.spotRateAmount || 0), 0);

    // Calculate average delivery time (mock for now)
    const averageDeliveryTime = 2.3;

    return {
      totalCargoOwners: cargoOwners.length,
      activeCargoOwners,
      totalLoads: loads.length,
      activeLoads,
      completedLoads,
      pendingLoads,
      totalRevenue,
      averageDeliveryTime,
    };
  }

  async getCargoOwners(
    tenantId: string,
    filters?: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ cargoOwners: CargoOwnerDetails[]; total: number }> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoin('loads', 'load', 'load.cargoOwnerId = user.id')
      .addSelect('COUNT(load.id)', 'totalLoads')
      .addSelect(
        'COUNT(CASE WHEN load.status IN (:...activeStatuses) THEN 1 END)',
        'activeLoads',
      )
      .addSelect(
        'COUNT(CASE WHEN load.status = :completedStatus THEN 1 END)',
        'completedLoads',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN load.status = :completedStatus THEN (load.pricing::json->>\'spotRateAmount\')::numeric ELSE 0 END), 0)',
        'totalRevenue',
      )
      .addSelect('COALESCE(AVG(load.rating), 0)', 'averageRating')
      .where('user.tenantId = :tenantId', { tenantId })
      .andWhere('user.role = :role', { role: UserRole.CARGO_OWNER })
      .setParameter('activeStatuses', [
        LoadStatus.PUBLISHED,
        LoadStatus.ASSIGNED,
        LoadStatus.IN_TRANSIT,
      ])
      .setParameter('completedStatus', LoadStatus.DELIVERED)
      .groupBy('user.id')
      .addGroupBy('profile.id');

    // Apply status filter
    if (filters?.status) {
      query.andWhere('user.status = :status', { status: filters.status });
    }

    // Apply search filter
    if (filters?.search) {
      query.andWhere(
        '(profile.firstName ILIKE :search OR profile.lastName ILIKE :search OR user.email ILIKE :search OR profile.companyName ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Get total count
    const countQuery = query.clone();
    const total = await countQuery.getCount();

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    query.skip((page - 1) * limit).take(limit);

    const results = await query.getRawAndEntities();

    const cargoOwnersDetails: CargoOwnerDetails[] = results.entities.map((owner, index) => {
      const raw = results.raw[index];
      return {
        id: owner.id,
        name: owner.profile
          ? `${owner.profile.firstName} ${owner.profile.lastName}`
          : owner.email,
        email: owner.email,
        phone: owner.phone,
        companyName: owner.profile?.companyName || null,
        status: owner.status,
        totalLoads: parseInt(raw.totalLoads) || 0,
        activeLoads: parseInt(raw.activeLoads) || 0,
        completedLoads: parseInt(raw.completedLoads) || 0,
        totalRevenue: parseFloat(raw.totalRevenue) || 0,
        averageRating: parseFloat(raw.averageRating) || 0,
        joinedDate: owner.createdAt,
      };
    });

    return { cargoOwners: cargoOwnersDetails, total };
  }

  async getLoads(
    tenantId: string,
    filters?: {
      ownerId?: string;
      status?: LoadStatus;
      search?: string;
      page?: number;
      limit?: number;
      loadType?: 'all' | 'own-cargo' | 'own-fleet';  // NEW: Filter by relationship type
    },
  ): Promise<{ loads: LoadDetails[]; total: number }> {
    const query = this.loadRepository
      .createQueryBuilder('load')
      .leftJoinAndSelect('load.cargoOwner', 'owner')
      .leftJoinAndSelect('owner.profile', 'ownerProfile')
      .leftJoin('trucks', 'truck', 'truck.id = load.assignedTruckId')
      .addSelect(['truck.id', 'truck.plateNumber', 'truck.tenantId', 'truck.currentDriverId'])
      .leftJoin('users', 'driver', 'driver.id = truck.currentDriverId')
      .addSelect(['driver.id', 'driver.email'])
      .leftJoin('user_profiles', 'driverProfile', 'driverProfile.userId = driver.id')
      .addSelect(['driverProfile.firstName', 'driverProfile.lastName'])
      .where('(load.tenantId = :tenantId OR truck.tenantId = :tenantId)', { tenantId });

    // Apply load type filter
    if (filters?.loadType === 'own-cargo') {
      query.andWhere('load.tenantId = :tenantId', { tenantId });
    } else if (filters?.loadType === 'own-fleet') {
      query.andWhere('truck.tenantId = :tenantId', { tenantId });
    }

    // Filter by owner if specified
    if (filters?.ownerId) {
      query.andWhere('load.cargoOwnerId = :ownerId', { ownerId: filters.ownerId });
    }

    // Apply status filter
    if (filters?.status) {
      query.andWhere('load.status = :status', { status: filters.status });
    }

    // Apply search filter
    if (filters?.search) {
      query.andWhere(
        '(load.loadNumber ILIKE :search OR load.cargoType ILIKE :search OR load.pickupAddress ILIKE :search OR load.deliveryAddress ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    query.skip((page - 1) * limit).take(limit);

    const loads = await query.getMany();

    const loadsDetails: LoadDetails[] = loads.map((load: any) => ({
      id: load.id,
      loadNumber: load.loadNumber,
      cargoType: load.cargoType || 'General',
      origin: load.pickupAddress || 'Unknown',
      destination: load.deliveryAddress || 'Unknown',
      status: load.status,
      weight: load.weight || 0,
      distance: load.distance || 0,
      owner: {
        id: load.cargoOwner.id,
        name: load.cargoOwner.profile
          ? `${load.cargoOwner.profile.firstName} ${load.cargoOwner.profile.lastName}`
          : load.cargoOwner.email,
        companyName: load.cargoOwner.profile?.companyName || null,
      },
      assignedTruck: load.truck
        ? {
            id: load.truck.id,
            plateNumber: load.truck.plateNumber,
          }
        : null,
      assignedDriver: load.driver
        ? {
            id: load.driver.id,
            name: load.driverProfile
              ? `${load.driverProfile.firstName} ${load.driverProfile.lastName}`
              : load.driver.email,
          }
        : null,
      pickupDate: load.pickupDate,
      deliveryDate: load.deliveryDate,
      revenue: load.pricing?.spotRateAmount || 0,
      rating: load.rating,
      // Determine relationship to tenant
      isOwnCargo: load.tenantId === tenantId,
      isOwnFleet: load.truck?.tenantId === tenantId,
    }));

    return { loads: loadsDetails, total };
  }

  async getCargoOwnerById(
    tenantId: string,
    ownerId: string,
  ): Promise<CargoOwnerDetails | null> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoin('loads', 'load', 'load.cargoOwnerId = user.id')
      .addSelect('COUNT(load.id)', 'totalLoads')
      .addSelect(
        'COUNT(CASE WHEN load.status IN (:...activeStatuses) THEN 1 END)',
        'activeLoads',
      )
      .addSelect(
        'COUNT(CASE WHEN load.status = :completedStatus THEN 1 END)',
        'completedLoads',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN load.status = :completedStatus THEN (load.pricing::json->>\'spotRateAmount\')::numeric ELSE 0 END), 0)',
        'totalRevenue',
      )
      .addSelect('COALESCE(AVG(load.rating), 0)', 'averageRating')
      .where('user.id = :ownerId', { ownerId })
      .andWhere('user.tenantId = :tenantId', { tenantId })
      .andWhere('user.role = :role', { role: UserRole.CARGO_OWNER })
      .setParameter('activeStatuses', [
        LoadStatus.PUBLISHED,
        LoadStatus.ASSIGNED,
        LoadStatus.IN_TRANSIT,
      ])
      .setParameter('completedStatus', LoadStatus.DELIVERED)
      .groupBy('user.id')
      .addGroupBy('profile.id')
      .getRawAndEntities();

    if (!result.entities.length) {
      return null;
    }

    const owner = result.entities[0];
    const raw = result.raw[0];

    return {
      id: owner.id,
      name: owner.profile
        ? `${owner.profile.firstName} ${owner.profile.lastName}`
        : owner.email,
      email: owner.email,
      phone: owner.phone,
      companyName: owner.profile?.companyName || null,
      status: owner.status,
      totalLoads: parseInt(raw.totalLoads) || 0,
      activeLoads: parseInt(raw.activeLoads) || 0,
      completedLoads: parseInt(raw.completedLoads) || 0,
      totalRevenue: parseFloat(raw.totalRevenue) || 0,
      averageRating: parseFloat(raw.averageRating) || 0,
      joinedDate: owner.createdAt,
    };
  }

  async getLoadById(tenantId: string, loadId: string): Promise<any | null> {
    const load = await this.loadRepository.findOne({
      where: { id: loadId, tenantId },
    });

    if (!load) {
      return null;
    }

    const pickupLoc = load.pickupLocation;
    const deliveryLoc = load.deliveryLocation;

    return {
      id: load.id,
      reference: load.reference || 'N/A',
      cargoType: load.cargoType,
      origin: pickupLoc?.locationData 
        ? `${pickupLoc.locationData.city || ''}, ${pickupLoc.locationData.state || ''}`.trim() || pickupLoc.locationData.address
        : 'Unknown',
      destination: deliveryLoc?.locationData 
        ? `${deliveryLoc.locationData.city || ''}, ${deliveryLoc.locationData.state || ''}`.trim() || deliveryLoc.locationData.address
        : 'Unknown',
      status: load.status,
      weight: load.weight || 0,
      volume: load.volume || 0,
      description: load.description,
      pickupDate: load.pickupDate,
      deliveryDate: load.deliveryDate,
      revenue: load.pricing?.spotRateAmount || 0,
      rating: load.rating || null,
      createdAt: load.createdAt,
      updatedAt: load.updatedAt,
    };
  }
}
