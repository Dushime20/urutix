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
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

export enum NotificationType {
  LOW_BALANCE = 'LOW_BALANCE',
  SUBSCRIPTION_EXPIRING = 'SUBSCRIPTION_EXPIRING',
  TRIAL_EXPIRING = 'TRIAL_EXPIRING',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CREDITS_EXPIRED = 'CREDITS_EXPIRED',
  USAGE_THRESHOLD = 'USAGE_THRESHOLD',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

@Entity('notification_preferences')
@Index(['tenantId', 'userId'])
@Index(['tenantId', 'notificationType'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
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
    type: 'text',
    array: true,
    name: 'enabled_channels',
    default: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
  })
  enabledChannels: NotificationChannel[];

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  @Column({ name: 'email_address', nullable: true })
  emailAddress?: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional settings like frequency, thresholds, etc.',
  })
  settings?: {
    frequency?: 'IMMEDIATE' | 'HOURLY' | 'DAILY' | 'WEEKLY';
    threshold?: number;
    quietHours?: {
      start: string; // HH:MM format
      end: string;   // HH:MM format
      timezone: string;
    };
    customMessage?: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}