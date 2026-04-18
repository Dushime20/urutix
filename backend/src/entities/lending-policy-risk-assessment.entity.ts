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

export enum RiskFactor {
  CREDIT_SCORE = 'credit_score',
  PAYMENT_HISTORY = 'payment_history',
  DEBT_TO_INCOME = 'debt_to_income',
  BUSINESS_AGE = 'business_age',
  INDUSTRY_RISK = 'industry_risk',
  COLLATERAL_VALUE = 'collateral_value',
  CASH_FLOW = 'cash_flow',
  MARKET_CONDITIONS = 'market_conditions',
}

@Entity('lending_policy_risk_assessment')
@Index(['lender_id', 'is_active'])
@Index(['factor', 'is_active'])
export class LendingPolicyRiskAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  lender_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: RiskFactor,
  })
  factor: RiskFactor;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  weight: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  scoring_criteria: {
    excellent: { min: number; max: number; score: number };
    good: { min: number; max: number; score: number };
    fair: { min: number; max: number; score: number };
    poor: { min: number; max: number; score: number };
  };

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  threshold_score: number;

  @Column({ type: 'jsonb', nullable: true })
  adjustment_rules: {
    condition: string;
    adjustment: number;
    type: 'add' | 'multiply' | 'subtract';
  }[];

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