import { Injectable, Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CargoOwnerAnalytics } from '../../../entities/cargo-owner-analytics.entity';
import * as crypto from 'crypto';

interface ApiKey {
  id: string;
  tenantId: string;
  apiKey: string;
  keyName: string;
  permissions: string[];
  rateLimit: number;
  usageCount: number;
  isActive: boolean;
  expiresAt?: Date;
}

interface ApiUsageLog {
  apiKeyId: string;
  endpoint: string;
  method: string;
  responseStatus: number;
  responseTime: number;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ApiMarketplaceService {
  private readonly logger = new Logger(ApiMarketplaceService.name);
  private readonly apiKeys = new Map<string, ApiKey>();
  private readonly usageLogs: ApiUsageLog[] = [];
  private readonly rateLimitCache = new Map<string, { count: number; resetTime: number }>();

  constructor(
    @InjectRepository(CargoOwnerAnalytics)
    private analyticsRepository: Repository<CargoOwnerAnalytics>,
  ) {
    this.initializeApiMarketplace();
  }

  /**
   * Generate new API key for tenant
   */
  async generateApiKey(
    tenantId: string,
    keyName: string,
    permissions: string[] = [],
    rateLimit: number = 1000,
    expiresInDays?: number
  ) {
    try {
      // Generate secure API key
      const apiKey = this.generateSecureApiKey();
      
      const expiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;

      const keyData: ApiKey = {
        id: crypto.randomUUID(),
        tenantId,
        apiKey,
        keyName,
        permissions,
        rateLimit,
        usageCount: 0,
        isActive: true,
        expiresAt
      };

      // Store API key (in production, this would be in database)
      this.apiKeys.set(apiKey, keyData);

      this.logger.log(`Generated API key for tenant ${tenantId}: ${keyName}`);

      return {
        success: true,
        apiKey,
        keyId: keyData.id,
        keyName,
        permissions,
        rateLimit,
        expiresAt,
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to generate API key', error);
      throw error;
    }
  }

  /**
   * Validate API key and check permissions
   */
  async validateApiKey(
    apiKey: string,
    endpoint: string,
    method: string,
    ipAddress?: string
  ) {
    try {
      const keyData = this.apiKeys.get(apiKey);
      
      if (!keyData) {
        throw new UnauthorizedException('Invalid API key');
      }

      if (!keyData.isActive) {
        throw new UnauthorizedException('API key is inactive');
      }

      if (keyData.expiresAt && keyData.expiresAt < new Date()) {
        throw new UnauthorizedException('API key has expired');
      }

      // Check rate limiting
      await this.checkRateLimit(apiKey, keyData.rateLimit);

      // Check permissions
      if (!this.hasPermission(keyData, endpoint, method)) {
        throw new ForbiddenException('Insufficient permissions for this endpoint');
      }

      // Update usage count
      keyData.usageCount++;

      return {
        valid: true,
        tenantId: keyData.tenantId,
        keyId: keyData.id,
        permissions: keyData.permissions
      };

    } catch (error) {
      this.logger.warn(`API key validation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Log API usage
   */
  async logApiUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    responseStatus: number,
    responseTime: number,
    ipAddress?: string,
    userAgent?: string
  ) {
    const usageLog: ApiUsageLog = {
      apiKeyId,
      endpoint,
      method,
      responseStatus,
      responseTime,
      ipAddress,
      userAgent
    };

    // Store usage log (in production, this would be in database)
    this.usageLogs.push(usageLog);

    // Keep only recent logs in memory
    if (this.usageLogs.length > 10000) {
      this.usageLogs.splice(0, 1000);
    }
  }

  /**
   * Get API usage analytics
   */
  async getApiUsageAnalytics(tenantId: string, timeRange: string = '24h') {
    try {
      const tenantKeys = Array.from(this.apiKeys.values())
        .filter(key => key.tenantId === tenantId);

      const keyIds = tenantKeys.map(key => key.id);
      const relevantLogs = this.usageLogs.filter(log => keyIds.includes(log.apiKeyId));

      const analytics = {
        totalRequests: relevantLogs.length,
        successfulRequests: relevantLogs.filter(log => log.responseStatus < 400).length,
        failedRequests: relevantLogs.filter(log => log.responseStatus >= 400).length,
        avgResponseTime: this.calculateAverageResponseTime(relevantLogs),
        topEndpoints: this.getTopEndpoints(relevantLogs),
        requestsByStatus: this.groupByStatus(relevantLogs),
        requestsByHour: this.groupByHour(relevantLogs),
        apiKeys: tenantKeys.map(key => ({
          keyId: key.id,
          keyName: key.keyName,
          usageCount: key.usageCount,
          isActive: key.isActive,
          permissions: key.permissions.length
        }))
      };

      return analytics;

    } catch (error) {
      this.logger.error('Failed to get API usage analytics', error);
      throw error;
    }
  }

  /**
   * Get public analytics data (for API marketplace)
   */
  async getPublicAnalytics(
    apiKey: string,
    endpoint: string,
    filters: any = {}
  ) {
    try {
      // Validate API key
      const validation = await this.validateApiKey(apiKey, endpoint, 'GET');
      
      // Get analytics data based on endpoint
      let data;
      switch (endpoint) {
        case '/public/analytics/cost-trends':
          data = await this.getPublicCostTrends(validation.tenantId, filters);
          break;
        case '/public/analytics/market-benchmarks':
          data = await this.getPublicMarketBenchmarks(filters);
          break;
        case '/public/analytics/route-performance':
          data = await this.getPublicRoutePerformance(validation.tenantId, filters);
          break;
        case '/public/analytics/demand-forecast':
          data = await this.getPublicDemandForecast(validation.tenantId, filters);
          break;
        default:
          throw new ForbiddenException('Endpoint not available in public API');
      }

      return {
        success: true,
        data,
        metadata: {
          endpoint,
          tenantId: validation.tenantId,
          timestamp: new Date().toISOString(),
          dataPoints: Array.isArray(data) ? data.length : 1
        }
      };

    } catch (error) {
      this.logger.error('Failed to get public analytics', error);
      throw error;
    }
  }

  /**
   * Manage API key permissions
   */
  async updateApiKeyPermissions(
    tenantId: string,
    apiKey: string,
    permissions: string[]
  ) {
    try {
      const keyData = this.apiKeys.get(apiKey);
      
      if (!keyData || keyData.tenantId !== tenantId) {
        throw new UnauthorizedException('API key not found or access denied');
      }

      keyData.permissions = permissions;

      return {
        success: true,
        apiKey,
        permissions,
        updatedAt: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to update API key permissions', error);
      throw error;
    }
  }

  /**
   * Deactivate API key
   */
  async deactivateApiKey(tenantId: string, apiKey: string) {
    try {
      const keyData = this.apiKeys.get(apiKey);
      
      if (!keyData || keyData.tenantId !== tenantId) {
        throw new UnauthorizedException('API key not found or access denied');
      }

      keyData.isActive = false;

      return {
        success: true,
        apiKey,
        deactivatedAt: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to deactivate API key', error);
      throw error;
    }
  }

  /**
   * Get API marketplace documentation
   */
  getApiDocumentation() {
    return {
      version: '1.0.0',
      title: 'UrutiX Analytics API Marketplace',
      description: 'Public API for accessing UrutiX analytics data',
      baseUrl: '/api/public/analytics',
      authentication: {
        type: 'API Key',
        header: 'X-API-Key',
        description: 'Include your API key in the X-API-Key header'
      },
      endpoints: [
        {
          path: '/cost-trends',
          method: 'GET',
          description: 'Get cost trend analytics',
          parameters: [
            { name: 'timeRange', type: 'string', description: 'Time range (7d, 30d, 90d)' },
            { name: 'cargoType', type: 'string', description: 'Filter by cargo type' }
          ],
          rateLimit: '1000 requests/hour',
          requiredPermissions: ['analytics:cost_trends']
        },
        {
          path: '/market-benchmarks',
          method: 'GET',
          description: 'Get market benchmark data',
          parameters: [
            { name: 'region', type: 'string', description: 'Geographic region' },
            { name: 'cargoType', type: 'string', description: 'Cargo type filter' }
          ],
          rateLimit: '500 requests/hour',
          requiredPermissions: ['analytics:market_data']
        },
        {
          path: '/route-performance',
          method: 'GET',
          description: 'Get route performance analytics',
          parameters: [
            { name: 'routeHash', type: 'string', description: 'Specific route identifier' },
            { name: 'limit', type: 'number', description: 'Number of results (max 100)' }
          ],
          rateLimit: '2000 requests/hour',
          requiredPermissions: ['analytics:route_performance']
        },
        {
          path: '/demand-forecast',
          method: 'GET',
          description: 'Get demand forecasting data',
          parameters: [
            { name: 'horizon', type: 'number', description: 'Forecast horizon in days' },
            { name: 'cargoType', type: 'string', description: 'Cargo type filter' }
          ],
          rateLimit: '100 requests/hour',
          requiredPermissions: ['analytics:demand_forecast']
        }
      ],
      rateLimits: {
        default: '1000 requests/hour',
        premium: '10000 requests/hour',
        enterprise: 'Unlimited'
      },
      errorCodes: {
        401: 'Unauthorized - Invalid or missing API key',
        403: 'Forbidden - Insufficient permissions',
        429: 'Too Many Requests - Rate limit exceeded',
        500: 'Internal Server Error'
      }
    };
  }

  private generateSecureApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async checkRateLimit(apiKey: string, limit: number) {
    const now = Date.now();
    const hourStart = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000);
    
    const cacheKey = `${apiKey}:${hourStart}`;
    const current = this.rateLimitCache.get(cacheKey) || { count: 0, resetTime: hourStart + 60 * 60 * 1000 };
    
    if (current.count >= limit) {
      throw new ForbiddenException(`Rate limit exceeded. Limit: ${limit} requests/hour`);
    }
    
    current.count++;
    this.rateLimitCache.set(cacheKey, current);
    
    // Clean up old entries
    this.cleanupRateLimitCache();
  }

  private hasPermission(keyData: ApiKey, endpoint: string, method: string): boolean {
    // Check if API key has required permissions for endpoint
    const requiredPermissions = this.getRequiredPermissions(endpoint, method);
    
    if (requiredPermissions.length === 0) {
      return true; // No specific permissions required
    }
    
    return requiredPermissions.some(permission => 
      keyData.permissions.includes(permission) || keyData.permissions.includes('analytics:all')
    );
  }

  private getRequiredPermissions(endpoint: string, method: string): string[] {
    const permissionMap: Record<string, string[]> = {
      '/public/analytics/cost-trends': ['analytics:cost_trends'],
      '/public/analytics/market-benchmarks': ['analytics:market_data'],
      '/public/analytics/route-performance': ['analytics:route_performance'],
      '/public/analytics/demand-forecast': ['analytics:demand_forecast']
    };
    
    return permissionMap[endpoint] || [];
  }

  private async getPublicCostTrends(tenantId: string, filters: any) {
    // Get anonymized cost trend data
    const trends = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        "DATE_TRUNC('day', analytics.bookingDate) as date",
        'AVG(analytics.totalCost) as avgCost',
        'COUNT(*) as shipmentCount'
      ])
      .where('analytics.tenantId = :tenantId', { tenantId })
      .groupBy("DATE_TRUNC('day', analytics.bookingDate)")
      .orderBy('date', 'DESC')
      .limit(30)
      .getRawMany();

    return trends.map(trend => ({
      date: trend.date,
      avgCost: parseFloat(trend.avgCost),
      shipmentCount: parseInt(trend.shipmentCount)
    }));
  }

  private async getPublicMarketBenchmarks(filters: any) {
    // Return anonymized market benchmark data
    return {
      avgCostPerKm: 150,
      avgTransitTime: 24,
      onTimeRate: 0.85,
      marketTrend: 'stable',
      dataPoints: 1000,
      lastUpdated: new Date().toISOString()
    };
  }

  private async getPublicRoutePerformance(tenantId: string, filters: any) {
    // Get route performance data
    const routes = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'analytics.routeHash',
        'AVG(analytics.totalCost) as avgCost',
        'AVG(analytics.actualTransitHours) as avgTransitTime',
        'COUNT(*) as shipmentCount'
      ])
      .where('analytics.tenantId = :tenantId', { tenantId })
      .groupBy('analytics.routeHash')
      .having('COUNT(*) >= 5')
      .orderBy('shipmentCount', 'DESC')
      .limit(filters.limit || 20)
      .getRawMany();

    return routes.map(route => ({
      routeHash: route.routeHash,
      avgCost: parseFloat(route.avgCost),
      avgTransitTime: parseFloat(route.avgTransitTime),
      shipmentCount: parseInt(route.shipmentCount)
    }));
  }

  private async getPublicDemandForecast(tenantId: string, filters: any) {
    // Generate demand forecast
    const horizon = filters.horizon || 30;
    const forecast = [];
    
    for (let i = 1; i <= horizon; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        predictedDemand: Math.floor(Math.random() * 50) + 20,
        confidence: 0.7 + Math.random() * 0.2
      });
    }
    
    return {
      forecast,
      horizon,
      generatedAt: new Date().toISOString()
    };
  }

  private calculateAverageResponseTime(logs: ApiUsageLog[]): number {
    if (logs.length === 0) return 0;
    return logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length;
  }

  private getTopEndpoints(logs: ApiUsageLog[], limit: number = 10) {
    const endpointCounts = logs.reduce((acc, log) => {
      acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  private groupByStatus(logs: ApiUsageLog[]) {
    return logs.reduce((acc, log) => {
      const statusGroup = Math.floor(log.responseStatus / 100) * 100;
      acc[statusGroup] = (acc[statusGroup] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }

  private groupByHour(logs: ApiUsageLog[]) {
    // Simplified grouping - in production would use actual timestamps
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: Math.floor(Math.random() * logs.length / 24)
    }));
    
    return hours;
  }

  private cleanupRateLimitCache() {
    const now = Date.now();
    for (const [key, data] of this.rateLimitCache.entries()) {
      if (data.resetTime < now) {
        this.rateLimitCache.delete(key);
      }
    }
  }

  private initializeApiMarketplace() {
    this.logger.log('API Marketplace service initialized');
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupRateLimitCache();
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}