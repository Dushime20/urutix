import { Controller, Get, Param, Query, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';
import { RevenueEngineService } from './revenue-engine.service';

@ApiTags('Revenue')
@Controller('revenue')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class RevenueController {
  constructor(private readonly revenueEngine: RevenueEngineService) {}

  @Get('summary')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Platform-wide revenue summary (SUPER_ADMIN only)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getSummary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.revenueEngine.getPlatformRevenueSummary(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('tenant/:tenantId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Revenue breakdown for a specific tenant' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getTenantRevenue(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.revenueEngine.getTenantRevenue(
      tenantId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('my-tenant')
  @Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Revenue for the current user\'s tenant' })
  getMyTenantRevenue(@Req() req: any) {
    return this.revenueEngine.getTenantRevenue(req.user.tenantId);
  }
}
