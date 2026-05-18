import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Load } from '../../../entities/load.entity';
import { Trip } from '../../../entities/trip.entity';
import { LoanRequest } from '../../../entities/loan-request.entity';
import { LenderPolicy } from '../../../entities/lender-policy.entity';
import { RiskAssessmentService, RiskScore } from './risk-assessment.service';

export interface AutoLoanConfig {
  enabled: boolean;
  min_cargo_value: number;
  max_auto_loan_amount: number;
  auto_approval_threshold: number;
  require_manual_review: boolean;
}

@Injectable()
export class AutoLoanGeneratorService {
  private readonly logger = new Logger(AutoLoanGeneratorService.name);

  constructor(
    @InjectRepository(Load)
    private loadRepository: Repository<Load>,
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    @InjectRepository(LoanRequest)
    private loanRequestRepository: Repository<LoanRequest>,
    @InjectRepository(LenderPolicy)
    private lenderPolicyRepository: Repository<LenderPolicy>,
    private riskAssessmentService: RiskAssessmentService,
    private eventEmitter: EventEmitter2,
  ) {}

  async checkAndGenerateAutoLoan(
    cargoId: string,
    tripId: string,
    tenantId: string,
  ): Promise<LoanRequest | null> {
    try {
      this.logger.log(`Checking auto-loan eligibility for cargo ${cargoId}`);

      // Check if auto-loan generation is enabled for this tenant
      const config = await this.getAutoLoanConfig(tenantId);
      if (!config.enabled) {
        this.logger.log('Auto-loan generation is disabled for this tenant');
        return null;
      }

      // Validate load and trip status
      const [load, trip] = await Promise.all([
        this.loadRepository.findOne({ where: { id: cargoId } }),
        this.tripRepository.findOne({ where: { id: tripId } }),
      ]);

      if (!load || !trip) {
        this.logger.error('Load or trip not found');
        return null;
      }

      // Check if load is ready for auto-loan
      if (!this.isLoadReadyForAutoLoan(load, trip)) {
        this.logger.log('Load not ready for auto-loan generation');
        return null;
      }

      // Check if auto-loan already exists
      const existingLoan = await this.loanRequestRepository.findOne({
        where: { cargo_id: cargoId, trip_id: tripId },
      });

      if (existingLoan) {
        this.logger.log(
          'Auto-loan already exists for this cargo-trip combination',
        );
        return existingLoan;
      }

      // Assess risk and calculate loan terms
      const riskAssessment = await this.riskAssessmentService.assessLoanRisk(
        tenantId,
        tripId,
        cargoId,
        load.loadValue || load.offeredPrice || 0,
      );

      // Check if auto-approval criteria are met
      const autoApprovalEligible = this.checkAutoApprovalEligibility(
        riskAssessment,
        config,
        load.loadValue || load.offeredPrice || 0,
      );

      // Generate loan request
      const loanRequest = await this.generateAutoLoanRequest(
        load,
        trip,
        tenantId,
        cargoId,
        tripId,
        riskAssessment,
        autoApprovalEligible,
      );

      if (loanRequest) {
        this.logger.log(`Auto-loan generated successfully: ${loanRequest.id}`);

        // Emit event for notification and further processing
        this.eventEmitter.emit('auto.loan.generated', {
          loanId: loanRequest.id,
          tenantId,
          cargoId,
          tripId,
          amount: loanRequest.requested_amount,
          riskScore: riskAssessment.overall_score,
        });

        return loanRequest;
      }

      return null;
    } catch (error) {
      this.logger.error('Error generating auto-loan', error);
      throw error;
    }
  }

  private async getAutoLoanConfig(tenantId: string): Promise<AutoLoanConfig> {
    // In production, this would come from tenant configuration
    // For now, return default config
    return {
      enabled: true,
      min_cargo_value: 1000,
      max_auto_loan_amount: 50000,
      auto_approval_threshold: 75,
      require_manual_review: false,
    };
  }

  private isLoadReadyForAutoLoan(load: Load, trip: Trip): boolean {
    // Check if load is ready
    if (load.status !== 'ASSIGNED' && load.status !== 'IN_TRANSIT') {
      return false;
    }

    // Check if trip is confirmed and ready
    if (trip.status !== 'IN_PROGRESS' && trip.status !== 'PLANNED') {
      return false;
    }

    // Check if load has sufficient value
    if (!load.loadValue || load.loadValue < 1000) {
      return false;
    }

    // For now, assume insurance coverage exists
    return true;
  }

  private checkAutoApprovalEligibility(
    riskAssessment: RiskScore,
    config: AutoLoanConfig,
    cargoValue: number,
  ): boolean {
    // Check risk score threshold
    if (riskAssessment.overall_score < config.auto_approval_threshold) {
      return false;
    }

    // Check loan amount limits
    if (riskAssessment.max_loan_amount > config.max_auto_loan_amount) {
      return false;
    }

    // Check if manual review is required
    if (config.require_manual_review) {
      return false;
    }

    // Additional checks for high-value cargo
    if (cargoValue > 100000 && riskAssessment.risk_tier !== 'low') {
      return false;
    }

    return true;
  }

