import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';
import { EpodService } from '../trips/epod.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Epod } from '../../entities/epod.entity';
import { Trip } from '../../entities/trip.entity';
import { Truck } from '../../entities/truck.entity';
import { Invoice } from '../financial/entities/invoice.entity';

@ApiTags('Fleet ePOD')
@Controller('fleet/epods')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FleetEpodController {
  constructor(
    private readonly epodService: EpodService,
    @InjectRepository(Epod)
    private readonly epodRepository: Repository<Epod>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  @Get()
  @Roles(UserRole.TRUCK_OWNER)
  @ApiOperation({ summary: 'Get all ePODs for truck owner' })
  @ApiQuery({ name: 'truckId', required: false, description: 'Filter by truck ID' })
  @ApiQuery({ name: 'driverId', required: false, description: 'Filter by driver ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO 8601)' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'DISPUTED'] })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiOkResponse({ description: 'ePODs retrieved successfully' })
  async getFleetEpods(
    @Request() req,
    @Query('truckId') truckId?: string,
    @Query('driverId') driverId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
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
      .andWhere('truck.ownerId = :userId', { userId }); // Only truck owner's trucks

    // Apply filters
    if (truckId) {
      query.andWhere('trip.truckId = :truckId', { truckId });
    }

    if (driverId) {
      query.andWhere('trip.driverId = :driverId', { driverId });
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

    // Calculate summary
    const summaryQuery = this.epodRepository
      .createQueryBuilder('epod')
      .leftJoin('epod.trip', 'trip')
      .leftJoin('trip.truck', 'truck')
      .where('epod.tenantId = :tenantId', { tenantId })
      .andWhere('truck.ownerId = :userId', { userId });

    const totalEpods = await summaryQuery.getCount();
    const pendingConfirmations = await summaryQuery
      .andWhere('epod.status = :status', { status: 'PENDING' })
      .getCount();
    const confirmedDeliveries = await summaryQuery
      .andWhere('epod.status = :status', { status: 'CONFIRMED' })
      .getCount();

    // Calculate total revenue from invoices
    const invoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoin('invoice.trip', 'trip')
      .leftJoin('trip.truck', 'truck')
      .where('invoice.tenantId = :tenantId', { tenantId })
      .andWhere('truck.ownerId = :userId', { userId })
      .andWhere('invoice.status IN (:...statuses)', { statuses: ['sent', 'paid'] })
      .getMany();

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    return {
      success: true,
      data: {
        epods: epods.map(epod => ({
          id: epod.id,
          tripId: epod.tripId,
          tripNumber: epod.trip?.tripNumber,
          truckId: epod.trip?.truckId,
          truckNumber: epod.trip?.truck?.plateNumber,
          driverId: epod.trip?.driverId,
          driverName: epod.trip?.driver ? `${epod.trip.driver.firstName} ${epod.trip.driver.lastName}` : null,
          loadTitle: epod.trip?.load?.title,
          recipientName: epod.recipientName,
          recipientPhone: epod.recipientPhone,
          status: epod.status,
          submittedAt: epod.submittedAt,
          confirmedAt: epod.confirmedAt,
          deliveryCoordinates: epod.deliveryCoordinates,
          hasSignature: !!epod.signatureFileUrl,
          photoCount: epod.photoUrls?.length || 0,
        })),
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
        summary: {
          totalEpods,
          pendingConfirmations,
          confirmedDeliveries,
          totalRevenue: Number(totalRevenue.toFixed(2)),
        },
      },
    };
  }

  @Get(':id')
  @Roles(UserRole.TRUCK_OWNER)
  @ApiOperation({ summary: 'Get specific ePOD details for truck owner' })
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

    // Verify truck owner owns the truck
    if (epod.trip.truck.ownerId !== userId) {
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
}
