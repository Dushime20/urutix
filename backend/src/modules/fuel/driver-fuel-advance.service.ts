import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverFuelAdvance, DriverFuelAdvanceStatus } from '../../entities/driver-fuel-advance.entity';
import { FuelWalletService } from './fuel-wallet.service';

@Injectable()
export class DriverFuelAdvanceService {
    constructor(
        @InjectRepository(DriverFuelAdvance)
        private readonly advanceRepository: Repository<DriverFuelAdvance>,
        private readonly walletService: FuelWalletService,
    ) { }

    async requestAdvance(
        driverId: string,
        advanceAmount: number,
        tenantId: string,
        tripId?: string,
        notes?: string,
    ): Promise<DriverFuelAdvance> {
        if (advanceAmount <= 0) {
            throw new BadRequestException('Advance amount must be greater than 0');
        }

        const advance = this.advanceRepository.create({
            tenantId,
            driverId,
            tripId,
            advanceAmount,
            advanceDate: new Date(),
            status: DriverFuelAdvanceStatus.PENDING,
            notes,
        });

        return await this.advanceRepository.save(advance);
    }

    async getAdvance(id: string, tenantId: string): Promise<DriverFuelAdvance> {
        const advance = await this.advanceRepository.findOne({
            where: { id, tenantId },
            relations: ['driver', 'trip', 'approver'],
        });

        if (!advance) {
            throw new NotFoundException(`Fuel advance with ID ${id} not found`);
        }

        return advance;
    }

    async getDriverAdvances(
        driverId: string,
        tenantId: string,
        status?: DriverFuelAdvanceStatus,
    ): Promise<DriverFuelAdvance[]> {
        const query = this.advanceRepository
            .createQueryBuilder('advance')
            .where('advance.tenantId = :tenantId', { tenantId })
            .andWhere('advance.driverId = :driverId', { driverId })
            .leftJoinAndSelect('advance.driver', 'driver')
            .leftJoinAndSelect('advance.trip', 'trip')
            .leftJoinAndSelect('advance.approver', 'approver');

        if (status) {
            query.andWhere('advance.status = :status', { status });
        }

        query.orderBy('advance.advanceDate', 'DESC');

        return await query.getMany();
    }

    async approveAdvance(
        id: string,
        tenantId: string,
        approvedBy: string,
    ): Promise<DriverFuelAdvance> {
        const advance = await this.getAdvance(id, tenantId);

        if (advance.status !== DriverFuelAdvanceStatus.PENDING) {
            throw new BadRequestException(
                `Cannot approve advance with status ${advance.status}`,
            );
        }

        advance.status = DriverFuelAdvanceStatus.APPROVED;
        advance.approvedBy = approvedBy;
        advance.approvedAt = new Date();

        const savedAdvance = await this.advanceRepository.save(advance);

        // Integrate with Wallet: Credit the driver's wallet
        try {
            const wallet = await this.walletService.getOrCreateWallet(tenantId, advance.driverId);
            await this.walletService.addCredit(
                wallet.id,
                advance.advanceAmount,
                `Approved fuel advance: ${advance.id}`,
                tenantId,
                advance.id,
            );
        } catch (error) {
            console.error('Failed to credit wallet during advance approval:', error.message);
        }

        return savedAdvance;
    }

    async rejectAdvance(
        id: string,
        tenantId: string,
        rejectionReason: string,
    ): Promise<DriverFuelAdvance> {
        const advance = await this.getAdvance(id, tenantId);

        if (advance.status !== DriverFuelAdvanceStatus.PENDING) {
            throw new BadRequestException(
                `Cannot reject advance with status ${advance.status}`,
            );
        }

        advance.status = DriverFuelAdvanceStatus.REJECTED;
        advance.rejectionReason = rejectionReason;

        return await this.advanceRepository.save(advance);
    }

    async reconcileAdvance(
        id: string,
        tenantId: string,
        reconciliationAmount: number,
        reconciliationNotes?: string,
    ): Promise<DriverFuelAdvance> {
        const advance = await this.getAdvance(id, tenantId);

        if (advance.status !== DriverFuelAdvanceStatus.APPROVED) {
            throw new BadRequestException(
                `Cannot reconcile advance with status ${advance.status}`,
            );
        }

        advance.status = DriverFuelAdvanceStatus.RECONCILED;
        advance.reconciliationDate = new Date();
        advance.reconciliationAmount = reconciliationAmount;
        advance.reconciliationNotes = reconciliationNotes;

        return await this.advanceRepository.save(advance);
    }

    async getPendingAdvances(tenantId: string): Promise<DriverFuelAdvance[]> {
        return await this.advanceRepository.find({
            where: { tenantId, status: DriverFuelAdvanceStatus.PENDING },
            relations: ['driver', 'trip'],
            order: { advanceDate: 'ASC' },
        });
    }

    async getAdvanceStats(tenantId: string): Promise<any> {
        const advances = await this.advanceRepository.find({
            where: { tenantId },
        });

        const pending = advances.filter(a => a.status === DriverFuelAdvanceStatus.PENDING);
        const approved = advances.filter(a => a.status === DriverFuelAdvanceStatus.APPROVED);
        const reconciled = advances.filter(a => a.status === DriverFuelAdvanceStatus.RECONCILED);
        const rejected = advances.filter(a => a.status === DriverFuelAdvanceStatus.REJECTED);

        const totalAdvanced = advances.reduce((sum, a) => sum + Number(a.advanceAmount), 0);
        const totalReconciled = reconciled.reduce(
            (sum, a) => sum + Number(a.reconciliationAmount || 0),
            0,
        );

        return {
            totalAdvances: advances.length,
            pendingCount: pending.length,
            approvedCount: approved.length,
            reconciledCount: reconciled.length,
            rejectedCount: rejected.length,
            totalAdvanced,
            totalReconciled,
            pendingAmount: pending.reduce((sum, a) => sum + Number(a.advanceAmount), 0),
            approvedAmount: approved.reduce((sum, a) => sum + Number(a.advanceAmount), 0),
        };
    }

    async getDriverAdvanceBalance(driverId: string, tenantId: string): Promise<number> {
        const advances = await this.getDriverAdvances(driverId, tenantId);

        const totalAdvanced = advances.reduce((sum, a) => sum + Number(a.advanceAmount), 0);
        const totalReconciled = advances
            .filter(a => a.status === DriverFuelAdvanceStatus.RECONCILED)
            .reduce((sum, a) => sum + Number(a.reconciliationAmount || 0), 0);

        return totalAdvanced - totalReconciled;
    }
}
