import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TenantGuard } from './tenant.guard';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { FindTenantsDto, UpdateTenantDto } from './dto/tenant.dto';

@ApiTags('Tenant Management')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  private createApiResponse<T>(
    data: T,
    message: string,
    statusCode: number = 200,
  ): ApiResponseDto<T> {
    return {
      success: true,
      data,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({
    summary: 'Create a new tenant',
    description: 'Create a new tenant (Super Admin only)',
  })
  @ApiCreatedResponse({
    description: 'Tenant created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid' },
            name: { type: 'string', example: 'Acme Logistics' },
            subdomain: { type: 'string', example: 'acme' },
            status: { type: 'string', example: 'PENDING_ACTIVATION' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Super Admin access required',
  })
  async createTenant(@Body() createTenantDto: any): Promise<ApiResponseDto> {
    const tenant = await this.tenantService.createTenant(createTenantDto);
    return this.createApiResponse(tenant, 'Tenant created successfully', 201);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({
    summary: 'Get all tenants',
    description: 'Get all tenants (Super Admin only)',
  })
  @ApiOkResponse({
    description: 'Tenants retrieved successfully',
  })
  async getAllTenants(): Promise<ApiResponseDto> {
    const tenants = await this.tenantService.getAllTenants();
    return this.createApiResponse(tenants, 'Tenants retrieved successfully');
  }

  @Get('search')
  @ApiOperation({
    summary: 'Get Searched tenants (Public)',
    description: 'Public endpoint to search tenants for signup. Returns only ACTIVE tenants that users can sign up for.',
  })
  @ApiOkResponse({
    description: 'Active tenants retrieved successfully',
  })
  // No guards - this is a public endpoint for signup
  async getTenantSearch(@Query() query: FindTenantsDto) {
    console.log('🔍 [PUBLIC] Tenant search endpoint called');
    console.log('🔍 [PUBLIC] Query params:', query);
    console.log('🔍 [PUBLIC] Request headers:', JSON.stringify(query));
    
    try {
      const tenants = await this.tenantService.getSearchedTenants(query);
      console.log('✅ [PUBLIC] Tenants found:', tenants);
      console.log('✅ [PUBLIC] Tenants count:', tenants?.results?.length || tenants?.total || 0);
      console.log('✅ [PUBLIC] All tenants:', JSON.stringify(tenants, null, 2));
      
      const response = this.createApiResponse(tenants, 'Tenants retrieved successfully');
      console.log('✅ [PUBLIC] Response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error('❌ [PUBLIC] Error in tenant search:', error);
      console.error('❌ [PUBLIC] Error message:', error?.message);
      throw error;
    }
  }

  @Get('active')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({
    summary: 'Get active tenants',
    description: 'Get all active tenants (Super Admin only)',
  })
  @ApiOkResponse({
    description: 'Active tenants retrieved successfully',
  })
  async getActiveTenants(): Promise<ApiResponseDto> {
    const tenants = await this.tenantService.getActiveTenants();
    return this.createApiResponse(
      tenants,
      'Active tenants retrieved successfully',
    );
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({
    summary: 'Get tenant by ID',
    description: 'Get tenant details by ID (Super Admin only)',
  })
  @ApiOkResponse({
    description: 'Tenant retrieved successfully',
  })
  async getTenantById(@Param('id') id: string): Promise<ApiResponseDto> {
    const tenant = await this.tenantService.findTenantById(id);
    return this.createApiResponse(tenant, 'Tenant retrieved successfully');
  }

  @Get(':id/stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({
    summary: 'Get tenant statistics',
    description: 'Get tenant statistics by ID (Super Admin only)',
  })
  @ApiOkResponse({
    description: 'Tenant statistics retrieved successfully',
  })
  async getTenantStats(@Param('id') id: string): Promise<ApiResponseDto> {
    const stats = await this.tenantService.getTenantStats(id);
    return this.createApiResponse(
      stats,
      'Tenant statistics retrieved successfully',
    );
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({
    summary: 'Update tenant',
    description: 'Update tenant details (Super Admin only)',
  })
  @ApiOkResponse({
    description: 'Tenant updated successfully',
  })
  async updateTenant(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<ApiResponseDto> {
    const tenant = await this.tenantService.updateTenant(id, updateTenantDto);
    return this.createApiResponse(tenant, 'Tenant updated successfully');
  }

  @Post(':id/activate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({
    summary: 'Activate tenant',
    description: 'Activate a tenant (Super Admin only)',
  })
  @ApiOkResponse({
    description: 'Tenant activated successfully',
  })
  async activateTenant(@Param('id') id: string): Promise<ApiResponseDto> {
    const tenant = await this.tenantService.activateTenant(id);
    return this.createApiResponse(tenant, 'Tenant activated successfully');
  }

  @Post(':id/suspend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({
    summary: 'Suspend tenant',
    description: 'Suspend a tenant (Super Admin only)',
  })
  @ApiOkResponse({
    description: 'Tenant suspended successfully',
  })
  async suspendTenant(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ): Promise<ApiResponseDto> {
    const tenant = await this.tenantService.suspendTenant(id, body.reason);
    return this.createApiResponse(tenant, 'Tenant suspended successfully');
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({
    summary: 'Delete tenant (Soft Delete)',
    description: 'Soft delete a tenant by setting status to DEACTIVATED (Super Admin only)',
  })
  @ApiOkResponse({
    description: 'Tenant deactivated successfully',
  })
  async deleteTenant(@Param('id') id: string): Promise<ApiResponseDto> {
    const tenant = await this.tenantService.deleteTenant(id);
    return this.createApiResponse(tenant, 'Tenant deactivated successfully');
  }
}
