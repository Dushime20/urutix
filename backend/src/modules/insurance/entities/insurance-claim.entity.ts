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
import { User } from '../../../entities/user.entity';
import { InsurancePolicy } from './insurance-policy.entity';
import { Tenant } from '../../../entities/tenant.entity';

export enum ClaimStatus {
  PENDING = 'pending',
  INVESTIGATING = 'investigating',
  APPROVED = 'approved',
  DENIED = 'denied',
  CLOSED = 'closed',
  UNDER_REVIEW = 'under_review',
  SETTLEMENT_PENDING = 'settlement_pending',
}

export enum ClaimType {
  COLLISION = 'collision',
  THEFT = 'theft',
  VANDALISM = 'vandalism',
  WEATHER_DAMAGE = 'weather_damage',
  CARGO_DAMAGE = 'cargo_damage',
  CARGO_THEFT = 'cargo_theft',
  FIRE = 'fire',
  FLOOD = 'flood',
  MECHANICAL_BREAKDOWN = 'mechanical_breakdown',
  ROADSIDE_ASSISTANCE = 'roadside_assistance',
  MEDICAL = 'medical',
  LIABILITY = 'liability',
  OTHER = 'other',
}

export enum ClaimPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('insurance_claims')
@Index(['claimNumber'], { unique: true })
@Index(['policyId', 'status'])
@Index(['tenantId', 'status'])
@Index(['incidentDate'])
export class InsuranceClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  claimNumber: string;

  @Column({ type: 'enum', enum: ClaimType })
  claimType: ClaimType;

  @Column({ type: 'enum', enum: ClaimStatus, default: ClaimStatus.PENDING })
  status: ClaimStatus;

  @Column({ type: 'enum', enum: ClaimPriority, default: ClaimPriority.MEDIUM })
  priority: ClaimPriority;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date' })
  incidentDate: Date;

  @Column({ type: 'date' })
  reportedDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  estimatedAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  approvedAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  paidAmount: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  adjusterName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  adjusterPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  adjusterEmail: string;

  @Column({ type: 'text', nullable: true })
  adjusterNotes: string;

  @Column({ type: 'text', nullable: true })
  investigationNotes: string;

  @Column({ type: 'text', nullable: true })
  denialReason: string;

  @Column({ type: 'json', nullable: true })
  documents: string[];

  @Column({ type: 'json', nullable: true })
  photos: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  policeReportNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  witnessName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  witnessPhone: string;

  @Column({ type: 'text', nullable: true })
  witnessStatement: string;

  @Column({ type: 'boolean', default: false })
  isFault: boolean;

  @Column({ type: 'text', nullable: true })
  faultDescription: string;

  @Column({ type: 'date', nullable: true })
  settlementDate: Date;

  @Column({ type: 'text', nullable: true })
  settlementNotes: string;

  @Column({ type: 'uuid' })
  policyId: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  assignedTo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Relationships
  @ManyToOne(() => InsurancePolicy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policyId' })
  policy: InsurancePolicy;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedTo' })
  assignee: User;

  // Computed properties
  get isOpen(): boolean {
    return [ClaimStatus.PENDING, ClaimStatus.INVESTIGATING, ClaimStatus.UNDER_REVIEW, ClaimStatus.SETTLEMENT_PENDING].includes(this.status);
  }

  get isClosed(): boolean {
    return [ClaimStatus.CLOSED, ClaimStatus.DENIED].includes(this.status);
  }

  get isApproved(): boolean {
    return this.status === ClaimStatus.APPROVED;
  }

  get daysSinceIncident(): number {
    const today = new Date();
    const incident = new Date(this.incidentDate);
    const diffTime = today.getTime() - incident.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get daysSinceReported(): number {
    const today = new Date();
    const reported = new Date(this.reportedDate);
    const diffTime = today.getTime() - reported.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get claimValue(): number {
    return this.approvedAmount || this.estimatedAmount;
  }

  get isUrgent(): boolean {
    return this.priority === ClaimPriority.URGENT || this.daysSinceIncident > 30;
  }
}
