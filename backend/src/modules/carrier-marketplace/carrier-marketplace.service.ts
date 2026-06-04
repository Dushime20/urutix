import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Truck, VehicleStatus } from '../../entities/truck.entity';
import { User, UserRole } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { UserRating } from '../../entities/user-rating.entity';
import { CarrierTier } from '../../entities/carrier-tier.entity';
import { PrivateCarrierNetwork } from '../../entities/private-carrier-network.entity';
import { Load, LoadStatus } from '../../entities/load.entity';

export interface CarrierProfileDto {
  truckOwnerId: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  totalTrucks: number;
  availableTrucks: number;
  averageRating: number;
  totalTrips: number;
  tier?: string;
  onTimeRate?: number;
  trucks: Array<{ id: string; truckType: string; plateNumber: string; status: string }>;
  isInPrivateNetwork?: boolean;
}

@Injectable()
export class CarrierMarketplaceService {
  private readonly logger = new Logger(CarrierMarketplaceService.name);

  constructor(
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
    @InjectRepository(UserRating)
    private readonly ratingRepository: Repository<UserRating>,
    @InjectRepository(CarrierTier)
    private readonly tierRepository: Repository<CarrierTier>,
    @InjectRepository(PrivateCarrierNetwork)
    private readonly networkRepository: Repository<PrivateCarrierNetwork>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
  ) {}

  // ─── Browse carrier directory ─────────────────────────────────────────────────

