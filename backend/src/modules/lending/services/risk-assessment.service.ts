import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanRequest, LoanRequestStatus } from '../../../entities/loan-request.entity';
import { Borrower } from '../../../entities/borrower.entity';
import { Trip } from '../../../entities/trip.entity';
import { Load } from '../../../entities/load.entity';

export interface RiskScore {
  overall_score: number;
  credit_score: number;
  trip_risk_score: number;
  cargo_risk_score: number;
  payment_history_score: number;
  debt_to_income_score: number;
  business_age_score: number;
  risk_tier: 'low' | 'medium' | 'high' | 'critical';
  risk_tier_label: string;
  max_loan_amount: number;
  recommended_amount: number;
  interest_rate_adjustment: number;
  pd_estimate: number;
  lgd_estimate: number;
  el_estimate: number;
  recommendations: string[];
  disqualifiers: string[];
  breakdown: Array<{ factor: string; score: number; weight: number; contribution: number; detail: string }>;
}

/**
 * Basel II/III-aligned credit risk assessment engine.
 *
 * Factors scored (IRB approach):
 *  1. Credit Score            — FICO/CRDB scale 300-850 (weight 30%)
 *  2. Payment History         — repayment track record (weight 25%)
 *  3. Debt-to-Income (DTI)    — outstanding debt vs income proxy (weight 20%)
 *  4. Business Age            — operational stability (weight 10%)
 *  5. Cargo/Trip Risk         — cargo value, route, trip completion rate (weight 10%)
 *  6. Collateral / LTV        — asset cover (weight 5%)
 *
 * Output: composite 0-100 score → risk_tier → PD/LGD/EL estimates.
 */
@Injectable()
export class RiskAssessmentService {
  private readonly logger = new Logger(RiskAssessmentService.name);

  private static readonly ENGINE_VERSION = '2.0.0';

  private static readonly FACTOR_WEIGHTS = {
    credit_score:    0.30,
    payment_history: 0.25,
    dti_ratio:       0.20,
    business_age:    0.10,
    cargo_trip_risk: 0.10,
    collateral_ltv:  0.05,
  };

  private static readonly RISK_TIERS: Array<{ min: number; tier: RiskScore['risk_tier']; label: string; pd: number; lgd: number; rate_adj: number }> = [
    { min: 80, tier: 'low',      label: 'Prime',          pd: 0.010, lgd: 0.25, rate_adj: -1.5 },
    { min: 60, tier: 'medium',   label: 'Near-Prime',     pd: 0.035, lgd: 0.40, rate_adj:  0.0 },
    { min: 40, tier: 'high',     label: 'Sub-Prime',      pd: 0.080, lgd: 0.55, rate_adj: +3.0 },
    { min:  0, tier: 'critical', label: 'Non-Performing',  pd: 0.200, lgd: 0.70, rate_adj: +6.0 },
  ];

