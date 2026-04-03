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
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';
import { GetTenant } from '../auth/decorators/tenant.decorator';
import { FuelService } from './fuel.service';
import { FuelWalletService } from './fuel-wallet.service';
import { CreateFuelLogDto, UpdateFuelLogDto, GetFuelLogsDto } from './dto/fuel-log.dto';

@ApiTags('Fuel Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TENANT_ADMIN,
  UserRole.TRUCK_OWNER,
  UserRole.FLEET_MANAGER,
  UserRole.FLEET_ACCOUNTANT,
  UserRole.FLEET_DISPATCHER,
  UserRole.DRIVER,
)
@Controller('fuel')
export class FuelController {
    constructor(
        private readonly fuelService: FuelService,
        private readonly fuelWalletService: FuelWalletService,
    ) { }

    // ── WALLET ENDPOINTS ────────────────────────────────────────────────────

    @Get('wallets/my-wallet')
    @ApiOperation({ summary: 'Get or create wallet for current user' })
    async getMyWallet(@GetTenant() tenantId: string, @Request() req) {
        const wallet = await this.fuelWalletService.getOrCreateWalletForOwner(req.user.userId, tenantId);
        return { success: true, data: wallet };
    }

    @Get('wallets/stats/overview')
    @ApiOperation({ summary: 'Get wallet stats overview' })
    async getWalletStats(@GetTenant() tenantId: string, @Request() req) {
        const stats = await this.fuelWalletService.getWalletStats(tenantId, req.user.userId);
        return { success: true, data: stats };
    }

    @Get('wallets/driver/:driverId')
    @ApiOperation({ summary: 'Get wallet by driver ID' })
    async getDriverWallet(@Param('driverId') driverId: string, @GetTenant() tenantId: string) {
        const wallet = await this.fuelWalletService.getWalletByDriver(driverId, tenantId);
        return { success: true, data: wallet };
    }

    @Get('wallets/:id')
    @ApiOperation({ summary: 'Get wallet by ID' })
    async getWallet(@Param('id') id: string, @GetTenant() tenantId: string) {
        const wallet = await this.fuelWalletService.getWallet(id, tenantId);
        return { success: true, data: wallet };
    }

    @Post('wallets/:id/credit')
    @ApiOperation({ summary: 'Add credit to wallet' })
    async addWalletCredit(
        @Param('id') id: string,
        @Body() body: { amount: number; description: string; metadata?: any },
        @GetTenant() tenantId: string,
        @Request() req,
    ) {
        const wallet = await this.fuelWalletService.addCredit(
            id, body.amount, body.description, tenantId, req.user.userId, body.metadata,
        );
        return { success: true, data: wallet };
    }

    @Get('wallets/:id/transactions')
    @ApiOperation({ summary: 'Get wallet transactions' })
    async getWalletTransactions(
        @Param('id') id: string,
        @GetTenant() tenantId: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        const result = await this.fuelWalletService.getTransactionHistory(id, tenantId, limit || 50, offset || 0);
        return { success: true, data: result.transactions, total: result.total };
    }

    @Post('logs')
    @ApiOperation({
        summary: 'Create a new fuel log',
        description: 'Log a fuel transaction for a truck',
    })
    @ApiResponse({
        status: 201,
        description: 'Fuel log created successfully',
        schema: {
            example: {
                success: true,
                data: {
                    id: 'fuel-log-uuid',
                    truckId: 'truck-uuid',
                    driverId: 'driver-uuid',
                    fuelDate: '2026-01-20T14:30:00Z',
                    gallons: 50.5,
                    pricePerGallon: 4.20,
                    totalCost: 212.10,
                    location: 'Shell #402, TX',
                    status: 'PENDING',
                },
            },
        },
    })
    async createFuelLog(
        @Body() createDto: CreateFuelLogDto,
        @GetTenant() tenantId: string,
        @Request() req,
    ) {
        const userId = req.user.id || req.user.sub;
        const fuelLog = await this.fuelService.createFuelLog(createDto, tenantId, userId);

        return {
            success: true,
            data: fuelLog,
            message: 'Fuel log created successfully',
        };
    }

