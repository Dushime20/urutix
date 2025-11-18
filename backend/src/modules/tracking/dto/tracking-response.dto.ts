import { ApiProperty } from '@nestjs/swagger';

export class TripLocationDto {
  @ApiProperty({
    description: 'Location ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Trip ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  tripId: string;

  @ApiProperty({
    description: 'Driver ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  driverId: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 40.7128,
  })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -74.006,
  })
  longitude: number;

  @ApiProperty({
    description: 'Vehicle speed in km/h',
    example: 65,
    required: false,
  })
  speed?: number;

  @ApiProperty({
    description: 'Vehicle heading in degrees',
    example: 180,
    required: false,
  })
  heading?: number;

  @ApiProperty({
    description: 'GPS accuracy in meters',
    example: 5,
    required: false,
  })
  accuracy?: number;

  @ApiProperty({
    description: 'Device battery level percentage',
    example: 85,
    required: false,
  })
  batteryLevel?: number;

  @ApiProperty({
    description: 'Whether vehicle is moving',
    example: true,
  })
  isMoving: boolean;

  @ApiProperty({
    description: 'Location timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}

export class DriverAlertDto {
  @ApiProperty({
    description: 'Alert ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Driver ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  driverId: string;

  @ApiProperty({
    description: 'Trip ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  tripId?: string;

  @ApiProperty({
    description: 'Alert type',
    example: 'SPEEDING',
    enum: [
      'SPEEDING',
      'HARD_BRAKING',
      'HARD_ACCELERATION',
      'SHARP_TURN',
      'EMERGENCY',
      'BATTERY_LOW',
      'GEOFENCE_VIOLATION',
    ],
  })
  type: string;

  @ApiProperty({
    description: 'Alert severity',
    example: 'MEDIUM',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  })
  severity: string;

  @ApiProperty({
    description: 'Alert status',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'],
  })
  status: string;

  @ApiProperty({
    description: 'Alert title',
    example: 'Speeding Detected',
  })
  title: string;

  @ApiProperty({
    description: 'Alert message',
    example: 'Vehicle speed of 85 km/h exceeds limit',
  })
  message: string;

  @ApiProperty({
    description: 'Alert latitude',
    example: 40.7128,
    required: false,
  })
  latitude?: number;

  @ApiProperty({
    description: 'Alert longitude',
    example: -74.006,
    required: false,
  })
  longitude?: number;

  @ApiProperty({
    description: 'Vehicle speed at time of alert',
    example: 85,
    required: false,
  })
  speed?: number;

  @ApiProperty({
    description: 'Alert creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}

export class TripStatusDto {
  @ApiProperty({
    description: 'Trip ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Trip status',
    example: 'IN_PROGRESS',
    enum: ['PENDING', 'STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  })
  status: string;

  @ApiProperty({
    description: 'Driver ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  driverId: string;

  @ApiProperty({
    description: 'Load ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  loadId: string;

  @ApiProperty({
    description: 'Estimated time of arrival',
    example: '2024-01-15T14:30:00Z',
    required: false,
  })
  eta?: Date;

  @ApiProperty({
    description: 'Distance to destination in kilometers',
    example: 150.5,
    required: false,
  })
  distance?: number;

  @ApiProperty({
    description: 'Current location',
    type: TripLocationDto,
    required: false,
  })
  currentLocation?: TripLocationDto;

  @ApiProperty({
    description: 'Recent alerts',
    type: [DriverAlertDto],
  })
  recentAlerts: DriverAlertDto[];

  @ApiProperty({
    description: 'Trip creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}

export class DriverPerformanceDto {
  @ApiProperty({
    description: 'Driver ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  driverId: string;

  @ApiProperty({
    description: 'Total number of trips',
    example: 25,
  })
  totalTrips: number;

  @ApiProperty({
    description: 'Number of completed trips',
    example: 23,
  })
  completedTrips: number;

  @ApiProperty({
    description: 'Total number of alerts',
    example: 5,
  })
  totalAlerts: number;

  @ApiProperty({
    description: 'Alert breakdown by type',
    example: {
      SPEEDING: 2,
      HARD_BRAKING: 1,
      SHARP_TURN: 1,
      BATTERY_LOW: 1,
    },
  })
  alertBreakdown: Record<string, number>;

  @ApiProperty({
    description: 'Average speed in km/h',
    example: 65.5,
  })
  averageSpeed: number;

  @ApiProperty({
    description: 'Safety score (0-100)',
    example: 85,
  })
  safetyScore: number;
}

export class TrackingStatsDto {
  @ApiProperty({
    description: 'Number of active WebSocket connections',
    example: 15,
  })
  activeConnections: number;

  @ApiProperty({
    description: 'Number of driver connections',
    example: 8,
  })
  driverConnections: number;

  @ApiProperty({
    description: 'Number of active trip rooms',
    example: 12,
  })
  activeTripRooms: number;

  @ApiProperty({
    description: 'Number of tracked locations',
    example: 150,
  })
  lastLocationsCount: number;

  @ApiProperty({
    description: 'System uptime in seconds',
    example: 86400,
  })
  uptime: number;

  @ApiProperty({
    description: 'Memory usage in MB',
    example: 256.5,
  })
  memoryUsage: number;

  @ApiProperty({
    description: 'CPU usage percentage',
    example: 15.5,
  })
  cpuUsage: number;
}
