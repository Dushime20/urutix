import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './../entities/user.entity';
import { UserProfile, KycStatus, KycRequirementLevel } from './../entities/user-profile.entity';
import { UserKycDocument, UserDocumentType, DocumentCategory } from './../entities/user-kyc-document.entity';
import { KycRoleRequirements } from './../entities/kyc-role-requirements.entity';
import { UserKycAuditLog, UserKycAuditAction } from './../entities/user-kyc-audit-log.entity';

export interface UserKycSubmissionData {
  // Personal Information
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  
  // Contact Information
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  
  // Business Information (for business roles)
  companyName?: string;
  businessType?: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  businessAddress?: string;
  
  // Financial Information
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  annualIncome?: number;
  
  // Professional Information
  licenseNumber?: string;
  licenseExpiryDate?: string;
  yearsOfExperience?: number;
  previousEmployer?: string;
  
  // Role-specific data
  roleSpecificData?: Record<string, any>;
}

export interface UserKycDocumentUpload {
  documentType: UserDocumentType;
  documentCategory: DocumentCategory;
  documentName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  expiryDate?: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class UserKycService {
  private readonly logger = new Logger(UserKycService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(UserKycDocument)
    private readonly userKycDocumentRepository: Repository<UserKycDocument>,
    @InjectRepository(KycRoleRequirements)
    private readonly kycRoleRequirementsRepository: Repository<KycRoleRequirements>,
    @InjectRepository(UserKycAuditLog)
    private readonly userKycAuditLogRepository: Repository<UserKycAuditLog>,
  ) {}

  async submitUserKyc(
    userId: string,
    kycData: UserKycSubmissionData,
    submittedBy?: string,
  ): Promise<UserProfile> {
    this.logger.log(`📝 Submitting user KYC for user ${userId}`);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userProfile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    // Get KYC requirements for user role
    const requirements = await this.getKycRequirements(user.role);
    
    // Validate KYC data based on role requirements
    this.validateUserKycData(kycData, requirements);

    const oldStatus = userProfile.kycStatus;
    const newStatus = KycStatus.UNDER_REVIEW;

    // Update user profile with KYC data
    userProfile.kycData = { ...userProfile.kycData, ...kycData };
    userProfile.kycStatus = newStatus;
    userProfile.kycSubmittedAt = new Date();
    userProfile.kycRequirementLevel = requirements.requirementLevel;

    // Update specific fields from KYC data
    if (kycData.firstName) userProfile.firstName = kycData.firstName;
    if (kycData.lastName) userProfile.lastName = kycData.lastName;
    if (kycData.companyName) userProfile.companyName = kycData.companyName;
    if (kycData.taxId) userProfile.taxId = kycData.taxId;
    if (kycData.address) userProfile.address = kycData.address;

    const updatedProfile = await this.userProfileRepository.save(userProfile);

    // Create audit log entry
    await this.createUserKycAuditLog({
      userId,
      userProfileId: userProfile.id,
      action: UserKycAuditAction.SUBMITTED,
      oldStatus: oldStatus,
      newStatus: newStatus,
      performedBy: submittedBy || userId,
      notes: 'User KYC data submitted for review',
      metadata: { submissionData: kycData, role: user.role },
    });

    this.logger.log(`✅ User KYC submitted successfully for user ${userId}`);
    return updatedProfile;
  }

  async updateUserKycStatus(
    userId: string,
    status: KycStatus,
    reviewedBy: string,
    notes?: string,
  ): Promise<UserProfile> {
    this.logger.log(`📝 Updating user KYC status for user ${userId} to ${status}`);

    const userProfile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    const oldStatus = userProfile.kycStatus;

    // Update user profile KYC status
    userProfile.kycStatus = status;
    userProfile.kycReviewedBy = reviewedBy;
    userProfile.kycNotes = notes;

    if (status === KycStatus.VERIFIED) {
      userProfile.kycVerifiedAt = new Date();
      // Calculate compliance score based on verification status
      userProfile.complianceScore = this.calculateComplianceScore(userProfile);
    }

    const updatedProfile = await this.userProfileRepository.save(userProfile);

    // Create audit log entry
    await this.createUserKycAuditLog({
      userId,
      userProfileId: userProfile.id,
      action: this.getAuditActionFromStatus(status),
      oldStatus: oldStatus,
      newStatus: status,
      performedBy: reviewedBy,
      notes,
      metadata: { reviewedBy, reviewDate: new Date() },
    });

    this.logger.log(`✅ User KYC status updated successfully for user ${userId}`);
    return updatedProfile;
  }

  async uploadUserKycDocument(
    userId: string,
    documentData: UserKycDocumentUpload,
  ): Promise<UserKycDocument> {
    this.logger.log(`📄 Uploading user KYC document for user ${userId}`);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userProfile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    // Create document record
    const document = this.userKycDocumentRepository.create({
      userId,
      userProfileId: userProfile.id,
      ...documentData,
    });

    const savedDocument = await this.userKycDocumentRepository.save(document);

    // Create audit log entry
    await this.createUserKycAuditLog({
      userId,
      userProfileId: userProfile.id,
      action: UserKycAuditAction.DOCUMENT_UPLOADED,
      performedBy: userId,
      notes: `Document uploaded: ${documentData.documentName}`,
      metadata: {
        documentId: savedDocument.id,
        documentType: documentData.documentType,
        documentCategory: documentData.documentCategory,
      },
    });

    this.logger.log(`✅ User KYC document uploaded successfully for user ${userId}`);
    return savedDocument;
  }

  async verifyUserKycDocument(
    documentId: string,
    verifiedBy: string,
    verified: boolean,
    notes?: string,
  ): Promise<UserKycDocument> {
    this.logger.log(`📄 Verifying user KYC document ${documentId}`);

    const document = await this.userKycDocumentRepository.findOne({
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

    const updatedDocument = await this.userKycDocumentRepository.save(document);

    // Update user profile verification flags based on document category
    await this.updateUserVerificationFlags(document.userId, document.documentCategory, verified);

    // Create audit log entry
    await this.createUserKycAuditLog({
      userId: document.userId,
      userProfileId: document.userProfileId,
      action: verified ? UserKycAuditAction.DOCUMENT_VERIFIED : UserKycAuditAction.DOCUMENT_REJECTED,
      performedBy: verifiedBy,
      notes: notes || `Document ${verified ? 'verified' : 'rejected'}`,
      metadata: {
        documentId,
        documentType: document.documentType,
        documentCategory: document.documentCategory,
        verified,
      },
    });

    this.logger.log(`✅ User KYC document verification updated for document ${documentId}`);
    return updatedDocument;
  }

  async getUserKycProfile(userId: string): Promise<UserProfile> {
    const userProfile = await this.userProfileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    return userProfile;
  }

  async getUsersByKycStatus(status: KycStatus, role?: UserRole, tenantId?: string): Promise<UserProfile[]> {
    const query = this.userProfileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.kycStatus = :status', { status });

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    if (tenantId) {
      query.andWhere('user.tenantId = :tenantId', { tenantId });
    }

    return query
      .orderBy('profile.kycSubmittedAt', 'DESC')
      .getMany();
  }

  async getUserKycDocuments(userId: string): Promise<UserKycDocument[]> {
    return this.userKycDocumentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserKycAuditLog(userId: string): Promise<UserKycAuditLog[]> {
    return this.userKycAuditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['performer'],
    });
  }

  async getKycRequirements(role: UserRole): Promise<KycRoleRequirements> {
    const requirements = await this.kycRoleRequirementsRepository.findOne({
      where: { role },
    });

    if (!requirements) {
      // Return default basic requirements if none found
      return {
        id: '',
        role,
        requirementLevel: KycRequirementLevel.BASIC,
        requiredDocuments: ['IDENTITY_DOCUMENT'],
        optionalDocuments: [],
        verificationSteps: ['identity_verification'],
        autoApprovalEligible: false,
        description: 'Basic KYC requirements',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return requirements;
  }

  async getUserKycStats(role?: UserRole, tenantId?: string): Promise<{
    total: number;
    pending: number;
    underReview: number;
    verified: number;
    rejected: number;
    byRole?: Record<string, number>;
  }> {
    const query = this.userProfileRepository.createQueryBuilder('profile')
      .leftJoin('profile.user', 'user');
    
    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    if (tenantId) {
      query.andWhere('user.tenantId = :tenantId', { tenantId });
    }

    const [total, pending, underReview, verified, rejected] = await Promise.all([
      query.getCount(),
      query.clone().andWhere('profile.kycStatus = :status', { status: KycStatus.PENDING }).getCount(),
      query.clone().andWhere('profile.kycStatus = :status', { status: KycStatus.UNDER_REVIEW }).getCount(),
      query.clone().andWhere('profile.kycStatus = :status', { status: KycStatus.VERIFIED }).getCount(),
      query.clone().andWhere('profile.kycStatus = :status', { status: KycStatus.REJECTED }).getCount(),
    ]);

    const stats = {
      total,
      pending,
      underReview,
      verified,
      rejected,
    };

    // If no specific role requested, get stats by role
    if (!role) {
      const roleStats = await this.userProfileRepository
        .createQueryBuilder('profile')
        .leftJoin('profile.user', 'user')
        .select('user.role', 'role')
        .addSelect('COUNT(*)', 'count')
        .groupBy('user.role')
        .getRawMany();

      const byRole = roleStats.reduce((acc, stat) => {
        acc[stat.role] = parseInt(stat.count);
        return acc;
      }, {});

      return { ...stats, byRole };
    }

    return stats;
  }

  private validateUserKycData(kycData: UserKycSubmissionData, requirements: KycRoleRequirements): void {
    const errors: string[] = [];

    // Basic validation
    if (!kycData.firstName) {
      errors.push('First name is required');
    }

    if (!kycData.lastName) {
      errors.push('Last name is required');
    }

    if (!kycData.email) {
      errors.push('Email is required');
    }

    // Role-specific validation
    if (requirements.requirementLevel === KycRequirementLevel.ENHANCED || 
        requirements.requirementLevel === KycRequirementLevel.PREMIUM) {
      if (!kycData.address) {
        errors.push('Address is required for enhanced KYC');
      }
    }

    if (requirements.verificationSteps.includes('business_verification')) {
      if (!kycData.companyName) {
        errors.push('Company name is required for business verification');
      }
    }

    if (requirements.verificationSteps.includes('financial_verification')) {
      if (!kycData.bankAccountNumber) {
        errors.push('Bank account information is required for financial verification');
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(`User KYC validation failed: ${errors.join(', ')}`);
    }
  }

  private async updateUserVerificationFlags(
    userId: string,
    documentCategory: DocumentCategory,
    verified: boolean,
  ): Promise<void> {
    const userProfile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (!userProfile) return;

    switch (documentCategory) {
      case DocumentCategory.IDENTITY:
        userProfile.identityVerified = verified;
        break;
      case DocumentCategory.ADDRESS:
        userProfile.addressVerified = verified;
        break;
      case DocumentCategory.FINANCIAL:
        userProfile.financialVerified = verified;
        break;
      case DocumentCategory.BUSINESS:
        userProfile.businessVerified = verified;
        break;
    }

    // Update compliance score
    userProfile.complianceScore = this.calculateComplianceScore(userProfile);

    await this.userProfileRepository.save(userProfile);
  }

  private calculateComplianceScore(userProfile: UserProfile): number {
    let score = 0;
    const maxScore = 100;

    // Base score for KYC status
    if (userProfile.kycStatus === KycStatus.VERIFIED) score += 40;
    else if (userProfile.kycStatus === KycStatus.UNDER_REVIEW) score += 20;

    // Verification flags
    if (userProfile.identityVerified) score += 20;
    if (userProfile.addressVerified) score += 15;
    if (userProfile.financialVerified) score += 15;
    if (userProfile.businessVerified) score += 10;

    return Math.min(score, maxScore);
  }

  private async createUserKycAuditLog(data: {
    userId: string;
    userProfileId: string;
    action: UserKycAuditAction;
    oldStatus?: string;
    newStatus?: string;
    performedBy?: string;
    notes?: string;
    metadata?: Record<string, any>;
  }): Promise<UserKycAuditLog> {
    const auditLog = this.userKycAuditLogRepository.create(data);
    return this.userKycAuditLogRepository.save(auditLog);
  }

  private getAuditActionFromStatus(status: KycStatus): UserKycAuditAction {
    switch (status) {
      case KycStatus.VERIFIED:
        return UserKycAuditAction.APPROVED;
      case KycStatus.REJECTED:
        return UserKycAuditAction.REJECTED;
      case KycStatus.UNDER_REVIEW:
        return UserKycAuditAction.UNDER_REVIEW;
      default:
        return UserKycAuditAction.SUBMITTED;
    }
  }
}