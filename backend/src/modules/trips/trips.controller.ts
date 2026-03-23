import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TripStatus } from '../../entities/trip.entity';
import { TripsService } from './trips.service';
import { CreateTripDto, CreateTripResponseDto } from './dto/create-trip.dto';
import { UpdateTripStatusDto } from './dto/update-trip-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';
import {
  ApiResponseDto,
  PaginatedResponseDto,
} from '../../common/dto/api-response.dto';

@ApiTags('Trips')
@Controller('trips')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TENANT_ADMIN,
  UserRole.TRUCK_OWNER,
  UserRole.FLEET_MANAGER,
  UserRole.FLEET_DISPATCHER,
  UserRole.DRIVER,
)
@ApiBearerAuth('JWT-auth')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new trip',
    description:
      'Create a new cargo trip with load, truck, and driver assignments',
  })
  @ApiBody({
    type: CreateTripDto,
    description: 'Trip creation data',
  })
  @ApiCreatedResponse({
    description: 'Trip created successfully',
    type: CreateTripResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error or invalid data',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
  })
  async create(
    @Body() createTripDto: CreateTripDto,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const trip = await this.tripsService.create(
      createTripDto,
      req.user.tenantId,
    );
    return {
      success: true,
      message: 'Trip created successfully',
      data: trip,
      statusCode: 201,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all trips',
    description: 'Retrieve all trips with optional filtering and pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by trip status',
    example: 'PLANNED',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in trip number or notes',
    example: 'TRIP-2024',
  })
  @ApiOkResponse({
    description: 'Trips retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
  })
  async findAll(
    @Query() query: any,
    @Request() req,
  ): Promise<PaginatedResponseDto> {
    const result = await this.tripsService.findAll(query, req.user.tenantId);
    return {
      success: true,
      message: 'Trips retrieved successfully',
      data: result.trips,
      pagination: result.pagination,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active trips',
    description: 'Retrieve all currently active trips',
  })
  @ApiOkResponse({
    description: 'Active trips retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Active trips retrieved successfully',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'trip-uuid' },
              tripNumber: { type: 'string', example: 'TRIP-2024-001' },
              status: { type: 'string', example: 'IN_PROGRESS' },
              agreedPrice: { type: 'number', example: 2500.0 },
            },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  })
  async getActiveTrips(@Request() req): Promise<ApiResponseDto> {
    const trips = await this.tripsService.getActiveTrips(req.user.tenantId);
    return {
      success: true,
      message: 'Active trips retrieved successfully',
      data: trips,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get trip by ID',
    description: 'Retrieve a specific trip by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Trip ID',
    example: 'trip-uuid',
  })
  @ApiOkResponse({
    description: 'Trip retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Trip retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'trip-uuid' },
            tripNumber: { type: 'string', example: 'TRIP-2024-001' },
            status: { type: 'string', example: 'IN_PROGRESS' },
            agreedPrice: { type: 'number', example: 2500.0 },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Trip not found',
  })
  async findOne(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const trip = await this.tripsService.findOne(id, req.user.tenantId);
    return {
      success: true,
      message: 'Trip retrieved successfully',
      data: trip,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update trip status',
    description: 'Update the status of a specific trip',
  })
  @ApiParam({
    name: 'id',
    description: 'Trip ID',
    example: 'trip-uuid',
  })
  @ApiBody({
    type: UpdateTripStatusDto,
    description: 'Status update data',
  })
  @ApiOkResponse({
    description: 'Trip status updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Trip status updated successfully',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'trip-uuid' },
            status: { type: 'string', example: 'COMPLETED' },
            updatedAt: { type: 'string', example: '2024-01-15T10:00:00.000Z' },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Trip not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid status or validation error',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateTripStatusDto: UpdateTripStatusDto,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const trip = await this.tripsService.updateTripStatus(
      id,
      updateTripStatusDto,
      req.user.tenantId,
    );
    return {
      success: true,
      message: 'Trip status updated successfully',
      data: trip,

      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/complete')
  @ApiOperation({
    summary: 'Complete a trip',
    description: 'Mark a trip as COMPLETED',
  })
  @ApiParam({
    name: 'id',
    description: 'Trip ID',
    example: 'trip-uuid',
  })
  @ApiOkResponse({
    description: 'Trip completed successfully',
  })
  async complete(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const trip = await this.tripsService.updateTripStatus(
      id,
      { status: TripStatus.COMPLETED },
      req.user.tenantId,
    );
    return {
      success: true,
      message: 'Trip completed successfully',
      data: trip,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete trip',
    description: 'Delete a specific trip (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'Trip ID',
    example: 'trip-uuid',
  })
  @ApiOkResponse({
    description: 'Trip deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Trip deleted successfully' },
        statusCode: { type: 'number', example: 200 },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Trip not found',
  })
  async remove(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ApiResponseDto> {
    await this.tripsService.remove(id, req.user.tenantId);
    return {
      success: true,
      message: 'Trip deleted successfully',
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('analytics/summary')
  @ApiOperation({
    summary: 'Get trip analytics summary',
    description: 'Retrieve analytics summary for trips',
  })
  @ApiOkResponse({
    description: 'Trip analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Trip analytics retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
            totalTrips: { type: 'number', example: 45 },
            completedTrips: { type: 'number', example: 40 },
            inProgressTrips: { type: 'number', example: 3 },
            plannedTrips: { type: 'number', example: 2 },
            completionRate: { type: 'number', example: 88.89 },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  })
  async getAnalytics(@Request() req): Promise<ApiResponseDto> {
    const analytics = await this.tripsService.getTripAnalytics(
      req.user.tenantId,
    );
    return {
      success: true,
      message: 'Trip analytics retrieved successfully',
      data: analytics,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }
}
