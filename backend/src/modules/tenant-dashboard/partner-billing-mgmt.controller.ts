import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CreditService } from '../../services/credit.service';
import { SubscriptionService } from '../../services/subscription.service';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { BillingCycle } from '../../entities/tenant-subscription.entity';

@ApiTags('Tenant Partner Billing')
@Controller('tenant-dashboard/:tenantId/partners')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PartnerBillingController {
    constructor(
        private readonly creditService: CreditService,
        private readonly subscriptionService: SubscriptionService,
    ) { }

    @Get(':userId/billing-summary')
    @ApiOperation({ summary: 'Get billing summary for a partner' })
    @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
    @ApiParam({ name: 'userId', description: 'Partner User ID' })
    async getPartnerBillingSummary(
        @Param('tenantId') tenantId: string,
        @Param('userId') userId: string,
    ): Promise<ApiResponseDto<any>> {
        const [balance, subscription, history] = await Promise.all([
            this.creditService.getCreditBalance(tenantId, userId),
            this.subscriptionService.getCurrentSubscription(tenantId, userId),
            this.subscriptionService.getSubscriptionHistory(tenantId, userId),
        ]);

        return {
            success: true,
            statusCode: 200,
            message: 'Partner billing summary retrieved successfully',
            data: {
                balance,
                subscription,
                history,
            },
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':userId/credits/adjust')
    @ApiOperation({ summary: 'Adjust credits for a partner' })
    async adjustPartnerCredits(
        @Param('tenantId') tenantId: string,
        @Param('userId') userId: string,
        @Body() body: { amount: number; reason: string; adminId: string },
    ): Promise<ApiResponseDto<any>> {
        const transaction = await this.creditService.adjustCredits(
            tenantId,
            body.amount,
            body.reason,
            body.adminId,
            userId,
        );

        return {
            success: true,
            statusCode: 200,
            message: 'Partner credits adjusted successfully',
            data: transaction,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':userId/credits/history')
    @ApiOperation({ summary: 'Get credit transaction history for a partner' })
    async getPartnerCreditHistory(
        @Param('tenantId') tenantId: string,
        @Param('userId') userId: string,
        @Query('limit') limit: number = 20,
        @Query('offset') offset: number = 0,
    ): Promise<ApiResponseDto<any>> {
        const transactions = await this.creditService.getTransactionHistory(tenantId, {
            userId,
            limit,
            offset,
        });

        return {
            success: true,
            statusCode: 200,
            message: 'Partner credit history retrieved successfully',
            data: transactions,
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':userId/subscription/update')
    @ApiOperation({ summary: 'Update subscription for a partner' })
    async updatePartnerSubscription(
        @Param('tenantId') tenantId: string,
        @Param('userId') userId: string,
        @Body() body: { planId: string; billingCycle: BillingCycle },
    ): Promise<ApiResponseDto<any>> {
        const currentSub = await this.subscriptionService.getCurrentSubscription(tenantId, userId);

        if (currentSub) {
            await this.subscriptionService.cancelSubscription(currentSub.id, { immediate: true, reason: 'Plan updated by tenant admin' });
        }

        const subscription = await this.subscriptionService.createSubscription({
            tenantId,
            userId,
            planId: body.planId,
            billingCycle: body.billingCycle,
            startTrial: false,
        });

        return {
            success: true,
            statusCode: 200,
            message: 'Partner subscription updated successfully',
            data: subscription,
            timestamp: new Date().toISOString(),
        };
    }
}
