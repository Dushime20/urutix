import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Load, LoadStatus } from '../../../entities/load.entity';
import { Truck } from '../../../entities/truck.entity';

export interface TrackingUpdate {
  loadId: string;
  truckId: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: Date;
  status: string;
  speed?: number;
  heading?: number;
  temperature?: number;
  humidity?: number;
  fuel?: number;
  mileage?: number;
}

export interface TrackingEvent {
  id: string;
  loadId: string;
  type:
    | 'pickup_started'
    | 'pickup_completed'
    | 'IN_TRANSIT'
    | 'delivery_started'
    | 'delivery_completed'
    | 'delay'
    | 'exception';
  description: string;
  location?: any;
  timestamp: Date;
  metadata?: any;
}

export interface GeofenceEvent {
  type: 'enter' | 'exit';
  geofenceId: string;
  geofenceName: string;
  location: any;
  timestamp: Date;
}

@Injectable()
export class LoadTrackingV2Service {
  private readonly logger = new Logger(LoadTrackingV2Service.name);
  private readonly activeTracking = new Map<string, any>();

  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
  ) {}

  /**
   * Start tracking for a load
   */
  async startTracking(loadId: string): Promise<void> {
    try {
      const load = await this.loadRepository.findOne({
        where: { id: loadId },
        relations: ['assignedTruck', 'pickupLocation', 'deliveryLocation'],
      });

      if (!load || !load.assignedTruckId) {
        throw new Error('Load not found or no truck assigned');
      }

      // Initialize tracking data
      const trackingData = {
        loadId,
        truckId: load.assignedTruckId,
        startTime: new Date(),
        status: 'tracking_started',
        pickupLocation: load.pickupLocation,
        deliveryLocation: load.deliveryLocation,
        events: [],
        geofences: await this.setupGeofences(load),
        alerts: {
          temperatureEnabled: load.requiresTemperatureMonitoring,
          gpsEnabled: load.requiresGpsMonitoring,
          delayThreshold: load.isTimeCritical ? 30 : 60, // minutes
        },
      };

      this.activeTracking.set(loadId, trackingData);

      // Enable truck tracking (placeholder)
      this.logger.log(`Enabling tracking for truck: ${load.assignedTruckId}`);

      // Set up geofences for pickup and delivery locations
      await this.setupLocationGeofences(load);

      this.logger.log(`Started tracking for load: ${loadId}`);

      // Notify stakeholders (placeholder)
      this.logger.log(
        `Sending tracking started notification for load: ${loadId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to start tracking for load ${loadId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Stop tracking for a load
   */
  async stopTracking(loadId: string): Promise<void> {
    try {
      const trackingData = this.activeTracking.get(loadId);
      if (!trackingData) {
        this.logger.warn(`No active tracking found for load: ${loadId}`);
        return;
      }

      // Disable truck tracking (placeholder)
      this.logger.log(`Disabling tracking for truck: ${trackingData.truckId}`);

      // Remove geofences
      await this.removeLocationGeofences(trackingData);

      // Archive tracking data
      await this.archiveTrackingData(loadId, trackingData);

      // Remove from active tracking
      this.activeTracking.delete(loadId);

      this.logger.log(`Stopped tracking for load: ${loadId}`);
    } catch (error) {
      this.logger.error(
        `Failed to stop tracking for load ${loadId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Process tracking update from truck
   */
  async processTrackingUpdate(update: TrackingUpdate): Promise<void> {
    try {
      const trackingData = this.activeTracking.get(update.loadId);
      if (!trackingData) {
        this.logger.warn(`No active tracking for load: ${update.loadId}`);
        return;
      }

      // Update tracking data
      trackingData.lastUpdate = update.timestamp;
      trackingData.currentLocation = update.location;
      trackingData.currentStatus = update.status;

      // Check for geofence events
      await this.checkGeofences(update, trackingData);

      // Check for alerts
      await this.checkAlerts(update, trackingData);

      // Calculate progress
      const progress = await this.calculateProgress(update, trackingData);
      trackingData.progress = progress;

      // Send real-time updates (placeholder)
      this.logger.log(`Sending real-time update for load: ${update.loadId}`);

      // Store tracking point
      await this.storeTrackingPoint(update);

      this.logger.debug(`Processed tracking update for load: ${update.loadId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process tracking update: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get current tracking status for a load
   */
  async getTrackingStatus(loadId: string): Promise<any> {
    const trackingData = this.activeTracking.get(loadId);
    if (!trackingData) {
      return {
        status: 'not_tracking',
        message: 'No active tracking for this load',
      };
    }

    const lastUpdate = trackingData.lastUpdate
      ? new Date(trackingData.lastUpdate)
      : null;
    const timeSinceUpdate = lastUpdate
      ? (new Date().getTime() - lastUpdate.getTime()) / 1000 / 60
      : null;

    return {
      status: 'tracking',
      loadId,
      truckId: trackingData.truckId,
      currentLocation: trackingData.currentLocation,
      currentStatus: trackingData.currentStatus,
      progress: trackingData.progress || 0,
      lastUpdate: lastUpdate,
      timeSinceUpdate: timeSinceUpdate,
      events: trackingData.events.slice(-10), // Last 10 events
      alerts: trackingData.activeAlerts || [],
      estimatedArrival: await this.calculateETA(trackingData),
    };
  }

  /**
   * Get tracking history for a load
   */
  async getTrackingHistory(
    loadId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    // Implementation would retrieve tracking history from database
    // This is a placeholder for the actual implementation
    return {
      loadId,
      trackingPoints: [],
      events: [],
      summary: {
        totalDistance: 0,
        totalTime: 0,
        averageSpeed: 0,
        stops: 0,
      },
    };
  }

  // Private helper methods for tracking

  private async setupGeofences(load: Load): Promise<any[]> {
    const geofences = [];

    // Pickup location geofence
    geofences.push({
      id: `pickup_${load.id}`,
      name: 'Pickup Location',
      location: load.pickupLocation,
      radius: 1000, // 1km radius
      type: 'pickup',
    });

    // Delivery location geofence
    geofences.push({
      id: `delivery_${load.id}`,
      name: 'Delivery Location',
      location: load.deliveryLocation,
      radius: 1000, // 1km radius
      type: 'delivery',
    });

    return geofences;
  }

  private async setupLocationGeofences(load: Load): Promise<void> {
    // Implementation would set up geofences with mapping service
    this.logger.log(`Setting up geofences for load: ${load.id}`);
  }

  private async removeLocationGeofences(trackingData: any): Promise<void> {
    // Implementation would remove geofences from mapping service
    this.logger.log(`Removing geofences for load: ${trackingData.loadId}`);
  }

  private async checkGeofences(
    update: TrackingUpdate,
    trackingData: any,
  ): Promise<void> {
    for (const geofence of trackingData.geofences) {
      const distance = this.calculateDistance(
        update.location.latitude,
        update.location.longitude,
        geofence.location.latitude,
        geofence.location.longitude,
      );

      if (distance <= geofence.radius / 1000) {
        // Convert to km
        await this.handleGeofenceEvent(
          {
            type: 'enter',
            geofenceId: geofence.id,
            geofenceName: geofence.name,
            location: update.location,
            timestamp: update.timestamp,
          },
          trackingData,
        );
      }
    }
  }

  private async handleGeofenceEvent(
    event: GeofenceEvent,
    trackingData: any,
  ): Promise<void> {
    // Check if this is a new event (avoid duplicates)
    const recentEvents = trackingData.events.filter(
      (e) =>
        e.type === event.type &&
        e.geofenceId === event.geofenceId &&
        new Date().getTime() - new Date(e.timestamp).getTime() < 300000, // 5 minutes
    );

    if (recentEvents.length > 0) {
      return; // Duplicate event
    }

    // Add event to tracking data
    const trackingEvent: TrackingEvent = {
      id: `${event.geofenceId}_${Date.now()}`,
      loadId: trackingData.loadId,
      type: event.geofenceId.includes('pickup')
        ? 'pickup_started'
        : 'delivery_started',
      description: `${event.type === 'enter' ? 'Arrived at' : 'Left'} ${event.geofenceName}`,
      location: event.location,
      timestamp: event.timestamp,
      metadata: { geofenceId: event.geofenceId },
    };

    trackingData.events.push(trackingEvent);

    // Send notifications (placeholder)
    this.logger.log(
      `Sending geofence event notification for load: ${trackingData.loadId}`,
    );

    this.logger.log(
      `Geofence event: ${trackingEvent.description} for load ${trackingData.loadId}`,
    );
  }

  private async checkAlerts(
    update: TrackingUpdate,
    trackingData: any,
  ): Promise<void> {
    const alerts = [];

    // Temperature alerts
    if (
      trackingData.alerts.temperatureEnabled &&
      update.temperature !== undefined
    ) {
      const load = await this.loadRepository.findOne({
        where: { id: trackingData.loadId },
      });
      if (
        load &&
        load.temperatureMin !== null &&
        load.temperatureMax !== null
      ) {
        if (
          update.temperature < load.temperatureMin ||
          update.temperature > load.temperatureMax
        ) {
          alerts.push({
            type: 'temperature_violation',
            message: `Temperature out of range: ${update.temperature}°C`,
            severity: 'high',
            timestamp: update.timestamp,
          });
        }
      }
    }

    // Speed alerts
    if (update.speed && update.speed > 120) {
      // km/h
      alerts.push({
        type: 'speeding',
        message: `Vehicle speeding: ${update.speed} km/h`,
        severity: 'medium',
        timestamp: update.timestamp,
      });
    }

    // Communication timeout alerts
    const timeSinceLastUpdate =
      (new Date().getTime() - new Date(update.timestamp).getTime()) / 1000 / 60;
    if (timeSinceLastUpdate > 30) {
      // 30 minutes
      alerts.push({
        type: 'communication_timeout',
        message: 'No communication from truck for 30 minutes',
        severity: 'high',
        timestamp: new Date(),
      });
    }

    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert, trackingData);
    }
  }

  private async processAlert(alert: any, trackingData: any): Promise<void> {
    // Add to active alerts
    if (!trackingData.activeAlerts) {
      trackingData.activeAlerts = [];
    }
    trackingData.activeAlerts.push(alert);

    // Send notifications based on severity (placeholder)
    if (alert.severity === 'high') {
      this.logger.log(
        `Sending urgent tracking alert for load: ${trackingData.loadId}`,
      );
    }

    // Log alert
    this.logger.warn(
      `Tracking alert for load ${trackingData.loadId}: ${alert.message}`,
    );
  }

  private async calculateProgress(
    update: TrackingUpdate,
    trackingData: any,
  ): Promise<number> {
    // Calculate progress based on distance traveled vs total distance
    // This is a simplified calculation
    const totalDistance = this.calculateDistance(
      trackingData.pickupLocation.latitude,
      trackingData.pickupLocation.longitude,
      trackingData.deliveryLocation.latitude,
      trackingData.deliveryLocation.longitude,
    );

    const distanceFromPickup = this.calculateDistance(
      trackingData.pickupLocation.latitude,
      trackingData.pickupLocation.longitude,
      update.location.latitude,
      update.location.longitude,
    );

    return Math.min(100, (distanceFromPickup / totalDistance) * 100);
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async calculateETA(trackingData: any): Promise<Date | null> {
    // Calculate estimated time of arrival based on current progress and speed
    // This would involve complex routing calculations
    return new Date(Date.now() + 4 * 60 * 60 * 1000); // Mock: 4 hours from now
  }

  private async storeTrackingPoint(update: TrackingUpdate): Promise<void> {
    // Store tracking point in database for historical analysis
    // Implementation would depend on your database schema
    this.logger.debug(`Storing tracking point for load: ${update.loadId}`);
  }

  private async archiveTrackingData(
    loadId: string,
    trackingData: any,
  ): Promise<void> {
    // Archive tracking data for compliance and analysis
    // Implementation would store in archive database or file system
    this.logger.log(`Archiving tracking data for load: ${loadId}`);
  }
}
