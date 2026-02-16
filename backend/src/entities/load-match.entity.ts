import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

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

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string;

  @Column({ name: 'load_id', type: 'uuid', nullable: true })
  loadId: string;

  @Column({ name: 'truck_id', type: 'uuid', nullable: true })
  truckId: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.POTENTIAL
  })
  status: MatchStatus;

  @Column({ name: 'match_details', type: 'jsonb', nullable: true })
  matchDetails: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
