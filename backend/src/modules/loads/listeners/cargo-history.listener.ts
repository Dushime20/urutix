import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AuditAction,
  AuditEntityType,
} from '../../../entities/audit-event.entity';
import { LoadAuditService } from '../services/load-audit.service';

@Injectable()
export class CargoHistoryListener {
  private readonly logger = new Logger(CargoHistoryListener.name);

  constructor(private readonly loadAuditService: LoadAuditService) {}

  @OnEvent('cargo.broker.assigned')
  async handleBrokerAssigned(event: {
    loadId: string;
    brokerId: string;
    brokerName?: string;
    actorId: string;
    commissionRate?: number;
    commissionAmount?: number;
  }) {
    await this.loadAuditService.create({
      loadId: event.loadId,
      entityType: AuditEntityType.LOAD,
      entityId: event.loadId,
      action: AuditAction.ASSIGN,
      actorId: event.actorId || event.brokerId,
      actorName: event.brokerName,
      description: event.brokerName
        ? `Cargo assigned to broker ${event.brokerName}`
        : 'Cargo assigned to broker',
      metadata: {
        activityType: 'broker_assigned',
        brokerId: event.brokerId,
        commissionRate: event.commissionRate,
        commissionAmount: event.commissionAmount,
      },
    });
  }

  @OnEvent('cargo.broker.unassigned')
  async handleBrokerUnassigned(event: {
    loadId: string;
    previousBrokerId?: string;
    actorId: string;
  }) {
    await this.loadAuditService.create({
      loadId: event.loadId,
      entityType: AuditEntityType.LOAD,
      entityId: event.loadId,
      action: AuditAction.UPDATE,
      actorId: event.actorId,
      description: 'Broker unassigned from cargo',
      metadata: {
        activityType: 'broker_unassigned',
        previousBrokerId: event.previousBrokerId,
      },
    });
  }

  @OnEvent('bid.submitted')
  async handleBidSubmitted(event: {
    bidId: string;
    cargoId: string;
    truckOwnerId: string;
    bidDetails?: { amount?: number };
  }) {
    if (!event.cargoId) return;
    await this.loadAuditService.create({
      loadId: event.cargoId,
      entityType: AuditEntityType.BID,
      entityId: event.bidId,
      action: AuditAction.CREATE,
      actorId: event.truckOwnerId,
      description: event.bidDetails?.amount
        ? `Bid of ${event.bidDetails.amount} submitted`
        : 'Bid submitted',
      metadata: {
        activityType: 'bid_submitted',
        bidAmount: event.bidDetails?.amount,
      },
    });
  }

  @OnEvent('bid.accepted')
  async handleBidAccepted(event: {
    bidId: string;
    cargoId: string;
    truckOwnerId: string;
    cargoOwnerId?: string;
    bidDetails?: { amount?: number; cargoTitle?: string };
  }) {
    if (!event.cargoId) return;
    await this.loadAuditService.create({
      loadId: event.cargoId,
      entityType: AuditEntityType.BID,
      entityId: event.bidId,
      action: AuditAction.ASSIGN,
      actorId: event.cargoOwnerId || event.truckOwnerId,
      description: event.bidDetails?.amount
        ? `Winning bid of ${event.bidDetails.amount} accepted`
        : 'Bid accepted — cargo awarded',
      metadata: {
        activityType: 'bid_accepted',
        bidAmount: event.bidDetails?.amount,
        truckOwnerId: event.truckOwnerId,
      },
    });
  }

  @OnEvent('auction.winner.selected')
  async handleAuctionWinner(event: {
    auctionId?: string;
    winnerId?: string;
    winningBid?: number;
    cargoOwnerId?: string;
    loadId?: string;
  }) {
    // auction.winner.selected historically uses auctionId as loadId fallback
    const loadId = event.loadId || event.auctionId;
    if (!loadId || !event.winnerId) return;
    await this.loadAuditService.create({
      loadId,
      entityType: AuditEntityType.BID,
      action: AuditAction.ASSIGN,
      actorId: event.cargoOwnerId || event.winnerId,
      description: event.winningBid
        ? `Auction won with bid of ${event.winningBid}`
        : 'Auction winner selected',
      metadata: {
        activityType: 'bid_accepted',
        auction: true,
        amount: event.winningBid,
        winnerId: event.winnerId,
      },
      isAutomated: true,
      automationSource: 'auction',
    });
  }

