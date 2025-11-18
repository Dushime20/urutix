import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Trip } from './trip.entity';

export enum DisputeStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
  REJECTED = 'REJECTED',
}

@Entity('disputes')
@Index(['tenantId', 'status', 'createdAt'])
@Index(['tripId', 'status'])
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  tripId: string;

  @Column('uuid')
  raisedById: string;

  @Column({ type: 'enum', enum: DisputeStatus, default: DisputeStatus.OPEN })
  status: DisputeStatus;

  @Column('text')
  reason: string;

  @Column('text', { nullable: true })
  resolution?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @ManyToOne('User')
  raisedBy: User;

  @ManyToOne('Trip')
  trip: Trip;
}
