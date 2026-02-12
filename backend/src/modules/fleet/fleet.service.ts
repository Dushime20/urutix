import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Truck, VehicleStatus } from '../../entities/truck.entity';
import { User, UserRole } from '../../entities/user.entity';

export interface FleetSummary {
  totalTruckOwners: number;
  activeTruckOwners: number;
  totalTrucks: number;
  activeTrucks: number;
  maintenanceTrucks: number;
  inactiveTrucks: number;
  totalDrivers: number;
  activeDrivers: number;
}

export interface FleetUtilization {
  current: number;
  weekly: number[];
  monthly: number[];
}

export interface TruckOwnerDetails {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  status: string;
  totalTrucks: number;
  activeTrucks: number;
  totalTrips: number;
  totalRevenue: number;
  averageRating: number;
  joinedDate: Date;
}

export interface TruckDetails {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  truckType: string;
  status: VehicleStatus;
  owner: {
    id: string;
    name: string;
    companyName: string | null;
  };
  driver: {
    id: string;
    name: string;
  } | null;
  location: string;
  utilization: number;
  lastMaintenanceDate: Date | null;
  nextMaintenanceDate: Date | null;
  mileage: number;
  totalTrips: number;
  totalRevenue: number;
  averageRating: number;
}

@Injectable()
export class FleetService {
  constructor(
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getFleetSummary(tenantId: string): Promise<FleetSummary> {
    // Get all truck owners for tenant
    const truckOwners = await this.userRepository.find({
      where: { tenantId, role: UserRole.TRUCK_OWNER },
    });

    // Get all trucks for tenant
    const trucks = await this.truckRepository.find({
      where: { tenantId, isActive: true },
    });

    // Get all drivers for tenant
    const drivers = await this.userRepository.find({
      where: { tenantId, role: UserRole.DRIVER },
    });

    // Calculate truck owner statistics
    const activeTruckOwners = truckOwners.filter((o) => o.status === 'ACTIVE').length;

    // Calculate truck statistics
    const activeTrucks = trucks.filter(
      (t) => t.status === VehicleStatus.AVAILABLE || t.status === VehicleStatus.IN_TRANSIT,
    ).length;
    const maintenanceTrucks = trucks.filter(
      (t) => t.status === VehicleStatus.MAINTENANCE,
    ).length;
    const inactiveTrucks = trucks.filter(
      (t) => t.status === VehicleStatus.OUT_OF_SERVICE,
    ).length;

    // Calculate driver statistics
    const activeDrivers = drivers.filter((d) => d.status === 'ACTIVE').length;

    return {
      totalTruckOwners: truckOwners.length,
      activeTruckOwners,
      totalTrucks: trucks.length,
      activeTrucks,
      maintenanceTrucks,
      inactiveTrucks,
      totalDrivers: drivers.length,
      activeDrivers,
    };
  }

  async getFleetUtilization(tenantId: string): Promise<FleetUtilization> {
    const trucks = await this.truckRepository.find({
      where: { tenantId, isActive: true },
    });

    const totalTrucks = trucks.length;
    const activeTrucks = trucks.filter(
      (t) => t.status === VehicleStatus.IN_TRANSIT,
    ).length;

    const current = totalTrucks > 0 ? (activeTrucks / totalTrucks) * 100 : 0;

    // Mock weekly and monthly data - in production, calculate from trip history
    const weekly = [78, 82, 75, 88, 91, 85, Math.round(current)];
    const monthly = [82, 79, 85, 88, 90, 87, 89, 91, 88, 86, 89, Math.round(current)];

    return {
      current: Math.round(current * 10) / 10,
      weekly,
      monthly,
    };
  }

  async getTruckOwners(
    tenantId: string,
    filters?: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ truckOwners: TruckOwnerDetails[]; total: number }> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoin('trucks', 'truck', 'truck.ownerId = user.id AND truck.isActive = true')
      .addSelect('COUNT(truck.id)', 'totalTrucks')
      .addSelect(
        'COUNT(CASE WHEN truck.status IN (:...activeStatuses) THEN 1 END)',
        'activeTrucks',
      )
      .addSelect('COALESCE(SUM(truck.totalTrips), 0)', 'totalTrips')
      .addSelect('COALESCE(SUM(truck.totalRevenue), 0)', 'totalRevenue')
      .addSelect('COALESCE(AVG(truck.averageRating), 0)', 'averageRating')
      .where('user.tenantId = :tenantId', { tenantId })
      .andWhere('user.role = :role', { role: UserRole.TRUCK_OWNER })
      .setParameter('activeStatuses', [VehicleStatus.AVAILABLE, VehicleStatus.IN_TRANSIT])
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

    const truckOwnersDetails: TruckOwnerDetails[] = results.entities.map((owner, index) => {
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
        totalTrucks: parseInt(raw.totalTrucks) || 0,
        activeTrucks: parseInt(raw.activeTrucks) || 0,
        totalTrips: parseInt(raw.totalTrips) || 0,
        totalRevenue: parseFloat(raw.totalRevenue) || 0,
        averageRating: parseFloat(raw.averageRating) || 0,
        joinedDate: owner.createdAt,
      };
    });

