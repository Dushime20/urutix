import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Load } from './load.entity';
import { Trip } from './trip.entity';
import { Tenant } from './tenant.entity';

export enum DocumentType {
  BILL_OF_LADING = 'BILL_OF_LADING',
  PROOF_OF_DELIVERY = 'PROOF_OF_DELIVERY',
  PROOF_OF_PICKUP = 'PROOF_OF_PICKUP',
  INVOICE = 'INVOICE',
  COMMISSION_INVOICE = 'COMMISSION_INVOICE',
  INSURANCE_CERTIFICATE = 'INSURANCE_CERTIFICATE',
  CONTRACT = 'CONTRACT',
  WEIGHT_TICKET = 'WEIGHT_TICKET',
  DELIVERY_RECEIPT = 'DELIVERY_RECEIPT',
  DAMAGE_REPORT = 'DAMAGE_REPORT',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  SIGNED = 'SIGNED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

@Entity('load_documents')
@Index(['loadId', 'documentType'])
@Index(['tripId', 'documentType'])
@Index(['tenantId', 'createdAt'])
export class LoadDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  loadId: string;

  @Column('uuid', { nullable: true })
  tripId?: string;

  @Column('uuid', { nullable: true })
  brokerId?: string;

  @Column('uuid')
  uploadedById: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT,
  })
  status: DocumentStatus;

  // Document Details
  @Column('varchar')
  fileName: string;

  @Column('varchar')
  fileUrl: string;

  @Column('varchar', { nullable: true })
  fileType?: string;

  @Column('integer', { nullable: true })
  fileSize?: number; // in bytes

  @Column('varchar', { nullable: true })
  mimeType?: string;

  // Document Content (for generated documents)
  @Column('text', { nullable: true })
  documentContent?: string; // For BOL, Invoice templates

  @Column('jsonb', { nullable: true })
  documentData?: Record<string, any>; // Structured data for document generation

  // Signatures
  @Column('jsonb', { nullable: true })
  signatures?: Array<{
    signerId: string;
    signerName: string;
    signerRole: string;
    signedAt: Date;
    signatureMethod: 'DIGITAL' | 'E_SIGNATURE' | 'MANUAL';
    signatureData?: string;
    ipAddress?: string;
  }>;

  @Column('date', { nullable: true })
  signedAt?: Date;

  // Verification
  @Column('uuid', { nullable: true })
  verifiedById?: string;

  @Column('date', { nullable: true })
  verifiedAt?: Date;

  @Column('text', { nullable: true })
  verificationNotes?: string;

  // Expiry
  @Column('date', { nullable: true })
  expiresAt?: Date;

  // Metadata
  @Column('text', { nullable: true })
  description?: string;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brokerId' })
  broker?: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'verifiedById' })
  verifiedBy?: User;

  @ManyToOne(() => Load, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loadId' })
  load: Load;

  @ManyToOne(() => Trip, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tripId' })
  trip?: Trip;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}

