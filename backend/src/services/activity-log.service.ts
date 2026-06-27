import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { ActivityLog } from './../entities/activity-log.entity';
import { UserSession } from './../entities/user-session.entity';
import { EventsGateway } from './../modules/events/events.gateway';
import { SystemSettingsService } from './system-settings.service';

export interface LogActivityDto {
    userId?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
}

export interface ActivityLogFilter {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    isSuspicious?: boolean;
    page?: number;
    limit?: number;
}

@Injectable()
export class ActivityLogService {
    constructor(
        @InjectRepository(ActivityLog)
        private activityLogRepository: Repository<ActivityLog>,
        @InjectRepository(UserSession)
        private userSessionRepository: Repository<UserSession>,
        private eventsGateway: EventsGateway,
        private systemSettingsService: SystemSettingsService,
    ) { }

    /**
     * Log an activity
     */
    async logActivity(data: LogActivityDto): Promise<ActivityLog> {
        const activity = this.activityLogRepository.create({
            userId: data.userId,
            action: data.action,
            resource: data.resource,
            resourceId: data.resourceId,
            details: data.details,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            sessionId: data.sessionId,
            isSuspicious: await this.detectSuspiciousActivity(data),
        });

        const savedLog = await this.activityLogRepository.save(activity);

        // Broadcast real-time update
        this.eventsGateway.emitActivityLog(savedLog);

        // Handle suspicious activity
        if (savedLog.isSuspicious) {
            this.eventsGateway.emitSuspiciousActivity(savedLog);
            await this.handleSuspiciousAlert(savedLog);
        }

        return savedLog;
    }

    /**
     * Handle suspicious activity alerts
     */
    private async handleSuspiciousAlert(log: ActivityLog): Promise<void> {
        try {
            const settings = await this.systemSettingsService.getSettingsByCategory('notifications');

            // Send email alert if enabled
            if (settings['email_enabled'] === 'true' || settings['email_enabled'] === true) {
                const adminEmail = settings['admin_email'];
                if (!adminEmail) {
                    console.warn('[SecurityAlert] admin_email not configured in system settings — skipping email alert');
                    return;
                }
                await this.systemSettingsService.sendEmail(
                    adminEmail,
                    'Security Alert: Suspicious Activity Detected',
                    `Suspicious activity detected:\nUser: ${log.userId}\nAction: ${log.action}\nIP: ${log.ipAddress}\nDetails: ${JSON.stringify(log.details)}`
                );
            }

            // Send SMS alert if enabled & critical
            if (settings['sms_enabled'] === 'true' || settings['sms_enabled'] === true) {
                const adminPhone = settings['admin_phone'] || '+1234567890';
                await this.systemSettingsService.sendSms(
                    adminPhone,
                    `Security Alert: Suspicious activity ${log.action} by ${log.userId}`
                );
            }
        } catch (error) {
            console.error('Failed to send security alert:', error);
        }
    }

