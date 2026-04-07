import {
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../guards/permission.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { AIInsightsService } from './../services/ai-insights.service';
import { PredictiveAnalyticsService } from './../services/predictive-analytics.service';

@ApiTags('AI Insights & Predictive Analytics')
@ApiBearerAuth()
@Controller('analytics/ai')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AIInsightsController {
  constructor(
    private readonly aiInsightsService: AIInsightsService,
    private readonly predictiveAnalyticsService: PredictiveAnalyticsService,
  ) {}

  @Get('insights/comprehensive')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get comprehensive AI insights and recommendations' })
  @ApiResponse({ status: 200, description: 'AI insights retrieved successfully' })
  async getComprehensiveInsights(@Request() req) {
    const { tenantId, userId } = req.user;
    return this.aiInsightsService.generateComprehensiveInsights(tenantId, userId);
  }

  @Get('predictions/costs')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get cost predictions using AI models' })
  @ApiResponse({ status: 200, description: 'Cost predictions retrieved successfully' })
  async getCostPredictions(
    @Request() req,
    @Query('routeHash') routeHash?: string,
    @Query('daysAhead') daysAhead?: number,
  ) {
    const { tenantId, userId } = req.user;
    return this.aiInsightsService.generateCostPredictions(
      tenantId, 
      userId, 
      routeHash, 
      daysAhead ? parseInt(daysAhead.toString()) : 30
    );
  }

  @Get('predictions/carrier/:carrierId')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get carrier performance predictions' })
  @ApiResponse({ status: 200, description: 'Carrier predictions retrieved successfully' })
  async getCarrierPredictions(
    @Request() req,
    @Param('carrierId') carrierId: string,
  ) {
    const { tenantId, userId } = req.user;
    return this.aiInsightsService.generateCarrierPredictions(tenantId, userId, carrierId);
  }

  @Get('predictions/demand')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get demand forecasting predictions' })
  @ApiResponse({ status: 200, description: 'Demand predictions retrieved successfully' })
  async getDemandPredictions(
    @Request() req,
    @Query('cargoType') cargoType?: string,
  ) {
    const { tenantId, userId } = req.user;
    return this.aiInsightsService.generateDemandForecasts(tenantId, userId, cargoType);
  }

  @Get('recommendations/routes')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get AI-powered route optimization recommendations' })
  @ApiResponse({ status: 200, description: 'Route recommendations retrieved successfully' })
  async getRouteRecommendations(@Request() req) {
    const { tenantId, userId } = req.user;
    return this.aiInsightsService.generateRouteOptimizations(tenantId, userId);
  }

  @Get('alerts/risks')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get AI-detected risk alerts and anomalies' })
  @ApiResponse({ status: 200, description: 'Risk alerts retrieved successfully' })
  async getRiskAlerts(@Request() req) {
    const { tenantId, userId } = req.user;
    return this.aiInsightsService.generateRiskAlerts(tenantId, userId);
  }

  @Get('forecasting/costs')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get advanced cost forecasting using time series analysis' })
  @ApiResponse({ status: 200, description: 'Cost forecasting retrieved successfully' })
  async getCostForecasting(
    @Request() req,
    @Query('routeHash') routeHash?: string,
    @Query('daysAhead') daysAhead?: number,
  ) {
    const { tenantId, userId } = req.user;
    return this.predictiveAnalyticsService.predictCosts(
      tenantId, 
      userId, 
      routeHash, 
      daysAhead ? parseInt(daysAhead.toString()) : 30
    );
  }

  @Get('forecasting/carrier/:carrierId')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get carrier performance forecasting' })
  @ApiResponse({ status: 200, description: 'Carrier forecasting retrieved successfully' })
  async getCarrierForecasting(
    @Request() req,
    @Param('carrierId') carrierId: string,
    @Query('daysAhead') daysAhead?: number,
  ) {
    const { tenantId, userId } = req.user;
    return this.predictiveAnalyticsService.predictCarrierPerformance(
      tenantId, 
      userId, 
      carrierId, 
      daysAhead ? parseInt(daysAhead.toString()) : 30
    );
  }

  @Get('forecasting/seasonal')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get seasonal demand pattern predictions' })
  @ApiResponse({ status: 200, description: 'Seasonal forecasting retrieved successfully' })
  async getSeasonalForecasting(
    @Request() req,
    @Query('cargoType') cargoType?: string,
  ) {
    const { tenantId, userId } = req.user;
    return this.predictiveAnalyticsService.predictSeasonalDemand(tenantId, userId, cargoType);
  }

  @Get('forecasting/route/:routeHash/efficiency')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get route efficiency predictions' })
  @ApiResponse({ status: 200, description: 'Route efficiency forecasting retrieved successfully' })
  async getRouteEfficiencyForecasting(
    @Request() req,
    @Param('routeHash') routeHash: string,
  ) {
    const { tenantId, userId } = req.user;
    return this.predictiveAnalyticsService.predictRouteEfficiency(tenantId, userId, routeHash);
  }

  @Post('insights/generate')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate new AI insights (consumes credits)' })
  @ApiResponse({ status: 201, description: 'AI insights generated successfully' })
  @ApiResponse({ status: 402, description: 'Insufficient credits' })
  async generateNewInsights(@Request() req) {
    const { tenantId, userId } = req.user;
    
    // TODO: Integrate with credit service for consumption
    // await this.creditService.consumeCredits({...});

    return this.aiInsightsService.generateComprehensiveInsights(tenantId, userId);
  }

  @Get('dashboard/summary')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get AI insights dashboard summary' })
  @ApiResponse({ status: 200, description: 'Dashboard summary retrieved successfully' })
  async getAIDashboardSummary(@Request() req) {
    const { tenantId, userId } = req.user;
    
    // Get quick summary of all AI insights
    const [insights, predictions, alerts] = await Promise.all([
      this.aiInsightsService.generateComprehensiveInsights(tenantId, userId),
      this.predictiveAnalyticsService.predictCosts(tenantId, userId),
      this.aiInsightsService.generateRiskAlerts(tenantId, userId)
    ]);

    return {
      insights,
      latestPrediction: predictions,
      activeAlerts: Array.isArray(alerts.alerts) ? alerts.alerts.filter((alert: any) => alert.severity === 'high').length : 0,
      generatedAt: new Date().toISOString()
    };
  }
}