import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService, CreateSubscriptionDto } from '../../services/subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all available subscription plans' })
  @ApiResponse({ status: 200, description: 'Returns list of subscription plans' })
  async getPlans() {
    const plans = await this.subscriptionService.getAvailablePlans();
    return {
      success: true,
      data: plans,
    };
  }

  @Get('plans/:idOrSlug')
  @ApiOperation({ summary: 'Get a specific subscription plan' })
  @ApiResponse({ status: 200, description: 'Returns subscription plan details' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlan(@Param('idOrSlug') idOrSlug: string) {
    const plan = await this.subscriptionService.getPlan(idOrSlug);
    return {
      success: true,
      data: plan,
    };
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current subscription for authenticated tenant' })
  @ApiResponse({ status: 200, description: 'Returns current subscription' })
  async getCurrentSubscription(@Request() req) {
    const tenantId = req.user.tenantId;
    const subscription = await this.subscriptionService.getCurrentSubscription(tenantId);
    return {
      success: true,
      data: subscription,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get subscription history for authenticated tenant' })
  @ApiResponse({ status: 200, description: 'Returns subscription history' })
  async getSubscriptionHistory(@Request() req) {
    const tenantId = req.user.tenantId;
    const history = await this.subscriptionService.getSubscriptionHistory(tenantId);
    return {
      success: true,
      data: history,
    };
  }

  @Get('my-subscriptions')
  @ApiOperation({ summary: 'Get subscriptions purchased by authenticated user or all tenant subscriptions for admins' })
  @ApiResponse({ status: 200, description: 'Returns user subscriptions or all tenant subscriptions for admins' })
  async getMySubscriptions(@Request() req) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // TENANT_ADMIN and ADMIN see ALL tenant subscriptions
    // Other users see only their own subscriptions
    const shouldShowAllTenantSubscriptions = 
      userRole === 'TENANT_ADMIN' || 
      userRole === 'ADMIN' || 
      userRole === 'SUPER_ADMIN';
    
    const subscriptions = await this.subscriptionService.getSubscriptionHistory(
      tenantId, 
      shouldShowAllTenantSubscriptions ? undefined : userId
    );
    
    // Enrich with available credits for each subscription
    const enrichedSubscriptions = await Promise.all(
      subscriptions.map(async (sub) => {
        const availableCredits = await this.subscriptionService.getParentSubscriptionAvailableCredits(sub.id, tenantId);
        return {
          ...sub,
          availableCredits,
        };
      })
    );
    
    return {
      success: true,
      data: enrichedSubscriptions,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createSubscription(@Request() req, @Body() dto: CreateSubscriptionDto) {
    dto.tenantId = req.user.tenantId; // Override with authenticated tenant
    const subscription = await this.subscriptionService.createSubscription(dto);
    return {
      success: true,
      message: 'Subscription created successfully',
      data: subscription,
    };
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Purchase a subscription plan with payment' })
  @ApiResponse({ status: 201, description: 'Subscription purchased successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async purchaseSubscription(
    @Request() req,
    @Body() body: {
      planId: string;
      paymentMethod: 'card' | 'mobile_money';
      paymentDetails: any;
      /** ISO 4217 currency code sent by the client. If omitted the service falls back to MOBILE_MONEY_CURRENCY env. */
      currency?: string;
    },
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;

    // Process payment and create subscription
    const result = await this.subscriptionService.purchaseSubscription({
      tenantId,
      userId,
      planId: body.planId,
      paymentMethod: body.paymentMethod,
      paymentDetails: body.paymentDetails,
      currency: body.currency,
    });

    return {
      success: true,
      message: 'Subscription purchased successfully! Credits have been added to your account.',
      data: result,
    };
  }

  @Put(':id/upgrade')
  @ApiOperation({ summary: 'Upgrade subscription to higher tier' })
  @ApiResponse({ status: 200, description: 'Subscription upgraded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async upgradeSubscription(
    @Param('id') id: string,
    @Body() body: { newPlanId: string; immediate?: boolean },
  ) {
    const subscription = await this.subscriptionService.upgradeSubscription(id, body);
    return {
      success: true,
      message: 'Subscription upgraded successfully',
      data: subscription,
    };
  }

  @Put(':id/downgrade')
  @ApiOperation({ summary: 'Downgrade subscription to lower tier' })
  @ApiResponse({ status: 200, description: 'Subscription downgraded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async downgradeSubscription(
    @Param('id') id: string,
    @Body() body: { newPlanId: string; immediate?: boolean },
  ) {
    const subscription = await this.subscriptionService.downgradeSubscription(id, body);
    return {
      success: true,
      message: body.immediate
        ? 'Subscription downgraded successfully'
        : 'Subscription downgrade scheduled for end of billing period',
      data: subscription,
    };
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  async cancelSubscription(
    @Param('id') id: string,
    @Body() body: { reason?: string; immediate?: boolean },
  ) {
    const subscription = await this.subscriptionService.cancelSubscription(id, body);
    return {
      success: true,
      message: body.immediate
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at end of billing period',
      data: subscription,
    };
  }

  @Put(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate a cancelled subscription' })
  @ApiResponse({ status: 200, description: 'Subscription reactivated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot reactivate subscription' })
  async reactivateSubscription(@Param('id') id: string) {
    const subscription = await this.subscriptionService.reactivateSubscription(id);
    return {
      success: true,
      message: 'Subscription reactivated successfully',
      data: subscription,
    };
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get subscriptions expiring soon (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns expiring subscriptions' })
  async getExpiringSubscriptions(@Query('days') days: string = '7') {
    const subscriptions = await this.subscriptionService.getExpiringSubscriptions(
      parseInt(days),
    );
    return {
      success: true,
      data: subscriptions,
    };
  }

  @Get('trials/expiring')
  @ApiOperation({ summary: 'Get trials expiring soon (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns expiring trials' })
  async getExpiringTrials(@Query('days') days: string = '3') {
    const trials = await this.subscriptionService.getExpiringTrials(parseInt(days));
    return {
      success: true,
      data: trials,
    };
  }

  // Pricing Rules Endpoints
  @Get('pricing-rules')
  @ApiOperation({ summary: 'Get all pricing rules (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns list of pricing rules' })
  async getAllPricingRules() {
    const rules = await this.subscriptionService.getAllPricingRules();
    return {
      success: true,
      data: rules,
    };
  }

  @Post('pricing-rules')
  @ApiOperation({ summary: 'Create a new pricing rule (admin only)' })
  @ApiResponse({ status: 201, description: 'Pricing rule created successfully' })
  async createPricingRule(@Body() data: any) {
    const rule = await this.subscriptionService.createPricingRule(data);
    return {
      success: true,
      message: 'Pricing rule created successfully',
      data: rule,
    };
  }

  @Patch('pricing-rules/:id')
  @ApiOperation({ summary: 'Update a pricing rule (admin only)' })
  @ApiResponse({ status: 200, description: 'Pricing rule updated successfully' })
  async updatePricingRule(@Param('id') id: string, @Body() data: any) {
    const rule = await this.subscriptionService.updatePricingRule(id, data);
    return {
      success: true,
      message: 'Pricing rule updated successfully',
      data: rule,
    };
  }

  @Delete('pricing-rules/:id')
  @ApiOperation({ summary: 'Delete a pricing rule (admin only)' })
  @ApiResponse({ status: 200, description: 'Pricing rule deleted successfully' })
  async deletePricingRule(@Param('id') id: string) {
    await this.subscriptionService.deletePricingRule(id);
    return {
      success: true,
      message: 'Pricing rule deleted successfully',
    };
  }

  // Partner Plans Endpoints
  @Get('partner-plans')
  @ApiOperation({ summary: 'Get partner plans created by tenant admin' })
  @ApiResponse({ status: 200, description: 'Returns list of partner plans' })
  async getPartnerPlans(@Request() req) {
    const tenantId = req.user.tenantId;
    const plans = await this.subscriptionService.getPartnerPlans(tenantId);
    return {
      success: true,
      data: plans,
    };
  }

  @Post('partner-plans')
  @ApiOperation({ summary: 'Create a partner plan for truck owners' })
  @ApiResponse({ status: 201, description: 'Partner plan created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createPartnerPlan(
    @Request() req,
    @Body() body: {
      parentSubscriptionId: string;
      name: string;
      slug: string;
      description: string;
      creditCostPerPartner: number;
      availableSlots: number;
      totalCredits: number;
      isActive: boolean;
    },
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;

    const plan = await this.subscriptionService.createPartnerPlan({
      tenantId,
      userId,
      ...body,
    });

    return {
      success: true,
      message: 'Partner plan created successfully',
      data: plan,
    };
  }  @Put('partner-plans/:id')
  @ApiOperation({ summary: 'Update a partner plan' })
  @ApiResponse({ status: 200, description: 'Partner plan updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updatePartnerPlan(
    @Request() req,
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      slug?: string;
      description?: string;
      creditCostPerPartner?: number;
      availableSlots?: number;
      totalCredits?: number;
      isActive?: boolean;
    },
  ) {
    const tenantId = req.user.tenantId;

    const plan = await this.subscriptionService.updatePartnerPlan(id, tenantId, body);

    return {
      success: true,
      message: 'Partner plan updated successfully',
      data: plan,
    };
  }

  @Delete('partner-plans/:id')
  @ApiOperation({ summary: 'Delete a partner plan' })
  @ApiResponse({ status: 200, description: 'Partner plan deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete plan with active subscriptions' })
  async deletePartnerPlan(@Request() req, @Param('id') id: string) {
    const tenantId = req.user.tenantId;

    await this.subscriptionService.deletePartnerPlan(id, tenantId);

    return {
      success: true,
      message: 'Partner plan deleted successfully',
    };
  }

  @Get('available-plans')
  @ApiOperation({ summary: 'Get available plans for truck owners (includes partner plans)' })
  @ApiResponse({ status: 200, description: 'Returns list of available plans' })
  async getAvailablePlansForTruckOwners(@Request() req) {
    const tenantId = req.user.tenantId;

    // Get plans with slot information from service
    const plansWithSlotInfo = await this.subscriptionService.getAvailablePlansWithSlotInfo(tenantId);

    return {
      success: true,
      data: plansWithSlotInfo,
    };
  }

  @Get('partner-subscribers')
  @ApiOperation({ summary: 'Get truck owners who purchased partner plans' })
  @ApiResponse({ status: 200, description: 'Returns list of truck owner subscriptions' })
  async getPartnerSubscribers(@Request() req) {
    const tenantId = req.user.tenantId;
    const subscribers = await this.subscriptionService.getPartnerSubscribers(tenantId);
    return {
      success: true,
      data: subscribers,
    };
  }
}
