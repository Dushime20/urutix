import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { EmergencyRematchService } from '../services/emergency-rematch.service';

@ApiTags('Emergency Re-Matching')
@Controller('matching/emergency')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class EmergencyRematchController {
  constructor(private readonly emergencyService: EmergencyRematchService) {}

  @Post('trip/:tripId')
  @ApiOperation({ summary: 'Trigger emergency re-match for a cancelled post-acceptance trip' })
  trigger(@Param('tripId', ParseUUIDPipe) tripId: string) {
    return this.emergencyService.triggerEmergencyRematch(tripId);
  }

  @Post('penalty/:truckOwnerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply cancellation penalty to a truck owner' })
  applyPenalty(@Param('truckOwnerId', ParseUUIDPipe) truckOwnerId: string, @Req() req: any) {
    return this.emergencyService.applyCancellationPenalty(truckOwnerId, req.user.tenantId);
  }

  @Get('penalty/:truckOwnerId')
  @ApiOperation({ summary: 'Check if a truck owner is under cancellation penalty' })
  checkPenalty(@Param('truckOwnerId', ParseUUIDPipe) truckOwnerId: string, @Req() req: any) {
    return this.emergencyService.isUnderPenalty(truckOwnerId, req.user.tenantId);
  }

  @Get('status/:loadId')
  @ApiOperation({ summary: 'Get emergency rematch status for a load' })
  getStatus(@Param('loadId', ParseUUIDPipe) loadId: string) {
    return this.emergencyService.getEmergencyStatus(loadId);
  }
}
