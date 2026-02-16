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
import { Truck } from './truck.entity';
import { Driver } from './driver.entity';
import { User } from './user.entity';

export enum FuelLogStatus {
    VERIFIED = 'VERIFIED',
    PENDING = 'PENDING',
    FLAGGED = 'FLAGGED',
    REJECTED = 'REJECTED',
}

@Entity('fuel_logs')
@Index(['tenantId', 'truckId'])
@Index(['tenantId', 'driverId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'fuelDate'])
export class FuelLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id', type: 'uuid' })
    tenantId: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'truck_id', type: 'uuid' })
    truckId: string;

    @Column({ name: 'driver_id', type: 'uuid', nullable: true })
    driverId?: string;

    @Column({ name: 'created_by', type: 'uuid' })
    createdBy: string;

    @Column({ name: 'fuel_date', type: 'timestamp with time zone' })
    fuelDate: Date;

    @Column({ name: 'fuel_amount', type: 'decimal', precision: 10, scale: 2 })
    fuelAmount: number;

    @Column({ name: 'gallons', type: 'decimal', precision: 10, scale: 2 })
    gallons: number;

    @Column({ name: 'price_per_gallon', type: 'decimal', precision: 10, scale: 2 })
    pricePerGallon: number;

    @Column({ name: 'total_cost', type: 'decimal', precision: 10, scale: 2 })
    totalCost: number;

    @Column({ name: 'location', type: 'varchar', length: 255 })
    location: string;

    @Column({ name: 'odometer', type: 'decimal', precision: 10, scale: 2, nullable: true })
    odometer?: number;

    @Column({
        name: 'status',
        type: 'enum',
        enum: FuelLogStatus,
        default: FuelLogStatus.PENDING,
    })
    status: FuelLogStatus;

    @Column({ name: 'receipt_number', type: 'varchar', length: 100, nullable: true })
    receiptNumber?: string;

    @Column({ name: 'payment_method', type: 'varchar', length: 100, nullable: true })
    paymentMethod?: string;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes?: string;

    @Column({ name: 'metadata', type: 'jsonb', default: {} })
    metadata?: Record<string, any>;

    @Column({ name: 'is_flagged', type: 'boolean', default: false })
    isFlagged: boolean;

    @Column({ name: 'flag_reason', type: 'text', nullable: true })
    flagReason?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Truck)
    @JoinColumn({ name: 'truck_id' })
    truck: Truck;

    @ManyToOne(() => Driver, { nullable: true })
    @JoinColumn({ name: 'driver_id' })
    driver?: Driver;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    creator: User;
}
