import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../../entities/user.entity';
import { Tenant } from '../../../entities/tenant.entity';

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export enum NotificationCategory {
  TRIP_STATUS = 'trip_status',
  PAYMENT = 'payment',
  SAFETY = 'safety',
  PERFORMANCE = 'performance',
  MAINTENANCE = 'maintenance',
  SYSTEM = 'system',
  MARKETING = 'marketing',
}

@Entity('notification_preferences')
@Index(['tenantId', 'userId'])
@Index(['userId', 'category'])
@Index(['userId', 'channel'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationCategory,
    default: NotificationCategory.SYSTEM,
  })
  category: NotificationCategory;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.EMAIL,
  })
  channel: NotificationChannel;

  @Column({ type: 'boolean', default: true })
  isEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  emailEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  smsEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  pushEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  inAppEnabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailAddress: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceToken: string;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string;

  @Column({ type: 'varchar', length: 10, default: 'UTC' })
  timezone: string;

  @Column({ type: 'jsonb', nullable: true })
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    timezone: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  frequency: {
    immediate: boolean;
    daily: boolean;
    weekly: boolean;
    digest: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  priority: {
    low: boolean;
    normal: boolean;
    high: boolean;
    urgent: boolean;
    emergency: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}
