import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
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
import { User } from '../../../entities/user.entity';
import { EventsGateway } from '../../events/events.gateway';
import { EmailService } from '../../auth/services/email.service';
import { SmsService } from '../../notifications/services/sms.service';

@Injectable()
export class LoanNotificationService {
  private readonly logger = new Logger(LoanNotificationService.name);
  private readonly frontendUrl: string;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventsGateway: EventsGateway,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') || ''
    ).replace(/\/$/, '');
  }

  /**
   * Deliver loan notifications on all channels: in-app (websocket), email, and SMS/message.
   */
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
    const channels = [
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
      NotificationChannel.SMS,
    ];

    let recipientEmail: string | undefined =
      metadata?.recipientEmail || undefined;
    let recipientPhone: string | undefined =
      metadata?.recipientPhone || undefined;

    try {
      const user = await this.userRepository.findOne({
        where: { id: recipientId },
      });
      if (user) {
        recipientEmail = recipientEmail || user.email || undefined;
        recipientPhone = recipientPhone || user.phone?.trim() || undefined;
      }
    } catch (err) {
      this.logger.warn(
        `Could not resolve contact details for ${recipientId}: ${err.message}`,
      );
    }

    try {
      const notification = this.notificationRepository.create({
        recipientId,
        tenantId,
        notificationType: type,
        category,
        priority,
        title,
        message,
        shortMessage: title,
        entityType: EntityType.LOAN,
        entityId,
        channels,
        status: NotificationStatus.SENT,
        isRead: false,
        actionUrl,
        sentAt: new Date(),
        metadata: {
          ...(metadata || {}),
          recipientEmail,
          recipientPhone,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: true,
          pushEnabled: false,
        },
        analytics: { openCount: 0, clickCount: 0 },
      });
      const saved = await this.notificationRepository.save(notification);
      this.eventsGateway.emitNotification(recipientId, saved);
    } catch (err) {
      this.logger.error(
        `Failed to send in-app loan notification to ${recipientId}: ${err.message}`,
      );
    }

    await this.deliverEmail(recipientEmail, title, message, actionUrl);
    await this.deliverSms(recipientPhone, title, message);
  }

  /** Email + SMS for contacts that may not have a platform User id (e.g. lender team). */
  async notifyExternalContact(params: {
    email?: string;
    phone?: string;
    tenantId: string;
    title: string;
    message: string;
    actionUrl?: string;
    loanId?: string;
  }): Promise<void> {
    await this.deliverEmail(
      params.email,
      params.title,
      params.message,
      params.actionUrl,
    );
    await this.deliverSms(params.phone, params.title, params.message);
  }

  private async deliverEmail(
    to: string | undefined,
    title: string,
    message: string,
    actionUrl?: string,
  ): Promise<void> {
    if (!to?.trim()) return;
    try {
      const ctaUrl =
        actionUrl && this.frontendUrl
          ? `${this.frontendUrl}${actionUrl}`
          : actionUrl;
      await this.emailService.sendGenericEmail({
        to: to.trim(),
        subject: `${title} — UrutiX`,
        textBody: ctaUrl ? `${message}\n\nOpen: ${ctaUrl}` : message,
        htmlBody: `
          <p style="font-size:15px;line-height:1.6;color:#334155;">${message}</p>
          ${
            ctaUrl
              ? `<p style="margin-top:24px;"><a href="${ctaUrl}"
                   style="display:inline-block;padding:12px 24px;background:#0f172a;color:#fff;
                          text-decoration:none;border-radius:8px;font-weight:600;">
                   View in UrutiX
                 </a></p>`
              : ''
          }
        `,
      });
    } catch (err) {
      this.logger.error(`Failed loan email to ${to}: ${err.message}`);
    }
  }

  private async deliverSms(
    phone: string | undefined,
    title: string,
    message: string,
  ): Promise<void> {
    const to = phone?.trim();
    if (!to) return;
    try {
      const smsBody = `UrutiX: ${title}. ${message}`.substring(0, 320);
      await this.smsService.sendSms(to, smsBody);
    } catch (err) {
      this.logger.error(`Failed loan SMS to ${to}: ${err.message}`);
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
    options: {
      pendingConfirmation?: boolean;
      fullyRepaid?: boolean;
      recipientEmail?: string;
      recipientPhone?: string;
    } = {},
  ) {
    const title = options.pendingConfirmation
      ? 'Loan Repayment Pending Confirmation'
      : options.fullyRepaid
        ? 'Loan Fully Repaid'
        : 'Loan Repayment Received';
    const message = options.pendingConfirmation
      ? `${borrowerName} initiated a repayment of ${amount.toLocaleString()} ${currency}. Awaiting mobile money confirmation.`
      : options.fullyRepaid
        ? `${borrowerName} repaid ${amount.toLocaleString()} ${currency}. This loan is now fully repaid.`
        : `${borrowerName} has made a repayment of ${amount.toLocaleString()} ${currency}.`;

    await this.send(
      lenderId,
      tenantId,
      NotificationType.LOAN_REPAYMENT_RECEIVED,
      NotificationCategory.LOAN,
      NotificationPriority.HIGH,
      title,
      message,
      loanId,
      `/lender/requests?loan=${loanId}`,
      {
        loanId,
        amount,
        borrowerName,
        currency,
        pendingConfirmation: options.pendingConfirmation,
        fullyRepaid: options.fullyRepaid,
        recipientEmail: options.recipientEmail,
        recipientPhone: options.recipientPhone,
      },
    );
  }

  /** Borrower (cargo owner) receives: confirmation that their repayment was submitted */
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
      pendingConfirmation?: boolean;
    } = {},
  ) {
    const currency = details.currency || 'RWF';
    const title = details.pendingConfirmation
      ? 'Repayment Awaiting Confirmation'
      : details.fullyRepaid
        ? 'Loan Fully Repaid'
        : 'Repayment Submitted';
    const interestNote =
      details.interestPaid != null && details.interestPaid > 0
        ? ` (includes ${Number(details.interestPaid).toLocaleString()} ${currency} interest)`
        : '';
    let message: string;
    if (details.pendingConfirmation) {
      message =
        `Your repayment of ${amount.toLocaleString()} ${currency}${interestNote} was initiated` +
        `${details.lenderName ? ` to ${details.lenderName}` : ''}. Confirm the mobile money prompt on your phone.`;
    } else if (details.fullyRepaid) {
      message =
        `Your repayment of ${amount.toLocaleString()} ${currency}${interestNote} was received` +
        `${details.lenderName ? ` by ${details.lenderName}` : ''}. Your loan is now fully repaid.`;
    } else {
      message =
        `Your repayment of ${amount.toLocaleString()} ${currency}${interestNote} was submitted successfully` +
        `${details.paymentMethod === 'mobile_money' ? '. Confirm the mobile money prompt on your phone if prompted.' : '.'}`;
    }

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
    const isCounter =
      details.isCounterOffer === true ||
      details.approvedAmount < details.requestedAmount - 0.01;
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
