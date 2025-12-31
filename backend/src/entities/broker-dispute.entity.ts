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
import { User } from './user.entity';
import { Load } from './load.entity';
import { Trip } from './trip.entity';
import { Tenant } from './tenant.entity';

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  MEDIATION = 'MEDIATION',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED',
}

export enum DisputeCategory {
  DAMAGE = 'DAMAGE',
  DELAY = 'DELAY',
  PAYMENT = 'PAYMENT',
  QUALITY = 'QUALITY',
  ROUTE = 'ROUTE',
  COMMUNICATION = 'COMMUNICATION',
  OTHER = 'OTHER',
}

export enum DisputeSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('broker_disputes')
@Index(['brokerId', 'status'])
@Index(['loadId', 'status'])
@Index(['tripId', 'status'])
@Index(['tenantId', 'createdAt'])
export class BrokerDispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  brokerId: string;

  @Column('uuid')
  loadId: string;

  @Column('uuid', { nullable: true })
  tripId?: string;

  @Column('uuid')
  raisedById: string; // Who raised the dispute (cargo owner or transporter)

  @Column('uuid')
  disputedWithId: string; // The other party

  @Column({
    type: 'enum',
    enum: DisputeCategory,
  })
  category: DisputeCategory;

  @Column({
    type: 'enum',
    enum: DisputeStatus,
    default: DisputeStatus.OPEN,
  })
  status: DisputeStatus;

  @Column({
    type: 'enum',
    enum: DisputeSeverity,
    default: DisputeSeverity.MEDIUM,
  })
  severity: DisputeSeverity;

  @Column('text')
  description: string;

  @Column('text', { nullable: true })
  resolution?: string;

  // Financial Impact
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  claimedAmount?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  resolvedAmount?: number;

  // Evidence
  @Column('jsonb', { default: [] })
  evidence: Array<{
    type: 'PHOTO' | 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'OTHER';
    url: string;
    description?: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;

  // Mediation
  @Column('uuid', { nullable: true })
  mediatorId?: string; // Broker or admin mediating

  @Column('jsonb', { default: [] })
  mediationHistory: Array<{
    timestamp: Date;
    mediatorId: string;
    action: string;
    notes?: string;
    outcome?: string;
  }>;

  @Column('jsonb', { default: [] })
  communications: Array<{
    timestamp: Date;
    from: string;
    to: string;
    message: string;
    type: 'MESSAGE' | 'OFFER' | 'COUNTER_OFFER' | 'ACCEPTANCE' | 'REJECTION';
  }>;

  // Resolution
  @Column('date', { nullable: true })
  resolvedAt?: Date;

  @Column('uuid', { nullable: true })
  resolvedBy?: string;

  @Column('text', { nullable: true })
  resolutionNotes?: string;

  @Column('jsonb', { nullable: true })
  resolutionTerms?: Record<string, any>;

  // Timestamps
  @Column('date', { nullable: true })
  escalatedAt?: Date;

  @Column('date', { nullable: true })
  closedAt?: Date;

  // Metadata
  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brokerId' })
  broker: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'raisedById' })
  raisedBy: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'disputedWithId' })
  disputedWith: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'mediatorId' })
  mediator?: User;

  @ManyToOne(() => Load, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loadId' })
  load: Load;

  @ManyToOne(() => Trip, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tripId' })
  trip?: Trip;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}

