import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserKycService, UserKycSubmissionData } from '../../services/user-kyc.service';
import { KycStatus } from '../../entities/user-profile.entity';
import { UserDocumentType, DocumentCategory } from '../../entities/user-kyc-document.entity';
import { UserRole } from '../../entities/user.entity';
import { Request } from 'express';

@ApiTags('user-kyc')
@Controller('user-kyc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserKycController {
  constructor(private readonly userKycService: UserKycService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit KYC data for current user' })
  @ApiResponse({ status: 200, description: 'User KYC data submitted successfully' })
  async submitUserKyc(
    @Req() req: Request,
    @Body() kycData: UserKycSubmissionData,
  ) {
    const user = req.user as any;
    
    const userProfile = await this.userKycService.submitUserKyc(user.id, kycData, user.id);
    return {
      success: true,
      message: 'User KYC data submitted successfully',
      data: userProfile,
    };
  }

  @Get('my-kyc')
  @ApiOperation({ summary: 'Get current user KYC status and data' })
  @ApiResponse({ status: 200, description: 'User KYC data retrieved successfully' })
  async getMyKyc(@Req() req: Request) {
    const user = req.user as any;
    
    const userProfile = await this.userKycService.getUserKycProfile(user.id);
    const documents = await this.userKycService.getUserKycDocuments(user.id);
    const requirements = await this.userKycService.getKycRequirements(user.role);
    
    return {
      success: true,
      data: {
        profile: userProfile,
        documents,
        requirements,
      },
    };
  }

  @Get('requirements/:role')
  @ApiOperation({ summary: 'Get KYC requirements for a specific role' })
  @ApiResponse({ status: 200, description: 'KYC requirements retrieved successfully' })
  async getKycRequirements(@Param('role') role: UserRole) {
    const requirements = await this.userKycService.getKycRequirements(role);
    return {
      success: true,
      data: requirements,
    };
  }

  @Post('upload-document')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload KYC document' })
  @ApiResponse({ status: 200, description: 'Document uploaded successfully' })
  async uploadDocument(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      documentType: UserDocumentType;
      documentCategory: DocumentCategory;
      expiryDate?: string;
      metadata?: string;
    },
  ) {
    const user = req.user as any;

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const documentData = {
      documentType: body.documentType,
      documentCategory: body.documentCategory,
      documentName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
      metadata: body.metadata ? JSON.parse(body.metadata) : {},
    };

    const document = await this.userKycService.uploadUserKycDocument(user.id, documentData);

    return {
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    };
  }

  @Get('documents')
  @ApiOperation({ summary: 'Get current user KYC documents' })
  @ApiResponse({ status: 200, description: 'User KYC documents retrieved successfully' })
  async getMyDocuments(@Req() req: Request) {
    const user = req.user as any;
    const documents = await this.userKycService.getUserKycDocuments(user.id);
    
    return {
      success: true,
      data: documents,
    };
  }

  @Post('documents')
  @ApiOperation({ summary: 'Create KYC document record (without file upload)' })
  @ApiResponse({ status: 200, description: 'Document record created successfully' })
  async createDocument(
    @Req() req: Request,
    @Body() body: {
      documentType: UserDocumentType;
      documentCategory: DocumentCategory;
      documentName: string;
      filePath: string;
      fileSize?: number;
      mimeType?: string;
      expiryDate?: string;
      notes?: string;
      metadata?: Record<string, any>;
    },
  ) {
    const user = req.user as any;

    const documentData = {
      documentType: body.documentType,
      documentCategory: body.documentCategory,
      documentName: body.documentName,
      filePath: body.filePath,
      fileSize: body.fileSize,
      mimeType: body.mimeType,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
      notes: body.notes,
      metadata: body.metadata || {},
    };

    const document = await this.userKycService.uploadUserKycDocument(user.id, documentData);

    return {
      success: true,
      message: 'Document record created successfully',
      data: document,
    };
  }

  @Patch('status')
  @ApiOperation({ summary: 'Update current user KYC status' })
  @ApiResponse({ status: 200, description: 'KYC status updated successfully' })
  async updateMyKycStatus(
    @Req() req: Request,
    @Body() body: { kycStatus: KycStatus; notes?: string },
  ) {
    const user = req.user as any;
    
    const userProfile = await this.userKycService.updateUserKycStatus(
      user.id,
      body.kycStatus,
      user.id,
      body.notes,
    );

    return {
      success: true,
      message: `KYC status updated to ${body.kycStatus}`,
      data: userProfile,
    };
  }

  @Get('audit-log')
  @ApiOperation({ summary: 'Get current user KYC audit log' })
  @ApiResponse({ status: 200, description: 'User KYC audit log retrieved successfully' })
  async getMyAuditLog(@Req() req: Request) {
    const user = req.user as any;
    const auditLog = await this.userKycService.getUserKycAuditLog(user.id);
    
    return {
      success: true,
      data: auditLog,
    };
  }

  // Admin endpoints
  @Get('admin/users')
  @ApiOperation({ summary: 'Get users by KYC status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsersByKycStatus(
    @Req() req: Request,
    @Query('status') status: KycStatus,
    @Query('role') role?: UserRole,
  ) {
    const user = req.user as any;
    
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN && user.role !== UserRole.TENANT_ADMIN) {
      throw new UnauthorizedException('Insufficient permissions to view user KYC data');
    }

    const users = await this.userKycService.getUsersByKycStatus(status, role, user.role === UserRole.TENANT_ADMIN ? user.tenantId : undefined);
    
    return {
      success: true,
      data: users,
    };
  }

  @Get('admin/stats')
  @ApiOperation({ summary: 'Get KYC statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'KYC statistics retrieved successfully' })
  async getKycStats(
    @Req() req: Request,
    @Query('role') role?: UserRole,
  ) {
    const user = req.user as any;
    
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN && user.role !== UserRole.TENANT_ADMIN) {
      throw new UnauthorizedException('Insufficient permissions to view KYC statistics');
    }

    const stats = await this.userKycService.getUserKycStats(role, user.role === UserRole.TENANT_ADMIN ? user.tenantId : undefined);
    
    return {
      success: true,
      data: stats,
    };
  }

  @Put(':userId/status')
  @ApiOperation({ summary: 'Update user KYC status (Admin only)' })
  @ApiResponse({ status: 200, description: 'User KYC status updated successfully' })
  async updateUserKycStatus(
    @Param('userId') userId: string,
    @Body() body: { status: KycStatus; notes?: string },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN && user.role !== UserRole.TENANT_ADMIN) {
      throw new UnauthorizedException('Insufficient permissions to update user KYC status');
    }

    const userProfile = await this.userKycService.updateUserKycStatus(
      userId,
      body.status,
      user.id,
      body.notes,
    );

    return {
      success: true,
      message: `User KYC status updated to ${body.status}`,
      data: userProfile,
    };
  }

  @Put('documents/:documentId/verify')
  @ApiOperation({ summary: 'Verify/reject user KYC document (Admin only)' })
  @ApiResponse({ status: 200, description: 'Document verification status updated successfully' })
  async verifyDocument(
    @Param('documentId') documentId: string,
    @Body() body: { verified: boolean; notes?: string },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN && user.role !== UserRole.TENANT_ADMIN) {
      throw new UnauthorizedException('Insufficient permissions to verify documents');
    }

    const document = await this.userKycService.verifyUserKycDocument(
      documentId,
      user.id,
      body.verified,
      body.notes,
    );

    return {
      success: true,
      message: `Document ${body.verified ? 'verified' : 'rejected'} successfully`,
      data: document,
    };
  }

  @Get(':userId/profile')
  @ApiOperation({ summary: 'Get user KYC profile (Admin only)' })
  @ApiResponse({ status: 200, description: 'User KYC profile retrieved successfully' })
  async getUserKycProfile(
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN && user.role !== UserRole.TENANT_ADMIN) {
      throw new UnauthorizedException('Insufficient permissions to view user KYC profiles');
    }

    const userProfile = await this.userKycService.getUserKycProfile(userId);
    const documents = await this.userKycService.getUserKycDocuments(userId);
    const auditLog = await this.userKycService.getUserKycAuditLog(userId);
    
    return {
      success: true,
      data: {
        profile: userProfile,
        documents,
        auditLog,
      },
    };
  }
}