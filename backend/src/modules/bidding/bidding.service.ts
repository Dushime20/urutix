import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Bid, BidStatus } from '../../entities/bid.entity';
import {
  Auction,
  AuctionStatus,
  AuctionType,
} from '../../entities/auction.entity';
import { Load, LoadStatus } from '../../entities/load.entity';
import { Location } from '../../entities/location.entity';
import { User, UserRole } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Truck, VehicleStatus } from '../../entities/truck.entity';
import { Driver } from '../../entities/driver.entity';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { AuctionWatch } from '../../entities/auction-watch.entity';
import { AuctionView } from '../../entities/auction-view.entity';
import { LoadContract, ContractStatus } from '../../entities/load-contract.entity';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType, EntityType, NotificationCategory, NotificationChannel, NotificationPriority } from '../../entities/notification.entity';
import { BiddingIntelligenceService } from './bidding-intelligence.service';
import { BidValidationService } from './services/bid-validation.service';
import { CreditService } from '../../services/credit.service';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { TenantSubscription, SubscriptionStatus } from '../../entities/tenant-subscription.entity';
import { AvailabilityService } from '../availability/availability.service';

export interface CreateBidDto {
  loadId: string;
  bidAmount: number;
  bidCurrency?: string;
  proposedPickupDate?: Date;
  proposedDeliveryDate?: Date;
  bidNotes?: string;
  advancePaymentPercentage?: number; // Percentage of transportation fee to be paid before trip starts (0-100)
  requireAdvancePayment?: boolean; // Whether advance payment is required before trip starts. If false, trip can start without advance payment.
  bidDetails?: {
    truckSpecifications?: {
      truckId?: string;
      capacityWeight?: number;
      capacityVolume?: number;
      truckType?: string;
      hasRefrigeration?: boolean;
      hasHazmatPermit?: boolean;
    };
    driverInfo?: {
      driverId?: string;
      experience?: number;
      rating?: number;
      certifications?: string[];
    };
    routeOptimization?: {
      estimatedDistance?: number;
      estimatedFuelCost?: number;
      estimatedTime?: number;
    };
    additionalServices?: {
      insurance?: boolean;
      tracking?: boolean;
      loadingAssistance?: boolean;
      unloadingAssistance?: boolean;
    };
    validationMetadata?: {
      competitive?: boolean;
      competitiveLevel?: string;
      warning?: string;
      message?: string;
      validatedAt?: string;
    };
  };
  isAutoBid?: boolean;
  isCounterOffer?: boolean;
  parentBidId?: string;
}

export interface CreateAuctionDto {
  loadId: string;
  auctionType?: AuctionType;
  auctionStart: Date;
  auctionEnd: Date;
  reservePrice?: number;
  minimumBidIncrement?: number;
  maximumBidAmount?: number;
  
  // Professional Auction Type Fields
  targetPrice?: number;           // REVERSE: Shipper's goal price
  maxBudget?: number;             // REVERSE: Hidden maximum budget
  startingPrice?: number;         // FORWARD/DUTCH: Starting price
  marketRate?: number;            // ALL: Reference market price
  dropInterval?: number;          // DUTCH: Seconds between price drops
  dropAmount?: number;            // DUTCH: Amount to drop each interval
  bidVisibility?: string;         // SEALED: 'HIDDEN' | 'VISIBLE_AFTER_DEADLINE' | 'VISIBLE'
  allowBidRevision?: boolean;     // SEALED: Allow bid revision before deadline
  selectionCriteria?: string;     // SEALED: 'LOWEST_BID' | 'BEST_VALUE' | 'WEIGHTED_SCORE'
  autoExtend?: boolean;           // ALL: Auto-extend auction on late bids
  minimumBidDecrement?: number;   // REVERSE: Minimum bid decrease amount
  
  auctionRules?: {
    allowCounterOffers?: boolean;
    allowBidModifications?: boolean;
    autoExtendOnBid?: boolean;
    extensionMinutes?: number;
    minimumBidTime?: number;
    maximumBidTime?: number;
    requirePreApproval?: boolean;
    allowAnonymousBids?: boolean;
  };
  notificationSettings?: {
    notifyOnBid?: boolean;
    notifyOnCounterOffer?: boolean;
    notifyOnAuctionEnd?: boolean;
    notifyOnAward?: boolean;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
  };
}

@Injectable()
export class BiddingService {
  constructor(
    @InjectRepository(Bid)
    private readonly bidRepository: Repository<Bid>,
    @InjectRepository(Auction)
    private readonly auctionRepository: Repository<Auction>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(AuctionWatch)
    private readonly watchRepository: Repository<AuctionWatch>,
    @InjectRepository(AuctionView)
    private readonly viewRepository: Repository<AuctionView>,
    @InjectRepository(LoadContract)
    private readonly contractRepository: Repository<LoadContract>,
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(TenantSubscription)
    private readonly tenantSubscriptionRepository: Repository<TenantSubscription>,
    private readonly notificationService: NotificationService,
    private readonly biddingIntelligence: BiddingIntelligenceService,
    private readonly creditService: CreditService,
    private readonly eventEmitter: EventEmitter2,
    private readonly bidValidationService: BidValidationService,
    private readonly availabilityService: AvailabilityService,
  ) { }

