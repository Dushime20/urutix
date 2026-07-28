import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationChannel,
  NotificationStatus,
  EntityType,
} from '../../../entities/notification.entity';
import { EventsGateway } from '../../events/events.gateway';

@Injectable()
export class LoanNotificationService {
  private readonly logger = new Logger(LoanNotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private async send(
    recipientId: string,
    tenantId: string,
    type: NotificationType,
    category: NotificationCategory,
    priority: NotificationPriority,
    title: string,
    message: string,
    entityId?: string,
    actionUrl?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const notification = this.notificationRepository.create({
        recipientId,
        tenantId,
        notificationType: type,
        category,
        priority,
        title,
        message,
        entityType: EntityType.LOAN,
        entityId,
        channels: [NotificationChannel.IN_APP],
        status: NotificationStatus.SENT,
        isRead: false,
        actionUrl,
        metadata: metadata || {},
        userPreferences: { emailEnabled: false, smsEnabled: false, pushEnabled: false },
        analytics: { openCount: 0, clickCount: 0 },
      });
      const saved = await this.notificationRepository.save(notification);
      this.eventsGateway.emitNotification(recipientId, saved);
    } catch (err) {
      this.logger.error(`Failed to send loan notification to ${recipientId}: ${err.message}`);
    }
  }

  /** Lender receives: new loan request submitted */
  async notifyLenderNewRequest(
    lenderId: string,
    tenantId: string,
    loanId: string,
    requesterName: string,
    amount: number,
  ) {
    await this.send(
      lenderId,
      tenantId,
      NotificationType.LOAN_REQUESTED,
      NotificationCategory.LOAN,
      NotificationPriority.HIGH,
      'New Loan Request',
      `${requesterName} has submitted a loan request for ${amount.toLocaleString()} RWF.`,
      loanId,
      `/lender/requests?loan=${loanId}`,
      { loanId, requesterName, amount },
    );
  }

  /** Cargo Owner receives: loan approved */
  async notifyCargoOwnerLoanApproved(
    cargoOwnerId: string,
    tenantId: string,
    loanId: string,
    approvedAmount: number,
    lenderName: string,
  ) {
    await this.send(
      cargoOwnerId,
      tenantId,
      NotificationType.LOAN_APPROVED,
      NotificationCategory.LOAN,
      NotificationPriority.HIGH,
      'Loan Approved',
      `Your loan request has been approved by ${lenderName} for ${approvedAmount.toLocaleString()} RWF.`,
      loanId,
      `/dashboard/loan-requests?loan=${loanId}`,
      { loanId, approvedAmount, lenderName },
    );
  }

  /** Truck Owner receives: lender paid on their behalf */
  async notifyTruckOwnerLenderPaid(
    truckOwnerId: string,
    tenantId: string,
    loanId: string,
    amount: number,
    lenderName: string,
  ) {
    await this.send(
      truckOwnerId,
      tenantId,
      NotificationType.LENDER_PAID_ON_BEHALF,
      NotificationCategory.LOAN,
      NotificationPriority.HIGH,
      'Payment Received via Lender',
      `${lenderName} has paid ${amount.toLocaleString()} RWF on behalf of the cargo owner.`,
      loanId,
      `/dashboard/fleet/financial`,
      { loanId, amount, lenderName },
    );
  }

  /** Cargo Owner receives: loan rejected */
  async notifyCargoOwnerLoanRejected(
    cargoOwnerId: string,
    tenantId: string,
    loanId: string,
    reason: string,
    lenderName: string,
  ) {
    await this.send(
      cargoOwnerId,
      tenantId,
      NotificationType.LOAN_REJECTED,
      NotificationCategory.LOAN,
      NotificationPriority.HIGH,
      'Loan Request Rejected — You Can Appeal',
      `Your loan request was rejected by ${lenderName}. Reason: ${reason || 'Not specified'}. ` +
      `You may appeal or add a comment for reconsideration.`,
      loanId,
      `/dashboard/loan-requests?loan=${loanId}&action=appeal`,
      { loanId, reason, lenderName, action: 'appeal' },
    );
  }

