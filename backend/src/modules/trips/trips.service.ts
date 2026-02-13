import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripStatusDto } from './dto/update-trip-status.dto';
import { CreditConsumptionListener } from '../../services/credit-consumption.listener';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    private readonly creditConsumptionListener: CreditConsumptionListener,
  ) {}

  async create(createTripDto: CreateTripDto, tenantId: string): Promise<Trip> {
    const trip = this.tripRepository.create({
      ...createTripDto,
      tenantId,
      tripNumber: `TRIP-${Date.now()}`,
    });

    return this.tripRepository.save(trip);
  }

  async findAll(
    query: any,
    tenantId: string,
  ): Promise<{ trips: Trip[]; pagination: any }> {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.tripRepository
      .createQueryBuilder('trip')
      .where('trip.tenantId = :tenantId', { tenantId });

    if (status) {
      queryBuilder.andWhere('trip.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(trip.tripNumber ILIKE :search OR trip.notes ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    const [trips, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      trips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id, tenantId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  async getActiveTrips(tenantId: string): Promise<Trip[]> {
    return this.tripRepository.find({
      where: {
        tenantId,
        status: TripStatus.IN_PROGRESS,
      },
    });
  }

  async updateTripStatus(
    id: string,
    updateTripStatusDto: UpdateTripStatusDto,
    tenantId: string,
  ): Promise<Trip> {
    const trip = await this.findOne(id, tenantId);

    const previousStatus = trip.status;
    trip.status = updateTripStatusDto.status;
    
    if (updateTripStatusDto.actualStartTime) {
      trip.actualStartTime = updateTripStatusDto.actualStartTime;
    }
    if (updateTripStatusDto.actualEndTime) {
      trip.actualEndTime = updateTripStatusDto.actualEndTime;
    }

    const savedTrip = await this.tripRepository.save(trip);

    // If trip is completed, deduct credits based on cargo weight
    if (
      updateTripStatusDto.status === TripStatus.COMPLETED &&
      previousStatus !== TripStatus.COMPLETED
    ) {
      this.logger.log(`Trip ${id} completed. Processing credit deduction...`);
      
      try {
        await this.creditConsumptionListener.processTripCompletion(id, tenantId);
        this.logger.log(`Credit deduction completed for trip ${id}`);
      } catch (error) {
        this.logger.error(
          `Failed to deduct credits for trip ${id}: ${error.message}`,
        );
        // Don't fail the trip completion if credit deduction fails
        // The transaction is logged and can be retried
      }
    }

    return savedTrip;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const trip = await this.findOne(id, tenantId);
    await this.tripRepository.softDelete(id);
  }

  async getTripAnalytics(tenantId: string, userId?: string): Promise<any> {
    const queryBuilder = this.tripRepository
      .createQueryBuilder('trip')
      .where('trip.tenantId = :tenantId', { tenantId });

    if (userId) {
      queryBuilder.andWhere('trip.driverId = :userId', { userId });
    }

    const trips = await queryBuilder.getMany();

    const totalTrips = trips.length;
    const completedTrips = trips.filter(
      (t) => t.status === TripStatus.COMPLETED,
    ).length;
    const inProgressTrips = trips.filter(
      (t) => t.status === TripStatus.IN_PROGRESS,
    ).length;
    const plannedTrips = trips.filter(
      (t) => t.status === TripStatus.PLANNED,
    ).length;

    return {
      totalTrips,
      completedTrips,
      inProgressTrips,
      plannedTrips,
      completionRate: totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0,
    };
  }
}