  private async generateAutoLoanRequest(
    load: Load,
    trip: Trip,
    tenantId: string,
    cargoId: string,
    tripId: string,
    riskAssessment: RiskScore,
    autoApprovalEligible: boolean,
  ): Promise<LoanRequest | null> {
    try {
      // Get lender policy for this tenant
      const lenderPolicy = await this.lenderPolicyRepository.findOne({
        where: { lender_id: tenantId },
      });

      if (!lenderPolicy) {
        this.logger.warn('No lender policy found for tenant');
        return null;
      }

      // Calculate loan amount based on risk assessment and policy
      const loanAmount = this.calculateLoanAmount(
        load.loadValue || load.offeredPrice || 0,
        riskAssessment,
        lenderPolicy,
      );

      // Calculate interest rate with risk adjustment
      const baseInterestRate = lenderPolicy.interest_rate;
      const adjustedInterestRate =
        baseInterestRate + riskAssessment.interest_rate_adjustment;

      // Create loan request
      const loanRequest = this.loanRequestRepository.create({
        tenant_id: tenantId,
        cargo_id: cargoId,
        trip_id: trip.id,
        requested_amount: loanAmount,
        approved_amount: autoApprovalEligible ? loanAmount : null,
        interest_amount: 0,
        idempotency_key: `auto_${cargoId}_${tripId}`,
        status: autoApprovalEligible ? 'approved' : ('pending' as any),
        metadata: {
          risk_assessment: riskAssessment,
          auto_generation_reason: 'Load assigned and ready to ship',
          load_value: load.loadValue || load.offeredPrice,
          trip_distance: trip.totalDistance,
          driver_rating: 0, // Trip entity doesn't have driver rating
          auto_generated: true,
          auto_approved: autoApprovalEligible,
        },
        created_by: 'system',
        created_at: new Date(),
      });

      // Save loan request
      const savedLoan = await this.loanRequestRepository.save(loanRequest);

      // If auto-approved, create disbursement record
      if (autoApprovalEligible) {
        // await this.createAutoDisbursement(savedLoan); // TODO: Implement disbursement creation
      }

      return Array.isArray(savedLoan) ? savedLoan[0] : savedLoan;
    } catch (error) {
      this.logger.error('Error creating auto-loan request', error);
      return null;
    }
  }

  private calculateLoanAmount(
    cargoValue: number,
    riskAssessment: RiskScore,
    lenderPolicy: LenderPolicy,
  ): number {
    // Start with cargo value percentage
    let loanAmount = cargoValue * (lenderPolicy.advance_percentage || 0.7);

    // Apply risk-based adjustments
    const riskMultipliers = {
      premium: 1.0,
      low: 0.9,
      medium: 0.8,
      high: 0.6,
    };

    loanAmount *= riskMultipliers[riskAssessment.risk_tier];

    // Apply policy limits
    loanAmount = Math.min(loanAmount, lenderPolicy.max_advance_per_trip);
    loanAmount = Math.min(loanAmount, riskAssessment.max_loan_amount);

    // Round to nearest hundred
    return Math.round(loanAmount / 100) * 100;
  }

  private async createAutoDisbursement(
    loanRequest: LoanRequest,
  ): Promise<void> {
    // This would create a disbursement record for auto-approved loans
    // Implementation depends on your disbursement entity structure
    this.logger.log(`Auto-disbursement created for loan ${loanRequest.id}`);
  }

  async processBulkAutoLoanGeneration(tenantId: string): Promise<{
    processed: number;
    generated: number;
    errors: number;
  }> {
    try {
      const config = await this.getAutoLoanConfig(tenantId);
      if (!config.enabled) {
        return { processed: 0, generated: 0, errors: 0 };
      }

      // Find all loads ready for auto-loan generation
      const readyLoads = await this.loadRepository
        .createQueryBuilder('load')
        .leftJoinAndSelect('load.trips', 'trip')
        .where('load.tenantId = :tenantId', { tenantId })
        .andWhere('load.status IN (:...statuses)', {
          statuses: ['ASSIGNED', 'IN_TRANSIT'],
        })
        .andWhere('trip.status IN (:...tripStatuses)', {
          tripStatuses: ['IN_PROGRESS', 'PLANNED'],
        })
        .getMany();

      let processed = 0;
      let generated = 0;
      let errors = 0;

      for (const load of readyLoads) {
        try {
          processed++;
          const loan = await this.checkAndGenerateAutoLoan(
            load.id,
            load.trips?.[0]?.id || '',
            tenantId,
          );
          if (loan) generated++;
        } catch (error) {
          errors++;
          this.logger.error(`Error processing load ${load.id}`, error);
        }
      }

      this.logger.log(
        `Bulk auto-loan generation completed: ${processed} processed, ${generated} generated, ${errors} errors`,
      );

      return { processed, generated, errors };
    } catch (error) {
      this.logger.error('Error in bulk auto-loan generation', error);
      throw error;
    }
  }
}
