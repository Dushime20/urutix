import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CargoOwnerAnalytics } from '../../../entities/cargo-owner-analytics.entity';

@Injectable()
export class PredictiveAnalyticsService {
  private readonly logger = new Logger(PredictiveAnalyticsService.name);

  constructor(
    @InjectRepository(CargoOwnerAnalytics)
    private analyticsRepository: Repository<CargoOwnerAnalytics>,
  ) {}

  /**
   * Predict future costs using time series analysis
   */
  async predictCosts(
    tenantId: string,
    cargoOwnerId: string,
    routeHash?: string,
    daysAhead: number = 30
  ) {
    const historicalData = await this.getTimeSeriesData(
      tenantId, 
      cargoOwnerId, 
      routeHash, 
      90 // 90 days of history
    );

    if (historicalData.length < 10) {
      return {
        prediction: null,
        confidence: 0,
        error: 'Insufficient historical data for prediction'
      };
    }

    return this.performTimeSeriesForecasting(historicalData, daysAhead);
  }

  /**
   * Predict carrier performance trends
   */
  async predictCarrierPerformance(
    tenantId: string,
    cargoOwnerId: string,
    carrierId: string,
    daysAhead: number = 30
  ) {
    const carrierHistory = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .andWhere('analytics.carrierId = :carrierId', { carrierId })
      .orderBy('analytics.bookingDate', 'DESC')
      .limit(100)
      .getMany();

    return this.analyzeCarrierTrends(carrierHistory, daysAhead);
  }

  /**
   * Predict seasonal demand patterns
   */
  async predictSeasonalDemand(
    tenantId: string,
    cargoOwnerId: string,
    cargoType?: string
  ) {
    const seasonalData = await this.getSeasonalData(tenantId, cargoOwnerId, cargoType);
    return this.analyzeSeasonalPatterns(seasonalData);
  }

  /**
   * Predict route efficiency changes
   */
  async predictRouteEfficiency(
    tenantId: string,
    cargoOwnerId: string,
    routeHash: string
  ) {
    const routeHistory = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .andWhere('analytics.routeHash = :routeHash', { routeHash })
      .orderBy('analytics.bookingDate', 'DESC')
      .limit(50)
      .getMany();

    return this.analyzeRouteEfficiencyTrends(routeHistory);
  }

