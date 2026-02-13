import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CargoService } from './cargo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { LoadStatus } from '../../entities/load.entity';

@ApiTags('Cargo Management')
@Controller('cargo')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CargoController {
  constructor(private readonly cargoService: CargoService) {}

  @Get(':tenantId/summary')
  @ApiOperation({
    summary: 'Get cargo summary',
    description: 'Get comprehensive cargo summary for a tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiOkResponse({
    description: 'Cargo summary retrieved successfully',
    type: ApiResponseDto,
  })
  async getCargoSummary(
    @Param('tenantId') tenantId: string,
  ): Promise<ApiResponseDto<any>> {
    const summary = await this.cargoService.getCargoSummary(tenantId);

    return {
      success: true,
      statusCode: 200,
      message: 'Cargo summary retrieved successfully',
      data: summary,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':tenantId/cargo-owners')
  @ApiOperation({
    summary: 'Get cargo owners',
    description: 'Get list of cargo owners for a tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiOkResponse({
    description: 'Cargo owners retrieved successfully',
    type: ApiResponseDto,
  })
  async getCargoOwners(
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

    const result = await this.cargoService.getCargoOwners(tenantId, filters);

    return {
      success: true,
      statusCode: 200,
      message: 'Cargo owners retrieved successfully',
      data: {
        cargoOwners: result.cargoOwners,
        total: result.total,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':tenantId/loads')
  @ApiOperation({
    summary: 'Get loads',
    description: 'Get list of loads for a tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiQuery({ name: 'ownerId', required: false, description: 'Filter by owner ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ 
    name: 'loadType', 
    required: false, 
    description: 'Filter by load type: all, own-cargo, own-fleet',
    enum: ['all', 'own-cargo', 'own-fleet']
  })
  @ApiOkResponse({
    description: 'Loads retrieved successfully',
    type: ApiResponseDto,
  })
  async getLoads(
    @Param('tenantId') tenantId: string,
    @Query('ownerId') ownerId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('loadType') loadType?: 'all' | 'own-cargo' | 'own-fleet',
  ): Promise<ApiResponseDto<any>> {
    const filters = {
      ownerId,
      status: status as LoadStatus,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      loadType: loadType || 'all',
    };

    const result = await this.cargoService.getLoads(tenantId, filters);

    return {
      success: true,
      statusCode: 200,
      message: 'Loads retrieved successfully',
      data: {
        loads: result.loads,
        total: result.total,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':tenantId/cargo-owners/:ownerId')
  @ApiOperation({
    summary: 'Get cargo owner details',
    description: 'Get detailed information about a specific cargo owner',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'ownerId', description: 'Owner ID' })
  @ApiOkResponse({
    description: 'Cargo owner details retrieved successfully',
    type: ApiResponseDto,
  })
  async getCargoOwnerById(
    @Param('tenantId') tenantId: string,
    @Param('ownerId') ownerId: string,
  ): Promise<ApiResponseDto<any>> {
    const owner = await this.cargoService.getCargoOwnerById(tenantId, ownerId);

    if (!owner) {
      return {
        success: false,
        statusCode: 404,
        message: 'Cargo owner not found',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Cargo owner details retrieved successfully',
      data: owner,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':tenantId/loads/:loadId')
  @ApiOperation({
    summary: 'Get load details',
    description: 'Get detailed information about a specific load',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'loadId', description: 'Load ID' })
  @ApiOkResponse({
    description: 'Load details retrieved successfully',
    type: ApiResponseDto,
  })
  async getLoadById(
    @Param('tenantId') tenantId: string,
    @Param('loadId') loadId: string,
  ): Promise<ApiResponseDto<any>> {
    const load = await this.cargoService.getLoadById(tenantId, loadId);

    if (!load) {
      return {
        success: false,
        statusCode: 404,
        message: 'Load not found',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Load details retrieved successfully',
      data: load,
      timestamp: new Date().toISOString(),
    };
  }
}
