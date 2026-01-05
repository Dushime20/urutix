import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { SmartMatchingService } from './services/smart-matching.service';
import { MarketIntelligenceService } from './services/market-intelligence.service';
import { CreditManagementService } from './services/credit-management.service';
import { MultiStopService } from './services/multi-stop.service';
import { PerformanceAnalyticsService } from './services/performance-analytics.service';
import { GenerateRecommendationsDto, AcceptRecommendationDto } from './dto/smart-matching.dto';
import { AnalyzeMarketRateDto, MarketForecastDto } from './dto/market-intelligence.dto';
import { PerformCreditCheckDto, UpdatePaymentTermsDto, CreditQueryDto } from './dto/credit-management.dto';
import { CreateMultiStopLoadDto, UpdateMultiStopLoadDto } from './dto/multi-stop.dto';
import { CalculatePerformanceDto, PerformanceQueryDto } from './dto/performance-analytics.dto';

@Controller('brokers/intelligence')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BROKER, UserRole.TENANT_ADMIN)
export class BrokerIntelligenceController {
  constructor(
    private readonly smartMatchingService: SmartMatchingService,
    private readonly marketIntelligenceService: MarketIntelligenceService,
    private readonly creditManagementService: CreditManagementService,
    private readonly multiStopService: MultiStopService,
    private readonly performanceAnalyticsService: PerformanceAnalyticsService,
  ) {}

  // ==================== SMART MATCHING ====================

  @Post('matching/generate')
  async generateRecommendations(
    @Request() req: any,
    @Body() dto: GenerateRecommendationsDto,
  ) {
    const brokerId = req.user.id;
    const tenantId = req.user.tenantId;

    return this.smartMatchingService.generateAIRecommendations(
      brokerId,
      dto.loadId,
      tenantId,
    );
  }

  @Get('matching/recommendations/:loadId')
  async getRecommendations(
    @Request() req: any,
    @Param('loadId') loadId: string,
  ) {
    const brokerId = req.user.id;
    const tenantId = req.user.tenantId;

    return this.smartMatchingService.getRecommendations(
      brokerId,
      loadId,
      tenantId,
    );
  }

  @Put('matching/recommendations/:id/accept')
  async acceptRecommendation(
    @Request() req: any,
    @Param('id') recommendationId: string,
    @Body() dto: AcceptRecommendationDto,
  ) {
    const brokerId = req.user.id;

    return this.smartMatchingService.acceptRecommendation(
      recommendationId,
      brokerId,
      dto.notes,
    );
  }

  // ==================== MARKET INTELLIGENCE ====================

  @Post('market/analyze')
  async analyzeMarketRate(
    @Request() req: any,
    @Body() dto: AnalyzeMarketRateDto,
  ) {
    const brokerId = req.user.id;
    const tenantId = req.user.tenantId;

    return this.marketIntelligenceService.getRealTimeMarketRate(
      brokerId,
      dto.route,
      tenantId,
    );
  }

  @Get('market/history')
  async getMarketHistory(
    @Request() req: any,
    @Query('limit') limit?: number,
  ) {
    const brokerId = req.user.id;
    const tenantId = req.user.tenantId;

    return this.marketIntelligenceService.getMarketIntelligenceHistory(
      brokerId,
      tenantId,
      limit || 50,
    );
  }

  @Post('market/forecast')
  async getMarketForecast(
    @Request() req: any,
    @Body() dto: MarketForecastDto,
  ) {
    const brokerId = req.user.id;
    const tenantId = req.user.tenantId;

    const marketIntel = await this.marketIntelligenceService.getRealTimeMarketRate(
      brokerId,
      dto.route,
      tenantId,
    );

    return {
      forecast: marketIntel.demandForecast,
      pricingInsights: marketIntel.pricingInsights,
      rateRecommendations: marketIntel.rateRecommendations,
    };
  }

  // ==================== CREDIT MANAGEMENT ====================

  @Post('credit/check')
  async performCreditCheck(
    @Request() req: any,
    @Body() dto: PerformCreditCheckDto,
  ) {
    const brokerId = req.user.id;
    const tenantId = req.user.tenantId;

    return this.creditManagementService.performCreditCheck(
      brokerId,
      dto.transporterId,
      tenantId,
    );
  }

  @Get('credit/records')
  async getCreditRecords(
    @Request() req: any,
    @Query() query: CreditQueryDto,
  ) {
    const brokerId = req.user.id;
    const tenantId = req.user.tenantId;

    if (query.transporterId) {
      return this.creditManagementService.getTransporterCredit(
        brokerId,
        query.transporterId,
        tenantId,
      );
    }

    return this.creditManagementService.getCreditRecords(brokerId, tenantId);
  }

  @Put('credit/:id/terms')
  async updatePaymentTerms(
    @Request() req: any,
    @Param('id') creditId: string,
    @Body() dto: UpdatePaymentTermsDto,
  ) {
    const brokerId = req.user.id;

    return this.creditManagementService.updatePaymentTerms(
      creditId,
      brokerId,
      dto.paymentTerms,
      dto.customPaymentDays || undefined,
    );
  }

  // ==================== MULTI-STOP ====================

  @Post('multi-stop')
  async createMultiStopLoad(
    @Request() req: any,
    @Body() dto: CreateMultiStopLoadDto,
  ) {
    const brokerId = req.user.id;
    const tenantId = req.user.tenantId;

    return this.multiStopService.createMultiStopLoad(
      brokerId,
      dto.loadId,
      tenantId,
      dto.stops as any,
    );
  }

  @Get('multi-stop/:loadId')
  async getMultiStopLoad(
    @Request() req: any,
    @Param('loadId') loadId: string,
  ) {
    const brokerId = req.user.id;
    const tenantId = req.user.tenantId;

    return this.multiStopService.getMultiStopLoad(
      brokerId,
      loadId,
      tenantId,
    );
  }

  @Put('multi-stop/:id')
  async updateMultiStopLoad(
    @Request() req: any,
    @Param('id') multiStopId: string,
    @Body() dto: UpdateMultiStopLoadDto,
  ) {
    const brokerId = req.user.id;

    return this.multiStopService.updateMultiStopLoad(
      multiStopId,
      brokerId,
      dto as any,
    );
  }

  // ==================== PERFORMANCE ANALYTICS ====================

  @Post('performance/calculate/:transporterId')
  async calculatePerformance(
    @Request() req: any,
    @Param('transporterId') transporterId: string,
  ) {
    const brokerId = req.user.id;
    const tenantId = req.user.tenantId;

    return this.performanceAnalyticsService.calculatePerformanceMetrics(
      brokerId,
      transporterId,
      tenantId,
    );
  }

  @Get('performance/:transporterId')
  async getTransporterPerformance(
    @Request() req: any,
    @Param('transporterId') transporterId: string,
  ) {
    const brokerId = req.user.id;
    const tenantId = req.user.tenantId;

    return this.performanceAnalyticsService.getTransporterPerformance(
      brokerId,
      transporterId,
      tenantId,
    );
  }

  @Get('performance')
  async getPerformanceRecords(
    @Request() req: any,
    @Query() query: PerformanceQueryDto,
  ) {
    const brokerId = req.user.id;
    const tenantId = req.user.tenantId;

    if (query.transporterId) {
      return this.performanceAnalyticsService.getTransporterPerformance(
        brokerId,
        query.transporterId,
        tenantId,
      );
    }

    return this.performanceAnalyticsService.getBrokerPerformanceRecords(
      brokerId,
      tenantId,
    );
  }
}

