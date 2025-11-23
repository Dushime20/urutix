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
import { Truck } from './truck.entity';
import { InsuranceClaim } from './insurance-claim.entity';
import { InsuranceRenewal } from './insurance-renewal.entity';

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
  ROADSIDE = 'roadside',
  MEDICAL = 'medical',
}

export enum PaymentMethod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  LUMP_SUM = 'lump_sum',
}

@Entity('insurance_policies')
export class InsurancePolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  policyNumber: string;

  @Column({ type: 'uuid' })
  @Index()
  truckId: string;

  @ManyToOne(() => Truck, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'truckId' })
  truck: Truck;

  @Column()
  @Index()
  insuranceCompany: string;

  @Column({
    type: 'enum',
    enum: PolicyType,
  })
  policyType: PolicyType;

  @Column('decimal', { precision: 15, scale: 2 })
  coverageAmount: number;

  @Column('decimal', { precision: 15, scale: 2 })
  premium: number;

  @Column('decimal', { precision: 15, scale: 2 })
  deductible: number;

  @Column({ type: 'date' })
  @Index()
  startDate: Date;

  @Column({ type: 'date' })
  @Index()
  endDate: Date;

  @Column({
    type: 'enum',
    enum: PolicyStatus,
    default: PolicyStatus.PENDING,
  })
  @Index()
  status: PolicyStatus;

  @Column('simple-array', { nullable: true })
  coverageTypes: PolicyType[];

  @Column({ default: false })
  autoRenew: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column('json', { nullable: true })
  documents: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
  }>;

  @Column('json', { nullable: true })
  agent: {
    name: string;
    email: string;
    phone: string;
  };

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.MONTHLY,
  })
  paymentMethod: PaymentMethod;

  @Column({ type: 'date', nullable: true })
  lastPaymentDate: Date;

  @Column({ type: 'date', nullable: true })
  nextPaymentDate: Date;

  @Column({ default: 0 })
  claimsCount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalClaimsAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties (calculated fields)
  get daysUntilExpiration(): number {
    if (!this.endDate) return null;
    const now = new Date();
    const end = new Date(this.endDate);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get calculatedStatus(): PolicyStatus {
    if (
      this.status === PolicyStatus.CANCELLED ||
      this.status === PolicyStatus.SUSPENDED
    ) {
      return this.status;
    }

    const now = new Date();
    if (this.endDate < now) {
      return PolicyStatus.EXPIRED;
    }

    if (this.startDate > now) {
      return PolicyStatus.PENDING;
    }

    return PolicyStatus.ACTIVE;
  }

  // Methods
  isExpiringSoon(days: number = 30): boolean {
    if (!this.endDate) return false;
    const now = new Date();
    const end = new Date(this.endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days && diffDays >= 0;
  }

  calculateRenewalPremium(): number {
    let basePremium = this.premium;

    // Adjust based on claims history
    if (this.claimsCount > 0) {
      const claimsRatio = this.totalClaimsAmount / this.coverageAmount;
      if (claimsRatio > 0.1) {
        // More than 10% of coverage used
        basePremium *= 1.2; // 20% increase
      }
    }

    // Adjust based on policy age
    const policyAge =
      (new Date().getTime() - new Date(this.startDate).getTime()) /
      (1000 * 60 * 60 * 24 * 365);
    if (policyAge > 3) {
      // Policy older than 3 years
      basePremium *= 1.1; // 10% increase
    }

    return Math.round(basePremium * 100) / 100; // Round to 2 decimal places
  }

  // Relations
  @OneToMany(() => InsuranceClaim, (claim) => claim.policy)
  claims: InsuranceClaim[];

  @OneToMany(() => InsuranceRenewal, (renewal) => renewal.policy)
  renewals: InsuranceRenewal[];
}
