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
import { UserSubscription } from '../../../entities/user-subscription.entity';
import { EnforcementAction } from './enforcement-action.entity';

/**
 * Appeal Entity
 * 
 * Manages user appeals against enforcement actions.
 * Provides a structured process for users to contest decisions
 * and for admins to review and respond.
 * 
 * Key Features:
 * - Appeal workflow management
 * - Message threading
 * - Status tracking
 * - Outcome recording
 */
@Entity('appeals')
@Index(['userId'])
@Index(['status'])
@Index(['enforcementActionId'])
@Index(['createdAt'])
export class Appeal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Reference
  @Column({ name: 'enforcement_action_id', type: 'uuid' })
  enforcementActionId: string;

  @ManyToOne(() => EnforcementAction)
  @JoinColumn({ name: 'enforcement_action_id' })
  enforcementAction: EnforcementAction;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId: string;

  @ManyToOne(() => UserSubscription, { nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription: UserSubscription;

  // Appeal details
  @Column({ name: 'appeal_reason', type: 'text' })
  appealReason: string;

  @Column({ name: 'user_statement', type: 'text', nullable: true })
  userStatement: string;

  @Column({ name: 'supporting_evidence', type: 'jsonb', nullable: true })
  supportingEvidence: Record<string, any>;

  // Status
  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
  })
  status: 'pending' | 'under_review' | 'approved' | 'denied' | 'withdrawn';

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

  @Column({ name: 'admin_response', type: 'text', nullable: true })
  adminResponse: string;

  // Outcome
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  outcome: 'enforcement_lifted' | 'enforcement_modified' | 'enforcement_upheld' | 'no_action';

  @Column({ name: 'outcome_details', type: 'jsonb', nullable: true })
  outcomeDetails: Record<string, any>;

  // Communication
  @Column({ type: 'jsonb', default: '[]' })
  messages: Array<{
    id: string;
    sender: 'user' | 'admin';
    senderId: string;
    message: string;
    timestamp: string;
  }>;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;
}
