import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';

export enum DocumentType {
  // Driver-related documents
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  DRIVER_MEDICAL_CERT = 'DRIVER_MEDICAL_CERT',
  DRIVER_DRUG_TEST = 'DRIVER_DRUG_TEST',
  DRIVER_BACKGROUND_CHECK = 'DRIVER_BACKGROUND_CHECK',
  DRIVER_TRAINING_CERT = 'DRIVER_TRAINING_CERT',
  DRIVER_INSURANCE = 'DRIVER_INSURANCE',

  // Vehicle-related documents
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  VEHICLE_INSURANCE = 'VEHICLE_INSURANCE',
  VEHICLE_INSPECTION = 'VEHICLE_INSPECTION',
  VEHICLE_MAINTENANCE = 'VEHICLE_MAINTENANCE',
  VEHICLE_PERMIT = 'VEHICLE_PERMIT',

  // Cargo-related documents
  CARGO_MANIFEST = 'CARGO_MANIFEST',
  CARGO_INSURANCE = 'CARGO_INSURANCE',
  CARGO_CUSTOMS = 'CARGO_CUSTOMS',
  CARGO_WEIGHT_CERT = 'CARGO_WEIGHT_CERT',

  // Business documents
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  BUSINESS_INSURANCE = 'BUSINESS_INSURANCE',
  BUSINESS_TAX_CERT = 'BUSINESS_TAX_CERT',
  BUSINESS_PERMIT = 'BUSINESS_PERMIT',

  // User documents
  USER_ID_PROOF = 'USER_ID_PROOF',
  USER_ADDRESS_PROOF = 'USER_ADDRESS_PROOF',
  USER_BANK_DETAILS = 'USER_BANK_DETAILS',

  // Trip documents
  TRIP_PERMIT = 'TRIP_PERMIT',
  TRIP_ROUTE_PLAN = 'TRIP_ROUTE_PLAN',
  TRIP_WEIGHT_TICKET = 'TRIP_WEIGHT_TICKET',
  POD = 'POD', // Proof of Delivery

  // Financial documents
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  PAYMENT_PROOF = 'PAYMENT_PROOF',
  EXPENSE_RECEIPT = 'EXPENSE_RECEIPT',

  // Compliance documents
  SAFETY_CERT = 'SAFETY_CERT',
  ENVIRONMENTAL_CERT = 'ENVIRONMENTAL_CERT',
  QUALITY_CERT = 'QUALITY_CERT',

