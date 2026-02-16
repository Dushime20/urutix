import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Truck, VehicleStatus } from '../../../entities/truck.entity';
import { Driver, DriverStatus } from '../../../entities/driver.entity';
import { Trip } from '../../../entities/trip.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface AvailabilityUpdate {
  truckId: string;
  driverId?: string;
  status: VehicleStatus;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  estimatedAvailableTime?: Date;
  currentTripId?: string | null;
  tenantId: string;
}

export interface AvailabilityMetrics {
  totalTrucks: number;
  availableTrucks: number;
  inTransitTrucks: number;
  maintenanceTrucks: number;
  availableDrivers: number;
  averageResponseTime: number;
  lastUpdateTime: Date;
}

@Injectable()
export class RealTimeAvailabilityService {
  private readonly logger = new Logger(RealTimeAvailabilityService.name);
  private readonly availabilityCache = new Map<string, AvailabilityUpdate>();
  private readonly metrics: AvailabilityMetrics = {
    totalTrucks: 0,
    availableTrucks: 0,
    inTransitTrucks: 0,
    maintenanceTrucks: 0,
    availableDrivers: 0,
    averageResponseTime: 0,
    lastUpdateTime: new Date(),
  };

  constructor(
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.initializeAvailabilityTracking();
  }

  /**
   * Initialize real-time availability tracking
   */
  private async initializeAvailabilityTracking(): Promise<void> {
    try {
      // Load initial availability data
      await this.refreshAvailabilityData();

      // Set up periodic refresh
      setInterval(() => {
        this.refreshAvailabilityData();
      }, 30000); // Refresh every 30 seconds

      this.logger.log('Real-time availability tracking initialized');
    } catch (error) {
      this.logger.error('Error initializing availability tracking:', error);
    }
  }

  /**
   * Update truck availability in real-time
   */
  async updateTruckAvailability(update: AvailabilityUpdate): Promise<void> {
    try {
      const startTime = Date.now();

      // Update database
      await this.truckRepository.update(
        { id: update.truckId, tenantId: update.tenantId },
        {
          status: update.status,
          locationUpdatedAt: update.location?.timestamp || new Date(),
          ...(update.currentTripId !== undefined ? { currentTripId: update.currentTripId } : {}),
        },
      );

      // Update cache
      this.availabilityCache.set(update.truckId, update);

      // Emit real-time event
      this.eventEmitter.emit('truck.availability.updated', {
        ...update,
        timestamp: new Date(),
      });

      // Update metrics
      this.updateMetrics(startTime);

      this.logger.debug(
        `Truck availability updated: ${update.truckId} - ${update.status}`,
      );
    } catch (error) {
      this.logger.error('Error updating truck availability:', error);
      throw error;
    }
  }

  /**
   * Update driver availability in real-time
   */
  async updateDriverAvailability(
    driverId: string,
    status: DriverStatus,
    tenantId: string,
    estimatedAvailableTime?: Date,
    currentTripId?: string | null,
  ): Promise<void> {
    try {
      const startTime = Date.now();

      // Update database
      await this.driverRepository.update(
        { id: driverId, tenantId },
        {
          status,
          ...(currentTripId !== undefined ? { currentTripId } : {}),
        },
      );

      // Update associated truck if driver is assigned
      const truck = await this.truckRepository.findOne({
        where: { currentDriverId: driverId, tenantId },
      });

      if (truck) {
        const truckStatus =
          status === DriverStatus.ACTIVE
            ? VehicleStatus.AVAILABLE
            : VehicleStatus.IN_TRANSIT;

        await this.updateTruckAvailability({
          truckId: truck.id,
          driverId,
          status: truckStatus,
          estimatedAvailableTime,
          tenantId,
        });
      }

      // Emit real-time event
      this.eventEmitter.emit('driver.availability.updated', {
        driverId,
        status,
        tenantId,
        estimatedAvailableTime,
        timestamp: new Date(),
      });

      // Update metrics
      this.updateMetrics(startTime);

      this.logger.debug(`Driver availability updated: ${driverId} - ${status}`);
    } catch (error) {
      this.logger.error('Error updating driver availability:', error);
      throw error;
    }
  }

