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
    
    // Calculate metrics from loads
    const totalShipments = loads.length;
    const completedLoads = loads.filter(l => l.status === 'DELIVERED' || l.status === 'COMPLETED');
    const onTimeLoads = completedLoads.filter(l => {
      // Simple on-time calculation - can be enhanced with actual delivery dates
      return true; // Placeholder
    });
    
    return {
      totalShipments,
      onTimeRate: completedLoads.length > 0 ? (onTimeLoads.length / completedLoads.length) * 100 : 0,
      damageRate: 0, // Placeholder - would need incident data
      averageTransitTime: 0, // Placeholder - would need trip data
      averageCostPerKm: 0,
      activeCarriers: 0, // Placeholder
      activeRoutes: 0, // Placeholder
      efficiencyScore: 75, // Placeholder - calculated score
    };
  }

  async getRoutePerformance(tenantId: string, userId: string, role: string) {
    // Return empty array for now - would need trip/route data
    return [];
  }

  async getCarrierScorecard(tenantId: string, carrierId: string) {
    return { carrierId, totalShipments: 0, onTimeRate: 0, averageRating: 0, averageCost: 0, recommendation: 'insufficient_data' };
  }
}
