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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetTenant } from '../auth/decorators/tenant.decorator';
import { FuelService } from './fuel.service';
import { FuelWalletService } from './fuel-wallet.service';
import { FuelBudgetService } from './fuel-budget.service';
import { DriverFuelAdvanceService } from './driver-fuel-advance.service';
import { CreateFuelLogDto, UpdateFuelLogDto, GetFuelLogsDto } from './dto/fuel-log.dto';
import { AddCreditDto, DebitForFuelDto, GetWalletTransactionsDto } from './dto/fuel-wallet.dto';
import { CreateFuelBudgetDto, RecordFuelExpenseDto, UpdateBudgetStatusDto } from './dto/fuel-budget.dto';
import { RequestFuelAdvanceDto, ApproveAdvanceDto, RejectAdvanceDto, ReconcileAdvanceDto } from './dto/driver-fuel-advance.dto';

@ApiTags('Fuel Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('fuel')
export class FuelController {
    constructor(
        private readonly fuelService: FuelService,
        private readonly walletService: FuelWalletService,
        private readonly budgetService: FuelBudgetService,
        private readonly advanceService: DriverFuelAdvanceService,
    ) { }

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
        try {
            const userId = req.user.id || req.user.sub;
            const fuelLog = await this.fuelService.createFuelLog(createDto, tenantId, userId);

            return {
                success: true,
                data: fuelLog,
            };
        } catch (error: any) {
            console.error('❌ createFuelLog error:', error?.message, error?.query);
            return {
                success: false,
                data: null,
                message: 'Failed to create fuel log: ' + (error?.message || 'Unknown error'),
                debug: {
                    errorMessage: error?.message,
                    query: error?.query,
                    detail: error?.detail,
                }
            };
        }
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

    // ===== FUEL WALLET ENDPOINTS =====
    // NOTE: Specific routes must come BEFORE generic parameterized routes to avoid route shadowing

    @Get('wallets/my-wallet')
    @ApiOperation({
        summary: 'Get current user wallet',
        description: 'Get the fuel wallet for the currently logged-in truck owner',
    })
    async getMyWallet(
        @GetTenant() tenantId: string,
        @Request() req,
    ) {
        try {
            const userId = req.user?.id || req.user?.sub;
            console.log('🔍 getMyWallet - userId:', userId, 'tenantId:', tenantId);

            if (!userId) {
                console.error('❌ getMyWallet - No user ID found in request');
                return { success: false, data: null, message: 'User not authenticated' };
            }

            // Get or create wallet for the current truck owner
            const wallet = await this.walletService.getOrCreateWalletForOwner(userId, tenantId);
            console.log('✅ getMyWallet - wallet:', wallet?.id);

            return {
                success: true,
                data: wallet,
            };
        } catch (error: any) {
            console.error('❌ getMyWallet error:', error?.message, error?.query);
            return {
                success: false,
                data: null,
                message: 'Failed to get wallet: ' + (error?.message || 'Unknown error'),
                debug: {
                    errorMessage: error?.message,
                    query: error?.query,
                    detail: error?.detail,
                }
            };
        }
    }

    @Get('wallets/stats/overview')
    @ApiOperation({
        summary: 'Get wallet statistics',
        description: 'Get aggregated wallet statistics for tenant or truck owner',
    })
    async getWalletStats(
        @GetTenant() tenantId: string,
        @Request() req,
    ) {
        const userId = req.user.id || req.user.sub;
        const userRole = req.user.role;

        // If user is a truck owner, filter by their trucks only
        // If user is admin/super admin, show all wallets for tenant
        const filterByUser = userRole === 'TRUCK_OWNER' ? userId : undefined;

        const stats = await this.walletService.getWalletStats(tenantId, filterByUser);

        return {
            success: true,
            data: stats,
        };
    }

    @Get('wallets/driver/:driverId')
    @ApiOperation({
        summary: 'Get driver fuel wallet',
        description: 'Get or create fuel wallet for a driver',
    })
    async getDriverWallet(
        @Param('driverId') driverId: string,
        @GetTenant() tenantId: string,
    ) {
        const wallet = await this.walletService.getWalletByDriver(driverId, tenantId);

        return {
            success: true,
            data: wallet,
        };
    }

    @Get('wallets/:id/transactions')
    @ApiOperation({
        summary: 'Get wallet transactions',
        description: 'Get transaction history for a wallet',
    })
    async getWalletTransactions(
        @Param('id') id: string,
        @Query() queryDto: GetWalletTransactionsDto,
        @GetTenant() tenantId: string,
    ) {
        const result = await this.walletService.getTransactionHistory(
            id,
            tenantId,
            queryDto.limit,
            queryDto.offset,
        );

        return {
            success: true,
            data: result.transactions,
            total: result.total,
        };
    }

    @Post('wallets/:id/credit')
    @ApiOperation({
        summary: 'Add credit to wallet',
        description: 'Add fuel credit to a wallet with petrol station details',
    })
    async addCredit(
        @Param('id') id: string,
        @Body() addCreditDto: AddCreditDto,
        @GetTenant() tenantId: string,
    ) {
        try {
            console.log('💳 addCredit - walletId:', id, 'amount:', addCreditDto.amount, 'tenantId:', tenantId);
            const wallet = await this.walletService.addCredit(
                id,
                addCreditDto.amount,
                addCreditDto.description,
                tenantId,
                addCreditDto.referenceId,
                addCreditDto.metadata,
            );

            return {
                success: true,
                data: wallet,
                message: 'Credit added successfully',
            };
        } catch (error: any) {
            console.error('❌ addCredit error:', error?.message, error?.query);
            return {
                success: false,
                data: null,
                message: 'Failed to add credit: ' + (error?.message || 'Unknown error'),
                debug: {
                    errorMessage: error?.message,
                    query: error?.query,
                    detail: error?.detail,
                }
            };
        }
    }

    @Get('wallets/:id')
    @ApiOperation({
        summary: 'Get fuel wallet',
        description: 'Retrieve a specific fuel wallet',
    })
    async getWallet(
        @Param('id') id: string,
        @GetTenant() tenantId: string,
    ) {
        const wallet = await this.walletService.getWallet(id, tenantId);

        return {
            success: true,
            data: wallet,
        };
    }

    // ===== FUEL BUDGET ENDPOINTS =====

    @Post('budgets')
    @ApiOperation({
        summary: 'Create fuel budget',
        description: 'Create a fuel budget for a trip',
    })
    async createBudget(
        @Body() createBudgetDto: CreateFuelBudgetDto,
        @GetTenant() tenantId: string,
    ) {
        const budget = await this.budgetService.createBudget(
            createBudgetDto.tripId,
            createBudgetDto.truckId,
            createBudgetDto.budgetedAmount,
            tenantId,
            createBudgetDto.alertThreshold,
        );

        return {
            success: true,
            data: budget,
            message: 'Fuel budget created successfully',
        };
    }

    @Get('budgets/:id')
    @ApiOperation({
        summary: 'Get fuel budget',
        description: 'Retrieve a specific fuel budget',
    })
    async getBudget(
        @Param('id') id: string,
        @GetTenant() tenantId: string,
    ) {
        const budget = await this.budgetService.getBudget(id, tenantId);

        return {
            success: true,
            data: budget,
        };
    }

    @Post('budgets/:id/record-expense')
    @ApiOperation({
        summary: 'Record fuel expense',
        description: 'Record a fuel expense against a budget',
    })
    async recordFuelExpense(
        @Param('id') id: string,
        @Body() recordExpenseDto: RecordFuelExpenseDto,
        @GetTenant() tenantId: string,
    ) {
        const budget = await this.budgetService.recordFuelExpense(
            id,
            recordExpenseDto.fuelCost,
            tenantId,
        );

        return {
            success: true,
            data: budget,
            message: 'Fuel expense recorded successfully',
        };
    }

    @Get('budgets/analysis/:tripId')
    @ApiOperation({
        summary: 'Get budget analysis',
        description: 'Get detailed analysis of a trip fuel budget',
    })
    async getBudgetAnalysis(
        @Param('tripId') tripId: string,
        @GetTenant() tenantId: string,
    ) {
        const analysis = await this.budgetService.getBudgetAnalysis(tripId, tenantId);

        return {
            success: true,
            data: analysis,
        };
    }

    @Get('budgets/status/over-budget')
    @ApiOperation({
        summary: 'Get over-budget trips',
        description: 'Get all trips that are over their fuel budget',
    })
    async getOverBudgetTrips(@GetTenant() tenantId: string) {
        const budgets = await this.budgetService.getOverBudgetTrips(tenantId);

        return {
            success: true,
            data: budgets,
            count: budgets.length,
        };
    }

    // ===== DRIVER FUEL ADVANCE ENDPOINTS =====

    @Post('advances/request')
    @ApiOperation({
        summary: 'Request fuel advance',
        description: 'Request a fuel advance as a driver',
    })
    async requestAdvance(
        @Body() requestAdvanceDto: RequestFuelAdvanceDto,
        @GetTenant() tenantId: string,
        @Request() req,
    ) {
        const driverId = req.user.driverId || req.user.id;

        const advance = await this.advanceService.requestAdvance(
            driverId,
            requestAdvanceDto.advanceAmount,
            tenantId,
            requestAdvanceDto.tripId,
            requestAdvanceDto.notes,
        );

        return {
            success: true,
            data: advance,
            message: 'Fuel advance requested successfully',
        };
    }

    @Get('advances/:id')
    @ApiOperation({
        summary: 'Get fuel advance',
        description: 'Retrieve a specific fuel advance',
    })
    async getAdvance(
        @Param('id') id: string,
        @GetTenant() tenantId: string,
    ) {
        const advance = await this.advanceService.getAdvance(id, tenantId);

        return {
            success: true,
            data: advance,
        };
    }

    @Get('advances/driver/:driverId')
    @ApiOperation({
        summary: 'Get driver advances',
        description: 'Get all fuel advances for a driver',
    })
    @ApiQuery({ name: 'status', required: false })
    async getDriverAdvances(
        @Param('driverId') driverId: string,
        @Query('status') status: string | undefined,
        @GetTenant() tenantId: string,
    ) {
        const advances = await this.advanceService.getDriverAdvances(
            driverId,
            tenantId,
            status as any,
        );

        return {
            success: true,
            data: advances,
            count: advances.length,
        };
    }

    @Put('advances/:id/approve')
    @ApiOperation({
        summary: 'Approve fuel advance',
        description: 'Approve a pending fuel advance',
    })
    async approveAdvance(
        @Param('id') id: string,
        @GetTenant() tenantId: string,
        @Request() req,
    ) {
        const advance = await this.advanceService.approveAdvance(
            id,
            tenantId,
            req.user.id,
        );

        return {
            success: true,
            data: advance,
            message: 'Fuel advance approved successfully',
        };
    }

    @Put('advances/:id/reject')
    @ApiOperation({
        summary: 'Reject fuel advance',
        description: 'Reject a pending fuel advance',
    })
    async rejectAdvance(
        @Param('id') id: string,
        @Body() rejectDto: RejectAdvanceDto,
        @GetTenant() tenantId: string,
    ) {
        const advance = await this.advanceService.rejectAdvance(
            id,
            tenantId,
            rejectDto.rejectionReason,
        );

        return {
            success: true,
            data: advance,
            message: 'Fuel advance rejected successfully',
        };
    }

    @Put('advances/:id/reconcile')
    @ApiOperation({
        summary: 'Reconcile fuel advance',
        description: 'Reconcile a fuel advance with actual fuel purchases',
    })
    async reconcileAdvance(
        @Param('id') id: string,
        @Body() reconcileDto: ReconcileAdvanceDto,
        @GetTenant() tenantId: string,
    ) {
        const advance = await this.advanceService.reconcileAdvance(
            id,
            tenantId,
            reconcileDto.reconciliationAmount,
            reconcileDto.reconciliationNotes,
        );

        return {
            success: true,
            data: advance,
            message: 'Fuel advance reconciled successfully',
        };
    }

    @Get('advances/pending/all')
    @ApiOperation({
        summary: 'Get pending advances',
        description: 'Get all pending fuel advances for approval',
    })
    async getPendingAdvances(@GetTenant() tenantId: string) {
        const advances = await this.advanceService.getPendingAdvances(tenantId);

        return {
            success: true,
            data: advances,
            count: advances.length,
        };
    }

    @Get('advances/stats/overview')
    @ApiOperation({
        summary: 'Get advance statistics',
        description: 'Get aggregated fuel advance statistics',
    })
    async getAdvanceStats(@GetTenant() tenantId: string) {
        const stats = await this.advanceService.getAdvanceStats(tenantId);

        return {
            success: true,
            data: stats,
        };
    }

    @Get('advances/driver/:driverId/balance')
    @ApiOperation({
        summary: 'Get driver advance balance',
        description: 'Get outstanding fuel advance balance for a driver',
    })
    async getDriverAdvanceBalance(
        @Param('driverId') driverId: string,
        @GetTenant() tenantId: string,
    ) {
        const balance = await this.advanceService.getDriverAdvanceBalance(
            driverId,
            tenantId,
        );

        return {
            success: true,
            data: { balance },
        };
    }
}
