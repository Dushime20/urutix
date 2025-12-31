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
import { Tenant } from './tenant.entity';

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  EXPIRED = 'EXPIRED',
  INVALID = 'INVALID',
  REQUIRES_UPDATE = 'REQUIRES_UPDATE',
}

export enum VerificationType {
  INSURANCE = 'INSURANCE',
  LICENSE = 'LICENSE',
  DOT_NUMBER = 'DOT_NUMBER',
  MC_NUMBER = 'MC_NUMBER',
  CARGO_INSURANCE = 'CARGO_INSURANCE',
  BOND = 'BOND',
}

@Entity('insurance_verifications')
@Index(['transporterId', 'status'])
@Index(['loadId', 'verificationType'])
@Index(['tenantId', 'createdAt'])
export class InsuranceVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  brokerId: string; // Broker who initiated verification

  @Column('uuid')
  transporterId: string;

  @Column('uuid', { nullable: true })
  loadId?: string; // If verification is for specific load

  @Column({
    type: 'enum',
    enum: VerificationType,
  })
  verificationType: VerificationType;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  // Insurance/License Details
  @Column('varchar', { nullable: true })
  policyNumber?: string;

  @Column('varchar', { nullable: true })
  licenseNumber?: string;

  @Column('varchar', { nullable: true })
  dotNumber?: string;

  @Column('varchar', { nullable: true })
  mcNumber?: string;

  @Column('varchar', { nullable: true })
  insuranceCompany?: string;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  coverageAmount?: number;

  @Column('date', { nullable: true })
  effectiveDate?: Date;

  @Column('date', { nullable: true })
  expiryDate?: Date;

  @Column('date', { nullable: true })
  verifiedAt?: Date;

  // Verification Details
  @Column('uuid', { nullable: true })
  verifiedBy?: string; // User ID who verified

  @Column('text', { nullable: true })
  verificationNotes?: string;

  @Column('jsonb', { nullable: true })
  verificationData?: Record<string, any>; // API response, document URLs, etc.

  @Column('text', { nullable: true })
  rejectionReason?: string;

  // Automated Checks
  @Column('boolean', { default: false })
  isAutomated: boolean;

  @Column('date', { nullable: true })
  lastCheckedAt?: Date;

  @Column('date', { nullable: true })
  nextCheckDate?: Date;

  // Alerts
  @Column('boolean', { default: false })
  expiryAlertSent: boolean;

  @Column('date', { nullable: true })
  expiryAlertSentAt?: Date;

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
  @JoinColumn({ name: 'transporterId' })
  transporter: User;

  @ManyToOne(() => Load, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'loadId' })
  load?: Load;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}

