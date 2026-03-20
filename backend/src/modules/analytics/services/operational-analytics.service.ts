import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CargoOwnerAnalytics } from '../../../entities/cargo-owner-analytics.entity';
import { Load } from '../../../entities/load.entity';
import { UserRole } from '../../auth/enums/user-role.enum';

@Injectable()
export class OperationalAnalyticsService {
  constructor(
    @InjectRepository(Load)
    private loadRepository: Repository<Load>,
    @InjectRepository(CargoOwnerAnalytics)
    private analyticsRepository: Repository<CargoOwnerAnalytics>,
  ) {}

  /**
   * Get performance metrics using existing Load data
   */
  async getPerformanceMetrics(
    tenantId: string,
    userId: string,
    role: string,
    period: { start: Date; end: Date }
  ) {
    // Query existing Load entities with performance data
    const query = this.loadRepository
      .createQueryBuilder('load')
      .where('load.tenantId = :tenantId', { tenantId });

    if (role !== UserRole.TENANT_ADMIN && role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) {
      query.andWhere('load.cargoOwnerId = :userId', { userId });
    }

    const loads = await query
      .andWhere('load.createdAt BETWEEN :start AND :end', {
        start: period.start,
        end: period.end
      })
      .getMany();

    return this.calculatePerformanceMetrics(loads);
  }

  private calculatePerformanceMetrics(loads: Load[]) {
    // Implementation will be added in next chunk
    return {
      totalShipments: loads.length,
      onTimeRate: 0,
      averageTransitTime: 0
    };
  }

  /**
   * Get route performance leveraging existing Load locations
   */
  async getRoutePerformance(
    tenantId: string,
    userId: string,
    role: string
  ) {
    // Use existing Load entity route data
    const query = this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'analytics.routeHash',
        'analytics.originCity',
        'analytics.destinationCity',
        'AVG(analytics.totalCost) as avgCost',
        'AVG(analytics.actualTransitHours) as avgTransitTime',
        'COUNT(*) as shipmentCount',
        'AVG(CASE WHEN analytics.onTimeDelivery THEN 1 ELSE 0 END) as onTimeRate'
      ])
      .where('analytics.tenantId = :tenantId', { tenantId });

    if (role !== UserRole.TENANT_ADMIN && role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) {
      query.andWhere('analytics.cargoOwnerId = :userId', { userId });
    }

    const routeData = await query
      .groupBy('analytics.routeHash, analytics.originCity, analytics.destinationCity')
      .getRawMany();

    return this.processRoutePerformance(routeData);
  }

  /**
   * Get carrier scorecard integrating with existing fleet data
   */
  async getCarrierScorecard(
    tenantId: string,
    carrierId: string
  ) {
    // Combine analytics data with existing fleet/carrier data
    const carrierPerformance = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.carrierId = :carrierId', { carrierId })
      .getMany();

    return this.generateCarrierScorecard(carrierPerformance);
  }

  private processRoutePerformance(routeData: any[]) {
    return routeData.map(route => ({
      routeHash: route.routeHash,
      route: `${route.originCity} → ${route.destinationCity}`,
      averageCost: Number(route.avgCost) || 0,
      averageTransitTime: Number(route.avgTransitTime) || 0,
      shipmentCount: Number(route.shipmentCount) || 0,
      onTimeRate: Number(route.onTimeRate) * 100 || 0
    }));
  }

  private generateCarrierScorecard(performance: CargoOwnerAnalytics[]) {
    if (performance.length === 0) {
      return {
        carrierId: null,
        totalShipments: 0,
        onTimeRate: 0,
        averageRating: 0,
        averageCost: 0,
        recommendation: 'insufficient_data'
      };
    }

    const totalShipments = performance.length;
    const onTimeShipments = performance.filter(p => p.onTimeDelivery).length;
    const onTimeRate = (onTimeShipments / totalShipments) * 100;
    const averageRating = performance.reduce((sum, p) => sum + (p.carrierRating || 0), 0) / totalShipments;
    const averageCost = performance.reduce((sum, p) => sum + (p.totalCost || 0), 0) / totalShipments;

    return {
      carrierId: performance[0].carrierId,
      totalShipments,
      onTimeRate,
      averageRating,
      averageCost,
      recommendation: this.determineRecommendation(onTimeRate, averageRating)
    };
  }

  private determineRecommendation(onTimeRate: number, averageRating: number): string {
    if (onTimeRate >= 90 && averageRating >= 4.0) return 'preferred';
    if (onTimeRate >= 75 && averageRating >= 3.0) return 'acceptable';
    return 'avoid';
  }
}