    /**
     * Get activity logs with filters
     */
    async getActivityLogs(filter: ActivityLogFilter) {
        const {
            userId,
            action,
            resource,
            startDate,
            endDate,
            isSuspicious,
            page = 1,
            limit = 50,
        } = filter;

        const query = this.activityLogRepository
            .createQueryBuilder('activity')
            .leftJoinAndSelect('activity.user', 'user')
            .orderBy('activity.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (userId) {
            query.andWhere('activity.userId = :userId', { userId });
        }

        if (action) {
            query.andWhere('activity.action = :action', { action });
        }

        if (resource) {
            query.andWhere('activity.resource = :resource', { resource });
        }

        if (startDate && endDate) {
            query.andWhere('activity.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }

        if (isSuspicious !== undefined) {
            query.andWhere('activity.isSuspicious = :isSuspicious', { isSuspicious });
        }

        const [activities, total] = await query.getManyAndCount();

        return {
            activities,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get activity log by ID
     */
    async getActivityLogById(id: string): Promise<ActivityLog> {
        return await this.activityLogRepository.findOne({
            where: { id },
            relations: ['user'],
        });
    }

    /**
     * Get suspicious activities
     */
    async getSuspiciousActivities(limit: number = 100) {
        return await this.activityLogRepository.find({
            where: { isSuspicious: true },
            relations: ['user'],
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    /**
     * Detect suspicious activity based on patterns
     */
    private async detectSuspiciousActivity(data: LogActivityDto): Promise<boolean> {
        // Check for rapid successive actions (potential bot)
        if (data.userId && data.sessionId) {
            const recentActivities = await this.activityLogRepository.count({
                where: {
                    userId: data.userId,
                    sessionId: data.sessionId,
                    createdAt: Between(
                        new Date(Date.now() - 60000), // Last minute
                        new Date(),
                    ),
                },
            });

            // More than 30 actions per minute is suspicious
            if (recentActivities > 30) {
                return true;
            }
        }

        // Check for sensitive actions
        const sensitiveActions = [
            'DELETE_USER',
            'UPDATE_PERMISSIONS',
            'CHANGE_ROLE',
            'DELETE_PAYMENT',
            'MODIFY_FINANCIAL_DATA',
        ];

        if (sensitiveActions.includes(data.action)) {
            // Log sensitive actions for review
            return false; // Not necessarily suspicious, but flagged for review
        }

        // Check for unusual IP patterns (multiple IPs for same user in short time)
        if (data.userId && data.ipAddress) {
            const recentIPs = await this.activityLogRepository
                .createQueryBuilder('activity')
                .select('DISTINCT activity.ipAddress')
                .where('activity.userId = :userId', { userId: data.userId })
                .andWhere('activity.createdAt > :since', {
                    since: new Date(Date.now() - 3600000), // Last hour
                })
                .getRawMany();

            // More than 3 different IPs in an hour is suspicious
            if (recentIPs.length > 3) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get active sessions
     */
    async getActiveSessions(userId?: string) {
        const query = this.userSessionRepository
            .createQueryBuilder('session')
            .leftJoinAndSelect('session.user', 'user')
            .where('session.expiresAt > :now', { now: new Date() })
            .orderBy('session.lastActivity', 'DESC');

        if (userId) {
            query.andWhere('session.userId = :userId', { userId });
        }

        return await query.getMany();
    }

    /**
     * Create or update session
     */
    async upsertSession(
        sessionId: string,
        userId: string,
        data: {
            ipAddress?: string;
            userAgent?: string;
            deviceInfo?: any;
            location?: any;
            expiresAt: Date;
        },
    ): Promise<UserSession> {
        let session = await this.userSessionRepository.findOne({
            where: { id: sessionId },
        });

        if (session) {
            // Update existing session
            session.lastActivity = new Date();
            session.expiresAt = data.expiresAt;
            if (data.ipAddress) session.ipAddress = data.ipAddress;
            if (data.userAgent) session.userAgent = data.userAgent;
            if (data.deviceInfo) session.deviceInfo = data.deviceInfo;
            if (data.location) session.location = data.location;
        } else {
            // Create new session
            session = this.userSessionRepository.create({
                id: sessionId,
                userId,
                ...data,
            });
        }

        return await this.userSessionRepository.save(session);
    }

    /**
     * Terminate session
     */
    async terminateSession(sessionId: string): Promise<void> {
        await this.userSessionRepository.delete({ id: sessionId });
    }

    /**
     * Terminate all sessions for a user
     */
    async terminateUserSessions(userId: string): Promise<void> {
        await this.userSessionRepository.delete({ userId });
    }

    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions(): Promise<void> {
        await this.userSessionRepository
            .createQueryBuilder()
            .delete()
            .where('expiresAt < :now', { now: new Date() })
            .execute();
    }

    /**
     * Get activity statistics
     */
    async getActivityStats(userId?: string, days: number = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const query = this.activityLogRepository
            .createQueryBuilder('activity')
            .select('DATE(activity.createdAt)', 'date')
            .addSelect('COUNT(*)', 'count')
            .addSelect('activity.action', 'action')
            .where('activity.createdAt >= :startDate', { startDate })
            .groupBy('DATE(activity.createdAt)')
            .addGroupBy('activity.action')
            .orderBy('date', 'DESC');

        if (userId) {
            query.andWhere('activity.userId = :userId', { userId });
        }

        return await query.getRawMany();
    }

    /**
     * Export activity logs
     */
    async exportActivityLogs(filter: ActivityLogFilter): Promise<ActivityLog[]> {
        const { activities } = await this.getActivityLogs({
            ...filter,
            limit: 10000, // Max export limit
        });

        return activities;
    }
}
