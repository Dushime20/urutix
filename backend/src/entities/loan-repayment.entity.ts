import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { decimalToNumberTransformer } from './../common/transformers/decimal.transformer';

@Entity('loan_repayments')
@Index(['loan_request_id', 'repayment_date'])
export class LoanRepayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  loan_request_id: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: decimalToNumberTransformer,
  })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: decimalToNumberTransformer,
  })
  interest_paid: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: decimalToNumberTransformer,
  })
  principal_paid: number;

  @Column({ type: 'timestamp' })
  repayment_date: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  external_txn_ref: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne('LoanRequest')
  @JoinColumn({ name: 'loan_request_id' })
  loan_request: any;
}
