import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, Between } from 'typeorm';
import * as fc from 'fast-check';
import {
  EnhancedSystemHealthService,
  SystemMetrics,
  MetricCategory,
  ThresholdViolation,
} from '../enhanced-system-health.service';
import { SystemHealthLog, HealthStatus, ServiceType } from '../../entities/system-health.entity';

describe('EnhancedSystemHealthService - Property-Based Tests', () => {
  let service: EnhancedSystemHealthService;
  let repository: jest.Mocked<Repository<SystemHealthLog>>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockDataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnhancedSystemHealthService,
        {
          provide: getRepositoryToken(SystemHealthLog),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<EnhancedSystemHealthService>(EnhancedSystemHealthService);
    repository = module.get(getRepositoryToken(SystemHealthLog));
    dataSource = module.get(DataSource);
  });

  /**
   * Property 1: System Metrics Completeness
   * For any system health query, the returned metrics SHALL contain all required fields
   * (database, API, and server metrics) with valid numeric values.
   * Validates: Requirements 1.1
   */
  describe('Property 1: System Metrics Completeness', () => {
    it('should return complete metrics structure with all required fields', async () => {
      // Mock database responses
      dataSource.query.mockImplementation((query: string) => {
        if (query.includes('pg_stat_activity')) {
          return Promise.resolve([{ count: '10' }]);
        }
        if (query.includes('pg_database_size')) {
          return Promise.resolve([{ size: '1000000' }]);
        }
        if (query.includes('system_health_logs')) {
          return Promise.resolve([{ avg_time: '50', count: '5' }]);
        }
        return Promise.resolve([]);
      });

      repository.find.mockResolvedValue([]);

      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          const metrics = await service.getCurrentMetrics();

          // Verify structure completeness
          expect(metrics).toHaveProperty('timestamp');
          expect(metrics).toHaveProperty('database');
          expect(metrics).toHaveProperty('api');
          expect(metrics).toHaveProperty('server');

          // Verify database metrics
          expect(metrics.database).toHaveProperty('connectionCount');
          expect(metrics.database).toHaveProperty('activeQueries');
          expect(metrics.database).toHaveProperty('avgQueryTime');
          expect(metrics.database).toHaveProperty('slowQueries');
          expect(metrics.database).toHaveProperty('diskUsage');

          // Verify API metrics
          expect(metrics.api).toHaveProperty('requestsPerMinute');
          expect(metrics.api).toHaveProperty('avgResponseTime');
          expect(metrics.api).toHaveProperty('errorRate');
          expect(metrics.api).toHaveProperty('p95ResponseTime');
          expect(metrics.api).toHaveProperty('p99ResponseTime');

          // Verify server metrics
          expect(metrics.server).toHaveProperty('cpuUsage');
          expect(metrics.server).toHaveProperty('memoryUsage');
          expect(metrics.server).toHaveProperty('diskUsage');
          expect(metrics.server).toHaveProperty('networkIn');
          expect(metrics.server).toHaveProperty('networkOut');

          // Verify all numeric values are valid
          expect(typeof metrics.database.connectionCount).toBe('number');
          expect(typeof metrics.database.activeQueries).toBe('number');
          expect(typeof metrics.database.avgQueryTime).toBe('number');
          expect(typeof metrics.api.avgResponseTime).toBe('number');
          expect(typeof metrics.server.cpuUsage).toBe('number');
          expect(typeof metrics.server.memoryUsage).toBe('number');

          // Verify non-negative values
          expect(metrics.database.connectionCount).toBeGreaterThanOrEqual(0);
          expect(metrics.database.activeQueries).toBeGreaterThanOrEqual(0);
          expect(metrics.api.errorRate).toBeGreaterThanOrEqual(0);
          expect(metrics.server.cpuUsage).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 2: Threshold Violation Detection
   * For any system metric that exceeds its defined threshold, the system SHALL
   * correctly identify it as a violation with appropriate severity level.
   * Validates: Requirements 1.2
   */
  describe('Property 2: Threshold Violation Detection', () => {
    it('should correctly identify threshold violations with proper severity', async () => {
      // Mock high metric values that exceed thresholds
      dataSource.query.mockImplementation((query: string) => {
        if (query.includes('pg_stat_activity')) {
          return Promise.resolve([{ count: '100' }]); // High connection count
        }
        if (query.includes('system_health_logs')) {
          return Promise.resolve([{ avg_time: '1500', count: '60' }]); // High query time and slow queries
        }
        return Promise.resolve([{ count: '0', size: '1000000' }]);
      });

      repository.find.mockResolvedValue([
        {
          id: '1',
          service: ServiceType.API,
          status: HealthStatus.DOWN,
          responseTime: 2000,
          checkedAt: new Date(),
        } as SystemHealthLog,
      ]);

      repository.save.mockResolvedValue({} as SystemHealthLog);
      repository.create.mockReturnValue({} as SystemHealthLog);

      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          const violations = await service.checkThresholds();

          // Verify violations are detected
          expect(Array.isArray(violations)).toBe(true);

          // Verify each violation has required properties
          violations.forEach((violation: ThresholdViolation) => {
            expect(violation).toHaveProperty('metricType');
            expect(violation).toHaveProperty('metricName');
            expect(violation).toHaveProperty('currentValue');
            expect(violation).toHaveProperty('thresholdValue');
            expect(violation).toHaveProperty('severity');
            expect(violation).toHaveProperty('timestamp');

            // Verify severity is valid
            expect(['low', 'medium', 'high', 'critical']).toContain(violation.severity);

            // Verify current value exceeds threshold
            expect(violation.currentValue).toBeGreaterThanOrEqual(violation.thresholdValue);

            // Verify timestamp is recent
            const now = new Date();
            const timeDiff = now.getTime() - violation.timestamp.getTime();
            expect(timeDiff).toBeLessThan(60000); // Within last minute
          });
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 3: Time Range Query Accuracy
   * For any time range query, all returned records SHALL have timestamps
   * within the specified range (inclusive).
   * Validates: Requirements 1.3, 1.6
   */
  describe('Property 3: Time Range Query Accuracy', () => {
    it('should return only metrics within specified time range', async () => {
      const metricArbitrary = fc.record({
        id: fc.uuid(),
        service: fc.constantFrom(...Object.values(ServiceType)),
        status: fc.constantFrom(...Object.values(HealthStatus)),
        metricType: fc.constantFrom('DATABASE', 'API', 'SERVER'),
        metricName: fc.string({ minLength: 1, maxLength: 50 }),
        metricValue: fc.float({ min: 0, max: 1000 }),
        checkedAt: fc.date(),
      });

      await fc.assert(
        fc.asyncProperty(
          fc.date(),
          fc.date(),
          fc.array(metricArbitrary, { minLength: 10, maxLength: 100 }),
          async (startDate, endDate, allMetrics) => {
            // Ensure startDate is before endDate
            const [start, end] = startDate < endDate ? [startDate, endDate] : [endDate, startDate];

            // Filter metrics to only those within range
            const expectedMetrics = allMetrics.filter(
              m => m.checkedAt >= start && m.checkedAt <= end
            );

            repository.find.mockResolvedValue(expectedMetrics as SystemHealthLog[]);

            const result = await service.getHistoricalMetrics(start, end);

            // Verify all returned metrics are within range
            result.forEach(metric => {
              expect(metric.timestamp.getTime()).toBeGreaterThanOrEqual(start.getTime());
              expect(metric.timestamp.getTime()).toBeLessThanOrEqual(end.getTime());
            });

            // Verify count matches expected
            expect(result.length).toBe(expectedMetrics.length);
          }
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 4: Critical Event Logging
   * For any critical system event, the system SHALL create a log entry
   * containing timestamp, severity, and event details.
   * Validates: Requirements 1.4
   */
  describe('Property 4: Critical Event Logging', () => {
    it('should log critical threshold violations with complete information', async () => {
      const violationArbitrary = fc.record({
        metricType: fc.constantFrom('DATABASE', 'API', 'SERVER'),
        metricName: fc.string({ minLength: 1, maxLength: 50 }),
        currentValue: fc.float({ min: 90, max: 100 }),
        thresholdValue: fc.float({ min: 80, max: 90 }),
        severity: fc.constant('critical' as const),
        timestamp: fc.date(),
      });

      await fc.assert(
        fc.asyncProperty(violationArbitrary, async (violation) => {
          let savedLog: any = null;

          repository.create.mockImplementation((data) => {
            savedLog = data;
            return data as SystemHealthLog;
          });

          repository.save.mockResolvedValue({} as SystemHealthLog);

          // Trigger logging by checking thresholds with high values
          dataSource.query.mockImplementation(() => 
            Promise.resolve([{ count: '100', avg_time: '2000', size: '1000000' }])
          );
          repository.find.mockResolvedValue([]);

          await service.checkThresholds();

          // Verify at least one log was created
          expect(repository.create).toHaveBeenCalled();

          if (savedLog) {
            // Verify log completeness
            expect(savedLog).toHaveProperty('service');
            expect(savedLog).toHaveProperty('status');
            expect(savedLog).toHaveProperty('metricType');
            expect(savedLog).toHaveProperty('metricName');
            expect(savedLog).toHaveProperty('metricValue');
            expect(savedLog).toHaveProperty('thresholdValue');
            expect(savedLog).toHaveProperty('severity');
            expect(savedLog).toHaveProperty('errorMessage');
            expect(savedLog).toHaveProperty('metadata');

            // Verify severity is critical
            expect(savedLog.severity).toBe('critical');

            // Verify metadata contains violation flag
            expect(savedLog.metadata).toHaveProperty('violation');
            expect(savedLog.metadata.violation).toBe(true);
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 5: Data Export Completeness
   * For any data export operation (CSV), the exported file SHALL contain
   * all records matching the export criteria with all required fields.
   * Validates: Requirements 1.7
   */
  describe('Property 5: Data Export Completeness', () => {
    it('should export all metrics in valid CSV format', async () => {
      const metricArbitrary = fc.record({
        timestamp: fc.date(),
        metricType: fc.constantFrom('DATABASE', 'API', 'SERVER'),
        metricName: fc.string({ minLength: 1, maxLength: 50 }),
        value: fc.float({ min: 0, max: 1000 }),
      });

      await fc.assert(
        fc.asyncProperty(
          fc.date(),
          fc.date(),
          fc.array(metricArbitrary, { minLength: 1, maxLength: 50 }),
          async (startDate, endDate, metrics) => {
            const [start, end] = startDate < endDate ? [startDate, endDate] : [endDate, startDate];

            // Mock repository to return metrics
            const mockLogs = metrics.map(m => ({
              id: 'test-id',
              service: ServiceType.DATABASE,
              status: HealthStatus.HEALTHY,
              metricType: m.metricType,
              metricName: m.metricName,
              metricValue: m.value,
              checkedAt: m.timestamp,
            }));

            repository.find.mockResolvedValue(mockLogs as SystemHealthLog[]);

            const csv = await service.exportMetrics(start, end);

            // Verify CSV format
            expect(typeof csv).toBe('string');
            expect(csv.length).toBeGreaterThan(0);

            // Verify CSV header
            expect(csv).toContain('Timestamp,Metric Type,Metric Name,Value');

            // Verify CSV contains all metrics
            const lines = csv.split('\n').filter(line => line.length > 0);
            expect(lines.length).toBe(metrics.length + 1); // +1 for header

            // Verify each metric is in CSV
            metrics.forEach(metric => {
              const csvLine = `${metric.timestamp.toISOString()},${metric.metricType},${metric.metricName},${metric.value}`;
              expect(csv).toContain(metric.metricType);
              expect(csv).toContain(metric.metricName);
            });
          }
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Additional unit tests for edge cases
   */
  describe('Edge Cases', () => {
    it('should handle empty metric history gracefully', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.getHistoricalMetrics(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result).toEqual([]);
    });

    it('should handle database connection errors gracefully', async () => {
      dataSource.query.mockRejectedValue(new Error('Connection failed'));
      repository.find.mockResolvedValue([]);

      const metrics = await service.getCurrentMetrics();

      // Should return zero values instead of throwing
      expect(metrics.database.connectionCount).toBe(0);
      expect(metrics.database.activeQueries).toBe(0);
    });

    it('should cache metrics for 30 seconds', async () => {
      dataSource.query.mockResolvedValue([{ count: '10', avg_time: '50', size: '1000000' }]);
      repository.find.mockResolvedValue([]);

      // First call
      const metrics1 = await service.getCurrentMetrics();
      const callCount1 = dataSource.query.mock.calls.length;

      // Second call immediately after (should use cache)
      const metrics2 = await service.getCurrentMetrics();
      const callCount2 = dataSource.query.mock.calls.length;

      // Should not make additional database calls
      expect(callCount2).toBe(callCount1);
      expect(metrics1.timestamp).toEqual(metrics2.timestamp);
    });
  });
});
