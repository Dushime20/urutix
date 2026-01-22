import {
  Entity,
  PrimaryColumn,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { User } from './user.entity';
import { Load } from './load.entity';
import { Trip } from './trip.entity';
import { Tenant } from './tenant.entity';

export enum ContractStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  PENDING_BROKER_ACCEPTANCE = 'PENDING_BROKER_ACCEPTANCE',
  PARTIALLY_SIGNED = 'PARTIALLY_SIGNED',
  SIGNED = 'SIGNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
}

export enum ContractType {
  LOAD_AGREEMENT = 'LOAD_AGREEMENT',
  TRANSPORT_AGREEMENT = 'TRANSPORT_AGREEMENT',
  BROKER_AGREEMENT = 'BROKER_AGREEMENT',
}

@Entity('load_contracts')
@Index(['loadId', 'status'])
@Index(['brokerId', 'status'])
@Index(['tenantId', 'createdAt'])
export class LoadContract {
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
  cargoOwnerId: string;

  @Column('uuid', { nullable: true })
  transporterId?: string;

  @Column({
    type: 'enum',
    enum: ContractType,
    default: ContractType.LOAD_AGREEMENT,
  })
  contractType: ContractType;

  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.DRAFT,
  })
  status: ContractStatus;

  // Contract Terms
  @Column('decimal', { precision: 15, scale: 2 })
  agreedRate: number;

  @Column('varchar', { length: 3, default: 'KES' })
  currencyCode: string;

  @Column('decimal', { precision: 5, scale: 2 })
  commissionRate: number;

  @Column('decimal', { precision: 15, scale: 2 })
  commissionAmount: number;

  @Column('text', { nullable: true })
  paymentTerms: string; // e.g., "Net 30", "50% advance, 50% on delivery"

  @Column('date', { nullable: true })
  paymentDueDate?: Date;

  @Column('date', { nullable: true })
  pickupDate?: Date;

  @Column('date', { nullable: true })
  deliveryDate?: Date;

  @Column('text', { nullable: true })
  deliveryTerms?: string;

  @Column('text', { nullable: true })
  specialInstructions?: string;

  // Contract Content
  @Column('text')
  contractContent: string; // Full contract text/template

  @Column('jsonb', { default: {} })
  contractData: Record<string, any>; // Structured contract data

  // Signature Tracking
  @Column('jsonb', { nullable: true })
  cargoOwnerSignature?: {
    signedAt: Date;
    signatureMethod: 'DIGITAL' | 'E_SIGNATURE' | 'MANUAL';
    signatureData?: string;
    ipAddress?: string;
  };

  @Column('jsonb', { nullable: true })
  transporterSignature?: {
    signedAt: Date;
    signatureMethod: 'DIGITAL' | 'E_SIGNATURE' | 'MANUAL';
    signatureData?: string;
    ipAddress?: string;
  };

  @Column('jsonb', { nullable: true })
  brokerSignature?: {
    signedAt: Date;
    signatureMethod: 'DIGITAL' | 'E_SIGNATURE' | 'MANUAL';
    signatureData?: string;
    ipAddress?: string;
  };

  @Column('date', { nullable: true })
  fullySignedAt?: Date;

  // Negotiation History
  @Column('jsonb', { default: [] })
  negotiationHistory: Array<{
    timestamp: Date;
    changedBy: string;
    changes: Record<string, any>;
    notes?: string;
  }>;

  // Contract Expiry
  @Column('date', { nullable: true })
  expiresAt?: Date;

  @Column('boolean', { default: false })
  isTemplate: boolean;

  @Column('uuid', { nullable: true })
  templateId?: string; // If created from template

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
  @JoinColumn({ name: 'cargoOwnerId' })
  cargoOwner: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transporterId' })
  transporter: User;

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

