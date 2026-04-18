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
import { Lender } from './lender.entity';

export enum RepaymentFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUALLY = 'semi_annually',
  ANNUALLY = 'annually',
}

export enum PenaltyType {
  FIXED_AMOUNT = 'fixed_amount',
  PERCENTAGE = 'percentage',
  COMPOUND_INTEREST = 'compound_interest',
}

@Entity('lending_policy_repayment')
@Index(['lender_id', 'is_active'])
@Index(['frequency', 'is_active'])
export class LendingPolicyRepayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  lender_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: RepaymentFrequency,
    default: RepaymentFrequency.MONTHLY,
  })
  frequency: RepaymentFrequency;

  @Column({ type: 'int' })
  grace_period_days: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  late_fee_amount: number;

  @Column({
    type: 'enum',
    enum: PenaltyType,
    default: PenaltyType.FIXED_AMOUNT,
  })
  late_fee_type: PenaltyType;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  penalty_rate: number;

  @Column({ type: 'int' })
  max_extensions: number;

  @Column({ type: 'int' })
  default_threshold_days: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  early_payment_discount: number;

  @Column({ type: 'boolean', default: false })
  allow_partial_payments: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  minimum_payment_percentage: number;

  @Column({ type: 'jsonb', nullable: true })
  payment_methods: string[];

  @Column({ type: 'jsonb', nullable: true })
  escalation_rules: {
    days_overdue: number;
    action: string;
    notification_template: string;
  }[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string;

  @ManyToOne(() => Lender, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lender_id' })
  lender: Lender;
}