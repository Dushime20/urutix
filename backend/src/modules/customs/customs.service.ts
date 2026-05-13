import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { CustomsInspection, CustomsInspectionStatus, CustomsRiskLevel } from '../../entities/customs-inspection.entity';
import { CustomsCheckpoint } from '../../entities/customs-checkpoint.entity';
import { Trip } from '../../entities/trip.entity';
import { Truck } from '../../entities/truck.entity';
import {
  CreateInspectionDto,
  UpdateInspectionStatusDto,
  SearchTruckDto,
  CreateCheckpointDto,
} from './dto/customs.dto';

@Injectable()
export class CustomsService {
  private readonly logger = new Logger(CustomsService.name);

  constructor(
    @InjectRepository(CustomsInspection)
    private readonly inspectionRepo: Repository<CustomsInspection>,
    @InjectRepository(CustomsCheckpoint)
    private readonly checkpointRepo: Repository<CustomsCheckpoint>,
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Truck)
    private readonly truckRepo: Repository<Truck>,
  ) {}

  // ─── Dashboard Stats ─────────────────────────────────────────────────────────

  async getDashboardStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalToday,
      pending,
      cleared,
      rejected,
      flagged,
      onHold,
      highRisk,
    ] = await Promise.all([
      this.inspectionRepo.count({ where: { tenantId } }),
      this.inspectionRepo.count({ where: { tenantId, status: CustomsInspectionStatus.PENDING } }),
      this.inspectionRepo.count({ where: { tenantId, status: CustomsInspectionStatus.CLEARED } }),
      this.inspectionRepo.count({ where: { tenantId, status: CustomsInspectionStatus.REJECTED } }),
      this.inspectionRepo.count({ where: { tenantId, status: CustomsInspectionStatus.HIGH_RISK } }),
      this.inspectionRepo.count({ where: { tenantId, status: CustomsInspectionStatus.ON_HOLD } }),
      this.inspectionRepo.count({ where: { tenantId, riskLevel: CustomsRiskLevel.HIGH } }),
    ]);

    const clearedToday = await this.inspectionRepo
      .createQueryBuilder('i')
      .where('i.tenantId = :tenantId', { tenantId })
      .andWhere('i.status = :status', { status: CustomsInspectionStatus.CLEARED })
      .andWhere('i.completedAt >= :today', { today })
      .getCount();

    return {
      totalInspections: totalToday,
      pending,
      cleared,
      rejected,
      flagged,
      onHold,
      highRisk,
      clearedToday,
    };
  }

  // ─── Search Trucks / Shipments ────────────────────────────────────────────────

  async searchTruck(tenantId: string, dto: SearchTruckDto) {
    const results: any[] = [];

    // Search trips with truck/load info
    const qb = this.tripRepo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.truck', 'truck')
      .leftJoinAndSelect('trip.load', 'load')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('driver.profile', 'driverProfile')
      .where('trip.tenantId = :tenantId', { tenantId });

    if (dto.plateNumber) {
      qb.andWhere('LOWER(truck.plateNumber) LIKE LOWER(:plate)', { plate: `%${dto.plateNumber}%` });
    }
    if (dto.shipmentReference) {
      qb.andWhere('LOWER(load.trackingNumber) LIKE LOWER(:ref)', { ref: `%${dto.shipmentReference}%` });
    }
    if (dto.containerNumber) {
      qb.andWhere('LOWER(load.containerNumber) LIKE LOWER(:cn)', { cn: `%${dto.containerNumber}%` });
    }
    if (dto.tripId) {
      qb.andWhere('trip.id = :tripId', { tripId: dto.tripId });
    }

    const trips = await qb.limit(20).getMany();

    for (const trip of trips) {
      const lastInspection = await this.inspectionRepo.findOne({
        where: { tripId: trip.id },
        order: { createdAt: 'DESC' },
      });

      results.push({
        tripId: trip.id,
        tripNumber: trip.tripNumber,
        status: trip.status,
        plateNumber: trip.truck?.plateNumber,
        truckType: trip.truck?.truckType,
        driverName: trip.driver ? `${(trip.driver as any).profile?.firstName || ''} ${(trip.driver as any).profile?.lastName || ''}`.trim() : null,
        driverId: trip.driverId,
        cargoTitle: trip.load?.title,
        cargoType: trip.load?.cargoType,
        origin: trip.load?.origin,
        destination: trip.load?.destination,
        customsStatus: lastInspection?.status || null,
        riskLevel: lastInspection?.riskLevel || null,
        lastInspectionId: lastInspection?.id || null,
      });
    }

    return results;
  }

  // ─── Inspections CRUD ─────────────────────────────────────────────────────────

  async createInspection(tenantId: string, officerId: string, dto: CreateInspectionDto) {
    const inspection = this.inspectionRepo.create({
      ...dto,
      tenantId,
      officerId,
      status: CustomsInspectionStatus.IN_PROGRESS,
    });
    return this.inspectionRepo.save(inspection);
  }

  async getInspections(
    tenantId: string,
    params: {
      status?: CustomsInspectionStatus;
      riskLevel?: CustomsRiskLevel;
      limit?: number;
      offset?: number;
      search?: string;
    },
  ) {
    const qb = this.inspectionRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.officer', 'officer')
      .leftJoinAndSelect('i.trip', 'trip')
      .leftJoinAndSelect('trip.load', 'load')
      .where('i.tenantId = :tenantId', { tenantId });

    if (params.status) qb.andWhere('i.status = :status', { status: params.status });
    if (params.riskLevel) qb.andWhere('i.riskLevel = :riskLevel', { riskLevel: params.riskLevel });
    if (params.search) {
      qb.andWhere(
        '(LOWER(i.plateNumber) LIKE LOWER(:q) OR LOWER(i.shipmentReference) LIKE LOWER(:q) OR LOWER(i.containerNumber) LIKE LOWER(:q) OR LOWER(i.driverName) LIKE LOWER(:q))',
        { q: `%${params.search}%` },
      );
    }

    const total = await qb.getCount();
    const data = await qb
      .orderBy('i.createdAt', 'DESC')
      .skip(params.offset || 0)
      .take(params.limit || 20)
      .getMany();

    return { data, total, limit: params.limit || 20, offset: params.offset || 0 };
  }

  async getInspectionById(tenantId: string, id: string) {
    const inspection = await this.inspectionRepo.findOne({
      where: { id, tenantId },
      relations: ['officer', 'trip', 'trip.load', 'trip.truck'],
    });
    if (!inspection) throw new NotFoundException(`Inspection ${id} not found`);
    return inspection;
  }

  async updateInspectionStatus(tenantId: string, id: string, dto: UpdateInspectionStatusDto) {
    const inspection = await this.getInspectionById(tenantId, id);
    Object.assign(inspection, dto);
    if (
      dto.status === CustomsInspectionStatus.CLEARED ||
      dto.status === CustomsInspectionStatus.REJECTED
    ) {
      inspection.completedAt = new Date();
    }
    return this.inspectionRepo.save(inspection);
  }

  async flagInspection(tenantId: string, id: string, riskLevel: CustomsRiskLevel, notes?: string) {
    const inspection = await this.getInspectionById(tenantId, id);
    inspection.riskLevel = riskLevel;
    inspection.status = CustomsInspectionStatus.HIGH_RISK;
    if (notes) inspection.inspectionNotes = notes;
    return this.inspectionRepo.save(inspection);
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────

  async getAnalytics(tenantId: string, days = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const all = await this.inspectionRepo
      .createQueryBuilder('i')
      .where('i.tenantId = :tenantId', { tenantId })
      .andWhere('i.createdAt >= :from', { from })
      .getMany();

    const byStatus = Object.values(CustomsInspectionStatus).map(s => ({
      status: s,
      count: all.filter(i => i.status === s).length,
    }));

    const byRisk = Object.values(CustomsRiskLevel).map(r => ({
      risk: r,
      count: all.filter(i => i.riskLevel === r).length,
    }));

    const clearanceRate = all.length > 0
      ? Math.round((all.filter(i => i.status === CustomsInspectionStatus.CLEARED).length / all.length) * 100)
      : 0;

    return { total: all.length, byStatus, byRisk, clearanceRate, period: days };
  }

  // ─── Checkpoints ─────────────────────────────────────────────────────────────

  async getCheckpoints(tenantId: string) {
    return this.checkpointRepo.find({ where: { tenantId, isActive: true }, order: { name: 'ASC' } });
  }

  async createCheckpoint(tenantId: string, dto: CreateCheckpointDto) {
    const cp = this.checkpointRepo.create({ ...dto, tenantId });
    return this.checkpointRepo.save(cp);
  }
}
