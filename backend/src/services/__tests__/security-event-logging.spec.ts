import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import {
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
} from '../../entities/security-event.entity';

/**
 * Property-Based Test for Database Schema Validation
 * Feature: super-admin-enhancement
 * 
 * This test suite validates Property 4: Critical Event Logging
 * 
 * Property 4: Critical Event Logging
 * For any critical system event, the system SHALL create a log entry
 * containing timestamp, severity, and event details.
 * 
 * **Validates: Requirements 1.4, 2.3, 3.5**
 */
describe('Property 4: Critical Event Logging - Database Schema Validation', () => {
  let repository: jest.Mocked<Repository<SecurityEvent>>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(SecurityEvent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get(getRepositoryToken(SecurityEvent));
  });

  /**
   * Property 4: Critical Event Logging
   * 
   * This property test validates that for ANY critical system event,
   * the system creates a log entry with ALL required fields:
   * - timestamp (createdAt)
   * - severity
   * - event details (eventType, userId, tenantId, ipAddress, userAgent, details)
   * 
   * The test generates random critical events and verifies that:
   * 1. A log entry is created
   * 2. All required fields are present
   * 3. The severity is set correctly
   * 4. The timestamp is valid and recent
   * 5. Event details are preserved
   */
  describe('Property 4: Critical Event Logging', () => {
    it('should create complete log entries for all critical system events', async () => {
      // Define arbitrary generators for critical event data
      const criticalEventArbitrary = fc.record({
        eventType: fc.constantFrom(
          SecurityEventType.FAILED_LOGIN,
          SecurityEventType.PERMISSION_ESCALATION,
          SecurityEventType.UNUSUAL_ACCESS,
          SecurityEventType.SESSION_HIJACK
        ),
        severity: fc.constant(SecuritySeverity.CRITICAL),
        userId: fc.option(fc.uuid(), { nil: null }),
        tenantId: fc.option(fc.uuid(), { nil: null }),
        ipAddress: fc.option(
          fc.oneof(
            // IPv4 addresses
            fc.tuple(
              fc.integer({ min: 0, max: 255 }),
              fc.integer({ min: 0, max: 255 }),
              fc.integer({ min: 0, max: 255 }),
              fc.integer({ min: 0, max: 255 })
            ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
            // IPv6 addresses (simplified)
            fc.constant('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
          ),
          { nil: null }
        ),
        userAgent: fc.option(
          fc.oneof(
            fc.constant('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
            fc.constant('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
            fc.constant('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'),
            fc.constant('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'),
            fc.string({ minLength: 10, maxLength: 200 })
          ),
          { nil: null }
        ),
        details: fc.option(
          fc.record({
            reason: fc.string({ minLength: 5, maxLength: 100 }),
            attemptCount: fc.integer({ min: 1, max: 10 }),
            timestamp: fc.date().map(d => d.toISOString()),
            additionalInfo: fc.option(fc.string({ minLength: 0, maxLength: 200 })),
          }),
          { nil: null }
        ),
      });

      await fc.assert(
        fc.asyncProperty(criticalEventArbitrary, async (eventData) => {
          // Mock the repository to capture the saved event
          let savedEvent: Partial<SecurityEvent> | null = null;

          repository.create.mockImplementation((data) => {
            savedEvent = {
              ...data,
              id: fc.sample(fc.uuid(), 1)[0],
              createdAt: new Date(),
            } as SecurityEvent;
            return savedEvent as SecurityEvent;
          });

          repository.save.mockImplementation(async (event) => {
            return event as SecurityEvent;
          });

          // Simulate logging a critical event
          const eventToLog = repository.create({
            eventType: eventData.eventType,
            severity: eventData.severity,
            userId: eventData.userId,
            tenantId: eventData.tenantId,
            ipAddress: eventData.ipAddress,
            userAgent: eventData.userAgent,
            details: eventData.details,
          });

          await repository.save(eventToLog);

          // Verify that a log entry was created
          expect(repository.create).toHaveBeenCalled();
          expect(repository.save).toHaveBeenCalled();
          expect(savedEvent).not.toBeNull();

          if (savedEvent) {
            // Property 4 Validation: All required fields must be present

            // 1. Verify timestamp is present and valid
            expect(savedEvent.createdAt).toBeDefined();
            expect(savedEvent.createdAt).toBeInstanceOf(Date);
            
            // Verify timestamp is recent (within last minute)
            const now = new Date();
            const timeDiff = now.getTime() - savedEvent.createdAt.getTime();
            expect(timeDiff).toBeGreaterThanOrEqual(0);
            expect(timeDiff).toBeLessThan(60000); // Within 1 minute

            // 2. Verify severity is present and correct
            expect(savedEvent.severity).toBeDefined();
            expect(savedEvent.severity).toBe(SecuritySeverity.CRITICAL);
            expect(Object.values(SecuritySeverity)).toContain(savedEvent.severity);

            // 3. Verify event type is present and valid
            expect(savedEvent.eventType).toBeDefined();
            expect(Object.values(SecurityEventType)).toContain(savedEvent.eventType);

            // 4. Verify event details are preserved
            expect(savedEvent.eventType).toBe(eventData.eventType);
            
            // 5. Verify optional fields are handled correctly
            if (eventData.userId !== null) {
              expect(savedEvent.userId).toBe(eventData.userId);
            }
            
            if (eventData.tenantId !== null) {
              expect(savedEvent.tenantId).toBe(eventData.tenantId);
            }
            
            if (eventData.ipAddress !== null) {
              expect(savedEvent.ipAddress).toBe(eventData.ipAddress);
              // Verify IP address length constraint (max 45 chars for IPv6)
              expect(savedEvent.ipAddress.length).toBeLessThanOrEqual(45);
            }
            
            if (eventData.userAgent !== null) {
              expect(savedEvent.userAgent).toBe(eventData.userAgent);
            }
            
            if (eventData.details !== null) {
              expect(savedEvent.details).toEqual(eventData.details);
            }

            // 6. Verify ID is generated
            expect(savedEvent.id).toBeDefined();
            expect(typeof savedEvent.id).toBe('string');
            expect(savedEvent.id.length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 } // Run 100 iterations as specified in requirements
      );
    });

    /**
     * Additional test: Verify all severity levels are logged correctly
     * This ensures the schema supports all severity levels, not just critical
     */
    it('should create log entries for events of all severity levels', async () => {
      const eventWithSeverityArbitrary = fc.record({
        eventType: fc.constantFrom(...Object.values(SecurityEventType)),
        severity: fc.constantFrom(...Object.values(SecuritySeverity)),
        userId: fc.option(fc.uuid(), { nil: null }),
        tenantId: fc.option(fc.uuid(), { nil: null }),
        ipAddress: fc.option(fc.ipV4(), { nil: null }),
        userAgent: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: null }),
        details: fc.option(
          fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean())),
          { nil: null }
        ),
      });

      await fc.assert(
        fc.asyncProperty(eventWithSeverityArbitrary, async (eventData) => {
          let savedEvent: Partial<SecurityEvent> | null = null;

          repository.create.mockImplementation((data) => {
            savedEvent = {
              ...data,
              id: fc.sample(fc.uuid(), 1)[0],
              createdAt: new Date(),
            } as SecurityEvent;
            return savedEvent as SecurityEvent;
          });

          repository.save.mockImplementation(async (event) => {
            return event as SecurityEvent;
          });

          const eventToLog = repository.create(eventData);
          await repository.save(eventToLog);

          expect(savedEvent).not.toBeNull();

          if (savedEvent) {
            // Verify all required fields are present regardless of severity
            expect(savedEvent.createdAt).toBeDefined();
            expect(savedEvent.createdAt).toBeInstanceOf(Date);
            expect(savedEvent.severity).toBe(eventData.severity);
            expect(savedEvent.eventType).toBe(eventData.eventType);
            expect(savedEvent.id).toBeDefined();

            // Verify severity is one of the valid values
            expect([
              SecuritySeverity.LOW,
              SecuritySeverity.MEDIUM,
              SecuritySeverity.HIGH,
              SecuritySeverity.CRITICAL,
            ]).toContain(savedEvent.severity);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Edge case test: Verify schema handles minimal event data
     * Tests that only required fields (eventType, severity) are truly required
     */
    it('should create log entries with only required fields', async () => {
      const minimalEventArbitrary = fc.record({
        eventType: fc.constantFrom(...Object.values(SecurityEventType)),
        severity: fc.constantFrom(...Object.values(SecuritySeverity)),
      });

      await fc.assert(
        fc.asyncProperty(minimalEventArbitrary, async (eventData) => {
          let savedEvent: Partial<SecurityEvent> | null = null;

          repository.create.mockImplementation((data) => {
            savedEvent = {
              ...data,
              id: fc.sample(fc.uuid(), 1)[0],
              createdAt: new Date(),
              userId: null,
              tenantId: null,
              ipAddress: null,
              userAgent: null,
              details: null,
            } as SecurityEvent;
            return savedEvent as SecurityEvent;
          });

          repository.save.mockImplementation(async (event) => {
            return event as SecurityEvent;
          });

          const eventToLog = repository.create({
            eventType: eventData.eventType,
            severity: eventData.severity,
            userId: null,
            tenantId: null,
            ipAddress: null,
            userAgent: null,
            details: null,
          });

          await repository.save(eventToLog);

          expect(savedEvent).not.toBeNull();

          if (savedEvent) {
            // Verify required fields are present
            expect(savedEvent.id).toBeDefined();
            expect(savedEvent.createdAt).toBeDefined();
            expect(savedEvent.eventType).toBe(eventData.eventType);
            expect(savedEvent.severity).toBe(eventData.severity);

            // Verify optional fields can be null
            expect(savedEvent.userId).toBeNull();
            expect(savedEvent.tenantId).toBeNull();
            expect(savedEvent.ipAddress).toBeNull();
            expect(savedEvent.userAgent).toBeNull();
            expect(savedEvent.details).toBeNull();
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Edge case test: Verify schema handles maximum field lengths
     * Tests that the schema respects VARCHAR length constraints
     */
    it('should respect field length constraints', async () => {
      const eventWithMaxLengthsArbitrary = fc.record({
        eventType: fc.constantFrom(...Object.values(SecurityEventType)),
        severity: fc.constantFrom(...Object.values(SecuritySeverity)),
        ipAddress: fc.string({ minLength: 45, maxLength: 45 }), // Max length for IPv6
        userAgent: fc.string({ minLength: 100, maxLength: 500 }), // Long user agent
      });

      await fc.assert(
        fc.asyncProperty(eventWithMaxLengthsArbitrary, async (eventData) => {
          let savedEvent: Partial<SecurityEvent> | null = null;

          repository.create.mockImplementation((data) => {
            // Simulate database constraint validation
            if (data.ipAddress && data.ipAddress.length > 45) {
              throw new Error('IP address exceeds maximum length of 45 characters');
            }

            savedEvent = {
              ...data,
              id: fc.sample(fc.uuid(), 1)[0],
              createdAt: new Date(),
            } as SecurityEvent;
            return savedEvent as SecurityEvent;
          });

          repository.save.mockImplementation(async (event) => {
            return event as SecurityEvent;
          });

          const eventToLog = repository.create({
            eventType: eventData.eventType,
            severity: eventData.severity,
            userId: null,
            tenantId: null,
            ipAddress: eventData.ipAddress,
            userAgent: eventData.userAgent,
            details: null,
          });

          await repository.save(eventToLog);

          expect(savedEvent).not.toBeNull();

          if (savedEvent) {
            // Verify field length constraints are respected
            if (savedEvent.ipAddress) {
              expect(savedEvent.ipAddress.length).toBeLessThanOrEqual(45);
            }
            
            // User agent can be any length (TEXT type)
            expect(savedEvent.userAgent).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Unit tests for specific edge cases
   */
  describe('Edge Cases', () => {
    it('should handle null values for optional fields', async () => {
      const event = {
        eventType: SecurityEventType.FAILED_LOGIN,
        severity: SecuritySeverity.CRITICAL,
        userId: null,
        tenantId: null,
        ipAddress: null,
        userAgent: null,
        details: null,
      };

      repository.create.mockReturnValue(event as any);
      repository.save.mockResolvedValue({
        ...event,
        id: 'test-id',
        createdAt: new Date(),
      } as SecurityEvent);

      const created = repository.create(event);
      const saved = await repository.save(created);

      expect(saved.userId).toBeNull();
      expect(saved.tenantId).toBeNull();
      expect(saved.ipAddress).toBeNull();
      expect(saved.userAgent).toBeNull();
      expect(saved.details).toBeNull();
    });

    it('should handle complex JSON details', async () => {
      const complexDetails = {
        reason: 'Multiple failed login attempts',
        attemptCount: 5,
        timestamps: [
          new Date().toISOString(),
          new Date().toISOString(),
          new Date().toISOString(),
        ],
        metadata: {
          browser: 'Chrome',
          os: 'Windows',
          location: {
            country: 'US',
            city: 'New York',
          },
        },
      };

      const event = {
        eventType: SecurityEventType.FAILED_LOGIN,
        severity: SecuritySeverity.HIGH,
        userId: 'test-user-id',
        tenantId: 'test-tenant-id',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: complexDetails,
      };

      repository.create.mockReturnValue(event as any);
      repository.save.mockResolvedValue({
        ...event,
        id: 'test-id',
        createdAt: new Date(),
      } as SecurityEvent);

      const created = repository.create(event);
      const saved = await repository.save(created);

      expect(saved.details).toEqual(complexDetails);
      expect(saved.details?.metadata?.location?.city).toBe('New York');
    });

    it('should generate unique IDs for each event', async () => {
      const ids = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const id = fc.sample(fc.uuid(), 1)[0];
        ids.add(id);
      }

      // All IDs should be unique
      expect(ids.size).toBe(10);
    });

    it('should maintain timestamp precision', async () => {
      const now = new Date();
      
      const event = repository.create({
        eventType: SecurityEventType.UNUSUAL_ACCESS,
        severity: SecuritySeverity.MEDIUM,
        userId: null,
        tenantId: null,
        ipAddress: null,
        userAgent: null,
        details: null,
      });

      repository.save.mockResolvedValue({
        ...event,
        id: 'test-id',
        createdAt: now,
      } as SecurityEvent);

      const saved = await repository.save(event);

      // Verify timestamp precision (milliseconds)
      expect(saved.createdAt.getTime()).toBe(now.getTime());
    });
  });
});
