import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FuelLog, FuelLogStatus } from '../../entities/fuel-log.entity';
import { CreateFuelLogDto, UpdateFuelLogDto, GetFuelLogsDto } from './dto/fuel-log.dto';

@Injectable()
export class FuelService {
    constructor(
        @InjectRepository(FuelLog)
        private readonly fuelLogRepository: Repository<FuelLog>,
    ) { }

    async createFuelLog(
        createDto: CreateFuelLogDto,
        tenantId: string,
        userId: string,
    ): Promise<FuelLog> {
        // Calculate total cost
        const totalCost = createDto.gallons * createDto.pricePerGallon;

        const fuelLog = this.fuelLogRepository.create({
            ...createDto,
            fuelAmount: createDto.gallons, // fuel_amount is same as gallons
            totalCost,
            tenantId,
            userId,
            createdBy: userId,
            status: FuelLogStatus.PENDING,
        });

        return await this.fuelLogRepository.save(fuelLog);
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
        try {
            const logs = await this.fuelLogRepository.find({
                where: { tenantId },
                relations: ['truck'],
            });

            const totalSpend = logs.reduce((sum, log) => sum + Number(log.totalCost || 0), 0);
            const totalVolume = logs.reduce((sum, log) => sum + Number(log.gallons || 0), 0);
            const avgPricePerGallon = totalVolume > 0 ? totalSpend / totalVolume : 0;

            // Calculate fleet efficiency (MPG)
            const logsWithOdometer = logs.filter(log => log.odometer && Number(log.odometer) > 0);
            let fleetEfficiency = 0;
            if (logsWithOdometer.length >= 2) {
                // Sort by odometer
                const sorted = [...logsWithOdometer].sort((a, b) => Number(a.odometer) - Number(b.odometer));
                const totalMiles = Number(sorted[sorted.length - 1].odometer) -
                    Number(sorted[0].odometer);
                const totalGallonsForEfficiency = sorted.slice(1).reduce((sum, log) => sum + Number(log.gallons || 0), 0);
                fleetEfficiency = totalGallonsForEfficiency > 0 ? totalMiles / totalGallonsForEfficiency : 0;
            }

            const fraudAlerts = logs.filter(log => log.isFlagged).length;

            return {
                totalSpend,
                totalVolume,
                avgPricePerGallon,
                fleetEfficiency: Number.isFinite(fleetEfficiency) ? fleetEfficiency : 0,
                fraudAlerts,
                totalLogs: logs.length,
            };
        } catch (error) {
            console.error('❌ Error in getFuelStatistics:', error);
            return {
                totalSpend: 0,
                totalVolume: 0,
                avgPricePerGallon: 0,
                fleetEfficiency: 0,
                fraudAlerts: 0,
                totalLogs: 0,
                isPartial: true
            };
        }
    }

    async getDriverFuelStatistics(driverId: string, tenantId: string): Promise<any> {
        try {
            const logs = await this.fuelLogRepository.find({
                where: { driverId, tenantId },
                relations: ['truck'],
                order: { fuelDate: 'DESC' }
            });

            if (logs.length === 0) {
                return {
                    totalSpend: 0,
                    totalVolume: 0,
                    avgPricePerGallon: 0,
                    efficiencyMpg: 0,
                    totalLogs: 0,
                    ecoScore: 0,
                    co2Saved: 0
                };
            }

            const totalSpend = logs.reduce((sum, log) => sum + Number(log.totalCost || 0), 0);
            const totalVolume = logs.reduce((sum, log) => sum + Number(log.gallons || 0), 0);
            const avgPricePerGallon = totalVolume > 0 ? totalSpend / totalVolume : 0;

            // Calculate efficiency (MPG)
            const logsWithOdometer = logs.filter(log => log.odometer && Number(log.odometer) > 0);
            let efficiencyMpg = 0;
            if (logsWithOdometer.length >= 2) {
                // Sort by odometer (descending because we ordered by fuelDate DESC)
                const sorted = [...logsWithOdometer].sort((a, b) => Number(b.odometer) - Number(a.odometer));
                const totalMiles = Number(sorted[0].odometer) - Number(sorted[sorted.length - 1].odometer);
                const gallonsUsedBetweenFirstAndLast = sorted.slice(0, -1).reduce((sum, log) => sum + Number(log.gallons || 0), 0);
                efficiencyMpg = gallonsUsedBetweenFirstAndLast > 0 ? totalMiles / gallonsUsedBetweenFirstAndLast : 0;
            }

            // Mock eco-driving metrics for now based on efficiency
            const ecoScore = Math.min(100, Math.round((efficiencyMpg / 7) * 100)); // 7 MPG is standard goal
            const co2Saved = totalVolume * 0.5; // Roughly 0.5kg saved per gallon efficiency gain (mock)

            return {
                totalSpend,
                totalVolume,
                avgPricePerGallon,
                efficiencyMpg: Number.isFinite(efficiencyMpg) ? efficiencyMpg : 0,
                ecoScore,
                co2Saved,
                totalLogs: logs.length,
            };
        } catch (error) {
            console.error('❌ Error in getDriverFuelStatistics:', error);
            return {
                totalSpend: 0,
                totalVolume: 0,
                avgPricePerGallon: 0,
                efficiencyMpg: 0,
                totalLogs: 0,
                ecoScore: 0,
                co2Saved: 0,
                isPartial: true
            };
        }
    }
}
