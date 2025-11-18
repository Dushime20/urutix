import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import {
  Load,
  LoadStatus,
  CargoType,
  UrgencyLevel,
} from '../../../entities/load.entity';

export interface AnalyticsMetrics {
  totalLoads: number;
  deliveredLoads: number;
  cancelledLoads: number;
  activeLoads: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
  averageLoadValue: number;
  totalRevenue: number;
  utilizationRate: number;
  customerSatisfactionScore: number;
}

export interface TrendAnalysis {
  period: string;
  metrics: AnalyticsMetrics;
  comparison: {
    previousPeriod: AnalyticsMetrics;
    percentChange: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface PerformanceReport {
  summary: AnalyticsMetrics;
  trends: TrendAnalysis[];
  topRoutes: any[];
  carrierPerformance: any[];
  loadTypeAnalysis: any[];
  geographicAnalysis: any[];
  recommendations: string[];
}

@Injectable()
export class LoadAnalyticsV2Service {
  private readonly logger = new Logger(LoadAnalyticsV2Service.name);

  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
  ) {}

  /**
   * Get comprehensive analytics for a specific period
   */
  async getAnalytics(
    tenantId: string,
    period: { start: Date; end: Date },
  ): Promise<AnalyticsMetrics> {
    try {
      const queryBuilder = this.loadRepository
        .createQueryBuilder('load')
        .where('load.tenantId = :tenantId', { tenantId })
        .andWhere('load.createdAt BETWEEN :start AND :end', period);

      const [loads, totalLoads] = await queryBuilder.getManyAndCount();

      const deliveredLoads = loads.filter(
        (load) => load.status === LoadStatus.DELIVERED,
      ).length;
      const cancelledLoads = loads.filter(
        (load) => load.status === LoadStatus.CANCELLED,
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
      const averageLoadValue =
        loads.reduce((sum, load) => sum + load.loadValue, 0) / loads.length ||
        0;

      // Calculate delivery metrics
      const deliveredWithTiming = loads.filter(
        (load) => load.status === LoadStatus.DELIVERED && load.deliveryDate,
      );

      const onTimeDeliveries = deliveredWithTiming.filter((load) => {
        // Assume delivery is on time if within 4 hours of scheduled time
        const scheduledTime = new Date(load.deliveryDate).getTime();
        const actualTime = new Date(load.updatedAt).getTime();
        return Math.abs(actualTime - scheduledTime) <= 4 * 60 * 60 * 1000;
      }).length;

      const onTimeDeliveryRate =
        deliveredWithTiming.length > 0
          ? (onTimeDeliveries / deliveredWithTiming.length) * 100
          : 0;

      const averageDeliveryTime =
        this.calculateAverageDeliveryTime(deliveredWithTiming);

      // Calculate utilization rate
      const utilizationRate = this.calculateUtilizationRate(loads);

      // Calculate customer satisfaction
      const ratedLoads = loads.filter((load) => load.rating > 0);
      const customerSatisfactionScore =
        ratedLoads.length > 0
          ? ratedLoads.reduce((sum, load) => sum + load.rating, 0) /
            ratedLoads.length
          : 0;

      return {
        totalLoads,
        deliveredLoads,
        cancelledLoads,
        activeLoads,
        averageDeliveryTime,
        onTimeDeliveryRate,
        averageLoadValue,
        totalRevenue,
        utilizationRate,
        customerSatisfactionScore,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get analytics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get trend analysis comparing multiple periods
   */
  async getTrendAnalysis(
    tenantId: string,
    periods: string[],
  ): Promise<TrendAnalysis[]> {
    const trends: TrendAnalysis[] = [];

    for (let i = 0; i < periods.length; i++) {
      const currentPeriod = this.parsePeriod(periods[i]);
      const previousPeriod = i > 0 ? this.parsePeriod(periods[i - 1]) : null;

      const currentMetrics = await this.getAnalytics(tenantId, currentPeriod);
      const previousMetrics = previousPeriod
        ? await this.getAnalytics(tenantId, previousPeriod)
        : null;

      let percentChange = 0;
      let trend: 'up' | 'down' | 'stable' = 'stable';

      if (previousMetrics) {
        percentChange =
          previousMetrics.totalRevenue > 0
            ? ((currentMetrics.totalRevenue - previousMetrics.totalRevenue) /
                previousMetrics.totalRevenue) *
              100
            : 0;

        if (percentChange > 5) trend = 'up';
        else if (percentChange < -5) trend = 'down';
      }

      trends.push({
        period: periods[i],
        metrics: currentMetrics,
        comparison: {
          previousPeriod: previousMetrics || ({} as AnalyticsMetrics),
          percentChange,
          trend,
        },
      });
    }

    return trends;
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(
    tenantId: string,
    period: { start: Date; end: Date },
  ): Promise<PerformanceReport> {
    try {
      const summary = await this.getAnalytics(tenantId, period);
      const trends = await this.getTrendAnalysis(tenantId, [
        'current_month',
        'previous_month',
      ]);
      const topRoutes = await this.getTopRoutes(tenantId, period);
      const carrierPerformance = await this.getCarrierPerformance(
        tenantId,
        period,
      );
      const loadTypeAnalysis = await this.getLoadTypeAnalysis(tenantId, period);
      const geographicAnalysis = await this.getGeographicAnalysis(
        tenantId,
        period,
      );
      const recommendations = this.generateRecommendations(summary, trends);

      return {
        summary,
        trends,
        topRoutes,
        carrierPerformance,
        loadTypeAnalysis,
        geographicAnalysis,
        recommendations,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate performance report: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get load distribution analytics
   */
  async getLoadDistribution(
    tenantId: string,
    groupBy: 'status' | 'cargoType' | 'urgencyLevel' | 'month',
  ): Promise<any> {
    const queryBuilder = this.loadRepository
      .createQueryBuilder('load')
      .where('load.tenantId = :tenantId', { tenantId })
      .select(`load.${groupBy}`, 'category')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(load.loadValue)', 'averageValue')
      .addSelect('SUM(load.offeredPrice)', 'totalRevenue')
      .groupBy(`load.${groupBy}`);

    if (groupBy === 'month') {
      queryBuilder
        .select('EXTRACT(MONTH FROM load.createdAt)', 'category')
        .addSelect('EXTRACT(YEAR FROM load.createdAt)', 'year')
        .groupBy(
          'EXTRACT(MONTH FROM load.createdAt), EXTRACT(YEAR FROM load.createdAt)',
        )
        .orderBy('year, category');
    }

    const results = await queryBuilder.getRawMany();

    return results.map((result) => ({
      category: result.category,
      count: parseInt(result.count),
      averageValue: parseFloat(result.averageValue || 0),
      totalRevenue: parseFloat(result.totalRevenue || 0),
      year: result.year ? parseInt(result.year) : undefined,
    }));
  }

  /**
   * Get efficiency metrics
   */
  async getEfficiencyMetrics(
    tenantId: string,
    period: { start: Date; end: Date },
  ): Promise<any> {
    const loads = await this.loadRepository.find({
      where: {
        tenantId,
        createdAt: Between(period.start, period.end),
      },
    });

    const metrics = {
      averageTimeToPublish: this.calculateAverageTimeToPublish(loads),
      averageTimeToAssign: this.calculateAverageTimeToAssign(loads),
      averageTimeInTransit: this.calculateAverageTimeInTransit(loads),
      loadCancellationRate:
        (loads.filter((l) => l.status === LoadStatus.CANCELLED).length /
          loads.length) *
        100,
      autoMatchSuccessRate: this.calculateAutoMatchSuccessRate(loads),
      ratingDistribution: this.calculateRatingDistribution(loads),
    };

    return metrics;
  }

  // Private helper methods

  private calculateAverageDeliveryTime(loads: Load[]): number {
    if (loads.length === 0) return 0;

    const totalTime = loads.reduce((sum, load) => {
      const pickupTime = new Date(load.pickupDate).getTime();
      const deliveryTime = new Date(load.updatedAt).getTime(); // Assuming updatedAt is delivery time
      return sum + (deliveryTime - pickupTime);
    }, 0);

    return totalTime / loads.length / (1000 * 60 * 60); // Convert to hours
  }

  private calculateUtilizationRate(loads: Load[]): number {
    // Calculate based on how well truck capacity is utilized
    // This is a simplified calculation
    const utilizationScores = loads
      .filter((load) => load.assignedTruckId)
      .map((load) => {
        // Mock calculation - in reality, would get truck capacity
        const truckCapacity = 25000; // kg
        return (load.weight / truckCapacity) * 100;
      });

    return utilizationScores.length > 0
      ? utilizationScores.reduce((sum, score) => sum + score, 0) /
          utilizationScores.length
      : 0;
  }

  private parsePeriod(period: string): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (period) {
      case 'current_month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'previous_month':
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        // Default to current month
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }

  private async getTopRoutes(
    tenantId: string,
    period: { start: Date; end: Date },
  ): Promise<any[]> {
    // Implementation would analyze route frequency and performance
    return [
      { route: 'New York - Los Angeles', frequency: 45, averageRevenue: 3500 },
      { route: 'Chicago - Miami', frequency: 32, averageRevenue: 2800 },
      { route: 'Houston - Seattle', frequency: 28, averageRevenue: 4200 },
    ];
  }

  private async getCarrierPerformance(
    tenantId: string,
    period: { start: Date; end: Date },
  ): Promise<any[]> {
    // Implementation would analyze carrier performance metrics
    return [
      {
        carrierId: 'carrier1',
        name: 'Fast Freight LLC',
        rating: 4.8,
        onTimeRate: 96,
        totalLoads: 124,
      },
      {
        carrierId: 'carrier2',
        name: 'Reliable Transport',
        rating: 4.6,
        onTimeRate: 94,
        totalLoads: 98,
      },
    ];
  }

  private async getLoadTypeAnalysis(
    tenantId: string,
    period: { start: Date; end: Date },
  ): Promise<any[]> {
    return await this.getLoadDistribution(tenantId, 'cargoType');
  }

  private async getGeographicAnalysis(
    tenantId: string,
    period: { start: Date; end: Date },
  ): Promise<any[]> {
    // Implementation would analyze geographic distribution
    return [
      { region: 'West Coast', loadCount: 156, revenue: 425000 },
      { region: 'East Coast', loadCount: 143, revenue: 398000 },
      { region: 'Midwest', loadCount: 98, revenue: 267000 },
    ];
  }

  private generateRecommendations(
    metrics: AnalyticsMetrics,
    trends: TrendAnalysis[],
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.onTimeDeliveryRate < 90) {
      recommendations.push(
        'On-time delivery rate is below target. Consider reviewing carrier selection criteria.',
      );
    }

    if (metrics.utilizationRate < 75) {
      recommendations.push(
        'Truck utilization is low. Consider load consolidation or routing optimization.',
      );
    }

    if (metrics.customerSatisfactionScore < 4.0) {
      recommendations.push(
        'Customer satisfaction needs improvement. Focus on service quality and communication.',
      );
    }

    if (trends.length > 0 && trends[0].comparison.trend === 'down') {
      recommendations.push(
        'Revenue trend is declining. Review pricing strategy and market positioning.',
      );
    }

    if (metrics.cancelledLoads / metrics.totalLoads > 0.1) {
      recommendations.push(
        'High cancellation rate. Review load validation and carrier matching processes.',
      );
    }

    return recommendations;
  }

  private calculateAverageTimeToPublish(loads: Load[]): number {
    const publishedLoads = loads.filter((load) => load.publishedAt);
    if (publishedLoads.length === 0) return 0;

    const totalTime = publishedLoads.reduce((sum, load) => {
      const created = new Date(load.createdAt).getTime();
      const published = new Date(load.publishedAt).getTime();
      return sum + (published - created);
    }, 0);

    return totalTime / publishedLoads.length / (1000 * 60); // Convert to minutes
  }

  private calculateAverageTimeToAssign(loads: Load[]): number {
    const assignedLoads = loads.filter(
      (load) => load.assignedTruckId && load.publishedAt,
    );
    if (assignedLoads.length === 0) return 0;

    const totalTime = assignedLoads.reduce((sum, load) => {
      const published = new Date(load.publishedAt).getTime();
      const assigned = new Date(load.updatedAt).getTime(); // Approximation
      return sum + (assigned - published);
    }, 0);

    return totalTime / assignedLoads.length / (1000 * 60 * 60); // Convert to hours
  }

  private calculateAverageTimeInTransit(loads: Load[]): number {
    const deliveredLoads = loads.filter(
      (load) => load.status === LoadStatus.DELIVERED,
    );
    if (deliveredLoads.length === 0) return 0;

    return this.calculateAverageDeliveryTime(deliveredLoads);
  }

  private calculateAutoMatchSuccessRate(loads: Load[]): number {
    // This would require tracking which loads were auto-matched
    // For now, return a mock value
    return 65; // 65% success rate
  }

  private calculateRatingDistribution(loads: Load[]): any {
    const ratedLoads = loads.filter((load) => load.rating > 0);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    ratedLoads.forEach((load) => {
      const rating = Math.floor(load.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });

    return distribution;
  }

  private async storeAnalytics(
    tenantId: string,
    date: Date,
    analytics: AnalyticsMetrics,
  ): Promise<void> {
    // Implementation would store analytics in a dedicated analytics table
    this.logger.log(
      `Storing analytics for tenant ${tenantId} on ${date.toISOString().split('T')[0]}`,
    );
  }
}
