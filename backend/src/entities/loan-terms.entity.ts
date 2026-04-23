import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { decimalToNumberTransformer } from '../common/transformers/decimal.transformer';

/**
 * Immutable snapshot of the loan terms computed at origination.
 * One record per loan request — never updated after creation.
 * Provides a full audit trail: which policy version was used,
 * what inputs were provided, and what values were computed.
 */
@Entity('loan_terms')
@Index(['loan_request_id'], { unique: true })
@Index(['lender_id', 'computed_at'])
export class LoanTerms {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  loan_request_id: string;

  @Column({ type: 'uuid' })
  lender_id: string;

  // ── Computed values ────────────────────────────────────────────────────────

  /**
   * Nominal annual interest rate (%) derived from the lender's active
   * interest-rate policy for the borrower's risk level.
   */
  @Column({
    type: 'decimal',
    precision: 7,
    scale: 4,
    nullable: true,
    transformer: decimalToNumberTransformer,
  })
  nominal_rate: number | null;

  /**
   * Effective Annual Rate (EAR / APR) — nominal_rate adjusted for
   * compounding frequency and any origination fees.
   * Displayed to borrowers per disclosure requirements.
   */
  @Column({
    type: 'decimal',
    precision: 7,
    scale: 4,
    nullable: true,
    transformer: decimalToNumberTransformer,
  })
  effective_annual_rate: number | null;

  /**
   * Composite risk score (0–100). Higher = lower risk.
   * Weighted average across all active risk-assessment rules.
   */
  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: decimalToNumberTransformer,
  })
  risk_score: number | null;

  /** Derived risk tier from risk_score. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  risk_level: string | null;

  /** Borrower credit score used as input. */
  @Column({ type: 'int', nullable: true })
  credit_score_input: number | null;

  // ── Policy snapshot ────────────────────────────────────────────────────────

  /** ID of the interest-rate policy record that governed this loan. */
  @Column({ type: 'uuid', nullable: true })
  interest_rate_policy_id: string | null;

  /**
   * Full snapshot of the interest-rate policy at computation time.
   * Immutable — policy changes after origination do not affect this record.
   */
  @Column({ type: 'jsonb', nullable: true })
  interest_rate_policy_snapshot: Record<string, any> | null;

  /**
   * Per-factor risk scoring detail.
   * Array of { factor, weight, input_value, band, factor_score }.
   */
  @Column({ type: 'jsonb', nullable: true })
  risk_score_breakdown: Array<{
    factor: string;
    weight: number;
    input_value: number | null;
    band: string | null;
    factor_score: number;
  }> | null;

  // ── Rate components ────────────────────────────────────────────────────────

  @Column({
    type: 'decimal',
    precision: 7,
    scale: 4,
    nullable: true,
    transformer: decimalToNumberTransformer,
  })
  base_rate: number | null;

  @Column({
    type: 'decimal',
    precision: 7,
    scale: 4,
    nullable: true,
    transformer: decimalToNumberTransformer,
  })
  rate_adjustment: number | null;

  /** Origination / processing fee as a percentage of loan amount. */
  @Column({
    type: 'decimal',
    precision: 7,
    scale: 4,
    nullable: true,
    transformer: decimalToNumberTransformer,
  })
  origination_fee_rate: number | null;

  // ── Metadata ───────────────────────────────────────────────────────────────

  /** ISO 4217 currency code. */
  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  /** Computation engine version — increment when scoring logic changes. */
  @Column({ type: 'varchar', length: 20, default: '1.0.0' })
  engine_version: string;

  /** Timestamp of computation — immutable. */
  @CreateDateColumn()
  computed_at: Date;

  @ManyToOne('LoanRequest', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loan_request_id' })
  loan_request: any;
}
