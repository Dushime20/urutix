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
import { Tenant } from './tenant.entity';
import { Payment } from './payment.entity';
import { Trip } from './trip.entity';

export enum ReceiptStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('receipts')
@Index(['tenantId', 'lenderId', 'status'])
@Index(['paymentId', 'tripId'])
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  receiptNumber: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  lenderId: string;

  @Column('uuid')
  paymentId: string;

  @Column('uuid')
  tripId: string;

  @Column('uuid')
  cargoOwnerId: string;

  @Column()
  cargoOwnerName: string;

  @Column({ nullable: true })
  cargoOwnerEmail?: string;

  @Column({ nullable: true })
  cargoOwnerPhone?: string;

  @Column()
  cargoName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ReceiptStatus,
    default: ReceiptStatus.ISSUED,
  })
  status: ReceiptStatus;

  @Column({ nullable: true })
  paymentMethod?: string;

  @Column({ nullable: true })
  transactionId?: string;

  @Column({ nullable: true })
  referenceNumber?: string;

  @Column({ type: 'date' })
  paymentDate: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'lenderId' })
  lender: User;

  @ManyToOne(() => Payment, { nullable: false })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @ManyToOne(() => Trip, { nullable: false })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