  @OnEvent('trip.started')
  async handleTripStarted(event: {
    tripId: string;
    loadId?: string;
    driverId?: string;
    driverName?: string;
  }) {
    if (!event.loadId) {
      this.logger.warn(`trip.started missing loadId for trip ${event.tripId}`);
      return;
    }
    await this.loadAuditService.create({
      loadId: event.loadId,
      entityType: AuditEntityType.TRIP,
      entityId: event.tripId,
      action: AuditAction.START,
      actorId: event.driverId || 'system',
      actorName: event.driverName,
      description: 'Trip started',
      metadata: { activityType: 'trip_started', tripId: event.tripId },
    });
  }

  @OnEvent('trip.completed')
  async handleTripCompleted(event: {
    tripId: string;
    loadId?: string;
    driverId?: string;
    driverName?: string;
    completedAt?: Date;
  }) {
    if (!event.loadId) return;
    await this.loadAuditService.create({
      loadId: event.loadId,
      entityType: AuditEntityType.TRIP,
      entityId: event.tripId,
      action: AuditAction.DELIVER,
      actorId: event.driverId || 'system',
      actorName: event.driverName,
      description: 'Trip completed / cargo delivered',
      metadata: {
        activityType: 'delivered',
        tripId: event.tripId,
        completedAt: event.completedAt,
      },
    });
  }

  @OnEvent('cargo.loaded')
  async handleCargoLoaded(event: {
    loadId: string;
    driverId: string;
    driverName?: string;
    actorId?: string;
  }) {
    await this.loadAuditService.create({
      loadId: event.loadId,
      entityType: AuditEntityType.LOAD,
      entityId: event.loadId,
      action: AuditAction.STATUS_CHANGE,
      actorId: event.actorId || event.driverId,
      actorName: event.driverName,
      description: event.driverName
        ? `Cargo loaded by ${event.driverName}`
        : 'Cargo loaded',
      metadata: { activityType: 'loaded', status: 'LOADED' },
      changes: [
        {
          field: 'status',
          oldValue: 'ASSIGNED',
          newValue: 'LOADED',
          type: 'modified',
        },
      ],
    });
  }

  @OnEvent('cargo.inspection.started')
  async handleInspectionStarted(event: {
    loadId: string;
    actorId: string;
    actorName?: string;
    inspectionType?: string;
    inspectionId?: string;
  }) {
    await this.loadAuditService.create({
      loadId: event.loadId,
      entityType: AuditEntityType.LOAD,
      entityId: event.inspectionId || event.loadId,
      action: AuditAction.STATUS_CHANGE,
      actorId: event.actorId,
      actorName: event.actorName,
      description:
        event.inspectionType === 'TRUCK'
          ? 'Truck inspection started'
          : 'Cargo inspection started',
      metadata: {
        activityType: 'inspection_started',
        inspectionType: event.inspectionType,
      },
    });
  }

  @OnEvent('cargo.inspection.completed')
  async handleInspectionCompleted(event: {
    loadId: string;
    actorId: string;
    actorName?: string;
    inspectionType?: string;
    inspectionId?: string;
    decision?: string;
    status?: string;
  }) {
    const failed = event.decision === 'FAILED' || event.status === 'FAILED';
    await this.loadAuditService.create({
      loadId: event.loadId,
      entityType: AuditEntityType.LOAD,
      entityId: event.inspectionId || event.loadId,
      action: AuditAction.STATUS_CHANGE,
      actorId: event.actorId,
      actorName: event.actorName,
      description: failed
        ? 'Cargo inspection failed'
        : 'Cargo inspection completed',
      metadata: {
        activityType: failed ? 'inspection_failed' : 'inspection_submitted',
        inspectionType: event.inspectionType,
        decision: event.decision,
        status: event.status,
      },
    });
  }

