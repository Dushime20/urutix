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

@Entity('trip_locations')
@Index(['tripId', 'timestamp'])
@Index(['driverId', 'timestamp'])
@Index(['latitude', 'longitude'])
export class TripLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tripId: string;

  @Column()
  driverId: string;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  altitude?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  speed?: number; // Speed in km/h

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  heading?: number; // Direction in degrees

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  accuracy?: number; // GPS accuracy in meters

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  batteryLevel?: number; // Device battery level

  @Column('boolean', { default: false })
  isMoving: boolean;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>; // Additional tracking data

  @Column('timestamp')
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Removed relationships to avoid circular dependency
  // @ManyToOne('Trip', 'locations')
  // trip: Trip;

  // @ManyToOne('Driver', 'locations')
  // driver: Driver;
}
