import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('revenue_records')
@Index(['tenantId', 'settledAt'])
@Index(['tripId'], { unique: true })
export class RevenueRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tripId: string;

  @Column('uuid')
  loadId: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid', { nullable: true })
  brokerId?: string;

  @Column('decimal', { precision: 15, scale: 2 })
  grossAmount: number;

  @Column('decimal', { precision: 5, scale: 4, default: 0.05 })
  platformFeeRate: number;

  @Column('decimal', { precision: 15, scale: 2 })
  platformFeeAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  brokerCommissionAmount: number;

  @Column('decimal', { precision: 15, scale: 2 })
  netPayoutAmount: number;

  @Column({ length: 10, default: 'KES' })
  currency: string;

  @Column({ default: false })
  isSettled: boolean;

  @CreateDateColumn()
  settledAt: Date;
}
