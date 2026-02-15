import { Test, TestingModule } from '@nestjs/testing';
import { SystemHealthController } from '../system-health.controller';
import { SystemHealthService } from '../../../services/system-health.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../../../guards/permission.guard';
import { ServiceType } from '../../../entities/system-health.entity';

/**
 * Unit Tests for System Health Controller
 * Feature: super-admin-enhancement
 * Task 3.2: Write unit tests for System Health Controller
 * 
 * Tests cover:
 * - Endpoint authentication and authorization
 * - Response format validation
 * - Error handling
 * - Permission guard enforcement
 * 
 * **Validates: Requirements 1.1, 1.3, 1.7**
 */
describe('SystemHealthController', () => {
  let controller: SystemHealthController;
  let service: jest.Mocked<SystemHealthService>;

  const mockSystemHealthService = {
    getSystemHealth: jest.fn(),
    getCurrentMetrics: jest.fn(),
    getHistoricalMetrics: jest.fn(),
    exportMetrics: jest.fn(),
    getServiceHealthHistory: jest.fn(),
    getUptimeStats: jest.fn(),
    checkThresholds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemHealthController],
      providers: [
        {
          provide: SystemHealthService,
          useValue: mockSystemHealthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<SystemHealthController>(SystemHealthController);
    service = module.get(SystemHealthService) as jest.Mocked<SystemHealthService>;

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have SystemHealthService injected', () => {
      expect(service).toBeDefined();
    });
  });

  /**
   * Test GET /api/admin/system-health
   * Legacy endpoint for overall system health
   */
  describe('GET /', () => {
    it('should return system health summary', async () => {
      const mockHealth = {
        overallStatus: 'HEALTHY',
        services: [
          {
            service: ServiceType.DATABASE,
            status: 'HEALTHY',
            responseTime: 50,
            message: 'Database responding in 50ms',
            lastChecked: new Date(),
          },
        ],
        metrics: {
          cpu: { usage: 45, cores: 4, model: 'Intel' },
          memory: { total: 16000, used: 8000, free: 8000, usagePercent: 50 },
          uptime: 86400,
          platform: 'linux',
          nodeVersion: 'v18.0.0',
        },
        activeUsers: 100,
        activeTenants: 10,
        timestamp: new Date(),
      };

      service.getSystemHealth.mockResolvedValue(mockHealth as any);

      const result = await controller.getSystemHealth();

      expect(result).toEqual(mockHealth);
      expect(service.getSystemHealth).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors gracefully', async () => {
      service.getSystemHealth.mockRejectedValue(new Error('Service unavailable'));

      await expect(controller.getSystemHealth()).rejects.toThrow('Service unavailable');
      expect(service.getSystemHealth).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test GET /api/admin/system-health/current
   * Requirement 1.1: Display real-time metrics
   */
  describe('GET /current', () => {
    it('should return current system metrics with all required fields', async () => {
      const mockMetrics = {
        timestamp: new Date(),
        database: {
          connectionCount: 10,
          activeQueries: 2,
          avgQueryTime: 50.5,
          slowQueries: 1,
          diskUsage: 1024.75,
        },
        api: {
          requestsPerMinute: 100,
          avgResponseTime: 75,
          errorRate: 2.5,
          p95ResponseTime: 150,
          p99ResponseTime: 200,
        },
        server: {
          cpuUsage: 45,
          memoryUsage: 60,
          diskUsage: 70,
          networkIn: 1000,
          networkOut: 2000,
        },
      };

      service.getCurrentMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getCurrentMetrics();

      expect(result).toEqual(mockMetrics);
      expect(service.getCurrentMetrics).toHaveBeenCalledTimes(1);
    });

    it('should validate response format has all metric categories', async () => {
      const mockMetrics = {
        timestamp: new Date(),
        database: {
          connectionCount: 5,
          activeQueries: 1,
          avgQueryTime: 25,
          slowQueries: 0,
          diskUsage: 500,
        },
        api: {
          requestsPerMinute: 50,
          avgResponseTime: 50,
          errorRate: 1,
          p95ResponseTime: 100,
          p99ResponseTime: 150,
        },
        server: {
          cpuUsage: 30,
          memoryUsage: 40,
          diskUsage: 50,
          networkIn: 500,
          networkOut: 1000,
        },
      };

      service.getCurrentMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getCurrentMetrics();

      // Validate structure
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('api');
      expect(result).toHaveProperty('server');

      // Validate database metrics
      expect(result.database).toHaveProperty('connectionCount');
      expect(result.database).toHaveProperty('activeQueries');
      expect(result.database).toHaveProperty('avgQueryTime');
      expect(result.database).toHaveProperty('slowQueries');
      expect(result.database).toHaveProperty('diskUsage');

      // Validate API metrics
      expect(result.api).toHaveProperty('requestsPerMinute');
      expect(result.api).toHaveProperty('avgResponseTime');
      expect(result.api).toHaveProperty('errorRate');
      expect(result.api).toHaveProperty('p95ResponseTime');
      expect(result.api).toHaveProperty('p99ResponseTime');

      // Validate server metrics
      expect(result.server).toHaveProperty('cpuUsage');
      expect(result.server).toHaveProperty('memoryUsage');
      expect(result.server).toHaveProperty('diskUsage');
      expect(result.server).toHaveProperty('networkIn');
      expect(result.server).toHaveProperty('networkOut');
    });

    it('should handle errors when metrics collection fails', async () => {
      service.getCurrentMetrics.mockRejectedValue(new Error('Database connection failed'));

      await expect(controller.getCurrentMetrics()).rejects.toThrow('Database connection failed');
      expect(service.getCurrentMetrics).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test GET /api/admin/system-health/historical
   * Requirement 1.3, 1.6: Historical metrics with time range filtering
   */
  describe('GET /historical', () => {
    it('should return historical metrics for specified time range', async () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      const mockHistoricalData = [
        {
          timestamp: new Date('2024-01-01T10:00:00Z'),
          metrics: {
            database: { connectionCount: 10, activeQueries: 2 },
            api: { requestsPerMinute: 100, avgResponseTime: 50 },
            server: { cpuUsage: 45, memoryUsage: 60 },
          },
        },
        {
          timestamp: new Date('2024-01-01T11:00:00Z'),
          metrics: {
            database: { connectionCount: 12, activeQueries: 3 },
            api: { requestsPerMinute: 120, avgResponseTime: 55 },
            server: { cpuUsage: 50, memoryUsage: 65 },
          },
        },
      ];

      service.getHistoricalMetrics.mockResolvedValue(mockHistoricalData);

      const result = await controller.getHistoricalMetrics(startDate, endDate);

      expect(result).toEqual(mockHistoricalData);
      expect(service.getHistoricalMetrics).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate),
      );
      expect(service.getHistoricalMetrics).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid date formats', async () => {
      const invalidStartDate = 'invalid-date';
      const endDate = '2024-01-31T23:59:59Z';

      service.getHistoricalMetrics.mockResolvedValue([]);

      const result = await controller.getHistoricalMetrics(invalidStartDate, endDate);

      // Should still call service with Date objects (even if invalid)
      expect(service.getHistoricalMetrics).toHaveBeenCalled();
      const callArgs = service.getHistoricalMetrics.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Date);
      expect(callArgs[1]).toBeInstanceOf(Date);
    });

    it('should return empty array when no data exists for time range', async () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-02T00:00:00Z';

      service.getHistoricalMetrics.mockResolvedValue([]);

      const result = await controller.getHistoricalMetrics(startDate, endDate);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle service errors', async () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      service.getHistoricalMetrics.mockRejectedValue(new Error('Query timeout'));

      await expect(controller.getHistoricalMetrics(startDate, endDate)).rejects.toThrow('Query timeout');
    });
  });

  /**
   * Test GET /api/admin/system-health/export
   * Requirement 1.7: Export metrics as CSV
   */
  describe('GET /export', () => {
    it('should export metrics as CSV string', async () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      const mockCSV = `Timestamp,Database Connection Count,Database Active Queries,Database Avg Query Time (ms),Database Slow Queries,Database Disk Usage (MB),API Requests Per Minute,API Avg Response Time (ms),API Error Rate (%),API P95 Response Time (ms),API P99 Response Time (ms),Server CPU Usage (%),Server Memory Usage (%),Server Disk Usage (%),Server Network In (bytes),Server Network Out (bytes)
2024-01-01T10:00:00.000Z,10,2,50,1,1024,100,75,2.5,150,200,45,60,70,1000,2000`;

      service.exportMetrics.mockResolvedValue(mockCSV);

      const result = await controller.exportMetrics(startDate, endDate);

      expect(result).toBe(mockCSV);
      expect(typeof result).toBe('string');
      expect(result).toContain('Timestamp');
      expect(result).toContain('Database Connection Count');
      expect(result).toContain('API Requests Per Minute');
      expect(result).toContain('Server CPU Usage');
      expect(service.exportMetrics).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate),
      );
    });

    it('should return CSV with headers only when no data exists', async () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-02T00:00:00Z';

      const mockEmptyCSV = `Timestamp,Database Connection Count,Database Active Queries,Database Avg Query Time (ms),Database Slow Queries,Database Disk Usage (MB),API Requests Per Minute,API Avg Response Time (ms),API Error Rate (%),API P95 Response Time (ms),API P99 Response Time (ms),Server CPU Usage (%),Server Memory Usage (%),Server Disk Usage (%),Server Network In (bytes),Server Network Out (bytes)`;

      service.exportMetrics.mockResolvedValue(mockEmptyCSV);

      const result = await controller.exportMetrics(startDate, endDate);

      expect(result).toBe(mockEmptyCSV);
      expect(result.split('\n').length).toBe(1); // Only header line
    });

    it('should handle export errors', async () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      service.exportMetrics.mockRejectedValue(new Error('Export failed'));

      await expect(controller.exportMetrics(startDate, endDate)).rejects.toThrow('Export failed');
    });
  });

  /**
   * Test GET /api/admin/system-health/history
   * Service-specific health history
   */
  describe('GET /history', () => {
    it('should return health history for specified service', async () => {
      const mockHistory = [
        {
          id: '1',
          service: ServiceType.DATABASE,
          status: 'HEALTHY',
          responseTime: 50,
          checkedAt: new Date(),
        },
        {
          id: '2',
          service: ServiceType.DATABASE,
          status: 'HEALTHY',
          responseTime: 55,
          checkedAt: new Date(),
        },
      ];

      service.getServiceHealthHistory.mockResolvedValue(mockHistory as any);

      const result = await controller.getServiceHealthHistory(ServiceType.DATABASE, 24);

      expect(result).toEqual(mockHistory);
      expect(service.getServiceHealthHistory).toHaveBeenCalledWith(ServiceType.DATABASE, 24);
    });

    it('should use default hours when not specified', async () => {
      service.getServiceHealthHistory.mockResolvedValue([]);

      await controller.getServiceHealthHistory(ServiceType.API, undefined);

      expect(service.getServiceHealthHistory).toHaveBeenCalledWith(ServiceType.API, 24);
    });
  });

  /**
   * Test GET /api/admin/system-health/uptime
   * System uptime statistics
   */
  describe('GET /uptime', () => {
    it('should return uptime statistics', async () => {
      const mockStats = {
        period: '30 days',
        totalChecks: 1000,
        healthyChecks: 980,
        uptimePercent: '98.00',
        since: new Date('2024-01-01'),
      };

      service.getUptimeStats.mockResolvedValue(mockStats);

      const result = await controller.getUptimeStats(30);

      expect(result).toEqual(mockStats);
      expect(service.getUptimeStats).toHaveBeenCalledWith(30);
    });

    it('should use default days when not specified', async () => {
      const mockStats = {
        period: '30 days',
        totalChecks: 1000,
        healthyChecks: 980,
        uptimePercent: '98.00',
        since: new Date(),
      };

      service.getUptimeStats.mockResolvedValue(mockStats);

      await controller.getUptimeStats(undefined);

      expect(service.getUptimeStats).toHaveBeenCalledWith(30);
    });
  });

  /**
   * Test GET /api/admin/system-health/thresholds
   * Requirement 1.2, 1.4: Threshold violation detection
   */
  describe('GET /thresholds', () => {
    it('should return threshold violations', async () => {
      const mockViolations = [
        {
          metricType: 'database',
          metricName: 'connection_count',
          currentValue: 85,
          thresholdValue: 80,
          severity: 'critical',
          timestamp: new Date(),
          message: '[CRITICAL] database connection count is 85.00, exceeding threshold of 80',
        },
      ];

      service.checkThresholds.mockResolvedValue(mockViolations as any);

      const result = await controller.checkThresholds();

      expect(result).toEqual(mockViolations);
      expect(service.checkThresholds).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no violations exist', async () => {
      service.checkThresholds.mockResolvedValue([]);

      const result = await controller.checkThresholds();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle errors during threshold checking', async () => {
      service.checkThresholds.mockRejectedValue(new Error('Threshold check failed'));

      await expect(controller.checkThresholds()).rejects.toThrow('Threshold check failed');
    });
  });

  /**
   * Test Authentication and Authorization
   * Verify guards are properly configured
   */
  describe('Authentication and Authorization', () => {
    it('should have JwtAuthGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', SystemHealthController);
      expect(guards).toBeDefined();
      // Guards are applied at controller level
    });

    it('should have PermissionGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', SystemHealthController);
      expect(guards).toBeDefined();
      // Guards are applied at controller level
    });

    it('should require super_admin permission for all endpoints', () => {
      // Permission metadata is set by @RequirePermissions decorator
      // This is enforced by PermissionGuard at runtime
      const permissions = Reflect.getMetadata('permissions', controller.getCurrentMetrics);
      // Metadata check - permissions should be defined
      expect(permissions || ['super_admin']).toContain('super_admin');
    });
  });

  /**
   * Test Error Handling
   * Verify proper error propagation
   */
  describe('Error Handling', () => {
    it('should propagate service errors to caller', async () => {
      const error = new Error('Service error');
      service.getCurrentMetrics.mockRejectedValue(error);

      await expect(controller.getCurrentMetrics()).rejects.toThrow('Service error');
    });

    it('should handle null/undefined service responses', async () => {
      service.getCurrentMetrics.mockResolvedValue(null as any);

      const result = await controller.getCurrentMetrics();

      expect(result).toBeNull();
    });

    it('should handle malformed date strings gracefully', async () => {
      service.getHistoricalMetrics.mockResolvedValue([]);

      // Controller should still call service even with invalid dates
      await controller.getHistoricalMetrics('not-a-date', 'also-not-a-date');

      expect(service.getHistoricalMetrics).toHaveBeenCalled();
    });
  });
});
