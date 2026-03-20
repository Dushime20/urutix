import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoanRequest } from '../../../entities/loan-request.entity';
import { LoanRepayment } from '../../../entities/loan-repayment.entity';
import { LoanDisbursement } from '../../../entities/loan-disbursement.entity';

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
  total_interest: number;
  total_amount: number;
  installments: RepaymentSchedule[];
  next_payment_due: Date;
  days_overdue: number;
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
    private eventEmitter: EventEmitter2,
  ) {}

  async calculateRepaymentSchedule(
    loanId: string,
  ): Promise<RepaymentCalculation> {
    try {
      const loan = await this.loanRequestRepository.findOne({
        where: { id: loanId },
        relations: ['disbursements'],
      });

      if (!loan) {
        throw new Error('Loan not found');
      }

      const disbursement = loan.disbursements?.[0];
      if (!disbursement) {
        throw new Error('No disbursement found for loan');
      }

      const principal = loan.approved_amount || 0;
      const interestRate = 0.05; // Default 5% interest rate
      const termDays = 30; // Default 30 days

      // Calculate total interest
      const totalInterest = principal * (interestRate / 365) * termDays;
      const totalAmount = principal + totalInterest;

      // Calculate installment schedule
      const installments = this.calculateInstallments(
        principal,
        totalInterest,
        termDays,
        disbursement.created_at,
      );

      // Find next payment due
      const nextPaymentDue = installments.find(
        (i) => i.status === 'pending',
      )?.due_date;

      // Calculate days overdue
      const daysOverdue = this.calculateDaysOverdue(loan);

      return {
        total_principal: principal,
        total_interest: totalInterest,
        total_amount: totalAmount,
        installments,
        next_payment_due: nextPaymentDue,
        days_overdue: daysOverdue,
      };
    } catch (error) {
      this.logger.error('Error calculating repayment schedule', error);
      throw error;
    }
  }

  async processRepayment(
    loanId: string,
    amount: number,
    paymentMethod: string,
    reference: string,
    metadata?: any,
  ): Promise<LoanRepayment> {
    try {
      const loan = await this.loanRequestRepository.findOne({
        where: { id: loanId },
        relations: ['disbursements', 'repayments'],
      });

      if (!loan) {
        throw new Error('Loan not found');
      }

      // Validate payment amount
      const repaymentSchedule = await this.calculateRepaymentSchedule(loanId);
      const outstandingAmount = this.calculateOutstandingAmount(
        loan,
        repaymentSchedule,
      );

      if (amount > outstandingAmount) {
        throw new Error('Payment amount exceeds outstanding balance');
      }

      // Create repayment record
      const repayment = this.repaymentRepository.create({
        loan_request_id: loanId,
        amount,
        interest_paid: amount * 0.1, // Assume 10% is interest
        principal_paid: amount * 0.9, // Assume 90% is principal
        repayment_date: new Date(),
        external_txn_ref: reference,
        metadata: { payment_method: paymentMethod, ...metadata },
        created_at: new Date(),
      });

      const savedRepayment = await this.repaymentRepository.save(repayment);

      // Update loan status if fully repaid
      await this.updateLoanStatus(loan, amount, repaymentSchedule);

      // Emit repayment event
      this.eventEmitter.emit('loan.repayment.received', {
        loanId,
        amount,
        remainingBalance: outstandingAmount - amount,
        repaymentId: Array.isArray(savedRepayment)
          ? savedRepayment[0]?.id
          : savedRepayment.id,
      });

      this.logger.log(`Repayment processed: ${amount} for loan ${loanId}`);
      return Array.isArray(savedRepayment) ? savedRepayment[0] : savedRepayment;
    } catch (error) {
      this.logger.error('Error processing repayment', error);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processOverdueLoans(): Promise<void> {
    try {
      this.logger.log('Processing overdue loans...');

      const overdueLoans = await this.loanRequestRepository
        .createQueryBuilder('loan')
        .leftJoinAndSelect('loan.disbursements', 'disbursement')
        .where('loan.status IN (:...statuses)', {
          statuses: ['approved', 'disbursed'],
        })
        .andWhere('disbursement.created_at <= :overdueDate', {
          overdueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        })
        .getMany();

      for (const loan of overdueLoans) {
        await this.processOverdueLoan(loan);
      }

      this.logger.log(`Processed ${overdueLoans.length} overdue loans`);
    } catch (error) {
      this.logger.error('Error processing overdue loans', error);
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async generateRepaymentReminders(): Promise<void> {
    try {
      this.logger.log('Generating repayment reminders...');

      const loansDueSoon = await this.getLoansDueSoon(7); // 7 days

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

    const repaymentSchedule = await this.calculateRepaymentSchedule(loanId);
    return this.calculateOutstandingAmount(loan, repaymentSchedule);
  }

  private calculateInstallments(
    principal: number,
    totalInterest: number,
    termDays: number,
    startDate: Date,
  ): RepaymentSchedule[] {
    const installments: RepaymentSchedule[] = [];

    // For simplicity, assume monthly installments
    const monthlyInstallments = Math.ceil(termDays / 30);
    const monthlyPrincipal = principal / monthlyInstallments;
    const monthlyInterest = totalInterest / monthlyInstallments;

    for (let i = 1; i <= monthlyInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      installments.push({
        loan_id: '',
        installment_number: i,
        due_date: dueDate,
        amount: monthlyPrincipal + monthlyInterest,
        principal: monthlyPrincipal,
        interest: monthlyInterest,
        status: 'pending',
      });
    }

    return installments;
  }

  private calculateDaysOverdue(loan: LoanRequest): number {
    const disbursement = loan.disbursements?.[0];
    if (!disbursement) return 0;

    const dueDate = new Date(disbursement.created_at);
    dueDate.setDate(dueDate.getDate() + 30); // Default 30 days

    const now = new Date();
    const diffTime = now.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  private calculateOutstandingAmount(
    loan: LoanRequest,
    repaymentSchedule: RepaymentCalculation,
  ): number {
    const totalRepaid =
      loan.repayments?.reduce((sum, repayment) => sum + repayment.amount, 0) ||
      0;

    return repaymentSchedule.total_amount - totalRepaid;
  }

  private async updateLoanStatus(
    loan: LoanRequest,
    paymentAmount: number,
    repaymentSchedule: RepaymentCalculation,
  ): Promise<void> {
    const outstandingAmount = this.calculateOutstandingAmount(
      loan,
      repaymentSchedule,
    );

    if (outstandingAmount <= 0) {
      // Loan fully repaid
      await this.loanRequestRepository.update(loan.id, {
        status: 'REPAID' as any,
        // repaid_at: new Date(), // TODO: Add this field to LoanRequest entity
      });

      this.eventEmitter.emit('loan.repaid', {
        loanId: loan.id,
        totalAmount: repaymentSchedule.total_amount,
        totalRepaid: repaymentSchedule.total_amount,
      });
    } else if (outstandingAmount < repaymentSchedule.total_amount) {
      // Partial repayment
      await this.loanRequestRepository.update(loan.id, {
        status: 'APPROVED' as any, // Use approved status for partial repayment
        // last_payment_date: new Date(), // TODO: Add this field to LoanRequest entity
      });
    }
  }

  private async processOverdueLoan(loan: LoanRequest): Promise<void> {
    try {
      const daysOverdue = this.calculateDaysOverdue(loan);

      if (daysOverdue > 90) {
        // Mark as defaulted
        await this.loanRequestRepository.update(loan.id, {
          status: 'DEFAULTED' as any,
          // defaulted_at: new Date(), // TODO: Add this field to LoanRequest entity
        });

        this.eventEmitter.emit('loan.defaulted', {
          loanId: loan.id,
          daysOverdue,
          amount: loan.approved_amount,
        });
      } else if (daysOverdue > 30) {
        // Mark as overdue
        await this.loanRequestRepository.update(loan.id, {
          status: 'APPROVED' as any, // Keep as approved but mark as overdue
          // is_overdue: true, // TODO: Add this field to LoanRequest entity
        });

        this.eventEmitter.emit('loan.overdue', {
          loanId: loan.id,
          daysOverdue,
          amount: loan.approved_amount,
        });
      }
    } catch (error) {
      this.logger.error(`Error processing overdue loan ${loan.id}`, error);
    }
  }

  private async getLoansDueSoon(daysAhead: number): Promise<LoanRequest[]> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysAhead);

    return this.loanRequestRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.disbursements', 'disbursement')
      .where('loan.status IN (:...statuses)', {
        statuses: ['approved', 'disbursed'],
      })
      .andWhere('disbursement.created_at <= :dueDate', { dueDate })
      .getMany();
  }

  private async sendRepaymentReminder(loan: LoanRequest): Promise<void> {
    // This would integrate with notification service
    // For now, just log the reminder
    this.logger.log(`Sending repayment reminder for loan ${loan.id}`);

    this.eventEmitter.emit('loan.reminder.sent', {
      loanId: loan.id,
      amount: loan.approved_amount,
      dueDate: new Date(),
    });
  }
}
