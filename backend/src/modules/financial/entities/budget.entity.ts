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

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  year: number;

  @Column({ nullable: true })
  month?: number;

  @Column()
  category: string;

  @Column('decimal', { precision: 10, scale: 2 })
  plannedAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  actualAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  variance: number;

  @Column('decimal', { precision: 5, scale: 2 })
  variancePercentage: number;

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