  async createBid(
    createBidDto: CreateBidDto,
    truckOwnerId: string,
    tenantId: string,
  ): Promise<Bid> {
    // Validate load exists and is published
    const load = await this.loadRepository.findOne({
      where: { id: createBidDto.loadId, tenantId },
    });

    if (!load) {
      throw new NotFoundException('Load not found');
    }

    if (![LoadStatus.CREATED, LoadStatus.PUBLISHED].includes(load.status)) {
      throw new BadRequestException(
        'Only created or published loads can receive bids',
      );
    }

    // Validate truck owner
    const truckOwner = await this.userRepository.findOne({
      where: { id: truckOwnerId, tenantId, role: UserRole.TRUCK_OWNER },
    });

    if (!truckOwner) {
      throw new ForbiddenException('Only truck owners can submit bids');
    }

    // Check if auction exists and is active or scheduled (but start time has passed)
    const auction = await this.auctionRepository.findOne({
      where: { loadId: createBidDto.loadId },
    });

    if (!auction) {
      throw new BadRequestException('No auction found for this load');
    }

    // Check if auction is active or if scheduled auction start time has passed
    const now = new Date();
    const auctionStart = auction.auctionStart ? new Date(auction.auctionStart) : null;
    const isAuctionActive = auction.status === AuctionStatus.ACTIVE ||
      (auction.status === AuctionStatus.SCHEDULED && auctionStart && auctionStart <= now);

    if (!isAuctionActive) {
      // If scheduled but not started yet, provide helpful error message
      if (auction.status === AuctionStatus.SCHEDULED && auctionStart && auctionStart > now) {
        throw new BadRequestException(
          `Auction has not started yet. It will start on ${auctionStart.toLocaleString()}`
        );
      }
      throw new BadRequestException('No active auction for this load');
    }

    // If auction is SCHEDULED but start time has passed, update it to ACTIVE
    if (auction.status === AuctionStatus.SCHEDULED && auctionStart && auctionStart <= now) {
      auction.status = AuctionStatus.ACTIVE;
      await this.auctionRepository.save(auction);
    }

    // Validate bid amount using professional validation service
    const validationResult = this.bidValidationService.validateBid(
      createBidDto.bidAmount,
      auction
    );

    if (!validationResult.valid) {
      throw new BadRequestException(validationResult.message || 'Invalid bid amount');
    }

    // Log validation result for analytics
    console.log('[BiddingService] Bid validation result:', {
      bidAmount: createBidDto.bidAmount,
      auctionType: auction.auctionType,
      competitive: validationResult.competitive,
      competitiveLevel: validationResult.competitiveLevel,
      message: validationResult.message,
      warning: validationResult.warning
    });

    // Store validation metadata with bid for later analysis
    const validationMetadata = {
      competitive: validationResult.competitive,
      competitiveLevel: validationResult.competitiveLevel,
      warning: validationResult.warning,
      message: validationResult.message,
      validatedAt: new Date().toISOString()
    };

    // Validate advance payment percentage if provided
    if (createBidDto.advancePaymentPercentage !== undefined && createBidDto.advancePaymentPercentage !== null) {
      if (createBidDto.advancePaymentPercentage < 0 || createBidDto.advancePaymentPercentage > 100) {
        throw new BadRequestException(
          'Advance payment percentage must be between 0 and 100',
        );
      }
    }

    // If requireAdvancePayment is false, advancePaymentPercentage should be 0 or null
    if (createBidDto.requireAdvancePayment === false &&
      createBidDto.advancePaymentPercentage !== undefined &&
      createBidDto.advancePaymentPercentage !== null &&
      createBidDto.advancePaymentPercentage > 0) {
      throw new BadRequestException(
        'Cannot specify advance payment percentage when advance payment is not required',
      );
    }

    // CREDIT VALIDATION: Check if truck owner has sufficient credits for this bid
    // Get credit rate from TENANT ADMIN's subscription plan (not truck owner's plan)
    // First try to find tenant-level subscription (userId IS NULL)
    let tenantAdminSubscription = await this.tenantSubscriptionRepository.findOne({
      where: { 
        tenantId, 
        userId: IsNull(), // Tenant-level subscription (tenant admin)
        status: SubscriptionStatus.ACTIVE 
      },
      relations: ['plan'],
      order: { createdAt: 'DESC' }, // Get most recent if multiple
    });

    // If no tenant-level subscription, try to find tenant admin's user-level subscription
    if (!tenantAdminSubscription) {
      const tenantAdminUser = await this.userRepository.findOne({
        where: { tenantId, role: UserRole.TENANT_ADMIN },
      });

      if (tenantAdminUser) {
        tenantAdminSubscription = await this.tenantSubscriptionRepository.findOne({
          where: { 
            tenantId, 
            userId: tenantAdminUser.id,
            status: SubscriptionStatus.ACTIVE 
          },
          relations: ['plan'],
          order: { createdAt: 'DESC' },
        });
      }
    }

    if (!tenantAdminSubscription || !tenantAdminSubscription.plan) {
      throw new BadRequestException(
        'Tenant admin must have an active subscription plan to enable bidding',
      );
    }

    // Calculate credits needed for truck owner (weight in tons × creditsPerTonTruckOwner)
    const cargoWeightTons = load.weight / 1000; // Convert kg to tons
    const creditsPerTonTruckOwner = Number(tenantAdminSubscription.plan.creditsPerTonTruckOwner);
    const truckOwnerCreditsNeeded = Math.ceil(cargoWeightTons * creditsPerTonTruckOwner);

    // Check if truck owner has sufficient credits (from marketplace purchase or any source)
    const truckOwnerHasSufficientCredits = await this.creditService.hasSufficientCredits(
      tenantId,
      truckOwnerCreditsNeeded,
      truckOwnerId,
    );

    if (!truckOwnerHasSufficientCredits) {
      const truckOwnerBalance = await this.creditService.getCreditBalance(tenantId, truckOwnerId);
      throw new BadRequestException(
        `Insufficient credits to place bid. Required: ${truckOwnerCreditsNeeded} credits (${cargoWeightTons.toFixed(2)} tons × ${creditsPerTonTruckOwner} credits/ton). Available: ${truckOwnerBalance.currentBalance} credits. Please purchase more credits from the marketplace to continue.`,
      );
    }

    console.log(`[BiddingService] Credit validation passed for truck owner ${truckOwnerId}:`);
    console.log(`  - Cargo weight: ${cargoWeightTons.toFixed(2)} tons`);
    console.log(`  - Rate: ${creditsPerTonTruckOwner} credits/ton (from tenant admin's plan)`);
    console.log(`  - Credits needed: ${truckOwnerCreditsNeeded}`);

    // Time-window eligibility for the selected truck (IN_TRANSIT OK if cargo ships later)
    const bidTruckId = createBidDto.bidDetails?.truckSpecifications?.truckId;
    if (bidTruckId) {
      const proposedPickup =
        createBidDto.proposedPickupDate ||
        load.pickupDate ||
        new Date(Date.now() + 24 * 60 * 60 * 1000);
      await this.assertTruckAvailableForBidding(
        bidTruckId,
        truckOwnerId,
        new Date(proposedPickup),
      );
    }

    // Create bid
    const bid = this.bidRepository.create({
      ...createBidDto,
      tenantId,
      truckOwnerId,
      status: BidStatus.PENDING,
      bidCurrency: createBidDto.bidCurrency || 'USD',
      requireAdvancePayment: createBidDto.requireAdvancePayment !== undefined
        ? createBidDto.requireAdvancePayment
        : true, // Default to true if not specified
      // Store validation metadata in bid details
      bidDetails: {
        ...createBidDto.bidDetails,
        validationMetadata  // Add validation result to bid details
      }
    });

    // Calculate success probability and risk assessment
    bid.successProbability = await this.calculateSuccessProbability(bid, load);
    bid.riskAssessment = await this.calculateRiskAssessment(bid, load);
    bid.marketContext = await this.calculateMarketContext(createBidDto.loadId);

    const savedBid = await this.bidRepository.save(bid);
    // Attach load so callers (controller event emit) can read cargoOwnerId without a re-fetch
    savedBid.load = load;

    // Update auction analytics
    await this.updateAuctionAnalytics(createBidDto.loadId);

    // Emit event for notification system
    try {
      const userProfile = await this.userProfileRepository.findOne({
        where: { userId: truckOwnerId },
      });
      const bidderName = userProfile && userProfile.firstName
        ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim()
        : 'A truck owner';

      this.eventEmitter.emit('auction.bid.received', {
        auctionId: auction.id,
        bidderId: truckOwnerId,
        bidderName,
        amount: savedBid.bidAmount,
        cargoOwnerId: load.cargoOwnerId,
        tenantId,
        cargoTitle: load.title || load.cargoType,
      });
    } catch (error) {
      console.error('Failed to emit auction.bid.received event:', error);
    }

    // Send Notification to Cargo Owner (legacy - can be removed once event system is verified)
    try {
      const userProfile = await this.userProfileRepository.findOne({
        where: { userId: truckOwnerId },
      });
      const bidderName = userProfile && userProfile.firstName
        ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim()
        : 'A truck owner';

      await this.notificationService.createNotification({
        recipientId: load.cargoOwnerId,
        tenantId,
        title: 'New Bid Received',
        message: `${bidderName} has bid on your cargo "${load.title}"`,
        notificationType: NotificationType.GENERAL,
        category: NotificationCategory.CARGO,
        channels: [NotificationChannel.IN_APP],
        entityType: EntityType.CARGO,
        entityId: savedBid.id,
        requiresAction: true,
        actionUrl: `/dashboard/bidding?view=bids`,
        actionText: 'View Bid',
      });
    } catch (error) {
      console.error('Failed to send bid notification', error);
    }

    // Trigger AI Negotiation Evaluation
    if (!savedBid.isCounterOffer) {
       this.biddingIntelligence.evaluateAndNegotiate(savedBid.id, tenantId).catch(err => {
          console.error('[AI-NEGOTIATOR] Evaluation failed:', err);
       });
    }

    // ── Availability Warning to Truck Owner (fire-and-forget) ─────────────────
    // If the truck owner specified a truck or driver, check whether they overlap
    // with any existing reservation for the proposed window.
    // This is a WARNING only — it does not block the bid.
    // The hard block happens at bid acceptance (acceptBid).
    this.sendAvailabilityWarningIfNeeded(
      savedBid.id,
      truckOwnerId,
      tenantId,
      createBidDto,
      load,
    ).catch(err =>
      console.error('[BiddingService] Availability warning check failed:', err),
    );
    // ─────────────────────────────────────────────────────────────────────────

    return savedBid;
  }

