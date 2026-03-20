import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanRequest } from '../../../entities/loan-request.entity';

export interface PortfolioMetrics {
  total_loans_issued: number;
  total_amount_disbursed: number;
  total_amount_repaid: number;
  outstanding_balance: number;
  recovery_rate: number;
  average_loan_size: number;
  portfolio_yield: number;
  default_rate: number;
}

@Injectable()
export class LenderAnalyticsService {
  private readonly logger = new Logger(LenderAnalyticsService.name);

  constructor(
    @InjectRepository(LoanRequest)
    private loanRequestRepository: Repository<LoanRequest>,
  ) {}

  async getPortfolioMetrics(
    lenderId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PortfolioMetrics> {
    try {
      const loans = await this.loanRequestRepository.find({
        where: { lender_id: lenderId },
      });

      const totalLoans = loans.length;
      const totalAmountDisbursed = loans.reduce(
        (sum, loan) => sum + (loan.approved_amount || 0),
        0,
      );

      return {
        total_loans_issued: totalLoans,
        total_amount_disbursed: totalAmountDisbursed,
        total_amount_repaid: 0,
        outstanding_balance: totalAmountDisbursed,
        recovery_rate: 0,
        average_loan_size:
          totalLoans > 0 ? totalAmountDisbursed / totalLoans : 0,
        portfolio_yield: 0,
        default_rate: 0,
      };
    } catch (error) {
      this.logger.error('Error calculating portfolio metrics', error);
      throw error;
    }
  }

  async getROIAnalysis(lenderId: string): Promise<any> {
    return {
      total_revenue: 0,
      total_costs: 0,
      net_profit: 0,
      roi_percentage: 0,
    };
  }

  async getDefaultAnalysis(lenderId: string): Promise<any> {
    return {
      total_defaults: 0,
      default_amount: 0,
      default_rate: 0,
    };
  }

  async getExposureAnalysis(lenderId: string): Promise<any> {
    return {
      current_exposure: 0,
      exposure_limit: 1000000,
      utilization_rate: 0,
    };
  }
}
