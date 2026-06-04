import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, Req,
  ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { GeofencingService, CreateGeofenceDto } from './geofencing.service';

@ApiTags('Geofencing')
@Controller('geofences')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class GeofencingController {
  constructor(private readonly service: GeofencingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a geofence zone' })
  create(@Body() dto: CreateGeofenceDto, @Req() req: any) {
    return this.service.create(dto, req.user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List all geofence zones for tenant' })
  findAll(@Req() req: any) {
    return this.service.findAll(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific geofence zone' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a geofence zone' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateGeofenceDto>,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a geofence zone' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.remove(id, req.user.tenantId);
  }
}
