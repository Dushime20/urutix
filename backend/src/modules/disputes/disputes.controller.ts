import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';
import { DisputesService } from './disputes.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import {
  CreateDisputeDto,
  UpdateDisputeDto,
  AddCommentDto,
  ResolveDisputeDto,
  ChangeStatusDto,
  DisputeFilterDto,
} from './dto/dispute.dto';

@ApiTags('Disputes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TENANT_ADMIN,
  UserRole.CARGO_OWNER,
  UserRole.TRUCK_OWNER,
  UserRole.BROKER,
  UserRole.LENDER,
  UserRole.DRIVER,
  UserRole.FLEET_MANAGER,
  UserRole.FLEET_DISPATCHER,
)
@Controller('disputes')
export class DisputesController {
  constructor(
    private readonly disputesService: DisputesService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  // ─── Disputes CRUD ────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new dispute' })
  async create(@Body() dto: CreateDisputeDto, @Request() req) {
    const dispute = await this.disputesService.create(dto, req.user);
    return { success: true, message: 'Dispute created successfully', data: dispute };
  }

  @Get()
  @ApiOperation({ summary: 'Get all disputes (filtered by role/tenant)' })
  async findAll(@Query() filter: DisputeFilterDto, @Request() req) {
    const result = await this.disputesService.findAll(filter, req.user);
    return {
      success: true,
      message: 'Disputes retrieved',
      data: result.disputes,
      pagination: { total: result.total, page: result.page, limit: result.limit },
    };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get dispute analytics — TENANT_ADMIN and SUPER_ADMIN only' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  async getAnalytics(@Query('period') period: string, @Request() req) {
    const data = await this.disputesService.getAnalytics(req.user.tenantId, period);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    const dispute = await this.disputesService.findOne(id, req.user);
    return { success: true, data: dispute };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update dispute details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDisputeDto,
    @Request() req,
  ) {
    const dispute = await this.disputesService.update(id, dto, req.user);
    return { success: true, message: 'Dispute updated', data: dispute };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete dispute (admin only)' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.disputesService.remove(id, req.user);
    return { success: true, message: 'Dispute deleted' };
  }

  // ─── Comments ────────────────────────────────────────────────────────────────

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a dispute' })
  async addComment(
    @Param('id') id: string,
    @Body() dto: AddCommentDto,
    @Request() req,
  ) {
    const message = await this.disputesService.addComment(id, dto, req.user);
    return { success: true, message: 'Comment added', data: message };
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get all comments for a dispute' })
  async getComments(@Param('id') id: string, @Request() req) {
    const messages = await this.disputesService.getComments(id, req.user);
    return { success: true, data: messages };
  }

  // ─── Attachments ─────────────────────────────────────────────────────────────

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Upload an attachment to a dispute' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
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
        fileUrl: uploaded.fileUrl,
        fileType: uploaded.mimeType,
        fileSize: uploaded.fileSize,
      },
      req.user,
    );
    return { success: true, message: 'Attachment uploaded', data: attachment };
  }

  @Get(':id/attachments')
  @ApiOperation({ summary: 'Get all attachments for a dispute' })
  async getAttachments(@Param('id') id: string, @Request() req) {
    const attachments = await this.disputesService.getAttachments(id, req.user);
    return { success: true, data: attachments };
  }

  // ─── Timeline ────────────────────────────────────────────────────────────────

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get full timeline for a dispute' })
  async getTimeline(@Param('id') id: string, @Request() req) {
    const timeline = await this.disputesService.getTimeline(id, req.user);
    return { success: true, data: timeline };
  }

  // ─── Resolutions ─────────────────────────────────────────────────────────────

  @Get(':id/resolutions')
  @ApiOperation({ summary: 'Get resolution history for a dispute' })
  async getResolutions(@Param('id') id: string, @Request() req) {
    const resolutions = await this.disputesService.getResolutions(id, req.user);
    return { success: true, data: resolutions };
  }

  // ─── Admin Actions ────────────────────────────────────────────────────────────

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute — TENANT_ADMIN and SUPER_ADMIN only' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  async resolve(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
    @Request() req,
  ) {
    const dispute = await this.disputesService.resolve(id, dto, req.user);
    return { success: true, message: 'Dispute resolved', data: dispute };
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close a dispute — TENANT_ADMIN and SUPER_ADMIN only' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  async close(@Param('id') id: string, @Request() req) {
    const dispute = await this.disputesService.close(id, req.user);
    return { success: true, message: 'Dispute closed', data: dispute };
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen a closed/resolved dispute — TENANT_ADMIN and SUPER_ADMIN only' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  async reopen(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req,
  ) {
    const dispute = await this.disputesService.reopen(id, body.reason ?? '', req.user);
    return { success: true, message: 'Dispute reopened', data: dispute };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change dispute status — TENANT_ADMIN and SUPER_ADMIN only' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @Request() req,
  ) {
    const dispute = await this.disputesService.changeStatus(id, dto, req.user);
    return { success: true, message: 'Status updated', data: dispute };
  }
}
