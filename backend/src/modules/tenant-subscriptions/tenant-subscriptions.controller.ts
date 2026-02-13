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
import { TenantSubscriptionsService } from './tenant-subscriptions.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tenant-subscriptions')
@UseGuards(JwtAuthGuard)
export class TenantSubscriptionsController {
  constructor(private readonly subscriptionsService: TenantSubscriptionsService) {}

  // ==================== PLAN MANAGEMENT ====================

  @Post('plans')
  async createPlan(@Request() req, @Body() createPlanDto: CreatePlanDto) {
    const tenantId = req.user.tenantId;
    const plan = await this.subscriptionsService.createPlan(tenantId, createPlanDto);

    return {
      success: true,
      message: 'Plan created successfully',
      data: { plan },
    };
  }

  @Get('plans')
  async getTenantPlans(@Request() req, @Query('includeInactive') includeInactive?: string) {
    const tenantId = req.user.tenantId;
    const plans = await this.subscriptionsService.getTenantPlans(
      tenantId,
      includeInactive === 'true',
    );

    return {
      success: true,
      data: { plans },
    };
  }

  @Get('plans/:planId')
  async getPlanById(@Request() req, @Param('planId') planId: string) {
    const tenantId = req.user.tenantId;
    const plan = await this.subscriptionsService.getPlanById(planId, tenantId);

    return {
      success: true,
      data: { plan },
    };
  }

  @Put('plans/:planId')
  async updatePlan(
    @Request() req,
    @Param('planId') planId: string,
    @Body() updateData: Partial<CreatePlanDto>,
  ) {
    const tenantId = req.user.tenantId;
    const plan = await this.subscriptionsService.updatePlan(planId, tenantId, updateData);

    return {
      success: true,
      message: 'Plan updated successfully',
      data: { plan },
    };
  }

  @Put('plans/:planId/toggle-status')
  async togglePlanStatus(@Request() req, @Param('planId') planId: string) {
    const tenantId = req.user.tenantId;
    const plan = await this.subscriptionsService.togglePlanStatus(planId, tenantId);

    return {
      success: true,
      message: `Plan ${plan.status === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`,
      data: { plan },
    };
  }

  @Delete('plans/:planId')
  async deletePlan(@Request() req, @Param('planId') planId: string) {
    const tenantId = req.user.tenantId;
    await this.subscriptionsService.deletePlan(planId, tenantId);

    return {
      success: true,
      message: 'Plan deleted successfully',
    };
  }

  // ==================== STATISTICS & ANALYTICS ====================

  @Get('plans/:planId/statistics')
  async getPlanStatistics(@Request() req, @Param('planId') planId: string) {
    const tenantId = req.user.tenantId;
    const statistics = await this.subscriptionsService.getPlanStatistics(planId, tenantId);

    return {
      success: true,
      data: statistics,
    };
  }

  @Get('overview')
  async getSubscriptionOverview(@Request() req) {
    const tenantId = req.user.tenantId;
    const overview = await this.subscriptionsService.getTenantSubscriptionOverview(tenantId);

    return {
      success: true,
      data: overview,
    };
  }

  @Get('plans/:planId/subscribers')
  async getSubscribersByPlan(@Request() req, @Param('planId') planId: string) {
    const tenantId = req.user.tenantId;
    const subscribers = await this.subscriptionsService.getSubscribersByPlan(planId, tenantId);

    return {
      success: true,
      data: { subscribers },
    };
  }

  @Get('expiring')
  async getExpiringSubscriptions(@Request() req, @Query('days') days?: string) {
    const tenantId = req.user.tenantId;
    const daysAhead = days ? parseInt(days) : 30;
    const subscriptions = await this.subscriptionsService.getExpiringSubscriptions(
      tenantId,
      daysAhead,
    );

    return {
      success: true,
      data: { subscriptions, daysAhead },
    };
  }
}
