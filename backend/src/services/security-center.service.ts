import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between, In } from 'typeorm';
import {
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
} from './../entities/security-event.entity';
import { ActivityLog } from './../entities/activity-log.entity';
import { UserSession } from './../entities/user-session.entity';
import { ActivityLogService } from './activity-log.service';

// Interfaces for service methods
export interface FailedLoginAttempt {
  id: string;
  userId: string | null;
  tenantId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
  attemptCount: number;
}

export interface UserSessionInfo {
  sessionId: string;
  userId: string;
  tenantId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  startedAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
    isMobile?: boolean;
  };
  location?: {
    country?: string;
    city?: string;
  };
}

export interface FlaggedAccount {
  userId: string;
  tenantId: string | null;
  failedAttempts: number;
  lastAttempt: Date;
  ipAddresses: string[];
}

export interface PermissionChange {
  id: string;
  actor: string;
  action: string;
  resource: string;
  changes: Record<string, any>;
  timestamp: Date;
  ipAddress: string | null;
}

export interface PermissionHistoryFilters {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  action?: string;
}

@Injectable()
export class SecurityCenterService {
  constructor(
    @InjectRepository(SecurityEvent)
    private readonly securityEventRepository: Repository<SecurityEvent>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  /**
   * Get recent failed login attempts
   * Requirement 3.1: Display recent failed login attempts across all tenants
   */
  async getFailedLogins(limit: number = 50): Promise<FailedLoginAttempt[]> {
    const events = await this.securityEventRepository.find({
      where: {
        eventType: SecurityEventType.FAILED_LOGIN,
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });

    // Group by user and count attempts
    const attemptMap = new Map<string, FailedLoginAttempt>();

    for (const event of events) {
      const key = `${event.userId || 'unknown'}_${event.tenantId || 'unknown'}`;

      if (attemptMap.has(key)) {
        const existing = attemptMap.get(key)!;
        existing.attemptCount++;
        if (event.createdAt > existing.timestamp) {
          existing.timestamp = event.createdAt;
        }
      } else {
        attemptMap.set(key, {
          id: event.id,
          userId: event.userId,
          tenantId: event.tenantId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          timestamp: event.createdAt,
          attemptCount: 1,
        });
      }
    }

    return Array.from(attemptMap.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  /**
   * Get security events by severity
   * Requirement 3.2: Show suspicious activities with categorization
   */
  async getSecurityEvents(
    severity?: SecuritySeverity,
    limit: number = 100,
  ): Promise<SecurityEvent[]> {
    const where: any = {};

    if (severity) {
      where.severity = severity;
    }

    return this.securityEventRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
      take: limit,
      relations: ['user', 'tenant'],
    });
  }

  /**
   * Get flagged accounts with excessive failed login attempts
   * Requirement 3.6: Automatically flag accounts with >5 failed logins in 15 minutes
   */
  async getFlaggedAccounts(): Promise<FlaggedAccount[]> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const recentFailedLogins = await this.securityEventRepository.find({
      where: {
        eventType: SecurityEventType.FAILED_LOGIN,
        createdAt: MoreThan(fifteenMinutesAgo),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    // Group by userId and count attempts
    const accountMap = new Map<string, FlaggedAccount>();

    for (const event of recentFailedLogins) {
      if (!event.userId) continue;

      const key = event.userId;

      if (accountMap.has(key)) {
        const existing = accountMap.get(key)!;
        existing.failedAttempts++;
        if (event.createdAt > existing.lastAttempt) {
          existing.lastAttempt = event.createdAt;
        }
        if (event.ipAddress && !existing.ipAddresses.includes(event.ipAddress)) {
          existing.ipAddresses.push(event.ipAddress);
        }
      } else {
        accountMap.set(key, {
          userId: event.userId,
          tenantId: event.tenantId,
          failedAttempts: 1,
          lastAttempt: event.createdAt,
          ipAddresses: event.ipAddress ? [event.ipAddress] : [],
        });
      }
    }

    // Filter accounts with more than 5 failed attempts
    return Array.from(accountMap.values())
      .filter((account) => account.failedAttempts > 5)
      .sort((a, b) => b.failedAttempts - a.failedAttempts);
  }

  /**
   * Get active user sessions
   * Requirement 3.4: Display active sessions with user details
   */
  async getActiveSessions(): Promise<UserSessionInfo[]> {
    const sessions = await this.activityLogService.getActiveSessions();

    return sessions.map((session) => ({
      sessionId: session.id,
      userId: session.userId,
      tenantId: session.user?.tenantId || null,
      ipAddress: session.ipAddress || null,
      userAgent: session.userAgent || null,
      startedAt: session.startedAt,
      lastActivity: session.lastActivity,
      expiresAt: session.expiresAt,
      deviceInfo: session.deviceInfo,
      location: session.location,
    }));
  }

  /**
   * Terminate a user session
   * Requirement 3.5: Immediately invalidate session and log the action
   */
  async terminateSession(sessionId: string, actorId: string): Promise<void> {
    // Verify session exists before terminating
    const session = await this.userSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Terminate the session using ActivityLogService
    await this.activityLogService.terminateSession(sessionId);

    // Create activity log for session termination
    const activityLog = this.activityLogRepository.create({
      userId: actorId,
      action: 'terminate_session',
      resource: 'user_session',
      resourceId: sessionId,
      details: {
        sessionId,
        terminatedBy: actorId,
        targetUserId: session.userId,
        reason: 'Manual termination by Super Admin',
      },
      isSuspicious: false,
    });

    await this.activityLogRepository.save(activityLog);

    // Create security event
    const securityEvent = this.securityEventRepository.create({
      eventType: SecurityEventType.UNUSUAL_ACCESS,
      severity: SecuritySeverity.MEDIUM,
      userId: actorId,
      tenantId: session.user?.tenantId || null,
      details: {
        action: 'session_terminated',
        sessionId,
        terminatedBy: actorId,
        targetUserId: session.userId,
      },
    });

    await this.securityEventRepository.save(securityEvent);
  }

  /**
   * Export security logs as CSV
   * Requirement 3.7: Generate report containing all security events for time range
   */
  async exportSecurityLogs(startDate: Date, endDate: Date): Promise<string> {
    const events = await this.securityEventRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      order: {
        createdAt: 'DESC',
      },
      relations: ['user', 'tenant'],
    });

    // Generate CSV
    const headers = [
      'ID',
      'Event Type',
      'Severity',
      'User ID',
      'Tenant ID',
      'IP Address',
      'User Agent',
      'Timestamp',
      'Details',
    ];

    const rows = events.map((event) => [
      event.id,
      event.eventType,
      event.severity,
      event.userId || '',
      event.tenantId || '',
      event.ipAddress || '',
      event.userAgent || '',
      event.createdAt.toISOString(),
      JSON.stringify(event.details || {}),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    return csvContent;
  }

  /**
   * Get permission change history
   * Requirement 3.8: Display history of all RBAC modifications
   */
  async getPermissionHistory(
    filters?: PermissionHistoryFilters,
  ): Promise<PermissionChange[]> {
    const where: any = {
      isSuspicious: false,
    };

    // Build where clause based on filters
    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    } else if (filters?.startDate) {
      where.createdAt = MoreThan(filters.startDate);
    }

    // Query activity logs for permission-related actions
    const permissionActions = [
      'create_role',
      'update_role',
      'delete_role',
      'assign_permission',
      'revoke_permission',
      'update_user_role',
      'grant_role',
      'revoke_role',
    ];

    // If action filter is specified, use it; otherwise use all permission actions
    if (filters?.action) {
      where.action = filters.action;
    } else {
      where.action = In(permissionActions);
    }

    const logs = await this.activityLogRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
      take: 500,
    });

    return logs.map((log) => ({
      id: log.id,
      actor: log.userId,
      action: log.action,
      resource: log.resource || 'permission',
      changes: log.details || {},
      timestamp: log.createdAt,
      ipAddress: log.ipAddress || null,
    }));
  }
}