  @OnEvent('cargo.inspection.approved')
  async handleInspectionApproved(event: {
    loadId: string;
    actorId: string;
    notes?: string;
  }) {
    await this.loadAuditService.create({
      loadId: event.loadId,
      entityType: AuditEntityType.LOAD,
      entityId: event.loadId,
      action: AuditAction.STATUS_CHANGE,
      actorId: event.actorId,
      description: 'Pre-trip inspection approved',
      reason: event.notes,
      metadata: { activityType: 'inspection_approved' },
    });
  }

  @OnEvent('cargo.receiver.assigned')
  async handleReceiverAssigned(event: {
    cargoId: string;
    receiverId: string;
    cargoOwnerId?: string;
    receiverDetails?: { cargoOwnerName?: string };
  }) {
    if (!event.cargoId) return;
    await this.loadAuditService.create({
      loadId: event.cargoId,
      entityType: AuditEntityType.LOAD,
      entityId: event.cargoId,
      action: AuditAction.ASSIGN,
      actorId: event.cargoOwnerId || event.receiverId,
      description: 'Receiver assigned to cargo',
      metadata: {
        activityType: 'receiver_assigned',
        receiverId: event.receiverId,
      },
    });
  }

  @OnEvent('load.v2.created')
  async handleLoadV2Created(event: {
    loadId: string;
    userId: string;
    tenantId?: string;
  }) {
    if (!event.loadId || !event.userId) return;
    await this.loadAuditService.create({
      loadId: event.loadId,
      entityType: AuditEntityType.LOAD,
      entityId: event.loadId,
      action: AuditAction.CREATE,
      actorId: event.userId,
      description: 'Cargo created',
      metadata: { activityType: 'created', source: 'loads-v2' },
    });
  }

  @OnEvent('load.v2.published')
  async handleLoadV2Published(event: {
    loadId: string;
    userId: string;
    tenantId?: string;
  }) {
    if (!event.loadId || !event.userId) return;
    await this.loadAuditService.create({
      loadId: event.loadId,
      entityType: AuditEntityType.LOAD,
      entityId: event.loadId,
      action: AuditAction.PUBLISH,
      actorId: event.userId,
      description: 'Cargo published and opened for matching',
      metadata: { activityType: 'published', source: 'loads-v2' },
    });
  }

  @OnEvent('load.v2.unpublished')
  async handleLoadV2Unpublished(event: { loadId: string; userId: string }) {
    if (!event.loadId || !event.userId) return;
    await this.loadAuditService.create({
      loadId: event.loadId,
      entityType: AuditEntityType.LOAD,
      entityId: event.loadId,
      action: AuditAction.STATUS_CHANGE,
      actorId: event.userId,
      description: 'Cargo unpublished',
      metadata: { activityType: 'status_change', status: 'unpublished' },
    });
  }

  @OnEvent('load.v2.updated')
  async handleLoadV2Updated(event: {
    loadId: string;
    userId: string;
    changes?: Record<string, any>;
  }) {
    if (!event.loadId || !event.userId) return;
    const changedFields = event.changes
      ? Object.keys(event.changes).filter(
          (k) => event.changes![k] !== undefined,
        )
      : [];
    const isStatusChange = changedFields.includes('status');
    const fieldChanges = changedFields.map((field) => ({
      field,
      oldValue: undefined,
      newValue: event.changes?.[field],
      type: 'modified' as const,
    }));

    await this.loadAuditService.create({
      loadId: event.loadId,
      entityType: AuditEntityType.LOAD,
      entityId: event.loadId,
      action: isStatusChange ? AuditAction.STATUS_CHANGE : AuditAction.UPDATE,
      actorId: event.userId,
      description: isStatusChange
        ? `Status changed to ${event.changes?.status}`
        : changedFields.length
          ? `Cargo updated (${changedFields.join(', ')})`
          : 'Cargo updated',
      after: event.changes,
      changes: fieldChanges.length ? fieldChanges : undefined,
      metadata: {
        activityType: isStatusChange ? 'status_change' : 'updated',
        changedFields,
        source: 'loads-v2',
      },
    });
  }

