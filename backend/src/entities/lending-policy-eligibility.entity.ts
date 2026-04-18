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

export enum EligibilityCategory {
  CREDIT_SCORE = 'credit_score',
  BUSINESS_AGE = 'business_age',
  REVENUE = 'revenue',
  COLLATERAL = 'collateral',
  GUARANTOR = 'guarantor',
  DOCUMENTS = 'documents',
  INDUSTRY = 'industry',
  LOCATION = 'location',
}

export enum ComparisonOperator {
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  EQUAL_TO = 'equal_to',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  BETWEEN = 'between',
  IN = 'in',
  NOT_IN = 'not_in',
}

@Entity('lending_policy_eligibility_criteria')
@Index(['lender_id', 'is_active'])
@Index(['category', 'is_active'])
export class LendingPolicyEligibility {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  lender_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: EligibilityCategory,
  })
  category: EligibilityCategory;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  requirement: string;

  @Column({
    type: 'enum',
    enum: ComparisonOperator,
    nullable: true,
  })
  operator: ComparisonOperator;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  minimum_value: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  maximum_value: number;

  @Column({ type: 'jsonb', nullable: true })
  allowed_values: string[];

  @Column({ type: 'jsonb', nullable: true })
  excluded_values: string[];

  @Column({ type: 'boolean', default: true })
  is_required: boolean;

  @Column({ type: 'int', default: 100 })
  weight: number;

  @Column({ type: 'text', nullable: true })
  failure_message: string;

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