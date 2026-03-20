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
import { PredictiveAnalyticsService } from './../services/predictive-analytics.service';

@ApiTags('Predictive Analytics')
@ApiBearerAuth()
@Controller('analytics/predictive')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PredictiveAnalyticsController {
  constructor(
    private readonly predictiveService: PredictiveAnalyticsService,
  ) {}

  @Get('eta')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get ETA confidence and predictions for a route' })
  async getETAPrediction(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
  ) {
    return this.predictiveService.getRouteETAConfidence(origin, destination);
  }

  @Get('demand-heatmap')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get global demand heatmap for logistics hotspots' })
  async getDemandHeatmap() {
    return this.predictiveService.getGlobalDemandHeatmap();
  }

  @Get('pricing-engine')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Calculate optimal pricing recommendations for a route' })
  async getPricingRecommendation(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
    @Query('weight') weight?: number,
  ) {
    return this.predictiveService.calculateDynamicPricing(origin, destination, weight ? parseFloat(weight.toString()) : undefined);
  }

  @Get('benchmarking')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Compare performance against market benchmarks' })
  async getBenchmarking(@Request() req) {
    const { tenantId } = req.user;
    return this.predictiveService.getStrategicBenchmarking(tenantId);
  }

  @Get('recommendations')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get AI-driven lane optimization recommendations' })
  async getLaneRecommendations(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
  ) {
    return this.predictiveService.getAutomatedLaneOptimizations(origin, destination);
  }

  @Get('carrier-scores')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get ranked carrier performance scorecards' })
  async getCarrierScores(@Request() req) {
    const { tenantId } = req.user;
    return this.predictiveService.getCarrierPerformanceScorecards(tenantId);
  }

  @Get('sustainability')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get carbon footprint and sustainability metrics' })
  async getSustainability(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
    @Query('weight') weight: string,
  ) {
    return this.predictiveService.getSustainabilityMetrics(origin, destination, parseFloat(weight));
  }

  @Get('consolidation')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get automated cargo consolidation opportunities' })
  async getConsolidation(@Request() req) {
    const { tenantId } = req.user;
    return this.predictiveService.getConsolidationOpportunities(tenantId);
  }

  @Get('driver-safety')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get driver health and safety scorecards' })
  async getDriverSafety(@Request() req) {
    const { tenantId } = req.user;
    return this.predictiveService.getDriverSafetyScorecards(tenantId);
  }

  @Get('maintenance')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get predictive maintenance scorecards' })
  async getMaintenance(@Request() req) {
    const { tenantId } = req.user;
    return this.predictiveService.getPredictiveMaintenanceScorecards(tenantId);
  }

  @Get('diversions')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get neural route diversion opportunities' })
  async getDiversions(@Request() req) {
    const { tenantId } = req.user;
    return this.predictiveService.getRouteDiversions(tenantId);
  }

  @Get('damage')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get cargo damage risk forecasts' })
  async getDamageRisk(@Request() req) {
    const { tenantId } = req.user;
    return this.predictiveService.getPredictiveDamageMetrics(tenantId);
  }

  @Get('capacity')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get regional fleet capacity forecasts' })
  async getCapacityForecast(@Request() req) {
    const { tenantId } = req.user;
    return this.predictiveService.getCapacityForecast(tenantId);
  }

  @Get('utilization')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get AI-driven fleet utilization audit' })
  async getUtilization(@Request() req) {
    const { tenantId } = req.user;
    return this.predictiveService.getFleetUtilization(tenantId);
  }

  @Get('anomalies')
  @RequirePermissions('analytics:view_own', 'analytics:view_tenant', 'analytics:view_all')
  @ApiOperation({ summary: 'Get AI-driven cyber-intelligence & anomaly audit' })
  async getAnomalies(@Request() req) {
    const { tenantId } = req.user;
    return this.predictiveService.getAnomalyAudit(tenantId);
  }
}
