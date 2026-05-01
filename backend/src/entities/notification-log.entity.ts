import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';
import { NotificationType, NotificationChannel } from './notification-preference.entity';

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
}

@Entity('notification_logs')
@Index(['tenantId', 'sentAt'])
@Index(['status', 'sentAt'])
@Index(['notificationType', 'sentAt'])
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId?: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    name: 'notification_type',
  })
  notificationType: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    name: 'channel',
  })
  channel: NotificationChannel;

  @Column({ name: 'recipient_address' })
  recipientAddress: string; // Email, phone number, or device token

  @Column({ name: 'subject', nullable: true })
  subject?: string;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ name: 'priority', default: 'MEDIUM' })
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional data like template variables, tracking info, etc.',
  })
  metadata?: {
    templateId?: string;
    templateVariables?: Record<string, any>;
    trackingId?: string;
    retryCount?: number;
    errorMessage?: string;
    deliveryAttempts?: Array<{
      timestamp: string;
      status: string;
      response?: string;
    }>;
  };

  @Column({ name: 'sent_at', nullable: true })
  sentAt?: Date;

  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'opened_at', nullable: true })
  openedAt?: Date;

  @Column({ name: 'clicked_at', nullable: true })
  clickedAt?: Date;

  @Column({ name: 'failed_at', nullable: true })
  failedAt?: Date;

  @Column({ name: 'error_message', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}