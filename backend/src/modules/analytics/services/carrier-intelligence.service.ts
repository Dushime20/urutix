import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CargoOwnerAnalytics } from '../../../entities/cargo-owner-analytics.entity';

@Injectable()
export class CarrierIntelligenceService {
  constructor(
    @InjectRepository(CargoOwnerAnalytics)
    private analyticsRepository: Repository<CargoOwnerAnalytics>,
  ) {}

  /**
   * Analyze carrier performance across all routes
   */
  async analyzeCarrierPerformance(
    tenantId: string,
    cargoOwnerId: string,
    period?: { start: Date; end: Date }
  ) {
    const queryBuilder = this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'analytics.carrierId',
        'COUNT(*) as totalShipments',
        'AVG(CASE WHEN analytics.onTimeDelivery THEN 100 ELSE 0 END) as onTimeRate',
        'AVG(CASE WHEN analytics.damageReported THEN 100 ELSE 0 END) as damageRate',
        'AVG(analytics.totalCost) as averageCost',
        'AVG(analytics.costPerKm) as averageCostPerKm',
        'AVG(analytics.carrierRating) as averageRating',
        'MIN(analytics.bookingDate) as firstShipment',
        'MAX(analytics.bookingDate) as lastShipment'
      ])
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .andWhere('analytics.carrierId IS NOT NULL');

    if (period) {
      queryBuilder.andWhere('analytics.bookingDate BETWEEN :start AND :end', period);
    }

    const results = await queryBuilder
      .groupBy('analytics.carrierId')
      .orderBy('onTimeRate', 'DESC')
      .addOrderBy('averageCost', 'ASC')
      .getRawMany();

    return results.map(result => ({
      carrierId: result.carrierId,
      totalShipments: Number(result.totalShipments),
      onTimeRate: Number(result.onTimeRate) || 0,
      damageRate: Number(result.damageRate) || 0,
      averageCost: Number(result.averageCost) || 0,
      averageCostPerKm: Number(result.averageCostPerKm) || 0,
      averageRating: Number(result.averageRating) || 0,
      reliabilityScore: this.calculateReliabilityScore(
        Number(result.onTimeRate) || 0,
        Number(result.damageRate) || 0,
        Number(result.averageRating) || 0
      ),
      recommendation: this.generateRecommendation(
        Number(result.onTimeRate) || 0,
        Number(result.damageRate) || 0,
        Number(result.averageRating) || 0,
        Number(result.totalShipments)
      ),
      relationshipDuration: this.calculateRelationshipDuration(
        result.firstShipment,
        result.lastShipment
      )
    }));
  }

  /**
   * Get carrier recommendations for a specific route
   */
  async getCarrierRecommendationsForRoute(
    tenantId: string,
    cargoOwnerId: string,
    routeHash: string
  ) {
    const routeCarriers = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'analytics.carrierId',
        'COUNT(*) as routeShipments',
        'AVG(CASE WHEN analytics.onTimeDelivery THEN 100 ELSE 0 END) as routeOnTimeRate',
        'AVG(analytics.totalCost) as routeAverageCost',
        'AVG(analytics.actualTransitHours) as routeAverageTransitTime'
      ])
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .andWhere('analytics.routeHash = :routeHash', { routeHash })
      .andWhere('analytics.carrierId IS NOT NULL')
      .groupBy('analytics.carrierId')
      .having('COUNT(*) >= 3') // Minimum 3 shipments for reliable data
      .orderBy('routeOnTimeRate', 'DESC')
      .addOrderBy('routeAverageCost', 'ASC')
      .getRawMany();

    return routeCarriers.map(carrier => ({
      carrierId: carrier.carrierId,
      routeExperience: Number(carrier.routeShipments),
      routeOnTimeRate: Number(carrier.routeOnTimeRate) || 0,
      routeAverageCost: Number(carrier.routeAverageCost) || 0,
      routeAverageTransitTime: Number(carrier.routeAverageTransitTime) || 0,
      routeSpecialization: this.calculateRouteSpecialization(
        Number(carrier.routeShipments),
        Number(carrier.routeOnTimeRate) || 0
      )
    }));
  }

  private calculateReliabilityScore(onTimeRate: number, damageRate: number, rating: number): number {
    // Weighted reliability score (0-100)
    const onTimeWeight = 0.4;
    const damageWeight = 0.3;
    const ratingWeight = 0.3;
    
    const onTimeScore = onTimeRate;
    const damageScore = Math.max(0, 100 - damageRate);
    const ratingScore = (rating / 5) * 100;
    
    return Math.round(
      (onTimeScore * onTimeWeight) + 
      (damageScore * damageWeight) + 
      (ratingScore * ratingWeight)
    );
  }

  private generateRecommendation(
    onTimeRate: number, 
    damageRate: number, 
    rating: number, 
    shipmentCount: number
  ): string {
    if (shipmentCount < 5) return 'insufficient_data';
    
    const reliabilityScore = this.calculateReliabilityScore(onTimeRate, damageRate, rating);
    
    if (reliabilityScore >= 85) return 'preferred';
    if (reliabilityScore >= 70) return 'acceptable';
    return 'avoid';
  }

  private calculateRelationshipDuration(firstShipment: string, lastShipment: string): number {
    if (!firstShipment || !lastShipment) return 0;
    
    const first = new Date(firstShipment);
    const last = new Date(lastShipment);
    const diffTime = Math.abs(last.getTime() - first.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  private calculateRouteSpecialization(routeShipments: number, routeOnTimeRate: number): string {
    if (routeShipments >= 20 && routeOnTimeRate >= 90) return 'expert';
    if (routeShipments >= 10 && routeOnTimeRate >= 80) return 'experienced';
    if (routeShipments >= 5) return 'familiar';
    return 'new';
  }
}