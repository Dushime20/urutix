import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripStatusDto } from './dto/update-trip-status.dto';
import { UserProfile } from '../../entities/user-profile.entity';
import { NotificationService } from '../notifications/services/notification.service';
import { NotificationType, NotificationCategory, NotificationChannel, EntityType } from '../../entities/notification.entity';

import { RealTimeAvailabilityService } from '../matching/services/real-time-availability.service';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly notificationService: NotificationService,
    private readonly availabilityService: RealTimeAvailabilityService,
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
    const oldStatus = trip.status;

    trip.status = updateTripStatusDto.status;
    if (updateTripStatusDto.actualStartTime) {
      trip.actualStartTime = updateTripStatusDto.actualStartTime;
    }
    if (updateTripStatusDto.actualEndTime) {
      trip.actualEndTime = updateTripStatusDto.actualEndTime;
    }

    const savedTrip = await this.tripRepository.save(trip);

    // Update Driver/Truck Availability Status
    // If starting trip (IN_PROGRESS), mark as IN_TRANSIT
    if (updateTripStatusDto.status === TripStatus.IN_PROGRESS && oldStatus !== TripStatus.IN_PROGRESS) {
      try {
        await this.availabilityService.handleTripStart(savedTrip.id, tenantId);
      } catch (err) {
        console.error('Failed to update availability on trip start', err);
      }

      this.sendLoadedNotification(savedTrip.id, tenantId).catch(err => console.error('Failed to send loaded notification', err));
    }

    // If completing trip, mark as AVAILABLE
    if (updateTripStatusDto.status === TripStatus.COMPLETED && oldStatus !== TripStatus.COMPLETED) {
      try {
        await this.availabilityService.handleTripCompletion(savedTrip.id, tenantId);
      } catch (err) {
        console.error('Failed to update availability on trip completion', err);
      }

      this.sendTripCompletedNotifications(savedTrip.id, tenantId).catch(err => console.error('Failed to send completed notifications', err));
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

  private async sendLoadedNotification(tripId: string, tenantId: string): Promise<void> {
    try {
      const trip = await this.tripRepository.findOne({
        where: { id: tripId },
        relations: ['driver', 'truck', 'truck.owner', 'truck.owner.profile', 'load'],
      });

      if (!trip || !trip.load || !trip.truck || !trip.driver) return;

      const driverName = `${trip.driver.firstName} ${trip.driver.lastName}`.trim();
      
      let truckOwnerName = 'Truck Owner';
      if (trip.truck.owner?.profile) {
        truckOwnerName = `${trip.truck.owner.profile.firstName} ${trip.truck.owner.profile.lastName}`.trim();
      }

      await this.notificationService.createNotification({
        userId: trip.load.cargoOwnerId,
        tenantId,
        subject: 'Cargo Loaded & Ready',
        content: `Driver ${driverName} from ${truckOwnerName} has loaded your cargo "${trip.load.title}", make advance payment to start your trip`,
        type: NotificationType.GENERAL,
        category: NotificationCategory.FINANCIAL,
        channel: NotificationChannel.IN_APP,
        actionUrl: '/dashboard/payments',
        actionText: 'Make Payment',
        metadata: {
          entityType: EntityType.TRIP,
          entityId: trip.id,
        },
      } as any);
    } catch (error) {
      console.error('Error in sendLoadedNotification:', error);
    }
  }

  private async sendTripCompletedNotifications(tripId: string, tenantId: string): Promise<void> {
    try {
      const trip = await this.tripRepository.findOne({
        where: { id: tripId },
        relations: ['driver', 'truck', 'truck.owner', 'load'],
      });

      if (!trip || !trip.load) return;

      const notifications = [];

      // 1. Cargo Owner
      if (trip.load.cargoOwnerId) {
        notifications.push({
          userId: trip.load.cargoOwnerId,
          subject: 'Shipment Delivered',
          content: `Your shipment "${trip.load.title || 'Shipment'}" has been delivered successfully.`,
        });
      }

      // 2. Receiver (if exists)
      if (trip.load.receiverId) {
        notifications.push({
          userId: trip.load.receiverId,
          subject: 'Shipment Arrived',
          content: `Shipment "${trip.load.title || 'Shipment'}" has arrived at your location.`,
        });
      }

      // 3. Truck Owner (if exists)
      if (trip.truck && trip.truck.ownerId) {
        let driverName = 'Unknown Driver';
        if (trip.driver) {
          driverName = `${trip.driver.firstName} ${trip.driver.lastName}`.trim();
        }
        
        notifications.push({
          userId: trip.truck.ownerId,
          subject: 'Trip Completed',
          content: `Trip ${trip.tripNumber} has been completed by driver ${driverName}.`,
        });
      }

      for (const notif of notifications) {
        await this.notificationService.createNotification({
          userId: notif.userId,
          tenantId,
          subject: notif.subject,
          content: notif.content,
          type: NotificationType.TRIP_COMPLETED,
          category: NotificationCategory.TRIP,
          channel: NotificationChannel.IN_APP,
          actionUrl: `/dashboard/trips/${trip.id}`,
          actionText: 'View Trip Details',
          metadata: {
            entityType: EntityType.TRIP,
            entityId: trip.id,
          },
        } as any);
      }
      
      console.log(`Sent completion notifications for trip ${tripId} to ${notifications.length} recipients`);
      
    } catch (error) {
      console.error('Error sending completion notifications:', error);
    }
  }
}