  private async getTimeSeriesData(
    tenantId: string,
    cargoOwnerId: string,
    routeHash?: string,
    daysBack: number = 90
  ) {
    const queryBuilder = this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'analytics.bookingDate',
        'analytics.totalCost',
        'analytics.costPerKm',
        'analytics.actualTransitHours'
      ])
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .andWhere('analytics.bookingDate >= :startDate', {
        startDate: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
      });

    if (routeHash) {
      queryBuilder.andWhere('analytics.routeHash = :routeHash', { routeHash });
    }

    return queryBuilder
      .orderBy('analytics.bookingDate', 'ASC')
      .getMany();
  }

  private performTimeSeriesForecasting(data: CargoOwnerAnalytics[], daysAhead: number) {
    // Simple exponential smoothing for cost prediction
    const costs = data.map(d => d.totalCost || 0);
    const alpha = 0.3; // Smoothing parameter
    
    let smoothedValues = [costs[0]];
    for (let i = 1; i < costs.length; i++) {
      smoothedValues[i] = alpha * costs[i] + (1 - alpha) * smoothedValues[i - 1];
    }

    // Calculate trend
    const trend = this.calculateTrend(smoothedValues.slice(-10));
    const lastSmoothed = smoothedValues[smoothedValues.length - 1];
    
    // Predict future values
    const predictions = [];
    for (let i = 1; i <= daysAhead; i++) {
      const predicted = lastSmoothed + (trend * i);
      predictions.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predictedCost: Math.max(0, predicted),
        confidence: Math.max(0.1, 0.9 - (i / daysAhead) * 0.4) // Confidence decreases over time
      });
    }

    return {
      predictions,
      trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
      trendStrength: Math.abs(trend),
      baselineCost: lastSmoothed,
      confidence: this.calculateOverallConfidence(data.length, Math.abs(trend))
    };
  }

  private analyzeCarrierTrends(history: CargoOwnerAnalytics[], daysAhead: number) {
    if (history.length < 5) {
      return {
        prediction: null,
        confidence: 0,
        error: 'Insufficient carrier history'
      };
    }

    // Analyze performance trends
    const recentPerformance = history.slice(0, 10);
    const olderPerformance = history.slice(10, 20);

    const recentOnTimeRate = recentPerformance.filter(h => h.onTimeDelivery).length / recentPerformance.length;
    const olderOnTimeRate = olderPerformance.length > 0 ? 
      olderPerformance.filter(h => h.onTimeDelivery).length / olderPerformance.length : recentOnTimeRate;

    const performanceTrend = recentOnTimeRate - olderOnTimeRate;
    
    // Predict future performance
    const predictedOnTimeRate = Math.max(0, Math.min(1, recentOnTimeRate + performanceTrend));
    
    return {
      currentPerformance: {
        onTimeRate: recentOnTimeRate,
        averageRating: recentPerformance.reduce((sum, h) => sum + (h.carrierRating || 0), 0) / recentPerformance.length
      },
      predictedPerformance: {
        onTimeRate: predictedOnTimeRate,
        trend: performanceTrend > 0.05 ? 'improving' : performanceTrend < -0.05 ? 'declining' : 'stable'
      },
      confidence: this.calculateOverallConfidence(history.length, Math.abs(performanceTrend)),
      recommendation: this.generateCarrierRecommendation(predictedOnTimeRate, performanceTrend)
    };
  }

  private async getSeasonalData(tenantId: string, cargoOwnerId: string, cargoType?: string) {
    const queryBuilder = this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'analytics.season',
        "DATE_PART('month', analytics.bookingDate) as month",
        'COUNT(*) as shipmentCount',
        'AVG(analytics.totalCost) as avgCost'
      ])
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId });

    if (cargoType) {
      queryBuilder.andWhere('analytics.cargoType = :cargoType', { cargoType });
    }

    return queryBuilder
      .groupBy('analytics.season, month')
      .orderBy('month', 'ASC')
      .getRawMany();
  }

  private analyzeSeasonalPatterns(seasonalData: any[]) {
    if (seasonalData.length < 4) {
      return {
        patterns: null,
        confidence: 0,
        error: 'Insufficient seasonal data'
      };
    }

    const monthlyPatterns = seasonalData.reduce((acc, data) => {
      const month = parseInt(data.month);
      if (!acc[month]) {
        acc[month] = { totalShipments: 0, totalCost: 0, count: 0 };
      }
      acc[month].totalShipments += parseInt(data.shipmentCount);
      acc[month].totalCost += parseFloat(data.avgCost) * parseInt(data.shipmentCount);
      acc[month].count += 1;
      return acc;
    }, {});

    // Calculate seasonal indices
    const monthlyValues = Object.values(monthlyPatterns) as any[];
    const avgMonthlyShipments = monthlyValues
      .reduce((sum: number, pattern: any) => sum + pattern.totalShipments, 0) / 12;

    const seasonalIndices = Object.entries(monthlyPatterns).map(([month, pattern]: [string, any]) => ({
      month: parseInt(month),
      seasonalIndex: pattern.totalShipments / avgMonthlyShipments,
      avgCost: pattern.totalCost / pattern.totalShipments
    }));

    // Identify peak and low seasons
    const peakMonth = seasonalIndices.reduce((max, current) => 
      current.seasonalIndex > max.seasonalIndex ? current : max
    );
    
    const lowMonth = seasonalIndices.reduce((min, current) => 
      current.seasonalIndex < min.seasonalIndex ? current : min
    );

    return {
      patterns: seasonalIndices,
      peakSeason: {
        month: peakMonth.month,
        multiplier: peakMonth.seasonalIndex
      },
      lowSeason: {
        month: lowMonth.month,
        multiplier: lowMonth.seasonalIndex
      },
      confidence: 0.8,
      nextMonthPrediction: this.predictNextMonthDemand(seasonalIndices, avgMonthlyShipments)
    };
  }

  private analyzeRouteEfficiencyTrends(routeHistory: CargoOwnerAnalytics[]) {
    if (routeHistory.length < 10) {
      return {
        prediction: null,
        confidence: 0,
        error: 'Insufficient route history'
      };
    }

    // Calculate efficiency metrics over time
    const efficiencyData = routeHistory.map(h => ({
      date: h.bookingDate,
      costPerKm: h.costPerKm || 0,
      transitTime: h.actualTransitHours || 0,
      onTime: h.onTimeDelivery ? 1 : 0
    }));

    // Analyze trends
    const recentData = efficiencyData.slice(0, 15);
    const olderData = efficiencyData.slice(15, 30);

    const recentAvgCostPerKm = recentData.reduce((sum, d) => sum + d.costPerKm, 0) / recentData.length;
    const olderAvgCostPerKm = olderData.length > 0 ? 
      olderData.reduce((sum, d) => sum + d.costPerKm, 0) / olderData.length : recentAvgCostPerKm;

    const costTrend = (recentAvgCostPerKm - olderAvgCostPerKm) / olderAvgCostPerKm;

    return {
      currentEfficiency: {
        avgCostPerKm: recentAvgCostPerKm,
        avgTransitTime: recentData.reduce((sum, d) => sum + d.transitTime, 0) / recentData.length,
        onTimeRate: recentData.reduce((sum, d) => sum + d.onTime, 0) / recentData.length
      },
      trends: {
        costTrend: costTrend > 0.05 ? 'increasing' : costTrend < -0.05 ? 'decreasing' : 'stable',
        costChange: costTrend * 100
      },
      prediction: {
        nextMonthCostPerKm: recentAvgCostPerKm * (1 + costTrend),
        confidence: this.calculateOverallConfidence(routeHistory.length, Math.abs(costTrend))
      }
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private calculateOverallConfidence(dataPoints: number, volatility: number): number {
    let confidence = Math.min(0.95, dataPoints / 50); // More data = higher confidence
    confidence *= Math.max(0.3, 1 - volatility * 2); // Lower volatility = higher confidence
    return Math.max(0.1, confidence);
  }

  private generateCarrierRecommendation(predictedOnTimeRate: number, trend: number): string {
    if (predictedOnTimeRate >= 0.9 && trend >= 0) return 'highly_recommended';
    if (predictedOnTimeRate >= 0.8 && trend >= -0.05) return 'recommended';
    if (predictedOnTimeRate >= 0.7) return 'acceptable_with_monitoring';
    return 'consider_alternatives';
  }

  private predictNextMonthDemand(seasonalIndices: any[], avgMonthlyShipments: number) {
    const currentMonth = new Date().getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    
    const nextMonthIndex = seasonalIndices.find(si => si.month === nextMonth);
    if (!nextMonthIndex) return null;

    return {
      predictedShipments: Math.round(avgMonthlyShipments * nextMonthIndex.seasonalIndex),
      seasonalMultiplier: nextMonthIndex.seasonalIndex,
      confidence: 0.75
    };
  }
}