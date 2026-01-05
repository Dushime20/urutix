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
import { User } from './user.entity';
import { Load } from './load.entity';
import { Tenant } from './tenant.entity';
import { Trip } from './trip.entity';

export enum CommissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('broker_commissions')
@Index(['brokerId', 'status'])
@Index(['loadId'])
@Index(['tenantId', 'createdAt'])
@Index(['status', 'createdAt'])
export class BrokerCommission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  brokerId: string;

  @Column('uuid')
  loadId: string;

  @Column('uuid', { nullable: true })
  tripId?: string;

  @Column('decimal', { precision: 15, scale: 2 })
  loadAmount: number; // Total load value

  @Column('decimal', { precision: 5, scale: 2 })
  commissionRate: number; // Commission percentage (e.g., 5.00 for 5%)

  @Column('decimal', { precision: 15, scale: 2 })
  commissionAmount: number; // Calculated commission

  @Column({
    type: 'enum',
    enum: CommissionStatus,
    default: CommissionStatus.PENDING,
  })
  status: CommissionStatus;

  @Column({ nullable: true })
  paidAt?: Date;

  @Column({ nullable: true })
  paymentReference?: string;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.brokerCommissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brokerId' })
  broker: User;

  @ManyToOne(() => Load, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loadId' })
  load: Load;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => Trip, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tripId' })
  trip?: Trip;
}

