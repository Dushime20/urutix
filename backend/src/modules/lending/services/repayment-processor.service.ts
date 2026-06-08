import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoanRequest, LoanRequestStatus } from '../../../entities/loan-request.entity';
import { LoanRepayment } from '../../../entities/loan-repayment.entity';
import { LoanDisbursement } from '../../../entities/loan-disbursement.entity';
import { LenderPolicy } from '../../../entities/lender-policy.entity';

export interface RepaymentSchedule {
  loan_id: string;
  installment_number: number;
  due_date: Date;
  amount: number;
  principal: number;
  interest: number;
  status: 'pending' | 'paid' | 'overdue' | 'defaulted';
}

export interface RepaymentCalculation {
  total_principal: number;
  /** Full interest for the entire agreed term — fixed at disbursement, never changes */
  total_interest: number;
  /** Fixed total the borrower owes = principal + full term interest */
  total_amount: number;
  installments: RepaymentSchedule[];
  next_payment_due: Date | undefined;
  days_overdue: number;
  /** Annual interest rate used */
  annual_rate: number;
  /** Agreed repayment term in days */
  term_days: number;
}

@Injectable()
export class RepaymentProcessorService {
  private readonly logger = new Logger(RepaymentProcessorService.name);

  constructor(
    @InjectRepository(LoanRequest)
    private loanRequestRepository: Repository<LoanRequest>,
    @InjectRepository(LoanRepayment)
    private repaymentRepository: Repository<LoanRepayment>,
    @InjectRepository(LoanDisbursement)
    private disbursementRepository: Repository<LoanDisbursement>,
    @InjectRepository(LenderPolicy)
    private lenderPolicyRepository: Repository<LenderPolicy>,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => require('../lending.service').LendingService))
    private lendingService: any,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // CORE CALCULATION
  //
  // Total amount = principal + (principal × annual_rate / 365 × term_days)
  //
  // This is fixed at disbursement time. Whether the borrower repays on day 5
  // or day 90, they owe the same amount. No discount for early repayment,
  // no extra penalty either — the agreed amount is the agreed amount.
  // ─────────────────────────────────────────────────────────────────────────
  async calculateRepaymentSchedule(loanId: string): Promise<RepaymentCalculation> {
    const loan = await this.loanRequestRepository.findOne({
      where: { id: loanId },
      relations: ['disbursements', 'repayments'],
    });

    if (!loan) throw new Error('Loan not found');

    const disbursement = loan.disbursements?.[0];
    if (!disbursement) throw new Error('No disbursement found for loan');

    const principal = Number(loan.approved_amount || loan.requested_amount || 0);
    const annualRate = await this.resolveAnnualRate(loan);
    const termDays   = await this.resolveTermDays(loan);

    // Fixed interest for the full agreed term — does not change on early repayment
    const totalInterest = principal * (annualRate / 365) * termDays;
    const totalAmount   = principal + totalInterest;

    const disbursedAt = new Date(disbursement.created_at);
    const dueDate     = new Date(disbursedAt);
    dueDate.setDate(dueDate.getDate() + termDays);

    const now = new Date();
    const msPerDay     = 1000 * 60 * 60 * 24;
    const daysOverdue  = now > dueDate
      ? Math.ceil((now.getTime() - dueDate.getTime()) / msPerDay)
      : 0;

    const installments: RepaymentSchedule[] = [{
      loan_id:             loanId,
      installment_number:  1,
      due_date:            dueDate,
      amount:              totalAmount,
      principal,
      interest:            totalInterest,
      status:              daysOverdue > 0 ? 'overdue' : 'pending',
    }];

    return {
      total_principal:   principal,
      total_interest:    totalInterest,
      total_amount:      totalAmount,
      installments,
      next_payment_due:  daysOverdue === 0 ? dueDate : undefined,
      days_overdue:      daysOverdue,
      annual_rate:       annualRate,
      term_days:         termDays,
    };
  }

  async processRepayment(
    loanId: string,
    amount: number,
    paymentMethod: string,
    reference: string,
    metadata?: any,
  ): Promise<LoanRepayment> {
    const loan = await this.loanRequestRepository.findOne({
      where: { id: loanId },
      relations: ['disbursements', 'repayments'],
    });

    if (!loan) throw new Error('Loan not found');

    const schedule = await this.calculateRepaymentSchedule(loanId);
    const outstanding = this.calculateOutstandingAmount(loan, schedule);

    if (amount > outstanding + 0.01) {
      throw new Error(
        `Payment amount (${amount}) exceeds outstanding balance (${outstanding.toFixed(2)}).`
      );
    }

    // Split the payment into principal and interest proportionally based on the fixed schedule
    const interestRatio  = schedule.total_amount > 0
      ? schedule.total_interest / schedule.total_amount
      : 0;
    const interestPaid   = amount * interestRatio;
    const principalPaid  = amount - interestPaid;

    const repayment = this.repaymentRepository.create({
      loan_request_id:  loanId,
      amount,
      interest_paid:    interestPaid,
      principal_paid:   principalPaid,
      repayment_date:   new Date(),
      external_txn_ref: reference,
      metadata: {
        payment_method: paymentMethod,
        annual_rate:    schedule.annual_rate,
        term_days:      schedule.term_days,
        // Early repayment: loan closes before due date — no penalty, no discount
        is_early_repayment: schedule.days_overdue === 0,
        ...metadata,
      },
      created_at: new Date(),
    });

    const savedRepayment = await this.repaymentRepository.save(repayment);
    const result = Array.isArray(savedRepayment) ? savedRepayment[0] : savedRepayment;

    await this.updateLoanStatus(loan, amount, schedule);

    this.eventEmitter.emit('loan.repayment.received', {
      loanId,
      amount,
      interestPaid,
      principalPaid,
      remainingBalance: Math.max(0, outstanding - amount),
      repaymentId: result.id,
    });

    this.logger.log(
      `Repayment processed: ${amount} for loan ${loanId} ` +
      `(principal: ${principalPaid.toFixed(2)}, interest: ${interestPaid.toFixed(2)})`
    );

    return result;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processOverdueLoans(): Promise<void> {
    try {
      this.logger.log('Processing overdue loans via DelinquencyEngine...');
      const result = await this.lendingService.runDelinquencyAndDefaultEngine();
      this.logger.log(`DelinquencyEngine complete: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error('Error in DelinquencyEngine', error);
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async generateRepaymentReminders(): Promise<void> {
    try {
      this.logger.log('Generating repayment reminders...');
      const loansDueSoon = await this.getLoansDueSoon(7);
      for (const loan of loansDueSoon) {
        await this.sendRepaymentReminder(loan);
      }
      this.logger.log(`Sent ${loansDueSoon.length} repayment reminders`);
    } catch (error) {
      this.logger.error('Error generating repayment reminders', error);
    }
  }

  async getRepaymentHistory(loanId: string): Promise<LoanRepayment[]> {
    return this.repaymentRepository.find({
      where: { loan_request_id: loanId },
      order: { created_at: 'ASC' },
    });
  }

  async getOutstandingBalance(loanId: string): Promise<number> {
    const loan = await this.loanRequestRepository.findOne({
      where: { id: loanId },
      relations: ['disbursements', 'repayments'],
    });
    if (!loan) return 0;
    const schedule = await this.calculateRepaymentSchedule(loanId);
    return this.calculateOutstandingAmount(loan, schedule);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /** Resolve annual interest rate from lender policy, fallback 5% */
  private async resolveAnnualRate(loan: LoanRequest): Promise<number> {
    if (!loan.lender_id) return 0.05;
    try {
      const policy = await this.lenderPolicyRepository.findOne({
        where: { lender_id: loan.lender_id, is_active: true },
        order: { created_at: 'DESC' },
      });
      return policy ? Number(policy.interest_rate) : 0.05;
    } catch {
      return 0.05;
    }
  }

  /** Resolve repayment term days from lender policy, fallback 30 days */
  private async resolveTermDays(loan: LoanRequest): Promise<number> {
    if (!loan.lender_id) return 30;
    try {
      const policy = await this.lenderPolicyRepository.findOne({
        where: { lender_id: loan.lender_id, is_active: true },
        order: { created_at: 'DESC' },
      });
      return policy ? Number(policy.repayment_term_days) : 30;
    } catch {
      return 30;
    }
  }

  private calculateOutstandingAmount(
    loan: LoanRequest,
    schedule: RepaymentCalculation,
  ): number {
    const totalRepaid = loan.repayments?.reduce(
      (sum, r) => sum + Number(r.amount), 0
    ) ?? 0;
    return Math.max(0, schedule.total_amount - totalRepaid);
  }

  private async updateLoanStatus(
    loan: LoanRequest,
    paymentAmount: number,
    schedule: RepaymentCalculation,
  ): Promise<void> {
    const outstanding = this.calculateOutstandingAmount(loan, schedule);

    if (outstanding <= 0.01) {
      await this.loanRequestRepository.update(loan.id, {
        status: LoanRequestStatus.REPAID,
        repaid_at: new Date(),
      });
      this.eventEmitter.emit('loan.repaid', {
        loanId: loan.id,
        totalAmount: schedule.total_amount,
      });
    }
  }

  private async getLoansDueSoon(daysAhead: number): Promise<LoanRequest[]> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysAhead);
    return this.loanRequestRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.disbursements', 'disbursement')
      .where('loan.status IN (:...statuses)', { statuses: ['approved', 'disbursed'] })
      .andWhere('disbursement.created_at <= :dueDate', { dueDate })
      .getMany();
  }

  private async sendRepaymentReminder(loan: LoanRequest): Promise<void> {
    this.logger.log(`Sending repayment reminder for loan ${loan.id}`);
    this.eventEmitter.emit('loan.reminder.sent', {
      loanId: loan.id,
      amount: loan.approved_amount,
    });
  }
}
