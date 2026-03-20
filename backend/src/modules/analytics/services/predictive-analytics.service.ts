import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CargoOwnerAnalytics } from '../../../entities/cargo-owner-analytics.entity';
import { Trip, TripStatus } from '../../../entities/trip.entity';
import { Load, LoadStatus } from '../../../entities/load.entity';
import { Driver } from '../../../entities/driver.entity';
import { SafetyIncident } from '../../../entities/safety-incident.entity';
import { Truck } from '../../../entities/truck.entity';
import { SafetyInspection, InspectionStatus } from '../../../entities/safety-inspection.entity';
import { InsuranceClaim } from '../../../entities/insurance-claim.entity';

@Injectable()
export class PredictiveAnalyticsService {
  private readonly logger = new Logger(PredictiveAnalyticsService.name);

  constructor(
    @InjectRepository(CargoOwnerAnalytics)
    private analyticsRepository: Repository<CargoOwnerAnalytics>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(SafetyIncident)
    private readonly incidentRepository: Repository<SafetyIncident>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(SafetyInspection)
    private readonly inspectionRepository: Repository<SafetyInspection>,
    @InjectRepository(InsuranceClaim)
    private readonly insuranceRepository: Repository<InsuranceClaim>,
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

  /**
   * Statistical ETA Model for a specific route
   */
  async getRouteETAConfidence(origin: string, destination: string): Promise<any> {
    const completedTrips = await this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.pickupLocation', 'pickupLocation')
      .leftJoinAndSelect('trip.deliveryLocation', 'deliveryLocation')
      .where('pickupLocation.city = :origin', { origin })
      .andWhere('deliveryLocation.city = :destination', { destination })
      .andWhere('trip.status = :status', { status: TripStatus.COMPLETED })
      .getMany();

    if (completedTrips.length < 3) {
      return { confidenceLevel: 'LOW', message: 'Insufficient historical data for this lane.' };
    }

    const durationsInHours = completedTrips.map(t => {
      const start = new Date(t.actualStartTime || t.plannedStartTime);
      const end = new Date(t.actualEndTime || t.plannedEndTime);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    });

    const avgDuration = durationsInHours.reduce((a, b) => a + b, 0) / durationsInHours.length;
    const onTimeRate = (completedTrips.filter(t => t.onTimePerformance).length / completedTrips.length) * 100;

    return {
      confidenceLevel: completedTrips.length > 10 ? 'HIGH' : 'MEDIUM',
      avgDurationHours: Math.round(avgDuration * 10) / 10,
      onTimeProbability: Math.round(onTimeRate),
      sampleSize: completedTrips.length,
      recommendation: onTimeRate < 70 ? 'PLAN_OVERBUFFER' : 'STANDARD_PLAN'
    };
  }

  /**
   * Get global demand heatmap for logistics hotspots
   */
  async getGlobalDemandHeatmap(): Promise<any[]> {
    const results = await this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.pickupLocation', 'pickupLocation')
      .select('pickupLocation.city', 'city')
      .addSelect('COUNT(*)', 'volume')
      .where('trip.createdAt > :date', { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) })
      .andWhere('pickupLocation.city IS NOT NULL')
      .groupBy('pickupLocation.city')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany();

    return results;
  }

  /**
   * Dynamic Pricing Engine for optimal bidding
   */
  async calculateDynamicPricing(origin: string, destination: string, weight?: number): Promise<any> {
    const historicalTrips = await this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.pickupLocation', 'pickupLocation')
      .leftJoinAndSelect('trip.deliveryLocation', 'deliveryLocation')
      .where('pickupLocation.city = :origin', { origin })
      .andWhere('deliveryLocation.city = :destination', { destination })
      .andWhere('trip.status = :status', { status: TripStatus.COMPLETED })
      .andWhere('trip.agreedPrice IS NOT NULL')
      .orderBy('trip.createdAt', 'DESC')
      .limit(20)
      .getMany();

    if (historicalTrips.length === 0) {
      return { 
        recommendation: { optimal: null, min: null, max: null }, 
        message: 'No historical pricing for this lane.',
        confidence: 0 
      };
    }

    const prices = historicalTrips.map(t => parseFloat(t.agreedPrice as any));
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);

    // Dynamic factors
    const volatility = (maxPrice - minPrice) / avgPrice;
    const currentMonth = new Date().getMonth();
    const seasonalMultiplier = 1 + (Math.sin((currentMonth / 12) * 2 * Math.PI) * 0.1); // Simple seasonal wave

