import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MatchingService, MatchingAlgorithm } from './matching.service';
import { MatchRequestDto } from './dto/match-request.dto';
import { MatchResultDto } from './dto/match-result.dto';
import { LoadMatch, MatchStatus } from '../../entities/load-match.entity';
import { GetTenant } from '../auth/decorators/tenant.decorator';
import { EnhancedTruckMatchingService } from './services/enhanced-truck-matching.service';
import { AIMatchingEngineService } from './services/ai-matching-engine.service';
import { EnhancedMatchingService } from './services/enhanced-matching.service';
import { MarketIntelligenceService } from './services/market-intelligence.service';

@ApiTags('Enhanced Matching')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard) // Re-enabled for proper authentication
@Controller('matching')
export class MatchingController {
  private readonly logger = new Logger(MatchingController.name);

  constructor(
    private readonly matchingService: MatchingService,
    private readonly enhancedTruckMatchingService: EnhancedTruckMatchingService,
    private readonly aiMatchingEngineService: AIMatchingEngineService,
    private readonly enhancedMatchingService: EnhancedMatchingService,
    private readonly marketIntelligenceService: MarketIntelligenceService,
  ) { }

  @Post('find-matches')
  @ApiOperation({
    summary: 'Enhanced cargo-truck matching with multiple algorithms',
    description: `
    Find optimal matches using advanced algorithms with comprehensive multi-dimensional scoring.
    
    **Available Algorithms:**
    - **WEIGHTED_SCORE** (default): Standard matching with configurable weights
    - **HUNGARIAN**: Optimal assignment for multiple loads and trucks
    - **GENETIC**: Evolutionary optimization for complex scenarios
    - **TOPSIS**: Multi-criteria decision making
    - **HYBRID**: Combines multiple algorithms for optimal results
    
    **Enhanced Scoring Components:**
    - **Distance Score**: Proximity-based scoring with configurable thresholds
    - **Capacity Score**: Weight and volume utilization optimization
    - **Equipment Score**: Specialized equipment compatibility
    - **Temperature Score**: Refrigeration and temperature control matching
    - **Security Score**: GPS tracking, monitoring, and insurance requirements
    - **Route Score**: Clearance, escort, and route-specific requirements
    - **Time Score**: Urgency and availability-based scoring
    - **Experience Score**: Driver and truck experience with cargo types
    - **Availability Score**: Real-time availability and estimated availability time
    - **Special Requirements Score**: Fragile, hazardous, and specialized handling
    - **Rating Score**: Historical performance and reliability metrics
    - **Cost Score**: Market-competitive pricing analysis
    
    **Dynamic Weighting System:**
    The system automatically adjusts scoring weights based on cargo characteristics:
    - **Hazardous Cargo**: Increases equipment and security weights
    - **Time-Critical Cargo**: Prioritizes availability and distance
    - **Fragile Cargo**: Emphasizes equipment and experience
    - **Refrigerated Cargo**: Focuses on temperature control and equipment
    - **High-Value Cargo**: Prioritizes security and experience
    
    **Enhanced Features:**
    - Real-time availability checking
    - Risk assessment and success probability
    - Environmental impact analysis
    - Route optimization capabilities
    - Market context analysis
    - Performance metrics tracking
    `,
  })
  @ApiBody({
    type: MatchRequestDto,
    description: 'Enhanced matching request with comprehensive options',
    examples: {
      basic: {
        summary: 'Basic matching request',
        value: {
          loadId: 'load-123',
          maxDistance: 200,
          minRating: 0.8,
          limit: 10,
          includeDrivers: true,
        },
      },
      advanced: {
        summary: 'Advanced matching with hybrid algorithm',
        value: {
          loadId: 'load-456',
          algorithm: 'HYBRID',
          maxDistance: 150,
          minRating: 0.9,
          requiresRefrigeration: true,
          requiresHazmat: true,
          maxPrice: 5000,
          isTimeCritical: true,
          urgencyLevel: 'CRITICAL',
          includeRouteOptimization: true,
          includeEnvironmentalImpact: true,
          includeRiskAnalysis: true,
          includeSuccessProbability: true,
          includeDetailedScoring: true,
          limit: 5,
        },
      },
      genetic: {
        summary: 'Genetic algorithm configuration',
        value: {
          loadId: 'load-789',
          algorithm: 'GENETIC',
          maxProcessingTime: 30,
          limit: 20,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Enhanced matches found successfully',
    type: [MatchResultDto],
    schema: {
      example: {
        message: 'Enhanced matches found successfully',
        matches: [
          {
            truckId: 'truck-123',
            loadId: 'load-456',
            overallScore: 0.92,
            capacityScore: 0.9,
            distanceScore: 0.85,
            equipmentScore: 0.88,
            ratingScore: 0.85,
            priceScore: 0.75,
            temperatureScore: 0.85,
            securityScore: 0.9,
            routeScore: 0.8,
            timeScore: 0.95,
            experienceScore: 0.88,
            availabilityScore: 0.92,
            specialRequirementsScore: 0.95,
            distanceKm: 150,
            estimatedCost: 375,
            estimatedRevenue: 450,
            profitMargin: 0.17,
            successProbability: 0.88,
            estimatedDeliveryTime: 3.5,
            riskScore: 0.12,
            recommendedPrice: 425,
            confidence: 0.85,
            truckMake: 'Freightliner',
            truckModel: 'Cascadia',
            plateNumber: 'ABC-123',
            capacityWeight: 20000,
            capacityVolume: 100,
            truckRating: 4.5,
            hasRefrigeration: true,
            hasLiftGate: false,
            hasHazmatPermit: true,
            matchReason:
              'Excellent dimensional match, Optimal capacity utilization, High-rated truck with required features',
            driverId: 'driver-456',
            driverName: 'John Smith',
            driverRating: 4.8,
            driverLicenseNumber: 'DL123456789',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid request parameters',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Load not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Load not found',
        error: 'Not Found',
      },
    },
  })
  async findMatches(@Body() matchRequestDto: MatchRequestDto, @Request() req) {
    try {
      this.logger.log('🔍 Finding matches for load:', matchRequestDto.loadId);
      this.logger.log(
        '📋 Request body:',
        JSON.stringify(matchRequestDto, null, 2),
      );
      this.logger.log('👤 Request user:', JSON.stringify(req.user, null, 2));
      this.logger.log('📦 Request headers:', {
        'x-tenant-id': req.headers['x-tenant-id'],
        authorization: req.headers['authorization'] ? 'Present' : 'Missing',
      });

      // Validate matchRequestDto
      if (!matchRequestDto || !matchRequestDto.loadId) {
        this.logger.error('❌ Invalid match request - missing loadId');
        throw new BadRequestException('Load ID is required in request body');
      }

      // Get tenantId from request user or headers
      let tenantId: string;
      if (req.user?.tenantId) {
        tenantId = req.user.tenantId;
        this.logger.log('✅ Using tenantId from req.user:', tenantId);
      } else if (req.headers['x-tenant-id']) {
        tenantId = req.headers['x-tenant-id'] as string;
        this.logger.log('✅ Using tenantId from headers:', tenantId);
      } else {
        this.logger.error('❌ No tenantId found in request');
        this.logger.error('Request user:', req.user);
        this.logger.error('Request headers:', req.headers);
        throw new BadRequestException(
          'Tenant ID is required. Please ensure you are authenticated.',
        );
      }

      this.logger.log('✅ Using tenantId:', tenantId);

      this.logger.log('🚀 Calling matchingService.findMatches...');
      const matches = await this.matchingService.findMatches(
        matchRequestDto,
        tenantId,
      );

      this.logger.log(
        `✅ Found ${matches.length} matches for load ${matchRequestDto.loadId}`,
      );

      return {
        message: 'Enhanced matches found successfully',
        data: matches, // Changed from matches' to 'data' to match frontend expectation
        matches, // Keep both for backward compatibility
      };
    } catch (error) {
      this.logger.error('Error in findMatches:', error);
      this.logger.error('Error message:', error.message);
      this.logger.error('Error stack:', error.stack);

      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw new InternalServerErrorException({
        message: 'Failed to find matches',
        error: error.message || 'An unexpected error occurred',
        details:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  @Get('truck-owner/matches')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get recommended load matches for my trucks',
    description: 'Returns loads that have been matched to the logged-in user\'s trucks.',
  })
  async getMatchesForTruckOwner(@Request() req) {
    try {
      const userId = req.user.id || req.user.sub || req.user.userId;
      this.logger.log(`👤 Getting matches for Truck Owner: ${userId}`);

      if (!userId) {
        throw new BadRequestException('User ID not found in token');
      }

      const matches = await this.matchingService.getMatchesForOwner(userId);

      return {
        message: 'Matches retrieved successfully',
        data: matches,
        count: matches.length
      };
    } catch (error) {
      this.logger.error('Error in getMatchesForTruckOwner', error);
      throw new InternalServerErrorException('Failed to retrieve matches');
    }
  }

  @Post('request')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Request a specific truck match (Cargo Owner)' })
  async requestMatch(@Body() body: { loadId: string; truckId: string }, @Request() req) {
    this.logger.log('📥 requestMatch called with:', { loadId: body.loadId, truckId: body.truckId });
    this.logger.log('👤 User info:', JSON.stringify(req.user, null, 2));

    // Validate request body
    if (!body.loadId || !body.truckId) {
      throw new BadRequestException('loadId and truckId are required');
    }

    // Get tenantId from 'request user or headers (same pattern as findMatches)
    let tenantId: string;
    if (req.user?.tenantId) {
      tenantId = req.user.tenantId;
      this.logger.log('✅ Using tenantId from req.user:', tenantId);
    } else if (req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'] as string;
      this.logger.log('✅ Using tenantId from headers:', tenantId);
    } else {
      this.logger.error('❌ No tenantId found in request');
      throw new BadRequestException('Tenant ID is required. Please ensure you are authenticated.');
    }

    try {
      const result = await this.matchingService.requestMatch(body.loadId, body.truckId, tenantId);
      this.logger.log('✅ Match requested successfully:', result.id);
      return {
        success: true,
        message: 'Match request sent successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('❌ Error in requestMatch:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to request match');
    }
  }

  @Patch(':matchId/respond')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Accept or Reject a match (Truck Owner)' })
  async respondToMatch(
    @Param('matchId') matchId: string,
    @Body() body: { status: MatchStatus },
  ) {
    return this.matchingService.respondToMatch(matchId, body.status);
  }

  @Post('create-trips-for-accepted')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create trips for already-accepted matches (Migration endpoint)',
    description: 'Retroactively creates trips for matches that were accepted before auto-trip creation was implemented'
  })
  async createTripsForAcceptedMatches(@Request() req) {
    try {
      const result = await this.matchingService.createTripsForAcceptedMatches(req.user.tenantId);
      return {
        message: 'Trip creation completed',
        ...result
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to create trips for accepted matches');
    }
  }

  @Post(':matchId/create-trip')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create a trip for a specific accepted match',
    description: 'Creates a trip for a single accepted match if it does not exist yet'
  })
  async createTripForMatch(
    @Param('matchId') matchId: string,
    @Request() req
  ) {
    try {
      const trip = await this.matchingService.createTripForMatch(matchId, req.user.tenantId);
      return {
        success: true,
        message: 'Trip created successfully',
        data: trip
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create trip');
    }
  }

  @Post('find-matches/hungarian')
  @ApiOperation({
    summary: 'Hungarian algorithm matching',
    description: `
    Find optimal assignments using the Hungarian algorithm for multiple loads and trucks.
    
    **Features:**
    - Minimizes total cost across all assignments
    - Handles unbalanced load-truck scenarios
    - Provides efficiency metrics
    - Optimal for fleet optimization and batch assignments
    `,
  })
  @ApiBody({
    type: MatchRequestDto,
    description: 'Matching request for Hungarian algorithm',
  })
  @ApiResponse({
    status: 200,
    description: 'Hungarian algorithm matches found successfully',
    type: [MatchResultDto],
  })
  async findMatchesHungarian(
    @Body() matchRequestDto: MatchRequestDto,
    @Request() req,
  ) {
    matchRequestDto.algorithm = MatchingAlgorithm.HUNGARIAN;
    const matches = await this.matchingService.findMatches(
      matchRequestDto,
      req.user.tenantId,
    );

    return {
      message: 'Hungarian algorithm matches found successfully',
      matches,
    };
  }

  @Post('find-matches/genetic')
  @ApiOperation({
    summary: 'Genetic algorithm matching',
    description: `
    Find optimal matches using genetic algorithm for complex scenarios.
    
    **Features:**
    - Population-based optimization
    - Configurable parameters (population size, generations, mutation rate)
    - Convergence detection
    - Multi-objective fitness evaluation
    - Best for large-scale matching with multiple constraints
    `,
  })
  @ApiBody({
    type: MatchRequestDto,
    description: 'Matching request for genetic algorithm',
  })
  @ApiResponse({
    status: 200,
    description: 'Genetic algorithm matches found successfully',
    type: [MatchResultDto],
  })
  async findMatchesGenetic(
    @Body() matchRequestDto: MatchRequestDto,
    @Request() req,
  ) {
    matchRequestDto.algorithm = MatchingAlgorithm.GENETIC;
    const matches = await this.matchingService.findMatches(
      matchRequestDto,
      req.user.tenantId,
    );

    return {
      message: 'Genetic algorithm matches found successfully',
      matches,
    };
  }

  @Post('find-matches/topsis')
  @ApiOperation({
    summary: 'TOPSIS algorithm matching',
    description: `
    Find optimal matches using TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution).
    
    **Features:**
    - Ideal and negative-ideal solution analysis
    - Normalized decision matrix
    - Relative closeness scoring
    - Configurable criteria weights
    - Best for complex scenarios with conflicting criteria
    `,
  })
  @ApiBody({
    type: MatchRequestDto,
    description: 'Matching request for TOPSIS algorithm',
  })
  @ApiResponse({
    status: 200,
    description: 'TOPSIS algorithm matches found successfully',
    type: [MatchResultDto],
  })
  async findMatchesTopsis(
    @Body() matchRequestDto: MatchRequestDto,
    @Request() req,
  ) {
    matchRequestDto.algorithm = MatchingAlgorithm.TOPSIS;
    const matches = await this.matchingService.findMatches(
      matchRequestDto,
      req.user.tenantId,
    );

    return {
      message: 'TOPSIS algorithm matches found successfully',
      matches,
    };
  }

  @Post('find-matches/hybrid')
  @ApiOperation({
    summary: 'Hybrid algorithm matching',
    description: `
    Find optimal matches using hybrid algorithm that combines multiple approaches.
    
    **Features:**
    - Ensemble approach combining multiple algorithms
    - Deduplication of results
    - Re-scoring with hybrid methodology
    - Best for high-accuracy matching requirements
    `,
  })
  @ApiBody({
    type: MatchRequestDto,
    description: 'Matching request for hybrid algorithm',
  })
  @ApiResponse({
    status: 200,
    description: 'Hybrid algorithm matches found successfully',
    type: [MatchResultDto],
  })
  async findMatchesHybrid(
    @Body() matchRequestDto: MatchRequestDto,
    @Request() req,
  ) {
    matchRequestDto.algorithm = MatchingAlgorithm.HYBRID;
    const matches = await this.matchingService.findMatches(
      matchRequestDto,
      req.user.tenantId,
    );

    return {
      message: 'Hybrid algorithm matches found successfully',
      matches,
    };
  }

  @Post('enhanced-cargo-alignment')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Enhanced cargo-truck alignment with detailed analytics',
    description:
      'Get comprehensive cargo alignment analytics and recommendations',
  })
  async findEnhancedMatches(
    @Body() matchRequest: MatchRequestDto,
    @GetTenant() tenantId: string,
  ) {
    try {
      const matches =
        await this.enhancedTruckMatchingService.findOptimalMatches(
          matchRequest.loadId,
          tenantId,
        );

      return {
        success: true,
        data: matches,
        message: `Found ${matches.length} enhanced matches for cargo alignment`,
      };
    } catch (error) {
      this.logger.error(
        `Error finding enhanced matches: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to find enhanced matches');
    }
  }

  @Post('booking-confirmation')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Confirm booking and initiate transaction flow',
    description:
      'Confirm a match and start the booking process with escrow setup',
  })
  async confirmBooking(
    @Body()
    bookingData: {
      matchId: string;
      loadId: string;
      truckId: string;
      driverId: string;
      agreedPrice: number;
      terms: any;
    },
    @GetTenant() tenantId: string,
  ) {
    try {
      const booking = await this.enhancedTruckMatchingService.confirmBooking(
        bookingData,
        tenantId,
      );

      return {
        success: true,
        data: booking,
        message: 'Booking confirmed and transaction flow initiated',
      };
    } catch (error) {
      this.logger.error(
        `Error confirming booking: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to confirm booking');
    }
  }

  @Post('contract-negotiation')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Handle contract negotiation between parties',
    description: 'Facilitate contract terms negotiation and agreement',
  })
  async negotiateContract(
    @Body()
    negotiationData: {
      bookingId: string;
      proposedTerms: any;
      counterOffers: any[];
    },
    @GetTenant() tenantId: string,
  ) {
    try {
      const contract =
        await this.enhancedTruckMatchingService.negotiateContract(
          negotiationData,
          tenantId,
        );

      return {
        success: true,
        data: contract,
        message: 'Contract negotiation processed',
      };
    } catch (error) {
      this.logger.error(
        `Error negotiating contract: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to negotiate contract');
    }
  }

  @Post('escrow-setup')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Setup escrow for secure payment processing',
    description: 'Initialize escrow account and payment terms',
  })
  async setupEscrow(
    @Body()
    escrowData: {
      bookingId: string;
      amount: number;
      terms: any;
    },
    @GetTenant() tenantId: string,
  ) {
    try {
      const escrow = await this.enhancedTruckMatchingService.setupEscrow(
        escrowData,
        tenantId,
      );

      return {
        success: true,
        data: escrow,
        message: 'Escrow setup completed',
      };
    } catch (error) {
      this.logger.error(
        `Error setting up escrow: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to setup escrow');
    }
  }

  @Post('trip-initiation')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Initiate trip after payment confirmation',
    description: 'Start the actual trip with tracking and monitoring',
  })
  async initiateTrip(
    @Body()
    tripData: {
      bookingId: string;
      startLocation: any;
      route: any;
    },
    @GetTenant() tenantId: string,
  ) {
    try {
      const trip = await this.enhancedTruckMatchingService.initiateTrip(
        tripData,
        tenantId,
      );

      return {
        success: true,
        data: trip,
        message: 'Trip initiated successfully',
      };
    } catch (error) {
      this.logger.error(`Error initiating trip: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to initiate trip');
    }
  }

  @Post('delivery-confirmation')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Confirm delivery and trigger settlement',
    description: 'Confirm successful delivery and initiate payment settlement',
  })
  async confirmDelivery(
    @Body()
    deliveryData: {
      tripId: string;
      deliveryProof: any;
      finalNotes: string;
    },
    @GetTenant() tenantId: string,
  ) {
    try {
      const delivery = await this.enhancedTruckMatchingService.confirmDelivery(
        deliveryData,
        tenantId,
      );

      return {
        success: true,
        data: delivery,
        message: 'Delivery confirmed and settlement initiated',
      };
    } catch (error) {
      this.logger.error(
        `Error confirming delivery: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to confirm delivery');
    }
  }

  @Post('dispute-resolution')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Handle disputes and resolution',
    description: 'Process disputes and facilitate resolution between parties',
  })
  async resolveDispute(
    @Body()
    disputeData: {
      tripId: string;
      disputeType: string;
      evidence: any;
      resolution: any;
    },
    @GetTenant() tenantId: string,
  ) {
    try {
      const resolution = await this.enhancedTruckMatchingService.resolveDispute(
        disputeData,
        tenantId,
      );

      return {
        success: true,
        data: resolution,
        message: 'Dispute resolution processed',
      };
    } catch (error) {
      this.logger.error(
        `Error resolving dispute: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to resolve dispute');
    }
  }

  @Get('transaction-status/:transactionId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get transaction status and progress',
    description: 'Retrieve current status of a transaction in the flow',
  })
  async getTransactionStatus(
    @Param('transactionId') transactionId: string,
    @GetTenant() tenantId: string,
  ) {
    try {
      const status =
        await this.enhancedTruckMatchingService.getTransactionStatus(
          transactionId,
          tenantId,
        );

      return {
        success: true,
        data: status,
        message: 'Transaction status retrieved',
      };
    } catch (error) {
      this.logger.error(
        `Error getting transaction status: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to get transaction status');
    }
  }

  @Get('cargo-alignment-analytics')
  @UseGuards(JwtAuthGuard)
  async getCargoAlignmentAnalytics(@GetTenant() tenantId: string) {
    try {
      // Get all trucks for analytics
      const trucks = await this.matchingService.getAllTrucks(tenantId);

      const analytics = {
        totalTrucks: trucks.length,
        cargoTypeCoverage: {
          GENERAL: 0,
          FRAGILE: 0,
          HAZARDOUS: 0,
          REFRIGERATED: 0,
          LIQUID: 0,
          OVERSIZED: 0,
          VALUABLE: 0,
        },
        equipmentCoverage: {
          forklift: 0,
          crane: 0,
          tailLift: 0,
          sideLift: 0,
        },
        securityFeatures: {
          gps: 0,
          tracking: 0,
          temperatureMonitoring: 0,
          cargoMonitoring: 0,
        },
        certifications: {
          hazmat: 0,
          foodGrade: 0,
          pharmaceutical: 0,
        },
      };

      trucks.forEach((truck) => {
        // Cargo type coverage
        if (truck.cargoCapabilities?.supportedCargoTypes) {
          truck.cargoCapabilities.supportedCargoTypes.forEach(
            (type: string) => {
              if (
                analytics.cargoTypeCoverage[
                type as keyof typeof analytics.cargoTypeCoverage
                ] !== undefined
              ) {
                analytics.cargoTypeCoverage[
                  type as keyof typeof analytics.cargoTypeCoverage
                ]++;
              }
            },
          );
        }

        // Equipment coverage
        if (truck.loadingCapabilities) {
          if (truck.loadingCapabilities.hasForklift)
            analytics.equipmentCoverage.forklift++;
          if (truck.loadingCapabilities.hasCrane)
            analytics.equipmentCoverage.crane++;
          if (truck.loadingCapabilities.hasTailLift)
            analytics.equipmentCoverage.tailLift++;
          if (truck.loadingCapabilities.hasSideLift)
            analytics.equipmentCoverage.sideLift++;
        }

        // Security features
        if (truck.securityFeatures) {
          if (truck.securityFeatures.hasGps) analytics.securityFeatures.gps++;
          if (truck.securityFeatures.hasTracking)
            analytics.securityFeatures.tracking++;
          if (truck.securityFeatures.hasTemperatureAlerts)
            analytics.securityFeatures.temperatureMonitoring++;
          if (truck.securityFeatures.hasCargoMonitoring)
            analytics.securityFeatures.cargoMonitoring++;
        }

        // Certifications
        if (truck.certifications) {
          if (truck.certifications.hazmatCertified)
            analytics.certifications.hazmat++;
          if (truck.certifications.foodGradeCertified)
            analytics.certifications.foodGrade++;
          if (truck.certifications.pharmaceuticalCertified)
            analytics.certifications.pharmaceutical++;
        }
      });

      return {
        success: true,
        data: analytics,
        message: 'Cargo alignment analytics retrieved successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error getting cargo alignment analytics: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to get cargo alignment analytics');
    }
  }

  @Get('market-insights')
  @ApiOperation({
    summary: 'Get market insights for matching',
    description: `
    Get comprehensive market analytics for matching insights.
    
    **Returns:**
    - Total published loads
    - Total available trucks
    - Total active drivers
    - Market balance analysis
    - Average load weight and truck capacity
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Market insights retrieved successfully',
    schema: {
      example: {
        message: 'Market insights retrieved successfully',
        insights: {
          totalPublishedLoads: 150,
          totalAvailableTrucks: 200,
          totalActiveDrivers: 180,
          marketBalance: 'Truck Surplus',
          averageLoadWeight: 1500,
          averageTruckCapacity: 20000,
        },
      },
    },
  })
  async getMarketInsights(@Request() req) {
    const insights = await this.matchingService.getMarketInsights(
      req.user.tenantId,
    );

    return {
      message: 'Market insights retrieved successfully',
      insights,
    };
  }

  @Get('comprehensive-metrics')
  @ApiOperation({
    summary: 'Get comprehensive matching metrics',
    description: `
    Get comprehensive metrics including enhanced matching performance.
    
    **Returns:**
    - Total loads, trucks, and drivers
    - Matching performance metrics
    - Algorithm usage statistics
    - Response time analytics
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Comprehensive metrics retrieved successfully',
    schema: {
      example: {
        message: 'Comprehensive metrics retrieved successfully',
        metrics: {
          loads: 150,
          trucks: 200,
          drivers: 180,
          timestamp: '2024-01-15T10:30:00.000Z',
        },
      },
    },
  })
  async getComprehensiveMetrics(@Request() req) {
    const metrics = await this.matchingService.getComprehensiveMetrics(
      req.user.tenantId,
    );

    return {
      message: 'Comprehensive metrics retrieved successfully',
      metrics,
    };
  }

  @Post('enhanced/:loadId')
  @ApiOperation({
    summary: 'Enhanced matching with enrichment (market, risk, ML)',
    description:
      'Returns enriched matches for a given load, including market context, environmental impact, risk, and success probability.',
  })
  @ApiParam({ name: 'loadId', required: true })
  @ApiBody({ type: MatchRequestDto })
  @ApiResponse({ status: 200, description: 'Enhanced matches returned' })
  async getEnhancedMatches(
    @Param('loadId') loadId: string,
    @Body() body: MatchRequestDto,
    @Request() req,
  ) {
    const tenantId = req.user?.tenantId || body['tenantId'];
    if (!tenantId) {
      throw new BadRequestException('Missing tenant context');
    }

    const request: MatchRequestDto = { ...body, loadId };
    const results = await this.enhancedMatchingService.findEnhancedMatches(
      request,
      tenantId,
    );

    return results;
  }

  @Get('market-intelligence/conditions')
  @ApiOperation({
    summary: 'Get real-time market conditions',
    description:
      'Retrieves current market conditions including demand, pricing, capacity utilization, and external factors.',
  })
  @ApiResponse({
    status: 200,
    description: 'Market conditions retrieved successfully',
  })
  async getMarketConditions(@Request() req) {
    const tenantId = req.user?.tenantId || req.body?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Missing tenant context');
    }

    this.logger.log(`Market conditions request by tenant ${tenantId}`);
    try {
      const conditions =
        await this.marketIntelligenceService.getCurrentConditions(tenantId);
      return conditions;
    } catch (error) {
      this.logger.error(
        `Error getting market conditions: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('market-intelligence/demand-hotspots')
  @ApiOperation({
    summary: 'Get demand hotspots analysis',
    description:
      'Identifies high-demand routes and provides recommendations for pricing and capacity.',
  })
  @ApiResponse({
    status: 200,
    description: 'Demand hotspots analysis retrieved successfully',
  })
  async getDemandHotspots(@Request() req) {
    const tenantId = req.user?.tenantId || req.body?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Missing tenant context');
    }

    this.logger.log(`Demand hotspots request by tenant ${tenantId}`);
    try {
      const hotspots =
        await this.marketIntelligenceService.getDemandHotspots(tenantId);
      return hotspots;
    } catch (error) {
      this.logger.error(
        `Error getting demand hotspots: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('market-intelligence/capacity-utilization')
  @ApiOperation({
    summary: 'Get capacity utilization analysis',
    description:
      'Analyzes fleet capacity utilization by region and provides optimization recommendations.',
  })
  @ApiResponse({
    status: 200,
    description: 'Capacity utilization analysis retrieved successfully',
  })
  async getCapacityUtilization(@Request() req) {
    const tenantId = req.user?.tenantId || req.body?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Missing tenant context');
    }

    this.logger.log(`Capacity utilization request by tenant ${tenantId}`);
    try {
      const utilization =
        await this.marketIntelligenceService.getCapacityUtilization(tenantId);
      return utilization;
    } catch (error) {
      this.logger.error(
        `Error getting capacity utilization: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('market-intelligence/external-data')
  @ApiOperation({
    summary: 'Get external market data',
    description:
      'Retrieves real-time external data including fuel prices, weather, economic indicators, and regulatory updates.',
  })
  @ApiResponse({
    status: 200,
    description: 'External market data retrieved successfully',
  })
  async getExternalMarketData() {
    this.logger.log('External market data request');
    try {
      const externalData =
        await this.marketIntelligenceService.getExternalMarketData();
      return externalData;
    } catch (error) {
      this.logger.error(
        `Error getting external market data: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('clear-caches')
  @ApiOperation({
    summary: 'Clear all matching caches',
    description:
      'Clear all enhanced matching and optimization caches to refresh data',
  })
  @ApiResponse({
    status: 200,
    description: 'Caches cleared successfully',
    schema: {
      example: {
        message: 'Caches cleared successfully',
      },
    },
  })
  async clearAllCaches() {
    await this.matchingService.clearAllCaches();

    return {
      message: 'Caches cleared successfully',
    };
  }

  @Get('algorithms')
  @ApiOperation({
    summary: 'Get available matching algorithms',
    description:
      'Get list of all available matching algorithms with descriptions',
  })
  @ApiResponse({
    status: 200,
    description: 'Available algorithms retrieved successfully',
    schema: {
      example: {
        message: 'Available algorithms retrieved successfully',
        algorithms: [
          {
            name: 'WEIGHTED_SCORE',
            description: 'Standard matching with configurable weights',
            bestFor: 'General cargo matching with balanced criteria',
          },
          {
            name: 'HUNGARIAN',
            description: 'Optimal assignment for multiple loads and trucks',
            bestFor: 'Fleet optimization and batch assignments',
          },
          {
            name: 'GENETIC',
            description: 'Evolutionary optimization for complex scenarios',
            bestFor: 'Large-scale matching with multiple constraints',
          },
          {
            name: 'TOPSIS',
            description: 'Multi-criteria decision making',
            bestFor: 'Complex scenarios with conflicting criteria',
          },
          {
            name: 'HYBRID',
            description: 'Combines multiple algorithms for optimal results',
            bestFor: 'High-accuracy matching requirements',
          },
        ],
      },
    },
  })
  async getAvailableAlgorithms() {
    const algorithms = [
      {
        name: 'WEIGHTED_SCORE',
        description: 'Standard matching with configurable weights',
        bestFor: 'General cargo matching with balanced criteria',
      },
      {
        name: 'HUNGARIAN',
        description: 'Optimal assignment for multiple loads and trucks',
        bestFor: 'Fleet optimization and batch assignments',
      },
      {
        name: 'GENETIC',
        description: 'Evolutionary optimization for complex scenarios',
        bestFor: 'Large-scale matching with multiple constraints',
      },
      {
        name: 'TOPSIS',
        description: 'Multi-criteria decision making',
        bestFor: 'Complex scenarios with conflicting criteria',
      },
      {
        name: 'HYBRID',
        description: 'Combines multiple algorithms for optimal results',
        bestFor: 'High-accuracy matching requirements',
      },
    ];

    return {
      message: 'Available algorithms retrieved successfully',
      algorithms,
    };
  }

  @Get('scoring-factors')
  @ApiOperation({
    summary: 'Get available scoring factors',
    description:
      'Get list of all available scoring factors with descriptions and weights',
  })
  @ApiResponse({
    status: 200,
    description: 'Scoring factors retrieved successfully',
    schema: {
      example: {
        message: 'Scoring factors retrieved successfully',
        factors: [
          {
            name: 'distance',
            description: 'Proximity-based scoring with configurable thresholds',
            defaultWeight: 0.15,
            beneficial: false,
          },
          {
            name: 'capacity',
            description: 'Weight and volume utilization optimization',
            defaultWeight: 0.2,
            beneficial: true,
          },
          {
            name: 'equipment',
            description: 'Specialized equipment compatibility',
            defaultWeight: 0.25,
            beneficial: true,
          },
          {
            name: 'temperature',
            description: 'Refrigeration and temperature control matching',
            defaultWeight: 0.1,
            beneficial: true,
          },
          {
            name: 'security',
            description: 'GPS tracking, monitoring, and insurance requirements',
            defaultWeight: 0.1,
            beneficial: true,
          },
          {
            name: 'route',
            description: 'Clearance, escort, and route-specific requirements',
            defaultWeight: 0.05,
            beneficial: true,
          },
          {
            name: 'time',
            description: 'Urgency and availability-based scoring',
            defaultWeight: 0.05,
            beneficial: true,
          },
          {
            name: 'experience',
            description: 'Driver and truck experience with cargo types',
            defaultWeight: 0.02,
            beneficial: true,
          },
          {
            name: 'availability',
            description:
              'Real-time availability and estimated availability time',
            defaultWeight: 0.02,
            beneficial: true,
          },
          {
            name: 'specialRequirements',
            description: 'Fragile, hazardous, and specialized handling',
            defaultWeight: 0.01,
            beneficial: true,
          },
          {
            name: 'rating',
            description: 'Historical performance and reliability metrics',
            defaultWeight: 0.03,
            beneficial: true,
          },
          {
            name: 'cost',
            description: 'Market-competitive pricing analysis',
            defaultWeight: 0.02,
            beneficial: false,
          },
        ],
      },
    },
  })
  async getScoringFactors() {
    const factors = [
      {
        name: 'distance',
        description: 'Proximity-based scoring with configurable thresholds',
        defaultWeight: 0.15,
        beneficial: false,
      },
      {
        name: 'capacity',
        description: 'Weight and volume utilization optimization',
        defaultWeight: 0.2,
        beneficial: true,
      },
      {
        name: 'equipment',
        description: 'Specialized equipment compatibility',
        defaultWeight: 0.25,
        beneficial: true,
      },
      {
        name: 'temperature',
        description: 'Refrigeration and temperature control matching',
        defaultWeight: 0.1,
        beneficial: true,
      },
      {
        name: 'security',
        description: 'GPS tracking, monitoring, and insurance requirements',
        defaultWeight: 0.1,
        beneficial: true,
      },
      {
        name: 'route',
        description: 'Clearance, escort, and route-specific requirements',
        defaultWeight: 0.05,
        beneficial: true,
      },
      {
        name: 'time',
        description: 'Urgency and availability-based scoring',
        defaultWeight: 0.05,
        beneficial: true,
      },
      {
        name: 'experience',
        description: 'Driver and truck experience with cargo types',
        defaultWeight: 0.02,
        beneficial: true,
      },
      {
        name: 'availability',
        description: 'Real-time availability and estimated availability time',
        defaultWeight: 0.02,
        beneficial: true,
      },
      {
        name: 'specialRequirements',
        description: 'Fragile, hazardous, and specialized handling',
        defaultWeight: 0.01,
        beneficial: true,
      },
      {
        name: 'rating',
        description: 'Historical performance and reliability metrics',
        defaultWeight: 0.03,
        beneficial: true,
      },
      {
        name: 'cost',
        description: 'Market-competitive pricing analysis',
        defaultWeight: 0.02,
        beneficial: false,
      },
    ];

    return {
      message: 'Scoring factors retrieved successfully',
      factors,
    };
  }
}
