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

export enum TaxRecordType {
  IFTA = 'ifta',
  FUEL_TAX = 'fuel_tax',
  INCOME_TAX = 'income_tax',
  SALES_TAX = 'sales_tax',
}

export enum TaxRecordStatus {
  PENDING = 'pending',
  FILED = 'filed',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Entity('tax_records')
export class TaxRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TaxRecordType,
  })
  type: TaxRecordType;

  @Column()
  period: string;

  @Column()
  filingDate: Date;

  @Column()
  dueDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TaxRecordStatus,
    default: TaxRecordStatus.PENDING,
  })
  status: TaxRecordStatus;

  @Column()
  jurisdiction: string;

  @Column({ nullable: true })
  referenceNumber?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

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
