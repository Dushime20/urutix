import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Bid, BidStatus } from '../../entities/bid.entity';
import {
  Auction,
  AuctionStatus,
  AuctionType,
} from '../../entities/auction.entity';
import { Load, LoadStatus } from '../../entities/load.entity';
import { User, UserRole } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Truck } from '../../entities/truck.entity';
import { Driver } from '../../entities/driver.entity';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { AuctionWatch } from '../../entities/auction-watch.entity';
import { AuctionView } from '../../entities/auction-view.entity';
import { LoadContract, ContractStatus } from '../../entities/load-contract.entity';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType, EntityType, NotificationCategory, NotificationChannel } from '../../entities/notification.entity';

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
    private readonly notificationService: NotificationService,
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

    // Validate bid amount
    if (createBidDto.bidAmount <= 0) {
      throw new BadRequestException('Bid amount must be greater than 0');
    }

    if (auction.reservePrice && createBidDto.bidAmount < auction.reservePrice) {
      throw new BadRequestException(
        `Bid amount must be at least ${auction.reservePrice}`,
      );
    }

    if (
      auction.maximumBidAmount &&
      createBidDto.bidAmount > auction.maximumBidAmount
    ) {
      throw new BadRequestException(
        `Bid amount cannot exceed ${auction.maximumBidAmount}`,
      );
    }

    // Check minimum bid increment
    if (auction.minimumBidIncrement) {
      const currentHighestBid = await this.getCurrentHighestBid(
        createBidDto.loadId,
      );
      if (
        currentHighestBid &&
        createBidDto.bidAmount <=
        currentHighestBid + auction.minimumBidIncrement
      ) {
        throw new BadRequestException(
          `Bid must be at least ${auction.minimumBidIncrement} more than current highest bid`,
        );
      }
    }

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

    // Create bid
    const bid = this.bidRepository.create({
      ...createBidDto,
      truckOwnerId,
      status: BidStatus.PENDING,
      bidCurrency: createBidDto.bidCurrency || 'USD',
      requireAdvancePayment: createBidDto.requireAdvancePayment !== undefined
        ? createBidDto.requireAdvancePayment
        : true, // Default to true if not specified
    });

    // Calculate success probability and risk assessment
    bid.successProbability = await this.calculateSuccessProbability(bid, load);
    bid.riskAssessment = await this.calculateRiskAssessment(bid, load);
    bid.marketContext = await this.calculateMarketContext(createBidDto.loadId);

    const savedBid = await this.bidRepository.save(bid);

    // Update auction analytics
    await this.updateAuctionAnalytics(createBidDto.loadId);

    // Send Notification to Cargo Owner
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

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException('Cannot accept bid that is not pending');
    }

    bid.status = BidStatus.ACCEPTED;
    const acceptedBid = await this.bidRepository.save(bid);

    // Get truck ID from bid details
    const truckId = bid.bidDetails?.truckSpecifications?.truckId;

    if (!truckId) {
      throw new BadRequestException('Bid must include a truck specification');
    }

    // Verify truck exists and belongs to the truck owner
    const truck = await this.truckRepository.findOne({
      where: { id: truckId, ownerId: bid.truckOwnerId, tenantId },
    });

    if (!truck) {
      throw new NotFoundException('Truck specified in bid not found or does not belong to the truck owner');
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
          where: { id: driverId, tenantId },
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
        // Get driver ID - use from bid details or assign a default driver from the truck
        finalDriverId = driverId;
        if (!finalDriverId) {
          // Try to get the first assigned driver from the truck
          if (truck.assignedDrivers && Array.isArray(truck.assignedDrivers) && truck.assignedDrivers.length > 0) {
            finalDriverId = truck.assignedDrivers[0].driverId;
          } else {
            // If no driver is specified, we'll need to handle this case
            // For now, we'll create the trip without a driver and it can be assigned later
            // Or we could throw an error requiring a driver
            throw new BadRequestException(
              'Driver must be specified in bid details or assigned to the truck before accepting the bid',
            );
          }
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

    return acceptedBid;
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
      throw new NotFoundException('Load not found');
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
            'Cannot create auction: Load is managed by a broker. The broker must create the auction.',
          );
        }
      }

      // Verify cargo owner owns the load
      if (load.cargoOwnerId !== cargoOwnerId) {
        throw new ForbiddenException('You do not have permission to create an auction for this load');
      }
    }
    // CASE B: Broker
    else if (userRole === UserRole.BROKER) {
      // cargoOwnerId in this context is the broker's userId when called by broker
      if (!load.brokerId || load.brokerId !== cargoOwnerId) {
        throw new ForbiddenException(
          'Broker is not assigned to this load',
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
          'Broker must have an active contract to create auctions for this load',
        );
      }
    }

    if (![LoadStatus.CREATED, LoadStatus.PUBLISHED, LoadStatus.ASSIGNED].includes(load.status)) {
      throw new BadRequestException(
        'Load must be created, published or assigned to create an auction',
      );
    }

    // Check if auction already exists
    const existingAuction = await this.auctionRepository.findOne({
      where: { loadId: createAuctionDto.loadId },
    });

    if (existingAuction) {
      throw new BadRequestException('Auction already exists for this load');
    }

    // Determine auction status based on start time
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

    return this.auctionRepository.save(auction);
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
       // Brokers see auctions in their tenant OR auctions for loads they manage
       queryBuilder.where('(load.tenantId = :tenantId OR load.brokerId = :userId)', { tenantId, userId });
    } else {
       queryBuilder.where('load.tenantId = :tenantId', { tenantId });
    }

    if (status && status !== 'all') {
      queryBuilder.andWhere('auction.status = :status', { status });
    }

    queryBuilder.orderBy('auction.createdAt', 'DESC');

    const auctions = await queryBuilder.getMany();

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

  async getMyBids(userId: string, _tenantId: string, role?: string): Promise<Bid[]> {
    // For truck owners, return their submitted bids
    if (role === UserRole.TRUCK_OWNER || role === 'TRUCK_OWNER') {
      return this.bidRepository.find({
        where: { truckOwnerId: userId },
        relations: ['load', 'truckOwner', 'truckOwner.profile'],
        order: { createdAt: 'DESC' },
      });
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
      .orderBy('bid.createdAt', 'DESC')
      .getMany();
  }

  async getBidHistory(userId: string, tenantId: string, role?: string): Promise<Bid[]> {
    // For truck owners, return their submitted bids
    if (role === UserRole.TRUCK_OWNER || role === 'TRUCK_OWNER') {
      return this.bidRepository.find({
        where: { truckOwnerId: userId },
        relations: ['load', 'load.cargoOwner', 'load.cargoOwner.profile', 'truckOwner', 'truckOwner.profile'],
        order: { createdAt: 'DESC' },
      });
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
    if (role === UserRole.TRUCK_OWNER || role === 'TRUCK_OWNER') {
       // Truck Owner Stats
       const myBids = await this.bidRepository.find({
         where: { truckOwnerId: userId },
         relations: ['load'],
       });

       const totalBids = myBids.length;
       const activeBids = myBids.filter(b => b.status === BidStatus.PENDING).length;
       const wonBids = myBids.filter(b => b.status === BidStatus.ACCEPTED).length;
       const totalValue = myBids
         .filter(b => b.status === BidStatus.ACCEPTED || b.status === BidStatus.PENDING)
         .reduce((sum, b) => sum + (b.bidAmount || 0), 0);
       
       const successRate = totalBids > 0 ? Math.round((wonBids / totalBids) * 100) : 0;
       
       // For truck owners, 'totalAuctions' implies auctions they participated in
       const uniqueAuctions = new Set(myBids.map(b => b.loadId)).size;

       return {
         totalAuctions: uniqueAuctions,
         activeBids,
         totalValue,
         successRate
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
           successRate: 0
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
       const totalValue = loads.reduce((sum, l) => sum + (l.loadValue || 0), 0);
       
       // Success rate for owners: Auctions that resulted in a match (CLOSED with winningBidId)
       const closedAndWon = auctions.filter(a => a.status === AuctionStatus.CLOSED && a.winningBidId).length;
       const totalClosed = auctions.filter(a => a.status === AuctionStatus.CLOSED).length;
       
       const successRate = totalClosed > 0 ? Math.round((closedAndWon / totalClosed) * 100) : 0;

       return {
         totalAuctions: auctions.length,
         activeBids,
         totalValue,
         successRate
       };
    }
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
