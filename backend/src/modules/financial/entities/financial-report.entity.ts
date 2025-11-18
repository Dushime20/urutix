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

export enum FinancialReportType {
  PL_STATEMENT = 'pl_statement',
  CASH_FLOW = 'cash_flow',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
  PROFITABILITY = 'profitability',
}

export enum FinancialReportPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity('financial_reports')
export class FinancialReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: FinancialReportType,
  })
  type: FinancialReportType;

  @Column({
    type: 'enum',
    enum: FinancialReportPeriod,
  })
  period: FinancialReportPeriod;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column('json')
  data: {
    revenue: {
      total: number;
      byCustomer: Record<string, number>;
      byTrip: Record<string, number>;
      byMonth: Record<string, number>;
    };
    expenses: {
      total: number;
      byCategory: Record<string, number>;
      byTruck: Record<string, number>;
      byMonth: Record<string, number>;
    };
    profit: {
      total: number;
      margin: number;
      byCustomer: Record<string, number>;
      byTrip: Record<string, number>;
    };
    cashFlow: {
      operating: number;
      investing: number;
      financing: number;
      netChange: number;
    };
  };

  @Column()
  generatedAt: Date;

  @Column()
  generatedBy: string;

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
