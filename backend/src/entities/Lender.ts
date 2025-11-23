import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

export enum LenderStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  SUSPENDED = 'suspended',
}

@Entity('lenders')
@Index(['status', 'created_at'])
export class Lender {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500, select: false })
  api_key_hash: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  callback_url: string;

  @Column({ type: 'varchar', length: 1000, nullable: true, select: false })
  outbound_api_key_encrypted: string;

  @Column({ type: 'varchar', length: 1000, nullable: true, select: false })
  webhook_secret_encrypted: string;

  @Column({ type: 'varchar', length: 255 })
  contact_email: string;

  @Column({
    type: 'enum',
    enum: LenderStatus,
    default: LenderStatus.ACTIVE,
  })
  status: LenderStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany('LenderPolicy', 'lender')
  policies: any[];

  @OneToMany('LoanRequest', 'lender')
  loan_requests: any[];
}
