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
  HttpStatus,
  HttpException,
  ParseUUIDPipe,
  ValidationPipe,
  UsePipes,
  UseInterceptors,
  ClassSerializerInterceptor,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
  ApiProduces,
} from '@nestjs/swagger';
import { LoadsV2Service } from './loads-v2.service';
import {
  CreateLoadV2Dto,
  UpdateLoadV2Dto,
  LoadQueryV2Dto,
  LoadStatusV2,
  PaginatedResponseV2,
} from './dto/load-v2.dto';
import { LoadResponseV2Dto } from './dto/load-response-v2.dto';
import { User } from '../../entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PreTripInspectionService } from '../drivers/pre-trip-inspection.service';
import { MarkReadyForReInspectionDto, ApprovePreTripInspectionDto } from '../drivers/dto/pre-trip-inspection.dto';

@ApiTags('loads-v2')
@Controller('loads-v2')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class LoadsV2Controller {
  constructor(
    private readonly loadsV2Service: LoadsV2Service,
    private readonly preTripInspectionService: PreTripInspectionService,
  ) {}

  // Test endpoint removed - using the existing test/health endpoint

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('cargo:create')
  @ApiOperation({
    summary: 'Create a new load V2',
    description:
      'Creates a new freight load with all specified requirements and preferences',
  })
  @ApiResponse({
    status: 201,
    description: 'Load successfully created',
    type: LoadResponseV2Dto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  async create(
    @Body() createLoadDto: CreateLoadV2Dto,
    @Request() req,
  ): Promise<LoadResponseV2Dto> {
    try {
      if (!req.user) {
        throw new HttpException('Unauthorized - User not authenticated', HttpStatus.UNAUTHORIZED);
      }
      const user = req.user as User;
      return await this.loadsV2Service.create(createLoadDto, user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all loads V2 with filtering and pagination',
    description:
      'Retrieves a paginated list of loads with optional filtering by status, cargo type, dates, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Loads retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/LoadResponseV2Dto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
            hasNextPage: { type: 'boolean' },
            hasPreviousPage: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid query parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findAll(
    @Query() queryDto: LoadQueryV2Dto,
    @Request() req,
  ): Promise<PaginatedResponseV2<LoadResponseV2Dto>> {
    try {
      if (!req.user) {
        throw new HttpException('Unauthorized - User not authenticated', HttpStatus.UNAUTHORIZED);
      }
      const user = req.user as User;
      return await this.loadsV2Service.findAll(queryDto, user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve loads',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('published')
  @ApiOperation({
    summary: 'Get published loads V2',
    description: 'Retrieves only published loads available for matching',
  })
  @ApiResponse({
    status: 200,
    description: 'Published loads retrieved successfully',
  })
  async findPublished(
    @Query() queryDto: LoadQueryV2Dto,
    @Request() req,
  ): Promise<PaginatedResponseV2<LoadResponseV2Dto>> {
    try {
      const user = req.user as User;
      return await this.loadsV2Service.findPublished(queryDto, user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve published loads',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('my-loads')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get user's loads V2",
    description: 'Retrieves loads created by the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User loads retrieved successfully',
  })
  async findMyLoads(
    @Query() queryDto: LoadQueryV2Dto,
    @Request() req,
  ): Promise<PaginatedResponseV2<LoadResponseV2Dto>> {
    try {
      if (!req.user) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      const user = req.user as User;
      return await this.loadsV2Service.findByUser(queryDto, user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve user loads',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('assigned-loads')
  @ApiOperation({
    summary: "Get loads assigned to truck owner's trucks",
    description: 'Retrieves loads assigned to trucks owned by the authenticated truck owner',
  })
  @ApiResponse({
    status: 200,
    description: 'Assigned loads retrieved successfully',
  })
  async getAssignedLoads(
    @Query() queryDto: LoadQueryV2Dto,
    @Request() req,
  ): Promise<PaginatedResponseV2<LoadResponseV2Dto>> {
    try {
      const user = req.user as User;
      return await this.loadsV2Service.getAssignedLoadsForTruckOwner(
        queryDto,
        user,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve assigned loads',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search loads V2',
    description: 'Search loads with advanced filtering and text search',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  async searchLoads(
    @Query() searchParams: any,
    @Request() req,
  ): Promise<PaginatedResponseV2<LoadResponseV2Dto>> {
    try {
      const user = req.user as User;
      return await this.loadsV2Service.searchLoads(searchParams, user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to search loads',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('my-cargo-inspections')
  @ApiOperation({
    summary: 'Get cargo inspection overview for cargo owner or broker',
    description:
      'Returns pre-trip and post-delivery inspections scoped to the authenticated user\'s own cargo (cargo owner) or brokered loads (broker).',
  })
  async getMyCargoInspections(@Request() req) {
    const userId = req.user.userId || req.user.id;
    return this.preTripInspectionService.getCargoOwnerInspectionOverview(
      userId,
      req.user.tenantId,
      req.user.role,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get load by ID V2',
    description: 'Retrieves a specific load by its ID',
  })
  @ApiParam({ name: 'id', description: 'Load ID' })
  @ApiResponse({
    status: 200,
    description: 'Load retrieved successfully',
    type: LoadResponseV2Dto,
  })
  @ApiResponse({
    status: 404,
    description: 'Load not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<LoadResponseV2Dto> {
    try {
      const user = req.user as User;
      
      // Log for debugging
      if (!user) {
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }
      
      return await this.loadsV2Service.findOne(id, user);
    } catch (error) {
      // Log the full error for debugging
      console.error('Error in findOne controller:', {
        loadId: id,
        userId: req.user?.id,
        userRole: req.user?.role,
        error: error.message,
        stack: error.stack,
      });
      
      throw new HttpException(
        error.message || 'Failed to retrieve load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('cargo:edit')
  @ApiOperation({
    summary: 'Update load V2',
    description: 'Updates an existing load',
  })
  @ApiParam({ name: 'id', description: 'Load ID' })
  @ApiResponse({
    status: 200,
    description: 'Load updated successfully',
    type: LoadResponseV2Dto,
  })
  @ApiResponse({
    status: 404,
    description: 'Load not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLoadDto: UpdateLoadV2Dto,
    @Request() req,
  ): Promise<LoadResponseV2Dto> {
    try {
      if (!req.user || !req.user.id) {
        throw new HttpException('Unauthorized - User not authenticated', HttpStatus.UNAUTHORIZED);
      }
      const user = req.user as User;
      return await this.loadsV2Service.update(id, updateLoadDto, user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/publish')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('cargo:publish', 'cargo:edit', 'cargo:create')
  @ApiOperation({
    summary: 'Publish load V2',
    description: 'Publishes a draft load to make it available for matching',
  })
  @ApiParam({ name: 'id', description: 'Load ID' })
  @ApiResponse({
    status: 200,
    description: 'Load published successfully',
    type: LoadResponseV2Dto,
  })
  @ApiResponse({
    status: 404,
    description: 'Load not found',
  })
  async publishLoad(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<LoadResponseV2Dto> {
    try {
      const user = req.user as User;
      return await this.loadsV2Service.publishLoad(id, user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to publish load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/unpublish')
  @ApiOperation({
    summary: 'Unpublish load V2',
    description: 'Unpublishes a load to make it unavailable for matching',
  })
  @ApiParam({ name: 'id', description: 'Load ID' })
  @ApiResponse({
    status: 200,
    description: 'Load unpublished successfully',
    type: LoadResponseV2Dto,
  })
  @ApiResponse({
    status: 404,
    description: 'Load not found',
  })
  async unpublishLoad(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<LoadResponseV2Dto> {
    try {
      const user = req.user as User;
      return await this.loadsV2Service.unpublishLoad(id, user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to unpublish load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/assign-truck/:truckId')
  @ApiOperation({
    summary: 'Assign truck to load V2',
    description: 'Assigns a truck to a load',
  })
  @ApiParam({ name: 'id', description: 'Load ID' })
  @ApiParam({ name: 'truckId', description: 'Truck ID' })
  @ApiResponse({
    status: 200,
    description: 'Truck assigned successfully',
    type: LoadResponseV2Dto,
  })
  @ApiResponse({
    status: 404,
    description: 'Load or truck not found',
  })
  async assignTruck(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('truckId', ParseUUIDPipe) truckId: string,
    @Request() req,
  ): Promise<LoadResponseV2Dto> {
    try {
      const user = req.user as User;
      return await this.loadsV2Service.assignTruck(id, truckId, user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to assign truck',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/unassign-truck')
  @ApiOperation({
    summary: 'Unassign truck from load V2',
    description: 'Removes truck assignment from a load',
  })
  @ApiParam({ name: 'id', description: 'Load ID' })
  @ApiResponse({
    status: 200,
    description: 'Truck unassigned successfully',
    type: LoadResponseV2Dto,
  })
  @ApiResponse({
    status: 404,
    description: 'Load not found',
  })
  async unassignTruck(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<LoadResponseV2Dto> {
    try {
      const user = req.user as User;
      return await this.loadsV2Service.unassignTruck(id, user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to unassign truck',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/rate')
  @ApiOperation({
    summary: 'Rate load V2',
    description: 'Rate a completed load',
  })
  @ApiParam({ name: 'id', description: 'Load ID' })
  @ApiResponse({
    status: 200,
    description: 'Load rated successfully',
    type: LoadResponseV2Dto,
  })
  @ApiResponse({
    status: 404,
    description: 'Load not found',
  })
  async rateLoad(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() ratingData: { rating: number; comment?: string },
    @Request() req,
  ): Promise<LoadResponseV2Dto> {
    try {
      const user = req.user as User;
      return await this.loadsV2Service.rateLoad(
        id,
        ratingData.rating,
        ratingData.comment || '',
        user,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to rate load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/matching-trucks')
  @ApiOperation({
    summary: 'Get matching trucks for load V2',
    description: 'Retrieves trucks that match the load requirements',
  })
  @ApiParam({ name: 'id', description: 'Load ID' })
  @ApiResponse({
    status: 200,
    description: 'Matching trucks retrieved successfully',
  })
  async getMatchingTrucks(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<any[]> {
    try {
      const user = req.user as User;
      return await this.loadsV2Service.findMatchingTrucks(id, user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get matching trucks',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/tracking')
  @ApiOperation({
    summary: 'Get load tracking V2',
    description: 'Retrieves tracking information for a load',
  })
  @ApiParam({ name: 'id', description: 'Load ID' })
  @ApiResponse({
    status: 200,
    description: 'Tracking information retrieved successfully',
  })
  async getLoadTracking(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<any> {
    try {
      const user = req.user as User;
      return await this.loadsV2Service.getLoadTracking(id, user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get tracking information',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('cargo:delete')
  @ApiOperation({
    summary: 'Delete load V2',
    description: 'Deletes a load',
  })
  @ApiParam({ name: 'id', description: 'Load ID' })
  @ApiResponse({
    status: 200,
    description: 'Load deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Load not found',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    try {
      const user = req.user as User;
      await this.loadsV2Service.remove(id, user);
      return { message: 'Load deleted successfully' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete load',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('analytics/dashboard')
  @ApiOperation({
    summary: 'Get dashboard analytics V2',
    description: 'Retrieves analytics data for the dashboard',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period (7d, 30d, 90d)',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
  })
  async getDashboardAnalytics(
    @Request() req,
    @Query('period') period?: string,
  ): Promise<any> {
    try {
      const user = req.user as User;
      return await this.loadsV2Service.getDashboardAnalytics(user, period);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get analytics',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/pre-trip-inspection/ready-for-reinspection')
  @ApiOperation({
    summary: 'Mark pre-trip inspection issues as resolved and ready for re-inspection',
    description: 'Cargo owners and brokers use this after correcting reported issues.',
  })
  @ApiParam({ name: 'id', description: 'Load ID' })
  async markReadyForReInspection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: MarkReadyForReInspectionDto,
    @Request() req,
  ) {
    return this.preTripInspectionService.markReadyForReInspection(
      id,
      req.user.userId || req.user.id,
      req.user.tenantId,
      body,
    );
  }

  @Patch(':id/pre-trip-inspection/approve')
  @ApiOperation({
    summary: 'Approve pre-trip inspection and give green light to start shipping',
    description:
      'Cargo owners and brokers approve the driver pre-trip inspection so loading and trip start can proceed.',
  })
  @ApiParam({ name: 'id', description: 'Load ID' })
  async approvePreTripInspection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ApprovePreTripInspectionDto,
    @Request() req,
  ) {
    return this.preTripInspectionService.approvePreTripInspection(
      id,
      req.user.userId || req.user.id,
      req.user.tenantId,
      body,
    );
  }

  @Get(':id/pre-trip-inspection/history')
  @ApiOperation({
    summary: 'Get pre-trip inspection history for a load',
  })
  @ApiParam({ name: 'id', description: 'Load ID' })
  async getPreTripInspectionHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    return this.preTripInspectionService.getInspectionHistory(
      id,
      req.user.tenantId,
      req.user.userId || req.user.id,
    );
  }

  @Get('test/health')
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Simple health check for the loads V2 module',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  async test(): Promise<{ message: string; timestamp: string }> {
    return {
      message: 'Loads V2 service is running',
      timestamp: new Date().toISOString(),
    };
  }
}

