import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, KycStatus } from '../entities/tenant.entity';
import { TenantKycDocument, DocumentType } from '../entities/tenant-kyc-document.entity';
import { TenantKycAuditLog, KycAuditAction } from '../entities/tenant-kyc-audit-log.entity';

export interface KycSubmissionData {
  registrationNumber?: string;
  taxId?: string;
  businessType?: string;
  businessDescription?: string;
  companyAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  bankAccountNumber?: string;
  bankName?: string;
  additionalInfo?: Record<string, any>;
}

export interface KycDocumentUpload {
  documentType: DocumentType;
  documentName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: string;
}

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantKycDocument)
    private readonly kycDocumentRepository: Repository<TenantKycDocument>,
    @InjectRepository(TenantKycAuditLog)
    private readonly kycAuditLogRepository: Repository<TenantKycAuditLog>,
  ) {}

  async submitKyc(tenantId: string, kycData: KycSubmissionData, submittedBy?: string): Promise<Tenant> {
    this.logger.log(`📝 Submitting KYC for tenant ${tenantId}`);

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Validate KYC data
    this.validateKycData(kycData);

    const oldStatus = tenant.kycStatus;
    const newStatus = KycStatus.SUBMITTED;

    // Update tenant KYC data
    tenant.kycData = { ...tenant.kycData, ...kycData };
    tenant.kycStatus = newStatus;
    tenant.kycSubmittedAt = new Date();

    // Save tenant
    const updatedTenant = await this.tenantRepository.save(tenant);

    // Create audit log entry
    await this.createAuditLog({
      tenantId,
      action: KycAuditAction.SUBMITTED,
      oldStatus,
      newStatus,
      performedBy: submittedBy,
      notes: 'KYC data submitted for review',
      metadata: { submissionData: kycData },
    });

    this.logger.log(`✅ KYC submitted successfully for tenant ${tenantId}`);
    return updatedTenant;
  }

  async updateKycStatus(
    tenantId: string,
    status: KycStatus,
    reviewedBy: string,
    notes?: string,
  ): Promise<Tenant> {
    this.logger.log(`📝 Updating KYC status for tenant ${tenantId} to ${status}`);

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const oldStatus = tenant.kycStatus;

    // Update tenant KYC status
    tenant.kycStatus = status;
    // tenant.kycReviewedBy = reviewedBy; // Column doesn't exist in database
    tenant.kycNotes = notes;

    if (status === KycStatus.APPROVED) {
      tenant.kycVerifiedAt = new Date();
    }

    // Save tenant
    const updatedTenant = await this.tenantRepository.save(tenant);

    // Create audit log entry
    await this.createAuditLog({
      tenantId,
      action: this.getAuditActionFromStatus(status),
      oldStatus,
      newStatus: status,
      performedBy: reviewedBy,
      notes,
      metadata: { reviewedBy, reviewDate: new Date() },
    });

    this.logger.log(`✅ KYC status updated successfully for tenant ${tenantId}`);
    return updatedTenant;
  }

  async uploadKycDocument(tenantId: string, documentData: KycDocumentUpload): Promise<TenantKycDocument> {
    this.logger.log(`📄 Uploading KYC document for tenant ${tenantId}`);

    // Verify tenant exists
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Create document record
    const document = this.kycDocumentRepository.create({
      tenantId,
      ...documentData,
    });

    const savedDocument = await this.kycDocumentRepository.save(document);

    // Create audit log entry
    await this.createAuditLog({
      tenantId,
      action: KycAuditAction.DOCUMENT_UPLOADED,
      performedBy: documentData.uploadedBy,
      notes: `Document uploaded: ${documentData.documentName}`,
      metadata: {
        documentId: savedDocument.id,
        documentType: documentData.documentType,
        documentName: documentData.documentName,
      },
    });

    this.logger.log(`✅ KYC document uploaded successfully for tenant ${tenantId}`);
    return savedDocument;
  }

  async verifyKycDocument(
    documentId: string,
    verifiedBy: string,
    verified: boolean,
    notes?: string,
  ): Promise<TenantKycDocument> {
    this.logger.log(`📄 Verifying KYC document ${documentId}`);

    const document = await this.kycDocumentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Update document verification status
    document.verified = verified;
    document.verifiedBy = verifiedBy;
    document.verifiedAt = new Date();
    document.notes = notes;

    const updatedDocument = await this.kycDocumentRepository.save(document);

    // Create audit log entry
    await this.createAuditLog({
      tenantId: document.tenantId,
      action: verified ? KycAuditAction.DOCUMENT_VERIFIED : KycAuditAction.DOCUMENT_REJECTED,
      performedBy: verifiedBy,
      notes: notes || `Document ${verified ? 'verified' : 'rejected'}`,
      metadata: {
        documentId,
        documentType: document.documentType,
        verified,
      },
    });

    this.logger.log(`✅ KYC document verification updated for document ${documentId}`);
    return updatedDocument;
  }

  async getTenantsByKycStatus(status: KycStatus): Promise<Tenant[]> {
    return this.tenantRepository.find({
      where: { kycStatus: status },
      order: { kycSubmittedAt: 'DESC' },
    });
  }

  async getKycDocuments(tenantId: string): Promise<TenantKycDocument[]> {
    return this.kycDocumentRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async getKycAuditLog(tenantId: string): Promise<TenantKycAuditLog[]> {
    return this.kycAuditLogRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      relations: ['performer'],
    });
  }

  async getKycStats(): Promise<{
    total: number;
    pending: number;
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
    incomplete: number;
  }> {
    const [total, pending, submitted, underReview, approved, rejected, incomplete] = await Promise.all([
      this.tenantRepository.count(),
      this.tenantRepository.count({ where: { kycStatus: KycStatus.PENDING } }),
      this.tenantRepository.count({ where: { kycStatus: KycStatus.SUBMITTED } }),
      this.tenantRepository.count({ where: { kycStatus: KycStatus.UNDER_REVIEW } }),
      this.tenantRepository.count({ where: { kycStatus: KycStatus.APPROVED } }),
      this.tenantRepository.count({ where: { kycStatus: KycStatus.REJECTED } }),
      this.tenantRepository.count({ where: { kycStatus: KycStatus.INCOMPLETE } }),
    ]);

    return {
      total,
      pending,
      submitted,
      underReview,
      approved,
      rejected,
      incomplete,
    };
  }

  private validateKycData(kycData: KycSubmissionData): void {
    const errors: string[] = [];

    if (!kycData.registrationNumber && !kycData.taxId) {
      errors.push('Either registration number or tax ID is required');
    }

    if (!kycData.businessType) {
      errors.push('Business type is required');
    }

    if (!kycData.contactPerson) {
      errors.push('Contact person is required');
    }

    if (!kycData.contactEmail) {
      errors.push('Contact email is required');
    }

    if (errors.length > 0) {
      throw new BadRequestException(`KYC validation failed: ${errors.join(', ')}`);
    }
  }

  private async createAuditLog(data: {
    tenantId: string;
    action: KycAuditAction;
    oldStatus?: KycStatus;
    newStatus?: KycStatus;
    performedBy?: string;
    notes?: string;
    metadata?: Record<string, any>;
  }): Promise<TenantKycAuditLog> {
    const auditLog = this.kycAuditLogRepository.create(data);
    return this.kycAuditLogRepository.save(auditLog);
  }

  private getAuditActionFromStatus(status: KycStatus): KycAuditAction {
    switch (status) {
      case KycStatus.APPROVED:
        return KycAuditAction.APPROVED;
      case KycStatus.REJECTED:
        return KycAuditAction.REJECTED;
      case KycStatus.INCOMPLETE:
        return KycAuditAction.INCOMPLETE;
      case KycStatus.UNDER_REVIEW:
        return KycAuditAction.UNDER_REVIEW;
      default:
        return KycAuditAction.SUBMITTED;
    }
  }
}