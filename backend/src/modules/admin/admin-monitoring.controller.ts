import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../types/permission.types';
import { MonitoringService } from '../../services/monitoringService';

@ApiTags('Admin Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/monitoring')
export class AdminMonitoringController {
    private readonly logger = new Logger(AdminMonitoringController.name);

    constructor(private readonly monitoringService: MonitoringService) { }

    @Get('health')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get system health status' })
    @ApiOkResponse({ description: 'System health metrics' })
    async getSystemHealth() {
        return this.monitoringService.getSystemHealth();
    }

    @Get('metrics')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get performance metrics' })
    @ApiOkResponse({ description: 'Performance statistics' })
    async getPerformanceMetrics() {
        return this.monitoringService.getPerformanceMetrics();
    }

    @Get('audit-logs')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get audit logs with filtering' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'userId', required: false, type: String })
    @ApiQuery({ name: 'action', required: false, type: String })
    @ApiQuery({ name: 'resource', required: false, type: String })
    @ApiQuery({ name: 'startDate', required: false, type: String })
    @ApiQuery({ name: 'endDate', required: false, type: String })
    async getAuditLogs(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('userId') userId?: string,
        @Query('action') action?: string,
        @Query('resource') resource?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.monitoringService.getAuditLogs({
            page: page || 1,
            limit: limit || 50,
            userId,
            action,
            resource,
            startDate,
            endDate
        });
    }

    @Get('user-activity')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get user activity statistics' })
    @ApiOkResponse({ description: 'User activity metrics' })
    async getUserActivity() {
        return this.monitoringService.getUserActivityMetrics();
    }

    @Get('database-stats')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get database statistics' })
    @ApiOkResponse({ description: 'Database performance and size metrics' })
    async getDatabaseStats() {
        return this.monitoringService.getDatabaseStats();
    }
}
