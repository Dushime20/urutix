import { TripLocation } from './../modules/tracking/entities/trip-location.entity';
import { DriverAlert } from './../modules/tracking/entities/driver-alert.entity';
import { TripEvent } from './../modules/tracking/entities/trip-event.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';

export enum DriverStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
  IN_TRANSIT = 'IN_TRANSIT',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  OWNER_OPERATOR = 'OWNER_OPERATOR',
  FREELANCE = 'FREELANCE',
}

@Entity('drivers')
@Index(['licenseNumber'], { unique: true, where: 'deleted_at IS NULL' })
@Index(['tenantId', 'employerId', 'status'])
@Index(['userId', 'status'])
@Index(['status', 'availabilityStatus', 'currentTripId'])
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  employerId: string;

  @Column({ nullable: true })
  employeeId?: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column('date')
  dateOfBirth: Date;

  @Column('text')
  address: string;

  @Column('jsonb', { default: {} })
  emergencyContact: Record<string, any>;

  @Column({ length: 100, unique: true })
  licenseNumber: string;

  @Column('jsonb', { default: [] })
  licenseClasses: any[];

  @Column('date')
  licenseIssueDate: Date;

  @Column('date')
  licenseExpiry: Date;

  @Column({ length: 100, nullable: true })
  licenseState?: string;

  @Column({ length: 100, nullable: true })
  licenseCountry?: string;

  @Column('jsonb', { default: [] })
  endorsements: any[];

  @Column('jsonb', { default: [] })
  restrictions: any[];

  @Column({
    type: 'enum',
    enum: EmploymentType,
    default: EmploymentType.FULL_TIME,
  })
  employmentType: EmploymentType;

  @Column('date')
  hireDate: Date;

  @Column('date', { nullable: true })
  terminationDate?: Date;

  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.ACTIVE,
  })
  status: DriverStatus;

  @Column({ default: 'AVAILABLE' })
  availabilityStatus: string;

  @Column('uuid', { nullable: true })
  currentTruckId?: string;

  @Column('uuid', { nullable: true })
  currentTripId?: string;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  currentLocation?: object;

  @Column({ nullable: true })
  locationUpdatedAt?: Date;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  hoursWorkedThisWeek: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  hoursWorkedThisMonth: number;

  @Column({ nullable: true })
  lastBreakTime?: Date;

  @Column({ default: 0 })
  consecutiveDrivingHours: number;

  @Column('date', { nullable: true })
  medicalCertExpiry?: Date;

  @Column('date', { nullable: true })
  drugTestDate?: Date;

  @Column('date', { nullable: true })
  backgroundCheckDate?: Date;

  @Column('date', { nullable: true })
  trainingCompletionDate?: Date;

  @Column('jsonb', { default: [] })
  certifications: any[];

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalTrips: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalDistance: number;

  @Column('decimal', { precision: 5, scale: 2, default: 100 })
  safetyScore: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  onTimeDeliveryRate: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  hourlyRate?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  mileageRate?: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ nullable: true })
  experience?: number;

  @Column('text', { nullable: true })
  driverNotes?: string;

  @Column('jsonb', { default: {} })
  preferences: Record<string, any>;

  @Column('jsonb', { default: { breaks: [], drivingHours: 0, onDutyHours: 0, offDutyHours: 0 } })
  hoursOfService: {
    breaks: Array<{
      id: string;
      breakType: string;
      startTime: string;
      endTime: string | null;
      duration: number | null;
      notes: string;
    }>;
    drivingHours: number;
    onDutyHours: number;
    offDutyHours: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Removed locations relationship to avoid circular dependency
  // @OneToMany('TripLocation', 'driver')
  // locations: TripLocation[];

  // Removed alerts relationship to avoid circular dependency
  // @OneToMany('DriverAlert', 'driver')
  // alerts: DriverAlert[];

  // Removed tripEvents relationship to avoid circular dependency
  // @OneToMany('TripEvent', 'driver')
  // tripEvents: TripEvent[];
}
