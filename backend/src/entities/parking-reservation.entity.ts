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
  PAYMENT_REQUESTED = 'PAYMENT_REQUESTED',
  PAYMENT_SUBMITTED = 'PAYMENT_SUBMITTED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_WAIVED = 'PAYMENT_WAIVED',
}

export enum ParkingReservationPaymentStatus {
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  DUE = 'DUE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  WAIVED = 'WAIVED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum ParkingReservationPaymentMethod {
  CREDIT_TRANSFER = 'CREDIT_TRANSFER',
  CARD = 'CARD',
  CASH = 'CASH',
  MOBILE_MONEY = 'MOBILE_MONEY',
  OTHER = 'OTHER',
}

export enum ParkingFeeScheduleStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

export enum ParkingReservationFeeType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export enum ParkingReservationFeeApplication {
  PER_RESERVATION = 'PER_RESERVATION',
  PER_SPACE = 'PER_SPACE',
  PERCENT_OF_SUBTOTAL = 'PERCENT_OF_SUBTOTAL',
}

export enum ParkingPaymentFrequency {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
}

export enum ParkingPaymentDueType {
  IMMEDIATELY = 'IMMEDIATELY',
  BEFORE_RESERVATION = 'BEFORE_RESERVATION',
  ON_INVOICE_DATE = 'ON_INVOICE_DATE',
  DAYS_AFTER_INVOICE = 'DAYS_AFTER_INVOICE',
  DAYS_BEFORE_START = 'DAYS_BEFORE_START',
}

export enum ParkingLateFeeType {
  NONE = 'NONE',
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

@Entity('parking_facility_config')
export class ParkingFacilityConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  tenantId?: string;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  @Column('uuid', { nullable: true })
  parkingManagerId?: string;

  @Column({ length: 160, default: '' })
  facilityName: string;

  @Column({ length: 80, nullable: true })
  city?: string;

  @Column({ length: 80, nullable: true })
  country?: string;

  @Column({ length: 80, nullable: true })
  region?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 700 })
  totalCapacity: number;

  @Column({ type: 'boolean', default: false })
  allowPastStartDates: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  monthlyRatePerSpace: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  reservationFee: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  taxPercent: number;

  @Column({ type: 'int', default: 7 })
  paymentDueDays: number;

  @Column({ type: 'text', nullable: true })
  feeNotes?: string;

  @Column({ type: 'text', nullable: true })
  paymentInstructions?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('parking_reservations')
@Index(['tenantId', 'status', 'createdAt'])
@Index(['parkingFacilityId', 'status'])
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

  @Column('uuid', { nullable: true })
  parkingFacilityId?: string;

  @ManyToOne(() => ParkingFacilityConfig, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'parkingFacilityId' })
  parkingFacility?: ParkingFacilityConfig;

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

  @Column({
    type: 'enum',
    enum: ParkingReservationPaymentStatus,
    enumName: 'parking_reservation_payment_status_enum',
    default: ParkingReservationPaymentStatus.NOT_APPLICABLE,
  })
  paymentStatus: ParkingReservationPaymentStatus;

  @Column({ length: 3, nullable: true })
  currency?: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  occupancyAmount?: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  reservationFeeAmount?: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  subtotalAmount?: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  taxPercent?: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  taxAmount?: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  totalAmountDue?: number;

  @Column({ length: 40, nullable: true })
  invoiceNumber?: string;

  @Column({ type: 'timestamptz', nullable: true })
  paymentDueAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  paidAmount?: number;

  @Column({
    type: 'enum',
    enum: ParkingReservationPaymentMethod,
    enumName: 'parking_reservation_payment_method_enum',
    nullable: true,
  })
  paymentMethod?: ParkingReservationPaymentMethod;

  @Column({ length: 80, nullable: true })
  paymentReference?: string;

  @Column({ type: 'text', nullable: true })
  paymentNotes?: string;

  @Column({ type: 'jsonb', nullable: true })
  feeSnapshot?: Record<string, unknown>;

  @Column('uuid', { nullable: true })
  feeScheduleId?: string;

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

