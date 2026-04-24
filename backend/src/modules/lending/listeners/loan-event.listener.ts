import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanRequest } from '../../../entities/loan-request.entity';
import { Lender } from '../../../entities/lender.entity';
import { User } from '../../../entities/user.entity';
import { LoanNotificationService } from '../services/loan-notification.service';

@Injectable()
export class LoanEventListener {
  private readonly logger = new Logger(LoanEventListener.name);

  constructor(
    @InjectRepository(LoanRequest)
    private readonly loanRequestRepository: Repository<LoanRequest>,
    @InjectRepository(Lender)
    private readonly lenderRepository: Repository<Lender>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly loanNotificationService: LoanNotificationService,
  ) {}

  @OnEvent('loan.repayment.received')
  async handleRepaymentReceived(payload: { loanId: string; amount: number }) {
    try {
      const loan = await this.loanRequestRepository.findOne({ where: { id: payload.loanId } });
      if (!loan) return;

      const lender = loan.lender_id
        ? await this.lenderRepository.findOne({ where: { id: loan.lender_id } })
        : null;

      if (lender) {
        const lenderUser = await this.userRepository.findOne({ where: { email: lender.contact_email } });
        const borrowerUser = await this.userRepository.findOne({ where: { id: loan.created_by }, relations: ['profile'] });
        const borrowerName = borrowerUser?.profile
          ? `${borrowerUser.profile.firstName || ''} ${borrowerUser.profile.lastName || ''}`.trim() || borrowerUser.email
          : borrowerUser?.email || 'Borrower';

        if (lenderUser) {
          await this.loanNotificationService.notifyLenderRepaymentReceived(
            lenderUser.id,
            loan.tenant_id,
            loan.id,
            payload.amount,
            borrowerName,
          );
        }
      }
    } catch (err) {
      this.logger.warn(`loan.repayment.received notification failed: ${err.message}`);
    }
  }

  @OnEvent('loan.overdue')
  async handleLoanOverdue(payload: { loanId: string; daysOverdue: number; amount: number }) {
    try {
      const loan = await this.loanRequestRepository.findOne({ where: { id: payload.loanId } });
      if (!loan) return;

      const lender = loan.lender_id
        ? await this.lenderRepository.findOne({ where: { id: loan.lender_id } })
        : null;
      const lenderUser = lender
        ? await this.userRepository.findOne({ where: { email: lender.contact_email } })
        : null;
      const borrowerUser = await this.userRepository.findOne({ where: { id: loan.created_by } });

      if (borrowerUser && lenderUser) {
        const dueDate = loan.due_date || new Date();
        await this.loanNotificationService.notifyLoanOverdue(
          borrowerUser.id,
          lenderUser.id,
          loan.tenant_id,
          loan.id,
          dueDate,
          payload.amount || loan.approved_amount || loan.requested_amount,
        );
      }
    } catch (err) {
      this.logger.warn(`loan.overdue notification failed: ${err.message}`);
    }
  }

  @OnEvent('loan.reminder.sent')
  async handleRepaymentReminder(payload: { loanId: string; amount: number; dueDate: Date }) {
    try {
      const loan = await this.loanRequestRepository.findOne({ where: { id: payload.loanId } });
      if (!loan) return;

      const borrowerUser = await this.userRepository.findOne({ where: { id: loan.created_by } });
      if (borrowerUser) {
        await this.loanNotificationService.notifyPaymentReminder(
          borrowerUser.id,
          loan.tenant_id,
          loan.id,
          payload.dueDate || loan.due_date || new Date(),
          payload.amount || loan.approved_amount || loan.requested_amount,
        );
      }
    } catch (err) {
      this.logger.warn(`loan.reminder notification failed: ${err.message}`);
    }
  }
}
