import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Driver } from '../../../entities/driver.entity';
import { Trip } from '../../../entities/trip.entity';

export enum AlertType {
  SPEEDING = 'SPEEDING',
  HARD_BRAKING = 'HARD_BRAKING',
  HARD_ACCELERATION = 'HARD_ACCELERATION',
  SHARP_TURN = 'SHARP_TURN',
  IDLE_TIME = 'IDLE_TIME',
  OFF_ROUTE = 'OFF_ROUTE',
  EMERGENCY = 'EMERGENCY',
  BATTERY_LOW = 'BATTERY_LOW',
  GEOFENCE_VIOLATION = 'GEOFENCE_VIOLATION',
  WEATHER_ALERT = 'WEATHER_ALERT',
  MAINTENANCE_ALERT = 'MAINTENANCE_ALERT',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

@Entity('driver_alerts')
@Index(['driverId', 'status'])
@Index(['tripId', 'status'])
@Index(['type', 'severity'])
@Index(['createdAt'])
export class DriverAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  driverId: string;

  @Column({ nullable: true })
  tripId?: string;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  type: AlertType;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.MEDIUM,
  })
  severity: AlertSeverity;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
  })
  status: AlertStatus;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  speed?: number;

  @Column('jsonb', { nullable: true })
  data: {
    threshold?: number;
    actual?: number;
    duration?: number;
    distance?: number;
    weather?: any;
    roadConditions?: any;
  };

  @Column('timestamp', { nullable: true })
  acknowledgedAt?: Date;

  @Column({ nullable: true })
  acknowledgedBy?: string;

  @Column('timestamp', { nullable: true })
  resolvedAt?: Date;

  @Column({ nullable: true })
  resolvedBy?: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Removed relationships to avoid circular dependency
  // @ManyToOne('Driver', 'alerts')
  // driver: Driver;

  // @ManyToOne('Trip', 'alerts')
  // trip: Trip;
}
