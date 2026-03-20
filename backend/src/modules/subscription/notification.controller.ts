import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionNotificationService } from '../../services/subscription-notification.service';
import { CreditService } from '../../services/credit.service';

@ApiTags('Subscription Notifications')
@ApiBearerAuth()
@Controller('subscription/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: SubscriptionNotificationService,
    private readonly creditService: CreditService,
  ) {}

  @Get('low-balance-partners')
  @ApiOperation({ summary: 'Get partners with low credit balances (Tenant Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns list of partners with low balances' })
  async getLowBalancePartners(
    @Request() req,
    @Query('threshold') threshold?: string,
  ) {
    const tenantId = req.user.tenantId;
    const userRole = req.user.role;

    // Only tenant admins can view this
    if (userRole !== 'TENANT_ADMIN') {
      return {
        success: false,
        message: 'Access denied. Tenant admin role required.',
      };
    }

    const balanceThreshold = threshold ? parseInt(threshold) : 1000;
    const lowBalancePartners = await this.creditService.getLowCreditPartners(
      tenantId,
      balanceThreshold,
    );

    return {
      success: true,
      data: lowBalancePartners.map(account => ({
        userId: account.user?.id,
        userName: account.user?.profile?.firstName || account.user?.email,
        email: account.user?.email,
        role: account.user?.role,
        currentBalance: account.currentBalance,
        subscriptionCredits: account.subscriptionCredits,
        purchasedCredits: account.purchasedCredits,
        bonusCredits: account.bonusCredits,
        lastRefreshDate: account.lastRefreshDate,
      })),
      meta: {
        threshold: balanceThreshold,
        count: lowBalancePartners.length,
      },
    };
  }

  @Get('balance-alerts')
  @ApiOperation({ summary: 'Get balance alert settings and status' })
  @ApiResponse({ status: 200, description: 'Returns balance alert configuration' })
  async getBalanceAlerts(@Request() req) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get current balance
    const shouldFetchUserAccount = userRole === 'TRUCK_OWNER';
    const balance = await this.creditService.getCreditBalance(
      tenantId,
      shouldFetchUserAccount ? userId : undefined,
    );

    // Determine alert level
    let alertLevel = 'NORMAL';
    let alertMessage = null;

    if (balance.currentBalance <= 50) {
      alertLevel = 'CRITICAL';
      alertMessage = 'Your credit balance is critically low. Service may be interrupted.';
    } else if (balance.currentBalance <= 200) {
      alertLevel = 'WARNING';
      alertMessage = 'Your credit balance is running low. Consider purchasing credits.';
    } else if (balance.currentBalance <= 500) {
      alertLevel = 'LOW';
      alertMessage = 'Your credit balance is getting low.';
    }

    return {
      success: true,
      data: {
        currentBalance: balance.currentBalance,
        alertLevel,
        alertMessage,
        thresholds: {
          critical: 50,
          warning: 200,
          low: 500,
        },
        recommendations: this.getBalanceRecommendations(balance.currentBalance),
      },
    };
  }

  @Post('test/:type')
  @ApiOperation({ summary: 'Send test notification (Admin only)' })
  @ApiResponse({ status: 200, description: 'Test notification sent' })
  async sendTestNotification(
    @Request() req,
    @Param('type') type: string,
  ) {
    const tenantId = req.user.tenantId;
    const userRole = req.user.role;

    // Only admins can send test notifications
    if (!['ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN'].includes(userRole)) {
      return {
        success: false,
        message: 'Access denied. Admin role required.',
      };
    }

    try {
      await this.notificationService.sendTestNotification(tenantId, type);

      return {
        success: true,
        message: `Test notification '${type}' sent successfully`,
        data: {
          type,
          tenantId,
          sentAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send test notification: ${error.message}`,
      };
    }
  }

  @Get('usage-forecast')
  @ApiOperation({ summary: 'Get credit usage forecast and recommendations' })
  @ApiResponse({ status: 200, description: 'Returns usage forecast and recommendations' })
  async getUsageForecast(@Request() req) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
      // Get current balance
      const shouldFetchUserAccount = userRole === 'TRUCK_OWNER';
      const balance = await this.creditService.getCreditBalance(
        tenantId,
        shouldFetchUserAccount ? userId : undefined,
      );

      // Get usage statistics
      const stats = await this.creditService.getUsageStatistics(tenantId, 30);

      // Calculate forecast
      const dailyAverage = stats.averageDaily || 0;
      const daysRemaining = dailyAverage > 0 ? Math.floor(balance.currentBalance / dailyAverage) : 999;
      
      // Estimate when balance will hit thresholds
      const criticalDate = dailyAverage > 0 ? 
        new Date(Date.now() + ((balance.currentBalance - 50) / dailyAverage) * 24 * 60 * 60 * 1000) : null;
      const warningDate = dailyAverage > 0 ? 
        new Date(Date.now() + ((balance.currentBalance - 200) / dailyAverage) * 24 * 60 * 60 * 1000) : null;

      return {
        success: true,
        data: {
          currentBalance: balance.currentBalance,
          dailyAverageUsage: dailyAverage,
          estimatedDaysRemaining: daysRemaining,
          forecast: {
            criticalBalanceDate: criticalDate,
            warningBalanceDate: warningDate,
            zeroBalanceDate: dailyAverage > 0 ? 
              new Date(Date.now() + (balance.currentBalance / dailyAverage) * 24 * 60 * 60 * 1000) : null,
          },
          recommendations: this.getUsageRecommendations(balance.currentBalance, dailyAverage, daysRemaining),
          topConsumingFeatures: stats.topFeatures.slice(0, 5),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to generate usage forecast: ${error.message}`,
      };
    }
  }

  @Get('subscription-status')
  @ApiOperation({ summary: 'Get subscription status and alerts' })
  @ApiResponse({ status: 200, description: 'Returns subscription status and upcoming events' })
  async getSubscriptionStatus(@Request() req) {
    const tenantId = req.user.tenantId;
    const userRole = req.user.role;

    // Only tenant-level users can view subscription status
    if (userRole === 'TRUCK_OWNER') {
      return {
        success: false,
        message: 'Subscription status not available for individual users.',
      };
    }

    try {
      // This would use the subscription service to get current subscription
      // For now, return a placeholder response
      return {
        success: true,
        data: {
          hasActiveSubscription: true,
          subscriptionType: 'Professional',
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          autoRenew: true,
          alerts: [
            {
              type: 'RENEWAL_REMINDER',
              message: 'Your subscription will renew in 15 days',
              priority: 'LOW',
              daysUntilEvent: 15,
            },
          ],
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get subscription status: ${error.message}`,
      };
    }
  }

  /**
   * Get balance-based recommendations
   */
  private getBalanceRecommendations(currentBalance: number): string[] {
    const recommendations = [];

    if (currentBalance <= 50) {
      recommendations.push('🚨 Purchase credits immediately to avoid service interruption');
      recommendations.push('💡 Consider upgrading to a higher subscription plan for more included credits');
      recommendations.push('📊 Review your usage patterns to optimize credit consumption');
    } else if (currentBalance <= 200) {
      recommendations.push('⚠️ Purchase credits within the next few days');
      recommendations.push('💰 Consider buying a larger credit package for better value');
      recommendations.push('📈 Monitor your daily usage to predict future needs');
    } else if (currentBalance <= 500) {
      recommendations.push('💡 Consider purchasing credits soon');
      recommendations.push('🎯 Review which features consume the most credits');
      recommendations.push('📅 Set up automatic credit purchase alerts');
    } else {
      recommendations.push('✅ Your credit balance is healthy');
      recommendations.push('📊 Monitor usage trends to optimize spending');
      recommendations.push('💎 Consider upgrading your plan if you frequently purchase credits');
    }

    return recommendations;
  }

  /**
   * Get usage-based recommendations
   */
  private getUsageRecommendations(balance: number, dailyAverage: number, daysRemaining: number): string[] {
    const recommendations = [];

    if (daysRemaining <= 3) {
      recommendations.push('🚨 URGENT: Purchase credits immediately - you have less than 3 days remaining');
      recommendations.push('📞 Contact support if you need assistance with credit purchases');
    } else if (daysRemaining <= 7) {
      recommendations.push('⚠️ Purchase credits this week to avoid running out');
      recommendations.push('💰 Consider buying a larger package for better value');
    } else if (daysRemaining <= 14) {
      recommendations.push('📅 Plan to purchase credits within the next two weeks');
      recommendations.push('📊 Review your usage patterns to optimize consumption');
    } else {
      recommendations.push('✅ Your current balance should last for a while');
      recommendations.push('📈 Monitor trends to predict future credit needs');
    }

    if (dailyAverage > 50) {
      recommendations.push('🔍 You have high daily usage - consider optimizing your operations');
      recommendations.push('📋 Review which features consume the most credits');
    }

    return recommendations;
  }
}