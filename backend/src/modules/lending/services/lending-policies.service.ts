import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { LendingPolicyInterestRate } from '../../../entities/lending-policy-interest-rate.entity';
import { LendingPolicyLoanLimit } from '../../../entities/lending-policy-loan-limit.entity';
import { LendingPolicyEligibility } from '../../../entities/lending-policy-eligibility.entity';
import { LendingPolicyRiskAssessment } from '../../../entities/lending-policy-risk-assessment.entity';
import { LendingPolicyRepayment } from '../../../entities/lending-policy-repayment.entity';
import { LendingPolicyCargoType } from '../../../entities/lending-policy-cargo-type.entity';
import { LendingPolicySystemConfig } from '../../../entities/lending-policy-system-config.entity';
import { Lender } from '../../../entities/lender.entity';
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

@Injectable()
export class LendingPoliciesService {
  private readonly logger = new Logger(LendingPoliciesService.name);

  constructor(
    @InjectRepository(LendingPolicyInterestRate)
    private interestRateRepository: Repository<LendingPolicyInterestRate>,
    
    @InjectRepository(LendingPolicyLoanLimit)
    private loanLimitRepository: Repository<LendingPolicyLoanLimit>,
    
    @InjectRepository(LendingPolicyEligibility)
    private eligibilityRepository: Repository<LendingPolicyEligibility>,
    
    @InjectRepository(LendingPolicyRiskAssessment)
    private riskAssessmentRepository: Repository<LendingPolicyRiskAssessment>,
    
    @InjectRepository(LendingPolicyRepayment)
    private repaymentRepository: Repository<LendingPolicyRepayment>,
    
    @InjectRepository(LendingPolicyCargoType)
    private cargoTypeRepository: Repository<LendingPolicyCargoType>,
    
    @InjectRepository(LendingPolicySystemConfig)
    private systemConfigRepository: Repository<LendingPolicySystemConfig>,
    
    @InjectRepository(Lender)
    private lenderRepository: Repository<Lender>,
  ) {}

  // ===== UTILITY METHODS =====

