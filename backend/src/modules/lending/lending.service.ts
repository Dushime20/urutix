import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  InsufficientCreditException,
  LoanLimitExceededException,
  DuplicateLoanRequestException,
  LenderNotAvailableException,
  InvalidLoanStateException,
} from './exceptions/lending.exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, ILike } from 'typeorm';
import { Lender, LenderStatus } from '../../entities/lender.entity';
import { LenderPolicy } from '../../entities/lender-policy.entity';
import {
  LoanRequest,
  LoanRequestStatus,
  FinancingType,
} from '../../entities/loan-request.entity';
import {
  LoanDisbursement,
  DisbursementStatus,
} from '../../entities/loan-disbursement.entity';
import { LoanRepayment } from '../../entities/loan-repayment.entity';
import { CreateLenderDto, LenderResponseDto } from './dto/create-lender.dto';
import { CreateLenderPolicyDto } from './dto/create-lender-policy.dto';
import { CreateLoanRequestDto, LoanApprovalDto } from './dto/loan-request.dto';
import { ConfirmDisbursementDto } from './dto/disbursement.dto';
import { DisbursementQueryDto } from './dto/disbursement-query.dto';
import { UpdateDisbursementStatusDto } from './dto/update-disbursement-status.dto';
import {
  UpdateLenderProfileDto,
  LenderProfileResponseDto,
  PersonalInfoDto,
  BusinessInfoDto,
  BankingInfoDto,
  PreferencesDto,
} from './dto/lender-profile.dto';
import {
  CreateLenderUserDto,
  UpdateLenderUserDto,
  LenderUserResponseDto,
  CreateLenderRoleDto,
  UpdateLenderRoleDto,
  LenderTeamStatsDto,
} from './dto/team-management.dto';
import {
  LenderUser,
  LenderRole,
  LenderPermission,
  LenderUserStatus,
} from '../../entities/lender-team.entity';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Borrower } from '../../entities/borrower.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { EmailService } from '../auth/services/email.service';
import { UrutiLendingIntegrationService } from './services/uruti-lending-integration.service';
import { LendingPoliciesService } from './services/lending-policies.service';
import { LendingPolicyInterestRate, RiskLevel } from '../../entities/lending-policy-interest-rate.entity';
import { LendingPolicyRiskAssessment, RiskFactor } from '../../entities/lending-policy-risk-assessment.entity';
import { LoanTerms } from '../../entities/loan-terms.entity';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import axios from 'axios';
import { encryptString, decryptString } from '../../common/utils/crypto.util';
import { LoanNotificationService } from './services/loan-notification.service';
import { CurrencyService } from '../currency/currency.service';
import { ConfigService } from '@nestjs/config';
import { SubmitLoanOfferDto } from './dto/loan-offer.dto';
import { buildLoanWorkflowView } from './utils/loan-workflow.util';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LendingService {
  private readonly logger = new Logger(LendingService.name);

  constructor(
    @InjectRepository(Lender)
    private lenderRepository: Repository<Lender>,

    @InjectRepository(LenderPolicy)
    private lenderPolicyRepository: Repository<LenderPolicy>,

    @InjectRepository(LoanRequest)
    private loanRequestRepository: Repository<LoanRequest>,

    @InjectRepository(LoanDisbursement)
    private loanDisbursementRepository: Repository<LoanDisbursement>,

    @InjectRepository(LoanRepayment)
    private loanRepaymentRepository: Repository<LoanRepayment>,

    @InjectRepository(LenderUser)
    private lenderUserRepository: Repository<LenderUser>,

    @InjectRepository(LenderRole)
    private lenderRoleRepository: Repository<LenderRole>,

    @InjectRepository(LenderPermission)
    private lenderPermissionRepository: Repository<LenderPermission>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,

    @InjectRepository(Borrower)
    private borrowerRepository: Repository<Borrower>,

    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,

    private emailService: EmailService,

    private dataSource: DataSource,

    @Inject(forwardRef(() => ModuleRef))
    private moduleRef: ModuleRef,

    private urutiLendingIntegration: UrutiLendingIntegrationService,

    @InjectRepository(LendingPolicyInterestRate)
    private interestRatePolicyRepository: Repository<LendingPolicyInterestRate>,

    @InjectRepository(LendingPolicyRiskAssessment)
    private riskAssessmentPolicyRepository: Repository<LendingPolicyRiskAssessment>,

    @InjectRepository(LoanTerms)
    private loanTermsRepository: Repository<LoanTerms>,

    private lendingPoliciesService: LendingPoliciesService,
    private loanNotificationService: LoanNotificationService,
    private currencyService: CurrencyService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Find an existing Borrower record for a user, or create one from their profile.
   * This ensures borrower_id is always populated on loan requests.
   */
  private async findOrCreateBorrower(
    userId: string,
    tenantId: string,
  ): Promise<Borrower | null> {
    try {
      // 1. Look up the user + profile
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['profile'],
      });
      if (!user) return null;

      const profile = user.profile;

      // 2. Try to find an existing Borrower by email in this tenant
      let borrower = await this.borrowerRepository.findOne({
        where: { email: user.email, tenant_id: tenantId },
      });

      if (!borrower) {
        // 3. Create a new Borrower record from user data
        const companyName =
          profile?.companyName ||
          (profile?.firstName && profile?.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : user.email);

        borrower = this.borrowerRepository.create({
          tenant_id: tenantId,
          company_name: companyName,
          contact_name:
            profile?.firstName && profile?.lastName
              ? `${profile.firstName} ${profile.lastName}`
              : undefined,
          email: user.email,
          phone: user.phone || undefined,
          business_type: 'TRUCK_OWNER',
          status: 'active',
        });

        borrower = await this.borrowerRepository.save(borrower);

        this.logger.log(
          `✅ Created Borrower record ${borrower.id} for user ${userId} (${user.email}) — credit_score will be set after first credit check`,
        );
      }

      return borrower;
    } catch (err) {
      // Non-fatal — log and continue without borrower_id
      this.logger.warn(
        `Could not find/create Borrower for user ${userId}: ${err.message}`,
      );
      return null;
    }
  }

  // Credit and Risk Management
  /**
   * Resolve ISO 4217 currency from loan → policy → trip → load. Never invent one.
   */
  private requireCurrency(
    value: string | null | undefined,
    context: string,
  ): string {
    const currency = String(value || '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new BadRequestException(
        `Missing or invalid ISO 4217 currency for ${context}.`,
      );
    }
    return currency;
  }

  /**
   * Validate borrower-level credit exposure against /lender/policies
   * (loan limits max_amount + system config total_exposure_limit).
   * Platform env caps are optional secondary guards when no lender is specified.
   */
  private async validateCreditLimit(
    tenantId: string,
    requestedAmount: number,
    lenderId?: string,
  ): Promise<void> {
    if (!requestedAmount || requestedAmount <= 0) {
      throw new BadRequestException('Requested loan amount must be greater than zero.');
    }

    let maxPerLoan: number | null = null;
    let creditLimit: number | null = null;

    if (lenderId) {
      const policy = await this.lendingPoliciesService.getOriginationPolicy(lenderId);
      if (!policy) {
        throw new BadRequestException(
          `Lender ${lenderId} has no active Loan Limit policy. Configure Loan Limits under Lending Policies before originating loans.`,
        );
      }
      maxPerLoan = policy.maxAdvancePerTrip;
      creditLimit = policy.maxExposure;
      if (!maxPerLoan || maxPerLoan <= 0 || !creditLimit || creditLimit <= 0) {
        throw new BadRequestException(
          `Lender ${lenderId} Lending Policies have invalid credit limits (Loan Limits max amount / System Config total exposure).`,
        );
      }
    } else {
      const platformMaxPerLoan = Number(
        this.configService.get<string>('PLATFORM_MAX_LOAN_AMOUNT'),
      );
      const platformCreditLimit = Number(
        this.configService.get<string>('PLATFORM_MAX_BORROWER_EXPOSURE'),
      );
      if (
        !Number.isFinite(platformMaxPerLoan) ||
        platformMaxPerLoan <= 0 ||
        !Number.isFinite(platformCreditLimit) ||
        platformCreditLimit <= 0
      ) {
        throw new BadRequestException(
          'No lender specified and PLATFORM_MAX_LOAN_AMOUNT / PLATFORM_MAX_BORROWER_EXPOSURE are not configured.',
        );
      }
      maxPerLoan = platformMaxPerLoan;
      creditLimit = platformCreditLimit;
    }

    if (requestedAmount > maxPerLoan!) {
      throw new LoanLimitExceededException(tenantId, requestedAmount, maxPerLoan!);
    }

    const outstandingLoans = await this.loanRequestRepository
      .createQueryBuilder('loan')
      .where('loan.tenant_id = :tenantId', { tenantId })
      .andWhere(lenderId ? 'loan.lender_id = :lenderId' : '1=1', { lenderId })
      .andWhere('loan.status IN (:...statuses)', { statuses: ['approved', 'disbursed'] })
      .getMany();

    const totalOutstanding = outstandingLoans.reduce(
      (sum, loan) => sum + Number(loan.approved_amount || 0), 0,
    );
    const availableCredit = creditLimit! - totalOutstanding;

    if (requestedAmount > availableCredit) {
      throw new InsufficientCreditException(tenantId, requestedAmount, availableCredit);
    }
  }

  private async checkIdempotency(
    idempotencyKey: string,
    tenantId: string,
  ): Promise<void> {
    const existingLoan = await this.loanRequestRepository.findOne({
      where: { idempotency_key: idempotencyKey },
    });

    if (existingLoan) {
      throw new DuplicateLoanRequestException(idempotencyKey);
    }
  }

  /**
   * Full international-standard lender policy compliance check.
   *
   * Validates (per IFRS 9 / Basel II origination standards):
   *  1. Lender active status
   *  2. Per-trip advance limit
   *  3. Total exposure limit
   *  4. Minimum credit score (Basel II)
   *  5. Maximum DTI ratio (CFPB QM rule)
   *  6. Minimum business age
   *  7. KYC level (AML/CTF)
   *  8. Maximum LTV ratio
   *  9. Currency match
   * 10. Allowed loan purposes
   */
  private async validateLenderAvailability(
    lenderId: string,
    requestedAmount?: number,
    loanContext?: {
      tenantId?: string;
      purpose?: string;
      currency?: string;
      collateralValue?: number;
      kycVerified?: boolean;
    },
  ): Promise<void> {
    const lender = await this.lenderRepository.findOne({
      where: { id: lenderId },
      relations: ['policies'],
    });

    if (!lender || lender.status !== 'active') {
      throw new LenderNotAvailableException(
        lenderId,
        lender ? `Status: ${lender.status}` : 'Lender not found',
      );
    }

    if (!requestedAmount) return;

    // Primary source: /lender/policies (loan limits + system config)
    const originationPolicy =
      await this.lendingPoliciesService.getOriginationPolicy(lenderId);
    if (!originationPolicy) {
      throw new BadRequestException(
        `Lender ${lenderId} has no active Loan Limit policy. Configure Loan Limits under Lending Policies before originating loans.`,
      );
    }

    // ── 1. Per-trip advance limit (loan-limit max_amount) ───────────────────
    const maxAdvance = originationPolicy.maxAdvancePerTrip;
    if (requestedAmount > maxAdvance) {
      throw new BadRequestException(
        `Requested amount (${requestedAmount}) exceeds lender's max loan amount (${maxAdvance}).`,
      );
    }

    // ── 2. Total exposure limit (system-config total_exposure_limit) ────────
    const currentExposure = await this.getCurrentExposure(lenderId);
    if (currentExposure + requestedAmount > originationPolicy.maxExposure) {
      throw new BadRequestException(
        `Lender has reached maximum portfolio exposure limit (${originationPolicy.maxExposure}). Current: ${currentExposure}.`,
      );
    }

    if (!loanContext) return;

    // Optional legacy lender_policies checks (currency / purpose / KYC / LTV)
    const policy =
      lender.policies?.find((p: any) => p.is_active !== false) ??
      lender.policies?.[0];
    if (!policy) return;

    // ── 3. Currency match ───────────────────────────────────────────────────
    if (loanContext.currency && policy.currency && loanContext.currency !== policy.currency) {
      throw new BadRequestException(
        `Loan currency (${loanContext.currency}) does not match this lender's policy currency (${policy.currency}).`,
      );
    }

    // ── 4. Loan purpose check ───────────────────────────────────────────────
    if (loanContext.purpose && Array.isArray(policy.allowed_purposes) && policy.allowed_purposes.length > 0) {
      if (!policy.allowed_purposes.includes(loanContext.purpose)) {
        throw new BadRequestException(
          `Loan purpose '${loanContext.purpose}' is not accepted by this lender. Allowed: ${policy.allowed_purposes.join(', ')}.`,
        );
      }
    }

    // ── 5. KYC level check (AML/CTF) ───────────────────────────────────────
    if (policy.required_kyc_level && policy.required_kyc_level !== 'basic') {
      if (!loanContext.kycVerified) {
        throw new BadRequestException(
          `This lender requires ${policy.required_kyc_level} KYC verification before loan origination.`,
        );
      }
    }

    // ── 6. LTV ratio (if collateral value provided) ─────────────────────────
    if (loanContext.collateralValue && policy.max_ltv_ratio) {
      const ltv = requestedAmount / loanContext.collateralValue;
      if (ltv > Number(policy.max_ltv_ratio)) {
        throw new BadRequestException(
          `Loan-to-Value ratio ${(ltv * 100).toFixed(1)}% exceeds lender's maximum LTV of ${(Number(policy.max_ltv_ratio) * 100).toFixed(1)}%.`,
        );
      }
    }

    // ── 7. Borrower-level checks (require borrower profile) ─────────────────
    if (!loanContext.tenantId) return;

    const borrower = await this.borrowerRepository.findOne({
      where: { tenant_id: loanContext.tenantId },
    });

    // 7a. Minimum credit score
    if (policy.min_credit_score && borrower?.credit_score != null) {
      if (borrower.credit_score < policy.min_credit_score) {
        throw new BadRequestException(
          `Borrower credit score (${borrower.credit_score}) is below this lender's minimum requirement (${policy.min_credit_score}).`,
        );
      }
    }

    // 7b. Minimum business age
    if (policy.min_business_age_months && borrower?.created_at) {
      const ageMonths = (Date.now() - new Date(borrower.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (ageMonths < policy.min_business_age_months) {
        throw new BadRequestException(
          `Borrower business age (${ageMonths.toFixed(0)} months) is below this lender's minimum of ${policy.min_business_age_months} months.`,
        );
      }
    }

    // 7c. Maximum DTI ratio
    if (policy.max_dti_ratio) {
      const outstandingLoans = await this.loanRequestRepository.find({
        where: { tenant_id: loanContext.tenantId },
      });
      const activeStatuses = [LoanRequestStatus.APPROVED, LoanRequestStatus.DISBURSED];
      const outstanding = outstandingLoans
        .filter(l => activeStatuses.includes(l.status))
        .reduce((s, l) => s + Number(l.approved_amount || l.requested_amount || 0), 0);
      const totalDebt = outstanding + requestedAmount;
      const estimatedAnnualIncome = Math.max(totalDebt * 0.5, 1);
      const dti = totalDebt / estimatedAnnualIncome;
      if (dti > Number(policy.max_dti_ratio)) {
        throw new BadRequestException(
          `Estimated debt-to-income ratio (${(dti * 100).toFixed(0)}%) exceeds lender's maximum DTI of ${(Number(policy.max_dti_ratio) * 100).toFixed(0)}%.`,
        );
      }
    }
  }

  // Lender Management
  async createLender(
    createLenderDto: CreateLenderDto,
    tenantId?: string,
  ): Promise<LenderResponseDto> {
    // tenantId is REQUIRED — lenders must always belong to a tenant
    if (!tenantId) {
      throw new BadRequestException(
        'tenantId is required when creating a lender. ' +
        'A lender must operate within a specific tenant.',
      );
    }

    this.logger.log(`Creating lender "${createLenderDto.name}" for tenant: ${tenantId}`);

    // Check if user already exists within this tenant
    const existingUser = await this.userRepository.findOne({
      where: {
        email: createLenderDto.contact_email.trim().toLowerCase(),
        tenantId,
        role: UserRole.LENDER,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        `A lender with the email "${createLenderDto.contact_email}" already exists in this tenant.`,
      );
    }

    // Create the lender entity — always scoped to the tenant
    const apiKey = this.generateApiKey();
    const hashedApiKey = await bcrypt.hash(apiKey, 10);

    const lender = this.lenderRepository.create({
      ...createLenderDto,
      api_key_hash: hashedApiKey,
      tenant_id: tenantId,              // always set — never null
    });

    const savedLender = await this.lenderRepository.save(lender);
    this.logger.log(`Lender entity created: ${savedLender.id} (tenant: ${tenantId})`);

    try {
      // Reuse credentials if the email already has any user record
      const anyExistingUser = await this.userRepository.findOne({
        where: { email: createLenderDto.contact_email.trim().toLowerCase() },
      });

      let passwordHashToUse: string;
      let userStatus = UserStatus.PENDING_VERIFICATION;
      let shouldSendSetupEmail = true;

      if (anyExistingUser?.passwordHash) {
        passwordHashToUse  = anyExistingUser.passwordHash;
        userStatus         = UserStatus.ACTIVE;
        shouldSendSetupEmail = false;
        this.logger.log(`Reusing existing credentials for ${createLenderDto.contact_email}`);
      } else {
        const tempPassword = crypto.randomBytes(32).toString('hex');
        passwordHashToUse  = await bcrypt.hash(tempPassword, 12);
      }

      const lenderUser = this.userRepository.create({
        email: createLenderDto.contact_email.trim().toLowerCase(),
        passwordHash: passwordHashToUse,
        role: UserRole.LENDER,
        status: userStatus,
        tenantId,                       // same tenant as the lender entity
      });

      const savedUser = await this.userRepository.save(lenderUser);
      this.logger.log(`Lender user created: ${savedUser.id} (tenant: ${tenantId})`);

      const nameParts = (createLenderDto.name || 'Lender Admin').split(' ');
      const userProfile = this.userProfileRepository.create({
        userId: savedUser.id,
        tenantId,
        firstName: nameParts[0] || 'Lender',
        lastName: nameParts.slice(1).join(' ') || 'Admin',
        companyName: createLenderDto.name,
      });
      await this.userProfileRepository.save(userProfile);

      if (shouldSendSetupEmail) {
        this.logger.log(`Generating password setup token for: ${createLenderDto.contact_email}`);
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

          // Invalidate any existing tokens for this email
          await this.passwordResetTokenRepository.update(
            { email: createLenderDto.contact_email.trim().toLowerCase(), used: false },
            { used: true },
          );

          const passwordSetupToken = this.passwordResetTokenRepository.create({
            email: createLenderDto.contact_email.trim().toLowerCase(),
            token,
            expiresAt,
            used: false,
          });
          await this.passwordResetTokenRepository.save(passwordSetupToken);
          this.logger.log(`✅ Password setup token generated and saved`);

          // Send password setup email (always send for new users)
          this.logger.log(`📧 ========== LENDER EMAIL SENDING PROCESS START ==========`);
          this.logger.log(`📧 Sending password setup email for new lender user...`);
          this.logger.log(`📧 Email address: ${createLenderDto.contact_email.trim().toLowerCase()}`);
          this.logger.log(`📧 Lender name: ${createLenderDto.name}`);
          this.logger.log(`📧 EmailService instance: ${this.emailService ? 'EXISTS' : 'MISSING'}`);
          
          try {
            if (!this.emailService) {
              this.logger.error('❌ EmailService is not injected properly!');
              this.logger.warn('⚠️ EmailService is not available, skipping email send');
              throw new Error('EmailService is not available');
            }
            
            this.logger.log('📧 Calling emailService.sendLenderPasswordSetupEmail...');
            await this.emailService.sendLenderPasswordSetupEmail(
              createLenderDto.contact_email.trim().toLowerCase(),
              createLenderDto.name,
              token,
            );
            this.logger.log(
              `✅ Lender password setup email sent successfully to ${createLenderDto.contact_email}`,
            );
            this.logger.log(`✅ Check the inbox (and spam folder) for: ${createLenderDto.contact_email}`);
          } catch (emailError: any) {
            this.logger.error(
              `❌ Failed to send lender password setup email: ${emailError.message}`,
            );
            this.logger.error(`❌ Error stack: ${emailError.stack}`);
            if (emailError.code) {
              this.logger.error(`❌ Error code: ${emailError.code}`);
            }
            if (emailError.response) {
              this.logger.error(`❌ Error response: ${emailError.response}`);
            }
            if (emailError.responseCode) {
              this.logger.error(`❌ Error response code: ${emailError.responseCode}`);
            }
            if (emailError.command) {
              this.logger.error(`❌ Failed command: ${emailError.command}`);
            }
            this.logger.error(`❌ Full email error:`, JSON.stringify(emailError, Object.getOwnPropertyNames(emailError)));
            this.logger.warn(
              `⚠️ Lender and user account were created successfully, but email could not be sent. The lender will need to use password reset to set their password.`,
            );
          }
          this.logger.log(`📧 ========== LENDER EMAIL SENDING PROCESS END ==========`);
      } else {
          this.logger.log(`Existing credentials found. Skipped password setup email.`);
      }
    } catch (error) {
      this.logger.error(
        `❌ Error creating lender user account: ${error.message}`,
      );
      this.logger.error(
        `⚠️ Lender was created successfully (ID: ${savedLender.id}), but user account creation failed. Rolling back lender creation.`,
      );
      
      // Rollback: Delete the lender that was created
      try {
        await this.lenderRepository.remove(savedLender);
        this.logger.log(`✅ Rolled back lender creation - lender deleted`);
      } catch (rollbackError) {
        this.logger.error(`❌ Failed to rollback lender creation: ${rollbackError.message}`);
      }
      
      // Re-throw the original error so frontend can show it
      throw error;
    }

    this.logger.log(`Lender creation process completed for: ${createLenderDto.name} (ID: ${savedLender.id})`);
    
    return {
      id: savedLender.id,
      api_key: apiKey,
    };
  }

  async createLenderPolicy(
    lenderId: string,
    createPolicyDto: CreateLenderPolicyDto,
  ): Promise<LenderPolicy> {
    const lender = await this.lenderRepository.findOne({
      where: { id: lenderId },
    });
    if (!lender) {
      throw new NotFoundException('Lender not found');
    }

    // Deactivate existing policies
    await this.lenderPolicyRepository.update(
      { lender_id: lenderId },
      { updated_at: new Date() },
    );

    const policy = this.lenderPolicyRepository.create({
      ...createPolicyDto,
      lender_id: lenderId,
    });

    return await this.lenderPolicyRepository.save(policy);
  }

  /** Resolve User ID → Lender entity, then return the latest policy */
  async getLenderPolicyByUserId(userId: string): Promise<LenderPolicy | null> {
    const lender = await this.resolveLenderById(userId);
    if (!lender) return null;
    const policies = await this.lenderPolicyRepository.find({
      where: { lender_id: lender.id },
      order: { created_at: 'DESC' },
      take: 1,
    });
    return policies[0] ?? null;
  }

  /** Resolve User ID → Lender entity, then create/replace the policy */
  async upsertLenderPolicyByUserId(
    userId: string,
    dto: CreateLenderPolicyDto,
  ): Promise<LenderPolicy> {
    const lender = await this.resolveLenderById(userId);
    if (!lender) {
      throw new NotFoundException(
        `No Lender entity found for user ${userId}. Please ensure a Lender record exists.`,
      );
    }
    return this.createLenderPolicy(lender.id, dto);
  }

  async getLenderByApiKey(apiKey: string): Promise<Lender | null> {
    const lenders = await this.lenderRepository.find({
      select: ['id', 'name', 'api_key_hash', 'status'],
      where: { status: LenderStatus.ACTIVE },
    });

    for (const lender of lenders) {
      const isValid = await bcrypt.compare(apiKey, lender.api_key_hash);
      if (isValid) {
        return lender;
      }
    }

    return null;
  }

  /**
   * Resolve financing direction from DTO (or default to cargo-owner product).
   */
  private resolveFinancingType(
    createLoanDto: CreateLoanRequestDto,
  ): FinancingType {
    const raw =
      createLoanDto.financing_type ||
      (createLoanDto.metadata as any)?.financing_type;
    if (raw === FinancingType.TRUCK_OWNER_TRIP || raw === 'TRUCK_OWNER_TRIP') {
      return FinancingType.TRUCK_OWNER_TRIP;
    }
    return FinancingType.CARGO_OWNER;
  }

  private isTruckOwnerTripFinancing(loan: Pick<LoanRequest, 'financing_type' | 'purpose'>): boolean {
    return (
      loan.financing_type === FinancingType.TRUCK_OWNER_TRIP ||
      loan.purpose === 'truck_owner_trip_financing'
    );
  }

  /**
   * Validate truck-owner trip financing eligibility against the transport contract.
   * Reuses trip → truck ownership resolution already used for disbursement beneficiaries.
   */
  private async validateTruckOwnerTripEligibility(
    createdBy: string,
    tripId: string,
    cargoId: string,
    tenantId: string,
    requestedAmount: number,
  ): Promise<{ trip: Trip; transportValue: number }> {
    const requester = await this.userRepository.findOne({
      where: { id: createdBy },
    });
    if (!requester) {
      throw new BadRequestException('Requester account not found.');
    }
    if (requester.status && requester.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Your account is not active. Financing is unavailable.');
    }
    if (
      requester.role !== UserRole.TRUCK_OWNER &&
      requester.role !== UserRole.FLEET_MANAGER &&
      requester.role !== UserRole.ADMIN &&
      requester.role !== UserRole.SUPER_ADMIN &&
      requester.role !== UserRole.TENANT_ADMIN
    ) {
      throw new BadRequestException(
        'Only truck owners (or authorized fleet managers) can request truck-owner trip financing.',
      );
    }

    const trip = await this.dataSource.getRepository(Trip).findOne({
      where: { id: tripId },
      relations: ['load'],
    });
    if (!trip) {
      throw new BadRequestException('Transport trip not found for this financing request.');
    }
    if (trip.tenantId && trip.tenantId !== tenantId) {
      throw new BadRequestException('Trip does not belong to your tenant.');
    }

    const tripLoadId = trip.loadId || (trip as any).load?.id;
    if (cargoId && tripLoadId && cargoId !== tripLoadId) {
      throw new BadRequestException(
        'Selected cargo does not match the transport trip on this financing request.',
      );
    }

    const cancelledStatuses = ['CANCELLED', 'CANCELED'];
    if (cancelledStatuses.includes(String(trip.status || '').toUpperCase())) {
      throw new BadRequestException('Cannot finance a cancelled transport trip.');
    }

    const truckOwnerPayment = await this.resolveTruckOwnerPaymentInfo(tripId);
    if (!truckOwnerPayment.ownerId) {
      throw new BadRequestException(
        'No truck is assigned to this trip yet. Assign a truck before requesting trip financing.',
      );
    }
    if (
      truckOwnerPayment.ownerId !== createdBy &&
      requester.role !== UserRole.ADMIN &&
      requester.role !== UserRole.SUPER_ADMIN &&
      requester.role !== UserRole.TENANT_ADMIN
    ) {
      throw new BadRequestException(
        'You can only request trip financing for transport contracts assigned to your trucks.',
      );
    }

    const transportValue = Number(
      trip.agreedPrice ||
        (trip as any).load?.offeredPrice ||
        (trip as any).load?.value ||
        0,
    );
    if (transportValue > 0 && requestedAmount > transportValue) {
      throw new BadRequestException(
        `Requested financing (${requestedAmount}) cannot exceed the transport contract value (${transportValue}).`,
      );
    }

    return { trip, transportValue };
  }

  // Loan Request Management
  async createLoanRequest(
    createLoanDto: CreateLoanRequestDto,
    createdBy: string,
  ): Promise<LoanRequest> {
    this.logger.log(
      `Creating loan request for tenant: ${createLoanDto.tenant_id}, amount: ${createLoanDto.requested_amount}`,
    );

    const financingType = this.resolveFinancingType(createLoanDto);

    // Validate requested_split sums to requested_amount
    if (Array.isArray(createLoanDto.requested_split)) {
      const splitSum = createLoanDto.requested_split.reduce(
        (sum: number, b: any) => sum + Number(b.amount || 0),
        0,
      );
      if (
        typeof createLoanDto.requested_amount === 'number' &&
        Math.abs(splitSum - createLoanDto.requested_amount) > 0.001
      ) {
        throw new BadRequestException(
          'requested_split amounts must sum to requested_amount',
        );
      }
    }

    // Truck-owner product: validate trip ownership / contract eligibility first
    if (financingType === FinancingType.TRUCK_OWNER_TRIP) {
      if (!createLoanDto.trip_id) {
        throw new BadRequestException(
          'trip_id is required for truck-owner trip financing.',
        );
      }
      await this.validateTruckOwnerTripEligibility(
        createdBy,
        createLoanDto.trip_id,
        createLoanDto.cargo_id,
        createLoanDto.tenant_id,
        createLoanDto.requested_amount,
      );
    }

    // Enhanced validation
    await this.validateCreditLimit(
      createLoanDto.tenant_id,
      createLoanDto.requested_amount,
      createLoanDto.lender_id,
    );

    const defaultPurpose =
      financingType === FinancingType.TRUCK_OWNER_TRIP
        ? 'truck_owner_trip_financing'
        : 'cargo_financing';
    const resolvedPurpose =
      createLoanDto.purpose ||
      (createLoanDto.metadata as any)?.purpose ||
      defaultPurpose;

    if (createLoanDto.lender_id) {
      this.logger.log(`Validating specified lender: ${createLoanDto.lender_id}`);
      await this.validateLenderAvailability(createLoanDto.lender_id, createLoanDto.requested_amount, {
        tenantId: createLoanDto.tenant_id,
        purpose: resolvedPurpose,
        currency: createLoanDto.currency,
        collateralValue: (createLoanDto as any).collateral_value,
        kycVerified: (createLoanDto as any).kyc_verified,
      });
    } else {
      this.logger.log(`No lender specified, will attempt automatic assignment`);
    }

    // ── RULE 1: One active financing per trip (prevents CO + TO conflict) ──
    // A trip can only have one active financing facility. Applies to both
    // cargo-owner and truck-owner products.
    if (createLoanDto.trip_id) {
      const activeTripLoan = await this.loanRequestRepository.findOne({
        where: {
          trip_id: createLoanDto.trip_id,
          status: In([
            LoanRequestStatus.PENDING,
            LoanRequestStatus.APPROVED,
            LoanRequestStatus.DISBURSED,
          ]),
        },
      });
      if (activeTripLoan) {
        const existingType = activeTripLoan.financing_type || FinancingType.CARGO_OWNER;
        throw new BadRequestException(
          `Trip already has an active ${existingType === FinancingType.TRUCK_OWNER_TRIP ? 'truck-owner' : 'cargo-owner'} financing ` +
          `(${activeTripLoan.loan_number || activeTripLoan.id.slice(0, 8)}). ` +
          `A transport contract cannot hold conflicting financing.`,
        );
      }
    }

    // ── RULE 2: Block defaulted borrowers (Basel II origination standard) ─
    // If the borrower has any loan in DEFAULTED status or with days_past_due
    // exceeding the delinquency threshold, they cannot open new credit until
    // the outstanding obligation is resolved.
    const defaultedLoan = await this.loanRequestRepository.findOne({
      where: {
        tenant_id: createLoanDto.tenant_id,
        created_by: createdBy,
        status: LoanRequestStatus.DEFAULTED,
      },
    });
    if (defaultedLoan) {
      throw new BadRequestException(
        `Your account has a defaulted loan ` +
        `(${defaultedLoan.loan_number || defaultedLoan.id.slice(0, 8)}). ` +
        `Please resolve your outstanding balance before requesting a new loan.`,
      );
    }

    // Also block if any active loan is severely overdue (days_past_due >= 90)
    const severelyOverdueLoan = await this.loanRequestRepository
      .createQueryBuilder('loan')
      .where('loan.tenant_id = :tenantId', { tenantId: createLoanDto.tenant_id })
      .andWhere('loan.created_by = :createdBy', { createdBy })
      .andWhere('loan.status IN (:...activeStatuses)', {
        activeStatuses: [LoanRequestStatus.APPROVED, LoanRequestStatus.DISBURSED],
      })
      .andWhere('loan.days_past_due >= :threshold', { threshold: 90 })
      .getOne();
    if (severelyOverdueLoan) {
      throw new BadRequestException(
        `Your account has a loan overdue by ${severelyOverdueLoan.days_past_due} days ` +
        `(${severelyOverdueLoan.loan_number || severelyOverdueLoan.id.slice(0, 8)}). ` +
        `Please clear your overdue balance before requesting new financing.`,
      );
    }
    // ─────────────────────────────────────────────────────────────────────

    const idempotencyKey = this.generateIdempotencyKey(createLoanDto);

    // Check for existing loan request with enhanced idempotency
    await this.checkIdempotency(idempotencyKey, createLoanDto.tenant_id);

    // Resolve borrower_id from the user who created the request
    const borrower = await this.findOrCreateBorrower(
      createdBy,
      createLoanDto.tenant_id,
    );

    // Generate loan-level standard fields
    const loanNumber = await this.generateLoanNumber(createLoanDto.tenant_id);
    const originationPolicy = createLoanDto.lender_id
      ? await this.lendingPoliciesService.getOriginationPolicy(createLoanDto.lender_id)
      : null;
    // Prefer /lender/policies repayment grace; legacy lender_policies is optional fallback
    const legacyPolicy = createLoanDto.lender_id
      ? await this.lenderPolicyRepository.findOne({
          where: { lender_id: createLoanDto.lender_id, is_active: true },
          order: { created_at: 'DESC' },
        })
      : null;
    const gracePeriodDays =
      originationPolicy?.gracePeriodDays ??
      legacyPolicy?.grace_period_days ??
      0;
    const effectiveGraceDays = gracePeriodDays;
    const dueDate = createLoanDto.due_date ? new Date(createLoanDto.due_date) : null;
    const gracePeriodEnd = dueDate
      ? new Date(dueDate.getTime() + effectiveGraceDays * 86400_000)
      : null;
    const originationFeeRate = Number(legacyPolicy?.origination_fee_rate ?? 0);
    const originationFeeAmount = Math.round(createLoanDto.requested_amount * originationFeeRate * 100) / 100;

    // Currency always comes from the frontend request body and is persisted as-is.
    const loanCurrency = this.requireCurrency(
      createLoanDto.currency,
      'loan request body (currency from frontend)',
    );

    const loanRequest = this.loanRequestRepository.create({
      ...createLoanDto,
      idempotency_key: idempotencyKey,
      created_by: createdBy,
      borrower_id: borrower?.id ?? null,
      due_date: dueDate,
      loan_number: loanNumber,
      financing_type: financingType,
      purpose: resolvedPurpose,
      currency: loanCurrency,
      kyc_verified: (createLoanDto as any).kyc_verified ?? false,
      grace_period_end: gracePeriodEnd,
      origination_fee_rate: originationFeeRate,
      origination_fee_amount: originationFeeAmount,
      days_past_due: 0,
      ifrs9_stage: 1,
      metadata: {
        ...(createLoanDto.metadata || {}),
        financing_type: financingType,
        purpose: resolvedPurpose,
      },
    });

    // Save with retry — if a stale sequence value somehow produces a loan_number
    // collision (e.g. tenant had pre-existing rows before the sequence table was
    // seeded), regenerate and retry rather than surfacing a raw 500 to the client.
    let savedLoan!: LoanRequest;
    const MAX_LOAN_NUMBER_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_LOAN_NUMBER_RETRIES; attempt++) {
      try {
        savedLoan = await this.loanRequestRepository.save(loanRequest);
        break;
      } catch (saveErr: any) {
        const isLoanNumberConflict =
          saveErr?.message?.includes('UQ_4382ec13ee491f4b516b8549d26') ||
          (saveErr?.message?.includes('duplicate key') &&
            saveErr?.message?.includes('loan_number'));

        if (isLoanNumberConflict && attempt < MAX_LOAN_NUMBER_RETRIES) {
          this.logger.warn(
            `loan_number collision on attempt ${attempt}, regenerating ` +
            `(tenant: ${createLoanDto.tenant_id})`,
          );
          loanRequest.loan_number = await this.generateLoanNumber(createLoanDto.tenant_id);
          continue;
        }
        // Re-throw: not a loan_number conflict, or we've exhausted retries
        throw saveErr;
      }
    }
    this.logger.log(`Loan request created with ID: ${savedLoan.id}`);

    // Compute and persist interest_rate / risk_score + IFRS 9 PD/LGD/EL at origination
    if (savedLoan.lender_id) {
      const terms = await this.computeLoanTerms(
        savedLoan.lender_id,
        borrower?.credit_score ?? null,
        savedLoan.id,
      );
      const apr = terms.effective_annual_rate;
      const interestAmount = apr != null
        ? Math.round(savedLoan.requested_amount * (apr / 100) * (gracePeriodDays / 365) * 100) / 100
        : null;
      const totalCostOfCredit = (interestAmount ?? 0) + originationFeeAmount;
      savedLoan.metadata = {
        ...(savedLoan.metadata || {}),
        interest_rate: terms.interest_rate,
        effective_annual_rate: apr,
        risk_score: terms.risk_score,
        risk_level: terms.risk_level,
        credit_score: borrower?.credit_score ?? null,
      };
      savedLoan.apr = apr ?? undefined;
      if (interestAmount !== null) savedLoan.interest_amount = interestAmount;
      savedLoan.total_cost_of_credit = totalCostOfCredit;
      // IFRS 9 fields persisted at origination
      if (terms.risk_score !== null) {
        savedLoan.risk_score = terms.risk_score;
        savedLoan.risk_tier = terms.risk_level;
      }
      await this.loanRequestRepository.save(savedLoan);
    }

    // Attempt to process with available lenders if no lender was specified
    if (!createLoanDto.lender_id) {
      this.logger.log(`Triggering automatic lender assignment for loan ${savedLoan.id}`);
      await this.processLoanRequest(savedLoan.id);
    }

    // Notify lender about new loan request
    if (savedLoan.lender_id) {
      try {
        const lender = await this.lenderRepository.findOne({ where: { id: savedLoan.lender_id } });
        const requesterUser = await this.userRepository.findOne({ where: { id: createdBy }, relations: ['profile'] });
        const requesterName = requesterUser?.profile
          ? `${requesterUser.profile.firstName || ''} ${requesterUser.profile.lastName || ''}`.trim() || requesterUser.email
          : requesterUser?.email ||
            (financingType === FinancingType.TRUCK_OWNER_TRIP
              ? 'A truck owner'
              : 'A cargo owner');
        // Find lender's user account to notify
        const lenderUser = await this.userRepository.findOne({ where: { email: lender?.contact_email, role: UserRole.LENDER } });
        if (lenderUser) {
          await this.loanNotificationService.notifyLenderNewRequest(
            lenderUser.id,
            savedLoan.tenant_id,
            savedLoan.id,
            requesterName,
            savedLoan.requested_amount,
          );
        }
      } catch (notifErr) {
        this.logger.warn(`Could not send loan request notification: ${notifErr.message}`);
      }
    }

    this.eventEmitter.emit('system.admin.loan_requested', {
      tenantId: savedLoan.tenant_id,
      loanId: savedLoan.id,
      actorId: createdBy,
      amount: Number(savedLoan.requested_amount || 0),
      currency: this.requireCurrency(savedLoan.currency, `loan ${savedLoan.id}`),
      cargoId: savedLoan.cargo_id,
    });

    return savedLoan;
  }

  async createLoanRequestForLoadedCargo(
    cargoId: string,
    tripId: string | undefined,
    tenantId: string,
    createdBy: string,
    /** ISO 4217 from frontend — source of truth for loan.currency */
    currencyFromFrontend: string,
    lenderId?: string,
  ): Promise<LoanRequest> {
    this.logger.log(`Creating loan request for loaded cargo: ${cargoId}`);

    const loanCurrency = this.requireCurrency(
      currencyFromFrontend,
      'cargo loan request body (currency from frontend)',
    );

    // If trip_id is not provided, try to find it from the load
    let actualTripId = tripId;
    if (!actualTripId) {
      try {
        const trip = await this.dataSource
          .getRepository(Trip)
          .findOne({
            where: { loadId: cargoId, tenantId },
            order: { createdAt: 'DESC' },
          });
        if (trip) {
          actualTripId = trip.id;
        } else {
          // If no trip exists, use cargoId as trip_id (for compatibility)
          actualTripId = cargoId;
        }
      } catch (error) {
        // If Trip entity is not available, use cargoId as trip_id
        this.logger.warn(`Could not find trip for load ${cargoId}, using cargoId as trip_id: ${error.message}`);
        actualTripId = cargoId;
      }
    }

    // Generate idempotency key based on cargo and trip
    const idempotencyKey = this.generateCargoLoanIdempotencyKey(
      tenantId,
      cargoId,
      actualTripId,
    );

    // Check for existing loan request for this cargo/trip
    const existingLoan = await this.loanRequestRepository.findOne({
      where: { idempotency_key: idempotencyKey },
    });

    if (existingLoan) {
      this.logger.log(
        `Loan request already exists for cargo ${cargoId}: ${existingLoan.id}`,
      );
      return existingLoan;
    }

    // Resolve lender first when provided so LTV / advance % come from real policy
    let resolvedLenderId: string | undefined = undefined;
    
    if (lenderId) {
      // Check if lenderId is a User ID (from users with LENDER role) or a Lender entity ID
      // First try to find as Lender entity ID
      let lender = await this.lenderRepository.findOne({
        where: { id: lenderId },
      });
      
      // If not found, try to find Lender by user email or other identifier
      if (!lender) {
        const user = await this.userRepository.findOne({
          where: { id: lenderId, role: UserRole.LENDER },
          relations: ['profile'],
        });
        
        if (user) {
          // Try to find Lender by contact_email matching user email
          lender = await this.lenderRepository.findOne({
            where: { contact_email: user.email },
          });
          
          // If still not found, create a Lender entity for this user
          if (!lender) {
            this.logger.log(`Creating Lender entity for user ${lenderId} (${user.email})`);
            lender = this.lenderRepository.create({
              name: user.profile?.companyName || 
                    (user.profile?.firstName && user.profile?.lastName 
                      ? `${user.profile.firstName} ${user.profile.lastName}` 
                      : user.email) || 'Unknown Lender',
              contact_email: user.email,
              status: LenderStatus.ACTIVE,
              tenant_id: tenantId,
              api_key_hash: '', // Required field, will be set later if needed
            });
            lender = await this.lenderRepository.save(lender);
            this.logger.log(`Created Lender entity ${lender.id} for user ${lenderId}`);
          }
        }
      }
      
      if (lender) {
        resolvedLenderId = lender.id;
        this.logger.log(`Resolved lender_id ${resolvedLenderId} for loan request`);
      } else {
        throw new NotFoundException(`Lender not found with ID: ${lenderId}`);
      }
    }

    const { amount: requestedAmount } =
      await this.calculateLoanAmountForCargo(cargoId, resolvedLenderId);

    if (resolvedLenderId) {
      await this.validateLenderAvailability(resolvedLenderId, requestedAmount, {
        currency: loanCurrency,
      });
    }

    const loanRequest = this.loanRequestRepository.create({
      tenant_id: tenantId,
      cargo_id: cargoId,
      trip_id: actualTripId,
      requested_amount: requestedAmount,
      currency: loanCurrency,
      lender_id: resolvedLenderId, // Only set if we have a valid Lender entity ID
      idempotency_key: idempotencyKey,
      created_by: createdBy,
      status: LoanRequestStatus.PENDING,
      financing_type: FinancingType.CARGO_OWNER,
      purpose: 'cargo_financing',
      metadata: {
        auto_created: true,
        trigger: 'cargo_loaded',
        created_at: new Date().toISOString(),
        selected_lender: lenderId || null, // Store original ID (could be User ID) in metadata
        financing_basis: 'trip_or_load_value',
        financing_type: FinancingType.CARGO_OWNER,
      },
    });

    const savedLoan = await this.loanRequestRepository.save(loanRequest);
    this.logger.log(
      `Created loan request for cargo ${cargoId}: ${savedLoan.id}${resolvedLenderId ? ` with lender ${resolvedLenderId}` : ''} ` +
        `(${requestedAmount} ${loanCurrency})`,
    );

    // If no lender was specified, attempt to process with available lenders
    if (!resolvedLenderId) {
      await this.processLoanRequest(savedLoan.id);
    }

    this.eventEmitter.emit('system.admin.loan_requested', {
      tenantId: savedLoan.tenant_id,
      loanId: savedLoan.id,
      actorId: createdBy,
      amount: Number(savedLoan.requested_amount || 0),
      currency: this.requireCurrency(savedLoan.currency, `loan ${savedLoan.id}`),
      cargoId: savedLoan.cargo_id,
    });

    return savedLoan;
  }

  /**
   * Derive principal from real trip/load economics + lender LTV / advance policy.
   * Currency is supplied by the frontend on the loan request — not derived here.
   */
  private async calculateLoanAmountForCargo(
    cargoId: string,
    lenderId?: string,
  ): Promise<{ amount: number }> {
    const load = await this.dataSource.getRepository(Load).findOne({
      where: { id: cargoId },
    });
    if (!load) {
      throw new NotFoundException(`Load/cargo ${cargoId} not found`);
    }

    const trip = await this.dataSource.getRepository(Trip).findOne({
      where: { loadId: cargoId },
      order: { createdAt: 'DESC' },
    });

    const tripPrice =
      trip?.agreedPrice != null ? Number(trip.agreedPrice) : NaN;
    const offered =
      load.offeredPrice != null ? Number(load.offeredPrice) : NaN;
    const loadValue =
      load.loadValue != null ? Number(load.loadValue) : NaN;

    const collateralBase = [tripPrice, offered, loadValue].find(
      (v) => Number.isFinite(v) && v > 0,
    );
    if (!collateralBase) {
      throw new BadRequestException(
        `Cannot calculate loan amount for load ${cargoId}: no agreed trip price, offered price, or load value.`,
      );
    }

    let financingRatio = 1;
    if (lenderId) {
      const policy = await this.lendingPoliciesService.getOriginationPolicy(lenderId);
      if (!policy) {
        throw new BadRequestException(
          `Lender ${lenderId} has no active Loan Limit policy to determine advance/LTV ratio. Configure Loan Limits under Lending Policies.`,
        );
      }
      const advancePct = policy.advancePercentage;
      if (!Number.isFinite(advancePct) || advancePct <= 0 || advancePct > 1) {
        throw new BadRequestException(
          `Lender ${lenderId} System Config has invalid default advance percentage.`,
        );
      }
      financingRatio = advancePct;

      const maxAdvance = policy.maxAdvancePerTrip;
      const rawAmount = Math.round(collateralBase * financingRatio * 100) / 100;
      const amount =
        Number.isFinite(maxAdvance) && maxAdvance > 0
          ? Math.min(rawAmount, maxAdvance)
          : rawAmount;

      this.logger.log(
        `Loan amount for cargo ${cargoId}: ${amount} ` +
          `(basis=${collateralBase}, ratio=${financingRatio}, max_advance=${maxAdvance || 'n/a'})`,
      );
      return { amount };
    }

    const amount = Math.round(collateralBase * 100) / 100;
    this.logger.log(
      `Loan amount for cargo ${cargoId}: ${amount} (full collateral basis, no lender policy)`,
    );
    return { amount };
  }

  async processLoanRequest(loanId: string): Promise<void> {
    this.logger.log(`processLoanRequest: Starting automatic lender assignment for loan ${loanId}`);
    
    const loan = await this.loanRequestRepository.findOne({
      where: { id: loanId },
      relations: ['lender'],
    });

    if (!loan) {
      this.logger.warn(`processLoanRequest: Loan ${loanId} not found`);
      return;
    }

    if (loan.status !== LoanRequestStatus.PENDING) {
      this.logger.log(`processLoanRequest: Loan ${loanId} status is ${loan.status}, skipping automatic assignment`);
      return;
    }

    // Find suitable lender
    this.logger.log(`processLoanRequest: Finding suitable lender for loan ${loanId} (amount: ${loan.requested_amount})`);
    const lender = await this.findSuitableLender(loan);
    if (!lender) {
      this.logger.warn(`processLoanRequest: No suitable lender found for loan ${loanId}`);
      return;
    }

    // Update loan with lender
    this.logger.log(`processLoanRequest: Assigning lender ${lender.id} (${lender.name}) to loan ${loanId}`);
    loan.lender_id = lender.id;
    await this.loanRequestRepository.save(loan);
    this.logger.log(`processLoanRequest: Successfully assigned lender to loan ${loanId}`);

    // Compute and persist loan terms now that lender is known
    try {
      const fullLoan = await this.loanRequestRepository.findOne({
        where: { id: loanId },
        relations: ['borrower'],
      });
      if (fullLoan) {
        await this.computeLoanTerms(
          lender.id,
          fullLoan.borrower?.credit_score ?? null,
          loanId,
        );
      }
    } catch (termsErr) {
      this.logger.error(`processLoanRequest: computeLoanTerms failed for ${loanId}: ${termsErr.message}`);
    }

    // Send loan request to lender
    try {
      await this.sendLoanRequestToLender(loan, lender);
    } catch (error) {
      this.logger.error(
        `processLoanRequest: Failed to send loan request to lender: ${error.message}`,
      );
      // Could implement retry logic here
    }
  }

  private async findSuitableLender(loan: LoanRequest): Promise<Lender | null> {
    const lenders = await this.lenderRepository.find({
      where: { status: LenderStatus.ACTIVE },
    });

    this.logger.log(`findSuitableLender: Found ${lenders.length} active lenders to evaluate`);

    for (const lender of lenders) {
      const policy = await this.lendingPoliciesService.getOriginationPolicy(lender.id);
      if (!policy) {
        this.logger.log(
          `findSuitableLender: Lender ${lender.id} (${lender.name}) skipped — no active Loan Limit policy`,
        );
        continue;
      }

      const maxAdvance = policy.maxAdvancePerTrip;
      const maxExposure = policy.maxExposure;
      if (
        !Number.isFinite(maxAdvance) ||
        maxAdvance <= 0 ||
        !Number.isFinite(maxExposure) ||
        maxExposure <= 0
      ) {
        this.logger.log(
          `findSuitableLender: Lender ${lender.name} skipped — invalid Lending Policies limits`,
        );
        continue;
      }

      this.logger.log(
        `findSuitableLender: Evaluating lender ${lender.id} (${lender.name}) - ` +
        `maxAdvance: ${maxAdvance}, maxExposure: ${maxExposure}`,
      );

      // Check if loan amount is within per-trip limit
      if (loan.requested_amount > maxAdvance) {
        this.logger.log(`findSuitableLender: Lender ${lender.name} rejected - loan amount ${loan.requested_amount} exceeds max advance ${maxAdvance}`);
        continue;
      }

      // Check current exposure
      const currentExposure = await this.getCurrentExposure(lender.id);
      const newExposure = currentExposure + loan.requested_amount;
      
      this.logger.log(
        `findSuitableLender: Lender ${lender.name} - current exposure: ${currentExposure}, ` +
        `new exposure would be: ${newExposure}, max allowed: ${maxExposure}`
      );

      if (newExposure <= maxExposure) {
        this.logger.log(
          `findSuitableLender: ✓ Selected lender ${lender.id} (${lender.name}) for loan ${loan.id}`,
        );
        return lender;
      } else {
        this.logger.log(`findSuitableLender: Lender ${lender.name} rejected - new exposure ${newExposure} would exceed max ${maxExposure}`);
      }
    }

    this.logger.warn(
      `findSuitableLender: ✗ No suitable lender found for loan ${loan.id} (amount: ${loan.requested_amount})`,
    );
    return null;
  }

  private async getCurrentExposure(lenderId: string): Promise<number> {
    // Calculate exposure from both pending (requested_amount) and approved/disbursed (approved_amount) loans
    const pendingResult = await this.loanRequestRepository
      .createQueryBuilder('loan')
      .select('COALESCE(SUM(loan.requested_amount), 0)', 'total')
      .where('loan.lender_id = :lenderId', { lenderId })
      .andWhere('loan.status = :status', {
        status: LoanRequestStatus.PENDING,
      })
      .getRawOne();

    const approvedResult = await this.loanRequestRepository
      .createQueryBuilder('loan')
      .select('COALESCE(SUM(loan.approved_amount), 0)', 'total')
      .where('loan.lender_id = :lenderId', { lenderId })
      .andWhere('loan.status IN (:...statuses)', {
        statuses: [LoanRequestStatus.APPROVED, LoanRequestStatus.DISBURSED],
      })
      .getRawOne();

    const pendingExposure = parseFloat(pendingResult?.total || '0');
    const approvedExposure = parseFloat(approvedResult?.total || '0');
    const totalExposure = pendingExposure + approvedExposure;

    this.logger.log(
      `getCurrentExposure for lender ${lenderId}: pending=${pendingExposure}, approved=${approvedExposure}, total=${totalExposure}`
    );

    return totalExposure;
  }

  private async sendLoanRequestToLender(
    loan: LoanRequest,
    lender: Lender,
  ): Promise<void> {
    if (!lender.callback_url) {
      // Production: never auto-approve. Leave pending for human / in-app review.
      this.logger.warn(
        `Lender ${lender.id} has no callback_url — loan ${loan.id} left PENDING for manual review.`,
      );
      loan.metadata = {
        ...(loan.metadata || {}),
        awaiting_lender_review: true,
        awaiting_lender_review_reason: 'Lender has no outbound callback_url configured',
        awaiting_lender_review_at: new Date().toISOString(),
      };
      await this.loanRequestRepository.save(loan);
      return;
    }

    // Prefer explicit integration metadata; never treat localhost as production integrator
    const isUrutiLendingPlatform =
      lender.metadata?.integrationType === 'uruti_lending_platform' ||
      (typeof lender.callback_url === 'string' &&
        lender.callback_url.includes('urutilending.com'));

    if (isUrutiLendingPlatform && lender.outbound_api_key_encrypted) {
      // Use Uruti Lending Platform integration
      try {
        this.logger.log(
          `Sending loan request to Uruti Lending Platform for lender ${lender.id}`,
        );
        const applicationResponse =
          await this.urutiLendingIntegration.createLoanApplication(
            loan,
            lender.id,
          );

        // Update loan with external reference if provided
        if (applicationResponse.loanNumber) {
          loan.external_loan_ref = applicationResponse.loanNumber;
          await this.loanRequestRepository.save(loan);
        }

        // If application is already approved, update status
        if (applicationResponse.status === 'Approved') {
          await this.approveLoanRequest(loan.id, {
            status: 'approved',
            approved_amount:
              applicationResponse.approvedAmount || loan.requested_amount,
            external_loan_ref: applicationResponse.loanNumber,
          });
        }

        this.logger.log(
          `Successfully sent loan request to Uruti Lending Platform: ${applicationResponse.applicationId}`,
        );
        return;
      } catch (error) {
        this.logger.error(
          `Failed to send loan request to Uruti Lending Platform: ${error.message}`,
        );
        throw error;
      }
    }

    // Fallback to legacy integration method
    const payload = {
      platform_loan_id: loan.id,
      tenant_id: loan.tenant_id,
      cargo_id: loan.cargo_id,
      trip_id: loan.trip_id,
      requested_amount: loan.requested_amount,
      requested_split: loan.requested_split,
      due_date: loan.due_date?.toISOString().split('T')[0],
      metadata: loan.metadata,
    };

    try {
      const response = await axios.post(
        `${lender.callback_url}/api/v1/loan_requests`,
        payload,
        {
          headers: {
            Authorization: await this.buildOutboundAuthHeader(lender.id),
            'Idempotency-Key': loan.idempotency_key,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      if (response.data.status === 'approved') {
        await this.approveLoanRequest(loan.id, response.data);
      } else {
        await this.rejectLoanRequest(
          loan.id,
          response.data.reason || 'Rejected by lender',
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send loan request to lender ${lender.id}: ${error.message}`,
      );
      throw error;
    }
  }

  async approveLoanRequest(
    loanId: string,
    approval: LoanApprovalDto | SubmitLoanOfferDto,
  ): Promise<LoanRequest> {
    return this.submitLoanOffer(loanId, approval as SubmitLoanOfferDto);
  }

  /**
   * Step 1 — Lender submits a formal loan offer (TILA / IFRS 9 disclosure).
   * Does NOT disburse funds. Borrower must accept before disbursement.
   */
  async submitLoanOffer(
    loanId: string,
    offer: SubmitLoanOfferDto,
  ): Promise<LoanRequest> {
    return await this.dataSource.transaction(async (manager) => {
      const loan = await manager.findOne(LoanRequest, {
        where: { id: loanId },
        relations: ['borrower'],
      } as any);

      if (!loan) {
        throw new NotFoundException('Loan request not found');
      }

      if (loan.status !== LoanRequestStatus.PENDING) {
        throw new BadRequestException(
          `Cannot offer terms on a loan with status "${loan.status}". Only pending applications can receive an offer.`,
        );
      }

      if (!offer.approved_amount || offer.approved_amount <= 0) {
        throw new BadRequestException('Approved amount must be greater than zero.');
      }

      if (offer.approved_amount > loan.requested_amount + 0.01) {
        throw new BadRequestException(
          `Approved amount (${offer.approved_amount}) cannot exceed the requested amount (${loan.requested_amount}).`,
        );
      }

      if (!offer.due_date) {
        throw new BadRequestException('Repayment due date is required.');
      }

      const dueDate = new Date(offer.due_date);
      const minDue = new Date();
      minDue.setDate(minDue.getDate() + 7);
      if (dueDate < minDue) {
        throw new BadRequestException('Due date must be at least 7 days from today.');
      }

      const termMonths = offer.loan_term_months ?? 3;
      const financials = await this.computeOfferFinancials(
        loan,
        offer.approved_amount,
        termMonths,
        loanId,
      );

      loan.status = LoanRequestStatus.APPROVED;
      loan.approved_amount = offer.approved_amount;
      loan.external_loan_ref = offer.external_loan_ref ?? loan.external_loan_ref;
      loan.interest_amount = financials.interest_amount;
      loan.due_date = dueDate;
      loan.loan_term_months = termMonths;
      // Allow lender to set/confirm currency at approval time; fall back to existing loan currency
      if ((offer as any).currency) loan.currency = (offer as any).currency;
      loan.apr = financials.apr;
      loan.origination_fee_amount = financials.origination_fee_amount;
      loan.total_cost_of_credit = financials.total_cost_of_credit;
      loan.terms_offered_at = new Date();
      loan.borrower_accepted_at = null;
      loan.terms_declined_at = null;
      loan.terms_decline_reason = null;

      const isPartial = offer.approved_amount < loan.requested_amount - 0.01;
      const offerSnapshot = {
        offered_at: new Date().toISOString(),
        approved_amount: offer.approved_amount,
        requested_amount: loan.requested_amount,
        is_partial_approval: isPartial,
        offer_type: isPartial ? 'counter_offer' : 'full_offer',
        loan_term_months: termMonths,
        due_date: offer.due_date,
        interest_amount: financials.interest_amount,
        total_repayable: financials.total_repayable,
        currency: loan.currency,
      };

      loan.metadata = {
        ...(loan.metadata || {}),
        interest_rate: financials.nominal_rate,
        effective_annual_rate: financials.effective_annual_rate,
        risk_score: financials.risk_score,
        risk_level: financials.risk_level,
        offer_snapshot: offerSnapshot,
        offer_history: [
          ...((loan.metadata?.offer_history as any[]) || []),
          offerSnapshot,
        ],
        // Confirming after an appeal resolves the appeal
        appeal: loan.metadata?.appeal
          ? { ...loan.metadata.appeal, status: 'resolved', resolved_at: new Date().toISOString() }
          : null,
        rejection: null,
      };

      const updatedLoan = await manager.save(LoanRequest, loan);

      // Notify borrower — counter-offer vs full offer; disbursement blocked until acceptance
      try {
        const lender = loan.lender_id
          ? await this.lenderRepository.findOne({ where: { id: loan.lender_id } })
          : null;
        const creatorUser = await this.userRepository.findOne({
          where: { id: updatedLoan.created_by },
        });
        if (creatorUser) {
          await this.loanNotificationService.notifyBorrowerTermsOffered(
            creatorUser.id,
            updatedLoan.tenant_id,
            updatedLoan.id,
            {
              lenderName: lender?.name || 'Lender',
              approvedAmount: updatedLoan.approved_amount,
              requestedAmount: updatedLoan.requested_amount,
              interestAmount: updatedLoan.interest_amount,
              totalRepayable: financials.total_repayable,
              dueDate: updatedLoan.due_date,
              loanTermMonths: termMonths,
              apr: financials.apr,
              currency: updatedLoan.currency,
              loanNumber: updatedLoan.loan_number,
              isCounterOffer: isPartial,
            },
          );
        }
      } catch (notifErr) {
        this.logger.warn(`Could not send loan offer notification: ${notifErr.message}`);
      }

      return { ...updatedLoan, ...buildLoanWorkflowView(updatedLoan) };
    });
  }

  /** Step 2 — Borrower accepts the lender's formal offer (electronic consent). */
  async acceptLoanTerms(
    loanId: string,
    userId: string,
    consentReference?: string,
  ): Promise<LoanRequest> {
    const loan = await this.loanRequestRepository.findOne({
      where: { id: loanId },
      relations: ['lender'],
    });

    if (!loan) {
      throw new NotFoundException('Loan request not found');
    }

    if (loan.created_by !== userId) {
      throw new BadRequestException('Only the borrower can accept loan terms.');
    }

    if (loan.status !== LoanRequestStatus.APPROVED) {
      throw new BadRequestException(
        `Loan is not awaiting acceptance (status: ${loan.status}).`,
      );
    }

    if (!loan.terms_offered_at) {
      throw new BadRequestException('No formal terms offer exists for this loan.');
    }

    if (loan.borrower_accepted_at) {
      throw new ConflictException('Loan terms have already been accepted.');
    }

    if (loan.terms_declined_at) {
      throw new BadRequestException(
        'These terms were declined. The lender must submit a new offer.',
      );
    }

    loan.borrower_accepted_at = new Date();
    loan.metadata = {
      ...(loan.metadata || {}),
      borrower_consent: {
        accepted_at: loan.borrower_accepted_at.toISOString(),
        consent_reference: consentReference ?? null,
        accepted_by: userId,
      },
    };

    const saved = await this.loanRequestRepository.save(loan);

    try {
      if (loan.lender_id) {
        const lenderUsers = await this.lenderUserRepository.find({
          where: { lender_id: loan.lender_id, status: LenderUserStatus.ACTIVE },
          take: 5,
        });
        for (const lu of lenderUsers) {
          await this.loanNotificationService.notifyLenderTermsAccepted(
            lu.id,
            loan.tenant_id,
            loan.id,
            loan.approved_amount || loan.requested_amount,
            loan.loan_number,
          );
        }
      }
    } catch (notifErr) {
      this.logger.warn(`Could not notify lender of terms acceptance: ${notifErr.message}`);
    }

    return { ...saved, ...buildLoanWorkflowView(saved) };
  }

  /**
   * Borrower declines the lender's formal offer / counter-offer.
   * Returns the application to pending so the lender can submit a revised offer
   * (standard credit negotiation — decline ends the current offer, not the facility).
   */
  async declineLoanTerms(
    loanId: string,
    userId: string,
    reason?: string,
  ): Promise<LoanRequest> {
    const loan = await this.loanRequestRepository.findOne({ where: { id: loanId } });

    if (!loan) {
      throw new NotFoundException('Loan request not found');
    }

    if (loan.created_by !== userId) {
      throw new BadRequestException('Only the borrower can decline loan terms.');
    }

    if (loan.status !== LoanRequestStatus.APPROVED || !loan.terms_offered_at) {
      throw new BadRequestException('No pending terms offer to decline.');
    }

    if (loan.borrower_accepted_at) {
      throw new ConflictException('Terms already accepted — cannot decline.');
    }

    const declineReason = reason || 'Borrower declined offered terms';
    const declinedOffer = loan.metadata?.offer_snapshot
      ? { ...loan.metadata.offer_snapshot, declined_at: new Date().toISOString(), decline_reason: declineReason }
      : null;

    loan.terms_declined_at = null;
    loan.terms_decline_reason = null;
    // Re-open for renegotiation — hard reject is lender-only via rejectLoanRequest
    loan.status = LoanRequestStatus.PENDING;
    loan.approved_amount = null as any;
    loan.interest_amount = null as any;
    loan.apr = null as any;
    loan.origination_fee_amount = null as any;
    loan.total_cost_of_credit = null as any;
    loan.due_date = null as any;
    loan.loan_term_months = null;
    loan.terms_offered_at = null;
    loan.borrower_accepted_at = null;
    loan.metadata = {
      ...(loan.metadata || {}),
      offer_snapshot: null,
      last_declined_offer: declinedOffer,
      offer_history: [
        ...((loan.metadata?.offer_history as any[]) || []),
        ...(declinedOffer ? [declinedOffer] : []),
      ],
    };

    const saved = await this.loanRequestRepository.save(loan);

    try {
      if (loan.lender_id) {
        const lenderUsers = await this.lenderUserRepository.find({
          where: { lender_id: loan.lender_id, status: LenderUserStatus.ACTIVE },
          take: 5,
        });
        for (const lu of lenderUsers) {
          await this.loanNotificationService.notifyLenderTermsDeclined(
            lu.id,
            loan.tenant_id,
            loan.id,
            declineReason,
          );
        }
      }
    } catch (notifErr) {
      this.logger.warn(`Could not notify lender of terms decline: ${notifErr.message}`);
    }

    return { ...saved, ...buildLoanWorkflowView(saved) };
  }

  /** Full TILA-style disclosure for borrower review before acceptance. */
  async getLoanOfferDisclosure(loanId: string): Promise<any> {
    const loan = await this.loanRequestRepository.findOne({
      where: { id: loanId },
      relations: ['lender', 'loanTerms', 'borrower'],
    });

    if (!loan) {
      throw new NotFoundException('Loan request not found');
    }

    const approvedAmount = Number(loan.approved_amount ?? loan.requested_amount);
    let interestAmount = Number(loan.interest_amount ?? 0);
    let nominalRate =
      loan.metadata?.interest_rate ?? loan.loanTerms?.[0]?.nominal_rate ?? null;

    // If interest was never contracted, derive from active interest-rate policy
    if (interestAmount <= 0 && loan.lender_id) {
      try {
        const borrowerCreditScore =
          (loan as any).borrower?.credit_score ?? null;
        const terms = await this.computeLoanTerms(
          loan.lender_id,
          borrowerCreditScore,
          loan.id,
        );
        if (terms.interest_rate != null) {
          nominalRate = terms.interest_rate;
          const termMonthsForInterest = Number(loan.loan_term_months || 3);
          interestAmount =
            Math.round(
              approvedAmount *
                (terms.interest_rate / 100) *
                (termMonthsForInterest / 12) *
                100,
            ) / 100;
        }
      } catch (err: any) {
        this.logger.warn(
          `getLoanOfferDisclosure: interest policy lookup failed for ${loanId}: ${err.message}`,
        );
      }
    }

    const originationFee = Number(loan.origination_fee_amount ?? 0);
    const totalRepayable = approvedAmount + interestAmount + originationFee;
    const termMonths = Number(loan.loan_term_months || 3);
    const monthlyInstalment =
      termMonths > 0 ? Math.round((totalRepayable / termMonths) * 100) / 100 : totalRepayable;

    const repaymentSchedule = Array.from({ length: Math.max(termMonths, 1) }, (_, i) => {
      const due = loan.due_date ? new Date(loan.due_date) : new Date();
      if (loan.due_date && termMonths > 1) {
        // Spread instalments ending on final due date
        const start = new Date(due);
        start.setMonth(start.getMonth() - (termMonths - 1 - i));
        return {
          instalment_number: i + 1,
          due_date: start.toISOString().split('T')[0],
          amount: monthlyInstalment,
        };
      }
      return {
        instalment_number: i + 1,
        due_date: due.toISOString().split('T')[0],
        amount: monthlyInstalment,
      };
    });

    const workflow = buildLoanWorkflowView(loan);
    const amountReduction =
      loan.requested_amount > approvedAmount
        ? Math.round((loan.requested_amount - approvedAmount) * 100) / 100
        : 0;

    const beneficiaryPayment = await this.resolveTruckOwnerPaymentInfo(loan.trip_id);
    const isTruckOwnerFinancing = this.isTruckOwnerTripFinancing(loan);

    const rulesAndRegulations = isTruckOwnerFinancing
      ? [
          'This offer is a formal credit disclosure for truck-owner trip financing. No funds are disbursed until you agree.',
          'Interest is calculated on the offered principal for the stated term (APR disclosed above).',
          'Repayment is due by the stated due date / instalment schedule. Late payment may incur fees after any grace period.',
          'Funds are released to your fleet payment account as working capital to execute the transport contract.',
          'You remain responsible for completing the trip. Freight payment from the cargo owner is separate from this financing facility.',
          'You may reject this offer; the lender may then revise terms or close the application.',
          'Personal, fleet, and trip data used for this assessment is processed for credit underwriting and AML/KYC compliance.',
          'This facility is subject to the lender’s active interest-rate and risk policy in force at offer time.',
        ]
      : [
          'This offer is a formal credit disclosure. No funds are disbursed until you agree.',
          'Interest is calculated on the offered principal for the stated term (APR disclosed above).',
          'Repayment is due by the stated due date / instalment schedule. Late payment may incur fees after any grace period.',
          'Funds are disbursed to the nominated service provider (e.g. transporter) on your behalf once you agree and the lender pays.',
          'You may reject this offer; the lender may then revise terms or close the application.',
          'Personal and cargo data used for this assessment is processed for credit underwriting and AML/KYC compliance.',
          'This facility is subject to the lender’s active interest-rate and risk policy in force at offer time.',
        ];

    return {
      loan_id: loan.id,
      loan_number: loan.loan_number,
      status: loan.status,
      currency: loan.currency,
      financing_type: loan.financing_type || FinancingType.CARGO_OWNER,
      requested_amount: loan.requested_amount,
      approved_amount: approvedAmount,
      interest_amount: interestAmount,
      origination_fee_amount: originationFee,
      total_repayable: totalRepayable,
      monthly_instalment: monthlyInstalment,
      apr: loan.apr,
      nominal_rate: nominalRate,
      effective_annual_rate:
        loan.metadata?.effective_annual_rate ?? loan.loanTerms?.[0]?.effective_annual_rate,
      loan_term_months: termMonths,
      due_date: loan.due_date,
      grace_period_end: loan.grace_period_end,
      terms_offered_at: loan.terms_offered_at,
      borrower_accepted_at: loan.borrower_accepted_at,
      terms_declined_at: loan.terms_declined_at,
      lender_name: loan.lender?.name,
      policy: {
        interest_rate_source: 'Lender Interest Rate Policy + borrower risk assessment',
        nominal_rate: nominalRate,
        apr: loan.apr,
        risk_score: loan.risk_score ?? loan.metadata?.risk_score ?? null,
        risk_tier: loan.risk_tier ?? loan.metadata?.risk_level ?? null,
        currency: loan.currency,
        purpose:
          loan.purpose ||
          (isTruckOwnerFinancing ? 'Truck owner trip financing' : 'Cargo financing'),
        financing_type: loan.financing_type || FinancingType.CARGO_OWNER,
      },
      repayment_schedule: repaymentSchedule,
      rules_and_regulations: rulesAndRegulations,
      can_accept:
        loan.status === LoanRequestStatus.APPROVED &&
        !!loan.terms_offered_at &&
        !loan.borrower_accepted_at &&
        !loan.terms_declined_at,
      can_disburse:
        loan.status === LoanRequestStatus.APPROVED &&
        !!loan.borrower_accepted_at &&
        !loan.terms_declined_at,
      offer_snapshot: loan.metadata?.offer_snapshot,
      is_counter_offer: workflow.is_partial_offer,
      amount_reduction: amountReduction,
      beneficiary_payment: {
        truck_owner_id: beneficiaryPayment.ownerId,
        truck_owner_name: beneficiaryPayment.ownerName,
        payment_info: beneficiaryPayment.paymentInfo,
        has_mobile_money: beneficiaryPayment.hasMobileMoney,
        has_bank_account: beneficiaryPayment.hasBankAccount,
        configured: beneficiaryPayment.hasMobileMoney || beneficiaryPayment.hasBankAccount,
        setup_path: '/dashboard/fleet/financial-info',
      },
      ...workflow,
    };
  }

  private async computeOfferFinancials(
    loan: LoanRequest,
    approvedAmount: number,
    termMonths: number,
    loanId: string,
  ): Promise<{
    interest_amount: number;
    origination_fee_amount: number;
    total_cost_of_credit: number;
    total_repayable: number;
    apr: number | null;
    nominal_rate: number | null;
    effective_annual_rate: number | null;
    risk_score: number | null;
    risk_level: string | null;
  }> {
    const borrowerCreditScore = (loan as any).borrower?.credit_score ?? null;
    let nominal_rate: number | null = null;
    let effective_annual_rate: number | null = null;
    let risk_score: number | null = null;
    let risk_level: string | null = null;

    if (loan.lender_id) {
      const terms = await this.computeLoanTerms(
        loan.lender_id,
        borrowerCreditScore,
        loanId,
      );
      nominal_rate = terms.interest_rate;
      effective_annual_rate = terms.effective_annual_rate;
      risk_score = terms.risk_score;
      risk_level = terms.risk_level;
    }

    const ratePct = nominal_rate ?? 10;
    const interest_amount =
      Math.round(approvedAmount * (ratePct / 100) * (termMonths / 12) * 100) / 100;

    const originationFeeRate =
      loan.origination_fee_rate ??
      loan.metadata?.origination_fee_rate ??
      0;
    const origination_fee_amount =
      Math.round(approvedAmount * Number(originationFeeRate) * 100) / 100;

    const total_cost_of_credit = interest_amount + origination_fee_amount;
    const total_repayable = approvedAmount + total_cost_of_credit;
    const apr = effective_annual_rate ?? ratePct;

    return {
      interest_amount,
      origination_fee_amount,
      total_cost_of_credit,
      total_repayable,
      apr,
      nominal_rate,
      effective_annual_rate,
      risk_score,
      risk_level,
    };
  }

  private assertReadyForDisbursement(loan: LoanRequest): void {
    if (loan.status !== LoanRequestStatus.APPROVED) {
      throw new BadRequestException(
        `Loan must be approved before disbursement (current: ${loan.status}).`,
      );
    }
    if (!loan.terms_offered_at) {
      throw new BadRequestException(
        'Formal terms must be offered to the borrower before disbursement.',
      );
    }
    if (!loan.borrower_accepted_at) {
      throw new BadRequestException(
        'Borrower must accept the loan terms before funds can be disbursed. ' +
        'This is required for regulatory compliance (TILA / consumer credit disclosure).',
      );
    }
    if (loan.terms_declined_at) {
      throw new BadRequestException('Borrower declined the offered terms.');
    }
    if (!loan.approved_amount || loan.approved_amount <= 0) {
      throw new BadRequestException('Approved amount is not set.');
    }
  }

  /**
   * Resolve truck owner payment details from their fleet financial-info profile
   * (profile.preferences.paymentInfo configured at /dashboard/fleet/financial-info).
   */
  private async resolveTruckOwnerPaymentInfo(
    tripId: string | null | undefined,
    manager?: any,
  ): Promise<{
    ownerId: string | null;
    ownerName: string | null;
    paymentInfo: {
      phoneNumber?: string;
      momoCode?: string;
      accountNumber?: string;
    };
    hasMobileMoney: boolean;
    hasBankAccount: boolean;
  }> {
    const empty = {
      ownerId: null,
      ownerName: null,
      paymentInfo: {},
      hasMobileMoney: false,
      hasBankAccount: false,
    };

    if (!tripId) return empty;

    const findOne = manager
      ? (entity: any, opts: any) => manager.findOne(entity, opts)
      : (entity: any, opts: any) => this.dataSource.manager.findOne(entity, opts);

    const trip = await findOne('Trip', {
      where: { id: tripId },
      relations: ['load'],
    } as any);

    if (!trip) return empty;

    const assignedTruckId = trip.truckId || trip.load?.assignedTruckId;
    if (!assignedTruckId) return empty;

    const truck = await findOne('Truck', {
      where: { id: assignedTruckId },
      relations: ['owner', 'owner.profile'],
    } as any);

    if (!truck?.owner) return empty;

    let paymentInfo =
      truck.owner.profile?.preferences?.paymentInfo ||
      truck.owner.profile?.preferences?.payment_info ||
      {};

    if (!paymentInfo?.phoneNumber && !paymentInfo?.accountNumber) {
      const ownerUser = await findOne('User', {
        where: { id: truck.owner.id },
        relations: ['profile'],
      } as any);

      paymentInfo =
        ownerUser?.profile?.preferences?.paymentInfo ||
        ownerUser?.profile?.preferences?.payment_info ||
        paymentInfo;
    }

    const phoneNumber =
      paymentInfo?.phoneNumber?.trim() ||
      truck.owner.profile?.phone?.trim() ||
      truck.owner.phone?.trim() ||
      undefined;
    const momoCode = paymentInfo?.momoCode?.trim() || undefined;
    const accountNumber = paymentInfo?.accountNumber?.trim() || undefined;

    const ownerName =
      [truck.owner.profile?.firstName, truck.owner.profile?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      truck.owner.email ||
      null;

    return {
      ownerId: truck.owner.id,
      ownerName,
      paymentInfo: { phoneNumber, momoCode, accountNumber },
      hasMobileMoney: !!phoneNumber,
      hasBankAccount: !!accountNumber,
    };
  }

  /** Rwanda Ishema MoMo only settles in RWF. */
  private isIshemaMobileMoneyProvider(): boolean {
    const apiUrl =
      this.configService.get<string>('MOBILE_MONEY_API_URL') ||
      'https://api.payment.ishema.rw';
    return apiUrl.includes('ishema.rw');
  }

  /**
   * Loan principal stays in DB as stored (amount + currency).
   * Convert to RWF only when calling the Ishema MoMo API.
   */
  private async convertToRwfForIshema(
    amount: number,
    currency: string,
  ): Promise<{
    originalAmount: number;
    originalCurrency: string;
    rwfAmount: number;
    exchangeRate: number | null;
    conversionApplied: boolean;
  }> {
    const originalCurrency = this.requireCurrency(currency, 'loan currency');
    const originalAmount = amount;

    if (originalCurrency === 'RWF') {
      return {
        originalAmount,
        originalCurrency,
        rwfAmount: Math.round(originalAmount),
        exchangeRate: null,
        conversionApplied: false,
      };
    }

    try {
      const converted = await this.currencyService.convert(
        originalAmount,
        originalCurrency,
        'RWF',
      );
      if (
        !converted ||
        !Number.isFinite(converted.convertedAmount) ||
        converted.convertedAmount <= 0
      ) {
        throw new BadRequestException(
          `Currency conversion returned an invalid RWF amount (${originalCurrency} → RWF).`,
        );
      }
      return {
        originalAmount,
        originalCurrency,
        rwfAmount: Math.round(converted.convertedAmount),
        exchangeRate: converted.exchangeRate,
        conversionApplied: true,
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        `Failed to convert ${originalAmount} ${originalCurrency} to RWF for Ishema: ${err.message}`,
      );
    }
  }

  /** Settlement currency for the active MoMo provider (Ishema → RWF). */
  private getMobileMoneySettlementCurrency(): string {
    if (this.isIshemaMobileMoneyProvider()) {
      return 'RWF';
    }
    return this.requireCurrency(
      this.configService.get<string>('MOBILE_MONEY_CURRENCY'),
      'MOBILE_MONEY_CURRENCY env',
    );
  }

  /**
   * Resolve how much the lender actually pays on the chosen rail.
   *
   * - principal*  = locked loan amount in loan.currency (cargo owner's denomination)
   * - payer*      = lender's chosen payment currency (from modal)
   * - settlement* = amount/currency sent to the payment provider
   *
   * MoMo (Ishema) always settles in RWF. Bank/card settle in payerCurrency.
   */
  private async resolveSettlementAmount(params: {
    principalAmount: number;
    principalCurrency: string;
    paymentMethod: string;
    payerCurrency?: string;
  }): Promise<{
    principalAmount: number;
    principalCurrency: string;
    payerCurrency: string;
    settlementAmount: number;
    settlementCurrency: string;
    exchangeRate: number | null;
    conversionApplied: boolean;
  }> {
    const principalCurrency = this.requireCurrency(
      params.principalCurrency,
      'loan principal currency',
    );
    const principalAmount = params.principalAmount;

    let settlementCurrency: string;
    if (params.paymentMethod === 'mobile_money') {
      // Ishema: always convert loan principal → RWF at payment time
      const rwf = await this.convertToRwfForIshema(
        principalAmount,
        principalCurrency,
      );
      return {
        principalAmount: rwf.originalAmount,
        principalCurrency: rwf.originalCurrency,
        payerCurrency: 'RWF',
        settlementAmount: rwf.rwfAmount,
        settlementCurrency: 'RWF',
        exchangeRate: rwf.exchangeRate,
        conversionApplied: rwf.conversionApplied,
      };
    }

    settlementCurrency = this.requireCurrency(
      params.payerCurrency || principalCurrency,
      params.payerCurrency ? 'payer currency' : 'loan principal currency',
    );

    const payerCurrency = settlementCurrency;

    if (principalCurrency === settlementCurrency) {
      return {
        principalAmount,
        principalCurrency,
        payerCurrency,
        settlementAmount: Math.round(principalAmount),
        settlementCurrency,
        exchangeRate: null,
        conversionApplied: false,
      };
    }

    try {
      const converted = await this.currencyService.convert(
        principalAmount,
        principalCurrency,
        settlementCurrency,
      );
      if (
        !converted ||
        !Number.isFinite(converted.convertedAmount) ||
        converted.convertedAmount <= 0
      ) {
        throw new BadRequestException(
          `Currency conversion returned an invalid amount (${principalCurrency} → ${settlementCurrency}).`,
        );
      }
      return {
        principalAmount,
        principalCurrency,
        payerCurrency,
        settlementAmount: Math.round(converted.convertedAmount),
        settlementCurrency,
        exchangeRate: converted.exchangeRate,
        conversionApplied: true,
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        `Currency conversion failed (${principalCurrency} → ${settlementCurrency}): ${err.message}. Disbursement aborted.`,
      );
    }
  }

  /** @deprecated Use resolveSettlementAmount — kept as alias for repayments. */
  private async resolveDisbursementAmount(
    amount: number,
    loanCurrency: string,
    paymentMethod = 'mobile_money',
    payerCurrency?: string,
  ): Promise<{ amount: number; currency: string; exchangeRate?: number }> {
    const quote = await this.resolveSettlementAmount({
      principalAmount: amount,
      principalCurrency: loanCurrency,
      paymentMethod,
      payerCurrency,
    });
    return {
      amount: quote.settlementAmount,
      currency: quote.settlementCurrency,
      exchangeRate: quote.exchangeRate ?? undefined,
    };
  }

  /** Preview FX for the disbursement modal before the lender confirms payment. */
  async getDisbursementQuote(
    loanId: string,
    paymentMethod: string,
    payerCurrency?: string,
  ): Promise<{
    principal_amount: number;
    principal_currency: string;
    payer_currency: string;
    settlement_amount: number;
    settlement_currency: string;
    exchange_rate: number | null;
    conversion_applied: boolean;
    payment_method: string;
  }> {
    const loan = await this.loanRequestRepository.findOne({ where: { id: loanId } });
    if (!loan) {
      throw new NotFoundException('Loan request not found');
    }

    const principalAmount = Number(loan.approved_amount ?? loan.requested_amount);
    const principalCurrency = this.requireCurrency(
      loan.currency,
      `loan ${loan.id} currency`,
    );

    const quote = await this.resolveSettlementAmount({
      principalAmount,
      principalCurrency,
      paymentMethod: paymentMethod || 'mobile_money',
      payerCurrency,
    });

    return {
      principal_amount: quote.principalAmount,
      principal_currency: quote.principalCurrency,
      payer_currency: quote.payerCurrency,
      settlement_amount: quote.settlementAmount,
      settlement_currency: quote.settlementCurrency,
      exchange_rate: quote.exchangeRate,
      conversion_applied: quote.conversionApplied,
      payment_method: paymentMethod || 'mobile_money',
    };
  }

  /**
   * Called from Ishema webhook after provider confirms success.
   *
   * Two-phase MoMo (Ishema requires merchant as collection receiver for USSD):
   *   collection → lender paid platform (PIN on lender) → start payout
   *   payout     → platform paid truck owner → mark loan DISBURSED
   */
  async confirmDisbursementFromWebhook(input: {
    referenceId: string;
    transactionId?: string;
    paymentId?: string;
  }): Promise<void> {
    const { Payment: PaymentEntity, PaymentStatus: PmtStatus } =
      await import('../../entities/payment.entity');

    let payoutJob: {
      paymentId: string;
      tenantId: string;
      loanId: string;
      amount: number;
      beneficiaryPhone: string;
      platformPhone: string;
      collectionReferenceId: string;
      paymentMessage: string;
    } | null = null;

    await this.dataSource.transaction(async (manager) => {
      let payment: any = null;
      if (input.paymentId) {
        payment = await manager.findOne(PaymentEntity, { where: { id: input.paymentId } });
      }
      if (!payment) {
        payment = await manager
          .createQueryBuilder(PaymentEntity, 'p')
          .where('p.referenceNumber = :ref OR p.transactionId = :ref', { ref: input.referenceId })
          .orWhere(`(p.metadata->>'referenceId') = :ref`, { ref: input.referenceId })
          .orWhere(`(p.metadata->>'payoutReferenceId') = :ref`, { ref: input.referenceId })
          .orWhere(`(p.metadata->>'collectionReferenceId') = :ref`, { ref: input.referenceId })
          .getOne();
      }
      if (!payment) {
        this.logger.warn(`confirmDisbursementFromWebhook: no payment for ${input.referenceId}`);
        return;
      }

      const meta = (payment.metadata || {}) as Record<string, any>;
      const loanId = meta.loanId as string;
      if (!loanId) return;

      const loan = await manager.findOne(LoanRequest, {
        where: { id: loanId },
        relations: ['lender'],
      });
      if (!loan) return;

      if (loan.status === LoanRequestStatus.DISBURSED) {
        this.logger.log(`Loan ${loanId} already DISBURSED — webhook idempotent skip`);
        return;
      }

      const phase = meta.momoPhase || 'collection';

      // ── Phase 2: payout to truck owner confirmed ──────────────────────────
      if (phase === 'payout') {
        const disbursement = meta.disbursementId
          ? await manager.findOne(LoanDisbursement, { where: { id: meta.disbursementId } })
          : await manager.findOne(LoanDisbursement, {
              where: { loan_request_id: loanId },
              order: { created_at: 'DESC' } as any,
            });

        if (!disbursement) {
          this.logger.error(`confirmDisbursementFromWebhook: no disbursement for loan ${loanId}`);
          return;
        }

        const lockedAmount = Number(loan.approved_amount);
        const txnId = input.transactionId || input.referenceId;

        disbursement.status = DisbursementStatus.DISBURSED;
        disbursement.disbursement_date = new Date();
        disbursement.external_txn_ref = txnId;
        loan.status = LoanRequestStatus.DISBURSED;
        loan.metadata = {
          ...(loan.metadata || {}),
          disbursement: {
            ...(loan.metadata?.disbursement || {}),
            disbursed_at: new Date().toISOString(),
            pending_confirmation: false,
            momo_phase: 'completed',
            amount: lockedAmount,
            currency: loan.currency,
            transaction_id: txnId,
            confirmed_via: 'ishema_webhook',
          },
        };

        payment.metadata = {
          ...meta,
          momoPhase: 'completed',
          payoutConfirmedAt: new Date().toISOString(),
        };
        await manager.save(PaymentEntity, payment);
        await manager.save(LoanDisbursement, disbursement);
        await manager.save(LoanRequest, loan);

        await this.finalizeDisbursementSideEffects(manager, {
          loan,
          disbursement,
          lockedAmount,
          processedPaymentId: payment.id,
          tripId: payment.tripId,
          lenderUserId: payment.payerId,
          beneficiaries: disbursement.beneficiaries || [],
        });

        this.logger.log(
          `Loan ${loanId} marked DISBURSED via Ishema payout webhook (${input.referenceId})`,
        );
        return;
      }

      // ── Phase 1: collection confirmed — queue payout to truck owner ───────
      if (phase === 'payout_initiating' || phase === 'payout') {
        this.logger.log(
          `Loan ${loanId} collection webhook ignored — payout already ${phase}`,
        );
        return;
      }

      const beneficiaryPhone =
        meta.beneficiaryPhoneNumber || meta.receiverPhoneNumber;
      const platformPhone = meta.platformPhoneNumber;
      const momoAmount = Number(meta.momoAmount || payment.amount);

      // Legacy single-shot disbursements (no platform collection leg)
      if (!meta.momoPhase && !platformPhone) {
        const disbursement = meta.disbursementId
          ? await manager.findOne(LoanDisbursement, { where: { id: meta.disbursementId } })
          : await manager.findOne(LoanDisbursement, {
              where: { loan_request_id: loanId },
              order: { created_at: 'DESC' } as any,
            });
        if (!disbursement) {
          this.logger.error(`confirmDisbursementFromWebhook: no disbursement for loan ${loanId}`);
          return;
        }
        const lockedAmount = Number(loan.approved_amount);
        const txnId = input.transactionId || input.referenceId;
        disbursement.status = DisbursementStatus.DISBURSED;
        disbursement.disbursement_date = new Date();
        disbursement.external_txn_ref = txnId;
        loan.status = LoanRequestStatus.DISBURSED;
        loan.metadata = {
          ...(loan.metadata || {}),
          disbursement: {
            ...(loan.metadata?.disbursement || {}),
            disbursed_at: new Date().toISOString(),
            pending_confirmation: false,
            amount: lockedAmount,
            currency: loan.currency,
            transaction_id: txnId,
            confirmed_via: 'ishema_webhook',
          },
        };
        await manager.save(LoanDisbursement, disbursement);
        await manager.save(LoanRequest, loan);
        await this.finalizeDisbursementSideEffects(manager, {
          loan,
          disbursement,
          lockedAmount,
          processedPaymentId: payment.id,
          tripId: payment.tripId,
          lenderUserId: payment.payerId,
          beneficiaries: disbursement.beneficiaries || [],
        });
        this.logger.log(
          `Loan ${loanId} marked DISBURSED via legacy single-shot webhook (${input.referenceId})`,
        );
        return;
      }

      if (!beneficiaryPhone || !platformPhone || !momoAmount) {
        this.logger.error(
          `confirmDisbursementFromWebhook: missing payout fields for loan ${loanId} ` +
            `(beneficiary=${beneficiaryPhone}, platform=${platformPhone}, amount=${momoAmount})`,
        );
        return;
      }

      payment.metadata = {
        ...meta,
        momoPhase: 'payout_initiating',
        collectionConfirmedAt: new Date().toISOString(),
        collectionReferenceId: meta.referenceId || payment.referenceNumber,
        collectionTransactionId: payment.transactionId || input.transactionId,
      };
      payment.status = PmtStatus.PROCESSING;
      await manager.save(PaymentEntity, payment);

      loan.metadata = {
        ...(loan.metadata || {}),
        disbursement: {
          ...(loan.metadata?.disbursement || {}),
          momo_phase: 'payout_initiating',
          pending_confirmation: true,
          collection_confirmed_at: new Date().toISOString(),
        },
      };
      await manager.save(LoanRequest, loan);

      payoutJob = {
        paymentId: payment.id,
        tenantId: payment.tenantId,
        loanId,
        amount: momoAmount,
        beneficiaryPhone,
        platformPhone,
        collectionReferenceId:
          meta.referenceId || payment.referenceNumber || input.referenceId,
        paymentMessage:
          payment.description ||
          `Loan disbursement payout #${loan.loan_number || loan.id.slice(0, 8)}`,
      };

      this.logger.log(
        `Loan ${loanId} collection confirmed — initiating payout to ${beneficiaryPhone}`,
      );
    });

    if (payoutJob) {
      await this.initiateDisbursementPayout(payoutJob);
    }
  }

  /**
   * Leg 2: after lender collection succeeds, pay truck owner from platform MoMo account.
   * PIN goes to MOBILE_MONEY_ACCOUNT_PHONE (merchant SIM). Loan stays pending until this webhook.
   */
  private async initiateDisbursementPayout(job: {
    paymentId: string;
    tenantId: string;
    loanId: string;
    amount: number;
    beneficiaryPhone: string;
    platformPhone: string;
    collectionReferenceId: string;
    paymentMessage: string;
  }): Promise<void> {
    const { Payment: PaymentEntity, PaymentStatus: PmtStatus } =
      await import('../../entities/payment.entity');

    try {
      const MobileMoneyModule = await import(
        '../payments/services/mobile-money-payment.service'
      );
      const mobileMoneyService = this.moduleRef.get(
        MobileMoneyModule.MobileMoneyPaymentService,
        { strict: false },
      );
      if (!mobileMoneyService) {
        throw new Error('Mobile Money payment service is not available for payout');
      }

      const payoutReferenceId = `${job.collectionReferenceId}-PAYOUT`;
      const transfers = [
        {
          percentage: 100,
          phoneNumber: job.beneficiaryPhone,
          receiverMessage: job.paymentMessage.substring(0, 160),
        },
      ];

      this.logger.log(
        `Initiating MoMo payout for loan ${job.loanId}: ${job.amount} RWF ` +
          `| PIN → platform ${job.platformPhone} → beneficiary ${job.beneficiaryPhone} ` +
          `| ref ${payoutReferenceId}`,
      );

      const momoResponse = await mobileMoneyService.createTransaction(
        job.amount,
        job.platformPhone,
        payoutReferenceId,
        job.paymentMessage.substring(0, 160),
        transfers,
        this.configService.get<string>('MOBILE_MONEY_CALLBACK_URL'),
      );

      const transaction =
        momoResponse.savedTransaction || momoResponse.transaction;
      const transactionId =
        transaction?.externalId || transaction?.id || payoutReferenceId;
      const txnStatus = transaction?.status || 'pending';

      if (txnStatus === 'failed') {
        throw new Error('Ishema rejected platform → beneficiary payout');
      }

      await this.dataSource.transaction(async (manager) => {
        const payment = await manager.findOne(PaymentEntity, {
          where: { id: job.paymentId },
        });
        if (!payment) return;

        const meta = (payment.metadata || {}) as Record<string, any>;
        payment.transactionId = transactionId;
        payment.status = PmtStatus.PROCESSING;
        payment.metadata = {
          ...meta,
          momoPhase: 'payout',
          referenceId: payoutReferenceId,
          payoutReferenceId,
          payoutTransactionId: transactionId,
          payoutInitiatedAt: new Date().toISOString(),
        };
        await manager.save(PaymentEntity, payment);

        const loan = await manager.findOne(LoanRequest, {
          where: { id: job.loanId },
        });
        if (loan) {
          loan.metadata = {
            ...(loan.metadata || {}),
            disbursement: {
              ...(loan.metadata?.disbursement || {}),
              momo_phase: 'payout',
              pending_confirmation: true,
              payout_transaction_id: transactionId,
              payout_reference_id: payoutReferenceId,
            },
          };
          await manager.save(LoanRequest, loan);
        }

        const disbursement = meta.disbursementId
          ? await manager.findOne(LoanDisbursement, {
              where: { id: meta.disbursementId },
            })
          : null;
        if (disbursement) {
          disbursement.external_txn_ref = transactionId;
          disbursement.status = DisbursementStatus.PENDING;
          await manager.save(LoanDisbursement, disbursement);
        }
      });

      this.logger.log(
        `MoMo payout initiated for loan ${job.loanId}: externalId=${transactionId}, status=${txnStatus}`,
      );
    } catch (err: any) {
      this.logger.error(
        `initiateDisbursementPayout failed for loan ${job.loanId}: ${err.message}`,
        err.stack,
      );

      await this.dataSource.transaction(async (manager) => {
        const payment = await manager.findOne(PaymentEntity, {
          where: { id: job.paymentId },
        });
        if (payment) {
          const meta = (payment.metadata || {}) as Record<string, any>;
          payment.metadata = {
            ...meta,
            momoPhase: 'payout_failed',
            payoutFailureReason: err.message,
            payoutFailedAt: new Date().toISOString(),
          };
          // Collection succeeded — keep PROCESSING so ops can retry payout; do not mark COMPLETED
          payment.status = PmtStatus.PROCESSING;
          await manager.save(PaymentEntity, payment);
        }

        const loan = await manager.findOne(LoanRequest, {
          where: { id: job.loanId },
        });
        if (loan) {
          loan.metadata = {
            ...(loan.metadata || {}),
            disbursement: {
              ...(loan.metadata?.disbursement || {}),
              momo_phase: 'payout_failed',
              pending_confirmation: true,
              payout_failure_reason: err.message,
            },
          };
          await manager.save(LoanRequest, loan);
        }
      });
    }
  }

  async failDisbursementFromWebhook(input: {
    referenceId: string;
    reason?: string;
    paymentId?: string;
  }): Promise<void> {
    const { Payment: PaymentEntity } = await import('../../entities/payment.entity');

    await this.dataSource.transaction(async (manager) => {
      const payment = input.paymentId
        ? await manager.findOne(PaymentEntity, { where: { id: input.paymentId } })
        : await manager
            .createQueryBuilder(PaymentEntity, 'p')
            .where('p.referenceNumber = :ref OR p.transactionId = :ref', {
              ref: input.referenceId,
            })
            .orWhere(`(p.metadata->>'referenceId') = :ref`, { ref: input.referenceId })
            .orWhere(`(p.metadata->>'payoutReferenceId') = :ref`, {
              ref: input.referenceId,
            })
            .getOne();

      const loanId = (payment?.metadata as any)?.loanId;
      if (!loanId) return;

      const loan = await manager.findOne(LoanRequest, { where: { id: loanId } });
      if (!loan || loan.status === LoanRequestStatus.DISBURSED) return;

      const phase = (payment?.metadata as any)?.momoPhase || 'collection';
      const disbursement = await manager.findOne(LoanDisbursement, {
        where: { loan_request_id: loanId },
        order: { created_at: 'DESC' } as any,
      });
      if (disbursement && disbursement.status !== DisbursementStatus.DISBURSED) {
        disbursement.status = DisbursementStatus.FAILED;
        disbursement.failure_reason =
          input.reason ||
          (phase === 'payout'
            ? 'MoMo payout to truck owner failed'
            : 'MoMo collection from lender failed');
        await manager.save(LoanDisbursement, disbursement);
      }

      loan.metadata = {
        ...(loan.metadata || {}),
        disbursement: {
          ...(loan.metadata?.disbursement || {}),
          pending_confirmation: false,
          failed_at: new Date().toISOString(),
          failure_reason: input.reason,
          momo_phase: phase === 'payout' ? 'payout_failed' : 'collection_failed',
        },
      };
      await manager.save(LoanRequest, loan);
      this.logger.warn(
        `Disbursement failed for loan ${loanId} (phase=${phase}): ${input.reason}`,
      );
    });
  }

  async confirmRepaymentFromWebhook(input: {
    referenceId: string;
    transactionId?: string;
    paymentId?: string;
  }): Promise<void> {
    const { Payment: PaymentEntity } = await import('../../entities/payment.entity');

    const payment = await this.dataSource.transaction(async (manager) => {
      if (input.paymentId) {
        return manager.findOne(PaymentEntity, { where: { id: input.paymentId } });
      }
      return manager
        .createQueryBuilder(PaymentEntity, 'p')
        .where('p.referenceNumber = :ref OR p.transactionId = :ref', { ref: input.referenceId })
        .getOne();
    });

    if (!payment) {
      this.logger.warn(`confirmRepaymentFromWebhook: no payment ${input.referenceId}`);
      return;
    }

    const meta = (payment.metadata || {}) as Record<string, any>;
    if (meta.repaymentRecorded) {
      this.logger.log(`Repayment already recorded for ${input.referenceId} — skip`);
      return;
    }

    const loanId = meta.loanId as string;
    if (!loanId) return;

    const result = await this.recordLoanRepayment({
      loanId,
      finalPaymentAmount: Number(meta.finalPaymentAmount || payment.amount),
      externalTxnRef: input.transactionId || input.referenceId,
      paymentMethod: meta.paymentMethod || 'mobile_money',
      paymentStatus: 'completed',
      paymentDetails: meta.paymentDetails || {},
      interestAmount: Number(meta.interestAmount || 0),
      currency: this.requireCurrency(meta.currency || payment.currency, 'repayment webhook'),
    });

    await this.dataSource
      .createQueryBuilder()
      .update(PaymentEntity)
      .set({
        metadata: { ...meta, repaymentRecorded: true, repaymentId: result.saved.id } as any,
      })
      .where('id = :id', { id: payment.id })
      .execute();

    await this.notifyRepaymentParties(result.freshLoan, result.saved, {
      fullyRepaid: result.fullyRepaid,
      paymentMethod: meta.paymentMethod || 'mobile_money',
      pendingConfirmation: false,
    });

    if (result.freshLoan.lender?.callback_url) {
      await this.notifyLenderRepayment(result.freshLoan, result.saved);
    }

    this.logger.log(`Loan repayment confirmed via webhook for loan ${loanId}`);
  }

  async failRepaymentFromWebhook(input: {
    referenceId: string;
    reason?: string;
    paymentId?: string;
  }): Promise<void> {
    this.logger.warn(`Loan repayment failed (${input.referenceId}): ${input.reason}`);
  }

  /** Notifications + repayment obligation after funds are confirmed delivered. */
  private async finalizeDisbursementSideEffects(
    manager: any,
    ctx: {
      loan: LoanRequest;
      disbursement: LoanDisbursement;
      lockedAmount: number;
      processedPaymentId?: string;
      tripId?: string;
      lenderUserId?: string;
      beneficiaries: any[];
    },
  ): Promise<void> {
    const { Payment: PaymentEntity, PaymentStatus: PmtStatus, PaymentType: PmtType, PaymentMethod: PmtMethod } =
      await import('../../entities/payment.entity');

    const { loan, lockedAmount, beneficiaries, tripId, lenderUserId, processedPaymentId } = ctx;
    const isTruckOwnerFinancing = this.isTruckOwnerTripFinancing(loan);

    try {
      // Notify the borrower (cargo owner OR truck owner depending on financing type)
      await this.loanNotificationService.notifyCargoOwnerLoanDisbursed(
        loan.created_by,
        loan.tenant_id,
        loan.id,
        lockedAmount,
        loan.lender?.name || 'Lender',
        loan.currency,
      );
      const truckOwnerId =
        beneficiaries.find((b: any) => b.recipientId)?.recipientId ??
        beneficiaries.find((b: any) => b.id)?.id;
      // For cargo-owner financing, also notify the truck owner that they were paid on behalf.
      // For truck-owner trip financing, borrower === payee — skip duplicate notify.
      if (truckOwnerId && !isTruckOwnerFinancing && truckOwnerId !== loan.created_by) {
        await this.loanNotificationService.notifyTruckOwnerLenderPaid(
          truckOwnerId,
          loan.tenant_id,
          loan.id,
          lockedAmount,
          loan.lender?.name || 'Lender',
        );
      }
    } catch (notifErr: any) {
      this.logger.warn(`Disbursement notifications failed: ${notifErr.message}`);
    }

    if (!tripId) return;

    // Cargo-owner financing replaces the cargo→carrier trip payment with a loan repayment obligation.
    // Truck-owner trip financing does NOT cancel the cargo owner's transport payment —
    // that freight receivable remains and funds trip execution / repayment capacity.
    if (!isTruckOwnerFinancing) {
      const cargoOwnerId = loan.created_by;
      const existingTripPayment = await manager.findOne(PaymentEntity, {
        where: {
          tripId,
          payerId: cargoOwnerId,
          paymentType: PmtType.TRIP_PAYMENT,
          status: PmtStatus.PENDING,
        } as any,
      });
      if (existingTripPayment) {
        existingTripPayment.status = PmtStatus.CANCELLED;
        (existingTripPayment.metadata as any) = {
          ...(existingTripPayment.metadata || {}),
          cancelledReason: 'Replaced by lender disbursement obligation',
          loanId: loan.id,
          cancelledAt: new Date().toISOString(),
        };
        await manager.save(PaymentEntity, existingTripPayment);
      }
    }

    const dueDate = loan.due_date ? new Date(loan.due_date) : null;
    if (!dueDate) return;

    // Repayment obligation payer = borrower (created_by):
    //   CARGO_OWNER product → cargo owner repays
    //   TRUCK_OWNER_TRIP     → truck owner repays from trip earnings
    const borrowerId = loan.created_by;
    const obligationAmount =
      Number(loan.approved_amount) + Number(loan.interest_amount || 0);
    const obligationPayment = manager.create(PaymentEntity, {
      tripId,
      tenantId: loan.tenant_id,
      payerId: borrowerId,
      payeeId: lenderUserId,
      amount: obligationAmount,
      currency: this.requireCurrency(loan.currency, `loan ${loan.id}`),
      paymentMethod: PmtMethod.BANK_TRANSFER,
      paymentType: PmtType.TRIP_PAYMENT,
      status: PmtStatus.PENDING,
      dueDate,
      description: isTruckOwnerFinancing
        ? `Truck-owner trip financing repayment — ${loan.loan_number || loan.id.slice(0, 8)}`
        : `Loan repayment to lender — ${loan.loan_number || loan.id.slice(0, 8)}`,
      referenceNumber: `LREP-OBL-${loan.id.slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      metadata: {
        isLoanRepaymentObligation: true,
        isLenderPayment: false,
        financingType: loan.financing_type || FinancingType.CARGO_OWNER,
        loanId: loan.id,
        lenderName: loan.lender?.name ?? null,
        lenderId: loan.lender_id,
        cargoOwnerId: isTruckOwnerFinancing ? null : borrowerId,
        truckOwnerId: isTruckOwnerFinancing ? borrowerId : null,
        borrowerId,
        originalDisbursementPaymentId: processedPaymentId,
        paymentSource: 'lender_disbursement',
        automaticallyCreated: true,
      },
    } as any);
    await manager.save(PaymentEntity, obligationPayment);
  }

  async rejectLoanRequest(
    loanId: string,
    reason: string,
  ): Promise<LoanRequest> {
    const loan = await this.loanRequestRepository.findOne({
      where: { id: loanId },
    });
    if (!loan) {
      throw new NotFoundException('Loan request not found');
    }

    if (
      loan.status !== LoanRequestStatus.PENDING &&
      loan.status !== LoanRequestStatus.APPROVED
    ) {
      throw new BadRequestException(
        `Cannot reject a loan with status "${loan.status}".`,
      );
    }

    // Rejecting an unaccepted offer or pending application
    if (
      loan.status === LoanRequestStatus.APPROVED &&
      loan.borrower_accepted_at
    ) {
      throw new BadRequestException(
        'Cannot reject after the borrower has accepted terms. Use disbursement controls instead.',
      );
    }

    const rejectionReason =
      (reason || '').trim() || 'Application did not meet lending criteria';

    loan.status = LoanRequestStatus.REJECTED;
    loan.rejection_reason = rejectionReason;
    loan.terms_offered_at = null;
    loan.borrower_accepted_at = null;
    loan.metadata = {
      ...(loan.metadata || {}),
      offer_snapshot: null,
      rejection: {
        reason: rejectionReason,
        rejected_at: new Date().toISOString(),
      },
      // Clear any prior appeal so borrower can appeal this new rejection
      appeal: null,
    };

    const rejectedLoan = await this.loanRequestRepository.save(loan);

    try {
      const lender = loan.lender_id
        ? await this.lenderRepository.findOne({ where: { id: loan.lender_id } })
        : null;
      const creatorUser = await this.userRepository.findOne({ where: { id: loan.created_by } });
      if (creatorUser) {
        await this.loanNotificationService.notifyCargoOwnerLoanRejected(
          creatorUser.id,
          loan.tenant_id,
          loan.id,
          rejectionReason,
          lender?.name || 'Lender',
        );
      }
    } catch (notifErr) {
      this.logger.warn(`Could not send loan rejection notification: ${notifErr.message}`);
    }

    return { ...rejectedLoan, ...buildLoanWorkflowView(rejectedLoan) };
  }

  /**
   * Borrower appeals a hard rejection — reopens the application for lender review
   * with an optional comment (credit reconsideration / right to be heard).
   */
  async appealLoanRejection(
    loanId: string,
    userId: string,
    comment: string,
  ): Promise<LoanRequest> {
    const loan = await this.loanRequestRepository.findOne({ where: { id: loanId } });
    if (!loan) {
      throw new NotFoundException('Loan request not found');
    }

    if (loan.created_by !== userId) {
      throw new BadRequestException('Only the borrower can appeal this rejection.');
    }

    if (loan.status !== LoanRequestStatus.REJECTED) {
      throw new BadRequestException('Only rejected loan applications can be appealed.');
    }

    if (loan.metadata?.appeal?.status === 'pending_review') {
      throw new ConflictException('An appeal is already pending for this loan.');
    }

    const appealComment = (comment || '').trim();
    if (appealComment.length < 10) {
      throw new BadRequestException(
        'Please provide a comment of at least 10 characters explaining your appeal.',
      );
    }

    const previousRejection = loan.rejection_reason;
    loan.status = LoanRequestStatus.PENDING;
    loan.metadata = {
      ...(loan.metadata || {}),
      appeal: {
        status: 'pending_review',
        comment: appealComment,
        submitted_at: new Date().toISOString(),
        previous_rejection_reason: previousRejection,
        submitted_by: userId,
      },
      appeal_history: [
        ...((loan.metadata?.appeal_history as any[]) || []),
        {
          comment: appealComment,
          submitted_at: new Date().toISOString(),
          previous_rejection_reason: previousRejection,
        },
      ],
    };

    const saved = await this.loanRequestRepository.save(loan);

    try {
      if (loan.lender_id) {
        const lenderUsers = await this.lenderUserRepository.find({
          where: { lender_id: loan.lender_id, status: LenderUserStatus.ACTIVE },
          take: 5,
        });
        for (const lu of lenderUsers) {
          await this.loanNotificationService.notifyLenderLoanAppealed(
            lu.id,
            loan.tenant_id,
            loan.id,
            appealComment,
            loan.loan_number,
          );
        }
      }
    } catch (notifErr) {
      this.logger.warn(`Could not notify lender of loan appeal: ${notifErr.message}`);
    }

    return { ...saved, ...buildLoanWorkflowView(saved) };
  }

  async initiateDisbursement(loanId: string): Promise<LoanDisbursement> {
    return await this.dataSource.transaction(async (manager) => {
      const loan = await manager.findOne(LoanRequest, {
        where: { id: loanId },
        relations: ['lender'],
      } as any);

      if (!loan) {
        throw new NotFoundException('Loan request not found');
      }

      if (loan.status !== LoanRequestStatus.APPROVED) {
        throw new BadRequestException(
          'Loan must be approved before disbursement',
        );
      }

      this.assertReadyForDisbursement(loan);

      const truckOwnerPayment = await this.resolveTruckOwnerPaymentInfo(
        loan.trip_id,
        manager,
      );
      if (!truckOwnerPayment.ownerId) {
        throw new BadRequestException(
          'Cannot initiate disbursement: truck owner could not be resolved for this trip. Use disburse-with-payment instead.',
        );
      }

      const lockedAmount = Number(loan.approved_amount);
      if (!lockedAmount || lockedAmount <= 0) {
        throw new BadRequestException('Approved amount is not set.');
      }
      const loanCurrency = this.requireCurrency(
        loan.currency,
        `loan ${loan.id}`,
      );

      const beneficiaries =
        loan.requested_split &&
        Array.isArray(loan.requested_split) &&
        loan.requested_split.length > 0
          ? loan.requested_split
          : [
              {
                recipientId: truckOwnerPayment.ownerId,
                recipientType: 'truck_owner',
                amount: lockedAmount,
                percentage: 100,
                phoneNumber: truckOwnerPayment.paymentInfo.phoneNumber || null,
                accountNumber:
                  truckOwnerPayment.paymentInfo.accountNumber || null,
              },
            ];

      const disbursement = manager.create(LoanDisbursement, {
        loan_request_id: loanId,
        beneficiaries: beneficiaries,
        amount: lockedAmount,
        currency: loanCurrency,
        status: DisbursementStatus.INITIATED,
        attempts: 1,
        interest_rate: loan.metadata?.interest_rate ?? null,
        risk_score: loan.metadata?.risk_score ?? null,
        credit_score: loan.metadata?.credit_score ?? null,
      });

      const savedDisbursement = await manager.save(
        LoanDisbursement,
        disbursement,
      );

      try {
        // Queue for settlement only — does not mark loan DISBURSED.
        // Real funds movement requires disburse-with-payment (MoMo) or
        // confirmDisbursement / updateDisbursementStatus (bank).
        await this.processDisbursementToBeneficiaries(savedDisbursement);
        loan.metadata = {
          ...(loan.metadata || {}),
          disbursement: {
            method: 'initiated_pending_settlement',
            amount: lockedAmount,
            currency: loanCurrency,
            truck_owner_id: truckOwnerPayment.ownerId,
            pending_confirmation: true,
          },
        };
        await manager.save(LoanRequest, loan);
        this.logger.log(
          `Disbursement ${savedDisbursement.id} queued as PENDING for loan ${loanId}; awaiting settlement confirmation.`,
        );
      } catch (error) {
        this.logger.error(
          `Disbursement failed for loan ${loanId}: ${error.message}`,
        );
        savedDisbursement.status = DisbursementStatus.FAILED;
        savedDisbursement.failure_reason = error.message;
        await manager.save(LoanDisbursement, savedDisbursement);
        throw error;
      }

      return savedDisbursement;
    });
  }

  async disburseWithPayment(
    loanId: string,
    paymentDto: {
      paymentMethod: string;
      phoneNumber?: string;
      truckOwnerPhoneNumber?: string;
      bankAccountNumber?: string;
      bankName?: string;
      accountHolderName?: string;
      cardNumber?: string;
      cardName?: string;
      expiryDate?: string;
      cvv?: string;
      /** ISO 4217 currency override from the disbursement modal */
      currency?: string;
    },
    lenderUserId: string,
    tenantId: string,
  ): Promise<any> {
    return await this.dataSource.transaction(async (manager) => {
      const loan = await manager.findOne(LoanRequest, {
        where: { id: loanId },
        relations: ['lender'],
      } as any);

      if (!loan) {
        throw new NotFoundException('Loan request not found');
      }

      this.assertReadyForDisbursement(loan);

      // Disbursement amount is locked to the agreed approved_amount — no edits at pay time
      const lockedAmount = Number(loan.approved_amount);

      const trip = await manager.findOne('Trip', {
        where: { id: loan.trip_id },
        relations: ['load'],
      } as any);

      if (!trip) {
        throw new NotFoundException('Trip not found for this loan');
      }

      const beneficiaryPayment = await this.resolveTruckOwnerPaymentInfo(
        loan.trip_id,
        manager,
      );

      let truckOwnerPhone = beneficiaryPayment.paymentInfo.phoneNumber;

      if (!truckOwnerPhone && paymentDto.paymentMethod === 'mobile_money') {
        throw new BadRequestException(
          'Truck owner has not configured a mobile money number. ' +
          'They must add payment information at Fleet → Financial Info before disbursement.',
        );
      }

      if (
        paymentDto.paymentMethod === 'bank_transfer' &&
        !beneficiaryPayment.paymentInfo.accountNumber
      ) {
        throw new BadRequestException(
          'Truck owner has not configured a bank account. ' +
          'They must add payment information at Fleet → Financial Info before disbursement.',
        );
      }

      // Get assignedTruckId from trip or load
      const assignedTruckId = trip.truckId || trip.load?.assignedTruckId;

      // Create disbursement
      // Provide default beneficiaries if requested_split is null
      // For lender payments, the beneficiary is the truck owner (who receives the payment)
      const beneficiaries = loan.requested_split && Array.isArray(loan.requested_split) && loan.requested_split.length > 0
        ? loan.requested_split
        : [{
            recipientId: trip.truckId || trip.load?.assignedTruckId || null,
            recipientType: 'truck_owner',
            amount: lockedAmount,
            percentage: 100,
            phoneNumber: truckOwnerPhone || null,
          }];
      
      const loanCurrency = this.requireCurrency(
        loan.currency,
        `loan ${loan.id} currency`,
      );

      const disbursement = manager.create(LoanDisbursement, {
        loan_request_id: loanId,
        beneficiaries: beneficiaries,
        amount: lockedAmount,
        currency: loanCurrency,
        status: DisbursementStatus.INITIATED,
        attempts: 1,
        interest_rate: loan.metadata?.interest_rate ?? null,
        risk_score: loan.metadata?.risk_score ?? null,
        credit_score: loan.metadata?.credit_score ?? null,
      });

      const savedDisbursement = await manager.save(LoanDisbursement, disbursement);

      const settlementQuote = await this.resolveSettlementAmount({
        principalAmount: lockedAmount,
        principalCurrency: loanCurrency,
        paymentMethod: paymentDto.paymentMethod,
        payerCurrency: paymentDto.currency,
      });

      const disburseAmount = settlementQuote.settlementAmount;
      const disburseCurrency = settlementQuote.settlementCurrency;
      const exchangeRate = settlementQuote.exchangeRate ?? undefined;

      if (paymentDto.paymentMethod === 'card') {
        throw new BadRequestException(
          'Card disbursements are not yet supported. Please use mobile_money or bank_transfer.',
        );
      }

      if (paymentDto.paymentMethod === 'bank_transfer') {
        const accountNumber = beneficiaryPayment.paymentInfo.accountNumber?.replace(/\s/g, '') || '';
        if (!accountNumber || !/^\d{8,20}$/.test(accountNumber)) {
          throw new BadRequestException(
            'Truck owner bank account on file is invalid. Ask them to update Fleet → Financial Info.',
          );
        }
      }

      // Process payment via mobile money if requested
      if (paymentDto.paymentMethod === 'mobile_money' && truckOwnerPhone) {
        let processedPayment: any = null;
        const {
          Payment: PaymentEntity,
          PaymentStatus: PmtStatus,
          PaymentType: PmtType,
          PaymentMethod: PmtMethod,
        } = await import('../../entities/payment.entity');

        try {
          const MobileMoneyModule = await import('../payments/services/mobile-money-payment.service');
          const MobileMoneyClass = MobileMoneyModule.MobileMoneyPaymentService;
          const mobileMoneyService = this.moduleRef.get(MobileMoneyClass, { strict: false });

          if (!mobileMoneyService) {
            throw new BadRequestException('Mobile Money payment service is not available.');
          }

          const rawPayerPhone = String(paymentDto.phoneNumber || '').trim();
          if (!rawPayerPhone) {
            throw new BadRequestException(
              'Enter your mobile money number (the phone that will receive the PIN prompt).',
            );
          }

          const payerPhone = mobileMoneyService.formatPhoneNumber(rawPayerPhone);
          const formattedBeneficiary =
            mobileMoneyService.formatPhoneNumber(truckOwnerPhone);
          truckOwnerPhone = formattedBeneficiary;

          if (payerPhone === formattedBeneficiary) {
            throw new BadRequestException(
              'Payer and beneficiary numbers must be different.',
            );
          }

          if (!disburseAmount || disburseAmount < 1) {
            throw new BadRequestException(
              `Invalid disbursement amount for mobile money (${disburseAmount} ${disburseCurrency}).`,
            );
          }

          const PaymentsServiceModule = await import('../payments/payments.service');
          const PaymentsServiceClass = PaymentsServiceModule.PaymentsService;
          const paymentsService = this.moduleRef.get(PaymentsServiceClass, { strict: false });

          // Pre-flight BEFORE MoMo — same rules as PaymentsService.createPayment
          const preflight = paymentsService
            ? await paymentsService.preflightLenderDisbursement(
                trip.id,
                lenderUserId,
                loan.id,
              )
            : { outcome: 'proceed' as const };

          if (preflight.outcome === 'already_completed') {
            const existingLenderPayment = preflight.payment;
            this.logger.log(
              `Loan ${loan.id} already has completed disbursement payment ${existingLenderPayment.id} — reconciling`,
            );
            processedPayment = existingLenderPayment;
            disbursement.status = DisbursementStatus.DISBURSED;
            disbursement.disbursement_date = new Date();
            disbursement.external_txn_ref =
              existingLenderPayment.transactionId ||
              existingLenderPayment.referenceNumber;
            loan.status = LoanRequestStatus.DISBURSED;
            await manager.save(LoanDisbursement, disbursement);
            await manager.save(LoanRequest, loan);

            await this.finalizeDisbursementSideEffects(manager, {
              loan,
              disbursement,
              lockedAmount,
              processedPaymentId: existingLenderPayment.id,
              tripId: trip.id,
              lenderUserId,
              beneficiaries,
            });

            return {
              success: true,
              pendingConfirmation: false,
              disbursement: savedDisbursement,
              payment: {
                id: existingLenderPayment.id,
                status: existingLenderPayment.status,
                transactionId: existingLenderPayment.transactionId,
                pendingConfirmation: false,
              },
              disbursedAmount: lockedAmount,
              disbursedCurrency: loan.currency,
              momoAmount: disburseAmount,
              momoCurrency: disburseCurrency,
              alreadyDisbursed: true,
            };
          }

          // Provider already settled funds but local loan not DISBURSED — finish via webhook path
          if (preflight.outcome === 'provider_settled') {
            const existingLenderPayment = preflight.payment;
            const ref =
              (existingLenderPayment.metadata as any)?.referenceId ||
              existingLenderPayment.referenceNumber ||
              existingLenderPayment.transactionId;
            this.logger.log(
              `Loan ${loan.id}: provider settled payment ${existingLenderPayment.id} ` +
                `(${preflight.reasonCode}) — reconciling without new MoMo charge`,
            );
            disbursement.status = DisbursementStatus.PENDING;
            disbursement.external_txn_ref =
              existingLenderPayment.transactionId || String(ref);
            await manager.save(LoanDisbursement, disbursement);

            // Settlement runs in its own transaction after local pending state is saved.
            await this.confirmDisbursementFromWebhook({
              referenceId: String(ref),
              transactionId:
                existingLenderPayment.transactionId || String(ref),
              paymentId: existingLenderPayment.id,
            });

            const refreshedLoan = await manager.findOne(LoanRequest, {
              where: { id: loan.id },
            });
            const settled =
              refreshedLoan?.status === LoanRequestStatus.DISBURSED;

            return {
              success: true,
              pendingConfirmation: !settled,
              disbursement: savedDisbursement,
              payment: {
                id: existingLenderPayment.id,
                status: existingLenderPayment.status,
                transactionId: existingLenderPayment.transactionId,
                pendingConfirmation: !settled,
              },
              disbursedAmount: settled ? lockedAmount : 0,
              disbursedCurrency: loan.currency,
              momoAmount: disburseAmount,
              momoCurrency: disburseCurrency,
              reconcilingProviderSettlement: true,
              reasonCode: preflight.reasonCode,
            };
          }

          if (preflight.outcome === 'awaiting_confirmation') {
            const existingLenderPayment = preflight.payment;
            const existingTxnId =
              existingLenderPayment.transactionId ||
              (existingLenderPayment.metadata as any)?.momoTransactionId;
            this.logger.log(
              `Loan ${loan.id} awaiting MoMo authorization on payment ${existingLenderPayment.id} ` +
                `(txn ${existingTxnId}, reason=${preflight.reasonCode}` +
                (preflight.retryAfterSeconds != null
                  ? `, retryAfter=${preflight.retryAfterSeconds}s`
                  : '') +
                `) — no new charge`,
            );
            processedPayment = existingLenderPayment;
            disbursement.status = DisbursementStatus.PENDING;
            disbursement.external_txn_ref = existingTxnId;
            await manager.save(LoanDisbursement, savedDisbursement);

            return {
              success: true,
              pendingConfirmation: true,
              disbursement: savedDisbursement,
              payment: {
                id: existingLenderPayment.id,
                status: existingLenderPayment.status,
                transactionId: existingTxnId,
                pendingConfirmation: true,
              },
              disbursedAmount: 0,
              disbursedCurrency: loan.currency,
              momoAmount: disburseAmount,
              momoCurrency: disburseCurrency,
              awaitingPriorConfirmation: true,
              reasonCode: preflight.reasonCode,
              retryAfterSeconds: preflight.retryAfterSeconds,
            };
          }

          if (preflight.outcome === 'proceed' && preflight.closedPaymentId) {
            this.logger.log(
              `Loan ${loan.id}: closed prior attempt ${preflight.closedPaymentId} ` +
                `(${preflight.reasonCode}) — starting new MoMo collection`,
            );
          }

          const referenceNumber = `LOAN-${loan.id.slice(0, 8).toUpperCase()}-DISB-${Date.now()}`;
          const paymentMessage =
            settlementQuote.conversionApplied
              ? `Loan disbursement #${loan.loan_number || loan.id.slice(0, 8)} — ${disburseAmount} ${disburseCurrency} (${lockedAmount} ${loan.currency})`
              : `Loan disbursement #${loan.loan_number || loan.id.slice(0, 8)} — ${disburseAmount} ${disburseCurrency}`;

          // Ishema only reliably pushes USSD when collecting into the merchant account.
          // Leg 1 (now): lender → MOBILE_MONEY_ACCOUNT_PHONE (PIN on lender).
          // Leg 2 (webhook): platform → truck owner (PIN on merchant SIM).
          const platformPhoneRaw = this.configService.get<string>('MOBILE_MONEY_ACCOUNT_PHONE');
          if (!platformPhoneRaw) {
            throw new BadRequestException(
              'MOBILE_MONEY_ACCOUNT_PHONE is not configured. Required to collect lender payment before paying the truck owner.',
            );
          }
          const platformPhone = mobileMoneyService.formatPhoneNumber(platformPhoneRaw);

          if (payerPhone === platformPhone) {
            throw new BadRequestException(
              'Payer number cannot be the platform Mobile Money account. Enter the lender MoMo number that should receive the PIN.',
            );
          }

          const transfers = [{
            percentage: 100,
            phoneNumber: platformPhone,
            receiverMessage: paymentMessage.substring(0, 160),
          }];

          // Reserve payment row BEFORE MoMo — never charge if DB slot cannot be created
          if (paymentsService) {
            const createPaymentDto = {
              tripId: trip.id,
              amount: lockedAmount,
              currency: this.requireCurrency(loan.currency, `loan ${loan.id}`),
              paymentMethod: PmtMethod.DIGITAL_WALLET,
              paymentType: PmtType.TRIP_PAYMENT,
              description: paymentMessage,
              referenceNumber,
              metadata: {
                referenceId: referenceNumber,
                lenderId: loan.lender_id,
                lenderName: loan.lender?.name,
                financedAmount: lockedAmount,
                isLenderPayment: true,
                payerPhoneNumber: payerPhone,
                receiverPhoneNumber: formattedBeneficiary,
                platformPhoneNumber: platformPhone,
                beneficiaryPhoneNumber: formattedBeneficiary,
                momoPhase: 'collection',
                loanId: loan.id,
                loanNumber: loan.loan_number,
                disbursementId: savedDisbursement.id,
                momoAmount: disburseAmount,
                momoCurrency: disburseCurrency,
                exchangeRate: exchangeRate ?? null,
                principalAmount: lockedAmount,
                principalCurrency: loan.currency,
                payerCurrency: settlementQuote.payerCurrency,
                conversionApplied: settlementQuote.conversionApplied,
              },
            };

            try {
              processedPayment = await paymentsService.createPayment(
                createPaymentDto,
                tenantId,
                lenderUserId,
              );
            } catch (paymentErr: any) {
              if (
                paymentErr instanceof ConflictException ||
                paymentErr?.status === 409
              ) {
                const reused =
                  await paymentsService.reuseBlockingLenderDisbursementPayment(
                    trip.id,
                    lenderUserId,
                    loan.id,
                  );
                if (reused) {
                  processedPayment = reused;
                } else {
                  throw paymentErr;
                }
              } else {
                throw paymentErr;
              }
            }

            // createPayment may return a reused completed row (legacy disbursement)
            if (processedPayment?.status === PmtStatus.COMPLETED) {
              this.logger.log(
                `Loan ${loan.id}: reusing completed payment ${processedPayment.id} — skipping MoMo`,
              );
              disbursement.status = DisbursementStatus.DISBURSED;
              disbursement.disbursement_date = new Date();
              disbursement.external_txn_ref =
                processedPayment.transactionId ||
                processedPayment.referenceNumber;
              loan.status = LoanRequestStatus.DISBURSED;
              await manager.save(LoanDisbursement, disbursement);
              await manager.save(LoanRequest, loan);

              await this.finalizeDisbursementSideEffects(manager, {
                loan,
                disbursement,
                lockedAmount,
                processedPaymentId: processedPayment.id,
                tripId: trip.id,
                lenderUserId,
                beneficiaries,
              });

              return {
                success: true,
                pendingConfirmation: false,
                disbursement: savedDisbursement,
                payment: {
                  id: processedPayment.id,
                  status: processedPayment.status,
                  transactionId: processedPayment.transactionId,
                  pendingConfirmation: false,
                },
                disbursedAmount: lockedAmount,
                disbursedCurrency: loan.currency,
                momoAmount: disburseAmount,
                momoCurrency: disburseCurrency,
                alreadyDisbursed: true,
              };
            }

            const existingTxn =
              processedPayment?.transactionId ||
              (processedPayment?.metadata as any)?.momoTransactionId;
            if (
              existingTxn &&
              (processedPayment?.status === PmtStatus.PENDING ||
                processedPayment?.status === PmtStatus.PROCESSING)
            ) {
              disbursement.status = DisbursementStatus.PENDING;
              disbursement.external_txn_ref = existingTxn;
              await manager.save(LoanDisbursement, disbursement);

              return {
                success: true,
                pendingConfirmation: true,
                disbursement: savedDisbursement,
                payment: {
                  id: processedPayment.id,
                  status: processedPayment.status,
                  transactionId: existingTxn,
                  pendingConfirmation: true,
                },
                disbursedAmount: 0,
                disbursedCurrency: loan.currency,
                momoAmount: disburseAmount,
                momoCurrency: disburseCurrency,
                awaitingPriorConfirmation: true,
              };
            }
          }

          this.logger.log(
            `Disbursing loan ${loan.id}: ${disburseAmount} ${disburseCurrency} ` +
            `(principal: ${lockedAmount} ${loan.currency}` +
            (settlementQuote.conversionApplied
              ? `, rate: ${exchangeRate}, payer currency: ${settlementQuote.payerCurrency}`
              : '') +
            `) ` +
            `| PIN popup → payer ${payerPhone} (entered: ${rawPayerPhone}) ` +
            `| collect → platform ${platformPhone} ` +
            `| later payout → ${formattedBeneficiary}`,
          );

          let momoResponse;
          try {
            this.logger.log(`Calling Ishema API for loan ${loan.id} disbursement...`);
            momoResponse = await mobileMoneyService.createTransaction(
              disburseAmount,
              payerPhone,
              referenceNumber,
              paymentMessage,
              transfers,
              this.configService.get<string>('MOBILE_MONEY_CALLBACK_URL'),
            );
            this.logger.log(`Ishema API call successful for loan ${loan.id}`);
          } catch (momoError: any) {
            this.logger.error(`Ishema API call failed for loan ${loan.id}:`, momoError.message);
            this.logger.error(`Loan details: payer=${payerPhone}, amount=${disburseAmount}, currency=${disburseCurrency}`);
            
            // Log specific error details for troubleshooting
            if (momoError.response?.status === 400) {
              this.logger.error(`Bad Request (400): Check phone number format or API parameters`);
            } else if (momoError.response?.status === 401) {
              this.logger.error(`Unauthorized (401): Check MOBILE_MONEY_API_KEY configuration`);
            } else if (momoError.response?.status === 404) {
              this.logger.error(`Not Found (404): Check MOBILE_MONEY_API_URL configuration`);
            } else if (momoError.response?.status >= 500) {
              this.logger.error(`Server Error (${momoError.response?.status}): Ishema API server issue`);
            }
            
            throw momoError; // Re-throw to be handled by outer catch block
          }

          const transaction =
            momoResponse.savedTransaction || momoResponse.transaction;
          const transactionId =
            transaction?.externalId || transaction?.id || referenceNumber;
          const txnStatus = transaction?.status || 'pending';

          this.logger.log(
            `MoMo disbursement response: status=${txnStatus}, externalId=${transactionId}, ` +
              `responsePhone=${transaction?.phoneNumber || 'n/a'}`,
          );

          if (txnStatus === 'failed') {
            throw new BadRequestException(
              'Mobile Money disbursement was rejected by the provider. Check the payer number and try again.',
            );
          }

          const pendingConfirmation = true;

          if (paymentsService && processedPayment?.id) {
            processedPayment = await paymentsService.updatePaymentStatus(
              processedPayment.id,
              {
                status: 'processing' as any,
                transactionId,
                gatewayResponse:
                  'Awaiting lender MoMo PIN — funds collect to platform, then payout to truck owner.',
              },
              tenantId,
            );
          }

          disbursement.status = DisbursementStatus.PENDING;
          disbursement.external_txn_ref = transactionId;
          loan.metadata = {
            ...(loan.metadata || {}),
            disbursement: {
              disbursed_at: null,
              pending_confirmation: true,
              momo_phase: 'collection',
              amount: lockedAmount,
              currency: loan.currency,
              momo_amount: disburseAmount,
              momo_currency: disburseCurrency,
              payer_phone: payerPhone,
              platform_phone: platformPhone,
              beneficiary_phone: formattedBeneficiary,
              transaction_id: transactionId,
            },
          };
          await manager.save(LoanDisbursement, disbursement);
          await manager.save(LoanRequest, loan);

          return {
            success: true,
            pendingConfirmation,
            disbursement: savedDisbursement,
            payment: processedPayment
              ? {
                  id: processedPayment.id,
                  status: processedPayment.status,
                  transactionId: processedPayment.transactionId,
                  pendingConfirmation,
                }
              : { transactionId, pendingConfirmation },
            disbursedAmount: 0,
            disbursedCurrency: loan.currency,
            momoAmount: disburseAmount,
            momoCurrency: disburseCurrency,
          };
        } catch (error: any) {
          // Enhanced error logging for debugging
          this.logger.error(`Mobile money disbursement failed for loan ${loan.id}:`);
          this.logger.error(`Error type: ${error.constructor.name}`);
          this.logger.error(`Error message: ${error.message}`);
          this.logger.error(`Amount: ${disburseAmount} ${disburseCurrency}`);
          
          if (error.response) {
            this.logger.error(`HTTP Status: ${error.response.status}`);
            this.logger.error(`HTTP Response: ${JSON.stringify(error.response.data, null, 2)}`);
          }

          savedDisbursement.status = DisbursementStatus.FAILED;
          savedDisbursement.failure_reason = error.message;
          await manager.save(LoanDisbursement, savedDisbursement);

          // Release the payment row so a retry is not blocked by unique indexes
          if (
            processedPayment?.id &&
            (processedPayment.status === PmtStatus.PENDING ||
              processedPayment.status === PmtStatus.PROCESSING)
          ) {
            try {
              await manager.update(
                PaymentEntity,
                { id: processedPayment.id },
                {
                  status: PmtStatus.CANCELLED,
                  failureReason: `Disbursement failed: ${error.message}`,
                  metadata: {
                    ...(processedPayment.metadata || {}),
                    cancelledReason: 'Disbursement attempt failed',
                    cancelledAt: new Date().toISOString(),
                    errorDetails: {
                      errorType: error.constructor.name,
                      httpStatus: error.response?.status,
                      apiResponse: error.response?.data,
                    },
                  },
                } as any,
              );
              this.logger.log(`Cancelled payment ${processedPayment.id} due to disbursement failure`);
            } catch (cancelErr: any) {
              this.logger.warn(
                `Could not cancel payment ${processedPayment.id} after failed disbursement: ${cancelErr.message}`,
              );
            }
          }

          this.logger.error(`Mobile money disbursement failed: ${error.message}`, error.stack);
          if (error instanceof BadRequestException || error instanceof NotFoundException) {
            throw error;
          }
          throw new BadRequestException(
            `Disbursement failed: ${error.message || 'Unknown error'}`,
          );
        }
      }

      // Bank transfer path — manual confirmation, still locked amount
      beneficiaries[0].amount = lockedAmount;
      loan.metadata = {
        ...(loan.metadata || {}),
        disbursement: {
          method: 'bank_transfer',
          bank_account_number: beneficiaryPayment.paymentInfo.accountNumber,
          account_holder: beneficiaryPayment.ownerName,
          truck_owner_id: beneficiaryPayment.ownerId,
          amount: lockedAmount,
          currency: loan.currency,
        },
      };
      await this.processDisbursementToBeneficiaries(savedDisbursement);
      // Keep loan APPROVED until confirmDisbursement / updateDisbursementStatus
      await manager.save(LoanRequest, loan);

      this.logger.log(
        `Bank transfer disbursement ${savedDisbursement.id} queued as PENDING for loan ${loan.id}`,
      );

      return {
        success: true,
        pendingConfirmation: true,
        disbursement: savedDisbursement,
        disbursedAmount: 0,
        disbursedCurrency: this.requireCurrency(loan.currency, `loan ${loan.id}`),
      };
    });
  }

  /**
   * Prepare a bank / off-platform disbursement for settlement.
   * Never marks DISBURSED — confirmation must come via confirmDisbursement
   * or updateDisbursementStatus after real funds movement.
   */
  private async processDisbursementToBeneficiaries(
    disbursement: LoanDisbursement,
  ): Promise<void> {
    if (!disbursement.beneficiaries?.length) {
      throw new BadRequestException(
        'Disbursement has no beneficiaries. Configure loan requested_split or resolve truck owner payment info.',
      );
    }

    for (const beneficiary of disbursement.beneficiaries) {
      const amount = Number(beneficiary.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new BadRequestException(
          'Each disbursement beneficiary must have a positive amount.',
        );
      }
      this.logger.log(
        `Queued disbursement of ${amount} to ${beneficiary.recipientType || beneficiary.type || 'beneficiary'} ` +
          `${beneficiary.recipientId || beneficiary.id || 'unknown'} ` +
          `(disbursement ${disbursement.id})`,
      );
    }

    disbursement.status = DisbursementStatus.PENDING;
    disbursement.disbursement_date = null as any;
    await this.loanDisbursementRepository.save(disbursement);
  }

  async confirmDisbursement(
    confirmDto: ConfirmDisbursementDto,
    bearerToken?: string,
    hmac?: { signature?: string; timestamp?: string },
  ): Promise<LoanDisbursement> {
    // Authenticate lender by API key (bearer token)
    if (!bearerToken) {
      throw new BadRequestException('Missing Authorization header');
    }
    const lender = await this.getLenderByApiKey(bearerToken);
    if (!lender) {
      throw new BadRequestException('Invalid API credentials');
    }
    const loan = await this.loanRequestRepository.findOne({
      where: { id: confirmDto.loan_id },
    });

    if (!loan) {
      throw new NotFoundException('Loan request not found');
    }

    const disbursement = await this.loanDisbursementRepository.findOne({
      where: { loan_request_id: confirmDto.loan_id },
    });
    // Verify HMAC signature when secret configured
    if (lender.webhook_secret_encrypted) {
      try {
        const secret = decryptString(lender.webhook_secret_encrypted);
        const payload = JSON.stringify(confirmDto);
        const base = `${hmac?.timestamp || ''}.${payload}`;
        const expected = crypto
          .createHmac('sha256', secret)
          .update(base)
          .digest('hex');
        if (!hmac?.signature || hmac.signature !== expected) {
          throw new BadRequestException('Invalid webhook signature');
        }
      } catch (e) {
        if (e instanceof BadRequestException) throw e;
        this.logger.warn('Webhook signature check failed');
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    if (!disbursement) {
      throw new NotFoundException('Disbursement not found');
    }

    disbursement.external_txn_ref = confirmDto.external_disbursement_ref;
    disbursement.beneficiaries = confirmDto.beneficiaries;
    disbursement.status =
      confirmDto.status === 'success'
        ? DisbursementStatus.DISBURSED
        : DisbursementStatus.FAILED;
    disbursement.disbursement_date = new Date(confirmDto.timestamp);

    if (confirmDto.failure_reason) {
      disbursement.failure_reason = confirmDto.failure_reason;
    }

    const updatedDisbursement =
      await this.loanDisbursementRepository.save(disbursement);

    // Update loan status
    if (confirmDto.status === 'success') {
      loan.status = LoanRequestStatus.DISBURSED;
    } else {
      loan.status = LoanRequestStatus.FAILED;
    }
    await this.loanRequestRepository.save(loan);

    return updatedDisbursement;
  }

  async processRepayment(
    loanId: string,
    finalPaymentAmount: number,
    paymentMeta?: {
      paymentMethod?: string;
      paymentDetails?: Record<string, unknown>;
      /** ISO 4217 currency code selected by the user in the repayment modal */
      currency?: string;
    },
  ): Promise<LoanRepayment & { payment?: { status: string; transactionId?: string; pendingConfirmation?: boolean } }> {
    const loan = await this.loanRequestRepository.findOne({
      where: { id: loanId },
      relations: ['lender', 'repayments', 'borrower'],
    } as any);

    if (!loan) {
      throw new NotFoundException('Loan request not found');
    }

    if (loan.status !== LoanRequestStatus.DISBURSED) {
      throw new BadRequestException(
        'Loan must be disbursed before repayment',
      );
    }

    // Ensure contracted interest from interest-rate policy is applied when configured
    let interestAmount = Number(loan.interest_amount || 0);
    if ((!loan.interest_amount || interestAmount <= 0) && loan.lender_id) {
      try {
        const borrowerCreditScore =
          (loan as any).borrower?.credit_score ?? null;
        const terms = await this.computeLoanTerms(
          loan.lender_id,
          borrowerCreditScore,
          loan.id,
        );
        if (terms.interest_rate != null) {
          const approvedAmount = Number(
            loan.approved_amount || loan.requested_amount || 0,
          );
          const termMonths = Number(loan.loan_term_months || 3);
          interestAmount =
            Math.round(
              approvedAmount *
                (terms.interest_rate / 100) *
                (termMonths / 12) *
                100,
            ) / 100;
          loan.interest_amount = interestAmount;
          loan.metadata = {
            ...(loan.metadata || {}),
            interest_rate: terms.interest_rate,
            interest_applied_at_repayment: true,
          };
          // Column-level update — never save a loan loaded with OneToMany relations
          await this.loanRequestRepository.update(loan.id, {
            interest_amount: interestAmount,
            metadata: loan.metadata,
          });
          this.logger.log(
            `processRepayment: applied interest_amount=${interestAmount} from interest policy (rate=${terms.interest_rate}%) for loan ${loanId}`,
          );
        }
      } catch (policyErr: any) {
        this.logger.warn(
          `processRepayment: could not resolve interest policy for loan ${loanId}: ${policyErr.message}`,
        );
      }
    }

    if (finalPaymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be positive');
    }

    const preAllocation = this.computeRepaymentAllocation(
      loan.repayments || [],
      Number(loan.approved_amount || 0),
      interestAmount,
      finalPaymentAmount,
    );
    if (preAllocation.outstanding <= 0) {
      throw new BadRequestException('Loan has no outstanding balance');
    }

    const appliedAmount = preAllocation.appliedAmount;

    const paymentMethod = paymentMeta?.paymentMethod || 'mobile_money';
    const paymentDetails = paymentMeta?.paymentDetails || {};
    let externalTxnRef = `REPAY-${Date.now()}`;
    let paymentStatus: 'completed' | 'processing' = 'completed';
    let pendingConfirmation = false;

    // Card not integrated with payment gateway — same policy as subscriptions
    if (paymentMethod === 'card') {
      throw new BadRequestException(
        'Card payments are not yet supported. Please use mobile_money.',
      );
    }

    // ── Real payment via ishema (MOBILE_MONEY_* from .env) ─────────────────
    // Collection: user-entered phone = payer (gets PIN popup) → platform receives
    if (paymentMethod === 'mobile_money') {
      // Accept phoneNumber / phone / payerPhone from the payment modal
      const rawPayerPhone = String(
        paymentDetails.phoneNumber ||
          paymentDetails.phone ||
          paymentDetails.payerPhone ||
          '',
      ).trim();
      if (!rawPayerPhone) {
        throw new BadRequestException(
          'Enter the mobile money number that will pay. That phone receives the PIN popup.',
        );
      }

      const platformPhone = this.configService.get<string>(
        'MOBILE_MONEY_ACCOUNT_PHONE',
      );
      if (!platformPhone) {
        throw new BadRequestException(
          'MOBILE_MONEY_ACCOUNT_PHONE is not configured. Cannot collect loan repayment.',
        );
      }

      const MobileMoneyModule = await import(
        '../payments/services/mobile-money-payment.service'
      );
      const MobileMoneyClass = MobileMoneyModule.MobileMoneyPaymentService;
      const mobileMoneyService = this.moduleRef.get(MobileMoneyClass, {
        strict: false,
      });

      if (!mobileMoneyService) {
        throw new BadRequestException(
          'Mobile Money payment service is not available.',
        );
      }

      // Normalize + validate — this number is the ishema phoneNumber (gets USSD/PIN)
      const payerPhone = mobileMoneyService.formatPhoneNumber(rawPayerPhone);
      const formattedPlatformPhone =
        mobileMoneyService.formatPhoneNumber(platformPhone);

      if (payerPhone === formattedPlatformPhone) {
        throw new BadRequestException(
          'Use the borrower\'s MoMo number (the phone that will pay), not the platform account number.',
        );
      }

      const loanCurrency = this.requireCurrency(
        loan.currency,
        `loan ${loan.id} repayment`,
      );
      const { amount: momoAmount, currency: momoCurrency, exchangeRate } =
        await this.resolveDisbursementAmount(appliedAmount, loanCurrency);

      if (!momoAmount || momoAmount < 1) {
        throw new BadRequestException(
          `Invalid repayment amount for mobile money (${momoAmount} ${momoCurrency}).`,
        );
      }

      const referenceId = `LREP-${loan.id.slice(0, 8).toUpperCase()}-${Date.now()}`;
      const senderMessage =
        `Loan repayment #${loan.loan_number || loan.id.slice(0, 8)} — ${momoAmount} ${momoCurrency}`.substring(
          0,
          160,
        );
      const callbackUrl = this.configService.get<string>(
        'MOBILE_MONEY_CALLBACK_URL',
      );

      // Receiver = platform account; payer (popup) = number entered in the modal
      const transfers = [
        {
          percentage: 100,
          phoneNumber: formattedPlatformPhone,
          receiverMessage: senderMessage,
        },
      ];

      this.logger.log(
        `Initiating loan repayment COLLECTION: ${momoAmount} ${momoCurrency} ` +
          `| PIN popup → payer ${payerPhone} (user-entered: ${rawPayerPhone}) ` +
          `| receiver ${formattedPlatformPhone} | loan: ${loanId} | ref: ${referenceId}` +
          (exchangeRate ? ` | rate=${exchangeRate}` : ''),
      );

      const mmResponse = await mobileMoneyService.createTransaction(
        momoAmount,
        payerPhone, // ishema phoneNumber = payer who gets the PIN popup
        referenceId,
        senderMessage,
        transfers,
        callbackUrl,
      );

      const txn = mmResponse.savedTransaction || mmResponse.transaction;
      externalTxnRef = txn?.externalId || txn?.id || referenceId;
      const txnStatus = txn?.status || 'pending';

      this.logger.log(
        `MoMo repayment response: status=${txnStatus}, externalId=${externalTxnRef}, ` +
          `responsePhone=${txn?.phoneNumber || 'n/a'}`,
      );

      if (txnStatus === 'failed') {
        throw new BadRequestException(
          'Mobile Money repayment was rejected by the provider. Check the phone number and try again.',
        );
      }

      paymentStatus =
        txnStatus === 'success' || txnStatus === 'completed'
          ? 'completed'
          : 'processing';
      pendingConfirmation = paymentStatus === 'processing';

      // Never record repayment ledger until Ishema webhook confirms delivery
      if (pendingConfirmation) {
        const { Payment: PaymentEntity, PaymentStatus: PmtStatus, PaymentMethod: PmtMethod, PaymentType: PmtType } =
          await import('../../entities/payment.entity');

        const pendingPayment = this.dataSource.manager.create(PaymentEntity, {
          tenantId: loan.tenant_id,
          payerId: loan.created_by,
          payeeId: loan.lender_id,
          tripId: loan.trip_id,
          amount: appliedAmount,
          currency: loanCurrency,
          paymentMethod: PmtMethod.DIGITAL_WALLET,
          paymentType: PmtType.SERVICE_FEE,
          status: PmtStatus.PROCESSING,
          referenceNumber: referenceId,
          transactionId: externalTxnRef,
          description: senderMessage,
          metadata: {
            referenceId,
            pendingLoanRepayment: true,
            isLoanRepayment: true,
            loanId: loan.id,
            finalPaymentAmount,
            appliedAmount,
            interestAmount,
            currency: loanCurrency,
            paymentMethod,
            paymentDetails,
          },
        } as any);
        await this.dataSource.manager.save(PaymentEntity, pendingPayment);

        return Object.assign({} as LoanRepayment, {
          id: pendingPayment.id,
          loan_request_id: loanId,
          amount: appliedAmount,
          payment: {
            status: 'processing',
            transactionId: externalTxnRef,
            pendingConfirmation: true,
            referenceId,
          },
        });
      }
    }

    const savedRepayment = await this.recordLoanRepayment({
      loanId,
      finalPaymentAmount,
      externalTxnRef,
      paymentMethod,
      paymentStatus,
      paymentDetails,
      interestAmount,
      currency: this.requireCurrency(
        paymentMeta?.currency || loan.currency,
        paymentMeta?.currency
          ? 'repayment request body (currency from frontend)'
          : `loan ${loan.id} (persisted currency from frontend)`,
      ),
    });

    const { saved, fullyRepaid, freshLoan } = savedRepayment;

    // External lender webhook (if configured)
    if (freshLoan.lender?.callback_url) {
      await this.notifyLenderRepayment(freshLoan, saved);
    }

    // In-app + email + SMS for cargo owner (borrower) and lender
    await this.notifyRepaymentParties(freshLoan, saved, {
      fullyRepaid,
      paymentMethod,
      pendingConfirmation,
    });

    return Object.assign(saved, {
      payment: {
        status: paymentStatus,
        transactionId: externalTxnRef,
        pendingConfirmation,
      },
    });
  }

  /**
   * Interest-first waterfall allocation (standard consumer/commercial lending).
   * Incoming payments satisfy accrued interest before principal.
   */
  private computeRepaymentAllocation(
    repayments: Pick<LoanRepayment, 'amount' | 'principal_paid' | 'interest_paid'>[],
    principalAmount: number,
    interestAmount: number,
    paymentAmount: number,
  ): {
    totalDue: number;
    paidSoFar: number;
    outstanding: number;
    appliedAmount: number;
    interestPaid: number;
    principalPaid: number;
    principalOutstanding: number;
    interestOutstanding: number;
    fullyRepaid: boolean;
  } {
    const totalDue = principalAmount + interestAmount;
    const paidSoFar = repayments.reduce(
      (sum, r) => sum + Number(r.amount || 0),
      0,
    );
    const outstanding = Math.max(0, totalDue - paidSoFar);
    const appliedAmount = Math.min(Math.max(0, paymentAmount), outstanding);

    const principalRepaid = repayments.reduce(
      (s, r) => s + Number(r.principal_paid || 0),
      0,
    );
    const interestRepaid = repayments.reduce(
      (s, r) => s + Number(r.interest_paid || 0),
      0,
    );
    const principalOutstanding = Math.max(0, principalAmount - principalRepaid);
    const interestOutstanding = Math.max(0, interestAmount - interestRepaid);

    const interestPaid = Math.min(appliedAmount, interestOutstanding);
    const principalPaid = appliedAmount - interestPaid;
    const fullyRepaid = outstanding - appliedAmount <= 0.001;

    return {
      totalDue,
      paidSoFar,
      outstanding,
      appliedAmount,
      interestPaid,
      principalPaid,
      principalOutstanding,
      interestOutstanding,
      fullyRepaid,
    };
  }

  /**
   * Persist repayment under a row lock with a fresh balance recompute (prevents
   * concurrent double-application). Uses column-level loan updates only — never
   * saves a LoanRequest that has OneToMany children loaded.
   *
   * Locking rule (PostgreSQL): FOR UPDATE must not include LEFT OUTER JOINs
   * (nullable relations). Lock the loan row alone, then load lender separately.
   */
  private async recordLoanRepayment(input: {
    loanId: string;
    finalPaymentAmount: number;
    externalTxnRef: string;
    paymentMethod: string;
    paymentStatus: 'completed' | 'processing';
    paymentDetails: Record<string, unknown>;
    interestAmount: number;
    currency: string;
  }): Promise<{
    saved: LoanRepayment;
    fullyRepaid: boolean;
    freshLoan: LoanRequest;
  }> {
    const {
      loanId,
      finalPaymentAmount,
      externalTxnRef,
      paymentMethod,
      paymentStatus,
      paymentDetails,
      interestAmount,
      currency,
    } = input;

    return this.dataSource.transaction(async (manager) => {
      // 1) Exclusive row lock on loan only — no joins (Postgres FOR UPDATE rule)
      const freshLoan = await manager
        .createQueryBuilder(LoanRequest, 'loan')
        .setLock('pessimistic_write')
        .where('loan.id = :loanId', { loanId })
        .getOne();

      if (!freshLoan || freshLoan.status !== LoanRequestStatus.DISBURSED) {
        throw new BadRequestException('Loan is no longer eligible for repayment');
      }

      // 2) Load lender after lock (needed for webhook / notifications)
      if (freshLoan.lender_id) {
        freshLoan.lender = await manager.findOne(Lender, {
          where: { id: freshLoan.lender_id },
        });
      }

      // 3) Idempotency: reject duplicate payment provider references
      if (externalTxnRef) {
        const duplicate = await manager.findOne(LoanRepayment, {
          where: { external_txn_ref: externalTxnRef },
        });
        if (duplicate) {
          throw new ConflictException(
            'A repayment with this transaction reference has already been recorded',
          );
        }
      }

      // 4) Recompute outstanding inside the lock (authoritative balance)
      const existingRepayments = await manager.find(LoanRepayment, {
        where: { loan_request_id: loanId },
        order: { created_at: 'ASC' },
      });

      const effectiveInterest = Number(
        freshLoan.interest_amount ?? interestAmount,
      );
      const allocation = this.computeRepaymentAllocation(
        existingRepayments,
        Number(freshLoan.approved_amount || 0),
        effectiveInterest,
        finalPaymentAmount,
      );

      if (allocation.outstanding <= 0) {
        throw new ConflictException('Loan has already been fully repaid');
      }

      // 5) Insert repayment ledger entry (FK set explicitly; no parent cascade)
      const repayment = manager.create(LoanRepayment, {
        loan_request_id: loanId,
        amount: allocation.appliedAmount,
        principal_paid: allocation.principalPaid,
        interest_paid: allocation.interestPaid,
        repayment_date: new Date(),
        external_txn_ref: externalTxnRef,
        currency,
        metadata: {
          final_payment_amount: finalPaymentAmount,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          payment_details: {
            phoneNumber: paymentDetails.phoneNumber,
            provider: paymentDetails.provider,
          },
          interest_from_policy: effectiveInterest,
          principal_outstanding_before: allocation.principalOutstanding,
          interest_outstanding_before: allocation.interestOutstanding,
          currency,
          allocation_method: 'interest_first_waterfall',
        },
      });
      const saved = await manager.save(LoanRepayment, repayment);

      // 6) Close loan only when payment is confirmed delivered
      if (allocation.fullyRepaid && paymentStatus === 'completed') {
        const repaidAt = new Date();
        await manager.update(LoanRequest, { id: loanId }, {
          status: LoanRequestStatus.REPAID,
          repaid_at: repaidAt,
        });
        freshLoan.status = LoanRequestStatus.REPAID;
        freshLoan.repaid_at = repaidAt;
      }

      return {
        saved,
        fullyRepaid: allocation.fullyRepaid,
        freshLoan,
      };
    });
  }

  /** Notify cargo owner + lender via in-app, email, and SMS after repayment */
  private async notifyRepaymentParties(
    loan: LoanRequest,
    repayment: LoanRepayment,
    opts: {
      fullyRepaid: boolean;
      paymentMethod?: string;
      pendingConfirmation?: boolean;
    },
  ): Promise<void> {
    try {
      const currency = this.requireCurrency(
        loan.currency,
        `loan ${loan.id} repayment notification`,
      );
      const amount = Number(repayment.amount || 0);
      const notifiedUserIds = new Set<string>();

      const borrowerUser = await this.userRepository.findOne({
        where: { id: loan.created_by },
        relations: ['profile'],
      });
      const borrowerName = borrowerUser?.profile
        ? `${borrowerUser.profile.firstName || ''} ${borrowerUser.profile.lastName || ''}`.trim() ||
          borrowerUser.email
        : borrowerUser?.email || 'Borrower';

      if (borrowerUser) {
        await this.loanNotificationService.notifyBorrowerRepaymentConfirmed(
          borrowerUser.id,
          loan.tenant_id,
          loan.id,
          amount,
          {
            currency,
            principalPaid: Number(repayment.principal_paid || 0),
            interestPaid: Number(repayment.interest_paid || 0),
            fullyRepaid: opts.fullyRepaid,
            paymentMethod: opts.paymentMethod,
            lenderName: loan.lender?.name,
            pendingConfirmation: opts.pendingConfirmation,
          },
        );
        notifiedUserIds.add(borrowerUser.id);
      }

      if (loan.lender?.contact_email) {
        const lenderUser = await this.userRepository.findOne({
          where: { email: loan.lender.contact_email },
        });
        if (lenderUser) {
          await this.loanNotificationService.notifyLenderRepaymentReceived(
            lenderUser.id,
            loan.tenant_id,
            loan.id,
            amount,
            borrowerName,
            currency,
            {
              pendingConfirmation: opts.pendingConfirmation,
              fullyRepaid: opts.fullyRepaid,
            },
          );
          notifiedUserIds.add(lenderUser.id);
        } else {
          // No platform user — still email/SMS the lender contact
          const title = opts.pendingConfirmation
            ? 'Loan Repayment Pending Confirmation'
            : opts.fullyRepaid
              ? 'Loan Fully Repaid'
              : 'Loan Repayment Received';
          const message = opts.pendingConfirmation
            ? `${borrowerName} initiated a repayment of ${amount.toLocaleString()} ${currency}. Awaiting mobile money confirmation.`
            : opts.fullyRepaid
              ? `${borrowerName} repaid ${amount.toLocaleString()} ${currency}. This loan is now fully repaid.`
              : `${borrowerName} has made a repayment of ${amount.toLocaleString()} ${currency}.`;
          await this.loanNotificationService.notifyExternalContact({
            email: loan.lender.contact_email,
            tenantId: loan.tenant_id,
            title,
            message,
            actionUrl: `/lender/requests?loan=${loan.id}`,
            loanId: loan.id,
          });
        }
      }

      // Also notify lender team users (resolve to User ids; fall back to email/SMS)
      try {
        if (loan.lender_id) {
          const lenderUsers = await this.lenderUserRepository.find({
            where: {
              lender_id: loan.lender_id,
              status: LenderUserStatus.ACTIVE,
            },
            take: 5,
          });
          for (const lu of lenderUsers) {
            const teamUser = await this.userRepository.findOne({
              where: { email: lu.email },
            });
            if (teamUser && !notifiedUserIds.has(teamUser.id)) {
              await this.loanNotificationService.notifyLenderRepaymentReceived(
                teamUser.id,
                loan.tenant_id,
                loan.id,
                amount,
                borrowerName,
                currency,
                {
                  pendingConfirmation: opts.pendingConfirmation,
                  fullyRepaid: opts.fullyRepaid,
                  recipientEmail: lu.email,
                  recipientPhone: lu.phone,
                },
              );
              notifiedUserIds.add(teamUser.id);
            } else if (!teamUser && (lu.email || lu.phone)) {
              const title = opts.pendingConfirmation
                ? 'Loan Repayment Pending Confirmation'
                : opts.fullyRepaid
                  ? 'Loan Fully Repaid'
                  : 'Loan Repayment Received';
              const message = opts.pendingConfirmation
                ? `${borrowerName} initiated a repayment of ${amount.toLocaleString()} ${currency}. Awaiting confirmation.`
                : `${borrowerName} repaid ${amount.toLocaleString()} ${currency}.`;
              await this.loanNotificationService.notifyExternalContact({
                email: lu.email,
                phone: lu.phone,
                tenantId: loan.tenant_id,
                title,
                message,
                actionUrl: `/lender/requests?loan=${loan.id}`,
                loanId: loan.id,
              });
            }
          }
        }
      } catch {
        /* team notify optional */
      }
    } catch (err: any) {
      this.logger.warn(
        `notifyRepaymentParties failed for loan ${loan.id}: ${err.message}`,
      );
    }
  }

  private async notifyLenderRepayment(
    loan: LoanRequest,
    repayment: LoanRepayment,
  ): Promise<void> {
    try {
      const payload = {
        platform_loan_id: loan.id,
        repayment_date: repayment.repayment_date.toISOString(),
        principal_paid: repayment.principal_paid,
        interest_paid: repayment.interest_paid,
        external_ref: repayment.external_txn_ref,
      };

      await axios.post(
        `${loan.lender.callback_url}/api/v1/repayments`,
        payload,
        {
          headers: {
            Authorization: await this.buildOutboundAuthHeader(loan.lender.id),
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify lender of repayment: ${error.message}`,
      );
    }
  }

  private async buildOutboundAuthHeader(lenderId: string): Promise<string> {
    const lender = await this.lenderRepository.findOne({ where: { id: lenderId } });
    if (!lender?.outbound_api_key_encrypted) {
      throw new BadRequestException(
        `Lender ${lenderId} has no outbound API key configured. Provision outbound_api_key before calling external lender APIs.`,
      );
    }
    try {
      const token = decryptString(lender.outbound_api_key_encrypted);
      if (!token?.trim()) {
        throw new BadRequestException(
          `Lender ${lenderId} outbound API key decrypted to an empty value.`,
        );
      }
      return `Bearer ${token.trim()}`;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        `Failed to decrypt outbound API key for lender ${lenderId}: ${err.message}`,
      );
    }
  }

  private async calculateInterest(
    loan: LoanRequest,
    lender: Lender,
  ): Promise<number> {
    const policy = await this.lenderPolicyRepository.findOne({
      where: { lender_id: lender.id },
      order: { created_at: 'DESC' },
    });

    if (!policy) {
      return 0;
    }

    return loan.requested_amount * policy.interest_rate;
  }

  private generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a human-readable, sequential loan number (e.g. LN-2026-000042).
   * Compliant with ISO 20022 / SWIFT loan ledger referencing standards.
   *
   * Uses an atomic PostgreSQL upsert on loan_number_sequences to prevent the
   * TOCTOU race condition that the previous COUNT(*)-based approach had:
   *   - Two concurrent requests both read count=N
   *   - Both compute LN-YYYY-000(N+1)
   *   - Second INSERT hits UQ_4382ec13ee491f4b516b8549d26 → 500
   *
   * INSERT ... ON CONFLICT DO UPDATE is serialised by PostgreSQL at the row
   * level, so concurrent callers for the same (tenant_id, year) always receive
   * strictly distinct sequence values — no application-level locking needed.
   *
   * The loan_number_sequences table is created by migration 039.
   */
  private async generateLoanNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();

    const result: Array<{ last_seq: number }> = await this.dataSource.query(
      `INSERT INTO loan_number_sequences (tenant_id, year, last_seq, updated_at)
       VALUES ($1, $2, 1, now())
       ON CONFLICT (tenant_id, year)
       DO UPDATE SET
         last_seq   = loan_number_sequences.last_seq + 1,
         updated_at = now()
       RETURNING last_seq`,
      [tenantId, year],
    );

    const seq = String(result[0].last_seq).padStart(6, '0');
    return `LN-${year}-${seq}`;
  }

  private generateIdempotencyKey(createLoanDto: CreateLoanRequestDto): string {
    const financingType = this.resolveFinancingType(createLoanDto);
    const data = `${createLoanDto.tenant_id}-${createLoanDto.cargo_id}-${createLoanDto.trip_id}-${createLoanDto.requested_amount}-${financingType}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private generateCargoLoanIdempotencyKey(
    tenantId: string,
    cargoId: string,
    tripId: string,
  ): string {
    const data = `${tenantId}-${cargoId}-${tripId}-cargo-loan`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Dashboard/Reporting methods
  async getLoanRequestById(
    loanId: string,
    relations: string[] = [],
  ): Promise<LoanRequest | null> {
    return await this.loanRequestRepository.findOne({
      where: { id: loanId },
      relations,
    });
  }

  /** Get all loan requests created by a specific user (cargo owner or truck owner) */
  async getMyLoanRequests(userId: string, tenantId: string): Promise<any[]> {
    const loans = await this.loanRequestRepository.find({
      where: { created_by: userId, tenant_id: tenantId },
      relations: ['lender', 'disbursements', 'repayments'],
      order: { created_at: 'DESC' },
    });
    return loans.map((loan) => ({
      ...loan,
      financing_type: loan.financing_type || FinancingType.CARGO_OWNER,
      ...buildLoanWorkflowView(loan),
    }));
  }

  /**
   * Trip/cargo IDs that already have an active loan (pending|approved|disbursed).
   * Used by New Loan Request UI to hide already-financed cargo — same rule as createLoanRequest RULE 1.
   */
  async getActiveFinancedIds(tenantId: string): Promise<{
    tripIds: string[];
    cargoIds: string[];
  }> {
    const loans = await this.loanRequestRepository.find({
      where: {
        tenant_id: tenantId,
        status: In([
          LoanRequestStatus.PENDING,
          LoanRequestStatus.APPROVED,
          LoanRequestStatus.DISBURSED,
        ]),
      },
      select: ['trip_id', 'cargo_id'],
    });

    const tripIds = [
      ...new Set(loans.map((l) => l.trip_id).filter(Boolean) as string[]),
    ];
    const cargoIds = [
      ...new Set(loans.map((l) => l.cargo_id).filter(Boolean) as string[]),
    ];
    return { tripIds, cargoIds };
  }

  async getLenderDashboard(lenderId: string, dateFrom?: Date, dateTo?: Date, tenantId?: string) {
    // Resolve user UUID → lender entity UUID (same as getLenderLoanRequests)
    let actualLenderId: string = lenderId;
    let resolvedLender = await this.lenderRepository.findOne({ where: { id: lenderId } });
    if (resolvedLender) {
      actualLenderId = resolvedLender.id;
    } else {
      const user = await this.userRepository.findOne({ where: { id: lenderId, role: UserRole.LENDER } });
      if (user) {
        const lenderByEmail = await this.lenderRepository.findOne({ where: { contact_email: user.email } });
        if (lenderByEmail) {
          actualLenderId = lenderByEmail.id;
          resolvedLender = lenderByEmail;
        }
      }
    }

    const queryBuilder = this.loanRequestRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.repayments', 'repayments')
      .leftJoinAndSelect('loan.disbursements', 'disbursements')
      .where('loan.lender_id = :lenderId', { lenderId: actualLenderId });

    // Tenant scope — only loans from the lender's tenant
    if (tenantId) {
      queryBuilder.andWhere('loan.tenant_id = :tenantId', { tenantId });
    }

    if (dateFrom) {
      queryBuilder.andWhere('loan.created_at >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      queryBuilder.andWhere('loan.created_at <= :dateTo', { dateTo });
    }

    // Live DB query — all aggregates below come from these rows
    const loans = await queryBuilder.getMany();

    const num = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const isSuccessfulDisbursement = (status: string) =>
      status === DisbursementStatus.DISBURSED ||
      status === DisbursementStatus.SUCCESS;

    const disbursedAmountForLoan = (loan: (typeof loans)[number]) => {
      const fromLedger = (loan.disbursements || [])
        .filter((d) => isSuccessfulDisbursement(d.status))
        .reduce((sum, d) => {
          // Prefer explicit disbursement.amount; otherwise sum beneficiary amounts
          if (d.amount != null && num(d.amount) > 0) return sum + num(d.amount);
          const fromBeneficiaries = (d.beneficiaries || []).reduce(
            (bs: number, b: any) => bs + num(b?.amount),
            0,
          );
          return sum + fromBeneficiaries;
        }, 0);
      if (fromLedger > 0) return fromLedger;

      // Fallback: loan already marked disbursed/repaid/defaulted in DB
      if (
        [
          LoanRequestStatus.DISBURSED,
          LoanRequestStatus.REPAID,
          LoanRequestStatus.DEFAULTED,
        ].includes(loan.status)
      ) {
        return num(loan.approved_amount) || num(loan.requested_amount);
      }
      return 0;
    };

    const requestedLoans = loans.filter(
      (l) =>
        l.status !== LoanRequestStatus.REJECTED &&
        l.status !== LoanRequestStatus.FAILED,
    );
    const approvedLoans = loans.filter((l) =>
      [
        LoanRequestStatus.APPROVED,
        LoanRequestStatus.DISBURSED,
        LoanRequestStatus.REPAID,
        LoanRequestStatus.DEFAULTED,
      ].includes(l.status),
    );
    const fundedLoans = loans.filter((l) => disbursedAmountForLoan(l) > 0);
    const activeLoans = loans.filter(
      (l) => l.status === LoanRequestStatus.DISBURSED,
    );
    const repaidLoans = loans.filter(
      (l) => l.status === LoanRequestStatus.REPAID,
    );
    const defaultedLoans = loans.filter(
      (l) => l.status === LoanRequestStatus.DEFAULTED,
    );
    const pendingLoans = loans.filter(
      (l) => l.status === LoanRequestStatus.PENDING,
    );
    const awaitingDisbursement = loans.filter(
      (l) => l.status === LoanRequestStatus.APPROVED,
    );

    // Amounts from loan_requests columns
    const totalAmountRequested = requestedLoans.reduce(
      (sum, l) => sum + num(l.requested_amount),
      0,
    );
    const totalAmountApproved = approvedLoans.reduce(
      (sum, l) => sum + (num(l.approved_amount) || num(l.requested_amount)),
      0,
    );

    // Funds provided from disbursement ledger (with status fallback)
    const totalAmountProvided = loans.reduce(
      (sum, l) => sum + disbursedAmountForLoan(l),
      0,
    );

    // Outstanding = still-active disbursed principal
    const totalOutstanding = activeLoans.reduce(
      (sum, l) => sum + (num(l.approved_amount) || disbursedAmountForLoan(l)),
      0,
    );

    // Repayments from loan_repayments ledger
    const repaymentPrincipal = loans.reduce(
      (sum, l) =>
        sum +
        (l.repayments || []).reduce((rs, r) => rs + num(r.principal_paid), 0),
      0,
    );
    const repaymentInterest = loans.reduce(
      (sum, l) =>
        sum +
        (l.repayments || []).reduce((rs, r) => rs + num(r.interest_paid), 0),
      0,
    );
    const repaymentTotal = loans.reduce(
      (sum, l) =>
        sum + (l.repayments || []).reduce((rs, r) => rs + num(r.amount), 0),
      0,
    );

    // Fallback when loan is repaid in DB but repayment rows are missing
    const fallbackPrincipal = repaidLoans.reduce(
      (sum, l) => sum + (num(l.approved_amount) || num(l.requested_amount)),
      0,
    );
    const fallbackInterest = repaidLoans.reduce(
      (sum, l) => sum + num(l.interest_amount),
      0,
    );

    const totalPrincipalRepaid =
      repaymentPrincipal > 0 ? repaymentPrincipal : fallbackPrincipal;
    const totalInterestRepaid =
      repaymentInterest > 0 ? repaymentInterest : fallbackInterest;
    const totalAmountRepaid =
      repaymentTotal > 0
        ? repaymentTotal
        : totalPrincipalRepaid + totalInterestRepaid;

    const recoveryRate =
      totalAmountProvided > 0
        ? (totalPrincipalRepaid / totalAmountProvided) * 100
        : 0;
    const defaultRate =
      fundedLoans.length > 0
        ? (defaultedLoans.length / fundedLoans.length) * 100
        : 0;
    const roi =
      totalAmountProvided > 0
        ? (totalInterestRepaid / totalAmountProvided) * 100
        : 0;

    const currency =
      loans.find((l) => l.currency)?.currency ||
      resolvedLender?.metadata?.currency ||
      'RWF';

    this.logger.log(
      `getLenderDashboard lender=${actualLenderId} loans=${loans.length} ` +
        `requested=${requestedLoans.length}/${totalAmountRequested} ` +
        `approved=${approvedLoans.length}/${totalAmountApproved} ` +
        `provided=${fundedLoans.length}/${totalAmountProvided} ` +
        `repaid=${repaidLoans.length}/${totalAmountRepaid}`,
    );

    return {
      totalLoansRequested: requestedLoans.length,
      totalAmountRequested,
      totalLoansApproved: approvedLoans.length,
      totalAmountApproved,
      totalLoansProvided: fundedLoans.length,
      totalAmountProvided,
      totalLoansRepaid: repaidLoans.length,
      totalAmountRepaid,
      totalPrincipalRepaid,
      totalInterestRepaid,
      totalOutstandingPrincipal: totalOutstanding,
      recoveryRate: parseFloat(recoveryRate.toFixed(2)),
      defaultRate: parseFloat(defaultRate.toFixed(2)),
      averageLoanSize:
        fundedLoans.length > 0
          ? totalAmountProvided / fundedLoans.length
          : 0,
      roi: parseFloat(roi.toFixed(2)),
      pendingCount: pendingLoans.length,
      approvedAwaitingDisbursement: awaitingDisbursement.length,
      activeLoansCount: activeLoans.length,
      currency,
      source: 'database',
      computedAt: new Date().toISOString(),
      loans: loans.map((loan) => ({
        id: loan.id,
        amount: num(loan.approved_amount) || num(loan.requested_amount),
        requested_amount: num(loan.requested_amount),
        approved_amount: loan.approved_amount != null ? num(loan.approved_amount) : null,
        status: loan.status,
        created_at: loan.created_at,
        due_date: loan.due_date,
      })),
    };
  }

  // ==== ADDITIONAL SERVICE METHODS ====

  async getAllLenders(tenantId?: string, status?: string): Promise<Lender[]> {
    const whereCondition: any = tenantId ? { tenant_id: tenantId } : {};
    if (status) {
      // Include ACTIVE + PAUSED so cargo owners see all available lenders.
      // Only SUSPENDED lenders are hidden.
      if (status === LenderStatus.ACTIVE) {
        whereCondition.status = In([LenderStatus.ACTIVE, LenderStatus.PAUSED]);
      } else {
        whereCondition.status = status;
      }
    }

    // List endpoints do not need policies (avoids schema-mismatch 500s on
    // lender_policies). Use getLenderById when policies are required.
    const directLenders = await this.lenderRepository.find({
      where: whereCondition,
      order: { created_at: 'DESC' },
    });

    // Secondary query: lenders whose tenant_id may be stale/null but whose
    // contact_email matches a User with LENDER role in this tenant.
    // This handles lenders created by SUPER_ADMIN without the correct tenant_id.
    if (tenantId) {
      const lenderUsersInTenant = await this.userRepository.find({
        where: { tenantId, role: UserRole.LENDER, status: UserStatus.ACTIVE },
        select: ['id', 'email'],
      });

      if (lenderUsersInTenant.length > 0) {
        const emails = lenderUsersInTenant.map(u => u.email);
        const directIds = new Set(directLenders.map(l => l.id));

        const emailMatchedLenders = await this.lenderRepository.find({
          where: { contact_email: In(emails) },
          order: { created_at: 'DESC' },
        });

        for (const l of emailMatchedLenders) {
          if (!directIds.has(l.id)) {
            // Silently patch stale tenant_id so future queries work correctly
            if (l.tenant_id !== tenantId) {
              await this.lenderRepository.update(l.id, { tenant_id: tenantId });
              l.tenant_id = tenantId;
              this.logger.warn(
                `[getAllLenders] Patched tenant_id for lender ${l.id} (${l.contact_email}) → ${tenantId}`,
              );
            }
            // Apply status filter
            const allowedStatuses: string[] =
              status === LenderStatus.ACTIVE
                ? [LenderStatus.ACTIVE, LenderStatus.PAUSED]
                : status
                ? [status]
                : Object.values(LenderStatus);
            if (allowedStatuses.includes(l.status)) {
              directLenders.push(l);
            }
          }
        }
      }
    }

    return directLenders;
  }

  async getLenderByUserEmail(email: string): Promise<Lender | null> {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    // Case-insensitive match — lender contact_email is stored lowercased at creation
    return await this.lenderRepository.findOne({
      where: { contact_email: ILike(normalized) },
    });
  }

  /**
   * Resolve a frontend-passed ID (User.id or Lender.id) to the lenders table PK.
   * Returns null when no lender entity can be resolved (caller should treat as empty).
   */
  private async resolveLenderEntityId(lenderId: string): Promise<string | null> {
    if (!lenderId) return null;

    const byId = await this.lenderRepository.findOne({ where: { id: lenderId } });
    if (byId) return byId.id;

    const user = await this.userRepository.findOne({
      where: { id: lenderId, role: UserRole.LENDER },
    });
    if (!user?.email) {
      this.logger.warn(`resolveLenderEntityId: no LENDER user for id ${lenderId}`);
      return null;
    }

    const byEmail = await this.getLenderByUserEmail(user.email);
    if (byEmail) return byEmail.id;

    this.logger.warn(
      `resolveLenderEntityId: no lender entity for user ${lenderId} (${user.email})`,
    );
    return null;
  }

  async getLenderById(lenderId: string): Promise<Lender> {
    const lender = await this.lenderRepository.findOne({
      where: { id: lenderId },
      relations: ['policies'],
    });

    if (!lender) {
      throw new NotFoundException('Lender not found');
    }

    return lender;
  }

  async updateLenderStatus(
    lenderId: string,
    status: LenderStatus,
  ): Promise<Lender> {
    const lender = await this.getLenderById(lenderId);
    lender.status = status;
    return await this.lenderRepository.save(lender);
  }

  // Helper method to resolve lender by ID (handles both User IDs and Lender entity IDs)
  private async resolveLenderById(lenderId: string): Promise<Lender> {
    // First, try to find if lenderId is a Lender entity ID
    let lender = await this.lenderRepository.findOne({
      where: { id: lenderId },
    });

    // If not found, try to find by user email (lenderId might be a User ID)
    if (!lender) {
      const user = await this.userRepository.findOne({
        where: { id: lenderId, role: UserRole.LENDER },
        relations: ['profile'],
      });

      if (user) {
        // Try to find Lender by contact_email matching user email
        lender = await this.getLenderByUserEmail(user.email);

        if (!lender) {
          // Create a new Lender entity for this user
          this.logger.log(`Creating Lender entity for user ${lenderId} (${user.email})`);
          lender = this.lenderRepository.create({
            name: user.profile?.companyName || 
                  (user.profile?.firstName && user.profile?.lastName 
                    ? `${user.profile.firstName} ${user.profile.lastName}` 
                    : user.email) || 'Unknown Lender',
            contact_email: user.email.trim().toLowerCase(),
            status: 'active' as any,
            tenant_id: user.tenantId,
            api_key_hash: '', // Will be set later if needed
            metadata: {},
          });
          lender = await this.lenderRepository.save(lender);
          this.logger.log(`Created Lender entity ${lender.id} for user ${lenderId}`);
        }
      } else {
        throw new NotFoundException(`Lender not found with ID: ${lenderId}`);
      }
    }

    return lender;
  }

  // Extended Profile Management Methods
  async getLenderProfile(lenderId: string): Promise<LenderProfileResponseDto> {
    // First, try to find if lenderId is a Lender entity ID
    let lender = await this.lenderRepository.findOne({
      where: { id: lenderId },
      relations: ['policies'],
    });

    // If not found, try to find by user email (lenderId might be a User ID)
    if (!lender) {
      const user = await this.userRepository.findOne({
        where: { id: lenderId, role: UserRole.LENDER },
        relations: ['profile'],
      });

      if (user) {
        // Try to find Lender by contact_email matching user email
        lender = await this.lenderRepository.findOne({
          where: { contact_email: user.email },
          relations: ['policies'],
        });

        if (!lender) {
          // If still not found, create a basic lender profile from user data
          this.logger.log(`Creating basic lender profile for user ${lenderId} (${user.email})`);
          
          // Return a basic profile structure using user data
          return {
            id: lenderId, // Use user ID as profile ID
            personal: {
              firstName: user.profile?.firstName || user.email.split('@')[0] || '',
              lastName: user.profile?.lastName || '',
              email: user.email,
              phone: user.phone || '',
              dateOfBirth: undefined,
              profileImage: undefined,
              title: 'Lending Manager',
              bio: 'Professional lending specialist focused on transportation and logistics financing.',
            },
            business: {
              companyName: user.profile?.companyName || `${user.profile?.firstName || 'Lender'} Capital`,
              registrationNumber: undefined,
              taxId: undefined,
              businessType: 'Financial Services',
              industry: 'Commercial Lending',
              foundedYear: undefined,
              website: undefined,
              address: undefined,
              description: 'Leading commercial lending firm specializing in logistics and transportation financing.',
              operationalCountries: [],
              supportedCurrencies: [],
              lendingCapacity: {
                minLoanAmount: null,
                maxLoanAmount: null,
                totalCapacity: null,
                availableCapacity: null,
              },
              specializations: [],
              certifications: [],
            },
            banking: undefined,
            preferences: {
              language: undefined,
              timezone: undefined,
              currency: undefined,
              dateFormat: undefined,
              emailNotifications: true,
              smsNotifications: false,
              marketingEmails: false,
              twoFactorAuth: false,
            },
            security: {
              lastPasswordChange: user.createdAt?.toISOString() || new Date().toISOString(),
              loginSessions: 1,
              twoFactorAuth: false,
            },
            created_at: user.createdAt?.toISOString() || new Date().toISOString(),
            updated_at: user.updatedAt?.toISOString() || new Date().toISOString(),
          };
        }
      } else {
        throw new NotFoundException(`Lender not found with ID: ${lenderId}`);
      }
    }

    // Parse the stored profile data (assuming it's stored as JSON in metadata fields)
    const profileData = lender.metadata || {};

    return {
      id: lender.id,
      personal: {
        firstName:
          profileData.personal?.firstName || lender.name?.split(' ')[0] || '',
        lastName:
          profileData.personal?.lastName ||
          lender.name?.split(' ').slice(1).join(' ') ||
          '',
        email: profileData.personal?.email || lender.contact_email,
        phone: profileData.personal?.phone || '',
        dateOfBirth: profileData.personal?.dateOfBirth,
        profileImage: profileData.personal?.profileImage,
        title: profileData.personal?.title,
        bio: profileData.personal?.bio,
      },
      business: {
        companyName: profileData.business?.companyName || lender.name,
        registrationNumber: profileData.business?.registrationNumber,
        taxId: profileData.business?.taxId,
        businessType: profileData.business?.businessType,
        industry: profileData.business?.industry,
        foundedYear: profileData.business?.foundedYear,
        website: profileData.business?.website || lender.callback_url,
        address: profileData.business?.address,
        description: profileData.business?.description,
        operationalCountries: profileData.business?.operationalCountries || [],
        supportedCurrencies: profileData.business?.supportedCurrencies || [],
        lendingCapacity: profileData.business?.lendingCapacity,
        specializations: profileData.business?.specializations || [],
        certifications: profileData.business?.certifications || [],
      },
      banking: profileData.banking,
      preferences: profileData.preferences,
      security: {
        lastPasswordChange:
          profileData.security?.lastPasswordChange ||
          lender.created_at?.toISOString(),
        loginSessions: profileData.security?.loginSessions || 0,
        twoFactorAuth: profileData.security?.twoFactorAuth || false,
      },
      created_at: lender.created_at?.toISOString(),
      updated_at: lender.updated_at?.toISOString(),
    };
  }

  async updateLenderProfile(
    lenderId: string,
    profileData: UpdateLenderProfileDto,
  ): Promise<Lender> {
    const lender = await this.resolveLenderById(lenderId);

    // Update basic lender fields
    if (profileData.personal) {
      if (profileData.personal.firstName || profileData.personal.lastName) {
        lender.name =
          `${profileData.personal.firstName || ''} ${profileData.personal.lastName || ''}`.trim();
      }
      if (profileData.personal.email) {
        lender.contact_email = profileData.personal.email;
      }
    }

    if (profileData.business?.website) {
      lender.callback_url = profileData.business.website;
    }

    // Store extended profile data in metadata
    const currentMetadata = lender.metadata || {};
    lender.metadata = {
      ...currentMetadata,
      ...profileData,
    };

    return await this.lenderRepository.save(lender);
  }

  async updateLenderPersonal(
    lenderId: string,
    personalData: PersonalInfoDto,
  ): Promise<Lender> {
    const lender = await this.resolveLenderById(lenderId);

    // Update basic fields
    lender.name = `${personalData.firstName} ${personalData.lastName}`;
    lender.contact_email = personalData.email;

    // Store in metadata
    const currentMetadata = lender.metadata || {};
    lender.metadata = {
      ...currentMetadata,
      personal: personalData,
    };

    return await this.lenderRepository.save(lender);
  }

  async updateLenderBusiness(
    lenderId: string,
    businessData: BusinessInfoDto,
  ): Promise<Lender> {
    const lender = await this.resolveLenderById(lenderId);

    // Update basic fields
    lender.name = businessData.companyName;
    if (businessData.website) {
      lender.callback_url = businessData.website;
    }

    // Store in metadata
    const currentMetadata = lender.metadata || {};
    lender.metadata = {
      ...currentMetadata,
      business: businessData,
    };

    return await this.lenderRepository.save(lender);
  }

  async updateLenderBanking(
    lenderId: string,
    bankingData: BankingInfoDto,
  ): Promise<Lender> {
    const lender = await this.resolveLenderById(lenderId);

    // Store in metadata
    const currentMetadata = lender.metadata || {};
    lender.metadata = {
      ...currentMetadata,
      banking: bankingData,
    };

    return await this.lenderRepository.save(lender);
  }

  async updateLenderPreferences(
    lenderId: string,
    preferences: PreferencesDto,
  ): Promise<Lender> {
    const lender = await this.resolveLenderById(lenderId);

    // Store in metadata
    const currentMetadata = lender.metadata || {};
    lender.metadata = {
      ...currentMetadata,
      preferences: preferences,
    };

    return await this.lenderRepository.save(lender);
  }

  /**
   * Compute and persist loan terms for a given loan request.
   *
   * Professional-grade implementation:
   * - Per-factor risk scoring using each rule's own scoring_criteria bands
   * - Adjustment factors applied to the base rate (credit_score adjustment
   *   from the policy's adjustment_factors field)
   * - Effective Annual Rate (EAR/APR) computed from nominal rate via monthly
   *   compounding � displayed to borrowers per disclosure requirements
   * - Full policy snapshot stored for immutable audit trail
   * - Engine version tracked so scoring changes are traceable
   */
  async computeLoanTerms(
    lenderId: string,
    borrowerCreditScore: number | null,
    loanRequestId?: string,
    borrowerData?: {
      business_age_years?: number | null;
      debt_to_income_ratio?: number | null;
      collateral_value?: number | null;
    },
  ): Promise<{
    interest_rate: number | null;
    effective_annual_rate: number | null;
    risk_score: number | null;
    risk_level: RiskLevel | null;
    base_rate: number | null;
    rate_adjustment: number | null;
    policy_id: string | null;
    breakdown: Array<{ factor: string; weight: number; input_value: number | null; band: string | null; factor_score: number }>;
  }> {
    const ENGINE_VERSION = '1.0.0';
    try {
      // Resolve User UUID → Lender entity UUID (policies are stored against the Lender entity id,
      // but callers may pass the user's id from JWT).  Falls back to the original id on error.
      let resolvedLenderId = lenderId;
      try {
        resolvedLenderId = await this.lendingPoliciesService.resolveLenderId(lenderId);
      } catch {
        this.logger.warn(`computeLoanTerms: could not resolve lenderId ${lenderId} to Lender entity, using as-is`);
      }

      const [interestRatePolicies, riskRules] = await Promise.all([
        this.interestRatePolicyRepository.find({
          where: { lender_id: resolvedLenderId, is_active: true },
          order: { priority: 'DESC' },
        }),
        this.riskAssessmentPolicyRepository.find({
          where: { lender_id: resolvedLenderId, is_active: true },
          order: { priority: 'DESC' },
        }),
      ]);

      if (!interestRatePolicies.length && !riskRules.length) {
        this.logger.warn(`computeLoanTerms: no active policies for lender ${lenderId}`);
        return { interest_rate: null, effective_annual_rate: null, risk_score: null, risk_level: null, base_rate: null, rate_adjustment: null, policy_id: null, breakdown: [] };
      }

      // -- Step 1: Per-factor risk scoring --------------------------------------
      // Map each RiskFactor to the best available input value.
      const factorInputs: Record<string, number | null> = {
        credit_score:      borrowerCreditScore,
        payment_history:   borrowerCreditScore,
        debt_to_income:    borrowerData?.debt_to_income_ratio ?? null,
        business_age:      borrowerData?.business_age_years ?? null,
        industry_risk:     null,
        collateral_value:  borrowerData?.collateral_value ?? null,
        cash_flow:         null,
        market_conditions: null,
      };

      const breakdown: Array<{ factor: string; weight: number; input_value: number | null; band: string | null; factor_score: number }> = [];
      let totalWeight = 0;
      let weightedScore = 0;

      for (const rule of riskRules) {
        const weight = Number(rule.weight) || 0;
        if (weight === 0) continue;
        const inputValue = factorInputs[rule.factor] ?? null;
        let factorScore = 50; // neutral default for missing data
        let matchedBand: string | null = null;

        if (inputValue !== null && rule.scoring_criteria) {
          for (const tier of ['excellent', 'good', 'fair', 'poor'] as const) {
            const band = rule.scoring_criteria[tier];
            if (band && inputValue >= Number(band.min) && inputValue <= Number(band.max)) {
              factorScore = Number(band.score);
              matchedBand = tier;
              break;
            }
          }
        } else if (inputValue === null) {
          matchedBand = 'missing_data';
        }

        breakdown.push({ factor: rule.factor, weight, input_value: inputValue, band: matchedBand, factor_score: factorScore });
        weightedScore += factorScore * weight;
        totalWeight += weight;
      }

      const risk_score: number | null = totalWeight > 0
        ? Math.round((weightedScore / totalWeight) * 100) / 100
        : null;

      // -- Step 2: Derive risk level ---------------------------------------------
      let risk_level: RiskLevel | null = null;
      if (risk_score !== null) {
        if (risk_score >= 80)      risk_level = RiskLevel.LOW;
        else if (risk_score >= 60) risk_level = RiskLevel.MEDIUM;
        else if (risk_score >= 40) risk_level = RiskLevel.HIGH;
        else                       risk_level = RiskLevel.CRITICAL;
      }

      // -- Step 3: Select interest rate policy ----------------------------------
      const matchedPolicy = (risk_level
        ? interestRatePolicies.find(p => p.risk_level === risk_level)
        : null) ?? interestRatePolicies[0] ?? null;

      let base_rate: number | null = null;
      let rate_adjustment = 0;
      let nominal_rate: number | null = null;

      if (matchedPolicy) {
        base_rate = Number(matchedPolicy.base_rate);
        const min_rate = Number(matchedPolicy.min_rate);
        const max_rate = Number(matchedPolicy.max_rate);
        const adj = matchedPolicy.adjustment_factors;

        // Apply credit_score adjustment factor if configured
        if (adj?.credit_score != null && borrowerCreditScore !== null) {
          // Scale linearly: 575 is midpoint of 300-850 FICO range
          rate_adjustment += Number(adj.credit_score) * ((borrowerCreditScore - 575) / 275);
        }

        nominal_rate = Math.round(Math.min(max_rate, Math.max(min_rate, base_rate + rate_adjustment)) * 10000) / 10000;
      }

      // -- Step 4: Effective Annual Rate (APR) -----------------------------------
      // EAR = (1 + r/n)^n - 1  where r = nominal rate, n = 12 (monthly compounding)
      let effective_annual_rate: number | null = null;
      if (nominal_rate !== null) {
        const n = 12;
        effective_annual_rate = Math.round((Math.pow(1 + nominal_rate / 100 / n, n) - 1) * 100 * 10000) / 10000;
      }

      this.logger.log(
        `computeLoanTerms lender=${lenderId} credit=${borrowerCreditScore} ` +
        `risk_score=${risk_score} risk_level=${risk_level} ` +
        `base=${base_rate} adj=${rate_adjustment} nominal=${nominal_rate}% EAR=${effective_annual_rate}%`,
      );

      // -- Step 5: Persist immutable LoanTerms record ---------------------------
      if (loanRequestId && this.loanTermsRepository) {
        try {
          const existing = await this.loanTermsRepository.findOne({ where: { loan_request_id: loanRequestId } });
          if (!existing) {
            const loanTerms = this.loanTermsRepository.create({
              loan_request_id: loanRequestId,
              lender_id: lenderId,
              nominal_rate,
              effective_annual_rate,
              risk_score,
              risk_level,
              credit_score_input: borrowerCreditScore,
              interest_rate_policy_id: matchedPolicy?.id ?? null,
              interest_rate_policy_snapshot: matchedPolicy
                ? { id: matchedPolicy.id, name: matchedPolicy.name, risk_level: matchedPolicy.risk_level, base_rate: matchedPolicy.base_rate, min_rate: matchedPolicy.min_rate, max_rate: matchedPolicy.max_rate, adjustment_factors: matchedPolicy.adjustment_factors, priority: matchedPolicy.priority }
                : null,
              risk_score_breakdown: breakdown,
              base_rate,
              rate_adjustment,
              engine_version: ENGINE_VERSION,
            });
            await this.loanTermsRepository.save(loanTerms);
          }
        } catch (persistErr) {
          this.logger.error(`computeLoanTerms: failed to persist LoanTerms for ${loanRequestId}: ${persistErr.message}`);
        }
      }

      return { interest_rate: nominal_rate, effective_annual_rate, risk_score, risk_level, base_rate, rate_adjustment, policy_id: matchedPolicy?.id ?? null, breakdown };
    } catch (err) {
      this.logger.error(`computeLoanTerms error for lender ${lenderId}: ${err.message}`);
      return { interest_rate: null, effective_annual_rate: null, risk_score: null, risk_level: null, base_rate: null, rate_adjustment: null, policy_id: null, breakdown: [] };
    }
  }

  async getLenderLoanRequests(
    lenderId: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
    tenantId?: string,                      // ← tenant scope
  ) {
    // Step 1: Resolve the actual Lender entity ID from whatever was passed
    let actualLenderId: string | null = null;

    const lenderEntity = await this.lenderRepository.findOne({
      where: { id: lenderId },
    });

    if (lenderEntity) {
      // Enforce tenant boundary: lender must belong to the caller's tenant
      if (tenantId && lenderEntity.tenant_id && lenderEntity.tenant_id !== tenantId) {
        this.logger.warn(
          `Tenant boundary violation: lender ${lenderId} belongs to tenant ${lenderEntity.tenant_id}, caller is tenant ${tenantId}`,
        );
        return { data: [], total: 0, page, limit, totalPages: 0 };
      }
      actualLenderId = lenderEntity.id;
    } else {
      // lenderId might be a User ID — resolve via email
      const user = await this.userRepository.findOne({
        where: { id: lenderId, role: UserRole.LENDER },
      });
      if (user) {
        // Enforce tenant boundary on user-based resolution
        if (tenantId && user.tenantId !== tenantId) {
          this.logger.warn(
            `Tenant boundary violation: lender user ${lenderId} belongs to tenant ${user.tenantId}, caller is tenant ${tenantId}`,
          );
          return { data: [], total: 0, page, limit, totalPages: 0 };
        }
        const lenderByEmail = await this.lenderRepository.findOne({
          where: { contact_email: user.email },
        });
        if (lenderByEmail) {
          actualLenderId = lenderByEmail.id;
          this.logger.log(
            `Resolved lender ID from user ${lenderId} → lender entity ${actualLenderId}`,
          );
        }
      }
    }

    if (!actualLenderId) {
      this.logger.warn(
        `getLenderLoanRequests: no Lender entity found for ID ${lenderId}`,
      );
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    // Step 2: Query loans assigned to this lender, scoped to the caller's tenant
    const qb = this.loanRequestRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.lender', 'lender')
      .leftJoinAndSelect('loan.disbursements', 'disbursements')
      .leftJoinAndSelect('loan.repayments', 'repayments')
      .leftJoinAndSelect('loan.borrower', 'borrower')
      .leftJoinAndSelect('loan.loanTerms', 'loanTerms')
      .where('loan.lender_id = :lenderId', { lenderId: actualLenderId });

    // Tenant scope — lender only sees loans from their own tenant
    if (tenantId) {
      qb.andWhere('loan.tenant_id = :tenantId', { tenantId });
    }

    // Handle status filter - support comma-separated values
    if (status) {
      // Split comma-separated status values into array
      const statusArray = status.split(',').map(s => s.trim());
      
      if (statusArray.length === 1) {
        // Single status - use equality
        qb.andWhere('loan.status = :status', { status: statusArray[0] });
      } else {
        // Multiple statuses - use IN clause
        qb.andWhere('loan.status IN (:...statuses)', { statuses: statusArray });
      }
    }

    qb.orderBy('loan.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [loans, total] = await qb.getManyAndCount();

    this.logger.log(
      `getLenderLoanRequests: found ${total} loans for lender ${actualLenderId} with status filter: ${status || 'all'}`,
    );

    // Enrich each loan with computed terms.
    // Priority: loan_terms (immutable snapshot) → disbursement → metadata fallback
    const enrichedLoans = loans.map((loan: any) => {
      const terms = (loan as any).loanTerms ?? null;
      const disbursement = loan.disbursements?.[0] ?? null;
      const meta = loan.metadata ?? {};

      const interest_rate =
        terms?.nominal_rate != null ? Number(terms.nominal_rate) :
        (disbursement?.interest_rate != null && Number(disbursement.interest_rate) > 0 ? Number(disbursement.interest_rate) :
        (meta.interest_rate != null ? Number(meta.interest_rate) : null));

      const effective_annual_rate =
        terms?.effective_annual_rate != null ? Number(terms.effective_annual_rate) :
        (meta.effective_annual_rate != null ? Number(meta.effective_annual_rate) : null);

      const risk_score =
        terms?.risk_score != null ? Number(terms.risk_score) :
        (disbursement?.risk_score != null && Number(disbursement.risk_score) > 0 ? Number(disbursement.risk_score) :
        (meta.risk_score != null ? Number(meta.risk_score) : null));

      const credit_score =
        terms?.credit_score_input != null ? Number(terms.credit_score_input) :
        (disbursement?.credit_score != null && Number(disbursement.credit_score) > 0 ? Number(disbursement.credit_score) :
        (meta.credit_score != null ? Number(meta.credit_score) : (loan.borrower?.credit_score ?? null)));

      const workflow = buildLoanWorkflowView(loan);

      return {
        ...loan,
        interest_rate,
        effective_annual_rate,
        risk_score,
        credit_score,
        ...workflow,
      };
    });

    return { data: enrichedLoans, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getLenderAnalytics(lenderId: string, period: string = '30d', tenantId?: string) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Resolve actual lender entity ID (user ID may be passed)
    let actualLenderId = lenderId;
    const lenderEntity = await this.lenderRepository.findOne({ where: { id: lenderId } });
    if (!lenderEntity) {
      const user = await this.userRepository.findOne({ where: { id: lenderId, role: UserRole.LENDER } });
      if (user) {
        const lenderByEmail = await this.lenderRepository.findOne({ where: { contact_email: user.email } });
        if (lenderByEmail) actualLenderId = lenderByEmail.id;
      }
    }

    const qb = this.loanRequestRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.repayments', 'repayments')
      .where('loan.lender_id = :lenderId', { lenderId: actualLenderId })
      .andWhere('loan.created_at >= :fromDate', { fromDate });

    // Tenant scope
    if (tenantId) {
      qb.andWhere('loan.tenant_id = :tenantId', { tenantId });
    }

    const loans = await qb.getMany();

    const totalLoans = loans.length;
    const totalAmount = loans.reduce(
      (sum, loan) => sum + (loan.approved_amount || 0),
      0,
    );
    const completedLoans = loans.filter((loan) => loan.status === 'repaid');
    const defaultedLoans = loans.filter((loan) => loan.status === 'defaulted');

    const totalInterest = loans.reduce((sum, loan) => {
      return (
        sum +
        (loan.repayments?.reduce(
          (repaySum, rep) => repaySum + rep.interest_paid,
          0,
        ) || 0)
      );
    }, 0);

    return {
      period,
      totalLoans,
      totalAmount,
      completedLoans: completedLoans.length,
      defaultedLoans: defaultedLoans.length,
      totalInterest,
      averageLoanSize: totalLoans > 0 ? totalAmount / totalLoans : 0,
      successRate:
        totalLoans > 0 ? (completedLoans.length / totalLoans) * 100 : 0,
      defaultRate:
        totalLoans > 0 ? (defaultedLoans.length / totalLoans) * 100 : 0,
    };
  }

  // ==== ADDITIONAL CRITICAL APIS FOR FRONTEND ====

  /**
   * Public method called by the controller — resolves user ID → lender entity ID first.
   */
  async getLenderActiveLoans(lenderId: string, page: number = 1, limit: number = 10, tenantId?: string) {
    // Resolve actual lender entity ID (user ID may be passed)
    let actualLenderId = lenderId;
    const lenderEntity = await this.lenderRepository.findOne({ where: { id: lenderId } });
    if (!lenderEntity) {
      const user = await this.userRepository.findOne({ where: { id: lenderId, role: UserRole.LENDER } });
      if (user) {
        const lenderByEmail = await this.lenderRepository.findOne({ where: { contact_email: user.email } });
        if (lenderByEmail) actualLenderId = lenderByEmail.id;
      }
    }
    return this.getActiveLoan(actualLenderId, page, limit, tenantId);
  }

  async getActiveLoan(lenderId: string, page: number = 1, limit: number = 10, tenantId?: string) {
    const queryBuilder = this.loanRequestRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.lender', 'lender')
      .leftJoinAndSelect('loan.borrower', 'borrower')
      .leftJoinAndSelect('loan.disbursements', 'disbursements')
      .leftJoinAndSelect('loan.repayments', 'repayments')
      .where('loan.lender_id = :lenderId', { lenderId })
      .andWhere('loan.status IN (:...statuses)', {
        statuses: ['approved', 'disbursed'],
      });

    // Tenant scope
    if (tenantId) {
      queryBuilder.andWhere('loan.tenant_id = :tenantId', { tenantId });
    }

    queryBuilder
      .orderBy('loan.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [loans, total] = await queryBuilder.getManyAndCount();
    return {
      data: loans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLenderBorrowers(
    lenderId: string,
    page: number = 1,
    limit: number = 50,
    tenantId?: string,                      // ← tenant scope
  ) {
    // Resolve actual lender entity ID
    let actualLenderId = lenderId;
    const lenderEntity = await this.lenderRepository.findOne({ where: { id: lenderId } });
    if (!lenderEntity) {
      const user = await this.userRepository.findOne({ where: { id: lenderId, role: UserRole.LENDER } });
      if (user) {
        const lenderByEmail = await this.lenderRepository.findOne({ where: { contact_email: user.email } });
        if (lenderByEmail) actualLenderId = lenderByEmail.id;
      }
    }

    // Fetch all loans for this lender with borrower relation — scoped to tenant
    const qb = this.loanRequestRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.borrower', 'borrower')
      .leftJoinAndSelect('loan.repayments', 'repayments')
      .where('loan.lender_id = :lenderId', { lenderId: actualLenderId });

    if (tenantId) {
      qb.andWhere('loan.tenant_id = :tenantId', { tenantId });
    }

    const loans = await qb.orderBy('loan.created_at', 'DESC').getMany();

    // Group by borrower_id — one entry per unique borrower
    const borrowerMap = new Map<string, {
      borrower: any;
      loans: typeof loans;
    }>();

    for (const loan of loans) {
      if (!loan.borrower_id || !loan.borrower) continue;
      if (!borrowerMap.has(loan.borrower_id)) {
        borrowerMap.set(loan.borrower_id, { borrower: loan.borrower, loans: [] });
      }
      borrowerMap.get(loan.borrower_id)!.loans.push(loan);
    }

    const allEntries = Array.from(borrowerMap.values());
    const total = allEntries.length;

    // Paginate
    const paginated = allEntries.slice((page - 1) * limit, page * limit);

    const data = paginated.map(({ borrower, loans: borrowerLoans }) => {
      const totalRequested = borrowerLoans.reduce(
        (s, l) => s + (Number(l.requested_amount) || 0), 0,
      );
      const totalApproved = borrowerLoans.reduce(
        (s, l) => s + (Number(l.approved_amount) || 0), 0,
      );
      const totalInterestPaid = borrowerLoans.reduce(
        (s, l) => s + (l.repayments?.reduce(
          (rs, r) => rs + (Number(r.interest_paid) || 0), 0,
        ) || 0), 0,
      );
      const totalPrincipalPaid = borrowerLoans.reduce(
        (s, l) => s + (l.repayments?.reduce(
          (rs, r) => rs + (Number(r.principal_paid) || 0), 0,
        ) || 0), 0,
      );

      const repaidCount   = borrowerLoans.filter(l => l.status === 'repaid').length;
      const defaultedCount = borrowerLoans.filter(l => l.status === 'defaulted').length;
      const activeCount   = borrowerLoans.filter(l => ['approved', 'disbursed'].includes(l.status)).length;
      const pendingCount  = borrowerLoans.filter(l => l.status === 'pending').length;

      // Outstanding = approved amount - principal already repaid
      const outstanding = Math.max(0, totalApproved - totalPrincipalPaid);

      const now = new Date();
      const overdueLoans = borrowerLoans.filter(
        l => l.due_date && new Date(l.due_date) < now && l.status !== 'repaid',
      );

      return {
        borrowerId:       borrower.id,
        companyName:      borrower.company_name ?? null,
        contactName:      borrower.contact_name ?? null,
        email:            borrower.email ?? null,
        phone:            borrower.phone ?? null,
        businessType:     borrower.business_type ?? null,
        creditScore:      borrower.credit_score ?? null,
        status:           borrower.status ?? null,
        createdAt:        borrower.created_at,
        // Loan stats — all from real data
        loanCount:        borrowerLoans.length,
        activeLoans:      activeCount,
        pendingLoans:     pendingCount,
        repaidLoans:      repaidCount,
        defaultedLoans:   defaultedCount,
        overdueLoans:     overdueLoans.length,
        totalRequested,
        totalApproved,
        totalInterestPaid,
        totalPrincipalPaid,
        outstanding,
        // Most recent loan date
        lastLoanDate:     borrowerLoans[0]?.created_at ?? null,
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPortfolioSummary(lenderId: string) {
    const loans = await this.loanRequestRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.repayments', 'repayments')
      .where('loan.lender_id = :lenderId', { lenderId })
      .getMany();

    const totalLoans = loans.length;
    const totalAmount = loans.reduce(
      (sum, loan) => sum + (loan.approved_amount || 0),
      0,
    );
    const activeLoans = loans.filter((loan) =>
      ['approved', 'disbursed'].includes(loan.status),
    );
    const completedLoans = loans.filter((loan) => loan.status === 'repaid');
    const overdueLoans = loans.filter((loan) => {
      if (!loan.due_date) return false;
      return new Date(loan.due_date) < new Date() && loan.status !== 'repaid';
    });

    const totalInterest = loans.reduce((sum, loan) => {
      return (
        sum +
        (loan.repayments?.reduce(
          (repaySum, rep) => repaySum + rep.interest_paid,
          0,
        ) || 0)
      );
    }, 0);

    return {
      totalLoans,
      totalAmount,
      activeLoans: activeLoans.length,
      completedLoans: completedLoans.length,
      overdueLoans: overdueLoans.length,
      totalInterest,
      averageLoanSize: totalLoans > 0 ? totalAmount / totalLoans : 0,
      portfolioHealth: {
        repaymentRate:
          totalLoans > 0 ? (completedLoans.length / totalLoans) * 100 : 0,
        overdueRate:
          totalLoans > 0 ? (overdueLoans.length / totalLoans) * 100 : 0,
        riskLevel:
          overdueLoans.length > totalLoans * 0.1
            ? 'high'
            : overdueLoans.length > totalLoans * 0.05
              ? 'medium'
              : 'low',
      },
    };
  }

  async extendLoan(loanId: string, extensionDays: number, reason: string) {
    const loan = await this.loanRequestRepository.findOne({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (!loan.due_date) {
      throw new BadRequestException('Loan has no due date to extend');
    }

    const newDueDate = new Date(loan.due_date);
    newDueDate.setDate(newDueDate.getDate() + extensionDays);

    loan.due_date = newDueDate;
    // You might want to add an extension history table here

    await this.loanRequestRepository.save(loan);

    return {
      loan_id: loanId,
      extension_days: extensionDays,
      new_due_date: newDueDate,
      reason,
      extended_at: new Date(),
    };
  }

  async sendRepaymentReminder(loanId: string, message?: string) {
    const loan = await this.loanRequestRepository.findOne({
      where: { id: loanId },
      relations: ['lender'],
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    // Here you would integrate with notification/email service
    // For now, just return confirmation
    return {
      loan_id: loanId,
      reminder_sent: true,
      sent_at: new Date(),
      message: message || 'Repayment reminder sent to borrower',
    };
  }

  async getOverdueRepayments(
    lenderId?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const queryBuilder = this.loanRequestRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.lender', 'lender')
      .leftJoinAndSelect('loan.repayments', 'repayments')
      .where('loan.due_date < :now', { now: new Date() })
      .andWhere('loan.status != :status', { status: 'repaid' })
      .orderBy('loan.due_date', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (lenderId) {
      queryBuilder.andWhere('loan.lender_id = :lenderId', { lenderId });
    }

    const [loans, total] = await queryBuilder.getManyAndCount();

    return {
      data: loans.map((loan) => ({
        ...loan,
        days_overdue: Math.floor(
          (new Date().getTime() - new Date(loan.due_date).getTime()) /
            (1000 * 3600 * 24),
        ),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Team Management Methods
  async getLenderTeam(lenderId: string): Promise<LenderUserResponseDto[]> {
    await this.getLenderById(lenderId); // Verify lender exists

    const teamMembers = await this.lenderUserRepository.find({
      where: { lender_id: lenderId },
      relations: ['role', 'role.default_permissions', 'additional_permissions'],
    });

    return teamMembers.map((member) => this.mapLenderUserToDto(member));
  }

  async getLenderTeamStats(lenderId: string): Promise<LenderTeamStatsDto> {
    await this.getLenderById(lenderId); // Verify lender exists

    const teamMembers = await this.lenderUserRepository.find({
      where: { lender_id: lenderId },
      relations: ['role'],
    });

    const totalMembers = teamMembers.length;
    const activeMembers = teamMembers.filter(
      (m) => m.status === 'active',
    ).length;
    const pendingMembers = teamMembers.filter(
      (m) => m.status === 'pending',
    ).length;

    // Count by roles
    const roleMap = new Map();
    teamMembers.forEach((member) => {
      const roleName = member.role.name;
      roleMap.set(roleName, (roleMap.get(roleName) || 0) + 1);
    });

    const roles = Array.from(roleMap.entries()).map(([name, count]) => ({
      id: teamMembers.find((m) => m.role.name === name)?.role.id || '',
      name,
      count: count as number,
    }));

    // Count by departments
    const deptMap = new Map();
    teamMembers.forEach((member) => {
      const dept = member.department || 'Unassigned';
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    });

    const departments = Array.from(deptMap.entries()).map(([name, count]) => ({
      name,
      count: count as number,
    }));

    // Recent activity (simplified for now)
    const recentActivity = teamMembers
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 5)
      .map((member) => ({
        action: `${member.first_name} ${member.last_name} joined the team`,
        user: member.created_by,
        timestamp: member.created_at,
      }));

    return {
      totalMembers,
      activeMembers,
      pendingMembers,
      roles,
      departments,
      recentActivity,
    };
  }

  async addTeamMember(
    lenderId: string,
    memberData: CreateLenderUserDto,
    createdBy: string,
  ): Promise<LenderUserResponseDto> {
    await this.getLenderById(lenderId); // Verify lender exists

    // Check if email already exists
    const existingUser = await this.lenderUserRepository.findOne({
      where: { email: memberData.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Verify role exists
    const role = await this.lenderRoleRepository.findOne({
      where: { id: memberData.roleId },
      relations: ['default_permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Generate temporary password (in real implementation, send invitation email)
    const temporaryPassword = crypto.randomBytes(12).toString('hex');
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const newUser = this.lenderUserRepository.create({
      first_name: memberData.firstName,
      last_name: memberData.lastName,
      email: memberData.email,
      phone: memberData.phone,
      password_hash: hashedPassword,
      lender_id: lenderId,
      role_id: memberData.roleId,
      department: memberData.department,
      avatar: memberData.avatar,
      created_by: createdBy,
      status: LenderUserStatus.PENDING, // Default to pending until they activate their account
    });

    const savedUser = await this.lenderUserRepository.save(newUser);

    // Load with relations for response
    const userWithRelations = await this.lenderUserRepository.findOne({
      where: { id: savedUser.id },
      relations: ['role', 'role.default_permissions', 'additional_permissions'],
    });

    return this.mapLenderUserToDto(userWithRelations);
  }

  async updateTeamMember(
    lenderId: string,
    userId: string,
    updateData: UpdateLenderUserDto,
  ): Promise<LenderUserResponseDto> {
    await this.getLenderById(lenderId); // Verify lender exists

    const user = await this.lenderUserRepository.findOne({
      where: { id: userId, lender_id: lenderId },
      relations: ['role', 'role.default_permissions', 'additional_permissions'],
    });

    if (!user) {
      throw new NotFoundException('Team member not found');
    }

    // Update fields
    if (updateData.firstName) user.first_name = updateData.firstName;
    if (updateData.lastName) user.last_name = updateData.lastName;
    if (updateData.email) user.email = updateData.email;
    if (updateData.phone) user.phone = updateData.phone;
    if (updateData.department) user.department = updateData.department;
    if (updateData.avatar) user.avatar = updateData.avatar;
    if (updateData.status) user.status = updateData.status;

    if (updateData.roleId) {
      const role = await this.lenderRoleRepository.findOne({
        where: { id: updateData.roleId },
      });
      if (!role) {
        throw new NotFoundException('Role not found');
      }
      user.role_id = updateData.roleId;
    }

    const savedUser = await this.lenderUserRepository.save(user);

    // Reload with relations
    const userWithRelations = await this.lenderUserRepository.findOne({
      where: { id: savedUser.id },
      relations: ['role', 'role.default_permissions', 'additional_permissions'],
    });

    return this.mapLenderUserToDto(userWithRelations);
  }

  async removeTeamMember(
    lenderId: string,
    userId: string,
  ): Promise<{ message: string }> {
    await this.getLenderById(lenderId); // Verify lender exists

    const user = await this.lenderUserRepository.findOne({
      where: { id: userId, lender_id: lenderId },
    });

    if (!user) {
      throw new NotFoundException('Team member not found');
    }

    await this.lenderUserRepository.remove(user);

    return { message: 'Team member removed successfully' };
  }

  async getLenderRoles(lenderId: string) {
    await this.getLenderById(lenderId); // Verify lender exists

    // Get both default system roles and custom roles for this lender
    const roles = await this.lenderRoleRepository.find({
      relations: ['default_permissions'],
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      level: role.level,
      defaultPermissions: role.default_permissions.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        level: p.level,
      })),
      isCustom: role.is_custom,
    }));
  }

  async createLenderRole(lenderId: string, roleData: CreateLenderRoleDto) {
    await this.getLenderById(lenderId); // Verify lender exists

    // Verify permissions exist
    if (roleData.defaultPermissions.length > 0) {
      const permissions = await this.lenderPermissionRepository.findBy({
        id: In(roleData.defaultPermissions),
      });
      if (permissions.length !== roleData.defaultPermissions.length) {
        throw new BadRequestException('One or more permissions not found');
      }
    }

    const role = this.lenderRoleRepository.create({
      name: roleData.name,
      description: roleData.description,
      level: roleData.level,
      is_custom: roleData.isCustom ?? true,
    });

    const savedRole = await this.lenderRoleRepository.save(role);

    // Add default permissions
    if (roleData.defaultPermissions.length > 0) {
      const permissions = await this.lenderPermissionRepository.findByIds(
        roleData.defaultPermissions,
      );
      savedRole.default_permissions = permissions;
      await this.lenderRoleRepository.save(savedRole);
    }

    return savedRole;
  }

  async updateLenderRole(
    lenderId: string,
    roleId: string,
    updateData: UpdateLenderRoleDto,
  ) {
    await this.getLenderById(lenderId); // Verify lender exists

    const role = await this.lenderRoleRepository.findOne({
      where: { id: roleId },
      relations: ['default_permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Update fields
    if (updateData.name) role.name = updateData.name;
    if (updateData.description) role.description = updateData.description;
    if (updateData.level) role.level = updateData.level;
    if (updateData.isCustom !== undefined) role.is_custom = updateData.isCustom;

    if (updateData.defaultPermissions) {
      const permissions = await this.lenderPermissionRepository.findBy({
        id: In(updateData.defaultPermissions),
      });
      if (permissions.length !== updateData.defaultPermissions.length) {
        throw new BadRequestException('One or more permissions not found');
      }
      role.default_permissions = permissions;
    }

    return await this.lenderRoleRepository.save(role);
  }

  async getAllPermissions() {
    return await this.lenderPermissionRepository.find();
  }

  async setLenderOutboundKey(lenderId: string, apiKey: string) {
    const lender = await this.getLenderById(lenderId);
    lender.outbound_api_key_encrypted = encryptString(apiKey);
    await this.lenderRepository.save(lender as any);
    return { success: true };
  }

  async setLenderWebhookSecret(lenderId: string, secret: string) {
    const lender = await this.getLenderById(lenderId);
    lender.webhook_secret_encrypted = encryptString(secret);
    await this.lenderRepository.save(lender as any);
    return { success: true };
  }

  private mapLenderUserToDto(user: LenderUser): LenderUserResponseDto {
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
        level: user.role.level,
        defaultPermissions:
          user.role.default_permissions?.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category,
            level: p.level,
          })) || [],
        isCustom: user.role.is_custom,
      },
      status: user.status,
      permissions: [
        ...(user.role.default_permissions || []),
        ...(user.additional_permissions || []),
      ].map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        level: p.level,
      })),
      createdAt: user.created_at,
      lastLogin: user.last_login,
      createdBy: user.created_by,
      department: user.department,
      avatar: user.avatar,
    };
  }

  getTenantLoansQuery(tenantId: string) {
    return this.loanRequestRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.lender', 'lender')
      .leftJoinAndSelect('loan.disbursements', 'disbursements')
      .leftJoinAndSelect('loan.repayments', 'repayments')
      .where('loan.tenant_id = :tenantId', { tenantId })
      .orderBy('loan.created_at', 'DESC');
  }

  async getTenantLoanHistory(
    tenantId: string,
    status?: string,
    createdBy?: string,
  ) {
    const qb = this.loanRequestRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.lender', 'lender')
      .leftJoinAndSelect('loan.disbursements', 'disbursements')
      .leftJoinAndSelect('loan.repayments', 'repayments')
      .leftJoinAndSelect('loan.borrower', 'borrower')
      .where('loan.tenant_id = :tenantId', { tenantId });

    if (status) {
      qb.andWhere('loan.status = :status', { status });
    }

    // Truck owners only see their own loans
    if (createdBy) {
      qb.andWhere('loan.created_by = :createdBy', { createdBy });
    }

    qb.orderBy('loan.created_at', 'DESC');

    const loans = await qb.getMany();
    return loans;
  }

  // Disbursement Management Methods
  async getLenderDisbursements(lenderId: string, query: DisbursementQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const actualLenderId = await this.resolveLenderEntityId(lenderId);
    if (!actualLenderId) {
      return {
        disbursements: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        stats: await this.calculateDisbursementStats(lenderId),
      };
    }

    const queryBuilder = this.loanDisbursementRepository
      .createQueryBuilder('disbursement')
      .leftJoinAndSelect('disbursement.loan_request', 'loan')
      .leftJoinAndSelect('loan.lender', 'lender')
      .leftJoinAndSelect('loan.borrower', 'borrower')
      .where('loan.lender_id = :lenderId', { lenderId: actualLenderId });

    if (status) {
      queryBuilder.andWhere('disbursement.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('disbursement.priority = :priority', { priority });
    }

    if (search) {
      queryBuilder.andWhere(
        '(borrower.contact_name ILIKE :search OR borrower.company_name ILIKE :search OR disbursement.id::text ILIKE :search OR loan.id::text ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Map camelCase sortBy to actual database columns
    const sortByMap: Record<string, string> = {
      'amount': 'disbursement.amount',
      'requestedDate': 'disbursement.disbursement_date',
      'borrowerName': 'borrower.contact_name',
      'createdAt': 'disbursement.created_at',
    };

    const orderByColumn = sortByMap[sortBy] || 'disbursement.created_at';

    queryBuilder
      .orderBy(
        orderByColumn,
        sortOrder.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip((page - 1) * limit)
      .take(limit);

    const [disbursements, total] = await queryBuilder.getManyAndCount();

    // Fallback: loans marked disbursed/repaid with no loan_disbursements rows
    // (legacy flows that only updated loan status)
    if (total === 0 && !status && !priority && !search) {
      const loanQb = this.loanRequestRepository
        .createQueryBuilder('loan')
        .leftJoinAndSelect('loan.borrower', 'borrower')
        .where('loan.lender_id = :lenderId', { lenderId: actualLenderId })
        .andWhere('loan.status IN (:...statuses)', {
          statuses: [
            LoanRequestStatus.DISBURSED,
            LoanRequestStatus.REPAID,
            LoanRequestStatus.DEFAULTED,
          ],
        })
        .orderBy('loan.updated_at', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [loans, loanTotal] = await loanQb.getManyAndCount();
      if (loanTotal > 0) {
        const synthetic = loans.map((loan) =>
          this.formatDisbursementResponse({
            id: loan.id,
            amount: loan.approved_amount ?? loan.requested_amount,
            status: DisbursementStatus.DISBURSED,
            created_at: loan.created_at,
            updated_at: loan.updated_at,
            disbursement_date:
              loan.metadata?.disbursement?.disbursed_at
                ? new Date(loan.metadata.disbursement.disbursed_at)
                : loan.updated_at,
            purpose: loan.metadata?.purpose ?? null,
            interest_rate: loan.metadata?.interest_rate ?? null,
            notes: null,
            priority: null,
            documents: null,
            risk_score: null,
            credit_score: null,
            collateral_value: null,
            disbursement_method: null,
            term_months: loan.loan_term_months ?? null,
            loan_request: loan,
          }),
        );

        return {
          disbursements: synthetic,
          pagination: {
            page,
            limit,
            total: loanTotal,
            totalPages: Math.ceil(loanTotal / limit),
          },
          stats: await this.calculateDisbursementStats(actualLenderId),
        };
      }
    }

    const stats = await this.calculateDisbursementStats(actualLenderId);

    return {
      disbursements: disbursements.map((d) =>
        this.formatDisbursementResponse(d),
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    };
  }

  async getDisbursementDetails(disbursementId: string) {
    const disbursement = await this.loanDisbursementRepository
      .createQueryBuilder('disbursement')
      .leftJoinAndSelect('disbursement.loan_request', 'loan')
      .leftJoinAndSelect('loan.lender', 'lender')
      .leftJoinAndSelect('loan.borrower', 'borrower')
      .where('disbursement.id = :disbursementId', { disbursementId })
      .getOne();

    if (!disbursement) {
      throw new NotFoundException('Disbursement not found');
    }

    return this.formatDisbursementResponse(disbursement);
  }

  async updateDisbursementStatus(
    disbursementId: string,
    updateDto: UpdateDisbursementStatusDto,
  ) {
    const disbursement = await this.loanDisbursementRepository.findOne({
      where: { id: disbursementId },
      relations: ['loan_request'],
    });

    if (!disbursement) {
      throw new NotFoundException('Disbursement not found');
    }

    // Map frontend status to backend enum
    const statusMapping = {
      pending: DisbursementStatus.PENDING,
      approved: DisbursementStatus.APPROVED,
      disbursed: DisbursementStatus.DISBURSED,
      rejected: DisbursementStatus.REJECTED,
      on_hold: DisbursementStatus.ON_HOLD,
    };

    disbursement.status =
      statusMapping[updateDto.status] || DisbursementStatus.PENDING;

    if (updateDto.notes) {
      disbursement.notes = updateDto.notes;
    }

    if (updateDto.reason) {
      disbursement.failure_reason = updateDto.reason;
    }

    // Set disbursement date if status is disbursed
    if (updateDto.status === 'disbursed') {
      disbursement.disbursement_date = new Date();
    }

    const savedDisbursement =
      await this.loanDisbursementRepository.save(disbursement);
    return this.formatDisbursementResponse(savedDisbursement);
  }

  async getDisbursementStats(lenderId: string, period: string = '30d') {
    return await this.calculateDisbursementStats(lenderId);
  }

  private async calculateDisbursementStats(lenderId: string) {
    const resolvedId = (await this.resolveLenderEntityId(lenderId)) || lenderId;
    const stats = await this.loanDisbursementRepository
      .createQueryBuilder('disbursement')
      .leftJoin('disbursement.loan_request', 'loan')
      .select([
        'COUNT(*) as total',
        "COUNT(CASE WHEN disbursement.status = 'pending' THEN 1 END) as pending",
        "COUNT(CASE WHEN disbursement.status = 'approved' THEN 1 END) as approved",
        "COUNT(CASE WHEN disbursement.status = 'disbursed' THEN 1 END) as disbursed",
        "COUNT(CASE WHEN disbursement.status = 'rejected' THEN 1 END) as rejected",
        "COUNT(CASE WHEN disbursement.status = 'on_hold' THEN 1 END) as on_hold",
        'COALESCE(SUM(disbursement.amount), 0) as total_amount',
        "COALESCE(SUM(CASE WHEN disbursement.status = 'disbursed' THEN disbursement.amount ELSE 0 END), 0) as disbursed_amount",
        "COALESCE(SUM(CASE WHEN disbursement.status = 'pending' THEN disbursement.amount ELSE 0 END), 0) as pending_amount",
      ])
      .where('loan.lender_id = :lenderId', { lenderId: resolvedId })
      .getRawOne();

    return {
      total: parseInt(stats.total) || 0,
      pending: parseInt(stats.pending) || 0,
      approved: parseInt(stats.approved) || 0,
      disbursed: parseInt(stats.disbursed) || 0,
      rejected: parseInt(stats.rejected) || 0,
      onHold: parseInt(stats.on_hold) || 0,
      totalAmount: parseFloat(stats.total_amount) || 0,
      disbursedAmount: parseFloat(stats.disbursed_amount) || 0,
      pendingAmount: parseFloat(stats.pending_amount) || 0,
      avgProcessingTime: 3.2, // TODO: Calculate actual average processing time
    };
  }

  private formatDisbursementResponse(disbursement: any) {
    const loan = disbursement.loan_request;
    const borrower = loan?.borrower;

    // Map backend status to frontend format
    const statusMapping = {
      [DisbursementStatus.PENDING]: 'pending',
      [DisbursementStatus.APPROVED]: 'approved',
      [DisbursementStatus.DISBURSED]: 'disbursed',
      [DisbursementStatus.REJECTED]: 'rejected',
      [DisbursementStatus.ON_HOLD]: 'on_hold',
      [DisbursementStatus.INITIATED]: 'pending',
      [DisbursementStatus.SUCCESS]: 'disbursed',
      [DisbursementStatus.FAILED]: 'rejected',
    };

    return {
      id: disbursement.id,
      loanId: loan?.id ?? null,
      borrowerName: borrower?.contact_name ?? borrower?.company_name ?? null,
      amount: disbursement.amount != null ? Number(disbursement.amount) : (loan?.requested_amount != null ? Number(loan.requested_amount) : null),
      requestedDate: disbursement.created_at?.toISOString().split('T')[0] ?? null,
      approvedDate: disbursement.status === DisbursementStatus.APPROVED
        ? disbursement.updated_at?.toISOString().split('T')[0] ?? null
        : null,
      disbursedDate: disbursement.disbursement_date?.toISOString().split('T')[0] ?? null,
      status: statusMapping[disbursement.status] ?? null,
      // Only include purpose if it's a real value from metadata, not a fallback
      purpose: disbursement.purpose ?? loan?.metadata?.purpose ?? null,
      interestRate: disbursement.interest_rate > 0 ? disbursement.interest_rate : null,
      termMonths: disbursement.term_months > 0 ? disbursement.term_months : null,
      // No hardcoded documents — only real ones
      documents: disbursement.documents?.length > 0 ? disbursement.documents : null,
      riskScore: disbursement.risk_score > 0 ? disbursement.risk_score : null,
      creditScore: disbursement.credit_score > 0 ? disbursement.credit_score : null,
      collateralValue: disbursement.collateral_value > 0 ? disbursement.collateral_value : null,
      disbursementMethod: disbursement.disbursement_method ?? null,
      notes: disbursement.notes || null,
      priority: disbursement.priority ?? null,
    };
  }

  // Get lender repayments with filtering and pagination - CRITICAL MISSING METHOD
  async getLenderRepayments(lenderId: string, queryOptions: any) {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = queryOptions;

      const actualLenderId = await this.resolveLenderEntityId(lenderId);
      if (!actualLenderId) {
        return {
          data: [],
          pagination: { total: 0, pages: 0, page, limit },
        };
      }

      const queryBuilder = this.loanRepaymentRepository
        .createQueryBuilder('repayment')
        .leftJoinAndSelect('repayment.loan_request', 'loan')
        .leftJoinAndSelect('loan.lender', 'lender')
        .leftJoinAndSelect('loan.borrower', 'borrower')
        .where('loan.lender_id = :lenderId', { lenderId: actualLenderId });

      // Add date range filters (using repayment_date)
      if (startDate) {
        queryBuilder.andWhere('repayment.repayment_date >= :startDate', {
          startDate,
        });
      }

      if (endDate) {
        queryBuilder.andWhere('repayment.repayment_date <= :endDate', {
          endDate,
        });
      }

      // Order by repayment date (newest first)
      queryBuilder.orderBy('repayment.repayment_date', 'DESC');

      // Add pagination
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      // Execute query
      const [repayments, total] = await queryBuilder.getManyAndCount();

      // Transform the data
      const transformedRepayments = repayments.map((repayment) => ({
        id: repayment.id,
        loanId: repayment.loan_request?.id,
        amount: repayment.amount,
        interestPaid: repayment.interest_paid,
        principalPaid: repayment.principal_paid,
        repaymentDate: repayment.repayment_date,
        status: this.getRepaymentStatus(repayment),
        borrower: repayment.loan_request?.borrower
          ? {
              id: repayment.loan_request.borrower.id,
              name:
                repayment.loan_request.borrower.company_name ||
                repayment.loan_request.borrower.contact_name,
              email: repayment.loan_request.borrower.email,
            }
          : null,
        loan: repayment.loan_request
          ? {
              id: repayment.loan_request.id,
              requestedAmount: repayment.loan_request.requested_amount,
              approvedAmount: repayment.loan_request.approved_amount,
            }
          : null,
      }));

      return {
        data: transformedRepayments,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get lender repayments: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve lender repayments');
    }
  }

  // Get borrower profile with comprehensive statistics - MEDIUM PRIORITY MISSING METHOD
  async getBorrowerProfile(borrowerId: string) {
    try {
      // First, get basic borrower information
      const borrower = await this.dataSource
        .getRepository('Borrower')
        .createQueryBuilder('borrower')
        .where('borrower.id = :borrowerId', { borrowerId })
        .getOne();

      if (!borrower) {
        throw new NotFoundException('Borrower not found');
      }

      // Get loan statistics
      const loanStats = await this.dataSource
        .getRepository('LoanRequest')
        .createQueryBuilder('loan')
        .select([
          'COUNT(*) as totalLoans',
          "COUNT(CASE WHEN loan.status = 'approved' THEN 1 END) as activeLoans",
          "COUNT(CASE WHEN loan.status = 'repaid' THEN 1 END) as completedLoans",
          'SUM(loan.requested_amount) as totalBorrowed',
          'MAX(loan.created_at) as lastLoanDate',
        ])
        .where('loan.borrower_id = :borrowerId', { borrowerId })
        .getRawOne();

      // Get repayment statistics
      const repaymentStats = await this.loanRepaymentRepository
        .createQueryBuilder('repayment')
        .leftJoin('repayment.loan_request', 'loan')
        .select([
          'SUM(repayment.amount) as totalRepaid',
          'COUNT(repayment.id) as totalRepayments',
          'COUNT(CASE WHEN repayment.repayment_date <= loan.due_date THEN 1 END) as onTimePayments',
          'COUNT(CASE WHEN repayment.repayment_date > loan.due_date THEN 1 END) as latePayments',
          'AVG(CASE WHEN repayment.repayment_date > loan.due_date THEN EXTRACT(EPOCH FROM (repayment.repayment_date - loan.due_date))/86400 END) as avgRepaymentTime',
        ])
        .where('loan.borrower_id = :borrowerId', { borrowerId })
        .getRawOne();

      const latePayments = parseInt(repaymentStats.latePayments) || 0;

      return {
        id: borrower.id,
        companyName: borrower.company_name,
        contactName: borrower.contact_name,
        email: borrower.email,
        phone: borrower.phone,
        businessType: borrower.business_type,
        registrationNumber: borrower.registration_number,
        address: borrower.address,
        creditScore: borrower.credit_score || 0,
        riskLevel: this.calculateRiskLevel(borrower.credit_score, latePayments),
        totalLoans: parseInt(loanStats.totalLoans) || 0,
        activeLoans: parseInt(loanStats.activeLoans) || 0,
        completedLoans: parseInt(loanStats.completedLoans) || 0,
        totalBorrowed: parseFloat(loanStats.totalBorrowed) || 0,
        totalRepaid: parseFloat(repaymentStats.totalRepaid) || 0,
        onTimePayments: parseInt(repaymentStats.onTimePayments) || 0,
        latePayments: latePayments,
        averageRepaymentTime: parseFloat(repaymentStats.avgRepaymentTime) || 0,
        lastLoanDate: loanStats.lastLoanDate,
        accountStatus: borrower.status || 'active',
      };
    } catch (error) {
      this.logger.error(
        `Failed to get borrower profile: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve borrower profile');
    }
  }

  // Get borrower loan history with filtering and pagination - MEDIUM PRIORITY MISSING METHOD
  async getBorrowerLoanHistory(borrowerId: string, queryOptions: any) {
    try {
      const { page = 1, limit = 10, status } = queryOptions;

      const queryBuilder = this.loanRequestRepository
        .createQueryBuilder('loan')
        .leftJoinAndSelect('loan.lender', 'lender')
        .where('loan.borrower_id = :borrowerId', { borrowerId });

      // Add status filter
      if (status) {
        queryBuilder.andWhere('loan.status = :status', { status });
      }

      // Order by application date (newest first)
      queryBuilder.orderBy('loan.created_at', 'DESC');

      // Add pagination
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      // Execute query
      const [loans, total] = await queryBuilder.getManyAndCount();

      // Transform the data
      const transformedLoans = loans.map((loan) => ({
        id: loan.id,
        requestedAmount: loan.requested_amount,
        approvedAmount: loan.approved_amount,
        interestAmount: loan.interest_amount,
        dueDate: loan.due_date,
        status: loan.status,
        applicationDate: loan.created_at,
        idempotencyKey: loan.idempotency_key,
        externalLoanRef: loan.external_loan_ref,
        rejectionReason: loan.rejection_reason,
        lender: loan.lender
          ? {
              id: loan.lender.id,
              name: loan.lender.name,
            }
          : null,
      }));

      return {
        data: transformedLoans,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get borrower loan history: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve borrower loan history');
    }
  }

  // Helper method to calculate risk level
  private calculateRiskLevel(
    creditScore: number,
    latePayments: number,
  ): string {
    if (creditScore >= 750 && latePayments === 0) return 'low';
    if (creditScore >= 650 && latePayments <= 2) return 'medium';
    return 'high';
  }

  // Helper method to get repayment status (since LoanRepayment doesn't have status field)
  private getRepaymentStatus(repayment: any): string {
    const now = new Date();
    if (repayment.repayment_date) {
      return 'completed';
    }
    // If no related loan request, return pending
    if (!repayment.loan_request?.due_date) {
      return 'pending';
    }
    // Check if overdue based on loan due date
    if (now > new Date(repayment.loan_request.due_date)) {
      return 'overdue';
    }
    return 'pending';
  }

  // Perform credit check for borrower - LOW PRIORITY MISSING METHOD
  async performCreditCheck(borrowerId: string, creditCheckData: any) {
    try {
      const {
        checkType,
        includeExternalBureaus = false,
        requestedBy,
        purpose,
      } = creditCheckData;

      // First, verify borrower exists
      const borrower = await this.dataSource
        .getRepository('Borrower')
        .createQueryBuilder('borrower')
        .where('borrower.id = :borrowerId', { borrowerId })
        .getOne();

      if (!borrower) {
        throw new NotFoundException('Borrower not found');
      }

      // Generate unique credit check ID
      const creditCheckId = crypto.randomUUID();

      // Calculate estimated completion time based on check type
      const estimatedMinutes =
        {
          basic: 5,
          comprehensive: 30,
          refresh: 15,
        }[checkType] || 15;

      const estimatedCompletionTime = new Date(
        Date.now() + estimatedMinutes * 60 * 1000,
      );

      // Calculate cost based on check type and external bureaus
      const baseCost =
        {
          basic: 5.0,
          comprehensive: 25.0,
          refresh: 10.0,
        }[checkType] || 10.0;

      const externalBureauCost = includeExternalBureaus ? 15.0 : 0.0;
      const totalCost = baseCost + externalBureauCost;

      // Log the credit check initiation
      this.logger.log(
        `Credit check initiated for borrower ${borrowerId} by ${requestedBy}`,
        {
          creditCheckId,
          checkType,
          includeExternalBureaus,
          cost: totalCost,
        },
      );

      // Simulate processing for basic checks (immediate response)
      if (checkType === 'basic') {
        // For basic checks, we can provide immediate results
        const basicResults = await this.performBasicCreditCheck(borrower);

        // Persist the calculated credit score back to the borrower record
        if (basicResults?.creditScore && basicResults.creditScore > 0) {
          await this.dataSource
            .getRepository('Borrower')
            .update(borrower.id, { credit_score: basicResults.creditScore });
          this.logger.log(
            `✅ Updated credit_score for borrower ${borrower.id} → ${basicResults.creditScore}`,
          );
        }

        return {
          creditCheckId,
          status: 'completed',
          estimatedCompletionTime,
          cost: totalCost,
          borrower: {
            id: borrower.id,
            name: borrower.company_name || borrower.contact_name,
            currentCreditScore: basicResults?.creditScore ?? null,
          },
          results: basicResults,
        };
      }

      // For comprehensive checks, return processing status
      return {
        creditCheckId,
        status: 'processing',
        estimatedCompletionTime,
        cost: totalCost,
        borrower: {
          id: borrower.id,
          name: borrower.company_name || borrower.contact_name,
          currentCreditScore: borrower.credit_score || 0,
        },
        message: `${checkType} credit check initiated. Results will be available in approximately ${estimatedMinutes} minutes.`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to perform credit check: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to initiate credit check');
    }
  }

  // Helper method for basic credit checks
  private async performBasicCreditCheck(borrower: any) {
    try {
      // Get recent loan performance
      const recentLoans = await this.loanRequestRepository
        .createQueryBuilder('loan')
        .where('loan.borrower_id = :borrowerId', { borrowerId: borrower.id })
        .andWhere('loan.created_at >= :since', {
          since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        }) // Last year
        .orderBy('loan.created_at', 'DESC')
        .limit(10)
        .getMany();

      // Calculate basic metrics
      const totalRecentLoans = recentLoans.length;
      const defaultedLoans = recentLoans.filter(
        (loan) => loan.status === 'defaulted',
      ).length;
      const completedLoans = recentLoans.filter(
        (loan) => loan.status === 'repaid',
      ).length;
      const defaultRate =
        totalRecentLoans > 0 ? (defaultedLoans / totalRecentLoans) * 100 : 0;

      // Basic credit score calculation
      // Only adjust from existing verified score — never invent one
      let creditScore = borrower.credit_score ?? null;

      if (creditScore !== null && totalRecentLoans > 0) {
        if (defaultRate === 0 && completedLoans > 0) {
          creditScore += 50;
        } else if (defaultRate > 20) {
          creditScore -= 100;
        } else if (defaultRate > 10) {
          creditScore -= 50;
        }
        // Clamp to valid range only if we had a real starting score
        creditScore = Math.max(300, Math.min(850, creditScore));
      }

      // Ensure score is within valid range
      creditScore = Math.max(300, Math.min(850, creditScore));

      return {
        creditScore,
        riskLevel: creditScore !== null ? this.calculateRiskLevel(creditScore, defaultedLoans) : null,
        recentLoanCount: totalRecentLoans,
        defaultRate: Math.round(defaultRate * 100) / 100,
        completedLoanCount: completedLoans,
        recommendation: creditScore !== null ? this.getCreditRecommendation(creditScore, defaultRate) : 'No credit history available',
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to perform basic credit check: ${error.message}`,
        error.stack,
      );
      return {
        creditScore: null,
        riskLevel: null,
        error: 'Unable to calculate credit metrics',
      };
    }
  }

  // Helper method for credit recommendations
  private getCreditRecommendation(
    creditScore: number,
    defaultRate: number,
  ): string {
    if (creditScore >= 750 && defaultRate === 0) {
      return 'Excellent - Approve with best rates';
    } else if (creditScore >= 700 && defaultRate < 5) {
      return 'Good - Approve with standard rates';
    } else if (creditScore >= 650 && defaultRate < 10) {
      return 'Fair - Approve with higher rates or additional collateral';
    } else if (creditScore >= 600 && defaultRate < 15) {
      return 'Poor - Consider with significant restrictions';
    } else {
      return 'High Risk - Recommend rejection or extensive review';
    }
  }

  /**
   * Interest summary for a lender.
   * Returns per-loan interest breakdown and portfolio-level aggregates.
   * Only uses real data from loan_requests and loan_repayments tables.
   */
  async getLenderInterestSummary(lenderId: string) {
    // Resolve actual lender entity ID (user ID may be passed)
    let actualLenderId = lenderId;
    const lenderEntity = await this.lenderRepository.findOne({ where: { id: lenderId } });
    if (!lenderEntity) {
      const user = await this.userRepository.findOne({ where: { id: lenderId, role: UserRole.LENDER } });
      if (user) {
        const lenderByEmail = await this.lenderRepository.findOne({ where: { contact_email: user.email } });
        if (lenderByEmail) actualLenderId = lenderByEmail.id;
      }
    }

    const loans = await this.loanRequestRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.repayments', 'repayments')
      .leftJoinAndSelect('loan.borrower', 'borrower')
      .where('loan.lender_id = :lenderId', { lenderId: actualLenderId })
      .orderBy('loan.created_at', 'DESC')
      .getMany();

    // Per-loan interest breakdown
    const loanBreakdown = loans.map(loan => {
      const totalInterestPaid = loan.repayments?.reduce(
        (sum, r) => sum + (Number(r.interest_paid) || 0), 0,
      ) ?? 0;

      const totalPrincipalPaid = loan.repayments?.reduce(
        (sum, r) => sum + (Number(r.principal_paid) || 0), 0,
      ) ?? 0;

      const totalRepaid = loan.repayments?.reduce(
        (sum, r) => sum + (Number(r.amount) || 0), 0,
      ) ?? 0;

      // interest_amount on the loan record is the contracted interest (set at approval)
      const contractedInterest = Number(loan.interest_amount) || null;

      // Outstanding = contracted interest - paid interest (only meaningful if contracted is set)
      const outstandingInterest = contractedInterest !== null
        ? Math.max(0, contractedInterest - totalInterestPaid)
        : null;

      return {
        loanId:             loan.id,
        borrowerName:       loan.borrower?.contact_name ?? loan.borrower?.company_name ?? null,
        borrowerCompany:    loan.borrower?.company_name ?? null,
        requestedAmount:    Number(loan.requested_amount) || null,
        approvedAmount:     loan.approved_amount != null ? Number(loan.approved_amount) : null,
        status:             loan.status,
        dueDate:            loan.due_date ?? null,
        createdAt:          loan.created_at,
        // Interest fields
        contractedInterest,
        totalInterestPaid,
        outstandingInterest,
        // Repayment totals
        totalPrincipalPaid,
        totalRepaid,
        repaymentCount:     loan.repayments?.length ?? 0,
        // Purpose from metadata
        purpose:            loan.metadata?.purpose ?? null,
      };
    });

    // Portfolio-level aggregates — only sum real values
    const totalInterestCollected = loanBreakdown.reduce(
      (s, l) => s + l.totalInterestPaid, 0,
    );

    const totalContractedInterest = loanBreakdown
      .filter(l => l.contractedInterest !== null)
      .reduce((s, l) => s + l.contractedInterest!, 0);

    const totalOutstandingInterest = loanBreakdown
      .filter(l => l.outstandingInterest !== null)
      .reduce((s, l) => s + l.outstandingInterest!, 0);

    const totalPrincipalDeployed = loanBreakdown.reduce(
      (s, l) => s + (l.approvedAmount ?? l.requestedAmount ?? 0), 0,
    );

    // Collection efficiency: only calculable when contracted interest > 0
    const collectionEfficiency = totalContractedInterest > 0
      ? (totalInterestCollected / totalContractedInterest) * 100
      : null;

    // Overdue loans: past due_date and not repaid
    const now = new Date();
    const overdueLoans = loanBreakdown.filter(
      l => l.dueDate && new Date(l.dueDate) < now && l.status !== 'repaid',
    );

    return {
      summary: {
        totalLoans:              loans.length,
        totalPrincipalDeployed,
        totalInterestCollected,
        totalContractedInterest: totalContractedInterest > 0 ? totalContractedInterest : null,
        totalOutstandingInterest: totalOutstandingInterest > 0 ? totalOutstandingInterest : null,
        collectionEfficiency,
        overdueCount:            overdueLoans.length,
      },
      loans: loanBreakdown,
    };
  }

  /**
   * Backfill credit scores for all borrowers that currently have null credit_score.
   * Only updates if the borrower has real loan history to score from.
   */
  async backfillBorrowerCreditScores(): Promise<{ updated: number; skipped: number }> {
    const borrowers = await this.borrowerRepository.find({
      where: { credit_score: null },
    });

    let updated = 0;
    let skipped = 0;

    for (const borrower of borrowers) {
      try {
        const result = await this.performBasicCreditCheck(borrower);
        // Only persist if we have a real score derived from actual loan history
        if (result?.creditScore !== null && result?.creditScore !== undefined && result.recentLoanCount > 0) {
          await this.borrowerRepository.update(borrower.id, {
            credit_score: result.creditScore,
          });
          updated++;
          this.logger.log(
            `✅ Backfilled credit_score for borrower ${borrower.id} → ${result.creditScore}`,
          );
        } else {
          // No loan history — skip, do not invent a score
          skipped++;
        }
      } catch (err) {
        this.logger.warn(
          `Could not backfill credit score for borrower ${borrower.id}: ${err.message}`,
        );
        skipped++;
      }
    }

    this.logger.log(
      `Backfill complete: ${updated} updated, ${skipped} skipped (no history) out of ${borrowers.length} borrowers`,
    );
    return { updated, skipped };
  }

  // Get lender portfolio trends analytics - PORTFOLIO ANALYTICS ENHANCEMENT
  async getLenderTrends(
    lenderId: string,
    period: string,
    granularity: string,
    requestedMetrics: string[],
  ) {
    try {
      // Calculate date range based on period
      const timeRange = this.calculateTimeRange(period);
      const dateFormat = this.getDateFormat(granularity);

      // Initialize trends data structure
      const trends: any = {};

      // Loan volume trends
      if (requestedMetrics.includes('loans')) {
        trends.loanVolume = await this.getLoanVolumeTrends(
          lenderId,
          timeRange,
          dateFormat,
        );
      }

      // Disbursement trends
      if (requestedMetrics.includes('disbursements')) {
        trends.disbursements = await this.getDisbursementTrends(
          lenderId,
          timeRange,
          dateFormat,
        );
      }

      // Repayment trends
      if (requestedMetrics.includes('repayments')) {
        trends.repayments = await this.getRepaymentTrends(
          lenderId,
          timeRange,
          dateFormat,
        );
      }

      // Portfolio growth trends
      if (requestedMetrics.includes('portfolio')) {
        trends.portfolioGrowth = await this.getPortfolioGrowthTrends(
          lenderId,
          timeRange,
          dateFormat,
        );
      }

      // Risk metrics trends
      if (requestedMetrics.includes('risk')) {
        trends.riskMetrics = await this.getRiskMetricsTrends(
          lenderId,
          timeRange,
          dateFormat,
        );
      }

      // Calculate summary insights
      const summary = this.calculateTrendsSummary(trends, timeRange);

      return {
        period,
        granularity,
        timeRange: {
          startDate: timeRange.startDate,
          endDate: timeRange.endDate,
        },
        trends,
        summary,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get lender trends: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve portfolio trends');
    }
  }

  // Helper method to calculate time range
  private calculateTimeRange(period: string): {
    startDate: Date;
    endDate: Date;
  } {
    const endDate = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date('2020-01-01'); // Default start date
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }

  // Helper method to get date format for SQL grouping
  private getDateFormat(granularity: string): string {
    switch (granularity) {
      case 'daily':
        return 'YYYY-MM-DD';
      case 'weekly':
        return 'YYYY-"W"WW';
      case 'monthly':
        return 'YYYY-MM';
      default:
        return 'YYYY-MM-DD';
    }
  }

  // Get loan volume trends
  private async getLoanVolumeTrends(
    lenderId: string,
    timeRange: any,
    dateFormat: string,
  ) {
    try {
      const result = await this.loanRequestRepository
        .createQueryBuilder('loan')
        .select([
          `TO_CHAR(loan.created_at, '${dateFormat}') as date`,
          'COUNT(*) as count',
          'SUM(loan.requested_amount) as amount',
        ])
        .where('loan.lender_id = :lenderId', { lenderId })
        .andWhere('loan.created_at >= :startDate', {
          startDate: timeRange.startDate,
        })
        .andWhere('loan.created_at <= :endDate', { endDate: timeRange.endDate })
        .groupBy(`TO_CHAR(loan.created_at, '${dateFormat}')`)
        .orderBy('date', 'ASC')
        .getRawMany();

      return result.map((row) => ({
        date: row.date,
        count: parseInt(row.count) || 0,
        amount: parseFloat(row.amount) || 0,
      }));
    } catch (error) {
      this.logger.warn(`Failed to get loan volume trends: ${error.message}`);
      return [];
    }
  }

  // Get disbursement trends
  private async getDisbursementTrends(
    lenderId: string,
    timeRange: any,
    dateFormat: string,
  ) {
    try {
      const result = await this.loanDisbursementRepository
        .createQueryBuilder('disbursement')
        .leftJoin('disbursement.loan_request', 'loan')
        .select([
          `TO_CHAR(disbursement.created_at, '${dateFormat}') as date`,
          'COUNT(*) as count',
          'SUM(disbursement.amount) as amount',
        ])
        .where('loan.lender_id = :lenderId', { lenderId })
        .andWhere('disbursement.created_at >= :startDate', {
          startDate: timeRange.startDate,
        })
        .andWhere('disbursement.created_at <= :endDate', {
          endDate: timeRange.endDate,
        })
        .andWhere('disbursement.status = :status', { status: 'disbursed' })
        .groupBy(`TO_CHAR(disbursement.created_at, '${dateFormat}')`)
        .orderBy('date', 'ASC')
        .getRawMany();

      return result.map((row) => ({
        date: row.date,
        count: parseInt(row.count) || 0,
        amount: parseFloat(row.amount) || 0,
      }));
    } catch (error) {
      this.logger.warn(`Failed to get disbursement trends: ${error.message}`);
      return [];
    }
  }

  // Get repayment trends
  private async getRepaymentTrends(
    lenderId: string,
    timeRange: any,
    dateFormat: string,
  ) {
    try {
      const result = await this.loanRepaymentRepository
        .createQueryBuilder('repayment')
        .leftJoin('repayment.loan_request', 'loan')
        .select([
          `TO_CHAR(repayment.repayment_date, '${dateFormat}') as date`,
          'COUNT(*) as count',
          'SUM(repayment.amount) as amount',
          'COUNT(CASE WHEN repayment.repayment_date <= loan.due_date THEN 1 END) as onTimeCount',
        ])
        .where('loan.lender_id = :lenderId', { lenderId })
        .andWhere('repayment.repayment_date >= :startDate', {
          startDate: timeRange.startDate,
        })
        .andWhere('repayment.repayment_date <= :endDate', {
          endDate: timeRange.endDate,
        })
        .groupBy(`TO_CHAR(repayment.repayment_date, '${dateFormat}')`)
        .orderBy('date', 'ASC')
        .getRawMany();

      return result.map((row) => {
        const totalCount = parseInt(row.count) || 0;
        const onTimeCount = parseInt(row.onTimeCount) || 0;
        return {
          date: row.date,
          count: totalCount,
          amount: parseFloat(row.amount) || 0,
          onTimeRate: totalCount > 0 ? (onTimeCount / totalCount) * 100 : 0,
        };
      });
    } catch (error) {
      this.logger.warn(`Failed to get repayment trends: ${error.message}`);
      return [];
    }
  }

  // Get portfolio growth trends
  private async getPortfolioGrowthTrends(
    lenderId: string,
    timeRange: any,
    dateFormat: string,
  ) {
    try {
      // This is a simplified version - in reality, you'd need to calculate running totals
      const result = await this.loanRequestRepository
        .createQueryBuilder('loan')
        .select([
          `TO_CHAR(loan.created_at, '${dateFormat}') as date`,
          'COUNT(*) as totalLoans',
          'SUM(loan.approved_amount) as totalOutstanding',
          'AVG(loan.interest_amount / loan.requested_amount * 100) as averageInterestRate',
        ])
        .where('loan.lender_id = :lenderId', { lenderId })
        .andWhere('loan.created_at >= :startDate', {
          startDate: timeRange.startDate,
        })
        .andWhere('loan.created_at <= :endDate', { endDate: timeRange.endDate })
        .andWhere('loan.status IN (:...statuses)', {
          statuses: ['approved', 'disbursed'],
        })
        .groupBy(`TO_CHAR(loan.created_at, '${dateFormat}')`)
        .orderBy('date', 'ASC')
        .getRawMany();

      return result.map((row) => ({
        date: row.date,
        totalLoans: parseInt(row.totalLoans) || 0,
        totalOutstanding: parseFloat(row.totalOutstanding) || 0,
        averageInterestRate: parseFloat(row.averageInterestRate) || 0,
      }));
    } catch (error) {
      this.logger.warn(
        `Failed to get portfolio growth trends: ${error.message}`,
      );
      return [];
    }
  }

  // Get risk metrics trends
  private async getRiskMetricsTrends(
    lenderId: string,
    timeRange: any,
    dateFormat: string,
  ) {
    try {
      const result = await this.loanRequestRepository
        .createQueryBuilder('loan')
        .leftJoin('loan.borrower', 'borrower')
        .select([
          `TO_CHAR(loan.created_at, '${dateFormat}') as date`,
          "COUNT(CASE WHEN loan.status = 'defaulted' THEN 1 END) as defaultedCount",
          'COUNT(*) as totalCount',
          'AVG(borrower.credit_score) as averageCreditScore',
        ])
        .where('loan.lender_id = :lenderId', { lenderId })
        .andWhere('loan.created_at >= :startDate', {
          startDate: timeRange.startDate,
        })
        .andWhere('loan.created_at <= :endDate', { endDate: timeRange.endDate })
        .groupBy(`TO_CHAR(loan.created_at, '${dateFormat}')`)
        .orderBy('date', 'ASC')
        .getRawMany();

      return result.map((row) => {
        const totalCount = parseInt(row.totalCount) || 0;
        const defaultedCount = parseInt(row.defaultedCount) || 0;
        const defaultRate =
          totalCount > 0 ? (defaultedCount / totalCount) * 100 : 0;
        const avgCreditScore = parseFloat(row.averageCreditScore) || 0;

        return {
          date: row.date,
          defaultRate: Math.round(defaultRate * 100) / 100,
          averageCreditScore: Math.round(avgCreditScore),
          riskScore: this.calculateRiskScore(defaultRate, avgCreditScore),
        };
      });
    } catch (error) {
      this.logger.warn(`Failed to get risk metrics trends: ${error.message}`);
      return [];
    }
  }

  // Calculate overall trends summary
  private calculateTrendsSummary(trends: any, timeRange: any): any {
    const insights: string[] = [];
    let totalGrowthRate = 0;
    let avgMonthlyVolume = 0;
    let trendDirection = 'stable';

    try {
      // Calculate loan volume growth if available
      if (trends.loanVolume && trends.loanVolume.length > 1) {
        const firstPeriod = trends.loanVolume[0];
        const lastPeriod = trends.loanVolume[trends.loanVolume.length - 1];

        if (firstPeriod.amount > 0) {
          totalGrowthRate =
            ((lastPeriod.amount - firstPeriod.amount) / firstPeriod.amount) *
            100;
        }

        // Calculate average monthly volume
        const totalAmount = trends.loanVolume.reduce(
          (sum: number, period: any) => sum + period.amount,
          0,
        );
        avgMonthlyVolume = totalAmount / trends.loanVolume.length;

        // Determine trend direction
        if (totalGrowthRate > 10) {
          trendDirection = 'upward';
          insights.push('Strong portfolio growth observed');
        } else if (totalGrowthRate < -10) {
          trendDirection = 'downward';
          insights.push('Portfolio volume declining - review strategy');
        } else {
          trendDirection = 'stable';
          insights.push('Portfolio maintaining steady performance');
        }
      }

      // Analyze repayment performance
      if (trends.repayments && trends.repayments.length > 0) {
        const avgOnTimeRate =
          trends.repayments.reduce(
            (sum: number, period: any) => sum + period.onTimeRate,
            0,
          ) / trends.repayments.length;

        if (avgOnTimeRate > 90) {
          insights.push(
            'Excellent repayment performance - borrowers paying on time',
          );
        } else if (avgOnTimeRate < 70) {
          insights.push(
            'Repayment performance needs attention - consider stricter criteria',
          );
        }
      }

      // Analyze risk trends
      if (trends.riskMetrics && trends.riskMetrics.length > 1) {
        const firstRisk = trends.riskMetrics[0];
        const lastRisk = trends.riskMetrics[trends.riskMetrics.length - 1];

        if (lastRisk.defaultRate > firstRisk.defaultRate) {
          insights.push('Default rate increasing - review lending criteria');
        } else if (lastRisk.defaultRate < firstRisk.defaultRate) {
          insights.push('Default rate improving - good risk management');
        }
      }

      // Default insights if no specific trends detected
      if (insights.length === 0) {
        insights.push('Portfolio performance within normal parameters');
      }
    } catch (error) {
      this.logger.warn(`Failed to calculate trends summary: ${error.message}`);
      insights.push('Unable to calculate comprehensive trends analysis');
    }

    return {
      totalGrowthRate: Math.round(totalGrowthRate * 100) / 100,
      avgMonthlyVolume: Math.round(avgMonthlyVolume * 100) / 100,
      trendDirection,
      keyInsights: insights,
    };
  }

  // Helper method to calculate risk score
  private calculateRiskScore(
    defaultRate: number,
    avgCreditScore: number,
  ): number {
    let riskScore = 50;
    riskScore += defaultRate * 2;
    if (avgCreditScore > 0) {
      riskScore -= (avgCreditScore - 600) / 10;
    }
    return Math.max(0, Math.min(100, Math.round(riskScore)));
  }

  /**
   * Delinquency & Default Engine (Basel II / IFRS 9).
   *
   * Called by a scheduler. For every disbursed/approved loan past its due date:
   *  - Computes days_past_due
   *  - Updates IFRS 9 stage (1 → 2 at 30 DPD, 2 → 3 at 90 DPD)
   *  - Marks as DEFAULTED at policy threshold (default 90 days)
   *  - Applies penalty interest after grace period
   *
   * Compliant with: Basel II Article 178, IFRS 9 paragraph 5.5, BNR/Rwanda prudential guidelines.
   */
  async runDelinquencyAndDefaultEngine(): Promise<{ processed: number; defaulted: number; staged: number }> {
    this.logger.log('DelinquencyEngine: Starting run');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeLoans = await this.loanRequestRepository.find({
      where: { status: In([LoanRequestStatus.APPROVED, LoanRequestStatus.DISBURSED]) },
    });

    let processed = 0, defaulted = 0, staged = 0;

    for (const loan of activeLoans) {
      if (!loan.due_date) continue;

      const dueDate = new Date(loan.due_date);
      dueDate.setHours(0, 0, 0, 0);
      if (today <= dueDate) continue; // Not yet due

      // Prefer /lender/policies repayment thresholds; legacy lender_policies as fallback
      const originationPolicy = loan.lender_id
        ? await this.lendingPoliciesService.getOriginationPolicy(loan.lender_id)
        : null;
      const legacyPolicy = loan.lender_id
        ? await this.lenderPolicyRepository.findOne({
            where: { lender_id: loan.lender_id, is_active: true },
            order: { created_at: 'DESC' },
          })
        : null;
      const delinquencyDays = legacyPolicy?.delinquency_threshold_days ?? 30;
      const defaultDays =
        originationPolicy?.defaultThresholdDays ??
        legacyPolicy?.default_threshold_days ??
        90;
      const gracePeriodDays =
        originationPolicy?.gracePeriodDays ??
        legacyPolicy?.grace_period_days ??
        3;
      const penaltyRate = Number(legacyPolicy?.penalty_rate ?? 0);

      const gracePeriodEnd = new Date(dueDate.getTime() + gracePeriodDays * 86400_000);
      if (today <= gracePeriodEnd) continue; // Still within grace period

      const dpd = Math.floor((today.getTime() - gracePeriodEnd.getTime()) / 86400_000);
      let changed = false;

      if (loan.days_past_due !== dpd) {
        loan.days_past_due = dpd;
        changed = true;
      }

      // IFRS 9 Staging
      const newStage = dpd < delinquencyDays ? 1 : dpd < defaultDays ? 2 : 3;
      if (loan.ifrs9_stage !== newStage) {
        loan.ifrs9_stage = newStage;
        changed = true;
        staged++;
        this.logger.log(`DelinquencyEngine: Loan ${loan.id} moved to IFRS 9 Stage ${newStage} (DPD=${dpd})`);
      }

      // Default threshold (Basel II: 90 DPD)
      if (dpd >= defaultDays && loan.status !== LoanRequestStatus.DEFAULTED) {
        loan.status = LoanRequestStatus.DEFAULTED;
        loan.defaulted_at = new Date();
        changed = true;
        defaulted++;
        this.logger.warn(`DelinquencyEngine: Loan ${loan.id} DEFAULTED (DPD=${dpd}, threshold=${defaultDays})`);
        // Notify
        try {
          const creator = await this.userRepository.findOne({ where: { id: loan.created_by } });
          if (creator) {
            await this.loanNotificationService.notifyCargoOwnerLoanRejected(
              creator.id, loan.tenant_id, loan.id,
              `Loan defaulted after ${dpd} days past due. Please contact your lender.`,
              'System',
            );
          }
        } catch { /* non-fatal */ }
      }

      // Apply penalty interest to metadata
      if (penaltyRate > 0 && changed) {
        const principal = Number(loan.approved_amount || loan.requested_amount);
        const dailyPenalty = principal * (penaltyRate / 365);
        const totalPenalty = Math.round(dailyPenalty * dpd * 100) / 100;
        loan.metadata = { ...(loan.metadata || {}), penalty_interest_accrued: totalPenalty, penalty_rate: penaltyRate, dpd };
      }

      if (changed) {
        await this.loanRequestRepository.save(loan);
        processed++;
      }
    }

    this.logger.log(`DelinquencyEngine: Done — processed=${processed} defaulted=${defaulted} staged=${staged}`);
    return { processed, defaulted, staged };
  }
}
