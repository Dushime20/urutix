import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../../entities/user.entity';
import { Tenant } from '../../../entities/tenant.entity';
import { EnforcementAction } from './enforcement-action.entity';

/**
 * RiskFlag Entity
 * 
 * Tracks automated and manual risk detection flags for users.
 * Used for identifying suspicious activity and potential abuse.
 * 
 * Key Features:
 * - Multiple flag types
 * - Risk scoring
 * - Detection method tracking
 * - Review workflow
 */
@Entity('risk_flags')
@Index(['userId'])
@Index(['status'])
@Index(['severity'])
@Index(['createdAt'])
export class RiskFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Target
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Flag details
  @Column({
    name: 'flag_type',
    type: 'varchar',
    length: 50,
  })
  flagType: 'suspicious_activity' | 'rapid_posting' | 'price_anomaly' | 'payment_pattern' | 'duplicate_account' | 'bot_behavior' | 'other';

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  severity: 'low' | 'medium' | 'high' | 'critical';

  @Column({ name: 'risk_score', type: 'integer', nullable: true })
  riskScore: number;

  // Detection
  @Column({ name: 'detected_by', type: 'varchar', length: 50, default: 'system' })
  detectedBy: string;

  @Column({ name: 'detection_method', type: 'varchar', length: 100, nullable: true })
  detectionMethod: string;

  // Details
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  evidence: Record<string, any>;

  @Column({ name: 'related_entities', type: 'jsonb', nullable: true })
  relatedEntities: Record<string, any>;

  // Status
  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
  })
  status: 'pending' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved';

  // Review
  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes: string;

  // Action taken
  @Column({ name: 'enforcement_action_id', type: 'uuid', nullable: true })
  enforcementActionId: string;

  @ManyToOne(() => EnforcementAction, { nullable: true })
  @JoinColumn({ name: 'enforcement_action_id' })
  enforcementAction: EnforcementAction;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;
}
