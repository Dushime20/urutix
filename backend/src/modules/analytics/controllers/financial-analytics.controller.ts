import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../auth/guards/roles.guard';
import { UserRole } from '../../../entities/user.entity';
import { FinancialAnalyticsService } from './../services/financial-analytics.service';
import {
  CostFiltersDto,
  ProfitabilityFiltersDto,
  RouteSpecDto,
  CostTrendsResponseDto,
  ProfitabilityAnalysisResponseDto,
  PricingRecommendationDto,
  FinancialSummaryDto,
} from '../dto/financial-analytics.dto';

@ApiTags('Financial Analytics')
@ApiBearerAuth()
@Controller('analytics/financial')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TENANT_ADMIN,
  UserRole.TRUCK_OWNER,
  UserRole.FLEET_MANAGER,
  UserRole.FLEET_ACCOUNTANT,
  UserRole.CARGO_OWNER,
  UserRole.BROKER,
)
export class FinancialAnalyticsController {
  constructor(
    private readonly financialAnalyticsService: FinancialAnalyticsService,
  ) {}

  @Get('cost-trends')
  @ApiOperation({ summary: 'Get cost trends analysis' })
  @ApiResponse({
    status: 200,
    description: 'Cost trends retrieved successfully',
    type: CostTrendsResponseDto,
  })
  async getCostTrends(
    @Request() req,
    @Query() filters: CostFiltersDto,
  ): Promise<CostTrendsResponseDto> {
    const { tenantId, userId, role } = req.user;
    return this.financialAnalyticsService.getCostTrends(
      tenantId,
      userId,
      filters,
      role,
    );
  }

  @Get('profitability')
  @ApiOperation({ summary: 'Get shipment profitability analysis' })
  @ApiResponse({
    status: 200,
    description: 'Profitability analysis retrieved successfully',
    type: ProfitabilityAnalysisResponseDto,
  })
  async getShipmentProfitability(
    @Request() req,
    @Query() filters: ProfitabilityFiltersDto,
  ): Promise<ProfitabilityAnalysisResponseDto> {
    const { tenantId, userId, role } = req.user;
    return this.financialAnalyticsService.getShipmentProfitability(
      tenantId,
      userId,
      filters,
      role,
    );
  }

  @Post('pricing-recommendations')
  @ApiOperation({ summary: 'Get pricing recommendations for a route' })
  @ApiResponse({
    status: 200,
    description: 'Pricing recommendations generated successfully',
    type: PricingRecommendationDto,
  })
  async getPricingRecommendations(
    @Request() req,
    @Body() routeSpec: RouteSpecDto,
  ): Promise<PricingRecommendationDto> {
    const { tenantId } = req.user;
    return this.financialAnalyticsService.getPricingRecommendations(tenantId, routeSpec);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get financial summary for dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Financial summary retrieved successfully',
    type: FinancialSummaryDto,
  })
  async getFinancialSummary(
    @Request() req,
    @Query() filters: CostFiltersDto,
  ): Promise<FinancialSummaryDto> {
    const { tenantId, userId, role } = req.user;
    return this.financialAnalyticsService.getFinancialSummary(
      tenantId,
      userId,
      filters,
      role,
    );
  }
}
