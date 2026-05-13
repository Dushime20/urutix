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
    InternalServerErrorException,
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole, User } from '../../entities/user.entity';
import { Driver } from '../../entities/driver.entity';
import { Trip } from '../../entities/trip.entity';
import { FuelLog } from '../../entities/fuel-log.entity';
import { GetTenant } from '../auth/decorators/tenant.decorator';
import { FuelService } from './fuel.service';
import { FuelWalletService } from './fuel-wallet.service';
import { DriverFuelAdvanceService } from './driver-fuel-advance.service';
import { CreateFuelLogDto, UpdateFuelLogDto, GetFuelLogsDto } from './dto/fuel-log.dto';
import { NotificationService } from '../notifications/services/notification.service';
import { NotificationType, NotificationCategory, NotificationChannel, NotificationPriority, EntityType } from '../../entities/notification.entity';

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
        private readonly advanceService: DriverFuelAdvanceService,
        private readonly notificationService: NotificationService,
        @InjectRepository(Driver)
        private readonly driverRepository: Repository<Driver>,
        @InjectRepository(Trip)
        private readonly tripRepository: Repository<Trip>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(FuelLog)
        private readonly fuelLogRepository: Repository<FuelLog>,
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
        description: 'Log a fuel transaction for a truck. Accepts multipart/form-data for file uploads.',
    })
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'receiptFile', maxCount: 1 },
                { name: 'odometerVerificationFile', maxCount: 1 },
            ],
            {
                storage: diskStorage({
                    destination: (_req, _file, cb) => {
                        const uploadPath = join(process.cwd(), 'uploads', 'fuel-logs');
                        if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
                        cb(null, uploadPath);
                    },
                    filename: (_req, file, cb) => {
                        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
                        cb(null, `${unique}${extname(file.originalname)}`);
                    },
                }),
                limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
            },
        ),
    )
    async createFuelLog(
        @Body() body: Record<string, any>,
        @UploadedFiles() files: { receiptFile?: Express.Multer.File[]; odometerVerificationFile?: Express.Multer.File[] },
        @GetTenant() tenantId: string,
        @Request() req,
    ) {
        const userId = req.user.userId || req.user.id || req.user.sub;

        // Multipart form fields arrive as strings — coerce numeric fields
        const createDto: CreateFuelLogDto = {
            truckId: body.truckId,
            driverId: body.driverId || undefined,
            fuelDate: body.fuelDate,
            gallons: parseFloat(body.gallons),
            pricePerGallon: parseFloat(body.pricePerGallon),
            location: body.location,
            odometer: body.odometer ? parseFloat(body.odometer) : undefined,
            receiptNumber: body.receiptNumber || undefined,
            paymentMethod: body.paymentMethod || undefined,
            notes: body.notes || undefined,
        };

        const fuelLog = await this.fuelService.createFuelLog(createDto, tenantId, userId);

        // Persist uploaded file paths in metadata
        const receiptPath = files?.receiptFile?.[0]?.filename
            ? `/uploads/fuel-logs/${files.receiptFile[0].filename}`
            : null;
        const odometerPath = files?.odometerVerificationFile?.[0]?.filename
            ? `/uploads/fuel-logs/${files.odometerVerificationFile[0].filename}`
            : null;

        if (receiptPath || odometerPath) {
            fuelLog.metadata = {
                ...(fuelLog.metadata || {}),
                receiptFileUrl: receiptPath,
                odometerVerificationFileUrl: odometerPath,
            };
            await this.fuelLogRepository.update(
                { id: fuelLog.id, tenantId },
                { metadata: fuelLog.metadata },
            );
        }

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

    // ── ADVANCE ENDPOINTS ────────────────────────────────────────────────────

    @Post('advances/request')
    @ApiOperation({ summary: 'Request a fuel advance' })
    async requestAdvance(
        @Body() body: { tripId?: string; advanceAmount: number; notes?: string },
        @GetTenant() tenantId: string,
        @Request() req,
    ) {
        const driver = await this.driverRepository.findOne({ where: { userId: req.user.userId, tenantId } });
        if (!driver) throw new InternalServerErrorException('Driver profile not found for this user');

        // Resolve trip number → UUID if needed
        let resolvedTripId: string | undefined = body.tripId;
        if (resolvedTripId) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(resolvedTripId)) {
                const trip = await this.tripRepository.findOne({
                    where: { tripNumber: resolvedTripId, tenantId },
                });
                if (!trip) throw new InternalServerErrorException(`Trip "${resolvedTripId}" not found`);
                resolvedTripId = trip.id;
            }
        }

        const advance = await this.advanceService.requestAdvance(
            driver.id,
            body.advanceAmount,
            tenantId,
            resolvedTripId,
            body.notes,
        );

        // Notify truck owner (employer) — in-app + email
        try {
            if (driver.employerId) {
                const employer = await this.userRepository.findOne({
                    where: { id: driver.employerId, tenantId },
                    relations: ['profile'],
                });
                if (employer) {
                    const driverName = `${driver.firstName} ${driver.lastName}`.trim();
                    const amountFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(body.advanceAmount);
                    const tripRef = resolvedTripId ? ` for trip #${advance.trip?.tripNumber || resolvedTripId.slice(0, 8)}` : '';

                    // In-app notification
                    await this.notificationService.createNotification({
                        userId: employer.id,
                        tenantId,
                        type: NotificationType.PAYMENT_RECEIVED,
                        priority: NotificationPriority.HIGH,
                        category: NotificationCategory.DRIVER,
                        channel: NotificationChannel.IN_APP,
                        subject: `💰 Driver Advance Request — ${amountFmt}`,
                        content: `${driverName} has requested a cash advance of ${amountFmt}${tripRef}. Please review and approve or reject.`,
                        actionUrl: '/fleet/payments?tab=advances',
                        actionText: 'Review Request',
                        entityType: EntityType.DRIVER,
                        entityId: advance.id,
                        metadata: { advanceId: advance.id, driverId: driver.id, driverName, amount: body.advanceAmount },
                    });

                    // Email notification
                    if (employer.email) {
                        await this.notificationService.createNotification({
                            userId: employer.id,
                            tenantId,
                            type: NotificationType.PAYMENT_RECEIVED,
                            priority: NotificationPriority.HIGH,
                            category: NotificationCategory.DRIVER,
                            channel: NotificationChannel.EMAIL,
                            subject: `Driver Advance Request — ${amountFmt}`,
                            content: `Hi${employer.profile ? ` ${employer.profile.firstName}` : ''},\n\nYour driver ${driverName} has submitted a cash advance request of ${amountFmt}${tripRef}.\n\nReason: ${body.notes || 'No reason provided'}\n\nPlease log in to review and take action.`,
                            recipientEmail: employer.email,
                            actionUrl: '/fleet/payments?tab=advances',
                            actionText: 'Review Request',
                            entityType: EntityType.DRIVER,
                            entityId: advance.id,
                        });
                    }
                }
            }
        } catch (err) {
            console.error('[FuelController] Failed to notify truck owner of advance request:', err.message);
        }

        return { success: true, data: advance };
    }

    @Get('advances/pending/all')
    @ApiOperation({ summary: 'Get all pending advances (admin/fleet manager)' })
    async getPendingAdvances(@GetTenant() tenantId: string) {
        const advances = await this.advanceService.getPendingAdvances(tenantId);
        return { success: true, data: advances };
    }

    @Get('advances/pending/my-drivers')
    @ApiOperation({ summary: 'Get pending advances for drivers employed by the logged-in truck owner' })
    async getPendingAdvancesForMyDrivers(@GetTenant() tenantId: string, @Request() req) {
        const advances = await this.advanceService.getPendingAdvancesForEmployer(req.user.userId, tenantId);
        return { success: true, data: advances };
    }

    @Get('advances/my-drivers/all')
    @ApiOperation({ summary: 'Get all advances (all statuses) for drivers employed by the logged-in truck owner' })
    async getAllAdvancesForMyDrivers(@GetTenant() tenantId: string, @Request() req) {
        const advances = await this.advanceService.getAllAdvancesForEmployer(req.user.userId, tenantId);
        return { success: true, data: advances };
    }

    @Get('advances/stats/overview')
    @ApiOperation({ summary: 'Get advance stats overview' })
    async getAdvanceStats(@GetTenant() tenantId: string) {
        const stats = await this.advanceService.getAdvanceStats(tenantId);
        return { success: true, data: stats };
    }

    @Get('advances/driver/:driverId')
    @ApiOperation({ summary: 'Get advances for a driver' })
    async getDriverAdvances(
        @Param('driverId') driverId: string,
        @Query('status') status: string,
        @GetTenant() tenantId: string,
    ) {
        const advances = await this.advanceService.getDriverAdvances(driverId, tenantId, status as any);
        return { success: true, data: advances };
    }

    @Get('advances/driver/:driverId/balance')
    @ApiOperation({ summary: 'Get advance balance for a driver' })
    async getDriverAdvanceBalance(
        @Param('driverId') driverId: string,
        @GetTenant() tenantId: string,
    ) {
        const balance = await this.advanceService.getDriverAdvanceBalance(driverId, tenantId);
        return { success: true, data: { balance } };
    }

    @Get('advances/:id')
    @ApiOperation({ summary: 'Get advance by ID' })
    async getAdvance(@Param('id') id: string, @GetTenant() tenantId: string) {
        const advance = await this.advanceService.getAdvance(id, tenantId);
        return { success: true, data: advance };
    }

    @Put('advances/:id/approve')
    @ApiOperation({ summary: 'Approve an advance' })
    async approveAdvance(@Param('id') id: string, @GetTenant() tenantId: string, @Request() req) {
        const advance = await this.advanceService.approveAdvance(id, tenantId, req.user.userId);
        return { success: true, data: advance };
    }

    @Put('advances/:id/reject')
    @ApiOperation({ summary: 'Reject an advance' })
    async rejectAdvance(
        @Param('id') id: string,
        @Body() body: { rejectionReason: string },
        @GetTenant() tenantId: string,
    ) {
        const advance = await this.advanceService.rejectAdvance(id, tenantId, body.rejectionReason);
        return { success: true, data: advance };
    }

    @Put('advances/:id/reconcile')
    @ApiOperation({ summary: 'Reconcile an advance' })
    async reconcileAdvance(
        @Param('id') id: string,
        @Body() body: { reconciliationAmount: number; reconciliationNotes?: string },
        @GetTenant() tenantId: string,
    ) {
        const advance = await this.advanceService.reconcileAdvance(id, tenantId, body.reconciliationAmount, body.reconciliationNotes);
        return { success: true, data: advance };
    }
}