  @OnEvent('load.v2.truck_assigned')
  async handleLoadV2TruckAssigned(event: {
    loadId: string;
    truckId: string;
    userId: string;
  }) {
    if (!event.loadId || !event.userId) return;
    await this.loadAuditService.create({
      loadId: event.loadId,
      entityType: AuditEntityType.LOAD,
      entityId: event.loadId,
      action: AuditAction.ASSIGN,
      actorId: event.userId,
      description: `Truck ${event.truckId} assigned to cargo`,
      metadata: {
        activityType: 'carrier_assigned',
        truckId: event.truckId,
        source: 'loads-v2',
      },
    });
  }

  @OnEvent('load.v2.truck_unassigned')
  async handleLoadV2TruckUnassigned(event: {
    loadId: string;
    truckId?: string;
    userId: string;
  }) {
    if (!event.loadId || !event.userId) return;
    await this.loadAuditService.create({
      loadId: event.loadId,
      entityType: AuditEntityType.LOAD,
      entityId: event.loadId,
      action: AuditAction.UPDATE,
      actorId: event.userId,
      description: event.truckId
        ? `Truck ${event.truckId} unassigned from cargo`
        : 'Truck unassigned from cargo',
      metadata: {
        activityType: 'updated',
        truckId: event.truckId,
        source: 'loads-v2',
      },
    });
  }

  @OnEvent('load.v2.deleted')
  async handleLoadV2Deleted(event: { loadId: string; userId: string }) {
    if (!event.loadId || !event.userId) return;
    await this.loadAuditService.create({
      loadId: event.loadId,
      entityType: AuditEntityType.LOAD,
      entityId: event.loadId,
      action: AuditAction.DELETE,
      actorId: event.userId,
      description: 'Cargo deleted',
      metadata: { activityType: 'other', source: 'loads-v2' },
    });
  }

  @OnEvent('bid.withdrawn')
  async handleBidWithdrawn(event: {
    bidId: string;
    cargoId?: string;
    loadId?: string;
    truckOwnerId: string;
  }) {
    const loadId = event.cargoId || event.loadId;
    if (!loadId) return;
    await this.loadAuditService.create({
      loadId,
      entityType: AuditEntityType.BID,
      entityId: event.bidId,
      action: AuditAction.UPDATE,
      actorId: event.truckOwnerId,
      description: 'Bid withdrawn',
      metadata: { activityType: 'bid_withdrawn', bidId: event.bidId },
    });
  }

  @OnEvent('bid.rejected')
  @OnEvent('bid.auction.lost')
  async handleBidRejected(event: {
    bidId: string;
    cargoId?: string;
    loadId?: string;
    truckOwnerId: string;
    reason?: string;
  }) {
    const loadId = event.cargoId || event.loadId;
    if (!loadId) return;
    await this.loadAuditService.create({
      loadId,
      entityType: AuditEntityType.BID,
      entityId: event.bidId,
      action: AuditAction.UPDATE,
      actorId: event.truckOwnerId,
      description: event.reason || 'Bid rejected',
      reason: event.reason,
      metadata: { activityType: 'bid_rejected', bidId: event.bidId },
    });
  }

  @OnEvent('bid.auto-cancelled')
  async handleBidAutoCancelled(event: {
    bidId: string;
    cargoId?: string;
    loadId?: string;
    truckOwnerId?: string;
    actorUserId?: string;
    reason?: string;
  }) {
    const loadId = event.cargoId || event.loadId;
    const actorId = event.actorUserId || event.truckOwnerId;
    if (!loadId || !actorId) return;
    await this.loadAuditService.create({
      loadId,
      entityType: AuditEntityType.BID,
      entityId: event.bidId,
      action: AuditAction.CANCEL,
      actorId,
      description: event.reason || 'Bid auto-cancelled due to schedule conflict',
      reason: event.reason,
      metadata: {
        activityType: 'bid_rejected',
        bidId: event.bidId,
        auto: true,
      },
      isAutomated: true,
      automationSource: 'bid-conflict-resolution',
    });
  }
}
