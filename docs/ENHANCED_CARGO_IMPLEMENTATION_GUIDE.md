# Enhanced Cargo Recording Implementation Guide

## Database Migration for Enhanced Cargo Fields

### Migration File: `1753348152140-EnhancedCargoFields.ts`

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EnhancedCargoFields1753348152140 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add dimensional specifications
    await queryRunner.addColumn('loads', new TableColumn({
      name: 'length',
      type: 'decimal',
      precision: 8,
      scale: 2,
      isNullable: true,
      comment: 'Cargo length in meters'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'width',
      type: 'decimal',
      precision: 8,
      scale: 2,
      isNullable: true,
      comment: 'Cargo width in meters'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'height',
      type: 'decimal',
      precision: 8,
      scale: 2,
      isNullable: true,
      comment: 'Cargo height in meters'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'stackable_height',
      type: 'decimal',
      precision: 8,
      scale: 2,
      isNullable: true,
      comment: 'Stackable height in meters'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'is_stackable',
      type: 'boolean',
      default: false,
      comment: 'Whether cargo can be stacked'
    }));

    // Add temperature requirements
    await queryRunner.addColumn('loads', new TableColumn({
      name: 'temperature_min',
      type: 'decimal',
      precision: 5,
      scale: 2,
      isNullable: true,
      comment: 'Minimum temperature in Celsius'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'temperature_max',
      type: 'decimal',
      precision: 5,
      scale: 2,
      isNullable: true,
      comment: 'Maximum temperature in Celsius'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'requires_humidity_control',
      type: 'boolean',
      default: false,
      comment: 'Requires humidity control'
    }));

    // Add loading/unloading requirements
    await queryRunner.addColumn('loads', new TableColumn({
      name: 'requires_forklift',
      type: 'boolean',
      default: false,
      comment: 'Requires forklift for loading/unloading'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'requires_crane',
      type: 'boolean',
      default: false,
      comment: 'Requires crane for loading/unloading'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'requires_loading_dock',
      type: 'boolean',
      default: false,
      comment: 'Requires loading dock'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'loading_time_estimate',
      type: 'decimal',
      precision: 5,
      scale: 2,
      isNullable: true,
      comment: 'Estimated loading time in hours'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'unloading_time_estimate',
      type: 'decimal',
      precision: 5,
      scale: 2,
      isNullable: true,
      comment: 'Estimated unloading time in hours'
    }));

    // Add hazmat details
    await queryRunner.addColumn('loads', new TableColumn({
      name: 'hazmat_class',
      type: 'varchar',
      length: '50',
      isNullable: true,
      comment: 'UN hazmat classification'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'hazmat_number',
      type: 'varchar',
      length: '20',
      isNullable: true,
      comment: 'UN hazmat number'
    }));

    // Add urgency and time sensitivity
    await queryRunner.addColumn('loads', new TableColumn({
      name: 'urgency_level',
      type: 'enum',
      enum: ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'],
      default: "'NORMAL'",
      comment: 'Urgency level of the cargo'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'is_time_critical',
      type: 'boolean',
      default: false,
      comment: 'Whether cargo is time critical'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'max_transit_time',
      type: 'decimal',
      precision: 5,
      scale: 2,
      isNullable: true,
      comment: 'Maximum transit time in hours'
    }));

    // Add packaging details
    await queryRunner.addColumn('loads', new TableColumn({
      name: 'packaging_type',
      type: 'varchar',
      length: '50',
      isNullable: true,
      comment: 'Type of packaging (pallets, crates, boxes, loose)'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'number_of_pieces',
      type: 'integer',
      default: 0,
      comment: 'Number of individual pieces'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'number_of_pallets',
      type: 'integer',
      default: 0,
      comment: 'Number of pallets'
    }));

    // Add security requirements
    await queryRunner.addColumn('loads', new TableColumn({
      name: 'requires_gps_monitoring',
      type: 'boolean',
      default: false,
      comment: 'Requires GPS monitoring during transit'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'requires_temperature_monitoring',
      type: 'boolean',
      default: false,
      comment: 'Requires temperature monitoring during transit'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'insurance_value',
      type: 'decimal',
      precision: 15,
      scale: 2,
      isNullable: true,
      comment: 'Insurance value of the cargo'
    }));

    // Add route requirements
    await queryRunner.addColumn('loads', new TableColumn({
      name: 'requires_low_clearance_route',
      type: 'boolean',
      default: false,
      comment: 'Requires low clearance route planning'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'max_clearance_height',
      type: 'decimal',
      precision: 5,
      scale: 2,
      isNullable: true,
      comment: 'Maximum clearance height in meters'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'requires_escort_vehicle',
      type: 'boolean',
      default: false,
      comment: 'Requires escort vehicle'
    }));

    // Add special handling instructions
    await queryRunner.addColumn('loads', new TableColumn({
      name: 'special_handling_instructions',
      type: 'text',
      isNullable: true,
      comment: 'Special handling instructions'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'loading_instructions',
      type: 'text',
      isNullable: true,
      comment: 'Specific loading instructions'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'unloading_instructions',
      type: 'text',
      isNullable: true,
      comment: 'Specific unloading instructions'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'emergency_contact_info',
      type: 'text',
      isNullable: true,
      comment: 'Emergency contact information'
    }));

    // Add advanced matching criteria as JSONB
    await queryRunner.addColumn('loads', new TableColumn({
      name: 'truck_requirements',
      type: 'jsonb',
      default: '{}',
      comment: 'Specific truck requirements for matching'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'carrier_preferences',
      type: 'jsonb',
      default: '{}',
      comment: 'Carrier preferences for matching'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'cost_preferences',
      type: 'jsonb',
      default: '{}',
      comment: 'Cost and payment preferences'
    }));

    // Add quality requirements
    await queryRunner.addColumn('loads', new TableColumn({
      name: 'requires_pre_shipment_inspection',
      type: 'boolean',
      default: false,
      comment: 'Requires pre-shipment inspection'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'requires_delivery_inspection',
      type: 'boolean',
      default: false,
      comment: 'Requires delivery inspection'
    }));

    await queryRunner.addColumn('loads', new TableColumn({
      name: 'requires_photographic_documentation',
      type: 'boolean',
      default: false,
      comment: 'Requires photographic documentation'
    }));

    // Create indexes for better query performance
    await queryRunner.createIndex('loads', 'idx_loads_urgency_level');
    await queryRunner.createIndex('loads', 'idx_loads_time_critical');
    await queryRunner.createIndex('loads', 'idx_loads_hazmat');
    await queryRunner.createIndex('loads', 'idx_loads_temperature');
    await queryRunner.createIndex('loads', 'idx_loads_dimensions');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all added columns
    const columns = [
      'length', 'width', 'height', 'stackable_height', 'is_stackable',
      'temperature_min', 'temperature_max', 'requires_humidity_control',
      'requires_forklift', 'requires_crane', 'requires_loading_dock',
      'loading_time_estimate', 'unloading_time_estimate',
      'hazmat_class', 'hazmat_number',
      'urgency_level', 'is_time_critical', 'max_transit_time',
      'packaging_type', 'number_of_pieces', 'number_of_pallets',
      'requires_gps_monitoring', 'requires_temperature_monitoring', 'insurance_value',
      'requires_low_clearance_route', 'max_clearance_height', 'requires_escort_vehicle',
      'special_handling_instructions', 'loading_instructions', 'unloading_instructions',
      'emergency_contact_info',
      'truck_requirements', 'carrier_preferences', 'cost_preferences',
      'requires_pre_shipment_inspection', 'requires_delivery_inspection',
      'requires_photographic_documentation'
    ];

    for (const column of columns) {
      await queryRunner.dropColumn('loads', column);
    }

    // Drop indexes
    await queryRunner.dropIndex('loads', 'idx_loads_urgency_level');
    await queryRunner.dropIndex('loads', 'idx_loads_time_critical');
    await queryRunner.dropIndex('loads', 'idx_loads_hazmat');
    await queryRunner.dropIndex('loads', 'idx_loads_temperature');
    await queryRunner.dropIndex('loads', 'idx_loads_dimensions');
  }
}
```

## Updated Load Entity

### Enhanced Load Entity: `backend/src/entities/load.entity.ts`

```typescript
// Add these enums at the top
export enum UrgencyLevel {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Add these fields to the Load entity class
export class Load {
  // ... existing fields ...

