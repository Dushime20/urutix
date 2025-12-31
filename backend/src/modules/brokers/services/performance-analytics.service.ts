import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrokerTransporterPerformance } from '../../../entities/broker-intelligence.entity';
import { User } from '../../../entities/user.entity';
import { Trip } from '../../../entities/trip.entity';
import { Load } from '../../../entities/load.entity';

@Injectable()
export class PerformanceAnalyticsService {
  private readonly logger = new Logger(PerformanceAnalyticsService.name);

  constructor(
    @InjectRepository(BrokerTransporterPerformance)
    private performanceRepo: Repository<BrokerTransporterPerformance>,
    @InjectRepository(Trip)
    private tripRepo: Repository<Trip>,
    @InjectRepository(Load)
    private loadRepo: Repository<Load>,
  ) {}

  /**
   * Calculate and update transporter performance metrics
   */
  async calculatePerformanceMetrics(
    brokerId: string,
    transporterId: string,
    tenantId: string,
  ): Promise<BrokerTransporterPerformance> {
    // Get all trips for this transporter (via truck owner)
    const trips = await this.tripRepo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.truck', 'truck')
      .where('truck.ownerId = :transporterId', { transporterId })
      .andWhere('trip.tenantId = :tenantId', { tenantId })
      .take(1000)
      .getMany();

    // Get loads assigned to this transporter (via trips -> trucks -> owner)
    // Get truck IDs owned by transporter first
    const truckIds = trips.map(t => t.truckId).filter(Boolean);
    const loads = truckIds.length > 0
      ? await this.loadRepo
          .createQueryBuilder('load')
          .leftJoinAndSelect('load.trips', 'trip')
          .where('trip.truckId IN (:...truckIds)', { truckIds })
          .andWhere('load.tenantId = :tenantId', { tenantId })
          .take(1000)
          .getMany()
      : [];

    // Calculate reliability metrics
    const reliabilityMetrics = this.calculateReliabilityMetrics(trips, loads);

    // Calculate on-time delivery tracking
    const onTimeTracking = this.calculateOnTimeTracking(trips);

    // Calculate damage analysis
    const damageAnalysis = this.calculateDamageAnalysis(trips, loads);

    // Calculate predictive metrics
    const predictiveMetrics = this.calculatePredictiveMetrics(
      trips,
      loads,
      reliabilityMetrics,
      onTimeTracking,
    );

    // Calculate overall scores
    const reliabilityScore = this.calculateReliabilityScore(reliabilityMetrics);
    const onTimeDeliveryRate = onTimeTracking.onTimePercentage;
    const damageRate = damageAnalysis.damageRate;
    const predictiveMatchSuccess = predictiveMetrics.matchSuccessRate;

    // Get historical trends
    const historicalTrends = await this.getHistoricalTrends(
      transporterId,
      tenantId,
    );

    // Comparative analysis
    const comparativeAnalysis = await this.getComparativeAnalysis(
      reliabilityScore,
      onTimeDeliveryRate,
      damageRate,
      tenantId,
    );

    // Check if performance record exists
    let performance = await this.performanceRepo.findOne({
      where: { brokerId, transporterId, tenantId },
    });

    if (performance) {
      performance.reliabilityScore = reliabilityScore;
      performance.onTimeDeliveryRate = onTimeDeliveryRate;
      performance.damageRate = damageRate;
      performance.predictiveMatchSuccess = predictiveMatchSuccess;
      performance.reliabilityMetrics = reliabilityMetrics;
      performance.onTimeTracking = onTimeTracking;
      performance.damageAnalysis = damageAnalysis;
      performance.predictiveMetrics = predictiveMetrics;
      performance.historicalTrends = historicalTrends;
      performance.comparativeAnalysis = comparativeAnalysis;
      performance.calculatedAt = new Date();
      performance.lastLoadDate = trips[0]?.completedAt || new Date();
    } else {
      performance = this.performanceRepo.create({
        tenantId,
        brokerId,
        transporterId,
        reliabilityScore,
        onTimeDeliveryRate,
        damageRate,
        predictiveMatchSuccess,
        reliabilityMetrics,
        onTimeTracking,
        damageAnalysis,
        predictiveMetrics,
        historicalTrends,
        comparativeAnalysis,
        calculatedAt: new Date(),
        lastLoadDate: trips[0]?.completedAt || new Date(),
      });
    }

    return this.performanceRepo.save(performance);
  }

  /**
   * Calculate reliability metrics
   */
  private calculateReliabilityMetrics(
    trips: Trip[],
    loads: Load[],
  ): BrokerTransporterPerformance['reliabilityMetrics'] {
    const totalLoads = loads.length;
    const completedLoads = trips.filter(
      (t) => t.status === 'COMPLETED' as any,
    ).length;
    const cancelledLoads = loads.filter(
      (l) => l.status === 'CANCELLED' as any,
    ).length;

    const completionRate =
      totalLoads > 0 ? (completedLoads / totalLoads) * 100 : 0;

    // Simplified calculations
    const averageResponseTime = 2; // hours
    const communicationScore = 85;
    const professionalismScore = 80;

    return {
      totalLoads,
      completedLoads,
      cancelledLoads,
      completionRate,
      averageResponseTime,
      communicationScore,
      professionalismScore,
    };
  }

