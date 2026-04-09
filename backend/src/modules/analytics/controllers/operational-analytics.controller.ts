import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../guards/permission.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { OperationalAnalyticsService } from './../services/operational-analytics.service';
import { CarrierIntelligenceService } from './../services/carrier-intelligence.service';
import { MarketIntelligenceService } from './../services/market-intelligence.service';

@ApiTags('Operational Analytics')
@ApiBearerAuth()
@Controller('analytics/operational')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class OperationalAnalyticsController {
  constructor(
    private readonly operationalAnalyticsService: OperationalAnalyticsService,
    private readonly carrierIntelligenceService: CarrierIntelligenceService,
    private readonly marketIntelligenceService: MarketIntelligenceService,
  ) {}

  @Get('performance')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get operational performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  async getPerformanceMetrics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { tenantId, userId, role } = req.user;
    
    const period = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date(),
    };

    return this.operationalAnalyticsService.getPerformanceMetrics(tenantId, userId, role, period);
  }

  @Get('routes')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get route performance analysis' })
  @ApiResponse({ status: 200, description: 'Route performance data retrieved successfully' })
  async getRoutePerformance(@Request() req) {
    const { tenantId, userId, role } = req.user;
    return this.operationalAnalyticsService.getRoutePerformance(tenantId, userId, role);
  }

  @Get('carriers')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get carrier performance analysis' })
  @ApiResponse({ status: 200, description: 'Carrier performance data retrieved successfully' })
  async getCarrierPerformance(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { tenantId, userId } = req.user;
    
    const periodStr = startDate && endDate ? `${startDate}_${endDate}` : 'last_30_days';

    return this.carrierIntelligenceService.analyzeCarrierPerformance(tenantId, userId, periodStr);
  }

  @Get('carriers/:carrierId/scorecard')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get detailed carrier scorecard' })
  @ApiResponse({ status: 200, description: 'Carrier scorecard retrieved successfully' })
  async getCarrierScorecard(
    @Request() req,
    @Param('carrierId') carrierId: string,
  ) {
    const { tenantId } = req.user;
    return this.operationalAnalyticsService.getCarrierScorecard(tenantId, carrierId);
  }

  @Get('carriers/recommendations/:routeHash')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get carrier recommendations for specific route' })
  @ApiResponse({ status: 200, description: 'Carrier recommendations retrieved successfully' })
  async getCarrierRecommendationsForRoute(
    @Request() req,
    @Param('routeHash') routeHash: string,
  ) {
    const { tenantId, userId } = req.user;
    return this.carrierIntelligenceService.getCarrierRecommendationsForRoute(
      tenantId, 
      userId, 
      routeHash
    );
  }

  @Get('market/benchmarks')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get industry benchmarks (anonymized)' })
  @ApiResponse({ status: 200, description: 'Industry benchmarks retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient data for benchmarking' })
  async getIndustryBenchmarks(@Request() req) {
    const { tenantId, userId } = req.user;
    return this.marketIntelligenceService.getIndustryBenchmarks(tenantId, userId);
  }

  @Get('market/trends')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get market trends analysis' })
  @ApiResponse({ status: 200, description: 'Market trends retrieved successfully' })
  async getMarketTrends(
    @Request() req,
    @Query('routeHash') routeHash?: string,
    @Query('cargoType') cargoType?: string,
    @Query('timeframe') timeframe: 'monthly' | 'quarterly' = 'monthly',
  ) {
    const { tenantId, userId } = req.user;
    return this.marketIntelligenceService.getMarketTrends(tenantId, userId, routeHash, cargoType);
  }

  @Get('market/positioning')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get competitive positioning analysis' })
  @ApiResponse({ status: 200, description: 'Competitive positioning retrieved successfully' })
  async getCompetitivePositioning(
    @Request() req,
    @Query('cargoType') cargoType?: string,
  ) {
    const { tenantId, userId } = req.user;
    return this.marketIntelligenceService.getCompetitivePositioning(tenantId, userId);
  }
}