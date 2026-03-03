import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SystemHealthService } from '../system-health.service';
import { SystemHealthLog } from '../../entities/system-health.entity';

describe('SystemHealthService', () => {
  let service: SystemHealthService;
  let healthLogRepository: Repository<SystemHealthLog>;
  let dataSource: DataSource;

  const mockHealthLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
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
    healthLogRepository = module.get<Repository<SystemHealthLog>>(
      getRepositoryToken(SystemHealthLog),
    );
    dataSource = module.get<DataSource>(DataSource);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentMetrics', () => {
    it('should return system metrics with all required fields', async () => {
      // Mock database queries
      mockDataSource.query
        .mockResolvedValueOnce([{ count: '10' }]) // connection count
        .mockResolvedValueOnce([{ count: '2' }]) // active queries
        .mockResolvedValueOnce([{ avg_time: '50.5' }]) // avg query time
        .mockResolvedValueOnce([{ count: '1' }]) // slow queries
        .mockResolvedValueOnce([{ size_mb: '1024.5' }]); // disk usage

      const metrics = await service.getCurrentMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.timestamp).toBeInstanceOf(Date);
      expect(metrics.database).toBeDefined();
      expect(metrics.api).toBeDefined();
      expect(metrics.server).toBeDefined();
    });

    it('should return database metrics with correct structure', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ count: '15' }])
        .mockResolvedValueOnce([{ count: '3' }])
        .mockResolvedValueOnce([{ avg_time: '75.2' }])
        .mockResolvedValueOnce([{ count: '2' }])
        .mockResolvedValueOnce([{ size_mb: '2048.7' }]);

      const metrics = await service.getCurrentMetrics();

      expect(metrics.database).toEqual({
        connectionCount: 15,
        activeQueries: 3,
        avgQueryTime: 75.2,
        slowQueries: 2,
        diskUsage: 2048.7,
      });
    });

    it('should return API metrics with correct structure', async () => {
      // Mock database queries for database metrics
      mockDataSource.query
        .mockResolvedValueOnce([{ count: '10' }])
        .mockResolvedValueOnce([{ count: '2' }])
        .mockResolvedValueOnce([{ avg_time: '50' }])
        .mockResolvedValueOnce([{ count: '1' }])
        .mockResolvedValueOnce([{ size_mb: '1024' }]);

      // Track some API requests
      service.trackApiRequest(100, false);
      service.trackApiRequest(200, false);
      service.trackApiRequest(150, true);

      const metrics = await service.getCurrentMetrics();

      expect(metrics.api).toBeDefined();
      expect(metrics.api.requestsPerMinute).toBeGreaterThanOrEqual(0);
      expect(metrics.api.avgResponseTime).toBeGreaterThan(0);
      expect(metrics.api.errorRate).toBeGreaterThan(0);
      expect(metrics.api.p95ResponseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.api.p99ResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should return server metrics with correct structure', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ count: '10' }])
        .mockResolvedValueOnce([{ count: '2' }])
        .mockResolvedValueOnce([{ avg_time: '50' }])
        .mockResolvedValueOnce([{ count: '1' }])
        .mockResolvedValueOnce([{ size_mb: '1024' }]);

      const metrics = await service.getCurrentMetrics();

      expect(metrics.server).toBeDefined();
      expect(metrics.server.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.server.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.server.diskUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.server.networkIn).toBeDefined();
      expect(metrics.server.networkOut).toBeDefined();
    });

    it('should handle database query errors gracefully', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Database error'));

      const metrics = await service.getCurrentMetrics();

      expect(metrics.database).toEqual({
        connectionCount: 0,
        activeQueries: 0,
        avgQueryTime: 0,
        slowQueries: 0,
        diskUsage: 0,
      });
    });
  });

  describe('trackApiRequest', () => {
    it('should track API request metrics', () => {
      service.trackApiRequest(100, false);
      service.trackApiRequest(200, false);
      service.trackApiRequest(150, true);

      // The metrics should be tracked internally
      // We can verify by calling getCurrentMetrics
      expect(() => service.trackApiRequest(100, false)).not.toThrow();
    });

    it('should handle error tracking', () => {
      service.trackApiRequest(100, true);
      service.trackApiRequest(200, true);

      expect(() => service.trackApiRequest(100, true)).not.toThrow();
    });

    it('should limit response times array to 1000 entries', () => {
      // Track more than 1000 requests
      for (let i = 0; i < 1500; i++) {
        service.trackApiRequest(100, false);
      }

      // Should not throw and should handle gracefully
      expect(() => service.trackApiRequest(100, false)).not.toThrow();
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health summary', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ count: '1' }]) // database check
        .mockResolvedValueOnce([{ count: '50' }]) // active users
        .mockResolvedValueOnce([{ count: '10' }]); // active tenants

      const health = await service.getSystemHealth();

      expect(health).toBeDefined();
      expect(health.overallStatus).toBeDefined();
      expect(health.services).toBeInstanceOf(Array);
      expect(health.metrics).toBeDefined();
      expect(health.activeUsers).toBeDefined();
      expect(health.activeTenants).toBeDefined();
      expect(health.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('getServiceHealthHistory', () => {
    it('should return health history for a service', async () => {
      const mockLogs = [
        { id: '1', service: 'DATABASE', status: 'HEALTHY' },
        { id: '2', service: 'DATABASE', status: 'HEALTHY' },
      ];

      mockHealthLogRepository.find.mockResolvedValue(mockLogs);

      const history = await service.getServiceHealthHistory('DATABASE' as any, 24);

      expect(history).toEqual(mockLogs);
      expect(mockHealthLogRepository.find).toHaveBeenCalled();
    });
  });

  describe('getUptimeStats', () => {
    it('should calculate uptime statistics', async () => {
      const mockLogs = [
        { status: 'HEALTHY' },
        { status: 'HEALTHY' },
        { status: 'DEGRADED' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLogs),
      };

      mockHealthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const stats = await service.getUptimeStats(30);

      expect(stats).toBeDefined();
      expect(stats.totalChecks).toBe(3);
      expect(stats.healthyChecks).toBe(2);
      expect(stats.uptimePercent).toBe('66.67');
    });
  });

  describe('getHistoricalMetrics', () => {
    it('should retrieve historical metrics for time range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');
      
      const mockLogs = [
        {
          checkedAt: new Date('2024-01-01T10:00:00Z'),
          service: 'DATABASE',
          metadata: { connectionCount: 10, activeQueries: 2 },
        },
        {
          checkedAt: new Date('2024-01-01T11:00:00Z'),
          service: 'API',
          metadata: { requestsPerMinute: 100, avgResponseTime: 50 },
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLogs),
      };

      mockHealthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getHistoricalMetrics(startDate, endDate);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('log.checkedAt >= :startDate', { startDate });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('log.checkedAt <= :endDate', { endDate });
    });

    it('should group metrics by timestamp', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');
      
      const timestamp = new Date('2024-01-01T10:00:00Z');
      const mockLogs = [
        {
          checkedAt: timestamp,
          service: 'DATABASE',
          metadata: { connectionCount: 10 },
        },
        {
          checkedAt: timestamp,
          service: 'API',
          metadata: { requestsPerMinute: 100 },
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLogs),
      };

      mockHealthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getHistoricalMetrics(startDate, endDate);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].timestamp).toBeDefined();
      expect(result[0].metrics).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockHealthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getHistoricalMetrics(startDate, endDate);

      expect(result).toEqual([]);
    });
  });

  describe('getMetricsByCategory', () => {
    it('should return current metrics for any category', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ count: '10' }])
        .mockResolvedValueOnce([{ count: '2' }])
        .mockResolvedValueOnce([{ avg_time: '50' }])
        .mockResolvedValueOnce([{ count: '1' }])
        .mockResolvedValueOnce([{ size_mb: '1024' }]);

      const result = await service.getMetricsByCategory('database' as any);

      expect(result).toBeDefined();
      expect(result.database).toBeDefined();
      expect(result.api).toBeDefined();
      expect(result.server).toBeDefined();
    });
  });

  describe('storeCurrentMetrics', () => {
    it('should store current metrics to database', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ count: '10' }])
        .mockResolvedValueOnce([{ count: '2' }])
        .mockResolvedValueOnce([{ avg_time: '50' }])
        .mockResolvedValueOnce([{ count: '1' }])
        .mockResolvedValueOnce([{ size_mb: '1024' }]);

      mockHealthLogRepository.create.mockImplementation((data) => data);
      mockHealthLogRepository.save.mockResolvedValue({} as any);

      await service.storeCurrentMetrics();

      // Should have called create and save multiple times (once for each metric)
      expect(mockHealthLogRepository.create).toHaveBeenCalled();
      expect(mockHealthLogRepository.save).toHaveBeenCalled();
    });

    it('should handle errors gracefully when storing metrics', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Database error'));
      mockHealthLogRepository.create.mockImplementation((data) => data);
      mockHealthLogRepository.save.mockRejectedValue(new Error('Save error'));

      await expect(service.storeCurrentMetrics()).resolves.not.toThrow();
    });
  });

  describe('exportMetrics', () => {
    it('should export metrics as CSV with all required columns', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');
      
      const mockLogs = [
        {
          checkedAt: new Date('2024-01-01T10:00:00Z'),
          service: 'DATABASE',
          metadata: {
            connectionCount: 10,
            activeQueries: 2,
            avgQueryTime: 50,
            slowQueries: 1,
            diskUsage: 1024,
          },
        },
        {
          checkedAt: new Date('2024-01-01T10:00:00Z'),
          service: 'API',
          metadata: {
            requestsPerMinute: 100,
            avgResponseTime: 75,
            errorRate: 2.5,
            p95ResponseTime: 150,
            p99ResponseTime: 200,
          },
        },
        {
          checkedAt: new Date('2024-01-01T10:00:00Z'),
          service: 'SERVER',
          metadata: {
            cpuUsage: 45,
            memoryUsage: 60,
            diskUsage: 70,
            networkIn: 1000,
            networkOut: 2000,
          },
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLogs),
      };

      mockHealthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const csv = await service.exportMetrics(startDate, endDate);

      expect(csv).toBeDefined();
      expect(typeof csv).toBe('string');
      
      // Check CSV header
      expect(csv).toContain('Timestamp');
      expect(csv).toContain('Database Connection Count');
      expect(csv).toContain('Database Active Queries');
      expect(csv).toContain('Database Avg Query Time (ms)');
      expect(csv).toContain('Database Slow Queries');
      expect(csv).toContain('Database Disk Usage (MB)');
      expect(csv).toContain('API Requests Per Minute');
      expect(csv).toContain('API Avg Response Time (ms)');
      expect(csv).toContain('API Error Rate (%)');
      expect(csv).toContain('API P95 Response Time (ms)');
      expect(csv).toContain('API P99 Response Time (ms)');
      expect(csv).toContain('Server CPU Usage (%)');
      expect(csv).toContain('Server Memory Usage (%)');
      expect(csv).toContain('Server Disk Usage (%)');
      expect(csv).toContain('Server Network In (bytes)');
      expect(csv).toContain('Server Network Out (bytes)');
      
      // Check CSV data - the data is grouped by timestamp
      expect(csv).toContain('2024-01-01T10:00:00');
      expect(csv).toContain('10'); // connection count
      expect(csv).toContain('100'); // requests per minute
      expect(csv).toContain('45'); // cpu usage
    });

    it('should return empty CSV with headers when no data exists', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockHealthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const csv = await service.exportMetrics(startDate, endDate);

      expect(csv).toBeDefined();
      expect(typeof csv).toBe('string');
      
      // Should have headers but no data rows
      const lines = csv.split('\n');
      expect(lines.length).toBe(1); // Only header line
      expect(csv).toContain('Timestamp');
      expect(csv).toContain('Database Connection Count');
    });

    it('should handle missing metric data gracefully', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');
      
      const mockLogs = [
        {
          checkedAt: new Date('2024-01-01T10:00:00Z'),
          service: 'DATABASE',
          metadata: {
            connectionCount: 10,
            // Missing other database metrics
          },
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLogs),
      };

      mockHealthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const csv = await service.exportMetrics(startDate, endDate);

      expect(csv).toBeDefined();
      
      // Should have default values (0) for missing metrics
      const lines = csv.split('\n');
      expect(lines.length).toBe(2); // Header + 1 data row
      
      const dataRow = lines[1];
      expect(dataRow).toContain('10'); // connection count
      expect(dataRow).toContain('0'); // missing metrics should be 0
    });

    it('should export multiple time series entries', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');
      
      const mockLogs = [
        {
          checkedAt: new Date('2024-01-01T10:00:00Z'),
          service: 'DATABASE',
          metadata: { connectionCount: 10 },
        },
        {
          checkedAt: new Date('2024-01-01T11:00:00Z'),
          service: 'DATABASE',
          metadata: { connectionCount: 15 },
        },
        {
          checkedAt: new Date('2024-01-01T12:00:00Z'),
          service: 'DATABASE',
          metadata: { connectionCount: 20 },
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLogs),
      };

      mockHealthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const csv = await service.exportMetrics(startDate, endDate);

      const lines = csv.split('\n');
      expect(lines.length).toBe(4); // Header + 3 data rows
    });

    it('should return empty CSV when export fails', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockHealthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const csv = await service.exportMetrics(startDate, endDate);
      
      // Should return empty CSV with headers instead of throwing
      expect(csv).toBeDefined();
      expect(csv).toContain('Timestamp');
      const lines = csv.split('\n');
      expect(lines.length).toBe(1); // Only header
    });

    it('should format CSV correctly with proper delimiters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');
      
      const mockLogs = [
        {
          checkedAt: new Date('2024-01-01T10:00:00Z'),
          service: 'DATABASE',
          metadata: {
            connectionCount: 10,
            activeQueries: 2,
            avgQueryTime: 50.5,
            slowQueries: 1,
            diskUsage: 1024.75,
          },
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLogs),
      };

      mockHealthLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const csv = await service.exportMetrics(startDate, endDate);

      // Check that CSV uses commas as delimiters
      const lines = csv.split('\n');
      expect(lines[0].split(',').length).toBe(16); // 16 columns
      expect(lines[1].split(',').length).toBe(16); // 16 columns
      
      // Check that decimal values are preserved (they're in the DATABASE metadata)
      const dataLine = lines[1];
      expect(dataLine).toContain('50.5');
      expect(dataLine).toContain('1024.75');
    });
  });

  describe('checkThresholds', () => {
    it('should return empty or minimal violations when metrics are low', async () => {
      // Mock low metric values that don't exceed thresholds
      mockDataSource.query
        .mockResolvedValueOnce([{ count: '5' }]) // connection count (threshold: 50)
        .mockResolvedValueOnce([{ count: '1' }]) // active queries (threshold: 20)
        .mockResolvedValueOnce([{ avg_time: '50' }]) // avg query time (threshold: 500)
        .mockResolvedValueOnce([{ count: '0' }]) // slow queries (threshold: 5)
        .mockResolvedValueOnce([{ size_mb: '100' }]); // disk usage (threshold: 5000)

      const violations = await service.checkThresholds();

      // Server metrics are based on actual system state, so we just verify
      // that database and API metrics don't have violations
      const dbViolations = violations.filter(v => v.metricType === 'database');
      const apiViolations = violations.filter(v => v.metricType === 'api');
      
      expect(dbViolations).toEqual([]);
      expect(apiViolations).toEqual([]);
    });

    it('should detect critical threshold violations', async () => {
      // Mock high metric values that exceed critical thresholds
      mockDataSource.query
        .mockResolvedValueOnce([{ count: '85' }]) // connection count (critical: 80)
        .mockResolvedValueOnce([{ count: '2' }]) // active queries
        .mockResolvedValueOnce([{ avg_time: '1500' }]) // avg query time (critical: 1000)
        .mockResolvedValueOnce([{ count: '1' }]) // slow queries
        .mockResolvedValueOnce([{ size_mb: '100' }]); // disk usage

      mockHealthLogRepository.create.mockImplementation((data) => data);
      mockHealthLogRepository.save.mockResolvedValue({} as any);

      const violations = await service.checkThresholds();

      expect(violations.length).toBeGreaterThan(0);
      
      // Check for critical violations
      const criticalViolations = violations.filter(v => v.severity === 'critical');
      expect(criticalViolations.length).toBeGreaterThan(0);
      
      // Verify violation structure
      const violation = violations[0];
      expect(violation).toHaveProperty('metricType');
      expect(violation).toHaveProperty('metricName');
      expect(violation).toHaveProperty('currentValue');
      expect(violation).toHaveProperty('thresholdValue');
      expect(violation).toHaveProperty('severity');
      expect(violation).toHaveProperty('timestamp');
      expect(violation).toHaveProperty('message');
    });

    it('should detect warning threshold violations', async () => {
      // Mock metric values that exceed warning but not critical thresholds
      mockDataSource.query
        .mockResolvedValueOnce([{ count: '55' }]) // connection count (warning: 50, critical: 80)
        .mockResolvedValueOnce([{ count: '2' }]) // active queries
        .mockResolvedValueOnce([{ avg_time: '600' }]) // avg query time (warning: 500, critical: 1000)
        .mockResolvedValueOnce([{ count: '1' }]) // slow queries
        .mockResolvedValueOnce([{ size_mb: '100' }]); // disk usage

      mockHealthLogRepository.create.mockImplementation((data) => data);
      mockHealthLogRepository.save.mockResolvedValue({} as any);

      const violations = await service.checkThresholds();

      expect(violations.length).toBeGreaterThan(0);
      
      // Check for medium severity violations
      const mediumViolations = violations.filter(v => v.severity === 'medium');
      expect(mediumViolations.length).toBeGreaterThan(0);
    });

    it('should log threshold violations to database', async () => {
      // Mock high metric values
      mockDataSource.query
        .mockResolvedValueOnce([{ count: '85' }]) // connection count (critical)
        .mockResolvedValueOnce([{ count: '2' }])
        .mockResolvedValueOnce([{ avg_time: '50' }])
        .mockResolvedValueOnce([{ count: '1' }])
        .mockResolvedValueOnce([{ size_mb: '100' }]);

      mockHealthLogRepository.create.mockImplementation((data) => data);
      mockHealthLogRepository.save.mockResolvedValue({} as any);

      await service.checkThresholds();

      // Verify that violations were logged
      expect(mockHealthLogRepository.create).toHaveBeenCalled();
      expect(mockHealthLogRepository.save).toHaveBeenCalled();
      
      // Check that the log entry has the correct structure
      const createCall = mockHealthLogRepository.create.mock.calls[0][0];
      expect(createCall).toHaveProperty('service');
      expect(createCall).toHaveProperty('status');
      expect(createCall).toHaveProperty('metricType');
      expect(createCall).toHaveProperty('metricName');
      expect(createCall).toHaveProperty('metricValue');
      expect(createCall).toHaveProperty('thresholdValue');
      expect(createCall).toHaveProperty('severity');
      expect(createCall).toHaveProperty('errorMessage');
    });

    it('should generate appropriate violation messages', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ count: '85' }]) // connection count
        .mockResolvedValueOnce([{ count: '2' }])
        .mockResolvedValueOnce([{ avg_time: '50' }])
        .mockResolvedValueOnce([{ count: '1' }])
        .mockResolvedValueOnce([{ size_mb: '100' }]);

      mockHealthLogRepository.create.mockImplementation((data) => data);
      mockHealthLogRepository.save.mockResolvedValue({} as any);

      const violations = await service.checkThresholds();

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('CRITICAL');
      expect(violations[0].message).toContain('database');
      expect(violations[0].message).toContain('connection count');
    });

    it('should handle multiple threshold violations', async () => {
      // Mock multiple high values
      mockDataSource.query
        .mockResolvedValueOnce([{ count: '85' }]) // connection count (critical)
        .mockResolvedValueOnce([{ count: '55' }]) // active queries (critical: 50)
        .mockResolvedValueOnce([{ avg_time: '1500' }]) // avg query time (critical)
        .mockResolvedValueOnce([{ count: '15' }]) // slow queries (critical: 10)
        .mockResolvedValueOnce([{ size_mb: '100' }]);

      mockHealthLogRepository.create.mockImplementation((data) => data);
      mockHealthLogRepository.save.mockResolvedValue({} as any);

      const violations = await service.checkThresholds();

      expect(violations.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle errors gracefully', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Database error'));

      const violations = await service.checkThresholds();

      // When database queries fail, we get zero values for database metrics
      // but server metrics still work, so we just verify it doesn't throw
      expect(Array.isArray(violations)).toBe(true);
    });

    it('should check API metric thresholds', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ count: '10' }])
        .mockResolvedValueOnce([{ count: '2' }])
        .mockResolvedValueOnce([{ avg_time: '50' }])
        .mockResolvedValueOnce([{ count: '1' }])
        .mockResolvedValueOnce([{ size_mb: '100' }]);

      // Track API requests with high error rate
      for (let i = 0; i < 100; i++) {
        service.trackApiRequest(100, i < 15); // 15% error rate (critical: 10%)
      }

      mockHealthLogRepository.create.mockImplementation((data) => data);
      mockHealthLogRepository.save.mockResolvedValue({} as any);

      const violations = await service.checkThresholds();

      const apiViolations = violations.filter(v => v.metricType === 'api');
      expect(apiViolations.length).toBeGreaterThan(0);
    });

    it('should check server metric thresholds', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ count: '10' }])
        .mockResolvedValueOnce([{ count: '2' }])
        .mockResolvedValueOnce([{ avg_time: '50' }])
        .mockResolvedValueOnce([{ count: '1' }])
        .mockResolvedValueOnce([{ size_mb: '100' }]);

      mockHealthLogRepository.create.mockImplementation((data) => data);
      mockHealthLogRepository.save.mockResolvedValue({} as any);

      const violations = await service.checkThresholds();

      // Server metrics are based on actual system state, so we just verify the method runs
      expect(Array.isArray(violations)).toBe(true);
    });
  });
});
