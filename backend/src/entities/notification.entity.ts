import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum NotificationType {
  // System notifications
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  SYSTEM_ERROR = 'SYSTEM_ERROR',

  // User notifications
  USER_WELCOME = 'USER_WELCOME',
  USER_VERIFICATION = 'USER_VERIFICATION',
  USER_PASSWORD_RESET = 'USER_PASSWORD_RESET',
  USER_ACCOUNT_LOCKED = 'USER_ACCOUNT_LOCKED',

  // Driver notifications
  DRIVER_ASSIGNMENT = 'DRIVER_ASSIGNMENT',
  DRIVER_TRIP_START = 'DRIVER_TRIP_START',
  DRIVER_TRIP_END = 'DRIVER_TRIP_END',
  DRIVER_ALERT = 'DRIVER_ALERT',
  DRIVER_DOCUMENT_EXPIRY = 'DRIVER_DOCUMENT_EXPIRY',
  DRIVER_SAFETY_ALERT = 'DRIVER_SAFETY_ALERT',
  DRIVER_FATIGUE_WARNING = 'DRIVER_FATIGUE_WARNING',

  // Broker notifications
  BROKER_ASSIGNMENT = 'BROKER_ASSIGNMENT',

  // Vehicle notifications
  VEHICLE_MAINTENANCE_DUE = 'VEHICLE_MAINTENANCE_DUE',
  VEHICLE_INSPECTION_DUE = 'VEHICLE_INSPECTION_DUE',
  VEHICLE_INSURANCE_EXPIRY = 'VEHICLE_INSURANCE_EXPIRY',
  VEHICLE_REGISTRATION_EXPIRY = 'VEHICLE_REGISTRATION_EXPIRY',
  VEHICLE_BREAKDOWN = 'VEHICLE_BREAKDOWN',

  // Cargo notifications
  CARGO_PICKUP_REMINDER = 'CARGO_PICKUP_REMINDER',
  CARGO_DELIVERY_UPDATE = 'CARGO_DELIVERY_UPDATE',
  CARGO_DELAY = 'CARGO_DELAY',
  CARGO_DAMAGE = 'CARGO_DAMAGE',
  CARGO_CUSTOMS_UPDATE = 'CARGO_CUSTOMS_UPDATE',

  // Pre-trip inspection notifications
  PRE_TRIP_SUBMITTED = 'PRE_TRIP_SUBMITTED',
  PRE_TRIP_APPROVED = 'PRE_TRIP_APPROVED',
  PRE_TRIP_FAILED = 'PRE_TRIP_FAILED',
  PRE_TRIP_READY_FOR_RE_INSPECTION = 'PRE_TRIP_READY_FOR_RE_INSPECTION',

  // Trip notifications
  TRIP_CREATED = 'TRIP_CREATED',
  TRIP_STARTED = 'TRIP_STARTED',
  TRIP_COMPLETED = 'TRIP_COMPLETED',
  TRIP_CANCELLED = 'TRIP_CANCELLED',
  TRIP_DELAY = 'TRIP_DELAY',
  TRIP_ROUTE_CHANGE = 'TRIP_ROUTE_CHANGE',
  TRIP_UPDATE = 'TRIP_UPDATE',
  TRIP_STATUS = 'TRIP_STATUS',

  // Financial notifications
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_DUE = 'PAYMENT_DUE',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  INVOICE_GENERATED = 'INVOICE_GENERATED',
  EXPENSE_APPROVED = 'EXPENSE_APPROVED',
  EXPENSE_REJECTED = 'EXPENSE_REJECTED',
  PAYMENT = 'PAYMENT',

  // Compliance notifications
  LICENSE_EXPIRY = 'LICENSE_EXPIRY',
  CERTIFICATION_EXPIRY = 'CERTIFICATION_EXPIRY',
  INSURANCE_EXPIRY = 'INSURANCE_EXPIRY',
  PERMIT_EXPIRY = 'PERMIT_EXPIRY',
  AUDIT_DUE = 'AUDIT_DUE',
  VIOLATION_ALERT = 'VIOLATION_ALERT',

  // Business notifications
  CONTRACT_EXPIRY = 'CONTRACT_EXPIRY',
  AGREEMENT_UPDATE = 'AGREEMENT_UPDATE',
  POLICY_CHANGE = 'POLICY_CHANGE',
  NEW_FEATURE = 'NEW_FEATURE',

  // Emergency notifications
  EMERGENCY_ALERT = 'EMERGENCY_ALERT',
  ACCIDENT_REPORT = 'ACCIDENT_REPORT',
  WEATHER_WARNING = 'WEATHER_WARNING',
  ROAD_CLOSURE = 'ROAD_CLOSURE',

  // Document notifications
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_VERIFIED = 'DOCUMENT_VERIFIED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',

  // Auction notifications
  AUCTION_CREATED = 'AUCTION_CREATED',
  AUCTION_BID_RECEIVED = 'AUCTION_BID_RECEIVED',
  AUCTION_WON = 'AUCTION_WON',
  AUCTION_LOST = 'AUCTION_LOST',
  SMART_MATCH_SELECTED = 'SMART_MATCH_SELECTED',

  // Loan notifications
  LOAN_REQUESTED = 'LOAN_REQUESTED',
  LOAN_APPROVED = 'LOAN_APPROVED',
  LOAN_TERMS_OFFERED = 'LOAN_TERMS_OFFERED',
  LOAN_TERMS_ACCEPTED = 'LOAN_TERMS_ACCEPTED',
  LOAN_TERMS_DECLINED = 'LOAN_TERMS_DECLINED',
  LOAN_REJECTED = 'LOAN_REJECTED',
  LOAN_APPEAL_SUBMITTED = 'LOAN_APPEAL_SUBMITTED',
  LOAN_DISBURSED = 'LOAN_DISBURSED',
  LOAN_REPAYMENT_RECEIVED = 'LOAN_REPAYMENT_RECEIVED',
  LOAN_OVERDUE = 'LOAN_OVERDUE',
  LENDER_PAID_ON_BEHALF = 'LENDER_PAID_ON_BEHALF',

  // Payment notifications
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  TRUCK_OWNER_PAYMENT_RECEIVED = 'TRUCK_OWNER_PAYMENT_RECEIVED',

  // Dispute / support notifications
  DISPUTE_REPORTED = 'DISPUTE_REPORTED',
  DISPUTE_UPDATED = 'DISPUTE_UPDATED',
  DISPUTE_ESCALATED = 'DISPUTE_ESCALATED',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
  DISPUTE_SLA_BREACHED = 'DISPUTE_SLA_BREACHED',

  // Other
  GENERAL = 'GENERAL',
  REMINDER = 'REMINDER',
  ALERT = 'ALERT',
  INFO = 'INFO',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

export enum NotificationCategory {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  DRIVER = 'DRIVER',
  VEHICLE = 'VEHICLE',
  CARGO = 'CARGO',
  TRIP = 'TRIP',
  TRIP_STATUS = 'TRIP_STATUS',
  FINANCIAL = 'FINANCIAL',
  COMPLIANCE = 'COMPLIANCE',
  BUSINESS = 'BUSINESS',
  EMERGENCY = 'EMERGENCY',
  GENERAL = 'GENERAL',
  SAFETY = 'SAFETY',
  PERFORMANCE = 'PERFORMANCE',
  MAINTENANCE = 'MAINTENANCE',
  MARKETING = 'MARKETING',
  LOAN = 'LOAN',
  AUCTION = 'AUCTION',
  DISPUTE = 'DISPUTE',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WEBHOOK = 'WEBHOOK',
  SLACK = 'SLACK',
  TEAMS = 'TEAMS',
}

export enum EntityType {
  USER = 'USER',
  DRIVER = 'DRIVER',
  TRUCK = 'TRUCK',
  CARGO = 'CARGO',
  TRIP = 'TRIP',
  COMPANY = 'COMPANY',
  TENANT = 'TENANT',
  SYSTEM = 'SYSTEM',
  DOCUMENT = 'DOCUMENT',
  PAYMENT = 'PAYMENT',
  EXPENSE = 'EXPENSE',
  LOAN = 'LOAN',
  AUCTION = 'AUCTION',
  DISPUTE = 'DISPUTE',
}

@Entity('notifications')
@Index(['tenantId', 'recipientId', 'isRead'])
@Index(['notificationType', 'priority', 'createdAt'])
@Index(['scheduledAt', 'status'])
@Index(['recipientId', 'status'])
@Index(['entityType', 'entityId'])
@Index(['notificationType', 'priority'])
@Index(['category', 'status'])
@Index(['tenantId', 'recipientId'])
@Index(['createdAt', 'priority'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  recipientId: string;

  @Column({
    type: 'enum',
    enum: EntityType,
    comment: 'Type of entity this notification is related to',
  })
  entityType: EntityType;

  @Column('uuid', { nullable: true })
  entityId?: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    comment: 'Specific type of notification',
  })
  notificationType: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationCategory,
    comment: 'Category of notification for grouping',
  })
  category: NotificationCategory;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column('text')
  title: string;

  @Column('text')
  message: string;

  @Column('text', { nullable: true })
  shortMessage?: string;

  @Column('jsonb', { default: [] })
  channels: NotificationChannel[];

  @Column('jsonb', { default: {} })
  channelData: {
    email?: {
      subject?: string;
      template?: string;
      variables?: Record<string, any>;
    };
    sms?: {
      template?: string;
      variables?: Record<string, any>;
    };
    push?: {
      title?: string;
      body?: string;
      image?: string;
      actionUrl?: string;
    };
    webhook?: {
      url?: string;
      headers?: Record<string, string>;
      payload?: Record<string, any>;
    };
  };

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @Column('jsonb', { default: [] })
  tags: string[];

  @Column('timestamp', { nullable: true })
  scheduledAt?: Date;

  @Column('timestamp', { nullable: true })
  sentAt?: Date;

  @Column('timestamp', { nullable: true })
  deliveredAt?: Date;

  @Column('timestamp', { nullable: true })
  readAt?: Date;

  @Column('timestamp', { nullable: true })
  expiresAt?: Date;

  @Column('boolean', { default: false })
  isRead: boolean;

  @Column('boolean', { default: false })
  isArchived: boolean;

  @Column('boolean', { default: false })
  requiresAction: boolean;

  @Column('text', { nullable: true })
  actionUrl?: string;

  @Column('text', { nullable: true })
  actionText?: string;

  @Column('jsonb', { default: {} })
  actionData?: Record<string, any>;

  @Column('jsonb', { default: [] })
  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;

  @Column('jsonb', { default: {} })
  deliveryAttempts: {
    email?: Array<{
      attempt: number;
      timestamp: Date;
      status: string;
      error?: string;
    }>;
    sms?: Array<{
      attempt: number;
      timestamp: Date;
      status: string;
      error?: string;
    }>;
    push?: Array<{
      attempt: number;
      timestamp: Date;
      status: string;
      error?: string;
    }>;
  };

  @Column('jsonb', { default: {} })
  userPreferences: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    quietHours?: {
      start: string;
      end: string;
      timezone: string;
    };
  };

  @Column('jsonb', { default: {} })
  analytics: {
    openCount: number;
    clickCount: number;
    lastOpenedAt?: Date;
    lastClickedAt?: Date;
    deviceInfo?: Record<string, any>;
    locationInfo?: Record<string, any>;
  };

  @Column('jsonb', { default: [] })
  relatedNotifications: Array<{
    notificationId: string;
    relationship: string;
    relatedAt: Date;
  }>;

  @Column('jsonb', { default: {} })
  workflowInfo?: {
    workflowId: string;
    step: string;
    nextStep?: string;
    dueDate?: Date;
    assignedTo?: string;
  };

  @Column('jsonb', { default: {} })
  escalationInfo?: {
    escalatedAt?: Date;
    escalatedBy?: string;
    escalationLevel: number;
    escalationReason?: string;
    nextEscalationAt?: Date;
  };

  @Column('jsonb', { default: {} })
  complianceInfo?: {
    regulatoryBody?: string;
    complianceCode?: string;
    requiredAction?: string;
    deadline?: Date;
    penalty?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Virtual properties for business logic
  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return this.expiresAt < new Date();
  }

  get isScheduled(): boolean {
    if (!this.scheduledAt) return false;
    return this.scheduledAt > new Date();
  }

  get isDelivered(): boolean {
    return (
      this.status === NotificationStatus.DELIVERED ||
      this.status === NotificationStatus.READ
    );
  }

  get isFailed(): boolean {
    return this.status === NotificationStatus.FAILED;
  }

  get canRetry(): boolean {
    return this.status === NotificationStatus.FAILED && !this.isExpired;
  }

  get priorityColor(): string {
    switch (this.priority) {
      case NotificationPriority.CRITICAL:
        return 'red';
      case NotificationPriority.URGENT:
        return 'orange';
      case NotificationPriority.HIGH:
        return 'yellow';
      case NotificationPriority.NORMAL:
        return 'blue';
      case NotificationPriority.LOW:
        return 'green';
      default:
        return 'blue';
    }
  }

  get statusColor(): string {
    switch (this.status) {
      case NotificationStatus.READ:
        return 'green';
      case NotificationStatus.DELIVERED:
        return 'blue';
      case NotificationStatus.SENT:
        return 'yellow';
      case NotificationStatus.PENDING:
        return 'gray';
      case NotificationStatus.FAILED:
        return 'red';
      case NotificationStatus.CANCELLED:
        return 'gray';
      default:
        return 'blue';
    }
  }

  get isQuietHours(): boolean {
    if (!this.userPreferences.quietHours) return false;

    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      timeZone: this.userPreferences.quietHours.timezone,
    });

    const start = this.userPreferences.quietHours.start;
    const end = this.userPreferences.quietHours.end;

    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // Handles overnight quiet hours (e.g., 22:00 to 06:00)
      return currentTime >= start || currentTime <= end;
    }
  }

  get shouldSend(): boolean {
    return !this.isExpired && !this.isScheduled && !this.isQuietHours;
  }

  get deliveryStatus(): string {
    if (this.isRead) return 'READ';
    if (this.isDelivered) return 'DELIVERED';
    if (this.isFailed) return 'FAILED';
    if (this.isScheduled) return 'SCHEDULED';
    return 'PENDING';
  }
}
