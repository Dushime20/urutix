import { Location } from './location.entity';
import { TripLocation } from '../modules/tracking/entities/trip-location.entity';
import { DriverAlert } from '../modules/tracking/entities/driver-alert.entity';
import { TripEvent } from '../modules/tracking/entities/trip-event.entity';
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
  JoinColumn,
} from 'typeorm';
import { Load } from './load.entity';
import { Truck } from './truck.entity';
import { Driver } from './driver.entity';

export enum TripStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DELAYED = 'DELAYED',
}

@Entity('trips')
@Index(['tripNumber'], { unique: true })
@Index(['tenantId', 'status', 'plannedStartTime'])
@Index(['loadId', 'status'])
@Index(['truckId', 'driverId', 'status'])
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  loadId: string;

  @Column('uuid')
  truckId: string;

  @Column('uuid')
  driverId: string;

  @Column({ length: 50, unique: true })
  tripNumber: string;

  @Column({
    type: 'enum',
    enum: TripStatus,
    default: TripStatus.PLANNED,
  })
  status: TripStatus;

  @Column('timestamp with time zone')
  plannedStartTime: Date;

  @Column('timestamp with time zone')
  plannedEndTime: Date;

  @Column('timestamp with time zone', { nullable: true })
  actualStartTime?: Date;

  @Column('timestamp with time zone', { nullable: true })
  estimatedEndTime?: Date;
  @Column('timestamp with time zone', { nullable: true })
  actualEndTime?: Date;

  @Column('jsonb', { nullable: true })
  plannedRoute?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  actualRoute?: Record<string, any>;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  totalDistance?: number;

  @Column('decimal', { precision: 15, scale: 2 })
  agreedPrice: number;

  @Column({ length: 3, default: 'USD' })
  currencyCode: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  fuelCost?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  tollsCost?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  otherExpenses?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  totalCost?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  profitMargin?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  fuelEfficiency?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  averageSpeed?: number;

  @Column({ nullable: true })
  onTimePerformance?: boolean;

  // Tracking/ETA properties
  @Column('timestamp with time zone', { nullable: true })
  eta?: Date;

  @Column('float', { nullable: true })
  distance?: number;

  @Column('float', { nullable: true })
  duration?: number;

  @ManyToOne('Location', { nullable: true })
  pickupLocation?: Location;

  @ManyToOne('Location', { nullable: true })
  deliveryLocation?: Location;
  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  currentLocation?: object;

  @Column({ nullable: true })
  locationUpdatedAt?: Date;

  @Column('timestamp with time zone', { nullable: true })
  estimatedArrival?: Date;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  cargoOwnerRating?: number;

  @Column({ nullable: true })
  cargoOwnerFeedback?: string;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  driverRating?: number;

  @Column({ nullable: true })
  driverFeedback?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column('jsonb', { default: [] })
  issuesReported: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @ManyToOne('Load', 'trips')
  @JoinColumn({ name: 'loadId' })
  load: Load;

  @ManyToOne('Truck')
  @JoinColumn({ name: 'truckId' })
  truck: Truck;

  @ManyToOne('Driver')
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  // Removed locations relationship to avoid circular dependency
  // @OneToMany('TripLocation', 'trip')
  // locations: TripLocation[];

  // Removed alerts relationship to avoid circular dependency
  // @OneToMany('DriverAlert', 'trip')
  // alerts: DriverAlert[];

  // Removed events relationship to avoid circular dependency
  // @OneToMany('TripEvent', 'trip')
  // events: TripEvent[];
}
