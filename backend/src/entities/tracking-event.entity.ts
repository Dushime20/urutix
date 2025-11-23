import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Load } from './load.entity';
import { User } from './user.entity';

export enum TrackingEventType {
  LOCATION = 'Location',
  GEOFENCE_ENTER = 'GeofenceEnter',
  GEOFENCE_EXIT = 'GeofenceExit',
  DELAY = 'Delay',
  INCIDENT = 'Incident',
  STATUS_CHANGE = 'StatusChange',
  DOCUMENT_UPLOAD = 'DocumentUpload',
  ALERT = 'Alert',
}

export enum GeofenceType {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
  CUSTOM = 'custom',
  RESTRICTED = 'restricted',
}

@Entity('tracking_events')
@Index(['loadId'])
@Index(['type'])
@Index(['timestamp'])
@Index(['loadId', 'timestamp'])
export class TrackingEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  loadId: string;

  @Column({
    type: 'enum',
    enum: TrackingEventType,
  })
  type: TrackingEventType;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @Column('timestamp with time zone')
  timestamp: Date;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  speedKph?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  headingDeg?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  accuracyM?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  altitude?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  altitudeAccuracy?: number;

  @Column('text', { nullable: true })
  address?: string;

  @Column('text', { nullable: true })
  city?: string;

  @Column('text', { nullable: true })
  state?: string;

  @Column('text', { nullable: true })
  country?: string;

  @Column('text', { nullable: true })
  postalCode?: string;

  // Geofence specific fields
  @Column('text', { nullable: true })
  geofenceId?: string;

  @Column({
    type: 'enum',
    enum: GeofenceType,
    nullable: true,
  })
  geofenceType?: GeofenceType;

  @Column('text', { nullable: true })
  geofenceName?: string;

  // Event specific data
  @Column('jsonb', { nullable: true })
  data?: Record<string, any>;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('uuid', { nullable: true })
  reportedBy?: string;

  @Column({ default: false })
  isAutomated: boolean;

  @Column({ default: false })
  requiresAction: boolean;

  @Column('timestamp with time zone', { nullable: true })
  actionTakenAt?: Date;

  @Column('uuid', { nullable: true })
  actionTakenBy?: string;

  @Column('text', { nullable: true })
  actionTaken?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @ManyToOne(() => Load, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loadId' })
  load: Load;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reportedBy' })
  reporter: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actionTakenBy' })
  actionTaker: User;

  // Helper methods
  getCoordinates(): { lat: number; lng: number } | null {
    if (this.latitude && this.longitude) {
      return { lat: this.latitude, lng: this.longitude };
    }
    return null;
  }

  isLocationEvent(): boolean {
    return this.type === TrackingEventType.LOCATION;
  }

  isGeofenceEvent(): boolean {
    return [
      TrackingEventType.GEOFENCE_ENTER,
      TrackingEventType.GEOFENCE_EXIT,
    ].includes(this.type);
  }

  isAlertEvent(): boolean {
    return [
      TrackingEventType.DELAY,
      TrackingEventType.INCIDENT,
      TrackingEventType.ALERT,
    ].includes(this.type);
  }

  getFormattedAddress(): string {
    const parts = [
      this.address,
      this.city,
      this.state,
      this.postalCode,
      this.country,
    ];
    return parts.filter(Boolean).join(', ');
  }

  getSpeedInMph(): number {
    return this.speedKph ? Math.round(this.speedKph * 0.621371) : 0;
  }

  getAgeInMinutes(): number {
    return Math.floor((Date.now() - this.timestamp.getTime()) / (1000 * 60));
  }

  getAgeInHours(): number {
    return Math.floor(this.getAgeInMinutes() / 60);
  }

  isRecent(minutes: number = 30): boolean {
    return this.getAgeInMinutes() <= minutes;
  }
}
