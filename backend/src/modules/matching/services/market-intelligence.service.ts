import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Load, LoadStatus } from '../../../entities/load.entity';
import { Trip, TripStatus } from '../../../entities/trip.entity';
import { RateLimit } from '../entities/rate-limit.entity';

export interface MarketConditions {
  currentDemand: number; // 0-1 scale (0 = low demand, 1 = high demand)
  priceTrend: 'rising' | 'falling' | 'stable';
  regionalFactors: string[];
  seasonalFactors: string[];
  fuelPriceImpact: number;
  capacityUtilization: number;
  averageRates: {
    perMile: number;
    perHour: number;
    perLoad: number;
  };
  marketVolatility: number; // 0-1 scale
  predictedDemand: number; // 0-1 scale for next 24-48 hours
}

export interface RegionalMarketData {
  region: string;
  demandLevel: 'low' | 'medium' | 'high' | 'critical';
  capacityShortage: number; // 0-1 scale
  averageWaitTime: number; // hours
  priceMultiplier: number; // compared to baseline
  popularRoutes: string[];
  bottlenecks: string[];
}

@Injectable()
export class MarketIntelligenceService {
  private readonly logger = new Logger(MarketIntelligenceService.name);
  private readonly marketCache = new Map<
    string,
    { data: MarketConditions; expiry: number }
  >();
  private readonly cacheTTL = 15 * 60 * 1000; // 15 minutes

  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(RateLimit)
    private readonly rateLimitRepository: Repository<RateLimit>,
  ) {}

  /**
   * Get current market conditions for a tenant
   */
  async getCurrentConditions(tenantId: string): Promise<MarketConditions> {
    try {
      // Check cache first
      const cacheKey = `market_conditions:${tenantId}`;
      const cached = this.marketCache.get(cacheKey);

      if (cached && Date.now() < cached.expiry) {
        return cached.data;
      }

      // Calculate real-time market conditions
      const marketConditions = await this.calculateMarketConditions(tenantId);

      // Cache the results
      this.marketCache.set(cacheKey, {
        data: marketConditions,
        expiry: Date.now() + this.cacheTTL,
      });

      return marketConditions;
    } catch (error) {
      this.logger.warn(
        `Failed to get market conditions for tenant ${tenantId}: ${error.message}`,
      );
      return this.getDefaultMarketConditions();
    }
  }

  /**
   * Get regional market data
   */
  async getRegionalMarketData(region: string): Promise<RegionalMarketData> {
    try {
      // This would integrate with external market data providers
      // For now, return simulated data
      return this.simulateRegionalMarketData(region);
    } catch (error) {
      this.logger.warn(
        `Failed to get regional market data for ${region}: ${error.message}`,
      );
      return this.getDefaultRegionalData(region);
    }
  }

  /**
   * Get market insights for specific cargo type
   */
  async getCargoTypeInsights(
    cargoType: string,
    region: string,
  ): Promise<{
    demandLevel: string;
    priceTrend: string;
    capacityAvailability: number;
    recommendedPricing: number;
  }> {
    try {
      // Analyze historical data for specific cargo type
      const insights = await this.analyzeCargoTypeData(cargoType, region);
      return insights;
    } catch (error) {
      this.logger.warn(`Failed to get cargo type insights: ${error.message}`);
      return {
        demandLevel: 'medium',
        priceTrend: 'stable',
        capacityAvailability: 0.7,
        recommendedPricing: 2.5,
      };
    }
  }

  /**
   * Predict market demand for next 24-48 hours
   */
  async predictDemand(
    region: string,
    timeWindow: '24h' | '48h',
  ): Promise<{
    predictedDemand: number;
    confidence: number;
    factors: string[];
  }> {
    try {
      // This would use ML models for demand prediction
      // For now, use historical patterns
      const prediction = await this.calculateDemandPrediction(
        region,
        timeWindow,
      );
      return prediction;
    } catch (error) {
      this.logger.warn(`Failed to predict demand: ${error.message}`);
      return {
        predictedDemand: 0.6,
        confidence: 0.7,
        factors: ['Historical patterns', 'Seasonal trends'],
      };
    }
  }

  /**
   * Calculate real-time market conditions
   */
  private async calculateMarketConditions(
    tenantId: string,
  ): Promise<MarketConditions> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      // Get load and trip data for analysis
      const [recentLoads, recentTrips, historicalLoads] = await Promise.all([
        this.loadRepository.count({
          where: {
            createdAt: { $gte: last24Hours } as any,
            status: In([LoadStatus.CREATED, LoadStatus.PUBLISHED]),
          },
        }),
        this.tripRepository.count({
          where: {
            createdAt: { $gte: last24Hours } as any,
            status: TripStatus.IN_PROGRESS,
          },
        }),
        this.loadRepository.count({
          where: {
            createdAt: { $gte: lastWeek } as any,
            status: In([LoadStatus.CREATED, LoadStatus.PUBLISHED]),
          },
        }),
      ]);

      // Calculate demand level based on load-to-trip ratio
      const currentDemand = this.calculateDemandLevel(recentLoads, recentTrips);

      // Calculate price trend
      const priceTrend = await this.calculatePriceTrend(tenantId);

      // Get regional factors
      const regionalFactors = await this.getRegionalFactors(tenantId);

      // Get seasonal factors
      const seasonalFactors = this.getSeasonalFactors();

      // Calculate fuel price impact
      const fuelPriceImpact = await this.calculateFuelPriceImpact();

      // Calculate capacity utilization
      const capacityUtilization =
        await this.calculateCapacityUtilization(tenantId);

      // Calculate average rates
      const averageRates = await this.calculateAverageRates(tenantId);

      // Calculate market volatility
      const marketVolatility = this.calculateMarketVolatility(
        recentLoads,
        historicalLoads,
      );

      // Predict future demand
      const predictedDemand = await this.predictDemand('default', '24h').then(
        (p) => p.predictedDemand,
      );

      return {
        currentDemand,
        priceTrend,
        regionalFactors,
        seasonalFactors,
        fuelPriceImpact,
        capacityUtilization,
        averageRates,
        marketVolatility,
        predictedDemand,
      };
    } catch (error) {
      this.logger.error(
        `Error calculating market conditions: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Calculate demand level based on load and trip data
   */
  private calculateDemandLevel(loadCount: number, tripCount: number): number {
    if (tripCount === 0) return 0.5; // Neutral if no trips

    const ratio = loadCount / tripCount;

    // Normalize to 0-1 scale
    if (ratio <= 0.5) return 0.2; // Low demand
    if (ratio <= 1.0) return 0.5; // Medium demand
    if (ratio <= 2.0) return 0.8; // High demand
    return 1.0; // Critical demand
  }

  /**
   * Calculate price trend based on historical data
   */
  private async calculatePriceTrend(
    tenantId: string,
  ): Promise<'rising' | 'falling' | 'stable'> {
    try {
      // This would analyze historical pricing data
      // For now, use a simple algorithm
      const recentLoads = await this.loadRepository.find({
        where: {
          createdAt: { $gte: new Date(Date.now() - 7 * 60 * 60 * 1000) } as any,
          status: In([LoadStatus.CREATED, LoadStatus.PUBLISHED]),
        },
        order: { createdAt: 'ASC' },
        take: 100,
      });

      if (recentLoads.length < 10) return 'stable';

      // Calculate price trend over time
      const prices = recentLoads.map(
        (load) => load.offeredPrice || load.loadValue || 0,
      );
      const trend = this.calculateLinearTrend(prices);

      if (trend > 0.05) return 'rising';
      if (trend < -0.05) return 'falling';
      return 'stable';
    } catch (error) {
      this.logger.warn(`Failed to calculate price trend: ${error.message}`);
      return 'stable';
    }
  }

  /**
   * Calculate linear trend from price data
   */
  private calculateLinearTrend(prices: number[]): number {
    if (prices.length < 2) return 0;

    const n = prices.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = prices;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  /**
   * Get regional factors affecting the market
   */
  private async getRegionalFactors(tenantId: string): Promise<string[]> {
    try {
      // This would analyze regional data
      // For now, return common factors
      return [
        'Weather conditions',
        'Local events',
        'Infrastructure maintenance',
        'Seasonal patterns',
      ];
    } catch (error) {
      this.logger.warn(`Failed to get regional factors: ${error.message}`);
      return ['General market conditions'];
    }
  }

  /**
   * Get seasonal factors affecting the market
   */
  private getSeasonalFactors(): string[] {
    const month = new Date().getMonth();
    const factors: string[] = [];

    // Add seasonal factors based on current month
    if (month >= 11 || month <= 2) {
      factors.push('Winter weather conditions');
      factors.push('Holiday season demand');
    } else if (month >= 3 && month <= 5) {
      factors.push('Spring construction season');
      factors.push('Agricultural shipping');
    } else if (month >= 6 && month <= 8) {
      factors.push('Summer vacation season');
      factors.push('Tourism-related shipping');
    } else if (month >= 9 && month <= 10) {
      factors.push('Fall harvest season');
      factors.push('Back-to-school shipping');
    }

    return factors;
  }

  /**
   * Calculate fuel price impact on shipping costs
   */
  private async calculateFuelPriceImpact(): Promise<number> {
    try {
      // This would integrate with fuel price APIs
      // For now, return a simulated value
      const baseFuelPrice = 3.5; // $3.50 per gallon
      const currentFuelPrice = 3.75; // Simulated current price

      return (currentFuelPrice - baseFuelPrice) / baseFuelPrice; // 7% increase
    } catch (error) {
      this.logger.warn(
        `Failed to calculate fuel price impact: ${error.message}`,
      );
      return 0;
    }
  }

  /**
   * Calculate capacity utilization in the market
   */
  private async calculateCapacityUtilization(
    tenantId: string,
  ): Promise<number> {
    try {
      // This would analyze available vs. utilized capacity
      // For now, return a simulated value
      return 0.75; // 75% capacity utilization
    } catch (error) {
      this.logger.warn(
        `Failed to calculate capacity utilization: ${error.message}`,
      );
      return 0.7;
    }
  }

  /**
   * Calculate average shipping rates
   */
  private async calculateAverageRates(tenantId: string): Promise<{
    perMile: number;
    perHour: number;
    perLoad: number;
  }> {
    try {
      // This would analyze historical pricing data
      // For now, return industry averages
      return {
        perMile: 2.5,
        perHour: 45.0,
        perLoad: 1250.0,
      };
    } catch (error) {
      this.logger.warn(`Failed to calculate average rates: ${error.message}`);
      return {
        perMile: 2.25,
        perHour: 40.0,
        perLoad: 1000.0,
      };
    }
  }

  /**
   * Calculate market volatility
   */
  private calculateMarketVolatility(
    recentLoads: number,
    historicalLoads: number,
  ): number {
    if (historicalLoads === 0) return 0.5;

    const change =
      Math.abs(recentLoads - historicalLoads / 7) / (historicalLoads / 7);
    return Math.min(1, change);
  }

  /**
   * Calculate demand prediction
   */
  private async calculateDemandPrediction(
    region: string,
    timeWindow: '24h' | '48h',
  ): Promise<{
    predictedDemand: number;
    confidence: number;
    factors: string[];
  }> {
    try {
      // This would use ML models for prediction
      // For now, use simple heuristics
      const baseDemand = 0.6;
      const seasonalAdjustment = this.getSeasonalAdjustment();
      const weatherAdjustment = await this.getWeatherAdjustment(region);

      const predictedDemand = Math.max(
        0,
        Math.min(1, baseDemand + seasonalAdjustment + weatherAdjustment),
      );

      return {
        predictedDemand,
        confidence: 0.7,
        factors: ['Historical patterns', 'Seasonal trends', 'Weather forecast'],
      };
    } catch (error) {
      this.logger.warn(
        `Failed to calculate demand prediction: ${error.message}`,
      );
      return {
        predictedDemand: 0.6,
        confidence: 0.5,
        factors: ['Historical patterns'],
      };
    }
  }

  /**
   * Get seasonal adjustment factor
   */
  private getSeasonalAdjustment(): number {
    const month = new Date().getMonth();

    // Seasonal adjustments based on month
    if (month >= 11 || month <= 2) return 0.1; // Winter - higher demand
    if (month >= 3 && month <= 5) return 0.05; // Spring - moderate demand
    if (month >= 6 && month <= 8) return -0.05; // Summer - lower demand
    if (month >= 9 && month <= 10) return 0.1; // Fall - higher demand

    return 0;
  }

  /**
   * Get weather adjustment factor
   */
  private async getWeatherAdjustment(region: string): Promise<number> {
    try {
      // This would integrate with weather APIs
      // For now, return a small adjustment
      return 0.02;
    } catch (error) {
      this.logger.warn(`Failed to get weather adjustment: ${error.message}`);
      return 0;
    }
  }

  /**
   * Analyze cargo type specific data
   */
  private async analyzeCargoTypeData(
    cargoType: string,
    region: string,
  ): Promise<{
    demandLevel: string;
    priceTrend: string;
    capacityAvailability: number;
    recommendedPricing: number;
  }> {
    try {
      // This would analyze historical data for specific cargo types
      // For now, return simulated data
      const baseData = {
        demandLevel: 'medium',
        priceTrend: 'stable',
        capacityAvailability: 0.7,
        recommendedPricing: 2.5,
      };

      // Adjust based on cargo type
      switch (cargoType) {
        case 'HAZARDOUS':
          baseData.demandLevel = 'low';
          baseData.capacityAvailability = 0.3;
          baseData.recommendedPricing = 4.0;
          break;
        case 'REFRIGERATED':
          baseData.demandLevel = 'medium';
          baseData.capacityAvailability = 0.5;
          baseData.recommendedPricing = 3.5;
          break;
        case 'FRAGILE':
          baseData.demandLevel = 'medium';
          baseData.capacityAvailability = 0.6;
          baseData.recommendedPricing = 3.0;
          break;
        case 'OVERSIZED':
          baseData.demandLevel = 'low';
          baseData.capacityAvailability = 0.4;
          baseData.recommendedPricing = 5.0;
          break;
      }

      return baseData;
    } catch (error) {
      this.logger.warn(`Failed to analyze cargo type data: ${error.message}`);
      return {
        demandLevel: 'medium',
        priceTrend: 'stable',
        capacityAvailability: 0.7,
        recommendedPricing: 2.5,
      };
    }
  }

  /**
   * Simulate regional market data
   */
  private simulateRegionalMarketData(region: string): RegionalMarketData {
    // Simulate different market conditions for different regions
    const regionData: Record<string, RegionalMarketData> = {
      NORTHEAST: {
        region: 'NORTHEAST',
        demandLevel: 'high',
        capacityShortage: 0.8,
        averageWaitTime: 4,
        priceMultiplier: 1.3,
        popularRoutes: ['NYC-Boston', 'NYC-Philadelphia', 'Boston-Maine'],
        bottlenecks: ['NYC Metro Area', 'Boston Metro Area'],
      },
      SOUTHEAST: {
        region: 'SOUTHEAST',
        demandLevel: 'medium',
        capacityShortage: 0.5,
        averageWaitTime: 2,
        priceMultiplier: 1.1,
        popularRoutes: [
          'Atlanta-Miami',
          'Charlotte-Orlando',
          'Nashville-Atlanta',
        ],
        bottlenecks: ['Atlanta Metro Area'],
      },
      MIDWEST: {
        region: 'MIDWEST',
        demandLevel: 'medium',
        capacityShortage: 0.6,
        averageWaitTime: 3,
        priceMultiplier: 1.0,
        popularRoutes: [
          'Chicago-Detroit',
          'Chicago-Milwaukee',
          'Detroit-Cleveland',
        ],
        bottlenecks: ['Chicago Metro Area'],
      },
      WEST: {
        region: 'WEST',
        demandLevel: 'high',
        capacityShortage: 0.7,
        averageWaitTime: 5,
        priceMultiplier: 1.4,
        popularRoutes: [
          'LA-San Francisco',
          'Seattle-Portland',
          'Denver-Phoenix',
        ],
        bottlenecks: ['LA Metro Area', 'San Francisco Metro Area'],
      },
    };

    return regionData[region] || this.getDefaultRegionalData(region);
  }

  /**
   * Get default regional data
   */
  private getDefaultRegionalData(region: string): RegionalMarketData {
    return {
      region,
      demandLevel: 'medium',
      capacityShortage: 0.5,
      averageWaitTime: 3,
      priceMultiplier: 1.0,
      popularRoutes: [],
      bottlenecks: [],
    };
  }

  /**
   * Get default market conditions
   */
  private getDefaultMarketConditions(): MarketConditions {
    return {
      currentDemand: 0.6,
      priceTrend: 'stable',
      regionalFactors: ['General market conditions'],
      seasonalFactors: ['Standard seasonal patterns'],
      fuelPriceImpact: 0,
      capacityUtilization: 0.7,
      averageRates: {
        perMile: 2.5,
        perHour: 45.0,
        perLoad: 1250.0,
      },
      marketVolatility: 0.3,
      predictedDemand: 0.6,
    };
  }

  /**
   * Get real-time external market data
   */
  async getExternalMarketData(): Promise<any> {
    try {
      // Simulate external API calls for fuel prices, weather, etc.
      // In production, these would be real API integrations
      const fuelPrices = await this.getFuelPrices();
      const weatherConditions = await this.getWeatherConditions();
      const economicIndicators = await this.getEconomicIndicators();
      const regulatoryUpdates = await this.getRegulatoryUpdates();

      return {
        fuelPrices,
        weatherConditions,
        economicIndicators,
        regulatoryUpdates,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.warn('Failed to get external market data:', error);
      return {
        fuelPrices: { diesel: 3.5, gasoline: 3.2 },
        weatherConditions: { general: 'clear', alerts: [] },
        economicIndicators: { inflation: 2.1, gdpGrowth: 1.8 },
        regulatoryUpdates: { recent: [], impact: 'low' },
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Get fuel prices from external API
   */
  private async getFuelPrices(): Promise<any> {
    // Simulate API call to fuel price service
    // In production, integrate with services like:
    // - EIA API (Energy Information Administration)
    // - GasBuddy API
    // - Local fuel price aggregators
    return {
      diesel: {
        national: 3.5,
        regional: {
          northeast: 3.65,
          southeast: 3.45,
          midwest: 3.4,
          southwest: 3.35,
          west: 3.8,
        },
        trend: 'increasing',
        change24h: 0.05,
      },
      gasoline: {
        national: 3.2,
        regional: {
          northeast: 3.35,
          southeast: 3.15,
          midwest: 3.1,
          southwest: 3.05,
          west: 3.45,
        },
        trend: 'stable',
        change24h: 0.02,
      },
    };
  }

  /**
   * Get weather conditions for major routes
   */
  private async getWeatherConditions(): Promise<any> {
    // Simulate API call to weather service
    // In production, integrate with:
    // - OpenWeatherMap API
    // - Weather.gov API
    // - AccuWeather API
    return {
      majorRoutes: {
        'I-95': {
          condition: 'clear',
          temperature: 72,
          windSpeed: 8,
          alerts: [],
        },
        'I-80': {
          condition: 'partly_cloudy',
          temperature: 68,
          windSpeed: 12,
          alerts: [],
        },
        'I-10': {
          condition: 'clear',
          temperature: 85,
          windSpeed: 5,
          alerts: [],
        },
        'I-40': {
          condition: 'clear',
          temperature: 75,
          windSpeed: 10,
          alerts: [],
        },
      },
      regionalAlerts: [
        { region: 'Northeast', type: 'winter_storm', severity: 'moderate' },
        { region: 'Midwest', type: 'flood', severity: 'low' },
      ],
    };
  }

  /**
   * Get economic indicators
   */
  private async getEconomicIndicators(): Promise<any> {
    // Simulate API call to economic data service
    // In production, integrate with:
    // - Federal Reserve Economic Data (FRED)
    // - Bureau of Labor Statistics (BLS)
    // - World Bank API
    return {
      inflation: {
        current: 2.1,
        trend: 'decreasing',
        impact: 'moderate',
      },
      gdpGrowth: {
        current: 1.8,
        trend: 'stable',
        impact: 'low',
      },
      unemployment: {
        current: 3.7,
        trend: 'stable',
        impact: 'low',
      },
      consumerConfidence: {
        current: 108.0,
        trend: 'increasing',
        impact: 'positive',
      },
    };
  }

  /**
   * Get regulatory updates
   */
  private async getRegulatoryUpdates(): Promise<any> {
    // Simulate API call to regulatory service
    // In production, integrate with:
    // - FMCSA (Federal Motor Carrier Safety Administration)
    // - DOT (Department of Transportation)
    // - State regulatory bodies
    return {
      recent: [
        {
          title: 'Updated Hours of Service Regulations',
          impact: 'moderate',
          effectiveDate: '2024-01-15',
          description: 'New rules for driver rest periods',
        },
        {
          title: 'Emission Standards Update',
          impact: 'high',
          effectiveDate: '2024-07-01',
          description: 'Stricter emission requirements for trucks',
        },
      ],
      impact: 'moderate',
    };
  }

  /**
   * Get demand hotspots analysis
   */
  async getDemandHotspots(tenantId: string): Promise<any[]> {
    try {
      const loads = await this.loadRepository.find({
        where: { tenantId },
        order: { createdAt: 'DESC' },
        take: 100,
      });

      const routeDemand = {};

      // Analyze loads by route
      loads.forEach((load) => {
        const pickup = load.locations?.find((l) => l.type === 'PICKUP');
        const delivery = load.locations?.find((l) => l.type === 'DELIVERY');
        if (pickup?.locationData?.name && delivery?.locationData?.name) {
          const route = `${pickup.locationData.name} → ${delivery.locationData.name}`;
          (routeDemand as any)[route] = ((routeDemand as any)[route] || 0) + 1;
        }
      });

      // Return top 5 demand hotspots
      return Object.entries(routeDemand as Record<string, number>)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([route, count]) => ({
          route,
          demandCount: count,
          demandLevel: count > 10 ? 'high' : count > 5 ? 'medium' : 'low',
          estimatedWaitTime: this.estimateWaitTime(count),
          recommendedAction: this.getRecommendedAction(count),
        }));
    } catch (error) {
      this.logger.error('Error getting demand hotspots:', error);
      return [];
    }
  }

  /**
   * Estimate wait time based on demand
   */
  private estimateWaitTime(demandCount: number): string {
    if (demandCount > 15) return '4-6 hours';
    if (demandCount > 10) return '2-4 hours';
    if (demandCount > 5) return '1-2 hours';
    return 'Immediate';
  }

  /**
   * Get recommended action based on demand
   */
  private getRecommendedAction(demandCount: number): string {
    if (demandCount > 15) return 'Consider increasing prices by 15-20%';
    if (demandCount > 10) return 'Consider increasing prices by 10-15%';
    if (demandCount > 5) return 'Monitor market closely';
    return 'Standard pricing';
  }

  /**
   * Get capacity utilization by region
   */
  async getCapacityUtilization(tenantId: string): Promise<any> {
    try {
      const trips = await this.tripRepository.find({
        where: { tenantId },
        order: { createdAt: 'DESC' },
        take: 100,
      });

      if (trips.length === 0) return { overall: 0, byRegion: {} };

      const totalCapacity = trips.reduce(
        (sum, trip: any) => sum + (trip.capacity || 0),
        0,
      );
      const utilizedCapacity = trips.reduce(
        (sum, trip: any) => sum + (trip.actualLoad || 0),
        0,
      );
      const overallUtilization =
        totalCapacity > 0 ? (utilizedCapacity / totalCapacity) * 100 : 0;

      // Calculate by region
      const regionalUtilization: Record<
        string,
        { total: number; utilized: number } | number
      > = {};
      trips.forEach((trip: any) => {
        if (trip.pickupLocation?.region) {
          const region = trip.pickupLocation.region as string;
          if (!regionalUtilization[region]) {
            regionalUtilization[region] = { total: 0, utilized: 0 };
          }
          (regionalUtilization[region] as any).total += trip.capacity || 0;
          (regionalUtilization[region] as any).utilized += trip.actualLoad || 0;
        }
      });

      // Convert to percentages
      Object.keys(regionalUtilization).forEach((region) => {
        const bucket = regionalUtilization[region] as any;
        const total = bucket.total || 0;
        const utilized = bucket.utilized || 0;
        regionalUtilization[region] = total > 0 ? (utilized / total) * 100 : 0;
      });

      return {
        overall: Math.round(overallUtilization),
        byRegion: regionalUtilization,
        trend: this.getCapacityTrend(trips),
        recommendations: this.getCapacityRecommendations(overallUtilization),
      };
    } catch (error) {
      this.logger.error('Error getting capacity utilization:', error);
      return { overall: 0, byRegion: {}, trend: 'stable', recommendations: [] };
    }
  }

  /**
   * Get capacity utilization trend
   */
  private getCapacityTrend(trips: any[]): string {
    if (trips.length < 10) return 'stable';

    const recentTrips = trips.slice(0, 5);
    const olderTrips = trips.slice(5, 10);

    const recentUtilization =
      recentTrips.reduce((sum, trip) => {
        return sum + (trip.actualLoad || 0) / (trip.capacity || 1);
      }, 0) / recentTrips.length;

    const olderUtilization =
      olderTrips.reduce((sum, trip) => {
        return sum + (trip.actualLoad || 0) / (trip.capacity || 1);
      }, 0) / olderTrips.length;

    const change =
      ((recentUtilization - olderUtilization) / olderUtilization) * 100;

    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Get capacity recommendations
   */
  private getCapacityRecommendations(utilization: number): string[] {
    const recommendations = [];

    if (utilization > 90) {
      recommendations.push(
        'High capacity utilization - consider adding more vehicles',
      );
      recommendations.push('Monitor driver fatigue and maintenance schedules');
    } else if (utilization > 75) {
      recommendations.push(
        'Good capacity utilization - maintain current fleet size',
      );
      recommendations.push('Consider route optimization for better efficiency');
    } else if (utilization > 50) {
      recommendations.push(
        'Moderate capacity utilization - focus on route optimization',
      );
      recommendations.push('Consider diversifying service offerings');
    } else {
      recommendations.push(
        'Low capacity utilization - review pricing strategy',
      );
      recommendations.push(
        'Consider reducing fleet size or expanding market reach',
      );
    }

    return recommendations;
  }
}