  private async validateLenderExists(lenderId: string): Promise<void> {
    try {
      const lender = await this.lenderRepository.findOne({ where: { id: lenderId } });
      if (!lender) {
        this.logger.warn(`Lender with ID ${lenderId} not found`);
        throw new NotFoundException(`Lender with ID ${lenderId} not found`);
      }
      this.logger.log(`Lender ${lenderId} validated successfully`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error validating lender ${lenderId}:`, error);
      throw new BadRequestException(`Failed to validate lender: ${error.message}`);
    }
  }

  // ===== INTEREST RATE POLICIES =====

  async createInterestRatePolicy(
    lenderId: string,
    dto: CreateInterestRatePolicyDto,
    createdBy?: string,
  ): Promise<LendingPolicyInterestRate> {
    await this.validateLenderExists(lenderId);

    // Validate rate ranges
    if (dto.min_rate > dto.max_rate) {
      throw new BadRequestException('Minimum rate cannot be greater than maximum rate');
    }
    if (dto.base_rate < dto.min_rate || dto.base_rate > dto.max_rate) {
      throw new BadRequestException('Base rate must be between minimum and maximum rates');
    }

    const policy = this.interestRateRepository.create({
      ...dto,
      lender_id: lenderId,
      created_by: createdBy,
    });

    const savedPolicy = await this.interestRateRepository.save(policy);
    this.logger.log(`Created interest rate policy ${savedPolicy.id} for lender ${lenderId}`);
    
    return savedPolicy;
  }

  async getInterestRatePolicies(
    lenderId: string,
    activeOnly: boolean = false,
  ): Promise<LendingPolicyInterestRate[]> {
    const where: FindOptionsWhere<LendingPolicyInterestRate> = { lender_id: lenderId };
    if (activeOnly) {
      where.is_active = true;
    }

    return this.interestRateRepository.find({
      where,
      order: { priority: 'DESC', created_at: 'DESC' },
    });
  }

  async getInterestRatePolicy(
    lenderId: string,
    policyId: string,
  ): Promise<LendingPolicyInterestRate> {
    const policy = await this.interestRateRepository.findOne({
      where: { id: policyId, lender_id: lenderId },
    });

    if (!policy) {
      throw new NotFoundException(`Interest rate policy ${policyId} not found`);
    }

    return policy;
  }

  async updateInterestRatePolicy(
    lenderId: string,
    policyId: string,
    dto: UpdateInterestRatePolicyDto,
    updatedBy?: string,
  ): Promise<LendingPolicyInterestRate> {
    const policy = await this.getInterestRatePolicy(lenderId, policyId);

    // Validate rate ranges
    if (dto.min_rate > dto.max_rate) {
      throw new BadRequestException('Minimum rate cannot be greater than maximum rate');
    }
    if (dto.base_rate < dto.min_rate || dto.base_rate > dto.max_rate) {
      throw new BadRequestException('Base rate must be between minimum and maximum rates');
    }

    Object.assign(policy, dto, { updated_by: updatedBy });
    const updatedPolicy = await this.interestRateRepository.save(policy);
    
    this.logger.log(`Updated interest rate policy ${policyId} for lender ${lenderId}`);
    return updatedPolicy;
  }

  async deleteInterestRatePolicy(lenderId: string, policyId: string): Promise<void> {
    const policy = await this.getInterestRatePolicy(lenderId, policyId);
    await this.interestRateRepository.remove(policy);
    this.logger.log(`Deleted interest rate policy ${policyId} for lender ${lenderId}`);
  }

  async toggleInterestRatePolicyStatus(
    lenderId: string,
    policyId: string,
    isActive: boolean,
    updatedBy?: string,
  ): Promise<LendingPolicyInterestRate> {
    const policy = await this.getInterestRatePolicy(lenderId, policyId);
    policy.is_active = isActive;
    policy.updated_by = updatedBy;
    
    const updatedPolicy = await this.interestRateRepository.save(policy);
    this.logger.log(`Toggled interest rate policy ${policyId} status to ${isActive} for lender ${lenderId}`);
    
    return updatedPolicy;
  }

  // ===== LOAN LIMIT POLICIES =====

  async createLoanLimitPolicy(
    lenderId: string,
    dto: CreateLoanLimitPolicyDto,
    createdBy?: string,
  ): Promise<LendingPolicyLoanLimit> {
    await this.validateLenderExists(lenderId);

    if (dto.min_amount > dto.max_amount) {
      throw new BadRequestException('Minimum amount cannot be greater than maximum amount');
    }

    const policy = this.loanLimitRepository.create({
      ...dto,
      lender_id: lenderId,
      created_by: createdBy,
    });

    const savedPolicy = await this.loanLimitRepository.save(policy);
    this.logger.log(`Created loan limit policy ${savedPolicy.id} for lender ${lenderId}`);
    
    return savedPolicy;
  }

  async getLoanLimitPolicies(
    lenderId: string,
    activeOnly: boolean = false,
  ): Promise<LendingPolicyLoanLimit[]> {
    const where: FindOptionsWhere<LendingPolicyLoanLimit> = { lender_id: lenderId };
    if (activeOnly) {
      where.is_active = true;
    }

    return this.loanLimitRepository.find({
      where,
      order: { priority: 'DESC', created_at: 'DESC' },
    });
  }

  async getLoanLimitPolicy(
    lenderId: string,
    policyId: string,
  ): Promise<LendingPolicyLoanLimit> {
    const policy = await this.loanLimitRepository.findOne({
      where: { id: policyId, lender_id: lenderId },
    });

    if (!policy) {
      throw new NotFoundException(`Loan limit policy ${policyId} not found`);
    }

    return policy;
  }

  async updateLoanLimitPolicy(
    lenderId: string,
    policyId: string,
    dto: UpdateLoanLimitPolicyDto,
    updatedBy?: string,
  ): Promise<LendingPolicyLoanLimit> {
    const policy = await this.getLoanLimitPolicy(lenderId, policyId);

    if (dto.min_amount > dto.max_amount) {
      throw new BadRequestException('Minimum amount cannot be greater than maximum amount');
    }

    Object.assign(policy, dto, { updated_by: updatedBy });
    const updatedPolicy = await this.loanLimitRepository.save(policy);
    
    this.logger.log(`Updated loan limit policy ${policyId} for lender ${lenderId}`);
    return updatedPolicy;
  }

  async deleteLoanLimitPolicy(lenderId: string, policyId: string): Promise<void> {
    const policy = await this.getLoanLimitPolicy(lenderId, policyId);
    await this.loanLimitRepository.remove(policy);
    this.logger.log(`Deleted loan limit policy ${policyId} for lender ${lenderId}`);
  }

  // ===== ELIGIBILITY CRITERIA POLICIES =====

  async createEligibilityPolicy(
    lenderId: string,
    dto: CreateEligibilityPolicyDto,
    createdBy?: string,
  ): Promise<LendingPolicyEligibility> {
    await this.validateLenderExists(lenderId);

    const policy = this.eligibilityRepository.create({
      ...dto,
      lender_id: lenderId,
      created_by: createdBy,
    });

    const savedPolicy = await this.eligibilityRepository.save(policy);
    this.logger.log(`Created eligibility policy ${savedPolicy.id} for lender ${lenderId}`);
    
    return savedPolicy;
  }

  async getEligibilityPolicies(
    lenderId: string,
    activeOnly: boolean = false,
  ): Promise<LendingPolicyEligibility[]> {
    const where: FindOptionsWhere<LendingPolicyEligibility> = { lender_id: lenderId };
    if (activeOnly) {
      where.is_active = true;
    }

    return this.eligibilityRepository.find({
      where,
      order: { priority: 'DESC', created_at: 'DESC' },
    });
  }

  async getEligibilityPolicy(
    lenderId: string,
    policyId: string,
  ): Promise<LendingPolicyEligibility> {
    const policy = await this.eligibilityRepository.findOne({
      where: { id: policyId, lender_id: lenderId },
    });

    if (!policy) {
      throw new NotFoundException(`Eligibility policy ${policyId} not found`);
    }

    return policy;
  }

  async updateEligibilityPolicy(
    lenderId: string,
    policyId: string,
    dto: UpdateEligibilityPolicyDto,
    updatedBy?: string,
  ): Promise<LendingPolicyEligibility> {
    const policy = await this.getEligibilityPolicy(lenderId, policyId);

    Object.assign(policy, dto, { updated_by: updatedBy });
    const updatedPolicy = await this.eligibilityRepository.save(policy);
    
    this.logger.log(`Updated eligibility policy ${policyId} for lender ${lenderId}`);
    return updatedPolicy;
  }

  async deleteEligibilityPolicy(lenderId: string, policyId: string): Promise<void> {
    const policy = await this.getEligibilityPolicy(lenderId, policyId);
    await this.eligibilityRepository.remove(policy);
    this.logger.log(`Deleted eligibility policy ${policyId} for lender ${lenderId}`);
  }

  // ===== RISK ASSESSMENT POLICIES =====

  async createRiskAssessmentPolicy(
    lenderId: string,
    dto: CreateRiskAssessmentPolicyDto,
    createdBy?: string,
  ): Promise<LendingPolicyRiskAssessment> {
    await this.validateLenderExists(lenderId);

    const policy = this.riskAssessmentRepository.create({
      ...dto,
      lender_id: lenderId,
      created_by: createdBy,
    });

    const savedPolicy = await this.riskAssessmentRepository.save(policy);
    this.logger.log(`Created risk assessment policy ${savedPolicy.id} for lender ${lenderId}`);
    
    return savedPolicy;
  }

  async getRiskAssessmentPolicies(
    lenderId: string,
    activeOnly: boolean = false,
  ): Promise<LendingPolicyRiskAssessment[]> {
    const where: FindOptionsWhere<LendingPolicyRiskAssessment> = { lender_id: lenderId };
    if (activeOnly) {
      where.is_active = true;
    }

    return this.riskAssessmentRepository.find({
      where,
      order: { priority: 'DESC', created_at: 'DESC' },
    });
  }

  async getRiskAssessmentPolicy(
    lenderId: string,
    policyId: string,
  ): Promise<LendingPolicyRiskAssessment> {
    const policy = await this.riskAssessmentRepository.findOne({
      where: { id: policyId, lender_id: lenderId },
    });

    if (!policy) {
      throw new NotFoundException(`Risk assessment policy ${policyId} not found`);
    }

    return policy;
  }

  async updateRiskAssessmentPolicy(
    lenderId: string,
    policyId: string,
    dto: UpdateRiskAssessmentPolicyDto,
    updatedBy?: string,
  ): Promise<LendingPolicyRiskAssessment> {
    const policy = await this.getRiskAssessmentPolicy(lenderId, policyId);

    Object.assign(policy, dto, { updated_by: updatedBy });
    const updatedPolicy = await this.riskAssessmentRepository.save(policy);
    
    this.logger.log(`Updated risk assessment policy ${policyId} for lender ${lenderId}`);
    return updatedPolicy;
  }

  async deleteRiskAssessmentPolicy(lenderId: string, policyId: string): Promise<void> {
    const policy = await this.getRiskAssessmentPolicy(lenderId, policyId);
    await this.riskAssessmentRepository.remove(policy);
    this.logger.log(`Deleted risk assessment policy ${policyId} for lender ${lenderId}`);
  }

  // ===== REPAYMENT POLICIES =====

  async createRepaymentPolicy(
    lenderId: string,
    dto: CreateRepaymentPolicyDto,
    createdBy?: string,
  ): Promise<LendingPolicyRepayment> {
    await this.validateLenderExists(lenderId);

    const policy = this.repaymentRepository.create({
      ...dto,
      lender_id: lenderId,
      created_by: createdBy,
    });

    const savedPolicy = await this.repaymentRepository.save(policy);
    this.logger.log(`Created repayment policy ${savedPolicy.id} for lender ${lenderId}`);
    
    return savedPolicy;
  }

  async getRepaymentPolicies(
    lenderId: string,
    activeOnly: boolean = false,
  ): Promise<LendingPolicyRepayment[]> {
    const where: FindOptionsWhere<LendingPolicyRepayment> = { lender_id: lenderId };
    if (activeOnly) {
      where.is_active = true;
    }

    return this.repaymentRepository.find({
      where,
      order: { priority: 'DESC', created_at: 'DESC' },
    });
  }

  async getRepaymentPolicy(
    lenderId: string,
    policyId: string,
  ): Promise<LendingPolicyRepayment> {
    const policy = await this.repaymentRepository.findOne({
      where: { id: policyId, lender_id: lenderId },
    });

    if (!policy) {
      throw new NotFoundException(`Repayment policy ${policyId} not found`);
    }

    return policy;
  }

  async updateRepaymentPolicy(
    lenderId: string,
    policyId: string,
    dto: UpdateRepaymentPolicyDto,
    updatedBy?: string,
  ): Promise<LendingPolicyRepayment> {
    const policy = await this.getRepaymentPolicy(lenderId, policyId);

    Object.assign(policy, dto, { updated_by: updatedBy });
    const updatedPolicy = await this.repaymentRepository.save(policy);
    
    this.logger.log(`Updated repayment policy ${policyId} for lender ${lenderId}`);
    return updatedPolicy;
  }

  async deleteRepaymentPolicy(lenderId: string, policyId: string): Promise<void> {
    const policy = await this.getRepaymentPolicy(lenderId, policyId);
    await this.repaymentRepository.remove(policy);
    this.logger.log(`Deleted repayment policy ${policyId} for lender ${lenderId}`);
  }

  // ===== CARGO TYPE POLICIES =====

  async createCargoTypePolicy(
    lenderId: string,
    dto: CreateCargoTypePolicyDto,
    createdBy?: string,
  ): Promise<LendingPolicyCargoType> {
    await this.validateLenderExists(lenderId);

    const policy = this.cargoTypeRepository.create({
      ...dto,
      lender_id: lenderId,
      created_by: createdBy,
    });

    const savedPolicy = await this.cargoTypeRepository.save(policy);
    this.logger.log(`Created cargo type policy ${savedPolicy.id} for lender ${lenderId}`);
    
    return savedPolicy;
  }

  async getCargoTypePolicies(
    lenderId: string,
    activeOnly: boolean = false,
  ): Promise<LendingPolicyCargoType[]> {
    const where: FindOptionsWhere<LendingPolicyCargoType> = { lender_id: lenderId };
    if (activeOnly) {
      where.is_active = true;
    }

    return this.cargoTypeRepository.find({
      where,
      order: { priority: 'DESC', created_at: 'DESC' },
    });
  }

  async getCargoTypePolicy(
    lenderId: string,
    policyId: string,
  ): Promise<LendingPolicyCargoType> {
    const policy = await this.cargoTypeRepository.findOne({
      where: { id: policyId, lender_id: lenderId },
    });

    if (!policy) {
      throw new NotFoundException(`Cargo type policy ${policyId} not found`);
    }

    return policy;
  }

  async updateCargoTypePolicy(
    lenderId: string,
    policyId: string,
    dto: UpdateCargoTypePolicyDto,
    updatedBy?: string,
  ): Promise<LendingPolicyCargoType> {
    const policy = await this.getCargoTypePolicy(lenderId, policyId);

    Object.assign(policy, dto, { updated_by: updatedBy });
    const updatedPolicy = await this.cargoTypeRepository.save(policy);
    
    this.logger.log(`Updated cargo type policy ${policyId} for lender ${lenderId}`);
    return updatedPolicy;
  }

  async deleteCargoTypePolicy(lenderId: string, policyId: string): Promise<void> {
    const policy = await this.getCargoTypePolicy(lenderId, policyId);
    await this.cargoTypeRepository.remove(policy);
    this.logger.log(`Deleted cargo type policy ${policyId} for lender ${lenderId}`);
  }

  // ===== SYSTEM CONFIG POLICIES =====

  async createSystemConfigPolicy(
    lenderId: string,
    dto: CreateSystemConfigPolicyDto,
    createdBy?: string,
  ): Promise<LendingPolicySystemConfig> {
    await this.validateLenderExists(lenderId);

    // Check if system config already exists for this lender
    const existingConfig = await this.systemConfigRepository.findOne({
      where: { lender_id: lenderId },
    });

    if (existingConfig) {
      throw new BadRequestException(`System config already exists for lender ${lenderId}`);
    }

    const policy = this.systemConfigRepository.create({
      ...dto,
      lender_id: lenderId,
      created_by: createdBy,
    });

    const savedPolicy = await this.systemConfigRepository.save(policy);
    this.logger.log(`Created system config policy ${savedPolicy.id} for lender ${lenderId}`);
    
    return savedPolicy;
  }

  async getSystemConfigPolicy(lenderId: string): Promise<LendingPolicySystemConfig | null> {
    return this.systemConfigRepository.findOne({
      where: { lender_id: lenderId },
    });
  }

  async updateSystemConfigPolicy(
    lenderId: string,
    dto: UpdateSystemConfigPolicyDto,
    updatedBy?: string,
  ): Promise<LendingPolicySystemConfig> {
    const policy = await this.getSystemConfigPolicy(lenderId);

    if (!policy) {
      throw new NotFoundException(`System config policy not found for lender ${lenderId}`);
    }

    Object.assign(policy, dto, { updated_by: updatedBy });
    const updatedPolicy = await this.systemConfigRepository.save(policy);
    
    this.logger.log(`Updated system config policy for lender ${lenderId}`);
    return updatedPolicy;
  }

  async deleteSystemConfigPolicy(lenderId: string): Promise<void> {
    const policy = await this.getSystemConfigPolicy(lenderId);
    
    if (!policy) {
      throw new NotFoundException(`System config policy not found for lender ${lenderId}`);
    }

    await this.systemConfigRepository.remove(policy);
    this.logger.log(`Deleted system config policy for lender ${lenderId}`);
  }

  // ===== COMPREHENSIVE POLICY RETRIEVAL =====

  async getAllPoliciesForLender(lenderId: string, activeOnly: boolean = false) {
    try {
      // Validate lender exists first
      await this.validateLenderExists(lenderId);

      const [
        interestRates,
        loanLimits,
        eligibilityCriteria,
        riskAssessment,
        repaymentPolicies,
        cargoTypePolicies,
        systemConfig,
      ] = await Promise.all([
        this.getInterestRatePolicies(lenderId, activeOnly),
        this.getLoanLimitPolicies(lenderId, activeOnly),
        this.getEligibilityPolicies(lenderId, activeOnly),
        this.getRiskAssessmentPolicies(lenderId, activeOnly),
        this.getRepaymentPolicies(lenderId, activeOnly),
        this.getCargoTypePolicies(lenderId, activeOnly),
        this.getSystemConfigPolicy(lenderId),
      ]);

      this.logger.log(`Retrieved all policies for lender ${lenderId} (activeOnly: ${activeOnly})`);

      return {
        interestRates,
        loanLimits,
        eligibilityCriteria,
        riskAssessment,
        repaymentPolicies,
        cargoTypePolicies,
        systemConfig,
      };
    } catch (error) {
      this.logger.error(`Error retrieving policies for lender ${lenderId}:`, error);
      throw error;
    }
  }

  // ===== POLICY VALIDATION AND SCORING =====

  async validateLoanAgainstPolicies(
    lenderId: string,
    loanData: {
      amount: number;
      borrowerData: any;
      cargoType?: string;
      businessType?: string;
    },
  ): Promise<{
    isEligible: boolean;
    score: number;
    violations: string[];
    recommendations: string[];
  }> {
    const policies = await this.getAllPoliciesForLender(lenderId, true);
    
    const violations: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Validate against loan limits
    const applicableLoanLimit = policies.loanLimits.find(
      limit => limit.business_type === loanData.businessType
    );

    if (applicableLoanLimit) {
      if (loanData.amount < applicableLoanLimit.min_amount) {
        violations.push(`Loan amount below minimum of ${applicableLoanLimit.min_amount}`);
        score -= 20;
      }
      if (loanData.amount > applicableLoanLimit.max_amount) {
        violations.push(`Loan amount exceeds maximum of ${applicableLoanLimit.max_amount}`);
        score -= 30;
      }
    }

    // Validate against eligibility criteria
    for (const criteria of policies.eligibilityCriteria) {
      if (criteria.is_required) {
        // Add specific validation logic based on criteria category
        // This would be expanded based on actual borrower data structure
      }
    }

    // Calculate risk score
    let riskScore = 0;
    for (const riskRule of policies.riskAssessment) {
      // Add risk calculation logic
      riskScore += riskRule.weight;
    }

    const isEligible = violations.length === 0 && score >= 60;

    return {
      isEligible,
      score: Math.max(0, score),
      violations,
      recommendations,
    };
  }
}