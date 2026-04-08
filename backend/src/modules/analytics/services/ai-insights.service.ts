import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsInsights } from '../../../entities/analytics-insights.entity';
import { Trip } from '../../../entities/trip.entity';
import { Load } from '../../../entities/load.entity';

@Injectable()
export class AIInsightsService {
  private readonly logger = new Logger(AIInsightsService.name);

  constructor(
    @InjectRepository(AnalyticsInsights)
    private insightsRepository: Repository<AnalyticsInsights>,
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private loadRepository: Repository<Load>,
  ) {}

  async generateCostPredictions(tenantId: string, _cargoOwnerId: string, _routeHash?: string, _horizonDays = 30) {
    try {
      // Get recent trips to analyze cost trends
      const recentTrips = await this.tripRepository
        .createQueryBuilder('trip')
        .where('trip.tenantId = :tenantId', { tenantId })
        .andWhere('trip.plannedStartTime >= :since', { since: new Date(Date.now() - 90 * 86400000) })
        .getMany();

      if (recentTrips.length === 0) {
        return {
          prediction: null,
          confidence: 0,
          trend: 'stable',
          baseline: 0,
          reason: 'Insufficient data for cost predictions'
        };
      }

      const costs = recentTrips.map(t => Number(t.agreedPrice || 0)).filter(c => c > 0);
      const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
      
      // Simple trend analysis: compare first half vs second half
      const midpoint = Math.floor(costs.length / 2);
      const firstHalfAvg = costs.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
      const secondHalfAvg = costs.slice(midpoint).reduce((a, b) => a + b, 0) / (costs.length - midpoint);
      
      const trendPct = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (Math.abs(trendPct) > 5) {
        trend = trendPct > 0 ? 'increasing' : 'decreasing';
      }

      return {
        prediction: secondHalfAvg,
        confidence: costs.length >= 10 ? 0.75 : costs.length >= 5 ? 0.5 : 0.3,
        trend,
        baseline: avgCost,
        reason: `Based on ${costs.length} recent trips. ${trend === 'increasing' ? 'Costs trending upward' : trend === 'decreasing' ? 'Costs trending downward' : 'Costs remain stable'}.`
      };
    } catch (error) {
      this.logger.error('Error generating cost predictions:', error);
      return { prediction: null, confidence: 0, trend: 'stable', baseline: 0, reason: 'Error analyzing cost data' };
    }
  }

  async generateCarrierPredictions(_tenantId: string, _cargoOwnerId: string, _carrierId: string) {
    return { 
      predictedOnTimeRate: 0,
      predictedRating: 0,
      predictedCost: 0,
      confidence: 0, 
      recommendation: 'insufficient_data',
      reason: 'Carrier analytics not yet available' 
    };
  }

  async getInsights(tenantId: string) {
    return this.insightsRepository.find({ where: { tenantId } }).catch(() => []);
  }

  async generateComprehensiveInsights(tenantId: string, _userId: string) {
    try {
      const [costPredictions, routeOptimizations, riskAlerts] = await Promise.all([
        this.generateCostPredictions(tenantId, _userId),
        this.generateRouteOptimizations(tenantId, _userId),
        this.generateRiskAlerts(tenantId, _userId),
      ]);

      const totalInsights = 
        (routeOptimizations.length || 0) + 
        (riskAlerts.length || 0) + 
        (costPredictions.prediction ? 1 : 0);

      const highPriorityAlerts = riskAlerts.filter((a: any) => a.severity === 'high').length;
      
      // Calculate potential savings from route optimizations
      const potentialSavings = routeOptimizations.reduce((sum: number, opt: any) => 
        sum + (opt.potentialSavings || 0), 0
      );

      const keyRecommendations: string[] = [];
      if (costPredictions.trend === 'increasing') {
        keyRecommendations.push('Monitor rising costs and consider alternative routes');
      }
      if (routeOptimizations.length > 0) {
        keyRecommendations.push(`${routeOptimizations.length} route optimization opportunities identified`);
      }
      if (riskAlerts.length > 0) {
        keyRecommendations.push(`${riskAlerts.length} risk alerts require attention`);
      }

      return {
        costPredictions,
        routeOptimizations,
        demandForecasts: {
          forecast: null,
          trend: 'stable',
          confidence: 0,
          historicalAverage: 0,
          reason: 'Demand forecasting requires more historical data'
        },
        riskAlerts,
        generatedAt: new Date().toISOString(),
        summary: {
          totalInsights,
          highPriorityAlerts,
          potentialSavings,
          keyRecommendations
        }
      };
    } catch (error) {
      this.logger.error('Error generating comprehensive insights:', error);
      return {
        costPredictions: { prediction: null, confidence: 0, trend: 'stable', baseline: 0 },
        routeOptimizations: [],
        demandForecasts: { forecast: null, trend: 'stable', confidence: 0, historicalAverage: 0 },
        riskAlerts: [],
        generatedAt: new Date().toISOString(),
        summary: {
          totalInsights: 0,
          highPriorityAlerts: 0,
          potentialSavings: 0,
          keyRecommendations: ['Error generating insights']
        }
      };
    }
  }