    @Get('logs')
    @ApiOperation({
        summary: 'Get fuel logs',
        description: 'Retrieve fuel logs with optional filters',
    })
    @ApiQuery({ name: 'truckId', required: false })
    @ApiQuery({ name: 'driverId', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiResponse({
        status: 200,
        description: 'Fuel logs retrieved successfully',
    })
    async getFuelLogs(
        @Query() queryDto: GetFuelLogsDto,
        @GetTenant() tenantId: string,
    ) {
        console.log('📡 FuelController: getFuelLogs hit', { tenantId, queryDto });
        const logs = await this.fuelService.getFuelLogs(queryDto, tenantId);
        console.log(`✅ FuelController: returning ${logs.length} logs`);

        return {
            success: true,
            data: logs,
            message: `Found ${logs.length} fuel log${logs.length !== 1 ? 's' : ''}`,
        };
    }

    @Get('logs/:id')
    @ApiOperation({
        summary: 'Get fuel log by ID',
        description: 'Retrieve a specific fuel log',
    })
    @ApiResponse({
        status: 200,
        description: 'Fuel log retrieved successfully',
    })
    async getFuelLogById(
        @Param('id') id: string,
        @GetTenant() tenantId: string,
    ) {
        const log = await this.fuelService.getFuelLogById(id, tenantId);

        return {
            success: true,
            data: log,
        };
    }

    @Put('logs/:id')
    @ApiOperation({
        summary: 'Update fuel log',
        description: 'Update a fuel log (e.g., verify, flag, or reject)',
    })
    @ApiResponse({
        status: 200,
        description: 'Fuel log updated successfully',
    })
    async updateFuelLog(
        @Param('id') id: string,
        @Body() updateDto: UpdateFuelLogDto,
        @GetTenant() tenantId: string,
    ) {
        const log = await this.fuelService.updateFuelLog(id, updateDto, tenantId);

        return {
            success: true,
            data: log,
            message: 'Fuel log updated successfully',
        };
    }

    @Delete('logs/:id')
    @ApiOperation({
        summary: 'Delete fuel log',
        description: 'Delete a fuel log',
    })
    @ApiResponse({
        status: 200,
        description: 'Fuel log deleted successfully',
    })
    async deleteFuelLog(
        @Param('id') id: string,
        @GetTenant() tenantId: string,
    ) {
        await this.fuelService.deleteFuelLog(id, tenantId);

        return {
            success: true,
            message: 'Fuel log deleted successfully',
        };
    }

    @Get('statistics/:driverId')
    @ApiOperation({
        summary: 'Get fuel statistics for a specific driver',
        description: 'Get aggregated fuel consumption statistics for a specific driver',
    })
    @ApiResponse({
        status: 200,
        description: 'Driver statistics retrieved successfully',
    })
    async getDriverStatistics(
        @Param('driverId') driverId: string,
        @GetTenant() tenantId: string
    ) {
        const stats = await this.fuelService.getDriverFuelStatistics(driverId, tenantId);

        return {
            success: true,
            data: stats,
        };
    }

    @Get('statistics')
    @ApiOperation({
        summary: 'Get fuel statistics',
        description: 'Get aggregated fuel consumption statistics',
    })
    @ApiResponse({
        status: 200,
        description: 'Statistics retrieved successfully',
        schema: {
            example: {
                success: true,
                data: {
                    totalSpend: 12450,
                    totalVolume: 2980,
                    avgPricePerGallon: 4.18,
                    fleetEfficiency: 6.2,
                    fraudAlerts: 2,
                    totalLogs: 150,
                },
            },
        },
    })
    async getFuelStatistics(@GetTenant() tenantId: string) {
        console.log('📊 FuelController: getFuelStatistics hit', { tenantId });
        const stats = await this.fuelService.getFuelStatistics(tenantId);

        return {
            success: true,
            data: stats,
        };
    }
}
