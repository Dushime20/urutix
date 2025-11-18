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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import {
  BiddingService,
  CreateBidDto,
  CreateAuctionDto,
} from './bidding.service';
import { Bid } from '../../entities/bid.entity';
import { Auction } from '../../entities/auction.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { errorMessage } from 'src/utils/error';

@ApiTags('Bidding & Auctions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('bidding')
export class BiddingController {
  constructor(private readonly biddingService: BiddingService) {}

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
  async testDatabase(): Promise<{
    message: string;
    auctionCount: number;
    timestamp: string;
  }> {
    try {
      const auctionCount = await this.biddingService.getAuctions(
        '00000000-0000-0000-0000-000000000001',
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

  @Post('bids')
  @ApiOperation({
    summary: 'Submit a bid for a load',
    description:
      'Truck owners can submit bids for published loads with active auctions.',
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
    @Request()
    req = {
      user: {
        userId: '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
        tenantId: '00000000-0000-0000-0000-000000000001',
      },
    },
  ): Promise<Bid> {
    return this.biddingService.createBid(
      createBidDto,
      req.user?.userId || '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
      req.user?.tenantId || '00000000-0000-0000-0000-000000000001',
    );
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
    @Request()
    req = { user: { tenantId: '00000000-0000-0000-0000-000000000001' } },
  ): Promise<Bid[]> {
    return this.biddingService.getBidsForLoad(
      loadId,
      req.user?.tenantId || '00000000-0000-0000-0000-000000000001',
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
    @Request()
    req = {
      user: {
        userId: '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
        tenantId: '00000000-0000-0000-0000-000000000001',
      },
    },
  ): Promise<Bid> {
    return this.biddingService.updateBid(
      bidId,
      updates,
      req.user?.userId || '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
      req.user?.tenantId || '00000000-0000-0000-0000-000000000001',
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
    @Request()
    req = {
      user: {
        userId: '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
        tenantId: '00000000-0000-0000-0000-000000000001',
      },
    },
  ): Promise<void> {
    return this.biddingService.withdrawBid(
      bidId,
      req.user?.userId || '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
      req.user?.tenantId || '00000000-0000-0000-0000-000000000001',
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
    @Request()
    req = {
      user: {
        userId: '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
        tenantId: '00000000-0000-0000-0000-000000000001',
      },
    },
  ): Promise<Bid> {
    return this.biddingService.acceptBid(
      bidId,
      req.user?.userId || '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
      req.user?.tenantId || '00000000-0000-0000-0000-000000000001',
    );
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
  async getAuctions(
    @Request()
    req = { user: { tenantId: '00000000-0000-0000-0000-000000000001' } },
  ): Promise<Auction[]> {
    return this.biddingService.getAuctions(
      req.user?.tenantId || '00000000-0000-0000-0000-000000000001',
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
    @Request()
    req = {
      user: {
        userId: '83f1b7e4-8313-4ca5-959a-fbf98f68b548',
        tenantId: '00000000-0000-0000-0000-000000000001',
      },
    },
  ): Promise<Auction> {
    console.log('Creating auction with data:', createAuctionDto);
    console.log('User info:', req.user);
    return this.biddingService.createAuction(
      createAuctionDto,
      req.user?.userId || '83f1b7e4-8313-4ca5-959a-fbf98f68b548',
      req.user?.tenantId || '00000000-0000-0000-0000-000000000001',
    );
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
    @Request()
    req = { user: { tenantId: '00000000-0000-0000-0000-000000000001' } },
  ): Promise<Auction | null> {
    return this.biddingService.getAuctionForLoad(
      loadId,
      req.user?.tenantId || '00000000-0000-0000-0000-000000000001',
    );
  }

  @Post('auctions/:auctionId/watch')
  @ApiOperation({ summary: 'Watch an auction' })
  async watchAuction(
    @Param('auctionId') auctionId: string,
    @Request()
    req = {
      user: {
        userId: '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
        tenantId: '00000000-0000-0000-0000-000000000001',
      },
    },
  ): Promise<{ success: true }> {
    await this.biddingService.watchAuction(
      auctionId,
      req.user?.userId || '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
      req.user?.tenantId || '00000000-0000-0000-0000-000000000001',
    );
    return { success: true };
  }

  @Delete('auctions/:auctionId/watch')
  @ApiOperation({ summary: 'Unwatch an auction' })
  async unwatchAuction(
    @Param('auctionId') auctionId: string,
    @Request()
    req = {
      user: {
        userId: '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
        tenantId: '00000000-0000-0000-0000-000000000001',
      },
    },
  ): Promise<{ success: true }> {
    await this.biddingService.unwatchAuction(
      auctionId,
      req.user?.userId || '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
      req.user?.tenantId || '00000000-0000-0000-0000-000000000001',
    );
    return { success: true };
  }

  @Get('auctions/watched')
  @ApiOperation({ summary: 'Get watched auctions' })
  async getWatched(
    @Request()
    req = {
      user: {
        userId: '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
        tenantId: '00000000-0000-0000-0000-000000000001',
      },
    },
  ): Promise<Auction[]> {
    return this.biddingService.getWatchedAuctions(
      req.user?.userId || '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
      req.user?.tenantId || '00000000-0000-0000-0000-000000000001',
    );
  }

  @Get('bids')
  @ApiOperation({ summary: 'Get my bids' })
  async getMyBids(
    @Request()
    req = {
      user: {
        userId: '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
        tenantId: '00000000-0000-0000-000000000001',
      },
    },
  ): Promise<Bid[]> {
    return this.biddingService.getMyBids(
      req.user?.userId || '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
      req.user?.tenantId || '00000000-0000-0000-0000-000000000001',
    );
  }

  @Post('auctions/:auctionId/view')
  @ApiOperation({ summary: 'Record an auction view' })
  async recordAuctionView(
    @Param('auctionId') auctionId: string,
    @Request()
    req = {
      user: {
        userId: '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
        tenantId: '00000000-0000-0000-000000000001',
      },
    },
  ): Promise<{ success: true }> {
    await this.biddingService.recordView(
      auctionId,
      req.user?.userId || '701a9079-6100-4b47-a3b9-f9b070bfa7c6',
      req.user?.tenantId || '00000000-0000-0000-0000-000000000001',
    );
    return { success: true };
  }
}
