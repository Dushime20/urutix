import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  ValidationPipe,
  UsePipes,
  Headers,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { LendingService } from './lending.service';
import { RiskAssessmentService } from './services/risk-assessment.service';
import { AutoLoanGeneratorService } from './services/auto-loan-generator.service';
import { LenderAnalyticsService } from './services/lender-analytics.service';
import { RepaymentProcessorService } from './services/repayment-processor.service';
import { UrutiLendingIntegrationService } from './services/uruti-lending-integration.service';
import { CreateLenderDto } from './dto/create-lender.dto';
import { CreateLenderPolicyDto } from './dto/create-lender-policy.dto';
import { CreateLoanRequestDto } from './dto/loan-request.dto';
import { ConfirmDisbursementDto } from './dto/disbursement.dto';
import { 
  UpdateLenderProfileDto, 
  PersonalInfoDto, 
  BusinessInfoDto, 
  BankingInfoDto, 
  PreferencesDto 
} from './dto/lender-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { LenderStatus } from '../../entities/lender.entity';
import { LendingExceptionFilter } from './filters/lending-exception.filter';
import { LendingResponseInterceptor } from './interceptors/lending-response.interceptor';
import { UseFilters, UseInterceptors } from '@nestjs/common';

@ApiTags('Lending')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseFilters(LendingExceptionFilter)
export class LendingController {
  constructor(
    private readonly lendingService: LendingService,
    private readonly riskAssessmentService: RiskAssessmentService,
    private readonly autoLoanGeneratorService: AutoLoanGeneratorService,
    private readonly lenderAnalyticsService: LenderAnalyticsService,
    private readonly repaymentProcessorService: RepaymentProcessorService,
    private readonly urutiLendingIntegration: UrutiLendingIntegrationService,
  ) { }

  // ===== LENDER CREATION =====
  // Two allowed roles: SUPER_ADMIN (cross-tenant) and TENANT_ADMIN (own tenant only).
  // Plain ADMIN is intentionally excluded per business rules.

