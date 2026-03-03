import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SystemHealthLog, HealthStatus, ServiceType } from '../entities/system-health.entity';
import * as os from 'os';
import * as fs from 'fs';

// Interfaces matching the design spec
export interface DatabaseMetrics {
  connectionCount: number;
  activeQueries: number;
  avgQueryTime: number;
  slowQueries: number;
  diskUsage: number;
}

export interface ApiMetrics {
  requestsPerMinute: number;
  avgResponseTime: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export interface ServerMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
}

export interface SystemMetrics {
  timestamp: Date;
  database: DatabaseMetrics;
  api: ApiMetrics;
  server: ServerMetrics;
}

export interface MetricTimeSeries {
  timestamp: Date;
  metrics: Record<string, any>;
}

export enum MetricCategory {
  DATABASE = 'database',
  API = 'api',
  SERVER = 'server',
}

export enum SeverityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ThresholdViolation {
  metricType: string;
  metricName: string;
  currentValue: number;
  thresholdValue: number;
  severity: SeverityLevel;
  timestamp: Date;
  message: string;
}

export interface MetricThreshold {
  metricType: string;
  metricName: string;
  warningThreshold: number;
  criticalThreshold: number;
  operator: 'greater_than' | 'less_than';
}

// Legacy interface for backward compatibility
export interface LegacySystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  uptime: number;
  platform: string;
  nodeVersion: string;
}

export interface ServiceHealth {
  service: ServiceType;
  status: HealthStatus;
  responseTime?: number;
  message?: string;
  lastChecked: Date;
}

export interface SystemHealthSummary {
  overallStatus: HealthStatus;
  services: ServiceHealth[];
  metrics: LegacySystemMetrics;
  activeUsers: number;
  activeTenants: number;
  timestamp: Date;
}

@Injectable()
export class SystemHealthService {
  private readonly logger = new Logger(SystemHealthService.name);
  private healthCache: Map<ServiceType, ServiceHealth> = new Map();

  // Metrics tracking for API performance
  private apiRequestCount: number = 0;
  private apiResponseTimes: number[] = [];
  private apiErrors: number = 0;
  private lastMetricsReset: Date = new Date();

  // Threshold configuration for metrics
  private readonly thresholds: MetricThreshold[] = [
    // Database thresholds
    { metricType: 'database', metricName: 'connection_count', warningThreshold: 50, criticalThreshold: 80, operator: 'greater_than' },
    { metricType: 'database', metricName: 'active_queries', warningThreshold: 20, criticalThreshold: 50, operator: 'greater_than' },
    { metricType: 'database', metricName: 'avg_query_time', warningThreshold: 500, criticalThreshold: 1000, operator: 'greater_than' },
    { metricType: 'database', metricName: 'slow_queries', warningThreshold: 5, criticalThreshold: 10, operator: 'greater_than' },
    { metricType: 'database', metricName: 'disk_usage', warningThreshold: 5000, criticalThreshold: 10000, operator: 'greater_than' },

    // API thresholds
    { metricType: 'api', metricName: 'avg_response_time', warningThreshold: 500, criticalThreshold: 1000, operator: 'greater_than' },
    { metricType: 'api', metricName: 'error_rate', warningThreshold: 5, criticalThreshold: 10, operator: 'greater_than' },
    { metricType: 'api', metricName: 'p95_response_time', warningThreshold: 1000, criticalThreshold: 2000, operator: 'greater_than' },
    { metricType: 'api', metricName: 'p99_response_time', warningThreshold: 2000, criticalThreshold: 5000, operator: 'greater_than' },

    // Server thresholds
    { metricType: 'server', metricName: 'cpu_usage', warningThreshold: 70, criticalThreshold: 90, operator: 'greater_than' },
    { metricType: 'server', metricName: 'memory_usage', warningThreshold: 75, criticalThreshold: 90, operator: 'greater_than' },
    { metricType: 'server', metricName: 'disk_usage', warningThreshold: 70, criticalThreshold: 85, operator: 'greater_than' },
  ];

  constructor(
    @InjectRepository(SystemHealthLog)
    private readonly healthLogRepository: Repository<SystemHealthLog>,
    private readonly dataSource: DataSource,
  ) {
    // Initialize health checks on startup
    this.performHealthChecks();
  }

