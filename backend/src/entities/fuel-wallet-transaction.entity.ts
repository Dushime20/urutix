import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { FuelWallet } from './fuel-wallet.entity';
import { FuelLog } from './fuel-log.entity';

export enum FuelWalletTransactionType {
    CREDIT = 'CREDIT',
    DEBIT = 'DEBIT',
}

@Entity('fuel_wallet_transactions')
@Index(['tenantId', 'walletId'])
@Index(['tenantId', 'type'])
@Index(['tenantId', 'createdAt'])
export class FuelWalletTransaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id', type: 'uuid' })
    tenantId: string;

    @Column({ name: 'wallet_id', type: 'uuid' })
    walletId: string;

    @Column({
        name: 'type',
        type: 'enum',
        enum: FuelWalletTransactionType,
    })
    type: FuelWalletTransactionType;

    @Column({ name: 'amount', type: 'decimal', precision: 15, scale: 2 })
    amount: number;

    @Column({ name: 'fuel_log_id', type: 'uuid', nullable: true })
    fuelLogId?: string;

    @Column({ name: 'description', type: 'varchar', length: 255 })
    description: string;

    @Column({ name: 'reference_id', type: 'varchar', length: 100, nullable: true })
    referenceId?: string;

    @Column({ name: 'metadata', type: 'jsonb', default: {} })
    metadata?: Record<string, any>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    // Relations
    @ManyToOne(() => FuelWallet, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'wallet_id' })
    wallet: FuelWallet;

    @ManyToOne(() => FuelLog, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'fuel_log_id' })
    fuelLog?: FuelLog;
}
