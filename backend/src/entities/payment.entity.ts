import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Trip } from './trip.entity';

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
  CASH = 'cash',
  CHECK = 'check',
  WIRE_TRANSFER = 'wire_transfer',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  ESCROW = 'escrow',
}

export enum PaymentType {
  TRIP_PAYMENT = 'trip_payment',
  SUBSCRIPTION = 'subscription',
  SERVICE_FEE = 'service_fee',
  DEPOSIT = 'deposit',
  REFUND = 'refund',
  WITHDRAWAL = 'withdrawal',
  ADVANCE = 'advance',
  FINAL = 'final',
}

@Entity('payments')
@Index(['tenantId', 'tripId', 'status'])
@Index(['paymentMethod', 'paymentType'])
@Index(['createdAt', 'processedAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, unique: false })
  idempotencyKey?: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid', { nullable: true })
  tripId?: string;

  @Column('uuid')
  payerId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3 })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentType,
  })
  paymentType: PaymentType;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  referenceNumber?: string;

  @Column({ nullable: true })
  transactionId?: string;

  @Column({ nullable: true })
  gatewayResponse?: string;

  @Column({ nullable: true })
  failureReason?: string;

  @Column({ nullable: true })
  billingAddress?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  dueDate?: Date;

  @Column({ nullable: true })
  processedAt?: Date;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  processingFee?: number;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @ManyToOne('Trip', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;
}
