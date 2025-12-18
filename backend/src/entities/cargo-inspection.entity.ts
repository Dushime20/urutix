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
import { Load } from './load.entity';
import { User } from './user.entity';

export enum InspectionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
}

export interface InspectionChecklistItem {
  id: string;
  label: string;
  originalValue?: any;
  verified: boolean;
  notes?: string;
  discrepancy?: boolean;
  category?: string;
}

@Entity('cargo_inspections')
@Index(['loadId', 'receiverId'])
@Index(['status', 'createdAt'])
export class CargoInspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  loadId: string;

  @Column('uuid')
  receiverId: string;

  @Column({
    type: 'enum',
    enum: InspectionStatus,
    default: InspectionStatus.PENDING,
  })
  status: InspectionStatus;

  @Column('jsonb', { default: [] })
  checklist: InspectionChecklistItem[];

  @Column('text', { nullable: true })
  overallNotes?: string;

  @Column({ default: false })
  allItemsVerified: boolean;

  @Column({ default: 0 })
  verifiedCount: number;

  @Column({ default: 0 })
  totalItems: number;

  @Column({ default: 0 })
  discrepancyCount: number;

  @Column('jsonb', { nullable: true })
  discrepancies?: Array<{
    itemId: string;
    itemLabel: string;
    originalValue: any;
    receivedValue?: any;
    notes: string;
  }>;

  @Column('timestamp with time zone', { nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Load, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loadId' })
  load: Load;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiverId' })
  receiver: User;
}

