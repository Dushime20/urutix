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

export enum RenewalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  URGENT = 'urgent',
}

export enum RenewalType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade',
  TRANSFER = 'transfer',
}

@Entity('policy_renewals')
@Index(['renewalNumber'], { unique: true })
@Index(['policyId', 'status'])
@Index(['tenantId', 'status'])
@Index(['renewalDate'])
export class PolicyRenewal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  renewalNumber: string;

  @Column({ type: 'enum', enum: RenewalStatus, default: RenewalStatus.PENDING })
  status: RenewalStatus;

  @Column({ type: 'enum', enum: RenewalType, default: RenewalType.MANUAL })
  renewalType: RenewalType;

  @Column({ type: 'date' })
  currentEndDate: Date;

  @Column({ type: 'date' })
  renewalDate: Date;

  @Column({ type: 'date', nullable: true })
  newStartDate: Date;

  @Column({ type: 'date', nullable: true })
  newEndDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  currentPremium: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  newPremium: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  premiumChange: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  newCoverageAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  newDeductible: number;

  @Column({ type: 'json', nullable: true })
  coverageChanges: string[];

  @Column({ type: 'json', nullable: true })
  newCoverageDetails: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  autoRenew: boolean;

  @Column({ type: 'text', nullable: true })
  renewalReason: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  documents: string[];

  @Column({ type: 'date', nullable: true })
  reminderSentDate: Date;

  @Column({ type: 'date', nullable: true })
  approvalDate: Date;

  @Column({ type: 'date', nullable: true })
  completionDate: Date;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'uuid' })
  policyId: string;

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
  @JoinColumn({ name: 'approvedBy' })
  approver: User;

  // Computed properties
  get daysUntilRenewal(): number {
    const today = new Date();
    const renewal = new Date(this.renewalDate);
    const diffTime = renewal.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isUrgent(): boolean {
    return this.daysUntilRenewal <= 30 || this.status === RenewalStatus.URGENT;
  }

  get isOverdue(): boolean {
    return this.daysUntilRenewal < 0;
  }

  get premiumChangePercentage(): number {
    if (!this.newPremium || !this.currentPremium) return 0;
    return ((this.newPremium - this.currentPremium) / this.currentPremium) * 100;
  }

  get isAutomatic(): boolean {
    return this.renewalType === RenewalType.AUTOMATIC;
  }

  get requiresApproval(): boolean {
    return this.renewalType === RenewalType.MANUAL || this.renewalType === RenewalType.UPGRADE;
  }

  get canAutoRenew(): boolean {
    return this.autoRenew && this.status === RenewalStatus.PENDING && this.daysUntilRenewal <= 0;
  }

  get statusColor(): string {
    switch (this.status) {
      case RenewalStatus.URGENT:
        return 'red';
      case RenewalStatus.PENDING:
        return 'yellow';
      case RenewalStatus.APPROVED:
        return 'blue';
      case RenewalStatus.COMPLETED:
        return 'green';
      case RenewalStatus.REJECTED:
      case RenewalStatus.CANCELLED:
        return 'gray';
      default:
        return 'gray';
    }
  }
}
