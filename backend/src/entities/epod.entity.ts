import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Trip } from './trip.entity';
import { User } from './user.entity';
import { Driver } from './driver.entity';

export enum EpodStatus {
  PENDING   = 'PENDING',   // submitted, awaiting cargo-owner confirmation
  CONFIRMED = 'CONFIRMED', // cargo owner confirmed receipt
  DISPUTED  = 'DISPUTED',  // cargo owner raised a dispute
}

@Entity('epods')
@Index(['tripId'], { unique: true })
@Index(['tenantId', 'status'])
@Index(['cargoOwnerId'])
export class Epod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  tripId: string;

  @ManyToOne(() => Trip, { nullable: true })
  @JoinColumn({ name: 'tripId' })
  trip?: Trip;

  @Column('uuid')
  driverId: string;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver?: Driver;

  @Column('uuid')
  cargoOwnerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cargoOwnerId' })
  cargoOwner?: User;

  // ── Recipient ──────────────────────────────────────────────────────────────
  @Column({ length: 200 })
  recipientName: string;

  @Column({ nullable: true })
  recipientPhone?: string;

  // ── Signature ─────────────────────────────────────────────────────────────
  /** Path to the saved signature PNG file */
  @Column({ nullable: true })
  signatureFileUrl?: string;

  // ── Delivery photos ───────────────────────────────────────────────────────
  /** Array of file URLs for delivery photos */
  @Column('jsonb', { default: [] })
  photoUrls: string[];

  // ── Delivery details ──────────────────────────────────────────────────────
  @Column({ nullable: true })
  deliveryNotes?: string;

  @Column({ nullable: true })
  odometerReading?: string;

  @Column({ nullable: true })
  deliveryAddress?: string;

  /** GPS coordinates at time of delivery */
  @Column('jsonb', { nullable: true })
  deliveryCoordinates?: { latitude: number; longitude: number };

  @Column({
    type: 'enum',
    enum: EpodStatus,
    default: EpodStatus.PENDING,
  })
  status: EpodStatus;

  /** Timestamp when the driver submitted the ePOD */
  @Column('timestamp with time zone')
  submittedAt: Date;

  /** Timestamp when cargo owner confirmed */
  @Column('timestamp with time zone', { nullable: true })
  confirmedAt?: Date;

  /** Timestamp when cargo owner disputed */
  @Column('timestamp with time zone', { nullable: true })
  disputedAt?: Date;

  /** Reason for dispute */
  @Column({ type: 'text', nullable: true })
  disputeReason?: string;

  /** Auto-generated invoice ID linked to this ePOD */
  @Column('uuid', { nullable: true })
  invoiceId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
