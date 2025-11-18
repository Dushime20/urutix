import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PAYMENT = 'PAYMENT',
  DISPUTE = 'DISPUTE',
  OTHER = 'OTHER',
}

@Entity('audit_logs')
@Index(['tenantId', 'action', 'createdAt'])
@Index(['userId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'enum', enum: AuditAction, default: AuditAction.OTHER })
  action: AuditAction;

  @Column('text')
  description: string;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('User')
  user: User;
}
