import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanRequest, LoanRequestStatus } from '../../../entities/loan-request.entity';

export interface PortfolioMetrics {
  total_loans_issued: number;
  total_amount_disbursed: number;
  total_amount_repaid: number;
  outstanding_balance: number;
  recovery_rate: number;
  average_loan_size: number;
  portfolio_yield: number;
  default_rate: number;
  /** IFRS 9 Stage distribution */
  ifrs9_stage1: number;
  ifrs9_stage2: number;
  ifrs9_stage3: number;
  /** Basel II capital adequacy proxy */
  capital_adequacy_ratio: number;
}

export interface MonthlyTrend {
  month: string;
  disbursed: number;
  collected: number;
  defaults: number;
  net_income: number;
  loan_count: number;
}

export interface RiskDistribution {
  low_risk_amount: number;
  medium_risk_amount: number;
  high_risk_amount: number;
  total_exposure: number;
  low_risk_count: number;
  medium_risk_count: number;
  high_risk_count: number;
}

export interface CargoTypeBreakdown {
  cargo_type: string;
  loan_count: number;
  total_value: number;
  average_size: number;
  default_rate: number;
  average_rate: number;
  risk_level: 'low' | 'medium' | 'high';
}

export interface FullAnalytics {
  portfolio: PortfolioMetrics;
  monthly_trends: MonthlyTrend[];
  risk_distribution: RiskDistribution;
  cargo_breakdown: CargoTypeBreakdown[];
  currency: string;
  computed_at: string;
  /** Basel II / IFRS 9 summary for audit */
  standards_summary: {
    ifrs9_ecl_estimate: number;
    pd_average: number;
    lgd_estimate: number;
    collection_rate: number;
    npl_ratio: number;
  };
}

@Injectable()
export class LenderAnalyticsService {
  private readonly logger = new Logger(LenderAnalyticsService.name);

  constructor(
    @InjectRepository(LoanRequest)
    private loanRequestRepository: Repository<LoanRequest>,
  ) {}

  // ── resolve User UUID → Lender entity UUID ──────────────────────────────
  private async resolveLoans(lenderId: string): Promise<LoanRequest[]> {
    return this.loanRequestRepository.find({ where: { lender_id: lenderId } });
  }

  // ── Core Portfolio Metrics (IFRS 9 / Basel II) ──────────────────────────
  async getPortfolioMetrics(lenderId: string): Promise<PortfolioMetrics> {
    const loans = await this.resolveLoans(lenderId);

    const disbursed = loans.filter(l =>
      l.status === LoanRequestStatus.DISBURSED ||
      l.status === LoanRequestStatus.REPAID ||
      l.status === LoanRequestStatus.DEFAULTED,
    );
    const repaid   = loans.filter(l => l.status === LoanRequestStatus.REPAID);
    const defaults = loans.filter(l => l.status === LoanRequestStatus.DEFAULTED);
    const active   = loans.filter(l => l.status === LoanRequestStatus.DISBURSED);

    const totalDisbursed = disbursed.reduce((s, l) => s + (l.approved_amount || 0), 0);
    const totalRepaid    = repaid.reduce((s, l) => s + (l.approved_amount || 0), 0);
    const totalDefaulted = defaults.reduce((s, l) => s + (l.approved_amount || 0), 0);
    const outstanding    = active.reduce((s, l) => s + (l.approved_amount || 0), 0);

    const totalInterestEarned = repaid.reduce((s, l) => s + (l.interest_amount || 0), 0);

    const recoveryRate = totalDisbursed > 0 ? (totalRepaid / totalDisbursed) * 100 : 0;
    const defaultRate  = disbursed.length > 0 ? (defaults.length / disbursed.length) * 100 : 0;
    const portfolioYield = totalDisbursed > 0 ? (totalInterestEarned / totalDisbursed) * 100 : 0;

    // IFRS 9 staging: Stage 1=performing, Stage 2=watch (30-89 dpd), Stage 3=NPL (90+ dpd)
    const now = Date.now();
    let stage1 = 0, stage2 = 0, stage3 = 0;
    for (const l of active) {
      const dpd = l.days_past_due ?? 0;
      const ifrs = l.ifrs9_stage ?? (dpd >= 90 ? 3 : dpd >= 30 ? 2 : 1);
      if (ifrs === 3) stage3 += (l.approved_amount || 0);
      else if (ifrs === 2) stage2 += (l.approved_amount || 0);
      else stage1 += (l.approved_amount || 0);
    }
    for (const l of defaults) stage3 += (l.approved_amount || 0);

    // Basel II CARatio proxy: equity/RWA — approximate RWA using risk weights per stage
    const rwa = stage1 * 0.75 + stage2 * 1.0 + stage3 * 1.5;
    const capitalBase = totalRepaid * 0.08; // simplified tier-1 capital proxy
    const car = rwa > 0 ? (capitalBase / rwa) * 100 : 100;

    return {
      total_loans_issued:    disbursed.length,
      total_amount_disbursed: totalDisbursed,
      total_amount_repaid:   totalRepaid,
      outstanding_balance:   outstanding,
      recovery_rate:         parseFloat(recoveryRate.toFixed(2)),
      average_loan_size:     disbursed.length > 0 ? totalDisbursed / disbursed.length : 0,
      portfolio_yield:       parseFloat(portfolioYield.toFixed(2)),
      default_rate:          parseFloat(defaultRate.toFixed(2)),
      ifrs9_stage1:          parseFloat(stage1.toFixed(2)),
      ifrs9_stage2:          parseFloat(stage2.toFixed(2)),
      ifrs9_stage3:          parseFloat(stage3.toFixed(2)),
      capital_adequacy_ratio: parseFloat(car.toFixed(2)),
    };
  }

