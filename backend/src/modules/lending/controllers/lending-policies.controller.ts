import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ValidationPipe,
  UsePipes,
  HttpStatus,
  HttpCode,
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
import { LendingPoliciesService } from '../services/lending-policies.service';
import {
  CreateInterestRatePolicyDto,
  UpdateInterestRatePolicyDto,
  CreateLoanLimitPolicyDto,
  UpdateLoanLimitPolicyDto,
  CreateEligibilityPolicyDto,
  UpdateEligibilityPolicyDto,
  CreateRiskAssessmentPolicyDto,
  UpdateRiskAssessmentPolicyDto,
  CreateRepaymentPolicyDto,
  UpdateRepaymentPolicyDto,
  CreateCargoTypePolicyDto,
  UpdateCargoTypePolicyDto,
  CreateSystemConfigPolicyDto,
  UpdateSystemConfigPolicyDto,
} from '../dto/lending-policy.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@ApiTags('Lending Policies')
@ApiBearerAuth()
@Controller('lending/policies')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class LendingPoliciesController {
  constructor(private readonly lendingPoliciesService: LendingPoliciesService) {}

  // ===== INTEREST RATE POLICIES =====

  @Post(':lenderId/interest-rates')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({
    summary: 'Create interest rate policy',
    description: 'Create a new interest rate policy for a lender',
  })
  @ApiParam({ name: 'lenderId', description: 'Lender ID' })
  @ApiBody({ type: CreateInterestRatePolicyDto })
  @ApiResponse({ status: 201, description: 'Interest rate policy created successfully' })
  async createInterestRatePolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() dto: CreateInterestRatePolicyDto,
    @Request() req: any,
  ) {
    return this.lendingPoliciesService.createInterestRatePolicy(
      lenderId,
      dto,
      req.user?.userId || req.user?.id,
    );
  }

  @Get(':lenderId/interest-rates')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get interest rate policies' })
  @ApiParam({ name: 'lenderId', description: 'Lender ID' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  async getInterestRatePolicies(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    return this.lendingPoliciesService.getInterestRatePolicies(lenderId, activeOnly);
  }

  @Get(':lenderId/interest-rates/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get interest rate policy by ID' })
  @ApiParam({ name: 'lenderId', description: 'Lender ID' })
  @ApiParam({ name: 'policyId', description: 'Policy ID' })
  async getInterestRatePolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
  ) {
    return this.lendingPoliciesService.getInterestRatePolicy(lenderId, policyId);
  }

  @Put(':lenderId/interest-rates/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Update interest rate policy' })
  @ApiParam({ name: 'lenderId', description: 'Lender ID' })
  @ApiParam({ name: 'policyId', description: 'Policy ID' })
  @ApiBody({ type: UpdateInterestRatePolicyDto })
  async updateInterestRatePolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
    @Body() dto: UpdateInterestRatePolicyDto,
    @Request() req: any,
  ) {
    return this.lendingPoliciesService.updateInterestRatePolicy(
      lenderId,
      policyId,
      dto,
      req.user?.userId || req.user?.id,
    );
  }

  @Delete(':lenderId/interest-rates/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Delete interest rate policy' })
  @ApiParam({ name: 'lenderId', description: 'Lender ID' })
  @ApiParam({ name: 'policyId', description: 'Policy ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInterestRatePolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
  ) {
    return this.lendingPoliciesService.deleteInterestRatePolicy(lenderId, policyId);
  }

  @Patch(':lenderId/interest-rates/:policyId/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Toggle interest rate policy status' })
  @ApiParam({ name: 'lenderId', description: 'Lender ID' })
  @ApiParam({ name: 'policyId', description: 'Policy ID' })
  @ApiBody({ schema: { type: 'object', properties: { isActive: { type: 'boolean' } } } })
  async toggleInterestRatePolicyStatus(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
    @Body() body: { isActive: boolean },
    @Request() req: any,
  ) {
    return this.lendingPoliciesService.toggleInterestRatePolicyStatus(
      lenderId,
      policyId,
      body.isActive,
      req.user?.userId || req.user?.id,
    );
  }

  // ===== LOAN LIMIT POLICIES =====

  @Post(':lenderId/loan-limits')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Create loan limit policy' })
  @ApiParam({ name: 'lenderId', description: 'Lender ID' })
  @ApiBody({ type: CreateLoanLimitPolicyDto })
  async createLoanLimitPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() dto: CreateLoanLimitPolicyDto,
    @Request() req: any,
  ) {
    return this.lendingPoliciesService.createLoanLimitPolicy(
      lenderId,
      dto,
      req.user?.userId || req.user?.id,
    );
  }

  @Get(':lenderId/loan-limits')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get loan limit policies' })
  @ApiParam({ name: 'lenderId', description: 'Lender ID' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  async getLoanLimitPolicies(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    return this.lendingPoliciesService.getLoanLimitPolicies(lenderId, activeOnly);
  }

  @Get(':lenderId/loan-limits/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get loan limit policy by ID' })
  async getLoanLimitPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
  ) {
    return this.lendingPoliciesService.getLoanLimitPolicy(lenderId, policyId);
  }

  @Put(':lenderId/loan-limits/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Update loan limit policy' })
  @ApiBody({ type: UpdateLoanLimitPolicyDto })
  async updateLoanLimitPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
    @Body() dto: UpdateLoanLimitPolicyDto,
    @Request() req: any,
  ) {
    return this.lendingPoliciesService.updateLoanLimitPolicy(
      lenderId,
      policyId,
      dto,
      req.user?.userId || req.user?.id,
    );
  }

  @Delete(':lenderId/loan-limits/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Delete loan limit policy' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLoanLimitPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
  ) {
    return this.lendingPoliciesService.deleteLoanLimitPolicy(lenderId, policyId);
  }

  // ===== ELIGIBILITY CRITERIA POLICIES =====

  @Post(':lenderId/eligibility')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Create eligibility criteria policy' })
  @ApiBody({ type: CreateEligibilityPolicyDto })
  async createEligibilityPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() dto: CreateEligibilityPolicyDto,
    @Request() req: any,
  ) {
    return this.lendingPoliciesService.createEligibilityPolicy(
      lenderId,
      dto,
      req.user?.userId || req.user?.id,
    );
  }

  @Get(':lenderId/eligibility')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get eligibility criteria policies' })
  async getEligibilityPolicies(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    return this.lendingPoliciesService.getEligibilityPolicies(lenderId, activeOnly);
  }

  @Get(':lenderId/eligibility/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get eligibility criteria policy by ID' })
  async getEligibilityPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
  ) {
    return this.lendingPoliciesService.getEligibilityPolicy(lenderId, policyId);
  }

  @Put(':lenderId/eligibility/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Update eligibility criteria policy' })
  @ApiBody({ type: UpdateEligibilityPolicyDto })
  async updateEligibilityPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
    @Body() dto: UpdateEligibilityPolicyDto,
    @Request() req: any,
  ) {
    return this.lendingPoliciesService.updateEligibilityPolicy(
      lenderId,
      policyId,
      dto,
      req.user?.userId || req.user?.id,
    );
  }

  @Delete(':lenderId/eligibility/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Delete eligibility criteria policy' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEligibilityPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
  ) {
    return this.lendingPoliciesService.deleteEligibilityPolicy(lenderId, policyId);
  }

  // ===== RISK ASSESSMENT POLICIES =====

  @Post(':lenderId/risk-assessment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Create risk assessment policy' })
  @ApiBody({ type: CreateRiskAssessmentPolicyDto })
  async createRiskAssessmentPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() dto: CreateRiskAssessmentPolicyDto,
    @Request() req: any,
  ) {
    return this.lendingPoliciesService.createRiskAssessmentPolicy(
      lenderId,
      dto,
      req.user?.userId || req.user?.id,
    );
  }

  @Get(':lenderId/risk-assessment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get risk assessment policies' })
  async getRiskAssessmentPolicies(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    return this.lendingPoliciesService.getRiskAssessmentPolicies(lenderId, activeOnly);
  }

  @Get(':lenderId/risk-assessment/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get risk assessment policy by ID' })
  async getRiskAssessmentPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
  ) {
    return this.lendingPoliciesService.getRiskAssessmentPolicy(lenderId, policyId);
  }

  @Put(':lenderId/risk-assessment/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Update risk assessment policy' })
  @ApiBody({ type: UpdateRiskAssessmentPolicyDto })
  async updateRiskAssessmentPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
    @Body() dto: UpdateRiskAssessmentPolicyDto,
    @Request() req: any,
  ) {
    return this.lendingPoliciesService.updateRiskAssessmentPolicy(
      lenderId,
      policyId,
      dto,
      req.user?.userId || req.user?.id,
    );
  }

  @Delete(':lenderId/risk-assessment/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Delete risk assessment policy' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRiskAssessmentPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
  ) {
    return this.lendingPoliciesService.deleteRiskAssessmentPolicy(lenderId, policyId);
  }

  // ===== REPAYMENT POLICIES =====

  @Post(':lenderId/repayment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Create repayment policy' })
  @ApiBody({ type: CreateRepaymentPolicyDto })
  async createRepaymentPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() dto: CreateRepaymentPolicyDto,
    @Request() req: any,
  ) {
    return this.lendingPoliciesService.createRepaymentPolicy(
      lenderId,
      dto,
      req.user?.userId || req.user?.id,
    );
  }

  @Get(':lenderId/repayment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get repayment policies' })
  async getRepaymentPolicies(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    return this.lendingPoliciesService.getRepaymentPolicies(lenderId, activeOnly);
  }

  @Get(':lenderId/repayment/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get repayment policy by ID' })
  async getRepaymentPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
  ) {
    return this.lendingPoliciesService.getRepaymentPolicy(lenderId, policyId);
  }

  @Put(':lenderId/repayment/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Update repayment policy' })
  @ApiBody({ type: UpdateRepaymentPolicyDto })
  async updateRepaymentPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
    @Body() dto: UpdateRepaymentPolicyDto,
    @Request() req: any,
  ) {
    return this.lendingPoliciesService.updateRepaymentPolicy(
      lenderId,
      policyId,
      dto,
      req.user?.userId || req.user?.id,
    );
  }

  @Delete(':lenderId/repayment/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Delete repayment policy' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRepaymentPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
  ) {
    return this.lendingPoliciesService.deleteRepaymentPolicy(lenderId, policyId);
  }

  // ===== CARGO TYPE POLICIES =====

  @Post(':lenderId/cargo-types')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Create cargo type policy' })
  @ApiBody({ type: CreateCargoTypePolicyDto })
  async createCargoTypePolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() dto: CreateCargoTypePolicyDto,
    @Request() req: any,
  ) {
    return this.lendingPoliciesService.createCargoTypePolicy(
      lenderId,
      dto,
      req.user?.userId || req.user?.id,
    );
  }

  @Get(':lenderId/cargo-types')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get cargo type policies' })
  async getCargoTypePolicies(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    return this.lendingPoliciesService.getCargoTypePolicies(lenderId, activeOnly);
  }

  @Get(':lenderId/cargo-types/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get cargo type policy by ID' })
  async getCargoTypePolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
  ) {
    return this.lendingPoliciesService.getCargoTypePolicy(lenderId, policyId);
  }

  @Put(':lenderId/cargo-types/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Update cargo type policy' })
  @ApiBody({ type: UpdateCargoTypePolicyDto })
  async updateCargoTypePolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
    @Body() dto: UpdateCargoTypePolicyDto,
    @Request() req: any,
  ) {
    return this.lendingPoliciesService.updateCargoTypePolicy(
      lenderId,
      policyId,
      dto,
      req.user?.userId || req.user?.id,
    );
  }

  @Delete(':lenderId/cargo-types/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Delete cargo type policy' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCargoTypePolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
  ) {
    return this.lendingPoliciesService.deleteCargoTypePolicy(lenderId, policyId);
  }

  // ===== SYSTEM CONFIG POLICIES =====

  @Post(':lenderId/system-config')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Create system config policy' })
  @ApiBody({ type: CreateSystemConfigPolicyDto })
  async createSystemConfigPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() dto: CreateSystemConfigPolicyDto,
    @Request() req: any,
  ) {
    return this.lendingPoliciesService.createSystemConfigPolicy(
      lenderId,
      dto,
      req.user?.userId || req.user?.id,
    );
  }

  @Get(':lenderId/system-config')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Get system config policy' })
  async getSystemConfigPolicy(@Param('lenderId', ParseUUIDPipe) lenderId: string) {
    return this.lendingPoliciesService.getSystemConfigPolicy(lenderId);
  }

  @Put(':lenderId/system-config')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Update system config policy' })
  @ApiBody({ type: UpdateSystemConfigPolicyDto })
  async updateSystemConfigPolicy(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() dto: UpdateSystemConfigPolicyDto,
    @Request() req: any,
  ) {
    return this.lendingPoliciesService.updateSystemConfigPolicy(
      lenderId,
      dto,
      req.user?.userId || req.user?.id,
    );
  }

  @Delete(':lenderId/system-config')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({ summary: 'Delete system config policy' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSystemConfigPolicy(@Param('lenderId', ParseUUIDPipe) lenderId: string) {
    return this.lendingPoliciesService.deleteSystemConfigPolicy(lenderId);
  }

  // ===== COMPREHENSIVE ENDPOINTS =====

  @Get(':lenderId/all')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({
    summary: 'Get all policies for a lender',
    description: 'Retrieve all policy types for a specific lender',
  })
  @ApiParam({ name: 'lenderId', description: 'Lender ID' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  async getAllPoliciesForLender(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Query('activeOnly') activeOnly?: boolean | string,
  ) {
    try {
      // Convert string "false" to boolean false
      const activeOnlyBool = activeOnly === 'false' ? false : activeOnly === 'true' ? true : Boolean(activeOnly);
      return await this.lendingPoliciesService.getAllPoliciesForLender(lenderId, activeOnlyBool);
    } catch (error) {
      console.error(`[LendingPoliciesController] Error fetching policies for lender ${lenderId}:`, error);
      throw error;
    }
  }

  @Post(':lenderId/validate-loan')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.LENDER)
  @ApiOperation({
    summary: 'Validate loan against policies',
    description: 'Validate a loan request against all applicable policies',
  })
  @ApiParam({ name: 'lenderId', description: 'Lender ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number' },
        borrowerData: { type: 'object' },
        cargoType: { type: 'string' },
        businessType: { type: 'string' },
      },
    },
  })
  async validateLoanAgainstPolicies(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
    @Body() loanData: {
      amount: number;
      borrowerData: any;
      cargoType?: string;
      businessType?: string;
    },
  ) {
    return this.lendingPoliciesService.validateLoanAgainstPolicies(lenderId, loanData);
  }
}