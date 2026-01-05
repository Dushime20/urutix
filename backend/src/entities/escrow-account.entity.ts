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

export enum EscrowStatus {
  PENDING = 'PENDING',
  FUNDED = 'FUNDED',
  PARTIALLY_RELEASED = 'PARTIALLY_RELEASED',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

export enum ReleaseTrigger {
  DELIVERY_CONFIRMED = 'DELIVERY_CONFIRMED',
  MILESTONE_REACHED = 'MILESTONE_REACHED',
  MANUAL = 'MANUAL',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
  TIME_BASED = 'TIME_BASED',
}

@Entity('escrow_accounts')
@Index(['loadId', 'status'])
@Index(['tripId', 'status'])
@Index(['tenantId', 'createdAt'])
export class EscrowAccount {
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
  payerId: string; // Cargo owner who pays

  @Column('uuid')
  payeeId: string; // Transporter who receives payment

  @Column({
    type: 'enum',
    enum: EscrowStatus,
    default: EscrowStatus.PENDING,
  })
  status: EscrowStatus;

  // Financial Details
  @Column('decimal', { precision: 15, scale: 2 })
  totalAmount: number;

  @Column('varchar', { length: 3, default: 'KES' })
  currencyCode: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  fundedAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  releasedAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  commissionAmount: number; // Broker commission

  // Payment Details
  @Column('varchar', { nullable: true })
  paymentMethod?: string;

  @Column('varchar', { nullable: true })
  paymentReference?: string;

  @Column('varchar', { nullable: true })
  transactionId?: string;

  @Column('date', { nullable: true })
  fundedAt?: Date;

  // Release Configuration
  @Column('jsonb', { default: [] })
  releaseSchedule: Array<{
    milestone: string;
    amount: number;
    percentage?: number;
    trigger: ReleaseTrigger;
    released: boolean;
    releasedAt?: Date;
  }>;

  @Column('jsonb', { nullable: true })
  autoReleaseConfig?: {
    enabled: boolean;
    trigger: ReleaseTrigger;
    delayHours?: number;
    requireConfirmation?: boolean;
  };

  // Release History
  @Column('jsonb', { default: [] })
  releaseHistory: Array<{
    timestamp: Date;
    amount: number;
    trigger: ReleaseTrigger;
    releasedBy: string;
    paymentReference?: string;
    notes?: string;
  }>;

  // Dispute Handling
  @Column('uuid', { nullable: true })
  disputeId?: string;

  @Column('boolean', { default: false })
  isDisputed: boolean;

  @Column('date', { nullable: true })
  disputedAt?: Date;

  // Refund Information
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  refundedAmount: number;

  @Column('jsonb', { default: [] })
  refundHistory: Array<{
    timestamp: Date;
    amount: number;
    reason: string;
    refundedBy: string;
    paymentReference?: string;
  }>;

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
  @JoinColumn({ name: 'payerId' })
  payer: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payeeId' })
  payee: User;

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

