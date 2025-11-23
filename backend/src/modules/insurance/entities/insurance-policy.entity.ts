import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../../entities/user.entity';
import { Truck } from '../../../entities/truck.entity';
import { Tenant } from '../../../entities/tenant.entity';
import { InsuranceClaim } from './insurance-claim.entity';
import { PolicyRenewal } from './policy-renewal.entity';

export enum PolicyStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
}

export enum PolicyType {
  LIABILITY = 'liability',
  COLLISION = 'collision',
  COMPREHENSIVE = 'comprehensive',
  CARGO = 'cargo',
  UNINSURED_MOTORIST = 'uninsured_motorist',
  MEDICAL_PAYMENTS = 'medical_payments',
  ROADSIDE_ASSISTANCE = 'roadside_assistance',
  RENTAL_REIMBURSEMENT = 'rental_reimbursement',
  FULL_COVERAGE = 'full_coverage',
  COMMERCIAL = 'commercial',
}

@Entity('insurance_policies')
@Index(['policyNumber'], { unique: true })
@Index(['truckId', 'status'])
@Index(['tenantId', 'status'])
export class InsurancePolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  policyNumber: string;

  @Column({ type: 'varchar', length: 100 })
  insuranceCompany: string;

  @Column({ type: 'enum', enum: PolicyType })
  policyType: PolicyType;

  @Column({ type: 'enum', enum: PolicyStatus, default: PolicyStatus.PENDING })
  status: PolicyStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  coverageAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyPremium: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  deductible: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  coverageDetails: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  exclusions: string[];

  @Column({ type: 'json', nullable: true })
  conditions: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  autoRenew: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  agentName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  agentPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  agentEmail: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  documents: string[];

  @Column({ type: 'uuid' })
  truckId: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Relationships
  @ManyToOne(() => Truck, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'truckId' })
  truck: Truck;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => InsuranceClaim, (claim) => claim.policy)
  claims: InsuranceClaim[];

  @OneToMany(() => PolicyRenewal, (renewal) => renewal.policy)
  renewals: PolicyRenewal[];

  // Computed properties
  get isActive(): boolean {
    return this.status === PolicyStatus.ACTIVE;
  }

  get isExpired(): boolean {
    return new Date() > this.endDate;
  }

  get daysUntilExpiry(): number {
    const today = new Date();
    const expiry = new Date(this.endDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get totalPremium(): number {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    return months * this.monthlyPremium;
  }
}
