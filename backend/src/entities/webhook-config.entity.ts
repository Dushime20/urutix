import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

@Entity('webhook_configs')
@Index(['tenantId', 'isActive'])
export class WebhookConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  createdBy: string;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column('simple-array')
  events: string[]; // e.g. ['trip.completed', 'load.assigned']

  @Column({ length: 64, nullable: true })
  secret?: string; // HMAC signing secret

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastDeliveredAt?: Date;

  @Column({ default: 0 })
  failureCount: number;

  @Column('jsonb', { default: [] })
  deliveryLogs: Array<{
    deliveredAt: string;
    event: string;
    statusCode: number;
    success: boolean;
    responseMs: number;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
