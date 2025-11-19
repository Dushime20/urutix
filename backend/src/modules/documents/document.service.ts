import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, Between, IsNull, Not } from 'typeorm';
import { Document, DocumentType, DocumentStatus, DocumentPriority, DocumentCategory, EntityType } from '../../entities/document.entity';
import { NotificationType, NotificationCategory, NotificationPriority, NotificationChannel } from '../../entities/notification.entity';
import { CreateDocumentDto, UpdateDocumentDto, DocumentFilterDto, DocumentSearchDto } from './dto/document.dto';
import { FileUploadService } from '../file-upload/file-upload.service';
import { NotificationService } from '../notifications/notification.service';
import { UserService } from '../users/user.service';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private fileUploadService: FileUploadService,
    private notificationService: NotificationService,
    private userService: UserService,
  ) {}

  /**
   * Create a new document
   */
  async createDocument(createDocumentDto: CreateDocumentDto, uploadedBy: string, tenantId: string): Promise<Document> {
    try {
      // Validate entity exists
      await this.validateEntityExists(createDocumentDto.entityType, createDocumentDto.entityId);

      // Upload file if provided
      let fileUrl = createDocumentDto.fileUrl;
      let thumbnailUrl = '';
      if (createDocumentDto.file) {
        const uploadResult = await this.fileUploadService.uploadFile(createDocumentDto.file, 'documents');
        fileUrl = uploadResult.fileUrl;
        thumbnailUrl = uploadResult.thumbnailUrl || fileUrl; // Use thumbnail if available, otherwise use fileUrl
      } else if (fileUrl) {
        // If fileUrl is provided but no file, use fileUrl as thumbnail for images
        thumbnailUrl = fileUrl;
      }

      // Ensure required fields have values
      if (!fileUrl && !createDocumentDto.file) {
        throw new BadRequestException('Either a file or fileUrl must be provided');
      }

      // Create document
      const document = this.documentRepository.create({
        ...createDocumentDto,
        description: createDocumentDto.description || '',
        fileUrl: fileUrl || '',
        thumbnailUrl: thumbnailUrl || fileUrl || '', // Ensure thumbnailUrl is never null
        uploadedBy,
        tenantId,
        status: DocumentStatus.PENDING,
        currentVersion: 1,
        versions: [{
          version: 1,
          fileUrl: fileUrl || '',
          fileName: createDocumentDto.fileName,
          fileSize: createDocumentDto.fileSize || 0,
          uploadedAt: new Date(),
          uploadedBy,
          changeNotes: 'Initial upload'
        }],
        auditTrail: [{
          action: 'CREATED',
          performedBy: uploadedBy,
          performedAt: new Date(),
          details: { method: 'upload' }
        }]
      });

      const savedDocument = await this.documentRepository.save(document);

      // Send notification if required
      if (createDocumentDto.sendNotification) {
        await this.notifyDocumentUpload(savedDocument);
      }

      return savedDocument;
    } catch (error) {
      console.error('Error in createDocument service:', error);
      throw error;
    }
  }

  /**
   * Get documents with filtering and pagination
   */
  async getDocuments(filterDto: DocumentFilterDto, tenantId: string): Promise<{ documents: Document[]; total: number }> {
    const queryBuilder = this.documentRepository.createQueryBuilder('document')
      .where('document.tenantId = :tenantId', { tenantId });

    // Apply filters
    if (filterDto.entityType) {
      queryBuilder.andWhere('document.entityType = :entityType', { entityType: filterDto.entityType });
    }

    if (filterDto.entityId) {
      queryBuilder.andWhere('document.entityId = :entityId', { entityId: filterDto.entityId });
    }

    if (filterDto.documentType) {
      queryBuilder.andWhere('document.documentType = :documentType', { documentType: filterDto.documentType });
    }

    if (filterDto.category) {
      queryBuilder.andWhere('document.category = :category', { category: filterDto.category });
    }

    if (filterDto.status) {
      queryBuilder.andWhere('document.status = :status', { status: filterDto.status });
    }

    if (filterDto.priority) {
      queryBuilder.andWhere('document.priority = :priority', { priority: filterDto.priority });
    }

    if (filterDto.isExpired !== undefined) {
      if (filterDto.isExpired) {
        queryBuilder.andWhere('document.expiryDate < :now', { now: new Date() });
      } else {
        queryBuilder.andWhere('(document.expiryDate IS NULL OR document.expiryDate >= :now)', { now: new Date() });
      }
    }

    if (filterDto.requiresRenewal) {
      queryBuilder.andWhere('document.requiresRenewal = :requiresRenewal', { requiresRenewal: filterDto.requiresRenewal });
    }

    if (filterDto.uploadedBy) {
      queryBuilder.andWhere('document.uploadedBy = :uploadedBy', { uploadedBy: filterDto.uploadedBy });
    }

    if (filterDto.verifiedBy) {
      queryBuilder.andWhere('document.verifiedBy = :verifiedBy', { verifiedBy: filterDto.verifiedBy });
    }

    if (filterDto.tags && filterDto.tags.length > 0) {
      queryBuilder.andWhere('document.tags @> :tags', { tags: filterDto.tags });
    }

    if (filterDto.search) {
      queryBuilder.andWhere(
        '(document.title ILIKE :search OR document.description ILIKE :search OR document.fileName ILIKE :search)',
        { search: `%${filterDto.search}%` }
      );
    }

    // Apply date filters
    if (filterDto.uploadedAfter) {
      queryBuilder.andWhere('document.createdAt >= :uploadedAfter', { uploadedAfter: filterDto.uploadedAfter });
    }

    if (filterDto.uploadedBefore) {
      queryBuilder.andWhere('document.createdAt <= :uploadedBefore', { uploadedBefore: filterDto.uploadedBefore });
    }

    if (filterDto.expiresAfter) {
      queryBuilder.andWhere('document.expiryDate >= :expiresAfter', { expiresAfter: filterDto.expiresAfter });
    }

    if (filterDto.expiresBefore) {
      queryBuilder.andWhere('document.expiryDate <= :expiresBefore', { expiresBefore: filterDto.expiresBefore });
    }

    // Apply sorting
    const sortField = filterDto.sortBy || 'createdAt';
    const sortOrder = filterDto.sortOrder || 'DESC';
    queryBuilder.orderBy(`document.${sortField}`, sortOrder);

    // Apply pagination
    const page = filterDto.page || 1;
    const limit = Math.min(filterDto.limit || 20, 100);
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);

    // Execute query
    const [documents, total] = await queryBuilder.getManyAndCount();

    return { documents, total };
  }

  /**
   * Search documents across all fields
   */
  async searchDocuments(searchDto: DocumentSearchDto, tenantId: string): Promise<Document[]> {
    const queryBuilder = this.documentRepository.createQueryBuilder('document')
      .where('document.tenantId = :tenantId', { tenantId });

    if (searchDto.query) {
      queryBuilder.andWhere(
        `(
          document.title ILIKE :query OR 
          document.description ILIKE :query OR 
          document.fileName ILIKE :query OR 
          document.documentNumber ILIKE :query OR
          document.tags::text ILIKE :query OR
          document.metadata::text ILIKE :query
        )`,
        { query: `%${searchDto.query}%` }
      );
    }

    if (searchDto.entityTypes && searchDto.entityTypes.length > 0) {
      queryBuilder.andWhere('document.entityType IN (:...entityTypes)', { entityTypes: searchDto.entityTypes });
    }

    if (searchDto.categories && searchDto.categories.length > 0) {
      queryBuilder.andWhere('document.category IN (:...categories)', { categories: searchDto.categories });
    }

    if (searchDto.statuses && searchDto.statuses.length > 0) {
      queryBuilder.andWhere('document.status IN (:...statuses)', { statuses: searchDto.statuses });
    }

    if (searchDto.priorities && searchDto.priorities.length > 0) {
      queryBuilder.andWhere('document.priority IN (:...priorities)', { priorities: searchDto.priorities });
    }

    // Apply relevance scoring
    queryBuilder.addSelect(
      `(
        CASE 
          WHEN document.title ILIKE :exactQuery THEN 100
          WHEN document.title ILIKE :query THEN 80
          WHEN document.description ILIKE :query THEN 60
          WHEN document.fileName ILIKE :query THEN 40
          WHEN document.tags @> :tagArray THEN 30
          ELSE 10
        END
      )`,
      'relevance_score'
    );

    queryBuilder.setParameter('exactQuery', searchDto.query);
    queryBuilder.setParameter('query', `%${searchDto.query}%`);
    queryBuilder.setParameter('tagArray', searchDto.query ? [searchDto.query] : []);

    queryBuilder.orderBy('relevance_score', 'DESC');
    queryBuilder.addOrderBy('document.createdAt', 'DESC');

    if (searchDto.limit) {
      queryBuilder.limit(Math.min(searchDto.limit, 100));
    }

    return queryBuilder.getMany();
  }

  /**
   * Get document by ID
   */
  async getDocumentById(id: string, tenantId: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id, tenantId }
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  /**
   * Update document
   */
  async updateDocument(id: string, updateDocumentDto: UpdateDocumentDto, updatedBy: string, tenantId: string): Promise<Document> {
    const document = await this.getDocumentById(id, tenantId);

    // Check if document can be updated
    if (document.status === DocumentStatus.VERIFIED && !updateDocumentDto.forceUpdate) {
      throw new BadRequestException('Verified documents cannot be updated without force flag');
    }

    // Handle file update
    if (updateDocumentDto.file) {
      const uploadResult = await this.fileUploadService.uploadFile(updateDocumentDto.file, 'documents');
      
      // Add new version
      const newVersion = {
        version: document.currentVersion + 1,
        fileUrl: uploadResult.fileUrl,
        fileName: updateDocumentDto.fileName || document.fileName,
        fileSize: updateDocumentDto.fileSize || document.fileSize,
        uploadedAt: new Date(),
        uploadedBy: updatedBy,
        changeNotes: updateDocumentDto.changeNotes || 'Document updated'
      };

      document.versions.push(newVersion);
      document.currentVersion = newVersion.version;
      document.fileUrl = uploadResult.fileUrl;
      document.fileName = newVersion.fileName;
      document.fileSize = newVersion.fileSize;
    }

    // Update other fields
    Object.assign(document, updateDocumentDto);

    // Update audit trail
    document.auditTrail.push({
      action: 'UPDATED',
      performedBy: updatedBy,
      performedAt: new Date(),
      details: { 
        method: 'update',
        changeNotes: updateDocumentDto.changeNotes,
        updatedFields: Object.keys(updateDocumentDto)
      }
    });

    document.updatedAt = new Date();

    return this.documentRepository.save(document);
  }

  /**
   * Verify document
   */
  async verifyDocument(id: string, verificationData: any, verifiedBy: string, tenantId: string): Promise<Document> {
    const document = await this.getDocumentById(id, tenantId);

    if (document.status === DocumentStatus.VERIFIED) {
      throw new BadRequestException('Document is already verified');
    }

    document.status = DocumentStatus.VERIFIED;
    document.verifiedBy = verifiedBy;
    document.verifiedAt = new Date();
    document.verificationNotes = verificationData.notes;
    document.verificationData = verificationData;

    // Update audit trail
    document.auditTrail.push({
      action: 'VERIFIED',
      performedBy: verifiedBy,
      performedAt: new Date(),
      details: { 
        method: 'verification',
        notes: verificationData.notes,
        verificationData
      }
    });

    document.updatedAt = new Date();

    const verifiedDocument = await this.documentRepository.save(document);

    // Send notification
    await this.notifyDocumentVerification(verifiedDocument);

    return verifiedDocument;
  }

  /**
   * Reject document
   */
  async rejectDocument(id: string, rejectionData: any, rejectedBy: string, tenantId: string): Promise<Document> {
    const document = await this.getDocumentById(id, tenantId);

    document.status = DocumentStatus.REJECTED;
    document.verificationNotes = rejectionData.reason;
    document.verificationData = rejectionData;

    // Update audit trail
    document.auditTrail.push({
      action: 'REJECTED',
      performedBy: rejectedBy,
      performedAt: new Date(),
      details: { 
        method: 'rejection',
        reason: rejectionData.reason,
        rejectionData
      }
    });

    document.updatedAt = new Date();

    const rejectedDocument = await this.documentRepository.save(document);

    // Send notification
    await this.notifyDocumentRejection(rejectedDocument);

    return rejectedDocument;
  }

  /**
   * Archive document
   */
  async archiveDocument(id: string, archivedBy: string, tenantId: string): Promise<Document> {
    const document = await this.getDocumentById(id, tenantId);

    document.status = DocumentStatus.ARCHIVED;

    // Update audit trail
    document.auditTrail.push({
      action: 'ARCHIVED',
      performedBy: archivedBy,
      performedAt: new Date(),
      details: { method: 'archive' }
    });

    document.updatedAt = new Date();

    return this.documentRepository.save(document);
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string, deletedBy: string, tenantId: string): Promise<void> {
    const document = await this.getDocumentById(id, tenantId);

    if (document.status === DocumentStatus.VERIFIED) {
      throw new BadRequestException('Verified documents cannot be deleted');
    }

    // Soft delete
    await this.documentRepository.softDelete(id);

    // Update audit trail
    document.auditTrail.push({
      action: 'DELETED',
      performedBy: deletedBy,
      performedAt: new Date(),
      details: { method: 'soft_delete' }
    });

    document.updatedAt = new Date();
    await this.documentRepository.save(document);
  }

  /**
   * Get documents by entity
   */
  async getDocumentsByEntity(entityType: EntityType, entityId: string, tenantId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { entityType, entityId, tenantId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get documents expiring soon
   */
  async getDocumentsExpiringSoon(days: number = 30, tenantId: string): Promise<Document[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    return this.documentRepository.find({
      where: {
        tenantId,
        expiryDate: Between(new Date(), expiryDate),
        status: Not(DocumentStatus.EXPIRED)
      },
      order: { expiryDate: 'ASC' }
    });
  }

  /**
   * Get documents requiring renewal
   */
  async getDocumentsRequiringRenewal(tenantId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: {
        tenantId,
        requiresRenewal: true,
        status: In([DocumentStatus.VERIFIED, DocumentStatus.EXPIRED])
      },
      order: { expiryDate: 'ASC' }
    });
  }

  /**
   * Get document statistics
   */
  async getDocumentStatistics(tenantId: string): Promise<any> {
    const stats = await this.documentRepository
      .createQueryBuilder('document')
      .select([
        'document.status as status',
        'document.category as category',
        'document.priority as priority',
        'COUNT(*) as count'
      ])
      .where('document.tenantId = :tenantId', { tenantId })
      .groupBy('document.status, document.category, document.priority')
      .getRawMany();

    const totalDocuments = await this.documentRepository.count({ where: { tenantId } });
    const verifiedDocuments = await this.documentRepository.count({ 
      where: { tenantId, status: DocumentStatus.VERIFIED } 
    });
    const expiredDocuments = await this.documentRepository.count({ 
      where: { tenantId, status: DocumentStatus.EXPIRED } 
    });
    const pendingDocuments = await this.documentRepository.count({ 
      where: { tenantId, status: DocumentStatus.PENDING } 
    });

    return {
      total: totalDocuments,
      verified: verifiedDocuments,
      expired: expiredDocuments,
      pending: pendingDocuments,
      breakdown: stats
    };
  }

  /**
   * Bulk update document status
   */
  async bulkUpdateStatus(documentIds: string[], status: DocumentStatus, updatedBy: string, tenantId: string): Promise<Document[]> {
    const documents = await this.documentRepository.find({
      where: { id: In(documentIds), tenantId }
    });

    if (documents.length !== documentIds.length) {
      throw new BadRequestException('Some documents not found or access denied');
    }

    const updatedDocuments = documents.map(document => {
      document.status = status;
      document.auditTrail.push({
        action: `BULK_STATUS_UPDATE_TO_${status}`,
        performedBy: updatedBy,
        performedAt: new Date(),
        details: { method: 'bulk_update', newStatus: status }
      });
      document.updatedAt = new Date();
      return document;
    });

    return this.documentRepository.save(updatedDocuments);
  }

  /**
   * Validate entity exists
   */
  private async validateEntityExists(entityType: EntityType, entityId: string): Promise<void> {
    // This would typically check against the actual entity repositories
    // For now, we'll assume the entity exists
    // In a real implementation, you'd inject the relevant repositories and validate
  }

  /**
   * Map document priority to notification priority
   */
  private mapDocumentPriorityToNotificationPriority(documentPriority: DocumentPriority): NotificationPriority {
    switch (documentPriority) {
      case DocumentPriority.LOW:
        return NotificationPriority.LOW;
      case DocumentPriority.NORMAL:
        return NotificationPriority.NORMAL;
      case DocumentPriority.HIGH:
        return NotificationPriority.HIGH;
      case DocumentPriority.URGENT:
        return NotificationPriority.URGENT;
      default:
        return NotificationPriority.NORMAL;
    }
  }

  /**
   * Notify document upload
   */
  private async notifyDocumentUpload(document: Document): Promise<void> {
    // Send notification to relevant users (e.g., admins, managers)
    await this.notificationService.createNotification({
      recipientId: document.uploadedBy, // or get from document metadata
      notificationType: NotificationType.DOCUMENT_UPLOADED,
      category: NotificationCategory.SYSTEM,
      title: 'Document Uploaded',
      message: `Document "${document.title}" has been uploaded and is pending verification.`,
      entityType: document.entityType,
      entityId: document.entityId,
      priority: this.mapDocumentPriorityToNotificationPriority(document.priority),
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
    });
  }

  /**
   * Notify document verification
   */
  private async notifyDocumentVerification(document: Document): Promise<void> {
    await this.notificationService.createNotification({
      recipientId: document.uploadedBy,
      notificationType: NotificationType.DOCUMENT_VERIFIED,
      category: NotificationCategory.SYSTEM,
      title: 'Document Verified',
      message: `Document "${document.title}" has been verified successfully.`,
      entityType: document.entityType,
      entityId: document.entityId,
      priority: NotificationPriority.NORMAL,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
    });
  }

  /**
   * Notify document rejection
   */
  private async notifyDocumentRejection(document: Document): Promise<void> {
    await this.notificationService.createNotification({
      recipientId: document.uploadedBy,
      notificationType: NotificationType.DOCUMENT_REJECTED,
      category: NotificationCategory.SYSTEM,
      title: 'Document Rejected',
      message: `Document "${document.title}" has been rejected. Please review and resubmit.`,
      entityType: document.entityType,
      entityId: document.entityId,
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
    });
  }
}
