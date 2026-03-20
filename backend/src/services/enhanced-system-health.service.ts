import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SystemHealthLog, HealthStatus, ServiceType } from './../entities/system-health.entity';
import * as os from 'os';

// Interfaces matching the spec design
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

export interface ThresholdViolation {
  metricType: string;
  metricName: string;
  currentValue: number;
  thresholdValue: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface MetricTimeSeries {
  timestamp: Date;
  metricType: string;
  metricName: string;
  value: number;
}

export enum MetricCategory {
  DATABASE = 'DATABASE',
  API = 'API',
  SERVER = 'SERVER',
}

// Threshold configuration
const THRESHOLDS = {
  database: {
    avgQueryTime: { warning: 100, critical: 500 }, // ms
    connectionCount: { warning: 80, critical: 95 }, // % of max
    slowQueries: { warning: 10, critical: 50 }, // count per minute
  },
  api: {
    avgResponseTime: { warning: 200, critical: 1000 }, // ms
    errorRate: { warning: 1, critical: 5 }, // percentage
    p95ResponseTime: { warning: 500, critical: 2000 }, // ms
  },
  server: {
    cpuUsage: { warning: 70, critical: 90 }, // percentage
    memoryUsage: { warning: 80, critical: 95 }, // percentage
    diskUsage: { warning: 80, critical: 95 }, // percentage
  },
};

@Injectable()
export class EnhancedSystemHealthService {
  private readonly logger = new Logger(EnhancedSystemHealthService.name);
  private metricsCache: SystemMetrics | null = null;
  private lastCacheUpdate: Date | null = null;
  private readonly CACHE_TTL_MS = 30000; // 30 seconds

  constructor(
    @InjectRepository(SystemHealthLog)
    private readonly healthLogRepository: Repository<SystemHealthLog>,
    private readonly dataSource: DataSource,
  ) {
    // Initialize metrics collection on startup
    this.collectAndStoreMetrics();
  }

  /**
   * Get current system metrics
   * Requirement 1.1: Display real-time metrics for database, API, and server
   */
  async getCurrentMetrics(): Promise<SystemMetrics> {
    // Return cached metrics if still valid
    if (this.metricsCache && this.lastCacheUpdate) {
      const cacheAge = Date.now() - this.lastCacheUpdate.getTime();
      if (cacheAge < this.CACHE_TTL_MS) {
        return this.metricsCache;
      }
    }

    // Collect fresh metrics
    const metrics: SystemMetrics = {
      timestamp: new Date(),
      database: await this.collectDatabaseMetrics(),
      api: await this.collectApiMetrics(),
      server: this.collectServerMetrics(),
    };

    // Update cache
    this.metricsCache = metrics;
    this.lastCacheUpdate = new Date();

    return metrics;
  }

  /**
   * Get historical metrics for time range
   * Requirement 1.3: Display historical trends for the past 30 days
   */
  async getHistoricalMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<MetricTimeSeries[]> {
    const logs = await this.healthLogRepository.find({
      where: {
        timestamp: Between(startDate, endDate),
      },
      order: {
        timestamp: 'ASC',
      },
    });

    return logs
      .filter(log => log.metricType && log.metricName && log.metricValue !== null)
      .map(log => ({
        timestamp: log.timestamp,
        metricType: log.metricType,
        metricName: log.metricName,
        value: parseFloat(log.metricValue?.toString() || '0'),
      }));
  }

  /**
   * Get metrics by category
   * Requirement 1.6: Filter health metrics by time range
   */
  async getMetricsByCategory(category: MetricCategory): Promise<SystemMetrics> {
    const allMetrics = await this.getCurrentMetrics();
    
    // Return only the requested category
    const filteredMetrics: any = {
      timestamp: allMetrics.timestamp,
    };

    switch (category) {
      case MetricCategory.DATABASE:
        filteredMetrics.database = allMetrics.database;
        break;
      case MetricCategory.API:
        filteredMetrics.api = allMetrics.api;
        break;
      case MetricCategory.SERVER:
        filteredMetrics.server = allMetrics.server;
        break;
    }

    return filteredMetrics as SystemMetrics;
  }

