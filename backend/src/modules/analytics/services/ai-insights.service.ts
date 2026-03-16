import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CargoOwnerAnalytics } from '../../../entities/cargo-owner-analytics.entity';
import { AnalyticsInsights } from '../../../entities/analytics-insights.entity';

@Injectable()
export class AIInsightsService {
  private readonly logger = new Logger(AIInsightsService.name);

  constructor(
    @InjectRepository(CargoOwnerAnalytics)
    private analyticsRepository: Repository<CargoOwnerAnalytics>,
    @InjectRepository(AnalyticsInsights)
    private insightsRepository: Repository<AnalyticsInsights>,
  ) {}

  /**
   * Generate AI-powered cost predictions
   */
  async generateCostPredictions(
    tenantId: string,
    cargoOwnerId: string,
    routeHash?: string,
    horizonDays: number = 30
  ) {
    // Get historical data for prediction
    const historicalData = await this.getHistoricalData(tenantId, cargoOwnerId, routeHash);
    
    if (historicalData.length < 5) {
      return {
        prediction: null,
        confidence: 0,
        reason: 'Insufficient historical data for reliable prediction'
      };
    }

    // Simple statistical prediction (can be enhanced with ML models)
    const predictions = this.calculateCostPredictions(historicalData, horizonDays);
    
    return predictions;
  }

  /**
   * Generate carrier performance predictions
   */
  async generateCarrierPredictions(
    tenantId: string,
    cargoOwnerId: string,
    carrierId: string
  ) {
    const carrierData = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .andWhere('analytics.carrierId = :carrierId', { carrierId })
      .orderBy('analytics.bookingDate', 'DESC')
      .limit(50)
      .getMany();

    return this.analyzeCarrierTrends(carrierData);
  }

