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
      this.configService.get<string>('FRONTEND_URL') || ''
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
      subject: `Reservation submitted — ${reservation.reservationReference}`,
      title: 'Reservation Request Submitted',
      body: `Your truck parking reservation request has been successfully submitted. Our parking team will review availability and confirm the next steps.`,
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
      body: `Our parking team needs more information for reservation ${reservation.reservationReference}.<br/><br/><strong>Requested:</strong> ${this.escape(reservation.informationRequested || '')}`,
      ctaLabel: 'Respond to request',
      ctaUrl: `${this.frontendUrl}/parking-reservation/lookup`,
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
      body: `Your truck parking reservation ${reservation.reservationReference} has been approved.`,
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
      body: `We were unable to approve reservation ${reservation.reservationReference}. ${reservation.rejectionReason ? `Reason: ${this.escape(reservation.rejectionReason)}` : 'Please contact the parking team for next steps.'}`,
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
      body: `Reservation ${reservation.reservationReference} has been cancelled.`,
    });
  }

  private summary(reservation: ParkingReservation): string {
    return `
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;font-size:14px;color:#334155;">
        <tr><td style="padding:6px 0;"><strong>Reference</strong></td><td>${this.escape(reservation.reservationReference)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Company</strong></td><td>${this.escape(reservation.companyName)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Requested date</strong></td><td>${this.escape(String(reservation.requestedStartDate))}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Truck spaces</strong></td><td>${reservation.truckSpacesRequested}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Contract duration</strong></td><td>${reservation.contractMonths} month(s)</td></tr>
        <tr><td style="padding:6px 0;"><strong>Status</strong></td><td>${this.escape(reservation.status.replace(/_/g, ' '))}</td></tr>
      </table>
    `;
  }

  private async emailApplicant(
    reservation: ParkingReservation,
    opts: { subject: string; title: string; body: string; ctaLabel?: string; ctaUrl?: string },
  ) {
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;color:#0f172a;line-height:1.5;">
        <h2 style="color:#345E85;font-size:20px;">${opts.title}</h2>
        <p>${opts.body}</p>
        ${this.summary(reservation)}
        ${
          opts.ctaLabel && opts.ctaUrl
            ? `<p><a href="${opts.ctaUrl}" style="display:inline-block;background:#345E85;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;">${opts.ctaLabel}</a></p>`
            : ''
        }
      </div>
    `;
    try {
      await this.emailService.sendGenericEmail({
        to: reservation.email,
        subject: opts.subject,
        htmlBody: html,
        textBody: `${opts.title}\n\n${opts.body.replace(/<[^>]+>/g, '')}\n\nReference: ${reservation.reservationReference}`,
        fromName: 'Nova Parking 365',
      });
    } catch (error) {
      this.logger.warn(`Parking email failed: ${(error as Error).message}`);
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
