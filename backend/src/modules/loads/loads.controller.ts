import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
  Res,
  HttpStatus,
  HttpException,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { LoadsService } from './loads.service';
import { CreateLoadDto } from './dto/create-load.dto';
import { UpdateLoadDto } from './dto/update-load.dto';
import { LoadsQueryDto } from './dto/loads-query.dto';
import { LoadSearchDto } from './dto/load-search.dto';
import {
  BulkCreateLoadDto,
  BulkUpdateLoadDto,
  BulkDeleteLoadDto,
} from './dto/bulk-load.dto';
import {
  LoadResponseDto,
  LoadsPaginatedResponseDto,
  LoadsStatisticsDto,
} from './dto/loads-response.dto';
// ...existing code...
import {
  LoadStatus,
  UrgencyLevel,
  CargoType,
  LoadType,
  EquipmentType,
  Visibility,
  PaymentTerms,
  PackagingType,
} from '../../entities/load.entity';
import { DocumentType } from '../../entities/document.entity';
import { AlertType, AlertSeverity } from '../../entities/alert.entity';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../../entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { GetTenant } from '../auth/decorators/tenant.decorator';

@ApiTags('Enhanced Loads')
@Controller('loads')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class LoadsController {
  constructor(private readonly loadsService: LoadsService) {}

  @Post()
  @UseGuards(ThrottlerGuard, RolesGuard)
  @Roles(UserRole.CARGO_OWNER)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({
    summary: 'Create Enhanced Cargo Load',
    description: `
    Creates a new cargo load with comprehensive enhanced fields for optimal truck-cargo matching.
    
    **Enhanced Fields Include:**
    
    **Dimensional Specifications:**
    - length, width, height: Cargo dimensions in meters
    - stackableHeight: Maximum stackable height
    - isStackable: Whether cargo can be stacked
    - packagingType: Type of packaging (pallets, crates, boxes, etc.)
    - numberOfPieces: Number of individual pieces
    - numberOfPallets: Number of pallets
    
    **Environmental Requirements:**
    - temperatureMin, temperatureMax: Temperature range in Celsius
    - requiresHumidityControl: Humidity control requirement
    - hazmatClass: UN hazmat classification
    - hazmatNumber: UN hazmat number
    
    **Loading & Unloading:**
    - requiresForklift: Forklift requirement for loading/unloading
    - requiresCrane: Crane requirement for loading/unloading
    - requiresLoadingDock: Loading dock requirement
    - loadingTimeEstimate: Estimated loading time in hours
    - unloadingTimeEstimate: Estimated unloading time in hours
    - loadingInstructions: Specific loading instructions
    - unloadingInstructions: Specific unloading instructions
    
    **Security & Insurance:**
    - requiresGpsMonitoring: GPS monitoring during transit
    - requiresTemperatureMonitoring: Temperature monitoring during transit
    - insuranceValue: Insurance value of cargo
    - emergencyContactInfo: Emergency contact information
    
    **Route & Access:**
    - requiresLowClearanceRoute: Low clearance route planning
    - maxClearanceHeight: Maximum clearance height in meters
    - requiresEscortVehicle: Escort vehicle requirement
    
    **Urgency & Timing:**
    - urgencyLevel: LOW, NORMAL, HIGH, CRITICAL
    - isTimeCritical: Time critical cargo flag
    - maxTransitTime: Maximum transit time in hours
    
    **Advanced Matching Criteria:**
    - truckRequirements: Specific truck requirements (capacity, features, age, etc.)
    - carrierPreferences: Carrier preferences (rating, distance, availability)
    - costPreferences: Cost and payment preferences (budget, terms, insurance)
    
    **Quality & Inspection:**
    - requiresPreShipmentInspection: Pre-shipment inspection requirement
    - requiresDeliveryInspection: Delivery inspection requirement
    - requiresPhotographicDocumentation: Photo documentation requirement
    - specialHandlingInstructions: Special handling instructions
    `,
  })
  @ApiBody({
    type: CreateLoadDto,
    description:
      'Enhanced cargo load data with comprehensive field specifications',
  })
  @ApiResponse({
    status: 201,
    description: 'Enhanced cargo load created successfully',
    type: LoadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User not found or access denied',
  })
  async create(
    @Body() createLoadDto: CreateLoadDto,
    @Req() req: Request,
  ): Promise<{ message: string; load: LoadResponseDto }> {
    try {
      console.log('Controller: Starting create load...');
      console.log('Controller: User ID:', req.user?.userId);
      console.log('Controller: Tenant ID:', req.user?.tenantId);
      console.log('Controller: DTO:', JSON.stringify(createLoadDto, null, 2));

      // Validate user authentication
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated. Please log in.');
      }
      if (!req.user.userId) {
        throw new UnauthorizedException('User ID not found in authentication token.');
      }
      if (!req.user.tenantId) {
        throw new BadRequestException('Tenant ID not found. User must be associated with a tenant.');
      }

      const load = await this.loadsService.create(
        createLoadDto,
        req.user.userId,
        req.user.tenantId,
      );

      console.log('✅ Load created successfully:', load.id);

      return {
        message: 'Enhanced cargo load created successfully',
        load: this.transformLoadToResponse(load),
      };
    } catch (error) {
      console.error('❌ Error in create controller:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Re-throw known exceptions
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError' || error.message?.includes('validation')) {
        throw new BadRequestException({
          message: 'Validation failed',
          error: error.message || 'Invalid load data provided',
        });
      }
      
      // Handle database constraint violations
      if (error.code === '23505') { // Unique constraint violation
        throw new ConflictException('A load with these details already exists');
      }
      
      if (error.code === '22001') { // Data too long
        throw new BadRequestException('One or more fields exceed maximum length');
      }
      
      // Generic error
      throw new HttpException(
        {
          message: 'Failed to create load',
          error: error.message || 'An unexpected error occurred',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Create Multiple Loads',
    description: 'Create multiple loads in a single operation',
  })
  @ApiBody({
    type: BulkCreateLoadDto,
    description: 'Array of load data to create',
  })
  @ApiResponse({
    status: 201,
    description: 'Loads created successfully',
  })
  async createBulk(
    @Body() bulkCreateDto: BulkCreateLoadDto,
    @Req() req: Request,
  ): Promise<{ message: string; loads: LoadResponseDto[] }> {
    try {
      const loads = await this.loadsService.createBulk(
        bulkCreateDto.loads,
        req.user.userId,
        req.user.tenantId,
      );

      return {
        message: `${loads.length} loads created successfully`,
        loads: loads.map((load) => this.transformLoadToResponse(load)),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create loads',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('bulk')
  @ApiOperation({
    summary: 'Update Multiple Loads',
    description: 'Update multiple loads with the same data',
  })
  @ApiBody({
    type: BulkUpdateLoadDto,
    description: 'Load IDs and update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Loads updated successfully',
  })
  async updateBulk(
    @Body() bulkUpdateDto: BulkUpdateLoadDto,
    @Req() req: Request,
  ): Promise<{ message: string; loads: LoadResponseDto[] }> {
    try {
      const loads = await this.loadsService.updateBulk(
        bulkUpdateDto.loadIds,
        bulkUpdateDto.updates,
        req.user.tenantId,
        req.user.userId,
      );

      return {
        message: `${loads.length} loads updated successfully`,
        loads: loads.map((load) => this.transformLoadToResponse(load)),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update loads',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('bulk')
  @ApiOperation({
    summary: 'Delete Multiple Loads',
    description: 'Soft delete multiple loads',
  })
  @ApiBody({
    type: BulkDeleteLoadDto,
    description: 'Array of load IDs to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'Loads deleted successfully',
  })
  async deleteBulk(
    @Body() bulkDeleteDto: BulkDeleteLoadDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    try {
      await this.loadsService.deleteBulk(
        bulkDeleteDto.loadIds,
        req.user.tenantId,
        req.user.userId,
      );

      return {
        message: `${bulkDeleteDto.loadIds.length} loads deleted successfully`,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete loads',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search')
  @ApiOperation({
    summary: 'Advanced Load Search',
    description:
      'Search loads with advanced filtering, geospatial queries, and text search',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Text search in title, description, and cargo type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by load status',
  })
  @ApiQuery({
    name: 'cargoType',
    required: false,
    description: 'Filter by cargo type',
  })
  @ApiQuery({
    name: 'urgencyLevel',
    required: false,
    description: 'Filter by urgency level',
  })
  @ApiQuery({
    name: 'minWeight',
    required: false,
    description: 'Minimum weight filter',
  })
  @ApiQuery({
    name: 'maxWeight',
    required: false,
    description: 'Maximum weight filter',
  })
  @ApiQuery({
    name: 'minValue',
    required: false,
    description: 'Minimum value filter',
  })
  @ApiQuery({
    name: 'maxValue',
    required: false,
    description: 'Maximum value filter',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for pickup/delivery date range',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for pickup/delivery date range',
  })
  @ApiQuery({
    name: 'latitude',
    required: false,
    description: 'Center latitude for geospatial search',
  })
  @ApiQuery({
    name: 'longitude',
    required: false,
    description: 'Center longitude for geospatial search',
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Search radius in kilometers',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  async searchLoads(
    @Query() searchCriteria: LoadSearchDto,
    @Req() req: Request,
  ): Promise<{ message: string; loads: LoadResponseDto[]; total: number }> {
    try {
      const loads = await this.loadsService.searchLoads(
        searchCriteria,
        req.user.tenantId,
        req.user.userId,
      );

      return {
        message: 'Search completed successfully',
        loads: loads.map((load) => this.transformLoadToResponse(load)),
        total: loads.length,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to search loads',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('templates')
  @ApiOperation({
    summary: 'Create Load Template',
    description: 'Create a reusable load template for quick load creation',
  })
  @ApiBody({
    description: 'Load template data',
  })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
  })
  async createTemplate(
    @Body() templateData: any,
    @Req() req: Request,
  ): Promise<{ message: string; template: any }> {
    try {
      const template = await this.loadsService.createTemplate(
        templateData,
        req.user.userId,
        req.user.tenantId,
      );

      return {
        message: 'Template created successfully',
        template,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create template',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('templates')
  @ApiOperation({
    summary: 'Get Load Templates',
    description: 'Retrieve all load templates for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
  })
  async getTemplates(
    @Req() req: Request,
  ): Promise<{ message: string; templates: any[] }> {
    try {
      const templates = await this.loadsService.getTemplates(
        req.user.userId,
        req.user.tenantId,
      );

      return {
        message: 'Templates retrieved successfully',
        templates,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve templates',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('templates/:id/use')
  @ApiOperation({
    summary: 'Use Load Template',
    description: 'Create a new load from a template',
  })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 201,
    description: 'Load created from template successfully',
  })
  async useTemplate(
    @Param('id', ParseUUIDPipe) templateId: string,
    @Body() overrideData: any,
    @Req() req: Request,
  ): Promise<{ message: string; load: LoadResponseDto }> {
    try {
      console.log('📋 Using template:', templateId);
      console.log('📋 Override data:', JSON.stringify(overrideData, null, 2));
      console.log('👤 User ID:', req.user?.userId);
      console.log('🏢 Tenant ID:', req.user?.tenantId);

      // Validate user authentication
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated. Please log in.');
      }
      if (!req.user.userId) {
        throw new UnauthorizedException('User ID not found in authentication token.');
      }
      if (!req.user.tenantId) {
        throw new BadRequestException('Tenant ID not found. User must be associated with a tenant.');
      }

      const load = await this.loadsService.useTemplate(
        templateId,
        overrideData,
        req.user.userId,
        req.user.tenantId,
      );

      console.log('✅ Load created from template:', load.id);

      return {
        message: 'Load created from template successfully',
        load: this.transformLoadToResponse(load),
      };
    } catch (error) {
      console.error('❌ Error in useTemplate controller:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Re-throw known exceptions
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError' || error.message?.includes('validation')) {
        throw new BadRequestException({
          message: 'Validation failed',
          error: error.message || 'Invalid template data provided',
        });
      }
      
      // Generic error
      throw new HttpException(
        {
          message: 'Failed to use template',
          error: error.message || 'An unexpected error occurred',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get All Enhanced Cargo Loads',
    description: `
    Retrieves all cargo loads with comprehensive enhanced field support.
    
    **Filter Options:**
    - status: Filter by cargo status (${Object.values(LoadStatus).join(', ')})
    - cargoType: Filter by cargo type (${Object.values(CargoType).join(', ')}, etc.)
    - urgencyLevel: Filter by urgency level (${Object.values(UrgencyLevel).join(', ')})
    - isHazardous: Filter hazardous cargo (true/false)
    - requiresRefrigeration: Filter refrigerated cargo (true/false)
    - isTimeCritical: Filter time-critical cargo (true/false)
    - search: Search in title, description, and cargo type
    - startDate/endDate: Filter by date range
    - minWeight/maxWeight: Filter by weight range
    - minValue/maxValue: Filter by value range
    
    **Pagination:**
    - page: Page number (default: 1)
    - limit: Items per page (default: 10, max: 100)
    - sortBy: Sort field (default: createdAt)
    - sortOrder: Sort order ASC/DESC (default: DESC)
    `,
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by cargo status',
  })
  @ApiQuery({
    name: 'cargoType',
    required: false,
    description: 'Filter by cargo type',
  })
  @ApiQuery({
    name: 'urgencyLevel',
    required: false,
    description: 'Filter by urgency level',
  })
  @ApiQuery({
    name: 'isHazardous',
    required: false,
    description: 'Filter hazardous cargo',
  })
  @ApiQuery({
    name: 'requiresRefrigeration',
    required: false,
    description: 'Filter refrigerated cargo',
  })
  @ApiQuery({
    name: 'isTimeCritical',
    required: false,
    description: 'Filter time-critical cargo',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in title, description, and cargo type',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter by pickup date (start)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter by delivery date (end)',
  })
  @ApiQuery({
    name: 'minWeight',
    required: false,
    description: 'Minimum weight in kg',
  })
  @ApiQuery({
    name: 'maxWeight',
    required: false,
    description: 'Maximum weight in kg',
  })
  @ApiQuery({
    name: 'minValue',
    required: false,
    description: 'Minimum load value in USD',
  })
  @ApiQuery({
    name: 'maxValue',
    required: false,
    description: 'Maximum load value in USD',
  })
  @ApiResponse({
    status: 200,
    description: 'Enhanced cargo loads retrieved successfully',
    type: LoadsPaginatedResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid query parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async findAll(
    @Req() req: Request,
    @Query() query: LoadsQueryDto,
  ): Promise<LoadsPaginatedResponseDto> {
    try {
      // Sanitize and validate search parameter
      if (query.search !== undefined && query.search !== null) {
        if (typeof query.search === 'string') {
          query.search = query.search.trim();
          // Remove empty search
          if (!query.search) {
            delete query.search;
          }
        } else {
          // Convert to string if it's not already
          query.search = String(query.search).trim();
          if (!query.search) {
            delete query.search;
          }
        }
      }

      // Ensure tenantId and userId exist
      const tenantId = req?.user?.tenantId;
      const userId = req?.user?.userId;

      if (!tenantId) {
        throw new HttpException(
          'Tenant ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.loadsService.findAll(
        tenantId,
        userId,
        query,
      );

      return {
        ...result,
        items: result.items.map((load) => this.transformLoadToResponse(load)),
      };
    } catch (error) {
      console.error(`Error in findAll: ${error.message}`, error.stack);
      
      // If it's already an HttpException, re-throw it
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Failed to retrieve loads',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get Load Statistics',
    description:
      'Retrieves comprehensive statistics about loads for dashboard display',
  })
  @ApiResponse({
    status: 200,
    description: 'Load statistics retrieved successfully',
    type: LoadsStatisticsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getStatistics(@Req() req): Promise<LoadsStatisticsDto> {
    try {
      return await this.loadsService.getLoadStatistics(
        req.user.tenantId,
        req.user.userId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve load statistics',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('export')
  @ApiOperation({
    summary: 'Export Enhanced Cargo Loads',
    description: 'Exports cargo loads to CSV format with all enhanced fields',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by cargo status',
  })
  @ApiQuery({
    name: 'cargoType',
    required: false,
    description: 'Filter by cargo type',
  })
  @ApiQuery({
    name: 'urgencyLevel',
    required: false,
    description: 'Filter by urgency level',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in title, description, and cargo type',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file with enhanced cargo data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async export(
    @Req() req: Request,
    @Query() query: LoadsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const csvData = await this.loadsService.exportLoads(
        req.user.tenantId,
        req.user.userId,
        query,
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="enhanced-loads.csv"',
      );
      res.send(csvData);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to export loads',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Enhanced Cargo Load by ID',
    description:
      'Retrieves a specific cargo load with all enhanced fields and detailed information',
  })
  @ApiParam({ name: 'id', description: 'Cargo load ID (UUID)', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Enhanced cargo load retrieved successfully',
    type: LoadResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Cargo load not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<{ message: string; load: LoadResponseDto }> {
    try {
      const load = await this.loadsService.findOne(
        id,
        req.user.tenantId,
        req.user.userId,
      );
      return {
        message: 'Load retrieved successfully',
        load: this.transformLoadToResponse(load),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update Enhanced Cargo Load',
    description:
      'Updates a cargo load with enhanced fields. All enhanced fields are optional and can be updated individually.',
  })
  @ApiParam({ name: 'id', description: 'Cargo load ID (UUID)', type: 'string' })
  @ApiBody({
    type: UpdateLoadDto,
    description: 'Enhanced cargo load data to update (all fields optional)',
  })
  @ApiResponse({
    status: 200,
    description: 'Enhanced cargo load updated successfully',
    type: LoadResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Cargo load not found',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - You can only update your own loads or load is not in DRAFT status',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLoadDto: UpdateLoadDto,
    @Req() req: Request,
  ): Promise<{ message: string; load: LoadResponseDto }> {
    try {
      const load = await this.loadsService.update(
        id,
        updateLoadDto,
        req.user.tenantId,
        req.user.userId,
      );

      return {
        message: 'Load updated successfully',
        load: this.transformLoadToResponse(load),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete Enhanced Cargo Load',
    description: 'Deletes a cargo load and all its enhanced field data',
  })
  @ApiParam({ name: 'id', description: 'Cargo load ID (UUID)', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Enhanced cargo load deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Cargo load not found',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - You can only delete your own loads or load is not in DRAFT status',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    try {
      await this.loadsService.remove(id, req.user.tenantId, req.user.userId);
      return {
        message: 'Load deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Workflow Endpoints

  @Post(':loadId/publish')
  @ApiOperation({
    summary: 'Publish load',
    description: 'Publishes a draft load, making it visible to carriers',
  })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiResponse({ status: 200, description: 'Load published successfully' })
  @ApiResponse({ status: 400, description: 'Load cannot be published' })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async publishLoad(
    @Param('loadId', ParseUUIDPipe) loadId: string,
    @Req() req: Request,
  ): Promise<{ message: string; load: any }> {
    const load = await this.loadsService.publishLoad(
      loadId,
      req.user.userId,
      req.user.tenantId,
    );

    return {
      message: 'Load published successfully',
      load,
    };
  }

  @Post(':loadId/assign')
  @ApiOperation({
    summary: 'Assign carrier',
    description: 'Assigns a carrier to a published load',
  })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        carrierId: { type: 'string', format: 'uuid' },
        rate: { type: 'number' },
        notes: { type: 'string' },
      },
      required: ['carrierId', 'rate'],
    },
  })
  @ApiResponse({ status: 200, description: 'Carrier assigned successfully' })
  @ApiResponse({ status: 400, description: 'Load cannot be assigned' })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async assignCarrier(
    @Param('loadId', ParseUUIDPipe) loadId: string,
    @Body() assignmentData: { carrierId: string; rate: number; notes?: string },
    @Req() req: Request,
  ): Promise<{ message: string; load: any }> {
    const load = await this.loadsService.assignCarrier(
      loadId,
      assignmentData.carrierId,
      assignmentData.rate,
      req.user.userId,
      req.user.tenantId,
      assignmentData.notes,
    );

    return {
      message: 'Carrier assigned successfully',
      load,
    };
  }

  @Post(':loadId/start')
  @ApiOperation({
    summary: 'Start load',
    description: 'Marks a load as in transit',
  })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiResponse({ status: 200, description: 'Load started successfully' })
  @ApiResponse({ status: 400, description: 'Load cannot be started' })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async startLoad(
    @Param('loadId', ParseUUIDPipe) loadId: string,
    @Req() req: Request,
  ): Promise<{ message: string; load: any }> {
    const load = await this.loadsService.startLoad(
      loadId,
      req.user.userId,
      req.user.tenantId,
    );

    return {
      message: 'Load started successfully',
      load,
    };
  }

  @Post(':loadId/deliver')
  @ApiOperation({
    summary: 'Deliver load',
    description: 'Marks a load as delivered and optionally uploads POD',
  })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('podFile'))
  @ApiResponse({ status: 200, description: 'Load delivered successfully' })
  @ApiResponse({ status: 400, description: 'Load cannot be delivered' })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async deliverLoad(
    @Param('loadId', ParseUUIDPipe) loadId: string,
    @UploadedFile() podFile: Express.Multer.File,
    @Body() deliveryData: { notes?: string },
    @Req() req: Request,
  ): Promise<{ message: string; load: any }> {
    const load = await this.loadsService.deliverLoad(
      loadId,
      req.user.userId,
      req.user.tenantId,
      podFile,
      deliveryData.notes,
    );

    return {
      message: 'Load delivered successfully',
      load,
    };
  }

  @Post(':loadId/cancel')
  @ApiOperation({
    summary: 'Cancel load',
    description: 'Cancels a load and records the reason',
  })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string' },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({ status: 200, description: 'Load cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Load cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async cancelLoad(
    @Param('loadId', ParseUUIDPipe) loadId: string,
    @Body() cancelData: { reason: string },
    @Req() req: Request,
  ): Promise<{ message: string; load: any }> {
    const load = await this.loadsService.cancelLoad(
      loadId,
      req.user.userId,
      req.user.tenantId,
      cancelData.reason,
    );

    return {
      message: 'Load cancelled successfully',
      load,
    };
  }

  @Post(':loadId/repost')
  @ApiOperation({
    summary: 'Repost load',
    description: 'Reposts a cancelled load as a new draft',
  })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiResponse({ status: 200, description: 'Load reposted successfully' })
  @ApiResponse({ status: 400, description: 'Load cannot be reposted' })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async repostLoad(
    @Param('loadId', ParseUUIDPipe) loadId: string,
    @Req() req: Request,
  ): Promise<{ message: string; load: any }> {
    const load = await this.loadsService.repostLoad(
      loadId,
      req.user.userId,
      req.user.tenantId,
    );

    return {
      message: 'Load reposted successfully',
      load,
    };
  }

  // Document Management Endpoints

  @Get(':loadId/documents')
  @ApiOperation({
    summary: 'List documents',
    description: 'Lists all documents associated with a load',
  })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async getLoadDocuments(
    @Param('loadId', ParseUUIDPipe) loadId: string,
    @Req() req: Request,
  ): Promise<{ items: any[] }> {
    const documents = await this.loadsService.getLoadDocuments(
      loadId,
      req.user.tenantId,
    );

    return { items: documents };
  }

  @Post(':loadId/documents')
  @ApiOperation({
    summary: 'Upload document',
    description: 'Uploads a document (BOL, POD, invoice, customs, etc.) for a load',
  })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { 
          type: 'string', 
          enum: Object.values(DocumentType),
          description: 'Document type'
        },
        file: { 
          type: 'string', 
          format: 'binary',
          description: 'Document file'
        },
        description: { type: 'string' },
        metadata: { type: 'string', description: 'JSON stringified metadata' },
      },
      required: ['type', 'file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid document data' })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async uploadDocument(
    @Param('loadId', ParseUUIDPipe) loadId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() documentData: {
      type: DocumentType;
      description?: string;
      metadata?: string;
    },
    @Req() req: Request,
  ): Promise<{ message: string; document: any }> {
    const metadata = documentData.metadata ? JSON.parse(documentData.metadata) : undefined;
    
    const document = await this.loadsService.uploadDocument(
      loadId,
      {
        type: documentData.type,
        file,
        description: documentData.description,
        metadata,
      },
      req.user.userId,
      req.user.tenantId,
    );

    return {
      message: 'Document uploaded successfully',
      document,
    };
  }

  @Delete(':loadId/documents/:documentId')
  @ApiOperation({
    summary: 'Delete document',
    description: 'Deletes a document from a load',
  })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  @ApiResponse({ status: 204, description: 'Document deleted successfully' })
  @ApiResponse({ status: 400, description: 'Document cannot be deleted' })
  @ApiResponse({ status: 404, description: 'Load or document not found' })
  async deleteDocument(
    @Param('loadId', ParseUUIDPipe) loadId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Req() req: Request,
  ): Promise<void> {
    await this.loadsService.deleteDocument(
      documentId,
      req.user.userId,
      req.user.tenantId,
    );
  }

  // Tracking Endpoints

  @Post(':loadId/location')
  @ApiOperation({
    summary: 'Push current GPS location',
    description: 'Updates the current location for a load in transit',
  })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        timestamp: { type: 'string', format: 'date-time' },
        speedKph: { type: 'number' },
        headingDeg: { type: 'number' },
        accuracyM: { type: 'number' },
        address: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        country: { type: 'string' },
        postalCode: { type: 'string' },
      },
      required: ['latitude', 'longitude', 'timestamp'],
    },
  })
  @ApiResponse({ status: 202, description: 'Location update accepted' })
  @ApiResponse({ status: 400, description: 'Invalid location data' })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async updateLocation(
    @Param('loadId', ParseUUIDPipe) loadId: string,
    @Body() locationData: {
      latitude: number;
      longitude: number;
      timestamp: Date;
      speedKph?: number;
      headingDeg?: number;
      accuracyM?: number;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    },
    @Req() req: Request,
  ): Promise<{ message: string; event: any }> {
    const event = await this.loadsService.updateLocation(
      loadId,
      locationData,
      req.user.userId,
      req.user.tenantId,
    );

    return {
      message: 'Location update accepted',
      event,
    };
  }

  @Get(':loadId/tracking')
  @ApiOperation({
    summary: 'Get tracking history',
    description: 'Retrieves the complete tracking history for a load',
  })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiResponse({ status: 200, description: 'Tracking history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async getTrackingHistory(
    @Param('loadId', ParseUUIDPipe) loadId: string,
    @Req() req: Request,
  ): Promise<{ items: any[] }> {
    const events = await this.loadsService.getTrackingHistory(
      loadId,
      req.user.tenantId,
    );

    return { items: events };
  }

  // Alert Endpoints

  @Post(':loadId/alerts')
  @ApiOperation({
    summary: 'Report exception alert',
    description: 'Creates a new alert for a load',
  })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { 
          type: 'string', 
          enum: Object.values(AlertType),
          description: 'Alert type'
        },
        description: { type: 'string' },
        severity: { 
          type: 'string', 
          enum: Object.values(AlertSeverity),
          description: 'Alert severity'
        },
        occurredAt: { type: 'string', format: 'date-time' },
        location: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
          },
        },
        estimatedDelayHours: { type: 'number' },
        contactPerson: { type: 'string' },
        contactPhone: { type: 'string' },
        contactEmail: { type: 'string' },
        metadata: { type: 'string', description: 'JSON stringified metadata' },
      },
      required: ['type', 'description'],
    },
  })
  @ApiResponse({ status: 201, description: 'Alert created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid alert data' })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async createAlert(
    @Param('loadId', ParseUUIDPipe) loadId: string,
    @Body() alertData: {
      type: AlertType;
      description: string;
      severity?: AlertSeverity;
      occurredAt?: Date;
      location?: {
        latitude?: number;
        longitude?: number;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
      };
      estimatedDelayHours?: number;
      contactPerson?: string;
      contactPhone?: string;
      contactEmail?: string;
      metadata?: string;
    },
    @Req() req: Request,
  ): Promise<{ message: string; alert: any }> {
    const metadata = alertData.metadata ? JSON.parse(alertData.metadata) : undefined;
    
    const alert = await this.loadsService.createAlert(
      loadId,
      {
        ...alertData,
        severity: alertData.severity || 'MEDIUM' as any,
        occurredAt: alertData.occurredAt || new Date(),
        metadata,
      },
      req.user.userId,
      req.user.tenantId,
    );

    return {
      message: 'Alert created successfully',
      alert,
    };
  }

  @Get(':loadId/alerts')
  @ApiOperation({
    summary: 'List alerts',
    description: 'Lists all alerts for a load',
  })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async getLoadAlerts(
    @Param('loadId', ParseUUIDPipe) loadId: string,
    @Req() req: Request,
  ): Promise<{ items: any[] }> {
    const alerts = await this.loadsService.getLoadAlerts(
      loadId,
      req.user.tenantId,
    );

    return { items: alerts };
  }

  @Patch(':loadId/alerts/:alertId')
  @ApiOperation({
    summary: 'Update alert status',
    description: 'Updates the status of an alert',
  })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiParam({ name: 'alertId', description: 'Alert ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'string', 
          enum: ['open', 'acknowledged', 'in_progress', 'resolved', 'closed'],
          description: 'New alert status'
        },
        notes: { type: 'string' },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Alert status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status update' })
  @ApiResponse({ status: 404, description: 'Load or alert not found' })
  async updateAlertStatus(
    @Param('loadId', ParseUUIDPipe) loadId: string,
    @Param('alertId', ParseUUIDPipe) alertId: string,
    @Body() updateData: { status: string; notes?: string },
    @Req() req: Request,
  ): Promise<{ message: string; alert: any }> {
    const alert = await this.loadsService.updateAlertStatus(
      alertId,
      updateData.status as any,
      req.user.userId,
      req.user.tenantId,
      updateData.notes,
    );

    return {
      message: 'Alert status updated successfully',
      alert,
    };
  }

  // Pricing Endpoints

  @Get(':loadId/price-suggestion')
  @ApiOperation({
    summary: 'Get dynamic pricing suggestion',
    description: 'Retrieves the current pricing suggestion for a load',
  })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiResponse({ status: 200, description: 'Price suggestion retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Load or price suggestion not found' })
  async getPriceSuggestion(
    @Param('loadId', ParseUUIDPipe) loadId: string,
    @Req() req: Request,
  ): Promise<any> {
    return this.loadsService.getPriceSuggestion(loadId, req.user.tenantId);
  }

  // History Endpoints

  @Get(':loadId/history')
  @ApiOperation({
    summary: 'Change history (audit log)',
    description: 'Retrieves the complete audit log for a load',
  })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Audit records retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async getLoadHistory(
    @Param('loadId', ParseUUIDPipe) loadId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Req() req: Request,
  ): Promise<any> {
    return this.loadsService.getLoadHistory(
      loadId,
      req.user.tenantId,
      page,
      limit,
    );
  }

  // New enriched location endpoints
  @Get(':id/enriched-locations')
  async getCargoWithEnrichedLocations(@Param('id') id: string) {
    return this.loadsService.getCargoWithEnrichedLocations(id);
  }

  @Get('enriched-locations')
  async getAllCargosWithEnrichedLocations(@GetTenant() tenantId: string) {
    return this.loadsService.getAllCargosWithEnrichedLocations(tenantId);
  }

  @Post('enriched-locations')
  async createCargoWithEnrichedLocations(
    @Body() cargoData: any,
    @GetTenant() tenantId: string,
  ) {
    return this.loadsService.createCargoWithEnrichedLocations(
      cargoData,
      tenantId,
    );
  }

  @Get(':id/route-analysis')
  async analyzeCargoRoute(@Param('id') id: string) {
    return this.loadsService.analyzeCargoRoute(id);
  }

  @Post(':id/truck-compatibility')
  async getCargoTruckCompatibility(
    @Param('id') id: string,
    @Body() truckData: any,
  ) {
    return this.loadsService.getCargoTruckCompatibility(id, truckData);
  }

  @Get('location-suggestions')
  async getLocationSuggestionsForCargo(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('locationType') locationType: 'PICKUP' | 'DELIVERY' | 'STOP',
  ) {
    return this.loadsService.getLocationSuggestionsForCargo(
      { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      locationType,
    );
  }

  @Post(':id/enrich-locations')
  async enrichExistingCargoLocations(@Param('id') id: string) {
    return this.loadsService.getCargoWithEnrichedLocations(id);
  }

  @Post('batch-enrich-locations')
  async batchEnrichCargoLocations(@Body() data: { cargoIds: string[] }) {
    const results = new Map();
    for (const cargoId of data.cargoIds) {
      try {
        const result =
          await this.loadsService.getCargoWithEnrichedLocations(cargoId);
        results.set(cargoId, result.enrichedLocations);
      } catch (error) {
        console.error(`Error enriching cargo ${cargoId}:`, error);
      }
    }

    return {
      results,
      summary: {
        totalCargos: data.cargoIds.length,
        totalLocations: Array.from(results.values()).flat().length,
        enrichedLocations: Array.from(results.values()).flat().length,
        errors: [],
      },
    };
  }

  // Private helper method to transform Load entity to LoadResponseDto
  private transformLoadToResponse(load: any): LoadResponseDto {
    return {
      id: load.id,
      title: load.title,
      description: load.description,
      weight: load.weight,
      volume: load.volume,
      cargoType: load.cargoType,
      status: load.status,
      loadValue: load.loadValue,
      offeredPrice: load.offeredPrice,
      currencyCode: load.currencyCode,
      pickupDate: load.pickupDate,
      deliveryDate: load.deliveryDate,
      urgencyLevel: load.urgencyLevel,
      isTimeCritical: load.isTimeCritical,
      isFragile: load.isFragile,
      isHazardous: load.isHazardous,
      requiresRefrigeration: load.requiresRefrigeration,
      length: load.length,
      width: load.width,
      height: load.height,
      requiresGpsMonitoring: load.requiresGpsMonitoring,
      requiresTemperatureMonitoring: load.requiresTemperatureMonitoring,
      publishedAt: load.publishedAt,
      createdAt: load.createdAt,
      updatedAt: load.updatedAt,
      cargoOwner: load.cargoOwner
        ? {
            id: load.cargoOwner.id,
            email: load.cargoOwner.email,
            profile: load.cargoOwner.profile,
          }
        : undefined,
      pickupLocation: (() => {
        const pickupLoc = load.locations?.find((loc) => loc.type === 'PICKUP');
        return pickupLoc
          ? {
              id: pickupLoc.id,
              name: pickupLoc.locationData.name,
              address: pickupLoc.locationData.address,
              coordinates: pickupLoc.locationData.coordinates,
            }
          : undefined;
      })(),
      deliveryLocation: (() => {
        const deliveryLoc = load.locations?.find(
          (loc) => loc.type === 'DELIVERY',
        );
        return deliveryLoc
          ? {
              id: deliveryLoc.id,
              name: deliveryLoc.locationData.name,
              address: deliveryLoc.locationData.address,
              coordinates: deliveryLoc.locationData.coordinates,
            }
          : undefined;
      })(),
    };
  }

  // Private helper method to map CargoTypeV2 to CargoType
  private mapCargoTypeV2ToEntity(cargoTypeV2: any): CargoType {
    const mapping = {
      GENERAL: CargoType.GENERAL,
      FOOD: CargoType.GENERAL,
      ELECTRONICS: CargoType.FRAGILE,
      CHEMICALS: CargoType.HAZARDOUS,
      AUTOMOTIVE: CargoType.GENERAL,
      TEXTILES: CargoType.GENERAL,
      MACHINERY: CargoType.OVERSIZED,
    };
    return mapping[cargoTypeV2] || CargoType.GENERAL;
  }

  // ===== DRAFT CARGO MANAGEMENT ENDPOINTS =====

  @Post('draft')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for drafts
  @ApiOperation({
    summary: 'Save Cargo as Draft',
    description: `
    Saves incomplete cargo information as a draft, allowing users to resume the process later.
    
    **Features:**
    - Saves partial cargo data without validation requirements
    - Allows incremental updates to draft cargo
    - Drafts are not visible to truck owners until published
    - Users can save multiple drafts and work on them over time
    
    **Use Cases:**
    - User starts creating cargo but needs to gather more information
    - User wants to save progress and continue later
    - User wants to create multiple cargo drafts before deciding which to publish
    `,
  })
  @ApiBody({
    type: CreateLoadDto,
    description: 'Partial cargo data to save as draft (validation is relaxed)',
  })
  @ApiResponse({
    status: 201,
    description: 'Cargo draft saved successfully',
    type: LoadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async saveAsDraft(
    @Body() createLoadDto: CreateLoadDto,
    @Req() req: Request,
  ): Promise<{ message: string; load: LoadResponseDto }> {
    try {
      console.log('Controller: Starting save as draft...');
      console.log('Controller: User ID:', req.user.userId);
      
      const result = await this.loadsService.saveAsDraft(createLoadDto, req.user.userId);
      return {
        message: 'Cargo draft saved successfully. You can continue editing and publish when ready.',
        load: result,
      };
    } catch (error) {
      console.error('Controller: Error saving draft:', error);
      throw error;
    }
  }

  @Patch('draft/:id')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute for draft updates
  @ApiOperation({
    summary: 'Update Cargo Draft',
    description: `
    Updates an existing cargo draft with new or modified information.
    
    **Features:**
    - Allows incremental updates to draft cargo
    - Maintains draft status until explicitly published
    - Supports partial updates (only provided fields are updated)
    - Preserves existing data for fields not included in update
    
    **Use Cases:**
    - User wants to add more details to existing draft
    - User wants to modify specific fields in draft
    - User wants to complete draft information step by step
    `,
  })
  @ApiParam({ name: 'id', description: 'Draft cargo ID' })
  @ApiBody({
    type: UpdateLoadDto,
    description: 'Updated cargo data (only provided fields will be updated)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cargo draft updated successfully',
    type: LoadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided',
  })
  @ApiResponse({
    status: 404,
    description: 'Draft cargo not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot update published cargo as draft',
  })
  async updateDraft(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLoadDto: UpdateLoadDto,
    @Req() req: Request,
  ): Promise<{ message: string; load: LoadResponseDto }> {
    try {
      console.log('Controller: Starting update draft...');
      console.log('Controller: Draft ID:', id);
      console.log('Controller: User ID:', req.user.userId);
      
      const result = await this.loadsService.updateDraft(id, updateLoadDto, req.user.userId);
      return {
        message: 'Cargo draft updated successfully. Continue editing or publish when ready.',
        load: result,
      };
    } catch (error) {
      console.error('Controller: Error updating draft:', error);
      throw error;
    }
  }

  @Get('drafts')
  @ApiOperation({
    summary: 'Get User Draft Cargo',
    description: `
    Retrieves all draft cargo for the authenticated user.
    
    **Features:**
    - Returns only draft status cargo
    - Includes basic cargo information for draft management
    - Supports pagination for users with many drafts
    - Drafts are not visible to truck owners
    
    **Use Cases:**
    - User wants to see all their saved drafts
    - User wants to continue working on specific drafts
    - User wants to manage multiple draft cargos
    `,
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({
    status: 200,
    description: 'Draft cargo retrieved successfully',
    type: LoadsPaginatedResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getUserDrafts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Req() req: Request,
  ): Promise<LoadsPaginatedResponseDto> {
    try {
      console.log('Controller: Getting user drafts...');
      console.log('Controller: User ID:', req.user.userId);
      console.log('Controller: Page:', page, 'Limit:', limit);
      
      return await this.loadsService.getUserDrafts(req.user.userId, page, limit);
    } catch (error) {
      console.error('Controller: Error getting user drafts:', error);
      throw error;
    }
  }

  @Post('draft/:id/publish')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute for moving to created status
  @ApiOperation({
    summary: 'Move Cargo Draft to Created Status',
    description: `
    Moves a draft cargo to created status, making it ready for matching and publishing.
    
    **Features:**
    - Converts draft status to created status
    - Validates all required fields before moving
    - Makes cargo ready for truck matching
    - Triggers notification to relevant truck owners
    
    **Requirements:**
    - Cargo must be in DRAFT status
    - All required fields must be completed
    - Cargo must pass validation checks
    
    **Use Cases:**
    - User has completed draft and wants to make it available for matching
    - User wants to prepare cargo for truck bidding
    - User wants to activate cargo in the matching system
    `,
  })
  @ApiParam({ name: 'id', description: 'Draft cargo ID to publish' })
  @ApiResponse({
    status: 200,
    description: 'Cargo draft moved to created status successfully',
    type: LoadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation failed or cargo not ready for created status',
  })
  @ApiResponse({
    status: 404,
    description: 'Draft cargo not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot move non-draft cargo to created status',
  })
  async publishDraft(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<{ message: string; load: LoadResponseDto }> {
    try {
      console.log('Controller: Starting move draft to created status...');
      console.log('Controller: Draft ID:', id);
      console.log('Controller: User ID:', req.user.userId);
      
      const result = await this.loadsService.publishDraft(id, req.user.userId);
      return {
        message: 'Cargo moved to created status successfully! It is now ready for matching and publishing to truck owners.',
        load: result,
      };
    } catch (error) {
      console.error('Controller: Error moving draft to created status:', error);
      throw error;
    }
  }

  @Delete('draft/:id')
  @ApiOperation({
    summary: 'Delete Cargo Draft',
    description: `
    Permanently deletes a cargo draft.
    
    **Features:**
    - Removes draft cargo completely
    - Cannot be undone
    - Only affects draft status cargo
    
    **Use Cases:**
    - User wants to remove unwanted draft
    - User wants to start fresh with new draft
    - User wants to clean up old drafts
    `,
  })
  @ApiParam({ name: 'id', description: 'Draft cargo ID to delete' })
  @ApiResponse({
    status: 200,
    description: 'Cargo draft deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Draft cargo not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot delete published cargo',
  })
  async deleteDraft(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    try {
      console.log('Controller: Starting delete draft...');
      console.log('Controller: Draft ID:', id);
      console.log('Controller: User ID:', req.user.userId);
      
      await this.loadsService.deleteDraft(id, req.user.userId);
      return {
        message: 'Cargo draft deleted successfully.',
      };
    } catch (error) {
      console.error('Controller: Error deleting draft:', error);
      throw error;
    }
  }
}