  constructor(
    @InjectRepository(LoanRequest)
    private readonly loanRequestRepository: Repository<LoanRequest>,
    @InjectRepository(Borrower)
    private readonly borrowerRepository: Repository<Borrower>,
    @InjectRepository(Trip) private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Load) private readonly loadRepository: Repository<Load>,
  ) {}

  async assessLoanRisk(
    tenantId: string,
    tripId: string,
    cargoId: string,
    requestedAmount: number,
  ): Promise<RiskScore> {
    this.logger.log(`Assessing loan risk: tenant=${tenantId} trip=${tripId} amount=${requestedAmount}`);

    const [borrower, trip, load, loanHistory] = await Promise.all([
      this.borrowerRepository.findOne({ where: { tenant_id: tenantId } }),
      this.tripRepository.findOne({ where: { id: tripId } }).catch(() => null),
      this.loadRepository.findOne({ where: { id: cargoId } }).catch(() => null),
      this.loanRequestRepository.find({
        where: { tenant_id: tenantId },
        order: { created_at: 'DESC' },
        take: 50,
      }),
    ]);

    const breakdown: RiskScore['breakdown'] = [];
    const disqualifiers: string[] = [];
    const recommendations: string[] = [];

    // ── 1. Credit Score (30%) ─────────────────────────────────────────────────
    const rawCreditScore = borrower?.credit_score ?? null;
    const creditScoreNorm = this.normalizeCreditScore(rawCreditScore);
    breakdown.push({
      factor: 'credit_score',
      score: creditScoreNorm,
      weight: RiskAssessmentService.FACTOR_WEIGHTS.credit_score,
      contribution: creditScoreNorm * RiskAssessmentService.FACTOR_WEIGHTS.credit_score,
      detail: rawCreditScore != null ? `Credit score: ${rawCreditScore}` : 'No credit score on file (neutral 50)',
    });
    if (rawCreditScore !== null && rawCreditScore < 580) {
      disqualifiers.push(`Credit score ${rawCreditScore} is below minimum threshold of 580`);
    }

    // ── 2. Payment History (25%) ──────────────────────────────────────────────
    const paymentHistoryScore = this.scorePaymentHistory(loanHistory);
    breakdown.push({
      factor: 'payment_history',
      score: paymentHistoryScore.score,
      weight: RiskAssessmentService.FACTOR_WEIGHTS.payment_history,
      contribution: paymentHistoryScore.score * RiskAssessmentService.FACTOR_WEIGHTS.payment_history,
      detail: paymentHistoryScore.detail,
    });

    // ── 3. Debt-to-Income ratio (20%) ─────────────────────────────────────────
    const dtiScore = this.scoreDTI(loanHistory, requestedAmount);
    breakdown.push({
      factor: 'dti_ratio',
      score: dtiScore.score,
      weight: RiskAssessmentService.FACTOR_WEIGHTS.dti_ratio,
      contribution: dtiScore.score * RiskAssessmentService.FACTOR_WEIGHTS.dti_ratio,
      detail: dtiScore.detail,
    });
    if (dtiScore.dti > 0.55) {
      disqualifiers.push(`Estimated debt-to-income ratio of ${(dtiScore.dti * 100).toFixed(0)}% exceeds the 55% cap`);
    }

    // ── 4. Business Age (10%) ─────────────────────────────────────────────────
    const businessAgeScore = this.scoreBusinessAge(borrower);
    breakdown.push({
      factor: 'business_age',
      score: businessAgeScore.score,
      weight: RiskAssessmentService.FACTOR_WEIGHTS.business_age,
      contribution: businessAgeScore.score * RiskAssessmentService.FACTOR_WEIGHTS.business_age,
      detail: businessAgeScore.detail,
    });

    // ── 5. Cargo / Trip Risk (10%) ────────────────────────────────────────────
    const cargoTripScore = this.scoreCargoTripRisk(trip, load, loanHistory);
    breakdown.push({
      factor: 'cargo_trip_risk',
      score: cargoTripScore.score,
      weight: RiskAssessmentService.FACTOR_WEIGHTS.cargo_trip_risk,
      contribution: cargoTripScore.score * RiskAssessmentService.FACTOR_WEIGHTS.cargo_trip_risk,
      detail: cargoTripScore.detail,
    });

    // ── 6. Collateral / LTV (5%) ──────────────────────────────────────────────
    const collateralScore = this.scoreCollateral(load, requestedAmount);
    breakdown.push({
      factor: 'collateral_ltv',
      score: collateralScore.score,
      weight: RiskAssessmentService.FACTOR_WEIGHTS.collateral_ltv,
      contribution: collateralScore.score * RiskAssessmentService.FACTOR_WEIGHTS.collateral_ltv,
      detail: collateralScore.detail,
    });

    // ── Composite score ───────────────────────────────────────────────────────
    const overall_score = Math.round(
      breakdown.reduce((sum, b) => sum + b.contribution, 0) * 100,
    ) / 100;

    const tierDef = RiskAssessmentService.RISK_TIERS.find(t => overall_score >= t.min)!;
    const el_estimate = tierDef.pd * tierDef.lgd;

    // ── Recommended amount: cap at 70% of cargo value or max per-trip default ─
    const cargoValue = (load as any)?.cargo_value ?? (load as any)?.estimated_value ?? null;
    const ltv_cap = cargoValue ? cargoValue * 0.70 : requestedAmount;
    const recommended_amount = Math.min(requestedAmount, ltv_cap);

    // ── Recommendations ───────────────────────────────────────────────────────
    if (rawCreditScore === null) recommendations.push('Submit a credit bureau report to improve scoring accuracy');
    if (paymentHistoryScore.score < 60) recommendations.push('Prior loan defaults detected — consider a smaller amount or guarantor');
    if (dtiScore.dti > 0.40) recommendations.push('Reduce outstanding loans before applying for additional credit');
    if (businessAgeScore.score < 50) recommendations.push('Provide additional collateral or guarantor given short operational history');

    this.logger.log(
      `Risk assessment complete: tenant=${tenantId} score=${overall_score} tier=${tierDef.tier} ` +
      `PD=${tierDef.pd} LGD=${tierDef.lgd} EL=${el_estimate.toFixed(4)} disqualifiers=${disqualifiers.length}`,
    );

    return {
      overall_score,
      credit_score: creditScoreNorm,
      trip_risk_score: cargoTripScore.score,
      cargo_risk_score: cargoTripScore.score,
      payment_history_score: paymentHistoryScore.score,
      debt_to_income_score: dtiScore.score,
      business_age_score: businessAgeScore.score,
      risk_tier: tierDef.tier,
      risk_tier_label: tierDef.label,
      max_loan_amount: recommended_amount,
      recommended_amount,
      interest_rate_adjustment: tierDef.rate_adj,
      pd_estimate: tierDef.pd,
      lgd_estimate: tierDef.lgd,
      el_estimate,
      recommendations,
      disqualifiers,
      breakdown,
    };
  }

  // ── Private scoring helpers ─────────────────────────────────────────────────

  private normalizeCreditScore(score: number | null): number {
    if (score === null) return 50;
    const MIN = 300, MAX = 850;
    return Math.round(((Math.min(MAX, Math.max(MIN, score)) - MIN) / (MAX - MIN)) * 100);
  }

  private scorePaymentHistory(loans: LoanRequest[]): { score: number; detail: string } {
    if (!loans.length) return { score: 65, detail: 'No loan history — neutral score applied' };
    const completed = loans.filter(l => l.status === LoanRequestStatus.REPAID).length;
    const defaulted = loans.filter(l => l.status === LoanRequestStatus.DEFAULTED).length;
    const total = loans.length;
    const repaymentRate = completed / total;
    const defaultRate = defaulted / total;
    const score = Math.round(Math.max(0, Math.min(100, repaymentRate * 100 - defaultRate * 50)));
    return {
      score,
      detail: `${completed}/${total} loans repaid on time, ${defaulted} defaulted (repayment rate: ${(repaymentRate * 100).toFixed(0)}%)`,
    };
  }

  private scoreDTI(loans: LoanRequest[], requestedAmount: number): { score: number; dti: number; detail: string } {
    const outstanding = loans
      .filter(l => l.status === LoanRequestStatus.APPROVED || l.status === LoanRequestStatus.DISBURSED)
      .reduce((s, l) => s + Number(l.approved_amount || l.requested_amount || 0), 0);
    const totalDebt = outstanding + requestedAmount;
    const estimatedMonthlyIncome = Math.max(totalDebt * 0.3, 1);
    const dti = Math.min(totalDebt / (estimatedMonthlyIncome * 12), 1);
    const score = Math.round(Math.max(0, 100 - dti * 120));
    return { score, dti, detail: `Outstanding debt: ${outstanding.toFixed(0)}, DTI estimate: ${(dti * 100).toFixed(0)}%` };
  }

  private scoreBusinessAge(borrower: Borrower | null): { score: number; detail: string } {
    if (!borrower) return { score: 50, detail: 'No borrower profile available' };
    const createdAt = (borrower as any).created_at ? new Date((borrower as any).created_at) : null;
    if (!createdAt) return { score: 50, detail: 'Business age unknown' };
    const ageMonths = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
    let score: number;
    if      (ageMonths >= 60)  score = 100;
    else if (ageMonths >= 36)  score = 85;
    else if (ageMonths >= 24)  score = 70;
    else if (ageMonths >= 12)  score = 55;
    else if (ageMonths >= 6)   score = 40;
    else                        score = 25;
    return { score, detail: `Business profile age: ${ageMonths.toFixed(0)} months` };
  }

  private scoreCargoTripRisk(trip: any, load: any, loans: LoanRequest[]): { score: number; detail: string } {
    let score = 70;
    const details: string[] = [];
    if (trip) {
      score += 5;
      details.push('Active trip found');
    } else {
      score -= 10;
      details.push('No active trip linked');
    }
    if (load) {
      const cargoValue = (load as any).cargo_value ?? (load as any).estimated_value;
      if (cargoValue && cargoValue > 0) { score += 5; details.push(`Cargo value: ${cargoValue}`); }
    }
    const completedTrips = loans.filter(l => l.status === LoanRequestStatus.REPAID).length;
    if (completedTrips >= 10) { score += 10; details.push(`${completedTrips} completed trips`); }
    else if (completedTrips >= 3) { score += 5; details.push(`${completedTrips} completed trips`); }
    return { score: Math.min(100, Math.max(0, score)), detail: details.join('; ') || 'Standard cargo/trip assessment' };
  }

  private scoreCollateral(load: any, requestedAmount: number): { score: number; detail: string } {
    const cargoValue = load ? ((load as any).cargo_value ?? (load as any).estimated_value ?? null) : null;
    if (!cargoValue || cargoValue <= 0) return { score: 50, detail: 'No collateral value available' };
    const ltv = requestedAmount / cargoValue;
    let score: number;
    if      (ltv <= 0.50) score = 100;
    else if (ltv <= 0.65) score = 85;
    else if (ltv <= 0.75) score = 70;
    else if (ltv <= 0.85) score = 50;
    else                   score = 25;
    return { score, detail: `LTV ratio: ${(ltv * 100).toFixed(0)}% (loan ${requestedAmount} / cargo value ${cargoValue})` };
  }
}
