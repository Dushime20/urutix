import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripStatusDto } from './dto/update-trip-status.dto';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
  ) { }

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
    userId?: string,
  ): Promise<{ trips: Trip[]; pagination: any }> {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    try {
      const queryBuilder = this.tripRepository
        .createQueryBuilder('trip')
        .leftJoinAndSelect('trip.truck', 'truck')
        .leftJoinAndSelect('trip.driver', 'driver')
        .leftJoinAndSelect('trip.load', 'load')
        .leftJoinAndSelect('trip.pickupLocation', 'pickupLocation')
        .leftJoinAndSelect('trip.deliveryLocation', 'deliveryLocation');

      // Filter by tenant and/or user
      if (userId) {
        // For specific user, show trips they own or are assigned to
        queryBuilder.where('trip.tenantId = :tenantId', { tenantId })
          .andWhere(
            new Brackets((qb) => {
              qb.where('truck.ownerId = :userId', { userId })
                .orWhere('driver.userId = :userId', { userId });
            })
          );
      } else {
        // For no specific user, show all tenant trips
        queryBuilder.where('trip.tenantId = :tenantId', { tenantId });
      }

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
        .orderBy('trip.createdAt', 'DESC')
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
    } catch (error) {
      console.error('Error fetching trips:', error);
      throw error;
    }
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

    trip.status = updateTripStatusDto.status;
    if (updateTripStatusDto.actualStartTime) {
      trip.actualStartTime = updateTripStatusDto.actualStartTime;
    }
    if (updateTripStatusDto.actualEndTime) {
      trip.actualEndTime = updateTripStatusDto.actualEndTime;
    }

    return this.tripRepository.save(trip);
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
