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
import { Trip } from './trip.entity';
import { Truck } from './truck.entity';

export enum FuelBudgetStatus {
    PLANNED = 'PLANNED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    OVER_BUDGET = 'OVER_BUDGET',
    CANCELLED = 'CANCELLED',
}

@Entity('fuel_budgets')
@Index(['tenantId', 'tripId'])
@Index(['tenantId', 'truckId'])
@Index(['tenantId', 'status'])
export class FuelBudget {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id', type: 'uuid' })
    tenantId: string;

    @Column({ name: 'trip_id', type: 'uuid' })
    tripId: string;

    @Column({ name: 'truck_id', type: 'uuid' })
    truckId: string;

    @Column({ name: 'budgeted_amount', type: 'decimal', precision: 15, scale: 2 })
    budgetedAmount: number;

    @Column({ name: 'actual_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
    actualAmount: number;

    @Column({ name: 'variance', type: 'decimal', precision: 15, scale: 2, default: 0 })
    variance: number;

    @Column({
        name: 'status',
        type: 'enum',
        enum: FuelBudgetStatus,
        default: FuelBudgetStatus.PLANNED,
    })
    status: FuelBudgetStatus;

    @Column({ name: 'variance_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
    variancePercentage: number;

    @Column({ name: 'alert_threshold', type: 'decimal', precision: 5, scale: 2, default: 10 })
    alertThreshold: number;

    @Column({ name: 'alert_triggered', type: 'boolean', default: false })
    alertTriggered: boolean;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes?: string;

    @Column({ name: 'metadata', type: 'jsonb', default: {} })
    metadata?: Record<string, any>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'trip_id' })
    trip: Trip;

    @ManyToOne(() => Truck)
    @JoinColumn({ name: 'truck_id' })
    truck: Truck;
}
