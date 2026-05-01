import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Query,
  ValidationPipe,
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FleetService } from './fleet.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { CreateFleetDriverDto } from './dto/create-driver.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { AssignRouteDto } from './dto/assign-route.dto';
import { BulkAssignDto } from './dto/bulk-assign.dto';
import { CreateRouteDto } from './dto/create-route.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

@ApiTags('Fleet Management')
@ApiBearerAuth()
@Controller('fleet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TENANT_ADMIN,
  UserRole.TRUCK_OWNER,
  UserRole.FLEET_MANAGER,
  UserRole.FLEET_DISPATCHER,
  UserRole.FLEET_ACCOUNTANT,
  UserRole.FLEET_SAFETY_OFFICER,
  UserRole.DRIVER,
)
export class FleetController {
  private readonly logger = new Logger(FleetController.name);

  constructor(
    private readonly fleetService: FleetService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }

  // Truck endpoints
  @Post('trucks')
  @Roles(
    UserRole.TRUCK_OWNER,
    UserRole.TENANT_ADMIN,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER,
  )
  @ApiOperation({
    summary: 'Create a new truck',
    description: 'Creates a new truck in the fleet',
  })
  @ApiBody({ type: CreateTruckDto, description: 'Truck creation data' })
  @ApiResponse({ status: 201, description: 'Truck created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async createTruck(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    )
    createTruckDto: CreateTruckDto,
    @Request() req,
  ) {
    try {
      console.log('🚛 Create Truck Debug Info:');
      console.log('Request headers authorization:', req.headers.authorization);
      console.log('Request headers content-type:', req.headers['content-type']);
      console.log('Raw request body:', JSON.stringify(req.body, null, 2));
      console.log(
        'Parsed createTruckDto:',
        JSON.stringify(createTruckDto, null, 2),
      );
      console.log('createTruckDto type:', typeof createTruckDto);
      console.log('Request user:', req.user);
      console.log('User ID:', req.user?.userId);
      console.log('User role:', req.user?.role);
      console.log('Tenant ID:', req.user?.tenantId);

      // Validate user authentication
      if (!req.user) {
        throw new UnauthorizedException(
          'User not authenticated. Please log in.',
        );
      }

      if (!req.user.userId) {
        throw new UnauthorizedException(
          'User ID not found in authentication token.',
        );
      }

      if (!req.user.tenantId) {
        throw new BadRequestException(
          'Tenant ID not found. User must be associated with a tenant.',
        );
      }

      const truck = await this.fleetService.createTruck(
        createTruckDto,
        req.user.userId,
        req.user.tenantId,
      );

      return {
        message: 'Truck created successfully',
        truck: {
          id: truck.id,
          plateNumber: truck.plateNumber,
          make: truck.make,
          model: truck.model,
          status: truck.status,
          capacityWeight: truck.capacityWeight,
          capacityVolume: truck.capacityVolume,
        },
      };
    } catch (error) {
      console.error('❌ Error in createTruck controller:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error name:', error.name);
      if (error.response) {
        console.error('❌ Error response:', error.response);
      }

      // If it's already a NestJS HTTP exception, re-throw it
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle validation errors
      if (
        error.name === 'ValidationError' ||
        error.message?.includes('validation')
      ) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.message || 'Invalid truck data provided',
        });
      }

      // Handle database errors
      if (error.code === '23505') {
        if (error.detail?.includes('vin')) {
          throw new ConflictException('Truck with this VIN already exists');
        } else if (error.detail?.includes('plateNumber')) {
          throw new ConflictException(
            'Truck with this plate number already exists',
          );
        }
      }

