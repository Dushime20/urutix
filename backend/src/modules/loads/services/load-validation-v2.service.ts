import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Load, LoadStatus, CargoType } from '../../../entities/load.entity';
import {
  CreateLoadV2Dto,
  UpdateLoadV2Dto,
  CargoTypeV2,
} from '../dto/load-v2.dto';
import { User } from '../../../entities/user.entity';
import { Location } from '../../../entities/location.entity';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RouteValidation {
  isValid: boolean;
  distance: number;
  estimatedTime: number;
  tollsRequired: boolean;
  hazmatRestrictions: boolean;
  oversizeRestrictions: boolean;
}

@Injectable()
export class LoadValidationV2Service {
  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  /**
   * Comprehensive validation for load creation
   */
  async validateLoadCreation(
    createLoadDto: CreateLoadV2Dto,
    user: User,
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic field validation
    const basicValidation = this.validateBasicFields(createLoadDto);
    errors.push(...basicValidation.errors);
    warnings.push(...basicValidation.warnings);

    // Business rule validation
    const businessValidation = await this.validateBusinessRules(
      createLoadDto,
      user,
    );
    errors.push(...businessValidation.errors);
    warnings.push(...businessValidation.warnings);

    // Location validation
    const locationValidation = await this.validateLocations(
      createLoadDto.pickupLocationId,
      createLoadDto.deliveryLocationId,
    );
    errors.push(...locationValidation.errors);
    warnings.push(...locationValidation.warnings);

    // Date validation
    const dateValidation = this.validateDates(
      createLoadDto.pickupDate,
      createLoadDto.deliveryDate,
    );
    errors.push(...dateValidation.errors);
    warnings.push(...dateValidation.warnings);

    // Cargo validation
    const cargoValidation = this.validateCargoRequirements(createLoadDto);
    errors.push(...cargoValidation.errors);
    warnings.push(...cargoValidation.warnings);

    // Pricing validation
    const pricingValidation = this.validatePricing(createLoadDto);
    errors.push(...pricingValidation.errors);
    warnings.push(...pricingValidation.warnings);

    // User permission validation
    const permissionValidation = this.validateUserPermissions(user, 'create');
    errors.push(...permissionValidation.errors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validation for load updates
   */
  async validateLoadUpdate(
    load: Load,
    updateLoadDto: UpdateLoadV2Dto,
    user: User,
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if load can be updated
    const updateabilityValidation = this.validateLoadUpdateability(
      load,
      updateLoadDto,
    );
    errors.push(...updateabilityValidation.errors);
    warnings.push(...updateabilityValidation.warnings);

    // User permission validation
    const permissionValidation = this.validateUserPermissions(
      user,
      'update',
      load,
    );
    errors.push(...permissionValidation.errors);

    // Date validation if dates are being updated
    if (updateLoadDto.pickupDate || updateLoadDto.deliveryDate) {
      const dateValidation = this.validateDates(
        updateLoadDto.pickupDate || load.pickupDate.toISOString(),
        updateLoadDto.deliveryDate || load.deliveryDate.toISOString(),
      );
      errors.push(...dateValidation.errors);
      warnings.push(...dateValidation.warnings);
    }

    // Note: Location validation is now handled by the main service using the new JSON-based locations system
    // The old pickupLocationId/deliveryLocationId validation is no longer needed

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate load data for creation
   */
  async validateLoadData(createLoadDto: CreateLoadV2Dto): Promise<void> {
    const validation = await this.validateLoadCreation(
      createLoadDto,
      {} as User,
    );
    if (!validation.isValid) {
      throw new HttpException(
        validation.errors.join(', '),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Validate dates
   */
  validateDatesSimple(pickupDate: string, deliveryDate: string): void {
    const validation = this.validateDates(pickupDate, deliveryDate);
    if (!validation.isValid) {
      throw new HttpException(
        validation.errors.join(', '),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Validate locations
   */
  async validateLocationsSimple(
    pickupLocationId: string,
    deliveryLocationId: string,
  ): Promise<void> {
    const validation = await this.validateLocations(
      pickupLocationId,
      deliveryLocationId,
    );
    if (!validation.isValid) {
      throw new HttpException(
        validation.errors.join(', '),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Validate status transition
   */
  validateStatusTransitionSimple(
    currentStatus: LoadStatus,
    newStatus: LoadStatus,
  ): void {
    const validation = this.validateStatusTransition(currentStatus, newStatus);
    if (!validation.isValid) {
      throw new HttpException(
        validation.errors.join(', '),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Validate load for publishing
   */
  validateLoadForPublishingSimple(load: Load): void {
    const validation = this.validateLoadPublishingSimple(load);
    if (!validation.isValid) {
      throw new HttpException(
        validation.errors.join(', '),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Private method to validate load for publishing
   */
  private validateLoadPublishingSimple(load: Load): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields for publishing
    const requiredFields = {
      title: 'Load title',
      weight: 'Load weight',
      pickupLocationId: 'Pickup location',
      deliveryLocationId: 'Delivery location',
      pickupDate: 'Pickup date',
      deliveryDate: 'Delivery date',
      loadValue: 'Load value',
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      const value = load[field as keyof Load];
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '') ||
        (typeof value === 'number' && value <= 0)
      ) {
        errors.push(`${label} is required for publishing`);
      }
    }

    // Check if pickup date is in the future (type safe)
    if (load.pickupDate) {
      const pickupDateObj = new Date(load.pickupDate);
      const now = new Date();
      if (
        isNaN(pickupDateObj.getTime()) ||
        pickupDateObj <= now ||
        (typeof load.pickupDate === 'string' &&
          (load.pickupDate as string).trim() === '')
      ) {
        errors.push('Pickup date must be in the future');
      }
    }

    // Validate hazmat requirements
    if (load.isHazardous) {
      if (
        load.hazmatClass === undefined ||
        load.hazmatClass === null ||
        (typeof load.hazmatClass === 'string' && load.hazmatClass.trim() === '')
      ) {
        errors.push('Hazmat class is required for hazardous loads');
      }
      if (
        load.hazmatNumber === undefined ||
        load.hazmatNumber === null ||
        (typeof load.hazmatNumber === 'string' &&
          load.hazmatNumber.trim() === '')
      ) {
        errors.push('Hazmat number is required for hazardous loads');
      }
    }

    // Validate temperature requirements
    if (load.requiresRefrigeration) {
      if (
        load.temperatureMin === undefined ||
        load.temperatureMin === null ||
        load.temperatureMax === undefined ||
        load.temperatureMax === null ||
        isNaN(Number(load.temperatureMin)) ||
        isNaN(Number(load.temperatureMax))
      ) {
        errors.push('Temperature range is required for refrigerated loads');
      } else if (Number(load.temperatureMin) >= Number(load.temperatureMax)) {
        errors.push(
          'Minimum temperature must be less than maximum temperature',
        );
      }
    }

    // Check for potential issues
    if (typeof load.weight === 'number' && load.weight > 26000) {
      // Heavy load warning
      warnings.push('This is a heavy load that may require special permits');
    }

    // Calculate days to pickup safely
    let daysToPickup: number | null = null;
    if (load.pickupDate) {
      const pickupDateObj = new Date(load.pickupDate);
      if (!isNaN(pickupDateObj.getTime())) {
        daysToPickup = Math.ceil(
          (pickupDateObj.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );
      }
    }
    if (daysToPickup !== null && daysToPickup < 2) {
      warnings.push(
        'Short notice pickup - may be difficult to find available carriers',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Private validation methods

  private validateBasicFields(
    createLoadDto: CreateLoadV2Dto,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!createLoadDto.title?.trim()) {
      errors.push('Load title is required');
    }

    if (createLoadDto.weight < 100) {
      errors.push('Weight must be at least 100 kg');
    }

    if (createLoadDto.volume !== undefined && createLoadDto.volume <= 0) {
      errors.push('Volume must be greater than 0');
    }

    if (createLoadDto.loadValue <= 0) {
      errors.push('Load value must be greater than 0');
    }

    if (
      createLoadDto.offeredPrice !== undefined &&
      createLoadDto.offeredPrice <= 0
    ) {
      errors.push('Offered price must be greater than 0');
    }

    if (createLoadDto.numberOfPieces < 0) {
      errors.push('Number of pieces cannot be negative');
    }

    if (createLoadDto.numberOfPallets < 0) {
      errors.push('Number of pallets cannot be negative');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private async validateBusinessRules(
    createLoadDto: CreateLoadV2Dto,
    user: User,
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate loads (simplified check without location IDs since we're using JSON-based locations)
    const existingLoad = await this.loadRepository.findOne({
      where: {
        cargoOwnerId: user.id, // Use user.id instead of createLoadDto.cargoOwnerId
        title: createLoadDto.title,
        pickupDate: new Date(createLoadDto.pickupDate),
        status: LoadStatus.DRAFT,
      },
    });

    if (existingLoad) {
      warnings.push('Similar load already exists in draft status');
    }

    // Validate cargo type specific requirements
    if (createLoadDto.cargoType === CargoTypeV2.CHEMICALS) {
      if (!createLoadDto.requiresRefrigeration) {
        warnings.push('Chemical cargo typically requires refrigeration');
      }
    }

    if (createLoadDto.cargoType === CargoTypeV2.CHEMICALS) {
      if (!createLoadDto.isHazardous) {
        warnings.push('Chemical cargo is typically hazardous');
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private async validateLocations(
    pickupLocationId: string,
    deliveryLocationId: string,
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (pickupLocationId === deliveryLocationId) {
      errors.push('Pickup and delivery locations must be different');
    }

    try {
      const [pickupLocation, deliveryLocation] = await Promise.all([
        this.locationRepository.findOne({ where: { id: pickupLocationId } }),
        this.locationRepository.findOne({ where: { id: deliveryLocationId } }),
      ]);

      if (!pickupLocation) {
        errors.push('Pickup location not found');
      }

      if (!deliveryLocation) {
        errors.push('Delivery location not found');
      }

      // Additional location-specific validations
      if (pickupLocation && !pickupLocation.isActive) {
        errors.push('Pickup location is inactive');
      }

      if (deliveryLocation && !deliveryLocation.isActive) {
        errors.push('Delivery location is inactive');
      }
    } catch (error) {
      errors.push('Failed to validate locations');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateDates(
    pickupDate: string,
    deliveryDate: string,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const pickup = new Date(pickupDate);
    const delivery = new Date(deliveryDate);
    const now = new Date();

    if (pickup <= now) {
      errors.push('Pickup date must be in the future');
    }

    // Validate: delivery date cannot be before pickup date
    // Pickup date can be the same as delivery date (same-day delivery)
    if (delivery < pickup) {
      errors.push('Delivery date cannot be before pickup date');
    }

    // Business day warnings
    const isPickupWeekend = pickup.getDay() === 0 || pickup.getDay() === 6;
    const isDeliveryWeekend =
      delivery.getDay() === 0 || delivery.getDay() === 6;

    if (isPickupWeekend) {
      warnings.push(
        'Pickup scheduled for weekend - verify location availability',
      );
    }

    if (isDeliveryWeekend) {
      warnings.push(
        'Delivery scheduled for weekend - verify location availability',
      );
    }

    const timeDiff = delivery.getTime() - pickup.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    if (daysDiff > 30) {
      warnings.push(
        'Long delivery window - consider splitting into multiple loads',
      );
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateCargoRequirements(
    createLoadDto: CreateLoadV2Dto,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Temperature validation
    if (createLoadDto.requiresRefrigeration) {
      if (
        createLoadDto.temperatureMin === undefined ||
        createLoadDto.temperatureMax === undefined
      ) {
        errors.push('Temperature range is required for refrigerated loads');
      } else if (createLoadDto.temperatureMin >= createLoadDto.temperatureMax) {
        errors.push(
          'Minimum temperature must be less than maximum temperature',
        );
      }
    }

    // Hazmat validation
    if (createLoadDto.isHazardous) {
      if (!createLoadDto.hazmatClass) {
        errors.push('Hazmat class is required for hazardous loads');
      }
      if (!createLoadDto.hazmatNumber) {
        errors.push('Hazmat number is required for hazardous loads');
      }
    }

    // Dimension validation
    if (createLoadDto.length && createLoadDto.width && createLoadDto.height) {
      const calculatedVolume =
        createLoadDto.length * createLoadDto.width * createLoadDto.height;
      if (
        createLoadDto.volume &&
        Math.abs(calculatedVolume - createLoadDto.volume) > 0.1
      ) {
        warnings.push('Calculated volume differs from specified volume');
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validatePricing(createLoadDto: CreateLoadV2Dto): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (createLoadDto.offeredPrice && createLoadDto.loadValue) {
      const priceRatio = createLoadDto.offeredPrice / createLoadDto.loadValue;

      if (priceRatio > 0.5) {
        warnings.push('Shipping cost seems high relative to cargo value');
      }

      if (priceRatio < 0.01) {
        warnings.push('Shipping cost seems low - verify pricing');
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateUserPermissions(
    user: User,
    action: string,
    load?: Load,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const allowedRoles = {
      create: ['CARGO_OWNER', 'ADMIN', 'DISPATCHER'],
      update: ['CARGO_OWNER', 'ADMIN', 'DISPATCHER'],
      publish: ['CARGO_OWNER', 'ADMIN', 'DISPATCHER'],
    };

    if (!allowedRoles[action]?.includes(user.role)) {
      errors.push('Insufficient permissions for this action');
    }

    if (
      load &&
      action === 'update' &&
      user.role === 'CARGO_OWNER' &&
      load.cargoOwnerId !== user.id
    ) {
      errors.push('You can only update your own loads');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateLoadUpdateability(
    load: Load,
    updateLoadDto: UpdateLoadV2Dto,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if load is in a state that allows updates
    if (load.status === LoadStatus.DELIVERED) {
      errors.push('Cannot update delivered loads');
    }

    if (load.status === LoadStatus.CANCELLED) {
      errors.push('Cannot update cancelled loads');
    }

    // Warn about updating loads in transit
    if (load.status === LoadStatus.IN_TRANSIT) {
      warnings.push('Updating loads in transit may cause confusion');
    }

    // Check for critical field updates on assigned loads
    if (load.status === LoadStatus.ASSIGNED && load.assignedTruckId) {
      const criticalFields = [
        'pickupDate',
        'deliveryDate',
        'pickupLocationId',
        'deliveryLocationId',
        'weight',
      ];
      const hasCriticalChanges = Object.keys(updateLoadDto).some((field) =>
        criticalFields.includes(field),
      );

      if (hasCriticalChanges) {
        warnings.push(
          'Updating critical fields of assigned loads will notify the carrier',
        );
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateStatusTransition(
    currentStatus: LoadStatus,
    newStatus: LoadStatus,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validTransitions = {
      [LoadStatus.DRAFT]: [LoadStatus.CREATED, LoadStatus.CANCELLED],
      [LoadStatus.CREATED]: [
        LoadStatus.PUBLISHED,
        LoadStatus.ASSIGNED,
        LoadStatus.CANCELLED,
      ],
      [LoadStatus.PUBLISHED]: [
        LoadStatus.ASSIGNED,
        LoadStatus.DRAFT,
        LoadStatus.CANCELLED,
      ],
      [LoadStatus.ASSIGNED]: [
        LoadStatus.IN_TRANSIT,
        LoadStatus.PUBLISHED,
        LoadStatus.CANCELLED,
      ],
      [LoadStatus.IN_TRANSIT]: [LoadStatus.DELIVERED, LoadStatus.CANCELLED],
      [LoadStatus.DELIVERED]: [],
      [LoadStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      errors.push(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}
