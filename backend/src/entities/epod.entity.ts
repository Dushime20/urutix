import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Trip } from './trip.entity';
import { User } from './user.entity';
import { Driver } from './driver.entity';

export enum EpodStatus {
  PENDING   = 'PENDING',   // submitted by driver, awaiting cargo-owner confirmation
  CONFIRMED = 'CONFIRMED', // cargo owner confirmed receipt
  DISPUTED  = 'DISPUTED',  // cargo owner raised a dispute
}

/**
 * Cargo condition at the point of delivery — aligns with CMR / BoL standards.
 */
export enum CargoConditionOnDelivery {
  INTACT         = 'INTACT',          // All units received in perfect condition
  PARTIAL_DAMAGE = 'PARTIAL_DAMAGE',  // Some units damaged — exception report required
  SHORT_DELIVERY = 'SHORT_DELIVERY',  // Fewer units delivered than manifested
  FULL_DAMAGE    = 'FULL_DAMAGE',     // Cargo is unusable — full exception report required
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

  @OneToOne(() => Trip, (trip) => trip.epod, { nullable: true })
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
  @JoinColumn({ name: 'cargoOwner' })
  cargoOwner?: User;

  // ── Recipient identity ─────────────────────────────────────────────────────
  /** Full legal name of the person who received the cargo */
  @Column({ length: 200 })
  recipientName: string;

  @Column({ length: 50, nullable: true })
  recipientPhone?: string;

  /** National ID or passport number — required for high-value / bonded cargo */
  @Column({ length: 100, nullable: true })
  recipientIdNumber?: string;

  /** Company or organisation the recipient represents */
  @Column({ length: 200, nullable: true })
  recipientCompany?: string;

  // ── Signature & photos ─────────────────────────────────────────────────────
  /** Path / URL of the saved signature PNG */
  @Column({ length: 500, nullable: true })
  signatureFileUrl?: string;

  /** Array of delivery photo URLs (up to 8) */
  @Column('jsonb', { default: [] })
  photoUrls: string[];

  // ── Delivery details ───────────────────────────────────────────────────────
  /** Actual delivery date-time as reported by driver */
  @Column('timestamp with time zone', { nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'text', nullable: true })
  deliveryNotes?: string;

  @Column({ length: 100, nullable: true })
  odometerReading?: string;

  @Column({ type: 'text', nullable: true })
  deliveryAddress?: string;

  /** GPS coordinates at time of delivery */
  @Column('jsonb', { nullable: true })
  deliveryCoordinates?: { latitude: number; longitude: number };

  // ── Cargo condition (CMR / BoL standard) ──────────────────────────────────
  @Column({
    type: 'enum',
    enum: CargoConditionOnDelivery,
    default: CargoConditionOnDelivery.INTACT,
  })
  cargoCondition: CargoConditionOnDelivery;

  /** Actual units / pieces delivered (for short-delivery reconciliation) */
  @Column({ length: 100, nullable: true })
  unitsDelivered?: string;

  /** Exception / damage description — required when cargoCondition !== INTACT */
  @Column({ type: 'text', nullable: true })
  exceptionNotes?: string;

  // ── Status lifecycle ───────────────────────────────────────────────────────
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
