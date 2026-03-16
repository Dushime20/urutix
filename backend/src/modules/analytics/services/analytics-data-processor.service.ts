import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CargoOwnerAnalytics } from '../../../entities/cargo-owner-analytics.entity';
import { Load } from '../../../entities/load.entity';
import { CreditTransaction, CreditTransactionType } from '../../../entities/credit-transaction.entity';

export interface LoadCompletedEvent {
  loadId: string;
  tenantId: string;
  cargoOwnerId: string;
  status: string;
}

export interface CreditConsumptionEvent {
  tenantId: string;
  userId: string;
  amount: number;
  type: CreditTransactionType;
  referenceId?: string;
  referenceType?: string;
}

@Injectable()
export class AnalyticsDataProcessorService {
  private readonly logger = new Logger(AnalyticsDataProcessorService.name);

  constructor(
    @InjectRepository(CargoOwnerAnalytics)
    private analyticsRepository: Repository<CargoOwnerAnalytics>,
    @InjectRepository(Load)
    private loadRepository: Repository<Load>,
    @InjectRepository(CreditTransaction)
    private creditTransactionRepository: Repository<CreditTransaction>,
  ) {}

  /**
   * Process completed load for analytics (real-time processing)
   * Listens to existing load completion events
   */
  @OnEvent('load.completed')
  async processCompletedLoad(payload: LoadCompletedEvent): Promise<void> {
    try {
      this.logger.log(`Processing completed load: ${payload.loadId}`);

      // Get the complete load data
      const load = await this.loadRepository.findOne({
        where: { id: payload.loadId, tenantId: payload.tenantId },
        relations: ['cargoOwner'],
      });

      if (!load) {
        this.logger.warn(`Load not found: ${payload.loadId}`);
        return;
      }

      // Check if analytics record already exists
      const existingAnalytics = await this.analyticsRepository.findOne({
        where: { loadId: payload.loadId, tenantId: payload.tenantId },
      });

      if (existingAnalytics) {
        // Update existing record
        await this.updateAnalyticsFromLoad(existingAnalytics, load);
      } else {
        // Create new analytics record
        await this.createAnalyticsFromLoad(load, payload.tenantId);
      }

      this.logger.log(`Analytics processed for load: ${payload.loadId}`);
    } catch (error) {
      this.logger.error(`Failed to process load analytics: ${error.message}`, error.stack);
    }
  }

