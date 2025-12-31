import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  BrokerMarketIntelligence,
  MarketRateType,
} from '../../../entities/broker-intelligence.entity';
import { Load } from '../../../entities/load.entity';
import { Trip } from '../../../entities/trip.entity';
import { User } from '../../../entities/user.entity';

@Injectable()
export class MarketIntelligenceService {
  private readonly logger = new Logger(MarketIntelligenceService.name);

  constructor(
    @InjectRepository(BrokerMarketIntelligence)
    private marketIntelRepo: Repository<BrokerMarketIntelligence>,
    @InjectRepository(Load)
    private loadRepo: Repository<Load>,
    @InjectRepository(Trip)
    private tripRepo: Repository<Trip>,
  ) {}

  /**
   * Get real-time market rate analysis for a route
   */
  async getRealTimeMarketRate(
    brokerId: string,
    route: {
      origin: { city: string; state?: string; country: string };
      destination: { city: string; state?: string; country: string };
      distance: number;
    },
    tenantId: string,
  ): Promise<BrokerMarketIntelligence> {
    // Get current rates from recent loads/trips
    const recentLoads = await this.loadRepo.find({
      where: {
        tenantId,
        status: 'PUBLISHED' as any,
      },
      take: 50,
      order: { createdAt: 'DESC' },
    });

    // Filter loads on similar routes
    const similarLoads = recentLoads.filter((load) =>
      this.isSimilarRoute(route, load),
    );

    const rates = similarLoads
      .map((load) => Number(load.loadValue) || 0)
      .filter((rate) => rate > 0);

    const currentRate = rates.length > 0 ? this.calculateAverage(rates) : 0;
    const averageRate = currentRate;
    const medianRate = this.calculateMedian(rates);
    const minRate = rates.length > 0 ? Math.min(...rates) : 0;
    const maxRate = rates.length > 0 ? Math.max(...rates) : 0;

    // Get historical trends
    const historicalTrends = await this.getHistoricalTrends(route, tenantId);

    // Demand forecast
    const demandForecast = await this.forecastDemand(route, tenantId);

    // Rate recommendations
    const rateRecommendations = this.generateRateRecommendations(
      currentRate,
      averageRate,
      medianRate,
    );

    // Market factors
    const marketFactors = await this.analyzeMarketFactors(route, tenantId);

    // Pricing insights
    const pricingInsights = this.analyzePricingTrends(
      historicalTrends,
      currentRate,
    );

    const marketIntel = this.marketIntelRepo.create({
      tenantId,
      brokerId,
      rateType: MarketRateType.REAL_TIME,
      route,
      currentRate,
      averageRate,
      medianRate,
      minRate,
      maxRate,
      recommendedRate: rateRecommendations.competitiveRate,
      historicalTrends,
      demandForecast,
      rateRecommendations,
      marketFactors,
      pricingInsights,
    });

    return this.marketIntelRepo.save(marketIntel);
  }

  /**
   * Get historical pricing trends
   */
  async getHistoricalTrends(
    route: any,
    tenantId: string,
  ): Promise<BrokerMarketIntelligence['historicalTrends']> {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const loads7Days = await this.loadRepo.find({
      where: {
        tenantId,
        createdAt: Between(last7Days, now),
      },
    });

    const loads30Days = await this.loadRepo.find({
      where: {
        tenantId,
        createdAt: Between(last30Days, now),
      },
    });

    const loads90Days = await this.loadRepo.find({
      where: {
        tenantId,
        createdAt: Between(last90Days, now),
      },
    });

    const loadsYear = await this.loadRepo.find({
      where: {
        tenantId,
        createdAt: Between(lastYear, now),
      },
    });

    return {
      last7Days: this.extractRates(loads7Days),
      last30Days: this.extractRates(loads30Days),
      last90Days: this.extractRates(loads90Days),
      lastYear: this.extractRates(loadsYear),
    };
  }

