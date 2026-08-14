import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsDate,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DocumentType,
  DocumentStatus,
  DocumentPriority,
  DocumentCategory,
  EntityType,
} from '../../../entities/document.entity';

export class CreateDocumentDto {
  @IsEnum(EntityType)
  entityType: EntityType;

  @IsUUID()
  entityId: string;

  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @IsEnum(DocumentPriority)
  @IsOptional()
  priority?: DocumentPriority;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  fileName: string;

  @IsString()
  originalFileName: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsOptional()
  file?: Express.Multer.File;

  @IsNumber()
  fileSize: number;

  @IsString()
  mimeType: string;

  @IsString()
  @IsOptional()
  fileExtension?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  issueDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiryDate?: Date;

  @IsBoolean()
  @IsOptional()
  requiresRenewal?: boolean;

  @IsNumber()
  @IsOptional()
  renewalReminderDays?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsOptional()
  metadata?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  sendNotification?: boolean;
}

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsEnum(DocumentPriority)
  @IsOptional()
  priority?: DocumentPriority;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  issueDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiryDate?: Date;

  @IsBoolean()
  @IsOptional()
  requiresRenewal?: boolean;

  @IsNumber()
  @IsOptional()
  renewalReminderDays?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsOptional()
  file?: Express.Multer.File;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @IsString()
  @IsOptional()
  changeNotes?: string;

  @IsBoolean()
  @IsOptional()
  forceUpdate?: boolean;
}

export class DocumentFilterDto {
  @IsEnum(EntityType)
  @IsOptional()
  entityType?: EntityType;

  @IsUUID()
  @IsOptional()
  entityId?: string;

  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @IsEnum(DocumentCategory)
  @IsOptional()
  category?: DocumentCategory;

  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

  @IsEnum(DocumentPriority)
  @IsOptional()
  priority?: DocumentPriority;

  @IsBoolean()
  @IsOptional()
  isExpired?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresRenewal?: boolean;

  @IsUUID()
  @IsOptional()
  uploadedBy?: string;

  @IsUUID()
  @IsOptional()
  verifiedBy?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  search?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  uploadedAfter?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  uploadedBefore?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresAfter?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresBefore?: Date;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}

export class DocumentSearchDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsArray()
  @IsEnum(EntityType, { each: true })
  @IsOptional()
  entityTypes?: EntityType[];

  @IsArray()
  @IsEnum(DocumentCategory, { each: true })
  @IsOptional()
  categories?: DocumentCategory[];

  @IsArray()
  @IsEnum(DocumentStatus, { each: true })
  @IsOptional()
  statuses?: DocumentStatus[];

  @IsArray()
  @IsEnum(DocumentPriority, { each: true })
  @IsOptional()
  priorities?: DocumentPriority[];

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}

export class DocumentVerificationDto {
  @IsString()
  notes: string;

  @IsString()
  @IsOptional()
  regulatoryBody?: string;

  @IsString()
  @IsOptional()
  complianceCode?: string;

  @IsNumber()
  @IsOptional()
  complianceScore?: number;
}

export class DocumentRejectionDto {
  @IsString()
  reason: string;

  @IsString()
  @IsOptional()
  suggestion?: string;

  @IsString()
  @IsOptional()
  requiredAction?: string;
}

export class BulkDocumentUpdateDto {
  @IsArray()
  @IsUUID('4', { each: true })
  documentIds: string[];

  @IsEnum(DocumentStatus)
  status: DocumentStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class DocumentWorkflowDto {
  @IsString()
  workflowId: string;

  @IsString()
  step: string;

  @IsString()
  @IsOptional()
  nextStep?: string;

  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowCommentDto)
  @IsOptional()
  comments?: WorkflowCommentDto[];
}

export class WorkflowCommentDto {
  @IsString()
  comment: string;

  @IsUUID()
  commentedBy: string;

  @IsDate()
  @Type(() => Date)
  commentedAt: Date;
}

export class DocumentAccessControlDto {
  @IsString()
  role: string;

  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @IsUUID()
  grantedBy: string;

  @IsDate()
  @Type(() => Date)
  grantedAt: Date;
}

export class DocumentVersionDto {
  @IsNumber()
  version: number;

  @IsString()
  fileUrl: string;

  @IsString()
  fileName: string;

  @IsNumber()
  fileSize: number;

  @IsDate()
  @Type(() => Date)
  uploadedAt: Date;

  @IsUUID()
  uploadedBy: string;

  @IsString()
  @IsOptional()
  changeNotes?: string;
}

export class DocumentAuditTrailDto {
  @IsString()
  action: string;

  @IsUUID()
  performedBy: string;

  @IsDate()
  @Type(() => Date)
  performedAt: Date;

  @IsString()
  @IsOptional()
  details?: Record<string, any>;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
