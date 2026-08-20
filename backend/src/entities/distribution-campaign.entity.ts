import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DistributionCampaignStatus {
  DRAFT = 'DRAFT',
  PLANNED = 'PLANNED',
  APPROVED = 'APPROVED',
  EXECUTING = 'EXECUTING',
  COMPLETE = 'COMPLETE',
  EXCEPTION = 'EXCEPTION',
}

@Entity('distribution_campaigns')
@Index(['tenantId', 'cargoOwnerId', 'createdAt'])
@Index(['tenantId', 'status'])
export class DistributionCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  cargoOwnerId: string;

  @Column({
    type: 'varchar',
    length: 32,
    default: DistributionCampaignStatus.DRAFT,
  })
  status: DistributionCampaignStatus;

  @Column({ length: 200 })
  productName: string;

  @Column('int')
  totalUnits: number;

  @Column('jsonb')
  intent: Record<string, any>;

  @Column('jsonb', { nullable: true })
  plan?: Record<string, any> | null;

  @Column('jsonb', { default: [] })
  loadIds: string[];

  @Column('jsonb', { default: {} })
  execution: Record<string, any>;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
