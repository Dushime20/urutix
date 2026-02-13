import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RiskDetectionService } from './risk-detection.service';

/**
 * RiskFlagsController
 * 
 * Manages risk flags for suspicious user activity.
 * Admins can view, create, and review risk flags.
 * Automated risk detection creates flags automatically.
 * 
 * Base Path: /governance/risk-flags
 */
@ApiTags('Risk Flags')
@ApiBearerAuth()
@Controller('governance/risk-flags')
export class RiskFlagsController {
  constructor(private riskDetectionService: RiskDetectionService) {}

  /**
   * Get all risk flags with filtering
   * 
   * GET /governance/risk-flags
   * 
   * Returns list of risk flags with optional filtering.
   * Supports filtering by severity, status, and user.
   * 
   * @param severity - Filter by severity (low, medium, high, critical)
   * @param status - Filter by status (pending, reviewed, dismissed)
   * @param userId - Filter by user ID
   * @returns Risk flags list
   */
  @Get()
  @ApiOperation({ summary: 'Get all risk flags with filtering' })
  @ApiQuery({ name: 'severity', required: false, enum: ['low', 'medium', 'high', 'critical'] })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'reviewed', 'dismissed'] })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Risk flags retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async getRiskFlags(
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    // Implementation will use RiskDetectionService methods
    // For now, return placeholder
    return {
      success: true,
      data: [],
      message: 'Risk flags endpoint - implementation pending',
    };
  }

  /**
   * Get risk flags for a specific user
   * 
   * GET /governance/risk-flags/user/:userId
   * 
   * Returns all risk flags for a specific user.
   * Includes risk score and flag history.
   * 
   * @param userId - User ID
   * @returns User's risk flags
   */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get risk flags for a specific user' })
  @ApiResponse({ status: 200, description: 'User risk flags retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserRiskFlags(@Param('userId') userId: string) {
    const riskScore = await this.riskDetectionService.getRiskScore(userId);
    
    return {
      success: true,
      data: {
        userId,
        riskScore,
        flags: [], // Will be populated from database
      },
    };
  }

  /**
   * Create a risk flag manually
   * 
   * POST /governance/risk-flags
   * 
   * Allows admins to manually flag users for suspicious activity.
   * Creates a risk flag record for review.
   * 
   * @param userId - User ID to flag
   * @param reason - Reason for flagging
   * @param severity - Severity level
   * @param evidence - Supporting evidence
   * @param req - Request object containing admin info
   * @returns Created risk flag
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a risk flag manually' })
  @ApiResponse({ status: 201, description: 'Risk flag created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async createRiskFlag(
    @Body('userId') userId: string,
    @Body('reason') reason: string,
    @Body('severity') severity: string,
    @Body('evidence') evidence: any,
    @Request() req: any,
  ) {
    const adminId = req.user.id;
    const flag = await this.riskDetectionService.flagUser(
      userId,
      reason,
      severity as any,
      evidence,
    );

    return {
      success: true,
      message: 'Risk flag created successfully',
      data: flag,
    };
  }

  /**
   * Review a risk flag
   * 
   * PATCH /governance/risk-flags/:id/review
   * 
   * Allows admins to review and resolve risk flags.
   * Can dismiss false positives or escalate to enforcement.
   * 
   * @param id - Risk flag ID
   * @param action - Action to take (dismiss, escalate)
   * @param notes - Review notes
   * @param req - Request object containing admin info
   * @returns Updated risk flag
   */
  @Patch(':id/review')
  @ApiOperation({ summary: 'Review a risk flag' })
  @ApiResponse({ status: 200, description: 'Risk flag reviewed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid action' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'Risk flag not found' })
  async reviewRiskFlag(
    @Param('id') id: string,
    @Body('action') action: string,
    @Body('notes') notes: string,
    @Request() req: any,
  ) {
    const adminId = req.user.id;
    const flag = await this.riskDetectionService.reviewFlag(id, adminId, action, notes);

    return {
      success: true,
      message: 'Risk flag reviewed successfully',
      data: flag,
    };
  }
}
