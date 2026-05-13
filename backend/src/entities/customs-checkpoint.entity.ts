import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CheckpointType {
  BORDER = 'BORDER',
  PORT = 'PORT',
  WAREHOUSE = 'WAREHOUSE',
  INLAND = 'INLAND',
  AIRPORT = 'AIRPORT',
}

@Entity('customs_checkpoints')
@Index(['tenantId'])
@Index(['isActive'])
export class CustomsCheckpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  code?: string;

  @Column({
    type: 'enum',
    enum: CheckpointType,
    default: CheckpointType.BORDER,
  })
  type: CheckpointType;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  address?: string;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ default: true })
  isActive: boolean;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
