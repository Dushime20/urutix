import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CapacityPlace } from './capacity-offer.entity';

export enum CapacityBookingStatus {
  REQUESTED = 'REQUESTED',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
}

export enum CapacityCommissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('capacity_bookings')
@Index(['tenantId', 'cargoOwnerId', 'createdAt'])
@Index(['offerId', 'status'])
@Index(['tenantId', 'status'])
export class CapacityBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  offerId: string;

  @Column('uuid')
  cargoOwnerId: string;

  @Column('uuid', { nullable: true })
  loadId?: string | null;

  @Column('uuid', { nullable: true })
  tripId?: string | null;

  @Column('decimal', { precision: 12, scale: 2 })
  weightKg: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  volumeM3: number;

  @Column({ length: 32, default: 'GENERAL' })
  cargoType: string;

  @Column({ length: 200, nullable: true })
  title?: string | null;

  @Column('decimal', { precision: 15, scale: 2 })
  freightAmount: number;

  @Column('decimal', { precision: 5, scale: 2 })
  commissionRate: number;

  @Column('decimal', { precision: 15, scale: 2 })
  commissionAmount: number;

  @Column({ length: 3, default: 'USD' })
  currencyCode: string;

  @Column({ length: 16, default: CapacityCommissionStatus.PENDING })
  commissionStatus: CapacityCommissionStatus;

  @Column('uuid', { nullable: true })
  freightPaymentId?: string | null;

  @Column('uuid', { nullable: true })
  commissionPaymentId?: string | null;

  @Column({ length: 24, default: CapacityBookingStatus.REQUESTED })
  status: CapacityBookingStatus;

  @Column('text', { nullable: true })
  rejectionReason?: string | null;

  @Column('jsonb', { nullable: true })
  origin?: CapacityPlace | null;

  @Column('jsonb', { nullable: true })
  destination?: CapacityPlace | null;

  @Column({ type: 'timestamptz', nullable: true })
  pickupDate?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveryDate?: Date | null;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
