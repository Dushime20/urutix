import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, In } from 'typeorm';
import { SecurityCenterService } from '../security-center.service';
import {
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
} from '../../entities/security-event.entity';
import { ActivityLog } from '../../entities/activity-log.entity';
import { UserSession } from '../../entities/user-session.entity';
import { ActivityLogService } from '../activity-log.service';

describe('SecurityCenterService', () => {
  let service: SecurityCenterService;
  let securityEventRepository: jest.Mocked<Repository<SecurityEvent>>;
  let activityLogRepository: jest.Mocked<Repository<ActivityLog>>;
  let userSessionRepository: jest.Mocked<Repository<UserSession>>;
  let activityLogService: jest.Mocked<ActivityLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityCenterService,
        {
          provide: getRepositoryToken(SecurityEvent),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserSession),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ActivityLogService,
          useValue: {
            getActiveSessions: jest.fn(),
            terminateSession: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SecurityCenterService>(SecurityCenterService);
    securityEventRepository = module.get(getRepositoryToken(SecurityEvent));
    activityLogRepository = module.get(getRepositoryToken(ActivityLog));
    userSessionRepository = module.get(getRepositoryToken(UserSession));
    activityLogService = module.get(ActivityLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFailedLogins', () => {
    it('should return recent failed login attempts', async () => {
      const mockEvents: Partial<SecurityEvent>[] = [
        {
          id: '1',
          eventType: SecurityEventType.FAILED_LOGIN,
          severity: SecuritySeverity.MEDIUM,
          userId: 'user-1',
          tenantId: 'tenant-1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          eventType: SecurityEventType.FAILED_LOGIN,
          severity: SecuritySeverity.MEDIUM,
          userId: 'user-1',
          tenantId: 'tenant-1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2024-01-01T10:05:00Z'),
        },
        {
          id: '3',
          eventType: SecurityEventType.FAILED_LOGIN,
          severity: SecuritySeverity.MEDIUM,
          userId: 'user-2',
          tenantId: 'tenant-1',
          ipAddress: '192.168.1.2',
          userAgent: 'Chrome/90.0',
          createdAt: new Date('2024-01-01T10:10:00Z'),
        },
      ];

      securityEventRepository.find.mockResolvedValue(
        mockEvents as SecurityEvent[],
      );

      const result = await service.getFailedLogins(50);

      expect(securityEventRepository.find).toHaveBeenCalledWith({
        where: {
          eventType: SecurityEventType.FAILED_LOGIN,
        },
        order: {
          createdAt: 'DESC',
        },
        take: 50,
      });

      expect(result).toHaveLength(2); // Two unique users
      expect(result[0].userId).toBe('user-2');
      expect(result[0].attemptCount).toBe(1);
      expect(result[1].userId).toBe('user-1');
      expect(result[1].attemptCount).toBe(2);
    });

    it('should handle empty results', async () => {
      securityEventRepository.find.mockResolvedValue([]);

      const result = await service.getFailedLogins();

      expect(result).toEqual([]);
    });

    it('should group attempts by user and tenant', async () => {
      const mockEvents: Partial<SecurityEvent>[] = [
        {
          id: '1',
          eventType: SecurityEventType.FAILED_LOGIN,
          userId: 'user-1',
          tenantId: 'tenant-1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          eventType: SecurityEventType.FAILED_LOGIN,
          userId: 'user-1',
          tenantId: 'tenant-2',
          createdAt: new Date('2024-01-01T10:05:00Z'),
        },
      ];

      securityEventRepository.find.mockResolvedValue(
        mockEvents as SecurityEvent[],
      );

      const result = await service.getFailedLogins();

      expect(result).toHaveLength(2); // Same user, different tenants
    });
  });

  describe('getSecurityEvents', () => {
    it('should return all security events when no severity specified', async () => {
      const mockEvents: Partial<SecurityEvent>[] = [
        {
          id: '1',
          eventType: SecurityEventType.FAILED_LOGIN,
          severity: SecuritySeverity.MEDIUM,
          createdAt: new Date(),
        },
        {
          id: '2',
          eventType: SecurityEventType.PERMISSION_ESCALATION,
          severity: SecuritySeverity.HIGH,
          createdAt: new Date(),
        },
      ];

      securityEventRepository.find.mockResolvedValue(
        mockEvents as SecurityEvent[],
      );

      const result = await service.getSecurityEvents();

      expect(securityEventRepository.find).toHaveBeenCalledWith({
        where: {},
        order: {
          createdAt: 'DESC',
        },
        take: 100,
        relations: ['user', 'tenant'],
      });

      expect(result).toHaveLength(2);
    });

    it('should filter by severity when specified', async () => {
      const mockEvents: Partial<SecurityEvent>[] = [
        {
          id: '1',
          eventType: SecurityEventType.PERMISSION_ESCALATION,
          severity: SecuritySeverity.HIGH,
          createdAt: new Date(),
        },
      ];

      securityEventRepository.find.mockResolvedValue(
        mockEvents as SecurityEvent[],
      );

      const result = await service.getSecurityEvents(SecuritySeverity.HIGH);

      expect(securityEventRepository.find).toHaveBeenCalledWith({
        where: {
          severity: SecuritySeverity.HIGH,
        },
        order: {
          createdAt: 'DESC',
        },
        take: 100,
        relations: ['user', 'tenant'],
      });

      expect(result).toHaveLength(1);
      expect(result[0].severity).toBe(SecuritySeverity.HIGH);
    });

    it('should respect custom limit', async () => {
      securityEventRepository.find.mockResolvedValue([]);

      await service.getSecurityEvents(undefined, 50);

      expect(securityEventRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });
  });

  describe('getFlaggedAccounts', () => {
    it('should identify accounts with more than 5 failed logins in 15 minutes', async () => {
      const now = new Date();
      const mockEvents: Partial<SecurityEvent>[] = [];

      // Create 6 failed login attempts for user-1
      for (let i = 0; i < 6; i++) {
        mockEvents.push({
          id: `event-${i}`,
          eventType: SecurityEventType.FAILED_LOGIN,
          userId: 'user-1',
          tenantId: 'tenant-1',
          ipAddress: '192.168.1.1',
          createdAt: new Date(now.getTime() - i * 60 * 1000), // 1 minute apart
        });
      }

      // Create 3 failed login attempts for user-2 (should not be flagged)
      for (let i = 0; i < 3; i++) {
        mockEvents.push({
          id: `event-user2-${i}`,
          eventType: SecurityEventType.FAILED_LOGIN,
          userId: 'user-2',
          tenantId: 'tenant-1',
          ipAddress: '192.168.1.2',
          createdAt: new Date(now.getTime() - i * 60 * 1000),
        });
      }

      securityEventRepository.find.mockResolvedValue(
        mockEvents as SecurityEvent[],
      );

      const result = await service.getFlaggedAccounts();

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
      expect(result[0].failedAttempts).toBe(6);
      expect(result[0].ipAddresses).toContain('192.168.1.1');
    });

    it('should handle multiple IP addresses for same user', async () => {
      const now = new Date();
      const mockEvents: Partial<SecurityEvent>[] = [];

      // Create 6 failed login attempts from different IPs
      for (let i = 0; i < 6; i++) {
        mockEvents.push({
          id: `event-${i}`,
          eventType: SecurityEventType.FAILED_LOGIN,
          userId: 'user-1',
          tenantId: 'tenant-1',
          ipAddress: `192.168.1.${i}`,
          createdAt: new Date(now.getTime() - i * 60 * 1000),
        });
      }

      securityEventRepository.find.mockResolvedValue(
        mockEvents as SecurityEvent[],
      );

      const result = await service.getFlaggedAccounts();

      expect(result).toHaveLength(1);
      expect(result[0].ipAddresses).toHaveLength(6);
    });

    it('should return empty array when no accounts are flagged', async () => {
      securityEventRepository.find.mockResolvedValue([]);

      const result = await service.getFlaggedAccounts();

      expect(result).toEqual([]);
    });

    it('should ignore events without userId', async () => {
      const now = new Date();
      const mockEvents: Partial<SecurityEvent>[] = [];

      // Create 10 failed login attempts without userId
      for (let i = 0; i < 10; i++) {
        mockEvents.push({
          id: `event-${i}`,
          eventType: SecurityEventType.FAILED_LOGIN,
          userId: null,
          tenantId: 'tenant-1',
          ipAddress: '192.168.1.1',
          createdAt: new Date(now.getTime() - i * 60 * 1000),
        });
      }

      securityEventRepository.find.mockResolvedValue(
        mockEvents as SecurityEvent[],
      );

      const result = await service.getFlaggedAccounts();

      expect(result).toEqual([]);
    });
  });

  describe('getActiveSessions', () => {
    it('should return active sessions from ActivityLogService', async () => {
      const mockSessions: Partial<UserSession>[] = [
        {
          id: 'session-1',
          userId: 'user-1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          lastActivity: new Date('2024-01-01T10:30:00Z'),
          expiresAt: new Date('2024-01-01T18:00:00Z'),
          user: { tenantId: 'tenant-1' } as any,
        },
        {
          id: 'session-2',
          userId: 'user-2',
          ipAddress: '192.168.1.2',
          userAgent: 'Chrome/90.0',
          createdAt: new Date('2024-01-01T11:00:00Z'),
          lastActivity: new Date('2024-01-01T11:15:00Z'),
          expiresAt: new Date('2024-01-01T19:00:00Z'),
          user: { tenantId: 'tenant-2' } as any,
        },
      ];

      activityLogService.getActiveSessions.mockResolvedValue(
        mockSessions as UserSession[],
      );

      const result = await service.getActiveSessions();

      expect(activityLogService.getActiveSessions).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].sessionId).toBe('session-1');
      expect(result[0].userId).toBe('user-1');
      expect(result[0].tenantId).toBe('tenant-1');
      expect(result[1].sessionId).toBe('session-2');
      expect(result[1].userId).toBe('user-2');
    });

    it('should handle empty session list', async () => {
      activityLogService.getActiveSessions.mockResolvedValue([]);

      const result = await service.getActiveSessions();

      expect(result).toEqual([]);
    });
  });

  describe('terminateSession', () => {
    it('should terminate session and log the action', async () => {
      const sessionId = 'session-123';
      const actorId = 'admin-1';

      const mockSession: Partial<UserSession> = {
        id: sessionId,
        userId: 'user-1',
        user: { tenantId: 'tenant-1' } as any,
      };

      const mockActivityLog = { id: 'log-1' } as ActivityLog;
      const mockSecurityEvent = { id: 'event-1' } as SecurityEvent;

      userSessionRepository.findOne.mockResolvedValue(mockSession as UserSession);
      activityLogService.terminateSession.mockResolvedValue(undefined);
      activityLogRepository.create.mockReturnValue(mockActivityLog);
      activityLogRepository.save.mockResolvedValue(mockActivityLog);
      securityEventRepository.create.mockReturnValue(mockSecurityEvent);
      securityEventRepository.save.mockResolvedValue(mockSecurityEvent);

      await service.terminateSession(sessionId, actorId);

      expect(userSessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: sessionId },
        relations: ['user'],
      });

      expect(activityLogService.terminateSession).toHaveBeenCalledWith(sessionId);

      expect(activityLogRepository.create).toHaveBeenCalledWith({
        userId: actorId,
        action: 'terminate_session',
        resource: 'user_session',
        resourceId: sessionId,
        details: {
          sessionId,
          terminatedBy: actorId,
          targetUserId: 'user-1',
          reason: 'Manual termination by Super Admin',
        },
        isSuspicious: false,
      });

      expect(activityLogRepository.save).toHaveBeenCalledWith(mockActivityLog);

      expect(securityEventRepository.create).toHaveBeenCalledWith({
        eventType: SecurityEventType.UNUSUAL_ACCESS,
        severity: SecuritySeverity.MEDIUM,
        userId: actorId,
        tenantId: 'tenant-1',
        details: {
          action: 'session_terminated',
          sessionId,
          terminatedBy: actorId,
          targetUserId: 'user-1',
        },
      });

      expect(securityEventRepository.save).toHaveBeenCalledWith(
        mockSecurityEvent,
      );
    });

    it('should throw NotFoundException if session does not exist', async () => {
      const sessionId = 'non-existent-session';
      const actorId = 'admin-1';

      userSessionRepository.findOne.mockResolvedValue(null);

      await expect(service.terminateSession(sessionId, actorId)).rejects.toThrow(
        `Session ${sessionId} not found`,
      );

      expect(activityLogService.terminateSession).not.toHaveBeenCalled();
    });
  });

  describe('exportSecurityLogs', () => {
    it('should generate CSV with all security events in date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockEvents: Partial<SecurityEvent>[] = [
        {
          id: '1',
          eventType: SecurityEventType.FAILED_LOGIN,
          severity: SecuritySeverity.MEDIUM,
          userId: 'user-1',
          tenantId: 'tenant-1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2024-01-15T10:00:00Z'),
          details: { reason: 'Invalid password' },
        },
      ];

      securityEventRepository.find.mockResolvedValue(
        mockEvents as SecurityEvent[],
      );

      const result = await service.exportSecurityLogs(startDate, endDate);

      expect(securityEventRepository.find).toHaveBeenCalledWith({
        where: {
          createdAt: Between(startDate, endDate),
        },
        order: {
          createdAt: 'DESC',
        },
        relations: ['user', 'tenant'],
      });

      expect(result).toContain('ID,Event Type,Severity');
      expect(result).toContain('failed_login');
      expect(result).toContain('user-1');
      expect(result).toContain('192.168.1.1');
    });

    it('should handle empty results', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      securityEventRepository.find.mockResolvedValue([]);

      const result = await service.exportSecurityLogs(startDate, endDate);

      expect(result).toContain('ID,Event Type,Severity');
      const lines = result.split('\n');
      expect(lines).toHaveLength(1); // Only header
    });

    it('should escape CSV special characters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockEvents: Partial<SecurityEvent>[] = [
        {
          id: '1',
          eventType: SecurityEventType.FAILED_LOGIN,
          severity: SecuritySeverity.MEDIUM,
          userId: 'user-1',
          tenantId: 'tenant-1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 "Special"',
          createdAt: new Date('2024-01-15T10:00:00Z'),
          details: { reason: 'Test, with comma' },
        },
      ];

      securityEventRepository.find.mockResolvedValue(
        mockEvents as SecurityEvent[],
      );

      const result = await service.exportSecurityLogs(startDate, endDate);

      expect(result).toContain('""Special""'); // Escaped quotes
      expect(result).toContain('"Test, with comma"'); // Quoted comma
    });
  });

  describe('getPermissionHistory', () => {
    it('should return permission-related activity logs', async () => {
      const mockLogs: Partial<ActivityLog>[] = [
        {
          id: 'log-1',
          userId: 'admin-1',
          action: 'assign_permission',
          resource: 'role',
          details: { permission: 'manage_users', role: 'admin' },
          createdAt: new Date('2024-01-15T10:00:00Z'),
          ipAddress: '192.168.1.1',
          isSuspicious: false,
        },
        {
          id: 'log-2',
          userId: 'admin-1',
          action: 'update_user_role',
          resource: 'user',
          details: { userId: 'user-1', newRole: 'manager' },
          createdAt: new Date('2024-01-15T11:00:00Z'),
          ipAddress: '192.168.1.1',
          isSuspicious: false,
        },
      ];

      activityLogRepository.find.mockResolvedValue(mockLogs as ActivityLog[]);

      const result = await service.getPermissionHistory();

      expect(activityLogRepository.find).toHaveBeenCalledWith({
        where: {
          isSuspicious: false,
          action: In([
            'create_role',
            'update_role',
            'delete_role',
            'assign_permission',
            'revoke_permission',
            'update_user_role',
            'grant_role',
            'revoke_role',
          ]),
        },
        order: {
          createdAt: 'DESC',
        },
        take: 500,
      });

      expect(result).toHaveLength(2);
      expect(result[0].action).toBe('assign_permission');
      expect(result[1].action).toBe('update_user_role');
    });

    it('should filter by userId when specified', async () => {
      activityLogRepository.find.mockResolvedValue([]);

      await service.getPermissionHistory({ userId: 'admin-1' });

      expect(activityLogRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'admin-1',
          }),
        }),
      );
    });

    it('should filter by date range when specified', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      activityLogRepository.find.mockResolvedValue([]);

      await service.getPermissionHistory({ startDate, endDate });

      expect(activityLogRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: Between(startDate, endDate),
          }),
        }),
      );
    });

    it('should filter by action when specified', async () => {
      activityLogRepository.find.mockResolvedValue([]);

      await service.getPermissionHistory({ action: 'assign_permission' });

      expect(activityLogRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'assign_permission',
          }),
        }),
      );
    });

    it('should handle empty results', async () => {
      activityLogRepository.find.mockResolvedValue([]);

      const result = await service.getPermissionHistory();

      expect(result).toEqual([]);
    });
  });
});
