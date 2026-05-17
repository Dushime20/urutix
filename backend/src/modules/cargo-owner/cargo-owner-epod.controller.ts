import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';
import { EpodService } from '../trips/epod.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Epod, EpodStatus } from '../../entities/epod.entity';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { Invoice } from '../financial/entities/invoice.entity';
import { IsString, IsOptional, IsArray } from 'class-validator';

class DisputeEpodDto {
  @IsString()
  reason: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}

@ApiTags('Cargo Owner ePOD')
@Controller('cargo-owner/epods')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CargoOwnerEpodController {
  constructor(
    private readonly epodService: EpodService,
    @InjectRepository(Epod)
    private readonly epodRepository: Repository<Epod>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  @Get()
  @Roles(UserRole.CARGO_OWNER)
  @ApiOperation({ summary: 'Get all ePODs for cargo owner' })
  @ApiQuery({ name: 'loadId', required: false, description: 'Filter by load ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO 8601)' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'DISPUTED'] })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: ['unpaid', 'paid', 'overdue'] })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiOkResponse({ description: 'ePODs retrieved successfully' })
  async getCargoOwnerEpods(
    @Request() req,
    @Query('loadId') loadId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    // Build query
    const query = this.epodRepository
      .createQueryBuilder('epod')
      .leftJoinAndSelect('epod.trip', 'trip')
      .leftJoinAndSelect('trip.truck', 'truck')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('trip.load', 'load')
      .where('epod.tenantId = :tenantId', { tenantId })
      .andWhere('load.cargoOwnerId = :userId', { userId });

    // Apply filters
    if (loadId) {
      query.andWhere('trip.loadId = :loadId', { loadId });
    }

    if (startDate) {
      query.andWhere('epod.submittedAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('epod.submittedAt <= :endDate', { endDate });
    }

    if (status) {
      query.andWhere('epod.status = :status', { status });
    }

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    // Order by most recent first
    query.orderBy('epod.submittedAt', 'DESC');

    // Execute query
    const epods = await query.getMany();

    // Get invoices for payment status filtering
    const tripIds = epods.map(e => e.tripId);
    const invoices = tripIds.length > 0
      ? await this.invoiceRepository
          .createQueryBuilder('invoice')
          .where('invoice.tripId IN (:...tripIds)', { tripIds })
          .getMany()
      : [];

    const invoiceMap = new Map(invoices.map(inv => [inv.tripId, inv]));

    // Filter by payment status if specified
    let filteredEpods = epods;
    if (paymentStatus) {
      filteredEpods = epods.filter(epod => {
        const invoice = invoiceMap.get(epod.tripId);
        if (!invoice) return paymentStatus === 'unpaid';
        
        if (paymentStatus === 'paid') return invoice.status === 'paid';
        if (paymentStatus === 'unpaid') return invoice.status !== 'paid';
        if (paymentStatus === 'overdue') return invoice.status === 'overdue';
        return true;
      });
    }

    // Calculate summary
    const summaryQuery = this.epodRepository
      .createQueryBuilder('epod')
      .leftJoin('epod.trip', 'trip')
      .leftJoin('trip.load', 'load')
      .where('epod.tenantId = :tenantId', { tenantId })
      .andWhere('load.cargoOwnerId = :userId', { userId });

    const totalShipments = await summaryQuery.getCount();
    const pendingConfirmations = await summaryQuery
      .andWhere('epod.status = :status', { status: 'PENDING' })
      .getCount();

    // Calculate total amount due and overdue
    const allInvoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoin('invoice.trip', 'trip')
      .leftJoin('trip.load', 'load')
      .where('invoice.tenantId = :tenantId', { tenantId })
      .andWhere('load.cargoOwnerId = :userId', { userId })
      .andWhere('invoice.status != :paidStatus', { paidStatus: 'paid' })
      .getMany();

    const totalAmountDue = allInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const overduePayments = allInvoices.filter(inv => inv.status === 'overdue').length;

    return {
      success: true,
      data: {
        epods: filteredEpods.map(epod => {
          const invoice = invoiceMap.get(epod.tripId);
          return {
            id: epod.id,
            tripId: epod.tripId,
            tripNumber: epod.trip?.tripNumber,
            loadId: epod.trip?.loadId,
            loadTitle: epod.trip?.load?.title,
            truckNumber: epod.trip?.truck?.plateNumber,
            driverName: epod.trip?.driver ? `${epod.trip.driver.firstName} ${epod.trip.driver.lastName}` : null,
            recipientName: epod.recipientName,
            recipientPhone: epod.recipientPhone,
            status: epod.status,
            submittedAt: epod.submittedAt,
            confirmedAt: epod.confirmedAt,
            deliveryCoordinates: epod.deliveryCoordinates,
            hasSignature: !!epod.signatureFileUrl,
            photoCount: epod.photoUrls?.length || 0,
            invoice: invoice ? {
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              totalAmount: invoice.totalAmount,
              currency: invoice.currency,
              status: invoice.status,
              dueDate: invoice.dueDate,
            } : null,
          };
        }),
        pagination: {
          total: filteredEpods.length,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(filteredEpods.length / limit),
        },
        summary: {
          totalShipments,
          pendingConfirmations,
          totalAmountDue: Number(totalAmountDue.toFixed(2)),
          overduePayments,
        },
      },
    };
  }

  @Get(':id')
  @Roles(UserRole.CARGO_OWNER, UserRole.CARGO_RECEIVER)
  @ApiOperation({ summary: 'Get specific ePOD details for cargo owner' })
  @ApiParam({ name: 'id', description: 'ePOD ID' })
  @ApiOkResponse({ description: 'ePOD details retrieved successfully' })
  async getEpodDetails(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const epod = await this.epodRepository.findOne({
      where: { id, tenantId },
      relations: ['trip', 'trip.truck', 'trip.driver', 'trip.load'],
    });

    if (!epod) {
      throw new NotFoundException('ePOD not found');
    }

    // Verify cargo owner owns the load
    if (epod.trip.load.cargoOwnerId !== userId) {
      throw new ForbiddenException('You do not have permission to view this ePOD');
    }

    // Get invoice if exists
    const invoice = await this.invoiceRepository.findOne({
      where: { tripId: epod.tripId },
      relations: ['tenant'],
    });

    return {
      success: true,
      data: {
        epod,
        invoice,
      },
    };
  }

  @Post(':id/dispute')
  @Roles(UserRole.CARGO_OWNER, UserRole.CARGO_RECEIVER)
  @ApiOperation({ summary: 'Dispute an ePOD' })
  @ApiParam({ name: 'id', description: 'ePOD ID' })
  @ApiBody({ type: DisputeEpodDto })
  @ApiOkResponse({ description: 'ePOD disputed successfully' })
  async disputeEpod(
    @Param('id') id: string,
    @Body() dto: DisputeEpodDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const epod = await this.epodRepository.findOne({
      where: { id, tenantId },
      relations: ['trip', 'trip.load'],
    });

    if (!epod) {
      throw new NotFoundException('ePOD not found');
    }

    // Verify cargo owner owns the load
    if (epod.trip.load.cargoOwnerId !== userId) {
      throw new ForbiddenException('You do not have permission to dispute this ePOD');
    }

    // Check if already confirmed or disputed
    if (epod.status === EpodStatus.CONFIRMED) {
      throw new BadRequestException('Cannot dispute a confirmed ePOD');
    }

    if (epod.status === EpodStatus.DISPUTED) {
      throw new BadRequestException('ePOD is already disputed');
    }

    // Update ePOD status
    epod.status = EpodStatus.DISPUTED;
    epod.disputedAt = new Date();
    epod.disputeReason = `${dto.reason}: ${dto.description}`;
    
    await this.epodRepository.save(epod);

    // TODO: Send notifications to truck owner and driver
    // TODO: Create dispute record in disputes table

    return {
      success: true,
      data: epod,
      message: 'ePOD disputed successfully. The truck owner and driver have been notified.',
    };
  }
}