  /**
   * Calculate on-time delivery tracking
   */
  private calculateOnTimeTracking(
    trips: Trip[],
  ): BrokerTransporterPerformance['onTimeTracking'] {
    const totalDeliveries = trips.filter(
      (t) => t.status === 'COMPLETED' as any,
    ).length;

    if (totalDeliveries === 0) {
      return {
        totalDeliveries: 0,
        onTimeDeliveries: 0,
        lateDeliveries: 0,
        averageDelayMinutes: 0,
        onTimePercentage: 0,
        trend: 'STABLE',
      };
    }

    const onTimeDeliveries = trips.filter(
      (t) => t.onTimePerformance === true,
    ).length;
    const lateDeliveries = totalDeliveries - onTimeDeliveries;
    const averageDelayMinutes = 15; // Simplified
    const onTimePercentage = (onTimeDeliveries / totalDeliveries) * 100;

    // Determine trend (simplified)
    const recentTrips = trips.slice(0, 10);
    const olderTrips = trips.slice(10, 20);
    const recentOnTime = recentTrips.filter((t) => t.onTimePerformance).length;
    const olderOnTime = olderTrips.filter((t) => t.onTimePerformance).length;

    const trend =
      recentOnTime > olderOnTime
        ? 'IMPROVING'
        : recentOnTime < olderOnTime
          ? 'DECLINING'
          : 'STABLE';

    return {
      totalDeliveries,
      onTimeDeliveries,
      lateDeliveries,
      averageDelayMinutes,
      onTimePercentage,
      trend,
    };
  }

  /**
   * Calculate damage analysis
   */
  private calculateDamageAnalysis(
    trips: Trip[],
    loads: Load[],
  ): BrokerTransporterPerformance['damageAnalysis'] {
    const totalLoads = loads.length;
    const loadsWithDamage = trips.filter(
      (t) => t.issuesReported && t.issuesReported.length > 0,
    ).length;

    const damageRate =
      totalLoads > 0 ? (loadsWithDamage / totalLoads) * 100 : 0;

    return {
      totalLoads,
      loadsWithDamage,
      damageRate,
      averageDamageValue: 0, // Would calculate from actual damage reports
      damageTypes: {},
      severityDistribution: {
        minor: 0,
        moderate: 0,
        severe: 0,
      },
    };
  }

  /**
   * Calculate predictive metrics
   */
  private calculatePredictiveMetrics(
    trips: Trip[],
    loads: Load[],
    reliabilityMetrics: any,
    onTimeTracking: any,
  ): BrokerTransporterPerformance['predictiveMetrics'] {
    const matchSuccessRate =
      reliabilityMetrics.completionRate * 0.9; // Slightly conservative
    const acceptanceRate = 85; // Simplified
    const completionProbability = reliabilityMetrics.completionRate / 100;
    const riskScore = 100 - reliabilityMetrics.completionRate;
    const recommendedForLoads = reliabilityMetrics.completionRate > 80;

    return {
      matchSuccessRate,
      acceptanceRate,
      completionProbability,
      riskScore,
      recommendedForLoads,
      confidenceLevel: 75,
    };
  }

  /**
   * Calculate reliability score
   */
  private calculateReliabilityScore(metrics: any): number {
    const completionWeight = 0.4;
    const communicationWeight = 0.3;
    const professionalismWeight = 0.3;

    return (
      metrics.completionRate * completionWeight +
      metrics.communicationScore * communicationWeight +
      metrics.professionalismScore * professionalismWeight
    );
  }

  /**
   * Get historical trends
   */
  private async getHistoricalTrends(
    transporterId: string,
    tenantId: string,
  ): Promise<BrokerTransporterPerformance['historicalTrends']> {
    // Simplified - would calculate from historical performance records
    return {
      reliabilityTrend: [75, 78, 80, 82, 85],
      onTimeTrend: [80, 82, 85, 83, 87],
      damageTrend: [5, 4, 3, 3, 2],
      periods: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
    };
  }

  /**
   * Get comparative analysis
   */
  private async getComparativeAnalysis(
    reliability: number,
    onTime: number,
    damage: number,
    tenantId: string,
  ): Promise<BrokerTransporterPerformance['comparativeAnalysis']> {
    // Simplified industry averages
    return {
      industryAverage: {
        reliability: 75,
        onTime: 80,
        damage: 5,
      },
      percentileRank: {
        reliability: this.calculatePercentile(reliability, 75),
        onTime: this.calculatePercentile(onTime, 80),
        damage: this.calculatePercentile(100 - damage, 95), // Inverse for damage
      },
    };
  }

  private calculatePercentile(value: number, average: number): number {
    // Simplified percentile calculation
    if (value >= average * 1.2) return 90;
    if (value >= average * 1.1) return 75;
    if (value >= average) return 50;
    if (value >= average * 0.9) return 25;
    return 10;
  }

  /**
   * Get performance for transporter
   */
  async getTransporterPerformance(
    brokerId: string,
    transporterId: string,
    tenantId: string,
  ): Promise<BrokerTransporterPerformance | null> {
    return this.performanceRepo.findOne({
      where: { brokerId, transporterId, tenantId },
    });
  }

  /**
   * Get all performance records for broker
   */
  async getBrokerPerformanceRecords(
    brokerId: string,
    tenantId: string,
  ): Promise<BrokerTransporterPerformance[]> {
    return this.performanceRepo.find({
      where: { brokerId, tenantId },
      order: { reliabilityScore: 'DESC' },
    });
  }
}

