import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
  Req,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../types/permission.types';
import { CapabilityService } from '../../services/capability.service';
import { UpdateFeatureControlDto } from './dto/feature-control.dto';
import { FeatureControlScope } from '../../entities/feature-control.entity';
import { Request } from 'express';

@ApiTags('Admin Feature Controls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/feature-controls')
export class AdminFeatureControlsController {
  private readonly logger = new Logger(AdminFeatureControlsController.name);

  constructor(private readonly capabilityService: CapabilityService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'List platform (or tenant) feature controls' })
  async list(
    @Query('category') category?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    // Non-super admins cannot inspect other tenants' overrides
    const data = await this.capabilityService.listFeatureControls({
      category,
      tenantId: tenantId || null,
    });
    return { success: true, data };
  }

  @Get('disabled')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'List currently disabled feature codes' })
  async listDisabled(@Query('tenantId') tenantId?: string) {
    const data = await this.capabilityService.getDisabledFeatures(tenantId || null);
    return { success: true, data };
  }

  @Get('audit')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Feature control audit history' })
  async audit(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const data = await this.capabilityService.getFeatureAuditLogs(
      Math.min(parseInt(limit || '50', 10) || 50, 200),
      parseInt(offset || '0', 10) || 0,
    );
    return { success: true, data };
  }

  @Patch()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Enable or disable a platform/tenant feature capability' })
  async update(@Body() dto: UpdateFeatureControlDto, @Req() req: Request) {
    const user = (req as any).user;
    const userId = user?.userId || user?.id;
    if (!userId) {
      throw new BadRequestException('Authenticated user required');
    }

    const scope = dto.scope || FeatureControlScope.PLATFORM;

    // Only SUPER_ADMIN reaches here via @Roles — still block TENANT scope misuse from non-owners later
    if (scope === FeatureControlScope.TENANT && !dto.tenantId) {
      throw new BadRequestException('tenantId is required when scope is TENANT');
    }

    this.logger.log(
      `Feature control update by ${userId}: ${dto.permissionCode} → ${dto.enabled ? 'ENABLED' : 'DISABLED'}`,
    );

    const data = await this.capabilityService.setFeatureControl({
      permissionCode: dto.permissionCode,
      enabled: dto.enabled,
      updatedBy: userId,
      reason: dto.reason,
      scope,
      tenantId: dto.tenantId,
    });

    return {
      success: true,
      message: `Feature ${dto.permissionCode} is now ${dto.enabled ? 'ENABLED' : 'DISABLED'}`,
      data,
    };
  }
}
