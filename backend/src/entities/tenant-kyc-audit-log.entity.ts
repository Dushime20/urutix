import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant, KycStatus } from './tenant.entity';
import { User } from './user.entity';

export enum KycAuditAction {
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  INCOMPLETE = 'INCOMPLETE',
  UNDER_REVIEW = 'UNDER_REVIEW',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_VERIFIED = 'DOCUMENT_VERIFIED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  NOTES_UPDATED = 'NOTES_UPDATED',
}

@Entity('tenant_kyc_audit_log')
@Index(['tenantId'])
@Index(['createdAt'])
@Index(['action'])
export class TenantKycAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column({
    type: 'enum',
    enum: KycAuditAction,
  })
  action: KycAuditAction;

  @Column({
    type: 'enum',
    enum: KycStatus,
    nullable: true,
  })
  oldStatus?: KycStatus;

  @Column({
    type: 'enum',
    enum: KycStatus,
    nullable: true,
  })
  newStatus?: KycStatus;

  @Column({ nullable: true })
  performedBy?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performedBy' })
  performer?: User;
}