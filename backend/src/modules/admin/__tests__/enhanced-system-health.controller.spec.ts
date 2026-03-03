import { Test, TestingModule } from '@nestjs/testing';
import { EnhancedSystemHealthController } from '../enhanced-system-health.controller';
import { EnhancedSystemHealthService, MetricCategory } from '../../../services/enhanced-system-health.service';
import { UnauthorizedException } from '@nestjs/common';

describe('EnhancedSystemHealthController', () => {
  let controller: EnhancedSystemHealthController;
  let service: jest.Mocked<EnhancedSystemHealthService>;

  const mockSystemMetrics = {
    timestamp: new Date('2024-02-15T10:00:00Z'),
    database: {
      connectionCount: 25,
      activeQueries: 5,
      avgQueryTime: 45.2,
      slowQueries: 2,
      diskUsage: 1073741824,
    },
    api: {
      requestsPerMinute: 150,
      avgResponseTime: 125.5,
      errorRate: 0.5,
      p95ResponseTime: 250,
      p99ResponseTime: 500,
    },
    server: {
      cpuUsage: 45.2,
      memoryUsage: 62.8,
      diskUsage: 0,
      networkIn: 0,
      networkOut: 0,
    },
  };

  const mockHistoricalMetrics = [
    {
      timestamp: new Date('2024-02-15T09:00:00Z'),
      metricType: 'DATABASE',
      metricName: 'avgQueryTime',
      value: 42.5,
    },
    {
      timestamp: new Date('2024-02-15T10:00:00Z'),
      metricType: 'DATABASE',
      metricName: 'avgQueryTime',
      value: 45.2,
    },
  ];

  const mockThresholdViolations = [
    {
      metricType: 'SERVER',
      metricName: 'cpuUsage',
      currentValue: 92.5,
      thresholdValue: 90,
      severity: 'critical' as const,
      timestamp: new Date('2024-02-15T10:00:00Z'),
    },
  ];

  beforeEach(async () => {
    const mockService = {
      getCurrentMetrics: jest.fn(),
      getHistoricalMetrics: jest.fn(),
      getMetricsByCategory: jest.fn(),
      checkThresholds: jest.fn(),
      exportMetrics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnhancedSystemHealthController],
      providers: [
        {
          provide: EnhancedSystemHealthService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<EnhancedSystemHealthController>(EnhancedSystemHealthController);
    service = module.get(EnhancedSystemHealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentMetrics', () => {
    it('should return current system metrics', async () => {
      service.getCurrentMetrics.mockResolvedValue(mockSystemMetrics);

      const result = await controller.getCurrentMetrics();

      expect(result).toEqual(mockSystemMetrics);
      expect(service.getCurrentMetrics).toHaveBeenCalledTimes(1);
    });

    it('should return metrics with all required fields', async () => {
      service.getCurrentMetrics.mockResolvedValue(mockSystemMetrics);

      const result = await controller.getCurrentMetrics();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('api');
      expect(result).toHaveProperty('server');
      expect(result.database).toHaveProperty('connectionCount');
      expect(result.database).toHaveProperty('activeQueries');
      expect(result.database).toHaveProperty('avgQueryTime');
      expect(result.api).toHaveProperty('requestsPerMinute');
      expect(result.api).toHaveProperty('avgResponseTime');
      expect(result.server).toHaveProperty('cpuUsage');
      expect(result.server).toHaveProperty('memoryUsage');
    });

    it('should handle service errors gracefully', async () => {
      service.getCurrentMetrics.mockRejectedValue(new Error('Database connection failed'));

      await expect(controller.getCurrentMetrics()).rejects.toThrow('Database connection failed');
    });
  });

  describe('getHistoricalMetrics', () => {
    it('should return historical metrics for date range', async () => {
      service.getHistoricalMetrics.mockResolvedValue(mockHistoricalMetrics);

      const result = await controller.getHistoricalMetrics(
        '2024-02-01T00:00:00Z',
        '2024-02-15T23:59:59Z'
      );

      expect(result).toEqual(mockHistoricalMetrics);
      expect(service.getHistoricalMetrics).toHaveBeenCalledWith(
        new Date('2024-02-01T00:00:00Z'),
        new Date('2024-02-15T23:59:59Z')
      );
    });

    it('should handle invalid date formats', async () => {
      const result = await controller.getHistoricalMetrics(
        'invalid-date',
        '2024-02-15T23:59:59Z'
      );

      // Should still call service with parsed dates (even if invalid)
      expect(service.getHistoricalMetrics).toHaveBeenCalled();
    });

    it('should return empty array when no data exists', async () => {
      service.getHistoricalMetrics.mockResolvedValue([]);

      const result = await controller.getHistoricalMetrics(
        '2024-01-01T00:00:00Z',
        '2024-01-02T00:00:00Z'
      );

      expect(result).toEqual([]);
    });
  });

  describe('getMetricsByCategory', () => {
    it('should return metrics for DATABASE category', async () => {
      const databaseMetrics = {
        timestamp: mockSystemMetrics.timestamp,
        database: mockSystemMetrics.database,
      };
      service.getMetricsByCategory.mockResolvedValue(databaseMetrics as any);

      const result = await controller.getMetricsByCategory(MetricCategory.DATABASE);

      expect(result).toEqual(databaseMetrics);
      expect(service.getMetricsByCategory).toHaveBeenCalledWith(MetricCategory.DATABASE);
    });

    it('should return metrics for API category', async () => {
      const apiMetrics = {
        timestamp: mockSystemMetrics.timestamp,
        api: mockSystemMetrics.api,
      };
      service.getMetricsByCategory.mockResolvedValue(apiMetrics as any);

      const result = await controller.getMetricsByCategory(MetricCategory.API);

      expect(result).toEqual(apiMetrics);
      expect(service.getMetricsByCategory).toHaveBeenCalledWith(MetricCategory.API);
    });

    it('should return metrics for SERVER category', async () => {
      const serverMetrics = {
        timestamp: mockSystemMetrics.timestamp,
        server: mockSystemMetrics.server,
      };
      service.getMetricsByCategory.mockResolvedValue(serverMetrics as any);

      const result = await controller.getMetricsByCategory(MetricCategory.SERVER);

      expect(result).toEqual(serverMetrics);
      expect(service.getMetricsByCategory).toHaveBeenCalledWith(MetricCategory.SERVER);
    });
  });

  describe('checkThresholds', () => {
    it('should return threshold violations', async () => {
      service.checkThresholds.mockResolvedValue(mockThresholdViolations);

      const result = await controller.checkThresholds();

      expect(result).toEqual(mockThresholdViolations);
      expect(service.checkThresholds).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no violations exist', async () => {
      service.checkThresholds.mockResolvedValue([]);

      const result = await controller.checkThresholds();

      expect(result).toEqual([]);
    });

    it('should return violations with correct severity levels', async () => {
      service.checkThresholds.mockResolvedValue(mockThresholdViolations);

      const result = await controller.checkThresholds();

      result.forEach(violation => {
        expect(['low', 'medium', 'high', 'critical']).toContain(violation.severity);
        expect(violation).toHaveProperty('metricType');
        expect(violation).toHaveProperty('metricName');
        expect(violation).toHaveProperty('currentValue');
        expect(violation).toHaveProperty('thresholdValue');
        expect(violation).toHaveProperty('timestamp');
      });
    });
  });

  describe('exportMetrics', () => {
    it('should return CSV formatted metrics', async () => {
      const csvData = 'Timestamp,Metric Type,Metric Name,Value\n2024-02-15T10:00:00Z,DATABASE,avgQueryTime,45.2\n';
      service.exportMetrics.mockResolvedValue(csvData);

      const result = await controller.exportMetrics(
        '2024-02-01T00:00:00Z',
        '2024-02-15T23:59:59Z'
      );

      expect(result).toBe(csvData);
      expect(service.exportMetrics).toHaveBeenCalledWith(
        new Date('2024-02-01T00:00:00Z'),
        new Date('2024-02-15T23:59:59Z')
      );
    });

    it('should return CSV with header row', async () => {
      const csvData = 'Timestamp,Metric Type,Metric Name,Value\n';
      service.exportMetrics.mockResolvedValue(csvData);

      const result = await controller.exportMetrics(
        '2024-02-01T00:00:00Z',
        '2024-02-15T23:59:59Z'
      );

      expect(result).toContain('Timestamp,Metric Type,Metric Name,Value');
    });

    it('should handle large date ranges', async () => {
      const largeCsv = 'Timestamp,Metric Type,Metric Name,Value\n' + 
        Array(1000).fill('2024-02-15T10:00:00Z,DATABASE,avgQueryTime,45.2\n').join('');
      service.exportMetrics.mockResolvedValue(largeCsv);

      const result = await controller.exportMetrics(
        '2024-01-01T00:00:00Z',
        '2024-12-31T23:59:59Z'
      );

      expect(result.length).toBeGreaterThan(1000);
      expect(service.exportMetrics).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors', async () => {
      const error = new Error('Service unavailable');
      service.getCurrentMetrics.mockRejectedValue(error);

      await expect(controller.getCurrentMetrics()).rejects.toThrow('Service unavailable');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      service.getHistoricalMetrics.mockRejectedValue(timeoutError);

      await expect(
        controller.getHistoricalMetrics('2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z')
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Response Format Validation', () => {
    it('should return valid JSON for getCurrentMetrics', async () => {
      service.getCurrentMetrics.mockResolvedValue(mockSystemMetrics);

      const result = await controller.getCurrentMetrics();
      const jsonString = JSON.stringify(result);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toEqual(mockSystemMetrics);
    });

    it('should return valid JSON for getHistoricalMetrics', async () => {
      service.getHistoricalMetrics.mockResolvedValue(mockHistoricalMetrics);

      const result = await controller.getHistoricalMetrics(
        '2024-02-01T00:00:00Z',
        '2024-02-15T23:59:59Z'
      );
      const jsonString = JSON.stringify(result);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toHaveLength(mockHistoricalMetrics.length);
    });

    it('should return valid JSON for checkThresholds', async () => {
      service.checkThresholds.mockResolvedValue(mockThresholdViolations);

      const result = await controller.checkThresholds();
      const jsonString = JSON.stringify(result);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toEqual(mockThresholdViolations);
    });
  });

  describe('Performance', () => {
    it('should respond quickly for getCurrentMetrics', async () => {
      service.getCurrentMetrics.mockResolvedValue(mockSystemMetrics);

      const startTime = Date.now();
      await controller.getCurrentMetrics();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be fast due to caching
    });

    it('should handle concurrent requests', async () => {
      service.getCurrentMetrics.mockResolvedValue(mockSystemMetrics);

      const requests = Array(10).fill(null).map(() => controller.getCurrentMetrics());
      const results = await Promise.all(requests);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toEqual(mockSystemMetrics);
      });
    });
  });
});