  // ── Monthly Trends (last 12 months) ─────────────────────────────────────
  async getMonthlyTrends(lenderId: string, months = 12): Promise<MonthlyTrend[]> {
    const loans = await this.resolveLoans(lenderId);
    const trends: Map<string, MonthlyTrend> = new Map();

    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      trends.set(key, { month: label, disbursed: 0, collected: 0, defaults: 0, net_income: 0, loan_count: 0 });
    }

    for (const loan of loans) {
      const created = new Date(loan.created_at);
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      if (!trends.has(key)) continue;
      const t = trends.get(key)!;
      t.loan_count++;

      if (loan.status === LoanRequestStatus.DISBURSED || loan.status === LoanRequestStatus.REPAID || loan.status === LoanRequestStatus.DEFAULTED) {
        t.disbursed += loan.approved_amount || 0;
      }
      if (loan.status === LoanRequestStatus.REPAID) {
        t.collected += loan.approved_amount || 0;
        t.net_income += loan.interest_amount || 0;
      }
      if (loan.status === LoanRequestStatus.DEFAULTED) {
        t.defaults += loan.approved_amount || 0;
      }
    }

    return Array.from(trends.values());
  }

  // ── Risk Distribution ────────────────────────────────────────────────────
  async getRiskDistribution(lenderId: string): Promise<RiskDistribution> {
    const loans = await this.resolveLoans(lenderId);
    const active = loans.filter(l =>
      l.status === LoanRequestStatus.DISBURSED ||
      l.status === LoanRequestStatus.APPROVED,
    );

    let low = 0, med = 0, high = 0;
    let lowC = 0, medC = 0, highC = 0;

    for (const l of active) {
      const riskLevel = l.risk_tier ?? (l as any).metadata?.risk_level ?? null;
      const amount = l.approved_amount || l.requested_amount || 0;
      if (riskLevel === 'low') { low += amount; lowC++; }
      else if (riskLevel === 'high' || riskLevel === 'critical') { high += amount; highC++; }
      else { med += amount; medC++; } // medium or unknown
    }

    return {
      low_risk_amount: low,
      medium_risk_amount: med,
      high_risk_amount: high,
      total_exposure: low + med + high,
      low_risk_count: lowC,
      medium_risk_count: medC,
      high_risk_count: highC,
    };
  }

  // ── Cargo-Type Breakdown ─────────────────────────────────────────────────
  async getCargoBreakdown(lenderId: string): Promise<CargoTypeBreakdown[]> {
    const loans = await this.resolveLoans(lenderId);
    const map: Map<string, { count: number; total: number; defaults: number; rates: number[] }> = new Map();

    for (const l of loans) {
      const ct = (l as any).cargo_type || (l as any).metadata?.cargo_type || 'General';
      if (!map.has(ct)) map.set(ct, { count: 0, total: 0, defaults: 0, rates: [] });
      const e = map.get(ct)!;
      e.count++;
      e.total += l.approved_amount || l.requested_amount || 0;
      if (l.status === LoanRequestStatus.DEFAULTED) e.defaults++;
      const rate = (l as any).metadata?.interest_rate ?? null;
      if (rate != null) e.rates.push(Number(rate));
    }

    return Array.from(map.entries()).map(([cargo_type, v]) => {
      const defaultRate = v.count > 0 ? (v.defaults / v.count) * 100 : 0;
      const avgRate = v.rates.length > 0 ? v.rates.reduce((a, b) => a + b, 0) / v.rates.length : 0;
      const riskLevel: 'low' | 'medium' | 'high' = defaultRate < 3 ? 'low' : defaultRate < 7 ? 'medium' : 'high';
      return {
        cargo_type,
        loan_count: v.count,
        total_value: v.total,
        average_size: v.count > 0 ? v.total / v.count : 0,
        default_rate: parseFloat(defaultRate.toFixed(2)),
        average_rate: parseFloat(avgRate.toFixed(2)),
        risk_level: riskLevel,
      };
    }).sort((a, b) => b.total_value - a.total_value);
  }

  // ── Full Analytics Bundle ────────────────────────────────────────────────
  async getFullAnalytics(lenderId: string, months = 12): Promise<FullAnalytics> {
    const [portfolio, monthly_trends, risk_distribution, cargo_breakdown] = await Promise.all([
      this.getPortfolioMetrics(lenderId),
      this.getMonthlyTrends(lenderId, months),
      this.getRiskDistribution(lenderId),
      this.getCargoBreakdown(lenderId),
    ]);

    // IFRS 9 ECL estimate: Stage1×0.5% + Stage2×5% + Stage3×40% of outstanding
    const ecl = portfolio.ifrs9_stage1 * 0.005
              + portfolio.ifrs9_stage2 * 0.05
              + portfolio.ifrs9_stage3 * 0.40;

    // Basel II average PD from default rate
    const pd = portfolio.default_rate / 100;
    // LGD estimate: assume 45% (Basel II Foundation IRB default for unsecured)
    const lgd = 0.45;

    return {
      portfolio,
      monthly_trends,
      risk_distribution,
      cargo_breakdown,
      currency: 'RWF',
      computed_at: new Date().toISOString(),
      standards_summary: {
        ifrs9_ecl_estimate: parseFloat(ecl.toFixed(2)),
        pd_average: parseFloat((pd * 100).toFixed(2)),
        lgd_estimate: lgd * 100,
        collection_rate: portfolio.recovery_rate,
        npl_ratio: parseFloat(
          (portfolio.outstanding_balance > 0
            ? (portfolio.ifrs9_stage3 / portfolio.outstanding_balance) * 100
            : 0
          ).toFixed(2),
        ),
      },
    };
  }

  async getROIAnalysis(lenderId: string): Promise<any> {
    const p = await this.getPortfolioMetrics(lenderId);
    return {
      total_revenue: p.total_amount_repaid,
      total_costs: p.total_amount_disbursed - p.total_amount_repaid,
      net_profit: p.total_amount_repaid - p.total_amount_disbursed,
      roi_percentage: p.portfolio_yield,
    };
  }

  async getDefaultAnalysis(lenderId: string): Promise<any> {
    const p = await this.getPortfolioMetrics(lenderId);
    return {
      total_defaults: 0,
      default_amount: p.ifrs9_stage3,
      default_rate: p.default_rate,
    };
  }

  async getExposureAnalysis(lenderId: string): Promise<any> {
    const p = await this.getPortfolioMetrics(lenderId);
    return {
      current_exposure: p.outstanding_balance,
      exposure_limit: p.outstanding_balance * 2,
      utilization_rate: 50,
    };
  }
}
