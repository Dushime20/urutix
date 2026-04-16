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

  // ===== ADMIN ENDPOINTS =====

  @Post('admin/lenders')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN)
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
  async createLender(@Body() createLenderDto: CreateLenderDto, @Request() req: any) {
    // For ADMIN users, tenantId is null/undefined. For TENANT_ADMIN, use their tenantId
    const tenantId = req.user?.role === UserRole.TENANT_ADMIN ? req.user.tenantId : null;
    return await this.lendingService.createLender(createLenderDto, tenantId);
  }

  @Post('tenant/lenders')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Create a new lender for tenant',
    description:
      'Tenant admin endpoint to create a new lending institution for their tenant',
  })
  @ApiBody({ type: CreateLenderDto })
  @ApiResponse({
    status: 201,
    description: 'Lender created successfully',
  })
  async createTenantLender(@Body() createLenderDto: CreateLenderDto, @Request() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
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

  @Post('lending/cargo/:cargoId/loan-request')
  @UseGuards(JwtAuthGuard)
  async createLoanRequestForCargo(
    @Param('cargoId', ParseUUIDPipe) cargoId: string,
    @Body() body: { trip_id?: string; lender_id?: string },
    @Request() req: any,
  ) {
    return await this.lendingService.createLoanRequestForLoadedCargo(
      cargoId,
      body.trip_id,
      req.user.tenantId,
      req?.user?.userId,
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
    summary: 'Get all lenders for tenant',
    description: 'Get list of active lenders available for the tenant, including loan officers from external systems',
  })
  @ApiResponse({
    status: 200,
    description: 'Lenders retrieved successfully',
  })
  async getTenantLenders(@Request() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    // Get lenders for the tenant
    let lenders = await this.lendingService.getAllLenders(tenantId);

    // Filter to only show active lenders for cargo owners
    if (req.user?.role === UserRole.CARGO_OWNER) {
      lenders = lenders.filter((lender: any) =>
        lender.status === 'active' || lender.status === LenderStatus.ACTIVE
      );
    }

    // Also get external system lenders (regardless of tenant) - these should be available to all cargo owners
    const externalLenders = await this.lendingService.getAllLenders(undefined, 'active');

    // Log all lenders for debugging
    console.log(`[getTenantLenders] Total active lenders (no tenant filter): ${externalLenders.length}`);
    externalLenders.forEach((lender: any) => {
      console.log(`[getTenantLenders] Lender: ${lender.name} (${lender.id})`, {
        status: lender.status,
        hasMetadata: !!lender.metadata,
        integrationType: lender.metadata?.integrationType,
        callback_url: lender.callback_url,
        hasApiKey: !!lender.outbound_api_key_encrypted,
      });
    });

    const externalSystemLenders = externalLenders.filter((lender: any) => {
      const hasIntegrationType = lender.metadata?.integrationType === 'uruti_lending_platform' ||
        lender.metadata?.integrationType === 'external_lending_system';
      const hasCallbackUrl = lender.callback_url?.includes('urutilending.com') ||
        lender.callback_url?.includes('localhost:3000') ||
        lender.callback_url?.includes('localhost:3001') ||
        lender.callback_url?.includes('localhost:3002');
      const hasApiKey = !!lender.outbound_api_key_encrypted;

      // A lender is external if it has integrationType OR (callback_url AND API key)
      const isExternal = hasIntegrationType || (hasCallbackUrl && hasApiKey);

      if (isExternal) {
        console.log(`[getTenantLenders] ✅ External system lender found: ${lender.name}`, {
          integrationType: lender.metadata?.integrationType,
          callback_url: lender.callback_url,
          hasApiKey: hasApiKey,
        });
      } else {
        // Log why it's not considered external (for debugging)
        if (hasCallbackUrl && !hasApiKey) {
          console.log(`[getTenantLenders] ⚠️ Lender ${lender.name} has callback_url but no API key - not considered external`);
        }
      }

      return isExternal;
    });

    // Log for debugging
    console.log(`[getTenantLenders] Found ${externalSystemLenders.length} external system lenders`);

    if (externalSystemLenders.length === 0) {
      console.warn(`[getTenantLenders] ⚠️ No external system lenders found!`);
      console.warn(`[getTenantLenders] To configure a lender for external system:`);
      console.warn(`[getTenantLenders] 1. Create a lender (POST /api/admin/lenders)`);
      console.warn(`[getTenantLenders] 2. Configure it (POST /api/admin/uruti-lending/configure)`);
      console.warn(`[getTenantLenders] 3. Ensure lender status is 'active'`);
    }

    // Add external system lenders themselves to the list (so cargo owners can select them)
    // Filter out any that are already in the tenant's lender list
    const existingLenderIds = new Set(lenders.map((l: any) => l.id));
    const externalLendersToAdd = externalSystemLenders
      .filter((lender: any) => !existingLenderIds.has(lender.id))
      .map((lender: any) => {
        // Ensure integrationType is set in metadata for frontend detection
        const metadata = lender.metadata || {};
        if (!metadata.integrationType) {
          // Set integrationType based on callback_url if not already set
          if (lender.callback_url?.includes('urutilending.com') || lender.callback_url?.includes('localhost:3000')) {
            metadata.integrationType = 'uruti_lending_platform';
          } else {
            metadata.integrationType = 'external_lending_system';
          }
        }

        return {
          ...lender,
          metadata: {
            ...metadata,
            isExternalSystemLender: true,
          },
        };
      });

    console.log(`[getTenantLenders] Adding ${externalLendersToAdd.length} external system lenders to the list`);

    // Fetch loan officers from each external system lender - these will be displayed directly in External Lending System tab
    const loanOfficersAsLenders: any[] = [];

    for (const externalLender of externalSystemLenders) {
      if (!externalLender.outbound_api_key_encrypted) {
        console.warn(`[getTenantLenders] Lender ${externalLender.id} (${externalLender.name}) has no API key configured - skipping loan officer fetch`);
        continue;
      }

      console.log(`[getTenantLenders] Fetching loan officers for lender ${externalLender.id} (${externalLender.name})`);

      // getLoanOfficers now returns empty array on error instead of throwing
      const officers = await this.urutiLendingIntegration.getLoanOfficers(externalLender.id);

      console.log(`[getTenantLenders] ✅ Found ${officers.length} loan officers for lender ${externalLender.id}`);

      if (officers.length === 0) {
        console.warn(`[getTenantLenders] ⚠️ No loan officers returned for lender ${externalLender.id} (${externalLender.name})`);
        console.warn(`[getTenantLenders] Possible reasons:`);
        console.warn(`  1. External system endpoint returns empty array (no loan officers exist)`);
        console.warn(`  2. Endpoint not implemented (404 - check logs above)`);
        console.warn(`  3. API key is invalid (401 - check logs above)`);
        console.warn(`  4. External system is unreachable (network error - check logs above)`);
        continue;
      }

      // Convert loan officers to lender-like format - these ARE the external lenders
      for (const officer of officers) {
        if (!officer.id || !officer.name) {
          console.warn(`[getTenantLenders] ⚠️ Skipping invalid loan officer (missing id or name):`, officer);
          continue;
        }

        console.log(`[getTenantLenders] ✅ Adding loan officer: ${officer.name} (${officer.id})`);

        loanOfficersAsLenders.push({
          id: `officer-${officer.id}`, // Prefix to distinguish from regular lenders
          name: officer.name,
          firstName: officer.name?.split(' ')[0] || '',
          lastName: officer.name?.split(' ').slice(1).join(' ') || '',
          email: officer.email,
          phone: officer.phone,
          companyName: externalLender.name, // Parent lender name
          availableCredit: 0,
          interestRate: 0,
          metadata: {
            ...externalLender.metadata,
            isLoanOfficer: true,
            loanOfficerId: officer.id,
            parentLenderId: externalLender.id,
            parentLenderName: externalLender.name,
            specialization: officer.specialization,
            maxLoanAmount: officer.maxLoanAmount,
            minLoanAmount: officer.minLoanAmount,
            integrationType: externalLender.metadata?.integrationType || 'external_lending_system',
          },
          // Store original lender reference for API calls
          _originalLenderId: externalLender.id,
          _originalOfficerId: officer.id,
        });
      }
    }

    console.log(`[getTenantLenders] Returning ${lenders.length} regular lenders, ${externalLendersToAdd.length} external system lenders, and ${loanOfficersAsLenders.length} loan officers`);

    // For external lending system: return loan officers instead of the lender itself
    // Loan officers ARE the external lenders - they're what cargo owners should select
    // Combine: regular lenders + loan officers (loan officers replace external lenders in the list)
    return [...lenders, ...loanOfficersAsLenders];
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
    @Query('period') period: string = '30d',
  ) {
    return await this.lendingService.getLenderAnalytics(lenderId, period);
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
  ) {
    return await this.lendingService.getLenderLoanRequests(
      lenderId,
      status,
      page,
      limit,
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
  @Roles(UserRole.TENANT_ADMIN, UserRole.CARGO_OWNER)
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
    // TODO: Implement getLoansByTenantId method in LendingService
    return { message: 'Method not implemented yet', tenantId, status };
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
