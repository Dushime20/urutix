import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from '../../entities/trip.entity';
import { Driver } from '../../entities/driver.entity';
import { TripLocation } from './entities/trip-location.entity';
import {
  DriverAlert,
  AlertType,
  AlertSeverity,
} from './entities/driver-alert.entity';
import { TripEvent, TripEventType } from './entities/trip-event.entity';
import { Geofence, GeofenceType } from './entities/geofence.entity';
import { TrackingGateway } from './tracking.gateway';

interface LocationData {
  tripId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  batteryLevel?: number;
  isMoving?: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface TripStatusData {
  tripId: string;
  status: string;
  eta?: Date;
  distance?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface AlertData {
  tripId: string;
  driverId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  data?: Record<string, any>;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);
  private readonly lastLocations = new Map<string, TripLocation>();
  private readonly speedThresholds = {
    SPEEDING: 80, // km/h
    HARD_BRAKING: -15, // m/s²
    HARD_ACCELERATION: 10, // m/s²
    SHARP_TURN: 45, // degrees
  };

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(TripLocation)
    private readonly tripLocationRepository: Repository<TripLocation>,
    @InjectRepository(DriverAlert)
    private readonly driverAlertRepository: Repository<DriverAlert>,
    @InjectRepository(TripEvent)
    private readonly tripEventRepository: Repository<TripEvent>,
    @InjectRepository(Geofence)
    private readonly geofenceRepository: Repository<Geofence>,
  ) {}

  async saveLocation(locationData: LocationData): Promise<TripLocation> {
    const location = this.tripLocationRepository.create(locationData);
    const savedLocation = await this.tripLocationRepository.save(location);

    // Store last location for behavior analysis
    this.lastLocations.set(locationData.tripId, savedLocation);

    this.logger.debug(`Location saved for trip ${locationData.tripId}`);
    return savedLocation;
  }

  async getCurrentLocation(tripId: string): Promise<TripLocation | null> {
    return this.tripLocationRepository.findOne({
      where: { tripId },
      order: { timestamp: 'DESC' },
    });
  }

