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

export enum AlertType {
  DELAY = 'Delay',
  ROUTE_DEVIATION = 'RouteDeviation',
  INCIDENT = 'Incident',
  TEMPERATURE_EXCURSION = 'TemperatureExcursion',
  CUSTOMS_HOLD = 'CustomsHold',
  MECHANICAL_ISSUE = 'MechanicalIssue',
  WEATHER_DELAY = 'WeatherDelay',
  TRAFFIC_DELAY = 'TrafficDelay',
  SECURITY_ISSUE = 'SecurityIssue',
  OTHER = 'Other',
}

export enum AlertSeverity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum AlertStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Entity('alerts')
@Index(['loadId'])
@Index(['type'])
@Index(['severity'])
@Index(['status'])
@Index(['loadId', 'status'])
@Index(['createdAt'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  loadId: string;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  type: AlertType;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.MEDIUM,
  })
  severity: AlertSeverity;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.OPEN,
  })
  status: AlertStatus;

  @Column('timestamp with time zone')
  occurredAt: Date;

  @Column('timestamp with time zone', { nullable: true })
  acknowledgedAt?: Date;

  @Column('uuid', { nullable: true })
  acknowledgedBy?: string;

  @Column('timestamp with time zone', { nullable: true })
  resolvedAt?: Date;

  @Column('uuid', { nullable: true })
  resolvedBy?: string;

  @Column('timestamp with time zone', { nullable: true })
  closedAt?: Date;

  @Column('uuid', { nullable: true })
  closedBy?: string;

  @Column('text', { nullable: true })
  resolutionNotes?: string;

  @Column('text', { nullable: true })
  actionTaken?: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  estimatedDelayHours?: number;

  @Column('text', { nullable: true })
  estimatedResolutionTime?: string;

  @Column('text', { nullable: true })
  contactPerson?: string;

  @Column('text', { nullable: true })
  contactPhone?: string;

  @Column('text', { nullable: true })
  contactEmail?: string;

  @Column({ default: false })
  requiresImmediateAction: boolean;

  @Column({ default: false })
  isEscalated: boolean;

  @Column('timestamp with time zone', { nullable: true })
  escalatedAt?: Date;

  @Column('uuid', { nullable: true })
  escalatedTo?: string;

  @Column('text', { nullable: true })
  escalationReason?: string;

  @Column('jsonb', { nullable: true })
  attachments?: Array<{
    filename: string;
    url: string;
    type: string;
    size: number;
  }>;

  @Column('text', { nullable: true })
  externalReference?: string;

  @Column('text', { nullable: true })
  externalSystem?: string;

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
  @JoinColumn({ name: 'acknowledgedBy' })
  acknowledger: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolvedBy' })
  resolver: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'closedBy' })
  closer: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'escalatedTo' })
  escalatee: User;

  // Helper methods
  isOpen(): boolean {
    return this.status === AlertStatus.OPEN;
  }

  isAcknowledged(): boolean {
    return this.status === AlertStatus.ACKNOWLEDGED;
  }

  isInProgress(): boolean {
    return this.status === AlertStatus.IN_PROGRESS;
  }

  isResolved(): boolean {
    return this.status === AlertStatus.RESOLVED;
  }

  isClosed(): boolean {
    return this.status === AlertStatus.CLOSED;
  }

  canBeAcknowledged(): boolean {
    return this.status === AlertStatus.OPEN;
  }

  canBeResolved(): boolean {
    return [
      AlertStatus.OPEN,
      AlertStatus.ACKNOWLEDGED,
      AlertStatus.IN_PROGRESS,
    ].includes(this.status);
  }

  canBeClosed(): boolean {
    return this.status === AlertStatus.RESOLVED;
  }

  getAgeInMinutes(): number {
    return Math.floor((Date.now() - this.occurredAt.getTime()) / (1000 * 60));
  }

  getAgeInHours(): number {
    return Math.floor(this.getAgeInMinutes() / 60);
  }

  isRecent(minutes: number = 30): boolean {
    return this.getAgeInMinutes() <= minutes;
  }

  isUrgent(): boolean {
    return (
      this.severity === AlertSeverity.CRITICAL ||
      this.requiresImmediateAction ||
      this.isEscalated
    );
  }

  getStatusColor(): string {
    switch (this.status) {
      case AlertStatus.OPEN:
        return 'red';
      case AlertStatus.ACKNOWLEDGED:
        return 'yellow';
      case AlertStatus.IN_PROGRESS:
        return 'blue';
      case AlertStatus.RESOLVED:
        return 'green';
      case AlertStatus.CLOSED:
        return 'gray';
      default:
        return 'gray';
    }
  }

  getSeverityColor(): string {
    switch (this.severity) {
      case AlertSeverity.LOW:
        return 'green';
      case AlertSeverity.MEDIUM:
        return 'yellow';
      case AlertSeverity.HIGH:
        return 'orange';
      case AlertSeverity.CRITICAL:
        return 'red';
      default:
        return 'gray';
    }
  }

  getFormattedLocation(): string {
    if (!this.location) return 'Unknown location';

    const parts = [
      this.location.address,
      this.location.city,
      this.location.state,
      this.location.country,
    ];
    return parts.filter(Boolean).join(', ');
  }
}
