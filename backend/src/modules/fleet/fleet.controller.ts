import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FleetService } from './fleet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { VehicleStatus } from '../../entities/truck.entity';

@ApiTags('Fleet Management')
@Controller('fleet')
@UseGuards(JwtAuthGuard, TenantGuard)
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get(':tenantId/summary')
  @ApiOperation({
    summary: 'Get fleet summary',
    description: 'Get comprehensive fleet summary for a tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiOkResponse({
    description: 'Fleet summary retrieved successfully',
    type: ApiResponseDto,
  })
  async getFleetSummary(
    @Param('tenantId') tenantId: string,
  ): Promise<ApiResponseDto<any>> {
    const summary = await this.fleetService.getFleetSummary(tenantId);

    return {
      success: true,
      statusCode: 200,
      message: 'Fleet summary retrieved successfully',
      data: summary,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':tenantId/utilization')
  @ApiOperation({
    summary: 'Get fleet utilization',
    description: 'Get fleet utilization metrics over time',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiOkResponse({
    description: 'Fleet utilization retrieved successfully',
    type: ApiResponseDto,
  })
  async getFleetUtilization(
    @Param('tenantId') tenantId: string,
  ): Promise<ApiResponseDto<any>> {
    const utilization = await this.fleetService.getFleetUtilization(tenantId);

    return {
      success: true,
      statusCode: 200,
      message: 'Fleet utilization retrieved successfully',
      data: utilization,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':tenantId/truck-owners')
  @ApiOperation({
    summary: 'Get truck owners',
    description: 'Get list of truck owners for a tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiOkResponse({
    description: 'Truck owners retrieved successfully',
    type: ApiResponseDto,
  })
  async getTruckOwners(
    @Param('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponseDto<any>> {
    const filters = {
      status,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    };

    const result = await this.fleetService.getTruckOwners(tenantId, filters);

    return {
      success: true,
      statusCode: 200,
      message: 'Truck owners retrieved successfully',
      data: {
        truckOwners: result.truckOwners,
        total: result.total,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':tenantId/trucks')
  @ApiOperation({
    summary: 'Get trucks',
    description: 'Get list of trucks for a tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiQuery({ name: 'ownerId', required: false, description: 'Filter by owner ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiOkResponse({
    description: 'Trucks retrieved successfully',
    type: ApiResponseDto,
  })
  async getTrucks(
    @Param('tenantId') tenantId: string,
    @Query('ownerId') ownerId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponseDto<any>> {
    const filters = {
      ownerId,
      status: status as VehicleStatus,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    };

    const result = await this.fleetService.getTrucks(tenantId, filters);

    return {
      success: true,
      statusCode: 200,
      message: 'Trucks retrieved successfully',
      data: {
        trucks: result.trucks,
        total: result.total,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':tenantId/truck-owners/:ownerId')
  @ApiOperation({
    summary: 'Get truck owner details',
    description: 'Get detailed information about a specific truck owner',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'ownerId', description: 'Owner ID' })
  @ApiOkResponse({
    description: 'Truck owner details retrieved successfully',
    type: ApiResponseDto,
  })
  async getTruckOwnerById(
    @Param('tenantId') tenantId: string,
    @Param('ownerId') ownerId: string,
  ): Promise<ApiResponseDto<any>> {
    const owner = await this.fleetService.getTruckOwnerById(tenantId, ownerId);

    if (!owner) {
      return {
        success: false,
        statusCode: 404,
        message: 'Truck owner not found',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Truck owner details retrieved successfully',
      data: owner,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':tenantId/trucks/:truckId')
  @ApiOperation({
    summary: 'Get truck details',
    description: 'Get detailed information about a specific truck',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'truckId', description: 'Truck ID' })
  @ApiOkResponse({
    description: 'Truck details retrieved successfully',
    type: ApiResponseDto,
  })
  async getTruckById(
    @Param('tenantId') tenantId: string,
    @Param('truckId') truckId: string,
  ): Promise<ApiResponseDto<any>> {
    const truck = await this.fleetService.getTruckById(tenantId, truckId);

    if (!truck) {
      return {
        success: false,
        statusCode: 404,
        message: 'Truck not found',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Truck details retrieved successfully',
      data: truck,
      timestamp: new Date().toISOString(),
    };
  }
}
