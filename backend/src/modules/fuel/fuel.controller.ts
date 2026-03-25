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
    constructor(private readonly fuelService: FuelService) { }

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
        const logs = await this.fuelService.getFuelLogs(queryDto, tenantId);

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
        const stats = await this.fuelService.getFuelStatistics(tenantId);

        return {
            success: true,
            data: stats,
        };
    }
}
