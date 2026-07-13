import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventsGateway } from '../../events/events.gateway';
import { DisputeV2 } from '../../../entities/dispute-v2.entity';
import { User } from '../../../entities/user.entity';

@Injectable()
export class DisputeNotificationListener {
  constructor(private readonly eventsGateway: EventsGateway) {}

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
      disputeId:      dispute.id,
      ticketNumber:   dispute.ticketNumber ?? dispute.referenceNumber,
      referenceNumber: dispute.referenceNumber,
      title:          dispute.title,
      status:         dispute.status,
      priority:       dispute.priority,
      category:       dispute.category,
    };
  }

  @OnEvent('dispute.created')
  onCreated(payload: { dispute: DisputeV2; createdBy: User }) {
    const { dispute } = payload;
    this.sendToParties(dispute, 'support_ticket_created', {
      ...this.buildBase(dispute),
      message: `Support ticket ${dispute.ticketNumber ?? dispute.referenceNumber} has been submitted: "${dispute.title}"`,
      notificationTitle: 'New Support Ticket',
    });
  }

  @OnEvent('dispute.updated')
  onUpdated(payload: { dispute: DisputeV2; updatedBy: User }) {
    const { dispute } = payload;
    this.sendToParties(dispute, 'support_ticket_updated', {
      ...this.buildBase(dispute),
      message: `Ticket ${dispute.ticketNumber ?? dispute.referenceNumber} has been updated.`,
      notificationTitle: 'Ticket Updated',
    });
  }

  @OnEvent('dispute.assigned')
  onAssigned(payload: { dispute: DisputeV2; assignedTo: User; assignedBy: User }) {
    const { dispute, assignedTo, assignedBy } = payload;
    // Notify the assignee
    this.eventsGateway.emitToUser(assignedTo.id, 'support_ticket_assigned', {
      ...this.buildBase(dispute),
      message: `Ticket ${dispute.ticketNumber ?? dispute.referenceNumber} has been assigned to you by ${assignedBy.email}.`,
      notificationTitle: 'Ticket Assigned to You',
    });
    // Notify complainant
    if (dispute.complainantUserId) {
      this.eventsGateway.emitToUser(dispute.complainantUserId, 'support_ticket_updated', {
        ...this.buildBase(dispute),
        message: `Your ticket ${dispute.ticketNumber ?? dispute.referenceNumber} has been assigned to a support officer.`,
        notificationTitle: 'Ticket Assigned',
      });
    }
  }

  @OnEvent('dispute.message_added')
  onMessageAdded(payload: { disputeId: string; message: any; sender: User }) {
    const { disputeId, message, sender } = payload;
    // Broad emit – disputeId used for client-side filtering
    this.eventsGateway.emitToAdmin('support_ticket_message', {
      disputeId,
      senderId:  sender.id,
      senderEmail: sender.email,
      isInternal: message.isInternal,
      preview:   message.message?.substring(0, 100),
      notificationTitle: 'New Reply on Ticket',
    });
  }

  @OnEvent('dispute.status_changed')
  onStatusChanged(payload: { dispute: DisputeV2; oldStatus: string; newStatus: string; changedBy: User }) {
    const { dispute, oldStatus, newStatus } = payload;
    this.sendToParties(dispute, 'support_ticket_status_changed', {
      ...this.buildBase(dispute),
      oldStatus,
      newStatus,
      message: `Ticket ${dispute.ticketNumber ?? dispute.referenceNumber} status changed from ${oldStatus} to ${newStatus}.`,
      notificationTitle: 'Ticket Status Changed',
    });
  }

  @OnEvent('dispute.escalated')
  onEscalated(payload: { dispute: DisputeV2; escalatedBy: User; reason: string }) {
    const { dispute, reason } = payload;
    this.sendToParties(dispute, 'support_ticket_escalated', {
      ...this.buildBase(dispute),
      reason,
      message: `Ticket ${dispute.ticketNumber ?? dispute.referenceNumber} has been escalated. Reason: ${reason.replace(/_/g, ' ')}.`,
      notificationTitle: '⚠️ Ticket Escalated',
    });
  }

  @OnEvent('dispute.resolved')
  onResolved(payload: { dispute: DisputeV2; resolver: User; decision: string }) {
    const { dispute, decision } = payload;
    this.sendToParties(dispute, 'support_ticket_resolved', {
      ...this.buildBase(dispute),
      decision,
      message: `Ticket ${dispute.ticketNumber ?? dispute.referenceNumber} has been resolved. Decision: ${decision.replace(/_/g, ' ')}.`,
      notificationTitle: '✅ Ticket Resolved',
    });
  }

  @OnEvent('dispute.closed')
  onClosed(payload: { dispute: DisputeV2; closedBy: User }) {
    const { dispute } = payload;
    this.sendToParties(dispute, 'support_ticket_closed', {
      ...this.buildBase(dispute),
      message: `Ticket ${dispute.ticketNumber ?? dispute.referenceNumber} has been closed.`,
      notificationTitle: 'Ticket Closed',
    });
  }

  @OnEvent('dispute.reopened')
  onReopened(payload: { dispute: DisputeV2; reopenedBy: User; reason: string }) {
    const { dispute, reason } = payload;
    this.sendToParties(dispute, 'support_ticket_updated', {
      ...this.buildBase(dispute),
      reason,
      message: `Ticket ${dispute.ticketNumber ?? dispute.referenceNumber} has been reopened${reason ? `: ${reason}` : ''}.`,
      notificationTitle: 'Ticket Reopened',
    });
  }

  @OnEvent('dispute.evidence_uploaded')
  onEvidenceUploaded(payload: { disputeId: string; attachment: any; uploader: User }) {
    this.eventsGateway.emitToAdmin('support_ticket_updated', {
      disputeId:  payload.disputeId,
      fileName:   payload.attachment.fileName,
      message:    `New evidence uploaded: ${payload.attachment.fileName}`,
      notificationTitle: 'Evidence Uploaded',
    });
  }

  @OnEvent('dispute.sla_breached')
  onSlaBreached(payload: { disputeId: string; tenantId: string; type: string; ticket: string }) {
    this.eventsGateway.emitToAdmin('support_sla_breached', {
      disputeId: payload.disputeId,
      ticket:    payload.ticket,
      type:      payload.type,
      message:   `SLA ${payload.type === 'first_response' ? 'first response' : 'resolution'} breached for ticket ${payload.ticket}.`,
      notificationTitle: '🚨 SLA Breach',
    });
  }
}
