import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { decimalToNumberTransformer } from './../common/transformers/decimal.transformer';

export enum LoanRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISBURSED = 'disbursed',
  REPAID = 'repaid',
  FAILED = 'failed',
  DEFAULTED = 'defaulted',
}

/**
 * Financing direction on the Logistics Liquidity Exchange.
 * Both products share the same loan_requests infrastructure.
 */
export enum FinancingType {
  /** Cargo owner borrows so lender can pay the truck owner for transport */
  CARGO_OWNER = 'CARGO_OWNER',
  /** Truck owner borrows working capital against an accepted transport contract */
  TRUCK_OWNER_TRIP = 'TRUCK_OWNER_TRIP',
}

@Entity('loan_requests')
@Index(['tenant_id', 'status'])
@Index(['lender_id', 'created_at'])
@Index(['idempotency_key'], { unique: true })
export class LoanRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  cargo_id: string;

  @Column({ type: 'uuid' })
  trip_id: string;

  @Column({ type: 'uuid', nullable: true })
  lender_id: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: decimalToNumberTransformer,
  })
  requested_amount: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: decimalToNumberTransformer,
  })
  approved_amount: number;

  @Column({
    type: 'enum',
    enum: LoanRequestStatus,
    default: LoanRequestStatus.PENDING,
  })
  status: LoanRequestStatus;

  @Column({ type: 'varchar', length: 255, unique: true })
  idempotency_key: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: decimalToNumberTransformer,
  })
  interest_amount: number;

  @Column({ type: 'date', nullable: true })
  due_date: Date;

  @Column({ type: 'uuid' })
  created_by: string;

  @Column({ type: 'uuid', nullable: true })
  borrower_id: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  external_loan_ref: string;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column({ type: 'json', nullable: true })
  requested_split: any[];

  @Column({ type: 'json', nullable: true })
  metadata: any;

  // ── International standard fields ─────────────────────────────────────────

  /** Human-readable loan reference number (e.g. LN-2024-000123) */
  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  loan_number: string;

  /** Loan purpose — IFRS 9 / Basel classification */
  @Column({ type: 'varchar', length: 100, nullable: true })
  purpose: string;

  /**
   * Financing direction: cargo-owner transport payment vs truck-owner trip working capital.
   * Defaults to CARGO_OWNER for backward compatibility with existing loans.
   */
  @Column({
    type: 'varchar',
    length: 32,
    default: FinancingType.CARGO_OWNER,
  })
  financing_type: FinancingType;

  /** KYC verification confirmed before origination (AML/CTF compliance) */
  @Column({ type: 'boolean', default: false })
  kyc_verified: boolean;

  /** ISO 4217 currency code */
  @Column({ type: 'varchar', length: 3, default: 'RWF' })
  currency: string;

  /** Origination fee charged (% of approved_amount) — TILA disclosure */
  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  origination_fee_rate: number;

  /** Origination fee absolute amount */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  origination_fee_amount: number;

  /** Total cost of credit = interest_amount + origination_fee_amount */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  total_cost_of_credit: number;

  /** Annual Percentage Rate disclosed to borrower (TILA/CCD) */
  @Column({ type: 'decimal', precision: 7, scale: 4, nullable: true })
  apr: number;

  /** Collateral description */
  @Column({ type: 'varchar', length: 500, nullable: true })
  collateral_description: string;

  /** Collateral estimated value */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  collateral_value: number;

  /** Loan-to-Value ratio at origination */
  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  ltv_ratio: number;

  /** Grace period end date — late fees only accrue after this */
  @Column({ type: 'date', nullable: true })
  grace_period_end: Date;

  /** Days past due — updated by scheduler, triggers delinquency/default logic */
  @Column({ type: 'int', default: 0 })
  days_past_due: number;

  /** IFRS 9 staging: 1 = performing, 2 = underperforming, 3 = non-performing */
  @Column({ type: 'int', default: 1 })
  ifrs9_stage: number;

  /** Composite risk score at origination (0-100, higher = lower risk) */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  risk_score: number;

  /** Risk tier at origination */
  @Column({ type: 'varchar', length: 20, nullable: true })
  risk_tier: string;

  /** Probability of Default at origination */
  @Column({ type: 'decimal', precision: 6, scale: 4, nullable: true })
  pd_at_origination: number;

  /** Loss Given Default at origination */
  @Column({ type: 'decimal', precision: 6, scale: 4, nullable: true })
  lgd_at_origination: number;

  /** Expected Loss = PD × LGD × EAD */
  @Column({ type: 'decimal', precision: 6, scale: 4, nullable: true })
  expected_loss: number;

  /** When the lender formally offered terms to the borrower (TILA disclosure sent) */
  @Column({ type: 'timestamp', nullable: true })
  terms_offered_at: Date | null;

  /** When the borrower accepted the offered terms — required before disbursement */
  @Column({ type: 'timestamp', nullable: true })
  borrower_accepted_at: Date | null;

  /** When the borrower declined the offered terms */
  @Column({ type: 'timestamp', nullable: true })
  terms_declined_at: Date | null;

  /** Borrower's reason for declining offered terms */
  @Column({ type: 'text', nullable: true })
  terms_decline_reason: string | null;

  /** Agreed repayment term in months at origination */
  @Column({ type: 'int', nullable: true })
  loan_term_months: number | null;

  /** Date loan was fully repaid */
  @Column({ type: 'timestamp', nullable: true })
  repaid_at: Date;

  /** Date loan was marked defaulted */
  @Column({ type: 'timestamp', nullable: true })
  defaulted_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne('Lender')
  @JoinColumn({ name: 'lender_id' })
  lender: any;

  @OneToMany('LoanDisbursement', 'loan_request')
  disbursements: any[];

  @OneToMany('LoanRepayment', 'loan_request')
  repayments: any[];

  @ManyToOne('Borrower')
  @JoinColumn({ name: 'borrower_id' })
  borrower: any;

  @OneToMany('LoanTerms', 'loan_request')
  loanTerms: any[];
}
