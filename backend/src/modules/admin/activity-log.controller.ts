import {
    Controller,
    Get,
    Delete,
    Query,
    Param,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ActivityLogService } from '../../services/activity-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('admin/activity-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN)
export class ActivityLogController {
    constructor(private readonly activityLogService: ActivityLogService) { }

    /**
     * Get activity logs with filters
     */
    @Get()
    async getActivityLogs(
        @Query('userId') userId?: string,
        @Query('action') action?: string,
        @Query('resource') resource?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('isSuspicious') isSuspicious?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return await this.activityLogService.getActivityLogs({
            userId,
            action,
            resource,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            isSuspicious: isSuspicious === 'true' ? true : isSuspicious === 'false' ? false : undefined,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
        });
    }

    /**
     * Get activity log by ID
     */
    @Get(':id')
    async getActivityLogById(@Param('id') id: string) {
        return await this.activityLogService.getActivityLogById(id);
    }

    /**
     * Get suspicious activities
     */
    @Get('suspicious/list')
    async getSuspiciousActivities(@Query('limit') limit?: string) {
        return await this.activityLogService.getSuspiciousActivities(
            limit ? parseInt(limit) : 100,
        );
    }

    /**
     * Get activity statistics
     */
    @Get('stats/summary')
    async getActivityStats(
        @Query('userId') userId?: string,
        @Query('days') days?: string,
    ) {
        return await this.activityLogService.getActivityStats(
            userId,
            days ? parseInt(days) : 7,
        );
    }

    /**
     * Export activity logs
     */
    @Get('export/data')
    async exportActivityLogs(
        @Query('userId') userId?: string,
        @Query('action') action?: string,
        @Query('resource') resource?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const activities = await this.activityLogService.exportActivityLogs({
            userId,
            action,
            resource,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });

        // Return data suitable for CSV/Excel export
        return activities.map(activity => ({
            id: activity.id,
            user: activity.user?.email || 'N/A',
            action: activity.action,
            resource: activity.resource,
            resourceId: activity.resourceId,
            ipAddress: activity.ipAddress,
            isSuspicious: activity.isSuspicious,
            createdAt: activity.createdAt,
            details: JSON.stringify(activity.details),
        }));
    }

    /**
     * Get active sessions
     */
    @Get('sessions/active')
    async getActiveSessions(@Query('userId') userId?: string) {
        return await this.activityLogService.getActiveSessions(userId);
    }

    /**
     * Terminate a session
     */
    @Delete('sessions/:sessionId')
    async terminateSession(@Param('sessionId') sessionId: string) {
        await this.activityLogService.terminateSession(sessionId);
        return { message: 'Session terminated successfully' };
    }

    /**
     * Terminate all sessions for a user
     */
    @Delete('sessions/user/:userId')
    async terminateUserSessions(@Param('userId') userId: string) {
        await this.activityLogService.terminateUserSessions(userId);
        return { message: 'All user sessions terminated successfully' };
    }
}