  // Dimensional specifications
  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  length?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  width?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  height?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  stackableHeight?: number;

  @Column({ default: false })
  isStackable: boolean;

  // Temperature requirements
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  temperatureMin?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  temperatureMax?: number;

  @Column({ default: false })
  requiresHumidityControl: boolean;

  // Loading/unloading requirements
  @Column({ default: false })
  requiresForklift: boolean;

  @Column({ default: false })
  requiresCrane: boolean;

  @Column({ default: false })
  requiresLoadingDock: boolean;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  loadingTimeEstimate?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  unloadingTimeEstimate?: number;

  // Hazmat details
  @Column({ length: 50, nullable: true })
  hazmatClass?: string;

  @Column({ length: 20, nullable: true })
  hazmatNumber?: string;

  // Urgency and time sensitivity
  @Column({
    type: 'enum',
    enum: UrgencyLevel,
    default: UrgencyLevel.NORMAL,
  })
  urgencyLevel: UrgencyLevel;

  @Column({ default: false })
  isTimeCritical: boolean;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  maxTransitTime?: number;

  // Packaging details
  @Column({ length: 50, nullable: true })
  packagingType?: string;

  @Column({ default: 0 })
  numberOfPieces: number;

  @Column({ default: 0 })
  numberOfPallets: number;

