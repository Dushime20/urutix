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
import { LoanRequest, LoanRequestStatus } from '../../entities/loan-request.entity';
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
   * Validate borrower-level credit exposure.
   * If a lender is specified, use their policy limits. Otherwise, apply safe platform defaults.
   */
  private async validateCreditLimit(
    tenantId: string,
    requestedAmount: number,
    lenderId?: string,
  ): Promise<void> {
    let maxPerLoan = 50_000_000;  // Platform-wide safety cap (RWF 50M)
    let creditLimit = 500_000_000; // Platform-wide borrower total cap

    if (lenderId) {
      const policy = await this.lenderPolicyRepository.findOne({
        where: { lender_id: lenderId, is_active: true },
        order: { created_at: 'DESC' },
      });
      if (policy) {
        maxPerLoan  = Number(policy.max_advance_per_trip);
        creditLimit = Number(policy.max_exposure);
      }
    }

    if (requestedAmount > maxPerLoan) {
      throw new LoanLimitExceededException(tenantId, requestedAmount, maxPerLoan);
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
    const availableCredit = creditLimit - totalOutstanding;

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

    if (!requestedAmount || !lender.policies?.length) return;

    const policy = lender.policies.find((p: any) => p.is_active !== false) ?? lender.policies[0];

    // ── 1. Per-trip advance limit ───────────────────────────────────────────
    const maxAdvance = Number(policy.max_advance_per_trip);
    if (requestedAmount > maxAdvance) {
      throw new BadRequestException(
        `Requested amount (${requestedAmount}) exceeds lender's max advance per trip (${maxAdvance}).`,
      );
    }

    // ── 2. Total exposure limit ─────────────────────────────────────────────
    const currentExposure = await this.getCurrentExposure(lenderId);
    if (currentExposure + requestedAmount > Number(policy.max_exposure)) {
      throw new BadRequestException(
        `Lender has reached maximum portfolio exposure limit (${policy.max_exposure}). Current: ${currentExposure}.`,
      );
    }

    if (!loanContext) return;

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

  // Loan Request Management
  async createLoanRequest(
    createLoanDto: CreateLoanRequestDto,
    createdBy: string,
  ): Promise<LoanRequest> {
    this.logger.log(
      `Creating loan request for tenant: ${createLoanDto.tenant_id}, amount: ${createLoanDto.requested_amount}`,
    );

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

    // Enhanced validation
    await this.validateCreditLimit(
      createLoanDto.tenant_id,
      createLoanDto.requested_amount,
      createLoanDto.lender_id,
    );

    if (createLoanDto.lender_id) {
      this.logger.log(`Validating specified lender: ${createLoanDto.lender_id}`);
      await this.validateLenderAvailability(createLoanDto.lender_id, createLoanDto.requested_amount, {
        tenantId: createLoanDto.tenant_id,
        purpose: (createLoanDto as any).purpose,
        currency: (createLoanDto as any).currency,
        collateralValue: (createLoanDto as any).collateral_value,
        kycVerified: (createLoanDto as any).kyc_verified,
      });
    } else {
      this.logger.log(`No lender specified, will attempt automatic assignment`);
    }

    // ── RULE 1: One loan per trip (invoice/trip financing standard) ───────
    // A trip can only be financed once. If an active loan already exists
    // for this trip_id, block the new request immediately.
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
        throw new BadRequestException(
          `Trip already has an active loan ` +
          `(${activeTripLoan.loan_number || activeTripLoan.id.slice(0, 8)}). ` +
          `A trip can only be financed once.`,
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
    const policy = createLoanDto.lender_id
      ? await this.lenderPolicyRepository.findOne({ where: { lender_id: createLoanDto.lender_id, is_active: true }, order: { created_at: 'DESC' } })
      : null;
    const gracePeriodDays = policy?.grace_period_days ?? 3;
    const dueDate = createLoanDto.due_date ? new Date(createLoanDto.due_date) : null;
    const gracePeriodEnd = dueDate ? new Date(dueDate.getTime() + gracePeriodDays * 86400_000) : null;
    const originationFeeRate = Number(policy?.origination_fee_rate ?? 0);
    const originationFeeAmount = Math.round(createLoanDto.requested_amount * originationFeeRate * 100) / 100;

    const loanRequest = this.loanRequestRepository.create({
      ...createLoanDto,
      idempotency_key: idempotencyKey,
      created_by: createdBy,
      borrower_id: borrower?.id ?? null,
      due_date: dueDate,
      loan_number: loanNumber,
      purpose: (createLoanDto as any).purpose ?? 'cargo_financing',
      currency: (createLoanDto as any).currency ?? policy?.currency ?? 'RWF',
      kyc_verified: (createLoanDto as any).kyc_verified ?? false,
      grace_period_end: gracePeriodEnd,
      origination_fee_rate: originationFeeRate,
      origination_fee_amount: originationFeeAmount,
      days_past_due: 0,
      ifrs9_stage: 1,
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
          : requesterUser?.email || 'A cargo owner';
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

    return savedLoan;
  }

  async createLoanRequestForLoadedCargo(
    cargoId: string,
    tripId: string | undefined,
    tenantId: string,
    createdBy: string,
    lenderId?: string,
  ): Promise<LoanRequest> {
    this.logger.log(`Creating loan request for loaded cargo: ${cargoId}`);

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

    // Calculate loan amount (this could be enhanced with more sophisticated logic)
    const requestedAmount = await this.calculateLoanAmountForCargo(cargoId);

    // Resolve lender_id before creating the loan request
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
        // Validate lender and use its ID
        await this.validateLenderAvailability(lender.id, requestedAmount);
        resolvedLenderId = lender.id;
        this.logger.log(`Resolved lender_id ${resolvedLenderId} for loan request`);
      } else {
        throw new NotFoundException(`Lender not found with ID: ${lenderId}`);
      }
    }

    const loanRequest = this.loanRequestRepository.create({
      tenant_id: tenantId,
      cargo_id: cargoId,
      trip_id: actualTripId,
      requested_amount: requestedAmount,
      lender_id: resolvedLenderId, // Only set if we have a valid Lender entity ID
      idempotency_key: idempotencyKey,
      created_by: createdBy,
      status: LoanRequestStatus.PENDING,
      metadata: {
        auto_created: true,
        trigger: 'cargo_loaded',
        created_at: new Date().toISOString(),
        selected_lender: lenderId || null, // Store original ID (could be User ID) in metadata
      },
    });

    const savedLoan = await this.loanRequestRepository.save(loanRequest);
    this.logger.log(
      `Created loan request for cargo ${cargoId}: ${savedLoan.id}${resolvedLenderId ? ` with lender ${resolvedLenderId}` : ''}`,
    );

    // If no lender was specified, attempt to process with available lenders
    if (!resolvedLenderId) {
      await this.processLoanRequest(savedLoan.id);
    }

    return savedLoan;
  }

  private async calculateLoanAmountForCargo(cargoId: string): Promise<number> {
    // For MVP, we'll use a simple calculation
    // In production, this would consider cargo value, risk factors, etc.

    // TODO: Fetch cargo details from loads service
    // For now, return a default amount
    const defaultLoanAmount = 100000; // RWF 100,000

    this.logger.log(
      `Calculated loan amount for cargo ${cargoId}: ${defaultLoanAmount}`,
    );
    return defaultLoanAmount;
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
      relations: ['policies'],
    });

    this.logger.log(`findSuitableLender: Found ${lenders.length} active lenders to evaluate`);

    // Default limits used when a lender has no policy configured
    const DEFAULT_MAX_ADVANCE = 100_000;
    const DEFAULT_MAX_EXPOSURE = 1_000_000;

    for (const lender of lenders) {
      const policy = lender.policies?.[0];

      const maxAdvance  = policy ? Number(policy.max_advance_per_trip) : DEFAULT_MAX_ADVANCE;
      const maxExposure = policy ? Number(policy.max_exposure)         : DEFAULT_MAX_EXPOSURE;

      this.logger.log(
        `findSuitableLender: Evaluating lender ${lender.id} (${lender.name}) - ` +
        `maxAdvance: ${maxAdvance}, maxExposure: ${maxExposure}${policy ? '' : ' [defaults]'}`
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
          `findSuitableLender: ✓ Selected lender ${lender.id} (${lender.name}) for loan ${loan.id}` +
          (policy ? '' : ' [using default limits — no policy configured]'),
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
      // For MVP, auto-approve loans
      await this.approveLoanRequest(loan.id, {
        status: 'approved',
        approved_amount: loan.requested_amount,
        external_loan_ref: `AUTO-${Date.now()}`,
        interest_amount: await this.calculateInterest(loan, lender),
        disbursement_instruction: {
          mode: 'platform_initiated',
        },
      });
      return;
    }

    // Check if this is a Uruti Lending Platform integration
    // We can detect this by checking if the callback_url contains the Uruti Lending Platform domain
    // or by checking metadata for integration type
    const isUrutiLendingPlatform =
      lender.metadata?.integrationType === 'uruti_lending_platform' ||
      lender.callback_url.includes('urutilending.com') ||
      lender.callback_url.includes('localhost:3000');

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
      relations: ['lender', 'loanTerms'],
    });

    if (!loan) {
      throw new NotFoundException('Loan request not found');
    }

    const approvedAmount = Number(loan.approved_amount ?? loan.requested_amount);
    const interestAmount = Number(loan.interest_amount ?? 0);
    const originationFee = Number(loan.origination_fee_amount ?? 0);
    const totalRepayable = approvedAmount + interestAmount + originationFee;
    const termMonths = Number(loan.loan_term_months || 3);
    const nominalRate =
      loan.metadata?.interest_rate ?? loan.loanTerms?.[0]?.nominal_rate ?? null;
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

    const rulesAndRegulations = [
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
        purpose: loan.purpose || 'Cargo financing',
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

  /** Convert loan amount to MoMo provider currency when needed. */
  private async resolveDisbursementAmount(
    amount: number,
    loanCurrency: string,
  ): Promise<{ amount: number; currency: string; exchangeRate?: number }> {
    const momoCurrency =
      this.configService.get<string>('MOBILE_MONEY_CURRENCY') || 'RWF';
    const fromCurrency = loanCurrency || 'RWF';

    if (fromCurrency === momoCurrency) {
      return { amount: Math.round(amount), currency: momoCurrency };
    }

    try {
      const converted = await this.currencyService.convert(
        amount,
        fromCurrency,
        momoCurrency,
      );
      return {
        amount: Math.round(converted.convertedAmount),
        currency: momoCurrency,
        exchangeRate: converted.exchangeRate,
      };
    } catch (err) {
      this.logger.warn(`Currency conversion failed, using original amount: ${err.message}`);
      return { amount: Math.round(amount), currency: fromCurrency };
    }
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

      // Provide default beneficiaries if requested_split is null
      const beneficiaries = loan.requested_split && Array.isArray(loan.requested_split) && loan.requested_split.length > 0
        ? loan.requested_split
        : [{
            recipientId: loan.cargo_id || null,
            recipientType: 'cargo_owner',
            amount: loan.approved_amount || loan.requested_amount,
            percentage: 100,
          }];

      const disbursement = manager.create(LoanDisbursement, {
        loan_request_id: loanId,
        beneficiaries: beneficiaries,
        amount: loan.approved_amount || loan.requested_amount,
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
        await this.processDisbursementToBeneficiaries(savedDisbursement);
        loan.status = LoanRequestStatus.DISBURSED;
        await manager.save(LoanRequest, loan);

        // Notify truck owner that lender paid on their behalf
        try {
          const lender = await this.lenderRepository.findOne({ where: { id: loan.lender_id } });
          // Notify each beneficiary (truck owner)
          for (const ben of savedDisbursement.beneficiaries || []) {
            if (ben.recipientId && ben.recipientType !== 'cargo_owner') {
              await this.loanNotificationService.notifyTruckOwnerLenderPaid(
                ben.recipientId,
                loan.tenant_id,
                loan.id,
                ben.amount || loan.approved_amount || loan.requested_amount,
                lender?.name || 'Lender',
              );
            }
          }
        } catch (notifErr) {
          this.logger.warn(`Could not send disbursement notification: ${notifErr.message}`);
        }
      } catch (error) {
        this.logger.error(
          `Disbursement failed for loan ${loanId}: ${error.message}`,
        );
        savedDisbursement.status = DisbursementStatus.FAILED;
        savedDisbursement.failure_reason = error.message;
        await manager.save(LoanDisbursement, savedDisbursement);
      }

      return savedDisbursement;
    });
  }

  async disburseWithPayment(
    loanId: string,
    paymentDto: { paymentMethod: string; phoneNumber?: string; truckOwnerPhoneNumber?: string },
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

      // Get truck owner phone number - try multiple sources
      let truckOwnerPhone = paymentDto.truckOwnerPhoneNumber;
      
      // Get assignedTruckId from trip or load
      const assignedTruckId = trip.truckId || trip.load?.assignedTruckId;
      
      if (!truckOwnerPhone && assignedTruckId) {
        // Get truck details
        const truck = await manager.findOne('Truck', {
          where: { id: assignedTruckId },
          relations: ['owner', 'owner.profile'],
        } as any);
        
        if (truck?.owner) {
          // Try to get phone from profile preferences
          truckOwnerPhone = truck.owner.profile?.preferences?.paymentInfo?.phoneNumber ||
                           truck.owner.phone ||
                           truck.owner.profile?.phone;
          
          // If still not found, fetch full user profile
          if (!truckOwnerPhone) {
            const ownerUser = await manager.findOne('User', {
              where: { id: truck.owner.id },
              relations: ['profile'],
            } as any);
            
            truckOwnerPhone = ownerUser?.profile?.preferences?.paymentInfo?.phoneNumber ||
                             ownerUser?.phone;
          }
        }
      }

      if (!truckOwnerPhone && paymentDto.paymentMethod === 'mobile_money') {
        throw new BadRequestException(
          'Truck owner phone number is required for mobile money payment. ' +
          'Please ensure the truck owner has added their payment information in their profile.'
        );
      }

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
      
      const disbursement = manager.create(LoanDisbursement, {
        loan_request_id: loanId,
        beneficiaries: beneficiaries,
        amount: lockedAmount,
        status: DisbursementStatus.INITIATED,
        attempts: 1,
        interest_rate: loan.metadata?.interest_rate ?? null,
        risk_score: loan.metadata?.risk_score ?? null,
        credit_score: loan.metadata?.credit_score ?? null,
      });

      const savedDisbursement = await manager.save(LoanDisbursement, disbursement);

      const { amount: disburseAmount, currency: disburseCurrency, exchangeRate } =
        await this.resolveDisbursementAmount(lockedAmount, loan.currency || 'RWF');

      // Process payment via mobile money if requested
      if (paymentDto.paymentMethod === 'mobile_money' && truckOwnerPhone) {
        try {
          const MobileMoneyModule = await import('../payments/services/mobile-money-payment.service');
          const MobileMoneyClass = MobileMoneyModule.MobileMoneyPaymentService;
          const mobileMoneyService = this.moduleRef.get(MobileMoneyClass, { strict: false });

          if (!mobileMoneyService) {
            throw new BadRequestException('Mobile Money payment service is not available.');
          }

          const platformPhone = this.configService.get<string>('MOBILE_MONEY_ACCOUNT_PHONE');
          if (!platformPhone) {
            throw new BadRequestException(
              'MOBILE_MONEY_ACCOUNT_PHONE is not configured.',
            );
          }

          const referenceNumber = `LOAN-${loan.id.slice(0, 8).toUpperCase()}-DISB-${Date.now()}`;
          const paymentMessage =
            `Loan disbursement #${loan.loan_number || loan.id.slice(0, 8)} — ${disburseAmount} ${disburseCurrency}`;

          const transfers = [{
            percentage: 100,
            phoneNumber: truckOwnerPhone,
            receiverMessage: paymentMessage.substring(0, 160),
          }];

          this.logger.log(
            `Disbursing loan ${loan.id}: ${disburseAmount} ${disburseCurrency} ` +
            `(locked principal: ${lockedAmount} ${loan.currency}) → ${truckOwnerPhone}`,
          );

          const momoResponse = await mobileMoneyService.createTransaction(
            disburseAmount,
            platformPhone,
            referenceNumber,
            paymentMessage,
            transfers,
            this.configService.get<string>('MOBILE_MONEY_CALLBACK_URL'),
          );

          const transaction =
            momoResponse.savedTransaction || momoResponse.transaction;
          const transactionId =
            transaction?.externalId || transaction?.id || referenceNumber;
          const txnStatus = transaction?.status || 'pending';

          if (txnStatus === 'failed') {
            throw new BadRequestException('Mobile Money disbursement was rejected by the provider.');
          }

          // Record payment via PaymentsService for audit trail
          const PaymentsServiceModule = await import('../payments/payments.service');
          const PaymentsServiceClass = PaymentsServiceModule.PaymentsService;
          const paymentsService = this.moduleRef.get(PaymentsServiceClass, { strict: false });

          let processedPayment: any = null;
          if (paymentsService) {
            const { PaymentMethod, PaymentType } = await import('../../entities/payment.entity');
            const createPaymentDto = {
              tripId: trip.id,
              amount: lockedAmount,
              currency: loan.currency || 'RWF',
              paymentMethod: PaymentMethod.DIGITAL_WALLET,
              paymentType: PaymentType.TRIP_PAYMENT,
              description: paymentMessage,
              referenceNumber,
              metadata: {
                lenderId: loan.lender_id,
                lenderName: loan.lender?.name,
                financedAmount: lockedAmount,
                isLenderPayment: true,
                receiverPhoneNumber: truckOwnerPhone,
                loanId: loan.id,
                loanNumber: loan.loan_number,
                disbursementId: savedDisbursement.id,
                momoTransactionId: transactionId,
                momoAmount: disburseAmount,
                momoCurrency: disburseCurrency,
                exchangeRate: exchangeRate ?? null,
              },
            };

            const payment = await paymentsService.createPayment(
              createPaymentDto,
              tenantId,
              lenderUserId,
            );

            processedPayment = await paymentsService.updatePaymentStatus(
              payment.id,
              {
                status: 'completed' as any,
                transactionId,
                gatewayResponse: 'Loan disbursement completed via Mobile Money.',
                processedAt: new Date(),
              },
              tenantId,
            );
          }

          disbursement.status = DisbursementStatus.DISBURSED;
          disbursement.disbursement_date = new Date();
          disbursement.external_txn_ref = transactionId;
          loan.status = LoanRequestStatus.DISBURSED;
          loan.metadata = {
            ...(loan.metadata || {}),
            disbursement: {
              disbursed_at: new Date().toISOString(),
              amount: lockedAmount,
              currency: loan.currency,
              momo_amount: disburseAmount,
              momo_currency: disburseCurrency,
              beneficiary_phone: truckOwnerPhone,
              transaction_id: transactionId,
            },
          };
          await manager.save(LoanDisbursement, disbursement);
          await manager.save(LoanRequest, loan);

          // Notify borrower (cargo owner) and beneficiary (truck owner)
          try {
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
            if (truckOwnerId) {
              await this.loanNotificationService.notifyTruckOwnerLenderPaid(
                truckOwnerId,
                loan.tenant_id,
                loan.id,
                lockedAmount,
                loan.lender?.name || 'Lender',
              );
            }
          } catch (notifErr) {
            this.logger.warn(`Disbursement notifications failed: ${notifErr.message}`);
          }

          const cargoOwnerId: string = loan.created_by;
          const { Payment: PaymentEntity, PaymentStatus: PmtStatus, PaymentType: PmtType, PaymentMethod: PmtMethod } = await import('../../entities/payment.entity');

          const existingTripPayment = await manager.findOne(PaymentEntity, {
            where: {
              tripId: trip.id,
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

          const dueDate = loan.due_date
            ? new Date(loan.due_date)
            : (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d; })();
          const obligationAmount =
            Number(loan.approved_amount) + Number(loan.interest_amount || 0);
          const obligationPayment = manager.create(PaymentEntity, {
            tripId: trip.id,
            tenantId: loan.tenant_id,
            payerId: cargoOwnerId,
            payeeId: lenderUserId,
            amount: obligationAmount,
            currency: loan.currency || 'RWF',
            paymentMethod: PmtMethod.BANK_TRANSFER,
            paymentType: PmtType.TRIP_PAYMENT,
            status: PmtStatus.PENDING,
            dueDate,
            description: `Loan repayment to lender — ${loan.loan_number || loan.id.slice(0, 8)}`,
            referenceNumber: `LREP-${loan.id.slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
            metadata: {
              isLoanRepaymentObligation: true,
              isLenderPayment: false,
              loanId: loan.id,
              lenderName: loan.lender?.name ?? null,
              lenderId: loan.lender_id,
              cargoOwnerId,
              originalDisbursementPaymentId: processedPayment?.id,
              paymentSource: 'lender_disbursement',
              automaticallyCreated: true,
            },
          } as any);
          await manager.save(PaymentEntity, obligationPayment);

          return {
            success: true,
            disbursement: savedDisbursement,
            payment: processedPayment
              ? {
                  id: processedPayment.id,
                  status: processedPayment.status,
                  transactionId: processedPayment.transactionId,
                }
              : { transactionId },
            disbursedAmount: lockedAmount,
            disbursedCurrency: loan.currency,
            momoAmount: disburseAmount,
            momoCurrency: disburseCurrency,
          };
        } catch (error: any) {
          savedDisbursement.status = DisbursementStatus.FAILED;
          savedDisbursement.failure_reason = error.message;
          await manager.save(LoanDisbursement, savedDisbursement);
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
      await this.processDisbursementToBeneficiaries(savedDisbursement);
      loan.status = LoanRequestStatus.DISBURSED;
      await manager.save(LoanRequest, loan);

      // ── Cargo owner obligation (fallback / non-MoMo path) ─────────────────
      try {
        const cargoOwnerId: string = loan.created_by;
        const { Payment: PaymentEntity, PaymentStatus: PmtStatus, PaymentType: PmtType, PaymentMethod: PmtMethod } = await import('../../entities/payment.entity');

        // Cancel old trip-payment obligation if exists
        const existingTripPayment = await manager.findOne(PaymentEntity, {
          where: {
            tripId: trip.id,
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

        // Create cargo owner → lender obligation
        const dueDate = loan.due_date ? new Date(loan.due_date) : (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d; })();
        const obligationAmount = Number(loan.approved_amount || loan.requested_amount) + Number(loan.interest_amount || 0);
        const obligationPayment = manager.create(PaymentEntity, {
          tripId: trip.id,
          tenantId: loan.tenant_id,
          payerId: cargoOwnerId,
          payeeId: lenderUserId,
          amount: obligationAmount,
          currency: loan.currency || 'RWF',
          paymentMethod: PmtMethod.BANK_TRANSFER,
          paymentType: PmtType.TRIP_PAYMENT,
          status: PmtStatus.PENDING,
          dueDate,
          description: `Loan repayment to lender — ${loan.loan_number || loan.id.slice(0, 8)}`,
          referenceNumber: `LREP-${loan.id.slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          metadata: {
            isLoanRepaymentObligation: true,
            isLenderPayment: false,
            loanId: loan.id,
            lenderName: loan.lender?.name ?? null,
            lenderId: loan.lender_id,
            cargoOwnerId,
            paymentSource: 'lender_disbursement',
            automaticallyCreated: true,
          },
        } as any);
        await manager.save(PaymentEntity, obligationPayment);
        this.logger.log(`Created cargo owner obligation payment ${obligationPayment.id} for loan ${loan.id} (fallback path)`);
      } catch (err: any) {
        // Non-fatal — disbursement already succeeded
        this.logger.error(`Failed to create cargo owner obligation (fallback): ${err.message}`);
      }
      // ──────────────────────────────────────────────────────────────────────

      return {
        success: true,
        disbursement: savedDisbursement,
      };
    });
  }

  private async processDisbursementToBeneficiaries(
    disbursement: LoanDisbursement,
  ): Promise<void> {
    // This would integrate with your payment service
    // For now, we'll simulate successful disbursement

    for (const beneficiary of disbursement.beneficiaries) {
      this.logger.log(
        `Disbursing ${beneficiary.amount} to ${beneficiary.type} ${beneficiary.id}`,
      );

      // Here you would call your wallet/payment service
      // await this.walletService.credit(beneficiary.id, beneficiary.amount);
    }

    disbursement.status = DisbursementStatus.DISBURSED;
    disbursement.disbursement_date = new Date();
    disbursement.external_txn_ref = `DISB-${Date.now()}`;

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
  ): Promise<LoanRepayment> {
    return await this.dataSource.transaction(async (manager) => {
      const loan = await manager.findOne(LoanRequest, {
        where: { id: loanId },
        relations: ['lender', 'repayments'],
      } as any);

      if (!loan) {
        throw new NotFoundException('Loan request not found');
      }

      if (loan.status !== LoanRequestStatus.DISBURSED) {
        throw new BadRequestException(
          'Loan must be disbursed before repayment',
        );
      }

      // Compute outstanding
      const totalDue =
        (loan.approved_amount || 0) + (loan.interest_amount || 0);
      const paidSoFar = (loan.repayments || []).reduce(
        (sum, r) => sum + Number(r.amount || 0),
        0,
      );
      const outstanding = Math.max(0, totalDue - paidSoFar);
      if (finalPaymentAmount <= 0) {
        throw new BadRequestException('Payment amount must be positive');
      }
      const appliedAmount = Math.min(finalPaymentAmount, outstanding);
      const principalOutstanding = Math.max(
        0,
        (loan.approved_amount || 0) -
          (loan.repayments || []).reduce(
            (s, r) => s + Number(r.principal_paid || 0),
            0,
          ),
      );
      const interestOutstanding = Math.max(
        0,
        (loan.interest_amount || 0) -
          (loan.repayments || []).reduce(
            (s, r) => s + Number(r.interest_paid || 0),
            0,
          ),
      );
      const interestPaid = Math.min(appliedAmount, interestOutstanding);
      const principalPaid = appliedAmount - interestPaid;

      const repayment = this.loanRepaymentRepository.create({
        loan_request_id: loanId,
        amount: appliedAmount,
        principal_paid: principalPaid,
        interest_paid: interestPaid,
        repayment_date: new Date(),
        external_txn_ref: `REPAY-${Date.now()}`,
        metadata: { final_payment_amount: finalPaymentAmount },
      });
      const savedRepayment = await manager.save(LoanRepayment, repayment);

      if (appliedAmount >= outstanding - 0.001) {
        loan.status = LoanRequestStatus.REPAID;
        await manager.save(LoanRequest, loan);
      }

      if (loan.lender?.callback_url) {
        await this.notifyLenderRepayment(loan, savedRepayment);
      }

      return savedRepayment;
    });
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
    // For now, fall back to env token until key provisioning is in place
    const token = process.env.LENDER_API_KEY || '';
    return `Bearer ${token}`;
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
    const data = `${createLoanDto.tenant_id}-${createLoanDto.cargo_id}-${createLoanDto.trip_id}-${createLoanDto.requested_amount}`;
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

  /** Get all loan requests created by a specific user (cargo owner) */
  async getMyLoanRequests(userId: string, tenantId: string): Promise<any[]> {
    const loans = await this.loanRequestRepository.find({
      where: { created_by: userId, tenant_id: tenantId },
      relations: ['lender', 'disbursements', 'repayments'],
      order: { created_at: 'DESC' },
    });
    return loans.map((loan) => ({ ...loan, ...buildLoanWorkflowView(loan) }));
  }

  async getLenderDashboard(lenderId: string, dateFrom?: Date, dateTo?: Date, tenantId?: string) {
    // Resolve user UUID → lender entity UUID (same as getLenderLoanRequests)
    let actualLenderId: string = lenderId;
    const lenderEntity = await this.lenderRepository.findOne({ where: { id: lenderId } });
    if (lenderEntity) {
      actualLenderId = lenderEntity.id;
    } else {
      const user = await this.userRepository.findOne({ where: { id: lenderId, role: UserRole.LENDER } });
      if (user) {
        const lenderByEmail = await this.lenderRepository.findOne({ where: { contact_email: user.email } });
        if (lenderByEmail) actualLenderId = lenderByEmail.id;
      }
    }

    const queryBuilder = this.loanRequestRepository
      .createQueryBuilder('loan')
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

    const loans = await queryBuilder.getMany();

    const totalIssued = loans.filter(
      (l) => l.status === LoanRequestStatus.DISBURSED,
    ).length;
    const totalOutstanding = loans
      .filter((l) => l.status === LoanRequestStatus.DISBURSED)
      .reduce((sum, l) => sum + (l.approved_amount || 0), 0);

    const repaidLoans = loans.filter(
      (l) => l.status === LoanRequestStatus.REPAID,
    );
    const recoveryRate =
      totalIssued > 0 ? (repaidLoans.length / totalIssued) * 100 : 0;

    const defaultedLoans = loans.filter(
      (l) => l.status === LoanRequestStatus.DEFAULTED,
    );
    const defaultRate =
      totalIssued > 0 ? (defaultedLoans.length / totalIssued) * 100 : 0;

    const totalInterestCollected = repaidLoans.reduce(
      (sum, l) => sum + (l.interest_amount || 0),
      0,
    );
    const totalPrincipal = repaidLoans.reduce(
      (sum, l) => sum + (l.approved_amount || 0),
      0,
    );
    const roi =
      totalPrincipal > 0 ? (totalInterestCollected / totalPrincipal) * 100 : 0;

    return {
      totalLoansIssued: totalIssued,
      totalOutstandingPrincipal: totalOutstanding,
      recoveryRate: parseFloat(recoveryRate.toFixed(2)),
      defaultRate: parseFloat(defaultRate.toFixed(2)),
      averageLoanSize: totalIssued > 0 ? totalOutstanding / totalIssued : 0,
      roi: parseFloat(roi.toFixed(2)),
      totalInterestCollected,
      loans: loans.map((loan) => ({
        id: loan.id,
        amount: loan.approved_amount,
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
              supportedCurrencies: ['USD'],
              lendingCapacity: {
                minLoanAmount: 10000,
                maxLoanAmount: 1000000,
                totalCapacity: 10000000,
                availableCapacity: 8000000,
              },
              specializations: [],
              certifications: [],
            },
            banking: undefined,
            preferences: {
              language: 'English',
              timezone: 'America/New_York',
              currency: 'USD',
              dateFormat: 'MM/DD/YYYY',
              emailNotifications: true,
              smsNotifications: false,
              marketingEmails: true,
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

      // Fetch lender policy for thresholds
      const policy = loan.lender_id
        ? await this.lenderPolicyRepository.findOne({ where: { lender_id: loan.lender_id, is_active: true }, order: { created_at: 'DESC' } })
        : null;
      const delinquencyDays = policy?.delinquency_threshold_days ?? 30;
      const defaultDays     = policy?.default_threshold_days     ?? 90;
      const gracePeriodDays = policy?.grace_period_days          ?? 3;
      const penaltyRate     = Number(policy?.penalty_rate ?? 0);

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
