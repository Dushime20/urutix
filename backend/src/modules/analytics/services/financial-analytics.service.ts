import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { CargoOwnerAnalytics } from '../../../entities/cargo-owner-analytics.entity';
import { CreditTransaction, CreditTransactionType } from '../../../entities/credit-transaction.entity';
import {
  CostFiltersDto,
  ProfitabilityFiltersDto,
  CostTrendsResponseDto,
  ProfitabilityAnalysisResponseDto,
  RouteSpecDto,
  PricingRecommendationDto,
  FinancialSummaryDto,
  TimeRange,
  GroupBy,
} from '../dto/financial-analytics.dto';

@Injectable()
export class FinancialAnalyticsService {
  constructor(
    @InjectRepository(CargoOwnerAnalytics)
    private analyticsRepository: Repository<CargoOwnerAnalytics>,
    @InjectRepository(CreditTransaction)
    private creditTransactionRepository: Repository<CreditTransaction>,
  ) {}

  /**
   * Get cost trends analysis using existing credit transaction data and analytics data
   */
  async getCostTrends(
    tenantId: string,
    cargoOwnerId: string,
    filters: CostFiltersDto,
  ): Promise<CostTrendsResponseDto> {
    // Build date range
    const dateRange = this.buildDateRange(filters.timeRange, filters.dateRange);
    
    // Build query with tenant isolation (existing pattern)
    const queryBuilder = this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId });

    // Apply date filters
    if (dateRange.start) {
      queryBuilder.andWhere('analytics.bookingDate >= :startDate', { startDate: dateRange.start });
    }
    if (dateRange.end) {
      queryBuilder.andWhere('analytics.bookingDate <= :endDate', { endDate: dateRange.end });
    }

    // Apply additional filters
    this.applyFilters(queryBuilder, filters);

    // Group by time period
    const groupByClause = this.buildGroupByClause(filters.groupBy || GroupBy.WEEK);
    
    const trends = await queryBuilder
      .select([
        `${groupByClause} as date`,
        'SUM(analytics.totalCost) as totalCost',
        'AVG(analytics.totalCost) as averageCost',
        'COUNT(*) as shipmentCount',
        'AVG(analytics.costPerKm) as costPerKm',
        'AVG(analytics.costPerKg) as costPerKg',
      ])
      .groupBy(groupByClause)
      .orderBy('date', 'ASC')
      .getRawMany();

    // Calculate summary metrics
    const summary = await this.calculateCostSummary(tenantId, cargoOwnerId, dateRange);

    return {
      trends: trends.map(trend => ({
        date: trend.date,
        totalCost: Number(trend.totalCost) || 0,
        averageCost: Number(trend.averageCost) || 0,
        shipmentCount: Number(trend.shipmentCount) || 0,
        costPerKm: Number(trend.costPerKm) || 0,
        costPerKg: Number(trend.costPerKg) || 0,
      })),
      ...summary,
    };
  }

  /**
   * Get shipment profitability analysis using existing Load and pricing data
   */
  async getShipmentProfitability(
    tenantId: string,
    cargoOwnerId: string,
    filters: ProfitabilityFiltersDto,
  ): Promise<ProfitabilityAnalysisResponseDto> {
    const dateRange = this.buildDateRange(filters.timeRange, filters.dateRange);
    
    const queryBuilder = this.analyticsRepository
      .createQueryBuilder('analytics')
      .leftJoinAndSelect('analytics.load', 'load')
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId });

    // Apply date and other filters
    if (dateRange.start) {
      queryBuilder.andWhere('analytics.bookingDate >= :startDate', { startDate: dateRange.start });
    }
    if (dateRange.end) {
      queryBuilder.andWhere('analytics.bookingDate <= :endDate', { endDate: dateRange.end });
    }

    this.applyFilters(queryBuilder, filters);

    // Apply profitability-specific filters
    if (filters.minProfitMargin !== undefined) {
      queryBuilder.andWhere('analytics.profitMargin >= :minProfitMargin', { 
        minProfitMargin: filters.minProfitMargin 
      });
    }
    if (filters.maxProfitMargin !== undefined) {
      queryBuilder.andWhere('analytics.profitMargin <= :maxProfitMargin', { 
        maxProfitMargin: filters.maxProfitMargin 
      });
    }
    if (filters.profitableOnly) {
      queryBuilder.andWhere('analytics.profitMargin > 0');
    }

    const analyticsData = await queryBuilder.getMany();

    // Transform to response format
    const shipments = analyticsData.map(analytics => ({
      loadId: analytics.loadId,
      route: `${analytics.originCity || 'Unknown'} → ${analytics.destinationCity || 'Unknown'}`,
      totalCost: analytics.totalCost || 0,
      revenue: analytics.load?.loadValue ? Number(analytics.load.loadValue) : undefined,
      profitMargin: analytics.profitMargin || 0,
      cargoWeightKg: analytics.cargoWeightKg || 0,
      costPerKg: analytics.costPerKg || 0,
      distanceKm: analytics.distanceKm,
      costPerKm: analytics.costPerKm,
      bookingDate: analytics.bookingDate || analytics.createdAt,
      deliveryStatus: analytics.load?.status || 'Unknown',
    }));

    // Calculate analysis metrics
    const profitableShipments = shipments.filter(s => s.profitMargin > 0).length;
    const unprofitableShipments = shipments.length - profitableShipments;
    const averageProfitMargin = shipments.reduce((sum, s) => sum + s.profitMargin, 0) / shipments.length || 0;

    // Find most/least profitable routes
    const routeProfitability = this.calculateRouteProfitability(shipments);
    const mostProfitableRoute = routeProfitability.length > 0 ? routeProfitability[0].route : undefined;
    const leastProfitableRoute = routeProfitability.length > 0 ? 
      routeProfitability[routeProfitability.length - 1].route : undefined;

    return {
      shipments,
      averageProfitMargin,
      mostProfitableRoute,
      leastProfitableRoute,
      profitableShipments,
      unprofitableShipments,
      trend: this.calculateProfitabilityTrend(shipments),
    };
  }

  /**
   * Get pricing recommendations (placeholder - will integrate with PricingService later)
   */
  async getPricingRecommendations(
    tenantId: string,
    routeSpec: RouteSpecDto,
  ): Promise<PricingRecommendationDto> {
    // TODO: Integrate with existing pricing service
    // const currentPricing = await this.pricingService.calculateCost(...);

    // Get historical data for this route
    const routeHash = CargoOwnerAnalytics.generateRouteHash(routeSpec.originCity, routeSpec.destinationCity);
    const historicalData = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.routeHash = :routeHash', { routeHash })
      .andWhere('analytics.bookingDate >= :threeMonthsAgo', { 
        threeMonthsAgo: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) 
      })
      .getMany();

    // Calculate market-based recommendations
    const averageMarketPrice = historicalData.reduce((sum, data) => sum + (data.totalCost || 0), 0) / 
      (historicalData.length || 1);
    
    // Placeholder pricing calculation
    const currentPrice = averageMarketPrice * 1.1; // Assume 10% above market average
    const recommendedPrice = this.calculateRecommendedPrice(currentPrice, averageMarketPrice, routeSpec);
    const potentialSavings = Math.max(0, currentPrice - recommendedPrice);
    
    return {
      currentPrice,
      recommendedPrice,
      potentialSavings,
      confidence: this.calculateConfidence(historicalData.length),
      reasoning: this.generatePricingReasoning(currentPrice, averageMarketPrice, historicalData.length),
      alternatives: await this.generateAlternatives(tenantId, routeSpec, recommendedPrice),
      marketFactors: this.identifyMarketFactors(historicalData),
    };
  }

  /**
   * Get financial summary for dashboard
   */
  async getFinancialSummary(
    tenantId: string,
    cargoOwnerId: string,
    filters: CostFiltersDto,
  ): Promise<FinancialSummaryDto> {
    const dateRange = this.buildDateRange(filters.timeRange, filters.dateRange);
    const previousPeriod = this.calculatePreviousPeriod(dateRange);

    // Current period metrics
    const currentMetrics = await this.calculatePeriodMetrics(tenantId, cargoOwnerId, dateRange);
    const previousMetrics = await this.calculatePeriodMetrics(tenantId, cargoOwnerId, previousPeriod);

    // Calculate changes
    const spendingChange = {
      amount: currentMetrics.totalSpending - previousMetrics.totalSpending,
      percentage: previousMetrics.totalSpending > 0 ? 
        ((currentMetrics.totalSpending - previousMetrics.totalSpending) / previousMetrics.totalSpending) * 100 : 0,
      trend: this.determineTrend(currentMetrics.totalSpending, previousMetrics.totalSpending),
    };

    return {
      totalSpending: currentMetrics.totalSpending,
      averageCostPerShipment: currentMetrics.averageCostPerShipment,
      averageCostPerKg: currentMetrics.averageCostPerKg,
      averageCostPerKm: currentMetrics.averageCostPerKm,
      spendingChange,
      topCategories: await this.getTopSpendingCategories(tenantId, cargoOwnerId, dateRange),
      efficiency: await this.calculateEfficiencyMetrics(tenantId, cargoOwnerId, dateRange, previousPeriod),
    };
  }
  // Private helper methods

  private buildDateRange(timeRange?: TimeRange, customRange?: { startDate: string; endDate: string }) {
    if (timeRange === TimeRange.CUSTOM && customRange) {
      return {
        start: new Date(customRange.startDate),
        end: new Date(customRange.endDate),
      };
    }

    const now = new Date();
    const ranges = {
      [TimeRange.LAST_7_DAYS]: { 
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), 
        end: now 
      },
      [TimeRange.LAST_30_DAYS]: { 
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), 
        end: now 
      },
      [TimeRange.LAST_90_DAYS]: { 
        start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), 
        end: now 
      },
      [TimeRange.LAST_6_MONTHS]: { 
        start: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), 
        end: now 
      },
      [TimeRange.LAST_YEAR]: { 
        start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), 
        end: now 
      },
    };

    return ranges[timeRange || TimeRange.LAST_30_DAYS] || ranges[TimeRange.LAST_30_DAYS];
  }

  private applyFilters(queryBuilder: any, filters: CostFiltersDto) {
    if (filters.cargoType) {
      queryBuilder.andWhere('analytics.cargoType = :cargoType', { cargoType: filters.cargoType });
    }
    if (filters.originCity) {
      queryBuilder.andWhere('analytics.originCity = :originCity', { originCity: filters.originCity });
    }
    if (filters.destinationCity) {
      queryBuilder.andWhere('analytics.destinationCity = :destinationCity', { destinationCity: filters.destinationCity });
    }
    if (filters.carrierId) {
      queryBuilder.andWhere('analytics.carrierId = :carrierId', { carrierId: filters.carrierId });
    }
    if (filters.minCost !== undefined) {
      queryBuilder.andWhere('analytics.totalCost >= :minCost', { minCost: filters.minCost });
    }
    if (filters.maxCost !== undefined) {
      queryBuilder.andWhere('analytics.totalCost <= :maxCost', { maxCost: filters.maxCost });
    }
  }

  private buildGroupByClause(groupBy: GroupBy): string {
    const groupByClauses = {
      [GroupBy.DAY]: "DATE_TRUNC('day', analytics.bookingDate)",
      [GroupBy.WEEK]: "DATE_TRUNC('week', analytics.bookingDate)",
      [GroupBy.MONTH]: "DATE_TRUNC('month', analytics.bookingDate)",
      [GroupBy.QUARTER]: "DATE_TRUNC('quarter', analytics.bookingDate)",
      [GroupBy.YEAR]: "DATE_TRUNC('year', analytics.bookingDate)",
    };
    return groupByClauses[groupBy] || groupByClauses[GroupBy.WEEK];
  }

  private async calculateCostSummary(tenantId: string, cargoOwnerId: string, dateRange: any) {
    const summary = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'SUM(analytics.totalCost) as totalCost',
        'AVG(analytics.totalCost) as averageCostPerShipment',
        'COUNT(*) as totalShipments',
      ])
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .andWhere('analytics.bookingDate BETWEEN :start AND :end', dateRange)
      .getRawOne();

    // Calculate previous period for comparison
    const previousPeriod = this.calculatePreviousPeriod(dateRange);
    const previousSummary = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('SUM(analytics.totalCost) as totalCost')
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .andWhere('analytics.bookingDate BETWEEN :start AND :end', previousPeriod)
      .getRawOne();

    const currentTotal = Number(summary.totalCost) || 0;
    const previousTotal = Number(previousSummary.totalCost) || 0;
    const costChangePercentage = previousTotal > 0 ? 
      ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    return {
      totalCost: currentTotal,
      averageCostPerShipment: Number(summary.averageCostPerShipment) || 0,
      totalShipments: Number(summary.totalShipments) || 0,
      costChangePercentage,
      comparisonPeriod: 'Previous Period',
    };
  }

  private calculatePreviousPeriod(dateRange: any) {
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    return {
      start: new Date(dateRange.start.getTime() - duration),
      end: dateRange.start,
    };
  }

  private calculateRouteProfitability(shipments: any[]) {
    const routeMap = new Map();
    
    shipments.forEach(shipment => {
      if (!routeMap.has(shipment.route)) {
        routeMap.set(shipment.route, { totalMargin: 0, count: 0 });
      }
      const route = routeMap.get(shipment.route);
      route.totalMargin += shipment.profitMargin;
      route.count += 1;
    });

    return Array.from(routeMap.entries())
      .map(([route, data]) => ({
        route,
        averageMargin: data.totalMargin / data.count,
      }))
      .sort((a, b) => b.averageMargin - a.averageMargin);
  }

  private calculateProfitabilityTrend(shipments: any[]): string {
    if (shipments.length < 2) return 'stable';
    
    // Simple trend calculation based on recent vs older shipments
    const midpoint = Math.floor(shipments.length / 2);
    const recentAvg = shipments.slice(0, midpoint).reduce((sum, s) => sum + s.profitMargin, 0) / midpoint;
    const olderAvg = shipments.slice(midpoint).reduce((sum, s) => sum + s.profitMargin, 0) / (shipments.length - midpoint);
    
    const difference = recentAvg - olderAvg;
    if (Math.abs(difference) < 1) return 'stable';
    return difference > 0 ? 'improving' : 'declining';
  }

  private calculateRecommendedPrice(currentPrice: number, marketPrice: number, routeSpec: RouteSpecDto): number {
    // Simple recommendation logic - can be enhanced with ML
    const weightedPrice = (currentPrice * 0.3) + (marketPrice * 0.7);
    return Math.round(weightedPrice * 100) / 100;
  }

  private calculateConfidence(dataPoints: number): number {
    // Confidence based on available data points
    if (dataPoints >= 20) return 0.9;
    if (dataPoints >= 10) return 0.7;
    if (dataPoints >= 5) return 0.5;
    return 0.3;
  }

  private generatePricingReasoning(currentPrice: number, marketPrice: number, dataPoints: number): string {
    if (dataPoints < 3) {
      return 'Limited historical data available. Recommendation based on current pricing trends.';
    }
    
    const difference = ((currentPrice - marketPrice) / marketPrice) * 100;
    if (Math.abs(difference) < 5) {
      return 'Current pricing is aligned with market rates.';
    } else if (difference > 0) {
      return `Current pricing is ${difference.toFixed(1)}% above market average. Consider negotiating for better rates.`;
    } else {
      return `Current pricing is ${Math.abs(difference).toFixed(1)}% below market average. Good value opportunity.`;
    }
  }

  private async generateAlternatives(tenantId: string, routeSpec: RouteSpecDto, recommendedPrice: number) {
    // This would integrate with carrier data in a full implementation
    return [
      {
        option: 'Alternative Carrier A',
        price: recommendedPrice * 0.9,
        savings: recommendedPrice * 0.1,
        tradeoffs: ['Slightly longer transit time', 'Good reliability rating'],
      },
      {
        option: 'Alternative Route',
        price: recommendedPrice * 0.95,
        savings: recommendedPrice * 0.05,
        tradeoffs: ['Different pickup/delivery locations', 'Faster transit'],
      },
    ];
  }

  private identifyMarketFactors(historicalData: CargoOwnerAnalytics[]): string[] {
    const factors = [];
    
    if (historicalData.length > 0) {
      const seasonalData = historicalData.reduce((acc, data) => {
        const season = data.season || 'unknown';
        acc[season] = (acc[season] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const dominantSeason = Object.keys(seasonalData).reduce((a, b) => 
        seasonalData[a] > seasonalData[b] ? a : b
      );
      
      factors.push(`Seasonal patterns (${dominantSeason} dominant)`);
    }
    
    factors.push('Market demand fluctuations', 'Fuel price variations');
    return factors;
  }

  private async calculatePeriodMetrics(tenantId: string, cargoOwnerId: string, dateRange: any) {
    const metrics = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'SUM(analytics.totalCost) as totalSpending',
        'AVG(analytics.totalCost) as averageCostPerShipment',
        'AVG(analytics.costPerKg) as averageCostPerKg',
        'AVG(analytics.costPerKm) as averageCostPerKm',
        'COUNT(*) as shipmentCount',
      ])
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .andWhere('analytics.bookingDate BETWEEN :start AND :end', dateRange)
      .getRawOne();

    return {
      totalSpending: Number(metrics.totalSpending) || 0,
      averageCostPerShipment: Number(metrics.averageCostPerShipment) || 0,
      averageCostPerKg: Number(metrics.averageCostPerKg) || 0,
      averageCostPerKm: Number(metrics.averageCostPerKm) || 0,
      shipmentCount: Number(metrics.shipmentCount) || 0,
    };
  }

  private determineTrend(current: number, previous: number): 'increasing' | 'decreasing' | 'stable' {
    const changePercent = previous > 0 ? Math.abs((current - previous) / previous) * 100 : 0;
    if (changePercent < 5) return 'stable';
    return current > previous ? 'increasing' : 'decreasing';
  }

  private async getTopSpendingCategories(tenantId: string, cargoOwnerId: string, dateRange: any) {
    const categories = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'analytics.cargoType as category',
        'SUM(analytics.totalCost) as amount',
      ])
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .andWhere('analytics.bookingDate BETWEEN :start AND :end', dateRange)
      .groupBy('analytics.cargoType')
      .orderBy('amount', 'DESC')
      .limit(5)
      .getRawMany();

    const total = categories.reduce((sum, cat) => sum + Number(cat.amount), 0);
    
    return categories.map(cat => ({
      category: cat.category || 'Unknown',
      amount: Number(cat.amount),
      percentage: total > 0 ? (Number(cat.amount) / total) * 100 : 0,
    }));
  }

  private async calculateEfficiencyMetrics(tenantId: string, cargoOwnerId: string, currentPeriod: any, previousPeriod: any): Promise<{
    costPerKgTrend: 'stable' | 'improving' | 'declining';
    costPerKmTrend: 'stable' | 'improving' | 'declining';
    overallEfficiency: number;
  }> {
    const current = await this.calculatePeriodMetrics(tenantId, cargoOwnerId, currentPeriod);
    const previous = await this.calculatePeriodMetrics(tenantId, cargoOwnerId, previousPeriod);

    return {
      costPerKgTrend: this.mapTrendToEfficiency(this.determineTrend(current.averageCostPerKg, previous.averageCostPerKg)),
      costPerKmTrend: this.mapTrendToEfficiency(this.determineTrend(current.averageCostPerKm, previous.averageCostPerKm)),
      overallEfficiency: this.calculateOverallEfficiency(current, previous),
    };
  }

  private mapTrendToEfficiency(trend: 'increasing' | 'decreasing' | 'stable'): 'stable' | 'improving' | 'declining' {
    switch (trend) {
      case 'decreasing': return 'improving'; // Lower costs = improving efficiency
      case 'increasing': return 'declining'; // Higher costs = declining efficiency
      case 'stable': return 'stable';
    }
  }

  private calculateOverallEfficiency(current: any, previous: any): number {
    // Simple efficiency score based on cost improvements
    let score = 50; // Base score
    
    if (previous.averageCostPerKg > 0) {
      const kgImprovement = (previous.averageCostPerKg - current.averageCostPerKg) / previous.averageCostPerKg;
      score += kgImprovement * 25;
    }
    
    if (previous.averageCostPerKm > 0) {
      const kmImprovement = (previous.averageCostPerKm - current.averageCostPerKm) / previous.averageCostPerKm;
      score += kmImprovement * 25;
    }
    
    return Math.max(0, Math.min(100, score));
  }
}