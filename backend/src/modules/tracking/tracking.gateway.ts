import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  Injectable,
  Logger,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

import { Trip } from '../../entities/trip.entity';
import { Driver } from '../../entities/driver.entity';
import { TripLocation } from './entities/trip-location.entity';
import { DriverAlert } from './entities/driver-alert.entity';
import { TripEvent } from './entities/trip-event.entity';
import { Geofence } from './entities/geofence.entity';
import { TrackingService } from './tracking.service';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { AlertType, AlertStatus } from './entities/driver-alert.entity'; // Import AlertType and AlertStatus enums
import { AlertSeverity } from './entities/driver-alert.entity';
import { TripEventType } from './entities/trip-event.entity';

// Enums for better type safety
enum TripStatus {
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PICKUP_ARRIVED = 'PICKUP_ARRIVED',
  PICKUP_COMPLETED = 'PICKUP_COMPLETED',
  DELIVERY_ARRIVED = 'DELIVERY_ARRIVED',
  DELIVERY_COMPLETED = 'DELIVERY_COMPLETED',
}

enum UserRole {
  DRIVER = 'DRIVER',
  DISPATCHER = 'DISPATCHER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

enum EmergencyType {
  ACCIDENT = 'ACCIDENT',
  BREAKDOWN = 'BREAKDOWN',
  MEDICAL = 'MEDICAL',
  SECURITY = 'SECURITY',
  OTHER = 'OTHER',
}

// Enhanced interfaces with better typing
interface AuthenticatedSocket extends Socket {
  userId: string;
  driverId?: string;
  tenantId: string;
  userRole: UserRole;
}

interface JwtPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
  driverId?: string;
}

// DTOs for validation
class LocationUpdateDto {
  @IsString()
  tripId: string;

  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  speed?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  heading?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  batteryLevel?: number;

  @IsOptional()
  @IsBoolean()
  isMoving?: boolean;

  @IsDateString()
  @Transform(({ value }) => new Date(value))
  timestamp: Date;

  @IsOptional()
  metadata?: Record<string, any>;
}

class TripStatusUpdateDto {
  @IsString()
  tripId: string;

  @IsEnum(TripStatus)
  status: TripStatus;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  eta?: Date;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  distance?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  duration?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}

class JoinTripDto {
  @IsString()
  tripId: string;
}

class AlertAcknowledgeDto {
  @IsString()
  alertId: string;
}

class LocationDto {
  @IsNumber()
  @Type(() => Number)
  lat: number;

  @IsNumber()
  @Type(() => Number)
  lng: number;
}

class EmergencyAlertDto {
  @IsString()
  tripId: string;

  @IsEnum(EmergencyType)
  type: EmergencyType;

  @IsString()
  message: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}

// Configuration interface
interface GatewayConfig {
  healthCheckInterval: number;
  maxConnections: number;
  connectionTimeout: number;
}

