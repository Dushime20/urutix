import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService, CreateSubscriptionDto } from '../../services/subscription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('api/subscriptions')
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
}
