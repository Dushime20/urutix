import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../entities/user.entity';
import { Tenant } from '../../../entities/tenant.entity';

export enum PaymentMethod {
  CHECK = 'check',
  ACH = 'ach',
  CREDIT_CARD = 'credit_card',
  WIRE = 'wire',
  CASH = 'cash',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('financial_payments')
export class FinancialPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  invoiceId: string;

  @Column()
  invoiceNumber: string;

  @Column()
  customerId: string;

  @Column()
  customerName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  paymentDate: Date;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  referenceNumber?: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  processingFee?: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
