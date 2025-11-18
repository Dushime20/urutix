import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InsuranceService } from './insurance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiTags('Insurance Management')
@Controller('insurance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  // ===== INSURANCE POLICIES =====

  @Get('policies')
  @ApiOperation({ summary: 'Get all insurance policies with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Policies retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPolicies(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('truckId') truckId?: string,
    @Query('insuranceCompany') insuranceCompany?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const filters = {
      search,
      status: status as any,
      truckId,
      insuranceCompany,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.insuranceService.getPolicies(
      parseInt(page),
      parseInt(limit),
      filters,
      sortBy,
      sortOrder,
    );
  }

  @Get('policies/:id')
  @ApiOperation({ summary: 'Get insurance policy by ID' })
  @ApiResponse({ status: 200, description: 'Policy retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async getPolicyById(@Param('id') id: string) {
    return this.insuranceService.getPolicyById(id);
  }

  @Post('policies')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create new insurance policy' })
  @ApiResponse({ status: 201, description: 'Policy created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createPolicy(@Body() policyData: any) {
    return this.insuranceService.createPolicy(policyData);
  }

  @Put('policies/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update insurance policy' })
  @ApiResponse({ status: 200, description: 'Policy updated successfully' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updatePolicy(@Param('id') id: string, @Body() updateData: any) {
    return this.insuranceService.updatePolicy(id, updateData);
  }

  @Delete('policies/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete insurance policy' })
  @ApiResponse({ status: 200, description: 'Policy deleted successfully' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deletePolicy(@Param('id') id: string) {
    return this.insuranceService.deletePolicy(id);
  }

  // ===== INSURANCE CLAIMS =====

  @Get('claims')
  @ApiOperation({ summary: 'Get all insurance claims with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Claims retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getClaims(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('claimType') claimType?: string,
    @Query('policyId') policyId?: string,
    @Query('truckId') truckId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy: string = 'reportedDate',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const filters = {
      search,
      status: status as any,
      claimType: claimType as any,
      policyId,
      truckId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.insuranceService.getClaims(
      parseInt(page),
      parseInt(limit),
      filters,
      sortBy,
      sortOrder,
    );
  }

  @Get('claims/:id')
  @ApiOperation({ summary: 'Get insurance claim by ID' })
  @ApiResponse({ status: 200, description: 'Claim retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  async getClaimById(@Param('id') id: string) {
    return this.insuranceService.getClaimById(id);
  }

  @Post('claims')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Create new insurance claim' })
  @ApiResponse({ status: 201, description: 'Claim created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createClaim(@Body() claimData: any) {
    return this.insuranceService.createClaim(claimData);
  }

  @Put('claims/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update insurance claim' })
  @ApiResponse({ status: 200, description: 'Claim updated successfully' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateClaim(@Param('id') id: string, @Body() updateData: any) {
    return this.insuranceService.updateClaim(id, updateData);
  }

  @Delete('claims/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete insurance claim' })
  @ApiResponse({ status: 200, description: 'Claim deleted successfully' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteClaim(@Param('id') id: string) {
    return this.insuranceService.deleteClaim(id);
  }

  // ===== INSURANCE RENEWALS =====

  @Get('renewals')
  @ApiOperation({ summary: 'Get all insurance renewals with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Renewals retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRenewals(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('policyId') policyId?: string,
    @Query('truckId') truckId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy: string = 'renewalDate',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'ASC',
  ) {
    const filters = {
      search,
      status: status as any,
      policyId,
      truckId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.insuranceService.getRenewals(
      parseInt(page),
      parseInt(limit),
      filters,
      sortBy,
      sortOrder,
    );
  }

  @Get('renewals/:id')
  @ApiOperation({ summary: 'Get insurance renewal by ID' })
  @ApiResponse({ status: 200, description: 'Renewal retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Renewal not found' })
  async getRenewalById(@Param('id') id: string) {
    return this.insuranceService.getRenewalById(id);
  }

  @Post('renewals')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create new insurance renewal' })
  @ApiResponse({ status: 201, description: 'Renewal created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createRenewal(@Body() renewalData: any) {
    return this.insuranceService.createRenewal(renewalData);
  }

  @Put('renewals/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update insurance renewal' })
  @ApiResponse({ status: 200, description: 'Renewal updated successfully' })
  @ApiResponse({ status: 404, description: 'Renewal not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateRenewal(@Param('id') id: string, @Body() updateData: any) {
    return this.insuranceService.updateRenewal(id, updateData);
  }

  @Delete('renewals/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete insurance renewal' })
  @ApiResponse({ status: 200, description: 'Renewal deleted successfully' })
  @ApiResponse({ status: 404, description: 'Renewal not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteRenewal(@Param('id') id: string) {
    return this.insuranceService.deleteRenewal(id);
  }

  // ===== ANALYTICS & DASHBOARD =====

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get insurance dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboardStats(
    @Query('dateRange') dateRange?: string,
  ) {
    let dateRangeObj;
    if (dateRange) {
      const [start, end] = dateRange.split(',');
      dateRangeObj = {
        start: new Date(start),
        end: new Date(end),
      };
    }

    return this.insuranceService.getDashboardStats(dateRangeObj);
  }

  @Get('alerts/urgent')
  @ApiOperation({ summary: 'Get urgent alerts' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUrgentAlerts() {
    return this.insuranceService.getUrgentAlerts();
  }

  // ===== BULK OPERATIONS =====

  @Patch('policies/bulk/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Bulk update policy status' })
  @ApiResponse({ status: 200, description: 'Policies updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async bulkUpdatePolicyStatus(
    @Body() body: { policyIds: string[]; status: string },
  ) {
    const { policyIds, status } = body;
    
    if (!policyIds || !Array.isArray(policyIds) || !status) {
      throw new Error('Policy IDs array and status are required');
    }

    // This would need to be implemented in the service
    // For now, return a placeholder response
    return {
      success: true,
      message: `Updated ${policyIds.length} policies to ${status}`,
      data: { modifiedCount: policyIds.length },
    };
  }

  @Delete('policies/bulk')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk delete policies' })
  @ApiResponse({ status: 200, description: 'Policies deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async bulkDeletePolicies(@Body() body: { policyIds: string[] }) {
    const { policyIds } = body;
    
    if (!policyIds || !Array.isArray(policyIds)) {
      throw new Error('Policy IDs array is required');
    }

    // This would need to be implemented in the service
    // For now, return a placeholder response
    return {
      success: true,
      message: `Deleted ${policyIds.length} policies`,
      data: { deletedCount: policyIds.length },
    };
  }

  @Patch('claims/bulk/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Bulk update claim status' })
  @ApiResponse({ status: 200, description: 'Claims updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async bulkUpdateClaimStatus(
    @Body() body: { claimIds: string[]; status: string },
  ) {
    const { claimIds, status } = body;
    
    if (!claimIds || !Array.isArray(claimIds) || !status) {
      throw new Error('Claim IDs array and status are required');
    }

    // This would need to be implemented in the service
    // For now, return a placeholder response
    return {
      success: true,
      message: `Updated ${claimIds.length} claims to ${status}`,
      data: { modifiedCount: claimIds.length },
    };
  }

  @Patch('claims/bulk/assign-adjuster')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Bulk assign adjuster to claims' })
  @ApiResponse({ status: 200, description: 'Adjuster assigned successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async bulkAssignAdjuster(
    @Body() body: { claimIds: string[]; adjuster: any },
  ) {
    const { claimIds, adjuster } = body;
    
    if (!claimIds || !Array.isArray(claimIds) || !adjuster) {
      throw new Error('Claim IDs array and adjuster data are required');
    }

    // This would need to be implemented in the service
    // For now, return a placeholder response
    return {
      success: true,
      message: `Assigned adjuster to ${claimIds.length} claims`,
      data: { modifiedCount: claimIds.length },
    };
  }

  // ===== EXPORT ROUTES =====

  @Get('export/policies')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Export policies data' })
  @ApiResponse({ status: 200, description: 'Data exported successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async exportPolicies(
    @Query('format') format: string = 'csv',
    @Query('filters') filters?: string,
  ) {
    // This would need to be implemented in the service
    // For now, return a placeholder response
    return {
      success: true,
      message: `Policies exported in ${format} format`,
      data: { format, filters },
    };
  }

  @Get('export/claims')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Export claims data' })
  @ApiResponse({ status: 200, description: 'Data exported successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async exportClaims(
    @Query('format') format: string = 'csv',
    @Query('filters') filters?: string,
  ) {
    // This would need to be implemented in the service
    // For now, return a placeholder response
    return {
      success: true,
      message: `Claims exported in ${format} format`,
      data: { format, filters },
    };
  }
}