  async generateDemandForecasts(_tenantId: string, _userId: string, _cargoType?: string) {
    return { 
      forecast: null,
      trend: 'stable',
      confidence: 0,
      historicalAverage: 0,
      reason: 'Demand forecasting requires more historical data' 
    };
  }

  async generateRouteOptimizations(tenantId: string, _userId: string) {
    try {
      // Analyze trips to find optimization opportunities
      const trips = await this.tripRepository
        .createQueryBuilder('trip')
        .leftJoinAndSelect('trip.load', 'load')
        .leftJoinAndSelect('trip.pickupLocation', 'pickup')
        .leftJoinAndSelect('trip.deliveryLocation', 'delivery')
        .where('trip.tenantId = :tenantId', { tenantId })
        .andWhere('trip.plannedStartTime >= :since', { since: new Date(Date.now() - 90 * 86400000) })
        .getMany();

      if (trips.length === 0) {
        return [];
      }

      // Group trips by route
      const routeMap = new Map<string, any[]>();
      trips.forEach(trip => {
        const pickupCity = (trip as any).pickupLocation?.city || 'Unknown';
        const deliveryCity = (trip as any).deliveryLocation?.city || 'Unknown';
        const route = `${pickupCity} → ${deliveryCity}`;
        if (!routeMap.has(route)) {
          routeMap.set(route, []);
        }
        routeMap.get(route)!.push(trip);
      });

      const optimizations: any[] = [];

      // Find routes with high costs
      routeMap.forEach((routeTrips, route) => {
        const costs = routeTrips.map(t => Number(t.agreedPrice || 0)).filter(c => c > 0);
        if (costs.length === 0) return;

        const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
        const maxCost = Math.max(...costs);
        const minCost = Math.min(...costs);

        // If there's significant cost variation, suggest optimization
        if (maxCost > avgCost * 1.2) {
          optimizations.push({
            type: 'cost_optimization',
            route,
            issue: `High cost variation detected on ${route}`,
            currentCost: avgCost,
            potentialSavings: maxCost - minCost,
            confidence: 0.7,
            recommendations: [
              'Review carrier selection for this route',
              'Consider consolidating shipments',
              'Negotiate better rates with preferred carriers'
            ]
          });
        }
      });

      return optimizations.slice(0, 5); // Return top 5 optimizations
    } catch (error) {
      this.logger.error('Error generating route optimizations:', error);
      return [];
    }
  }

  async generateRiskAlerts(tenantId: string, _userId: string) {
    try {
      const alerts: any[] = [];

      // Get recent trips
      const recentTrips = await this.tripRepository
        .createQueryBuilder('trip')
        .where('trip.tenantId = :tenantId', { tenantId })
        .andWhere('trip.plannedStartTime >= :since', { since: new Date(Date.now() - 30 * 86400000) })
        .getMany();

      if (recentTrips.length === 0) {
        return [];
      }

      // Check for cost spikes
      const costs = recentTrips.map(t => Number(t.agreedPrice || 0)).filter(c => c > 0);
      if (costs.length > 0) {
        const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
        const maxCost = Math.max(...costs);
        
        if (maxCost > avgCost * 1.5) {
          alerts.push({
            type: 'cost_spike',
            severity: 'high',
            message: `Unusual cost spike detected: ${((maxCost / avgCost - 1) * 100).toFixed(1)}% above average`,
            threshold: avgCost,
            maxValue: maxCost,
            confidence: 0.8
          });
        }
      }

      // Check for delayed trips
      const delayedTrips = recentTrips.filter(t => t.status === 'DELAYED' || t.status === 'CANCELLED');
      if (delayedTrips.length > recentTrips.length * 0.1) {
        alerts.push({
          type: 'performance_drop',
          severity: 'medium',
          message: `${delayedTrips.length} trips delayed or cancelled in the last 30 days`,
          currentRate: (delayedTrips.length / recentTrips.length) * 100,
          historicalRate: 5,
          confidence: 0.75
        });
      }

      return alerts;
    } catch (error) {
      this.logger.error('Error generating risk alerts:', error);
      return [];
    }
  }
}
