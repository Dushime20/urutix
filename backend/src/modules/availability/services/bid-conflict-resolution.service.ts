import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Bid, BidStatus } from '../../../entities/bid.entity';
import { Load } from '../../../entities/load.entity';
import { LoadMatch, MatchStatus } from '../../../entities/load-match.entity';
import { AvailabilityService } from '../availability.service';
import { NotificationService } from '../../notifications/notification.service';
import { ActivityLogService } from '../../../services/activity-log.service';
import {
  NotificationType,
  NotificationCategory,
  NotificationChannel,
  EntityType,
  NotificationPriority,
} from '../../../entities/notification.entity';

export enum CommitmentTrigger {
  BID_ACCEPTED = 'BID_ACCEPTED',
  SMART_MATCH_CONFIRMED = 'SMART_MATCH_CONFIRMED',
}

export interface CommitmentContext {
  trigger: CommitmentTrigger;
  truckId: string;
  truckOwnerId: string;
  tenantId: string;
  confirmedLoadId: string;
  pickupDateTime: Date;
  deliveryDateTime: Date;
  excludeBidId?: string;
  excludeMatchId?: string;
  tripId?: string;
  assignmentId?: string;
  actorUserId?: string;
  confirmedCargoTitle?: string;
  driverId?: string | null;
}

export interface ScheduleWindow {
  pickupDateTime: Date;
  deliveryDateTime: Date;
}

export interface ConflictResolutionResult {
  cancelledBids: Bid[];
  rejectedAuctionBids: Bid[];
  expiredMatches: LoadMatch[];
}

/**
 * Central engine for truck schedule conflict detection and automatic bid/match resolution.
 * Used by Auction Bidding and Smart Matching to prevent double-booking.
 */
@Injectable()
export class BidConflictResolutionService {
  private readonly logger = new Logger(BidConflictResolutionService.name);

