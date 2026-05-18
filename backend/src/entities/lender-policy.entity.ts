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

@Entity('lender_policies')
@Index(['lender_id', 'created_at'])
export class LenderPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  lender_id: string;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  interest_rate: number;

  @Column({ type: 'int' })
  repayment_term_days: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  max_advance_per_trip: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  max_exposure: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.7 })
  advance_percentage: number;

  // ── International standard underwriting criteria ────────────────────────────

  /** ISO 4217 currency code this policy applies to */
  @Column({ type: 'varchar', length: 3, default: 'RWF' })
  currency: string;

  /** Minimum credit score (FICO/CRDB equivalent) required — Basel II origination standard */
  @Column({ type: 'int', nullable: true })
  min_credit_score: number;

  /** Maximum debt-to-income ratio allowed (e.g. 0.43 = 43%) — CFPB QM rule */
  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  max_dti_ratio: number;

  /** Minimum borrower business age in months — operational stability requirement */
  @Column({ type: 'int', nullable: true })
  min_business_age_months: number;

  /** KYC level required: 'basic' | 'enhanced' | 'full' — AML/CTF compliance */
  @Column({ type: 'varchar', length: 20, default: 'basic' })
  required_kyc_level: string;

  /** Maximum loan-to-value ratio (e.g. 0.75 = 75%) — collateral adequacy standard */
  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  max_ltv_ratio: number;

  /** Origination / processing fee as % of loan amount — TILA disclosure */
  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  origination_fee_rate: number;

  /** Penalty interest rate applied after due date (annual %, e.g. 0.24 = 24%) */
  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  penalty_rate: number;

  /** Grace period in days before penalty accrual begins */
  @Column({ type: 'int', default: 3 })
  grace_period_days: number;

  /** Early repayment penalty rate (% of outstanding principal) */
  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  early_repayment_penalty_rate: number;

  /** Days past due threshold for delinquency classification (default 30) */
  @Column({ type: 'int', default: 30 })
  delinquency_threshold_days: number;

  /** Days past due threshold for default classification (Basel II: 90 days) */
  @Column({ type: 'int', default: 90 })
  default_threshold_days: number;

  /** Allowed loan purposes (null = all allowed) */
  @Column({ type: 'json', nullable: true })
  allowed_purposes: string[];

  /** Whether policy is currently active */
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne('Lender')
  @JoinColumn({ name: 'lender_id' })
  lender: any;
}