@Entity('parking_fee_schedules')
@Index(['parkingFacilityId', 'spaceType', 'vehicleType', 'status', 'effectiveFrom'])
@Index(['status', 'effectiveFrom', 'effectiveUntil'])
export class ParkingFeeSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  parkingFacilityId: string;

  @ManyToOne(() => ParkingFacilityConfig, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parkingFacilityId' })
  facility?: ParkingFacilityConfig;

  @Column({ length: 160 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 80, default: 'TRUCK_SPACE' })
  spaceType: string;

  @Column({ length: 80, default: 'TRUCK' })
  vehicleType: string;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ParkingFeeScheduleStatus,
    enumName: 'parking_fee_schedule_status_enum',
    default: ParkingFeeScheduleStatus.DRAFT,
  })
  status: ParkingFeeScheduleStatus;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  monthlyRatePerSpace: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  dailyRate?: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  weeklyRate?: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  longTermRate?: number;

  @Column({ type: 'int', nullable: true })
  longTermMonths?: number;

  @Column({
    type: 'enum',
    enum: ParkingReservationFeeType,
    enumName: 'parking_reservation_fee_type_enum',
    default: ParkingReservationFeeType.FIXED,
  })
  reservationFeeType: ParkingReservationFeeType;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  reservationFeeValue: number;

  @Column({
    type: 'enum',
    enum: ParkingReservationFeeApplication,
    enumName: 'parking_fee_application_enum',
    default: ParkingReservationFeeApplication.PER_RESERVATION,
  })
  reservationFeeApplication: ParkingReservationFeeApplication;

  @Column({ type: 'boolean', default: false })
  taxEnabled: boolean;

  @Column({ length: 80, default: 'VAT' })
  taxName: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  taxPercent: number;

  @Column({
    type: 'enum',
    enum: ParkingPaymentFrequency,
    enumName: 'parking_payment_frequency_enum',
    default: ParkingPaymentFrequency.ONE_TIME,
  })
  paymentFrequency: ParkingPaymentFrequency;

  @Column({
    type: 'enum',
    enum: ParkingPaymentDueType,
    enumName: 'parking_payment_due_type_enum',
    default: ParkingPaymentDueType.DAYS_AFTER_INVOICE,
  })
  paymentDueType: ParkingPaymentDueType;

  @Column({ type: 'int', default: 7 })
  paymentDueDays: number;

  @Column({ type: 'int', default: 0 })
  gracePeriodDays: number;

  @Column({ type: 'enum', enum: ParkingLateFeeType, enumName: 'parking_late_fee_type_enum', default: ParkingLateFeeType.NONE })
  lateFeeType: ParkingLateFeeType;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  lateFeeValue: number;

  @Column({ type: 'boolean', default: false })
  autoRenewal: boolean;

  @Column({ type: 'int', default: 1 })
  minContractMonths: number;

  @Column({ type: 'int', default: 12 })
  maxContractMonths: number;

  @Column({ type: 'int', default: 1 })
  minSpaces: number;

  @Column({ type: 'int', default: 100 })
  maxSpaces: number;

  @Column({ type: 'boolean', default: true })
  cancellationAllowed: boolean;

  @Column({ type: 'int', default: 0 })
  cancellationNoticeDays: number;

  @Column({ type: 'enum', enum: ParkingLateFeeType, enumName: 'parking_late_fee_type_enum', default: ParkingLateFeeType.NONE })
  cancellationFeeType: ParkingLateFeeType;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  cancellationFeeValue: number;

  @Column({ type: 'boolean', default: false })
  refundEligible: boolean;

  @Column({ type: 'boolean', default: true })
  earlyTerminationAllowed: boolean;

  @Column({ type: 'date' })
  effectiveFrom: string;

  @Column({ type: 'date', nullable: true })
  effectiveUntil?: string;

  @Column({ type: 'text', nullable: true })
  feeNotes?: string;

  @Column({ type: 'text', nullable: true })
  paymentInstructions?: string;

  @Column({ type: 'jsonb', nullable: true })
  changeLog?: Record<string, unknown>[];

  @Column('uuid', { nullable: true })
  createdByUserId?: string;

  @Column('uuid', { nullable: true })
  updatedByUserId?: string;

  @Column('uuid', { nullable: true })
  activatedByUserId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  activatedAt?: Date;

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
