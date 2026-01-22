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
import { Truck } from './truck.entity';

export enum MatchStatus {
  POTENTIAL = 'POTENTIAL',    // Suggestion by AI, not yet seen by Truck Owner
  REQUESTED = 'REQUESTED',    // Cargo Owner liked/ordered matches. Visible to Truck Owner.
  ACCEPTED = 'ACCEPTED',      // Truck Owner accepted
  REJECTED = 'REJECTED',      // Truck Owner dismissed
  EXPIRED = 'EXPIRED',        // Load is no longer available
}

@Entity('load_matches')
@Index(['truckId', 'status'])
@Index(['loadId', 'status'])
@Index(['tenantId'])
export class LoadMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @ManyToOne(() => Load)
  @JoinColumn({ name: 'loadId' })
  load: Load;

  @Column('uuid')
  loadId: string;

  @ManyToOne(() => Truck)
  @JoinColumn({ name: 'truckId' })
  truck: Truck;

  @Column('uuid')
  truckId: string;
  
  @Column('float')
  score: number;

  @Column({
      type: 'enum',
      enum: MatchStatus,
      default: MatchStatus.POTENTIAL
  })
  status: MatchStatus;

  @Column('jsonb', { nullable: true })
  matchDetails: any; // Store the score breakdown details

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
