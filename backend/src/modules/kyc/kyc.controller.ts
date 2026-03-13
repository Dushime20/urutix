import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { KycService, KycSubmissionData } from '../../services/kyc.service';
import { KycStatus } from '../../entities/tenant.entity';
import { DocumentType } from '../../entities/tenant-kyc-document.entity';
import { Request } from 'express';

@ApiTags('kyc')
@Controller('kyc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit KYC data for tenant' })
  @ApiResponse({ status: 200, description: 'KYC data submitted successfully' })
  async submitKyc(
    @Req() req: Request,
    @Body() kycData: KycSubmissionData,
  ) {
    const user = req.user as any;
    if (!user.tenantId) {
      throw new UnauthorizedException('User is not associated with a tenant');
    }

    const tenant = await this.kycService.submitKyc(user.tenantId, kycData, user.id);
    return {
      success: true,
      message: 'KYC data submitted successfully',
      data: tenant,
    };
  }

  @Put(':tenantId/status')
  @ApiOperation({ summary: 'Update KYC status (Admin only)' })
  @ApiResponse({ status: 200, description: 'KYC status updated successfully' })
  async updateKycStatus(
    @Param('tenantId') tenantId: string,
    @Body() body: { status: KycStatus; notes?: string },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    
    // TODO: Add proper admin role check
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admins can update KYC status');
    }

    const tenant = await this.kycService.updateKycStatus(
      tenantId,
      body.status,
      user.id,
      body.notes,
    );

    return {
      success: true,
      message: `KYC status updated to ${body.status}`,
      data: tenant,
    };
  }

  @Post(':tenantId/documents')
  @ApiOperation({ summary: 'Upload KYC document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('tenantId') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { documentType: DocumentType; documentName?: string },
    @Req() req: Request,
  ) {
    const user = req.user as any;

    if (!file) {
      throw new BadRequestException('File is required');
    }

    // TODO: Implement file storage logic (S3, local storage, etc.)
    const filePath = `/uploads/kyc/${tenantId}/${Date.now()}-${file.originalname}`;

    const document = await this.kycService.uploadKycDocument(tenantId, {
      documentType: body.documentType,
      documentName: body.documentName || file.originalname,
      filePath,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: user.id,
    });

    return {
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    };
  }

  @Put('documents/:documentId/verify')
  @ApiOperation({ summary: 'Verify KYC document (Admin only)' })
  async verifyDocument(
    @Param('documentId') documentId: string,
    @Body() body: { verified: boolean; notes?: string },
    @Req() req: Request,
  ) {
    const user = req.user as any;

    // TODO: Add proper admin role check
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admins can verify documents');
    }

    const document = await this.kycService.verifyKycDocument(
      documentId,
      user.id,
      body.verified,
      body.notes,
    );

    return {
      success: true,
      message: `Document ${body.verified ? 'verified' : 'rejected'}`,
      data: document,
    };
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get tenants with pending KYC (Admin only)' })
  async getPendingKyc(@Req() req: Request) {
    const user = req.user as any;

    // TODO: Add proper admin role check
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admins can view pending KYC');
    }

    const [submitted, underReview] = await Promise.all([
      this.kycService.getTenantsByKycStatus(KycStatus.SUBMITTED),
      this.kycService.getTenantsByKycStatus(KycStatus.UNDER_REVIEW),
    ]);

    return {
      success: true,
      message: 'Pending KYC tenants retrieved successfully',
      data: [...submitted, ...underReview],
    };
  }

  @Get(':tenantId/documents')
  @ApiOperation({ summary: 'Get KYC documents for tenant' })
  async getKycDocuments(
    @Param('tenantId') tenantId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    // Users can only view their own tenant's documents, admins can view any
    if (user.tenantId !== tenantId && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      throw new UnauthorizedException('Access denied');
    }

    const documents = await this.kycService.getKycDocuments(tenantId);

    return {
      success: true,
      message: 'KYC documents retrieved successfully',
      data: documents,
    };
  }

  @Get(':tenantId/audit-log')
  @ApiOperation({ summary: 'Get KYC audit log for tenant' })
  async getKycAuditLog(
    @Param('tenantId') tenantId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    // Users can only view their own tenant's audit log, admins can view any
    if (user.tenantId !== tenantId && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      throw new UnauthorizedException('Access denied');
    }

    const auditLog = await this.kycService.getKycAuditLog(tenantId);

    return {
      success: true,
      message: 'KYC audit log retrieved successfully',
      data: auditLog,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get KYC statistics (Admin only)' })
  async getKycStats(@Req() req: Request) {
    const user = req.user as any;

    // TODO: Add proper admin role check
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admins can view KYC statistics');
    }

    const stats = await this.kycService.getKycStats();

    return {
      success: true,
      message: 'KYC statistics retrieved successfully',
      data: stats,
    };
  }
}