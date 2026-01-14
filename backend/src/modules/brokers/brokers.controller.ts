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
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { BrokersService } from './brokers.service';
import { CreateBrokerDto } from './dto/create-broker.dto';
import { UpdateBrokerDto } from './dto/update-broker.dto';
import { AssignBrokerToLoadDto } from './dto/assign-broker-to-load.dto';
import { UpdateCommissionStatusDto } from './dto/update-commission-status.dto';
import { CommissionQueryDto } from './dto/commission-query.dto';
import { CreatePayoutRequestDto, UpdatePayoutRequestDto } from './dto/commission-payout.dto';

@Controller('brokers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  /**
   * Create a new broker (Tenant Admin only)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createBroker(@Request() req: any, @Body() createBrokerDto: CreateBrokerDto) {
    const tenantAdminId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.brokersService.createBroker(tenantAdminId, createBrokerDto);
  }

  /**
   * Get all brokers for the tenant
   */
  @Get()
  @Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BROKER, UserRole.CARGO_OWNER)
  async getBrokers(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.brokersService.getBrokersByTenant(tenantId);
  }

  /**
   * Get a single broker by ID
   */
  @Get(':brokerId')
  @Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BROKER)
  async getBroker(@Request() req: any, @Param('brokerId') brokerId: string) {
    const tenantId = req.user.tenantId;
    // If broker is viewing their own profile, allow it
    if (req.user.role === UserRole.BROKER && req.user.userId !== brokerId) {
      // Brokers can only view their own profile
      return this.brokersService.getBrokerById(req.user.userId, tenantId);
    }
    return this.brokersService.getBrokerById(brokerId, tenantId);
  }

  /**
   * Update broker information
   */
  @Put(':brokerId')
  @Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BROKER)
  async updateBroker(
    @Request() req: any,
    @Param('brokerId') brokerId: string,
    @Body() updateData: UpdateBrokerDto,
  ) {
    const tenantId = req.user.tenantId;
    // If broker is updating their own profile, allow it
    if (req.user.role === UserRole.BROKER && req.user.userId !== brokerId) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.brokersService.updateBroker(brokerId, tenantId, updateData);
  }

  /**
   * Delete a broker
   */
  @Delete(':brokerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteBroker(@Request() req: any, @Param('brokerId') brokerId: string) {
    const tenantId = req.user.tenantId;
    await this.brokersService.deleteBroker(brokerId, tenantId);
  }

  /**
   * Get all loads assigned to a broker
   */
  @Get(':brokerId/loads')
  @Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BROKER)
  async getBrokerLoads(@Request() req: any, @Param('brokerId') brokerId: string) {
    const tenantId = req.user.tenantId;
    // If broker is viewing their own loads, allow it
    if (req.user.role === UserRole.BROKER && req.user.userId !== brokerId) {
      return this.brokersService.getLoadsByBroker(req.user.userId, tenantId);
    }
    return this.brokersService.getLoadsByBroker(brokerId, tenantId);
  }

  /**
   * Get broker commissions
   */
  @Get(':brokerId/commissions')
  @Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BROKER)
  async getBrokerCommissions(
    @Request() req: any,
    @Param('brokerId') brokerId: string,
    @Query() query: CommissionQueryDto,
  ) {
    const tenantId = req.user.tenantId;
    // If broker is viewing their own commissions, allow it
    if (req.user.role === UserRole.BROKER && req.user.userId !== brokerId) {
      return this.brokersService.getBrokerCommissions(req.user.userId, tenantId, query);
    }
    return this.brokersService.getBrokerCommissions(brokerId, tenantId, query);
  }

  /**
   * Get broker statistics
   */
  @Get(':brokerId/statistics')
  @Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BROKER)
  async getBrokerStatistics(@Request() req: any, @Param('brokerId') brokerId: string) {
    const tenantId = req.user.tenantId;
    // If broker is viewing their own statistics, allow it
    if (req.user.role === UserRole.BROKER && req.user.userId !== brokerId) {
      return this.brokersService.getBrokerStatistics(req.user.userId, tenantId);
    }
    return this.brokersService.getBrokerStatistics(brokerId, tenantId);
  }

  /**
   * Assign broker to a load
   */
  @Post('loads/:loadId/assign')
  @Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CARGO_OWNER)
  async assignBrokerToLoad(
    @Request() req: any,
    @Param('loadId') loadId: string,
    @Body() assignDto: AssignBrokerToLoadDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.brokersService.assignBrokerToLoad(loadId, tenantId, assignDto);
  }

  /**
   * Unassign broker from load
   */
  @Delete('loads/:loadId/assign')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CARGO_OWNER)
  async unassignBrokerFromLoad(@Request() req: any, @Param('loadId') loadId: string) {
    const tenantId = req.user.tenantId;
    await this.brokersService.unassignBrokerFromLoad(loadId, tenantId);
  }

  /**
   * Update commission status
   */
  @Put('commissions/:commissionId/status')
  @Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateCommissionStatus(
    @Request() req: any,
    @Param('commissionId') commissionId: string,
    @Body() updateDto: UpdateCommissionStatusDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.brokersService.updateCommissionStatus(commissionId, tenantId, updateDto);
  }

  /**
   * Request commission payout
   */
  @Post('commissions/:commissionId/payout')
  @Roles(UserRole.BROKER, UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async requestPayout(
    @Request() req: any,
    @Param('commissionId') commissionId: string,
    @Body() payoutDto: CreatePayoutRequestDto,
  ) {
    const tenantId = req.user.tenantId;
    const brokerId = req.user.role === UserRole.BROKER ? req.user.userId : payoutDto.commissionId;
    return this.brokersService.requestPayout(commissionId, tenantId, brokerId, payoutDto);
  }

  /**
   * Get payout requests for a broker
   */
  @Get(':brokerId/payouts')
  @Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BROKER)
  async getPayoutRequests(
    @Request() req: any,
    @Param('brokerId') brokerId: string,
    @Query() query: any,
  ) {
    const tenantId = req.user.tenantId;
    if (req.user.role === UserRole.BROKER && req.user.userId !== brokerId) {
      return this.brokersService.getPayoutRequests(req.user.userId, tenantId, query);
    }
    return this.brokersService.getPayoutRequests(brokerId, tenantId, query);
  }

  /**
   * Get broker contracts
   */
  @Get('contracts')
  @Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BROKER)
  async getBrokerContracts(@Request() req: any) {
    const tenantId = req.user.tenantId;
    const brokerId = req.user.role === UserRole.BROKER ? req.user.userId : null;
    return this.brokersService.getBrokerContracts(tenantId, brokerId);
  }
}

