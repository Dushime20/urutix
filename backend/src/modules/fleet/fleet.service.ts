import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  Logger,
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
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { CreateTruckDto } from './dto/create-truck.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { EmailService } from '../auth/email.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class FleetService {
  private readonly logger = new Logger(FleetService.name);

  constructor(
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(RouteTruck)
    private readonly routeTruckRepository: Repository<RouteTruck>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly emailService: EmailService,
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
            : createTruckDto.capacityWeight && createTruckDto.capacityWeight > 0
              ? createTruckDto.capacityWeight
              : 1,
        capacityVolume:
          typeof createTruckDto.capacityVolume === 'string' &&
          createTruckDto.capacityVolume !== ''
            ? parseFloat(createTruckDto.capacityVolume)
            : createTruckDto.capacityVolume && createTruckDto.capacityVolume > 0
              ? createTruckDto.capacityVolume
              : 1,
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
        registrationExpiry:
          convertToDate(cleanedDto.registrationExpiry) || new Date(),
        insuranceExpiry:
          convertToDate(cleanedDto.insuranceExpiry) || new Date(),
        roadworthyCertExpiry: cleanedDto.roadworthyCertExpiry
          ? convertToDate(cleanedDto.roadworthyCertExpiry)
          : undefined,
        lastMaintenanceDate: cleanedDto.lastMaintenanceDate
          ? convertToDate(cleanedDto.lastMaintenanceDate)
          : undefined,
        nextMaintenanceDate: cleanedDto.nextMaintenanceDate
          ? convertToDate(cleanedDto.nextMaintenanceDate)
          : undefined,
        // Ensure boolean fields are actual booleans
        hasRefrigeration: Boolean(cleanedDto.hasRefrigeration),
        hasLiftGate: Boolean(cleanedDto.hasLiftGate),
        hasGps: Boolean(cleanedDto.hasGps),
        hasHazmatPermit: Boolean(cleanedDto.hasHazmatPermit),
        hasSideRails:
          cleanedDto.hasSideRails !== undefined
            ? Boolean(cleanedDto.hasSideRails)
            : false,
        hasTarps:
          cleanedDto.hasTarps !== undefined
            ? Boolean(cleanedDto.hasTarps)
            : false,
        hasStraps:
          cleanedDto.hasStraps !== undefined
            ? Boolean(cleanedDto.hasStraps)
            : false,
        hasChains:
          cleanedDto.hasChains !== undefined
            ? Boolean(cleanedDto.hasChains)
            : false,
        hasWinch:
          cleanedDto.hasWinch !== undefined
            ? Boolean(cleanedDto.hasWinch)
            : false,
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
      if (
        error instanceof HttpException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
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
    try {
      console.log(`🔍 Fleet Service - Finding trucks for tenant: ${tenantId}`);
      console.log(`🔍 Fleet Service - TenantId value: "${tenantId}"`);
      console.log(`🔍 Fleet Service - TenantId type: ${typeof tenantId}`);
      
      // Use query builder to ensure tenantId is included in the query
      // Start with tenantId as the first condition to ensure it's always included
      const queryBuilder = this.truckRepository
        .createQueryBuilder('truck')
        .where('truck.tenantId = :tenantId', { tenantId: tenantId })
        .andWhere('truck.isActive = :isActive', { isActive: true })
        .andWhere('truck.deletedAt IS NULL')
        .setParameter('tenantId', tenantId)
        .setParameter('isActive', true);
      
      // Apply filters
      if (filters?.status) {
        queryBuilder.andWhere('truck.status = :status', { status: filters.status });
      }
      
      // Apply search filter
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        queryBuilder.andWhere(
          '(LOWER(truck.plateNumber) LIKE :search OR LOWER(truck.make) LIKE :search OR LOWER(truck.model) LIKE :search)',
          { search: `%${searchLower}%` }
        );
      }
      
      // Apply pagination
      if (filters?.limit) {
        queryBuilder.take(filters.limit);
      }
      if (filters?.page && filters?.limit) {
        queryBuilder.skip((filters.page - 1) * filters.limit);
      }
      
      // Order by
      queryBuilder.orderBy('truck.createdAt', 'DESC');
      
      // Log the query before execution
      const sql = queryBuilder.getSql();
      const params = queryBuilder.getParameters();
      console.log(`🔍 Fleet Service - Query SQL:`, sql);
      console.log(`🔍 Fleet Service - Query parameters:`, JSON.stringify(params, null, 2));
      console.log(`🔍 Fleet Service - SQL includes tenantId?`, sql.includes('tenantId'));
      
      // Verify tenantId is in parameters
      if (!params.tenantId) {
        console.error('❌ CRITICAL: tenantId is missing from query parameters!');
        console.error('❌ Parameters:', params);
        throw new Error('tenantId parameter is missing from query');
      }
      
      // Execute query
      const trucks = await queryBuilder.getMany();
      
      console.log(`🔍 Fleet Service - Raw query result: ${trucks.length} trucks`);
      console.log(`🔍 Fleet Service - Trucks IDs:`, trucks.map(t => t.id));
      console.log(`✅ Fleet Service - Found ${trucks.length} trucks for tenant ${tenantId}`);
      
      if (trucks.length === 0) {
        console.warn(`⚠️ No trucks found for tenant ${tenantId}`);
        console.warn(`⚠️ This might indicate:`);
        console.warn(`   - Tenant ID mismatch`);
        console.warn(`   - All trucks are soft-deleted`);
        console.warn(`   - All trucks have isActive = false`);
      }
      
      return trucks;
    } catch (error) {
      console.error('❌ Fleet Service - Error finding trucks:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
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

    // Safely update only provided fields
    const allowedFields = [
      'plateNumber',
      'vin',
      'make',
      'model',
      'year',
      'color',
      'fuelType',
      'capacityWeight',
      'capacityVolume',
      'maxLength',
      'maxWidth',
      'maxHeight',
      'truckType',
      'trailerType',
      'registrationNumber',
      'registrationExpiry',
      'insurancePolicy',
      'insuranceExpiry',
      'roadworthyCertExpiry',
      'status',
      'hasRefrigeration',
      'hasLiftGate',
      'hasGps',
      'hasHazmatPermit',
      'mileage',
      'fuelEfficiency',
      'isActive',
    ];

    // Only update fields that are provided and allowed
    allowedFields.forEach((field) => {
      if (
        updateTruckDto[field] !== undefined &&
        updateTruckDto[field] !== null
      ) {
        // Handle date strings - convert to Date objects if needed
        if (
          [
            'registrationExpiry',
            'insuranceExpiry',
            'roadworthyCertExpiry',
          ].includes(field)
        ) {
          truck[field] = updateTruckDto[field]
            ? new Date(updateTruckDto[field])
            : null;
        } else {
          truck[field] = updateTruckDto[field];
        }
      }
    });

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

      // Check if user with email already exists
      let driverUser = await this.userRepository.findOne({
        where: { email: createDriverDto.email, tenantId },
      });

      let driverUserId: string;

      if (driverUser) {
        // User exists, check if they're already a driver
        const existingDriverForUser = await this.driverRepository.findOne({
          where: { userId: driverUser.id },
        });

        if (existingDriverForUser) {
          throw new ConflictException(
            `A driver account already exists for email ${createDriverDto.email}`,
          );
        }

        driverUserId = driverUser.id;

        // Update user role to DRIVER if not already
        if (driverUser.role !== UserRole.DRIVER) {
          driverUser.role = UserRole.DRIVER;
          await this.userRepository.save(driverUser);
        }

        // Update or create user profile
        let userProfile = await this.userProfileRepository.findOne({
          where: { userId: driverUserId },
        });
        if (userProfile) {
          userProfile.firstName = createDriverDto.firstName;
          userProfile.lastName = createDriverDto.lastName;
          await this.userProfileRepository.save(userProfile);
        } else {
          userProfile = this.userProfileRepository.create({
            userId: driverUserId,
            tenantId: tenantId, // Add tenantId to user profile
            firstName: createDriverDto.firstName,
            lastName: createDriverDto.lastName,
          });
          await this.userProfileRepository.save(userProfile);
        }

        // Generate password setup token and send email
        // Check if user needs password setup (status is PENDING_VERIFICATION or no password set)
        const needsPasswordSetup =
          driverUser.status === UserStatus.PENDING_VERIFICATION ||
          !driverUser.passwordHash;

        if (needsPasswordSetup) {
          this.logger.log('👤 Existing user needs password setup, generating token...');
          
          // Generate password setup token
          const token = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

          // Invalidate any existing tokens for this email
          await this.passwordResetTokenRepository.update(
            { email: createDriverDto.email.trim().toLowerCase(), used: false },
            { used: true },
          );

          const passwordSetupToken = this.passwordResetTokenRepository.create({
            email: createDriverDto.email.trim().toLowerCase(),
            token,
            expiresAt,
            used: false,
          });
          await this.passwordResetTokenRepository.save(passwordSetupToken);

          // Send password setup email
          this.logger.log('📧 ========== EMAIL SENDING PROCESS START (EXISTING USER) ==========');
          this.logger.log('📧 Sending password setup email to existing user...');
          
          const normalizedEmail = createDriverDto.email.trim().toLowerCase();
          
          this.logger.log('📧 Email details:', {
            originalEmail: createDriverDto.email,
            normalizedEmail: normalizedEmail,
            firstName: createDriverDto.firstName,
            lastName: createDriverDto.lastName,
            token: token.substring(0, 10) + '...',
          });
          this.logger.log(`📧 EmailService instance: ${this.emailService ? 'EXISTS' : 'MISSING'}`);
          
          try {
            if (!this.emailService) {
              throw new Error('EmailService is not injected properly');
            }
            
            this.logger.log('📧 Calling emailService.sendDriverPasswordSetupEmail...');
            this.logger.log(`📧 Email address being sent to: ${normalizedEmail}`);
            
            await this.emailService.sendDriverPasswordSetupEmail(
              normalizedEmail,
              createDriverDto.firstName,
              createDriverDto.lastName,
              token,
            );
            
            this.logger.log(`✅ Password setup email sent successfully to: ${normalizedEmail}`);
            this.logger.log(`✅ Check the inbox (and spam folder) for: ${normalizedEmail}`);
          } catch (emailError: any) {
            // Log error but don't fail driver creation
            this.logger.error('❌ ========== EMAIL SENDING FAILED ==========');
            this.logger.error(`❌ Failed to send password setup email: ${emailError?.message || emailError}`);
            this.logger.error(`❌ Email error message: ${emailError?.message}`);
            this.logger.error(`❌ Email error stack: ${emailError?.stack}`);
            this.logger.error(`❌ Email error details: ${JSON.stringify(emailError, null, 2)}`);
            this.logger.warn(
              '⚠️ Driver created successfully but email NOT sent. Driver can still set password using the token.',
            );
            this.logger.warn('⚠️ Please check SMTP configuration in .env file');
            this.logger.error('❌ ========== END EMAIL ERROR ==========');
            // Continue with driver creation even if email fails
          }
          this.logger.log('📧 ========== EMAIL SENDING PROCESS END ==========');
        } else {
          const normalizedEmail = createDriverDto.email.trim().toLowerCase();
          this.logger.log(`👤 User ${normalizedEmail} already has password set, skipping email`);
        }
      } else {
        // Create new user for driver
        console.log('👤 Creating user account for driver...');
        console.log('👤 Driver email:', createDriverDto.email);
        console.log('👤 Driver phone:', createDriverDto.phone);
        
        // Validate email is provided
        if (!createDriverDto.email || createDriverDto.email.trim() === '') {
          throw new BadRequestException(
            'Email is required to create a driver account. Please provide a valid email address.',
          );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(createDriverDto.email)) {
          throw new BadRequestException(
            'Invalid email format. Please provide a valid email address.',
          );
        }
        
        // Generate temporary password (will be replaced when driver sets password)
        const tempPassword = crypto.randomBytes(32).toString('hex');
        const tempPasswordHash = await bcrypt.hash(tempPassword, 12);

        driverUser = this.userRepository.create({
          email: createDriverDto.email.trim().toLowerCase(), // Normalize email
          phone: createDriverDto.phone,
          passwordHash: tempPasswordHash,
          role: UserRole.DRIVER,
          status: UserStatus.PENDING_VERIFICATION, // Will be activated after password setup
          tenantId,
        });

        driverUser = await this.userRepository.save(driverUser);
        driverUserId = driverUser.id;

        // Create user profile
        const userProfile = this.userProfileRepository.create({
          userId: driverUserId,
          tenantId: tenantId, // Add tenantId to user profile
          firstName: createDriverDto.firstName,
          lastName: createDriverDto.lastName,
        });
        await this.userProfileRepository.save(userProfile);

        // Generate password setup token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

        const passwordSetupToken = this.passwordResetTokenRepository.create({
          email: createDriverDto.email,
          token,
          expiresAt,
          used: false,
        });
        await this.passwordResetTokenRepository.save(passwordSetupToken);

        // Send password setup email (non-blocking - don't fail driver creation if email fails)
        this.logger.log('📧 ========== EMAIL SENDING PROCESS START ==========');
        this.logger.log('📧 Sending password setup email...');
        
        // Normalize email (already validated above)
        const normalizedEmail = createDriverDto.email.trim().toLowerCase();
        
        this.logger.log('📧 Email details:', {
          originalEmail: createDriverDto.email,
          normalizedEmail: normalizedEmail,
          firstName: createDriverDto.firstName,
          lastName: createDriverDto.lastName,
          token: token.substring(0, 10) + '...',
        });
        this.logger.log(`📧 EmailService instance: ${this.emailService ? 'EXISTS' : 'MISSING'}`);
        
        try {
          if (!this.emailService) {
            throw new Error('EmailService is not injected properly');
          }
          
          this.logger.log('📧 Calling emailService.sendDriverPasswordSetupEmail...');
          this.logger.log(`📧 Email address being sent to: ${normalizedEmail}`);
          
          await this.emailService.sendDriverPasswordSetupEmail(
            normalizedEmail,
            createDriverDto.firstName,
            createDriverDto.lastName,
            token,
          );
          
          this.logger.log(`✅ Password setup email sent successfully to: ${normalizedEmail}`);
          this.logger.log(`✅ Check the inbox (and spam folder) for: ${normalizedEmail}`);
        } catch (emailError: any) {
          // Log error but don't fail driver creation
          this.logger.error('❌ ========== EMAIL SENDING FAILED ==========');
          this.logger.error(`❌ Failed to send password setup email: ${emailError?.message || emailError}`);
          this.logger.error(`❌ Email error message: ${emailError?.message}`);
          this.logger.error(`❌ Email error stack: ${emailError?.stack}`);
          this.logger.error(`❌ Email error details: ${JSON.stringify(emailError, null, 2)}`);
          this.logger.warn(
            '⚠️ Driver created successfully but email NOT sent. Driver can still set password using the token.',
          );
          this.logger.warn('⚠️ Please check SMTP configuration in .env file');
          this.logger.error('❌ ========== END EMAIL ERROR ==========');
          // Continue with driver creation even if email fails
        }
        this.logger.log('📧 ========== EMAIL SENDING PROCESS END ==========');
      }

      // Create driver entity
      // Convert ISO date strings to Date objects for database
      const convertToDate = (dateValue: string | Date | undefined): Date | undefined => {
        if (!dateValue) return undefined;
        // If it's already a Date object, return it
        if (dateValue instanceof Date) return dateValue;
        // If it's a string, parse it
        if (typeof dateValue === 'string') {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) {
            this.logger.warn(`⚠️ Invalid date string: ${dateValue}`);
            return undefined;
          }
          return date;
        }
        return undefined;
      };

      // Validate required date fields
      const dateOfBirthDate = convertToDate(createDriverDto.dateOfBirth);
      const licenseIssueDateDate = convertToDate(createDriverDto.licenseIssueDate);
      const licenseExpiryDate = convertToDate(createDriverDto.licenseExpiry);
      const hireDateDate = convertToDate(createDriverDto.hireDate);

      if (!dateOfBirthDate) {
        throw new BadRequestException(
          `dateOfBirth is required and must be a valid date. Received: ${createDriverDto.dateOfBirth}`,
        );
      }
      if (!licenseIssueDateDate) {
        throw new BadRequestException(
          `licenseIssueDate is required and must be a valid date. Received: ${createDriverDto.licenseIssueDate}`,
        );
      }
      if (!licenseExpiryDate) {
        throw new BadRequestException(
          `licenseExpiry is required and must be a valid date. Received: ${createDriverDto.licenseExpiry}`,
        );
      }
      if (!hireDateDate) {
        throw new BadRequestException(
          `hireDate is required and must be a valid date. Received: ${createDriverDto.hireDate}`,
        );
      }

      // Log the data being saved for debugging
      this.logger.log('💾 Creating driver with data:', {
        firstName: createDriverDto.firstName,
        lastName: createDriverDto.lastName,
        email: createDriverDto.email,
        phone: createDriverDto.phone,
        dateOfBirth: dateOfBirthDate,
        licenseNumber: createDriverDto.licenseNumber,
        licenseIssueDate: licenseIssueDateDate,
        licenseExpiry: licenseExpiryDate,
        hireDate: hireDateDate,
        userId: driverUserId,
        employerId: userId,
        tenantId,
      });

      const driver = this.driverRepository.create({
        ...createDriverDto,
        // Convert date strings to Date objects
        dateOfBirth: dateOfBirthDate,
        licenseIssueDate: licenseIssueDateDate,
        licenseExpiry: licenseExpiryDate,
        hireDate: hireDateDate,
        terminationDate: createDriverDto.terminationDate ? convertToDate(createDriverDto.terminationDate) : undefined,
        medicalCertExpiry: createDriverDto.medicalCertExpiry ? convertToDate(createDriverDto.medicalCertExpiry) : undefined,
        drugTestDate: createDriverDto.drugTestDate ? convertToDate(createDriverDto.drugTestDate) : undefined,
        backgroundCheckDate: createDriverDto.backgroundCheckDate ? convertToDate(createDriverDto.backgroundCheckDate) : undefined,
        trainingCompletionDate: createDriverDto.trainingCompletionDate ? convertToDate(createDriverDto.trainingCompletionDate) : undefined,
        userId: driverUserId,
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
      console.log('✅ Driver user account ID:', driverUserId);

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
        if (
          detail.includes('licenseNumber') ||
          detail.includes('license_number')
        ) {
          throw new ConflictException(
            'A driver with this license number already exists',
          );
        }
        if (detail.includes('email')) {
          throw new ConflictException(
            'A driver with this email already exists',
          );
        }
        throw new ConflictException(
          'A driver with these details already exists',
        );
      }

      if (error.code === '22001') {
        // Data too long
        throw new BadRequestException(
          'One or more fields exceed maximum length',
        );
      }

      if (error.code === '23502') {
        // Not null violation - extract the column name from the error message
        const errorMessage = error.message || error.toString() || '';
        this.logger.error(`❌ Database constraint violation (23502): ${errorMessage}`);
        this.logger.error(`❌ Full error object:`, JSON.stringify(error, null, 2));
        
        // Try multiple patterns to extract column name
        let columnName = 'unknown';
        const patterns = [
          /column "(\w+)" violates not-null constraint/i,
          /null value in column "(\w+)" violates not-null constraint/i,
          /column "(\w+)" of relation "(\w+)" violates not-null constraint/i,
          /"(\w+)" violates not-null/i,
        ];
        
        for (const pattern of patterns) {
          const match = errorMessage.match(pattern);
          if (match && match[1]) {
            columnName = match[1];
            break;
          }
        }
        
        // Also check error.detail if available
        if (error.detail) {
          this.logger.error(`❌ Error detail: ${error.detail}`);
          const detailMatch = error.detail.match(/column "(\w+)"|"(\w+)"/i);
          if (detailMatch && (detailMatch[1] || detailMatch[2])) {
            columnName = detailMatch[1] || detailMatch[2];
          }
        }
        
        this.logger.error(`❌ Extracted column name: ${columnName}`);
        throw new BadRequestException(
          `Required field '${columnName}' is missing or null. Please provide a value for this field. Error details: ${errorMessage}`,
        );
      }

      // Generic error
      throw new InternalServerErrorException({
        message: 'Failed to create driver',
        error: error.message || 'An unexpected error occurred',
        details:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  /**
   * Calculate years of experience from hire date or license issue date
   */
  private calculateExperience(driver: Driver): number {
    let experience = 0;
    const now = new Date();
    
    if (driver.hireDate) {
      const hireDate = new Date(driver.hireDate);
      const diffTime = Math.abs(now.getTime() - hireDate.getTime());
      const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
      experience = Math.floor(diffYears);
    } else if (driver.licenseIssueDate) {
      // Fallback to license issue date if hire date is not available
      const licenseDate = new Date(driver.licenseIssueDate);
      const diffTime = Math.abs(now.getTime() - licenseDate.getTime());
      const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
      experience = Math.floor(diffYears);
    }
    
    return Math.max(0, experience); // Ensure non-negative
  }

  async findAllDrivers(
    tenantId: string,
    userId?: string,
    filters?: any,
    userRole?: string,
  ): Promise<Driver[]> {
    console.log('📊 Fleet Service - findAllDrivers called with:');
    console.log('  tenantId:', tenantId);
    console.log('  userId:', userId);
    console.log('  userRole:', userRole);
    console.log('  filters:', filters);

    // Explicitly use the drivers table to ensure we're querying the correct table
    const query = this.driverRepository
      .createQueryBuilder('driver')
      .select('driver') // Explicitly select from driver entity
      .where('driver.tenantId = :tenantId', { tenantId })
      .andWhere('driver.deletedAt IS NULL'); // Exclude soft-deleted drivers
    
    console.log('  🔍 Query builder initialized with driverRepository');
    console.log('  🔍 Repository target:', this.driverRepository.target);

    // Only filter by employerId for non-admin roles (truck owners should only see their drivers)
    // Tenant admins and admins should see all drivers in their tenant
    const normalizedRole = userRole ? String(userRole).toUpperCase().trim() : '';
    const isAdminRole = normalizedRole === 'TENANT_ADMIN' || 
                        normalizedRole === 'ADMIN' || 
                        normalizedRole === 'SUPER_ADMIN';
    
    console.log('  🔍 Role check:', { 
      userRole, 
      normalizedRole, 
      isAdminRole, 
      userId,
      willFilterByEmployer: userId && !isAdminRole
    });
    
    if (userId && !isAdminRole) {
      console.log('  🔍 Filtering by employerId:', userId);
      query.andWhere('driver.employerId = :userId', { userId });
    } else {
      if (isAdminRole) {
        console.log('  ✅ Admin role detected - showing all drivers in tenant (no employerId filter)');
      } else {
        console.log('  ⚠️ No userId provided - showing all drivers in tenant');
      }
    }

    // Log the SQL query for debugging - get the actual SQL that will be executed
    const sql = query.getSql();
    const queryString = query.getQuery();
    const parameters = query.getParameters();
    
    console.log('  📝 ========== SQL QUERY DEBUG ==========');
    console.log('  📝 SQL Query (getSql):', sql);
    console.log('  📝 SQL Query (getQuery):', queryString);
    console.log('  📝 Query Parameters:', JSON.stringify(parameters, null, 2));
    
    // Build the full SQL with parameters for debugging
    let fullSql = sql;
    Object.keys(parameters).forEach(key => {
      const value = parameters[key];
      const paramValue = typeof value === 'string' ? `'${value}'` : value;
      fullSql = fullSql.replace(`:${key}`, paramValue);
    });
    console.log('  📝 Full SQL with parameters:', fullSql);
    
    // Verify the query is selecting from drivers table
    const sqlLower = sql.toLowerCase();
    if (sqlLower.includes('from trucks') || sqlLower.includes('from "trucks"')) {
      console.error('  ❌ ERROR: SQL query is selecting from TRUCKS table instead of DRIVERS!');
      console.error('  ❌ This is wrong! The query should select from "drivers" table.');
    } else if (sqlLower.includes('from drivers') || sqlLower.includes('from "drivers"')) {
      console.log('  ✅ SQL query correctly references DRIVERS table');
    } else {
      console.warn('  ⚠️ WARNING: Could not determine table name from SQL query');
      console.warn('  ⚠️ SQL:', sql);
    }
    console.log('  📝 ======================================');
    
    // Also check raw count before applying filters - try both with and without deletedAt check
    const rawCountWithDeleted = await this.driverRepository
      .createQueryBuilder('driver')
      .where('driver.tenantId = :tenantId', { tenantId })
      .getCount();
    console.log(`  📊 Raw driver count (including deleted) for tenant ${tenantId}: ${rawCountWithDeleted}`);
    
    const rawCount = await this.driverRepository
      .createQueryBuilder('driver')
      .where('driver.tenantId = :tenantId', { tenantId })
      .andWhere('driver.deletedAt IS NULL')
      .getCount();
    console.log(`  📊 Raw driver count (excluding deleted) for tenant ${tenantId}: ${rawCount}`);
    
    // Also try a direct find to see what drivers exist
    const directDrivers = await this.driverRepository
      .createQueryBuilder('driver')
      .where('driver.tenantId = :tenantId', { tenantId })
      .andWhere('driver.deletedAt IS NULL')
      .take(5)
      .getMany();
    console.log(`  🔍 Direct find returned ${directDrivers.length} drivers`);
    if (directDrivers.length > 0) {
      directDrivers.forEach((driver, index) => {
        console.log(`  🔍 Driver ${index + 1}:`, {
          id: driver.id,
          name: `${driver.firstName} ${driver.lastName}`,
          tenantId: driver.tenantId,
          deletedAt: driver.deletedAt,
          employerId: driver.employerId,
        });
      });
    } else {
      // Try without deletedAt filter to see if they're soft-deleted
      const allDrivers = await this.driverRepository
        .createQueryBuilder('driver')
        .where('driver.tenantId = :tenantId', { tenantId })
        .take(5)
        .getMany();
      console.log(`  ⚠️ Found ${allDrivers.length} drivers (including deleted) for tenant ${tenantId}`);
      if (allDrivers.length > 0) {
        allDrivers.forEach((driver, index) => {
          console.log(`  ⚠️ Driver ${index + 1} (may be deleted):`, {
            id: driver.id,
            name: `${driver.firstName} ${driver.lastName}`,
            tenantId: driver.tenantId,
            deletedAt: driver.deletedAt,
          });
        });
      }
    }

    // Apply filters
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      query.andWhere(
        '(LOWER(driver.firstName) LIKE :search OR LOWER(driver.lastName) LIKE :search OR LOWER(driver.licenseNumber) LIKE :search)',
        { search: `%${searchLower}%` },
      );
    }

    if (filters?.status) {
      query.andWhere('driver.status = :status', { status: filters.status });
    }

    if (filters?.location) {
      const locationLower = filters.location.toLowerCase();
      query.andWhere('LOWER(driver.currentLocation) LIKE :location', {
        location: `%${locationLower}%`,
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
    
    console.log(`  📊 Query returned ${drivers.length} drivers`);
    if (drivers.length > 0) {
      console.log('  📋 Driver IDs found:', drivers.map(d => d.id));
      console.log('  📋 Driver names:', drivers.map(d => `${d.firstName} ${d.lastName}`));
    }

    // Calculate experience for each driver and add it to the response
    const driversWithExperience = drivers.map((driver) => {
      // Add experience as a computed property
      return {
        ...driver,
        experience: this.calculateExperience(driver),
      };
    });

    // Log for debugging
    console.log('📊 findAllDrivers - Total drivers:', driversWithExperience.length);
    console.log(
      '📊 Drivers with currentTruckId:',
      driversWithExperience.filter((d) => d.currentTruckId).length,
    );
    driversWithExperience.forEach((driver) => {
      if (driver.currentTruckId) {
        console.log(
          `  - Driver ${driver.firstName} ${driver.lastName} has currentTruckId: ${driver.currentTruckId}, experience: ${driver.experience} years`,
        );
      }
    });

    return driversWithExperience;
  }

  async findOneDriver(id: string, tenantId: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id, tenantId },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Add experience as a computed property
    return {
      ...driver,
      experience: this.calculateExperience(driver),
    } as Driver & { experience: number };
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
            throw new ConflictException(
              'Driver is already assigned to this truck',
            );
          }
          // If currentTruckId matches but not in array, continue (might be stale data)
        } else {
          // Driver is assigned to a different truck
          const currentTruck = await this.truckRepository.findOne({
            where: { id: driver.currentTruckId, tenantId },
          });
          const currentTruckPlate =
            currentTruck?.plateNumber || driver.currentTruckId;
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
          const otherTruckPlates = otherTrucks
            .map((t) => t.plateNumber)
            .join(', ');
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
      console.log(
        '📋 Assigned drivers array:',
        JSON.stringify(truck.assignedDrivers, null, 2),
      );

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
        console.log(
          '✅ Saved truck assigned drivers:',
          JSON.stringify(savedTruck?.assignedDrivers, null, 2),
        );

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
      console.error(
        '❌ Wrapping error as InternalServerErrorException:',
        errorMsg,
      );
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
            console.log(
              `🧹 Cleaning up orphaned driver assignment from truck ${otherTruck.id}`,
            );
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
      console.error(
        '❌ Wrapping error as InternalServerErrorException:',
        errorMsg,
      );
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

  async updateTruckMaintenance(
    truckId: string,
    maintenanceId: string,
    maintenanceData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    const truck = await this.findOneTruck(truckId, tenantId);

    if (!truck.maintenanceAlerts || truck.maintenanceAlerts.length === 0) {
      throw new NotFoundException('Maintenance record not found');
    }

    const maintenanceIndex = truck.maintenanceAlerts.findIndex(
      (m: any) => m.id === maintenanceId,
    );

    if (maintenanceIndex === -1) {
      throw new NotFoundException('Maintenance record not found');
    }

    const existingMaintenance = truck.maintenanceAlerts[maintenanceIndex];
    const updatedMaintenance = {
      ...existingMaintenance,
      ...maintenanceData,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    truck.maintenanceAlerts[maintenanceIndex] = updatedMaintenance;
    await this.truckRepository.save(truck);

    return updatedMaintenance;
  }

  async deleteTruckMaintenance(
    truckId: string,
    maintenanceId: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    try {
      const truck = await this.findOneTruck(truckId, tenantId);

      if (!truck.maintenanceAlerts || truck.maintenanceAlerts.length === 0) {
        throw new NotFoundException('Maintenance record not found');
      }

      const maintenanceIndex = truck.maintenanceAlerts.findIndex(
        (m: any) => m.id === maintenanceId,
      );

      if (maintenanceIndex === -1) {
        throw new NotFoundException('Maintenance record not found');
      }

      truck.maintenanceAlerts.splice(maintenanceIndex, 1);
      await this.truckRepository.save(truck);
    } catch (error) {
      console.error('❌ Error in deleteTruckMaintenance:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete maintenance record: ${error.message}`,
      );
    }
  }

  async getTruckInspections(truckId: string, tenantId: string): Promise<any[]> {
    const truck = await this.findOneTruck(truckId, tenantId);
    return truck.inspectionAlerts || [];
  }

  async addTruckInspection(
    truckId: string,
    inspectionData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    try {
      const truck = await this.findOneTruck(truckId, tenantId);

      if (!truck.inspectionAlerts) {
        truck.inspectionAlerts = [];
      }

      // Convert date strings to Date objects if needed
      const processedData: any = { ...inspectionData };
      if (
        processedData.inspectionDate &&
        typeof processedData.inspectionDate === 'string'
      ) {
        processedData.inspectionDate = new Date(processedData.inspectionDate);
      }
      if (
        processedData.nextInspectionDate &&
        typeof processedData.nextInspectionDate === 'string'
      ) {
        processedData.nextInspectionDate = new Date(
          processedData.nextInspectionDate,
        );
      }

      const inspection = {
        id: 'insp-' + Date.now(),
        ...processedData,
        createdAt: new Date(),
        createdBy: userId,
      };

      truck.inspectionAlerts.push(inspection);
      await this.truckRepository.save(truck);

      return inspection;
    } catch (error) {
      console.error('❌ Error in addTruckInspection:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        stack: error?.stack,
      });
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to add inspection: ${error.message}`,
      );
    }
  }

  async updateTruckInspection(
    truckId: string,
    inspectionId: string,
    inspectionData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    try {
      const truck = await this.findOneTruck(truckId, tenantId);

      if (!truck.inspectionAlerts || truck.inspectionAlerts.length === 0) {
        throw new NotFoundException('Inspection record not found');
      }

      const inspectionIndex = truck.inspectionAlerts.findIndex(
        (i: any) => i.id === inspectionId,
      );

      if (inspectionIndex === -1) {
        throw new NotFoundException('Inspection record not found');
      }

      // Convert date strings to Date objects if needed
      const processedData: any = { ...inspectionData };
      if (
        processedData.inspectionDate &&
        typeof processedData.inspectionDate === 'string'
      ) {
        processedData.inspectionDate = new Date(processedData.inspectionDate);
      }
      if (
        processedData.nextInspectionDate &&
        typeof processedData.nextInspectionDate === 'string'
      ) {
        processedData.nextInspectionDate = new Date(
          processedData.nextInspectionDate,
        );
      }

      const existingInspection = truck.inspectionAlerts[inspectionIndex];
      const updatedInspection = {
        ...existingInspection,
        ...processedData,
        updatedAt: new Date(),
        updatedBy: userId,
      };

      truck.inspectionAlerts[inspectionIndex] = updatedInspection;
      await this.truckRepository.save(truck);

      return updatedInspection;
    } catch (error) {
      console.error('❌ Error in updateTruckInspection:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update inspection: ${error.message}`,
      );
    }
  }

  async deleteTruckInspection(
    truckId: string,
    inspectionId: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    try {
      const truck = await this.findOneTruck(truckId, tenantId);

      if (!truck.inspectionAlerts || truck.inspectionAlerts.length === 0) {
        throw new NotFoundException('Inspection record not found');
      }

      const inspectionIndex = truck.inspectionAlerts.findIndex(
        (i: any) => i.id === inspectionId,
      );

      if (inspectionIndex === -1) {
        throw new NotFoundException('Inspection record not found');
      }

      truck.inspectionAlerts.splice(inspectionIndex, 1);
      await this.truckRepository.save(truck);
    } catch (error) {
      console.error('❌ Error in deleteTruckInspection:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete inspection record: ${error.message}`,
      );
    }
  }

  async getTruckInsurance(truckId: string, tenantId: string): Promise<any[]> {
    const truck = await this.findOneTruck(truckId, tenantId);
    return truck.insuranceAlerts || [];
  }

  async addTruckInsurance(
    truckId: string,
    insuranceData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    try {
      const truck = await this.findOneTruck(truckId, tenantId);

      if (!truck.insuranceAlerts) {
        truck.insuranceAlerts = [];
      }

      // Convert date strings to Date objects if needed
      const processedData: any = { ...insuranceData };
      if (
        processedData.startDate &&
        typeof processedData.startDate === 'string'
      ) {
        processedData.startDate = new Date(processedData.startDate);
      }
      if (processedData.endDate && typeof processedData.endDate === 'string') {
        processedData.endDate = new Date(processedData.endDate);
      }

      const insurance = {
        id: 'ins-' + Date.now(),
        ...processedData,
        createdAt: new Date(),
        createdBy: userId,
      };

      truck.insuranceAlerts.push(insurance);
      await this.truckRepository.save(truck);

      return insurance;
    } catch (error) {
      console.error('❌ Error in addTruckInsurance:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        stack: error?.stack,
      });
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to add insurance: ${error.message}`,
      );
    }
  }

  async updateTruckInsurance(
    truckId: string,
    insuranceId: string,
    insuranceData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    try {
      const truck = await this.findOneTruck(truckId, tenantId);

      if (!truck.insuranceAlerts || truck.insuranceAlerts.length === 0) {
        throw new NotFoundException('Insurance record not found');
      }

      const insuranceIndex = truck.insuranceAlerts.findIndex(
        (i: any) => i.id === insuranceId,
      );

      if (insuranceIndex === -1) {
        throw new NotFoundException('Insurance record not found');
      }

      // Convert date strings to Date objects if needed
      const processedData: any = { ...insuranceData };
      if (
        processedData.startDate &&
        typeof processedData.startDate === 'string'
      ) {
        processedData.startDate = new Date(processedData.startDate);
      }
      if (processedData.endDate && typeof processedData.endDate === 'string') {
        processedData.endDate = new Date(processedData.endDate);
      }

      const existingInsurance = truck.insuranceAlerts[insuranceIndex];
      const updatedInsurance = {
        ...existingInsurance,
        ...processedData,
        updatedAt: new Date(),
        updatedBy: userId,
      };

      truck.insuranceAlerts[insuranceIndex] = updatedInsurance;
      await this.truckRepository.save(truck);

      return updatedInsurance;
    } catch (error) {
      console.error('❌ Error in updateTruckInsurance:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update insurance: ${error.message}`,
      );
    }
  }

  async deleteTruckInsurance(
    truckId: string,
    insuranceId: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    try {
      const truck = await this.findOneTruck(truckId, tenantId);

      if (!truck.insuranceAlerts || truck.insuranceAlerts.length === 0) {
        throw new NotFoundException('Insurance record not found');
      }

      const insuranceIndex = truck.insuranceAlerts.findIndex(
        (i: any) => i.id === insuranceId,
      );

      if (insuranceIndex === -1) {
        throw new NotFoundException('Insurance record not found');
      }

      truck.insuranceAlerts.splice(insuranceIndex, 1);
      await this.truckRepository.save(truck);
    } catch (error) {
      console.error('❌ Error in deleteTruckInsurance:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete insurance record: ${error.message}`,
      );
    }
  }

  async getTruckFuel(truckId: string, tenantId: string): Promise<any[]> {
    const truck = await this.findOneTruck(truckId, tenantId);
    return truck.fuelAlerts || [];
  }

  async addTruckFuel(
    truckId: string,
    fuelData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    try {
      const truck = await this.findOneTruck(truckId, tenantId);

      if (!truck.fuelAlerts) {
        truck.fuelAlerts = [];
      }

      // Convert date strings to Date objects if needed
      const processedData: any = { ...fuelData };
      if (processedData.date && typeof processedData.date === 'string') {
        processedData.date = new Date(processedData.date);
      }

      const fuel = {
        id: 'fuel-' + Date.now(),
        ...processedData,
        createdAt: new Date(),
        createdBy: userId,
      };

      truck.fuelAlerts.push(fuel);
      await this.truckRepository.save(truck);

      return fuel;
    } catch (error) {
      console.error('❌ Error in addTruckFuel:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        stack: error?.stack,
      });
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to add fuel record: ${error.message}`,
      );
    }
  }

  async updateTruckFuel(
    truckId: string,
    fuelId: string,
    fuelData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    try {
      const truck = await this.findOneTruck(truckId, tenantId);

      if (!truck.fuelAlerts || truck.fuelAlerts.length === 0) {
        throw new NotFoundException('Fuel record not found');
      }

      const fuelIndex = truck.fuelAlerts.findIndex((f: any) => f.id === fuelId);

      if (fuelIndex === -1) {
        throw new NotFoundException('Fuel record not found');
      }

      // Convert date strings to Date objects if needed
      const processedData: any = { ...fuelData };
      if (processedData.date && typeof processedData.date === 'string') {
        processedData.date = new Date(processedData.date);
      }

      const existingFuel = truck.fuelAlerts[fuelIndex];
      const updatedFuel = {
        ...existingFuel,
        ...processedData,
        updatedAt: new Date(),
        updatedBy: userId,
      };

      truck.fuelAlerts[fuelIndex] = updatedFuel;
      await this.truckRepository.save(truck);

      return updatedFuel;
    } catch (error) {
      console.error('❌ Error in updateTruckFuel:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update fuel record: ${error.message}`,
      );
    }
  }

  async deleteTruckFuel(
    truckId: string,
    fuelId: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    try {
      const truck = await this.findOneTruck(truckId, tenantId);

      if (!truck.fuelAlerts || truck.fuelAlerts.length === 0) {
        throw new NotFoundException('Fuel record not found');
      }

      const fuelIndex = truck.fuelAlerts.findIndex((f: any) => f.id === fuelId);

      if (fuelIndex === -1) {
        throw new NotFoundException('Fuel record not found');
      }

      truck.fuelAlerts.splice(fuelIndex, 1);
      await this.truckRepository.save(truck);
    } catch (error) {
      console.error('❌ Error in deleteTruckFuel:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete fuel record: ${error.message}`,
      );
    }
  }

  async getTruckTires(truckId: string, tenantId: string): Promise<any[]> {
    const truck = await this.findOneTruck(truckId, tenantId);
    return truck.tireAlerts || [];
  }

  async addTruckTire(
    truckId: string,
    tireData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    try {
      const truck = await this.findOneTruck(truckId, tenantId);

      if (!truck.tireAlerts) {
        truck.tireAlerts = [];
      }

      // Convert date strings to Date objects if needed
      const processedData: any = { ...tireData };
      if (
        processedData.installationDate &&
        typeof processedData.installationDate === 'string'
      ) {
        processedData.installationDate = new Date(
          processedData.installationDate,
        );
      }
      if (
        processedData.replacementDate &&
        typeof processedData.replacementDate === 'string'
      ) {
        processedData.replacementDate = new Date(processedData.replacementDate);
      }
      if (
        processedData.rotationHistory &&
        Array.isArray(processedData.rotationHistory)
      ) {
        processedData.rotationHistory = processedData.rotationHistory.map(
          (date: any) => (typeof date === 'string' ? new Date(date) : date),
        );
      }

      const tire = {
        id: 'tire-' + Date.now(),
        ...processedData,
        createdAt: new Date(),
        createdBy: userId,
      };

      truck.tireAlerts.push(tire);
      await this.truckRepository.save(truck);

      return tire;
    } catch (error) {
      console.error('❌ Error in addTruckTire:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        stack: error?.stack,
      });
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to add tire record: ${error.message}`,
      );
    }
  }

  async updateTruckTire(
    truckId: string,
    tireId: string,
    tireData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    try {
      const truck = await this.findOneTruck(truckId, tenantId);

      if (!truck.tireAlerts || truck.tireAlerts.length === 0) {
        throw new NotFoundException('Tire record not found');
      }

      const tireIndex = truck.tireAlerts.findIndex((t: any) => t.id === tireId);

      if (tireIndex === -1) {
        throw new NotFoundException('Tire record not found');
      }

      // Convert date strings to Date objects if needed
      const processedData: any = { ...tireData };
      if (
        processedData.installationDate &&
        typeof processedData.installationDate === 'string'
      ) {
        processedData.installationDate = new Date(
          processedData.installationDate,
        );
      }
      if (
        processedData.replacementDate &&
        typeof processedData.replacementDate === 'string'
      ) {
        processedData.replacementDate = new Date(processedData.replacementDate);
      }
      if (
        processedData.rotationHistory &&
        Array.isArray(processedData.rotationHistory)
      ) {
        processedData.rotationHistory = processedData.rotationHistory.map(
          (date: any) => (typeof date === 'string' ? new Date(date) : date),
        );
      }

      const existingTire = truck.tireAlerts[tireIndex];
      const updatedTire = {
        ...existingTire,
        ...processedData,
        updatedAt: new Date(),
        updatedBy: userId,
      };

      truck.tireAlerts[tireIndex] = updatedTire;
      await this.truckRepository.save(truck);

      return updatedTire;
    } catch (error) {
      console.error('❌ Error in updateTruckTire:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update tire record: ${error.message}`,
      );
    }
  }

  async deleteTruckTire(
    truckId: string,
    tireId: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    try {
      const truck = await this.findOneTruck(truckId, tenantId);

      if (!truck.tireAlerts || truck.tireAlerts.length === 0) {
        throw new NotFoundException('Tire record not found');
      }

      const tireIndex = truck.tireAlerts.findIndex((t: any) => t.id === tireId);

      if (tireIndex === -1) {
        throw new NotFoundException('Tire record not found');
      }

      truck.tireAlerts.splice(tireIndex, 1);
      await this.truckRepository.save(truck);
    } catch (error) {
      console.error('❌ Error in deleteTruckTire:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete tire record: ${error.message}`,
      );
    }
  }

  async getTruckCompliance(truckId: string, tenantId: string): Promise<any[]> {
    const truck = await this.findOneTruck(truckId, tenantId);
    return truck.complianceAlerts || [];
  }

  async addTruckCompliance(
    truckId: string,
    complianceData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    try {
      const truck = await this.findOneTruck(truckId, tenantId);

      if (!truck.complianceAlerts) {
        truck.complianceAlerts = [];
      }

      // Convert date strings to Date objects if needed
      const processedData: any = { ...complianceData };
      if (processedData.dueDate && typeof processedData.dueDate === 'string') {
        processedData.dueDate = new Date(processedData.dueDate);
      }
      if (
        processedData.lastChecked &&
        typeof processedData.lastChecked === 'string'
      ) {
        processedData.lastChecked = new Date(processedData.lastChecked);
      }
      if (
        processedData.nextCheck &&
        typeof processedData.nextCheck === 'string'
      ) {
        processedData.nextCheck = new Date(processedData.nextCheck);
      }
      if (processedData.penalties && Array.isArray(processedData.penalties)) {
        processedData.penalties = processedData.penalties.map(
          (penalty: any) => ({
            ...penalty,
            date:
              penalty.date && typeof penalty.date === 'string'
                ? new Date(penalty.date)
                : penalty.date,
          }),
        );
      }

      const compliance = {
        id: 'comp-' + Date.now(),
        ...processedData,
        createdAt: new Date(),
        createdBy: userId,
      };

      truck.complianceAlerts.push(compliance);
      await this.truckRepository.save(truck);

      return compliance;
    } catch (error) {
      console.error('❌ Error in addTruckCompliance:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        stack: error?.stack,
      });
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to add compliance record: ${error.message}`,
      );
    }
  }

  async updateTruckCompliance(
    truckId: string,
    complianceId: string,
    complianceData: any,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    try {
      const truck = await this.findOneTruck(truckId, tenantId);

      if (!truck.complianceAlerts || truck.complianceAlerts.length === 0) {
        throw new NotFoundException('Compliance record not found');
      }

      const complianceIndex = truck.complianceAlerts.findIndex(
        (c: any) => c.id === complianceId,
      );

      if (complianceIndex === -1) {
        throw new NotFoundException('Compliance record not found');
      }

      // Convert date strings to Date objects if needed
      const processedData: any = { ...complianceData };
      if (processedData.dueDate && typeof processedData.dueDate === 'string') {
        processedData.dueDate = new Date(processedData.dueDate);
      }
      if (
        processedData.lastChecked &&
        typeof processedData.lastChecked === 'string'
      ) {
        processedData.lastChecked = new Date(processedData.lastChecked);
      }
      if (
        processedData.nextCheck &&
        typeof processedData.nextCheck === 'string'
      ) {
        processedData.nextCheck = new Date(processedData.nextCheck);
      }
      if (processedData.penalties && Array.isArray(processedData.penalties)) {
        processedData.penalties = processedData.penalties.map(
          (penalty: any) => ({
            ...penalty,
            date:
              penalty.date && typeof penalty.date === 'string'
                ? new Date(penalty.date)
                : penalty.date,
          }),
        );
      }

      const existingCompliance = truck.complianceAlerts[complianceIndex];
      const updatedCompliance = {
        ...existingCompliance,
        ...processedData,
        updatedAt: new Date(),
        updatedBy: userId,
      };

      truck.complianceAlerts[complianceIndex] = updatedCompliance;
      await this.truckRepository.save(truck);

      return updatedCompliance;
    } catch (error) {
      console.error('❌ Error in updateTruckCompliance:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update compliance record: ${error.message}`,
      );
    }
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
      const searchLower = filters.search.toLowerCase();
      query.andWhere(
        '(LOWER(route.name) LIKE :search OR LOWER(route.description) LIKE :search)',
        { search: `%${searchLower}%` },
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

    // Verify the truck exists and belongs to the tenant
    // Allow any user in the tenant to assign routes to trucks (not just the owner)
    const truck = await this.truckRepository.findOne({
      where: { id: truckId, tenantId },
    });
    if (!truck) {
      throw new NotFoundException('Truck not found or does not belong to your organization');
    }
    
    // Optional: Log if the truck owner is different from the current user (for audit purposes)
    if (truck.ownerId !== userId) {
      console.log(`ℹ️ Route assignment: User ${userId} is assigning route to truck ${truckId} owned by ${truck.ownerId}`);
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
