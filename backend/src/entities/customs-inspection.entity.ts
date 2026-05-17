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

export enum InspectionChannel {
  GREEN = 'GREEN',   // Auto-cleared, no inspection
  YELLOW = 'YELLOW', // Document check only
  RED = 'RED',       // Full physical + document inspection
}

export enum ExamType {
  NONE = 'NONE',
  DOCUMENT = 'DOCUMENT',         // Document review only
  X_RAY = 'X_RAY',               // Non-intrusive X-ray scan (NII/VACIS)
  TAILGATE = 'TAILGATE',         // Seal break, visual look inside
  INTENSIVE = 'INTENSIVE',       // Full devanning at exam site ("Full Monty")
}

export enum HoldType {
  NONE = 'NONE',
  MANIFEST = 'MANIFEST',                     // Data discrepancy on manifest
  STATISTICAL = 'STATISTICAL',               // Weight/value mismatch vs commodity norms
  COMMERCIAL_ENFORCEMENT = 'COMMERCIAL_ENFORCEMENT', // Regulatory violation
  ANTI_TERRORISM = 'ANTI_TERRORISM',         // CET/contraband hold
  AGENCY = 'AGENCY',                         // FDA/USDA/other government agency
  SANCTIONS = 'SANCTIONS',                   // Denied party / sanctions list match
  DANGEROUS_GOODS = 'DANGEROUS_GOODS',       // IMDG/hazmat violation
  DUTY_ARREARS = 'DUTY_ARREARS',             // Outstanding duty payments
}

export enum ModeOfTransport {
  ROAD = 'ROAD',
  SEA = 'SEA',
  AIR = 'AIR',
  RAIL = 'RAIL',
  MULTIMODAL = 'MULTIMODAL',
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

  @Column({ nullable: true })
  declarationNumber?: string;

  @Column({ nullable: true })
  countryOfOrigin?: string;

  @Column({ nullable: true })
  modeOfTransport?: string;

  @Column({ nullable: true })
  imdgClass?: string;

  @Column({ nullable: true })
  unNumber?: string;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  declaredValue?: number;

  @Column({ nullable: true, default: 'USD' })
  currency?: string;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  dutyAmount?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  taxAmount?: number;

  @Column({ nullable: true })
  aeoNumber?: string;

  @Column({ default: false })
  deniedPartyFlag: boolean;

  @Column({ default: false })
  sanctionsScreened: boolean;

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

  @Column({
    type: 'enum',
    enum: InspectionChannel,
    nullable: true,
  })
  inspectionChannel?: InspectionChannel;

  @Column({
    type: 'enum',
    enum: ExamType,
    default: ExamType.NONE,
  })
  examType: ExamType;

  @Column({
    type: 'enum',
    enum: HoldType,
    default: HoldType.NONE,
  })
  holdType: HoldType;

  @Column({ nullable: true })
  estimatedReleaseAt?: Date;

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
