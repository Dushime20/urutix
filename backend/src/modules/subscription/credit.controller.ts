import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreditService, ConsumeCreditsDto } from '../../services/credit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditPackage } from '../../entities/credit-package.entity';
import { FeatureCreditCost } from '../../entities/feature-credit-cost.entity';
import { CreditConsumptionListener } from '../../services/credit-consumption.listener';

@ApiTags('Credits')
@ApiBearerAuth()
@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditController {
  constructor(
    private readonly creditService: CreditService,
    private readonly creditConsumptionListener: CreditConsumptionListener,
    @InjectRepository(CreditPackage)
    private creditPackageRepository: Repository<CreditPackage>,
    @InjectRepository(FeatureCreditCost)
    private featureCreditCostRepository: Repository<FeatureCreditCost>,
  ) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get credit balance for authenticated tenant' })
  @ApiResponse({ status: 200, description: 'Returns credit balance' })
  async getBalance(@Request() req) {
    const tenantId = req.user.tenantId;
    const balance = await this.creditService.getCreditBalance(tenantId);
    return {
      success: true,
      data: balance,
    };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get credit transaction history' })
  @ApiResponse({ status: 200, description: 'Returns transaction history' })
  async getTransactions(
    @Request() req,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const tenantId = req.user.tenantId;

    const filters: any = {};
    if (type) filters.type = type;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    const result = await this.creditService.getTransactionHistory(tenantId, filters);

    return {
      success: true,
      data: result.transactions,
      pagination: {
        total: result.total,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      },
    };
  }

  @Get('packages')
  @ApiOperation({ summary: 'Get available credit packages for purchase' })
  @ApiResponse({ status: 200, description: 'Returns credit packages' })
  async getPackages() {
    const packages = await this.creditPackageRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });

    return {
      success: true,
      data: packages,
    };
  }

  @Get('features')
  @ApiOperation({ summary: 'Get feature credit costs' })
  @ApiResponse({ status: 200, description: 'Returns feature credit costs' })
  async getFeatureCosts(@Query('planSlug') planSlug?: string) {
    const features = await this.featureCreditCostRepository.find({
      where: { isActive: true },
      order: { baseCost: 'ASC' },
    });

    // If plan slug provided, calculate costs for that plan
    const data = features.map((feature) => ({
      featureCode: feature.featureCode,
      featureName: feature.featureName,
      description: feature.description,
      baseCost: feature.baseCost,
      cost: planSlug ? feature.getCostForPlan(planSlug) : feature.baseCost,
      isFree: feature.isFree,
    }));

    return {
      success: true,
      data,
    };
  }

  @Get('features/:featureCode/cost')
  @ApiOperation({ summary: 'Get credit cost for a specific feature' })
  @ApiResponse({ status: 200, description: 'Returns feature cost' })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  async getFeatureCost(
    @Param('featureCode') featureCode: string,
    @Query('planSlug') planSlug?: string,
  ) {
    const cost = await this.creditService.getFeatureCost(featureCode, planSlug);

    return {
      success: true,
      data: {
        featureCode,
        cost,
        planSlug: planSlug || 'base',
      },
    };
  }

  @Post('consume')
  @ApiOperation({ summary: 'Consume credits for feature usage' })
  @ApiResponse({ status: 200, description: 'Credits consumed successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient credits' })
  async consumeCredits(@Request() req, @Body() body: Omit<ConsumeCreditsDto, 'tenantId'>) {
    const tenantId = req.user.tenantId;

    // Check if sufficient credits
    const hasSufficient = await this.creditService.hasSufficientCredits(
      tenantId,
      body.amount,
    );

    if (!hasSufficient) {
      const balance = await this.creditService.getCreditBalance(tenantId);
      throw new BadRequestException(
        `Insufficient credits. Required: ${body.amount}, Available: ${balance.currentBalance}`,
      );
    }

    const transaction = await this.creditService.consumeCredits({
      ...body,
      tenantId,
    });

    return {
      success: true,
      message: `${body.amount} credits consumed`,
      data: transaction,
    };
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Purchase credit package' })
  @ApiResponse({ status: 200, description: 'Credits purchased successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async purchaseCredits(
    @Request() req,
    @Body() body: { packageId: string; paymentMethodId: string },
  ) {
    const tenantId = req.user.tenantId;

    // Get package details
    const pkg = await this.creditPackageRepository.findOne({
      where: { id: body.packageId, isActive: true },
    });

    if (!pkg) {
      throw new BadRequestException('Invalid package');
    }

    // TODO: Process payment with payment gateway
    // For now, we'll simulate a successful payment
    const mockPaymentId = `pay_${Date.now()}`;

    // Grant credits
    const transaction = await this.creditService.grantPurchasedCredits(
      tenantId,
      pkg.credits,
      mockPaymentId,
      pkg.name,
    );

    return {
      success: true,
      message: `Successfully purchased ${pkg.credits} credits`,
      data: {
        transaction,
        package: pkg,
        paymentId: mockPaymentId,
      },
    };
  }

  @Get('usage/statistics')
  @ApiOperation({ summary: 'Get credit usage statistics' })
  @ApiResponse({ status: 200, description: 'Returns usage statistics' })
  async getUsageStatistics(@Request() req, @Query('days') days?: string) {
    const tenantId = req.user.tenantId;
    const period = days ? parseInt(days) : 30;

    const stats = await this.creditService.getUsageStatistics(tenantId, period);

    return {
      success: true,
      data: {
        ...stats,
        period: `Last ${period} days`,
      },
    };
  }

  @Post('refund')
  @ApiOperation({ summary: 'Refund credits (admin only)' })
  @ApiResponse({ status: 200, description: 'Credits refunded successfully' })
  async refundCredits(
    @Body()
    body: {
      tenantId: string;
      amount: number;
      reason: string;
      originalTransactionId?: string;
    },
  ) {
    // TODO: Add admin authorization check

    const transaction = await this.creditService.refundCredits(
      body.tenantId,
      body.amount,
      body.reason,
      body.originalTransactionId,
    );

    return {
      success: true,
      message: `${body.amount} credits refunded`,
      data: transaction,
    };
  }

  @Post('adjust')
  @ApiOperation({ summary: 'Manually adjust credits (admin only)' })
  @ApiResponse({ status: 200, description: 'Credits adjusted successfully' })
  async adjustCredits(
    @Request() req,
    @Body() body: { tenantId: string; amount: number; reason: string },
  ) {
    // TODO: Add admin authorization check
    const adminId = req.user.id;

    const transaction = await this.creditService.adjustCredits(
      body.tenantId,
      body.amount,
      body.reason,
      adminId,
    );

    return {
      success: true,
      message: `Credits adjusted by ${body.amount}`,
      data: transaction,
    };
  }

  @Get('low-balance')
  @ApiOperation({ summary: 'Get tenants with low balance (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns low balance accounts' })
  async getLowBalanceAccounts(@Query('threshold') threshold?: string) {
    // TODO: Add admin authorization check

    const accounts = await this.creditService.getLowBalanceTenants(
      threshold ? parseInt(threshold) : 100,
    );

    return {
      success: true,
      data: accounts,
    };
  }

  @Post('preview')
  @ApiOperation({ summary: 'Preview credit cost for a load before completion' })
  @ApiResponse({ status: 200, description: 'Returns cost preview' })
  async previewCost(
    @Request() req,
    @Body() body: { weight: number },
  ) {
    const tenantId = req.user.tenantId;

    if (!body.weight || body.weight <= 0) {
      throw new BadRequestException('Weight must be greater than 0');
    }

    const preview = await this.creditConsumptionListener.previewCreditCost(
      tenantId,
      body.weight,
    );

    return {
      success: true,
      data: {
        weight: body.weight,
        unit: 'tons',
        ...preview,
        message: preview.hasEnoughCredits
          ? `This load will cost ${preview.cost} credits`
          : `Insufficient credits. You need ${preview.cost} credits but only have ${preview.currentBalance}.`,
      },
    };
  }
}