@WebSocketGateway({
  namespace: '/tracking',
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class TrackingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);
  private readonly connectedClients = new Map<string, AuthenticatedSocket>();
  private readonly driverConnections = new Map<string, string>();
  private readonly tripRooms = new Map<string, Set<string>>();
  private readonly config: GatewayConfig;
  private healthCheckInterval?: NodeJS.Timeout;

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
    private readonly trackingService: TrackingService,
    private readonly jwtService: JwtService,
  ) {
    this.config = {
      healthCheckInterval: parseInt(
        process.env.HEALTH_CHECK_INTERVAL || '30000',
      ),
      maxConnections: parseInt(process.env.MAX_CONNECTIONS || '1000'),
      connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT || '5000'),
    };
  }

  afterInit(server: Server): void {
    this.logger.log('Tracking Gateway initialized');
    this.setupHealthCheck();
  }

  async handleConnection(client: Socket): Promise<void> {
    const authenticatedClient = client as AuthenticatedSocket;

    try {
      if (this.connectedClients.size >= this.config.maxConnections) {
        this.logger.warn('Max connections reached, rejecting new connection');
        client.disconnect(true);
        return;
      }

      await this.authenticateClient(authenticatedClient);
      await this.registerClient(authenticatedClient);
      this.sendConnectionConfirmation(authenticatedClient);
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`, error.stack);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.cleanupClientConnection(client);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:trip')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleJoinTrip(
    @MessageBody() data: JoinTripDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const trip = await this.validateTripAccess(data.tripId, client);
      await this.joinTripRoom(client, data.tripId);
      await this.sendTripData(client, trip);

      this.logger.log(`Client ${client.id} joined trip ${data.tripId}`);
    } catch (error) {
      this.handleError(client, 'Failed to join trip', error);
    }
  }

  @SubscribeMessage('leave:trip')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleLeaveTrip(
    @MessageBody() data: JoinTripDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      await this.leaveTripRoom(client, data.tripId);
      client.emit('trip:left', { tripId: data.tripId, timestamp: new Date() });
      this.logger.log(`Client ${client.id} left trip ${data.tripId}`);
    } catch (error) {
      this.handleError(client, 'Failed to leave trip', error);
    }
  }

  @SubscribeMessage('location:update')
  @UseGuards(RateLimitGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleLocationUpdate(
    @MessageBody() data: LocationUpdateDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      this.validateDriverAccess(client);

      const result = await this.processLocationUpdate(data, client);
      this.broadcastLocationToTripRoom(data.tripId, result);
      this.sendLocationConfirmation(client, result.location.id);
    } catch (error) {
      this.handleError(client, 'Failed to update location', error);
    }
  }

  @SubscribeMessage('trip:status')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleTripStatusUpdate(
    @MessageBody() data: TripStatusUpdateDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      this.validateDriverAccess(client);

      const result = await this.processTripStatusUpdate(data, client);
      this.broadcastTripStatusToRoom(data.tripId, result);
      this.sendTripStatusConfirmation(client, result);
    } catch (error) {
      this.handleError(client, 'Failed to update trip status', error);
    }
  }

  @SubscribeMessage('alert:acknowledge')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleAlertAcknowledgment(
    @MessageBody() data: AlertAcknowledgeDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const alert = await this.acknowledgeAlert(data.alertId, client);
      this.broadcastAlertAcknowledgment(alert.tripId, alert.id, client.userId);
    } catch (error) {
      this.handleError(client, 'Failed to acknowledge alert', error);
    }
  }

  @SubscribeMessage('emergency:alert')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleEmergencyAlert(
    @MessageBody() data: EmergencyAlertDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      this.validateDriverAccess(client);

      const alert = await this.createEmergencyAlert(data, client);
      this.broadcastEmergencyToTenant(client.tenantId, alert);
      client.emit('emergency:confirmed', {
        alertId: alert.id,
        timestamp: new Date(),
      });
    } catch (error) {
      this.handleError(client, 'Failed to send emergency alert', error);
    }
  }

  // Public broadcast methods
  async broadcastLocationUpdate(tripId: string, location: any): Promise<void> {
    this.server.to(`trip:${tripId}`).emit('location:updated', {
      tripId,
      location,
      timestamp: new Date(),
    });
  }

  async broadcastTripStatus(tripId: string, status: any): Promise<void> {
    this.server.to(`trip:${tripId}`).emit('trip:status:updated', {
      tripId,
      status,
      timestamp: new Date(),
    });
  }

  async broadcastAlert(tripId: string, alert: any): Promise<void> {
    this.server.to(`trip:${tripId}`).emit('alert:created', {
      alert,
      timestamp: new Date(),
    });
  }

  async broadcastEmergencyAlert(tenantId: string, alert: any): Promise<void> {
    this.server.to(`tenant:${tenantId}`).emit('emergency:alert', {
      alert,
      timestamp: new Date(),
    });
  }

  // Getters for monitoring
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  getDriverConnectionsCount(): number {
    return this.driverConnections.size;
  }

  getActiveTripRoomsCount(): number {
    return this.tripRooms.size;
  }

  // Private helper methods
  private async authenticateClient(client: AuthenticatedSocket): Promise<void> {
    const token = this.extractToken(client);
    const payload = this.jwtService.verify<JwtPayload>(token);

    client.userId = payload.sub;
    client.tenantId = payload.tenantId;
    client.userRole = payload.role;

    if (payload.driverId) {
      client.driverId = payload.driverId;
    }
  }

  private extractToken(client: Socket): string {
    const token =
      client.handshake.auth.token ||
      client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new Error('No authentication token provided');
    }

    return token;
  }

  private async registerClient(client: AuthenticatedSocket): Promise<void> {
    this.connectedClients.set(client.id, client);

    if (client.driverId) {
      this.driverConnections.set(client.driverId, client.id);
    }

    await client.join(`tenant:${client.tenantId}`);

    this.logger.log(
      `Client connected: ${client.id} (User: ${client.userId}, Tenant: ${client.tenantId})`,
    );
  }

  private sendConnectionConfirmation(client: AuthenticatedSocket): void {
    client.emit('connection:confirmed', {
      socketId: client.id,
      userId: client.userId,
      tenantId: client.tenantId,
      timestamp: new Date(),
    });
  }

  private cleanupClientConnection(client: AuthenticatedSocket): void {
    this.connectedClients.delete(client.id);

    if (client.driverId) {
      this.driverConnections.delete(client.driverId);
    }

    this.removeFromTripRooms(client.id);
  }

  private removeFromTripRooms(socketId: string): void {
    for (const [tripId, socketIds] of this.tripRooms.entries()) {
      socketIds.delete(socketId);
      if (socketIds.size === 0) {
        this.tripRooms.delete(tripId);
      }
    }
  }

  private async validateTripAccess(
    tripId: string,
    client: AuthenticatedSocket,
  ): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['driver', 'load'],
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    if (
      trip.tenantId !== client.tenantId &&
      client.userRole !== UserRole.SUPER_ADMIN
    ) {
      throw new Error('Access denied');
    }

    return trip;
  }

  private async joinTripRoom(
    client: AuthenticatedSocket,
    tripId: string,
  ): Promise<void> {
    await client.join(`trip:${tripId}`);

    if (!this.tripRooms.has(tripId)) {
      this.tripRooms.set(tripId, new Set());
    }
    this.tripRooms.get(tripId).add(client.id);
  }

  private async leaveTripRoom(
    client: AuthenticatedSocket,
    tripId: string,
  ): Promise<void> {
    await client.leave(`trip:${tripId}`);

    const room = this.tripRooms.get(tripId);
    if (room) {
      room.delete(client.id);
      if (room.size === 0) {
        this.tripRooms.delete(tripId);
      }
    }
  }

  private async sendTripData(
    client: AuthenticatedSocket,
    trip: Trip,
  ): Promise<void> {
    const currentLocation = await this.trackingService.getCurrentLocation(
      trip.id,
    );
    const tripStatus = await this.trackingService.getTripStatus(trip.id);

    client.emit('trip:joined', {
      tripId: trip.id,
      trip: tripStatus,
      currentLocation,
      timestamp: new Date(),
    });
  }

  private validateDriverAccess(client: AuthenticatedSocket): void {
    if (!client.driverId) {
      throw new Error('Driver access required');
    }
  }

  private async processLocationUpdate(
    data: LocationUpdateDto,
    client: AuthenticatedSocket,
  ) {
    const locationData = {
      ...data,
      driverId: client.driverId,
      timestamp: data.timestamp,
    };

    const location = await this.trackingService.saveLocation(locationData);
    const geofenceAlerts =
      await this.trackingService.checkGeofencing(locationData);
    const behaviorAlerts =
      await this.trackingService.checkDriverBehavior(locationData);
    const etaUpdate = await this.trackingService.updateETA(
      data.tripId,
      locationData,
    );

    return {
      location,
      etaUpdate,
      alerts: [...geofenceAlerts, ...behaviorAlerts],
    };
  }

  private broadcastLocationToTripRoom(tripId: string, result: any): void {
    this.server.to(`trip:${tripId}`).emit('location:updated', {
      tripId,
      location: {
        latitude: result.location.latitude,
        longitude: result.location.longitude,
        speed: result.location.speed,
        heading: result.location.heading,
        timestamp: result.location.timestamp,
      },
      eta: result.etaUpdate,
      alerts: result.alerts,
      timestamp: new Date(),
    });
  }

  private sendLocationConfirmation(
    client: AuthenticatedSocket,
    locationId: string,
  ): void {
    client.emit('location:confirmed', {
      locationId,
      timestamp: new Date(),
    });
  }

  private async processTripStatusUpdate(
    data: TripStatusUpdateDto,
    client: AuthenticatedSocket,
  ) {
    const updatedTrip = await this.trackingService.updateTripStatus(data);
    const event = await this.trackingService.createTripEvent({
      tripId: data.tripId,
      driverId: client.driverId,
      type: this.getEventTypeFromStatus(data.status),
      title: `Trip ${data.status.toLowerCase()}`,
      description: `Trip status updated to ${data.status}`,
      data: {
        eta: data.eta,
        distance: data.distance,
        duration: data.duration,
      },
    });

    return { updatedTrip, event };
  }

  private broadcastTripStatusToRoom(tripId: string, result: any): void {
    this.server.to(`trip:${tripId}`).emit('trip:status:updated', {
      tripId,
      status: result.updatedTrip.status,
      event: result.event,
      timestamp: new Date(),
    });
  }

  private sendTripStatusConfirmation(
    client: AuthenticatedSocket,
    result: any,
  ): void {
    client.emit('trip:status:confirmed', {
      tripId: result.updatedTrip.id,
      status: result.updatedTrip.status,
      timestamp: new Date(),
    });
  }

  private async acknowledgeAlert(alertId: string, client: AuthenticatedSocket) {
    const alert = await this.driverAlertRepository.findOne({
      where: { id: alertId },
    });

    if (!alert) {
      throw new Error('Alert not found');
    }

    // Get the trip to check tenant access
    const trip = await this.tripRepository.findOne({
      where: { id: alert.tripId },
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    if (
      trip.tenantId !== client.tenantId &&
      client.userRole !== UserRole.SUPER_ADMIN
    ) {
      throw new Error('Access denied');
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = client.userId;

    return await this.driverAlertRepository.save(alert);
  }

  private broadcastAlertAcknowledgment(
    tripId: string,
    alertId: string,
    userId: string,
  ): void {
    this.server.to(`trip:${tripId}`).emit('alert:acknowledged', {
      alertId,
      acknowledgedBy: userId,
      timestamp: new Date(),
    });
  }
  private async createEmergencyAlert(
    data: EmergencyAlertDto,
    client: AuthenticatedSocket,
  ) {
    return await this.trackingService.createEmergencyAlert({
      tripId: data.tripId,
      driverId: client.driverId,
      type: AlertType.EMERGENCY,
      severity: AlertSeverity.CRITICAL,
      title: 'Emergency Alert',
      message: data.message,
      latitude: data.location?.lat,
      longitude: data.location?.lng,
    });
  }

  private broadcastEmergencyToTenant(tenantId: string, alert: any): void {
    this.server.to(`tenant:${tenantId}`).emit('emergency:alert', {
      alert,
      timestamp: new Date(),
    });
  }

  private handleError(
    client: AuthenticatedSocket,
    message: string,
    error: any,
  ): void {
    this.logger.error(`${message}: ${error.message}`, error.stack);
    client.emit('error', { message });
  }

  private setupHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private performHealthCheck(): void {
    const stats = {
      connectedClients: this.connectedClients.size,
      driverConnections: this.driverConnections.size,
      activeTripRooms: this.tripRooms.size,
      timestamp: new Date(),
    };

    this.logger.debug('Health check stats:', stats);
    this.server.to('admin').emit('health:stats', stats);
  }

  // Import TripEventType from the correct file at the top:
  // import { TripEventType } from @/trip-event.entity;

  private getEventTypeFromStatus(status: TripStatus): TripEventType {
    const statusMap: Record<TripStatus, TripEventType> = {
      [TripStatus.STARTED]: TripEventType.TRIP_STARTED,
      [TripStatus.COMPLETED]: TripEventType.TRIP_COMPLETED,
      [TripStatus.CANCELLED]: TripEventType.TRIP_CANCELLED,
      [TripStatus.PICKUP_ARRIVED]: TripEventType.PICKUP_ARRIVED,
      [TripStatus.PICKUP_COMPLETED]: TripEventType.PICKUP_COMPLETED,
      [TripStatus.DELIVERY_ARRIVED]: TripEventType.DELIVERY_ARRIVED,
      [TripStatus.DELIVERY_COMPLETED]: TripEventType.DELIVERY_COMPLETED,
    };
    return statusMap[status] || TripEventType.CUSTOMER_CONTACT;
  }

  // Cleanup on module destroy
  onModuleDestroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}
