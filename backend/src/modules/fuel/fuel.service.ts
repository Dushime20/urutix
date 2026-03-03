import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FuelLog, FuelLogStatus } from '../../entities/fuel-log.entity';
import { CreateFuelLogDto, UpdateFuelLogDto, GetFuelLogsDto } from './dto/fuel-log.dto';
import { FuelWalletService } from './fuel-wallet.service';
import { FuelBudgetService } from './fuel-budget.service';

@Injectable()
export class FuelService {
    constructor(
        @InjectRepository(FuelLog)
        private readonly fuelLogRepository: Repository<FuelLog>,
        private readonly walletService: FuelWalletService,
        private readonly budgetService: FuelBudgetService,
    ) { }

    async createFuelLog(
        createDto: CreateFuelLogDto,
        tenantId: string,
        userId: string,
    ): Promise<FuelLog> {
        // Calculate total cost
        const totalCost = createDto.gallons * createDto.pricePerGallon;

        // 1. If driverId is provided, try to debit from their wallet
        if (createDto.driverId) {
            try {
                const wallet = await this.walletService.getOrCreateWallet(tenantId, createDto.driverId);
                // Only debit if they have enough balance, otherwise just record log
                if (wallet.balance >= totalCost) {
                    await this.walletService.debitForFuel(wallet.id, totalCost, 'PENDING_LOG', tenantId);
                }
            } catch (error) {
                console.warn('Driver wallet debit failed, proceeding with log only:', error.message);
            }
        }

        const fuelLog = this.fuelLogRepository.create({
            ...createDto,
            fuelAmount: createDto.gallons,
            totalCost,
            tenantId,
            userId,
            createdBy: userId,
            status: FuelLogStatus.VERIFIED,
        });

        const savedLog = await this.fuelLogRepository.save(fuelLog);

        // 2. Debit from truck owner's wallet
        try {
            const ownerWallet = await this.walletService.getOrCreateWalletForOwner(userId, tenantId);
            if (Number(ownerWallet.balance) >= totalCost) {
                await this.walletService.debitForFuel(ownerWallet.id, totalCost, savedLog.id, tenantId);
                console.log(`✅ Debited $${totalCost} from owner wallet ${ownerWallet.id}`);
            } else {
                console.warn(`⚠️ Insufficient owner wallet balance ($${ownerWallet.balance}) for fuel cost ($${totalCost})`);
            }
        } catch (error) {
            console.warn('Owner wallet debit failed:', error.message);
        }

        // 3. If tripId is provided, record as expense against budget
        if (createDto.tripId) {
            try {
                const budget = await this.budgetService.getBudgetByTrip(createDto.tripId, tenantId);
                if (budget) {
                    await this.budgetService.recordFuelExpense(budget.id, totalCost, tenantId);
                }
            } catch (error) {
                console.warn('Budget record failed:', error.message);
            }
        }

        return savedLog;
    }

    async getFuelLogs(
        queryDto: GetFuelLogsDto,
        tenantId: string,
    ): Promise<FuelLog[]> {
        const query = this.fuelLogRepository
            .createQueryBuilder('fuelLog')
            .leftJoinAndSelect('fuelLog.truck', 'truck')
            .leftJoinAndSelect('fuelLog.driver', 'driver')
            .where('fuelLog.tenantId = :tenantId', { tenantId });

        if (queryDto.truckId) {
            query.andWhere('fuelLog.truckId = :truckId', { truckId: queryDto.truckId });
        }

        if (queryDto.driverId) {
            query.andWhere('fuelLog.driverId = :driverId', { driverId: queryDto.driverId });
        }

        if (queryDto.status) {
            query.andWhere('fuelLog.status = :status', { status: queryDto.status });
        }

        if (queryDto.startDate && queryDto.endDate) {
            query.andWhere('fuelLog.fuelDate BETWEEN :startDate AND :endDate', {
                startDate: queryDto.startDate,
                endDate: queryDto.endDate,
            });
        }

        query.orderBy('fuelLog.fuelDate', 'DESC');

        return await query.getMany();
    }

