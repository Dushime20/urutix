import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
} from '@nestjs/swagger';

import { PaymentsService } from '../payments.service';
import { TripCompletionService } from '../../trips/services/trip-completion.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../auth/guards/roles.guard';
import { UserRole } from '../../../entities/user.entity';
import { PaymentStatus, PaymentType } from '../../../entities/payment.entity';

@ApiTags('Pending Payments')
@Controller('pending-payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PendingPaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly tripCompletionService: TripCompletionService,
  ) {}

  /**
   * GET /pending-payments/cargo-owner
   * Get pending payments for cargo owner (payments they need to make)
   */
  @Get('cargo-owner')
  @Roles(UserRole.CARGO_OWNER, UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get pending payments for cargo owner',
    description: 'Returns all pending payments that the cargo owner needs to make to truck owners for completed trips'
  })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ description: 'Pending payments retrieved successfully' })
  async getPendingPaymentsForCargoOwner(
    @Request() req,
    @Query('status') status?: PaymentStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const pendingPayments = await this.tripCompletionService.getPendingPaymentsForCargoOwner(
      req.user.userId,
      req.user.tenantId,
    );

    // Apply additional filters if provided
    let filteredPayments = pendingPayments;
    
    if (status) {
      filteredPayments = filteredPayments.filter(p => p.status === status);
    }

    // Apply pagination
    const startIndex = offset || 0;
    const endIndex = limit ? startIndex + limit : undefined;
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

    // Calculate summary statistics
    const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const overduePayments = filteredPayments.filter(p => 
      p.dueDate && new Date(p.dueDate) < new Date()
    );
    const dueSoonPayments = filteredPayments.filter(p => {
      if (!p.dueDate) return false;
      const daysUntilDue = Math.ceil(
        (new Date(p.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilDue <= 7 && daysUntilDue >= 0;
    });

    return {
      success: true,
      message: 'Pending payments retrieved successfully',
      data: {
        payments: paginatedPayments.map(payment => ({
          id: payment.id,
          tripId: payment.tripId,
          amount: Number(payment.amount),
          currency: payment.currency,
          dueDate: payment.dueDate,
          status: payment.status,
          paymentType: payment.paymentType,
          description: payment.description,
          referenceNumber: payment.referenceNumber,
          createdAt: payment.createdAt,
          metadata: payment.metadata,
          // Payment source: direct_payment | lender_disbursement | auto_created
          paymentSource: (payment.metadata as any)?.paymentSource ||
            (payment.metadata as any)?.customFields?.paymentSource ||
            ((payment.metadata as any)?.isLenderPayment ? 'lender_disbursement' : 'direct_payment'),
          trip: payment.trip ? {
            id: payment.trip.id,
            tripNumber: payment.trip.tripNumber,
            status: payment.trip.status,
            load: payment.trip.load ? {
              id: payment.trip.load.id,
              title: payment.trip.load.title,
              cargoType: payment.trip.load.cargoType,
            } : null,
          } : null,
        })),
        summary: {
          totalPayments: filteredPayments.length,
          totalAmount,
          currency: paginatedPayments[0]?.currency || 'RWF',
          overdueCount: overduePayments.length,
          overdueAmount: overduePayments.reduce((sum, p) => sum + Number(p.amount), 0),
          dueSoonCount: dueSoonPayments.length,
          dueSoonAmount: dueSoonPayments.reduce((sum, p) => sum + Number(p.amount), 0),
        },
        pagination: {
          total: filteredPayments.length,
          limit: limit || filteredPayments.length,
          offset: startIndex,
          hasMore: endIndex ? endIndex < filteredPayments.length : false,
        },
      },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /pending-payments/cargo-owner/completed
   * Get completed (paid) transactions for cargo owner — their transaction history
   */
  @Get('cargo-owner/completed')
  @Roles(UserRole.CARGO_OWNER, UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get completed payments for cargo owner',
    description: 'Returns all completed payments made by the cargo owner — their full transaction history with trip, load, and route details',
  })
  @ApiQuery({ name: 'paymentType', required: false, enum: PaymentType })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ description: 'Completed payments retrieved successfully' })
  async getCompletedPaymentsForCargoOwner(
    @Request() req,
    @Query('paymentType') paymentType?: PaymentType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    let payments = await this.tripCompletionService.getCompletedPaymentsForCargoOwner(
      req.user.userId,
      req.user.tenantId,
    );

    // Apply optional filters
    if (paymentType) {
      payments = payments.filter(p => p.paymentType === paymentType);
    }
    if (startDate) {
      const from = new Date(startDate);
      payments = payments.filter(p => new Date(p.processedAt || p.createdAt) >= from);
    }
    if (endDate) {
      const to = new Date(endDate);
      payments = payments.filter(p => new Date(p.processedAt || p.createdAt) <= to);
    }

    // Pagination
    const startIndex = Number(offset) || 0;
    const endIndex = limit ? startIndex + Number(limit) : undefined;
    const paginatedPayments = payments.slice(startIndex, endIndex);

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      success: true,
      message: 'Completed payments retrieved successfully',
      data: {
        payments: paginatedPayments.map(payment => ({
          id: payment.id,
          tripId: payment.tripId,
          amount: Number(payment.amount),
          currency: payment.currency,
          status: payment.status,
          paymentType: payment.paymentType,
          paymentMethod: payment.paymentMethod,
          description: payment.description,
          referenceNumber: payment.referenceNumber,
          processedAt: payment.processedAt,
          createdAt: payment.createdAt,
          payeeId: payment.payeeId,
          isLenderPayment: !!(payment.metadata as any)?.isLenderPayment,
          lenderName: (payment.metadata as any)?.lenderName || null,
          trip: payment.trip ? {
            id: payment.trip.id,
            tripNumber: payment.trip.tripNumber,
            status: payment.trip.status,
            load: payment.trip.load ? {
              id: payment.trip.load.id,
              title: payment.trip.load.title,
              cargoType: payment.trip.load.cargoType,
              origin: payment.trip.load.origin,
              destination: payment.trip.load.destination,
            } : null,
          } : null,
        })),
        summary: {
          totalPayments: payments.length,
          totalAmount,
          currency: paginatedPayments[0]?.currency || 'RWF',
          tripPaymentsCount: payments.filter(p => p.paymentType === PaymentType.TRIP_PAYMENT).length,
          advancePaymentsCount: payments.filter(p => p.paymentType === PaymentType.ADVANCE).length,
        },
        pagination: {
          total: payments.length,
          limit: limit ? Number(limit) : payments.length,
          offset: startIndex,
          hasMore: endIndex ? endIndex < payments.length : false,
        },
      },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /pending-payments/truck-owner
   * Get expected payments for truck owner (payments they will receive)
   */
  @Get('truck-owner')
  @Roles(UserRole.TRUCK_OWNER, UserRole.FLEET_MANAGER, UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get expected payments for truck owner',
    description: 'Returns all expected payments that the truck owner will receive from cargo owners for completed trips'
  })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ description: 'Expected payments retrieved successfully' })
  async getExpectedPaymentsForTruckOwner(
    @Request() req,
    @Query('status') status?: PaymentStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const expectedPayments = await this.tripCompletionService.getExpectedPaymentsForTruckOwner(
      req.user.userId,
      req.user.tenantId,
    );

    // Apply additional filters if provided
    let filteredPayments = expectedPayments;
    
    if (status) {
      filteredPayments = filteredPayments.filter(p => p.status === status);
    }

    // Apply pagination
    const startIndex = offset || 0;
    const endIndex = limit ? startIndex + limit : undefined;
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

    // Calculate summary statistics
    const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const overduePayments = filteredPayments.filter(p => 
      p.dueDate && new Date(p.dueDate) < new Date()
    );
    const dueSoonPayments = filteredPayments.filter(p => {
      if (!p.dueDate) return false;
      const daysUntilDue = Math.ceil(
        (new Date(p.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilDue <= 7 && daysUntilDue >= 0;
    });

    return {
      success: true,
      message: 'Expected payments retrieved successfully',
      data: {
        payments: paginatedPayments.map(payment => ({
          id: payment.id,
          tripId: payment.tripId,
          amount: Number(payment.amount),
          currency: payment.currency,
          dueDate: payment.dueDate,
          status: payment.status,
          paymentType: payment.paymentType,
          description: payment.description,
          referenceNumber: payment.referenceNumber,
          createdAt: payment.createdAt,
          metadata: payment.metadata,
          // Payment source label so truck owner knows how they're being paid
          paymentSource: (payment.metadata as any)?.paymentSource ||
            (payment.metadata as any)?.customFields?.paymentSource ||
            ((payment.metadata as any)?.isLenderPayment ? 'lender_disbursement' : 'direct_payment'),
          isLenderPayment: !!(payment.metadata as any)?.isLenderPayment,
          lenderName: (payment.metadata as any)?.lenderName || null,
          trip: payment.trip ? {
            id: payment.trip.id,
            tripNumber: payment.trip.tripNumber,
            status: payment.trip.status,
            load: payment.trip.load ? {
              id: payment.trip.load.id,
              title: payment.trip.load.title,
              cargoType: payment.trip.load.cargoType,
            } : null,
          } : null,
        })),
        summary: {
          totalPayments: filteredPayments.length,
          totalAmount,
          currency: paginatedPayments[0]?.currency || 'RWF',
          overdueCount: overduePayments.length,
          overdueAmount: overduePayments.reduce((sum, p) => sum + Number(p.amount), 0),
          dueSoonCount: dueSoonPayments.length,
          dueSoonAmount: dueSoonPayments.reduce((sum, p) => sum + Number(p.amount), 0),
        },
        pagination: {
          total: filteredPayments.length,
          limit: limit || filteredPayments.length,
          offset: startIndex,
          hasMore: endIndex ? endIndex < filteredPayments.length : false,
        },
      },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /pending-payments/truck-owner/all
   * Get ALL received payments for truck owner — including lender disbursements by phone
   */
  @Get('truck-owner/all')
  @Roles(UserRole.TRUCK_OWNER, UserRole.FLEET_MANAGER, UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get all received payments for truck owner',
    description: 'Returns all payments received by the truck owner — both trip-linked and lender disbursements sent to their phone number.',
  })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ description: 'All received payments retrieved successfully' })
  async getAllReceivedPayments(
    @Request() req,
    @Query('status') status?: PaymentStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const payments = await this.tripCompletionService.getAllReceivedPaymentsForTruckOwner(
      req.user.userId,
      req.user.tenantId,
      status,
    );

    const startIndex = offset || 0;
    const endIndex = limit ? startIndex + Number(limit) : undefined;
    const paginatedPayments = payments.slice(startIndex, endIndex);
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      success: true,
      message: 'All received payments retrieved successfully',
      data: {
        payments: paginatedPayments.map(payment => ({
          id: payment.id,
          tripId: payment.tripId,
          amount: Number(payment.amount),
          currency: payment.currency,
          status: payment.status,
          paymentType: payment.paymentType,
          paymentMethod: payment.paymentMethod,
          description: payment.description,
          referenceNumber: payment.referenceNumber,
          processedAt: payment.processedAt,
          createdAt: payment.createdAt,
          isLenderPayment: !!(payment.metadata as any)?.isLenderPayment,
          lenderName: (payment.metadata as any)?.lenderName || null,
          lenderId: (payment.metadata as any)?.lenderId || null,
          trip: payment.trip ? {
            id: payment.trip.id,
            tripNumber: payment.trip.tripNumber,
            status: payment.trip.status,
            load: payment.trip.load ? {
              id: payment.trip.load.id,
              title: payment.trip.load.title,
              origin: payment.trip.load.origin,
              destination: payment.trip.load.destination,
            } : null,
          } : null,
        })),
        summary: {
          totalPayments: payments.length,
          totalAmount,
          currency: paginatedPayments[0]?.currency || 'RWF',
          completedCount: payments.filter(p => p.status === PaymentStatus.COMPLETED).length,
          pendingCount: payments.filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.PROCESSING).length,
          lenderPaymentsCount: payments.filter(p => (p.metadata as any)?.isLenderPayment).length,
        },
        pagination: {
          total: payments.length,
          limit: limit || payments.length,
          offset: startIndex,
          hasMore: endIndex ? endIndex < payments.length : false,
        },
      },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /pending-payments/truck-owner/completed
   * Get completed payments received by truck owner (transaction history)
   */
  @Get('truck-owner/completed')
  @Roles(UserRole.TRUCK_OWNER, UserRole.FLEET_MANAGER, UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get completed payments for truck owner',
    description: 'Returns all completed payments received by the truck owner',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ description: 'Completed payments retrieved successfully' })
  async getCompletedPaymentsForTruckOwner(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const payments = await this.tripCompletionService.getCompletedPaymentsForTruckOwner(
      req.user.userId,
      req.user.tenantId,
    );

    const startIndex = offset || 0;
    const endIndex = limit ? startIndex + limit : undefined;
    const paginatedPayments = payments.slice(startIndex, endIndex);

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      success: true,
      message: 'Completed payments retrieved successfully',
      data: {
        payments: paginatedPayments.map(payment => ({
          id: payment.id,
          tripId: payment.tripId,
          amount: Number(payment.amount),
          currency: payment.currency,
          processedAt: payment.processedAt,
          status: payment.status,
          paymentType: payment.paymentType,
          paymentMethod: payment.paymentMethod,
          description: payment.description,
          referenceNumber: payment.referenceNumber,
          createdAt: payment.createdAt,
          trip: payment.trip ? {
            id: payment.trip.id,
            tripNumber: payment.trip.tripNumber,
            status: payment.trip.status,
            load: payment.trip.load ? {
              id: payment.trip.load.id,
              title: payment.trip.load.title,
              origin: payment.trip.load.origin,
              destination: payment.trip.load.destination,
            } : null,
          } : null,
        })),
        summary: {
          totalPayments: payments.length,
          totalAmount,
          currency: paginatedPayments[0]?.currency || 'USD',
        },
        pagination: {
          total: payments.length,
          limit: limit || payments.length,
          offset: startIndex,
          hasMore: endIndex ? endIndex < payments.length : false,
        },
      },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /pending-payments/forecast
   * Get payment forecast for the next N days
   */
  @Get('forecast')
  @Roles(UserRole.CARGO_OWNER, UserRole.TRUCK_OWNER, UserRole.FLEET_MANAGER, UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get payment forecast',
    description: 'Returns payment forecast for the specified number of days'
  })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to forecast (default: 30)' })
  @ApiOkResponse({ description: 'Payment forecast retrieved successfully' })
  async getPaymentForecast(
    @Request() req,
    @Query('days') days?: number,
  ) {
    const forecastDays = days || 30;
    
    const forecast = await this.paymentsService.getPaymentForecast(
      req.user.tenantId,
      req.user.userId,
      forecastDays,
    );

    return {
      success: true,
      message: 'Payment forecast retrieved successfully',
      data: forecast,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }
}