  constructor(
    @InjectRepository(Bid)
    private readonly bidRepository: Repository<Bid>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(LoadMatch)
    private readonly loadMatchRepository: Repository<LoadMatch>,
    private readonly availabilityService: AvailabilityService,
    private readonly notificationService: NotificationService,
    private readonly activityLogService: ActivityLogService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Standard interval overlap: any intersection of pickup/delivery windows. */
  schedulesOverlap(
    pickupA: Date,
    deliveryA: Date,
    pickupB: Date,
    deliveryB: Date,
  ): boolean {
    const aStart = new Date(pickupA).getTime();
    const aEnd = new Date(deliveryA).getTime();
    const bStart = new Date(pickupB).getTime();
    const bEnd = new Date(deliveryB).getTime();
    return aStart < bEnd && bStart < aEnd;
  }

  /** Resolve pickup/delivery window from load with optional bid overrides. */
  resolveScheduleWindow(load: Load, bid?: Bid | null): ScheduleWindow {
    const pickupDateTime = new Date(
      load.pickupDate ||
        bid?.proposedPickupDate ||
        new Date(Date.now() + 24 * 60 * 60 * 1000),
    );
    const deliveryDateTime = new Date(
      load.deliveryDate ||
        bid?.proposedDeliveryDate ||
        new Date(pickupDateTime.getTime() + 7 * 24 * 60 * 60 * 1000),
    );
    return { pickupDateTime, deliveryDateTime };
  }

  /**
   * Pre-commitment validation — throws if truck/driver is already committed
   * to an overlapping shipment (trips, reservations, accepted bids, confirmed matches).
   */
  async assertTruckAvailableForCommitment(ctx: CommitmentContext): Promise<void> {
    await this.availabilityService.assertNoConflict({
      truckId: ctx.truckId,
      driverId: ctx.driverId || undefined,
      pickupDateTime: ctx.pickupDateTime,
      deliveryDateTime: ctx.deliveryDateTime,
      tenantId: ctx.tenantId,
    });

    const conflictingAcceptedBids = await this.findConflictingAcceptedBids(ctx);
    if (conflictingAcceptedBids.length > 0) {
      throw new ConflictException(
        'This truck is already committed to another shipment with an overlapping schedule.',
      );
    }

    const conflictingMatches = await this.findConflictingMatches(ctx);
    if (conflictingMatches.length > 0) {
      throw new ConflictException(
        'This truck is already committed to another Smart Matching assignment with an overlapping schedule.',
      );
    }
  }

  /**
   * Post-commitment cleanup: cancel overlapping bids on other loads,
   * expire conflicting smart matches, and notify all affected parties.
   */
  async resolveAfterCommitment(
    ctx: CommitmentContext,
  ): Promise<ConflictResolutionResult> {
    const cancelledBids = await this.cancelConflictingBids(ctx);
    const expiredMatches = await this.expireConflictingMatches(ctx);

    if (
      cancelledBids.length > 0 &&
      ctx.trigger === CommitmentTrigger.SMART_MATCH_CONFIRMED
    ) {
      await this.notifyTruckOwnerOfCancelledBids(ctx, cancelledBids);
    }

    return {
      cancelledBids,
      rejectedAuctionBids: [],
      expiredMatches,
    };
  }

  /**
   * Reject all remaining pending bids on the winning auction and notify losers.
   */
  async rejectRemainingAuctionBids(
    loadId: string,
    winningBidId: string,
    tenantId: string,
    cargoTitle?: string,
    actorUserId?: string,
  ): Promise<Bid[]> {
    const pendingBids = await this.bidRepository.find({
      where: {
        loadId,
        status: BidStatus.PENDING,
        id: Not(winningBidId),
      },
      relations: ['load'],
    });

    if (pendingBids.length === 0) return [];

    for (const bid of pendingBids) {
      bid.status = BidStatus.REJECTED;
      bid.bidDetails = {
        ...bid.bidDetails,
        rejectionReason:
          'Your bid was not selected because another truck was chosen for this shipment. Thank you for participating in the auction.',
      };
      await this.bidRepository.save(bid);
      await this.activityLogService.logActivity({
        userId: actorUserId,
        action: 'BID_AUTO_REJECTED',
        resource: 'bids',
        resourceId: bid.id,
        details: {
          triggerEvent: 'AUCTION_WINNER_SELECTED',
          loadId,
          winningBidId,
          truckOwnerId: bid.truckOwnerId,
          reason: 'Another bid was selected for this auction.',
          actor: actorUserId ? 'USER' : 'SYSTEM',
        },
      });

      this.eventEmitter.emit('bid.auction.lost', {
        bidId: bid.id,
        truckOwnerId: bid.truckOwnerId,
        loadId,
        tenantId,
        cargoTitle: cargoTitle || bid.load?.title,
        reason:
          'Your bid was not selected because another truck was chosen for this shipment. Thank you for participating in the auction.',
      });
    }

    return pendingBids;
  }

  private async cancelConflictingBids(ctx: CommitmentContext): Promise<Bid[]> {
    const candidateBids = await this.bidRepository.find({
      where: {
        truckOwnerId: ctx.truckOwnerId,
        tenantId: ctx.tenantId,
        status: BidStatus.PENDING,
        loadId: Not(ctx.confirmedLoadId),
      },
      relations: ['load'],
    });

    const conflicting = candidateBids.filter((bid) => {
      if (ctx.excludeBidId && bid.id === ctx.excludeBidId) return false;
      const bidTruckId = bid.bidDetails?.truckSpecifications?.truckId;
      if (bidTruckId && bidTruckId !== ctx.truckId) return false;
      const window = this.resolveScheduleWindow(bid.load, bid);
      return this.schedulesOverlap(
        ctx.pickupDateTime,
        ctx.deliveryDateTime,
        window.pickupDateTime,
        window.deliveryDateTime,
      );
    });

    const cancelled: Bid[] = [];

    for (const bid of conflicting) {
      const reason =
        ctx.trigger === CommitmentTrigger.SMART_MATCH_CONFIRMED
          ? 'Truck confirmed through Smart Matching for another shipment during the same schedule.'
          : 'Truck assigned to another shipment during the same pickup and delivery period.';

      bid.status = BidStatus.WITHDRAWN;
      bid.bidDetails = {
        ...bid.bidDetails,
        autoCancellation: {
          reason,
          triggerEvent: ctx.trigger,
          conflictingLoadId: ctx.confirmedLoadId,
          conflictingAssignmentId: ctx.assignmentId,
          cancelledAt: new Date().toISOString(),
          cancelledBy: ctx.actorUserId || 'SYSTEM',
        },
      };
      await this.bidRepository.save(bid);
      cancelled.push(bid);

      await this.activityLogService.logActivity({
        userId: ctx.actorUserId,
        action: 'BID_AUTO_CANCELLED',
        resource: 'bids',
        resourceId: bid.id,
        details: {
          triggerEvent: ctx.trigger,
          truckId: ctx.truckId,
          confirmedLoadId: ctx.confirmedLoadId,
          conflictingLoadId: bid.loadId,
          tripId: ctx.tripId,
          assignmentId: ctx.assignmentId,
          reason,
          actor: ctx.actorUserId ? 'USER' : 'SYSTEM',
        },
      });

      const cargoLabel =
        bid.load?.title || bid.load?.cargoType || `Cargo #${bid.loadId.slice(0, 8)}`;

      this.eventEmitter.emit('bid.auto-cancelled', {
        bidId: bid.id,
        truckOwnerId: ctx.truckOwnerId,
        cargoOwnerId: bid.load?.cargoOwnerId,
        brokerId: bid.load?.brokerId,
        loadId: bid.loadId,
        tenantId: ctx.tenantId,
        cargoTitle: cargoLabel,
        confirmedCargoTitle: ctx.confirmedCargoTitle,
        reason,
        trigger: ctx.trigger,
      });

      await this.notifyCargoOwnerOfWithdrawnBid(bid, ctx, cargoLabel, reason);
    }

    return cancelled;
  }

  private async expireConflictingMatches(
    ctx: CommitmentContext,
  ): Promise<LoadMatch[]> {
    const activeMatches = await this.loadMatchRepository.find({
      where: {
        truckId: ctx.truckId,
        tenantId: ctx.tenantId,
        status: In([MatchStatus.POTENTIAL, MatchStatus.REQUESTED]),
        loadId: Not(ctx.confirmedLoadId),
      },
    });

    const expired: LoadMatch[] = [];

    for (const match of activeMatches) {
      if (ctx.excludeMatchId && match.id === ctx.excludeMatchId) continue;

      const load = await this.loadRepository.findOne({
        where: { id: match.loadId },
      });
      if (!load) continue;

      const window = this.resolveScheduleWindow(load);
      if (
        !this.schedulesOverlap(
          ctx.pickupDateTime,
          ctx.deliveryDateTime,
          window.pickupDateTime,
          window.deliveryDateTime,
        )
      ) {
        continue;
      }

      match.status = MatchStatus.EXPIRED;
      match.matchDetails = {
        ...(match.matchDetails || {}),
        autoExpired: {
          reason: 'Truck assigned to another shipment during overlapping schedule.',
          triggerEvent: ctx.trigger,
          conflictingLoadId: ctx.confirmedLoadId,
          expiredAt: new Date().toISOString(),
        },
      };
      await this.loadMatchRepository.save(match);
      expired.push(match);

      const loadTitle = load.title || load.cargoType || `Cargo #${load.id.slice(0, 8)}`;
      if (load.cargoOwnerId) {
        await this.notificationService.createNotification({
          recipientId: load.cargoOwnerId,
          tenantId: ctx.tenantId,
          title: 'Truck No Longer Available',
          message:
            `The truck owner is no longer available for "${loadTitle}" because the truck has been assigned to another shipment during the requested schedule. Please select another available truck.`,
          notificationType: NotificationType.SMART_MATCH_SELECTED,
          category: NotificationCategory.BUSINESS,
          priority: NotificationPriority.NORMAL,
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
          entityType: EntityType.CARGO,
          entityId: load.id,
          requiresAction: true,
          actionUrl: '/dashboard/smart-matching',
          actionText: 'Find Another Truck',
        });
      }

      await this.activityLogService.logActivity({
        userId: ctx.actorUserId,
        action: 'MATCH_AUTO_EXPIRED',
        resource: 'load_matches',
        resourceId: match.id,
        details: {
          triggerEvent: ctx.trigger,
          truckId: ctx.truckId,
          confirmedLoadId: ctx.confirmedLoadId,
          conflictingLoadId: match.loadId,
          reason: 'Schedule conflict with confirmed assignment',
        },
      });
    }

    return expired;
  }

  private async findConflictingMatches(
    ctx: CommitmentContext,
  ): Promise<LoadMatch[]> {
    const acceptedMatches = await this.loadMatchRepository.find({
      where: {
        truckId: ctx.truckId,
        tenantId: ctx.tenantId,
        status: MatchStatus.ACCEPTED,
        loadId: Not(ctx.confirmedLoadId),
      },
    });

    const conflicting: LoadMatch[] = [];

    for (const match of acceptedMatches) {
      const load = await this.loadRepository.findOne({
        where: { id: match.loadId },
      });
      if (!load) continue;
      const window = this.resolveScheduleWindow(load);
      if (
        this.schedulesOverlap(
          ctx.pickupDateTime,
          ctx.deliveryDateTime,
          window.pickupDateTime,
          window.deliveryDateTime,
        )
      ) {
        conflicting.push(match);
      }
    }

    return conflicting;
  }

  private async findConflictingAcceptedBids(ctx: CommitmentContext): Promise<Bid[]> {
    const acceptedBids = await this.bidRepository.find({
      where: {
        truckOwnerId: ctx.truckOwnerId,
        tenantId: ctx.tenantId,
        status: BidStatus.ACCEPTED,
        loadId: Not(ctx.confirmedLoadId),
      },
      relations: ['load'],
    });

    return acceptedBids.filter((bid) => {
      if (ctx.excludeBidId && bid.id === ctx.excludeBidId) return false;
      const bidTruckId = bid.bidDetails?.truckSpecifications?.truckId;
      if (bidTruckId && bidTruckId !== ctx.truckId) return false;
      const window = this.resolveScheduleWindow(bid.load, bid);
      return this.schedulesOverlap(
        ctx.pickupDateTime,
        ctx.deliveryDateTime,
        window.pickupDateTime,
        window.deliveryDateTime,
      );
    });
  }

  private async notifyTruckOwnerOfCancelledBids(
    ctx: CommitmentContext,
    cancelledBids: Bid[],
  ): Promise<void> {
    const count = cancelledBids.length;
    const message =
      ctx.trigger === CommitmentTrigger.SMART_MATCH_CONFIRMED
        ? `Your truck has been successfully assigned through Smart Matching. ` +
          `${count} other auction bid${count > 1 ? 's' : ''} with conflicting schedules ${count > 1 ? 'have' : 'has'} been automatically cancelled.`
        : `Your bid for "${ctx.confirmedCargoTitle || 'the confirmed shipment'}" was accepted. ` +
          `${count} other bid${count > 1 ? 's' : ''} with overlapping schedules ${count > 1 ? 'have' : 'has'} been automatically cancelled because your truck is now committed to this shipment.`;

    await this.notificationService.createNotification({
      recipientId: ctx.truckOwnerId,
      tenantId: ctx.tenantId,
      title:
        ctx.trigger === CommitmentTrigger.SMART_MATCH_CONFIRMED
          ? 'Smart Match Confirmed — Conflicting Bids Cancelled'
          : 'Bid Accepted — Conflicting Bids Cancelled',
      message,
      notificationType: NotificationType.GENERAL,
      category: NotificationCategory.AUCTION,
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      entityType: EntityType.CARGO,
      entityId: ctx.confirmedLoadId,
      requiresAction: false,
      actionUrl: '/dashboard/bidding',
      actionText: 'View Bids',
    });
  }

  private async notifyCargoOwnerOfWithdrawnBid(
    bid: Bid,
    ctx: CommitmentContext,
    cargoLabel: string,
    reason: string,
  ): Promise<void> {
    const recipientId = bid.load?.brokerId || bid.load?.cargoOwnerId;
    if (!recipientId) return;

    const message =
      ctx.trigger === CommitmentTrigger.SMART_MATCH_CONFIRMED
        ? `The truck owner's bid for "${cargoLabel}" has been automatically withdrawn because the truck has been assigned to another shipment through Smart Matching during the requested schedule.`
        : `The truck owner's bid for "${cargoLabel}" has been automatically withdrawn because the truck is no longer available after accepting another shipment with overlapping dates.`;

    await this.notificationService.createNotification({
      recipientId,
      tenantId: ctx.tenantId,
      title: 'Bid Automatically Withdrawn',
      message,
      notificationType: NotificationType.AUCTION_LOST,
      category: NotificationCategory.AUCTION,
      priority: NotificationPriority.NORMAL,
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      entityType: EntityType.CARGO,
      entityId: bid.loadId,
      requiresAction: false,
      actionUrl: '/dashboard/bidding',
      actionText: 'View Auction',
      metadata: { bidId: bid.id, reason, trigger: ctx.trigger },
    });
  }
}
