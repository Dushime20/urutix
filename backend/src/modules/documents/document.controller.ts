import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { Request } from 'express';
import { DocumentService } from './document.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentFilterDto,
  DocumentSearchDto,
  DocumentVerificationDto,
  DocumentRejectionDto,
  BulkDocumentUpdateDto,
} from './dto/document.dto';
import { Document, DocumentStatus } from '../../entities/document.entity';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER, UserRole.DRIVER, UserRole.CARGO_OWNER)
  @ApiOperation({
    summary: 'Create a new document',
    description: 'Upload and create a new document for any entity type'
  })
  @ApiResponse({
    status: 201,
    description: 'Document created successfully',
    type: Document
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Document creation data',
    type: CreateDocumentDto
  })
  @ApiBody({
    description: 'Document file to upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file to upload'
        }
      }
    }
  })
  @UseInterceptors(FileInterceptor('file'))
  async createDocument(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: '.(pdf|doc|docx|jpg|jpeg|png|txt)' }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ): Promise<Document> {
    // Merge file data with DTO
    if (file) {
      createDocumentDto.file = file;
      createDocumentDto.fileName = file.originalname;
      createDocumentDto.fileSize = file.size;
      createDocumentDto.mimeType = file.mimetype;
    }

    // TODO: Get user from context or pass as parameter
    const userId = 'temp-user-id'; // Placeholder
    const tenantId = 'temp-tenant-id'; // Placeholder

    return this.documentService.createDocument(
      createDocumentDto,
      userId,
      tenantId
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER, UserRole.DRIVER, UserRole.CARGO_OWNER)
  @ApiOperation({
    summary: 'Get documents with filtering and pagination - Updated',
    description: 'Retrieve documents with advanced filtering, sorting, and pagination'
  })
  @ApiQuery({ name: 'entityType', required: false, enum: ['USER', 'DRIVER', 'TRUCK', 'CARGO', 'TRIP'] })
  @ApiQuery({ name: 'entityId', required: false, type: String })
  @ApiQuery({ name: 'documentType', required: false, enum: ['DRIVER_LICENSE', 'VEHICLE_REGISTRATION', 'CARGO_MANIFEST'] })
  @ApiQuery({ name: 'category', required: false, enum: ['IDENTITY', 'LICENSE', 'INSURANCE', 'CERTIFICATION'] })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, minimum: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, minimum: 1, maximum: 100 })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        documents: {
          type: 'array',
          items: { $ref: '#/components/schemas/Document' }
        },
        total: { type: 'number' }
      }
    }
  })
  async getDocuments(
    @Query() filterDto: DocumentFilterDto,
  ): Promise<{ documents: Document[]; total: number }> {
    // TODO: Get tenantId from context or pass as parameter
    const tenantId = 'temp-tenant-id'; // Placeholder
    return this.documentService.getDocuments(filterDto, tenantId);
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER, UserRole.DRIVER, UserRole.CARGO_OWNER)
  @ApiOperation({
    summary: 'Search documents across all fields',
    description: 'Full-text search across document titles, descriptions, and metadata with relevance scoring'
  })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'entityTypes', required: false, type: [String] })
  @ApiQuery({ name: 'categories', required: false, type: [String] })
  @ApiQuery({ name: 'limit', required: false, type: Number, minimum: 1, maximum: 100 })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: [Document]
  })
  async searchDocuments(
    @Query() searchDto: DocumentSearchDto,
  ): Promise<Document[]> {
    // TODO: Get tenantId from context or pass as parameter
    const tenantId = 'temp-tenant-id'; // Placeholder
    return this.documentService.searchDocuments(searchDto, tenantId);
  }

  @Get('expiring')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER, UserRole.CARGO_OWNER)
  @ApiOperation({
    summary: 'Get documents expiring soon',
    description: 'Retrieve documents that are expiring within a specified number of days'
  })
  @ApiQuery({ name: 'days', required: false, type: Number, default: 30 })
  @ApiResponse({
    status: 200,
    description: 'Documents expiring soon',
    type: [Document]
  })
  async getDocumentsExpiringSoon(
    @Query('days') days: number = 30,
    @Req() req: Request,
  ): Promise<Document[]> {
    return this.documentService.getDocumentsExpiringSoon(days, req.user.tenantId);
  }

  @Get('renewal')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER, UserRole.CARGO_OWNER)
  @ApiOperation({
    summary: 'Get documents requiring renewal',
    description: 'Retrieve documents that require renewal'
  })
  @ApiResponse({
    status: 200,
    description: 'Documents requiring renewal',
    type: [Document]
  })
  async getDocumentsRequiringRenewal(
    @Req() req: Request,
  ): Promise<Document[]> {
    return this.documentService.getDocumentsRequiringRenewal(req.user.tenantId);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER, UserRole.CARGO_OWNER)
  @ApiOperation({
    summary: 'Get document statistics',
    description: 'Retrieve comprehensive statistics about documents'
  })
  @ApiResponse({
    status: 200,
    description: 'Document statistics',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        verified: { type: 'number' },
        expired: { type: 'number' },
        pending: { type: 'number' },
        breakdown: { type: 'array' }
      }
    }
  })
  async getDocumentStatistics(
    @Req() req: Request,
  ): Promise<any> {
    return this.documentService.getDocumentStatistics(req.user.tenantId);
  }

  @Get('entity/:entityType/:entityId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER, UserRole.DRIVER, UserRole.CARGO_OWNER)
  @ApiOperation({
    summary: 'Get documents by entity',
    description: 'Retrieve all documents for a specific entity'
  })
  @ApiParam({ name: 'entityType', enum: ['USER', 'DRIVER', 'TRUCK', 'CARGO', 'TRIP'] })
  @ApiParam({ name: 'entityId', type: String })
  @ApiResponse({
    status: 200,
    description: 'Documents for the entity',
    type: [Document]
  })
  async getDocumentsByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Req() req: Request,
  ): Promise<Document[]> {
    return this.documentService.getDocumentsByEntity(
      entityType as any,
      entityId,
      req.user.tenantId
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER, UserRole.DRIVER, UserRole.CARGO_OWNER)
  @ApiOperation({
    summary: 'Get document by ID',
    description: 'Retrieve a specific document by its ID'
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
    type: Document
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found'
  })
  async getDocumentById(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Document> {
    return this.documentService.getDocumentById(id, req.user.tenantId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER, UserRole.DRIVER, UserRole.CARGO_OWNER)
  @ApiOperation({
    summary: 'Update document',
    description: 'Update an existing document with new information or file'
  })
  @ApiParam({ name: 'id', type: String })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Document update data',
    type: UpdateDocumentDto
  })
  @ApiBody({
    description: 'Document update data with optional file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'New document file (optional)'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Document updated successfully',
    type: Document
  })
  @UseInterceptors(FileInterceptor('file'))
  async updateDocument(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: '.(pdf|doc|docx|jpg|jpeg|png|txt)' }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ): Promise<Document> {
    // Merge file data with DTO
    if (file) {
      updateDocumentDto.file = file;
      updateDocumentDto.fileName = file.originalname;
      updateDocumentDto.fileSize = file.size;
    }

    return this.documentService.updateDocument(
      id,
      updateDocumentDto,
      req.user.userId,
      req.user.tenantId
    );
  }

  @Post(':id/verify')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER)
  @ApiOperation({
    summary: 'Verify document',
    description: 'Mark a document as verified with verification notes'
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: DocumentVerificationDto })
  @ApiResponse({
    status: 200,
    description: 'Document verified successfully',
    type: Document
  })
  async verifyDocument(
    @Param('id') id: string,
    @Body() verificationData: DocumentVerificationDto,
    @Req() req: Request,
  ): Promise<Document> {
    return this.documentService.verifyDocument(
      id,
      verificationData,
      req.user.userId,
      req.user.tenantId
    );
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER)
  @ApiOperation({
    summary: 'Reject document',
    description: 'Mark a document as rejected with rejection reason'
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: DocumentRejectionDto })
  @ApiResponse({
    status: 200,
    description: 'Document rejected successfully',
    type: Document
  })
  async rejectDocument(
    @Param('id') id: string,
    @Body() rejectionData: DocumentRejectionDto,
    @Req() req: Request,
  ): Promise<Document> {
    return this.documentService.rejectDocument(
      id,
      rejectionData,
      req.user.userId,
      req.user.tenantId
    );
  }

  @Post(':id/archive')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER)
  @ApiOperation({
    summary: 'Archive document',
    description: 'Archive a document (soft delete)'
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Document archived successfully',
    type: Document
  })
  async archiveDocument(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Document> {
    return this.documentService.archiveDocument(
      id,
      req.user.userId,
      req.user.tenantId
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete document',
    description: 'Permanently delete a document (soft delete for verified documents)'
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Document deleted successfully'
  })
  async deleteDocument(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<void> {
    return this.documentService.deleteDocument(
      id,
      req.user.userId,
      req.user.tenantId
    );
  }

  @Post('bulk/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER, UserRole.CARGO_OWNER)
  @ApiOperation({
    summary: 'Bulk update document status',
    description: 'Update the status of multiple documents at once'
  })
  @ApiBody({ type: BulkDocumentUpdateDto })
  @ApiResponse({
    status: 200,
    description: 'Documents updated successfully',
    type: [Document]
  })
  async bulkUpdateStatus(
    @Body() bulkUpdateDto: BulkDocumentUpdateDto,
    @Req() req: Request,
  ): Promise<Document[]> {
    return this.documentService.bulkUpdateStatus(
      bulkUpdateDto.documentIds,
      bulkUpdateDto.status,
      req.user.userId,
      req.user.tenantId
    );
  }

  @Get('download/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER, UserRole.DRIVER)
  @ApiOperation({
    summary: 'Download document',
    description: 'Download a document file'
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Document file downloaded successfully'
  })
  async downloadDocument(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<any> {
    // This would typically return a file stream
    // For now, we'll return the document info
    const document = await this.documentService.getDocumentById(id, req.user.tenantId);
    return {
      message: 'Download initiated',
      document: {
        id: document.id,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        mimeType: document.mimeType
      }
    };
  }
}
