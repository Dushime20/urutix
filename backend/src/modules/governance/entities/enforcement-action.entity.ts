import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../../entities/user.entity';
import { UserSubscription } from '../../../entities/user-subscription.entity';
import { Appeal } from './appeal.entity';

/**
 * EnforcementAction Entity
 * 
 * Immutable audit log of all governance enforcement actions.
 * Records who did what, when, why, and the before/after state.
 * 
 * Key Features:
 * - Complete audit trail
 * - Immutable records (soft delete only)
 * - Before/after state tracking
 * - Evidence and notes storage
 */
@Entity('enforcement_actions')
@Index(['adminId'])
@Index(['targetUserId'])
@Index(['actionType'])
@Index(['createdAt'])
@Index(['violationCategory'])
export class EnforcementAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Who, What, When
  @Column({ name: 'admin_id', type: 'uuid' })
  adminId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @Column({ name: 'target_user_id', type: 'uuid' })
  targetUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId: string;

  @ManyToOne(() => UserSubscription, { nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription: UserSubscription;

  @Column({
    name: 'action_type',
    type: 'varchar',
    length: 50,
  })
  actionType: 'suspend' | 'unsuspend' | 'restrict' | 'unrestrict' | 'terminate' | 'reinstate' | 'flag' | 'unflag';

  // Details
  @Column({ type: 'text' })
  reason: string;

  @Column({
    name: 'violation_category',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  violationCategory: 'fraud' | 'platform_abuse' | 'spam' | 'illegal_listing' | 'policy_violation' | 'payment_dispute' | 'system_exploitation' | 'other';

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  severity: 'low' | 'medium' | 'high' | 'critical';

  // Before/After state
  @Column({ name: 'previous_state', type: 'jsonb', nullable: true })
  previousState: Record<string, any>;

  @Column({ name: 'new_state', type: 'jsonb', nullable: true })
  newState: Record<string, any>;

  // Restrictions applied (if action_type = 'restrict')
  @Column({ name: 'restrictions_applied', type: 'jsonb', nullable: true })
  restrictionsApplied: Record<string, boolean>;

  // Duration (for temporary actions)
  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  // Evidence and notes
  @Column({ type: 'jsonb', nullable: true })
  evidence: Record<string, any>;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string;

  @Column({ name: 'internal_notes', type: 'text', nullable: true })
  internalNotes: string;

  // Appeal tracking
  @Column({ name: 'is_appealed', type: 'boolean', default: false })
  isAppealed: boolean;

  @Column({ name: 'appeal_id', type: 'uuid', nullable: true })
  appealId: string;

  @ManyToOne(() => Appeal, { nullable: true })
  @JoinColumn({ name: 'appeal_id' })
  appeal: Appeal;

  // Metadata
  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Immutability (soft delete only)
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deletedByUser: User;
}