  /** Lender receives: repayment made */
  async notifyLenderRepaymentReceived(
    lenderId: string,
    tenantId: string,
    loanId: string,
    amount: number,
    borrowerName: string,
    currency: string = 'RWF',
  ) {
    await this.send(
      lenderId,
      tenantId,
      NotificationType.LOAN_REPAYMENT_RECEIVED,
      NotificationCategory.LOAN,
      NotificationPriority.HIGH,
      'Loan Repayment Received',
      `${borrowerName} has made a repayment of ${amount.toLocaleString()} ${currency}.`,
      loanId,
      `/lender/requests?loan=${loanId}`,
      { loanId, amount, borrowerName, currency },
    );
  }

  /** Borrower receives: confirmation that their repayment was submitted */
  async notifyBorrowerRepaymentConfirmed(
    borrowerId: string,
    tenantId: string,
    loanId: string,
    amount: number,
    details: {
      currency?: string;
      principalPaid?: number;
      interestPaid?: number;
      fullyRepaid?: boolean;
      paymentMethod?: string;
      lenderName?: string;
    } = {},
  ) {
    const currency = details.currency || 'RWF';
    const title = details.fullyRepaid
      ? 'Loan Fully Repaid'
      : 'Repayment Submitted';
    const interestNote =
      details.interestPaid != null && details.interestPaid > 0
        ? ` (includes ${Number(details.interestPaid).toLocaleString()} ${currency} interest)`
        : '';
    const message = details.fullyRepaid
      ? `Your repayment of ${amount.toLocaleString()} ${currency}${interestNote} was received` +
        `${details.lenderName ? ` by ${details.lenderName}` : ''}. Your loan is now fully repaid.`
      : `Your repayment of ${amount.toLocaleString()} ${currency}${interestNote} was submitted successfully` +
        `${details.paymentMethod === 'mobile_money' ? '. Confirm the mobile money prompt on your phone if prompted.' : '.'}`;

    await this.send(
      borrowerId,
      tenantId,
      NotificationType.PAYMENT_RECEIVED,
      NotificationCategory.LOAN,
      NotificationPriority.HIGH,
      title,
      message,
      loanId,
      `/dashboard/loan-requests?loan=${loanId}`,
      { loanId, amount, ...details },
    );
  }

  /** Cargo Owner + Lender receive: loan overdue */
  async notifyLoanOverdue(
    cargoOwnerId: string,
    lenderId: string,
    tenantId: string,
    loanId: string,
    dueDate: Date,
    outstandingAmount: number,
  ) {
    const dueDateStr = dueDate.toLocaleDateString();
    await this.send(
      cargoOwnerId,
      tenantId,
      NotificationType.LOAN_OVERDUE,
      NotificationCategory.LOAN,
      NotificationPriority.URGENT,
      'Loan Overdue',
      `Your loan of ${outstandingAmount.toLocaleString()} RWF was due on ${dueDateStr}. Please repay immediately.`,
      loanId,
      `/dashboard/loan-requests?loan=${loanId}`,
      { loanId, dueDate, outstandingAmount },
    );
    await this.send(
      lenderId,
      tenantId,
      NotificationType.LOAN_OVERDUE,
      NotificationCategory.LOAN,
      NotificationPriority.URGENT,
      'Loan Overdue Alert',
      `A loan of ${outstandingAmount.toLocaleString()} RWF was due on ${dueDateStr} and has not been repaid.`,
      loanId,
      `/lender/requests?loan=${loanId}`,
      { loanId, dueDate, outstandingAmount },
    );
  }

  /** Cargo Owner receives: payment reminder */
  async notifyPaymentReminder(
    cargoOwnerId: string,
    tenantId: string,
    loanId: string,
    dueDate: Date,
    amount: number,
  ) {
    await this.send(
      cargoOwnerId,
      tenantId,
      NotificationType.PAYMENT_REMINDER,
      NotificationCategory.LOAN,
      NotificationPriority.HIGH,
      'Payment Reminder',
      `Your loan repayment of ${amount.toLocaleString()} RWF is due on ${dueDate.toLocaleDateString()}.`,
      loanId,
      `/dashboard/loan-requests?loan=${loanId}`,
      { loanId, dueDate, amount },
    );
  }