  // Other
  CONTRACT = 'CONTRACT',
  AGREEMENT = 'AGREEMENT',
  POLICY = 'POLICY',
  MANUAL = 'MANUAL',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

export enum DocumentPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum DocumentCategory {
  IDENTITY = 'IDENTITY',
  LICENSE = 'LICENSE',
  INSURANCE = 'INSURANCE',
  CERTIFICATION = 'CERTIFICATION',
  COMPLIANCE = 'COMPLIANCE',
  FINANCIAL = 'FINANCIAL',
  OPERATIONAL = 'OPERATIONAL',
  LEGAL = 'LEGAL',
  OTHER = 'OTHER',
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
}

@Entity('documents')
@Index(['entityType', 'entityId'])
@Index(['documentType', 'status'])
@Index(['category', 'priority'])
@Index(['tenantId', 'entityType'])
@Index(['expiryDate', 'status'])
@Index(['uploadedBy', 'createdAt'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column({
    type: 'enum',
    enum: EntityType,
    comment: 'Type of entity this document belongs to',
  })
  entityType: EntityType;

  @Column('uuid')
  entityId: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    comment: 'Specific type of document',
  })
  documentType: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentCategory,
    comment: 'Category of document for grouping',
  })
  category: DocumentCategory;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({
    type: 'enum',
    enum: DocumentPriority,
    default: DocumentPriority.NORMAL,
  })
  priority: DocumentPriority;

  @Column('character varying', { nullable: true })
  documentNumber?: string;

  @Column('text')
  title: string;

  @Column('text')
  description: string;

  @Column('text')
  fileName: string;

  @Column('text')
  originalFileName: string;

  @Column('text')
  fileUrl: string;

  @Column('text')
  thumbnailUrl?: string;

  @Column('integer')
  fileSize: number;

  @Column('character varying')
  mimeType: string;

  @Column('character varying', { nullable: true })
  fileExtension?: string;

  @Column('date', { nullable: true })
  issueDate?: Date;

  @Column('date', { nullable: true })
  expiryDate?: Date;

  @Column('boolean', { default: false })
  isExpired: boolean;

  @Column('boolean', { default: false })
  requiresRenewal: boolean;

  @Column('integer', { default: 30 })
  renewalReminderDays: number;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @Column('jsonb', { default: [] })
  tags: string[];

  @Column('uuid')
  uploadedBy: string;

  @Column('uuid', { nullable: true })
  verifiedBy?: string;

  @Column('timestamp', { nullable: true })
  verifiedAt?: Date;

  @Column('text', { nullable: true })
  verificationNotes?: string;

  @Column('jsonb', { default: {} })
  verificationData: Record<string, any>;

  @Column('jsonb', { default: [] })
  versions: Array<{
    version: number;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    uploadedAt: Date;
    uploadedBy: string;
    changeNotes?: string;
  }>;

  @Column('integer', { default: 1 })
  currentVersion: number;

  @Column('jsonb', { default: [] })
  accessControl: Array<{
    role: string;
    permissions: string[];
    grantedAt: Date;
    grantedBy: string;
  }>;

  @Column('jsonb', { default: [] })
  auditTrail: Array<{
    action: string;
    performedBy: string;
    performedAt: Date;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }>;

  @Column('boolean', { default: false })
  isPublic: boolean;

  @Column('boolean', { default: false })
  isConfidential: boolean;

  @Column('character varying', { nullable: true })
  encryptionKey?: string;

  @Column('jsonb', { default: {} })
  ocrData?: {
    extractedText?: string;
    confidence?: number;
    language?: string;
    processedAt?: Date;
  };

  @Column('jsonb', { default: {} })
  digitalSignature?: {
    signedBy: string;
    signedAt: Date;
    signatureHash: string;
    certificateInfo: Record<string, any>;
  };

  @Column('jsonb', { default: {} })
  complianceInfo?: {
    regulatoryBody?: string;
    complianceCode?: string;
    lastAuditDate?: Date;
    nextAuditDate?: Date;
    auditStatus?: string;
    complianceScore?: number;
  };

  @Column('jsonb', { default: {} })
  workflowInfo?: {
    currentStep: string;
    workflowId: string;
    assignedTo?: string;
    dueDate?: Date;
    status: string;
    comments: Array<{
      comment: string;
      commentedBy: string;
      commentedAt: Date;
    }>;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Virtual properties for business logic
  get isExpiringSoon(): boolean {
    if (!this.expiryDate) return false;
    const daysUntilExpiry = Math.ceil(
      (this.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry <= this.renewalReminderDays;
  }

  get isOverdue(): boolean {
    if (!this.expiryDate) return false;
    return this.expiryDate < new Date();
  }

  get statusColor(): string {
    switch (this.status) {
      case DocumentStatus.VERIFIED:
        return 'green';
      case DocumentStatus.PENDING:
        return 'yellow';
      case DocumentStatus.REJECTED:
        return 'red';
      case DocumentStatus.EXPIRED:
        return 'orange';
      case DocumentStatus.ARCHIVED:
        return 'gray';
      default:
        return 'blue';
    }
  }

  get priorityColor(): string {
    switch (this.priority) {
      case DocumentPriority.URGENT:
        return 'red';
      case DocumentPriority.HIGH:
        return 'orange';
      case DocumentPriority.NORMAL:
        return 'blue';
      case DocumentPriority.LOW:
        return 'green';
      default:
        return 'blue';
    }
  }
}
