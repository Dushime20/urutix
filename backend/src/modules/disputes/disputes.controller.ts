import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, Request, UseInterceptors, UploadedFile,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';
import { DisputesService } from './disputes.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import {
  CreateDisputeDto, UpdateDisputeDto, AddCommentDto, ResolveDisputeDto,
  ChangeStatusDto, DisputeFilterDto, AssignDisputeDto, EscalateDisputeDto,
} from './dto/dispute.dto';

const ALL_SUPPORT_ROLES = [
  UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN,
  UserRole.CARGO_OWNER, UserRole.TRUCK_OWNER, UserRole.BROKER,
  UserRole.LENDER, UserRole.DRIVER, UserRole.FLEET_MANAGER, UserRole.FLEET_DISPATCHER,
];

@ApiTags('Support Tickets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ALL_SUPPORT_ROLES)
@Controller('disputes')
export class DisputesController {
  constructor(
    private readonly disputesService: DisputesService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  // ── CRUD ───────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new support ticket' })
  async create(@Body() dto: CreateDisputeDto, @Request() req) {
    const dispute = await this.disputesService.create(dto, req.user);
    return { success: true, message: 'Support ticket created successfully', data: dispute };
  }

  @Get()
  @ApiOperation({ summary: 'Get all tickets (filtered by role/tenant)' })
  async findAll(@Query() filter: DisputeFilterDto, @Request() req) {
    const result = await this.disputesService.findAll(filter, req.user);
    return {
      success: true,
      data: result.disputes,
      pagination: { total: result.total, page: result.page, limit: result.limit },
    };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get support analytics — TENANT_ADMIN and SUPER_ADMIN only' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ADMIN)
  async getAnalytics(@Query('period') period: string, @Request() req) {
    const data = await this.disputesService.getAnalytics(req.user.tenantId, period);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    const dispute = await this.disputesService.findOne(id, req.user);
    return { success: true, data: dispute };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket details' })
  async update(@Param('id') id: string, @Body() dto: UpdateDisputeDto, @Request() req) {
    const dispute = await this.disputesService.update(id, dto, req.user);
    return { success: true, message: 'Ticket updated', data: dispute };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete ticket (admin only)' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.disputesService.remove(id, req.user);
    return { success: true, message: 'Ticket deleted' };
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  @Post(':id/comments')
  async addComment(@Param('id') id: string, @Body() dto: AddCommentDto, @Request() req) {
    const msg = await this.disputesService.addComment(id, dto, req.user);
    return { success: true, message: 'Comment added', data: msg };
  }

  @Get(':id/comments')
  async getComments(@Param('id') id: string, @Request() req) {
    const msgs = await this.disputesService.getComments(id, req.user);
    return { success: true, data: msgs };
  }

  // ── Attachments ────────────────────────────────────────────────────────────

  @Post(':id/attachments')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) throw new Error('No file uploaded.');
    const uploaded = await this.fileUploadService.uploadFile(file, 'disputes');
    const attachment = await this.disputesService.addAttachment(
      id,
      {
        fileName: uploaded.originalFileName,
        fileUrl: `/uploads/disputes/${uploaded.fileName}`,
        fileType: uploaded.mimeType,
        fileSize: uploaded.fileSize,
      },
      req.user,
    );
    return { success: true, message: 'Attachment uploaded', data: attachment };
  }

  @Get(':id/attachments')
  async getAttachments(@Param('id') id: string, @Request() req) {
    return { success: true, data: await this.disputesService.getAttachments(id, req.user) };
  }

  // ── Timeline ───────────────────────────────────────────────────────────────

  @Get(':id/timeline')
  async getTimeline(@Param('id') id: string, @Request() req) {
    return { success: true, data: await this.disputesService.getTimeline(id, req.user) };
  }

  // ── Resolutions ────────────────────────────────────────────────────────────

  @Get(':id/resolutions')
  async getResolutions(@Param('id') id: string, @Request() req) {
    return { success: true, data: await this.disputesService.getResolutions(id, req.user) };
  }

  // ── Assignment history ─────────────────────────────────────────────────────

  @Get(':id/assignments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ADMIN)
  async getAssignments(@Param('id') id: string, @Request() req) {
    return { success: true, data: await this.disputesService.getAssignments(id, req.user) };
  }

  // ── Escalation history ─────────────────────────────────────────────────────

  @Get(':id/escalations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.ADMIN)
  async getEscalations(@Param('id') id: string, @Request() req) {
    return { success: true, data: await this.disputesService.getEscalations(id, req.user) };
  }

  // ── Admin actions ──────────────────────────────────────────────────────────

  @Post(':id/assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  async assign(@Param('id') id: string, @Body() dto: AssignDisputeDto, @Request() req) {
    const d = await this.disputesService.assign(id, dto, req.user);
    return { success: true, message: 'Ticket assigned', data: d };
  }

  @Post(':id/escalate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  async escalate(@Param('id') id: string, @Body() dto: EscalateDisputeDto, @Request() req) {
    const d = await this.disputesService.escalate(id, dto, req.user);
    return { success: true, message: 'Ticket escalated', data: d };
  }

  @Post(':id/resolve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  async resolve(@Param('id') id: string, @Body() dto: ResolveDisputeDto, @Request() req) {
    const d = await this.disputesService.resolve(id, dto, req.user);
    return { success: true, message: 'Ticket resolved', data: d };
  }

  @Post(':id/close')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  async close(@Param('id') id: string, @Request() req) {
    const d = await this.disputesService.close(id, req.user);
    return { success: true, message: 'Ticket closed', data: d };
  }

  @Post(':id/reopen')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  async reopen(@Param('id') id: string, @Body() body: { reason?: string }, @Request() req) {
    const d = await this.disputesService.reopen(id, body.reason ?? '', req.user);
    return { success: true, message: 'Ticket reopened', data: d };
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  async changeStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto, @Request() req) {
    const d = await this.disputesService.changeStatus(id, dto, req.user);
    return { success: true, message: 'Status updated', data: d };
  }

  // ── SLA check (admin/cron trigger) ─────────────────────────────────────────

  @Post('admin/check-sla')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  async checkSla(@Request() req) {
    const count = await this.disputesService.checkSlaBreaches(req.user.tenantId);
    return { success: true, message: `${count} SLA breach(es) processed` };
  }
}
