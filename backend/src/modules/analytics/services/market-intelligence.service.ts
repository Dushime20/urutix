import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CargoOwnerAnalytics } from '../../../entities/cargo-owner-analytics.entity';

@Injectable()
export class MarketIntelligenceService {
  constructor(
    @InjectRepository(CargoOwnerAnalytics)
    private analyticsRepository: Repository<CargoOwnerAnalytics>,
  ) {}

  /**
   * Get industry benchmarks with privacy protection
   */
  async getIndustryBenchmarks(tenantId: string, cargoOwnerId: string) {
    // Ensure minimum participants for anonymity
    const participantCount = await this.getParticipantCount();
    if (participantCount < 10) {
      throw new ForbiddenException('Insufficient data for benchmarking');
    }

    // Get anonymized aggregated data only
    return this.generateAnonymizedBenchmarks(tenantId, cargoOwnerId);
  }

  /**
   * Get market trends for specific routes
   */
  async getMarketTrends(
    tenantId: string,
    routeHash?: string,
    cargoType?: string,
    timeframe: 'monthly' | 'quarterly' = 'monthly'
  ) {
    const queryBuilder = this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        `DATE_TRUNC('${timeframe === 'monthly' ? 'month' : 'quarter'}', analytics.bookingDate) as period`,
        'AVG(analytics.totalCost) as averageCost',
        'AVG(analytics.costPerKm) as averageCostPerKm',
        'COUNT(*) as shipmentCount',
        'AVG(analytics.actualTransitHours) as averageTransitTime'
      ])
      .where('analytics.bookingDate >= :sixMonthsAgo', {
        sixMonthsAgo: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
      });

    if (routeHash) {
      queryBuilder.andWhere('analytics.routeHash = :routeHash', { routeHash });
    }

    if (cargoType) {
      queryBuilder.andWhere('analytics.cargoType = :cargoType', { cargoType });
    }

    const trends = await queryBuilder
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    return trends.map(trend => ({
      period: trend.period,
      averageCost: Number(trend.averageCost) || 0,
      averageCostPerKm: Number(trend.averageCostPerKm) || 0,
      shipmentCount: Number(trend.shipmentCount) || 0,
      averageTransitTime: Number(trend.averageTransitTime) || 0,
      trend: this.calculateTrend(trends, trend.period)
    }));
  }

  /**
   * Get competitive positioning
   */
  async getCompetitivePositioning(
    tenantId: string,
    cargoOwnerId: string,
    cargoType?: string
  ) {
    // Get user's performance
    const userPerformance = await this.getUserPerformance(tenantId, cargoOwnerId, cargoType);
    
    // Get market averages (anonymized)
    const marketAverages = await this.getMarketAverages(cargoType);
    
    return {
      userMetrics: userPerformance,
      marketBenchmarks: marketAverages,
      positioning: this.calculatePositioning(userPerformance, marketAverages),
      recommendations: this.generatePositioningRecommendations(userPerformance, marketAverages)
    };
  }

  private async getParticipantCount(): Promise<number> {
    const result = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('COUNT(DISTINCT analytics.tenantId) as count')
      .where('analytics.bookingDate >= :thirtyDaysAgo', {
        thirtyDaysAgo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      })
      .getRawOne();
    
    return Number(result.count) || 0;
  }

  private async generateAnonymizedBenchmarks(tenantId: string, cargoOwnerId: string) {
    // Get market-wide statistics (excluding current user for fair comparison)
    const marketStats = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'AVG(analytics.totalCost) as marketAverageCost',
        'AVG(analytics.costPerKm) as marketAverageCostPerKm',
        'AVG(analytics.actualTransitHours) as marketAverageTransitTime',
        'AVG(CASE WHEN analytics.onTimeDelivery THEN 100 ELSE 0 END) as marketOnTimeRate',
        'PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY analytics.totalCost) as costP25',
        'PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY analytics.totalCost) as costP75'
      ])
      .where('analytics.tenantId != :tenantId', { tenantId })
      .andWhere('analytics.bookingDate >= :ninetyDaysAgo', {
        ninetyDaysAgo: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      })
      .getRawOne();

    // Get user's performance for comparison
    const userStats = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'AVG(analytics.totalCost) as userAverageCost',
        'AVG(analytics.costPerKm) as userAverageCostPerKm',
        'AVG(analytics.actualTransitHours) as userAverageTransitTime',
        'AVG(CASE WHEN analytics.onTimeDelivery THEN 100 ELSE 0 END) as userOnTimeRate'
      ])
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .andWhere('analytics.bookingDate >= :ninetyDaysAgo', {
        ninetyDaysAgo: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      })
      .getRawOne();

    return {
      marketBenchmarks: {
        averageCost: Number(marketStats.marketAverageCost) || 0,
        averageCostPerKm: Number(marketStats.marketAverageCostPerKm) || 0,
        averageTransitTime: Number(marketStats.marketAverageTransitTime) || 0,
        onTimeRate: Number(marketStats.marketOnTimeRate) || 0,
        costRange: {
          p25: Number(marketStats.costP25) || 0,
          p75: Number(marketStats.costP75) || 0
        }
      },
      userPerformance: {
        averageCost: Number(userStats.userAverageCost) || 0,
        averageCostPerKm: Number(userStats.userAverageCostPerKm) || 0,
        averageTransitTime: Number(userStats.userAverageTransitTime) || 0,
        onTimeRate: Number(userStats.userOnTimeRate) || 0
      },
      comparison: this.generateComparison(userStats, marketStats)
    };
  }

  private calculateTrend(trends: any[], currentPeriod: string): 'increasing' | 'decreasing' | 'stable' {
    const currentIndex = trends.findIndex(t => t.period === currentPeriod);
    if (currentIndex === 0) return 'stable';
    
    const current = Number(trends[currentIndex].averageCost) || 0;
    const previous = Number(trends[currentIndex - 1].averageCost) || 0;
    
    const changePercent = previous > 0 ? Math.abs((current - previous) / previous) * 100 : 0;
    
    if (changePercent < 5) return 'stable';
    return current > previous ? 'increasing' : 'decreasing';
  }

  private async getUserPerformance(tenantId: string, cargoOwnerId: string, cargoType?: string) {
    const queryBuilder = this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'AVG(analytics.totalCost) as averageCost',
        'AVG(analytics.costPerKm) as averageCostPerKm',
        'AVG(analytics.actualTransitHours) as averageTransitTime',
        'AVG(CASE WHEN analytics.onTimeDelivery THEN 100 ELSE 0 END) as onTimeRate',
        'COUNT(*) as totalShipments'
      ])
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId });

    if (cargoType) {
      queryBuilder.andWhere('analytics.cargoType = :cargoType', { cargoType });
    }

    const result = await queryBuilder.getRawOne();
    
    return {
      averageCost: Number(result.averageCost) || 0,
      averageCostPerKm: Number(result.averageCostPerKm) || 0,
      averageTransitTime: Number(result.averageTransitTime) || 0,
      onTimeRate: Number(result.onTimeRate) || 0,
      totalShipments: Number(result.totalShipments) || 0
    };
  }

  private async getMarketAverages(cargoType?: string) {
    const queryBuilder = this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'AVG(analytics.totalCost) as averageCost',
        'AVG(analytics.costPerKm) as averageCostPerKm',
        'AVG(analytics.actualTransitHours) as averageTransitTime',
        'AVG(CASE WHEN analytics.onTimeDelivery THEN 100 ELSE 0 END) as onTimeRate'
      ]);

    if (cargoType) {
      queryBuilder.where('analytics.cargoType = :cargoType', { cargoType });
    }

    const result = await queryBuilder.getRawOne();
    
    return {
      averageCost: Number(result.averageCost) || 0,
      averageCostPerKm: Number(result.averageCostPerKm) || 0,
      averageTransitTime: Number(result.averageTransitTime) || 0,
      onTimeRate: Number(result.onTimeRate) || 0
    };
  }

  private calculatePositioning(userMetrics: any, marketMetrics: any) {
    const costPosition = userMetrics.averageCost < marketMetrics.averageCost ? 'below_market' : 'above_market';
    const timePosition = userMetrics.averageTransitTime < marketMetrics.averageTransitTime ? 'faster' : 'slower';
    const reliabilityPosition = userMetrics.onTimeRate > marketMetrics.onTimeRate ? 'above_market' : 'below_market';
    
    return {
      cost: costPosition,
      speed: timePosition,
      reliability: reliabilityPosition,
      overall: this.determineOverallPosition(costPosition, timePosition, reliabilityPosition)
    };
  }

  private determineOverallPosition(cost: string, speed: string, reliability: string): string {
    const positiveFactors = [
      cost === 'below_market',
      speed === 'faster',
      reliability === 'above_market'
    ].filter(Boolean).length;
    
    if (positiveFactors >= 2) return 'competitive_advantage';
    if (positiveFactors === 1) return 'mixed_performance';
    return 'improvement_needed';
  }

  private generatePositioningRecommendations(userMetrics: any, marketMetrics: any): string[] {
    const recommendations = [];
    
    if (userMetrics.averageCost > marketMetrics.averageCost * 1.1) {
      recommendations.push('Consider negotiating better rates with carriers or exploring alternative routes');
    }
    
    if (userMetrics.averageTransitTime > marketMetrics.averageTransitTime * 1.1) {
      recommendations.push('Focus on carriers with better transit time performance');
    }
    
    if (userMetrics.onTimeRate < marketMetrics.onTimeRate * 0.9) {
      recommendations.push('Improve on-time delivery by working with more reliable carriers');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Your performance is competitive with market standards');
    }
    
    return recommendations;
  }

  private generateComparison(userStats: any, marketStats: any) {
    return {
      costComparison: this.calculatePercentageDifference(
        Number(userStats.userAverageCost) || 0,
        Number(marketStats.marketAverageCost) || 0
      ),
      transitTimeComparison: this.calculatePercentageDifference(
        Number(userStats.userAverageTransitTime) || 0,
        Number(marketStats.marketAverageTransitTime) || 0
      ),
      onTimeRateComparison: this.calculatePercentageDifference(
        Number(userStats.userOnTimeRate) || 0,
        Number(marketStats.marketOnTimeRate) || 0
      )
    };
  }

  private calculatePercentageDifference(userValue: number, marketValue: number): number {
    if (marketValue === 0) return 0;
    return ((userValue - marketValue) / marketValue) * 100;
  }
}