  async getTripStatus(tripId: string): Promise<any> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['driver', 'load', 'pickupLocation', 'deliveryLocation'],
    });

    if (!trip) return null;

    const currentLocation = await this.getCurrentLocation(tripId);
    const recentAlerts = await this.getRecentAlerts(tripId, 10);

    return {
      ...trip,
      currentLocation,
      recentAlerts,
    };
  }

  async updateTripStatus(data: TripStatusData): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id: data.tripId },
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    trip.status = data.status as unknown as Trip['status'];
    if (data.eta) trip.eta = data.eta;
    if (data.distance) trip.distance = data.distance;
    if (data.duration) trip.duration = data.duration;

    return this.tripRepository.save(trip);
  }

  async updateETA(tripId: string, locationData: LocationData): Promise<any> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['deliveryLocation'],
    });

    if (!trip || !trip.deliveryLocation) {
      return null;
    }

    // Use Location entity's latitude/longitude getters as properties
    const destLat = trip.deliveryLocation.latitude;
    const destLng = trip.deliveryLocation.longitude;

    // Calculate distance to destination
    const distance = this.calculateDistance(
      locationData.latitude,
      locationData.longitude,
      destLat,
      destLng,
    );

    // Estimate ETA based on current speed and distance
    let eta = null;
    if (locationData.speed && locationData.speed > 0) {
      const timeHours = distance / locationData.speed;
      eta = new Date(Date.now() + timeHours * 60 * 60 * 1000);
    }

    // Update trip with new ETA
    if (eta) {
      trip.eta = eta;
      trip.distance = distance;
      await this.tripRepository.save(trip);
    }

    return { eta, distance };
  }

  async checkGeofencing(locationData: LocationData): Promise<DriverAlert[]> {
    const alerts: DriverAlert[] = [];

    // Get nearby geofences
    const geofences = await this.geofenceRepository
      .createQueryBuilder('geofence')
      .where('geofence.isActive = :isActive', { isActive: true })
      .andWhere(
        'ST_DWithin(ST_MakePoint(geofence.longitude, geofence.latitude), ST_MakePoint(:lng, :lat), geofence.radius)',
        { lng: locationData.longitude, lat: locationData.latitude },
      )
      .getMany();

    for (const geofence of geofences) {
      const distance = this.calculateDistance(
        locationData.latitude,
        locationData.longitude,
        geofence.latitude,
        geofence.longitude,
      );

      if (distance <= geofence.radius) {
        // Check speed limit if set
        if (
          geofence.settings?.speedLimit &&
          locationData.speed &&
          locationData.speed > geofence.settings.speedLimit
        ) {
          alerts.push(
            await this.createAlert({
              tripId: locationData.tripId,
              driverId: locationData.driverId,
              type: AlertType.SPEEDING,
              severity: AlertSeverity.MEDIUM,
              title: 'Speed Limit Exceeded',
              message: `Speed limit of ${geofence.settings.speedLimit} km/h exceeded in ${geofence.name}`,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              speed: locationData.speed,
              data: {
                threshold: geofence.settings.speedLimit,
                actual: locationData.speed,
                geofenceId: geofence.id,
              },
            }),
          );
        }

        // Create geofence entry alert
        alerts.push(
          await this.createAlert({
            tripId: locationData.tripId,
            driverId: locationData.driverId,
            type: AlertType.GEOFENCE_VIOLATION,
            severity: AlertSeverity.LOW,
            title: `Entered ${geofence.name}`,
            message: `Vehicle entered ${geofence.type.toLowerCase()} zone: ${geofence.name}`,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            data: {
              geofenceId: geofence.id,
              geofenceType: geofence.type,
              distance,
            },
          }),
        );
      }
    }

    return alerts;
  }

  async checkDriverBehavior(
    locationData: LocationData,
  ): Promise<DriverAlert[]> {
    const alerts: DriverAlert[] = [];
    const lastLocation = this.lastLocations.get(locationData.tripId);

    if (!lastLocation) return alerts;

    // Check for speeding
    if (
      locationData.speed &&
      locationData.speed > this.speedThresholds.SPEEDING
    ) {
      alerts.push(
        await this.createAlert({
          tripId: locationData.tripId,
          driverId: locationData.driverId,
          type: AlertType.SPEEDING,
          severity: AlertSeverity.MEDIUM,
          title: 'Speeding Detected',
          message: `Vehicle speed of ${locationData.speed} km/h exceeds limit`,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          speed: locationData.speed,
          data: {
            threshold: this.speedThresholds.SPEEDING,
            actual: locationData.speed,
          },
        }),
      );
    }

    // Check for hard braking (negative acceleration)
    if (lastLocation.speed && locationData.speed) {
      const timeDiff =
        (locationData.timestamp.getTime() - lastLocation.timestamp.getTime()) /
        1000;
      if (timeDiff > 0) {
        const acceleration =
          (locationData.speed - lastLocation.speed) / timeDiff;

        if (acceleration < this.speedThresholds.HARD_BRAKING) {
          alerts.push(
            await this.createAlert({
              tripId: locationData.tripId,
              driverId: locationData.driverId,
              type: AlertType.HARD_BRAKING,
              severity: AlertSeverity.HIGH,
              title: 'Hard Braking Detected',
              message: 'Sudden deceleration detected',
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              speed: locationData.speed,
              data: {
                threshold: this.speedThresholds.HARD_BRAKING,
                actual: acceleration,
              },
            }),
          );
        }

        if (acceleration > this.speedThresholds.HARD_ACCELERATION) {
          alerts.push(
            await this.createAlert({
              tripId: locationData.tripId,
              driverId: locationData.driverId,
              type: AlertType.HARD_ACCELERATION,
              severity: AlertSeverity.MEDIUM,
              title: 'Hard Acceleration Detected',
              message: 'Sudden acceleration detected',
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              speed: locationData.speed,
              data: {
                threshold: this.speedThresholds.HARD_ACCELERATION,
                actual: acceleration,
              },
            }),
          );
        }
      }
    }

    // Check for sharp turns
    if (lastLocation.heading && locationData.heading) {
      const headingDiff = Math.abs(locationData.heading - lastLocation.heading);
      if (headingDiff > this.speedThresholds.SHARP_TURN) {
        alerts.push(
          await this.createAlert({
            tripId: locationData.tripId,
            driverId: locationData.driverId,
            type: AlertType.SHARP_TURN,
            severity: AlertSeverity.MEDIUM,
            title: 'Sharp Turn Detected',
            message: 'Sudden direction change detected',
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            data: {
              threshold: this.speedThresholds.SHARP_TURN,
              actual: headingDiff,
            },
          }),
        );
      }
    }

    // Check battery level
    if (locationData.batteryLevel && locationData.batteryLevel < 20) {
      alerts.push(
        await this.createAlert({
          tripId: locationData.tripId,
          driverId: locationData.driverId,
          type: AlertType.BATTERY_LOW,
          severity: AlertSeverity.LOW,
          title: 'Low Battery Alert',
          message: `Device battery level is ${locationData.batteryLevel}%`,
          data: {
            batteryLevel: locationData.batteryLevel,
          },
        }),
      );
    }

    return alerts;
  }

  async createAlert(alertData: AlertData): Promise<DriverAlert> {
    const alert = this.driverAlertRepository.create(alertData);
    const savedAlert = await this.driverAlertRepository.save(alert);

    // Broadcast alert to trip room
    // this.trackingGateway.broadcastAlert(alertData.tripId, savedAlert); // Removed as per edit hint

    this.logger.log(
      `Alert created: ${alertData.type} for trip ${alertData.tripId}`,
    );
    return savedAlert;
  }

  async createEmergencyAlert(alertData: AlertData): Promise<DriverAlert> {
    const emergencyAlert = this.driverAlertRepository.create({
      ...alertData,
      severity: AlertSeverity.CRITICAL,
    });

    const savedAlert = await this.driverAlertRepository.save(emergencyAlert);

    // Get trip to find tenant
    const trip = await this.tripRepository.findOne({
      where: { id: alertData.tripId },
    });

    if (trip) {
      // this.trackingGateway.broadcastEmergencyAlert(trip.tenantId, savedAlert); // Removed as per edit hint
    }

    this.logger.warn(`Emergency alert created for trip ${alertData.tripId}`);
    return savedAlert;
  }

  async createTripEvent(eventData: {
    tripId: string;
    driverId: string;
    type: TripEventType;
    title: string;
    description: string;
    data?: Record<string, any>;
  }): Promise<TripEvent> {
    const event = this.tripEventRepository.create({
      ...eventData,
    });

    const savedEvent = await this.tripEventRepository.save(event);

    this.logger.log(
      `Trip event created: ${eventData.type} for trip ${eventData.tripId}`,
    );
    return savedEvent;
  }

  async getRecentAlerts(
    tripId: string,
    limit: number = 10,
  ): Promise<DriverAlert[]> {
    return this.driverAlertRepository.find({
      where: { tripId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getTripHistory(
    tripId: string,
    hours: number = 24,
  ): Promise<TripLocation[]> {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.tripLocationRepository.find({
      where: { tripId },
      order: { timestamp: 'ASC' },
    });
  }

  async getDriverPerformance(driverId: string, days: number = 7): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const alerts = await this.driverAlertRepository.find({
      where: { driverId },
      order: { createdAt: 'DESC' },
    });

    const trips = await this.tripRepository.find({
      where: { driverId },
      order: { createdAt: 'DESC' },
    });

    return {
      totalTrips: trips.length,
      completedTrips: trips.filter((t) => t.status === 'COMPLETED').length,
      totalAlerts: alerts.length,
      alertBreakdown: this.groupAlertsByType(alerts),
      averageSpeed: this.calculateAverageSpeed(trips),
      safetyScore: this.calculateSafetyScore(alerts, trips),
    };
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private groupAlertsByType(alerts: DriverAlert[]): Record<string, number> {
    return alerts.reduce(
      (acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private calculateAverageSpeed(trips: Trip[]): number {
    // This would need to be implemented based on actual trip data
    return 0;
  }

  private calculateSafetyScore(alerts: DriverAlert[], trips: Trip[]): number {
    if (trips.length === 0) return 100;

    const criticalAlerts = alerts.filter(
      (a) => a.severity === AlertSeverity.CRITICAL,
    ).length;
    const highAlerts = alerts.filter(
      (a) => a.severity === AlertSeverity.HIGH,
    ).length;
    const mediumAlerts = alerts.filter(
      (a) => a.severity === AlertSeverity.MEDIUM,
    ).length;

    // Calculate safety score (0-100)
    const totalAlerts = criticalAlerts + highAlerts + mediumAlerts;
    const alertPenalty =
      criticalAlerts * 10 + highAlerts * 5 + mediumAlerts * 2;

    return Math.max(0, 100 - alertPenalty);
  }

  // Performance monitoring methods
  getTrackingStats(): any {
    // this.trackingGateway.getConnectedClientsCount() // Removed as per edit hint
    return {
      activeConnections: 0, // Placeholder
      driverConnections: 0, // Placeholder
      activeTripRooms: 0, // Placeholder
      lastLocationsCount: this.lastLocations.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpuUsage: 0, // Would need to implement CPU monitoring
    };
  }
}
