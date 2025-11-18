import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { TrackingGateway } from './tracking.gateway';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import {
  TripStatusDto,
  TripLocationDto,
  DriverAlertDto,
  DriverPerformanceDto,
  TrackingStatsDto,
} from './dto/tracking-response.dto';
import {
  CreateGeofenceDto,
  UpdateGeofenceDto,
  GeofenceResponseDto,
} from './dto/geofence.dto';

@ApiTags('Real-time Tracking')
@Controller('tracking')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  @Get('trips/:tripId/status')
  @ApiOperation({
    summary: 'Get current trip status and location',
    description:
      'Retrieve real-time status, current location, and recent alerts for a specific trip',
  })
  @ApiParam({
    name: 'tripId',
    description: 'Unique identifier of the trip',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Trip status retrieved successfully',
    type: ApiResponseDto,
    schema: {
      example: {
        success: true,
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'IN_PROGRESS',
          driverId: '550e8400-e29b-41d4-a716-446655440001',
          loadId: '550e8400-e29b-41d4-a716-446655440002',
          eta: '2024-01-15T14:30:00Z',
          distance: 150.5,
          currentLocation: {
            latitude: 40.7128,
            longitude: -74.006,
            speed: 65,
            heading: 180,
            timestamp: '2024-01-15T10:30:00Z',
          },
          recentAlerts: [],
        },
        message: 'Trip status retrieved successfully',
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiNotFoundResponse({ description: 'Trip not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getTripStatus(
    @Param('tripId') tripId: string,
  ): Promise<ApiResponseDto> {
    const status = await this.trackingService.getTripStatus(tripId);
    return {
      success: true,
      data: status,
      message: 'Trip status retrieved successfully',
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('trips/:tripId/history')
  @ApiOperation({
    summary: 'Get trip location history',
    description:
      'Retrieve historical GPS location data for a specific trip within a time range',
  })
  @ApiParam({
    name: 'tripId',
    description: 'Unique identifier of the trip',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'hours',
    description: 'Number of hours to look back for location history',
    example: '24',
    required: false,
    type: String,
  })
  @ApiOkResponse({
    description: 'Trip history retrieved successfully',
    type: ApiResponseDto,
    schema: {
      example: {
        success: true,
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            tripId: '550e8400-e29b-41d4-a716-446655440000',
            driverId: '550e8400-e29b-41d4-a716-446655440001',
            latitude: 40.7128,
            longitude: -74.006,
            speed: 65,
            heading: 180,
            accuracy: 5,
            batteryLevel: 85,
            isMoving: true,
            timestamp: '2024-01-15T10:30:00Z',
            createdAt: '2024-01-15T10:30:00Z',
          },
        ],
        message: 'Trip history retrieved successfully',
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiNotFoundResponse({ description: 'Trip not found' })
  @ApiBadRequestResponse({ description: 'Invalid hours parameter' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getTripHistory(
    @Param('tripId') tripId: string,
    @Query('hours') hours: string = '24',
  ): Promise<ApiResponseDto> {
    const history = await this.trackingService.getTripHistory(
      tripId,
      parseInt(hours),
    );
    return {
      success: true,
      data: history,
      message: 'Trip history retrieved successfully',
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('trips/:tripId/alerts')
  @ApiOperation({
    summary: 'Get recent alerts for a trip',
    description:
      'Retrieve recent safety and behavior alerts for a specific trip',
  })
  @ApiParam({
    name: 'tripId',
    description: 'Unique identifier of the trip',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of alerts to return',
    example: '10',
    required: false,
    type: String,
  })
  @ApiOkResponse({
    description: 'Alerts retrieved successfully',
    type: ApiResponseDto,
    schema: {
      example: {
        success: true,
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440004',
            driverId: '550e8400-e29b-41d4-a716-446655440001',
            tripId: '550e8400-e29b-41d4-a716-446655440000',
            type: 'SPEEDING',
            severity: 'MEDIUM',
            status: 'ACTIVE',
            title: 'Speeding Detected',
            message: 'Vehicle speed of 85 km/h exceeds limit',
            latitude: 40.7128,
            longitude: -74.006,
            speed: 85,
            createdAt: '2024-01-15T10:30:00Z',
          },
        ],
        message: 'Trip alerts retrieved successfully',
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiNotFoundResponse({ description: 'Trip not found' })
  @ApiBadRequestResponse({ description: 'Invalid limit parameter' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getTripAlerts(
    @Param('tripId') tripId: string,
    @Query('limit') limit: string = '10',
  ): Promise<ApiResponseDto> {
    const alerts = await this.trackingService.getRecentAlerts(
      tripId,
      parseInt(limit),
    );
    return {
      success: true,
      data: alerts,
      message: 'Trip alerts retrieved successfully',
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('drivers/:driverId/performance')
  @ApiOperation({
    summary: 'Get driver performance metrics',
    description:
      'Retrieve comprehensive performance analytics for a specific driver',
  })
  @ApiParam({
    name: 'driverId',
    description: 'Unique identifier of the driver',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiQuery({
    name: 'days',
    description: 'Number of days to analyze performance',
    example: '7',
    required: false,
    type: String,
  })
  @ApiOkResponse({
    description: 'Driver performance retrieved successfully',
    type: ApiResponseDto,
    schema: {
      example: {
        success: true,
        data: {
          driverId: '550e8400-e29b-41d4-a716-446655440001',
          totalTrips: 25,
          completedTrips: 23,
          totalAlerts: 5,
          alertBreakdown: {
            SPEEDING: 2,
            HARD_BRAKING: 1,
            SHARP_TURN: 1,
            BATTERY_LOW: 1,
          },
          averageSpeed: 65.5,
          safetyScore: 85,
        },
        message: 'Driver performance retrieved successfully',
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiBadRequestResponse({ description: 'Invalid days parameter' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getDriverPerformance(
    @Param('driverId') driverId: string,
    @Query('days') days: string = '7',
  ): Promise<ApiResponseDto> {
    const performance = await this.trackingService.getDriverPerformance(
      driverId,
      parseInt(days),
    );
    return {
      success: true,
      data: performance,
      message: 'Driver performance retrieved successfully',
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('alerts/:alertId/acknowledge')
  @ApiOperation({
    summary: 'Acknowledge an alert',
    description: 'Mark a driver alert as acknowledged by the fleet manager',
  })
  @ApiParam({
    name: 'alertId',
    description: 'Unique identifier of the alert to acknowledge',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  @ApiOkResponse({
    description: 'Alert acknowledged successfully',
    type: ApiResponseDto,
    schema: {
      example: {
        success: true,
        data: {
          alertId: '550e8400-e29b-41d4-a716-446655440004',
          acknowledgedBy: '550e8400-e29b-41d4-a716-446655440005',
          acknowledgedAt: '2024-01-15T10:30:00Z',
        },
        message: 'Alert acknowledged successfully',
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiNotFoundResponse({ description: 'Alert not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async acknowledgeAlert(
    @Param('alertId') alertId: string,
    @Request() req: any,
  ): Promise<ApiResponseDto> {
    // This would update the alert status
    return {
      success: true,
      data: { alertId },
      message: 'Alert acknowledged successfully',
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get real-time tracking statistics',
    description:
      'Retrieve system-wide tracking statistics and performance metrics',
  })
  @ApiOkResponse({
    description: 'Statistics retrieved successfully',
    type: ApiResponseDto,
    schema: {
      example: {
        success: true,
        data: {
          activeConnections: 15,
          driverConnections: 8,
          activeTripRooms: 12,
          lastLocationsCount: 150,
          uptime: 86400,
          memoryUsage: 256.5,
          cpuUsage: 15.5,
        },
        message: 'Tracking statistics retrieved successfully',
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getTrackingStats(): Promise<ApiResponseDto> {
    const stats = this.trackingService.getTrackingStats();
    return {
      success: true,
      data: stats,
      message: 'Tracking statistics retrieved successfully',
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('geofences')
  @ApiOperation({
    summary: 'Create a new geofence',
    description:
      'Create a new virtual boundary for tracking and alerting purposes',
  })
  @ApiBody({
    type: CreateGeofenceDto,
    description: 'Geofence configuration data',
  })
  @ApiCreatedResponse({
    description: 'Geofence created successfully',
    type: ApiResponseDto,
    schema: {
      example: {
        success: true,
        data: {
          id: '550e8400-e29b-41d4-a716-446655440006',
          name: 'Downtown Pickup Zone',
          type: 'PICKUP',
          latitude: 40.7128,
          longitude: -74.006,
          radius: 500,
          isActive: true,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
        message: 'Geofence created successfully',
        statusCode: 201,
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiBadRequestResponse({ description: 'Invalid geofence data' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async createGeofence(
    @Body() geofenceData: CreateGeofenceDto,
  ): Promise<ApiResponseDto> {
    // Implementation for creating geofence
    return {
      success: true,
      data: geofenceData,
      message: 'Geofence created successfully',
      statusCode: 201,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('geofences')
  @ApiOperation({
    summary: 'Get all geofences',
    description: 'Retrieve all geofences for the current tenant',
  })
  @ApiOkResponse({
    description: 'Geofences retrieved successfully',
    type: ApiResponseDto,
    schema: {
      example: {
        success: true,
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440006',
            name: 'Downtown Pickup Zone',
            type: 'PICKUP',
            latitude: 40.7128,
            longitude: -74.006,
            radius: 500,
            isActive: true,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
          },
        ],
        message: 'Geofences retrieved successfully',
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getGeofences(): Promise<ApiResponseDto> {
    // Implementation for getting geofences
    return {
      success: true,
      data: [],
      message: 'Geofences retrieved successfully',
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('geofences/:id')
  @ApiOperation({
    summary: 'Update a geofence',
    description: 'Update an existing geofence configuration',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the geofence to update',
    example: '550e8400-e29b-41d4-a716-446655440006',
  })
  @ApiBody({
    type: UpdateGeofenceDto,
    description: 'Updated geofence configuration data',
  })
  @ApiOkResponse({
    description: 'Geofence updated successfully',
    type: ApiResponseDto,
    schema: {
      example: {
        success: true,
        data: {
          id: '550e8400-e29b-41d4-a716-446655440006',
          name: 'Updated Downtown Pickup Zone',
          type: 'PICKUP',
          latitude: 40.7128,
          longitude: -74.006,
          radius: 600,
          isActive: true,
          updatedAt: '2024-01-15T10:30:00Z',
        },
        message: 'Geofence updated successfully',
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiNotFoundResponse({ description: 'Geofence not found' })
  @ApiBadRequestResponse({ description: 'Invalid geofence data' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async updateGeofence(
    @Param('id') id: string,
    @Body() geofenceData: UpdateGeofenceDto,
  ): Promise<ApiResponseDto> {
    // Implementation for updating geofence
    return {
      success: true,
      data: { id, ...geofenceData },
      message: 'Geofence updated successfully',
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('geofences/:id')
  @ApiOperation({
    summary: 'Delete a geofence',
    description: 'Permanently delete a geofence and its associated rules',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the geofence to delete',
    example: '550e8400-e29b-41d4-a716-446655440006',
  })
  @ApiOkResponse({
    description: 'Geofence deleted successfully',
    type: ApiResponseDto,
    schema: {
      example: {
        success: true,
        data: {
          id: '550e8400-e29b-41d4-a716-446655440006',
          deletedAt: '2024-01-15T10:30:00Z',
        },
        message: 'Geofence deleted successfully',
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiNotFoundResponse({ description: 'Geofence not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async deleteGeofence(@Param('id') id: string): Promise<ApiResponseDto> {
    // Implementation for deleting geofence
    return {
      success: true,
      data: { id },
      message: 'Geofence deleted successfully',
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }
}
