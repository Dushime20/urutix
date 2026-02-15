import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EmailTemplate } from './email-template.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

@Entity('bulk_email_logs')
export class BulkEmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'uuid', nullable: true, name: 'template_id' })
  templateId: string;

  @ManyToOne(() => EmailTemplate, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: EmailTemplate;

  @Column({ type: 'varchar', length: 500 })
  subject: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'int', default: 0, name: 'recipients_count' })
  recipientsCount: number;

  @Column({ type: 'int', default: 0, name: 'sent_count' })
  sentCount: number;

  @Column({ type: 'int', default: 0, name: 'failed_count' })
  failedCount: number;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, sending, sent, failed, scheduled

  @Column({ type: 'timestamp', nullable: true, name: 'scheduled_at' })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'sent_at' })
  sentAt: Date;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata: any; // Additional metadata like filters, segments, etc.

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
