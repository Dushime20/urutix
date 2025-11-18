import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Driver, DriverStatus } from '../../../entities/driver.entity';
import { Truck } from '../../../entities/truck.entity';
import { Trip } from '../../../entities/trip.entity';

export interface DriverPerformanceScore {
  driverId: string;
  overallScore: number;
  safetyScore: number;
  reliabilityScore: number;
  efficiencyScore: number;
  customerSatisfactionScore: number;
  completionRate: number;
  onTimeDeliveryRate: number;
  averageRating: number;
  totalTrips: number;
  totalDistance: number;
  safetyIncidents: number;
  lastUpdated: Date;
}

export interface TruckPerformanceScore {
  truckId: string;
  overallScore: number;
  reliabilityScore: number;
  efficiencyScore: number;
  maintenanceScore: number;
  fuelEfficiencyScore: number;
  utilizationRate: number;
  totalTrips: number;
  totalDistance: number;
  maintenanceIncidents: number;
  averageFuelConsumption: number;
  lastUpdated: Date;
}

export interface PerformanceMetrics {
  totalDrivers: number;
  totalTrucks: number;
  averageDriverScore: number;
  averageTruckScore: number;
  topPerformers: {
    drivers: DriverPerformanceScore[];
    trucks: TruckPerformanceScore[];
  };
  performanceTrends: {
    driverScores: { date: string; score: number }[];
    truckScores: { date: string; score: number }[];
  };
}

