import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Truck,
  VehicleStatus,
  TruckType,
  FuelType,
} from '../../entities/truck.entity';
import { Driver, DriverStatus } from '../../entities/driver.entity';
import { Route } from '../../entities/route.entity';
import { RouteTruck } from '../../entities/route-truck.entity';
import { CreateTruckDto } from './dto/create-truck.dto';
import { CreateDriverDto } from './dto/create-driver.dto';

@Injectable()
export class FleetService {
  constructor(
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(RouteTruck)
    private readonly routeTruckRepository: Repository<RouteTruck>,
  ) {}

  // Truck operations
  async createTruck(
    createTruckDto: CreateTruckDto,
    userId: string,
    tenantId: string,
  ): Promise<Truck> {
    try {
      console.log('🚛 FleetService.createTruck called with:', {
        userId,
        tenantId,
        plateNumber: createTruckDto.plateNumber,
        vin: createTruckDto.vin,
      });

      // Validate required fields
      if (!createTruckDto.plateNumber || !createTruckDto.vin) {
        throw new BadRequestException('Plate number and VIN are required');
      }

      if (!userId || !tenantId) {
        throw new BadRequestException('User ID and Tenant ID are required');
      }

      // Validate VIN length (must be exactly 17 characters)
      const vin = String(createTruckDto.vin).trim();
      if (vin.length !== 17) {
        throw new BadRequestException(
          `VIN must be exactly 17 characters long. Provided VIN has ${vin.length} characters.`,
        );
      }

      // Update DTO with trimmed VIN
      createTruckDto.vin = vin;

      // Check for duplicate plate number within the same tenant
      const existingByPlate = await this.truckRepository.findOne({
        where: {
          plateNumber: createTruckDto.plateNumber,
          tenantId,
          deletedAt: null,
        },
      });
      if (existingByPlate) {
        throw new ForbiddenException(
          'Truck with this plate number already exists',
        );
      }

      // Check for duplicate VIN (globally unique)
      const existingByVin = await this.truckRepository.findOne({
        where: {
          vin: createTruckDto.vin,
          deletedAt: null,
        },
      });
      if (existingByVin) {
        throw new ForbiddenException('Truck with this VIN already exists');
      }

      // Clean up empty enum values and provide defaults
      const cleanedDto = {
      ...createTruckDto,
      truckType:
        createTruckDto.truckType && createTruckDto.truckType.trim() !== ''
          ? createTruckDto.truckType
          : TruckType.FLATBED,
      trailerType:
        createTruckDto.trailerType && createTruckDto.trailerType.trim() !== ''
          ? createTruckDto.trailerType
          : null,
      fuelType:
        createTruckDto.fuelType && createTruckDto.fuelType.trim() !== ''
          ? createTruckDto.fuelType
          : FuelType.DIESEL,
      // Clean up numeric fields
      mileage:
        typeof createTruckDto.mileage === 'string' &&
        createTruckDto.mileage !== ''
          ? parseInt(createTruckDto.mileage) || 0
          : createTruckDto.mileage || 0,
      year:
        typeof createTruckDto.year === 'string' && createTruckDto.year !== ''
          ? parseInt(createTruckDto.year)
          : createTruckDto.year || 2023,
      capacityWeight:
        typeof createTruckDto.capacityWeight === 'string' &&
        createTruckDto.capacityWeight !== ''
          ? parseFloat(createTruckDto.capacityWeight)
          : (createTruckDto.capacityWeight && createTruckDto.capacityWeight > 0) ? createTruckDto.capacityWeight : 1,
      capacityVolume:
        typeof createTruckDto.capacityVolume === 'string' &&
        createTruckDto.capacityVolume !== ''
          ? parseFloat(createTruckDto.capacityVolume)
          : (createTruckDto.capacityVolume && createTruckDto.capacityVolume > 0) ? createTruckDto.capacityVolume : 1,
      // Remove driver-related fields that shouldn't be in truck creation
      firstName: undefined,
      lastName: undefined,
      licenseNumber: undefined,
      licenseType: undefined,
      experience: undefined,
      contactInfo: undefined,
    };

      console.log('🧹 Cleaned truck data:', {
        originalTruckType: createTruckDto.truckType,
        cleanedTruckType: cleanedDto.truckType,
        originalTrailerType: createTruckDto.trailerType,
        cleanedTrailerType: cleanedDto.trailerType,
        originalFuelType: createTruckDto.fuelType,
        cleanedFuelType: cleanedDto.fuelType,
        originalMileage: createTruckDto.mileage,
        cleanedMileage: cleanedDto.mileage,
        originalYear: createTruckDto.year,
        cleanedYear: cleanedDto.year,
        originalCapacityWeight: createTruckDto.capacityWeight,
        cleanedCapacityWeight: cleanedDto.capacityWeight,
        originalCapacityVolume: createTruckDto.capacityVolume,
        cleanedCapacityVolume: cleanedDto.capacityVolume,
      });

      // Convert date strings to Date objects for TypeORM
      const convertToDate = (dateValue: any): Date | undefined => {
        if (!dateValue) return undefined;
        if (dateValue instanceof Date) return dateValue;
        if (typeof dateValue === 'string') {
          const parsed = new Date(dateValue);
          if (!isNaN(parsed.getTime())) {
            return parsed;
          }
        }
        return undefined;
      };

      const truck = this.truckRepository.create({
      ...cleanedDto,
      ownerId: userId,
      tenantId,
      status: VehicleStatus.AVAILABLE,
      equipmentList: createTruckDto.equipmentList || [],
      maintenanceAlerts: [],
      assignedDrivers: [],
      assignedRoutes: [],
      totalTrips: 0,
      totalRevenue: 0,
      averageRating: 0,
      mileage: cleanedDto.mileage,
      // Ensure dates are Date objects
      registrationExpiry: convertToDate(cleanedDto.registrationExpiry) || new Date(),
      insuranceExpiry: convertToDate(cleanedDto.insuranceExpiry) || new Date(),
      roadworthyCertExpiry: cleanedDto.roadworthyCertExpiry ? convertToDate(cleanedDto.roadworthyCertExpiry) : undefined,
      lastMaintenanceDate: cleanedDto.lastMaintenanceDate ? convertToDate(cleanedDto.lastMaintenanceDate) : undefined,
      nextMaintenanceDate: cleanedDto.nextMaintenanceDate ? convertToDate(cleanedDto.nextMaintenanceDate) : undefined,
      // Ensure boolean fields are actual booleans
      hasRefrigeration: Boolean(cleanedDto.hasRefrigeration),
      hasLiftGate: Boolean(cleanedDto.hasLiftGate),
      hasGps: Boolean(cleanedDto.hasGps),
      hasHazmatPermit: Boolean(cleanedDto.hasHazmatPermit),
      hasSideRails: cleanedDto.hasSideRails !== undefined ? Boolean(cleanedDto.hasSideRails) : false,
      hasTarps: cleanedDto.hasTarps !== undefined ? Boolean(cleanedDto.hasTarps) : false,
      hasStraps: cleanedDto.hasStraps !== undefined ? Boolean(cleanedDto.hasStraps) : false,
      hasChains: cleanedDto.hasChains !== undefined ? Boolean(cleanedDto.hasChains) : false,
        hasWinch: cleanedDto.hasWinch !== undefined ? Boolean(cleanedDto.hasWinch) : false,
      });

      try {
        console.log('💾 Saving truck to database...');
        const savedTruck = await this.truckRepository.save(truck);
        console.log('✅ Truck saved successfully with ID:', savedTruck.id);
        return savedTruck;
      } catch (error) {
        console.error('🚛 Database error during truck creation:', error);
        console.error('🚛 Error code:', error.code);
        console.error('🚛 Error detail:', error.detail);
        console.error('🚛 Error message:', error.message);

        // Handle database constraint violations
        if (error.code === '23505') {
          if (error.detail?.includes('vin')) {
            throw new ForbiddenException('Truck with this VIN already exists');
          } else if (error.detail?.includes('plateNumber')) {
            throw new ForbiddenException(
              'Truck with this plate number already exists',
            );
          } else {
            throw new ForbiddenException(
              'Truck with duplicate data already exists',
            );
          }
        }

        // Handle data too long errors
        if (error.code === '22001') {
          throw new ForbiddenException(
            'VIN number must be exactly 17 characters long',
          );
        }

        // Re-throw other errors
        throw error;
      }
    } catch (error) {
      console.error('❌ Error in createTruck service:', error);
      // If it's already a NestJS HTTP exception, re-throw it
      if (error instanceof HttpException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      // Wrap other errors
      throw new InternalServerErrorException({
        message: 'Failed to create truck',
        error: error.message || 'An unexpected error occurred',
      });
    }
  }

  async findAllTrucks(
    tenantId: string,
    userId?: string,
    filters?: any,
  ): Promise<Truck[]> {
    const query = this.truckRepository
      .createQueryBuilder('truck')
      .leftJoinAndSelect('truck.owner', 'owner')
      .where('truck.tenantId = :tenantId', { tenantId });

    // Remove the userId filter to show all trucks in the tenant
    // Only filter by userId if explicitly requested (for user-specific views)
    // if (userId) {
    //   query.andWhere('truck.ownerId = :userId', { userId });
    // }

    // Apply filters
    if (filters?.search) {
      query.andWhere(
        '(truck.plateNumber LIKE :search OR truck.make LIKE :search OR truck.model LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.status) {
      query.andWhere('truck.status = :status', { status: filters.status });
    }

    if (filters?.location) {
      query.andWhere('truck.currentLocation LIKE :location', {
        location: `%${filters.location}%`,
      });
    }

    // Apply pagination
    if (filters?.page && filters?.limit) {
      const skip = (filters.page - 1) * filters.limit;
      query.skip(skip).take(filters.limit);
    }

    return query.getMany();
  }

  async findOneTruck(id: string, tenantId: string): Promise<Truck> {
    const truck = await this.truckRepository.findOne({
      where: { id, tenantId },
      relations: ['owner'],
    });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    return truck;
  }

  async updateTruck(
    id: string,
    updateTruckDto: Partial<CreateTruckDto>,
    tenantId: string,
    userId: string,
  ): Promise<Truck> {
    const truck = await this.findOneTruck(id, tenantId);

    if (truck.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own trucks');
    }

    Object.assign(truck, updateTruckDto);
    return this.truckRepository.save(truck);
  }

  async removeTruck(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const truck = await this.findOneTruck(id, tenantId);

    if (truck.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own trucks');
    }

    if (truck.status !== VehicleStatus.AVAILABLE) {
      throw new ForbiddenException(
        'Can only delete trucks in AVAILABLE status',
      );
    }

    await this.truckRepository.remove(truck);
  }

  // Driver operations
  async createDriver(
    createDriverDto: CreateDriverDto,
    userId: string,
    tenantId: string,
  ): Promise<Driver> {
    try {
      console.log('👤 Creating driver:', {
        firstName: createDriverDto.firstName,
        lastName: createDriverDto.lastName,
        email: createDriverDto.email,
        licenseNumber: createDriverDto.licenseNumber,
        userId,
        tenantId,
      });

      // Validate required fields
      if (!createDriverDto.firstName) {
        throw new BadRequestException('First name is required');
      }
      if (!createDriverDto.lastName) {
        throw new BadRequestException('Last name is required');
      }
      if (!createDriverDto.email) {
        throw new BadRequestException('Email is required');
      }
      if (!createDriverDto.licenseNumber) {
        throw new BadRequestException('License number is required');
      }
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      if (!tenantId) {
        throw new BadRequestException('Tenant ID is required');
      }

      // Check for duplicate license number in the same tenant
      const existingDriver = await this.driverRepository.findOne({
        where: {
          licenseNumber: createDriverDto.licenseNumber,
          tenantId,
        },
      });

      if (existingDriver) {
        throw new ConflictException(
          `A driver with license number ${createDriverDto.licenseNumber} already exists in this tenant`,
        );
      }

      // Create driver entity
      const driver = this.driverRepository.create({
        ...createDriverDto,
        userId,
        employerId: userId,
        tenantId,
        // Override status from DTO to ensure it's ACTIVE for new drivers
        status: DriverStatus.ACTIVE,
        availabilityStatus: 'AVAILABLE',
        // Set default values for optional fields that aren't in the DTO
        emergencyContact: {},
        licenseClasses: [],
        endorsements: [],
        restrictions: [],
        certifications: [],
        preferences: {},
      });

      console.log('💾 Saving driver to database...');
      const savedDriver = await this.driverRepository.save(driver);
      console.log('✅ Driver saved successfully:', savedDriver.id);

      return savedDriver;
    } catch (error) {
      console.error('❌ Error in createDriver service:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error detail:', error.detail);
      console.error('❌ Error stack:', error.stack);

      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Handle database errors
      if (error.code === '23505') {
        // Unique constraint violation
        const detail = error.detail || '';
        if (detail.includes('licenseNumber') || detail.includes('license_number')) {
          throw new ConflictException('A driver with this license number already exists');
        }
        if (detail.includes('email')) {
          throw new ConflictException('A driver with this email already exists');
        }
        throw new ConflictException('A driver with these details already exists');
      }

      if (error.code === '22001') {
        // Data too long
        throw new BadRequestException('One or more fields exceed maximum length');
      }

      if (error.code === '23502') {
        // Not null violation
        throw new BadRequestException('Required field is missing');
      }

      // Generic error
      throw new InternalServerErrorException({
        message: 'Failed to create driver',
        error: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  async findAllDrivers(
    tenantId: string,
    userId?: string,
    filters?: any,
  ): Promise<Driver[]> {
    const query = this.driverRepository
      .createQueryBuilder('driver')
      .where('driver.tenantId = :tenantId', { tenantId });

    if (userId) {
      query.andWhere('driver.employerId = :userId', { userId });
    }

    // Apply filters
    if (filters?.search) {
      query.andWhere(
        '(driver.firstName LIKE :search OR driver.lastName LIKE :search OR driver.licenseNumber LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.status) {
      query.andWhere('driver.status = :status', { status: filters.status });
    }

    if (filters?.location) {
      query.andWhere('driver.currentLocation LIKE :location', {
        location: `%${filters.location}%`,
      });
    }

    // Apply pagination
    if (filters?.page && filters?.limit) {
      const skip = (filters.page - 1) * filters.limit;
      query.skip(skip).take(filters.limit);
    }

    // Explicitly select currentTruckId to ensure it's returned
    // This is important for filtering available drivers in the frontend
    const drivers = await query.getMany();
    
    // Log for debugging
    console.log('📊 findAllDrivers - Total drivers:', drivers.length);
    console.log('📊 Drivers with currentTruckId:', drivers.filter(d => d.currentTruckId).length);
    drivers.forEach(driver => {
      if (driver.currentTruckId) {
        console.log(`  - Driver ${driver.firstName} ${driver.lastName} has currentTruckId: ${driver.currentTruckId}`);
      }
    });
    
    return drivers;
  }

  async findOneDriver(id: string, tenantId: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id, tenantId },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return driver;
  }

  async updateDriver(
    id: string,
    updateDriverDto: Partial<CreateDriverDto>,
    tenantId: string,
    userId: string,
  ): Promise<Driver> {
    const driver = await this.findOneDriver(id, tenantId);

    if (driver.employerId !== userId) {
      throw new ForbiddenException('You can only update your own drivers');
    }

    Object.assign(driver, updateDriverDto);
    return this.driverRepository.save(driver);
  }

  async removeDriver(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const driver = await this.findOneDriver(id, tenantId);

    if (driver.employerId !== userId) {
      throw new ForbiddenException('You can only delete your own drivers');
    }

    if (driver.status !== DriverStatus.ACTIVE) {
      throw new ForbiddenException('Can only delete drivers in ACTIVE status');
    }

    await this.driverRepository.remove(driver);
  }

  // Driver assignment operations
  async assignDriverToTruck(
    truckId: string,
    driverId: string,
    tenantId: string,
    userId: string,
    notes?: string,
  ): Promise<any> {
    try {
      console.log('👤 Assigning driver to truck:', {
        truckId,
        driverId,
        tenantId,
        userId,
      });

      // Validate inputs
      if (!truckId || !driverId || !tenantId || !userId) {
        throw new BadRequestException(
          'Truck ID, Driver ID, Tenant ID, and User ID are required',
        );
      }

      // Find truck and driver
      const truck = await this.findOneTruck(truckId, tenantId);
      const driver = await this.findOneDriver(driverId, tenantId);

      console.log('✅ Found truck and driver:', {
        truckPlate: truck.plateNumber,
        driverName: `${driver.firstName} ${driver.lastName}`,
        driverCurrentTruckId: driver.currentTruckId,
      });

      // Check if driver is already assigned to ANY truck in the system
      if (driver.currentTruckId) {
        // Check if it's the same truck (re-assignment)
        if (driver.currentTruckId === truckId) {
          // Check if already in assignedDrivers array
          const existingAssignment = truck.assignedDrivers?.find(
            (d) => d.driverId === driverId,
          );
          if (existingAssignment) {
            throw new ConflictException('Driver is already assigned to this truck');
          }
          // If currentTruckId matches but not in array, continue (might be stale data)
        } else {
          // Driver is assigned to a different truck
          const currentTruck = await this.truckRepository.findOne({
            where: { id: driver.currentTruckId, tenantId },
          });
          const currentTruckPlate = currentTruck?.plateNumber || driver.currentTruckId;
          throw new ConflictException(
            `Driver is already assigned to another truck (${currentTruckPlate}). Please unassign the driver from the current truck first.`,
          );
        }
      }

      // Also check if driver is in this truck's assignedDrivers array (double-check)
      const existingAssignment = truck.assignedDrivers?.find(
        (d) => d.driverId === driverId,
      );
      if (existingAssignment) {
        throw new ConflictException('Driver is already assigned to this truck');
      }

      // System-wide check: Search all trucks in the tenant to ensure driver isn't assigned elsewhere
      // This is a safety check in case currentTruckId is out of sync
      const allTrucks = await this.truckRepository.find({
        where: { tenantId },
        select: ['id', 'plateNumber', 'assignedDrivers'],
      });

      const trucksWithDriver = allTrucks.filter((t) => {
        if (!Array.isArray(t.assignedDrivers)) return false;
        return t.assignedDrivers.some((d: any) => d.driverId === driverId);
      });

      if (trucksWithDriver.length > 0) {
        const otherTrucks = trucksWithDriver.filter((t) => t.id !== truckId);
        if (otherTrucks.length > 0) {
          const otherTruckPlates = otherTrucks.map((t) => t.plateNumber).join(', ');
          throw new ConflictException(
            `Driver is already assigned to other truck(s): ${otherTruckPlates}. Please unassign the driver first.`,
          );
        }
      }

      // Add driver to truck's assigned drivers
      // Ensure assignedDrivers is initialized as an array
      const currentAssignedDrivers = Array.isArray(truck.assignedDrivers) 
        ? [...truck.assignedDrivers] 
        : [];

      const assignmentData = {
        driverId,
        driverName: `${driver.firstName} ${driver.lastName}`,
        assignmentDate: new Date().toISOString(),
        status: 'active',
        notes: notes || null,
      };

      currentAssignedDrivers.push(assignmentData);

      // Update the truck with the new assigned drivers array
      truck.assignedDrivers = currentAssignedDrivers;

      console.log('💾 Saving truck with assigned driver...');
      console.log('📋 Assigned drivers array:', JSON.stringify(truck.assignedDrivers, null, 2));
      
      try {
        // Use update query for JSONB field to ensure it's properly saved
        // This is more reliable than save() for JSONB array updates
        await this.truckRepository.update(truck.id, {
          assignedDrivers: currentAssignedDrivers,
        });
        
        // Update driver's currentTruckId to prevent assignment to other trucks
        await this.driverRepository.update(driver.id, {
          currentTruckId: truck.id,
        });
        
        console.log('✅ Updated driver.currentTruckId to:', truck.id);
        
        // Reload the truck to get the updated data
        const savedTruck = await this.truckRepository.findOne({
          where: { id: truck.id, tenantId },
        });
        
        console.log('✅ Driver assigned successfully');
        console.log('✅ Saved truck assigned drivers:', JSON.stringify(savedTruck?.assignedDrivers, null, 2));
        
        if (!savedTruck) {
          throw new NotFoundException('Truck not found after update');
        }
      } catch (saveError) {
        console.error('❌ Database save error:', saveError);
        console.error('❌ Save error code:', saveError.code);
        console.error('❌ Save error detail:', saveError.detail);
        console.error('❌ Save error message:', saveError.message);
        console.error('❌ Save error stack:', saveError.stack);
        
        // Handle specific database errors
        if (saveError.code === '23505') {
          throw new ConflictException('Driver assignment conflict detected');
        }
        
        throw saveError;
      }

      return {
        truckId,
        driverId,
        driverName: `${driver.firstName} ${driver.lastName}`,
        assignmentDate: assignmentData.assignmentDate,
        status: 'active',
        notes: assignmentData.notes,
      };
    } catch (error) {
      console.error('❌ Error in assignDriverToTruck:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error message:', error.message);

      // If it's already a NestJS HTTP exception, re-throw it
      if (
        error instanceof HttpException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      // Wrap other errors - use string message for better error handling
      const errorMsg = error.message || 'An unexpected error occurred';
      console.error('❌ Wrapping error as InternalServerErrorException:', errorMsg);
      throw new InternalServerErrorException(
        `Failed to assign driver to truck: ${errorMsg}`,
      );
    }
  }

  async unassignDriverFromTruck(
    truckId: string,
    driverId: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    try {
      console.log('👤 Unassigning driver from truck:', {
        truckId,
        driverId,
        tenantId,
        userId,
      });

      // Validate inputs
      if (!truckId || !driverId || !tenantId || !userId) {
        throw new BadRequestException(
          'Truck ID, Driver ID, Tenant ID, and User ID are required',
        );
      }

      const truck = await this.findOneTruck(truckId, tenantId);

      if (!truck.assignedDrivers || truck.assignedDrivers.length === 0) {
        throw new NotFoundException('No drivers assigned to this truck');
      }

      const driverIndex = truck.assignedDrivers.findIndex(
        (d) => d.driverId === driverId,
      );
      if (driverIndex === -1) {
        throw new NotFoundException('Driver is not assigned to this truck');
      }

      truck.assignedDrivers.splice(driverIndex, 1);
      console.log('💾 Saving truck after driver unassignment...');
      
      // Update truck's assignedDrivers array
      await this.truckRepository.update(truck.id, {
        assignedDrivers: truck.assignedDrivers,
      });
      
      // Clear driver's currentTruckId to make them available for other assignments
      await this.driverRepository.update(driverId, {
        currentTruckId: null,
      });
      
      // Safety cleanup: Remove driver from any other trucks' assignedDrivers arrays
      // This handles edge cases where data might be inconsistent
      const allTrucks = await this.truckRepository.find({
        where: { tenantId },
        select: ['id', 'assignedDrivers'],
      });
      
      for (const otherTruck of allTrucks) {
        if (otherTruck.id === truck.id) continue; // Already handled above
        
        if (Array.isArray(otherTruck.assignedDrivers)) {
          const hasDriver = otherTruck.assignedDrivers.some(
            (d: any) => d.driverId === driverId,
          );
          
          if (hasDriver) {
            console.log(`🧹 Cleaning up orphaned driver assignment from truck ${otherTruck.id}`);
            const cleanedDrivers = otherTruck.assignedDrivers.filter(
              (d: any) => d.driverId !== driverId,
            );
            await this.truckRepository.update(otherTruck.id, {
              assignedDrivers: cleanedDrivers,
            });
          }
        }
      }
      
      console.log('✅ Cleared driver.currentTruckId');
      console.log('✅ Driver unassigned successfully');
    } catch (error) {
      console.error('❌ Error in unassignDriverFromTruck:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error message:', error.message);

      // If it's already a NestJS HTTP exception, re-throw it
      if (
        error instanceof HttpException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Wrap other errors - use string message for better error handling
      const errorMsg = error.message || 'An unexpected error occurred';
      console.error('❌ Wrapping error as InternalServerErrorException:', errorMsg);
      throw new InternalServerErrorException(
        `Failed to unassign driver from truck: ${errorMsg}`,
      );
    }
  }

  // Truck records and documents
  async getTruckRecords(truckId: string, tenantId: string): Promise<any> {
    const truck = await this.findOneTruck(truckId, tenantId);
    return {
      maintenance: truck.maintenanceAlerts || [],
      documents: [],
      trips: [],
    };
  }

  async addTruckDocument(
    truckId: string,
    documentData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    const truck = await this.findOneTruck(truckId, tenantId);
    // Implementation for document storage would go here
    return {
      message: 'Document added successfully',
      documentId: 'doc-' + Date.now(),
    };
  }

  // Maintenance operations
  async getTruckMaintenance(truckId: string, tenantId: string): Promise<any[]> {
    const truck = await this.findOneTruck(truckId, tenantId);
    return truck.maintenanceAlerts || [];
  }

  async addTruckMaintenance(
    truckId: string,
    maintenanceData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    const truck = await this.findOneTruck(truckId, tenantId);

    if (!truck.maintenanceAlerts) {
      truck.maintenanceAlerts = [];
    }

    const maintenance = {
      id: 'maint-' + Date.now(),
      ...maintenanceData,
      createdAt: new Date(),
      createdBy: userId,
    };

    truck.maintenanceAlerts.push(maintenance);
    await this.truckRepository.save(truck);

    return maintenance;
  }

  // Route operations (placeholder implementations)
  async createRoute(
    routeData: any,
    userId: string,
    tenantId: string,
  ): Promise<any> {
    // Normalize payload to match entity expectations
    const normalizedStatus = (routeData?.status || 'active')
      .toString()
      .toLowerCase();
    const route = this.routeRepository.create({
      ...routeData,
      status:
        normalizedStatus === 'active' ||
        normalizedStatus === 'inactive' ||
        normalizedStatus === 'maintenance'
          ? normalizedStatus
          : 'inactive',
      distance:
        typeof routeData?.distance === 'string'
          ? parseFloat(routeData.distance)
          : Number(routeData?.distance ?? 0),
      estimatedTime:
        typeof routeData?.estimatedTime === 'string'
          ? parseInt(routeData.estimatedTime)
          : Number(routeData?.estimatedTime ?? 0),
      isActive:
        typeof routeData?.isActive === 'boolean' ? routeData.isActive : true,
      assignedTrucks: Array.isArray(routeData?.assignedTrucks)
        ? routeData.assignedTrucks
        : [],
      assignedDrivers: Array.isArray(routeData?.assignedDrivers)
        ? routeData.assignedDrivers
        : [],
      tenantId,
    });

    try {
      return await this.routeRepository.save(route);
    } catch (error) {
      console.error('❌ createRoute error:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        table: error?.table,
        constraint: error?.constraint,
      });
      // Unique constraint (tenantId + name)
      if (error?.code === '23505') {
        throw new ConflictException('Route with this name already exists');
      }
      // Not null violation
      if (error?.code === '23502') {
        throw new BadRequestException('Missing required route fields');
      }

      // Invalid enum or invalid numeric input
      if (
        error?.code === '22P02' ||
        error?.code === '22003' ||
        error?.code === '22001'
      ) {
        throw new BadRequestException('Invalid route data provided');
      }

      throw error;
    }
  }

  async findAllRoutes(
    tenantId: string,
    userId?: string,
    filters?: any,
  ): Promise<any[]> {
    const query = this.routeRepository
      .createQueryBuilder('route')
      .where('route.tenantId = :tenantId', { tenantId });

    // Apply filters
    if (filters?.search) {
      query.andWhere(
        '(route.name LIKE :search OR route.description LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Apply pagination
    if (filters?.page && filters?.limit) {
      const skip = (filters.page - 1) * filters.limit;
      query.skip(skip).take(filters.limit);
    }

    return query.getMany();
  }

  async findOneRoute(id: string, tenantId: string): Promise<any> {
    const route = await this.routeRepository.findOne({
      where: { id, tenantId },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    return route;
  }

  async updateRoute(
    id: string,
    updateData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    const route = await this.findOneRoute(id, tenantId);

    // Normalize and assign updates safely
    const normalizedStatus = (updateData?.status ?? route.status)
      .toString()
      .toLowerCase();
    Object.assign(route, {
      ...updateData,
      status:
        normalizedStatus === 'active' ||
        normalizedStatus === 'inactive' ||
        normalizedStatus === 'maintenance'
          ? normalizedStatus
          : route.status,
      distance:
        updateData?.distance !== undefined
          ? typeof updateData.distance === 'string'
            ? parseFloat(updateData.distance)
            : Number(updateData.distance)
          : route.distance,
      estimatedTime:
        updateData?.estimatedTime !== undefined
          ? typeof updateData.estimatedTime === 'string'
            ? parseInt(updateData.estimatedTime)
            : Number(updateData.estimatedTime)
          : route.estimatedTime,
    });

    try {
      return await this.routeRepository.save(route);
    } catch (error) {
      console.error('❌ updateRoute error:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        table: error?.table,
        constraint: error?.constraint,
      });
      if (error?.code === '23505') {
        throw new ConflictException('Route with this name already exists');
      }
      if (error?.code === '23502') {
        throw new BadRequestException('Missing required route fields');
      }
      if (
        error?.code === '22P02' ||
        error?.code === '22003' ||
        error?.code === '22001'
      ) {
        throw new BadRequestException('Invalid route data provided');
      }
      throw error;
    }
  }

  async removeRoute(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const route = await this.findOneRoute(id, tenantId);

    await this.routeRepository.remove(route);
  }

  // Bulk operations
  async bulkAssignToTrucks(
    assignmentData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    return { message: 'Bulk assignment completed', affected: 0 };
  }

  async bulkUnassignFromTrucks(
    unassignmentData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    return { message: 'Bulk unassignment completed', affected: 0 };
  }

  // Fleet analytics
  async getFleetAnalytics(tenantId: string, userId: string) {
    const trucks = await this.findAllTrucks(tenantId, userId);
    const drivers = await this.findAllDrivers(tenantId, userId);

    return {
      totalTrucks: trucks.length,
      availableTrucks: trucks.filter(
        (t) => t.status === VehicleStatus.AVAILABLE,
      ).length,
      totalDrivers: drivers.length,
      activeDrivers: drivers.filter((d) => d.status === DriverStatus.ACTIVE)
        .length,
      totalCapacity: trucks.reduce((sum, t) => sum + t.capacityWeight, 0),
      averageTruckRating:
        trucks.length > 0
          ? trucks.reduce((sum, t) => sum + t.averageRating, 0) / trucks.length
          : 0,
      averageDriverRating:
        drivers.length > 0
          ? drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length
          : 0,
    };
  }

  // Route-Truck Assignment Methods
  async assignRouteToTruck(
    routeId: string,
    truckId: string,
    userId: string,
    tenantId: string,
  ): Promise<RouteTruck> {
    // Verify the route exists and belongs to the tenant
    const route = await this.routeRepository.findOne({
      where: { id: routeId, tenantId },
    });
    if (!route) {
      throw new NotFoundException('Route not found');
    }

    // Verify the truck exists and belongs to the user/tenant
    const truck = await this.truckRepository.findOne({
      where: { id: truckId, ownerId: userId, tenantId },
    });
    if (!truck) {
      throw new NotFoundException('Truck not found or not owned by user');
    }

    // Check if assignment already exists
    const existingAssignment = await this.routeTruckRepository.findOne({
      where: { routeId, truckId, tenantId },
    });
    if (existingAssignment) {
      throw new ConflictException('Truck is already assigned to this route');
    }

    // Create the assignment
    const assignment = this.routeTruckRepository.create({
      routeId,
      truckId,
      tenantId,
    });
    const saved = await this.routeTruckRepository.save(assignment);

    // Also reflect assignment into legacy JSON column for backward compatibility
    try {
      const routeToUpdate = await this.routeRepository.findOne({
        where: { id: routeId, tenantId },
      });
      if (routeToUpdate) {
        const current = Array.isArray((routeToUpdate as any).assignedTrucks)
          ? ((routeToUpdate as any).assignedTrucks as string[])
          : [];
        if (!current.includes(truckId)) {
          (routeToUpdate as any).assignedTrucks = [...current, truckId];
          await this.routeRepository.save(routeToUpdate);
        }
      }
    } catch (err) {
      // Non-fatal: keep assignment even if JSON sync fails
      console.warn(
        'assignRouteToTruck: failed to sync route.assignedTrucks JSON',
        err?.message,
      );
    }

    return saved;
  }

  async unassignRouteFromTruck(
    routeId: string,
    truckId: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    // Verify the truck belongs to the user
    const truck = await this.truckRepository.findOne({
      where: { id: truckId, ownerId: userId, tenantId },
    });
    if (!truck) {
      throw new NotFoundException('Truck not found or not owned by user');
    }

    const assignment = await this.routeTruckRepository.findOne({
      where: { routeId, truckId, tenantId },
    });
    if (!assignment) {
      throw new NotFoundException('Route assignment not found');
    }

    await this.routeTruckRepository.remove(assignment);

    // Also remove from legacy JSON column for backward compatibility
    try {
      const routeToUpdate = await this.routeRepository.findOne({
        where: { id: routeId, tenantId },
      });
      if (routeToUpdate) {
        const current = Array.isArray((routeToUpdate as any).assignedTrucks)
          ? ((routeToUpdate as any).assignedTrucks as string[])
          : [];
        if (current.includes(truckId)) {
          (routeToUpdate as any).assignedTrucks = current.filter(
            (t) => t !== truckId,
          );
          await this.routeRepository.save(routeToUpdate);
        }
      }
    } catch (err) {
      console.warn(
        'unassignRouteFromTruck: failed to sync route.assignedTrucks JSON',
        err?.message,
      );
    }
  }

  async getTruckRoutes(
    truckId: string,
    userId: string,
    tenantId: string,
  ): Promise<Route[]> {
    // Verify the truck exists within the tenant (viewing routes should be tenant-scoped)
    const truck = await this.truckRepository.findOne({
      where: { id: truckId, tenantId },
    });
    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    const assignments = await this.routeTruckRepository.find({
      where: { truckId, tenantId },
      relations: ['route'],
    });

    return assignments.map((assignment) => assignment.route);
  }

  async getRouteAssignments(
    routeId: string,
    tenantId: string,
  ): Promise<RouteTruck[]> {
    return await this.routeTruckRepository.find({
      where: { routeId, tenantId },
      relations: ['route'],
    });
  }

  async bulkAssignRoutes(
    assignments: { routeId: string; truckId: string }[],
    userId: string,
    tenantId: string,
  ): Promise<RouteTruck[]> {
    const results: RouteTruck[] = [];

    for (const assignment of assignments) {
      try {
        const result = await this.assignRouteToTruck(
          assignment.routeId,
          assignment.truckId,
          userId,
          tenantId,
        );
        results.push(result);
      } catch (error) {
        // Log error but continue with other assignments
        console.error(
          `Failed to assign route ${assignment.routeId} to truck ${assignment.truckId}:`,
          error.message,
        );
      }
    }

    return results;
  }
}