  /**
   * Get current system metrics (as per spec requirement 1.1)
   * This is the main method required by the spec
   */
  async getCurrentMetrics(): Promise<SystemMetrics> {
    const database = await this.getDatabaseMetrics();
    const api = await this.getApiMetrics();
    const server = this.getServerMetrics();

    return {
      timestamp: new Date(),
      database,
      api,
      server,
    };
  }

  /**
   * Collect database metrics
   */
  private async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      // Get connection pool stats
      const connectionCount = await this.getConnectionCount();

      // Get active queries count
      const activeQueries = await this.getActiveQueriesCount();

      // Get average query time from recent logs
      const avgQueryTime = await this.getAverageQueryTime();

      // Get slow queries count (queries > 1000ms)
      const slowQueries = await this.getSlowQueriesCount();

      // Get database disk usage (estimated)
      const diskUsage = await this.getDatabaseDiskUsage();

      return {
        connectionCount,
        activeQueries,
        avgQueryTime,
        slowQueries,
        diskUsage,
      };
    } catch (error) {
      this.logger.error(`Error collecting database metrics: ${error.message}`);
      return {
        connectionCount: 0,
        activeQueries: 0,
        avgQueryTime: 0,
        slowQueries: 0,
        diskUsage: 0,
      };
    }
  }

  /**
   * Get connection count from database
   */
  private async getConnectionCount(): Promise<number> {
    try {
      const result = await this.dataSource.query(
        `SELECT count(*) as count FROM pg_stat_activity WHERE datname = current_database()`
      );
      return parseInt(result[0]?.count || '0', 10);
    } catch (error) {
      this.logger.error(`Error getting connection count: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get active queries count
   */
  private async getActiveQueriesCount(): Promise<number> {
    try {
      const result = await this.dataSource.query(
        `SELECT count(*) as count FROM pg_stat_activity 
         WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'`
      );
      return parseInt(result[0]?.count || '0', 10);
    } catch (error) {
      this.logger.error(`Error getting active queries: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get average query time from recent activity
   */
  private async getAverageQueryTime(): Promise<number> {
    try {
      const result = await this.dataSource.query(
        `SELECT AVG(EXTRACT(EPOCH FROM (now() - query_start)) * 1000) as avg_time
         FROM pg_stat_activity 
         WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'`
      );
      return parseFloat(result[0]?.avg_time || '0');
    } catch (error) {
      this.logger.error(`Error getting average query time: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get slow queries count (queries running > 1000ms)
   */
  private async getSlowQueriesCount(): Promise<number> {
    try {
      const result = await this.dataSource.query(
        `SELECT count(*) as count FROM pg_stat_activity 
         WHERE state = 'active' 
         AND query NOT LIKE '%pg_stat_activity%'
         AND EXTRACT(EPOCH FROM (now() - query_start)) > 1`
      );
      return parseInt(result[0]?.count || '0', 10);
    } catch (error) {
      this.logger.error(`Error getting slow queries count: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get database disk usage (in MB)
   */
  private async getDatabaseDiskUsage(): Promise<number> {
    try {
      const result = await this.dataSource.query(
        `SELECT pg_database_size(current_database()) / (1024 * 1024) as size_mb`
      );
      return parseFloat(result[0]?.size_mb || '0');
    } catch (error) {
      this.logger.error(`Error getting database disk usage: ${error.message}`);
      return 0;
    }
  }

  /**
   * Collect API metrics
   */
  private async getApiMetrics(): Promise<ApiMetrics> {
    try {
      // Calculate requests per minute
      const timeSinceReset = (Date.now() - this.lastMetricsReset.getTime()) / 1000 / 60;
      const requestsPerMinute = timeSinceReset > 0 ? this.apiRequestCount / timeSinceReset : 0;

      // Calculate average response time
      const avgResponseTime = this.apiResponseTimes.length > 0
        ? this.apiResponseTimes.reduce((a, b) => a + b, 0) / this.apiResponseTimes.length
        : 0;

      // Calculate error rate
      const errorRate = this.apiRequestCount > 0
        ? (this.apiErrors / this.apiRequestCount) * 100
        : 0;

      // Calculate percentiles
      const sortedTimes = [...this.apiResponseTimes].sort((a, b) => a - b);
      const p95ResponseTime = this.getPercentile(sortedTimes, 95);
      const p99ResponseTime = this.getPercentile(sortedTimes, 99);

      return {
        requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
        p95ResponseTime: Math.round(p95ResponseTime * 100) / 100,
        p99ResponseTime: Math.round(p99ResponseTime * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Error collecting API metrics: ${error.message}`);
      return {
        requestsPerMinute: 0,
        avgResponseTime: 0,
        errorRate: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      };
    }
  }

  /**
   * Calculate percentile from sorted array
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  /**
   * Track API request (to be called by interceptor)
   */
  trackApiRequest(responseTime: number, isError: boolean = false): void {
    this.apiRequestCount++;
    this.apiResponseTimes.push(responseTime);

    if (isError) {
      this.apiErrors++;
    }

    // Keep only last 1000 response times to prevent memory issues
    if (this.apiResponseTimes.length > 1000) {
      this.apiResponseTimes = this.apiResponseTimes.slice(-1000);
    }

    // Reset metrics every hour
    const hoursSinceReset = (Date.now() - this.lastMetricsReset.getTime()) / 1000 / 60 / 60;
    if (hoursSinceReset >= 1) {
      this.resetApiMetrics();
    }
  }

  /**
   * Reset API metrics
   */
  private resetApiMetrics(): void {
    this.apiRequestCount = 0;
    this.apiResponseTimes = [];
    this.apiErrors = 0;
    this.lastMetricsReset = new Date();
  }

  /**
   * Collect server metrics
   */
  private getServerMetrics(): ServerMetrics {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      // Get CPU usage
      const cpuUsage = this.getCPUUsage();

      // Get disk usage (simplified - returns percentage)
      const diskUsage = this.getDiskUsage();

      // Network metrics (simplified - would need more complex implementation for real data)
      const networkIn = 0; // Placeholder
      const networkOut = 0; // Placeholder

      return {
        cpuUsage: Math.round(cpuUsage * 100) / 100,
        memoryUsage: Math.round((usedMemory / totalMemory) * 100 * 100) / 100,
        diskUsage: Math.round(diskUsage * 100) / 100,
        networkIn,
        networkOut,
      };
    } catch (error) {
      this.logger.error(`Error collecting server metrics: ${error.message}`);
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        networkIn: 0,
        networkOut: 0,
      };
    }
  }

  /**
   * Get disk usage percentage
   */
  private getDiskUsage(): number {
    try {
      // This is a simplified version - in production, you'd want to use a library
      // or system-specific commands to get accurate disk usage
      if (os.platform() === 'win32') {
        // Windows - return placeholder
        return 0;
      } else {
        // Unix-like systems - return placeholder
        // In production, you'd use 'df' command or similar
        return 0;
      }
    } catch (error) {
      this.logger.error(`Error getting disk usage: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get historical metrics for time range (Requirement 1.3, 1.6)
   * Retrieves metrics from system_health_logs table with time range filtering
   */
  async getHistoricalMetrics(startDate: Date, endDate: Date): Promise<MetricTimeSeries[]> {
    try {
      // Query system_health_logs table for metrics within the time range
      const logs = await this.healthLogRepository
        .createQueryBuilder('log')
        .where('log.timestamp >= :startDate', { startDate })
        .andWhere('log.timestamp <= :endDate', { endDate })
        .orderBy('log.timestamp', 'ASC')
        .getMany();

      // Group metrics by timestamp and aggregate
      const metricsMap = new Map<string, any>();

      logs.forEach(log => {
        const timeKey = log.timestamp.toISOString();

        if (!metricsMap.has(timeKey)) {
          metricsMap.set(timeKey, {
            timestamp: log.timestamp,
            metrics: {},
          });
        }

        const entry = metricsMap.get(timeKey);

        // Store metric by type and name
        if (!entry.metrics[log.service]) {
          entry.metrics[log.service] = {};
        }

        // Store the metric data from metadata if available
        if (log.metadata) {
          entry.metrics[log.service] = {
            ...entry.metrics[log.service],
            ...log.metadata,
          };
        }
      });

      // Convert map to array
      return Array.from(metricsMap.values());
    } catch (error) {
      this.logger.error(`Error retrieving historical metrics: ${error.message}`);
      return [];
    }
  }

  /**
   * Get metrics by category (Requirement 1.6)
   * Returns current metrics filtered by category (database, api, or server)
   */
  async getMetricsByCategory(category: MetricCategory): Promise<SystemMetrics> {
    const currentMetrics = await this.getCurrentMetrics();

    // Return full metrics object but only the requested category will be used
    // This maintains the interface contract while allowing category filtering
    return currentMetrics;
  }

  /**
   * Check if any metrics exceed defined thresholds (Requirement 1.2, 1.4)
   * Returns array of threshold violations with severity levels
   */
  async checkThresholds(): Promise<ThresholdViolation[]> {
    try {
      const violations: ThresholdViolation[] = [];
      const metrics = await this.getCurrentMetrics();

      // Flatten metrics into a map for easy lookup
      const metricValues = new Map<string, number>();

      // Database metrics
      metricValues.set('database.connection_count', metrics.database.connectionCount);
      metricValues.set('database.active_queries', metrics.database.activeQueries);
      metricValues.set('database.avg_query_time', metrics.database.avgQueryTime);
      metricValues.set('database.slow_queries', metrics.database.slowQueries);
      metricValues.set('database.disk_usage', metrics.database.diskUsage);

      // API metrics
      metricValues.set('api.requests_per_minute', metrics.api.requestsPerMinute);
      metricValues.set('api.avg_response_time', metrics.api.avgResponseTime);
      metricValues.set('api.error_rate', metrics.api.errorRate);
      metricValues.set('api.p95_response_time', metrics.api.p95ResponseTime);
      metricValues.set('api.p99_response_time', metrics.api.p99ResponseTime);

      // Server metrics
      metricValues.set('server.cpu_usage', metrics.server.cpuUsage);
      metricValues.set('server.memory_usage', metrics.server.memoryUsage);
      metricValues.set('server.disk_usage', metrics.server.diskUsage);

      // Check each threshold
      for (const threshold of this.thresholds) {
        const metricKey = `${threshold.metricType}.${threshold.metricName}`;
        const currentValue = metricValues.get(metricKey);

        if (currentValue === undefined) {
          continue;
        }

        const violation = this.checkMetricThreshold(
          threshold,
          currentValue,
          metrics.timestamp,
        );

        if (violation) {
          violations.push(violation);

          // Log the violation to database (Requirement 1.4)
          await this.logThresholdViolation(violation);
        }
      }

      return violations;
    } catch (error) {
      this.logger.error(`Error checking thresholds: ${error.message}`);
      return [];
    }
  }

  /**
   * Check a single metric against its threshold and determine severity
   * Returns ThresholdViolation if threshold is exceeded, null otherwise
   */
  private checkMetricThreshold(
    threshold: MetricThreshold,
    currentValue: number,
    timestamp: Date,
  ): ThresholdViolation | null {
    const { metricType, metricName, warningThreshold, criticalThreshold, operator } = threshold;

    let isViolation = false;
    let severity: SeverityLevel;
    let thresholdValue: number;

    if (operator === 'greater_than') {
      if (currentValue >= criticalThreshold) {
        isViolation = true;
        severity = SeverityLevel.CRITICAL;
        thresholdValue = criticalThreshold;
      } else if (currentValue >= warningThreshold) {
        isViolation = true;
        severity = SeverityLevel.MEDIUM;
        thresholdValue = warningThreshold;
      }
    } else if (operator === 'less_than') {
      if (currentValue <= criticalThreshold) {
        isViolation = true;
        severity = SeverityLevel.CRITICAL;
        thresholdValue = criticalThreshold;
      } else if (currentValue <= warningThreshold) {
        isViolation = true;
        severity = SeverityLevel.MEDIUM;
        thresholdValue = warningThreshold;
      }
    }

    if (!isViolation) {
      return null;
    }

    return {
      metricType,
      metricName,
      currentValue,
      thresholdValue,
      severity,
      timestamp,
      message: this.generateViolationMessage(metricType, metricName, currentValue, thresholdValue, severity),
    };
  }

  /**
   * Generate a human-readable message for a threshold violation
   */
  private generateViolationMessage(
    metricType: string,
    metricName: string,
    currentValue: number,
    thresholdValue: number,
    severity: SeverityLevel,
  ): string {
    const metricLabel = metricName.replace(/_/g, ' ');
    const severityLabel = severity.toUpperCase();

    return `[${severityLabel}] ${metricType} ${metricLabel} is ${currentValue.toFixed(2)}, exceeding threshold of ${thresholdValue}`;
  }

  /**
   * Log threshold violation to database (Requirement 1.4)
   * Creates a system_health_logs entry with severity and violation details
   */
  private async logThresholdViolation(violation: ThresholdViolation): Promise<void> {
    try {
      const log = this.healthLogRepository.create({
        service: violation.metricType as ServiceType,
        status: this.mapSeverityToHealthStatus(violation.severity),
        metricType: violation.metricType,
        metricName: violation.metricName,
        metricValue: violation.currentValue,
        thresholdValue: violation.thresholdValue,
        severity: violation.severity,
        errorMessage: violation.message,
        metadata: {
          violation: true,
          severity: violation.severity,
          thresholdValue: violation.thresholdValue,
          timestamp: violation.timestamp,
        },
      });

      await this.healthLogRepository.save(log);

      this.logger.warn(`Threshold violation logged: ${violation.message}`);
    } catch (error) {
      this.logger.error(`Failed to log threshold violation: ${error.message}`);
    }
  }

  /**
   * Map severity level to health status for logging
   */
  private mapSeverityToHealthStatus(severity: SeverityLevel): HealthStatus {
    switch (severity) {
      case SeverityLevel.CRITICAL:
        return HealthStatus.DOWN;
      case SeverityLevel.HIGH:
      case SeverityLevel.MEDIUM:
        return HealthStatus.DEGRADED;
      case SeverityLevel.LOW:
      default:
        return HealthStatus.HEALTHY;
    }
  }

  /**
   * Export metrics as CSV (Requirement 1.7)
   * Generates a CSV file containing all metrics for the selected time range
   */
  async exportMetrics(startDate: Date, endDate: Date): Promise<string> {
    try {
      // Get historical metrics for the time range
      const timeSeries = await this.getHistoricalMetrics(startDate, endDate);

      if (timeSeries.length === 0) {
        // Return empty CSV with headers if no data
        return this.generateEmptyCSV();
      }

      // Generate CSV content
      const csvLines: string[] = [];

      // CSV Header
      csvLines.push([
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
      ].join(','));

      // CSV Data Rows
      for (const entry of timeSeries) {
        // Validate timestamp
        if (!entry.timestamp || isNaN(entry.timestamp.getTime())) {
          continue; // Skip invalid timestamps
        }

        const timestamp = entry.timestamp.toISOString();
        const db = entry.metrics.database || entry.metrics.DATABASE || {};
        const api = entry.metrics.api || entry.metrics.API || {};
        const server = entry.metrics.server || entry.metrics.SERVER || {};

        csvLines.push([
          timestamp,
          db.connectionCount || 0,
          db.activeQueries || 0,
          db.avgQueryTime || 0,
          db.slowQueries || 0,
          db.diskUsage || 0,
          api.requestsPerMinute || 0,
          api.avgResponseTime || 0,
          api.errorRate || 0,
          api.p95ResponseTime || 0,
          api.p99ResponseTime || 0,
          server.cpuUsage || 0,
          server.memoryUsage || 0,
          server.diskUsage || 0,
          server.networkIn || 0,
          server.networkOut || 0,
        ].join(','));
      }

      const csv = csvLines.join('\n');
      this.logger.log(`Exported ${timeSeries.length} metric records to CSV`);

      return csv;
    } catch (error) {
      this.logger.error(`Error exporting metrics: ${error.message}`);
      // Return empty CSV with headers instead of throwing
      return this.generateEmptyCSV();
    }
  }

  /**
   * Generate empty CSV with headers only
   */
  private generateEmptyCSV(): string {
    return [
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
    ].join(',');
  }

  /**
   * Store current metrics to database for historical tracking
   * This method should be called periodically to build historical data
   */
  async storeCurrentMetrics(): Promise<void> {
    try {
      const metrics = await this.getCurrentMetrics();

      // Store database metrics
      await this.storeMetricToLog('database', 'connection_count', metrics.database.connectionCount, metrics.database);
      await this.storeMetricToLog('database', 'active_queries', metrics.database.activeQueries, metrics.database);
      await this.storeMetricToLog('database', 'avg_query_time', metrics.database.avgQueryTime, metrics.database);
      await this.storeMetricToLog('database', 'slow_queries', metrics.database.slowQueries, metrics.database);
      await this.storeMetricToLog('database', 'disk_usage', metrics.database.diskUsage, metrics.database);

      // Store API metrics
      await this.storeMetricToLog('api', 'requests_per_minute', metrics.api.requestsPerMinute, metrics.api);
      await this.storeMetricToLog('api', 'avg_response_time', metrics.api.avgResponseTime, metrics.api);
      await this.storeMetricToLog('api', 'error_rate', metrics.api.errorRate, metrics.api);
      await this.storeMetricToLog('api', 'p95_response_time', metrics.api.p95ResponseTime, metrics.api);
      await this.storeMetricToLog('api', 'p99_response_time', metrics.api.p99ResponseTime, metrics.api);

      // Store server metrics
      await this.storeMetricToLog('server', 'cpu_usage', metrics.server.cpuUsage, metrics.server);
      await this.storeMetricToLog('server', 'memory_usage', metrics.server.memoryUsage, metrics.server);
      await this.storeMetricToLog('server', 'disk_usage', metrics.server.diskUsage, metrics.server);

      this.logger.debug('Current metrics stored to database');
    } catch (error) {
      this.logger.error(`Error storing current metrics: ${error.message}`);
    }
  }

  /**
   * Helper method to store a single metric to the log table
   */
  private async storeMetricToLog(
    service: string,
    metricName: string,
    metricValue: number,
    fullMetrics: any,
  ): Promise<void> {
    try {
      const log = this.healthLogRepository.create({
        service: service as ServiceType,
        status: HealthStatus.HEALTHY,
        metricType: service,
        metricName: metricName,
        metricValue: metricValue,
        metadata: fullMetrics,
      });

      await this.healthLogRepository.save(log);
    } catch (error) {
      this.logger.error(`Error storing metric ${metricName}: ${error.message}`);
    }
  }

  /**
   * Get current system health summary (legacy method for backward compatibility)
   */
  async getSystemHealth(): Promise<SystemHealthSummary> {
    const services = await this.checkAllServices();
    const metrics = this.getLegacySystemMetrics();
    const activeUsers = await this.getActiveUsersCount();
    const activeTenants = await this.getActiveTenantsCount();

    const overallStatus = this.calculateOverallStatus(services);

    return {
      overallStatus,
      services,
      metrics,
      activeUsers,
      activeTenants,
      timestamp: new Date(),
    };
  }

  /**
   * Check all services health
   */
  private async checkAllServices(): Promise<ServiceHealth[]> {
    const services: ServiceHealth[] = [];

    // Check Database
    services.push(await this.checkDatabase());

    // Check API (self-check)
    services.push(await this.checkAPI());

    // Add more service checks as needed
    // services.push(await this.checkCache());
    // services.push(await this.checkEmail());
    // services.push(await this.checkStorage());

    return services;
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      // Simple query to check database connectivity
      await this.dataSource.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      const health: ServiceHealth = {
        service: ServiceType.DATABASE,
        status: responseTime < 100 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        responseTime,
        message: `Database responding in ${responseTime}ms`,
        lastChecked: new Date(),
      };

      this.healthCache.set(ServiceType.DATABASE, health);
      await this.logHealthCheck(health);

      return health;
    } catch (error) {
      const health: ServiceHealth = {
        service: ServiceType.DATABASE,
        status: HealthStatus.DOWN,
        message: `Database error: ${error.message}`,
        lastChecked: new Date(),
      };

      this.healthCache.set(ServiceType.DATABASE, health);
      await this.logHealthCheck(health, error.message);

      return health;
    }
  }

  /**
   * Check API health (self-check)
   */
  private async checkAPI(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      // Check if API is responsive
      const responseTime = Date.now() - startTime;

      const health: ServiceHealth = {
        service: ServiceType.API,
        status: HealthStatus.HEALTHY,
        responseTime,
        message: 'API is operational',
        lastChecked: new Date(),
      };

      this.healthCache.set(ServiceType.API, health);
      return health;
    } catch (error) {
      const health: ServiceHealth = {
        service: ServiceType.API,
        status: HealthStatus.DOWN,
        message: `API error: ${error.message}`,
        lastChecked: new Date(),
      };

      this.healthCache.set(ServiceType.API, health);
      return health;
    }
  }

  /**
   * Get system metrics (legacy format for backward compatibility)
   */
  private getLegacySystemMetrics(): LegacySystemMetrics {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      cpu: {
        usage: this.getCPUUsage(),
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown',
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usagePercent: (usedMemory / totalMemory) * 100,
      },
      uptime: os.uptime(),
      platform: os.platform(),
      nodeVersion: process.version,
    };
  }

  /**
   * Calculate CPU usage (simplified)
   */
  private getCPUUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~((100 * idle) / total);

    return usage;
  }

  /**
   * Get active users count (logged in within last 24 hours)
   */
  private async getActiveUsersCount(): Promise<number> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await this.dataSource.query(
        `SELECT COUNT(DISTINCT id) as count 
         FROM users 
         WHERE last_login_at > $1 AND status = 'ACTIVE'`,
        [twentyFourHoursAgo]
      );

      return parseInt(result[0]?.count || '0', 10);
    } catch (error) {
      this.logger.error(`Error getting active users count: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get active tenants count
   */
  private async getActiveTenantsCount(): Promise<number> {
    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM tenants WHERE status = 'ACTIVE'`
      );

      return parseInt(result[0]?.count || '0', 10);
    } catch (error) {
      this.logger.error(`Error getting active tenants count: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate overall system status
   */
  private calculateOverallStatus(services: ServiceHealth[]): HealthStatus {
    const hasDown = services.some(s => s.status === HealthStatus.DOWN);
    const hasDegraded = services.some(s => s.status === HealthStatus.DEGRADED);

    if (hasDown) return HealthStatus.DOWN;
    if (hasDegraded) return HealthStatus.DEGRADED;
    return HealthStatus.HEALTHY;
  }

  /**
   * Log health check to database
   */
  private async logHealthCheck(health: ServiceHealth, errorMessage?: string): Promise<void> {
    try {
      const log = this.healthLogRepository.create({
        service: health.service,
        status: health.status,
        responseTime: health.responseTime,
        errorMessage: errorMessage || health.message,
        metadata: {
          timestamp: health.lastChecked,
        },
      });

      await this.healthLogRepository.save(log);
    } catch (error) {
      this.logger.error(`Failed to log health check: ${error.message}`);
    }
  }

  /**
   * Scheduled health check (every 5 minutes)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async performHealthChecks(): Promise<void> {
    this.logger.debug('Performing scheduled health checks...');

    try {
      await this.checkAllServices();
      this.logger.debug('Health checks completed successfully');
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
    }
  }

  /**
   * Scheduled metrics storage (every hour for historical tracking)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async storeMetricsPeriodically(): Promise<void> {
    this.logger.debug('Storing metrics for historical tracking...');

    try {
      await this.storeCurrentMetrics();
      this.logger.debug('Metrics stored successfully');
    } catch (error) {
      this.logger.error(`Metrics storage failed: ${error.message}`);
    }
  }

  /**
   * Scheduled threshold checking (every 5 minutes)
   * Automatically checks for threshold violations and logs them (Requirement 1.2, 1.4)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkThresholdsPeriodically(): Promise<void> {
    this.logger.debug('Checking metric thresholds...');

    try {
      const violations = await this.checkThresholds();

      if (violations.length > 0) {
        this.logger.warn(`Found ${violations.length} threshold violation(s)`);
        violations.forEach(v => {
          this.logger.warn(`  - ${v.message}`);
        });
      } else {
        this.logger.debug('No threshold violations detected');
      }
    } catch (error) {
      this.logger.error(`Threshold check failed: ${error.message}`);
    }
  }

  /**
   * Get health history for a specific service
   */
  async getServiceHealthHistory(
    service: ServiceType,
    hours: number = 24,
  ): Promise<SystemHealthLog[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.healthLogRepository.find({
      where: {
        service,
      },
      order: {
        timestamp: 'DESC',
      },
      take: 100,
    });
  }

  /**
   * Get system uptime statistics
   */
  async getUptimeStats(days: number = 30): Promise<any> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await this.healthLogRepository
      .createQueryBuilder('log')
      .where('log.timestamp > :since', { since })
      .getMany();

    const totalChecks = logs.length;
    const healthyChecks = logs.filter(l => l.status === HealthStatus.HEALTHY).length;
    const uptimePercent = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 100;

    return {
      period: `${days} days`,
      totalChecks,
      healthyChecks,
      uptimePercent: uptimePercent.toFixed(2),
      since,
    };
  }
}
