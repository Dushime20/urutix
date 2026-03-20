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
import { decimalToNumberTransformer } from './../common/transformers/decimal.transformer';

export enum DisbursementStatus {
  INITIATED = 'initiated',
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
  APPROVED = 'approved',
  DISBURSED = 'disbursed',
  REJECTED = 'rejected',
  ON_HOLD = 'on_hold',
}

@Entity('loan_disbursements')
@Index(['loan_request_id', 'status'])
@Index(['disbursement_date', 'priority'])
export class LoanDisbursement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  loan_request_id: string;

  @Column({ type: 'timestamp', nullable: true })
  disbursement_date: Date;

  @Column({ type: 'json' })
  beneficiaries: any[];

  @Column({
    type: 'enum',
    enum: DisbursementStatus,
    default: DisbursementStatus.INITIATED,
  })
  status: DisbursementStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  external_txn_ref: string;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'text', nullable: true })
  failure_reason: string;

  @Column({ type: 'timestamp', nullable: true })
  next_retry_at: Date;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: decimalToNumberTransformer,
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['urgent', 'high', 'medium', 'low'],
    default: 'medium',
  })
  priority: string;

  @Column({ type: 'jsonb', nullable: true })
  documents: Array<{ type: string; status: string }>;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  risk_score: number;

  @Column({ type: 'int', nullable: true })
  credit_score: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    transformer: decimalToNumberTransformer,
  })
  collateral_value: number;

  @Column({
    type: 'enum',
    enum: ['bank_transfer', 'check', 'escrow', 'digital_wallet'],
    default: 'bank_transfer',
  })
  disbursement_method: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  purpose: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  interest_rate: number;

  @Column({ type: 'int', nullable: true })
  term_months: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne('LoanRequest')
  @JoinColumn({ name: 'loan_request_id' })
  loan_request: any;
}
