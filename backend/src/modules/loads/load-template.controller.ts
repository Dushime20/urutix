import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { LoadTemplateService } from './load-template.service';
import {
  CreateLoadTemplateDto,
  UpdateLoadTemplateDto,
  CreateLoadFromTemplateDto,
  ScheduleTemplateDto,
} from './dto/load-template.dto';

@ApiTags('Load Templates')
@Controller('loads/templates')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class LoadTemplateController {
  constructor(private readonly templateService: LoadTemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a load template' })
  create(@Body() dto: CreateLoadTemplateDto, @Req() req: any) {
    return this.templateService.create(dto, req.user.id, req.user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List all templates for current user' })
  findAll(@Req() req: any) {
    return this.templateService.findAll(req.user.tenantId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single template' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.templateService.findOne(id, req.user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a template' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoadTemplateDto,
    @Req() req: any,
  ) {
    return this.templateService.update(id, dto, req.user.tenantId, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (soft) a template' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.templateService.remove(id, req.user.tenantId, req.user.id);
  }

  @Post(':id/create-load')
  @ApiOperation({ summary: 'Instantiate a load from a template' })
  createLoad(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateLoadFromTemplateDto,
    @Req() req: any,
  ) {
    return this.templateService.createLoadFromTemplate(
      id,
      dto,
      req.user.id,
      req.user.tenantId,
    );
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Set recurring schedule for a template' })
  setSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleTemplateDto,
    @Req() req: any,
  ) {
    return this.templateService.setSchedule(
      id,
      dto,
      req.user.tenantId,
      req.user.id,
    );
  }

  @Get(':id/scheduled')
  @ApiOperation({ summary: 'Get upcoming scheduled load dates for a template' })
  getScheduled(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.templateService.getScheduledLoads(id, req.user.tenantId);
  }
}
