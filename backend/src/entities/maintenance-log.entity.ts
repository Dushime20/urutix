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

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MaintenanceType {
  ROUTINE = 'ROUTINE',
  REPAIR = 'REPAIR',
  EMERGENCY = 'EMERGENCY',
  INSPECTION = 'INSPECTION',
  FAULT_REPORT = 'FAULT_REPORT',
}

@Entity('maintenance_logs')
@Index(['tenantId', 'truckId'])
@Index(['truckId', 'status'])
export class MaintenanceLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  truckId: string;

  @Column({ type: 'uuid', nullable: true })
  driverId: string;

  @Column({
    type: 'enum',
    enum: MaintenanceType,
    default: MaintenanceType.ROUTINE,
  })
  type: MaintenanceType;

  @Column({ type: 'varchar', length: 255 })
  taskName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  serviceDate: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerName: string;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.PENDING,
  })
  status: MaintenanceStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cost: number;

  @Column({ type: 'int', nullable: true })
  odometerReading: number;

  @Column({ type: 'jsonb', nullable: true })
  partsReplaced: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Truck)
  @JoinColumn({ name: 'truckId' })
  truck: Truck;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver: Driver;
}
