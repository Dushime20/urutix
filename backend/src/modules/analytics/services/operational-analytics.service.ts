import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Load } from '../../../entities/load.entity';
import { UserRole } from '../../auth/enums/user-role.enum';

@Injectable()
export class OperationalAnalyticsService {
  constructor(
    @InjectRepository(Load)
    private loadRepository: Repository<Load>,
  ) {}

  async getPerformanceMetrics(tenantId: string, userId: string, role: string, period: { start: Date; end: Date }) {
    const query = this.loadRepository.createQueryBuilder('load').where('load.tenantId = :tenantId', { tenantId });
    if (role !== UserRole.TENANT_ADMIN && role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) {
      query.andWhere('load.cargoOwnerId = :userId', { userId });
    }
    const loads = await query.andWhere('load.createdAt BETWEEN :start AND :end', period).getMany();
    return { totalShipments: loads.length, onTimeRate: 0, averageTransitTime: 0 };
  }

  async getRoutePerformance(_tenantId: string, _userId: string, _role: string) {
    // cargo_owner_analytics table not yet migrated
    return [];
  }

  async getCarrierScorecard(tenantId: string, carrierId: string) {
    return { carrierId, totalShipments: 0, onTimeRate: 0, averageRating: 0, averageCost: 0, recommendation: 'insufficient_data' };
  }
}
