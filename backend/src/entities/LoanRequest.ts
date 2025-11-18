import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index
} from 'typeorm';
import { decimalToNumberTransformer } from '../common/transformers/decimal.transformer';

export enum LoanRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISBURSED = 'disbursed',
  REPAID = 'repaid',
  FAILED = 'failed',
  DEFAULTED = 'defaulted',
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

  @Column({ type: 'decimal', precision: 15, scale: 2, transformer: decimalToNumberTransformer })
  requested_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: decimalToNumberTransformer })
  approved_amount: number;

  @Column({
    type: 'enum',
    enum: LoanRequestStatus,
    default: LoanRequestStatus.PENDING,
  })
  status: LoanRequestStatus;

  @Column({ type: 'varchar', length: 255, unique: true })
  idempotency_key: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: decimalToNumberTransformer })
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
}
