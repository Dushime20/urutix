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
}