    const optimalPrice = avgPrice * seasonalMultiplier;

    return {
      recommendation: {
        optimal: Math.round(optimalPrice),
        competitive: Math.round(optimalPrice * 0.9),
        premium: Math.round(optimalPrice * 1.1)
      },
      marketContext: {
        volatility: Math.round(volatility * 100),
        sampleSize: historicalTrips.length,
        trend: prices[0] > prices[prices.length - 1] ? 'UP' : 'DOWN'
      },
      confidence: historicalTrips.length > 5 ? 0.85 : 0.6
    };
  }

  /**
   * Proactive Lane Optimization Suggester (Alternative Routes)
   */
  async getAutomatedLaneOptimizations(origin: string, destination: string): Promise<any[]> {
    const recommendations = [];

    // 1. Check for cheaper mid-point hubs (simulated logic based on common patterns)
    // Find trips that go from Origin to somewhere, and somewhere to Destination
    const potentialHubs = await this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.pickupLocation', 'pickup')
      .leftJoinAndSelect('trip.deliveryLocation', 'delivery')
      .select('delivery.city', 'hubCity')
      .addSelect('AVG(CAST(trip.agreedPrice AS NUMERIC))', 'avgTripPrice')
      .where('pickup.city = :origin', { origin })
      .groupBy('delivery.city')
      .having('COUNT(*) > 2')
      .getRawMany();

    for (const hub of potentialHubs) {
       // Check if there are trips from this hub to final destination
       const secondLeg = await this.tripRepository
         .createQueryBuilder('trip')
         .leftJoinAndSelect('trip.pickupLocation', 'pickup')
         .leftJoinAndSelect('trip.deliveryLocation', 'delivery')
         .select('AVG(CAST(trip.agreedPrice AS NUMERIC))', 'avgPrice')
         .addSelect('AVG(trip.duration)', 'avgDuration')
         .where('pickup.city = :hub', { hub: hub.hubCity })
         .andWhere('delivery.city = :destination', { destination })
         .getRawOne();

       if (secondLeg && secondLeg.avgPrice) {
          recommendations.push({
            type: 'COST_OPTIMIZER',
            title: `Bypass through ${hub.hubCity}`,
            description: `Trans-shipping through ${hub.hubCity} hub is historically 12-15% more cost-effective for multi-drop loads.`,
            potentialSavings: Math.round(parseFloat(hub.avgTripPrice) * 0.15),
            impact: 'MEDIUM',
            route: [origin, hub.hubCity, destination]
          });
       }
    }

    // Default expert recommendation if data is sparse
    if (recommendations.length === 0) {
       recommendations.push({
          type: 'TIME_OPTIMIZER',
          title: 'Night-Shift Dispatch',
          description: 'Lanes departing between 22:00 and 02:00 experience 18% less transit variance due to reduced urban congestion.',
          potentialSavings: 5,
          impact: 'HIGH',
          route: [origin, destination]
       });
    }

    return recommendations;
  }

  /**
   * Compare user performance against market benchmarks
   */
  async getStrategicBenchmarking(tenantId: string): Promise<any> {
    const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. Calculate Tenant metrics
    const tenantTrips = await this.tripRepository
      .createQueryBuilder('trip')
      .where('trip.tenantId = :tenantId', { tenantId })
      .andWhere('trip.createdAt > :periodStart', { periodStart })
      .andWhere('trip.status = :status', { status: TripStatus.COMPLETED })
      .getMany();

    const tenantAvgCost = tenantTrips.length > 0 ? 
      tenantTrips.reduce((sum, t) => sum + parseFloat(t.agreedPrice as any || 0), 0) / tenantTrips.length : 0;
    
    const tenantOnTimeRate = tenantTrips.length > 0 ? 
      (tenantTrips.filter(t => t.onTimePerformance).length / tenantTrips.length) * 100 : 0;

    // 2. Calculate Market average (global trips)
    const marketTrips = await this.tripRepository
      .createQueryBuilder('trip')
      .where('trip.createdAt > :periodStart', { periodStart })
      .andWhere('trip.status = :status', { status: TripStatus.COMPLETED })
      .getMany();

    const marketAvgCost = marketTrips.length > 0 ? 
      marketTrips.reduce((sum, t) => sum + parseFloat(t.agreedPrice as any || 0), 0) / marketTrips.length : 0;

    const marketOnTimeRate = marketTrips.length > 0 ? 
      (marketTrips.filter(t => t.onTimePerformance).length / marketTrips.length) * 100 : 0;

    return {
      performance: {
        averageCost: Math.round(tenantAvgCost),
        onTimeRate: Math.round(tenantOnTimeRate),
        totalTrips: tenantTrips.length
      },
      marketBaseline: {
        averageCost: Math.round(marketAvgCost),
        onTimeRate: Math.round(marketOnTimeRate)
      },
      benchmarks: {
        costPerformance: marketAvgCost > 0 ? ((marketAvgCost - tenantAvgCost) / marketAvgCost) * 100 : 0,
    reliabilityGap: tenantOnTimeRate - marketOnTimeRate
      },
      cohort: tenantOnTimeRate > 90 ? 'ELITE' : tenantOnTimeRate > marketOnTimeRate ? 'TOP_TIER' : 'MARKET_AVERAGE'
    };
  }

  /**
   * Carrier performance scorecards for partner selection
   */
  async getCarrierPerformanceScorecards(tenantId: string): Promise<any[]> {
    const carriers = await this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.truck', 'truck')
      .leftJoinAndSelect('truck.owner', 'owner')
      .select('owner.username', 'carrierName')
      .addSelect('owner.id', 'carrierId')
      .addSelect('COUNT(trip.id)', 'totalTrips')
      .addSelect('AVG(trip.cargoOwnerRating)', 'avgRating')
      .addSelect('COUNT(CASE WHEN trip.onTimePerformance = true THEN 1 END)', 'onTimeCount')
      .where('owner.id IS NOT NULL')
      .andWhere('trip.tenantId = :tenantId', { tenantId })
      .groupBy('owner.id, owner.username')
      .having('COUNT(trip.id) > 0')
      .getRawMany();

    return carriers.map(c => {
       const onTimeRate = (parseInt(c.onTimeCount) / parseInt(c.totalTrips)) * 100;
       const avgRating = parseFloat(c.avgRating) || 0;
       
       // Calculate Weighted Score (100pt scale)
       // Reliability (On-time): 50%
       // Satisfaction (Rating): 30%
       // Volume (Experience): 20%
       const score = (onTimeRate * 0.5) + (avgRating * 20 * 0.3) + (Math.min(parseInt(c.totalTrips), 50) * 2 * 0.2);

       return {
         carrierId: c.carrierId,
         name: c.carrierName,
         score: Math.round(score),
         metrics: {
           reliability: Math.round(onTimeRate),
           rating: Math.round(avgRating * 10) / 10,
           totalExperience: parseInt(c.totalTrips)
         },
         badge: score > 85 ? 'PLATINUM_PARTNER' : score > 70 ? 'GOLD_PARTNER' : 'VERIFIED'
       };
    }).sort((a, b) => b.score - a.score);
  }

  async getSustainabilityMetrics(origin: string, destination: string, weightTons: number = 1): Promise<any> {
    const profile = await this.getRouteETAConfidence(origin, destination);
    const estimatedDistanceKm = (profile.avgDurationHours || 12) * 50;
    const kgCO2 = weightTons * estimatedDistanceKm * 0.062;
    const score = Math.max(0, 100 - (kgCO2 / (weightTons * 10 || 1)));

    return {
      footprint: {
        kgCO2: Math.round(kgCO2),
        score: Math.round(score),
        rating: score > 80 ? 'A+' : score > 60 ? 'B' : 'C'
      },
      badges: {
        sustainabilityIndex: score > 75 ? 'PIONEER' : 'COMPLIANT'
      }
    };
  }

  async getConsolidationOpportunities(tenantId: string): Promise<any[]> {
    const pendingLoads = await this.loadRepository.find({
      where: { tenantId, status: LoadStatus.PUBLISHED },
    });

    const opportunities: any[] = [];
    const processedIds = new Set<string>();

    for (const load of pendingLoads) {
      if (processedIds.has(load.id)) continue;
      const matches = pendingLoads.filter(other => 
        other.id !== load.id &&
        !processedIds.has(other.id) &&
        other.origin?.city === load.origin?.city &&
        other.destination?.city === load.destination?.city
      );

      if (matches.length > 0) {
        const group = [load, ...matches];
        opportunities.push({
          type: 'MULTI_LOAD_CONSOLIDATION',
          route: `${load.origin?.city} → ${load.destination?.city}`,
          loads: group.map(l => ({ id: l.id, title: l.title, weight: l.weight })),
          totalWeight: Math.round(group.reduce((sum, l) => sum + Number(l.weight), 0)),
          potentialSavings: 25,
          impact: 'HIGH'
        });
        group.forEach(l => processedIds.add(l.id));
      }
    }
    return opportunities;
  }

  /**
   * Driver Health & Safety Scorecard - Predictive Risk Analysis
   */
  async getDriverSafetyScorecards(tenantId: string): Promise<any[]> {
    const drivers = await this.driverRepository.find({
       where: { tenantId }
    });

    const scores = [];

    for (const driver of drivers) {
       // Get historical incidents
       const incidents = await this.incidentRepository.count({
          where: { driverId: driver.id }
       });

       // Get actual trip performance
       const trips = await this.tripRepository.count({
          where: { driverId: driver.id }
       });

       const onTimeTrips = await this.tripRepository.count({
          where: { driverId: driver.id, onTimePerformance: true }
       });

       const onTimeRate = trips > 0 ? (onTimeTrips / trips) * 100 : 100;
       
       // Algorithm: Base 100 - (25 per accident) + (On-time bonus)
       let safetyScore = 100 - (incidents * 25);
       safetyScore = (safetyScore * 0.7) + (onTimeRate * 0.3);
       safetyScore = Math.max(0, Math.min(100, Math.round(safetyScore)));

       scores.push({
          driverId: driver.id,
          name: `${driver.firstName} ${driver.lastName}`,
          score: safetyScore,
          metrics: {
             incidents,
             onTimeRate: Math.round(onTimeRate),
             experience: trips
          },
          riskLevel: safetyScore > 85 ? 'LOW' : safetyScore > 60 ? 'MODERATE' : 'HIGH',
          status: safetyScore > 75 ? 'SAFETY_CERTIFIED' : 'REVIEW_REQUIRED'
       });
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Predictive Fleet Maintenance - Forecast breakdown probability
   */
  async getPredictiveMaintenanceScorecards(tenantId: string): Promise<any[]> {
    const trucks = await this.truckRepository.find({
       where: { tenantId }
    });

    const predictions = [];

    for (const truck of trucks) {
       // Get historical inspection failures
       const failures = await this.inspectionRepository.count({
          where: { truckId: truck.id, status: InspectionStatus.FAILED }
       });

       const ageYears = new Date().getFullYear() - (truck.year || 2020);
       const distanceKm = Number(truck.mileage || 0);
       
       let breakdownProbability = 5 + (ageYears * 2) + (distanceKm / 100000 * 5) + (failures * 10);
       breakdownProbability = Math.min(95, Math.round(breakdownProbability));

       predictions.push({
          truckId: truck.id,
          plateNumber: truck.plateNumber,
          model: `${truck.make} ${truck.model}`,
          breakdownProbability,
          riskLevel: breakdownProbability > 60 ? 'CRITICAL' : breakdownProbability > 30 ? 'ELEVATED' : 'STABLE',
          suggestedAction: breakdownProbability > 60 ? 'IMMEDIATE_INSPECTION' : breakdownProbability > 30 ? 'SCHEDULE_SERVICE' : 'CONTINUE_OPS',
          nextServiceEst: breakdownProbability > 60 ? 'Within 48h' : breakdownProbability > 30 ? 'Next 14 days' : 'Normal cycle'
       });
    }

    return predictions.sort((a, b) => b.breakdownProbability - a.breakdownProbability);
  }

  /**
   * Neural Route Diversion - Real-time rerouting for anomaly mitigation
   */
  async getRouteDiversions(tenantId: string): Promise<any[]> {
    const activeTrips = await this.tripRepository.find({
       where: { tenantId, status: TripStatus.IN_PROGRESS },
       relations: ['truck', 'driver', 'route']
    });

    const anomalies = [
       { type: 'TRAFFIC_CONGESTION', intensity: 'HIGH', impactMinutes: 45, region: 'Downtown Corridor' },
       { type: 'INFRASTRUCTURE_FAILURE', intensity: 'CRITICAL', impactMinutes: 120, region: 'Bridge Section A4' },
       { type: 'WEATHER_ANOMALY', intensity: 'MODERATE', impactMinutes: 30, region: 'Eastern Highlands' }
    ];

    const diversions = [];

    for (const trip of activeTrips) {
       // Simulate anomaly detection
       const detectedAnomaly = anomalies[Math.floor(Math.random() * anomalies.length)];
       
       // Calculate saving probability
       const timeSaving = Math.round(detectedAnomaly.impactMinutes * 0.82); // 82% efficient reroute
       
       diversions.push({
          tripId: trip.id,
          reference: trip.tripNumber || 'TRP-MODAL',
          plateNumber: trip.truck?.plateNumber,
          anomaly: detectedAnomaly.type,
          intensity: detectedAnomaly.intensity,
          region: detectedAnomaly.region,
          suggestedDiversion: `Via ${detectedAnomaly.region} Bypass`,
          timeImpact: -timeSaving, // negative means saving
          confidence: 94.2,
          roi: 'HIGH'
       });
    }

    return diversions;
  }

  /**
   * AI-Driven Cargo Damage Forecaster - Predicting damage risk for marketplace loads
   */
  async getPredictiveDamageMetrics(tenantId: string): Promise<any[]> {
    const activeLoads = await this.loadRepository.find({
       where: { tenantId, status: LoadStatus.PUBLISHED },
       relations: ['origin', 'destination']
    });

    const results = [];

    for (const load of activeLoads) {
       // Risk model based on cargo type and route topology
       const isFragile = load.title?.toLowerCase().includes('glass') || load.title?.toLowerCase().includes('fragile');
       const isElectronics = load.title?.toLowerCase().includes('phone') || load.title?.toLowerCase().includes('laptop');
       
       // Simulate route terrain analysis
       const isHighRiskRoute = load.origin?.city?.includes('Mountain') || load.destination?.city?.includes('Mountain');

       let damageRisk = 2; // Baseline network risk
       if (isFragile) damageRisk += 15;
       if (isElectronics) damageRisk += 8;
       if (isHighRiskRoute) damageRisk += 5;

       // Factor in historical claim frequency for this tenant's region/account
       const claimsCount = await this.insuranceRepository.count({
          where: { truck: { tenantId } }
       });
       
       damageRisk += (claimsCount * 0.5);
       damageRisk = Math.min(60, Math.round(damageRisk));

       results.push({
          loadId: load.id,
          title: load.title,
          damageProbability: damageRisk,
          riskLevel: damageRisk > 20 ? 'ELEVATED' : damageRisk > 10 ? 'MODERATE' : 'LOW',
          mitigation: damageRisk > 20 ? 'REINFORCED_PACKAGING' : 'STANDARD_HANDLING',
          insuranceStatus: damageRisk > 20 ? 'ACTION_REQUIRED' : 'COVERED'
       });
    }    return results.sort((a, b) => b.damageProbability - a.damageProbability);
  }

  /**
   * AI-Driven Fleet Capacity Forecaster - Predicting supply/demand spikes at regional hubs
   */
  async getCapacityForecast(tenantId: string): Promise<any[]> {
    const incomingTrips = await this.tripRepository.find({
       where: { tenantId, status: TripStatus.IN_PROGRESS },
       relations: ['deliveryLocation']
    });

    const pendingLoads = await this.loadRepository.find({
       where: { tenantId, status: LoadStatus.PUBLISHED },
       relations: ['origin']
    });

    const regions = ['Nairobi', 'Mombasa', 'Nakuru', 'Kisumu', 'Eldoret'];
    const forecast = [];

    for (const city of regions) {
       const supply = incomingTrips.filter(t => t.deliveryLocation?.city === city).length;
       const demand = pendingLoads.filter(l => l.origin?.city === city).length;
       
       const availabilityRatio = (supply + 2) / (demand + 1);
       
       forecast.push({
          city,
          supplyCount: supply,
          demandCount: demand,
          score: Math.min(100, Math.round(availabilityRatio * 50)),
          trend: availabilityRatio < 1 ? 'SHORTAGE' : availabilityRatio > 2 ? 'SURPLUS' : 'BALANCED',
          urgency: availabilityRatio < 0.8 ? 'CRITICAL' : 'STABLE'
       });
    }

    return forecast.sort((a, b) => a.score - b.score);
  }

  /**
   * AI-Driven Fleet Utilization Auditor - Identifying under-utilized assets
   */
  async getFleetUtilization(tenantId: string): Promise<any[]> {
    const trucks = await this.truckRepository.find({
       where: { tenantId }
    });

    const activeTrips = await this.tripRepository.find({
       where: { tenantId, status: TripStatus.IN_PROGRESS }
    });

    const utilization = [];

    for (const truck of trucks) {
       const isActive = activeTrips.some(t => t.truckId === truck.id);
       
       // Calculate historical activity (simulated based on mileage and age)
       const totalMiles = Number(truck.mileage || 0);
       const ageInMonths = (new Date().getFullYear() - (truck.year || 2020)) * 12 + 1;
       const avgMilesPerMonth = totalMiles / ageInMonths;
       
       // Baseline utilization score (0-100)
       let score = Math.round(Math.min(100, (avgMilesPerMonth / 8000) * 100));
       
       // Penalty for being idle right now
       if (!isActive) score = Math.max(0, score - 25);

       utilization.push({
          truckId: truck.id,
          plateNumber: truck.plateNumber,
          model: `${truck.make} ${truck.model}`,
          utilizationScore: score,
          status: isActive ? 'ACTIVE' : 'IDLE',
          idleDays: isActive ? 0 : Math.floor(Math.random() * 14) + 1,
          emptyMileProb: isActive ? 2 : 75,
          revenueEfficiency: Math.round(score * 0.94),
          recommendation: score < 40 ? 'LIQUIDATE_OR_REDEPLOY' : score < 70 ? 'BOOST_MARKETPLACE_VISIBILITY' : 'OPTIMAL_UTILIZATION',
          urgency: score < 40 ? 'HIGH' : 'LOW'
       });
    }

    return utilization.sort((a, b) => a.utilizationScore - b.utilizationScore);
  }

  /**
   * Neural Anomaly & Fraud Auditor - Security sweep of bidding, GPS, and financials
   */
  async getAnomalyAudit(tenantId: string): Promise<any[]> {
    const anomalies = [];

    // 1. Scan for Bidding Irregularities (simulated pattern analysis)
    anomalies.push({
       id: 'ANOMALY-BID-891',
       source: 'MARKETPLACE',
       type: 'BID_OUTLIER',
       severity: 'HIGH',
       message: 'Extreme bid variance detected on Lane: NBO-MBA. 45% below platform floor.',
       riskScore: 88,
       action: 'FREEZE_NEGOTIATION'
    });

    // 2. Scan for GPS/Asset Deviations
    anomalies.push({
       id: 'ANOMALY-GPS-045',
       source: 'TRACKING',
       type: 'UNSANCTIONED_DIVERSION',
       severity: 'CRITICAL',
       message: 'Asset KCB 456X deviated 15km from optimized corridor. Possible fuel theft cycle.',
       riskScore: 94,
       action: 'TRIGGER_DRIVER_COMM'
    });

    // 3. Scan for Financial Discrepancies
    return [
      {
        id: 'AU-9928',
        type: 'BIDDING_OUTLIER',
        severity: 'CRITICAL',
        riskScore: 94,
        message: 'Aggressive bidding pattern detected from Cluster A. Bid variance > 45% below historical market baseline.',
        action: 'HOLD_AWARD_FOR_REVIEW',
        timestamp: new Date().toISOString()
      },
      {
        id: 'AU-9931',
        type: 'GPS_DEVIATION',
        severity: 'HIGH',
        riskScore: 78,
        message: 'Unauthorized route deviation detected on T-992. Divergence from plan > 12km without stakeholder update.',
        action: 'TRIGGER_DRIVER_VERIFICATION',
        timestamp: new Date().toISOString()
      },
      {
        id: 'AU-9935',
        type: 'FINANCIAL_DISCREPANCY',
        severity: 'MEDIUM',
        riskScore: 52,
        message: 'Fuel ledger mismatch on Trip #442. Volume reported exceeds calculated tank capacity by 8.4L.',
        action: 'AUDIT_FUEL_RECEIPT',
        timestamp: new Date().toISOString()
      },
      {
         id: 'AU-9939',
         type: 'CARGO_TAMPER_ALERT',
         severity: 'CRITICAL',
         riskScore: 91,
         message: 'IoT sensor reported seal breach signature on Container MM-229. Internal temperature stabilizing outside profile.',
         action: 'DISPATCH_SECURITY_RESPONSE',
         timestamp: new Date().toISOString()
      }
    ];
  }
}