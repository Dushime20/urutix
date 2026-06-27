import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import {
  BiddingService,
  CreateBidDto,
  CreateAuctionDto,
} from './bidding.service';
import { Bid } from '../../entities/bid.entity';
import { Auction } from '../../entities/auction.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { errorMessage } from '../../utils/error';
import { UserRole } from '../../entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AvailabilityService } from '../availability/availability.service';

@ApiTags('Bidding & Auctions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('bidding')
export class BiddingController {
  constructor(
    private readonly biddingService: BiddingService,
    private readonly eventEmitter: EventEmitter2,
    private readonly availabilityService: AvailabilityService,
  ) { }

  @Get('test')
  @ApiOperation({
    summary: 'Test bidding endpoint',
    description: 'Simple test endpoint to verify bidding controller is working',
  })
  @ApiResponse({
    status: 200,
    description: 'Bidding controller is working',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  })
  test() {
    return {
      message: 'Bidding controller is working!',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test-db')
  @ApiOperation({
    summary: 'Test database connection for auctions',
    description:
      'Test endpoint to check if Auction entity and database connection are working',
  })
  @ApiResponse({
    status: 200,
    description: 'Database connection test result',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        auctionCount: { type: 'number' },
        timestamp: { type: 'string' },
      },
    },
  })
  async testDatabase(
    @Request() req: any,
  ): Promise<{
    message: string;
    auctionCount: number;
    timestamp: string;
  }> {
    try {
      const auctionCount = await this.biddingService.getAuctions(
        req.user?.tenantId,
      );
      return {
        message: 'Database connection successful',
        auctionCount: auctionCount.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message = errorMessage(error, 'test-db');
      return {
        message,
        auctionCount: -1,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ─── Availability pre-check ─────────────────────────────────────────────────

  @Post('check-availability')
  @ApiOperation({
    summary: 'Check truck/driver availability before submitting a bid',
    description:
      'Truck owners call this BEFORE submitting a bid to find out whether their ' +
      'chosen truck and/or driver are free during the proposed shipment window. ' +
      'Returns a list of conflicts (if any) so the truck owner can choose a ' +
      'different resource before placing the bid.',
  })
  @ApiResponse({ status: 200, description: 'Availability check result' })
  async checkBidAvailability(
    @Body()
    body: {
      truckId?: string;
      driverId?: string;
      pickupDateTime: string;
      deliveryDateTime: string;
    },
    @Request() req,
  ) {
    const { truckId, driverId, pickupDateTime, deliveryDateTime } = body;
    const tenantId = req.user.tenantId;

    if (!pickupDateTime || !deliveryDateTime) {
      throw new BadRequestException('pickupDateTime and deliveryDateTime are required');
    }

    const conflicts = await this.availabilityService.findConflicts({
      truckId,
      driverId,
      pickupDateTime:   new Date(pickupDateTime),
      deliveryDateTime: new Date(deliveryDateTime),
      tenantId,
    });

    const available = conflicts.length === 0;
    const fmt = (d: Date) =>
      new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return {
      success: true,
      data: {
        available,
        conflicts: conflicts.map(c => ({
          type:               c.type,
          resourceId:         c.resourceId,
          conflictingTripId:  c.conflictingTripId,
          conflictingCargoId: c.conflictingCargoId,
          existingPickup:     c.existingPickup,
          existingDelivery:   c.existingDelivery,
          message:
            c.type === 'TRUCK'
              ? `This truck is already assigned to another shipment (${fmt(c.existingPickup)} → ${fmt(c.existingDelivery)}).`
              : `This driver is already assigned to another shipment (${fmt(c.existingPickup)} → ${fmt(c.existingDelivery)}).`,
        })),
        message: available
          ? 'Truck and driver are available for the selected window.'
          : `${conflicts.length} scheduling conflict(s) detected. Choose a different truck or driver.`,
      },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────

  @Post('bids')
  @ApiOperation({
    summary: 'Submit a bid for a load',
    description: 'Truck owners can submit bids for published loads with active auctions.',
  })
  @ApiBody({
    type: 'object',
    schema: {
      type: 'object',
      properties: {
        loadId: { type: 'string', description: 'ID of the load to bid on' },
        bidAmount: { type: 'number', description: 'Bid amount in USD' },
        bidCurrency: {
          type: 'string',
          description: 'Currency code (default: USD)',
        },
        proposedPickupDate: {
          type: 'string',
          format: 'date-time',
          description: 'Proposed pickup date',
        },
        proposedDeliveryDate: {
          type: 'string',
          format: 'date-time',
          description: 'Proposed delivery date',
        },
        bidNotes: {
          type: 'string',
          description: 'Additional notes for the bid',
        },
        advancePaymentPercentage: {
          type: 'number',
          description: 'Percentage of transportation fee to be paid before trip starts (0-100). Optional, defaults to system default if not provided.',
          minimum: 0,
          maximum: 100,
        },
        requireAdvancePayment: {
          type: 'boolean',
          description: 'Whether advance payment is required before trip starts. If false, trip can start without advance payment. Defaults to true.',
        },
        bidDetails: {
          type: 'object',
          properties: {
            truckSpecifications: {
              type: 'object',
              properties: {
                truckId: { type: 'string' },
                capacityWeight: { type: 'number' },
                capacityVolume: { type: 'number' },
                truckType: { type: 'string' },
                hasRefrigeration: { type: 'boolean' },
                hasHazmatPermit: { type: 'boolean' },
              },
            },
            driverInfo: {
              type: 'object',
              properties: {
                driverId: { type: 'string' },
                experience: { type: 'number' },
                rating: { type: 'number' },
                certifications: { type: 'array', items: { type: 'string' } },
              },
            },
            routeOptimization: {
              type: 'object',
              properties: {
                estimatedDistance: { type: 'number' },
                estimatedFuelCost: { type: 'number' },
                estimatedTime: { type: 'number' },
              },
            },
            additionalServices: {
              type: 'object',
              properties: {
                insurance: { type: 'boolean' },
                tracking: { type: 'boolean' },
                loadingAssistance: { type: 'boolean' },
                unloadingAssistance: { type: 'boolean' },
              },
            },
          },
        },
        isAutoBid: {
          type: 'boolean',
          description: 'Whether this is an automatic bid',
        },
        isCounterOffer: {
          type: 'boolean',
          description: 'Whether this is a counter-offer',
        },
        parentBidId: {
          type: 'string',
          description: 'Parent bid ID for counter-offers',
        },
      },
      required: ['loadId', 'bidAmount'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Bid submitted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        loadId: { type: 'string' },
        truckOwnerId: { type: 'string' },
        bidAmount: { type: 'number' },
        status: { type: 'string' },
        successProbability: { type: 'number' },
        riskAssessment: { type: 'object' },
        marketContext: { type: 'object' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid bid data or auction not active',
  })
  @ApiResponse({
    status: 403,
    description: 'Only truck owners can submit bids',
  })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async createBid(
    @Body() createBidDto: CreateBidDto,
    @Request() req,
  ): Promise<Bid> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    const bid = await this.biddingService.createBid(
      createBidDto,
      req.user.userId,
      req.user.tenantId,
    );

    // Emit bid.submitted event for notifications (simplified - no load details needed)
    try {
      this.eventEmitter.emit('bid.submitted', {
        bidId: bid.id,
        cargoId: bid.loadId,
        cargoOwnerId: bid.load?.cargoOwnerId || 'unknown',
        truckOwnerId: req.user.userId,
        tenantId: req.user.tenantId,
        bidDetails: {
          amount: bid.bidAmount,
          proposedPickupDate: bid.proposedPickupDate,
          proposedDeliveryDate: bid.proposedDeliveryDate,
          notes: bid.bidNotes,
        },
      });
    } catch (eventError) {
      console.warn('⚠️ Failed to emit bid.submitted event (non-critical):', eventError.message);
    }

    return bid;
  }

  @Get('loads/:loadId/bids')
  @ApiOperation({
    summary: 'Get all bids for a load',
    description: 'Retrieve all bids submitted for a specific load.',
  })
  @ApiParam({ name: 'loadId', description: 'ID of the load' })
  @ApiResponse({
    status: 200,
    description: 'Bids retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          bidAmount: { type: 'number' },
          status: { type: 'string' },
          truckOwner: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              profile: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                },
              },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async getBidsForLoad(
    @Param('loadId') loadId: string,
    @Request() req,
  ): Promise<Bid[]> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return this.biddingService.getBidsForLoad(
      loadId,
      req.user.tenantId,
    );
  }

  @Put('bids/:bidId')
  @ApiOperation({
    summary: 'Update a bid',
    description:
      'Update an existing bid (only if auction allows modifications).',
  })
  @ApiParam({ name: 'bidId', description: 'ID of the bid to update' })
  @ApiResponse({ status: 200, description: 'Bid updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot update bid or modifications not allowed',
  })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  async updateBid(
    @Param('bidId') bidId: string,
    @Body() updates: Partial<CreateBidDto>,
    @Request() req,
  ): Promise<Bid> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return this.biddingService.updateBid(
      bidId,
      updates,
      req.user.userId,
      req.user.tenantId,
    );
  }

  @Delete('bids/:bidId')
  @ApiOperation({
    summary: 'Withdraw a bid',
    description: 'Withdraw a pending bid.',
  })
  @ApiParam({ name: 'bidId', description: 'ID of the bid to withdraw' })
  @ApiResponse({ status: 200, description: 'Bid withdrawn successfully' })
  @ApiResponse({ status: 400, description: 'Cannot withdraw bid' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  async withdrawBid(
    @Param('bidId') bidId: string,
    @Request() req,
  ): Promise<void> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return this.biddingService.withdrawBid(
      bidId,
      req.user.userId,
      req.user.tenantId,
    );
  }

  @Post('bids/:bidId/accept')
  @ApiOperation({
    summary: 'Accept a bid',
    description:
      'Cargo owner accepts a bid, closing the auction and assigning the load.',
  })
  @ApiParam({ name: 'bidId', description: 'ID of the bid to accept' })
  @ApiResponse({ status: 200, description: 'Bid accepted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot accept bid' })
  @ApiResponse({ status: 403, description: 'Only cargo owner can accept bids' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  async acceptBid(
    @Param('bidId') bidId: string,
    @Request() req: any,
  ): Promise<Bid> {
    const bid = await this.biddingService.acceptBid(
      bidId,
      req.user.userId,
      req.user.tenantId,
      req.user?.role as UserRole,
    );

    // Emit bid.accepted event for notifications
    try {
      if (bid.load) {
        const pickupLocation = bid.load.locations?.find(loc => loc.type === 'PICKUP');
        const deliveryLocation = bid.load.locations?.find(loc => loc.type === 'DELIVERY');
        
        this.eventEmitter.emit('bid.accepted', {
          bidId: bid.id,
          cargoId: bid.loadId,
          cargoOwnerId: bid.load.cargoOwnerId,
          truckOwnerId: bid.truckOwnerId,
          driverId: null, // Driver not assigned at bid acceptance
          tenantId: req.user.tenantId,
          bidDetails: {
            amount: bid.bidAmount,
            cargoTitle: bid.load.title || 'Cargo',
            origin: pickupLocation?.locationData?.address || pickupLocation?.locationData?.city || 'Unknown',
            destination: deliveryLocation?.locationData?.address || deliveryLocation?.locationData?.city || 'Unknown',
          },
        });
      }
    } catch (eventError) {
      console.warn('⚠️ Failed to emit bid.accepted event (non-critical):', eventError.message);
    }

    return bid;
  }

  @Get('auctions')
  @ApiOperation({
    summary: 'Get all auctions',
    description: 'Retrieve all auctions with optional filtering.',
  })
  @ApiResponse({
    status: 200,
    description: 'Auctions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          loadId: { type: 'string' },
          auctionType: { type: 'string' },
          status: { type: 'string' },
          auctionStart: { type: 'string', format: 'date-time' },
          auctionEnd: { type: 'string', format: 'date-time' },
          reservePrice: { type: 'number' },
          minimumBidIncrement: { type: 'number' },
          totalBids: { type: 'number' },
          uniqueBidders: { type: 'number' },
          currentHighestBid: { type: 'number' },
          load: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              weight: { type: 'number' },
              loadValue: { type: 'number' },
              pickupDate: { type: 'string', format: 'date-time' },
              deliveryDate: { type: 'string', format: 'date-time' },
              pickupLocation: { type: 'string' },
              deliveryLocation: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @Get('auctions')
  @ApiOperation({
    summary: 'Get all auctions',
    description: 'Retrieve all auctions for the current tenant, optionally filtered by status',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'SCHEDULED', 'CLOSED', 'CANCELLED'],
    description: 'Filter auctions by status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  async getAuctions(
    @Request() req,
    @Query('status') status?: string,
  ): Promise<Auction[]> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return this.biddingService.getAuctions(
      req.user.tenantId,
      status,
      req.user.userId,
      req.user.role,
    );
  }

  @Post('auctions')
  @ApiOperation({
    summary: 'Create an auction for a load',
    description: 'Cargo owners can create auctions for their published loads.',
  })
  @ApiBody({
    type: 'object',
    schema: {
      type: 'object',
      properties: {
        loadId: { type: 'string', description: 'ID of the load to auction' },
        auctionType: {
          type: 'string',
          enum: ['REVERSE', 'FORWARD', 'DUTCH', 'SEALED'],
        },
        auctionStart: {
          type: 'string',
          format: 'date-time',
          description: 'Auction start time',
        },
        auctionEnd: {
          type: 'string',
          format: 'date-time',
          description: 'Auction end time',
        },
        reservePrice: {
          type: 'number',
          description: 'Minimum acceptable bid amount',
        },
        minimumBidIncrement: {
          type: 'number',
          description: 'Minimum bid increment',
        },
        maximumBidAmount: {
          type: 'number',
          description: 'Maximum allowed bid amount',
        },
        auctionRules: {
          type: 'object',
          properties: {
            allowCounterOffers: { type: 'boolean' },
            allowBidModifications: { type: 'boolean' },
            autoExtendOnBid: { type: 'boolean' },
            extensionMinutes: { type: 'number' },
            minimumBidTime: { type: 'number' },
            maximumBidTime: { type: 'number' },
            requirePreApproval: { type: 'boolean' },
            allowAnonymousBids: { type: 'boolean' },
          },
        },
        notificationSettings: {
          type: 'object',
          properties: {
            notifyOnBid: { type: 'boolean' },
            notifyOnCounterOffer: { type: 'boolean' },
            notifyOnAuctionEnd: { type: 'boolean' },
            notifyOnAward: { type: 'boolean' },
            emailNotifications: { type: 'boolean' },
            smsNotifications: { type: 'boolean' },
            pushNotifications: { type: 'boolean' },
          },
        },
      },
      required: ['loadId', 'auctionStart', 'auctionEnd'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Auction created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        loadId: { type: 'string' },
        auctionType: { type: 'string' },
        status: { type: 'string' },
        auctionStart: { type: 'string', format: 'date-time' },
        auctionEnd: { type: 'string', format: 'date-time' },
        reservePrice: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid auction data or load not published',
  })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async createAuction(
    @Body() createAuctionDto: CreateAuctionDto,
    @Request() req: any,
  ): Promise<Auction> {
    try {
      console.log('Creating auction with data:', createAuctionDto);
      console.log('User info:', req.user);
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      return await this.biddingService.createAuction(
        createAuctionDto,
        req.user.userId,
        req.user.tenantId,
        req.user.role as UserRole,
      );
    } catch (error) {
      // Log the error for debugging
      console.error('Error creating auction:', error);
      
      // Handle specific database errors
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        if (error.constraint?.includes('REL_')) {
          throw new BadRequestException(
            'An auction already exists for this load. Please delete the existing auction first or use a different load.'
          );
        }
        throw new BadRequestException(
          'Duplicate entry detected. This auction may already exist.'
        );
      }
      
      // Re-throw known NestJS exceptions
      if (error.status) {
        throw error;
      }
      
      // Handle unknown errors with a user-friendly message
      throw new BadRequestException(
        error.message || 'Failed to create auction. Please check your input and try again.'
      );
    }
  }

  @Put('auctions/:auctionId')
  @ApiOperation({
    summary: 'Update an auction',
    description: 'Cargo owners or brokers can update a SCHEDULED or ACTIVE auction (end time, reserve price, bid increments).',
  })
  @ApiParam({ name: 'auctionId', description: 'ID of the auction to update' })
  @ApiResponse({ status: 200, description: 'Auction updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot update a closed/cancelled auction' })
  @ApiResponse({ status: 403, description: 'No permission to update this auction' })
  @ApiResponse({ status: 404, description: 'Auction not found' })
  async updateAuction(
    @Param('auctionId') auctionId: string,
    @Body() updates: Partial<CreateAuctionDto>,
    @Request() req: any,
  ): Promise<Auction> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return this.biddingService.updateAuction(
      auctionId,
      updates,
      req.user.userId,
      req.user.tenantId,
      req.user.role as UserRole,
    );
  }

  @Delete('auctions/:auctionId')
  @ApiOperation({
    summary: 'Delete an auction',
    description: 'Cargo owners or brokers can delete an auction if it hasn\'t been closed.',
  })
  @ApiParam({ name: 'auctionId', description: 'ID of the auction to delete' })
  @ApiResponse({ status: 200, description: 'Auction deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete a closed auction' })
  @ApiResponse({ status: 403, description: 'No permission to delete this auction' })
  @ApiResponse({ status: 404, description: 'Auction not found' })
  async deleteAuction(
    @Param('auctionId') auctionId: string,
    @Request() req: any,
  ): Promise<{ success: boolean }> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    await this.biddingService.deleteAuction(
      auctionId,
      req.user.userId,
      req.user.tenantId,
      req.user.role as UserRole,
    );
    return { success: true };
  }

  @Get('loads/:loadId/auction')
  @ApiOperation({
    summary: 'Get auction for a load',
    description: 'Retrieve auction information for a specific load.',
  })
  @ApiParam({ name: 'loadId', description: 'ID of the load' })
  @ApiResponse({
    status: 200,
    description: 'Auction retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        loadId: { type: 'string' },
        auctionType: { type: 'string' },
        status: { type: 'string' },
        auctionStart: { type: 'string', format: 'date-time' },
        auctionEnd: { type: 'string', format: 'date-time' },
        totalBids: { type: 'number' },
        uniqueBidders: { type: 'number' },
        currentHighestBid: { type: 'number' },
        analytics: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Load not found' })
  async getAuctionForLoad(
    @Param('loadId') loadId: string,
    @Request() req,
  ): Promise<Auction | null> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return this.biddingService.getAuctionForLoad(
      loadId,
      req.user.tenantId,
    );
  }

  @Post('auctions/:auctionId/watch')
  @ApiOperation({ summary: 'Watch an auction' })
  async watchAuction(
    @Param('auctionId') auctionId: string,
    @Request() req,
  ): Promise<{ success: true }> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    await this.biddingService.watchAuction(
      auctionId,
      req.user.userId,
      req.user.tenantId,
    );
    return { success: true };
  }

  @Delete('auctions/:auctionId/watch')
  @ApiOperation({ summary: 'Unwatch an auction' })
  async unwatchAuction(
    @Param('auctionId') auctionId: string,
    @Request() req,
  ): Promise<{ success: true }> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    await this.biddingService.unwatchAuction(
      auctionId,
      req.user.userId,
      req.user.tenantId,
    );
    return { success: true };
  }

  @Get('auctions/watched')
  @ApiOperation({ summary: 'Get watched auctions' })
  async getWatched(
    @Request() req,
  ): Promise<Auction[]> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return this.biddingService.getWatchedAuctions(
      req.user.userId,
      req.user.tenantId,
    );
  }

  @Get('auctions/inactive')
  @ApiOperation({ 
    summary: 'Get inactive (soft-deleted) auctions',
    description: 'Retrieve all soft-deleted auctions that can be reactivated'
  })
  @ApiResponse({
    status: 200,
    description: 'Inactive auctions retrieved successfully',
  })
  async getInactiveAuctions(
    @Request() req,
  ): Promise<Auction[]> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return this.biddingService.getInactiveAuctions(
      req.user.userId,
      req.user.tenantId,
      req.user.role as UserRole,
    );
  }

  @Post('auctions/:auctionId/reactivate')
  @ApiOperation({ 
    summary: 'Reactivate a soft-deleted auction',
    description: 'Restore a previously deleted auction'
  })
  @ApiParam({ name: 'auctionId', description: 'ID of the auction to reactivate' })
  @ApiResponse({
    status: 200,
    description: 'Auction reactivated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Auction not found or not deleted',
  })
  @ApiResponse({
    status: 403,
    description: 'No permission to reactivate this auction',
  })
  async reactivateAuction(
    @Param('auctionId') auctionId: string,
    @Request() req,
  ): Promise<Auction> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return this.biddingService.reactivateAuction(
      auctionId,
      req.user.userId,
      req.user.tenantId,
      req.user.role as UserRole,
    );
  }

  @Get('bids')
  @ApiOperation({ summary: 'Get my bids' })
  async getMyBids(
    @Request() req,
  ): Promise<Bid[]> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return this.biddingService.getMyBids(
      req.user.userId,
      req.user.tenantId,
      req.user.role,
    );
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats(
    @Request() req,
  ): Promise<any> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return this.biddingService.getDashboardStats(
      req.user.userId,
      req.user.tenantId,
      req.user.role,
    );
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get bid history',
    description: 'Get bid history - for truck owners: their submitted bids, for cargo owners: bids on their auctions'
  })
  async getBidHistory(
    @Request() req,
  ): Promise<Bid[]> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return this.biddingService.getBidHistory(
      req.user.userId,
      req.user.tenantId,
      req.user.role,
    );
  }

  @Post('auctions/:auctionId/view')
  @ApiOperation({ summary: 'Record an auction view' })
  async recordAuctionView(
    @Param('auctionId') auctionId: string,
    @Request() req,
  ): Promise<{ success: true }> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    await this.biddingService.recordView(
      auctionId,
      req.user.userId,
      req.user.tenantId,
    );
    return { success: true };
  }

  @Get('admin/all-bids')
  @ApiOperation({ summary: 'Get all bids in the system (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns all bids in the system' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllBidsForAdmin(@Request() req): Promise<Bid[]> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    
    // Check if user is admin
    if (req.user.role !== UserRole.ADMIN && req.user.role !== 'ADMIN' && 
        req.user.role !== UserRole.SUPER_ADMIN && req.user.role !== 'SUPER_ADMIN') {
      throw new Error('Forbidden - Admin access required');
    }
    
    return this.biddingService.getAllBidsForAdmin();
  }
}