  /**
   * Check if any metrics exceed thresholds
   * Requirement 1.2: Highlight metrics exceeding thresholds with severity levels
   */
  async checkThresholds(): Promise<ThresholdViolation[]> {
    const metrics = await this.getCurrentMetrics();
    const violations: ThresholdViolation[] = [];

    // Check database thresholds
    this.checkMetricThreshold(
      violations,
      'DATABASE',
      'avgQueryTime',
      metrics.database.avgQueryTime,
      THRESHOLDS.database.avgQueryTime,
    );

    this.checkMetricThreshold(
      violations,
      'DATABASE',
      'slowQueries',
      metrics.database.slowQueries,
      THRESHOLDS.database.slowQueries,
    );

    // Check API thresholds
    this.checkMetricThreshold(
      violations,
      'API',
      'avgResponseTime',
      metrics.api.avgResponseTime,
      THRESHOLDS.api.avgResponseTime,
    );

    this.checkMetricThreshold(
      violations,
      'API',
      'errorRate',
      metrics.api.errorRate,
      THRESHOLDS.api.errorRate,
    );

    // Check server thresholds
    this.checkMetricThreshold(
      violations,
      'SERVER',
      'cpuUsage',
      metrics.server.cpuUsage,
      THRESHOLDS.server.cpuUsage,
    );

    this.checkMetricThreshold(
      violations,
      'SERVER',
      'memoryUsage',
      metrics.server.memoryUsage,
      THRESHOLDS.server.memoryUsage,
    );

    this.checkMetricThreshold(
      violations,
      'SERVER',
      'diskUsage',
      metrics.server.diskUsage,
      THRESHOLDS.server.diskUsage,
    );

    // Log critical violations
    // Requirement 1.4: Log critical events to system_health_logs
    for (const violation of violations) {
      if (violation.severity === 'critical') {
        await this.logThresholdViolation(violation);
      }
    }

    return violations;
  }

  /**
   * Export metrics as CSV
   * Requirement 1.7: Generate CSV file with all metrics
   */
  async exportMetrics(startDate: Date, endDate: Date): Promise<string> {
    const metrics = await this.getHistoricalMetrics(startDate, endDate);

    // CSV header
    let csv = 'Timestamp,Metric Type,Metric Name,Value\n';

    // CSV rows
    for (const metric of metrics) {
      csv += `${metric.timestamp.toISOString()},${metric.metricType},${metric.metricName},${metric.value}\n`;
    }

    return csv;
  }