  /**
   * Process credit consumption for cost analytics (real-time processing)
   * Listens to existing credit consumption events
   */
  @OnEvent('credit.consumed')
  async processCreditConsumption(payload: CreditConsumptionEvent): Promise<void> {
    try {
      this.logger.log(`Processing credit consumption: ${payload.userId}`);

      // If this is a shipment-related credit consumption, update analytics
      if (payload.referenceType === 'LOAD' && payload.referenceId) {
        await this.updateAnalyticsCostFromCredit(
          payload.tenantId,
          payload.referenceId,
          Math.abs(payload.amount)
        );
      }

      this.logger.log(`Credit consumption analytics updated for user: ${payload.userId}`);
    } catch (error) {
      this.logger.error(`Failed to process credit consumption analytics: ${error.message}`, error.stack);
    }
  }
  /**
   * Daily batch processing to aggregate analytics data
   * Runs at 2 AM daily following existing cron patterns
   */
  @Cron('0 2 * * *')
  async processDailyAnalytics(): Promise<void> {
    try {
      this.logger.log('Starting daily analytics processing...');

      // Process loads from the last 2 days to catch any missed events
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      
      const recentLoads = await this.loadRepository
        .createQueryBuilder('load')
        .where('load.updatedAt >= :twoDaysAgo', { twoDaysAgo })
        .andWhere('load.status IN (:...statuses)', { 
          statuses: ['DELIVERED', 'COMPLETED', 'CLOSED'] 
        })
        .getMany();

      let processedCount = 0;
      let updatedCount = 0;

      for (const load of recentLoads) {
        const existingAnalytics = await this.analyticsRepository.findOne({
          where: { loadId: load.id, tenantId: load.tenantId },
        });

        if (existingAnalytics) {
          await this.updateAnalyticsFromLoad(existingAnalytics, load);
          updatedCount++;
        } else {
          await this.createAnalyticsFromLoad(load, load.tenantId);
          processedCount++;
        }
      }

      this.logger.log(`Daily analytics processing completed: ${processedCount} new, ${updatedCount} updated`);
    } catch (error) {
      this.logger.error(`Daily analytics processing failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Weekly batch processing for insights generation
   * Runs on Sunday at midnight following existing patterns
   */
  @Cron('0 0 * * 0')
  async processWeeklyInsights(): Promise<void> {
    try {
      this.logger.log('Starting weekly insights generation...');

      // Get all active cargo owners with recent activity
      const activeCargoOwners = await this.analyticsRepository
        .createQueryBuilder('analytics')
        .select('DISTINCT analytics.tenantId, analytics.cargoOwnerId')
        .where('analytics.createdAt >= :oneWeekAgo', { 
          oneWeekAgo: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        })
        .getRawMany();

      let insightsGenerated = 0;

      for (const cargoOwner of activeCargoOwners) {
        try {
          await this.generateInsightsForCargoOwner(cargoOwner.tenantId, cargoOwner.cargoOwnerId);
          insightsGenerated++;
        } catch (error) {
          this.logger.warn(`Failed to generate insights for cargo owner ${cargoOwner.cargoOwnerId}: ${error.message}`);
        }
      }

      this.logger.log(`Weekly insights generation completed: ${insightsGenerated} cargo owners processed`);
    } catch (error) {
      this.logger.error(`Weekly insights generation failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Create analytics record from Load entity
   */
  private async createAnalyticsFromLoad(load: Load, tenantId: string): Promise<CargoOwnerAnalytics> {
    const analyticsData = CargoOwnerAnalytics.fromLoad(load, tenantId);
    
    // Add calculated fields
    if (analyticsData.cargoWeightKg && analyticsData.totalCost) {
      analyticsData.costPerKg = analyticsData.totalCost / analyticsData.cargoWeightKg;
    }

    // Calculate distance and cost per km if possible
    if (load.locations && load.locations.length >= 2) {
      const distance = this.calculateDistance(load.locations);
      if (distance > 0) {
        analyticsData.distanceKm = distance;
        if (analyticsData.totalCost) {
          analyticsData.costPerKm = analyticsData.totalCost / distance;
        }
      }
    }

    // Calculate performance metrics
    this.calculatePerformanceMetrics(analyticsData, load);

    const analytics = this.analyticsRepository.create(analyticsData);
    return await this.analyticsRepository.save(analytics);
  }

  /**
   * Update existing analytics record from Load entity
   */
  private async updateAnalyticsFromLoad(analytics: CargoOwnerAnalytics, load: Load): Promise<CargoOwnerAnalytics> {
    // Update fields that might have changed
    analytics.totalCost = load.offeredPrice ? Number(load.offeredPrice) : analytics.totalCost;
    analytics.deliveryDate = load.deliveryDate || analytics.deliveryDate;
    analytics.onTimeDelivery = load.status === 'DELIVERED';
    analytics.carrierId = load.assignedCarrierId || analytics.carrierId;

    // Recalculate performance metrics
    this.calculatePerformanceMetrics(analytics, load);

    // Recalculate cost metrics
    if (analytics.cargoWeightKg && analytics.totalCost) {
      analytics.costPerKg = analytics.totalCost / analytics.cargoWeightKg;
    }
    if (analytics.distanceKm && analytics.totalCost) {
      analytics.costPerKm = analytics.totalCost / analytics.distanceKm;
    }

    return await this.analyticsRepository.save(analytics);
  }

  /**
   * Update analytics cost data from credit consumption
   */
  private async updateAnalyticsCostFromCredit(tenantId: string, loadId: string, creditAmount: number): Promise<void> {
    const analytics = await this.analyticsRepository.findOne({
      where: { loadId, tenantId },
    });

    if (analytics) {
      // Update cost based on credit consumption (this would need proper conversion rate)
      analytics.totalCost = creditAmount; // Simplified - would need proper credit-to-cost conversion
      
      // Recalculate derived metrics
      if (analytics.cargoWeightKg) {
        analytics.costPerKg = analytics.totalCost / analytics.cargoWeightKg;
      }
      if (analytics.distanceKm) {
        analytics.costPerKm = analytics.totalCost / analytics.distanceKm;
      }

      await this.analyticsRepository.save(analytics);
    }
  }

  /**
   * Calculate performance metrics for analytics
   */
  private calculatePerformanceMetrics(analytics: Partial<CargoOwnerAnalytics>, load: Load): void {
    // Calculate transit time
    if (analytics.pickupDate && analytics.deliveryDate) {
      const transitTimeMs = analytics.deliveryDate.getTime() - analytics.pickupDate.getTime();
      analytics.actualTransitHours = Math.round(transitTimeMs / (1000 * 60 * 60));
    }

    // Calculate delay (simplified - would need planned transit time from route planning)
    if (analytics.actualTransitHours && analytics.plannedTransitHours) {
      analytics.delayHours = Math.max(0, analytics.actualTransitHours - analytics.plannedTransitHours);
    }

    // Set delivery performance
    analytics.onTimeDelivery = load.status === 'DELIVERED' && (analytics.delayHours || 0) <= 2; // 2 hour tolerance
    analytics.damageReported = false; // Would need to check damage reports in full implementation
  }

  /**
   * Calculate distance between locations (simplified)
   */
  private calculateDistance(locations: any[]): number {
    // Simplified distance calculation - in production would use proper geolocation
    const pickup = locations.find(loc => loc.type === 'PICKUP');
    const delivery = locations.find(loc => loc.type === 'DELIVERY');
    
    if (pickup?.locationData?.coordinates && delivery?.locationData?.coordinates) {
      // Haversine formula for distance calculation
      const lat1 = pickup.locationData.coordinates.latitude;
      const lon1 = pickup.locationData.coordinates.longitude;
      const lat2 = delivery.locationData.coordinates.latitude;
      const lon2 = delivery.locationData.coordinates.longitude;
      
      const R = 6371; // Earth's radius in km
      const dLat = this.toRadians(lat2 - lat1);
      const dLon = this.toRadians(lon2 - lon1);
      
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
    
    return 0; // Default if coordinates not available
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate insights for a specific cargo owner (placeholder for Phase 3)
   */
  private async generateInsightsForCargoOwner(tenantId: string, cargoOwnerId: string): Promise<void> {
    // This will be implemented in Phase 3 with AI insights
    this.logger.log(`Generating insights for cargo owner: ${cargoOwnerId} (placeholder)`);
    
    // TODO: Log the activity when ActivityLogService is available
    // await this.activityLogService.logActivity({...});
  }

  /**
   * Backfill analytics data for existing loads
   */
  async backfillAnalyticsData(tenantId?: string, limit: number = 1000): Promise<void> {
    try {
      this.logger.log(`Starting analytics backfill${tenantId ? ` for tenant ${tenantId}` : ''}...`);

      const queryBuilder = this.loadRepository
        .createQueryBuilder('load')
        .where('load.status IN (:...statuses)', { 
          statuses: ['DELIVERED', 'COMPLETED', 'CLOSED'] 
        })
        .limit(limit);

      if (tenantId) {
        queryBuilder.andWhere('load.tenantId = :tenantId', { tenantId });
      }

      const loads = await queryBuilder.getMany();
      let processedCount = 0;

      for (const load of loads) {
        const existingAnalytics = await this.analyticsRepository.findOne({
          where: { loadId: load.id, tenantId: load.tenantId },
        });

        if (!existingAnalytics) {
          await this.createAnalyticsFromLoad(load, load.tenantId);
          processedCount++;
        }
      }

      this.logger.log(`Analytics backfill completed: ${processedCount} records created`);
    } catch (error) {
      this.logger.error(`Analytics backfill failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}