  async browseCarriers(
    tenantId: string,
    requesterId: string,
    filters: {
      truckType?: string;
      minRating?: number;
      tier?: string;
      available?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ carriers: CarrierProfileDto[]; total: number }> {
    const { page = 1, limit = 20 } = filters;

    // Get all truck owners in this tenant
    const qb = this.userRepository
      .createQueryBuilder('u')
      .where('u."tenantId" = :tenantId', { tenantId })
      .andWhere('u.role = :role', { role: UserRole.TRUCK_OWNER })
      .andWhere('u.status = :status', { status: 'ACTIVE' });

    const owners = await qb.getMany();

    const carriers: CarrierProfileDto[] = [];

    for (const owner of owners) {
      const profile = await this.profileRepository.findOne({ where: { userId: owner.id } });

      const truckQb = this.truckRepository
        .createQueryBuilder('t')
        .where('t."ownerId" = :ownerId', { ownerId: owner.id })
        .andWhere('t."tenantId" = :tenantId', { tenantId });

      if (filters.truckType) {
        truckQb.andWhere('t."truckType" = :truckType', { truckType: filters.truckType });
      }

      const trucks = await truckQb.getMany();
      if (trucks.length === 0) continue;

      const availableTrucks = trucks.filter((t) => t.status === VehicleStatus.AVAILABLE).length;
      if (filters.available && availableTrucks === 0) continue;

      // Rating
      const ratings = await this.ratingRepository.find({ where: { ratedUserId: owner.id } });
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((s, r) => s + Number(r.rating), 0) / ratings.length
          : 0;

      if (filters.minRating && avgRating < filters.minRating) continue;

      // Tier
      const tier = await this.tierRepository.findOne({ where: { truckOwnerId: owner.id, tenantId } });
      if (filters.tier && tier?.tier !== filters.tier) continue;

      // Private network membership
      const inNetwork = await this.networkRepository.findOne({
        where: { cargoOwnerId: requesterId, truckOwnerId: owner.id, tenantId, isActive: true },
      });

      carriers.push({
        truckOwnerId: owner.id,
        companyName: profile?.companyName,
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        totalTrucks: trucks.length,
        availableTrucks,
        averageRating: Math.round(avgRating * 100) / 100,
        totalTrips: 0, // populated from scoring if needed
        tier: tier?.tier,
        onTimeRate: tier?.onTimeRate,
        trucks: trucks.slice(0, 5).map((t) => ({
          id: t.id,
          truckType: t.truckType,
          plateNumber: t.plateNumber,
          status: t.status,
        })),
        isInPrivateNetwork: !!inNetwork,
      });
    }

    const total = carriers.length;
    const paginated = carriers.slice((page - 1) * limit, page * limit);

    return { carriers: paginated, total };
  }

  // ─── Get single carrier public profile ───────────────────────────────────────

  async getCarrierProfile(truckOwnerId: string, tenantId: string, requesterId: string): Promise<CarrierProfileDto> {
    const owner = await this.userRepository.findOne({ where: { id: truckOwnerId, tenantId } });
    if (!owner) throw new NotFoundException('Carrier not found');

    const profile = await this.profileRepository.findOne({ where: { userId: truckOwnerId } });
    const trucks = await this.truckRepository.find({ where: { ownerId: truckOwnerId, tenantId } });
    const ratings = await this.ratingRepository.find({ where: { ratedUserId: truckOwnerId } });
    const tier = await this.tierRepository.findOne({ where: { truckOwnerId, tenantId } });
    const inNetwork = await this.networkRepository.findOne({
      where: { cargoOwnerId: requesterId, truckOwnerId, tenantId, isActive: true },
    });

    const avgRating =
      ratings.length > 0
        ? ratings.reduce((s, r) => s + Number(r.rating), 0) / ratings.length
        : 0;

    return {
      truckOwnerId,
      companyName: profile?.companyName,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      totalTrucks: trucks.length,
      availableTrucks: trucks.filter((t) => t.status === VehicleStatus.AVAILABLE).length,
      averageRating: Math.round(avgRating * 100) / 100,
      totalTrips: tier?.totalTrips ?? 0,
      tier: tier?.tier,
      onTimeRate: tier?.onTimeRate,
      trucks: trucks.map((t) => ({
        id: t.id,
        truckType: t.truckType,
        plateNumber: t.plateNumber,
        status: t.status,
      })),
      isInPrivateNetwork: !!inNetwork,
    };
  }

  // ─── Backhaul matching ────────────────────────────────────────────────────────

  async findBackhaulMatches(
    truckOwnerId: string,
    tenantId: string,
    returnOriginCity: string,
    returnDestinationCity: string,
    availableDate: string,
  ): Promise<Load[]> {
    // Find PUBLISHED loads whose pickup city matches the return origin
    const loads = await this.loadRepository
      .createQueryBuilder('l')
      .where('l."tenantId" = :tenantId', { tenantId })
      .andWhere('l.status = :status', { status: LoadStatus.PUBLISHED })
      .andWhere(`l.locations::text ILIKE :city`, { city: `%${returnOriginCity}%` })
      .orderBy('l."createdAt"', 'DESC')
      .take(20)
      .getMany();

    return loads;
  }

  // ─── Featured carriers ────────────────────────────────────────────────────────

  async getFeaturedCarriers(tenantId: string): Promise<CarrierTier[]> {
    return this.tierRepository.find({
      where: { tenantId, tier: 'PLATINUM' as any },
      order: { onTimeRate: 'DESC' },
      take: 10,
    });
  }

  // ─── Private Carrier Network ──────────────────────────────────────────────────

  async inviteToNetwork(
    cargoOwnerId: string,
    truckOwnerId: string,
    tenantId: string,
    notes?: string,
  ): Promise<PrivateCarrierNetwork> {
    const existing = await this.networkRepository.findOne({
      where: { cargoOwnerId, truckOwnerId, tenantId },
    });
    if (existing) {
      if (existing.isActive) throw new ConflictException('Carrier already in your private network');
      existing.isActive = true;
      existing.notes = notes;
      return this.networkRepository.save(existing);
    }

    const entry = this.networkRepository.create({ cargoOwnerId, truckOwnerId, tenantId, notes });
    return this.networkRepository.save(entry);
  }

  async removeFromNetwork(cargoOwnerId: string, truckOwnerId: string, tenantId: string): Promise<void> {
    await this.networkRepository.update(
      { cargoOwnerId, truckOwnerId, tenantId },
      { isActive: false },
    );
  }

  async getMyNetwork(cargoOwnerId: string, tenantId: string): Promise<PrivateCarrierNetwork[]> {
    return this.networkRepository.find({
      where: { cargoOwnerId, tenantId, isActive: true },
      order: { addedAt: 'DESC' },
    });
  }

  async isInNetwork(cargoOwnerId: string, truckOwnerId: string, tenantId: string): Promise<boolean> {
    const entry = await this.networkRepository.findOne({
      where: { cargoOwnerId, truckOwnerId, tenantId, isActive: true },
    });
    return !!entry;
  }
}
