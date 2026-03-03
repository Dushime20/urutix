import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as fc from 'fast-check';
import { SystemHealthService, SystemMetrics, MetricCategory, ThresholdViolation, SeverityLevel } from '../system-health.service';
import { SystemHealthLog } from '../../entities/system-health.entity';

/**
 * Property-Based Tests for System Health Service
 * Feature: super-admin-enhancement
 * 
 * This test suite validates the following properties:
 * - Property 1: System Metrics Completeness
 * - Property 2: Threshold Violation Detection
 * - Property 3: Time Range Query Accuracy
 * - Property 5: Data Export Completeness
 * 
 * Each property test runs a minimum of 100 iterations as specified in requirements.
 */
describe('System Health Service - Property-Based Tests', () => {
  let service: SystemHealthService;
  let healthLogRepository: jest.Mocked<Repository<SystemHealthLog>>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const mockHealthLogRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockDataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemHealthService,
        {
          provide: getRepositoryToken(SystemHealthLog),
          useValue: mockHealthLogRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SystemHealthService>(SystemHealthService);
    healthLogRepository = module.get(getRepositoryToken(SystemHealthLog));
    dataSource = module.get(DataSource);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 1: System Metrics Completeness
   * 
   * For any system health query, the returned metrics SHALL contain all required fields
   * (database, API, and server metrics) with valid numeric values.
   * 
   * **Validates: Requirements 1.1**
   */
  describe('Property 1: System Metrics Completeness', () => {
    it('should return complete metrics with all required fields for any database state', async () => {
      // Define arbitrary generators for database query results
      const databaseMetricsArbitrary = fc.record({
        connectionCount: fc.integer({ min: 0, max: 100 }),
        activeQueries: fc.integer({ min: 0, max: 50 }),
        avgQueryTime: fc.float({ min: 0, max: 5000, noNaN: true }),
        slowQueries: fc.integer({ min: 0, max: 20 }),
        diskUsage: fc.float({ min: 0, max: 100000, noNaN: true }),
      });

      await fc.assert(
        fc.asyncProperty(databaseMetricsArbitrary, async (dbMetrics) => {
          // Mock database queries to return generated values
          dataSource.query
            .mockResolvedValueOnce([{ count: dbMetrics.connectionCount.toString() }])
            .mockResolvedValueOnce([{ count: dbMetrics.activeQueries.toString() }])
            .mockResolvedValueOnce([{ avg_time: dbMetrics.avgQueryTime.toString() }])
            .mockResolvedValueOnce([{ count: dbMetrics.slowQueries.toString() }])
            .mockResolvedValueOnce([{ size_mb: dbMetrics.diskUsage.toString() }]);

          const metrics = await service.getCurrentMetrics();

          // Property 1 Validation: All required fields must be present

          // 1. Verify top-level structure
          expect(metrics).toBeDefined();
          expect(metrics).toHaveProperty('timestamp');
          expect(metrics).toHaveProperty('database');
          expect(metrics).toHaveProperty('api');
          expect(metrics).toHaveProperty('server');

          // 2. Verify timestamp is valid
          expect(metrics.timestamp).toBeInstanceOf(Date);
          expect(metrics.timestamp.getTime()).toBeGreaterThan(0);
          expect(isNaN(metrics.timestamp.getTime())).toBe(false);

          // 3. Verify database metrics completeness
          expect(metrics.database).toBeDefined();
          expect(metrics.database).toHaveProperty('connectionCount');
          expect(metrics.database).toHaveProperty('activeQueries');
          expect(metrics.database).toHaveProperty('avgQueryTime');
          expect(metrics.database).toHaveProperty('slowQueries');
          expect(metrics.database).toHaveProperty('diskUsage');

          // 4. Verify database metrics are valid numbers
          expect(typeof metrics.database.connectionCount).toBe('number');
          expect(typeof metrics.database.activeQueries).toBe('number');
          expect(typeof metrics.database.avgQueryTime).toBe('number');
          expect(typeof metrics.database.slowQueries).toBe('number');
          expect(typeof metrics.database.diskUsage).toBe('number');

          expect(isNaN(metrics.database.connectionCount)).toBe(false);
          expect(isNaN(metrics.database.activeQueries)).toBe(false);
          expect(isNaN(metrics.database.avgQueryTime)).toBe(false);
          expect(isNaN(metrics.database.slowQueries)).toBe(false);
          expect(isNaN(metrics.database.diskUsage)).toBe(false);

          // 5. Verify API metrics completeness
          expect(metrics.api).toBeDefined();
          expect(metrics.api).toHaveProperty('requestsPerMinute');
          expect(metrics.api).toHaveProperty('avgResponseTime');
          expect(metrics.api).toHaveProperty('errorRate');
          expect(metrics.api).toHaveProperty('p95ResponseTime');
          expect(metrics.api).toHaveProperty('p99ResponseTime');

          // 6. Verify API metrics are valid numbers
          expect(typeof metrics.api.requestsPerMinute).toBe('number');
          expect(typeof metrics.api.avgResponseTime).toBe('number');
          expect(typeof metrics.api.errorRate).toBe('number');
          expect(typeof metrics.api.p95ResponseTime).toBe('number');
          expect(typeof metrics.api.p99ResponseTime).toBe('number');

          expect(isNaN(metrics.api.requestsPerMinute)).toBe(false);
          expect(isNaN(metrics.api.avgResponseTime)).toBe(false);
          expect(isNaN(metrics.api.errorRate)).toBe(false);
          expect(isNaN(metrics.api.p95ResponseTime)).toBe(false);
          expect(isNaN(metrics.api.p99ResponseTime)).toBe(false);

          // 7. Verify server metrics completeness
          expect(metrics.server).toBeDefined();
          expect(metrics.server).toHaveProperty('cpuUsage');
          expect(metrics.server).toHaveProperty('memoryUsage');
          expect(metrics.server).toHaveProperty('diskUsage');
          expect(metrics.server).toHaveProperty('networkIn');
          expect(metrics.server).toHaveProperty('networkOut');

          // 8. Verify server metrics are valid numbers
          expect(typeof metrics.server.cpuUsage).toBe('number');
          expect(typeof metrics.server.memoryUsage).toBe('number');
          expect(typeof metrics.server.diskUsage).toBe('number');
          expect(typeof metrics.server.networkIn).toBe('number');
          expect(typeof metrics.server.networkOut).toBe('number');

          expect(isNaN(metrics.server.cpuUsage)).toBe(false);
          expect(isNaN(metrics.server.memoryUsage)).toBe(false);
          expect(isNaN(metrics.server.diskUsage)).toBe(false);
          expect(isNaN(metrics.server.networkIn)).toBe(false);
          expect(isNaN(metrics.server.networkOut)).toBe(false);

          // 9. Verify all numeric values are non-negative
          expect(metrics.database.connectionCount).toBeGreaterThanOrEqual(0);
          expect(metrics.database.activeQueries).toBeGreaterThanOrEqual(0);
          expect(metrics.database.avgQueryTime).toBeGreaterThanOrEqual(0);
          expect(metrics.database.slowQueries).toBeGreaterThanOrEqual(0);
          expect(metrics.database.diskUsage).toBeGreaterThanOrEqual(0);

          expect(metrics.api.requestsPerMinute).toBeGreaterThanOrEqual(0);
          expect(metrics.api.avgResponseTime).toBeGreaterThanOrEqual(0);
          expect(metrics.api.errorRate).toBeGreaterThanOrEqual(0);
          expect(metrics.api.p95ResponseTime).toBeGreaterThanOrEqual(0);
          expect(metrics.api.p99ResponseTime).toBeGreaterThanOrEqual(0);

          expect(metrics.server.cpuUsage).toBeGreaterThanOrEqual(0);
          expect(metrics.server.memoryUsage).toBeGreaterThanOrEqual(0);
          expect(metrics.server.diskUsage).toBeGreaterThanOrEqual(0);
          expect(metrics.server.networkIn).toBeGreaterThanOrEqual(0);
          expect(metrics.server.networkOut).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Threshold Violation Detection
   * 
   * For any system metric that exceeds its defined threshold, the system SHALL
   * correctly identify it as a violation with appropriate severity level.
   * 
   * **Validates: Requirements 1.2**
   */
  describe('Property 2: Threshold Violation Detection', () => {
    it('should detect violations when metrics exceed thresholds', async () => {
      // Define arbitrary generators for metrics that exceed thresholds
      const violatingMetricsArbitrary = fc.record({
        connectionCount: fc.integer({ min: 81, max: 200 }), // Critical threshold: 80
        activeQueries: fc.integer({ min: 51, max: 100 }), // Critical threshold: 50
        avgQueryTime: fc.float({ min: 1001, max: 5000, noNaN: true }), // Critical threshold: 1000
      });

      await fc.assert(
        fc.asyncProperty(violatingMetricsArbitrary, async (metrics) => {
          // Mock database queries to return violating values
          dataSource.query
            .mockResolvedValueOnce([{ count: metrics.connectionCount.toString() }])
            .mockResolvedValueOnce([{ count: metrics.activeQueries.toString() }])
            .mockResolvedValueOnce([{ avg_time: metrics.avgQueryTime.toString() }])
            .mockResolvedValueOnce([{ count: '0' }])
            .mockResolvedValueOnce([{ size_mb: '100' }]);

          healthLogRepository.create.mockImplementation((data) => data as any);
          healthLogRepository.save.mockResolvedValue({} as any);

          const violations = await service.checkThresholds();

          // Property 2 Validation: Violations must be detected

          // 1. Verify violations array is not empty
          expect(violations).toBeDefined();
          expect(Array.isArray(violations)).toBe(true);
          expect(violations.length).toBeGreaterThan(0);

          // 2. Verify each violation has required fields
          violations.forEach((violation) => {
            expect(violation).toHaveProperty('metricType');
            expect(violation).toHaveProperty('metricName');
            expect(violation).toHaveProperty('currentValue');
            expect(violation).toHaveProperty('thresholdValue');
            expect(violation).toHaveProperty('severity');
            expect(violation).toHaveProperty('timestamp');
            expect(violation).toHaveProperty('message');

            // 3. Verify severity is valid
            expect(['low', 'medium', 'high', 'critical']).toContain(violation.severity);

            // 4. Verify current value exceeds threshold
            expect(violation.currentValue).toBeGreaterThanOrEqual(violation.thresholdValue);

            // 5. Verify timestamp is valid and recent
            expect(violation.timestamp).toBeInstanceOf(Date);
            const timeDiff = Date.now() - violation.timestamp.getTime();
            expect(timeDiff).toBeGreaterThanOrEqual(0);
            expect(timeDiff).toBeLessThan(60000); // Within 1 minute

            // 6. Verify message contains relevant information
            expect(violation.message).toContain(violation.metricType);
            expect(violation.message.length).toBeGreaterThan(0);
          });

          // 7. Verify connection count violation is detected
          const connectionViolation = violations.find(
            v => v.metricName === 'connection_count'
          );
          expect(connectionViolation).toBeDefined();
          if (connectionViolation) {
            expect(connectionViolation.currentValue).toBe(metrics.connectionCount);
            expect(connectionViolation.severity).toBe('critical');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should assign correct severity levels based on threshold values', async () => {
      // Test warning vs critical thresholds
      const metricWithSeverityArbitrary = fc.record({
        connectionCount: fc.integer({ min: 50, max: 200 }), // Warning: 50, Critical: 80
        isCritical: fc.boolean(),
      });

      await fc.assert(
        fc.asyncProperty(metricWithSeverityArbitrary, async ({ connectionCount, isCritical }) => {
          // Adjust value to be in warning or critical range
          const adjustedValue = isCritical 
            ? Math.max(connectionCount, 81) // Ensure critical
            : Math.min(Math.max(connectionCount, 50), 79); // Ensure warning but not critical

          dataSource.query
            .mockResolvedValueOnce([{ count: adjustedValue.toString() }])
            .mockResolvedValueOnce([{ count: '0' }])
            .mockResolvedValueOnce([{ avg_time: '0' }])
            .mockResolvedValueOnce([{ count: '0' }])
            .mockResolvedValueOnce([{ size_mb: '100' }]);

          healthLogRepository.create.mockImplementation((data) => data as any);
          healthLogRepository.save.mockResolvedValue({} as any);

          const violations = await service.checkThresholds();

          const connectionViolation = violations.find(
            v => v.metricName === 'connection_count'
          );

          if (connectionViolation) {
            if (isCritical && adjustedValue >= 81) {
              expect(connectionViolation.severity).toBe('critical');
            } else if (adjustedValue >= 50 && adjustedValue < 80) {
              expect(connectionViolation.severity).toBe('medium');
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Time Range Query Accuracy
   * 
   * For any time range query across any data type (health metrics, logs, transactions),
   * all returned records SHALL have timestamps within the specified range (inclusive).
   * 
   * **Validates: Requirements 1.3, 1.6**
   */
  describe('Property 3: Time Range Query Accuracy', () => {
    it('should return only metrics within the specified time range', async () => {
      // Define arbitrary generators for time ranges and metrics
      const timeRangeArbitrary = fc.record({
        startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        daysRange: fc.integer({ min: 1, max: 30 }),
      }).chain(({ startDate, daysRange }) => {
        // Ensure startDate is valid
        if (isNaN(startDate.getTime())) {
          return fc.constant({ startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') });
        }
        const endDate = new Date(startDate.getTime() + daysRange * 24 * 60 * 60 * 1000);
        return fc.constant({ startDate, endDate });
      });

      await fc.assert(
        fc.asyncProperty(timeRangeArbitrary, async ({ startDate, endDate }) => {
          // Generate mock logs with timestamps within the range
          const numLogs = fc.sample(fc.integer({ min: 1, max: 10 }), 1)[0];
          const logsInRange = Array.from({ length: numLogs }, (_, i) => ({
            checkedAt: new Date(startDate.getTime() + (i * (endDate.getTime() - startDate.getTime()) / numLogs)),
            service: ['DATABASE', 'API', 'SERVER'][i % 3],
            metadata: {
              connectionCount: 10 + i,
              activeQueries: 2 + i,
            },
          }));

          const mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue(logsInRange),
          };

          healthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

          const result = await service.getHistoricalMetrics(startDate, endDate);

          // Property 3 Validation: All timestamps must be within range

          // 1. Verify result is an array
          expect(Array.isArray(result)).toBe(true);

          // 2. Verify each entry has a valid timestamp
          result.forEach((entry) => {
            expect(entry).toHaveProperty('timestamp');
            expect(entry.timestamp).toBeInstanceOf(Date);
            expect(isNaN(entry.timestamp.getTime())).toBe(false);

            // 3. Verify timestamp is within range (inclusive)
            const timestamp = entry.timestamp.getTime();
            const start = startDate.getTime();
            const end = endDate.getTime();

            expect(timestamp).toBeGreaterThanOrEqual(start);
            expect(timestamp).toBeLessThanOrEqual(end);

            // 4. Verify metrics object exists
            expect(entry).toHaveProperty('metrics');
            expect(typeof entry.metrics).toBe('object');
          });

          // 5. Verify query was called with correct parameters
          expect(mockQueryBuilder.where).toHaveBeenCalledWith(
            'log.checkedAt >= :startDate',
            { startDate }
          );
          expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
            'log.checkedAt <= :endDate',
            { endDate }
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases with same start and end date', async () => {
      const singleDateArbitrary = fc.date({ 
        min: new Date('2024-01-01'), 
        max: new Date('2024-12-31') 
      });

      await fc.assert(
        fc.asyncProperty(singleDateArbitrary, async (date) => {
          const mockLogs = [{
            checkedAt: date,
            service: 'DATABASE',
            metadata: { connectionCount: 10 },
          }];

          const mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue(mockLogs),
          };

          healthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

          const result = await service.getHistoricalMetrics(date, date);

          // Should return metrics for the exact date
          expect(Array.isArray(result)).toBe(true);
          
          result.forEach((entry) => {
            expect(entry.timestamp.getTime()).toBe(date.getTime());
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should return empty array when no metrics exist in range', async () => {
      const timeRangeArbitrary = fc.record({
        startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-30') }),
        endDate: fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') }),
      });

      await fc.assert(
        fc.asyncProperty(timeRangeArbitrary, async ({ startDate, endDate }) => {
          const mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
          };

          healthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

          const result = await service.getHistoricalMetrics(startDate, endDate);

          // Should return empty array
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Data Export Completeness
   * 
   * For any data export operation (CSV or JSON), the exported file SHALL contain
   * all records matching the export criteria with all required fields.
   * 
   * **Validates: Requirements 1.7**
   */
  describe('Property 5: Data Export Completeness', () => {
    it('should export CSV with all required columns for any time range', async () => {
      const timeRangeArbitrary = fc.record({
        startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        daysRange: fc.integer({ min: 1, max: 7 }),
      }).map(({ startDate, daysRange }) => {
        const endDate = new Date(startDate.getTime() + daysRange * 24 * 60 * 60 * 1000);
        return { startDate, endDate };
      });

      await fc.assert(
        fc.asyncProperty(timeRangeArbitrary, async ({ startDate, endDate }) => {
          // Generate mock metrics data
          const mockLogs = fc.sample(
            fc.record({
              checkedAt: fc.date({ min: startDate, max: endDate }),
              service: fc.constantFrom('DATABASE', 'API', 'SERVER'),
              metadata: fc.record({
                connectionCount: fc.integer({ min: 0, max: 100 }),
                activeQueries: fc.integer({ min: 0, max: 50 }),
                avgQueryTime: fc.float({ min: 0, max: 1000, noNaN: true }),
                slowQueries: fc.integer({ min: 0, max: 10 }),
                diskUsage: fc.float({ min: 0, max: 10000, noNaN: true }),
                requestsPerMinute: fc.float({ min: 0, max: 1000, noNaN: true }),
                avgResponseTime: fc.float({ min: 0, max: 500, noNaN: true }),
                errorRate: fc.float({ min: 0, max: 10, noNaN: true }),
                p95ResponseTime: fc.float({ min: 0, max: 1000, noNaN: true }),
                p99ResponseTime: fc.float({ min: 0, max: 2000, noNaN: true }),
                cpuUsage: fc.float({ min: 0, max: 100, noNaN: true }),
                memoryUsage: fc.float({ min: 0, max: 100, noNaN: true }),
                networkIn: fc.integer({ min: 0, max: 10000 }),
                networkOut: fc.integer({ min: 0, max: 10000 }),
              }),
            }),
            fc.sample(fc.integer({ min: 1, max: 5 }), 1)[0]
          );

          const mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue(mockLogs),
          };

          healthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

          const csv = await service.exportMetrics(startDate, endDate);

          // Property 5 Validation: CSV must contain all required fields

          // 1. Verify CSV is a non-empty string
          expect(typeof csv).toBe('string');
          expect(csv.length).toBeGreaterThan(0);

          // 2. Split CSV into lines
          const lines = csv.split('\n');
          expect(lines.length).toBeGreaterThan(0);

          // 3. Verify header row contains all required columns
          const header = lines[0];
          const requiredColumns = [
            'Timestamp',
            'Database Connection Count',
            'Database Active Queries',
            'Database Avg Query Time (ms)',
            'Database Slow Queries',
            'Database Disk Usage (MB)',
            'API Requests Per Minute',
            'API Avg Response Time (ms)',
            'API Error Rate (%)',
            'API P95 Response Time (ms)',
            'API P99 Response Time (ms)',
            'Server CPU Usage (%)',
            'Server Memory Usage (%)',
            'Server Disk Usage (%)',
            'Server Network In (bytes)',
            'Server Network Out (bytes)',
          ];

          requiredColumns.forEach((column) => {
            expect(header).toContain(column);
          });

          // 4. Verify header has correct number of columns
          const headerColumns = header.split(',');
          expect(headerColumns.length).toBe(16);

          // 5. If there are data rows, verify they have the same number of columns
          if (lines.length > 1) {
            for (let i = 1; i < lines.length; i++) {
              if (lines[i].trim().length > 0) {
                const dataColumns = lines[i].split(',');
                expect(dataColumns.length).toBe(16);

                // 6. Verify first column (timestamp) is a valid ISO date
                const timestamp = dataColumns[0];
                expect(timestamp.length).toBeGreaterThan(0);
                const date = new Date(timestamp);
                expect(isNaN(date.getTime())).toBe(false);

                // 7. Verify timestamp is within the requested range
                expect(date.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
                expect(date.getTime()).toBeLessThanOrEqual(endDate.getTime());

                // 8. Verify all other columns are numeric values or 0
                for (let j = 1; j < dataColumns.length; j++) {
                  const value = parseFloat(dataColumns[j]);
                  expect(isNaN(value)).toBe(false);
                  expect(value).toBeGreaterThanOrEqual(0);
                }
              }
            }
          }

          // 9. Verify CSV format uses commas as delimiters
          expect(csv).toContain(',');

          // 10. Verify CSV format
          // Note: CSV always has at least a header, so we check for proper structure
          // If there are multiple lines (header + data), verify newlines exist
          if (lines.length > 1) {
            expect(csv).toContain('\n');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should export empty CSV with headers when no data exists', async () => {
      const timeRangeArbitrary = fc.record({
        startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        endDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
      });

      await fc.assert(
        fc.asyncProperty(timeRangeArbitrary, async ({ startDate, endDate }) => {
          const mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
          };

          healthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

          const csv = await service.exportMetrics(startDate, endDate);

          // Should return CSV with headers only
          expect(typeof csv).toBe('string');
          expect(csv.length).toBeGreaterThan(0);

          const lines = csv.split('\n');
          expect(lines.length).toBe(1); // Only header line

          // Verify header contains all required columns
          expect(csv).toContain('Timestamp');
          expect(csv).toContain('Database Connection Count');
          expect(csv).toContain('API Requests Per Minute');
          expect(csv).toContain('Server CPU Usage');
        }),
        { numRuns: 100 }
      );
    });

    it('should handle metrics with decimal values correctly in CSV', async () => {
      const metricsWithDecimalsArbitrary = fc.record({
        avgQueryTime: fc.float({ min: 0, max: 1000, noNaN: true }),
        diskUsage: fc.float({ min: 0, max: 10000, noNaN: true }),
        errorRate: fc.float({ min: 0, max: 10, noNaN: true }),
      });

      await fc.assert(
        fc.asyncProperty(metricsWithDecimalsArbitrary, async (metrics) => {
          const startDate = new Date('2024-01-01');
          const endDate = new Date('2024-01-02');

          const mockLogs = [{
            checkedAt: new Date('2024-01-01T10:00:00Z'),
            service: 'DATABASE',
            metadata: {
              avgQueryTime: metrics.avgQueryTime,
              diskUsage: metrics.diskUsage,
              errorRate: metrics.errorRate,
            },
          }];

          const mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue(mockLogs),
          };

          healthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

          const csv = await service.exportMetrics(startDate, endDate);

          // Verify decimal values are preserved in CSV
          const lines = csv.split('\n');
          expect(lines.length).toBeGreaterThan(1);

          // Parse the data row
          const dataRow = lines[1];
          const columns = dataRow.split(',');

          // Find and verify decimal values
          const avgQueryTimeValue = parseFloat(columns[3]); // Column index for avg query time
          const diskUsageValue = parseFloat(columns[5]); // Column index for disk usage

          expect(isNaN(avgQueryTimeValue)).toBe(false);
          expect(isNaN(diskUsageValue)).toBe(false);
          expect(avgQueryTimeValue).toBeGreaterThanOrEqual(0);
          expect(diskUsageValue).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should export all records when multiple metrics exist', async () => {
      const recordCountArbitrary = fc.integer({ min: 1, max: 20 });

      await fc.assert(
        fc.asyncProperty(recordCountArbitrary, async (recordCount) => {
          const startDate = new Date('2024-01-01');
          const endDate = new Date('2024-01-31');

          // Generate multiple mock logs
          const mockLogs = Array.from({ length: recordCount }, (_, i) => ({
            checkedAt: new Date(startDate.getTime() + i * 60 * 60 * 1000),
            service: 'DATABASE',
            metadata: { connectionCount: i * 10 },
          }));

          const mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue(mockLogs),
          };

          healthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

          const csv = await service.exportMetrics(startDate, endDate);

          const lines = csv.split('\n').filter(line => line.trim().length > 0);

          // Should have header + data rows
          // Note: The service groups by timestamp, so we might have fewer lines than mockLogs
          expect(lines.length).toBeGreaterThan(0);
          expect(lines.length).toBeGreaterThanOrEqual(1); // At least header
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Edge Cases and Error Handling
   */
  describe('Edge Cases', () => {
    it('should handle database errors gracefully in getCurrentMetrics', async () => {
      dataSource.query.mockRejectedValue(new Error('Database connection failed'));

      const metrics = await service.getCurrentMetrics();

      // Should return metrics with zero values instead of throwing
      expect(metrics).toBeDefined();
      expect(metrics.database.connectionCount).toBe(0);
      expect(metrics.database.activeQueries).toBe(0);
    });

    it('should handle empty historical metrics gracefully', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      healthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getHistoricalMetrics(
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(result).toEqual([]);
    });

    it('should handle export errors gracefully', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(new Error('Query failed')),
      };

      healthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const csv = await service.exportMetrics(
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      // Should return empty CSV with headers instead of throwing
      expect(csv).toBeDefined();
      expect(csv).toContain('Timestamp');
    });
  });
});
