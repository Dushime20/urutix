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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreditPackage } from '../../entities/credit-package.entity';
import { FeatureCreditCost } from '../../entities/feature-credit-cost.entity';
import { CreditConsumptionListener } from '../../services/credit-consumption.listener';
import { Payment, PaymentMethod, PaymentStatus, PaymentType } from '../../entities/payment.entity';

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
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  @Get('balance')
  @ApiOperation({ summary: 'Get credit balance for authenticated user or tenant' })
  @ApiResponse({ status: 200, description: 'Returns credit balance' })
  async getBalance(@Request() req) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const userRole = req.user.role;

      // For TENANT_ADMIN: Get user account (operational credits) + tenant-level account (revenue data)
      // For TRUCK_OWNER: Get user account only
      // For others: Get tenant-level account
      if (userRole === 'TENANT_ADMIN' || userRole === 'ADMIN') {
        // For TENANT_ADMIN / ADMIN: always use the TENANT-level account.
        // Subscriptions and system grants are credited to the tenant account
        // (userId = null), so that is the authoritative source of truth.
        const tenantBalance = await this.creditService.getCreditBalance(tenantId, undefined);

        const balance = {
          ...tenantBalance,
          // creditsAvailableForAllocation is already set by getCreditBalance when userId is undefined,
          // but recalculate here for clarity
          creditsAvailableForAllocation:
            (tenantBalance.currentBalance || 0) - (tenantBalance.creditsAllocatedToPartners || 0),
        };

        console.log(
          `[CreditController] Balance for ${userRole} ${userId} (tenant ${tenantId}):`,
          balance.currentBalance,
          '| Revenue:', balance.revenueFromPartnerSales,
          '| Allocated:', balance.creditsAllocatedToPartners,
        );

        return {
          success: true,
          data: balance,
        };
      }
      
      // For TRUCK_OWNER and others
      const shouldFetchUserAccount = userRole === 'TRUCK_OWNER';
      
      const balance = await this.creditService.getCreditBalance(
        tenantId,
        shouldFetchUserAccount ? userId : undefined
      );
      
      console.log(`[CreditController] Balance for ${shouldFetchUserAccount ? 'user' : 'tenant'} ${shouldFetchUserAccount ? userId : tenantId}:`, balance.currentBalance);
      
      return {
        success: true,
        data: balance,
      };
    } catch (error) {
      console.error('[CreditController] Error getting balance:', error);
      throw error;
    }
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
    const userId = req.user.id;
    const userRole = req.user.role;

    const filters: any = {};
    if (type) filters.type = type;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    // Truck owners see only their own wallet. Tenant admins see only the company
    // wallet — truck-owner bid payments must not appear as deductions on their balance.
    if (userRole === 'TRUCK_OWNER') {
      filters.userId = userId;
    } else {
      filters.tenantLevelOnly = true;
    }

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

  @Get('transactions/summary')
  @ApiOperation({ summary: 'Get tenant admin transaction summary with credit allocation' })
  @ApiResponse({ status: 200, description: 'Returns transaction summary for tenant admin' })
  async getTransactionSummary(@Request() req) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('[getTransactionSummary] tenantId:', tenantId, 'userId:', userId, 'role:', userRole);

    // Only for TENANT_ADMIN and ADMIN
    if (userRole !== 'TENANT_ADMIN' && userRole !== 'ADMIN') {
      // For other roles, return their own transactions
      const result = await this.creditService.getTransactionHistory(tenantId, { userId });
      return {
        success: true,
        data: {
          transactions: result.transactions,
          summary: null,
        },
      };
    }

    // Company wallet only — do not mix truck-owner/partner deductions into tenant-admin history
    const result = await this.creditService.getTransactionHistory(tenantId, { tenantLevelOnly: true });

    // Get tenant-level credit balance (userId = undefined)
    const tenantBalance = await this.creditService.getCreditBalance(tenantId, undefined);
    console.log('[getTransactionSummary] tenantBalance:', JSON.stringify(tenantBalance, null, 2));

    // Create summary using tenant-level balance.
    // totalPurchased = lifetimeEarned (all credits ever granted/purchased),
    // NOT currentBalance (which decreases as credits are spent).
    const summary = {
      totalPurchased: tenantBalance.lifetimeEarned || 0,
      currentBalance: tenantBalance.currentBalance || 0,
      creditsSold: tenantBalance.creditsAllocatedToPartners || 0,
      partnersSold: tenantBalance.totalPartnersSold || 0,
      revenue: Number(tenantBalance.revenueFromPartnerSales) || 0,
    };

    console.log('[getTransactionSummary] summary:', JSON.stringify(summary, null, 2));

    return {
      success: true,
      data: {
        transactions: result.transactions,
        summary,
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

    // ── Record payment in payments table ──────────────────────────────────
    const totalAmount = Number(pkg.price || 0);
    const pkgCurrency: string = (pkg as any).currency || process.env.MOBILE_MONEY_CURRENCY || 'RWF';
    if (totalAmount > 0) {
      try {
        const payment = this.paymentRepository.create({
          tenantId,
          payerId: req.user.id,
          amount: totalAmount,
          currency: pkgCurrency,
          paymentMethod: PaymentMethod.CREDIT_CARD,
          paymentType: PaymentType.SERVICE_FEE,
          status: PaymentStatus.COMPLETED,
          transactionId: mockPaymentId,
          description: `Credit package purchase: ${pkg.name} (${pkg.credits} credits)`,
          processedAt: new Date(),
          metadata: { packageId: pkg.id, packageName: pkg.name, credits: pkg.credits },
        });
        await this.paymentRepository.save(payment);
      } catch (e) {
        console.error('[CreditController] Failed to save payment record:', e.message);
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    this.eventEmitter.emit('system.admin.credit_purchased', {
      tenantId,
      actorId: req.user?.id || req.user?.userId,
      actorRole: req.user?.role,
      packageId: pkg.id,
      packageName: pkg.name,
      credits: pkg.credits,
      amount: Number(pkg.price || 0),
      currency: pkgCurrency,
      paymentId: mockPaymentId,
    });

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

  @Post('admin/grant')
  @ApiOperation({ summary: 'Grant system credits to a tenant (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Credits granted successfully' })
  async grantSystemCredits(
    @Request() req,
    @Body() body: { tenantId: string; amount: number; reason: string; userId?: string }
  ) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Only super admins can grant system credits freely');
    }

    const parsedAmount = typeof body.amount === 'string' ? parseInt(body.amount, 10) : body.amount;

    const transaction = await this.creditService.grantSystemCredits(
      body.tenantId,
      parsedAmount,
      req.user.id,
      body.reason,
      body.userId
    );

    return {
      success: true,
      data: transaction,
    };
  }

  @Post('tenant/transfer')
  @ApiOperation({ summary: 'Transfer credits from Tenant to Truck Owner (Partner Billing)' })
  @ApiResponse({ status: 200, description: 'Credits transferred successfully' })
  async transferCredits(
    @Request() req,
    @Body() body: { targetUserId: string; amount: number; reason: string }
  ) {
    if (req.user.role !== 'TENANT_ADMIN') {
      throw new BadRequestException('Only tenant admins can transfer credits to partners');
    }

    const tenantId = req.user.tenantId;

    const parsedAmount = typeof body.amount === 'string' ? parseInt(body.amount, 10) : body.amount;

    const transaction = await this.creditService.transferCredits(
      tenantId,
      null,
      tenantId,
      body.targetUserId,
      parsedAmount,
      body.reason,
      req.user.id
    );

    return {
      success: true,
      data: transaction,
    };
  }

  @Get('admin/balances')
  @ApiOperation({ summary: 'Get all tenant balances (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns all tenant master balances' })
  async getAllTenantBalances(@Request() req) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Only super admins can view all tenant balances');
    }

    const balances = await this.creditService.getBalancesInScope();
    return {
      success: true,
      data: balances,
    };
  }

  @Get('tenant/users/balances')
  @ApiOperation({ summary: 'Get all user credit balances in tenant scope' })
  @ApiResponse({ status: 200, description: 'Returns all bounded user balances' })
  async getTenantUserBalances(@Request() req, @Query('role') role?: string) {
    if (req.user.role !== 'TENANT_ADMIN') {
      throw new BadRequestException('Only tenant admins can view partner balances');
    }

    const balances = await this.creditService.getBalancesInScope(req.user.tenantId, role);
    return {
      success: true,
      data: balances,
    };
  }
}

