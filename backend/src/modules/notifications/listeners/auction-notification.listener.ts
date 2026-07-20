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
import { User, UserRole, UserStatus } from '../../../entities/user.entity';
import { MessageRole } from '../../../entities/message.entity';
import { EventsGateway } from '../../events/events.gateway';
import { EmailService } from '../../auth/services/email.service';
import { SmsService } from '../services/sms.service';
import { MessengerService } from '../../messenger/messenger.service';

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

interface BidAutoCancelledPayload {
  bidId: string;
  truckOwnerId: string;
  cargoOwnerId?: string;
  brokerId?: string;
  loadId: string;
  tenantId: string;
  cargoTitle?: string;
  confirmedCargoTitle?: string;
  reason: string;
  trigger: string;
}

interface BidAuctionLostPayload {
  bidId: string;
  truckOwnerId: string;
  loadId: string;
  tenantId: string;
  cargoTitle?: string;
  reason: string;
}

interface AuctionCreatedPayload {
  auctionId: string;
  loadId: string;
  tenantId: string;
  cargoOwnerId: string;
  cargoTitle: string;
  route: string;
  auctionStart: Date | string;
  auctionEnd: Date | string;
  reservePrice?: number | string;
  currency?: string;
  status?: string;
}

@Injectable()
export class AuctionNotificationListener {
  private readonly logger = new Logger(AuctionNotificationListener.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventsGateway: EventsGateway,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly messengerService: MessengerService,
  ) {}