  // Security requirements
  @Column({ default: false })
  requiresGpsMonitoring: boolean;

  @Column({ default: false })
  requiresTemperatureMonitoring: boolean;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  insuranceValue?: number;

  // Route requirements
  @Column({ default: false })
  requiresLowClearanceRoute: boolean;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  maxClearanceHeight?: number;

  @Column({ default: false })
  requiresEscortVehicle: boolean;

  // Special handling instructions
  @Column('text', { nullable: true })
  specialHandlingInstructions?: string;

  @Column('text', { nullable: true })
  loadingInstructions?: string;

  @Column('text', { nullable: true })
  unloadingInstructions?: string;

  @Column('text', { nullable: true })
  emergencyContactInfo?: string;

  // Advanced matching criteria
  @Column('jsonb', { default: {} })
  truckRequirements: {
    minCapacityWeight?: number;
    minCapacityVolume?: number;
    requiredTruckTypes?: string[];
    requiredFeatures?: string[];
    maxTruckAge?: number;
    minDriverExperience?: number;
    requiredCertifications?: string[];
    minInsuranceCoverage?: number;
  };

  @Column('jsonb', { default: {} })
  carrierPreferences: {
    preferredCarriers?: string[];
    excludedCarriers?: string[];
    minCarrierRating?: number;
    maxDistance?: number;
    maxHoursToAvailability?: number;
  };

  @Column('jsonb', { default: {} })
  costPreferences: {
    maxBudget?: number;
    preferredPaymentTerms?: string;
    requiresInsurance?: boolean;
    requiresTracking?: boolean;
  };

  // Quality requirements
  @Column({ default: false })
  requiresPreShipmentInspection: boolean;

  @Column({ default: false })
  requiresDeliveryInspection: boolean;

  @Column({ default: false })
  requiresPhotographicDocumentation: boolean;

  // ... existing fields continue ...
}
```

## Updated DTO for Enhanced Cargo Creation

### Enhanced Create Load DTO: `backend/src/modules/loads/dto/create-load.dto.ts`

```typescript
import { IsString, IsNumber, IsEnum, IsUUID, IsDateString, IsBoolean, IsOptional, Min, Max, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { CargoType, LoadStatus, UrgencyLevel } from '../../../entities/load.entity';

// ... existing LocationDto class ...

export class TruckRequirementsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  minCapacityWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minCapacityVolume?: number;

  @IsOptional()
  @IsString({ each: true })
  requiredTruckTypes?: string[];

  @IsOptional()
  @IsString({ each: true })
  requiredFeatures?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  maxTruckAge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minDriverExperience?: number;

  @IsOptional()
  @IsString({ each: true })
  requiredCertifications?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  minInsuranceCoverage?: number;
}

export class CarrierPreferencesDto {
  @IsOptional()
  @IsString({ each: true })
  preferredCarriers?: string[];

