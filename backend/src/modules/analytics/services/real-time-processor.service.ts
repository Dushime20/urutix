import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CargoOwnerAnalytics } from '../../../entities/cargo-owner-analytics.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class RealTimeProcessorService {
  private readonly logger = new Logger(RealTimeProcessorService.name);
  private readonly streamBuffer = new Map<string, any[]>();
  private readonly processingQueue = new Map<string, any[]>();

  constructor(
    @InjectRepository(CargoOwnerAnalytics)
    private analyticsRepository: Repository<CargoOwnerAnalytics>,
    private eventEmitter: EventEmitter2,
  ) {
    // Initialize real-time processing
    this.initializeStreamProcessing();
  }

  /**
   * Process real-time analytics stream
   */
  async processAnalyticsStream(
    tenantId: string,
    streamType: string,
    eventData: any
  ) {
    const startTime = Date.now();
    
    try {
      // Add to stream buffer
      const streamKey = `${tenantId}:${streamType}`;
      if (!this.streamBuffer.has(streamKey)) {
        this.streamBuffer.set(streamKey, []);
      }
      
      this.streamBuffer.get(streamKey)!.push({
        ...eventData,
        timestamp: new Date().toISOString(),
        tenantId,
        streamType
      });

      // Process based on stream type
      let result;
      switch (streamType) {
        case 'cost_alert':
          result = await this.processCostAlert(tenantId, eventData);
          break;
        case 'performance_drop':
          result = await this.processPerformanceDrop(tenantId, eventData);
          break;
        case 'demand_spike':
          result = await this.processDemandSpike(tenantId, eventData);
          break;
        case 'route_anomaly':
          result = await this.processRouteAnomaly(tenantId, eventData);
          break;
        default:
          result = await this.processGenericEvent(tenantId, streamType, eventData);
      }

      const processingTime = Date.now() - startTime;
      
      // Emit processed event
      this.eventEmitter.emit('analytics.stream.processed', {
        tenantId,
        streamType,
        processingTime,
        result
      });

      return {
        success: true,
        processingTime,
        result,
        streamSize: this.streamBuffer.get(streamKey)?.length || 0
      };
      
    } catch (error) {
      this.logger.error(`Failed to process stream event: ${streamType}`, error);
      throw error;
    }
  }

  /**
   * Get real-time analytics dashboard data
   */
  async getRealTimeDashboard(tenantId: string) {
    try {
      const dashboard = {
        activeStreams: this.getActiveStreams(tenantId),
        recentEvents: await this.getRecentEvents(tenantId, 50),
        processingMetrics: this.getProcessingMetrics(tenantId),
        alertsSummary: await this.getAlertsSummary(tenantId),
        performanceMetrics: this.getPerformanceMetrics(tenantId),
        lastUpdated: new Date().toISOString()
      };

      return dashboard;
      
    } catch (error) {
      this.logger.error('Failed to get real-time dashboard', error);
      throw error;
    }
  }

  /**
   * Start real-time monitoring for a tenant
   */
  async startRealTimeMonitoring(
    tenantId: string,
    monitoringConfig: any = {}
  ) {
    try {
      const config = {
        costThreshold: monitoringConfig.costThreshold || 1000,
        performanceThreshold: monitoringConfig.performanceThreshold || 0.8,
        demandSpikeThreshold: monitoringConfig.demandSpikeThreshold || 2.0,
        alertFrequency: monitoringConfig.alertFrequency || 'immediate',
        ...monitoringConfig
      };

      // Initialize monitoring streams
      const streams = [
        'cost_alert',
        'performance_drop',
        'demand_spike',
        'route_anomaly'
      ];

      for (const streamType of streams) {
        await this.initializeStream(tenantId, streamType, config);
      }

      this.logger.log(`Real-time monitoring started for tenant: ${tenantId}`);
      
      return {
        success: true,
        tenantId,
        activeStreams: streams,
        config,
        startedAt: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error('Failed to start real-time monitoring', error);
      throw error;
    }
  }

  /**
   * Process batch analytics updates
   */
  async processBatchUpdates(tenantId: string, updates: any[]) {
    const startTime = Date.now();
    const results = [];
    
    try {
      // Process updates in batches
      const batchSize = 100;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        const batchResults = await this.processBatch(tenantId, batch);
        results.push(...batchResults);
      }

      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        processedCount: updates.length,
        processingTime,
        results: results.slice(0, 10), // Return first 10 results
        summary: this.summarizeBatchResults(results)
      };
      
    } catch (error) {
      this.logger.error('Failed to process batch updates', error);
      throw error;
    }
  }

  private async processCostAlert(tenantId: string, eventData: any) {
    const { currentCost, averageCost, threshold } = eventData;
    
    if (currentCost > threshold) {
      // Generate cost alert
      const alert = {
        type: 'cost_spike',
        severity: currentCost > threshold * 1.5 ? 'high' : 'medium',
        message: `Cost spike detected: ₦${currentCost.toLocaleString()} (${((currentCost / averageCost - 1) * 100).toFixed(1)}% above average)`,
        currentCost,
        averageCost,
        threshold,
        recommendations: this.generateCostRecommendations(currentCost, averageCost)
      };

      // Emit alert event
      this.eventEmitter.emit('analytics.alert.cost', {
        tenantId,
        alert
      });

      return alert;
    }

    return { type: 'cost_normal', message: 'Cost within normal range' };
  }

  private async processPerformanceDrop(tenantId: string, eventData: any) {
    const { currentPerformance, averagePerformance, threshold } = eventData;
    
    if (currentPerformance < threshold) {
      const alert = {
        type: 'performance_drop',
        severity: currentPerformance < threshold * 0.8 ? 'high' : 'medium',
        message: `Performance drop detected: ${(currentPerformance * 100).toFixed(1)}% (${((1 - currentPerformance / averagePerformance) * 100).toFixed(1)}% below average)`,
        currentPerformance,
        averagePerformance,
        threshold,
        recommendations: this.generatePerformanceRecommendations(currentPerformance, averagePerformance)
      };

      this.eventEmitter.emit('analytics.alert.performance', {
        tenantId,
        alert
      });

      return alert;
    }

    return { type: 'performance_normal', message: 'Performance within normal range' };
  }

  private async processDemandSpike(tenantId: string, eventData: any) {
    const { currentDemand, averageDemand, threshold } = eventData;
    
    if (currentDemand > averageDemand * threshold) {
      const alert = {
        type: 'demand_spike',
        severity: currentDemand > averageDemand * threshold * 1.5 ? 'high' : 'medium',
        message: `Demand spike detected: ${currentDemand} shipments (${((currentDemand / averageDemand - 1) * 100).toFixed(1)}% above average)`,
        currentDemand,
        averageDemand,
        threshold,
        recommendations: this.generateDemandRecommendations(currentDemand, averageDemand)
      };

      this.eventEmitter.emit('analytics.alert.demand', {
        tenantId,
        alert
      });

      return alert;
    }

    return { type: 'demand_normal', message: 'Demand within normal range' };
  }

  private async processRouteAnomaly(tenantId: string, eventData: any) {
    const { routeHash, anomalyType, severity, details } = eventData;
    
    const alert = {
      type: 'route_anomaly',
      severity: severity || 'medium',
      message: `Route anomaly detected: ${anomalyType} on route ${routeHash}`,
      routeHash,
      anomalyType,
      details,
      recommendations: this.generateRouteRecommendations(anomalyType, details)
    };

    this.eventEmitter.emit('analytics.alert.route', {
      tenantId,
      alert
    });

    return alert;
  }

  private async processGenericEvent(tenantId: string, streamType: string, eventData: any) {
    // Generic event processing
    return {
      type: 'generic_event',
      streamType,
      message: `Processed ${streamType} event`,
      data: eventData,
      processedAt: new Date().toISOString()
    };
  }

  private initializeStreamProcessing() {
    // Set up periodic stream processing
    setInterval(() => {
      this.processStreamBuffers();
    }, 5000); // Process every 5 seconds

    // Set up buffer cleanup
    setInterval(() => {
      this.cleanupStreamBuffers();
    }, 60000); // Cleanup every minute
  }

  private async processStreamBuffers() {
    for (const [streamKey, events] of this.streamBuffer.entries()) {
      if (events.length > 0) {
        try {
          await this.processStreamBatch(streamKey, events);
          this.streamBuffer.set(streamKey, []); // Clear processed events
        } catch (error) {
          this.logger.error(`Failed to process stream batch: ${streamKey}`, error);
        }
      }
    }
  }

  private async processStreamBatch(streamKey: string, events: any[]) {
    // Batch process stream events
    const [tenantId, streamType] = streamKey.split(':');
    
    // Aggregate events for batch processing
    const aggregated = this.aggregateEvents(events);
    
    // Store aggregated data (in production, this would go to a time-series database)
    this.logger.debug(`Processed ${events.length} events for ${streamKey}`, aggregated);
  }

  private aggregateEvents(events: any[]) {
    return {
      count: events.length,
      timeRange: {
        start: events[0]?.timestamp,
        end: events[events.length - 1]?.timestamp
      },
      summary: events.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {})
    };
  }

  private cleanupStreamBuffers() {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    
    for (const [streamKey, events] of this.streamBuffer.entries()) {
      const filteredEvents = events.filter(event => {
        const eventTime = new Date(event.timestamp).getTime();
        return now - eventTime < maxAge;
      });
      
      this.streamBuffer.set(streamKey, filteredEvents);
    }
  }

  private getActiveStreams(tenantId: string) {
    const activeStreams = [];
    
    for (const [streamKey, events] of this.streamBuffer.entries()) {
      if (streamKey.startsWith(`${tenantId}:`) && events.length > 0) {
        const streamType = streamKey.split(':')[1];
        activeStreams.push({
          type: streamType,
          eventCount: events.length,
          lastEvent: events[events.length - 1]?.timestamp
        });
      }
    }
    
    return activeStreams;
  }

  private async getRecentEvents(tenantId: string, limit: number) {
    // In production, this would query the analytics_stream table
    const recentEvents = [];
    
    for (const [streamKey, events] of this.streamBuffer.entries()) {
      if (streamKey.startsWith(`${tenantId}:`)) {
        recentEvents.push(...events.slice(-limit));
      }
    }
    
    return recentEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  private getProcessingMetrics(tenantId: string) {
    const metrics = {
      totalStreams: 0,
      totalEvents: 0,
      avgProcessingTime: 0,
      errorRate: 0
    };
    
    for (const [streamKey, events] of this.streamBuffer.entries()) {
      if (streamKey.startsWith(`${tenantId}:`)) {
        metrics.totalStreams++;
        metrics.totalEvents += events.length;
      }
    }
    
    return metrics;
  }

  private async getAlertsSummary(tenantId: string) {
    // In production, this would query recent alerts from database
    return {
      totalAlerts: 0,
      highSeverity: 0,
      mediumSeverity: 0,
      lowSeverity: 0,
      recentAlerts: []
    };
  }

  private getPerformanceMetrics(tenantId: string) {
    return {
      avgResponseTime: 150, // ms
      throughput: 1000, // events/minute
      errorRate: 0.01, // 1%
      uptime: 99.9 // %
    };
  }

  private async initializeStream(tenantId: string, streamType: string, config: any) {
    const streamKey = `${tenantId}:${streamType}`;
    this.streamBuffer.set(streamKey, []);
    
    this.logger.debug(`Initialized stream: ${streamKey}`, config);
  }

  private async processBatch(tenantId: string, batch: any[]) {
    const results = [];
    
    for (const update of batch) {
      try {
        const result = await this.processAnalyticsStream(
          tenantId,
          update.streamType || 'generic',
          update.data
        );
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          data: update
        });
      }
    }
    
    return results;
  }

  private summarizeBatchResults(results: any[]) {
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      avgProcessingTime: 0
    };
    
    const successfulResults = results.filter(r => r.success && r.processingTime);
    if (successfulResults.length > 0) {
      summary.avgProcessingTime = successfulResults.reduce((sum, r) => sum + r.processingTime, 0) / successfulResults.length;
    }
    
    return summary;
  }

  private generateCostRecommendations(currentCost: number, averageCost: number): string[] {
    const recommendations = [];
    const increase = (currentCost / averageCost - 1) * 100;
    
    if (increase > 50) {
      recommendations.push('Review carrier selection - consider alternative providers');
      recommendations.push('Investigate route optimization opportunities');
    } else if (increase > 25) {
      recommendations.push('Negotiate better rates with current carriers');
      recommendations.push('Consider consolidating shipments');
    } else {
      recommendations.push('Monitor cost trends closely');
      recommendations.push('Review fuel surcharge adjustments');
    }
    
    return recommendations;
  }

  private generatePerformanceRecommendations(current: number, average: number): string[] {
    const recommendations = [];
    const drop = (1 - current / average) * 100;
    
    if (drop > 20) {
      recommendations.push('Immediate carrier performance review required');
      recommendations.push('Consider switching to backup carriers');
    } else if (drop > 10) {
      recommendations.push('Schedule carrier performance discussion');
      recommendations.push('Review delivery time expectations');
    } else {
      recommendations.push('Continue monitoring performance trends');
      recommendations.push('Provide feedback to carrier');
    }
    
    return recommendations;
  }

  private generateDemandRecommendations(current: number, average: number): string[] {
    const recommendations = [];
    const increase = (current / average - 1) * 100;
    
    if (increase > 100) {
      recommendations.push('Scale up carrier capacity immediately');
      recommendations.push('Activate contingency shipping plans');
    } else if (increase > 50) {
      recommendations.push('Contact additional carriers for capacity');
      recommendations.push('Consider premium shipping options');
    } else {
      recommendations.push('Monitor capacity requirements');
      recommendations.push('Prepare for potential capacity constraints');
    }
    
    return recommendations;
  }

  private generateRouteRecommendations(anomalyType: string, details: any): string[] {
    const recommendations = [];
    
    switch (anomalyType) {
      case 'delay':
        recommendations.push('Review route timing and traffic patterns');
        recommendations.push('Consider alternative routes');
        break;
      case 'cost_spike':
        recommendations.push('Investigate route-specific cost factors');
        recommendations.push('Compare with alternative routes');
        break;
      case 'performance_drop':
        recommendations.push('Review carrier performance on this route');
        recommendations.push('Consider route optimization');
        break;
      default:
        recommendations.push('Monitor route performance closely');
        recommendations.push('Investigate anomaly root cause');
    }
    
    return recommendations;
  }
}