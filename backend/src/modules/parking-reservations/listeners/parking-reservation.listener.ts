import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { In, Repository } from 'typeorm';
import { EventsGateway } from '../../events/events.gateway';
import { User, UserRole, UserStatus } from '../../../entities/user.entity';
import { EmailService } from '../../auth/services/email.service';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationChannel,
  NotificationStatus,
  EntityType,
} from '../../../entities/notification.entity';
import { ParkingReservation } from '../../../entities/parking-reservation.entity';

@Injectable()
export class ParkingReservationListener {
  private readonly logger = new Logger(ParkingReservationListener.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly eventsGateway: EventsGateway,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') || 'https://urutix.com'
    ).replace(/\/$/, '');
  }

  @OnEvent('parking.reservation.created')
  async onCreated(payload: { reservation: ParkingReservation }) {
    const { reservation } = payload;
    await this.notifyOfficers(reservation, {
      type: NotificationType.PARKING_RESERVATION_SUBMITTED,
      title: 'New parking reservation',
      message: `${reservation.companyName} submitted ${reservation.reservationReference} (${reservation.truckSpacesRequested} spaces).`,
      actionUrl: `/dashboard/parking/reservations/${reservation.id}`,
    });
    await this.emailApplicant(reservation, {
      subject: `Your parking reservation reference: ${reservation.reservationReference}`,
      title: 'Reservation Request Submitted',
      body: `Thank you for submitting your truck parking reservation. Save the reference below — you will need it to track status, receive updates, and respond if our parking team needs more information.`,
    });
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
    await this.notifyApplicantIfKnown(reservation, {
      type: NotificationType.PARKING_RESERVATION_SUBMITTED,
      title: 'Parking reservation under review',
      message: `${reservation.reservationReference} is now under review.`,
      actionUrl: `/dashboard/parking-reservations/${reservation.id}`,
    });
    await this.emailApplicant(reservation, {
      subject: `Reservation under review — ${reservation.reservationReference}`,
      title: 'Reservation Under Review',
      body: `Our parking team has started reviewing reservation ${this.escape(reservation.reservationReference)}. We will email you as soon as there is an update.`,
    });
  }

  @OnEvent('parking.reservation.information_requested')
  async onInfoRequested(payload: { reservation: ParkingReservation }) {
    const { reservation } = payload;
    await this.notifyApplicantIfKnown(reservation, {
      type: NotificationType.PARKING_RESERVATION_INFO_REQUIRED,
      title: 'Additional information required',
      message: `More information is needed for ${reservation.reservationReference}.`,
      actionUrl: `/dashboard/parking-reservations/${reservation.id}`,
    });
    await this.emailApplicant(reservation, {
      subject: `Information needed — ${reservation.reservationReference}`,
      title: 'Additional Information Required',
      body: `Our parking team needs more information for reservation ${this.escape(reservation.reservationReference)}.<br/><br/><strong>Requested:</strong> ${this.escape(reservation.informationRequested || '')}`,
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
    await this.emailApplicant(reservation, {
      subject: `We received your response — ${reservation.reservationReference}`,
      title: 'Response Received',
      body: `Thank you. We received the additional information for reservation ${this.escape(reservation.reservationReference)} and our parking team will continue the review.`,
    });
  }

  @OnEvent('parking.reservation.approved')
  async onApproved(payload: { reservation: ParkingReservation }) {
    const { reservation } = payload;
    await this.notifyApplicantIfKnown(reservation, {
      type: NotificationType.PARKING_RESERVATION_APPROVED,
      title: 'Parking reservation approved',
      message: `${reservation.reservationReference} has been approved.`,
      actionUrl: `/dashboard/parking-reservations/${reservation.id}`,
    });
    await this.emailApplicant(reservation, {
      subject: `Reservation approved — ${reservation.reservationReference}`,
      title: 'Reservation Approved',
      body: `Your truck parking reservation ${this.escape(reservation.reservationReference)} has been approved.`,
    });
  }

  @OnEvent('parking.reservation.rejected')
  async onRejected(payload: { reservation: ParkingReservation }) {
    const { reservation } = payload;
    await this.notifyApplicantIfKnown(reservation, {
      type: NotificationType.PARKING_RESERVATION_REJECTED,
      title: 'Parking reservation rejected',
      message: `${reservation.reservationReference} was not approved.`,
      actionUrl: `/dashboard/parking-reservations/${reservation.id}`,
    });
    await this.emailApplicant(reservation, {
      subject: `Reservation update — ${reservation.reservationReference}`,
      title: 'Reservation Rejected',
      body: `We were unable to approve reservation ${this.escape(reservation.reservationReference)}. ${reservation.rejectionReason ? `Reason: ${this.escape(reservation.rejectionReason)}` : 'Please contact the parking team for next steps.'}`,
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
    await this.notifyApplicantIfKnown(reservation, {
      type: NotificationType.PARKING_RESERVATION_CANCELLED,
      title: 'Parking reservation cancelled',
      message: `${reservation.reservationReference} was cancelled.`,
      actionUrl: `/dashboard/parking-reservations/${reservation.id}`,
    });
    await this.emailApplicant(reservation, {
      subject: `Reservation cancelled — ${reservation.reservationReference}`,
      title: 'Reservation Cancelled',
      body: `Reservation ${this.escape(reservation.reservationReference)} has been cancelled.`,
    });
  }

  private lookupUrl() {
    return `${this.frontendUrl}/parking-reservation/lookup`;
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
        <tr><td style="padding:6px 0;"><strong>Requested date</strong></td><td>${this.escape(String(reservation.requestedStartDate).slice(0, 10))}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Truck spaces</strong></td><td>${reservation.truckSpacesRequested}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Contract duration</strong></td><td>${reservation.contractMonths} month(s)</td></tr>
        <tr><td style="padding:6px 0;"><strong>Status</strong></td><td>${this.escape(reservation.status.replace(/_/g, ' '))}</td></tr>
      </table>
    `;
  }

  private async emailApplicant(
    reservation: ParkingReservation,
    opts: { subject: string; title: string; body: string },
  ) {
    const greeting = reservation.driverFirstName
      ? `Hello ${this.escape(reservation.driverFirstName)},`
      : 'Hello,';
    const lookupUrl = this.lookupUrl();
    const result = await this.emailService.sendParkingReservationEmail({
      to: reservation.email,
      subject: opts.subject,
      title: opts.title,
      greeting,
      body: opts.body,
      extraHtml: `${this.referenceBox(reservation)}${this.summary(reservation)}`,
      ctaLabel: 'Track your reservation',
      ctaUrl: lookupUrl,
      note: 'Use your reservation reference and this email address to look up status at any time. We will also email you whenever the status changes.',
      textBody: [
        opts.title,
        '',
        opts.body.replace(/<[^>]+>/g, ' '),
        '',
        `Reservation Reference: ${reservation.reservationReference}`,
        `Company: ${reservation.companyName}`,
        `Requested date: ${String(reservation.requestedStartDate).slice(0, 10)}`,
        `Truck spaces: ${reservation.truckSpacesRequested}`,
        `Contract duration: ${reservation.contractMonths} month(s)`,
        `Status: ${reservation.status.replace(/_/g, ' ')}`,
        '',
        `Track your reservation: ${lookupUrl}`,
      ].join('\n'),
    });
    if (!result.success) {
      this.logger.error(
        `Parking email failed for ${reservation.reservationReference} → ${reservation.email}: ${result.error}`,
      );
    }
  }

  private async notifyOfficers(
    reservation: ParkingReservation,
    opts: { type: NotificationType; title: string; message: string; actionUrl: string },
  ) {
    const officers = await this.userRepository.find({
      where: {
        role: In([
          UserRole.PARKING_RESERVATION_MANAGER,
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
        ]),
        status: UserStatus.ACTIVE,
      },
    });
    for (const officer of officers) {
      await this.notifyUser(officer.id, reservation, opts);
    }
  }

  private async notifyApplicantIfKnown(
    reservation: ParkingReservation,
    opts: { type: NotificationType; title: string; message: string; actionUrl: string },
  ) {
    if (reservation.submittedByUserId) {
      await this.notifyUser(reservation.submittedByUserId, reservation, opts);
    }
  }

  private async notifyUser(
    userId: string,
    reservation: ParkingReservation,
    opts: { type: NotificationType; title: string; message: string; actionUrl: string },
  ) {
    try {
      const notification = this.notificationRepository.create({
        tenantId: reservation.tenantId,
        recipientId: userId,
        notificationType: opts.type,
        category: NotificationCategory.PARKING,
        priority: NotificationPriority.NORMAL,
        title: opts.title,
        message: opts.message,
        channels: [NotificationChannel.IN_APP],
        status: NotificationStatus.SENT,
        entityType: EntityType.PARKING_RESERVATION,
        entityId: reservation.id,
        actionUrl: opts.actionUrl,
        metadata: {
          reservationReference: reservation.reservationReference,
          status: reservation.status,
        },
      } as Partial<Notification>);
      const saved = await this.notificationRepository.save(notification);
      this.eventsGateway.emitToUser(userId, 'notification', saved);
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
