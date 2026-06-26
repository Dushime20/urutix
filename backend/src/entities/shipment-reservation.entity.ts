import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReservationStatus {
  ACTIVE   = 'ACTIVE',    // truck/driver are reserved
  RELEASED = 'RELEASED',  // shipment ended (completed/cancelled) — resources free
  REPLACED = 'REPLACED',  // truck or driver was swapped — old reservation superseded
}

/**
 * Source-of-truth for truck & driver scheduling.
 * One record is created per confirmed trip assignment and drives all
 * availability queries.  Never deleted — status transitions to RELEASED.
 */
@Entity('shipment_reservations')
@Index(['truckId',  'status', 'pickupDateTime', 'deliveryDateTime'])
@Index(['driverId', 'status', 'pickupDateTime', 'deliveryDateTime'])
@Index(['tripId'],  { unique: true, where: "status != 'REPLACED'" })
@Index(['tenantId', 'status'])
export class ShipmentReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  tripId: string;

  @Column('uuid')
  cargoId: string;

  @Column('uuid')
  truckId: string;

  @Column('uuid', { nullable: true })
  driverId: string | null;

  /** Inclusive start of reserved window — equals trip.plannedStartTime */
  @Column('timestamp with time zone')
  pickupDateTime: Date;

  /** Inclusive end of reserved window — equals trip.plannedEndTime */
  @Column('timestamp with time zone')
  deliveryDateTime: Date;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.ACTIVE,
  })
  status: ReservationStatus;

  /** Free-text reason for status change, e.g. "cancelled by cargo owner" */
  @Column({ nullable: true })
  statusReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
