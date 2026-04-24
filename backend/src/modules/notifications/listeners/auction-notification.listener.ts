import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
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
import { EventsGateway } from '../../events/events.gateway';

interface AuctionBidReceivedPayload {
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  cargoOwnerId: string;
  tenantId: string;
  cargoTitle?: string;
}

interface AuctionWinnerSelectedPayload {
  auctionId: string;
  winnerId: string;
  winnerName: string;
  cargoOwnerId: string;
  cargoOwnerName: string;
  tenantId: string;
  winningBid: number;
  cargoTitle?: string;
}

interface SmartMatchSelectedPayload {
  matchId: string;
  truckOwnerId: string;
  truckOwnerName: string;
  cargoOwnerId: string;
  cargoOwnerName: string;
  tenantId: string;
  cargoTitle?: string;
  estimatedPrice?: number;
}

@Injectable()
export class AuctionNotificationListener {
  private readonly logger = new Logger(AuctionNotificationListener.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Cargo Owner receives: New bid submitted on auction
   */
  @OnEvent('auction.bid.received')
  async handleBidReceived(payload: AuctionBidReceivedPayload) {
    this.logger.log(
      `Handling auction.bid.received event for auction ${payload.auctionId}`,
    );

    try {
      const notification = this.notificationRepository.create({
        recipientId: payload.cargoOwnerId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.AUCTION_BID_RECEIVED,
        category: NotificationCategory.AUCTION,
        priority: NotificationPriority.HIGH,
        title: 'New Bid Received',
        message: `${payload.bidderName} has placed a bid of ${payload.amount.toLocaleString()} RWF on your auction${payload.cargoTitle ? ` for "${payload.cargoTitle}"` : ''}.`,
        shortMessage: `New bid: ${payload.amount.toLocaleString()} RWF`,
        entityType: EntityType.AUCTION,
        entityId: payload.auctionId,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: true,
        actionUrl: `/dashboard/bidding/auctions/${payload.auctionId}`,
        actionText: 'View Bid',
        metadata: {
          auctionId: payload.auctionId,
          bidderId: payload.bidderId,
          bidderName: payload.bidderName,
          amount: payload.amount,
          cargoTitle: payload.cargoTitle,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const saved = await this.notificationRepository.save(notification);
      
      // Emit real-time notification via WebSocket
      this.eventsGateway.emitNotification(payload.cargoOwnerId, saved);
      
      this.logger.log(
        `Successfully sent bid received notification to cargo owner ${payload.cargoOwnerId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send bid received notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Truck Owner receives: Selected as auction winner
   */
  @OnEvent('auction.winner.selected')
  async handleWinnerSelected(payload: AuctionWinnerSelectedPayload) {
    this.logger.log(
      `Handling auction.winner.selected event for auction ${payload.auctionId}`,
    );

    try {
      // Notify the winner (Truck Owner)
      const winnerNotification = this.notificationRepository.create({
        recipientId: payload.winnerId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.AUCTION_WON,
        category: NotificationCategory.AUCTION,
        priority: NotificationPriority.URGENT,
        title: '🎉 Congratulations! You Won the Auction',
        message: `You have been selected as the winner for the auction${payload.cargoTitle ? ` "${payload.cargoTitle}"` : ''}. Your winning bid: ${payload.winningBid.toLocaleString()} RWF. Please proceed with the assignment.`,
        shortMessage: `You won! ${payload.winningBid.toLocaleString()} RWF`,
        entityType: EntityType.AUCTION,
        entityId: payload.auctionId,
        channels: [
          NotificationChannel.IN_APP,
          NotificationChannel.PUSH,
          NotificationChannel.EMAIL,
        ],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: true,
        actionUrl: `/dashboard/bidding/my-bids/${payload.auctionId}`,
        actionText: 'View Details',
        metadata: {
          auctionId: payload.auctionId,
          winningBid: payload.winningBid,
          cargoOwnerId: payload.cargoOwnerId,
          cargoOwnerName: payload.cargoOwnerName,
          cargoTitle: payload.cargoTitle,
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

      const savedWinner = await this.notificationRepository.save(
        winnerNotification,
      );
      this.eventsGateway.emitNotification(payload.winnerId, savedWinner);

      // Also notify the Cargo Owner
      const cargoOwnerNotification = this.notificationRepository.create({
        recipientId: payload.cargoOwnerId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.AUCTION_WON,
        category: NotificationCategory.AUCTION,
        priority: NotificationPriority.HIGH,
        title: 'Auction Winner Selected',
        message: `${payload.winnerName} has been selected as the winner for your auction${payload.cargoTitle ? ` "${payload.cargoTitle}"` : ''} with a bid of ${payload.winningBid.toLocaleString()} RWF.`,
        shortMessage: `Winner: ${payload.winnerName}`,
        entityType: EntityType.AUCTION,
        entityId: payload.auctionId,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: false,
        actionUrl: `/dashboard/bidding/auctions/${payload.auctionId}`,
        actionText: 'View Auction',
        metadata: {
          auctionId: payload.auctionId,
          winnerId: payload.winnerId,
          winnerName: payload.winnerName,
          winningBid: payload.winningBid,
          cargoTitle: payload.cargoTitle,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const savedCargoOwner = await this.notificationRepository.save(
        cargoOwnerNotification,
      );
      this.eventsGateway.emitNotification(
        payload.cargoOwnerId,
        savedCargoOwner,
      );

      this.logger.log(
        `Successfully sent auction winner notifications to winner ${payload.winnerId} and cargo owner ${payload.cargoOwnerId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send auction winner notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Truck Owner receives: Smart match selected
   */
  @OnEvent('smart.match.selected')
  async handleSmartMatchSelected(payload: SmartMatchSelectedPayload) {
    this.logger.log(
      `Handling smart.match.selected event for match ${payload.matchId}`,
    );

    try {
      // Notify the Truck Owner
      const truckOwnerNotification = this.notificationRepository.create({
        recipientId: payload.truckOwnerId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.SMART_MATCH_SELECTED,
        category: NotificationCategory.BUSINESS,
        priority: NotificationPriority.HIGH,
        title: '🎯 Smart Match Selected',
        message: `You have been selected for a smart match${payload.cargoTitle ? ` for "${payload.cargoTitle}"` : ''}${payload.estimatedPrice ? `. Estimated price: ${payload.estimatedPrice.toLocaleString()} RWF` : ''}.`,
        shortMessage: 'Smart match selected',
        entityType: EntityType.CARGO,
        entityId: payload.matchId,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: true,
        actionUrl: `/dashboard/smart-matching/${payload.matchId}`,
        actionText: 'View Match',
        metadata: {
          matchId: payload.matchId,
          cargoOwnerId: payload.cargoOwnerId,
          cargoOwnerName: payload.cargoOwnerName,
          cargoTitle: payload.cargoTitle,
          estimatedPrice: payload.estimatedPrice,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const savedTruckOwner = await this.notificationRepository.save(
        truckOwnerNotification,
      );
      this.eventsGateway.emitNotification(
        payload.truckOwnerId,
        savedTruckOwner,
      );

      // Also notify the Cargo Owner
      const cargoOwnerNotification = this.notificationRepository.create({
        recipientId: payload.cargoOwnerId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.SMART_MATCH_SELECTED,
        category: NotificationCategory.BUSINESS,
        priority: NotificationPriority.NORMAL,
        title: 'Smart Match Confirmed',
        message: `${payload.truckOwnerName} has been matched with your cargo${payload.cargoTitle ? ` "${payload.cargoTitle}"` : ''}.`,
        shortMessage: `Matched: ${payload.truckOwnerName}`,
        entityType: EntityType.CARGO,
        entityId: payload.matchId,
        channels: [NotificationChannel.IN_APP],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: false,
        actionUrl: `/dashboard/smart-matching/${payload.matchId}`,
        actionText: 'View Match',
        metadata: {
          matchId: payload.matchId,
          truckOwnerId: payload.truckOwnerId,
          truckOwnerName: payload.truckOwnerName,
          cargoTitle: payload.cargoTitle,
          estimatedPrice: payload.estimatedPrice,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const savedCargoOwner = await this.notificationRepository.save(
        cargoOwnerNotification,
      );
      this.eventsGateway.emitNotification(
        payload.cargoOwnerId,
        savedCargoOwner,
      );

      this.logger.log(
        `Successfully sent smart match notifications to truck owner ${payload.truckOwnerId} and cargo owner ${payload.cargoOwnerId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send smart match notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
