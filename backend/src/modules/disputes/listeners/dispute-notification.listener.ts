import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { EventsGateway } from '../../events/events.gateway';
import { DisputeV2 } from '../../../entities/dispute-v2.entity';
import { User, UserRole, UserStatus } from '../../../entities/user.entity';
import { EmailService } from '../../auth/services/email.service';
import { SmsService } from '../../notifications/services/sms.service';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationChannel,
  NotificationStatus,
  EntityType,
} from '../../../entities/notification.entity';

@Injectable()
export class DisputeNotificationListener {
  private readonly logger = new Logger(DisputeNotificationListener.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly eventsGateway: EventsGateway,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') || ''
    ).replace(/\/$/, '');
  }

  private sendToParties(dispute: DisputeV2, event: string, data: any) {
    if (dispute.complainantUserId) {
      this.eventsGateway.emitToUser(dispute.complainantUserId, event, data);
    }
    if (dispute.respondentUserId) {
      this.eventsGateway.emitToUser(dispute.respondentUserId, event, data);
    }
    if (dispute.assignedToUserId) {
      this.eventsGateway.emitToUser(dispute.assignedToUserId, event, data);
    }
    this.eventsGateway.emitToAdmin(event, data);
  }

  private buildBase(dispute: DisputeV2) {
    return {
      disputeId: dispute.id,
      ticketNumber: dispute.ticketNumber ?? dispute.referenceNumber,
      referenceNumber: dispute.referenceNumber,
      title: dispute.title,
      status: dispute.status,
      priority: dispute.priority,
      category: dispute.category,
    };
  }

  private ticketLabel(dispute: DisputeV2): string {
    return dispute.ticketNumber ?? dispute.referenceNumber ?? dispute.id;
  }

  private actionUrlForRole(role: UserRole): string {
    if (role === UserRole.SUPER_ADMIN) return '/admin/support';
    if (role === UserRole.TENANT_ADMIN) return '/tenant-admin/support';
    return '/dashboard/disputes';
  }

  /**
   * Resolve tenant admins (same tenant) + all active super admins.
   */
  private async resolveAdminRecipients(tenantId: string): Promise<User[]> {
    const [tenantAdmins, superAdmins] = await Promise.all([
      this.userRepository.find({
        where: {
          tenantId,
          role: UserRole.TENANT_ADMIN,
          status: UserStatus.ACTIVE,
        },
      }),
      this.userRepository.find({
        where: {
          role: UserRole.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
        },
      }),
    ]);

    const byId = new Map<string, User>();
    for (const user of [...tenantAdmins, ...superAdmins]) {
      byId.set(user.id, user);
    }
    return Array.from(byId.values());
  }

  /**
   * Persist in-app notification and deliver email + SMS (phone) to an admin.
   */
  private async notifyAdminChannels(params: {
    admin: User;
    dispute: DisputeV2;
    title: string;
    message: string;
    shortMessage: string;
    notificationType: NotificationType;
    priority?: NotificationPriority;
    createdByEmail?: string;
  }): Promise<void> {
    const {
      admin,
      dispute,
      title,
      message,
      shortMessage,
      notificationType,
      priority = NotificationPriority.HIGH,
      createdByEmail,
    } = params;

    const actionUrl = this.actionUrlForRole(admin.role);
    const ticket = this.ticketLabel(dispute);

    try {
      const notification = this.notificationRepository.create({
        recipientId: admin.id,
        tenantId: dispute.tenantId,
        notificationType,
        category: NotificationCategory.DISPUTE,
        priority,
        title,
        message,
        shortMessage,
        entityType: EntityType.DISPUTE,
        entityId: dispute.id,
        channels: [
          NotificationChannel.IN_APP,
          NotificationChannel.EMAIL,
          NotificationChannel.SMS,
        ],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: true,
        actionUrl,
        actionText: 'Review Dispute',
        sentAt: new Date(),
        metadata: {
          disputeId: dispute.id,
          ticketNumber: ticket,
          referenceNumber: dispute.referenceNumber,
          category: dispute.category,
          priority: dispute.priority,
          status: dispute.status,
          createdByEmail,
          recipientEmail: admin.email,
          recipientPhone: admin.phone,
          recipientRole: admin.role,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: true,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const saved = await this.notificationRepository.save(notification);
      this.eventsGateway.emitNotification(admin.id, saved);
    } catch (error) {
      this.logger.error(
        `Failed in-app dispute notify for admin ${admin.id}: ${error.message}`,
        error.stack,
      );
    }

    if (admin.email) {
      try {
        const ctaUrl = this.frontendUrl
          ? `${this.frontendUrl}${actionUrl}`
          : actionUrl;
        await this.emailService.sendGenericEmail({
          to: admin.email,
          subject: `${title} — ${ticket}`,
          textBody: `${message}\n\nOpen: ${ctaUrl}`,
          htmlBody: `
            <p>${message}</p>
            <p><strong>Ticket:</strong> ${ticket}<br/>
            <strong>Priority:</strong> ${dispute.priority}<br/>
            <strong>Category:</strong> ${String(dispute.category).replace(/_/g, ' ')}</p>
            <p><a href="${ctaUrl}">Review dispute in UrutiX</a></p>
          `,
        });
      } catch (error) {
        this.logger.error(
          `Failed email dispute notify for ${admin.email}: ${error.message}`,
        );
      }
    }

    const phone = admin.phone?.trim();
    if (phone) {
      try {
        await this.smsService.sendSms(
          phone,
          `UrutiX: ${shortMessage} Ticket ${ticket}. Open support center to review.`,
        );
      } catch (error) {
        this.logger.error(
          `Failed SMS dispute notify for ${phone}: ${error.message}`,
        );
      }
    } else {
      this.logger.warn(
        `Admin ${admin.id} (${admin.role}) has no phone — SMS skipped for dispute ${dispute.id}`,
      );
    }
  }

  private async notifyAdminsOfDispute(params: {
    dispute: DisputeV2;
    title: string;
    message: string;
    shortMessage: string;
    notificationType: NotificationType;
    priority?: NotificationPriority;
    createdByEmail?: string;
  }): Promise<void> {
    const admins = await this.resolveAdminRecipients(params.dispute.tenantId);
    if (admins.length === 0) {
      this.logger.warn(
        `No tenant/super admins found to notify for dispute ${params.dispute.id}`,
      );
      return;
    }

    this.logger.log(
      `Notifying ${admins.length} admin(s) about dispute ${this.ticketLabel(params.dispute)} via in-app, email, SMS`,
    );

    await Promise.all(
      admins.map((admin) =>
        this.notifyAdminChannels({
          admin,
          dispute: params.dispute,
          title: params.title,
          message: params.message,
          shortMessage: params.shortMessage,
          notificationType: params.notificationType,
          priority: params.priority,
          createdByEmail: params.createdByEmail,
        }),
      ),
    );
  }

  @OnEvent('dispute.created')
  async onCreated(payload: { dispute: DisputeV2; createdBy: User }) {
    const { dispute, createdBy } = payload;
    const ticket = this.ticketLabel(dispute);

    this.sendToParties(dispute, 'support_ticket_created', {
      ...this.buildBase(dispute),
      message: `Support ticket ${ticket} has been submitted: "${dispute.title}"`,
      notificationTitle: 'New Support Ticket',
    });

    const reporter = createdBy?.email || 'a user';
    await this.notifyAdminsOfDispute({
      dispute,
      title: 'New Dispute Reported',
      message:
        `${reporter} reported a new dispute "${dispute.title}" ` +
        `(ticket ${ticket}). Priority: ${dispute.priority}. ` +
        `Please review and take action.`,
      shortMessage: `New dispute reported: ${dispute.title}`,
      notificationType: NotificationType.DISPUTE_REPORTED,
      priority:
        dispute.priority === 'CRITICAL'
          ? NotificationPriority.URGENT
          : NotificationPriority.HIGH,
      createdByEmail: createdBy?.email,
    });
  }

  @OnEvent('dispute.updated')
  onUpdated(payload: { dispute: DisputeV2; updatedBy: User }) {
    const { dispute } = payload;
    this.sendToParties(dispute, 'support_ticket_updated', {
      ...this.buildBase(dispute),
      message: `Ticket ${this.ticketLabel(dispute)} has been updated.`,
      notificationTitle: 'Ticket Updated',
    });
  }

  @OnEvent('dispute.assigned')
  onAssigned(payload: {
    dispute: DisputeV2;
    assignedTo: User;
    assignedBy: User;
  }) {
    const { dispute, assignedTo, assignedBy } = payload;
    this.eventsGateway.emitToUser(assignedTo.id, 'support_ticket_assigned', {
      ...this.buildBase(dispute),
      message: `Ticket ${this.ticketLabel(dispute)} has been assigned to you by ${assignedBy.email}.`,
      notificationTitle: 'Ticket Assigned to You',
    });
    if (dispute.complainantUserId) {
      this.eventsGateway.emitToUser(
        dispute.complainantUserId,
        'support_ticket_updated',
        {
          ...this.buildBase(dispute),
          message: `Your ticket ${this.ticketLabel(dispute)} has been assigned to a support officer.`,
          notificationTitle: 'Ticket Assigned',
        },
      );
    }
  }

  @OnEvent('dispute.message_added')
  onMessageAdded(payload: { disputeId: string; message: any; sender: User }) {
    const { disputeId, message, sender } = payload;
    this.eventsGateway.emitToAdmin('support_ticket_message', {
      disputeId,
      senderId: sender.id,
      senderEmail: sender.email,
      isInternal: message.isInternal,
      preview: message.message?.substring(0, 100),
      notificationTitle: 'New Reply on Ticket',
    });
  }

  @OnEvent('dispute.status_changed')
  onStatusChanged(payload: {
    dispute: DisputeV2;
    oldStatus: string;
    newStatus: string;
    changedBy: User;
  }) {
    const { dispute, oldStatus, newStatus } = payload;
    this.sendToParties(dispute, 'support_ticket_status_changed', {
      ...this.buildBase(dispute),
      oldStatus,
      newStatus,
      message: `Ticket ${this.ticketLabel(dispute)} status changed from ${oldStatus} to ${newStatus}.`,
      notificationTitle: 'Ticket Status Changed',
    });
  }

  @OnEvent('dispute.escalated')
  async onEscalated(payload: {
    dispute: DisputeV2;
    escalatedBy: User;
    reason: string;
  }) {
    const { dispute, reason } = payload;
    const ticket = this.ticketLabel(dispute);

    this.sendToParties(dispute, 'support_ticket_escalated', {
      ...this.buildBase(dispute),
      reason,
      message: `Ticket ${ticket} has been escalated. Reason: ${reason.replace(/_/g, ' ')}.`,
      notificationTitle: '⚠️ Ticket Escalated',
    });

    await this.notifyAdminsOfDispute({
      dispute,
      title: 'Dispute Escalated',
      message: `Dispute ${ticket} ("${dispute.title}") was escalated. Reason: ${reason.replace(/_/g, ' ')}. Immediate review recommended.`,
      shortMessage: `Dispute escalated: ${ticket}`,
      notificationType: NotificationType.DISPUTE_ESCALATED,
      priority: NotificationPriority.URGENT,
    });
  }

  @OnEvent('dispute.resolved')
  onResolved(payload: {
    dispute: DisputeV2;
    resolver: User;
    decision: string;
  }) {
    const { dispute, decision } = payload;
    this.sendToParties(dispute, 'support_ticket_resolved', {
      ...this.buildBase(dispute),
      decision,
      message: `Ticket ${this.ticketLabel(dispute)} has been resolved. Decision: ${decision.replace(/_/g, ' ')}.`,
      notificationTitle: '✅ Ticket Resolved',
    });
  }

  @OnEvent('dispute.closed')
  onClosed(payload: { dispute: DisputeV2; closedBy: User }) {
    const { dispute } = payload;
    this.sendToParties(dispute, 'support_ticket_closed', {
      ...this.buildBase(dispute),
      message: `Ticket ${this.ticketLabel(dispute)} has been closed.`,
      notificationTitle: 'Ticket Closed',
    });
  }

  @OnEvent('dispute.reopened')
  onReopened(payload: {
    dispute: DisputeV2;
    reopenedBy: User;
    reason: string;
  }) {
    const { dispute, reason } = payload;
    this.sendToParties(dispute, 'support_ticket_updated', {
      ...this.buildBase(dispute),
      reason,
      message: `Ticket ${this.ticketLabel(dispute)} has been reopened${reason ? `: ${reason}` : ''}.`,
      notificationTitle: 'Ticket Reopened',
    });
  }

  @OnEvent('dispute.evidence_uploaded')
  onEvidenceUploaded(payload: {
    disputeId: string;
    attachment: any;
    uploader: User;
  }) {
    this.eventsGateway.emitToAdmin('support_ticket_updated', {
      disputeId: payload.disputeId,
      fileName: payload.attachment.fileName,
      message: `New evidence uploaded: ${payload.attachment.fileName}`,
      notificationTitle: 'Evidence Uploaded',
    });
  }

  @OnEvent('dispute.sla_breached')
  async onSlaBreached(payload: {
    disputeId: string;
    tenantId: string;
    type: string;
    ticket: string;
  }) {
    this.eventsGateway.emitToAdmin('support_sla_breached', {
      disputeId: payload.disputeId,
      ticket: payload.ticket,
      type: payload.type,
      message: `SLA ${payload.type === 'first_response' ? 'first response' : 'resolution'} breached for ticket ${payload.ticket}.`,
      notificationTitle: '🚨 SLA Breach',
    });

    const disputeStub = {
      id: payload.disputeId,
      tenantId: payload.tenantId,
      ticketNumber: payload.ticket,
      referenceNumber: payload.ticket,
      title: `SLA breach — ${payload.ticket}`,
      priority: 'CRITICAL',
      category: 'OTHER',
      status: 'OPEN',
    } as unknown as DisputeV2;

    await this.notifyAdminsOfDispute({
      dispute: disputeStub,
      title: 'Dispute SLA Breached',
      message: `SLA ${payload.type === 'first_response' ? 'first response' : 'resolution'} breached for ticket ${payload.ticket}. Please respond immediately.`,
      shortMessage: `SLA breached: ${payload.ticket}`,
      notificationType: NotificationType.DISPUTE_SLA_BREACHED,
      priority: NotificationPriority.CRITICAL,
    });
  }
}
