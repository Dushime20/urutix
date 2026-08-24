import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Headers,
  ParseUUIDPipe,
  Query,
  ValidationPipe,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentAnalyticsService } from './services/payment-analytics.service';
import { PaymentCalculationService } from './services/payment-calculation.service';
import { MobileMoneyPaymentService } from './services/mobile-money-payment.service';
import { MobileMoneyWebhookSettlementService } from './services/mobile-money-webhook-settlement.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentMethod, PaymentType, PaymentStatus } from '../../entities/payment.entity';
import { CreatePaymentDto, PaymentMetadata } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { AdvancePaymentRequestDto } from './dto/advance-payment-request.dto';
import { InitiateMobileMoneyPaymentDto } from './dto/initiate-mobile-money.dto';
import { SendMobileMoneyPaymentDto } from './dto/send-mobile-money-payment.dto';
import {
  ReconciliationRequestDto,
  ReconciliationResponseDto,
} from './dto/provider-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';
import { RateLimitGuard } from './guards/rate-limit.guard';
import * as crypto from 'crypto';
import { Public } from '../../common/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiTooManyRequestsResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentAnalyticsService: PaymentAnalyticsService,
    private readonly paymentCalculationService: PaymentCalculationService,
    private readonly mobileMoneyPaymentService: MobileMoneyPaymentService,
    private readonly mobileMoneyWebhookSettlement: MobileMoneyWebhookSettlementService,
    private readonly configService: ConfigService,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  @Post()
  @UseGuards(RateLimitGuard)
  @ApiOperation({
    summary: 'Create a new payment',
    description:
      'Create a new payment for a trip with proper validation and fraud detection',
  })
  @ApiBody({
    type: CreatePaymentDto,
    description: 'Payment creation data',
  })
  @ApiCreatedResponse({
    description: 'Payment created successfully',
    schema: {
      example: {
        message: 'Payment created successfully',
        payment: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          amount: 100.0,
          currency: 'USD',
          status: 'pending',
          paymentMethod: 'credit_card',
          paymentType: 'trip_payment',
          tripId: '550e8400-e29b-41d4-a716-446655440001',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiBadRequestResponse({ description: 'Invalid payment data' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async createPayment(
    @Body(new ValidationPipe({ transform: true }))
    createPaymentDto: CreatePaymentDto,
    @Request() req,
  ) {
    try {
      const payment = await this.paymentsService.createPayment(
        createPaymentDto,
        req.user.tenantId,
        req.user.userId,
      );

      return {
        message: 'Payment created successfully',
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          paymentType: payment.paymentType,
          tripId: payment.tripId,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Payment creation failed: ${error.message}`,
      );
    }
  }

  @Post('mobile-money/initiate')
  @UseGuards(RateLimitGuard)
  @ApiOperation({
    summary: 'Initiate Mobile Money payment',
    description: 'Create and initiate a mobile money payment for a trip',
  })
  @ApiBody({
    type: InitiateMobileMoneyPaymentDto,
    description: 'Mobile Money payment details',
  })
  @ApiCreatedResponse({
    description: 'Mobile Money payment initiated successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid payment data or missing phone number' })
  async initiateMobileMoneyPayment(
    @Body(new ValidationPipe({ transform: true })) dto: InitiateMobileMoneyPaymentDto,
    @Request() req,
  ) {
    try {
      // Generate a unique reference number for this payment
      const referenceNumber = dto.referenceNumber || `MM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // If a PENDING TRIP_PAYMENT already exists for this trip+payer (auto-created
      // by TripCompletionService after ePOD), reuse it and process it directly
      // rather than trying to create a duplicate.
      let payment: Payment | null = null;
      if (dto.tripId) {
        const existing = await this.paymentRepository.findOne({
          where: [
            { tripId: dto.tripId, tenantId: req.user.tenantId, payerId: req.user.userId, status: PaymentStatus.PENDING,    paymentType: PaymentType.TRIP_PAYMENT },
          ],
        });
        if (existing) {
          // Stamp the mobile money reference so processPayment can use it
          await this.paymentRepository.update(existing.id, {
            paymentMethod:   PaymentMethod.DIGITAL_WALLET,
            referenceNumber: referenceNumber,
            metadata: {
              ...(existing.metadata as object || {}),
              phoneNumber:  dto.phoneNumber,
              paymentMethod:'mobile_money',
              referenceId:  referenceNumber,
            },
          } as any);
          payment = { ...existing, paymentMethod: PaymentMethod.DIGITAL_WALLET, referenceNumber } as Payment;
          this.logger.log(`Reusing PENDING payment ${existing.id} for trip ${dto.tripId}`);
        }
      }

      if (!payment) {
        // No existing record — create a fresh one
        const createPaymentDto: CreatePaymentDto = {
          tripId: dto.tripId,
          amount: dto.amount,
          currency: dto.currency,
          paymentMethod: PaymentMethod.DIGITAL_WALLET,
          paymentType: (dto.paymentType as any) || PaymentType.TRIP_PAYMENT,
          description: dto.description || 'Mobile Money payment for cargo transportation',
          referenceNumber: referenceNumber,
          metadata: {
            ...dto.metadata,
            phoneNumber: dto.phoneNumber,
            paymentMethod: 'mobile_money',
            referenceId: referenceNumber,
          },
        };
        payment = await this.paymentsService.createPayment(
          createPaymentDto,
          req.user.tenantId,
          req.user.userId,
        );
      }

      // Process the payment immediately (initiate mobile money transaction)
      const processedPayment = await this.paymentsService.processPayment(
        payment.id,
        req.user.tenantId,
      );

      return {
        success: true,
        message: 'Mobile Money payment initiated successfully',
        data: {
          payment: {
            id: processedPayment.id,
            amount: processedPayment.amount,
            currency: processedPayment.currency,
            status: processedPayment.status,
            paymentMethod: processedPayment.paymentMethod,
            transactionId: processedPayment.transactionId,
            referenceNumber: processedPayment.referenceNumber,
          },
          transactionStatus: processedPayment.status === PaymentStatus.PROCESSING ? 'pending' : processedPayment.status,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to initiate Mobile Money payment: ${error.message}`,
      );
    }
  }

  @Post('mobile-money/send')
  @UseGuards(RateLimitGuard)
  @ApiOperation({
    summary: 'Send Mobile Money payment',
    description: 'Send a mobile money payment. A confirmation popup will be sent to the API account phone number to enter PIN/password. Once confirmed, the money will be transferred to the receiver phone number.',
  })
  @ApiBody({
    type: SendMobileMoneyPaymentDto,
    description: 'Mobile Money payment details with receiver phone number (where money will be sent)',
  })
  @ApiCreatedResponse({
    description: 'Mobile Money payment initiated successfully. Confirmation popup has been sent to API account.',
    schema: {
      example: {
        success: true,
        message: 'Mobile Money payment initiated successfully. A confirmation popup has been sent to the API account. Once confirmed, the payment will be sent to the receiver.',
        data: {
          payment: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            amount: 50000,
            currency: 'RWF',
            status: 'processing',
            paymentMethod: 'digital_wallet',
            transactionId: 'TXN_123456789',
            referenceNumber: 'MM-1705312200000-abc123',
          },
          payerPhoneNumber: '250783544364',
          receiverPhoneNumber: '250788888888',
          transactionStatus: 'pending',
          message: 'A mobile money popup has been sent to the API account phone. Once the PIN is entered and confirmed, the payment will be sent to the receiver.',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid payment data or missing receiver phone number' })
  async sendMobileMoneyPayment(
    @Body(new ValidationPipe({ transform: true })) dto: SendMobileMoneyPaymentDto,
    @Request() req,
  ) {
    try {
      // Get the API account phone number (the sender/payer that will get the popup)
      const apiAccountPhone = this.configService.get<string>('MOBILE_MONEY_ACCOUNT_PHONE');
      
      if (!apiAccountPhone) {
        throw new BadRequestException(
          'Mobile Money API account phone number is not configured. Please set MOBILE_MONEY_ACCOUNT_PHONE in your environment variables.',
        );
      }

      this.logger.log(
        `Sending Mobile Money payment: ${dto.amount} ${dto.currency} from API account ${apiAccountPhone} to receiver ${dto.receiverPhoneNumber} by user ${req.user.userId}`,
      );

      // Generate a unique reference number for this payment
      const referenceNumber = dto.referenceNumber || `MM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Prepare payment message
      const paymentMessage = dto.message || 
        (dto.metadata?.isLenderPayment 
          ? `Loan disbursement payment of ${dto.amount} ${dto.currency}`
          : `Payment of ${dto.amount} ${dto.currency} for cargo transportation services`);

      // Only include tripId if it's a valid non-empty string
      const validTripId = dto.tripId && dto.tripId.trim() !== '' ? dto.tripId : undefined;

      // ── Duplicate-payment guard ──────────────────────────────────────────────
      // For trip-linked payments (non-lender): if a PENDING TRIP_PAYMENT already
      // exists (auto-created by TripCompletionService after ePOD), reuse it —
      // that record IS the obligation the cargo owner is settling.
      // Only block if already PROCESSING or COMPLETED (payment already in flight / done).
      let existingPendingPayment: Payment | null = null;
      if (validTripId && !dto.metadata?.isLenderPayment) {
        const existingTripPayment = await this.paymentRepository.findOne({
          where: [
            { tripId: validTripId, tenantId: req.user.tenantId, payerId: req.user.userId, status: PaymentStatus.PENDING,    paymentType: PaymentType.TRIP_PAYMENT },
            { tripId: validTripId, tenantId: req.user.tenantId, payerId: req.user.userId, status: PaymentStatus.PROCESSING, paymentType: PaymentType.TRIP_PAYMENT },
            { tripId: validTripId, tenantId: req.user.tenantId, payerId: req.user.userId, status: PaymentStatus.COMPLETED,  paymentType: PaymentType.TRIP_PAYMENT },
          ],
        });

        if (existingTripPayment) {
          if (existingTripPayment.status === PaymentStatus.COMPLETED) {
            throw new BadRequestException(
              `This trip has already been paid (ref: ${existingTripPayment.referenceNumber}).`,
            );
          }
          if (existingTripPayment.status === PaymentStatus.PROCESSING) {
            throw new BadRequestException(
              `A payment for this trip is already being processed (ref: ${existingTripPayment.referenceNumber}). Please wait for confirmation.`,
            );
          }
          // PENDING — reuse it. We will update this record instead of creating a new one.
          existingPendingPayment = existingTripPayment;
          this.logger.log(
            `Reusing existing PENDING payment ${existingTripPayment.id} for trip ${validTripId} — updating with mobile money details.`,
          );
        }
      }

      // ── Resolve truck owner (payeeId) from trip ──────────────────────────────
      // This ensures the truck owner can see the payment in their dashboard via payeeId.
      let resolvedPayeeId: string | undefined = dto.metadata?.truckOwnerId as string | undefined;
      if (!resolvedPayeeId && validTripId) {
        try {
          const { Trip: TripEntity } = await import('../../entities/trip.entity');
          const tripForPayee = await this.paymentRepository.manager.findOne(
            TripEntity,
            {
              where: { id: validTripId },
              relations: ['truck'],
            },
          );
          resolvedPayeeId = (tripForPayee?.truck as any)?.ownerId ?? undefined;
        } catch {
          // Non-fatal — payeeId will remain undefined; phone-based matching still works
        }
      }

      // Create payment record — or reuse the existing PENDING obligation
      let payment: Payment;
      if (existingPendingPayment) {
        // Reuse the auto-created pending record — update it with mobile money details
        await this.paymentRepository.update(existingPendingPayment.id, {
          paymentMethod:   PaymentMethod.DIGITAL_WALLET,
          referenceNumber: referenceNumber,
          description:     paymentMessage,
          metadata: {
            ...(existingPendingPayment.metadata as object || {}),
            phoneNumber:          apiAccountPhone,
            receiverPhoneNumber:  dto.receiverPhoneNumber,
            paymentMethod:        'mobile_money',
            referenceId:          referenceNumber,
            senderId:             req.user.userId,
            senderType:           'cargo_owner',
            customFields: { paymentSource: 'direct_payment' },
          },
        } as any);
        payment = { ...existingPendingPayment, paymentMethod: PaymentMethod.DIGITAL_WALLET, referenceNumber } as Payment;
      } else {
        const createPaymentDto: CreatePaymentDto = {
          tripId: validTripId,
          amount: dto.amount,
          currency: dto.currency || 'RWF',
          paymentMethod: PaymentMethod.DIGITAL_WALLET,
          paymentType: validTripId ? PaymentType.TRIP_PAYMENT : PaymentType.SERVICE_FEE,
          description: paymentMessage,
          referenceNumber: referenceNumber,
          metadata: {
            ...dto.metadata,
            phoneNumber:         apiAccountPhone,
            receiverPhoneNumber: dto.receiverPhoneNumber,
            paymentMethod:       'mobile_money',
            referenceId:         referenceNumber,
            senderId:            req.user.userId,
            senderType:          dto.metadata?.isLenderPayment ? 'lender' : 'cargo_owner',
            lenderName:          dto.metadata?.lenderName,
            lenderId:            dto.metadata?.lenderId,
            loanId:              dto.metadata?.loanId,
            loanNumber:          dto.metadata?.loanNumber,
            customFields: {
              paymentSource: dto.metadata?.isLenderPayment ? 'lender_disbursement' : 'direct_payment',
            },
          },
        };
        payment = await this.paymentsService.createPayment(
          createPaymentDto,
          req.user.tenantId,
          req.user.userId,
        );
      }

      // Stamp payeeId so truck owner can find this payment by their userId
      if (resolvedPayeeId && !payment.payeeId) {
        await this.paymentRepository.update(payment.id, { payeeId: resolvedPayeeId });
        payment.payeeId = resolvedPayeeId;
      }

      // Create transfer to send 100% to the receiver
      const transfers = [{
        percentage: 100,
        phoneNumber: dto.receiverPhoneNumber,
        receiverMessage: paymentMessage,
      }];

      // Send the mobile money payment via API
      // The API account phone number will get the popup to confirm payment
      // Once confirmed, money will be transferred to the receiver
      try {
        const mobileMoneyResponse = await this.mobileMoneyPaymentService.createTransaction(
          dto.amount,
          apiAccountPhone, // API account phone number - this will get the popup to enter PIN
          referenceNumber,
          paymentMessage,
          transfers, // Money will be transferred to the receiver
          this.configService.get<string>('MOBILE_MONEY_CALLBACK_URL'),
        );

        const transaction = mobileMoneyResponse.savedTransaction || mobileMoneyResponse.transaction;
        const transactionId = transaction?.externalId || transaction?.id || referenceNumber;
        const txnStatus = transaction?.status || 'pending';

        if (txnStatus === 'failed') {
          await this.paymentsService.updatePaymentStatus(
            payment.id,
            {
              status: PaymentStatus.FAILED,
              failureReason: 'Mobile Money payment rejected by provider',
            },
            req.user.tenantId,
          );
          throw new BadRequestException('Mobile Money payment was rejected by the provider.');
        }

        // Await Ishema webhook — never mark COMPLETED until receiver confirms
        const updatedPayment = await this.paymentsService.updatePaymentStatus(
          payment.id,
          {
            status: PaymentStatus.PROCESSING,
            transactionId: transactionId,
            gatewayResponse:
              'Mobile money initiated. Awaiting PIN confirmation and delivery to receiver.',
          },
          req.user.tenantId,
        );

        // Store transaction details in metadata
        if (updatedPayment.metadata) {
          updatedPayment.metadata.externalId = transactionId;
          updatedPayment.metadata.referenceId = referenceNumber;
          updatedPayment.metadata.payerPhoneNumber = apiAccountPhone;
          updatedPayment.metadata.receiverPhoneNumber = dto.receiverPhoneNumber;
          await this.paymentRepository.save(updatedPayment);
        }

        this.logger.log(
          `Mobile Money payment initiated. Transaction ID: ${transactionId}, Reference: ${referenceNumber}. Awaiting webhook confirmation.`,
        );

        return {
          success: true,
          message:
            'Mobile Money payment initiated. Approve the PIN prompt — funds will be sent after confirmation.',
          data: {
            payment: {
              id: updatedPayment.id,
              amount: updatedPayment.amount,
              currency: updatedPayment.currency,
              status: updatedPayment.status,
              paymentMethod: updatedPayment.paymentMethod,
              transactionId: updatedPayment.transactionId,
              referenceNumber: updatedPayment.referenceNumber,
            },
            payerPhoneNumber: apiAccountPhone,
            receiverPhoneNumber: dto.receiverPhoneNumber,
            transactionStatus: 'pending',
            pendingConfirmation: true,
            message:
              'Awaiting MoMo PIN approval. Payment completes when the receiver gets the funds.',
          },
        };
      } catch (apiError: any) {
        // If API call fails, update payment status to failed
        await this.paymentsService.updatePaymentStatus(
          payment.id,
          {
            status: PaymentStatus.FAILED,
            failureReason: apiError.message || 'Failed to send mobile money popup',
            gatewayResponse: apiError.response?.data?.message || 'API call failed',
          },
          req.user.tenantId,
        );

        throw new BadRequestException(
          `Failed to initiate Mobile Money payment: ${apiError.message || 'Payment API error'}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to send Mobile Money payment:', error);
      throw new BadRequestException(
        `Failed to send Mobile Money payment: ${error.message}`,
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all payments',
    description:
      'Retrieve all payments for the current tenant with optional filtering',
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by payment status',
    enum: [
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'refunded',
      'escrow',
    ],
    required: false,
  })
  @ApiQuery({
    name: 'paymentType',
    description: 'Filter by payment type',
    enum: [
      'trip_payment',
      'subscription',
      'service_fee',
      'deposit',
      'refund',
      'withdrawal',
      'advance',
      'final',
    ],
    required: false,
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Filter by start date (ISO string)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Filter by end date (ISO string)',
    example: '2024-01-31T23:59:59Z',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of payments to return',
    example: '20',
    required: false,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Number of payments to skip',
    example: '0',
    required: false,
  })
  @ApiOkResponse({
    description: 'Payments retrieved successfully',
    schema: {
      example: {
        message: 'Payments retrieved successfully',
        payments: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            amount: 100.0,
            currency: 'USD',
            status: 'completed',
            paymentMethod: 'credit_card',
            paymentType: 'trip_payment',
            tripId: '550e8400-e29b-41d4-a716-446655440001',
            createdAt: '2024-01-15T10:30:00Z',
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async findAllPayments(
    @Request() req,
    @Query(new ValidationPipe({ transform: true })) filter?: PaymentFilterDto,
  ) {
    const payments = await this.paymentsService.findAllPayments(
      req.user.tenantId,
      req.user.userId,
      filter,
    );
    return {
      message: 'Payments retrieved successfully',
      payments,
    };
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get comprehensive payment analytics',
    description:
      'Retrieve detailed payment analytics including trends, insights, predictions, and risk analysis',
  })
  @ApiQuery({
    name: 'period',
    description: 'Analytics period (1d, 7d, 30d, 90d, 1y)',
    required: false,
    example: '30d',
  })
  @ApiOkResponse({
    description: 'Payment analytics retrieved successfully',
    schema: {
      example: {
        message: 'Payment analytics retrieved successfully',
        analytics: {
          period: '30d',
          dateRange: {
            start: '2024-01-01T00:00:00.000Z',
            end: '2024-01-31T23:59:59.999Z',
          },
          basicStats: {
            totalPayments: 150,
            completedPayments: 135,
            pendingPayments: 10,
            failedPayments: 5,
            successRate: 90.0,
            totalAmount: 15000.0,
            averageAmount: 111.11,
          },
          trends: [
            {
              period: '2024-01-01',
              totalAmount: 500.0,
              totalCount: 5,
              successRate: 100.0,
              averageAmount: 100.0,
              growthRate: 0.0,
            },
          ],
          insights: [
            {
              type: 'trend',
              title: 'High Success Rate',
              description: 'Payment success rate is above 90%',
              severity: 'low',
              confidence: 0.95,
              timestamp: '2024-01-31T12:00:00.000Z',
            },
          ],
          predictions: [
            {
              period: '7d',
              predictedAmount: 3500.0,
              predictedCount: 35,
              confidence: 0.85,
              factors: ['historical_trends', 'seasonal_patterns'],
            },
          ],
          riskAnalysis: {
            overallRiskScore: 15,
            riskLevel: 'low',
            riskFactors: {
              failedPayments: 5,
              fraudRiskScore: 10,
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getPaymentAnalytics(@Request() req, @Query('period') period?: string) {
    const analytics =
      await this.paymentAnalyticsService.getComprehensiveAnalytics(
        req.user.tenantId,
        period,
        req.user.userId,
      );
    return {
      message: 'Payment analytics retrieved successfully',
      analytics,
    };
  }

  @Get('analytics/trends')
  @ApiOperation({
    summary: 'Get payment trends',
    description:
      'Retrieve payment trends over time with growth rates and success metrics',
  })
  @ApiQuery({
    name: 'period',
    description: 'Analytics period (1d, 7d, 30d, 90d, 1y)',
    required: false,
    example: '30d',
  })
  @ApiOkResponse({
    description: 'Payment trends retrieved successfully',
    schema: {
      example: {
        message: 'Payment trends retrieved successfully',
        trends: [
          {
            period: '2024-01-01',
            totalAmount: 500.0,
            totalCount: 5,
            successRate: 100.0,
            averageAmount: 100.0,
            growthRate: 0.0,
          },
        ],
      },
    },
  })
  async getPaymentTrends(@Request() req, @Query('period') period?: string) {
    const dateRange = this.paymentAnalyticsService.getDateRange(
      period || '30d',
    );
    const trends = await this.paymentAnalyticsService.getPaymentTrends(
      req.user.tenantId,
      dateRange,
      req.user.userId,
    );
    return {
      message: 'Payment trends retrieved successfully',
      trends,
    };
  }

  @Get('analytics/insights')
  @ApiOperation({
    summary: 'Get payment insights',
    description:
      'Retrieve AI-generated insights about payment patterns, anomalies, and recommendations',
  })
  @ApiQuery({
    name: 'period',
    description: 'Analytics period (1d, 7d, 30d, 90d, 1y)',
    required: false,
    example: '30d',
  })
  @ApiOkResponse({
    description: 'Payment insights retrieved successfully',
    schema: {
      example: {
        message: 'Payment insights retrieved successfully',
        insights: [
          {
            type: 'trend',
            title: 'High Success Rate',
            description: 'Payment success rate is above 90%',
            severity: 'low',
            confidence: 0.95,
            timestamp: '2024-01-31T12:00:00.000Z',
          },
        ],
      },
    },
  })
  async getPaymentInsights(@Request() req, @Query('period') period?: string) {
    const dateRange = this.paymentAnalyticsService.getDateRange(
      period || '30d',
    );
    const insights = await this.paymentAnalyticsService.generateInsights(
      req.user.tenantId,
      dateRange,
      req.user.userId,
    );
    return {
      message: 'Payment insights retrieved successfully',
      insights,
    };
  }

  @Get('analytics/predictions')
  @ApiOperation({
    summary: 'Get payment predictions',
    description: 'Retrieve AI-powered payment predictions for future periods',
  })
  @ApiQuery({
    name: 'period',
    description: 'Base period for predictions (1d, 7d, 30d, 90d, 1y)',
    required: false,
    example: '30d',
  })
  @ApiOkResponse({
    description: 'Payment predictions retrieved successfully',
    schema: {
      example: {
        message: 'Payment predictions retrieved successfully',
        predictions: [
          {
            period: '7d',
            predictedAmount: 3500.0,
            predictedCount: 35,
            confidence: 0.85,
            factors: ['historical_trends', 'seasonal_patterns'],
          },
        ],
      },
    },
  })
  async getPaymentPredictions(
    @Request() req,
    @Query('period') period?: string,
  ) {
    const predictions = await this.paymentAnalyticsService.getPredictions(
      req.user.tenantId,
      period || '30d',
      req.user.userId,
    );
    return {
      message: 'Payment predictions retrieved successfully',
      predictions,
    };
  }

  @Get('analytics/risk')
  @ApiOperation({
    summary: 'Get payment risk analysis',
    description:
      'Retrieve comprehensive risk analysis including fraud detection and chargeback risk',
  })
  @ApiQuery({
    name: 'period',
    description: 'Analytics period (1d, 7d, 30d, 90d, 1y)',
    required: false,
    example: '30d',
  })
  @ApiOkResponse({
    description: 'Payment risk analysis retrieved successfully',
    schema: {
      example: {
        message: 'Payment risk analysis retrieved successfully',
        riskAnalysis: {
          overallRiskScore: 15,
          riskLevel: 'low',
          riskFactors: {
            failedPayments: 5,
            fraudRiskScore: 10,
          },
          recommendations: [
            'Review failed payment reasons and optimize payment flow',
          ],
        },
      },
    },
  })
  async getPaymentRiskAnalysis(
    @Request() req,
    @Query('period') period?: string,
  ) {
    const dateRange = this.paymentAnalyticsService.getDateRange(
      period || '30d',
    );
    const riskAnalysis = await this.paymentAnalyticsService.analyzeRisk(
      req.user.tenantId,
      dateRange,
      req.user.userId,
    );
    return {
      message: 'Payment risk analysis retrieved successfully',
      riskAnalysis,
    };
  }

  @Get('analytics/performance')
  @ApiOperation({
    summary: 'Get payment performance metrics',
    description:
      'Retrieve detailed performance metrics including processing times and system performance',
  })
  @ApiQuery({
    name: 'period',
    description: 'Analytics period (1d, 7d, 30d, 90d, 1y)',
    required: false,
    example: '30d',
  })
  @ApiOkResponse({
    description: 'Payment performance metrics retrieved successfully',
    schema: {
      example: {
        message: 'Payment performance metrics retrieved successfully',
        performanceMetrics: {
          averageProcessingTime: 2.5,
          peakHours: {
            peakHour: 14,
            peakHourCount: 25,
            hourlyDistribution: [
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 25, 0, 0, 0, 0, 0, 0, 0,
              0, 0,
            ],
          },
          providerPerformance: {
            credit_card: {
              total: 100,
              completed: 95,
              failed: 5,
              successRate: 95.0,
              averageAmount: 120.5,
            },
          },
        },
      },
    },
  })
  async getPaymentPerformanceMetrics(
    @Request() req,
    @Query('period') period?: string,
  ) {
    const dateRange = this.paymentAnalyticsService.getDateRange(
      period || '30d',
    );
    const performanceMetrics =
      await this.paymentAnalyticsService.getPerformanceMetrics(
        req.user.tenantId,
        dateRange,
        req.user.userId,
      );
    return {
      message: 'Payment performance metrics retrieved successfully',
      performanceMetrics,
    };
  }

  @Get('trip/:tripId/history')
  @ApiOperation({
    summary: 'Get payment history for a trip',
    description: 'Retrieve all payment records for a specific trip',
  })
  @ApiParam({
    name: 'tripId',
    description: 'Trip ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiOkResponse({
    description: 'Payment history retrieved successfully',
    schema: {
      example: {
        message: 'Payment history retrieved successfully',
        payments: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            amount: 70.0,
            currency: 'USD',
            status: 'completed',
            paymentType: 'advance',
            createdAt: '2024-01-15T10:30:00Z',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            amount: 30.0,
            currency: 'USD',
            status: 'escrow',
            paymentType: 'final',
            createdAt: '2024-01-15T10:30:00Z',
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiNotFoundResponse({ description: 'Trip not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getPaymentHistory(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Request() req,
  ) {
    const payments = await this.paymentsService.getPaymentHistory(
      tripId,
      req.user.tenantId,
    );
    return {
      message: 'Payment history retrieved successfully',
      payments,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get payment by ID',
    description: 'Retrieve a specific payment by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Payment retrieved successfully',
    schema: {
      example: {
        message: 'Payment retrieved successfully',
        payment: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          amount: 100.0,
          currency: 'USD',
          status: 'completed',
          paymentMethod: 'credit_card',
          paymentType: 'trip_payment',
          tripId: '550e8400-e29b-41d4-a716-446655440001',
          transactionId: 'TXN_123456789',
          processedAt: '2024-01-15T10:30:00Z',
          processingFee: 2.9,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiNotFoundResponse({ description: 'Payment not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async findOnePayment(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const payment = await this.paymentsService.findOnePayment(
      id,
      req.user.tenantId,
      req.user.userId,
    );
    return {
      message: 'Payment retrieved successfully',
      payment,
    };
  }

  @Patch(':id/status')
  @UseGuards(RateLimitGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Update payment status',
    description: 'Update the status of a payment (admin/authorized users only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdatePaymentStatusDto,
    description: 'Payment status update data',
  })
  @ApiOkResponse({
    description: 'Payment status updated successfully',
    schema: {
      example: {
        message: 'Payment status updated successfully',
        payment: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'completed',
          transactionId: 'TXN_123456789',
          processedAt: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiNotFoundResponse({ description: 'Payment not found' })
  @ApiBadRequestResponse({ description: 'Invalid status update data' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async updatePaymentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ transform: true }))
    updatePaymentStatusDto: UpdatePaymentStatusDto,
    @Request() req,
  ) {
    try {
      const payment = await this.paymentsService.updatePaymentStatus(
        id,
        updatePaymentStatusDto,
        req.user.tenantId,
        req.user.userId,
      );

      return {
        message: 'Payment status updated successfully',
        payment: {
          id: payment.id,
          status: payment.status,
          transactionId: payment.transactionId,
          processedAt: payment.processedAt,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Payment status update failed: ${error.message}`,
      );
    }
  }

  @Post(':id/process')
  @UseGuards(RateLimitGuard)
  @ApiOperation({
    summary: 'Process payment',
    description: 'Process a pending payment through the payment gateway',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Payment processed successfully',
    schema: {
      example: {
        message: 'Payment processed successfully',
        payment: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'completed',
          transactionId: 'TXN_123456789',
          processedAt: '2024-01-15T10:30:00Z',
          processingFee: 2.9,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiNotFoundResponse({ description: 'Payment not found' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async processPayment(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    try {
      const payment = await this.paymentsService.processPayment(
        id,
        req.user.tenantId,
      );

      return {
        message: 'Payment processed successfully',
        payment: {
          id: payment.id,
          status: payment.status,
          transactionId: payment.transactionId,
          processedAt: payment.processedAt,
          processingFee: payment.processingFee,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Payment processing failed: ${error.message}`,
      );
    }
  }

  @Post(':id/refund')
  @UseGuards(RateLimitGuard)
  @ApiOperation({
    summary: 'Refund payment',
    description: 'Create a refund for a completed payment',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Refund amount (must not exceed original payment)',
          example: 50.0,
        },
        reason: {
          type: 'string',
          description: 'Reason for refund',
          example: 'Customer requested partial refund',
        },
      },
      required: ['amount', 'reason'],
    },
  })
  @ApiOkResponse({
    description: 'Payment refunded successfully',
    schema: {
      example: {
        message: 'Payment refunded successfully',
        refund: {
          id: '550e8400-e29b-41d4-a716-446655440003',
          amount: -50.0,
          status: 'completed',
          description:
            'Refund for payment 550e8400-e29b-41d4-a716-446655440000: Customer requested partial refund',
          referenceNumber: 'REF_1705312200000',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiNotFoundResponse({ description: 'Payment not found' })
  @ApiBadRequestResponse({ description: 'Invalid refund data' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async refundPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ transform: true }))
    refundData: { amount: number; reason: string },
    @Request() req,
  ) {
    try {
      const refund = await this.paymentsService.refundPayment(
        id,
        refundData.amount,
        refundData.reason,
        req.user.tenantId,
      );

      return {
        message: 'Payment refunded successfully',
        refund: {
          id: refund.id,
          amount: refund.amount,
          status: refund.status,
          description: refund.description,
          referenceNumber: refund.referenceNumber,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Payment refund failed: ${error.message}`);
    }
  }

  @Post('reconcile')
  @UseGuards(RateLimitGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Reconcile payments with provider records',
    description:
      'Compare internal payment records with provider statement (admin only)',
  })
  @ApiBody({
    type: ReconciliationRequestDto,
    description: 'Reconciliation request data',
  })
  @ApiOkResponse({
    description: 'Reconciliation completed successfully',
    type: ReconciliationResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin access required' })
  @ApiBadRequestResponse({ description: 'Invalid reconciliation data' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async reconcilePayments(
    @Body(new ValidationPipe({ transform: true }))
    reconciliationData: ReconciliationRequestDto,
    @Request() req,
  ) {
    try {
      const mismatches = await this.paymentsService.reconcilePayments(
        reconciliationData.providerPayments,
      );

      return {
        status: 'completed',
        processedCount: reconciliationData.providerPayments.length,
        mismatchCount: mismatches.length,
        mismatches,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(`Reconciliation failed: ${error.message}`);
    }
  }

  @Get('fraud-audit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Batch fraud analysis',
    description: 'Perform batch fraud analysis on all payments (admin only)',
  })
  @ApiOkResponse({
    description: 'Batch fraud analysis completed',
    schema: {
      example: {
        message: 'Batch fraud analysis completed',
        results: [
          {
            payment: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              amount: 100.0,
              status: 'completed',
            },
            suspicious: false,
          },
          {
            payment: {
              id: '550e8400-e29b-41d4-a716-446655440001',
              amount: 5000.0,
              status: 'completed',
            },
            suspicious: true,
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin access required' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async batchFraudCheck(@Request() req) {
    try {
      const results = await this.paymentsService.batchFraudCheck();
      return {
        message: 'Batch fraud analysis completed',
        results,
      };
    } catch (error) {
      throw new BadRequestException(`Fraud audit failed: ${error.message}`);
    }
  }

  @Post('advance-request')
  @UseGuards(RateLimitGuard)
  @ApiOperation({
    summary: 'Request advance payment for a trip',
    description: 'Truck owners can request advance payment for a trip before completion',
  })
  @ApiBody({
    type: AdvancePaymentRequestDto,
    description: 'Advance payment request data',
  })
  @ApiCreatedResponse({
    description: 'Advance payment request submitted successfully',
    schema: {
      example: {
        message: 'Advance payment request submitted successfully',
        request: {
          id: '550e8400-e29b-41d4-a716-446655440004',
          tripId: '550e8400-e29b-41d4-a716-446655440001',
          requestedAmount: 500.0,
          status: 'pending',
          urgency: 'medium',
          createdAt: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiBadRequestResponse({ description: 'Invalid advance payment request data' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async requestAdvancePayment(
    @Body(new ValidationPipe({ transform: true }))
    advanceRequestDto: AdvancePaymentRequestDto,
    @Request() req,
  ) {
    try {
      const request = await this.paymentsService.requestAdvancePayment(
        advanceRequestDto,
        req.user.tenantId,
        req.user.userId,
      );

      return {
        message: 'Advance payment request submitted successfully',
        request: {
          id: request.id,
          tripId: request.tripId,
          requestedAmount: request.amount,
          status: request.status,
          urgency: advanceRequestDto.urgency,
          createdAt: request.createdAt,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Advance payment request failed: ${error.message}`,
      );
    }
  }

  @Get('forecast')
  @ApiOperation({
    summary: 'Get payment forecast',
    description: 'Get payment forecast for upcoming payments (next 30 days)',
  })
  @ApiQuery({
    name: 'days',
    description: 'Number of days to forecast (default: 30)',
    required: false,
    example: '30',
  })
  @ApiOkResponse({
    description: 'Payment forecast retrieved successfully',
    schema: {
      example: {
        message: 'Payment forecast retrieved successfully',
        forecast: {
          period: '30 days',
          totalUpcoming: 5000.0,
          totalPending: 3000.0,
          totalOverdue: 500.0,
          payments: [
            {
              id: '550e8400-e29b-41d4-a716-446655440000',
              tripId: '550e8400-e29b-41d4-a716-446655440001',
              tripNumber: 'TRIP-2024-001',
              amount: 500.0,
              currency: 'USD',
              dueDate: '2024-01-20T00:00:00Z',
              status: 'pending',
              paymentType: 'advance',
              daysUntilDue: 5,
            },
          ],
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Access denied for this tenant',
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getPaymentForecast(
    @Request() req,
    @Query('days') days?: string,
  ) {
    try {
      const forecastDays = days ? parseInt(days, 10) : 30;
      const forecast = await this.paymentsService.getPaymentForecast(
        req.user.tenantId,
        req.user.userId,
        forecastDays,
      );

      return {
        message: 'Payment forecast retrieved successfully',
        forecast,
      };
    } catch (error) {
      throw new BadRequestException(
        `Payment forecast retrieval failed: ${error.message}`,
      );
    }
  }

  @Post('webhooks/mobile-money')
  @Public() // Webhooks from external services don't have JWT tokens
  @ApiOperation({
    summary: 'Mobile Money Payment webhook callback',
    description: 'Receive payment callbacks from Mobile Money Payment API',
  })
  @ApiBody({
    description: 'Mobile Money callback payload',
    schema: {
      type: 'object',
      properties: {
        referenceId: { type: 'string' },
        status: { type: 'string', enum: ['success', 'failed', 'pending'] },
        statusCode: { type: 'number' },
        date: { type: 'string' },
        amount: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  @ApiOkResponse({ description: 'Webhook processed successfully' })
  async handleMobileMoneyWebhook(
    @Body() payload: any,
    @Headers('x-webhook-signature') signature: string,
  ) {
    // ── Signature verification ──────────────────────────────────────────────
    // Verify the HMAC-SHA256 signature supplied by the Mobile Money provider to
    // prevent unauthenticated callers from marking payments as COMPLETED.
    //
    // Expected header: X-Webhook-Signature: sha256=<hex-digest>
    //
    // The secret is stored in MOBILE_MONEY_WEBHOOK_SECRET env var.
    // If no secret is configured we log a warning and continue — this allows
    // local development without breaking production when the secret IS set.
    const webhookSecret = this.configService.get<string>('MOBILE_MONEY_WEBHOOK_SECRET');
    if (webhookSecret) {
      if (!signature) {
        this.logger.warn(
          'Mobile Money webhook received without X-Webhook-Signature header — rejected',
        );
        return { message: 'Missing webhook signature', received: false };
      }

      const rawBody = JSON.stringify(payload);
      const expectedSig =
        'sha256=' +
        crypto
          .createHmac('sha256', webhookSecret)
          .update(rawBody, 'utf8')
          .digest('hex');

      // Constant-time comparison to prevent timing attacks.
      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSig);
      const signaturesMatch =
        sigBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(sigBuffer, expectedBuffer);

      if (!signaturesMatch) {
        this.logger.warn(
          'Mobile Money webhook signature mismatch — request rejected',
        );
        return { message: 'Invalid webhook signature', received: false };
      }
    } else {
      this.logger.warn(
        'MOBILE_MONEY_WEBHOOK_SECRET is not configured — webhook signature verification is DISABLED. Set this variable in production.',
      );
    }

    try {
      // Enhanced webhook logging
      this.logger.log(`Mobile Money webhook received: ${payload.referenceId} → ${payload.status}`);
      this.logger.debug(`Full webhook payload: ${JSON.stringify(payload, null, 2)}`);
      
      // Process the callback
      const callbackData = await this.mobileMoneyPaymentService.processCallback(payload);

      // Find payment by referenceId - search in all tenants (webhook doesn't have tenant context)
      // We'll search by referenceId in transactionId, referenceNumber, or metadata
      const allPayments = await this.paymentRepository.find({
        where: [
          { transactionId: callbackData.referenceId },
          { referenceNumber: callbackData.referenceId },
        ],
        relations: ['trip'],
      });

      // Also search in metadata for referenceId or externalId
      const paymentsWithMetadata = await this.paymentRepository
        .createQueryBuilder('payment')
        .where(
          "(payment.metadata->>'referenceId' = :referenceId OR payment.metadata->>'externalId' = :referenceId)",
          {
            referenceId: callbackData.referenceId,
          },
        )
        .getMany();

      const payment = allPayments[0] || paymentsWithMetadata[0] || await this.mobileMoneyWebhookSettlement.findPaymentForCallback(callbackData.referenceId);

      if (!payment) {
        if (String(callbackData.referenceId || '').startsWith('PARK-')) {
          if (callbackData.status === 'success') {
            await this.mobileMoneyWebhookSettlement.settleParkingReservation({
              referenceId: callbackData.referenceId,
              amount: callbackData.amount,
              status: callbackData.status,
            });
          } else if (callbackData.status === 'failed') {
            await this.mobileMoneyWebhookSettlement.failParkingReservation({
              referenceId: callbackData.referenceId,
              reason: callbackData.message || 'Ishema payment failed',
            });
          }
          return {
            message: 'Parking reservation payment processed',
            referenceId: callbackData.referenceId,
            received: true,
          };
        }
        this.logger.warn(
          `Payment not found for Mobile Money reference: ${callbackData.referenceId}. Searched ${allPayments.length} direct matches, ${paymentsWithMetadata.length} metadata matches.`,
        );
        return { message: 'Payment not found', received: true };
      }

      this.logger.log(`Found payment ${payment.id} for reference ${callbackData.referenceId}, current status: ${payment.status}`);

      if (
        payment.status === PaymentStatus.CANCELLED ||
        payment.status === PaymentStatus.FAILED
      ) {
        this.logger.warn(
          `Ignoring Mobile Money webhook for ${callbackData.referenceId} — payment ${payment.id} is ${payment.status}`,
        );
        return {
          message: `Payment already ${payment.status}`,
          referenceId: callbackData.referenceId,
          received: true,
        };
      }

      // Skip duplicate webhook only when fully settled
      if (
        callbackData.status === 'success' &&
        payment.status === PaymentStatus.COMPLETED &&
        (payment.metadata as any)?.momoPhase !== 'collection' &&
        (payment.metadata as any)?.momoPhase !== 'payout_initiating'
      ) {
        this.logger.log(`Payment ${payment.id} already COMPLETED — webhook idempotent`);
        return {
          message: 'Already processed',
          referenceId: callbackData.referenceId,
          status: callbackData.status,
        };
      }

      // Update payment status based on callback
      if (callbackData.status === 'success') {
        this.logger.log(`Processing successful webhook for payment ${payment.id}, amount: ${callbackData.amount}`);
        
        const isLenderCollection =
          !!(payment.metadata as any)?.isLenderPayment &&
          (payment.metadata as any)?.momoPhase === 'collection';

        this.logger.log(`Payment type: ${isLenderCollection ? 'Lender Collection' : 'Regular Payment'}`);

        // Lender leg-1 collection: keep PROCESSING until payout webhook completes
        const newStatus = isLenderCollection ? PaymentStatus.PROCESSING : PaymentStatus.COMPLETED;
        this.logger.log(`Updating payment ${payment.id} status from ${payment.status} to ${newStatus}`);

        await this.paymentsService.updatePaymentStatus(
          payment.id,
          {
            status: newStatus,
            transactionId: payment.transactionId || callbackData.referenceId,
            gatewayResponse: callbackData.message || 'Mobile Money payment confirmed',
            processedAt: new Date(),
          },
          payment.tenantId,
        );

        await this.mobileMoneyWebhookSettlement.settleSuccessfulPayment(payment, callbackData);
        this.logger.log(`Successfully processed webhook for payment ${payment.id}`);
      } else if (callbackData.status === 'failed') {
        this.logger.error(`Processing failed webhook for payment ${payment.id}, reason: ${callbackData.message}`);
        
        await this.paymentsService.updatePaymentStatus(
          payment.id,
          {
            status: PaymentStatus.FAILED,
            failureReason: callbackData.message || 'Mobile Money payment failed',
            processedAt: new Date(),
          },
          payment.tenantId,
        );

        await this.mobileMoneyWebhookSettlement.settleFailedPayment(payment, callbackData);
        this.logger.log(`Successfully processed failed webhook for payment ${payment.id}`);
      }

      return {
        message: 'Webhook processed successfully',
        referenceId: callbackData.referenceId,
        status: callbackData.status,
      };
    } catch (error) {
      this.logger.error('Failed to process Mobile Money webhook:', error);
      return {
        message: 'Webhook processing failed',
        error: error.message,
      };
    }
  }

  @Get('transactions/:referenceId/status')
  @ApiOperation({
    summary: 'Check Mobile Money transaction status',
    description: 'Check the status of a Mobile Money payment transaction by reference ID',
  })
  @ApiParam({
    name: 'referenceId',
    description: 'Transaction reference ID',
    type: 'string',
  })
  @ApiOkResponse({ description: 'Transaction status retrieved successfully' })
  async checkMobileMoneyTransactionStatus(
    @Param('referenceId') referenceId: string,
  ) {
    try {
      const status = await this.mobileMoneyPaymentService.checkTransactionStatus(referenceId);

      return {
        message: 'Transaction status retrieved successfully',
        transaction: status.transaction || status.savedTransaction,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to check transaction status: ${error.message}`,
      );
    }
  }

  @Get('trip/:tripId/advance-payment-calculation')
  @ApiOperation({
    summary: 'Calculate advance payment amounts for a trip',
    description:
      'Calculate advance and final payment amounts based on transportation fee and bid preferences',
  })
  @ApiParam({
    name: 'tripId',
    description: 'Trip ID to calculate advance payment for',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Advance payment calculation retrieved successfully',
    schema: {
      example: {
        transportationFee: 1000,
        advancePaymentPercentage: 70,
        advanceAmount: 700,
        finalAmount: 300,
        requireAdvancePayment: true,
        currency: 'USD',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Trip not found or no accepted bid found' })
  async getAdvancePaymentCalculation(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Request() req,
  ) {
    try {
      const tenantId = req.user?.tenantId;
      const calculation =
        await this.paymentCalculationService.calculateAdvancePaymentForTrip(
          tripId,
          tenantId,
        );

      // Return a default calculation if trip/bid not found instead of throwing error
      // This allows the frontend to display default values gracefully
      if (!calculation) {
        this.logger.warn(
          `Could not calculate advance payment for trip ${tripId} (tenant: ${tenantId}). Trip or accepted bid not found. Returning default calculation.`,
        );
        
        // Return default calculation with 0 values
        return {
          success: true,
          data: {
            transportationFee: 0,
            advancePaymentPercentage: 70,
            advanceAmount: 0,
            finalAmount: 0,
            requireAdvancePayment: true,
            currency: 'USD',
          },
        };
      }

      return {
        success: true,
        data: calculation,
      };
    } catch (error) {
      this.logger.error(
        `Failed to calculate advance payment for trip ${tripId}:`,
        error,
      );
      
      // Return default calculation on error instead of throwing
      // This prevents console errors in the frontend
      return {
        success: true,
        data: {
          transportationFee: 0,
          advancePaymentPercentage: 70,
          advanceAmount: 0,
          finalAmount: 0,
          requireAdvancePayment: true,
          currency: 'USD',
        },
      };
    }
  }
}
