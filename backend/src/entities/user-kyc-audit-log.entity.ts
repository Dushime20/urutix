import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { UserProfile, KycStatus } from './user-profile.entity';

export enum UserKycAuditAction {
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_VERIFIED = 'DOCUMENT_VERIFIED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  IDENTITY_VERIFIED = 'IDENTITY_VERIFIED',
  ADDRESS_VERIFIED = 'ADDRESS_VERIFIED',
  FINANCIAL_VERIFIED = 'FINANCIAL_VERIFIED',
  BUSINESS_VERIFIED = 'BUSINESS_VERIFIED',
  BACKGROUND_CHECK_COMPLETED = 'BACKGROUND_CHECK_COMPLETED',
  COMPLIANCE_SCORE_UPDATED = 'COMPLIANCE_SCORE_UPDATED',
  NOTES_UPDATED = 'NOTES_UPDATED',
}

@Entity('user_kyc_audit_log')
@Index(['userId'])
@Index(['userProfileId'])
@Index(['createdAt'])
@Index(['action'])
export class UserKycAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column('uuid', { name: 'user_profile_id' })
  userProfileId: string;

  @Column({
    type: 'enum',
    enum: UserKycAuditAction,
  })
  action: UserKycAuditAction;

  @Column({ nullable: true, name: 'old_status' })
  oldStatus?: string;

  @Column({ nullable: true, name: 'new_status' })
  newStatus?: string;

  @Column({ nullable: true, name: 'performed_by' })
  performedBy?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => UserProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_profile_id' })
  userProfile: UserProfile;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performed_by' })
  performer?: User;
}