  /**
   * Collect database metrics
   */
  private async collectDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      // Get connection count
      const connectionResult = await this.dataSource.query(`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      const connectionCount = parseInt(connectionResult[0]?.count || '0', 10);

      // Get active queries
      const activeQueriesResult = await this.dataSource.query(`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'
      `);
      const activeQueries = parseInt(activeQueriesResult[0]?.count || '0', 10);

      // Get average query time (from recent logs)
      const avgQueryResult = await this.dataSource.query(`
        SELECT AVG(response_time) as avg_time 
        FROM system_health_logs 
        WHERE service = 'DATABASE' 
        AND timestamp > NOW() - INTERVAL '5 minutes'
      `);
      const avgQueryTime = parseFloat(avgQueryResult[0]?.avg_time || '0');

      // Get slow queries count
      const slowQueriesResult = await this.dataSource.query(`
        SELECT count(*) as count 
        FROM system_health_logs 
        WHERE service = 'DATABASE' 
        AND response_time > 1000 
        AND timestamp > NOW() - INTERVAL '1 minute'
      `);
      const slowQueries = parseInt(slowQueriesResult[0]?.count || '0', 10);

      // Get database size
      const dbSizeResult = await this.dataSource.query(`
        SELECT pg_database_size(current_database()) as size
      `);
      const diskUsage = parseInt(dbSizeResult[0]?.size || '0', 10);

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
   * Collect API metrics
   */
  private async collectApiMetrics(): Promise<ApiMetrics> {
    try {
      // Get API metrics from recent logs
      const recentLogs = await this.healthLogRepository.find({
        where: {
          service: ServiceType.API,
          timestamp: Between(
            new Date(Date.now() - 60000), // Last minute
            new Date(),
          ),
        },
      });

      const responseTimes = recentLogs
        .filter(log => log.responseTime !== null)
        .map(log => log.responseTime);

      const requestsPerMinute = recentLogs.length;
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      // Calculate error rate
      const errorCount = recentLogs.filter(
        log => log.status === HealthStatus.DOWN || log.status === HealthStatus.DEGRADED
      ).length;
      const errorRate = recentLogs.length > 0
        ? (errorCount / recentLogs.length) * 100
        : 0;

      // Calculate percentiles
      const sortedTimes = [...responseTimes].sort((a, b) => a - b);
      const p95Index = Math.floor(sortedTimes.length * 0.95);
      const p99Index = Math.floor(sortedTimes.length * 0.99);
      const p95ResponseTime = sortedTimes[p95Index] || 0;
      const p99ResponseTime = sortedTimes[p99Index] || 0;

      return {
        requestsPerMinute,
        avgResponseTime,
        errorRate,
        p95ResponseTime,
        p99ResponseTime,
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
   * Collect server metrics
   */
  private collectServerMetrics(): ServerMetrics {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      cpuUsage: this.getCPUUsage(),
      memoryUsage: (usedMemory / totalMemory) * 100,
      diskUsage: 0, // Would need additional library for accurate disk usage
      networkIn: 0, // Would need network monitoring
      networkOut: 0, // Would need network monitoring
    };
  }

  /**
   * Calculate CPU usage
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
   * Check individual metric against threshold
   */
  private checkMetricThreshold(
    violations: ThresholdViolation[],
    metricType: string,
    metricName: string,
    currentValue: number,
    thresholds: { warning: number; critical: number },
  ): void {
    let severity: 'low' | 'medium' | 'high' | 'critical' | null = null;

    if (currentValue >= thresholds.critical) {
      severity = 'critical';
    } else if (currentValue >= thresholds.warning) {
      severity = 'high';
    }

    if (severity) {
      violations.push({
        metricType,
        metricName,
        currentValue,
        thresholdValue: severity === 'critical' ? thresholds.critical : thresholds.warning,
        severity,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Log threshold violation to database
   */
  private async logThresholdViolation(violation: ThresholdViolation): Promise<void> {
    try {
      const log = this.healthLogRepository.create({
        service: violation.metricType as any,
        status: HealthStatus.DEGRADED,
        metricType: violation.metricType,
        metricName: violation.metricName,
        metricValue: violation.currentValue,
        thresholdValue: violation.thresholdValue,
        severity: violation.severity,
        errorMessage: `Threshold violation: ${violation.metricName} = ${violation.currentValue} (threshold: ${violation.thresholdValue})`,
        metadata: {
          violation: true,
          timestamp: violation.timestamp,
        },
      });

      await this.healthLogRepository.save(log);
      this.logger.warn(
        `Threshold violation: ${violation.metricType}.${violation.metricName} = ${violation.currentValue} (severity: ${violation.severity})`,
      );
    } catch (error) {
      this.logger.error(`Failed to log threshold violation: ${error.message}`);
    }
  }

  /**
   * Collect and store metrics (scheduled task)
   * Requirement 1.5: Refresh dashboard metrics every 30 seconds
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async collectAndStoreMetrics(): Promise<void> {
    try {
      const metrics = await this.getCurrentMetrics();

      // Store database metrics
      await this.storeMetric('DATABASE', 'connectionCount', metrics.database.connectionCount);
      await this.storeMetric('DATABASE', 'activeQueries', metrics.database.activeQueries);
      await this.storeMetric('DATABASE', 'avgQueryTime', metrics.database.avgQueryTime);
      await this.storeMetric('DATABASE', 'slowQueries', metrics.database.slowQueries);

      // Store API metrics
      await this.storeMetric('API', 'requestsPerMinute', metrics.api.requestsPerMinute);
      await this.storeMetric('API', 'avgResponseTime', metrics.api.avgResponseTime);
      await this.storeMetric('API', 'errorRate', metrics.api.errorRate);

      // Store server metrics
      await this.storeMetric('SERVER', 'cpuUsage', metrics.server.cpuUsage);
      await this.storeMetric('SERVER', 'memoryUsage', metrics.server.memoryUsage);

      // Check for threshold violations
      await this.checkThresholds();

      this.logger.debug('Metrics collected and stored successfully');
    } catch (error) {
      this.logger.error(`Failed to collect metrics: ${error.message}`);
    }
  }

  /**
   * Store individual metric
   */
  private async storeMetric(
    metricType: string,
    metricName: string,
    value: number,
  ): Promise<void> {
    try {
      const log = this.healthLogRepository.create({
        service: metricType as any,
        status: HealthStatus.HEALTHY,
        metricType,
        metricName,
        metricValue: value,
        metadata: {
          automated: true,
        },
      });

      await this.healthLogRepository.save(log);
    } catch (error) {
      this.logger.error(`Failed to store metric ${metricType}.${metricName}: ${error.message}`);
    }
  }
}
