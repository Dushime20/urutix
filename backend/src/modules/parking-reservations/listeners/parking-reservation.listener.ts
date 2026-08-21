import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { In, Repository } from 'typeorm';
import { EventsGateway } from '../../events/events.gateway';
import { User, UserRole, UserStatus } from '../../../entities/user.entity';
import { Driver, DriverStatus } from '../../../entities/driver.entity';
import { EmailService } from '../../auth/services/email.service';
import { SmsService } from '../../notifications/services/sms.service';
import { MessengerService } from '../../messenger/messenger.service';
import { MessageRole } from '../../../entities/message.entity';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationChannel,
  NotificationStatus,
  EntityType,
} from '../../../entities/notification.entity';
import { ParkingFacilityConfig, ParkingReservation } from '../../../entities/parking-reservation.entity';

type ApplicantNotice = {
  type: NotificationType;
  title: string;
  message: string;
  subject: string;
  emailTitle: string;
  emailBody: string;
  extraHtml?: string;
  ctaLabel?: string;
  priority?: NotificationPriority;
  skipEmail?: boolean;
};

@Injectable()
export class ParkingReservationListener {
  private readonly logger = new Logger(ParkingReservationListener.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly eventsGateway: EventsGateway,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ParkingFacilityConfig)
    private readonly facilityRepository: Repository<ParkingFacilityConfig>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly messengerService: MessengerService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') || 'https://urutix.com'
    ).replace(/\/$/, '');
  }

  @OnEvent('parking.reservation.created')
  async onCreated(payload: { reservation: ParkingReservation }) {
    const { reservation } = payload;
    try {
      await this.notifyOfficers(reservation, {
        type: NotificationType.PARKING_RESERVATION_SUBMITTED,
        title: 'New parking reservation',
        message: `${reservation.companyName} submitted ${reservation.reservationReference} (${reservation.truckSpacesRequested} spaces).`,
        actionUrl: `/dashboard/parking/reservations/${reservation.id}`,
      });
      const email = await this.notifyApplicant(reservation, {
        type: NotificationType.PARKING_RESERVATION_SUBMITTED,
        title: 'Parking reservation submitted',
        message: `Your truck parking reservation ${reservation.reservationReference} was submitted and is pending review.`,
        subject: `Your parking reservation reference: ${reservation.reservationReference}`,
        emailTitle: 'Reservation Request Submitted',
        emailBody: `Thank you for submitting your truck parking reservation. Save the reference below — you will need it to track status, receive updates, and respond if our parking team needs more information.`,
      });
      return { emailSent: email.success, sentTo: email.sentTo };
    } catch (error) {
      this.logger.error(
        `Parking created notifications failed for ${reservation.reservationReference}`,
        error instanceof Error ? error.stack : String(error),
      );
      return { emailSent: false, sentTo: [] };
    }
  }

  @OnEvent('parking.reservation.assigned')
  async onAssigned(payload: { reservation: ParkingReservation; assignedToUserId: string }) {
    const { reservation, assignedToUserId } = payload;
    await this.notifyUser(assignedToUserId, reservation, {
      type: NotificationType.PARKING_RESERVATION_ASSIGNED,
      title: 'Parking reservation assigned',
      message: `${reservation.reservationReference} has been assigned to you.`,
      actionUrl: `/dashboard/parking/reservations/${reservation.id}`,
    });
  }

  @OnEvent('parking.reservation.changed')
  async onChanged(payload: { reservation: ParkingReservation; event?: string }) {
    const { reservation, event } = payload;
    if (event !== 'review_started') return;
    await this.notifyApplicant(reservation, {
      type: NotificationType.PARKING_RESERVATION_SUBMITTED,
      title: 'Parking reservation under review',
      message: `${reservation.reservationReference} is now under review.`,
      subject: `Reservation under review — ${reservation.reservationReference}`,
      emailTitle: 'Reservation Under Review',
      emailBody: `Our parking team has started reviewing reservation ${this.escape(reservation.reservationReference)}. We will email you as soon as there is an update.`,
    });
  }

  @OnEvent('parking.reservation.information_requested')
  async onInfoRequested(payload: { reservation: ParkingReservation }) {
    const { reservation } = payload;
    await this.notifyApplicant(reservation, {
      type: NotificationType.PARKING_RESERVATION_INFO_REQUIRED,
      title: 'Additional information required',
      message: `More information is needed for ${reservation.reservationReference}.`,
      subject: `Information needed — ${reservation.reservationReference}`,
      emailTitle: 'Additional Information Required',
      emailBody: `Our parking team needs more information for reservation ${this.escape(reservation.reservationReference)}.<br/><br/><strong>Requested:</strong> ${this.escape(reservation.informationRequested || '')}`,
    });
  }

  @OnEvent('parking.reservation.information_received')
  async onInfoReceived(payload: { reservation: ParkingReservation }) {
    const { reservation } = payload;
    await this.notifyOfficers(reservation, {
      type: NotificationType.PARKING_RESERVATION_SUBMITTED,
      title: 'Parking reservation response received',
      message: `${reservation.reservationReference} received additional information.`,
      actionUrl: `/dashboard/parking/reservations/${reservation.id}`,
    });
    await this.notifyApplicant(reservation, {
      type: NotificationType.PARKING_RESERVATION_SUBMITTED,
      title: 'Response received',
      message: `We received your additional information for ${reservation.reservationReference}.`,
      subject: `We received your response — ${reservation.reservationReference}`,
      emailTitle: 'Response Received',
      emailBody: `Thank you. We received the additional information for reservation ${this.escape(reservation.reservationReference)} and our parking team will continue the review.`,
    });
  }

  @OnEvent('parking.reservation.approved')
  async onApproved(payload: { reservation: ParkingReservation; paymentRequested?: boolean }) {
    const { reservation, paymentRequested } = payload;
    const paymentDue = paymentRequested || reservation.paymentStatus === 'DUE';
    const amountLabel = this.money(reservation.totalAmountDue, reservation.currency);
    await this.notifyApplicant(reservation, {
      type: NotificationType.PARKING_RESERVATION_APPROVED,
      title: 'Parking reservation confirmed',
      message: paymentDue
        ? `${reservation.reservationReference} is confirmed. Please pay ${amountLabel} to complete the reservation.`
        : `${reservation.reservationReference} has been approved.`,
      subject: paymentDue
        ? `Reservation confirmed — payment required (${reservation.reservationReference})`
        : `Reservation confirmed — ${reservation.reservationReference}`,
      emailTitle: 'Reservation Confirmed',
      emailBody: paymentDue
        ? `Your truck parking reservation ${this.escape(reservation.reservationReference)} has been reviewed and confirmed. Please pay the reservation fees below to secure your space(s).`
        : `Your truck parking reservation ${this.escape(reservation.reservationReference)} has been reviewed and confirmed.`,
      extraHtml: paymentDue ? this.paymentBox(reservation) : '',
      ctaLabel: paymentDue ? 'Pay reservation fees' : 'Track your reservation',
      priority: paymentDue ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
    });
    if (paymentDue) {
      await this.notifyApplicant(reservation, {
        type: NotificationType.PARKING_RESERVATION_PAYMENT_DUE,
        title: 'Parking reservation fees due',
        message: `Pay ${amountLabel} for ${reservation.reservationReference}. Invoice ${reservation.invoiceNumber || ''}.`.trim(),
        subject: `Payment required — ${reservation.reservationReference}`,
        emailTitle: 'Reservation Fees Due',
        emailBody: `A payment of <strong>${this.escape(amountLabel)}</strong> is now due for reservation ${this.escape(reservation.reservationReference)}. Use the invoice details below and submit your payment confirmation from the lookup page or your driver dashboard.`,
        extraHtml: this.paymentBox(reservation),
        ctaLabel: 'Pay reservation fees',
        priority: NotificationPriority.HIGH,
        skipEmail: true,
      });
    }
  }

  @OnEvent('parking.reservation.payment_submitted')
  async onPaymentSubmitted(payload: { reservation: ParkingReservation }) {
    const { reservation } = payload;
    await this.notifyOfficers(reservation, {
      type: NotificationType.PARKING_RESERVATION_PAYMENT_DUE,
      title: 'Parking payment confirmation received',
      message: `${reservation.reservationReference} submitted payment ${reservation.paymentReference || ''} for verification.`,
      actionUrl: `/dashboard/parking/reservations/${reservation.id}`,
    });
    await this.notifyApplicant(reservation, {
      type: NotificationType.PARKING_RESERVATION_PAYMENT_DUE,
      title: 'Payment confirmation received',
      message: `We received your payment confirmation for ${reservation.reservationReference}. The parking team will verify it shortly.`,
      subject: `Payment confirmation received — ${reservation.reservationReference}`,
      emailTitle: 'Payment Confirmation Received',
      emailBody: `Thank you. We received your payment confirmation for reservation ${this.escape(reservation.reservationReference)}. Our parking team will verify the payment and notify you when it is recorded.`,
    });
  }

  @OnEvent('parking.reservation.payment_received')
  async onPaymentReceived(payload: { reservation: ParkingReservation }) {
    const { reservation } = payload;
    const amountLabel = this.money(reservation.paidAmount || reservation.totalAmountDue, reservation.currency);
    await this.notifyApplicant(reservation, {
      type: NotificationType.PARKING_RESERVATION_PAYMENT_RECEIVED,
      title: 'Parking reservation payment received',
      message: `Payment of ${amountLabel} for ${reservation.reservationReference} has been confirmed.`,
      subject: `Payment confirmed — ${reservation.reservationReference}`,
      emailTitle: 'Payment Confirmed',
      emailBody: `We have confirmed your payment of <strong>${this.escape(amountLabel)}</strong> for reservation ${this.escape(reservation.reservationReference)}. Your parking reservation is now paid in full.`,
      extraHtml: this.paymentBox(reservation),
    });
  }

  @OnEvent('parking.reservation.payment_waived')
  async onPaymentWaived(payload: { reservation: ParkingReservation }) {
    const { reservation } = payload;
    await this.notifyApplicant(reservation, {
      type: NotificationType.PARKING_RESERVATION_PAYMENT_RECEIVED,
      title: 'Parking reservation fees waived',
      message: `Fees for ${reservation.reservationReference} were waived. No payment is required.`,
      subject: `Fees waived — ${reservation.reservationReference}`,
      emailTitle: 'Parking Fees Waived',
      emailBody: `The parking team waived the reservation fees for ${this.escape(reservation.reservationReference)}. No payment is required.`,
    });
  }

  @OnEvent('parking.reservation.rejected')
  async onRejected(payload: { reservation: ParkingReservation }) {
    const { reservation } = payload;
    await this.notifyApplicant(reservation, {
      type: NotificationType.PARKING_RESERVATION_REJECTED,
      title: 'Parking reservation rejected',
      message: `${reservation.reservationReference} was not approved.`,
      subject: `Reservation update — ${reservation.reservationReference}`,
      emailTitle: 'Reservation Rejected',
      emailBody: `We were unable to approve reservation ${this.escape(reservation.reservationReference)}. ${reservation.rejectionReason ? `Reason: ${this.escape(reservation.rejectionReason)}` : 'Please contact the parking team for next steps.'}`,
    });
  }

  @OnEvent('parking.reservation.cancelled')
  async onCancelled(payload: { reservation: ParkingReservation }) {
    const { reservation } = payload;
    await this.notifyOfficers(reservation, {
      type: NotificationType.PARKING_RESERVATION_CANCELLED,
      title: 'Parking reservation cancelled',
      message: `${reservation.reservationReference} was cancelled.`,
      actionUrl: `/dashboard/parking/reservations/${reservation.id}`,
    });
    await this.notifyApplicant(reservation, {
      type: NotificationType.PARKING_RESERVATION_CANCELLED,
      title: 'Parking reservation cancelled',
      message: `${reservation.reservationReference} was cancelled.`,
      subject: `Reservation cancelled — ${reservation.reservationReference}`,
      emailTitle: 'Reservation Cancelled',
      emailBody: `Reservation ${this.escape(reservation.reservationReference)} has been cancelled.`,
    });
  }

  /**
   * Guests always get email. Registered drivers also get in-app + SMS + messenger.
   */
  private async notifyApplicant(
    reservation: ParkingReservation,
    notice: ApplicantNotice,
  ): Promise<{ success: boolean; sentTo: string[] }> {
    const email = notice.skipEmail
      ? { success: true, sentTo: [] as string[] }
      : await this.emailApplicant(reservation, {
          subject: notice.subject,
          title: notice.emailTitle,
          body: notice.emailBody,
          extraHtml: notice.extraHtml,
          ctaLabel: notice.ctaLabel,
        });
    await this.notifyRegisteredDriver(reservation, notice);
    return email;
  }

  private lookupUrl() {
    return `${this.frontendUrl}/parking-reservation/lookup`;
  }

  private applicantActionUrl(reservation: ParkingReservation, user?: User): string {
    if (user?.role === UserRole.DRIVER) {
      return `/dashboard/driver/parking-reservations/${reservation.id}`;
    }
    if (user?.role === UserRole.TRUCK_OWNER) {
      return `/dashboard/fleet/parking-reservations/${reservation.id}`;
    }
    return `/dashboard/parking-reservations/${reservation.id}`;
  }

  private referenceBox(reservation: ParkingReservation): string {
    return `
      <div style="background:#EBF1F6;border-radius:12px;padding:18px 16px;text-align:center;margin:8px 0 20px;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#64748b;font-weight:700;">Reservation Reference</div>
        <div style="font-size:22px;font-weight:800;color:#345E85;margin-top:6px;letter-spacing:0.5px;">${this.escape(reservation.reservationReference)}</div>
      </div>
    `;
  }

  private summary(reservation: ParkingReservation): string {
    return `
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 8px;font-size:14px;color:#334155;">
        <tr><td style="padding:6px 0;"><strong>Company</strong></td><td>${this.escape(reservation.companyName)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Driver</strong></td><td>${this.escape([reservation.driverFirstName, reservation.driverLastName].filter(Boolean).join(' '))}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Driver email</strong></td><td>${this.escape(reservation.driverEmail || reservation.email)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Requested date</strong></td><td>${this.escape(String(reservation.requestedStartDate).slice(0, 10))}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Truck spaces</strong></td><td>${reservation.truckSpacesRequested}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Contract duration</strong></td><td>${reservation.contractMonths} month(s)</td></tr>
        <tr><td style="padding:6px 0;"><strong>Status</strong></td><td>${this.escape(reservation.status.replace(/_/g, ' '))}</td></tr>
      </table>
    `;
  }

  private paymentBox(reservation: ParkingReservation): string {
    const snapshot = (reservation.feeSnapshot || {}) as Record<string, unknown>;
    const currency = reservation.currency || (snapshot.currency as string) || 'USD';
    const due = reservation.paymentDueAt
      ? new Date(reservation.paymentDueAt).toISOString().slice(0, 10)
      : 'Upon confirmation';
    const instructions = typeof snapshot.paymentInstructions === 'string' ? snapshot.paymentInstructions : '';
    return `
      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;padding:16px;margin:8px 0 20px;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c2410c;font-weight:700;">Payment required</div>
        <div style="font-size:22px;font-weight:800;color:#9a3412;margin:8px 0;">${this.escape(this.money(reservation.totalAmountDue, currency))}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;color:#334155;">
          <tr><td style="padding:4px 0;">Invoice</td><td>${this.escape(reservation.invoiceNumber || '')}</td></tr>
          <tr><td style="padding:4px 0;">Occupancy</td><td>${this.escape(this.money(reservation.occupancyAmount, currency))}</td></tr>
          <tr><td style="padding:4px 0;">Reservation fee</td><td>${this.escape(this.money(reservation.reservationFeeAmount, currency))}</td></tr>
          <tr><td style="padding:4px 0;">Tax / VAT</td><td>${this.escape(this.money(reservation.taxAmount, currency))}</td></tr>
          <tr><td style="padding:4px 0;">Due date</td><td>${this.escape(due)}</td></tr>
        </table>
        ${instructions ? `<p style="margin:12px 0 0;font-size:13px;color:#7c2d12;"><strong>How to pay:</strong> ${this.escape(instructions)}</p>` : ''}
      </div>
    `;
  }

  private money(amount: unknown, currency?: string): string {
    const value = Number(amount);
    const code = (currency || 'USD').toUpperCase();
    if (!Number.isFinite(value)) return `${code} 0.00`;
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(value);
    } catch {
      return `${code} ${value.toFixed(2)}`;
    }
  }

  private applicantEmails(reservation: ParkingReservation): string[] {
    const emails = [reservation.driverEmail, reservation.email]
      .map((value) => (value || '').trim().toLowerCase())
      .filter((value) => value.includes('@'));
    return [...new Set(emails)];
  }

  private driverLookupEmail(reservation: ParkingReservation): string {
    return (reservation.driverEmail || reservation.email || '').trim().toLowerCase();
  }

  private async emailApplicant(
    reservation: ParkingReservation,
    opts: { subject: string; title: string; body: string; extraHtml?: string; ctaLabel?: string },
  ): Promise<{ success: boolean; sentTo: string[] }> {
    const recipients = this.applicantEmails(reservation);
    if (!recipients.length) {
      this.logger.error(
        `Parking email skipped for ${reservation.reservationReference}: no driver or company email on file`,
      );
      return { success: false, sentTo: [] };
    }

    const greeting = reservation.driverFirstName
      ? `Hello ${this.escape(reservation.driverFirstName)},`
      : 'Hello,';
    const lookupUrl = this.lookupUrl();
    const sentTo: string[] = [];
    let allSucceeded = true;

    for (const to of recipients) {
      const result = await this.emailService.sendParkingReservationEmail({
        to,
        subject: opts.subject,
        title: opts.title,
        greeting,
        body: opts.body,
        extraHtml: `${opts.extraHtml || ''}${this.referenceBox(reservation)}${this.summary(reservation)}`,
        ctaLabel: opts.ctaLabel || 'Track your reservation',
        ctaUrl: lookupUrl,
        note: 'Use your reservation reference and the driver email from this message to look up status, events, and payment at any time. We will also email you whenever the status changes.',
        textBody: [
          opts.title,
          '',
          opts.body.replace(/<[^>]+>/g, ' '),
          '',
          `Reservation Reference: ${reservation.reservationReference}`,
          `Company: ${reservation.companyName}`,
          `Driver: ${[reservation.driverFirstName, reservation.driverLastName].filter(Boolean).join(' ')}`,
          `Requested date: ${String(reservation.requestedStartDate).slice(0, 10)}`,
          `Truck spaces: ${reservation.truckSpacesRequested}`,
          `Contract duration: ${reservation.contractMonths} month(s)`,
          `Status: ${reservation.status.replace(/_/g, ' ')}`,
          '',
          `Track your reservation: ${lookupUrl}`,
        ].join('\n'),
      });
      if (result.success) {
        sentTo.push(to);
        this.logger.log(`Parking email sent for ${reservation.reservationReference} → ${to}`);
      } else {
        allSucceeded = false;
        this.logger.error(
          `Parking email failed for ${reservation.reservationReference} → ${to}: ${result.error}`,
        );
      }
    }

    return { success: allSucceeded && sentTo.length > 0, sentTo };
  }

  private async findRegisteredDriverAccounts(
    reservation: ParkingReservation,
  ): Promise<Array<{ user: User; phone?: string }>> {
    const driverEmail = this.driverLookupEmail(reservation);
    const byUserId = new Map<string, { user: User; phone?: string }>();

    const addUser = (user?: User | null, phone?: string) => {
      if (!user || user.status !== UserStatus.ACTIVE) return;
      const existing = byUserId.get(user.id);
      byUserId.set(user.id, {
        user,
        phone: phone || existing?.phone || user.phone?.trim() || undefined,
      });
    };

    if (driverEmail.includes('@')) {
      const users = await this.userRepository
        .createQueryBuilder('u')
        .where('LOWER(u.email) = :email', { email: driverEmail })
        .andWhere('u.status = :status', { status: UserStatus.ACTIVE })
        .andWhere('u."deleted_at" IS NULL')
        .getMany();
      users.forEach((user) => addUser(user));

      const drivers = await this.driverRepository
        .createQueryBuilder('d')
        .where('LOWER(d.email) = :email', { email: driverEmail })
        .andWhere('d.status NOT IN (:...closed)', {
          closed: [DriverStatus.TERMINATED, DriverStatus.SUSPENDED],
        })
        .getMany();

      const driverUserIds = [...new Set(drivers.map((d) => d.userId).filter(Boolean))];
      if (driverUserIds.length) {
        const driverUsers = await this.userRepository.find({
          where: { id: In(driverUserIds), status: UserStatus.ACTIVE },
        });
        const userById = new Map(driverUsers.map((u) => [u.id, u]));
        for (const driver of drivers) {
          addUser(userById.get(driver.userId), driver.phone);
        }
      }
    }

    if (reservation.submittedByUserId && !byUserId.has(reservation.submittedByUserId)) {
      const submitter = await this.userRepository.findOne({
        where: { id: reservation.submittedByUserId, status: UserStatus.ACTIVE },
      });
      addUser(submitter);
    }

    return [...byUserId.values()];
  }

  private async notifyRegisteredDriver(reservation: ParkingReservation, notice: ApplicantNotice) {
    try {
      const accounts = await this.findRegisteredDriverAccounts(reservation);
      if (!accounts.length) {
        this.logger.log(
          `No registered driver for ${reservation.reservationReference} — email only`,
        );
        return;
      }

      for (const account of accounts) {
        const actionUrl = this.applicantActionUrl(reservation, account.user);
        await this.notifyUser(account.user.id, reservation, {
          type: notice.type,
          title: notice.title,
          message: notice.message,
          actionUrl,
          channels: [NotificationChannel.IN_APP, NotificationChannel.SMS, NotificationChannel.EMAIL],
          priority: notice.priority,
        });
        await this.sendApplicantSms(account.phone, reservation, notice);
        await this.sendApplicantMessage(account.user, reservation, notice);
      }
    } catch (error) {
      this.logger.error(
        `Failed registered-driver notifications for ${reservation.reservationReference}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async sendApplicantSms(
    phone: string | undefined,
    reservation: ParkingReservation,
    notice: ApplicantNotice,
  ) {
    const to = phone?.trim();
    if (!to) return;
    try {
      const body = `Nova Parking 365: ${notice.title}. Ref ${reservation.reservationReference}. ${notice.message}`;
      await this.smsService.sendSms(to, body.slice(0, 320));
      this.logger.log(`Parking SMS sent for ${reservation.reservationReference} → ${to}`);
    } catch (error) {
      this.logger.warn(`Parking SMS failed: ${(error as Error).message}`);
    }
  }

  private async sendApplicantMessage(
    user: User,
    reservation: ParkingReservation,
    notice: ApplicantNotice,
  ) {
    try {
      const senderId = await this.resolveSystemSenderId(reservation, user.id);
      if (!senderId) return;
      const content =
        `${notice.title}\n\n${notice.message}\n\nReservation: ${reservation.reservationReference}\n` +
        `Open: ${this.frontendUrl}${this.applicantActionUrl(reservation, user)}`;
      await this.messengerService.sendMessage(
        senderId,
        user.id,
        content,
        reservation.tenantId,
        { senderRole: MessageRole.SYSTEM },
      );
      this.logger.log(`Parking messenger sent for ${reservation.reservationReference} → ${user.id}`);
    } catch (error) {
      this.logger.warn(`Parking messenger failed: ${(error as Error).message}`);
    }
  }

  private async resolveSystemSenderId(reservation: ParkingReservation, recipientId: string): Promise<string | null> {
    if (reservation.assignedToUserId && reservation.assignedToUserId !== recipientId) {
      return reservation.assignedToUserId;
    }
    const officerIds = await this.resolveResponsibleOfficerIds(reservation);
    return officerIds.find((id) => id !== recipientId) || null;
  }

  private async resolveResponsibleOfficerIds(reservation: ParkingReservation): Promise<string[]> {
    const ids = new Set<string>();
    if (reservation.assignedToUserId) ids.add(reservation.assignedToUserId);

    let facility = reservation.parkingFacility;
    if (!facility && reservation.parkingFacilityId) {
      facility = (await this.facilityRepository.findOne({
        where: { id: reservation.parkingFacilityId },
      })) || undefined;
    }

    if (facility?.parkingManagerId) {
      ids.add(facility.parkingManagerId);
    }

    if (!ids.size) return [];
    const officers = await this.userRepository.find({
      where: { id: In([...ids]), status: UserStatus.ACTIVE },
    });
    return officers
      .filter((officer) => officer.role === UserRole.PARKING_RESERVATION_MANAGER || officer.id === reservation.assignedToUserId)
      .map((officer) => officer.id);
  }

  private async notifyOfficers(
    reservation: ParkingReservation,
    opts: { type: NotificationType; title: string; message: string; actionUrl: string },
  ) {
    try {
      const officerIds = await this.resolveResponsibleOfficerIds(reservation);
      for (const officerId of officerIds) {
        await this.notifyUser(officerId, reservation, opts);
      }
    } catch (error) {
      this.logger.error(
        `Failed notifying parking officers for ${reservation.reservationReference}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async notifyUser(
    userId: string,
    reservation: ParkingReservation,
    opts: {
      type: NotificationType;
      title: string;
      message: string;
      actionUrl: string;
      channels?: NotificationChannel[];
      priority?: NotificationPriority;
    },
  ) {
    try {
      const notification = this.notificationRepository.create({
        tenantId: reservation.tenantId,
        recipientId: userId,
        notificationType: opts.type,
        category: NotificationCategory.PARKING,
        priority: opts.priority || NotificationPriority.NORMAL,
        title: opts.title,
        message: opts.message,
        channels: opts.channels || [NotificationChannel.IN_APP],
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        entityType: EntityType.PARKING_RESERVATION,
        entityId: reservation.id,
        actionUrl: opts.actionUrl,
        actionText: opts.priority === NotificationPriority.HIGH ? 'Review now' : undefined,
        requiresAction: opts.priority === NotificationPriority.HIGH,
        metadata: {
          reservationReference: reservation.reservationReference,
          status: reservation.status,
        },
      } as Partial<Notification>);
      const saved = await this.notificationRepository.save(notification);
      this.eventsGateway.emitNotification(userId, saved);
    } catch (error) {
      this.logger.warn(`Parking notification failed: ${(error as Error).message}`);
    }
  }

  private escape(value: string): string {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
