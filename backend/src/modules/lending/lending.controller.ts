import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
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
import { CreateLenderDto } from './dto/create-lender.dto';
import { CreateLenderPolicyDto } from './dto/create-lender-policy.dto';
import { CreateLoanRequestDto } from './dto/loan-request.dto';
import { ConfirmDisbursementDto } from './dto/disbursement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
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
  ) {}

  // ===== ADMIN ENDPOINTS =====

  @Post('admin/lenders')
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Create a new lender',
    description:
      'Admin endpoint to create a new lending institution with basic information',
  })
  @ApiBody({ type: CreateLenderDto })
  @ApiResponse({
    status: 201,
    description: 'Lender created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        contact_email: { type: 'string' },
        status: { type: 'string', enum: ['active', 'paused', 'suspended'] },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async createLender(@Body() createLenderDto: CreateLenderDto) {
    return await this.lendingService.createLender(createLenderDto);
  }

  @Post('admin/lenders/:lenderId/policy')
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN)
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

  @Post('lending/cargo/:cargoId/loan-request')
  @UseGuards(JwtAuthGuard)
  async createLoanRequestForCargo(
    @Param('cargoId', ParseUUIDPipe) cargoId: string,
    @Body() body: { trip_id: string },
    @Request() req: any,
  ) {
    return await this.lendingService.createLoanRequestForLoadedCargo(
      cargoId,
      body.trip_id,
      req.user.tenantId,
      req?.user?.userId,
    );
  }

  @Post('admin/lenders/:lenderId/status')
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN)
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

  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN)
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
  async getAllLenders(@Query('status') status?: string) {
    return await this.lendingService.getAllLenders();
  }

  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN)
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

  // ===== LOAN REQUEST ENDPOINTS =====

  @Post('lending/loan-requests')
  @ApiOperation({
    summary: 'Create loan request',
    description: 'Create a new loan request for cargo transportation financing',
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

  // ===== LOAN APPROVAL ENDPOINTS =====

  @Post('lending/loan-requests/:loanId/approve')
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
          description: 'Amount being repaid (can be partial or full)',
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
    @Body() body: { final_payment_amount: number },
  ) {
    return await this.lendingService.processRepayment(
      loanId,
      body.final_payment_amount,
    );
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
        totalLoansIssued: { type: 'integer' },
        totalOutstandingPrincipal: { type: 'number', format: 'float' },
        recoveryRate: { type: 'number', format: 'float' },
        defaultRate: { type: 'number', format: 'float' },
        averageLoanSize: { type: 'number', format: 'float' },
        roi: { type: 'number', format: 'float' },
        totalInterestCollected: { type: 'number', format: 'float' },
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
  ) {
    const fromDate = dateFrom ? new Date(dateFrom) : undefined;
    const toDate = dateTo ? new Date(dateTo) : undefined;

    return await this.lendingService.getLenderDashboard(
      lenderId,
      fromDate,
      toDate,
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
    default: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: 'number',
    default: 10,
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
    default: 'requestedDate',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
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
  @ApiOperation({
    summary: 'Get tenant loan history',
    description:
      'Retrieve loan history for a specific tenant with optional status filtering',
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
  ) {
    const queryBuilder = this.lendingService.getTenantLoansQuery(tenantId);

    if (status) {
      queryBuilder.andWhere('loan.status = :status', { status });
    }

    return await queryBuilder.getMany();
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

    return await this.lenderAnalyticsService.getPortfolioMetrics(
      lenderId,
      fromDate,
      toDate,
    );
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
}
