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
import { Tenant } from '../../../entities/tenant.entity';

export enum TemplateType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export enum TemplateCategory {
  TRIP_STATUS = 'trip_status',
  PAYMENT = 'payment',
  SAFETY = 'safety',
  PERFORMANCE = 'performance',
  MAINTENANCE = 'maintenance',
  SYSTEM = 'system',
  MARKETING = 'marketing',
}

@Entity('notification_templates')
@Index(['tenantId', 'category'])
@Index(['tenantId', 'type'])
@Index(['tenantId', 'language'])
@Index(['isActive', 'category'])
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({
    type: 'enum',
    enum: TemplateType,
    default: TemplateType.EMAIL,
  })
  type: TemplateType;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
    default: TemplateCategory.SYSTEM,
  })
  category: TemplateCategory;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  htmlContent: string;

  @Column({ type: 'text', nullable: true })
  plainTextContent: string;

  @Column({ type: 'jsonb', nullable: true })
  variables: string[];

  @Column({ type: 'jsonb', nullable: true })
  defaultValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  branding: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    footerText?: string;
    headerText?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'int', default: 0 })
  version: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}
