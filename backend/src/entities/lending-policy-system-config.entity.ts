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

export enum ApprovalMode {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  HYBRID = 'hybrid',
}

export enum ComplianceLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  STRICT = 'strict',
  REGULATORY = 'regulatory',
}

@Entity('lending_policy_system_config')
@Index(['lender_id'], { unique: true })
export class LendingPolicySystemConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  lender_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  // Approval Settings
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  auto_approval_limit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  manual_review_threshold: number;

  @Column({
    type: 'enum',
    enum: ApprovalMode,
    default: ApprovalMode.HYBRID,
  })
  approval_mode: ApprovalMode;

  // Loan Limits
  @Column({ type: 'int', default: 5 })
  max_concurrent_loans: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_exposure_limit: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 80.0 })
  max_portfolio_utilization: number;

  // Risk Management
  @Column({ type: 'int', default: 30 })
  cooldown_period_days: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15.0 })
  default_interest_rate: number;

  @Column({ type: 'int', default: 30 })
  default_repayment_term_days: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 70.0 })
  default_advance_percentage: number;

  // Compliance Settings
  @Column({
    type: 'enum',
    enum: ComplianceLevel,
    default: ComplianceLevel.STANDARD,
  })
  compliance_level: ComplianceLevel;

  @Column({ type: 'boolean', default: true })
  audit_trail_enabled: boolean;

  @Column({ type: 'boolean', default: true })
  kyc_verification_required: boolean;

  @Column({ type: 'boolean', default: false })
  aml_screening_enabled: boolean;

  // Notification Settings
  @Column({ type: 'jsonb', nullable: true })
  notification_settings: {
    email_notifications: boolean;
    sms_notifications: boolean;
    webhook_notifications: boolean;
    notification_templates: {
      loan_approved: string;
      loan_rejected: string;
      payment_due: string;
      payment_overdue: string;
    };
  };

  // Business Hours
  @Column({ type: 'jsonb', nullable: true })
  business_hours: {
    timezone: string;
    working_days: string[];
    start_time: string;
    end_time: string;
    holiday_calendar: string[];
  };

  // Integration Settings
  @Column({ type: 'jsonb', nullable: true })
  integration_settings: {
    credit_bureau_enabled: boolean;
    payment_gateway_config: any;
    external_scoring_enabled: boolean;
    webhook_endpoints: string[];
  };

  // Risk Thresholds
  @Column({ type: 'jsonb', nullable: true })
  risk_thresholds: {
    minimum_credit_score: number;
    maximum_debt_to_income: number;
    minimum_business_age_months: number;
    maximum_default_rate: number;
  };

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

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