  /** Borrower receives formal terms offer — must accept before disbursement (TILA). */
  async notifyBorrowerTermsOffered(
    cargoOwnerId: string,
    tenantId: string,
    loanId: string,
    details: {
      lenderName: string;
      approvedAmount: number;
      requestedAmount: number;
      interestAmount: number;
      totalRepayable: number;
      dueDate: Date;
      loanTermMonths: number;
      apr: number | null;
      currency: string;
      loanNumber?: string;
      isCounterOffer?: boolean;
    },
  ) {
    const ref = details.loanNumber || loanId.slice(0, 8).toUpperCase();
    const isCounter = details.isCounterOffer === true
      || details.approvedAmount < details.requestedAmount - 0.01;
    const title = isCounter
      ? 'Counter-Offer Received — Agree or Reject'
      : 'Loan Terms Offer — Action Required';
    const message = isCounter
      ? `${details.lenderName} offered ${details.approvedAmount.toLocaleString()} ${details.currency} ` +
        `(you requested ${details.requestedAmount.toLocaleString()} ${details.currency}). ` +
        `Review the revised terms and agree or reject before funding can proceed.`
      : `${details.lenderName} has offered you a loan of ${details.approvedAmount.toLocaleString()} ${details.currency} ` +
        `(total repayable: ${details.totalRepayable.toLocaleString()} ${details.currency}, due ${new Date(details.dueDate).toLocaleDateString()}). ` +
        `Please review and accept the terms before funds are disbursed.`;

    await this.send(
      cargoOwnerId,
      tenantId,
      NotificationType.LOAN_TERMS_OFFERED,
      NotificationCategory.LOAN,
      NotificationPriority.HIGH,
      title,
      message,
      loanId,
      `/dashboard/loan-requests?loan=${loanId}&action=review-offer`,
      { ...details, loanRef: ref, isCounterOffer: isCounter },
    );
  }

  async notifyLenderTermsAccepted(
    lenderUserId: string,
    tenantId: string,
    loanId: string,
    amount: number,
    loanNumber?: string,
  ) {
    await this.send(
      lenderUserId,
      tenantId,
      NotificationType.LOAN_TERMS_ACCEPTED,
      NotificationCategory.LOAN,
      NotificationPriority.HIGH,
      'Borrower Accepted — Ready to Disburse',
      `The borrower has accepted the loan terms${loanNumber ? ` (#${loanNumber})` : ''}. ` +
      `Open the payment modal to disburse ${amount.toLocaleString()}.`,
      loanId,
      `/lender/requests?loan=${loanId}&action=disburse`,
      { loanId, amount, loanNumber, action: 'disburse' },
    );
  }

  async notifyLenderTermsDeclined(
    lenderUserId: string,
    tenantId: string,
    loanId: string,
    reason?: string,
  ) {
    await this.send(
      lenderUserId,
      tenantId,
      NotificationType.LOAN_TERMS_DECLINED,
      NotificationCategory.LOAN,
      NotificationPriority.HIGH,
      'Borrower Declined Offer — Revise Terms',
      `The borrower declined the offered terms.${reason ? ` Reason: ${reason}` : ''} ` +
      `You may submit a revised offer on this application.`,
      loanId,
      `/lender/requests?loan=${loanId}&action=revise`,
      { loanId, reason },
    );
  }

  async notifyCargoOwnerLoanDisbursed(
    cargoOwnerId: string,
    tenantId: string,
    loanId: string,
    amount: number,
    lenderName: string,
    currency: string = 'RWF',
  ) {
    await this.send(
      cargoOwnerId,
      tenantId,
      NotificationType.LOAN_DISBURSED,
      NotificationCategory.LOAN,
      NotificationPriority.HIGH,
      'Loan Disbursed',
      `${lenderName} has disbursed ${amount.toLocaleString()} ${currency} on your behalf. ` +
      `Your repayment obligation is now active.`,
      loanId,
      `/dashboard/loan-requests?loan=${loanId}`,
      { loanId, amount, lenderName, currency },
    );
  }

  /** Lender receives: borrower appealed a rejection */
  async notifyLenderLoanAppealed(
    lenderUserId: string,
    tenantId: string,
    loanId: string,
    comment: string,
    loanNumber?: string,
  ) {
    await this.send(
      lenderUserId,
      tenantId,
      NotificationType.LOAN_APPEAL_SUBMITTED,
      NotificationCategory.LOAN,
      NotificationPriority.HIGH,
      'Borrower Appealed Loan Rejection',
      `The borrower appealed${loanNumber ? ` (#${loanNumber})` : ''}: "${comment.slice(0, 160)}${comment.length > 160 ? '…' : ''}". ` +
      `Please confirm a new offer or reject again.`,
      loanId,
      `/lender/requests?loan=${loanId}&action=revise`,
      { loanId, comment, loanNumber, action: 'revise' },
    );
  }
}
