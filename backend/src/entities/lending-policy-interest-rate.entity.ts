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

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('lending_policy_interest_rates')
@Index(['lender_id', 'is_active'])
@Index(['risk_level', 'is_active'])
export class LendingPolicyInterestRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  lender_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.MEDIUM,
  })
  risk_level: RiskLevel;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  base_rate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  min_rate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  max_rate: number;

  @Column({ type: 'jsonb', nullable: true })
  adjustment_factors: {
    credit_score: number;
    loan_history: number;
    collateral: number;
    business_type: number;
  };

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  conditions: string[];

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