import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Tenant } from './tenant.entity';

export enum SecurityEventType {
  FAILED_LOGIN = 'failed_login',
  PERMISSION_ESCALATION = 'permission_escalation',
  UNUSUAL_ACCESS = 'unusual_access',
  SESSION_HIJACK = 'session_hijack',
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('security_events')
@Index(['severity'])
@Index(['createdAt'])
@Index(['userId'])
@Index(['tenantId'])
@Index(['eventType'])
@Index(['severity', 'createdAt'])
export class SecurityEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'event_type',
  })
  eventType: SecurityEventType;

  @Column({
    type: 'varchar',
    length: 20,
  })
  severity: SecuritySeverity;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Tenant, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;
}
