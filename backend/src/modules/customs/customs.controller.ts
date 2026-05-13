import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
} from '@nestjs/swagger';
import { CustomsService } from './customs.service';
import {
  CreateInspectionDto,
  UpdateInspectionStatusDto,
  SearchTruckDto,
  CreateCheckpointDto,
} from './dto/customs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';
import { CustomsInspectionStatus, CustomsRiskLevel } from '../../entities/customs-inspection.entity';

@ApiTags('Customs')
@ApiBearerAuth('JWT-auth')
@Controller('customs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.CUSTOMS_OFFICER,
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TENANT_ADMIN,
)
export class CustomsController {
  constructor(private readonly customsService: CustomsService) {}

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get customs dashboard statistics' })
  async getDashboardStats(@Request() req) {
    const data = await this.customsService.getDashboardStats(req.user.tenantId);
    return { success: true, data };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get customs analytics' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getAnalytics(@Request() req, @Query('days') days?: number) {
    const data = await this.customsService.getAnalytics(req.user.tenantId, days);
    return { success: true, data };
  }

  // ─── Truck Search ──────────────────────────────────────────────────────────

  @Get('search')
  @ApiOperation({ summary: 'Search trucks / shipments for inspection' })
  @ApiQuery({ name: 'plateNumber', required: false })
  @ApiQuery({ name: 'shipmentReference', required: false })
  @ApiQuery({ name: 'containerNumber', required: false })
  @ApiQuery({ name: 'driverId', required: false })
  @ApiQuery({ name: 'driverName', required: false })
  @ApiQuery({ name: 'tripId', required: false })
  async searchTruck(@Request() req, @Query() query: SearchTruckDto) {
    const data = await this.customsService.searchTruck(req.user.tenantId, query);
    return { success: true, data };
  }

  // ─── Inspections ───────────────────────────────────────────────────────────

  @Post('inspections')
  @ApiOperation({ summary: 'Create a new customs inspection' })
  async createInspection(@Request() req, @Body() dto: CreateInspectionDto) {
    const data = await this.customsService.createInspection(
      req.user.tenantId,
      req.user.userId,
      dto,
    );
    return { success: true, data };
  }

  @Get('inspections')
  @ApiOperation({ summary: 'Get all inspections with optional filters' })
  @ApiQuery({ name: 'status', required: false, enum: CustomsInspectionStatus })
  @ApiQuery({ name: 'riskLevel', required: false, enum: CustomsRiskLevel })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  async getInspections(
    @Request() req,
    @Query('status') status?: CustomsInspectionStatus,
    @Query('riskLevel') riskLevel?: CustomsRiskLevel,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('search') search?: string,
  ) {
    const result = await this.customsService.getInspections(req.user.tenantId, {
      status, riskLevel, limit, offset, search,
    });
    return { success: true, ...result };
  }

  @Get('inspections/:id')
  @ApiOperation({ summary: 'Get a single inspection by ID' })
  async getInspection(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    const data = await this.customsService.getInspectionById(req.user.tenantId, id);
    return { success: true, data };
  }

  @Patch('inspections/:id/status')
  @ApiOperation({ summary: 'Update inspection status (approve/reject/hold/flag)' })
  async updateStatus(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInspectionStatusDto,
  ) {
    const data = await this.customsService.updateInspectionStatus(req.user.tenantId, id, dto);
    return { success: true, data };
  }

  @Patch('inspections/:id/flag')
  @ApiOperation({ summary: 'Flag inspection as high risk' })
  async flagInspection(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { riskLevel: CustomsRiskLevel; notes?: string },
  ) {
    const data = await this.customsService.flagInspection(
      req.user.tenantId,
      id,
      body.riskLevel,
      body.notes,
    );
    return { success: true, data };
  }

  // ─── Checkpoints ──────────────────────────────────────────────────────────

  @Get('checkpoints')
  @ApiOperation({ summary: 'Get all checkpoints' })
  async getCheckpoints(@Request() req) {
    const data = await this.customsService.getCheckpoints(req.user.tenantId);
    return { success: true, data };
  }

  @Post('checkpoints')
  @ApiOperation({ summary: 'Create a customs checkpoint' })
  async createCheckpoint(@Request() req, @Body() dto: CreateCheckpointDto) {
    const data = await this.customsService.createCheckpoint(req.user.tenantId, dto);
    return { success: true, data };
  }
}
