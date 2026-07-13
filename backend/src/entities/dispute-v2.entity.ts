import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Trip } from './trip.entity';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum DisputeStatusV2 {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ASSIGNED = 'ASSIGNED',
  INVESTIGATING = 'INVESTIGATING',
  AWAITING_INFORMATION = 'AWAITING_INFORMATION',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
}

export enum DisputeCategory {
  // Existing
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  DELIVERY_DELAY = 'DELIVERY_DELAY',
  CARGO_DAMAGE = 'CARGO_DAMAGE',
  CARGO_LOSS = 'CARGO_LOSS',
  ROUTE_VIOLATION = 'ROUTE_VIOLATION',
  CONTRACT_VIOLATION = 'CONTRACT_VIOLATION',
  DRIVER_MISCONDUCT = 'DRIVER_MISCONDUCT',
  VEHICLE_DAMAGE = 'VEHICLE_DAMAGE',
  LOADING_DELAY = 'LOADING_DELAY',
  UNLOADING_DELAY = 'UNLOADING_DELAY',
  DOCUMENTATION_ISSUE = 'DOCUMENTATION_ISSUE',
  FRAUD_SUSPECTED = 'FRAUD_SUSPECTED',
  OTHER = 'OTHER',
  // Extended support categories
  TRUCK_BREAKDOWN = 'TRUCK_BREAKDOWN',
  AUCTION_ISSUE = 'AUCTION_ISSUE',
  BROKER_COMPLAINT = 'BROKER_COMPLAINT',
  LENDER_COMPLAINT = 'LENDER_COMPLAINT',
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
  INSURANCE_CLAIM = 'INSURANCE_CLAIM',
  ACCOUNT_SUSPENSION = 'ACCOUNT_SUSPENSION',
  TECHNICAL_PROBLEM = 'TECHNICAL_PROBLEM',
  BILLING_ISSUE = 'BILLING_ISSUE',
  SUBSCRIPTION_ISSUE = 'SUBSCRIPTION_ISSUE',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  SECURITY_CONCERN = 'SECURITY_CONCERN',
}

// Support ticket assignment roles
export enum SupportAssigneeRole {
  SUPPORT_OFFICER = 'SUPPORT_OFFICER',
  OPERATIONS_MANAGER = 'OPERATIONS_MANAGER',
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  COMPLIANCE_OFFICER = 'COMPLIANCE_OFFICER',
  LEGAL_OFFICER = 'LEGAL_OFFICER',
  ADMIN = 'ADMIN',
}

export enum DisputePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum DisputeDecision {
  FAVOR_COMPLAINANT = 'FAVOR_COMPLAINANT',
  FAVOR_RESPONDENT = 'FAVOR_RESPONDENT',
  MUTUAL_SETTLEMENT = 'MUTUAL_SETTLEMENT',
}

export enum EscalationReason {
  SLA_BREACH = 'SLA_BREACH',
  CRITICAL_UNRESPONDED = 'CRITICAL_UNRESPONDED',
  MULTIPLE_REOPENS = 'MULTIPLE_REOPENS',
  FRAUD_DETECTED = 'FRAUD_DETECTED',
  PAYMENT_DISPUTE_THRESHOLD = 'PAYMENT_DISPUTE_THRESHOLD',
  MANUAL = 'MANUAL',
}

// ─── DisputeV2 ────────────────────────────────────────────────────────────────

@Entity('disputes_v2')
@Index(['tenantId', 'status', 'createdAt'])
@Index(['tenantId', 'referenceNumber'], { unique: true })
@Index(['complainantUserId', 'status'])
@Index(['respondentUserId', 'status'])
@Index(['tripId'])
@Index(['assignedToUserId', 'status'])
@Index(['ticketNumber'], { unique: true })
@Index(['slaFirstResponseDue'])
@Index(['slaResolutionDue'])
export class DisputeV2 {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column({ length: 50 })
  referenceNumber: string;