      // Generic error response
      throw new InternalServerErrorException({
        message: 'Failed to create truck',
        error: error.message || 'An unexpected error occurred',
        details:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  @Get('trucks')
  @ApiOperation({
    summary: 'Get all trucks',
    description: 'Retrieves all trucks with optional filtering and pagination',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in plate number, make, model',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by truck status',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Filter by location',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
  })
  @ApiResponse({ status: 200, description: 'Trucks retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllTrucks(
    @Request() req,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('location') location?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    console.log('🚛 Fleet Controller - findAllTrucks Debug:');
    console.log('Request user:', JSON.stringify(req.user, null, 2));
    console.log('User ID:', req.user?.userId);
    console.log('User role:', req.user?.role);
    console.log('Tenant ID:', req.user?.tenantId);
    console.log('Query params:', { search, status, location, page, limit });

    // Log the exact tenant ID being used
    if (req.user?.tenantId) {
      console.log(`🔍 Searching for trucks with tenantId: "${req.user.tenantId}"`);
    }

    if (!req.user?.tenantId) {
      console.error('❌ No tenant ID found in request user');
      console.error('❌ Request user object:', JSON.stringify(req.user, null, 2));
      throw new Error('Tenant ID not found in request');
    }

    try {
      const tenantId = req.user.tenantId;
      console.log(`🔍 Controller - Calling findAllTrucks with tenantId: "${tenantId}"`);

      // Admins and fleet staff see ALL trucks in the tenant.
      // TRUCK_OWNER only sees their own trucks.
      const isStaffOrAdmin = [
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
        UserRole.TENANT_ADMIN,
        UserRole.FLEET_MANAGER,
        UserRole.FLEET_DISPATCHER,
        UserRole.FLEET_ACCOUNTANT,
        UserRole.FLEET_SAFETY_OFFICER,
      ].includes(req.user.role);

      // If staff-level or admin, pass undefined for userId to show ALL trucks in the tenant
      const filterUserId = isStaffOrAdmin ? undefined : req.user.userId;

      if (isStaffOrAdmin) {
        console.log('✅ User is Staff/Admin - showing all trucks in tenant');
      } else {
        console.log(`🔒 User is ${req.user.role} - showing only owned trucks`);
      }

      const trucks = await this.fleetService.findAllTrucks(
        tenantId,
        filterUserId,
        { search, status, location, page, limit },
      );

      console.log('✅ Controller - Trucks retrieved successfully:', trucks.length);

      const mappedTrucks = trucks.map(t => ({
        ...t,
        currentLocation: {
          ...(typeof t.currentLocation === 'object' ? t.currentLocation : {}),
          address: t.currentAddress,
        }
      }));

      return {
        message: 'Trucks retrieved successfully',
        trucks: mappedTrucks || [],
      };
    } catch (error) {
      console.error('❌ Fleet Controller - Error in findAllTrucks:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  @Get('trucks/:id')
  @ApiOperation({
    summary: 'Get truck by ID',
    description: 'Retrieves a specific truck by its ID',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Truck retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOneTruck(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    // Cargo owners can read truck info for trucks assigned to their loads
    // Only enforce ownership check for TRUCK_OWNER role
    const userId = req.user.role === 'TRUCK_OWNER' ? req.user.userId : undefined;
    const truck = await this.fleetService.findOneTruck(id, req.user.tenantId, userId);
    return {
      message: 'Truck retrieved successfully',
      truck,
    };
  }

  @Patch('trucks/:id')
  @Roles(
    UserRole.TRUCK_OWNER,
    UserRole.TENANT_ADMIN,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER,
  )
  @ApiOperation({
    summary: 'Update truck',
    description: 'Updates an existing truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiBody({ type: CreateTruckDto, description: 'Truck update data' })
  @ApiResponse({ status: 200, description: 'Truck updated successfully' })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - cannot update this truck',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTruck(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTruckDto: Partial<CreateTruckDto>,
    @Request() req,
  ) {
    const truck = await this.fleetService.updateTruck(
      id,
      updateTruckDto,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Truck updated successfully',
      truck: {
        id: truck.id,
        plateNumber: truck.plateNumber,
        make: truck.make,
        model: truck.model,
        status: truck.status,
        capacityWeight: truck.capacityWeight,
        capacityVolume: truck.capacityVolume,
      },
    };
  }

  @Delete('trucks/:id')
  @Roles(
    UserRole.TRUCK_OWNER,
    UserRole.TENANT_ADMIN,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER,
  )
  @ApiOperation({
    summary: 'Delete truck',
    description: 'Deletes a truck from the fleet',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Truck deleted successfully' })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - cannot delete this truck',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeTruck(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.fleetService.removeTruck(id, req.user.tenantId, req.user.userId);
    return {
      message: 'Truck deleted successfully',
    };
  }

  @Patch('trucks/:id/location')
  @ApiOperation({
    summary: 'Update truck location',
    description: 'Updates the current location of a truck using coordinates from a map',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Latitude coordinate' },
        longitude: { type: 'number', description: 'Longitude coordinate' },
        address: { type: 'string', description: 'Human-readable address (optional)' },
      },
      required: ['latitude', 'longitude'],
    },
    description: 'Location data',
  })
  @ApiResponse({ status: 200, description: 'Truck location updated successfully' })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 400, description: 'Invalid location data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTruckLocation(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Body() locationDto: { latitude: number; longitude: number; address?: string },
    @Request() req,
  ) {
    try {
      console.log('📍 Update Truck Location Request:', {
        truckId,
        latitude: locationDto.latitude,
        longitude: locationDto.longitude,
        address: locationDto.address,
        userId: req.user?.userId,
        tenantId: req.user?.tenantId,
      });

      // Validate user authentication
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated. Please log in.');
      }

      if (!req.user.tenantId) {
        throw new BadRequestException('Tenant ID not found. User must be associated with a tenant.');
      }

      // Validate coordinates
      if (
        typeof locationDto.latitude !== 'number' ||
        typeof locationDto.longitude !== 'number' ||
        locationDto.latitude < -90 ||
        locationDto.latitude > 90 ||
        locationDto.longitude < -180 ||
        locationDto.longitude > 180
      ) {
        throw new BadRequestException('Invalid coordinates provided. Latitude must be between -90 and 90, longitude between -180 and 180.');
      }

      const truck = await this.fleetService.updateTruckLocation(
        truckId,
        locationDto.latitude,
        locationDto.longitude,
        locationDto.address,
        req.user.tenantId,
        req.user.userId,
      );

      return {
        message: 'Truck location updated successfully',
        truck: {
          id: truck.id,
          plateNumber: truck.plateNumber,
          currentLocation: {
            ...(typeof truck.currentLocation === 'object' ? truck.currentLocation : {}),
            address: truck.currentAddress,
          },
          locationUpdatedAt: truck.locationUpdatedAt,
        },
      };
    } catch (error) {
      console.error('❌ Error in updateTruckLocation controller:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to update truck location: ${error.message || 'An unexpected error occurred'}`,
      );
    }
  }

  // Driver assignment endpoints
  @Post('trucks/:id/assign-driver')
  @ApiOperation({
    summary: 'Assign driver to truck',
    description: 'Assigns a driver to a specific truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        driverId: { type: 'string', description: 'Driver ID (UUID)' },
        notes: { type: 'string', description: 'Assignment notes (optional)' },
      },
      required: ['driverId'],
    },
    description: 'Driver assignment data',
  })
  @ApiResponse({
    status: 201,
    description: 'Driver assigned to truck successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck or driver not found' })
  @ApiResponse({
    status: 400,
    description: 'Driver already assigned to this truck',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async assignDriverToTruck(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Body() assignDriverDto: { driverId: string; notes?: string },
    @Request() req,
  ) {
    try {
      console.log('🚛 Assign Driver to Truck Request:', {
        truckId,
        driverId: assignDriverDto.driverId,
        userId: req.user?.userId,
        tenantId: req.user?.tenantId,
      });

      // Validate user authentication
      if (!req.user) {
        throw new UnauthorizedException(
          'User not authenticated. Please log in.',
        );
      }

      if (!req.user.userId) {
        throw new UnauthorizedException(
          'User ID not found in authentication token.',
        );
      }

      if (!req.user.tenantId) {
        throw new BadRequestException(
          'Tenant ID not found. User must be associated with a tenant.',
        );
      }

      // Validate request body
      if (!assignDriverDto.driverId) {
        throw new BadRequestException('Driver ID is required');
      }

      const assignment = await this.fleetService.assignDriverToTruck(
        truckId,
        assignDriverDto.driverId,
        req.user.tenantId,
        req.user.userId,
        assignDriverDto.notes,
      );

      return {
        message: 'Driver assigned to truck successfully',
        assignment,
      };
    } catch (error) {
      console.error('❌ Error in assignDriverToTruck controller:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error message:', error.message);

      // If it's already a NestJS HTTP exception, re-throw it
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle validation errors
      if (
        error.name === 'ValidationError' ||
        error.message?.includes('validation')
      ) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.message || 'Invalid assignment data provided',
        });
      }

      // Generic error response - use string message so it's properly serialized
      const errorMsg = error.message || 'An unexpected error occurred';
      throw new InternalServerErrorException(
        `Failed to assign driver to truck: ${errorMsg}`,
      );
    }
  }

  @Delete('trucks/:id/assign-driver/:driverId')
  @ApiOperation({
    summary: 'Unassign driver from truck',
    description: 'Removes a driver assignment from a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiParam({ name: 'driverId', description: 'Driver ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Driver unassigned from truck successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Truck, driver, or assignment not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unassignDriverFromTruck(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @Request() req,
  ) {
    try {
      console.log('🚛 Unassign Driver from Truck Request:', {
        truckId,
        driverId,
        userId: req.user?.userId,
        tenantId: req.user?.tenantId,
      });

      // Validate user authentication
      if (!req.user) {
        throw new UnauthorizedException(
          'User not authenticated. Please log in.',
        );
      }

      if (!req.user.userId) {
        throw new UnauthorizedException(
          'User ID not found in authentication token.',
        );
      }

      if (!req.user.tenantId) {
        throw new BadRequestException(
          'Tenant ID not found. User must be associated with a tenant.',
        );
      }

      await this.fleetService.unassignDriverFromTruck(
        truckId,
        driverId,
        req.user.tenantId,
        req.user.userId,
      );

      return {
        message: 'Driver unassigned from truck successfully',
      };
    } catch (error) {
      console.error('❌ Error in unassignDriverFromTruck controller:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error message:', error.message);

      // If it's already a NestJS HTTP exception, re-throw it
      if (error instanceof HttpException) {
        throw error;
      }

      // Generic error response - use string message so it's properly serialized
      const errorMsg = error.message || 'An unexpected error occurred';
      throw new InternalServerErrorException(
        `Failed to unassign driver from truck: ${errorMsg}`,
      );
    }
  }

  // Truck records endpoints
  @Get('trucks/:id/records')
  @ApiOperation({
    summary: 'Get truck records',
    description:
      'Retrieves all records for a specific truck (documents, maintenance, inspections, etc.)',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Truck records retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTruckRecords(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Request() req,
  ) {
    const records = await this.fleetService.getTruckRecords(
      truckId,
      req.user.tenantId,
    );
    return {
      message: 'Truck records retrieved successfully',
      records,
    };
  }

  @Post('trucks/:id/documents')
  @ApiOperation({
    summary: 'Add truck document',
    description: 'Adds a new document to a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Document name' },
        type: {
          type: 'string',
          description: 'Document type (insurance, registration, etc.)',
        },
        status: { type: 'string', description: 'Document status' },
        issueDate: {
          type: 'string',
          format: 'date',
          description: 'Issue date',
        },
        expiryDate: {
          type: 'string',
          format: 'date',
          description: 'Expiry date',
        },
        fileUrl: { type: 'string', description: 'Document file URL' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['name', 'type', 'status'],
    },
    description: 'Document data',
  })
  @ApiResponse({
    status: 201,
    description: 'Document added to truck successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addTruckDocument(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Body() documentDto: any,
    @Request() req,
  ) {
    const document = await this.fleetService.addTruckDocument(
      truckId,
      documentDto,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Document added to truck successfully',
      document,
    };
  }

  @Get('trucks/:id/maintenance')
  @ApiOperation({
    summary: 'Get truck maintenance records',
    description: 'Retrieves maintenance records for a specific truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Truck maintenance records retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTruckMaintenance(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Request() req,
  ) {
    const maintenance = await this.fleetService.getTruckMaintenance(
      truckId,
      req.user.tenantId,
    );
    return {
      message: 'Truck maintenance records retrieved successfully',
      maintenance,
    };
  }

  @Post('trucks/:id/maintenance')
  @ApiOperation({
    summary: 'Add truck maintenance record',
    description: 'Adds a new maintenance record to a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Maintenance type (preventive, corrective, etc.)',
        },
        title: { type: 'string', description: 'Maintenance title' },
        description: { type: 'string', description: 'Maintenance description' },
        date: {
          type: 'string',
          format: 'date',
          description: 'Maintenance date',
        },
        cost: { type: 'number', description: 'Maintenance cost' },
        nextDueDate: {
          type: 'string',
          format: 'date',
          description: 'Next due date',
        },
        status: { type: 'string', description: 'Maintenance status' },
        priority: { type: 'string', description: 'Priority level' },
      },
      required: ['type', 'title', 'description', 'date', 'cost'],
    },
    description: 'Maintenance record data',
  })
  @ApiResponse({
    status: 201,
    description: 'Maintenance record added successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addTruckMaintenance(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Body() maintenanceDto: any,
    @Request() req,
  ) {
    const maintenance = await this.fleetService.addTruckMaintenance(
      truckId,
      maintenanceDto,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Maintenance record added successfully',
      maintenance,
    };
  }

  @Put('trucks/:id/maintenance/:maintenanceId')
  @ApiOperation({
    summary: 'Update truck maintenance record',
    description: 'Updates an existing maintenance record for a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiParam({ name: 'maintenanceId', description: 'Maintenance record ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Maintenance type (preventive, corrective, etc.)',
        },
        title: { type: 'string', description: 'Maintenance title' },
        description: { type: 'string', description: 'Maintenance description' },
        date: {
          type: 'string',
          format: 'date',
          description: 'Maintenance date',
        },
        cost: { type: 'number', description: 'Maintenance cost' },
        nextDueDate: {
          type: 'string',
          format: 'date',
          description: 'Next due date',
        },
        status: { type: 'string', description: 'Maintenance status' },
        priority: { type: 'string', description: 'Priority level' },
        assignedTechnician: {
          type: 'string',
          description: 'Assigned technician',
        },
        location: {
          type: 'string',
          description: 'Maintenance location/garage',
        },
        mileage: { type: 'number', description: 'Vehicle mileage' },
        laborHours: { type: 'number', description: 'Labor hours' },
        notes: { type: 'string', description: 'Additional notes' },
      },
    },
    description: 'Maintenance record update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Maintenance record updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Truck or maintenance record not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTruckMaintenance(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Param('maintenanceId') maintenanceId: string,
    @Body() maintenanceDto: any,
    @Request() req,
  ) {
    const maintenance = await this.fleetService.updateTruckMaintenance(
      truckId,
      maintenanceId,
      maintenanceDto,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Maintenance record updated successfully',
      maintenance,
    };
  }

  @Delete('trucks/:id/maintenance/:maintenanceId')
  @ApiOperation({
    summary: 'Delete truck maintenance record',
    description: 'Deletes a maintenance record for a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiParam({ name: 'maintenanceId', description: 'Maintenance record ID' })
  @ApiResponse({
    status: 200,
    description: 'Maintenance record deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Truck or maintenance record not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteTruckMaintenance(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Param('maintenanceId') maintenanceId: string,
    @Request() req,
  ) {
    await this.fleetService.deleteTruckMaintenance(
      truckId,
      maintenanceId,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Maintenance record deleted successfully',
    };
  }

  @Get('trucks/:id/inspections')
  @ApiOperation({
    summary: 'Get truck inspection records',
    description: 'Retrieves all inspection records for a specific truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Truck inspection records retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTruckInspections(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Request() req,
  ) {
    const inspections = await this.fleetService.getTruckInspections(
      truckId,
      req.user.tenantId,
    );

    return {
      message: 'Truck inspection records retrieved successfully',
      inspections,
    };
  }

  @Post('trucks/:id/inspections')
  @ApiOperation({
    summary: 'Add truck inspection record',
    description: 'Adds a new inspection record to a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Inspection type (annual, safety, etc.)',
        },
        title: { type: 'string', description: 'Inspection title' },
        inspector: { type: 'string', description: 'Inspector name' },
        inspectionDate: {
          type: 'string',
          format: 'date',
          description: 'Inspection date',
        },
        nextInspectionDate: {
          type: 'string',
          format: 'date',
          description: 'Next inspection date',
        },
        status: { type: 'string', description: 'Inspection status' },
        score: { type: 'number', description: 'Inspection score (0-100)' },
        cost: { type: 'number', description: 'Inspection cost' },
        location: { type: 'string', description: 'Inspection location' },
        mileage: { type: 'number', description: 'Vehicle mileage' },
        notes: { type: 'string', description: 'Additional notes' },
        isRequired: { type: 'boolean', description: 'Is inspection required' },
      },
      required: [
        'type',
        'title',
        'inspector',
        'inspectionDate',
        'nextInspectionDate',
        'status',
      ],
    },
    description: 'Inspection record data',
  })
  @ApiResponse({
    status: 201,
    description: 'Inspection record added successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addTruckInspection(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Body() inspectionDto: any,
    @Request() req,
  ) {
    try {
      console.log('🔍 Adding inspection for truck:', truckId);
      console.log('🔍 Inspection data:', inspectionDto);

      const inspection = await this.fleetService.addTruckInspection(
        truckId,
        inspectionDto,
        req.user.tenantId,
        req.user.userId,
      );

      return {
        message: 'Inspection record added successfully',
        inspection,
      };
    } catch (error) {
      console.error('❌ Error in addTruckInspection controller:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Failed to add inspection record',
        error: error.message || 'An unexpected error occurred',
      });
    }
  }

  @Put('trucks/:id/inspections/:inspectionId')
  @ApiOperation({
    summary: 'Update truck inspection record',
    description: 'Updates an existing inspection record for a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiParam({ name: 'inspectionId', description: 'Inspection record ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Inspection type (annual, safety, etc.)',
        },
        title: { type: 'string', description: 'Inspection title' },
        inspector: { type: 'string', description: 'Inspector name' },
        inspectionDate: {
          type: 'string',
          format: 'date',
          description: 'Inspection date',
        },
        nextInspectionDate: {
          type: 'string',
          format: 'date',
          description: 'Next inspection date',
        },
        status: { type: 'string', description: 'Inspection status' },
        score: { type: 'number', description: 'Inspection score (0-100)' },
        cost: { type: 'number', description: 'Inspection cost' },
        location: { type: 'string', description: 'Inspection location' },
        mileage: { type: 'number', description: 'Vehicle mileage' },
        notes: { type: 'string', description: 'Additional notes' },
        isRequired: { type: 'boolean', description: 'Is inspection required' },
      },
    },
    description: 'Inspection record update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Inspection record updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Truck or inspection record not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTruckInspection(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Param('inspectionId') inspectionId: string,
    @Body() inspectionDto: any,
    @Request() req,
  ) {
    const inspection = await this.fleetService.updateTruckInspection(
      truckId,
      inspectionId,
      inspectionDto,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Inspection record updated successfully',
      inspection,
    };
  }

  @Delete('trucks/:id/inspections/:inspectionId')
  @ApiOperation({
    summary: 'Delete truck inspection record',
    description: 'Deletes an inspection record for a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiParam({ name: 'inspectionId', description: 'Inspection record ID' })
  @ApiResponse({
    status: 200,
    description: 'Inspection record deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Truck or inspection record not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteTruckInspection(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Param('inspectionId') inspectionId: string,
    @Request() req,
  ) {
    await this.fleetService.deleteTruckInspection(
      truckId,
      inspectionId,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Inspection record deleted successfully',
    };
  }

  @Get('trucks/:id/insurance')
  @ApiOperation({
    summary: 'Get truck insurance records',
    description: 'Retrieves all insurance records for a specific truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Truck insurance records retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTruckInsurance(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Request() req,
  ) {
    const insurance = await this.fleetService.getTruckInsurance(
      truckId,
      req.user.tenantId,
    );

    return {
      message: 'Truck insurance records retrieved successfully',
      insurance,
    };
  }

  @Post('trucks/:id/insurance')
  @ApiOperation({
    summary: 'Add truck insurance record',
    description: 'Adds a new insurance record to a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        policyNumber: { type: 'string', description: 'Policy number' },
        insuranceCompany: {
          type: 'string',
          description: 'Insurance company name',
        },
        policyType: {
          type: 'string',
          description: 'Policy type (liability, comprehensive, etc.)',
        },
        coverageAmount: { type: 'number', description: 'Coverage amount' },
        deductible: { type: 'number', description: 'Deductible amount' },
        premium: { type: 'number', description: 'Premium amount' },
        startDate: {
          type: 'string',
          format: 'date',
          description: 'Policy start date',
        },
        endDate: {
          type: 'string',
          format: 'date',
          description: 'Policy end date',
        },
        status: { type: 'string', description: 'Insurance status' },
        agent: { type: 'string', description: 'Insurance agent name' },
        agentContact: {
          type: 'string',
          description: 'Agent contact information',
        },
        autoRenewal: { type: 'boolean', description: 'Auto renewal enabled' },
        notes: { type: 'string', description: 'Additional notes' },
        documentUrl: { type: 'string', description: 'Insurance document URL' },
      },
      required: [
        'policyNumber',
        'insuranceCompany',
        'policyType',
        'coverageAmount',
        'startDate',
        'endDate',
        'status',
      ],
    },
    description: 'Insurance record data',
  })
  @ApiResponse({
    status: 201,
    description: 'Insurance record added successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addTruckInsurance(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Body() insuranceDto: any,
    @Request() req,
  ) {
    try {
      console.log('🛡️ Adding insurance for truck:', truckId);
      console.log('🛡️ Insurance data:', insuranceDto);

      const insurance = await this.fleetService.addTruckInsurance(
        truckId,
        insuranceDto,
        req.user.tenantId,
        req.user.userId,
      );

      return {
        message: 'Insurance record added successfully',
        insurance,
      };
    } catch (error) {
      console.error('❌ Error in addTruckInsurance controller:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Failed to add insurance record',
        error: error.message || 'An unexpected error occurred',
      });
    }
  }

  @Put('trucks/:id/insurance/:insuranceId')
  @ApiOperation({
    summary: 'Update truck insurance record',
    description: 'Updates an existing insurance record for a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiParam({ name: 'insuranceId', description: 'Insurance record ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        policyNumber: { type: 'string', description: 'Policy number' },
        insuranceCompany: {
          type: 'string',
          description: 'Insurance company name',
        },
        policyType: { type: 'string', description: 'Policy type' },
        coverageAmount: { type: 'number', description: 'Coverage amount' },
        deductible: { type: 'number', description: 'Deductible amount' },
        premium: { type: 'number', description: 'Premium amount' },
        startDate: {
          type: 'string',
          format: 'date',
          description: 'Policy start date',
        },
        endDate: {
          type: 'string',
          format: 'date',
          description: 'Policy end date',
        },
        status: { type: 'string', description: 'Insurance status' },
        agent: { type: 'string', description: 'Insurance agent name' },
        agentContact: {
          type: 'string',
          description: 'Agent contact information',
        },
        autoRenewal: { type: 'boolean', description: 'Auto renewal enabled' },
        notes: { type: 'string', description: 'Additional notes' },
        documentUrl: { type: 'string', description: 'Insurance document URL' },
      },
    },
    description: 'Insurance record update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Insurance record updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Truck or insurance record not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTruckInsurance(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Param('insuranceId') insuranceId: string,
    @Body() insuranceDto: any,
    @Request() req,
  ) {
    const insurance = await this.fleetService.updateTruckInsurance(
      truckId,
      insuranceId,
      insuranceDto,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Insurance record updated successfully',
      insurance,
    };
  }

  @Delete('trucks/:id/insurance/:insuranceId')
  @ApiOperation({
    summary: 'Delete truck insurance record',
    description: 'Deletes an insurance record for a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiParam({ name: 'insuranceId', description: 'Insurance record ID' })
  @ApiResponse({
    status: 200,
    description: 'Insurance record deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Truck or insurance record not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteTruckInsurance(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Param('insuranceId') insuranceId: string,
    @Request() req,
  ) {
    await this.fleetService.deleteTruckInsurance(
      truckId,
      insuranceId,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Insurance record deleted successfully',
    };
  }

  @Get('trucks/:id/fuel')
  @ApiOperation({
    summary: 'Get truck fuel records',
    description: 'Retrieves all fuel records for a specific truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Truck fuel records retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTruckFuel(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Request() req,
  ) {
    const fuel = await this.fleetService.getTruckFuel(
      truckId,
      req.user.tenantId,
    );

    return {
      message: 'Truck fuel records retrieved successfully',
      fuel,
    };
  }

  @Post('trucks/:id/fuel')
  @ApiOperation({
    summary: 'Add truck fuel record',
    description: 'Adds a new fuel record to a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          format: 'date',
          description: 'Fuel purchase date',
        },
        fuelType: {
          type: 'string',
          description: 'Fuel type (diesel, gasoline, electric, hybrid)',
        },
        quantity: {
          type: 'number',
          description: 'Fuel quantity (gallons/liters)',
        },
        cost: { type: 'number', description: 'Total fuel cost' },
        mileage: {
          type: 'number',
          description: 'Vehicle mileage at time of purchase',
        },
        location: { type: 'string', description: 'Fuel purchase location' },
        fuelEfficiency: {
          type: 'number',
          description: 'Fuel efficiency (mpg)',
        },
        driver: { type: 'string', description: 'Driver name' },
        receipt: { type: 'string', description: 'Receipt URL or reference' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['date', 'fuelType', 'quantity', 'cost', 'mileage', 'location'],
    },
    description: 'Fuel record data',
  })
  @ApiResponse({
    status: 201,
    description: 'Fuel record added successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addTruckFuel(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Body() fuelDto: any,
    @Request() req,
  ) {
    try {
      console.log('⛽ Adding fuel record for truck:', truckId);
      console.log('⛽ Fuel data:', fuelDto);

      const fuel = await this.fleetService.addTruckFuel(
        truckId,
        fuelDto,
        req.user.tenantId,
        req.user.userId,
      );

      return {
        message: 'Fuel record added successfully',
        fuel,
      };
    } catch (error) {
      console.error('❌ Error in addTruckFuel controller:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Failed to add fuel record',
        error: error.message || 'An unexpected error occurred',
      });
    }
  }

  @Put('trucks/:id/fuel/:fuelId')
  @ApiOperation({
    summary: 'Update truck fuel record',
    description: 'Updates an existing fuel record for a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiParam({ name: 'fuelId', description: 'Fuel record ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          format: 'date',
          description: 'Fuel purchase date',
        },
        fuelType: {
          type: 'string',
          description: 'Fuel type (diesel, gasoline, electric, hybrid)',
        },
        quantity: {
          type: 'number',
          description: 'Fuel quantity (gallons/liters)',
        },
        cost: { type: 'number', description: 'Total fuel cost' },
        mileage: {
          type: 'number',
          description: 'Vehicle mileage at time of purchase',
        },
        location: { type: 'string', description: 'Fuel purchase location' },
        fuelEfficiency: {
          type: 'number',
          description: 'Fuel efficiency (mpg)',
        },
        driver: { type: 'string', description: 'Driver name' },
        receipt: { type: 'string', description: 'Receipt URL or reference' },
        notes: { type: 'string', description: 'Additional notes' },
      },
    },
    description: 'Fuel record update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Fuel record updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck or fuel record not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTruckFuel(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Param('fuelId') fuelId: string,
    @Body() fuelDto: any,
    @Request() req,
  ) {
    const fuel = await this.fleetService.updateTruckFuel(
      truckId,
      fuelId,
      fuelDto,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Fuel record updated successfully',
      fuel,
    };
  }

  @Delete('trucks/:id/fuel/:fuelId')
  @ApiOperation({
    summary: 'Delete truck fuel record',
    description: 'Deletes a fuel record for a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiParam({ name: 'fuelId', description: 'Fuel record ID' })
  @ApiResponse({
    status: 200,
    description: 'Fuel record deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck or fuel record not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteTruckFuel(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Param('fuelId') fuelId: string,
    @Request() req,
  ) {
    await this.fleetService.deleteTruckFuel(
      truckId,
      fuelId,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Fuel record deleted successfully',
    };
  }

  @Get('trucks/:id/tires')
  @ApiOperation({
    summary: 'Get truck tire records',
    description: 'Retrieves all tire records for a specific truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Truck tire records retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTruckTires(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Request() req,
  ) {
    const tires = await this.fleetService.getTruckTires(
      truckId,
      req.user.tenantId,
    );

    return {
      message: 'Truck tire records retrieved successfully',
      tires,
    };
  }

  @Post('trucks/:id/tires')
  @ApiOperation({
    summary: 'Add truck tire record',
    description: 'Adds a new tire record to a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        position: {
          type: 'string',
          enum: [
            'front_left',
            'front_right',
            'rear_left',
            'rear_right',
            'spare',
          ],
          description: 'Tire position',
        },
        brand: { type: 'string', description: 'Tire brand' },
        model: { type: 'string', description: 'Tire model' },
        size: { type: 'string', description: 'Tire size' },
        serialNumber: { type: 'string', description: 'Tire serial number' },
        installationDate: {
          type: 'string',
          format: 'date',
          description: 'Installation date',
        },
        expectedLifespan: {
          type: 'number',
          description: 'Expected lifespan in miles',
        },
        currentMileage: { type: 'number', description: 'Current mileage' },
        treadDepth: {
          type: 'number',
          description: 'Tread depth in 32nds of an inch',
        },
        pressure: { type: 'number', description: 'Tire pressure in PSI' },
        status: {
          type: 'string',
          enum: ['good', 'fair', 'poor', 'replaced'],
          description: 'Tire status',
        },
        replacementDate: {
          type: 'string',
          format: 'date',
          description: 'Replacement date',
        },
        cost: { type: 'number', description: 'Tire cost' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: [
        'position',
        'brand',
        'model',
        'size',
        'installationDate',
        'expectedLifespan',
        'currentMileage',
        'treadDepth',
        'pressure',
        'status',
      ],
    },
    description: 'Tire record data',
  })
  @ApiResponse({
    status: 201,
    description: 'Tire record added successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addTruckTire(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Body() tireDto: any,
    @Request() req,
  ) {
    try {
      console.log('🛞 Adding tire record for truck:', truckId);
      console.log('🛞 Tire data:', tireDto);

      const tire = await this.fleetService.addTruckTire(
        truckId,
        tireDto,
        req.user.tenantId,
        req.user.userId,
      );

      return {
        message: 'Tire record added successfully',
        tire,
      };
    } catch (error) {
      console.error('❌ Error in addTruckTire controller:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Failed to add tire record',
        error: error.message || 'An unexpected error occurred',
      });
    }
  }

  @Put('trucks/:id/tires/:tireId')
  @ApiOperation({
    summary: 'Update truck tire record',
    description: 'Updates an existing tire record for a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiParam({ name: 'tireId', description: 'Tire record ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        position: {
          type: 'string',
          enum: [
            'front_left',
            'front_right',
            'rear_left',
            'rear_right',
            'spare',
          ],
          description: 'Tire position',
        },
        brand: { type: 'string', description: 'Tire brand' },
        model: { type: 'string', description: 'Tire model' },
        size: { type: 'string', description: 'Tire size' },
        serialNumber: { type: 'string', description: 'Tire serial number' },
        installationDate: {
          type: 'string',
          format: 'date',
          description: 'Installation date',
        },
        expectedLifespan: {
          type: 'number',
          description: 'Expected lifespan in miles',
        },
        currentMileage: { type: 'number', description: 'Current mileage' },
        treadDepth: {
          type: 'number',
          description: 'Tread depth in 32nds of an inch',
        },
        pressure: { type: 'number', description: 'Tire pressure in PSI' },
        status: {
          type: 'string',
          enum: ['good', 'fair', 'poor', 'replaced'],
          description: 'Tire status',
        },
        replacementDate: {
          type: 'string',
          format: 'date',
          description: 'Replacement date',
        },
        cost: { type: 'number', description: 'Tire cost' },
        notes: { type: 'string', description: 'Additional notes' },
      },
    },
    description: 'Tire record update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Tire record updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck or tire record not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTruckTire(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Param('tireId') tireId: string,
    @Body() tireDto: any,
    @Request() req,
  ) {
    const tire = await this.fleetService.updateTruckTire(
      truckId,
      tireId,
      tireDto,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Tire record updated successfully',
      tire,
    };
  }

  @Delete('trucks/:id/tires/:tireId')
  @ApiOperation({
    summary: 'Delete truck tire record',
    description: 'Deletes a tire record for a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiParam({ name: 'tireId', description: 'Tire record ID' })
  @ApiResponse({
    status: 200,
    description: 'Tire record deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck or tire record not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteTruckTire(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Param('tireId') tireId: string,
    @Request() req,
  ) {
    await this.fleetService.deleteTruckTire(
      truckId,
      tireId,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Tire record deleted successfully',
    };
  }

  @Get('trucks/:id/compliance')
  @ApiOperation({
    summary: 'Get truck compliance records',
    description: 'Retrieves all compliance records for a specific truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Truck compliance records retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTruckCompliance(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Request() req,
  ) {
    const compliance = await this.fleetService.getTruckCompliance(
      truckId,
      req.user.tenantId,
    );

    return {
      message: 'Truck compliance records retrieved successfully',
      compliance,
    };
  }

  @Post('trucks/:id/compliance')
  @ApiOperation({
    summary: 'Add truck compliance record',
    description: 'Adds a new compliance record to a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        regulation: { type: 'string', description: 'Regulation name' },
        requirement: { type: 'string', description: 'Compliance requirement' },
        dueDate: {
          type: 'string',
          format: 'date',
          description: 'Due date for compliance',
        },
        status: {
          type: 'string',
          enum: [
            'compliant',
            'non_compliant',
            'warning',
            'critical',
            'pending',
          ],
          description: 'Compliance status',
        },
        lastChecked: {
          type: 'string',
          format: 'date',
          description: 'Last check date',
        },
        nextCheck: {
          type: 'string',
          format: 'date',
          description: 'Next check date',
        },
        responsibleParty: { type: 'string', description: 'Responsible party' },
        documentation: {
          type: 'array',
          items: { type: 'string' },
          description: 'Documentation URLs',
        },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: [
        'regulation',
        'requirement',
        'dueDate',
        'status',
        'lastChecked',
        'nextCheck',
        'responsibleParty',
      ],
    },
    description: 'Compliance record data',
  })
  @ApiResponse({
    status: 201,
    description: 'Compliance record added successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addTruckCompliance(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Body() complianceDto: any,
    @Request() req,
  ) {
    try {
      console.log('📋 Adding compliance record for truck:', truckId);
      console.log('📋 Compliance data:', complianceDto);

      const compliance = await this.fleetService.addTruckCompliance(
        truckId,
        complianceDto,
        req.user.tenantId,
        req.user.userId,
      );

      return {
        message: 'Compliance record added successfully',
        compliance,
      };
    } catch (error) {
      console.error('❌ Error in addTruckCompliance controller:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Failed to add compliance record',
        error: error.message || 'An unexpected error occurred',
      });
    }
  }

  @Put('trucks/:id/compliance/:complianceId')
  @ApiOperation({
    summary: 'Update truck compliance record',
    description: 'Updates an existing compliance record for a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiParam({ name: 'complianceId', description: 'Compliance record ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        regulation: { type: 'string', description: 'Regulation name' },
        requirement: { type: 'string', description: 'Compliance requirement' },
        dueDate: {
          type: 'string',
          format: 'date',
          description: 'Due date for compliance',
        },
        status: {
          type: 'string',
          enum: [
            'compliant',
            'non_compliant',
            'warning',
            'critical',
            'pending',
          ],
          description: 'Compliance status',
        },
        lastChecked: {
          type: 'string',
          format: 'date',
          description: 'Last check date',
        },
        nextCheck: {
          type: 'string',
          format: 'date',
          description: 'Next check date',
        },
        responsibleParty: { type: 'string', description: 'Responsible party' },
        documentation: {
          type: 'array',
          items: { type: 'string' },
          description: 'Documentation URLs',
        },
        notes: { type: 'string', description: 'Additional notes' },
      },
    },
    description: 'Compliance record update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Compliance record updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Truck or compliance record not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTruckCompliance(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Param('complianceId') complianceId: string,
    @Body() complianceDto: any,
    @Request() req,
  ) {
    const compliance = await this.fleetService.updateTruckCompliance(
      truckId,
      complianceId,
      complianceDto,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Compliance record updated successfully',
      compliance,
    };
  }

  // Driver endpoints
  @Post('drivers')
  @ApiOperation({
    summary: 'Create a new driver',
    description:
      'Creates a new driver in the fleet with comprehensive information including license, certifications, and employment details',
  })
  @ApiBody({ type: CreateFleetDriverDto, description: 'Driver creation data' })
  @ApiResponse({
    status: 201,
    description: 'Driver created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Driver created successfully' },
        driver: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            status: {
              type: 'string',
              enum: [
                'ACTIVE',
                'INACTIVE',
                'SUSPENDED',
                'ON_LEAVE',
                'TERMINATED',
                'IN_TRANSIT',
              ],
            },
            licenseNumber: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict - driver with same license number or user already exists',
  })
  async createDriver(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    )
    createDriverDto: CreateFleetDriverDto,
    @Request() req,
  ) {
    try {
      console.log('👤 Creating driver request:', {
        driverData: createDriverDto,
        email: createDriverDto.email,
        firstName: createDriverDto.firstName,
        lastName: createDriverDto.lastName,
        phone: createDriverDto.phone,
        userId: req.user?.userId,
        tenantId: req.user?.tenantId,
      });

      // Validate email is provided
      if (!createDriverDto.email || createDriverDto.email.trim() === '') {
        throw new BadRequestException(
          'Email address is required to create a driver account. Please provide a valid email address.',
        );
      }

      // Validate user authentication
      if (!req.user) {
        throw new UnauthorizedException(
          'User not authenticated. Please log in.',
        );
      }
      if (!req.user.userId) {
        throw new UnauthorizedException(
          'User ID not found in authentication token.',
        );
      }
      if (!req.user.tenantId) {
        throw new BadRequestException(
          'Tenant ID not found. User must be associated with a tenant.',
        );
      }

      const driver = await this.fleetService.createDriver(
        createDriverDto,
        req.user.userId,
        req.user.tenantId,
      );

      console.log('✅ Driver created successfully:', driver.id);

      return {
        message: 'Driver created successfully',
        driver: {
          id: driver.id,
          firstName: driver.firstName,
          lastName: driver.lastName,
          email: driver.email,
          status: driver.status,
          licenseNumber: driver.licenseNumber,
        },
      };
    } catch (error) {
      console.error('❌ Error in createDriver controller:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);

      // Re-throw known exceptions
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle validation errors
      if (
        error.name === 'ValidationError' ||
        error.message?.includes('validation')
      ) {
        throw new BadRequestException({
          message: 'Validation failed',
          error: error.message || 'Invalid driver data provided',
        });
      }

      // Handle database constraint violations
      if (error.code === '23505') {
        // Unique constraint violation
        const detail = error.detail || '';
        if (
          detail.includes('licenseNumber') ||
          detail.includes('license_number')
        ) {
          throw new ConflictException(
            'A driver with this license number already exists',
          );
        }
        if (detail.includes('email')) {
          throw new ConflictException(
            'A driver with this email already exists',
          );
        }
        throw new ConflictException(
          'A driver with these details already exists',
        );
      }

      // Handle data too long errors
      if (error.code === '22001') {
        throw new BadRequestException(
          'One or more fields exceed maximum length',
        );
      }

      // Generic error
      throw new InternalServerErrorException({
        message: 'Failed to create driver',
        error: error.message || 'An unexpected error occurred',
        details:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  @Get('drivers')
  @ApiOperation({
    summary: 'Get all drivers',
    description:
      'Retrieves all drivers with optional filtering and pagination. Supports search, status filtering, location filtering, and pagination.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in first name, last name, license number',
    example: 'john',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by driver status',
    enum: [
      'ACTIVE',
      'INACTIVE',
      'SUSPENDED',
      'ON_LEAVE',
      'TERMINATED',
      'IN_TRANSIT',
    ],
    example: 'ACTIVE',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Filter by location (city, state, or coordinates)',
    example: 'New York',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination (starts from 1)',
    example: 1,
    schema: { type: 'integer', minimum: 1 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (max 100)',
    example: 20,
    schema: { type: 'integer', minimum: 1, maximum: 100 },
  })
  @ApiResponse({
    status: 200,
    description: 'Drivers retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Drivers retrieved successfully' },
        drivers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
              status: {
                type: 'string',
                enum: [
                  'ACTIVE',
                  'INACTIVE',
                  'SUSPENDED',
                  'ON_LEAVE',
                  'TERMINATED',
                  'IN_TRANSIT',
                ],
              },
              licenseNumber: { type: 'string' },
              employmentType: {
                type: 'string',
                enum: [
                  'FULL_TIME',
                  'PART_TIME',
                  'CONTRACT',
                  'OWNER_OPERATOR',
                  'FREELANCE',
                ],
              },
              rating: { type: 'number', minimum: 0, maximum: 5 },
              safetyScore: { type: 'number', minimum: 0, maximum: 100 },
              currentLocation: {
                type: 'object',
                description: 'GPS coordinates',
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER,
    UserRole.FLEET_ACCOUNTANT,
    UserRole.FLEET_SAFETY_OFFICER,
    UserRole.DRIVER,
  )
  async findAllDrivers(
    @Request() req,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('location') location?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    console.log('👤 Fleet Controller - findAllDrivers Debug:');
    console.log('Request user:', JSON.stringify(req.user, null, 2));
    console.log('User ID:', req.user?.userId);
    console.log('User role:', req.user?.role);
    console.log('Tenant ID:', req.user?.tenantId);
    console.log('Query params:', { search, status, location, page, limit });

    if (!req.user?.tenantId) {
      console.error('❌ No tenant ID found in request user');
      throw new BadRequestException('Tenant ID not found in request');
    }

    const drivers = await this.fleetService.findAllDrivers(
      req.user.tenantId,
      req.user.userId,
      { search, status, location, page, limit },
      req.user.role, // Pass user role to service
    );

    console.log(`✅ Found ${drivers.length} drivers for tenant ${req.user.tenantId}`);

    return {
      message: 'Drivers retrieved successfully',
      drivers,
    };
  }

  @Get('drivers/me')
  @Roles(
    UserRole.DRIVER,
    UserRole.FLEET_MANAGER,
    UserRole.TENANT_ADMIN,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get current driver profile (fleet path)',
    description: 'Retrieve detailed information about the currently logged-in driver through the fleet endpoint',
  })
  @ApiResponse({ status: 200, description: 'Driver profile retrieved successfully' })
  async getDriverMe(@Request() req) {
    const driver = await this.fleetService.findDriverByUserId(req.user.userId);
    return {
      message: 'Driver profile retrieved successfully',
      driver,
    };
  }

  @Get('drivers/leaderboard')
  @ApiOperation({
    summary: 'Get driver leaderboard',
    description: 'Retrieves a ranked list of drivers based on performance metrics (safety score, distance, reliability)',
  })
  @ApiQuery({ name: 'period', enum: ['WEEKLY', 'MONTHLY', 'YEARLY', 'ALL_TIME'], required: false })
  @ApiResponse({ status: 200, description: 'Leaderboard retrieved successfully' })
  async getDriverLeaderboard(
    @Request() req,
    @Query('period') period: string = 'MONTHLY',
  ) {
    const leaderboard = await this.fleetService.getDriverLeaderboard(
      req.user.tenantId,
      period,
    );
    return {
      message: 'Leaderboard retrieved successfully',
      leaderboard,
    };
  }

  @Get('drivers/:id')
  @ApiOperation({
    summary: 'Get driver by ID',
    description:
      'Retrieves detailed information about a specific driver including profile, license, certifications, and performance metrics',
  })
  @ApiParam({
    name: 'id',
    description: 'Driver ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Driver retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Driver retrieved successfully' },
        driver: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            dateOfBirth: { type: 'string', format: 'date' },
            address: { type: 'string' },
            licenseNumber: { type: 'string' },
            licenseExpiry: { type: 'string', format: 'date' },
            status: {
              type: 'string',
              enum: [
                'ACTIVE',
                'INACTIVE',
                'SUSPENDED',
                'ON_LEAVE',
                'TERMINATED',
                'IN_TRANSIT',
              ],
            },
            employmentType: {
              type: 'string',
              enum: [
                'FULL_TIME',
                'PART_TIME',
                'CONTRACT',
                'OWNER_OPERATOR',
                'FREELANCE',
              ],
            },
            rating: { type: 'number', minimum: 0, maximum: 5 },
            safetyScore: { type: 'number', minimum: 0, maximum: 100 },
            totalTrips: { type: 'number' },
            totalDistance: { type: 'number' },
            totalEarnings: { type: 'number' },
            currentLocation: { type: 'object', description: 'GPS coordinates' },
            certifications: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER,
    UserRole.FLEET_ACCOUNTANT,
    UserRole.FLEET_SAFETY_OFFICER,
    UserRole.DRIVER,
  )
  async findOneDriver(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const driver = await this.fleetService.findOneDriver(
      id,
      req.user.tenantId,
      req.user.userId,
      req.user.role,
    );
    return {
      message: 'Driver retrieved successfully',
      driver,
    };
  }

  @Get('drivers/:id/stats')
  @ApiOperation({
    summary: 'Get driver statistics',
    description: 'Retrieves performance statistics for a specific driver',
  })
  @ApiParam({
    name: 'id',
    description: 'Driver ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Driver statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        stats: {
          type: 'object',
          properties: {
            totalTrips: { type: 'number' },
            totalEarnings: { type: 'number' },
            rating: { type: 'number' },
            onTimeDeliveryRate: { type: 'number' },
            safetyScore: { type: 'number' },
            hoursWorkedThisWeek: { type: 'number' },
            milesThisWeek: { type: 'number' },
            fuelEfficiency: { type: 'number' },
            completedTrips: { type: 'number' },
            cancelledTrips: { type: 'number' },
            averageRating: { type: 'number' },
            totalDistance: { type: 'number' },
            totalFuelUsed: { type: 'number' },
            averageSpeed: { type: 'number' },
            violationsCount: { type: 'number' },
            lastTripDate: { type: 'string', nullable: true },
            nextTripDate: { type: 'string', nullable: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER,
    UserRole.FLEET_ACCOUNTANT,
    UserRole.FLEET_SAFETY_OFFICER,
    UserRole.DRIVER,
  )
  async getDriverStats(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const stats = await this.fleetService.getDriverStats(
      id,
      req.user.tenantId,
      req.user.userId,
      req.user.role,
    );
    return {
      message: 'Driver statistics retrieved successfully',
      stats,
    };
  }

  @Patch('drivers/:id')
  @ApiOperation({
    summary: 'Update driver',
    description:
      'Updates an existing driver. Only provided fields will be updated. Cannot update driver if currently on a trip.',
  })
  @ApiParam({
    name: 'id',
    description: 'Driver ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @ApiBody({
    type: CreateFleetDriverDto,
    description: 'Driver update data - only provided fields will be updated',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Driver updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Driver updated successfully' },
        driver: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            status: {
              type: 'string',
              enum: [
                'ACTIVE',
                'INACTIVE',
                'SUSPENDED',
                'ON_LEAVE',
                'TERMINATED',
                'IN_TRANSIT',
              ],
            },
            licenseNumber: { type: 'string' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data or driver on trip',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - cannot update this driver',
  })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - driver with same license number already exists',
  })
  async updateDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDriverDto: Partial<CreateFleetDriverDto>,
    @Request() req,
  ) {
    const driver = await this.fleetService.updateDriver(
      id,
      updateDriverDto,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Driver updated successfully',
      driver: {
        id: driver.id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        status: driver.status,
        licenseNumber: driver.licenseNumber,
      },
    };
  }

  @Delete('drivers/:id')
  @ApiOperation({
    summary: 'Delete driver',
    description:
      'Soft deletes a driver from the fleet. Driver cannot be deleted if currently on a trip or has active assignments.',
  })
  @ApiParam({
    name: 'id',
    description: 'Driver ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Driver deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Driver deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - cannot delete driver on trip or with active assignments',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - cannot delete this driver',
  })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async removeDriver(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.fleetService.removeDriver(
      id,
      req.user.tenantId,
      req.user.userId,
    );
    return {
      message: 'Driver deleted successfully',
    };
  }

  // Route endpoints
  @Post('routes')
  @ApiOperation({
    summary: 'Create a new route',
    description: 'Creates a new route in the fleet',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Route name' },
        origin: { type: 'string', description: 'Route origin' },
        destination: { type: 'string', description: 'Route destination' },
        distance: { type: 'number', description: 'Route distance in kilometers' },
        estimatedTime: {
          type: 'number',
          description: 'Estimated time in hours',
        },
        routeType: { 
          type: 'string', 
          enum: ['highway', 'city', 'rural', 'mixed'],
          description: 'Route type' 
        },
        status: { 
          type: 'string', 
          enum: ['active', 'inactive', 'maintenance'],
          description: 'Route status' 
        },
        description: { type: 'string', description: 'Route description' },
      },
      required: ['name', 'origin', 'destination', 'distance', 'estimatedTime'],
    },
    description: 'Route creation data',
  })
  @ApiResponse({ status: 201, description: 'Route created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createRoute(@Body() createRouteDto: CreateRouteDto, @Request() req) {
    console.log('🎯 FleetController: createRoute endpoint called');
    console.log('📝 FleetController: Request body:', createRouteDto);
    console.log('👤 FleetController: User info:', {
      userId: req.user?.userId,
      tenantId: req.user?.tenantId,
      role: req.user?.role
    });

    try {
      const route = await this.fleetService.createRoute(
        createRouteDto,
        req.user.userId,
        req.user.tenantId,
      );

      console.log('✅ FleetController: Route created successfully:', route);

      return {
        message: 'Route created successfully',
        route,
      };
    } catch (error) {
      console.error('❌ FleetController: Error creating route:', error);
      throw error;
    }
  }

  @Get('routes')
  @ApiOperation({
    summary: 'Get all routes',
    description: 'Retrieves all routes in the fleet',
  })
  @ApiResponse({ status: 200, description: 'Routes retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllRoutes(@Request() req) {
    const isAdmin = [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.TENANT_ADMIN,
      UserRole.FLEET_MANAGER,
      UserRole.FLEET_DISPATCHER,
    ].includes(req.user.role);

    const routes = await this.fleetService.findAllRoutes(
      req.user.tenantId,
      isAdmin ? undefined : req.user.userId,
    );
    return {
      message: 'Routes retrieved successfully',
      routes,
    };
  }

  @Get('routes/:id')
  @ApiOperation({
    summary: 'Get route by ID',
    description: 'Retrieves a specific route by its ID',
  })
  @ApiParam({ name: 'id', description: 'Route ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Route retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOneRoute(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const route = await this.fleetService.findOneRoute(id, req.user.tenantId);
    return {
      message: 'Route retrieved successfully',
      route,
    };
  }

  @Patch('routes/:id')
  @ApiOperation({
    summary: 'Update route',
    description: 'Updates an existing route',
  })
  @ApiParam({ name: 'id', description: 'Route ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Route name' },
        origin: { type: 'string', description: 'Route origin' },
        destination: { type: 'string', description: 'Route destination' },
        distance: { type: 'number', description: 'Route distance in miles' },
        estimatedDuration: {
          type: 'number',
          description: 'Estimated duration in hours',
        },
        status: { type: 'string', description: 'Route status' },
      },
    },
    description: 'Route update data',
  })
  @ApiResponse({ status: 200, description: 'Route updated successfully' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateRoute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRouteDto: any,
    @Request() req,
  ) {
    const route = await this.fleetService.updateRoute(
      id,
      updateRouteDto,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Route updated successfully',
      route,
    };
  }

  @Delete('routes/:id')
  @ApiOperation({
    summary: 'Delete route',
    description: 'Deletes a route from the fleet',
  })
  @ApiParam({ name: 'id', description: 'Route ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Route deleted successfully' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeRoute(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.fleetService.removeRoute(id, req.user.tenantId, req.user.userId);
    return {
      message: 'Route deleted successfully',
    };
  }

  // Analytics endpoint
  @Get('analytics')
  @ApiOperation({
    summary: 'Get fleet analytics',
    description: 'Retrieves comprehensive analytics for the fleet',
  })
  @ApiResponse({
    status: 200,
    description: 'Fleet analytics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFleetAnalytics(@Request() req) {
    const analytics = await this.fleetService.getFleetAnalytics(
      req.user.tenantId,
      req.user.userId,
      req.user.role,
    );
    return {
      success: true,
      data: analytics,
      message: 'Fleet analytics retrieved successfully',
    };
  }

  @Get('analytics/tco')
  @ApiOperation({ summary: 'Get Total Cost of Ownership analysis' })
  async getTCOAnalysis(@Request() req) {
    const data = await this.fleetService.getTCOAnalysis(
      req.user.tenantId,
      req.user.userId,
      req.user.role,
    );
    return {
      success: true,
      data,
    };
  }

  // Bulk operations
  @Post('trucks/bulk-assign')
  @ApiOperation({
    summary: 'Bulk assign to trucks',
    description:
      'Assigns multiple drivers or routes to multiple trucks in a single operation',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        truckIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of truck IDs to assign to',
        },
        driverIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of driver IDs to assign (for driver assignments)',
        },
        routeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of route IDs to assign (for route assignments)',
        },
        type: {
          type: 'string',
          enum: ['driver', 'route'],
          description: 'Type of assignment (driver or route)',
        },
      },
      required: ['truckIds', 'type'],
    },
    description: 'Bulk assignment data',
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk assignment completed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async bulkAssignToTrucks(@Body() bulkAssignDto: any, @Request() req) {
    const result = await this.fleetService.bulkAssignToTrucks(
      bulkAssignDto,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Bulk assignment completed successfully',
      result,
    };
  }

  @Delete('trucks/bulk-unassign')
  @ApiOperation({
    summary: 'Bulk unassign from trucks',
    description:
      'Unassigns multiple drivers or routes from multiple trucks in a single operation',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        truckIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of truck IDs to unassign from',
        },
        driverIds: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Array of driver IDs to unassign (for driver unassignments)',
        },
        routeIds: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Array of route IDs to unassign (for route unassignments)',
        },
        type: {
          type: 'string',
          enum: ['driver', 'route'],
          description: 'Type of unassignment (driver or route)',
        },
      },
      required: ['truckIds', 'type'],
    },
    description: 'Bulk unassignment data',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk unassignment completed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async bulkUnassignFromTrucks(@Body() bulkUnassignDto: any, @Request() req) {
    const result = await this.fleetService.bulkUnassignFromTrucks(
      bulkUnassignDto,
      req.user.tenantId,
      req.user.userId,
    );

    return {
      message: 'Bulk unassignment completed successfully',
      result,
    };
  }

  // Route-Truck Assignment endpoints
  @Post('routes/:routeId/assign-truck/:truckId')
  @ApiOperation({ summary: 'Assign a route to a truck' })
  @ApiParam({ name: 'routeId', description: 'Route ID' })
  @ApiParam({ name: 'truckId', description: 'Truck ID' })
  @ApiResponse({
    status: 201,
    description: 'Route assigned to truck successfully',
  })
  async assignTruckToRoute(
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Param('truckId', ParseUUIDPipe) truckId: string,
    @Request() req,
  ) {
    const assignment = await this.fleetService.assignRouteToTruck(
      routeId,
      truckId,
      req.user.userId,
      req.user.tenantId,
    );

    return {
      message: 'Route assigned to truck successfully',
      assignment,
    };
  }

  @Delete('routes/:routeId/unassign-truck/:truckId')
  @ApiOperation({ summary: 'Unassign a route from a truck' })
  @ApiParam({ name: 'routeId', description: 'Route ID' })
  @ApiParam({ name: 'truckId', description: 'Truck ID' })
  @ApiResponse({
    status: 200,
    description: 'Route unassigned from truck successfully',
  })
  async unassignTruckFromRoute(
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Param('truckId', ParseUUIDPipe) truckId: string,
    @Request() req,
  ) {
    await this.fleetService.unassignRouteFromTruck(
      routeId,
      truckId,
      req.user.userId,
      req.user.tenantId,
    );

    return {
      message: 'Route unassigned from truck successfully',
    };
  }

  @Get('trucks/:truckId/routes')
  @ApiOperation({ summary: 'Get all routes assigned to a truck' })
  @ApiParam({ name: 'truckId', description: 'Truck ID' })
  @ApiResponse({ status: 200, description: 'Routes retrieved successfully' })
  async getTruckRoutes(
    @Param('truckId', ParseUUIDPipe) truckId: string,
    @Request() req,
  ) {
    const routes = await this.fleetService.getTruckRoutes(
      truckId,
      req.user.userId,
      req.user.tenantId,
    );

    return {
      message: 'Routes retrieved successfully',
      routes,
    };
  }

  @Get('routes/:routeId/assignments')
  @ApiOperation({ summary: 'Get all truck assignments for a route' })
  @ApiParam({ name: 'routeId', description: 'Route ID' })
  @ApiResponse({
    status: 200,
    description: 'Route assignments retrieved successfully',
  })
  async getRouteAssignments(
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Request() req,
  ) {
    const assignments = await this.fleetService.getRouteAssignments(
      routeId,
      req.user.tenantId,
    );

    return {
      message: 'Route assignments retrieved successfully',
      assignments,
    };
  }

  @Post('routes/bulk-assign')
  @ApiOperation({ summary: 'Bulk assign routes to trucks' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        assignments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              routeId: { type: 'string', format: 'uuid' },
              truckId: { type: 'string', format: 'uuid' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Bulk route assignment completed' })
  async bulkAssignRoutes(
    @Body() body: { assignments: { routeId: string; truckId: string }[] },
    @Request() req,
  ) {
    const results = await this.fleetService.bulkAssignRoutes(
      body.assignments,
      req.user.userId,
      req.user.tenantId,
    );

    return {
      message: 'Bulk route assignment completed',
      results,
      successful: results.length,
      total: body.assignments.length,
    };
  }

  // Route assignment endpoints
  @Post('trucks/:id/assign-route')
  @ApiOperation({
    summary: 'Assign route to truck',
    description: 'Assigns a route to a specific truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        routeId: { type: 'string', description: 'Route ID (UUID)' },
        startDate: { type: 'string', description: 'Assignment start date (optional)' },
        notes: { type: 'string', description: 'Assignment notes (optional)' },
      },
      required: ['routeId'],
    },
    description: 'Route assignment data',
  })
  @ApiResponse({
    status: 201,
    description: 'Route assigned to truck successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck or route not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async assignRouteToTruck(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Body() assignRouteDto: { routeId: string; startDate?: string; notes?: string },
    @Request() req,
  ) {
    try {
      console.log('🛣️ Assign Route to Truck Request:', {
        truckId,
        routeId: assignRouteDto.routeId,
        userId: req.user?.userId,
        tenantId: req.user?.tenantId,
      });

      const assignment = await this.fleetService.assignRouteToTruck(
        assignRouteDto.routeId,
        truckId,
        req.user.userId,
        req.user.tenantId,
      );

      return {
        message: 'Route assigned to truck successfully',
        assignment,
      };
    } catch (error) {
      console.error('❌ Error in assignRouteToTruck controller:', error);
      throw error;
    }
  }

  @Delete('trucks/:id/assign-route/:routeId')
  @ApiOperation({
    summary: 'Unassign route from truck',
    description: 'Removes a route assignment from a truck',
  })
  @ApiParam({ name: 'id', description: 'Truck ID (UUID)' })
  @ApiParam({ name: 'routeId', description: 'Route ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Route unassigned from truck successfully',
  })
  @ApiResponse({ status: 404, description: 'Truck, route, or assignment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unassignRouteFromTruck(
    @Param('id', ParseUUIDPipe) truckId: string,
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Request() req,
  ) {
    try {
      await this.fleetService.unassignRouteFromTruck(
        routeId,
        truckId,
        req.user.userId,
        req.user.tenantId,
      );

      return {
        message: 'Route unassigned from truck successfully',
      };
    } catch (error) {
      console.error('❌ Error in unassignRouteFromTruck controller:', error);
      throw error;
    }
  }

  // Get assignments endpoint
  @Get('assignments')
  @ApiOperation({
    summary: 'Get all fleet assignments',
    description: 'Retrieves all driver-truck-route assignments',
  })
  @ApiResponse({ status: 200, description: 'Assignments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAssignments(@Request() req) {
    try {
      // This would be implemented to return combined assignments
      // For now, return empty array as placeholder
      return {
        message: 'Assignments retrieved successfully',
        assignments: [],
      };
    } catch (error) {
      console.error('❌ Error in getAssignments controller:', error);
      throw error;
    }
  }
}