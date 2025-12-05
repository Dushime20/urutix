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
import { Repository, DataSource, In } from 'typeorm';
import { Lender, LenderStatus } from '../../entities/Lender';
import { LenderPolicy } from '../../entities/LenderPolicy';
import { LoanRequest, LoanRequestStatus } from '../../entities/LoanRequest';
import {
  LoanDisbursement,
  DisbursementStatus,
} from '../../entities/LoanDisbursement';
import { LoanRepayment } from '../../entities/LoanRepayment';
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
} from '../../entities/LenderTeam';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { Trip } from '../../entities/trip.entity';
import { EmailService } from '../auth/email.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import axios from 'axios';
import { encryptString, decryptString } from '../../common/utils/crypto.util';

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

    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,

    private emailService: EmailService,

    private dataSource: DataSource,

    @Inject(forwardRef(() => ModuleRef))
    private moduleRef: ModuleRef,
  ) {}

  // Credit and Risk Management
  private async validateCreditLimit(
    tenantId: string,
    requestedAmount: number,
    lenderId?: string,
  ): Promise<void> {
    // Get tenant's current credit limit and outstanding loans
    const outstandingLoans = await this.loanRequestRepository
      .createQueryBuilder('loan')
      .where('loan.tenant_id = :tenantId', { tenantId })
      .andWhere('loan.status IN (:...statuses)', {
        statuses: ['approved', 'disbursed'],
      })
      .getMany();

    const totalOutstanding = outstandingLoans.reduce(
      (sum, loan) => sum + (loan.approved_amount || 0),
      0,
    );

    // Default credit limit (can be made configurable)
    const creditLimit = 100000; // $100,000 default
    const availableCredit = creditLimit - totalOutstanding;

    if (requestedAmount > availableCredit) {
      throw new InsufficientCreditException(
        tenantId,
        requestedAmount,
        availableCredit,
      );
    }

    // Check if this would exceed maximum loan amount
    const maxLoanAmount = 50000; // $50,000 max per loan
    if (requestedAmount > maxLoanAmount) {
      throw new LoanLimitExceededException(
        tenantId,
        requestedAmount,
        maxLoanAmount,
      );
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

  private async validateLenderAvailability(lenderId: string): Promise<void> {
    const lender = await this.lenderRepository.findOne({
      where: { id: lenderId },
    });

    if (!lender || lender.status !== 'active') {
      throw new LenderNotAvailableException(
        lenderId,
        lender ? `Status: ${lender.status}` : 'Lender not found',
      );
    }
  }

  // Lender Management
  async createLender(
    createLenderDto: CreateLenderDto,
    tenantId?: string,
  ): Promise<LenderResponseDto> {
    this.logger.log(`Starting lender creation process for: ${createLenderDto.name}`);
    if (tenantId) {
      this.logger.log(`Creating lender for tenant: ${tenantId}`);
    }
    
    // Step 1: Check if user already exists BEFORE creating lender
    // For tenant-specific lenders, check within the tenant scope
    this.logger.log(`Checking if user with email ${createLenderDto.contact_email} already exists...`);
    const existingUser = await this.userRepository.findOne({
      where: tenantId 
        ? { 
            email: createLenderDto.contact_email.trim().toLowerCase(),
            tenantId: tenantId,
          }
        : { email: createLenderDto.contact_email.trim().toLowerCase() },
    });

    if (existingUser) {
      this.logger.error(
        `User with email ${createLenderDto.contact_email} already exists. Cannot create lender with existing user email.`,
      );
      throw new ConflictException(
        `A user with the email "${createLenderDto.contact_email}" already exists in the system. Please use a different email address for this lender.`,
      );
    }

    // Step 2: Create the lender entity (only if user doesn't exist)
    this.logger.log(`No existing user found. Proceeding with lender creation...`);
    const apiKey = this.generateApiKey();
    const hashedApiKey = await bcrypt.hash(apiKey, 10);

    const lender = this.lenderRepository.create({
      ...createLenderDto,
      api_key_hash: hashedApiKey,
      tenant_id: tenantId || null,
    });

    // Save lender to database - this must succeed before proceeding
    const savedLender = await this.lenderRepository.save(lender);
    this.logger.log(`✅ Lender created successfully with ID: ${savedLender.id}`);

    // Step 3: After lender is successfully created, proceed with user account creation
    this.logger.log(`Proceeding with user account creation for email: ${createLenderDto.contact_email}`);
    
    try {
      // Create new user for lender (following tenant creation pattern)
      this.logger.log(`👤 Creating new lender user account...`);
      
      // Use provided tenantId or default tenant ID
      const lenderTenantId = tenantId || '00000000-0000-0000-0000-000000000001';
      
      // Generate temporary password (will be replaced when lender sets password)
      const tempPassword = crypto.randomBytes(32).toString('hex');
      const tempPasswordHash = await bcrypt.hash(tempPassword, 12);

      const lenderUser = this.userRepository.create({
        email: createLenderDto.contact_email.trim().toLowerCase(),
        passwordHash: tempPasswordHash,
        role: UserRole.LENDER,
        status: UserStatus.PENDING_VERIFICATION,
        tenantId: lenderTenantId,
      });

      const savedUser = await this.userRepository.save(lenderUser);
      this.logger.log(`✅ Lender user created with ID: ${savedUser.id}`);

      // Create user profile (following tenant creation pattern)
      const nameParts = (createLenderDto.name || 'Lender Admin').split(' ');
      const userProfile = this.userProfileRepository.create({
        userId: savedUser.id,
        tenantId: lenderTenantId,
        firstName: nameParts[0] || 'Lender',
        lastName: nameParts.slice(1).join(' ') || 'Admin',
        companyName: createLenderDto.name,
      });
      await this.userProfileRepository.save(userProfile);
      this.logger.log(`✅ User profile created for lender user`);

      // Generate password setup token
      this.logger.log(`📧 Generating password setup token for: ${createLenderDto.contact_email}`);
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
      `Creating loan request for tenant: ${createLoanDto.tenant_id}`,
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
      await this.validateLenderAvailability(createLoanDto.lender_id);
    }

    const idempotencyKey = this.generateIdempotencyKey(createLoanDto);

    // Check for existing loan request with enhanced idempotency
    await this.checkIdempotency(idempotencyKey, createLoanDto.tenant_id);

    const loanRequest = this.loanRequestRepository.create({
      ...createLoanDto,
      idempotency_key: idempotencyKey,
      created_by: createdBy,
      due_date: createLoanDto.due_date
        ? new Date(createLoanDto.due_date)
        : null,
    });

    const savedLoan = await this.loanRequestRepository.save(loanRequest);

    // Attempt to process with available lenders
    await this.processLoanRequest(savedLoan.id);

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
        await this.validateLenderAvailability(lender.id);
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
    const loan = await this.loanRequestRepository.findOne({
      where: { id: loanId },
      relations: ['lender'],
    });

    if (!loan || loan.status !== LoanRequestStatus.PENDING) {
      return;
    }

    // Find suitable lender
    const lender = await this.findSuitableLender(loan);
    if (!lender) {
      this.logger.warn(`No suitable lender found for loan ${loanId}`);
      return;
    }

    // Update loan with lender
    loan.lender_id = lender.id;
    await this.loanRequestRepository.save(loan);

    // Send loan request to lender
    try {
      await this.sendLoanRequestToLender(loan, lender);
    } catch (error) {
      this.logger.error(
        `Failed to send loan request to lender: ${error.message}`,
      );
      // Could implement retry logic here
    }
  }

  private async findSuitableLender(loan: LoanRequest): Promise<Lender | null> {
    const lenders = await this.lenderRepository.find({
      where: { status: LenderStatus.ACTIVE },
      relations: ['policies'],
    });

    for (const lender of lenders) {
      const policy = lender.policies?.[0]; // Get latest policy
      if (!policy) continue;

      // Check if loan amount is within limits
      if (loan.requested_amount <= policy.max_advance_per_trip) {
        // Check current exposure
        const currentExposure = await this.getCurrentExposure(lender.id);
        if (currentExposure + loan.requested_amount <= policy.max_exposure) {
          return lender;
        }
      }
    }

    return null;
  }

  private async getCurrentExposure(lenderId: string): Promise<number> {
    const result = await this.loanRequestRepository
      .createQueryBuilder('loan')
      .select('SUM(loan.approved_amount)', 'total')
      .where('loan.lender_id = :lenderId', { lenderId })
      .andWhere('loan.status IN (:...statuses)', {
        statuses: [LoanRequestStatus.APPROVED, LoanRequestStatus.DISBURSED],
      })
      .getRawOne();

    return parseFloat(result?.total || '0');
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
    approval: LoanApprovalDto,
  ): Promise<LoanRequest> {
    return await this.dataSource.transaction(async (manager) => {
      const loan = await manager.findOne(LoanRequest, {
        where: { id: loanId },
      } as any);
      if (!loan) {
        throw new NotFoundException('Loan request not found');
      }

      loan.status = LoanRequestStatus.APPROVED;
      loan.approved_amount = approval.approved_amount;
      loan.external_loan_ref = approval.external_loan_ref;
      loan.interest_amount = approval.interest_amount;
      const anyApproval: any = approval as any;
      if (anyApproval.due_date) {
        loan.due_date = new Date(anyApproval.due_date);
      }

      const updatedLoan = await manager.save(LoanRequest, loan);

      if (approval.disbursement_instruction?.mode === 'platform_initiated') {
        await this.initiateDisbursement(loanId);
      }

      return updatedLoan;
    });
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

    loan.status = LoanRequestStatus.REJECTED;
    loan.rejection_reason = reason;

    return await this.loanRequestRepository.save(loan);
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

      const disbursement = manager.create(LoanDisbursement, {
        loan_request_id: loanId,
        beneficiaries: loan.requested_split,
        status: DisbursementStatus.INITIATED,
        attempts: 1,
      });

      const savedDisbursement = await manager.save(
        LoanDisbursement,
        disbursement,
      );

      try {
        await this.processDisbursementToBeneficiaries(savedDisbursement);
        loan.status = LoanRequestStatus.DISBURSED;
        await manager.save(LoanRequest, loan);
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

      if (loan.status !== LoanRequestStatus.APPROVED) {
        throw new BadRequestException(
          'Loan must be approved before disbursement',
        );
      }

      // Get trip from loan
      const trip = await manager.findOne('Trip', {
        where: { id: loan.trip_id },
        relations: ['load', 'load.assignedTruck'],
      } as any);

      if (!trip) {
        throw new NotFoundException('Trip not found for this loan');
      }

      // Get truck owner phone number - try multiple sources
      let truckOwnerPhone = paymentDto.truckOwnerPhoneNumber;
      
      if (!truckOwnerPhone && trip.load?.assignedTruckId) {
        // Get truck details
        const truck = await manager.findOne('Truck', {
          where: { id: trip.load.assignedTruckId },
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
      const disbursement = manager.create(LoanDisbursement, {
        loan_request_id: loanId,
        beneficiaries: loan.requested_split,
        status: DisbursementStatus.INITIATED,
        attempts: 1,
      });

      const savedDisbursement = await manager.save(LoanDisbursement, disbursement);

      // Process payment via mobile money if requested
      if (paymentDto.paymentMethod === 'mobile_money' && truckOwnerPhone) {
        try {
          // Use ModuleRef to get PaymentsService dynamically to avoid circular dependency
          if (this.moduleRef) {
            const paymentsService = this.moduleRef.get('PaymentsService', { strict: false });
            
            if (paymentsService) {
              const { PaymentMethod, PaymentType } = await import('../../entities/payment.entity');
              
              const createPaymentDto = {
                tripId: trip.id,
                amount: loan.approved_amount || loan.requested_amount,
                currency: 'RWF',
                paymentMethod: PaymentMethod.DIGITAL_WALLET,
                paymentType: PaymentType.TRIP_PAYMENT,
                description: `Loan disbursement payment for loan ${loan.id}`,
                referenceNumber: `LOAN-${loan.id}-DISB-${Date.now()}`,
                metadata: {
                  lenderId: loan.lender_id,
                  lenderName: loan.lender?.name,
                  financedAmount: loan.approved_amount || loan.requested_amount,
                  isLenderPayment: true,
                  phoneNumber: truckOwnerPhone,
                  loanId: loan.id,
                  disbursementId: savedDisbursement.id,
                },
              };

              const payment = await paymentsService.createPayment(
                createPaymentDto,
                tenantId,
                lenderUserId,
              );

              // Process the payment
              const processedPayment = await paymentsService.processPayment(
                payment.id,
                tenantId,
              );

              if (processedPayment.status === 'completed' || processedPayment.status === 'processing') {
                disbursement.status = DisbursementStatus.DISBURSED;
                disbursement.disbursement_date = new Date();
                disbursement.external_txn_ref = processedPayment.transactionId || `DISB-${Date.now()}`;
                loan.status = LoanRequestStatus.DISBURSED;
                await manager.save(LoanDisbursement, disbursement);
                await manager.save(LoanRequest, loan);
              } else {
                throw new BadRequestException('Payment processing failed');
              }

              return {
                success: true,
                disbursement: savedDisbursement,
                payment: {
                  id: processedPayment.id,
                  status: processedPayment.status,
                  transactionId: processedPayment.transactionId,
                },
              };
            } else {
              throw new BadRequestException('PaymentsService not available');
            }
          } else {
            throw new BadRequestException('ModuleRef not available');
          }
        } catch (error) {
          this.logger.error(`Mobile money payment failed for disbursement: ${error.message}`);
          throw new BadRequestException(`Payment processing failed: ${error.message}`);
        }
      }

      // Fallback to regular disbursement
      await this.processDisbursementToBeneficiaries(savedDisbursement);
      loan.status = LoanRequestStatus.DISBURSED;
      await manager.save(LoanRequest, loan);

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

  async getLenderDashboard(lenderId: string, dateFrom?: Date, dateTo?: Date) {
    const queryBuilder = this.loanRequestRepository
      .createQueryBuilder('loan')
      .where('loan.lender_id = :lenderId', { lenderId });

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

  async getAllLenders(tenantId?: string): Promise<Lender[]> {
    const whereCondition = tenantId ? { tenant_id: tenantId } : {};
    return await this.lenderRepository.find({
      where: whereCondition,
      relations: ['policies'],
      order: { created_at: 'DESC' },
    });
  }

  async getLenderByUserEmail(email: string): Promise<Lender | null> {
    return await this.lenderRepository.findOne({
      where: { contact_email: email },
    });
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

  // Extended Profile Management Methods
  async getLenderProfile(lenderId: string): Promise<LenderProfileResponseDto> {
    const lender = await this.lenderRepository.findOne({
      where: { id: lenderId },
      relations: ['policies'],
    });

    if (!lender) {
      throw new NotFoundException('Lender not found');
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
    const lender = await this.getLenderById(lenderId);

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
    const lender = await this.getLenderById(lenderId);

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
    const lender = await this.getLenderById(lenderId);

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
    const lender = await this.getLenderById(lenderId);

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
    const lender = await this.getLenderById(lenderId);

    // Store in metadata
    const currentMetadata = lender.metadata || {};
    lender.metadata = {
      ...currentMetadata,
      preferences: preferences,
    };

    return await this.lenderRepository.save(lender);
  }

  async getLenderLoanRequests(
    lenderId: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    // First, try to find if lenderId is a Lender entity ID
    let actualLenderId = lenderId;
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
        // Find lender by contact_email matching user email
        lender = await this.lenderRepository.findOne({
          where: { contact_email: user.email },
        });

        if (lender) {
          actualLenderId = lender.id;
          this.logger.log(`Resolved lender ID from user ${lenderId} to lender entity ${actualLenderId}`);
        } else {
          // If no lender entity found, try to find loan requests by user ID in metadata
          this.logger.log(`No lender entity found for user ${lenderId}, searching loan requests by metadata`);
          const queryBuilder = this.loanRequestRepository
            .createQueryBuilder('loan')
            .leftJoinAndSelect('loan.lender', 'lender')
            .leftJoinAndSelect('loan.disbursements', 'disbursements')
            .leftJoinAndSelect('loan.repayments', 'repayments')
            .where('loan.metadata->>\'selected_lender\' = :userId', { userId: lenderId })
            .orderBy('loan.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

          if (status) {
            queryBuilder.andWhere('loan.status = :status', { status });
          }

          const [loans, total] = await queryBuilder.getManyAndCount();

          return {
            data: loans,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          };
        }
      }
    }

    // Query by lender entity ID
    const queryBuilder = this.loanRequestRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.lender', 'lender')
      .leftJoinAndSelect('loan.disbursements', 'disbursements')
      .leftJoinAndSelect('loan.repayments', 'repayments')
      .where('loan.lender_id = :lenderId', { lenderId: actualLenderId })
      .orderBy('loan.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      queryBuilder.andWhere('loan.status = :status', { status });
    }

    const [loans, total] = await queryBuilder.getManyAndCount();

    this.logger.log(`Found ${total} loan requests for lender ${actualLenderId}`);

    return {
      data: loans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLenderAnalytics(lenderId: string, period: string = '30d') {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const loans = await this.loanRequestRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.repayments', 'repayments')
      .where('loan.lender_id = :lenderId', { lenderId })
      .andWhere('loan.created_at >= :fromDate', { fromDate })
      .getMany();

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

  async getActiveLoan(lenderId: string, page: number = 1, limit: number = 10) {
    const queryBuilder = this.loanRequestRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.lender', 'lender')
      .leftJoinAndSelect('loan.disbursements', 'disbursements')
      .leftJoinAndSelect('loan.repayments', 'repayments')
      .where('loan.lender_id = :lenderId', { lenderId })
      .andWhere('loan.status IN (:...statuses)', {
        statuses: ['approved', 'disbursed'],
      })
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
    limit: number = 10,
  ) {
    // Get unique borrowers from loans
    const borrowersQuery = this.loanRequestRepository
      .createQueryBuilder('loan')
      .select(['loan.tenant_id', 'loan.created_by'])
      .addSelect('COUNT(loan.id)', 'loan_count')
      .addSelect('SUM(loan.approved_amount)', 'total_borrowed')
      .addSelect(
        "AVG(CASE WHEN loan.status = 'repaid' THEN 1.0 ELSE 0.0 END)",
        'repayment_rate',
      )
      .where('loan.lender_id = :lenderId', { lenderId })
      .groupBy('loan.tenant_id, loan.created_by')
      .orderBy('loan_count', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const borrowers = await borrowersQuery.getRawMany();
    const total = await this.loanRequestRepository
      .createQueryBuilder('loan')
      .select('DISTINCT loan.tenant_id')
      .where('loan.lender_id = :lenderId', { lenderId })
      .getCount();

    return {
      data: borrowers.map((b) => ({
        tenant_id: b.loan_tenant_id,
        created_by: b.loan_created_by,
        loan_count: parseInt(b.loan_count),
        total_borrowed: parseFloat(b.total_borrowed) || 0,
        repayment_rate: parseFloat(b.repayment_rate) || 0,
      })),
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

  // Disbursement Management Methods
  async getLenderDisbursements(lenderId: string, query: DisbursementQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = query;

    const queryBuilder = this.loanDisbursementRepository
      .createQueryBuilder('disbursement')
      .leftJoinAndSelect('disbursement.loan_request', 'loan')
      .leftJoinAndSelect('loan.lender', 'lender')
      .leftJoinAndSelect('loan.borrower', 'borrower')
      .where('lender.id = :lenderId', { lenderId });

    if (status) {
      queryBuilder.andWhere('disbursement.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('disbursement.priority = :priority', { priority });
    }

    if (search) {
      queryBuilder.andWhere(
        '(borrower.name ILIKE :search OR disbursement.id::text ILIKE :search OR loan.id::text ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy(
        `disbursement.${sortBy}`,
        sortOrder.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip((page - 1) * limit)
      .take(limit);

    const [disbursements, total] = await queryBuilder.getManyAndCount();

    // Calculate stats
    const stats = await this.calculateDisbursementStats(lenderId);

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
    const stats = await this.loanDisbursementRepository
      .createQueryBuilder('disbursement')
      .leftJoin('disbursement.loan_request', 'loan')
      .leftJoin('loan.lender', 'lender')
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
      .where('lender.id = :lenderId', { lenderId })
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
      loanId: loan?.id || '',
      borrowerName: borrower?.name || borrower?.company_name || 'Unknown',
      amount: disbursement.amount || loan?.requested_amount || 0,
      requestedDate: disbursement.created_at?.toISOString().split('T')[0] || '',
      approvedDate:
        disbursement.status === DisbursementStatus.APPROVED
          ? disbursement.updated_at?.toISOString().split('T')[0]
          : undefined,
      disbursedDate:
        disbursement.disbursement_date?.toISOString().split('T')[0] ||
        undefined,
      status: statusMapping[disbursement.status] || 'pending',
      cargoType: loan?.cargo_type || 'General Cargo',
      route: {
        origin: loan?.pickup_location || 'N/A',
        destination: loan?.delivery_location || 'N/A',
      },
      purpose: disbursement.purpose || loan?.purpose || 'Cargo financing',
      interestRate: disbursement.interest_rate || loan?.interest_rate || 0,
      termMonths: disbursement.term_months || loan?.term_months || 12,
      documents: disbursement.documents || [
        { type: 'Business License', status: 'verified' },
        { type: 'Financial Statements', status: 'pending' },
      ],
      riskScore: disbursement.risk_score || 0,
      creditScore: disbursement.credit_score || 0,
      collateralValue: disbursement.collateral_value || 0,
      disbursementMethod: disbursement.disbursement_method || 'bank_transfer',
      notes: disbursement.notes || '',
      priority: disbursement.priority || 'medium',
    };
  }

  // Get lender repayments with filtering and pagination - CRITICAL MISSING METHOD
  async getLenderRepayments(lenderId: string, queryOptions: any) {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = queryOptions;

      const queryBuilder = this.loanRepaymentRepository
        .createQueryBuilder('repayment')
        .leftJoinAndSelect('repayment.loan_request', 'loan')
        .leftJoinAndSelect('loan.lender', 'lender')
        .leftJoinAndSelect('loan.borrower', 'borrower')
        .where('lender.id = :lenderId', { lenderId });

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

        return {
          creditCheckId,
          status: 'completed',
          estimatedCompletionTime,
          cost: totalCost,
          borrower: {
            id: borrower.id,
            name: borrower.company_name || borrower.contact_name,
            currentCreditScore: borrower.credit_score || 0,
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
      let creditScore = borrower.credit_score || 600; // Base score

      // Adjust based on recent performance
      if (defaultRate === 0 && completedLoans > 0) {
        creditScore += 50; // Good performance bonus
      } else if (defaultRate > 20) {
        creditScore -= 100; // High default rate penalty
      }

      // Ensure score is within valid range
      creditScore = Math.max(300, Math.min(850, creditScore));

      return {
        creditScore,
        riskLevel: this.calculateRiskLevel(creditScore, defaultedLoans),
        recentLoanCount: totalRecentLoans,
        defaultRate: Math.round(defaultRate * 100) / 100,
        completedLoanCount: completedLoans,
        recommendation: this.getCreditRecommendation(creditScore, defaultRate),
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to perform basic credit check: ${error.message}`,
        error.stack,
      );
      return {
        creditScore: borrower.credit_score || 0,
        riskLevel: 'unknown',
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
    // Simple risk score calculation (0-100, lower is better)
    let riskScore = 50; // Base score

    // Adjust for default rate
    riskScore += defaultRate * 2; // Each % of default adds 2 points

    // Adjust for credit score
    if (avgCreditScore > 0) {
      riskScore -= (avgCreditScore - 600) / 10; // Better credit scores reduce risk
    }

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, Math.round(riskScore)));
  }
}
