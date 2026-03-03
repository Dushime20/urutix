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
import { Trip } from './trip.entity';
import { User } from './user.entity';

export enum DriverFuelAdvanceStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    RECONCILED = 'RECONCILED',
    CANCELLED = 'CANCELLED',
}

@Entity('driver_fuel_advances')
@Index(['tenantId', 'driverId'])
@Index(['tenantId', 'tripId'])
@Index(['tenantId', 'status'])
export class DriverFuelAdvance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id', type: 'uuid' })
    tenantId: string;

    @Column({ name: 'driver_id', type: 'uuid' })
    driverId: string;

    @Column({ name: 'trip_id', type: 'uuid', nullable: true })
    tripId?: string;

    @Column({ name: 'advance_amount', type: 'decimal', precision: 15, scale: 2 })
    advanceAmount: number;

    @Column({ name: 'advance_date', type: 'timestamp with time zone' })
    advanceDate: Date;

    @Column({
        name: 'status',
        type: 'enum',
        enum: DriverFuelAdvanceStatus,
        default: DriverFuelAdvanceStatus.PENDING,
    })
    status: DriverFuelAdvanceStatus;

    @Column({ name: 'approved_by', type: 'uuid', nullable: true })
    approvedBy?: string;

    @Column({ name: 'approved_at', type: 'timestamp with time zone', nullable: true })
    approvedAt?: Date;

    @Column({ name: 'reconciliation_date', type: 'timestamp with time zone', nullable: true })
    reconciliationDate?: Date;

    @Column({ name: 'reconciliation_amount', type: 'decimal', precision: 15, scale: 2, nullable: true })
    reconciliationAmount?: number;

    @Column({ name: 'reconciliation_notes', type: 'text', nullable: true })
    reconciliationNotes?: string;

    @Column({ name: 'rejection_reason', type: 'text', nullable: true })
    rejectionReason?: string;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes?: string;

    @Column({ name: 'metadata', type: 'jsonb', default: {} })
    metadata?: Record<string, any>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Driver)
    @JoinColumn({ name: 'driver_id' })
    driver: Driver;

    @ManyToOne(() => Trip, { nullable: true })
    @JoinColumn({ name: 'trip_id' })
    trip?: Trip;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'approved_by' })
    approver?: User;
}
