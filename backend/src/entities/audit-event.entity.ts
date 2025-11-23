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

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  PUBLISH = 'publish',
  ASSIGN = 'assign',
  START = 'start',
  DELIVER = 'deliver',
  CANCEL = 'cancel',
  REPOST = 'repost',
  STATUS_CHANGE = 'status_change',
  DOCUMENT_UPLOAD = 'document_upload',
  DOCUMENT_DELETE = 'document_delete',
  LOCATION_UPDATE = 'location_update',
  PRICING_UPDATE = 'pricing_update',
  ALERT_CREATE = 'alert_create',
  ALERT_UPDATE = 'alert_update',
  TRACKING_UPDATE = 'tracking_update',
  BULK_OPERATION = 'bulk_operation',
}

export enum AuditEntityType {
  LOAD = 'load',
  DOCUMENT = 'document',
  TRACKING = 'tracking',
  ALERT = 'alert',
  BID = 'bid',
  TRIP = 'trip',
}

@Entity('audit_events')
@Index(['loadId'])
@Index(['entityType'])
@Index(['action'])
@Index(['actorId'])
@Index(['createdAt'])
@Index(['loadId', 'createdAt'])
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  loadId: string;

  @Column({
    type: 'enum',
    enum: AuditEntityType,
    default: AuditEntityType.LOAD,
  })
  entityType: AuditEntityType;

  @Column('uuid', { nullable: true })
  entityId?: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column('uuid')
  @Index()
  actorId: string;

  @Column('text', { nullable: true })
  actorName?: string;

  @Column('text', { nullable: true })
  actorEmail?: string;

  @Column('text', { nullable: true })
  actorRole?: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text', { nullable: true })
  reason?: string;

  @Column('jsonb', { nullable: true })
  before?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  after?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    type: 'added' | 'removed' | 'modified';
  }>;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column('text', { nullable: true })
  ipAddress?: string;

  @Column('text', { nullable: true })
  userAgent?: string;

  @Column('text', { nullable: true })
  sessionId?: string;

  @Column('text', { nullable: true })
  requestId?: string;

  @Column('text', { nullable: true })
  externalReference?: string;

  @Column('text', { nullable: true })
  externalSystem?: string;

  @Column({ default: false })
  isAutomated: boolean;

  @Column('text', { nullable: true })
  automationSource?: string;

  @Column('jsonb', { nullable: true })
  relatedEntities?: Array<{
    type: string;
    id: string;
    action: string;
  }>;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('text', { nullable: true })
  tags?: string[];

  @Column({ default: false })
  isSensitive: boolean;

  @Column({ default: false })
  requiresReview: boolean;

  @Column('uuid', { nullable: true })
  reviewedBy?: string;

  @Column('timestamp with time zone', { nullable: true })
  reviewedAt?: Date;

  @Column('text', { nullable: true })
  reviewNotes?: string;

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
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: User;

  // Helper methods
  getChangeSummary(): string {
    if (!this.changes || this.changes.length === 0) {
      return 'No specific changes recorded';
    }

    const changeDescriptions = this.changes.map((change) => {
      switch (change.type) {
        case 'added':
          return `Added ${change.field}: ${change.newValue}`;
        case 'removed':
          return `Removed ${change.field}: ${change.oldValue}`;
        case 'modified':
          return `Changed ${change.field} from ${change.oldValue} to ${change.newValue}`;
        default:
          return `Modified ${change.field}`;
      }
    });

    return changeDescriptions.join('; ');
  }

  hasChanges(): boolean {
    return this.changes && this.changes.length > 0;
  }

  getFieldChanges(fieldName: string): any[] {
    return this.changes?.filter((change) => change.field === fieldName) || [];
  }

  isRecent(minutes: number = 30): boolean {
    return (
      Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60)) <=
      minutes
    );
  }

  isToday(): boolean {
    const today = new Date();
    const eventDate = new Date(this.createdAt);
    return today.toDateString() === eventDate.toDateString();
  }

  isThisWeek(): boolean {
    const now = new Date();
    const eventDate = new Date(this.createdAt);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return eventDate >= weekAgo;
  }

  isThisMonth(): boolean {
    const now = new Date();
    const eventDate = new Date(this.createdAt);
    return (
      now.getMonth() === eventDate.getMonth() &&
      now.getFullYear() === eventDate.getFullYear()
    );
  }

  getAgeInMinutes(): number {
    return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60));
  }

  getAgeInHours(): number {
    return Math.floor(this.getAgeInMinutes() / 60);
  }

  getAgeInDays(): number {
    return Math.floor(this.getAgeInHours() / 24);
  }

  getFormattedAge(): string {
    const minutes = this.getAgeInMinutes();
    const hours = this.getAgeInHours();
    const days = this.getAgeInDays();

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }

  isStatusChange(): boolean {
    return this.action === AuditAction.STATUS_CHANGE;
  }

  isDocumentOperation(): boolean {
    return [AuditAction.DOCUMENT_UPLOAD, AuditAction.DOCUMENT_DELETE].includes(
      this.action,
    );
  }

  isWorkflowAction(): boolean {
    return [
      AuditAction.PUBLISH,
      AuditAction.ASSIGN,
      AuditAction.START,
      AuditAction.DELIVER,
      AuditAction.CANCEL,
      AuditAction.REPOST,
    ].includes(this.action);
  }

  getActionIcon(): string {
    switch (this.action) {
      case AuditAction.CREATE:
        return '➕';
      case AuditAction.UPDATE:
        return '✏️';
      case AuditAction.DELETE:
        return '🗑️';
      case AuditAction.PUBLISH:
        return '📢';
      case AuditAction.ASSIGN:
        return '📋';
      case AuditAction.START:
        return '🚀';
      case AuditAction.DELIVER:
        return '✅';
      case AuditAction.CANCEL:
        return '❌';
      case AuditAction.REPOST:
        return '🔄';
      case AuditAction.STATUS_CHANGE:
        return '🔄';
      case AuditAction.DOCUMENT_UPLOAD:
        return '📄';
      case AuditAction.DOCUMENT_DELETE:
        return '🗑️';
      case AuditAction.LOCATION_UPDATE:
        return '📍';
      case AuditAction.PRICING_UPDATE:
        return '💰';
      case AuditAction.ALERT_CREATE:
        return '⚠️';
      case AuditAction.ALERT_UPDATE:
        return '🔔';
      case AuditAction.TRACKING_UPDATE:
        return '📡';
      case AuditAction.BULK_OPERATION:
        return '📦';
      default:
        return '📝';
    }
  }
}
