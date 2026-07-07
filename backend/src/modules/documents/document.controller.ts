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
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import * as fs from 'fs';
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
import { Public } from '../../common/decorators/public.decorator';
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
  constructor(private readonly documentService: DocumentService) { }

  @Post()
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
    UserRole.CARGO_OWNER,
  )
  @ApiOperation({
    summary: 'Create a new document',
    description: 'Upload and create a new document for any entity type',
  })
  @ApiResponse({
    status: 201,
    description: 'Document created successfully',
    type: Document,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Document creation data',
    type: CreateDocumentDto,
  })
  @ApiBody({
    description: 'Document file to upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file to upload',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  )
  async createDocument(
    @Body() body: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          // FileTypeValidator removed to allow any document type
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
    @Req() req?: Request,
  ): Promise<Document> {
    try {
      // Parse form data (multipart/form-data sends everything as strings)
      const createDocumentDto: CreateDocumentDto = {
        entityType: body.entityType,
        entityId: body.entityId,
        documentType: body.documentType,
        category: body.category,
        priority: body.priority,
        documentNumber: body.documentNumber,
        title: body.title,
        description: body.description || '',
        fileName: file
          ? file.originalname
          : body.fileName || body.title || 'document',
        originalFileName: file
          ? file.originalname
          : body.originalFileName || body.fileName || body.title || 'document',
        fileUrl: body.fileUrl,
        file: file,
        fileSize: file ? file.size : body.fileSize ? Number(body.fileSize) : 0,
        mimeType: file
          ? file.mimetype || 'application/octet-stream'
          : body.mimeType || 'application/octet-stream',
        fileExtension: file
          ? file.originalname.split('.').pop() || ''
          : body.fileExtension,
        issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
        requiresRenewal:
          body.requiresRenewal === 'true' || body.requiresRenewal === true,
        renewalReminderDays: body.renewalReminderDays
          ? Number(body.renewalReminderDays)
          : undefined,
        tags: body.tags
          ? typeof body.tags === 'string'
            ? JSON.parse(body.tags)
            : body.tags
          : undefined,
        sendNotification:
          body.sendNotification === 'true' || body.sendNotification === true,
      };

      // Validate required fields
      if (!createDocumentDto.entityType) {
        throw new BadRequestException('entityType is required');
      }
      if (!createDocumentDto.entityId) {
        throw new BadRequestException('entityId is required');
      }
      if (!createDocumentDto.documentType) {
        throw new BadRequestException('documentType is required');
      }
      if (!createDocumentDto.category) {
        throw new BadRequestException('category is required');
      }
      if (!createDocumentDto.title) {
        throw new BadRequestException('title is required');
      }
      if (!file && !createDocumentDto.fileUrl) {
        throw new BadRequestException(
          'Either a file or fileUrl must be provided',
        );
      }

      // Get user and tenant from request
      const userId = req?.user?.userId;
      const tenantId = req?.user?.tenantId;

      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      if (!tenantId) {
        throw new BadRequestException('Tenant ID is required');
      }

      return await this.documentService.createDocument(
        createDocumentDto,
        userId,
        tenantId,
      );
    } catch (error) {
      console.error('Error creating document:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create document: ${error.message}`,
      );
    }
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
    UserRole.CARGO_OWNER,
  )
  @ApiOperation({
    summary: 'Get documents with filtering and pagination - Updated',
    description:
      'Retrieve documents with advanced filtering, sorting, and pagination',
  })
  @ApiQuery({
    name: 'entityType',
    required: false,
    enum: ['USER', 'DRIVER', 'TRUCK', 'CARGO', 'TRIP'],
  })
  @ApiQuery({ name: 'entityId', required: false, type: String })
  @ApiQuery({
    name: 'documentType',
    required: false,
    enum: ['DRIVER_LICENSE', 'VEHICLE_REGISTRATION', 'CARGO_MANIFEST'],
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['IDENTITY', 'LICENSE', 'INSURANCE', 'CERTIFICATION'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'],
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, schema: { minimum: 1 } })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    schema: { minimum: 1, maximum: 100 },
  })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        documents: {
          type: 'array',
          items: { $ref: '#/components/schemas/Document' },
        },
        total: { type: 'number' },
      },
    },
  })
  async getDocuments(
    @Query() filterDto: DocumentFilterDto,
    @Req() req?: Request,
  ): Promise<{
    documents: Document[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  }> {
    const tenantId = req?.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    const result = await this.documentService.getDocuments(filterDto, req.user);

    // Calculate pagination info for frontend compatibility
    const page = filterDto.page || 1;
    const limit = Math.min(filterDto.limit || 20, 100);
    const totalPages = Math.ceil(result.total / limit);

    return {
      ...result,
      page,
      limit,
      totalPages,
    };
  }

  @Get('search')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
    UserRole.CARGO_OWNER,
  )
  @ApiOperation({
    summary: 'Search documents across all fields',
    description:
      'Full-text search across document titles, descriptions, and metadata with relevance scoring',
  })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'entityTypes', required: false, type: [String] })
  @ApiQuery({ name: 'categories', required: false, type: [String] })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    schema: { minimum: 1, maximum: 100 },
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: [Document],
  })
  async searchDocuments(
    @Query() searchDto: DocumentSearchDto,
  ): Promise<Document[]> {
    // TODO: Get tenantId from context or pass as parameter
    const tenantId = 'temp-tenant-id'; // Placeholder
    return this.documentService.searchDocuments(searchDto, tenantId);
  }

  @Get('expiring')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.CARGO_OWNER,
  )
  @ApiOperation({
    summary: 'Get documents expiring soon',
    description:
      'Retrieve documents that are expiring within a specified number of days',
  })
  @ApiQuery({ name: 'days', required: false, type: Number, schema: { default: 30 } })
  @ApiResponse({
    status: 200,
    description: 'Documents expiring soon',
    type: [Document],
  })
  async getDocumentsExpiringSoon(
    @Query('days') days: number = 30,
    @Req() req: Request,
  ): Promise<Document[]> {
    return this.documentService.getDocumentsExpiringSoon(
      days,
      req.user.tenantId,
    );
  }

  @Get('renewal')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.CARGO_OWNER,
  )
  @ApiOperation({
    summary: 'Get documents requiring renewal',
    description: 'Retrieve documents that require renewal',
  })
  @ApiResponse({
    status: 200,
    description: 'Documents requiring renewal',
    type: [Document],
  })
  async getDocumentsRequiringRenewal(@Req() req: Request): Promise<Document[]> {
    return this.documentService.getDocumentsRequiringRenewal(req.user.tenantId);
  }

  @Get('statistics')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.CARGO_OWNER,
  )
  @ApiOperation({
    summary: 'Get document statistics',
    description: 'Retrieve comprehensive statistics about documents',
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
        breakdown: { type: 'array' },
      },
    },
  })
  @ApiQuery({ name: 'entityType', required: false })
  async getDocumentStatistics(
    @Query('entityType') entityType: string,
    @Req() req: Request
  ): Promise<any> {
    return this.documentService.getDocumentStatistics(req.user.tenantId, entityType);
  }

  @Get('entity/:entityType/:entityId')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
    UserRole.CARGO_OWNER,
  )
  @ApiOperation({
    summary: 'Get documents by entity',
    description: 'Retrieve all documents for a specific entity',
  })
  @ApiParam({
    name: 'entityType',
    enum: ['USER', 'DRIVER', 'TRUCK', 'CARGO', 'TRIP'],
  })
  @ApiParam({ name: 'entityId', type: String })
  @ApiResponse({
    status: 200,
    description: 'Documents for the entity',
    type: [Document],
  })
  async getDocumentsByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Req() req: Request,
  ): Promise<Document[]> {
    return this.documentService.getDocumentsByEntity(
      entityType as any,
      entityId,
      req.user.tenantId,
    );
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
    UserRole.CARGO_OWNER,
  )
  @ApiOperation({
    summary: 'Get document by ID',
    description: 'Retrieve a specific document by its ID',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
    type: Document,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async getDocumentById(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Document> {
    return this.documentService.getDocumentById(id, req.user.tenantId);
  }

  @Put(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
    UserRole.CARGO_OWNER,
  )
  @ApiOperation({
    summary: 'Update document',
    description: 'Update an existing document with new information or file',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Document update data',
    type: UpdateDocumentDto,
  })
  @ApiBody({
    description: 'Document update data with optional file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'New document file (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Document updated successfully',
    type: Document,
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
          // FileTypeValidator removed to allow any document type
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
      req.user.tenantId,
    );
  }

  @Post(':id/verify')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER)
  @ApiOperation({
    summary: 'Verify document',
    description: 'Mark a document as verified with verification notes',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: DocumentVerificationDto })
  @ApiResponse({
    status: 200,
    description: 'Document verified successfully',
    type: Document,
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
      req.user.tenantId,
    );
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER)
  @ApiOperation({
    summary: 'Reject document',
    description: 'Mark a document as rejected with rejection reason',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: DocumentRejectionDto })
  @ApiResponse({
    status: 200,
    description: 'Document rejected successfully',
    type: Document,
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
      req.user.tenantId,
    );
  }

  @Post(':id/archive')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.CARGO_OWNER,
    UserRole.DRIVER,
  )
  @ApiOperation({
    summary: 'Archive document',
    description: 'Archive a document (soft delete)',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Document archived successfully',
    type: Document,
  })
  async archiveDocument(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Document> {
    return this.documentService.archiveDocument(
      id,
      req.user.userId,
      req.user.tenantId,
    );
  }

  @Delete(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.CARGO_OWNER,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
  )
  @ApiOperation({
    summary: 'Delete document',
    description:
      'Permanently delete a document (soft delete for verified documents)',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Document deleted successfully',
  })
  async deleteDocument(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<void> {
    return this.documentService.deleteDocument(
      id,
      req.user.userId,
      req.user.tenantId,
    );
  }

  @Post('bulk/status')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.CARGO_OWNER,
  )
  @ApiOperation({
    summary: 'Bulk update document status',
    description: 'Update the status of multiple documents at once',
  })
  @ApiBody({ type: BulkDocumentUpdateDto })
  @ApiResponse({
    status: 200,
    description: 'Documents updated successfully',
    type: [Document],
  })
  async bulkUpdateStatus(
    @Body() bulkUpdateDto: BulkDocumentUpdateDto,
    @Req() req: Request,
  ): Promise<Document[]> {
    return this.documentService.bulkUpdateStatus(
      bulkUpdateDto.documentIds,
      bulkUpdateDto.status,
      req.user.userId,
      req.user.tenantId,
    );
  }

  @Get('download/:id')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
    UserRole.CARGO_OWNER,
  )
  @ApiOperation({
    summary: 'Download document',
    description: 'Download a document file',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Document file downloaded successfully',
  })
  async downloadDocument(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const document = await this.documentService.getDocumentById(
      id,
      req.user.tenantId,
    );

    // Extract file path from fileUrl
    const fileUrl = document.fileUrl;
    if (!fileUrl) {
      throw new NotFoundException('Document file not found');
    }

    // Extract relative path from URL (e.g., /uploads/documents/file.pdf)
    let urlPath: string;
    try {
      const url = new URL(fileUrl);
      urlPath = url.pathname;
    } catch {
      // If fileUrl is a relative path, use it directly
      urlPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    }

    const filePath = join(process.cwd(), urlPath);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File not found on server: ${filePath}`);
    }

    res.setHeader(
      'Content-Type',
      document.mimeType || 'application/octet-stream',
    );
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${document.fileName}"`,
    );
    res.sendFile(filePath);
  }

  @Get('serve/:id')
  @Public()
  @ApiOperation({
    summary: 'Serve document file',
    description: 'Serve a document file for viewing (inline)',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Document file served successfully',
  })
  async serveDocument(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const document = await this.documentService.getDocumentById(
      id,
      req.user?.tenantId,
    );

    const fileUrl = document.fileUrl;
    if (!fileUrl) {
      throw new NotFoundException('Document file not found');
    }

    // Extract relative path from URL
    let urlPath: string;
    try {
      const url = new URL(fileUrl);
      urlPath = url.pathname;
    } catch {
      urlPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    }

    const filePath = join(process.cwd(), urlPath);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File not found on server: ${filePath}`);
    }

    res.setHeader(
      'Content-Type',
      document.mimeType || 'application/octet-stream',
    );
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${document.fileName}"`,
    );
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(filePath);
  }
}
