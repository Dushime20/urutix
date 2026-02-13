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
import { Tenant } from '../../../entities/tenant.entity';
import { EnforcementAction } from './enforcement-action.entity';

/**
 * UserBlacklist Entity
 * 
 * Manages permanent or temporary bans preventing users from
 * creating new accounts or accessing the platform.
 * 
 * Key Features:
 * - Multiple identifier types (email, phone, company, etc.)
 * - Domain-level blocking
 * - Expiration support
 * - Tenant isolation
 */
@Entity('user_blacklist')
@Index(['email'], { where: 'is_active = true' })
@Index(['emailDomain'], { where: 'is_active = true' })
@Index(['phoneNumber'], { where: 'is_active = true' })
@Index(['tenantId'])
export class UserBlacklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Identifiers to block
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ name: 'email_domain', type: 'varchar', length: 255, nullable: true })
  emailDomain: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 50, nullable: true })
  phoneNumber: string;

  @Column({ name: 'company_name', type: 'varchar', length: 255, nullable: true })
  companyName: string;

  @Column({ name: 'tax_id', type: 'varchar', length: 100, nullable: true })
  taxId: string;

  @Column({ name: 'device_fingerprint', type: 'text', nullable: true })
  deviceFingerprint: string;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string;

  // Reason
  @Column({ type: 'text' })
  reason: string;

  @Column({
    name: 'violation_category',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  violationCategory: string;

  // Who added
  @Column({ name: 'added_by', type: 'uuid' })
  addedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'added_by' })
  addedByUser: User;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Related enforcement
  @Column({ name: 'related_user_id', type: 'uuid', nullable: true })
  relatedUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'related_user_id' })
  relatedUser: User;

  @Column({ name: 'related_enforcement_action_id', type: 'uuid', nullable: true })
  relatedEnforcementActionId: string;

  @ManyToOne(() => EnforcementAction, { nullable: true })
  @JoinColumn({ name: 'related_enforcement_action_id' })
  relatedEnforcementAction: EnforcementAction;

  // Status
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'deactivated_at', type: 'timestamp', nullable: true })
  deactivatedAt: Date;

  @Column({ name: 'deactivated_by', type: 'uuid', nullable: true })
  deactivatedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'deactivated_by' })
  deactivatedByUser: User;
}
