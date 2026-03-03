import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FuelWallet } from '../../entities/fuel-wallet.entity';
import { FuelWalletTransaction, FuelWalletTransactionType } from '../../entities/fuel-wallet-transaction.entity';

@Injectable()
export class FuelWalletService {
    constructor(
        @InjectRepository(FuelWallet)
        private readonly walletRepository: Repository<FuelWallet>,
        @InjectRepository(FuelWalletTransaction)
        private readonly transactionRepository: Repository<FuelWalletTransaction>,
    ) { }

    async getOrCreateWallet(
        tenantId: string,
        driverId?: string,
        truckId?: string,
    ): Promise<FuelWallet> {
        let wallet = await this.walletRepository.findOne({
            where: {
                tenantId,
                ...(driverId && { driverId }),
                ...(truckId && { truckId }),
            },
        });

        if (!wallet) {
            wallet = this.walletRepository.create({
                tenantId,
                driverId,
                truckId,
                balance: 0,
                totalCredits: 0,
                totalDebits: 0,
                status: 'ACTIVE',
            });
            wallet = await this.walletRepository.save(wallet);
        }

        return wallet;
    }

    async getWallet(id: string, tenantId: string): Promise<FuelWallet> {
        const wallet = await this.walletRepository.findOne({
            where: { id, tenantId },
            relations: ['driver', 'truck'],
        });

        if (!wallet) {
            throw new NotFoundException(`Fuel wallet with ID ${id} not found`);
        }

        return wallet;
    }

    async getWalletByDriver(driverId: string, tenantId: string): Promise<FuelWallet> {
        return this.getOrCreateWallet(tenantId, driverId);
    }

    async getWalletByTruck(truckId: string, tenantId: string): Promise<FuelWallet> {
        return this.getOrCreateWallet(tenantId, undefined, truckId);
    }

    async getOrCreateWalletForOwner(ownerId: string, tenantId: string): Promise<FuelWallet> {
        try {
            console.log('🔍 getOrCreateWalletForOwner - ownerId:', ownerId, 'tenantId:', tenantId);

            let wallet = await this.walletRepository.findOne({
                where: {
                    tenantId,
                    ownerId,
                },
            });

            if (!wallet) {
                console.log('📝 No wallet found, creating new one...');
                wallet = this.walletRepository.create({
                    tenantId,
                    ownerId,
                    balance: 0,
                    totalCredits: 0,
                    totalDebits: 0,
                    status: 'ACTIVE',
                    metadata: {},
                });
                wallet = await this.walletRepository.save(wallet);
                console.log('✅ Created wallet:', wallet.id);
            } else {
                console.log('✅ Found existing wallet:', wallet.id);
            }

            return wallet;
        } catch (error) {
            console.error('❌ getOrCreateWalletForOwner failed:', error);
            throw error;
        }
    }

    async addCredit(
        walletId: string,
        amount: number,
        description: string,
        tenantId: string,
        referenceId?: string,
        metadata?: any,
    ): Promise<FuelWallet> {
        const wallet = await this.getWallet(walletId, tenantId);

        if (amount <= 0) {
            throw new BadRequestException('Credit amount must be greater than 0');
        }

        // Update wallet
        wallet.balance = Number(wallet.balance) + amount;
        wallet.totalCredits = Number(wallet.totalCredits) + amount;
        wallet.lastTransactionAt = new Date();
        await this.walletRepository.save(wallet);

        // Create transaction record with metadata
        await this.transactionRepository.save({
            tenantId,
            walletId,
            type: FuelWalletTransactionType.CREDIT,
            amount,
            description,
            referenceId,
            metadata: metadata || {},
        });

        return wallet;
    }

    async debitForFuel(
        walletId: string,
        amount: number,
        fuelLogId: string,
        tenantId: string,
    ): Promise<FuelWallet> {
        const wallet = await this.getWallet(walletId, tenantId);

        if (amount <= 0) {
            throw new BadRequestException('Debit amount must be greater than 0');
        }

        const availableBalance = Number(wallet.balance);
        if (availableBalance < amount) {
            throw new BadRequestException(
                `Insufficient wallet balance. Available: ${availableBalance}, Required: ${amount}`,
            );
        }

        // Update wallet
        wallet.balance = availableBalance - amount;
        wallet.totalDebits = Number(wallet.totalDebits) + amount;
        wallet.lastTransactionAt = new Date();
        await this.walletRepository.save(wallet);

        // Create transaction record
        await this.transactionRepository.save({
            tenantId,
            walletId,
            type: FuelWalletTransactionType.DEBIT,
            amount,
            fuelLogId,
            description: `Fuel purchase debit`,
        });

        return wallet;
    }

    async getTransactionHistory(
        walletId: string,
        tenantId: string,
        limit: number = 50,
        offset: number = 0,
    ): Promise<{ transactions: FuelWalletTransaction[]; total: number }> {
        const [transactions, total] = await this.transactionRepository.findAndCount({
            where: { walletId, tenantId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });

        return { transactions, total };
    }

    async getWalletStats(tenantId: string, userId?: string): Promise<any> {
        // If userId is provided (truck owner), filter wallets owned by this user
        let wallets: FuelWallet[];

        if (userId) {
            // Get wallets owned by this truck owner
            wallets = await this.walletRepository.find({
                where: { tenantId, ownerId: userId },
            });
        } else {
            // Admin view - get all wallets for tenant
            wallets = await this.walletRepository.find({
                where: { tenantId },
            });
        }

        const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
        const totalCredits = wallets.reduce((sum, w) => sum + Number(w.totalCredits), 0);
        const totalDebits = wallets.reduce((sum, w) => sum + Number(w.totalDebits), 0);
        const activeWallets = wallets.filter(w => w.status === 'ACTIVE').length;

        return {
            totalBalance,
            totalCredits,
            totalDebits,
            activeWallets,
            totalWallets: wallets.length,
            averageBalance: wallets.length > 0 ? totalBalance / wallets.length : 0,
        };
    }

    async suspendWallet(id: string, tenantId: string): Promise<FuelWallet> {
        const wallet = await this.getWallet(id, tenantId);
        wallet.status = 'SUSPENDED';
        return await this.walletRepository.save(wallet);
    }

    async activateWallet(id: string, tenantId: string): Promise<FuelWallet> {
        const wallet = await this.getWallet(id, tenantId);
        wallet.status = 'ACTIVE';
        return await this.walletRepository.save(wallet);
    }
}