  @IsOptional()
  @IsString({ each: true })
  excludedCarriers?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minCarrierRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDistance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxHoursToAvailability?: number;
}

export class CostPreferencesDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxBudget?: number;

  @IsOptional()
  @IsString()
  preferredPaymentTerms?: string;

  @IsOptional()
  @IsBoolean()
  requiresInsurance?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresTracking?: boolean;
}

export class CreateLoadDto {
  // ... existing fields ...

  // Dimensional specifications
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(50)
  length?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(20)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  stackableHeight?: number;

  @IsOptional()
  @IsBoolean()
  isStackable?: boolean;

  // Temperature requirements
  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(100)
  temperatureMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(100)
  temperatureMax?: number;

  @IsOptional()
  @IsBoolean()
  requiresHumidityControl?: boolean;

  // Loading/unloading requirements
  @IsOptional()
  @IsBoolean()
  requiresForklift?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresCrane?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresLoadingDock?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(24)
  loadingTimeEstimate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(24)
  unloadingTimeEstimate?: number;

  // Hazmat details
  @IsOptional()
  @IsString()
  @MaxLength(50)
  hazmatClass?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  hazmatNumber?: string;

  // Urgency and time sensitivity
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgencyLevel?: UrgencyLevel;

  @IsOptional()
  @IsBoolean()
  isTimeCritical?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  maxTransitTime?: number;

  // Packaging details
  @IsOptional()
  @IsString()
  @MaxLength(50)
  packagingType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  numberOfPieces?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  numberOfPallets?: number;

  // Security requirements
  @IsOptional()
  @IsBoolean()
  requiresGpsMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresTemperatureMonitoring?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  insuranceValue?: number;

  // Route requirements
  @IsOptional()
  @IsBoolean()
  requiresLowClearanceRoute?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  maxClearanceHeight?: number;

  @IsOptional()
  @IsBoolean()
  requiresEscortVehicle?: boolean;

  // Special handling instructions
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  specialHandlingInstructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  loadingInstructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  unloadingInstructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  emergencyContactInfo?: string;

  // Advanced matching criteria
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TruckRequirementsDto)
  truckRequirements?: TruckRequirementsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CarrierPreferencesDto)
  carrierPreferences?: CarrierPreferencesDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CostPreferencesDto)
  costPreferences?: CostPreferencesDto;

  // Quality requirements
  @IsOptional()
  @IsBoolean()
  requiresPreShipmentInspection?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresDeliveryInspection?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresPhotographicDocumentation?: boolean;

  // ... existing fields continue ...
}
```

## Enhanced Matching Service

### Updated Matching Service: `backend/src/modules/matching/matching.service.ts`

```typescript
// Add this method to the MatchingService class
private async calculateEnhancedMatchScore(truck: Truck, load: Load): Promise<number> {
  let totalScore = 0;
  let totalWeight = 0;

  // Dimensional compatibility (25% weight)
  const dimensionalScore = this.calculateDimensionalCompatibility(truck, load);
  totalScore += dimensionalScore * 0.25;
  totalWeight += 0.25;

  // Capacity utilization (20% weight)
  const capacityScore = this.calculateCapacityUtilization(truck, load);
  totalScore += capacityScore * 0.20;
  totalWeight += 0.20;

  // Equipment compatibility (20% weight)
  const equipmentScore = this.calculateEquipmentCompatibility(truck, load);
  totalScore += equipmentScore * 0.20;
  totalWeight += 0.20;

  // Temperature control (10% weight)
  const temperatureScore = this.calculateTemperatureCompatibility(truck, load);
  totalScore += temperatureScore * 0.10;
  totalWeight += 0.10;

  // Security requirements (10% weight)
  const securityScore = this.calculateSecurityCompatibility(truck, load);
  totalScore += securityScore * 0.10;
  totalWeight += 0.10;

  // Route compatibility (10% weight)
  const routeScore = this.calculateRouteCompatibility(truck, load);
  totalScore += routeScore * 0.10;
  totalWeight += 0.10;

  // Time sensitivity (5% weight)
  const timeScore = this.calculateTimeCompatibility(truck, load);
  totalScore += timeScore * 0.05;
  totalWeight += 0.05;

  return totalScore / totalWeight;
}