  /**
   * Get real-time availability for a specific truck
   */
  async getTruckAvailability(
    truckId: string,
    tenantId: string,
  ): Promise<AvailabilityUpdate | null> {
    try {
      // Check cache first
      const cached = this.availabilityCache.get(truckId);
      if (cached && cached.tenantId === tenantId) {
        return cached;
      }

      // Get from database
      const truck = await this.truckRepository.findOne({
        where: { id: truckId, tenantId },
        // Note: currentDriverId is a column, not a relation
      });

      if (!truck) {
        return null;
      }

      const availability: AvailabilityUpdate = {
        truckId: truck.id,
        driverId: truck.currentDriverId,
        status: truck.status,
        currentTripId: truck.currentTripId,
        tenantId: truck.tenantId,
      };

      // Cache the result
      this.availabilityCache.set(truckId, availability);

      return availability;
    } catch (error) {
      this.logger.error('Error getting truck availability:', error);
      throw error;
    }
  }

  /**
   * Get all available trucks in real-time
   */
  async getAvailableTrucks(
    tenantId: string,
    filters?: {
      location?: { latitude: number; longitude: number; radiusKm: number };
      capacity?: { minWeight: number; maxWeight: number };
      equipment?: {
        hasRefrigeration?: boolean;
        hasLiftGate?: boolean;
        hasHazmat?: boolean;
      };
    },
  ): Promise<AvailabilityUpdate[]> {
    try {
      const startTime = Date.now();

      // Get available trucks from database
      let query = this.truckRepository
        .createQueryBuilder('truck')
        .where('truck.tenantId = :tenantId', { tenantId })
        .andWhere('truck.status = :status', { status: VehicleStatus.AVAILABLE })
        .andWhere('truck.isActive = :isActive', { isActive: true });

      // Apply capacity filters
      if (filters?.capacity) {
        query = query
          .andWhere('truck.capacityWeight >= :minWeight', {
            minWeight: filters.capacity.minWeight,
          })
          .andWhere('truck.capacityWeight <= :maxWeight', {
            maxWeight: filters.capacity.maxWeight,
          });
      }

      // Apply equipment filters
      if (filters?.equipment) {
        if (filters.equipment.hasRefrigeration) {
          query = query.andWhere('truck.hasRefrigeration = :hasRefrigeration', {
            hasRefrigeration: true,
          });
        }
        if (filters.equipment.hasLiftGate) {
          query = query.andWhere('truck.hasLiftGate = :hasLiftGate', {
            hasLiftGate: true,
          });
        }
        if (filters.equipment.hasHazmat) {
          query = query.andWhere('truck.hasHazmatPermit = :hasHazmat', {
            hasHazmat: true,
          });
        }
      }

      const trucks = await query.getMany();

      // Convert to availability updates
      const availabilityUpdates: AvailabilityUpdate[] = trucks.map((truck) => ({
        truckId: truck.id,
        driverId: truck.currentDriverId,
        status: truck.status,
        currentTripId: truck.currentTripId,
        tenantId: truck.tenantId,
      }));

      // Apply location filter if specified
      if (filters?.location) {
        const filteredUpdates = availabilityUpdates.filter((update) => {
          // In real implementation, calculate distance from truck location
          // For now, return all trucks
          return true;
        });
        return filteredUpdates;
      }

      // Update metrics
      this.updateMetrics(startTime);

      return availabilityUpdates;
    } catch (error) {
      this.logger.error('Error getting available trucks:', error);
      throw error;
    }
  }

  /**
   * Get availability metrics
   */
  getAvailabilityMetrics(tenantId: string): AvailabilityMetrics {
    return { ...this.metrics };
  }

  /**
   * Refresh availability data from database
   */
  private async refreshAvailabilityData(): Promise<void> {
    try {
      // Get all trucks and their current status
      const trucks = await this.truckRepository.find({
        where: { isActive: true },
        select: [
          'id',
          'status',
          'tenantId',
          'currentDriverId',
          'estimatedAvailableTime',
        ],
      });

      // Update cache
      for (const truck of trucks) {
        this.availabilityCache.set(truck.id, {
          truckId: truck.id,
          driverId: truck.currentDriverId,
          status: truck.status,
          estimatedAvailableTime: truck.estimatedAvailableTime,
          tenantId: truck.tenantId,
        });
      }

      // Update metrics
      this.updateAvailabilityMetrics(trucks);

      this.metrics.lastUpdateTime = new Date();
    } catch (error) {
      this.logger.error('Error refreshing availability data:', error);
    }
  }

