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
import { UserProfile } from './user-profile.entity';

export enum UserDocumentType {
  // Identity Documents
  IDENTITY_DOCUMENT = 'IDENTITY_DOCUMENT',
  PASSPORT = 'PASSPORT',
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  
  // Address Documents
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
  UTILITY_BILL = 'UTILITY_BILL',
  
  // Business Documents
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  TAX_CERTIFICATE = 'TAX_CERTIFICATE',
  TRADE_LICENSE = 'TRADE_LICENSE',
  
  // Financial Documents
  BANK_STATEMENT = 'BANK_STATEMENT',
  CREDIT_REPORT = 'CREDIT_REPORT',
  FINANCIAL_STATEMENT = 'FINANCIAL_STATEMENT',
  
  // Professional Documents
  PROFESSIONAL_CERTIFICATE = 'PROFESSIONAL_CERTIFICATE',
  BROKER_LICENSE = 'BROKER_LICENSE',
  FINANCIAL_LICENSE = 'FINANCIAL_LICENSE',
  
  // Vehicle/Transport Documents
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  INSURANCE_CERTIFICATE = 'INSURANCE_CERTIFICATE',
  SAFETY_CERTIFICATE = 'SAFETY_CERTIFICATE',
  
  // Medical/Health Documents
  MEDICAL_CERTIFICATE = 'MEDICAL_CERTIFICATE',
  SAFETY_TRAINING_CERTIFICATE = 'SAFETY_TRAINING_CERTIFICATE',
  
  // Regulatory Documents
  REGULATORY_APPROVAL = 'REGULATORY_APPROVAL',
  COMPLIANCE_CERTIFICATE = 'COMPLIANCE_CERTIFICATE',
  BONDING_CERTIFICATE = 'BONDING_CERTIFICATE',
  
  // Other
  EXPERIENCE_CERTIFICATE = 'EXPERIENCE_CERTIFICATE',
  PROFESSIONAL_REFERENCE = 'PROFESSIONAL_REFERENCE',
  AUDIT_REPORT = 'AUDIT_REPORT',
  OTHER = 'OTHER',
}

export enum DocumentCategory {
  IDENTITY = 'IDENTITY',
  ADDRESS = 'ADDRESS',
  FINANCIAL = 'FINANCIAL',
  BUSINESS = 'BUSINESS',
  PROFESSIONAL = 'PROFESSIONAL',
  VEHICLE = 'VEHICLE',
  MEDICAL = 'MEDICAL',
  REGULATORY = 'REGULATORY',
  OTHER = 'OTHER',
}

@Entity('user_kyc_documents')
@Index(['userId'])
@Index(['userProfileId'])
@Index(['documentType'])
@Index(['documentCategory'])
@Index(['verified'])
@Index(['expiryDate'])
export class UserKycDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column('uuid', { name: 'user_profile_id' })
  userProfileId: string;

  @Column({
    type: 'enum',
    enum: UserDocumentType,
    name: 'document_type',
  })
  documentType: UserDocumentType;

  @Column({
    type: 'enum',
    enum: DocumentCategory,
    name: 'document_category',
  })
  documentCategory: DocumentCategory;

  @Column({ name: 'document_name' })
  documentName: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ nullable: true, name: 'file_size' })
  fileSize?: number;

  @Column({ nullable: true, name: 'mime_type' })
  mimeType?: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ nullable: true, name: 'verified_by' })
  verifiedBy?: string;

  @Column({ nullable: true, name: 'verified_at' })
  verifiedAt?: Date;

  @Column({ type: 'date', nullable: true, name: 'expiry_date' })
  expiryDate?: Date;

  @Column({ nullable: true })
  notes?: string;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => UserProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_profile_id' })
  userProfile: UserProfile;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifier?: User;
}