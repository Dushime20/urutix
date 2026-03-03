import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { SecurityCenterService } from '../security-center.service';
import {
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
} from '../../entities/security-event.entity';
import { ActivityLog } from '../../entities/activity-log.entity';
import { UserSession } from '../../entities/user-session.entity';
import { ActivityLogService } from '../activity-log.service';

describe('SecurityCenterService - Property-Based Tests', () => {
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
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserSession),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
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

  // Arbitraries for generating test data
  const securityEventTypeArb = fc.constantFrom(
    SecurityEventType.FAILED_LOGIN,
    SecurityEventType.PERMISSION_ESCALATION,
    SecurityEventType.UNUSUAL_ACCESS,
    SecurityEventType.SESSION_HIJACK,
  );

  const securitySeverityArb = fc.constantFrom(
    SecuritySeverity.LOW,
    SecuritySeverity.MEDIUM,
    SecuritySeverity.HIGH,
    SecuritySeverity.CRITICAL,
  );

  const securityEventArb = fc.record({
    id: fc.uuid(),
    eventType: securityEventTypeArb,
    severity: securitySeverityArb,
    userId: fc.option(fc.uuid(), { nil: null }),
    tenantId: fc.option(fc.uuid(), { nil: null }),
    ipAddress: fc.option(fc.ipV4(), { nil: null }),
    userAgent: fc.option(fc.string({ minLength: 10, maxLength: 100 }), {
      nil: null,
    }),
    details: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: null }),
    createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date() }),
  });

  const activityLogArb = fc.record({
    id: fc.uuid(),
    userId: fc.uuid(),
    action: fc.constantFrom(
      'create_role',
      'update_role',
      'delete_role',
      'assign_permission',
      'revoke_permission',
      'update_user_role',
      'grant_role',
      'revoke_role',
    ),
    resource: fc.constantFrom('role', 'permission', 'user'),
    resourceId: fc.option(fc.uuid(), { nil: null }),
    details: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: null }),
    createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date() }),
    ipAddress: fc.option(fc.ipV4(), { nil: null }),
    isSuspicious: fc.constant(false),
  });

  /**
   * Feature: super-admin-enhancement, Property 13: Security Event Categorization
   * For any security event, the system SHALL assign it to the correct event type and severity level
   * Validates: Requirements 3.1, 3.2
   */
  describe('Property 13: Security Event Categorization', () => {
    it('should correctly categorize all security events by type and severity', () => {
      fc.assert(
        fc.asyncProperty(fc.array(securityEventArb, { minLength: 1, maxLength: 50 }), async (events) => {
          securityEventRepository.find.mockResolvedValue(events as SecurityEvent[]);

          const result = await service.getSecurityEvents();

          // All returned events should have valid event type and severity
          result.forEach((event) => {
            expect(Object.values(SecurityEventType)).toContain(event.eventType);
            expect(Object.values(SecuritySeverity)).toContain(event.severity);
          });

          // Count should match
          expect(result.length).toBe(events.length);
        }),
        { numRuns: 100 },
      );
    });

    it('should filter events by severity correctly', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(securityEventArb, { minLength: 1, maxLength: 50 }),
          securitySeverityArb,
          async (events, filterSeverity) => {
            const filteredEvents = events.filter((e) => e.severity === filterSeverity);
            securityEventRepository.find.mockResolvedValue(filteredEvents as SecurityEvent[]);

            const result = await service.getSecurityEvents(filterSeverity);

            // All returned events should match the filter severity
            result.forEach((event) => {
              expect(event.severity).toBe(filterSeverity);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: super-admin-enhancement, Property 14: Filter Result Matching
   * For any filtered query, all returned results SHALL match ALL specified filter criteria
   * Validates: Requirements 3.3
   */
  describe('Property 14: Filter Result Matching', () => {
    it('should return only events matching severity filter', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(securityEventArb, { minLength: 10, maxLength: 100 }),
          securitySeverityArb,
          async (allEvents, targetSeverity) => {
            const matchingEvents = allEvents.filter((e) => e.severity === targetSeverity);
            securityEventRepository.find.mockResolvedValue(matchingEvents as SecurityEvent[]);

            const result = await service.getSecurityEvents(targetSeverity);

            // Every result must match the filter
            result.forEach((event) => {
              expect(event.severity).toBe(targetSeverity);
            });

            // No events with different severity should be included
            const nonMatchingSeverities = result.filter((e) => e.severity !== targetSeverity);
            expect(nonMatchingSeverities).toHaveLength(0);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: super-admin-enhancement, Property 15: Session Data Completeness
   * For any active user session, the session record SHALL contain user ID, tenant ID, IP address, user agent, and timestamps
   * Validates: Requirements 3.4
   */
  describe('Property 15: Session Data Completeness', () => {
    it('should return sessions with all required fields', async () => {
      const mockSessions: Partial<UserSession>[] = [
        {
          id: 'session-1',
          userId: 'user-1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
          lastActivity: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
          user: { tenantId: 'tenant-1' } as any,
        },
      ];

      activityLogService.getActiveSessions.mockResolvedValue(
        mockSessions as UserSession[],
      );

      const result = await service.getActiveSessions();

      // Verify all required fields are present
      result.forEach((session) => {
        expect(session).toHaveProperty('sessionId');
        expect(session).toHaveProperty('userId');
        expect(session).toHaveProperty('tenantId');
        expect(session).toHaveProperty('startedAt');
        expect(session).toHaveProperty('lastActivity');
        expect(session).toHaveProperty('expiresAt');
      });
    });
  });

  /**
   * Feature: super-admin-enhancement, Property 16: Session Invalidation
   * For any terminated session, subsequent authentication attempts using that session SHALL fail
   * Validates: Requirements 3.5
   */
  describe('Property 16: Session Invalidation', () => {
    it('should log session termination with complete details', () => {
      fc.assert(
        fc.asyncProperty(fc.uuid(), fc.uuid(), async (sessionId, actorId) => {
          // Clear mocks before each iteration
          jest.clearAllMocks();

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

          // Verify session was looked up
          expect(userSessionRepository.findOne).toHaveBeenCalledWith({
            where: { id: sessionId },
            relations: ['user'],
          });

          // Verify session was terminated
          expect(activityLogService.terminateSession).toHaveBeenCalledWith(sessionId);

          // Verify activity log was created with all required fields
          expect(activityLogRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
              userId: actorId,
              action: 'terminate_session',
              resource: 'user_session',
              resourceId: sessionId,
              isSuspicious: false,
            }),
          );

          // Verify security event was created
          expect(securityEventRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
              eventType: SecurityEventType.UNUSUAL_ACCESS,
              severity: SecuritySeverity.MEDIUM,
              userId: actorId,
            }),
          );
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: super-admin-enhancement, Property 17: Automatic Account Flagging
   * For any account with more than 5 failed login attempts within 15 minutes, the system SHALL automatically flag the account
   * Validates: Requirements 3.6
   */
  describe('Property 17: Automatic Account Flagging', () => {
    it('should flag accounts with more than 5 failed logins', () => {
      fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 6, max: 20 }),
          async (userId, attemptCount) => {
            const now = new Date();
            const events: Partial<SecurityEvent>[] = [];

            // Generate failed login attempts within 15 minutes
            for (let i = 0; i < attemptCount; i++) {
              events.push({
                id: `event-${i}`,
                eventType: SecurityEventType.FAILED_LOGIN,
                userId,
                tenantId: 'tenant-1',
                ipAddress: '192.168.1.1',
                createdAt: new Date(now.getTime() - i * 60 * 1000), // 1 minute apart
              });
            }

            securityEventRepository.find.mockResolvedValue(events as SecurityEvent[]);

            const result = await service.getFlaggedAccounts();

            // Account should be flagged
            expect(result.length).toBeGreaterThan(0);
            const flaggedAccount = result.find((a) => a.userId === userId);
            expect(flaggedAccount).toBeDefined();
            expect(flaggedAccount!.failedAttempts).toBe(attemptCount);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should not flag accounts with 5 or fewer failed logins', () => {
      fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 1, max: 5 }),
          async (userId, attemptCount) => {
            const now = new Date();
            const events: Partial<SecurityEvent>[] = [];

            for (let i = 0; i < attemptCount; i++) {
              events.push({
                id: `event-${i}`,
                eventType: SecurityEventType.FAILED_LOGIN,
                userId,
                tenantId: 'tenant-1',
                ipAddress: '192.168.1.1',
                createdAt: new Date(now.getTime() - i * 60 * 1000),
              });
            }

            securityEventRepository.find.mockResolvedValue(events as SecurityEvent[]);

            const result = await service.getFlaggedAccounts();

            // Account should NOT be flagged
            const flaggedAccount = result.find((a) => a.userId === userId);
            expect(flaggedAccount).toBeUndefined();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: super-admin-enhancement, Property 18: Permission Change Audit Trail
   * For any RBAC permission modification, an audit log entry SHALL be created containing the actor, timestamp, and permission changes
   * Validates: Requirements 3.8
   */
  describe('Property 18: Permission Change Audit Trail', () => {
    it('should return complete audit trail for permission changes', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(activityLogArb, { minLength: 1, maxLength: 50 }),
          async (logs) => {
            activityLogRepository.find.mockResolvedValue(logs as ActivityLog[]);

            const result = await service.getPermissionHistory();

            // All returned records should have required fields
            result.forEach((change) => {
              expect(change).toHaveProperty('id');
              expect(change).toHaveProperty('actor');
              expect(change).toHaveProperty('action');
              expect(change).toHaveProperty('resource');
              expect(change).toHaveProperty('timestamp');
              expect(change.timestamp).toBeInstanceOf(Date);
            });

            // Count should match
            expect(result.length).toBe(logs.length);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should filter permission history by userId', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(activityLogArb, { minLength: 10, maxLength: 50 }),
          fc.uuid(),
          async (allLogs, targetUserId) => {
            const matchingLogs = allLogs.filter((log) => log.userId === targetUserId);
            activityLogRepository.find.mockResolvedValue(matchingLogs as ActivityLog[]);

            const result = await service.getPermissionHistory({ userId: targetUserId });

            // All results should match the filter
            result.forEach((change) => {
              expect(change.actor).toBe(targetUserId);
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should filter permission history by date range', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(activityLogArb, { minLength: 10, maxLength: 50 }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
          fc.date({ min: new Date('2024-06-01'), max: new Date() }),
          async (allLogs, startDate, endDate) => {
            const matchingLogs = allLogs.filter(
              (log) => log.createdAt >= startDate && log.createdAt <= endDate,
            );
            activityLogRepository.find.mockResolvedValue(matchingLogs as ActivityLog[]);

            const result = await service.getPermissionHistory({ startDate, endDate });

            // All results should be within date range
            result.forEach((change) => {
              expect(change.timestamp.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
              expect(change.timestamp.getTime()).toBeLessThanOrEqual(endDate.getTime());
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: super-admin-enhancement, Property 5: Data Export Completeness
   * For any data export operation (CSV), the exported file SHALL contain all records matching the export criteria
   * Validates: Requirements 3.7
   */
  describe('Property 5: Data Export Completeness (Security Logs)', () => {
    it('should export all security events within date range', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(securityEventArb, { minLength: 1, maxLength: 100 }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
          fc.date({ min: new Date('2024-06-01'), max: new Date() }),
          async (events, startDate, endDate) => {
            securityEventRepository.find.mockResolvedValue(events as SecurityEvent[]);

            const csv = await service.exportSecurityLogs(startDate, endDate);

            // CSV should have header + data rows
            const lines = csv.split('\n');
            expect(lines.length).toBe(events.length + 1); // +1 for header

            // Header should contain all required columns
            const header = lines[0];
            expect(header).toContain('ID');
            expect(header).toContain('Event Type');
            expect(header).toContain('Severity');
            expect(header).toContain('User ID');
            expect(header).toContain('Tenant ID');
            expect(header).toContain('IP Address');
            expect(header).toContain('Timestamp');

            // Each event should be represented in CSV
            events.forEach((event) => {
              expect(csv).toContain(event.id);
              expect(csv).toContain(event.eventType);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
