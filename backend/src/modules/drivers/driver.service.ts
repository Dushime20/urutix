import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Like,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  In,
} from 'typeorm';
import {
  Driver,
  DriverStatus,
  EmploymentType,
} from '../../entities/driver.entity';
import { SafetyIncident } from '../../entities/safety-incident.entity';
import { Load, LoadStatus } from '../../entities/load.entity';
import { Truck } from '../../entities/truck.entity';
import { Trip, TripStatus } from '../../entities/trip.entity';
import {
  CreateDriverDto,
  UpdateDriverDto,
  TelematicsEventDto,
  EmergencyReportDto,
  DriverFilterDto,
} from './dto/driver.dto';
import { OcrService } from '../ocr/ocr.service';
import { NotificationService } from '../notifications/notification.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  EntityType,
  NotificationChannel,
} from '../../entities/notification.entity';
import { LoadsService } from '../loads/loads.service';
import { TripsService } from '../trips/trips.service';
import { CompleteDeliveryDto } from './dto/driver.dto';

@Injectable()
export class DriverService {
  private readonly logger = new Logger(DriverService.name);

  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(Load)
    private loadRepository: Repository<Load>,
    @InjectRepository(Truck)
    private truckRepository: Repository<Truck>,
    @InjectRepository(SafetyIncident)
    private readonly safetyIncidentRepository: Repository<SafetyIncident>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    private readonly ocrService: OcrService,
    private readonly notificationService: NotificationService,
    private readonly loadsService: LoadsService,
    private readonly tripsService: TripsService,
  ) {}

  async createDriver(createDto: CreateDriverDto): Promise<Driver> {
    try {
      // Check if driver with same license number already exists
      const existingDriver = await this.driverRepository.findOne({
        where: { licenseNumber: createDto.licenseNumber },
      });

      if (existingDriver) {
        throw new ConflictException(
          `Driver with license number ${createDto.licenseNumber} already exists`,
        );
      }

      // Check if user is already assigned to another driver
      const existingUserDriver = await this.driverRepository.findOne({
        where: { userId: createDto.userId },
      });

      if (existingUserDriver) {
        throw new ConflictException(
          `User ${createDto.userId} is already assigned to another driver`,
        );
      }

      const driver = this.driverRepository.create({
        ...createDto,
        dateOfBirth: new Date(createDto.dateOfBirth),
        licenseIssueDate: new Date(createDto.licenseIssueDate),
        licenseExpiry: new Date(createDto.licenseExpiry),
        hireDate: new Date(createDto.hireDate),
        medicalCertExpiry: createDto.medicalCertExpiry
          ? new Date(createDto.medicalCertExpiry)
          : undefined,
        drugTestDate: createDto.drugTestDate
          ? new Date(createDto.drugTestDate)
          : undefined,
        backgroundCheckDate: createDto.backgroundCheckDate
          ? new Date(createDto.backgroundCheckDate)
          : undefined,
        trainingCompletionDate: createDto.trainingCompletionDate
          ? new Date(createDto.trainingCompletionDate)
          : undefined,
        rating: createDto.rating || 0,
        safetyScore: 100, // Default safety score
        totalTrips: 0,
        totalDistance: 0,
        onTimeDeliveryRate: 0,
        totalEarnings: 0,
        hoursWorkedThisWeek: 0,
        hoursWorkedThisMonth: 0,
        consecutiveDrivingHours: 0,
      });

      const savedDriver = await this.driverRepository.save(driver);

      this.logger.log(
        `Created driver ${savedDriver.id} for tenant ${createDto.tenantId}`,
      );

      return savedDriver;
    } catch (error) {
      this.logger.error(`Failed to create driver: ${error.message}`);
      throw error;
    }
  }

  async getDriverByUserId(userId: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { userId },
      relations: ['truck', 'tenant'],
    });

    if (!driver) {
      throw new NotFoundException(`Driver for user ${userId} not found`);
    }

    return driver;
  }

  async getAllDrivers(
    filterDto: DriverFilterDto,
    tenantId: string,
  ): Promise<{
    drivers: Driver[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        employmentType,
        availabilityStatus,
        minRating,
        minSafetyScore,
        search,
      } = filterDto;
      const skip = (page - 1) * limit;

      const queryBuilder = this.driverRepository
        .createQueryBuilder('driver')
        .where('driver.tenantId = :tenantId', { tenantId });

      // Apply filters
      if (status) {
        queryBuilder.andWhere('driver.status = :status', { status });
      }

      if (employmentType) {
        queryBuilder.andWhere('driver.employmentType = :employmentType', {
          employmentType,
        });
      }

      if (availabilityStatus) {
        queryBuilder.andWhere(
          'driver.availabilityStatus = :availabilityStatus',
          { availabilityStatus },
        );
      }

      if (minRating !== undefined) {
        queryBuilder.andWhere('driver.rating >= :minRating', { minRating });
      }

      if (minSafetyScore !== undefined) {
        queryBuilder.andWhere('driver.safetyScore >= :minSafetyScore', {
          minSafetyScore,
        });
      }

      if (search) {
        queryBuilder.andWhere(
          '(driver.firstName ILIKE :search OR driver.lastName ILIKE :search OR driver.licenseNumber ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      const [drivers, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy('driver.createdAt', 'DESC')
        .getManyAndCount();

      return {
        drivers,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Failed to get drivers: ${error.message}`);
      throw error;
    }
  }

  async getDriverById(id: string, tenantId: string): Promise<Driver> {
    try {
      const driver = await this.driverRepository.findOne({
        where: { id, tenantId },
      });

      if (!driver) {
        throw new NotFoundException(`Driver with ID ${id} not found`);
      }

      return driver;
    } catch (error) {
      this.logger.error(`Failed to get driver ${id}: ${error.message}`);
      throw error;
    }
  }

  async updateDriver(
    id: string,
    updateDto: UpdateDriverDto,
    tenantId: string,
  ): Promise<Driver> {
    try {
      const driver = await this.getDriverById(id, tenantId);

      // Check if license number is being updated and if it conflicts
      if (
        updateDto.licenseNumber &&
        updateDto.licenseNumber !== driver.licenseNumber
      ) {
        const existingDriver = await this.driverRepository.findOne({
          where: { licenseNumber: updateDto.licenseNumber },
        });

        if (existingDriver && existingDriver.id !== id) {
          throw new ConflictException(
            `Driver with license number ${updateDto.licenseNumber} already exists`,
          );
        }
      }

      // Prepare update data
      const updateData: any = { ...updateDto };

      // Convert date strings to Date objects
      if (updateDto.licenseExpiry) {
        updateData.licenseExpiry = new Date(updateDto.licenseExpiry);
      }
      if (updateDto.medicalCertExpiry) {
        updateData.medicalCertExpiry = new Date(updateDto.medicalCertExpiry);
      }
      if (updateDto.drugTestDate) {
        updateData.drugTestDate = new Date(updateDto.drugTestDate);
      }
      if (updateDto.backgroundCheckDate) {
        updateData.backgroundCheckDate = new Date(
          updateDto.backgroundCheckDate,
        );
      }
      if (updateDto.trainingCompletionDate) {
        updateData.trainingCompletionDate = new Date(
          updateDto.trainingCompletionDate,
        );
      }

      await this.driverRepository.update(id, updateData);

      const updatedDriver = await this.getDriverById(id, tenantId);

      this.logger.log(`Updated driver ${id}`);

      return updatedDriver;
    } catch (error) {
      this.logger.error(`Failed to update driver ${id}: ${error.message}`);
      throw error;
    }
  }

  async deleteDriver(id: string, tenantId: string): Promise<void> {
    try {
      const driver = await this.getDriverById(id, tenantId);

      // Check if driver is currently on a trip
      if (driver.currentTripId) {
        throw new BadRequestException(
          'Cannot delete driver who is currently on a trip',
        );
      }

      // Soft delete the driver
      await this.driverRepository.softDelete(id);

      this.logger.log(`Deleted driver ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete driver ${id}: ${error.message}`);
      throw error;
    }
  }

  async processTelematics(
    id: string,
    telematicsDto: TelematicsEventDto,
    tenantId: string,
  ): Promise<{
    safetyScore: number;
    eventProcessed: boolean;
    alerts: string[];
  }> {
    try {
      const driver = await this.getDriverById(id, tenantId);
      const alerts: string[] = [];

      // Process different telematics events
      switch (telematicsDto.type) {
        case 'HARSH_BRAKING':
          driver.safetyScore = Math.max(0, driver.safetyScore - 5);
          alerts.push('Harsh braking detected - safety score reduced');
          break;

        case 'SPEEDING':
          const speed = parseInt(telematicsDto.value);
          if (speed > 80) {
            driver.safetyScore = Math.max(0, driver.safetyScore - 3);
            alerts.push('Speeding detected - safety score reduced');
          }
          break;

        case 'SAFE_EVENT':
          driver.safetyScore = Math.min(100, driver.safetyScore + 1);
          break;

        case 'ROUTE_DEVIATION':
          alerts.push('Route deviation detected - please check driver status');
          break;

        case 'ENGINE_FAULT':
          alerts.push('Engine fault detected - vehicle maintenance required');
          break;

        case 'FUEL_LEVEL':
          const fuelLevel = parseInt(telematicsDto.value);
          if (fuelLevel < 20) {
            alerts.push('Low fuel level - driver should refuel soon');
          }
          break;

        case 'LOCATION_UPDATE':
          if (telematicsDto.location) {
            driver.currentLocation = telematicsDto.location;
            driver.locationUpdatedAt = new Date();
          }
          break;

        default:
          this.logger.warn(
            `Unknown telematics event type: ${telematicsDto.type}`,
          );
      }

      // Update consecutive driving hours if provided
      if (telematicsDto.metadata?.consecutiveHours) {
        driver.consecutiveDrivingHours =
          telematicsDto.metadata.consecutiveHours;
      }

      await this.driverRepository.save(driver);

      this.logger.log(
        `Processed telematics event for driver ${id}: ${telematicsDto.type}`,
      );

      return {
        safetyScore: driver.safetyScore,
        eventProcessed: true,
        alerts,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process telematics for driver ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async checkFatigue(
    id: string,
    tenantId: string,
  ): Promise<{
    isFatigued: boolean;
    consecutiveDrivingHours: number;
    recommendedAction: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }> {
    try {
      const driver = await this.getDriverById(id, tenantId);

      const isFatigued = driver.consecutiveDrivingHours > 8;
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      let recommendedAction = 'Continue driving';

      if (driver.consecutiveDrivingHours > 11) {
        riskLevel = 'CRITICAL';
        recommendedAction = 'Immediate rest required - stop driving now';
      } else if (driver.consecutiveDrivingHours > 9) {
        riskLevel = 'HIGH';
        recommendedAction = 'Take a break within 30 minutes';
      } else if (driver.consecutiveDrivingHours > 7) {
        riskLevel = 'MEDIUM';
        recommendedAction = 'Plan for a break soon';
      }

      return {
        isFatigued,
        consecutiveDrivingHours: driver.consecutiveDrivingHours,
        recommendedAction,
        riskLevel,
      };
    } catch (error) {
      this.logger.error(
        `Failed to check fatigue for driver ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async getComplianceStatus(
    id: string,
    tenantId: string,
  ): Promise<{
    licenseValid: boolean;
    licenseExpiry: Date;
    medicalValid: boolean;
    medicalCertExpiry?: Date;
    drugTestValid: boolean;
    drugTestDate?: Date;
    backgroundCheckValid: boolean;
    backgroundCheckDate?: Date;
    trainingValid: boolean;
    trainingCompletionDate?: Date;
    overallCompliant: boolean;
    warnings: string[];
  }> {
    try {
      const driver = await this.getDriverById(id, tenantId);
      const now = new Date();
      const warnings: string[] = [];

      // Check license validity
      const licenseValid = driver.licenseExpiry > now;
      if (!licenseValid) {
        warnings.push('Driver license has expired');
      } else if (
        driver.licenseExpiry.getTime() - now.getTime() <
        30 * 24 * 60 * 60 * 1000
      ) {
        warnings.push('Driver license expires within 30 days');
      }

      // Check medical certificate
      const medicalValid =
        !driver.medicalCertExpiry || driver.medicalCertExpiry > now;
      if (driver.medicalCertExpiry && !medicalValid) {
        warnings.push('Medical certificate has expired');
      } else if (
        driver.medicalCertExpiry &&
        driver.medicalCertExpiry.getTime() - now.getTime() <
          30 * 24 * 60 * 60 * 1000
      ) {
        warnings.push('Medical certificate expires within 30 days');
      }

      // Check drug test (assume valid for 1 year)
      const drugTestValid =
        !driver.drugTestDate ||
        now.getTime() - driver.drugTestDate.getTime() <
          365 * 24 * 60 * 60 * 1000;
      if (!drugTestValid) {
        warnings.push('Drug test is overdue (required annually)');
      }

      // Check background check (assume valid for 2 years)
      const backgroundCheckValid =
        !driver.backgroundCheckDate ||
        now.getTime() - driver.backgroundCheckDate.getTime() <
          2 * 365 * 24 * 60 * 60 * 1000;
      if (!backgroundCheckValid) {
        warnings.push('Background check is overdue (required every 2 years)');
      }

      // Check training (assume valid for 1 year)
      const trainingValid =
        !driver.trainingCompletionDate ||
        now.getTime() - driver.trainingCompletionDate.getTime() <
          365 * 24 * 60 * 60 * 1000;
      if (!trainingValid) {
        warnings.push('Training is overdue (required annually)');
      }

      const overallCompliant =
        licenseValid &&
        medicalValid &&
        drugTestValid &&
        backgroundCheckValid &&
        trainingValid;

      return {
        licenseValid,
        licenseExpiry: driver.licenseExpiry,
        medicalValid,
        medicalCertExpiry: driver.medicalCertExpiry,
        drugTestValid,
        drugTestDate: driver.drugTestDate,
        backgroundCheckValid,
        backgroundCheckDate: driver.backgroundCheckDate,
        trainingValid,
        trainingCompletionDate: driver.trainingCompletionDate,
        overallCompliant,
        warnings,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get compliance status for driver ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async handleEmergency(
    id: string,
    emergencyDto: EmergencyReportDto,
    tenantId: string,
  ): Promise<{
    status: string;
    emergencyId: string;
    responseTime: number;
    actions: string[];
  }> {
    try {
      const driver = await this.getDriverById(id, tenantId);
      const startTime = Date.now();

      // Update driver status to indicate emergency
      await this.driverRepository.update(id, {
        status: DriverStatus.SUSPENDED,
        availabilityStatus: 'EMERGENCY',
      });

      // Generate emergency ID
      const emergencyId = `EMG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const actions: string[] = [
        'Driver status updated to SUSPENDED',
        'Emergency services notified',
        'Management team alerted',
        'Trip tracking suspended',
      ];

      // Add severity-specific actions
      if (emergencyDto.severity === 'CRITICAL') {
        actions.push('Immediate response team dispatched');
        actions.push('Insurance company notified');
      } else if (emergencyDto.severity === 'HIGH') {
        actions.push('Response team dispatched within 30 minutes');
      }

      const responseTime = Date.now() - startTime;

      this.logger.warn(
        `Emergency reported for driver ${id}: ${emergencyDto.emergencyType} - ${emergencyDto.severity}`,
      );

      return {
        status: 'emergency_handled',
        emergencyId,
        responseTime,
        actions,
      };
    } catch (error) {
      this.logger.error(
        `Failed to handle emergency for driver ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async predictAccidentRisk(
    id: string,
    tenantId: string,
  ): Promise<{
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: string[];
    recommendations: string[];
  }> {
    try {
      const driver = await this.getDriverById(id, tenantId);
      const compliance = await this.getComplianceStatus(id, tenantId);

      let riskScore = 0;
      const factors: string[] = [];
      const recommendations: string[] = [];

      // Safety score factor (0-100)
      if (driver.safetyScore < 50) {
        riskScore += 0.4;
        factors.push('Low safety score');
        recommendations.push('Implement additional safety training');
      } else if (driver.safetyScore < 75) {
        riskScore += 0.2;
        factors.push('Below average safety score');
        recommendations.push('Review recent driving behavior');
      }

      // Fatigue factor
      if (driver.consecutiveDrivingHours > 10) {
        riskScore += 0.3;
        factors.push('Extended driving hours');
        recommendations.push('Enforce mandatory rest periods');
      } else if (driver.consecutiveDrivingHours > 8) {
        riskScore += 0.15;
        factors.push('Long driving session');
        recommendations.push('Monitor for fatigue signs');
      }

      // Compliance factor
      if (!compliance.overallCompliant) {
        riskScore += 0.25;
        factors.push('Compliance issues');
        recommendations.push('Address compliance violations immediately');
      }

      // Experience factor (based on total trips)
      if (driver.totalTrips < 10) {
        riskScore += 0.2;
        factors.push('Limited driving experience');
        recommendations.push('Assign experienced driver as mentor');
      }

      // Rating factor
      if (driver.rating < 3.0) {
        riskScore += 0.15;
        factors.push('Low driver rating');
        recommendations.push('Provide additional training and support');
      }

      // Clamp risk score to 0-1
      riskScore = Math.min(1, Math.max(0, riskScore));

      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (riskScore > 0.7) {
        riskLevel = 'CRITICAL';
      } else if (riskScore > 0.5) {
        riskLevel = 'HIGH';
      } else if (riskScore > 0.3) {
        riskLevel = 'MEDIUM';
      }

      return {
        riskScore,
        riskLevel,
        factors,
        recommendations,
      };
    } catch (error) {
      this.logger.error(
        `Failed to predict accident risk for driver ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async getDriverStats(
    id: string,
    tenantId: string,
  ): Promise<{
    totalTrips: number;
    totalDistance: number;
    totalEarnings: number;
    averageRating: number;
    safetyScore: number;
    onTimeDeliveryRate: number;
    hoursWorkedThisWeek: number;
    hoursWorkedThisMonth: number;
    consecutiveDrivingHours: number;
  }> {
    try {
      const driver = await this.getDriverById(id, tenantId);

      return {
        totalTrips: driver.totalTrips,
        totalDistance: driver.totalDistance,
        totalEarnings: driver.totalEarnings,
        averageRating: driver.rating,
        safetyScore: driver.safetyScore,
        onTimeDeliveryRate: driver.onTimeDeliveryRate,
        hoursWorkedThisWeek: driver.hoursWorkedThisWeek,
        hoursWorkedThisMonth: driver.hoursWorkedThisMonth,
        consecutiveDrivingHours: driver.consecutiveDrivingHours,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get driver stats for ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async updateDriverLocation(
    id: string,
    latitude: number,
    longitude: number,
    tenantId: string,
  ): Promise<void> {
    try {
      await this.driverRepository.update(id, {
        currentLocation: { latitude, longitude },
        locationUpdatedAt: new Date(),
      });

      this.logger.log(
        `Updated location for driver ${id}: ${latitude}, ${longitude}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update location for driver ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async assignTruck(
    id: string,
    truckId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      const driver = await this.getDriverById(id, tenantId);

      if (driver.currentTruckId) {
        throw new BadRequestException('Driver is already assigned to a truck');
      }

      await this.driverRepository.update(id, { currentTruckId: truckId });

      this.logger.log(`Assigned truck ${truckId} to driver ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to assign truck to driver ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async unassignTruck(id: string, tenantId: string): Promise<void> {
    try {
      await this.driverRepository.update(id, { currentTruckId: undefined });

      this.logger.log(`Unassigned truck from driver ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to unassign truck from driver ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get loads assigned to driver's truck
   * Accepts either driverId or userId
   */
  async getAssignedLoads(driverIdOrUserId: string, tenantId: string): Promise<Load[]> {
    try {
      // First try to find driver by ID
      let driver = await this.driverRepository.findOne({
        where: { id: driverIdOrUserId, tenantId },
      });

      // If not found by ID, try to find by userId
      if (!driver) {
        driver = await this.driverRepository.findOne({
          where: { userId: driverIdOrUserId, tenantId },
        });
      }

      if (!driver) {
        this.logger.warn(
          `Driver not found with ID or userId: ${driverIdOrUserId} for tenant ${tenantId}`,
        );
        return [];
      }

      // Get truck IDs where this driver is assigned
      const truckIds: string[] = [];

      // Check driver's currentTruckId
      if (driver.currentTruckId) {
        truckIds.push(driver.currentTruckId);
      }

      // Also check all trucks where this driver is in the assignedDrivers array
      const allTrucks = await this.truckRepository.find({
        where: { tenantId },
        select: ['id', 'assignedDrivers'],
      });

      allTrucks.forEach((truck) => {
        if (Array.isArray(truck.assignedDrivers)) {
          const isDriverAssigned = truck.assignedDrivers.some(
            (d: any) => d.driverId === driver.id,
          );
          if (isDriverAssigned && truck.id && !truckIds.includes(truck.id)) {
            truckIds.push(truck.id);
          }
        }
      });

      if (truckIds.length === 0) {
        this.logger.warn(`Driver ${driver.id} has no assigned truck`);
        return [];
      }

      // Get loads assigned to any of these trucks
      const loads = await this.loadRepository.find({
        where: truckIds.map((truckId) => ({
          assignedTruckId: truckId,
          status: LoadStatus.ASSIGNED,
          tenantId,
        })),
        relations: ['cargoOwner'],
        order: {
          pickupDate: 'ASC',
        },
      });

      this.logger.log(
        `Found ${loads.length} assigned loads for driver ${driver.id} (trucks: ${truckIds.join(', ')})`,
      );

      return loads;
    } catch (error) {
      this.logger.error(
        `Failed to get assigned loads for driver/user ${driverIdOrUserId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Accept and load cargo (driver accepts the assigned load)
   * Accepts either driverId or userId
   */
  async acceptAndLoad(
    driverIdOrUserId: string,
    loadId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      // First try to find driver by ID
      let driver = await this.driverRepository.findOne({
        where: { id: driverIdOrUserId, tenantId },
      });

      // If not found by ID, try to find by userId
      if (!driver) {
        driver = await this.driverRepository.findOne({
          where: { userId: driverIdOrUserId, tenantId },
        });
      }

      if (!driver) {
        throw new NotFoundException(
          `Driver not found with ID or userId: ${driverIdOrUserId}`,
        );
      }

      if (!driver.currentTruckId) {
        throw new BadRequestException('Driver is not assigned to any truck');
      }

      // Find the load and verify it's assigned to this driver's truck
      const load = await this.loadRepository.findOne({
        where: {
          id: loadId,
          assignedTruckId: driver.currentTruckId,
          tenantId,
        },
      });

      if (!load) {
        throw new NotFoundException('Load not found or not assigned to your truck');
      }

      if (load.status !== LoadStatus.ASSIGNED) {
        throw new BadRequestException(`Cannot accept load. Current status: ${load.status}`);
      }

      // Update load status to LOADED
      await this.loadRepository.update(loadId, {
        status: LoadStatus.LOADED,
        updatedAt: new Date(),
      });

      this.logger.log(
        `Driver ${driver.id} (userId: ${driver.userId}) accepted and loaded cargo ${loadId}`,
      );

      // Create notification for Cargo Owner
      try {
        await this.notificationService.createNotification({
            recipientId: load.cargoOwnerId,
            tenantId,
            title: 'Cargo Loaded',
            message: `Your cargo "${load.title || 'Shipment'}" has been loaded by driver ${driver.firstName} ${driver.lastName}.`,
            notificationType: NotificationType.CARGO_DELIVERY_UPDATE,
            category: NotificationCategory.CARGO,
            priority: NotificationPriority.HIGH,
            entityId: load.id,
            entityType: EntityType.CARGO,
            channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
            actionUrl: `/dashboard/cargos/${load.id}`,
            actionText: 'View Shipment',
          });
        this.logger.log(`Notification sent to cargo owner ${load.cargoOwnerId}`);
      } catch (notifError) {
        this.logger.error(`Failed to send notification: ${notifError.message}`);
        // Don't fail the main operation if notification fails
      }
    } catch (error) {
      this.logger.error(
        `Failed to accept and load cargo for driver ${driverIdOrUserId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Mark loads as checked/loaded and proceed with journey
   */
  async proceedWithJourney(
    driverId: string,
    loadIds: string[],
    tenantId: string,
  ): Promise<void> {
    try {
      const driver = await this.getDriverById(driverId, tenantId);

      if (!driver.currentTruckId) {
        throw new BadRequestException('Driver is not assigned to any truck');
      }

      // Update load statuses to IN_TRANSIT
      await this.loadRepository.update(
        {
          id: In(loadIds),
          assignedTruckId: driver.currentTruckId,
          tenantId,
        },
        {
          status: LoadStatus.IN_TRANSIT,
          updatedAt: new Date(),
        },
      );

      this.logger.log(
        `Driver ${driverId} proceeded with journey for ${loadIds.length} loads`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to proceed with journey for driver ${driverId}: ${error.message}`,
      );
      throw error;
    }
  }

  async extractDriverDocumentText(documentUrl: string): Promise<string> {
    const result = await this.ocrService.extractText(documentUrl);
    return result.text;
  }

  async getAnnouncements(driverId: string, tenantId: string): Promise<any[]> {
    try {
      this.logger.log(`📢 Fetching announcements for driver ${driverId}`);

      const driver = await this.driverRepository.findOne({
        where: { id: driverId, tenantId },
      });

      if (!driver) {
        this.logger.warn(`Driver ${driverId} not found for announcements`);
        return [];
      }

      // Return notifications specific to this driver user
      const result = await this.notificationService.getNotifications(
        {
          recipientId: driver.userId,
          limit: 20,
        },
        tenantId,
      );

      return result.notifications || [];
    } catch (error) {
      this.logger.error(
        `Failed to fetch announcements for driver ${driverId}: ${error.message}`,
      );
      return [];
    }
  }

  async reportIncident(
    driverId: string,
    incidentData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    try {
      this.logger.log(
        `🚨 Driver ${driverId} reporting incident: ${incidentData.type}`,
      );

      const driver = await this.driverRepository.findOne({
        where: { id: driverId, tenantId },
      });

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }

      const incident = new SafetyIncident();
      Object.assign(incident, {
        ...incidentData,
        driverId,
        driverName: `${driver.firstName} ${driver.lastName}`,
        truckId: driver.currentTruckId,
        tenantId,
        createdBy: userId,
        date: incidentData.date ? new Date(incidentData.date) : new Date(),
        status: incidentData.status || 'reported',
      });

      const savedIncident = await this.safetyIncidentRepository.save(incident);

      // Trigger notification to fleet managers
      await this.notificationService.createNotification({
        recipientId: driver.employerId, // Notify the fleet owner/manager
        tenantId,
        title: `🚨 Incident Reported: ${incident.type.toUpperCase()}`,
        message: `Driver ${driver.firstName} ${driver.lastName} reported a ${incident.severity} severity ${incident.type} at ${incident.location}.`,
        notificationType: NotificationType.ALERT,
        category: NotificationCategory.SAFETY,
        priority: NotificationPriority.HIGH,
        entityId: savedIncident.id,
        entityType: EntityType.DRIVER,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        actionUrl: `/dashboard/fleet/safety/${savedIncident.id}`,
        actionText: 'View Incident',
      });

      return savedIncident;
    } catch (error) {
      this.logger.error(`❌ Failed to report incident: ${error.message}`);
      throw error;
    }
  }

  async completeDelivery(
    driverId: string,
    completeDto: CompleteDeliveryDto,
    tenantId: string,
    photoFile?: Express.Multer.File,
  ): Promise<any> {
    this.logger.log(`Completing delivery for driver ${driverId} and load ${completeDto.loadId}`);
    
    // Find the driver to get the userId for audit
    const driver = await this.driverRepository.findOne({
      where: { id: driverId, tenantId },
      relations: ['user']
    });
    
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Call LoadsService to handle the core delivery logic
    await this.loadsService.deliverLoad(
      completeDto.loadId,
      driver.userId,
      tenantId,
      photoFile,
      completeDto.notes
    );

    // Also update any related trips to COMPLETED
    const trips = await this.tripRepository.find({ where: { loadId: completeDto.loadId, tenantId } });
    for (const trip of trips) {
      if (trip.status !== TripStatus.COMPLETED) {
        await this.tripsService.updateTripStatus(
          trip.id, 
          { 
            status: TripStatus.COMPLETED,
            actualEndTime: new Date()
          }, 
          tenantId
        );
      }
    }

    // Save additional POD information in metadata
    // Use repository.update or findOne then save
    const load = await this.loadRepository.findOne({ where: { id: completeDto.loadId } });
    if (load) {
      load.metadata = {
        ...(load.metadata || {}),
        pod: {
          recipientName: completeDto.recipientName,
          signatureBase64: completeDto.signatureBase64,
          completedAt: new Date().toISOString(),
          completedBy: driverId
        }
      };
      await this.loadRepository.save(load);
    }

    return {
      message: 'Delivery completed successfully',
      loadId: completeDto.loadId,
      status: 'DELIVERED',
      pod: load?.metadata?.pod
    };
  }
}
