import { Controller, Get, Param, UseGuards, Req, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CarrierTierService } from './carrier-tier.service';

@ApiTags('Carrier Tiers')
@Controller('carrier-tiers')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class CarrierTierController {
  constructor(private readonly tierService: CarrierTierService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Top carriers by tier and on-time rate for this tenant' })
  getLeaderboard(@Req() req: any) {
    return this.tierService.getLeaderboard(req.user.tenantId);
  }

  @Get('my-tier')
  @ApiOperation({ summary: 'Get current tier and progress for the logged-in truck owner' })
  getMyTier(@Req() req: any) {
    return this.tierService.getTierProgress(req.user.id, req.user.tenantId);
  }

  @Get('owner/:ownerId')
  @ApiOperation({ summary: 'Get tier for a specific truck owner' })
  getOwnerTier(
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
    @Req() req: any,
  ) {
    return this.tierService.getTierForOwner(ownerId, req.user.tenantId);
  }

  @Post('recalculate')
  @ApiOperation({ summary: 'Manually trigger tier recalculation (admin)' })
  recalculate() {
    return this.tierService.recalculateAllTiers();
  }
}