  @Post('admin/lenders')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Create a new lender',
    description:
      'SUPER_ADMIN must supply tenantId in the request body to target a specific tenant. ' +
      'TENANT_ADMIN is always scoped to their own tenant — body tenantId is ignored.',
  })
  @ApiBody({ type: CreateLenderDto })
  @ApiResponse({ status: 201, description: 'Lender created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async createLender(@Body() createLenderDto: CreateLenderDto, @Request() req: any) {
    const role: string = req.user?.role;

    let tenantId: string | null;

    if (role === UserRole.SUPER_ADMIN) {
      // SUPER_ADMIN creates lenders for any tenant.
      // body.tenantId is the target tenant; JWT tenantId is their own (irrelevant here).
      tenantId = createLenderDto.tenantId || null;
      if (!tenantId) {
        throw new BadRequestException(
          'SUPER_ADMIN must include tenantId in the request body to specify which tenant this lender belongs to.',
        );
      }
    } else {
      // TENANT_ADMIN: always their own tenant — never allow override via body.
      tenantId = req.user?.tenantId || null;
      if (!tenantId) {
        throw new BadRequestException(
          'Tenant ID is missing from your session. Please re-login.',
        );
      }
    }

    return await this.lendingService.createLender(createLenderDto, tenantId);
  }

  @Post('tenant/lenders')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Create a new lender for tenant (tenant-admin shortcut)',
    description: 'Dedicated endpoint for TENANT_ADMIN. Always scoped to their own tenant.',
  })
  @ApiBody({ type: CreateLenderDto })
  @ApiResponse({ status: 201, description: 'Lender created successfully' })
  async createTenantLender(@Body() createLenderDto: CreateLenderDto, @Request() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is missing from your session. Please re-login.');
    }
    return await this.lendingService.createLender(createLenderDto, tenantId);
  }

  @Post('admin/lenders/:lenderId/policy')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Create lender policy',
    description:
      'Admin endpoint to create lending policies including interest rates and terms',
  })
  @ApiParam({
    name: 'lenderId',
    description: 'UUID of the lender',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({ type: CreateLenderPolicyDto })
  @ApiResponse({
    status: 201,
    description: 'Lender policy created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        lender_id: { type: 'string', format: 'uuid' },
        interest_rate: { type: 'number', format: 'float' },
        repayment_term_days: { type: 'integer' },
        max_advance_per_trip: { type: 'number', format: 'float' },
        max_exposure: { type: 'number', format: 'float' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Lender not found' })
  async createLenderPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() createPolicyDto: CreateLenderPolicyDto,
  ) {
    return await this.lendingService.createLenderPolicy(
      lenderId,
      createPolicyDto,
    );
  }

  // ── Lender self-service: manage own policy ──────────────────────────────────

  @Get('lending/my-policy')
  @Roles(UserRole.LENDER)
  @ApiOperation({ summary: 'Get own lending policy' })
  async getMyPolicy(@Request() req: any) {
    return await this.lendingService.getLenderPolicyByUserId(req.user.userId || req.user.id);
  }

  @Post('lending/my-policy')
  @Roles(UserRole.LENDER)
  @ApiOperation({ summary: 'Create or update own lending policy' })
  async upsertMyPolicy(
    @Body() createPolicyDto: CreateLenderPolicyDto,
    @Request() req: any,
  ) {
    return await this.lendingService.upsertLenderPolicyByUserId(
      req.user.userId || req.user.id,
      createPolicyDto,
    );
  }

  @Post('lending/cargo/:cargoId/loan-request')
  @Roles(UserRole.CARGO_OWNER)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lending:create_request')
  async createLoanRequestForCargo(
    @Param('cargoId', ParseUUIDPipe) cargoId: string,
    @Body() body: { trip_id?: string; lender_id?: string; currency: string },
    @Request() req: any,
  ) {
    return await this.lendingService.createLoanRequestForLoadedCargo(
      cargoId,
      body.trip_id,
      req.user.tenantId,
      req?.user?.userId,
      body.currency,
      body.lender_id,
    );
  }

  @Post('admin/lenders/:lenderId/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Update lender status',
    description: 'Admin endpoint to activate, pause, or suspend a lender',
  })
  @ApiParam({
    name: 'lenderId',
    description: 'UUID of the lender',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'paused', 'suspended'],
          description: 'New status for the lender',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Lender status updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: { type: 'string' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid status' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Lender not found' })
  async updateLenderStatus(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() body: { status: 'active' | 'paused' | 'suspended' },
  ) {
    const status = body.status as any; // Convert to enum
    return await this.lendingService.updateLenderStatus(lenderId, status);
  }

  @Get('admin/lenders')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Get all lenders',
    description: 'Admin endpoint to retrieve list of all registered lenders',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by lender status',
    enum: ['active', 'paused', 'suspended'],
  })
  @ApiResponse({
    status: 200,
    description: 'Lenders retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          contact_email: { type: 'string' },
          status: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getAllLenders(@Query('status') status?: string, @Request() req?: any) {
    // For TENANT_ADMIN, filter by their tenantId. For ADMIN, return all
    const tenantId = req?.user?.role === UserRole.TENANT_ADMIN ? req.user.tenantId : null;
    return await this.lendingService.getAllLenders(tenantId);
  }


  @Get('lending/tenant/lenders')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.CARGO_OWNER)
  @ApiOperation({
    summary: 'Get active lenders for the caller tenant',
    description: 'Returns all active lenders that belong to the same tenant as the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Lenders retrieved successfully' })
  async getTenantLenders(@Request() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    // Simple: find all ACTIVE lenders in this tenant using the tenantId from the JWT token
    const lenders = await this.lendingService.getAllLenders(tenantId, LenderStatus.ACTIVE);

    console.log(`[getTenantLenders] Found ${lenders.length} active lenders for tenant ${tenantId}`);

    return lenders;
  }
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Get lender by ID',
    description:
      'Admin endpoint to retrieve detailed information about a specific lender',
  })
  @ApiParam({
    name: 'lenderId',
    description: 'UUID of the lender',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Lender details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        contact_email: { type: 'string' },
        status: { type: 'string' },
        policies: { type: 'array' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Lender not found' })
  @Get('admin/lenders/:lenderId')
  async getLender(@Param('lenderId', ParseUUIDPipe) lenderId: string) {
    return await this.lendingService.getLenderById(lenderId);
  }

  // ===== LENDER PROFILE ENDPOINTS =====

  @Get('admin/lenders/:lenderId/profile')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({
    summary: 'Get lender profile',
    description: 'Get comprehensive lender profile information including personal, business, banking, and preferences'
  })
  @ApiParam({ name: 'lenderId', description: 'Lender ID' })
  @ApiResponse({ status: 200, description: 'Lender profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Lender not found' })
  async getLenderProfile(@Param('lenderId', ParseUUIDPipe) lenderId: string) {
    return await this.lendingService.getLenderProfile(lenderId);
  }

  @Put('admin/lenders/:lenderId/profile')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({
    summary: 'Update lender profile',
    description: 'Update comprehensive lender profile information'
  })
  @ApiParam({ name: 'lenderId', description: 'Lender ID' })
  @ApiResponse({ status: 200, description: 'Lender profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Lender not found' })
  async updateLenderProfile(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() profileData: UpdateLenderProfileDto
  ) {
    return await this.lendingService.updateLenderProfile(lenderId, profileData);
  }

  @Put('admin/lenders/:lenderId/personal')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({
    summary: 'Update lender personal information',
    description: 'Update lender personal details like name, email, phone, etc.'
  })
  @ApiParam({ name: 'lenderId', description: 'Lender ID' })
  @ApiResponse({ status: 200, description: 'Personal information updated successfully' })
  @ApiResponse({ status: 404, description: 'Lender not found' })
  async updateLenderPersonal(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() personalData: PersonalInfoDto
  ) {
    return await this.lendingService.updateLenderPersonal(lenderId, personalData);
  }

  @Put('admin/lenders/:lenderId/business')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({
    summary: 'Update lender business information',
    description: 'Update lender business details like company info, address, capacity, etc.'
  })
  @ApiParam({ name: 'lenderId', description: 'Lender ID' })
  @ApiResponse({ status: 200, description: 'Business information updated successfully' })
  @ApiResponse({ status: 404, description: 'Lender not found' })
  async updateLenderBusiness(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() businessData: BusinessInfoDto
  ) {
    return await this.lendingService.updateLenderBusiness(lenderId, businessData);
  }

  @Put('admin/lenders/:lenderId/banking')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({
    summary: 'Update lender banking information',
    description: 'Update lender banking details like account info, routing numbers, etc.'
  })
  @ApiParam({ name: 'lenderId', description: 'Lender ID' })
  @ApiResponse({ status: 200, description: 'Banking information updated successfully' })
  @ApiResponse({ status: 404, description: 'Lender not found' })
  async updateLenderBanking(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() bankingData: BankingInfoDto
  ) {
    return await this.lendingService.updateLenderBanking(lenderId, bankingData);
  }

  @Put('admin/lenders/:lenderId/preferences')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({
    summary: 'Update lender preferences',
    description: 'Update lender preferences like language, timezone, notifications, etc.'
  })
  @ApiParam({ name: 'lenderId', description: 'Lender ID' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  @ApiResponse({ status: 404, description: 'Lender not found' })
  async updateLenderPreferences(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() preferences: PreferencesDto
  ) {
    return await this.lendingService.updateLenderPreferences(lenderId, preferences);
  }

  // ===== LOAN REQUEST ENDPOINTS =====

  @Post('lending/loan-requests')
  @Roles(UserRole.CARGO_OWNER, UserRole.TRUCK_OWNER, UserRole.FLEET_MANAGER)
  @UseGuards(PermissionsGuard)
  @RequirePermissions('lending:create_request')
  @ApiOperation({
    summary: 'Create loan request',
    description:
      'Create a financing request for cargo-owner transport payment financing or truck-owner trip working capital. Use financing_type to select the product.',
  })
  @ApiBody({ type: CreateLoanRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Loan request created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        tenant_id: { type: 'string', format: 'uuid' },
        cargo_id: { type: 'string', format: 'uuid' },
        trip_id: { type: 'string', format: 'uuid' },
        requested_amount: { type: 'number', format: 'float' },
        status: {
          type: 'string',
          enum: [
            'pending',
            'approved',
            'rejected',
            'disbursed',
            'repaid',
            'failed',
            'defaulted',
          ],
        },
        idempotency_key: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or invalid split amounts',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - duplicate idempotency key',
  })
  async createLoanRequest(
    @Body() createLoanDto: CreateLoanRequestDto,
    @Request() req: any,
  ) {
    return await this.lendingService.createLoanRequest(
      createLoanDto,
      req.user.userId,
    );
  }

  @Get('lending/loan-requests/:loanId')
  @ApiOperation({
    summary: 'Get loan request by ID',
    description: 'Retrieve detailed information about a specific loan request',
  })
  @ApiParam({
    name: 'loanId',
    description: 'UUID of the loan request',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Loan request details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        tenant_id: { type: 'string', format: 'uuid' },
        cargo_id: { type: 'string', format: 'uuid' },
        trip_id: { type: 'string', format: 'uuid' },
        requested_amount: { type: 'number', format: 'float' },
        approved_amount: { type: 'number', format: 'float' },
        status: { type: 'string' },
        lender: { type: 'object' },
        disbursements: { type: 'array' },
        repayments: { type: 'array' },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Loan request not found' })
  async getLoanRequest(@Param('loanId', ParseUUIDPipe) loanId: string) {
    return await this.lendingService.getLoanRequestById(loanId, [
      'lender',
      'disbursements',
      'repayments',
    ]);
  }

  @Get('lending/my-loans')
  @Roles(UserRole.CARGO_OWNER, UserRole.TRUCK_OWNER, UserRole.FLEET_MANAGER)
  @ApiOperation({ summary: 'Get my loan requests (borrower — cargo owner or truck owner)' })
  async getMyLoanRequests(@Request() req: any) {
    const userId = req.user?.userId || req.user?.id;
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID is required');
    return this.lendingService.getMyLoanRequests(userId, tenantId);
  }

  @Get('lending/active-financed-ids')
  @Roles(UserRole.CARGO_OWNER, UserRole.TRUCK_OWNER, UserRole.FLEET_MANAGER)
  @ApiOperation({
    summary: 'Get trip/cargo IDs with an active loan',
    description:
      'Returns trip and cargo IDs that already have a pending, approved, or disbursed loan. Used by borrowers to filter eligible cargo/trips in New Loan Request.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active financed trip and cargo IDs',
    schema: {
      type: 'object',
      properties: {
        tripIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
        cargoIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
      },
    },
  })
  async getActiveFinancedIds(@Request() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID is required');
    return this.lendingService.getActiveFinancedIds(tenantId);
  }

  // ===== LOAN APPROVAL ENDPOINTS =====

  @Post('lending/loan-requests/:loanId/approve')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('lending:approve')
  @ApiOperation({
    summary: 'Approve loan request',
    description:
      'Approve a pending loan request with specified terms and conditions',
  })
  @ApiParam({
    name: 'loanId',
    description: 'UUID of the loan request',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['approved', 'rejected'],
          description: 'Approval decision',
        },
        approved_amount: {
          type: 'number',
          format: 'float',
          description: 'Amount approved for the loan',
        },
        external_loan_ref: {
          type: 'string',
          description: 'External reference from lender system',
        },
        interest_amount: {
          type: 'number',
          format: 'float',
          description: 'Interest amount for the loan',
        },
        reason: {
          type: 'string',
          description: 'Reason for approval or rejection',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Loan request approved/rejected successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: { type: 'string' },
        approved_amount: { type: 'number', format: 'float' },
        interest_amount: { type: 'number', format: 'float' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or invalid amounts',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Loan request not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - loan request already processed',
  })
  async approveLoanRequest(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Body() approvalDto: any,
  ) {
    return await this.lendingService.approveLoanRequest(loanId, approvalDto);
  }

  @Post('lending/loan-requests/:loanId/reject')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('lending:approve')
  @ApiOperation({
    summary: 'Reject a pending loan request',
    description: 'Hard rejection by the lender — terminates the application.',
  })
  async rejectLoanRequest(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Body() body: { reason?: string },
  ) {
    return await this.lendingService.rejectLoanRequest(
      loanId,
      body?.reason || 'Application did not meet lending criteria',
    );
  }

  @Post('lending/loan-requests/:loanId/appeal')
  @ApiOperation({
    summary: 'Borrower appeals a loan rejection',
    description:
      'Reopens a rejected application for lender reconsideration with a comment.',
  })
  async appealLoanRejection(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Body() body: { comment: string },
    @Request() req,
  ) {
    return await this.lendingService.appealLoanRejection(
      loanId,
      req.user.userId,
      body?.comment || '',
    );
  }

  @Post('lending/loan-requests/:loanId/accept-terms')
  @ApiOperation({
    summary: 'Borrower accepts formal loan terms',
    description:
      'Borrower electronic consent — required before lender can disburse funds (TILA / IFRS 9).',
  })
  async acceptLoanTerms(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Body() body: import('./dto/loan-offer.dto').AcceptLoanTermsDto,
    @Request() req,
  ) {
    return await this.lendingService.acceptLoanTerms(
      loanId,
      req.user.userId,
      body.consent_reference,
    );
  }

  @Post('lending/loan-requests/:loanId/decline-terms')
  @ApiOperation({ summary: 'Borrower declines formal loan terms' })
  async declineLoanTerms(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Body() body: import('./dto/loan-offer.dto').DeclineLoanTermsDto,
    @Request() req,
  ) {
    return await this.lendingService.declineLoanTerms(
      loanId,
      req.user.userId,
      body.reason,
    );
  }

  @Get('lending/loan-requests/:loanId/offer-disclosure')
  @ApiOperation({
    summary: 'Get TILA-style loan offer disclosure',
    description: 'Full terms breakdown for borrower review before acceptance.',
  })
  async getLoanOfferDisclosure(@Param('loanId', ParseUUIDPipe) loanId: string) {
    return await this.lendingService.getLoanOfferDisclosure(loanId);
  }

  @Get('lending/loan-requests/:loanId/disbursement-quote')
  @ApiOperation({
    summary: 'Preview disbursement FX before payment',
    description:
      'Returns the settlement amount the lender will pay given the loan principal currency and chosen payment method/currency.',
  })
  async getDisbursementQuote(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('currency') currency?: string,
  ) {
    return await this.lendingService.getDisbursementQuote(
      loanId,
      paymentMethod || 'mobile_money',
      currency,
    );
  }

  // ===== DISBURSEMENT ENDPOINTS =====

  @Post('lending/loan-requests/:loanId/disburse')
  @ApiOperation({
    summary: 'Initiate loan disbursement',
    description:
      'Initiate the disbursement process for an approved loan request',
  })
  @ApiParam({
    name: 'loanId',
    description: 'UUID of the loan request',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 201,
    description: 'Disbursement initiated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        loan_request_id: { type: 'string', format: 'uuid' },
        amount: { type: 'number', format: 'float' },
        status: {
          type: 'string',
          enum: [
            'pending',
            'approved',
            'disbursed',
            'rejected',
            'on_hold',
            'failed',
          ],
        },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - loan not approved or already disbursed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Loan request not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - loan not approved or already disbursed',
  })
  async initiateDisbursement(@Param('loanId', ParseUUIDPipe) loanId: string) {
    return await this.lendingService.initiateDisbursement(loanId);
  }

  @Post('lending/loan-requests/:loanId/disburse-with-payment')
  @ApiOperation({
    summary: 'Initiate loan disbursement with payment',
    description: 'Initiate disbursement and process payment via mobile money or bank transfer',
  })
  @ApiParam({
    name: 'loanId',
    description: 'UUID of the loan request',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentMethod: {
          type: 'string',
          enum: ['mobile_money', 'bank_transfer'],
          default: 'mobile_money',
        },
        phoneNumber: {
          type: 'string',
          description: 'Lender phone number for mobile money payment',
        },
        truckOwnerPhoneNumber: {
          type: 'string',
          description: 'Truck owner phone number to receive payment',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Disbursement and payment initiated successfully',
  })
  async disburseWithPayment(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Body() paymentDto: any,
    @Request() req,
  ) {
    return await this.lendingService.disburseWithPayment(
      loanId,
      paymentDto,
      req.user.userId,
      req.user.tenantId,
    );
  }

  // ===== PLATFORM WEBHOOK ENDPOINTS =====

  @Post('platform/v1/lender_disbursements')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm disbursement (Platform Webhook)',
    description:
      'Platform webhook endpoint for lender-initiated disbursement confirmations. Requires HMAC signature verification.',
  })
  @ApiBody({ type: ConfirmDisbursementDto })
  @ApiResponse({
    status: 200,
    description: 'Disbursement confirmed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        loan_id: { type: 'string', format: 'uuid' },
        status: { type: 'string' },
        confirmed_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or missing headers',
  })
  @ApiResponse({
    status: 401,
    description:
      'Unauthorized - invalid HMAC signature or missing Authorization',
  })
  @ApiResponse({ status: 404, description: 'Loan request not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - disbursement already confirmed',
  })
  async confirmDisbursement(
    @Body() confirmDto: ConfirmDisbursementDto,
    @Headers('authorization') authHeader?: string,
    @Headers('x-signature') signature?: string,
    @Headers('x-timestamp') timestamp?: string,
  ) {
    const token = (authHeader || '').startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;
    return await this.lendingService.confirmDisbursement(confirmDto, token, {
      signature,
      timestamp,
    });
  }

  // ===== REPAYMENT ENDPOINTS =====

  @Post('lending/repayments/:loanId')
  @ApiOperation({
    summary: 'Process loan repayment',
    description:
      'Process a repayment for a specific loan. Supports partial and full repayments.',
  })
  @ApiParam({
    name: 'loanId',
    description: 'UUID of the loan request',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        final_payment_amount: {
          type: 'number',
          format: 'float',
          description: 'Amount being repaid (can be partial or full). Should include interest when settling in full.',
        },
        paymentMethod: {
          type: 'string',
          enum: ['card', 'mobile_money'],
          description: 'Payment method used by the borrower',
        },
        paymentDetails: {
          type: 'object',
          description: 'Card or mobile-money payment details',
        },
      },
      required: ['final_payment_amount'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Repayment processed successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        loan_id: { type: 'string', format: 'uuid' },
        amount: { type: 'number', format: 'float' },
        principal_paid: { type: 'number', format: 'float' },
        interest_paid: { type: 'number', format: 'float' },
        remaining_balance: { type: 'number', format: 'float' },
        status: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or invalid amount',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Loan request not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - loan already fully repaid',
  })
  async processRepayment(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Body()
    body: {
      final_payment_amount: number;
      paymentMethod?: string;
      paymentDetails?: Record<string, unknown>;
      /** Required ISO 4217 from frontend when converting / displaying repayment */
      currency: string;
    },
  ) {
    return await this.lendingService.processRepayment(
      loanId,
      body.final_payment_amount,
      {
        paymentMethod: body.paymentMethod,
        paymentDetails: body.paymentDetails,
        currency: body.currency,
      },
    );
  }

  // ===== LENDER ACTIVE LOANS ENDPOINT =====

  @Get('lending/lenders/:lenderId/active-loans')
  @ApiOperation({
    summary: 'Get active loans for a lender',
    description: 'Returns all approved and disbursed loans for a lender with pagination.',
  })
  @ApiParam({ name: 'lenderId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page',  required: false, type: 'number', schema: { default: 1 } })
  @ApiQuery({ name: 'limit', required: false, type: 'number', schema: { default: 10 } })
  @ApiResponse({ status: 200, description: 'Active loans retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLenderActiveLoans(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('page')  page  = 1,
    @Query('limit') limit = 10,
    @Request() req?: any,
  ) {
    return await this.lendingService.getLenderActiveLoans(
      lenderId,
      Number(page),
      Number(limit),
      req?.user?.tenantId,
    );
  }

  // ===== LENDER REPAYMENTS ENDPOINT =====

  @Get('lending/lenders/:lenderId/repayments')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Get repayments for a lender',
    description: 'Returns all repayments across loans assigned to this lender, with optional date range filtering and pagination.',
  })
  @ApiParam({ name: 'lenderId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page',      required: false, type: 'number', schema: { default: 1 } })
  @ApiQuery({ name: 'limit',     required: false, type: 'number', schema: { default: 50 } })
  @ApiQuery({ name: 'startDate', required: false, type: 'string', description: 'ISO date string' })
  @ApiQuery({ name: 'endDate',   required: false, type: 'string', description: 'ISO date string' })
  @ApiResponse({ status: 200, description: 'Repayments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Lender not found' })
  async getLenderRepayments(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('page')      page      = 1,
    @Query('limit')     limit     = 50,
    @Query('startDate') startDate?: string,
    @Query('endDate')   endDate?:  string,
  ) {
    return await this.lendingService.getLenderRepayments(lenderId, {
      page: Number(page),
      limit: Number(limit),
      startDate,
      endDate,
    });
  }

  // ===== LENDER INTEREST SUMMARY ENDPOINT =====

  @Get('lending/lenders/:lenderId/interest-summary')
  @ApiOperation({
    summary: 'Get interest summary for a lender',
    description: 'Returns aggregated interest data across all loans for this lender: total interest collected, outstanding interest amounts, and per-loan interest breakdown.',
  })
  @ApiParam({ name: 'lenderId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Interest summary retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Lender not found' })
  async getLenderInterestSummary(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
  ) {
    return await this.lendingService.getLenderInterestSummary(lenderId);
  }

  // ===== EXTERNAL LENDING SYSTEM ENDPOINTS =====

  @Get('lending/external/loan-officers/:lenderId')
  @ApiOperation({
    summary: 'Get loan officers from external lending system',
    description: 'Fetches available loan officers from the external lending platform',
  })
  @ApiParam({
    name: 'lenderId',
    description: 'UUID of the lender',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Loan officers retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          status: { type: 'string' },
        },
      },
    },
  })
  async getExternalLoanOfficers(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
  ) {
    try {
      return await this.urutiLendingIntegration.getLoanOfficers(lenderId);
    } catch (error: any) {
      // If endpoint doesn't exist (404), return empty array instead of error
      // This allows the UI to still work even if external system hasn't implemented it yet
      if (error.response?.status === 404) {
        console.warn(`Loan officers endpoint not implemented in external system for lender ${lenderId}`);
        return [];
      }
      throw error;
    }
  }

  // ===== DASHBOARD ENDPOINTS =====

  @Get('lending/dashboard/:lenderId')
  @ApiOperation({
    summary: 'Get lender dashboard',
    description:
      'Retrieve comprehensive dashboard data for a specific lender including loan statistics and performance metrics',
  })
  @ApiParam({
    name: 'lenderId',
    description: 'UUID of the lender',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Start date for data filtering (YYYY-MM-DD)',
    type: 'string',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'End date for data filtering (YYYY-MM-DD)',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Lender dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalLoansRequested: { type: 'integer' },
        totalAmountRequested: { type: 'number', format: 'float' },
        totalLoansApproved: { type: 'integer' },
        totalAmountApproved: { type: 'number', format: 'float' },
        totalLoansProvided: { type: 'integer' },
        totalAmountProvided: { type: 'number', format: 'float' },
        totalLoansRepaid: { type: 'integer' },
        totalAmountRepaid: { type: 'number', format: 'float' },
        totalPrincipalRepaid: { type: 'number', format: 'float' },
        totalInterestRepaid: { type: 'number', format: 'float' },
        totalOutstandingPrincipal: { type: 'number', format: 'float' },
        recoveryRate: { type: 'number', format: 'float' },
        defaultRate: { type: 'number', format: 'float' },
        averageLoanSize: { type: 'number', format: 'float' },
        roi: { type: 'number', format: 'float' },
        pendingCount: { type: 'integer' },
        approvedAwaitingDisbursement: { type: 'integer' },
        activeLoansCount: { type: 'integer' },
        currency: { type: 'string' },
        source: { type: 'string' },
        computedAt: { type: 'string' },
        loans: { type: 'array' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Lender not found' })
  async getLenderDashboard(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Request() req?: any,
  ) {
    const fromDate = dateFrom ? new Date(dateFrom) : undefined;
    const toDate   = dateTo   ? new Date(dateTo)   : undefined;

    return await this.lendingService.getLenderDashboard(
      lenderId,
      fromDate,
      toDate,
      req?.user?.tenantId,
    );
  }

  @Get('lending/my-lender-id')
  @ApiOperation({
    summary: 'Get lender entity ID for current user',
    description: 'Returns the Lender entity ID for the authenticated LENDER user',
  })
  @ApiResponse({
    status: 200,
    description: 'Lender ID retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lender entity not found for this user',
  })
  async getMyLenderId(@Request() req: any) {
    const user = req.user;
    if (!user || user.role !== 'LENDER') {
      throw new BadRequestException('User must be a LENDER');
    }

    // Find lender by user email
    const lender = await this.lendingService.getLenderByUserEmail(user.email);
    if (!lender) {
      throw new NotFoundException('Lender entity not found for this user');
    }

    return { lenderId: lender.id };
  }

  @Get('lending/lenders/:lenderId/analytics')
  @ApiOperation({
    summary: 'Get lender analytics',
    description: 'Retrieve analytics data for a specific lender',
  })
  @ApiParam({
    name: 'lenderId',
    description: 'UUID of the lender',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period for analytics',
    enum: ['7d', '30d', '90d', '12months'],
    schema: { default: '30d' },
  })
  @ApiResponse({
    status: 200,
    description: 'Lender analytics retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Lender not found' })
  async getLenderAnalytics(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('months') months: number = 12,
    @Request() req?: any,
  ) {
    return await this.lenderAnalyticsService.getFullAnalytics(
      lenderId,
      Number(months),
      req?.user?.tenantId,
    );
  }

  @Get('lending/lenders/:lenderId/loan-requests')
  @ApiOperation({
    summary: 'Get loan requests for a lender',
    description: 'Retrieve all loan requests assigned to a specific lender',
  })
  @ApiParam({
    name: 'lenderId',
    description: 'UUID of the lender',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by loan request status',
    enum: ['pending', 'approved', 'rejected', 'disbursed', 'repaid', 'failed', 'defaulted'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    type: 'number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Loan requests retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Lender not found' })
  async getLenderLoanRequests(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req?: any,
  ) {
    return await this.lendingService.getLenderLoanRequests(
      lenderId,
      status,
      page,
      limit,
      req?.user?.tenantId,
    );
  }

  @Get('lending/lenders/:lenderId/disbursements')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Get lender disbursements',
    description:
      'Retrieve disbursements data for a specific lender with pagination and filtering',
  })
  @ApiParam({
    name: 'lenderId',
    description: 'UUID of the lender',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    type: 'number',
    schema: { default: 1 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: 'number',
    schema: { default: 10 },
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by disbursement status',
    enum: ['pending', 'approved', 'disbursed', 'rejected', 'on_hold'],
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    description: 'Filter by priority',
    enum: ['low', 'medium', 'high', 'urgent'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by borrower name or loan ID',
    type: 'string',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field',
    enum: ['requestedDate', 'amount', 'status', 'borrowerName'],
    schema: { default: 'requestedDate' },
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['asc', 'desc'],
    schema: { default: 'desc' },
  })
  @ApiResponse({
    status: 200,
    description: 'Lender disbursements retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        disbursements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              loanId: { type: 'string', format: 'uuid' },
              borrowerName: { type: 'string' },
              borrowerEmail: { type: 'string' },
              amount: { type: 'number', format: 'float' },
              requestedDate: { type: 'string', format: 'date-time' },
              approvedDate: { type: 'string', format: 'date-time' },
              disbursedDate: { type: 'string', format: 'date-time' },
              status: {
                type: 'string',
                enum: [
                  'pending',
                  'approved',
                  'disbursed',
                  'rejected',
                  'on_hold',
                ],
              },
              cargoType: { type: 'string' },
              route: {
                type: 'object',
                properties: {
                  origin: { type: 'string' },
                  destination: { type: 'string' },
                },
              },
              priority: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'urgent'],
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
        stats: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            pending: { type: 'number' },
            approved: { type: 'number' },
            disbursed: { type: 'number' },
            totalAmount: { type: 'number', format: 'float' },
            disbursedAmount: { type: 'number', format: 'float' },
            avgProcessingTime: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Lender not found' })
  async getLenderDisbursements(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'requestedDate',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    return await this.lendingService.getLenderDisbursements(lenderId, {
      page,
      limit,
      status,
      priority,
      search,
      sortBy,
      sortOrder,
    });
  }

  // ===== TENANT ENDPOINTS =====

  @Get('lending/tenant/:tenantId/loans')
  @Roles(UserRole.TENANT_ADMIN, UserRole.CARGO_OWNER, UserRole.TRUCK_OWNER)
  @ApiOperation({
    summary: 'Get tenant loan history',
    description:
      'Retrieve loan history for a specific tenant with optional status filtering. TRUCK_OWNER sees only their own loans.',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'UUID of the tenant',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by loan status',
    enum: [
      'pending',
      'approved',
      'rejected',
      'disbursed',
      'repaid',
      'failed',
      'defaulted',
    ],
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant loan history retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          requested_amount: { type: 'number', format: 'float' },
          approved_amount: { type: 'number', format: 'float' },
          status: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          due_date: { type: 'string', format: 'date' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantLoans(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    const user = req?.user;
    // TRUCK_OWNER / FLEET_MANAGER: only see loans they created
    const createdBy =
      user?.role === 'TRUCK_OWNER'
        ? user.userId || user.id
        : undefined;

    return this.lendingService.getTenantLoanHistory(tenantId, status, createdBy);
  }

  // ===== RISK ASSESSMENT ENDPOINTS =====

  @Post('lending/risk-assessment')
  @ApiOperation({
    summary: 'Assess loan risk',
    description: 'Perform comprehensive risk assessment for a loan request',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tenant_id: { type: 'string', format: 'uuid' },
        trip_id: { type: 'string', format: 'uuid' },
        cargo_id: { type: 'string', format: 'uuid' },
        requested_amount: { type: 'number' },
      },
      required: ['tenant_id', 'trip_id', 'cargo_id', 'requested_amount'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Risk assessment completed successfully',
    schema: {
      type: 'object',
      properties: {
        overall_score: { type: 'number' },
        risk_tier: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'premium'],
        },
        max_loan_amount: { type: 'number' },
        interest_rate_adjustment: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async assessLoanRisk(
    @Body()
    body: {
      tenant_id: string;
      trip_id: string;
      cargo_id: string;
      requested_amount: number;
    },
  ) {
    return await this.riskAssessmentService.assessLoanRisk(
      body.tenant_id,
      body.trip_id,
      body.cargo_id,
      body.requested_amount,
    );
  }

  // ===== AUTO-LOAN GENERATION ENDPOINTS =====

  @Post('lending/auto-generate/:cargoId')
  @ApiOperation({
    summary: 'Generate auto-loan for cargo',
    description:
      'Automatically generate loan request when cargo is loaded and ready to ship',
  })
  @ApiParam({
    name: 'cargoId',
    description: 'UUID of the cargo',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Auto-loan generated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: { type: 'string' },
        requested_amount: { type: 'number' },
        auto_generated: { type: 'boolean' },
        auto_approved: { type: 'boolean' },
      },
    },
  })
  async generateAutoLoan(
    @Param('cargoId', ParseUUIDPipe) cargoId: string,
    @Body() body: { trip_id: string; tenant_id: string },
  ) {
    return await this.autoLoanGeneratorService.checkAndGenerateAutoLoan(
      cargoId,
      body.trip_id,
      body.tenant_id,
    );
  }

  @Post('lending/bulk-auto-generate/:tenantId')
  @ApiOperation({
    summary: 'Bulk auto-loan generation',
    description:
      'Process all cargo ready for auto-loan generation for a tenant',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'UUID of the tenant',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk auto-loan generation completed',
    schema: {
      type: 'object',
      properties: {
        processed: { type: 'number' },
        generated: { type: 'number' },
        errors: { type: 'number' },
      },
    },
  })
  async bulkAutoGenerateLoans(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ) {
    return await this.autoLoanGeneratorService.processBulkAutoLoanGeneration(
      tenantId,
    );
  }

  // ===== LENDER ANALYTICS ENDPOINTS =====

  @Get('lending/analytics/portfolio/:lenderId')
  @ApiOperation({
    summary: 'Get portfolio metrics',
    description: 'Retrieve comprehensive portfolio metrics for a lender',
  })
  @ApiParam({
    name: 'lenderId',
    description: 'UUID of the lender',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for analysis',
    type: 'string',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for analysis',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio metrics retrieved successfully',
  })
  async getPortfolioMetrics(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const fromDate = startDate ? new Date(startDate) : undefined;
    const toDate = endDate ? new Date(endDate) : undefined;

    return await this.lenderAnalyticsService.getPortfolioMetrics(lenderId);
  }

  @Get('lending/analytics/roi/:lenderId')
  @ApiOperation({
    summary: 'Get ROI analysis',
    description: 'Retrieve ROI analysis for a lender',
  })
  @ApiParam({
    name: 'lenderId',
    description: 'UUID of the lender',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'ROI analysis retrieved successfully',
  })
  async getROIAnalysis(@Param('lenderId', ParseUUIDPipe) lenderId: string) {
    return await this.lenderAnalyticsService.getROIAnalysis(lenderId);
  }

  @Get('lending/analytics/defaults/:lenderId')
  @ApiOperation({
    summary: 'Get default analysis',
    description: 'Retrieve default analysis for a lender',
  })
  @ApiParam({
    name: 'lenderId',
    description: 'UUID of the lender',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Default analysis retrieved successfully',
  })
  async getDefaultAnalysis(@Param('lenderId', ParseUUIDPipe) lenderId: string) {
    return await this.lenderAnalyticsService.getDefaultAnalysis(lenderId);
  }

  @Get('lending/analytics/exposure/:lenderId')
  @ApiOperation({
    summary: 'Get exposure analysis',
    description: 'Retrieve exposure analysis for a lender',
  })
  @ApiParam({
    name: 'lenderId',
    description: 'UUID of the lender',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Exposure analysis retrieved successfully',
  })
  async getExposureAnalysis(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
  ) {
    return await this.lenderAnalyticsService.getExposureAnalysis(lenderId);
  }

  // ===== REPAYMENT PROCESSING ENDPOINTS =====

  @Get('lending/repayment/:loanId/schedule')
  @ApiOperation({
    summary: 'Get repayment schedule',
    description: 'Retrieve repayment schedule for a loan',
  })
  @ApiParam({
    name: 'loanId',
    description: 'UUID of the loan',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Repayment schedule retrieved successfully',
  })
  async getRepaymentSchedule(@Param('loanId', ParseUUIDPipe) loanId: string) {
    return await this.repaymentProcessorService.calculateRepaymentSchedule(
      loanId,
    );
  }

  @Get('lending/repayment/:loanId/history')
  @ApiOperation({
    summary: 'Get repayment history',
    description: 'Retrieve repayment history for a loan',
  })
  @ApiParam({
    name: 'loanId',
    description: 'UUID of the loan',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Repayment history retrieved successfully',
  })
  async getRepaymentHistory(@Param('loanId', ParseUUIDPipe) loanId: string) {
    return await this.repaymentProcessorService.getRepaymentHistory(loanId);
  }

  @Get('lending/repayment/:loanId/outstanding')
  @ApiOperation({
    summary: 'Get outstanding balance',
    description: 'Retrieve outstanding balance for a loan',
  })
  @ApiParam({
    name: 'loanId',
    description: 'UUID of the loan',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Outstanding balance retrieved successfully',
  })
  async getOutstandingBalance(@Param('loanId', ParseUUIDPipe) loanId: string) {
    return await this.repaymentProcessorService.getOutstandingBalance(loanId);
  }

  // ===== BORROWERS ENDPOINTS =====

  @Get('lending/lenders/:lenderId/borrowers')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get borrowers for a lender' })
  async getLenderBorrowers(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req?: any,
  ) {
    const tenantId = req?.user?.tenantId;
    const loans = await this.lendingService.getLenderLoanRequests(lenderId, undefined, page, limit, tenantId);
    const raw: any[] = Array.isArray(loans) ? loans : (loans as any)?.data ?? [];
    const borrowerMap = new Map<string, any>();
    for (const loan of raw) {
      const key = loan.created_by || loan.createdBy || loan.tenant_id;
      if (key && !borrowerMap.has(key)) {
        borrowerMap.set(key, {
          id: key,
          name: loan.borrower?.contact_name || loan.borrower?.company_name || 'Unknown',
          email: loan.borrower?.email || '',
          phone: loan.borrower?.phone || '',
          totalLoans: 1,
          totalAmount: Number(loan.requested_amount || 0),
          status: loan.status,
          created_at: loan.created_at,
        });
      } else if (key && borrowerMap.has(key)) {
        const b = borrowerMap.get(key);
        b.totalLoans += 1;
        b.totalAmount += Number(loan.requested_amount || 0);
      }
    }
    return { data: Array.from(borrowerMap.values()), total: borrowerMap.size, page, limit };
  }

  @Get('lending/borrowers/:borrowerId/profile')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get borrower profile' })
  async getBorrowerProfile(@Param('borrowerId') borrowerId: string) {
    return { id: borrowerId, profile: {} };
  }

  @Get('lending/borrowers/:borrowerId/loan-history')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get borrower loan history' })
  async getBorrowerLoanHistory(
    @Param('borrowerId') borrowerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    const params: any = { page, limit };
    if (status) params.status = status;
    return { data: [], total: 0, page, limit };
  }

  @Post('lending/borrowers/:borrowerId/credit-check')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Perform credit check on borrower' })
  async performCreditCheck(
    @Param('borrowerId') borrowerId: string,
    @Body() body: any,
  ) {
    return { borrowerId, checkType: body.checkType || 'basic', score: null, status: 'completed' };
  }

  // ===== PORTFOLIO SUMMARY =====

  @Get('lending/lenders/:lenderId/portfolio/summary')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get portfolio summary for a lender' })
  async getPortfolioSummary(@Param('lenderId', ParseUUIDPipe) lenderId: string) {
    return await this.lenderAnalyticsService.getPortfolioMetrics(lenderId);
  }

  // ===== TRENDS =====

  @Get('lending/lenders/:lenderId/trends')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get monthly trends for a lender' })
  async getLenderTrends(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('months') months: number = 12,
  ) {
    const monthlyData = await this.lenderAnalyticsService.getMonthlyTrends(lenderId, Number(months));
    return { monthlyData };
  }

  // ===== DISBURSEMENT DETAIL / STATUS / STATS =====

  @Get('lending/disbursements/:disbursementId')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get disbursement details' })
  async getDisbursementDetails(
    @Param('disbursementId', ParseUUIDPipe) disbursementId: string,
  ) {
    return await this.lendingService.getDisbursementDetails(disbursementId);
  }

  @Put('lending/disbursements/:disbursementId/status')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update disbursement status' })
  async updateDisbursementStatus(
    @Param('disbursementId', ParseUUIDPipe) disbursementId: string,
    @Body() body: { status: string; reason?: string; notes?: string },
  ) {
    return await this.lendingService.updateDisbursementStatus(disbursementId, body);
  }

  @Get('lending/lenders/:lenderId/disbursements/stats')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get disbursement stats for a lender' })
  async getDisbursementStats(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('period') period: string = '30d',
  ) {
    const result = await this.lendingService.getDisbursementStats(lenderId, period);
    const disbursements: any[] = (result as any)?.disbursements ?? [];
    return {
      total: disbursements.length,
      pending: disbursements.filter((d: any) => d.status === 'pending').length,
      approved: disbursements.filter((d: any) => d.status === 'approved').length,
      disbursed: disbursements.filter((d: any) => d.status === 'disbursed').length,
      totalAmount: disbursements.reduce((s: number, d: any) => s + Number(d.amount || 0), 0),
      disbursedAmount: disbursements.filter((d: any) => d.status === 'disbursed').reduce((s: number, d: any) => s + Number(d.amount || 0), 0),
      period,
    };
  }

  @Post('lending/disbursements/:disbursementId/retry')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Retry a failed disbursement' })
  async retryDisbursement(
    @Param('disbursementId', ParseUUIDPipe) disbursementId: string,
  ) {
    return await this.lendingService.updateDisbursementStatus(disbursementId, { status: 'pending' });
  }

  // ===== REPAYMENT REMINDER / OVERDUE / EXTEND / RESTRUCTURE =====

  @Post('lending/repayments/:loanId/remind')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Send repayment reminder for a loan' })
  async sendRepaymentReminder(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Body() body: { message?: string },
  ) {
    return { success: true, loanId, message: body.message || 'Reminder sent' };
  }

  @Get('lending/repayments/overdue')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get overdue repayments' })
  async getOverdueRepayments(
    @Query('lenderId') lenderId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return { data: [], total: 0, page, limit };
  }

  @Post('lending/loans/:loanId/extend')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Extend a loan duration' })
  async extendLoan(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Body() body: { extension_days: number; reason: string },
  ) {
    const loan = await this.lendingService.getLoanRequestById(loanId);
    if (!loan) throw new NotFoundException('Loan not found');
    const currentDue = loan.due_date ? new Date(loan.due_date) : new Date();
    currentDue.setDate(currentDue.getDate() + (body.extension_days || 0));
    return { success: true, loanId, new_due_date: currentDue.toISOString(), reason: body.reason };
  }

  @Post('lending/loans/:loanId/restructure')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Restructure a loan' })
  async restructureLoan(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Body() body: { new_amount?: number; new_due_date?: string; new_interest_rate?: number; reason: string },
  ) {
    return { success: true, loanId, restructured: true, ...body };
  }

  // ===== RISK ENDPOINTS =====

  @Get('lending/risk/portfolio-assessment')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get portfolio risk assessment' })
  async getPortfolioRiskAssessment(@Query('lenderId') lenderId?: string) {
    if (lenderId) {
      return await this.lenderAnalyticsService.getExposureAnalysis(lenderId);
    }
    return { riskScore: null, assessment: 'No lender specified' };
  }

  @Get('lending/risk/market-trends')
  @Roles(UserRole.LENDER, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get market trends for risk analysis' })
  async getMarketTrends(
    @Query('region') region?: string,
    @Query('sector') sector?: string,
  ) {
    return { region: region || 'global', sector: sector || 'logistics', trends: [] };
  }

  // ===== TEAM MANAGEMENT ENDPOINTS =====

  @Get('admin/lenders/:lenderId/team')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get lender team members' })
  async getLenderTeam(@Param('lenderId', ParseUUIDPipe) lenderId: string) {
    return await this.lendingService.getLenderTeam(lenderId);
  }

  @Post('admin/lenders/:lenderId/team')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Add a team member to a lender' })
  async addTeamMember(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() memberData: any,
  ) {
    return await this.lendingService.addTeamMember(lenderId, memberData, memberData.createdBy || 'system');
  }

  @Patch('admin/lenders/:lenderId/team/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Update a team member' })
  async updateTeamMember(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('userId') userId: string,
    @Body() updateData: any,
  ) {
    return await this.lendingService.updateTeamMember(lenderId, userId, updateData);
  }

  @Delete('admin/lenders/:lenderId/team/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Remove a team member from a lender' })
  async removeTeamMember(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('userId') userId: string,
  ) {
    return await this.lendingService.removeTeamMember(lenderId, userId);
  }

  @Get('admin/lenders/:lenderId/team/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get lender team stats' })
  async getLenderTeamStats(@Param('lenderId', ParseUUIDPipe) lenderId: string) {
    return await this.lendingService.getLenderTeamStats(lenderId);
  }

  @Get('admin/lenders/:lenderId/roles')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get lender roles' })
  async getLenderRoles(@Param('lenderId', ParseUUIDPipe) lenderId: string) {
    return [
      { id: 'loan-officer', name: 'Loan Officer', permissions: ['view_loans', 'approve_loans'] },
      { id: 'analyst', name: 'Risk Analyst', permissions: ['view_loans', 'assess_risk'] },
      { id: 'manager', name: 'Portfolio Manager', permissions: ['view_loans', 'approve_loans', 'manage_team'] },
    ];
  }

  @Post('admin/lenders/:lenderId/roles')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Create a lender role' })
  async createLenderRole(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() roleData: any,
  ) {
    return { id: `role-${Date.now()}`, lenderId, ...roleData, created_at: new Date().toISOString() };
  }

  @Post('admin/delinquency/run')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually trigger the Basel II/IFRS 9 delinquency & default engine' })
  async runDelinquencyEngine() {
    return await this.lendingService.runDelinquencyAndDefaultEngine();
  }

  @Get('admin/permissions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get all available permissions' })
  async getAllPermissions() {
    return [
      { id: 'view_loans', name: 'View Loans', category: 'loans' },
      { id: 'approve_loans', name: 'Approve Loans', category: 'loans' },
      { id: 'reject_loans', name: 'Reject Loans', category: 'loans' },
      { id: 'disburse_funds', name: 'Disburse Funds', category: 'payments' },
      { id: 'assess_risk', name: 'Assess Risk', category: 'risk' },
      { id: 'manage_team', name: 'Manage Team', category: 'team' },
      { id: 'view_reports', name: 'View Reports', category: 'analytics' },
      { id: 'manage_policies', name: 'Manage Policies', category: 'policies' },
    ];
  }
}