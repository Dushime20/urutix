import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Trip } from '../../../entities/trip.entity';
import { Driver } from '../../../entities/driver.entity';

export enum TripEventType {
  TRIP_STARTED = 'TRIP_STARTED',
  TRIP_COMPLETED = 'TRIP_COMPLETED',
  TRIP_CANCELLED = 'TRIP_CANCELLED',
  PICKUP_ARRIVED = 'PICKUP_ARRIVED',
  PICKUP_COMPLETED = 'PICKUP_COMPLETED',
  DELIVERY_ARRIVED = 'DELIVERY_ARRIVED',
  DELIVERY_COMPLETED = 'DELIVERY_COMPLETED',
  ROUTE_DEVIATION = 'ROUTE_DEVIATION',
  ETA_UPDATED = 'ETA_UPDATED',
  WEATHER_UPDATE = 'WEATHER_UPDATE',
  TRAFFIC_UPDATE = 'TRAFFIC_UPDATE',
  FUEL_STOP = 'FUEL_STOP',
  REST_STOP = 'REST_STOP',
  MAINTENANCE_STOP = 'MAINTENANCE_STOP',
  CUSTOMER_CONTACT = 'CUSTOMER_CONTACT',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  SIGNATURE_COLLECTED = 'SIGNATURE_COLLECTED',
}

export enum TripEventSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

@Entity('trip_events')
@Index(['tripId', 'type'])
@Index(['driverId', 'createdAt'])
@Index(['type', 'severity'])
export class TripEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tripId: string;

  @Column()
  driverId: string;

  @Column({
    type: 'enum',
    enum: TripEventType,
  })
  type: TripEventType;

  @Column({
    type: 'enum',
    enum: TripEventSeverity,
    default: TripEventSeverity.INFO,
  })
  severity: TripEventSeverity;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  speed?: number;

  @Column('jsonb', { nullable: true })
  data: {
    eta?: Date;
    distance?: number;
    duration?: number;
    weather?: any;
    traffic?: any;
    customerInfo?: any;
    documents?: any;
    signature?: any;
  };

  @Column('boolean', { default: false })
  requiresAcknowledgment: boolean;

  @Column('timestamp', { nullable: true })
  acknowledgedAt?: Date;

  @Column({ nullable: true })
  acknowledgedBy?: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Removed relationships to avoid circular dependency
  // @ManyToOne('Trip', 'events')
  // trip: Trip;

  // @ManyToOne('Driver', 'tripEvents')
  // driver: Driver;
}
