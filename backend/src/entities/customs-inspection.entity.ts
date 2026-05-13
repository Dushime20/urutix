import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Trip } from './trip.entity';

export enum CustomsInspectionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  CLEARED = 'CLEARED',
  REJECTED = 'REJECTED',
  ON_HOLD = 'ON_HOLD',
  HIGH_RISK = 'HIGH_RISK',
}

export enum CustomsRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('customs_inspections')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'officerId'])
@Index(['plateNumber'])
@Index(['shipmentReference'])
@Index(['createdAt'])
export class CustomsInspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  officerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'officerId' })
  officer?: User;

  @Column('uuid', { nullable: true })
  tripId?: string;

  @ManyToOne(() => Trip, { nullable: true })
  @JoinColumn({ name: 'tripId' })
  trip?: Trip;

  @Column({ nullable: true })
  plateNumber?: string;

  @Column({ nullable: true })
  containerNumber?: string;

  @Column({ nullable: true })
  shipmentReference?: string;

  @Column({ nullable: true })
  driverName?: string;

  @Column({ nullable: true })
  driverId?: string;

  @Column({ nullable: true })
  truckType?: string;

  @Column({ nullable: true })
  originCountry?: string;

  @Column({ nullable: true })
  destinationCountry?: string;

  @Column({ nullable: true })
  cargoType?: string;

  @Column({ nullable: true })
  cargoCategory?: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declaredWeight?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  actualWeight?: number;

  @Column('int', { nullable: true })
  declaredQuantity?: number;

  @Column('int', { nullable: true })
  actualQuantity?: number;

  @Column({ nullable: true })
  hsCode?: string;

  @Column({ nullable: true })
  sealNumber?: string;

  @Column({ nullable: true })
  shippingCompany?: string;

  @Column({ default: false })
  hasDangerousGoods: boolean;

  @Column({ default: false })
  isRestrictedGoods: boolean;

  @Column({
    type: 'enum',
    enum: CustomsInspectionStatus,
    default: CustomsInspectionStatus.PENDING,
  })
  status: CustomsInspectionStatus;

  @Column({
    type: 'enum',
    enum: CustomsRiskLevel,
    default: CustomsRiskLevel.LOW,
  })
  riskLevel: CustomsRiskLevel;

  @Column({ nullable: true })
  checkpointId?: string;

  @Column({ nullable: true })
  checkpointName?: string;

  @Column('text', { nullable: true })
  inspectionNotes?: string;

  @Column('text', { nullable: true })
  rejectionReason?: string;

  @Column('jsonb', { nullable: true })
  documentsVerified?: Record<string, boolean>;

  @Column('simple-array', { nullable: true })
  evidenceUrls?: string[];

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