  private async getHistoricalData(tenantId: string, cargoOwnerId: string, routeHash?: string) {
    const queryBuilder = this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId });

    if (routeHash) {
      queryBuilder.andWhere('analytics.routeHash = :routeHash', { routeHash });
    }

    return queryBuilder
      .orderBy('analytics.bookingDate', 'DESC')
      .limit(100)
      .getMany();
  }

  private calculateCostPredictions(data: CargoOwnerAnalytics[], horizonDays: number) {
    // Simple moving average prediction
    const recentData = data.slice(0, 20);
    const avgCost = recentData.reduce((sum, d) => sum + (d.totalCost || 0), 0) / recentData.length;
    
    // Calculate trend
    const trend = this.calculateTrend(recentData);
    const predictedCost = avgCost * (1 + trend * (horizonDays / 30));
    
    return {
      prediction: predictedCost,
      confidence: this.calculateConfidence(data.length, trend),
      trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
      baseline: avgCost
    };
  }

  private calculateTrend(data: CargoOwnerAnalytics[]): number {
    if (data.length < 2) return 0;
    
    const recent = data.slice(0, 10);
    const older = data.slice(10, 20);
    
    const recentAvg = recent.reduce((sum, d) => sum + (d.totalCost || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + (d.totalCost || 0), 0) / older.length;
    
    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  private calculateConfidence(dataPoints: number, trend: number): number {
    let confidence = Math.min(0.9, dataPoints / 50); // More data = higher confidence
    confidence *= (1 - Math.abs(trend)); // Lower volatility = higher confidence
    return Math.max(0.1, confidence);
  }

  private analyzeCarrierTrends(data: CargoOwnerAnalytics[]) {
    if (data.length === 0) return null;

    const onTimeRate = data.filter(d => d.onTimeDelivery).length / data.length;
    const avgRating = data.reduce((sum, d) => sum + (d.carrierRating || 0), 0) / data.length;
    const avgCost = data.reduce((sum, d) => sum + (d.totalCost || 0), 0) / data.length;

    return {
      predictedOnTimeRate: onTimeRate,
      predictedRating: avgRating,
      predictedCost: avgCost,
      confidence: this.calculateConfidence(data.length, 0),
      recommendation: this.generateCarrierRecommendation(onTimeRate, avgRating)
    };
  }

  private generateCarrierRecommendation(onTimeRate: number, avgRating: number): string {
    if (onTimeRate >= 0.9 && avgRating >= 4.0) return 'preferred';
    if (onTimeRate >= 0.75 && avgRating >= 3.0) return 'acceptable';
    return 'consider_alternatives';
  }

  /**
   * Generate route optimization recommendations
   */
  async generateRouteOptimizations(
    tenantId: string,
    cargoOwnerId: string
  ) {
    // Get route performance data
    const routeData = await this.analyticsRepository
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
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .groupBy('analytics.routeHash, analytics.originCity, analytics.destinationCity')
      .having('COUNT(*) >= 3') // Minimum data for reliable analysis
      .getRawMany();

    return this.analyzeRouteOptimizations(routeData);
  }

  /**
   * Generate demand forecasting insights
   */
  async generateDemandForecasts(
    tenantId: string,
    cargoOwnerId: string,
    cargoType?: string
  ) {
    const queryBuilder = this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        "DATE_TRUNC('month', analytics.bookingDate) as month",
        'COUNT(*) as shipmentCount',
        'AVG(analytics.totalCost) as avgCost'
      ])
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId });

    if (cargoType) {
      queryBuilder.andWhere('analytics.cargoType = :cargoType', { cargoType });
    }

    const monthlyData = await queryBuilder
      .groupBy("DATE_TRUNC('month', analytics.bookingDate)")
      .orderBy('month', 'ASC')
      .getRawMany();

    return this.forecastDemand(monthlyData);
  }

  /**
   * Generate risk alerts based on anomaly detection
   */
  async generateRiskAlerts(
    tenantId: string,
    cargoOwnerId: string
  ) {
    const recentData = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .andWhere('analytics.bookingDate >= :thirtyDaysAgo', {
        thirtyDaysAgo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      })
      .getMany();

    return this.detectAnomalies(recentData);
  }

  private analyzeRouteOptimizations(routeData: any[]): any[] {
    const optimizations = [];

    // Find high-cost routes
    const avgCostOverall = routeData.reduce((sum, r) => sum + Number(r.avgCost), 0) / routeData.length;
    const highCostRoutes = routeData.filter(r => Number(r.avgCost) > avgCostOverall * 1.2);

    highCostRoutes.forEach(route => {
      optimizations.push({
        type: 'cost_optimization',
        route: `${route.originCity} → ${route.destinationCity}`,
        issue: 'High cost compared to average',
        currentCost: Number(route.avgCost),
        potentialSavings: Number(route.avgCost) - avgCostOverall,
        confidence: 0.8,
        recommendations: [
          'Consider alternative carriers',
          'Negotiate volume discounts',
          'Explore route alternatives'
        ]
      });
    });

    // Find low performance routes
    const lowPerformanceRoutes = routeData.filter(r => Number(r.onTimeRate) < 0.8);
    
    lowPerformanceRoutes.forEach(route => {
      optimizations.push({
        type: 'performance_optimization',
        route: `${route.originCity} → ${route.destinationCity}`,
        issue: 'Low on-time delivery rate',
        currentRate: Number(route.onTimeRate) * 100,
        targetRate: 90,
        confidence: 0.75,
        recommendations: [
          'Review carrier performance',
          'Adjust delivery schedules',
          'Implement tracking improvements'
        ]
      });
    });

    return optimizations;
  }

  private async forecastDemand(monthlyData: any[]) {
    if (monthlyData.length < 3) {
      return {
        forecast: null,
        confidence: 0,
        reason: 'Insufficient historical data for demand forecasting'
      };
    }

    // Simple linear trend forecasting
    const shipmentCounts = monthlyData.map(d => Number(d.shipmentCount));
    const trend = this.calculateLinearTrend(shipmentCounts);
    
    const lastMonth = shipmentCounts[shipmentCounts.length - 1];
    const nextMonthForecast = lastMonth + trend;
    
    return {
      forecast: Math.max(0, Math.round(nextMonthForecast)),
      trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
      confidence: this.calculateConfidence(monthlyData.length, Math.abs(trend) / lastMonth),
      historicalAverage: shipmentCounts.reduce((a, b) => a + b, 0) / shipmentCounts.length
    };
  }

  private calculateLinearTrend(values: number[]): number {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices 0, 1, 2, ...
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares of indices

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private detectAnomalies(data: CargoOwnerAnalytics[]): any[] {
    const alerts = [];

    if (data.length < 10) return alerts;

    // Cost anomaly detection
    const costs = data.map(d => d.totalCost || 0);
    const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
    const stdDev = Math.sqrt(costs.reduce((sum, cost) => sum + Math.pow(cost - avgCost, 2), 0) / costs.length);
    
    const recentCosts = costs.slice(0, 5);
    const anomalousHighCosts = recentCosts.filter(cost => cost > avgCost + 2 * stdDev);
    
    if (anomalousHighCosts.length > 0) {
      alerts.push({
        type: 'cost_spike',
        severity: 'high',
        message: `Detected ${anomalousHighCosts.length} shipments with unusually high costs`,
        threshold: avgCost + 2 * stdDev,
        maxValue: Math.max(...anomalousHighCosts),
        confidence: 0.9
      });
    }

    // Performance anomaly detection
    const recentOnTimeRate = data.slice(0, 10).filter(d => d.onTimeDelivery).length / 10;
    const historicalOnTimeRate = data.filter(d => d.onTimeDelivery).length / data.length;
    
    if (recentOnTimeRate < historicalOnTimeRate - 0.2) {
      alerts.push({
        type: 'performance_drop',
        severity: 'medium',
        message: 'Recent on-time delivery rate significantly below historical average',
        currentRate: recentOnTimeRate * 100,
        historicalRate: historicalOnTimeRate * 100,
        confidence: 0.8
      });
    }

    return alerts;
  }

  /**
   * Generate comprehensive AI insights combining all analysis types
   */
  async generateComprehensiveInsights(
    tenantId: string,
    cargoOwnerId: string
  ) {
    try {
      const [
        costPredictions,
        routeOptimizations,
        demandForecasts,
        riskAlerts
      ] = await Promise.all([
        this.generateCostPredictions(tenantId, cargoOwnerId),
        this.generateRouteOptimizations(tenantId, cargoOwnerId),
        this.generateDemandForecasts(tenantId, cargoOwnerId),
        this.generateRiskAlerts(tenantId, cargoOwnerId)
      ]);

      return {
        costPredictions,
        routeOptimizations,
        demandForecasts,
        riskAlerts,
        generatedAt: new Date().toISOString(),
        summary: this.generateInsightsSummary({
          costPredictions,
          routeOptimizations,
          demandForecasts,
          riskAlerts
        })
      };
    } catch (error) {
      this.logger.error('Failed to generate comprehensive insights', error);
      throw error;
    }
  }

  private generateInsightsSummary(insights: any): any {
    const summary = {
      totalInsights: 0,
      highPriorityAlerts: 0,
      potentialSavings: 0,
      keyRecommendations: []
    };

    // Count route optimizations
    if (insights.routeOptimizations?.length > 0) {
      summary.totalInsights += insights.routeOptimizations.length;
      summary.potentialSavings += insights.routeOptimizations
        .reduce((sum: number, opt: any) => sum + (opt.potentialSavings || 0), 0);
    }

    // Count risk alerts
    if (insights.riskAlerts?.length > 0) {
      summary.totalInsights += insights.riskAlerts.length;
      summary.highPriorityAlerts = insights.riskAlerts
        .filter((alert: any) => alert.severity === 'high').length;
    }

    // Generate key recommendations
    if (insights.costPredictions?.trend === 'increasing') {
      summary.keyRecommendations.push('Monitor cost trends - increase predicted');
    }
    
    if (insights.demandForecasts?.trend === 'increasing') {
      summary.keyRecommendations.push('Prepare for increased demand next month');
    }

    return summary;
  }
}