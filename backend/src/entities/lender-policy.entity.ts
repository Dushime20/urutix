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

@Entity('lender_policies')
@Index(['lender_id', 'created_at'])
export class LenderPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  lender_id: string;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  interest_rate: number;

  @Column({ type: 'int' })
  repayment_term_days: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  max_advance_per_trip: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  max_exposure: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.7 })
  advance_percentage: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne('Lender')
  @JoinColumn({ name: 'lender_id' })
  lender: any;
}