  /**
   * All truck owners in the same tenant: new auction available — ready to bid
   */
  @OnEvent('auction.created')
  async handleAuctionCreated(payload: AuctionCreatedPayload) {
    this.logger.log(
      `Handling auction.created for auction ${payload.auctionId} in tenant ${payload.tenantId}`,
    );

    try {
      const truckOwners = await this.userRepository.find({
        where: {
          tenantId: payload.tenantId,
          role: UserRole.TRUCK_OWNER,
          status: UserStatus.ACTIVE,
        },
        relations: ['profile'],
      });

      if (!truckOwners.length) {
        this.logger.log(
          `No active truck owners in tenant ${payload.tenantId} to notify about auction ${payload.auctionId}`,
        );
        return;
      }

      const currency = payload.currency || 'KES';
      const auctionEndDate = payload.auctionEnd
        ? new Date(payload.auctionEnd)
        : null;
      const auctionEndLabel = auctionEndDate
        ? auctionEndDate.toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : 'See dashboard';
      const reserveLabel =
        payload.reservePrice != null && payload.reservePrice !== ''
          ? `${currency} ${Number(payload.reservePrice).toLocaleString()}`
          : undefined;
      const clearMessage =
        `New auction available for cargo "${payload.cargoTitle}" (${payload.route}). ` +
        `Be ready to bid — auction ends ${auctionEndLabel}` +
        (reserveLabel ? `. Reserve/target: ${reserveLabel}` : '') +
        `. Open Bidding to place your bid.`;

      this.logger.log(
        `Notifying ${truckOwners.length} truck owner(s) about auction ${payload.auctionId}`,
      );

      for (const truckOwner of truckOwners) {
        const ownerName =
          truckOwner.profile?.firstName ||
          truckOwner.profile?.companyName ||
          truckOwner.email ||
          'Truck Owner';

        // 1. In-app + WebSocket
        try {
          const notification = this.notificationRepository.create({
            recipientId: truckOwner.id,
            tenantId: payload.tenantId,
            notificationType: NotificationType.AUCTION_CREATED,
            category: NotificationCategory.AUCTION,
            priority: NotificationPriority.HIGH,
            title: 'New auction — ready to bid',
            message: clearMessage,
            shortMessage: `New auction: ${payload.cargoTitle}`,
            entityType: EntityType.AUCTION,
            entityId: payload.auctionId,
            channels: [
              NotificationChannel.IN_APP,
              NotificationChannel.EMAIL,
              NotificationChannel.SMS,
            ],
            status: NotificationStatus.SENT,
            isRead: false,
            requiresAction: true,
            actionUrl: '/dashboard/bidding',
            actionText: 'View auction & bid',
            metadata: {
              auctionId: payload.auctionId,
              loadId: payload.loadId,
              cargoTitle: payload.cargoTitle,
              route: payload.route,
              cargoOwnerId: payload.cargoOwnerId,
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
          this.eventsGateway.emitNotification(truckOwner.id, saved);
        } catch (error) {
          this.logger.error(
            `Failed in-app notify truck owner ${truckOwner.id}: ${error.message}`,
          );
        }

        // 2. Email
        if (truckOwner.email) {
          try {
            await this.emailService.sendAuctionCreatedTruckOwnerEmail(
              truckOwner.email,
              ownerName,
              payload.cargoTitle,
              payload.route,
              payload.auctionId,
              auctionEndLabel,
              reserveLabel,
            );
          } catch (error) {
            this.logger.error(
              `Failed email notify truck owner ${truckOwner.email}: ${error.message}`,
            );
          }
        }

        // 3. SMS
        const phone = truckOwner.phone?.trim();
        if (phone) {
          try {
            const smsBody =
              `UrutiX: New auction for "${payload.cargoTitle}" (${payload.route}). ` +
              `Be ready to bid — ends ${auctionEndLabel}. Open Bidding to compete.`;
            await this.smsService.sendSms(phone, smsBody);
          } catch (error) {
            this.logger.error(
              `Failed SMS notify truck owner ${phone}: ${error.message}`,
            );
          }
        }

        // 4. Messenger
        if (payload.cargoOwnerId && payload.cargoOwnerId !== truckOwner.id) {
          try {
            await this.messengerService.sendMessage(
              payload.cargoOwnerId,
              truckOwner.id,
              clearMessage,
              payload.tenantId,
              {
                loadId: payload.loadId,
                senderRole: MessageRole.CARGO_OWNER,
              },
            );
          } catch (error) {
            this.logger.error(
              `Failed messenger notify truck owner ${truckOwner.id}: ${error.message}`,
            );
          }
        }
      }

      this.logger.log(
        `Finished auction.created notifications for ${truckOwners.length} truck owner(s)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle auction.created: ${error.message}`,
        error.stack,
      );
    }
  }

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
        actionUrl: `/dashboard/bidding`,
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
        actionUrl: `/dashboard/bidding`,
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
        actionUrl: `/dashboard/bidding`,
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
        actionUrl: `/dashboard/smart-matching`,
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
        actionUrl: `/dashboard/smart-matching`,
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

  /**
   * Truck Owner: bid auto-cancelled due to schedule conflict with another commitment
   */
  @OnEvent('bid.auto-cancelled')
  async handleBidAutoCancelled(payload: BidAutoCancelledPayload) {
    this.logger.log(`Handling bid.auto-cancelled for bid ${payload.bidId}`);

    try {
      const cargoRef = payload.cargoTitle || `Cargo #${payload.loadId.slice(0, 8)}`;
      const truckOwnerMessage =
        payload.trigger === 'SMART_MATCH_CONFIRMED'
          ? `Your bid for ${cargoRef} has been automatically cancelled because your truck has been assigned to another shipment through Smart Matching during the same pickup and delivery period.`
          : `Your bid for ${cargoRef} has been automatically cancelled because your truck has been assigned to another shipment during the same pickup and delivery period.`;

      const truckOwnerNotification = this.notificationRepository.create({
        recipientId: payload.truckOwnerId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.GENERAL,
        category: NotificationCategory.AUCTION,
        priority: NotificationPriority.HIGH,
        title: 'Bid Automatically Cancelled',
        message: truckOwnerMessage,
        shortMessage: `Bid cancelled: ${cargoRef}`,
        entityType: EntityType.CARGO,
        entityId: payload.loadId,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.EMAIL],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: false,
        actionUrl: '/dashboard/bidding',
        actionText: 'View Bids',
        metadata: {
          bidId: payload.bidId,
          reason: payload.reason,
          trigger: payload.trigger,
        },
      });

      const savedTruckOwner = await this.notificationRepository.save(
        truckOwnerNotification,
      );
      this.eventsGateway.emitNotification(payload.truckOwnerId, savedTruckOwner);
    } catch (error) {
      this.logger.error(
        `Failed to send bid auto-cancelled notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Truck Owner: bid rejected because another bidder won the auction
   */
  @OnEvent('bid.auction.lost')
  async handleBidAuctionLost(payload: BidAuctionLostPayload) {
    this.logger.log(`Handling bid.auction.lost for bid ${payload.bidId}`);

    try {
      const notification = this.notificationRepository.create({
        recipientId: payload.truckOwnerId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.AUCTION_LOST,
        category: NotificationCategory.AUCTION,
        priority: NotificationPriority.NORMAL,
        title: 'Bid Not Selected',
        message: payload.reason,
        shortMessage: payload.cargoTitle
          ? `Not selected: ${payload.cargoTitle}`
          : 'Bid not selected',
        entityType: EntityType.CARGO,
        entityId: payload.loadId,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: false,
        actionUrl: '/dashboard/bidding',
        actionText: 'View Bids',
        metadata: {
          bidId: payload.bidId,
          reason: payload.reason,
        },
      });

      const saved = await this.notificationRepository.save(notification);
      this.eventsGateway.emitNotification(payload.truckOwnerId, saved);
    } catch (error) {
      this.logger.error(
        `Failed to send auction lost notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
