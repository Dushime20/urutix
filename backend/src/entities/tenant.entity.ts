import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_ACTIVATION = 'PENDING_ACTIVATION',
  DEACTIVATED = 'DEACTIVATED',
}

export enum TenantType {
  ENTERPRISE = 'ENTERPRISE',
  SMALL_BUSINESS = 'SMALL_BUSINESS',
  INDIVIDUAL = 'INDIVIDUAL',
  PARTNER = 'PARTNER',
}

export enum KycStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  INCOMPLETE = 'INCOMPLETE',
}

export enum OnboardingStep {
  STEP_1_BRANDING = 'STEP_1_BRANDING',
  STEP_2_KYC = 'STEP_2_KYC',
  STEP_3_PLAN = 'STEP_3_PLAN',
  STEP_4_CONFIG = 'STEP_4_CONFIG',
  COMPLETED = 'COMPLETED',
}

@Entity('tenants')
@Index(['subdomain'], { unique: true, where: 'deleted_at IS NULL' })
@Index(['status', 'type'])
@Index(['isActive', 'subscriptionPlan'])
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  subdomain?: string;

  @Column({ nullable: true })
  domain?: string;

  @Column({
    type: 'enum',
    enum: TenantType,
    default: TenantType.SMALL_BUSINESS,
  })
  type: TenantType;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.PENDING_ACTIVATION,
  })
  status: TenantStatus;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ nullable: true })
  websiteUrl?: string;

  @Column({ nullable: true, unique: true })
  contactEmail?: string;

  @Column({ nullable: true })
  contactPhone?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  postalCode?: string;

  @Column({ nullable: true })
  taxId?: string;

  @Column({ nullable: true })
  businessLicense?: string;

  @Column('jsonb', { default: {} })
  settings: Record<string, any>;

  @Column('jsonb', { default: {} })
  features: Record<string, any>;

  @Column('jsonb', { default: {} })
  billingInfo: Record<string, any>;

  @Column({ nullable: true })
  maxUsers?: number;

  @Column({ nullable: true })
  maxTrucks?: number;

  @Column({ nullable: true })
  maxDrivers?: number;

  @Column({ nullable: true })
  maxLoadsPerMonth?: number;

  @Column({ nullable: true })
  subscriptionPlan?: string;

  @Column({ nullable: true })
  subscriptionExpiresAt?: Date;

  @Column({ nullable: true })
  trialEndsAt?: Date;

  @Column({ default: false })
  isActive: boolean;

  @Column({ nullable: true })
  activatedAt?: Date;

  @Column({ nullable: true })
  suspendedAt?: Date;

  @Column({ nullable: true })
  suspendedReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @OneToMany('User', 'tenant')
  users: User[];

  @OneToMany(() => User, (user) => user.brokerTenant)
  brokers: User[];
}
