import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Driver } from './driver.entity';
import { Truck } from './truck.entity';

@Entity('fuel_wallets')
@Index(['tenantId', 'driverId'])
@Index(['tenantId', 'truckId'])
@Index(['tenantId', 'ownerId'])
@Index(['tenantId', 'status'])
export class FuelWallet {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id', type: 'uuid' })
    tenantId: string;

    @Column({ name: 'driver_id', type: 'uuid', nullable: true })
    driverId?: string;

    @Column({ name: 'truck_id', type: 'uuid', nullable: true })
    truckId?: string;

    @Column({ name: 'owner_id', type: 'uuid', nullable: true })
    ownerId?: string;

    @Column({ name: 'balance', type: 'decimal', precision: 15, scale: 2, default: 0 })
    balance: number;

    @Column({ name: 'total_credits', type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalCredits: number;

    @Column({ name: 'total_debits', type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalDebits: number;

    @Column({
        name: 'status',
        type: 'varchar',
        length: 50,
        default: 'ACTIVE',
    })
    status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes?: string;

    @Column({ name: 'metadata', type: 'jsonb', default: {} })
    metadata?: Record<string, any>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'last_transaction_at', type: 'timestamp with time zone', nullable: true })
    lastTransactionAt?: Date;

    // Relations
    @ManyToOne(() => Driver, { nullable: true })
    @JoinColumn({ name: 'driver_id' })
    driver?: Driver;

    @ManyToOne(() => Truck, { nullable: true })
    @JoinColumn({ name: 'truck_id' })
    truck?: Truck;
}
