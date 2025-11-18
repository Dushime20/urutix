import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../entities/user.entity';
import { Tenant } from '../../../entities/tenant.entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum InvoiceItemType {
  FREIGHT = 'freight',
  FUEL_SURCHARGE = 'fuel_surcharge',
  TOLL = 'toll',
  DETENTION = 'detention',
  LUMPER = 'lumper',
  ACCESSORIAL = 'accessorial',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column()
  customerId: string;

  @Column()
  customerName: string;

  @Column({ nullable: true })
  tripId?: string;

  @Column({ nullable: true })
  truckId?: string;

  @Column({ nullable: true })
  driverId?: string;

  @Column()
  issueDate: Date;

  @Column()
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  taxAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ default: 'Net 30' })
  paymentTerms: string;

  @Column({ nullable: true })
  paymentMethod?: string;

  @Column({ nullable: true })
  paidDate?: Date;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  lateFees?: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: InvoiceItemType,
  })
  type: InvoiceItemType;

  @Column({ nullable: true })
  tripId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