private calculateDimensionalCompatibility(truck: Truck, load: Load): number {
  if (!load.length || !load.width || !load.height) return 0.5; // Default score if dimensions not provided

  // Check if cargo fits in truck dimensions
  const fitsLength = truck.maxLength && load.length <= truck.maxLength;
  const fitsWidth = truck.maxWidth && load.width <= truck.maxWidth;
  const fitsHeight = truck.maxHeight && load.height <= truck.maxHeight;

  if (fitsLength && fitsWidth && fitsHeight) {
    // Calculate utilization efficiency
    const lengthUtilization = load.length / truck.maxLength;
    const widthUtilization = load.width / truck.maxWidth;
    const heightUtilization = load.height / truck.maxHeight;
    
    const avgUtilization = (lengthUtilization + widthUtilization + heightUtilization) / 3;
    
    // Optimal utilization is around 80-90%
    if (avgUtilization >= 0.8 && avgUtilization <= 0.9) return 1.0;
    if (avgUtilization >= 0.7 && avgUtilization <= 0.95) return 0.9;
    if (avgUtilization >= 0.6 && avgUtilization <= 1.0) return 0.8;
    return 0.6;
  }

  return 0; // No compatibility
}

private calculateEquipmentCompatibility(truck: Truck, load: Load): number {
  let score = 1.0;

  // Check refrigeration requirement
  if (load.requiresRefrigeration && !truck.hasRefrigeration) {
    score = 0; // Deal breaker
  }

  // Check hazmat requirement
  if (load.isHazardous && !truck.hasHazmatPermit) {
    score = 0; // Deal breaker
  }

  // Check loading equipment requirements
  if (load.requiresForklift && !truck.hasLiftGate) {
    score *= 0.8; // Partial penalty
  }

  if (load.requiresCrane && !truck.hasWinch) {
    score *= 0.7; // Partial penalty
  }

  // Check specialized equipment
  if (load.requiresLoadingDock && !truck.hasTailLift) {
    score *= 0.9; // Minor penalty
  }

  return score;
}

private calculateTemperatureCompatibility(truck: Truck, load: Load): number {
  if (!load.temperatureMin && !load.temperatureMax) return 1.0; // No temperature requirements

  if (!truck.hasRefrigeration) return 0; // No temperature control

  // For refrigerated cargo, check if truck can maintain required temperature
  // This would require additional truck temperature range data
  return 0.8; // Default score for refrigerated trucks
}

private calculateSecurityCompatibility(truck: Truck, load: Load): number {
  let score = 1.0;

  // GPS monitoring requirement
  if (load.requiresGpsMonitoring && !truck.hasGps) {
    score *= 0.5; // Significant penalty
  }

  // Temperature monitoring requirement
  if (load.requiresTemperatureMonitoring && !truck.hasRefrigeration) {
    score *= 0.6; // Significant penalty
  }

  // Insurance coverage requirement
  if (load.insuranceValue && load.insuranceValue > 100000) {
    // Check if truck has adequate insurance coverage
    // This would require truck insurance data
    score *= 0.9; // Minor penalty for high-value cargo
  }

  return score;
}

private calculateRouteCompatibility(truck: Truck, load: Load): number {
  let score = 1.0;

  // Low clearance requirement
  if (load.requiresLowClearanceRoute && load.maxClearanceHeight) {
    if (truck.maxHeight && truck.maxHeight > load.maxClearanceHeight) {
      score = 0; // Deal breaker
    }
  }

  // Escort vehicle requirement
  if (load.requiresEscortVehicle) {
    score *= 0.9; // Minor penalty for complexity
  }

  return score;
}

private calculateTimeCompatibility(truck: Truck, load: Load): number {
  if (!load.isTimeCritical) return 1.0;

  // Check truck availability and current location
  // This would require real-time availability data
  return 0.9; // Default score for time-critical cargo
}
```

## Implementation Steps

1. **Run the migration** to add all new fields to the loads table
2. **Update the Load entity** with all new fields and types
3. **Update the CreateLoadDto** with validation for all new fields
4. **Enhance the matching service** with the new scoring algorithms
5. **Update the frontend forms** to capture the new cargo details
6. **Test the enhanced matching** with various cargo types

This implementation will significantly improve the accuracy of truck-cargo matching by considering all the critical factors that logistics professionals use in real-world operations. 