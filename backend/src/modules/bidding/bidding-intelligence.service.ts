import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bid, BidStatus } from '../../entities/bid.entity';
import { Auction } from '../../entities/auction.entity';
import { Load } from '../../entities/load.entity';
import { PredictiveAnalyticsService } from '../analytics/services/predictive-analytics.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType, NotificationCategory, NotificationChannel, EntityType } from '../../entities/notification.entity';

@Injectable()
export class BiddingIntelligenceService {
  private readonly logger = new Logger(BiddingIntelligenceService.name);

  constructor(
    @InjectRepository(Bid)
    private readonly bidRepository: Repository<Bid>,
    @InjectRepository(Auction)
    private readonly auctionRepository: Repository<Auction>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    private readonly predictiveService: PredictiveAnalyticsService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Evaluates an incoming bid and decides whether to counter-offer or accept via AI
   */
  async evaluateAndNegotiate(bidId: string, tenantId: string) {
    // origin/destination are jsonb columns on Load, not relations
    const bid = await this.bidRepository.findOne({
      where: { id: bidId },
      relations: ['load'],
    });

    if (!bid || bid.status !== BidStatus.PENDING) return;

    const load = bid.load;
    
    // Check if AI Negotiation is enabled for this load/auction
    const auction = await this.auctionRepository.findOne({ where: { loadId: load.id } });
    if (!auction || !auction.auctionRules?.allowCounterOffers) return;

    this.logger.log(`🤖 AI Negotiator evaluating bid ${bidId} for load ${load.id}`);

    // Get pricing recommendation from Neural Engine
    const pricingRec = await this.predictiveService.predictCosts(
      tenantId,
      load.cargoOwnerId,
      load.id // using loadId as proxy for route hash in this context
    );

    const recommendedPrice = ('baselineCost' in pricingRec ? pricingRec.baselineCost : (pricingRec as any).prediction) || load.offeredPrice || 1000;
    const bidAmount = bid.bidAmount;

    // AI Negotiation Logic:
    // 1. If bid is within 5% of recommended price -> Potential for auto-acceptance
    // 2. If bid is 5% - 20% higher -> AI Counters with a mid-point
    // 3. If bid is > 20% higher -> AI Rejects or Counters with Recommended + 5%

    const variance = (bidAmount - recommendedPrice) / recommendedPrice;

    if (variance <= 0.05) {
      this.logger.log(`✅ [AI-NEGOTIATOR] Bid ${bidId} is optimal. Variance: ${(variance * 100).toFixed(2)}%`);
      // Optionally notify cargo owner that a highly optimal bid was received
    } else if (variance > 0.05 && variance <= 0.25) {
      this.logger.log(`⚖️ [AI-NEGOTIATOR] High bid detected. Initiating counter-offer.`);
      await this.initiateCounterOffer(bid, recommendedPrice, tenantId);
    } else {
      this.logger.log(`❌ [AI-NEGOTIATOR] Bid too high. Variance: ${(variance * 100).toFixed(2)}%`);
      // Mark as high risk in the bid entity
      bid.riskAssessment = { 
        riskScore: 90, 
        riskFactors: ['Price significantly above market neural recommendation'] 
      };
      await this.bidRepository.save(bid);
    }
  }

  private async initiateCounterOffer(bid: Bid, recommendedPrice: number, tenantId: string) {
    // Calculate a aggressive but fair counter offer (Recommended + 2.5% buffer)
    const counterAmount = recommendedPrice * 1.025;

    this.logger.log(`🤖 AI Negotiator countering bid ${bid.id} (${bid.bidAmount}) with Neural Target: ${counterAmount.toFixed(2)}`);

    // In a real implementation, we would create a NEW bid as a counter-offer
    // linked to the parent bid, but for this simulation, we update the existing bid
    // to mark it as having a "Neural Counter"
    
    // Create new counter-offer bid
    const counterBid = this.bidRepository.create({
      tenantId,
      loadId: bid.loadId,
      truckOwnerId: bid.truckOwnerId, // Countering back to the same truck owner
      bidAmount: counterAmount,
      bidCurrency: bid.bidCurrency,
      isCounterOffer: true,
      parentBidId: bid.id,
      status: BidStatus.PENDING,
      bidNotes: '🤖 [UrutiX Neural AI] Counter-offer based on real-time market yield intelligence.',
    });

    await this.bidRepository.save(counterBid);

    // Notify Truck Owner about Counter Offer
    await this.notificationService.createNotification({
      recipientId: bid.truckOwnerId,
      tenantId,
      title: '🤖 AI Counter-Offer Received',
      message: `UrutiX Neural AI has issued a counter-offer of ${counterAmount.toFixed(2)} ${bid.bidCurrency} for cargo "${bid.load.title}".`,
      notificationType: NotificationType.GENERAL,
      category: NotificationCategory.FINANCIAL,
      channels: [NotificationChannel.IN_APP],
      entityType: EntityType.CARGO,
      entityId: counterBid.id,
      requiresAction: true,
      actionUrl: `/dashboard/fleet/my-bids`,
      actionText: 'View Counter-Offer',
    });
  }
}
