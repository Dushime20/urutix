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
import { AppealsService } from './appeals.service';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { ReviewAppealDto } from './dto/review-appeal.dto';
import { AddAppealMessageDto } from './dto/add-appeal-message.dto';

/**
 * AppealsController
 * 
 * Handles user appeals against enforcement actions.
 * Users can create appeals, add messages, and track status.
 * Admins can review appeals and make decisions.
 * 
 * Base Path: /governance/appeals
 */
@ApiTags('Appeals')
@ApiBearerAuth()
@Controller('governance/appeals')
export class AppealsController {
  constructor(private appealsService: AppealsService) {}

  /**
   * Create a new appeal
   * 
   * POST /governance/appeals
   * 
   * Allows users to appeal enforcement actions.
   * Creates an appeal record and notifies admins.
   * 
   * @param dto - Appeal details (enforcement action ID, reason, evidence)
   * @param req - Request object containing user info
   * @returns Created appeal
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new appeal' })
  @ApiResponse({ status: 201, description: 'Appeal created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid enforcement action or duplicate appeal' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 404, description: 'Enforcement action not found' })
  async createAppeal(
    @Body() dto: CreateAppealDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const appeal = await this.appealsService.createAppeal(userId, dto);

    return {
      success: true,
      message: 'Appeal created successfully',
      data: appeal,
    };
  }

  /**
   * Get all appeals (with pagination and filtering)
   * 
   * GET /governance/appeals
   * 
   * Returns paginated list of appeals.
   * Admins see all appeals, users see only their own.
   * Supports filtering by status, user, and date range.
   * 
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   * @param status - Filter by status (pending, approved, rejected)
   * @param userId - Filter by user ID (admin only)
   * @param sortBy - Sort field (default: createdAt)
   * @param sortOrder - Sort order (asc, desc)
   * @param req - Request object containing user info
   * @returns Paginated appeals list
   */
  @Get()
  @ApiOperation({ summary: 'Get all appeals with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'], description: 'Filter by status' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user ID (admin only)' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field (default: createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order (default: desc)' })
  @ApiResponse({ status: 200, description: 'Appeals retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  async getAppeals(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
    @Request() req: any,
  ) {
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === 'tenant_admin' || req.user.role === 'super_admin';

    // Non-admins can only see their own appeals
    const filterUserId = isAdmin ? userId : currentUserId;

    const result = await this.appealsService.getAppeals({
      page: Number(page),
      limit: Number(limit),
      status,
      userId: filterUserId,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result.appeals,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Get appeal by ID
   * 
   * GET /governance/appeals/:id
   * 
   * Returns detailed appeal information including messages.
   * Users can only view their own appeals.
   * Admins can view any appeal.
   * 
   * @param id - Appeal ID
   * @param req - Request object containing user info
   * @returns Appeal details
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get appeal by ID' })
  @ApiResponse({ status: 200, description: 'Appeal retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only view own appeals' })
  @ApiResponse({ status: 404, description: 'Appeal not found' })
  async getAppealById(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const appeal = await this.appealsService.getAppealById(id, userId);

    return {
      success: true,
      data: appeal,
    };
  }

  /**
   * Get appeals by user ID
   * 
   * GET /governance/appeals/user/:userId
   * 
   * Returns all appeals for a specific user.
   * Users can only view their own appeals.
   * Admins can view any user's appeals.
   * 
   * @param userId - User ID
   * @param req - Request object containing user info
   * @returns User's appeals
   */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get appeals by user ID' })
  @ApiResponse({ status: 200, description: 'Appeals retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only view own appeals' })
  async getAppealsByUser(
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === 'tenant_admin' || req.user.role === 'super_admin';

    // Non-admins can only view their own appeals
    if (!isAdmin && userId !== currentUserId) {
      return {
        success: false,
        message: 'Forbidden - can only view own appeals',
      };
    }

    const appeals = await this.appealsService.getAppealsByUser(userId);

    return {
      success: true,
      data: appeals,
    };
  }

  /**
   * Get pending appeals
   * 
   * GET /governance/appeals/pending
   * 
   * Returns all appeals with pending status.
   * Admin only endpoint.
   * 
   * @param req - Request object containing user info
   * @returns Pending appeals
   */
  @Get('status/pending')
  @ApiOperation({ summary: 'Get pending appeals (admin only)' })
  @ApiResponse({ status: 200, description: 'Pending appeals retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async getPendingAppeals(@Request() req: any) {
    const appeals = await this.appealsService.getPendingAppeals();

    return {
      success: true,
      data: appeals,
    };
  }

  /**
   * Review an appeal
   * 
   * PATCH /governance/appeals/:id/review
   * 
   * Allows admins to approve or reject appeals.
   * Updates enforcement status if approved.
   * Notifies user of decision.
   * 
   * @param id - Appeal ID
   * @param dto - Review details (decision, notes)
   * @param req - Request object containing admin user info
   * @returns Updated appeal
   */
  @Patch(':id/review')
  @ApiOperation({ summary: 'Review an appeal (admin only)' })
  @ApiResponse({ status: 200, description: 'Appeal reviewed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - appeal already reviewed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'Appeal not found' })
  async reviewAppeal(
    @Param('id') id: string,
    @Body() dto: ReviewAppealDto,
    @Request() req: any,
  ) {
    const adminId = req.user.id;
    const appeal = await this.appealsService.reviewAppeal(id, adminId, dto);

    return {
      success: true,
      message: `Appeal ${dto.decision} successfully`,
      data: appeal,
    };
  }

  /**
   * Add message to appeal
   * 
   * POST /governance/appeals/:id/messages
   * 
   * Allows users and admins to add messages to an appeal.
   * Creates a conversation thread for the appeal.
   * 
   * @param id - Appeal ID
   * @param dto - Message details
   * @param req - Request object containing user info
   * @returns Updated appeal with new message
   */
  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add message to appeal' })
  @ApiResponse({ status: 201, description: 'Message added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - appeal is closed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized for this appeal' })
  @ApiResponse({ status: 404, description: 'Appeal not found' })
  async addMessage(
    @Param('id') id: string,
    @Body() dto: AddAppealMessageDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const appeal = await this.appealsService.addMessage(id, userId, dto);

    return {
      success: true,
      message: 'Message added successfully',
      data: appeal,
    };
  }

  /**
   * Withdraw an appeal
   * 
   * PATCH /governance/appeals/:id/withdraw
   * 
   * Allows users to withdraw their pending appeals.
   * Cannot withdraw approved or rejected appeals.
   * 
   * @param id - Appeal ID
   * @param req - Request object containing user info
   * @returns Updated appeal
   */
  @Patch(':id/withdraw')
  @ApiOperation({ summary: 'Withdraw an appeal' })
  @ApiResponse({ status: 200, description: 'Appeal withdrawn successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - appeal cannot be withdrawn' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only withdraw own appeals' })
  @ApiResponse({ status: 404, description: 'Appeal not found' })
  async withdrawAppeal(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const appeal = await this.appealsService.withdrawAppeal(id, userId);

    return {
      success: true,
      message: 'Appeal withdrawn successfully',
      data: appeal,
    };
  }
}
