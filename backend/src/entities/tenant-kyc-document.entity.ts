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
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

export enum DocumentType {
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  TAX_CERTIFICATE = 'TAX_CERTIFICATE',
  IDENTITY_DOCUMENT = 'IDENTITY_DOCUMENT',
  BANK_STATEMENT = 'BANK_STATEMENT',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
  INSURANCE_CERTIFICATE = 'INSURANCE_CERTIFICATE',
  OTHER = 'OTHER',
}

@Entity('tenant_kyc_documents')
@Index(['tenantId'])
@Index(['documentType'])
@Index(['verified'])
export class TenantKycDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType;

  @Column()
  documentName: string;

  @Column()
  filePath: string;

  @Column({ nullable: true })
  fileSize?: number;

  @Column({ nullable: true })
  mimeType?: string;

  @Column({ nullable: true })
  uploadedBy?: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ nullable: true })
  verifiedBy?: string;

  @Column({ nullable: true })
  verifiedAt?: Date;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploadedBy' })
  uploader?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verifiedBy' })
  verifier?: User;
}