    async getFuelLogById(id: string, tenantId: string): Promise<FuelLog> {
        const fuelLog = await this.fuelLogRepository.findOne({
            where: { id, tenantId },
            relations: ['truck', 'driver'],
        });

        if (!fuelLog) {
            throw new NotFoundException(`Fuel log with ID ${id} not found`);
        }

        return fuelLog;
    }

    async updateFuelLog(
        id: string,
        updateDto: UpdateFuelLogDto,
        tenantId: string,
    ): Promise<FuelLog> {
        const fuelLog = await this.getFuelLogById(id, tenantId);

        Object.assign(fuelLog, updateDto);

        if (updateDto.status === FuelLogStatus.FLAGGED && !updateDto.flagReason) {
            throw new BadRequestException('Flag reason is required when flagging a fuel log');
        }

        if (updateDto.status === FuelLogStatus.FLAGGED) {
            fuelLog.isFlagged = true;
        }

        return await this.fuelLogRepository.save(fuelLog);
    }

    async deleteFuelLog(id: string, tenantId: string): Promise<void> {
        const fuelLog = await this.getFuelLogById(id, tenantId);
        await this.fuelLogRepository.remove(fuelLog);
    }

    async getFuelStatistics(tenantId: string): Promise<any> {
        const logs = await this.fuelLogRepository.find({
            where: { tenantId },
            relations: ['truck'],
            order: { fuelDate: 'ASC' }
        });

        const totalSpend = logs.reduce((sum, log) => sum + Number(log.totalCost), 0);
        const totalVolume = logs.reduce((sum, log) => sum + Number(log.gallons), 0);
        const avgPricePerGallon = totalVolume > 0 ? totalSpend / totalVolume : 0;

        // Calculate fleet efficiency (MPG)
        const logsWithOdometer = logs.filter(log => log.odometer);
        let fleetEfficiency = 0;
        if (logsWithOdometer.length >= 2) {
            logsWithOdometer.sort((a, b) => Number(a.odometer) - Number(b.odometer));
            const totalMiles = Number(logsWithOdometer[logsWithOdometer.length - 1].odometer) -
                Number(logsWithOdometer[0].odometer);
            const totalGallons = logsWithOdometer.reduce((sum, log) => sum + Number(log.gallons), 0);
            fleetEfficiency = totalGallons > 0 ? totalMiles / totalGallons : 0;
        }

        // Daily Trend (Last 7 days)
        const dailyTrend = [];
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        for (const date of last7Days) {
            const dayLogs = logs.filter(l => l.fuelDate.toString().startsWith(date));
            dailyTrend.push({
                name: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
                cost: dayLogs.reduce((sum, l) => sum + Number(l.totalCost), 0),
                gallons: dayLogs.reduce((sum, l) => sum + Number(l.gallons), 0)
            });
        }

        // Truck Efficiency Breakdown
        const truckEfficiency = [];
        const uniqueTrucks = [...new Set(logs.map(l => l.truck?.id).filter(Boolean))];
        for (const truckId of uniqueTrucks) {
            const tLogs = logs.filter(l => l.truck?.id === truckId).sort((a, b) => Number(a.odometer) - Number(b.odometer));
            if (tLogs.length >= 2) {
                const miles = Number(tLogs[tLogs.length - 1].odometer) - Number(tLogs[0].odometer);
                const gallons = tLogs.reduce((sum, l) => sum + Number(l.gallons), 0);
                truckEfficiency.push({
                    plate: tLogs[0].truck.plateNumber,
                    mpg: gallons > 0 ? parseFloat((miles / gallons).toFixed(1)) : 0
                });
            }
        }

        const fraudAlerts = logs.filter(log => log.isFlagged).length;

        return {
            totalSpend,
            totalVolume,
            avgPricePerGallon,
            fleetEfficiency,
            fraudAlerts,
            totalLogs: logs.length,
            dailyTrend,
            truckEfficiency
        };
    }
}
