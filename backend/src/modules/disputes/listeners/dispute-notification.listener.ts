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
    // Also notify all admins
    this.eventsGateway.emitToAdmin(event, data);
  }

  @OnEvent('dispute.created')
  onCreated(payload: { dispute: DisputeV2; createdBy: User }) {
    const { dispute } = payload;
    const data = {
      disputeId: dispute.id,
      referenceNumber: dispute.referenceNumber,
      title: dispute.title,
      status: dispute.status,
      category: dispute.category,
    };
    this.sendToParties(dispute, 'dispute_created', {
      title: 'New Dispute Raised',
      message: `Dispute ${dispute.referenceNumber} has been created: ${dispute.title}`,
      ...data,
    });
  }

  @OnEvent('dispute.updated')
  onUpdated(payload: { dispute: DisputeV2; updatedBy: User }) {
    const { dispute } = payload;
    this.sendToParties(dispute, 'dispute_updated', {
      disputeId: dispute.id,
      referenceNumber: dispute.referenceNumber,
      title: 'Dispute Updated',
      message: `Dispute ${dispute.referenceNumber} has been updated.`,
    });
  }

  @OnEvent('dispute.message_added')
  onMessageAdded(payload: { disputeId: string; message: any; sender: User }) {
    // We need to re-fetch parties — for now use disputeId and emit broadly
    this.eventsGateway.emitToAdmin('dispute_message_added', {
      disputeId: payload.disputeId,
      senderId: payload.sender.id,
      message: payload.message.message,
    });
  }

  @OnEvent('dispute.status_changed')
  onStatusChanged(payload: { dispute: DisputeV2; oldStatus: string; newStatus: string; changedBy: User }) {
    const { dispute, oldStatus, newStatus } = payload;
    this.sendToParties(dispute, 'dispute_updated', {
      disputeId: dispute.id,
      referenceNumber: dispute.referenceNumber,
      title: 'Dispute Status Changed',
      message: `Dispute ${dispute.referenceNumber} status changed from ${oldStatus} to ${newStatus}.`,
      oldStatus,
      newStatus,
    });
  }

  @OnEvent('dispute.resolved')
  onResolved(payload: { dispute: DisputeV2; resolver: User; decision: string }) {
    const { dispute, decision } = payload;
    this.sendToParties(dispute, 'dispute_resolved', {
      disputeId: dispute.id,
      referenceNumber: dispute.referenceNumber,
      title: 'Dispute Resolved',
      message: `Dispute ${dispute.referenceNumber} has been resolved. Decision: ${decision.replace(/_/g, ' ')}.`,
      decision,
    });
  }

  @OnEvent('dispute.closed')
  onClosed(payload: { dispute: DisputeV2; closedBy: User }) {
    const { dispute } = payload;
    this.sendToParties(dispute, 'dispute_closed', {
      disputeId: dispute.id,
      referenceNumber: dispute.referenceNumber,
      title: 'Dispute Closed',
      message: `Dispute ${dispute.referenceNumber} has been closed.`,
    });
  }

  @OnEvent('dispute.reopened')
  onReopened(payload: { dispute: DisputeV2; reopenedBy: User; reason: string }) {
    const { dispute, reason } = payload;
    this.sendToParties(dispute, 'dispute_updated', {
      disputeId: dispute.id,
      referenceNumber: dispute.referenceNumber,
      title: 'Dispute Reopened',
      message: `Dispute ${dispute.referenceNumber} has been reopened. Reason: ${reason}`,
    });
  }

  @OnEvent('dispute.evidence_uploaded')
  onEvidenceUploaded(payload: { disputeId: string; attachment: any; uploader: User }) {
    this.eventsGateway.emitToAdmin('dispute_updated', {
      disputeId: payload.disputeId,
      title: 'New Evidence Uploaded',
      message: `New evidence uploaded: ${payload.attachment.fileName}`,
    });
  }
}