  /**
   * Update availability metrics
   */
  private updateAvailabilityMetrics(trucks: any[]): void {
    this.metrics.totalTrucks = trucks.length;
    this.metrics.availableTrucks = trucks.filter(
      (t) => t.status === VehicleStatus.AVAILABLE,
    ).length;
    this.metrics.inTransitTrucks = trucks.filter(
      (t) => t.status === VehicleStatus.IN_TRANSIT,
    ).length;
    this.metrics.maintenanceTrucks = trucks.filter(
      (t) => t.status === VehicleStatus.MAINTENANCE,
    ).length;
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(startTime: number): void {
    const responseTime = Date.now() - startTime;
    this.metrics.averageResponseTime =
      this.metrics.averageResponseTime * 0.9 + responseTime * 0.1;
  }

  /**
   * Handle trip completion and update availability
   */
  async handleTripCompletion(tripId: string, tenantId: string): Promise<void> {
    try {
      const trip = await this.tripRepository.findOne({
        where: { id: tripId, tenantId },
        relations: ['truck', 'driver'],
      });

      if (!trip) {
        throw new Error('Trip not found');
      }

      // Update truck availability
      await this.updateTruckAvailability({
        truckId: trip.truckId,
        driverId: trip.driverId,
        status: VehicleStatus.AVAILABLE,
        tenantId,
        estimatedAvailableTime: new Date(),
        currentTripId: null,
      });

      // Update driver availability
      if (trip.driverId) {
        await this.updateDriverAvailability(
          trip.driverId,
          DriverStatus.ACTIVE,
          tenantId,
          new Date(),
          null, // Clear trip ID
        );
      }

      this.logger.log(`Trip completed: ${tripId}, availability updated`);
    } catch (error) {
      this.logger.error('Error handling trip completion:', error);
      throw error;
    }
  }

  /**
   * Handle trip start and update availability
   */
  async handleTripStart(tripId: string, tenantId: string): Promise<void> {
    try {
      const trip = await this.tripRepository.findOne({
        where: { id: tripId, tenantId },
        relations: ['truck', 'driver'],
      });

      if (!trip) {
        throw new Error('Trip not found');
      }

      // Update truck availability
      await this.updateTruckAvailability({
        truckId: trip.truckId,
        driverId: trip.driverId,
        status: VehicleStatus.IN_TRANSIT,
        tenantId,
        currentTripId: trip.id,
        estimatedAvailableTime: trip.estimatedEndTime,
      });

      // Update driver availability
      if (trip.driverId) {
        await this.updateDriverAvailability(
          trip.driverId,
          DriverStatus.IN_TRANSIT,
          tenantId,
          trip.estimatedEndTime,
          trip.id,
        );
      }

      this.logger.log(`Trip started: ${tripId}, availability updated`);
    } catch (error) {
      this.logger.error('Error handling trip start:', error);
      throw error;
    }
  }

  /**
   * Clear availability cache
   */
  clearCache(): void {
    this.availabilityCache.clear();
    this.logger.log('Availability cache cleared');
  }

  /**
   * Get availability history for analytics
   */
  async getAvailabilityHistory(
    truckId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<any[]> {
    try {
      // In real implementation, query availability history table
      // For now, return mock data
      return [
        {
          truckId,
          status: VehicleStatus.AVAILABLE,
          timestamp: startDate,
          duration: 3600000, // 1 hour in milliseconds
        },
        {
          truckId,
          status: VehicleStatus.IN_TRANSIT,
          timestamp: new Date(startDate.getTime() + 3600000),
          duration: 7200000, // 2 hours
        },
      ];
    } catch (error) {
      this.logger.error('Error getting availability history:', error);
      throw error;
    }
  }
}