  async getBidsForLoad(loadId: string, tenantId: string): Promise<Bid[]> {
    const load = await this.loadRepository.findOne({
      where: { id: loadId, tenantId },
    });

    if (!load) {
      throw new NotFoundException('Load not found');
    }

    return this.bidRepository.find({
      where: { loadId },
      relations: ['truckOwner', 'truckOwner.profile'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateBid(
    bidId: string,
    updates: Partial<CreateBidDto>,
    truckOwnerId: string,
    _tenantId: string,
  ): Promise<Bid> {
    const bid = await this.bidRepository.findOne({
      where: { id: bidId, truckOwnerId },
      relations: ['load'],
    });

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException('Cannot update bid that is not pending');
    }

    // Validate auction allows modifications
    const auction = await this.auctionRepository.findOne({
      where: { loadId: bid.loadId },
    });

    if (!auction?.auctionRules?.allowBidModifications) {
      throw new BadRequestException(
        'Bid modifications are not allowed for this auction',
      );
    }

    Object.assign(bid, updates);
    return this.bidRepository.save(bid);
  }

  async withdrawBid(
    bidId: string,
    truckOwnerId: string,
    _tenantId: string,
  ): Promise<void> {
    const bid = await this.bidRepository.findOne({
      where: { id: bidId, truckOwnerId },
    });

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException('Cannot withdraw bid that is not pending');
    }

    bid.status = BidStatus.WITHDRAWN;
    await this.bidRepository.save(bid);
  }

  /**
   * Hard-reject MAINTENANCE / OUT_OF_SERVICE / inactive.
   * IN_TRANSIT is allowed only when cargo pickup is on/after the truck's free-from time.
   */
  private assertTruckStatusAvailable(truck: Truck, pickupDateTime?: Date): void {
    if (!truck.isActive) {
      throw new BadRequestException(
        'This truck is inactive and cannot be used for bidding.',
      );
    }
    if (
      truck.status === VehicleStatus.MAINTENANCE ||
      truck.status === VehicleStatus.OUT_OF_SERVICE
    ) {
      throw new BadRequestException(
        `This truck is currently ${truck.status.replace(/_/g, ' ').toLowerCase()} and cannot be used for bidding.`,
      );
    }
    if (truck.status === VehicleStatus.IN_TRANSIT) {
      const freeFrom = truck.estimatedAvailableTime
        ? new Date(truck.estimatedAvailableTime)
        : null;
      const pickup = pickupDateTime ? new Date(pickupDateTime) : null;

      if (!pickup || !freeFrom || pickup.getTime() < freeFrom.getTime()) {
        const freeLabel = freeFrom
          ? freeFrom.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'the current trip ends';
        throw new BadRequestException(
          `This truck is currently in transit and will be free after ${freeLabel}. ` +
          `You can bid with it only for cargo whose shipping time starts after that.`,
        );
      }
    }
  }

  private async assertTruckAvailableForBidding(
    truckId: string,
    ownerId: string,
    pickupDateTime?: Date,
  ): Promise<void> {
    const truck = await this.truckRepository.findOne({
      where: { id: truckId, ownerId },
    });
    if (!truck) {
      throw new NotFoundException(
        'Truck specified in bid not found or does not belong to the truck owner',
      );
    }
    this.assertTruckStatusAvailable(truck, pickupDateTime);
  }

  private async sendAvailabilityWarningIfNeeded(
    bidId: string,
    truckOwnerId: string,
    tenantId: string,
    dto: CreateBidDto,
    load: any,
  ): Promise<void> {
    const truckId  = dto.bidDetails?.truckSpecifications?.truckId;
    const driverId = dto.bidDetails?.driverInfo?.driverId;

    if (!truckId && !driverId) return; // No specific resource selected, nothing to check

    // Resolve the shipment window — same logic as acceptBid
    const pickupDateTime   = load.pickupDate   || dto.proposedPickupDate   ||
                             new Date(Date.now() + 24 * 60 * 60 * 1000);
    const deliveryDateTime = load.deliveryDate || dto.proposedDeliveryDate ||
                             new Date(new Date(pickupDateTime).getTime() + 7 * 24 * 60 * 60 * 1000);

    const conflicts = await this.availabilityService.findConflicts({
      truckId,
      driverId,
      pickupDateTime:   new Date(pickupDateTime),
      deliveryDateTime: new Date(deliveryDateTime),
      tenantId,
    });

    if (conflicts.length === 0) return; // All clear

    // Build a human-readable conflict summary
    const conflictLines = conflicts.map(c => {
      const pickup   = new Date(c.existingPickup).toLocaleDateString('en-US',   { month: 'short', day: 'numeric', year: 'numeric' });
      const delivery = new Date(c.existingDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const resource = c.type === 'TRUCK' ? 'Truck' : 'Driver';
      return `${resource} already assigned to Cargo ${c.conflictingCargoId.slice(0, 8)}… (${pickup} → ${delivery})`;
    });

    const pickupStr   = new Date(pickupDateTime).toLocaleDateString('en-US',   { month: 'short', day: 'numeric', year: 'numeric' });
    const deliveryStr = new Date(deliveryDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const message =
      `⚠️ Scheduling Conflict Warning — Your bid for "${load.title || load.cargoType}" ` +
      `(${pickupStr} → ${deliveryStr}) includes a resource that is already occupied:\n` +
      conflictLines.join('\n') +
      `\n\nYour bid has been submitted, but this assignment WILL be rejected if the bid is accepted. ` +
      `Please update your bid with an available truck/driver before the auction ends.`;

    // Notify the truck owner
    await this.notificationService.createNotification({
      recipientId: truckOwnerId,
      tenantId,
      title: '⚠️ Resource Already Occupied — Bid Warning',
      message,
      notificationType: NotificationType.GENERAL,
      category:         NotificationCategory.CARGO,
      channels:         [NotificationChannel.IN_APP],
      entityType:       EntityType.CARGO,
      entityId:         bidId,
      requiresAction:   true,
      actionUrl:        `/dashboard/bidding?view=my-bids&bidId=${bidId}`,
      actionText:       'Update Bid',
    });

    console.warn(
      `[BiddingService] Availability warning sent to truck owner ${truckOwnerId} for bid ${bidId}: ` +
      conflictLines.join('; '),
    );
  }

  async acceptBid(
    bidId: string,
    cargoOwnerId: string,
    tenantId: string,
    userRole?: UserRole,
  ): Promise<Bid> {
    const bid = await this.bidRepository.findOne({
      where: { id: bidId },
      relations: ['load', 'truckOwner'],
    });

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    // Check if load has an active broker contract
    const hasActiveContract = await this.hasActiveBrokerContract(bid.loadId, tenantId);

    // If cargo owner is trying to accept bid, check if broker is assigned
    if (userRole === UserRole.CARGO_OWNER || !userRole) {
      if (bid.load.brokerId && hasActiveContract) {
        throw new ForbiddenException(
          'Cannot accept bid: Load is managed by a broker. The broker must accept bids.',
        );
      }

      if (bid.load.cargoOwnerId !== cargoOwnerId) {
        throw new ForbiddenException('Only the cargo owner can accept bids');
      }
    }

    // If broker is accepting bid, verify they are assigned to the load
    if (userRole === UserRole.BROKER) {
      // cargoOwnerId in this context is the broker's userId when called by broker
      if (!bid.load.brokerId || bid.load.brokerId !== cargoOwnerId) {
        throw new ForbiddenException(
          'Broker is not assigned to this load',
        );
      }
      if (!hasActiveContract) {
        throw new ForbiddenException(
          'Broker must have an active contract to accept bids for this load',
        );
      }
    }

    // Get truck ID from bid details
    let truckId = bid.bidDetails?.truckSpecifications?.truckId;
    let truck;
    const acceptPickup =
      bid.load?.pickupDate ||
      bid.proposedPickupDate ||
      new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (truckId) {
      // Verify truck exists and belongs to the truck owner
      truck = await this.truckRepository.findOne({
        where: { id: truckId, ownerId: bid.truckOwnerId },
      });

      if (!truck) {
        throw new NotFoundException('Truck specified in bid not found or does not belong to the truck owner');
      }
      this.assertTruckStatusAvailable(truck, new Date(acceptPickup));
    } else {
      // Prefer AVAILABLE; fall back to IN_TRANSIT only if cargo ships after that trip ends
      truck = await this.truckRepository.findOne({
        where: {
          ownerId: bid.truckOwnerId,
          status: VehicleStatus.AVAILABLE,
          isActive: true,
        },
      });

      if (!truck) {
        const inTransitCandidates = await this.truckRepository.find({
          where: {
            ownerId: bid.truckOwnerId,
            status: VehicleStatus.IN_TRANSIT,
            isActive: true,
          },
        });
        const pickupMs = new Date(acceptPickup).getTime();
        truck = inTransitCandidates.find((t) => {
          const freeFrom = t.estimatedAvailableTime
            ? new Date(t.estimatedAvailableTime).getTime()
            : null;
          return freeFrom !== null && pickupMs >= freeFrom;
        });
      }

      if (!truck) {
        throw new BadRequestException(
          'Truck owner must have a truck that is available for this cargo shipping window',
        );
      }
      truckId = truck.id;
    }

    if (bid.status !== BidStatus.PENDING && bid.status !== BidStatus.ACCEPTED) {
      throw new BadRequestException('Cannot accept bid that is in its current status');
    }

    // NOTE: Credit deduction is no longer applied here.
    // Credits are deducted when the driver starts the trip (status → IN_PROGRESS).
    // See TripsService.updateTripStatus() for the credit deduction logic.

    // Only update status if it's still pending
    if (bid.status === BidStatus.PENDING) {
      bid.status = BidStatus.ACCEPTED;
      await this.bidRepository.save(bid);
    }

    // Update load status and assign truck
    await this.loadRepository.update(bid.loadId, {
      status: LoadStatus.ASSIGNED,
      assignedTruckId: truckId,
      updatedAt: new Date(),
    });

    // Auto-assign driver if driverId is specified in bid details
    const driverId = bid.bidDetails?.driverInfo?.driverId;
    if (driverId) {
      try {
        const driver = await this.driverRepository.findOne({
          where: { id: driverId },
        });

        if (driver) {
          // Check if driver is already assigned to a different truck
          if (driver.currentTruckId && driver.currentTruckId !== truckId) {
            // Driver is assigned to a different truck, but we'll still add them to this truck's assignedDrivers
            // This allows a driver to be associated with multiple trucks if needed
          }

          // Add driver to truck's assignedDrivers array if not already present
          const currentAssignedDrivers = Array.isArray(truck.assignedDrivers)
            ? [...truck.assignedDrivers]
            : [];

          const existingAssignment = currentAssignedDrivers.find(
            (d: any) => d.driverId === driverId,
          );

          if (!existingAssignment) {
            currentAssignedDrivers.push({
              driverId,
              driverName: `${driver.firstName} ${driver.lastName}`,
              assignmentDate: new Date().toISOString(),
              status: 'active',
            });

            await this.truckRepository.update(truck.id, {
              assignedDrivers: currentAssignedDrivers,
            });
          }

          // Update driver's currentTruckId if not set or if it's different
          if (!driver.currentTruckId || driver.currentTruckId !== truckId) {
            await this.driverRepository.update(driver.id, {
              currentTruckId: truckId,
            });
          }
        }
      } catch (error) {
        // Log error but don't fail the bid acceptance
        console.error('Failed to auto-assign driver:', error);
      }
    }

    // Close auction
    await this.auctionRepository.update(
      { loadId: bid.loadId },
      {
        status: AuctionStatus.CLOSED,
        winningBidId: bidId,
        winningBidderId: bid.truckOwnerId,
        awardedAt: new Date(),
      },
    );

    // Reject all other pending bids for this load
    await this.bidRepository
      .createQueryBuilder()
      .update(Bid)
      .set({ status: BidStatus.REJECTED })
      .where('loadId = :loadId', { loadId: bid.loadId })
      .andWhere('status = :status', { status: BidStatus.PENDING })
      .andWhere('id != :bidId', { bidId })
      .execute();

    // Automatically create a trip when bid is accepted
    // Check if trip already exists for this load
    const existingTrip = await this.tripRepository.findOne({
      where: { loadId: bid.loadId, tenantId },
    });

    let tripId = existingTrip?.id;
    let finalDriverId: string | null = existingTrip?.driverId || null;

    if (!existingTrip) {
      try {
        // Get driver ID — priority order:
        // 1. Explicitly passed driverId (from bid details)
        // 2. truck.currentDriverId — the driver currently assigned to this truck
        // 3. truck.assignedDrivers[0] — legacy fallback
        // 4. null — trip created without driver, can be assigned later
        finalDriverId = driverId || null;

        if (!finalDriverId && truck.currentDriverId) {
          finalDriverId = truck.currentDriverId;
          console.log(`Using truck.currentDriverId ${finalDriverId} for trip`);
        }

        if (!finalDriverId && truck.assignedDrivers && Array.isArray(truck.assignedDrivers) && truck.assignedDrivers.length > 0) {
          finalDriverId = truck.assignedDrivers[0].driverId;
          console.log(`Using assignedDrivers[0] ${finalDriverId} for trip`);
        }

        if (!finalDriverId) {
          console.warn(`No driver found for truck ${truck.id} — trip will be created without a driver and can be assigned later`);
        }

        // Use load pickup/delivery dates for planned start/end times
        // If not available, use bid proposed dates or default to reasonable times
        const plannedStartTime = bid.load.pickupDate ||
          bid.proposedPickupDate ||
          new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to tomorrow

        const plannedEndTime = bid.load.deliveryDate ||
          bid.proposedDeliveryDate ||
          new Date(plannedStartTime.getTime() + 7 * 24 * 60 * 60 * 1000); // Default to 7 days after start

        // Use bid amount as agreed price, fallback to load offered price
        const agreedPrice = bid.bidAmount || bid.load.offeredPrice || bid.load.loadValue;

        // Generate unique trip number
        const tripNumber = `TRIP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // ── Scheduling conflict check ─────────────────────────────────────
        // Verify truck AND driver are both free during the planned window
        await this.availabilityService.assertNoConflict({
          truckId,
          driverId: finalDriverId,
          pickupDateTime: plannedStartTime,
          deliveryDateTime: plannedEndTime,
          tenantId,
        });
        // ─────────────────────────────────────────────────────────────────

        // Create the trip
        const newTrip = this.tripRepository.create({
          tenantId,
          loadId: bid.loadId,
          truckId: truckId,
          driverId: finalDriverId,
          tripNumber,
          status: TripStatus.PLANNED,
          agreedPrice,
          currencyCode: bid.bidCurrency || bid.load.currencyCode || 'RWF',
          plannedStartTime,
          plannedEndTime,
        });

        const savedTrip = await this.tripRepository.save(newTrip);
        tripId = savedTrip.id;
        console.log(`Trip ${savedTrip.id} created automatically for accepted bid ${bidId}`);

        // ── Create reservation immediately after trip is saved ────────────
        try {
          await this.availabilityService.createReservation(
            tenantId,
            savedTrip.id,
            bid.loadId,
            truckId,
            finalDriverId,
            plannedStartTime,
            plannedEndTime,
          );
        } catch (reservationError: any) {
          console.error(`Failed to create reservation for trip ${savedTrip.id}:`, reservationError);
          // Non-fatal: trip is created, reservation will be backfilled
        }
        // ─────────────────────────────────────────────────────────────────
      } catch (tripError: any) {
        // Log error but don't fail bid acceptance
        // Trip creation is important but shouldn't block the bid acceptance
        console.error(`Failed to create trip for accepted bid ${bidId}:`, tripError);
        // You might want to throw here if trip creation is critical
        // throw new BadRequestException(`Failed to create trip: ${tripError.message}`);
      }
    } else {
      console.log(`Trip ${existingTrip.id} already exists for load ${bid.loadId}`);
    }

    // Send notifications
    try {
      // Emit event for notification system
      const winnerProfile = await this.userProfileRepository.findOne({
        where: { userId: bid.truckOwnerId },
      });
      const winnerName = winnerProfile && winnerProfile.firstName
        ? `${winnerProfile.firstName} ${winnerProfile.lastName || ''}`.trim()
        : 'A truck owner';

      const cargoOwnerProfile = await this.userProfileRepository.findOne({
        where: { userId: bid.load.cargoOwnerId },
      });
      const cargoOwnerName = cargoOwnerProfile && cargoOwnerProfile.firstName
        ? `${cargoOwnerProfile.firstName} ${cargoOwnerProfile.lastName || ''}`.trim()
        : 'Cargo owner';

      const auction = await this.auctionRepository.findOne({
        where: { loadId: bid.loadId },
      });

      this.eventEmitter.emit('auction.winner.selected', {
        auctionId: auction?.id || bid.loadId,
        winnerId: bid.truckOwnerId,
        winnerName,
        cargoOwnerId: bid.load.cargoOwnerId,
        cargoOwnerName,
        tenantId,
        winningBid: bid.bidAmount,
        cargoTitle: bid.load.title || bid.load.cargoType,
      });
    } catch (error) {
      console.error('Failed to emit auction.winner.selected event:', error);
    }

    // Send notifications (legacy - can be removed once event system is verified)
    try {
      // 1. Notify Truck Owner
      await this.notificationService.createNotification({
        recipientId: bid.truckOwnerId,
        tenantId,
        title: 'Bid Accepted!',
        message: `Your bid for cargo "${bid.load.title}" has been accepted. A trip has been created.`,
        notificationType: NotificationType.GENERAL,
        category: NotificationCategory.FINANCIAL,
        channels: [NotificationChannel.IN_APP],
        entityType: EntityType.TRIP,
        entityId: tripId || bid.id,
        requiresAction: true,
        actionUrl: tripId ? `/dashboard/trips` : `/dashboard/bidding`,
        actionText: 'View Trip',
      });

      // 2. Notify Driver
      if (finalDriverId) {
        const driverEntity = await this.driverRepository.findOne({ where: { id: finalDriverId } });
        if (driverEntity && driverEntity.userId) {
          await this.notificationService.createNotification({
            recipientId: driverEntity.userId,
            tenantId,
            title: 'New Trip Assignment',
            message: `Bid accepted! You have been assigned to load "${bid.load.title}".`,
            notificationType: NotificationType.GENERAL,
            category: NotificationCategory.TRIP,
            channels: [NotificationChannel.IN_APP],
            entityType: EntityType.TRIP,
            entityId: tripId || bid.id,
            requiresAction: true,
            actionUrl: `/dashboard/driver/trips?tripId=${tripId}`,
            actionText: 'View Trip',
          });
        }
      }
    } catch (notificationError) {
      console.error('Failed to send bid acceptance notifications:', notificationError);
    }

    return bid;
  }

  /**
   * Check if load has an active broker contract that prevents cargo owner actions
   */
  private async hasActiveBrokerContract(loadId: string, tenantId: string): Promise<boolean> {
    const contract = await this.contractRepository.findOne({
      where: {
        loadId,
        tenantId,
        status: ContractStatus.ACTIVE,
      },
    });
    return !!contract;
  }

  async createAuction(
    createAuctionDto: CreateAuctionDto,
    cargoOwnerId: string,
    tenantId: string,
    userRole?: UserRole,
  ): Promise<Auction> {
    // 1. Fetch load without strict tenant filter first to check existence
    const load = await this.loadRepository.findOne({
      where: { id: createAuctionDto.loadId },
      relations: ['broker'],
    });

    if (!load) {
      throw new NotFoundException(`Load with ID "${createAuctionDto.loadId}" not found. Please verify the load ID and try again.`);
    }

    // 2. Validate permissions based on role

    // CASE A: Cargo Owner (or unspecified role, assumed owner)
    if (userRole === UserRole.CARGO_OWNER || !userRole) {
      // Must belong to the same tenant
      if (load.tenantId !== tenantId) {
        throw new NotFoundException('Load not found'); // Hide existence across tenants
      }

      // Check if load has a broker assigned
      if (load.brokerId) {
        // Check if there's an active broker contract
        const hasActiveContract = await this.hasActiveBrokerContract(
          createAuctionDto.loadId,
          tenantId,
        );

        if (hasActiveContract) {
          throw new ForbiddenException(
            'Cannot create auction: This load is currently managed by a broker. The assigned broker must create the auction.',
          );
        }
      }

      // Verify cargo owner owns the load
      if (load.cargoOwnerId !== cargoOwnerId) {
        throw new ForbiddenException('You do not have permission to create an auction for this load. Only the load owner can create auctions.');
      }
    }
    // CASE B: Broker
    else if (userRole === UserRole.BROKER) {
      // cargoOwnerId in this context is the broker's userId when called by broker
      if (!load.brokerId || load.brokerId !== cargoOwnerId) {
        throw new ForbiddenException(
          'You are not assigned as the broker for this load. Only the assigned broker can create auctions.',
        );
      }

      // Check if broker has an active contract - use load.tenantId for contract check
      const hasActiveContract = await this.contractRepository.findOne({
        where: {
          loadId: createAuctionDto.loadId,
          status: In([ContractStatus.ACTIVE, ContractStatus.SIGNED, ContractStatus.PENDING_SIGNATURE]),
        },
      });

      if (!hasActiveContract) {
        throw new ForbiddenException(
          'Cannot create auction: You must have an active contract to create auctions for this load.',
        );
      }
    }

    if (![LoadStatus.CREATED, LoadStatus.PUBLISHED, LoadStatus.ASSIGNED].includes(load.status)) {
      throw new BadRequestException(
        `Cannot create auction: Load status is "${load.status}". Load must be in CREATED, PUBLISHED, or ASSIGNED status to create an auction.`,
      );
    }

    // Check if auction already exists (including soft-deleted ones)
    const existingAuction = await this.auctionRepository.findOne({
      where: { loadId: createAuctionDto.loadId },
      withDeleted: true, // Include soft-deleted auctions
    });

    if (existingAuction) {
      // If auction exists and is NOT deleted, provide helpful error message
      if (!existingAuction.deletedAt) {
        throw new BadRequestException(
          `An auction already exists for this load (Auction ID: ${existingAuction.id}, Status: ${existingAuction.status}). Please delete the existing auction first or use a different load.`
        );
      }
      
      // If auction was soft-deleted, hard delete it to allow creating a new one
      await this.auctionRepository.remove(existingAuction);
    }

    // Determine auction status based on start time.
    // auctionStart is always sent as a UTC ISO string from the frontend,
    // so this comparison is timezone-safe.
    const now = new Date();
    const auctionStart = createAuctionDto.auctionStart
      ? new Date(createAuctionDto.auctionStart)
      : now;
    const auctionStatus = auctionStart <= now
      ? AuctionStatus.ACTIVE
      : AuctionStatus.SCHEDULED;

    const auction = this.auctionRepository.create({
      ...createAuctionDto,
      auctionType: createAuctionDto.auctionType || AuctionType.REVERSE,
      status: auctionStatus,
    });

    const savedAuction = await this.auctionRepository.save(auction);

    // Notify same-tenant truck owners to bid (fire-and-forget via event)
    try {
      const origin =
        load.origin?.city ||
        load.origin?.address ||
        (load as any).pickupLocation?.locationData?.city ||
        (load as any).pickupLocation?.locationData?.name ||
        'TBD';
      const destination =
        load.destination?.city ||
        load.destination?.address ||
        (load as any).deliveryLocation?.locationData?.city ||
        (load as any).deliveryLocation?.locationData?.name ||
        'TBD';

      this.eventEmitter.emit('auction.created', {
        auctionId: savedAuction.id,
        loadId: load.id,
        tenantId: load.tenantId,
        cargoOwnerId: load.cargoOwnerId,
        cargoTitle: load.title || load.cargoType || 'Cargo',
        route: `${origin} → ${destination}`,
        auctionStart: savedAuction.auctionStart,
        auctionEnd: savedAuction.auctionEnd,
        reservePrice: savedAuction.reservePrice,
        currency: load.currencyCode || 'KES',
        status: savedAuction.status,
      });
    } catch (error) {
      console.error('Failed to emit auction.created event:', error);
    }

    return savedAuction;
  }

  async updateAuction(
    auctionId: string,
    updates: Partial<CreateAuctionDto>,
    cargoOwnerId: string,
    tenantId: string,
    userRole?: UserRole,
  ): Promise<Auction> {
    const auction = await this.auctionRepository.findOne({
      where: { id: auctionId },
      relations: ['load'],
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    // Role-based validation
    if (userRole === UserRole.CARGO_OWNER || !userRole) {
      if (auction.load.tenantId !== tenantId) {
        throw new NotFoundException('Auction not found');
      }
      if (auction.load.cargoOwnerId !== cargoOwnerId) {
        throw new ForbiddenException('You do not have permission to edit this auction');
      }
    } else if (userRole === UserRole.BROKER) {
      if (!auction.load.brokerId || auction.load.brokerId !== cargoOwnerId) {
        throw new ForbiddenException('Broker is not assigned to this load');
      }
    }

    if (auction.status === AuctionStatus.CLOSED || auction.status === AuctionStatus.CANCELLED) {
      throw new BadRequestException(`Cannot edit a ${auction.status.toLowerCase()} auction`);
    }

    // Only allow editing certain fields
    const allowedUpdates: Partial<Auction> = {};
    if (updates.auctionEnd !== undefined) {
      const newEnd = new Date(updates.auctionEnd);
      if (newEnd <= new Date()) {
        throw new BadRequestException('Auction end time must be in the future');
      }
      allowedUpdates.auctionEnd = newEnd;
    }
    if (updates.auctionStart !== undefined && auction.status === AuctionStatus.SCHEDULED) {
      allowedUpdates.auctionStart = new Date(updates.auctionStart);
      // Re-evaluate status — auctionStart is a UTC ISO string so comparison is timezone-safe
      allowedUpdates.status = allowedUpdates.auctionStart <= new Date()
        ? AuctionStatus.ACTIVE
        : AuctionStatus.SCHEDULED;
    }
    if (updates.reservePrice !== undefined) {
      allowedUpdates.reservePrice = updates.reservePrice;
    }
    if (updates.minimumBidIncrement !== undefined) {
      allowedUpdates.minimumBidIncrement = updates.minimumBidIncrement;
    }
    if (updates.maximumBidAmount !== undefined) {
      allowedUpdates.maximumBidAmount = updates.maximumBidAmount;
    }

    await this.auctionRepository.update(auctionId, allowedUpdates);

    return this.auctionRepository.findOne({
      where: { id: auctionId },
      relations: ['load'],
    });
  }

  async deleteAuction(
    auctionId: string,
    cargoOwnerId: string,
    tenantId: string,
    userRole?: UserRole,
  ): Promise<void> {
    const auction = await this.auctionRepository.findOne({
      where: { id: auctionId },
      relations: ['load'],
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    // Role-based validation
    if (userRole === UserRole.CARGO_OWNER || !userRole) {
      if (auction.load.tenantId !== tenantId) {
        throw new NotFoundException('Auction not found');
      }
      if (auction.load.cargoOwnerId !== cargoOwnerId) {
        throw new ForbiddenException('You do not have permission to delete an auction for this load');
      }

      const hasActiveContract = await this.hasActiveBrokerContract(
        auction.load.id,
        tenantId,
      );

      if (hasActiveContract && auction.load.brokerId) {
        throw new ForbiddenException('Cannot delete auction: Load is managed by a broker.');
      }
    } else if (userRole === UserRole.BROKER) {
      if (!auction.load.brokerId || auction.load.brokerId !== cargoOwnerId) {
        throw new ForbiddenException('Broker is not assigned to this load');
      }
    }

    if (auction.status === AuctionStatus.CLOSED) {
      throw new BadRequestException('Cannot delete a closed auction');
    }

    // Soft delete the auction
    await this.auctionRepository.softDelete(auctionId);
  }

  async getAuctionForLoad(
    loadId: string,
    tenantId: string,
  ): Promise<Auction | null> {
    return this.auctionRepository.findOne({
      where: { loadId },
      relations: ['load'],
    });
  }

  async getAuctions(tenantId: string, status?: string, userId?: string, role?: string): Promise<Auction[]> {
    // Build query to filter by tenantId through load relationship and include cargo owner with profile
    // Note: Using relation name directly without alias to ensure proper mapping
    const queryBuilder = this.auctionRepository
      .createQueryBuilder('auction')
      .leftJoinAndSelect('auction.load', 'load')
      .leftJoinAndSelect('load.cargoOwner', 'cargoOwner')
      .leftJoinAndSelect('cargoOwner.profile', 'profile');

    if ((role === UserRole.BROKER || role === 'BROKER') && userId) {
      // Brokers only see auctions for loads they are assigned to
      queryBuilder.where('load.brokerId = :userId', { userId });
    } else if ((role === UserRole.CARGO_OWNER || role === 'CARGO_OWNER') && userId) {
      // Cargo owners only see auctions for their own loads
      queryBuilder.where('load.tenantId = :tenantId AND load.cargoOwnerId = :userId', { tenantId, userId });
    } else {
      queryBuilder.where('load.tenantId = :tenantId', { tenantId });
    }

    if (status && status !== 'all') {
      queryBuilder.andWhere('auction.status = :status', { status });
    }

    queryBuilder.orderBy('auction.createdAt', 'DESC');

    const auctions = await queryBuilder.getMany();

    // Enrich loads with location data from Location entities if locations array is empty
    for (const auction of auctions) {
      if (auction.load && (!auction.load.locations || auction.load.locations.length === 0)) {
        // Try to populate origin/destination from Location entities
        const loadEntity = auction.load as any;
        
        // Get pickup location if pickupLocationId exists
        if (loadEntity.pickupLocationId) {
          try {
            const pickupLoc = await this.locationRepository.findOne({
              where: { id: loadEntity.pickupLocationId },
            });
            if (pickupLoc) {
              auction.load.origin = {
                address: pickupLoc.address || '',
                city: pickupLoc.city || '',
                state: pickupLoc.state,
                postalCode: pickupLoc.postalCode,
                country: pickupLoc.country || '',
                lat: pickupLoc.latitude,
                lng: pickupLoc.longitude,
              };
            }
          } catch (err) {
            console.warn('Failed to load pickup location:', err);
          }
        }
        
        // Get delivery location if deliveryLocationId exists
        if (loadEntity.deliveryLocationId) {
          try {
            const deliveryLoc = await this.locationRepository.findOne({
              where: { id: loadEntity.deliveryLocationId },
            });
            if (deliveryLoc) {
              auction.load.destination = {
                address: deliveryLoc.address || '',
                city: deliveryLoc.city || '',
                state: deliveryLoc.state,
                postalCode: deliveryLoc.postalCode,
                country: deliveryLoc.country || '',
                lat: deliveryLoc.latitude,
                lng: deliveryLoc.longitude,
              };
            }
          } catch (err) {
            console.warn('Failed to load delivery location:', err);
          }
        }
      }
    }

    // Log for debugging - check if profile data is loaded
    if (auctions.length > 0 && auctions[0].load) {
      const firstLoad = auctions[0].load;
      console.log('🔍 First auction load ID:', firstLoad.id);
      console.log('🔍 First auction load title:', firstLoad.title);
      console.log('🔍 First auction cargo owner ID:', firstLoad.cargoOwnerId);
      if (firstLoad.cargoOwner) {
        console.log('🔍 Cargo owner exists:', !!firstLoad.cargoOwner);
        console.log('🔍 Cargo owner ID:', firstLoad.cargoOwner.id);
        console.log('🔍 Cargo owner email:', firstLoad.cargoOwner.email);
        console.log('🔍 Cargo owner keys:', Object.keys(firstLoad.cargoOwner));
        console.log('🔍 Cargo owner profile exists:', !!firstLoad.cargoOwner.profile);
        console.log('🔍 Cargo owner full object:', JSON.stringify(firstLoad.cargoOwner, null, 2));
        if (firstLoad.cargoOwner.profile) {
          console.log('🔍 Profile firstName:', firstLoad.cargoOwner.profile.firstName);
          console.log('🔍 Profile lastName:', firstLoad.cargoOwner.profile.lastName);
          console.log('🔍 Profile full object:', JSON.stringify(firstLoad.cargoOwner.profile, null, 2));
        } else {
          console.warn('⚠️ Profile is null/undefined for cargo owner:', firstLoad.cargoOwner.id);
          // Try to find profile directly
          const directProfile = await this.userProfileRepository.findOne({
            where: { userId: firstLoad.cargoOwner.id },
          });
          console.log('🔍 Direct profile lookup result:', directProfile ? JSON.stringify(directProfile, null, 2) : 'NOT FOUND');
        }
      } else {
        console.warn('⚠️ Cargo owner is null/undefined for load:', firstLoad.id);
      }
    }
    // Ensure profiles are loaded for all cargo owners (fallback if join didn't work)
    for (const a of auctions) {
      if (a.load?.cargoOwner) {
        // Always try to load profile if it's missing or incomplete
        if (!a.load.cargoOwner.profile || !a.load.cargoOwner.profile.firstName) {
          try {
            const profile = await this.userProfileRepository.findOne({
              where: { userId: a.load.cargoOwner.id },
            });
            if (profile) {
              a.load.cargoOwner.profile = profile;
              console.log(`✅ Loaded profile for cargo owner ${a.load.cargoOwner.id}:`, {
                firstName: profile.firstName,
                lastName: profile.lastName,
              });
            } else {
              console.warn(`⚠️ No profile found in database for cargo owner:`, a.load.cargoOwner.id);
            }
          } catch (err) {
            console.warn('Failed to load profile for cargo owner:', a.load.cargoOwner.id, err);
          }
        } else {
          console.log(`✅ Profile already loaded for cargo owner ${a.load.cargoOwner.id}:`, {
            firstName: a.load.cargoOwner.profile.firstName,
            lastName: a.load.cargoOwner.profile.lastName,
          });
        }
      }

      // Enrich with viewer stats using watch count as unique viewers proxy
      try {
        const watchCount = await this.watchRepository.count({
          where: { auctionId: a.id, tenantId },
        });
        const viewCount = await this.viewRepository.count({
          where: { auctionId: a.id, tenantId },
        });
        a.analytics = {
          ...(a.analytics || {}),
          uniqueViewers: viewCount,
          viewCount: Math.max(viewCount, (a.analytics as any)?.viewCount || 0),
        } as any;
      } catch { }
    }
    return auctions;
  }

  async recordView(
    auctionId: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const existing = await this.viewRepository.findOne({
      where: { auctionId, viewerId: userId, tenantId },
    });
    if (existing) return;
    const rec = this.viewRepository.create({
      auctionId,
      viewerId: userId,
      tenantId,
    });
    await this.viewRepository.save(rec);
    // Optionally bump analytics.viewCount
    await this.auctionRepository.update(
      { id: auctionId },
      {
        analytics: {
          viewCount:
            ((
              await this.auctionRepository.findOne({ where: { id: auctionId } })
            )?.analytics?.viewCount || 0) + 1,
        },
      },
    );
  }

  async watchAuction(
    auctionId: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const existing = await this.watchRepository.findOne({
      where: { auctionId, watcherId: userId, tenantId },
    });
    if (existing) return;
    const record = this.watchRepository.create({
      auctionId,
      watcherId: userId,
      tenantId,
    });
    await this.watchRepository.save(record);
  }

  async unwatchAuction(
    auctionId: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    await this.watchRepository.delete({
      auctionId,
      watcherId: userId,
      tenantId,
    });
  }

  async getWatchedAuctions(
    userId: string,
    tenantId: string,
  ): Promise<Auction[]> {
    const watches = await this.watchRepository.find({
      where: { watcherId: userId, tenantId },
    });
    const ids = watches.map((w) => w.auctionId);
    if (ids.length === 0) return [];
    return this.auctionRepository.find({
      where: ids.map((id) => ({ id })),
      relations: ['load'],
    });
  }

  async getInactiveAuctions(
    userId: string,
    tenantId: string,
    userRole?: UserRole,
  ): Promise<Auction[]> {
    const queryBuilder = this.auctionRepository
      .createQueryBuilder('auction')
      .leftJoinAndSelect('auction.load', 'load')
      .where('auction.deletedAt IS NOT NULL')
      .withDeleted(); // Include soft-deleted records

    // Filter by permissions
    if (userRole === UserRole.CARGO_OWNER || !userRole) {
      // Cargo owners see their own deleted auctions
      queryBuilder.andWhere('load.cargoOwnerId = :userId', { userId });
      queryBuilder.andWhere('load.tenantId = :tenantId', { tenantId });
    } else if (userRole === UserRole.BROKER) {
      // Brokers see deleted auctions for loads they manage
      queryBuilder.andWhere('load.brokerId = :userId', { userId });
    } else if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
      // Admins see all deleted auctions in their tenant
      queryBuilder.andWhere('load.tenantId = :tenantId', { tenantId });
    }

    queryBuilder.orderBy('auction.deletedAt', 'DESC');

    return queryBuilder.getMany();
  }

  async reactivateAuction(
    auctionId: string,
    userId: string,
    tenantId: string,
    userRole?: UserRole,
  ): Promise<Auction> {
    // Find the soft-deleted auction
    const auction = await this.auctionRepository.findOne({
      where: { id: auctionId },
      relations: ['load'],
      withDeleted: true, // Include soft-deleted records
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    if (!auction.deletedAt) {
      throw new BadRequestException('Auction is not deleted and cannot be reactivated');
    }

    // Verify permissions
    if (userRole === UserRole.CARGO_OWNER || !userRole) {
      if (auction.load.tenantId !== tenantId) {
        throw new NotFoundException('Auction not found');
      }
      if (auction.load.cargoOwnerId !== userId) {
        throw new ForbiddenException('You do not have permission to reactivate this auction');
      }
    } else if (userRole === UserRole.BROKER) {
      if (!auction.load.brokerId || auction.load.brokerId !== userId) {
        throw new ForbiddenException('You are not assigned as the broker for this load');
      }
    } else if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to reactivate auctions');
    }

    // Check if another active auction exists for this load
    const existingActiveAuction = await this.auctionRepository.findOne({
      where: { loadId: auction.loadId },
    });

    if (existingActiveAuction) {
      throw new BadRequestException(
        `Cannot reactivate: An active auction already exists for this load (Auction ID: ${existingActiveAuction.id}). Please delete the active auction first.`
      );
    }

    // Restore the auction by setting deletedAt to null
    await this.auctionRepository.restore(auctionId);

    // Update auction status based on dates
    const now = new Date();
    const auctionEnd = new Date(auction.auctionEnd);
    
    if (auctionEnd < now) {
      // Auction has expired, set to CLOSED
      auction.status = AuctionStatus.CLOSED;
    } else {
      // Auction is still valid, set to ACTIVE or SCHEDULED
      const auctionStart = new Date(auction.auctionStart);
      auction.status = auctionStart <= now ? AuctionStatus.ACTIVE : AuctionStatus.SCHEDULED;
    }

    auction.deletedAt = null;
    auction.cancelledAt = null;
    auction.cancellationReason = null;

    return this.auctionRepository.save(auction);
  }

  async getMyBids(userId: string, tenantId: string, role?: string): Promise<Bid[]> {
    // TENANT_ADMIN and ADMIN see ALL bids in their tenant
    if (role === UserRole.TENANT_ADMIN || role === UserRole.ADMIN || role === 'TENANT_ADMIN' || role === 'ADMIN') {
      return this.bidRepository
        .createQueryBuilder('bid')
        .leftJoinAndSelect('bid.load', 'load')
        .leftJoinAndSelect('load.cargoOwner', 'cargoOwner')
        .leftJoinAndSelect('cargoOwner.profile', 'cargoOwnerProfile')
        .leftJoinAndSelect('bid.truckOwner', 'truckOwner')
        .leftJoinAndSelect('truckOwner.profile', 'truckOwnerProfile')
        .where('load.tenantId = :tenantId', { tenantId })
        .orderBy('bid.createdAt', 'DESC')
        .getMany();
    }
    
    // For truck owners, return their submitted bids
    if (role === UserRole.TRUCK_OWNER || role === 'TRUCK_OWNER') {
      return this.bidRepository
        .createQueryBuilder('bid')
        .leftJoinAndSelect('bid.load', 'load')
        .leftJoinAndSelect('bid.truckOwner', 'truckOwner')
        .leftJoinAndSelect('truckOwner.profile', 'truckOwnerProfile')
        .where('bid.truckOwnerId = :userId', { userId })
        .andWhere('load.tenantId = :tenantId', { tenantId })
        .orderBy('bid.createdAt', 'DESC')
        .getMany();
    }

    // For brokers, return bids on loads they are assigned to
    if (role === UserRole.BROKER || role === 'BROKER') {
      return this.bidRepository
        .createQueryBuilder('bid')
        .leftJoinAndSelect('bid.load', 'load')
        .leftJoinAndSelect('load.cargoOwner', 'cargoOwner')
        .leftJoinAndSelect('cargoOwner.profile', 'cargoOwnerProfile')
        .leftJoinAndSelect('bid.truckOwner', 'truckOwner')
        .leftJoinAndSelect('truckOwner.profile', 'truckOwnerProfile')
        .where('load.brokerId = :userId', { userId })
        .orderBy('bid.createdAt', 'DESC')
        .getMany();
    }
    
    // For cargo owners, return bids on their loads
    return this.bidRepository
      .createQueryBuilder('bid')
      .leftJoinAndSelect('bid.load', 'load')
      .leftJoinAndSelect('load.cargoOwner', 'cargoOwner')
      .leftJoinAndSelect('cargoOwner.profile', 'cargoOwnerProfile')
      .leftJoinAndSelect('bid.truckOwner', 'truckOwner')
      .leftJoinAndSelect('truckOwner.profile', 'truckOwnerProfile')
      .where('load.cargoOwnerId = :userId', { userId })
      .andWhere('load.tenantId = :tenantId', { tenantId })
      .orderBy('bid.createdAt', 'DESC')
      .getMany();
  }

  // Admin endpoint to get all bids in the system
  async getAllBidsForAdmin(): Promise<Bid[]> {
    return this.bidRepository.find({
      relations: ['load', 'load.cargoOwner', 'load.cargoOwner.profile', 'truckOwner', 'truckOwner.profile'],
      order: { createdAt: 'DESC' },
    });
  }

  async getBidHistory(userId: string, tenantId: string, role?: string): Promise<Bid[]> {
    // TENANT_ADMIN and ADMIN see ALL bids in their tenant
    if (role === UserRole.TENANT_ADMIN || role === UserRole.ADMIN || role === 'TENANT_ADMIN' || role === 'ADMIN') {
      return this.bidRepository
        .createQueryBuilder('bid')
        .leftJoinAndSelect('bid.load', 'load')
        .leftJoinAndSelect('load.cargoOwner', 'cargoOwner')
        .leftJoinAndSelect('cargoOwner.profile', 'cargoOwnerProfile')
        .leftJoinAndSelect('bid.truckOwner', 'truckOwner')
        .leftJoinAndSelect('truckOwner.profile', 'truckOwnerProfile')
        .where('load.tenantId = :tenantId', { tenantId })
        .orderBy('bid.createdAt', 'DESC')
        .getMany();
    }
    
    // For truck owners, return their submitted bids
    if (role === UserRole.TRUCK_OWNER || role === 'TRUCK_OWNER') {
      return this.bidRepository
        .createQueryBuilder('bid')
        .leftJoinAndSelect('bid.load', 'load')
        .leftJoinAndSelect('load.cargoOwner', 'cargoOwner')
        .leftJoinAndSelect('cargoOwner.profile', 'cargoOwnerProfile')
        .leftJoinAndSelect('bid.truckOwner', 'truckOwner')
        .leftJoinAndSelect('truckOwner.profile', 'truckOwnerProfile')
        .where('bid.truckOwnerId = :userId', { userId })
        .andWhere('load.tenantId = :tenantId', { tenantId })
        .orderBy('bid.createdAt', 'DESC')
        .getMany();
    }
    
    // For cargo owners, return bids on their loads/auctions
    return this.bidRepository
      .createQueryBuilder('bid')
      .leftJoinAndSelect('bid.load', 'load')
      .leftJoinAndSelect('load.cargoOwner', 'cargoOwner')
      .leftJoinAndSelect('cargoOwner.profile', 'cargoOwnerProfile')
      .leftJoinAndSelect('bid.truckOwner', 'truckOwner')
      .leftJoinAndSelect('truckOwner.profile', 'truckOwnerProfile')
      .where('load.cargoOwnerId = :userId', { userId })
      .andWhere('load.tenantId = :tenantId', { tenantId })
      .orderBy('bid.createdAt', 'DESC')
      .getMany();
  }

  async getDashboardStats(userId: string, tenantId: string, role?: string) {
    // TENANT_ADMIN and ADMIN see ALL tenant stats
    if (role === UserRole.TENANT_ADMIN || role === UserRole.ADMIN || role === 'TENANT_ADMIN' || role === 'ADMIN') {
      const allBids = await this.bidRepository
        .createQueryBuilder('bid')
        .leftJoinAndSelect('bid.load', 'load')
        .where('load.tenantId = :tenantId', { tenantId })
        .getMany();

      const totalBids = allBids.length;
      const activeBids = allBids.filter(b => b.status === BidStatus.PENDING).length;
      const wonBids = allBids.filter(b => b.status === BidStatus.ACCEPTED).length;
      const totalValue = allBids
        .filter(b => b.status === BidStatus.ACCEPTED || b.status === BidStatus.PENDING)
        .reduce((sum, b) => sum + (parseFloat(String(b.bidAmount)) || 0), 0);

      const successRate = totalBids > 0 ? Math.round((wonBids / totalBids) * 100) : 0;

      // Total unique auctions in the tenant
      const uniqueAuctions = new Set(allBids.map(b => b.loadId)).size;

      // Calculate trends (last 7 days)
      const trends = this.calculateBidTrends(allBids);

      return {
        totalAuctions: uniqueAuctions,
        activeBids,
        totalValue,
        successRate,
        trends
      };
    }
    
    if (role === UserRole.TRUCK_OWNER || role === 'TRUCK_OWNER') {
      // Truck Owner Stats
      const myBids = await this.bidRepository
        .createQueryBuilder('bid')
        .leftJoinAndSelect('bid.load', 'load')
        .where('bid.truckOwnerId = :userId', { userId })
        .andWhere('load.tenantId = :tenantId', { tenantId })
        .getMany();

      const totalBids = myBids.length;
      const activeBids = myBids.filter(b => b.status === BidStatus.PENDING).length;
      const wonBids = myBids.filter(b => b.status === BidStatus.ACCEPTED).length;
      const totalValue = myBids
        .filter(b => b.status === BidStatus.ACCEPTED || b.status === BidStatus.PENDING)
        .reduce((sum, b) => sum + (parseFloat(String(b.bidAmount)) || 0), 0);

      const successRate = totalBids > 0 ? Math.round((wonBids / totalBids) * 100) : 0;

      // Get available active auctions for truck owners to bid on
      const activeAuctions = await this.auctionRepository
        .createQueryBuilder('auction')
        .leftJoinAndSelect('auction.load', 'load')
        .where('auction.status = :status', { status: AuctionStatus.ACTIVE })
        .andWhere('load.tenantId = :tenantId', { tenantId })
        .getMany();

      // Auctions they've already participated in
      const participatedAuctions = new Set(myBids.map(b => b.loadId)).size;

      // Calculate trends (last 7 days)
      const trends = this.calculateBidTrends(myBids);

      return {
        totalAuctions: activeAuctions.length, // Available auctions to bid on
        participatedAuctions, // Auctions they've already bid on
        activeBids, // My active bids
        totalValue, // Total value of my bids
        successRate, // My win rate
        trends
      };
    } else {
      // Broker / Cargo Owner Stats
      // They manage auctions
      // Find loads where they are owner (for Cargo Owner) or Broker

      const loads = await this.loadRepository.find({
        where: role === UserRole.BROKER || role === 'BROKER'
          ? { brokerId: userId, tenantId }
          : { cargoOwnerId: userId, tenantId }
      });

      const loadIds = loads.map(l => l.id);

      if (loadIds.length === 0) {
        return {
          totalAuctions: 0,
          activeBids: 0,
          totalValue: 0,
          successRate: 0,
          trends: []
        };
      }

      const auctions = await this.auctionRepository.find({
        where: { loadId: In(loadIds) }
      });

      // Active bids on these auctions
      const bids = await this.bidRepository.find({
        where: { loadId: In(loadIds) }
      });

      const activeBids = bids.filter(b => b.status === BidStatus.PENDING).length;
      const totalValue = loads.reduce((sum, l) => sum + (parseFloat(String(l.loadValue)) || 0), 0);

      // Success rate for owners: Auctions that resulted in a match (CLOSED with winningBidId)
      const closedAndWon = auctions.filter(a => a.status === AuctionStatus.CLOSED && a.winningBidId).length;
      const totalClosed = auctions.filter(a => a.status === AuctionStatus.CLOSED).length;

      const successRate = totalClosed > 0 ? Math.round((closedAndWon / totalClosed) * 100) : 0;

      // Calculate trends (last 7 days)
      const trends = this.calculateAuctionTrends(auctions, bids);

      return {
        totalAuctions: auctions.length,
        activeBids,
        totalValue,
        successRate,
        trends
      };
    }
  }

  private calculateBidTrends(bids: any[]) {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayBids = bids.filter(b => {
        const bidDate = new Date(b.createdAt).toISOString().split('T')[0];
        return bidDate === date;
      });

      const avgAmount = dayBids.length > 0
        ? dayBids.reduce((sum, b) => sum + (parseFloat(String(b.bidAmount)) || 0), 0) / dayBids.length
        : 0;

      return {
        date,
        bids: dayBids.length,
        avgAmount: Math.round(avgAmount),
        won: dayBids.filter(b => b.status === BidStatus.ACCEPTED).length
      };
    });
  }

  private calculateAuctionTrends(auctions: any[], bids: any[]) {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayAuctions = auctions.filter(a => {
        const auctionDate = new Date(a.createdAt).toISOString().split('T')[0];
        return auctionDate === date;
      });

      const dayBids = bids.filter(b => {
        const bidDate = new Date(b.createdAt).toISOString().split('T')[0];
        return bidDate === date;
      });

      const avgBidsPerAuction = dayAuctions.length > 0
        ? dayBids.length / dayAuctions.length
        : 0;

      return {
        date,
        auctions: dayAuctions.length,
        bids: dayBids.length,
        avgBidsPerAuction: Math.round(avgBidsPerAuction * 10) / 10
      };
    });
  }

  private async getCurrentHighestBid(loadId: string): Promise<number | null> {
    const highestBid = await this.bidRepository.findOne({
      where: { loadId, status: BidStatus.PENDING },
      order: { bidAmount: 'DESC' },
    });

    return highestBid?.bidAmount || null;
  }

  private calculateSuccessProbability(bid: Bid, load: Load) {
    // Simple calculation based on bid amount vs load value
    const baseProbability = Math.min(bid.bidAmount / load.loadValue, 1.0);

    // Adjust based on market conditions, truck owner rating, etc.
    // This is a simplified version - in production, use ML models
    return Math.max(0.1, Math.min(0.95, baseProbability));
  }

  private calculateRiskAssessment(bid: Bid, load: Load) {
    // Calculate risk factors
    const riskFactors = [];
    let riskScore = 0;

    // Distance risk
    if (bid.bidDetails?.routeOptimization?.estimatedDistance > 1000) {
      riskFactors.push('LONG_DISTANCE');
      riskScore += 0.2;
    }

    // Equipment risk
    if (
      load.requiresRefrigeration &&
      !bid.bidDetails?.truckSpecifications?.hasRefrigeration
    ) {
      riskFactors.push('MISSING_EQUIPMENT');
      riskScore += 0.3;
    }

    // Price risk
    if (bid.bidAmount < load.loadValue * 0.8) {
      riskFactors.push('LOW_PRICE');
      riskScore += 0.2;
    }

    return {
      riskScore: Math.min(1.0, riskScore),
      riskFactors,
      mitigationStrategies: this.generateMitigationStrategies(riskFactors),
    };
  }

  private async calculateMarketContext(loadId: string): Promise<any> {
    // Get market data for this load
    const bids = await this.bidRepository.find({
      where: { loadId },
      select: ['bidAmount'],
    });

    const bidAmounts = bids.map((b) => b.bidAmount);
    const averageBid =
      bidAmounts.length > 0
        ? bidAmounts.reduce((a, b) => a + b, 0) / bidAmounts.length
        : 0;

    return {
      marketRate: averageBid,
      competitorBids: bidAmounts.length,
      demandLevel: this.calculateDemandLevel(bidAmounts.length),
      supplyLevel: this.calculateSupplyLevel(bidAmounts.length),
    };
  }

  private async updateAuctionAnalytics(loadId: string): Promise<void> {
    const bids = await this.bidRepository.find({
      where: { loadId },
      select: ['bidAmount', 'truckOwnerId', 'createdAt'],
    });

    const uniqueBidders = new Set(bids.map((b) => b.truckOwnerId)).size;
    const averageBid =
      bids.length > 0
        ? bids.reduce((sum, b) => sum + b.bidAmount, 0) / bids.length
        : 0;

    await this.auctionRepository.update(
      { loadId },
      {
        totalBids: bids.length,
        uniqueBidders,
        currentHighestBid:
          bids.length > 0 ? Math.max(...bids.map((b) => b.bidAmount)) : null,
        analytics: {
          averageBidAmount: averageBid,
          bidDistribution: this.calculateBidDistribution(
            bids.map((b) => b.bidAmount),
          ),
        },
      },
    );
  }

  private generateMitigationStrategies(riskFactors: string[]): string[] {
    const strategies: string[] = [];

    if (riskFactors.includes('LONG_DISTANCE')) {
      strategies.push('BREAK_JOURNEY_INTO_SEGMENTS');
    }

    if (riskFactors.includes('MISSING_EQUIPMENT')) {
      strategies.push('VERIFY_EQUIPMENT_CAPABILITIES');
    }

    if (riskFactors.includes('LOW_PRICE')) {
      strategies.push('NEGOTIATE_ADDITIONAL_SERVICES');
    }

    return strategies;
  }

  private calculateDemandLevel(bidCount: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (bidCount >= 5) return 'HIGH';
    if (bidCount >= 2) return 'MEDIUM';
    return 'LOW';
  }

  private calculateSupplyLevel(bidCount: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (bidCount >= 5) return 'HIGH';
    if (bidCount >= 2) return 'MEDIUM';
    return 'LOW';
  }

  private calculateBidDistribution(
    bidAmounts: number[],
  ): Record<string, number> {
    if (bidAmounts.length === 0) return {};

    const min = Math.min(...bidAmounts);
    const max = Math.max(...bidAmounts);
    const range = max - min;
    const bucketSize = range / 5;

    const distribution: Record<string, number> = {};

    bidAmounts.forEach((amount) => {
      const bucket = Math.floor((amount - min) / bucketSize);
      const bucketKey = `${bucket * bucketSize + min}-${(bucket + 1) * bucketSize + min}`;
      distribution[bucketKey] = (distribution[bucketKey] || 0) + 1;
    });

    return distribution;
  }
}
