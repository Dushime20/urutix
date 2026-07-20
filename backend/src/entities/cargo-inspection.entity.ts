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
import { Load } from './load.entity';
import { User } from './user.entity';

export enum InspectionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  FAILED = 'FAILED',
  AWAITING_RESOLUTION = 'AWAITING_RESOLUTION',
  READY_FOR_RE_INSPECTION = 'READY_FOR_RE_INSPECTION',
  APPROVED = 'APPROVED',
}

export enum CargoInspectionType {
  PRE_TRIP = 'PRE_TRIP',
  DELIVERY = 'DELIVERY',
}

export enum InspectionDecision {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  CONDITIONAL = 'CONDITIONAL',
}

export interface InspectionChecklistItem {
  id: string;
  label: string;
  originalValue?: any;
  verified: boolean;
  notes?: string;
  discrepancy?: boolean;
  category?: string;
}

@Entity('cargo_inspections')
@Index(['loadId', 'receiverId'])
@Index(['loadId', 'driverId'])
@Index(['loadId', 'inspectionType'])
@Index(['status', 'createdAt'])
export class CargoInspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  loadId: string;

  @Column({
    type: 'enum',
    enum: CargoInspectionType,
    default: CargoInspectionType.DELIVERY,
  })
  inspectionType: CargoInspectionType;

  @Column('uuid', { nullable: true })
  receiverId?: string;

  @Column('uuid', { nullable: true })
  driverId?: string;

  @Column({
    type: 'enum',
    enum: InspectionDecision,
    nullable: true,
  })
  decision?: InspectionDecision;

  @Column({ default: 1 })
  attemptNumber: number;

  @Column({
    type: 'enum',
    enum: InspectionStatus,
    default: InspectionStatus.PENDING,
  })
  status: InspectionStatus;

  @Column('jsonb', { default: [] })
  checklist: InspectionChecklistItem[];

  @Column('text', { nullable: true })
  overallNotes?: string;

  @Column({ default: false })
  allItemsVerified: boolean;

  @Column({ default: 0 })
  verifiedCount: number;

  @Column({ default: 0 })
  totalItems: number;

  @Column({ default: 0 })
  discrepancyCount: number;

  @Column('jsonb', { nullable: true })
  discrepancies?: Array<{
    itemId: string;
    itemLabel: string;
    originalValue: any;
    receivedValue?: any;
    notes: string;
  }>;

  @Column('timestamp with time zone', { nullable: true })
  completedAt?: Date;

  @Column('jsonb', { nullable: true, default: [] })
  documents?: Array<{
    id: string;
    url: string;
    type: 'photo' | 'document' | 'signature';
    label?: string;
    uploadedAt: string;
  }>;

  @Column('jsonb', { nullable: true, default: [] })
  issues?: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    location?: string;
    actionRequired?: string;
    resolved: boolean;
    resolutionNotes?: string;
  }>;

  @Column('jsonb', { nullable: true })
  verificationData?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Load, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loadId' })
  load: Load;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'receiverId' })
  receiver?: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver?: User;
}