    return { truckOwners: truckOwnersDetails, total };
  }

  async getTrucks(
    tenantId: string,
    filters?: {
      ownerId?: string;
      status?: VehicleStatus;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ trucks: TruckDetails[]; total: number }> {
    const query = this.truckRepository
      .createQueryBuilder('truck')
      .leftJoinAndSelect('truck.owner', 'owner')
      .leftJoinAndSelect('owner.profile', 'ownerProfile')
      .leftJoin('users', 'driver', 'driver.id = truck.currentDriverId')
      .addSelect(['driver.id', 'driver.email'])
      .leftJoin('user_profiles', 'driverProfile', 'driverProfile.userId = driver.id')
      .addSelect(['driverProfile.firstName', 'driverProfile.lastName'])
      .where('truck.tenantId = :tenantId', { tenantId })
      .andWhere('truck.isActive = :isActive', { isActive: true });

    // Filter by owner if specified
    if (filters?.ownerId) {
      query.andWhere('truck.ownerId = :ownerId', { ownerId: filters.ownerId });
    }

    // Apply status filter
    if (filters?.status) {
      query.andWhere('truck.status = :status', { status: filters.status });
    }

    // Apply search filter
    if (filters?.search) {
      query.andWhere(
        '(truck.plateNumber ILIKE :search OR truck.make ILIKE :search OR truck.model ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    query.skip((page - 1) * limit).take(limit);

    const trucks = await query.getMany();

    const trucksDetails: TruckDetails[] = trucks.map((truck: any) => ({
      id: truck.id,
      plateNumber: truck.plateNumber,
      make: truck.make,
      model: truck.model,
      year: truck.year,
      truckType: truck.truckType,
      status: truck.status,
      owner: {
        id: truck.owner.id,
        name: truck.owner.profile
          ? `${truck.owner.profile.firstName} ${truck.owner.profile.lastName}`
          : truck.owner.email,
        companyName: truck.owner.profile?.companyName || null,
      },
      driver: truck.driver
        ? {
            id: truck.driver.id,
            name: truck.driverProfile
              ? `${truck.driverProfile.firstName} ${truck.driverProfile.lastName}`
              : truck.driver.email,
          }
        : null,
      location: truck.currentAddress || 'Unknown',
      utilization: truck.totalTrips > 0 ? Math.min(100, truck.totalTrips * 5) : 0,
      lastMaintenanceDate: truck.lastMaintenanceDate,
      nextMaintenanceDate: truck.nextMaintenanceDate,
      mileage: truck.mileage,
      totalTrips: truck.totalTrips,
      totalRevenue: parseFloat(truck.totalRevenue) || 0,
      averageRating: truck.averageRating,
    }));

    return { trucks: trucksDetails, total };
  }

  async getTruckOwnerById(
    tenantId: string,
    ownerId: string,
  ): Promise<TruckOwnerDetails | null> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoin('trucks', 'truck', 'truck.ownerId = user.id AND truck.isActive = true')
      .addSelect('COUNT(truck.id)', 'totalTrucks')
      .addSelect(
        'COUNT(CASE WHEN truck.status IN (:...activeStatuses) THEN 1 END)',
        'activeTrucks',
      )
      .addSelect('COALESCE(SUM(truck.totalTrips), 0)', 'totalTrips')
      .addSelect('COALESCE(SUM(truck.totalRevenue), 0)', 'totalRevenue')
      .addSelect('COALESCE(AVG(truck.averageRating), 0)', 'averageRating')
      .where('user.id = :ownerId', { ownerId })
      .andWhere('user.tenantId = :tenantId', { tenantId })
      .andWhere('user.role = :role', { role: UserRole.TRUCK_OWNER })
      .setParameter('activeStatuses', [VehicleStatus.AVAILABLE, VehicleStatus.IN_TRANSIT])
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
      totalTrucks: parseInt(raw.totalTrucks) || 0,
      activeTrucks: parseInt(raw.activeTrucks) || 0,
      totalTrips: parseInt(raw.totalTrips) || 0,
      totalRevenue: parseFloat(raw.totalRevenue) || 0,
      averageRating: parseFloat(raw.averageRating) || 0,
      joinedDate: owner.createdAt,
    };
  }
}