  /**
   * Forecast demand for a route
   */
  async forecastDemand(
    route: any,
    tenantId: string,
  ): Promise<BrokerMarketIntelligence['demandForecast']> {
    // Analyze historical demand patterns
    const historicalLoads = await this.loadRepo.find({
      where: { tenantId },
      take: 100,
      order: { createdAt: 'DESC' },
    });

    const similarLoads = historicalLoads.filter((load) =>
      this.isSimilarRoute(route, load),
    );

    // Simple forecasting based on historical average
    const avgLoadsPerWeek = similarLoads.length / 4; // Assuming 4 weeks of data
    const next7Days = avgLoadsPerWeek;
    const next30Days = avgLoadsPerWeek * 4;

    return {
      next7Days: Math.round(next7Days),
      next30Days: Math.round(next30Days),
      confidence: 70, // Simplified confidence score
      factors: [
        'Historical demand patterns',
        'Seasonal trends',
        'Market conditions',
      ],
    };
  }

  /**
   * Generate rate recommendations
   */
  private generateRateRecommendations(
    currentRate: number,
    averageRate: number,
    medianRate: number,
  ): BrokerMarketIntelligence['rateRecommendations'] {
    const competitiveRate = medianRate * 0.95; // 5% below median
    const premiumRate = averageRate * 1.1; // 10% above average
    const budgetRate = medianRate * 0.85; // 15% below median

    return {
      competitiveRate: Math.round(competitiveRate),
      premiumRate: Math.round(premiumRate),
      budgetRate: Math.round(budgetRate),
      reasoning: `Based on market analysis: competitive rate is 5% below median, premium is 10% above average, budget is 15% below median.`,
    };
  }

  /**
   * Analyze market factors
   */
  private async analyzeMarketFactors(
    route: any,
    tenantId: string,
  ): Promise<BrokerMarketIntelligence['marketFactors']> {
    // Simplified analysis - in production, integrate with external APIs
    return {
      seasonality: 1.0, // Neutral
      demandLevel: 'MEDIUM',
      supplyLevel: 'MEDIUM',
      fuelPrice: 150, // KES per liter (example)
      weatherImpact: 0,
      competitionLevel: 0.5,
    };
  }

  /**
   * Analyze pricing trends
   */
  private analyzePricingTrends(
    historicalTrends: any,
    currentRate: number,
  ): BrokerMarketIntelligence['pricingInsights'] {
    const last7Days = historicalTrends.last7Days || [];
    if (last7Days.length === 0) {
      return {
        priceTrend: 'STABLE',
        volatility: 0,
      };
    }

    const avg7Days = this.calculateAverage(last7Days);
    const trend = currentRate > avg7Days ? 'INCREASING' : 'DECREASING';
    const volatility = this.calculateVolatility(last7Days);

    return {
      priceTrend: trend,
      volatility,
      bestTimeToBook: new Date(), // Would calculate optimal booking time
      priceChangePrediction: {
        direction: trend === 'INCREASING' ? 'UP' : 'DOWN',
        percentage: Math.abs(((currentRate - avg7Days) / avg7Days) * 100),
        timeframe: '7 days',
      },
    };
  }

  private isSimilarRoute(
    route: any,
    load: Load,
  ): boolean {
    // Simplified route matching
    const loadOrigin = load.pickupLocation?.locationData?.city || '';
    const loadDest = load.deliveryLocation?.locationData?.city || '';

    return (
      loadOrigin.toLowerCase().includes(route.origin.city.toLowerCase()) ||
      loadDest.toLowerCase().includes(route.destination.city.toLowerCase())
    );
  }

  private extractRates(loads: Load[]): number[] {
    return loads
      .map((load) => Number(load.loadValue) || 0)
      .filter((rate) => rate > 0);
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private calculateVolatility(numbers: number[]): number {
    if (numbers.length < 2) return 0;
    const avg = this.calculateAverage(numbers);
    const variance =
      numbers.reduce((sum, n) => sum + Math.pow(n - avg, 2), 0) /
      numbers.length;
    return Math.sqrt(variance) / avg; // Coefficient of variation
  }

  /**
   * Get market intelligence history
   */
  async getMarketIntelligenceHistory(
    brokerId: string,
    tenantId: string,
    limit: number = 50,
  ): Promise<BrokerMarketIntelligence[]> {
    return this.marketIntelRepo.find({
      where: { brokerId, tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}