  // Human-readable support ticket number: SUP-2026-000001
  @Column({ length: 30, nullable: true })
  ticketNumber?: string;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: DisputeCategory, default: DisputeCategory.OTHER })
  category: DisputeCategory;

  @Column({ type: 'enum', enum: DisputePriority, default: DisputePriority.MEDIUM })
  priority: DisputePriority;

  @Column({ type: 'enum', enum: DisputeStatusV2, default: DisputeStatusV2.OPEN })
  status: DisputeStatusV2;

  // Parties
  @Column('uuid')
  complainantUserId: string;

  @Column('uuid', { nullable: true })
  respondentUserId?: string;

  // Assignment
  @Column('uuid', { nullable: true })
  assignedToUserId?: string;

  @Column({ type: 'enum', enum: SupportAssigneeRole, nullable: true })
  assignedRole?: SupportAssigneeRole;

  @Column({ nullable: true })
  assignedAt?: Date;

  // Related entities (all optional)
  @Column('uuid', { nullable: true })
  tripId?: string;

  @Column('uuid', { nullable: true })
  shipmentId?: string;

  @Column('uuid', { nullable: true })
  truckId?: string;

  @Column('uuid', { nullable: true })
  contractId?: string;

  @Column('uuid', { nullable: true })
  invoiceId?: string;

  @Column('uuid', { nullable: true })
  auctionId?: string;

  @Column('uuid', { nullable: true })
  paymentId?: string;

  @Column('uuid', { nullable: true })
  driverId?: string;

  @Column('uuid', { nullable: true })
  brokerId?: string;

  @Column('uuid', { nullable: true })
  lenderId?: string;

  // Extra context
  @Column({ length: 500, nullable: true })
  location?: string;

  @Column({ nullable: true })
  incidentDate?: Date;

  @Column('text', { nullable: true })
  additionalNotes?: string;

  // SLA tracking
  @Column({ nullable: true })
  slaFirstResponseDue?: Date;

  @Column({ nullable: true })
  slaResolutionDue?: Date;

  @Column({ nullable: true })
  firstResponseAt?: Date;

  @Column({ default: false })
  slaFirstResponseBreached: boolean;

  @Column({ default: false })
  slaResolutionBreached: boolean;

  // Escalation tracking
  @Column({ default: 0 })
  reopenCount: number;

  @Column({ default: 0 })
  escalationLevel: number;

  @Column({ type: 'enum', enum: EscalationReason, nullable: true })
  escalationReason?: EscalationReason;

  @Column({ nullable: true })
  escalatedAt?: Date;

  @Column('uuid', { nullable: true })
  escalatedByUserId?: string;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  closedAt?: Date;

  @Column({ nullable: true })
  resolvedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @ManyToOne('User', { nullable: true, eager: false })
  @JoinColumn({ name: 'complainantUserId' })
  complainant: User;

  @ManyToOne('User', { nullable: true, eager: false })
  @JoinColumn({ name: 'respondentUserId' })
  respondent: User;

  @ManyToOne('User', { nullable: true, eager: false })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedTo: User;

  @ManyToOne('Trip', { nullable: true, eager: false })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @OneToMany('DisputeMessage', (m: any) => m.dispute, { cascade: false })
  messages: any[];

  @OneToMany('DisputeAttachment', (a: any) => a.dispute, { cascade: false })
  attachments: any[];

  @OneToMany('DisputeResolutionRecord', (r: any) => r.dispute, { cascade: false })
  resolutions: any[];

  @OneToMany('DisputeAuditLog', (l: any) => l.dispute, { cascade: false })
  auditLogs: any[];

  @OneToMany('DisputeAssignment', (a: any) => a.dispute, { cascade: false })
  assignments: any[];

  @OneToMany('DisputeEscalation', (e: any) => e.dispute, { cascade: false })
  escalations: any[];
}

// ─── DisputeMessage ───────────────────────────────────────────────────────────

