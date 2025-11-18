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

export enum ExpenseType {
  FUEL = 'fuel',
  MAINTENANCE = 'maintenance',
  TOLL = 'toll',
  DRIVER = 'driver',
  INSURANCE = 'insurance',
  TAX = 'tax',
  OTHER = 'other',
}

export enum ExpenseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ExpenseType,
  })
  type: ExpenseType;

  @Column()
  category: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  date: Date;

  @Column()
  description: string;

  @Column({ nullable: true })
  truckId?: string;

  @Column({ nullable: true })
  driverId?: string;

  @Column({ nullable: true })
  tripId?: string;

  @Column({ nullable: true })
  receipt?: string;

  @Column({
    type: 'enum',
    enum: ExpenseStatus,
    default: ExpenseStatus.PENDING,
  })
  status: ExpenseStatus;

  @Column({ nullable: true })
  approvedBy?: string;

  @Column({ nullable: true })
  approvedDate?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ default: true })
  taxDeductible: boolean;

  @Column({ nullable: true })
  allocationCustomerId?: string;

  @Column({ nullable: true })
  allocationTripId?: string;

  @Column('decimal', { precision: 5, scale: 2, default: 100 })
  allocationPercentage: number;

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
