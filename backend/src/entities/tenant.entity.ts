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

  @Column({ nullable: true })
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

  @Column('jsonb', { default: {} })
  brokerSettings: {
    allowBrokers?: boolean;
    defaultCommissionRate?: number;
    maxBrokers?: number;
    brokerPermissions?: string[];
  };

  // Branding & Customization
  @Column({ default: '#3b82f6', length: 7 })
  primaryColor: string;

  @Column({ default: '#1e293b', length: 7 })
  secondaryColor: string;

  @Column({ nullable: true })
  faviconUrl?: string;

  @Column({ nullable: true, length: 100 })
  portalTitle?: string;

  // Compliance & Legal
  @Column({ nullable: true })
  termsUrl?: string;

  @Column({ nullable: true })
  privacyPolicyUrl?: string;

  @Column({ default: 'us-east-1', length: 50 })
  dataResidency: string;

  // Advanced Configuration
  @Column('jsonb', { default: {} })
  ssoConfig: {
    provider?: 'google' | 'azure-ad' | 'okta';
    clientId?: string;
    clientSecret?: string;
    tenantId?: string;
    enabled?: boolean;
  };

  @Column('jsonb', { default: {} })
  smtpConfig: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    fromName?: string;
    fromEmail?: string;
  };

  @Column('jsonb', { default: {} })
  smsConfig: {
    provider?: 'twilio' | 'aws-sns';
    apiKey?: string;
    apiSecret?: string;
    senderId?: string;
  };

  // Operational
  @Column({ default: false })
  maintenanceMode: boolean;

  @Column({ type: 'int', default: 0 })
  onboardingStep: number;

  // Limits & Quotas
  @Column({ type: 'bigint', default: 5368709120 }) // 5GB default
  storageLimit: number;

  @Column({ type: 'int', default: 1000 }) // Requests per minute
  apiRateLimit: number;

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

  @Column({
    type: 'enum',
    enum: ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'INCOMPLETE'],
    default: 'PENDING',
  })
  kycStatus: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'INCOMPLETE';

  @Column('jsonb', { default: {} })
  kycData: {
    registrationNumber?: string;
    taxId?: string;
    businessType?: string;
    description?: string;
    documents?: Array<{
      type: string;
      url: string;
      verified: boolean;
    }>;
  };

  @Column({ nullable: true })
  kycSubmittedAt?: Date;

  @Column({ nullable: true })
  kycVerifiedAt?: Date;

  @Column({ nullable: true })
  kycNotes?: string;

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
