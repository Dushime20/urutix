import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FuelBudget, FuelBudgetStatus } from '../../entities/fuel-budget.entity';
import { FuelLog } from '../../entities/fuel-log.entity';

@Injectable()
export class FuelBudgetService {
    constructor(
        @InjectRepository(FuelBudget)
        private readonly budgetRepository: Repository<FuelBudget>,
        @InjectRepository(FuelLog)
        private readonly fuelLogRepository: Repository<FuelLog>,
    ) { }

    async createBudget(
        tripId: string,
        truckId: string,
        budgetedAmount: number,
        tenantId: string,
        alertThreshold: number = 10,
    ): Promise<FuelBudget> {
        if (budgetedAmount <= 0) {
            throw new BadRequestException('Budgeted amount must be greater than 0');
        }

        const budget = this.budgetRepository.create({
            tenantId,
            tripId,
            truckId,
            budgetedAmount,
            alertThreshold,
            status: FuelBudgetStatus.PLANNED,
        });

        return await this.budgetRepository.save(budget);
    }

    async getBudget(id: string, tenantId: string): Promise<FuelBudget> {
        const budget = await this.budgetRepository.findOne({
            where: { id, tenantId },
            relations: ['trip', 'truck'],
        });

        if (!budget) {
            throw new NotFoundException(`Fuel budget with ID ${id} not found`);
        }

        return budget;
    }

    async getBudgetByTrip(tripId: string, tenantId: string): Promise<FuelBudget | null> {
        return await this.budgetRepository.findOne({
            where: { tripId, tenantId },
            relations: ['trip', 'truck'],
        });
    }

    async updateBudgetStatus(
        id: string,
        tenantId: string,
        status: FuelBudgetStatus,
    ): Promise<FuelBudget> {
        const budget = await this.getBudget(id, tenantId);
        budget.status = status;
        return await this.budgetRepository.save(budget);
    }

    async recordFuelExpense(
        budgetId: string,
        fuelCost: number,
        tenantId: string,
    ): Promise<FuelBudget> {
        const budget = await this.getBudget(budgetId, tenantId);

        budget.actualAmount += fuelCost;
        budget.variance = budget.budgetedAmount - budget.actualAmount;
        budget.variancePercentage = (budget.variance / budget.budgetedAmount) * 100;

        // Check if over budget
        if (budget.actualAmount > budget.budgetedAmount) {
            budget.status = FuelBudgetStatus.OVER_BUDGET;
            budget.alertTriggered = true;
        }

        // Check if approaching threshold
        if (
            !budget.alertTriggered &&
            budget.variancePercentage <= budget.alertThreshold &&
            budget.variancePercentage > 0
        ) {
            budget.alertTriggered = true;
        }

        return await this.budgetRepository.save(budget);
    }

    async getBudgetAnalysis(tripId: string, tenantId: string): Promise<any> {
        const budget = await this.getBudgetByTrip(tripId, tenantId);

        if (!budget) {
            return null;
        }

        const fuelLogs = await this.fuelLogRepository.find({
            where: { tenantId },
        });

        const tripFuelLogs = fuelLogs.filter(log => {
            // Match fuel logs to trip based on truck and date range
            return log.truckId === budget.truckId;
        });

        const totalFuelCost = tripFuelLogs.reduce((sum, log) => sum + Number(log.totalCost), 0);

        return {
            budgetId: budget.id,
            tripId: budget.tripId,
            budgetedAmount: budget.budgetedAmount,
            actualAmount: budget.actualAmount,
            variance: budget.variance,
            variancePercentage: budget.variancePercentage,
            status: budget.status,
            alertTriggered: budget.alertTriggered,
            fuelLogsCount: tripFuelLogs.length,
            isOverBudget: budget.actualAmount > budget.budgetedAmount,
            remainingBudget: Math.max(0, budget.budgetedAmount - budget.actualAmount),
        };
    }

    async getBudgetsByTenant(tenantId: string): Promise<FuelBudget[]> {
        return await this.budgetRepository.find({
            where: { tenantId },
            relations: ['trip', 'truck'],
            order: { createdAt: 'DESC' },
        });
    }

    async getBudgetsByStatus(
        tenantId: string,
        status: FuelBudgetStatus,
    ): Promise<FuelBudget[]> {
        return await this.budgetRepository.find({
            where: { tenantId, status },
            relations: ['trip', 'truck'],
            order: { createdAt: 'DESC' },
        });
    }

    async getOverBudgetTrips(tenantId: string): Promise<FuelBudget[]> {
        return await this.budgetRepository.find({
            where: { tenantId, status: FuelBudgetStatus.OVER_BUDGET },
            relations: ['trip', 'truck'],
            order: { createdAt: 'DESC' },
        });
    }

    async completeBudget(id: string, tenantId: string): Promise<FuelBudget> {
        const budget = await this.getBudget(id, tenantId);
        budget.status = FuelBudgetStatus.COMPLETED;
        return await this.budgetRepository.save(budget);
    }
}
