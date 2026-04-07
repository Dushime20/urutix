import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivityLogsService } from './activity-logs.service';

@ApiTags('Activity Logs')
@ApiBearerAuth()
@Controller('activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get activity logs with filtering' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved successfully' })
  async getActivityLogs(
    @Request() req,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const tenantId = req.user.tenantId;
    return this.activityLogsService.getActivityLogs(tenantId, {
      category,
      status,
      search,
      limit: limit ? parseInt(limit.toString()) : 50,
      offset: offset ? parseInt(offset.toString()) : 0,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get activity logs statistics' })
  @ApiResponse({ status: 200, description: 'Activity logs stats retrieved successfully' })
  async getActivityStats(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.activityLogsService.getActivityStats(tenantId);
  }
}