@Entity('dispute_messages')
@Index(['disputeId', 'createdAt'])
export class DisputeMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  disputeId: string;

  @Column('uuid')
  senderId: string;

  @Column('text')
  message: string;

  @Column({ default: false })
  isInternal: boolean; // admin-only notes

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('DisputeV2', (d: any) => d.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'disputeId' })
  dispute: DisputeV2;

  @ManyToOne('User', { eager: false })
  @JoinColumn({ name: 'senderId' })
  sender: User;
}

// ─── DisputeAttachment ────────────────────────────────────────────────────────

@Entity('dispute_attachments')
@Index(['disputeId'])
export class DisputeAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  disputeId: string;

  @Column('uuid')
  uploadedBy: string;

  @Column({ length: 255 })
  fileName: string;

  @Column('text')
  fileUrl: string;

  @Column({ length: 100, nullable: true })
  fileType?: string;

  @Column({ nullable: true })
  fileSize?: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('DisputeV2', (d: any) => d.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'disputeId' })
  dispute: DisputeV2;

  @ManyToOne('User', { eager: false })
  @JoinColumn({ name: 'uploadedBy' })
  uploader: User;
}

// ─── DisputeResolutionRecord ──────────────────────────────────────────────────

@Entity('dispute_resolutions')
@Index(['disputeId'])
export class DisputeResolutionRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  disputeId: string;

  @Column('uuid')
  resolvedBy: string;

  @Column({ type: 'enum', enum: DisputeDecision })
  decision: DisputeDecision;

  @Column('text')
  resolutionSummary: string;

  @Column('text', { nullable: true })
  adminNotes?: string;

  @Column()
  resolvedAt: Date;

  @ManyToOne('DisputeV2', (d: any) => d.resolutions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'disputeId' })
  dispute: DisputeV2;

  @ManyToOne('User', { eager: false })
  @JoinColumn({ name: 'resolvedBy' })
  resolver: User;
}

// ─── DisputeAuditLog ──────────────────────────────────────────────────────────

@Entity('dispute_audit_logs')
@Index(['disputeId', 'createdAt'])
export class DisputeAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  disputeId: string;

  @Column({ length: 100 })
  action: string;

  @Column('uuid')
  performedBy: string;

  @Column('jsonb', { nullable: true })
  oldValue?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  newValue?: Record<string, any>;

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('DisputeV2', (d: any) => d.auditLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'disputeId' })
  dispute: DisputeV2;

  @ManyToOne('User', { eager: false })
  @JoinColumn({ name: 'performedBy' })
  actor: User;
}

// ─── DisputeAssignment ────────────────────────────────────────────────────────

@Entity('dispute_assignments')
@Index(['disputeId', 'createdAt'])
export class DisputeAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  disputeId: string;

  @Column('uuid')
  assignedByUserId: string;

  @Column('uuid')
  assignedToUserId: string;

  @Column({ type: 'enum', enum: SupportAssigneeRole, nullable: true })
  assignedRole?: SupportAssigneeRole;

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('DisputeV2', (d: any) => d.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'disputeId' })
  dispute: DisputeV2;

  @ManyToOne('User', { eager: false })
  @JoinColumn({ name: 'assignedByUserId' })
  assignedBy: User;

  @ManyToOne('User', { eager: false })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedTo: User;
}

// ─── DisputeEscalation ────────────────────────────────────────────────────────

@Entity('dispute_escalations')
@Index(['disputeId', 'createdAt'])
export class DisputeEscalation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  disputeId: string;

  @Column('uuid')
  escalatedByUserId: string;

  @Column({ type: 'enum', enum: EscalationReason })
  reason: EscalationReason;

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ default: 1 })
  escalationLevel: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('DisputeV2', (d: any) => d.escalations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'disputeId' })
  dispute: DisputeV2;

  @ManyToOne('User', { eager: false })
  @JoinColumn({ name: 'escalatedByUserId' })
  escalatedBy: User;
}
