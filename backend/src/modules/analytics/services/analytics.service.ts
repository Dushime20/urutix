import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CargoOwnerAnalytics } from '../../../entities/cargo-owner-analytics.entity';
import { AnalyticsInsights, InsightType, InsightStatus } from '../../../entities/analytics-insights.entity';
import { 
  BaseAnalyticsFiltersDto, 
  InsightsFiltersDto, 
  PaginatedResponseDto,
  AnalyticsMetricsDto 
} from '../dto/analytics-filters.dto';

// Define SortOrder enum locally to avoid conflicts
enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(CargoOwnerAnalytics)
    private analyticsRepository: Repository<CargoOwnerAnalytics>,
    @InjectRepository(AnalyticsInsights)
    private insightsRepository: Repository<AnalyticsInsights>,
  ) {}

  /**
   * Get analytics overview metrics for dashboard
   */
  async getAnalyticsOverview(
    tenantId: string,
    cargoOwnerId: string,
  ): Promise<AnalyticsMetricsDto> {
    // Ensure tenant isolation (existing pattern)
    const analytics = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'COUNT(*) as totalShipments',
        'MIN(analytics.bookingDate) as earliestDate',
        'MAX(analytics.bookingDate) as latestDate',
        'MAX(analytics.updatedAt) as lastUpdated',
      ])
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .getRawOne();

    // Calculate data quality score
    const qualityMetrics = await this.calculateDataQuality(tenantId, cargoOwnerId);

    return {
      totalShipments: Number(analytics.totalShipments) || 0,
      dateRange: {
        start: analytics.earliestDate || new Date().toISOString(),
        end: analytics.latestDate || new Date().toISOString(),
      },
      lastUpdated: analytics.lastUpdated || new Date().toISOString(),
      completeness: qualityMetrics.completeness,
      dataQuality: qualityMetrics.quality,
    };
  }

  /**
   * Get analytics insights with filtering and pagination
   */
  async getInsights(
    tenantId: string,
    cargoOwnerId: string,
    filters: InsightsFiltersDto,
  ): Promise<PaginatedResponseDto<AnalyticsInsights>> {
    const queryBuilder = this.insightsRepository
      .createQueryBuilder('insights')
      .where('insights.tenantId = :tenantId', { tenantId })
      .andWhere('insights.cargoOwnerId = :cargoOwnerId', { cargoOwnerId });

    // Apply filters
    if (filters.insightType && filters.insightType !== 'all') {
      queryBuilder.andWhere('insights.insightType = :insightType', { 
        insightType: filters.insightType 
      });
    }

    if (filters.status && filters.status !== 'all') {
      queryBuilder.andWhere('insights.status = :status', { status: filters.status });
    }

    if (filters.minConfidence !== undefined) {
      queryBuilder.andWhere('insights.confidenceScore >= :minConfidence', { 
        minConfidence: filters.minConfidence 
      });
    }

    if (filters.withCostSavings) {
      queryBuilder.andWhere("insights.potentialImpact->>'costSavings' IS NOT NULL");
      queryBuilder.andWhere("CAST(insights.potentialImpact->>'costSavings' AS DECIMAL) > 0");
    }

    if (filters.expiringSoon) {
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      queryBuilder.andWhere('insights.expiresAt <= :sevenDaysFromNow', { sevenDaysFromNow });
      queryBuilder.andWhere('insights.expiresAt > NOW()');
    }

    // Apply sorting
    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = (filters.sortOrder || 'DESC') as 'ASC' | 'DESC';
    queryBuilder.orderBy(`insights.${sortField}`, sortOrder);

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const [data, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      filters: {
        insightType: filters.insightType,
        status: filters.status,
        minConfidence: filters.minConfidence,
        withCostSavings: filters.withCostSavings,
        expiringSoon: filters.expiringSoon,
      },
      sort: {
        field: sortField,
        order: sortOrder as any,
      },
    };
  }
  /**
   * Generate AI insights (placeholder - will integrate with credit system later)
   */
  async generateInsights(
    tenantId: string,
    cargoOwnerId: string,
    userId: string,
  ): Promise<AnalyticsInsights[]> {
    // TODO: Integrate with credit service for consumption
    // await this.creditService.consumeCredits({...});

    // TODO: Log the activity
    // await this.activityLogService.logActivity({...});

    // Generate insights based on analytics data
    const insights = await this.generateAIInsights(tenantId, cargoOwnerId);

    // Save insights to database
    const savedInsights = [];
    for (const insightData of insights) {
      const insight = this.insightsRepository.create(insightData);
      savedInsights.push(await this.insightsRepository.save(insight));
    }

    return savedInsights;
  }

  /**
   * Dismiss an insight
   */
  async dismissInsight(
    tenantId: string,
    cargoOwnerId: string,
    insightId: string,
    userId: string,
  ): Promise<AnalyticsInsights> {
    const insight = await this.insightsRepository.findOne({
      where: { 
        id: insightId, 
        tenantId, 
        cargoOwnerId 
      },
    });

    if (!insight) {
      throw new NotFoundException('Insight not found');
    }

    insight.dismiss();
    const updatedInsight = await this.insightsRepository.save(insight);

    // TODO: Log the activity
    // await this.activityLogService.logActivity({...});

    return updatedInsight;
  }

  /**
   * Mark insight as implemented
   */
  async implementInsight(
    tenantId: string,
    cargoOwnerId: string,
    insightId: string,
    userId: string,
  ): Promise<AnalyticsInsights> {
    const insight = await this.insightsRepository.findOne({
      where: { 
        id: insightId, 
        tenantId, 
        cargoOwnerId 
      },
    });

    if (!insight) {
      throw new NotFoundException('Insight not found');
    }

    insight.implement();
    const updatedInsight = await this.insightsRepository.save(insight);

    // TODO: Log the activity
    // await this.activityLogService.logActivity({...});

    return updatedInsight;
  }

  /**
   * Get analytics data with filters and pagination
   */
  async getAnalyticsData(
    tenantId: string,
    cargoOwnerId: string,
    filters: BaseAnalyticsFiltersDto,
  ): Promise<PaginatedResponseDto<CargoOwnerAnalytics>> {
    const queryBuilder = this.analyticsRepository
      .createQueryBuilder('analytics')
      .leftJoinAndSelect('analytics.load', 'load')
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId });

    // Apply date filters
    if (filters.startDate) {
      queryBuilder.andWhere('analytics.bookingDate >= :startDate', { 
        startDate: new Date(filters.startDate) 
      });
    }
    if (filters.endDate) {
      queryBuilder.andWhere('analytics.bookingDate <= :endDate', { 
        endDate: new Date(filters.endDate) 
      });
    }

    // Apply other filters
    if (filters.search) {
      queryBuilder.andWhere(
        '(analytics.originCity ILIKE :search OR analytics.destinationCity ILIKE :search OR analytics.cargoType ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.cargoType) {
      queryBuilder.andWhere('analytics.cargoType = :cargoType', { cargoType: filters.cargoType });
    }

    if (filters.originCity) {
      queryBuilder.andWhere('analytics.originCity = :originCity', { originCity: filters.originCity });
    }

    if (filters.destinationCity) {
      queryBuilder.andWhere('analytics.destinationCity = :destinationCity', { 
        destinationCity: filters.destinationCity 
      });
    }

    if (filters.carrierId) {
      queryBuilder.andWhere('analytics.carrierId = :carrierId', { carrierId: filters.carrierId });
    }

    if (filters.season) {
      queryBuilder.andWhere('analytics.season = :season', { season: filters.season });
    }

    // Apply sorting
    const sortField = filters.sortBy || 'bookingDate';
    const sortOrder = (filters.sortOrder || 'DESC') as 'ASC' | 'DESC';
    queryBuilder.orderBy(`analytics.${sortField}`, sortOrder);

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const [data, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      filters: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.search,
        cargoType: filters.cargoType,
        originCity: filters.originCity,
        destinationCity: filters.destinationCity,
        carrierId: filters.carrierId,
        season: filters.season,
      },
      sort: {
        field: sortField,
        order: sortOrder as any,
      },
    };
  }

  // Private helper methods

  /**
   * Calculate data quality metrics
   */
  private async calculateDataQuality(tenantId: string, cargoOwnerId: string) {
    const analytics = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'COUNT(*) as total',
        'COUNT(analytics.totalCost) as withCost',
        'COUNT(analytics.distanceKm) as withDistance',
        'COUNT(analytics.carrierId) as withCarrier',
        'COUNT(analytics.actualTransitHours) as withTransitTime',
      ])
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .getRawOne();

    const total = Number(analytics.total) || 1;
    const completeness = (
      (Number(analytics.withCost) + 
       Number(analytics.withDistance) + 
       Number(analytics.withCarrier) + 
       Number(analytics.withTransitTime)) / (total * 4)
    ) * 100;

    // Quality score based on data completeness and recency
    const quality = Math.min(100, completeness + 10); // Simplified quality calculation

    return {
      completeness: Math.round(completeness),
      quality: Math.round(quality),
    };
  }

  /**
   * Generate AI insights based on analytics data (placeholder for Phase 3)
   */
  private async generateAIInsights(
    tenantId: string,
    cargoOwnerId: string,
  ): Promise<Partial<AnalyticsInsights>[]> {
    // This is a placeholder implementation
    // In Phase 3, this will integrate with AI service for real insights
    
    const insights: Partial<AnalyticsInsights>[] = [];

    // Get recent analytics data for analysis
    const recentAnalytics = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.tenantId = :tenantId', { tenantId })
      .andWhere('analytics.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .andWhere('analytics.bookingDate >= :thirtyDaysAgo', { 
        thirtyDaysAgo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
      })
      .getMany();

    if (recentAnalytics.length === 0) {
      return insights;
    }

    // Generate cost optimization insight
    const avgCost = recentAnalytics.reduce((sum, a) => sum + (a.totalCost || 0), 0) / recentAnalytics.length;
    const highCostShipments = recentAnalytics.filter(a => (a.totalCost || 0) > avgCost * 1.2);
    
    if (highCostShipments.length > 0) {
      insights.push(AnalyticsInsights.createCostOptimizationInsight(
        tenantId,
        cargoOwnerId,
        {
          title: 'High-Cost Shipments Identified',
          description: `${highCostShipments.length} shipments are 20% above average cost. Consider route optimization.`,
          potentialSavings: avgCost * 0.2 * highCostShipments.length,
          confidence: 0.7,
          recommendations: [
            {
              action: 'Review high-cost routes for optimization opportunities',
              priority: 'medium',
              effort: 'low',
              timeline: '1-2 weeks',
              steps: [
                'Analyze route patterns',
                'Compare with alternative carriers',
                'Negotiate better rates',
              ],
            },
          ],
        }
      ));
    }

    // Generate carrier recommendation insight
    const carrierPerformance = this.analyzeCarrierPerformance(recentAnalytics);
    if (carrierPerformance.length > 1) {
      const bestCarrier = carrierPerformance[0];
      const worstCarrier = carrierPerformance[carrierPerformance.length - 1];
      
      if (bestCarrier.avgCost < worstCarrier.avgCost * 0.9) {
        insights.push(AnalyticsInsights.createCarrierRecommendationInsight(
          tenantId,
          cargoOwnerId,
          {
            title: 'Carrier Optimization Opportunity',
            description: `Switching to ${bestCarrier.carrierId} could reduce costs by ${((worstCarrier.avgCost - bestCarrier.avgCost) / worstCarrier.avgCost * 100).toFixed(1)}%`,
            carrierId: bestCarrier.carrierId,
            confidence: 0.8,
            recommendations: [
              {
                action: 'Increase usage of top-performing carrier',
                priority: 'high',
                effort: 'low',
                timeline: 'Immediate',
                steps: [
                  'Contact preferred carrier for capacity',
                  'Negotiate volume discounts',
                  'Monitor performance metrics',
                ],
              },
            ],
          }
        ));
      }
    }

    return insights;
  }

  /**
   * Analyze carrier performance from analytics data
   */
  private analyzeCarrierPerformance(analytics: CargoOwnerAnalytics[]) {
    const carrierMap = new Map();
    
    analytics.forEach(a => {
      if (a.carrierId && a.totalCost) {
        if (!carrierMap.has(a.carrierId)) {
          carrierMap.set(a.carrierId, { totalCost: 0, count: 0, onTimeCount: 0 });
        }
        const carrier = carrierMap.get(a.carrierId);
        carrier.totalCost += a.totalCost;
        carrier.count += 1;
        if (a.onTimeDelivery) carrier.onTimeCount += 1;
      }
    });

    return Array.from(carrierMap.entries())
      .map(([carrierId, data]) => ({
        carrierId,
        avgCost: data.totalCost / data.count,
        onTimeRate: data.onTimeCount / data.count,
        shipmentCount: data.count,
      }))
      .sort((a, b) => a.avgCost - b.avgCost); // Sort by cost (ascending)
  }
}