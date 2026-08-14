import {
  Entity,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Tenant } from './tenant.entity';

export enum ParkingReservationStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ADDITIONAL_INFORMATION_REQUIRED = 'ADDITIONAL_INFORMATION_REQUIRED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED',
}

export enum ParkingReservationActivityAction {
  RESERVATION_CREATED = 'RESERVATION_CREATED',
  RESERVATION_ASSIGNED = 'RESERVATION_ASSIGNED',
  RESERVATION_REASSIGNED = 'RESERVATION_REASSIGNED',
  REVIEW_STARTED = 'REVIEW_STARTED',
  INFORMATION_REQUESTED = 'INFORMATION_REQUESTED',
  INFORMATION_RECEIVED = 'INFORMATION_RECEIVED',
  RESERVATION_APPROVED = 'RESERVATION_APPROVED',
  RESERVATION_REJECTED = 'RESERVATION_REJECTED',
  RESERVATION_CANCELLED = 'RESERVATION_CANCELLED',
  NOTE_ADDED = 'NOTE_ADDED',
  STATUS_CHANGED = 'STATUS_CHANGED',
}

@Entity('parking_reservations')
@Index(['tenantId', 'status', 'createdAt'])
@Index(['reservationReference'], { unique: true })
@Index(['email', 'status'])
@Index(['driverEmail'])
@Index(['assignedToUserId', 'status'])
@Index(['requestedStartDate', 'status'])
@Index(['submittedByUserId'])
@Index(['idempotencyKey'], { unique: true, where: '"idempotencyKey" IS NOT NULL' })
export class ParkingReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 30 })
  reservationReference: string;

  @Column('uuid')
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  @Column({ length: 200 })
  companyName: string;

  @Column({ length: 40 })
  mcNumber: string;

  @Column({ length: 40 })
  usdotNumber: string;

  @Column({ length: 40 })
  companyPhone: string;

  @Column({ length: 180 })
  email: string;

  @Column({ length: 180 })
  driverEmail: string;

  @Column({ length: 80 })
  driverFirstName: string;

  @Column({ length: 80 })
  driverLastName: string;

  @Column({ type: 'int' })
  truckSpacesRequested: number;

  @Column({ type: 'int' })
  contractMonths: number;

  @Column({ type: 'date' })
  requestedStartDate: string;

  @Column({ type: 'date' })
  contractEndDate: string;

  @Column({
    type: 'enum',
    enum: ParkingReservationStatus,
    enumName: 'parking_reservation_status_enum',
    default: ParkingReservationStatus.PENDING_REVIEW,
  })
  status: ParkingReservationStatus;

  @Column({ type: 'text', nullable: true })
  customerNotes?: string;

  @Column({ type: 'text', nullable: true })
  internalNotes?: string;

  @Column({ type: 'boolean', default: true })
  agreementAccepted: boolean;

  @Column({ type: 'text' })
  signature: string;

  @Column({ type: 'timestamptz', nullable: true })
  signedAt?: Date;

  @Column('uuid', { nullable: true })
  submittedByUserId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'submittedByUserId' })
  submittedBy?: User;

  @Column('uuid', { nullable: true })
  assignedToUserId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedTo?: User;

  @Column({ type: 'timestamptz', nullable: true })
  assignedAt?: Date;

  @Column('uuid', { nullable: true })
  assignedByUserId?: string;

  @Column('uuid', { nullable: true })
  reviewedByUserId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewedByUserId' })
  reviewedBy?: User;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column('uuid', { nullable: true })
  approvedByUserId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column('uuid', { nullable: true })
  rejectedByUserId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  rejectedAt?: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @Column('uuid', { nullable: true })
  cancelledByUserId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'text', nullable: true })
  informationRequested?: string;

  @Column({ type: 'text', nullable: true })
  informationResponse?: string;

  @Column({ type: 'timestamptz', nullable: true })
  informationRespondedAt?: Date;

  @Column({ type: 'boolean', default: false })
  possibleDuplicate: boolean;

  @Column({ type: 'jsonb', nullable: true })
  duplicateOfReferences?: string[];

  @Column({ length: 80, nullable: true })
  idempotencyKey?: string;

  @Column({ length: 64, nullable: true })
  submitterIpHash?: string;

  @OneToMany(() => ParkingReservationActivity, (activity) => activity.reservation)
  activities?: ParkingReservationActivity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('parking_reservation_activities')
@Index(['reservationId', 'createdAt'])
export class ParkingReservationActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  reservationId: string;

  @ManyToOne(() => ParkingReservation, (reservation) => reservation.activities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reservationId' })
  reservation: ParkingReservation;

  @Column({
    type: 'enum',
    enum: ParkingReservationActivityAction,
    enumName: 'parking_reservation_activity_action_enum',
  })
  action: ParkingReservationActivityAction;

  @Column('uuid', { nullable: true })
  actorUserId?: string;

  @Column({ length: 80, nullable: true })
  actorRole?: string;

  @Column({ length: 180, nullable: true })
  actorLabel?: string;

  @Column({
    type: 'enum',
    enum: ParkingReservationStatus,
    enumName: 'parking_reservation_status_enum',
    nullable: true,
  })
  previousStatus?: ParkingReservationStatus;

  @Column({
    type: 'enum',
    enum: ParkingReservationStatus,
    enumName: 'parking_reservation_status_enum',
    nullable: true,
  })
  newStatus?: ParkingReservationStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('parking_facility_config')
export class ParkingFacilityConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  tenantId?: string;

  @Column({ length: 160, default: 'Nova Parking 365' })
  facilityName: string;

  @Column({ type: 'int', default: 700 })
  totalCapacity: number;

  @Column({ type: 'boolean', default: false })
  allowPastStartDates: boolean;

  @Column({ type: 'boolean', default: true })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('parking_reservation_sequences')
export class ParkingReservationSequence {
  @PrimaryColumn({ type: 'int' })
  year: number;

  @Column({ type: 'int', default: 0 })
  lastNumber: number;
}
