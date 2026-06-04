import { Controller, Get, Param, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { ComplianceGateService } from './compliance-gate.service';

@ApiTags('Compliance')
@Controller('compliance')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class ComplianceController {
  constructor(private readonly complianceGate: ComplianceGateService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Tenant compliance overview — drivers and trucks' })
  getDashboard(@Req() req: any) {
    return this.complianceGate.getTenantComplianceDashboard(req.user.tenantId);
  }

  @Get('driver/:id')
  @ApiOperation({ summary: 'Get compliance status for a specific driver' })
  getDriverStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.complianceGate.canAssignDriver(id);
  }

  @Get('truck/:id')
  @ApiOperation({ summary: 'Get compliance status for a specific truck' })
  getTruckStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.complianceGate.canAssignTruck(id);
  }
}
