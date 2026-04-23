import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ValidationPipe,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DriverService } from './driver.service';
import {
  CreateDriverDto,
  UpdateDriverDto,
  TelematicsEventDto,
  EmergencyReportDto,
  DriverFilterDto,
  CompleteDeliveryDto,
} from './dto/driver.dto';
import { Driver, DriverStatus } from '../../entities/driver.entity';
import { UserRole } from '../../entities/user.entity';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { OcrService } from '../ocr/ocr.service';

@ApiTags('Drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TENANT_ADMIN,
  UserRole.TRUCK_OWNER,
  UserRole.FLEET_MANAGER,
  UserRole.FLEET_DISPATCHER,
  UserRole.FLEET_SAFETY_OFFICER,
  UserRole.DRIVER,
)
@Controller('drivers')
export class DriverController {
  constructor(
    private readonly driverService: DriverService,
    private readonly ocrService: OcrService,
  ) { }

  @Post()
  @ApiOperation({
    summary: 'Create a new driver',
    description:
      'Creates a new driver with comprehensive information including license, certifications, and employment details',
  })
  @ApiBody({ type: CreateDriverDto })
  @ApiCreatedResponse({
    description: 'Driver created successfully',
    type: Driver,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({
    description: 'Driver with same license number or user already exists',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER,
    UserRole.FLEET_SAFETY_OFFICER,
  )
  async createDriver(
    @Body(ValidationPipe) createDto: CreateDriverDto,
    @Request() req,
  ): Promise<{ message: string; driver: Driver }> {
    const driver = await this.driverService.createDriver({
      ...createDto,
      tenantId: req.user.tenantId,
    });

    return {
      message: 'Driver created successfully',
      driver,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all drivers',
    description:
      'Retrieve a paginated list of drivers with optional filtering by status, employment type, rating, etc.',
  })
  @ApiQuery({ name: 'status', enum: DriverStatus, required: false })
  @ApiQuery({
    name: 'employmentType',
    enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'OWNER_OPERATOR', 'FREELANCE'],
    required: false,
  })
  @ApiQuery({ name: 'availabilityStatus', type: String, required: false })
  @ApiQuery({ name: 'minRating', type: Number, required: false, schema: { minimum: 0, maximum: 5 } })
  @ApiQuery({
    name: 'minSafetyScore',
    type: Number,
    required: false,
    schema: { minimum: 0, maximum: 100 },
  })
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, schema: { minimum: 1 }, required: false })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    schema: { minimum: 1, maximum: 100 },
  })
  @ApiOkResponse({
    description: 'List of drivers retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        drivers: {
          type: 'array',
          items: { $ref: '#/components/schemas/Driver' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER,
    UserRole.FLEET_SAFETY_OFFICER,
    UserRole.DRIVER,
  )
  async getAllDrivers(
    @Query(ValidationPipe) filterDto: DriverFilterDto,
    @Request() req,
  ): Promise<{
    drivers: Driver[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.driverService.getAllDrivers(filterDto, req.user.tenantId);
  }

  @Get('me')
  @Roles(
    UserRole.DRIVER,
    UserRole.FLEET_MANAGER,
    UserRole.TENANT_ADMIN,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get current driver profile',
    description: 'Retrieve detailed information about the currently logged-in driver',
  })
  @ApiOkResponse({
    description: 'Driver profile retrieved successfully',
    type: Driver,
  })
  async getMe(@Request() req): Promise<{ driver: Driver }> {
    const driver = await this.driverService.getDriverByUserId(req.user.id);
    return { driver };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get driver by ID',
    description: 'Retrieve detailed information about a specific driver',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiOkResponse({
    description: 'Driver details retrieved successfully',
    type: Driver,
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{ driver: Driver }> {
    const driver = await this.driverService.getDriverById(
      id,
      req.user.tenantId,
    );
    return { driver };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update driver by ID',
    description:
      'Update driver information. Only provided fields will be updated.',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiBody({ type: UpdateDriverDto })
  @ApiOkResponse({
    description: 'Driver updated successfully',
    type: Driver,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiConflictResponse({
    description: 'Driver with same license number already exists',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateDto: UpdateDriverDto,
    @Request() req,
  ): Promise<{ message: string; driver: Driver }> {
    const driver = await this.driverService.updateDriver(
      id,
      updateDto,
      req.user.tenantId,
    );
    return {
      message: 'Driver updated successfully',
      driver,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete driver by ID',
    description:
      'Soft delete a driver. Driver cannot be deleted if currently on a trip.',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiOkResponse({ description: 'Driver deleted successfully' })
  @ApiBadRequestResponse({
    description: 'Cannot delete driver currently on a trip',
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER,
    UserRole.FLEET_SAFETY_OFFICER,
  )
  @HttpCode(HttpStatus.OK)
  async deleteDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.driverService.deleteDriver(id, req.user.tenantId);
    return { message: 'Driver deleted successfully' };
  }

  @Post(':id/telematics')
  @ApiOperation({
    summary: 'Process telematics event for driver',
    description:
      'Process real-time telematics data and update driver safety score and status',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiBody({ type: TelematicsEventDto })
  @ApiOkResponse({
    description: 'Telematics event processed successfully',
    schema: {
      type: 'object',
      properties: {
        safetyScore: { type: 'number' },
        eventProcessed: { type: 'boolean' },
        alerts: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async processTelematics(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) telematicsDto: TelematicsEventDto,
    @Request() req,
  ): Promise<{
    safetyScore: number;
    eventProcessed: boolean;
    alerts: string[];
  }> {
    return this.driverService.processTelematics(
      id,
      telematicsDto,
      req.user.tenantId,
    );
  }

  @Get(':id/fatigue')
  @ApiOperation({
    summary: 'Check driver fatigue status',
    description:
      'Analyze driver fatigue based on consecutive driving hours and provide recommendations',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiOkResponse({
    description: 'Fatigue status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        isFatigued: { type: 'boolean' },
        consecutiveDrivingHours: { type: 'number' },
        recommendedAction: { type: 'string' },
        riskLevel: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async checkFatigue(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{
    isFatigued: boolean;
    consecutiveDrivingHours: number;
    recommendedAction: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }> {
    return this.driverService.checkFatigue(id, req.user.tenantId);
  }

  @Get(':id/compliance')
  @ApiOperation({
    summary: 'Get compliance status for driver',
    description:
      'Check driver compliance with license, medical certificate, drug test, and training requirements',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiOkResponse({
    description: 'Compliance status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        licenseValid: { type: 'boolean' },
        licenseExpiry: { type: 'string', format: 'date' },
        medicalValid: { type: 'boolean' },
        medicalCertExpiry: { type: 'string', format: 'date' },
        drugTestValid: { type: 'boolean' },
        drugTestDate: { type: 'string', format: 'date' },
        backgroundCheckValid: { type: 'boolean' },
        backgroundCheckDate: { type: 'string', format: 'date' },
        trainingValid: { type: 'boolean' },
        trainingCompletionDate: { type: 'string', format: 'date' },
        overallCompliant: { type: 'boolean' },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getCompliance(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{
    licenseValid: boolean;
    licenseExpiry: Date;
    medicalValid: boolean;
    medicalCertExpiry?: Date;
    drugTestValid: boolean;
    drugTestDate?: Date;
    backgroundCheckValid: boolean;
    backgroundCheckDate?: Date;
    trainingValid: boolean;
    trainingCompletionDate?: Date;
    overallCompliant: boolean;
    warnings: string[];
  }> {
    return this.driverService.getComplianceStatus(id, req.user.tenantId);
  }

  @Post(':id/emergency')
  @ApiOperation({
    summary: 'Report emergency for driver',
    description:
      'Report an emergency situation for a driver and trigger appropriate response protocols',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiBody({ type: EmergencyReportDto })
  @ApiOkResponse({
    description: 'Emergency reported successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        emergencyId: { type: 'string' },
        responseTime: { type: 'number' },
        actions: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async reportEmergency(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) emergencyDto: EmergencyReportDto,
    @Request() req,
  ): Promise<{
    status: string;
    emergencyId: string;
    responseTime: number;
    actions: string[];
  }> {
    return this.driverService.handleEmergency(
      id,
      emergencyDto,
      req.user.tenantId,
    );
  }

  @Get(':id/risk')
  @ApiOperation({
    summary: 'Predict accident risk for driver',
    description:
      'Analyze driver data to predict accident risk and provide recommendations for improvement',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiOkResponse({
    description: 'Risk assessment completed successfully',
    schema: {
      type: 'object',
      properties: {
        riskScore: { type: 'number', minimum: 0, maximum: 1 },
        riskLevel: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        },
        factors: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async predictRisk(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: string[];
    recommendations: string[];
  }> {
    return this.driverService.predictAccidentRisk(id, req.user.tenantId);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get driver statistics',
    description:
      'Retrieve comprehensive statistics for a driver including trips, earnings, ratings, and performance metrics',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiOkResponse({
    description: 'Driver statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalTrips: { type: 'number' },
        totalDistance: { type: 'number' },
        totalEarnings: { type: 'number' },
        averageRating: { type: 'number' },
        safetyScore: { type: 'number' },
        onTimeDeliveryRate: { type: 'number' },
        hoursWorkedThisWeek: { type: 'number' },
        hoursWorkedThisMonth: { type: 'number' },
        consecutiveDrivingHours: { type: 'number' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getDriverStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{
    totalTrips: number;
    totalDistance: number;
    totalEarnings: number;
    averageRating: number;
    safetyScore: number;
    onTimeDeliveryRate: number;
    hoursWorkedThisWeek: number;
    hoursWorkedThisMonth: number;
    consecutiveDrivingHours: number;
  }> {
    return this.driverService.getDriverStats(id, req.user.tenantId);
  }

  @Get(':id/analytics')
  @ApiOperation({
    summary: 'Get driver dashboard analytics',
    description: 'Returns chart-ready earnings, performance metrics, and HOS data for the driver dashboard',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiQuery({ name: 'period', required: false, description: '7d | 14d | 30d', type: String })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  async getDriverAnalytics(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('period') period: string = '7d',
    @Request() req,
  ) {
    return this.driverService.getDriverAnalytics(id, req.user.tenantId, period);
  }

  @Get(':id/earnings')
  @ApiOperation({
    summary: 'Get driver earnings by period',
    description: 'Returns period-bucketed earnings data (week/month/quarter/year) from completed trips',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiQuery({ name: 'period', required: false, description: 'week | month | quarter | year', type: String })
  @ApiResponse({ status: 200, description: 'Earnings data retrieved successfully' })
  async getDriverEarnings(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('period') period: string = 'month',
    @Request() req,
  ) {
    return this.driverService.getDriverEarnings(id, req.user.tenantId, period);
  }

  @Get(':id/assigned-loads')
  @ApiOperation({
    summary: 'Get loads assigned to driver\'s truck',
    description: 'Retrieve all loads assigned to the truck that the driver is currently assigned to',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiOkResponse({
    description: 'Assigned loads retrieved successfully',
    type: [Object],
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getAssignedLoads(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    return this.driverService.getAssignedLoads(id, req.user.tenantId);
  }

  @Post(':id/accept-and-load')
  @ApiOperation({
    summary: 'Accept and load cargo',
    description: 'Driver accepts the assigned load and marks it as loaded, making it ready for payment',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        loadId: {
          type: 'string',
          description: 'Load ID to accept and load',
        },
      },
      required: ['loadId'],
    },
  })
  @ApiOkResponse({
    description: 'Cargo accepted and loaded successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid input or load cannot be accepted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async acceptAndLoad(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { loadId: string },
    @Request() req,
  ) {
    await this.driverService.acceptAndLoad(id, body.loadId, req.user.tenantId);
    return { message: 'Cargo accepted and loaded successfully' };
  }

  @Post(':id/proceed-journey')
  @ApiOperation({
    summary: 'Proceed with journey after checking cargo',
    description: 'Mark selected loads as checked and update their status to IN_TRANSIT',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        loadIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of load IDs to mark as checked',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Journey started successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid input or driver not assigned to truck' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async proceedWithJourney(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { loadIds: string[] },
    @Request() req,
  ) {
    await this.driverService.proceedWithJourney(id, body.loadIds, req.user.tenantId);
    return { message: 'Journey started successfully' };
  }

  @Post(':id/complete-delivery')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiOperation({
    summary: 'Complete delivery and submit POD',
    description: 'Driver marks the load as delivered and provides proof of delivery (recipient name, signature)',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiBody({ type: CompleteDeliveryDto })
  @ApiOkResponse({
    description: 'Delivery completed and POD recorded successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid input or load cannot be delivered' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async completeDelivery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() completeDto: CompleteDeliveryDto,
    @Request() req,
    @UploadedFile() photoFile?: Express.Multer.File,
  ) {
    return this.driverService.completeDelivery(id, completeDto, req.user.tenantId, photoFile);
  }

  @Put(':id/location')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER,
    UserRole.DRIVER,
  )
  @ApiOperation({
    summary: 'Update driver location',
    description:
      'Update the current location of a driver for real-time tracking',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', minimum: -90, maximum: 90 },
        longitude: { type: 'number', minimum: -180, maximum: 180 },
      },
      required: ['latitude', 'longitude'],
    },
  })
  @ApiOkResponse({ description: 'Driver location updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid coordinates' })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { latitude: number; longitude: number },
    @Request() req,
  ): Promise<{ message: string }> {
    await this.driverService.updateDriverLocation(
      id,
      body.latitude,
      body.longitude,
      req.user.tenantId,
    );
    return { message: 'Driver location updated successfully' };
  }

  @Put(':id/assign-truck')
  @ApiOperation({
    summary: 'Assign truck to driver',
    description: 'Assign a specific truck to a driver for trip operations',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        truckId: { type: 'string', format: 'uuid' },
      },
      required: ['truckId'],
    },
  })
  @ApiOkResponse({ description: 'Truck assigned successfully' })
  @ApiBadRequestResponse({ description: 'Driver already assigned to a truck' })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER,
    UserRole.FLEET_SAFETY_OFFICER,
  )
  async assignTruck(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { truckId: string },
    @Request() req,
  ): Promise<{ message: string }> {
    await this.driverService.assignTruck(id, body.truckId, req.user.tenantId);
    return { message: 'Truck assigned successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/announcements')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER,
    UserRole.FLEET_SAFETY_OFFICER,
    UserRole.DRIVER,
  )
  @ApiOperation({
    summary: 'Get announcements for driver',
    description: 'Retrieve system-wide or driver-specific announcements and notifications',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiOkResponse({
    description: 'Announcements retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getAnnouncements(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<any[]> {
    return this.driverService.getAnnouncements(id, req.user.tenantId);
  }

  @Put(':id/unassign-truck')
  @ApiOperation({
    summary: 'Unassign truck from driver',
    description: 'Remove truck assignment from a driver',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiOkResponse({ description: 'Truck unassigned successfully' })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER,
    UserRole.FLEET_SAFETY_OFFICER,
  )
  async unassignTruck(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.driverService.unassignTruck(id, req.user.tenantId);
    return { message: 'Truck unassigned successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/document-ocr')
  async extractDriverDocumentText(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('documentUrl') documentUrl: string,
  ) {
    return await this.driverService.extractDriverDocumentText(documentUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/report-incident')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_SAFETY_OFFICER,
    UserRole.DRIVER,
  )
  @ApiOperation({
    summary: 'Report safety incident',
    description: 'Report an accident, violation, or hazard',
  })
  async reportIncident(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() incidentData: any,
    @Request() req,
  ) {
    return this.driverService.reportIncident(
      id,
      incidentData,
      req.user.tenantId,
      req.user.id,
    );
  }

  @Post(':id/break/start')
  @Roles(
    UserRole.DRIVER,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Start driver break',
    description: 'Start a break period for the driver to track hours of service compliance',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        breakType: {
          type: 'string',
          enum: ['REST', 'MEAL', 'SLEEP', 'OTHER'],
          description: 'Type of break',
        },
        notes: {
          type: 'string',
          description: 'Optional notes about the break',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Break started successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        breakId: { type: 'string' },
        startTime: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async startBreak(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { breakType?: string; notes?: string },
    @Request() req,
  ): Promise<{ message: string; breakId: string; startTime: Date }> {
    return this.driverService.startBreak(id, body, req.user.tenantId);
  }

  @Post(':id/break/end')
  @Roles(
    UserRole.DRIVER,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'End driver break',
    description: 'End the current break period for the driver',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notes: {
          type: 'string',
          description: 'Optional notes about the break completion',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Break ended successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        breakId: { type: 'string' },
        duration: { type: 'number', description: 'Break duration in minutes' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'No active break found' })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async endBreak(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { notes?: string },
    @Request() req,
  ): Promise<{ message: string; breakId: string; duration: number }> {
    return this.driverService.endBreak(id, body, req.user.tenantId);
  }

  @Get(':id/breaks')
  @Roles(
    UserRole.DRIVER,
    UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Get driver break history',
    description: 'Retrieve break history for the driver with optional date filtering',
  })
  @ApiParam({ name: 'id', description: 'Driver ID', type: String })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for filtering (ISO 8601 format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for filtering (ISO 8601 format)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of breaks to return',
  })
  @ApiOkResponse({
    description: 'Break history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        breaks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              breakType: { type: 'string' },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              duration: { type: 'number' },
              notes: { type: 'string' },
            },
          },
        },
        total: { type: 'number' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Driver not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getBreaks(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Request() req?,
  ): Promise<{ breaks: any[]; total: number }> {
    return this.driverService.getBreaks(
      id,
      { startDate, endDate, limit },
      req.user.tenantId,
    );
  }

  @Delete(':id/breaks/:breakId')
  @ApiOperation({ summary: 'Delete/revert a driver break' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiParam({ name: 'breakId', description: 'Break ID to delete' })
  @ApiOkResponse({ description: 'Break deleted successfully' })
  @ApiNotFoundResponse({ description: 'Driver or break not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async deleteBreak(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('breakId') breakId: string,
    @Request() req,
  ): Promise<{ message: string }> {
    return this.driverService.deleteBreak(id, breakId, req.user.tenantId);
  }
}
