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

export enum BusinessType {
  INDIVIDUAL = 'individual',
  SME = 'sme',
  CORPORATION = 'corporation',
  COOPERATIVE = 'cooperative',
}

@Entity('lending_policy_loan_limits')
@Index(['lender_id', 'is_active'])
@Index(['business_type', 'is_active'])
export class LendingPolicyLoanLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  lender_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: BusinessType,
    default: BusinessType.INDIVIDUAL,
  })
  business_type: BusinessType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  min_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  max_amount: number;

  @Column({ type: 'int' })
  credit_score_requirement: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  collateral_requirement: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  max_utilization: number;

  @Column({ type: 'int', nullable: true })
  max_concurrent_loans: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  annual_income_requirement: number;

  @Column({ type: 'int', nullable: true })
  business_age_requirement: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  additional_requirements: string[];

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