@Injectable()
export class PerformanceScoringService {
  private readonly logger = new Logger(PerformanceScoringService.name);
  private readonly driverScores = new Map<string, DriverPerformanceScore>();
  private readonly truckScores = new Map<string, TruckPerformanceScore>();

  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
  ) {
    this.initializePerformanceTracking();
  }

  /**
   * Initialize performance tracking
   */
  private async initializePerformanceTracking(): Promise<void> {
    try {
      // Load initial performance data
      await this.refreshPerformanceData();

      // Set up periodic refresh
      setInterval(() => {
        this.refreshPerformanceData();
      }, 300000); // Refresh every 5 minutes

      this.logger.log('Performance scoring service initialized');
    } catch (error) {
      this.logger.error('Error initializing performance tracking:', error);
    }
  }

  /**
   * Calculate driver performance score
   */
  async calculateDriverPerformance(
    driverId: string,
    tenantId: string,
  ): Promise<DriverPerformanceScore> {
    try {
      const driver = await this.driverRepository.findOne({
        where: { id: driverId, tenantId },
      });

      if (!driver) {
        throw new Error('Driver not found');
      }

      // Get driver's recent trips (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentTrips = await this.tripRepository.find({
        where: {
          driverId,
          tenantId,
          createdAt: Between(thirtyDaysAgo, new Date()),
        },
        order: { createdAt: 'DESC' },
      });

      // Calculate performance metrics
      const totalTrips = recentTrips.length;
      const completedTrips = recentTrips.filter(
        (trip) => trip.status === 'COMPLETED',
      ).length;
      const onTimeDeliveries = recentTrips.filter(
        (trip) => trip.status === 'COMPLETED' && trip.onTimePerformance,
      ).length;

      const safetyIncidents = recentTrips.reduce((sum, trip) => {
        const safetyIssues =
          trip.issuesReported?.filter((issue) => issue.type === 'safety') || [];
        return sum + safetyIssues.length;
      }, 0);
      const totalDistance = recentTrips.reduce(
        (sum, trip) => sum + (trip.totalDistance || 0),
        0,
      );
      const totalRating = recentTrips.reduce(
        (sum, trip) => sum + (trip.driverRating || 0),
        0,
      );

      // Calculate individual scores
      const completionRate = totalTrips > 0 ? completedTrips / totalTrips : 0;
      const onTimeDeliveryRate =
        completedTrips > 0 ? onTimeDeliveries / completedTrips : 0;
      const averageRating =
        completedTrips > 0 ? totalRating / completedTrips : 0;

      // Safety score (inverse of incidents)
      const safetyScore = Math.max(
        0,
        1 - safetyIncidents / Math.max(totalTrips, 1),
      );

      // Reliability score (completion rate + on-time delivery)
      const reliabilityScore = completionRate * 0.6 + onTimeDeliveryRate * 0.4;

      // Efficiency score (distance covered vs time)
      const efficiencyScore = this.calculateEfficiencyScore(recentTrips);

      // Customer satisfaction score
      const customerSatisfactionScore = averageRating / 5;

      // Overall score (weighted average)
      const overallScore =
        safetyScore * 0.25 +
        reliabilityScore * 0.3 +
        efficiencyScore * 0.25 +
        customerSatisfactionScore * 0.2;

      const performanceScore: DriverPerformanceScore = {
        driverId,
        overallScore,
        safetyScore,
        reliabilityScore,
        efficiencyScore,
        customerSatisfactionScore,
        completionRate,
        onTimeDeliveryRate,
        averageRating,
        totalTrips,
        totalDistance,
        safetyIncidents,
        lastUpdated: new Date(),
      };

      // Cache the result
      this.driverScores.set(driverId, performanceScore);

      return performanceScore;
    } catch (error) {
      this.logger.error('Error calculating driver performance:', error);
      throw error;
    }
  }

  /**
   * Calculate truck performance score
   */
  async calculateTruckPerformance(
    truckId: string,
    tenantId: string,
  ): Promise<TruckPerformanceScore> {
    try {
      const truck = await this.truckRepository.findOne({
        where: { id: truckId, tenantId },
      });

      if (!truck) {
        throw new Error('Truck not found');
      }

      // Get truck's recent trips (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentTrips = await this.tripRepository.find({
        where: {
          truckId,
          tenantId,
          createdAt: Between(thirtyDaysAgo, new Date()),
        },
        order: { createdAt: 'DESC' },
      });

      // Calculate performance metrics
      const totalTrips = recentTrips.length;
      const completedTrips = recentTrips.filter(
        (trip) => trip.status === 'COMPLETED',
      ).length;
      const maintenanceIncidents = recentTrips.reduce((sum, trip) => {
        const maintenanceIssues =
          trip.issuesReported?.filter(
            (issue) => issue.type === 'maintenance',
          ) || [];
        return sum + maintenanceIssues.length;
      }, 0);
      const totalDistance = recentTrips.reduce(
        (sum, trip) => sum + (trip.totalDistance || 0),
        0,
      );
      const totalFuelConsumption = recentTrips.reduce(
        (sum, trip) => sum + (trip.fuelCost || 0),
        0,
      );

      // Calculate individual scores
      const completionRate = totalTrips > 0 ? completedTrips / totalTrips : 0;
      const utilizationRate = this.calculateUtilizationRate(truck, recentTrips);
      const averageFuelConsumption =
        totalDistance > 0 ? totalFuelConsumption / totalDistance : 0;

      // Reliability score (completion rate - maintenance issues)
      const reliabilityScore = Math.max(
        0,
        completionRate - maintenanceIncidents / Math.max(totalTrips, 1),
      );

      // Efficiency score (fuel efficiency + utilization)
      const fuelEfficiencyScore = this.calculateFuelEfficiencyScore(
        averageFuelConsumption,
        truck.fuelEfficiency || 6.5,
      );
      const efficiencyScore = fuelEfficiencyScore * 0.6 + utilizationRate * 0.4;

      // Maintenance score (inverse of incidents)
      const maintenanceScore = Math.max(
        0,
        1 - maintenanceIncidents / Math.max(totalTrips, 1),
      );

      // Overall score (weighted average)
      const overallScore =
        reliabilityScore * 0.35 +
        efficiencyScore * 0.3 +
        maintenanceScore * 0.35;

      const performanceScore: TruckPerformanceScore = {
        truckId,
        overallScore,
        reliabilityScore,
        efficiencyScore,
        maintenanceScore,
        fuelEfficiencyScore,
        utilizationRate,
        totalTrips,
        totalDistance,
        maintenanceIncidents,
        averageFuelConsumption,
        lastUpdated: new Date(),
      };

      // Cache the result
      this.truckScores.set(truckId, performanceScore);

      return performanceScore;
    } catch (error) {
      this.logger.error('Error calculating truck performance:', error);
      throw error;
    }
  }

  /**
   * Get driver performance score (cached or calculated)
   */
  async getDriverPerformance(
    driverId: string,
    tenantId: string,
  ): Promise<DriverPerformanceScore> {
    const cached = this.driverScores.get(driverId);
    if (cached && this.isScoreRecent(cached.lastUpdated)) {
      return cached;
    }

    return this.calculateDriverPerformance(driverId, tenantId);
  }

  /**
   * Get truck performance score (cached or calculated)
   */
  async getTruckPerformance(
    truckId: string,
    tenantId: string,
  ): Promise<TruckPerformanceScore> {
    const cached = this.truckScores.get(truckId);
    if (cached && this.isScoreRecent(cached.lastUpdated)) {
      return cached;
    }

    return this.calculateTruckPerformance(truckId, tenantId);
  }

  /**
   * Get top performing drivers
   */
  async getTopPerformingDrivers(
    tenantId: string,
    limit: number = 10,
  ): Promise<DriverPerformanceScore[]> {
    try {
      const drivers = await this.driverRepository.find({
        where: { tenantId, status: DriverStatus.ACTIVE },
        take: limit * 2, // Get more to filter
      });

      const driverScores = await Promise.all(
        drivers.map((driver) => this.getDriverPerformance(driver.id, tenantId)),
      );

      return driverScores
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, limit);
    } catch (error) {
      this.logger.error('Error getting top performing drivers:', error);
      throw error;
    }
  }

  /**
   * Get top performing trucks
   */
  async getTopPerformingTrucks(
    tenantId: string,
    limit: number = 10,
  ): Promise<TruckPerformanceScore[]> {
    try {
      const trucks = await this.truckRepository.find({
        where: { tenantId, isActive: true },
        take: limit * 2, // Get more to filter
      });

      const truckScores = await Promise.all(
        trucks.map((truck) => this.getTruckPerformance(truck.id, tenantId)),
      );

      return truckScores
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, limit);
    } catch (error) {
      this.logger.error('Error getting top performing trucks:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics for analytics
   */
  async getPerformanceMetrics(tenantId: string): Promise<PerformanceMetrics> {
    try {
      const drivers = await this.driverRepository.find({ where: { tenantId } });
      const trucks = await this.truckRepository.find({
        where: { tenantId, isActive: true },
      });

      const driverScores = await Promise.all(
        drivers.map((driver) => this.getDriverPerformance(driver.id, tenantId)),
      );

      const truckScores = await Promise.all(
        trucks.map((truck) => this.getTruckPerformance(truck.id, tenantId)),
      );

      const averageDriverScore =
        driverScores.reduce((sum, score) => sum + score.overallScore, 0) /
        driverScores.length;
      const averageTruckScore =
        truckScores.reduce((sum, score) => sum + score.overallScore, 0) /
        truckScores.length;

      return {
        totalDrivers: drivers.length,
        totalTrucks: trucks.length,
        averageDriverScore,
        averageTruckScore,
        topPerformers: {
          drivers: driverScores
            .sort((a, b) => b.overallScore - a.overallScore)
            .slice(0, 5),
          trucks: truckScores
            .sort((a, b) => b.overallScore - a.overallScore)
            .slice(0, 5),
        },
        performanceTrends: {
          driverScores: this.generatePerformanceTrends(driverScores),
          truckScores: this.generatePerformanceTrends(truckScores),
        },
      };
    } catch (error) {
      this.logger.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Update performance after trip completion
   */
  async updatePerformanceAfterTrip(
    tripId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      const trip = await this.tripRepository.findOne({
        where: { id: tripId, tenantId },
      });

      if (!trip) {
        throw new Error('Trip not found');
      }

      // Recalculate driver performance
      if (trip.driverId) {
        await this.calculateDriverPerformance(trip.driverId, tenantId);
      }

      // Recalculate truck performance
      if (trip.truckId) {
        await this.calculateTruckPerformance(trip.truckId, tenantId);
      }

      this.logger.debug(`Performance updated after trip: ${tripId}`);
    } catch (error) {
      this.logger.error('Error updating performance after trip:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private calculateEfficiencyScore(trips: Trip[]): number {
    if (trips.length === 0) return 0;

    const totalDistance = trips.reduce(
      (sum, trip) => sum + (trip.totalDistance || 0),
      0,
    );
    const totalTime = this.calculateTotalTripTime(trips);

    if (totalTime === 0) return 0;

    const averageSpeed = totalDistance / (totalTime / (1000 * 60 * 60)); // km/h
    const optimalSpeed = 80; // km/h

    return Math.min(1, averageSpeed / optimalSpeed);
  }

  private calculateTotalTripTime(trips: Trip[]): number {
    return trips.reduce((sum, trip) => {
      if (trip.actualStartTime && trip.actualEndTime) {
        return (
          sum + (trip.actualEndTime.getTime() - trip.actualStartTime.getTime())
        );
      }
      return sum;
    }, 0);
  }

  private calculateUtilizationRate(truck: Truck, trips: Trip[]): number {
    if (trips.length === 0) return 0;

    const totalUtilization = trips.reduce((sum, trip) => {
      const weightUtilization = (trip.load?.weight || 0) / truck.capacityWeight;
      const volumeUtilization = (trip.load?.volume || 0) / truck.capacityVolume;
      return sum + Math.max(weightUtilization, volumeUtilization);
    }, 0);

    return totalUtilization / trips.length;
  }

  private calculateFuelEfficiencyScore(
    averageConsumption: number,
    truckEfficiency: number,
  ): number {
    const baselineEfficiency = truckEfficiency || 6.5; // L/100km
    const efficiencyRatio =
      baselineEfficiency / Math.max(averageConsumption, 0.1);
    return Math.min(1, efficiencyRatio);
  }

  private isScoreRecent(lastUpdated: Date): boolean {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    return lastUpdated > fiveMinutesAgo;
  }

  private generatePerformanceTrends(
    scores: any[],
  ): Array<{ date: string; score: number }> {
    // Generate mock trend data for the last 7 days
    const trends: Array<{ date: string; score: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        score: 0.7 + Math.random() * 0.3, // Random score between 0.7 and 1.0
      });
    }
    return trends;
  }

  private async refreshPerformanceData(): Promise<void> {
    try {
      // Clear old cache entries
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      for (const [key, score] of this.driverScores.entries()) {
        if (score.lastUpdated < fiveMinutesAgo) {
          this.driverScores.delete(key);
        }
      }

      for (const [key, score] of this.truckScores.entries()) {
        if (score.lastUpdated < fiveMinutesAgo) {
          this.truckScores.delete(key);
        }
      }

      this.logger.debug('Performance cache refreshed');
    } catch (error) {
      this.logger.error('Error refreshing performance data:', error);
    }
  }

  /**
   * Clear performance cache
   */
  clearCache(): void {
    this.driverScores.clear();
    this.truckScores.clear();
    this.logger.log('Performance cache cleared');
  }
}
