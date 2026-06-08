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
  SubmitComplianceResponseDto,
  ReviewComplianceResponseDto,
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
  @ApiOperation({ summary: 'Get all inspections with optional filters. All officers see all inspections. Use ?officerId= to filter by a specific officer.' })
  @ApiQuery({ name: 'status', required: false, enum: CustomsInspectionStatus })
  @ApiQuery({ name: 'riskLevel', required: false, enum: CustomsRiskLevel })
  @ApiQuery({ name: 'officerId', required: false, description: 'Filter by the officer who created the inspection' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  async getInspections(
    @Request() req,
    @Query('status') status?: CustomsInspectionStatus,
    @Query('riskLevel') riskLevel?: CustomsRiskLevel,
    @Query('officerId') officerId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('search') search?: string,
  ) {
    const result = await this.customsService.getInspections(req.user.tenantId, {
      status, riskLevel, officerId, limit, offset, search,
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
    const data = await this.customsService.updateInspectionStatus(
      req.user.tenantId,
      id,
      dto,
      req.user.userId,
    );
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
      req.user.userId,
    );
    return { success: true, data };
  }

  // ─── Compliance Responses ─────────────────────────────────────────────────

  @Post('inspections/:id/compliance-response')
  @Roles(
    UserRole.CARGO_OWNER,
    UserRole.CUSTOMS_OFFICER,
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
  )
  @ApiOperation({
    summary: 'Submit a compliance response to an ON_HOLD inspection',
    description: 'Cargo owner provides notes and references uploaded document IDs to resolve missing document issues. Officer is notified automatically.',
  })
  async submitComplianceResponse(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitComplianceResponseDto,
  ) {
    const data = await this.customsService.submitComplianceResponse(id, req.user.userId, dto);
    return { success: true, data };
  }

  @Get('inspections/:id/compliance-responses')
  @Roles(
    UserRole.CARGO_OWNER,
    UserRole.CUSTOMS_OFFICER,
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
  )
  @ApiOperation({ summary: 'Get all compliance responses for an inspection' })
  async getComplianceResponses(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.customsService.getComplianceResponses(id);
    return { success: true, data };
  }

  @Patch('inspections/:id/compliance-response/:responseId/review')
  @ApiOperation({
    summary: 'Officer reviews a compliance response — accept or reject',
    description: 'ACCEPTED moves inspection to IN_PROGRESS. REJECTED puts it back ON_HOLD so cargo owner can resubmit. Cargo owner is notified.',
  })
  async reviewComplianceResponse(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('responseId', ParseUUIDPipe) responseId: string,
    @Body() dto: ReviewComplianceResponseDto,
  ) {
    const data = await this.customsService.reviewComplianceResponse(
      id,
      responseId,
      req.user.userId,
      dto,
    );
    return { success: true, data };
  }

  // ─── My Inspections (officer's own + cargo owner's) ──────────────────────

  @Get('my-inspections')
  @Roles(
    UserRole.CARGO_OWNER,
    UserRole.CUSTOMS_OFFICER,
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
  )
  @ApiOperation({ summary: 'For officers: inspections they created. For cargo owners: inspections on their cargo.' })
  async getMyInspections(@Request() req) {
    if (req.user.role === UserRole.CUSTOMS_OFFICER) {
      // Officer sees all inspections they personally created
      const result = await this.customsService.getInspections(req.user.tenantId, {
        officerId: req.user.userId,
        limit: 100,
      });
      return { success: true, data: result.data, total: result.total };
    }
    // Cargo owner sees inspections on their cargo
    const data = await this.customsService.getInspectionsByCargoOwner(req.user.userId);
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
